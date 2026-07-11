const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── File Upload Config ────────────────────────────────────────
const uploadDir = process.env.VERCEL
  ? '/tmp/uploads/documents'
  : path.join(__dirname, '..', 'uploads', 'documents');

fs.mkdirSync(uploadDir, { recursive: true });

let storage;
try {
  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });
} catch {
  storage = multer.memoryStorage();
}

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xls|xlsx|ppt|pptx|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext || mime);
  },
});

const VALID_CATEGORIES = ['student', 'staff', 'general'];
const VALID_SUBCATEGORIES = {
  student: [
    'birth_certificate',
    'id_card',
    'previous_school_record',
    'medical_record',
    'photo',
    'other',
  ],
  staff: ['contract', 'certificate', 'training_record', 'id_card', 'other'],
  general: ['policy', 'memo', 'form', 'other'],
};

// ─── List Documents ────────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { category, entity_id, subcategory, search } = req.query;

    let where = [];
    let params = [];

    if (category) {
      where.push('d.category = ?');
      params.push(category);
    }
    if (entity_id) {
      where.push('d.entity_id = ?');
      params.push(entity_id);
    }
    if (subcategory) {
      where.push('d.subcategory = ?');
      params.push(subcategory);
    }
    if (search) {
      where.push('(d.title LIKE ? OR d.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Students can only see their own documents
    if (req.user.role === 'student') {
      where.push('(d.entity_id = ? OR d.category = ?)');
      params.push(req.user.id, 'general');
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const documents = await db.all(
      `SELECT d.*, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       ${whereClause}
       ORDER BY d.created_at DESC`,
      params
    );

    res.json({ documents });
  } catch (err) {
    sendError(res, err, 'Failed to fetch documents');
  }
});

// ─── Get Single Document ───────────────────────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const doc = await db.get(
      `SELECT d.*, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.id = ?`,
      [id]
    );

    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Get version history
    const versions = await db.all(
      `SELECT d.id, d.title, d.version, d.file_name, d.file_size, d.created_at, u.name as uploaded_by_name
       FROM documents d
       LEFT JOIN users u ON d.uploaded_by = u.id
       WHERE d.parent_id = ? OR d.id = ?
       ORDER BY d.version DESC`,
      [doc.parent_id || doc.id, doc.parent_id || doc.id]
    );

    res.json({ document: doc, versions });
  } catch (err) {
    sendError(res, err, 'Failed to fetch document');
  }
});

// ─── Upload Document ───────────────────────────────────────────
router.post(
  '/',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      const { title, category, subcategory, entity_id, description } = req.body;

      if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required' });
      }

      if (!VALID_CATEGORIES.includes(category)) {
        return res
          .status(400)
          .json({ error: `Invalid category. Must be: ${VALID_CATEGORIES.join(', ')}` });
      }

      if (
        subcategory &&
        VALID_SUBCATEGORIES[category] &&
        !VALID_SUBCATEGORIES[category].includes(subcategory)
      ) {
        return res.status(400).json({ error: `Invalid subcategory for ${category}` });
      }

      const filePath = req.file ? `/uploads/documents/${req.file.filename}` : null;

      const result = await db.run(
        `INSERT INTO documents (title, category, subcategory, entity_id, file_path, file_name, file_size, mime_type, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          category,
          subcategory || null,
          entity_id || null,
          filePath,
          req.file?.originalname || null,
          req.file?.size || null,
          req.file?.mimetype || null,
          description || null,
          req.user.id,
        ]
      );

      const doc = await db.get('SELECT * FROM documents WHERE id = ?', [result.lastInsertRowid]);

      res.status(201).json({ message: 'Document uploaded', document: doc });

      auditLog(req, {
        action: 'create',
        entityType: 'document',
        entityId: result.lastInsertRowid,
        newValues: { title, category, subcategory },
      });
    } catch (err) {
      sendError(res, err, 'Failed to upload document');
    }
  }
);

// ─── Upload New Version ────────────────────────────────────────
router.post(
  '/:id/version',
  authMiddleware,
  roleMiddleware('admin', 'teacher'),
  upload.single('file'),
  async (req, res) => {
    try {
      const parentId = parseInt(req.params.id);

      const parent = await db.get('SELECT * FROM documents WHERE id = ?', [parentId]);
      if (!parent) return res.status(404).json({ error: 'Document not found' });

      if (!req.file) {
        return res.status(400).json({ error: 'File is required for new version' });
      }

      // Get latest version number
      const latest = await db.get(
        'SELECT MAX(version) as max_version FROM documents WHERE id = ? OR parent_id = ?',
        [parentId, parentId]
      );
      const newVersion = (latest?.max_version || parent.version) + 1;

      const filePath = `/uploads/documents/${req.file.filename}`;

      const result = await db.run(
        `INSERT INTO documents (title, category, subcategory, entity_id, file_path, file_name, file_size, mime_type, description, uploaded_by, version, parent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          parent.title,
          parent.category,
          parent.subcategory,
          parent.entity_id,
          filePath,
          req.file.originalname,
          req.file.size,
          req.file.mimetype,
          req.body.description || parent.description,
          req.user.id,
          newVersion,
          parentId,
        ]
      );

      const doc = await db.get('SELECT * FROM documents WHERE id = ?', [result.lastInsertRowid]);

      res.status(201).json({ message: `Version ${newVersion} uploaded`, document: doc });

      auditLog(req, {
        action: 'version_upload',
        entityType: 'document',
        entityId: parentId,
        newValues: { version: newVersion },
      });
    } catch (err) {
      sendError(res, err, 'Failed to upload new version');
    }
  }
);

// ─── Update Document Metadata ──────────────────────────────────
router.put('/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, category, subcategory, entity_id, description } = req.body;

    const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    await db.run(
      `UPDATE documents SET title = ?, category = ?, subcategory = ?, entity_id = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        title ?? doc.title,
        category ?? doc.category,
        subcategory ?? doc.subcategory,
        entity_id ?? doc.entity_id,
        description ?? doc.description,
        id,
      ]
    );

    res.json({ message: 'Document updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'document',
      entityId: id,
      newValues: { title, category, subcategory },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update document');
  }
});

// ─── Delete Document ───────────────────────────────────────────
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    // Delete file from disk
    if (doc.file_path) {
      const fullPath = path.join(__dirname, '..', doc.file_path);
      const uploadsRoot = path.join(__dirname, '..', 'uploads');
      if (fullPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    // Delete versioned copies
    const versions = await db.all('SELECT file_path FROM documents WHERE parent_id = ? OR id = ?', [
      id,
      id,
    ]);
    for (const v of versions) {
      if (v.file_path) {
        const fullPath = path.join(__dirname, '..', v.file_path);
        const uploadsRoot = path.join(__dirname, '..', 'uploads');
        if (fullPath.startsWith(uploadsRoot + path.sep) && fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
    }

    await db.run('DELETE FROM documents WHERE id = ? OR parent_id = ?', [id, id]);

    res.json({ message: 'Document deleted' });

    auditLog(req, { action: 'delete', entityType: 'document', entityId: id });
  } catch (err) {
    sendError(res, err, 'Failed to delete document');
  }
});

// ─── Download Document ─────────────────────────────────────────
router.get('/:id/download', authMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const doc = await db.get('SELECT * FROM documents WHERE id = ?', [id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });

    if (!doc.file_path) {
      return res.status(404).json({ error: 'No file attached' });
    }

    const fullPath = path.join(__dirname, '..', doc.file_path);
    const uploadsRoot = path.join(__dirname, '..', 'uploads');

    if (!fullPath.startsWith(uploadsRoot + path.sep) || !fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File not found on disk' });
    }

    res.download(fullPath, doc.file_name || path.basename(fullPath));
  } catch (err) {
    sendError(res, err, 'Failed to download document');
  }
});

module.exports = router;
