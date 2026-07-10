const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { classRules } = require('../middleware/validate');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// Get all classes (public)
router.get('/', async (req, res) => {
  try {
    const classes = await db.all(`
      SELECT c.*, u.name as teacher_name,
        (SELECT COUNT(*) FROM enrollments WHERE class_id = c.id) as student_count
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.name
    `);

    res.json({ classes });
  } catch (err) {
    sendError(res, err, 'Failed to fetch classes');
  }
});

// Get single class with enrollments
router.get('/:id', async (req, res) => {
  try {
    const classData = await db.get(`
      SELECT c.*, u.name as teacher_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [req.params.id]);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get enrolled students
    const students = await db.all(`
      SELECT u.id, u.name, u.email
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.name
    `, [req.params.id]);

    res.json({ class: { ...classData, students } });
  } catch (err) {
    sendError(res, err, 'Failed to fetch class');
  }
});

// Create class (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), classRules, async (req, res) => {
  try {
    const { name, description, teacher_id, schedule, room } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    const result = await db.run(
      'INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)',
      [name, description || null, teacher_id || null, schedule || null, room || null]
    );

    const classData = await db.get('SELECT * FROM classes WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ message: 'Class created', class: classData });
  } catch (err) {
    sendError(res, err, 'Failed to create class');
  }
});

// Update class (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, description, teacher_id, schedule, room } = req.body;

    const existing = await db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Class not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Class name is required' });
    }

    await db.run(
      'UPDATE classes SET name = ?, description = ?, teacher_id = ?, schedule = ?, room = ? WHERE id = ?',
      [name, description || null, teacher_id || null, schedule || null, room || null, req.params.id]
    );

    const classData = await db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);

    res.json({ message: 'Class updated', class: classData });
  } catch (err) {
    sendError(res, err, 'Failed to update class');
  }
});

// Enroll student (admin or teacher)
router.post('/:id/enroll', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { student_id } = req.body;

    if (!student_id) {
      return res.status(400).json({ error: 'Student ID is required' });
    }

    const classData = await db.get('SELECT * FROM classes WHERE id = ?', [req.params.id]);
    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const student = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [student_id, 'student']);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const existing = await db.get('SELECT * FROM enrollments WHERE class_id = ? AND student_id = ?', [req.params.id, student_id]);
    if (existing) {
      return res.status(409).json({ error: 'Student already enrolled' });
    }

    await db.run('INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)', [req.params.id, student_id]);

    res.json({ message: 'Student enrolled successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to enroll student');
  }
});

// Get class schedule
router.get('/:id/schedule', async (req, res) => {
  try {
    const classData = await db.get('SELECT id, name, schedule, room FROM classes WHERE id = ?', [req.params.id]);

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    res.json({ schedule: classData });
  } catch (err) {
    sendError(res, err, 'Failed to fetch schedule');
  }
});

module.exports = router;
