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
    if (isLockedOut(email)) {
      return res.status(429).json({ error: 'Account temporarily locked. Try again later.' });
    }

    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      trackFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      trackFailedAttempt(email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Clear failed attempts on successful login
    clearFailedAttempts(email);

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
  const user = await db.get('SELECT id, email, name, role, created_at FROM users WHERE id = ?', [
    req.user.id,
  ]);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

module.exports = router;
