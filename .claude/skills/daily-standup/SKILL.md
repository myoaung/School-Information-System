---
name: daily-standup
description: Use when the user wants to generate a daily standup report from recent git activity.
---

# Daily Standup Generator

1. Run `git log --since="yesterday" --until="now" --oneline --all` to get recent commits.
2. Run `git diff --name-status HEAD~5..HEAD` to see changed files (adjust range as needed).
3. Group changes by type:
   - **Features** — new functionality
   - **Fixes** — bug fixes
   - **Refactoring** — code improvements
   - **Docs** — documentation updates
4. Generate a standup report:

```markdown
## Daily Standup — [Date]

### Yesterday
- [List completed tasks from commits]

### Today
- [Suggest next steps based on recent work]

### Blockers
- [Note any issues or blockers if detected]
```

5. Keep it concise and actionable.
