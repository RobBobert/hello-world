// Renders out/darrow-turnaround.png (+ crops and a pop check). Usage: node models/darrow-test.js
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
const { darrow } = require('./darrow.js');
const ST = require('../style.js');
const OUT = path.join(__dirname, '..', 'out');
const YAWS = [-60, -30, 0, 30, 60], EXPR = ['angry', 'brood', 'neutral', 'smile', 'grin'];
const bgr = (w, hh) => `<rect width="${w}" height="${hh}" fill="${ST.navy}"/><rect width="${w}" height="${hh}" fill="url(#bgG)"/>`;
const defs = `<defs><radialGradient id="bgG" cx="30%" cy="20%" r="90%"><stop offset="0" stop-color="${ST.navyLight}"/><stop offset="1" stop-color="${ST.night}"/></radialGradient></defs>`;
const win = (X, Y, w, hh, inner) => `<svg x="${X}" y="${Y}" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">${inner}</svg>`;
function sheet() {
  let o = '';
  YAWS.forEach((yw, i) => { o += win(i * 400, 0, 400, 900, darrow(200, 870, 820, { yaw: yw, expr: 'brood', wind: 0.4 + i, blade: true })); });
  YAWS.forEach((yw, i) => { o += win(i * 400, 900, 400, 620, darrow(200, 1840, 1750, { yaw: yw, expr: EXPR[i], wind: 1 + i, crop: 'bust' })); });
  o += win(0, 1520, 1000, 520, darrow(500, 470, 1650, { yaw: -25, wind: 1, blade: true }));
  o += win(1000, 1520, 1000, 520, darrow(500, 470, 1650, { yaw: 40, wind: 1 }));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="2000" height="2040" viewBox="0 0 2000 2040">${defs}${bgr(2000, 2040)}${o}</svg>`;
}
function pop() { // adjacent yaws + pitch/blink: nothing should jump
  let o = '';
  [[10, 0], [14, 0], [-2, 0], [2, 0], [38, 0], [42, 0]].forEach(([yw, p], i) => { o += win(i * 330, 0, 330, 520, darrow(165, 1520, 1450, { yaw: yw, pitch: p, expr: 'brood', wind: 2, crop: 'bust' })); });
  [[0, -18], [0, 18], [-45, 12], [45, -12], [20, 0], [-20, 0]].forEach(([yw, p], i) => { o += win(i * 330, 520, 330, 520, darrow(165, 1520, 1450, { yaw: yw, pitch: p, expr: i === 4 ? 'smile' : 'neutral', blink: i === 5, wind: 3, crop: 'bust' })); });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1980" height="1040" viewBox="0 0 1980 1040">${defs}${bgr(1980, 1040)}${o}</svg>`;
}
function phone() { // roughly how he reads in the 1080x1920 frame, shown at phone size
  const o = darrow(360, 1700, 1350, { yaw: -20, expr: 'smile', wind: 2, blade: true }) + darrow(820, 1740, 1150, { yaw: 35, expr: 'brood', wind: 5 });
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">${defs}${bgr(1080, 1920)}${o}</svg>`;
}
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const a = darrow(1, 2, 300, { yaw: 12, wind: 1 }), b = darrow(1, 2, 300, { yaw: 12, wind: 1 });
  if (a !== b) throw new Error('not deterministic');
  const br = await chromium.launch(), pg = await br.newPage();
  const shot = async (svg, w, hh, name, clip, scale = 1) => {
    await pg.setViewportSize({ width: w, height: hh });
    await pg.setContent(`<body style="margin:0;background:#000">${svg}</body>`);
    await pg.screenshot({ path: path.join(OUT, name), clip: clip || { x: 0, y: 0, width: w, height: hh } });
  };
  const s = sheet();
  await shot(s, 2000, 2040, 'darrow-turnaround.png');
  await shot(s, 2000, 2040, 'darrow-full.png', { x: 0, y: 0, width: 2000, height: 900 });
  await shot(s, 2000, 2040, 'darrow-bust-a.png', { x: 0, y: 900, width: 1200, height: 620 });
  await shot(s, 2000, 2040, 'darrow-bust-b.png', { x: 800, y: 900, width: 1200, height: 620 });
  await shot(s, 2000, 2040, 'darrow-boots.png', { x: 0, y: 1520, width: 2000, height: 520 });
  await shot(pop(), 1980, 1040, 'darrow-pop.png');
  await shot(phone(), 1080, 1920, 'darrow-phone.png');
  await br.close();
  console.log('ok', (s.length / 1024 | 0) + 'kB sheet,', (a.length / 1024 | 0) + 'kB per figure');
})();
