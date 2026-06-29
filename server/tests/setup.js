const path = require('path');
const fs = require('fs');

// Use a test database
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-testing-only';

const TEST_DB_PATH = path.join(__dirname, 'test.db');

// Clean up test DB
const cleanup = () => {
  try { fs.unlinkSync(TEST_DB_PATH); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-wal'); } catch {}
  try { fs.unlinkSync(TEST_DB_PATH + '-shm'); } catch {}
};

// Run cleanup before tests
cleanup();

module.exports = { TEST_DB_PATH, cleanup };
