const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// File upload setup — use /tmp on Vercel
const uploadDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads', 'resources')
  : path.join(__dirname, '..', 'uploads', 'resources');

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

  const ALLOWED_EXTENSIONS =
    /\.(jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx|mp4|mp3|wav)$/i;
  const ALLOWED_MIMES =
    /^(image\/(jpeg|jpg|png|gif)|application\/(pdf|msword|vnd\.openxmlformats-officedocument\.\w+\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.\w+\.sheet|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.\w+\.presentation)|text\/plain|video\/(mp4)|audio\/(mpeg|wav))$/;

  upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
    fileFilter: (req, file, cb) => {
      const extOk = ALLOWED_EXTENSIONS.test(path.extname(file.originalname));
      const mimeOk = ALLOWED_MIMES.test(file.mimetype);
      cb(null, extOk && mimeOk);
    },
  });
} catch {
  upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
}

// GET /api/resources — list all resources
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { type, course_id } = req.query;
    let where = [];
    let params = [];
    if (type) {
      where.push('r.type = ?');
      params.push(type);
    }
    if (course_id) {
      where.push('r.course_id = ?');
      params.push(course_id);
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const resources = await db.all(
      `
      SELECT r.*, c.title as course_title, s.name as subject_name, s.code as subject_code,
             u.name as uploaded_by_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON u.id = r.uploaded_by
      ${clause}
      ORDER BY r.created_at DESC
    `,
      params
    );
    res.json({ resources });
  } catch (err) {
    sendError(res, err, 'Failed to fetch resources');
  }
});

// GET /api/resources/:id — single resource
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const resource = await db.get(
      `
      SELECT r.*, c.title as course_title, s.name as subject_name, u.name as uploaded_by_name
      FROM resources r
      JOIN courses c ON r.course_id = c.id
      JOIN subjects s ON c.subject_id = s.id
      LEFT JOIN users u ON u.id = r.uploaded_by
      WHERE r.id = ?
    `,
      [req.params.id]
    );
    if (!resource) return res.status(404).json({ error: 'Resource not found' });
    res.json(resource);
  } catch (err) {
    sendError(res, err, 'Failed to fetch resource');
  }
});

// POST /api/resources — create resource (admin/teacher)
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { course_id, title, type, url, description } = req.body;

      if (!course_id || !title || !type) {
        return res.status(400).json({ error: 'course_id, title, and type are required' });
      }

      const validTypes = ['pdf', 'video', 'audio', 'image', 'link', 'document'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: `type must be one of: ${validTypes.join(', ')}` });
      }

      // If a file was uploaded, use its path
      let filePath = null;
      let resourceUrl = url || null;

      if (req.file) {
        filePath = `/uploads/resources/${req.file.filename}`;
        resourceUrl = resourceUrl || filePath;
      } else if (type !== 'link' && !url) {
        return res
          .status(400)
          .json({ error: 'Either a file upload or URL is required for non-link resources' });
      }

      const result = await db.run(
        'INSERT INTO resources (course_id, title, type, url, file_path, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [course_id, title, type, resourceUrl, filePath, description || null, req.user.id]
      );

      res.status(201).json({ message: 'Resource created', id: result.lastInsertRowid });
    } catch (err) {
      sendError(res, err, 'Failed to create resource');
    }
  }
);

// PUT /api/resources/:id — update resource (admin/teacher)
router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      const existing = await db.get('SELECT * FROM resources WHERE id = ?', [req.params.id]);
      if (!existing) return res.status(404).json({ error: 'Resource not found' });

      const { title, type, url, description } = req.body;

      // If a new file was uploaded, delete the old one
      if (req.file && existing.file_path) {
        const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
        const fullPath = path.resolve(__dirname, '..', existing.file_path);
        if (fullPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      let filePath = existing.file_path;
      let resourceUrl = url !== undefined ? url : existing.url;

      if (req.file) {
        filePath = `/uploads/resources/${req.file.filename}`;
        resourceUrl = resourceUrl || filePath;
      }

      await db.run(
        'UPDATE resources SET title = ?, type = ?, url = ?, file_path = ?, description = ? WHERE id = ?',
        [
          title || existing.title,
          type || existing.type,
          resourceUrl,
          filePath,
          description !== undefined ? description : existing.description,
          req.params.id,
        ]
      );

      res.json({ message: 'Resource updated' });
    } catch (err) {
      sendError(res, err, 'Failed to update resource');
    }
  }
);

// DELETE /api/resources/:id — delete resource (admin/teacher)
router.delete('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const row = await db.get('SELECT file_path FROM resources WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Resource not found' });

    // Delete file if exists — sanitize path to prevent traversal
    if (row.file_path) {
      const uploadsRoot = path.resolve(__dirname, '..', 'uploads');
      const fullPath = path.resolve(__dirname, '..', row.file_path);
      if (fullPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await db.run('DELETE FROM resources WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err, 'Failed to delete resource');
  }
});

module.exports = router;
