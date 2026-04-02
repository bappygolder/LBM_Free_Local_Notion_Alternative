# SKILL: Add a Task to LBM via Claude

Read this file fully before executing. This skill runs whenever the user wants to log a task to the Local Business Manager (LBM) during any Claude Code session.

---

## TRIGGER PHRASES

Any of the following starts a full run:

- "Add this to the task board"
- "Add to LBM: [description]"
- "Create a task for X"
- "Log this as a task"
- "Track this in LBM"
- "Make a task: X"
- "LBM task: X"
- "Put this on the board"

---

## EXECUTION STEPS

### Step 1 — Parse the request

Extract from what the user said or the current context:

| Field | Notes |
|---|---|
| `title` | Required. Clear action-oriented phrase. |
| `urgency` | 1–5 (infer from language cues — see table below) |
| `value` | Dollar amount (infer from context — see table below) |
| `area` | Category key (infer from subject matter — see table below) |
| `notes` | Any extra detail the user mentioned |

### Step 2 — Infer urgency

| Language cue | Urgency |
|---|---|
| "critical", "blocker", "blocking", "ASAP", "emergency" | 5 |
| "important", "high priority", "soon", "immediately" | 4 |
| No cue / "medium", "normal" | 3 (default) |
| "when I get to it", "someday", "low priority", "eventually" | 2 |
| "nice to have", "optional", "minor", "low" | 1 |

### Step 3 — Infer value ($)

| Context | Value |
|---|---|
| Core feature, P0 blocker, revenue-critical | 25000 |
| User-facing improvement, significant feature | 10000 |
| Internal improvement, documentation, tooling | 5000 |
| Low-impact, minor, cosmetic | 1000 |

### Step 4 — Infer area

| Subject matter | Area key |
|---|---|
| Documentation, README, guides, write-ups | `"docs"` |
| Security, auth, permissions, SSL, certs | `"security"` |
| Design, UI, UX, layout, CSS, colors, fonts | `"ui-ux"` |
| Platform, infra, deploy, build, CI/CD | `"platform"` |
| Release, versioning, ship, launch, publish | `"release"` |
| Product features, user stories, workflow | `"product"` |
| Everything else | `"project-system"` |

### Step 5 — Show draft to user

Show the inferred task object before executing. Example format:

```
Adding to LBM:
  Title:   "Fix auth redirect loop"
  Urgency: 5 (Critical)
  Value:   $10,000
  Area:    security
  Notes:   "Happens after token expiry on protected routes"

Paste this in the LBM browser console to confirm:
```

Then show the console command (Step 6).

### Step 6 — Generate the console command

```javascript
window.LBM.addTask({
  title:  "Fix auth redirect loop",
  urgency: 5,
  value:  10000,
  area:   "security",
  source: "user-requested",
  notes:  "Happens after token expiry on protected routes"
})
```

**Rules:**
- Do NOT pass `id` — auto-generated
- Do NOT pass `priority` — derived from `urgency` by `normalizeTask()`
- Do NOT pass `lastModified` — auto-set to today
- Do NOT pass `lane` unless you want to override the default (`"newly-added-or-updated"`)
- `source` is almost always `"user-requested"`; use `"recommended"` + `recommendedBy` when Claude is suggesting it

---

## CROSS-PROJECT USAGE

When Claude is helping build a different project and the user wants to log a task to LBM:

1. LBM should be open in a second browser tab
2. Generate the `window.LBM.addTask({...})` command
3. Tell the user to paste it in the LBM tab's DevTools console (F12 → Console)

See `CLAUDE_INTEGRATION_GUIDE.md` for full cross-project workflow.

---

## WHAT window.LBM EXPOSES

```javascript
// Add a task (returns the normalised task object)
window.LBM.addTask({ title: "...", urgency: 3, value: 5000, area: "product", notes: "..." })

// Inspect current tasks
window.LBM.getTasks()
```

Both methods are available in the browser console whenever `index.html` is open.

---

## VALID FIELD VALUES

```
lane:    "newly-added-or-updated" | "backlog" | "processing" | "on-hold" | "in-progress"
urgency: 1 | 2 | 3 | 4 | 5
area:    "project-system" | "docs" | "product" | "platform" | "release" | "security" | "ui-ux"
source:  "user-requested" | "recommended" | "local-note"
```
