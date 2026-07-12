const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const CONTRACT_TYPES = ['permanent', 'temporary', 'probation', 'contract', 'intern'];
const CONTRACT_STATUSES = ['active', 'expired', 'terminated', 'renewed'];

// ─── List Staff with Contract Info ─────────────────────────────
router.get('/staff', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const { status, department } = req.query;

    let where = ["u.role IN ('teacher', 'admin')"];
    let params = [];

    if (status) {
      where.push('sc.status = ?');
      params.push(status);
    }
    if (department) {
      where.push('sc.department = ?');
      params.push(department);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const staff = await db.all(
      `SELECT u.id, u.name, u.email, u.role,
              t.teacher_id, t.qualification, t.specialization, t.hire_date, t.status as employment_status,
              sc.id as contract_id, sc.contract_type, sc.start_date as contract_start, sc.end_date as contract_end,
              sc.salary, sc.position, sc.department, sc.status as contract_status
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       LEFT JOIN staff_contracts sc ON sc.staff_id = u.id AND sc.status = 'active'
       ${whereClause}
       ORDER BY u.name`,
      params
    );

    res.json({ staff });
  } catch (err) {
    sendError(res, err, 'Failed to fetch staff');
  }
});

// ─── Get Single Staff Member ───────────────────────────────────
router.get('/staff/:id', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const staff = await db.get(
      `SELECT u.id, u.name, u.email, u.role,
              t.teacher_id, t.qualification, t.specialization, t.hire_date, t.status as employment_status,
              t.phone, t.address
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.id = ?`,
      [id]
    );

    if (!staff) return res.status(404).json({ error: 'Staff member not found' });

    // Get contract history
    const contracts = await db.all(
      `SELECT * FROM staff_contracts WHERE staff_id = ? ORDER BY created_at DESC`,
      [id]
    );

    // Get leave history
    const leaves = await db.all(
      `SELECT * FROM leave_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`,
      [id]
    );

    res.json({ staff, contracts, leaves });
  } catch (err) {
    sendError(res, err, 'Failed to fetch staff member');
  }
});

// ─── Create Contract ───────────────────────────────────────────
router.post('/contracts', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const { staff_id, contract_type, start_date, end_date, salary, position, department, notes } =
      req.body;

    if (!staff_id || !contract_type || !start_date) {
      return res
        .status(400)
        .json({ error: 'staff_id, contract_type, and start_date are required' });
    }

    if (!CONTRACT_TYPES.includes(contract_type)) {
      return res
        .status(400)
        .json({ error: `Invalid contract type. Must be: ${CONTRACT_TYPES.join(', ')}` });
    }

    // Deactivate existing active contract
    await db.run(
      "UPDATE staff_contracts SET status = 'renewed', updated_at = CURRENT_TIMESTAMP WHERE staff_id = ? AND status = 'active'",
      [staff_id]
    );

    const result = await db.run(
      `INSERT INTO staff_contracts (staff_id, contract_type, start_date, end_date, salary, position, department, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        contract_type,
        start_date,
        end_date || null,
        salary || null,
        position || null,
        department || null,
        notes || null,
        req.user.id,
      ]
    );

    const contract = await db.get('SELECT * FROM staff_contracts WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Contract created', contract });

    auditLog(req, {
      action: 'create',
      entityType: 'staff_contract',
      entityId: result.lastInsertRowid,
      newValues: { staff_id, contract_type, start_date },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create contract');
  }
});

// ─── Update Contract ───────────────────────────────────────────
router.put('/contracts/:id', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { contract_type, start_date, end_date, salary, position, department, status, notes } =
      req.body;

    const contract = await db.get('SELECT * FROM staff_contracts WHERE id = ?', [id]);
    if (!contract) return res.status(404).json({ error: 'Contract not found' });

    if (status && !CONTRACT_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be: ${CONTRACT_STATUSES.join(', ')}` });
    }

    await db.run(
      `UPDATE staff_contracts SET contract_type = ?, start_date = ?, end_date = ?, salary = ?,
       position = ?, department = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        contract_type ?? contract.contract_type,
        start_date ?? contract.start_date,
        end_date ?? contract.end_date,
        salary ?? contract.salary,
        position ?? contract.position,
        department ?? contract.department,
        status ?? contract.status,
        notes ?? contract.notes,
        id,
      ]
    );

    res.json({ message: 'Contract updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'staff_contract',
      entityId: id,
      newValues: { contract_type, status },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update contract');
  }
});

// ─── Get Expiring Contracts ────────────────────────────────────
router.get(
  '/contracts/expiring',
  authMiddleware,
  roleMiddleware('admin', 'hr'),
  async (req, res) => {
    try {
      const { days } = req.query;
      const daysAhead = parseInt(days) || 30;

      const contracts = await db.all(
        `SELECT sc.*, u.name as staff_name, u.email as staff_email
       FROM staff_contracts sc
       LEFT JOIN users u ON sc.staff_id = u.id
       WHERE sc.status = 'active' AND sc.end_date IS NOT NULL
       AND sc.end_date <= date('now', '+' || ? || ' days')
       ORDER BY sc.end_date ASC`,
        [daysAhead]
      );

      res.json({ contracts });
    } catch (err) {
      sendError(res, err, 'Failed to fetch expiring contracts');
    }
  }
);

// ─── Performance Reviews ───────────────────────────────────────

const REVIEW_TYPES = ['probation', 'annual', 'mid_year', 'observation', 'goal_setting', 'other'];
const RATINGS = ['excellent', 'good', 'satisfactory', 'needs_improvement', 'unsatisfactory'];
const REVIEW_STATUSES = ['draft', 'submitted', 'acknowledged', 'completed'];

// List reviews
router.get('/reviews', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { staff_id, review_type, status } = req.query;

    let where = [];
    let params = [];

    if (staff_id) {
      where.push('pr.staff_id = ?');
      params.push(staff_id);
    }
    if (review_type) {
      where.push('pr.review_type = ?');
      params.push(review_type);
    }
    if (status) {
      where.push('pr.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const reviews = await db.all(
      `SELECT pr.*, u.name as staff_name, u.email as staff_email,
              r.name as reviewer_name
       FROM performance_reviews pr
       LEFT JOIN users u ON pr.staff_id = u.id
       LEFT JOIN users r ON pr.reviewer_id = r.id
       ${whereClause}
       ORDER BY pr.created_at DESC`,
      params
    );

    res.json({ reviews });
  } catch (err) {
    sendError(res, err, 'Failed to fetch reviews');
  }
});

// Get single review
router.get('/reviews/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const review = await db.get(
      `SELECT pr.*, u.name as staff_name, u.email as staff_email,
              r.name as reviewer_name
       FROM performance_reviews pr
       LEFT JOIN users u ON pr.staff_id = u.id
       LEFT JOIN users r ON pr.reviewer_id = r.id
       WHERE pr.id = ?`,
      [id]
    );

    if (!review) return res.status(404).json({ error: 'Review not found' });

    res.json({ review });
  } catch (err) {
    sendError(res, err, 'Failed to fetch review');
  }
});

// Create review
router.post('/reviews', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const {
      staff_id,
      review_type,
      review_period,
      rating,
      strengths,
      areas_for_improvement,
      goals,
      development_plan,
      comments,
      review_date,
      next_review_date,
    } = req.body;

    if (!staff_id || !review_type) {
      return res.status(400).json({ error: 'staff_id and review_type are required' });
    }

    if (!REVIEW_TYPES.includes(review_type)) {
      return res
        .status(400)
        .json({ error: `Invalid review type. Must be: ${REVIEW_TYPES.join(', ')}` });
    }

    const result = await db.run(
      `INSERT INTO performance_reviews (staff_id, review_type, review_period, reviewer_id, rating, strengths, areas_for_improvement, goals, development_plan, comments, review_date, next_review_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        review_type,
        review_period || null,
        req.user.id,
        rating || null,
        strengths || null,
        areas_for_improvement || null,
        goals || null,
        development_plan || null,
        comments || null,
        review_date || new Date().toISOString().split('T')[0],
        next_review_date || null,
      ]
    );

    const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Review created', review });

    auditLog(req, {
      action: 'create',
      entityType: 'performance_review',
      entityId: result.lastInsertRowid,
      newValues: { staff_id, review_type },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create review');
  }
});

// Update review
router.put('/reviews/:id', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      review_type,
      review_period,
      rating,
      strengths,
      areas_for_improvement,
      goals,
      development_plan,
      comments,
      review_date,
      next_review_date,
    } = req.body;

    const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [id]);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    await db.run(
      `UPDATE performance_reviews SET review_type = ?, review_period = ?, rating = ?, strengths = ?,
       areas_for_improvement = ?, goals = ?, development_plan = ?, comments = ?,
       review_date = ?, next_review_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        review_type ?? review.review_type,
        review_period ?? review.review_period,
        rating ?? review.rating,
        strengths ?? review.strengths,
        areas_for_improvement ?? review.areas_for_improvement,
        goals ?? review.goals,
        development_plan ?? review.development_plan,
        comments ?? review.comments,
        review_date ?? review.review_date,
        next_review_date ?? review.next_review_date,
        id,
      ]
    );

    res.json({ message: 'Review updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'performance_review',
      entityId: id,
      newValues: { review_type, rating },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update review');
  }
});

// Submit review
router.put(
  '/reviews/:id/submit',
  authMiddleware,
  roleMiddleware('admin', 'hr'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [id]);
      if (!review) return res.status(404).json({ error: 'Review not found' });

      if (review.status !== 'draft') {
        return res
          .status(400)
          .json({ error: `Cannot submit review with status '${review.status}'` });
      }

      await db.run(
        "UPDATE performance_reviews SET status = 'submitted', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [id]
      );

      res.json({ message: 'Review submitted' });

      auditLog(req, {
        action: 'submit',
        entityType: 'performance_review',
        entityId: id,
        newValues: { status: 'submitted' },
      });
    } catch (err) {
      sendError(res, err, 'Failed to submit review');
    }
  }
);

// Acknowledge review (teacher)
router.put('/reviews/:id/acknowledge', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const review = await db.get('SELECT * FROM performance_reviews WHERE id = ?', [id]);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    // Only the staff member being reviewed can acknowledge
    if (review.staff_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (review.status !== 'submitted') {
      return res
        .status(400)
        .json({ error: `Cannot acknowledge review with status '${review.status}'` });
    }

    await db.run(
      "UPDATE performance_reviews SET status = 'acknowledged', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [id]
    );

    res.json({ message: 'Review acknowledged' });

    auditLog(req, {
      action: 'acknowledge',
      entityType: 'performance_review',
      entityId: id,
      newValues: { status: 'acknowledged' },
    });
  } catch (err) {
    sendError(res, err, 'Failed to acknowledge review');
  }
});

// Get my reviews (teacher view)
router.get('/reviews/my/list', authMiddleware, async (req, res) => {
  try {
    const reviews = await db.all(
      `SELECT pr.*, r.name as reviewer_name
       FROM performance_reviews pr
       LEFT JOIN users r ON pr.reviewer_id = r.id
       WHERE pr.staff_id = ?
       ORDER BY pr.created_at DESC`,
      [req.user.id]
    );

    res.json({ reviews });
  } catch (err) {
    sendError(res, err, 'Failed to fetch your reviews');
  }
});

// ─── HR Statistics ─────────────────────────────────────────────
router.get('/stats', authMiddleware, roleMiddleware('admin', 'hr'), async (req, res) => {
  try {
    const totalStaff = await db.get(
      "SELECT COUNT(*) as c FROM users WHERE role IN ('teacher', 'admin')"
    );
    const activeContracts = await db.get(
      "SELECT COUNT(*) as c FROM staff_contracts WHERE status = 'active'"
    );
    const expiringContracts = await db.get(
      "SELECT COUNT(*) as c FROM staff_contracts WHERE status = 'active' AND end_date IS NOT NULL AND end_date <= to_char(CURRENT_DATE + INTERVAL '30 days', 'YYYY-MM-DD')"
    );
    const pendingLeaves = await db.get(
      "SELECT COUNT(*) as c FROM leave_requests WHERE status = 'pending'"
    );

    // By contract type
    const byContractType = await db.all(
      "SELECT contract_type, COUNT(*) as count FROM staff_contracts WHERE status = 'active' GROUP BY contract_type"
    );

    // By department
    const byDepartment = await db.all(
      "SELECT department, COUNT(*) as count FROM staff_contracts WHERE status = 'active' AND department IS NOT NULL GROUP BY department"
    );

    res.json({
      stats: {
        totalStaff: totalStaff?.c || 0,
        activeContracts: activeContracts?.c || 0,
        expiringContracts: expiringContracts?.c || 0,
        pendingLeaves: pendingLeaves?.c || 0,
        byContractType: byContractType || [],
        byDepartment: byDepartment || [],
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch HR stats');
  }
});

// ─── Employee Self-Service ────────────────────────────────────

// Get my profile (teacher self-service)
router.get('/my/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await db.get(
      `SELECT u.id, u.name, u.email, u.role, u.phone as user_phone,
              t.teacher_id, t.phone, t.qualification, t.specialization,
              t.hire_date, t.status as employment_status, t.address
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id
       WHERE u.id = ?`,
      [req.user.id]
    );

    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    // Get active contract
    const contract = await db.get(
      `SELECT * FROM staff_contracts WHERE staff_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [req.user.id]
    );

    // Leave balance — count approved leaves this year
    const leaveBalance = await db.get(
      `SELECT COUNT(*) as used FROM leave_requests
       WHERE user_id = ? AND status = 'approved'
       AND start_date >= to_char(CURRENT_DATE, 'YYYY') || '-01-01'`,
      [req.user.id]
    );

    res.json({ profile, contract, leaveBalance: { used: leaveBalance?.used || 0, allowed: 14 } });
  } catch (err) {
    sendError(res, err, 'Failed to fetch profile');
  }
});

// Update my profile (phone, address only)
router.put('/my/profile', authMiddleware, async (req, res) => {
  try {
    const { phone, address } = req.body;

    // Check if teacher profile exists
    const existing = await db.get('SELECT * FROM teachers WHERE user_id = ?', [req.user.id]);

    if (existing) {
      await db.run('UPDATE teachers SET phone = ?, address = ? WHERE user_id = ?', [
        phone ?? existing.phone,
        address ?? existing.address,
        req.user.id,
      ]);
    } else {
      await db.run('INSERT INTO teachers (user_id, phone, address) VALUES (?, ?, ?)', [
        req.user.id,
        phone || null,
        address || null,
      ]);
    }

    res.json({ message: 'Profile updated' });
  } catch (err) {
    sendError(res, err, 'Failed to update profile');
  }
});

// My leave history
router.get('/my/leaves', authMiddleware, async (req, res) => {
  try {
    const leaves = await db.all(
      `SELECT lr.*, ab.name as approved_by_name
       FROM leave_requests lr
       LEFT JOIN users ab ON lr.approved_by = ab.id
       WHERE lr.user_id = ?
       ORDER BY lr.created_at DESC`,
      [req.user.id]
    );

    res.json({ leaves });
  } catch (err) {
    sendError(res, err, 'Failed to fetch leave history');
  }
});

// My contract history
router.get('/my/contracts', authMiddleware, async (req, res) => {
  try {
    const contracts = await db.all(
      `SELECT * FROM staff_contracts WHERE staff_id = ? ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({ contracts });
  } catch (err) {
    sendError(res, err, 'Failed to fetch contract history');
  }
});

module.exports = router;
