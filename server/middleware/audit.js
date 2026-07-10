const { db } = require('../data');

async function auditLog(req, { action, entityType, entityId, oldValues, newValues }) {
  try {
    await db.run(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        req.user?.id || null,
        action,
        entityType,
        entityId || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        req.ip || req.headers['x-forwarded-for'] || null,
        req.headers['user-agent'] || null,
      ]
    );
  } catch (err) {
    console.error('Audit log error:', err.message);
  }
}

module.exports = { auditLog };
