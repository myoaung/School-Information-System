const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const CONTRACT_TYPES = ['permanent', 'temporary', 'probation', 'contract', 'intern'];
const CONTRACT_STATUSES = ['active', 'expired', 'terminated', 'renewed'];

// ─── List Staff with Contract Info ─────────────────────────────
router.get('/staff', authMiddleware, roleMiddleware('admin'), async (req, res) => {
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
router.get('/staff/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
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
router.post('/contracts', authMiddleware, roleMiddleware('admin'), async (req, res) => {
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
router.put('/contracts/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
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
router.get('/contracts/expiring', authMiddleware, roleMiddleware('admin'), async (req, res) => {
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
});

// ─── HR Statistics ─────────────────────────────────────────────
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const totalStaff = await db.get(
      "SELECT COUNT(*) as c FROM users WHERE role IN ('teacher', 'admin')"
    );
    const activeContracts = await db.get(
      "SELECT COUNT(*) as c FROM staff_contracts WHERE status = 'active'"
    );
    const expiringContracts = await db.get(
      "SELECT COUNT(*) as c FROM staff_contracts WHERE status = 'active' AND end_date IS NOT NULL AND end_date <= date('now', '+30 days')"
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

module.exports = router;
