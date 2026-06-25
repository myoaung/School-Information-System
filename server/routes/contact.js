const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Submit contact form
router.post('/', (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    const db = getDb();
    const result = db.prepare(
      'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)'
    ).run(name, email, subject, message);

    res.status(201).json({
      message: 'Contact form submitted successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    console.error('Error submitting contact form:', err);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Get all contacts (admin only - for future use)
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const contacts = db.prepare('SELECT * FROM contacts ORDER BY created_at DESC').all();

    res.json({ contacts });
  } catch (err) {
    console.error('Error fetching contacts:', err);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
