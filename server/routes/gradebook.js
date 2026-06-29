const { sendError } = require('../utils/errorHandler');
const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { gradeRules } = require('../middleware/validate');

const router = express.Router();

// Get grades (by course_id or student_id)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { course_id, student_id } = req.query;
    let where = [];
    let params = [];

    // Students can only view their own grades
    if (req.user.role === 'student') {
      where.push('g.student_id = ?');
      params.push(req.user.id);
    } else {
      if (student_id) { where.push('g.student_id = ?'); params.push(student_id); }
    }
    if (course_id) { where.push('g.course_id = ?'); params.push(course_id); }

    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const grades = db.prepare(`
      SELECT g.*, u.name as student_name, c.title as course_title, s.code as subject_code
      FROM gradebook g
      JOIN users u ON g.student_id = u.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      ${clause} ORDER BY u.name, c.title
    `).all(...params);
    res.json({ grades });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch grades' });
  }
});

// Set/update grade (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), gradeRules, (req, res) => {
  try {
    const db = getDb();
    const { student_id, course_id, assignment_score, quiz_score, exam_score, final_grade, gpa } = req.body;
    if (!student_id || !course_id) return res.status(400).json({ error: 'student_id and course_id required' });

    const existing = db.prepare('SELECT id FROM gradebook WHERE student_id = ? AND course_id = ?').get(student_id, course_id);
    if (existing) {
      db.prepare('UPDATE gradebook SET assignment_score = ?, quiz_score = ?, exam_score = ?, final_grade = ?, gpa = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(assignment_score || 0, quiz_score || 0, exam_score || 0, final_grade || null, gpa || null, existing.id);
      res.json({ message: 'Grade updated' });
    } else {
      const result = db.prepare('INSERT INTO gradebook (student_id, course_id, assignment_score, quiz_score, exam_score, final_grade, gpa) VALUES (?, ?, ?, ?, ?, ?, ?)').run(student_id, course_id, assignment_score || 0, quiz_score || 0, exam_score || 0, final_grade || null, gpa || null);
      res.status(201).json({ message: 'Grade created', id: result.lastInsertRowid });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to save grade' });
  }
});

// Get student's own grades across courses
router.get('/student/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    // Students can only view their own
    if (req.user.role === 'student' && req.user.id !== parseInt(req.params.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    const grades = db.prepare(`
      SELECT g.*, c.title as course_title, s.code as subject_code, s.name as subject_name
      FROM gradebook g
      JOIN courses c ON g.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      WHERE g.student_id = ?
      ORDER BY c.title
    `).all(req.params.id);
    res.json({ grades });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch student grades' });
  }
});

// Export grades as CSV (admin/teacher)
router.get('/export', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { course_id } = req.query;

    let sql = `
      SELECT u.name as student_name, s.student_id as student_code,
             c.title as course_title, sub.code as subject_code,
             g.assignment_score, g.quiz_score, g.exam_score, g.final_grade, g.gpa
      FROM gradebook g
      JOIN users u ON g.student_id = u.id
      JOIN courses c ON g.course_id = c.id
      JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN students s ON s.user_id = u.id
    `;
    const params = [];
    if (course_id) { sql += ' WHERE g.course_id = ?'; params.push(course_id); }
    sql += ' ORDER BY u.name, c.title';

    const grades = db.prepare(sql).all(...params);

    const header = 'Student Name,Student ID,Course,Subject,Assignment Score,Quiz Score,Exam Score,Final Grade,GPA\n';
    const rows = grades.map(g =>
      `"${g.student_name}","${g.student_code || ''}","${g.course_title}","${g.subject_code}",${g.assignment_score || 0},${g.quiz_score || 0},${g.exam_score || 0},"${g.final_grade || ''}",${g.gpa || ''}`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=grades.csv');
    res.send(header + rows);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
