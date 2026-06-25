const bcrypt = require('bcryptjs');
const { getDb, initDatabase } = require('./db');

async function seed() {
  console.log('Initializing database...');
  initDatabase();

  const db = getDb();

  // Clear existing data
  db.exec('DELETE FROM enrollments');
  db.exec('DELETE FROM announcements');
  db.exec('DELETE FROM classes');
  db.exec('DELETE FROM contacts');
  db.exec('DELETE FROM users');

  console.log('Seeding users...');

  // Create users
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('password123', salt);

  const users = [
    { email: 'admin@school.com', name: 'Admin User', role: 'admin' },
    { email: 'teacher@school.com', name: 'Ms. Johnson', role: 'teacher' },
    { email: 'student@school.com', name: 'Aye Aye', role: 'student' },
    { email: 'teacher2@school.com', name: 'Mr. Smith', role: 'teacher' },
    { email: 'student2@school.com', name: 'John Doe', role: 'student' }
  ];

  const insertUser = db.prepare(
    'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)'
  );

  const userIds = {};
  for (const user of users) {
    const result = insertUser.run(user.email, password, user.name, user.role);
    userIds[user.email] = result.lastInsertRowid;
  }

  console.log('Seeding classes...');

  // Create classes
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
    },
    {
      name: 'Science Lab',
      description: 'Hands-on experiments and scientific methods',
      teacher_id: userIds['teacher2@school.com'],
      schedule: 'Wed/Fri 14:00-15:30',
      room: 'Lab 301'
    }
  ];

  const insertClass = db.prepare(
    'INSERT INTO classes (name, description, teacher_id, schedule, room) VALUES (?, ?, ?, ?, ?)'
  );

  const classIds = [];
  for (const cls of classes) {
    const result = insertClass.run(cls.name, cls.description, cls.teacher_id, cls.schedule, cls.room);
    classIds.push(result.lastInsertRowid);
  }

  console.log('Seeding enrollments...');

  // Enroll students in classes
  const insertEnrollment = db.prepare(
    'INSERT INTO enrollments (class_id, student_id) VALUES (?, ?)'
  );

  insertEnrollment.run(classIds[0], userIds['student@school.com']);
  insertEnrollment.run(classIds[1], userIds['student@school.com']);
  insertEnrollment.run(classIds[2], userIds['student@school.com']);
  insertEnrollment.run(classIds[0], userIds['student2@school.com']);
  insertEnrollment.run(classIds[2], userIds['student2@school.com']);

  console.log('Seeding announcements...');

  // Create announcements
  const announcements = [
    {
      title: 'Welcome to the New School Year!',
      content: 'We are excited to welcome all students and staff to the 2026-2027 school year. Please check your schedules and come prepared on the first day.',
      author_id: userIds['admin@school.com']
    },
    {
      title: 'Mathematics Quiz Next Week',
      content: 'There will be a quiz on algebra fundamentals next Wednesday. Please review chapters 1-3 and practice the sample problems.',
      author_id: userIds['teacher@school.com']
    },
    {
      title: 'Science Fair Registration Open',
      content: 'Registration for the annual science fair is now open. Submit your project proposals by the end of the month.',
      author_id: userIds['admin@school.com']
    },
    {
      title: 'Library Hours Extended',
      content: 'The school library will now be open until 6 PM on weekdays to support student study needs.',
      author_id: userIds['admin@school.com']
    },
    {
      title: 'Parent-Teacher Conference',
      content: 'Parent-teacher conferences will be held next Friday from 2-5 PM. Please schedule your appointments through the school office.',
      author_id: userIds['teacher@school.com']
    }
  ];

  const insertAnnouncement = db.prepare(
    'INSERT INTO announcements (title, content, author_id) VALUES (?, ?, ?)'
  );

  for (const announcement of announcements) {
    insertAnnouncement.run(announcement.title, announcement.content, announcement.author_id);
  }

  console.log('Seed completed successfully!');
  console.log('\nTest accounts (password: password123):');
  console.log('- admin@school.com (Admin)');
  console.log('- teacher@school.com (Teacher)');
  console.log('- student@school.com (Student)');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
