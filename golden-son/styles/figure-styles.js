// Five figure styles in the same table shot: 1 realistic, 2 chibi, 4 heroic silhouette, 5 comic ink, 6 mid-proportion.
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, L = require('../lighting.js'), Hh = require('../hero.js'), C2 = require('../chibi2.js');
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
const TY = 1560, MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const DEFS = MONO + `<filter id="sil" x="-10%" y="-10%" width="120%" height="120%"><feColorMatrix type="matrix" values="0.05 0 0 0 0.02  0 0.05 0 0 0.02  0 0 0.07 0 0.04  0 0 0 1 0"/></filter>
  <filter id="ink" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="6" result="d"/><feFlood flood-color="#0a0608"/><feComposite in2="d" operator="in" result="o"/>
  <feComponentTransfer in="SourceGraphic" result="p"><feFuncR type="discrete" tableValues="0.04 0.2 0.4 0.6 0.8 0.97"/><feFuncG type="discrete" tableValues="0.04 0.2 0.4 0.6 0.8 0.97"/><feFuncB type="discrete" tableValues="0.04 0.2 0.4 0.6 0.8 0.97"/></feComponentTransfer><feMerge><feMergeNode in="o"/><feMergeNode in="p"/></feMerge></filter>`;
const gob = (x, r = 0) => `<g transform="translate(${x} ${TY}) rotate(${r})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5"/></g>`;
const table = `<rect x="-300" y="${TY}" width="1680" height="800" fill="#2b4a8a"/><rect x="-300" y="${TY}" width="1680" height="20" fill="#d8e0ea"/><rect x="-300" y="${TY + 20}" width="1680" height="60" fill="#1b2f5c"/>${gob(200)}${gob(660, 80)}<path d="M670 ${TY + 2} q110 -8 200 6" stroke="#a81f1c" stroke-width="12" stroke-linecap="round" fill="none"/>`;
const room = `<g filter="url(#mono)">${L.skyOrRoom('gala', 0, { floorY: 1470 })}</g>`;
const heroPair = (o = {}, wrap = s => s) => wrap(L.rimLight(Hh.cassius(790, TY + 480, 960, { pose: 'seated', yaw: -10, arms: ['table', 'table'], ...o }), 'gala', {})) + table + L.floorShadow(370, TY + 6, 220, { mood: 'gala' }) + wrap(L.rimLight(Hh.darrow(370, TY, o.headScale ? 700 : 810, { yaw: 10, expr: 'smile', ...o }), 'gala', {}));
const P = [
  { n: '1. REALISTIC', d: 'heroic proportions, simple faces', svg: () => room + heroPair() },
  { n: '2. CHIBI', d: 'Book 1 family, big heads', svg: () => room + L.rimLight(C2.cassius(790, TY + 310, 330, { yaw: -16, arms: ['table', 'table'] }), 'gala', {}) + table + L.floorShadow(400, TY + 6, 260, { mood: 'gala' }) + L.rimLight(C2.darrow(400, TY, 340, { yaw: 14, hair: 'short' }), 'gala', {}) },
  { n: '4. HEROIC SILHOUETTE', d: 'realistic figures as dark shapes with a gold edge', svg: () => room.replace('filter="url(#mono)"', 'filter="url(#mono)" opacity=".85"') + L.glow(560, 900, 520, '#ffe2a8', .5) + heroPair({ face: 'none' }, s => `<g filter="url(#sil)">${s}</g>`) + L.rimLight(`<g opacity=".02">${Hh.darrow(370, TY, 810, {})}</g>`, 'gala', {}) },
  { n: '5. COMIC INK', d: 'realistic figures, heavy outline, posterized color', svg: () => room + heroPair({}, s => `<g filter="url(#ink)">${s}</g>`) },
  { n: '6. MID-PROPORTION', d: 'halfway: big heads on adult bodies', svg: () => room + heroPair({ headScale: 1.55 }) },
];
(async () => {
  const b = await chromium.launch();
  const css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}body{margin:0;background:#0c0c10}
    .f{position:relative;width:${W}px;height:${H}px;overflow:hidden}.f svg{position:absolute;inset:0}.cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}.l1{color:#f6ead2}.l2{color:#e8372c}
    .grid{display:grid;grid-template-columns:repeat(5,432px);gap:20px;padding:20px}.cell{width:432px;height:880px;position:relative}.cell .f{transform:scale(.4);transform-origin:0 0}
    .lab{position:absolute;left:0;top:784px;width:432px;text-align:center;font-family:Cinzel;font-weight:700;color:#f6ead2;font-size:26px}.lab small{display:block;font-family:sans-serif;font-weight:400;color:#b9b2a6;font-size:17px;margin-top:6px}`;
  const frame = s => `<div class="f"><svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${DEFS}</defs>${L.defs()}${s.svg()}${L.bokeh(3, 0, { count: 14, opacity: .4 })}${L.grade('gala', {})}</svg><div class="cap"><div class="l1">HOUSE BELLONA WANTS HIM DEAD.</div><div class="l2">SO HE CLIMBS ON THEIR TABLE.</div></div></div>`;
  const g = await b.newPage({ viewport: { width: 5 * 432 + 6 * 20, height: 920 } });
  await g.setContent(`<style>${css}</style><div class="grid">${P.map(s => `<div class="cell">${frame(s)}<div class="lab">${s.n}<small>${s.d}</small></div></div>`).join('')}</div>`);
  await g.evaluate(() => document.fonts.ready); await g.screenshot({ path: `${ROOT}/figure-styles.png` });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const s of P) { await p.setContent(`<style>${css}</style>${frame(s)}`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/styles/fig-${s.n[0]}.png` }); }
  await b.close();
})();
