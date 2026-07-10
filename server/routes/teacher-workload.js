const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// GET /api/teachers/workload -- all teachers overview (admin only)
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const workload = await db.all(`
      SELECT
        u.id, u.name, u.email,
        COUNT(t.id) as periods_per_week,
        COUNT(DISTINCT t.class_id) as classes_count,
        COUNT(DISTINCT t.subject_id) as subjects_count,
        COALESCE(SUM(
          (CAST(substr(t.end_time,1,2) AS INTEGER) * 60 + CAST(substr(t.end_time,4,2) AS INTEGER))
          - (CAST(substr(t.start_time,1,2) AS INTEGER) * 60 + CAST(substr(t.start_time,4,2) AS INTEGER))
        ), 0) as total_minutes
      FROM users u
      LEFT JOIN timetable t ON t.teacher_id = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id
      ORDER BY periods_per_week DESC
    `);

    // Add computed fields
    const enriched = workload.map((w) => ({
      ...w,
      total_hours: Math.round((w.total_minutes / 60) * 10) / 10,
      workload_level: w.total_minutes > 300 ? 'heavy' : w.total_minutes > 180 ? 'normal' : 'light',
    }));

    res.json({ teachers: enriched });
  } catch (err) {
    sendError(res, err, 'Failed to fetch teacher workload');
  }
});

// GET /api/teachers/workload/:id -- single teacher detail
router.get('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;

    // Get teacher info
    const teacher = await db.get('SELECT id, name, email FROM users WHERE id = ? AND role = ?', [
      id,
      'teacher',
    ]);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Get daily schedule breakdown
    const schedule = await db.all(
      `
      SELECT
        t.day_of_week,
        t.start_time,
        t.end_time,
        s.name as subject_name,
        c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      JOIN classes c ON t.class_id = c.id
      WHERE t.teacher_id = ?
      ORDER BY t.day_of_week, t.start_time
    `,
      [id]
    );

    // Group by day
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const byDay = {};
    days.forEach((d) => (byDay[d] = []));
    schedule.forEach((s) => {
      const dayName = days[s.day_of_week] || 'Unknown';
      byDay[dayName].push(s);
    });

    // Calculate totals
    const totalPeriods = schedule.length;
    const totalMinutes = schedule.reduce((sum, s) => {
      const start =
        parseInt(s.start_time?.split(':')[0]) * 60 + parseInt(s.start_time?.split(':')[1] || 0);
      const end =
        parseInt(s.end_time?.split(':')[0]) * 60 + parseInt(s.end_time?.split(':')[1] || 0);
      return sum + (end - start);
    }, 0);

    res.json({
      teacher,
      schedule: byDay,
      summary: {
        total_periods: totalPeriods,
        total_hours: Math.round((totalMinutes / 60) * 10) / 10,
        classes_count: new Set(schedule.map((s) => s.class_name)).size,
        subjects_count: new Set(schedule.map((s) => s.subject_name)).size,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch teacher workload');
  }
});

module.exports = router;
