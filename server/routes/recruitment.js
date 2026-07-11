const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const EMPLOYMENT_TYPES = ['full_time', 'part_time', 'contract', 'intern'];
const POSTING_STATUSES = ['open', 'closed', 'filled'];
const APPLICATION_STATUSES = ['new', 'reviewing', 'interview', 'offered', 'hired', 'rejected'];
const INTERVIEW_RESULTS = ['pending', 'pass', 'fail', 'conditional'];

// ─── Job Postings ─────────────────────────────────────────────

// List job postings
router.get('/postings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { status } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('jp.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const postings = await db.all(
      `SELECT jp.*, u.name as posted_by_name,
              (SELECT COUNT(*) FROM job_applications ja WHERE ja.job_posting_id = jp.id) as application_count
       FROM job_postings jp
       LEFT JOIN users u ON jp.posted_by = u.id
       ${whereClause}
       ORDER BY jp.created_at DESC`,
      params
    );

    res.json({ postings });
  } catch (err) {
    sendError(res, err, 'Failed to fetch job postings');
  }
});

// Create job posting
router.post('/postings', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const {
      title,
      description,
      department,
      position,
      employment_type,
      salary_range,
      requirements,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    if (employment_type && !EMPLOYMENT_TYPES.includes(employment_type)) {
      return res
        .status(400)
        .json({ error: `Invalid employment type. Must be: ${EMPLOYMENT_TYPES.join(', ')}` });
    }

    const result = await db.run(
      `INSERT INTO job_postings (title, description, department, position, employment_type, salary_range, requirements, posted_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        department || null,
        position || null,
        employment_type || 'full_time',
        salary_range || null,
        requirements || null,
        req.user.id,
      ]
    );

    const posting = await db.get('SELECT * FROM job_postings WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Job posting created', posting });

    auditLog(req, {
      action: 'create',
      entityType: 'job_posting',
      entityId: result.lastInsertRowid,
      newValues: { title, department },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create job posting');
  }
});

// Update job posting
router.put('/postings/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      description,
      department,
      position,
      employment_type,
      salary_range,
      requirements,
      status,
    } = req.body;

    const posting = await db.get('SELECT * FROM job_postings WHERE id = ?', [id]);
    if (!posting) return res.status(404).json({ error: 'Job posting not found' });

    if (status && !POSTING_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be: ${POSTING_STATUSES.join(', ')}` });
    }

    await db.run(
      `UPDATE job_postings SET title = ?, description = ?, department = ?, position = ?,
       employment_type = ?, salary_range = ?, requirements = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        title ?? posting.title,
        description ?? posting.description,
        department ?? posting.department,
        position ?? posting.position,
        employment_type ?? posting.employment_type,
        salary_range ?? posting.salary_range,
        requirements ?? posting.requirements,
        status ?? posting.status,
        id,
      ]
    );

    res.json({ message: 'Job posting updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'job_posting',
      entityId: id,
      newValues: { title, status },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update job posting');
  }
});

// Delete job posting
router.delete('/postings/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const posting = await db.get('SELECT * FROM job_postings WHERE id = ?', [id]);
    if (!posting) return res.status(404).json({ error: 'Job posting not found' });

    await db.run('DELETE FROM job_postings WHERE id = ?', [id]);

    res.json({ message: 'Job posting deleted' });

    auditLog(req, {
      action: 'delete',
      entityType: 'job_posting',
      entityId: id,
    });
  } catch (err) {
    sendError(res, err, 'Failed to delete job posting');
  }
});

// ─── Applications ─────────────────────────────────────────────

// List applications (admin)
router.get('/applications', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { posting_id, status } = req.query;

    let where = [];
    let params = [];

    if (posting_id) {
      where.push('ja.job_posting_id = ?');
      params.push(posting_id);
    }
    if (status) {
      where.push('ja.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const applications = await db.all(
      `SELECT ja.*, jp.title as posting_title
       FROM job_applications ja
       LEFT JOIN job_postings jp ON ja.job_posting_id = jp.id
       ${whereClause}
       ORDER BY ja.created_at DESC`,
      params
    );

    res.json({ applications });
  } catch (err) {
    sendError(res, err, 'Failed to fetch applications');
  }
});

// Submit application (public — for external candidates)
router.post('/applications', async (req, res) => {
  try {
    const { job_posting_id, applicant_name, applicant_email, applicant_phone, cover_letter } =
      req.body;

    if (!job_posting_id || !applicant_name) {
      return res.status(400).json({ error: 'job_posting_id and applicant_name are required' });
    }

    // Verify posting is open
    const posting = await db.get('SELECT * FROM job_postings WHERE id = ?', [job_posting_id]);
    if (!posting) return res.status(404).json({ error: 'Job posting not found' });
    if (posting.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'This job posting is no longer accepting applications' });
    }

    const result = await db.run(
      `INSERT INTO job_applications (job_posting_id, applicant_name, applicant_email, applicant_phone, cover_letter)
       VALUES (?, ?, ?, ?, ?)`,
      [
        job_posting_id,
        applicant_name,
        applicant_email || null,
        applicant_phone || null,
        cover_letter || null,
      ]
    );

    const application = await db.get('SELECT * FROM job_applications WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Application submitted', application });
  } catch (err) {
    sendError(res, err, 'Failed to submit application');
  }
});

// Update application status
router.put('/applications/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, notes } = req.body;

    const application = await db.get('SELECT * FROM job_applications WHERE id = ?', [id]);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    if (status && !APPLICATION_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be: ${APPLICATION_STATUSES.join(', ')}` });
    }

    await db.run(
      `UPDATE job_applications SET status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [status ?? application.status, notes ?? application.notes, id]
    );

    // If hired, auto-close the posting if all positions filled
    if (status === 'hired') {
      const app = await db.get('SELECT job_posting_id FROM job_applications WHERE id = ?', [id]);
      if (app) {
        await db.run(
          `UPDATE job_postings SET status = 'filled', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [app.job_posting_id]
        );
      }
    }

    res.json({ message: 'Application updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'job_application',
      entityId: id,
      newValues: { status },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update application');
  }
});

// ─── Interviews ───────────────────────────────────────────────

// Schedule interview
router.post('/interviews', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { application_id, interviewer_id, scheduled_at, location, notes } = req.body;

    if (!application_id || !scheduled_at) {
      return res.status(400).json({ error: 'application_id and scheduled_at are required' });
    }

    const application = await db.get('SELECT * FROM job_applications WHERE id = ?', [
      application_id,
    ]);
    if (!application) return res.status(404).json({ error: 'Application not found' });

    // Update application status to interview
    await db.run(
      `UPDATE job_applications SET status = 'interview', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [application_id]
    );

    const result = await db.run(
      `INSERT INTO interviews (application_id, interviewer_id, scheduled_at, location, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [application_id, interviewer_id || null, scheduled_at, location || null, notes || null]
    );

    const interview = await db.get('SELECT * FROM interviews WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Interview scheduled', interview });

    auditLog(req, {
      action: 'create',
      entityType: 'interview',
      entityId: result.lastInsertRowid,
      newValues: { application_id, scheduled_at },
    });
  } catch (err) {
    sendError(res, err, 'Failed to schedule interview');
  }
});

// Update interview result
router.put('/interviews/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { result: interviewResult, feedback } = req.body;

    const interview = await db.get('SELECT * FROM interviews WHERE id = ?', [id]);
    if (!interview) return res.status(404).json({ error: 'Interview not found' });

    if (interviewResult && !INTERVIEW_RESULTS.includes(interviewResult)) {
      return res
        .status(400)
        .json({ error: `Invalid result. Must be: ${INTERVIEW_RESULTS.join(', ')}` });
    }

    await db.run(`UPDATE interviews SET result = ?, feedback = ? WHERE id = ?`, [
      interviewResult ?? interview.result,
      feedback ?? interview.feedback,
      id,
    ]);

    res.json({ message: 'Interview updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'interview',
      entityId: id,
      newValues: { result: interviewResult },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update interview');
  }
});

// ─── Recruitment Stats ────────────────────────────────────────

router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const openPostings = await db.get(
      "SELECT COUNT(*) as c FROM job_postings WHERE status = 'open'"
    );
    const totalApplications = await db.get('SELECT COUNT(*) as c FROM job_applications');
    const pendingReview = await db.get(
      "SELECT COUNT(*) as c FROM job_applications WHERE status IN ('new', 'reviewing')"
    );
    const scheduledInterviews = await db.get(
      "SELECT COUNT(*) as c FROM interviews WHERE result = 'pending'"
    );

    // By application status
    const byStatus = await db.all(
      'SELECT status, COUNT(*) as count FROM job_applications GROUP BY status'
    );

    res.json({
      stats: {
        openPostings: openPostings?.c || 0,
        totalApplications: totalApplications?.c || 0,
        pendingReview: pendingReview?.c || 0,
        scheduledInterviews: scheduledInterviews?.c || 0,
        byStatus: byStatus || [],
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch recruitment stats');
  }
});

module.exports = router;
