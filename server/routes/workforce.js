const express = require('express');
const { db } = require('../data');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbac');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── Department Budgets ───────────────────────────────────────
router.get(
  '/department-budgets',
  authMiddleware,
  requirePermission('hr', 'read'),
  async (req, res) => {
    try {
      const { academic_year } = req.query;
      let where = '';
      let params = [];
      if (academic_year) {
        where = 'WHERE academic_year = ?';
        params.push(academic_year);
      }
      const budgets = await db.all(
        `SELECT * FROM department_budgets ${where} ORDER BY department`,
        params
      );
      res.json({ budgets });
    } catch (err) {
      sendError(res, err, 'Failed to fetch department budgets');
    }
  }
);

router.post(
  '/department-budgets',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const { department, academic_year, budgeted_positions, notes } = req.body;
      if (!department || !academic_year) {
        return res.status(400).json({ error: 'department and academic_year are required' });
      }
      // Count current filled positions
      const filled = await db.get(
        "SELECT COUNT(*) as c FROM staff_contracts sc LEFT JOIN users u ON sc.staff_id = u.id WHERE sc.department = ? AND sc.status = 'active'",
        [department]
      );
      const result = await db.run(
        'INSERT OR REPLACE INTO department_budgets (department, academic_year, budgeted_positions, filled_positions, notes) VALUES (?, ?, ?, ?, ?)',
        [department, academic_year, budgeted_positions || 0, filled?.c || 0, notes || null]
      );
      const budget = await db.get('SELECT * FROM department_budgets WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Department budget saved', budget });
      auditLog(req, {
        action: 'create',
        entityType: 'department_budget',
        entityId: result.lastInsertRowid,
      });
    } catch (err) {
      sendError(res, err, 'Failed to save department budget');
    }
  }
);

router.put(
  '/department-budgets/:id',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await db.get('SELECT * FROM department_budgets WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Department budget not found' });
      const { budgeted_positions, notes } = req.body;
      await db.run(
        'UPDATE department_budgets SET budgeted_positions = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [budgeted_positions ?? existing.budgeted_positions, notes ?? existing.notes, id]
      );
      res.json({ message: 'Department budget updated' });
      auditLog(req, { action: 'update', entityType: 'department_budget', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to update department budget');
    }
  }
);

// ─── Job Vacancies ────────────────────────────────────────────
router.get('/vacancies', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const { department, status } = req.query;
    let where = [];
    let params = [];
    if (department) {
      where.push('jv.department = ?');
      params.push(department);
    }
    if (status) {
      where.push('jv.status = ?');
      params.push(status);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const vacancies = await db.all(
      `SELECT jv.*, u.name as filled_by_name, c.name as created_by_name
       FROM job_vacancies jv
       LEFT JOIN users u ON jv.filled_by = u.id
       LEFT JOIN users c ON jv.created_by = c.id
       ${whereClause} ORDER BY jv.posted_date DESC`,
      params
    );
    res.json({ vacancies });
  } catch (err) {
    sendError(res, err, 'Failed to fetch vacancies');
  }
});

router.post('/vacancies', authMiddleware, requirePermission('hr', 'create'), async (req, res) => {
  try {
    const {
      title,
      department,
      position,
      description,
      requirements,
      salary_range_min,
      salary_range_max,
      vacancy_type,
      closing_date,
    } = req.body;
    if (!title || !department || !position || !vacancy_type) {
      return res
        .status(400)
        .json({ error: 'title, department, position, and vacancy_type are required' });
    }
    const result = await db.run(
      `INSERT INTO job_vacancies (title, department, position, description, requirements, salary_range_min, salary_range_max, vacancy_type, posted_date, closing_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, date('now'), ?, ?)`,
      [
        title,
        department,
        position,
        description || null,
        requirements || null,
        salary_range_min || null,
        salary_range_max || null,
        vacancy_type,
        closing_date || null,
        req.user.id,
      ]
    );
    const vacancy = await db.get('SELECT * FROM job_vacancies WHERE id = ?', [
      result.lastInsertRowid,
    ]);
    res.status(201).json({ message: 'Vacancy posted', vacancy });
    auditLog(req, {
      action: 'create',
      entityType: 'job_vacancy',
      entityId: result.lastInsertRowid,
    });
  } catch (err) {
    sendError(res, err, 'Failed to create vacancy');
  }
});

router.put(
  '/vacancies/:id',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await db.get('SELECT * FROM job_vacancies WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Vacancy not found' });
      const {
        title,
        department,
        position,
        description,
        requirements,
        salary_range_min,
        salary_range_max,
        vacancy_type,
        status,
        closing_date,
      } = req.body;
      await db.run(
        `UPDATE job_vacancies SET title = ?, department = ?, position = ?, description = ?, requirements = ?,
       salary_range_min = ?, salary_range_max = ?, vacancy_type = ?, status = ?, closing_date = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [
          title ?? existing.title,
          department ?? existing.department,
          position ?? existing.position,
          description ?? existing.description,
          requirements ?? existing.requirements,
          salary_range_min ?? existing.salary_range_min,
          salary_range_max ?? existing.salary_range_max,
          vacancy_type ?? existing.vacancy_type,
          status ?? existing.status,
          closing_date ?? existing.closing_date,
          id,
        ]
      );
      res.json({ message: 'Vacancy updated' });
      auditLog(req, { action: 'update', entityType: 'job_vacancy', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to update vacancy');
    }
  }
);

router.put(
  '/vacancies/:id/fill',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { filled_by } = req.body;
      await db.run(
        "UPDATE job_vacancies SET status = 'filled', filled_by = ?, filled_date = date('now'), updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [filled_by || null, id]
      );
      res.json({ message: 'Vacancy filled' });
      auditLog(req, { action: 'fill', entityType: 'job_vacancy', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to fill vacancy');
    }
  }
);

// ─── Staffing Gaps ────────────────────────────────────────────
router.get('/staffing-gaps', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const { academic_year, priority } = req.query;
    let where = [];
    let params = [];
    if (academic_year) {
      where.push('academic_year = ?');
      params.push(academic_year);
    }
    if (priority) {
      where.push('priority = ?');
      params.push(priority);
    }
    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
    const gaps = await db.all(
      `SELECT * FROM staffing_gaps ${whereClause} ORDER BY priority, department`,
      params
    );
    res.json({ gaps });
  } catch (err) {
    sendError(res, err, 'Failed to fetch staffing gaps');
  }
});

router.post(
  '/staffing-gaps',
  authMiddleware,
  requirePermission('hr', 'create'),
  async (req, res) => {
    try {
      const { department, academic_year, required_count, current_count, priority, notes } =
        req.body;
      if (!department || !academic_year) {
        return res.status(400).json({ error: 'department and academic_year are required' });
      }
      const result = await db.run(
        'INSERT INTO staffing_gaps (department, academic_year, required_count, current_count, priority, notes) VALUES (?, ?, ?, ?, ?, ?)',
        [
          department,
          academic_year,
          required_count || 0,
          current_count || 0,
          priority || 'medium',
          notes || null,
        ]
      );
      const gap = await db.get('SELECT * FROM staffing_gaps WHERE id = ?', [
        result.lastInsertRowid,
      ]);
      res.status(201).json({ message: 'Staffing gap recorded', gap });
      auditLog(req, {
        action: 'create',
        entityType: 'staffing_gap',
        entityId: result.lastInsertRowid,
      });
    } catch (err) {
      sendError(res, err, 'Failed to record staffing gap');
    }
  }
);

router.put(
  '/staffing-gaps/:id',
  authMiddleware,
  requirePermission('hr', 'update'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const existing = await db.get('SELECT * FROM staffing_gaps WHERE id = ?', [id]);
      if (!existing) return res.status(404).json({ error: 'Staffing gap not found' });
      const { required_count, current_count, priority, notes } = req.body;
      await db.run(
        'UPDATE staffing_gaps SET required_count = ?, current_count = ?, priority = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [
          required_count ?? existing.required_count,
          current_count ?? existing.current_count,
          priority ?? existing.priority,
          notes ?? existing.notes,
          id,
        ]
      );
      res.json({ message: 'Staffing gap updated' });
      auditLog(req, { action: 'update', entityType: 'staffing_gap', entityId: id });
    } catch (err) {
      sendError(res, err, 'Failed to update staffing gap');
    }
  }
);

// ─── Workforce Summary ────────────────────────────────────────
router.get('/summary', authMiddleware, requirePermission('hr', 'read'), async (req, res) => {
  try {
    const totalStaff = await db.get(
      "SELECT COUNT(*) as c FROM users WHERE role IN ('teacher', 'admin')"
    );
    const activeContracts = await db.get(
      "SELECT COUNT(*) as c FROM staff_contracts WHERE status = 'active'"
    );
    const openVacancies = await db.get(
      "SELECT COUNT(*) as c FROM job_vacancies WHERE status = 'open'"
    );
    const byDepartment = await db.all(
      "SELECT department, COUNT(*) as count FROM staff_contracts WHERE status = 'active' AND department IS NOT NULL GROUP BY department"
    );
    const gapsByPriority = await db.all(
      'SELECT priority, COUNT(*) as count FROM staffing_gaps GROUP BY priority'
    );
    res.json({
      summary: {
        totalStaff: totalStaff?.c || 0,
        activeContracts: activeContracts?.c || 0,
        openVacancies: openVacancies?.c || 0,
        byDepartment: byDepartment || [],
        gapsByPriority: gapsByPriority || [],
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch workforce summary');
  }
});

module.exports = router;
