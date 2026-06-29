const { NODE_ENV } = require('../config');

/**
 * Standardized error response handler.
 * In production: returns generic message.
 * In development: returns actual error message for debugging.
 */
function sendError(res, err, fallbackMessage = 'Internal server error', statusCode = 500) {
  const message = NODE_ENV === 'production' ? fallbackMessage : err.message || fallbackMessage;
  console.error(`[ERROR] ${fallbackMessage}:`, err.message || err);
  res.status(statusCode).json({ error: message });
}

module.exports = { sendError };
