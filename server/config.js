// Centralized configuration — all env-dependent values in one place
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Deterministic fallback: derive from existing env vars so tokens persist
// across Vercel cold starts. Falls back to a stable seed if no env vars.
const fallbackSource =
  process.env.SUPABASE_URL ||
  process.env.VERCEL_GIT_COMMIT_SHA ||
  'schoolhub-production-fallback-2026';
const fallbackSecret = crypto.createHash('sha256').update(fallbackSource).digest('hex');

module.exports = {
  JWT_SECRET: JWT_SECRET || fallbackSecret,
  NODE_ENV,
};
