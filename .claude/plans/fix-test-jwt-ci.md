# Fix 1: Test Bootstrap — Lazy Directory Creation

## Problem
`server/routes/documents.js` line 17:
```js
fs.mkdirSync(uploadDir, { recursive: true });
```
This runs at **module import time** (when `require()`'d). In restricted CI/test environments, creating the upload directory can fail and block tests from loading.

## Fix
Wrap directory creation in a lazy `ensureUploadDir()` function called at first use, not at import:
- Create a lazy init pattern
- The multer `destination` callback calls `ensureUploadDir()` before returning the path
- The route handlers call it before operations that need the directory
- Tests can import the module without side effects

# Fix 2: JWT Secret Enforcement

## Status: ALREADY FIXED ✅
`server/config.js` already:
- Exits with FATAL if `JWT_SECRET` is missing in production
- Uses `crypto.randomBytes(32)` for dev fallback (non-deterministic, invalidates on restart)
- Auth middleware and routes import from config.js properly

# Fix 3: CI Gates — Remove continue-on-error

## Problem
Two CI steps allow failures with `continue-on-error: true`:
1. "Lint client" (line 36)
2. "Run client tests with coverage" (line 49)

These mask regressions from blocking CI.

## Fix
Remove `continue-on-error: true` from both steps.

---

# Fix 4: Route Bugs (Tests Fail — must fix for CI to pass)

## 4a. ai-schedule.js — Missing await on async functions
`collectConstraints()`, `detectConflicts()`, and `generateSchedule()` are `async` but route handlers use sync callbacks. The results are Promises, not actual data.

**Fix:** Change route handlers to `async (req, res)` and add `await` before each call.

**Tests affected:** 2 failures (conflicts.filter, result.class.name undefined)

## 4b. ai-reports.js — Missing await on aggregateStudentData
```js
const data = aggregateStudentData(studentUserId); // returns Promise
// data.academics is undefined → crash
```

**Fix:** Add `await` on line 26.

**Tests affected:** 1 failure (overallGpa undefined)

## 4c. health endpoint — Missing environment property
Test expects `res.body.environment` but endpoint doesn't include it.

**Fix:** Add `environment: process.env.NODE_ENV || 'development'` to health response.

## 4d. notifications route — Response shape mismatch
Test expects `res.body` to be an array, but API returns `{ notifications: [...] }`.

**Fix:** Update test to expect `{ notifications: [...] }` shape (or adjust route to return bare array — the route is correct, fix the test).

## 4e. finance test — Student can't access /invoices
Test logs in as student and expects 200 from `/api/finance/invoices`, but the route requires `admin` or `accountant` role.

**Fix:** Test bug — remove or update the student invoice test (students should use /api/finance/my-invoices or similar).

## 4f. students test — grade_id: 11 not in seed data
Test POSTs `grade_id: 11` which doesn't exist in the test DB, causing a foreign key violation → 500.

**Fix:** Use `grade_id: 1` or query the DB for an existing grade_id dynamically.
