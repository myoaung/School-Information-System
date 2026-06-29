// Centralized configuration — all env-dependent values in one place
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!JWT_SECRET && NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET environment variable is not set. Refusing to start in production without it.');
  process.exit(1);
}

// In development, generate a random secret per-session (never use a hardcoded default)
const devSecret = crypto.randomBytes(32).toString('hex');

module.exports = {
  JWT_SECRET: JWT_SECRET || devSecret,
  NODE_ENV,
};
