# Content Studio — How to Use It (plain English)

A simple guide for Ben and Kalene. No tech background needed.

---

## First, what's a "branch"? (the easy version)

Think of your website like a **Google Doc**.

- The **live website** (what the world sees at verticaljetsales.com) is the
  *finished, shared* version of the doc.
- A **branch** is like clicking **"Make a copy"** and working in the copy. You
  can change anything in the copy without touching the real one. Nobody sees it
  but us.

Everything I built for the Content Studio is sitting in a **copy** (the branch
named `claude/content-platform-agents-bfr4zj`). That's *why* you don't see it on
your real website yet — it's in the copy, not the original.

When you're happy with it, we **"merge"** the copy back into the real one — that
just means "make the copy the new live version." The moment we do that, the
website updates itself in about 30 seconds, and the Content Studio is live.

**So there are exactly two steps to start using it:**
1. I merge the copy into your live site (or you click one button to approve it).
2. From then on, you and Kalene use it at the two web addresses below.

---

## The two places you'll go

Once it's live:

| What | Web address | Who | What it's for |
|---|---|---|---|
| **Content Studio dashboard** | `verticaljetsales.com/content.html` | Ben & Kalene | See every post in one place (a board): what's drafted, approved, scheduled, posted. |
| **The Editor** | `verticaljetsales.com/admin` | Kalene (mainly) | Read each post, edit anything, and hit **Approve**. Same editor Kalene already uses for aircraft. |

---

## How Ben makes content

You don't push buttons to *write* posts — you just **ask**, in plain English,
the same way we've been talking. For example:

- "Make this week's posts for all four channels."
- "Create an Instagram reel and a LinkedIn post for the Global Express."
- "Turn the new Challenger listing into posts."
- "Write three TikToks explaining light-jet buying."

Behind the scenes the studio writes the caption, picks the photos, builds the
**finished branded graphic** (logo and all), and for reels/TikToks builds the
**motion video** — then drops everything into the dashboard as a **Draft**.

**Nothing ever posts on its own.** Every item waits for a human to approve it.

---

## How Kalene reviews & approves (step by step)

1. Go to **verticaljetsales.com/admin** and log in.
2. Click **Content Studio** in the left menu (right under Aircraft Inventory).
3. You'll see a list of posts. Click one to open it.
4. Read it. The picture (and video, if it's a reel) is right there. Change any
   words you want — it's just a form, like editing a listing.
5. When it's good, set **Status → Approved**.
   - Want it to go out on a certain day? Put a date in **Scheduled For**.
   - Not sure yet? Leave it as **Draft**, or set **Needs Edit** and type a note.
6. Click **Save**. Done.

That's the whole job: **read → tweak → Approve.**

The dashboard at **/content.html** shows the big picture — how many posts are
waiting, approved, or scheduled — so nothing falls through the cracks.

---

## What "posting" means right now (important)

Today, "Approved" means **"cleared and ready to post."** For now, a person still
does the final tap — you download the finished image/video and caption and post
it (or hand it to whoever runs the accounts). This is on purpose: it keeps a
human in control while we get comfortable.

**Later (Phase 2),** we can connect the studio directly to Instagram, Facebook,
LinkedIn, and TikTok so approved posts go out automatically on their scheduled
day. That needs your business accounts and some one-time setup — details are in
`docs/CONTENT-PLATFORM.md`.

---

## One-time login setup for Kalene

The Editor (`/admin`) needs Kalene to log in so it knows it's really her. Two
options (same as the aircraft editor):

- **Easiest:** give Kalene a free GitHub account and add her as a collaborator
  on the `vjs-site` repository. Then she logs in at `/admin` with GitHub.
- **No GitHub for Kalene:** a small one-time login service can be set up so she
  just uses an email/password. Ask me to walk through it.

If Kalene already edits the aircraft listings today, she's already set up —
Content Studio shows up in the same editor automatically.

---

## The quick version

1. **Get it live:** merge the copy into the real site (one step; I can do it).
2. **Ben:** ask for content in plain English → drafts appear.
3. **Kalene:** open `/admin` → Content Studio → read → Approve.
4. **See everything:** `verticaljetsales.com/content.html`.
5. **Posting:** for now a person does the final tap; auto-posting is Phase 2.
