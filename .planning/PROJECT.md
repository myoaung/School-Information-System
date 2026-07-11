# School Information System

## Project Overview

Enterprise-ready, Myanmar-focused School Information System supporting complete daily school operations with role-specific workflows, bilingual support, and offline-first architecture.

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js + Node.js
- **Database:** SQLite (local) / Supabase (production)
- **AI:** Claude API (Anthropic)
- **Deployment:** Vercel (frontend) + Supabase (database)

## Current Status

**Phase:** Production-ready with core features implemented
**Completion:** ~75% against PRD

## Implemented Features

### Core School Operations ✅
- Student lifecycle (applicant → active → graduated → archived)
- Teacher management with workload tracking
- Parent portal with child monitoring
- Curriculum & grade management
- Class management with subject-teacher assignments
- Attendance (manual + QR code)
- Timetable with conflict detection
- Assignments & quizzes with auto-grading
- Gradebook with GPA computation
- Report cards (AI-generated narratives)

### Financial Management ✅
- Fee structures & invoicing
- Payment collection & tracking
- Expense tracking & approval workflow
- Financial summaries & reports

### Communication ✅
- Multi-channel notifications (in-app, email, SMS)
- Internal messaging
- Announcements with comments
- AI-powered chatbot

### Operations ✅
- Document management with versioning
- Library management (catalog, borrow/return)
- Inventory management (issue/return, maintenance)
- Leave management workflow
- Audit logging

### AI Features ✅
- Natural language query interface
- Predictive analytics (at-risk students)
- AI report generation
- AI timetable scheduling
- Offline-first PWA support

## Remaining Features (from PRD)

### HR Portal
- Recruitment & onboarding
- Contracts management
- Payroll integration
- Performance reviews
- Employee self-service

### Finance Portal
- Daily cash control
- Budgeting
- Accounting integration
- Accounts receivable

### Academic
- Class readiness rules (Draft → Incomplete → Ready → Active)
- Grade-appropriate student experience

### CTO
- Backup & restore
- Monitoring dashboard

## Architecture Notes

- Single-school deployment (multi-school out of scope per PRD)
- SQLite for local development, Supabase for production
- All new tables must work on both SQLite and PostgreSQL
- Use `CURRENT_DATE` instead of `date('now')` for PostgreSQL compatibility
- Use `is_read` column name for notifications (not `read`)
