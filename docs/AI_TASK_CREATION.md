# AI Task Creation

LBM supports several AI-powered ways to create tasks without filling out a form manually: **Claude Code skill** (file-based, recommended), **browser console**, and **voice input**.

For the full guide on how to write high-quality tasks — including the 4-section description format and revenue-tier tagging — see [Task Creation Guide](docs.html?doc=docs/TASK_CREATION_GUIDE.md).

---

## Method 1 — Claude Code Skill (recommended)

Tell Claude (in any session):

> "Add this to the task board: [description]"

Claude reads `SKILL_ADD_TASK.md`, infers urgency/effort/value/area/tags from context, builds the 4-section description, sets `addedBy` to its own model ID, shows you a draft, and writes it directly to `data/tasks.json`. Reload the browser tab and the task appears.

### Trigger phrases

- "Add this to the task board"
- "Add to LBM: [description]"
- "Create a task for X"
- "Log this as a task"
- "Track this in LBM"
- "Make a task: X" / "LBM task: X"
- "Put this on the board"

### How Claude infers fields

**Urgency:**

| What you say | Urgency | Label |
|---|---|---|
| "critical", "blocker", "ASAP", "emergency" | 5 | Critical |
| "important", "high priority", "soon" | 4 | High |
| (no cue) | 3 | Medium |
| "when I get to it", "someday", "low priority" | 2 | Low |
| "nice to have", "optional", "minor" | 1 | Minimal |

**Effort (1–10):**

| What you say | Effort |
|---|---|
| "quick", "one-liner", "easy", "small fix" | 1–3 |
| (no cue) | 5 (default) |
| "new feature", "few files", "moderate" | 4–6 |
| "big", "complex", "new system", "rethink" | 7–10 |

**Dollar value:**

| Context | Value |
|---|---|
| Directly enables revenue / first conversion | $25,000 |
| Improves user experience or growth | $10,000 |
| Internal / docs / tooling / efficiency | $5,000 |
| Minor / cosmetic | $1,000 |

**Area:**

| Subject | Area |
|---|---|
| Documentation, README, guides | `docs` |
| Security, auth, permissions | `security` |
| Design, UI/UX, CSS, layout | `ui-ux` |
| Platform, infra, deploy, CI/CD | `platform` |
| Release, versioning, launch | `release` |
| Product features, user stories | `product` |
| Everything else | `project-system` |

**Tags (multi-tag):**

| Subject | Tag |
|---|---|
| Growth, social, SEO, outreach | `marketing` |
| Pricing, revenue, conversion, payments | `monetization` |
| UI design, layout, animations | `ux` |
| Code, architecture, APIs | `dev` |
| Automation, tooling, workflow | `efficiency` |
| Copy, onboarding, blog, docs content | `content` |
| Metrics, tracking, reporting | `analytics` |
| Security, auth, compliance | `security` |
| Documentation, how-to guides | `docs` |
| Release, versioning, shipping | `release` |
| Core product features | `product` |
| Infrastructure, deploy, platform | `platform` |

---

## Method 2 — Voice Input

Click the **microphone button** next to the Title field in the New Task modal. Speak your task — the title auto-fills and urgency/area are inferred from keywords in your speech.

See [Voice Commands](docs.html?doc=docs/VOICE_COMMANDS.md) for the full guide.

---

## The window.LBM Console API

LBM exposes a public API in the browser console whenever `index.html` is open.

### window.LBM.addTask(taskObj)

Adds a task. All fields optional except `title`. Returns the full task object.

```javascript
window.LBM.addTask({
  title:       "Add pricing page with plan comparison",  // required
  urgency:     5,                                         // 1–5 (default: 3)
  effort:      6,                                         // 1–10 (default: 5)
  value:       25000,                                     // dollar value
  area:        "product",                                 // area key
  tags:        ["monetization", "ux"],                   // tag array
  source:      "user-requested",                          // or "recommended"
  addedBy:     "claude-sonnet-4-6",                      // model ID — always set when Claude creates
  notes:       "First conversion point — no pricing = no revenue",
  description: "## What to do\nCreate a pricing page...\n\n## Why it matters\n...\n\n## Why it's valuable\n...\n\n## Why it's urgent\n..."
})
```

### window.LBM.getTasks()

Returns a snapshot of all tasks (copies, not live references).

```javascript
const tasks = window.LBM.getTasks();
console.log(tasks.length, "tasks");
```

### Field reference

| Field | Type | Default | Notes |
|---|---|---|---|
| `title` | string | — | **Required** |
| `urgency` | 1–5 | 3 | Sets priority automatically |
| `effort` | 1–10 | 5 | Task complexity estimate (1 = trivial, 10 = epic) |
| `value` | number | derived from urgency | Dollar value |
| `area` | string | `"project-system"` | See area keys above |
| `tags` | string[] | `[]` | One or more tag keys — see tag list above |
| `source` | string | `"user-requested"` | `"recommended"` / `"local-note"` |
| `recommendedBy` | string | `""` | Who flagged it (if source = recommended) |
| `addedBy` | string | `""` | Claude model ID when task created by AI — always set by Claude |
| `notes` | string | `""` | Short plain-text one-liner (max ~150 chars) |
| `description` | string | `""` | 4-section markdown (What / Why it matters / Why valuable / Why urgent) |
| `lane` | string | `"newly-added-or-updated"` | Override starting lane |

**Area keys:** `"project-system"` `"docs"` `"product"` `"platform"` `"release"` `"security"` `"ui-ux"`

**Tag keys:** `"marketing"` `"monetization"` `"ux"` `"dev"` `"efficiency"` `"content"` `"analytics"` `"security"` `"docs"` `"release"` `"product"` `"platform"`

**addedBy values:** `"claude-sonnet-4-6"` · `"claude-opus-4-6"` · `"claude-haiku-4-5-20251001"` · `""` (user-created)

**Do NOT pass:** `id`, `priority`, `lastModified` — these are always auto-generated.

---

## Example console commands

**Revenue-critical feature:**
```javascript
window.LBM.addTask({
  title:       "Add Stripe checkout to the upgrade flow",
  urgency:     5,
  effort:      7,
  value:       25000,
  area:        "product",
  tags:        ["monetization", "dev"],
  addedBy:     "claude-sonnet-4-6",
  notes:       "No payments possible without this — first revenue gate",
  description: "## What to do\nIntegrate Stripe Checkout into the upgrade button flow. Redirect to Stripe-hosted checkout on click. Handle success/cancel redirects. Store plan tier in localStorage.\n\n## Why it matters\nWithout a payment path, the product cannot generate revenue. The upgrade button currently goes nowhere.\n\n## Why it's valuable\nThis is the $1 gate. Once one person pays $9, the model is proven. Everything else on the monetization roadmap depends on this existing first.\n\n## Why it's urgent\nThe product is functionally complete. There is no technical blocker. All other feature work is lower-priority until this is done."
})
```

**Growth/marketing task:**
```javascript
window.LBM.addTask({
  title:       "Write SEO landing page copy for LBM homepage",
  urgency:     3,
  effort:      4,
  value:       10000,
  area:        "product",
  tags:        ["marketing", "content"],
  source:      "recommended",
  recommendedBy: "Claude Sonnet 4.6",
  addedBy:     "claude-sonnet-4-6",
  notes:       "Organic search is the lowest-cost acquisition channel",
  description: "## What to do\nWrite and publish an SEO-optimised landing page. Target keywords: 'free task tracker', 'local project manager', 'offline task manager'. Include headline, 3 feature sections, social proof placeholder, and CTA.\n\n## Why it matters\nThere is currently no web presence for LBM. No presence = no organic discovery.\n\n## Why it's valuable\nSEO compounds over time. One ranking page can deliver free users for years — a $10-tier unlock.\n\n## Why it's urgent\nEarlier is better for SEO indexing. Every month without a page is a month of lost compounding."
})
```

**Internal efficiency:**
```javascript
window.LBM.addTask({
  title:       "Add CSV export to the task list view",
  urgency:     2,
  effort:      3,
  value:       5000,
  area:        "product",
  tags:        ["efficiency", "dev"],
  addedBy:     "claude-sonnet-4-6",
  notes:       "Enables sharing task snapshots with non-technical stakeholders",
  description: "## What to do\nAdd an 'Export CSV' button to the List View toolbar. On click, generate a CSV from window.LBM.getTasks() with columns: ID, Title, Area, Tags, Urgency, Value, Lane, Notes, Last Modified. Trigger a browser download via a dynamically created <a download> link.\n\n## Why it matters\nNo way to extract task data in a shareable format. Blocks workflows with external stakeholders.\n\n## Why it's valuable\n$10-tier unlock — adds enough utility to justify recommending LBM to a second person.\n\n## Why it's urgent\nLow urgency in isolation. Defer until after monetization-critical tasks are done."
})
```

---

## Cross-Project Usage

LBM can receive tasks from any Claude Code session — you don't need to be working inside the LBM workspace.

See [Claude Integration Guide](docs.html?doc=CLAUDE_INTEGRATION_GUIDE.md) for the two-tab workflow and full instructions.
