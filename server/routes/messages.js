const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { messageRules } = require('../middleware/validate');

// Send a message
router.post('/', authMiddleware, messageRules, async (req, res) => {
  try {
    const { receiver_id, subject, body } = req.body;
    const result = await db.run('INSERT INTO messages (sender_id, receiver_id, subject, body) VALUES (?, ?, ?, ?)', [req.user.id, receiver_id, subject || null, body]);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Message sent' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get inbox (received messages)
router.get('/inbox', authMiddleware, async (req, res) => {
  try {
    const messages = await db.all(`
      SELECT m.*, u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON u.id = m.sender_id
      WHERE m.receiver_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json(messages);
  } catch (err) {
    sendError(res, err);
  }
});

// Get sent messages
router.get('/sent', authMiddleware, async (req, res) => {
  try {
    const messages = await db.all(`
      SELECT m.*, u.name as receiver_name, u.role as receiver_role
      FROM messages m
      JOIN users u ON u.id = m.receiver_id
      WHERE m.sender_id = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json(messages);
  } catch (err) {
    sendError(res, err);
  }
});

// Mark message as read
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE messages SET is_read = 1 WHERE id = ? AND receiver_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete message
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM messages WHERE id = ? AND (sender_id = ? OR receiver_id = ?)', [req.params.id, req.user.id, req.user.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res) => {
  try {
    const result = await db.get('SELECT COUNT(*) as count FROM messages WHERE receiver_id = ? AND is_read = 0', [req.user.id]);
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

// Get all users (for composing messages)
router.get('/users', authMiddleware, async (req, res) => {
  try {
    const users = await db.all('SELECT id, name, role FROM users WHERE id != ? ORDER BY name', [req.user.id]);
    res.json(users);
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
