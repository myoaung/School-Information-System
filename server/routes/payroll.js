const express = require('express');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── Salary Structures ────────────────────────────────────────
router.get(
  '/salary-structures',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const structures = await db.all('SELECT * FROM salary_structures ORDER BY min_salary');
      res.json({ structures });
    } catch (err) {
      sendError(res, err, 'Failed to fetch salary structures');
    }
  }
);

router.post(
  '/salary-structures',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const { grade_name, min_salary, max_salary, description } = req.body;
      if (!grade_name || min_salary == null || max_salary == null) {
        return res
          .status(400)
          .json({ error: 'grade_name, min_salary, and max_salary are required' });
      }
      const result = await db.run(
        'INSERT INTO salary_structures (grade_name, min_salary, max_salary, description) VALUES (?, ?, ?, ?)',
        [grade_name, min_salary, max_salary, description || null]
      );
      const structure = await db.get('SELECT * FROM salary_structures WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Salary structure created', structure });
      auditLog(req, {
        action: 'create',
        entityType: 'salary_structure',
        entityId: result.lastInsertRowid,
      });
    } catch (err) {
      sendError(res, err, 'Failed to create salary structure');
    }
  }
);

router.put(
  '/salary-structures/:id',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await db.get('SELECT * FROM salary_structures WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Salary structure not found' });
      const { grade_name, min_salary, max_salary, description } = req.body;
      await db.run(
        'UPDATE salary_structures SET grade_name = ?, min_salary = ?, max_salary = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          grade_name ?? existing.grade_name,
          min_salary ?? existing.min_salary,
          max_salary ?? existing.max_salary,
          description ?? existing.description,
          id,
        ]
      );
      res.json({ message: 'Salary structure updated' });
      auditLog(req, { action: 'update', entityType: 'salary_structure', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to update salary structure');
    }
  }
);

router.delete(
  '/salary-structures/:id',
  authMiddleware,
  requirePermission('hr', 'delete'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await db.get('SELECT * FROM salary_structures WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Salary structure not found' });
      await db.run('DELETE FROM salary_structures WHERE id = ?', [id]);
      res.json({ message: 'Salary structure deleted' });
      auditLog(req, { action: 'delete', entityType: 'salary_structure', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to delete salary structure');
    }
  }
);

// ─── Allowance Types ──────────────────────────────────────────
router.get(
  '/allowance-types',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const types = await db.all('SELECT * FROM allowance_types ORDER BY name');
      res.json({ types });
    } catch (err) {
      sendError(res, err, 'Failed to fetch allowance types');
    }
  }
);

router.post(
  '/allowance-types',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const { name, description, is_taxable, is_fixed } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const result = await db.run(
        'INSERT INTO allowance_types (name, description, is_taxable, is_fixed) VALUES (?, ?, ?, ?)',
        [name, description || null, is_taxable !== false ? 1 : 0, is_fixed !== false ? 1 : 0]
      );
      const type = await db.get('SELECT * FROM allowance_types WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Allowance type created', type });
      auditLog(req, {
        action: 'create',
        entityType: 'allowance_type',
        entityId: result.lastInsertRowid,
      });
    } catch (err) {
      sendError(res, err, 'Failed to create allowance type');
    }
  }
);

router.delete(
  '/allowance-types/:id',
  authMiddleware,
  requirePermission('hr', 'delete'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.run('DELETE FROM allowance_types WHERE id = ?', [id]);
      res.json({ message: 'Allowance type deleted' });
      auditLog(req, { action: 'delete', entityType: 'allowance_type', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to delete allowance type');
    }
  }
);

// ─── Deduction Types ──────────────────────────────────────────
router.get(
  '/deduction-types',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const types = await db.all('SELECT * FROM deduction_types ORDER BY name');
      res.json({ types });
    } catch (err) {
      sendError(res, err, 'Failed to fetch deduction types');
    }
  }
);

router.post(
  '/deduction-types',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const { name, description, is_tax, is_fixed } = req.body;
      if (!name) return res.status(400).json({ error: 'name is required' });
      const result = await db.run(
        'INSERT INTO deduction_types (name, description, is_tax, is_fixed) VALUES (?, ?, ?, ?)',
        [name, description || null, is_tax ? 1 : 0, is_fixed !== false ? 1 : 0]
      );
      const type = await db.get('SELECT * FROM deduction_types WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Deduction type created', type });
      auditLog(req, {
        action: 'create',
        entityType: 'deduction_type',
        entityId: result.lastInsertRowid,
      });
    } catch (err) {
      sendError(res, err, 'Failed to create deduction type');
    }
  }
);

router.delete(
  '/deduction-types/:id',
  authMiddleware,
  requirePermission('hr', 'delete'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.run('DELETE FROM deduction_types WHERE id = ?', [id]);
      res.json({ message: 'Deduction type deleted' });
      auditLog(req, { action: 'delete', entityType: 'deduction_type', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to delete deduction type');
    }
  }
);

// ─── Staff Salary Assignments ─────────────────────────────────
router.get(
  '/salary-assignments',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const { staff_id, status } = req.query;
      let where = [];
      let params = [];
      if (staff_id) {
        where.push('ssa.staff_id = ?');
        params.push(staff_id);
      }
      if (status) {
        where.push('ssa.status = ?');
        params.push(status);
      }
      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
      const assignments = await db.all(
        `SELECT ssa.*, u.name as staff_name, u.email as staff_email, ss.grade_name
       FROM staff_salary_assignments ssa
       LEFT JOIN users u ON ssa.staff_id = u.id
       LEFT JOIN salary_structures ss ON ssa.salary_structure_id = ss.id
       ${whereClause} ORDER BY u.name`,
        params
      );
      res.json({ assignments });
    } catch (err) {
      sendError(res, err, 'Failed to fetch salary assignments');
    }
  }
);

router.post(
  '/salary-assignments',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const {
        staff_id,
        salary_structure_id,
        basic_salary,
        effective_date,
        end_date,
        allowance_ids,
        deduction_ids,
      } = req.body;
      if (!staff_id || !basic_salary || !effective_date) {
        return res
          .status(400)
          .json({ error: 'staff_id, basic_salary, and effective_date are required' });
      }
      // Deactivate existing active assignment
      await db.run(
        "UPDATE staff_salary_assignments SET status = 'inactive', updated_at = CURRENT_TIMESTAMP WHERE staff_id = ? AND status = 'active'",
        [staff_id]
      );
      const result = await db.run(
        'INSERT INTO staff_salary_assignments (staff_id, salary_structure_id, basic_salary, effective_date, end_date) VALUES (?, ?, ?, ?, ?)',
        [staff_id, salary_structure_id || null, basic_salary, effective_date, end_date || null]
      );
      const assignmentId = result.lastInsertRowid;
      // Add allowances
      if (allowance_ids && allowance_ids.length > 0) {
        for (const a of allowance_ids) {
          await db.run(
            'INSERT INTO staff_allowances (staff_salary_id, allowance_type_id, amount) VALUES (?, ?, ?)',
            [assignmentId, a.type_id, a.amount]
          );
        }
      }
      // Add deductions
      if (deduction_ids && deduction_ids.length > 0) {
        for (const d of deduction_ids) {
          await db.run(
            'INSERT INTO staff_deductions (staff_salary_id, deduction_type_id, amount) VALUES (?, ?, ?)',
            [assignmentId, d.type_id, d.amount]
          );
        }
      }
      const assignment = await db.get('SELECT * FROM staff_salary_assignments WHERE id = ?', [
        assignmentId,
      ]);
      res.status(201).json({ message: 'Salary assignment created', assignment });
      auditLog(req, { action: 'create', entityType: 'salary_assignment', entityId: assignmentId });
    } catch (err) {
      sendError(res, err, 'Failed to create salary assignment');
    }
  }
);

router.get(
  '/salary-assignments/:id',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const assignment = await db.get(
        `SELECT ssa.*, u.name as staff_name, ss.grade_name
       FROM staff_salary_assignments ssa
       LEFT JOIN users u ON ssa.staff_id = u.id
       LEFT JOIN salary_structures ss ON ssa.salary_structure_id = ss.id
       WHERE ssa.id = ?`,
        [id]
      );
      if (!assignment) return res.status(404).json({ error: 'Assignment not found' });
      const allowances = await db.all(
        `SELECT sa.*, at.name as type_name FROM staff_allowances sa
       LEFT JOIN allowance_types at ON sa.allowance_type_id = at.id
       WHERE sa.staff_salary_id = ?`,
        [id]
      );
      const deductions = await db.all(
        `SELECT sd.*, dt.name as type_name FROM staff_deductions sd
       LEFT JOIN deduction_types dt ON sd.deduction_type_id = dt.id
       WHERE sd.staff_salary_id = ?`,
        [id]
      );
      res.json({ assignment, allowances, deductions });
    } catch (err) {
      sendError(res, err, 'Failed to fetch salary assignment');
    }
  }
);

// ─── Payslips ─────────────────────────────────────────────────
router.get('/payslips', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const { staff_id, pay_period, status } = req.query;
    let where = [];
    let params = [];
    if (staff_id) {
      where.push('p.staff_id = ?');
      params.push(staff_id);
    }
    if (pay_period) {
      where.push('p.pay_period = ?');
      params.push(pay_period);
    }
    if (status) {
      where.push('p.status = ?');
      params.push(status);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const payslips = await db.all(
      `SELECT p.*, u.name as staff_name, u.email as staff_email
       FROM payslips p LEFT JOIN users u ON p.staff_id = u.id
       ${whereClause} ORDER BY p.pay_date DESC`,
      params
    );
    res.json({ payslips });
  } catch (err) {
    sendError(res, err, 'Failed to fetch payslips');
  }
});

router.post('/payslips', authMiddleware, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const { staff_id, pay_period, pay_date, notes } = req.body;
    if (!staff_id || !pay_period || !pay_date) {
      return res.status(400).json({ error: 'staff_id, pay_period, and pay_date are required' });
    }
    // Get active salary assignment
    const assignment = await db.get(
      "SELECT * FROM staff_salary_assignments WHERE staff_id = ? AND status = 'active'",
      [staff_id]
    );
    if (!assignment)
      return res.status(400).json({ error: 'No active salary assignment for this staff member' });
    // Get allowances
    const allowances = await db.all(
      `SELECT sa.*, at.name as type_name FROM staff_allowances sa
       LEFT JOIN allowance_types at ON sa.allowance_type_id = at.id
       WHERE sa.staff_salary_id = ?`,
      [assignment.id]
    );
    const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
    // Get deductions
    const deductions = await db.all(
      `SELECT sd.*, dt.name as type_name FROM staff_deductions sd
       LEFT JOIN deduction_types dt ON sd.deduction_type_id = dt.id
       WHERE sd.staff_salary_id = ?`,
      [assignment.id]
    );
    const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
    const netSalary = assignment.basic_salary + totalAllowances - totalDeductions;
    // Create payslip
    const result = await db.run(
      `INSERT INTO payslips (staff_id, staff_salary_id, pay_period, pay_date, basic_salary, total_allowances, total_deductions, net_salary, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        staff_id,
        assignment.id,
        pay_period,
        pay_date,
        assignment.basic_salary,
        totalAllowances,
        totalDeductions,
        netSalary,
        notes || null,
        req.user.id,
      ]
    );
    const payslipId = result.lastInsertRowid;
    // Add line items
    for (const a of allowances) {
      await db.run(
        'INSERT INTO payslip_items (payslip_id, item_type, item_name, amount) VALUES (?, ?, ?, ?)',
        [payslipId, 'allowance', a.type_name, a.amount]
      );
    }
    for (const d of deductions) {
      await db.run(
        'INSERT INTO payslip_items (payslip_id, item_type, item_name, amount) VALUES (?, ?, ?, ?)',
        [payslipId, 'deduction', d.type_name, d.amount]
      );
    }
    const payslip = await db.get('SELECT * FROM payslips WHERE id = ?', [payslipId]);
    res.status(201).json({ message: 'Payslip created', payslip });
    auditLog(req, { action: 'create', entityType: 'payslip', entityId: payslipId });
  } catch (err) {
    sendError(res, err, 'Failed to create payslip');
  }
});

router.get('/payslips/:id', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const payslip = await db.get(
      `SELECT p.*, u.name as staff_name FROM payslips p
       LEFT JOIN users u ON p.staff_id = u.id WHERE p.id = ?`,
      [id]
    );
    if (!payslip) return res.status(404).json({ error: 'Payslip not found' });
    const items = await db.all('SELECT * FROM payslip_items WHERE payslip_id = ?', [id]);
    res.json({ payslip, items });
  } catch (err) {
    sendError(res, err, 'Failed to fetch payslip');
  }
});

router.put(
  '/payslips/:id/status',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const validStatuses = ['draft', 'approved', 'paid', 'cancelled'];
      if (!validStatuses.includes(status)) {
        return res
          .status(400)
          .json({ error: `Invalid status. Must be: ${validStatuses.join(', ')}` });
      }
      await db.run('UPDATE payslips SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        status,
        id,
      ]);
      res.json({ message: `Payslip ${status}` });
      auditLog(req, {
        action: 'update_status',
        entityType: 'payslip',
        entityId: id,
        newValues: { status },
      });
    } catch (err) {
      sendError(res, err, 'Failed to update payslip status');
    }
  }
);

// ─── Payroll Summary ──────────────────────────────────────────
router.get('/summary', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const { pay_period } = req.query;
    let where = '';
    let params = [];
    if (pay_period) {
      where = 'WHERE p.pay_period = ?';
      params.push(pay_period);
    }
    const summary = await db.get(
      `SELECT COUNT(*) as total_payslips,
              SUM(basic_salary) as total_basic,
              SUM(total_allowances) as total_allowances,
              SUM(total_deductions) as total_deductions,
              SUM(net_salary) as total_net
       FROM payslips p ${where}`,
      params
    );
    res.json({ summary });
  } catch (err) {
    sendError(res, err, 'Failed to fetch payroll summary');
  }
});

// ─── My Payslips (employee self-service) ──────────────────────
router.get('/my/payslips', authMiddleware, async (req, res) => {
  try {
    const payslips = await db.all(
      'SELECT * FROM payslips WHERE staff_id = ? ORDER BY pay_date DESC',
      [req.user.id]
    );
    res.json({ payslips });
  } catch (err) {
    sendError(res, err, 'Failed to fetch your payslips');
  }
});

module.exports = router;
