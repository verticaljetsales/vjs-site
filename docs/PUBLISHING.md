# How the VJS site publishes (batched deploys)

**Goal:** stop rebuilding the whole website every time someone hits *Save* in the
CMS, so we don't burn Netlify credits. Saves still happen instantly and safely —
we just rebuild the *live* site in batches (twice a day) or on demand.

You keep using the CMS exactly as before. Nothing about editing changes.

---

## One-time setup (about 5 minutes)

Do these three steps once. After that it runs itself.

### Step 1 — Create a Netlify "Build hook"
A build hook is just a web link that means "rebuild the site now."

1. Go to **app.netlify.com** and open the **verticaljetsales.com** project.
2. Go to **Project configuration → Build & deploy → Build hooks**.
3. Click **Add build hook**.
4. Name it `Scheduled publish`, leave the branch as **main**, click **Save**.
5. **Copy the link it gives you** (it looks like `https://api.netlify.com/build_hooks/xxxxxxxx`). You'll paste it in Step 3.

### Step 2 — Pause automatic rebuilds
This is the switch that stops "every Save = a rebuild."

1. Still in **Build & deploy → Continuous deployment**, find **Build settings**.
2. Click **Stop builds** (sometimes labeled "Pause builds").
3. Confirm. From now on, saving in the CMS no longer rebuilds the site by itself —
   our schedule (and your Publish Now button) does it instead.

> Don't worry: this only pauses *automatic* rebuilds. The build hook and the
> Publish Now button still work fine.

### Step 3 — Give GitHub the build-hook link
(Exactly like when you added the Publer key.)

1. Go to **github.com/verticaljetsales/vjs-site → Settings → Secrets and variables → Actions**.
2. Click **New repository secret**.
3. Name: `NETLIFY_BUILD_HOOK`
4. Secret: **paste the link from Step 1.**
5. Click **Add secret**.

Done. The site now rebuilds automatically at ~7 AM and ~3 PM Central.

---

## Publishing something right now ("Publish Now" button)

When you want a change live immediately instead of waiting for the next batch:

1. Go to **github.com/verticaljetsales/vjs-site → Actions**.
2. Click **"Publish site (batched deploys)"** on the left.
3. Click **Run workflow → Run workflow** (green button).
4. Your site rebuilds within a minute or two.

That's it. Use it after you've made a batch of edits and want them live.

---

## Changing the schedule
The times live in `.github/workflows/publish.yml` (the two `cron` lines). Ask
Claude to change them to whatever times you like, or to add/remove a daily publish.
