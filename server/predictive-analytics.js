/**
 * Predictive Analytics Engine
 * Phase 4 — At-risk student detection, trend analysis, interventions
 */

const Anthropic = require('@anthropic-ai/sdk');
const { getDb } = require('./db');

const CONFIG = { model: 'claude-haiku-4-5-20251001', maxTokens: 1024 };

// ─── Risk Scoring Engine ────────────────────────────────────────────────────────

/**
 * Calculate risk score for a single student.
 * Returns a score from 0-100 (higher = more at-risk) with breakdown.
 */
function calculateRiskScore(studentUserId) {
  const db = getDb();

  // Attendance rate (last 30 days)
  const attendance = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent
    FROM attendance
    WHERE user_id = ? AND date >= date('now', '-30 days')
  `).get(studentUserId);

  const attendanceRate = attendance.total > 0
    ? (attendance.present / attendance.total) * 100 : 100;

  // GPA trend (current vs previous)
  const currentGpa = db.prepare(`
    SELECT ROUND(AVG(gpa), 2) as avg
    FROM gradebook WHERE student_id = ? AND gpa IS NOT NULL
  `).get(studentUserId).avg || 0;

  // Assignment completion rate
  const assignments = db.prepare(`
    SELECT
      COUNT(DISTINCT a.id) as total,
      COUNT(DISTINCT s.assignment_id) as submitted
    FROM assignments a
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.student_id = ?
    WHERE a.due_date <= date('now')
  `).get(studentUserId);

  const completionRate = assignments.total > 0
    ? (assignments.submitted / assignments.total) * 100 : 100;

  // Quiz performance
  const quizzes = db.prepare(`
    SELECT AVG(CAST(score AS REAL) / max_score * 100) as avg_score
    FROM quiz_attempts qa
    JOIN quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_id = ?
  `).get(studentUserId);

  const quizAvg = quizzes.avg_score || 100;

  // Missing assignments count
  const missingCount = Math.max(0, assignments.total - assignments.submitted);

  // Calculate weighted risk score
  // Attendance: 30%, GPA: 25%, Assignments: 25%, Quizzes: 20%
  const attendanceRisk = Math.max(0, (100 - attendanceRate) * 0.30);
  const gpaRisk = Math.max(0, (4.0 - currentGpa) / 4.0 * 100) * 0.25;
  const assignmentRisk = Math.max(0, (100 - completionRate) * 0.25);
  const quizRisk = Math.max(0, (100 - quizAvg) * 0.20);

  const rawScore = attendanceRisk + gpaRisk + assignmentRisk + quizRisk;
  const riskScore = Math.min(100, Math.round(rawScore));

  // Determine risk level
  let riskLevel = 'low';
  if (riskScore >= 70) riskLevel = 'critical';
  else if (riskScore >= 50) riskLevel = 'high';
  else if (riskScore >= 30) riskLevel = 'medium';

  // Identify risk factors
  const factors = [];
  if (attendanceRate < 80) factors.push({ type: 'attendance', value: attendanceRate, threshold: 80 });
  if (currentGpa < 2.5) factors.push({ type: 'gpa', value: currentGpa, threshold: 2.5 });
  if (completionRate < 70) factors.push({ type: 'assignments', value: completionRate, threshold: 70 });
  if (quizAvg < 60) factors.push({ type: 'quizzes', value: quizAvg, threshold: 60 });
  if (missingCount >= 3) factors.push({ type: 'missing', value: missingCount, threshold: 3 });

  return {
    riskScore,
    riskLevel,
    factors,
    metrics: {
      attendanceRate: Math.round(attendanceRate),
      gpa: currentGpa,
      assignmentCompletion: Math.round(completionRate),
      quizAvg: Math.round(quizAvg),
      missingAssignments: missingCount,
    },
  };
}

/**
 * Get risk scores for all students (or filtered by class/grade).
 */
function getAtRiskStudents(options = {}) {
  const db = getDb();
  const { classId, gradeId, minScore = 0, limit = 50 } = options;

  let studentQuery = `
    SELECT u.id, u.name, s.student_id as student_code, s.grade_id, s.section,
           g.name as grade_name
    FROM students s
    JOIN users u ON s.user_id = u.id
    LEFT JOIN grades g ON s.grade_id = g.id
    WHERE s.status = 'active'
  `;
  const params = [];

  if (classId) {
    studentQuery += ` AND u.id IN (SELECT student_id FROM enrollments WHERE class_id = ?)`;
    params.push(classId);
  }
  if (gradeId) {
    studentQuery += ` AND s.grade_id = ?`;
    params.push(gradeId);
  }

  studentQuery += ` ORDER BY u.name LIMIT ?`;
  params.push(limit);

  const students = db.prepare(studentQuery).all(...params);

  const results = students.map(student => {
    const risk = calculateRiskScore(student.id);
    return {
      userId: student.id,
      name: student.name,
      studentCode: student.student_code,
      grade: student.grade_name,
      section: student.section,
      ...risk,
    };
  });

  // Filter by minimum score and sort by risk (highest first)
  return results
    .filter(r => r.riskScore >= minScore)
    .sort((a, b) => b.riskScore - a.riskScore);
}

// ─── Trend Analysis ─────────────────────────────────────────────────────────────

/**
 * Analyze GPA trend over time for a student.
 * Returns monthly averages to show improvement or decline.
 */
function analyzeTrend(studentUserId) {
  const db = getDb();

  // Get grade history (simulated by grouping submissions by month)
  const monthlyScores = db.prepare(`
    SELECT
      strftime('%Y-%m', s.submitted_at) as month,
      ROUND(AVG(CAST(s.score AS REAL) / a.max_score * 100), 1) as avg_score,
      COUNT(*) as count
    FROM submissions s
    JOIN assignments a ON s.assignment_id = a.id
    WHERE s.student_id = ? AND s.score IS NOT NULL
    GROUP BY month
    ORDER BY month
  `).all(studentUserId);

  // Attendance trend
  const monthlyAttendance = db.prepare(`
    SELECT
      strftime('%Y-%m', date) as month,
      ROUND(CAST(SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100, 1) as rate,
      COUNT(*) as total
    FROM attendance
    WHERE user_id = ?
    GROUP BY month
    ORDER BY month
  `).all(studentUserId);

  // Calculate trend direction
  const scoreTrend = calculateTrendDirection(monthlyScores.map(m => m.avg_score));
  const attendanceTrend = calculateTrendDirection(monthlyAttendance.map(m => m.rate));

  return {
    scores: monthlyScores,
    attendance: monthlyAttendance,
    trends: {
      scores: scoreTrend,
      attendance: attendanceTrend,
    },
  };
}

/**
 * Calculate trend direction from a series of values.
 * Returns: 'improving', 'declining', 'stable', or 'insufficient_data'
 */
function calculateTrendDirection(values) {
  if (values.length < 2) return 'insufficient_data';

  // Simple linear regression slope
  const n = values.length;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((s, v) => s + v, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * (values[i] - yMean);
    denominator += (i - xMean) ** 2;
  }

  const slope = denominator !== 0 ? numerator / denominator : 0;

  if (slope > 2) return 'improving';
  if (slope < -2) return 'declining';
  return 'stable';
}

// ─── AI Intervention Suggestions ────────────────────────────────────────────────

const INTERVENTION_PROMPT = `You are a school counselor AI. Given a student's risk profile, suggest 2-3 specific, actionable interventions.

Rules:
- Be specific and practical (not generic advice)
- Consider the student's specific risk factors
- Suggest actions for teachers, parents, and the student
- Keep suggestions brief (1-2 sentences each)
- Output clean HTML using <ul><li> format`;

/**
 * Generate AI-powered intervention suggestions for an at-risk student.
 */
async function generateInterventions(studentData) {
  const { name, riskScore, riskLevel, factors, metrics } = studentData;

  if (!process.env.ANTHROPIC_API_KEY) {
    return generateFallbackInterventions(studentData);
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const factorList = factors.map(f => `- ${f.type}: ${f.value}% (threshold: ${f.threshold}%)`).join('\n');

    const prompt = `Student: ${name}
Risk Score: ${riskScore}/100 (${riskLevel})
Metrics:
- Attendance: ${metrics.attendanceRate}%
- GPA: ${metrics.gpa}
- Assignment Completion: ${metrics.assignmentCompletion}%
- Quiz Average: ${metrics.quizAvg}%
- Missing Assignments: ${metrics.missingAssignments}

Risk Factors:
${factorList || '- No critical factors'}

Suggest specific interventions for this student.`;

    const response = await client.messages.create({
      model: CONFIG.model,
      max_tokens: CONFIG.maxTokens,
      system: INTERVENTION_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content.find(b => b.type === 'text');
    return text?.text || generateFallbackInterventions(studentData);
  } catch (err) {
    console.error('[Analytics] AI intervention failed:', err.message);
    return generateFallbackInterventions(studentData);
  }
}

/**
 * Template-based fallback interventions.
 */
function generateFallbackInterventions(data) {
  const { name, factors, metrics } = data;
  const interventions = [];

  if (metrics.attendanceRate < 80) {
    interventions.push(`<li><strong>Attendance:</strong> Schedule a parent meeting to discuss ${name}'s attendance pattern (${metrics.attendanceRate}%). Identify barriers to attendance.</li>`);
  }

  if (metrics.gpa < 2.5) {
    interventions.push(`<li><strong>Academic Support:</strong> Assign a peer tutor or recommend after-school study sessions for subjects where ${name} is struggling.</li>`);
  }

  if (metrics.assignmentCompletion < 70) {
    interventions.push(`<li><strong>Assignment Tracking:</strong> Implement a daily check-in system to monitor homework completion. Consider breaking large assignments into smaller tasks.</li>`);
  }

  if (metrics.quizAvg < 60) {
    interventions.push(`<li><strong>Quiz Preparation:</strong> Provide study guides and practice quizzes before assessments. Consider alternative assessment methods.</li>`);
  }

  if (metrics.missingAssignments >= 3) {
    interventions.push(`<li><strong>Missing Work:</strong> Create a recovery plan for ${metrics.missingAssignments} missing assignments. Set clear deadlines with teacher support.</li>`);
  }

  if (interventions.length === 0) {
    interventions.push(`<li><strong>Maintenance:</strong> Continue current support level. Schedule monthly check-ins to monitor progress.</li>`);
  }

  return `<ul>${interventions.join('')}</ul>`;
}

// ─── Alert System ───────────────────────────────────────────────────────────────

/**
 * Check all students and return those who crossed risk thresholds.
 * Used for alert notifications.
 */
function checkAlerts() {
  const atRisk = getAtRiskStudents({ minScore: 50 });

  return atRisk.map(student => ({
    userId: student.userId,
    name: student.name,
    grade: student.grade,
    riskScore: student.riskScore,
    riskLevel: student.riskLevel,
    primaryFactor: student.factors[0]?.type || 'general',
    message: `${student.name} is at ${student.riskLevel} risk (score: ${student.riskScore}/100). Primary concern: ${student.factors[0]?.type || 'multiple factors'}.`,
  }));
}

// ─── Dashboard Stats ────────────────────────────────────────────────────────────

/**
 * Get overall analytics stats for the school dashboard.
 */
function getAnalyticsStats() {
  const db = getDb();

  const totalStudents = db.prepare(
    'SELECT COUNT(*) as count FROM students WHERE status = ?'
  ).get('active').count;

  // Get all at-risk students
  const allAtRisk = getAtRiskStudents({ minScore: 30 });

  const critical = allAtRisk.filter(s => s.riskLevel === 'critical').length;
  const high = allAtRisk.filter(s => s.riskLevel === 'high').length;
  const medium = allAtRisk.filter(s => s.riskLevel === 'medium').length;
  const low = totalStudents - critical - high - medium;

  // Average risk score
  const avgRisk = allAtRisk.length > 0
    ? Math.round(allAtRisk.reduce((s, r) => s + r.riskScore, 0) / allAtRisk.length)
    : 0;

  // Top risk factors across all students
  const factorCounts = {};
  allAtRisk.forEach(s => {
    s.factors.forEach(f => {
      factorCounts[f.type] = (factorCounts[f.type] || 0) + 1;
    });
  });

  const topFactors = Object.entries(factorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([type, count]) => ({ type, count }));

  return {
    totalStudents,
    atRiskCount: allAtRisk.length,
    distribution: { critical, high, medium, low },
    avgRiskScore: avgRisk,
    topRiskFactors: topFactors,
  };
}

module.exports = {
  calculateRiskScore,
  getAtRiskStudents,
  analyzeTrend,
  generateInterventions,
  checkAlerts,
  getAnalyticsStats,
};
