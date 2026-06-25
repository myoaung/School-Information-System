# ch-3 Personal Project — Report

github_username: myoaung
personal_repo_url: https://github.com/myoaung/School-Information-System
project_summary: A school information system where students, teachers, and parents can access class updates, announcements, and school information in one place.
slides_url: slides/presentation.md

## Methodology

I followed a vertical-slice approach, building one feature end-to-end before moving to the next. First, I set up the project structure with Express backend, SQLite database, and React frontend scaffolded by Vite. Then I implemented authentication (register/login with JWT), followed by announcements CRUD, class listings, and contact form. Each feature was built as a complete stack from database schema to API route to frontend component. Throughout development, I used Claude Code skills and agents to automate repetitive tasks like standup generation, API testing, and code cleanup.

## Evidence — Claude Code usage

### MCP
- path: .mcp.json
- what: 5 MCP servers — filesystem (file operations), fetch (API testing), playwright (UI verification), codebase-memory (code indexing), git (version control). Used throughout development for creating files, testing endpoints, and managing git operations.

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
