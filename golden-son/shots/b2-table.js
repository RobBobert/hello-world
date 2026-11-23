// Test shot in the chosen style (B2 + O): chibi v2 characters in full colour, the gala drained to grey,
// cel shading + foreground blur, calm camera. node shots/b2-table.js [scale] -> b2-table-test.mp4
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, FPS = 30, DUR = 8.4;
const L = require('../lighting.js'), C = require('../chibi2.js');
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eo = u => 1 - Math.pow(1 - cl(u), 3), lerp = (a, b, u) => a + (b - a) * u;
const TY = 1540, DX = 400, CX = 790, LAND = 0.55, CUT = 3.7;

const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const room = (t, par) => `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: 1470, par })}</g>`;
function table(t) {
  const j = t > LAND ? Math.exp(-(t - LAND) * 8) * Math.sin((t - LAND) * 40) : 0, tip = cl((t - LAND) * 5);
  const gob = (x, k, spill) => `<g transform="translate(${x} ${TY - Math.abs(j) * k}) rotate(${spill ? tip * 80 : j * k * .2})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5"/><rect x="-17" y="-94" width="34" height="12" fill="#8f1a16"/></g>`;
  const plate = (x, k) => `<g transform="translate(${x} ${TY - 6 - Math.abs(j) * k})"><ellipse rx="80" ry="15" fill="#eef1f5" stroke="#1b1210" stroke-width="5"/><ellipse rx="50" ry="8" fill="#cfd6df"/></g>`;
  return `<rect x="-300" y="${TY}" width="1680" height="800" fill="#2b4a8a"/><rect x="-300" y="${TY}" width="1680" height="20" fill="#d8e0ea"/><rect x="-300" y="${TY + 20}" width="1680" height="60" fill="#1b2f5c"/>`
    + plate(130, 50) + plate(980, 30) + gob(230, 45, false) + gob(640, 40, true) + gob(1060, 25, false)
    + (t > LAND ? `<path d="M650 ${TY + 2} q${110 * eo((t - LAND) * 1.5)} -8 ${200 * eo((t - LAND) * 1.5)} 6" stroke="#a81f1c" stroke-width="12" stroke-linecap="round" fill="none"/>` : '');
}
const fg = (dx) => L.dof('near', `<path d="M${-120 + dx} 1920 V1220 q100 -130 200 0 V1920Z M${1000 + dx} 1920 V1300 q90 -110 180 0 V1920Z" fill="#0b0a18"/>`);

function frame(t) {
  const shake = t > LAND && t < LAND + .3 ? Math.exp(-(t - LAND) * 14) * 9 : 0, sx = shake * Math.sin(t * 80), sy = shake * Math.cos(t * 70);
  let world, cam, cap;
  if (t < CUT) {
    const u = io((t - 0.6) / 3.0), z = lerp(1.0, 1.4, u), fx = lerp(560, DX + 40, u), fy = lerp(960, 860, u);
    cam = `translate(${540 + sx} ${960 + sy}) scale(${z}) translate(${-fx} ${-fy})`;
    const fall = t < LAND ? -1300 * Math.pow(1 - t / LAND, 2) : 0, sq = t > LAND ? 1 - 0.08 * Math.exp(-(t - LAND) * 10) * Math.cos((t - LAND) * 28) : 1.03;
    const d = C.darrow(DX, TY, 340, { yaw: lerp(8, 18, io((t - 1) / 1.5)), mouth: t > 2.3 ? 'smirk' : 'flat', brow: 'angry', wind: t, arms: ['hang', 'blade'], hair: process.env.HAIR || 'short' });
    world = room(t, -30 * u) + L.rimLight(C.cassius(CX, TY + 310, 330, { yaw: -18, brow: 'soft', mouth: 'flat', blink: t > 2.9 && t < 3.0 }), 'gala', { depth: 55, rim: 9 }) + table(t)
      + L.floorShadow(DX, TY + 6, 290, { mood: 'gala' }) + `<g transform="translate(0 ${fall}) translate(${DX} ${TY}) scale(${2 - sq} ${sq}) translate(${-DX} ${-TY})">${L.rimLight(d, 'gala', { rim: 11 })}</g>`;
    cap = ['HOUSE BELLONA WANTS HIM DEAD.', t > 0.62 ? 'SO HE CLIMBS ON THEIR TABLE.' : ''];
    return { svg: `<g transform="${cam}">${world}</g>` + fg(-40 * u) + L.bokeh(3, t, { count: 14, opacity: .4 }), cap };
  }
  const tt = t - CUT, u = io(tt / (DUR - CUT)), z = lerp(1.5, 1.6, u);
  cam = `translate(540 1000) scale(${z}) translate(${-CX} ${-(TY - 260)})`;
  const mix = cl((tt - 1.4) / 0.8), angry = mix > .5;
  world = room(t, 12 * u) + L.rimLight(C.cassius(CX, TY + 310, 330, { yaw: lerp(-16, 12, u), brow: angry ? 'angry' : 'soft', mouth: angry ? 'frown' : 'flat', blink: tt > 1.2 && tt < 1.3, arms: angry ? ['table', 'table'] : ['table', 'table'] }), 'gala', { depth: 55, rim: 10 }) + table(t);
  cap = ['CASSIUS AU BELLONA.', tt > 1.5 ? "JULIAN'S BROTHER." : ''];
  return { svg: `<g transform="${cam}">${world}</g>` + L.bokeh(8, t, { count: 16, opacity: .45 }), cap };
}

(async () => {
  const scale = +(process.argv[2] || 1), b = await chromium.launch(), tmp = path.join(require('os').tmpdir(), 'b2table'); fs.rmSync(tmp, { recursive: true, force: true }); fs.mkdirSync(tmp, { recursive: true });
  const PAGE = `<style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}html,body{margin:0;background:#000;overflow:hidden}#w{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${scale});overflow:hidden}#w svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:84px;letter-spacing:1px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}.l1{color:#f6ead2}.l2{color:#e8372c}</style><div id="w"></div>`;
  const N = Math.round(DUR * FPS), t0 = Date.now();
  await Promise.all([0, 1, 2, 3].map(async w => { const p = await b.newPage({ viewport: { width: W * scale, height: H * scale } }); await p.setContent(PAGE); await p.evaluate(() => document.fonts.load('84px Anton'));
    for (let i = w; i < N; i += 4) { const t = i / FPS, { svg, cap } = frame(t);
      const html = `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${svg}${L.grade('gala', {})}</svg><div class="cap"><div class="l1">${cap[0]}</div>${cap[1] ? `<div class="l2">${cap[1]}</div>` : ''}</div>`;
      await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, html); await p.screenshot({ path: `${tmp}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
    await p.close(); }));
  console.log(N, 'frames', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', `${tmp}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-movflags', '+faststart', `${ROOT}/b2-table-${process.env.HAIR || 'short'}.mp4`]);
  for (const [k, i] of [['a', 25], ['b', 60], ['c', 105], ['d', 140], ['e', 200], ['f', 245]]) fs.copyFileSync(`${tmp}/f${String(i).padStart(4, '0')}.jpg`, `${ROOT}/out/b2t-${process.env.HAIR || 'short'}-${k}.jpg`);
  await b.close();
})();
