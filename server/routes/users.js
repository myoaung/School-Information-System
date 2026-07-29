/**
 * Admin User Management Routes
 *
 * Provides CRUD operations for managing user accounts.
 * All routes require authentication + admin permissions.
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// ── List all users ──────────────────────────────────────────────
router.get('/', authMiddleware, requirePermission('users', 'read'), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      where += ' AND role = ?';
      params.push(role);
    }

    const countResult = await db.get(`SELECT COUNT(*) as total FROM users ${where}`, params);
    const total = countResult?.total || 0;

    const users = await db.all(
      `SELECT id, email, name, role, phone, created_at FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    sendError(res, err, 'Failed to fetch users');
  }
});

// ── Get single user ─────────────────────────────────────────────
router.get('/:id', authMiddleware, requirePermission('users', 'read'), async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
      [req.params.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (err) {
    sendError(res, err, 'Failed to fetch user');
  }
});

// ── Update user ─────────────────────────────────────────────────
router.put('/:id', authMiddleware, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, phone, password } = req.body;

    // Check user exists
    const existing = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from demoting themselves
    if (parseInt(id) === req.user.id && role && role !== req.user.role) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    // Check email uniqueness if changing
    if (email) {
      const emailTaken = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [
        email,
        id,
      ]);
      if (emailTaken) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    // Build update query dynamically
    const updates = [];
    const params = [];

    if (name) {
      updates.push('name = ?');
      params.push(name);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (role) {
      updates.push('role = ?');
      params.push(role);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }
    if (password) {
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updates.push('password = ?');
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(id);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await db.get(
      'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ user, message: 'User updated successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to update user');
  }
});

// ── Change user role ────────────────────────────────────────────
router.put('/:id/role', authMiddleware, requirePermission('users', 'update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['admin', 'teacher', 'student', 'parent', 'accountant', 'staff'];
    if (!validRoles.includes(role)) {
      return res
        .status(400)
        .json({ error: `Invalid role. Must be one of: ${validRoles.join(', ')}` });
    }

    // Prevent self-demotion
    if (parseInt(id) === req.user.id && role !== req.user.role) {
      return res.status(400).json({ error: 'Cannot change your own role' });
    }

    const existing = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, id]);

    const user = await db.get(
      'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({ user, message: 'Role updated successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to update role');
  }
});

// ── Delete user ─────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requirePermission('users', 'delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existing = await db.get('SELECT id, name FROM users WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to delete user');
  }
});

module.exports = router;
