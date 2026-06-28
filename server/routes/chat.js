const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb } = require('../db');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getReply } = require('../chatbot');

// File upload setup — use /tmp on Vercel (read-only filesystem elsewhere)
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'chat')
  : path.join(__dirname, '..', 'uploads', 'chat');

let upload;
try {
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, unique + path.extname(file.originalname));
    },
  });

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx/;
      const ext = allowed.test(path.extname(file.originalname).toLowerCase());
      const mime = allowed.test(file.mimetype.split('/')[1]);
      cb(null, ext || mime || true);
    },
  });
} catch {
  // Fallback: memory storage if disk is not writable
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
}

// POST /api/chat — send message, get AI reply
router.post('/', authMiddleware, upload.single('file'), (req, res) => {
  const db = getDb();
  const { message } = req.body;
  const { id: userId, name: userName, role: userRole } = req.user;

  if (!message && !req.file) {
    return res.status(400).json({ error: 'Message or file is required' });
  }

  const fileName = req.file ? req.file.originalname : null;
  const filePath = req.file ? `/uploads/chat/${req.file.filename}` : null;

  // Get AI reply (async — uses Claude API if key is set, falls back to rule-based)
  const reply = await getReply(message || '📎 File shared', userName, userRole, userId);

  // Save to database
  const result = db.prepare(`
    INSERT INTO chat_messages (user_id, user_name, user_role, message, reply, file_name, file_path)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userId, userName, userRole, message || '', reply, fileName, filePath);

  res.json({
    id: result.lastInsertRowid,
    message: message || '',
    reply,
    fileName,
    filePath,
    created_at: new Date().toISOString(),
  });
});

// GET /api/chat/history — current user's chat history
router.get('/history', authMiddleware, (req, res) => {
  const db = getDb();
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  const rows = db.prepare(`
    SELECT id, message, reply, file_name, file_path, created_at
    FROM chat_messages
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT ?
  `).all(req.user.id, limit);

  res.json(rows.reverse()); // oldest first for chat display
});

// GET /api/chat/logs — admin: all chat logs
router.get('/logs', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const db = getDb();
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let where = '';
  let params = [];

  if (search) {
    where = 'WHERE user_name LIKE ? OR message LIKE ? OR reply LIKE ?';
    params = [`%${search}%`, `%${search}%`, `%${search}%`];
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM chat_messages ${where}`).get(...params).count;

  const rows = db.prepare(`
    SELECT * FROM chat_messages ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, limit, offset);

  res.json({ logs: rows, total, page, limit });
});

// DELETE /api/chat/logs/:id — admin: delete a chat log
router.delete('/logs/:id', authMiddleware, roleMiddleware('admin'), (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT file_path FROM chat_messages WHERE id = ?').get(req.params.id);

  if (!row) return res.status(404).json({ error: 'Log not found' });

  // Delete file if exists
  if (row.file_path) {
    const fullPath = path.join(__dirname, '..', row.file_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }

  db.prepare('DELETE FROM chat_messages WHERE id = ?').run(req.params.id);
  res.json({ message: 'Deleted' });
});

module.exports = router;
