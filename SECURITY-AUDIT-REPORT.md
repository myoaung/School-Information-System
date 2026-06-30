# Security Audit Report
## School Information System (SchoolHub)
**Audit Date:** 2026-06-30
**Auditor:** Claude Code Security Auditor
**Scope:** Full application security review

---

## Executive Summary

The SchoolHub application demonstrates **good foundational security practices** but has several critical and high-severity issues that require immediate attention. The most pressing concerns are hardcoded secrets, weak JWT configuration, and overly permissive CORS settings.

### Risk Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | Requires immediate fix |
| 🟠 High | 3 | Fix before production |
| 🟡 Medium | 5 | Address in next sprint |
| 🟢 Low | 3 | Track for improvement |
| ✅ Positive | 10 | Well implemented |

---

## 🔴 Critical Findings

### C1: Hardcoded Weak JWT Secret
**File:** `server/.env:2`
**Risk:** Authentication bypass, token forgery

```env
JWT_SECRET=schoolhub-secret-key-change-in-production
```

**Impact:** Any attacker who discovers this secret can forge valid JWT tokens for any user, including admin accounts. This is a trivially guessable secret.

**Remediation:**
1. Generate a cryptographically random secret: `openssl rand -base64 64`
2. Set via environment variable only, never in files
3. The `server/config.js` already has good logic — ensure `JWT_SECRET` env var is set in production

---

### C2: Vercel OIDC Token Exposed in `.env.local`
**File:** `.env.local:2`
**Risk:** Account takeover, unauthorized deployments

The file contains a valid Vercel OIDC token that could grant access to the Vercel account and project.

**Remediation:**
1. **Immediately revoke** the token at [Vercel Dashboard → Settings → Tokens](https://vercel.com/account/tokens)
2. Add `.env.local` to `.gitignore` (already done, but verify it was never committed)
3. Rotate any other credentials that may have been exposed

---

## 🟠 High Findings

### H1: Demo Accounts with Weak Passwords
**File:** `server/db.js:455`
**Risk:** Unauthorized access in production

```javascript
const password = bcrypt.hashSync('password123', salt);
```

All demo accounts (admin, teacher, student, parent) use `password123`. If these accounts exist in production, anyone can log in.

**Remediation:**
1. Remove demo seeding in production (`NODE_ENV === 'production'`)
2. Force password change on first login for seeded accounts
3. Add environment check before seeding

---

### H2: Overly Permissive CORS in Production
**File:** `server/index.js:53`
**Risk:** Cross-origin attacks, data theft

```javascript
origin: process.env.VERCEL ? true : allowedOrigins,
```

When deployed on Vercel, **any origin** can make authenticated requests. This defeats CORS protection entirely.

**Remediation:**
```javascript
origin: process.env.VERCEL
  ? ['https://schoolhub-mu.vercel.app', 'https://www.schoolhub-mu.vercel.app']
  : allowedOrigins,
```

---

### H3: No CSRF Protection
**Risk:** Cross-site request forgery

The application uses JWT in localStorage (client-side) but doesn't implement CSRF tokens for state-changing operations. Combined with H2, this is exploitable.

**Remediation:**
1. Implement double-submit cookie pattern
2. Or use `SameSite=Strict` cookies for JWT
3. At minimum, validate `Origin` header on POST/PUT/DELETE requests

---

## 🟡 Medium Findings

### M1: Content Security Policy Disabled
**File:** `server/index.js:43`

```javascript
contentSecurityPolicy: false
```

**Remediation:** Enable CSP with appropriate directives for your application.

---

### M2: Rate Limiting Not Applied to All Routes
**Affected Routes:** `/api/students`, `/api/teachers`, `/api/classes`, `/api/courses`, `/api/gradebook`, etc.

Only auth, contact, chat, and AI routes have rate limiting. Data-heavy routes are unprotected.

**Remediation:** Apply a global rate limiter:
```javascript
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
```

---

### M3: File Path Disclosure in Chat Responses
**File:** `server/routes/chat.js:77`

```javascript
filePath: `/uploads/chat/${req.file.filename}`,
```

Internal file paths are exposed to clients.

**Remediation:** Return only a download URL, not the internal path.

---

### M4: Database Ephemeral on Vercel
**File:** `server/db.js:6`

```javascript
const DB_PATH = process.env.VERCEL ? path.join('/tmp', 'school.db') : ...
```

Data is lost on every Vercel serverless cold start. Not a security issue per se, but affects data integrity.

**Remediation:** Migrate to a persistent database (Vercel Postgres, Supabase, PlanetScale).

---

### M5: No Token Refresh Mechanism
**File:** `server/routes/auth.js:52`

JWT tokens expire after 2 hours with no refresh mechanism. Users must re-authenticate frequently.

**Remediation:** Implement refresh token rotation.

---

## 🟢 Low Findings

### L1: No HTTPS Enforcement
No middleware redirects HTTP to HTTPS. Relies on hosting provider (Vercel handles this).

### L2: Verbose Errors in Development
**File:** `server/index.js:189`

```javascript
error: NODE_ENV === 'production' ? 'Internal server error' : err.message,
```

Good — properly guarded. Just ensure `NODE_ENV=production` is set.

### L3: No Account Lockout
Failed login attempts don't trigger account lockout. Rate limiting helps but isn't sufficient.

---

## ✅ Positive Findings

| Area | Status | Details |
|------|--------|---------|
| **SQL Injection** | ✅ Protected | All queries use parameterized statements (`?` placeholders) |
| **Password Hashing** | ✅ Strong | bcrypt with salt rounds 10 |
| **Input Validation** | ✅ Comprehensive | express-validator on all inputs |
| **Authentication** | ✅ Proper | JWT verification, role-based access |
| **File Uploads** | ✅ Validated | Extension + MIME type whitelist, 5MB limit |
| **Path Traversal** | ✅ Protected | File deletion validates path boundaries |
| **Rate Limiting** | ✅ Applied | Auth (20/15min), Contact (5/hr), Chat (30/hr), AI (60/hr) |
| **Security Headers** | ✅ Present | Helmet middleware enabled |
| **Error Handling** | ✅ Safe | No stack traces in production |
| **Graceful Shutdown** | ✅ Implemented | Proper cleanup on SIGTERM/SIGINT |

---

## Remediation Priority

### Immediate (Today)
1. ✅ Revoke exposed Vercel OIDC token
2. ✅ Generate and set proper `JWT_SECRET` environment variable

### Before Production (This Week)
3. Fix CORS to whitelist specific origins
4. Disable demo account seeding in production
5. Enable Content Security Policy

### Next Sprint
6. Add global rate limiting
7. Implement CSRF protection
8. Add account lockout mechanism
9. Set up persistent database
10. Implement refresh token rotation

---

## Compliance Notes

| Framework | Status |
|-----------|--------|
| OWASP Top 10 | 7/10 addressed |
| Input Validation | ✅ |
| Authentication | ⚠️ Weak secret |
| Access Control | ✅ |
| Cryptography | ✅ |
| Error Handling | ✅ |
| Logging | ⚠️ Partial |
| Data Protection | ⚠️ Ephemeral DB |

---

*This audit was conducted using static analysis, code review, and configuration review. For a complete security assessment, consider adding: penetration testing, dependency scanning in CI/CD, and runtime security monitoring.*
