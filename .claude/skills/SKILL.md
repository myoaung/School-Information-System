---
name: proposal-workflow
description: Create, review, and organize proposal documents for this School Information System. Use for work in a directory named proposal or proposals, especially when deciding whether proposal artifacts may be published to GitHub.
---

# Proposal Workflow

## Scope

Apply these instructions to files in directories named `proposal` or `proposals`.

## Do

- Keep proposals focused, clearly titled, and actionable.
- State the intended outcome, scope, assumptions, priorities, and acceptance criteria when drafting a new requirement.
- Preserve existing proposal files unless the user explicitly asks to replace or remove them.
- Check `git status` before preparing any proposal work for publication.
- Treat proposal files whose basename starts with `CH` or `ch` as local-only working documents.

## Do Not

- Do not run `git add`, create a commit, push, open a pull request, or otherwise publish a `CH*` or `ch*` file from a `proposal` or `proposals` directory to GitHub.
- Do not rename a `CH*` or `ch*` local-only proposal merely to bypass this rule.
- Do not include local-only proposal content in another committed file without explicit user approval.
- Do not change application source code, database migrations, or deployment configuration while only drafting or reviewing a proposal.

## Publication Rule

- Files beginning with `CH` or `ch` in `proposal` or `proposals` stay local and must not be published to GitHub.
- Other proposal files may follow the normal repository workflow only when the user explicitly requests publication.
