const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// ─── Admin: List all registration periods ─────────────────────────
router.get('/periods', authMiddleware, requirePermission('students', 'read'), async (req, res) => {
  try {
    const periods = await db.all(
      `SELECT rp.*, g.name as grade_name, ay.name as year_name
         FROM registration_periods rp
         LEFT JOIN grades g ON rp.grade_id = g.id
         LEFT JOIN academic_years ay ON rp.academic_year_id = ay.id
         ORDER BY g.display_order, g.name`
    );
    res.json({ periods });
  } catch (err) {
    sendError(res, err, 'Failed to fetch registration periods');
  }
});

// ─── Admin: Create/update registration period ─────────────────────
router.post(
  '/periods',
  authMiddleware,
  requirePermission('students', 'create'),
  async (req, res) => {
    try {
      const { grade_id, academic_year_id, start_date, end_date, max_seats, status } = req.body;

      if (!grade_id || !start_date || !end_date) {
        return res.status(400).json({ error: 'Grade, start date, and end date are required' });
      }

      if (max_seats !== undefined && max_seats < 1) {
        return res.status(400).json({ error: 'Max seats must be at least 1' });
      }

      const existing = await db.get(
        'SELECT id FROM registration_periods WHERE grade_id = ? AND (academic_year_id = ? OR (academic_year_id IS NULL AND ? IS NULL))',
        [grade_id, academic_year_id || null, academic_year_id || null]
      );

      if (existing) {
        await db.run(
          `UPDATE registration_periods SET start_date = ?, end_date = ?, max_seats = ?, status = ?
           WHERE id = ?`,
          [start_date, end_date, max_seats || 50, status || 'open', existing.id]
        );
        const updated = await db.get('SELECT * FROM registration_periods WHERE id = ?', [
          existing.id,
        ]);
        return res.json({ message: 'Registration period updated', period: updated });
      }

      const result = await db.run(
        `INSERT INTO registration_periods (grade_id, academic_year_id, start_date, end_date, max_seats, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          grade_id,
          academic_year_id || null,
          start_date,
          end_date,
          max_seats || 50,
          status || 'open',
        ]
      );

      const period = await db.get('SELECT * FROM registration_periods WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Registration period created', period });
    } catch (err) {
      sendError(res, err, 'Failed to save registration period');
    }
  }
);

// ─── Admin: Delete registration period ────────────────────────────
router.delete(
  '/periods/:id',
  authMiddleware,
  requirePermission('students', 'delete'),
  async (req, res) => {
    try {
      const existing = await db.get('SELECT id FROM registration_periods WHERE id = ?', [
        req.params.id,
      ]);
      if (!existing) return res.status(404).json({ error: 'Period not found' });

      await db.run('DELETE FROM registration_periods WHERE id = ?', [req.params.id]);
      res.json({ message: 'Registration period deleted' });
    } catch (err) {
      sendError(res, err, 'Failed to delete registration period');
    }
  }
);

// ─── Public: List open registration periods (for the form) ────────
router.get('/open', async (req, res) => {
  try {
    const periods = await db.all(
      `SELECT rp.grade_id, g.name as grade_name, rp.max_seats, rp.current_seats, rp.end_date
       FROM registration_periods rp
       LEFT JOIN grades g ON rp.grade_id = g.id
       WHERE rp.status = 'open'
       ORDER BY g.display_order, g.name`
    );
    res.json({ periods });
  } catch (err) {
    sendError(res, err, 'Failed to fetch open periods');
  }
});

// ─── Public: Check grade availability ─────────────────────────────
router.get('/check/:gradeId', async (req, res) => {
  try {
    const gradeId = parseInt(req.params.gradeId);
    const now = new Date().toISOString();

    const period = await db.get(
      `SELECT rp.*, g.name as grade_name
       FROM registration_periods rp
       LEFT JOIN grades g ON rp.grade_id = g.id
       WHERE rp.grade_id = ? AND rp.status = 'open'`,
      [gradeId]
    );

    if (!period) {
      return res.json({ available: false, reason: 'Registration not open for this grade' });
    }

    if (now < period.start_date) {
      return res.json({ available: false, reason: `Registration starts on ${period.start_date}` });
    }

    if (now > period.end_date) {
      return res.json({ available: false, reason: 'Registration period has ended' });
    }

    const seatsLeft = period.max_seats - period.current_seats;
    if (seatsLeft <= 0) {
      return res.json({ available: false, reason: 'No seats available', seatsLeft: 0 });
    }

    res.json({
      available: true,
      gradeName: period.grade_name,
      seatsLeft,
      maxSeats: period.max_seats,
      endDate: period.end_date,
    });
  } catch (err) {
    sendError(res, err, 'Failed to check registration');
  }
});

// ─── Public: Submit registration ──────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      full_name_mm,
      phone,
      date_of_birth,
      gender,
      nationality,
      ethnicity,
      religion,
      nrc_no,
      birth_cert_no,
      blood_type,
      photo_url,
      grade_id,
      enrollment_type,
      prev_school_name,
      prev_school_location,
      prev_grade_completed,
      transfer_cert_no,
      transfer_cert_date,
      father_name,
      father_nrc,
      father_occupation,
      father_phone,
      father_email,
      mother_name,
      mother_nrc,
      mother_occupation,
      mother_phone,
      mother_email,
      guardian_name,
      guardian_relationship,
      guardian_nrc,
      guardian_phone,
      guardian_email,
      emergency_contact_name,
      emergency_relationship,
      emergency_phone2,
      house_no,
      street,
      ward,
      township,
      state_region,
      permanent_address,
      medical_conditions,
      medications,
      special_needs,
      emergency_medical_consent,
    } = req.body;

    if (!email || !password || !name || !grade_id) {
      return res.status(400).json({ error: 'Name, email, password, and grade are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Validate registration period
    const now = new Date().toISOString();
    const period = await db.get(
      `SELECT * FROM registration_periods WHERE grade_id = ? AND status = 'open'`,
      [grade_id]
    );

    if (!period) {
      return res.status(400).json({ error: 'Registration is not open for this grade' });
    }

    if (now < period.start_date) {
      return res.status(400).json({ error: `Registration starts on ${period.start_date}` });
    }

    if (now > period.end_date) {
      return res.status(400).json({ error: 'Registration period has ended' });
    }

    if (period.current_seats >= period.max_seats) {
      return res.status(400).json({ error: 'No seats available for this grade' });
    }

    // Check email uniqueness
    const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userResult = await db.run(
      'INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, name, 'student', phone || null]
    );
    const userId = userResult.lastInsertRowid;

    // Generate student ID
    const maxRow = await db.get('SELECT student_id FROM students ORDER BY id DESC LIMIT 1');
    let nextNum = 1;
    if (maxRow?.student_id) {
      const match = maxRow.student_id.match(/(\d+)$/);
      nextNum = match ? parseInt(match[1], 10) + 1 : 1;
    }
    const studentId = `STU-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`;

    // Create student profile
    await db.run(
      `INSERT INTO students (
        user_id, student_id, grade_id, status,
        full_name_mm, date_of_birth, gender, nationality, ethnicity, religion,
        nrc_no, birth_cert_no, blood_type, phone, photo_url, enrollment_type,
        prev_school_name, prev_school_location, prev_grade_completed,
        transfer_cert_no, transfer_cert_date,
        father_name, father_nrc, father_occupation, father_phone, father_email,
        mother_name, mother_nrc, mother_occupation, mother_phone, mother_email,
        guardian_name, guardian_relationship, guardian_nrc, guardian_phone, guardian_email,
        emergency_contact_name, emergency_relationship, emergency_phone,
        house_no, street, ward, township, state_region, permanent_address,
        medical_conditions, medications, special_needs, emergency_medical_consent
      ) VALUES (?, ?, ?, 'applicant',
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?)`,
      [
        userId,
        studentId,
        grade_id,
        full_name_mm || null,
        date_of_birth || null,
        gender || null,
        nationality || null,
        ethnicity || null,
        religion || null,
        nrc_no || null,
        birth_cert_no || null,
        blood_type || null,
        phone || null,
        photo_url || null,
        enrollment_type || 'new',
        prev_school_name || null,
        prev_school_location || null,
        prev_grade_completed || null,
        transfer_cert_no || null,
        transfer_cert_date || null,
        father_name || null,
        father_nrc || null,
        father_occupation || null,
        father_phone || null,
        father_email || null,
        mother_name || null,
        mother_nrc || null,
        mother_occupation || null,
        mother_phone || null,
        mother_email || null,
        guardian_name || null,
        guardian_relationship || null,
        guardian_nrc || null,
        guardian_phone || null,
        guardian_email || null,
        emergency_contact_name || null,
        emergency_relationship || null,
        emergency_phone2 || null,
        house_no || null,
        street || null,
        ward || null,
        township || null,
        state_region || null,
        permanent_address || null,
        medical_conditions || null,
        medications || null,
        special_needs || null,
        emergency_medical_consent ? 1 : 0,
      ]
    );

    // Increment seat count
    await db.run('UPDATE registration_periods SET current_seats = current_seats + 1 WHERE id = ?', [
      period.id,
    ]);

    res.status(201).json({
      message: 'Registration submitted successfully',
      student: { id: userId, name, email, student_id: studentId, grade_id },
    });
  } catch (err) {
    sendError(res, err, 'Registration failed');
  }
});

module.exports = router;
