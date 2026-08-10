# How the VJS site publishes (batched deploys)

**Goal:** stop rebuilding the whole website every time someone hits *Save* in the
CMS, so we don't burn Netlify credits. Saves still happen instantly and safely —
we just publish the *live* site in batches (twice a day) or on demand.

You keep using the CMS exactly as before. Nothing about editing changes.

**How it works:** Netlify's own build system is turned **off** ("builds stopped"),
so saving in the CMS costs nothing. Instead, GitHub (free) rebuilds the site and
uploads the finished files to Netlify twice a day — and whenever you click
**Publish Now**.

---

## One-time setup (about 3 minutes)

You've already done most of this. The only piece the current method needs is a
Netlify **access token** so GitHub is allowed to publish.

### Step 1 — Create a Netlify access token
1. Go to **app.netlify.com** → click your avatar (top right) → **User settings**.
2. Go to **Applications → Personal access tokens** → **New access token**.
3. Name it `GitHub publisher`, leave the expiration long, click **Generate**.
4. **Copy the token** (you only see it once).

### Step 2 — Add it to GitHub
1. Go to **github.com/verticaljetsales/vjs-site → Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `NETLIFY_AUTH_TOKEN`
4. Secret: **paste the token from Step 1.**
5. Click **Add secret**.

Done. The site now publishes automatically at ~7 AM and ~3 PM Central.

> The older `NETLIFY_BUILD_HOOK` secret and the build hook you made aren't used by
> this method. They're harmless — you can leave them or delete them, your choice.

---

## Publishing something right now ("Publish Now" button)

When you want a change live immediately instead of waiting for the next batch:

1. Go to **github.com/verticaljetsales/vjs-site → Actions**.
2. Click **"Publish site (batched deploys)"** on the left.
3. Click **Run workflow → Run workflow** (green button).
4. Your site is live within a minute or two.

Use it after you've made a batch of edits (marked jets sold, approved posts) and
want them live.

---

## Changing the schedule
The times live in `.github/workflows/publish.yml` (the two `cron` lines). Ask
Claude to change them, or to add/remove a daily publish.

## Why builds are "stopped" in Netlify
That setting is what makes saving in the CMS free — Netlify never auto-builds.
Leave it stopped. Publishing happens through GitHub (this workflow) instead, which
runs on free minutes and uses no Netlify build credits.
