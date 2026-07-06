const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all academic years
router.get('/years', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const years = db.prepare('SELECT * FROM academic_years ORDER BY start_date DESC').all();
    res.json({ years });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch academic years' });
  }
});

// Create academic year (admin)
router.post('/years', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { name, start_date, end_date, is_current } = req.body;
    if (!name || !start_date || !end_date) return res.status(400).json({ error: 'Name, start_date, end_date required' });
    if (is_current) db.prepare('UPDATE academic_years SET is_current = 0').run();
    const result = db.prepare('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)').run(name, start_date, end_date, is_current ? 1 : 0);
    res.status(201).json({ message: 'Academic year created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create academic year' });
  }
});

// Delete academic year (admin)
router.delete('/years/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM academic_years WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete academic year' });
  }
});

// Get semesters
router.get('/semesters', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { year_id } = req.query;
    let semesters;
    if (year_id) {
      semesters = db.prepare('SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.academic_year_id = ? ORDER BY s.start_date').all(year_id);
    } else {
      semesters = db.prepare('SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id ORDER BY s.start_date DESC').all();
    }
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch semesters' });
  }
});

// Create semester (admin)
router.post('/semesters', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { academic_year_id, name, start_date, end_date, is_current } = req.body;
    if (!academic_year_id || !name || !start_date || !end_date) return res.status(400).json({ error: 'All fields required' });
    if (is_current) db.prepare('UPDATE semesters SET is_current = 0').run();
    const result = db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run(academic_year_id, name, start_date, end_date, is_current ? 1 : 0);
    res.status(201).json({ message: 'Semester created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create semester' });
  }
});

// Delete semester (admin)
router.delete('/semesters/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM semesters WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete semester' });
  }
});

// Get holidays
router.get('/holidays', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { year_id } = req.query;
    let holidays;
    if (year_id) {
      holidays = db.prepare('SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id WHERE h.academic_year_id = ? ORDER BY h.date').all(year_id);
    } else {
      holidays = db.prepare('SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id ORDER BY h.date DESC').all();
    }
    res.json({ holidays });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch holidays' });
  }
});

// Create holiday (admin)
router.post('/holidays', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const { academic_year_id, name, date, type } = req.body;
    if (!academic_year_id || !name || !date) return res.status(400).json({ error: 'academic_year_id, name, and date required' });
    const result = db.prepare('INSERT INTO holidays (academic_year_id, name, date, type) VALUES (?, ?, ?, ?)').run(academic_year_id, name, date, type || 'school');
    res.status(201).json({ message: 'Holiday created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create holiday' });
  }
});

// Delete holiday (admin)
router.delete('/holidays/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM holidays WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete holiday' });
  }
});

module.exports = router;
