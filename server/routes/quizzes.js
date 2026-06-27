const express = require('express');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all quizzes (optionally by course)
router.get('/', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { course_id } = req.query;
    let where = '';
    let params = [];
    if (course_id) { where = 'WHERE q.course_id = ?'; params.push(course_id); }
    const quizzes = db.prepare(`
      SELECT q.*, c.title as course_title, u.name as created_by_name
      FROM quizzes q
      LEFT JOIN courses c ON q.course_id = c.id
      LEFT JOIN users u ON q.created_by = u.id
      ${where} ORDER BY q.due_date DESC
    `).all(...params);
    res.json({ quizzes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Get single quiz with questions
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const quiz = db.prepare(`
      SELECT q.*, c.title as course_title FROM quizzes q LEFT JOIN courses c ON q.course_id = c.id WHERE q.id = ?
    `).get(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY question_order').all(req.params.id);

    // Get student's attempts if student
    let attempts = [];
    if (req.user.role === 'student') {
      attempts = db.prepare('SELECT * FROM quiz_attempts WHERE quiz_id = ? AND student_id = ? ORDER BY started_at DESC').all(req.params.id, req.user.id);
    } else {
      attempts = db.prepare(`
        SELECT qa.*, u.name as student_name FROM quiz_attempts qa JOIN users u ON qa.student_id = u.id WHERE qa.quiz_id = ? ORDER BY qa.started_at DESC
      `).all(req.params.id);
    }

    res.json({ quiz: { ...quiz, questions, attempts } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch quiz' });
  }
});

// Create quiz (admin/teacher)
router.post('/', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { course_id, title, description, time_limit_minutes, max_score, due_date } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id and title required' });
    const result = db.prepare('INSERT INTO quizzes (course_id, title, description, time_limit_minutes, max_score, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)').run(course_id, title, description || null, time_limit_minutes || null, max_score || 100, due_date || null, req.user.id);
    res.status(201).json({ message: 'Quiz created', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create quiz' });
  }
});

// Add question to quiz (admin/teacher)
router.post('/:id/questions', authMiddleware, roleMiddleware('admin', 'teacher'), (req, res) => {
  try {
    const db = getDb();
    const { question_text, question_type, options, correct_answer, points, question_order } = req.body;
    if (!question_text || !question_type) return res.status(400).json({ error: 'question_text and question_type required' });
    const result = db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)').run(req.params.id, question_text, question_type, options ? (typeof options === 'string' ? options : JSON.stringify(options)) : null, correct_answer || null, points || 1, question_order || 0);
    res.status(201).json({ message: 'Question added', id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add question' });
  }
});

// Submit quiz attempt (student)
router.post('/:id/attempt', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { answers } = req.body;
    const quiz = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(req.params.id);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const questions = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?').all(req.params.id);

    // Auto-grade MCQ and true_false
    let score = 0;
    const parsedAnswers = typeof answers === 'string' ? JSON.parse(answers) : answers;
    for (const q of questions) {
      const userAnswer = parsedAnswers[q.id];
      if (userAnswer && q.correct_answer && (q.question_type === 'mcq' || q.question_type === 'true_false')) {
        if (userAnswer === q.correct_answer) score += q.points;
      }
    }

    const result = db.prepare('INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, completed_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)').run(req.params.id, req.user.id, typeof answers === 'string' ? answers : JSON.stringify(answers), score);
    res.status(201).json({ message: 'Quiz submitted', id: result.lastInsertRowid, score, max_score: quiz.max_score });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
