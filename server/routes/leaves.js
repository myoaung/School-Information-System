const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── List Leave Requests ───────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, user_id, leave_type } = req.query;

    let where = [];
    let params = [];

    // Students can only see their own requests
    if (req.user.role === 'student') {
      where.push('lr.user_id = ?');
      params.push(req.user.id);
    } else if (user_id) {
      where.push('lr.user_id = ?');
      params.push(user_id);
    }

    if (status) {
      where.push('lr.status = ?');
      params.push(status);
    }
    if (leave_type) {
      where.push('lr.leave_type = ?');
      params.push(leave_type);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const leaves = await db.all(
      `SELECT lr.*, u.name as user_name, u.email as user_email,
              ab.name as approved_by_name
       FROM leave_requests lr
       LEFT JOIN users u ON lr.user_id = u.id
       LEFT JOIN users ab ON lr.approved_by = ab.id
       ${whereClause}
       ORDER BY lr.created_at DESC`,
      params
    );

    res.json({ leaves });
  } catch (err) {
    sendError(res, err, 'Failed to fetch leave requests');
  }
});

// ─── Get Single Leave Request ──────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const leave = await db.get(
      `SELECT lr.*, u.name as user_name, u.email as user_email,
              ab.name as approved_by_name
       FROM leave_requests lr
       LEFT JOIN users u ON lr.user_id = u.id
       LEFT JOIN users ab ON lr.approved_by = ab.id
       WHERE lr.id = ?`,
      [id]
    );

    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    // Students can only view their own
    if (req.user.role === 'student' && leave.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ leave });
  } catch (err) {
    sendError(res, err, 'Failed to fetch leave request');
  }
});

// ─── Create Leave Request ──────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { leave_type, start_date, end_date, reason } = req.body;

    if (!leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: 'leave_type, start_date, and end_date are required' });
    }

    const validTypes = ['sick', 'personal', 'vacation', 'maternity', 'other'];
    if (!validTypes.includes(leave_type)) {
      return res
        .status(400)
        .json({ error: `Invalid leave type. Must be: ${validTypes.join(', ')}` });
    }

    // Validate dates
    if (new Date(end_date) < new Date(start_date)) {
      return res.status(400).json({ error: 'End date must be after start date' });
    }

    const result = await db.run(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, reason)
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, leave_type, start_date, end_date, reason || null]
    );

    const leave = await db.get('SELECT * FROM leave_requests WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Leave request created', leave });

    auditLog(req, {
      action: 'create',
      entityType: 'leave_request',
      entityId: result.lastInsertRowid,
      newValues: { leave_type, start_date, end_date },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create leave request');
  }
});

// ─── Approve Leave Request (admin/HR only) ────────────────────────
router.put('/:id/approve', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_notes } = req.body;

    const leave = await db.get('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    if (leave.status !== 'pending') {
      return res
        .status(400)
        .json({ error: `Cannot approve request with status '${leave.status}'` });
    }

    await db.run(
      `UPDATE leave_requests SET status = 'approved', approved_by = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.user.id, admin_notes || null, id]
    );

    // Update attendance status to 'leave' for the leave period
    const start = new Date(leave.start_date);
    const end = new Date(leave.end_date);
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      // Update or insert attendance record as 'leave'
      await db.run(
        `INSERT INTO attendance (user_id, class_id, date, status, marked_by, note)
         SELECT ?, e.class_id, ?, 'leave', ?, 'Auto-marked: leave approved'
         FROM enrollments e WHERE e.student_id = ?
         ON CONFLICT(user_id, class_id, date) DO UPDATE SET status = 'leave', note = 'Auto-marked: leave approved'`,
        [leave.user_id, dateStr, req.user.id, leave.user_id]
      );
    }

    res.json({ message: 'Leave request approved' });

    auditLog(req, {
      action: 'approve',
      entityType: 'leave_request',
      entityId: id,
      newValues: { status: 'approved', admin_notes },
    });
  } catch (err) {
    sendError(res, err, 'Failed to approve leave request');
  }
});

// ─── Reject Leave Request (admin/HR only) ─────────────────────────
router.put('/:id/reject', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { admin_notes } = req.body;

    const leave = await db.get('SELECT * FROM leave_requests WHERE id = ?', [id]);
    if (!leave) return res.status(404).json({ error: 'Leave request not found' });

    if (leave.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject request with status '${leave.status}'` });
    }

    await db.run(
      `UPDATE leave_requests SET status = 'rejected', approved_by = ?, admin_notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [req.user.id, admin_notes || null, id]
    );

    res.json({ message: 'Leave request rejected' });

    auditLog(req, {
      action: 'reject',
      entityType: 'leave_request',
      entityId: id,
      newValues: { status: 'rejected', admin_notes },
    });
  } catch (err) {
    sendError(res, err, 'Failed to reject leave request');
  }
});

// ─── My Leave Requests ─────────────────────────────────────────
router.get('/my/requests', authMiddleware, async (req, res) => {
  try {
    const leaves = await db.all(
      `SELECT lr.*, ab.name as approved_by_name
       FROM leave_requests lr
       LEFT JOIN users ab ON lr.approved_by = ab.id
       WHERE lr.user_id = ?
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );

    res.json({ leaves });
  } catch (err) {
    sendError(res, err, 'Failed to fetch your leave requests');
  }
});

// ─── Leave Statistics ──────────────────────────────────────────
router.get(
  '/stats/summary',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const total = await db.get('SELECT COUNT(*) as c FROM leave_requests');
      const pending = await db.get(
        "SELECT COUNT(*) as c FROM leave_requests WHERE status = 'pending'"
      );
      const approved = await db.get(
        "SELECT COUNT(*) as c FROM leave_requests WHERE status = 'approved'"
      );
      const rejected = await db.get(
        "SELECT COUNT(*) as c FROM leave_requests WHERE status = 'rejected'"
      );

      // By type
      const byType = await db.all(
        `SELECT leave_type, COUNT(*) as count FROM leave_requests GROUP BY leave_type`
      );

      res.json({
        stats: {
          total: total?.c || 0,
          pending: pending?.c || 0,
          approved: approved?.c || 0,
          rejected: rejected?.c || 0,
          byType: byType || [],
        },
      });
    } catch (err) {
      sendError(res, err, 'Failed to fetch leave stats');
    }
  }
);

module.exports = router;
