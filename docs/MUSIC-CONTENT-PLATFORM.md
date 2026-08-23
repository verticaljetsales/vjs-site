# Ben McPeak — Music Content Platform

A content engine with AI agents that plan, write, and script social media for
Ben McPeak's music — with a human approving everything before it posts. Built
the same way the VJS content studio is: **JSON data files + the Sveltia CMS + a
Netlify build step.** Nothing new to learn, nothing that breaks the live site.

---

## The big picture (two phases)

**Phase 1 — Content Studio (built, live now).** Agents create and script the
content; you review and approve it. Posting is still done by a human (or a
scheduler like Publer/Later). This is the safe starting point.

**Phase 2 — Auto-posting (planned, needs your accounts).** A small backend that
watches for **Approved + Scheduled** items and publishes automatically to
TikTok, Instagram, YouTube, and Facebook. Requires business accounts + API
approval — see the checklist at the bottom.

---

## How Phase 1 works

```
                 ┌─────────────────────────────────────────────┐
   You / team    │  "Plan this week" · "Make a TikTok for       │
       ▼         │   Hurry Up Whiskey" · "Build a release plan" │
  ┌──────────┐   └─────────────────────────────────────────────┘
  │  Agents  │  music-content-studio skill
  │          │   • Strategist   → plans the calendar (pillars, channels, cadence)
  │          │   • Copywriter   → captions for any channel
  │          │   • Scriptwriter → TikTok/Reels/Shorts scripts + recording lists
  └────┬─────┘
       │ writes drafts (grounded in real songs + shows + brand voice)
       ▼
  data/music/content/*.json ── build-music-index.js ──► data/music/content-index.json
       │                                                        │
       ▼                                                        ▼
  /admin  (Sveltia CMS)                              /music-studio.html
  🎸 Music — Content Studio                          the review dashboard
  Review → edit → set status to "Approved"           (pipeline board)
```

### The pieces

| File / folder | What it is |
|---|---|
| `content/music/brand-voice.md` | The voice + hard rules the agent reads first. **The tone dial.** |
| `content/music/content-strategy.yml` | Channels, cadence, pillar mix, CTAs, release playbook. **The strategy dial.** |
| `content/music/visual-style.md` | The look — palette, templates, the audio reality. |
| `.claude/skills/music-content-studio/` | The agent skill — the create/script engine. |
| `data/music/songs/*.json` | The catalog. Every song fact traces here. |
| `data/music/shows/*.json` | Tour dates. Only `confirmed:true` shows get posted. |
| `data/music/content/*.json` | One file per post. This is the content itself. |
| `data/music/inbox/*.json` | Drop raw material here; the agent turns it into posts. |
| `tools/compose-music-visuals.cjs` | Renders the branded graphic for every post. |
| `tools/compose-music-video.cjs` | Builds the vertical motion clip for video posts. |
| `build-music-index.js` | Rebuilds the indexes on every deploy (Netlify runs it). |
| `music-studio.html` | The dashboard — the pipeline board of everything in flight. |
| `admin/config.yml` → 🎸 Music collections | Where you review and approve, no code. |

### The approval loop (the whole safety model)

Every item has a **Status**. The agent can only ever create `Draft`s. A human
moves it forward: `Idea → Draft → Needs Edit → Approved → Scheduled → Posted`.
**Nothing is cleared to post until a person sets it to `Approved`.**

---

## How to use it (day to day)

### To generate content
Ask the agent in plain English:
- "Plan this week's content across all four channels."
- "Make three TikTok scripts for Hurry Up Whiskey."
- "Write the story-behind-the-song for If Trucks Could Talk."
- "Build a 5-week release plan for my next single."
- "Turn the clip I dropped in the inbox into posts."

The agent reads your real songs/shows and brand voice, writes drafts into
`data/music/content/`, composes the branded visuals, and rebuilds the index. It
**never** posts anything, and it **never** invents a fact, a lyric, or a show.

### The one thing only you can do: film the performance
The studio brands photos and builds motion graphics, but it **cannot generate
Ben singing.** The single best-performing music content is a phone clip of Ben's
real voice. So every video script ends with a **recording list** — exactly what
to film (which song, which section, setting, framing). Film it, drop it in
`media/music/uploads/`, put the path on the post's `media`, and re-run the
composer.

### To review and approve
1. Open **`/music-studio.html`** to see everything in flight.
2. Click any card, or go to **`/admin` → 🎸 Music — Content Studio**.
3. Read it, edit anything, fix the hook, swap a photo.
4. Set **Status → Approved**, add a **Scheduled For** date. Save. Done.

### To adjust the whole strategy
- Change **tone/rules** → edit `content/music/brand-voice.md`.
- Change **channels / cadence / pillar mix** → edit
  `content/music/content-strategy.yml`.
No code changes — the agent reads these every run.

---

## The strategy behind the config (2026 country-artist research)

The numbers in `content-strategy.yml` aren't guesses — they're set from what's
actually working for independent and emerging country artists right now.

**The core truths shaping everything:**
- **TikTok is the discovery engine.** ~84% of songs that break did it on TikTok
  first. Post the most there — raw, one-take, real. It punishes polish.
- **Country skews young for discovery but keeps a loyal 35+ base.** Run
  TikTok/Reels/Shorts for new ears; keep **Facebook** warm for the older Texas
  crowd who actually buy show tickets. That split matters more in country than
  in most genres.
- **Authenticity is the genre's currency.** Over-produced content underperforms
  harder in country than anywhere. Ben's voice and real stories are the product.

**The top-converting formats (lead with these):**
1. **Raw acoustic hook** — the catchiest 8–15 seconds, phone-shot, to camera.
2. **"Story behind the song" → into the chorus** — country's storytelling DNA
   meets the algorithm's need for a hook.
3. **Line-dance / participation prompt** when a song's hook supports it — the
   country-native viral cheat code (see Dasha's "Austin").
4. **Singing to strangers / honky-tonk & tailgate clips**, duets/stitches.

**Recommended weekly pillar mix** (in the config): New-music & teasers 30% ·
Story & songwriter 22% · Personality & fans 20% · Live & road 18% · Faith,
family & hometown 10%. Keep overt promo (pre-save/tickets/merch) to ~1 in 6.

**Cadence:** TikTok 6–7/wk (1–2/day is the ceiling) · Instagram 5/wk · YouTube
4/wk (Shorts + long-form) · Facebook 4/wk. Consistency beats perfection — three
good-enough posts beat one perfect one.

**Best times (local):** TikTok Tue–Thu 2–6 PM & 6–9 PM · Instagram Mon–Thu
11 AM–1 PM & 7–9 PM · release day: post morning + evening.

**The release playbook** (in the config, Day −14 → +21): film ONE real
performance capture, slice it into 8–12 short cuts, run a pre-save (target
500–2,000+), double-post on release day across all four platforms, then sustain
4–7 posts/week for three weeks — most artists quit too early.

**The growth move most artists skip: build an owned audience.** An email/SMS
list beats pre-saves because you own the relationship. Funnel Spotify/bio
traffic to a landing page offering a free track or early access in exchange for
an email, from day one. A few thousand true fans on a list you own outperform
100K passive followers.

**Diversify revenue** (streaming pays indies <10%): merch (country fans buy
hats/tees/koozies heavily), direct-to-fan (Bandcamp/Patreon), sync licensing
(country/Americana syncs well for trucks/outdoors/lifestyle brands), and live —
the payoff the whole funnel feeds.

*Sources and the full research brief were compiled for this build; the named
examples (Kaitlin Butts, Dasha, Zach Bryan, Zach Top), platform roles, cadence,
and release-window numbers are corroborated across multiple industry sources.*

---

## Phase 2 — Auto-posting (the roadmap)

Phase 1 does everything except the final "hit publish." Phase 2 adds a small
backend (recommended: **Railway**, which VJS already uses) that reads the
approved+scheduled items and publishes via each platform's API.

| Platform | API | What's needed from you |
|---|---|---|
| **TikTok** | TikTok Content Posting API | A TikTok Business account + TikTok for Developers app + Content Posting API approval. Often lands the post in your drafts for a final in-app tap (which is fine — that's where you'd add the trending sound anyway). |
| **Instagram** | Instagram Graph API (Meta) | An Instagram **Business** account linked to a **Facebook Page**, a Meta app, and app review for content publishing. Reels + carousels supported. |
| **Facebook** | Facebook Pages API (Meta) | Same Facebook Page + Meta app. Simplest of the four. |
| **YouTube** | YouTube Data API | A Google Cloud project + OAuth. Uploads Shorts and long-form. Good for evergreen + Spotify-discovery lift. |

**Reality check:** the code to post is straightforward. The gating item is
**account setup + app review** (days to a couple of weeks per platform). Phase 1
ships value immediately while those approvals run in parallel.

**Suggested build order:** Facebook + Instagram together (one Meta app) → TikTok
→ YouTube. And regardless of order: a simpler interim step is exporting approved
items to a scheduler (Publer/Later/Metricool) — the same approach VJS uses.

### Nice-to-haves once posting works
- **Owned-audience capture:** a pre-save/email landing page wired to your list.
- **Analytics back onto the dashboard** to learn what works and steer the
  strategy file.
- **A comment/DM triage agent** that drafts fan replies for approval — country
  breakouts (Kaitlin Butts) came partly from the artist replying in comments.

---

## Guardrails baked in (so it's safe to run)

- The agent never invents streams, charts, dates, awards, lyrics, or shows —
  every fact traces to a data file, and shows need `confirmed:true`.
- Faith/family content stays sincere, never preachy or political.
- No hype guarantees, no trashing other artists.
- **A human approves every post before it can go live.**

Full rules live in `content/music/brand-voice.md`.
