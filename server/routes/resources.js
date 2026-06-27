const express = require('express');
const { getDb } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all resources across courses
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { type, course_id } = req.query;
    let where = [];
    let params = [];
    if (type) { where.push('r.type = ?'); params.push(type); }
    if (course_id) { where.push('r.course_id = ?'); params.push(course_id); }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const resources = db.prepare(`
      SELECT r.*, c.title as course_title, s.name as subject_name, s.code as subject_code
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      ${clause}
      ORDER BY r.created_at DESC
    `).all(...params);
    res.json({ resources });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

module.exports = router;
