// Centralized configuration — all env-dependent values in one place
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// In traditional production (non-Vercel), require an explicit JWT_SECRET
if (!JWT_SECRET && NODE_ENV === 'production' && !process.env.VERCEL) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production without it.');
  process.exit(1);
}

// Deterministic fallback — same across all Vercel cold starts so tokens remain valid
const fallbackSecret = crypto
  .createHash('sha256')
  .update('schoolhub-vercel-fallback-secret-2026')
  .digest('hex');

module.exports = {
  JWT_SECRET: JWT_SECRET || fallbackSecret,
  NODE_ENV,
};
