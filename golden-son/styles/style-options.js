// Style options sheet: the same moment (Darrow on the Bellona table, Cassius seated) in six code-drawn styles.
// node styles/style-options.js  -> style-options.png (grid) + styles/style-<n>.png (full frames)
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920;
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;

// ---------- poseable figure skeleton (unit height; y up is negative) ----------
const STAND = { head: [0.02, -0.905], neck: [0, -0.8], sL: [-0.115, -0.775], sR: [0.115, -0.775], eL: [-0.17, -0.6], eR: [0.18, -0.6], hL: [-0.14, -0.45], hR: [0.2, -0.44],
  hip: [0, -0.47], pL: [-0.06, -0.46], pR: [0.06, -0.46], kL: [-0.1, -0.24], kR: [0.12, -0.25], fL: [-0.13, 0], fR: [0.16, 0] };
const SEAT = { head: [-0.02, -0.905], neck: [0, -0.8], sL: [-0.115, -0.775], sR: [0.115, -0.775], eL: [-0.19, -0.62], eR: [0.17, -0.6], hL: [-0.1, -0.52], hR: [0.06, -0.52],
  hip: [0, -0.47], pL: [-0.06, -0.46], pR: [0.06, -0.46], kL: [-0.06, -0.44], kR: [0.06, -0.44], fL: [-0.06, -0.44], fR: [0.06, -0.44] };
const J = (pose, x, y, h) => Object.fromEntries(Object.entries(pose).map(([k, [a, b]]) => [k, [x + a * h, y + b * h]]));
const ln = (a, b, w, c, cap = 'round') => `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${c}" stroke-width="${w}" stroke-linecap="${cap}"/>`;
const poly = (pts, c, extra = '') => `<path d="M${pts.map(p => p.join(' ')).join(' L')} Z" fill="${c}" ${extra}/>`;
// body(j, h, o): o = { w: limb width (fraction of h), col, torso: bool (filled chest), headR }
function body(j, h, o) {
  const w = o.w * h, c = o.col, hr = (o.headR || 0.07) * h; let s = '';
  if (o.torso) s += poly([j.sL, j.sR, [j.pR[0] + w * .2, j.pR[1]], [j.pL[0] - w * .2, j.pL[1]]], c, `stroke="${c}" stroke-width="${w * 0.9}" stroke-linejoin="round"`);
  else s += ln(j.neck, j.hip, w, c) + ln(j.sL, j.sR, w, c) + ln(j.pL, j.pR, w, c);
  s += ln(j.sL, j.eL, w, c) + ln(j.eL, j.hL, w * .9, c) + ln(j.sR, j.eR, w, c) + ln(j.eR, j.hR, w * .9, c);
  s += ln(j.pL, j.kL, w * 1.1, c) + ln(j.kL, j.fL, w, c) + ln(j.pR, j.kR, w * 1.1, c) + ln(j.kR, j.fR, w, c);
  if (!o.noFeet && j.fL[1] > j.kL[1] + 1) s += ln(j.fL, [j.fL[0] - w * 1.2, j.fL[1]], w, c) + ln(j.fR, [j.fR[0] + w * 1.2, j.fR[1]], w, c);
  s += ln(j.neck, [j.head[0], j.head[1] + hr * .6], w * .8, c) + `<circle cx="${j.head[0]}" cy="${j.head[1]}" r="${hr}" fill="${c}"/>`;
  return s;
}
const blade = (j, h, c, w = 0.012) => { const [x, y] = j.hR; return `<path d="M${x} ${y} q${h * 0.1} ${h * 0.12} ${h * 0.06} ${h * 0.32} q${-h * 0.1} ${-h * 0.14} ${-h * 0.085} ${-h * 0.31}Z" fill="${c}" stroke="${c}" stroke-width="${w * h}" stroke-linejoin="round"/>`; };
const curls = (j, h, c, r = 0.07) => Array.from({ length: 11 }, (_, i) => { const a = Math.PI * (1.05 + i / 10 * 0.9 * -1 - 0.05) ; const ang = Math.PI + (i / 10) * Math.PI; return `<circle cx="${j.head[0] + Math.cos(ang) * r * h * 1.05}" cy="${j.head[1] + Math.sin(ang) * r * h * 0.95 - r * h * .1}" r="${r * h * 0.5}" fill="${c}"/>`; }).join('') + `<circle cx="${j.head[0]}" cy="${j.head[1] - r * h * .75}" r="${r * h * .6}" fill="${c}"/>`;
const spikes = (j, h, c, r = 0.07) => `<path d="M${j.head[0] - r * h} ${j.head[1] - r * h * .2} l${r * h * .2} ${-r * h * 1.1} l${r * h * .35} ${r * h * .5} l${r * h * .3} ${-r * h * .9} l${r * h * .4} ${r * h * .7} l${r * h * .45} ${-r * h * .6} l${r * h * .3} ${r * h * 1.2}Z" fill="${c}"/>`;
const cape = (j, h, c, dir = -1) => poly([j.sL, j.sR, [j.sR[0] + dir * h * 0.02, j.hip[1] + h * 0.3], [j.sL[0] + dir * h * 0.2, j.hip[1] + h * 0.36]], c);
const pads = (j, h, c, r = 0.05) => `<circle cx="${j.sL[0]}" cy="${j.sL[1]}" r="${r * h}" fill="${c}"/><circle cx="${j.sR[0]}" cy="${j.sR[1]}" r="${r * h}" fill="${c}"/>`;
const sash = (j, h, c, w = 0.03) => ln([j.pL[0] - h * .03, j.pL[1] - h * .03], [j.pR[0] + h * .03, j.pR[1] - h * .03], w * h, c, 'butt') + ln([j.pL[0], j.pL[1]], [j.pL[0] - h * 0.02, j.pL[1] + h * 0.17], w * h * .8, c, 'butt');
const eyes = (j, h, c, r = 0.07, dx = 0.3) => `<circle cx="${j.head[0] - r * h * .1}" cy="${j.head[1]}" r="${r * h * .13}" fill="${c}"/><circle cx="${j.head[0] + r * h * .5}" cy="${j.head[1]}" r="${r * h * .13}" fill="${c}"/>`;
const windows = (c, glow, n = 3, y0 = 560, y1 = 1420) => Array.from({ length: n }, (_, i) => { const x = 120 + i * (840 / (n - 1)) - 90; return `<path d="M${x} ${y1} V${y0 + 120} q90 -150 180 0 V${y1}Z" fill="${glow}" stroke="${c}" stroke-width="10"/><path d="M${x + 90} ${y0 + 40} V${y1} M${x} ${y0 + 400} h180" stroke="${c}" stroke-width="8"/>`; }).join('');
const goblet = (x, y, c, s = 1, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="${c}"/></g>`;

const TY = 1500, DX = 380, CX = 830; // table top y, Darrow x, Cassius x
const DH = 820, CH = 800;

const STYLES = [
  { name: '1. GILDED SILHOUETTE', note: 'black figures, gold and steel edge-light, glowing eyes', bg: '#070a18', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const fig = (j, h, rim, extra) => `<g transform="translate(7 -6)">${body(j, h, { w: 0.062, col: rim, torso: true })}${extra(rim)}</g>${body(j, h, { w: 0.062, col: '#05060c', torso: true })}${extra('#05060c')}`;
    return `<defs><radialGradient id="s1" cx="50%" cy="38%" r="70%"><stop offset="0" stop-color="#3b4fa8"/><stop offset=".55" stop-color="#141c4a"/><stop offset="1" stop-color="#05060f"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#s1)"/>${windows('#05060c', '#7f9cff33')}<circle cx="800" cy="790" r="130" fill="#dfe8ff" opacity=".9"/><circle cx="745" cy="762" r="130" fill="#3b4fa8" opacity=".55"/>
      ${fig(c, CH, '#9fc0ff', col => curls(c, CH, col) + cape(c, CH, col, 1))}${eyes(c, CH, '#9fc0ff')}
      <rect x="-20" y="${TY}" width="1120" height="700" fill="#05060c"/><rect x="-20" y="${TY}" width="1120" height="10" fill="#9fc0ff" opacity=".7"/>
      ${goblet(180, TY, '#05060c')}${goblet(640, TY - 4, '#05060c', 1, 80)}<path d="M650 ${TY + 2} q120 -6 220 6" stroke="#c8312b" stroke-width="10" stroke-linecap="round"/>
      ${fig(d, DH, '#f0b63c', col => spikes(d, DH, col) + pads(d, DH, col) + blade(d, DH, col === '#05060c' ? '#dfe6ee' : col))}${eyes(d, DH, '#f0b63c')}${sash(d, DH, '#c8312b')}`; } },
  { name: '2. REALISTIC STICK FIGURE', note: 'thin dark figures with armor pieces, moody lit room', bg: '#1c1430', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const fig = (j, h, rim) => `<g transform="translate(5 -4)">${body(j, h, { w: 0.026, col: rim, headR: 0.075 })}</g>${body(j, h, { w: 0.026, col: '#121018', headR: 0.075 })}`;
    return `<defs><linearGradient id="s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1f4a"/><stop offset=".6" stop-color="#5a3a5e"/><stop offset="1" stop-color="#c8763a"/></linearGradient>
      <radialGradient id="s2l" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd58a" stop-opacity=".75"/><stop offset="1" stop-color="#ffd58a" stop-opacity="0"/></radialGradient></defs>
      <rect width="${W}" height="${H}" fill="url(#s2)"/>${windows('#1a1230', '#ffd9a055')}<ellipse cx="380" cy="960" rx="520" ry="520" fill="url(#s2l)"/>
      ${cape(c, CH, '#2b4a8a', 1)}${fig(c, CH, '#cfe0ff')}${curls(c, CH, '#d6a23c')}${pads(c, CH, '#d8e0ea', 0.04)}
      <rect x="-20" y="${TY}" width="1120" height="700" fill="#2b4a8a"/><rect x="-20" y="${TY}" width="1120" height="16" fill="#d8e0ea"/><rect x="-20" y="${TY + 16}" width="1120" height="60" fill="#1b2f5c"/>
      ${goblet(180, TY, '#e2a93b')}${goblet(640, TY - 4, '#e2a93b', 1, 80)}<path d="M650 ${TY + 2} q120 -6 220 6" stroke="#a81f1c" stroke-width="10" stroke-linecap="round"/>
      <ellipse cx="${DX}" cy="${TY + 6}" rx="150" ry="14" fill="#000" opacity=".35"/>
      ${fig(d, DH, '#ffe0a0')}${spikes(d, DH, '#e2a93b')}${pads(d, DH, '#e2a93b', 0.045)}${sash(d, DH, '#c8312b', 0.022)}${blade(d, DH, '#dfe6ee', 0.006)}
      <path d="M${d.sL[0]} ${d.sL[1]} L${d.sR[0]} ${d.sR[1]} L${d.pR[0] + 14} ${d.pR[1] - 40} L${d.pL[0] - 14} ${d.pL[1] - 40}Z" fill="#e2a93b"/>`; } },
  { name: '3. PAPER CUTOUT', note: 'layered cut paper with soft shadows, storybook-theatre feel', bg: '#20264a', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const sh = 'filter="url(#ps)"';
    return `<defs><filter id="ps" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="10" dy="14" stdDeviation="8" flood-color="#000" flood-opacity=".45"/></filter></defs>
      <rect width="${W}" height="${H}" fill="#2a3168"/><g ${sh}><path d="M-20 300 Q540 120 1100 300 V${H} H-20Z" fill="#3a4288"/></g><g ${sh}>${windows('#20264a', '#f6d99a')}</g>
      <g ${sh}><path d="M-20 1100 Q300 1010 540 1090 T1100 1070 V${H} H-20Z" fill="#232a58"/></g>
      <g ${sh}>${cape(c, CH, '#2b4a8a', 1)}${body(c, CH, { w: 0.07, col: '#e9edf4', torso: true })}${curls(c, CH, '#e2a93b')}</g>
      <g ${sh}><rect x="-20" y="${TY}" width="1120" height="700" fill="#35549a"/><rect x="-20" y="${TY}" width="1120" height="22" fill="#f1f3f8"/></g>
      <g ${sh}>${goblet(180, TY, '#f0c15a')}${goblet(640, TY - 4, '#f0c15a', 1, 80)}</g><path d="M650 ${TY + 4} q120 -6 220 6" stroke="#c8312b" stroke-width="12" stroke-linecap="round"/>
      <g ${sh}>${body(d, DH, { w: 0.07, col: '#e2a93b', torso: true })}${spikes(d, DH, '#f6dc8b')}${pads(d, DH, '#f6dc8b')}${sash(d, DH, '#c8312b')}${blade(d, DH, '#f1f3f8')}</g>
      <circle cx="${d.head[0]}" cy="${d.head[1] + 8}" r="${DH * 0.062}" fill="#f2d3b3"/><circle cx="${c.head[0]}" cy="${c.head[1] + 8}" r="${CH * 0.062}" fill="#d9a777"/>`; } },
  { name: '4. ROMAN FRESCO', note: 'black-figure pottery: terracotta, ink figures, gold detail', bg: '#b4532a', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const key = y => Array.from({ length: 14 }, (_, i) => `<path d="M${i * 80} ${y} h60 v40 h-40 v-20 h20" stroke="#1a0d08" stroke-width="9" fill="none"/>`).join('');
    const gl = (j, h) => `<path d="M${j.sL[0]} ${j.sL[1] + h * .05} L${j.sR[0]} ${j.sR[1] + h * .05} M${j.pL[0] - 10} ${j.pL[1] - h * .1} L${j.pR[0] + 10} ${j.pR[1] - h * .1} M${j.neck[0]} ${j.neck[1] + h * .06} V${j.hip[1] - h * .1}" stroke="#e8b84a" stroke-width="7" fill="none"/>`;
    return `<rect width="${W}" height="${H}" fill="#c0612f"/><rect x="60" y="250" width="960" height="1500" fill="#cf7238" stroke="#1a0d08" stroke-width="10"/>${key(270)}${key(1680)}
      <circle cx="800" cy="800" r="120" fill="#e8b84a" stroke="#1a0d08" stroke-width="9"/>
      ${cape(c, CH, '#1a0d08', 1)}${body(c, CH, { w: 0.066, col: '#1a0d08', torso: true })}${curls(c, CH, '#1a0d08')}${gl(c, CH)}${eyes(c, CH, '#f6ead2')}
      <rect x="60" y="${TY}" width="960" height="170" fill="#1a0d08"/><rect x="60" y="${TY + 30}" width="960" height="10" fill="#e8b84a"/>
      ${goblet(200, TY, '#1a0d08')}${goblet(640, TY - 4, '#1a0d08', 1, 80)}
      ${body(d, DH, { w: 0.066, col: '#1a0d08', torso: true })}${spikes(d, DH, '#1a0d08')}${pads(d, DH, '#e8b84a', 0.04)}${gl(d, DH)}${sash(d, DH, '#f6ead2', 0.02)}${blade(d, DH, '#1a0d08')}${eyes(d, DH, '#e8b84a')}`; } },
  { name: '5. NEON LINE', note: 'glowing outline figures on black, gold vs. Bellona blue', bg: '#03040a', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const fig = (j, h, col, extra) => `<g filter="url(#ng)">${body(j, h, { w: 0.05, col, torso: true })}${extra(col)}</g>${body(j, h, { w: 0.036, col: '#03040a', torso: true })}${extra('#03040a', 0.8)}`;
    return `<defs><filter id="ng" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="9" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
      <rect width="${W}" height="${H}" fill="#03040a"/><g opacity=".5" filter="url(#ng)">${windows('#3a56c8', 'none')}</g>
      ${fig(c, CH, '#5fa0ff', (col) => curls(c, CH, col, col === '#03040a' ? 0.058 : 0.07))}
      <g filter="url(#ng)"><path d="M-20 ${TY} H1100" stroke="#5fa0ff" stroke-width="8"/></g><rect x="-20" y="${TY + 4}" width="1120" height="700" fill="#03040a"/>
      <g filter="url(#ng)">${goblet(180, TY - 2, '#5fa0ff', .9)}<path d="M650 ${TY - 2} q120 -6 220 6" stroke="#ff4a3a" stroke-width="8" stroke-linecap="round"/></g>
      ${fig(d, DH, '#ffc24a', (col) => spikes(d, DH, col, col === '#03040a' ? 0.058 : 0.07))}<g filter="url(#ng)">${sash(d, DH, '#ff4a3a', 0.016)}${blade(d, DH, '#ffffff', 0.004)}</g>${eyes(d, DH, '#ffc24a')}${eyes(c, CH, '#5fa0ff')}`; } },
  { name: '6. WAR-ROOM POSTER', note: 'bold flat shapes, faceless, propaganda-poster colors', bg: '#8f1d16', draw() {
    const d = J(STAND, DX, TY, DH), c = J(SEAT, CX, TY + CH * 0.36, CH);
    const rays = Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * Math.PI * 2, b = a + 0.09; return `<path d="M${DX} 860 L${DX + Math.cos(a) * 1800} ${860 + Math.sin(a) * 1800} L${DX + Math.cos(b) * 1800} ${860 + Math.sin(b) * 1800}Z" fill="#b8291f"/>`; }).join('');
    return `<rect width="${W}" height="${H}" fill="#8f1d16"/>${rays}<circle cx="${DX}" cy="860" r="250" fill="#e2a93b"/>
      ${cape(c, CH, '#16294a', 1)}${body(c, CH, { w: 0.075, col: '#2b4a8a', torso: true })}${curls(c, CH, '#f6ead2')}
      <rect x="-20" y="${TY}" width="1120" height="700" fill="#16294a"/><rect x="-20" y="${TY}" width="1120" height="26" fill="#f6ead2"/>
      ${goblet(180, TY, '#f6ead2')}${goblet(640, TY - 4, '#f6ead2', 1, 80)}
      ${body(d, DH, { w: 0.075, col: '#1b1210', torso: true })}${spikes(d, DH, '#1b1210')}${pads(d, DH, '#e2a93b', 0.055)}${sash(d, DH, '#f6ead2', 0.026)}${blade(d, DH, '#f6ead2')}`; } },
];

const frame = s => `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${s.draw()}</svg>
  <div class="cap"><div class="l1">HOUSE BELLONA WANTS HIM DEAD.</div><div class="l2">SO HE CLIMBS ON THEIR TABLE.</div></div>`;
(async () => {
  const b = await chromium.launch(), css = `@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
    body{margin:0;background:#0c0c10}.f{position:relative;width:${W}px;height:${H}px;overflow:hidden}.f svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.55)}.l1{color:#f6ead2}.l2{color:#e8372c}
    .grid{display:grid;grid-template-columns:repeat(3,540px);gap:24px;padding:24px}.cell .f{transform:scale(.5);transform-origin:0 0}.cell{width:540px;height:1060px;position:relative}
    .lab{position:absolute;left:0;top:968px;width:540px;font-family:Cinzel;font-weight:700;color:#f6ead2;font-size:30px;text-align:center}.lab small{display:block;font-family:sans-serif;font-weight:400;font-size:19px;color:#b9b2a6;margin-top:6px}`;
  const p = await b.newPage({ viewport: { width: W, height: H } });
  for (let i = 0; i < STYLES.length; i++) { await p.setContent(`<style>${css}</style><div class="f">${frame(STYLES[i])}</div>`); await p.evaluate(() => document.fonts.ready); await p.screenshot({ path: `${ROOT}/styles/style-${i + 1}.png` }); }
  const g = await b.newPage({ viewport: { width: 540 * 3 + 24 * 4, height: 1060 * 2 + 24 * 3 } });
  await g.setContent(`<style>${css}</style><div class="grid">${STYLES.map(s => `<div class="cell"><div class="f">${frame(s)}</div><div class="lab">${s.name}<small>${s.note}</small></div></div>`).join('')}</div>`);
  await g.evaluate(() => document.fonts.ready); await g.screenshot({ path: `${ROOT}/style-options.png` });
  await b.close();
})();
