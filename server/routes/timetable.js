const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Get timetable for a class
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const entries = db.prepare(`
      SELECT t.*, s.name as subject_name, s.code as subject_code,
        u.name as teacher_name, c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.teacher_id = u.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.class_id = ?
      ORDER BY t.day_of_week, t.start_time
    `).all(class_id);

    // Group by day
    const grouped = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    entries.forEach(e => grouped[e.day_of_week].push(e));

    res.json({ timetable: grouped, days: DAYS });
  } catch (err) {
    console.error('Error fetching timetable:', err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Get all timetables (for a teacher)
router.get('/teacher', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const teacherId = req.query.teacher_id || req.user.id;

    const entries = db.prepare(`
      SELECT t.*, s.name as subject_name, s.code as subject_code,
        c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.teacher_id = ?
      ORDER BY t.day_of_week, t.start_time
    `).all(teacherId);

    const grouped = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    entries.forEach(e => grouped[e.day_of_week].push(e));

    res.json({ timetable: grouped, days: DAYS });
  } catch (err) {
    console.error('Error fetching teacher timetable:', err);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// Create timetable entry (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    if (!class_id || !subject_id || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({ error: 'class_id, subject_id, day_of_week, start_time, end_time are required' });
    }

    // Check for conflicts
    const teacherConflict = db.prepare(`
      SELECT * FROM timetable
      WHERE teacher_id = ? AND day_of_week = ? AND start_time < ? AND end_time > ?
    `).get(teacher_id, day_of_week, end_time, start_time);

    if (teacherConflict) {
      return res.status(409).json({ error: 'Teacher has a scheduling conflict at this time' });
    }

    const roomConflict = db.prepare(`
      SELECT * FROM timetable
      WHERE room = ? AND day_of_week = ? AND start_time < ? AND end_time > ?
    `).get(room, day_of_week, end_time, start_time);

    if (roomConflict) {
      return res.status(409).json({ error: 'Room is already booked at this time' });
    }

    const result = db.prepare(`
      INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(class_id, subject_id, teacher_id || null, day_of_week, start_time, end_time, room || null);

    const entry = db.prepare('SELECT * FROM timetable WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json({ message: 'Timetable entry created', entry });
  } catch (err) {
    console.error('Error creating timetable entry:', err);
    res.status(500).json({ error: 'Failed to create timetable entry' });
  }
});

// Update timetable entry (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    const existing = db.prepare('SELECT * FROM timetable WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    db.prepare(`
      UPDATE timetable SET subject_id = ?, teacher_id = ?, day_of_week = ?,
      start_time = ?, end_time = ?, room = ? WHERE id = ?
    `).run(
      subject_id ?? existing.subject_id, teacher_id ?? existing.teacher_id,
      day_of_week ?? existing.day_of_week, start_time ?? existing.start_time,
      end_time ?? existing.end_time, room ?? existing.room, req.params.id
    );

    const entry = db.prepare('SELECT * FROM timetable WHERE id = ?').get(req.params.id);
    res.json({ message: 'Timetable entry updated', entry });
  } catch (err) {
    console.error('Error updating timetable entry:', err);
    res.status(500).json({ error: 'Failed to update timetable entry' });
  }
});

// Delete timetable entry (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM timetable WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    db.prepare('DELETE FROM timetable WHERE id = ?').run(req.params.id);
    res.json({ message: 'Timetable entry deleted' });
  } catch (err) {
    console.error('Error deleting timetable entry:', err);
    res.status(500).json({ error: 'Failed to delete timetable entry' });
  }
});

module.exports = router;
