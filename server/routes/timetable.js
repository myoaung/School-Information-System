const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Get timetable for a class
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { class_id } = req.query;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const entries = await db.all(
      `
      SELECT t.*, s.name as subject_name, s.code as subject_code,
        u.name as teacher_name, c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN users u ON t.teacher_id = u.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.class_id = ?
      ORDER BY t.day_of_week, t.start_time
    `,
      [class_id]
    );

    // Group by day
    const grouped = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    entries.forEach((e) => grouped[e.day_of_week].push(e));

    res.json({ timetable: grouped, days: DAYS });
  } catch (err) {
    sendError(res, err, 'Failed to fetch timetable');
  }
});

// Get all timetables (for a teacher)
router.get('/teacher', authMiddleware, async (req, res) => {
  try {
    const teacherId = req.query.teacher_id || req.user.id;

    const entries = await db.all(
      `
      SELECT t.*, s.name as subject_name, s.code as subject_code,
        c.name as class_name
      FROM timetable t
      JOIN subjects s ON t.subject_id = s.id
      LEFT JOIN classes c ON t.class_id = c.id
      WHERE t.teacher_id = ?
      ORDER BY t.day_of_week, t.start_time
    `,
      [teacherId]
    );

    const grouped = {};
    for (let i = 0; i < 7; i++) grouped[i] = [];
    entries.forEach((e) => grouped[e.day_of_week].push(e));

    res.json({ timetable: grouped, days: DAYS });
  } catch (err) {
    sendError(res, err, 'Failed to fetch timetable');
  }
});

// Create timetable entry (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    if (!class_id || !subject_id || day_of_week === undefined || !start_time || !end_time) {
      return res
        .status(400)
        .json({ error: 'class_id, subject_id, day_of_week, start_time, end_time are required' });
    }

    // Check for conflicts
    const teacherConflict = await db.get(
      `
      SELECT * FROM timetable
      WHERE teacher_id = ? AND day_of_week = ? AND start_time < ? AND end_time > ?
    `,
      [teacher_id, day_of_week, end_time, start_time]
    );

    if (teacherConflict) {
      return res.status(409).json({ error: 'Teacher has a scheduling conflict at this time' });
    }

    const roomConflict = await db.get(
      `
      SELECT * FROM timetable
      WHERE room = ? AND day_of_week = ? AND start_time < ? AND end_time > ?
    `,
      [room, day_of_week, end_time, start_time]
    );

    if (roomConflict) {
      return res.status(409).json({ error: 'Room is already booked at this time' });
    }

    const result = await db.run(
      `
      INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [class_id, subject_id, teacher_id || null, day_of_week, start_time, end_time, room || null]
    );

    const entry = await db.get('SELECT * FROM timetable WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Timetable entry created', entry });

    auditLog(req, {
      action: 'create',
      entityType: 'timetable',
      entityId: result.lastInsertRowid,
      newValues: { class_id, subject_id, day_of_week, start_time, end_time, room },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create timetable entry');
  }
});

// Update timetable entry (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { subject_id, teacher_id, day_of_week, start_time, end_time, room } = req.body;

    const existing = await db.get('SELECT * FROM timetable WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    await db.run(
      `
      UPDATE timetable SET subject_id = ?, teacher_id = ?, day_of_week = ?,
      start_time = ?, end_time = ?, room = ? WHERE id = ?
    `,
      [
        subject_id ?? existing.subject_id,
        teacher_id ?? existing.teacher_id,
        day_of_week ?? existing.day_of_week,
        start_time ?? existing.start_time,
        end_time ?? existing.end_time,
        room ?? existing.room,
        req.params.id,
      ]
    );

    const entry = await db.get('SELECT * FROM timetable WHERE id = ?', [req.params.id]);
    res.json({ message: 'Timetable entry updated', entry });

    auditLog(req, {
      action: 'update',
      entityType: 'timetable',
      entityId: parseInt(req.params.id),
      newValues: { subject_id, day_of_week, start_time, end_time, room },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update timetable entry');
  }
});

// Delete timetable entry (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM timetable WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Timetable entry not found' });

    await db.run('DELETE FROM timetable WHERE id = ?', [req.params.id]);
    res.json({ message: 'Timetable entry deleted' });

    auditLog(req, { action: 'delete', entityType: 'timetable', entityId: parseInt(req.params.id) });
  } catch (err) {
    sendError(res, err, 'Failed to delete timetable entry');
  }
});

module.exports = router;
