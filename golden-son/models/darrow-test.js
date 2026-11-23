// Renders out/darrow-turnaround.png (+ crops, face sheet, pop check, phone check). Usage: node models/darrow-test.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { darrow } = require('./darrow.js');
const ST = require('../style.js');
const OUT = path.join(__dirname, '..', 'out');
const YAWS = [-30, -15, 0, 15, 30], EXPR = ['angry', 'brood', 'neutral', 'smile', 'grin'];
const defs = `<defs><radialGradient id="bgG" cx="30%" cy="20%" r="90%"><stop offset="0" stop-color="${ST.navyLight}"/><stop offset="1" stop-color="${ST.night}"/></radialGradient></defs>`;
const bgr = (w, hh) => `<rect width="${w}" height="${hh}" fill="url(#bgG)"/>`;
const win = (X, Y, w, hh, inner) => `<svg x="${X}" y="${Y}" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${inner}</svg>`;
const doc = (w, hh, o) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${defs}${bgr(w, hh)}${o}</svg>`;
function sheet() {
  let o = '';
  YAWS.forEach((yw, i) => { o += win(i * 400, 0, 400, 900, darrow(200, 868, 830, { yaw: yw, expr: 'neutral', wind: 0.4 + i, blade: true })); });
  YAWS.forEach((yw, i) => { o += win(i * 400, 900, 400, 620, darrow(200, 1250, 1180, { yaw: yw, expr: EXPR[i], wind: 1 + i, crop: 'bust' })); });
  o += win(0, 1520, 1000, 520, darrow(500, 460, 1650, { yaw: -15, wind: 1, blade: true }));
  o += win(1000, 1520, 1000, 520, darrow(500, 460, 1650, { yaw: 20, wind: 1 }));
  return doc(2000, 2040, o);
}
function faces() { // big faces: the angles the film uses, every expression
  let o = '';
  [[-15, 'neutral'], [0, 'neutral'], [15, 'smile'], [0, 'smile'], [-20, 'brood'], [20, 'angry'], [0, 'grin'], [10, 'neutral']].forEach(([yw, e], i) => { o += win((i % 4) * 500, Math.floor(i / 4) * 620, 500, 620, darrow(250, 2330, 2200, { yaw: yw, expr: e, crop: 'bust', blink: i === 7 })); });
  return doc(2000, 1240, o);
}
function pop() {
  let o = '';
  [[10, 0], [14, 0], [-2, 0], [2, 0], [-12, 6], [-16, 6]].forEach(([yw, p], i) => { o += win(i * 330, 0, 330, 520, darrow(165, 1590, 1500, { yaw: yw, pitch: p, expr: 'smile', wind: 2, crop: 'bust' })); });
  [[0, -18], [0, 18], [-45, 0], [45, 0], [-60, 0], [60, 0]].forEach(([yw, p], i) => { o += win(i * 330, 520, 330, 520, darrow(165, 1590, 1500, { yaw: yw, pitch: p, expr: 'neutral', wind: 3, crop: 'bust' })); });
  return doc(1980, 1040, o);
}
function phone() { // roughly how he reads in the 1080x1920 frame
  return doc(1080, 1920, darrow(540, 1780, 1500, { yaw: -10, expr: 'smile', wind: 2, blade: true }));
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = darrow(1, 2, 300, { yaw: 12, wind: 1 }), b = darrow(1, 2, 300, { yaw: 12, wind: 1 });
  if (a !== b) throw new Error('not deterministic');
  if (/NaN|undefined/.test(a)) throw new Error('bad numbers in output');
  const br = await chromium.launch(), pg = await br.newPage();
  const shot = async (svg, w, hh, name, clip) => {
    await pg.setViewportSize({ width: w, height: hh });
    await pg.setContent(`<body style="margin:0;background:#000">${svg}</body>`);
    await pg.screenshot({ path: path.join(OUT, name), clip: clip || { x: 0, y: 0, width: w, height: hh } });
  };
  const s = sheet();
  await shot(s, 2000, 2040, 'darrow-turnaround.png');
  await shot(s, 2000, 2040, 'darrow-full.png', { x: 0, y: 0, width: 2000, height: 900 });
  await shot(s, 2000, 2040, 'darrow-boots.png', { x: 0, y: 1520, width: 2000, height: 520 });
  await shot(faces(), 2000, 1240, 'darrow-faces.png');
  await shot(pop(), 1980, 1040, 'darrow-pop.png');
  await shot(phone(), 1080, 1920, 'darrow-phone.png');
  await br.close();
  for (const n of ['darrow-bust-a.png', 'darrow-bust-b.png']) try { fs.unlinkSync(path.join(OUT, n)); } catch (e) {}
  console.log('ok', (a.length / 1024 | 0) + 'kB per figure');
})();
