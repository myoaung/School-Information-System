---
marp: true
theme: default
paginate: true
size: 16:9
---

# SchoolHub — Tech Stack

## How it's built, automated, and delivered

**@myoaung** | Chapter 5

---

# Tech Stack

**Frontend:** React 19 + Vite 8 + Tailwind CSS 4
**Backend:** Node.js + Express + SQLite (better-sqlite3)
**Auth:** JWT (jsonwebtoken + bcryptjs)
**Deploy:** Vercel (full-stack serverless)
**Fonts:** Baloo 2, Comic Neue, MyanmarSabae

- React Router v7 for client-side routing
- Concurrently for dev monorepo
- Oxlint for linting

---

# Architecture

```
Client (React+Vite)          Server (Express)
     │                            │
     ├── / → HomePage             ├── /api/auth
     ├── /login → LoginPage       ├── /api/announcements
     ├── /register → Register     ├── /api/classes
     ├── /dashboard → Dashboard   ├── /api/curriculum
     ├── /announcements            ├── /api/contact
     ├── /classes                  └── /api/health
     ├── /curriculum
     └── /contact
```

---

# Skills

| Skill | Purpose |
|-------|---------|
| **ui-ux-pro-max** | Design system — colors, typography, micro-interactions, accessibility |
| **style-guide** | Enforce tone and formatting rules |
| **deploy-checklist** | Build → test → publish steps |
| **api-contract** | Keep API routes and docs in sync |
| **data-validate** | Validate data with schema checks |
| **daily-standup** | Git activity → standup report |
| **release-notes** | Commits → changelog |
| **file-renamer** | Batch rename with patterns |

---

# Subagents

| Agent | Purpose |
|-------|---------|
| **security-auditor** | Codebase vulnerability + compliance audit |
| **ui-reviewer** | Accessibility + responsive design check |
| **doc-updater** | Regenerate docs from code changes |
| **endpoint-tester** | API route status check |
| **data-cleaner** | Normalize CSV/JSON data |
| **refactor-cleaner** | Remove dead code, format files |

---

# Methodology

1. **Design first** — Design system from `ui-ux-pro-max` skill
2. **Implement** — React + Tailwind components following design tokens
3. **Audit** — Security auditor checks before deploy
4. **Deploy** — Push to main → Vercel auto-deploys
5. **Feedback** — Real user interviews → GitHub issues

---

# Triggers & Commands

**Skill (ui-ux-pro-max):**
- Trigger: "improve design" / "redesign"
- Command: `python3 .claude/skills/ui-ux-pro-max/scripts/search.py "..." --design-system`

**Agent (security-auditor):**
- Trigger: "audit security" / "check vulnerabilities"
- Command: Agent tool with `subagent_type: security-auditor`

**Agent (endpoint-tester):**
- Trigger: "test APIs" / "check routes"
- Command: Agent tool with `subagent_type: endpoint-tester`

---

# MLM + i18n

**10 languages supported:**
Myanmar (မြန်မာ), English, Chinese, Japanese, Korean, Thai, Hindi, Bengali, Spanish, Arabic

**Key features:**
- MyanmarSabae font (bundled locally)
- Language persist via localStorage
- Dynamic date formatting per locale
- Zero external i18n dependency

---

# Lesson Learned

- Design system saved ~3 hours of trial-and-error
- Security audit caught 4 vulnerabilities before deploy
- Real user feedback led to mobile-first responsive fixes
- SVG icons (not emoji) improved professionalism
- Font bundling reduced external dependencies

---

# Thank You

**SchoolHub** — Stay connected with your school community.

`https://schoolhub-mu.vercel.app`
`https://github.com/myoaung/School-Information-System`
