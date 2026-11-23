// Realistic-figure prototype in the table scene (same set/grade as b2-table) -> out/hero-table-*.png + hero-proto.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, L = require('../lighting.js'), Hh = require('../hero.js');
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
const TY = 1560, MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const table = `<rect x="-300" y="${TY}" width="1680" height="800" fill="#2b4a8a"/><rect x="-300" y="${TY}" width="1680" height="20" fill="#d8e0ea"/><rect x="-300" y="${TY + 20}" width="1680" height="60" fill="#1b2f5c"/>`
  + `<g transform="translate(230 ${TY})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5"/></g><g transform="translate(660 ${TY}) rotate(80)"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5"/></g><path d="M670 ${TY + 2} q110 -8 200 6" stroke="#a81f1c" stroke-width="12" stroke-linecap="round" fill="none"/>`;
const room = `<g filter="url(#mono)">${L.skyOrRoom('gala', 0, { floorY: 1470 })}</g>`;
const SH = {
  wide: { cap: ['HOUSE BELLONA WANTS HIM DEAD.', 'SO HE CLIMBS ON THEIR TABLE.'], svg: () => room + L.rimLight(Hh.cassius(800, TY + 480, 960, { pose: 'seated', yaw: -10, arms: ['table', 'table'] }), 'gala', {}) + table + L.floorShadow(380, TY + 6, 220, { mood: 'gala' }) + L.rimLight(Hh.darrow(380, TY, 810, { yaw: 10, expr: 'smile' }), 'gala', {}) },
  darrow: { cap: ['DARROW.', 'SMILING.'], svg: () => `<g transform="translate(540 960) scale(1.9) translate(-400 -690)">${room}${L.rimLight(Hh.darrow(380, TY, 1000, { yaw: 10, expr: 'smile' }), 'gala', {})}</g>` },
  cassius: { cap: ['CASSIUS AU BELLONA.', "JULIAN'S BROTHER."], svg: () => `<g transform="translate(540 1000) scale(1.6) translate(-800 -1250)">${room}${L.rimLight(Hh.cassius(800, TY + 520, 1040, { pose: 'seated', yaw: -8, expr: 'angry', arms: ['table', 'table'] }), 'gala', {})}${table}</g>` },
};
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  const css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}body{margin:0}svg{position:absolute;inset:0}.cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}.l1{color:#f6ead2}.l2{color:#e8372c}`;
  for (const [k, s] of Object.entries(SH)) { await p.setContent(`<style>${css}</style><svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${s.svg()}${L.bokeh(3, 0, { count: 14, opacity: .4 })}${L.grade('gala', {})}</svg><div class="cap"><div class="l1">${s.cap[0]}</div><div class="l2">${s.cap[1]}</div></div>`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/out/hero-table-${k}.png` }); }
  await b.close();
})();
