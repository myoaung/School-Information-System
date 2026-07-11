const express = require('express');
const crypto = require('crypto');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const QR_EXPIRY_MINUTES = 15;

function generateQRToken() {
  return crypto.randomBytes(16).toString('hex');
}

// ─── Create Session + Generate QR ──────────────────────────────
router.post('/sessions', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { class_id, timetable_id, date } = req.body;

    if (!class_id) {
      return res.status(400).json({ error: 'class_id is required' });
    }

    const sessionDate = date || new Date().toISOString().split('T')[0];

    // Get timetable info if provided
    let subject_id = null;
    let teacher_id = req.user.id;
    let start_time = null;
    let end_time = null;
    let room = null;

    if (timetable_id) {
      const tt = await db.get('SELECT * FROM timetable WHERE id = ?', [timetable_id]);
      if (tt) {
        subject_id = tt.subject_id;
        teacher_id = tt.teacher_id || req.user.id;
        start_time = tt.start_time;
        end_time = tt.end_time;
        room = tt.room;
      }
    }

    // Deactivate any existing active sessions for this class today
    await db.run(
      'UPDATE class_sessions SET is_active = 0 WHERE class_id = ? AND date = ? AND is_active = 1',
      [class_id, sessionDate]
    );

    const qr_code = generateQRToken();
    const expires_at = new Date(Date.now() + QR_EXPIRY_MINUTES * 60 * 1000).toISOString();

    const result = await db.run(
      `INSERT INTO class_sessions (timetable_id, class_id, subject_id, teacher_id, date, start_time, end_time, room, qr_code, qr_expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timetable_id || null,
        class_id,
        subject_id,
        teacher_id,
        sessionDate,
        start_time,
        end_time,
        room,
        qr_code,
        expires_at,
      ]
    );

    const session = await db.get('SELECT * FROM class_sessions WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Session created', session });

    auditLog(req, {
      action: 'create',
      entityType: 'class_session',
      entityId: result.lastInsertRowid,
      newValues: { class_id, date: sessionDate },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create session');
  }
});

// ─── Get Session with QR + Check-in Count ──────────────────────
router.get('/sessions/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const session = await db.get(
      `SELECT cs.*, c.name as class_name, s.name as subject_name, u.name as teacher_name,
              (SELECT COUNT(*) FROM attendance WHERE session_id = cs.id AND status = 'present') as checked_in_count,
              (SELECT COUNT(*) FROM enrollments WHERE class_id = cs.class_id) as total_students
       FROM class_sessions cs
       LEFT JOIN classes c ON cs.class_id = c.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       LEFT JOIN users u ON cs.teacher_id = u.id
       WHERE cs.id = ?`,
      [id]
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Check if expired
    const now = new Date();
    const expiresAt = new Date(session.qr_expires_at);
    session.is_expired = now > expiresAt;

    res.json({ session });
  } catch (err) {
    sendError(res, err, 'Failed to fetch session');
  }
});

// ─── Deactivate Session ────────────────────────────────────────
router.post(
  '/sessions/:id/deactivate',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const session = await db.get('SELECT * FROM class_sessions WHERE id = ?', [id]);
      if (!session) return res.status(404).json({ error: 'Session not found' });

      await db.run('UPDATE class_sessions SET is_active = 0 WHERE id = ?', [id]);

      res.json({ message: 'Session deactivated' });
    } catch (err) {
      sendError(res, err, 'Failed to deactivate session');
    }
  }
);

// ─── List Sessions ─────────────────────────────────────────────
router.get('/sessions', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { class_id, date } = req.query;

    let where = [];
    let params = [];

    if (class_id) {
      where.push('cs.class_id = ?');
      params.push(class_id);
    }
    if (date) {
      where.push('cs.date = ?');
      params.push(date);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const sessions = await db.all(
      `SELECT cs.*, c.name as class_name, s.name as subject_name,
              (SELECT COUNT(*) FROM attendance WHERE session_id = cs.id AND status = 'present') as checked_in_count,
              (SELECT COUNT(*) FROM enrollments WHERE class_id = cs.class_id) as total_students
       FROM class_sessions cs
       LEFT JOIN classes c ON cs.class_id = c.id
       LEFT JOIN subjects s ON cs.subject_id = s.id
       ${whereClause}
       ORDER BY cs.created_at DESC`,
      params
    );

    res.json({ sessions });
  } catch (err) {
    sendError(res, err, 'Failed to fetch sessions');
  }
});

// ─── Student Scan QR Token ─────────────────────────────────────
router.post('/scan', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;
    const studentId = req.user.id;

    if (!token) {
      return res.status(400).json({ error: 'QR token is required' });
    }

    // Find session by QR code
    const session = await db.get(
      'SELECT * FROM class_sessions WHERE qr_code = ? AND is_active = 1',
      [token]
    );

    if (!session) {
      return res.status(404).json({ error: 'Invalid or inactive QR code' });
    }

    // Check expiry
    const now = new Date();
    const expiresAt = new Date(session.qr_expires_at);
    if (now > expiresAt) {
      return res.status(400).json({ error: 'QR code has expired' });
    }

    // Check student is enrolled in this class
    const enrollment = await db.get(
      'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
      [studentId, session.class_id]
    );

    if (!enrollment) {
      return res.status(403).json({ error: 'You are not enrolled in this class' });
    }

    // Upsert attendance record
    const today = session.date;
    await db.run(
      `INSERT INTO attendance (user_id, class_id, date, status, marked_by, session_id, scan_method)
       VALUES (?, ?, ?, 'present', ?, ?, 'qr')
       ON CONFLICT(user_id, class_id, date) DO UPDATE SET
         status = 'present',
         marked_by = excluded.marked_by,
         session_id = excluded.session_id,
         scan_method = 'qr'`,
      [studentId, session.class_id, today, session.teacher_id, session.id]
    );

    // Get class and subject names for response
    const classInfo = await db.get('SELECT name FROM classes WHERE id = ?', [session.class_id]);
    const subjectInfo = session.subject_id
      ? await db.get('SELECT name FROM subjects WHERE id = ?', [session.subject_id])
      : null;

    res.json({
      message: 'Attendance marked successfully',
      class: classInfo?.name,
      subject: subjectInfo?.name,
      date: today,
      time: now.toLocaleTimeString(),
    });

    auditLog(req, {
      action: 'qr_scan',
      entityType: 'attendance',
      entityId: studentId,
      newValues: { class_id: session.class_id, session_id: session.id },
    });
  } catch (err) {
    sendError(res, err, 'Failed to scan QR code');
  }
});

module.exports = router;
