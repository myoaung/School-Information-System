require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDatabase } = require('./db');

// Import routes
const authRoutes = require('./routes/auth');
const announcementRoutes = require('./routes/announcements');
const classRoutes = require('./routes/classes');
const contactRoutes = require('./routes/contact');
const curriculumRoutes = require('./routes/curriculum');
const chatRoutes = require('./routes/chat');
const studentRoutes = require('./routes/students');
const teacherRoutes = require('./routes/teachers');
const attendanceRoutes = require('./routes/attendance');
const timetableRoutes = require('./routes/timetable');
const academicRoutes = require('./routes/academic');
const courseRoutes = require('./routes/courses');
const assignmentRoutes = require('./routes/assignments');
const quizRoutes = require('./routes/quizzes');
const gradebookRoutes = require('./routes/gradebook');
const reportsRoutes = require('./routes/reports');
const resourceRoutes = require('./routes/resources');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
try {
  initDatabase();
} catch (err) {
  console.error('Database init error:', err);
}

// Static files for uploads (skip on Vercel — ephemeral /tmp)
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/academic', academicRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/gradebook', gradebookRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/resources', resourceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// For local development only
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export for Vercel serverless
module.exports = app;
