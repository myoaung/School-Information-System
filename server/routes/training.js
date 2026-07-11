const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

const PROGRAM_STATUSES = ['planned', 'active', 'completed', 'cancelled'];
const ASSIGNMENT_STATUSES = ['enrolled', 'in_progress', 'completed', 'dropped'];
const RATINGS = ['excellent', 'good', 'satisfactory', 'poor'];

// ─── Training Programs ────────────────────────────────────────

// List programs
router.get('/programs', authMiddleware, async (req, res) => {
  try {
    const { status } = req.query;

    let where = [];
    let params = [];

    if (status) {
      where.push('tp.status = ?');
      params.push(status);
    }

    const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const programs = await db.all(
      `SELECT tp.*, u.name as created_by_name,
              (SELECT COUNT(*) FROM training_assignments ta WHERE ta.program_id = tp.id) as enrolled_count,
              (SELECT COUNT(*) FROM training_assignments ta WHERE ta.program_id = tp.id AND ta.status = 'completed') as completed_count
       FROM training_programs tp
       LEFT JOIN users u ON tp.created_by = u.id
       ${whereClause}
       ORDER BY tp.created_at DESC`,
      params
    );

    res.json({ programs });
  } catch (err) {
    sendError(res, err, 'Failed to fetch training programs');
  }
});

// Create program
router.post('/programs', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const { title, description, trainer, start_date, end_date, location, max_participants } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const result = await db.run(
      `INSERT INTO training_programs (title, description, trainer, start_date, end_date, location, max_participants, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        trainer || null,
        start_date || null,
        end_date || null,
        location || null,
        max_participants || null,
        req.user.id,
      ]
    );

    const program = await db.get('SELECT * FROM training_programs WHERE id = ?', [
      result.lastInsertRowid,
    ]);

    res.status(201).json({ message: 'Training program created', program });

    auditLog(req, {
      action: 'create',
      entityType: 'training_program',
      entityId: result.lastInsertRowid,
      newValues: { title },
    });
  } catch (err) {
    sendError(res, err, 'Failed to create training program');
  }
});

// Update program
router.put('/programs/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      title,
      description,
      trainer,
      start_date,
      end_date,
      location,
      max_participants,
      status,
    } = req.body;

    const program = await db.get('SELECT * FROM training_programs WHERE id = ?', [id]);
    if (!program) return res.status(404).json({ error: 'Training program not found' });

    if (status && !PROGRAM_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be: ${PROGRAM_STATUSES.join(', ')}` });
    }

    await db.run(
      `UPDATE training_programs SET title = ?, description = ?, trainer = ?, start_date = ?,
       end_date = ?, location = ?, max_participants = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        title ?? program.title,
        description ?? program.description,
        trainer ?? program.trainer,
        start_date ?? program.start_date,
        end_date ?? program.end_date,
        location ?? program.location,
        max_participants ?? program.max_participants,
        status ?? program.status,
        id,
      ]
    );

    res.json({ message: 'Training program updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'training_program',
      entityId: id,
      newValues: { title, status },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update training program');
  }
});

// Delete program
router.delete('/programs/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    const program = await db.get('SELECT * FROM training_programs WHERE id = ?', [id]);
    if (!program) return res.status(404).json({ error: 'Training program not found' });

    await db.run('DELETE FROM training_programs WHERE id = ?', [id]);

    res.json({ message: 'Training program deleted' });

    auditLog(req, {
      action: 'delete',
      entityType: 'training_program',
      entityId: id,
    });
  } catch (err) {
    sendError(res, err, 'Failed to delete training program');
  }
});

// ─── Training Assignments ─────────────────────────────────────

// Assign staff to program
router.post('/programs/:id/assign', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const programId = parseInt(req.params.id);
    const { staff_ids } = req.body;

    if (!staff_ids || !Array.isArray(staff_ids) || staff_ids.length === 0) {
      return res.status(400).json({ error: 'staff_ids array is required' });
    }

    const program = await db.get('SELECT * FROM training_programs WHERE id = ?', [programId]);
    if (!program) return res.status(404).json({ error: 'Training program not found' });

    // Check max participants
    if (program.max_participants) {
      const currentCount = await db.get(
        'SELECT COUNT(*) as c FROM training_assignments WHERE program_id = ?',
        [programId]
      );
      if (currentCount.c + staff_ids.length > program.max_participants) {
        return res.status(400).json({
          error: `Cannot assign ${staff_ids.length} staff. Max participants is ${program.max_participants} (${currentCount.c} already enrolled)`,
        });
      }
    }

    let assigned = 0;
    for (const staffId of staff_ids) {
      try {
        await db.run('INSERT INTO training_assignments (program_id, staff_id) VALUES (?, ?)', [
          programId,
          staffId,
        ]);
        assigned++;
      } catch (err) {
        // Skip duplicates (UNIQUE constraint)
        if (!err.message?.includes('UNIQUE')) throw err;
      }
    }

    res.json({ message: `${assigned} staff assigned to training` });

    auditLog(req, {
      action: 'assign',
      entityType: 'training_assignment',
      entityId: programId,
      newValues: { staff_ids, assigned },
    });
  } catch (err) {
    sendError(res, err, 'Failed to assign staff');
  }
});

// Update assignment (admin)
router.put('/assignments/:id', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status, completion_date, certificate_url, feedback, rating } = req.body;

    const assignment = await db.get('SELECT * FROM training_assignments WHERE id = ?', [id]);
    if (!assignment) return res.status(404).json({ error: 'Assignment not found' });

    if (status && !ASSIGNMENT_STATUSES.includes(status)) {
      return res
        .status(400)
        .json({ error: `Invalid status. Must be: ${ASSIGNMENT_STATUSES.join(', ')}` });
    }

    if (rating && !RATINGS.includes(rating)) {
      return res.status(400).json({ error: `Invalid rating. Must be: ${RATINGS.join(', ')}` });
    }

    await db.run(
      `UPDATE training_assignments SET status = ?, completion_date = ?, certificate_url = ?,
       feedback = ?, rating = ? WHERE id = ?`,
      [
        status ?? assignment.status,
        completion_date ?? assignment.completion_date,
        certificate_url ?? assignment.certificate_url,
        feedback ?? assignment.feedback,
        rating ?? assignment.rating,
        id,
      ]
    );

    res.json({ message: 'Assignment updated' });

    auditLog(req, {
      action: 'update',
      entityType: 'training_assignment',
      entityId: id,
      newValues: { status, rating },
    });
  } catch (err) {
    sendError(res, err, 'Failed to update assignment');
  }
});

// My training (teacher self-service)
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const assignments = await db.all(
      `SELECT ta.*, tp.title as program_title, tp.description as program_description,
              tp.trainer, tp.start_date, tp.end_date, tp.location
       FROM training_assignments ta
       LEFT JOIN training_programs tp ON ta.program_id = tp.id
       WHERE ta.staff_id = ?
       ORDER BY tp.start_date DESC`,
      [req.user.id]
    );

    res.json({ assignments });
  } catch (err) {
    sendError(res, err, 'Failed to fetch your training');
  }
});

// Training stats (admin)
router.get('/stats', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const activePrograms = await db.get(
      "SELECT COUNT(*) as c FROM training_programs WHERE status IN ('planned', 'active')"
    );
    const totalEnrolled = await db.get('SELECT COUNT(*) as c FROM training_assignments');
    const completed = await db.get(
      "SELECT COUNT(*) as c FROM training_assignments WHERE status = 'completed'"
    );
    const totalPrograms = await db.get('SELECT COUNT(*) as c FROM training_programs');

    // By program status
    const byStatus = await db.all(
      'SELECT status, COUNT(*) as count FROM training_programs GROUP BY status'
    );

    res.json({
      stats: {
        activePrograms: activePrograms?.c || 0,
        totalEnrolled: totalEnrolled?.c || 0,
        completed: completed?.c || 0,
        completionRate:
          totalEnrolled?.c > 0 ? Math.round((completed?.c / totalEnrolled?.c) * 100) : 0,
        totalPrograms: totalPrograms?.c || 0,
        byStatus: byStatus || [],
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch training stats');
  }
});

module.exports = router;
