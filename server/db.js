const Database = require('better-sqlite3');
const path = require('path');

// Use /tmp for Vercel serverless (writable, but ephemeral)
const DB_PATH = process.env.VERCEL
  ? path.join('/tmp', 'school.db')
  : path.join(__dirname, 'school.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDatabase() {
  const db = getDb();

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('student', 'teacher', 'admin')) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      schedule TEXT,
      room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(class_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS education_levels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS grades (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      education_level_id INTEGER REFERENCES education_levels(id) ON DELETE CASCADE,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      display_order INTEGER
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS grade_subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      academic_year TEXT,
      weekly_periods INTEGER,
      is_required INTEGER DEFAULT 1,
      UNIQUE(grade_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      message TEXT NOT NULL,
      reply TEXT,
      file_name TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      student_id TEXT UNIQUE,
      grade_id INTEGER REFERENCES grades(id),
      section TEXT DEFAULT 'A',
      date_of_birth TEXT,
      gender TEXT CHECK(gender IN ('male','female','other')),
      phone TEXT,
      address TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      parent_name TEXT,
      parent_phone TEXT,
      parent_email TEXT,
      status TEXT CHECK(status IN ('active','suspended','graduated','transferred')) DEFAULT 'active',
      enrolled_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      teacher_id TEXT UNIQUE,
      phone TEXT,
      qualification TEXT,
      specialization TEXT,
      hire_date TEXT,
      status TEXT CHECK(status IN ('active','on_leave','resigned')) DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      status TEXT CHECK(status IN ('present','absent','late','leave')) NOT NULL,
      note TEXT,
      marked_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, class_id, date)
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      room TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS semesters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      is_current INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS holidays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT CHECK(type IN ('public','school','exam')) DEFAULT 'school'
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT,
      lesson_order INTEGER DEFAULT 0,
      duration_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      type TEXT CHECK(type IN ('pdf','video','audio','image','link','document')) NOT NULL,
      url TEXT,
      file_path TEXT,
      description TEXT,
      uploaded_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      max_score INTEGER DEFAULT 100,
      allow_late INTEGER DEFAULT 0,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      content TEXT,
      file_path TEXT,
      score INTEGER,
      feedback TEXT,
      status TEXT CHECK(status IN ('submitted','graded','late','returned')) DEFAULT 'submitted',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      graded_at DATETIME,
      graded_by INTEGER REFERENCES users(id),
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      time_limit_minutes INTEGER,
      max_score INTEGER DEFAULT 100,
      due_date TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      question_type TEXT CHECK(question_type IN ('mcq','true_false','fill_blank','essay')) NOT NULL,
      options TEXT,
      correct_answer TEXT,
      points INTEGER DEFAULT 1,
      question_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      answers TEXT,
      score INTEGER,
      started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    CREATE TABLE IF NOT EXISTS gradebook (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
      assignment_score REAL DEFAULT 0,
      quiz_score REAL DEFAULT 0,
      exam_score REAL DEFAULT 0,
      final_grade TEXT,
      gpa REAL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(student_id, course_id)
    );
  `);

  // Seed curriculum data first (subjects needed by seedDatabase)
  const gradeCount = db.prepare('SELECT COUNT(*) as count FROM grades').get();
  if (gradeCount.count === 0) {
    seedCurriculum(db);
  }

  // Seed demo data if empty
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase(db);
  }

  console.log('Database initialized successfully');
}

function seedDatabase(db) {
  const bcrypt = require('bcryptjs');

  const salt = bcrypt.genSaltSync(10);
  const password = bcrypt.hashSync('password123', salt);

  // ── Users (8 total) ──
  const users = [
    { email: 'admin@school.com', name: 'Admin User', role: 'admin' },
    { email: 'teacher@school.com', name: 'Ms. Johnson', role: 'teacher' },
    { email: 'teacher2@school.com', name: 'Mr. Smith', role: 'teacher' },
    { email: 'teacher3@school.com', name: 'Daw Nwe', role: 'teacher' },
    { email: 'student@school.com', name: 'Aye Aye', role: 'student' },
    { email: 'student2@school.com', name: 'John Doe', role: 'student' },
    { email: 'student3@school.com', name: 'Mya Mya', role: 'student' },
    { email: 'student4@school.com', name: 'Hla Hla', role: 'student' }
  ];
  const insertUser = db.prepare('INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)');
  const userIds = {};
  for (const u of users) {
    const r = insertUser.run(u.email, password, u.name, u.role);
    userIds[u.email] = r.lastInsertRowid;
  }

  // ── Teacher profiles (3) ──
  const insertTeacher = db.prepare(`
    INSERT INTO teachers (user_id, teacher_id, phone, qualification, specialization, hire_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertTeacher.run(userIds['teacher@school.com'], 'TCH-2026-001', '09111111111', 'M.Ed Mathematics', 'Mathematics', '2020-06-01', 'active');
  insertTeacher.run(userIds['teacher2@school.com'], 'TCH-2026-002', '09222222222', 'B.Sc Physics', 'Physics', '2021-08-15', 'active');
  insertTeacher.run(userIds['teacher3@school.com'], 'TCH-2026-003', '09333333333', 'M.A Myanmar Literature', 'Myanmar', '2019-03-10', 'active');

  // ── Student profiles (4) ──
  const insertStudent = db.prepare(`
    INSERT INTO students (user_id, student_id, grade_id, section, date_of_birth, gender, phone, address, parent_name, parent_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const g10 = db.prepare('SELECT id FROM grades WHERE code = ?').get('G10')?.id;
  const g9 = db.prepare('SELECT id FROM grades WHERE code = ?').get('G9')?.id;
  insertStudent.run(userIds['student@school.com'], 'STU-2026-001', g10, 'A', '2010-03-15', 'female', '09123456789', '123 School Street', 'U Aye', '09987654321', 'active');
  insertStudent.run(userIds['student2@school.com'], 'STU-2026-002', g10, 'A', '2010-07-22', 'male', '09123456790', '456 Oak Avenue', 'U Hla', '09987654322', 'active');
  insertStudent.run(userIds['student3@school.com'], 'STU-2026-003', g10, 'B', '2010-11-08', 'female', '09123456791', '789 Pine Road', 'Daw Kyi', '09987654323', 'active');
  insertStudent.run(userIds['student4@school.com'], 'STU-2026-004', g9, 'A', '2011-01-30', 'male', '09123456792', '321 Elm Lane', 'U Tin', '09987654324', 'active');

  // ── Classes (4) ──
  const insertClass = db.prepare('INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)');
  const classIds = [];
  const clsData = [
    ['Mathematics 101', 'Introduction to algebra and geometry', userIds['teacher@school.com'], 'Mon/Wed/Fri 9:00-10:00', 'Room 101'],
    ['English Literature', 'Classic and modern literature analysis', userIds['teacher@school.com'], 'Tue/Thu 10:00-11:30', 'Room 205'],
    ['Science Lab', 'Hands-on experiments and scientific methods', userIds['teacher2@school.com'], 'Wed/Fri 14:00-15:30', 'Lab 301'],
    ['Myanmar History', 'History of Myanmar from ancient to modern times', userIds['teacher3@school.com'], 'Mon/Thu 11:00-12:00', 'Room 108']
  ];
  for (const c of clsData) {
    classIds.push(insertClass.run(...c).lastInsertRowid);
  }

  // ── Enrollments ──
  const insertEnroll = db.prepare('INSERT OR IGNORE INTO enrollments (class_id, student_id) VALUES (?, ?)');
  const studentEmails = ['student@school.com', 'student2@school.com', 'student3@school.com', 'student4@school.com'];
  // All students in Math
  for (const s of studentEmails) insertEnroll.run(classIds[0], userIds[s]);
  // 3 students in English
  for (const s of studentEmails.slice(0, 3)) insertEnroll.run(classIds[1], userIds[s]);
  // 2 students in Science
  for (const s of studentEmails.slice(0, 2)) insertEnroll.run(classIds[2], userIds[s]);
  // 2 students in Myanmar History
  for (const s of [studentEmails[2], studentEmails[3]]) insertEnroll.run(classIds[3], userIds[s]);

  // ── Announcements (5) ──
  const insertAnn = db.prepare('INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)');
  const anns = [
    ['Welcome to the New School Year!', 'We are excited to welcome all students and staff to the 2026-2027 school year. Please check your schedules and come prepared on the first day.', userIds['admin@school.com']],
    ['Mathematics Quiz Next Week', 'There will be a quiz on algebra fundamentals next Wednesday. Please review chapters 1-3 and practice the sample problems.', userIds['teacher@school.com']],
    ['Science Fair Registration Open', 'Registration for the annual science fair is now open. Submit your project proposals by the end of the month.', userIds['admin@school.com']],
    ['Library Hours Extended', 'The school library will now be open until 6 PM on weekdays to support student study needs.', userIds['admin@school.com']],
    ['Parent-Teacher Conference', 'Parent-teacher conferences will be held next Friday from 2-5 PM. Please schedule your appointments through the school office.', userIds['teacher@school.com']]
  ];
  for (const a of anns) insertAnn.run(...a);

  // ── Academic Year & Semesters ──
  db.prepare('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)')
    .run('2026-2027', '2026-06-01', '2027-03-31', 1);
  const ayId = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get()?.id;
  if (ayId) {
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run(ayId, 'Semester 1', '2026-06-01', '2026-10-31', 1);
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)').run(ayId, 'Semester 2', '2026-11-01', '2027-03-31', 0);
    // Holidays
    const insertHoliday = db.prepare('INSERT INTO holidays (academic_year_id, name, date, type) VALUES (?, ?, ?, ?)');
    insertHoliday.run(ayId, 'Waso Full Moon Day', '2026-07-10', 'public');
    insertHoliday.run(ayId, 'Teachers\' Day', '2026-09-05', 'school');
    insertHoliday.run(ayId, 'Mid-Semester Break', '2026-09-20', 'school');
    insertHoliday.run(ayId, 'Thadingyut Festival', '2026-10-07', 'public');
    insertHoliday.run(ayId, 'Tazaungdaing Festival', '2026-11-05', 'public');
    insertHoliday.run(ayId, 'Exam Week - Semester 1', '2026-10-25', 'exam');
  }

  // ── Helper lookups ──
  const getSubjectId = (code) => db.prepare('SELECT id FROM subjects WHERE code = ?').get(code)?.id;
  const mathSubjId = getSubjectId('MATH');
  const engSubjId = getSubjectId('ENG');
  const sciSubjId = getSubjectId('SCI');
  const mmSubjId = getSubjectId('MM');

  // ── Courses (4) ──
  const insertCourse = db.prepare('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)');
  const courseIds = [];
  const courseData = [
    [classIds[0], mathSubjId, 'Algebra Fundamentals', 'Introduction to algebraic expressions and equations'],
    [classIds[1], engSubjId, 'Shakespeare & Poetry', 'Exploring Shakespearean sonnets and modern poetry'],
    [classIds[2], sciSubjId, 'Chemistry Basics', 'Atoms, molecules, and chemical reactions'],
    [classIds[3], mmSubjId, 'Ancient Myanmar Kingdoms', 'From Bagan to Ava — key dynasties and culture']
  ];
  for (const c of courseData) {
    courseIds.push(insertCourse.run(...c).lastInsertRowid);
  }

  // ── Lessons (3 per course = 12) ──
  const insertLesson = db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order, duration_minutes) VALUES (?, ?, ?, ?, ?)');
  const lessonSets = [
    [[courseIds[0], 'Variables & Expressions', 'Understanding variables and algebraic expressions', 1, 50],
     [courseIds[0], 'Solving Equations', 'Linear equations and methods to solve them', 2, 50],
     [courseIds[0], 'Word Problems', 'Applying algebra to real-world problems', 3, 50]],
    [[courseIds[1], 'Sonnet Structure', 'The 14-line structure and rhyme schemes', 1, 45],
     [courseIds[1], 'Shakespeare\'s Themes', 'Love, ambition, and mortality in the plays', 2, 45],
     [courseIds[1], 'Modern Poetry', 'Free verse and contemporary voices', 3, 45]],
    [[courseIds[2], 'Atomic Structure', 'Protons, neutrons, electrons, and orbitals', 1, 60],
     [courseIds[2], 'Chemical Bonds', 'Ionic vs covalent bonding', 2, 60],
     [courseIds[2], 'Balancing Equations', 'Conservation of mass in reactions', 3, 60]],
    [[courseIds[3], 'The Bagan Era', 'King Anawrahta and the founding of Bagan', 1, 40],
     [courseIds[3], 'Ava & Inwa', 'The rise and fall of the Ava Kingdom', 2, 40],
     [courseIds[3], 'Colonial Period', 'British annexation and the independence movement', 3, 40]]
  ];
  for (const set of lessonSets) {
    for (const l of set) insertLesson.run(...l);
  }

  // ── Resources (1-2 per course) ──
  const insertResource = db.prepare('INSERT INTO resources (course_id, title, type, url, uploaded_by) VALUES (?, ?, ?, ?, ?)');
  const resources = [
    [courseIds[0], 'Algebra Formula Sheet', 'pdf', 'https://example.com/algebra-formulas.pdf', userIds['teacher@school.com']],
    [courseIds[0], 'Khan Academy - Algebra', 'link', 'https://www.khanacademy.org/math/algebra', userIds['teacher@school.com']],
    [courseIds[1], 'Shakespeare Sonnet Collection', 'document', 'https://example.com/sonnets.pdf', userIds['teacher@school.com']],
    [courseIds[2], 'Periodic Table Reference', 'pdf', 'https://example.com/periodic-table.pdf', userIds['teacher2@school.com']],
    [courseIds[2], 'Lab Safety Video', 'video', 'https://example.com/lab-safety.mp4', userIds['teacher2@school.com']],
    [courseIds[3], 'Myanmar Kings Timeline', 'image', 'https://example.com/timeline.png', userIds['teacher3@school.com']]
  ];
  for (const r of resources) insertResource.run(...r);

  // ── Assignments (1 per course = 4) ──
  const insertAssignment = db.prepare('INSERT INTO assignments (course_id, title, description, due_date, max_score, created_by) VALUES (?, ?, ?, ?, ?, ?)');
  const assignmentIds = [];
  const assignments = [
    [courseIds[0], 'Algebra Homework 1', 'Complete exercises 1-10 on page 25', '2026-07-15', 100, userIds['teacher@school.com']],
    [courseIds[1], 'Sonnet Analysis Essay', 'Write a 500-word analysis of Shakespeare\'s Sonnet 18', '2026-07-18', 100, userIds['teacher@school.com']],
    [courseIds[2], 'Lab Report: Chemical Reactions', 'Document the acid-base experiment from Lesson 3', '2026-07-20', 100, userIds['teacher2@school.com']],
    [courseIds[3], 'Myanmar Kingdoms Timeline', 'Create a visual timeline of the major kingdoms from 849-1885 AD', '2026-07-22', 100, userIds['teacher3@school.com']]
  ];
  for (const a of assignments) {
    assignmentIds.push(insertAssignment.run(...a).lastInsertRowid);
  }

  // ── Submissions (2-3 per assignment) ──
  const insertSubmission = db.prepare(`
    INSERT INTO submissions (assignment_id, student_id, content, score, feedback, status, graded_at, graded_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const today = new Date().toISOString().split('T')[0];
  // Assignment 0 (Algebra) — 3 submissions, 2 graded
  insertSubmission.run(assignmentIds[0], userIds['student@school.com'], 'Completed all 10 exercises. Work shown for each.', 92, 'Excellent work! Minor error on #7.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[0], userIds['student2@school.com'], 'Exercises 1-10 done. Used substitution method.', 85, 'Good effort. Check #4 and #9.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[0], userIds['student3@school.com'], 'Here are my answers for exercises 1-10.', null, null, 'submitted', null, null);
  // Assignment 1 (English) — 2 submissions, 1 graded
  insertSubmission.run(assignmentIds[1], userIds['student@school.com'], 'Sonnet 18 compares the beloved to a summer day. The poem explores beauty, mortality, and the power of poetry to preserve love...', 95, 'Brilliant analysis with strong textual evidence.', 'graded', today, userIds['teacher@school.com']);
  insertSubmission.run(assignmentIds[1], userIds['student3@school.com'], 'Shakespeare writes about love and summer. The poem says the person is better than summer because summer ends...', null, null, 'submitted', null, null);
  // Assignment 2 (Science) — 2 submissions, 1 graded
  insertSubmission.run(assignmentIds[2], userIds['student@school.com'], 'The acid-base reaction produced CO2 gas. Litmus paper turned red indicating acidity. Temperature rose by 3°C.', 88, 'Good observations. Include more data points next time.', 'graded', today, userIds['teacher2@school.com']);
  insertSubmission.run(assignmentIds[2], userIds['student2@school.com'], 'Lab report attached. Observed bubbling when mixing baking soda and vinegar.', null, null, 'submitted', null, null);
  // Assignment 3 (Myanmar) — 1 submission
  insertSubmission.run(assignmentIds[3], userIds['student4@school.com'], 'Timeline: Bagan (849-1287), Ava (1364-1555), Toungoo (1510-1752), Konbaung (1752-1885).', null, null, 'submitted', null, null);

  // ── Quizzes (3) ──
  const insertQuiz = db.prepare('INSERT INTO quizzes (course_id, title, description, time_limit_minutes, max_score, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)');
  const quizIds = [];
  const quizzes = [
    [courseIds[0], 'Algebra Basics Quiz', 'Test your understanding of basic algebra', 30, 50, '2026-07-20', userIds['teacher@school.com']],
    [courseIds[1], 'Poetry Terms Quiz', 'Identify literary devices and poetic forms', 20, 40, '2026-07-22', userIds['teacher@school.com']],
    [courseIds[2], 'Atomic Structure Quiz', 'Protons, neutrons, electrons, and periodic trends', 25, 50, '2026-07-25', userIds['teacher2@school.com']]
  ];
  for (const q of quizzes) {
    quizIds.push(insertQuiz.run(...q).lastInsertRowid);
  }

  // ── Quiz Questions (3 per quiz = 9) ──
  const insertQQ = db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)');
  // Quiz 0 — Algebra
  insertQQ.run(quizIds[0], 'What is x if 2x = 10?', 'mcq', JSON.stringify(['3','5','10','20']), '5', 10, 1);
  insertQQ.run(quizIds[0], 'Solve: x + 5 = 12', 'mcq', JSON.stringify(['5','7','12','17']), '7', 10, 2);
  insertQQ.run(quizIds[0], 'Is 3x + 2 an expression or equation?', 'true_false', JSON.stringify(['Expression','Equation']), 'Expression', 10, 3);
  // Quiz 1 — Poetry
  insertQQ.run(quizIds[1], 'A 14-line poem is called a ___', 'fill_blank', null, 'sonnet', 10, 1);
  insertQQ.run(quizIds[1], 'Which device compares using "like" or "as"?', 'mcq', JSON.stringify(['Metaphor','Simile','Alliteration','Hyperbole']), 'Simile', 10, 2);
  insertQQ.run(quizIds[1], 'Rhyme is the repetition of similar sounds at the end of lines.', 'true_false', JSON.stringify(['True','False']), 'True', 10, 3);
  // Quiz 2 — Chemistry
  insertQQ.run(quizIds[2], 'How many protons does Carbon have?', 'mcq', JSON.stringify(['4','6','8','12']), '6', 10, 1);
  insertQQ.run(quizIds[2], 'An ionic bond involves the ___ of electrons.', 'fill_blank', null, 'transfer', 10, 2);
  insertQQ.run(quizIds[2], 'Which subatomic particle has a negative charge?', 'mcq', JSON.stringify(['Proton','Neutron','Electron','Nucleus']), 'Electron', 10, 3);

  // ── Quiz Attempts (2 per quiz) ──
  const insertQA = db.prepare('INSERT INTO quiz_attempts (quiz_id, student_id, answers, score, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)');
  const startTime = '2026-06-27T09:00:00';
  const endTime = '2026-06-27T09:25:00';
  // Quiz 0 attempts
  insertQA.run(quizIds[0], userIds['student@school.com'], JSON.stringify({1:'5',2:'7',3:'Expression'}), 30, startTime, endTime);
  insertQA.run(quizIds[0], userIds['student2@school.com'], JSON.stringify({1:'5',2:'7',3:'Equation'}), 20, startTime, endTime);
  // Quiz 1 attempts
  insertQA.run(quizIds[1], userIds['student@school.com'], JSON.stringify({1:'sonnet',2:'Simile',3:'True'}), 30, startTime, endTime);
  insertQA.run(quizIds[1], userIds['student3@school.com'], JSON.stringify({1:'haiku',2:'Simile',3:'True'}), 20, startTime, endTime);
  // Quiz 2 attempts
  insertQA.run(quizIds[2], userIds['student@school.com'], JSON.stringify({1:'6',2:'transfer',3:'Electron'}), 30, startTime, endTime);
  insertQA.run(quizIds[2], userIds['student2@school.com'], JSON.stringify({1:'6',2:'sharing',3:'Electron'}), 20, startTime, endTime);

  // ── Attendance (multiple dates) ──
  const insertAtt = db.prepare('INSERT OR IGNORE INTO attendance (user_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)');
  const dates = ['2026-06-23','2026-06-24','2026-06-25','2026-06-26','2026-06-27'];
  const statuses = ['present','present','late','present','present'];
  const statuses2 = ['present','absent','present','present','present'];
  for (let i = 0; i < dates.length; i++) {
    insertAtt.run(userIds['student@school.com'], classIds[0], dates[i], statuses[i], userIds['teacher@school.com']);
    insertAtt.run(userIds['student2@school.com'], classIds[0], dates[i], statuses2[i], userIds['teacher@school.com']);
    insertAtt.run(userIds['student3@school.com'], classIds[0], dates[i], i === 1 ? 'absent' : 'present', userIds['teacher@school.com']);
    insertAtt.run(userIds['student4@school.com'], classIds[0], dates[i], 'present', userIds['teacher@school.com']);
  }

  // ── Timetable ──
  const insertTT = db.prepare('INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)');
  // Math — Mon/Wed/Fri
  insertTT.run(classIds[0], mathSubjId, userIds['teacher@school.com'], 0, '09:00', '10:00', 'Room 101');
  insertTT.run(classIds[0], mathSubjId, userIds['teacher@school.com'], 2, '09:00', '10:00', 'Room 101');
  insertTT.run(classIds[0], mathSubjId, userIds['teacher@school.com'], 4, '09:00', '10:00', 'Room 101');
  // English — Tue/Thu
  insertTT.run(classIds[1], engSubjId, userIds['teacher@school.com'], 1, '10:00', '11:30', 'Room 205');
  insertTT.run(classIds[1], engSubjId, userIds['teacher@school.com'], 3, '10:00', '11:30', 'Room 205');
  // Science — Wed/Fri
  insertTT.run(classIds[2], sciSubjId, userIds['teacher2@school.com'], 2, '14:00', '15:30', 'Lab 301');
  insertTT.run(classIds[2], sciSubjId, userIds['teacher2@school.com'], 4, '14:00', '15:30', 'Lab 301');
  // Myanmar History — Mon/Thu
  insertTT.run(classIds[3], mmSubjId, userIds['teacher3@school.com'], 0, '11:00', '12:00', 'Room 108');
  insertTT.run(classIds[3], mmSubjId, userIds['teacher3@school.com'], 3, '11:00', '12:00', 'Room 108');

  // ── Gradebook ──
  const insertGB = db.prepare('INSERT INTO gradebook (student_id, course_id, assignment_score, quiz_score, exam_score, final_grade, gpa) VALUES (?, ?, ?, ?, ?, ?, ?)');
  insertGB.run(userIds['student@school.com'], courseIds[0], 92, 90, 88, 'A', 4.0);
  insertGB.run(userIds['student@school.com'], courseIds[1], 95, 90, 92, 'A', 4.0);
  insertGB.run(userIds['student@school.com'], courseIds[2], 88, 90, 85, 'B+', 3.5);
  insertGB.run(userIds['student2@school.com'], courseIds[0], 85, 67, 78, 'B', 3.0);
  insertGB.run(userIds['student2@school.com'], courseIds[2], 78, 67, 80, 'B-', 2.7);
  insertGB.run(userIds['student3@school.com'], courseIds[0], null, null, null, '-', null);
  insertGB.run(userIds['student3@school.com'], courseIds[1], null, 67, null, '-', null);

  // ── Chat Messages ──
  const insertChat = db.prepare('INSERT INTO chat_messages (user_id, user_name, user_role, message, reply) VALUES (?, ?, ?, ?, ?)');
  insertChat.run(userIds['student@school.com'], 'Aye Aye', 'student', 'What time is the math quiz?', 'The math quiz is scheduled for Wednesday at 9:00 AM in Room 101.');
  insertChat.run(userIds['student2@school.com'], 'John Doe', 'student', 'How do I reset my password?', 'Please contact the admin office or email admin@school.com to reset your password.');
  insertChat.run(userIds['teacher@school.com'], 'Ms. Johnson', 'teacher', 'How many students are enrolled in Math 101?', 'There are 4 students currently enrolled in Mathematics 101.');

  // ── Contacts ──
  const insertContact = db.prepare('INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)');
  insertContact.run('U Win', 'uwin@gmail.com', 'Admission Inquiry', 'I would like to inquire about admission for my daughter who is entering Grade 5 next year.');
  insertContact.run('Daw Aye', 'dawaye@gmail.com', 'Fee Structure', 'Could you please send me the fee structure for the upcoming academic year?');
  insertContact.run('Maung Maung', 'maung@gmail.com', 'Transfer Certificate', 'I need a transfer certificate for my son. What documents are required?');

  console.log('Sample data seeded successfully');
}

function seedCurriculum(db) {
  // Education Levels
  const insertLevel = db.prepare('INSERT OR IGNORE INTO education_levels (code, name) VALUES (?, ?)');
  const levels = [
    ['KG', 'Kindergarten'],
    ['PRI', 'Primary School'],
    ['LS', 'Lower Secondary School'],
    ['US', 'Upper Secondary School']
  ];
  for (const level of levels) {
    insertLevel.run(level[0], level[1]);
  }

  // Grades
  const insertGrade = db.prepare(
    'INSERT OR IGNORE INTO grades (code, name, education_level_id, display_order) VALUES (?, ?, ?, ?)'
  );
  const grades = [
    ['KG', 'Kindergarten', 'KG', 0],
    ['G1', 'Grade 1', 'PRI', 1], ['G2', 'Grade 2', 'PRI', 2],
    ['G3', 'Grade 3', 'PRI', 3], ['G4', 'Grade 4', 'PRI', 4],
    ['G5', 'Grade 5', 'PRI', 5], ['G6', 'Grade 6', 'LS', 6],
    ['G7', 'Grade 7', 'LS', 7], ['G8', 'Grade 8', 'LS', 8],
    ['G9', 'Grade 9', 'LS', 9], ['G10', 'Grade 10', 'US', 10],
    ['G11', 'Grade 11', 'US', 11], ['G12', 'Grade 12', 'US', 12]
  ];
  for (const g of grades) {
    const levelId = db.prepare('SELECT id FROM education_levels WHERE code = ?').get(g[2]);
    if (levelId) {
      insertGrade.run(g[0], g[1], levelId.id, g[3]);
    }
  }

  // Subjects
  const insertSubject = db.prepare(
    'INSERT OR IGNORE INTO subjects (code, name, category) VALUES (?, ?, ?)'
  );
  const subjects = [
    ['MM', 'Myanmar', 'Language'],
    ['ENG', 'English', 'Language'],
    ['MATH', 'Mathematics', 'Mathematics'],
    ['SCI', 'Science', 'Science'],
    ['PHY', 'Physics', 'Science'],
    ['CHEM', 'Chemistry', 'Science'],
    ['BIO', 'Biology', 'Science'],
    ['HIST', 'History', 'Social Science'],
    ['GEO', 'Geography', 'Social Science'],
    ['ECO', 'Economics', 'Social Science'],
    ['SS', 'Social Studies', 'Social Science'],
    ['MCE', 'Moral & Civic Education', 'General'],
    ['PE', 'Physical Education', 'General'],
    ['LS', 'Life Skills', 'General'],
    ['ART', 'Art & Music', 'Arts'],
    ['LC', 'Local Curriculum', 'Local'],
    ['ENV', 'Environmental Studies', 'Kindergarten'],
    ['CRA', 'Creative Arts', 'Kindergarten'],
    ['MUSIC', 'Music', 'Kindergarten'],
    ['PA', 'Physical Activities', 'Kindergarten']
  ];
  for (const s of subjects) {
    insertSubject.run(s[0], s[1], s[2]);
  }

  // Grade-Subject mapping
  const insertGS = db.prepare(
    'INSERT OR IGNORE INTO grade_subjects (grade_id, subject_id) VALUES (?, ?)'
  );
  const getGradeId = (code) => db.prepare('SELECT id FROM grades WHERE code = ?').get(code)?.id;
  const getSubjectId = (code) => db.prepare('SELECT id FROM subjects WHERE code = ?').get(code)?.id;

  const gradeSubjectMap = {
    'KG': ['MM','ENG','MATH','ENV','CRA','MUSIC','PA','LS'],
    'G1': ['MM','ENG','MATH','SCI','SS','MCE','PE','LS','ART','LC'],
    'G2': ['MM','ENG','MATH','SCI','SS','MCE','PE','LS','ART','LC'],
    'G3': ['MM','ENG','MATH','SCI','SS','MCE','PE','LS','ART','LC'],
    'G4': ['MM','ENG','MATH','SCI','SS','MCE','PE','LS','ART','LC'],
    'G5': ['MM','ENG','MATH','SCI','SS','MCE','PE','LS','ART','LC'],
    'G6': ['MM','ENG','MATH','SCI','HIST','GEO','MCE','PE','LS','ART','LC'],
    'G7': ['MM','ENG','MATH','SCI','HIST','GEO','MCE','PE','LS','ART','LC'],
    'G8': ['MM','ENG','MATH','SCI','HIST','GEO','MCE','PE','LS','ART','LC'],
    'G9': ['MM','ENG','MATH','SCI','HIST','GEO','MCE','PE','LS','ART','LC'],
    'G10': ['MM','ENG','MATH','PHY','CHEM','BIO','HIST','GEO','ECO','MCE','PE','LC'],
    'G11': ['MM','ENG','MATH','PHY','CHEM','BIO','HIST','GEO','ECO','MCE','PE','LC'],
    'G12': ['MM','ENG','MATH','PHY','CHEM','BIO','HIST','GEO','ECO','MCE','PE','LC']
  };

  for (const [gradeCode, subjectCodes] of Object.entries(gradeSubjectMap)) {
    const gId = getGradeId(gradeCode);
    if (!gId) continue;
    for (const sCode of subjectCodes) {
      const sId = getSubjectId(sCode);
      if (sId) insertGS.run(gId, sId);
    }
  }

  console.log('Curriculum seeded successfully');
}

module.exports = { getDb, initDatabase };
