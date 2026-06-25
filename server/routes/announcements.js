const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all announcements (public)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const announcements = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC
    `).all();

    res.json({ announcements });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement (public)
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const announcement = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!announcement) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    res.json({ announcement });
  } catch (err) {
    console.error('Error fetching announcement:', err);
    res.status(500).json({ error: 'Failed to fetch announcement' });
  }
});

// Create announcement (teacher/admin only)
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)'
    ).run(title, content, req.user.id);

    const announcement = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (author or admin only)
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const { title, content } = req.body;
    const db = getDb();

    // Check ownership or admin role
    const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    db.prepare(
      'UPDATE announcements SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(title, content, req.params.id);

    const announcement = db.prepare(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    res.json({ message: 'Announcement updated', announcement });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (author or admin only)
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();

    // Check ownership or admin role
    const existing = db.prepare('SELECT * FROM announcements WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    db.prepare('DELETE FROM announcements WHERE id = ?').run(req.params.id);

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
