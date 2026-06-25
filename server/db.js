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
  `);

  // Seed data if empty (for demo purposes)
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  if (userCount.count === 0) {
    seedDatabase(db);
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
}

module.exports = { getDb, initDatabase };
