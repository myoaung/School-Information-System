---
name: changelog-automation
description: Use when the user wants to automate changelog generation from git history.
---

# Changelog Automation

1. Run `git log --oneline --no-merges` to get commits.
2. Parse conventional commits:
   - `feat:` → Features
   - `fix:` → Bug Fixes
   - `docs:` → Documentation
   - `refactor:` → Refactoring
   - `test:` → Tests
   - `chore:` → Chores
3. Group by version (tags):
   - Compare tags with `git tag --sort=-version:refname`
   - Generate section per version
4. Format changelog:
   - Date header
   - Version number
   - Categorized changes
   - Breaking changes highlighted
5. Export as CHANGELOG.md or release notes.
