/**
 * Role-Based Access Control (RBAC) Middleware
 *
 * Data-driven permission checks: queries role_permissions at request time.
 * Deny-by-default: if no row or flag is false → 403 Forbidden.
 *
 * Usage:
 *   const { requirePermission } = require('../middleware/rbac');
 *   router.get('/', authMiddleware, requirePermission('students', 'read'), handler);
 *   router.post('/', authMiddleware, requirePermission('students', 'create'), handler);
 */

const { db } = require('../data');

// In-memory cache: { "admin:students": { create: true, read: true, ... }, ... }
let permCache = null;

/**
 * Load all permissions into memory cache.
 * Returns a Map keyed by "roleName:areaName".
 */
async function loadPermissions() {
  if (permCache) return permCache;

  const rows = await db.all(`
    SELECT r.name as role_name, a.name as area_name,
           rp.can_create, rp.can_read, rp.can_update, rp.can_delete
    FROM role_permissions rp
    JOIN roles r ON r.id = rp.role_id
    JOIN areas a ON a.id = rp.area_id
  `);

  const map = {};
  for (const row of rows) {
    map[`${row.role_name}:${row.area_name}`] = {
      create: !!row.can_create,
      read: !!row.can_read,
      update: !!row.can_update,
      delete: !!row.can_delete,
    };
  }

  permCache = map;
  return permCache;
}

/**
 * Clear the permission cache. Call after admin updates permissions.
 */
function clearPermCache() {
  permCache = null;
}

/**
 * Middleware factory: checks that the authenticated user's role has
 * the specified permission (create|read|update|delete) on the given area.
 *
 * Must be used AFTER authMiddleware (requires req.user with .role).
 *
 * @param {string} area - The module/resource area (e.g. 'students', 'finance')
 * @param {string} action - The CRUD action (one of: 'create', 'read', 'update', 'delete')
 * @returns {Function} Express middleware
 */
function requirePermission(area, action) {
  const validActions = ['create', 'read', 'update', 'delete'];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action: '${action}'. Must be one of: ${validActions.join(', ')}`);
  }

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const roleName = req.user.role;
      const perms = await loadPermissions();
      const key = `${roleName}:${area}`;
      const entry = perms[key];

      if (!entry || !entry[action]) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Role '${roleName}' lacks '${action}' permission on '${area}'`,
        });
      }

      // Attach to request for downstream use (e.g., ownership checks)
      req.areaPermissions = entry;
      next();
    } catch (err) {
      console.error('[RBAC] Permission check failed:', err);
      res.status(500).json({ error: 'Permission check failed' });
    }
  };
}

module.exports = { requirePermission, clearPermCache, loadPermissions };
