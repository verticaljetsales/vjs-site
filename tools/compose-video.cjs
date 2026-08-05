// VJS Content Studio — motion-from-photo video composer.
// Turns a post's listing photos into a vertical (1080x1920) social video:
// a slow Ken Burns zoom/pan over each photo, the VJS logo + headline framed
// on top, gentle cross-fades between shots, and a branded end card.
// Writes media/generated/<id>.mp4 and records it on the item's "video" field.
//
// Needs a headless browser (for the branded overlays) AND ffmpeg. Like the
// image composer, this is a local / agent step, not part of the Netlify build.
//
// Usage:
//   node tools/compose-video.cjs <id> [<id> ...]   # build specific posts
//   node tools/compose-video.cjs --all-video       # every reel/short_video post

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'content');
const OUT_DIR = path.join(ROOT, 'media', 'generated');
const LOGO_PATH = path.join(ROOT, 'images', 'site', 'd32fc2ff2a.png');

const du = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const FONTS = {
  pf: du(path.join(__dirname, 'fonts', 'PlayfairDisplay-400.ttf'), 'font/ttf'),
  a4: du(path.join(__dirname, 'fonts', 'Archivo-400.ttf'), 'font/ttf'),
  a7: du(path.join(__dirname, 'fonts', 'Archivo-700.ttf'), 'font/ttf'),
};
const LOGO = fs.existsSync(LOGO_PATH) ? du(LOGO_PATH, 'image/png') : '';
const LOGO_ASPECT = 520 / 276;

const FONT_CSS = `
  @font-face{font-family:'PF';src:url(${FONTS.pf})}
  @font-face{font-family:'AR';font-weight:400;src:url(${FONTS.a4})}
  @font-face{font-family:'AR';font-weight:700;src:url(${FONTS.a7})}`;

function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function hSize(t,a,b,c){const n=(t||'').length;return n<=42?a:n<=72?b:c;}

function aircraftMeta(item){
  if(!item.aircraft_id) return null;
  const ap=path.join(ROOT,'data','aircraft',item.aircraft_id+'.json');
  if(!fs.existsSync(ap)) return null;
  const a=readJSON(ap);
  return {sub:[a.year,a.make_model].filter(Boolean).join(' ')+(a.category?'  ·  '+a.category:''),status:a.status||'For Sale'};
}
function resolvePhotos(item, max){
  const out=[]; const seen=new Set();
  const cands=[...(item.media||[])];
  if(item.aircraft_id){
    const ap=path.join(ROOT,'data','aircraft',item.aircraft_id+'.json');
    if(fs.existsSync(ap)) (readJSON(ap).photos||[]).forEach(m=>cands.push(m));
  }
  for(const c of cands){
    if(!c||typeof c!=='string'||seen.has(c)) continue;
    const local=path.join(ROOT,c.replace(/^\//,''));
    if(fs.existsSync(local)){out.push(local);seen.add(c);}
    if(out.length>=max) break;
  }
  return out;
}

// Transparent branded frame overlaid on every photo shot: logo top, headline
// + spec in a bottom gradient, handle/site at the very bottom.
function frameHTML(headline, sub, kicker){
  const hs=hSize(headline,60,50,42);
  return `<!doctype html><meta charset=utf-8><style>${FONT_CSS}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;position:relative;font-family:'AR',sans-serif;color:#E9E5DC}
  .top{position:absolute;top:0;left:0;right:0;height:360px;background:linear-gradient(180deg,rgba(7,15,23,.92),rgba(7,15,23,0))}
  .bot{position:absolute;bottom:0;left:0;right:0;height:760px;background:linear-gradient(0deg,rgba(7,15,23,.96) 22%,rgba(7,15,23,.7) 55%,rgba(7,15,23,0))}
  .logo{position:absolute;top:64px;left:64px;height:120px;width:${Math.round(120*LOGO_ASPECT)}px}
  .badge{position:absolute;top:96px;right:64px;font-family:'AR';font-weight:700;font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:#0B1520;background:#C6A15B;padding:14px 26px;border-radius:4px}
  .cap{position:absolute;left:64px;right:64px;bottom:190px}
  h1{font-family:'PF',serif;font-size:${hs}px;line-height:1.06;letter-spacing:-.01em}
  .sub{font-size:34px;margin-top:22px;opacity:.94}
  .rule{height:3px;width:120px;background:linear-gradient(90deg,#C6A15B,transparent);margin-top:26px}
  .strip{position:absolute;left:64px;right:64px;bottom:80px;display:flex;justify-content:space-between;font-size:32px;letter-spacing:.03em}
  .strip .s{color:#DcBd80}
  </style>
  <div class="top"></div><div class="bot"></div>
  ${LOGO?`<img class="logo" src="${LOGO}">`:''}
  <div class="badge">${esc(kicker)}</div>
  <div class="cap"><h1>${esc(headline)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:''}<div class="rule"></div></div>
  <div class="strip"><span>@verticaljetsales</span><span class="s">verticaljetsales.com</span></div>`;
}
// Opaque branded end card.
function endHTML(headline, cta){
  const hs=hSize(headline,72,60,50);
  return `<!doctype html><meta charset=utf-8><style>${FONT_CSS}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;background:#0B1520;position:relative;font-family:'AR',sans-serif;color:#E9E5DC;overflow:hidden}
  .glow{position:absolute;width:1200px;height:1200px;left:50%;top:34%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(198,161,91,.22),rgba(198,161,91,0) 66%)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 96px}
  .logo{height:150px;width:${Math.round(150*LOGO_ASPECT)}px;margin-bottom:60px}
  h1{font-family:'PF',serif;font-size:${hs}px;line-height:1.1;letter-spacing:-.01em;max-width:16ch}
  .cta{font-size:38px;color:#DcBd80;margin-top:48px}
  .site{position:absolute;bottom:96px;left:0;right:0;text-align:center;font-size:34px;letter-spacing:.06em;color:#E9E5DC;opacity:.85}
  </style>
  <div class="glow"></div>
  <div class="wrap">${LOGO?`<img class="logo" src="${LOGO}">`:''}<h1 class="pf">${esc(headline)}</h1>${cta?`<div class="cta">${esc(cta)}</div>`:''}</div>
  <div class="site">verticaljetsales.com</div>`;
}

async function renderPNG(page, html, outFile, transparent){
  await page.setViewportSize({width:1080,height:1920});
  await page.setContent(html,{waitUntil:'networkidle'});
  await page.waitForTimeout(120);
  await page.screenshot({path:outFile, omitBackground: !!transparent});
}

function ff(args){ execFileSync('ffmpeg', ['-hide_banner','-loglevel','error','-y',...args]); }

function motionClip(photo, frame, outFile, i){
  const dur=4, fps=30, frames=dur*fps;
  // even shots zoom in, odd shots zoom out — a little variety
  const z = (i%2===0)
    ? `'min(zoom+0.0011,1.15)'`
    : `'if(eq(on,0),1.15,max(zoom-0.0011,1.0))'`;
  const fc=[
    `color=c=0x0B1520:s=1080x1920:r=${fps}:d=${dur}[bg]`,
    `[0:v]scale=1080:720:force_original_aspect_ratio=increase,crop=1080:720,setsar=1,scale=1200:800,`+
      `zoompan=z=${z}:d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x720:fps=${fps}[ph]`,
    `[bg][ph]overlay=(W-w)/2:600:shortest=1[b]`,
    `[b][1:v]overlay=0:0,format=yuv420p[v]`,
  ].join(';');
  ff(['-loop','1','-t',String(dur),'-i',photo,'-i',frame,'-filter_complex',fc,'-map','[v]','-r',String(fps),'-t',String(dur),'-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p',outFile]);
}
function endClip(endcard, outFile){
  const dur=3, fps=30;
  ff(['-loop','1','-t',String(dur),'-i',endcard,'-filter_complex',`[0:v]scale=1080:1920,fps=${fps},format=yuv420p[v]`,'-map','[v]','-t',String(dur),'-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p',outFile]);
}
function xfadeConcat(clips, durs, outFile){
  const XF=0.5, fps=30;
  const inputs=[]; clips.forEach(c=>{inputs.push('-i',c);});
  let filover='', last='0:v', running=durs[0];
  for(let k=1;k<clips.length;k++){
    const off=(running-XF).toFixed(3);
    const lbl=(k===clips.length-1)?'v':`x${k}`;
    filover+=`[${last}][${k}:v]xfade=transition=fade:duration=${XF}:offset=${off}[${lbl}];`;
    last=lbl; running=running - XF + durs[k];
  }
  filover=filover.replace(/;$/,'');
  ff([...inputs,'-f','lavfi','-t',running.toFixed(3),'-i','anullsrc=r=44100:cl=stereo',
      '-filter_complex',filover,'-map','[v]','-map',`${clips.length}:a`,
      '-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-shortest','-movflags','+faststart',outFile]);
}

async function main(){
  let args=process.argv.slice(2);
  let files=fs.readdirSync(CONTENT_DIR).filter(f=>f.endsWith('.json'));
  if(args.includes('--all-video')){
    files=files.filter(f=>{const c=readJSON(path.join(CONTENT_DIR,f));return ['reel','short_video'].includes(c.format)||(Array.isArray(c.script)&&c.script.length);});
  } else if(args.length){
    files=files.filter(f=>args.includes(f.replace(/\.json$/,'')));
  } else {
    console.log('Pass post id(s) or --all-video.'); return;
  }
  if(!files.length){console.log('No matching posts.');return;}
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'vjsvid-'));
  const browser=await chromium.launch({executablePath:process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium'});
  const page=await browser.newPage();

  for(const f of files){
    const p=path.join(CONTENT_DIR,f); const item=readJSON(p);
    const photos=resolvePhotos(item,3);
    if(!photos.length){console.log(`skip ${item.id} (no photos)`);continue;}
    const meta=aircraftMeta(item);
    const headline=item.visual_headline||item.hook||item.title||'';
    const sub=item.visual_subline||(meta?meta.sub:'');
    const kicker=item.visual_kicker||(meta?meta.status:'For Sale');
    const cta=item.cta||'Full spec & status on request.';

    const frame=path.join(tmp,item.id+'-frame.png');
    const endcard=path.join(tmp,item.id+'-end.png');
    await renderPNG(page, frameHTML(headline,sub,kicker), frame, true);
    await renderPNG(page, endHTML(headline,cta), endcard, false);

    const clips=[], durs=[];
    photos.forEach((ph,i)=>{const c=path.join(tmp,`${item.id}-${i}.mp4`);motionClip(ph,frame,c,i);clips.push(c);durs.push(4);});
    const ec=path.join(tmp,`${item.id}-end.mp4`);endClip(endcard,ec);clips.push(ec);durs.push(3);

    const outRel=`/media/generated/${item.id}.mp4`;
    xfadeConcat(clips,durs,path.join(ROOT,outRel.replace(/^\//,'')));
    item.video=outRel;
    fs.writeFileSync(p,JSON.stringify(item,null,2)+'\n');
    console.log(`video  ${item.id}  (${photos.length} shots)  ->  ${outRel}`);
  }
  await browser.close();
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log('\nDone. Rebuild the index:  node build-content-index.js');
}
main().catch(e=>{console.error(e);process.exit(1);});
