// Regenerates data/music/content-index.json (and light song/show indexes) from
// the data/music/ folders. Runs automatically on each Netlify deploy (see
// netlify.toml), so the Music Content Studio dashboard and CMS always reflect
// whatever content exists. Mirrors build-content-index.js for VJS.
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const M = path.join(ROOT, 'data', 'music');

function readDir(dir) {
  try { return fs.readdirSync(dir).filter(f => f.endsWith('.json')); }
  catch (e) { return []; }
}
function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// ---- content index (the review queue) ----
const contentDir = path.join(M, 'content');
const items = [];
for (const f of readDir(contentDir)) {
  try {
    const c = readJSON(path.join(contentDir, f));
    items.push({
      id: c.id || f.replace(/\.json$/, ''),
      status: c.status || 'Draft',
      channel: c.channel || '',
      format: c.format || '',
      pillar: c.pillar || '',
      title: c.title || '',
      song_id: c.song_id || '',
      show_id: c.show_id || '',
      scheduled_for: c.scheduled_for || '',
      hook: c.hook || '',
      body: c.body || '',
      hashtags: c.hashtags || [],
      cta: c.cta || '',
      media: c.media || [],
      visual: c.visual || '',
      video: c.video || '',
      is_video: Array.isArray(c.script) && c.script.length > 0,
    });
  } catch (e) {
    console.error('Skipping bad content file', f, e.message);
  }
}
items.sort((a, b) => {
  const da = a.scheduled_for || a.id;
  const db = b.scheduled_for || b.id;
  return da < db ? -1 : da > db ? 1 : 0;
});
fs.writeFileSync(path.join(M, 'content-index.json'), JSON.stringify({ content: items }, null, 2));

// ---- song index (for the CMS relation picker + dashboard chips) ----
const songsDir = path.join(M, 'songs');
const songs = [];
for (const f of readDir(songsDir)) {
  if (f.startsWith('TEMPLATE')) continue;
  try {
    const s = readJSON(path.join(songsDir, f));
    songs.push({ id: s.id, title: s.title || '', type: s.type || '', release_date: s.release_date || '', status: s.status || '' });
  } catch (e) { console.error('Skipping bad song file', f, e.message); }
}
fs.writeFileSync(path.join(M, 'songs-index.json'), JSON.stringify({ songs }, null, 2));

// ---- show index (confirmed flag surfaced so nothing unconfirmed gets posted) ----
const showsDir = path.join(M, 'shows');
const shows = [];
for (const f of readDir(showsDir)) {
  if (f.startsWith('template')) continue;
  try {
    const s = readJSON(path.join(showsDir, f));
    shows.push({ id: s.id, venue: s.venue || '', city: s.city || '', state: s.state || '', date: s.date || '', confirmed: !!s.confirmed });
  } catch (e) { console.error('Skipping bad show file', f, e.message); }
}
fs.writeFileSync(path.join(M, 'shows-index.json'), JSON.stringify({ shows }, null, 2));

console.log(`Built music indexes: ${items.length} content items, ${songs.length} songs, ${shows.length} shows.`);
