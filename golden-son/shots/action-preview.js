// Previews: the Darrow vs Cassius duel (whip-razors, impact on first hit) and the Iron Rain (slicing Golds, wolf jaws).
// node shots/action-preview.js [duel|rain] -> duel-preview.mp4 / ironrain-preview.mp4 + out/<name>-sheet.jpg
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, FPS = 30, L = require('../lighting.js'), K = require('../cast.js'), C = require('../chibi2.js');
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), eo = u => 1 - Math.pow(1 - cl(u), 3), io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; }, lerp = (a, b, u) => a + (b - a) * u;
const f = v => v.toFixed(1);
const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const font = n => `data:font/woff2;base64,${fs.readFileSync(`${ROOT}/fonts/${n}`).toString('base64')}`;

// razor: segmented whip-blade. ext 0..1 = coiled at the wrist -> full length; stiff 0..1 = flowing whip -> rigid sword.
// theme: {edge, glow} colours. A light pulse runs down the blade while it locks stiff.
function razor(hx, hy, ang, ext, t, o = {}) {
  const th = o.theme || { edge: '#ffd36a', glow: '#ffb02e', steel: '#eef2f7' }, stiff = cl(o.stiff ?? 0), len = (o.len || 520) * (0.12 + 0.88 * ext), N = 30;
  const ca = Math.cos(ang), sa = Math.sin(ang), pts = [];
  // coiled: loops around the wrist; extended: whip wave that dies out as it stiffens
  for (let i = 0; i <= N; i++) { const u = i / N;
    if (ext < 0.12) { const k = 1 - ext / 0.12, a = u * Math.PI * 4.2 + t * 3, r = 38 + u * 22; pts.push([hx + Math.cos(a) * r * (0.6 + 0.4 * k) + ca * u * 60 * (1 - k), hy + Math.sin(a) * r * 0.55 * (0.6 + 0.4 * k) + sa * u * 60 * (1 - k)]); continue; }
    const d = u * len * (1 - .18 * stiff * u * u), w = (1 - stiff) * (Math.sin(u * 8.5 - t * 13) * 34 * u + Math.sin(u * Math.PI * 1.6) * 60 * (1 - ext) * u) + stiff * (o.hook ?? 1) * (Math.sin(u * Math.PI * .9) * len * .26 + Math.pow(u, 6) * len * .22);
    pts.push([hx + ca * d - sa * w, hy + sa * d + ca * w]); }
  // tapered blade outline from the centre line
  const L1 = [], L2 = [];
  for (let i = 0; i <= N; i++) { const p = pts[i], q = pts[Math.min(N, i + 1)], r0 = pts[Math.max(0, i - 1)], dx = q[0] - r0[0], dy = q[1] - r0[1], m = Math.hypot(dx, dy) || 1, nx = -dy / m, ny = dx / m, u = i / N;
    const wd = (ext < 0.12 ? 7 : 15 + 14 * stiff * Math.sin(Math.PI * u)) * (1 - u * 0.6) * (u > 0.94 ? (1 - u) / 0.06 : 1) + 1.5; L1.push([p[0] + nx * wd, p[1] + ny * wd]); L2.push([p[0] - nx * wd, p[1] - ny * wd]); }
  const outline = 'M' + L1.map(p => p.map(f).join(' ')).join(' L') + ' L' + L2.reverse().map(p => p.map(f).join(' ')).join(' L') + ' Z';
  const spine = 'M' + pts.map(p => p.map(f).join(' ')).join(' L');
  // segment notches every few points
  let notches = ''; for (let i = 3; i < N - 1; i += 3) { const a = L1[i], b = L2[N - i]; if (a && b) notches += `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="#5a6676" stroke-width="2.5" opacity=".8"/>`; }
  // lock pulse: a bright bead that runs hilt -> tip while stiffening
  const pu = o.pulse ?? -1; let pulse = '';
  if (pu >= 0 && pu <= 1) { const k = Math.min(N, Math.round(pu * N)), p = pts[k]; pulse = L.glow(p[0], p[1], 70, th.edge, .95) + `<circle cx="${f(p[0])}" cy="${f(p[1])}" r="12" fill="#fff"/>`; }
  const glowA = 0.35 + 0.25 * stiff + (o.hot ? .3 : 0);
  return `<g>
    <path d="${spine}" stroke="${th.glow}" stroke-width="${ext < .12 ? 26 : 46}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${f(glowA * .45)}"/>
    <path d="${spine}" stroke="${th.glow}" stroke-width="${ext < .12 ? 16 : 28}" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="${f(glowA)}"/>
    <path d="${outline}" fill="${th.steel}" stroke="#141018" stroke-width="5" stroke-linejoin="round"/>
    ${notches}
    <path d="${spine}" stroke="#ffffff" stroke-width="3" fill="none" opacity=".9"/>
    <path d="${outline}" fill="none" stroke="${th.edge}" stroke-width="2.5" opacity=".95"/>
    ${o.trail ? `<path d="${spine}" stroke="${th.edge}" stroke-width="70" fill="none" stroke-linecap="round" opacity=".16"/>` : ''}
    ${pulse}
    <g transform="translate(${f(hx)} ${f(hy)}) rotate(${f(ang * 57.3)})">
      <rect x="-58" y="-11" width="56" height="22" rx="6" fill="#2a1a12" stroke="#141018" stroke-width="5"/>
      ${[-48, -36, -24, -12].map(x => `<line x1="${x}" y1="-11" x2="${x + 6}" y2="11" stroke="#6b4a32" stroke-width="3"/>`).join('')}
      <circle cx="-64" cy="0" r="12" fill="${th.edge}" stroke="#141018" stroke-width="4"/>
      <path d="M-4 -34 Q6 -30 10 -18 L10 18 Q6 30 -4 34 L2 0 Z" fill="${th.edge}" stroke="#141018" stroke-width="4" stroke-linejoin="round"/>
      <circle cx="4" cy="0" r="7" fill="${th.glow}" stroke="#141018" stroke-width="3"/>
    </g></g>`;
}
const GOLD = { edge: '#ffd36a', glow: '#ffae2a', steel: '#f2f4f8' }, STEEL = { edge: '#9fd0ff', glow: '#5aa8ff', steel: '#e6eef8' };
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
  const dPose = t < .9 ? 'guard' : t < T2 - .3 ? 'slashUp' : t < T3 - .25 ? 'slashUp' : 'slashDown';
  const cPose = t < .9 ? 'guard' : t < T3 ? 'slashUp' : 'hang';
  const [dhx, dhy] = C.handAt(DX, FY, 330, 1, dPose, 14), [chx, chy] = C.handAt(CX, FY, 320, -1, cPose, -14);
  // razor angles/extension
  const dExt = t < .9 ? 0.02 : t < T1 ? eo((t - .9) / .45) : 1, cExt = t < .9 ? 0.02 : t < T1 ? eo((t - .9) / .45) : t < T3 ? 1 : 0;
  const meet = [(dhx + chx) / 2, Math.min(dhy, chy) - 330];
  let dAng = Math.atan2(meet[1] - dhy, meet[0] - dhx), cAng = Math.atan2(meet[1] - chy, meet[0] - chx);
  if (t >= T2 - .3 && t < T3 - .25) { dAng = lerp(-1.9, -0.9, io((t - (T2 - .3)) / .6)); cAng = lerp(-1.3, -2.2, io((t - (T2 - .3)) / .6)); }
  if (t >= T3 - .25) { dAng = lerp(-1.2, 0.5, io((t - (T3 - .25)) / .35)); }
  const dLen = Math.hypot(meet[0] - dhx, meet[1] - dhy) * 1.35, cLen = Math.hypot(meet[0] - chx, meet[1] - chy) * 1.35;
  const casDown = t > T3 + .1, sink = casDown ? 70 * eo((t - T3 - .1) / .4) : 0;
  let s = `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: 1500 })}</g>`;
  for (let i = 0; i < 12; i++) { const x = ((i * 191 + 40) % 1300) - 110, sc = 110 * (0.85 + ((i * 7) % 5) / 15); s += `<circle cx="${x}" cy="${1500 - sc * 1.9}" r="${sc * .38}" fill="#14141c"/><path d="M${x - sc * .5} 1500 Q${x - sc * .5} ${1500 - sc * 1.5} ${x} ${1500 - sc * 1.55} Q${x + sc * .5} ${1500 - sc * 1.5} ${x + sc * .5} 1500Z" fill="#14141c"/>`; }
  s += L.floorShadow(DX, FY + 6, 280, { mood: 'gala' }) + L.floorShadow(CX, FY + 6, 280, { mood: 'gala' });
  s += `<g transform="translate(0 ${f(sink)})">` + L.rimLight(K.cassius(CX, FY, 320, { yaw: -14, brow: casDown ? 'sad' : 'angry', mouth: 'frown', arms: casDown ? ['cross', 'hang'] : [cPose, 'hang'], armed: true, noArm: t >= T3 ? 1 : 0 }), 'gala') + (t >= T3 ? '' : razor(chx, chy, cAng, cExt, t, { len: cLen, theme: STEEL, stiff: t < T1 - .18 ? 0 : t < T2 - .3 ? 1 : t < T2 ? cl((t - (T2 - .3)) / .3) * 0 + .2 : 1, pulse: (t - (T1 - .18)) / .18 })) + '</g>';
  if (t >= T3) { // the severed sword arm (still gripping its razor) flies off and lands; bloodless, sparks at the cut
    const u = cl((t - T3) / .8), land = u >= 1, sx0 = CX + 14 * 320 * 0.0016 + 320 * 0.33, sy0 = FY - 320 * 1.55 + 320 * 0.1;
    const ax = lerp(sx0, CX + 300, eo(u)), ay = land ? FY + 40 : sy0 - 340 * Math.sin(Math.PI * u) + (FY + 40 - sy0) * u, rot = land ? 95 : 400 * u;
    const armG = C.arm(0, 0, 320, -1, 'slashUp', { sleeve: '#2b4a8a', fore: '#f0c04a', cuff: '#ffffff', hand: '#d9a777' }) + `<circle cx="0" cy="0" r="${f(320 * .09)}" fill="#3a3a44" stroke="#1b1210" stroke-width="10"/>`;
    const [hx2, hy2] = [-0.42 * 320 - 0, -0.6 * 320];
    s += `<g transform="translate(${f(ax)} ${f(ay)}) rotate(${f(rot)})">${razor(hx2, hy2, -1.6, 1, t, { len: 360, stiff: 1, theme: STEEL })}${armG}</g>`;
    if (u < .6) for (let i = 0; i < 8; i++) { const a = i * .8 + t * 6, r = 30 + 160 * u; s += `<circle cx="${f(sx0 + Math.cos(a) * r)}" cy="${f(sy0 + sink + Math.sin(a) * r * .7)}" r="${f(8 * (1 - u))}" fill="#9fd0ff"/>`; }
  }
  s += L.rimLight(K.darrow(DX, FY, 330, { yaw: 14, brow: 'angry', mouth: t > T3 + .3 ? 'smirk' : 'flat', arms: ['hang', dPose], wind: t, armed: true }), 'gala') + razor(dhx, dhy, dAng, dExt, t, { len: t >= T2 - .3 ? 560 : dLen, theme: GOLD, stiff: t < T1 - .18 ? 0 : t < T2 - .3 ? 1 : t < T3 - .1 ? .25 : 1, pulse: t < T2 ? (t - (T1 - .18)) / .18 : (t - (T3 - .1)) / .15, trail: t >= T3 - .25 && t < T3 + .2, hot: t >= T3 - .1 && t < T3 + .3 });
  s += t >= T3 - .25 ? swoosh(DX + 60, FY - 520, 430, -2.2, 0.6, (t - (T3 - .25)) / .35) : '';
  s += impact(meet[0], meet[1], (t - T1) / .55, 1.2) + impact(meet[0] - 40, meet[1] - 120, (t - T2) / .45, .8) + impact(CX - 40, FY - 520, (t - T3) / .5, .9);
  const z = t < T1 ? lerp(1.0, 1.12, io(t / T1)) : t < T1 + .25 ? 1.22 : lerp(1.16, 1.08, io((t - T1) / 3));
  let out = `<g transform="translate(540 1000) scale(${f(z * 100) / 100}) translate(${f(-540 - 70 * cl((t - T3) / .8))} -1180)">${s}</g>`;
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
    const fig = (kind === 'karnus' ? K.karnus : K.guard)(x + adv, FY, kind === 'karnus' ? 280 : 250, { yaw: -16, brow: hit ? 'sad' : 'angry', mouth: 'frown', arms: hit ? ['cross', 'cross'] : ['hang', 'thrust'], kitOverride: kind === 'guard' ? { over: [], hair: 'short', scar: true, sleeve: '#16294a', fore: '#2b4a8a', fill: '#2b4a8a', shade: '#16294a', trim: '#d8e0ea', hairCol: '#d9b25a', leg: '#16294a' } : {} });
    s += `<g transform="translate(${f(160 * u)} ${f(40 * u)}) rotate(${f(70 * u)} ${f(x)} ${FY})" opacity="${f(1 - .85 * cl((t - tc - .25) / .4))}">${L.rimLight(fig, 'mars')}</g>`; });
  // Darrow slices: pose + whip razor sweeping toward the current foe
  const ci = CUTS.findIndex(c => t < c + .35), tc = CUTS[Math.max(0, ci)] ?? CUTS[2], ph = t - (tc - .3);
  const pose = t < LAND + .3 ? 'hang' : ph > 0 && ph < .65 ? (ph < .3 ? 'slashUp' : 'slashDown') : 'thrust';
  const [hx, hy] = C.handAt(DX, FY, 340, 1, pose, 12);
  const ang = ph > 0 && ph < .65 ? lerp(-2.0, 0.6, io(ph / .5)) : -0.25;
  let d = L.floorShadow(DX, FY + 6, 280, { mood: 'mars' }) + `<g transform="translate(0 ${f(fall)})">${L.rimLight(K.darrow(DX, FY, 340, { yaw: 12, brow: 'angry', mouth: 'flat', arms: ['hang', pose], wind: t, armed: t > LAND }), 'mars')}${t > LAND ? razor(hx, hy, ang, eo((t - LAND) / .4), t, { len: 560, theme: GOLD, stiff: ph > .25 && ph < .7 ? 1 : .15, pulse: (ph - .25) / .12, trail: ph > .2 && ph < .6 }) : ''}</g>`;
  CUTS.forEach((c, i) => { d += swoosh(DX + 60, FY - 500, 450, -2.0, 0.7, (t - (c - .3)) / .4, i === 0 ? '#ffe6a8' : '#e9eef4'); });
  // landing impact
  d += impact(DX, FY - 10, (t - LAND) / .6, 1.3);
  // WOLF JAWS (manga): B&W panel, white wolf with ink detail + red eyes, Karnus a solid black silhouette whose outline/eyes turn red.
  const JA = CUTS[0] - .35, jk = t - JA, JD = .5;
  if (jk >= 0 && jk < JD) {
    const u = jk / JD, open = u < .7 ? eo(u / .7) : 1, snap = u < .7 ? 0 : eo((u - .7) / .15);
    const HS = .62 + .14 * eo(u / .7), kx = 700, ky = FY, cx = kx - 130 - 120 * (1 - eo(u / .5)), cy = FY - 560 - 140 * (1 - eo(u / .5));
    const G = 330 * open - 230 * snap, red = snap > .3;
    // manga speed lines + screentone
    let bg = `<rect x="-300" y="-300" width="1680" height="2520" fill="#f4f1ea"/>`;
    for (let i = 0; i < 70; i++) { const a = i / 70 * Math.PI * 2 + (i % 3) * .01, r0 = 330 + (i * 37) % 160; bg += `<path d="M${f(cx + Math.cos(a) * r0)} ${f(cy + Math.sin(a) * r0)} L${f(cx + Math.cos(a - .012) * 1800)} ${f(cy + Math.sin(a - .012) * 1800)} L${f(cx + Math.cos(a + .012) * 1800)} ${f(cy + Math.sin(a + .012) * 1800)} Z" fill="#111"/>`; }
    // Karnus silhouette
    const kar = K.karnus(kx, ky, 280, { yaw: -16, brow: 'sad', mouth: 'flat', blink: true, arms: ['raise', 'raise'], kitOverride: { hair: 'none' } });
    const sil = `<g>${kar.replace(/fill="(?!none)[^"]*"/g, 'fill="#050505"').replace(/stroke="[^"]*"/g, `stroke="${red ? '#e8251c' : '#050505'}"`).replace(/stroke-width="([\d.]+)"/g, (m, w) => `stroke-width="${(+w * (red ? 1.4 : 1)).toFixed(1)}"`)}</g>`;
    const SS = 280 * 1.12, rr = SS * .42, hx = kx, hy = ky - SS * 1.55 - rr + SS * .02;
    const kHair = `<path d="M${f(hx - rr)} ${f(hy - rr * .2)} L${f(hx - rr * .7)} ${f(hy - rr * 1.35)} L${f(hx - rr * .3)} ${f(hy - rr * .95)} L${f(hx)} ${f(hy - rr * 1.55)} L${f(hx + rr * .3)} ${f(hy - rr * .95)} L${f(hx + rr * .72)} ${f(hy - rr * 1.35)} L${f(hx + rr)} ${f(hy - rr * .2)} Z" fill="#050505" stroke="${red ? '#e8251c' : '#050505'}" stroke-width="10" stroke-linejoin="round"/>`;
    const kEyes = red ? [-1, 1].map(d => `<path d="M${f(hx + d * rr * .55)} ${f(hy - rr * .05)} L${f(hx + d * rr * .15)} ${f(hy + rr * .08)}" stroke="#ff2a1a" stroke-width="12" stroke-linecap="round"/>${L.glow(hx + d * rr * .35, hy, 40, '#ff2a1a', .8)}`).join('') : '';
    // white wolf head, manga ink
    const fur = (x, y, n, len, ang) => Array.from({ length: n }, (_, i) => { const a = ang + (i - n / 2) * .06, l = len * (.7 + (i % 3) * .15); return `<path d="M${f(x + i * 6)} ${f(y + (i % 2) * 8)} q${f(Math.cos(a) * l * .5)} ${f(Math.sin(a) * l * .5 - 6)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}" stroke="#111" stroke-width="4" fill="none" stroke-linecap="round"/>`; }).join('');
    let teeth = '';
    for (let i = 0; i < 10; i++) { const x = -200 + i * 72, h = (i === 8 ? 165 : i % 2 ? 80 : 115), yT = -G + 30 + i * 8; teeth += `<path d="M${x - 24} ${yT} Q${x} ${yT + h * .55} ${x + 4} ${yT + h} Q${x + 10} ${yT + h * .5} ${x + 26} ${yT} Z" fill="#fff" stroke="#c4ccd8" stroke-width="5"/>`; }
    for (let i = 0; i < 9; i++) { const x = -190 + i * 72, h = (i === 7 ? 150 : i % 2 ? 72 : 105), yB = G - 30 - i * 6; teeth += `<path d="M${x - 24} ${yB} Q${x} ${yB - h * .55} ${x + 2} ${yB - h} Q${x + 10} ${yB - h * .5} ${x + 26} ${yB} Z" fill="#fff" stroke="#c4ccd8" stroke-width="5"/>`; }
    const ruff = Array.from({ length: 11 }, (_, i) => { const a = (-150 + i * 22) * Math.PI / 180, r1 = 420, r2 = 560 + (i % 2) * 80; return `L${f(-380 + Math.cos(a) * r2)} ${f(Math.sin(a) * r2 * .9)} L${f(-380 + Math.cos(a + .14) * r1)} ${f(Math.sin(a + .14) * r1 * .9)}`; }).join(' ');
    const W1 = '#ffffff', SH = '#dfe4ec', SH2 = '#c4ccd8', LN = '#b8c0cc', LW = 10, MOUTH = '#8a1420';
    // wolf eye: almond, slanted, red iris with a vertical slit
    // furious eye: narrow slanted slit under a heavy furrowed brow, burning red, slit pupil
    const eye = `<g transform="translate(40 -420) scale(1.45) translate(-40 420)"><path d="M-100 -380 Q10 -420 170 -455 Q120 -385 -100 -380 Z" fill="#ff3a1a" stroke="#7a1018" stroke-width="7"/>
      <path d="M50 -428 L58 -398 L64 -428 Z" fill="#2a0306"/><circle cx="105" cy="-440" r="7" fill="#fff"/>
      ${L.glow(40, -415, 160, '#ff1a0a', .95)}${L.glow(40, -415, 70, '#ffd0a0', .6)}
      <path d="M-170 -420 Q-20 -455 200 -525 L210 -490 Q0 -420 -150 -395 Z" fill="#9aa4b4" stroke="${LN}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-60 -470 Q-80 -520 -40 -560 M20 -485 Q10 -530 50 -565" stroke="#8a94a4" stroke-width="10" fill="none" stroke-linecap="round"/></g>`;
    // snarl wrinkles on the muzzle + bared gums above the upper teeth
    const snarl = `<path d="M240 -390 Q290 -440 350 -410 M285 -355 Q340 -400 400 -370 M330 -320 Q385 -360 440 -330" stroke="#8a94a4" stroke-width="14" fill="none" stroke-linecap="round"/>
      <path d="M-150 -${G - 40} L560 -${G - 40} L540 -${G - 75} Q200 -${G - 50} -150 -${G - 75} Z" fill="#d94a5a"/>`;
    const head = `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(HS)})">
      <path d="M-380 -470 ${ruff} L-380 470 Z" fill="${SH}" stroke="${LN}" stroke-width="${LW}" stroke-linejoin="round"/>
      <path d="M-330 0 L-470 -230 Q-470 -520 -170 -560 L-40 -560 Q200 -470 420 -330 L600 -${G + 20} Q640 -${G} 610 -${G - 40} L-150 -${G - 40} Z" fill="${W1}" stroke="${LN}" stroke-width="${LW}" stroke-linejoin="round"/>
      <path d="M-470 -230 Q-470 -520 -170 -560 L-120 -560 Q-360 -470 -380 -230 Z" fill="${SH}"/>
      <path d="M-330 0 L-470 220 Q-430 470 -120 470 Q200 430 520 ${G + 10} Q540 ${G - 30} 500 ${G - 40} L-150 ${G - 40} Z" fill="${W1}" stroke="${LN}" stroke-width="${LW}" stroke-linejoin="round"/>
      <path d="M-470 220 Q-430 470 -120 470 Q100 450 300 360 Q20 400 -200 380 Q-380 340 -470 220 Z" fill="${SH}"/>
      <path d="M-330 0 L-150 -${G - 40} L560 -${G - 40} L500 ${G - 40} L-150 ${G - 40} Z" fill="${MOUTH}"/>
      <path d="M-300 -470 L-600 -720 L-160 -560 Z M-80 -540 L-420 -800 L80 -510 Z" fill="${W1}" stroke="${LN}" stroke-width="${LW}" stroke-linejoin="round"/>
      <path d="M-290 -515 L-520 -690 L-190 -560 Z M-70 -540 L-360 -755 L50 -520 Z" fill="#f2c4cc"/>
      <ellipse cx="590" cy="-${G + 10}" rx="44" ry="32" fill="#8a7a80"/>
      ${snarl}${eye}
      </g>`;
    const teethG = `<g transform="translate(${f(cx)} ${f(cy)}) scale(${f(HS)})">${teeth}</g>`;
    const impactLines = snap > 0 ? Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<line x1="${f(kx + Math.cos(a) * 260)}" y1="${f(hy + 80 + Math.sin(a) * 260)}" x2="${f(kx + Math.cos(a) * (360 + 200 * snap))}" y2="${f(hy + 80 + Math.sin(a) * (360 + 200 * snap))}" stroke="#e8251c" stroke-width="12" stroke-linecap="round"/>`; }).join('') : '';
    d += `<g><g opacity="${f(.5 - .12 * snap)}">${head}${teethG}</g>${impactLines}</g>`;
  }
  s += d;
  let out = `<g transform="translate(540 1000) scale(${f(lerp(1.0, 1.08, io(t / 6.4)) * 100) / 100}) translate(-560 -1160)">${s}</g>`;
  out = shakeG(out, t, LAND, 22); CUTS.forEach(c => { out = shakeG(out, t, c, 10); });
  out += flash(t, LAND, '#fff3c4', .6) + flash(t, CUTS[0] + .08, '#ffffff', .6);
  const c = t < 1.4 ? ['AN ARMY FROM ORBIT.', 'THE IRON RAIN.', '#ffe08a'] : t < CUTS[2] - .2 ? ['THE REAPER LANDS.', 'GOLDS FALL.', '#ffe08a'] : ['MARS FALLS.', 'TO DARROW.', '#ffe08a'];
  return { svg: out, cap: cap(...c) };
}
const SHOTS = { duel: [duel, 5.6], rain: [rain, 6.4] };
module.exports = { duel, rain };
if (require.main === module) (async () => {
  const which = process.argv[2] ? [process.argv[2]] : Object.keys(SHOTS), b = await chromium.launch();
  const PAGE = `<style>@font-face{font-family:Anton;src:url(${font('anton.woff2')})}html,body{margin:0;background:#000;overflow:hidden}#w{position:absolute;inset:0;width:${W}px;height:${H}px;overflow:hidden}#w svg{position:absolute;inset:0}
    .cap{position:absolute;top:270px;left:150px;right:150px;text-align:center;font-family:Anton;line-height:1.08}.l1,.l2{font-size:80px;-webkit-text-stroke:2px #120c0a;paint-order:stroke fill;text-shadow:0 5px 0 rgba(0,0,0,.6),0 0 40px rgba(0,0,0,.7)}.l1{color:#f6ead2}</style><div id="w"></div>`;
  for (const k of which) { const [fn, dur] = SHOTS[k], N = Math.round(dur * FPS), dir = path.join(require('os').tmpdir(), 'act-' + k); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await Promise.all([0, 1, 2, 3].map(async w => { const p = await b.newPage({ viewport: { width: W, height: H } }); await p.setContent(PAGE); await p.evaluate(() => document.fonts.load('80px Anton'));
      for (let i = w; i < N; i += 4) { const { svg, cap: c } = fn(i / FPS); await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, `<svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${svg}${L.grade(k === 'duel' ? 'gala' : 'mars', {})}</svg>${c}`); await p.screenshot({ path: `${dir}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 90 }); }
      await p.close(); }));
    const name = k === 'duel' ? 'duel-preview' : 'ironrain-preview' + (process.env.WOLF === 'white' ? '-whitewolf' : '');
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-framerate', String(FPS), '-i', `${dir}/f%04d.jpg`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '21', '-movflags', '+faststart', `${ROOT}/${name}.mp4`]);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', `${ROOT}/${name}.mp4`, '-vf', 'fps=2.2,scale=180:-1,tile=7x2', '-frames:v', '1', `${ROOT}/out/${name}-sheet.jpg`]);
    console.log(name, N); }
  await b.close();
})();
