const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// GET /api/audit — admin-only, with filters
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { user_id, entity_type, action, limit = 50, offset = 0 } = req.query;

    let sql =
      'SELECT a.*, u.name as user_name, u.email as user_email FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id';
    const conditions = [];
    const params = [];

    if (user_id) {
      conditions.push('a.user_id = ?');
      params.push(user_id);
    }
    if (entity_type) {
      conditions.push('a.entity_type = ?');
      params.push(entity_type);
    }
    if (action) {
      conditions.push('a.action = ?');
      params.push(action);
    }

    if (conditions.length > 0) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const logs = await db.all(sql, params);

    // Get total count
    let countSql = 'SELECT COUNT(*) as total FROM audit_logs a';
    if (conditions.length > 0) countSql += ' WHERE ' + conditions.join(' AND ');
    const countResult = await db.get(countSql, params.slice(0, -2));

    res.json({ logs, total: countResult?.total || 0 });
  } catch (err) {
    sendError(res, err, 'Failed to fetch audit logs');
  }
});

module.exports = router;
