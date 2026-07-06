const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { assignmentRules } = require('../middleware/validate');

const router = express.Router();

// Get all assignments (optionally by course)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { course_id } = req.query;
    let where = '';
    let params = [];
    if (course_id) { where = 'WHERE a.course_id = ?'; params.push(course_id); }
    const assignments = await db.all(`
      SELECT a.*, c.title as course_title, u.name as created_by_name
      FROM assignments a
      LEFT JOIN courses c ON a.course_id = c.id
      LEFT JOIN users u ON a.created_by = u.id
      ${where} ORDER BY a.due_date DESC
    `, params);
    res.json({ assignments });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Get single assignment with submissions
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const assignment = await db.get(`
      SELECT a.*, c.title as course_title FROM assignments a LEFT JOIN courses c ON a.course_id = c.id WHERE a.id = ?
    `, [req.params.id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    let submissions = [];
    if (req.user.role === 'admin' || req.user.role === 'teacher') {
      submissions = await db.all(`
        SELECT s.*, u.name as student_name FROM submissions s JOIN users u ON s.student_id = u.id WHERE s.assignment_id = ? ORDER BY s.submitted_at DESC
      `, [req.params.id]);
    } else {
      submissions = await db.all(`
        SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?
      `, [req.params.id, req.user.id]);
    }
    res.json({ assignment: { ...assignment, submissions } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// Create assignment (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), assignmentRules, async (req, res) => {
  try {
    const { course_id, title, description, due_date, max_score, allow_late } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const result = await db.run('INSERT INTO assignments (course_id, title, description, due_date, max_score, allow_late, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)', [course_id, title, description || null, due_date || null, max_score || 100, allow_late ? 1 : 0, req.user.id]);
    res.status(201).json({ message: 'Assignment created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Submit assignment (student)
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const assignment = await db.get('SELECT * FROM assignments WHERE id = ?', [req.params.id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    const existing = await db.get('SELECT * FROM submissions WHERE assignment_id = ? AND student_id = ?', [req.params.id, req.user.id]);
    if (existing) return res.status(409).json({ error: 'Already submitted' });

    const now = new Date();
    const isLate = assignment.due_date && now > new Date(assignment.due_date + 'T23:59:59');
    const status = isLate && !assignment.allow_late ? 'late' : 'submitted';

    await db.run('INSERT INTO submissions (assignment_id, student_id, content, status) VALUES (?, ?, ?, ?)', [req.params.id, req.user.id, content || '', status]);
    res.status(201).json({ message: 'Assignment submitted', status });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit assignment' });
  }
});

// Grade submission (admin/teacher)
router.post('/submissions/:id/grade', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { score, feedback } = req.body;
    const submission = await db.get('SELECT * FROM submissions WHERE id = ?', [req.params.id]);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });

    await db.run('UPDATE submissions SET score = ?, feedback = ?, status = ?, graded_at = CURRENT_TIMESTAMP, graded_by = ? WHERE id = ?', [score, feedback || null, 'graded', req.user.id, req.params.id]);
    res.json({ message: 'Submission graded' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to grade submission' });
  }
});

module.exports = router;
