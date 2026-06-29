const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');
const { messageRules } = require('../middleware/validate');

// Send a message
router.post('/', authMiddleware, messageRules, (req, res) => {
  try {
    const { receiver_id, subject, body } = req.body;
    const db = getDb();
    const result = db.prepare('INSERT INTO messages (sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?)').run(req.user.id, receiver_id, subject || null, body);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Message sent' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get inbox (received messages)
router.get('/inbox', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const messages = db.prepare(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id);
    res.json(messages);
  } catch (err) {
    sendError(res, err);
  }
});

// Get sent messages
router.get('/sent', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const messages = db.prepare(`
      SELECT m.*, u.name as receiver_name, u.role as receiver_role
      FROM messages m
      JOIN users u ON u.id = m.receiver_id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
    `).all(req.user.id);
    res.json(messages);
  } catch (err) {
    sendError(res, err);
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?').run(req.params.id, req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete message
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)').run(req.params.id, req.user.id, req.user.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const result = db.prepare('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0').get(req.user.id);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

// Get all users (for composing messages)
router.get('/users', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const users = db.prepare('SELECT id, name, role FROM users WHERE id != ? ORDER BY name').all(req.user.id);
    res.json(users);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
