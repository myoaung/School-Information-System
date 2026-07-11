const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { createAndSend, sendToRole, getStats } = require('../services/notificationService');

const router = express.Router();

// ─── Get User's Notifications ──────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, unread_only, limit } = req.query;

    let where = ['n.user_id = ?'];
    let params = [req.user.id];

    if (type) {
      where.push('n.type = ?');
      params.push(type);
    }
    if (unread_only === 'true') {
      where.push('n.read = 0');
    }

    const whereClause = `WHERE ${where.join(' AND ')}`;
    const limitClause = limit ? `LIMIT ${parseInt(limit)}` : 'LIMIT 50';

    const notifications = await db.all(
      `SELECT n.* FROM notifications n
       ${whereClause}
       ORDER BY n.created_at DESC
       ${limitClause}`,
      params
    );

    const unreadCount = await db.get(
      'SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND read = 0',
      [req.user.id]
    );

    res.json({ notifications, unreadCount: unreadCount?.c || 0 });
  } catch (err) {
    sendError(res, err, 'Failed to fetch notifications');
  }
});

// ─── Mark as Read ──────────────────────────────────────────────
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const notif = await db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [
      id,
      req.user.id,
    ]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await db.run('UPDATE notifications SET read = 1 WHERE id = ?', [id]);

    res.json({ message: 'Marked as read' });
  } catch (err) {
    sendError(res, err, 'Failed to mark as read');
  }
});

// ─── Mark All as Read ──────────────────────────────────────────
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0', [req.user.id]);

    res.json({ message: 'All marked as read' });
  } catch (err) {
    sendError(res, err, 'Failed to mark all as read');
  }
});

// ─── Get Unread Count ──────────────────────────────────────────
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.get(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read = 0',
      [req.user.id]
    );
    res.json({ count: result?.count || 0 });
  } catch (err) {
    sendError(res, err, 'Failed to get unread count');
  }
});

// ─── Delete Notification ───────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const notif = await db.get('SELECT * FROM notifications WHERE id = ? AND user_id = ?', [
      id,
      req.user.id,
    ]);
    if (!notif) return res.status(404).json({ error: 'Notification not found' });

    await db.run('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete');
  }
});

// ─── Get Preferences ───────────────────────────────────────────
router.get('/preferences', authMiddleware, async (req, res) => {
  try {
    let prefs = await db.get('SELECT * FROM notification_preferences WHERE user_id = ?', [
      req.user.id,
    ]);

    // Create default preferences if none exist
    if (!prefs) {
      await db.run('INSERT INTO notification_preferences (user_id) VALUES (?)', [req.user.id]);
      prefs = await db.get('SELECT * FROM notification_preferences WHERE user_id = ?', [
        req.user.id,
      ]);
    }

    res.json({ preferences: prefs });
  } catch (err) {
    sendError(res, err, 'Failed to fetch preferences');
  }
});

// ─── Update Preferences ────────────────────────────────────────
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const {
      email_enabled,
      sms_enabled,
      push_enabled,
      attendance_alerts,
      fee_reminders,
      exam_notices,
      announcements,
      emergency_alerts,
    } = req.body;

    // Upsert preferences
    await db.run(
      `INSERT INTO notification_preferences (user_id, email_enabled, sms_enabled, push_enabled,
        attendance_alerts, fee_reminders, exam_notices, announcements, emergency_alerts, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(user_id) DO UPDATE SET
        email_enabled = excluded.email_enabled,
        sms_enabled = excluded.sms_enabled,
        push_enabled = excluded.push_enabled,
        attendance_alerts = excluded.attendance_alerts,
        fee_reminders = excluded.fee_reminders,
        exam_notices = excluded.exam_notices,
        announcements = excluded.announcements,
        emergency_alerts = excluded.emergency_alerts,
        updated_at = CURRENT_TIMESTAMP`,
      [
        req.user.id,
        email_enabled ?? 1,
        sms_enabled ?? 0,
        push_enabled ?? 1,
        attendance_alerts ?? 1,
        fee_reminders ?? 1,
        exam_notices ?? 1,
        announcements ?? 1,
        emergency_alerts ?? 1,
      ]
    );

    res.json({ message: 'Preferences updated' });
  } catch (err) {
    sendError(res, err, 'Failed to update preferences');
  }
});

// ─── Send Notification (admin only) ────────────────────────────
router.post('/send', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { title, message, type, target_role, target_user_ids, channels, link } = req.body;

    if (!title || !message) {
      return res.status(400).json({ error: 'title and message are required' });
    }

    let results = [];

    if (target_role) {
      // Send to all users with this role
      results = await sendToRole(target_role, {
        title,
        message,
        type: type || 'general',
        link,
        channels: channels || ['in_app'],
      });
    } else if (target_user_ids && target_user_ids.length > 0) {
      // Send to specific users
      for (const userId of target_user_ids) {
        const result = await createAndSend({
          userId,
          title,
          message,
          type: type || 'general',
          link,
          channels: channels || ['in_app'],
        });
        results.push({ userId, ...result });
      }
    } else {
      return res.status(400).json({ error: 'target_role or target_user_ids required' });
    }

    const successCount = results.filter((r) => r.in_app?.success).length;

    res.json({
      message: `Notification sent to ${successCount} users`,
      results,
    });
  } catch (err) {
    sendError(res, err, 'Failed to send notification');
  }
});

// ─── Notification Stats (admin only) ───────────────────────────
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ stats });
  } catch (err) {
    sendError(res, err, 'Failed to fetch stats');
  }
});

module.exports = router;
