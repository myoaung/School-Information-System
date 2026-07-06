const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { announcementRules } = require('../middleware/validate');

const router = express.Router();

// Get all announcements (public, with optional grade/class filter)
router.get('/', async (req, res) => {
  try {
    const { grade_id, class_id } = req.query;

    let where = [];
    let params = [];

    if (grade_id) {
      where.push('(a.grade_id = ? OR a.grade_id IS NULL)');
      params.push(grade_id);
    }
    if (class_id) {
      where.push('(a.class_id = ? OR a.class_id IS NULL)');
      params.push(class_id);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const announcements = await db.all(`
      SELECT a.*, u.name as author_name,
             g.name as grade_name, c.name as class_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN grades g ON a.grade_id = g.id
      LEFT JOIN classes c ON a.class_id = c.id
      ${whereClause}
      ORDER BY a.created_at DESC
    `, params);

    res.json({ announcements });
  } catch (err) {
    console.error('Error fetching announcements:', err);
    res.status(500).json({ error: 'Failed to fetch announcements' });
  }
});

// Get single announcement (public)
router.get('/:id', async (req, res) => {
  try {
    const announcement = await db.get(`
      SELECT a.*, u.name as author_name,
             g.name as grade_name, c.name as class_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN grades g ON a.grade_id = g.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.id = ?
    `, req.params.id);

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
router.post('/', authMiddleware, roleMiddleware('teacher', 'admin'), announcementRules, async (req, res) => {
  try {
    const { title, content, grade_id, class_id } = req.body;

    const result = await db.run(
      'INSERT INTO announcements (title, content, author_id, grade_id, class_id) VALUES (?, ?, ?, ?, ?)',
      [title, content, req.user.id, grade_id || null, class_id || null]
    );

    const announcement = await db.get(`
      SELECT a.*, u.name as author_name,
             g.name as grade_name, c.name as class_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN grades g ON a.grade_id = g.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.id = ?
    `, result.lastInsertRowid);

    res.status(201).json({ message: 'Announcement created', announcement });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Update announcement (author or admin only)
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { title, content, grade_id, class_id } = req.body;

    const existing = await db.get('SELECT * FROM announcements WHERE id = ?', req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to update this announcement' });
    }

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    await db.run(
      'UPDATE announcements SET title = ?, content = ?, grade_id = ?, class_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [title, content, grade_id || null, class_id || null, req.params.id]
    );

    const announcement = await db.get(`
      SELECT a.*, u.name as author_name,
             g.name as grade_name, c.name as class_name
      FROM announcements a
      LEFT JOIN users u ON a.author_id = u.id
      LEFT JOIN grades g ON a.grade_id = g.id
      LEFT JOIN classes c ON a.class_id = c.id
      WHERE a.id = ?
    `, req.params.id);

    res.json({ message: 'Announcement updated', announcement });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Delete announcement (author or admin only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await db.get('SELECT * FROM announcements WHERE id = ?', req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to delete this announcement' });
    }

    await db.run('DELETE FROM announcements WHERE id = ?', req.params.id);

    res.json({ message: 'Announcement deleted' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
