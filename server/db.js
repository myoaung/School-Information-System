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

  // Seed data if empty (for demo purposes)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase(db);
  }

  // Seed curriculum data if empty
  const gradeCount = db.prepare('SELECT COUNT(*) as count FROM grades').get();
  if (gradeCount.count === 0) {
    seedCurriculum(db);
  }

  console.log('Database initialized successfully');
}

function seedDatabase(db) {
  const bcrypt = require('bcryptjs');

  // Create demo users
  const salt = bcrypt.genSaltSync(10);
  const password = bcrypt.hashSync('password123', salt);

  const users = [
    { email: 'admin@school.com', name: 'Admin User', role: 'admin' },
    { email: 'teacher@school.com', name: 'Ms. Johnson', role: 'teacher' },
    { email: 'student@school.com', name: 'Aye Aye', role: 'student' }
  ];

  const insertUser = db.prepare(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
  );

  const userIds = {};
  for (const user of users) {
    const result = insertUser.run(user.email, password, user.name, user.role);
    userIds[user.email] = result.lastInsertRowid;
  }

  // Create demo classes
  const classes = [
    {
      name: 'Mathematics 101',
      description: 'Introduction to algebra and geometry',
      teacher_id: userIds['teacher@school.com'],
      schedule: 'Mon/Wed/Fri 9:00-10:00',
      room: 'Room 101'
    },
    {
      name: 'English Literature',
      description: 'Classic and modern literature analysis',
      teacher_id: userIds['teacher@school.com'],
      schedule: 'Tue/Thu 10:00-11:30',
      room: 'Room 205'
    }
  ];

  const insertClass = db.prepare(
    'INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)'
  );

  for (const cls of classes) {
    insertClass.run(cls.name, cls.description, cls.teacher_id, cls.schedule, cls.room);
  }

  // Create demo announcements
  const announcements = [
    {
      title: 'Welcome to the New School Year!',
      content: 'We are excited to welcome all students and staff to the 2026-2027 school year.',
      author_id: userIds['admin@school.com']
    },
    {
      title: 'Mathematics Quiz Next Week',
      content: 'There will be a quiz on algebra fundamentals next Wednesday.',
      author_id: userIds['teacher@school.com']
    }
  ];

  const insertAnnouncement = db.prepare(
    'INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)'
  );

  for (const announcement of announcements) {
    insertAnnouncement.run(announcement.title, announcement.content, announcement.author_id);
  }

  // Create student profile for the student user
  const studentGrade = db.prepare('SELECT id FROM grades WHERE code = ?').get('G10');
  db.prepare(`
    INSERT INTO students (user_id, student_id, grade_id, section, date_of_birth, gender, phone, address, parent_name, parent_phone, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(userIds['student@school.com'], 'STU-2026-001', studentGrade?.id, 'A', '2010-03-15', 'female', '09123456789', '123 School Street', 'U Aye', '09987654321', 'active');

  // Create teacher profile for the teacher user
  db.prepare(`
    INSERT INTO teachers (user_id, teacher_id, phone, qualification, specialization, hire_date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(userIds['teacher@school.com'], 'TCH-2026-001', '09111111111', 'M.Ed Mathematics', 'Mathematics', '2020-06-01', 'active');

  // Create demo timetable entries
  const mathClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('Mathematics 101');
  const engClass = db.prepare('SELECT id FROM classes WHERE name = ?').get('English Literature');
  const mathSubject = db.prepare('SELECT id FROM subjects WHERE code = ?').get('MATH');
  const engSubject = db.prepare('SELECT id FROM subjects WHERE code = ?').get('ENG');

  if (mathClass && mathSubject) {
    const insertTimetable = db.prepare(
      'INSERT INTO timetable (class_id, subject_id, teacher_id, day_of_week, start_time, end_time, room) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    insertTimetable.run(mathClass.id, mathSubject.id, userIds['teacher@school.com'], 0, '09:00', '10:00', 'Room 101');
    insertTimetable.run(mathClass.id, mathSubject.id, userIds['teacher@school.com'], 2, '09:00', '10:00', 'Room 101');
    insertTimetable.run(mathClass.id, mathSubject.id, userIds['teacher@school.com'], 4, '09:00', '10:00', 'Room 101');
    if (engClass && engSubject) {
      insertTimetable.run(engClass.id, engSubject.id, userIds['teacher@school.com'], 1, '10:00', '11:30', 'Room 205');
      insertTimetable.run(engClass.id, engSubject.id, userIds['teacher@school.com'], 3, '10:00', '11:30', 'Room 205');
    }
  }

  // Create demo attendance
  if (mathClass) {
    const today = new Date().toISOString().split('T')[0];
    db.prepare('INSERT OR IGNORE INTO attendance (user_id, class_id, date, status, marked_by) VALUES (?, ?, ?, ?, ?)')
      .run(userIds['student@school.com'], mathClass.id, today, 'present', userIds['teacher@school.com']);
  }

  // Academic Year & Semester
  db.prepare('INSERT INTO academic_years (name, start_date, end_date, is_current) VALUES (?, ?, ?, ?)')
    .run('2026-2027', '2026-06-01', '2027-03-31', 1);
  const ayId = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get()?.id;
  if (ayId) {
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)')
      .run(ayId, 'Semester 1', '2026-06-01', '2026-10-31', 1);
    db.prepare('INSERT INTO semesters (academic_year_id, name, start_date, end_date, is_current) VALUES (?, ?, ?, ?, ?)')
      .run(ayId, 'Semester 2', '2026-11-01', '2027-03-31', 0);
  }

  // Courses
  if (mathClass && mathSubject) {
    db.prepare('INSERT INTO courses (class_id, subject_id, title, description) VALUES (?, ?, ?, ?)')
      .run(mathClass.id, mathSubject.id, 'Algebra Fundamentals', 'Introduction to algebraic expressions and equations');
    const courseId = db.prepare('SELECT id FROM courses WHERE class_id = ?').get(mathClass.id)?.id;
    if (courseId) {
      // Lessons
      db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)').run(courseId, 'Variables & Expressions', 'Understanding variables and algebraic expressions', 1);
      db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)').run(courseId, 'Solving Equations', 'Linear equations and methods to solve them', 2);
      db.prepare('INSERT INTO lessons (course_id, title, content, lesson_order) VALUES (?, ?, ?, ?)').run(courseId, 'Word Problems', 'Applying algebra to real-world problems', 3);

      // Assignment
      db.prepare('INSERT INTO assignments (course_id, title, description, due_date, max_score, created_by) VALUES (?, ?, ?, ?, ?, ?)')
        .run(courseId, 'Algebra Homework 1', 'Complete exercises 1-10 on page 25', '2026-07-15', 100, userIds['teacher@school.com']);

      // Quiz
      db.prepare('INSERT INTO quizzes (course_id, title, description, time_limit_minutes, max_score, due_date, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(courseId, 'Algebra Basics Quiz', 'Test your understanding of basic algebra', 30, 50, '2026-07-20', userIds['teacher@school.com']);
      const quizId = db.prepare('SELECT id FROM quizzes WHERE course_id = ?').get(courseId)?.id;
      if (quizId) {
        db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(quizId, 'What is x if 2x = 10?', 'mcq', JSON.stringify(['3','5','10','20']), '5', 10, 1);
        db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(quizId, 'Solve: x + 5 = 12', 'mcq', JSON.stringify(['5','7','12','17']), '7', 10, 2);
        db.prepare('INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points, question_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
          .run(quizId, 'Is 3x + 2 an expression or equation?', 'true_false', JSON.stringify(['Expression','Equation']), 'Expression', 10, 3);
      }
    }
  }
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
