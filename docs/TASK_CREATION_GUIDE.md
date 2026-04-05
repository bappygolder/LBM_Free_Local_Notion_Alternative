# Task Creation Guide

How to create high-quality tasks in LBM — whether you're typing them by hand, dictating them, or asking Claude to add them for you.

---

## The Core Rule: Every Task Has a Revenue Story

LBM is built toward a specific goal: **$1 → $10 → $100 → $1,000,000** from this project. Every task you create should serve that path. Before adding a task, ask yourself:

> "Does this move the project toward profit — and at which stage?"

If you can't answer that, the task either needs more thought or shouldn't be on the board yet.

This isn't about ignoring maintenance or internal work. It means every task should have a documented reason for existing that connects back to value — even if that value is "this unblocks something bigger."

---

## The Four-Section Description Format

Every task in LBM has a **description** field built from four required sections. This is different from the short **notes** field (a one-liner summary). The description is where you write the full brief — enough context for a person or an AI agent to pick up the task cold and execute it.

### Section 1 — What to do

Write this as if briefing a capable developer, marketer, or AI agent who has no prior context. Be specific. If you have a partial prompt or approach in mind, include it here. Examples, links, and file paths are welcome.

**Good:**
> In `task-app.js`, add a `dueDate` field to `normalizeTask()` with a default of `null`. Add a date input to the New Task modal in `index.html` (after the notes field, same label style). Store and render the date in the detail panel using the existing `lastModified` date format.

**Too vague:**
> Make the task modal better.

### Section 2 — Why it matters

Why does this task exist? What breaks, stalls, or suffers if it doesn't get done? Connect it to the user experience, revenue, or the project mission.

**Good:**
> Without a pricing page, users who land on LBM have no way to understand what paid tiers exist or why they should upgrade. The funnel has no conversion point.

**Too vague:**
> This would be nice to have.

### Section 3 — Why it's valuable

What does completing this unlock? Quantify if possible. Name the revenue tier it serves.

Use this framing where it applies:
- **$1 tier** — enables the first transaction / the first paying user
- **$10 tier** — enough utility to justify recommending to someone else
- **$100 tier** — enough retention / polish that users pay monthly
- **$1,000 tier** — feature that justifies a higher price point or team plan
- **$1M tier** — scalable infrastructure, virality, or enterprise readiness

**Good:**
> This is the $1 gate. A single conversion from this page proves the monetization model works. Every week without it is a week of zero revenue.

**Too vague:**
> This will add value to the product.

### Section 4 — Why it's urgent

What makes this time-sensitive now versus later? Is there a dependency, a window of opportunity, or a compounding cost if it's deferred?

**Good:**
> The product is functionally ready. The only thing between the current state and the first dollar is a conversion path. Build this before any other feature work.

**Too vague:**
> Should be done soon.

---

## Tags — Classify Your Work

Tags let you filter and group tasks by the kind of work they represent. Assign one or more from this list:

| Tag | What it covers |
|---|---|
| `marketing` | Growth, social media, SEO, outreach, audience building |
| `monetization` | Pricing, revenue, conversion, payments, upsells |
| `ux` | UI design, layout, visual polish, animations, accessibility |
| `dev` | Code, architecture, refactoring, APIs, performance |
| `efficiency` | Automation, scripts, tooling, workflow shortcuts |
| `content` | Copy, onboarding messages, blog posts, documentation text |
| `analytics` | Metrics, tracking, reporting, dashboards, A/B tests |
| `security` | Auth, compliance, data privacy, SSL, permissions |
| `docs` | Developer guides, README, setup instructions, how-tos |
| `release` | Versioning, shipping, deployment, changelogs |
| `product` | Core feature work, user stories, roadmap items |
| `platform` | Infrastructure, CI/CD, build system, hosting |

A single task can have multiple tags. For example, a task that redesigns the upgrade button to improve conversion is tagged `["monetization", "ux"]`.

---

## Urgency Scale

| Level | Label | When to use |
|---|---|---|
| 5 | Critical | Blocking revenue, breaking core feature, or time-critical dependency |
| 4 | High | Important, needs to happen this sprint |
| 3 | Medium | Normal priority — the default |
| 2 | Low | Do when there's space, not time-sensitive |
| 1 | Minimal | Nice to have, fully deferrable |

Urgency drives the priority badge (P1–P5) and the urgency dot color in the UI.

---

## Effort Scale (1–10)

Effort measures how much work a task requires — independent of urgency or value. A critical one-liner hotfix is urgency 5, effort 1. A low-priority system rewrite is urgency 1, effort 10.

| Level | Label | What it means |
|---|---|---|
| 1 | Trivial | One-liner fix, rename, copy edit — minutes |
| 2–3 | Small | Single function, simple style change — under an hour |
| 4–5 | Medium | A few files, new component, moderate logic — half a day (default) |
| 6–7 | Large | Multi-file feature, new page, significant refactor — a full day or more |
| 8–9 | Very large | New system, major architecture change — multiple days |
| 10 | Epic | Requires multiple sessions, many moving parts — a full sprint |

**Default:** `5` when there is no complexity signal. Claude infers this from language cues ("quick fix" → low, "rethink the whole system" → high).

---

## Added By — Tracking Who Created the Task

Every task has an `addedBy` field that records who (or what) created it:

- **Claude-created tasks** — automatically set to the Claude model ID (e.g. `"claude-sonnet-4-6"`, `"claude-opus-4-6"`). This happens any time Claude adds a task via `SKILL_ADD_TASK.md`.
- **User-created tasks** — `addedBy` is left blank (`""`). This covers tasks created via the inline form, tasks.json edits, or voice input.

This lets you filter and audit AI-generated tasks separately from human-created ones. It also creates a traceable record of which model made which recommendations.

---

## Dollar Value

The value field is your estimate of the business impact. Use these as reference points:

| Scenario | Value |
|---|---|
| Directly enables revenue, payment, or first conversion | $25,000 |
| Improves user experience, growth, or retention | $10,000 |
| Internal efficiency, automation, tooling, documentation | $5,000 |
| Minor, cosmetic, low-impact | $1,000 |

This isn't accounting — it's a relative priority signal. A $25k task should always move before a $1k task at equal urgency.

---

## How to Add a Task

### Method 1 — Tell Claude (recommended when in Claude Code)

Say any of the following:

- "Add this to the task board: [description]"
- "Add to LBM: [description]"
- "Create a task for X"
- "Log this as a task"
- "Track this in LBM"
- "Make a task: X" / "LBM task: X"
- "Put this on the board"

Claude reads `SKILL_ADD_TASK.md`, infers urgency/value/area/tags from context, builds the 4-section description, shows you a draft, and then writes it directly to `data/tasks.json`. You reload the browser tab and the task appears.

**This is the preferred method** — Claude constructs the description for you and you can refine it before confirming.

### Method 2 — Browser console (when LBM is open)

Open DevTools (F12 → Console) and run:

```javascript
window.LBM.addTask({
  title:       "Your task title",
  urgency:     4,
  effort:      5,
  value:       10000,
  area:        "product",
  tags:        ["monetization", "dev"],
  addedBy:     "claude-sonnet-4-6",   // set when Claude creates the task; leave "" for manual
  notes:       "Short one-liner summary",
  description: "## What to do\n...\n\n## Why it matters\n...\n\n## Why it's valuable\n...\n\n## Why it's urgent\n..."
})
```

See [AI Task Creation](docs.html?doc=docs/AI_TASK_CREATION.md) for full API reference.

### Method 3 — Edit tasks.json directly

Open `data/tasks.json` and add a new task object to the `tasks` array, then run:

```bash
node scripts/sync-tasks.js
```

Reload the browser tab. See [File Sync](docs.html?doc=docs/FILE_SYNC.md) for details on the sync script.

### Method 4 — Inline form in the app

Click the **+ Add task** button (or press `N`) in List View. Type a title and press Enter to save. You can edit urgency, area, tags, and description in the Detail Panel after saving.

---

## Example: Well-Written Task

### Title
Add Stripe checkout to the upgrade flow

### Notes (one-liner)
No payments possible without this — first revenue gate

### Tags
`monetization`, `dev`

### Urgency / Effort
5 (Critical) / 7 (Large)

### Added by
`claude-sonnet-4-6`

### Description

**## What to do**
Integrate Stripe Checkout into the upgrade button flow in `index.html`. When a user clicks "Upgrade to Pro", redirect to a Stripe-hosted checkout page using `stripe.redirectToCheckout({ sessionId })`. Create a lightweight `/api/create-checkout-session` endpoint (or use Stripe's client-only flow for now). Handle the success/cancel redirect back to the app. Store the user's plan tier in localStorage as `lbm-plan: "pro"` once checkout completes.

**## Why it matters**
Without a payment path, the product cannot generate revenue. The upgrade button currently goes nowhere. Every week this isn't in place is a week with zero monetization.

**## Why it's valuable**
This is the $1 gate — the single most important task on the board. Once one person pays $9, the model is proven. Everything else on the monetization roadmap depends on this existing first.

**## Why it's urgent**
The product is functionally complete for a paying user. There is no technical blocker. The only thing between the current state and revenue is this integration. All other feature work is lower-priority until this is done.

---

## Common Mistakes to Avoid

| Mistake | Instead |
|---|---|
| Title is a vague noun phrase ("Better onboarding") | Use an action verb ("Add welcome modal with 3-step onboarding flow") |
| Notes field is empty | Always write a one-liner — it shows in list view |
| Description skips the value section | Always name the revenue tier it serves |
| Urgency 5 on everything | Reserve 5 for genuine blockers — inflation makes it meaningless |
| Tags left empty | Assign at least one tag — it enables filtering later |
| "What to do" is one sentence | Treat it as an AI prompt — be specific enough that someone could start immediately |
| Effort left at default for obvious big/small tasks | Set effort accurately — it signals how to schedule the task alongside others |
| addedBy left blank on Claude-created tasks | Always set `addedBy` to the model ID when Claude adds the task |

---

## Related

- [AI Task Creation](docs.html?doc=docs/AI_TASK_CREATION.md) — API reference and Claude integration
- [File Sync](docs.html?doc=docs/FILE_SYNC.md) — how tasks.json syncs to project-data.js
- [Keyboard Shortcuts](docs.html?doc=docs/KEYBOARD_SHORTCUTS.md) — fast task creation shortcuts
- [Vision and Philosophy](docs.html?doc=docs/VISION_AND_PHILOSOPHY.md) — why LBM exists and where it's going
