// 9:16 cover / thumbnail for the Golden Son Short (same layout as the Book 1 cover).
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, L = require('../lighting.js'), K = require('../cast.js'), C2 = require('../chibi2.js');
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
// Cassius's long straight razor held across his body (same style as Aja's)
const f = v => v.toFixed(1);
const longBlade = (x, y, S, yaw) => { const k = -yaw * S * .0016, hx = x + k - .33 * S - .12 * S, hy = y - 1.55 * S + .1 * S + .05 * S, a = .62, ux = Math.cos(a), uy = Math.sin(a), Lb = 1.5 * S, w = .045 * S;
  const P = (d, o) => `${f(hx + ux * d - uy * o)} ${f(hy + uy * d + ux * o)}`;
  return `<path d="M${P(.1 * S, -w)} L${P(Lb, -w * .2)} L${P(Lb + .08 * S, 0)} L${P(Lb, w * .2)} L${P(.1 * S, w)} Z" fill="#f4f8ff" stroke="#1b1210" stroke-width="${f(S * .022)}"/><path d="M${P(.12 * S, 0)} L${P(Lb, 0)}" stroke="#ffd36a" stroke-width="${f(S * .012)}"/>`
    + `<path d="M${P(.08 * S, -.13 * S)} L${P(.08 * S, .13 * S)}" stroke="#1b1210" stroke-width="${f(S * .07)}" stroke-linecap="round"/><path d="M${P(.08 * S, -.12 * S)} L${P(.08 * S, .12 * S)}" stroke="#f0c04a" stroke-width="${f(S * .04)}" stroke-linecap="round"/>`
    + `<path d="M${P(.06 * S, 0)} L${P(-.2 * S, 0)}" stroke="#1b1210" stroke-width="${f(S * .07)}" stroke-linecap="round"/><path d="M${P(.05 * S, 0)} L${P(-.19 * S, 0)}" stroke="#2b4a8a" stroke-width="${f(S * .04)}" stroke-linecap="round"/>`
    + `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(S * .085)}" fill="#d9a777" stroke="#1b1210" stroke-width="${f(S * .035)}"/>`; };
(async () => {
  C2.setLight(null);
  const bg = `<defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2b4a8a"/><stop offset="1" stop-color="#101c3a"/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d9a33a"/><stop offset="1" stop-color="#8a5e16"/></linearGradient></defs>
    <rect width="${W}" height="${H}" fill="url(#g2)"/><path d="M0 0 H690 L360 ${H} H0 Z" fill="url(#g1)"/>
    <path d="M690 0 L360 ${H}" stroke="#f6ead2" stroke-width="6" opacity=".55"/>`;
  const art = L.rimLight(K.cassius(300, 1530, 315, { yaw: 14, brow: 'angry', mouth: 'frown', arms: ['guard', 'hang'] }), 'gala') + longBlade(300, 1530, 315, 14)
    + L.rimLight(K.darrow(720, 1530, 340, { yaw: -14, brow: 'angry', mouth: 'smirk', arms: ['hang', 'blade'], drawn: true }), 'triumph');
  const html = `<!doctype html><style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}@font-face{font-family:Cinzel;font-weight:700;src:url(${font('cinzel700.woff2')})}
    body{margin:0;width:${W}px;height:${H}px;overflow:hidden}svg{position:absolute;inset:0}
    .t{position:absolute;top:300px;left:40px;right:40px;text-align:center;font-family:Anton;text-transform:uppercase;line-height:1.05;-webkit-text-stroke:3px #120c0a;paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.55)}
    .a{font-size:120px;color:#f6ead2}.c{font-size:98px;color:#e8372c;white-space:nowrap}
    .lab{position:absolute;top:1590px;width:100%;text-align:center;font-family:Cinzel;font-weight:700;font-size:62px;color:#f6ead2;text-shadow:0 4px 0 rgba(0,0,0,.5)}</style>
    <svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${L.defs()}${bg}${art}</svg>
    <div class="t"><div class="a">HE WON MARS.</div><div class="c">AND LOST EVERYTHING.</div></div>
    <div class="lab">GOLDEN SON · BOOK 2</div>`;
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(html); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: `${ROOT}/golden-son-cover.png` }); await b.close(); console.log('ok');
})();
