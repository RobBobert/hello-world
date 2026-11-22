// Renders every beat state to PNG and writes segments.json with timings.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { BEATS } = require('./scenes.js');
const S = path.resolve(__dirname, '..'); const B = __dirname;
const words = JSON.parse(fs.readFileSync(`${B}/vo/words.json`, 'utf8')).words
  .filter(w => w.type === 'word' && !w.text.startsWith('['))
  .map(w => ({ t: w.text.toLowerCase().replace(/[^a-z']/g, '').replace(/'$/, ''), s: w.start })).filter(w => w.t);
const AUDIO_END = 98.75, END_CARD = 3.2;

let wi = 0;
function find(phrase) {
  const toks = phrase.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean);
  for (let i = wi; i < words.length; i++) {
    if (toks.every((t, k) => words[i + k] && words[i + k].t === t)) { wi = i + 1; return Math.max(0, words[i].s - 0.06); }
  }
  throw new Error('cue not found: ' + phrase + ' after word ' + wi);
}
BEATS.forEach(b => {
  if (b.end) { b.t0 = AUDIO_END; return; }
  b.t0 = find(b.start);
  if (b.pop) b.tp = find(b.pop);
});
BEATS.forEach((b, i) => { b.t1 = i < BEATS.length - 1 ? BEATS[i + 1].t0 : AUDIO_END + END_CARD; });
BEATS[0].t0 = 0;

const font = f => `data:font/woff2;base64,${fs.readFileSync(`${S}/fonts/${f}`).toString('base64')}`;
const AV = `data:image/png;base64,${fs.readFileSync(`${B}/avatar.png`).toString('base64')}`;
const BG = {
  dark: 'radial-gradient(ellipse at 50% 55%, #3a2a22 0%, #1a1210 70%, #0c0807 100%)',
  parch: 'radial-gradient(ellipse at 50% 50%, #e3c995 0%, #cfae74 75%, #a9874f 100%)',
  space: 'radial-gradient(ellipse at 50% 40%, #1d2a55 0%, #0b1026 70%, #05070f 100%)',
  blood: 'radial-gradient(ellipse at 50% 55%, #5a1512 0%, #260807 70%, #120303 100%)',
  black: '#050404', none: '#000',
};
function page(b, showL2) {
  const l2c = b.l2color === 'gold' ? '#f0b63c' : '#e8372c';
  const cap = b.big
    ? `<div class="big">${b.l1}</div>`
    : `<div class="cap ${b.end ? 'endcap' : ''} ${b.outro ? 'outcap' : ''} ${b.bg === 'parch' ? 'pcap' : ''}">${b.l1 ? `<div class="l1">${b.l1}</div>` : ''}${b.l2 && showL2 ? `<div class="l2" style="color:${l2c}">${b.l2}</div>` : ''}</div>`;
  const starfield = b.bg === 'space' ? stars(90) : '';
  return `<!doctype html><html><head><style>
  @font-face{font-family:Anton;src:url(${font('font2.woff2')})}
  @font-face{font-family:Cinzel;font-weight:700;src:url(${font('font4.woff2')})}
  html,body{margin:0;width:1080px;height:1920px;overflow:hidden}
  body{background:${b.outro ? '#1c1512' : BG[b.bg]};position:relative}
  svg{position:absolute;inset:0}
  .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;text-transform:uppercase;line-height:1.08}
  .endcap{top:1380px}
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
  .handle{position:absolute;bottom:90px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:40px;color:#f3e6c8;opacity:.8}
  </style></head><body>
  <svg viewBox="0 0 1080 1920" width="1080" height="1920"><defs>
   <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="10" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
   <radialGradient id="shade" cx="35%" cy="35%"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
  </defs>${starfield}${b.art(showL2)}</svg>
  ${b.outro ? '' : '<div class="grain"></div>'}${cap}${b.outro ? `<div class="av"></div><div class="oh">@AVANZO.TV</div><div class="oq">${b.q}</div><div class="oa">${b.a}</div>` : ''}</body></html>`;
}
function stars(n){ let o=''; for(let i=0;i<n;i++){ const x=(i*137.5)%1080, y=(i*251)%1920; o+=`<circle cx="${x}" cy="${y}" r="${1.5+(i%3)}" fill="#fff" opacity="${.25+(i%5)/8}"/>`;} return o; }

(async () => {
  const out = `${B}/frames`; fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch();
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  const segs = [];
  for (let i = 0; i < BEATS.length; i++) {
    const b = BEATS[i];
    const states = [];
    if (b.l1 && b.pop) { states.push([false, b.t0, b.tp]); states.push([true, b.tp, b.t1]); }
    else states.push([true, b.t0, b.t1]);
    for (let k = 0; k < states.length; k++) {
      const [l2, a, z] = states[k];
      const f = `${out}/b${String(i + 1).padStart(2, '0')}${'ab'[k]}.png`;
      await p.setContent(page(b, l2)); await p.evaluate(() => document.fonts.ready);
      await p.screenshot({ path: f });
      segs.push({ f, dur: +(z - a).toFixed(3), beat: i + 1, zoom: k === 0 });
    }
  }
  await browser.close();
  fs.writeFileSync(`${B}/segments.json`, JSON.stringify(segs, null, 1));
  console.log(segs.length, 'segments; total', segs.reduce((s, x) => s + x.dur, 0).toFixed(2));
  BEATS.forEach((b, i) => console.log(i + 1, b.t0.toFixed(2), b.tp ? b.tp.toFixed(2) : '', (b.t1 - b.t0).toFixed(2)));
})();
