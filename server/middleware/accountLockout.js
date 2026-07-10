const rateLimit = require('express-rate-limit');

// Track failed login attempts per email
const failedAttempts = new Map();

// Lock account after 5 failed attempts in 15 minutes
const LOCKOUT_THRESHOLD = 5;
const LOCKOUT_WINDOW = 15 * 60 * 1000; // 15 minutes

function trackFailedAttempt(email) {
  const now = Date.now();
  const record = failedAttempts.get(email) || { count: 0, firstAttempt: now };

  // Reset if window expired
  if (now - record.firstAttempt > LOCKOUT_WINDOW) {
    record.count = 0;
    record.firstAttempt = now;
  }

  record.count++;
  failedAttempts.set(email, record);

  return record.count >= LOCKOUT_THRESHOLD;
}

function clearFailedAttempts(email) {
  failedAttempts.delete(email);
}

function isLockedOut(email) {
  const record = failedAttempts.get(email);
  if (!record) return false;

  // Check if window expired
  if (Date.now() - record.firstAttempt > LOCKOUT_WINDOW) {
    failedAttempts.delete(email);
    return false;
  }

  return record.count >= LOCKOUT_THRESHOLD;
}

// Clean up old entries every 5 minutes
setInterval(
  () => {
    const now = Date.now();
    for (const [email, record] of failedAttempts) {
      if (now - record.firstAttempt > LOCKOUT_WINDOW) {
        failedAttempts.delete(email);
      }
    }
  },
  5 * 60 * 1000
);

module.exports = { trackFailedAttempt, clearFailedAttempts, isLockedOut };
