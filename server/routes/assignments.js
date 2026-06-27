const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all assignments (optionally by course)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { course_id } = req.query;
    let where = '';
    let params = [];
    if (course_id) { where = 'WHERE a.course_id = ?'; params.push(course_id); }
    const assignments = db.prepare(`
      SELECT a.*, c.title as course_title, u.name as created_by_name
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      ${where} ORDER BY a.due_date DESC
    `).all(...params);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment with submissions
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const assignment = db.prepare(`
      SELECT a.*, c.title as course_title FROM assignments a LEFT JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `).get(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    let submissions = [];
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      submissions = db.prepare(`
        SELECT s.*, u.name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC
      `).all(req.params.id);
    } else {
      submissions = db.prepare(`
        SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?
      `).all(req.params.id, req.user.id);
    }
    res.json({ assignment: { ...assignment, submissions } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { course_id, title, description, due_date, max_score, allow_late } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const result = db.prepare('INSERT INTO assignments (course_id, title, description, due_date, max_score, allow_late, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(course_id, title, description || null, due_date || null, max_score || 100, allow_late ? 1 : 0, req.user.id);
    res.status(201).json({ message: 'Assignment created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Submit assignment (student)
router.post('/:id/submit', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { content } = req.body;
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(req.params.id);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const existing = db.prepare('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?').get(req.params.id, req.user.id);
    if (existing) return res.status(409).json({ error: 'Already submitted' });

    const now = new Date();
    const isLate = assignment.due_date && now > new Date(assignment.due_date + 'T23:59:59');
    const status = isLate && !assignment.allow_late ? 'late' : 'submitted';

    db.prepare('INSERT INTO submissions (assignment_id, student_id, content, status) VALUES (?, ?, ?, ?)').run(req.params.id, req.user.id, content || '', status);
    res.status(201).json({ message: 'Assignment submitted', status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Grade submission (admin/teacher)
router.post('/submissions/:id/grade', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { score, feedback } = req.body;
    const submission = db.prepare('SELECT * FROM submissions WHERE id = ?').get(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    db.prepare('UPDATE submissions SET score = ?, feedback = ?, status = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ? WHERE id = ?').run(score, feedback || null, 'graded', req.user.id, req.params.id);
    res.json({ message: 'Submission graded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;
