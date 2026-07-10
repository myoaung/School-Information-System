// Centralized configuration — all env-dependent values in one place
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Warn if JWT_SECRET is not set in production, but don't crash
// (Vercel serverless may not have it configured yet)
if (!JWT_SECRET && NODE_ENV === 'production') {
  console.warn(
    '⚠️ JWT_SECRET not set in production — using random fallback. Tokens will not persist across cold starts.'
  );
}

// Random fallback — generates a new secret per cold start if not configured
const resolvedSecret = JWT_SECRET || crypto.randomBytes(32).toString('hex');

module.exports = {
  JWT_SECRET: resolvedSecret,
  NODE_ENV,
};
