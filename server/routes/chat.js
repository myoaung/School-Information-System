const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { getReply } = require('../chatbot');
const { sendError } = require('../utils/errorHandler');

const MAX_MESSAGE_LENGTH = 2000;

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

  const ALLOWED_EXTENSIONS = /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx)$/i;
  const ALLOWED_MIMES = /^(image\/(jpeg|jpg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.\w+\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.\w+\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.\w+\.presentation)|text\/plain)$/;

  upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));
      const mimeOk = ALLOWED_MIMES.test(file.mimetype);
      cb(null, extOk && mimeOk);
    },
  });
} catch {
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
}

// POST /api/chat — send message, get AI reply
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    const { message } = req.body;
    const { id: userId, name: userName, role: userRole } = req.user;

    if (!message && !req.file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Truncate overly long messages to protect against token abuse
    const cleanMessage = message ? message.slice(0, MAX_MESSAGE_LENGTH) : '';

    const fileName = req.file ? req.file.originalname : null;
    const filePath = req.file ? `/uploads/chat/${req.file.filename}` : null;

    // Get AI reply (async — uses Claude API if key is set, falls back to rule-based)
    const reply = await getReply(cleanMessage || '📎 File shared', userName, userRole, userId);

    // Save to database
    const result = await db.run(`
      INSERT INTO chat_messages (user_id, user_name, user_role, message, reply, file_name, file_path)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, userId, userName, userRole, cleanMessage, reply, fileName, filePath);

    res.json({
      id: result.lastInsertRowid,
      message: cleanMessage,
      reply,
      fileName,
      filePath,
      created_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// GET /api/chat/history — current user's chat history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);

    const rows = await db.all(`
      SELECT id, message, reply, file_name, file_path, created_at
      FROM chat_messages
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `, req.user.id, limit);

    res.json(rows.reverse());
  } catch (err) {
    sendError(res, err, 'Failed to fetch chat history');
  }
});

// GET /api/chat/logs — admin: all chat logs
router.get('/logs', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = '';
    let params = [];

    if (search) {
      // Escape LIKE special characters
      const safeSearch = search.replace(/[%_]/g, '\\$&');
      where = "WHERE user_name LIKE ? ESCAPE '\\' OR message LIKE ? ESCAPE '\\' OR reply LIKE ? ESCAPE '\\'";
      params = [`%${safeSearch}%`, `%${safeSearch}%`, `%${safeSearch}%`];
    }

    const totalRow = await db.get(`SELECT COUNT(*) as count FROM chat_messages ${where}`, ...params);
    const total = totalRow.count;

    const rows = await db.all(`
      SELECT * FROM chat_messages ${where}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, ...params, limit, offset);

    res.json({ logs: rows, total, page, limit });
  } catch (err) {
    sendError(res, err, 'Failed to fetch chat logs');
  }
});

// DELETE /api/chat/logs/:id — admin: delete a chat log
router.delete('/logs/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const row = await db.get('SELECT file_path FROM chat_messages WHERE id = ?', req.params.id);

    if (!row) return res.status(404).json({ error: 'Log not found' });

    // Delete file if exists — sanitize path to prevent traversal
    if (row.file_path) {
      const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
      const fullPath = path.resolve(__dirname, '..', row.file_path);
      if (fullPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await db.run('DELETE FROM chat_messages WHERE id = ?', req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete chat log');
  }
});

module.exports = router;
