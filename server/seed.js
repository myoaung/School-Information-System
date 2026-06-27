const bcrypt = require('bcryptjs');
const { getDb, initDatabase } = require('./db');

async function seed() {
  console.log('Initializing database...');
  initDatabase();

  const db = getDb();

  // Clear existing data (in dependency order)
  const tables = [
    'gradebook', 'quiz_attempts', 'quiz_questions', 'quizzes',
    'submissions', 'assignments', 'resources', 'lessons', 'courses',
    'attendance', 'timetable', 'enrollments', 'chat_messages', 'contacts',
    'announcements', 'classes', 'students', 'teachers', 'users',
    'semesters', 'academic_years'
  ];
  for (const t of tables) {
    db.exec(`DELETE FROM ${t}`);
  }

  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  // ── Users (8) ──
  console.log('Seeding users...');
  const insertUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  const userIds = {};
  const userData = [
    ['admin@school.com', 'Admin User', 'admin'],
    ['teacher@school.com', 'Ms. Johnson', 'teacher'],
    ['teacher2@school.com', 'Mr. Smith', 'teacher'],
    ['teacher3@school.com', 'Daw Nwe', 'teacher'],
    ['student@school.com', 'Aye Aye', 'student'],
    ['student2@school.com', 'John Doe', 'student'],
    ['student3@school.com', 'Mya Mya', 'student'],
    ['student4@school.com', 'Hla Hla', 'student']
  ];
  for (const [email, name, role] of userData) {
    userIds[email] = insertUser.run(email, password, name, role).lastInsertRowid;
  }

  // ── Teachers (3) ──
  console.log('Seeding teachers...');
  const insertTeacher = db.prepare('INSERT INTO teachers (user_id, teacher_id, phone, qualification, specialization, hire_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertTeacher.run(userIds['teacher@school.com'], 'TCH-2026-001', '09111111111', 'M.Ed Mathematics', 'Mathematics', '2020-06-01', 'active');
  insertTeacher.run(userIds['teacher2@school.com'], 'TCH-2026-002', '09222222222', 'B.Sc Physics', 'Physics', '2021-08-15', 'active');
  insertTeacher.run(userIds['teacher3@school.com'], 'TCH-2026-003', '09333333333', 'M.A Myanmar Literature', 'Myanmar', '2019-03-10', 'active');

  // ── Students (4) ──
  console.log('Seeding students...');
  const insertStudent = db.prepare('INSERT INTO students (user_id, student_id, grade_id, section, date_of_birth, gender, phone, address, parent_name, parent_phone, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const g10 = db.prepare('SELECT id FROM grades WHERE code = ?').get('G10')?.id;
  const g9 = db.prepare('SELECT id FROM grades WHERE code = ?').get('G9')?.id;
  insertStudent.run(userIds['student@school.com'], 'STU-2026-001', g10, 'A', '2010-03-15', 'female', '09123456789', '123 School Street', 'U Aye', '09987654321', 'active');
  insertStudent.run(userIds['student2@school.com'], 'STU-2026-002', g10, 'A', '2010-07-22', 'male', '09123456790', '456 Oak Avenue', 'U Hla', '09987654322', 'active');
  insertStudent.run(userIds['student3@school.com'], 'STU-2026-003', g10, 'B', '2010-11-08', 'female', '09123456791', '789 Pine Road', 'Daw Kyi', '09987654323', 'active');
  insertStudent.run(userIds['student4@school.com'], 'STU-2026-004', g9, 'A', '2011-01-30', 'male', '09123456792', '321 Elm Lane', 'U Tin', '09987654324', 'active');

  // ── Classes (4) ──
  console.log('Seeding classes...');
  const insertClass = db.prepare('INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)');
  const classIds = [];
  for (const c of [
    ['Mathematics 101', 'Introduction to algebra and geometry', userIds['teacher@school.com'], 'Mon/Wed/Fri 9:00-10:00', 'Room 101'],
    ['English Literature', 'Classic and modern literature analysis', userIds['teacher@school.com'], 'Tue/Thu 10:00-11:30', 'Room 205'],
    ['Science Lab', 'Hands-on experiments and scientific methods', userIds['teacher2@school.com'], 'Wed/Fri 14:00-15:30', 'Lab 301'],
    ['Myanmar History', 'History of Myanmar from ancient to modern times', userIds['teacher3@school.com'], 'Mon/Thu 11:00-12:00', 'Room 108']
  ]) {
    classIds.push(insertClass.run(...c).lastInsertRowid);
  }

  // ── Enrollments ──
  console.log('Seeding enrollments...');
  const insertEnroll = db.prepare('INSERT OR IGNORE INTO enrollments (class_id, student_id) VALUES (?, ?)');
  const sEmails = ['student@school.com', 'student2@school.com', 'student3@school.com', 'student4@school.com'];
  for (const s of sEmails) insertEnroll.run(classIds[0], userIds[s]);
  for (const s of sEmails.slice(0, 3)) insertEnroll.run(classIds[1], userIds[s]);
  for (const s of sEmails.slice(0, 2)) insertEnroll.run(classIds[2], userIds[s]);
  for (const s of [sEmails[2], sEmails[3]]) insertEnroll.run(classIds[3], userIds[s]);

  // ── Announcements (5) ──
  console.log('Seeding announcements...');
  const insertAnn = db.prepare('INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)');
  for (const a of [
    ['Welcome to the New School Year!', 'We are excited to welcome all students and staff to the 2026-2027 school year.', userIds['admin@school.com']],
    ['Mathematics Quiz Next Week', 'There will be a quiz on algebra fundamentals next Wednesday.', userIds['teacher@school.com']],
    ['Science Fair Registration Open', 'Registration for the annual science fair is now open. Submit your project proposals by the end of the month.', userIds['admin@school.com']],
    ['Library Hours Extended', 'The school library will now be open until 6 PM on weekdays.', userIds['admin@school.com']],
    ['Parent-Teacher Conference', 'Parent-teacher conferences will be held next Friday from 2-5 PM.', userIds['teacher@school.com']]
  ]) insertAnn.run(...a);

  // ── Academic Year & Semesters ──
  db.prepare('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)').run('2026-2027', '2026-06-01', '2027-03-31', 1);
  const ayId = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get()?.id;
  if (ayId) {
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run(ayId, 'Semester 1', '2026-06-01', '2026-10-31', 1);
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run(ayId, 'Semester 2', '2026-11-01', '2027-03-31', 0);
  }

  // ── Courses (4) ──
  console.log('Seeding courses...');
  const getSubjectId = (code) => db.prepare('SELECT id FROM subjects WHERE code = ?').get(code)?.id;
  const insertCourse = db.prepare('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)');
  const courseIds = [];
  for (const c of [
    [classIds[0], getSubjectId('MATH'), 'Algebra Fundamentals', 'Introduction to algebraic expressions and equations'],
    [classIds[1], getSubjectId('ENG'), 'Shakespeare & Poetry', 'Exploring Shakespearean sonnets and modern poetry'],
    [classIds[2], getSubjectId('SCI'), 'Chemistry Basics', 'Atoms, molecules, and chemical reactions'],
    [classIds[3], getSubjectId('MM'), 'Ancient Myanmar Kingdoms', 'From Bagan to Ava — key dynasties and culture']
  ]) {
    courseIds.push(insertCourse.run(...c).lastInsertRowid);
  }

  // ── Lessons (3 per course) ──
  console.log('Seeding lessons...');
  const insertLesson = db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order, duration_minutes) VALUES (?, ?, ?, ?, ?)');
  for (const l of [
    [courseIds[0], 'Variables & Expressions', 'Understanding variables and algebraic expressions', 1, 50],
    [courseIds[0], 'Solving Equations', 'Linear equations and methods to solve them', 2, 50],
    [courseIds[0], 'Word Problems', 'Applying algebra to real-world problems', 3, 50],
    [courseIds[1], 'Sonnet Structure', 'The 14-line structure and rhyme schemes', 1, 45],
    [courseIds[1], 'Shakespeare\'s Themes', 'Love, ambition, and mortality in the plays', 2, 45],
    [courseIds[1], 'Modern Poetry', 'Free verse and contemporary voices', 3, 45],
    [courseIds[2], 'Atomic Structure', 'Protons, neutrons, electrons, and orbitals', 1, 60],
    [courseIds[2], 'Chemical Bonds', 'Ionic vs covalent bonding', 2, 60],
    [courseIds[2], 'Balancing Equations', 'Conservation of mass in reactions', 3, 60],
    [courseIds[3], 'The Bagan Era', 'King Anawrahta and the founding of Bagan', 1, 40],
    [courseIds[3], 'Ava & Inwa', 'The rise and fall of the Ava Kingdom', 2, 40],
    [courseIds[3], 'Colonial Period', 'British annexation and the independence movement', 3, 40]
  ]) insertLesson.run(...l);

  // ── Resources ──
  console.log('Seeding resources...');
  const insertResource = db.prepare('INSERT INTO resources (course_id, title, type, url, uploaded_by) VALUES (?, ?, ?, ?, ?)');
  for (const r of [
    [courseIds[0], 'Algebra Formula Sheet', 'pdf', 'https://example.com/algebra-formulas.pdf', userIds['teacher@school.com']],
    [courseIds[0], 'Khan Academy - Algebra', 'link', 'https://www.khanacademy.org/math/algebra', userIds['teacher@school.com']],
    [courseIds[1], 'Shakespeare Sonnet Collection', 'document', 'https://example.com/sonnets.pdf', userIds['teacher@school.com']],
    [courseIds[2], 'Periodic Table Reference', 'pdf', 'https://example.com/periodic-table.pdf', userIds['teacher2@school.com']],
    [courseIds[2], 'Lab Safety Video', 'video', 'https://example.com/lab-safety.mp4', userIds['teacher2@school.com']],
    [courseIds[3], 'Myanmar Kings Timeline', 'image', 'https://example.com/timeline.png', userIds['teacher3@school.com']]
  ]) insertResource.run(...r);

  // ── Assignments (1 per course) ──
  console.log('Seeding assignments...');
  const insertAssignment = db.prepare('INSERT INTO assignments (course_id, title, description, due_date, max_score, created_by) VALUES (?, ?, ?, ?, ?, ?)');
  const assignmentIds = [];
  for (const a of [
    [courseIds[0], 'Algebra Homework 1', 'Complete exercises 1-10 on page 25', '2026-07-15', 100, userIds['teacher@school.com']],
    [courseIds[1], 'Sonnet Analysis Essay', 'Write a 500-word analysis of Shakespeare\'s Sonnet 18', '2026-07-18', 100, userIds['teacher@school.com']],
    [courseIds[2], 'Lab Report: Chemical Reactions', 'Document the acid-base experiment from Lesson 3', '2026-07-20', 100, userIds['teacher2@school.com']],
    [courseIds[3], 'Myanmar Kingdoms Timeline', 'Create a visual timeline of the major kingdoms from 849-1885 AD', '2026-07-22', 100, userIds['teacher3@school.com']]
  ]) {
    assignmentIds.push(insertAssignment.run(...a).lastInsertRowid);
  }

  // ── Submissions ──
  console.log('Seeding submissions...');
  const insertSubmission = db.prepare('INSERT INTO submissions (assignment_id, student_id, content, score, feedback, status, graded_at, graded_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const today = new Date().toISOString().split('T')[0];
  insertSubmission.run(assignmentIds[0], userIds['student@school.com'], 'Completed all 10 exercises.', 92, 'Excellent work! Minor error on #7.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[0], userIds['student2@school.com'], 'Exercises 1-10 done.', 85, 'Good effort. Check #4 and #9.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[0], userIds['student3@school.com'], 'Here are my answers.', null, null, 'submitted', null, null);
  insertSubmission.run(assignmentIds[1], userIds['student@school.com'], 'Sonnet 18 analysis...', 95, 'Brilliant analysis.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[1], userIds['student3@school.com'], 'Shakespeare writes about love...', null, null, 'submitted', null, null);
  insertSubmission.run(assignmentIds[2], userIds['student@school.com'], 'Lab report: acid-base reaction.', 88, 'Good observations.', 'graded', today, userIds['teacher2@school.com']);
  insertSubmission.run(assignmentIds[2], userIds['student2@school.com'], 'Lab report attached.', null, null, 'submitted', null, null);
  insertSubmission.run(assignmentIds[3], userIds['student4@school.com'], 'Timeline: Bagan to Konbaung.', null, null, 'submitted', null, null);

  // ── Quizzes (3) ──
  console.log('Seeding quizzes...');
  const insertQuiz = db.prepare('INSERT INTO quizzes (course_id, title, description, time_limit_minutes, max_score, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const quizIds = [];
  for (const q of [
    [courseIds[0], 'Algebra Basics Quiz', 'Test your understanding of basic algebra', 30, 50, '2026-07-20', userIds['teacher@school.com']],
    [courseIds[1], 'Poetry Terms Quiz', 'Identify literary devices and poetic forms', 20, 40, '2026-07-22', userIds['teacher@school.com']],
    [courseIds[2], 'Atomic Structure Quiz', 'Protons, neutrons, electrons, and periodic trends', 25, 50, '2026-07-25', userIds['teacher2@school.com']]
  ]) {
    quizIds.push(insertQuiz.run(...q).lastInsertRowid);
  }

  // ── Quiz Questions (3 per quiz) ──
  console.log('Seeding quiz questions...');
  const insertQQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const q of [
    [quizIds[0], 'What is x if 2x = 10?', 'mcq', JSON.stringify(['3','5','10','20']), '5', 10, 1],
    [quizIds[0], 'Solve: x + 5 = 12', 'mcq', JSON.stringify(['5','7','12','17']), '7', 10, 2],
    [quizIds[0], 'Is 3x + 2 an expression or equation?', 'true_false', JSON.stringify(['Expression','Equation']), 'Expression', 10, 3],
    [quizIds[1], 'A 14-line poem is called a ___', 'fill_blank', null, 'sonnet', 10, 1],
    [quizIds[1], 'Which device compares using "like" or "as"?', 'mcq', JSON.stringify(['Metaphor','Simile','Alliteration','Hyperbole']), 'Simile', 10, 2],
    [quizIds[1], 'Rhyme is the repetition of similar sounds at the end of lines.', 'true_false', JSON.stringify(['True','False']), 'True', 10, 3],
    [quizIds[2], 'How many protons does Carbon have?', 'mcq', JSON.stringify(['4','6','8','12']), '6', 10, 1],
    [quizIds[2], 'An ionic bond involves the ___ of electrons.', 'fill_blank', null, 'transfer', 10, 2],
    [quizIds[2], 'Which subatomic particle has a negative charge?', 'mcq', JSON.stringify(['Proton','Neutron','Electron','Nucleus']), 'Electron', 10, 3]
  ]) insertQQ.run(...q);

  // ── Quiz Attempts ──
  console.log('Seeding quiz attempts...');
  const insertQA = db.prepare('INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)');
  for (const a of [
    [quizIds[0], userIds['student@school.com'], JSON.stringify({1:'5',2:'7',3:'Expression'}), 30, '2026-06-27T09:00:00', '2026-06-27T09:25:00'],
    [quizIds[0], userIds['student2@school.com'], JSON.stringify({1:'5',2:'7',3:'Equation'}), 20, '2026-06-27T09:00:00', '2026-06-27T09:25:00'],
    [quizIds[1], userIds['student@school.com'], JSON.stringify({1:'sonnet',2:'Simile',3:'True'}), 30, '2026-06-27T09:00:00', '2026-06-27T09:20:00'],
    [quizIds[1], userIds['student3@school.com'], JSON.stringify({1:'haiku',2:'Simile',3:'True'}), 20, '2026-06-27T09:00:00', '2026-06-27T09:20:00'],
    [quizIds[2], userIds['student@school.com'], JSON.stringify({1:'6',2:'transfer',3:'Electron'}), 30, '2026-06-27T09:00:00', '2026-06-27T09:22:00'],
    [quizIds[2], userIds['student2@school.com'], JSON.stringify({1:'6',2:'sharing',3:'Electron'}), 20, '2026-06-27T09:00:00', '2026-06-27T09:22:00']
  ]) insertQA.run(...a);

  // ── Attendance ──
  console.log('Seeding attendance...');
  const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (user_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)');
  for (const date of ['2026-06-23','2026-06-24','2026-06-25','2026-06-26','2026-06-27']) {
    insertAtt.run(userIds['student@school.com'], classIds[0], date, 'present', userIds['teacher@school.com']);
    insertAtt.run(userIds['student2@school.com'], classIds[0], date, date === '2026-06-24' ? 'absent' : 'present', userIds['teacher@school.com']);
    insertAtt.run(userIds['student3@school.com'], classIds[0], date, date === '2026-06-24' ? 'absent' : 'present', userIds['teacher@school.com']);
    insertAtt.run(userIds['student4@school.com'], classIds[0], date, 'present', userIds['teacher@school.com']);
  }

  // ── Timetable ──
  console.log('Seeding timetable...');
  const insertTT = db.prepare('INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const t of [
    [classIds[0], getSubjectId('MATH'), userIds['teacher@school.com'], 0, '09:00', '10:00', 'Room 101'],
    [classIds[0], getSubjectId('MATH'), userIds['teacher@school.com'], 2, '09:00', '10:00', 'Room 101'],
    [classIds[0], getSubjectId('MATH'), userIds['teacher@school.com'], 4, '09:00', '10:00', 'Room 101'],
    [classIds[1], getSubjectId('ENG'), userIds['teacher@school.com'], 1, '10:00', '11:30', 'Room 205'],
    [classIds[1], getSubjectId('ENG'), userIds['teacher@school.com'], 3, '10:00', '11:30', 'Room 205'],
    [classIds[2], getSubjectId('SCI'), userIds['teacher2@school.com'], 2, '14:00', '15:30', 'Lab 301'],
    [classIds[2], getSubjectId('SCI'), userIds['teacher2@school.com'], 4, '14:00', '15:30', 'Lab 301'],
    [classIds[3], getSubjectId('MM'), userIds['teacher3@school.com'], 0, '11:00', '12:00', 'Room 108'],
    [classIds[3], getSubjectId('MM'), userIds['teacher3@school.com'], 3, '11:00', '12:00', 'Room 108']
  ]) insertTT.run(...t);

  // ── Gradebook ──
  console.log('Seeding gradebook...');
  const insertGB = db.prepare('INSERT INTO gradebook (student_id, course_id, assignment_score, quiz_score, exam_score, final_grade, gpa) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const g of [
    [userIds['student@school.com'], courseIds[0], 92, 90, 88, 'A', 4.0],
    [userIds['student@school.com'], courseIds[1], 95, 90, 92, 'A', 4.0],
    [userIds['student@school.com'], courseIds[2], 88, 90, 85, 'B+', 3.5],
    [userIds['student2@school.com'], courseIds[0], 85, 67, 78, 'B', 3.0],
    [userIds['student2@school.com'], courseIds[2], 78, 67, 80, 'B-', 2.7],
    [userIds['student3@school.com'], courseIds[0], null, null, null, '-', null],
    [userIds['student3@school.com'], courseIds[1], null, 67, null, '-', null]
  ]) insertGB.run(...g);

  // ── Chat Messages ──
  console.log('Seeding chat messages...');
  const insertChat = db.prepare('INSERT INTO chat_messages (user_id, user_name, user_role, message, reply) VALUES (?, ?, ?, ?, ?)');
  for (const c of [
    [userIds['student@school.com'], 'Aye Aye', 'student', 'What time is the math quiz?', 'The math quiz is scheduled for Wednesday at 9:00 AM in Room 101.'],
    [userIds['student2@school.com'], 'John Doe', 'student', 'How do I reset my password?', 'Please contact the admin office or email admin@school.com to reset your password.'],
    [userIds['teacher@school.com'], 'Ms. Johnson', 'teacher', 'How many students are enrolled in Math 101?', 'There are 4 students currently enrolled in Mathematics 101.']
  ]) insertChat.run(...c);

  // ── Contacts ──
  console.log('Seeding contacts...');
  const insertContact = db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)');
  for (const c of [
    ['U Win', 'uwin@gmail.com', 'Admission Inquiry', 'I would like to inquire about admission for my daughter entering Grade 5.'],
    ['Daw Aye', 'dawaye@gmail.com', 'Fee Structure', 'Could you please send me the fee structure for the upcoming academic year?'],
    ['Maung Maung', 'maung@gmail.com', 'Transfer Certificate', 'I need a transfer certificate for my son. What documents are required?']
  ]) insertContact.run(...c);

  console.log('\nSeed completed successfully!');
  console.log('\nTest accounts (password: password123):');
  console.log('- admin@school.com (Admin)');
  console.log('- teacher@school.com (Teacher)');
  console.log('- teacher2@school.com (Teacher)');
  console.log('- teacher3@school.com (Teacher)');
  console.log('- student@school.com (Student)');
  console.log('- student2@school.com (Student)');
  console.log('- student3@school.com (Student)');
  console.log('- student4@school.com (Student)');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
