// Nine style options, same moment (Darrow on the Bellona table, Cassius seated):
// A1-A3 = detailed armour models in lit sets, B1-B3 = Book 1 chibi family, C1-C3 = graphic picks.
// node styles/style-options-9.js -> style-options-9.png + styles/opt-<n>.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const { STYLES, W, H, font } = require('./style-options.js');
const L = require('../lighting.js'), { darrow } = require('../models/darrow.js'), { cassius } = require('../models/cassius.js');
const B1 = require('../../animatic/book1/chars.js'), RIG = require('../rig.js');

const TY = 1500, DX = 380, CX = 800;
const table = (cloth, trim, deep) => `<rect x="-20" y="${TY}" width="1120" height="700" fill="${cloth}"/><rect x="-20" y="${TY}" width="1120" height="18" fill="${trim}"/><rect x="-20" y="${TY + 18}" width="1120" height="56" fill="${deep}"/>`;
const goblet = (x, c, rot = 0) => `<g transform="translate(${x} ${TY}) rotate(${rot})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="${c}" stroke="#1b1210" stroke-width="4"/></g>`;
const props = c => goblet(150, c) + goblet(640, c, 80) + `<path d="M650 ${TY + 3} q120 -6 220 6" stroke="#a81f1c" stroke-width="10" stroke-linecap="round"/>`;
const detailed = () => cassius(CX, TY, 900, { pose: 'seated', yaw: -16, expr: 'angry', look: -0.4 }) ;
const detailedD = () => darrow(DX, TY, 830, { yaw: 14, expr: 'smile' });

const OPTS = [
  // ---------- A: detailed armour models ----------
  { name: 'A1. PAINTED ARMOR', note: 'what the test shots used: shaded gold armor, lit ballroom', draw: () =>
    L.defs() + L.skyOrRoom('gala', 0, { floorY: 1420 }) + L.rimLight(detailed(), 'gala', {}) + table('#2b4a8a', '#d8e0ea', '#1b2f5c') + props('#e2a93b') + L.rimLight(detailedD(), 'gala', {}) + L.grade('gala', {}) },
  { name: 'A2. COMIC INK', note: 'same models with a heavy black outline and punchier flat color', draw: () =>
    `<defs><filter id="ink" x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="dilate" radius="7" result="d"/><feFlood flood-color="#0a0608"/><feComposite in2="d" operator="in" result="o"/>
      <feComponentTransfer in="SourceGraphic" result="p"><feFuncR type="discrete" tableValues="0.05 0.3 0.55 0.8 1"/><feFuncG type="discrete" tableValues="0.05 0.3 0.55 0.8 1"/><feFuncB type="discrete" tableValues="0.05 0.3 0.55 0.8 1"/></feComponentTransfer>
      <feMerge><feMergeNode in="o"/><feMergeNode in="p"/></feMerge></filter>
      <pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse"><circle cx="9" cy="9" r="3.2" fill="#000" opacity=".22"/></pattern></defs>
      <rect width="${W}" height="${H}" fill="#f0b63c"/>${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<path d="M${DX} 900 L${DX + Math.cos(a) * 2000} ${900 + Math.sin(a) * 2000} L${DX + Math.cos(a + .1) * 2000} ${900 + Math.sin(a + .1) * 2000}Z" fill="#e8372c"/>`; }).join('')}
      <rect width="${W}" height="${H}" fill="url(#dots)"/><g filter="url(#ink)">${detailed()}</g>${table('#1f3f8f', '#ffffff', '#0e1f4f')}<rect x="-20" y="${TY}" width="1120" height="8" fill="#0a0608"/>${props('#ffd24a')}<g filter="url(#ink)">${detailedD()}</g>` },
  { name: 'A3. DARK CINEMATIC', note: 'same models in deep shadow, lit only from the windows behind', draw: () =>
    `${L.defs()}<defs><filter id="dk"><feColorMatrix type="matrix" values="0.30 0.05 0.05 0 0.01  0.04 0.26 0.06 0 0.01  0.06 0.08 0.40 0 0.05  0 0 0 1 0"/></filter></defs>
      ${L.skyOrRoom('void', 0, { floorY: 1420 })}${L.lightShafts(900, 300, 115, 0, { count: 5, spread: 40, length: 1700, width: 150, color: '#8fb4ff', opacity: .22 })}${L.glow(820, 620, 380, '#9fc0ff', .35)}
      <g filter="url(#dk)">${detailed()}</g>${L.rimLight(`<g opacity="0">${detailed()}</g>`, 'void', {})}
      ${table('#0d1730', '#5f7fc0', '#070c1c')}<g opacity=".75">${props('#31406a')}</g>
      <g filter="url(#dk)">${detailedD()}</g>${L.glow(DX + 40, 760, 150, '#ffd98a', .22)}${L.grade('void', {})}` },
  // ---------- B: Book 1 chibi family ----------
  { name: 'B1. BOOK 1 CLASSIC', note: 'exactly the Book 1 look: flat chibi characters, simple backdrop', draw: () =>
    `<defs><radialGradient id="b1" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#3a2a22"/><stop offset=".7" stop-color="#1a1210"/><stop offset="1" stop-color="#0c0807"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#b1)"/>
      ${B1.cassius(CX, TY + 330, 290, { brow: 'angry' })}${table('#2b4a8a', '#dfe6ee', '#1f3b68')}${props('#e2a93b')}${B1.darrowGold(DX, TY, 320, { blade: true })}` },
  { name: 'B2. CHIBI IN A LIT SET', note: 'chibi characters with turning heads, placed in the rich lit ballroom', draw: () =>
    L.defs() + L.skyOrRoom('gala', 0, { floorY: 1420 }) + L.rimLight(RIG.cassius(CX, TY + 300, 330, { yaw: -24, brow: 'angry', mouth: 'frown' }), 'gala', {}) + table('#2b4a8a', '#d8e0ea', '#1b2f5c') + props('#e2a93b')
      + L.floorShadow(DX, TY + 6, 300, { mood: 'gala' }) + L.rimLight(RIG.darrow(DX, TY, 350, { yaw: 18, mouth: 'smirk' }), 'gala', {}) + L.grade('gala', {}) },
  { name: 'B3. STICKER CHIBI', note: 'Book 1 characters as bold stickers: white outline, drop shadow, color blocks', draw: () =>
    `<defs><filter id="stk" x="-15%" y="-15%" width="130%" height="130%"><feMorphology in="SourceAlpha" operator="dilate" radius="12" result="d"/><feFlood flood-color="#fff"/><feComposite in2="d" operator="in" result="o"/><feDropShadow in="o" dx="10" dy="16" stdDeviation="0" flood-color="#000" flood-opacity=".4" result="s"/><feMerge><feMergeNode in="s"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="${W}" height="${H}" fill="#8f1d16"/><path d="M620 0 L1080 0 L1080 ${H} L360 ${H} Z" fill="#2b4a8a"/>
      <g filter="url(#stk)">${B1.cassius(CX, TY + 330, 290, { brow: 'angry' })}</g>${table('#f6ead2', '#1b1210', '#e2d3b0')}<g filter="url(#stk)">${props('#e2a93b')}</g><g filter="url(#stk)">${B1.darrowGold(DX, TY, 320, { blade: true })}</g>` },
  // ---------- C: graphic picks ----------
  { name: 'C1. GILDED SILHOUETTE', note: 'black figures, gold and steel edge-light, glowing eyes', draw: STYLES[0].draw },
  { name: 'C2. ROMAN FRESCO', note: 'black-figure pottery: terracotta, ink figures, gold detail', draw: STYLES[3].draw },
  { name: 'C3. WAR-ROOM POSTER', note: 'bold flat shapes, faceless, propaganda-poster colors', draw: STYLES[5].draw },
];
const ROWS = ['LIKE YOUR FIRST IMAGE (DETAILED ARMOR)', 'LIKE BOOK 1 (CHIBI)', 'MY PICKS (GRAPHIC)'];
const frame = s => `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s.draw()}</svg>
  <div class="cap"><div class="l1">HOUSE BELLONA WANTS HIM DEAD.</div><div class="l2">SO HE CLIMBS ON THEIR TABLE.</div></div>`;
(async () => {
  const b = await chromium.launch(), css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
    body{margin:0;background:#0c0c10}.f{position:relative;width:${W}px;height:${H}px;overflow:hidden}.f svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.55)}.l1{color:#f6ead2}.l2{color:#e8372c}
    .row{font-family:Cinzel;font-weight:700;color:#e2a93b;font-size:34px;padding:26px 24px 0;letter-spacing:2px}
    .grid{display:grid;grid-template-columns:repeat(3,540px);gap:24px;padding:14px 24px 6px}.cell .f{transform:scale(.5);transform-origin:0 0}.cell{width:540px;height:1050px;position:relative}
    .lab{position:absolute;left:0;top:968px;width:540px;font-family:Cinzel;font-weight:700;color:#f6ead2;font-size:30px;text-align:center}.lab small{display:block;font-family:sans-serif;font-weight:400;font-size:19px;color:#b9b2a6;margin-top:6px}`;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < OPTS.length; i++) { await p.setContent(`<style>${css}</style><div class="f">${frame(OPTS[i])}</div>`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/styles/opt-${OPTS[i].name.slice(0, 2)}.png` }); }
  const g = await b.newPage({ viewport: { width: 540 * 3 + 24 * 4, height: 3 * (1050 + 100) + 30 } });
  await g.setContent(`<style>${css}</style>${ROWS.map((r, k) => `<div class="row">${r}</div><div class="grid">${OPTS.slice(k * 3, k * 3 + 3).map(s => `<div class="cell"><div class="f">${frame(s)}</div><div class="lab">${s.name}<small>${s.note}</small></div></div>`).join('')}</div>`).join('')}`);
  await g.evaluate(() => document.fonts.ready); await g.screenshot({ path: `${ROOT}/style-options-9.png`, fullPage: true });
  await b.close();
})();
