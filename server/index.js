// Skip dotenv in test mode — setup.js controls env vars
if (process.env.NODE_ENV !== 'test') {
  require('dotenv').config();
}
const { initSentry, Sentry } = require('./sentry');
initSentry();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { initDatabase } = require('./db');
const { db } = require('./data');
const { NODE_ENV } = require('./config');
const { isSupabaseConfigured } = require('./supabase');

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
const aiReportRoutes = require('./routes/ai-reports');
const aiAnalyticsRoutes = require('./routes/ai-analytics');
const aiScheduleRoutes = require('./routes/ai-schedule');
const parentRoutes = require('./routes/parent');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const financeRoutes = require('./routes/finance');
const certificateRoutes = require('./routes/certificates');
const auditRoutes = require('./routes/audit');
const teacherWorkloadRoutes = require('./routes/teacher-workload');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Security Middleware ──
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://raw.githubusercontent.com'],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

// ── CORS ──
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

// Production origins for Vercel deployment
const productionOrigins = [
  'https://schoolhub-mu.vercel.app',
  'https://www.schoolhub-mu.vercel.app',
];

app.use(
  cors({
    origin: process.env.VERCEL
      ? process.env.NODE_ENV === 'production'
        ? productionOrigins
        : [...productionOrigins, 'http://localhost:5173', 'http://localhost:5174']
      : allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Redirect HTTP to HTTPS in production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https' && !process.env.VERCEL) {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// ── Request Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──
if (NODE_ENV !== 'test') {
  app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ── Rate Limiting ──
// Global API limiter — prevents brute-force across all routes
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' },
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many submissions. Please try again later.' },
});

const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: { error: 'Too many messages. Please try again later.' },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 60,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Database Init ──
if (isSupabaseConfigured) {
  console.log('📦 Using Supabase PostgreSQL');
} else {
  console.log('📦 Using local SQLite');
  try {
    initDatabase();
  } catch (err) {
    console.error('Database init error:', err);
    if (NODE_ENV === 'production') {
      process.exit(1);
    }
  }
}

// ── Static Files ──
if (!process.env.VERCEL) {
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
}

// Serve built client in production (Docker)
const publicDir = path.join(__dirname, 'public');
if (require('fs').existsSync(publicDir)) {
  app.use(express.static(publicDir));
}

// ── Routes ──
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/contact', contactLimiter, contactRoutes);
app.use('/api/curriculum', curriculumRoutes);
app.use('/api/chat', chatLimiter, chatRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/teachers/workload', teacherWorkloadRoutes);
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
app.use('/api/ai', aiLimiter, aiReportRoutes);
app.use('/api/ai', aiLimiter, aiAnalyticsRoutes);
app.use('/api/ai', aiLimiter, aiScheduleRoutes);
app.use('/api/parent', parentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/upload', uploadRoutes);

// ── Health Check ──
app.get('/api/health', async (req, res) => {
  const healthcheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: require('./package.json').version || '1.0.0',
    database: isSupabaseConfigured ? 'supabase' : 'sqlite',
    supabase_url: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
    supabase_anon: process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
    supabase_service: process.env.SUPABASE_SERVICE_KEY ? 'SET' : 'NOT SET',
  };

  // Check database connectivity
  try {
    await db.get('SELECT 1 as ok');
    healthcheck.database_status = 'connected';
  } catch (err) {
    healthcheck.status = 'degraded';
    healthcheck.database_status = 'disconnected';
  }

  const statusCode = healthcheck.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(healthcheck);
});

// ── 404 Handler ──
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// SPA fallback — serve index.html for client-side routing
if (require('fs').existsSync(publicDir)) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}

// ── Sentry Error Handler ──
if (process.env.SENTRY_DSN) {
  app.use(Sentry.Handlers.errorHandler());
}

// ── Global Error Handler ──
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  if (NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
});

// ── Server Start ──
if (process.env.VERCEL !== '1' && require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${NODE_ENV}]`);
  });

  // Graceful shutdown
  const shutdown = (signal) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('HTTP server closed.');
      // SQLite cleanup (Supabase handles its own connections)
      if (!isSupabaseConfigured) {
        try {
          const { getDb } = require('./db');
          getDb().close();
          console.log('Database connection closed.');
        } catch {}
      }
      process.exit(0);
    });
    // Force exit after 10s
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

// Process-level error handlers
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  if (NODE_ENV === 'production') process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
  if (NODE_ENV === 'production') process.exit(1);
});

// Export for Vercel serverless
module.exports = app;
