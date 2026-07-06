# Supabase Setup Guide — School Information System

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Create Supabase Project](#create-supabase-project)
4. [Get API Credentials](#get-api-credentials)
5. [Configure Environment](#configure-environment)
6. [Run Migrations](#run-migrations)
7. [Seed Demo Data](#seed-demo-data)
8. [Verify Setup](#verify-setup)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The School Information System supports two database modes:

| Mode | Database | Use Case |
|------|----------|----------|
| **Local (default)** | SQLite | Development, testing |
| **Cloud** | Supabase PostgreSQL | Production, team collaboration |

When `SUPABASE_URL` is set in your `.env`, the app automatically uses Supabase. Otherwise, it uses local SQLite.

---

## Prerequisites

- [Node.js](https://nodejs.org) v18+ installed
- A free [Supabase](https://supabase.com) account
- Project dependencies installed (`npm install` in `server/`)

---

## Create Supabase Project

### Step 1: Sign Up / Log In

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign up with GitHub, email, or Google

### Step 2: Create New Project

1. Click **"New Project"**
2. Fill in the details:

| Field | Value |
|-------|-------|
| **Organization** | Select or create one |
| **Project name** | `school-information-system` |
| **Database password** | Generate a strong password (save it!) |
| **Region** | Choose closest to your users |

3. Click **"Create new project"**
4. Wait 1-2 minutes for provisioning

---

## Get API Credentials

### Step 1: Navigate to API Settings

1. In your project dashboard, go to **Settings** (gear icon)
2. Click **API** in the left sidebar

### Step 2: Copy Credentials

You'll need two keys:

| Key | Where to Find | Purpose |
|-----|---------------|---------|
| **Project URL** | `Settings → API → Project URL` | `SUPABASE_URL` |
| **anon/public key** | `Settings → API → Project API keys → anon public` | `SUPABASE_ANON_KEY` |
| **service_role key** | `Settings → API → Project API keys → service_role` | `SUPABASE_SERVICE_KEY` |

> ⚠️ **Important:** The `service_role` key bypasses Row Level Security. Keep it secret!

Example values:
```
SUPABASE_URL=https://abc123xyz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Configure Environment

### Step 1: Create `.env` File

```bash
cd server
cp ../.env.example .env
```

### Step 2: Add Supabase Credentials

Edit `server/.env` and add:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-key-here

# Keep your other settings
JWT_SECRET=your-jwt-secret
ANTHROPIC_API_KEY=your-anthropic-key
```

### Step 3: Verify `.env` is in `.gitignore`

```bash
# Make sure .env is not committed
echo ".env" >> ../.gitignore
```

---

## Run Migrations

### Option A: Using the Migration Script (Recommended)

```bash
cd server

# Run migrations only
node migrate.js

# Run migrations + seed demo data
node migrate.js --seed
```

### Option B: Using Supabase Dashboard

1. Go to **SQL Editor** in your Supabase dashboard
2. Open the migration file: `server/migrations/001_initial_schema.sql`
3. Copy the entire SQL content
4. Paste into the SQL Editor
5. Click **"Run"**

### What the Migration Creates

| Tables | Count |
|--------|-------|
| Core tables | `users`, `students`, `teachers`, `classes` |
| Academic tables | `courses`, `lessons`, `assignments`, `quizzes`, `gradebook` |
| Schedule tables | `timetable`, `attendance`, `academic_years`, `semesters` |
| Feature tables | `announcements`, `messages`, `notifications`, `chat_messages` |
| Finance tables | `invoices`, `payments`, `fee_structures` |
| AI tables | `ai_reports`, `ai_alerts`, `ai_interventions` |
| **Total** | **22+ tables** |

---

## Seed Demo Data

After migrations, seed demo data:

```bash
cd server
node migrate.js --seed
```

This creates:

| Data | Count |
|------|-------|
| Users | 8 (1 admin, 3 teachers, 4 students) |
| Classes | 4 |
| Courses | 4 |
| Assignments | 4 |
| Quizzes | 3 |
| Attendance records | 20+ |
| Timetable entries | 10 |
| Announcements | 5 |

### Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | password123 |
| Teacher | teacher@school.com | password123 |
| Student | student@school.com | password123 |

---

## Verify Setup

### Step 1: Start the Server

```bash
cd server
npm run dev
```

You should see:
```
📦 Using Supabase PostgreSQL
✅ Supabase client initialized
   URL: https://your-project.supabase.co
Server running on port 5000 [development]
```

### Step 2: Test Health Endpoint

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "supabase",
  "database_status": "connected"
}
```

### Step 3: Test Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@school.com", "password": "password123"}'
```

---

## Row Level Security (RLS)

The migration includes RLS policies for data protection.

### Default Policies

| Table | Policy | Effect |
|-------|--------|--------|
| `users` | Users can view own profile | Read own data |
| `students` | Students can view own data | Read own profile |
| `classes` | Teachers can view assigned classes | Read own classes |

### Using Service Key (Admin Operations)

For admin operations that bypass RLS, the app uses `SUPABASE_SERVICE_KEY`:

```javascript
const { supabaseAdmin } = require('./supabase');
// supabaseAdmin bypasses all RLS policies
```

### Customizing RLS

1. Go to **Authentication → Policies** in Supabase dashboard
2. Select a table
3. Add/edit policies as needed

Example: Allow teachers to view their students:
```sql
CREATE POLICY "Teachers view their students" ON students
  FOR SELECT USING (
    grade_id IN (
      SELECT grade_id FROM classes WHERE teacher_id = auth.uid()
    )
  );
```

---

## Troubleshooting

### Issue: "relation does not exist"

**Cause:** Migrations haven't been run.

**Fix:**
```bash
node migrate.js
```

### Issue: "permission denied for table"

**Cause:** RLS is blocking access.

**Fix:** Use `SUPABASE_SERVICE_KEY` for admin operations, or add appropriate RLS policies.

### Issue: "new row violates row-level security policy"

**Cause:** The anon key doesn't have INSERT permission.

**Fix:**
1. Disable RLS temporarily for testing:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```
2. Or add an INSERT policy for authenticated users

### Issue: Connection timeout

**Cause:** Network or firewall issue.

**Fix:**
1. Check your internet connection
2. Verify `SUPABASE_URL` is correct
3. Check Supabase status at [https://status.supabase.com](https://status.supabase.com)

### Issue: "Invalid API key"

**Cause:** Wrong key or key expired.

**Fix:**
1. Go to **Settings → API** in Supabase dashboard
2. Regenerate keys if needed
3. Update `.env` with new keys

---

## Development Workflow

### Local Development (SQLite)

```bash
# No SUPABASE_URL in .env → uses SQLite automatically
cd server
npm run dev
```

### Production (Supabase)

```bash
# Add SUPABASE_URL to .env
cd server
npm start
```

### Switching Between Modes

Just add/remove `SUPABASE_URL` from your `.env`:

```bash
# Use Supabase
SUPABASE_URL=https://xxx.supabase.co

# Use SQLite (comment out or remove)
# SUPABASE_URL=
```

---

## Useful Supabase Dashboard Links

| Feature | URL Pattern |
|---------|-------------|
| **Table Editor** | `https://supabase.com/dashboard/project/_/editor` |
| **SQL Editor** | `https://supabase.com/dashboard/project/_/sql` |
| **Authentication** | `https://supabase.com/dashboard/project/_/auth/users` |
| **Storage** | `https://supabase.com/dashboard/project/_/storage/buckets` |
| **API Docs** | `https://supabase.com/dashboard/project/_/api` |

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Configure `.env`
3. ✅ Run migrations
4. ✅ Seed demo data
5. 🚀 Deploy to Vercel with Supabase

---

## Support

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://supabase.com/discord)
- [Project README](./README.md)
