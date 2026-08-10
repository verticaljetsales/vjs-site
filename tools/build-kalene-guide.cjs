// Builds a friendly, VJS-branded PDF: "Content Studio — How-To Guide" for Kalene.
// Renders a styled HTML page to PDF via headless Chromium (Playwright).
// Output: docs/Content-Studio-Guide.pdf

const fs = require('fs');
const path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'Content-Studio-Guide.pdf');

function b64(p) { return fs.readFileSync(p).toString('base64'); }
const fontDir = path.join(ROOT, 'tools', 'fonts');
const playfair = b64(path.join(fontDir, 'PlayfairDisplay-700.ttf'));
const archivo400 = b64(path.join(fontDir, 'Archivo-400.ttf'));
const archivo600 = b64(path.join(fontDir, 'Archivo-600.ttf'));
const archivo700 = b64(path.join(fontDir, 'Archivo-700.ttf'));
const logo = b64(path.join(ROOT, 'images', 'site', 'd32fc2ff2a.png'));

// ---- little helpers to keep the HTML readable ----
const step = (n, title, body) => `
  <div class="step">
    <div class="num">${n}</div>
    <div class="stepbody"><h4>${title}</h4>${body ? `<p>${body}</p>` : ''}</div>
  </div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:'Playfair';src:url(data:font/ttf;base64,${playfair}) format('truetype');font-weight:700}
@font-face{font-family:'Archivo';src:url(data:font/ttf;base64,${archivo400}) format('truetype');font-weight:400}
@font-face{font-family:'Archivo';src:url(data:font/ttf;base64,${archivo600}) format('truetype');font-weight:600}
@font-face{font-family:'Archivo';src:url(data:font/ttf;base64,${archivo700}) format('truetype');font-weight:700}

:root{
  --night:#0B1520; --gold:#C6A15B; --goldbright:#DcBd80; --bone:#E9E5DC;
  --paper:#FBFAF7; --ink:#1B2733; --muted:#5C6B79; --line:#E4DFD4;
}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:Letter;margin:0}
body{font-family:'Archivo',sans-serif;color:var(--ink);background:var(--paper);font-size:15px;line-height:1.6}
.page{padding:54px 60px 70px;position:relative;min-height:100vh}
.page + .page{page-break-before:always}

h1,h2,h3,.eyebrow{font-family:'Playfair',serif}
.eyebrow{font-family:'Archivo';font-weight:700;letter-spacing:.18em;text-transform:uppercase;font-size:11px;color:var(--gold)}

/* ---- cover header ---- */
.hero{background:var(--night);color:var(--bone);border-radius:16px;padding:40px 44px;margin-bottom:34px}
.hero img{height:52px;width:auto;display:block;margin-bottom:26px}
.hero .eyebrow{color:var(--goldbright)}
.hero h1{font-size:40px;line-height:1.08;color:#fff;margin:8px 0 12px}
.hero p{color:#C7D0D8;font-size:15px;max-width:80%}
.hero .rule{height:2px;width:64px;background:var(--gold);margin:22px 0 0;border-radius:2px}

/* ---- sections ---- */
.section{margin-top:30px}
.section > .eyebrow{display:block;margin-bottom:6px}
.section h2{font-size:24px;color:var(--night);margin-bottom:6px}
.section .lead{color:var(--muted);margin-bottom:16px;max-width:92%}

/* ---- the two pages cards ---- */
.cards{display:flex;gap:16px;margin-top:8px}
.card{flex:1;border:1px solid var(--line);border-radius:12px;padding:18px 20px;background:#fff}
.card .tag{font-weight:700;color:var(--gold);font-size:12px;letter-spacing:.08em;text-transform:uppercase}
.card h3{font-family:'Archivo';font-weight:700;font-size:16px;margin:6px 0 4px;color:var(--night)}
.card .url{font-family:'Archivo';font-weight:700;color:var(--night);background:var(--bone);padding:3px 8px;border-radius:6px;font-size:13px;display:inline-block;margin:4px 0 8px}
.card p{font-size:13.5px;color:var(--muted)}

/* ---- steps ---- */
.step{display:flex;gap:16px;align-items:flex-start;padding:12px 0;border-bottom:1px dashed var(--line)}
.step:last-child{border-bottom:none}
.num{flex:none;width:34px;height:34px;border-radius:50%;background:var(--night);color:var(--goldbright);
  font-family:'Archivo';font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center}
.stepbody h4{font-family:'Archivo';font-weight:700;font-size:15.5px;color:var(--night)}
.stepbody p{color:var(--muted);font-size:14px;margin-top:2px}
.stepbody b{color:var(--ink)}

/* ---- golden rule callout ---- */
.rulebox{background:linear-gradient(180deg,#FDF8EE,#FBF3E3);border:1.5px solid var(--gold);
  border-radius:14px;padding:22px 26px;margin:26px 0 6px;display:flex;gap:18px;align-items:center}
.rulebox .star{font-size:34px}
.rulebox h3{font-family:'Playfair';font-size:22px;color:var(--night);margin-bottom:3px}
.rulebox p{color:#6a5626;font-size:14.5px}

/* job header pill */
.job{display:flex;align-items:center;gap:12px;margin:26px 0 4px}
.job .chip{background:var(--gold);color:#22190a;font-weight:700;font-size:12px;letter-spacing:.08em;
  text-transform:uppercase;padding:4px 12px;border-radius:20px}
.job h2{font-size:22px;color:var(--night)}
.job small{color:var(--muted);font-weight:400;font-family:'Archivo';font-size:13px;display:block}

/* status table */
.words{width:100%;border-collapse:collapse;margin-top:8px}
.words td{padding:9px 12px;border-bottom:1px solid var(--line);vertical-align:top;font-size:14px}
.words td.w{font-weight:700;color:var(--night);width:150px;white-space:nowrap}
.words tr:last-child td{border-bottom:none}

/* help + footer */
.help{background:var(--night);color:var(--bone);border-radius:14px;padding:24px 28px;margin-top:28px}
.help h3{font-family:'Playfair';color:#fff;font-size:20px;margin-bottom:8px}
.help ul{margin:6px 0 0 18px}
.help li{margin:6px 0;color:#C7D0D8;font-size:14px}
.help b{color:var(--goldbright)}
.foot{position:absolute;left:60px;right:60px;bottom:26px;display:flex;justify-content:space-between;
  color:#9aa6b1;font-size:11px;border-top:1px solid var(--line);padding-top:10px}
.tip{font-size:13.5px;color:var(--muted);margin-top:10px;font-style:italic}
</style></head><body>

<!-- ============ PAGE 1 ============ -->
<div class="page">
  <div class="hero">
    <img src="data:image/png;base64,${logo}" alt="Vertical Jet Sales">
    <div class="eyebrow">Content Studio</div>
    <h1>How to Make &amp; Post<br>Our Social Media</h1>
    <p>A simple, step-by-step guide. If you can send an email, you can do this. Nothing you click can break anything.</p>
    <div class="rule"></div>
  </div>

  <div class="section">
    <span class="eyebrow">Start Here</span>
    <h2>What is the Content Studio?</h2>
    <p class="lead">It is where we make posts for <b>Instagram, Facebook, LinkedIn, and TikTok</b>. A smart helper writes the posts for us — with the words, the picture, and the hashtags all done. Then a person (you or Ben) reads each one and says <b>“yes, post it.”</b> A post never goes online until a person says yes.</p>
  </div>

  <div class="section">
    <span class="eyebrow">The Two Web Pages You Will Use</span>
    <h2>Bookmark these two links</h2>
    <div class="cards">
      <div class="card">
        <div class="tag">1 · The Editor</div>
        <h3>Where you read, fix, and approve posts</h3>
        <span class="url">verticaljetsales.com/admin</span>
        <p>This is your main workspace. You log in here with a free GitHub account (Ben sets this up for you one time).</p>
      </div>
      <div class="card">
        <div class="tag">2 · The Board</div>
        <h3>Where you SEE the finished posts</h3>
        <span class="url">verticaljetsales.com/content.html</span>
        <p>Every post shows as a card. Click a card to see exactly what the picture and words will look like online.</p>
      </div>
    </div>
  </div>

  <div class="rulebox">
    <div class="star">⭐</div>
    <div>
      <h3>The one golden rule</h3>
      <p>Nothing posts until its status says <b>“Approved.”</b> Everything else is safe. If you are ever unsure, just leave it as a <b>Draft</b> and nothing will happen.</p>
    </div>
  </div>

  <div class="foot"><span>Vertical Jet Sales — Content Studio Guide</span><span>Page 1</span></div>
</div>

<!-- ============ PAGE 2 ============ -->
<div class="page">
  <div class="section" style="margin-top:0">
    <span class="eyebrow">First Time Only</span>
    <h2>How to log in</h2>
    <p class="lead">You only do this once on your computer.</p>
    ${step(1, 'Get a free GitHub account', 'Go to <b>github.com</b> and sign up (it is free). Send your username to Ben so he can give you access.')}
    ${step(2, 'Go to the Editor', 'Type <b>verticaljetsales.com/admin</b> into your web browser.')}
    ${step(3, 'Click “Sign in with GitHub”', 'Type in your GitHub email and password. That’s it — you’re in.')}
  </div>

  <div class="job"><span class="chip">Job 1</span><div><h2>Say “yes” to a post</h2><small>This is the most important job — approving a draft so it can post.</small></div></div>
  ${step(1, 'Open the Editor', 'Go to <b>verticaljetsales.com/admin</b>.')}
  ${step(2, 'Click “Content Studio”', 'You’ll see a list of posts. The new ones say <b>[Draft]</b>.')}
  ${step(3, 'Click a post that says [Draft]', 'It opens so you can read the whole thing.')}
  ${step(4, 'Read it and fix anything', 'The words people will see are in the <b>“Body / Caption”</b> box. Change any wording you want.')}
  ${step(5, 'Change “Status” to “Approved”', 'Find the <b>Status</b> box near the top. Click it and pick <b>Approved</b>.')}
  ${step(6, 'Pick the day in “Scheduled For”', 'Choose the date you want it to go online.')}
  ${step(7, 'Click “Save”', 'The Save button is at the top of the page. <b>Done!</b> It will post by itself on that day.')}

  <div class="foot"><span>Vertical Jet Sales — Content Studio Guide</span><span>Page 2</span></div>
</div>

<!-- ============ PAGE 3 ============ -->
<div class="page">
  <div class="job" style="margin-top:0"><span class="chip">Job 2</span><div><h2>See what a post will look like</h2><small>Preview the finished picture and words before it goes out.</small></div></div>
  ${step(1, 'Open the Board', 'Go to <b>verticaljetsales.com/content.html</b>.')}
  ${step(2, 'Click any post card', 'A window opens showing the real picture (or video) and the caption — exactly what followers will see.')}
  ${step(3, 'Click the X to close', 'To make changes, click <b>“Edit this post”</b> and it takes you right to the Editor.')}

  <div class="job"><span class="chip">Job 3</span><div><h2>Add a new idea — the easy way</h2><small>Best for articles you read or ideas you have. The helper turns them into posts for you.</small></div></div>
  ${step(1, 'Open the Editor', 'Go to <b>verticaljetsales.com/admin</b>.')}
  ${step(2, 'Click “Ideas &amp; Article Inbox”', 'Then click <b>“New Idea / Article.”</b>')}
  ${step(3, 'Drop in your idea', 'Give it a short name. Paste an article <b>link</b>, or type your idea in the <b>notes</b> box. Add photos if you have them.')}
  ${step(4, 'Make sure Status says “New”, then Save', 'Later, tell Ben (or Claude) to “work the inbox” and your idea becomes ready-made drafts.')}

  <div class="job"><span class="chip">Job 4</span><div><h2>Write your own post — the other way</h2><small>Use this if you want to type a post yourself.</small></div></div>
  ${step(1, 'Editor → “Content Studio” → “New Content Item”', '')}
  ${step(2, 'Fill in the basics', 'A <b>Title</b> (just a label for us), pick a <b>Channel</b> (like instagram), and type the post in <b>Body / Caption</b>.')}
  ${step(3, 'Leave Status on “Draft” and Save', 'It now waits for a “yes” (Job 1). Nothing posts until then.')}

  <div class="foot"><span>Vertical Jet Sales — Content Studio Guide</span><span>Page 3</span></div>
</div>

<!-- ============ PAGE 4 ============ -->
<div class="page">
  <div class="job" style="margin-top:0"><span class="chip">Job 5</span><div><h2>Get rid of a post you don’t like</h2><small>Two easy choices — both keep it from ever posting.</small></div></div>
  ${step(1, 'Open the post in the Editor', 'Click it from the “Content Studio” list.')}
  ${step(2, 'Delete it, or archive it', 'Click the <b>“⋮”</b> (three dots) at the top and choose <b>Delete entry</b> to remove it. Or, to keep it but never post it, set <b>Status</b> to <b>Archived</b>.')}
  <p class="tip">Deleting a Draft is always safe — Drafts never post anyway. Use “Archived” when you might want it later.</p>

  <div class="section" style="margin-top:30px">
    <span class="eyebrow">Cheat Sheet</span>
    <h2>What the Status words mean</h2>
    <table class="words">
      <tr><td class="w">Idea</td><td>A seed. Not written into a post yet.</td></tr>
      <tr><td class="w">Draft</td><td>The helper wrote it. It is waiting for your “yes.” <b>(Safe — will not post.)</b></td></tr>
      <tr><td class="w">Needs Edit</td><td>Send it back for changes before approving.</td></tr>
      <tr><td class="w">Approved</td><td>You said yes. It is cleared to post. ✅</td></tr>
      <tr><td class="w">Scheduled</td><td>It is lined up in our posting tool and will go out on its date.</td></tr>
      <tr><td class="w">Posted</td><td>It is live online. 🎉</td></tr>
      <tr><td class="w">Archived</td><td>Kept in the library, but will never post.</td></tr>
    </table>
  </div>

  <div class="help">
    <h3>If you ever get stuck</h3>
    <ul>
      <li><b>Nothing can break.</b> Every change is saved and can be undone. Click around and explore.</li>
      <li><b>When in doubt, leave it as a Draft.</b> Drafts never post on their own.</li>
      <li><b>Need a post changed or a new batch made?</b> Just tell Ben, or ask Claude in the chat in plain words (for example: “make 3 posts about the Beechjet”).</li>
    </ul>
  </div>

  <div class="foot"><span>Vertical Jet Sales — Content Studio Guide</span><span>Page 4</span></div>
</div>

</body></html>`;

(async () => {
  const outDir = path.dirname(OUT);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.pdf({ path: OUT, format: 'Letter', printBackground: true,
    margin: { top: '0', bottom: '0', left: '0', right: '0' } });

  // Optional: --preview writes PNGs of each page for a visual check.
  if (process.argv.includes('--preview')) {
    const dir = '/tmp/claude-0/-home-user-vjs-site/083a2c47-4ec0-5949-8ccc-9738702be779/scratchpad';
    await page.setViewportSize({ width: 816, height: 1056 });
    const pages = await page.$$('.page');
    for (let i = 0; i < pages.length; i++) {
      await pages[i].screenshot({ path: `${dir}/guide-p${i + 1}.png` });
    }
    console.log(`Wrote ${pages.length} preview PNG(s) to ${dir}`);
  }
  await browser.close();
  console.log('Wrote ' + OUT);
})();
