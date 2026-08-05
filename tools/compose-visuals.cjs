// VJS Content Studio — visual composer.
// Turns a content item (data/content/<id>.json) into a finished, logo-branded
// social graphic at media/generated/<id>.jpg, and records the path back on the
// item as its "visual". Runs locally / via the content-studio agent (it needs
// a headless browser, so it is NOT part of the Netlify deploy build).
//
// Usage:
//   node tools/compose-visuals.cjs            # (re)build visuals for every item
//   node tools/compose-visuals.cjs <id> ...   # build specific item(s)
//
// Two templates, chosen automatically:
//   • "photo" — a real aircraft photo with headline + spec + logo overlay
//   • "quote" — a text-forward branded card (for market/education/founder posts)
// The logo goes on EVERY post.

const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const OUT_DIR = path.join(ROOT, 'media', 'generated');
const LOGO_PATH = path.join(ROOT, 'images', 'site', 'd32fc2ff2a.png');

// ---- brand assets (fonts + logo) as data URIs so rendering is offline ----
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

const PILLAR_LABEL = {
  inventory_spotlight: 'Inventory',
  market_intelligence: 'Market Intelligence',
  buyer_seller_education: 'Buyer Insight',
  founder_team_pov: 'From the Team',
  behind_the_deal: 'Behind the Deal',
};

function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"]/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

// Find the first photo that actually exists on disk for this item.
function resolvePhoto(item) {
  const candidates = [];
  if (item.visual_photo) candidates.push(item.visual_photo);
  (item.media || []).forEach(m => candidates.push(m));
  if (item.aircraft_id) {
    const ap = path.join(ROOT, 'data', 'aircraft', item.aircraft_id + '.json');
    if (fs.existsSync(ap)) (readJSON(ap).photos || []).forEach(m => candidates.push(m));
  }
  for (const c of candidates) {
    if (!c || typeof c !== 'string') continue;
    const local = path.join(ROOT, c.replace(/^\//, ''));
    if (fs.existsSync(local)) {
      const ext = local.toLowerCase().endsWith('.png') ? 'png' : 'jpeg';
      return dataURI(local, 'image/' + ext);
    }
  }
  return '';
}

function aircraftMeta(item) {
  if (!item.aircraft_id) return null;
  const ap = path.join(ROOT, 'data', 'aircraft', item.aircraft_id + '.json');
  if (!fs.existsSync(ap)) return null;
  const a = readJSON(ap);
  return { year: a.year || '', model: a.make_model || '', category: a.category || '', status: a.status || 'For Sale' };
}

const FONT_CSS = `
  @font-face{font-family:'Playfair Display';font-weight:400;src:url(${FONTS.playfair400}) format('truetype')}
  @font-face{font-family:'Playfair Display';font-weight:700;src:url(${FONTS.playfair700}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:400;src:url(${FONTS.archivo400}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:600;src:url(${FONTS.archivo600}) format('truetype')}
  @font-face{font-family:'Archivo';font-weight:700;src:url(${FONTS.archivo700}) format('truetype')}`;

const BASE = `
  *{margin:0;padding:0;box-sizing:border-box}
  :root{--night:#0B1520;--gold:#C6A15B;--gold-bright:#DcBd80;--bone:#E9E5DC;--muted:#9FB0BF}
  .post{width:1080px;height:1350px;position:relative;overflow:hidden;background:var(--night);
        font-family:'Archivo',system-ui,sans-serif;color:var(--bone)}
  .pf{font-family:'Playfair Display',Georgia,serif;font-weight:400}
  .eyebrow{font-size:23px;font-weight:700;letter-spacing:.30em;text-transform:uppercase;color:var(--gold)}
  .logo{height:118px;width:auto;display:block}
  .rule{height:2px;width:104px;background:linear-gradient(90deg,var(--gold),transparent)}`;

function photoTemplate(item, photo, meta) {
  const kicker = item.visual_kicker || (meta && meta.status) || 'For Sale';
  const headline = item.visual_headline || item.hook || item.title || '';
  const sub = item.visual_subline || (meta ? [meta.year, meta.model].filter(Boolean).join(' ') +
    (meta.category ? '  ·  ' + meta.category : '') : '');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${BASE}
    .ph{position:absolute;inset:0;background:#050b12}
    .ph img{width:100%;height:100%;object-fit:cover;object-position:center 44%}
    .grad{position:absolute;inset:0;background:
      linear-gradient(180deg,rgba(7,15,23,.55) 0%,rgba(7,15,23,.05) 22%,rgba(7,15,23,.10) 44%,rgba(7,15,23,.72) 74%,rgba(7,15,23,.98) 100%)}
    .badge{position:absolute;top:54px;left:56px;z-index:3;font-size:21px;font-weight:700;letter-spacing:.14em;
           text-transform:uppercase;color:var(--night);background:var(--gold);padding:11px 20px;border-radius:3px}
    .content{position:absolute;left:60px;right:60px;bottom:66px;z-index:3}
    .content .logo{margin-bottom:26px;filter:drop-shadow(0 3px 16px rgba(0,0,0,.6))}
    h1{font-size:80px;line-height:1.03;letter-spacing:-.015em;text-shadow:0 2px 26px rgba(0,0,0,.55)}
    .sub{font-size:29px;color:var(--bone);opacity:.95;margin-top:22px;text-shadow:0 2px 16px rgba(0,0,0,.6)}
    .rule{margin:26px 0 0}
    .strip{display:flex;justify-content:space-between;align-items:center;margin-top:26px;font-size:25px;letter-spacing:.04em}
    .strip .h{color:var(--bone);opacity:.92}.strip .s{color:var(--gold-bright)}
  </style></head><body>
    <div class="post">
      <div class="ph"><img src="${photo}"></div>
      <div class="grad"></div>
      <div class="badge">${esc(kicker)}</div>
      <div class="content">
        ${LOGO ? `<img class="logo" src="${LOGO}">` : ''}
        <h1 class="pf">${esc(headline)}</h1>
        ${sub ? `<div class="sub">${esc(sub)}</div>` : ''}
        <div class="rule"></div>
        <div class="strip"><span class="h">@verticaljetsales</span><span class="s">verticaljetsales.com</span></div>
      </div>
    </div>
  </body></html>`;
}

function quoteTemplate(item) {
  const eyebrow = item.visual_kicker || PILLAR_LABEL[item.pillar] || 'Vertical Jet Sales';
  const headline = item.visual_headline || item.hook || item.title || '';
  const sub = item.visual_subline || '';
  return `<!doctype html><html><head><meta charset="utf-8"><style>${FONT_CSS}${BASE}
    .card{position:absolute;inset:0;padding:96px 84px;display:flex;flex-direction:column;justify-content:space-between}
    .glow{position:absolute;width:1000px;height:1000px;right:-300px;top:-280px;border-radius:50%;
      background:radial-gradient(circle,rgba(198,161,91,.20) 0%,rgba(198,161,91,.05) 42%,rgba(198,161,91,0) 70%)}
    .top{position:relative;z-index:2}
    h1{font-size:86px;line-height:1.05;letter-spacing:-.015em;margin-top:32px;max-width:15ch}
    .sub{position:relative;z-index:2;font-size:33px;line-height:1.5;color:var(--bone);opacity:.9;max-width:24ch;margin-top:36px}
    .foot{position:relative;z-index:2;display:flex;justify-content:space-between;align-items:flex-end;
          border-top:1px solid rgba(233,229,220,.16);padding-top:36px}
    .foot .site{font-size:27px;color:var(--gold-bright);letter-spacing:.05em;padding-bottom:10px}
  </style></head><body>
    <div class="post">
      <div class="card">
        <div class="glow"></div>
        <div class="top">
          <div class="eyebrow">${esc(eyebrow)}</div>
          <h1 class="pf">${esc(headline)}</h1>
        </div>
        ${sub ? `<div class="sub">${esc(sub)}</div>` : '<div></div>'}
        <div class="foot">
          ${LOGO ? `<img class="logo" src="${LOGO}">` : '<span class="eyebrow">Vertical Jet Sales</span>'}
          <span class="site">verticaljetsales.com</span>
        </div>
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
    const meta = aircraftMeta(item);
    const photo = resolvePhoto(item);
    const useQuote = item.format === 'text_post' || !photo;
    const html = useQuote ? quoteTemplate(item) : photoTemplate(item, photo, meta);

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(150);
    const outRel = `/media/generated/${item.id}.jpg`;
    const outAbs = path.join(ROOT, outRel.replace(/^\//, ''));
    await page.locator('.post').screenshot({ path: outAbs, type: 'jpeg', quality: 90 });

    item.visual = outRel;
    fs.writeFileSync(p, JSON.stringify(item, null, 2) + '\n');
    console.log(`${useQuote ? 'quote' : 'photo'}  ${item.id}  ->  ${outRel}`);
  }

  await browser.close();
  console.log(`\nDone. Rebuild the index next:  node build-content-index.js`);
}

main().catch(e => { console.error(e); process.exit(1); });
