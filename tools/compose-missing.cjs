// Composes branded visuals (and reel videos) for content items that don't have
// them yet — so a post created by hand in the CMS gets its finished, logo'd
// graphic automatically. Runs in GitHub Actions on every content change.
//
//   node tools/compose-missing.cjs           # build only what's missing
//   FORCE_IDS="id1 id2" node .../compose-missing.cjs   # rebuild these ids

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'content');

const forced = (process.env.FORCE_IDS || '').trim().split(/\s+/).filter(Boolean);
const items = fs.readdirSync(DIR).filter(f => f.endsWith('.json')).map(f => ({
  id: f.replace(/\.json$/, ''),
  d: JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')),
}));
const has = rel => rel && fs.existsSync(path.join(ROOT, String(rel).replace(/^\//, '')));
const isVideo = d => ['reel', 'short_video'].includes(d.format);

let needVisual, needVideo;
if (forced.length) {
  const set = new Set(forced);
  needVisual = items.filter(x => set.has(x.id)).map(x => x.id);
  needVideo = items.filter(x => set.has(x.id) && isVideo(x.d)).map(x => x.id);
} else {
  // A post needs a visual if it's not archived and has no generated graphic yet.
  needVisual = items.filter(x => x.d.status !== 'Archived' && !has(x.d.visual)).map(x => x.id);
  // Reels/TikToks also need the motion video.
  needVideo = items.filter(x => isVideo(x.d) && !has(x.d.video)).map(x => x.id);
}

console.log('visuals to build:', needVisual.length, needVisual.join(' '));
console.log('videos  to build:', needVideo.length, needVideo.join(' '));

const run = (script, ids) =>
  execFileSync('node', [path.join(__dirname, script), ...ids], { stdio: 'inherit' });

if (needVisual.length) run('compose-visuals.cjs', needVisual);
if (needVideo.length) run('compose-video.cjs', needVideo);
if (!needVisual.length && !needVideo.length) {
  console.log('Nothing to compose — every post already has its branded media.');
}
