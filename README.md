# Vertical Jet Sales — Website

Plain-English guide. No developer required.

---

## What this is

A complete website plus a simple editor so Kalene can add and remove aircraft
listings herself — no code, no WordPress.

**How it works in one sentence:** the website reads all its listings from one
file (`data/aircraft.json`), and the editor at `/admin` is just a friendly form
that writes to that file.

There is **no build step**. Netlify just serves these files. That means almost
nothing can break.

---

## What's in here

| Folder / file | What it is |
|---|---|
| `index.html` | Homepage |
| `inventory.html` | Aircraft for sale (builds itself from the data file) |
| `aircraft.html` | The aircraft detail page template — one page serves every listing |
| `brokerage.html` / `acquisition.html` / `market-intelligence.html` | The other pages |
| `data/aircraft.json` | **All listing content lives here.** The editor writes to this. |
| `admin/` | Kalene's editor (Sveltia CMS) — now also holds the **Content Studio** |
| `content.html` | **Content Studio dashboard** — the social-content pipeline (see below) |
| `content/` | Brand voice + content strategy the AI agents read |
| `data/content/` | The social posts/reels/scripts the agents draft |
| `docs/CONTENT-PLATFORM.md` | Full guide to the content platform + auto-posting roadmap |
| `images/` | Photos |
| `documents/` | Spec sheets, status reports, due lists |
| `uploads/` | Where new photos/PDFs land when Kalene uploads them |
| `netlify.toml` | Netlify settings |

---

## The Content Platform (social media agents)

There's now a content engine that plans, writes, and scripts social posts for
Instagram, LinkedIn, Facebook, and TikTok — grounded in your real inventory and
brand voice. **AI agents create the drafts; a human approves everything before
it posts.**

- **Make content:** ask the assistant things like *"plan this week's posts"* or
  *"make an Instagram reel for the Global Express."*
- **Review & approve:** open `/content.html` (the pipeline dashboard) or
  `/admin` → **Content Studio**. Nothing goes live until you set it to
  **Approved**.
- **Steer it:** edit `content/brand-voice.md` (tone) or
  `content/content-strategy.yml` (channels, cadence, mix).

**New to this? Start with the plain-English guide: `docs/HOW-TO-USE.md`** — it
explains everything (including what a "branch" is) with no tech background
needed.

Auto-posting (the backend that actually publishes on a schedule) is Phase 2 and
needs your social business accounts — the full plan is in
**`docs/CONTENT-PLATFORM.md`**.

---

## Setup — one time only

You need two free accounts: **GitHub** (stores the files) and **Netlify** (serves the website).

### Step 1 — Put the files on GitHub
1. Create a free account at github.com (if you don't have one).
2. Click **New repository**. Name it `vjs-site`. Keep it **Private**. Create.
3. On the next screen choose **uploading an existing file**, and drag in
   everything from this folder. Commit.

### Step 2 — Connect Netlify
1. Log in to Netlify → **Add new site** → **Import an existing project**.
2. Choose GitHub, pick `vjs-site`.
3. Leave the build command **empty** and publish directory as `.` — then Deploy.
4. In about 30 seconds you'll get a live link like `random-name.netlify.app`.
   **Click it. That's the website, live.**

### Step 3 — Point your domain (do this last)
1. In Netlify: **Domain settings** → **Add custom domain** → `verticaljetsales.com`.
2. Netlify shows you what to change at GoDaddy. Log in to GoDaddy and paste
   those values in.
3. Your **email is not affected** — email runs through Google and is separate.
4. Once the new site is live on your domain, cancel the old hosting.

### Step 4 — Turn on the editor (the one fiddly bit)
The editor needs a way to log Kalene in. Two honest options:

**Option A — simplest:** Kalene gets a free GitHub account, you add her as a
collaborator on the `vjs-site` repo (repo → Settings → Collaborators → Add).
Then she signs in at `verticaljetsales.com/admin` with GitHub. Nothing else to set up.

**Option B — no GitHub account for Kalene:** requires a small one-time
authentication service. More setup, nicer for her. Ask Claude to walk through it
if Option A feels clunky.

Before this works, open `admin/config.yml` and change this line:

```yml
repo: YOUR-GITHUB-USERNAME/vjs-site
```

to your actual GitHub username.

---

## How Kalene adds a listing

1. Go to `verticaljetsales.com/admin` and log in.
2. Click **Aircraft Inventory → Aircraft Listings**.
3. Click **Add Aircraft** and fill in the form:
   - Status, Year, Make & Model, Serial, Category, Total Time, Cycles, Price
   - **Page ID** — lowercase, no spaces (e.g. `n61gb-beechjet-400a`). This becomes the web address.
   - **Photos** — add as many as you want. The first one is the main image.
   - **Spec Sheet / Status Report / Due List** — upload the PDFs.
   - Avionics and Features — one line per item.
4. Click **Save / Publish**.
5. Wait ~30 seconds. It's live on the website.

**To mark something sold:** change Status to `Sold`. It disappears from
"Aircraft for Sale" and moves to "Recently Transacted" automatically.

**To remove a listing:** delete it from the list and save.

---

## Good to know

- **Everything is versioned.** Every change is saved in GitHub history, so
  nothing is ever truly lost. If a listing gets messed up, it can be rolled back.
- **Photos:** resize to about 2000px wide before uploading. Huge camera files
  will make pages slow.
- **The site never "goes down" for edits.** Kalene's changes republish the site
  automatically in under a minute.
- **Ben's Drive workflow still works:** keep photos and spec sheets organized in
  Google Drive. Kalene uploads from there into the form. For a complicated
  listing, point Claude at the Drive folder and ask it to prepare the entry.

---

## If something looks wrong

- **A listing didn't appear:** wait a minute and hard-refresh (Cmd+Shift+R).
- **Inventory page says "loading":** `data/aircraft.json` probably has a typo.
  GitHub history can restore the previous version.
- **Editor won't log in:** check the `repo:` line in `admin/config.yml` matches
  your GitHub username, and that Kalene is a collaborator on the repo.
