const { sendError } = require('../utils/errorHandler');
/**
 * AI Analytics Routes
 * Phase 4 — At-risk detection, trend analysis, interventions
 */

const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const {
  calculateRiskScore,
  getAtRiskStudents,
  analyzeTrend,
  generateInterventions,
  checkAlerts,
  getAnalyticsStats,
} = require('../predictive-analytics');

const router = express.Router();

// GET /api/ai/analytics/stats — Dashboard overview
router.get('/stats', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const stats = getAnalyticsStats();
    res.json({ stats });
  } catch (err) {
    console.error('Analytics stats error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics stats' });
  }
});

// GET /api/ai/analytics/at-risk — List at-risk students
router.get('/at-risk', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const { classId, gradeId, minScore = 30, limit = 50 } = req.query;

    // Teachers can only see their own classes
    let filterClassId = classId;
    if (req.user.role === 'teacher' && !classId) {
      const { getDb } = require('../db');
      const db = getDb();
      const teacherClasses = db.prepare(
        'SELECT id FROM classes WHERE teacher_id = ?'
      ).all(req.user.id).map(c => c.id);

      if (teacherClasses.length > 0) {
        // Get students from all teacher's classes
        const studentIds = new Set();
        teacherClasses.forEach(cid => {
          const students = db.prepare(
            'SELECT student_id FROM enrollments WHERE class_id = ?'
          ).all(cid).forEach(s => studentIds.add(s.student_id));
        });

        const allAtRisk = getAtRiskStudents({
          minScore: parseInt(minScore),
          limit: parseInt(limit),
        });

        // Filter to teacher's students only
        const filtered = allAtRisk.filter(s => studentIds.has(s.userId));
        return res.json({ students: filtered, total: filtered.length });
      }
    }

    const students = getAtRiskStudents({
      classId: filterClassId ? parseInt(filterClassId) : undefined,
      gradeId: gradeId ? parseInt(gradeId) : undefined,
      minScore: parseInt(minScore),
      limit: parseInt(limit),
    });

    res.json({ students, total: students.length });
  } catch (err) {
    console.error('At-risk students error:', err);
    res.status(500).json({ error: 'Failed to fetch at-risk students' });
  }
});

// GET /api/ai/analytics/student/:id — Individual student risk assessment
router.get('/student/:id', authMiddleware, (req, res) => {
  try {
    const studentUserId = parseInt(req.params.id);

    // Students can only see their own risk
    if (req.user.role === 'student' && req.user.id !== studentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const risk = calculateRiskScore(studentUserId);
    const trend = analyzeTrend(studentUserId);

    res.json({ risk, trend });
  } catch (err) {
    console.error('Student risk error:', err);
    res.status(500).json({ error: 'Failed to assess student risk' });
  }
});

// GET /api/ai/analytics/student/:id/interventions — AI intervention suggestions
router.get('/student/:id/interventions', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const studentUserId = parseInt(req.params.id);

    const { getDb } = require('../db');
    const db = getDb();
    const student = db.prepare(`
      SELECT u.name FROM users u WHERE u.id = ?
    `).get(studentUserId);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const risk = calculateRiskScore(studentUserId);
    const studentData = {
      name: student.name,
      ...risk,
    };

    const interventions = await generateInterventions(studentData);

    res.json({ interventions, risk });
  } catch (err) {
    console.error('Interventions error:', err);
    res.status(500).json({ error: 'Failed to generate interventions' });
  }
});

// GET /api/ai/analytics/alerts — Check for new alerts
router.get('/alerts', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const alerts = checkAlerts();
    res.json({ alerts, count: alerts.length });
  } catch (err) {
    console.error('Alerts error:', err);
    res.status(500).json({ error: 'Failed to check alerts' });
  }
});

// GET /api/ai/analytics/trend/:id — Trend analysis for a student
router.get('/trend/:id', authMiddleware, (req, res) => {
  try {
    const studentUserId = parseInt(req.params.id);

    if (req.user.role === 'student' && req.user.id !== studentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const trend = analyzeTrend(studentUserId);
    res.json({ trend });
  } catch (err) {
    console.error('Trend error:', err);
    res.status(500).json({ error: 'Failed to analyze trend' });
  }
});

module.exports = router;
