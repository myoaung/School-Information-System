const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const CATEGORIES = ['equipment', 'furniture', 'lab_supplies', 'books', 'stationery', 'other'];
const CONDITIONS = ['new', 'good', 'fair', 'poor', 'damaged'];
const MAINTENANCE_TYPES = ['repair', 'service', 'inspection', 'replacement'];

// ─── List Items ────────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, search, condition_status } = req.query;

    let where = [];
    let params = [];

    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (condition_status) {
      where.push('condition_status = ?');
      params.push(condition_status);
    }
    if (search) {
      where.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const items = await db.all(
      `SELECT * FROM inventory_items ${whereClause} ORDER BY name`,
      params
    );

    res.json({ items });
  } catch (err) {
    sendError(res, err, 'Failed to fetch inventory');
  }
});

// ─── Get Single Item ───────────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Get active transactions
    const transactions = await db.all(
      `SELECT it.*, u.name as user_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.user_id = u.id
       WHERE it.item_id = ? AND it.status = 'issued'
       ORDER BY it.issue_date DESC`,
      [id]
    );

    // Get maintenance history
    const maintenance = await db.all(
      `SELECT im.*, u.name as created_by_name
       FROM inventory_maintenance im
       LEFT JOIN users u ON im.created_by = u.id
       WHERE im.item_id = ?
       ORDER BY im.maintenance_date DESC`,
      [id]
    );

    res.json({ item, transactions, maintenance });
  } catch (err) {
    sendError(res, err, 'Failed to fetch item');
  }
});

// ─── Add Item (admin only) ────────────────────────────────────
router.post('/', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      quantity,
      unit,
      location,
      condition_status,
      purchase_date,
      purchase_price,
      supplier,
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ error: 'name and category are required' });
    }

    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be: ${CATEGORIES.join(', ')}` });
    }

    const result = await db.run(
      `INSERT INTO inventory_items (name, category, description, quantity, unit, location, condition_status, purchase_date, purchase_price, supplier)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        category,
        description || null,
        parseInt(quantity) || 0,
        unit || 'piece',
        location || null,
        condition_status || 'new',
        purchase_date || null,
        purchase_price || null,
        supplier || null,
      ]
    );

    const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Item added', item });

    auditLog(req, {
      action: 'create',
      entityType: 'inventory_item',
      entityId: result.lastInsertRowid,
      newValues: { name, category, quantity },
    });
  } catch (err) {
    sendError(res, err, 'Failed to add item');
  }
});

// ─── Update Item (admin only) ──────────────────────────────────
router.put('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      name,
      category,
      description,
      quantity,
      unit,
      location,
      condition_status,
      purchase_date,
      purchase_price,
      supplier,
    } = req.body;

    const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    await db.run(
      `UPDATE inventory_items SET name = ?, category = ?, description = ?, quantity = ?, unit = ?,
       location = ?, condition_status = ?, purchase_date = ?, purchase_price = ?, supplier = ? WHERE id = ?`,
      [
        name ?? item.name,
        category ?? item.category,
        description ?? item.description,
        quantity ?? item.quantity,
        unit ?? item.unit,
        location ?? item.location,
        condition_status ?? item.condition_status,
        purchase_date ?? item.purchase_date,
        purchase_price ?? item.purchase_price,
        supplier ?? item.supplier,
        id,
      ]
    );

    res.json({ message: 'Item updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'inventory_item',
      entityId: id,
      newValues: { name, category, quantity },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update item');
  }
});

// ─── Delete Item (admin only) ──────────────────────────────────
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    // Check for active transactions
    const active = await db.get(
      "SELECT COUNT(*) as c FROM inventory_transactions WHERE item_id = ? AND status = 'issued'",
      [id]
    );
    if (active.c > 0) {
      return res.status(400).json({ error: 'Cannot delete item with active transactions' });
    }

    await db.run('DELETE FROM inventory_items WHERE id = ?', [id]);

    res.json({ message: 'Item deleted' });

    auditLog(req, { action: 'delete', entityType: 'inventory_item', entityId: id });
  } catch (err) {
    sendError(res, err, 'Failed to delete item');
  }
});

// ─── Issue Item ────────────────────────────────────────────────
router.post('/issue', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { item_id, user_id, quantity, due_date, notes } = req.body;

    if (!item_id || !user_id) {
      return res.status(400).json({ error: 'item_id and user_id are required' });
    }

    const item = await db.get('SELECT * FROM inventory_items WHERE id = ?', [item_id]);
    if (!item) return res.status(404).json({ error: 'Item not found' });

    const qty = parseInt(quantity) || 1;
    if (item.quantity < qty) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${item.quantity}` });
    }

    const issueDate = new Date().toISOString().split('T')[0];

    const result = await db.run(
      `INSERT INTO inventory_transactions (item_id, user_id, quantity, type, issue_date, due_date, notes, created_by)
       VALUES (?, ?, ?, 'issue', ?, ?, ?, ?)`,
      [item_id, user_id, qty, issueDate, due_date || null, notes || null, req.user.id]
    );

    // Decrease quantity
    await db.run('UPDATE inventory_items SET quantity = quantity - ? WHERE id = ?', [qty, item_id]);

    res.status(201).json({ message: 'Item issued', transaction_id: result.lastInsertRowid });

    auditLog(req, {
      action: 'issue',
      entityType: 'inventory_transaction',
      entityId: result.lastInsertRowid,
      newValues: { item_id, user_id, quantity: qty },
    });
  } catch (err) {
    sendError(res, err, 'Failed to issue item');
  }
});

// ─── Return Item ───────────────────────────────────────────────
router.post(
  '/return/:transactionId',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const transactionId = parseInt(req.params.transactionId);

      const transaction = await db.get('SELECT * FROM inventory_transactions WHERE id = ?', [
        transactionId,
      ]);
      if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

      if (transaction.status === 'returned') {
        return res.status(400).json({ error: 'Item already returned' });
      }

      const returnDate = new Date().toISOString().split('T')[0];

      await db.run(
        "UPDATE inventory_transactions SET status = 'returned', return_date = ? WHERE id = ?",
        [returnDate, transactionId]
      );

      // Increase quantity
      await db.run('UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?', [
        transaction.quantity,
        transaction.item_id,
      ]);

      res.json({ message: 'Item returned' });

      auditLog(req, {
        action: 'return',
        entityType: 'inventory_transaction',
        entityId: transactionId,
        newValues: { return_date: returnDate },
      });
    } catch (err) {
      sendError(res, err, 'Failed to return item');
    }
  }
);

// ─── List Transactions ─────────────────────────────────────────
router.get(
  '/transactions/list',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const { status, user_id } = req.query;

      let where = [];
      let params = [];

      if (status) {
        where.push('it.status = ?');
        params.push(status);
      }
      if (user_id) {
        where.push('it.user_id = ?');
        params.push(user_id);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const transactions = await db.all(
        `SELECT it.*, u.name as user_name, ii.name as item_name
       FROM inventory_transactions it
       LEFT JOIN users u ON it.user_id = u.id
       LEFT JOIN inventory_items ii ON it.item_id = ii.id
       ${whereClause}
       ORDER BY it.created_at DESC`,
        params
      );

      res.json({ transactions });
    } catch (err) {
      sendError(res, err, 'Failed to fetch transactions');
    }
  }
);

// ─── Add Maintenance Record ────────────────────────────────────
router.post('/maintenance', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      item_id,
      maintenance_type,
      description,
      cost,
      performed_by,
      maintenance_date,
      next_service_date,
      notes,
    } = req.body;

    if (!item_id || !maintenance_type || !maintenance_date) {
      return res
        .status(400)
        .json({ error: 'item_id, maintenance_type, and maintenance_date are required' });
    }

    if (!MAINTENANCE_TYPES.includes(maintenance_type)) {
      return res
        .status(400)
        .json({ error: `Invalid type. Must be: ${MAINTENANCE_TYPES.join(', ')}` });
    }

    const result = await db.run(
      `INSERT INTO inventory_maintenance (item_id, maintenance_type, description, cost, performed_by, maintenance_date, next_service_date, notes, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_id,
        maintenance_type,
        description || null,
        cost || null,
        performed_by || null,
        maintenance_date,
        next_service_date || null,
        notes || null,
        req.user.id,
      ]
    );

    res.status(201).json({ message: 'Maintenance record added', id: result.lastInsertRowid });

    auditLog(req, {
      action: 'create',
      entityType: 'inventory_maintenance',
      entityId: result.lastInsertRowid,
      newValues: { item_id, maintenance_type },
    });
  } catch (err) {
    sendError(res, err, 'Failed to add maintenance record');
  }
});

// ─── List Maintenance Records ──────────────────────────────────
router.get(
  '/maintenance/list',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const { item_id } = req.query;

      let where = [];
      let params = [];

      if (item_id) {
        where.push('im.item_id = ?');
        params.push(item_id);
      }

      const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

      const records = await db.all(
        `SELECT im.*, ii.name as item_name, u.name as created_by_name
       FROM inventory_maintenance im
       LEFT JOIN inventory_items ii ON im.item_id = ii.id
       LEFT JOIN users u ON im.created_by = u.id
       ${whereClause}
       ORDER BY im.maintenance_date DESC`,
        params
      );

      res.json({ records });
    } catch (err) {
      sendError(res, err, 'Failed to fetch maintenance records');
    }
  }
);

// ─── Inventory Stats ───────────────────────────────────────────
router.get(
  '/stats/summary',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const totalItems = await db.get(
        'SELECT COALESCE(SUM(quantity), 0) as c FROM inventory_items'
      );
      const totalTypes = await db.get('SELECT COUNT(*) as c FROM inventory_items');
      const issued = await db.get(
        "SELECT COUNT(*) as c FROM inventory_transactions WHERE status = 'issued'"
      );
      const overdue = await db.get(
        "SELECT COUNT(*) as c FROM inventory_transactions WHERE status = 'issued' AND due_date < to_char(CURRENT_DATE, 'YYYY-MM-DD')"
      );
      const lowStock = await db.get(
        'SELECT COUNT(*) as c FROM inventory_items WHERE quantity <= 5'
      );
      const maintenanceDue = await db.get(
        "SELECT COUNT(*) as c FROM inventory_items WHERE id IN (SELECT item_id FROM inventory_maintenance WHERE next_service_date <= to_char(CURRENT_DATE, 'YYYY-MM-DD'))"
      );

      // By category
      const byCategory = await db.all(
        'SELECT category, SUM(quantity) as total FROM inventory_items GROUP BY category'
      );

      res.json({
        stats: {
          totalItems: totalItems?.c || 0,
          totalTypes: totalTypes?.c || 0,
          issued: issued?.c || 0,
          overdue: overdue?.c || 0,
          lowStock: lowStock?.c || 0,
          maintenanceDue: maintenanceDue?.c || 0,
          byCategory: byCategory || [],
        },
      });
    } catch (err) {
      sendError(res, err, 'Failed to fetch stats');
    }
  }
);

module.exports = router;
