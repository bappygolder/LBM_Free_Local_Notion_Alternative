# SKILL.md — LBM Development Guide

How to develop and extend the Local Business Manager.

---

## RUNNING THE APP

No build step. Open `index.html` directly in a browser:

```bash
open index.html
```

Or serve locally to avoid CORS issues with doc file loading:

```bash
cd TaskTracker && python3 -m http.server 8080
# Open http://localhost:8080
```

---

## ADDING A NEW FEATURE

1. **New task field** → update `normalizeTask()` in `task-app.js` to add the field with a default, add it to the modal form in `index.html`, and handle it in `handleSubmit()`.
2. **New board column** → update `DEFAULT_BOARD_COLUMNS` in `task-app.js` and add the lane key to `ALL_LANES` / `ACTIVE_LANES` as appropriate.
3. **New page** → copy the header from `docs.html`, add the tab to all 3 pages (index, docs, resources), import `styles.css` and `data/project-data.js`.
4. **New doc** → add an entry to the `docs` array in `data/project-data.js`. The docs viewer picks it up automatically.

---

## PROPERTY SYSTEM

Property labels (Stage, Urgency, Value, Area, Modified) are defined in one place and flow everywhere automatically.

**Source of truth** — `task-app.js`, `DEFAULT_PROP_LABELS` (~line 118):

```js
const DEFAULT_PROP_LABELS = { stage: "Stage", urgency: "Urgency", value: "Value", area: "Area", modified: "Modified" };
```

Users rename a property by clicking its label in the task detail panel. The new name is saved to `localStorage` under `ui.propLabels` and immediately propagates to:

- The **detail panel** (where the rename happens)
- The **Sort** panel labels
- The **Settings** popover — list view property rows and board view card field toggles

**Adding a new property:**

1. Add the key + default label to `DEFAULT_PROP_LABELS` in `task-app.js`
2. Add it to `DEFAULT_PROP_ORDER` if it should appear in the detail panel by default
3. Handle it in `buildPropValue()` (how the value renders) and `normalizeTask()` (default value)
4. Optionally add it to `DEFAULT_LIST_PROPS` and `DEFAULT_CARD_PROPS` for list/board chip visibility

The label will automatically appear in the sort panel, settings popover, and detail panel — no additional wiring needed.

---

## SEED DATA

Task seed data lives in `data/project-data.js` under `window.MCCProjectData.tracker.tasks`. To reset a browser to the latest seed: open the info panel (ⓘ button) and click "Reset to Seed".

---

## UPDATING STYLES

All styles live in `styles.css`. Design tokens are CSS variables at the top (`:root`). The dark theme uses:
- `--bg` `--surface` `--border` for backgrounds
- `--accent` (purple) and `--done` (teal) for action colours
- `--text` `--muted` `--muted-soft` for text hierarchy

---

## NOTES EDITOR (contenteditable)

The task detail panel uses a `contenteditable` div (`#notesEditor`). Content is saved as HTML into `task.body`. The plain-text preview in list/board rows reads `task.notes`.

**Future migration to BlockNote:**
When this project moves to a React + Vite setup, replace the `#notesEditor` div and its binding in `task-app.js` with a BlockNote component. The `getEditorContent()` / `setEditorContent()` helpers make the swap straightforward.

---

## RESOURCES FOLDER

Place design assets, exported icons, or reference files in `resources/`. Update `resources.html` to list new items. These files are committed to git but not bundled into any build output.

---

## AI TASK CREATION API

`window.LBM` is a public console API exposed at the bottom of `task-app.js`, inside the IIFE after `init()`. **Do not move it outside the IIFE** — it requires access to `tasks`, `normalizeTask()`, `render()`, `writeState()`, and other internal functions.

### window.LBM.addTask(taskObj)

Adds a task. All fields optional except `title`. Returns the normalised task object.

```javascript
window.LBM.addTask({
  title:   "Task title",   // required
  urgency: 4,              // 1–5 (priority auto-derived: P0/P1/P2/P3)
  value:   10000,          // dollar value (auto-derived from urgency if omitted)
  area:    "product",      // area key
  source:  "user-requested",
  notes:   "Short summary"
})
```

**Do NOT pass:** `id` (auto-generated via `createId()`), `priority` (derived from `urgency` by `urgencyToPriority()`), `lastModified` (auto-set to `today()`).

### window.LBM.getTasks()

Returns a copy of all current tasks. Safe to inspect — does not expose live references to the internal `tasks` array.

### Adding new methods

Follow the same pattern:
1. Call internal functions only (never expose mutable references)
2. Call `writeState()` and `render()` after mutating `tasks`
3. Return meaningful values (the added task, a count, etc.)

### The SKILL_ADD_TASK.md skill

`SKILL_ADD_TASK.md` defines trigger phrases and inference rules for Claude to generate `window.LBM.addTask()` commands from natural language. Read it when: adding new inference rules, extending the API, or changing field defaults.

When working on a different project and the user says "add this to the task board", Claude reads `SKILL_ADD_TASK.md` and generates the console command — the user pastes it into the LBM browser tab. See `CLAUDE_INTEGRATION_GUIDE.md` for the full workflow.
