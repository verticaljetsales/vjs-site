// Regenerates data/index.json from every file in data/aircraft/.
// Runs automatically on each Netlify deploy, so the inventory list is always
// in sync with whatever aircraft exist — no manual step for Kalene.
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'data', 'aircraft');
const out = path.join(__dirname, 'data', 'index.json');

let files = [];
try {
  files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
} catch (e) {
  console.log('No aircraft folder yet; writing empty index.');
}

const aircraft = [];
for (const f of files) {
  try {
    const a = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    aircraft.push({
      id: a.id,
      status: a.status || 'For Sale',
      year: a.year || '',
      make_model: a.make_model || '',
      registration: a.registration || '',
      serial: a.serial || '',
      category: a.category || '',
      total_time: a.total_time || '',
      cycles: a.cycles || '',
      price: a.price || '',
      highlight: a.highlight || '',
      photos: a.photos || [],
      order: (typeof a.order === 'number') ? a.order : 999,
    });
  } catch (e) {
    console.error('Skipping bad file', f, e.message);
  }
}

aircraft.sort((x, y) => (x.order || 999) - (y.order || 999));
fs.writeFileSync(out, JSON.stringify({ aircraft }, null, 2));
console.log(`Built index.json with ${aircraft.length} aircraft.`);
