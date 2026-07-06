const { sendError } = require('../utils/errorHandler');
const express = require('express');
const router = express.Router();
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { certificateRules } = require('../middleware/validate');

// Generate serial number
function generateSerial(type) {
  const prefix = type.charAt(0).toUpperCase();
  const year = new Date().getFullYear();
  const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${rand}`;
}

// Generate certificate HTML
function generateCertificateHTML(cert, student, issuedBy) {
  const data = cert.data ? JSON.parse(cert.data) : {};
  const titles = {
    completion: 'Certificate of Completion',
    achievement: 'Certificate of Achievement',
    transcript: 'Official Transcript',
    graduation: 'Graduation Certificate'
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${titles[cert.type] || 'Certificate'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Georgia', serif; background: #f5f5f5; display: flex; justify-content: center; padding: 20px; }
    .certificate {
      width: 800px; min-height: 600px; background: white;
      border: 8px double #1a365d; padding: 60px; text-align: center;
      position: relative;
    }
    .certificate::before {
      content: ''; position: absolute; top: 15px; left: 15px; right: 15px; bottom: 15px;
      border: 2px solid #c9a227; pointer-events: none;
    }
    .school-name { font-size: 14px; color: #666; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 20px; }
    .title { font-size: 32px; color: #1a365d; margin-bottom: 10px; font-weight: bold; }
    .subtitle { font-size: 14px; color: #666; margin-bottom: 30px; }
    .presented-to { font-size: 14px; color: #666; margin-bottom: 10px; }
    .student-name { font-size: 28px; color: #c9a227; font-style: italic; margin-bottom: 20px; border-bottom: 2px solid #c9a227; display: inline-block; padding: 0 20px 5px; }
    .description { font-size: 14px; color: #444; max-width: 500px; margin: 0 auto 30px; line-height: 1.6; }
    .details { display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; }
    .detail-item { text-align: center; }
    .detail-label { font-size: 11px; color: #999; text-transform: uppercase; }
    .detail-value { font-size: 14px; color: #333; margin-top: 5px; border-top: 1px solid #333; padding-top: 5px; min-width: 150px; }
    .serial { font-size: 10px; color: #999; position: absolute; bottom: 20px; right: 30px; }
    @media print { body { background: white; padding: 0; } .certificate { border: 8px double #1a365d; } }
  </style>
</head>
<body>
  <div class="certificate">
    <div class="school-name">School Information System</div>
    <div class="title">${titles[cert.type] || 'Certificate'}</div>
    <div class="subtitle">This is to certify that</div>
    <div class="presented-to">&nbsp;</div>
    <div class="student-name">${student.name}</div>
    <div class="description">
      ${data.description || `has successfully completed the requirements for ${cert.type === 'graduation' ? 'graduation' : 'the course of study'} during the academic year ${data.academic_year || '2026-2027'}.`}
    </div>
    ${data.grade ? `<div style="font-size:16px;color:#333;margin-bottom:10px;">Grade: <strong>${data.grade}</strong></div>` : ''}
    ${data.gpa ? `<div style="font-size:14px;color:#666;margin-bottom:20px;">GPA: ${data.gpa}</div>` : ''}
    <div class="details">
      <div class="detail-item">
        <div class="detail-label">Date Issued</div>
        <div class="detail-value">${new Date(cert.issued_at).toLocaleDateString()}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Serial Number</div>
        <div class="detail-value">${cert.serial_number}</div>
      </div>
      <div class="detail-item">
        <div class="detail-label">Authorized By</div>
        <div class="detail-value">${issuedBy || 'Administration'}</div>
      </div>
    </div>
    <div class="serial">${cert.serial_number}</div>
  </div>
</body>
</html>`;
}

// List certificates
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { student_id, type } = req.query;
    let sql = `
      SELECT c.*, u.name as student_name, s.student_id as student_code,
             issuer.name as issued_by_name
      FROM certificates c
      JOIN users u ON u.id = c.student_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN users issuer ON issuer.id = c.issued_by
      WHERE 1=1
    `;
    const params = [];
    if (req.user.role === 'student') {
      sql += ' AND c.student_id = ?'; params.push(req.user.id);
    } else if (student_id) {
      sql += ' AND c.student_id = ?'; params.push(student_id);
    }
    if (type) { sql += ' AND c.type = ?'; params.push(type); }
    sql += ' ORDER BY c.issued_at DESC';
    res.json(await db.all(sql, params));
  } catch (err) {
    sendError(res, err);
  }
});

// Get single certificate
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const cert = await db.get(`
      SELECT c.*, u.name as student_name, s.student_id as student_code,
             issuer.name as issued_by_name
      FROM certificates c
      JOIN users u ON u.id = c.student_id
      LEFT JOIN students s ON s.user_id = u.id
      LEFT JOIN users issuer ON issuer.id = c.issued_by
      WHERE c.id = ?
    `, [req.params.id]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    if (req.user.role === 'student' && cert.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    res.json(cert);
  } catch (err) {
    sendError(res, err);
  }
});

// Generate certificate
router.post('/generate', authMiddleware, roleMiddleware('admin', 'teacher'), certificateRules, async (req, res) => {
  try {
    const { student_id, type, data } = req.body;
    if (!student_id || !type) return res.status(400).json({ error: 'student_id and type required' });

    const student = await db.get('SELECT * FROM users WHERE id = ?', [student_id]);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const serial = generateSerial(type);
    const result = await db.run('INSERT INTO certificates (student_id, type, data, issued_by, serial_number) VALUES (?, ?, ?, ?, ?)',
      [student_id, type, data ? JSON.stringify(data) : null, req.user.id, serial]);

    res.status(201).json({ id: result.lastInsertRowid, serial_number: serial, message: 'Certificate generated' });
  } catch (err) {
    sendError(res, err);
  }
});

// Get certificate as printable HTML
router.get('/:id/html', authMiddleware, async (req, res) => {
  try {
    const cert = await db.get(`
      SELECT c.*, u.name as student_name, issuer.name as issued_by_name
      FROM certificates c
      JOIN users u ON u.id = c.student_id
      LEFT JOIN users issuer ON issuer.id = c.issued_by
      WHERE c.id = ?
    `, [req.params.id]);
    if (!cert) return res.status(404).json({ error: 'Certificate not found' });
    if (req.user.role === 'student' && cert.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const html = generateCertificateHTML(cert, { name: cert.student_name }, cert.issued_by_name);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    sendError(res, err);
  }
});

// Delete certificate
router.delete('/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    await db.run('DELETE FROM certificates WHERE id = ?', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    sendError(res, err);
  }
});

module.exports = router;
