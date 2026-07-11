const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const FINE_PER_DAY = 100; // MMK per day overdue
const BORROW_DAYS = 14; // default borrow period

// ─── List Books ────────────────────────────────────────────────
router.get('/books', authMiddleware, async (req, res) => {
  try {
    const { category, search } = req.query;

    let where = [];
    let params = [];

    if (category) {
      where.push('category = ?');
      params.push(category);
    }
    if (search) {
      where.push('(title LIKE ? OR author LIKE ? OR isbn LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const books = await db.all(`SELECT * FROM library_books ${whereClause} ORDER BY title`, params);

    res.json({ books });
  } catch (err) {
    sendError(res, err, 'Failed to fetch books');
  }
});

// ─── Get Single Book ───────────────────────────────────────────
router.get('/books/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const book = await db.get('SELECT * FROM library_books WHERE id = ?', [id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Get active borrows for this book
    const activeBorrows = await db.all(
      `SELECT lb.*, u.name as borrower_name, u.email as borrower_email
       FROM library_borrows lb
       LEFT JOIN users u ON lb.user_id = u.id
       WHERE lb.book_id = ? AND lb.status = 'borrowed'
       ORDER BY lb.due_date`,
      [id]
    );

    res.json({ book, activeBorrows });
  } catch (err) {
    sendError(res, err, 'Failed to fetch book');
  }
});

// ─── Add Book (admin only) ────────────────────────────────────
router.post('/books', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { title, author, isbn, category, total_copies, description, cover_url } = req.body;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    const copies = parseInt(total_copies) || 1;

    const result = await db.run(
      `INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies, description, cover_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        author || null,
        isbn || null,
        category || 'other',
        copies,
        copies,
        description || null,
        cover_url || null,
      ]
    );

    const book = await db.get('SELECT * FROM library_books WHERE id = ?', [result.lastInsertRowid]);

    res.status(201).json({ message: 'Book added', book });

    auditLog(req, {
      action: 'create',
      entityType: 'library_book',
      entityId: result.lastInsertRowid,
      newValues: { title, category },
    });
  } catch (err) {
    sendError(res, err, 'Failed to add book');
  }
});

// ─── Update Book (admin only) ──────────────────────────────────
router.put('/books/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, author, isbn, category, total_copies, description, cover_url } = req.body;

    const book = await db.get('SELECT * FROM library_books WHERE id = ?', [id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const newTotal = parseInt(total_copies) ?? book.total_copies;
    const borrowed = book.total_copies - book.available_copies;
    const newAvailable = Math.max(0, newTotal - borrowed);

    await db.run(
      `UPDATE library_books SET title = ?, author = ?, isbn = ?, category = ?, total_copies = ?, available_copies = ?, description = ?, cover_url = ? WHERE id = ?`,
      [
        title ?? book.title,
        author ?? book.author,
        isbn ?? book.isbn,
        category ?? book.category,
        newTotal,
        newAvailable,
        description ?? book.description,
        cover_url ?? book.cover_url,
        id,
      ]
    );

    res.json({ message: 'Book updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'library_book',
      entityId: id,
      newValues: { title, category },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update book');
  }
});

// ─── Delete Book (admin only) ──────────────────────────────────
router.delete('/books/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const book = await db.get('SELECT * FROM library_books WHERE id = ?', [id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    // Check for active borrows
    const active = await db.get(
      "SELECT COUNT(*) as c FROM library_borrows WHERE book_id = ? AND status = 'borrowed'",
      [id]
    );
    if (active.c > 0) {
      return res.status(400).json({ error: 'Cannot delete book with active borrows' });
    }

    await db.run('DELETE FROM library_books WHERE id = ?', [id]);

    res.json({ message: 'Book deleted' });

    auditLog(req, { action: 'delete', entityType: 'library_book', entityId: id });
  } catch (err) {
    sendError(res, err, 'Failed to delete book');
  }
});

// ─── Borrow Book ───────────────────────────────────────────────
router.post('/borrow', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { book_id, user_id, due_date, notes } = req.body;

    if (!book_id || !user_id) {
      return res.status(400).json({ error: 'book_id and user_id are required' });
    }

    const book = await db.get('SELECT * FROM library_books WHERE id = ?', [book_id]);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    if (book.available_copies <= 0) {
      return res.status(400).json({ error: 'No copies available' });
    }

    // Check if user already has this book borrowed
    const existing = await db.get(
      "SELECT id FROM library_borrows WHERE book_id = ? AND user_id = ? AND status = 'borrowed'",
      [book_id, user_id]
    );
    if (existing) {
      return res.status(400).json({ error: 'User already has this book borrowed' });
    }

    const borrowDate = new Date().toISOString().split('T')[0];
    const due =
      due_date ||
      new Date(Date.now() + BORROW_DAYS * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await db.run(
      `INSERT INTO library_borrows (book_id, user_id, borrow_date, due_date, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [book_id, user_id, borrowDate, due, notes || null]
    );

    // Decrement available copies
    await db.run('UPDATE library_books SET available_copies = available_copies - 1 WHERE id = ?', [
      book_id,
    ]);

    const borrow = await db.get('SELECT * FROM library_borrows WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Book borrowed', borrow });

    auditLog(req, {
      action: 'borrow',
      entityType: 'library_borrow',
      entityId: result.lastInsertRowid,
      newValues: { book_id, user_id },
    });
  } catch (err) {
    sendError(res, err, 'Failed to borrow book');
  }
});

// ─── Return Book ───────────────────────────────────────────────
router.post(
  '/return/:borrowId',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  async (req, res) => {
    try {
      const borrowId = parseInt(req.params.borrowId);

      const borrow = await db.get('SELECT * FROM library_borrows WHERE id = ?', [borrowId]);
      if (!borrow) return res.status(404).json({ error: 'Borrow record not found' });

      if (borrow.status === 'returned') {
        return res.status(400).json({ error: 'Book already returned' });
      }

      const returnDate = new Date().toISOString().split('T')[0];

      // Calculate fine if overdue
      let fine = 0;
      const dueDate = new Date(borrow.due_date);
      const today = new Date(returnDate);
      if (today > dueDate) {
        const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));
        fine = daysOverdue * FINE_PER_DAY;
      }

      await db.run(
        `UPDATE library_borrows SET return_date = ?, status = 'returned', fine = ? WHERE id = ?`,
        [returnDate, fine, borrowId]
      );

      // Increment available copies
      await db.run(
        'UPDATE library_books SET available_copies = available_copies + 1 WHERE id = ?',
        [borrow.book_id]
      );

      res.json({
        message: 'Book returned',
        fine,
        fineAmount:
          fine > 0 ? `${fine} MMK (${Math.ceil(fine / FINE_PER_DAY)} days overdue)` : 'No fine',
      });

      auditLog(req, {
        action: 'return',
        entityType: 'library_borrow',
        entityId: borrowId,
        newValues: { return_date: returnDate, fine },
      });
    } catch (err) {
      sendError(res, err, 'Failed to return book');
    }
  }
);

// ─── List Borrows ──────────────────────────────────────────────
router.get('/borrows', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const { status, user_id } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('lb.status = ?');
      params.push(status);
    }
    if (user_id) {
      where.push('lb.user_id = ?');
      params.push(user_id);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const borrows = await db.all(
      `SELECT lb.*, u.name as borrower_name, u.email as borrower_email,
              lb2.title as book_title, lb2.author as book_author
       FROM library_borrows lb
       LEFT JOIN users u ON lb.user_id = u.id
       LEFT JOIN library_books lb2 ON lb.book_id = lb2.id
       ${whereClause}
       ORDER BY lb.created_at DESC`,
      params
    );

    res.json({ borrows });
  } catch (err) {
    sendError(res, err, 'Failed to fetch borrows');
  }
});

// ─── My Borrows (student view) ────────────────────────────────
router.get('/borrows/my', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const borrows = await db.all(
      `SELECT lb.*, lb2.title as book_title, lb2.author as book_author, lb2.cover_url
       FROM library_borrows lb
       LEFT JOIN library_books lb2 ON lb.book_id = lb2.id
       WHERE lb.user_id = ?
       ORDER BY lb.created_at DESC`,
      [userId]
    );

    res.json({ borrows });
  } catch (err) {
    sendError(res, err, 'Failed to fetch your borrows');
  }
});

// ─── Library Stats ─────────────────────────────────────────────
router.get('/stats', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const totalBooks = await db.get(
      'SELECT COALESCE(SUM(total_copies), 0) as c FROM library_books'
    );
    const totalTitles = await db.get('SELECT COUNT(*) as c FROM library_books');
    const activeBorrows = await db.get(
      "SELECT COUNT(*) as c FROM library_borrows WHERE status = 'borrowed'"
    );
    const overdueBorrows = await db.get(
      "SELECT COUNT(*) as c FROM library_borrows WHERE status = 'borrowed' AND due_date < date('now')"
    );
    const totalFines = await db.get(
      'SELECT COALESCE(SUM(fine), 0) as c FROM library_borrows WHERE fine > 0'
    );
    const totalBorrows = await db.get('SELECT COUNT(*) as c FROM library_borrows');

    res.json({
      stats: {
        totalBooks: totalBooks?.c || 0,
        totalTitles: totalTitles?.c || 0,
        activeBorrows: activeBorrows?.c || 0,
        overdueBorrows: overdueBorrows?.c || 0,
        totalFines: totalFines?.c || 0,
        totalBorrows: totalBorrows?.c || 0,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch stats');
  }
});

module.exports = router;
