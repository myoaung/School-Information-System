const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'mobile_payment', 'other'];
const TRANSACTION_TYPES = ['income', 'expense', 'refund', 'adjustment'];

// ─── Get Current Open Session ─────────────────────────────────
router.get('/session/current', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const session = await db.get(
      `SELECT cs.*, u.name as opened_by_name
       FROM cash_sessions cs
       LEFT JOIN users u ON cs.opened_by = u.id
       WHERE cs.status = 'open'
       ORDER BY cs.opened_at DESC LIMIT 1`
    );

    if (!session) {
      return res.json({ session: null });
    }

    // Get transactions for this session
    const transactions = await db.all(
      `SELECT ct.*, u.name as recorded_by_name
       FROM cash_transactions ct
       LEFT JOIN users u ON ct.recorded_by = u.id
       WHERE ct.cash_session_id = ?
       ORDER BY ct.created_at ASC`,
      [session.id]
    );

    // Calculate running totals
    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
      else if (t.type === 'refund') expenses -= t.amount;
      else if (t.type === 'adjustment') income += t.amount;
    }

    res.json({
      session,
      transactions,
      summary: {
        opening_balance: session.opening_balance,
        total_income: income,
        total_expenses: expenses,
        expected_balance: session.opening_balance + income - expenses,
        transaction_count: transactions.length,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch current session');
  }
});

// ─── Open New Session ─────────────────────────────────────────
router.post('/session/open', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { opening_balance, notes } = req.body;

    if (opening_balance === undefined || opening_balance === null) {
      return res.status(400).json({ error: 'Opening balance is required' });
    }

    // Check if there's already an open session today
    const existing = await db.get("SELECT id FROM cash_sessions WHERE status = 'open'");
    if (existing) {
      return res.status(400).json({ error: 'A cash session is already open. Close it first.' });
    }

    const result = await db.run(
      `INSERT INTO cash_sessions (opening_balance, opened_by, notes)
       VALUES (?, ?, ?)`,
      [opening_balance, req.user.id, notes || null]
    );

    const session = await db.get('SELECT * FROM cash_sessions WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Cash session opened', session });

    auditLog(req, {
      action: 'open_session',
      entityType: 'cash_session',
      entityId: result.lastInsertRowid,
      newValues: { opening_balance },
    });
  } catch (err) {
    sendError(res, err, 'Failed to open session');
  }
});

// ─── Close Session ────────────────────────────────────────────
router.post('/session/close', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { actual_balance, notes } = req.body;

    const session = await db.get(
      "SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1"
    );
    if (!session) {
      return res.status(400).json({ error: 'No open session found' });
    }

    // Calculate expected balance
    const transactions = await db.all(
      'SELECT type, amount FROM cash_transactions WHERE cash_session_id = ?',
      [session.id]
    );

    let income = 0;
    let expenses = 0;
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount;
      else if (t.type === 'expense') expenses += t.amount;
      else if (t.type === 'refund') expenses -= t.amount;
      else if (t.type === 'adjustment') income += t.amount;
    }

    const expectedBalance = session.opening_balance + income - expenses;
    const variance = actual_balance !== null ? actual_balance - expectedBalance : null;

    await db.run(
      `UPDATE cash_sessions SET
       closed_by = ?, closing_balance = ?, actual_balance = ?, variance = ?,
       status = 'closed', notes = COALESCE(?, notes), closed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [req.user.id, expectedBalance, actual_balance ?? expectedBalance, variance, notes, session.id]
    );

    res.json({
      message: 'Session closed',
      summary: {
        opening_balance: session.opening_balance,
        total_income: income,
        total_expenses: expenses,
        expected_balance: expectedBalance,
        actual_balance: actual_balance ?? expectedBalance,
        variance,
      },
    });

    auditLog(req, {
      action: 'close_session',
      entityType: 'cash_session',
      entityId: session.id,
      newValues: { closing_balance: expectedBalance, actual_balance, variance },
    });
  } catch (err) {
    sendError(res, err, 'Failed to close session');
  }
});

// ─── Record Transaction ───────────────────────────────────────
router.post('/transactions', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      type,
      amount,
      payment_method,
      reference,
      description,
      related_invoice_id,
      related_expense_id,
    } = req.body;

    if (!type || !amount) {
      return res.status(400).json({ error: 'type and amount are required' });
    }

    if (!TRANSACTION_TYPES.includes(type)) {
      return res
        .status(400)
        .json({ error: `Invalid type. Must be: ${TRANSACTION_TYPES.join(', ')}` });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Get open session
    const session = await db.get(
      "SELECT * FROM cash_sessions WHERE status = 'open' ORDER BY opened_at DESC LIMIT 1"
    );
    if (!session) {
      return res.status(400).json({ error: 'No open cash session. Open one first.' });
    }

    const result = await db.run(
      `INSERT INTO cash_transactions (cash_session_id, type, amount, payment_method, reference, description, related_invoice_id, related_expense_id, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id,
        type,
        amount,
        payment_method || 'cash',
        reference || null,
        description || null,
        related_invoice_id || null,
        related_expense_id || null,
        req.user.id,
      ]
    );

    const transaction = await db.get('SELECT * FROM cash_transactions WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Transaction recorded', transaction });

    auditLog(req, {
      action: 'create',
      entityType: 'cash_transaction',
      entityId: result.lastInsertRowid,
      newValues: { type, amount, payment_method },
    });
  } catch (err) {
    sendError(res, err, 'Failed to record transaction');
  }
});

// ─── Session History ──────────────────────────────────────────
router.get('/sessions', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('cs.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const sessions = await db.all(
      `SELECT cs.*, o.name as opened_by_name, c.name as closed_by_name,
              (SELECT COUNT(*) FROM cash_transactions ct WHERE ct.cash_session_id = cs.id) as transaction_count
       FROM cash_sessions cs
       LEFT JOIN users o ON cs.opened_by = o.id
       LEFT JOIN users c ON cs.closed_by = c.id
       ${whereClause}
       ORDER BY cs.session_date DESC`,
      params
    );

    res.json({ sessions });
  } catch (err) {
    sendError(res, err, 'Failed to fetch sessions');
  }
});

// ─── Daily Report ─────────────────────────────────────────────
router.get('/report/:sessionId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const sessionId = parseInt(req.params.sessionId);

    const session = await db.get(
      `SELECT cs.*, o.name as opened_by_name, c.name as closed_by_name
       FROM cash_sessions cs
       LEFT JOIN users o ON cs.opened_by = o.id
       LEFT JOIN users c ON cs.closed_by = c.id
       WHERE cs.id = ?`,
      [sessionId]
    );

    if (!session) return res.status(404).json({ error: 'Session not found' });

    const transactions = await db.all(
      `SELECT ct.*, u.name as recorded_by_name
       FROM cash_transactions ct
       LEFT JOIN users u ON ct.recorded_by = u.id
       WHERE ct.cash_session_id = ?
       ORDER BY ct.created_at ASC`,
      [sessionId]
    );

    // Breakdown by type
    const byType = {};
    for (const t of transactions) {
      if (!byType[t.type]) byType[t.type] = 0;
      byType[t.type] += t.amount;
    }

    // Breakdown by payment method
    const byMethod = {};
    for (const t of transactions) {
      if (!byMethod[t.payment_method]) byMethod[t.payment_method] = 0;
      byMethod[t.payment_method] += t.amount;
    }

    res.json({
      session,
      transactions,
      report: {
        opening_balance: session.opening_balance,
        by_type: byType,
        by_method: byMethod,
        closing_balance: session.closing_balance,
        actual_balance: session.actual_balance,
        variance: session.variance,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate report');
  }
});

module.exports = router;
