// Ben McPeak Music Studio — Publer bulk-schedule CSV exporter.
// Turns Approved posts into Publer-ready CSVs (one per channel) so you can bulk
// upload them in Publer -> it posts to TikTok/Instagram/YouTube/Facebook on
// schedule. Publer pulls the image/video from the public Media URL, so there are
// no files to attach and no platform API/app-review needed. Same as the jets.
//
// Publer bulk-import columns are used (their documented template).
//   Date       <- scheduled_for + default time
//   Text       <- caption (body + hashtags)
//   Media URLs <- https://<site>/<video or visual>   (the reel's video, if present)
//   Post subtype <- reel / short (so IG posts as a Reel, YT as a Short)
//
// Usage:
//   node tools/build-music-publer-csv.cjs             # only Approved/Scheduled items
//   node tools/build-music-publer-csv.cjs --scheduled # any item with a scheduled_for date
//   node tools/build-music-publer-csv.cjs --all       # every item (testing)
// Output: exports/music-publer-<channel>.csv

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'music', 'content');
const OUT_DIR = path.join(ROOT, 'exports');
const SITE = process.env.MUSIC_SITE || 'https://studio.benmcpeakmusic.com';
const DEFAULT_TIME = '10:00';
const CHANNELS = ['tiktok', 'instagram', 'youtube', 'facebook'];

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function csv(v) {
  const s = (v == null ? '' : String(v));
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toPublerDate(scheduled_for) {
  if (!scheduled_for) return '';
  const d = String(scheduled_for).slice(0, 10).replace(/-/g, '/');
  return `${d} ${DEFAULT_TIME}`;
}
function caption(item) {
  const tags = (item.hashtags || []).join(' ');
  return [item.body || '', tags].filter(Boolean).join('\n\n');
}
// The reel's media = the real video if we have one, else the branded graphic.
function mediaUrl(item) {
  const rel = item.video || item.visual || (item.media && item.media[0]) || '';
  return rel ? SITE + rel : '';
}
function subtype(item) {
  if (item.format === 'reel') return 'reel';
  if (item.format === 'short_video') return item.channel === 'youtube' ? 'short' : 'reel';
  return '';
}

const HEADER_FIELDS = [
  'Date - Intl. format or prompt',
  'Text',
  'Link(s) - Separated by comma for FB carousels',
  'Media URL(s) - Separated by comma',
  'Title - For the video, pin, PDF ..',
  'Label(s) - Separated by comma',
  'Alt text(s) - Separated by ||',
  'Comment(s) - Separated by ||',
  'Pin board, FB album, or Google category',
  'Post subtype - I.e. story, reel, PDF ..',
  'CTA - For Facebook links or Google',
  'Reminder - For stories, reels, shorts, and TikToks',
];

function publerRow(item) {
  return [
    toPublerDate(item.scheduled_for),
    caption(item),
    '',
    mediaUrl(item),
    item.title || '',
    'BenMcPeak',
    item.visual_headline || item.hook || '',
    '',
    '',
    subtype(item),
    '',
    '',
  ];
}

function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--all') ? 'all'
    : args.includes('--scheduled') ? 'scheduled'
    : 'ready';

  const items = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'))
    .map(f => readJSON(path.join(CONTENT_DIR, f)))
    .filter(c => {
      if (mode === 'all') return true;
      if (mode === 'scheduled') return !!c.scheduled_for;
      return ['Approved', 'Scheduled'].includes(c.status);
    });

  if (!items.length) {
    console.log(`No items matched (mode: ${mode}). Approve some posts, or run with --scheduled / --all.`);
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const headerLine = HEADER_FIELDS.map(csv).join(',');
  let total = 0;
  const summary = [];

  for (const ch of CHANNELS) {
    const rows = items.filter(c => c.channel === ch)
      .sort((a, b) => (a.scheduled_for || '') < (b.scheduled_for || '') ? -1 : 1);
    if (!rows.length) continue;
    const lines = [headerLine];
    for (const c of rows) lines.push(publerRow(c).map(csv).join(','));
    const out = path.join(OUT_DIR, `music-publer-${ch}.csv`);
    fs.writeFileSync(out, lines.join('\r\n') + '\r\n');
    total += rows.length;
    summary.push(`  ${ch.padEnd(10)} ${rows.length} post(s)  ->  exports/music-publer-${ch}.csv`);
  }

  console.log(`Built Publer CSVs (${mode} mode) — ${total} post(s):`);
  console.log(summary.join('\n'));
  console.log(`\nIn Publer: Bulk Schedule -> Upload CSV -> pick Ben's matching account.`);
  console.log(`(Media must be reachable at ${SITE}/... — i.e. the studio deployed with the video/graphic in it.)`);
}
main();
