// B2 exploration: 2D chibi characters in lit sets. Nine variants in three rows.
// Row 1: character treatment (same gala set). Row 2: lighting/finish. Row 3: other story locations.
// node styles/b2-explore.js -> b2-explore.png + styles/b2-<id>.png
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920;
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
const L = require('../lighting.js'), R = require('../rig.js');

const TY = 1500, DX = 380, CX = 790;
const table = (cloth = '#2b4a8a', trim = '#d8e0ea', deep = '#1b2f5c') => `<rect x="-200" y="${TY}" width="1480" height="700" fill="${cloth}"/><rect x="-200" y="${TY}" width="1480" height="18" fill="${trim}"/><rect x="-200" y="${TY + 18}" width="1480" height="56" fill="${deep}"/>`;
const goblet = (x, c, rot = 0) => `<g transform="translate(${x} ${TY}) rotate(${rot})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="${c}" stroke="#1b1210" stroke-width="5"/></g>`;
const props = (c = '#e2a93b') => goblet(150, c) + goblet(630, c, 80) + `<path d="M640 ${TY + 3} q120 -6 220 6" stroke="#a81f1c" stroke-width="10" stroke-linecap="round"/>`;

// ---- character treatments ----
// classic B2 (old costumes)
const dClassic = (x, y, s, o = {}) => R.darrow(x, y, s, { yaw: 18, mouth: 'smirk', ...o });
const cClassic = (x, y, s, o = {}) => R.cassius(x, y, s, { yaw: -24, brow: 'angry', mouth: 'frown', ...o });
// Golden Son costumes: gold lion armour + crimson sash for Darrow, silver + Bellona blue for Cassius
const sash = (x, y, s) => `<path d="M${x - s * 0.52} ${y - s * 0.62} L${x + s * 0.52} ${y - s * 0.62} L${x + s * 0.54} ${y - s * 0.5} L${x - s * 0.54} ${y - s * 0.5} Z" fill="#b3221d" stroke="#1b1210" stroke-width="${s * 0.035}"/>
  <path d="M${x - s * 0.2} ${y - s * 0.52} l${-s * 0.06} ${s * 0.36} l${s * 0.1} ${-s * 0.02} l${s * 0.04} ${-s * 0.32} Z" fill="#8f1a16" stroke="#1b1210" stroke-width="${s * 0.03}"/>`;
const pauldrons = (x, y, s, col, hi) => [-1, 1].map(d => `<ellipse cx="${x + d * s * 0.3}" cy="${y - s * 1.47}" rx="${s * 0.2}" ry="${s * 0.14}" fill="${col}" stroke="#1b1210" stroke-width="${s * 0.04}"/><ellipse cx="${x + d * s * 0.27}" cy="${y - s * 1.51}" rx="${s * 0.08}" ry="${s * 0.04}" fill="${hi}" opacity=".8"/>`).join('');
const dGS = (x, y, s, o = {}) => { const k = -(o.yaw ?? 18) * s * 0.0016;
  return R.body(x, y, s, { fill: '#d9a441', shade: '#8e6420', trim: '#f6dc8b', sigil: R.lion, boots: true, yaw: o.yaw ?? 18 }) + sash(x + k * .5, y, s) + pauldrons(x + k * .7, y, s, '#e2a93b', '#fff2b8')
    + R.head(x + (o.yaw ?? 18) * s * 0.0012, y - s * 1.55 - s * 0.42 * 0.78, s * 0.42, { hair: 'spikes', hairCol: '#e8b53a', hairHi: '#fff0b0', brow: 'angry', mouth: 'smirk', iris: '#e0a326', yaw: 18, ...o }); };
const cGS = (x, y, s, o = {}) => { const yaw = o.yaw ?? -24, k = -yaw * s * 0.0016;
  return R.body(x, y, s, { fill: '#d8e0ea', shade: '#8d9bb0', trim: '#2b4a8a', cape: '#2b4a8a', sigil: (a, b, c) => R.eagle(a, b, c, '#2b4a8a'), yaw }) + pauldrons(x + k * .7, y, s, '#e9eef5', '#ffffff')
    + R.head(x + yaw * s * 0.0012, y - s * 1.55 - s * 0.42 * 0.78, s * 0.42, { hair: 'curls', hairCol: '#d6a23c', hairHi: '#f8e09a', brow: 'angry', mouth: 'frown', iris: '#e8b53a', yaw, ...o }); };
// "chibi plus": same parts, longer body (about 2.6 heads tall)
const tall = (fn, x, y, s, o) => { const B = 1.32; return `<g>${fn === 'd' ? R.body(x, y, s * B, { fill: '#d9a441', shade: '#8e6420', trim: '#f6dc8b', sigil: R.lion, boots: true, yaw: 18 }) + sash(x, y, s * B) + pauldrons(x, y, s * B, '#e2a93b', '#fff2b8')
    : R.body(x, y, s * B, { fill: '#d8e0ea', shade: '#8d9bb0', trim: '#2b4a8a', cape: '#2b4a8a', sigil: (a, b, c) => R.eagle(a, b, c, '#2b4a8a'), yaw: -24 }) + pauldrons(x, y, s * B, '#e9eef5', '#fff')}
    ${R.head(x, y - s * B * 1.55 - s * 0.38 * 0.8, s * 0.38, fn === 'd' ? { hair: 'spikes', hairCol: '#e8b53a', hairHi: '#fff0b0', brow: 'angry', mouth: 'smirk', yaw: 18, ...o } : { hair: 'curls', hairCol: '#d6a23c', hairHi: '#f8e09a', brow: 'angry', mouth: 'frown', iris: '#e8b53a', yaw: -24, ...o })}</g>`; };

// ---- scene builder ----
const gala = (mood = 'gala', extra = {}) => L.defs() + L.skyOrRoom(mood, 0, { floorY: 1420, ...extra });
const lit = (svg, mood, o = {}) => L.rimLight(svg, mood, o);
const fgBlur = col => L.dof('near', `<path d="M-60 1920 V1180 q90 -120 180 0 V1920Z M960 1920 V1260 q90 -110 180 0 V1920Z" fill="${col}"/>`);

const OPTS = [
  // Row 1 — character treatment
  { id: 'a', name: 'A. B2 AS SHOWN', note: 'Book 1 costumes, turning heads, lit ballroom', draw: () =>
    gala() + lit(cClassic(CX, TY + 300, 330), 'gala') + table() + props() + L.floorShadow(DX, TY + 6, 300, { mood: 'gala' }) + lit(dClassic(DX, TY, 350), 'gala') + L.grade('gala', {}) },
  { id: 'b', name: 'B. GOLDEN SON COSTUMES', note: 'Darrow in gold lion armor + sash, Cassius in silver and blue', draw: () =>
    gala() + lit(cGS(CX, TY + 300, 330), 'gala') + table() + props() + L.floorShadow(DX, TY + 6, 300, { mood: 'gala' }) + lit(dGS(DX, TY, 350), 'gala') + L.grade('gala', {}) },
  { id: 'c', name: 'C. CHIBI PLUS', note: 'same characters, longer bodies (about 2.6 heads tall)', draw: () =>
    gala() + lit(tall('c', CX, TY + 360, 300, {}), 'gala') + table() + props() + L.floorShadow(DX, TY + 6, 300, { mood: 'gala' }) + lit(tall('d', DX, TY, 300, {}), 'gala') + L.grade('gala', {}) },
  // Row 2 — lighting & finish (on B)
  { id: 'd', name: 'D. CEL-SHADED + DEPTH', note: 'hard shadow side on the characters, blurred foreground', draw: () =>
    gala() + L.lit(cGS(CX, TY + 300, 330), 'gala', { depth: 60, rim: 9 }) + table() + props() + L.floorShadow(DX, TY + 6, 300, { mood: 'gala', cast: .6 }) + L.lit(dGS(DX, TY, 350), 'gala', { depth: 70, rim: 10 }) + fgBlur('#0b0a24') + L.bokeh(5, 0, { count: 14, opacity: .4 }) + L.grade('gala', {}) },
  { id: 'e', name: 'E. CANDLELIT GOLD', note: 'warm feast-hall lighting, candles on the table', draw: () =>
    gala('triumph', { turn: 0 }) + L.lit(cGS(CX, TY + 300, 330), 'triumph', { depth: 50, rim: 8 }) + table('#3a2614', '#e2a93b', '#24160a') + props('#f6dc8b') + L.candle(250, TY, 1.4, 0) + L.candle(900, TY, 1.4, 1)
      + L.floorShadow(DX, TY + 6, 300, { mood: 'triumph' }) + L.lit(dGS(DX, TY, 350), 'triumph', { depth: 60, rim: 8 }) + L.grade('triumph', {}) },
  { id: 'f', name: 'F. CLOSE-UP FRAMING', note: 'camera pushed in: faces big, set soft behind', draw: () =>
    gala() + `<g transform="translate(540 1060) scale(1.9) translate(-560 -1080)">${L.lit(cGS(CX + 40, TY + 300, 330), 'gala', { depth: 60, rim: 9 })}${table()}${L.lit(dGS(DX + 40, TY, 350), 'gala', { depth: 70, rim: 10 })}</g>` + L.bokeh(9, 0, { count: 18, opacity: .45 }) + L.grade('gala', {}) },
  // Row 3 — other story locations (treatment D)
  { id: 'g', name: 'G. THE ACADEMY', note: 'Darrow on his bridge, watching his fleet burn', draw: () =>
    L.defs() + L.skyOrRoom('space', 0, { deck: true, floorY: 1440 }) + L.glow(740, 760, 260, '#ffb04a', .8) + L.glow(740, 760, 90, '#fff3c4', .9) + L.glow(880, 1010, 140, '#ffb04a', .6)
      + L.floorShadow(420, 1640, 320, { mood: 'space', cast: .5 }) + L.lit(dGS(420, 1640, 420, { mouth: 'frown', brow: 'sad', yaw: 22 }), 'space', { depth: 60, rim: 10 }) + L.grade('space', {}) },
  { id: 'h', name: 'H. THE IRON RAIN', note: 'an army falling from orbit onto Mars', draw: () => { let rain = '';
      for (let i = 0; i < 38; i++) { const x = ((i * 211) % 1500) - 150, y = ((i * 337) % 1500) - 100, far = i % 3, len = far ? 120 : 230, wd = far ? 5 : 10;
        rain += `<g opacity="${far ? .5 : .9}"><line x1="${x + len * .17}" y1="${y - len}" x2="${x}" y2="${y}" stroke="#ffcf7a" stroke-width="${wd}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${wd * 1.1}" fill="#fff"/></g>`; }
      return L.defs() + L.skyOrRoom('mars', 0, { floorY: 1380, sunX: 300, sunH: 420 }) + L.screen(rain) + L.floorShadow(700, 1640, 320, { mood: 'mars', cast: .7 }) + L.lit(dGS(700, 1640, 420, { yaw: -20, mouth: 'flat' }), 'mars', { depth: 60, rim: 10 }) + L.dust(7, 0, { count: 40, color: '#ffb070', opacity: .5 }) + L.grade('mars', {}); } },
  { id: 'i', name: 'I. THE TRIUMPH', note: 'the gold feast turns red; the box arrives', draw: () =>
    L.defs() + L.skyOrRoom('triumph', 0, { turn: 1, floorY: 1420 }) + L.lit(dGS(540, TY + 40, 380, { yaw: 0, brow: 'sad', mouth: 'frown' }), 'triumph', { turn: 1, depth: 60, rim: 9 }) + table('#3a0d10', '#7a1c1c', '#24080a')
      + `<g transform="translate(540 ${TY + 10})"><rect x="-150" y="-110" width="300" height="130" rx="10" fill="#3a1c12" stroke="#1b0e08" stroke-width="6"/><rect x="-160" y="-140" width="320" height="42" rx="10" fill="#5a2c18" stroke="#1b0e08" stroke-width="6"/><rect x="-22" y="-112" width="44" height="50" rx="6" fill="#e2a93b" stroke="#1b0e08" stroke-width="5"/></g>`
      + L.candle(220, TY, 1.3, 0) + L.candle(860, TY, 1.3, 1) + L.grade('triumph', { turn: 1 }) },
];
const CAPS = { g: ['THE ACADEMY.', 'KARNUS AU BELLONA WINS.'], h: ['AN ARMY FROM ORBIT.', 'THE IRON RAIN.', '#ffe08a'], i: ['THEN COMES A BOX.', "INSIDE... FITCHNER'S HEAD.", '#ffe08a'] };
const ROWS = ['CHARACTER TREATMENT (SAME SET)', 'LIGHTING AND FINISH (ON B)', 'OTHER STORY LOCATIONS (STYLE D)'];
const frame = s => { const c = CAPS[s.id] || ['HOUSE BELLONA WANTS HIM DEAD.', 'SO HE CLIMBS ON THEIR TABLE.'];
  return `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s.draw()}</svg><div class="cap"><div class="l1">${c[0]}</div><div class="l2" style="color:${c[2] || '#e8372c'}">${c[1]}</div></div>`; };
module.exports = { L, R, W, H, TY, DX, CX, font, table, goblet, props, sash, pauldrons, dGS, cGS, dClassic, cClassic, tall, fgBlur };
if (require.main === module) (async () => {
  const b = await chromium.launch(), css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
    body{margin:0;background:#0c0c10}.f{position:relative;width:${W}px;height:${H}px;overflow:hidden}.f svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.55)}.l1{color:#f6ead2}
    .row{font-family:Cinzel;font-weight:700;color:#e2a93b;font-size:34px;padding:26px 24px 0;letter-spacing:2px}
    .grid{display:grid;grid-template-columns:repeat(3,540px);gap:24px;padding:14px 24px 6px}.cell .f{transform:scale(.5);transform-origin:0 0}.cell{width:540px;height:1050px;position:relative}
    .lab{position:absolute;left:0;top:968px;width:540px;font-family:Cinzel;font-weight:700;color:#f6ead2;font-size:30px;text-align:center}.lab small{display:block;font-family:sans-serif;font-weight:400;font-size:19px;color:#b9b2a6;margin-top:6px}`;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (const s of OPTS) { await p.setContent(`<style>${css}</style><div class="f">${frame(s)}</div>`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/styles/b2-${s.id}.png` }); }
  const g = await b.newPage({ viewport: { width: 540 * 3 + 24 * 4, height: 3 * (1050 + 100) + 30 } });
  await g.setContent(`<style>${css}</style>${ROWS.map((r, k) => `<div class="row">${r}</div><div class="grid">${OPTS.slice(k * 3, k * 3 + 3).map(s => `<div class="cell"><div class="f">${frame(s)}</div><div class="lab">${s.name}<small>${s.note}</small></div></div>`).join('')}</div>`).join('')}`);
  await g.evaluate(() => document.fonts.ready); await g.screenshot({ path: `${ROOT}/b2-explore.png`, fullPage: true });
  await b.close();
})();
