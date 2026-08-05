// VJS Content Studio — Publer bulk-schedule CSV exporter.
// Turns content items into Publer-ready CSV files (one per channel) so you can
// bulk-upload them in Publer → it posts to Instagram/Facebook/LinkedIn/TikTok
// on schedule. Publer pulls the image/video from the public Media URL, so no
// files to attach and no platform API/app-review needed.
//
// Publer CSV columns used (their documented names): Date, Message, Link, Media URLs.
//   Date       -> YYYY/MM/DD HH:MM  (from scheduled_for + default time)
//   Message    -> caption (body + hashtags)
//   Media URLs -> https://verticaljetsales.com/<visual or video>
//
// Usage:
//   node tools/build-publer-csv.cjs                 # only Approved/Scheduled items
//   node tools/build-publer-csv.cjs --scheduled     # any item with a scheduled_for date
//   node tools/build-publer-csv.cjs --all           # every item (testing)
// Output: exports/publer-<channel>.csv

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const OUT_DIR = path.join(ROOT, 'exports');
const SITE = 'https://verticaljetsales.com';
const DEFAULT_TIME = '09:00';                 // posting time when only a date is set
const CHANNELS = ['instagram', 'linkedin', 'facebook', 'tiktok'];

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// RFC-4180 CSV field: quote if it contains comma, quote, or newline; double quotes.
function csv(v) {
  const s = (v == null ? '' : String(v));
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function toPublerDate(scheduled_for) {
  if (!scheduled_for) return '';
  // scheduled_for is YYYY-MM-DD -> Publer prefers YYYY/MM/DD HH:MM
  const d = String(scheduled_for).slice(0, 10).replace(/-/g, '/');
  return `${d} ${DEFAULT_TIME}`;
}

function caption(item) {
  const tags = (item.hashtags || []).join(' ');
  return [item.body || '', tags].filter(Boolean).join('\n\n');
}

// Publer's exact bulk-import template header (12 columns, in order).
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

// Build one Publer row (array of 12 fields, in template order) for an item.
function publerRow(item) {
  const subtype = item.format === 'reel' ? 'reel' : '';          // IG Reels
  const altText = item.visual_headline || item.hook || '';
  return [
    toPublerDate(item.scheduled_for),   // Date
    caption(item),                      // Text
    '',                                 // Link(s)
    mediaUrl(item),                     // Media URL(s)
    '',                                 // Title
    'VJS',                              // Label(s)
    altText,                            // Alt text(s)
    '',                                 // Comment(s)
    '',                                 // Pin board / FB album / Google category
    subtype,                            // Post subtype
    '',                                 // CTA
    '',                                 // Reminder
  ];
}

function mediaUrl(item) {
  const rel = item.video || item.visual || (item.media && item.media[0]) || '';
  return rel ? SITE + rel : '';
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
      return ['Approved', 'Scheduled'].includes(c.status);   // default
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
    const rows = items.filter(c => c.channel === ch).sort((a, b) =>
      (a.scheduled_for || '') < (b.scheduled_for || '') ? -1 : 1);
    if (!rows.length) continue;

    const lines = [headerLine];
    for (const c of rows) {
      lines.push(publerRow(c).map(csv).join(','));
    }
    const out = path.join(OUT_DIR, `publer-${ch}.csv`);
    fs.writeFileSync(out, lines.join('\r\n') + '\r\n');
    total += rows.length;
    summary.push(`  ${ch.padEnd(10)} ${rows.length} post(s)  ->  exports/publer-${ch}.csv`);
  }

  console.log(`Built Publer CSVs (${mode} mode) — ${total} post(s):`);
  console.log(summary.join('\n'));
  console.log(`\nUpload each file in Publer: Bulk Schedule → Upload CSV → pick the matching account.`);
}

main();
