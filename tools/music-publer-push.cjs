// Ben McPeak Music Studio — push Approved posts to Publer via the Publer API.
// Runs in GitHub Actions (the studio itself can't reach Publer). Reads Approved
// posts and schedules them on the matching account in Publer, then marks them
// Scheduled. Same design as the jets' publer-push.cjs.
//
// Env (from GitHub secrets):
//   PUBLER_API_KEY        - Publer API key (Business plan). Sent as "Bearer-API <key>".
//   PUBLER_WORKSPACE_ID   - Publer workspace id (from the --discover output).
//   MUSIC_SITE            - public studio base URL (default studio.benmcpeakmusic.com)
//
// Usage:
//   node tools/music-publer-push.cjs --discover   # list workspaces + accounts to map
//   node tools/music-publer-push.cjs              # schedule all Approved items
//   node tools/music-publer-push.cjs --dry-run    # build payloads and print; no calls

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'music', 'content');
const ACCOUNTS_MAP = path.join(ROOT, 'content', 'music', 'publer-accounts.json');
const SITE = process.env.MUSIC_SITE || 'https://studio.benmcpeakmusic.com';
const API = 'https://app.publer.com/api/v1';
const DEFAULT_TIME = 'T15:00:00Z';   // ~10:00 US-Central

const KEY = process.env.PUBLER_API_KEY || '';
const WORKSPACE = process.env.PUBLER_WORKSPACE_ID || '';

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
  if (!res.ok) throw new Error(`${method} ${endpoint} -> ${res.status}: ${text.slice(0, 500)}`);
  return json;
}
async function discover() {
  console.log('=== WORKSPACES (copy the id into the PUBLER_WORKSPACE_ID secret) ===');
  try { console.log(JSON.stringify(await api('GET', '/workspaces'), null, 2)); }
  catch (e) { console.log('  (workspaces) ' + e.message); }
  console.log('\n=== ACCOUNTS (id · name · provider — map these into content/music/publer-accounts.json) ===');
  try {
    const accts = await api('GET', '/accounts');
    const list = Array.isArray(accts) ? accts : (accts.accounts || accts.data || []);
    if (!list.length) console.log(JSON.stringify(accts, null, 2));
    for (const a of list) console.log(`  ${a.id}  ·  ${a.name || a.username || ''}  ·  ${a.provider || a.type || ''}`);
  } catch (e) { console.log('  (accounts) ' + e.message); }
}
function scheduledAt(item) {
  const day = (item.scheduled_for || '').slice(0, 10);
  return day ? day + DEFAULT_TIME : null;
}
function mediaUrl(item) {
  const rel = item.video || item.visual || (item.media && item.media[0]) || '';
  return rel ? SITE + rel : '';
}
function caption(item) {
  return [item.body || '', (item.hashtags || []).join(' ')].filter(Boolean).join('\n\n');
}
async function pollJob(jobId, label) {
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 2500));
    try {
      const s = await api('GET', `/job_status/${jobId}`);
      const status = String(s.status || s.state || '').toLowerCase();
      console.log(`  ${label || 'job'} ${jobId}: ${status || JSON.stringify(s).slice(0, 120)}`);
      if (['complete', 'completed', 'success', 'failed', 'failure', 'error'].includes(status)) return s;
    } catch (e) { console.log('  poll: ' + e.message); }
  }
  return null;
}
function extractMediaIds(obj) {
  if (!obj) return [];
  const arr = obj.media || (obj.payload && obj.payload.media) || obj.medias
    || (obj.payload && obj.payload.medias) || (Array.isArray(obj) ? obj : null);
  if (Array.isArray(arr)) {
    const ids = arr.map(m => (m && (m.id || m._id))).filter(Boolean);
    if (ids.length) return ids;
  }
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
async function uploadMediaIds(url) {
  const resp = await api('POST', '/media/from-url', { media: [{ url }] });
  let obj = resp;
  if (resp && resp.job_id) { const done = await pollJob(resp.job_id, 'media'); if (done) obj = done; }
  return extractMediaIds(obj);
}
async function buildPost(item, accountId) {
  const url = mediaUrl(item);
  const mtype = item.video ? 'video' : 'photo';
  let media = [];
  if (url) media = (await uploadMediaIds(url)).map(id => ({ id, type: mtype }));
  const net = {};
  net[item.channel] = { type: url ? mtype : 'status', text: caption(item), media };
  return { networks: net, accounts: [{ id: accountId, scheduled_at: scheduledAt(item) }] };
}
async function push({ dryRun }) {
  if (!KEY) throw new Error('PUBLER_API_KEY is not set.');
  const map = fs.existsSync(ACCOUNTS_MAP) ? readJSON(ACCOUNTS_MAP) : {};
  const approved = items().filter(x => x.data.status === 'Approved' && !x.data.publer_job);
  if (!approved.length) { console.log('No Approved posts to push (or all already pushed).'); return; }
  const posts = [], used = [];
  for (const { file, data } of approved) {
    const acct = map[data.channel];
    if (!acct) { console.log(`skip ${data.id}: no account id mapped for "${data.channel}"`); continue; }
    if (!scheduledAt(data)) { console.log(`skip ${data.id}: no scheduled_for date`); continue; }
    console.log(`preparing ${data.id} (${data.channel})`);
    posts.push(await buildPost(data, acct)); used.push({ file, data });
  }
  if (!posts.length) { console.log('Nothing to send after mapping/date checks.'); return; }
  const payload = { bulk: { state: 'scheduled', posts } };
  if (dryRun) { console.log(JSON.stringify(payload, null, 2)); return; }
  const job = await api('POST', '/posts/schedule', payload);
  const jobId = job.job_id || job.id || job.jobId;
  console.log(`Submitted ${posts.length} post(s). Job: ${jobId}`);
  const final = jobId ? await pollJob(jobId, 'schedule') : null;
  const failures = final && final.payload && final.payload.failures;
  const failCount = failures ? Object.values(failures).flat().length : 0;
  if (failCount) { console.log(`Publer rejected ${failCount} post(s) — NOT marking Scheduled.`); return; }
  for (const { file, data } of used) {
    data.status = 'Scheduled'; data.publer_job = jobId || true;
    fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  }
  console.log(`Success — scheduled ${used.length} post(s) in Publer.`);
}
(async () => {
  const args = process.argv.slice(2);
  try {
    if (args.includes('--discover')) await discover();
    else await push({ dryRun: args.includes('--dry-run') });
  } catch (e) { console.error('ERROR:', e.message); process.exit(1); }
})();
