const rateLimit = require('express-rate-limit');
const { db } = require('../data');

// Lock account after 5 failed attempts in 15 minutes
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

// Database-backed account lockout (works in serverless/Vercel)
// Falls back to in-memory if database is unavailable

const failedAttempts = new Map(); // Fallback for SQLite/local dev

async function trackFailedAttempt(email) {
  const now = new Date().toISOString();
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();

  try {
    // Try database first (works in Supabase/serverless)
    await db.run(`INSERT INTO account_lockouts (email, attempt_time) VALUES (?, ?)`, [email, now]);

    // Count recent attempts
    const result = await db.get(
      `SELECT COUNT(*) as count FROM account_lockouts
       WHERE email = ? AND attempt_time > ?`,
      [email, windowStart]
    );

    return result?.count >= LOCKOUT_THRESHOLD;
  } catch (err) {
    // Fallback to in-memory for SQLite
    console.warn('[Lockout] Database unavailable, using in-memory fallback');
    const record = failedAttempts.get(email) || { count: 0, firstAttempt: Date.now() };

    if (Date.now() - record.firstAttempt > LOCKOUT_WINDOW_MS) {
      record.count = 0;
      record.firstAttempt = Date.now();
    }

    record.count++;
    failedAttempts.set(email, record);
    return record.count >= LOCKOUT_THRESHOLD;
  }
}

async function clearFailedAttempts(email) {
  try {
    await db.run(`DELETE FROM account_lockouts WHERE email = ?`, [email]);
  } catch (err) {
    // Fallback to in-memory
    failedAttempts.delete(email);
  }
}

async function isLockedOut(email) {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();

  try {
    // Try database first
    const result = await db.get(
      `SELECT COUNT(*) as count FROM account_lockouts
       WHERE email = ? AND attempt_time > ?`,
      [email, windowStart]
    );

    return result?.count >= LOCKOUT_THRESHOLD;
  } catch (err) {
    // Fallback to in-memory
    const record = failedAttempts.get(email);
    if (!record) return false;

    if (Date.now() - record.firstAttempt > LOCKOUT_WINDOW_MS) {
      failedAttempts.delete(email);
      return false;
    }

    return record.count >= LOCKOUT_THRESHOLD;
  }
}

// Clean up old entries (only runs in traditional server, not serverless)
if (!process.env.VERCEL) {
  setInterval(
    async () => {
      try {
        const cutoff = new Date(Date.now() - LOCKOUT_WINDOW_MS).toISOString();
        await db.run(`DELETE FROM account_lockouts WHERE attempt_time < ?`, [cutoff]);
      } catch (err) {
        // Ignore cleanup errors
      }
    },
    5 * 60 * 1000
  );
}

module.exports = { trackFailedAttempt, clearFailedAttempts, isLockedOut };
