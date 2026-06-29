const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { courseRules, lessonRules } = require('../middleware/validate');

const router = express.Router();

// Get all courses
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { class_id, subject_id } = req.query;
    let where = [];
    let params = [];
    if (class_id) { where.push('c.class_id = ?'); params.push(class_id); }
    if (subject_id) { where.push('c.subject_id = ?'); params.push(subject_id); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const courses = db.prepare(`
      SELECT c.*, cl.name as class_name, s.name as subject_name, s.code as subject_code
      FROM courses c
      JOIN classes cl ON c.class_id = cl.id
      JOIN subjects s ON c.subject_id = s.id
      ${clause} ORDER BY c.created_at DESC
    `).all(...params);
    res.json({ courses });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// Get single course with lessons and resources
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const course = db.prepare(`
      SELECT c.*, cl.name as class_name, s.name as subject_name
      FROM courses c JOIN classes cl ON c.class_id = cl.id JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = ?
    `).get(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY lesson_order').all(req.params.id);
    const resources = db.prepare('SELECT * FROM resources WHERE course_id = ? ORDER BY created_at DESC').all(req.params.id);
    const assignments = db.prepare('SELECT * FROM assignments WHERE course_id = ? ORDER BY due_date').all(req.params.id);
    const quizzes = db.prepare('SELECT * FROM quizzes WHERE course_id = ? ORDER BY due_date').all(req.params.id);
    res.json({ course: { ...course, lessons, resources, assignments, quizzes } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// Create course (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), courseRules, (req, res) => {
  try {
    const db = getDb();
    const { class_id, subject_id, title, description } = req.body;
    if (!class_id || !subject_id || !title) return res.status(400).json({ error: 'class_id, subject_id, title required' });
    const result = db.prepare('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)').run(class_id, subject_id, title, description || null);
    res.status(201).json({ message: 'Course created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// Add lesson to course
router.post('/:id/lessons', authMiddleware, roleMiddleware('admin', 'teacher'), lessonRules, (req, res) => {
  try {
    const db = getDb();
    const { title, content, lesson_order, duration_minutes } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const result = db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order, duration_minutes) VALUES (?, ?, ?, ?, ?)').run(req.params.id, title, content || null, lesson_order || 0, duration_minutes || null);
    res.status(201).json({ message: 'Lesson added', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add lesson' });
  }
});

// Add resource to course
router.post('/:id/resources', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { title, type, url, description } = req.body;
    if (!title || !type) return res.status(400).json({ error: 'Title and type required' });
    const result = db.prepare('INSERT INTO resources (course_id, title, type, url, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)').run(req.params.id, title, type, url || null, description || null, req.user.id);
    res.status(201).json({ message: 'Resource added', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add resource' });
  }
});

module.exports = router;
