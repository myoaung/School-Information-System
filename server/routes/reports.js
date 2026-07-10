const express = require('express');
const { db } = require('../data');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');
const { sendError } = require('../utils/errorHandler');

const router = express.Router();

// GET /api/reports/dashboard — role-aware stats for dashboard widgets
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { role, id } = req.user;

    // Recent announcements (all roles)
    const recentAnnouncements = await db.all(`
      SELECT a.id, a.title, a.created_at, u.name as author
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.created_at DESC LIMIT 3
    `);

    if (role === 'student') {
      // Student-specific stats
      const attendance = await db.get(`
        SELECT COUNT(*) as total,
          SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
        FROM attendance WHERE user_id = ?
      `, [id]);
      const attendanceRate = attendance.total > 0
        ? Math.round((attendance.present / attendance.total) * 100) : 0;

      const overallGpaRow = await db.get(
        'SELECT ROUND(AVG(gpa), 2) as avg FROM gradebook WHERE student_id = ? AND gpa IS NOT NULL',
        [id]
      );
      const overallGpa = overallGpaRow.avg || 0;

      const pendingAssignmentsRow = await db.get(`
        SELECT COUNT(*) as count FROM assignments a
        WHERE a.due_date >= date('now')
        AND a.id NOT IN (SELECT assignment_id FROM submissions WHERE student_id = ?)
      `, [id]);
      const pendingAssignments = pendingAssignmentsRow.count;

      const upcomingQuizzesRow = await db.get(`
        SELECT COUNT(*) as count FROM quizzes q
        WHERE q.due_date >= date('now')
        AND q.id NOT IN (SELECT quiz_id FROM quiz_attempts WHERE student_id = ?)
      `, [id]);
      const upcomingQuizzes = upcomingQuizzesRow.count;

      return res.json({
        dashboard: {
          attendanceRate,
          overallGpa,
          pendingAssignments,
          upcomingQuizzes,
          recentAnnouncements
        }
      });
    }

    // Admin/Teacher stats
    const totalStudentsRow = await db.get('SELECT COUNT(*) as count FROM students WHERE status = ?', ['active']);
    const totalStudents = totalStudentsRow.count;
    const totalTeachersRow = await db.get('SELECT COUNT(*) as count FROM teachers WHERE status = ?', ['active']);
    const totalTeachers = totalTeachersRow.count;
    const totalClassesRow = await db.get('SELECT COUNT(*) as count FROM classes');
    const totalClasses = totalClassesRow.count;
    const totalCoursesRow = await db.get('SELECT COUNT(*) as count FROM courses');
    const totalCourses = totalCoursesRow.count;

    const attendanceStats = await db.get(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
    `);
    const attendanceRate = attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

    const pendingSubmissionsRow = await db.get(
      "SELECT COUNT(*) as count FROM submissions WHERE status = 'submitted'"
    );
    const pendingSubmissions = pendingSubmissionsRow.count;

    res.json({
      dashboard: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalCourses,
        attendanceRate,
        pendingSubmissions,
        recentAnnouncements
      }
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate dashboard data');
  }
});

// GET /api/reports/teacher/:id — teacher performance report
router.get('/teacher/:id', authMiddleware, async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id);

    // Teachers can only view their own report
    if (req.user.role === 'teacher' && req.user.id !== teacherId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Teacher info
    const teacher = await db.get(`
      SELECT t.*, u.name, u.email
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.user_id = ?
    `, [teacherId]);

    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    // Classes taught
    const classes = await db.all(`
      SELECT c.*, COUNT(e.student_id) as student_count
      FROM classes c
      LEFT JOIN enrollments e ON e.class_id = c.id
      WHERE c.teacher_id = ?
      GROUP BY c.id
    `, [teacherId]);

    // Courses taught
    const courses = await db.all(`
      SELECT co.*, sub.code as subject_code, sub.name as subject_name, cl.name as class_name
      FROM courses co
      JOIN subjects sub ON co.subject_id = sub.id
      JOIN classes cl ON co.class_id = cl.id
      WHERE cl.teacher_id = ?
    `, [teacherId]);

    // Average student GPA per course
    const courseStats = await db.all(`
      SELECT co.title as course_title, sub.code as subject_code,
        COUNT(g.id) as graded_students,
        ROUND(AVG(g.gpa), 2) as avg_gpa,
        ROUND(AVG(g.assignment_score), 1) as avg_assignment,
        ROUND(AVG(g.quiz_score), 1) as avg_quiz,
        ROUND(AVG(g.exam_score), 1) as avg_exam
      FROM courses co
      JOIN subjects sub ON co.subject_id = sub.id
      JOIN classes cl ON co.class_id = cl.id
      LEFT JOIN gradebook g ON g.course_id = co.id
      WHERE cl.teacher_id = ?
      GROUP BY co.id
    `, [teacherId]);

    // Total unique students
    const totalStudentsRow = await db.get(`
      SELECT COUNT(DISTINCT e.student_id) as count
      FROM enrollments e
      JOIN classes c ON e.class_id = c.id
      WHERE c.teacher_id = ?
    `, [teacherId]);
    const totalStudents = totalStudentsRow.count;

    res.json({
      report: {
        teacher: {
          name: teacher.name,
          email: teacher.email,
          teacherId: teacher.teacher_id,
          qualification: teacher.qualification,
          specialization: teacher.specialization
        },
        classes,
        courses,
        courseStats,
        totalStudents
      }
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate teacher report');
  }
});

// GET /api/reports/overview — school-wide stats (admin/teacher)
router.get('/overview', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const totalStudentsRow = await db.get('SELECT COUNT(*) as count FROM students WHERE status = ?', ['active']);
    const totalStudents = totalStudentsRow.count;
    const totalTeachersRow = await db.get('SELECT COUNT(*) as count FROM teachers WHERE status = ?', ['active']);
    const totalTeachers = totalTeachersRow.count;
    const totalClassesRow = await db.get('SELECT COUNT(*) as count FROM classes');
    const totalClasses = totalClassesRow.count;
    const totalCoursesRow = await db.get('SELECT COUNT(*) as count FROM courses');
    const totalCourses = totalCoursesRow.count;

    // Average GPA
    const avgGpaRow = await db.get('SELECT ROUND(AVG(gpa), 2) as avg FROM gradebook WHERE gpa IS NOT NULL');
    const avgGpa = avgGpaRow.avg || 0;

    // Attendance rate
    const attendanceStats = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
    `);
    const attendanceRate = attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    // Submission stats
    const submissionStats = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'graded' THEN 1 ELSE 0 END) as graded,
        SUM(CASE WHEN status = 'submitted' THEN 1 ELSE 0 END) as pending
      FROM submissions
    `);

    // Quiz attempt stats
    const quizStats = await db.get(`
      SELECT COUNT(*) as total, ROUND(AVG(score), 1) as avg_score
      FROM quiz_attempts
    `);

    // Grade distribution
    const gradeDistribution = await db.all(`
      SELECT final_grade as grade, COUNT(*) as count
      FROM gradebook
      WHERE final_grade IS NOT NULL AND final_grade != '-'
      GROUP BY final_grade
      ORDER BY count DESC
    `);

    // Top 5 students by GPA
    const topStudents = await db.all(`
      SELECT u.name, u.id, ROUND(AVG(g.gpa), 2) as avg_gpa
      FROM gradebook g
      JOIN users u ON g.student_id = u.id
      WHERE g.gpa IS NOT NULL
      GROUP BY g.student_id
      ORDER BY avg_gpa DESC
      LIMIT 5
    `);

    res.json({
      overview: {
        totalStudents,
        totalTeachers,
        totalClasses,
        totalCourses,
        avgGpa,
        attendanceRate,
        submissions: submissionStats,
        quizAttempts: quizStats,
        gradeDistribution,
        topStudents
      }
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate overview report');
  }
});

// GET /api/reports/student/:id — student report card
router.get('/student/:id', authMiddleware, async (req, res) => {
  try {
    const studentId = parseInt(req.params.id);

    // Students can only view their own report
    if (req.user.role === 'student' && req.user.id !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Student info
    const student = await db.get(`
      SELECT s.*, u.name, u.email
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [studentId]);

    if (!student) return res.status(404).json({ error: 'Student not found' });

    // Grades per course
    const grades = await db.all(`
      SELECT g.*, c.title as course_title, sub.code as subject_code, sub.name as subject_name
      FROM gradebook g
      JOIN courses c ON g.course_id = c.id
      JOIN subjects sub ON c.subject_id = sub.id
      WHERE g.student_id = ?
      ORDER BY sub.code
    `, [studentId]);

    // Assignment submissions
    const assignments = await db.all(`
      SELECT a.title as assignment_title, c.title as course_title,
             s.score, a.max_score, s.status, s.submitted_at
      FROM submissions s
      JOIN assignments a ON s.assignment_id = a.id
      JOIN courses c ON a.course_id = c.id
      WHERE s.student_id = ?
      ORDER BY s.submitted_at DESC
    `, [studentId]);

    // Quiz attempts
    const quizzes = await db.all(`
      SELECT q.title as quiz_title, c.title as course_title,
             qa.score, q.max_score, qa.completed_at
      FROM quiz_attempts qa
      JOIN quizzes q ON qa.quiz_id = q.id
      JOIN courses c ON q.course_id = c.id
      WHERE qa.student_id = ?
      ORDER BY qa.completed_at DESC
    `, [studentId]);

    // Attendance summary
    const attendance = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
        SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
      FROM attendance
      WHERE user_id = ?
    `, [studentId]);

    const attendanceRate = attendance.total > 0
      ? Math.round((attendance.present / attendance.total) * 100)
      : 0;

    // Overall GPA
    const overallGpaRow = await db.get(
      'SELECT ROUND(AVG(gpa), 2) as avg FROM gradebook WHERE student_id = ? AND gpa IS NOT NULL',
      [studentId]
    );
    const overallGpa = overallGpaRow.avg || 0;

    res.json({
      report: {
        student: {
          name: student.name,
          email: student.email,
          studentId: student.student_id,
          grade: student.grade_id,
          section: student.section
        },
        grades,
        assignments,
        quizzes,
        attendance: { ...attendance, rate: attendanceRate },
        overallGpa
      }
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate student report');
  }
});

// GET /api/reports/class/:id — class performance summary
router.get('/class/:id', authMiddleware, roleMiddleware('admin', 'teacher'), async (req, res) => {
  try {
    const classId = parseInt(req.params.id);

    // Class info
    const classInfo = await db.get(`
      SELECT c.*, u.name as teacher_name
      FROM classes c
      JOIN users u ON c.teacher_id = u.id
      WHERE c.id = ?
    `, [classId]);

    if (!classInfo) return res.status(404).json({ error: 'Class not found' });

    // Enrollment count
    const enrollmentCountRow = await db.get(
      'SELECT COUNT(*) as count FROM enrollments WHERE class_id = ?',
      [classId]
    );
    const enrollmentCount = enrollmentCountRow.count;

    // Students enrolled
    const students = await db.all(`
      SELECT u.id, u.name, s.student_id as student_code
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      JOIN students s ON s.user_id = u.id
      WHERE e.class_id = ?
      ORDER BY u.name
    `, [classId]);

    // Courses in this class
    const courses = await db.all(`
      SELECT c.*, sub.code as subject_code, sub.name as subject_name
      FROM courses c
      JOIN subjects sub ON c.subject_id = sub.id
      WHERE c.class_id = ?
    `, [classId]);

    // Grade stats per course
    const courseStats = await db.all(`
      SELECT
        c.title as course_title,
        sub.code as subject_code,
        COUNT(g.id) as graded_students,
        ROUND(AVG(g.gpa), 2) as avg_gpa,
        ROUND(AVG(g.assignment_score), 1) as avg_assignment,
        ROUND(AVG(g.quiz_score), 1) as avg_quiz,
        ROUND(AVG(g.exam_score), 1) as avg_exam
      FROM courses c
      JOIN subjects sub ON c.subject_id = sub.id
      LEFT JOIN gradebook g ON g.course_id = c.id
      WHERE c.class_id = ?
      GROUP BY c.id
    `, [classId]);

    // Attendance rate for this class
    const attendanceStats = await db.get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present
      FROM attendance
      WHERE class_id = ?
    `, [classId]);
    const attendanceRate = attendanceStats.total > 0
      ? Math.round((attendanceStats.present / attendanceStats.total) * 100)
      : 0;

    // Student ranking by average GPA in this class
    const rankings = await db.all(`
      SELECT u.name, u.id, ROUND(AVG(g.gpa), 2) as avg_gpa
      FROM enrollments e
      JOIN users u ON e.student_id = u.id
      LEFT JOIN gradebook g ON g.student_id = u.id
      WHERE e.class_id = ?
      GROUP BY u.id
      HAVING avg_gpa IS NOT NULL
      ORDER BY avg_gpa DESC
    `, [classId]);

    res.json({
      report: {
        classInfo: {
          name: classInfo.name,
          description: classInfo.description,
          teacher: classInfo.teacher_name,
          schedule: classInfo.schedule,
          room: classInfo.room
        },
        enrollmentCount,
        students,
        courses,
        courseStats,
        attendanceRate,
        rankings
      }
    });
  } catch (err) {
    sendError(res, err, 'Failed to generate class report');
  }
});

module.exports = router;
