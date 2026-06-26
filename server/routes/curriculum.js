const express = require('express');
const { getDb } = require('../db');

const router = express.Router();

// Get full curriculum: education levels, grades, and subjects mapped by grade
router.get('/', (req, res) => {
  try {
    const db = getDb();

    const levels = db.prepare('SELECT * FROM education_levels ORDER BY id').all();

    const grades = db.prepare(`
      SELECT g.*, el.code as level_code, el.name as level_name
      FROM grades g
      JOIN education_levels el ON g.education_level_id = el.id
      ORDER BY g.display_order
    `).all();

    const subjects = db.prepare('SELECT * FROM subjects ORDER BY category, name').all();

    // Grade-subject mapping: for each grade, get its subjects
    const curriculum = grades.map(grade => {
      const gradeSubjects = db.prepare(`
        SELECT s.id, s.code, s.name, s.category
        FROM grade_subjects gs
        JOIN subjects s ON gs.subject_id = s.id
        WHERE gs.grade_id = ?
        ORDER BY s.category, s.name
      `).all(grade.id);

      return {
        ...grade,
        subjects: gradeSubjects
      };
    });

    res.json({ levels, grades, subjects, curriculum });
  } catch (err) {
    console.error('Error fetching curriculum:', err);
    res.status(500).json({ error: 'Failed to fetch curriculum' });
  }
});

module.exports = router;
