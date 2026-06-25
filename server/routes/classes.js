const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all classes (public)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const classes = db.prepare(`
      SELECT c.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `).all();

    res.json({ classes });
  } catch (err) {
    console.error('Error fetching classes:', err);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Get single class with enrollments
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const classData = db.prepare(`
      SELECT c.*, u.name as teacher_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `).get(req.params.id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get enrolled students
    const students = db.prepare(`
      SELECT u.id, u.name, u.email
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.name
    `).all(req.params.id);

    res.json({ class: { ...classData, students } });
  } catch (err) {
    console.error('Error fetching class:', err);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// Create class (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { name, description, teacher_id, schedule, room } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description || null, teacher_id || null, schedule || null, room || null);

    const classData = db.prepare('SELECT * FROM classes WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Class created', class: classData });
  } catch (err) {
    console.error('Error creating class:', err);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// Update class (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { name, description, teacher_id, schedule, room } = req.body;
    const db = getDb();

    const existing = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    db.prepare(
      'UPDATE classes SET name = ?, description = ?, teacher_id = ?, schedule = ?, room = ? WHERE id = ?'
    ).run(name, description || null, teacher_id || null, schedule || null, room || null, req.params.id);

    const classData = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);

    res.json({ message: 'Class updated', class: classData });
  } catch (err) {
    console.error('Error updating class:', err);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

// Enroll student (admin or teacher)
router.post('/:id/enroll', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const { student_id } = req.body;
    const db = getDb();

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const classData = db.prepare('SELECT * FROM classes WHERE id = ?').get(req.params.id);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const student = db.prepare('SELECT * FROM users WHERE id = ? AND role = ?').get(student_id, 'student');
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const existing = db.prepare('SELECT * FROM enrollments WHERE class_id = ? AND student_id = ?').get(req.params.id, student_id);
    if (existing) {
      return res.status(409).json({ error: 'Student already enrolled' });
    }

    db.prepare('INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)').run(req.params.id, student_id);

    res.json({ message: 'Student enrolled successfully' });
  } catch (err) {
    console.error('Error enrolling student:', err);
    res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// Get class schedule
router.get('/:id/schedule', (req, res) => {
  try {
    const db = getDb();
    const classData = db.prepare('SELECT id, name, schedule, room FROM classes WHERE id = ?').get(req.params.id);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ schedule: classData });
  } catch (err) {
    console.error('Error fetching schedule:', err);
    res.status(500).json({ error: 'Failed to fetch schedule' });
  }
});

module.exports = router;
