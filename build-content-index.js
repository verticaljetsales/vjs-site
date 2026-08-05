// Regenerates data/content-index.json from every file in data/content/.
// Runs automatically on each Netlify deploy (see netlify.toml), so the
// Content Studio dashboard and CMS always reflect whatever content exists —
// no manual step. Mirrors build-index.js for the aircraft inventory.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data', 'content');
const out = path.join(__dirname, 'data', 'content-index.json');

let files = [];
try {
  files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
} catch (e) {
  console.log('No content folder yet; writing empty content index.');
}

const items = [];
for (const f of files) {
  try {
    const c = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    items.push({
      id: c.id || f.replace(/\.json$/, ''),
      status: c.status || 'Draft',
      channel: c.channel || '',
      format: c.format || '',
      pillar: c.pillar || '',
      title: c.title || '',
      aircraft_id: c.aircraft_id || '',
      scheduled_for: c.scheduled_for || '',
      hook: c.hook || '',
      body: c.body || '',
      hashtags: c.hashtags || [],
      cta: c.cta || '',
      media: c.media || [],
      visual: c.visual || '',
      is_video: Array.isArray(c.script) && c.script.length > 0,
    });
  } catch (e) {
    console.error('Skipping bad content file', f, e.message);
  }
}

// Sort: scheduled/dated items chronologically, then by id.
items.sort((a, b) => {
  const da = a.scheduled_for || a.id;
  const db = b.scheduled_for || b.id;
  return da < db ? -1 : da > db ? 1 : 0;
});

fs.writeFileSync(out, JSON.stringify({ content: items }, null, 2));
console.log(`Built content-index.json with ${items.length} content items.`);
