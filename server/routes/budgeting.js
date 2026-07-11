const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const BUDGET_PERIODS = ['annual', 'quarterly', 'monthly'];

// ─── List Budgets ─────────────────────────────────────────────
router.get('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { academic_year_id, category } = req.query;

    let where = [];
    let params = [];

    if (academic_year_id) {
      where.push('b.academic_year_id = ?');
      params.push(academic_year_id);
    }
    if (category) {
      where.push('b.category = ?');
      params.push(category);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const budgets = await db.all(
      `SELECT b.*, u.name as created_by_name
       FROM budgets b
       LEFT JOIN users u ON b.created_by = u.id
       ${whereClause}
       ORDER BY b.category, b.period_start`,
      params
    );

    // Calculate spent amount for each budget by joining with expenses
    const result = [];
    for (const budget of budgets) {
      let spent = 0;

      if (budget.period_start && budget.period_end) {
        // Sum expenses in this budget's period and category
        const expenseTotal = await db.get(
          `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
           WHERE expense_date >= ? AND expense_date <= ?
           AND category = ? AND status = 'approved'`,
          [budget.period_start, budget.period_end, budget.category]
        );
        spent = expenseTotal?.total || 0;
      } else {
        // No period filter — sum all expenses in this category
        const expenseTotal = await db.get(
          `SELECT COALESCE(SUM(amount), 0) as total FROM expenses
           WHERE category = ? AND status = 'approved'`,
          [budget.category]
        );
        spent = expenseTotal?.total || 0;
      }

      result.push({
        ...budget,
        spent_amount: spent,
        remaining: budget.allocated_amount - spent,
        utilization:
          budget.allocated_amount > 0 ? Math.round((spent / budget.allocated_amount) * 100) : 0,
      });
    }

    res.json({ budgets: result });
  } catch (err) {
    sendError(res, err, 'Failed to fetch budgets');
  }
});

// ─── Create Budget ────────────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      academic_year_id,
      category,
      description,
      allocated_amount,
      period,
      period_start,
      period_end,
    } = req.body;

    if (!category || !allocated_amount) {
      return res.status(400).json({ error: 'category and allocated_amount are required' });
    }

    if (period && !BUDGET_PERIODS.includes(period)) {
      return res
        .status(400)
        .json({ error: `Invalid period. Must be: ${BUDGET_PERIODS.join(', ')}` });
    }

    const result = await db.run(
      `INSERT INTO budgets (academic_year_id, category, description, allocated_amount, period, period_start, period_end, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        academic_year_id || null,
        category,
        description || null,
        allocated_amount,
        period || 'annual',
        period_start || null,
        period_end || null,
        req.user.id,
      ]
    );

    const budget = await db.get('SELECT * FROM budgets WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ message: 'Budget created', budget });

    auditLog(req, {
      action: 'create',
      entityType: 'budget',
      entityId: result.lastInsertRowid,
      newValues: { category, allocated_amount },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create budget');
  }
});

// ─── Update Budget ────────────────────────────────────────────
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { category, description, allocated_amount, period, period_start, period_end } = req.body;

    const budget = await db.get('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });

    await db.run(
      `UPDATE budgets SET category = ?, description = ?, allocated_amount = ?, period = ?,
       period_start = ?, period_end = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        category ?? budget.category,
        description ?? budget.description,
        allocated_amount ?? budget.allocated_amount,
        period ?? budget.period,
        period_start ?? budget.period_start,
        period_end ?? budget.period_end,
        id,
      ]
    );

    res.json({ message: 'Budget updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'budget',
      entityId: id,
      newValues: { category, allocated_amount },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update budget');
  }
});

// ─── Delete Budget ────────────────────────────────────────────
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const budget = await db.get('SELECT * FROM budgets WHERE id = ?', [id]);
    if (!budget) return res.status(404).json({ error: 'Budget not found' });

    await db.run('DELETE FROM budgets WHERE id = ?', [id]);

    res.json({ message: 'Budget deleted' });

    auditLog(req, {
      action: 'delete',
      entityType: 'budget',
      entityId: id,
    });
  } catch (err) {
    sendError(res, err, 'Failed to delete budget');
  }
});

// ─── Budget Summary (Overview) ────────────────────────────────
router.get('/summary', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { academic_year_id } = req.query;

    let where = '';
    let params = [];

    if (academic_year_id) {
      where = 'WHERE b.academic_year_id = ?';
      params.push(academic_year_id);
    }

    // Total allocated vs spent
    const totals = await db.all(
      `SELECT b.category, SUM(b.allocated_amount) as allocated
       FROM budgets b ${where}
       GROUP BY b.category`,
      params
    );

    // Get actual expenses by category
    const expenseCategories = await db.all(
      `SELECT category, SUM(amount) as spent
       FROM expenses WHERE status = 'approved'
       GROUP BY category`
    );

    const expenseMap = {};
    for (const e of expenseCategories) {
      expenseMap[e.category] = e.spent;
    }

    const summary = totals.map((t) => ({
      category: t.category,
      allocated: t.allocated,
      spent: expenseMap[t.category] || 0,
      remaining: t.allocated - (expenseMap[t.category] || 0),
      utilization:
        t.allocated > 0 ? Math.round(((expenseMap[t.category] || 0) / t.allocated) * 100) : 0,
    }));

    const totalAllocated = summary.reduce((sum, s) => sum + s.allocated, 0);
    const totalSpent = summary.reduce((sum, s) => sum + s.spent, 0);

    res.json({
      summary,
      totals: {
        allocated: totalAllocated,
        spent: totalSpent,
        remaining: totalAllocated - totalSpent,
        utilization: totalAllocated > 0 ? Math.round((totalSpent / totalAllocated) * 100) : 0,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch budget summary');
  }
});

// ─── Available Categories ─────────────────────────────────────
router.get('/categories', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    // Return expense categories that are actually used, plus budget-specific ones
    const used = await db.all('SELECT DISTINCT category FROM expenses');

    const categories = [
      ...used.map((u) => u.category),
      'events',
      'infrastructure',
      'technology',
      'professional_development',
    ];

    res.json({ categories: [...new Set(categories)].sort() });
  } catch (err) {
    sendError(res, err, 'Failed to fetch categories');
  }
});

module.exports = router;
