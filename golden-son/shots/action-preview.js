// Previews: the Darrow vs Cassius duel (whip-razors, impact on first hit) and the Iron Rain (slicing Golds, wolf jaws).
// node shots/action-preview.js [duel|rain] -> duel-preview.mp4 / ironrain-preview.mp4 + out/<name>-sheet.jpg
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, FPS = 30, L = require('../lighting.js'), K = require('../cast.js'), C = require('../chibi2.js');
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), eo = u => 1 - Math.pow(1 - cl(u), 3), io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }, lerp = (a, b, u) => a + (b - a) * u;
const f = v => v.toFixed(1);
const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const font = n => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${n}`).toString('base64')}`;

// razor: a whip-blade from the hand. ext 0..1 = coiled -> fully extended; ang = direction (rad); wave = whip ripple; rigid = straight sword
function razor(hx, hy, ang, ext, t, o = {}) {
  const len = (o.len || 520) * (0.18 + 0.82 * ext), segs = 22, wave = (o.wave ?? 1) * (1 - (o.rigid || 0)), pts = [];
  for (let i = 0; i <= segs; i++) { const u = i / segs, d = u * len, coil = (1 - ext) * 2.2;
    const off = Math.sin(u * 9 - t * 14) * 26 * u * wave + Math.sin(u * Math.PI * coil) * 90 * (1 - ext) * u;
    pts.push([hx + Math.cos(ang) * d - Math.sin(ang) * off, hy + Math.sin(ang) * d + Math.cos(ang) * off]); }
  const d = 'M' + pts.map(p => p.map(f).join(' ')).join(' L');
  return `<path d="${d}" stroke="#1b1210" stroke-width="22" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${o.col || '#e9eef4'}" stroke-width="13" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".85"/>`
    + `<rect x="${f(hx - 16)}" y="${f(hy - 16)}" width="32" height="32" rx="6" fill="#3a2418" stroke="#1b1210" stroke-width="5" transform="rotate(${f(ang * 57.3)} ${f(hx)} ${f(hy)})"/>`
    + (o.trail ? `<path d="${d}" stroke="${o.col || '#e9eef4'}" stroke-width="60" fill="none" stroke-linecap="round" opacity=".18"/>` : '');
}
const tipOf = (hx, hy, ang, ext, len = 520) => { const d = len * (0.18 + 0.82 * ext); return [hx + Math.cos(ang) * d, hy + Math.sin(ang) * d]; };
function impact(x, y, u, s = 1) { if (u < 0 || u > 1) return ''; let o = '';
  for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + .2, r0 = 40 + 260 * eo(u), r1 = r0 + 120 * (1 - u); o += `<line x1="${f(x + Math.cos(a) * r0 * s)}" y1="${f(y + Math.sin(a) * r0 * s)}" x2="${f(x + Math.cos(a) * r1 * s)}" y2="${f(y + Math.sin(a) * r1 * s)}" stroke="#fff6d0" stroke-width="${f(12 * (1 - u))}" stroke-linecap="round"/>`; }
  for (let i = 0; i < 10; i++) { const a = i * 2.4, r = 380 * eo(u) * (0.6 + (i % 3) * .2); o += `<circle cx="${f(x + Math.cos(a) * r * s)}" cy="${f(y + Math.sin(a) * r * s * .8 + 200 * u * u)}" r="${f(7 * (1 - u))}" fill="#ffd36a"/>`; }
  return o + `<circle cx="${x}" cy="${y}" r="${f((60 + 340 * eo(u)) * s)}" fill="none" stroke="#fff" stroke-width="${f(14 * (1 - u))}" opacity="${f(1 - u)}"/>` + L.glow(x, y, 220 * s, '#fff3c4', (1 - u) * .9); }
const swoosh = (cx, cy, r, a0, a1, u, col = '#e9eef4') => { if (u <= 0 || u >= 1.4) return ''; const k = cl(u), a = lerp(a0, a1, eo(k)); const p = (ang, rr) => [cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr];
  const [x0, y0] = p(a0, r), [x1, y1] = p(a, r), [x2, y2] = p(a, r * .82), [x3, y3] = p(a0, r * .9);
  return `<path d="M${f(x0)} ${f(y0)} A${r} ${r} 0 0 ${a1 > a0 ? 1 : 0} ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${r * .82} ${r * .82} 0 0 ${a1 > a0 ? 0 : 1} ${f(x3)} ${f(y3)} Z" fill="${col}" opacity="${f(.85 * (1 - cl((u - 1) / .4)))}"/>`; };
const shakeG = (svg, t, t0, amp = 14) => { const k = t - t0; if (k < 0 || k > .35) return svg; const a = amp * Math.exp(-k * 12); return `<g transform="translate(${f(a * Math.sin(t * 90))} ${f(a * Math.cos(t * 77))})">${svg}</g>`; };
const flash = (t, t0, col = '#fff', a = .7) => { const k = t - t0; return k < 0 || k > .25 ? '' : `<rect width="${W}" height="${H}" fill="${col}" opacity="${f(a * (1 - k / .25))}"/>`; };
const cap = (l1, l2, c2 = '#e8372c') => `<div class="cap"><div class="l1">${l1}</div>${l2 ? `<div class="l2" style="color:${c2}">${l2}</div>` : ''}</div>`;

// ---------------- DUEL (5.6 s) ----------------
function duel(t) {
  const FY = 1640, DX = lerp(230, 290, eo((t - 1.0) / .4)), CX = lerp(860, 800, eo((t - 1.0) / .4));
  const T1 = 1.4, T2 = 2.6, T3 = 3.7; // first clash, second clash, the finishing cut
  // poses
  const dPose = t < 1 ? 'guard' : t < T2 ? 'thrust' : t < T3 - .25 ? 'slashUp' : 'slashDown';
  const cPose = t < 1 ? 'guard' : t < T3 ? (t < T2 ? 'thrust' : 'slashUp') : 'hang';
  const [dhx, dhy] = C.handAt(DX, FY, 330, 1, dPose, 14), [chx, chy] = C.handAt(CX, FY, 320, -1, cPose, -14);
  // razor angles/extension
  const dExt = t < 1 ? 0 : t < T1 ? eo((t - 1) / .4) : 1, cExt = t < 1 ? 0 : t < T1 ? eo((t - 1) / .4) : t < T3 ? 1 : 0;
  const meet = [(dhx + chx) / 2, Math.min(dhy, chy) - 10];
  let dAng = Math.atan2(meet[1] - dhy, meet[0] - dhx), cAng = Math.atan2(meet[1] - chy, meet[0] - chx);
  if (t >= T2 - .3 && t < T3 - .25) { dAng = lerp(-1.9, -0.9, io((t - (T2 - .3)) / .6)); cAng = lerp(-1.3, -2.2, io((t - (T2 - .3)) / .6)); }
  if (t >= T3 - .25) { dAng = lerp(-1.2, 0.5, io((t - (T3 - .25)) / .35)); }
  const dLen = Math.hypot(meet[0] - dhx, meet[1] - dhy) / 0.98, cLen = Math.hypot(meet[0] - chx, meet[1] - chy) / 0.98;
  const casDown = t > T3 + .1, sink = casDown ? 70 * eo((t - T3 - .1) / .4) : 0;
  let s = `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: 1500 })}</g>`;
  for (let i = 0; i < 12; i++) { const x = ((i * 191 + 40) % 1300) - 110, sc = 110 * (0.85 + ((i * 7) % 5) / 15); s += `<circle cx="${x}" cy="${1500 - sc * 1.9}" r="${sc * .38}" fill="#14141c"/><path d="M${x - sc * .5} 1500 Q${x - sc * .5} ${1500 - sc * 1.5} ${x} ${1500 - sc * 1.55} Q${x + sc * .5} ${1500 - sc * 1.5} ${x + sc * .5} 1500Z" fill="#14141c"/>`; }
  s += L.floorShadow(DX, FY + 6, 280, { mood: 'gala' }) + L.floorShadow(CX, FY + 6, 280, { mood: 'gala' });
  s += `<g transform="translate(0 ${f(sink)})">` + L.rimLight(K.cassius(CX, FY, 320, { yaw: -14, brow: casDown ? 'sad' : 'angry', mouth: 'frown', arms: casDown ? ['cross', 'hang'] : ['hang', cPose] }), 'gala') + (cExt > 0 ? razor(chx, chy, cAng, cExt, t, { len: cLen, wave: t < T1 ? 1 : .35, col: '#dfe8f4' }) : '') + '</g>';
  if (casDown) s += `<g transform="translate(${f(CX + 60)} ${f(FY - 20 + 60 * eo((t - T3 - .1) / .4))}) rotate(${f(80 * eo((t - T3) / .5))})">${razor(0, 0, 0, .15, t, { len: 300, wave: 0 })}</g>`;
  s += L.rimLight(K.darrow(DX, FY, 330, { yaw: 14, brow: 'angry', mouth: t > T3 + .3 ? 'smirk' : 'flat', arms: ['hang', dPose], wind: t, armed: true }), 'gala') + (dExt > 0 || t >= 1 ? razor(dhx, dhy, dAng, Math.max(dExt, .05), t, { len: t >= T2 - .3 ? 560 : dLen, wave: t < T1 ? 1 : .3, trail: t >= T3 - .25 && t < T3 + .2 }) : '');
  s += t >= T3 - .25 ? swoosh(DX + 60, FY - 520, 430, -2.2, 0.6, (t - (T3 - .25)) / .35) : '';
  s += impact(meet[0], meet[1], (t - T1) / .55, 1.2) + impact(meet[0] - 40, meet[1] - 120, (t - T2) / .45, .8) + impact(CX - 40, FY - 520, (t - T3) / .5, .9);
  const z = t < T1 ? lerp(1.0, 1.12, io(t / T1)) : t < T1 + .25 ? 1.22 : lerp(1.16, 1.08, io((t - T1) / 3));
  let out = `<g transform="translate(540 1000) scale(${f(z * 100) / 100}) translate(-540 -1180)">${s}</g>`;
  out = shakeG(shakeG(shakeG(out, t, T1, 20), t, T2, 12), t, T3, 16) + flash(t, T1, '#fff', .75) + flash(t, T3, '#fff', .5);
  const c = t < T1 ? ['A DUEL.', 'IN FRONT OF EVERYONE.'] : t < T3 ? ['RAZORS DRAWN.', 'BELLONA VS. THE REAPER.'] : ['DARROW WINS.', "HE TAKES CASSIUS'S SWORD ARM."];
  return { svg: out, cap: cap(...c) };
}
// ---------------- IRON RAIN (6.4 s) ----------------
function rain(t) {
  const FY = 1660, LAND = .7, CUTS = [2.0, 3.1, 4.3]; // three Golds cut down, the last under the wolf jaws
  let s = L.skyOrRoom('mars', t, { floorY: 1440, sunX: 280, sunH: 420 });
  let st = ''; for (let i = 0; i < 40; i++) { const sp = .5 + ((i * 37) % 10) / 14, ph = ((i * 61) % 100) / 100, k = ((t * sp * .55 + ph) % 1), x0 = ((i * 211) % 1500) - 150, far = i % 3, x = x0 - 260 * k, y = -250 + 1500 * k, len = far ? 130 : 240, wd = far ? 5 : 10; st += `<g opacity="${f((far ? .55 : .95) * Math.min(1, k * 6) * (1 - Math.pow(k, 6)))}"><line x1="${f(x + len * .17)}" y1="${f(y - len)}" x2="${f(x)}" y2="${f(y)}" stroke="#ffcf7a" stroke-width="${wd}" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="${wd * 1.1}" fill="#fff"/></g>`; }
  s += L.screen(st);
  // Darrow drops from orbit
  const DX = t < CUTS[0] ? 300 : t < CUTS[1] ? 400 : t < CUTS[2] ? 500 : 560;
  const fall = t < LAND ? -2200 * Math.pow(1 - t / LAND, 2) : 0;
  // enemies (Bellona Golds)
  const foes = [[700, 'karnus'], [850, 'guard'], [960, 'guard']];
  foes.forEach(([x, kind], i) => { const tc = CUTS[i], hit = t > tc, u = hit ? eo((t - tc) / .5) : 0, adv = t < tc ? lerp(80, 0, eo((t - LAND) / 1)) : 0;
    const fig = (kind === 'karnus' ? K.karnus : K.guard)(x + adv, FY, kind === 'karnus' ? 280 : 250, { yaw: -16, brow: hit ? 'sad' : 'angry', mouth: 'frown', arms: hit ? ['cross', 'cross'] : ['hang', 'thrust'], kitOverride: kind === 'guard' ? { fill: '#2b4a8a', shade: '#16294a', trim: '#d8e0ea', hairCol: '#d9b25a', leg: '#16294a' } : {} });
    s += `<g transform="translate(${f(160 * u)} ${f(40 * u)}) rotate(${f(70 * u)} ${f(x)} ${FY})" opacity="${f(1 - .85 * cl((t - tc - .25) / .4))}">${L.rimLight(fig, 'mars')}</g>`; });
  // Darrow slices: pose + whip razor sweeping toward the current foe
  const ci = CUTS.findIndex(c => t < c + .35), tc = CUTS[Math.max(0, ci)] ?? CUTS[2], ph = t - (tc - .3);
  const pose = t < LAND + .3 ? 'hang' : ph > 0 && ph < .65 ? (ph < .3 ? 'slashUp' : 'slashDown') : 'thrust';
  const [hx, hy] = C.handAt(DX, FY, 340, 1, pose, 12);
  const ang = ph > 0 && ph < .65 ? lerp(-2.0, 0.6, io(ph / .5)) : -0.25;
  let d = L.floorShadow(DX, FY + 6, 280, { mood: 'mars' }) + `<g transform="translate(0 ${f(fall)})">${L.rimLight(K.darrow(DX, FY, 340, { yaw: 12, brow: 'angry', mouth: 'flat', arms: ['hang', pose], wind: t, armed: t > LAND }), 'mars')}${t > LAND ? razor(hx, hy, ang, eo((t - LAND) / .4), t, { len: 560, wave: ph > 0 && ph < .65 ? .25 : .9, trail: ph > .2 && ph < .6, col: '#f2f6fa' }) : ''}</g>`;
  CUTS.forEach((c, i) => { d += swoosh(DX + 60, FY - 500, 450, -2.0, 0.7, (t - (c - .3)) / .4, i === 2 ? '#ffe6a8' : '#e9eef4'); });
  // landing impact
  d += impact(DX, FY - 10, (t - LAND) / .6, 1.3);
  // wolf jaws over Darrow on the last cut
  const J = CUTS[2] - .55, ju = cl((t - J) / .5), jc = cl((t - (CUTS[2] - .05)) / .2), jf = 1 - cl((t - CUTS[2] - .5) / .5);
  if (t > J && jf > 0) { const cx = DX + 120, cy = FY - 560, sp = lerp(330, 40, eo(jc)) * (0.6 + 0.4 * eo(ju)), sc = 0.8 + 0.4 * eo(ju);
    const jaw = (dir) => { let teeth = ''; for (let i = 0; i < 7; i++) { const x = -330 + i * 100; teeth += `<path d="M${x} 0 l40 ${dir * 90} l40 ${-dir * 90}Z" fill="#f4f1ea"/>`; } return `<g transform="translate(0 ${f(dir * sp)}) scale(1 ${dir})"><path d="M-430 0 Q-300 -280 0 -330 Q330 -300 470 -60 Q500 0 440 20 L-430 20 Z" fill="#1a0f22" opacity=".55" stroke="#ffcf6a" stroke-width="10" stroke-opacity=".9"/><path d="M-380 -40 Q-200 -230 60 -250" stroke="#ffcf6a" stroke-width="14" fill="none" opacity=".7"/>${teeth}<circle cx="-120" cy="-210" r="26" fill="#ffcf3a"/></g>`; };
    d += `<g opacity="${f(jf * eo(ju))}" transform="translate(${cx} ${cy}) scale(${f(sc)})">${jaw(-1)}${jaw(1)}</g>`; }
  s += d;
  let out = `<g transform="translate(540 1000) scale(${f(lerp(1.0, 1.08, io(t / 6.4)) * 100) / 100}) translate(-560 -1160)">${s}</g>`;
  out = shakeG(out, t, LAND, 22); CUTS.forEach(c => { out = shakeG(out, t, c, 10); });
  out += flash(t, LAND, '#fff3c4', .6) + flash(t, CUTS[2], '#ffe6a8', .55);
  const c = t < 1.8 ? ['AN ARMY FROM ORBIT.', 'THE IRON RAIN.', '#ffe08a'] : t < CUTS[2] - .6 ? ['THE REAPER LANDS.', 'GOLDS FALL.', '#ffe08a'] : ['MARS FALLS.', 'TO DARROW.', '#ffe08a'];
  return { svg: out, cap: cap(...c) };
}
const SHOTS = { duel: [duel, 5.6], rain: [rain, 6.4] };
(async () => {
  const which = process.argv[2] ? [process.argv[2]] : Object.keys(SHOTS), b = await chromium.launch();
  const PAGE = `<style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}html,body{margin:0;background:#000;overflow:hidden}#w{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden}#w svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:80px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.6),0 0 40px rgba(0,0,0,.7)}.l1{color:#f6ead2}</style><div id="w"></div>`;
  for (const k of which) { const [fn, dur] = SHOTS[k], N = Math.round(dur * FPS), dir = path.join(require('os').tmpdir(), 'act-' + k); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await Promise.all([0, 1, 2, 3].map(async w => { const p = await b.newPage({ viewport: { width: W, height: H } }); await p.setContent(PAGE); await p.evaluate(() => document.fonts.load('80px Anton'));
      for (let i = w; i < N; i += 4) { const { svg, cap: c } = fn(i / FPS); await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${svg}${L.grade(k === 'duel' ? 'gala' : 'mars', {})}</svg>${c}`); await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 }); }
      await p.close(); }));
    const name = k === 'duel' ? 'duel-preview' : 'ironrain-preview';
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', `${dir}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-movflags', '+faststart', `${ROOT}/${name}.mp4`]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${ROOT}/${name}.mp4`, '-vf', 'fps=2.2,scale=180:-1,tile=7x2', '-frames:v', '1', `${ROOT}/out/${name}-sheet.jpg`]);
    console.log(name, N); }
  await b.close();
})();
