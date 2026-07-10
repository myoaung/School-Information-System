const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { courseRules, lessonRules } = require('../middleware/validate');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// Get all courses
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { class_id, subject_id } = req.query;
    let where = [];
    let params = [];
    if (class_id) { where.push('c.class_id = ?'); params.push(class_id); }
    if (subject_id) { where.push('c.subject_id = ?'); params.push(subject_id); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const courses = await db.all(`
      SELECT c.*, cl.name as class_name, s.name as subject_name, s.code as subject_code
      FROM courses c
      JOIN classes cl ON c.class_id = cl.id
      JOIN subjects s ON c.subject_id = s.id
      ${clause} ORDER BY c.created_at DESC
    `, params);
    res.json({ courses });
  } catch (err) {
    sendError(res, err, 'Failed to fetch courses');
  }
});

// Get single course with lessons and resources
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const course = await db.get(`
      SELECT c.*, cl.name as class_name, s.name as subject_name
      FROM courses c JOIN classes cl ON c.class_id = cl.id JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = ?
    `, [req.params.id]);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const lessons = await db.all('SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order', [req.params.id]);
    const resources = await db.all('SELECT * FROM resources WHERE course_id = ? ORDER BY created_at DESC', [req.params.id]);
    const assignments = await db.all('SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date', [req.params.id]);
    const quizzes = await db.all('SELECT * FROM quizzes WHERE course_id = ? ORDER BY due_date', [req.params.id]);
    res.json({ course: { ...course, lessons, resources, assignments, quizzes } });
  } catch (err) {
    sendError(res, err, 'Failed to fetch course');
  }
});

// Create course (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), courseRules, async (req, res) => {
  try {
    const { class_id, subject_id, title, description } = req.body;
    if (!class_id || !subject_id || !title) return res.status(400).json({ error: 'class_id, subject_id, title required' });
    const result = await db.run('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)', [class_id, subject_id, title, description || null]);
    res.status(201).json({ message: 'Course created', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to create course');
  }
});

// Add lesson to course
router.post('/:id/lessons', authMiddleware, roleMiddleware('admin', 'teacher'), lessonRules, async (req, res) => {
  try {
    const { title, content, lesson_order, duration_minutes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const result = await db.run('INSERT INTO lessons (course_id, title, content, lesson_order, duration_minutes) VALUES (?, ?, ?, ?, ?)', [req.params.id, title, content || null, lesson_order || 0, duration_minutes || null]);
    res.status(201).json({ message: 'Lesson added', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to add lesson');
  }
});

// Add resource to course
router.post('/:id/resources', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { title, type, url, description } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'Title and type required' });
    const result = await db.run('INSERT INTO resources (course_id, title, type, url, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)', [req.params.id, title, type, url || null, description || null, req.user.id]);
    res.status(201).json({ message: 'Resource added', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to add resource');
  }
});

module.exports = router;
