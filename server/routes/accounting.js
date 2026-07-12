const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];

// ─── List Accounts ─────────────────────────────────────────────
router.get('/accounts', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { type, active } = req.query;

    let where = [];
    let params = [];

    if (type) {
      where.push('a.type = ?');
      params.push(type);
    }
    if (active !== undefined) {
      where.push('a.is_active = ?');
      params.push(active === 'true' ? 1 : 0);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const accounts = await db.all(
      `SELECT a.*,
              COALESCE(SUM(jl.debit), 0) as total_debit,
              COALESCE(SUM(jl.credit), 0) as total_credit
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted'
       ${whereClause}
       GROUP BY a.id
       ORDER BY a.code`,
      params
    );

    // Calculate balance based on account type
    const result = accounts.map((a) => {
      let balance = 0;
      if (a.type === 'asset' || a.type === 'expense') {
        balance = a.total_debit - a.total_credit; // Normal debit balance
      } else {
        balance = a.total_credit - a.total_debit; // Normal credit balance
      }
      return { ...a, balance };
    });

    res.json({ accounts: result });
  } catch (err) {
    sendError(res, err, 'Failed to fetch accounts');
  }
});

// ─── Create Account ────────────────────────────────────────────
router.post(
  '/accounts',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { code, name, type, parent_id, description } = req.body;

      if (!code || !name || !type) {
        return res.status(400).json({ error: 'code, name, and type are required' });
      }

      if (!ACCOUNT_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ error: `Invalid type. Must be: ${ACCOUNT_TYPES.join(', ')}` });
      }

      // Check unique code
      const existing = await db.get('SELECT id FROM accounts WHERE code = ?', [code]);
      if (existing) {
        return res.status(400).json({ error: `Account code '${code}' already exists` });
      }

      const result = await db.run(
        `INSERT INTO accounts (code, name, type, parent_id, description)
       VALUES (?, ?, ?, ?, ?)`,
        [code, name, type, parent_id || null, description || null]
      );

      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [result.lastInsertRowid]);

      res.status(201).json({ message: 'Account created', account });

      auditLog(req, {
        action: 'create',
        entityType: 'account',
        entityId: result.lastInsertRowid,
        newValues: { code, name, type },
      });
    } catch (err) {
      sendError(res, err, 'Failed to create account');
    }
  }
);

// ─── Update Account ────────────────────────────────────────────
router.put(
  '/accounts/:id',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { name, type, parent_id, is_active, description } = req.body;

      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [id]);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      if (type && !ACCOUNT_TYPES.includes(type)) {
        return res
          .status(400)
          .json({ error: `Invalid type. Must be: ${ACCOUNT_TYPES.join(', ')}` });
      }

      await db.run(
        `UPDATE accounts SET name = ?, type = ?, parent_id = ?, is_active = ?, description = ?
       WHERE id = ?`,
        [
          name ?? account.name,
          type ?? account.type,
          parent_id !== undefined ? parent_id : account.parent_id,
          is_active !== undefined ? (is_active ? 1 : 0) : account.is_active,
          description !== undefined ? description : account.description,
          id,
        ]
      );

      res.json({ message: 'Account updated' });

      auditLog(req, {
        action: 'update',
        entityType: 'account',
        entityId: id,
        newValues: { name, type, is_active },
      });
    } catch (err) {
      sendError(res, err, 'Failed to update account');
    }
  }
);

// ─── List Journal Entries ──────────────────────────────────────
router.get('/journal', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { status, start_date, end_date, source_type } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('je.status = ?');
      params.push(status);
    }
    if (start_date) {
      where.push('je.entry_date >= ?');
      params.push(start_date);
    }
    if (end_date) {
      where.push('je.entry_date <= ?');
      params.push(end_date);
    }
    if (source_type) {
      where.push('je.source_type = ?');
      params.push(source_type);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const entries = await db.all(
      `SELECT je.*, u.name as created_by_name, p.name as posted_by_name
       FROM journal_entries je
       LEFT JOIN users u ON je.created_by = u.id
       LEFT JOIN users p ON je.posted_by = p.id
       ${whereClause}
       ORDER BY je.entry_date DESC, je.id DESC`,
      params
    );

    // Fetch lines for each entry
    const result = [];
    for (const entry of entries) {
      const lines = await db.all(
        `SELECT jl.*, a.code as account_code, a.name as account_name
         FROM journal_lines jl
         JOIN accounts a ON jl.account_id = a.id
         WHERE jl.journal_entry_id = ?
         ORDER BY jl.debit DESC, jl.credit DESC`,
        [entry.id]
      );

      const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      result.push({ ...entry, lines, total_debit: totalDebit, total_credit: totalCredit });
    }

    res.json({ entries: result });
  } catch (err) {
    sendError(res, err, 'Failed to fetch journal entries');
  }
});

// ─── Create Journal Entry ──────────────────────────────────────
router.post('/journal', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { entry_date, reference, description, lines, source_type, source_id } = req.body;

    if (!entry_date || !description || !lines || !Array.isArray(lines) || lines.length < 2) {
      return res
        .status(400)
        .json({ error: 'entry_date, description, and at least 2 lines are required' });
    }

    // Validate debits = credits
    let totalDebit = 0;
    let totalCredit = 0;
    for (const line of lines) {
      if (!line.account_id) {
        return res.status(400).json({ error: 'Each line must have an account_id' });
      }
      const debit = parseFloat(line.debit) || 0;
      const credit = parseFloat(line.credit) || 0;
      if (debit < 0 || credit < 0) {
        return res.status(400).json({ error: 'Debit and credit must be non-negative' });
      }
      if (debit === 0 && credit === 0) {
        return res.status(400).json({ error: 'Each line must have either debit or credit amount' });
      }
      if (debit > 0 && credit > 0) {
        return res.status(400).json({ error: 'A line cannot have both debit and credit' });
      }
      totalDebit += debit;
      totalCredit += credit;
    }

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({
        error: `Debits (${totalDebit}) must equal credits (${totalCredit})`,
      });
    }

    // Create entry
    const entryResult = await db.run(
      `INSERT INTO journal_entries (entry_date, reference, description, source_type, source_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        entry_date,
        reference || null,
        description,
        source_type || null,
        source_id || null,
        req.user.id,
      ]
    );

    const entryId = entryResult.lastInsertRowid;

    // Insert lines
    for (const line of lines) {
      await db.run(
        `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, ?, ?, ?)`,
        [
          entryId,
          line.account_id,
          parseFloat(line.debit) || 0,
          parseFloat(line.credit) || 0,
          line.description || null,
        ]
      );
    }

    const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [entryId]);
    const entryLines = await db.all(
      `SELECT jl.*, a.code as account_code, a.name as account_name
       FROM journal_lines jl
       JOIN accounts a ON jl.account_id = a.id
       WHERE jl.journal_entry_id = ?`,
      [entryId]
    );

    res.status(201).json({ message: 'Journal entry created', entry, lines: entryLines });

    auditLog(req, {
      action: 'create',
      entityType: 'journal_entry',
      entityId: entryId,
      newValues: { description, total_debit: totalDebit, total_credit: totalCredit },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create journal entry');
  }
});

// ─── Post Journal Entry ────────────────────────────────────────
router.put(
  '/journal/:id/post',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [id]);
      if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

      if (entry.status !== 'draft') {
        return res.status(400).json({ error: `Cannot post entry with status '${entry.status}'` });
      }

      // Verify debits = credits
      const lines = await db.all('SELECT * FROM journal_lines WHERE journal_entry_id = ?', [id]);
      const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        return res.status(400).json({ error: 'Debits must equal credits to post' });
      }

      await db.run(
        `UPDATE journal_entries SET status = 'posted', posted_by = ?, posted_at = ?
       WHERE id = ?`,
        [req.user.id, new Date().toISOString(), id]
      );

      res.json({ message: 'Journal entry posted' });

      auditLog(req, {
        action: 'post',
        entityType: 'journal_entry',
        entityId: id,
        newValues: { status: 'posted' },
      });
    } catch (err) {
      sendError(res, err, 'Failed to post journal entry');
    }
  }
);

// ─── Reverse Journal Entry ─────────────────────────────────────
router.put(
  '/journal/:id/reverse',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;

      const entry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [id]);
      if (!entry) return res.status(404).json({ error: 'Journal entry not found' });

      if (entry.status !== 'posted') {
        return res
          .status(400)
          .json({ error: `Cannot reverse entry with status '${entry.status}'` });
      }

      // Get original lines
      const lines = await db.all('SELECT * FROM journal_lines WHERE journal_entry_id = ?', [id]);

      // Create reversal entry
      const reversalResult = await db.run(
        `INSERT INTO journal_entries (entry_date, reference, description, source_type, source_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [
          new Date().toISOString().split('T')[0],
          entry.reference ? `REV-${entry.reference}` : null,
          `Reversal of: ${entry.description}`,
          'reversal',
          id,
          req.user.id,
        ]
      );

      const reversalId = reversalResult.lastInsertRowid;

      // Reverse lines (swap debit/credit)
      for (const line of lines) {
        await db.run(
          `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, ?, ?, ?)`,
          [
            reversalId,
            line.account_id,
            line.credit,
            line.debit,
            `Reversal: ${line.description || ''}`,
          ]
        );
      }

      // Mark original as reversed
      await db.run(
        `UPDATE journal_entries SET status = 'reversed', reversed_by = ?, reversed_at = ?,
       reversal_reason = ? WHERE id = ?`,
        [req.user.id, new Date().toISOString(), reason || 'Reversed by admin', id]
      );

      // Post reversal automatically
      await db.run(
        `UPDATE journal_entries SET status = 'posted', posted_by = ?, posted_at = ?
       WHERE id = ?`,
        [req.user.id, new Date().toISOString(), reversalId]
      );

      res.json({ message: 'Journal entry reversed', reversal_id: reversalId });

      auditLog(req, {
        action: 'reverse',
        entityType: 'journal_entry',
        entityId: id,
        newValues: { reversal_id: reversalId, reason },
      });
    } catch (err) {
      sendError(res, err, 'Failed to reverse journal entry');
    }
  }
);

// ─── Account Ledger ────────────────────────────────────────────
router.get(
  '/ledger/:accountId',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const { start_date, end_date } = req.query;

      const account = await db.get('SELECT * FROM accounts WHERE id = ?', [accountId]);
      if (!account) return res.status(404).json({ error: 'Account not found' });

      let where = ['jl.account_id = ?', 'je.status = ?'];
      let params = [accountId, 'posted'];

      if (start_date) {
        where.push('je.entry_date >= ?');
        params.push(start_date);
      }
      if (end_date) {
        where.push('je.entry_date <= ?');
        params.push(end_date);
      }

      const whereClause = where.join(' AND ');

      const transactions = await db.all(
        `SELECT jl.*, je.entry_date, je.reference, je.description as entry_description
       FROM journal_lines jl
       JOIN journal_entries je ON jl.journal_entry_id = je.id
       WHERE ${whereClause}
       ORDER BY je.entry_date, je.id`,
        params
      );

      // Calculate running balance
      let balance = 0;
      const isDebitNormal = account.type === 'asset' || account.type === 'expense';

      const result = transactions.map((t) => {
        if (isDebitNormal) {
          balance += t.debit - t.credit;
        } else {
          balance += t.credit - t.debit;
        }
        return { ...t, running_balance: balance };
      });

      res.json({ account, transactions: result, closing_balance: balance });
    } catch (err) {
      sendError(res, err, 'Failed to fetch ledger');
    }
  }
);

// ─── Trial Balance ─────────────────────────────────────────────
router.get(
  '/trial-balance',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { as_of_date } = req.query;

      let dateFilter = '';
      let params = [];

      if (as_of_date) {
        dateFilter = 'AND je.entry_date <= ?';
        params.push(as_of_date);
      }

      const accounts = await db.all(
        `SELECT a.*,
              COALESCE(SUM(jl.debit), 0) as total_debit,
              COALESCE(SUM(jl.credit), 0) as total_credit
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted' ${dateFilter}
       WHERE a.is_active = true
       GROUP BY a.id
       ORDER BY a.code`,
        params
      );

      let totalDebit = 0;
      let totalCredit = 0;

      const result = accounts.map((a) => {
        let debit = 0;
        let credit = 0;

        if (a.type === 'asset' || a.type === 'expense') {
          const balance = a.total_debit - a.total_credit;
          if (balance >= 0) {
            debit = balance;
          } else {
            credit = Math.abs(balance);
          }
        } else {
          const balance = a.total_credit - a.total_debit;
          if (balance >= 0) {
            credit = balance;
          } else {
            debit = Math.abs(balance);
          }
        }

        totalDebit += debit;
        totalCredit += credit;

        return {
          ...a,
          display_debit: debit,
          display_credit: credit,
        };
      });

      res.json({
        accounts: result.filter((a) => a.display_debit > 0 || a.display_credit > 0),
        totals: { debit: totalDebit, credit: totalCredit },
        is_balanced: Math.abs(totalDebit - totalCredit) < 0.01,
      });
    } catch (err) {
      sendError(res, err, 'Failed to generate trial balance');
    }
  }
);

// ─── Income Statement ──────────────────────────────────────────
router.get(
  '/income-statement',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { start_date, end_date } = req.query;

      let where = ['je.status = ?', 'je.entry_date >= ?'];
      let params = ['posted'];

      if (start_date) {
        where.push('je.entry_date >= ?');
        params.push(start_date);
      }
      if (end_date) {
        where.push('je.entry_date <= ?');
        params.push(end_date);
      }

      // Revenue accounts
      const revenue = await db.all(
        `SELECT a.code, a.name,
              COALESCE(SUM(jl.credit - jl.debit), 0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted'
       WHERE a.type = 'revenue' AND a.is_active = true
       ${start_date ? 'AND je.entry_date >= ?' : ''}
       ${end_date ? 'AND je.entry_date <= ?' : ''}
       GROUP BY a.id
       ORDER BY a.code`,
        params.filter((_, i) => {
          // Filter out 'posted' and handle date params
          if (i === 0) return false; // skip 'posted'
          return true;
        })
      );

      // Expense accounts
      const expenses = await db.all(
        `SELECT a.code, a.name,
              COALESCE(SUM(jl.debit - jl.credit), 0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted'
       WHERE a.type = 'expense' AND a.is_active = true
       ${start_date ? 'AND je.entry_date >= ?' : ''}
       ${end_date ? 'AND je.entry_date <= ?' : ''}
       GROUP BY a.id
       ORDER BY a.code`,
        params.filter((_, i) => {
          if (i === 0) return false;
          return true;
        })
      );

      const totalRevenue = revenue.reduce((sum, r) => sum + r.balance, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.balance, 0);
      const netIncome = totalRevenue - totalExpenses;

      res.json({
        revenue,
        expenses,
        totals: {
          revenue: totalRevenue,
          expenses: totalExpenses,
          net_income: netIncome,
        },
      });
    } catch (err) {
      sendError(res, err, 'Failed to generate income statement');
    }
  }
);

// ─── Balance Sheet ─────────────────────────────────────────────
router.get(
  '/balance-sheet',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { as_of_date } = req.query;

      let dateFilter = '';
      let params = [];

      if (as_of_date) {
        dateFilter = 'AND je.entry_date <= ?';
        params.push(as_of_date);
      }

      // Assets
      const assets = await db.all(
        `SELECT a.code, a.name,
              COALESCE(SUM(jl.debit - jl.credit), 0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted' ${dateFilter}
       WHERE a.type = 'asset' AND a.is_active = true
       GROUP BY a.id
       ORDER BY a.code`,
        params
      );

      // Liabilities
      const liabilities = await db.all(
        `SELECT a.code, a.name,
              COALESCE(SUM(jl.credit - jl.debit), 0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted' ${dateFilter}
       WHERE a.type = 'liability' AND a.is_active = true
       GROUP BY a.id
       ORDER BY a.code`,
        params
      );

      // Equity
      const equity = await db.all(
        `SELECT a.code, a.name,
              COALESCE(SUM(jl.credit - jl.debit), 0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted' ${dateFilter}
       WHERE a.type = 'equity' AND a.is_active = true
       GROUP BY a.id
       ORDER BY a.code`,
        params
      );

      const totalAssets = assets.reduce((sum, a) => sum + a.balance, 0);
      const totalLiabilities = liabilities.reduce((sum, l) => sum + l.balance, 0);
      const totalEquity = equity.reduce((sum, e) => sum + e.balance, 0);

      res.json({
        assets,
        liabilities,
        equity,
        totals: {
          assets: totalAssets,
          liabilities: totalLiabilities,
          equity: totalEquity,
          is_balanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
        },
      });
    } catch (err) {
      sendError(res, err, 'Failed to generate balance sheet');
    }
  }
);

// ─── List Accounting Periods ───────────────────────────────────
router.get('/periods', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const periods = await db.all(
      `SELECT ap.*, u.name as closed_by_name
       FROM accounting_periods ap
       LEFT JOIN users u ON ap.closed_by = u.id
       ORDER BY ap.start_date DESC`
    );

    res.json({ periods });
  } catch (err) {
    sendError(res, err, 'Failed to fetch periods');
  }
});

// ─── Create Accounting Period ──────────────────────────────────
router.post('/periods', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { name, start_date, end_date, academic_year_id } = req.body;

    if (!name || !start_date || !end_date) {
      return res.status(400).json({ error: 'name, start_date, and end_date are required' });
    }

    // Check for overlapping periods
    const overlap = await db.get(
      `SELECT id FROM accounting_periods
       WHERE status = 'open' AND start_date <= ? AND end_date >= ?`,
      [end_date, start_date]
    );

    if (overlap) {
      return res.status(400).json({ error: 'Period overlaps with an existing open period' });
    }

    const result = await db.run(
      `INSERT INTO accounting_periods (name, start_date, end_date, academic_year_id)
       VALUES (?, ?, ?, ?)`,
      [name, start_date, end_date, academic_year_id || null]
    );

    const period = await db.get('SELECT * FROM accounting_periods WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Period created', period });

    auditLog(req, {
      action: 'create',
      entityType: 'accounting_period',
      entityId: result.lastInsertRowid,
      newValues: { name, start_date, end_date },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create period');
  }
});

// ─── Close Accounting Period ───────────────────────────────────
router.put(
  '/periods/:id/close',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      const period = await db.get('SELECT * FROM accounting_periods WHERE id = ?', [id]);
      if (!period) return res.status(404).json({ error: 'Period not found' });

      if (period.status === 'closed') {
        return res.status(400).json({ error: 'Period is already closed' });
      }

      // Check for unposted entries in this period
      const unposted = await db.get(
        `SELECT COUNT(*) as count FROM journal_entries
       WHERE status = 'draft' AND entry_date >= ? AND entry_date <= ?`,
        [period.start_date, period.end_date]
      );

      if (unposted.count > 0) {
        return res.status(400).json({
          error: `Cannot close period with ${unposted.count} unposted entries. Post or delete them first.`,
        });
      }

      // Calculate net income for the period and create closing entry
      const revenueResult = await db.get(
        `SELECT COALESCE(SUM(jl.credit - jl.debit), 0) as total
       FROM journal_lines jl
       JOIN journal_entries je ON jl.journal_entry_id = je.id
       JOIN accounts a ON jl.account_id = a.id
       WHERE je.status = 'posted' AND a.type = 'revenue'
       AND je.entry_date >= ? AND je.entry_date <= ?`,
        [period.start_date, period.end_date]
      );

      const expenseResult = await db.get(
        `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as total
       FROM journal_lines jl
       JOIN journal_entries je ON jl.journal_entry_id = je.id
       JOIN accounts a ON jl.account_id = a.id
       WHERE je.status = 'posted' AND a.type = 'expense'
       AND je.entry_date >= ? AND je.entry_date <= ?`,
        [period.start_date, period.end_date]
      );

      const netIncome = (revenueResult?.total || 0) - (expenseResult?.total || 0);

      // Create closing entry if there's net income/loss
      if (Math.abs(netIncome) > 0.01) {
        // Get revenue and expense account IDs
        const revenueAccounts = await db.all(
          `SELECT a.id FROM accounts a
         JOIN journal_lines jl ON a.id = jl.account_id
         JOIN journal_entries je ON jl.journal_entry_id = je.id
         WHERE a.type = 'revenue' AND je.status = 'posted'
         AND je.entry_date >= ? AND je.entry_date <= ?
         GROUP BY a.id`,
          [period.start_date, period.end_date]
        );

        const expenseAccounts = await db.all(
          `SELECT a.id FROM accounts a
         JOIN journal_lines jl ON a.id = jl.account_id
         JOIN journal_entries je ON jl.journal_entry_id = je.id
         WHERE a.type = 'expense' AND je.status = 'posted'
         AND je.entry_date >= ? AND je.entry_date <= ?
         GROUP BY a.id`,
          [period.start_date, period.end_date]
        );

        const currentYearEarnings = await db.get("SELECT id FROM accounts WHERE code = '3100'");

        if (currentYearEarnings) {
          // Create closing entry
          const closingResult = await db.run(
            `INSERT INTO journal_entries (entry_date, reference, description, source_type, created_by, posted_by, posted_at)
           VALUES (?, ?, ?, 'period_close', ?, ?, ?)`,
            [
              period.end_date,
              `CLOSE-${period.name}`,
              `Closing entry for ${period.name}`,
              req.user.id,
              req.user.id,
              new Date().toISOString(),
            ]
          );

          const closingId = closingResult.lastInsertRowid;

          // Close revenue accounts (debit revenue, credit current year earnings)
          for (const acc of revenueAccounts) {
            const amount = await db.get(
              `SELECT COALESCE(SUM(jl.credit - jl.debit), 0) as balance
             FROM journal_lines jl
             JOIN journal_entries je ON jl.journal_entry_id = je.id
             WHERE jl.account_id = ? AND je.status = 'posted'
             AND je.entry_date >= ? AND je.entry_date <= ?`,
              [acc.id, period.start_date, period.end_date]
            );

            if (amount && Math.abs(amount.balance) > 0.01) {
              await db.run(
                `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
               VALUES (?, ?, ?, 0, ?)`,
                [closingId, acc.id, amount.balance, `Close revenue account`]
              );
            }
          }

          // Close expense accounts (debit current year earnings, credit expense)
          for (const acc of expenseAccounts) {
            const amount = await db.get(
              `SELECT COALESCE(SUM(jl.debit - jl.credit), 0) as balance
             FROM journal_lines jl
             JOIN journal_entries je ON jl.journal_entry_id = je.id
             WHERE jl.account_id = ? AND je.status = 'posted'
             AND je.entry_date >= ? AND je.entry_date <= ?`,
              [acc.id, period.start_date, period.end_date]
            );

            if (amount && Math.abs(amount.balance) > 0.01) {
              await db.run(
                `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
               VALUES (?, ?, 0, ?, ?)`,
                [closingId, acc.id, amount.balance, `Close expense account`]
              );
            }
          }

          // Transfer to retained earnings
          if (Math.abs(netIncome) > 0.01) {
            const retainedEarnings = await db.get("SELECT id FROM accounts WHERE code = '3000'");

            if (retainedEarnings) {
              await db.run(
                `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
               VALUES (?, ?, ?, ?, ?)`,
                [
                  closingId,
                  netIncome > 0 ? currentYearEarnings.id : retainedEarnings.id,
                  netIncome > 0 ? 0 : Math.abs(netIncome),
                  netIncome > 0 ? netIncome : 0,
                  `Transfer net income to retained earnings`,
                ]
              );

              await db.run(
                `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
               VALUES (?, ?, ?, ?, ?)`,
                [
                  closingId,
                  netIncome > 0 ? retainedEarnings.id : currentYearEarnings.id,
                  netIncome > 0 ? netIncome : 0,
                  netIncome > 0 ? 0 : Math.abs(netIncome),
                  `Transfer net income to retained earnings`,
                ]
              );
            }
          }
        }
      }

      // Close the period
      await db.run(
        `UPDATE accounting_periods SET status = 'closed', closed_by = ?, closed_at = ?
       WHERE id = ?`,
        [req.user.id, new Date().toISOString(), id]
      );

      res.json({
        message: 'Period closed',
        net_income: netIncome,
      });

      auditLog(req, {
        action: 'close',
        entityType: 'accounting_period',
        entityId: id,
        newValues: { net_income: netIncome },
      });
    } catch (err) {
      sendError(res, err, 'Failed to close period');
    }
  }
);

// ─── List Reconciliations ──────────────────────────────────────
router.get(
  '/reconciliation',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const reconciliations = await db.all(
        `SELECT br.*, a.code as account_code, a.name as account_name, u.name as reconciled_by_name
       FROM bank_reconciliations br
       JOIN accounts a ON br.account_id = a.id
       LEFT JOIN users u ON br.reconciled_by = u.id
       ORDER BY br.statement_date DESC`
      );

      res.json({ reconciliations });
    } catch (err) {
      sendError(res, err, 'Failed to fetch reconciliations');
    }
  }
);

// ─── Create Reconciliation ─────────────────────────────────────
router.post(
  '/reconciliation',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { account_id, statement_date, statement_balance, entry_ids } = req.body;

      if (!account_id || !statement_date || statement_balance === undefined) {
        return res
          .status(400)
          .json({ error: 'account_id, statement_date, and statement_balance are required' });
      }

      // Calculate book balance for this account
      const bookResult = await db.get(
        `SELECT a.type,
              COALESCE(SUM(jl.debit), 0) as total_debit,
              COALESCE(SUM(jl.credit), 0) as total_credit
       FROM accounts a
       LEFT JOIN journal_lines jl ON a.id = jl.account_id
       LEFT JOIN journal_entries je ON jl.journal_entry_id = je.id AND je.status = 'posted'
       WHERE a.id = ?
       GROUP BY a.id`,
        [account_id]
      );

      if (!bookResult) return res.status(404).json({ error: 'Account not found' });

      const bookBalance =
        bookResult.type === 'asset'
          ? bookResult.total_debit - bookResult.total_credit
          : bookResult.total_credit - bookResult.total_debit;

      const difference = statement_balance - bookBalance;

      const result = await db.run(
        `INSERT INTO bank_reconciliations (account_id, statement_date, statement_balance, book_balance, difference, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
        [account_id, statement_date, statement_balance, bookBalance, difference, req.user.id]
      );

      const reconId = result.lastInsertRowid;

      // Link entries if provided
      if (entry_ids && Array.isArray(entry_ids)) {
        for (const entryId of entry_ids) {
          await db.run(
            `INSERT INTO reconciliation_lines (reconciliation_id, journal_entry_id)
           VALUES (?, ?)`,
            [reconId, entryId]
          );
        }
      }

      const reconciliation = await db.get('SELECT * FROM bank_reconciliations WHERE id = ?', [
        reconId,
      ]);

      res.status(201).json({ message: 'Reconciliation created', reconciliation });

      auditLog(req, {
        action: 'create',
        entityType: 'bank_reconciliation',
        entityId: reconId,
        newValues: { account_id, statement_balance, book_balance: bookBalance, difference },
      });
    } catch (err) {
      sendError(res, err, 'Failed to create reconciliation');
    }
  }
);

// ─── Update Reconciliation ─────────────────────────────────────
router.put(
  '/reconciliation/:id',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, entry_ids, reconciled_ids } = req.body;

      const recon = await db.get('SELECT * FROM bank_reconciliations WHERE id = ?', [id]);
      if (!recon) return res.status(404).json({ error: 'Reconciliation not found' });

      if (status === 'reconciled') {
        if (Math.abs(recon.difference) > 0.01) {
          return res
            .status(400)
            .json({ error: 'Cannot reconcile when book and statement balances differ' });
        }

        await db.run(
          `UPDATE bank_reconciliations SET status = 'reconciled', reconciled_by = ?, reconciled_at = ?
         WHERE id = ?`,
          [req.user.id, new Date().toISOString(), id]
        );
      }

      // Update reconciled status for lines
      if (reconciled_ids && Array.isArray(reconciled_ids)) {
        for (const lineId of reconciled_ids) {
          await db.run(
            'UPDATE reconciliation_lines SET reconciled = true WHERE id = ? AND reconciliation_id = ?',
            [lineId, id]
          );
        }
      }

      res.json({ message: 'Reconciliation updated' });

      auditLog(req, {
        action: 'update',
        entityType: 'bank_reconciliation',
        entityId: id,
        newValues: { status },
      });
    } catch (err) {
      sendError(res, err, 'Failed to update reconciliation');
    }
  }
);

// ─── Auto-Journal from Fee Payment ─────────────────────────────
router.post(
  '/auto-journal/:sourceType/:sourceId',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { sourceType, sourceId } = req.params;

      let entry = null;

      if (sourceType === 'payment') {
        // Auto-create journal entry from fee payment
        const payment = await db.get(
          `SELECT p.*, ft.name as fee_type_name
         FROM payments p
         LEFT JOIN fee_types ft ON p.fee_type_id = ft.id
         WHERE p.id = ?`,
          [sourceId]
        );

        if (!payment) return res.status(404).json({ error: 'Payment not found' });

        // Check if already journalized
        const existing = await db.get(
          "SELECT id FROM journal_entries WHERE source_type = 'payment' AND source_id = ?",
          [sourceId]
        );
        if (existing) {
          return res.status(400).json({ error: 'Payment already journalized' });
        }

        // Get cash/bank account
        const cashAccount = await db.get("SELECT id FROM accounts WHERE code = '1000'");
        const tuitionRevenue = await db.get("SELECT id FROM accounts WHERE code = '4000'");
        const arAccount = await db.get("SELECT id FROM accounts WHERE code = '1200'");

        if (!cashAccount || !tuitionRevenue) {
          return res
            .status(500)
            .json({ error: 'Required accounts not found. Run migration first.' });
        }

        // Create journal entry
        const entryResult = await db.run(
          `INSERT INTO journal_entries (entry_date, reference, description, source_type, source_id, created_by, posted_by, posted_at)
         VALUES (?, ?, ?, 'payment', ?, ?, ?, ?)`,
          [
            payment.paid_at
              ? payment.paid_at.split('T')[0]
              : new Date().toISOString().split('T')[0],
            `PAY-${payment.id}`,
            `Fee payment from student - ${payment.fee_type_name || 'Fee'}`,
            sourceId,
            req.user.id,
            req.user.id,
            new Date().toISOString(),
          ]
        );

        entry = { id: entryResult.lastInsertRowid };

        // Debit cash, credit revenue
        await db.run(
          `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, ?, 0, ?)`,
          [entry.id, cashAccount.id, payment.amount, 'Cash received']
        );

        await db.run(
          `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, 0, ?, ?)`,
          [entry.id, tuitionRevenue.id, payment.amount, 'Tuition revenue recognized']
        );
      } else if (sourceType === 'expense') {
        // Auto-create journal entry from approved expense
        const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [sourceId]);

        if (!expense) return res.status(404).json({ error: 'Expense not found' });

        if (expense.status !== 'approved') {
          return res.status(400).json({ error: 'Expense must be approved before journalizing' });
        }

        // Check if already journalized
        const existing = await db.get(
          "SELECT id FROM journal_entries WHERE source_type = 'expense' AND source_id = ?",
          [sourceId]
        );
        if (existing) {
          return res.status(400).json({ error: 'Expense already journalized' });
        }

        // Get accounts
        const cashAccount = await db.get("SELECT id FROM accounts WHERE code = '1000'");
        const expenseAccount = await db.get(
          "SELECT id FROM accounts WHERE type = 'expense' AND name LIKE ?",
          [`%${expense.category}%`]
        );

        if (!cashAccount) {
          return res.status(500).json({ error: 'Cash account not found' });
        }

        // Create journal entry
        const entryResult = await db.run(
          `INSERT INTO journal_entries (entry_date, reference, description, source_type, source_id, created_by, posted_by, posted_at)
         VALUES (?, ?, ?, 'expense', ?, ?, ?, ?)`,
          [
            expense.expense_date,
            `EXP-${expense.id}`,
            `Expense: ${expense.description}`,
            sourceId,
            req.user.id,
            req.user.id,
            new Date().toISOString(),
          ]
        );

        entry = { id: entryResult.lastInsertRowid };

        // Debit expense, credit cash
        const expAccountId = expenseAccount
          ? expenseAccount.id
          : (await db.get("SELECT id FROM accounts WHERE code = '5600'")).id;

        await db.run(
          `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, ?, 0, ?)`,
          [entry.id, expAccountId, expense.amount, expense.description]
        );

        await db.run(
          `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
         VALUES (?, ?, 0, ?, ?)`,
          [entry.id, cashAccount.id, expense.amount, 'Cash paid']
        );
      } else {
        return res.status(400).json({ error: 'Invalid source type. Must be: payment, expense' });
      }

      const journalEntry = await db.get('SELECT * FROM journal_entries WHERE id = ?', [entry.id]);
      const lines = await db.all(
        `SELECT jl.*, a.code as account_code, a.name as account_name
       FROM journal_lines jl
       JOIN accounts a ON jl.account_id = a.id
       WHERE jl.journal_entry_id = ?`,
        [entry.id]
      );

      res.status(201).json({ message: 'Journal entry created', entry: journalEntry, lines });
    } catch (err) {
      sendError(res, err, 'Failed to create auto-journal entry');
    }
  }
);

module.exports = router;
