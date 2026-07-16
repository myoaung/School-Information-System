// Centralized configuration — all env-dependent values in one place
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// SECURITY: Require JWT_SECRET in production — no fallback allowed
// A deterministic fallback enables token forgery if an attacker knows the code
if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is required in production');
  process.exit(1);
}

// Development-only fallback: use a random secret that changes on each startup
// This ensures tokens are invalidated when the dev server restarts
const devSecret = crypto.randomBytes(32).toString('hex');

module.exports = {
  JWT_SECRET: JWT_SECRET || devSecret,
  NODE_ENV,
};
