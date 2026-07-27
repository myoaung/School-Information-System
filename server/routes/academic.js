const express = require('express');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
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
router.post('/years', authMiddleware, requirePermission('academic', 'create'), async (req, res) => {
  try {
    const { name, start_date, end_date, is_current } = req.body;
    if (!name || !start_date || !end_date)
      return res.status(400).json({ error: 'Name, start_date, end_date required' });
    if (is_current) await db.run('UPDATE academic_years SET is_current = 0');
    const result = await db.run(
      'INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)',
      [name, start_date, end_date, is_current ? 1 : 0]
    );
    res.status(201).json({ message: 'Academic year created', id: result.lastInsertRowid });
  } catch (err) {
    sendError(res, err, 'Failed to create academic year');
  }
});

// Update academic year (admin)
router.put(
  '/years/:id',
  authMiddleware,
  requirePermission('academic', 'update'),
  async (req, res) => {
    try {
      const { name, start_date, end_date, is_current } = req.body;
      const existing = await db.get('SELECT * FROM academic_years WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Academic year not found' });
      if (is_current) await db.run('UPDATE academic_years SET is_current = 0');
      await db.run(
        'UPDATE academic_years SET name = ?, start_date = ?, end_date = ?, is_current = ? WHERE id = ?',
        [
          name ?? existing.name,
          start_date ?? existing.start_date,
          end_date ?? existing.end_date,
          is_current ? 1 : is_current === false ? 0 : existing.is_current,
          req.params.id,
        ]
      );
      res.json({ message: 'Academic year updated' });
    } catch (err) {
      sendError(res, err, 'Failed to update academic year');
    }
  }
);

// Delete academic year (admin)
router.delete(
  '/years/:id',
  authMiddleware,
  requirePermission('academic', 'delete'),
  async (req, res) => {
    try {
      await db.run('DELETE FROM academic_years WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (err) {
      sendError(res, err, 'Failed to delete academic year');
    }
  }
);

// Get semesters
router.get('/semesters', authMiddleware, async (req, res) => {
  try {
    const { year_id } = req.query;
    let semesters;
    if (year_id) {
      semesters = await db.all(
        'SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id WHERE s.academic_year_id = ? ORDER BY s.start_date',
        [year_id]
      );
    } else {
      semesters = await db.all(
        'SELECT s.*, ay.name as year_name FROM semesters s JOIN academic_years ay ON s.academic_year_id = ay.id ORDER BY s.start_date DESC'
      );
    }
    res.json({ semesters });
  } catch (err) {
    sendError(res, err, 'Failed to fetch semesters');
  }
});

// Create semester (admin)
router.post(
  '/semesters',
  authMiddleware,
  requirePermission('academic', 'create'),
  async (req, res) => {
    try {
      const { academic_year_id, name, start_date, end_date, is_current } = req.body;
      if (!academic_year_id || !name || !start_date || !end_date)
        return res.status(400).json({ error: 'All fields required' });
      if (is_current) await db.run('UPDATE semesters SET is_current = 0');
      const result = await db.run(
        'INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)',
        [academic_year_id, name, start_date, end_date, is_current ? 1 : 0]
      );
      res.status(201).json({ message: 'Semester created', id: result.lastInsertRowid });
    } catch (err) {
      sendError(res, err, 'Failed to create semester');
    }
  }
);

// Update semester (admin)
router.put(
  '/semesters/:id',
  authMiddleware,
  requirePermission('academic', 'update'),
  async (req, res) => {
    try {
      const { name, start_date, end_date, is_current } = req.body;
      const existing = await db.get('SELECT * FROM semesters WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Semester not found' });
      if (is_current) await db.run('UPDATE semesters SET is_current = 0');
      await db.run(
        'UPDATE semesters SET name = ?, start_date = ?, end_date = ?, is_current = ? WHERE id = ?',
        [
          name ?? existing.name,
          start_date ?? existing.start_date,
          end_date ?? existing.end_date,
          is_current ? 1 : is_current === false ? 0 : existing.is_current,
          req.params.id,
        ]
      );
      res.json({ message: 'Semester updated' });
    } catch (err) {
      sendError(res, err, 'Failed to update semester');
    }
  }
);

// Delete semester (admin)
router.delete(
  '/semesters/:id',
  authMiddleware,
  requirePermission('academic', 'delete'),
  async (req, res) => {
    try {
      await db.run('DELETE FROM semesters WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (err) {
      sendError(res, err, 'Failed to delete semester');
    }
  }
);

// Get holidays
router.get('/holidays', authMiddleware, async (req, res) => {
  try {
    const { year_id } = req.query;
    let holidays;
    if (year_id) {
      holidays = await db.all(
        'SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id WHERE h.academic_year_id = ? ORDER BY h.date',
        [year_id]
      );
    } else {
      holidays = await db.all(
        'SELECT h.*, ay.name as year_name FROM holidays h JOIN academic_years ay ON h.academic_year_id = ay.id ORDER BY h.date DESC'
      );
    }
    res.json({ holidays });
  } catch (err) {
    sendError(res, err, 'Failed to fetch holidays');
  }
});

// Create holiday (admin)
router.post(
  '/holidays',
  authMiddleware,
  requirePermission('academic', 'create'),
  async (req, res) => {
    try {
      const { academic_year_id, name, date, type } = req.body;
      if (!academic_year_id || !name || !date)
        return res.status(400).json({ error: 'academic_year_id, name, and date required' });
      const result = await db.run(
        'INSERT INTO holidays (academic_year_id, name, date, type) VALUES (?, ?, ?, ?)',
        [academic_year_id, name, date, type || 'school']
      );
      res.status(201).json({ message: 'Holiday created', id: result.lastInsertRowid });
    } catch (err) {
      sendError(res, err, 'Failed to create holiday');
    }
  }
);

// Update holiday (admin)
router.put(
  '/holidays/:id',
  authMiddleware,
  requirePermission('academic', 'update'),
  async (req, res) => {
    try {
      const { name, date, type } = req.body;
      const existing = await db.get('SELECT * FROM holidays WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Holiday not found' });
      await db.run('UPDATE holidays SET name = ?, date = ?, type = ? WHERE id = ?', [
        name ?? existing.name,
        date ?? existing.date,
        type ?? existing.type,
        req.params.id,
      ]);
      res.json({ message: 'Holiday updated' });
    } catch (err) {
      sendError(res, err, 'Failed to update holiday');
    }
  }
);

// Delete holiday (admin)
router.delete(
  '/holidays/:id',
  authMiddleware,
  requirePermission('academic', 'delete'),
  async (req, res) => {
    try {
      await db.run('DELETE FROM holidays WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });
    } catch (err) {
      sendError(res, err, 'Failed to delete holiday');
    }
  }
);

module.exports = router;
