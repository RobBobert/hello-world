// Test shots: 2D characters staged in layered sets with a calm camera (slow push + slight parallax).
// node shots/testshots.js [scale]  -> out/test-<name>.mp4, out/test-<name>.png, test-shots.mp4
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..');
const L = require('../lighting.js'), { darrow } = require('../models/darrow.js'), { cassius } = require('../models/cassius.js');
const FPS = 30, W = 1080, H = 1920;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }, eo = u => 1 - Math.pow(1 - cl(u), 3);
const lerp = (a, b, u) => a + (b - a) * u;
const font = f => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${f}`).toString('base64')}`;
const cap = (l1, l2, show2, col = '#e8372c') => `<div class="cap"><div class="l1">${l1}</div>${show2 && l2 ? `<div class="l2" style="color:${col}">${l2}</div>` : ''}</div>`;
// calm camera: one slow push (zoom z0 -> z1) about a focus point; returns an svg transform
const camT = (u, fx, fy, z0, z1, dx = 0, dy = 0) => { const z = lerp(z0, z1, io(u)); return `translate(${W / 2 + dx * io(u)} ${H * 0.5 + dy * io(u)}) scale(${z}) translate(${-fx} ${-fy})`; };

const SHOTS = {
  // 1. The Academy: Darrow on his bridge, watching his fleet burn.
  academy: { dur: 4.5, frame(t, u) {
    const par = -40 * io(u);
    const boom = (x, y, r, t0) => { const k = cl((t - t0) / 1.2); return k <= 0 ? '' : L.glow(x + par * .5, y, r * (0.4 + eo(k)), '#ffb04a', 0.9 * (1 - k * .6)) + L.glow(x + par * .5, y, r * 0.35 * (0.5 + eo(k)), '#fff3c4', 1 - k); };
    const world = L.skyOrRoom('space', t, { par, deck: true, floorY: 1380 }) + boom(760, 700, 260, 0.6) + boom(900, 1000, 170, 1.7) + boom(640, 1130, 130, 2.6)
      + L.rimLight(darrow(360, 2400, 1730, { yaw: 16 - 6 * io(u), expr: 'brood', blink: t > 2.9 && t < 3.05 }), 'space', {});
    return L.frame(`<g transform="${camT(u, 540, 960, 1.0, 1.08, 0, 0)}">${world}</g>`, 'space', { t }) + cap('THE ACADEMY.', 'KARNUS AU BELLONA WINS.', t > 1.9);
  } },
  // 2. The Iron Rain: an army dropped from orbit onto Mars.
  ironrain: { dur: 4.5, frame(t, u) {
    const par = 30 * io(u); let rain = '';
    for (let i = 0; i < 46; i++) { const sp = 0.5 + ((i * 37) % 10) / 14, ph = ((i * 61) % 100) / 100, k = ((t * sp * 0.55 + ph) % 1), x0 = ((i * 211) % 1500) - 150, far = i % 3;
      const x = x0 - 260 * k + par * (far ? .4 : .9), y = -250 + 1500 * k, len = far ? 130 : 240, wd = far ? 5 : 10;
      rain += `<g opacity="${(far ? .55 : .95) * Math.min(1, k * 6) * (1 - Math.pow(k, 6))}"><line x1="${x + len * 0.17}" y1="${y - len}" x2="${x}" y2="${y}" stroke="#ffcf7a" stroke-width="${wd}" stroke-linecap="round"/><line x1="${x + len * 0.06}" y1="${y - len * .35}" x2="${x}" y2="${y}" stroke="#fff6dc" stroke-width="${wd * .6}" stroke-linecap="round"/><circle cx="${x}" cy="${y}" r="${wd * 1.1}" fill="#fff"/></g>`; }
    const world = L.skyOrRoom('mars', t, { par, floorY: 1330, sunX: 300, sunH: 420 }) + L.screen(rain)
      + L.rimLight(darrow(730, 2300, 1630, { yaw: -18, pitch: 8, expr: 'angry', wind: t }), 'mars', {})
      + L.dust(7, t, { count: 40, color: '#ffb070', opacity: .5 });
    return L.frame(`<g transform="${camT(u, 540, 1000, 1.0, 1.07)}">${world}</g>`, 'mars', { t }) + cap('AN ARMY FROM ORBIT.', 'THE IRON RAIN.', t > 1.6, '#ffe08a');
  } },
  // 3. The duel at the gala: Darrow and Cassius face each other.
  duel: { dur: 4.5, frame(t, u) {
    const par = -30 * io(u);
    const world = L.skyOrRoom('gala', t, { par, floorY: 1420, crowd: true })
      + L.rimLight(cassius(830, 2020, 1300, { yaw: -24, expr: 'neutral', exprTo: 'angry', mix: io((t - 1.6) / 1.2), bodyYaw: -16 }), 'gala', {})
      + L.rimLight(darrow(250, 2000, 1330, { yaw: 22, expr: t > 2.2 ? 'smile' : 'brood' }), 'gala', {})
      + L.bokeh(3, t, { count: 14, opacity: .35 });
    return L.frame(`<g transform="${camT(u, 540, 1010, 1.0, 1.1)}">${world}</g>`, 'gala', { t }) + cap('A DUEL.', 'IN FRONT OF EVERYONE.', t > 1.5);
  } },
  // 4. The Triumph: the gold feast turns blood red.
  triumph: { dur: 4.5, frame(t, u) {
    const turn = io((t - 1.6) / 1.8), par = 24 * io(u);
    const box = `<g transform="translate(540 1500)"><rect x="-150" y="-110" width="300" height="130" rx="10" fill="#3a1c12" stroke="#1b0e08" stroke-width="6"/><rect x="-160" y="-140" width="320" height="42" rx="10" fill="#5a2c18" stroke="#1b0e08" stroke-width="6"/><rect x="-22" y="-112" width="44" height="50" rx="6" fill="#e2a93b" stroke="#1b0e08" stroke-width="5"/><path d="M-150 -40 h300" stroke="#e2a93b" stroke-width="8"/></g>`;
    const tableTop = `<path d="M-200 1520 H1280 V1920 H-200Z" fill="${turn > .5 ? '#3a0d10' : '#5a3a14'}"/><rect x="-200" y="1508" width="1480" height="26" fill="${turn > .5 ? '#7a1c1c' : '#e2a93b'}"/>`;
    const world = L.skyOrRoom('triumph', t, { par, turn, floorY: 1420 })
      + L.rimLight(darrow(540, 2180, 1500, { yaw: -6 + 10 * io(u), expr: turn > .5 ? 'brood' : 'neutral', blink: t > 2.5 && t < 2.62 }), 'triumph', { turn })
      + tableTop + L.lit(box, 'triumph', { turn, depth: 40, rim: 6 }) + L.candle(250, 1500, 1.3, t) + L.candle(850, 1500, 1.3, t + 1);
    return L.frame(`<g transform="${camT(u, 540, 1000, 1.0, 1.09)}">${world}</g>`, 'triumph', { t, turn }) + cap('THEN COMES A BOX.', 'INSIDE... FITCHNER\'S HEAD.', t > 2.2, '#ffe08a');
  } },
};

(async () => {
  const scale = +(process.argv[2] || 1), only = process.argv[3];
  const b = await chromium.launch(), tmp = path.join(require('os').tmpdir(), 'gs-test'); fs.mkdirSync(`${ROOT}/out`, { recursive: true });
  const PAGE = `<style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}html,body{margin:0;background:#000;overflow:hidden}#w{position:absolute;left:0;top:0;width:${W}px;height:${H}px;transform-origin:0 0;transform:scale(${scale});overflow:hidden}
    #w svg{position:absolute;inset:0}.cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08;text-transform:uppercase}
    .l1,.l2{font-size:84px;letter-spacing:1px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.55),0 0 40px rgba(0,0,0,.6)}.l1{color:#f6ead2}</style><div id="w"></div>`;
  const parts = [];
  for (const [name, s] of Object.entries(SHOTS)) {
    if (only && only !== name) continue;
    const dir = `${tmp}/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const N = Math.round(s.dur * FPS), t0 = Date.now();
    await Promise.all([0, 1, 2, 3].map(async w => { const p = await b.newPage({ viewport: { width: W * scale, height: H * scale } }); await p.setContent(PAGE); await p.evaluate(() => document.fonts.load('84px Anton'));
      for (let i = w; i < N; i += 4) { const t = i / FPS, html = s.frame(t, t / s.dur); await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, html); await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); }
      await p.close(); }));
    console.log(name, N, 'frames', ((Date.now() - t0) / N).toFixed(0), 'ms/frame');
    const out = `${ROOT}/out/test-${name}.mp4`;
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', `${dir}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', out]);
    fs.copyFileSync(`${dir}/f${String(Math.round(N * 0.75)).padStart(4, '0')}.jpg`, `${ROOT}/out/test-${name}.jpg`);
    parts.push(out);
  }
  await b.close();
  if (!only) { fs.writeFileSync(`${tmp}/list.txt`, parts.map(p => `file '${p}'`).join('\n')); execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', `${tmp}/list.txt`, '-c', 'copy', `${ROOT}/test-shots.mp4`]); }
})();
