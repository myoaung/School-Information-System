const { body, param, query, validationResult } = require('express-validator');

// Shared handler for validation errors
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', details: errors.array().map(e => e.msg) });
  }
  next();
};

// ── Auth ──
const registerRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('role').optional().isIn(['student', 'parent']).withMessage('Invalid role'),
  handleValidation,
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation,
];

// ── Students / Teachers ──
const createStudentRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('grade_id').optional().isInt({ min: 1 }).withMessage('Invalid grade'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender'),
  handleValidation,
];

const createTeacherRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidation,
];

// ── Announcements ──
const announcementRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('content').trim().isLength({ min: 1, max: 10000 }).withMessage('Content is required (max 10000 chars)'),
  handleValidation,
];

// ── Messages ──
const messageRules = [
  body('receiver_id').isInt({ min: 1 }).withMessage('Valid receiver is required'),
  body('body').trim().isLength({ min: 1, max: 5000 }).withMessage('Message body is required (max 5000 chars)'),
  body('subject').optional().trim().isLength({ max: 200 }).withMessage('Subject max 200 chars'),
  handleValidation,
];

// ── Finance ──
const invoiceRules = [
  body('student_id').isInt({ min: 1 }).withMessage('Valid student is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('due_date').optional().isISO8601().withMessage('Invalid date format'),
  handleValidation,
];

const paymentRules = [
  body('invoice_id').isInt({ min: 1 }).withMessage('Valid invoice is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be positive'),
  body('payment_method').optional().isIn(['cash', 'bank_transfer', 'mobile_pay']).withMessage('Invalid payment method'),
  handleValidation,
];

// ── Attendance ──
const markAttendanceRules = [
  body('class_id').isInt({ min: 1 }).withMessage('Valid class is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('records').isArray({ min: 1 }).withMessage('Records array is required'),
  body('records.*.user_id').isInt({ min: 1 }).withMessage('Valid user_id is required'),
  body('records.*.status').isIn(['present', 'absent', 'late', 'leave']).withMessage('Invalid status'),
  handleValidation,
];

// ── Contact ──
const contactRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required'),
  body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message is required'),
  handleValidation,
];

// ── Courses ──
const courseRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)'),
  body('class_id').isInt({ min: 1 }).withMessage('Valid class is required'),
  body('subject_id').isInt({ min: 1 }).withMessage('Valid subject is required'),
  handleValidation,
];

const lessonRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  handleValidation,
];

// ── Assignments ──
const assignmentRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course is required'),
  body('max_score').optional().isInt({ min: 1, max: 10000 }).withMessage('Max score must be 1-10000'),
  handleValidation,
];

// ── Quizzes ──
const quizRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course is required'),
  handleValidation,
];

const quizQuestionRules = [
  body('question_text').trim().isLength({ min: 1, max: 2000 }).withMessage('Question text is required'),
  body('question_type').isIn(['mcq', 'true_false', 'fill_blank', 'essay']).withMessage('Invalid question type'),
  handleValidation,
];

// ── Classes ──
const classRules = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Class name is required'),
  handleValidation,
];

// ── Gradebook ──
const gradeRules = [
  body('student_id').isInt({ min: 1 }).withMessage('Valid student is required'),
  body('course_id').isInt({ min: 1 }).withMessage('Valid course is required'),
  handleValidation,
];

// ── Certificates ──
const certificateRules = [
  body('student_id').isInt({ min: 1 }).withMessage('Valid student is required'),
  body('type').isIn(['completion', 'achievement', 'transcript', 'graduation']).withMessage('Invalid certificate type'),
  handleValidation,
];

// ── Generic ID param ──
const idParamRules = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID'),
  handleValidation,
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  createStudentRules,
  createTeacherRules,
  announcementRules,
  messageRules,
  invoiceRules,
  paymentRules,
  markAttendanceRules,
  contactRules,
  courseRules,
  lessonRules,
  assignmentRules,
  quizRules,
  quizQuestionRules,
  classRules,
  gradeRules,
  certificateRules,
  idParamRules,
};
