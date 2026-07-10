const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// Get full curriculum: education levels, grades, and subjects mapped by grade
// GET / remains public so students/parents can view curriculum
router.get('/', async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    const levels = await db.all('SELECT * FROM education_levels ORDER BY id');

    const grades = await db.all(`
      SELECT g.*, el.code as level_code, el.name as level_name
      FROM grades g
      JOIN education_levels el ON g.education_level_id = el.id
      ORDER BY g.display_order
    `);

    const subjects = await db.all('SELECT * FROM subjects ORDER BY category, name');

    // Grade-subject mapping: for each grade, get its subjects
    const curriculum = await Promise.all(
      grades.map(async (grade) => {
        let gradeSubjectsSql = `
        SELECT s.id, s.code, s.name, s.category,
               gs.id as gs_id, gs.weekly_periods, gs.is_required, gs.academic_year_id
        FROM grade_subjects gs
        JOIN subjects s ON gs.subject_id = s.id
        WHERE gs.grade_id = ?
      `;
        const params = [grade.id];

        if (academic_year_id) {
          gradeSubjectsSql += ' AND gs.academic_year_id = ?';
          params.push(academic_year_id);
        }

        gradeSubjectsSql += ' ORDER BY s.category, s.name';

        const gradeSubjects = await db.all(gradeSubjectsSql, params);

        return {
          ...grade,
          subjects: gradeSubjects,
        };
      })
    );

    res.json({ levels, grades, subjects, curriculum });
  } catch (err) {
    sendError(res, err, 'Failed to fetch curriculum');
  }
});

// Copy previous year's curriculum to new year (admin only)
// Must be before /:id routes to avoid matching "copy" as an id
router.post('/copy', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { from_year_id, to_year_id } = req.body;
    if (!from_year_id || !to_year_id) {
      return res.status(400).json({ error: 'from_year_id and to_year_id required' });
    }

    // Copy all grade_subjects from one year to another
    const entries = await db.all(
      'SELECT grade_id, subject_id, weekly_periods, is_required FROM grade_subjects WHERE academic_year_id = ?',
      [from_year_id]
    );

    let copied = 0;
    for (const entry of entries) {
      try {
        await db.run(
          'INSERT INTO grade_subjects (grade_id, subject_id, academic_year_id, weekly_periods, is_required) VALUES (?, ?, ?, ?, ?)',
          [entry.grade_id, entry.subject_id, to_year_id, entry.weekly_periods, entry.is_required]
        );
        copied++;
      } catch (e) {
        // Skip duplicates
      }
    }

    res.json({ message: `Copied ${copied} curriculum entries`, copied });
  } catch (err) {
    sendError(res, err, 'Failed to copy curriculum');
  }
});

// Create grade-subject mapping (admin only)
router.post('/', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { grade_id, subject_id, academic_year_id, weekly_periods, is_required } = req.body;
    const result = await db.run(
      'INSERT INTO grade_subjects (grade_id, subject_id, academic_year_id, weekly_periods, is_required) VALUES (?, ?, ?, ?, ?)',
      [grade_id, subject_id, academic_year_id || null, weekly_periods || 1, is_required ?? 1]
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Curriculum entry created' });
  } catch (err) {
    sendError(res, err, 'Failed to create curriculum entry');
  }
});

// Update mapping (admin only)
router.put('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { weekly_periods, is_required } = req.body;
    await db.run('UPDATE grade_subjects SET weekly_periods = ?, is_required = ? WHERE id = ?', [
      weekly_periods,
      is_required,
      id,
    ]);
    res.json({ message: 'Curriculum entry updated' });
  } catch (err) {
    sendError(res, err, 'Failed to update curriculum entry');
  }
});

// Remove mapping (admin only)
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    await db.run('DELETE FROM grade_subjects WHERE id = ?', [id]);
    res.json({ message: 'Curriculum entry deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete curriculum entry');
  }
});

module.exports = router;
