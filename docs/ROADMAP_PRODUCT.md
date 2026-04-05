# Product Roadmap

LBM is being developed as a three-tier ecosystem — each tier building on the last without replacing it.

> **Status: Publicly tracked in version control.**
> This roadmap is intentionally open — contributors and future collaborators are welcome to read and build on it.
> When the project matures, certain sections (pricing, competitive positioning) will move to a private repo.

---

## Product Tiers

| Tier | Name | Status | Description |
|---|---|---|---|
| 1 | **LBM Free** | Active (v1) | Local-first, browser-based, open source, zero account required |
| 2 | **LBM Pro / OBM** | Planned | Cloud-synced, multi-device, team features |
| 3 | **Business in a Box** | Long-term | Full agency rollout — structured templates, proprietary content |

The current project is Tier 1. Everything being built now is the foundation that Tier 2 and 3 will extend — not replace.

---

## Technology Principles

These are non-negotiable. Every feature decision should be measured against them.

**Vanilla JS + HTML/CSS only** — no build step, no npm, no framework. Open `index.html` and it works. This keeps LBM installable in 10 seconds and maintainable by anyone who can read a `<script>` tag.

**Local-first by default** — all state lives in `localStorage`. The app works offline, always. Cloud sync (Tier 2) will be an enhancement, not a dependency.

**Speed as a feature** — every interaction should feel instant. No loading spinners, no server round-trips, no optimistic UI. If something feels slow, it gets fixed.

**Drop-in portability** — LBM should be embeddable inside any project folder. Change the storage key and it becomes a completely separate tracker. This is a unique use case that most tools ignore.

---

## Free Version (Tier 1) — Active Development

### What exists now

- List View with sorting, filtering, search, multi-select, drag-and-drop reorder
- Board View (Kanban) with drag-and-drop between columns, column collapse
- Task Detail Panel with rich-text notes editor
- Undo system (delete, lane change, title edit)
- Voice input for task creation (Web Speech API)
- Keyboard shortcuts throughout
- Docs Hub (this viewer)
- Resources tab
- Custom storage key (isolates data per copy)

### What's planned

**Shortcut Management System** — full keyboard shortcut customisation with OS conflict detection. See the [full specification](docs.html?doc=docs/ROADMAP_SHORTCUTS.md). This is our most ambitious planned feature and one of our core differentiators.

**Due date field** — lightweight deadline support without overcomplicating the task model. A single date field, a filter, and a visual indicator for overdue tasks.

**Redo (Cmd+Shift+Z)** — follow-on to the undo system. Redo stack that mirrors the undo stack.

**Undo across page refresh** — serialise the undo stack to `sessionStorage` so an accidental refresh doesn't wipe history.

**Contributing guide** — a `CONTRIBUTING.md` for open-source collaborators covering how to run the app, add features, add shortcuts, and submit PRs.

---

## Pro Version (Tier 2) — Planned

The Pro version extends LBM Free without forking it. The same UI, the same data model, the same feel — but with a cloud persistence layer replacing `localStorage` calls.

### What changes

```javascript
// Free version
localStorage.setItem('lbm-tasks', JSON.stringify(tasks));

// Pro version (same shape, different persistence)
await api.tasks.save(tasks);
```

Only two fields added to the task model: `user_id` and `workspace_id`.

### Planned Pro features

- Cloud sync (tasks, settings, shortcut profiles)
- Multi-device access (same account, any browser)
- Shared workspaces (teams)
- Activity log
- Version history per task

### Technology path

**Stage 1 — Supabase:** Managed Postgres + Auth + REST API. Free tier handles the early user base with zero server management.

**Stage 2 — PocketBase on VPS:** Single Go binary, SQLite, built-in auth and admin UI. Better unit economics when scale justifies it. Full data ownership.

---

## Repository Strategy

### Structure

```
GitHub (public)      lbm-free/    ← open source, MIT license, community edition
GitHub (private)     lbm-pro/     ← paid version, extends lbm-free core
```

**We do NOT use a true Git fork.** True forks diverge and become a merge conflict nightmare.

### Sync Workflow (Free → Pro)

Core improvements flow one-way: **lbm-free → lbm-pro**. Never the reverse.

```bash
# In lbm-pro, to pull in improvements from the free version:
git remote add upstream git@github.com:yourname/lbm-free.git
git fetch upstream
git merge upstream/main --no-commit   # always review before finalising
```

### What Lives Where

**lbm-free (public):**
- All current UI, task logic, styles, docs
- Sample tasks and documentation
- No auth, no backend, no account system
- MIT licensed

**lbm-pro (private):**
- Everything from lbm-free (periodically synced)
- Auth layer (login, signup, session management)
- API integration (replaces localStorage with API calls)
- Team/workspace features
- Pro-only UI (activity log, version history, integrations)
- Stripe billing
- Any truly sensitive internal docs (moved to private/ when needed)

### Privatization Plan (Future)

> **Status: Not started — planned for after lbm-free reaches a stable public release.**

When the project grows, all active development will move to a private fork (`lbm-private`) first, then selectively published to `lbm-free` via auto-accepted PRs through GitHub Actions.

```
lbm-private  (private fork — all active dev)
     │
     ├──(public PRs, auto-accepted)──→  lbm-free  (public, open source)
     │                                       │
     └──(pro features, manual merge)──→  lbm-pro   (private, paid version)
```

#### Auto-Accept CI Workflow (sketch)

```yaml
# .github/workflows/auto-merge-from-private.yml  (in lbm-free)
name: Auto-merge from private fork
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  auto-merge:
    if: github.head_repository.full_name == 'yourname/lbm-private'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Auto-merge
        run: gh pr merge --auto --squash "${{ github.event.pull_request.number }}"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This only auto-merges PRs that originate from `lbm-private`. External PRs still require manual review.

---

## Backend Plan

### Migration Path

LBM's localStorage read/write calls will be replaced by API calls — the data model is unchanged.

```javascript
// Current (free)
localStorage.setItem('lbm-tasks', JSON.stringify(tasks));

// Future (pro)
await api.tasks.save(tasks);    // same shape, different persistence layer
```

### Recommended Backend Stack

**Stage 1 — Launch (use Supabase):**
- Managed Postgres + Auth + REST API + Realtime
- Free tier covers ~100–500 users
- Zero server management
- Cost: $0 free → $25/month pro tier
- Use their vanilla JS client (~40KB)

**Stage 2 — Scale (migrate to PocketBase on VPS):**
- Single Go binary, SQLite, built-in Auth + Admin UI + REST API
- Host on Hetzner VPS (~$5/month fixed cost)
- Better unit economics; full data ownership
- Migrate by exporting from Supabase → importing to PocketBase

### Database Schema (for when we build it)

```sql
CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  user_id      UUID REFERENCES auth.users,
  workspace_id UUID,
  title        TEXT NOT NULL,
  lane         TEXT DEFAULT 'newly-added-or-updated',
  urgency      INTEGER,
  value        INTEGER,
  area         TEXT,
  source       TEXT,
  notes        TEXT,
  body         TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  modified_at  TIMESTAMPTZ DEFAULT NOW()
);
```

Only two columns added vs. current model: `user_id` and `workspace_id`.

---

## Technology Stack — Pro Version

| Layer | Technology | Reason |
|---|---|---|
| Frontend | Vanilla JS (keep current) | No overhead, instant load |
| Micro-reactivity | Alpine.js (15KB, if needed) | Auth UI without a framework |
| Styling | Current CSS (keep) | Already excellent |
| Backend | Supabase → PocketBase | See above |
| Auth | Supabase Auth / PocketBase Auth | Baked in |
| Payments | Stripe (Checkout + Billing Portal) | Industry standard |
| Frontend hosting | Cloudflare Pages | Free global CDN |
| Backend hosting | Supabase cloud → Hetzner VPS | Cheap, reliable |

**Do NOT add:** React, Vue, GraphQL, Docker (for local dev), Webpack/Rollup

**Only add a build step if:** BlockNote migration happens (then use Vite, pro version only)

---

## Monetization Plan

### Pricing Tiers

| Tier | Price | Features |
|---|---|---|
| **Free** | $0 forever | Local-only, full features, no account, open source |
| **Solo Pro** | $7–9/month | Cloud sync, multi-device, 1 user |
| **Team** | $19–29/month | Shared workspace, 3–5 users, activity log |
| **Agency** | $79–99/month | Unlimited users, white-label, priority support |

**Alternative model:** One-time purchase ($49) — appeals to local business owners who dislike subscriptions. "Pay once, own it."

### Launch Sequence

**Phase 1 — Validate (now → 6 months):**
- Ship free version on GitHub publicly
- Add a waitlist CTA: "LBM Cloud — coming soon"
- Do NOT build cloud features until 50+ waitlist signups confirm demand

**Phase 2 — Launch Cloud (6–12 months):**
- Ship Supabase-backed version with auth + sync
- Launch Solo Pro only at $7–9/month
- Keep it simple — no team tier yet

**Phase 3 — Expand (12–24 months):**
- Add team workspaces
- Agency/white-label tier
- Consider one-time purchase option for self-hosters

---

## Shortcut Management System

This is our single biggest planned differentiator in the keyboard-power-user market.

**The feature:** Every action in LBM has a keyboard shortcut. Every shortcut is user-editable. Every change is conflict-checked against the OS and browser before it saves.

**Why it matters:** No other local-first task tool does this. Power users — developers, designers, writers — who live on the keyboard are the most loyal and most vocal user segment. Winning them means winning word-of-mouth.

| Layer | What it does |
|---|---|
| Shortcut Registry | Central store for all shortcuts — defaults + user overrides in localStorage |
| Settings UI | Full panel to view, edit, and reset any shortcut |
| Recorder | Click to record a key combo, live capture |
| Conflict Detection L1 | Warns on internal LBM conflicts |
| Conflict Detection L2 | Blocks browser-reserved shortcuts (~40 entries) |
| Conflict Detection L3 | Warns on OS-reserved shortcuts (~90 entries, per-OS detection) |
| Dynamic UI | Tooltips and panels update live when shortcuts change |
| Import/Export | Share shortcut profiles as JSON (Pro: cloud sync) |

**Strategic position:**
- **Free feature** — this is the hook, not the paywall
- **Pro extension** — cloud shortcut profile sync across devices is a Pro-only feature
- **Marketing angle** — "We compiled 130+ system shortcuts so you never hit a dead key."

See the [full specification](docs.html?doc=docs/ROADMAP_SHORTCUTS.md).

---

## Defensibility

What makes LBM hard to copy, beyond the feature list:

**Zero friction entry** — no account, no setup, no install. Open a file. This is a promise that must never be broken, even in the Pro version.

**Local-first trust** — no privacy concern, works offline, data always accessible. This earns trust with users who've been burned by cloud-only tools going down or changing pricing.

**Built for the right audience** — not software teams. Local business owners, freelancers, solopreneurs, creators. The language and UX fits how they think, not how engineers think.

**Keyboard-first power** — serious shortcuts, customisable bindings, conflict awareness. Power users become advocates.

---

## Open Decisions

These are unresolved. Decisions will be logged as they're made.

- [ ] Who exactly is the paying user? (solopreneur / small biz owner / agency)
- [ ] Managed backend (Supabase) or self-hosted (PocketBase on VPS)?
- [ ] Free version: MIT (maximum distribution) or AGPL (prevents SaaS-on-our-code without contributing back)?
- [ ] Pricing: subscription ($7–9/month solo) or one-time purchase ($49)?
- [ ] Allow users to self-host the paid version?
- [ ] Agency tier: multi-tenancy required? (significant complexity — defer)
- [ ] Branding: keep "LBM" for both tiers, or rename Pro to "OBM"?

---

## Online Version — Deployment Plan (Future)

This section documents the planned architecture for deploying LBM as an online product (Tier 2). No code changes have been made yet — this is a roadmap item.

### Repository Strategy

Two separate GitHub repos (not branches, not a fork):

| Repo | Visibility | Purpose |
|---|---|---|
| `lbm-core` | Public, MIT | Current vanilla JS app — local-first, open source |
| `lbm-online` | Private | SaaS product — extends lbm-core with auth, cloud, billing |

`lbm-online` consumes `lbm-core` via **git subtree** (one-directional pull). When lbm-core gets improvements — new shortcuts, UI polish, bugfixes — they flow into lbm-online with a single pull command. No manual copying.

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | Next.js 14 (App Router) — for landing page SEO + auth shell |
| App UI | Keep vanilla JS/CSS from lbm-core — don't rewrite what works |
| Auth | Supabase Auth (magic link + Google OAuth) |
| Database | Supabase (Postgres) |
| Real-time sync | Supabase Realtime |
| Billing | Stripe (Checkout + Customer Portal) |
| AI layer | Claude API (Sonnet 4.6) |
| Hosting | Vercel (zero-config Next.js, preview deploys per PR) |

### Landing Page

Lives inside `lbm-online` — not a separate site or repo. One domain, one deployment, one repo.

- `/` — landing page (Next.js SSR, fully crawlable)
- `/pricing` — pricing page
- `/app` — authenticated dashboard (client-rendered, gated by auth)
- `/auth` — login/signup

The three core differentiators to lead with on the landing page:
1. **Keyboard-first speed** — every action has a shortcut; no mouse required
2. **Coordinator, not just tracker** — urgency + value scoring surfaces what matters most
3. **AI as a background operator** — Claude watches the board and acts autonomously (opt-in)

### CI/CD

- Every PR → Vercel preview deploy (automatic, unique URL)
- Merge to `main` → Vercel production deploy (automatic)
- DB migrations → reviewed in code, applied via `supabase db push`
- API keys stored as GitHub Secrets + Vercel env vars (never committed)

### AI Layer — Three Phases

**Phase 1 (Near-term):** AI drafts tasks from a plain-English description. User sees them as "Recommended" tasks and accepts or rejects each one.

**Phase 2 (Mid-term):** AI periodically reviews the board, suggests urgency changes, flags blocked tasks, surfaces what to work on next. All suggestions shown in a panel — user approves before anything changes.

**Phase 3 (Long-term — opt-in):** Autonomous mode. Claude acts as a background agent: marks tasks complete when done signals are detected, generates new tasks based on patterns, reorders priorities based on deadlines. Every autonomous change is logged in an audit trail and fully reversible.

### Implementation Order

1. Repo setup + Vercel + Supabase project
2. Landing page (Next.js + Tailwind for marketing layer only)
3. Auth (Supabase magic link + Google OAuth)
4. Cloud sync — override `readState`/`writeState` with API calls; Supabase Realtime for live updates
5. Billing (Stripe Checkout + webhook handler)
6. AI task generation (Claude API via `/api/ai/generate` route)
7. Polish, Playwright e2e tests, beta → public launch

---

## Decisions Log

```
2026-04-02 — Initial strategy documented. No code built yet.
             Free vs paid split decided: local-only free, cloud-synced paid.
             Repo strategy: two repos, not a true fork.
             Backend: Supabase first, PocketBase later.

2026-04-02 — Shortcut Management System added as planned USP.
             Decision: free feature (hook for user acquisition), Pro extension = cloud profile sync.

2026-04-02 — Document moved from private/ to docs/ — publicly tracked in version control.
             Rationale: safety (nothing lost), openness (collaborators welcome), privacy deferred until popular.

2026-04-04 — Online deployment plan documented. Two-repo strategy confirmed (lbm-core public,
             lbm-online private). git subtree for core sync. Next.js + Supabase + Stripe + Claude API
             as the online stack. Landing page lives inside lbm-online, not a separate site.
             AI autonomous mode (opt-in) confirmed as long-term differentiator.

2026-04-05 — Merged INTERNAL_ROADMAP.md into this file. Single source of truth for all product
             strategy, repo structure, monetization, and technical decisions.
```
