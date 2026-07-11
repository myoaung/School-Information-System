const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── Lifecycle Constants ────────────────────────────────────────
const ALL_STATUSES = [
  'applicant',
  'approved',
  'active',
  'suspended',
  'graduated',
  'transferred',
  'withdrawn',
  'archived',
];

const VALID_TRANSITIONS = {
  applicant: ['approved', 'withdrawn'],
  approved: ['active', 'withdrawn'],
  active: ['suspended', 'graduated', 'transferred', 'withdrawn'],
  suspended: ['active', 'withdrawn'],
  graduated: ['archived'],
  transferred: ['archived'],
  withdrawn: ['archived'],
};

// ─── Lifecycle Summary (must be before /:id routes) ─────────────
router.get('/lifecycle/summary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const counts = await db.all(`SELECT status, COUNT(*) as count FROM students GROUP BY status`);

    const summary = {};
    ALL_STATUSES.forEach((s) => {
      summary[s] = 0;
    });
    counts.forEach((r) => {
      summary[r.status] = r.count;
    });

    res.json({ summary, total: counts.reduce((sum, r) => sum + r.count, 0) });
  } catch (err) {
    sendError(res, err, 'Failed to fetch lifecycle summary');
  }
});

// Get all students (admin/teacher)
router.get('/', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { search, grade_id, status } = req.query;

    let where = ['u.role = ?'];
    let params = ['student'];

    if (search) {
      where.push('(u.name LIKE ? OR s.student_id LIKE ? OR u.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (grade_id) {
      where.push('s.grade_id = ?');
      params.push(grade_id);
    }
    if (status) {
      where.push('s.status = ?');
      params.push(status);
    }

    const students = await db.all(
      `
      SELECT u.id, u.name, u.email, u.created_at,
        s.id as profile_id, s.student_id, s.grade_id, s.section, s.status,
        s.date_of_birth, s.gender, s.phone, s.parent_name, s.parent_phone,
        s.photo_url, s.blood_type, s.allergies,
        g.name as grade_name, el.name as level_name
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN grades g ON s.grade_id = g.id
      LEFT JOIN education_levels el ON g.education_level_id = el.id
      WHERE ${where.join(' AND ')}
      ORDER BY u.name
    `,
      params
    );

    res.json({ students });
  } catch (err) {
    sendError(res, err, 'Failed to fetch students');
  }
});

// Get single student (admin/teacher/self)
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    // Allow self-access or admin/teacher
    if (req.user.role === 'student' && req.user.id !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const student = await db.get(
      `
      SELECT u.id, u.name, u.email, u.created_at,
        s.id as profile_id, s.student_id, s.grade_id, s.section, s.status,
        s.date_of_birth, s.gender, s.phone, s.address,
        s.emergency_contact, s.emergency_phone,
        s.parent_name, s.parent_phone, s.parent_email, s.enrolled_at,
        s.photo_url, s.blood_type, s.allergies,
        g.name as grade_name, el.name as level_name
      FROM users u
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN grades g ON s.grade_id = g.id
      LEFT JOIN education_levels el ON g.education_level_id = el.id
      WHERE u.id = ?
    `,
      [id]
    );

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get enrollments
    const enrollments = await db.all(
      `
      SELECT c.id, c.name, c.schedule, c.room
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE e.student_id = ?
    `,
      [id]
    );

    // Get attendance summary
    const attendance = await db.all(
      `
      SELECT status, COUNT(*) as count
      FROM attendance WHERE user_id = ?
      GROUP BY status
    `,
      [id]
    );

    res.json({ student: { ...student, enrollments, attendance } });
  } catch (err) {
    sendError(res, err, 'Failed to fetch student');
  }
});

// Create student (admin only)
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      grade_id,
      section,
      date_of_birth,
      gender,
      phone,
      address,
      parent_name,
      parent_phone,
      parent_email,
      photo_url,
      blood_type,
      allergies,
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if email exists
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userResult = await db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, 'student']
    );
    const userId = userResult.lastInsertRowid;

    // Generate student ID
    const countRow = await db.get('SELECT COUNT(*) as c FROM students');
    const count = countRow?.c || 0;
    const studentId = `STU-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // Create student profile
    await db.run(
      `
      INSERT INTO students (user_id, student_id, grade_id, section, date_of_birth, gender, phone, address, parent_name, parent_phone, parent_email, photo_url, blood_type, allergies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        userId,
        studentId,
        grade_id || null,
        section || 'A',
        date_of_birth || null,
        gender || null,
        phone || null,
        address || null,
        parent_name || null,
        parent_phone || null,
        parent_email || null,
        photo_url || null,
        blood_type || null,
        allergies || null,
      ]
    );

    res.status(201).json({
      message: 'Student created',
      student: { id: userId, name, email, student_id: studentId },
    });

    auditLog(req, {
      action: 'create',
      entityType: 'student',
      entityId: userId,
      newValues: { name, email, grade_id, student_id: studentId },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create student');
  }
});

// Update student (admin only)
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const {
      name,
      grade_id,
      section,
      date_of_birth,
      gender,
      phone,
      address,
      emergency_contact,
      emergency_phone,
      parent_name,
      parent_phone,
      parent_email,
      status,
      photo_url,
      blood_type,
      allergies,
    } = req.body;

    const user = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'student']);
    if (!user) return res.status(404).json({ error: 'Student not found' });

    if (name) await db.run('UPDATE users SET name = ? WHERE id = ?', [name, userId]);

    const profile = await db.get('SELECT * FROM students WHERE user_id = ?', [userId]);
    if (profile) {
      await db.run(
        `
        UPDATE students SET grade_id = ?, section = ?, date_of_birth = ?, gender = ?,
        phone = ?, address = ?, emergency_contact = ?, emergency_phone = ?,
        parent_name = ?, parent_phone = ?, parent_email = ?, status = ?,
        photo_url = ?, blood_type = ?, allergies = ?
        WHERE user_id = ?
      `,
        [
          grade_id ?? profile.grade_id,
          section ?? profile.section,
          date_of_birth ?? profile.date_of_birth,
          gender ?? profile.gender,
          phone ?? profile.phone,
          address ?? profile.address,
          emergency_contact ?? profile.emergency_contact,
          emergency_phone ?? profile.emergency_phone,
          parent_name ?? profile.parent_name,
          parent_phone ?? profile.parent_phone,
          parent_email ?? profile.parent_email,
          status ?? profile.status,
          photo_url ?? profile.photo_url,
          blood_type ?? profile.blood_type,
          allergies ?? profile.allergies,
          userId,
        ]
      );
    }

    res.json({ message: 'Student updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'student',
      entityId: userId,
      newValues: { name, grade_id, status },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update student');
  }
});

// ─── Student Lifecycle ──────────────────────────────────────────

// Change student status (admin only)
router.post('/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { status: newStatus, reason } = req.body;

    if (!newStatus) return res.status(400).json({ error: 'Status is required' });
    if (!ALL_STATUSES.includes(newStatus)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be one of: ${ALL_STATUSES.join(', ')}` });
    }

    const profile = await db.get(
      `SELECT s.status, s.id as profile_id FROM students s WHERE s.user_id = ?`,
      [userId]
    );
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const currentStatus = profile.status;

    // Check if status is actually changing
    if (currentStatus === newStatus) {
      return res.status(400).json({ error: 'Student already has this status' });
    }

    // Validate transition (allow if no transition defined — backward compatible)
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (allowed && !allowed.includes(newStatus)) {
      return res.status(400).json({
        error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      });
    }

    // Require reason for certain transitions
    const requiresReason = ['graduated', 'transferred', 'withdrawn', 'archived'];
    if (requiresReason.includes(newStatus) && !reason) {
      return res.status(400).json({ error: `Reason is required for '${newStatus}' status` });
    }

    // Update status
    await db.run('UPDATE students SET status = ? WHERE user_id = ?', [newStatus, userId]);

    // Record history
    await db.run(
      `INSERT INTO student_status_history (student_id, from_status, to_status, reason, changed_by)
       VALUES (?, ?, ?, ?, ?)`,
      [profile.profile_id, currentStatus, newStatus, reason || null, req.user.id]
    );

    res.json({
      message: `Status changed from '${currentStatus}' to '${newStatus}'`,
      status: newStatus,
    });

    auditLog(req, {
      action: 'status_change',
      entityType: 'student',
      entityId: userId,
      oldValues: { status: currentStatus },
      newValues: { status: newStatus, reason },
    });
  } catch (err) {
    sendError(res, err, 'Failed to change student status');
  }
});

// Get student status history
router.get('/:id/status-history', authMiddleware, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const profile = await db.get('SELECT id FROM students WHERE user_id = ?', [userId]);
    if (!profile) return res.status(404).json({ error: 'Student not found' });

    const history = await db.all(
      `SELECT h.*, u.name as changed_by_name
       FROM student_status_history h
       LEFT JOIN users u ON h.changed_by = u.id
       WHERE h.student_id = ?
       ORDER BY h.created_at DESC`,
      [profile.id]
    );

    res.json({ history });
  } catch (err) {
    sendError(res, err, 'Failed to fetch status history');
  }
});

// Delete student (admin only)
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await db.get('SELECT * FROM users WHERE id = ? AND role = ?', [userId, 'student']);
    if (!user) return res.status(404).json({ error: 'Student not found' });

    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    res.json({ message: 'Student deleted' });

    auditLog(req, { action: 'delete', entityType: 'student', entityId: userId });
  } catch (err) {
    sendError(res, err, 'Failed to delete student');
  }
});

module.exports = router;
