#!/usr/bin/env node
/**
 * Bulk seed script — adds 50-100 records to each table
 * Run: node seed-bulk.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'school.db')
  : path.join(__dirname, 'school.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Ensure schema exists
const { initDatabase } = require('./db');
initDatabase();

const salt = bcrypt.genSaltSync(10);
const password = bcrypt.hashSync('password123', salt);

// ── Helpers ──────────────────────────────────────────────────────────────────

const maleNames = ['Aung Aung', 'Kyaw Kyaw', 'Zaw Zaw', 'Min Min', 'Htun Htun', 'Soe Soe', 'Naing Naing', 'Win Win', 'Myint Myint', 'Than Than', 'Hein Hein', 'Lin Lin', 'Phyo Phyo', 'Kaung Kaung', 'Thet Thet', 'Ye Ye', 'Nay Nay', 'Pyae Pyae', 'Swan Swan', 'Set Set'];
const femaleNames = ['Aye Aye', 'Nwe Nwe', 'Hla Hla', 'Mya Mya', 'Su Su', 'Khin Khin', 'Thin Thin', 'May May', 'Nu Nu', 'San San', 'Ei Ei', 'Wai Wai', 'Mon Mon', 'Nan Nan', 'Phyu Phyu', 'Chit Chit', 'Kay Kay', 'Lwin Lwin', 'Yee Yee', 'Pan Pan'];
const lastNames = ['Oo', 'Maung', 'Tun', 'Kyaw', 'Zaw', 'Soe', 'Naing', 'Win', 'Aye', 'Htwe', 'Thein', 'Min', 'Lwin', 'Sein', 'Myint'];
const cities = ['Yangon', 'Mandalay', 'Naypyidaw', 'Bago', 'Mawlamyine', 'Pathein', 'Meiktila', 'Myingyan', 'Sittwe', 'Taunggyi', 'Lashio', 'Monywa', 'Myitkyina', 'Dawei', 'Hpa-An'];
const streets = ['Main St', 'University Rd', 'Station Rd', 'Myoma Rd', 'Market St', 'Lake Ave', 'Pagoda Rd', 'River Rd', 'School St', 'Temple Rd'];
const subjects = ['Myanmar', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Computer Science'];
const qualifications = ['B.Ed', 'M.Ed', 'B.Sc', 'M.Sc', 'BA', 'MA', 'Ph.D', 'B.Sc (Hons)', 'M.Sc (Hons)'];
const specializations = ['Myanmar Literature', 'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Economics', 'Computer Science'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(startYear, endYear) {
  const y = randInt(startYear, endYear);
  const m = randInt(1, 12).toString().padStart(2, '0');
  const d = randInt(1, 28).toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function uniqueEmail(base, index) {
  return base.replace('@', `${index}@`);
}

// ── Get existing IDs ────────────────────────────────────────────────────────

const existingGrades = db.prepare('SELECT id, code FROM grades').all();
const existingSubjects = db.prepare('SELECT id, code FROM subjects').all();
const existingLevels = db.prepare('SELECT id, code FROM education_levels').all();
const existingUsers = db.prepare('SELECT id, role FROM users').all();
const existingClasses = db.prepare('SELECT id FROM classes').all();
const existingCourses = db.prepare('SELECT id FROM courses').all();
const existingAY = db.prepare('SELECT id FROM academic_years LIMIT 1').get();

const gradeIds = existingGrades.map(g => g.id);
const subjectIds = existingSubjects.map(s => s.id);
const userIds = existingUsers.map(u => u.id);

console.log('Existing data loaded. Starting bulk seed...');

// ── 1. USERS (teachers + students + parents) ────────────────────────────────

const insertUser = db.prepare('INSERT INTO users (email, password, name, role, phone) VALUES (?, ?, ?, ?, ?)');

const newTeachers = [];
const newStudents = [];
const newParents = [];

// Create 20 more teachers
for (let i = 0; i < 20; i++) {
  const name = pick(maleNames) + ' ' + pick(lastNames);
  const email = `teacher${100 + i}@school.com`;
  try {
    const r = insertUser.run(email, password, name, 'teacher', `09${randInt(10000000, 99999999)}`);
    newTeachers.push({ id: r.lastInsertRowid, name, email });
  } catch {}
}

// Create 70 more students
for (let i = 0; i < 70; i++) {
  const isMale = Math.random() > 0.5;
  const name = isMale ? pick(maleNames) : pick(femaleNames);
  const email = `student${100 + i}@school.com`;
  try {
    const r = insertUser.run(email, password, name, 'student', `09${randInt(10000000, 99999999)}`);
    newStudents.push({ id: r.lastInsertRowid, name, email });
  } catch {}
}

// Create 20 more parents
for (let i = 0; i < 20; i++) {
  const name = pick(maleNames) + ' (Parent)';
  const email = `parent${100 + i}@school.com`;
  try {
    const r = insertUser.run(email, password, name, 'parent', `09${randInt(10000000, 99999999)}`);
    newParents.push({ id: r.lastInsertRowid, name, email });
  } catch {}
}

console.log(`Users: ${newTeachers.length} teachers, ${newStudents.length} students, ${newParents.length} parents created`);

// ── 2. TEACHER PROFILES ─────────────────────────────────────────────────────

const insertTeacher = db.prepare(`
  INSERT INTO teachers (user_id, teacher_id, phone, qualification, specialization, hire_date, status)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const newTeacherProfiles = [];
for (let i = 0; i < newTeachers.length; i++) {
  const t = newTeachers[i];
  const tId = `TCH-2026-${(100 + i).toString().padStart(3, '0')}`;
  try {
    const r = insertTeacher.run(t.id, tId, t.phone || `09${randInt(10000000, 99999999)}`, pick(qualifications), pick(specializations), randDate(2018, 2025), 'active');
    newTeacherProfiles.push({ id: r.lastInsertRowid, userId: t.id });
  } catch {}
}

console.log(`Teacher profiles: ${newTeacherProfiles.length} created`);

// ── 3. STUDENT PROFILES ─────────────────────────────────────────────────────

const insertStudent = db.prepare(`
  INSERT INTO students (user_id, student_id, grade_id, section, date_of_birth, gender, phone, address, parent_name, parent_phone, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const sections = ['A', 'B', 'C', 'D'];
const newStudentProfiles = [];
for (let i = 0; i < newStudents.length; i++) {
  const s = newStudents[i];
  const sId = `STU-2026-${(100 + i).toString().padStart(3, '0')}`;
  const gender = Math.random() > 0.5 ? 'male' : 'female';
  const gradeId = pick(gradeIds);
  const section = pick(sections);
  const city = pick(cities);
  const street = pick(streets);
  try {
    const r = insertStudent.run(s.id, sId, gradeId, section, randDate(2008, 2014), gender, `09${randInt(10000000, 99999999)}`, `${randInt(1, 999)} ${street}, ${city}`, pick(maleNames) + ' ' + pick(lastNames), `09${randInt(10000000, 99999999)}`, 'active');
    newStudentProfiles.push({ id: r.lastInsertRowid, userId: s.id, gradeId });
  } catch {}
}

console.log(`Student profiles: ${newStudentProfiles.length} created`);

// ── 4. PARENT-STUDENT LINKS ─────────────────────────────────────────────────

const insertPS = db.prepare('INSERT OR IGNORE INTO parent_students (parent_id, student_id, relationship) VALUES (?, ?, ?)');
for (let i = 0; i < newParents.length; i++) {
  if (i < newStudents.length) {
    try { insertPS.run(newParents[i].id, newStudents[i].id, 'parent'); } catch {}
  }
}

// ── 5. CLASSES ──────────────────────────────────────────────────────────────

const insertClass = db.prepare('INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)');
const newClasses = [];
const classNames = [
  'Mathematics 101', 'English Literature', 'Science Lab', 'Myanmar History',
  'Physics Advanced', 'Chemistry Basics', 'Biology Lab', 'Geography 101',
  'Economics Principles', 'Computer Science', 'Art Studio', 'Physical Education',
  'Myanmar Literature', 'English Grammar', 'Math Advanced', 'Science General',
  'Social Studies', 'Moral Education', 'Music Class', 'Life Skills'
];

const allTeachers = db.prepare("SELECT u.id, u.name FROM users u WHERE u.role = 'teacher'").all();
for (let i = 0; i < 50; i++) {
  const name = classNames[i % classNames.length] + (i >= classNames.length ? ` ${Math.floor(i / classNames.length) + 1}` : '');
  const teacherId = pick(allTeachers).id;
  const days = ['Mon/Wed/Fri', 'Tue/Thu', 'Mon/Thu', 'Wed/Fri', 'Mon/Wed', 'Tue/Fri'];
  const times = ['08:00-09:00', '09:00-10:00', '10:00-11:00', '11:00-12:00', '13:00-14:00', '14:00-15:00', '15:00-16:00'];
  try {
    const r = insertClass.run(name, `Description for ${name}`, teacherId, pick(days) + ' ' + pick(times), `Room ${randInt(101, 399)}`);
    newClasses.push({ id: r.lastInsertRowid });
  } catch {}
}

console.log(`Classes: ${newClasses.length} created`);

// ── 6. ENROLLMENTS ──────────────────────────────────────────────────────────

const insertEnroll = db.prepare('INSERT OR IGNORE INTO enrollments (class_id, student_id) VALUES (?, ?)');
const allClasses = db.prepare('SELECT id FROM classes').all();
let enrollCount = 0;
for (const student of newStudents) {
  const numClasses = randInt(2, 5);
  const shuffled = [...allClasses].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numClasses, shuffled.length); i++) {
    try { insertEnroll.run(shuffled[i].id, student.id); enrollCount++; } catch {}
  }
}
console.log(`Enrollments: ${enrollCount} created`);

// ── 7. COURSES ──────────────────────────────────────────────────────────────

const insertCourse = db.prepare('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)');
const newCourses = [];
for (let i = 0; i < 60; i++) {
  const classId = pick(allClasses).id;
  const subj = pick(existingSubjects);
  const title = `${subj.code} Course ${i + 1}`;
  try {
    const r = insertCourse.run(classId, subj.id, title, `Course covering ${subj.code} fundamentals`);
    newCourses.push({ id: r.lastInsertRowid });
  } catch {}
}
console.log(`Courses: ${newCourses.length} created`);

// ── 8. LESSONS ──────────────────────────────────────────────────────────────

const insertLesson = db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order, duration_minutes) VALUES (?, ?, ?, ?, ?)');
const lessonTitles = ['Introduction', 'Fundamentals', 'Advanced Topics', 'Practice Session', 'Review', 'Assessment', 'Workshop', 'Lab Session', 'Project Work', 'Presentation'];
const allCourses = db.prepare('SELECT id FROM courses').all();
let lessonCount = 0;
for (const course of allCourses) {
  const numLessons = randInt(3, 6);
  for (let i = 0; i < numLessons; i++) {
    try {
      insertLesson.run(course.id, `${lessonTitles[i % lessonTitles.length]} ${i + 1}`, `Content for lesson ${i + 1}`, i + 1, randInt(30, 90));
      lessonCount++;
    } catch {}
  }
}
console.log(`Lessons: ${lessonCount} created`);

// ── 9. RESOURCES ────────────────────────────────────────────────────────────

const insertResource = db.prepare('INSERT INTO resources (course_id, title, type, url, description, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)');
const resourceTypes = ['pdf', 'video', 'audio', 'image', 'link', 'document'];
const resourceTitles = ['Textbook Chapter', 'Video Lecture', 'Audio Recording', 'Diagram', 'Reference Link', 'Study Guide', 'Worksheet', 'Presentation Slides', 'Lab Manual', 'Practice Problems'];
let resourceCount = 0;
for (const course of allCourses) {
  const numResources = randInt(1, 3);
  for (let i = 0; i < numResources; i++) {
    try {
      insertResource.run(course.id, `${pick(resourceTitles)} ${i + 1}`, pick(resourceTypes), `https://example.com/resource-${randInt(1000, 9999)}`, `Resource for course`, pick(allTeachers).id);
      resourceCount++;
    } catch {}
  }
}
console.log(`Resources: ${resourceCount} created`);

// ── 10. ASSIGNMENTS ─────────────────────────────────────────────────────────

const insertAssignment = db.prepare('INSERT INTO assignments (course_id, title, description, due_date, max_score, allow_late, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
const assignmentTitles = ['Homework', 'Essay', 'Lab Report', 'Project', 'Research Paper', 'Presentation', 'Worksheet', 'Case Study', 'Problem Set', 'Portfolio'];
const newAssignments = [];
for (let i = 0; i < 80; i++) {
  const course = pick(allCourses);
  const title = `${pick(assignmentTitles)} ${i + 1}`;
  try {
    const r = insertAssignment.run(course.id, title, `Complete the ${title.toLowerCase()} as instructed.`, randDate(2026, 2027), randInt(50, 100), Math.random() > 0.7 ? 1 : 0, pick(allTeachers).id);
    newAssignments.push({ id: r.lastInsertRowid });
  } catch {}
}
console.log(`Assignments: ${newAssignments.length} created`);

// ── 11. SUBMISSIONS ─────────────────────────────────────────────────────────

const insertSubmission = db.prepare('INSERT OR IGNORE INTO submissions (assignment_id, student_id, content, score, feedback, status, graded_at, graded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
const statuses = ['submitted', 'graded', 'late'];
let subCount = 0;
for (const assignment of newAssignments) {
  const numSubs = randInt(3, 10);
  const shuffledStudents = [...newStudents].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numSubs, shuffledStudents.length); i++) {
    const status = pick(statuses);
    const score = status === 'graded' ? randInt(40, 100) : null;
    const feedback = status === 'graded' ? pick(['Good work!', 'Needs improvement.', 'Excellent!', 'Well done.', 'See comments.', 'Keep it up.']) : null;
    const gradedAt = status === 'graded' ? '2026-07-15' : null;
    const gradedBy = status === 'graded' ? pick(allTeachers).id : null;
    try {
      insertSubmission.run(assignment.id, shuffledStudents[i].id, `Submission for assignment`, score, feedback, status, gradedAt, gradedBy);
      subCount++;
    } catch {}
  }
}
console.log(`Submissions: ${subCount} created`);

// ── 12. QUIZZES ─────────────────────────────────────────────────────────────

const insertQuiz = db.prepare('INSERT INTO quizzes (course_id, title, description, time_limit_minutes, max_score, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
const quizTitles = ['Chapter Quiz', 'Midterm Quiz', 'Pop Quiz', 'Practice Quiz', 'Review Quiz', 'Unit Test', 'Assessment', 'Quick Check'];
const newQuizzes = [];
for (let i = 0; i < 60; i++) {
  const course = pick(allCourses);
  try {
    const r = insertQuiz.run(course.id, `${pick(quizTitles)} ${i + 1}`, `Quiz for course`, randInt(15, 60), randInt(20, 100), randDate(2026, 2027), pick(allTeachers).id);
    newQuizzes.push({ id: r.lastInsertRowid });
  } catch {}
}
console.log(`Quizzes: ${newQuizzes.length} created`);

// ── 13. QUIZ QUESTIONS ──────────────────────────────────────────────────────

const insertQQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
const qTypes = ['mcq', 'true_false', 'fill_blank'];
let qqCount = 0;
for (const quiz of newQuizzes) {
  const numQ = randInt(3, 6);
  for (let i = 0; i < numQ; i++) {
    const qType = pick(qTypes);
    let options, correctAnswer;
    if (qType === 'mcq') {
      options = JSON.stringify(['Option A', 'Option B', 'Option C', 'Option D']);
      correctAnswer = 'Option A';
    } else if (qType === 'true_false') {
      options = JSON.stringify(['True', 'False']);
      correctAnswer = 'True';
    } else {
      options = null;
      correctAnswer = 'answer';
    }
    try {
      insertQQ.run(quiz.id, `Question ${i + 1} for quiz?`, qType, options, correctAnswer, randInt(5, 20), i + 1);
      qqCount++;
    } catch {}
  }
}
console.log(`Quiz questions: ${qqCount} created`);

// ── 14. QUIZ ATTEMPTS ───────────────────────────────────────────────────────

const insertQA = db.prepare('INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)');
let qaCount = 0;
for (const quiz of newQuizzes) {
  const numAttempts = randInt(3, 8);
  const shuffledStudents = [...newStudents].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numAttempts, shuffledStudents.length); i++) {
    try {
      insertQA.run(quiz.id, shuffledStudents[i].id, JSON.stringify({}), randInt(10, 100), '2026-07-01T09:00:00', '2026-07-01T09:30:00');
      qaCount++;
    } catch {}
  }
}
console.log(`Quiz attempts: ${qaCount} created`);

// ── 15. GRADEBOOK ───────────────────────────────────────────────────────────

const insertGB = db.prepare('INSERT OR IGNORE INTO gradebook (student_id, course_id, assignment_score, quiz_score, exam_score, final_grade, gpa) VALUES (?, ?, ?, ?, ?, ?, ?)');
const gradeLetters = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const gpaMap = { 'A': 4.0, 'A-': 3.7, 'B+': 3.3, 'B': 3.0, 'B-': 2.7, 'C+': 2.3, 'C': 2.0, 'C-': 1.7, 'D': 1.0, 'F': 0.0 };
let gbCount = 0;
for (const student of newStudents) {
  const numCourses = randInt(2, 5);
  const shuffledCourses = [...allCourses].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numCourses, shuffledCourses.length); i++) {
    const grade = pick(gradeLetters);
    const asg = randInt(50, 100);
    const quiz = randInt(50, 100);
    const exam = randInt(40, 100);
    try {
      insertGB.run(student.id, shuffledCourses[i].id, asg, quiz, exam, grade, gpaMap[grade]);
      gbCount++;
    } catch {}
  }
}
console.log(`Gradebook: ${gbCount} created`);

// ── 16. ATTENDANCE ──────────────────────────────────────────────────────────

const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (user_id, class_id, date, status, note, marked_by) VALUES (?, ?, ?, ?, ?, ?)');
const attStatuses = ['present', 'present', 'present', 'present', 'absent', 'late', 'leave'];
const dates = [];
for (let d = 1; d <= 28; d++) {
  dates.push(`2026-06-${d.toString().padStart(2, '0')}`);
}
let attCount = 0;
for (const student of newStudents.slice(0, 40)) {
  const numClasses = randInt(2, 4);
  const shuffledClasses = [...allClasses].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(numClasses, shuffledClasses.length); i++) {
    for (const date of dates.slice(0, 15)) {
      try {
        insertAtt.run(student.id, shuffledClasses[i].id, date, pick(attStatuses), null, pick(allTeachers).id);
        attCount++;
      } catch {}
    }
  }
}
console.log(`Attendance: ${attCount} created`);

// ── 17. TEACHER ATTENDANCE ──────────────────────────────────────────────────

const insertTA = db.prepare('INSERT OR IGNORE INTO teacher_attendance (teacher_id, date, check_in, check_out, status) VALUES (?, ?, ?, ?, ?)');
let taCount = 0;
for (const teacher of allTeachers) {
  for (const date of dates.slice(0, 20)) {
    try {
      insertTA.run(teacher.id, date, `08:${randInt(0, 30).toString().padStart(2, '0')}`, `16:${randInt(0, 30).toString().padStart(2, '0')}`, pick(['present', 'present', 'present', 'late']));
      taCount++;
    } catch {}
  }
}
console.log(`Teacher attendance: ${taCount} created`);

// ── 18. TIMETABLE ───────────────────────────────────────────────────────────

const insertTT = db.prepare('INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)');
const timeSlots = [['08:00', '09:00'], ['09:00', '10:00'], ['10:00', '11:00'], ['11:00', '12:00'], ['13:00', '14:00'], ['14:00', '15:00'], ['15:00', '16:00']];
let ttCount = 0;
for (const cls of allClasses.slice(0, 30)) {
  for (let day = 0; day < 5; day++) {
    const numPeriods = randInt(1, 3);
    const usedSlots = new Set();
    for (let p = 0; p < numPeriods; p++) {
      let slot;
      do { slot = randInt(0, timeSlots.length - 1); } while (usedSlots.has(slot));
      usedSlots.add(slot);
      try {
        insertTT.run(cls.id, pick(subjectIds), pick(allTeachers).id, day, timeSlots[slot][0], timeSlots[slot][1], `Room ${randInt(101, 399)}`);
        ttCount++;
      } catch {}
    }
  }
}
console.log(`Timetable: ${ttCount} created`);

// ── 19. ANNOUNCEMENTS ───────────────────────────────────────────────────────

const insertAnn = db.prepare('INSERT INTO announcements (title, content, author_id, grade_id, class_id) VALUES (?, ?, ?, ?, ?)');
const annTitles = [
  'School Reopening Notice', 'Exam Schedule Released', 'Sports Day Registration',
  'Parent-Teacher Meeting', 'Library Hours Extended', 'Science Fair Announcement',
  'Holiday Notice', 'Schship Applications Open', 'Cultural Festival',
  'Health Checkup Camp', 'Field Trip Permission', 'New Club Registration',
  'Annual Day Celebration', 'Book Fair Notice', 'Uniform Update',
  'Bus Schedule Change', 'Cafeteria Menu Update', 'IT Lab Opening',
  'Music Competition', 'Art Exhibition', 'Debate Competition',
  'Math Olympiad', 'English Speaking Contest', 'Environmental Day',
  'Teacher Appreciation Week', 'Student Council Elections', 'Career Guidance Session',
  'University Fair', 'Coding Workshop', 'Photography Contest'
];
const annContents = [
  'We are pleased to announce the following important update for all students and staff.',
  'Please take note of the following information. Details are available at the admin office.',
  'All students are requested to participate. Registration forms are available at the office.',
  'We invite all parents and guardians to attend this important event.',
  'Please check the updated schedule and plan accordingly.',
  'Students interested in participating should register by the deadline.',
  'This is to inform all students and staff about the upcoming changes.',
  'Applications are now being accepted. Please submit your forms before the deadline.',
  'We are excited to share this news with our school community.',
  'All students and parents are requested to take note of this important announcement.'
];
let annCount = 0;
for (let i = 0; i < 80; i++) {
  const gradeId = Math.random() > 0.4 ? pick(gradeIds) : null;
  const classId = Math.random() > 0.5 ? pick(allClasses).id : null;
  const author = pick(allTeachers);
  try {
    insertAnn.run(pick(annTitles), pick(annContents), author.id, gradeId, classId);
    annCount++;
  } catch {}
}
console.log(`Announcements: ${annCount} created`);

// ── 20. CONTACTS ────────────────────────────────────────────────────────────

const insertContact = db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)');
const contactSubjects = ['Admission Inquiry', 'Fee Structure', 'Transfer Certificate', 'General Inquiry', 'Complaint', 'Suggestion', 'Feedback', 'Partnership', 'Volunteering', 'Donation'];
let contactCount = 0;
for (let i = 0; i < 60; i++) {
  try {
    insertContact.run(pick(maleNames) + ' ' + pick(lastNames), `contact${i}@example.com`, pick(contactSubjects), `I would like to inquire about ${pick(contactSubjects.toLowerCase().split(' '))}. Please contact me at your earliest convenience.`);
    contactCount++;
  } catch {}
}
console.log(`Contacts: ${contactCount} created`);

// ── 21. CHAT MESSAGES ───────────────────────────────────────────────────────

const insertChat = db.prepare('INSERT INTO chat_messages (user_id, user_name, user_role, message, reply) VALUES (?, ?, ?, ?, ?)');
const chatQuestions = [
  ['What time is the math quiz?', 'The math quiz is scheduled for Wednesday at 9:00 AM.'],
  ['How do I reset my password?', 'Please contact the admin office to reset your password.'],
  ['When is the parent-teacher meeting?', 'The parent-teacher meeting is next Friday from 2-5 PM.'],
  ['What classes are available?', 'We offer Mathematics, English, Science, and more. Check the Classes page.'],
  ['How do I enroll in a class?', 'Visit the Classes page and contact admin for enrollment.'],
  ['What is the school schedule?', 'School runs Monday to Friday, 8:00 AM to 4:00 PM.'],
  ['Where is the library?', 'The library is on the 2nd floor, Room 201.'],
  ['How do I submit homework?', 'Go to Assignments page and click Submit on the relevant assignment.'],
  ['What is my GPA?', 'Check the Gradebook page for your current GPA and grades.'],
  ['When is the science fair?', 'The science fair is scheduled for next month. Registration is open now.'],
];
let chatCount = 0;
for (let i = 0; i < 80; i++) {
  const user = pick(newStudents.length ? newStudents : newTeachers);
  const [q, a] = pick(chatQuestions);
  try {
    insertChat.run(user.id, user.name, user.role || 'student', q, a);
    chatCount++;
  } catch {}
}
console.log(`Chat messages: ${chatCount} created`);

// ── 22. MESSAGES ────────────────────────────────────────────────────────────

const insertMsg = db.prepare('INSERT INTO messages (sender_id, receiver_id, subject, body, is_read) VALUES (?, ?, ?, ?, ?)');
const msgSubjects = ['Question about homework', 'Meeting request', 'Grade inquiry', 'Schedule change', 'Thank you', 'Feedback', 'Urgent notice', 'Project discussion', 'Exam preparation', 'Club meeting'];
const msgBodies = [
  'I wanted to ask about the recent assignment.',
  'Could we schedule a meeting to discuss my progress?',
  'I have a question about my recent grade.',
  'Please let me know about any schedule changes.',
  'Thank you for your help with the project.',
  'I would like to share some feedback.',
  'This is regarding the upcoming exam.',
  'Can we discuss the group project?',
  'I need help with the coursework.',
  'When is the next club meeting?',
];
let msgCount = 0;
const allUsers = db.prepare('SELECT id, role FROM users').all();
for (let i = 0; i < 80; i++) {
  const sender = pick(allUsers);
  const receiver = pick(allUsers.filter(u => u.id !== sender.id));
  try {
    insertMsg.run(sender.id, receiver.id, pick(msgSubjects), pick(msgBodies), Math.random() > 0.5 ? 1 : 0);
    msgCount++;
  } catch {}
}
console.log(`Messages: ${msgCount} created`);

// ── 23. NOTIFICATIONS ───────────────────────────────────────────────────────

const insertNotif = db.prepare('INSERT INTO notifications (user_id, type, title, message, is_read, link) VALUES (?, ?, ?, ?, ?, ?)');
const notifTypes = ['announcement', 'grade', 'submission', 'attendance', 'message', 'alert'];
const notifTitles = ['New Announcement', 'Grade Posted', 'Submission Received', 'Attendance Alert', 'New Message', 'System Alert'];
const notifMessages = [
  'A new announcement has been posted.',
  'Your grade for the assignment has been posted.',
  'A new submission has been received.',
  'Please check your attendance record.',
  'You have received a new message.',
  'Please review the system notification.',
];
let notifCount = 0;
for (let i = 0; i < 100; i++) {
  const user = pick(allUsers);
  const type = pick(notifTypes);
  try {
    insertNotif.run(user.id, type, pick(notifTitles), pick(notifMessages), Math.random() > 0.6 ? 1 : 0, '/dashboard');
    notifCount++;
  } catch {}
}
console.log(`Notifications: ${notifCount} created`);

// ── 24. FEE STRUCTURES ──────────────────────────────────────────────────────

const insertFee = db.prepare('INSERT INTO fee_structures (grade_id, fee_type, amount, academic_year_id) VALUES (?, ?, ?, ?)');
const feeTypes = ['Tuition', 'Lab Fee', 'Library Fee', 'Sports Fee', 'Transport', 'Examination', 'Activity', 'Computer Lab'];
let feeCount = 0;
const ayId = existingAY?.id;
if (ayId) {
  for (const gradeId of gradeIds) {
    for (const feeType of feeTypes.slice(0, randInt(3, 6))) {
      try {
        insertFee.run(gradeId, feeType, randInt(10000, 500000), ayId);
        feeCount++;
      } catch {}
    }
  }
}
console.log(`Fee structures: ${feeCount} created`);

// ── 25. INVOICES ────────────────────────────────────────────────────────────

const insertInvoice = db.prepare('INSERT INTO invoices (student_id, fee_structure_id, amount, status, due_date) VALUES (?, ?, ?, ?, ?)');
const invStatuses = ['pending', 'paid', 'overdue'];
const allFees = db.prepare('SELECT id FROM fee_structures').all();
let invCount = 0;
for (const student of newStudents.slice(0, 50)) {
  const numInvoices = randInt(1, 3);
  for (let i = 0; i < numInvoices; i++) {
    try {
      insertInvoice.run(student.id, pick(allFees).id, randInt(20000, 200000), pick(invStatuses), randDate(2026, 2027));
      invCount++;
    } catch {}
  }
}
console.log(`Invoices: ${invCount} created`);

// ── 26. PAYMENTS ────────────────────────────────────────────────────────────

const insertPayment = db.prepare('INSERT INTO payments (invoice_id, amount, payment_method, reference) VALUES (?, ?, ?, ?)');
const paidInvoices = db.prepare("SELECT id, amount FROM invoices WHERE status = 'paid'").all();
let payCount = 0;
for (const inv of paidInvoices) {
  try {
    insertPayment.run(inv.id, inv.amount, pick(['cash', 'bank_transfer', 'mobile_pay']), `PAY-${randInt(10000, 99999)}`);
    payCount++;
  } catch {}
}
console.log(`Payments: ${payCount} created`);

// ── 27. CERTIFICATES ────────────────────────────────────────────────────────

const insertCert = db.prepare('INSERT INTO certificates (student_id, type, data, issued_by, serial_number) VALUES (?, ?, ?, ?, ?)');
const certTypes = ['completion', 'achievement', 'transcript', 'graduation'];
let certCount = 0;
for (let i = 0; i < 60; i++) {
  const student = pick(newStudents);
  const type = pick(certTypes);
  const serial = `${type.charAt(0).toUpperCase()}-2026-${(1000 + i).toString().padStart(4, '0')}`;
  try {
    insertCert.run(student.id, type, JSON.stringify({ description: `Certificate of ${type}`, academic_year: '2026-2027' }), pick(allTeachers).id, serial);
    certCount++;
  } catch {}
}
console.log(`Certificates: ${certCount} created`);

// ── Done ────────────────────────────────────────────────────────────────────

db.close();
console.log('\n✅ Bulk seed complete!');
