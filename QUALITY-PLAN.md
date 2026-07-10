# Quality & Polish Plan — Error Handling & Resilience

**Date:** 2026-07-10
**Scope:** Error handling improvements across client and server
**Estimated effort:** ~4-6 hours

---

## Goals

1. No more white-screen crashes — users always see a recoverable error state
2. No more silent failures — users get notified when background data fails to load
3. Consistent server error responses — all routes use the same error utility
4. Clear retry path — user-initiated actions show a "Try again" button on failure

---

## Decisions (Locked)

| Area | Decision |
|------|----------|
| Crash recovery | Root `ErrorBoundary` wrapping Router. Full-page fallback with navbar, message, "Go Home" + "Try Again" |
| Silent failures | Add `sonner` toast library. Replace 58 `catch(() => {})` with toast notifications |
| Server errors | Refactor 14 route files to use centralized `sendError()` |
| Retry UX | Manual "Try again" button on user-initiated action failures |

---

## Tasks

### Task 1: Add toast library (`sonner`)
**Dependencies:** None
**Files:**
- `client/package.json` — install `sonner`
- `client/src/App.jsx` — add `<Toaster />` provider
- `client/src/services/api.js` — (optional) add global response interceptor for 5xx toasts

**Acceptance criteria:**
- `toast.success()`, `toast.error()`, `toast.info()` work from any component
- Toasts auto-dismiss after 4 seconds
- Toasts stack properly on mobile

### Task 2: Root ErrorBoundary component
**Dependencies:** None
**Files:**
- `client/src/components/ErrorBoundary.jsx` — NEW component
- `client/src/App.jsx` — wrap `<Router>` with `<ErrorBoundary>`

**Acceptance criteria:**
- Component catches render errors and shows fallback UI
- Fallback shows navbar (stays visible), friendly message, "Go Home" and "Try Again" buttons
- "Go Home" navigates to `/`
- "Try Again" resets error state and re-renders children
- In development, also shows error details for debugging

### Task 3: Standardize server error handling
**Dependencies:** None
**Files (14 route files to refactor):**
- `server/routes/academic.js`
- `server/routes/announcements.js`
- `server/routes/assignments.js`
- `server/routes/auth.js`
- `server/routes/classes.js`
- `server/routes/contact.js`
- `server/routes/courses.js`
- `server/routes/curriculum.js`
- `server/routes/quizzes.js`
- `server/routes/reports.js`
- `server/routes/resources.js`
- `server/routes/students.js`
- `server/routes/teachers.js`
- `server/routes/timetable.js`

**Pattern:**
```js
// Before:
const express = require('express');
// ... ad-hoc error handling
catch (err) {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something failed' });
}

// After:
const express = require('express');
const { sendError } = require('../utils/errorHandler');
// ...
catch (err) {
  sendError(res, err, 'Something failed');
}
```

**Acceptance criteria:**
- All 14 files import and use `sendError()`
- No remaining `res.status(500).json({ error:` patterns (except in sendError itself)
- Existing tests still pass

### Task 4: Replace silent catch blocks with toasts
**Dependencies:** Task 1 (toast library must be installed)
**Files (15 client files, 58 catch blocks):**

| File | Count | Category |
|------|-------|----------|
| `ParentPortalPage.jsx` | 5 | Background data |
| `TimetablePage.jsx` | 4 | Background data |
| `FinancePage.jsx` | 4 | Background data |
| `DashboardPage.jsx` | 3 | Background data |
| `CoursesPage.jsx` | 3 | Background data |
| `StudentDetailPage.jsx` | 2 | Background data |
| `MessagesPage.jsx` | 2 | Background data |
| `CertificatesPage.jsx` | 2 | Background data |
| `AttendancePage.jsx` | 2 | Background data |
| `AnnouncementsPage.jsx` | 2 | Background data |
| `NotificationBell.jsx` | 2 | Background data |
| `StudentsPage.jsx` | 1 | Background data |
| `ReportsPage.jsx` | 1 | Background data |
| `QuizzesPage.jsx` | 1 | Background data |
| `ClassesPage.jsx` | 1 | Background data |

**Pattern:**
```jsx
// Before:
api.get('/reports/dashboard')
  .then(r => setStats(r.data.dashboard))
  .catch(() => {})

// After:
import { toast } from 'sonner';

api.get('/reports/dashboard')
  .then(r => setStats(r.data.dashboard))
  .catch(() => toast.error('Failed to load dashboard data'))
```

**Acceptance criteria:**
- Zero remaining `catch(() => {})` blocks
- Each toast has a context-specific message (not generic "Error")
- Console.error retained for debugging

### Task 5: Add retry button on user-initiated failures
**Dependencies:** Task 1 (toast library for error display)
**Files:**
- `client/src/pages/StudentDetailPage.jsx` — AI report generation
- `client/src/pages/TimetablePage.jsx` — schedule generation, AI tips
- `client/src/pages/AttendancePage.jsx` — attendance save
- `client/src/pages/GradebookPage.jsx` — grade save
- `client/src/components/ChatWidget.jsx` — AI chat responses

**Pattern:**
```jsx
// Before:
const handleGenerateReport = async () => {
  try {
    const res = await api.post(`/ai/report/${studentId}`);
    setReport(res.data.report);
  } catch (err) {
    toast.error('Failed to generate report');
  }
};

// After:
const [error, setError] = useState(null);

const handleGenerateReport = async () => {
  setError(null);
  try {
    const res = await api.post(`/ai/report/${studentId}`);
    setReport(res.data.report);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to generate report');
  }
};

// In JSX:
{error && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-800">{error}</p>
    <button onClick={handleGenerateReport} className="text-red-600 underline mt-2">
      Try again
    </button>
  </div>
)}
```

**Acceptance criteria:**
- User-initiated actions (save, generate, submit) show inline error + retry button
- Clicking retry re-executes the same action
- Error clears on retry attempt

---

## Execution Order

```
Task 1 (toast library) ──┐
                         ├──→ Task 4 (silent catch → toasts)
Task 2 (ErrorBoundary)   │
                         │
Task 3 (server errors) ──┤
                         │
Task 1 (toast library) ──┴──→ Task 5 (retry buttons)
```

Tasks 1, 2, 3 can run in parallel. Tasks 4 and 5 depend on Task 1.

---

## Out of Scope (Deferred)

- **Accessibility** — aria attributes, skip-to-content, form labels
- **Testing** — client-side tests with Vitest + React Testing Library
- **Performance** — React.lazy code splitting for 28 pages
- **Type safety** — TypeScript or PropTypes adoption
- **Security hardening** — CSP re-enable, .env cleanup, JWT secret rotation
