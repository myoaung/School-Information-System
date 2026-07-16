# Chapter 6 — How to Submit (Personal Project)

> 🇲🇲 မြန်မာဘာသာ — [HOW-TO-SUBMIT-my.md](./HOW-TO-SUBMIT-my.md)

Chapter 6 is **polish + deployment**. You close the issues from Chapter 5, polish the UI,
write a real README, add analytics, deploy it for real, and take clean new screenshots.
This is the version that goes into the **public gallery**.

Follow the steps in order.

> **Two repos:** Steps 1–6 are in **your own repo**; Step 7 (the report) is in the **team repo** (`team-NN`). Don't mix them up.

---

## What you need to finish (the checklist)

1. ✅ The Chapter-5 **open issues are closed** (fixed with AI agent / MCP / skill)
2. ✅ UI/UX **polished**
3. ✅ (Web app) tested with **Chrome DevTools + Playwright**
4. ✅ A polished **README**
5. ✅ **Analytics** added
6. ✅ **Updated screenshots** (Chrome DevTools MCP, fixed resolution)
7. ✅ A **public, deployed** live URL
8. ✅ A filled-in `report.md` in your team repo
9. ✅ `doctor.sh ch-6` shows all green

---

## Step 1 — Close your open issues

- Take the issues you opened in Chapter 5 and **fix them**.
- Use AI to do it: an agent, an MCP, or a skill. Note in the report *how* you fixed each.
- Close each issue on GitHub. Link the closed issues in the report.

## Step 2 — Polish UI/UX

- Tidy spacing, colors, text, mobile layout, empty/error states.
- Ask Claude (frontend-design skill) to review and implement; **you validate** each change.

## Step 3 — Test with Chrome DevTools + Playwright (web apps)

- Use **Chrome DevTools MCP** to inspect, check console errors, and test responsiveness.
- Use **Playwright** for a quick automated click-through of your main flow.
- (Not a web app? Note how you tested it instead.)

## Step 4 — Polish the README

- Your README is the front door: what it is, who it's for, how to run it, a screenshot.
- Ask Claude to draft it; **you verify** every line is true.

## Step 5 — Add analytics

- Add a simple analytics tool (Plausible, GoatCounter, GA, …) so you know if anyone visits.
- Note which one in the report.

## Step 6 — Deploy for real + new screenshots

- Deploy a **public, polished** version (secrets clean — no keys in the repo).
- Take **updated screenshots** with **Chrome DevTools MCP** at a fixed resolution
  (desktop **1280×800**, mobile **390×844** — note which). Put them in your repo.

> **Step 7 happens in the TEAM repo** (`team-NN`) — not your own repo.

## Step 7 — Fill in the report (in your TEAM repo)

- The team repo is private — **don't fork**. Sync, branch, push, open a PR.
- Copy `_TEMPLATE.md` to `ch-6/<your-github-username>/report.md` in your **team** repo, fill it in, then:

```bash
# 1. sync the latest main
git checkout main
git pull

# 2. make your own branch — naming:  <yourname>/ch-6
git checkout -b yourname/ch-6

# 3. stage + commit your report
git add ch-6/yourname/report.md
git commit -m "ch-6: yourname report"

# 4. push your branch
git push -u origin yourname/ch-6

# 5. open a Pull Request on GitHub → review → merge
```

> If a teammate merged before you, sync again: `git checkout main && git pull`,
> then `git merge main` into your branch (or `git rebase main`) and push.

## Step 8 — Check yourself with doctor.sh

Before you submit, run the self-check:

```bash
bash doctor.sh ch-6
```

Fix any red ❌ lines, then run it again until everything is green ✅.

## Step 9 — Submit in Discord

- Post in your `#ch-6` channel that you're done (paste your public live link).
- An instructor reacts ✅ → your project is gallery-ready.

---

### Common mistakes

- **Issues still open** → Ch-6 is about closing them. Fix and close, then link.
- **Secrets in the repo** → remove keys before going public. Use env vars.
- **README is empty/auto-generated** → make it a real front door.
- **Screenshots inconsistent** → use Chrome DevTools MCP at one fixed resolution.

Stuck? Ask in your team channel.
