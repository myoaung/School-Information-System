const Database = require('better-sqlite3');
const path = require('path');
const { seedDatabase, seedChartOfAccounts, seedCurriculum } = require('./seed');

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
      role TEXT CHECK(role IN ('student', 'teacher', 'admin', 'parent')) NOT NULL,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      grade_id INTEGER REFERENCES grades(id),
      class_id INTEGER REFERENCES classes(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      academic_year_id INTEGER REFERENCES academic_years(id),
      grade_id INTEGER REFERENCES grades(id),
      section TEXT DEFAULT 'A',
      capacity INTEGER DEFAULT 40,
      schedule TEXT,
      room TEXT,
      status TEXT CHECK(status IN ('draft','incomplete','ready','active')) DEFAULT 'draft',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS class_subject_teachers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      class_id INTEGER NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INTEGER NOT NULL REFERENCES subjects(id),
      teacher_id INTEGER REFERENCES users(id),
      academic_year_id INTEGER REFERENCES academic_years(id),
      is_required INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(class_id, subject_id, academic_year_id)
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
      academic_year_id INTEGER REFERENCES academic_years(id),
      weekly_periods INTEGER,
      is_required INTEGER DEFAULT 1,
      UNIQUE(grade_id, subject_id, academic_year_id)
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
      photo_url TEXT,
      blood_type TEXT,
      allergies TEXT,
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

    CREATE TABLE IF NOT EXISTS parent_students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      relationship TEXT DEFAULT 'parent',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(parent_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subject TEXT,
      body TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      title TEXT,
      message TEXT,
      is_read INTEGER DEFAULT 0,
      link TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
      fee_type TEXT NOT NULL,
      amount REAL NOT NULL,
      academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      fee_structure_id INTEGER REFERENCES fee_structures(id) ON DELETE SET NULL,
      amount REAL NOT NULL,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending','paid','overdue','cancelled')),
      due_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      payment_method TEXT,
      reference TEXT,
      paid_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS certificates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('completion','achievement','transcript','graduation')),
      template TEXT,
      data TEXT,
      issued_by INTEGER REFERENCES users(id),
      issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      serial_number TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS teacher_attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      check_in TEXT,
      check_out TEXT,
      status TEXT DEFAULT 'present' CHECK(status IN ('present','absent','late','leave')),
      note TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(teacher_id, date)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER REFERENCES users(id),
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      old_values TEXT,
      new_values TEXT,
      ip_address TEXT,
      user_agent TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

    -- Accounting tables
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
      parent_id INTEGER REFERENCES accounts(id),
      is_active INTEGER DEFAULT 1,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
    CREATE INDEX IF NOT EXISTS idx_accounts_code ON accounts(code);

    CREATE TABLE IF NOT EXISTS journal_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_date TEXT NOT NULL,
      reference TEXT,
      description TEXT NOT NULL,
      status TEXT CHECK(status IN ('draft', 'posted', 'reversed')) DEFAULT 'draft',
      source_type TEXT,
      source_id INTEGER,
      academic_year_id INTEGER,
      posted_by INTEGER REFERENCES users(id),
      posted_at DATETIME,
      reversed_by INTEGER REFERENCES users(id),
      reversed_at DATETIME,
      reversal_reason TEXT,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(entry_date);
    CREATE INDEX IF NOT EXISTS idx_journal_entries_status ON journal_entries(status);

    CREATE TABLE IF NOT EXISTS journal_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      debit REAL DEFAULT 0 CHECK(debit >= 0),
      credit REAL DEFAULT 0 CHECK(credit >= 0),
      description TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_journal_lines_entry ON journal_lines(journal_entry_id);
    CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON journal_lines(account_id);

    CREATE TABLE IF NOT EXISTS accounting_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open',
      closed_by INTEGER REFERENCES users(id),
      closed_at DATETIME,
      academic_year_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bank_reconciliations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      statement_date TEXT NOT NULL,
      statement_balance REAL NOT NULL,
      book_balance REAL NOT NULL,
      difference REAL NOT NULL,
      status TEXT CHECK(status IN ('draft', 'reconciled')) DEFAULT 'draft',
      notes TEXT,
      reconciled_by INTEGER REFERENCES users(id),
      reconciled_at DATETIME,
      created_by INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reconciliation_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reconciliation_id INTEGER NOT NULL REFERENCES bank_reconciliations(id) ON DELETE CASCADE,
      journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
      reconciled INTEGER DEFAULT 0
    );

    -- Student lifecycle tracking
    CREATE TABLE IF NOT EXISTS student_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      from_status TEXT,
      to_status TEXT NOT NULL,
      reason TEXT,
      changed_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_student_status_history_student_id ON student_status_history(student_id);

    -- Account lockout tracking (database-backed for serverless)
    CREATE TABLE IF NOT EXISTS account_lockouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL,
      attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
    CREATE INDEX IF NOT EXISTS idx_account_lockouts_time ON account_lockouts(attempt_time);
  `);

  // ── Migration: Add new columns to existing tables ──
  const classesColumns = db
    .prepare('PRAGMA table_info(classes)')
    .all()
    .map((c) => c.name);
  const migrations = [
    {
      table: 'classes',
      col: 'academic_year_id',
      sql: 'ALTER TABLE classes ADD COLUMN academic_year_id INTEGER REFERENCES academic_years(id)',
    },
    {
      table: 'classes',
      col: 'grade_id',
      sql: 'ALTER TABLE classes ADD COLUMN grade_id INTEGER REFERENCES grades(id)',
    },
    {
      table: 'classes',
      col: 'section',
      sql: "ALTER TABLE classes ADD COLUMN section TEXT DEFAULT 'A'",
    },
    {
      table: 'classes',
      col: 'capacity',
      sql: 'ALTER TABLE classes ADD COLUMN capacity INTEGER DEFAULT 40',
    },
    {
      table: 'classes',
      col: 'status',
      sql: "ALTER TABLE classes ADD COLUMN status TEXT CHECK(status IN ('draft','incomplete','ready','active')) DEFAULT 'draft'",
    },
    {
      table: 'classes',
      col: 'updated_at',
      sql: "ALTER TABLE classes ADD COLUMN updated_at DATETIME DEFAULT ''",
    },
  ];

  for (const m of migrations) {
    if (!classesColumns.includes(m.col)) {
      try {
        db.exec(m.sql);
      } catch (e) {
        /* column may already exist */
      }
    }
  }

  // Seed chart of accounts if empty
  const accountCount = db.prepare('SELECT COUNT(*) as count FROM accounts').get();
  if (accountCount.count === 0) {
    seedChartOfAccounts(db);
  }

  // Seed curriculum data first (subjects needed by seedDatabase)
  const gradeCount = db.prepare('SELECT COUNT(*) as count FROM grades').get();
  if (gradeCount.count === 0) {
    seedCurriculum(db);
  }

  // Seed demo data if empty
  // SECURITY: Only seed in development mode — never on Vercel production
  // Demo passwords like 'password123' are a security risk in production
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0 && process.env.NODE_ENV !== 'production') {
    console.log('Seeding demo database (development only)...');
    seedDatabase(db);
  } else if (userCount.count === 0 && process.env.VERCEL) {
    console.warn('WARNING: Database is empty on Vercel. Create users via /api/auth/register.');
  }

  // Migration: add phone column to users if missing
  try {
    db.prepare('SELECT phone FROM users LIMIT 1').get();
  } catch {
    db.exec('ALTER TABLE users ADD COLUMN phone TEXT');
    console.log('Migration: added phone column to users');
  }

  // Migration: add grade_id and class_id to announcements if missing
  try {
    db.prepare('SELECT grade_id FROM announcements LIMIT 1').get();
  } catch {
    db.exec('ALTER TABLE announcements ADD COLUMN grade_id INTEGER REFERENCES grades(id)');
    db.exec('ALTER TABLE announcements ADD COLUMN class_id INTEGER REFERENCES classes(id)');
    console.log('Migration: added grade_id/class_id to announcements');
  }

  // Migration: add academic_year_id to grade_subjects and update UNIQUE constraint
  try {
    db.prepare('SELECT academic_year_id FROM grade_subjects LIMIT 1').get();
  } catch {
    db.exec(
      'ALTER TABLE grade_subjects ADD COLUMN academic_year_id INTEGER REFERENCES academic_years(id)'
    );
    console.log('Migration: added academic_year_id to grade_subjects');
  }
  try {
    // Check if the old UNIQUE(grade_id, subject_id) constraint exists without academic_year_id
    const tableInfo = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='grade_subjects'")
      .get();
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes('academic_year_id')) {
      // Recreate the table with the new UNIQUE constraint
      db.exec(`
        CREATE TABLE grade_subjects_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          grade_id INTEGER REFERENCES grades(id) ON DELETE CASCADE,
          subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
          academic_year_id INTEGER REFERENCES academic_years(id),
          weekly_periods INTEGER,
          is_required INTEGER DEFAULT 1,
          UNIQUE(grade_id, subject_id, academic_year_id)
        );
        INSERT INTO grade_subjects_new (id, grade_id, subject_id, academic_year_id, weekly_periods, is_required)
        SELECT id, grade_id, subject_id, academic_year_id, weekly_periods, is_required FROM grade_subjects;
        DROP TABLE grade_subjects;
        ALTER TABLE grade_subjects_new RENAME TO grade_subjects;
      `);
      console.log(
        'Migration: updated grade_subjects UNIQUE constraint to include academic_year_id'
      );
    }
  } catch (err) {
    console.error('Migration: grade_subjects constraint update skipped:', err.message);
  }

  // Migration: ensure parent users exist (for existing databases — development only)
  // SECURITY: Never create users with hardcoded passwords in production
  const parentExists = db
    .prepare("SELECT COUNT(*) as count FROM users WHERE role = 'parent'")
    .get();
  if (parentExists.count === 0 && userCount.count > 0 && process.env.NODE_ENV !== 'production') {
    console.log('Migration: Creating demo parent users (development only)...');
    const bcrypt = require('bcryptjs');
    const salt = bcrypt.genSaltSync(10);
    const password = bcrypt.hashSync('password123', salt);
    const insertUser = db.prepare(
      'INSERT OR IGNORE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
    );
    const r1 = insertUser.run('parent@school.com', password, 'U Aye (Parent)', 'parent');
    const r2 = insertUser.run('parent2@school.com', password, 'U Hla (Parent)', 'parent');

    // Link parents to students
    const insertPS = db.prepare(
      'INSERT OR IGNORE INTO parent_students (parent_id, student_id, relationship) VALUES (?, ?, ?)'
    );
    const parentId1 =
      r1.lastInsertRowid ||
      db.prepare("SELECT id FROM users WHERE email = 'parent@school.com'").get()?.id;
    const parentId2 =
      r2.lastInsertRowid ||
      db.prepare("SELECT id FROM users WHERE email = 'parent2@school.com'").get()?.id;
    const student1Id = db
      .prepare("SELECT id FROM users WHERE email = 'student@school.com'")
      .get()?.id;
    const student2Id = db
      .prepare("SELECT id FROM users WHERE email = 'student2@school.com'")
      .get()?.id;
    if (parentId1 && student1Id) insertPS.run(parentId1, student1Id, 'father');
    if (parentId2 && student2Id) insertPS.run(parentId2, student2Id, 'father');

    // Seed fee structures if missing
    const feeCount = db.prepare('SELECT COUNT(*) as count FROM fee_structures').get();
    if (feeCount.count === 0) {
      const ayId = db.prepare('SELECT id FROM academic_years WHERE is_current = 1').get()?.id;
      const g10 = db.prepare("SELECT id FROM grades WHERE code = 'G10'").get()?.id;
      const g9 = db.prepare("SELECT id FROM grades WHERE code = 'G9'").get()?.id;
      if (ayId) {
        const insertFee = db.prepare(
          'INSERT INTO fee_structures (grade_id, fee_type, amount, academic_year_id) VALUES (?, ?, ?, ?)'
        );
        insertFee.run(g10, 'Tuition', 500000, ayId);
        insertFee.run(g10, 'Lab Fee', 50000, ayId);
        insertFee.run(g10, 'Library Fee', 25000, ayId);
        insertFee.run(g9, 'Tuition', 450000, ayId);
      }
    }

    console.log('Parent users migrated successfully');
  }

  console.log('Database initialized successfully');
}

module.exports = { getDb, initDatabase };
