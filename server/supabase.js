const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('[supabase.js] SUPABASE_URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('[supabase.js] SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'NOT SET');

// Check if Supabase is configured
const isSupabaseConfigured = !!(supabaseUrl && supabaseKey);

let supabase = null;
let supabaseAdmin = null;

if (isSupabaseConfigured) {
  // Client with anon key (respects RLS)
  supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false
    }
  });

  // Admin client with service key (bypasses RLS) — for migrations, seeding
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  console.log('✅ Supabase client initialized');
  console.log(`   URL: ${supabaseUrl}`);
} else {
  console.log('ℹ️  Supabase not configured — using SQLite');
}

module.exports = {
  supabase,
  supabaseAdmin,
  isSupabaseConfigured,
  getSupabase: () => supabase,
  getSupabaseAdmin: () => supabaseAdmin
};
