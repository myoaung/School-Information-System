const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');
const { auditLog } = require('../middleware/audit');

const router = express.Router();

// ─── Get Class Subject-Teacher Assignments ─────────────────────
router.get('/:classId', authMiddleware, async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);

    // Get class info
    const classData = await db.get(
      `SELECT c.*, g.name as grade_name, ay.name as year_name
       FROM classes c
       LEFT JOIN grades g ON c.grade_id = g.id
       LEFT JOIN academic_years ay ON c.academic_year_id = ay.id
       WHERE c.id = ?`,
      [classId]
    );

    if (!classData) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Get subject-teacher assignments
    const assignments = await db.all(
      `SELECT cst.*, s.name as subject_name, s.code as subject_code, s.category,
              u.name as teacher_name, u.email as teacher_email
       FROM class_subject_teachers cst
       JOIN subjects s ON cst.subject_id = s.id
       LEFT JOIN users u ON cst.teacher_id = u.id
       WHERE cst.class_id = ?
       ORDER BY s.category, s.name`,
      [classId]
    );

    // Calculate readiness
    const required = assignments.filter((a) => a.is_required);
    const assigned = required.filter((a) => a.teacher_id);
    const missing = required.filter((a) => !a.teacher_id);

    let status = 'draft';
    if (assignments.length > 0) {
      if (missing.length === 0) {
        status = 'ready';
      } else {
        status = 'incomplete';
      }
    }

    // Get enrolled student count
    const enrollment = await db.get(
      'SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?',
      [classId]
    );

    res.json({
      class: {
        ...classData,
        student_count: enrollment?.count || 0,
      },
      assignments,
      readiness: {
        status,
        total_subjects: required.length,
        assigned_teachers: assigned.length,
        missing_count: missing.length,
        missing: missing.map((m) => ({
          subject_id: m.subject_id,
          subject_name: m.subject_name,
          subject_code: m.subject_code,
        })),
        can_activate: missing.length === 0 && assignments.length > 0,
      },
    });
  } catch (err) {
    sendError(res, err, 'Failed to fetch class subjects');
  }
});

// ─── Apply Curriculum to Class ─────────────────────────────────
router.post(
  '/:classId/apply-curriculum',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const { academic_year_id } = req.body;

      // Get class
      const classData = await db.get('SELECT * FROM classes WHERE id = ?', [classId]);
      if (!classData) {
        return res.status(404).json({ error: 'Class not found' });
      }

      // Get grade subjects from curriculum
      const yearId = academic_year_id || classData.academic_year_id;
      if (!yearId) {
        return res.status(400).json({ error: 'academic_year_id is required' });
      }

      const gradeSubjects = await db.all(
        `SELECT gs.*, s.name as subject_name
       FROM grade_subjects gs
       JOIN subjects s ON gs.subject_id = s.id
       WHERE gs.grade_id = ? AND gs.academic_year_id = ?`,
        [classData.grade_id, yearId]
      );

      if (gradeSubjects.length === 0) {
        return res.status(400).json({ error: 'No curriculum found for this grade and year' });
      }

      // Check if curriculum already applied
      const existing = await db.all(
        'SELECT * FROM class_subject_teachers WHERE class_id = ? AND academic_year_id = ?',
        [classId, yearId]
      );

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Curriculum already applied for this year' });
      }

      // Apply curriculum
      let applied = 0;
      for (const gs of gradeSubjects) {
        await db.run(
          `INSERT INTO class_subject_teachers (class_id, subject_id, academic_year_id, is_required)
         VALUES (?, ?, ?, ?)`,
          [classId, gs.subject_id, yearId, gs.is_required]
        );
        applied++;
      }

      // Update class status
      await db.run(
        "UPDATE classes SET status = 'incomplete', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [classId]
      );

      res.json({ message: `Curriculum applied: ${applied} subjects`, applied });

      auditLog(req, {
        action: 'apply_curriculum',
        entityType: 'class',
        entityId: classId,
        newValues: { academic_year_id: yearId, subjects_applied: applied },
      });
    } catch (err) {
      sendError(res, err, 'Failed to apply curriculum');
    }
  }
);

// ─── Assign Teacher to Subject ─────────────────────────────────
router.post('/:classId/assign', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);
    const { subject_id, teacher_id } = req.body;

    if (!subject_id) {
      return res.status(400).json({ error: 'subject_id is required' });
    }

    // Get the assignment
    const assignment = await db.get(
      'SELECT * FROM class_subject_teachers WHERE class_id = ? AND subject_id = ?',
      [classId, subject_id]
    );

    if (!assignment) {
      return res.status(404).json({ error: 'Subject not found in this class curriculum' });
    }

    // Check teacher workload (optional warning)
    if (teacher_id) {
      const existingClasses = await db.get(
        `SELECT COUNT(DISTINCT class_id) as count
         FROM class_subject_teachers
         WHERE teacher_id = ? AND academic_year_id = ?`,
        [teacher_id, assignment.academic_year_id]
      );

      if (existingClasses?.count >= 5) {
        // Warning but not blocking
      }
    }

    // Update assignment
    await db.run('UPDATE class_subject_teachers SET teacher_id = ? WHERE id = ?', [
      teacher_id || null,
      assignment.id,
    ]);

    // Check if class is now ready (filter in JS for SQLite/PostgreSQL compat)
    const classData = await db.get('SELECT * FROM classes WHERE id = ?', [classId]);
    const allAssignments = await db.all('SELECT * FROM class_subject_teachers WHERE class_id = ?', [
      classId,
    ]);
    const missingCount = allAssignments.filter((a) => a.is_required && !a.teacher_id).length;

    let newStatus = classData.status;
    if (missingCount === 0 && allAssignments.length > 0) {
      newStatus = 'ready';
    } else if (classData.status === 'draft') {
      newStatus = 'incomplete';
    }

    if (newStatus !== classData.status) {
      await db.run('UPDATE classes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        newStatus,
        classId,
      ]);
    }

    res.json({ message: 'Teacher assigned', new_status: newStatus });

    auditLog(req, {
      action: 'assign_teacher',
      entityType: 'class_subject',
      entityId: assignment.id,
      newValues: { teacher_id, subject_id },
    });
  } catch (err) {
    sendError(res, err, 'Failed to assign teacher');
  }
});

// ─── Remove Teacher Assignment ─────────────────────────────────
router.delete(
  '/:classId/assign/:subjectId',
  authMiddleware,
  roleMiddleware('admin'),
  async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const subjectId = parseInt(req.params.subjectId);

      await db.run(
        'UPDATE class_subject_teachers SET teacher_id = NULL WHERE class_id = ? AND subject_id = ?',
        [classId, subjectId]
      );

      // Update class status to incomplete
      await db.run(
        "UPDATE classes SET status = 'incomplete', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'ready'",
        [classId]
      );

      res.json({ message: 'Teacher removed' });
    } catch (err) {
      sendError(res, err, 'Failed to remove teacher');
    }
  }
);

// ─── Activate Class ────────────────────────────────────────────
router.post('/:classId/activate', authMiddleware, roleMiddleware('admin'), async (req, res) => {
  try {
    const classId = parseInt(req.params.classId);

    // Verify all required subjects have teachers (filter in JS for SQLite/PostgreSQL compat)
    const allAssignments = await db.all('SELECT * FROM class_subject_teachers WHERE class_id = ?', [
      classId,
    ]);
    const missingAssignments = allAssignments.filter((a) => a.is_required && !a.teacher_id);

    if (missingAssignments.length > 0) {
      return res.status(400).json({
        error: `Cannot activate: ${missingAssignments.length} required subjects have no teacher`,
      });
    }

    // Check if any assignments exist
    const assignments = await db.get(
      'SELECT COUNT(*) as count FROM class_subject_teachers WHERE class_id = ?',
      [classId]
    );

    if (assignments.count === 0) {
      return res.status(400).json({ error: 'Cannot activate: no curriculum applied' });
    }

    // Activate
    await db.run(
      "UPDATE classes SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [classId]
    );

    res.json({ message: 'Class activated' });

    auditLog(req, {
      action: 'activate',
      entityType: 'class',
      entityId: classId,
      newValues: { status: 'active' },
    });
  } catch (err) {
    sendError(res, err, 'Failed to activate class');
  }
});

module.exports = router;
