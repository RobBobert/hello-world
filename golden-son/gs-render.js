// Frame-by-frame renderer for the full Golden Son video. node gs-render.js <worker> <workers> [stills]
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const L = require('./lighting.js'), { BEATS, MONO, OPEN } = require('./gs-scenes.js');
const B = __dirname, FPS = 30, W = 1080, H = 1920;
const [WK, NK] = [parseInt(process.argv[2] || '0'), parseInt(process.argv[3] || '1')];
const words = JSON.parse(fs.readFileSync(`${B}/vo/words.json`, 'utf8')).words.filter(w => w.type === 'word' && !w.text.startsWith('['))
  .map(w => ({ t: w.text.toLowerCase().replace(/[^a-z']/g, '').replace(/'$/, ''), s: w.start + OPEN, e: w.end + OPEN })).filter(w => w.t);
const AUDIO_END = words[words.length - 1].e + 0.25, END_CARD = 3.2;
let wi = 0;
function find(ph) { const toks = ph.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean);
  for (let i = wi; i < words.length; i++) if (toks.every((t, k) => words[i + k] && words[i + k].t === t)) { wi = i + 1; return Math.max(0, words[i].s - 0.06); }
  throw new Error('cue not found: ' + ph); }
BEATS.forEach(b => { if (b.fixed) { b.t0 = b.t0f; return; } b.t0 = find(b.start); if (b.pop) b.tp = find(b.pop); });
BEATS[0].t0 = 0; BEATS[1].t0 = OPEN;
BEATS.forEach((b, i) => { b.t1 = i < BEATS.length - 1 ? BEATS[i + 1].t0 : AUDIO_END + END_CARD; if (b.popAt != null && !b.tp) b.tp = b.t0 + b.popAt; });
const N = Math.round((AUDIO_END + END_CARD) * FPS);
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${B}/fonts/${f}`).toString('base64')}`;
const AV = `data:image/png;base64,${fs.readFileSync(`${B}/avatar.png`).toString('base64')}`;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), ease = u => 1 - Math.pow(1 - cl(u), 3);
const slide = u => `style="opacity:${cl(u * 1.5).toFixed(3)};transform:translateY(${(28 * (1 - ease(u))).toFixed(1)}px)"`;
const PAGE = `<!doctype html><style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
  html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}#w{position:absolute;inset:0}svg{position:absolute;inset:0}
  .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08;text-transform:uppercase}
  .l1,.l2{font-size:84px;letter-spacing:1px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}.l1{color:#f6ead2}.l2 span{display:inline-block}
  .plate{position:absolute;left:70px;right:70px;top:230px;border-radius:40px;background:radial-gradient(ellipse at center,rgba(8,4,6,.62) 0%,rgba(8,4,6,.45) 60%,rgba(8,4,6,0) 100%)}
  .sm .l1,.sm .l2{font-size:72px}
  .outcap{top:560px}.av{position:absolute;left:390px;top:810px;width:300px;height:300px;border-radius:50%;border:12px solid #e2a93b;box-sizing:border-box;background:url(${AV}) center/118% no-repeat}
  .oh{position:absolute;top:1140px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:48px;color:#f6ead2}
  .oq{position:absolute;top:1240px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:50px;color:#f6ead2;font-variant:small-caps}
  .oa{position:absolute;top:1312px;left:60px;right:60px;text-align:center;font-family:Cinzel;font-weight:700;font-size:46px;color:#e2a93b;font-variant:small-caps}</style><div id="w"></div>`;
function frame(fn) {
  const T = fn / FPS, i = Math.max(0, BEATS.findIndex(b => T >= b.t0 && T < b.t1)), b = BEATS[i];
  const p = !b.l2 ? true : (b.tp != null ? T >= b.tp : true), t = T - b.t0, pt = p && b.tp != null ? T - b.tp : (p ? t : -1), dur = b.t1 - b.t0;
  const l2c = b.l2color === 'gold' ? '#f0b63c' : '#e8372c';
  if (b.outro) return `<div style="position:absolute;inset:0;background:#1c1512"></div><div class="cap outcap"><div class="l1" ${slide(t / .2)}>${b.l1}</div>${T >= b.tp ? `<div class="l2" style="color:#e8372c"><span ${slide((T - b.tp) / .2)}>${b.l2}</span></div>` : ''}</div>
    <div class="av" style="opacity:${ease((t - .2) / .4)}"></div><div class="oh" style="opacity:${ease((t - .4) / .4)}">@AVANZO.TV</div><div class="oq" ${slide((t - 1) / .3)}>${b.q}</div><div class="oa" ${slide((t - 1.3) / .3)}>${b.a}</div>`;
  require('./chibi2.js').setLight(b.outro ? null : (b.mood || 'gala'));
  const rf = b.raw && b.raw(t);
  const svg = rf ? `<img src="data:image/jpeg;base64,${fs.readFileSync(rf).toString('base64')}" style="position:absolute;inset:0;width:${W}px;height:${H}px">` : `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${b.art(t, p, pt, dur)}${L.grade(b.mood === 'gala' ? 'gala' : b.mood, b.mood === 'triumph' ? { turn: .5 } : {})}</svg>`;
  if (b.dialog) { const dl = b.dialog.filter(([at, , du]) => t >= at && t < at + (du || 1.7)).pop(); return svg + (dl ? `<div class="cap" ><div class="l1" ${slide((t - dl[0]) / .15)}>${dl[1]}</div></div>` : ''); }
  const long = (b.l1 + (b.l2 || '')).length > 44, warm = ['mars', 'mine', 'triumph', 'space'].includes(b.mood);
  const plate = warm ? `<div class="plate" style="height:${long || (b.l1.length > 22 && b.l2) ? 380 : 300}px"></div>` : '';
  const cap = plate + `<div class="cap ${long ? 'sm' : ''}"><div class="l1" ${slide(i === 0 ? 1 : t / .18)}>${b.l1}</div>${b.l2 && p ? `<div class="l2" style="color:${l2c}"><span ${slide(pt / .18)}>${b.l2}</span></div>` : ''}</div>`;
  return svg + cap;
}
(async () => {
  const out = `${B}/frames`; fs.mkdirSync(out, { recursive: true });
  const RANGE = process.argv[4] === 'range' ? [+process.argv[5], +process.argv[6]] : null;
  const STILLS = process.argv[4] === 'stills', PICK = process.argv[4] === 'pick' ? process.argv[5].split(',').map(Number) : null;
  const list = PICK ? PICK : STILLS ? BEATS.map(b => Math.round(((b.tp ?? b.t0) + Math.min(1.2, (b.t1 - (b.tp ?? b.t0)) * .6)) * FPS)) : null;
  const b = await chromium.launch(), pg = await b.newPage({ viewport: { width: W, height: H } });
  await pg.setContent(PAGE); await pg.evaluate(() => document.fonts.ready);
  const todo = RANGE ? Array.from({ length: RANGE[1] - RANGE[0] }, (_, k) => k + RANGE[0]).filter(k => k % NK === WK) : (STILLS || PICK) ? list.filter((_, k) => k % NK === WK) : Array.from({ length: N }, (_, k) => k).filter(k => k % NK === WK);
  for (const fn of todo) { const file = PICK ? `${B}/out/pick-${String(fn).padStart(5, '0')}.jpg` : STILLS ? `${B}/out/still-${String(list.indexOf(fn) + 1).padStart(2, '0')}.jpg` : `${out}/f${String(fn).padStart(5, '0')}.jpg`;
    await pg.evaluate(h => { document.getElementById('w').innerHTML = h; }, frame(fn)); await pg.screenshot({ path: file, type: 'jpeg', quality: 90 }); }
  await b.close(); if (WK === 0) console.log('frames', N, 'audio end', AUDIO_END.toFixed(2), 'beats', BEATS.map(x => x.t0.toFixed(1)).join(' '));
})();
