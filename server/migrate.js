/**
 * Supabase Migration Runner
 *
 * Usage:
 *   node server/migrate.js              # Run all migrations
 *   node server/migrate.js --seed       # Run migrations + seed data
 *   node server/migrate.js --reset      # Drop all tables + re-run migrations
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { supabaseAdmin, isSupabaseConfigured } = require('./supabase');

async function runMigrations() {
  if (!isSupabaseConfigured) {
    console.log('❌ Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    console.log('   Using local SQLite instead.');
    return false;
  }

  console.log('🚀 Running Supabase migrations...\n');

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📄 Running: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');

    try {
      // Split by semicolons and execute each statement
      const statements = sql.split(';').filter(s => s.trim());

      for (const stmt of statements) {
        if (stmt.trim()) {
          const { error } = await supabaseAdmin.rpc('execute_sql', {
            query: stmt.trim()
          });

          if (error) {
            // Some errors are expected (table already exists, etc.)
            if (error.message?.includes('already exists')) {
              console.log(`   ⏭️  Skipped (already exists)`);
            } else {
              console.error(`   ⚠️  Error: ${error.message}`);
            }
          }
        }
      }

      console.log(`   ✅ Done\n`);
    } catch (err) {
      console.error(`   ❌ Failed: ${err.message}\n`);
    }
  }

  return true;
}

async function seedData() {
  if (!isSupabaseConfigured) {
    console.log('❌ Supabase not configured.');
    return false;
  }

  console.log('🌱 Seeding Supabase database...\n');

  // Check if data exists
  const { count } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (count > 0) {
    console.log(`   ℹ️  Database already has ${count} users. Skipping seed.`);
    return true;
  }

  // Import seed logic from db.js
  const { getDb } = require('./db');
  const sqliteDb = getDb();

  // Extract seed data from SQLite and insert into Supabase
  const tables = [
    'education_levels', 'grades', 'subjects', 'grade_subjects',
    'users', 'students', 'teachers', 'classes', 'enrollments',
    'announcements', 'academic_years', 'semesters', 'holidays',
    'courses', 'lessons', 'resources', 'assignments', 'submissions',
    'quizzes', 'quiz_questions', 'quiz_attempts', 'gradebook',
    'attendance', 'timetable', 'chat_messages', 'contacts',
    'parent_students', 'fee_structures', 'invoices', 'payments',
    'teacher_attendance', 'notifications'
  ];

  for (const table of tables) {
    try {
      const rows = sqliteDb.prepare(`SELECT * FROM ${table}`).all();
      if (rows.length === 0) continue;

      console.log(`   📥 Seeding ${table} (${rows.length} rows)...`);

      // Insert in batches of 100
      for (let i = 0; i < rows.length; i += 100) {
        const batch = rows.slice(i, i + 100);
        const { error } = await supabaseAdmin
          .from(table)
          .insert(batch);

        if (error) {
          console.error(`      ⚠️  Error: ${error.message}`);
        }
      }
    } catch (err) {
      console.error(`   ❌ ${table}: ${err.message}`);
    }
  }

  console.log('\n✅ Seed complete!');
  return true;
}

async function resetDatabase() {
  if (!isSupabaseConfigured) {
    console.log('❌ Supabase not configured.');
    return false;
  }

  console.log('⚠️  Resetting Supabase database...\n');

  const tables = [
    'notifications', 'messages', 'chat_messages', 'contacts',
    'payments', 'invoices', 'fee_structures', 'certificates',
    'ai_interventions', 'ai_alerts', 'ai_reports',
    'quiz_attempts', 'quiz_questions', 'quizzes',
    'submissions', 'assignments', 'lessons', 'resources', 'courses',
    'enrollments', 'classes', 'teachers', 'students', 'users',
    'gradebook', 'grade_subjects', 'subjects', 'grades', 'education_levels',
    'parent_students', 'teacher_attendance', 'attendance', 'timetable',
    'semesters', 'holidays', 'academic_years', 'announcements'
  ];

  for (const table of tables) {
    const { error } = await supabaseAdmin
      .from(table)
      .delete()
      .neq('id', 0); // Delete all rows

    if (error) {
      console.error(`   ⚠️  ${table}: ${error.message}`);
    } else {
      console.log(`   🗑️  Cleared ${table}`);
    }
  }

  console.log('\n✅ Reset complete. Run migrations again:');
  console.log('   node server/migrate.js\n');
  return true;
}

// ─── CLI ──────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--reset')) {
    await resetDatabase();
    await runMigrations();
    if (args.includes('--seed')) {
      await seedData();
    }
  } else {
    const success = await runMigrations();
    if (success && args.includes('--seed')) {
      await seedData();
    }
  }
}

main().catch(console.error);
