const Sentry = require('@sentry/node');

function initSentry() {
  if (!process.env.SENTRY_DSN) {
    console.log('📊 Sentry not configured — skipping');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: 0.1,
  });

  console.log('📊 Sentry initialized');
}

module.exports = { Sentry, initSentry };
