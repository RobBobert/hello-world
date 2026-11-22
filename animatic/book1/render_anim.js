// Frame-by-frame renderer. Usage: node render_anim.js <worker> <workers>   (writes frames/fNNNNN.jpg)
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { BEATS } = require('./scenes_anim.js');
const B = __dirname, S = path.resolve(B, '..');
const FPS = 30, AUDIO_END = 98.75, END_CARD = 3.2;
const [W, K] = [parseInt(process.argv[2] || '0'), parseInt(process.argv[3] || '1')];

// ---- timings from word timestamps ----
const words = JSON.parse(fs.readFileSync(`${B}/vo/words.json`, 'utf8')).words
  .filter(w => w.type === 'word' && !w.text.startsWith('['))
  .map(w => ({ t: w.text.toLowerCase().replace(/[^a-z']/g, '').replace(/'$/, ''), s: w.start })).filter(w => w.t);
let wi = 0;
function find(phrase) {
  const toks = phrase.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean);
  for (let i = wi; i < words.length; i++) if (toks.every((t, k) => words[i + k] && words[i + k].t === t)) { wi = i + 1; return Math.max(0, words[i].s - 0.06); }
  throw new Error('cue not found: ' + phrase);
}
BEATS.forEach(b => { b.t0 = find(b.start); if (b.pop) b.tp = find(b.pop); });
BEATS[0].t0 = 0;
BEATS.forEach((b, i) => { b.t1 = i < BEATS.length - 1 ? BEATS[i + 1].t0 : AUDIO_END + END_CARD; });
const N = Math.round((AUDIO_END + END_CARD) * FPS);

// ---- page ----
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${S}/fonts/${f}`).toString('base64')}`;
const AV = `data:image/png;base64,${fs.readFileSync(`${B}/avatar.png`).toString('base64')}`;
const BG = {
  dark: 'radial-gradient(ellipse at 50% 55%, #3a2a22 0%, #1a1210 70%, #0c0807 100%)',
  parch: 'radial-gradient(ellipse at 50% 50%, #e3c995 0%, #cfae74 75%, #a9874f 100%)',
  space: 'radial-gradient(ellipse at 50% 40%, #1d2a55 0%, #0b1026 70%, #05070f 100%)',
  blood: 'radial-gradient(ellipse at 50% 55%, #5a1512 0%, #260807 70%, #120303 100%)',
  black: '#050404', none: '#000',
};
const TEMPLATE = `<!doctype html><html><head><style>
  @font-face{font-family:Anton;src:url(${font('font2.woff2')})}
  @font-face{font-family:Cinzel;font-weight:700;src:url(${font('font4.woff2')})}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  #w{position:absolute;inset:0;transform-origin:50% 50%}
  svg{position:absolute;inset:0}
  .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;text-transform:uppercase;line-height:1.08}
  .l1,.l2{font-size:84px;letter-spacing:1px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.5)}
  .l1{color:#f6ead2}
  .pcap .l1,.pcap .l2{-webkit-text-stroke:7px #2a1d12;text-shadow:0 6px 0 rgba(42,29,18,.6)}
  .outcap{top:470px}
  .av{position:absolute;left:390px;top:880px;width:300px;height:300px;border-radius:50%;border:12px solid #e2a93b;box-sizing:border-box;background:url(${AV}) center/118% no-repeat}
  .oh{position:absolute;top:1225px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:48px;color:#f6ead2}
  .oq{position:absolute;top:1330px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:52px;color:#f6ead2;font-variant:small-caps}
  .oa{position:absolute;top:1405px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:52px;color:#e2a93b;font-variant:small-caps}
  .big{position:absolute;top:300px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:150px;color:#2a1d12;letter-spacing:4px}
  .grain{position:absolute;inset:0;background:radial-gradient(ellipse at center,transparent 55%,rgba(0,0,0,.45) 100%)}
</style></head><body><div id="w"></div></body></html>`;
const DEFS = `<defs><filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <radialGradient id="shade" cx="35%" cy="35%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>`;
function stars(n, t) { let o = ''; for (let i = 0; i < n; i++) { const x = (i * 137.5) % 1080, y = (i * 251) % 1920; o += `<circle cx="${x}" cy="${y}" r="${1.5 + (i % 3)}" fill="#fff" opacity="${(0.3 + 0.3 * Math.sin(t * 2 + i)).toFixed(2)}"/>`; } return o; }
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = u => 1 - Math.pow(1 - cl(u), 3);
const slide = u => `style="opacity:${cl(u * 1.5).toFixed(3)};transform:translateY(${(28 * (1 - ease(u))).toFixed(1)}px)"`;

function frame(f) {
  const T = f / FPS;
  const i = Math.max(0, BEATS.findIndex(b => T >= b.t0 && T < b.t1));
  const b = BEATS[i];
  const hasTwoStates = b.l1 && b.pop;
  const p = !b.l1 || (b.pop ? T >= b.tp : true);
  const t = T - b.t0;
  const pt = p ? T - (hasTwoStates ? b.tp : b.t0) : -1;
  const stateStart = hasTwoStates && p ? b.tp : b.t0;
  const on = Math.round((T - stateStart) * FPS);
  const zoom = !hasTwoStates || !p ? 1 + 0.0007 * on : (on < 6 ? 1.06 - 0.008 * on : 1.012 + 0.0005 * (on - 6));
  const l2c = b.l2color === 'gold' ? '#f0b63c' : '#e8372c';
  const cap = b.big
    ? `<div class="big" ${slide(t / 0.2)}>${b.l1}</div>`
    : `<div class="cap ${b.outro ? 'outcap' : ''} ${b.bg === 'parch' ? 'pcap' : ''}">${b.l1 ? `<div class="l1" ${slide(i === 0 ? 1 : t / 0.18)}>${b.l1}</div>` : ''}${b.l2 && p ? `<div class="l2" style="color:${l2c}"><span ${slide(pt / 0.18)} class="x">${b.l2}</span></div>` : ''}</div>`;
  const svg = `<svg viewBox="0 0 1080 1920" width="1080" height="1920">${DEFS}${b.bg === 'space' ? stars(90, T) : ''}${b.art(p, t, pt)}</svg>`;
  const outro = b.outro ? `<div class="av" style="opacity:${ease(t / 0.4)};transform:scale(${(0.85 + 0.15 * ease(t / 0.4)).toFixed(3)})"></div><div class="oh">@AVANZO.TV</div><div class="oq" ${slide((t - 0.3) / 0.3)}>${b.q}</div><div class="oa" ${slide((t - 0.5) / 0.3)}>${b.a}</div>` : '';
  return { bg: b.outro ? '#1c1512' : BG[b.bg], zoom, html: svg + (b.outro ? '' : '<div class="grain"></div>') + cap + outro };
}

(async () => {
  const out = `${B}/aframes`; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const pg = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.setContent(TEMPLATE); await pg.evaluate(() => document.fonts.ready);
  await pg.addStyleTag({ content: '.l2 span{display:inline-block}' });
  for (let f = W; f < N; f += K) {
    const file = `${out}/f${String(f).padStart(5, '0')}.jpg`;
    if (fs.existsSync(file)) continue;
    const { bg, zoom, html } = frame(f);
    await pg.evaluate(([bg, zoom, html]) => { document.body.style.background = bg; const w = document.getElementById('w'); w.style.transform = `scale(${zoom})`; w.innerHTML = html; }, [bg, zoom, html]);
    await pg.screenshot({ path: file, type: 'jpeg', quality: 90 });
  }
  await browser.close();
  if (W === 0) console.log('frames', N);
})();
