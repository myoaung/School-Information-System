/**
 * AI Report Generator
 * Phase 3 — Aggregates student data and generates AI-powered narrative reports
 */

const Anthropic = require('@anthropic-ai/sdk');
const CONFIG = { model: 'claude-haiku-4-5-20251001', maxTokens: 2048 };
const { getDb } = require('./db');

// ─── Student Data Aggregator ────────────────────────────────────────────────────

/**
 * Collect all data for a student report card.
 * Returns a structured object ready for AI narrative generation.
 */
function aggregateStudentData(studentUserId) {
  const db = getDb();

  // Student profile
  const student = db.prepare(`
    SELECT s.*, u.name, u.email, g.name as grade_name, g.code as grade_code
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN grades g ON s.grade_id = g.id
    WHERE s.user_id = ?
  `).get(studentUserId);

  if (!student) return null;

  // Grades per course
  const grades = db.prepare(`
    SELECT g.*, c.title as course_title, sub.code as subject_code, sub.name as subject_name
    FROM gradebook g
    JOIN courses c ON g.course_id = c.id
    JOIN subjects sub ON c.subject_id = sub.id
    WHERE g.student_id = ?
    ORDER BY sub.code
  `).all(studentUserId);

  // Assignment submissions
  const assignments = db.prepare(`
    SELECT a.title as assignment_title, c.title as course_title,
           s.score, a.max_score, s.status, s.submitted_at, s.feedback
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    JOIN courses c ON a.course_id = c.id
    WHERE s.student_id = ?
    ORDER BY s.submitted_at DESC
  `).all(studentUserId);

  // Quiz attempts
  const quizzes = db.prepare(`
    SELECT q.title as quiz_title, c.title as course_title,
           qa.score, q.max_score, qa.completed_at
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    JOIN courses c ON q.course_id = c.id
    WHERE qa.student_id = ?
    ORDER BY qa.completed_at DESC
  `).all(studentUserId);

  // Attendance summary
  const attendance = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late,
      SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave
    FROM attendance
    WHERE user_id = ?
  `).get(studentUserId);

  const attendanceRate = attendance.total > 0
    ? Math.round((attendance.present / attendance.total) * 100) : 0;

  // Overall GPA
  const overallGpa = db.prepare(
    'SELECT ROUND(AVG(gpa), 2) as avg FROM gradebook WHERE student_id = ? AND gpa IS NOT NULL'
  ).get(studentUserId).avg || 0;

  // Class enrollments
  const classes = db.prepare(`
    SELECT c.name, c.schedule, c.room, u.name as teacher_name
    FROM enrollments e
    JOIN classes c ON e.class_id = c.id
    LEFT JOIN users u ON c.teacher_id = u.id
    WHERE e.student_id = ?
  `).all(studentUserId);

  // Compute assignment stats
  const gradedAssignments = assignments.filter(a => a.score != null);
  const avgAssignmentScore = gradedAssignments.length > 0
    ? Math.round(gradedAssignments.reduce((sum, a) => sum + (a.score / a.max_score) * 100, 0) / gradedAssignments.length)
    : 0;

  // Compute quiz stats
  const completedQuizzes = quizzes.filter(q => q.score != null);
  const avgQuizScore = completedQuizzes.length > 0
    ? Math.round(completedQuizzes.reduce((sum, q) => sum + (q.score / q.max_score) * 100, 0) / completedQuizzes.length)
    : 0;

  return {
    student: {
      name: student.name,
      email: student.email,
      studentId: student.student_id,
      grade: student.grade_name || student.grade_code,
      section: student.section,
      gender: student.gender,
    },
    academics: {
      overallGpa,
      grades: grades.map(g => ({
        course: g.course_title,
        subject: g.subject_name,
        subjectCode: g.subject_code,
        assignmentScore: g.assignment_score,
        quizScore: g.quiz_score,
        examScore: g.exam_score,
        finalGrade: g.final_grade,
        gpa: g.gpa,
      })),
    },
    assignments: {
      total: assignments.length,
      graded: gradedAssignments.length,
      avgScore: avgAssignmentScore,
      items: assignments.map(a => ({
        title: a.assignment_title,
        course: a.course_title,
        score: a.score,
        maxScore: a.max_score,
        status: a.status,
        feedback: a.feedback,
      })),
    },
    quizzes: {
      total: quizzes.length,
      completed: completedQuizzes.length,
      avgScore: avgQuizScore,
      items: quizzes.map(q => ({
        title: q.quiz_title,
        course: q.course_title,
        score: q.score,
        maxScore: q.max_score,
      })),
    },
    attendance: {
      total: attendance.total,
      present: attendance.present,
      absent: attendance.absent,
      late: attendance.late,
      leave: attendance.leave,
      rate: attendanceRate,
    },
    classes: classes.map(c => ({
      name: c.name,
      teacher: c.teacher_name,
      schedule: c.schedule,
      room: c.room,
    })),
  };
}

// ─── AI Narrative Generation ─────────────────────────────────────────────────────

const REPORT_SYSTEM_PROMPT = `You are an experienced school report writer. Generate a professional, encouraging student report card narrative.

Rules:
- Write in third person ("[Student] has demonstrated...")
- Be specific — reference actual scores, subjects, and trends
- Highlight strengths first, then areas for improvement
- Use encouraging, constructive language suitable for parents
- Keep the tone warm but professional
- If attendance is below 80%, mention it as a concern
- If any subject GPA is below 2.5, suggest extra support
- End with a forward-looking recommendation
- Output clean HTML (no <html>/<body> tags, just the report content)
- Use <h3> for section headers, <p> for paragraphs, <ul>/<li> for lists`;

function buildReportPrompt(data) {
  const { student, academics, assignments, quizzes, attendance, classes } = data;

  const gradeSummary = academics.grades.map(g =>
    `  - ${g.subject} (${g.subjectCode}): Assignment ${g.assignmentScore ?? 'N/A'}, Quiz ${g.quizScore ?? 'N/A'}, Exam ${g.examScore ?? 'N/A'} → Grade: ${g.finalGrade}, GPA: ${g.gpa ?? 'N/A'}`
  ).join('\n');

  const weakSubjects = academics.grades.filter(g => g.gpa != null && g.gpa < 2.5);
  const strongSubjects = academics.grades.filter(g => g.gpa != null && g.gpa >= 3.5);

  return `Generate a student report card narrative for the following student.

## Student Profile
- Name: ${student.name}
- Grade: ${student.grade}, Section ${student.section}
- Student ID: ${student.studentId}

## Academic Performance
- Overall GPA: ${academics.overallGpa}
- Course Grades:
${gradeSummary}

## Assignments
- Total: ${assignments.total}, Graded: ${assignments.graded}
- Average Score: ${assignments.avgScore}%

## Quizzes
- Total: ${quizzes.total}, Completed: ${quizzes.completed}
- Average Score: ${quizzes.avgScore}%

## Attendance
- Total Days: ${attendance.total}
- Present: ${attendance.present}, Absent: ${attendance.absent}, Late: ${attendance.late}, Leave: ${attendance.leave}
- Attendance Rate: ${attendance.rate}%

## Classes Enrolled
${classes.map(c => `  - ${c.name} (Teacher: ${c.teacher})`).join('\n')}

${strongSubjects.length > 0 ? `## Strengths (GPA ≥ 3.5)\n${strongSubjects.map(s => `  - ${s.subject}: GPA ${s.gpa}`).join('\n')}` : ''}
${weakSubjects.length > 0 ? `## Areas Needing Support (GPA < 2.5)\n${weakSubjects.map(s => `  - ${s.subject}: GPA ${s.gpa}`).join('\n')}` : ''}

Write the report narrative now.`;
}

/**
 * Generate an AI-powered report card narrative.
 * Falls back to a template-based report if AI is unavailable.
 */
async function generateReportNarrative(studentUserId) {
  const data = aggregateStudentData(studentUserId);
  if (!data) return null;

  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      data,
      narrative: generateFallbackNarrative(data),
      source: 'template',
    };
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const prompt = buildReportPrompt(data);
    const response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: 2048,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find(b => b.type === 'text');
    return {
      data,
      narrative: text?.text || generateFallbackNarrative(data),
      source: 'ai',
    };
  } catch (err) {
    console.error('[Report] AI generation failed, using template:', err.message);
    return {
      data,
      narrative: generateFallbackNarrative(data),
      source: 'template',
    };
  }
}

// ─── Fallback Template ──────────────────────────────────────────────────────────

function generateFallbackNarrative(data) {
  const { student, academics, attendance, assignments, quizzes } = data;
  const gpa = academics.overallGpa;
  const rate = attendance.rate;

  let performance = 'satisfactory';
  if (gpa >= 3.5) performance = 'excellent';
  else if (gpa >= 3.0) performance = 'good';
  else if (gpa >= 2.5) performance = 'satisfactory';
  else performance = 'needs improvement';

  let html = `<h3>Academic Summary</h3>
<p>${student.name} has demonstrated <strong>${performance}</strong> academic performance this semester with an overall GPA of <strong>${gpa}</strong>.</p>`;

  if (academics.grades.length > 0) {
    html += `<h3>Subject Performance</h3><ul>`;
    for (const g of academics.grades) {
      html += `<li><strong>${g.subject}</strong>: ${g.finalGrade || 'In Progress'} (GPA: ${g.gpa ?? 'N/A'})</li>`;
    }
    html += `</ul>`;
  }

  html += `<h3>Attendance</h3>
<p>Attendance rate: <strong>${rate}%</strong> (${attendance.present} present, ${attendance.absent} absent, ${attendance.late} late out of ${attendance.total} days).</p>`;

  if (rate < 80) {
    html += `<p><em>Attendance is below the 80% target. Regular attendance is essential for academic success.</em></p>`;
  }

  if (assignments.graded > 0) {
    html += `<h3>Assignments</h3>
<p>Average assignment score: <strong>${assignments.avgScore}%</strong> across ${assignments.graded} graded submissions.</p>`;
  }

  if (quizzes.completed > 0) {
    html += `<h3>Quizzes</h3>
<p>Average quiz score: <strong>${quizzes.avgScore}%</strong> across ${quizzes.completed} quizzes.</p>`;
  }

  html += `<h3>Recommendation</h3>
<p>${student.name} is encouraged to continue their efforts${gpa < 3.0 ? ' and seek additional support in subjects where improvement is needed' : ''}. ${rate < 80 ? 'Improving attendance should be a priority for the next semester.' : 'Keep up the great work!'}</p>`;

  return html;
}

// ─── Report Storage ─────────────────────────────────────────────────────────────

/**
 * Save a generated report to the database.
 * Creates the ai_reports table if it doesn't exist.
 */
function saveReport(studentUserId, generatedBy, narrative, source) {
  const db = getDb();

  db.exec(`
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

  const result = db.prepare(`
    INSERT INTO ai_reports (student_id, generated_by, narrative, source, status)
    VALUES (?, ?, ?, ?, 'draft')
  `).run(studentUserId, generatedBy, narrative, source);

  return result.lastInsertRowid;
}

/**
 * Get all reports for a student (or all if admin/teacher).
 */
function getReports(studentUserId, viewerRole, viewerId) {
  const db = getDb();

  db.exec(`
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

  if (viewerRole === 'student') {
    // Students only see approved reports for themselves
    return db.prepare(`
      SELECT r.*, u.name as student_name
      FROM ai_reports r
      JOIN users u ON r.student_id = u.id
      WHERE r.student_id = ? AND r.status = 'approved'
      ORDER BY r.created_at DESC
    `).all(viewerId);
  }

  // Admin/Teacher can see all reports
  return db.prepare(`
    SELECT r.*, u.name as student_name
    FROM ai_reports r
    JOIN users u ON r.student_id = u.id
    ${studentUserId ? 'WHERE r.student_id = ?' : ''}
    ORDER BY r.created_at DESC
  `).all(...(studentUserId ? [studentUserId] : []));
}

/**
 * Update report status (review gate).
 */
function updateReportStatus(reportId, status, reviewedBy) {
  const db = getDb();

  return db.prepare(`
    UPDATE ai_reports
    SET status = ?, reviewed_by = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, reviewedBy, reportId);
}

module.exports = {
  aggregateStudentData,
  generateReportNarrative,
  saveReport,
  getReports,
  updateReportStatus,
};
