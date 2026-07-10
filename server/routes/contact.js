const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { contactRules } = require('../middleware/validate');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// Submit contact form
router.post('/', contactRules, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    const result = await db.run(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
      [name, email, subject, message]
    );

    res.status(201).json({
      message: 'Contact form submitted successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    sendError(res, err, 'Failed to submit contact form');
  }
});

// Get all contacts — admin only
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const contacts = await db.all('SELECT * FROM contacts ORDER BY created_at DESC');

    res.json({ contacts });
  } catch (err) {
    sendError(res, err, 'Failed to fetch contacts');
  }
});

module.exports = router;
