const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { invoiceRules, paymentRules } = require('../middleware/validate');
const { auditLog } = require('../middleware/audit');

// ── Fee Structures ──

// List fee structures
// SECURITY: Restrict to admin/accountant — fee structures contain sensitive pricing data
router.get('/fees', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { grade_id, academic_year_id } = req.query;
    let sql = `
      SELECT fs.*, g.name as grade_name, ay.name as academic_year_name
      FROM fee_structures fs
      LEFT JOIN grades g ON g.id = fs.grade_id
      LEFT JOIN academic_years ay ON ay.id = fs.academic_year_id
      WHERE 1=1
    `;
    const params = [];
    if (grade_id) {
      sql += ' AND fs.grade_id = ?';
      params.push(grade_id);
    }
    if (academic_year_id) {
      sql += ' AND fs.academic_year_id = ?';
      params.push(academic_year_id);
    }
    sql += ' ORDER BY fs.fee_type';
    res.json(await db.all(sql, params));
  } catch (err) {
    sendError(res, err);
  }
});

// Create fee structure
router.post('/fees', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { grade_id, fee_type, amount, academic_year_id } = req.body;
    if (!fee_type || !amount)
      return res.status(400).json({ error: 'fee_type and amount required' });
    const result = await db.run(
      'INSERT INTO fee_structures (grade_id, fee_type, amount, academic_year_id) VALUES (?, ?, ?, ?)',
      [grade_id || null, fee_type, amount, academic_year_id || null]
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Fee structure created' });

    auditLog(req, {
      action: 'create',
      entityType: 'fee_structure',
      entityId: result.lastInsertRowid,
      newValues: { fee_type, amount, grade_id },
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Update fee structure
router.put('/fees/:id', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { grade_id, fee_type, amount, academic_year_id } = req.body;
    await db.run(
      'UPDATE fee_structures SET grade_id = ?, fee_type = ?, amount = ?, academic_year_id = ? WHERE id = ?',
      [grade_id || null, fee_type, amount, academic_year_id || null, req.params.id]
    );
    res.json({ message: 'Updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'fee_structure',
      entityId: parseInt(req.params.id),
      newValues: { fee_type, amount, grade_id },
    });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete fee structure
router.delete(
  '/fees/:id',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      await db.run('DELETE FROM fee_structures WHERE id = ?', [req.params.id]);
      res.json({ message: 'Deleted' });

      auditLog(req, {
        action: 'delete',
        entityType: 'fee_structure',
        entityId: parseInt(req.params.id),
      });
    } catch (err) {
      sendError(res, err);
    }
  }
);

// ── Invoices ──

// List invoices
// SECURITY: Restrict to admin/accountant — students/parents use /student/:id/summary instead
router.get('/invoices', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const { student_id, status } = req.query;
    let sql = `
      SELECT inv.*, u.name as student_name, s.student_id as student_code
      FROM invoices inv
      JOIN users u ON u.id = inv.student_id
      LEFT JOIN students s ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    if (student_id) {
      sql += ' AND inv.student_id = ?';
      params.push(student_id);
    }
    if (status) {
      sql += ' AND inv.status = ?';
      params.push(status);
    }
    sql += ' ORDER BY inv.created_at DESC';
    res.json(await db.all(sql, params));
  } catch (err) {
    sendError(res, err);
  }
});

// Get single invoice with payments
router.get('/invoices/:id', authMiddleware, async (req, res) => {
  try {
    const invoice = await db.get(
      `
      SELECT inv.*, u.name as student_name, s.student_id as student_code,
             fs.fee_type, g.name as grade_name
      FROM invoices inv
      JOIN users u ON u.id = inv.student_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN fee_structures fs ON fs.id = inv.fee_structure_id
      LEFT JOIN grades g ON g.id = fs.grade_id
      WHERE inv.id = ?
    `,
      [req.params.id]
    );
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Students can only see their own
    if (req.user.role === 'student' && invoice.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payments = await db.all(
      'SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC',
      [req.params.id]
    );
    res.json({ ...invoice, payments });
  } catch (err) {
    sendError(res, err);
  }
});

// Create invoice
router.post(
  '/invoices',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  invoiceRules,
  async (req, res) => {
    try {
      const { student_id, fee_structure_id, amount, due_date } = req.body;
      if (!student_id || !amount)
        return res.status(400).json({ error: 'student_id and amount required' });
      const result = await db.run(
        'INSERT INTO invoices (student_id, fee_structure_id, amount, due_date) VALUES (?, ?, ?, ?)',
        [student_id, fee_structure_id || null, amount, due_date || null]
      );
      res.status(201).json({ id: result.lastInsertRowid, message: 'Invoice created' });

      auditLog(req, {
        action: 'create',
        entityType: 'invoice',
        entityId: result.lastInsertRowid,
        newValues: { student_id, amount, due_date },
      });
    } catch (err) {
      sendError(res, err);
    }
  }
);

// Update invoice status
router.put(
  '/invoices/:id',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  async (req, res) => {
    try {
      const { status } = req.body;
      await db.run('UPDATE invoices SET status = ? WHERE id = ?', [status, req.params.id]);
      res.json({ message: 'Updated' });

      auditLog(req, {
        action: 'update',
        entityType: 'invoice',
        entityId: parseInt(req.params.id),
        newValues: { status },
      });
    } catch (err) {
      sendError(res, err);
    }
  }
);

// ── Payments ──

// Record payment
router.post(
  '/payments',
  authMiddleware,
  roleMiddleware('admin', 'accountant'),
  paymentRules,
  async (req, res) => {
    try {
      const { invoice_id, amount, payment_method, reference } = req.body;
      if (!invoice_id || !amount)
        return res.status(400).json({ error: 'invoice_id and amount required' });

      const invoice = await db.get('SELECT * FROM invoices WHERE id = ?', [invoice_id]);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

      const result = await db.run(
        'INSERT INTO payments (invoice_id, amount, payment_method, reference) VALUES (?, ?, ?, ?)',
        [invoice_id, amount, payment_method || null, reference || null]
      );

      // Check if fully paid
      const totalPaid = (
        await db.get(
          'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?',
          [invoice_id]
        )
      ).total;
      if (totalPaid >= invoice.amount) {
        await db.run('UPDATE invoices SET status = ? WHERE id = ?', ['paid', invoice_id]);
      }

      res.status(201).json({ id: result.lastInsertRowid, message: 'Payment recorded' });

      auditLog(req, {
        action: 'create',
        entityType: 'payment',
        entityId: result.lastInsertRowid,
        newValues: { invoice_id, amount, payment_method, reference },
      });
    } catch (err) {
      sendError(res, err);
    }
  }
);

// Get student fee summary
router.get('/student/:id/summary', authMiddleware, async (req, res) => {
  try {
    // Students can only see their own
    if (req.user.role === 'student' && parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const invoices = await db.all(
      `
      SELECT inv.*, fs.fee_type
      FROM invoices inv
      LEFT JOIN fee_structures fs ON fs.id = inv.fee_structure_id
      WHERE inv.student_id = ?
      ORDER BY inv.created_at DESC
    `,
      [req.params.id]
    );

    const totalDue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices
      .filter((i) => i.status === 'pending' || i.status === 'overdue')
      .reduce((sum, inv) => sum + inv.amount, 0);

    res.json({ invoices, totalDue, totalPaid, outstanding });
  } catch (err) {
    sendError(res, err);
  }
});

// Finance overview (admin)
router.get('/overview', authMiddleware, roleMiddleware('admin', 'accountant'), async (req, res) => {
  try {
    const totalInvoiced = (await db.get('SELECT COALESCE(SUM(amount), 0) as total FROM invoices'))
      .total;
    const totalPaid = (
      await db.get("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'")
    ).total;
    const totalPending = (
      await db.get(
        "SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'pending'"
      )
    ).total;
    const totalOverdue = (
      await db.get(
        "SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'overdue'"
      )
    ).total;
    const recentPayments = await db.all(`
      SELECT p.*, inv.student_id, u.name as student_name
      FROM payments p
      JOIN invoices inv ON inv.id = p.invoice_id
      JOIN users u ON u.id = inv.student_id
      ORDER BY p.paid_at DESC LIMIT 10
    `);

    res.json({ totalInvoiced, totalPaid, totalPending, totalOverdue, recentPayments });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
