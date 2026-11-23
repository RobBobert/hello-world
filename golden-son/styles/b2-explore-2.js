// B2 exploration, round 2: nine more takes on "2D chibi characters in lit sets".
// node styles/b2-explore-2.js -> b2-explore-2.png + styles/b2-<id>.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const X = require('./b2-explore.js'), { L, R, W, H, font, table, props, sash, pauldrons } = X;
const B1 = require('../../animatic/book1/chars.js');
const TY = 1560, DX = 370, CX = 800; // lower table so heads stay under the caption band

// Darrow with SHORT swept hair (closer to the Golden Son reference) in gold lion armour
const dShort = (x, y, s, o = {}) => { const yaw = o.yaw ?? 18, k = -yaw * s * 0.0016;
  return R.body(x, y, s, { fill: '#d9a441', shade: '#8e6420', trim: '#f6dc8b', sigil: R.lion, boots: true, yaw }) + sash(x + k * .5, y, s) + pauldrons(x + k * .7, y, s, '#e2a93b', '#fff2b8')
    + R.head(x + yaw * s * 0.0012, y - s * 1.55 - s * 0.42 * 0.78, s * 0.42, { hair: 'short', hairCol: '#e8b53a', hairHi: '#fff0b0', brow: 'angry', mouth: 'smirk', iris: '#e0a326', ...o, yaw }); };
const cS = (x, y, s, o = {}) => X.cGS(x, y, s, o);
const scene = (mood, chars, extra = {}) => L.defs() + L.skyOrRoom(mood, 0, { floorY: 1460, ...extra }) + chars + L.grade(mood, extra.grade || {});
const std = (mood = 'gala', o = {}) => L.lit(cS(CX, TY + 300, 320, o.c), mood, { depth: 55, rim: 9, ...o.lit }) + table(o.cloth, o.trim, o.deep) + props(o.gob)
  + L.floorShadow(DX, TY + 6, 290, { mood }) + L.lit((o.d || dShort)(DX, TY, 330, o.dOpts), mood, { depth: 65, rim: 10, ...o.lit });
const filt = (id, m) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="${m}"/></filter>`;

const OPTS = [
  { id: 'j', name: 'J. BOOK 1 MATCH', note: 'the exact Book 1 characters (wolf hood, curls) lit in the new sets', draw: () =>
    scene('gala', L.lit(B1.cassius(CX, TY + 330, 280, { brow: 'angry' }), 'gala', { depth: 50, rim: 9 }) + table() + props() + L.floorShadow(DX, TY + 6, 280, { mood: 'gala' }) + L.lit(B1.darrowGold(DX, TY, 300, { blade: true }), 'gala', { depth: 60, rim: 10 })) },
  { id: 'k', name: 'K. SHORT-HAIR DARROW', note: 'Golden Son look: short swept hair, gold lion armor, sash', draw: () => scene('gala', std('gala')) },
  { id: 'l', name: 'L. FLAT CLEAN SET', note: 'simple flat-color room, no gradients: crisp, poster-clean', draw: () => {
    const win = x => `<path d="M${x} 1460 V640 q110 -170 220 0 V1460Z" fill="#7d9bff"/><path d="M${x + 110} 520 V1460 M${x} 1000 h220" stroke="#2a2f6e" stroke-width="16"/>`;
    return `<rect width="${W}" height="${H}" fill="#2a2f6e"/>${win(60)}${win(430)}${win(800)}<rect x="0" y="1360" width="${W}" height="600" fill="#1d2152"/>
      <path d="M200 0 v150 h40 v-150 M840 0 v150 h40 v-150" stroke="#e2a93b" stroke-width="10"/><circle cx="220" cy="190" r="50" fill="#ffd27a"/><circle cx="860" cy="190" r="50" fill="#ffd27a"/>` + std('gala'); } },
  { id: 'm', name: 'M. MOONLIT', note: 'cool night palette, silver rim light, quiet and tense', draw: () =>
    `<defs>${filt('moon', '0.55 0.05 0.1 0 0  0.05 0.62 0.15 0 0  0.1 0.15 0.95 0 0.04  0 0 0 1 0')}</defs><g filter="url(#moon)">${scene('gala', std('gala'))}</g>` + L.glow(840, 700, 260, '#cfe0ff', .35) },
  { id: 'n', name: 'N. GOLDEN HOUR', note: 'warm sunset pouring through the windows, long shadows', draw: () =>
    `<defs>${filt('gold', '1.1 0.1 0 0 0.04  0.05 0.9 0 0 0.02  0 0 0.65 0 0  0 0 0 1 0')}</defs><g filter="url(#gold)">${scene('gala', std('gala', { lit: {} }))}</g>` + L.lightShafts(980, 420, 145, 0, { count: 5, spread: 30, length: 1600, width: 160, color: '#ffc46a', opacity: .25 }) },
  { id: 'o', name: 'O. MONO + GOLD', note: 'the room drained of color: only gold, red and blue stay', draw: () =>
    `<defs>${filt('mono', '0.33 0.33 0.33 0 -0.02  0.33 0.33 0.33 0 -0.02  0.33 0.33 0.36 0 0  0 0 0 1 0')}</defs><g filter="url(#mono)">${L.defs()}${L.skyOrRoom('gala', 0, { floorY: 1460 })}</g>` + std('gala') + L.grade('void', {}) },
  { id: 'p', name: 'P. BACKLIT GLOW', note: 'characters in shadow, strong glowing edge from behind', draw: () =>
    `<defs>${filt('dim', '0.45 0 0 0 0  0 0.42 0 0 0  0 0 0.55 0 0.02  0 0 0 1 0')}</defs>` + L.defs() + L.skyOrRoom('gala', 0, { floorY: 1460 }) + L.glow(560, 900, 520, '#ffe2a8', .6)
      + `<g filter="url(#dim)">${std('gala', { lit: { rim: 18 } })}</g>` + L.rimLight(`<g opacity=".01">${cS(CX, TY + 300, 320)}</g>`, 'gala', {}) + L.bokeh(4, 0, { count: 20, opacity: .5 }) + L.grade('gala', {}) },
  { id: 'q', name: 'Q. STORYBOOK TEXTURE', note: 'soft pastel grade and paper grain, like an illustrated book', draw: () =>
    `<defs>${filt('soft', '0.8 0.1 0.05 0 0.08  0.08 0.8 0.08 0 0.08  0.05 0.1 0.75 0 0.1  0 0 0 1 0')}<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .45  0 0 0 0 .35  0 0 0 .22 0"/></filter></defs>
      <g filter="url(#soft)">${scene('gala', std('gala'))}</g><rect width="${W}" height="${H}" filter="url(#paper)"/>` },
  { id: 'r', name: 'R. LOW-ANGLE HERO', note: 'camera low: Darrow towers over the table, Cassius looks up', draw: () =>
    L.defs() + L.skyOrRoom('gala', 0, { floorY: 1300 }) + `<rect x="-20" y="1500" width="1120" height="500" fill="#2b4a8a"/><rect x="-20" y="1500" width="1120" height="22" fill="#d8e0ea"/>`
      + L.lit(dShort(470, 1520, 470, { yaw: 10 }), 'gala', { depth: 70, rim: 12 }) + X.goblet(150, '#e2a93b') + L.dof('near', L.lit(cS(890, 2330, 520, { yaw: -40, pitch: 14 }), 'gala', { depth: 50, rim: 10 })) + L.grade('gala', {}) },
];
const ROWS = ['CHARACTER AND SET', 'COLOR AND LIGHT', 'TEXTURE AND CAMERA'];
const frame = s => `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s.draw()}</svg><div class="cap"><div class="l1">HOUSE BELLONA WANTS HIM DEAD.</div><div class="l2">SO HE CLIMBS ON THEIR TABLE.</div></div>`;
(async () => {
  const b = await chromium.launch(), css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
    body{margin:0;background:#0c0c10}.f{position:relative;width:${W}px;height:${H}px;overflow:hidden}.f svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.55)}.l1{color:#f6ead2}.l2{color:#e8372c}
    .row{font-family:Cinzel;font-weight:700;color:#e2a93b;font-size:34px;padding:26px 24px 0;letter-spacing:2px}
    .grid{display:grid;grid-template-columns:repeat(3,540px);gap:24px;padding:14px 24px 6px}.cell .f{transform:scale(.5);transform-origin:0 0}.cell{width:540px;height:1050px;position:relative}
    .lab{position:absolute;left:0;top:968px;width:540px;font-family:Cinzel;font-weight:700;color:#f6ead2;font-size:30px;text-align:center}.lab small{display:block;font-family:sans-serif;font-weight:400;font-size:19px;color:#b9b2a6;margin-top:6px}`;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const s of OPTS) { await p.setContent(`<style>${css}</style><div class="f">${frame(s)}</div>`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/styles/b2-${s.id}.png` }); }
  const g = await b.newPage({ viewport: { width: 540 * 3 + 24 * 4, height: 3 * (1050 + 100) + 30 } });
  await g.setContent(`<style>${css}</style>${ROWS.map((r, k) => `<div class="row">${r}</div><div class="grid">${OPTS.slice(k * 3, k * 3 + 3).map(s => `<div class="cell"><div class="f">${frame(s)}</div><div class="lab">${s.name}<small>${s.note}</small></div></div>`).join('')}</div>`).join('')}`);
  await g.evaluate(() => document.fonts.ready); await g.screenshot({ path: `${ROOT}/b2-explore-2.png`, fullPage: true });
  await b.close();
})();
