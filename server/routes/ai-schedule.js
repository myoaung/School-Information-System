const { sendError } = require('../utils/errorHandler');
/**
 * AI Schedule Routes
 * Phase 5 — Constraint-based timetable generation and optimization
 */

const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  collectConstraints,
  detectConflicts,
  generateSchedule,
  generateScheduleSuggestions,
  applySchedule,
  clearSchedule,
  getDayName,
} = require('../ai-scheduler');

const router = express.Router();

// GET /api/ai/schedule/constraints — Get all scheduling constraints
router.get('/constraints', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const constraints = collectConstraints();
    res.json({ constraints });
  } catch (err) {
    console.error('Constraints error:', err);
    res.status(500).json({ error: 'Failed to collect constraints' });
  }
});

// GET /api/ai/schedule/conflicts — Detect scheduling conflicts
router.get('/conflicts', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const conflicts = detectConflicts();
    res.json({
      conflicts,
      total: conflicts.length,
      high: conflicts.filter(c => c.severity === 'high').length,
      medium: conflicts.filter(c => c.severity === 'medium').length,
    });
  } catch (err) {
    console.error('Conflicts error:', err);
    res.status(500).json({ error: 'Failed to detect conflicts' });
  }
});

// POST /api/ai/schedule/generate — Generate optimal schedule for a class
router.post('/generate', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { class_id, respect_existing = true, preferred_days = [0, 1, 2, 3, 4] } = req.body;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const result = generateSchedule(class_id, {
      respectExisting: respect_existing,
      preferredDays: preferred_days,
    });

    if (result.error) {
      return res.status(404).json({ error: result.error });
    }

    res.json({
      schedule: result,
      message: `Generated ${result.new_periods} new periods for ${result.class.name}`,
    });
  } catch (err) {
    console.error('Schedule generation error:', err);
    res.status(500).json({ error: 'Failed to generate schedule' });
  }
});

// POST /api/ai/schedule/apply — Apply generated schedule to database
router.post('/apply', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { class_id, entries, clear_existing = false } = req.body;

    if (!class_id || !entries || !Array.isArray(entries)) {
      return res.status(400).json({ error: 'class_id and entries array are required' });
    }

    // Clear existing entries if requested
    if (clear_existing) {
      clearSchedule(class_id);
    }

    // Apply new entries
    const ids = applySchedule(entries);

    res.json({
      message: `Applied ${ids.length} timetable entries`,
      ids,
    });
  } catch (err) {
    console.error('Apply schedule error:', err);
    res.status(500).json({ error: 'Failed to apply schedule' });
  }
});

// GET /api/ai/schedule/suggestions/:classId — AI suggestions for improvement
router.get('/suggestions/:classId', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const suggestions = await generateScheduleSuggestions(classId);
    res.json({ suggestions });
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

// GET /api/ai/schedule/analyze/:classId — Analyze schedule quality
router.get('/analyze/:classId', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { db } = require('../data');
    const classId = parseInt(req.params.classId);

    const entries = await db.all(`
      SELECT t.*, s.name as subject_name, s.code as subject_code,
             u.name as teacher_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.teacher_id = u.id
      WHERE t.class_id = ?
      ORDER BY t.day_of_week, t.start_time
    `, [classId]);

    if (entries.length === 0) {
      return res.json({
        analysis: {
          totalPeriods: 0,
          daysUsed: 0,
          subjectsCovered: 0,
          balanceScore: 0,
          gaps: 0,
          message: 'No timetable entries found',
        },
      });
    }

    // Analyze distribution
    const dayCounts = {};
    const subjectCounts = {};
    const teacherCounts = {};

    entries.forEach(e => {
      dayCounts[e.day_of_week] = (dayCounts[e.day_of_week] || 0) + 1;
      subjectCounts[e.subject_name] = (subjectCounts[e.subject_name] || 0) + 1;
      teacherCounts[e.teacher_name] = (teacherCounts[e.teacher_name] || 0) + 1;
    });

    const daysUsed = Object.keys(dayCounts).length;
    const subjectsCovered = Object.keys(subjectCounts).length;

    // Calculate balance score (0-100)
    const counts = Object.values(dayCounts);
    const avgPerDay = counts.reduce((s, c) => s + c, 0) / counts.length;
    const variance = counts.reduce((s, c) => s + (c - avgPerDay) ** 2, 0) / counts.length;
    const balanceScore = Math.max(0, Math.round(100 - variance * 10));

    // Count gaps (free periods between lessons on same day)
    let gaps = 0;
    const dayNumbers = [...new Set(entries.map(e => e.day_of_week))];
    for (const day of dayNumbers) {
      const dayEntries = entries
        .filter(e => e.day_of_week === day)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));

      for (let i = 0; i < dayEntries.length - 1; i++) {
        if (dayEntries[i].end_time < dayEntries[i + 1].start_time) {
          gaps++;
        }
      }
    }

    // Subject distribution
    const subjectDistribution = Object.entries(subjectCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round(count / entries.length * 100) }))
      .sort((a, b) => b.count - a.count);

    // Teacher workload
    const teacherWorkload = Object.entries(teacherCounts)
      .map(([name, count]) => ({ name, count, percentage: Math.round(count / entries.length * 100) }))
      .sort((a, b) => b.count - a.count);

    res.json({
      analysis: {
        totalPeriods: entries.length,
        daysUsed,
        subjectsCovered,
        balanceScore,
        gaps,
        dayDistribution: Object.entries(dayCounts).map(([day, count]) => ({
          day: getDayName(parseInt(day)),
          count,
        })),
        subjectDistribution,
        teacherWorkload,
      },
    });
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Failed to analyze schedule' });
  }
});

module.exports = router;
