// VJS Content Studio — push approved posts to Publer via the Publer API.
// Runs in GitHub Actions (this sandbox can't reach Publer). Reads Approved
// content items and schedules them on the matching social account in Publer.
//
// Env (from GitHub secrets):
//   PUBLER_API_KEY        - Publer API key (Business plan). Sent as "Bearer-API <key>".
//   PUBLER_WORKSPACE_ID   - the Publer workspace id (from --discover output).
//
// Usage:
//   node tools/publer-push.cjs --discover   # list workspaces + accounts (to map channels)
//   node tools/publer-push.cjs              # schedule all Approved items, then mark them Scheduled
//   node tools/publer-push.cjs --dry-run    # build payloads and print them; do not call Publer

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const ACCOUNTS_MAP = path.join(ROOT, 'content', 'publer-accounts.json');
const SITE = 'https://verticaljetsales.com';
const API = 'https://app.publer.com/api/v1';
const DEFAULT_TIME = 'T14:00:00Z';      // 09:00 US-Central ≈ 14:00 UTC (adjust if needed)

// Publer runs "media from URL" downloads one at a time per workspace: while one
// download is still in flight, new ones are rejected with a 403 telling us to
// wait. These settings make the script wait out that limit instead of dying.
// Safety: an item whose media produces no usable Publer media ids is skipped
// loudly (never scheduled text-only/broken), and items are marked Scheduled
// only after Publer's schedule job confirms success.
const MEDIA_BUSY_MAX_ATTEMPTS = 10;     // ~5 minutes of waiting per media URL
const MEDIA_BUSY_WAIT_MS = 30000;
const POLL_TRIES = 60;                  // 60 x 3s = up to 3 minutes per async job
const POLL_INTERVAL_MS = 3000;

const KEY = process.env.PUBLER_API_KEY || '';
const WORKSPACE = process.env.PUBLER_WORKSPACE_ID || '';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function headers() {
  const h = { 'Authorization': `Bearer-API ${KEY}`, 'Content-Type': 'application/json' };
  if (WORKSPACE) h['Publer-Workspace-Id'] = WORKSPACE;
  return h;
}
function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function items() {
  return fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'))
    .map(f => ({ file: path.join(CONTENT_DIR, f), data: readJSON(path.join(CONTENT_DIR, f)) }));
}

async function api(method, endpoint, body) {
  const res = await fetch(API + endpoint, {
    method, headers: headers(), body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const err = new Error(`${method} ${endpoint} -> ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;     // numeric HTTP status, for targeted retries
    err.bodyText = text;         // full response body, for error matching
    throw err;
  }
  return json;
}

// True when Publer rejected a media download because another download is still
// running in this workspace ("Please wait until your other download media from
// URL jobs have finished"). Other 403s (e.g. auth problems) still fail fast.
function isMediaBusyError(err) {
  if (!err || err.status !== 403) return false;
  return /other download media|wait until/i.test(String(err.bodyText || err.message || ''));
}

// ---- discover: list workspaces + accounts so we can map channel -> account id ----
async function discover() {
  console.log('=== WORKSPACES (copy the id you want into the PUBLER_WORKSPACE_ID secret) ===');
  try { console.log(JSON.stringify(await api('GET', '/workspaces'), null, 2)); }
  catch (e) { console.log('  (workspaces) ' + e.message); }

  console.log('\n=== ACCOUNTS (id · name · provider) ===');
  try {
    const accts = await api('GET', '/accounts');
    const list = Array.isArray(accts) ? accts : (accts.accounts || accts.data || []);
    if (!list.length) console.log(JSON.stringify(accts, null, 2));
    for (const a of list) console.log(`  ${a.id}  ·  ${a.name || a.username || ''}  ·  ${a.provider || a.type || ''}`);
  } catch (e) {
    console.log('  (accounts) ' + e.message);
    console.log('  If this needs a workspace, add the PUBLER_WORKSPACE_ID secret and re-run discover.');
  }
  console.log('\nNext: I map these ids into content/publer-accounts.json, then you run mode=push.');
}

// ---- build one Publer post from a content item ----
function scheduledAt(item) {
  const day = (item.scheduled_for || '').slice(0, 10);
  if (!day) return null;
  return day + DEFAULT_TIME;                     // ISO 8601
}
function mediaUrl(item) {
  const rel = item.video || item.visual || (item.media && item.media[0]) || '';
  return rel ? SITE + rel : '';
}
// All media URLs to send, in slide order. Carousels send every photo (branded
// cover first, then each photo in the Media block); single posts send one.
function mediaUrls(item) {
  if (item.video) return [SITE + item.video];                 // reels/videos: the clip
  const photos = Array.isArray(item.media) ? item.media : [];
  const isCarousel = item.format === 'carousel' || photos.length > 1;
  const rels = [];
  if (isCarousel) {
    if (item.visual) rels.push(item.visual);                  // branded cover slide first
    for (const m of photos) rels.push(m);                     // then every photo in the block
  } else {
    const one = item.visual || photos[0];
    if (one) rels.push(one);
  }
  // de-dupe, drop blanks, cap at Instagram's 10-slide carousel limit.
  // encodeURI so filenames with spaces (e.g. "N707KP - Image 2.png") upload cleanly.
  return [...new Set(rels.filter(Boolean))].slice(0, 10).map(r => encodeURI(SITE + r));
}
function caption(item) {
  return [item.body || '', (item.hashtags || []).join(' ')].filter(Boolean).join('\n\n');
}
function networkType(item) {
  if (item.video) return 'video';
  if (mediaUrl(item)) return 'photo';
  return 'status';
}
// Poll a Publer async job until it finishes; return the final job object
// (or null if it never reaches a terminal state within the timeout).
async function pollJob(jobId, label) {
  for (let i = 0; i < POLL_TRIES; i++) {
    await sleep(POLL_INTERVAL_MS);
    try {
      const s = await api('GET', `/job_status/${jobId}`);
      const status = String(s.status || s.state || '').toLowerCase();
      console.log(`  ${label || 'job'} ${jobId}: ${status || JSON.stringify(s).slice(0, 120)}`);
      if (['complete', 'completed', 'success', 'failed', 'failure', 'error'].includes(status)) return s;
    } catch (e) { console.log('  poll: ' + e.message); }
  }
  console.log(`  ${label || 'job'} ${jobId}: still not finished after ${POLL_TRIES} polls — giving up on this job`);
  return null;
}

// Pull media ids out of whatever shape Publer returns.
function extractMediaIds(obj) {
  if (!obj) return [];
  const arr = obj.media || (obj.payload && obj.payload.media) || obj.medias
    || (obj.payload && obj.payload.medias) || (Array.isArray(obj) ? obj : null);
  if (Array.isArray(arr)) {
    const ids = arr.map(m => (m && (m.id || m._id))).filter(Boolean);
    if (ids.length) return ids;
  }
  // fallback: deep-scan for mongo-style ids
  const found = [];
  (function walk(o) {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) return o.forEach(walk);
    for (const [k, v] of Object.entries(o)) {
      if (k === 'id' && typeof v === 'string' && /^[a-f0-9]{24}$/i.test(v)) found.push(v);
      else walk(v);
    }
  })(obj);
  return [...new Set(found)];
}

// Upload a public media URL to Publer, return the resulting media id(s).
// If Publer says another download is still running (403), wait and retry
// instead of failing the whole run.
async function uploadMediaIds(url) {
  let resp;
  for (let attempt = 1; attempt <= MEDIA_BUSY_MAX_ATTEMPTS; attempt++) {
    try {
      resp = await api('POST', '/media/from-url', { media: [{ url }] });
      break;
    } catch (e) {
      if (isMediaBusyError(e) && attempt < MEDIA_BUSY_MAX_ATTEMPTS) {
        console.log(`  Publer media queue busy (attempt ${attempt}/${MEDIA_BUSY_MAX_ATTEMPTS}) — waiting ${MEDIA_BUSY_WAIT_MS / 1000}s for the in-flight download to finish`);
        await sleep(MEDIA_BUSY_WAIT_MS);
        continue;
      }
      throw e;
    }
  }
  console.log('  media resp: ' + JSON.stringify(resp).slice(0, 400));
  let obj = resp;
  if (resp && resp.job_id) {
    const done = await pollJob(resp.job_id, 'media');
    if (done) { console.log('  media job: ' + JSON.stringify(done).slice(0, 500)); obj = done; }
  }
  const ids = extractMediaIds(obj);
  console.log('  media ids: ' + JSON.stringify(ids));
  if (!ids.length) console.log(`  WARNING: no media ids for ${url} — this media will be missing unless Publer finishes the download later`);
  return ids;
}

async function buildPost(item, accountId) {
  const urls = mediaUrls(item);
  const mtype = item.video ? 'video' : 'photo';
  const media = [];
  for (const url of urls) {                       // upload EACH image/clip, keep slide order
    const ids = await uploadMediaIds(url);
    for (const id of ids) media.push({ id, type: mtype });
  }
  // Never schedule a broken post: if Publer produced no usable media for an
  // item that was designed with media, skip the item loudly instead of sending
  // it text-only or missing slides.
  if (urls.length && !media.length) {
    throw new Error(`Publer returned no usable media for ${urls.length} media URL(s) — refusing to schedule a broken post`);
  }
  if (urls.length && media.length < urls.length) {
    console.log(`::warning::${item.id}: only ${media.length}/${urls.length} media URL(s) produced usable media — post will be missing slides`);
  }
  const net = {};
  net[item.channel] = { type: media.length ? mtype : 'status', text: caption(item), media };
  return { networks: net, accounts: [{ id: accountId, scheduled_at: scheduledAt(item) }] };
}

async function push({ dryRun }) {
  if (!KEY) throw new Error('PUBLER_API_KEY is not set.');
  const map = fs.existsSync(ACCOUNTS_MAP) ? readJSON(ACCOUNTS_MAP) : {};
  const approved = items().filter(x => x.data.status === 'Approved' && !x.data.publer_job);
  if (!approved.length) { console.log('No Approved posts to push (or all already pushed).'); return; }

  const posts = [];
  const used = [];
  const skipped = [];
  for (const { file, data } of approved) {
    const acct = map[data.channel];
    if (!acct) { console.log(`skip ${data.id}: no account id mapped for "${data.channel}"`); continue; }
    if (!scheduledAt(data)) { console.log(`skip ${data.id}: no scheduled_for date`); continue; }
    console.log(`preparing ${data.id} (${data.channel})`);
    try {
      posts.push(await buildPost(data, acct));
      used.push({ file, data });
    } catch (e) {
      // Leave the item Approved (never mark Scheduled) so it can be fixed and
      // retried; keep going with the remaining items.
      console.log(`::error::skipping ${data.id}: ${e.message}`);
      skipped.push(data.id);
    }
  }
  if (!posts.length) {
    if (skipped.length) throw new Error(`${skipped.length} approved item(s) could not be prepared (see errors above) — nothing scheduled`);
    console.log('Nothing to send after mapping/date checks.'); return;
  }

  const payload = { bulk: { state: 'scheduled', posts } };
  if (dryRun) { console.log(JSON.stringify(payload, null, 2)); return; }

  const job = await api('POST', '/posts/schedule', payload);
  const jobId = job.job_id || job.id || job.jobId;
  console.log(`Submitted ${posts.length} post(s). Job: ${jobId}`);

  const final = jobId ? await pollJob(jobId, 'schedule') : null;
  if (!final) {
    // Never mark items Scheduled without Publer's own confirmation — otherwise
    // a silent failure looks like success and the posts never go out.
    console.log('::error::Publer schedule job never reached a terminal state — NOT marking anything Scheduled. Verify in Publer before re-running to avoid duplicates.');
    throw new Error('schedule job unconfirmed');
  }
  console.log(JSON.stringify(final, null, 2));

  // A job can be "complete" yet still contain per-post failures — check them.
  const failures = final && final.payload && final.payload.failures;
  const failCount = failures ? Object.values(failures).flat().length : 0;
  if (failCount) {
    console.log(`Publer rejected ${failCount} post(s) — NOT marking Scheduled. See failures above.`);
    return;
  }

  for (const { file, data } of used) {
    data.status = 'Scheduled';
    data.publer_job = jobId || true;
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`Success — scheduled ${used.length} post(s) in Publer.`);
  if (skipped.length) {
    console.log(`::error::${skipped.length} item(s) skipped and left as Approved (not scheduled): ${skipped.join(', ')}`);
  }
}

(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--discover')) await discover();
    else await push({ dryRun: args.includes('--dry-run') });
  } catch (e) { console.error('ERROR:', e.message); process.exit(1); }
})();
