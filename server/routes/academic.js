const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// Get all academic years
router.get('/years', authMiddleware, async (req, res) => {
  try {
    const years = await db.all('SELECT * FROM academic_years ORDER BY start_date DESC');
    res.json({ years });
  } catch (err) {
    sendError(res, err, 'Failed to fetch academic years');
  }
});

// Create academic year (admin)
router.post('/years', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body;
    if (!name || !start_date || !end_date) return res.status(400).json({ error: 'Name, start_date, end_date required' });
    if (is_current) await db.run('UPDATE academic_years SET is_current = 0');
    const result = await db.run('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)', [name, start_date, end_date, is_current ? 1 : 0]);
    res.status(201).json({ message: 'Academic year created', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to create academic year');
  }
});

// Delete academic year (admin)
router.delete('/years/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await db.run('DELETE FROM academic_years WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete academic year');
  }
});

// Get semesters
router.get('/semesters', authMiddleware, async (req, res) => {
  try {
    const { year_id } = req.query;
    let semesters;
    if (year_id) {
      semesters = await db.all('SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.academic_year_id = ? ORDER BY s.start_date', [year_id]);
    } else {
      semesters = await db.all('SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id ORDER BY s.start_date DESC');
    }
    res.json({ semesters });
  } catch (err) {
    sendError(res, err, 'Failed to fetch semesters');
  }
});

// Create semester (admin)
router.post('/semesters', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { academic_year_id, name, start_date, end_date, is_current } = req.body;
    if (!academic_year_id || !name || !start_date || !end_date) return res.status(400).json({ error: 'All fields required' });
    if (is_current) await db.run('UPDATE semesters SET is_current = 0');
    const result = await db.run('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)', [academic_year_id, name, start_date, end_date, is_current ? 1 : 0]);
    res.status(201).json({ message: 'Semester created', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to create semester');
  }
});

// Delete semester (admin)
router.delete('/semesters/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await db.run('DELETE FROM semesters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete semester');
  }
});

// Get holidays
router.get('/holidays', authMiddleware, async (req, res) => {
  try {
    const { year_id } = req.query;
    let holidays;
    if (year_id) {
      holidays = await db.all('SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id WHERE h.academic_year_id = ? ORDER BY h.date', [year_id]);
    } else {
      holidays = await db.all('SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id ORDER BY h.date DESC');
    }
    res.json({ holidays });
  } catch (err) {
    sendError(res, err, 'Failed to fetch holidays');
  }
});

// Create holiday (admin)
router.post('/holidays', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { academic_year_id, name, date, type } = req.body;
    if (!academic_year_id || !name || !date) return res.status(400).json({ error: 'academic_year_id, name, and date required' });
    const result = await db.run('INSERT INTO holidays (academic_year_id, name, date, type) VALUES (?, ?, ?, ?)', [academic_year_id, name, date, type || 'school']);
    res.status(201).json({ message: 'Holiday created', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to create holiday');
  }
});

// Delete holiday (admin)
router.delete('/holidays/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await db.run('DELETE FROM holidays WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete holiday');
  }
});

module.exports = router;
