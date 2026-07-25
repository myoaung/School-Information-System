# Remaining fix.md Items — Implementation Plan

## Item 1: Health Endpoint Disclosure
**Status:** Already minimal — exposes `status`, `timestamp`, `uptime`, `environment`, `version`, `database`. No secrets.
**Action:** No change needed. ✅ Already complete.

## Item 2: DB Migration Consolidation
**Problem:** 22 migrations mix SQLite (`AUTOINCREMENT`) and PostgreSQL (`SERIAL`, `plpgsql`) syntax.
**Action:**
- Add a `-- dialect: sqlite | postgres` header comment to each migration
- Update `server/migrate.js` to skip migrations whose dialect doesn't match the active database
- This prevents accidentally running SQLite migrations on Supabase/Postgres

## Item 3: Supabase RLS Policies
**Problem:** 16 tables have RLS enabled but only 3 have policies (users, students, classes).
**Action:**
- Add RLS policies for all remaining tables in `001_initial_schema.sql`:
  - teachers: teachers read own, admins read all
  - attendance: students read own, teachers read assigned classes, admins all
  - timetable: students/teachers read relevant, admins all
  - announcements: all authenticated read
  - gradebook: students read own, teachers read assigned, admins all
  - assignments/submissions: students read own, teachers read assigned
  - quizzes/quiz_attempts: same pattern
  - messages: participants only
  - notifications: own only
  - chat_messages: own only
  - finance tables: admin/accountant only
  - ai_* tables: admin/teacher only

## Item 4: E2E Playwright Tests
**Current:** 3 files, 145 lines — auth, navigation, smoke.
**Add:**
- `e2e/workflows.spec.js` — Class creation, student enrollment, attendance marking
- `e2e/permissions.spec.js` — Student sees limited data, admin sees all
- `e2e/documents.spec.js` — Document upload and download permissions

## Item 5: Student Data Governance
**Add:**
- `GET /api/students/me/export` — Returns all student data as JSON (profile, grades, attendance, assignments)
- `DELETE /api/students/me/data` — Anonymizes or deletes student data (GDPR-style)
- Privacy notice in health endpoint or as a static page

## Files Modified
- `server/migrations/*.sql` — Add dialect header comments
- `server/migrate.js` — Add dialect filtering
- `server/migrations/001_initial_schema.sql` — Add RLS policies
- `server/routes/students.js` — Add export endpoint
- `e2e/workflows.spec.js` — New file
- `e2e/permissions.spec.js` — New file
- `e2e/documents.spec.js` — New file
