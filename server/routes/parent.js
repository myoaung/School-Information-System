const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// Get parent's linked children
router.get('/children', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    const children = await db.all(`
      SELECT u.id, u.name, u.email, s.student_id, s.grade_id, s.section, s.status,
             g.name as grade_name
      FROM parent_students ps
      JOIN users u ON u.id = ps.student_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN grades g ON g.id = s.grade_id
      WHERE ps.parent_id = ?
    `, [req.user.id]);
    res.json(children);
  } catch (err) {
    sendError(res, err);
  }
});

// Get child's grades
router.get('/child/:id/grades', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    // Verify parent-child link
    const link = await db.get('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, req.params.id]);
    if (!link) return res.status(403).json({ error: 'Not linked to this student' });

    const grades = await db.all(`
      SELECT gb.*, c.title as course_title, s.name as subject_name
      FROM gradebook gb
      JOIN courses c ON c.id = gb.course_id
      JOIN subjects s ON s.id = c.subject_id
      WHERE gb.student_id = ?
    `, [req.params.id]);
    res.json(grades);
  } catch (err) {
    sendError(res, err);
  }
});

// Get child's attendance
router.get('/child/:id/attendance', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    const link = await db.get('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, req.params.id]);
    if (!link) return res.status(403).json({ error: 'Not linked to this student' });

    const { class_id, limit } = req.query;
    let sql = `
      SELECT a.*, c.name as class_name
      FROM attendance a
      JOIN classes c ON c.id = a.class_id
      WHERE a.user_id = ?
    `;
    const params = [req.params.id];
    if (class_id) { sql += ' AND a.class_id = ?'; params.push(class_id); }
    sql += ' ORDER BY a.date DESC';
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }

    const records = await db.all(sql, params);

    // Summary
    const summary = await db.all(`
      SELECT status, COUNT(*) as count
      FROM attendance WHERE user_id = ?
      GROUP BY status
    `, [req.params.id]);

    res.json({ records, summary });
  } catch (err) {
    sendError(res, err);
  }
});

// Get child's timetable
router.get('/child/:id/timetable', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    const link = await db.get('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, req.params.id]);
    if (!link) return res.status(403).json({ error: 'Not linked to this student' });

    // Get student's enrolled classes
    const enrollments = await db.all('SELECT class_id FROM enrollments WHERE student_id = ?', [req.params.id]);
    if (!enrollments.length) return res.json([]);

    const classIds = enrollments.map(e => e.class_id);
    const placeholders = classIds.map(() => '?').join(',');

    const timetable = await db.all(`
      SELECT t.*, s.name as subject_name, u.name as teacher_name, c.name as class_name
      FROM timetable t
      JOIN subjects s ON s.id = t.subject_id
      JOIN classes c ON c.id = t.class_id
      LEFT JOIN users u ON u.id = t.teacher_id
      WHERE t.class_id IN (${placeholders})
      ORDER BY t.day_of_week, t.start_time
    `, classIds);

    res.json(timetable);
  } catch (err) {
    sendError(res, err);
  }
});

// Get child's assignments
router.get('/child/:id/assignments', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    const link = await db.get('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, req.params.id]);
    if (!link) return res.status(403).json({ error: 'Not linked to this student' });

    const enrollments = await db.all('SELECT class_id FROM enrollments WHERE student_id = ?', [req.params.id]);
    if (!enrollments.length) return res.json([]);

    const classIds = enrollments.map(e => e.class_id);
    const placeholders = classIds.map(() => '?').join(',');

    const assignments = await db.all(`
      SELECT a.*, c.title as course_title, sub.status as submission_status, sub.score
      FROM assignments a
      JOIN courses c ON c.id = a.course_id
      LEFT JOIN submissions sub ON sub.assignment_id = a.id AND sub.student_id = ?
      WHERE c.class_id IN (${placeholders})
      ORDER BY a.due_date DESC
    `, [req.params.id, ...classIds]);

    res.json(assignments);
  } catch (err) {
    sendError(res, err);
  }
});

// Get child's announcements
router.get('/child/:id/announcements', authMiddleware, roleMiddleware('parent'), async (req, res) => {
  try {
    const link = await db.get('SELECT 1 FROM parent_students WHERE parent_id = ? AND student_id = ?', [req.user.id, req.params.id]);
    if (!link) return res.status(403).json({ error: 'Not linked to this student' });

    const announcements = await db.all(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON u.id = a.author_id
      ORDER BY a.created_at DESC
      LIMIT 20
    `);
    res.json(announcements);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
