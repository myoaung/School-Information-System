const { sendError } = require('../utils/errorHandler');
/**
 * AI Report Routes
 * Phase 3 — POST /api/ai/report, review gate, PDF export
 */

const express = require('express');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { db } = require('../data');
const {
  aggregateStudentData,
  generateReportNarrative,
  saveReport,
  getReports,
  updateReportStatus,
} = require('../report-generator');

const router = express.Router();

// POST /api/ai/report/:studentId — Generate AI report for a student
router.post('/report/:studentId', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const studentUserId = parseInt(req.params.studentId);

    // Verify student exists
    const data = aggregateStudentData(studentUserId);
    if (!data) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Generate report
    const result = await generateReportNarrative(studentUserId);

    // Save to database
    const reportId = saveReport(
      studentUserId,
      req.user.id,
      result.narrative,
      result.source
    );

    res.json({
      report: {
        id: reportId,
        student: data.student,
        narrative: result.narrative,
        source: result.source,
        status: 'draft',
        data: {
          gpa: data.academics.overallGpa,
          attendanceRate: data.attendance.rate,
          avgAssignmentScore: data.assignments.avgScore,
          avgQuizScore: data.quizzes.avgScore,
        },
      },
    });
  } catch (err) {
    console.error('AI report generation error:', err);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/ai/report/:studentId — Get reports for a student
router.get('/report/:studentId', authMiddleware, async (req, res) => {
  try {
    const studentUserId = parseInt(req.params.studentId);

    // Students can only see their own reports
    if (req.user.role === 'student' && req.user.id !== studentUserId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const reports = getReports(studentUserId, req.user.role, req.user.id);
    res.json({ reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// GET /api/ai/reports — Get all reports (admin/teacher)
router.get('/reports', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const reports = getReports(null, req.user.role, req.user.id);
    res.json({ reports });
  } catch (err) {
    console.error('Get all reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// PUT /api/ai/report/:reportId/approve — Approve a report
router.put('/report/:reportId/approve', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const result = updateReportStatus(reportId, 'approved', req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report approved', status: 'approved' });
  } catch (err) {
    console.error('Approve report error:', err);
    res.status(500).json({ error: 'Failed to approve report' });
  }
});

// PUT /api/ai/report/:reportId/reject — Reject a report (back to draft)
router.put('/report/:reportId/reject', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const result = updateReportStatus(reportId, 'draft', req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report rejected', status: 'draft' });
  } catch (err) {
    console.error('Reject report error:', err);
    res.status(500).json({ error: 'Failed to reject report' });
  }
});

// PUT /api/ai/report/:reportId/send — Mark report as sent
router.put('/report/:reportId/send', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const reportId = parseInt(req.params.reportId);
    const result = updateReportStatus(reportId, 'sent', req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ message: 'Report marked as sent', status: 'sent' });
  } catch (err) {
    console.error('Send report error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

// GET /api/ai/report/:reportId/html — Get report as printable HTML
router.get('/report/:reportId/html', authMiddleware, async (req, res) => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS ai_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        generated_by INTEGER REFERENCES users(id),
        narrative TEXT NOT NULL,
        source TEXT CHECK(source IN ('ai','template')) DEFAULT 'template',
        status TEXT CHECK(status IN ('draft','approved','sent')) DEFAULT 'draft',
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const report = await db.get(`
      SELECT r.*, u.name as student_name
      FROM ai_reports r
      JOIN users u ON r.student_id = u.id
      WHERE r.id = ?
    `, [parseInt(req.params.reportId)]);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Students can only view approved reports
    if (req.user.role === 'student' && report.status !== 'approved') {
      return res.status(403).json({ error: 'Report not yet approved' });
    }

    const studentData = aggregateStudentData(report.student_id);

    // Escape HTML in user-controlled fields
    const escHtml = (str) => String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline'; script-src 'none'; object-src 'none';">
  <title>Report Card — ${escHtml(report.student_name)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { color: #666; font-size: 14px; }
    .student-info { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 24px; padding: 16px; background: #f8f9fa; border-radius: 8px; }
    .student-info p { font-size: 14px; }
    .student-info strong { color: #1a1a2e; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
    .stat-card { text-align: center; padding: 12px; background: #f0f4ff; border-radius: 8px; }
    .stat-card .value { font-size: 24px; font-weight: 700; color: #1a1a2e; }
    .stat-card .label { font-size: 11px; color: #666; text-transform: uppercase; }
    .narrative { line-height: 1.8; margin-bottom: 24px; }
    .narrative h3 { font-size: 16px; color: #1a1a2e; margin: 16px 0 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 4px; }
    .narrative p { font-size: 14px; margin-bottom: 8px; }
    .narrative ul { margin-left: 20px; font-size: 14px; }
    .narrative li { margin-bottom: 4px; }
    .footer { border-top: 2px solid #e0e0e0; padding-top: 16px; margin-top: 30px; display: flex; justify-content: space-between; font-size: 12px; color: #666; }
    .signature { margin-top: 40px; display: flex; justify-content: space-between; }
    .signature div { text-align: center; width: 200px; }
    .signature .line { border-top: 1px solid #333; margin-top: 40px; padding-top: 8px; font-size: 12px; }
    @media print { body { padding: 20px; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>🏫 School Information System</h1>
    <p>Student Report Card — ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
  </div>

  <div class="student-info">
    <p><strong>Name:</strong> ${escHtml(report.student_name)}</p>
    <p><strong>Student ID:</strong> ${studentData?.student.studentId || '-'}</p>
    <p><strong>Grade:</strong> ${studentData?.student.grade || '-'}, Section ${studentData?.student.section || '-'}</p>
    <p><strong>Status:</strong> ${report.status.toUpperCase()}</p>
  </div>

  <div class="stats">
    <div class="stat-card">
      <div class="value">${studentData?.academics.overallGpa || '-'}</div>
      <div class="label">GPA</div>
    </div>
    <div class="stat-card">
      <div class="value">${studentData?.attendance.rate || 0}%</div>
      <div class="label">Attendance</div>
    </div>
    <div class="stat-card">
      <div class="value">${studentData?.assignments.avgScore || 0}%</div>
      <div class="label">Assignments</div>
    </div>
    <div class="stat-card">
      <div class="value">${studentData?.quizzes.avgScore || 0}%</div>
      <div class="label">Quizzes</div>
    </div>
  </div>

  <div class="narrative">
    ${report.narrative}
  </div>

  <div class="signature">
    <div>
      <div class="line">Class Teacher</div>
    </div>
    <div>
      <div class="line">Principal</div>
    </div>
  </div>

  <div class="footer">
    <span>Generated: ${new Date(report.created_at).toLocaleString()}</span>
    <span>Source: ${report.source === 'ai' ? 'AI-Generated' : 'Template'}</span>
    <span>Report ID: #${report.id}</span>
  </div>

  <div class="no-print" style="text-align:center; margin-top:20px;">
    <button onclick="window.print()" style="padding:10px 24px; background:#1a1a2e; color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:14px;">🖨️ Print / Save as PDF</button>
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    console.error('Report HTML error:', err);
    res.status(500).json({ error: 'Failed to generate HTML' });
  }
});

module.exports = router;
