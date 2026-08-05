# VJS Content Platform

A content engine with AI agents that plan, write, and script social media for
Vertical Jet Sales — with a human approving everything before it posts.

It's built the same way the rest of the site works: **JSON data files + the
Sveltia CMS + a Netlify build step**. Nothing new to learn, nothing that breaks
the live site.

---

## The big picture (two phases)

**Phase 1 — Content Studio (built, live now).** Agents create and script the
content; you review and approve it. Posting is still done by a human (copy the
approved text/media into the platform, or hand it to whoever runs the accounts).
This is deliberately the safe starting point for a high-trust brand.

**Phase 2 — Auto-posting (planned, needs your accounts).** A small backend that
watches for **Approved + Scheduled** items and publishes them automatically to
Instagram, Facebook, LinkedIn, and TikTok. Requires business accounts and API
credentials — see the checklist at the bottom.

The jump between them is small on our side because Phase 1 already produces
posts in a clean, structured format Phase 2 can pick up and publish.

---

## How Phase 1 works

```
                 ┌─────────────────────────────────────────────┐
   You / Kalene  │  "Plan this week" · "Make posts for the      │
       ▼         │   Global Express" · "Write a TikTok script"  │
  ┌──────────┐   └─────────────────────────────────────────────┘
  │  Agents  │  vjs-content-studio skill
  │          │   • Strategist  → plans the calendar (pillars, channels, cadence)
  │          │   • Copywriter  → IG / LinkedIn / Facebook captions
  │          │   • Scriptwriter→ TikTok / Reels scripts + shot lists
  └────┬─────┘
       │ writes drafts (grounded in real inventory + brand voice)
       ▼
  data/content/*.json   ── build-content-index.js ──►  data/content-index.json
       │                                                       │
       ▼                                                       ▼
  /admin  (Sveltia CMS)                              /content.html
  Review → edit → set status                         Content Studio dashboard
  to "Approved"                                      (pipeline board + calendar)
```

### The pieces

| File / folder | What it is |
|---|---|
| `content/brand-voice.md` | The voice + hard rules every agent reads first. **The tone dial.** |
| `content/content-strategy.yml` | Channels, cadence, pillar mix, CTAs. **The strategy dial.** |
| `.claude/skills/vjs-content-studio/` | The agent skill — the create/script engine. |
| `data/content/*.json` | One file per post/reel/script. This is the content itself. |
| `build-content-index.js` | Rebuilds `content-index.json` on every deploy (Netlify runs it). |
| `admin/config.yml` → "Content Studio" | Where Kalene reviews and approves, no code. |
| `content.html` | The dashboard — pipeline board of everything in flight. |

### The approval loop (the whole safety model)

Every item has a **Status**. The agents can only ever create `Draft`s. A human
moves it forward:

`Idea → Draft → Needs Edit → Approved → Scheduled → Posted`

**Nothing is ever cleared to post until a person sets it to `Approved`.** In
Phase 2, the auto-poster only touches items that are `Approved` **and** have a
`Scheduled For` date.

---

## How to use it (day to day)

### To generate content
Ask the agent, in plain English. Examples:
- "Plan this week's content across all four channels."
- "Make an Instagram reel and a LinkedIn post for the Global Express XRS."
- "Write three TikTok scripts explaining light-jet buying to first-time owners."
- "Turn the new Challenger listing into posts."

The agent reads your real inventory and brand voice, writes the drafts into
`data/content/`, and rebuilds the index. It will **not** post anything.

### To review and approve
1. Open **`/content.html`** to see everything in flight (the pipeline board).
2. Click any card, or go to **`/admin` → Content Studio**.
3. Read it, edit anything (it's just a form), fix the hook, swap a photo.
4. Set **Status → Approved**. Add a **Scheduled For** date if you want it slotted.
5. Save. Done.

### To adjust the whole strategy
- Change **tone/rules** → edit `content/brand-voice.md`.
- Change **how often / which channels / pillar mix** → edit
  `content/content-strategy.yml`.
No code changes needed — the agents read these files every run.

---

## Phase 2 — Auto-posting (the roadmap)

Phase 1 does everything except the final "hit publish." Phase 2 adds a small
always-on backend (recommended: **Railway**, which VJS already uses for the MIR
app) that:

1. Reads `content-index.json` (or the GitHub content files directly).
2. Finds items that are `Approved` and whose `Scheduled For` date is due.
3. Publishes them to the right platform via its official API.
4. Flips the item's status to `Posted` and records the live URL.

### What each platform requires (this is the real work)

| Platform | API | What's needed from you |
|---|---|---|
| **Instagram** | Instagram Graph API (via Meta) | An Instagram **Business** account linked to a **Facebook Page**, a Meta Developer app, and app review for the content-publishing permission. Images/videos must be hosted at a public URL (our `/uploads` works). Reels supported; carousels supported. |
| **Facebook** | Facebook Pages API (via Meta) | The same Facebook Page + Meta app. Page access token. Simplest of the four. |
| **LinkedIn** | LinkedIn Marketing / Posts API | A LinkedIn **Company Page**, a LinkedIn Developer app, and approval for the "Community Management" / posting product. Posts to the VJS company page. |
| **TikTok** | TikTok Content Posting API | A TikTok Business account, a TikTok for Developers app, and approval for the Content Posting API. Note: TikTok often lands content in your drafts for a final in-app tap, depending on approval tier. |

**Reality check:** the code to post is straightforward. The gating item is
**account setup + app review** on each platform — that's paperwork and approval
time (days to a couple of weeks per platform), and it needs you to own/authorize
the business accounts. This is why Phase 1 ships value immediately while Phase 2
account approvals run in parallel.

### Suggested Phase 2 build order (fastest value first)
1. **Facebook + Instagram together** (one Meta app covers both).
2. **LinkedIn** (highest-value B2B channel; add once the Meta loop is proven).
3. **TikTok** (most restrictive; do last).

### Nice-to-haves once posting works
- **Lead capture:** route CTA clicks / DMs into **HubSpot** (already connected).
- **Analytics:** pull reach/engagement back onto the dashboard to learn what
  works and steer `content-strategy.yml`.
- **A "comment/DM triage" agent** that drafts replies for approval (same
  human-in-the-loop pattern as email triage).

---

## Guardrails baked in (so it's safe to run)

- Agents never invent specs, hours, pricing, or maintenance status — every
  aircraft claim traces to its data file.
- No numeric price is published unless the listing's price is a real, approved
  number.
- No client/buyer/seller is ever named; no "why it's selling."
- No investment-return or guarantee language.
- **A human approves every post before it can go live.**

Full rules live in `content/brand-voice.md`.
