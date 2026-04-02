# Claude Integration Guide — Using LBM Alongside Other Projects

This guide explains how to log tasks to LBM while working on a different project in Claude Code. You don't need to switch workspaces or interrupt your flow.

---

## The Scenario

You're building App X with Claude. Mid-session, you notice something worth tracking — a bug, a future feature, a technical debt item. Instead of losing it, you log it to LBM in seconds and keep going.

---

## Option A — Two Browser Tabs (Recommended)

1. Open `index.html` in one browser tab (or `localhost:8080` if serving locally)
2. Work on App X normally
3. When Claude generates a task command, switch to the LBM tab
4. Open DevTools console: **F12** (Windows/Linux) or **Cmd+Option+J** (Mac)
5. Paste the `window.LBM.addTask({...})` command and press Enter
6. Task appears instantly — switch back to your project

---

## Option B — Two Claude Code Windows

1. Open LBM in one Claude Code window (File > Open Folder > LBM folder)
2. Open App X in a second Claude Code window
3. When you want to log a task:
   - Copy the `window.LBM.addTask({...})` command from the App X session
   - Switch to the LBM window and run it in the browser console

The LBM `CLAUDE.md` and `SKILL_ADD_TASK.md` load automatically when that window is active.

---

## Generating a Task Command

Tell Claude (in either session):

> "Add this to the task board: [description]"

Claude reads `SKILL_ADD_TASK.md` and generates the command. Example output:

```javascript
window.LBM.addTask({
  title:   "Fix payment redirect loop after token expiry",
  urgency: 5,
  value:   10000,
  area:    "security",
  source:  "recommended",
  recommendedBy: "Claude (PaymentApp session)",
  notes:   "Happens on protected checkout routes after 1hr session"
})
```

Paste this into the LBM browser console. Done.

---

## Linking Tasks to Their Source Project

Use these fields to track where a suggestion came from:

| Field | Value |
|---|---|
| `source` | `"recommended"` (Claude flagged it) or `"user-requested"` (you asked for it) |
| `recommendedBy` | `"Claude (ProjectName session)"` |

This shows up in the task detail panel and makes it easy to trace back decisions later.

---

## Note to Claude

When LBM is open alongside another project:

- **Do NOT modify LBM source files** unless the user explicitly asks
- **Only generate `window.LBM.addTask({...})` commands** — never `window.LBM` method calls that mutate tasks in unexpected ways
- Keep task creation to one task per command — don't batch multiple `addTask` calls in a loop without user review
- If the user asks to "add all these tasks", generate them one-by-one and show each before running

---

## The Full window.LBM API

```javascript
// Add a task — all fields optional except title
window.LBM.addTask({
  title:         "Task title",          // required
  urgency:       3,                     // 1–5 (default: 3)
  value:         5000,                  // dollar value (default: derived from urgency)
  area:          "product",             // area key (default: "project-system")
  source:        "user-requested",      // "user-requested" | "recommended" | "local-note"
  recommendedBy: "",                    // who recommended it (if source = "recommended")
  notes:         "Short summary",       // plain text note
  lane:          "newly-added-or-updated" // default lane — override if needed
})

// Returns the full normalised task object on success, null on error.

// Inspect all current tasks
window.LBM.getTasks()
// Returns a copy of the tasks array — safe to read and inspect.
```

---

## Quick Reference

| Action | Command |
|---|---|
| Add a task | `window.LBM.addTask({ title: "..." })` |
| See all tasks | `window.LBM.getTasks()` |
| Open DevTools console (Mac) | Cmd+Option+J |
| Open DevTools console (Win) | F12 → Console tab |
