const express = require('express');
const { db } = require('../data');

const router = express.Router();

// Get full curriculum: education levels, grades, and subjects mapped by grade
router.get('/', async (req, res) => {
  try {
    const levels = await db.all('SELECT * FROM education_levels ORDER BY id');

    const grades = await db.all(`
      SELECT g.*, el.code as level_code, el.name as level_name
      FROM grades g
      JOIN education_levels el ON g.education_level_id = el.id
      ORDER BY g.display_order
    `);

    const subjects = await db.all('SELECT * FROM subjects ORDER BY category, name');

    // Grade-subject mapping: for each grade, get its subjects
    const curriculum = await Promise.all(grades.map(async (grade) => {
      const gradeSubjects = await db.all(`
        SELECT s.id, s.code, s.name, s.category
        FROM grade_subjects gs
        JOIN subjects s ON gs.subject_id = s.id
        WHERE gs.grade_id = ?
        ORDER BY s.category, s.name
      `, [grade.id]);

      return {
        ...grade,
        subjects: gradeSubjects
      };
    }));

    res.json({ levels, grades, subjects, curriculum });
  } catch (err) {
    console.error('Error fetching curriculum:', err);
    res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
});

module.exports = router;
