# SKILL: Add a Task to LBM via Claude

Read this file fully before executing. This skill runs whenever the user wants to log a task to the Local Business Manager (LBM) during any Claude Code session.

---

## PREFERRED METHOD: FILE-BASED (no browser required)

Use this method when Claude Code is open in the LBM workspace. It requires no browser interaction.

### Steps

1. **Parse** the request using the inference tables below (urgency, value, area).
2. **Show the draft** task to the user (same format as Step 5 below).
3. **Write the task** to `data/tasks.json` — add the new task object to the `"tasks"` array. Assign a new ID following the existing convention (`LBM-XXX` or the next sequential ID). Do NOT set `id` to auto-generated values — pick the next unused one by scanning existing IDs in tasks.json.
4. **Run the sync script**:
   ```
   node scripts/sync-tasks.js
   ```
5. **Tell the user**: "Task added. Reload the browser tab to see it."

### Rules for tasks.json writes
- Always read `data/tasks.json` first to see existing IDs before assigning a new one.
- Default `lane` is `"newly-added-or-updated"` unless the user specifies otherwise.
- Do NOT set `priority` — it is derived by `normalizeTask()` from `urgency`.
- Do NOT set `lastModified` — auto-set by the app on first load.
- `source` is `"user-requested"` for user tasks; `"recommended"` + `recommendedBy` when Claude is suggesting.

---

## FALLBACK METHOD: BROWSER CONSOLE

Use this method when the browser is already open and Claude is not in the LBM workspace (e.g. cross-project usage).

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
