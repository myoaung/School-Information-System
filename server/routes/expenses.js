const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const CATEGORIES = [
  'salary',
  'supplies',
  'maintenance',
  'utilities',
  'transport',
  'events',
  'other',
];
const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'mobile_payment', 'other'];

// ─── List Expenses ─────────────────────────────────────────────
router.get(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'teacher', 'accountant'),
  async (req, res) => {
    try {
      const { category, status, start_date, end_date } = req.query;

      let where = [];
      let params = [];

      if (category) {
        where.push('e.category = ?');
        params.push(category);
      }
      if (status) {
        where.push('e.status = ?');
        params.push(status);
      }
      if (start_date) {
        where.push('e.expense_date >= ?');
        params.push(start_date);
      }
      if (end_date) {
        where.push('e.expense_date <= ?');
        params.push(end_date);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const expenses = await db.all(
        `SELECT e.*, u.name as created_by_name, ab.name as approved_by_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN users ab ON e.approved_by = ab.id
       ${whereClause}
       ORDER BY e.expense_date DESC`,
        params
      );

      res.json({ expenses });
    } catch (err) {
      sendError(res, err, 'Failed to fetch expenses');
    }
  }
);

// ─── Get Single Expense ────────────────────────────────────────
router.get(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'teacher', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const expense = await db.get(
        `SELECT e.*, u.name as created_by_name, ab.name as approved_by_name
       FROM expenses e
       LEFT JOIN users u ON e.created_by = u.id
       LEFT JOIN users ab ON e.approved_by = ab.id
       WHERE e.id = ?`,
        [id]
      );

      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      res.json({ expense });
    } catch (err) {
      sendError(res, err, 'Failed to fetch expense');
    }
  }
);

// ─── Create Expense ────────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'teacher', 'accountant'),
  async (req, res) => {
    try {
      const {
        category,
        description,
        amount,
        expense_date,
        paid_to,
        payment_method,
        receipt_url,
        notes,
      } = req.body;

      if (!category || !description || !amount || !expense_date) {
        return res
          .status(400)
          .json({ error: 'category, description, amount, and expense_date are required' });
      }

      if (!CATEGORIES.includes(category)) {
        return res
          .status(400)
          .json({ error: `Invalid category. Must be: ${CATEGORIES.join(', ')}` });
      }

      const method = PAYMENT_METHODS.includes(payment_method) ? payment_method : 'cash';

      const result = await db.run(
        `INSERT INTO expenses (category, description, amount, expense_date, paid_to, payment_method, receipt_url, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          category,
          description,
          amount,
          expense_date,
          paid_to || null,
          method,
          receipt_url || null,
          notes || null,
          req.user.id,
        ]
      );

      const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [result.lastInsertRowid]);

      res.status(201).json({ message: 'Expense created', expense });

      auditLog(req, {
        action: 'create',
        entityType: 'expense',
        entityId: result.lastInsertRowid,
        newValues: { category, amount, expense_date },
      });
    } catch (err) {
      sendError(res, err, 'Failed to create expense');
    }
  }
);

// ─── Approve Expense (admin only) ──────────────────────────────
router.put(
  '/:id/approve',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      if (expense.status !== 'pending') {
        return res
          .status(400)
          .json({ error: `Cannot approve expense with status '${expense.status}'` });
      }

      await db.run("UPDATE expenses SET status = 'approved', approved_by = ? WHERE id = ?", [
        req.user.id,
        id,
      ]);

      res.json({ message: 'Expense approved' });

      auditLog(req, {
        action: 'approve',
        entityType: 'expense',
        entityId: id,
        newValues: { status: 'approved' },
      });
    } catch (err) {
      sendError(res, err, 'Failed to approve expense');
    }
  }
);

// ─── Reject Expense (admin only) ───────────────────────────────
router.put(
  '/:id/reject',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { notes } = req.body;

      const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
      if (!expense) return res.status(404).json({ error: 'Expense not found' });

      if (expense.status !== 'pending') {
        return res
          .status(400)
          .json({ error: `Cannot reject expense with status '${expense.status}'` });
      }

      await db.run(
        "UPDATE expenses SET status = 'rejected', notes = COALESCE(?, notes) WHERE id = ?",
        [notes || null, id]
      );

      res.json({ message: 'Expense rejected' });

      auditLog(req, {
        action: 'reject',
        entityType: 'expense',
        entityId: id,
        newValues: { status: 'rejected' },
      });
    } catch (err) {
      sendError(res, err, 'Failed to reject expense');
    }
  }
);

// ─── Delete Expense (admin only) ───────────────────────────────
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id]);
    if (!expense) return res.status(404).json({ error: 'Expense not found' });

    await db.run('DELETE FROM expenses WHERE id = ?', [id]);

    res.json({ message: 'Expense deleted' });

    auditLog(req, { action: 'delete', entityType: 'expense', entityId: id });
  } catch (err) {
    sendError(res, err, 'Failed to delete expense');
  }
});

// ─── Financial Summary ─────────────────────────────────────────
router.get(
  '/summary/financial',
  authMiddleware,
  roleMiddleware('admin', 'teacher', 'accountant'),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      let dateFilter = '';
      let params = [];

      if (start_date) {
        dateFilter += ' AND expense_date >= ?';
        params.push(start_date);
      }
      if (end_date) {
        dateFilter += ' AND expense_date <= ?';
        params.push(end_date);
      }

      // Total approved expenses
      const totalExpenses = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'approved' ${dateFilter}`,
        params
      );

      // Pending expenses
      const pendingExpenses = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE status = 'pending' ${dateFilter}`,
        params
      );

      // Total income (from payments table)
      const totalIncome = await db.get(
        `SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE 1=1 ${dateFilter.replace(/expense_date/g, 'paid_at')}`,
        params
      );

      // Expenses by category
      const byCategory = await db.all(
        `SELECT category, SUM(amount) as total, COUNT(*) as count
       FROM expenses WHERE status = 'approved' ${dateFilter}
       GROUP BY category ORDER BY total DESC`,
        params
      );

      // Monthly trend (last 6 months) - compatible with both SQLite and PostgreSQL
      const monthlyTrend = await db.all(
        `SELECT SUBSTR(expense_date, 1, 7) as month,
              SUM(amount) as total
       FROM expenses WHERE status = 'approved'
       GROUP BY month ORDER BY month DESC LIMIT 6`
      );

      const balance = (totalIncome?.total || 0) - (totalExpenses?.total || 0);

      res.json({
        summary: {
          totalIncome: totalIncome?.total || 0,
          totalExpenses: totalExpenses?.total || 0,
          pendingExpenses: pendingExpenses?.total || 0,
          balance,
          byCategory: byCategory || [],
          monthlyTrend: (monthlyTrend || []).reverse(),
        },
      });
    } catch (err) {
      sendError(res, err, 'Failed to fetch financial summary');
    }
  }
);

module.exports = router;
