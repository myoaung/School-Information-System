# SchoolHub — Report by @myoaung

## What I Built

**SchoolHub** — A school information system where students, teachers, and parents can access class updates, announcements, and school information in one place.

### Stack
- **Frontend:** React.js + Vite + Tailwind CSS
- **Backend:** Node.js + Express.js + SQLite
- **Auth:** JWT (JSON Web Tokens)

### Features (Vertical Slice)
1. ✅ User registration and login with roles (student/teacher/admin)
2. ✅ Announcements CRUD (teachers/admins create, students view)
3. ✅ Class information display
4. ✅ Contact form
5. ✅ Responsive design (mobile + desktop)

### Repository
- **personal_repo_url:** https://github.com/myoaung/School-Information-System
- **slides_url:** https://github.com/myoaung/School-Information-System/blob/main/slides/presentation.md

---

## Methodology

I followed a vertical-slice approach, building one feature end-to-end before moving to the next. First, I set up the project structure with Express backend, SQLite database, and React frontend scaffolded by Vite. Then I implemented authentication (register/login with JWT), followed by announcements CRUD, class listings, and contact form. Each feature was built as a complete stack from database schema to API route to frontend component. Throughout development, I used Claude Code skills and agents to automate repetitive tasks like standup generation, API testing, and code cleanup.

---

## How I Used Skills, Agents, and MCP

### Skills Used

| Skill | Where Used | How Used |
|-------|------------|----------|
| `/daily-standup` | Development workflow | Generated daily standup reports from git commits to track progress |
| `/release-notes` | Documentation | Summarized commits into changelog format |
| `/deploy-checklist` | Deployment | Verified build → test → publish steps before commits |
| `/file-renamer` | Project organization | Renamed files to follow consistent naming conventions |
| `/data-validate` | Database setup | Validated seed data schema before inserting into SQLite |
| `/api-contract` | Backend development | Kept API routes in sync with documentation |
| `/style-guide` | Frontend development | Enforced consistent Tailwind CSS styling patterns |

**Evidence — skill paths:**
- path: .claude/skills/daily-standup/SKILL.md
- path: .claude/skills/release-notes/SKILL.md
- path: .claude/skills/deploy-checklist/SKILL.md
- path: .claude/skills/file-renamer/SKILL.md
- path: .claude/skills/data-validate/SKILL.md
- path: .claude/skills/api-contract/SKILL.md
- path: .claude/skills/style-guide/SKILL.md

### Agents Used

| Agent | Where Used | How Used |
|-------|------------|----------|
| `data-cleaner` | Database seeding | Cleaned and normalized mock data before inserting into database |
| `ui-reviewer` | Frontend testing | Checked accessibility and responsive design of components |
| `refactor-cleaner` | Code cleanup | Removed dead code and unused imports during development |
| `endpoint-tester` | API testing | Tested all API endpoints for correct status codes and response shapes |
| `doc-updater` | Documentation | Updated README and API docs as code changed |

**Evidence — agent paths:**
- path: .claude/agents/data-cleaner.md
- path: .claude/agents/ui-reviewer.md
- path: .claude/agents/refactor-cleaner.md
- path: .claude/agents/endpoint-tester.md
- path: .claude/agents/doc-updater.md

### MCP Servers Used

| MCP Server | Where Used | How Used |
|------------|------------|----------|
| `filesystem` | File operations | Read/write project files, create components, update configs |
| `fetch` | API testing | Tested backend endpoints and fetched external resources |
| `playwright` | UI verification | Automated browser testing for responsive design |
| `git` | Version control | Git operations for commits and branch management |

**Evidence — MCP config:**
- path: .mcp.json

---

## Development Process

### Commit History (Small, Frequent Commits)

```
d504d67 feat: add content/docs/media skills
3120c70 feat: add style-guide skill and doc-updater agent
30047d4 docs: add member proposal
9a2b994 feat: add api-contract skill and endpoint-tester agent
5c9433f feat: add reply-templates skill and triage agent
843d2d9 feat: add data-validate and csv-cleaner skills
1366271 feat: add file-renamer tool
a6749cc feat: add daily-standup generator
274b15f feat: add refactor-cleaner agent and git MCP server
010bede feat: add server and client code
d2931ac feat: add agent-evaluation skill
a4b97e4 feat: add ui-reviewer agent
56ecaf0 feat: add deploy-checklist skill
20911d5 feat: add MCP config, skill, and agent setup
```

### Vertical Slice Approach

1. **Phase 1:** Set up project structure and MCP servers
2. **Phase 2:** Build backend API (Express + SQLite + JWT)
3. **Phase 3:** Build frontend (React + Vite + Tailwind)
4. **Phase 4:** Connect frontend to backend
5. **Phase 5:** Test and verify end-to-end

---

## What Works End-to-End

### ✅ Authentication Flow
- Register with email/password/role
- Login and receive JWT token
- Protected routes require authentication
- Role-based access (admin, teacher, student)

### ✅ Announcements
- Teachers/admins can create announcements
- All users can view announcements
- Individual announcement detail pages

### ✅ Classes
- View all classes with teacher and schedule info
- See enrolled student count
- Class detail pages

### ✅ Contact Form
- Submit inquiries
- Form validation
- Success/error feedback

---

## Test Accounts

| Email | Password | Role |
|-------|----------|------|
| admin@school.com | password123 | Admin |
| teacher@school.com | password123 | Teacher |
| student@school.com | password123 | Student |

---

## Running the App

```bash
# Install dependencies
npm install

# Start both servers
npm run dev

# Seed database
npm run seed
```

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:5000

---

## Resources Used

- **Vite** — https://vitejs.dev
- **Tailwind CSS** — https://tailwindcss.com
- **Express** — https://expressjs.com
- **SQLite** — https://sqlite.org
- **JWT** — https://jwt.io

---

## Lessons Learned

1. **Vertical slice first** — Build one feature end-to-end before adding more
2. **Small commits** — Easier to track progress and debug issues
3. **Use the tools** — Skills, agents, and MCP should be actively used, not just present
4. **Test as you go** — Don't wait until the end to test
