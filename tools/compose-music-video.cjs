// Ben McPeak Music Content Studio — motion-from-photo video composer.
// Turns a post's photos into a vertical (1080x1920) social clip: a slow Ken
// Burns zoom/pan over each photo, the BEN McPEAK wordmark + headline framed on
// top, gentle cross-fades, and a branded end card. Writes
// media/music/generated/<id>.mp4 and records it on the item's "video" field.
//
// AUDIO: by default the clip is SILENT (a valid but empty audio track) so you can
// lay it over the actual song or a trending sound in-app — which is what wins on
// TikTok/Reels. Set "audio":"tools/audio/<file>" on the item ONLY if you have a
// cleared bed. The tool never invents or bundles music.
//
// Needs a headless browser (for the branded overlays) AND ffmpeg. Local / agent
// step, not part of the Netlify build.
//
// Usage:
//   node tools/compose-music-video.cjs <id> [<id> ...]   # build specific posts
//   node tools/compose-music-video.cjs --all-video       # every video-format post

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'data', 'music', 'content');
const SONGS_DIR = path.join(ROOT, 'data', 'music', 'songs');
const OUT_DIR = path.join(ROOT, 'media', 'music', 'generated');
const LOGO_PATH = path.join(ROOT, 'media', 'music', 'logo.png');

const du = (f, m) => `data:${m};base64,` + fs.readFileSync(f).toString('base64');
const FONTS = {
  pf: du(path.join(__dirname, 'fonts', 'PlayfairDisplay-700.ttf'), 'font/ttf'),
  a4: du(path.join(__dirname, 'fonts', 'Archivo-400.ttf'), 'font/ttf'),
  a7: du(path.join(__dirname, 'fonts', 'Archivo-700.ttf'), 'font/ttf'),
};
const LOGO = fs.existsSync(LOGO_PATH) ? du(LOGO_PATH, 'image/png') : '';
const NIGHT = '0x1A1712';

const FONT_CSS = `
  @font-face{font-family:'PF';src:url(${FONTS.pf})}
  @font-face{font-family:'AR';font-weight:400;src:url(${FONTS.a4})}
  @font-face{font-family:'AR';font-weight:700;src:url(${FONTS.a7})}`;

function esc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function readJSON(p){return JSON.parse(fs.readFileSync(p,'utf8'));}
function hSize(t,a,b,c){const n=(t||'').length;return n<=42?a:n<=72?b:c;}

// Typographic wordmark (or the real logo if media/music/logo.png exists).
function wordmark(size, center){
  if (LOGO) return `<img src="${LOGO}" style="height:${size}px;width:auto;display:block${center?';margin:0 auto':''}">`;
  return `<div style="line-height:.9${center?';text-align:center':''}">
    <div style="font-family:'PF',serif;font-weight:700;font-size:${Math.round(size*0.66)}px;letter-spacing:.02em;color:#F1E6D2">Ben McPeak</div>
    <div style="font-family:'AR';font-weight:700;font-size:${Math.round(size*0.18)}px;letter-spacing:.42em;text-transform:uppercase;color:#D69A3C;margin-top:${Math.round(size*0.1)}px">Texas Country</div>
  </div>`;
}

function songMeta(item){
  if(!item.song_id) return null;
  const p=path.join(SONGS_DIR,item.song_id+'.json');
  if(!fs.existsSync(p)) return null;
  const s=readJSON(p);
  const year=(s.release_date||'').slice(0,4);
  const typeLabel={single:'Single',album:'Album',ep:'EP',track:'Song'}[s.type]||'';
  return {sub:[s.title,[typeLabel,year].filter(Boolean).join(' ')].filter(Boolean).join('  ·  '),status:s.status||''};
}
function resolvePhotos(item, max){
  const out=[]; const seen=new Set();
  const cands=[...(item.media||[])];
  if(item.song_id){
    const p=path.join(SONGS_DIR,item.song_id+'.json');
    if(fs.existsSync(p)){const s=readJSON(p);[s.cover_art,s.photo].forEach(m=>m&&cands.push(m));}
  }
  for(const c of cands){
    if(!c||typeof c!=='string'||seen.has(c)) continue;
    const local=path.join(ROOT,c.replace(/^\//,''));
    if(fs.existsSync(local)){out.push(local);seen.add(c);}
    if(out.length>=max) break;
  }
  return out;
}

// Transparent branded frame overlaid on every photo shot.
function frameHTML(headline, sub, kicker){
  const hs=hSize(headline,58,48,40);
  return `<!doctype html><meta charset=utf-8><style>${FONT_CSS}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;position:relative;font-family:'AR',sans-serif;color:#F1E6D2}
  .top{position:absolute;top:0;left:0;right:0;height:360px;background:linear-gradient(180deg,rgba(26,23,18,.92),rgba(26,23,18,0))}
  .bot{position:absolute;bottom:0;left:0;right:0;height:780px;background:linear-gradient(0deg,rgba(26,23,18,.96) 22%,rgba(26,23,18,.7) 55%,rgba(26,23,18,0))}
  .wm{position:absolute;top:60px;left:64px}
  .badge{position:absolute;top:88px;right:64px;font-family:'AR';font-weight:700;font-size:30px;letter-spacing:.14em;text-transform:uppercase;color:#1A1712;background:#D69A3C;padding:14px 26px;border-radius:4px}
  .cap{position:absolute;left:64px;right:64px;bottom:190px}
  h1{font-family:'PF',serif;font-size:${hs}px;line-height:1.06;letter-spacing:-.01em}
  .sub{font-size:34px;margin-top:22px;opacity:.94}
  .rule{height:3px;width:120px;background:linear-gradient(90deg,#D69A3C,transparent);margin-top:26px}
  .strip{position:absolute;left:64px;right:64px;bottom:80px;display:flex;justify-content:space-between;font-size:32px;letter-spacing:.03em}
  .strip .s{color:#E7B65E}
  </style>
  <div class="top"></div><div class="bot"></div>
  <div class="wm">${wordmark(112,false)}</div>
  <div class="badge">${esc(kicker)}</div>
  <div class="cap"><h1>${esc(headline)}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:''}<div class="rule"></div></div>
  <div class="strip"><span>@benmcpeakmusic</span><span class="s">benmcpeakmusic.com</span></div>`;
}
// Opaque branded end card.
function endHTML(headline, cta){
  const hs=hSize(headline,68,58,48);
  return `<!doctype html><meta charset=utf-8><style>${FONT_CSS}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:1080px;height:1920px;background:#1A1712;position:relative;font-family:'AR',sans-serif;color:#F1E6D2;overflow:hidden}
  .glow{position:absolute;width:1200px;height:1200px;left:50%;top:34%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle,rgba(214,154,60,.22),rgba(214,154,60,0) 66%)}
  .wrap{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 96px}
  .wm{margin-bottom:60px}
  h1{font-family:'PF',serif;font-size:${hs}px;line-height:1.1;letter-spacing:-.01em;max-width:16ch}
  .cta{font-size:38px;color:#E7B65E;margin-top:48px}
  .site{position:absolute;bottom:96px;left:0;right:0;text-align:center;font-size:34px;letter-spacing:.06em;color:#F1E6D2;opacity:.85}
  </style>
  <div class="glow"></div>
  <div class="wrap"><div class="wm">${wordmark(150,true)}</div><h1>${esc(headline)}</h1>${cta?`<div class="cta">${esc(cta)}</div>`:''}</div>
  <div class="site">benmcpeakmusic.com</div>`;
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
  const z = (i%2===0) ? `'min(zoom+0.0011,1.15)'` : `'if(eq(on,0),1.15,max(zoom-0.0011,1.0))'`;
  const fc=[
    `color=c=${NIGHT}:s=1080x1920:r=${fps}:d=${dur}[bg]`,
    `[0:v]scale=1080:1180:force_original_aspect_ratio=increase,crop=1080:1180,setsar=1,scale=1200:1312,`+
      `zoompan=z=${z}:d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1180:fps=${fps}[ph]`,
    `[bg][ph]overlay=(W-w)/2:380:shortest=1[b]`,
    `[b][1:v]overlay=0:0,format=yuv420p[v]`,
  ].join(';');
  ff(['-loop','1','-t',String(dur),'-i',photo,'-i',frame,'-filter_complex',fc,'-map','[v]','-r',String(fps),'-t',String(dur),'-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p',outFile]);
}
function endClip(endcard, outFile){
  const dur=2.6, fps=30;
  ff(['-loop','1','-t',String(dur),'-i',endcard,'-filter_complex',`[0:v]scale=1080:1920,fps=${fps},format=yuv420p[v]`,'-map','[v]','-t',String(dur),'-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p',outFile]);
}

function xfadeConcat(clips, durs, outFile, audioBed){
  const XF=0.5;
  const inputs=[]; clips.forEach(c=>{inputs.push('-i',c);});
  let filover='', last='0:v', running=durs[0];
  for(let k=1;k<clips.length;k++){
    const off=(running-XF).toFixed(3);
    const lbl=(k===clips.length-1)?'v':`x${k}`;
    filover+=`[${last}][${k}:v]xfade=transition=fade:duration=${XF}:offset=${off}[${lbl}];`;
    last=lbl; running=running - XF + durs[k];
  }
  filover=filover.replace(/;$/,'');
  const dur = running.toFixed(3);
  const enc=['-c:v','libx264','-preset','veryfast','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-shortest','-movflags','+faststart'];

  if (audioBed && fs.existsSync(audioBed)) {
    const mi = clips.length;
    const fadeOut = Math.max(0, running - 2.0).toFixed(3);
    const fc = `${filover};[${mi}:a]atrim=0:${dur},asetpts=N/SR/TB,volume=0.9,`+
               `afade=t=in:st=0:d=1.0,afade=t=out:st=${fadeOut}:d=2.0[a]`;
    ff([...inputs, '-stream_loop','-1','-i',audioBed,
        '-filter_complex',fc,'-map','[v]','-map','[a]',...enc,outFile]);
  } else {
    // Default: silent track, ready to drop over the real song / a trending sound.
    ff([...inputs,'-f','lavfi','-t',dur,'-i','anullsrc=r=44100:cl=stereo',
        '-filter_complex',filover,'-map','[v]','-map',`${clips.length}:a`,...enc,outFile]);
  }
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
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'bmvid-'));
  const browser=await chromium.launch({executablePath:process.env.PW_CHROMIUM||'/opt/pw-browsers/chromium'});
  const page=await browser.newPage();

  for(const f of files){
    const p=path.join(CONTENT_DIR,f); const item=readJSON(p);
    const photos=resolvePhotos(item,3);
    if(!photos.length){console.log(`skip ${item.id} (no photos — film to the shot list, then re-run)`);continue;}
    const meta=songMeta(item);
    const headline=item.visual_headline||item.hook||item.title||'';
    const sub=item.visual_subline||(meta?meta.sub:'');
    const kicker=item.visual_kicker||(meta?(meta.status==='Upcoming'?'Coming Soon':'New Music'):'Ben McPeak');
    const cta=item.cta||'Wherever you stream.';

    const frame=path.join(tmp,item.id+'-frame.png');
    const endcard=path.join(tmp,item.id+'-end.png');
    await renderPNG(page, frameHTML(headline,sub,kicker), frame, true);
    await renderPNG(page, endHTML(headline,cta), endcard, false);

    const clips=[], durs=[];
    photos.forEach((ph,i)=>{const c=path.join(tmp,`${item.id}-${i}.mp4`);motionClip(ph,frame,c,i);clips.push(c);durs.push(4);});
    const ec=path.join(tmp,`${item.id}-end.mp4`);endClip(endcard,ec);clips.push(ec);durs.push(2.6);

    const audioBed = item.audio ? path.join(ROOT, String(item.audio).replace(/^\//,'')) : '';
    const outRel=`/media/music/generated/${item.id}.mp4`;
    xfadeConcat(clips,durs,path.join(ROOT,outRel.replace(/^\//,'')),audioBed);
    item.video=outRel;
    fs.writeFileSync(p,JSON.stringify(item,null,2)+'\n');
    console.log(`video  ${item.id}  (${photos.length} shots${audioBed?', with bed':', silent'})  ->  ${outRel}`);
  }
  await browser.close();
  fs.rmSync(tmp,{recursive:true,force:true});
  console.log('\nDone. Rebuild the index:  node build-music-index.js');
}
main().catch(e=>{console.error(e);process.exit(1);});
