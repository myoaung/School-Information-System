/**
 * RBAC Admin Routes
 *
 * Endpoints for managing roles, areas, and permissions.
 * All routes require admin role.
 */

const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { clearPermCache } = require('../middleware/rbac');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── List all roles ─────────────────────────────────────────────
router.get('/roles', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const roles = await db.all('SELECT * FROM roles ORDER BY id');
    res.json({ roles });
  } catch (err) {
    sendError(res, err, 'Failed to fetch roles');
  }
});

// ─── List all areas ─────────────────────────────────────────────
router.get('/areas', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const areas = await db.all('SELECT * FROM areas ORDER BY id');
    res.json({ areas });
  } catch (err) {
    sendError(res, err, 'Failed to fetch areas');
  }
});

// ─── List all permissions (with role and area names) ───────────
router.get('/permissions', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const permissions = await db.all(`
      SELECT rp.id, rp.role_id, r.name as role_name,
             rp.area_id, a.name as area_name,
             rp.can_create, rp.can_read, rp.can_update, rp.can_delete,
             rp.created_at
      FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN areas a ON a.id = rp.area_id
      ORDER BY r.id, a.id
    `);
    res.json({ permissions });
  } catch (err) {
    sendError(res, err, 'Failed to fetch permissions');
  }
});

// ─── Get permissions for a specific role ───────────────────────
router.get(
  '/permissions/role/:roleId',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);

      const role = await db.get('SELECT * FROM roles WHERE id = ?', [roleId]);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      const permissions = await db.all(
        `
      SELECT rp.id, rp.area_id, a.name as area_name,
             rp.can_create, rp.can_read, rp.can_update, rp.can_delete
      FROM role_permissions rp
      JOIN areas a ON a.id = rp.area_id
      WHERE rp.role_id = ?
      ORDER BY a.id
    `,
        [roleId]
      );

      res.json({ role, permissions });
    } catch (err) {
      sendError(res, err, 'Failed to fetch role permissions');
    }
  }
);

// ─── Update a permission entry ──────────────────────────────────
router.put(
  '/permissions/:roleId/:areaId',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const areaId = parseInt(req.params.areaId);
      const { can_create, can_read, can_update, can_delete } = req.body;

      // Verify role and area exist
      const role = await db.get('SELECT id FROM roles WHERE id = ?', [roleId]);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      const area = await db.get('SELECT id FROM areas WHERE id = ?', [areaId]);
      if (!area) return res.status(404).json({ error: 'Area not found' });

      // Upsert the permission
      const existing = await db.get(
        'SELECT id FROM role_permissions WHERE role_id = ? AND area_id = ?',
        [roleId, areaId]
      );

      if (existing) {
        await db.run(
          `
        UPDATE role_permissions
        SET can_create = ?, can_read = ?, can_update = ?, can_delete = ?
        WHERE role_id = ? AND area_id = ?
      `,
          [
            can_create ? 1 : 0,
            can_read ? 1 : 0,
            can_update ? 1 : 0,
            can_delete ? 1 : 0,
            roleId,
            areaId,
          ]
        );
      } else {
        await db.run(
          `
        INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
          [
            roleId,
            areaId,
            can_create ? 1 : 0,
            can_read ? 1 : 0,
            can_update ? 1 : 0,
            can_delete ? 1 : 0,
          ]
        );
      }

      // Invalidate cache so next request picks up changes
      clearPermCache();

      res.json({ message: 'Permission updated' });

      auditLog(req, {
        action: 'update',
        entityType: 'role_permission',
        entityId: existing?.id || 0,
        newValues: { roleId, areaId, can_create, can_read, can_update, can_delete },
      });
    } catch (err) {
      sendError(res, err, 'Failed to update permission');
    }
  }
);

// ─── Bulk update permissions for a role ────────────────────────
router.put(
  '/permissions/role/:roleId',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const roleId = parseInt(req.params.roleId);
      const { permissions } = req.body; // Array of { area_id, can_create, can_read, can_update, can_delete }

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions must be an array' });
      }

      const role = await db.get('SELECT id FROM roles WHERE id = ?', [roleId]);
      if (!role) return res.status(404).json({ error: 'Role not found' });

      for (const perm of permissions) {
        const { area_id, can_create, can_read, can_update, can_delete } = perm;

        const existing = await db.get(
          'SELECT id FROM role_permissions WHERE role_id = ? AND area_id = ?',
          [roleId, area_id]
        );

        if (existing) {
          await db.run(
            `
          UPDATE role_permissions
          SET can_create = ?, can_read = ?, can_update = ?, can_delete = ?
          WHERE role_id = ? AND area_id = ?
        `,
            [
              can_create ? 1 : 0,
              can_read ? 1 : 0,
              can_update ? 1 : 0,
              can_delete ? 1 : 0,
              roleId,
              area_id,
            ]
          );
        } else {
          await db.run(
            `
          INSERT INTO role_permissions (role_id, area_id, can_create, can_read, can_update, can_delete)
          VALUES (?, ?, ?, ?, ?, ?)
        `,
            [
              roleId,
              area_id,
              can_create ? 1 : 0,
              can_read ? 1 : 0,
              can_update ? 1 : 0,
              can_delete ? 1 : 0,
            ]
          );
        }
      }

      clearPermCache();
      res.json({ message: 'Permissions updated' });

      auditLog(req, {
        action: 'bulk_update',
        entityType: 'role_permission',
        entityId: roleId,
        newValues: { count: permissions.length },
      });
    } catch (err) {
      sendError(res, err, 'Failed to update permissions');
    }
  }
);

module.exports = router;
