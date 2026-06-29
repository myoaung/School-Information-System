const { sendError } = require('../utils/errorHandler');
const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { markAttendanceRules } = require('../middleware/validate');

const router = express.Router();

// Get attendance for a class on a date (admin/teacher)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { class_id, date } = req.query;

    if (!class_id || !date) {
      return res.status(400).json({ error: 'class_id and date are required' });
    }

    // Get students in the class
    const students = db.prepare(`
      SELECT u.id, u.name, s.student_id
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN students s ON s.user_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.name
    `).all(class_id);

    // Get attendance records for this date
    const records = db.prepare(`
      SELECT user_id, status, note FROM attendance
      WHERE class_id = ? AND date = ?
    `).all(class_id, date);

    const recordMap = {};
    records.forEach(r => { recordMap[r.user_id] = r; });

    const attendance = students.map(s => ({
      user_id: s.id,
      name: s.name,
      student_id: s.student_id,
      status: recordMap[s.id]?.status || null,
      note: recordMap[s.id]?.note || null,
    }));

    res.json({ attendance, date, class_id: parseInt(class_id) });
  } catch (err) {
    console.error('Error fetching attendance:', err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// Mark attendance for multiple students (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), markAttendanceRules, (req, res) => {
  try {
    const db = getDb();
    const { class_id, date, records } = req.body;

    if (!class_id || !date || !records || !Array.isArray(records)) {
      return res.status(400).json({ error: 'class_id, date, and records array are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO attendance (user_id, class_id, date, status, note, marked_by)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, class_id, date) DO UPDATE SET status = ?, note = ?, marked_by = ?
    `);

    const markAll = db.transaction((items) => {
      for (const r of items) {
        stmt.run(r.user_id, class_id, date, r.status, r.note || null, req.user.id, r.status, r.note || null, req.user.id);
      }
    });

    markAll(records);

    res.json({ message: 'Attendance marked', count: records.length });
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// Get attendance summary for a student
router.get('/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { user_id, class_id } = req.query;

    const targetUserId = user_id || req.user.id;

    // Students can only view their own
    if (req.user.role === 'student' && req.user.id !== parseInt(targetUserId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    let where = ['a.user_id = ?'];
    let params = [targetUserId];

    if (class_id) {
      where.push('a.class_id = ?');
      params.push(class_id);
    }

    const summary = db.prepare(`
      SELECT a.status, COUNT(*) as count
      FROM attendance a
      WHERE ${where.join(' AND ')}
      GROUP BY a.status
    `).all(...params);

    const recent = db.prepare(`
      SELECT a.date, a.status, c.name as class_name
      FROM attendance a
      JOIN classes c ON a.class_id = c.id
      WHERE ${where.join(' AND ')}
      ORDER BY a.date DESC
      LIMIT 10
    `).all(...params);

    res.json({ summary, recent });
  } catch (err) {
    console.error('Error fetching attendance summary:', err);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// ── Teacher Attendance ──

// Get teacher attendance for a date
router.get('/teacher', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const teachers = db.prepare(`
      SELECT u.id, u.name, t.teacher_id as teacher_code, t.specialization
      FROM users u
      JOIN teachers t ON t.user_id = u.id
      WHERE u.role = 'teacher'
      ORDER BY u.name
    `).all();

    const records = db.prepare('SELECT * FROM teacher_attendance WHERE date = ?').all(targetDate);
    const recordMap = {};
    records.forEach(r => { recordMap[r.teacher_id] = r; });

    const attendance = teachers.map(t => ({
      teacher_id: t.id,
      name: t.name,
      teacher_code: t.teacher_code,
      specialization: t.specialization,
      status: recordMap[t.id]?.status || null,
      check_in: recordMap[t.id]?.check_in || null,
      check_out: recordMap[t.id]?.check_out || null,
      note: recordMap[t.id]?.note || null
    }));

    res.json({ attendance, date: targetDate });
  } catch (err) {
    sendError(res, err);
  }
});

// Mark teacher attendance (check-in)
router.post('/teacher/check-in', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { teacher_id, status, note } = req.body;
    const targetId = teacher_id || req.user.id;

    // Teachers can only check themselves in
    if (req.user.role === 'teacher' && targetId !== req.user.id) {
      return res.status(403).json({ error: 'Can only check yourself in' });
    }

    const date = new Date().toISOString().split('T')[0];
    const checkIn = new Date().toTimeString().slice(0, 5);

    db.prepare(`
      INSERT INTO teacher_attendance (teacher_id, date, check_in, status, note)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(teacher_id, date) DO UPDATE SET check_in = ?, status = ?, note = ?
    `).run(targetId, date, checkIn, status || 'present', note || null, checkIn, status || 'present', note || null);

    res.json({ message: 'Checked in', check_in: checkIn });
  } catch (err) {
    sendError(res, err);
  }
});

// Teacher check-out
router.post('/teacher/check-out', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { teacher_id } = req.body;
    const targetId = teacher_id || req.user.id;

    if (req.user.role === 'teacher' && targetId !== req.user.id) {
      return res.status(403).json({ error: 'Can only check yourself out' });
    }

    const date = new Date().toISOString().split('T')[0];
    const checkOut = new Date().toTimeString().slice(0, 5);

    db.prepare('UPDATE teacher_attendance SET check_out = ? WHERE teacher_id = ? AND date = ?').run(checkOut, targetId, date);
    res.json({ message: 'Checked out', check_out: checkOut });
  } catch (err) {
    sendError(res, err);
  }
});

// Get teacher attendance summary
router.get('/teacher/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { teacher_id } = req.query;
    const targetId = teacher_id || req.user.id;

    if (req.user.role === 'teacher' && parseInt(targetId) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const summary = db.prepare(`
      SELECT status, COUNT(*) as count FROM teacher_attendance
      WHERE teacher_id = ? GROUP BY status
    `).all(targetId);

    const recent = db.prepare(`
      SELECT * FROM teacher_attendance WHERE teacher_id = ?
      ORDER BY date DESC LIMIT 10
    `).all(targetId);

    res.json({ summary, recent });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
