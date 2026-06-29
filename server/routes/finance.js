const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { invoiceRules, paymentRules } = require('../middleware/validate');

// ── Fee Structures ──

// List fee structures
router.get('/fees', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { grade_id, academic_year_id } = req.query;
    let sql = `
      SELECT fs.*, g.name as grade_name, ay.name as academic_year_name
      FROM fee_structures fs
      LEFT JOIN grades g ON g.id = fs.grade_id
      LEFT JOIN academic_years ay ON ay.id = fs.academic_year_id
      WHERE 1=1
    `;
    const params = [];
    if (grade_id) { sql += ' AND fs.grade_id = ?'; params.push(grade_id); }
    if (academic_year_id) { sql += ' AND fs.academic_year_id = ?'; params.push(academic_year_id); }
    sql += ' ORDER BY fs.fee_type';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    sendError(res, err);
  }
});

// Create fee structure
router.post('/fees', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { grade_id, fee_type, amount, academic_year_id } = req.body;
    if (!fee_type || !amount) return res.status(400).json({ error: 'fee_type and amount required' });
    const db = getDb();
    const result = db.prepare('INSERT INTO fee_structures (grade_id, fee_type, amount, academic_year_id) VALUES (?, ?, ?, ?)').run(grade_id || null, fee_type, amount, academic_year_id || null);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Fee structure created' });
  } catch (err) {
    sendError(res, err);
  }
});

// Update fee structure
router.put('/fees/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { grade_id, fee_type, amount, academic_year_id } = req.body;
    const db = getDb();
    db.prepare('UPDATE fee_structures SET grade_id = ?, fee_type = ?, amount = ?, academic_year_id = ? WHERE id = ?')
      .run(grade_id || null, fee_type, amount, academic_year_id || null, req.params.id);
    res.json({ message: 'Updated' });
  } catch (err) {
    sendError(res, err);
  }
});

// Delete fee structure
router.delete('/fees/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM fee_structures WHERE id = ?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

// ── Invoices ──

// List invoices
router.get('/invoices', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const { student_id, status } = req.query;
    let sql = `
      SELECT inv.*, u.name as student_name, s.student_id as student_code
      FROM invoices inv
      JOIN users u ON u.id = inv.student_id
      LEFT JOIN students s ON s.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    // Students/parents see only their own
    if (req.user.role === 'student') {
      sql += ' AND inv.student_id = ?'; params.push(req.user.id);
    } else if (student_id) {
      sql += ' AND inv.student_id = ?'; params.push(student_id);
    }
    if (status) { sql += ' AND inv.status = ?'; params.push(status); }
    sql += ' ORDER BY inv.created_at DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    sendError(res, err);
  }
});

// Get single invoice with payments
router.get('/invoices/:id', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    const invoice = db.prepare(`
      SELECT inv.*, u.name as student_name, s.student_id as student_code,
             fs.fee_type, g.name as grade_name
      FROM invoices inv
      JOIN users u ON u.id = inv.student_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN fee_structures fs ON fs.id = inv.fee_structure_id
      LEFT JOIN grades g ON g.id = fs.grade_id
      WHERE inv.id = ?
    `).get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Students can only see their own
    if (req.user.role === 'student' && invoice.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC').all(req.params.id);
    res.json({ ...invoice, payments });
  } catch (err) {
    sendError(res, err);
  }
});

// Create invoice
router.post('/invoices', authMiddleware, roleMiddleware('admin'), invoiceRules, (req, res) => {
  try {
    const { student_id, fee_structure_id, amount, due_date } = req.body;
    if (!student_id || !amount) return res.status(400).json({ error: 'student_id and amount required' });
    const db = getDb();
    const result = db.prepare('INSERT INTO invoices (student_id, fee_structure_id, amount, due_date) VALUES (?, ?, ?, ?)')
      .run(student_id, fee_structure_id || null, amount, due_date || null);
    res.status(201).json({ id: result.lastInsertRowid, message: 'Invoice created' });
  } catch (err) {
    sendError(res, err);
  }
});

// Update invoice status
router.put('/invoices/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const { status } = req.body;
    const db = getDb();
    db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run(status, req.params.id);
    res.json({ message: 'Updated' });
  } catch (err) {
    sendError(res, err);
  }
});

// ── Payments ──

// Record payment
router.post('/payments', authMiddleware, roleMiddleware('admin'), paymentRules, (req, res) => {
  try {
    const { invoice_id, amount, payment_method, reference } = req.body;
    if (!invoice_id || !amount) return res.status(400).json({ error: 'invoice_id and amount required' });
    const db = getDb();

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const result = db.prepare('INSERT INTO payments (invoice_id, amount, payment_method, reference) VALUES (?, ?, ?, ?)')
      .run(invoice_id, amount, payment_method || null, reference || null);

    // Check if fully paid
    const totalPaid = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE invoice_id = ?').get(invoice_id).total;
    if (totalPaid >= invoice.amount) {
      db.prepare('UPDATE invoices SET status = ? WHERE id = ?').run('paid', invoice_id);
    }

    res.status(201).json({ id: result.lastInsertRowid, message: 'Payment recorded' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get student fee summary
router.get('/student/:id/summary', authMiddleware, (req, res) => {
  try {
    const db = getDb();
    // Students can only see their own
    if (req.user.role === 'student' && parseInt(req.params.id) !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const invoices = db.prepare(`
      SELECT inv.*, fs.fee_type
      FROM invoices inv
      LEFT JOIN fee_structures fs ON fs.id = inv.fee_structure_id
      WHERE inv.student_id = ?
      ORDER BY inv.created_at DESC
    `).all(req.params.id);

    const totalDue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices.filter(i => i.status === 'pending' || i.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0);

    res.json({ invoices, totalDue, totalPaid, outstanding });
  } catch (err) {
    sendError(res, err);
  }
});

// Finance overview (admin)
router.get('/overview', authMiddleware, roleMiddleware('admin'), (req, res) => {
  try {
    const db = getDb();
    const totalInvoiced = db.prepare('SELECT COALESCE(SUM(amount), 0) as total FROM invoices').get().total;
    const totalPaid = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'").get().total;
    const totalPending = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'pending'").get().total;
    const totalOverdue = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'overdue'").get().total;
    const recentPayments = db.prepare(`
      SELECT p.*, inv.student_id, u.name as student_name
      FROM payments p
      JOIN invoices inv ON inv.id = p.invoice_id
      JOIN users u ON u.id = inv.student_id
      ORDER BY p.paid_at DESC LIMIT 10
    `).all();

    res.json({ totalInvoiced, totalPaid, totalPending, totalOverdue, recentPayments });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
