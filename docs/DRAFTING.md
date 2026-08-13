# Draft from Inbox — self-serve writing (no chat needed)

This is the piece that lets **Kalene run the whole Content Studio on her own**.
She drops an idea or an industry article in the CMS **Inbox**, clicks one
button, and finished **drafts** appear on the Content Studio board for her to
review and Approve — written in the VJS brand voice, with the branded graphics
already made. No AI chat, no Ben in the loop.

---

## How it works (the short version)

1. **Kalene adds an idea** in the CMS → *Ideas & Article Inbox* → status **New**.
   She can paste an article, describe a post, and attach photos.
2. She goes to **GitHub → Actions → "Draft from Inbox" → Run workflow**.
   (It also runs by itself every weekday morning, so anything left in the Inbox
   gets drafted automatically.)
3. The robot reads the Inbox, writes the drafts using `content/brand-voice.md`
   and `content/content-strategy.yml`, makes the branded cover graphic (and reel
   video), and marks each handled Inbox item **"Turned into posts."**
4. New **Draft** cards show up on the Content Studio board. Kalene reviews,
   edits if needed, and sets status to **Approved** — same as she does today.

Nothing is ever auto-approved or auto-posted. The robot only writes drafts.

---

## One-time setup (Ben — ~3 minutes)

The writer uses the Claude API, which needs a key. This is the **only** paid
piece, and it's tiny — a batch of drafts costs a few cents.

1. Go to **console.anthropic.com** → **API Keys** → **Create Key**. Copy it
   (starts with `sk-ant-…`). You only see it once.
2. In GitHub: **Settings → Secrets and variables → Actions → New repository
   secret**.
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** the key you copied
   - **Add secret**
3. Done. The "Draft from Inbox" button now works.

### Optional: change the model
By default it uses **`claude-sonnet-5`** — cheaper, and plenty strong for this.
To use the top model instead, add an Actions **variable** (not secret) named
`DRAFT_MODEL` with value `claude-opus-5`. Leave it unset to keep the default.

---

## What it will and won't do

- ✅ Writes to the channels the Inbox item asks for (e.g. "Instagram + TikTok").
  If none is named, it picks the best 1–2.
- ✅ Pulls aircraft facts **only** from the real listing data — never invents a
  spec, price, or maintenance figure.
- ✅ Uses only the photos attached to the Inbox item (or, for a listing, the
  listing's own photos).
- ✅ Treats "concept" ideas as concept posts — no price, no tail number, no
  "now available."
- ❌ Never marks anything Approved or Scheduled. That stays a human decision.

---

## Cost

- **GitHub Actions:** free (well within the free minutes).
- **Claude API:** pay-as-you-go, a few cents per batch of drafts on
  `claude-sonnet-5`. No subscription. You can set a spend cap in the Anthropic
  console (**Billing → Limits**) if you want a hard ceiling.
- **Netlify:** unchanged — drafts don't publish the site. The site still only
  deploys on the twice-a-day batch (see `docs/PUBLISHING.md`).

---

## Troubleshooting

- **"ANTHROPIC_API_KEY secret is not set"** in the Action log → do the one-time
  setup above.
- **Ran but no new drafts** → the Inbox had nothing marked **New**. Set an item
  to New and run again.
- **A draft got a fact wrong** → that's why it's a *draft*. Edit it on the board
  before Approving; if a listing's data is wrong, fix the listing.
