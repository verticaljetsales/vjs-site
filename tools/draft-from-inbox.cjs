// Draft from Inbox — the self-serve writer.
//
// Turns every NEW idea/article in data/inbox into finished DRAFT posts, using
// the exact same brand voice + strategy the chat uses. Kalene drops an idea in
// the CMS Inbox, clicks one button in GitHub Actions, and drafts appear on the
// Content Studio board for her to review and Approve. No chat required.
//
//   ANTHROPIC_API_KEY=sk-... node tools/draft-from-inbox.cjs
//   DRY_RUN=1 ...            # print what it would create, write nothing
//   MODEL=claude-opus-5 ...  # override the model (default: claude-sonnet-5)
//
// What it does NOT do: it never marks anything "Approved" (humans do that), and
// it never invents a spec, price, or maintenance figure — it writes only from
// the aircraft data files and the inbox note. Composing the branded graphics is
// a separate step (compose-missing.cjs), run right after this in the workflow.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const INBOX_DIR = path.join(ROOT, 'data', 'inbox');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const MODEL = process.env.MODEL || 'claude-sonnet-5';
const DRY_RUN = !!process.env.DRY_RUN;

const CH_ABBR = { instagram: 'ig', linkedin: 'li', facebook: 'fb', tiktok: 'tt' };
const CHANNELS = Object.keys(CH_ABBR);
const FORMATS = [
  'reel', 'carousel', 'single_image', 'short_video',
  'text_post', 'document_carousel', 'link_post',
];
const PILLARS = [
  'inventory_spotlight', 'market_intelligence', 'buyer_seller_education',
  'founder_team_pov', 'behind_the_deal',
];

function die(msg) {
  console.error('\n' + msg + '\n');
  process.exit(1);
}

const API_KEY = process.env.ANTHROPIC_API_KEY;

function readJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function readText(p) { return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : ''; }
function today() { return new Date().toISOString().slice(0, 10); }

// ---- Gather inputs ---------------------------------------------------------

const brandVoice = readText(path.join(ROOT, 'content', 'brand-voice.md'));
const strategy = readText(path.join(ROOT, 'content', 'content-strategy.yml'));

// Compact aircraft catalog so the model can attach a post to a real listing and
// pull ONLY facts that actually exist. Full per-aircraft detail is loaded on the
// fly for any listing a draft references.
let catalog = [];
try {
  const idx = readJSON(path.join(ROOT, 'data', 'index.json'));
  const arr = Array.isArray(idx) ? idx : (idx.aircraft || idx.items || []);
  catalog = arr.map(a => ({
    id: a.id, status: a.status, year: a.year, make_model: a.make_model,
    registration: a.registration, category: a.category, total_time: a.total_time,
    cycles: a.cycles, price: a.price, highlight: a.highlight,
    photos: Array.isArray(a.photos) ? a.photos : [],
  }));
} catch (e) { catalog = []; }

const aircraftById = new Map(catalog.map(a => [a.id, a]));

// New inbox items only.
const inboxFiles = fs.existsSync(INBOX_DIR)
  ? fs.readdirSync(INBOX_DIR).filter(f => f.endsWith('.json'))
  : [];
const newItems = [];
for (const f of inboxFiles) {
  const p = path.join(INBOX_DIR, f);
  let d;
  try { d = readJSON(p); } catch (e) { continue; }
  if ((d.status || '').trim() === 'New') newItems.push({ file: f, path: p, data: d });
}

if (!newItems.length) {
  console.log('Inbox is clear — no items marked "New". Nothing to draft.');
  process.exit(0);
}

console.log(`Found ${newItems.length} new inbox item(s): ` +
  newItems.map(i => i.data.title || i.file).join(' | '));

// Only now do we need the key — a clear inbox (the common morning case) never
// touches the API and never errors on a missing secret.
if (!API_KEY) {
  die(
    'ANTHROPIC_API_KEY is not set.\n' +
    'Add it in GitHub → Settings → Secrets and variables → Actions → New\n' +
    'repository secret named ANTHROPIC_API_KEY (see docs/DRAFTING.md).'
  );
}

// ---- Structured-output schema ---------------------------------------------
// Every field required + additionalProperties:false so the model returns a
// board-ready draft with no missing pieces and nothing extra to sanitize.

const postSchema = {
  type: 'object',
  additionalProperties: false,
  required: [
    'channel', 'format', 'pillar', 'slug', 'title', 'aircraft_id', 'hook',
    'body', 'script', 'shot_list', 'hashtags', 'cta', 'media', 'media_notes',
    'visual_headline', 'visual_subline', 'visual_kicker', 'notes',
  ],
  properties: {
    channel: { type: 'string', enum: CHANNELS },
    format: { type: 'string', enum: FORMATS },
    pillar: { type: 'string', enum: PILLARS },
    slug: {
      type: 'string',
      description: 'kebab-case, no dates, no channel prefix, 2-5 words (e.g. "lear31a-inspections")',
    },
    title: { type: 'string' },
    aircraft_id: {
      type: 'string',
      description: 'Exact id from the aircraft catalog if this post is about a real VJS listing; otherwise "".',
    },
    hook: { type: 'string' },
    body: { type: 'string' },
    script: {
      type: 'array',
      description: 'Beat-by-beat for reel/short_video only; [] for static formats.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['beat', 'visual', 'voiceover', 'onscreen'],
        properties: {
          beat: { type: 'string' },
          visual: { type: 'string' },
          voiceover: { type: 'string' },
          onscreen: { type: 'string' },
        },
      },
    },
    shot_list: { type: 'array', items: { type: 'string' } },
    hashtags: { type: 'array', items: { type: 'string' } },
    cta: { type: 'string' },
    media: {
      type: 'array',
      description: 'Only paths from AVAILABLE MEDIA for this item. [] is fine when aircraft_id is set (listing photos are used automatically).',
      items: { type: 'string' },
    },
    media_notes: { type: 'string' },
    visual_headline: { type: 'string', description: '3-6 words for the branded cover graphic.' },
    visual_subline: { type: 'string', description: 'One short supporting line for the graphic.' },
    visual_kicker: { type: 'string', description: '1-3 word tag, e.g. "Accepting Offers".' },
    notes: { type: 'string', description: 'One line: which inbox item this came from and any judgment call.' },
  },
};

const schema = {
  type: 'object',
  additionalProperties: false,
  required: ['posts'],
  properties: {
    posts: { type: 'array', items: postSchema },
  },
};

// ---- Prompt ----------------------------------------------------------------

const SYSTEM = [
  'You are the Vertical Jet Sales (VJS) content writer. You turn a raw idea or',
  'industry article into finished social DRAFTS that sound exactly like the brand',
  'voice below. You are precise, calm, and never hypey.',
  '',
  '=== BRAND VOICE (source of truth) ===',
  brandVoice,
  '',
  '=== CONTENT STRATEGY (channels, cadence, pillars, hashtag counts, CTAs) ===',
  strategy,
  '',
  '=== HARD RULES ===',
  '- Output DRAFTS only. Never imply anything is approved or scheduled.',
  '- Never invent a spec, hour, cycle, price, or maintenance figure. Use only',
  '  facts present in the aircraft catalog entry you reference or stated plainly',
  '  in the inbox note. If the inbox note and the catalog disagree on a fact,',
  '  OMIT that fact rather than guess.',
  '- Never publish a dollar price unless the listing price is an actual number.',
  '  Otherwise write "Price on request" or write around it.',
  '- Never name a client/buyer/seller or why an aircraft is on the market.',
  '- If an item is a concept/education post (not a specific listing), set',
  '  aircraft_id to "" and do NOT imply availability, price, or a tail number.',
  '- Match each channel\'s tone and hashtag count from the strategy. Rotate CTAs',
  '  from the bank; keep them soft.',
  '- For "media", use ONLY exact paths from the AVAILABLE MEDIA list for that',
  '  inbox item. Never invent an image path. If the post is about a listing and',
  '  no media is provided, return media: [] (the listing photos are attached',
  '  automatically downstream).',
  '- If the inbox note names the channels to make, make exactly those. If it',
  '  does not, choose the 1-2 channels that best fit the material.',
].join('\n');

function itemBlock(item, i) {
  const d = item.data;
  const media = Array.isArray(d.media) ? d.media : [];
  return [
    `--- INBOX ITEM ${i + 1} (key: ${item.file.replace(/\.json$/, '')}) ---`,
    `Title: ${d.title || '(untitled)'}`,
    `Kind: ${d.kind || '(unspecified)'}`,
    d.source_url ? `Source URL: ${d.source_url}` : 'Source URL: (none)',
    `Channels requested: ${d.channels || '(you choose)'}`,
    `Submitted by: ${d.submitted_by || '(unknown)'}`,
    `AVAILABLE MEDIA (${media.length}): ${media.length ? media.join(', ') : '(none — use listing photos via aircraft_id)'}`,
    'Notes / brief:',
    (d.notes || '').trim() || '(no notes)',
  ].join('\n');
}

const userPrompt = [
  'Create finished DRAFT posts for the NEW inbox items below.',
  '',
  'AIRCRAFT CATALOG (attach a post to a listing only by matching an id here;',
  'pull facts only from the matched entry):',
  JSON.stringify(catalog, null, 0),
  '',
  'NEW INBOX ITEMS:',
  '',
  newItems.map(itemBlock).join('\n\n'),
  '',
  'Return a JSON object { "posts": [ ... ] }. Produce one post object per',
  'channel per inbox item, following the channel list each item requested (or',
  'your best 1-2 channels if none was named). Keep every factual claim',
  'defensible against the catalog and the note.',
].join('\n');

// ---- Call the API ----------------------------------------------------------

async function generate() {
  const body = {
    model: MODEL,
    max_tokens: 8000,
    thinking: { type: 'disabled' },
    system: SYSTEM,
    messages: [{ role: 'user', content: userPrompt }],
    output_config: { format: { type: 'json_schema', schema } },
  };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    die(`Claude API error ${res.status}:\n${text}`);
  }

  const json = await res.json();
  const textBlock = (json.content || []).find(b => b.type === 'text');
  if (!textBlock) die('No text block in the API response:\n' + JSON.stringify(json, null, 2));
  let parsed;
  try { parsed = JSON.parse(textBlock.text); }
  catch (e) { die('Could not parse model output as JSON:\n' + textBlock.text); }
  return Array.isArray(parsed.posts) ? parsed.posts : [];
}

// ---- Write drafts ----------------------------------------------------------

function sanitizeMedia(post) {
  // Only keep media paths the model was actually offered: this item's inbox
  // media OR the referenced aircraft's photos. Drops anything invented.
  const allowed = new Set();
  for (const it of newItems) {
    for (const m of (Array.isArray(it.data.media) ? it.data.media : [])) allowed.add(m);
  }
  const ac = post.aircraft_id && aircraftById.get(post.aircraft_id);
  if (ac) for (const p of ac.photos) allowed.add(p);
  const media = Array.isArray(post.media) ? post.media : [];
  return media.filter(m => allowed.has(m));
}

function uniquePath(id) {
  let candidate = id, n = 2;
  while (fs.existsSync(path.join(CONTENT_DIR, candidate + '.json'))) {
    candidate = `${id}-${n++}`;
  }
  return candidate;
}

async function main() {
  const posts = await generate();
  if (!posts.length) die('The model returned no posts.');

  const date = today();
  const written = [];

  for (const p of posts) {
    const abbr = CH_ABBR[p.channel] || 'xx';
    const slug = String(p.slug || 'post').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'post';
    const id = uniquePath(`${date}-${abbr}-${slug}`);

    const record = {
      id,
      status: 'Draft',
      channel: p.channel,
      format: p.format,
      pillar: p.pillar,
      title: p.title || '',
      aircraft_id: aircraftById.has(p.aircraft_id) ? p.aircraft_id : '',
      scheduled_for: '',
      hook: p.hook || '',
      body: p.body || '',
      script: Array.isArray(p.script) ? p.script : [],
      shot_list: Array.isArray(p.shot_list) ? p.shot_list : [],
      hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
      cta: p.cta || '',
      media: sanitizeMedia(p),
      media_notes: p.media_notes || '',
      visual_headline: p.visual_headline || '',
      visual_subline: p.visual_subline || '',
      visual_kicker: p.visual_kicker || '',
      created_by: 'vjs-content-studio',
      notes: p.notes || '',
    };

    if (DRY_RUN) {
      console.log(`\n[dry-run] would write data/content/${id}.json`);
      console.log(`  ${record.channel}/${record.format} — ${record.title}`);
    } else {
      fs.writeFileSync(
        path.join(CONTENT_DIR, id + '.json'),
        JSON.stringify(record, null, 2) + '\n'
      );
      console.log(`Wrote data/content/${id}.json (${record.channel}/${record.format})`);
    }
    written.push(record);
  }

  // Mark the inbox items handled so they don't get re-drafted next run.
  const stamp = `Turned into posts (${date}): ` +
    written.map(w => w.id).join(', ') + '.';
  for (const it of newItems) {
    it.data.status = 'Turned into posts';
    const prev = (it.data.notes || '').trim();
    it.data.notes = prev ? `${prev}\n\n${stamp}` : stamp;
    if (DRY_RUN) {
      console.log(`\n[dry-run] would mark inbox ${it.file} -> "Turned into posts"`);
    } else {
      fs.writeFileSync(it.path, JSON.stringify(it.data, null, 2) + '\n');
      console.log(`Marked inbox ${it.file} -> "Turned into posts"`);
    }
  }

  console.log(`\nDone. ${written.length} draft(s) from ${newItems.length} inbox item(s).`);
}

main().catch(e => die('Unexpected error: ' + (e && e.stack || e)));
