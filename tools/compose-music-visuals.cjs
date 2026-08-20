// Ben McPeak Music Content Studio — visual composer.
// Turns a content item (data/music/content/<id>.json) into a finished, branded
// social graphic at media/music/generated/<id>.jpg, and records the path back on
// the item as its "visual". Runs locally / via the music-content-studio agent
// (needs a headless browser, so it is NOT part of the Netlify deploy build).
//
// Usage:
//   node tools/compose-music-visuals.cjs            # (re)build visuals for every item
//   node tools/compose-music-visuals.cjs <id> ...   # build specific item(s)
//
// Templates, chosen automatically:
//   • "full-bleed" (default photo) — a photo fills the frame, branding overlaid
//   • "framed"     — the whole image in a top panel, branded band beneath
//   • "lyric"      — a warm text card for lyric teases / announcements (no photo)
// The BEN McPEAK wordmark (or a real logo, if present) goes on EVERY post.

const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'music', 'content');
const SONGS_DIR = path.join(ROOT, 'data', 'music', 'songs');
const SHOWS_DIR = path.join(ROOT, 'data', 'music', 'shows');
const OUT_DIR = path.join(ROOT, 'media', 'music', 'generated');
// Drop a real logo here and it's used on every post; otherwise a typographic
// wordmark is rendered so the studio works with zero setup.
const LOGO_PATH = path.join(ROOT, 'media', 'music', 'logo.png');

function dataURI(file, mime) {
  return `data:${mime};base64,` + fs.readFileSync(file).toString('base64');
}
const FONTS = {
  playfair400: dataURI(path.join(__dirname, 'fonts', 'PlayfairDisplay-400.ttf'), 'font/ttf'),
  playfair700: dataURI(path.join(__dirname, 'fonts', 'PlayfairDisplay-700.ttf'), 'font/ttf'),
  archivo400: dataURI(path.join(__dirname, 'fonts', 'Archivo-400.ttf'), 'font/ttf'),
  archivo600: dataURI(path.join(__dirname, 'fonts', 'Archivo-600.ttf'), 'font/ttf'),
  archivo700: dataURI(path.join(__dirname, 'fonts', 'Archivo-700.ttf'), 'font/ttf'),
};
const LOGO = fs.existsSync(LOGO_PATH) ? dataURI(LOGO_PATH, 'image/png') : '';

// Resolve any asset path (e.g. a co-brand venue logo) to a data URI if it exists.
function assetURI(rel) {
  if (!rel || typeof rel !== 'string') return '';
  const local = path.join(ROOT, rel.replace(/^\//, ''));
  if (!fs.existsSync(local)) return '';
  const ext = local.toLowerCase().endsWith('.png') ? 'png'
    : local.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
  return dataURI(local, 'image/' + ext);
}

const PILLAR_LABEL = {
  new_music_and_teasers: 'New Music',
  live_and_road: 'Live',
  story_and_songwriter: 'Story',
  faith_family_hometown: 'Faith · Family',
  personality_and_fans: 'Off Stage',
};

function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

function songMeta(item) {
  if (!item.song_id) return null;
  const p = path.join(SONGS_DIR, item.song_id + '.json');
  if (!fs.existsSync(p)) return null;
  const s = readJSON(p);
  const year = (s.release_date || '').slice(0, 4);
  const typeLabel = { single: 'Single', album: 'Album', ep: 'EP', track: 'Song' }[s.type] || '';
  return { title: s.title || '', year, typeLabel, status: s.status || '' };
}
function showMeta(item) {
  if (!item.show_id) return null;
  const p = path.join(SHOWS_DIR, item.show_id + '.json');
  if (!fs.existsSync(p)) return null;
  const s = readJSON(p);
  return { venue: s.venue || '', city: s.city || '', state: s.state || '', date: s.date || '', confirmed: !!s.confirmed };
}

// First photo that actually exists on disk: item media, then song art, then show.
function resolvePhoto(item) {
  const candidates = [];
  if (item.visual_photo) candidates.push(item.visual_photo);
  (item.media || []).forEach(m => candidates.push(m));
  if (item.song_id) {
    const p = path.join(SONGS_DIR, item.song_id + '.json');
    if (fs.existsSync(p)) { const s = readJSON(p); [s.cover_art, s.photo].forEach(m => m && candidates.push(m)); }
  }
  for (const c of candidates) {
    if (!c || typeof c !== 'string') continue;
    const local = path.join(ROOT, c.replace(/^\//, ''));
    if (fs.existsSync(local)) {
      const ext = local.toLowerCase().endsWith('.png') ? 'png'
        : local.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
      return dataURI(local, 'image/' + ext);
    }
  }
  return '';
}

const FONT_CSS = `
  @font-face{font-family:'Playfair Display';font-weight:400;src:url(${FONTS.playfair400}) format('truetype')}
  @font-face{font-family:'Playfair Display';font-weight:700;src:url(${FONTS.playfair700}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:400;src:url(${FONTS.archivo400}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:600;src:url(${FONTS.archivo600}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:700;src:url(${FONTS.archivo700}) format('truetype')}`;

// Film-grain texture (worn poster feel), generated inline so rendering is offline.
const GRAIN = 'data:image/svg+xml;base64,' + Buffer.from(
  "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(#n)'/></svg>"
).toString('base64');

const BASE = `
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--night:#1A1712;--amber:#D69A3C;--amber-bright:#E7B65E;--rust:#B4512E;--cream:#F1E6D2;--muted:#B8A98F}
  .post{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--night);
        font-family:'Archivo',system-ui,sans-serif;color:var(--cream)}
  .pf{font-family:'Playfair Display',Georgia,serif;font-weight:400}
  /* Gig-poster / merch system: bold caps display, stamp tags, ticket rules, grain. */
  .disp{font-family:'Archivo',sans-serif;font-weight:700;text-transform:uppercase;letter-spacing:-.005em;line-height:.98}
  .grain{position:absolute;inset:0;background-image:url(${GRAIN});background-size:300px 300px;opacity:.10;mix-blend-mode:soft-light;pointer-events:none;z-index:1}
  .pborder{position:absolute;inset:28px;border:2px solid rgba(214,154,60,.28);pointer-events:none;z-index:5}
  .stamp{display:inline-block;border:2px solid var(--amber);color:var(--amber);font-weight:700;font-size:20px;
         letter-spacing:.20em;text-transform:uppercase;padding:9px 15px;background:rgba(214,154,60,.07)}
  .tick{border:none;border-top:3px dashed rgba(214,154,60,.55);height:0}
  .eyebrow{font-size:23px;font-weight:700;letter-spacing:.30em;text-transform:uppercase;color:var(--amber)}`;

// The wordmark: a real logo if present, else typographic "BEN McPEAK".
function wordmark(size) {
  if (LOGO) return `<img class="logo" src="${LOGO}" style="height:${size}px;width:auto;display:block">`;
  const s = size;
  return `<div class="wm" style="line-height:.9">
    <div class="pf" style="font-size:${Math.round(s * 0.62)}px;font-weight:700;letter-spacing:.02em;color:var(--cream)">Ben McPeak</div>
    <div style="font-size:${Math.round(s * 0.17)}px;font-weight:700;letter-spacing:.42em;text-transform:uppercase;color:var(--amber);margin-top:${Math.round(s * 0.12)}px">Texas Country</div>
  </div>`;
}

function headlineSize(text, big, mid, small, tiny) {
  const n = (text || '').length;
  if (n <= 42) return big;
  if (n <= 68) return mid;
  if (n <= 104) return small;
  return tiny;
}

function photoFields(item, sMeta, shMeta) {
  let kicker = item.visual_kicker;
  if (!kicker) {
    if (shMeta) kicker = 'Live';
    else if (sMeta) kicker = sMeta.status === 'Upcoming' ? 'Coming Soon' : (sMeta.typeLabel || 'New Music');
    else kicker = PILLAR_LABEL[item.pillar] || 'Ben McPeak';
  }
  let sub = item.visual_subline;
  if (sub == null || sub === '') {
    if (shMeta) sub = [shMeta.venue, [shMeta.city, shMeta.state].filter(Boolean).join(', ')].filter(Boolean).join('  ·  ');
    else if (sMeta) sub = [sMeta.title, [sMeta.typeLabel, sMeta.year].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ');
    else sub = '';
  }
  return { kicker, headline: item.visual_headline || item.hook || item.title || '', sub };
}

// FULL-BLEED (default for photos): photo fills the frame, poster branding overlaid.
function fullBleedTemplate(item, photo, sMeta, shMeta) {
  const { kicker, headline, sub } = photoFields(item, sMeta, shMeta);
  const hs = headlineSize(headline, 74, 62, 50, 42);
  const cobrand = assetURI(item.cobrand_logo);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${BASE}
    .ph{position:absolute;inset:0;background:#0e0b08}
    .ph img{width:100%;height:100%;object-fit:cover;object-position:center 40%}
    .cobrand{position:absolute;top:48px;right:54px;z-index:7;height:${item.cobrand_size || 92}px;width:auto;filter:drop-shadow(0 2px 12px rgba(0,0,0,.7))}
    .grad{position:absolute;inset:0;z-index:2;background:
      linear-gradient(180deg,rgba(26,23,18,.55) 0%,rgba(26,23,18,.05) 22%,rgba(26,23,18,.14) 44%,rgba(26,23,18,.78) 72%,rgba(26,23,18,.99) 100%)}
    .grain{opacity:.14}
    .badge{position:absolute;top:52px;left:52px;z-index:6;border:2px solid var(--amber);color:var(--cream);
           background:rgba(18,15,11,.55);font-weight:700;font-size:21px;letter-spacing:.18em;text-transform:uppercase;padding:11px 18px}
    .content{position:absolute;left:56px;right:56px;bottom:56px;z-index:6}
    .content .logo{filter:drop-shadow(0 3px 16px rgba(0,0,0,.7))}
    .wmwrap{margin-bottom:22px}
    h1{font-size:${hs}px;color:var(--cream);text-shadow:0 3px 22px rgba(0,0,0,.6);max-width:15ch}
    .sub{font-size:24px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--amber-bright);margin-top:18px;text-shadow:0 2px 12px rgba(0,0,0,.7)}
    .tick{margin:24px 0 0}
    .strip{display:flex;justify-content:space-between;align-items:center;margin-top:22px;font-size:24px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
    .strip .h{color:var(--cream);opacity:.9}.strip .s{color:var(--amber-bright)}
  </style></head><body>
    <div class="post">
      <div class="ph"><img src="${photo}"></div>
      <div class="grad"></div>
      <div class="grain"></div>
      <div class="pborder" style="border-color:rgba(241,230,210,.22)"></div>
      <div class="badge">${esc(kicker)}</div>
      ${cobrand ? `<img class="cobrand" src="${cobrand}">` : ''}
      <div class="content">
        <div class="wmwrap">${wordmark(item.logo_size || 96)}</div>
        <h1 class="disp">${esc(headline)}</h1>
        ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
        <hr class="tick">
        <div class="strip"><span class="h">@benmcpeakmusic</span><span class="s">benmcpeakmusic.com</span></div>
      </div>
    </div>
  </body></html>`;
}

// FRAMED: whole image in a top panel, poster band beneath. Good for cover art.
function framedTemplate(item, photo, sMeta, shMeta) {
  const { kicker, headline, sub } = photoFields(item, sMeta, shMeta);
  const hs = headlineSize(headline, 60, 50, 42, 36);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${BASE}
    .pane{position:absolute;top:0;left:0;right:0;height:742px;background:#0e0b08;display:flex;align-items:center;justify-content:center}
    .pane img{width:100%;height:100%;object-fit:contain}
    .badge{position:absolute;top:40px;left:40px;z-index:6;border:2px solid var(--amber);color:var(--cream);
           background:rgba(18,15,11,.55);font-weight:700;font-size:19px;letter-spacing:.18em;text-transform:uppercase;padding:10px 16px}
    .tickrow{position:absolute;top:742px;left:0;right:0;z-index:6;margin:0}
    .band{position:absolute;top:742px;left:0;right:0;bottom:0;padding:54px 58px 50px;display:flex;flex-direction:column;z-index:2}
    .wmwrap{align-self:flex-start;margin-bottom:20px}
    h1{font-size:${hs}px;color:var(--cream);max-width:18ch}
    .sub{font-size:23px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--amber-bright);margin-top:14px}
    .strip{margin-top:auto;display:flex;justify-content:space-between;align-items:center;font-size:23px;letter-spacing:.06em;text-transform:uppercase;font-weight:600}
    .strip .s{color:var(--amber-bright)}
  </style></head><body>
    <div class="post">
      <div class="pane"><img src="${photo}"></div>
      <div class="grain"></div>
      <div class="badge">${esc(kicker)}</div>
      <hr class="tick tickrow">
      <div class="band">
        <div class="wmwrap">${wordmark(92)}</div>
        <h1 class="disp">${esc(headline)}</h1>
        ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
        <div class="strip"><span>@benmcpeakmusic</span><span class="s">benmcpeakmusic.com</span></div>
      </div>
    </div>
  </body></html>`;
}

// POSTER: a gig-poster/merch text card for announcements & teases (no photo).
function lyricTemplate(item, sMeta, shMeta) {
  let eyebrow = item.visual_kicker;
  if (!eyebrow) {
    if (shMeta) eyebrow = 'Live';
    else if (sMeta) eyebrow = sMeta.status === 'Upcoming' ? 'Coming Soon' : (sMeta.typeLabel || 'New Music');
    else eyebrow = PILLAR_LABEL[item.pillar] || 'Ben McPeak';
  }
  const headline = item.visual_headline || item.hook || item.title || '';
  const metaLine = sMeta ? [sMeta.title, [sMeta.typeLabel, sMeta.year].filter(Boolean).join(' ')].filter(Boolean).join('  ·  ')
    : (shMeta ? [shMeta.venue, shMeta.city].filter(Boolean).join(', ') : '');
  const sub = item.visual_subline || item.cta || metaLine || '';
  const hs = headlineSize(headline, 96, 78, 62, 50);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${BASE}
    .glowbg{position:absolute;inset:0;z-index:0;background:
      radial-gradient(1200px 760px at 80% -10%, rgba(214,154,60,.20), rgba(214,154,60,0) 60%),
      radial-gradient(900px 640px at 4% 112%, rgba(180,81,46,.18), rgba(180,81,46,0) 62%)}
    .card{position:absolute;inset:0;z-index:2;padding:104px 80px 88px;display:flex;flex-direction:column;justify-content:space-between}
    .top h1{font-size:${hs}px;color:var(--cream);margin-top:40px;max-width:15ch}
    .mid .sub{font-size:26px;font-weight:600;letter-spacing:.10em;text-transform:uppercase;color:var(--amber-bright);margin-top:26px;max-width:22ch;line-height:1.45}
    .foot{display:flex;justify-content:space-between;align-items:flex-end}
    .foot .site{font-size:24px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--amber-bright);padding-bottom:6px}
  </style></head><body>
    <div class="post">
      <div class="glowbg"></div>
      <div class="grain"></div>
      <div class="pborder"></div>
      <div class="card">
        <div class="top"><span class="stamp">${esc(eyebrow)}</span><h1 class="disp">${esc(headline)}</h1></div>
        <div class="mid"><hr class="tick">${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
        <div class="foot">${wordmark(92)}<span class="site">benmcpeakmusic.com</span></div>
      </div>
    </div>
  </body></html>`;
}

async function main() {
  const args = process.argv.slice(2);
  let files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
  if (args.length) files = files.filter(f => args.includes(f.replace(/\.json$/, '')));
  if (!files.length) { console.log('No matching content items.'); return; }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium',
  });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 2 });

  for (const f of files) {
    const p = path.join(CONTENT_DIR, f);
    const item = readJSON(p);
    const sMeta = songMeta(item);
    const shMeta = showMeta(item);
    const photo = resolvePhoto(item);
    // Music default is full-bleed (cinematic). Opt into framed for cover art.
    // No photo -> lyric card.
    let kind;
    let html;
    if (!photo) { kind = 'lyric'; html = lyricTemplate(item, sMeta, shMeta); }
    else if (item.layout === 'framed') { kind = 'framed'; html = framedTemplate(item, photo, sMeta, shMeta); }
    else { kind = 'full-bleed'; html = fullBleedTemplate(item, photo, sMeta, shMeta); }

    // Aspect: default 4:5 (1080x1350); "9:16" (1080x1920) for TikTok/Reels/Shorts.
    const H = item.aspect === '9:16' ? 1920 : 1350;
    if (H !== 1350) { html = html.replace(/height:1350px/g, `height:${H}px`); kind += ':9x16'; }
    await page.setViewportSize({ width: 1080, height: H });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const outRel = `/media/music/generated/${item.id}.jpg`;
    const outAbs = path.join(ROOT, outRel.replace(/^\//, ''));
    await page.locator('.post').screenshot({ path: outAbs, type: 'jpeg', quality: 90 });

    item.visual = outRel;
    fs.writeFileSync(p, JSON.stringify(item, null, 2) + '\n');
    console.log(`${kind.padEnd(11)} ${item.id}  ->  ${outRel}`);
  }

  await browser.close();
  console.log(`\nDone. Rebuild the index next:  node build-music-index.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
