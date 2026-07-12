const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── AR Aging Report ──────────────────────────────────────────
router.get('/aging', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    // Get all unpaid invoices with aging buckets
    const invoices = await db.all(
      `SELECT i.*, u.name as student_name, u.email as student_email,
              fs.fee_type, g.name as grade_name
       FROM invoices i
       LEFT JOIN users u ON i.student_id = u.id
       LEFT JOIN fee_structures fs ON i.fee_structure_id = fs.id
       LEFT JOIN students s ON s.user_id = i.student_id
       LEFT JOIN grades g ON s.grade_id = g.id
       WHERE i.status IN ('pending', 'overdue')
       ORDER BY i.due_date ASC`
    );

    const today = new Date();
    const aging = {
      current: [],
      '1_30': [],
      '31_60': [],
      '61_90': [],
      '90_plus': [],
    };

    let totalOutstanding = 0;

    for (const inv of invoices) {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
      const outstanding = inv.amount - (inv.amount_paid || 0);

      if (outstanding <= 0) continue;

      totalOutstanding += outstanding;

      const entry = {
        ...inv,
        outstanding,
        days_overdue: daysOverdue,
      };

      if (daysOverdue <= 0) aging.current.push(entry);
      else if (daysOverdue <= 30) aging['1_30'].push(entry);
      else if (daysOverdue <= 60) aging['31_60'].push(entry);
      else if (daysOverdue <= 90) aging['61_90'].push(entry);
      else aging['90_plus'].push(entry);
    }

    const summary = {
      current: aging.current.reduce((sum, i) => sum + i.outstanding, 0),
      '1_30': aging['1_30'].reduce((sum, i) => sum + i.outstanding, 0),
      '31_60': aging['31_60'].reduce((sum, i) => sum + i.outstanding, 0),
      '61_90': aging['61_90'].reduce((sum, i) => sum + i.outstanding, 0),
      '90_plus': aging['90_plus'].reduce((sum, i) => sum + i.outstanding, 0),
      total: totalOutstanding,
      count: invoices.length,
    };

    res.json({ aging, summary });
  } catch (err) {
    sendError(res, err, 'Failed to generate AR aging report');
  }
});

// ─── Student AR Statement ─────────────────────────────────────
router.get('/student/:id', authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    // Students can only see their own
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const student = await db.get(
      `SELECT u.id, u.name, u.email, s.student_id as student_code, g.name as grade_name
       FROM users u
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN grades g ON s.grade_id = g.id
       WHERE u.id = ?`,
      [studentId]
    );

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Get all invoices with payments
    const invoices = await db.all(
      `SELECT i.*, fs.fee_type
       FROM invoices i
       LEFT JOIN fee_structures fs ON i.fee_structure_id = fs.id
       WHERE i.student_id = ?
       ORDER BY i.due_date DESC`,
      [studentId]
    );

    // Get all payments
    const payments = await db.all(
      `SELECT p.*, i.id as invoice_id
       FROM payments p
       LEFT JOIN invoices i ON p.invoice_id = i.id
       WHERE i.student_id = ?
       ORDER BY p.paid_at DESC`,
      [studentId]
    );

    // Get write-offs
    const writeoffs = await db.all(
      `SELECT aw.*, i.id as invoice_id
       FROM ar_writeoffs aw
       LEFT JOIN invoices i ON aw.invoice_id = i.id
       WHERE i.student_id = ?
       ORDER BY aw.created_at DESC`,
      [studentId]
    );

    // Calculate totals
    const totalInvoiced = invoices.reduce((sum, i) => sum + i.amount, 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const totalWrittenOff = writeoffs.reduce((sum, w) => sum + w.amount, 0);
    const balance = totalInvoiced - totalPaid - totalWrittenOff;

    // Find oldest unpaid
    const unpaid = invoices.filter((i) => i.status !== 'paid' && i.status !== 'cancelled');
    const oldestUnpaid = unpaid.length > 0 ? unpaid[unpaid.length - 1] : null;

    res.json({
      student,
      invoices,
      payments,
      writeoffs,
      summary: {
        total_invoiced: totalInvoiced,
        total_paid: totalPaid,
        total_written_off: totalWrittenOff,
        balance,
        unpaid_count: unpaid.length,
        oldest_unpaid_date: oldestUnpaid?.due_date || null,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch student AR statement');
  }
});

// ─── AR Summary Dashboard ─────────────────────────────────────
router.get('/summary', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const totalOutstanding = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM invoices WHERE status IN ('pending', 'overdue')`
    );

    const totalOverdue = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM invoices WHERE status = 'overdue'`
    );

    const totalPaid = await db.get(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM invoices WHERE status = 'paid'`
    );

    // Students with outstanding balances
    const studentsWithDebt = await db.all(
      `SELECT u.id, u.name, u.email, g.name as grade_name,
              COUNT(i.id) as invoice_count,
              SUM(i.amount) as total_invoiced
       FROM users u
       JOIN invoices i ON i.student_id = u.id
       LEFT JOIN students s ON s.user_id = u.id
       LEFT JOIN grades g ON s.grade_id = g.id
       WHERE i.status IN ('pending', 'overdue')
       GROUP BY u.id
       ORDER BY total_invoiced DESC
       LIMIT 20`
    );

    // Collection rate (paid / total invoiced)
    const allInvoiced = await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM invoices');

    const collectionRate =
      allInvoiced?.total > 0 ? Math.round((totalPaid?.total / allInvoiced.total) * 100) : 0;

    res.json({
      summary: {
        total_outstanding: totalOutstanding?.total || 0,
        total_overdue: totalOverdue?.total || 0,
        total_paid: totalPaid?.total || 0,
        collection_rate: collectionRate,
      },
      studentsWithDebt,
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch AR summary');
  }
});

// ─── Bulk Reminders (list students needing reminders) ─────────
router.get(
  '/reminders',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const students = await db.all(
        `SELECT u.id, u.name, u.email, u.phone,
              COUNT(i.id) as overdue_count,
              SUM(i.amount) as total_overdue,
              MIN(i.due_date) as oldest_due
       FROM users u
       JOIN invoices i ON i.student_id = u.id
       WHERE i.status = 'overdue'
       GROUP BY u.id
       HAVING SUM(i.amount) > 0
       ORDER BY total_overdue DESC`
      );

      res.json({ students });
    } catch (err) {
      sendError(res, err, 'Failed to fetch reminders list');
    }
  }
);

// ─── Write Off Invoice ────────────────────────────────────────
router.post(
  '/write-off',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { invoice_id, amount, reason } = req.body;

      if (!invoice_id || !amount) {
        return res.status(400).json({ error: 'invoice_id and amount are required' });
      }

      const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      if (amount > invoice.amount) {
        return res.status(400).json({ error: 'Write-off amount exceeds invoice amount' });
      }

      const result = await db.run(
        `INSERT INTO ar_writeoffs (invoice_id, amount, reason, written_off_by)
       VALUES (?, ?, ?, ?)`,
        [invoice_id, amount, reason || null, req.user.id]
      );

      // If fully written off, mark invoice as cancelled
      const totalWriteoffs = await db.get(
        'SELECT COALESCE(SUM(amount), 0) as total FROM ar_writeoffs WHERE invoice_id = ?',
        [invoice_id]
      );

      if (totalWriteoffs.total >= invoice.amount) {
        await db.run("UPDATE invoices SET status = 'cancelled' WHERE id = ?", [invoice_id]);
      }

      res.status(201).json({ message: 'Write-off recorded' });

      auditLog(req, {
        action: 'write_off',
        entityType: 'ar_writeoff',
        entityId: result.lastInsertRowid,
        newValues: { invoice_id, amount, reason },
      });
    } catch (err) {
      sendError(res, err, 'Failed to write off invoice');
    }
  }
);

module.exports = router;
