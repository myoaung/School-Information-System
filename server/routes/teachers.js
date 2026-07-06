const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all teachers (admin)
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { search } = req.query;

    let where = ["u.role = 'teacher'"];
    let params = [];

    if (search) {
      where.push('(u.name LIKE ? OR t.teacher_id LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const teachers = await db.all(`
      SELECT u.id, u.name, u.email, u.created_at,
        t.id as profile_id, t.teacher_id, t.phone, t.qualification,
        t.specialization, t.hire_date, t.status
      FROM users u
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE ${where.join(' AND ')}
      ORDER BY u.name
    `, params);

    res.json({ teachers });
  } catch (err) {
    console.error('Error fetching teachers:', err);
    res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// Get single teacher
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (req.user.role === 'teacher' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const teacher = await db.get(`
      SELECT u.id, u.name, u.email, u.created_at,
        t.id as profile_id, t.teacher_id, t.phone, t.qualification,
        t.specialization, t.hire_date, t.status
      FROM users u
      LEFT JOIN teachers t ON t.user_id = u.id
      WHERE u.id = ?
    `, [id]);

    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Get classes taught
    const classes = await db.all(`
      SELECT id, name, schedule, room FROM classes WHERE teacher_id = ?
    `, [id]);

    res.json({ teacher: { ...teacher, classes } });
  } catch (err) {
    console.error('Error fetching teacher:', err);
    res.status(500).json({ error: 'Failed to fetch teacher' });
  }
});

// Create teacher (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { name, email, password, phone, qualification, specialization, hire_date } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);
    const userResult = await db.run('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)', [email, hashedPassword, name, 'teacher']);
    const userId = userResult.lastInsertRowid;

    const countResult = await db.get('SELECT COUNT(*) as c FROM teachers');
    const count = countResult.c;
    const teacherId = `TCH-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    await db.run(`
      INSERT INTO teachers (user_id, teacher_id, phone, qualification, specialization, hire_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, teacherId, phone || null, qualification || null, specialization || null, hire_date || null]);

    res.status(201).json({ message: 'Teacher created', teacher: { id: userId, name, email, teacher_id: teacherId } });
  } catch (err) {
    console.error('Error creating teacher:', err);
    res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// Update teacher (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { name, phone, qualification, specialization, status } = req.body;

    const user = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'teacher']);
    if (!user) return res.status(404).json({ error: 'Teacher not found' });

    if (name) await db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId]);

    const profile = await db.get('SELECT * FROM teachers WHERE user_id = ?', [userId]);
    if (profile) {
      await db.run(`
        UPDATE teachers SET phone = ?, qualification = ?, specialization = ?, status = ?
        WHERE user_id = ?
      `,
        [phone ?? profile.phone, qualification ?? profile.qualification,
        specialization ?? profile.specialization, status ?? profile.status,
        userId]
      );
    }

    res.json({ message: 'Teacher updated' });
  } catch (err) {
    console.error('Error updating teacher:', err);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'teacher']);
    if (!user) return res.status(404).json({ error: 'Teacher not found' });

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Teacher deleted' });
  } catch (err) {
    console.error('Error deleting teacher:', err);
    res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

module.exports = router;
