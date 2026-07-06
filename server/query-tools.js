const { db } = require('./data');

// ─── Safe Query Builder ─────────────────────────────────────────────────────
// All queries use parameterized statements — no string interpolation in SQL

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── Query Tools ────────────────────────────────────────────────────────────
// Each tool: { name, description, parameters, execute(user, params) }

const tools = [
  // ── Attendance Queries ─────────────────────────────────────────────────────
  {
    name: 'query_attendance',
    description: 'Query attendance records. Filter by class, student, date range, or status.',
    parameters: {
      class_name: 'Optional. Filter by class name (partial match ok)',
      student_name: 'Optional. Filter by student name (partial match ok)',
      date_from: 'Optional. Start date (YYYY-MM-DD)',
      date_to: 'Optional. End date (YYYY-MM-DD)',
      status: 'Optional. Filter by status: present, absent, late, leave',
      group_by: 'Optional. Group results: "student", "class", "date", or "status"',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      // Role-based filtering
      if (user.role === 'student') {
        where.push('a.user_id = ?');
        args.push(user.id);
      } else if (user.role === 'teacher') {
        where.push('c.teacher_id = ?');
        args.push(user.id);
      }

      if (params.class_name) {
        where.push('c.name LIKE ?');
        args.push(`%${params.class_name}%`);
      }
      if (params.student_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.student_name}%`);
      }
      if (params.date_from) {
        where.push('a.date >= ?');
        args.push(params.date_from);
      }
      if (params.date_to) {
        where.push('a.date <= ?');
        args.push(params.date_to);
      }
      if (params.status) {
        where.push('a.status = ?');
        args.push(params.status);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      if (params.group_by === 'student') {
        return await db.all(`
          SELECT u.name as student, a.status, COUNT(*) as count
          FROM attendance a
          JOIN users u ON a.user_id = u.id
          JOIN classes c ON a.class_id = c.id
          ${whereClause}
          GROUP BY u.name, a.status
          ORDER BY u.name, a.status
        `, args);
      }

      if (params.group_by === 'class') {
        return await db.all(`
          SELECT c.name as class, a.status, COUNT(*) as count
          FROM attendance a
          JOIN users u ON a.user_id = u.id
          JOIN classes c ON a.class_id = c.id
          ${whereClause}
          GROUP BY c.name, a.status
          ORDER BY c.name, a.status
        `, args);
      }

      if (params.group_by === 'date') {
        return await db.all(`
          SELECT a.date, a.status, COUNT(*) as count
          FROM attendance a
          JOIN users u ON a.user_id = u.id
          JOIN classes c ON a.class_id = c.id
          ${whereClause}
          GROUP BY a.date, a.status
          ORDER BY a.date, a.status
        `, args);
      }

      // Default: individual records
      return await db.all(`
        SELECT u.name as student, c.name as class, a.date, a.status, a.note
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        JOIN classes c ON a.class_id = c.id
        ${whereClause}
        ORDER BY a.date DESC, u.name
        LIMIT 50
      `, args);
    },
  },

  // ── Student Queries ────────────────────────────────────────────────────────
  {
    name: 'query_students',
    description: 'Query student information. Filter by name, grade, section, or status.',
    parameters: {
      name: 'Optional. Filter by student name (partial match ok)',
      grade: 'Optional. Filter by grade code (e.g. G10, G9)',
      section: 'Optional. Filter by section (e.g. A, B)',
      status: 'Optional. Filter by status: active, suspended, graduated, transferred',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (user.role === 'student') {
        where.push('s.user_id = ?');
        args.push(user.id);
      }

      if (params.name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.name}%`);
      }
      if (params.grade) {
        where.push('g.code = ?');
        args.push(params.grade.toUpperCase());
      }
      if (params.section) {
        where.push('s.section = ?');
        args.push(params.section.toUpperCase());
      }
      if (params.status) {
        where.push('s.status = ?');
        args.push(params.status);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      return await db.all(`
        SELECT u.name, u.email, s.student_id, g.name as grade, s.section,
               s.gender, s.phone, s.status, s.parent_name, s.parent_phone
        FROM students s
        JOIN users u ON s.user_id = u.id
        LEFT JOIN grades g ON s.grade_id = g.id
        ${whereClause}
        ORDER BY g.display_order, s.section, u.name
        LIMIT 50
      `, args);
    },
  },

  // ── Grade/Gradebook Queries ────────────────────────────────────────────────
  {
    name: 'query_grades',
    description: 'Query student grades and GPA. Filter by student name, course, or class.',
    parameters: {
      student_name: 'Optional. Filter by student name (partial match ok)',
      course_title: 'Optional. Filter by course title (partial match ok)',
      class_name: 'Optional. Filter by class name (partial match ok)',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (user.role === 'student') {
        where.push('gb.student_id = ?');
        args.push(user.id);
      } else if (user.role === 'teacher') {
        where.push('c.teacher_id = ?');
        args.push(user.id);
      }

      if (params.student_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.student_name}%`);
      }
      if (params.course_title) {
        where.push('co.title LIKE ?');
        args.push(`%${params.course_title}%`);
      }
      if (params.class_name) {
        where.push('cl.name LIKE ?');
        args.push(`%${params.class_name}%`);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      return await db.all(`
        SELECT u.name as student, co.title as course, cl.name as class,
               gb.assignment_score, gb.quiz_score, gb.exam_score,
               gb.final_grade, gb.gpa
        FROM gradebook gb
        JOIN users u ON gb.student_id = u.id
        JOIN courses co ON gb.course_id = co.id
        JOIN classes cl ON co.class_id = cl.id
        ${whereClause}
        ORDER BY u.name, co.title
        LIMIT 50
      `, args);
    },
  },

  // ── Class Queries ──────────────────────────────────────────────────────────
  {
    name: 'query_classes',
    description: 'Query class information including teacher and student count.',
    parameters: {
      name: 'Optional. Filter by class name (partial match ok)',
      teacher_name: 'Optional. Filter by teacher name (partial match ok)',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (user.role === 'teacher') {
        where.push('c.teacher_id = ?');
        args.push(user.id);
      }

      if (params.name) {
        where.push('c.name LIKE ?');
        args.push(`%${params.name}%`);
      }
      if (params.teacher_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.teacher_name}%`);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      return await db.all(`
        SELECT c.name, c.description, c.schedule, c.room, u.name as teacher,
          (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) as student_count
        FROM classes c
        LEFT JOIN users u ON c.teacher_id = u.id
        ${whereClause}
        ORDER BY c.name
      `, args);
    },
  },

  // ── Teacher Queries ────────────────────────────────────────────────────────
  {
    name: 'query_teachers',
    description: 'Query teacher information including specialization and status.',
    parameters: {
      name: 'Optional. Filter by teacher name (partial match ok)',
      specialization: 'Optional. Filter by subject specialization',
      status: 'Optional. Filter by status: active, on_leave, resigned',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (params.name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.name}%`);
      }
      if (params.specialization) {
        where.push('t.specialization LIKE ?');
        args.push(`%${params.specialization}%`);
      }
      if (params.status) {
        where.push('t.status = ?');
        args.push(params.status);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      // Admin gets full details; others get limited info
      const fields = user.role === 'admin'
        ? 'u.name, u.email, t.teacher_id, t.phone, t.qualification, t.specialization, t.hire_date, t.status'
        : 'u.name, t.teacher_id, t.qualification, t.specialization, t.status';

      return await db.all(`
        SELECT ${fields}
        FROM teachers t
        JOIN users u ON t.user_id = u.id
        ${whereClause}
        ORDER BY u.name
      `, args);
    },
  },

  // ── Timetable Queries ──────────────────────────────────────────────────────
  {
    name: 'query_timetable',
    description: 'Query the class timetable/schedule. Filter by class, teacher, or day.',
    parameters: {
      class_name: 'Optional. Filter by class name (partial match ok)',
      teacher_name: 'Optional. Filter by teacher name (partial match ok)',
      day: 'Optional. Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (user.role === 'teacher') {
        where.push('t.teacher_id = ?');
        args.push(user.id);
      }

      if (params.class_name) {
        where.push('c.name LIKE ?');
        args.push(`%${params.class_name}%`);
      }
      if (params.teacher_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.teacher_name}%`);
      }
      if (params.day !== undefined) {
        where.push('t.day_of_week = ?');
        args.push(parseInt(params.day));
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      return await db.all(`
        SELECT c.name as class, s.name as subject, u.name as teacher,
               t.day_of_week, t.start_time, t.end_time, t.room
        FROM timetable t
        JOIN classes c ON t.class_id = c.id
        JOIN subjects s ON t.subject_id = s.id
        LEFT JOIN users u ON t.teacher_id = u.id
        ${whereClause}
        ORDER BY t.day_of_week, t.start_time
      `, args);
    },
  },

  // ── Announcement Queries ───────────────────────────────────────────────────
  {
    name: 'query_announcements',
    description: 'Query school announcements. Filter by keyword or author.',
    parameters: {
      keyword: 'Optional. Search in title and content (partial match ok)',
      author_name: 'Optional. Filter by author name',
      limit: 'Optional. Number of results (default 5, max 20)',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (params.keyword) {
        where.push('(a.title LIKE ? OR a.content LIKE ?)');
        args.push(`%${params.keyword}%`, `%${params.keyword}%`);
      }
      if (params.author_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.author_name}%`);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const limit = Math.min(parseInt(params.limit) || 5, 20);

      return await db.all(`
        SELECT a.title, a.content, u.name as author, a.created_at
        FROM announcements a
        LEFT JOIN users u ON a.author_id = u.id
        ${whereClause}
        ORDER BY a.created_at DESC
        LIMIT ?
      `, [...args, limit]);
    },
  },

  // ── Assignment Queries ─────────────────────────────────────────────────────
  {
    name: 'query_assignments',
    description: 'Query assignments and submissions. Filter by course, status, or student.',
    parameters: {
      course_title: 'Optional. Filter by course title (partial match ok)',
      student_name: 'Optional. Filter by student name (for submissions)',
      status: 'Optional. Filter submission status: submitted, graded, late, returned',
    },
    async execute(user, params) {
      let where = [];
      let args = [];

      if (user.role === 'student') {
        where.push('sub.student_id = ?');
        args.push(user.id);
      } else if (user.role === 'teacher') {
        where.push('c.teacher_id = ?');
        args.push(user.id);
      }

      if (params.course_title) {
        where.push('co.title LIKE ?');
        args.push(`%${params.course_title}%`);
      }
      if (params.student_name) {
        where.push('u.name LIKE ?');
        args.push(`%${params.student_name}%`);
      }
      if (params.status) {
        where.push('sub.status = ?');
        args.push(params.status);
      }

      const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

      return await db.all(`
        SELECT a.title as assignment, co.title as course, u.name as student,
               sub.score, sub.feedback, sub.status, sub.submitted_at
        FROM submissions sub
        JOIN assignments a ON sub.assignment_id = a.id
        JOIN courses co ON a.course_id = co.id
        JOIN classes c ON co.class_id = c.id
        JOIN users u ON sub.student_id = u.id
        ${whereClause}
        ORDER BY sub.submitted_at DESC
        LIMIT 50
      `, args);
    },
  },

  // ── Summary/Stats Queries ──────────────────────────────────────────────────
  {
    name: 'query_stats',
    description: 'Get school statistics: total students, teachers, classes, attendance rate.',
    parameters: {},
    async execute(user) {
      const studentsRow = await db.get("SELECT COUNT(*) as c FROM students WHERE status = 'active'");
      const teachersRow = await db.get("SELECT COUNT(*) as c FROM teachers WHERE status = 'active'");
      const classesRow = await db.get('SELECT COUNT(*) as c FROM classes');
      const announcementsRow = await db.get('SELECT COUNT(*) as c FROM announcements');

      const attendanceStats = await db.all(`
        SELECT status, COUNT(*) as count
        FROM attendance
        GROUP BY status
      `);

      const totalAttendance = attendanceStats.reduce((sum, r) => sum + r.count, 0);
      const presentCount = attendanceStats.find(r => r.status === 'present')?.count || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      return {
        students: studentsRow?.c || 0,
        teachers: teachersRow?.c || 0,
        classes: classesRow?.c || 0,
        announcements: announcementsRow?.c || 0,
        attendanceRate: `${attendanceRate}%`,
        attendanceBreakdown: attendanceStats,
      };
    },
  },
];

// ─── Tool Executor ──────────────────────────────────────────────────────────

function getToolDefinitions() {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: {
      type: 'object',
      properties: Object.fromEntries(
        Object.entries(t.parameters).map(([k, v]) => [k, { type: 'string', description: v }])
      ),
    },
  }));
}

async function executeTool(toolName, user, params) {
  const tool = tools.find(t => t.name === toolName);
  if (!tool) {
    return { error: `Unknown tool: ${toolName}` };
  }
  try {
    const result = await tool.execute(user, params);
    return { data: result, count: Array.isArray(result) ? result.length : 1 };
  } catch (err) {
    console.error(`[QueryTool] Error executing ${toolName}:`, err.message);
    return { error: `Query failed: ${err.message}` };
  }
}

module.exports = { getToolDefinitions, executeTool };
