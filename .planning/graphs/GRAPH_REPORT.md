# Graph Report - School-Information-System  (2026-07-30)

## Corpus Check
- 260 files · ~254,043 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1841 nodes · 2758 edges · 176 communities (133 shown, 43 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 53 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `22b59cad`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- seed-bulk.js
- server/index.js
- App.jsx
- useAuth
- dependencies
- DesignSystemGenerator
- api.ts
- UI/UX Pro Max - Design Intelligence
- useTranslation
- validate.js
- documents.js
- chat.js
- middleware/audit.js
- middleware/rbac.js
- Security Audit Report
- middleware/auth.js
- Chapter 6 — How to Submit (Personal Project)
- compilerOptions
- Curriculum by Grade
- errorHandler.js
- ai-schedule.js
- ai-analytics.js
- notifications.js
- db
- ai-reports.js
- School Information System: Analysis and Improvement Report
- devDependencies
- School Information System
- data.js
- sendError
- Fix 4: Route Bugs (Tests Fail — must fix for CI to pass)
- dependencies
- Agent Evaluation
- ErrorBoundary
- offlineDb.ts
- package.json
- dependencies
- devDependencies
- hr.js
- HomePage.jsx
- react
- scripts
- Quality & Polish Plan — Error Handling & Resilience
- recruitment.js
- tech-stack.md
- .mcp.json
- db.js
- certificates.js
- inventory.js
- students.js
- training.js
- vercel.json
- manifest.json
- tools/package.json
- 🏫 SchoolHub — School Information System
- gradebook.js
- cash-control.js
- expenses.js
- qr-attendance.js
- resources.js
- users.js
- 2. Student Registration Fields in Myanmar
- classes.js
- contact.js
- attendance.js
- accounting.js
- budgeting.js
- teachers.js
- Supabase Setup Guide — School Information System
- i18n Localization Plan — EN + Myanmar
- Remaining fix.md Items — Implementation Plan
- .oxlintrc.json
- AI Feature Update — School Information System
- Phase 4: Predictive Analytics
- library.js
- ch-6 Personal Project — Report
- ch-6 Personal Project — Report
- Development Workflow
- StudentDetailPage.jsx
- scripts
- main.jsx
- DocumentsPage.jsx
- HRPage.jsx
- LoginPage.test.jsx
- MyProfilePage.jsx
- Phase 3: AI Report Generation
- Phase 5: AI Scheduling
- User Interview — SchoolHub
- 01-01-PLAN.md
- setup-supabase.js
- Brainstorming Ideas Into Designs
- Proposal Workflow
- RecruitmentPage.jsx
- TrainingPage.jsx
- Phase 1: AI Chatbot
- Phase 2: Natural Language Query Interface
- server/tests/setup.js
- pitch.md
- Troubleshooting
- daily-standup.js
- client/package.json
- ExpensePage.jsx
- Usage Examples
- Technical Architecture
- screenshot.mjs
- React + Vite
- OfflineIndicator.tsx
- FontContext.jsx
- TeacherWorkloadPage.jsx
- Frontend Integration
- 🚀 Getting Started
- Configure Environment
- Row Level Security (RLS)
- Development Workflow
- Run Migrations
- Verify Setup
- file-renamer.js
- lint-staged
- repository
- server/sentry.js
- ai-analytics.test.js
- ai-chat.test.js
- ai-reports.test.js
- ai-schedule.test.js
- assignments.test.js
- auth.test.js
- certificates.test.js
- courses.test.js
- finance.test.js
- health.test.js
- messages.test.js
- notifications.test.js
- parent.test.js
- quizzes.test.js
- reports.test.js
- students.test.js
- Create Supabase Project
- Get API Credentials
- api/index.js
- api-contract/SKILL.md
- blog-generator/SKILL.md
- changelog-automation/SKILL.md
- csv-cleaner/SKILL.md
- daily-standup/SKILL.md
- data-validate/SKILL.md
- deploy-checklist/SKILL.md
- file-renamer/SKILL.md
- flashcard-maker/SKILL.md
- release-notes/SKILL.md
- reply-templates/SKILL.md
- slide-maker/SKILL.md
- study-notes/SKILL.md
- style-guide/SKILL.md
- tailwindcss
- @testing-library/jest-dom
- @testing-library/user-event
- vite-plugin-pwa
- @vitejs/plugin-react
- vitest
- randDate
- server/vitest.config.js

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 75 edges
2. `react` - 64 edges
3. `useTranslation()` - 62 edges
4. `db` - 56 edges
5. `api` - 49 edges
6. `authMiddleware()` - 45 edges
7. `sendError()` - 45 edges
8. `requirePermission()` - 41 edges
9. `Modal()` - 24 edges
10. `auditLog()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `ExpensePage()` --calls--> `useAuth()`  [EXTRACTED]
  client/src/pages/ExpensePage.jsx → client/src/context/AuthContext.tsx
- `HomePage()` --calls--> `useTranslation()`  [EXTRACTED]
  client/src/pages/HomePage.jsx → client/src/context/LanguageContext.jsx
- `ChatWidget()` --calls--> `useAuth()`  [EXTRACTED]
  client/src/components/ChatWidget.jsx → client/src/context/AuthContext.tsx
- `Navbar()` --calls--> `useAuth()`  [EXTRACTED]
  client/src/components/Navbar.jsx → client/src/context/AuthContext.tsx
- `Navbar()` --calls--> `useTranslation()`  [EXTRACTED]
  client/src/components/Navbar.jsx → client/src/context/LanguageContext.jsx

## Import Cycles
- None detected.

## Communities (176 total, 43 thin omitted)

### Community 0 - "seed-bulk.js"
Cohesion: 0.02
Nodes (93): allClasses, allCourses, allFees, allTeachers, allUsers, annContents, annTitles, assignmentTitles (+85 more)

### Community 1 - "server/index.js"
Cohesion: 0.03
Nodes (63): academicRoutes, accountingRoutes, accountsReceivableRoutes, aiAnalyticsRoutes, aiLimiter, aiReportRoutes, aiScheduleRoutes, announcementRoutes (+55 more)

### Community 2 - "App.jsx"
Cohesion: 0.04
Nodes (48): AcademicPage, AccountingPage, AccountsReceivablePage, AnalyticsPage, AnnouncementDetailPage, AnnouncementsPage, AssignmentsPage, AttendancePage (+40 more)

### Community 3 - "useAuth"
Cohesion: 0.06
Nodes (34): ProtectedRoute(), ProtectedRouteProps, AuthContext, AuthContextType, AuthProviderProps, useAuth(), User, AnalyticsPage() (+26 more)

### Community 4 - "dependencies"
Cohesion: 0.04
Nodes (46): @anthropic-ai/sdk, bcryptjs, better-sqlite3, cors, dotenv, express, express-rate-limit, express-validator (+38 more)

### Community 5 - "DesignSystemGenerator"
Cohesion: 0.07
Nodes (32): BM25, detect_domain(), _load_csv(), BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query, Load CSV and return list of dicts (+24 more)

### Community 6 - "api.ts"
Cohesion: 0.12
Nodes (19): ConfirmDialog(), Modal(), ModalProps, ACCOUNT_TYPE_COLORS, ACCOUNT_TYPES, STATUS_COLORS, AGING_COLORS, AGING_LABELS (+11 more)

### Community 7 - "UI/UX Pro Max - Design Intelligence"
Cohesion: 0.05
Nodes (40): 1. Accessibility (CRITICAL), 2. Touch & Interaction (CRITICAL), 3. Performance (HIGH), 4. Layout & Responsive (HIGH), 5. Typography & Color (MEDIUM), 6. Animation (MEDIUM), 7. Style Selection (MEDIUM), 8. Charts & Data (LOW) (+32 more)

### Community 8 - "useTranslation"
Cohesion: 0.08
Nodes (25): ChatWidget(), Footer(), LanguageContext, locales, useTranslation(), en, mm, AcademicPage() (+17 more)

### Community 9 - "validate.js"
Cohesion: 0.06
Nodes (34): { body, param, query, validationResult }, courseRules, createStudentRules, createTeacherRules, idParamRules, invoiceRules, lessonRules, loginRules (+26 more)

### Community 10 - "documents.js"
Cohesion: 0.07
Nodes (34): { ensureBucket }, fs, main(), path, resetDatabase(), runMigrations(), seedData(), { supabaseAdmin, isSupabaseConfigured } (+26 more)

### Community 11 - "chat.js"
Cohesion: 0.08
Nodes (32): Anthropic, buildSystemPrompt(), CONFIG, { db }, getAIReply(), getCachedResponse(), getCacheKey(), getClient() (+24 more)

### Community 12 - "middleware/audit.js"
Cohesion: 0.06
Nodes (31): auditLog(), { db }, { auditLog }, { authMiddleware }, { db }, express, { requirePermission }, router (+23 more)

### Community 13 - "middleware/rbac.js"
Cohesion: 0.08
Nodes (26): clearPermCache(), { db }, loadPermissions(), requirePermission(), { authMiddleware }, { db }, express, { requirePermission } (+18 more)

### Community 14 - "Security Audit Report"
Cohesion: 0.07
Nodes (27): Before Production (This Week), C1: Hardcoded Weak JWT Secret, C2: Vercel OIDC Token Exposed in `.env.local`, Compliance Notes, 🔴 Critical Findings, Executive Summary, H1: Demo Accounts with Weak Passwords, H2: Overly Permissive CORS in Production (+19 more)

### Community 15 - "middleware/auth.js"
Cohesion: 0.09
Nodes (23): authMiddleware(), jwt, { JWT_SECRET }, roleMiddleware(), messageRules, { authMiddleware }, { db }, express (+15 more)

### Community 16 - "Chapter 6 — How to Submit (Personal Project)"
Cohesion: 0.08
Nodes (24): Chapter 6 — How to Submit (Personal Project), Common mistakes, ပြီးအောင်လုပ်ရမယ့်အရာတွေ (စစ်ဆေးရန်စာရင်း), အခန်း ၆ — ဘယ်လိုတင်ရမလဲ (ကိုယ်ပိုင် Project), အဆင့် ၁ — open issues တွေ ပိတ်ပါ, အဆင့် ၂ — UI/UX polish လုပ်ပါ, အဆင့် ၃ — Chrome DevTools + Playwright နဲ့ test (web app), အဆင့် ၄ — README polish လုပ်ပါ (+16 more)

### Community 17 - "compilerOptions"
Cohesion: 0.08
Nodes (24): compilerOptions, allowImportingTsExtensions, allowJs, esModuleInterop, forceConsistentCasingInFileNames, isolatedModules, jsx, lib (+16 more)

### Community 18 - "Curriculum by Grade"
Cohesion: 0.09
Nodes (22): Curriculum by Grade, Curriculum Summary, Education Levels, Grade 1, Grade 10, Grade 11, Grade 12, Grade 2 (+14 more)

### Community 19 - "errorHandler.js"
Cohesion: 0.09
Nodes (19): crypto, devSecret, announcementRules, assignmentRules, { announcementRules }, { authMiddleware }, { db }, express (+11 more)

### Community 20 - "ai-schedule.js"
Cohesion: 0.17
Nodes (18): Anthropic, applySchedule(), clearSchedule(), collectConstraints(), CONFIG, { db }, detectConflicts(), generateFallbackSuggestions() (+10 more)

### Community 21 - "ai-analytics.js"
Cohesion: 0.16
Nodes (18): analyzeTrend(), Anthropic, calculateRiskScore(), calculateTrendDirection(), checkAlerts(), CONFIG, { db }, generateFallbackInterventions() (+10 more)

### Community 22 - "notifications.js"
Cohesion: 0.15
Nodes (17): { authMiddleware }, { createAndSend, sendToRole, getStats }, { db }, express, { requirePermission }, router, { sendError }, config (+9 more)

### Community 23 - "db"
Cohesion: 0.13
Nodes (17): db, clearFailedAttempts(), { db }, failedAttempts, isLockedOut(), rateLimit, trackFailedAttempt(), { authMiddleware } (+9 more)

### Community 24 - "ai-reports.js"
Cohesion: 0.15
Nodes (17): aggregateStudentData(), Anthropic, buildReportPrompt(), CONFIG, { db }, generateFallbackNarrative(), generateReportNarrative(), getReports() (+9 more)

### Community 25 - "School Information System: Analysis and Improvement Report"
Cohesion: 0.11
Nodes (17): 1. Introduction, 2.1. User Experience (UX), 2.2. Performance, 2.3. Accessibility, 2.4. Functionality (Admin Role), 2. Live Application Audit, 3.1. Architecture, 3.2. Tech Stack and Dependencies (+9 more)

### Community 26 - "devDependencies"
Cohesion: 0.12
Nodes (17): devDependencies, jsdom, oxlint, @tailwindcss/vite, @testing-library/react, @types/react, @types/react-dom, typescript (+9 more)

### Community 27 - "School Information System"
Cohesion: 0.12
Nodes (16): Academic, AI Features ✅, Architecture Notes, Communication ✅, Core School Operations ✅, CTO, Current Status, Finance Portal (+8 more)

### Community 28 - "data.js"
Cohesion: 0.12
Nodes (10): Database, path, NOTE: For maximum security, consider converting to Supabase query builder, { supabase, supabaseAdmin, isSupabaseConfigured }, { authMiddleware }, { db }, express, { requirePermission } (+2 more)

### Community 29 - "sendError"
Cohesion: 0.12
Nodes (15): { authMiddleware }, { db }, express, { requirePermission }, router, { sendError }, { authMiddleware }, express (+7 more)

### Community 30 - "Fix 4: Route Bugs (Tests Fail — must fix for CI to pass)"
Cohesion: 0.12
Nodes (15): 4a. ai-schedule.js — Missing await on async functions, 4b. ai-reports.js — Missing await on aggregateStudentData, 4c. health endpoint — Missing environment property, 4d. notifications route — Response shape mismatch, 4e. finance test — Student can't access /invoices, 4f. students test — grade_id: 11 not in seed data, Fix, Fix 1: Test Bootstrap — Lazy Directory Creation (+7 more)

### Community 31 - "dependencies"
Cohesion: 0.13
Nodes (15): dependencies, axios, idb, react, react-dom, react-router-dom, @sentry/react, sonner (+7 more)

### Community 32 - "Agent Evaluation"
Cohesion: 0.14
Nodes (13): Adversarial Testing, Agent Evaluation, Anti-Patterns, Behavioral Contract Testing, Capabilities, ❌ Only Happy Path Tests, ❌ Output String Matching, Patterns (+5 more)

### Community 33 - "ErrorBoundary"
Cohesion: 0.15
Nodes (3): ErrorBoundary, ErrorBoundaryProps, ErrorBoundaryState

### Community 34 - "offlineDb.ts"
Cohesion: 0.26
Nodes (13): cacheClear(), cacheDelete(), CacheEntry, cacheGet(), cacheSet(), clearSyncQueue(), getDB(), getSyncQueue() (+5 more)

### Community 35 - "package.json"
Cohesion: 0.14
Nodes (13): allowScripts, @anthropic-ai/claude-code@2.1.218, author, bugs, url, description, homepage, keywords (+5 more)

### Community 36 - "dependencies"
Cohesion: 0.15
Nodes (13): @anthropic-ai/claude-code, codebase-memory-mcp, concurrently, dependencies, @anthropic-ai/claude-code, axios, codebase-memory-mcp, concurrently (+5 more)

### Community 37 - "devDependencies"
Cohesion: 0.15
Nodes (13): husky, lint-staged, devDependencies, husky, lint-staged, @playwright/test, prettier, tailwindcss (+5 more)

### Community 38 - "hr.js"
Cohesion: 0.15
Nodes (12): { auditLog }, { authMiddleware }, CONTRACT_STATUSES, CONTRACT_TYPES, { db }, express, RATINGS, { requirePermission } (+4 more)

### Community 39 - "HomePage.jsx"
Cohesion: 0.20
Nodes (4): AnnouncementCard, HomePage(), mockFormatDateShort, mockT

### Community 40 - "react"
Cohesion: 0.23
Nodes (8): Navbar(), NotificationBell(), useFont(), useTheme(), COLORS, DashboardPage(), StatCard, react

### Community 41 - "scripts"
Cohesion: 0.17
Nodes (12): scripts, build, client, dev, format, format:check, prepare, seed (+4 more)

### Community 42 - "Quality & Polish Plan — Error Handling & Resilience"
Cohesion: 0.17
Nodes (11): Decisions (Locked), Execution Order, Goals, Out of Scope (Deferred), Quality & Polish Plan — Error Handling & Resilience, Task 1: Add toast library (`sonner`), Task 2: Root ErrorBoundary component, Task 3: Standardize server error handling (+3 more)

### Community 43 - "recruitment.js"
Cohesion: 0.17
Nodes (11): APPLICATION_STATUSES, { auditLog }, { authMiddleware }, { db }, EMPLOYMENT_TYPES, express, INTERVIEW_RESULTS, POSTING_STATUSES (+3 more)

### Community 44 - "tech-stack.md"
Cohesion: 0.17
Nodes (11): Architecture, How it's built, automated, and delivered, Lesson Learned, Methodology, MLM + i18n, SchoolHub — Tech Stack, Skills, Subagents (+3 more)

### Community 45 - ".mcp.json"
Cohesion: 0.24
Nodes (10): SUPABASE_ACCESS_TOKEN, npx, codebase-memory, filesystem, playwright, supabase, codebase-memory-mcp, @modelcontextprotocol/server-filesystem (+2 more)

### Community 46 - "db.js"
Cohesion: 0.33
Nodes (9): Database, getDb(), initDatabase(), path, { seedDatabase, seedChartOfAccounts, seedCurriculum }, seedRBAC(), seedChartOfAccounts(), seedCurriculum() (+1 more)

### Community 47 - "certificates.js"
Cohesion: 0.18
Nodes (8): certificateRules, { authMiddleware }, { certificateRules }, { db }, express, { requirePermission }, router, { sendError }

### Community 48 - "inventory.js"
Cohesion: 0.18
Nodes (10): { auditLog }, { authMiddleware }, CATEGORIES, CONDITIONS, { db }, express, MAINTENANCE_TYPES, { requirePermission } (+2 more)

### Community 49 - "students.js"
Cohesion: 0.18
Nodes (10): ALL_STATUSES, { auditLog }, { authMiddleware }, bcrypt, { db }, express, { requirePermission }, router (+2 more)

### Community 50 - "training.js"
Cohesion: 0.18
Nodes (10): ASSIGNMENT_STATUSES, { auditLog }, { authMiddleware }, { db }, express, PROGRAM_STATUSES, RATINGS, { requirePermission } (+2 more)

### Community 51 - "vercel.json"
Cohesion: 0.18
Nodes (10): maxDuration, buildCommand, framework, functions, api/**/*.js, headers, installCommand, outputDirectory (+2 more)

### Community 52 - "manifest.json"
Cohesion: 0.20
Nodes (9): background_color, description, display, icons, name, orientation, short_name, start_url (+1 more)

### Community 53 - "tools/package.json"
Cohesion: 0.20
Nodes (9): commander, bin, standup, dependencies, commander, description, name, type (+1 more)

### Community 54 - "🏫 SchoolHub — School Information System"
Cohesion: 0.20
Nodes (8): 🌐 API Endpoints, 🤝 Contributing, ✨ Features, 📄 License, 📁 Project Structure, 🏫 SchoolHub — School Information System, 📸 Screenshots, 🛠️ Tech Stack

### Community 55 - "gradebook.js"
Cohesion: 0.20
Nodes (9): gradeRules, { auditLog }, { authMiddleware }, { db }, express, { gradeRules }, { requirePermission }, router (+1 more)

### Community 56 - "cash-control.js"
Cohesion: 0.20
Nodes (9): { auditLog }, { authMiddleware }, { db }, express, PAYMENT_METHODS, { requirePermission }, router, { sendError } (+1 more)

### Community 57 - "expenses.js"
Cohesion: 0.20
Nodes (9): { auditLog }, { authMiddleware }, CATEGORIES, { db }, express, PAYMENT_METHODS, { requirePermission }, router (+1 more)

### Community 58 - "qr-attendance.js"
Cohesion: 0.20
Nodes (8): { auditLog }, { authMiddleware }, crypto, { db }, express, { requirePermission }, router, { sendError }

### Community 59 - "resources.js"
Cohesion: 0.20
Nodes (9): { authMiddleware }, { db }, express, fs, multer, path, { requirePermission }, router (+1 more)

### Community 60 - "users.js"
Cohesion: 0.20
Nodes (9): { authMiddleware }, bcrypt, { db }, express, multer, { requirePermission }, router, { sendError } (+1 more)

### Community 61 - "2. Student Registration Fields in Myanmar"
Cohesion: 0.20
Nodes (9): 1.1. Does a Class Need to Map with Curriculum?, 1. Class-Curriculum Mapping, 2.1. Required Fields (Minimum for Official Registration), 2.2. Highly Recommended Fields (for Comprehensive Records), 2.3. Optional/Context-Specific Fields, 2.4. Proposed Schema Adjustments, 2. Student Registration Fields in Myanmar, References (+1 more)

### Community 62 - "classes.js"
Cohesion: 0.22
Nodes (8): classRules, { authMiddleware }, { classRules }, { db }, express, { requirePermission }, router, { sendError }

### Community 63 - "contact.js"
Cohesion: 0.22
Nodes (8): contactRules, { authMiddleware }, { contactRules }, { db }, express, { requirePermission }, router, { sendError }

### Community 64 - "attendance.js"
Cohesion: 0.22
Nodes (8): markAttendanceRules, { authMiddleware }, { db }, express, { markAttendanceRules }, { requirePermission }, router, { sendError }

### Community 65 - "accounting.js"
Cohesion: 0.22
Nodes (8): ACCOUNT_TYPES, { auditLog }, { authMiddleware }, { db }, express, { requirePermission }, router, { sendError }

### Community 66 - "budgeting.js"
Cohesion: 0.22
Nodes (8): { auditLog }, { authMiddleware }, BUDGET_PERIODS, { db }, express, { requirePermission }, router, { sendError }

### Community 67 - "teachers.js"
Cohesion: 0.22
Nodes (8): { auditLog }, { authMiddleware }, bcrypt, { db }, express, { requirePermission }, router, { sendError }

### Community 68 - "Supabase Setup Guide — School Information System"
Cohesion: 0.22
Nodes (9): Demo Accounts, Next Steps, Overview, Prerequisites, Seed Demo Data, Supabase Setup Guide — School Information System, Support, 📋 Table of Contents (+1 more)

### Community 69 - "i18n Localization Plan — EN + Myanmar"
Cohesion: 0.25
Nodes (7): Approach, Files to create, Files to modify, i18n Localization Plan — EN + Myanmar, Language Toggle, Myanmar Font, Translation Strategy

### Community 70 - "Remaining fix.md Items — Implementation Plan"
Cohesion: 0.25
Nodes (7): Files Modified, Item 1: Health Endpoint Disclosure, Item 2: DB Migration Consolidation, Item 3: Supabase RLS Policies, Item 4: E2E Playwright Tests, Item 5: Student Data Governance, Remaining fix.md Items — Implementation Plan

### Community 71 - ".oxlintrc.json"
Cohesion: 0.25
Nodes (7): plugins, rules, react/only-export-components, react/rules-of-hooks, $schema, oxc, warn

### Community 72 - "AI Feature Update — School Information System"
Cohesion: 0.25
Nodes (7): AI Feature Update — School Information System, Conclusion, Functional Tests, Future Enhancements, Module Loading, Overview, Testing Results

### Community 73 - "Phase 4: Predictive Analytics"
Cohesion: 0.25
Nodes (8): API Endpoints, Description, Example Risk Assessment, Features, Files, Phase 4: Predictive Analytics, Risk Levels, Risk Scoring Formula

### Community 74 - "library.js"
Cohesion: 0.25
Nodes (7): { auditLog }, { authMiddleware }, { db }, express, { requirePermission }, router, { sendError }

### Community 75 - "ch-6 Personal Project — Report"
Cohesion: 0.29
Nodes (6): ch-6 Personal Project — Report, Gallery Card (this project goes public), Issues Closed (from Chapter 5 feedback), Polish, Project, Updated Screenshots

### Community 76 - "ch-6 Personal Project — Report"
Cohesion: 0.29
Nodes (6): ch-6 Personal Project — Report, Gallery Card (this project goes public), Issues Closed (from Chapter 5 feedback), Polish, Project, Updated Screenshots

### Community 77 - "Development Workflow"
Cohesion: 0.29
Nodes (6): 1. Audit Planning, 2. Implementation Phase, 3. Audit Excellence, Audit Context Assessment, Communication Protocol, Development Workflow

### Community 78 - "StudentDetailPage.jsx"
Cohesion: 0.29
Nodes (6): dompurify, STATUS_COLORS, StudentDetailPage(), VALID_TRANSITIONS, TimetablePage(), dompurify

### Community 79 - "scripts"
Cohesion: 0.29
Nodes (7): scripts, build, dev, lint, preview, test, test:watch

### Community 80 - "main.jsx"
Cohesion: 0.33
Nodes (4): App(), LanguageProvider(), ThemeContext, ThemeProvider()

### Community 81 - "DocumentsPage.jsx"
Cohesion: 0.38
Nodes (6): CATEGORIES, DocumentsPage(), FILE_ICONS, formatFileSize(), getFileIcon(), SUBCATEGORIES

### Community 82 - "HRPage.jsx"
Cohesion: 0.29
Nodes (5): CONTRACT_STATUSES, CONTRACT_TYPES, RATINGS, REVIEW_STATUSES, REVIEW_TYPES

### Community 83 - "LoginPage.test.jsx"
Cohesion: 0.33
Nodes (4): LoginPage(), mockLogin, mockNavigate, mockT

### Community 84 - "MyProfilePage.jsx"
Cohesion: 0.29
Nodes (5): CONTRACT_STATUSES, LEAVE_STATUSES, LEAVE_TYPES, RATINGS, REVIEW_STATUSES

### Community 85 - "Phase 3: AI Report Generation"
Cohesion: 0.29
Nodes (7): API Endpoints, Description, Example Output, Features, Files, Phase 3: AI Report Generation, Workflow

### Community 86 - "Phase 5: AI Scheduling"
Cohesion: 0.29
Nodes (7): API Endpoints, Constraints Considered, Description, Example Generation, Features, Files, Phase 5: AI Scheduling

### Community 87 - "User Interview — SchoolHub"
Cohesion: 0.29
Nodes (6): User Interview — SchoolHub, What confused them / what's missing, What I'll change (next steps), What they do today (without your project), What they liked, What would make them actually use it

### Community 88 - "01-01-PLAN.md"
Cohesion: 0.29
Nodes (6): Task 1: Database Migration, Task 2: API Routes, Task 3: Mount Routes, Task 4: Frontend Page, Task 5: Route & Nav, Verification

### Community 89 - "setup-supabase.js"
Cohesion: 0.33
Nodes (6): fs, main(), path, question(), readline, rl

### Community 90 - "Brainstorming Ideas Into Designs"
Cohesion: 0.33
Nodes (5): After the Design, Brainstorming Ideas Into Designs, Key Principles, Overview, The Process

### Community 91 - "Proposal Workflow"
Cohesion: 0.33
Nodes (5): Do, Do Not, Proposal Workflow, Publication Rule, Scope

### Community 92 - "RecruitmentPage.jsx"
Cohesion: 0.33
Nodes (4): APPLICATION_STATUSES, EMPLOYMENT_TYPES, INTERVIEW_RESULTS, POSTING_STATUSES

### Community 93 - "TrainingPage.jsx"
Cohesion: 0.33
Nodes (3): ASSIGNMENT_STATUSES, PROGRAM_STATUSES, RATINGS

### Community 94 - "Phase 1: AI Chatbot"
Cohesion: 0.33
Nodes (6): API, Configuration, Description, Features, Files, Phase 1: AI Chatbot

### Community 95 - "Phase 2: Natural Language Query Interface"
Cohesion: 0.33
Nodes (6): Description, Example Queries, Files, Phase 2: Natural Language Query Interface, Query Tools, Role-Based Access

### Community 96 - "server/tests/setup.js"
Cohesion: 0.33
Nodes (3): fs, path, TEST_DB_PATH

### Community 97 - "pitch.md"
Cohesion: 0.33
Nodes (5): How it's built, SchoolHub, Stay connected with your school community, Try it, What you get

### Community 98 - "Troubleshooting"
Cohesion: 0.33
Nodes (6): Issue: Connection timeout, Issue: "Invalid API key", Issue: "new row violates row-level security policy", Issue: "permission denied for table", Issue: "relation does not exist", Troubleshooting

### Community 100 - "client/package.json"
Cohesion: 0.40
Nodes (4): name, private, type, version

### Community 101 - "ExpensePage.jsx"
Cohesion: 0.40
Nodes (4): CATEGORIES, ExpensePage(), PAYMENT_METHODS, STATUS_COLORS

### Community 102 - "Usage Examples"
Cohesion: 0.40
Nodes (5): Auto-Generate Schedule, Chat with AI Assistant, Check At-Risk Students, Generate Student Report, Usage Examples

### Community 103 - "Technical Architecture"
Cohesion: 0.40
Nodes (5): Database Tables Added, Dependencies, Environment Variables, File Structure, Technical Architecture

### Community 104 - "screenshot.mjs"
Cohesion: 0.40
Nodes (3): __dirname, SCREENSHOT_DIR, VIEWPORT

### Community 105 - "React + Vite"
Cohesion: 0.50
Nodes (3): Expanding the Oxlint configuration, React Compiler, React + Vite

### Community 107 - "FontContext.jsx"
Cohesion: 0.50
Nodes (3): FONT_SIZES, FontContext, FontProvider()

### Community 108 - "TeacherWorkloadPage.jsx"
Cohesion: 0.50
Nodes (3): DAYS, TeacherWorkloadPage(), WORKLOAD_COLORS

### Community 109 - "Frontend Integration"
Cohesion: 0.50
Nodes (4): Dashboard (Early Warning Widget), Frontend Integration, Student Detail Page (Report Generation), Timetable Page (Auto-Generate)

### Community 110 - "🚀 Getting Started"
Cohesion: 0.50
Nodes (4): Default Login, 🚀 Getting Started, Installation, Prerequisites

### Community 111 - "Configure Environment"
Cohesion: 0.50
Nodes (4): Configure Environment, Step 1: Create `.env` File, Step 2: Add Supabase Credentials, Step 3: Verify `.env` is in `.gitignore`

### Community 112 - "Row Level Security (RLS)"
Cohesion: 0.50
Nodes (4): Customizing RLS, Default Policies, Row Level Security (RLS), Using Service Key (Admin Operations)

### Community 113 - "Development Workflow"
Cohesion: 0.50
Nodes (4): Development Workflow, Local Development (SQLite), Production (Supabase), Switching Between Modes

### Community 114 - "Run Migrations"
Cohesion: 0.50
Nodes (4): Option A: Using the Migration Script (Recommended), Option B: Using Supabase Dashboard, Run Migrations, What the Migration Creates

### Community 115 - "Verify Setup"
Cohesion: 0.50
Nodes (4): Step 1: Start the Server, Step 2: Test Health Endpoint, Step 3: Test Login, Verify Setup

### Community 117 - "lint-staged"
Cohesion: 0.67
Nodes (3): lint-staged, *.{js,jsx,json,css}, prettier --write

### Community 118 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 136 - "Create Supabase Project"
Cohesion: 0.67
Nodes (3): Create Supabase Project, Step 1: Sign Up / Log In, Step 2: Create New Project

### Community 137 - "Get API Credentials"
Cohesion: 0.67
Nodes (3): Get API Credentials, Step 1: Navigate to API Settings, Step 2: Copy Credentials

## Knowledge Gaps
- **1190 isolated node(s):** `@modelcontextprotocol/server-filesystem`, `@playwright/mcp`, `codebase-memory-mcp`, `@supabase/mcp-server-supabase`, `SUPABASE_ACCESS_TOKEN` (+1185 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **43 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `initDatabase()` connect `db.js` to `seed-bulk.js`, `server/index.js`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `App.jsx`, `useAuth`, `api.ts`, `useTranslation`, `ErrorBoundary`, `HomePage.jsx`, `.oxlintrc.json`, `StudentDetailPage.jsx`, `main.jsx`, `DocumentsPage.jsx`, `HRPage.jsx`, `LoginPage.test.jsx`, `MyProfilePage.jsx`, `RecruitmentPage.jsx`, `TrainingPage.jsx`, `ExpensePage.jsx`, `OfflineIndicator.tsx`, `FontContext.jsx`, `TeacherWorkloadPage.jsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `db` connect `db` to `server/index.js`, `validate.js`, `documents.js`, `chat.js`, `middleware/audit.js`, `middleware/rbac.js`, `middleware/auth.js`, `errorHandler.js`, `ai-schedule.js`, `ai-analytics.js`, `notifications.js`, `ai-reports.js`, `data.js`, `sendError`, `hr.js`, `recruitment.js`, `certificates.js`, `inventory.js`, `students.js`, `training.js`, `gradebook.js`, `cash-control.js`, `expenses.js`, `qr-attendance.js`, `resources.js`, `users.js`, `classes.js`, `contact.js`, `attendance.js`, `accounting.js`, `budgeting.js`, `teachers.js`, `library.js`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `@modelcontextprotocol/server-filesystem`, `@playwright/mcp`, `codebase-memory-mcp` to the rest of the system?**
  _1190 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `seed-bulk.js` be split into smaller, more focused modules?**
  _Cohesion score 0.020833333333333332 - nodes in this community are weakly interconnected._
- **Should `server/index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.03125 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.04081632653061224 - nodes in this community are weakly interconnected._