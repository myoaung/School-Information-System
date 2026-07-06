/**
 * Interactive Supabase Setup Script
 *
 * Usage: node server/setup-supabase.js
 *
 * This script helps you configure Supabase for the School Information System.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n🎯 Supabase Setup for School Information System\n');
  console.log('This script will help you configure Supabase.\n');
  console.log('You\'ll need:');
  console.log('  1. A Supabase account (https://supabase.com)');
  console.log('  2. A new project created');
  console.log('  3. Your Project URL and API keys\n');

  const proceed = await question('Ready to start? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\nSetup cancelled. Run this script again when ready.\n');
    rl.close();
    return;
  }

  // Get Supabase credentials
  console.log('\n📋 Enter your Supabase credentials:');
  console.log('   (Find these at Settings → API in your Supabase dashboard)\n');

  const supabaseUrl = await question('Project URL (https://xxx.supabase.co): ');
  if (!supabaseUrl.includes('supabase.co')) {
    console.log('\n❌ Invalid URL. It should look like: https://xxx.supabase.co');
    rl.close();
    return;
  }

  const anonKey = await question('anon/public key: ');
  if (!anonKey.startsWith('eyJ')) {
    console.log('\n❌ Invalid key. It should start with "eyJ"');
    rl.close();
    return;
  }

  const serviceKey = await question('service_role key (optional, press Enter to skip): ');

  // Read existing .env or create new
  const envPath = path.join(__dirname, '.env');
  let envContent = '';

  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
    // Remove existing Supabase lines
    envContent = envContent
      .split('\n')
      .filter(line => !line.startsWith('SUPABASE_'))
      .join('\n');
  }

  // Add Supabase config
  const supabaseConfig = `
# ─── Supabase Configuration ──────────────────────────────────────
SUPABASE_URL=${supabaseUrl}
SUPABASE_ANON_KEY=${anonKey}
${serviceKey ? `SUPABASE_SERVICE_KEY=${serviceKey}` : '# SUPABASE_SERVICE_KEY= (optional)'}
`;

  envContent = envContent.trimEnd() + '\n' + supabaseConfig;

  // Write .env
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file updated with Supabase credentials');

  // Run migration
  console.log('\n🚀 Running database migrations...\n');

  const { isSupabaseConfigured } = require('./supabase');
  if (isSupabaseConfigured) {
    console.log('✅ Supabase client initialized successfully');

    const runMigration = await question('\nRun migrations now? (y/n): ');
    if (runMigration.toLowerCase() === 'y') {
      const { execSync } = require('child_process');
      try {
        execSync('node migrate.js --seed', { cwd: __dirname, stdio: 'inherit' });
        console.log('\n✅ Migrations complete!');
      } catch (err) {
        console.error('\n❌ Migration failed. Check the error above.');
      }
    }
  } else {
    console.log('❌ Could not initialize Supabase client. Check your credentials.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Setup complete!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('  1. Start the server: npm run dev');
  console.log('  2. Open http://localhost:5173');
  console.log('  3. Login with demo accounts (see SUPABASE-SETUP.md)');
  console.log('\nFor more info, see: SUPABASE-SETUP.md\n');

  rl.close();
}

main().catch(console.error);
