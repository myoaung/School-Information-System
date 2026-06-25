# ch-4 Make it real — Report

github_username: myoaung
repo_url: https://github.com/myoaung/School-Information-System
personal_repo_url: https://github.com/myoaung/School-Information-System
project_summary: A school information system where students, teachers, and parents can access class updates, announcements, and school information in one place.
live_url: https://schoolhub-mu.vercel.app
slides_url: slides/pitch.md
slides_path: slides/pitch.md
license: MIT

## Methodology

I deployed the SchoolHub application to Vercel as a full-stack deployment with React frontend and Express backend. The frontend is built with Vite and served as static files, while the backend runs as Vercel serverless functions. SQLite databases are initialized on cold starts with auto-seeding of demo data. I took 7 screenshots at 1280x720 resolution using Playwright to document the user experience across all pages. The slide deck was created using the Marp product-demo template from vibe-code-tours/marp-templates with 6 slides and auto-advance.

## Evidence — Deployment

### Live URL
- url: https://schoolhub-mu.vercel.app
- what: Full-stack deployment on Vercel with React frontend, Express API, and SQLite database

### License
- path: LICENSE
- what: MIT license file added to repository root

## Evidence — Screenshots

- path: screenshots/01-homepage.png
- what: Homepage with hero section, features, and recent announcements

- path: screenshots/02-login.png
- what: Login form with email and password fields

- path: screenshots/03-register.png
- what: Registration form with role selection (student/teacher/admin)

- path: screenshots/04-announcements.png
- what: Announcements list page showing all announcements

- path: screenshots/05-classes.png
- what: Classes list page with teacher names and schedules

- path: screenshots/06-contact.png
- what: Contact form for inquiries

- path: screenshots/07-dashboard.png
- what: Dashboard page (authenticated view)

## Evidence — Slide Deck

- path: slides/pitch.md
- what: Marp slide deck with 6 slides, auto-advance: 20, using product-demo template

## Evidence — Vercel Configuration

- path: vercel.json
- what: Vercel deployment configuration for full-stack app

- path: api/index.js
- what: Serverless function entry point for Express backend

## Evidence — Claude Code usage

### MCP
- path: .mcp.json
- what: 5 MCP servers — filesystem, fetch, playwright, codebase-memory, git

### Skill
- path: .claude/skills/daily-standup/SKILL.md
- what: Generate daily standup reports from git activity

- path: .claude/skills/release-notes/SKILL.md
- what: Generate changelog from git commits

- path: .claude/skills/deploy-checklist/SKILL.md
- what: Build → test → publish steps for deployment

- path: .claude/skills/file-renamer/SKILL.md
- what: Batch rename files with patterns

- path: .claude/skills/data-validate/SKILL.md
- what: Validate data files with schema and sanity checks

- path: .claude/skills/api-contract/SKILL.md
- what: Keep API routes and documentation in sync

- path: .claude/skills/style-guide/SKILL.md
- what: Enforce tone and formatting rules

### Agent
- path: .claude/agents/data-cleaner.md
- what: Normalizes and de-duplicates CSV/JSON rows before reporting

- path: .claude/agents/ui-reviewer.md
- what: Checks accessibility and responsive design across pages

- path: .claude/agents/refactor-cleaner.md
- what: Removes dead code and formats files for consistency

- path: .claude/agents/endpoint-tester.md
- what: Hits API routes and checks status codes and response shapes

- path: .claude/agents/doc-updater.md
- what: Regenerates documentation from code changes
