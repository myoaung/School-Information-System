const path = require('path');
const fs = require('fs');

// Use a test database — force SQLite, disable Supabase
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-for-testing-only';

// Clear Supabase vars BEFORE any module loads (dotenv will set them from .env)
// We delete them again after modules load to force SQLite mode
const clearSupabase = () => {
  delete process.env.SUPABASE_URL;
  delete process.env.SUPABASE_ANON_KEY;
  delete process.env.SUPABASE_SERVICE_KEY;
};
clearSupabase();

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
