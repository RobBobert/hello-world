// Test harness for shots/bellona.js.
//   node shots/bellona-test.js stills            -> out/comp-01.png ... (full res key frames)
//   node shots/bellona-test.js video             -> out/bellona-preview.mp4 (540x960)
//   node shots/bellona-test.js at 6.9 name       -> out/comp-name.png
// Uses models/darrow.js + models/cassius.js (+ lighting.js) if they exist, otherwise stand-ins built from rig.js.
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..');
const shot = require('./bellona.js'), R = require('../rig.js'), S = require('../style.js');

// ---------- stand-ins: adult proportions (head centre .90h, head radius .10h), rig.js head for the yaw swing ----------
const INK = S.INK;
function figure(x, y, h, P, o = {}) {
  const seated = o.pose === 'seated', yaw = o.yaw || 0, k = yaw * h * 0.0007, sw = h * 0.007, wind = o.wind || 0;
  const st = `stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"`, q = v => v.toFixed(1);
  const hy = y - (seated ? 0.66 : 0.90) * h, sh = y - (seated ? 0.56 : 0.80) * h, hip = y - (seated ? 0.27 : 0.50) * h; // head, shoulder, hip heights
  let s = '';
  // cloak
  if (P.cloak) { const hem = seated ? y - 0.2 * h : y - 0.1 * h - wind * 0.35 * h, spread = 0.27 + wind * 0.2;
    s += `<path d="M${q(x - 0.14 * h)} ${q(sh)} L${q(x - spread * h)} ${q(hem)} L${q(x - 0.08 * h)} ${q(hem - 0.05 * h)} L${q(x + 0.1 * h)} ${q(hem + 0.02 * h)} L${q(x + spread * h)} ${q(hem - 0.03 * h)} L${q(x + 0.14 * h)} ${q(sh)}Z" fill="${P.cloak}" ${st}/>`; }
  if (!seated) { // legs + boots
    for (const d of [-1, 1]) { const ax = x + d * 0.115 * h, hx = x + d * 0.06 * h;
      s += `<path d="M${q(hx - 0.06 * h)} ${q(hip)} L${q(hx + 0.06 * h)} ${q(hip)} L${q(ax + 0.048 * h)} ${q(y - 0.24 * h)} L${q(ax - 0.048 * h)} ${q(y - 0.24 * h)}Z" fill="${P.leg}" ${st}/>
        <path d="M${q(ax - 0.056 * h)} ${q(y - 0.27 * h)} L${q(ax + 0.056 * h)} ${q(y - 0.27 * h)} L${q(ax + 0.05 * h)} ${q(y - 0.05 * h)} L${q(ax + d * 0.13 * h)} ${q(y - 0.035 * h)} L${q(ax + d * 0.14 * h)} ${q(y - 0.012 * h)} L${q(ax - d * 0.06 * h)} ${q(y - 0.012 * h)} L${q(ax - d * 0.055 * h)} ${q(y - 0.06 * h)}Z" fill="${P.boot}" ${st}/>
        <path d="M${q(ax - 0.04 * h)} ${q(y - 0.25 * h)} L${q(ax + 0.04 * h)} ${q(y - 0.25 * h)} L${q(ax + 0.03 * h)} ${q(y - 0.09 * h)} L${q(ax)} ${q(y - 0.07 * h)} L${q(ax - 0.03 * h)} ${q(y - 0.09 * h)}Z" fill="${P.armor}" ${st}/>
        <path d="M${q(ax + 0.004 * h)} ${q(y - 0.25 * h)} L${q(ax + 0.04 * h)} ${q(y - 0.25 * h)} L${q(ax + 0.03 * h)} ${q(y - 0.09 * h)} L${q(ax + 0.004 * h)} ${q(y - 0.073 * h)}Z" fill="${P.armorSh}"/>
        <rect x="${q(ax - 0.06 * h)}" y="${q(y - 0.285 * h)}" width="${q(0.12 * h)}" height="${q(0.028 * h)}" fill="${P.trim}" ${st}/>
        <path d="M${q(ax - d * 0.065 * h)} ${q(y - 0.012 * h)} L${q(ax + d * 0.145 * h)} ${q(y - 0.012 * h)} L${q(ax + d * 0.145 * h)} ${q(y)} L${q(ax - d * 0.065 * h)} ${q(y)}Z" fill="#0b0809" ${st}/>`; }
  }
  // torso + arms
  const wb = seated ? y - 0.3 * h : hip;
  s += `<path d="M${q(x - 0.155 * h + k)} ${q(sh)} L${q(x + 0.155 * h + k)} ${q(sh)} L${q(x + 0.1 * h)} ${q(wb)} L${q(x - 0.1 * h)} ${q(wb)}Z" fill="${P.body}" ${st}/>
    <path d="M${q(x + 0.03 * h + k)} ${q(sh)} L${q(x + 0.155 * h + k)} ${q(sh)} L${q(x + 0.1 * h)} ${q(wb)} L${q(x + 0.05 * h)} ${q(wb)}Z" fill="${P.bodySh}"/>
    <circle cx="${q(x + k * 0.6)}" cy="${q(sh + 0.1 * h)}" r="${q(0.035 * h)}" fill="${P.trim}" ${st}/>`;
  for (const d of [-1, 1]) { const ex = x + d * 0.2 * h + k, ey = sh + 0.2 * h, hx2 = seated ? x + d * 0.13 * h : x + d * 0.2 * h, hy2 = seated ? y - 0.475 * h : sh + 0.36 * h;
    s += `<path d="M${q(x + d * 0.12 * h + k)} ${q(sh + 0.01 * h)} L${q(x + d * 0.19 * h + k)} ${q(sh + 0.03 * h)} L${q(ex + d * 0.035 * h)} ${q(ey)} L${q(hx2 + d * 0.03 * h)} ${q(hy2)} L${q(hx2 - d * 0.03 * h)} ${q(hy2)} L${q(ex - d * 0.04 * h)} ${q(ey)}Z" fill="${P.arm}" ${st}/>
      <path d="M${q(x + d * 0.09 * h + k)} ${q(sh - 0.02 * h)} L${q(x + d * 0.2 * h + k)} ${q(sh - 0.012 * h)} L${q(x + d * 0.215 * h + k)} ${q(sh + 0.07 * h)} L${q(x + d * 0.11 * h + k)} ${q(sh + 0.06 * h)}Z" fill="${P.shoulder}" ${st}/>`; }
  if (P.pelt) s += `<path d="M${q(x - 0.2 * h + k)} ${q(sh + 0.05 * h)} l${q(0.03 * h)} ${q(-0.08 * h)} l${q(0.05 * h)} ${q(-0.03 * h)} L${q(x + k)} ${q(sh + 0.02 * h)} l${q(0.12 * h)} ${q(-0.09 * h)} l${q(0.05 * h)} ${q(0.03 * h)} l${q(0.03 * h)} ${q(0.09 * h)} l${q(-0.05 * h)} ${q(-0.01 * h)} l${q(-0.03 * h)} ${q(0.05 * h)} l${q(-0.05 * h)} ${q(-0.02 * h)} L${q(x + k)} ${q(sh + 0.11 * h)} l${q(-0.07 * h)} ${q(-0.05 * h)} l${q(-0.04 * h)} ${q(0.04 * h)}Z" fill="${P.pelt}" ${st}/>`;
  s += `<rect x="${q(x - 0.035 * h + k)}" y="${q(hy + 0.07 * h)}" width="${q(0.07 * h)}" height="${q(0.06 * h)}" fill="${R.SKIN}" ${st}/>`;
  const E = { brood: ['angry', 'flat'], smile: ['angry', 'smirk'], grin: ['angry', 'grin'], neutral: (o.mix || 0) > 0.5 ? ['angry', 'frown'] : ['soft', 'flat'] }[o.expr] || ['soft', 'flat'];
  s += R.head(x + k * 0.6, hy, 0.1 * h, { yaw, pitch: o.pitch || 0, blink: o.blink, hair: P.hair, hairCol: P.hairCol, hairHi: P.hairHi, brow: E[0], mouth: E[1] });
  return `<g>${s}</g>`;
}
const DP = { cloak: S.darrow.cloak, leg: '#1d171c', boot: '#2a2024', armor: S.darrow.armor, armorSh: S.darrow.armorShade, trim: S.gold, body: S.darrow.armor, bodySh: S.darrow.armorShade, arm: '#1d171c', shoulder: S.darrow.armorHi, pelt: S.darrow.pelt, hair: 'spikes', hairCol: S.darrow.hair, hairHi: S.darrow.hairHi };
const CP = { cloak: null, leg: S.cassius.clothShade, boot: '#2a2024', armor: S.cassius.armor, armorSh: S.cassius.armorShade, trim: S.silver, body: S.cassius.cloth, bodySh: S.cassius.clothShade, arm: S.cassius.cloth, shoulder: S.cassius.armor, pelt: null, hair: 'curls', hairCol: S.cassius.hair, hairHi: S.cassius.hairHi };
const pick = (file, name) => { if (process.argv.includes('--standin')) return null; try { const m = require(file); const fn = typeof m === 'function' ? m : (m[name] || m.draw || m.default); if (typeof fn === 'function') { console.log('using real model', file); return fn; } } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') console.log('model', file, 'failed:', e.message); } return null; };
const STANDIN_ANCHORS = { darrowHairTop: 1.1, cassiusSeatedHairTop: 0.49 };
const deps = {
  darrow: pick('../models/darrow.js', 'darrow') || ((x, y, h, o) => figure(x, y, h, DP, o)),
  cassius: pick('../models/cassius.js', 'cassius') || ((x, y, h, o) => figure(x, o.pose === 'seated' ? y + 0.344 * h : y, h, CP, o)), // seated: y = table edge
  lighting: process.argv.includes('--nolight') ? undefined : (() => { try { const L = require('../lighting.js'); return L && L.grade ? L : undefined; } catch (e) { return undefined; } })(),
};
if (process.argv.includes('--standin')) deps.anchors = STANDIN_ANCHORS;

// ---------- render ----------
const font = `data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'fonts/anton.woff2')).toString('base64')}`;
const PAGE = `<style>@font-face{font-family:Anton;src:url(${font})}html,body{margin:0;background:#000;overflow:hidden}#w{position:absolute;left:0;top:0;width:1080px;height:1920px;transform-origin:0 0}</style><div id="w"></div>`;
async function page(b, scale) { const p = await b.newPage({ viewport: { width: 1080 * scale, height: 1920 * scale } }); await p.setContent(PAGE); await p.evaluate(s => { document.getElementById('w').style.transform = `scale(${s})`; return document.fonts.load('88px Anton'); }, scale); return p; }
const put = (p, t) => p.evaluate(h => { document.getElementById('w').innerHTML = h; }, shot.frame(t, deps));
const guides = `<div style="position:absolute;left:150px;top:270px;width:780px;height:290px;outline:3px dashed #0f0"></div><div style="position:absolute;left:0;top:1540px;width:1080px;height:0;outline:2px dashed #f0f"></div>`;

(async () => {
  const mode = process.argv[2] || 'stills', out = path.join(ROOT, 'out'); fs.mkdirSync(out, { recursive: true });
  const b = await chromium.launch();
  if (mode === 'stills' || mode === 'at') {
    const g = process.argv.includes('--guides');
    const times = mode === 'at' ? [[process.argv[4] || 'at', +process.argv[3]]] : [0.3, 0.62, 0.9, 1.6, 2.4, 3.2, 4.1, 5.4, 5.9, 7.2, 8.0, 9.5].map((t, i) => [String(i + 1).padStart(2, '0'), t]);
    const p = await page(b, 1);
    for (const [n, t] of times) { await put(p, t); if (g) await p.evaluate(h => document.getElementById('w').insertAdjacentHTML('beforeend', h), guides); await p.screenshot({ path: `${out}/comp-${n}.png` }); }
  } else {
    const dir = process.argv[3] || path.join(require('os').tmpdir(), 'bellona-frames'); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const N = Math.round(shot.DUR * shot.FPS), WORKERS = 4, t0 = Date.now();
    await Promise.all(Array.from({ length: WORKERS }, async (_, w) => { const p = await page(b, 0.5);
      for (let i = w; i < N; i += WORKERS) { await put(p, i / shot.FPS); await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92 }); } }));
    const ms = Date.now() - t0; console.log(`${N} frames in ${(ms / 1000).toFixed(1)}s  (${(ms / N).toFixed(0)} ms/frame wall, ${WORKERS} workers)`);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(shot.FPS), '-i', `${dir}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', `${out}/bellona-preview.mp4`]);
  }
  await b.close();
})();
