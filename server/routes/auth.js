const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { JWT_SECRET } = require('../config');
const { registerRules, loginRules } = require('../middleware/validate');
const { sendError } = require('../utils/errorHandler');
const {
  trackFailedAttempt,
  clearFailedAttempts,
  isLockedOut,
} = require('../middleware/accountLockout');

const router = express.Router();

// Register — defaults to 'student' role. Admin/teacher roles assigned by existing admins only.
router.post('/register', registerRules, async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Require at least one uppercase, one lowercase, one digit
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res
        .status(400)
        .json({ error: 'Password must include uppercase, lowercase, and a number' });
    }

    // Allow student/parent self-registration; admin/teacher roles require existing admin assignment
    const requestedRole = req.body.role;
    const role = requestedRole === 'parent' ? 'parent' : 'student';

    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await db.run(
      'INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, role, phone || null]
    );

    // Generate token
    const token = jwt.sign({ id: result.lastInsertRowid, email, name, role }, JWT_SECRET, {
      expiresIn: '2h',
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: result.lastInsertRowid, email, name, role },
    });
  } catch (err) {
    sendError(res, err, 'Registration failed');
  }
});

// Login
router.post('/login', loginRules, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check account lockout
    if (await isLockedOut(email)) {
      return res.status(429).json({ error: 'Account temporarily locked. Try again later.' });
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      await trackFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      await trackFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(email);

    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    sendError(res, err, 'Login failed');
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  const user = await db.get(
    'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
    [req.user.id]
  );

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

// Update own profile (name, email, phone) — any authenticated user
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user.id;

    // Check user exists
    const existing = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check email uniqueness if changing
    if (email && email !== req.user.email) {
      const emailTaken = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [
        email,
        userId,
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
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    params.push(userId);
    await db.run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);

    const user = await db.get(
      'SELECT id, email, name, role, phone, created_at FROM users WHERE id = ?',
      [userId]
    );

    // Return new token if email or name changed so client stays in sync
    let token = null;
    if (email || name) {
      token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      );
    }

    res.json({ user, token, message: 'Profile updated successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to update profile');
  }
});

// Change own password — any authenticated user
router.put('/password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Require at least one uppercase, one lowercase, one digit
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res
        .status(400)
        .json({ error: 'Password must include uppercase, lowercase, and a number' });
    }

    // Verify current password
    const user = await db.get('SELECT password FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(currentPassword, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    await db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    sendError(res, err, 'Failed to change password');
  }
});

module.exports = router;
