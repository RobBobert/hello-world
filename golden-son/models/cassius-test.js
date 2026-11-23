// Renders out/cassius-turnaround.png (+ close-up / adjacency checks). Run: node models/cassius-test.js
const path = require('path');
const { chromium } = require('playwright');
const { cassius } = require('./cassius.js');
const OUT = path.join(__dirname, '..', 'out');
const BG = (w, h) => `<defs><radialGradient id="bg" cx="45%" cy="35%" r="80%"><stop offset="0" stop-color="#22305e"/><stop offset="1" stop-color="#0b1022"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#bg)"/>`;
const svg = (w, h, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${BG(w, h)}${body}</svg>`;
const label = (x, y, t) => `<text x="${x}" y="${y}" fill="#9fb3e0" font-family="sans-serif" font-size="22" text-anchor="middle">${t}</text>`;
// bust window: a clipped viewport showing the head and shoulders of a figure of height h
const bust = (x, y, w, hh, o, zoom = 1) => { const h = 1500 * zoom; return `<svg x="${x}" y="${y}" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}"><rect width="${w}" height="${hh}" fill="#141c3a" stroke="#22305e"/>${cassius(w / 2, hh * 0.47 + h * 0.867, h, { crop: 'bust', ...o })}</svg>`; };

function sheet() {
  const W = 2400, H = 2360; let b = '';
  [-60, -30, 0, 30, 60].forEach((yaw, i) => { b += cassius(250 + i * 475, 1010, 900, { yaw }) + label(250 + i * 475, 1050, `yaw ${yaw}`); });
  const ex = [['smirk', -60], ['neutral', -30], ['angry', 0], ['shock', 30], ['pain', 60]];
  ex.forEach(([expr, yaw], i) => { b += bust(40 + i * 475, 1090, 440, 560, { yaw, expr }) + label(260 + i * 475, 1690, `${expr} / yaw ${yaw}`); });
  // seated behind a table edge
  b += cassius(420, 2260, 900, { pose: 'seated', yaw: -25, expr: 'smirk' }) + `<rect x="60" y="2260" width="720" height="60" fill="#2b4a8a" stroke="#120d0f" stroke-width="6"/>` + label(420, 2350, 'seated / smirk');
  b += cassius(1180, 2260, 900, { pose: 'seated', yaw: 35, expr: 'angry' }) + `<rect x="820" y="2260" width="720" height="60" fill="#2b4a8a" stroke="#120d0f" stroke-width="6"/>` + label(1180, 2350, 'seated / angry');
  // phone-size read: whole figure in a 270x480 frame (quarter-scale 1080x1920)
  b += `<svg x="1620" y="1760" width="270" height="480" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#141c3a"/>${cassius(540, 1800, 1500, { yaw: -20, expr: 'smirk' })}</svg>` + label(1755, 2280, 'phone 1/4 full');
  b += `<svg x="1960" y="1760" width="270" height="480" viewBox="0 0 1080 1920"><rect width="1080" height="1920" fill="#141c3a"/>${cassius(540, 800 + 3600 * 0.867, 3600, { yaw: 25, expr: 'angry', crop: 'bust' })}</svg>` + label(2095, 2280, 'phone 1/4 close');
  return svg(W, H, b);
}
function faces() { // big faces across the hero swing, neutral -> angry
  const W = 2400, H = 1480; let b = '';
  [-45, -25, -5, 15, 40].forEach((yaw, i) => { b += bust(10 + i * 478, 10, 468, 700, { yaw, expr: 'neutral', exprTo: 'angry', mix: i / 4 }, 1.35) ; });
  [['smirk', -15, 8], ['shock', 10, 0], ['pain', -35, -8], ['neutral', 60, 0], ['neutral', -60, 10]].forEach(([expr, yaw, pitch], i) => { b += bust(10 + i * 478, 730, 468, 700, { yaw, expr, pitch, blink: i === 3 ? 1 : 0 }, 1.35); });
  return svg(W, H, b);
}
function adjacent() { // neighbouring yaws side by side: nothing should pop
  const W = 2400, H = 720; let b = '';
  [10, 14, 18, -38, -42].forEach((yaw, i) => { b += bust(10 + i * 478, 10, 468, 700, { yaw }, 1.35) + label(244 + i * 478, 700, `yaw ${yaw}`); });
  return svg(W, H, b);
}
(async () => {
  const br = await chromium.launch();
  const shot = async (name, s, w, h) => { const pg = await br.newPage({ viewport: { width: w, height: h } }); await pg.setContent(`<body style="margin:0;background:#0b1022">${s}</body>`); await pg.screenshot({ path: path.join(OUT, name) }); await pg.close(); console.log('wrote', name, (s.length / 1024 | 0) + 'KB svg'); };
  await shot('cassius-turnaround.png', sheet(), 2400, 2360);
  await shot('cassius-faces.png', faces(), 2400, 1480);
  await shot('cassius-adjacent.png', adjacent(), 2400, 720);
  await shot('cassius-seated.png', svg(1600, 900, cassius(420, 800, 1500, { pose: 'seated', yaw: -25, expr: 'smirk' }) + '<rect x="0" y="800" width="800" height="100" fill="#2b4a8a" stroke="#120d0f" stroke-width="8"/>' + cassius(1200, 800, 1500, { pose: 'seated', yaw: 35, expr: 'angry' }) + '<rect x="800" y="800" width="800" height="100" fill="#2b4a8a" stroke="#120d0f" stroke-width="8"/>'), 1600, 900);
  await br.close();
})();
