const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// Get user's notifications
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { limit } = req.query;
    let sql = 'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC';
    const params = [req.user.id];
    if (limit) { sql += ' LIMIT ?'; params.push(parseInt(limit)); }
    const notifications = db.prepare(sql).all(...params);
    res.json(notifications);
  } catch (err) {
    sendError(res, err);
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    sendError(res, err);
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0').get(req.user.id);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

// Create notification (admin only)
router.post('/', authMiddleware, (req, res) => {
  try {
    const { user_id, type, title, message, link } = req.body;
    if (!user_id || !type) {
      return res.status(400).json({ error: 'user_id and type are required' });
    }
    const db = getDb();
    const result = db.prepare('INSERT INTO notifications (user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?)').run(user_id, type, title || null, message || null, link || null);
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
