'use strict';
// DARROW (Golden Son): painted-look model. Short swept-up blond hair, clean stern face, gold muscle cuirass with a lion face,
// lion-head pauldrons, gold vambraces / greaves / armoured boots, black undersuit, crimson sash with hanging ends.
//   darrow(x, y, h, opts) -> SVG string (no <svg> wrapper).  (x, y) = point between the feet, h = full standing height in px.
//   opts: yaw -60..60 (deg, + = turned to viewer's right; best within +-20), pitch -20..20 (+ = chin up),
//         expr 'neutral'|'smile'|'grin'|'angry'|'brood', blink, wind (seconds; sways the sash ends), blade, crop 'full'|'bust', scar (default true, faint)
// Technique: head = 3D landmarks (unit = skull radius) rotated by yaw/pitch and projected flat, outline = convex hull, so nothing pops.
// Body = stack of elliptical cross-sections turned by only 0.3*yaw (calm). Rendering = gradient fills per plate (objectBoundingBox
// gradients, no filters), soft gradient shade overlays, a few crisp speculars, thin coloured lines + a slightly heavier silhouette line.
const ST = require('../style.js');
const INK = ST.INK || '#120d0f', RIM = ST.rim || '#7fb0ff';
const D = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, v) => { const t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const f = v => String(Math.round(v * 10) / 10);
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const pathD = (pts, closed = true) => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (closed ? 'Z' : '');

function smooth(pts, closed = true, n = 5) {
  const N = pts.length, out = [], g = i => closed ? pts[(i + N) % N] : pts[cl(i, 0, N - 1)], last = closed ? N : N - 1;
  for (let i = 0; i < last; i++) {
    const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
    for (let k = 0; k < n; k++) {
      const t = k / n, t2 = t * t, t3 = t2 * t, c = j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      out.push([c(0), c(1)]);
    }
  }
  if (!closed) out.push(pts[N - 1]);
  return out;
}
function hull(points) {
  const p = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  lo.pop(); up.pop();
  return lo.concat(up);
}
const area = pts => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
// thin cool rim along right-facing edges of a closed polygon
function rimPath(pts, w, inset, op) {
  const N = pts.length; if (N < 3) return '';
  const sgn = area(pts) > 0 ? 1 : -1, a = [], b = [], k = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N];
    let nx = (p2[1] - p0[1]) * sgn, ny = -(p2[0] - p0[0]) * sgn; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const kk = ss(0.3, 0.85, nx); k.push(kk); a.push([p1[0] - nx * inset, p1[1] - ny * inset]); b.push([p1[0] - nx * (inset + w * kk), p1[1] - ny * (inset + w * kk)]);
  }
  let start = 0; for (let i = 0; i < N; i++) if (k[i] <= 0) { start = i; break; }
  let d = '', run = [];
  const flush = () => { if (run.length > 1) d += pathD(run.map(i => a[i]).concat(run.slice().reverse().map(i => b[i]))); run = []; };
  for (let j = 0; j <= N; j++) { const i = (start + j) % N; if (k[i] > 0 || (run.length && j < N)) { run.push(i); if (k[i] <= 0) flush(); } else flush(); }
  flush();
  return d ? `<path d="${d}" fill="${RIM}" opacity="${op}"/>` : '';
}

// palette (painted gold; base tones follow style.js gold / goldHi / goldShade)
const GOLD = ST.gold || '#e2a93b', GOLD_HI = ST.goldHi || '#f6dc8b', GOLD_SH = ST.goldShade || '#8e6420';
const SPEC = '#fff4cf', BRONZE = '#5a380e', BRONZE_D = '#2e1a05', BOUNCE = '#c9812a';
const LINE_G = '#4a2c0a', LINE_K = '#08070a', LINE_S = '#6a3a28', LINE_R = '#4a0a0e';
const SKIN_HI = '#f6d8b8', SKIN = '#e9c3a0', SKIN_LO = '#d3a07c', SKIN_SH = '#a5644a', LIP = '#c98672';
const HAIR_HI = '#f8e3a0', HAIR = '#dcae4c', HAIR_LO = '#a47426', HAIR_SH = '#6e4a14', BROW = '#7a5418';
const EYE = (ST.darrow && ST.darrow.eye) || '#e0a326', SCLERA = '#f3ebdc', TEETH = '#f6f0e4';
const CRIM = '#b3231f', CRIM_HI = '#de4a3c', CRIM_SH = '#5e1012';
const STEEL = ST.silver || '#d8e0ea', STEEL_SH = ST.silverShade || '#8d9bb0';

function darrow(x, y, h, opts = {}) {
  const yaw = cl(+opts.yaw || 0, -70, 70), pitch = cl(+opts.pitch || 0, -25, 25);
  const expr = opts.expr || 'neutral', blink = !!opts.blink, wind = +opts.wind || 0, blade = !!opts.blade, bust = opts.crop === 'bust', scar = opts.scar !== false;
  let hs = 2166136261; for (const ch of [x, y, h, yaw, pitch, expr, blink, wind, blade, bust, scar].join('|')) hs = Math.imul(hs ^ ch.charCodeAt(0), 16777619) >>> 0;
  const id = 'dw' + hs.toString(36); let idn = 0; const nid = () => id + 'c' + (idn++);
  const G = n => `url(#${id}${n})`;

  const lw = h * 0.0023, silW = h * 0.0072, rimW = h * 0.0026;
  const ry = py => py < 0.47 ? py * 1.07 : 0.5029 + (py - 0.47) * 0.938; // longer legs, slightly shorter torso
  const M = (px, py) => [x + px * h, y - ry(py) * h];
  const line = (pts, w, col, extra = '') => `<path d="${pathD(pts, false)}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  const poly = (pts, fill, extra = '') => `<path d="${pathD(pts)}" fill="${fill}"${extra}/>`;
  let sil = '';
  // painted form: gradient fill, clipped interior detail, soft shade overlay, thin coloured line; outline is also added to the silhouette pass
  function form(pts, o) {
    const d = pathD(pts), w = o.sw === undefined ? lw : o.sw;
    if (o.sil !== false) sil += d;
    let s = `<path d="${d}" fill="${o.fill}"/>`;
    const inner = (o.in || []).join('') + (o.sh ? `<path d="${d}" fill="${G(o.sh)}"/>` : '') + (o.rim ? rimPath(pts, rimW * o.rim, w * 0.5, 0.42) : '');
    if (inner) { if (o.in && o.in.length) { const c = nid(); s += `<clipPath id="${c}"><path d="${d}"/></clipPath><g clip-path="url(#${c})">${inner}</g>`; } else s += inner; }
    if (w) s += `<path d="${d}" fill="none" stroke="${o.line || LINE_G}" stroke-width="${f(w)}" stroke-linejoin="round"/>`;
    return s;
  }
  const spec = (pts, op = 0.85) => poly(pts, SPEC, ` opacity="${op}"`);

  // ---------- gradients (objectBoundingBox unless noted) ----------
  const lg = (n, x1, y1, x2, y2, stops, user) => `<linearGradient id="${id}${n}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${user ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a === undefined ? '' : ` stop-opacity="${a}"`}/>`).join('')}</linearGradient>`;
  let defs = ''
    + lg('ga', 0.1, 0, 0.55, 1, [[0, GOLD_HI], [0.22, GOLD], [0.62, '#a8782a'], [0.9, '#6b4613'], [1, BOUNCE]])            // plate lit from upper-left, warm bounce below
    + lg('gb', 0, 0, 1, 0.12, [[0, '#a87826'], [0.16, GOLD_HI], [0.36, GOLD], [0.68, GOLD_SH], [0.93, '#4c300b'], [1, '#7c5a26']]) // cylinder (greave, vambrace)
    + lg('gp', 0, 0, 0.5, 1, [[0, '#fff0bd'], [0.4, '#eec25a'], [1, '#b98428']])                                                // raised relief (lighter)
    + lg('gd', 0, 0, 0.4, 1, [[0, '#c08e30'], [0.6, '#8a5e1a'], [1, '#5c3b0e']])                                                // recessed / under plates
    + lg('sg', 0, 0, 1, 0.1, [[0, BRONZE_D, 0], [0.5, BRONZE_D, 0], [1, BRONZE_D, 0.62]])                                         // soft shade to the right (gold)
    + lg('sk', 0, 0, 1, 0.1, [[0, '#000', 0], [0.45, '#000', 0], [1, '#000', 0.55]])                                              // soft shade to the right (dark)
    + lg('sd', 0, 0, 0, 1, [[0, BRONZE_D, 0.55], [0.6, BRONZE_D, 0]])                                                             // soft shade from the top (under an overhang)
    + lg('kb', 0, 0, 1, 0.1, [[0, '#17161c'], [0.24, '#3d3c49'], [0.5, '#1d1c23'], [1, '#0b0a0e']])                              // black undersuit sheen
    + lg('cr', 0, 0, 0.3, 1, [[0, CRIM_HI], [0.3, CRIM], [1, CRIM_SH]])
    + lg('hg', 0.2, 0, 0.6, 1, [[0, HAIR_HI], [0.35, HAIR], [1, HAIR_LO]])
    + lg('sn', 0.15, 0, 0.6, 1, [[0, SKIN_HI], [0.5, SKIN], [1, SKIN_LO]])
    + lg('st', 0, 0, 1, 0.2, [[0, '#ffffff'], [0.45, STEEL], [1, STEEL_SH]]);

  // ---------- BODY FRAME (subtle turn) ----------
  const by = yaw * 0.3 * D, cb = Math.cos(by), sb = Math.sin(by);
  const ell = (cx, cz, a, b) => ({ c: cx * cb + cz * sb, w: Math.sqrt(a * a * cb * cb + b * b * sb * sb) });
  const sx = (e, phi) => e.c + e.w * Math.sin(cl(phi * D + by, -Math.PI / 2, Math.PI / 2));
  const wx = (e, psi) => e.c + e.w * Math.sin(psi * D);
  const stack = (LV, cxAt) => py => { let i = 0; while (i < LV.length - 2 && py < LV[i + 1][0]) i++; const a = LV[i], b = LV[i + 1], t = cl((a[0] - py) / (a[0] - b[0])); return ell(cxAt(py), 0, lerp(a[1], b[1], t), lerp(a[2], b[2], t)); };

  // lion face relief (cx, cy in px; R in px; kx = horizontal squash)
  function lion(cx, cy, R, kx, withMane = true) {
    const q = (u, v) => [cx + u * R * kx, cy - v * R], mir = a => a.map(([u, v]) => [-u, v]);
    const mane = []; for (let i = 0; i < 26; i++) { const a = (i * 360 / 26 + 7) * D, rr = i % 2 ? 1.02 : 0.82; mane.push(q(Math.sin(a) * rr, Math.cos(a) * rr * 0.98)); }
    let o = !withMane ? '' : form(smooth(mane, true, 3), { fill: G('ga'), sw: lw * 0.8, sil: false, sh: 'sg',
      in: Array.from({ length: 13 }, (_, i) => { const a = (i * 360 / 13 + 7) * D; return line([q(Math.sin(a) * 0.62, Math.cos(a) * 0.62), q(Math.sin(a) * 0.9, Math.cos(a) * 0.9)], lw * 0.7, BRONZE, ' opacity=".7"'); }) });
    const earL = [[-0.34, 0.5], [-0.7, 0.78], [-0.62, 0.36]];
    o += poly(earL.map(p => q(p[0], p[1])), G('gp'), ` stroke="${LINE_G}" stroke-width="${f(lw * 0.7)}" stroke-linejoin="round"`) + poly(mir(earL).map(p => q(p[0], p[1])), G('gd'), ` stroke="${LINE_G}" stroke-width="${f(lw * 0.7)}" stroke-linejoin="round"`);
    const half = [[0, 0.52], [0.24, 0.56], [0.52, 0.4], [0.6, 0.02], [0.44, -0.4], [0.2, -0.66], [0, -0.72]];
    const face = half.concat(mir(half).reverse().slice(1, -1)).map(p => q(p[0], p[1]));
    const inn = [
      poly([q(0.02, 0.6), q(0.7, 0.6), q(0.7, -0.8), q(0.1, -0.8), q(0.16, -0.2)], BRONZE_D, ' opacity=".28"'),
      poly([[-0.07, 0.16], [0.07, 0.16], [0.14, -0.2], [-0.14, -0.2]].map(p => q(p[0], p[1])), SPEC, ' opacity=".6"'),
      poly([[-0.2, -0.18], [0.2, -0.18], [0, -0.42]].map(p => q(p[0], p[1])), BRONZE_D),
      poly([[-0.46, 0.14], [-0.13, 0.0], [-0.19, -0.08], [-0.42, 0.03]].map(p => q(p[0], p[1])), BRONZE_D), poly([[0.46, 0.14], [0.13, 0.0], [0.19, -0.08], [0.42, 0.03]].map(p => q(p[0], p[1])), BRONZE_D),
      line([[-0.52, 0.26], [-0.12, 0.1], [0, 0.17], [0.12, 0.1], [0.52, 0.26]].map(p => q(p[0], p[1])), R * 0.085, BRONZE),
      line(smooth([[-0.34, -0.4], [-0.14, -0.57], [0, -0.48], [0.14, -0.57], [0.34, -0.4]].map(p => q(p[0], p[1])), false, 4), lw * 0.9, BRONZE_D),
      line([q(0, -0.42), q(0, -0.5)], lw * 0.9, BRONZE_D),
      spec([[-0.4, 0.38], [-0.16, 0.44], [-0.2, 0.3], [-0.42, 0.26]].map(p => q(p[0], p[1])), 0.7),
      spec([[-0.44, -0.12], [-0.3, -0.16], [-0.3, -0.36], [-0.4, -0.3]].map(p => q(p[0], p[1])), 0.45),
    ];
    return o + form(face, { fill: G('gp'), sw: lw * 0.8, sil: false, in: inn });
  }

  // ---------- LEGS ----------
  function leg(s) {
    const E = stack([[0.49, 0.056, 0.06], [0.4, 0.053, 0.057], [0.315, 0.044, 0.048], [0.28, 0.042, 0.046], [0.225, 0.047, 0.05], [0.14, 0.035, 0.039], [0.085, 0.03, 0.035]], py => s * lerp(0.072, 0.052, cl((py - 0.08) / 0.4)));
    const face = s * 8, fx = (py, phi) => sx(E(py), phi + face);
    const side = (ys, infl) => ys.map(py => M(E(py).c - E(py).w - infl(py), py)).concat(ys.slice().reverse().map(py => M(E(py).c + E(py).w + infl(py), py)));
    // thigh (black undersuit)
    let o = form(side([0.49, 0.45, 0.4, 0.35, 0.31, 0.275], () => 0), { fill: G('kb'), line: LINE_K, sh: 'sk', rim: 1,
      in: [line([M(fx(0.47, -38), 0.47), M(fx(0.32, -34), 0.32)], h * 0.004, '#6b6a7c', ' opacity=".5"'), poly([M(-1, 0.5), M(1, 0.5), M(1, 0.43), M(-1, 0.42)], '#000', ' opacity=".45"')] });
    // sabaton (armoured boot)
    const al = by + s * 14 * D, ca = Math.cos(al), sa = Math.sin(al), ea = E(0.085), xa = ea.c;
    const heel = [xa - 0.036 * sa, 0.04 + 0.005 * ca], toe = [xa + 0.106 * sa, 0.034 - 0.012 * ca], trx = 0.022 + 0.017 * Math.abs(ca), hrx = 0.021 + 0.009 * Math.abs(ca);
    const circ = (c, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => { const a = 360 * i / n * D; return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)]; });
    const up = hull([[xa - 0.033, 0.108], [xa + 0.033, 0.108]].concat(circ(heel, hrx, 0.022), circ(toe, trx, 0.022)).map(p => M(p[0], p[1])));
    const sole = hull(circ([heel[0], heel[1] - 0.02], hrx + 0.005, 0.022).concat(circ([toe[0], toe[1] - 0.015], trx + 0.005, 0.022)).map(p => M(p[0], p[1])));
    o += form(sole, { fill: '#17100a', line: LINE_K, in: [line(sole.map(p => [p[0], p[1] - h * 0.0075]), lw, '#5a4326')] });
    const ank = [xa, 0.094], fd = [toe[0] - ank[0], toe[1] - 0.012 - ank[1]], fl = Math.hypot(fd[0], fd[1]) || 1, ux = fd[0] / fl, uy = fd[1] / fl;
    const at = (t, sd, bow = 0) => M(ank[0] + ux * fl * (t + bow) - uy * sd, ank[1] + uy * fl * (t + bow) + ux * sd);
    const lame = t => line([at(t, -0.07, -0.05), at(t, -0.03), at(t, 0.03), at(t, 0.07, -0.05)], lw * 0.9, LINE_G);
    const footIn = [];
    [0.2, 0.4, 0.6, 0.8].forEach((t, i) => {
      footIn.push(poly([at(t, -0.09, -0.06), at(t, -0.03), at(t, 0.03), at(t, 0.09, -0.06), at(t + 0.045, 0.09, -0.06), at(t + 0.045, 0.03), at(t + 0.045, -0.03), at(t + 0.045, -0.09, -0.06)], BRONZE_D, ' opacity=".32"'));
      footIn.push(lame(t));
      footIn.push(spec([at(t - 0.15, -trx * 0.62), at(t - 0.15, -trx * 0.3), at(t - 0.03, -trx * 0.28), at(t - 0.03, -trx * 0.66)], 0.55 - i * 0.06));
    });
    footIn.push(spec([at(0.86, -trx * 0.6), at(0.86, -trx * 0.2), at(0.97, -trx * 0.18), at(1.0, -trx * 0.5)], 0.8));
    o += form(up, { fill: G('ga'), in: footIn, sh: 'sg', rim: 1 });
    // greave: wraps the shin, calf swell, flared ankle
    const gys = [0.268, 0.25, 0.225, 0.19, 0.15, 0.115, 0.095, 0.08];
    const gp = smooth(gys.map(py => M(E(py).c - E(py).w - (py > 0.26 || py < 0.09 ? 0.009 : 0.004), py)), false, 3).concat(smooth(gys.slice().reverse().map(py => M(E(py).c + E(py).w + (py > 0.26 || py < 0.09 ? 0.009 : 0.004), py)), false, 3));
    const gIn = [
      poly([M(fx(0.262, -16), 0.27), M(fx(0.262, 4), 0.27), M(fx(0.09, 3), 0.085), M(fx(0.09, -9), 0.085)], SPEC, ' opacity=".5"'),                 // shin ridge light
      spec([M(fx(0.24, -13), 0.243), M(fx(0.24, -5), 0.245), M(fx(0.15, -4), 0.15), M(fx(0.15, -9), 0.152)], 0.9),
      line([M(fx(0.262, 8), 0.266), M(fx(0.2, 9), 0.2), M(fx(0.09, 6), 0.086)], lw * 0.8, LINE_G, ' opacity=".7"'),
      line([M(-1, 0.252), M(1, 0.252)].map((p, i) => [x + (E(0.252).c + (i ? 0.08 : -0.08)) * h, p[1]]), lw * 0.9, LINE_G),
      line([M(E(0.1).c - 0.08, 0.1), M(E(0.1).c + 0.08, 0.1)], lw * 0.9, LINE_G),
      poly([M(E(0.1).c - 0.08, 0.1), M(E(0.1).c + 0.08, 0.1), M(E(0.1).c + 0.08, 0.07), M(E(0.1).c - 0.08, 0.07)], BRONZE_D, ' opacity=".25"'),
      line([M(fx(0.245, 62), 0.248), M(fx(0.19, 66), 0.19), M(fx(0.1, 60), 0.102)], lw * 0.8, LINE_G, ' opacity=".8"'),
    ];
    o += form(gp, { fill: G('gb'), in: gIn, rim: 1 });
    // knee cop + lower lame
    const lam = [[-58, 0.262], [0, 0.272], [58, 0.262], [50, 0.238], [0, 0.226], [-50, 0.238]].map(([p, py]) => M(fx(py, p), py));
    o += form(lam, { fill: G('gd'), sw: lw * 0.9, sil: false, in: [spec([M(fx(0.25, -40), 0.252), M(fx(0.25, -18), 0.258), M(fx(0.24, -18), 0.243), M(fx(0.24, -38), 0.24)], 0.4)] });
    const kn = smooth([[0, 0.312], [30, 0.305], [50, 0.286], [47, 0.264], [0, 0.252], [-47, 0.264], [-50, 0.286], [-30, 0.305]].map(([p, py]) => M(fx(py, p), py)), true, 4);
    o += form(kn, { fill: G('ga'), sh: 'sg', rim: 1, in: [
      spec([M(fx(0.3, -28), 0.3), M(fx(0.3, -12), 0.305), M(fx(0.288, -14), 0.29), M(fx(0.288, -32), 0.286)], 0.8),
      line(smooth([M(fx(0.31, 0), 0.31), M(fx(0.29, 3), 0.29), M(fx(0.254, 0), 0.254)], false, 4), lw * 0.8, LINE_G, ' opacity=".6"'),
      line(smooth([M(fx(0.27, -60), 0.275), M(fx(0.262, 0), 0.262), M(fx(0.27, 60), 0.275)], false, 4), lw * 0.8, LINE_G, ' opacity=".7"')] });
    return o;
  }

  // ---------- TORSO ----------
  const TE = stack([[0.8, 0.106, 0.06], [0.762, 0.128, 0.08], [0.705, 0.127, 0.086], [0.64, 0.104, 0.075], [0.59, 0.092, 0.068], [0.55, 0.097, 0.07], [0.5, 0.106, 0.075], [0.45, 0.108, 0.076]], () => 0);
  const tx = (py, phi) => sx(TE(py), phi), twx = (py, psi) => wx(TE(py), psi);
  let pelvis = '', cuirass = '', hips = '', sash = '';
  {
    // black undersuit pelvis
    const pys = [0.6, 0.55, 0.5, 0.455];
    pelvis = form(pys.map(py => M(-TE(py).w, py)).concat([M(-0.02, 0.43), M(0.02, 0.43)], pys.slice().reverse().map(py => M(TE(py).w, py))), { fill: G('kb'), line: LINE_K, sh: 'sk' });
    // cuirass
    const ys = [0.797, 0.765, 0.735, 0.705, 0.67, 0.64, 0.61, 0.582];
    const L = smooth(ys.map(py => M(-TE(py).w, py)), false, 3), R = smooth(ys.slice().reverse().map(py => M(TE(py).w, py)), false, 3);
    const neckline = [M(TE(0.797).w * 0.72, 0.803), M(tx(0.8, 26), 0.806), M(tx(0.79, 15), 0.79), M(tx(0.78, 0), 0.78), M(tx(0.79, -15), 0.79), M(tx(0.8, -26), 0.806), M(-TE(0.797).w * 0.72, 0.803)];
    const out = L.concat([M(tx(0.575, -40), 0.574), M(tx(0.57, 0), 0.566), M(tx(0.575, 40), 0.574)], R, neckline);
    const pec = s => smooth([[3, 0.778], [34, 0.786], [66, 0.772], [80, 0.738], [68, 0.698], [36, 0.682], [5, 0.692]].map(([p, py]) => M(tx(py, s * p), py)), true, 4);
    const ab = (s, yc, hh, p1, p2) => smooth([[p1, yc + hh], [p2, yc + hh * 0.9], [p2 + 2, yc - hh * 0.8], [p1, yc - hh]].map(([p, py]) => M(tx(py, s * p), py)), true, 4);
    const inn = [];
    // sculpted pecs + soft shadow under them
    for (const s of [-1, 1]) inn.push(form(pec(s), { fill: G('ga'), sw: lw * 0.8, sil: false, sh: s > 0 ? 'sg' : undefined }));
    inn.push(poly([[-80, 0.7], [-36, 0.68], [0, 0.69], [36, 0.68], [80, 0.7], [80, 0.64], [-80, 0.64]].map(([p, py]) => M(tx(py, p), py)), G('sd')));
    // abs
    [[0.652, 0.014, 31], [0.622, 0.0125, 29], [0.594, 0.011, 26]].forEach(([yc, hh, p2]) => { for (const s of [-1, 1]) inn.push(form(ab(s, yc, hh, 3.5, p2), { fill: G('gp'), sw: lw * 0.5, line: '#8a5e1a', sil: false, sh: 'sg' }).replace(/fill="url\(#[^"]*gp\)"/, m => m + ' opacity=".55"')); });
    inn.push(line([0.69, 0.64, 0.6, 0.57].map(py => M(tx(py, 0), py)), lw, BRONZE));
    // obliques / rib lines
    for (const s of [-1, 1]) for (const [py, a, b] of [[0.66, 44, 70], [0.63, 40, 66], [0.602, 36, 60]]) inn.push(line([M(tx(py + 0.006, s * a), py + 0.008), M(tx(py - 0.006, s * b), py - 0.004)], lw * 0.8, BRONZE, ' opacity=".7"'));
    // collar trim + speculars
    inn.push(line(neckline.map(p => [p[0], p[1] + h * 0.009]), lw * 0.9, BRONZE, ' opacity=".8"'));
    inn.push(spec([[-62, 0.772], [-36, 0.779], [-30, 0.757], [-58, 0.748]].map(([p, py]) => M(twx(py, p), py)), 0.8));
    inn.push(spec([[-26, 0.662], [-12, 0.664], [-12, 0.646], [-25, 0.645]].map(([p, py]) => M(tx(py, p), py)), 0.6));
    inn.push(poly([[-98, 0.76], [-78, 0.76], [-70, 0.6], [-98, 0.6]].map(([p, py]) => M(-TE(py).w + (p + 98) * 0.0006, py)), BOUNCE, ' opacity=".0"'));
    cuirass = form(out, { fill: G('ga'), in: inn, sh: 'sg', rim: 1 });
    cuirass += lion(M(tx(0.738, 0), 0.737)[0], M(0, 0.737)[1], 0.036 * h, 0.9 + 0.1 * cb);
    // hip plates (fauld) over the thighs
    const HE = TE(0.5);
    for (const s of [-1, 1]) {
      const pp = smooth([[22, 0.562], [98, 0.566], [100, 0.5], [84, 0.445], [52, 0.432], [28, 0.47]].map(([p, py]) => M(py > 0.55 ? sx(TE(0.56), s * p) : sx(HE, s * p) + s * (p > 90 ? 0.006 : 0), py)), true, 3);
      hips += form(pp, { fill: G('ga'), sh: 'sg', rim: 1, in: [
        line([[30, 0.53], [96, 0.535]].map(([p, py]) => M(sx(HE, s * p), py)), lw * 0.9, LINE_G), line([[30, 0.498], [96, 0.5]].map(([p, py]) => M(sx(HE, s * p), py)), lw * 0.9, LINE_G),
        poly([[26, 0.53], [100, 0.535], [100, 0.522], [26, 0.518]].map(([p, py]) => M(sx(HE, s * p), py)), BRONZE_D, ' opacity=".3"'), poly([[26, 0.498], [100, 0.5], [100, 0.488], [26, 0.486]].map(([p, py]) => M(sx(HE, s * p), py)), BRONZE_D, ' opacity=".3"'),
        s < 0 ? spec([[-88, 0.555], [-70, 0.555], [-72, 0.54], [-88, 0.54]].map(([p, py]) => M(sx(HE, p), py)), 0.7) : '', s < 0 ? spec([[-90, 0.515], [-74, 0.515], [-76, 0.504], [-90, 0.504]].map(([p, py]) => M(sx(HE, p), py)), 0.5) : ''] });
    }
    // crimson sash: band, knot, two hanging ends that sway with `wind`
    const band = [M(-TE(0.6).w - 0.004, 0.603), M(tx(0.6, 0), 0.596), M(TE(0.6).w + 0.004, 0.603), M(TE(0.558).w + 0.005, 0.556), M(tx(0.556, 0), 0.55), M(-TE(0.558).w - 0.005, 0.556)];
    const kx0 = tx(0.578, -30), end = (i, len, w0, w1, dx) => {
      const n = 7, Lp = [], Rp = [], mid = [];
      for (let k = 0; k <= n; k++) { const t = k / n, sway = (0.01 * Math.sin(wind * 2.1 + i * 1.9 - t * 2.2) + 0.006 * Math.sin(wind * 3.3 + i)) * t * t * 2.2, cx0 = kx0 + dx * (0.3 + 0.7 * t) + sway, cy0 = 0.572 - len * t, w = lerp(w0, w1, t);
        Lp.push(M(cx0 - w, cy0 - (k === n ? -0.012 : 0))); Rp.push(M(cx0 + w, cy0 - (k === n ? 0.008 : 0))); mid.push(M(cx0 + w * 0.25, cy0)); }
      return form(Lp.concat(Rp.reverse()), { fill: G('cr'), line: LINE_R, rim: 0.8, in: [line(mid, h * 0.006, CRIM_SH, ' opacity=".55"'), line(Lp.map(p => [p[0] + h * 0.004, p[1]]), h * 0.0028, CRIM_HI, ' opacity=".8"')] });
    };
    sash = end(0, 0.25, 0.012, 0.019, 0.012) + end(1, 0.2, 0.012, 0.017, -0.014)
      + form(band, { fill: G('cr'), line: LINE_R, sh: 'sk', in: [
        ...[-70, -44, -12, 18, 46, 72].map((p, i) => line([M(tx(0.6, p), 0.6 - (i % 2) * 0.004), M(tx(0.56, p + 9), 0.556)], lw * 0.9, CRIM_SH, ' opacity=".7"')),
        line([M(-1, 0.592), M(tx(0.59, -10), 0.587)], h * 0.004, CRIM_HI, ' opacity=".6"')] })
      + form(smooth([[-0.02, 0.6], [0.018, 0.604], [0.022, 0.562], [-0.016, 0.552]].map(([dx, py]) => M(kx0 + dx, py)), true, 3), { fill: G('cr'), line: LINE_R, in: [line([M(kx0 - 0.004, 0.6), M(kx0 + 0.006, 0.556)], lw, CRIM_SH), line([M(kx0 - 0.013, 0.594), M(kx0 - 0.011, 0.566)], h * 0.003, CRIM_HI, ' opacity=".8"')] });
  }

  // ---------- ARMS + PAULDRONS ----------
  const A3 = (X, Y, Z) => [X * cb + Z * sb, Y];
  function arm(s, withBlade) {
    const sh = A3(s * 0.146, 0.765, 0), el = A3(s * 0.168, 0.596, -0.01), wr = A3(s * 0.163, 0.462, 0.03), hd = A3(s * 0.161, 0.423, 0.04);
    const seg = (a, b, wa, wb) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; return [[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]]; };
    const round = q => smooth([q[0], [lerp(q[0][0], q[1][0], 0.5) + (q[0][0] < q[3][0] ? -0.004 : 0.004), lerp(q[0][1], q[1][1], 0.5)], q[1], q[2], [lerp(q[2][0], q[3][0], 0.5) + (q[0][0] < q[3][0] ? 0.004 : -0.004), lerp(q[2][1], q[3][1], 0.5)], q[3]].map(p => M(p[0], p[1])), true, 3);
    let o = form(round(seg(sh, [el[0], el[1] - 0.01], 0.033, 0.026)), { fill: G('kb'), line: LINE_K, sh: 'sk', rim: 1, in: [line([M(sh[0] - 0.014, 0.72), M(el[0] - 0.012, 0.63)], h * 0.004, '#6b6a7c', ' opacity=".45"')] });
    let bl = '';
    if (withBlade) {
      const th = -8 * D, ct = Math.cos(th), st = Math.sin(th);
      const B = (u, v) => M(hd[0] + u * ct + v * st, hd[1] - (-u * st + v * ct));
      const cs = smooth([[0, 0.03], [0, 0.1], [0, 0.17], [-0.004, 0.225], [-0.018, 0.272], [-0.045, 0.308], [-0.082, 0.325], [-0.118, 0.318]], false, 4), n = cs.length, Lp = [], Rp = [];
      for (let i = 0; i < n; i++) { const a = cs[Math.max(0, i - 1)], b = cs[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = 0.0135 * Math.pow(1 - i / (n - 1), 0.55) + 0.0005; Lp.push([cs[i][0] + dy / l * w, cs[i][1] - dx / l * w]); Rp.push([cs[i][0] - dy / l * w, cs[i][1] + dx / l * w]); }
      const cen = cs.map(p => B(p[0], p[1]));
      bl += form(Lp.concat(Rp.reverse()).map(p => B(p[0], p[1])), { fill: G('st'), line: '#2a3140', rim: 0.8, in: [line(cen.map(p => [p[0] + h * 0.007, p[1] - h * 0.003]), h * 0.011, STEEL_SH, ' opacity=".8"'), line(cen.map(p => [p[0] - h * 0.005, p[1]]), h * 0.0022, '#fff')] });
      bl += form([B(-0.026, 0.02), B(0.026, 0.02), B(0.02, 0.036), B(-0.02, 0.036)], { fill: G('ga') });
      bl += form([B(-0.008, -0.052), B(0.008, -0.052), B(0.009, 0.022), B(-0.009, 0.022)], { fill: '#1b1418', line: LINE_K }) + form([B(-0.012, -0.066), B(0.012, -0.066), B(0.014, -0.052), B(-0.014, -0.052)], { fill: G('ga') });
    }
    // gauntleted fist (black glove, gold back plate)
    const fist = smooth([[-0.023, 0.03], [0.022, 0.031], [0.027, 0.002], [0.022, -0.028], [0.002, -0.038], [-0.02, -0.03], [-0.027, 0]].map(([dx, dy]) => M(hd[0] + dx, hd[1] + dy)), true, 3);
    const handF = form(fist, { fill: G('ga'), sh: 'sg', in: [
      form([[-0.03, 0.034], [0.03, 0.036], [0.03, 0.006], [0, -0.004], [-0.03, 0.004]].map(([dx, dy]) => M(hd[0] + dx, hd[1] + dy)), { fill: G('ga'), sw: lw * 0.8, sil: false, sh: 'sg' }),
      ...[-0.012, 0.001, 0.014].map(dx => line([M(hd[0] + dx, hd[1] - 0.004), M(hd[0] + dx * 1.05, hd[1] - 0.034)], lw * 0.9, LINE_G)), line([M(hd[0] - 0.03, hd[1] - 0.018), M(hd[0] + 0.03, hd[1] - 0.016)], lw * 0.8, LINE_G, ' opacity=".6"'),
      spec([[-0.022, 0.028], [-0.008, 0.03], [-0.01, 0.014], [-0.023, 0.012]].map(([dx, dy]) => M(hd[0] + dx, hd[1] + dy)), 0.7)] });
    // vambrace (gold cylinder, flared at the elbow) + elbow cop
    const fo = seg([el[0], el[1] - 0.006], [wr[0], wr[1] - 0.004], 0.031, 0.022), vam = round(fo);
    const ax = t => [lerp(el[0], wr[0], t), lerp(el[1], wr[1], t)];
    const vIn = [
      poly([M(ax(0)[0] - 0.017, ax(0)[1]), M(ax(0)[0] - 0.006, ax(0)[1]), M(ax(1)[0] - 0.004, ax(1)[1]), M(ax(1)[0] - 0.012, ax(1)[1])], SPEC, ' opacity=".5"'),
      spec([M(ax(0.15)[0] - 0.015, ax(0.15)[1]), M(ax(0.15)[0] - 0.009, ax(0.15)[1]), M(ax(0.7)[0] - 0.007, ax(0.7)[1]), M(ax(0.7)[0] - 0.011, ax(0.7)[1])], 0.9),
      line([M(ax(0.86)[0] - 0.05, ax(0.86)[1] + 0.003), M(ax(0.86)[0] + 0.05, ax(0.86)[1] - 0.003)], lw * 0.9, LINE_G), line([M(ax(0.14)[0] - 0.05, ax(0.14)[1] + 0.003), M(ax(0.14)[0] + 0.05, ax(0.14)[1] - 0.003)], lw * 0.9, LINE_G),
      line([M(ax(0.14)[0] + 0.012, ax(0.14)[1]), M(ax(0.86)[0] + 0.009, ax(0.86)[1])], lw * 0.8, LINE_G, ' opacity=".7"'),
    ];
    const vamS = form(vam, { fill: G('gb'), in: vIn, rim: 1 });
    const ec = smooth([[-0.027, 0.01], [0, 0.022], [0.027, 0.01], [0.025, -0.012], [0, -0.02], [-0.025, -0.012]].map(([dx, dy]) => M(el[0] + dx, el[1] + dy)), true, 3);
    const ecS = form(ec, { fill: G('ga'), sh: 'sg', in: [spec([[-0.024, 0.012], [-0.006, 0.02], [-0.01, 0], [-0.025, -0.004]].map(([dx, dy]) => M(el[0] + dx, el[1] + dy)), 0.75)] });
    o += bl + handF + vamS + ecS;
    // lion-head pauldron: under lame, shoulder cap with mane grooves, lion face
    const pc = A3(s * 0.146, 0.772, 0), kx = 0.88 + 0.12 * cb;
    const Q = (u, v) => M(pc[0] + s * u * kx, pc[1] + v);
    const dome = smooth([[-0.052, 0.022], [-0.034, 0.045], [0.004, 0.054], [0.04, 0.04], [0.058, 0.006], [0.058, -0.03], [0.04, -0.054], [0.002, -0.062], [-0.034, -0.05], [-0.05, -0.016]].map(([u, v]) => Q(u, v)), true, 4);
    const lame2 = smooth([[-0.04, -0.03], [0.055, -0.03], [0.054, -0.076], [0.028, -0.09], [-0.014, -0.084], [-0.038, -0.066]].map(([u, v]) => Q(u, v)), true, 3);
    o += form(lame2, { fill: G('gd'), sh: 'sg', rim: 1, in: [line([Q(-0.06, -0.073), Q(0.07, -0.071)], lw * 0.9, LINE_G), s < 0 ? spec([Q(0.048, -0.06), Q(0.036, -0.062), Q(0.036, -0.076), Q(0.046, -0.072)], 0.5) : ''] });
    const grooves = [-150, -115, -80, -45, -10, 25, 60, 95, 130, 165].map(a => { const c = Math.sin(a * D), d2 = Math.cos(a * D); return line([Q(0.004 + c * 0.034, -0.006 + d2 * 0.036), Q(0.004 + c * 0.052, -0.004 + d2 * 0.054)], lw * 0.9, BRONZE, ' opacity=".6"'); });
    o += form(dome, { fill: G('ga'), sh: 'sg', rim: 1, in: grooves.concat([
      s < 0 ? spec([Q(0.046, 0.022), Q(0.03, 0.04), Q(0.014, 0.046), Q(0.03, 0.032)], 0.85) : spec([Q(-0.034, 0.036), Q(-0.016, 0.046), Q(-0.002, 0.047), Q(-0.018, 0.04)], 0.6)]) });
    o += lion(Q(0.004, -0.006)[0], Q(0.004, -0.006)[1], 0.04 * h, kx, false);
    return o;
  }

  // ---------- HEAD ----------
  const r = h * 0.072, ya = yaw * D, pa = pitch * D, cy_ = Math.cos(ya), sy_ = Math.sin(ya), cp = Math.cos(pa), sp = Math.sin(pa);
  const hcx = x + h * 0.008 * sy_, hcy = y - h * 0.925;
  const P = (X, Y, Z) => { const y1 = Y * cp + Z * sp, z1 = -Y * sp + Z * cp; return [hcx + (X * cy_ + z1 * sy_) * r, hcy - y1 * r, -X * sy_ + z1 * cy_]; };
  const p2 = (X, Y, Z) => { const q = P(X, Y, Z); return [q[0], q[1]]; };
  const fw = r * 0.03;
  // soft form shadow across the head: user-space gradient along the (fixed) light direction
  { const dx = 0.9, dy = 0.43, a = -0.1 * r, b = 1.0 * r;
    defs += lg('hs', f(hcx + dx * a), f(hcy + dy * a), f(hcx + dx * b), f(hcy + dy * b), [[0, SKIN_SH, 0], [0.55, SKIN_SH, 0.5], [1, '#7c4434', 0.78]], true)
      + lg('hh', f(hcx + dx * a), f(hcy + dy * a), f(hcx + dx * b), f(hcy + dy * b), [[0, HAIR_SH, 0], [0.6, HAIR_SH, 0.55], [1, '#4a300c', 0.8]], true); }

  // neck + black collar
  let neck = '';
  {
    const nx0 = (hcx - x) / h;
    const np = [M(nx0 - 0.031, 0.845), M(nx0 + 0.031, 0.845), M(nx0 * 0.4 + 0.036, 0.79), M(nx0 * 0.4 - 0.036, 0.79)];
    neck = form(np, { fill: G('sn'), line: LINE_S, in: [poly([M(-1, 0.86), M(1, 0.86), M(1, 0.835), M(nx0 + 0.01, 0.822), M(nx0 - 0.034, 0.83)], SKIN_SH, ' opacity=".75"'), poly([M(nx0 + 0.004, 0.86), M(1, 0.86), M(1, 0.7), M(nx0 * 0.4 + 0.012, 0.7)], SKIN_SH, ' opacity=".6"')] });
    const col = smooth([M(nx0 * 0.6 - 0.036, 0.818), M(nx0 * 0.6, 0.808), M(nx0 * 0.6 + 0.036, 0.818), M(nx0 * 0.3 + 0.05, 0.776), M(nx0 * 0.3 - 0.05, 0.776)], true, 3);
    neck += form(col, { fill: G('kb'), line: LINE_K, sh: 'sk', in: [line([M(nx0 * 0.6 - 0.032, 0.812), M(nx0 * 0.6 - 0.004, 0.804)], h * 0.003, '#6b6a7c', ' opacity=".6"')] });
  }

  // skull + jaw hull
  const hp = [];
  for (let la = -60; la <= 90; la += 15) for (let lo = 0; lo < 360; lo += 20) { const A = la * D, L = lo * D; hp.push(P(0.9 * Math.cos(A) * Math.sin(L), 0.05 + Math.sin(A), -0.08 + 1.05 * Math.cos(A) * Math.cos(L))); }
  for (const s of [-1, 1]) hp.push(P(s * 0.79, -0.84, -0.05), P(s * 0.82, -0.3, 0.42), P(s * 0.34, -1.37, 0.66), P(s * 0.62, -1.12, 0.38), P(s * 0.3, 0.02, 0.93), P(s * 0.42, -0.55, 0.74));
  hp.push(P(0, -1.4, 0.7), P(0, 0.05, 0.97), P(0, 0.5, 0.86), P(0, -0.98, 0.9), P(0, -1.24, 0.8));
  const headHull = hull(hp.map(p => [p[0], p[1]]));

  // hair: short, swept up off the forehead
  const HC = [0, 0.1, -0.1], HA = [0.94, 1.08, 1.12];
  const dir = (lo, la) => { const A = la * D, L = lo * D; return [Math.cos(A) * Math.sin(L), Math.sin(A), Math.cos(A) * Math.cos(L)]; };
  const HP = (v, k = 1) => P(HC[0] + HA[0] * v[0] * k, HC[1] + HA[1] * v[1] * k, HC[2] + HA[2] * v[2] * k);
  const hh = [];
  for (let la = -40; la <= 90; la += 15) for (let lo = 0; lo < 360; lo += 20) hh.push(HP(dir(lo, la)));
  hh.push(P(0, 1.3, 0.5), P(-0.42, 1.25, 0.48), P(0.42, 1.25, 0.48), P(0, 1.26, 0.05), P(-0.7, 1.0, 0.4), P(0.7, 1.0, 0.4), P(0, 1.08, 0.86));
  const hairHull = hull(hh.map(p => [p[0], p[1]]));
  const sk = (lo, la) => { const v = dir(lo, la); return [0.9 * v[0], 0.05 + v[1], -0.08 + 1.05 * v[2]]; };
  const half = [[0.8, -0.82, -0.3], [0.88, -0.5, -0.36], [0.93, -0.12, -0.2], sk(86, -6), sk(77, -20), sk(73, 2), sk(67, 20), sk(58, 35), sk(42, 44), sk(22, 47), sk(8, 45)];
  const HL3 = half.map(v => [-v[0], v[1], v[2]]).concat([sk(0, 43)], half.slice().reverse());
  const cut = HL3.map(v => { const q = P(v[0], v[1], v[2]); return [q[0] + ss(0, -0.35, q[2]) * 0.9 * r * Math.sign(v[0] || 1), q[1]]; });
  const cutPoly = [[cut[0][0], cut[0][1] + 3 * r]].concat(smooth(cut, false, 3), [[cut[cut.length - 1][0], cut[cut.length - 1][1] + 3 * r]]);

  // ---------- FACE ----------
  const EX = {
    neutral: { open: 0.84, bi: 0.0, bo: 0.055, sock: 0.55 }, brood: { open: 0.68, bi: -0.04, bo: 0.05, sock: 1 }, angry: { open: 0.64, bi: -0.085, bo: 0.11, sock: 1 },
    smile: { open: 0.74, bi: -0.015, bo: 0.065, sock: 0.6 }, grin: { open: 0.82, bi: 0.02, bo: 0.11, sock: 0.45 },
  }[expr] || { open: 0.84, bi: 0.0, bo: 0.055, sock: 0.55 };
  const open = blink ? 0.04 : EX.open;
  const faceIn = [];
  let feat = '';
  faceIn.push(`<path d="${pathD(headHull)}" fill="${G('hs')}"/>`);
  // soft hair shadow on the forehead
  faceIn.push(`<path d="${pathD(cutPoly, false)}" fill="none" stroke="${SKIN_SH}" stroke-width="${f(r * 0.22)}" stroke-linejoin="round" opacity=".45"/>`);
  for (const s of [-1, 1]) {
    const k = EX.sock;
    faceIn.push(poly(smooth([p2(s * 0.1, EX.bi, 0.93), p2(s * 0.42, EX.bo + 0.02, 0.86), p2(s * 0.7, EX.bo - 0.03, 0.62), p2(s * 0.68, -0.14 - 0.08 * k, 0.64), p2(s * 0.45, -0.19 - 0.08 * k, 0.82), p2(s * 0.15, -0.16 - 0.07 * k, 0.88)], true, 3), SKIN_SH, ` opacity="${f(0.3 + 0.25 * k) }"`.replace('"0', '"0')));
    // cheekbone plane: soft warm wedge on the shadow side, faint line on the lit side
    const c1 = P(s * 0.76, -0.4, 0.5), c2 = P(s * 0.52, -0.9, 0.7), c3 = P(s * 0.8, -0.82, 0.2);
    faceIn.push(poly([[c1[0], c1[1]], [c2[0], c2[1]], [c3[0], c3[1]]], SKIN_SH, ` opacity="${f(ss(0.05, 0.35, c1[2]) * (s > 0 ? 0.4 : 0.22))}"`));
  }
  faceIn.push(poly(smooth([p2(-0.2, -1.115, 0.88), p2(0.2, -1.115, 0.88), p2(0.1, -1.19, 0.88), p2(-0.1, -1.19, 0.88)], true, 3), SKIN_SH, ' opacity=".4"'));
  // lit planes: forehead, cheekbone, chin (subtle painted highlights)
  faceIn.push(poly(smooth([p2(-0.5, 0.42, 0.75), p2(-0.1, 0.5, 0.9), p2(-0.12, 0.2, 0.94), p2(-0.5, 0.16, 0.78)], true, 3), SKIN_HI, ' opacity=".5"'));
  faceIn.push(poly(smooth([p2(-0.62, -0.3, 0.66), p2(-0.34, -0.34, 0.84), p2(-0.4, -0.52, 0.8), p2(-0.62, -0.48, 0.66)], true, 3), SKIN_HI, ' opacity=".45"'));
  faceIn.push(poly(smooth([p2(-0.14, -1.24, 0.82), p2(0.06, -1.24, 0.82), p2(0.04, -1.34, 0.76), p2(-0.12, -1.34, 0.76)], true, 3), SKIN_HI, ' opacity=".4"'));
  // eyes
  for (const s of [-1, 1]) {
    const I = P(s * 0.17, -0.155, 0.88), O = P(s * 0.6, -0.105, 0.67);
    const vis = ss(0.07, 0.2, Math.abs(O[0] - I[0]) / r);
    if (vis <= 0) continue;
    const yTop = -0.155 + open * 0.115, eye = [[I[0], I[1]], p2(s * 0.3, yTop - 0.012, 0.87), p2(s * 0.48, yTop + 0.012, 0.8), [O[0], O[1]], p2(s * 0.46, -0.215 + (1 - open) * 0.06, 0.8), p2(s * 0.28, -0.2 + (1 - open) * 0.05, 0.86)];
    const ic = P(s * 0.385, -0.13, 0.85), ie = P(s * 0.385 + 0.105, -0.13, 0.85 - s * 0.03), irx = Math.max(r * 0.03, Math.abs(ie[0] - ic[0])), iry = r * 0.11;
    const cid = nid(), ed = pathD(smooth(eye, true, 2));
    let e = `<clipPath id="${cid}"><path d="${ed}"/></clipPath><path d="${ed}" fill="${SCLERA}"/><g clip-path="url(#${cid})">`
      + `<ellipse cx="${f(ic[0])}" cy="${f(ic[1])}" rx="${f(irx)}" ry="${f(iry)}" fill="${EYE}" stroke="#5a3a08" stroke-width="${f(fw * 0.7)}"/>`
      + `<ellipse cx="${f(ic[0])}" cy="${f(ic[1] + iry * 0.3)}" rx="${f(irx * 0.7)}" ry="${f(iry * 0.5)}" fill="#f6cf58" opacity=".7"/>`
      + `<ellipse cx="${f(ic[0])}" cy="${f(ic[1])}" rx="${f(irx * 0.42)}" ry="${f(iry * 0.42)}" fill="#1a0f08"/>`
      + `<ellipse cx="${f(ic[0] - irx * 0.35)}" cy="${f(ic[1] - iry * 0.4)}" rx="${f(irx * 0.22)}" ry="${f(iry * 0.2)}" fill="#fff"/>`
      + `<path d="${pathD([eye[0], eye[1], eye[2], eye[3], [eye[3][0], eye[3][1] + r * 0.035], [eye[0][0], eye[0][1] + r * 0.04]])}" fill="#5a3222" opacity=".4"/></g>`;
    e += line(smooth([eye[0], eye[1], eye[2], eye[3]], false, 3).concat([p2(s * 0.65, -0.085, 0.61)]), fw * 1.5, '#2a160c') + line([eye[3], eye[4], eye[5]], fw * 0.6, LINE_S, ' opacity=".7"');
    e += line(smooth([p2(s * 0.24, yTop + 0.05, 0.88), p2(s * 0.42, yTop + 0.075, 0.83), p2(s * 0.58, yTop + 0.04, 0.72)], false, 3), fw * 0.6, LINE_S, ' opacity=".55"'); // lid crease
    if (blink) e = line(smooth([eye[0], eye[5], eye[4], eye[3]], false, 3), fw * 1.4, '#2a160c');
    feat += `<g opacity="${f(vis)}">${e}</g>`;
    const bi = EX.bi, bo = EX.bo;
    const brow = smooth([p2(s * 0.11, bi - 0.03, 0.94), p2(s * 0.1, bi + 0.055, 0.95), p2(s * 0.42, bo + 0.085, 0.86), p2(s * 0.72, bo - 0.01, 0.6), p2(s * 0.44, lerp(bi, bo, 0.6) - 0.005, 0.85)], true, 2);
    feat += `<g opacity="${f(vis)}"><path d="${pathD(brow)}" fill="${BROW}" stroke="#4a300c" stroke-width="${f(fw * 0.5)}" stroke-linejoin="round"/></g>`;
  }
  if (expr === 'angry') feat += line([p2(-0.045, EX.bi + 0.1, 0.96), p2(-0.03, EX.bi - 0.02, 0.96)], fw * 0.7, LINE_S) + line([p2(0.045, EX.bi + 0.1, 0.96), p2(0.03, EX.bi - 0.02, 0.96)], fw * 0.7, LINE_S);
  // nose (drawn over the head outline so it can project in 3/4)
  let noseOver = '';
  {
    const bt = p2(0, 0.0, 0.92), bm = p2(0, -0.36, 1.08), tip = p2(0, -0.67, 1.27), ut = p2(0, -0.78, 1.13), nb = p2(0, -0.83, 0.92);
    const plane = s => [bt, bm, tip, ut, nb, p2(s * 0.215, -0.76, 0.9), p2(s * 0.24, -0.5, 0.86), p2(s * 0.12, -0.06, 0.88)];
    const far = yaw >= 0 ? 1 : -1;
    const drawPlane = s => s > 0 ? poly(plane(s), SKIN) + poly(plane(s), SKIN_SH, ' opacity=".62"') : poly(plane(s), SKIN, ` opacity="${f(ss(0, 12, Math.abs(yaw)))}"`);
    noseOver += poly([nb, p2(0.215, -0.76, 0.9), p2(0.3, -0.92, 0.85), p2(0.06, -0.9, 0.92)], SKIN_SH, ' opacity=".5"');
    noseOver += drawPlane(far) + drawPlane(-far);
    noseOver += poly([p2(-0.045, -0.1, 0.96), p2(0.0, -0.1, 0.97), p2(0.0, -0.6, 1.25), p2(-0.07, -0.58, 1.2)], SKIN_HI, ' opacity=".6"'); // ridge light
    const prot = Math.abs(tip[0] - nb[0]) / r;
    noseOver += line(smooth([[lerp(bt[0], bm[0], 0.5), lerp(bt[1], bm[1], 0.5)], bm, tip], false, 4).concat([ut, nb]), fw * (0.2 + 0.9 * ss(0.03, 0.3, prot)), LINE_S, ` opacity="${f(ss(0.0, 0.12, prot))}"`);
    noseOver += line(smooth([p2(-0.215, -0.76, 0.9), p2(-0.12, -0.815, 0.98), ut, p2(0.12, -0.815, 0.98), p2(0.215, -0.76, 0.9)], false, 4), fw * 0.9, LINE_S);
    noseOver += line(smooth([p2(-0.2, -0.79, 0.9), p2(-0.245, -0.72, 0.9), p2(-0.2, -0.64, 0.9)], false, 3), fw * 0.7, LINE_S, ' opacity=".7"') + line(smooth([p2(0.2, -0.79, 0.9), p2(0.245, -0.72, 0.9), p2(0.2, -0.64, 0.9)], false, 3), fw * 0.7, LINE_S, ' opacity=".7"');
  }
  // mouth + lips
  {
    const mp = a => smooth(a.map(q => p2(q[0], q[1], q[2])), false, 5);
    if (expr === 'grin' || expr === 'angry') {
      const g = expr === 'grin';
      const cL = g ? [-0.42, -0.95, 0.74] : [-0.34, -1.07, 0.78], cR = g ? [0.42, -0.93, 0.74] : [0.34, -1.07, 0.78];
      const top = mp([cL, [-0.2, g ? -1.0 : -0.98, 0.9], [0, g ? -1.0 : -0.96, 0.94], [0.2, g ? -1.0 : -0.98, 0.9], cR]);
      const bot = mp([cR, [0.22, g ? -1.17 : -1.15, 0.86], [0, g ? -1.21 : -1.17, 0.9], [-0.22, g ? -1.17 : -1.15, 0.86], cL]);
      const mid = mp([[cL[0] * 0.9, cL[1] - (g ? 0.09 : 0.03), 0.78], [0, g ? -1.105 : -1.065, 0.92], [cR[0] * 0.9, cR[1] - (g ? 0.09 : 0.03), 0.78]]);
      const teeth = [-0.22, -0.11, 0, 0.11, 0.22].map(t0 => line([p2(t0, g ? -1.0 : -0.97, 0.92), p2(t0, g ? -1.105 : -1.065, 0.92)], fw * 0.4, '#b9a892')).join('');
      feat += form(top.concat(bot), { fill: TEETH, line: '#3a1a14', sw: fw * 1.1, sil: false, in: [teeth, line(mid, fw * 0.6, '#6a4a3a'), poly([p2(0.12, -0.9, 0.9), p2(0.6, -0.9, 0.7), p2(0.6, -1.3, 0.7), p2(0.2, -1.3, 0.9)], '#8a6a5a', ' opacity=".4"')] });
      if (g) feat += line(mp([[-0.5, -0.86, 0.72], [-0.48, -0.94, 0.72], [-0.5, -1.02, 0.72]]), fw * 0.6, LINE_S, ' opacity=".7"') + line(mp([[0.5, -0.84, 0.72], [0.48, -0.92, 0.72], [0.5, -1.0, 0.72]]), fw * 0.6, LINE_S, ' opacity=".7"');
    } else {
      const sm = expr === 'smile', br = expr === 'brood';
      // 'smile' = small, closed, lopsided: his right corner (viewer's left) lifts, the other stays level
      const pts = sm ? [[-0.37, -0.955, 0.77], [-0.2, -1.012, 0.89], [0, -1.022, 0.93], [0.16, -1.018, 0.9], [0.31, -1.012, 0.8]]
        : [[-0.3, br ? -1.05 : -1.03, 0.8], [-0.15, -1.012, 0.9], [0, -1.018, 0.93], [0.15, -1.012, 0.9], [0.3, br ? -1.05 : -1.03, 0.8]];
      const ul = mp([pts[0], [-0.14, -0.972, 0.92], [-0.04, -0.96, 0.95], [0, -0.972, 0.95], [0.04, -0.96, 0.95], [0.14, -0.972, 0.92], pts[4]]);
      const ll = mp([pts[4], [0.16, -1.09, 0.9], [0, -1.11, 0.92], [-0.16, -1.09, 0.9], pts[0]]);
      const mline = mp(pts);
      feat += poly(ul.concat(mline.slice().reverse()), '#b06a5a', ' opacity=".7"') + poly(mline.concat(ll), LIP, ' opacity=".75"');
      feat += poly(mp([[-0.1, -1.045, 0.93], [0.02, -1.05, 0.94], [0.0, -1.085, 0.93], [-0.1, -1.075, 0.92]]).concat(), '#f0c0ae', ' opacity=".5"');
      feat += line(mline, fw * 1.15, '#4a1e16');
      if (sm) feat += line(mp([[-0.42, -0.9, 0.74], [-0.44, -0.955, 0.74], [-0.41, -1.01, 0.74]]), fw * 0.7, LINE_S, ' opacity=".75"');
    }
  }
  if (scar) feat += line([p2(-0.5, 0.2, 0.75), p2(-0.46, 0.02, 0.8)], fw * 0.8, '#c98f7c', ' opacity=".7"');
  const head = form(headHull, { fill: G('sn'), line: LINE_S, sw: lw, in: faceIn.concat([feat]), rim: 1 }) + noseOver;

  // ---------- HAIR CAP ----------
  let hairCap = '', tufts = '';
  {
    const mid = nid(), cid = nid(), bb = [hcx - 3 * r, hcy - 3 * r, 6 * r, 6 * r].map(f);
    const rotX = (v, b) => [v[0], v[1] * Math.cos(b) + v[2] * Math.sin(b), -v[1] * Math.sin(b) + v[2] * Math.cos(b)];
    const flow = (lo, la, s0, s1, lift = 1, n = 12) => { const v0 = dir(lo, la), out = []; for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), v = rotX(v0, s * 120 * D), q = HP([v[0] * (1 + 0.15 * s), v[1], v[2]], lift * (1 + 0.1 * Math.sin(Math.PI * cl(s * 1.6)))); if (q[2] < -0.02) break; out.push([q[0], q[1]]); } return out; };
    // swept-up tufts that break the top silhouette (drawn over the cap; base edge left open)
    for (const [lo, w, k, la] of [[-54, 17, 1.09, 58], [-32, 17, 1.14, 64], [-10, 17, 1.17, 68], [12, 17, 1.17, 68], [34, 17, 1.13, 64], [56, 17, 1.07, 58]]) {
      const a = HP(dir(lo - w, la - 22), 1.0), b = HP(dir(lo + w, la - 22), 1.0), t = HP(dir(lo * 0.9 + 18, la + 2), k), c = HP(dir(lo, la - 30), 0.98);
      if (t[2] < -0.3) continue;
      const tri = [[a[0], a[1]], [t[0], t[1]], [b[0], b[1]]];
      sil += pathD(tri);
      tufts += poly(tri.concat([[c[0], c[1]]]), G('hg')) + poly([[lerp(a[0], b[0], 0.55), lerp(a[1], b[1], 0.55)], [t[0], t[1]], [b[0], b[1]]], HAIR_SH, ` opacity="${lo > 0 ? 0.5 : 0.25}"`)
        + line([[lerp(a[0], b[0], 0.3), lerp(a[1], b[1], 0.3)], [lerp(a[0], t[0], 0.8), lerp(a[1], t[1], 0.8)]], fw * 1.2, SPEC, ' opacity=".6"') + line(tri, lw * 0.9, '#5a3c10');
    }
    let inner = '';
    for (const [lo, la, a, b, w, op] of [[-40, 46, 0.02, 0.5, 0.2, 0.8], [-16, 48, 0.02, 0.42, 0.16, 0.9], [-62, 28, 0.05, 0.5, 0.14, 0.6], [10, 48, 0.02, 0.36, 0.12, 0.6]]) { const pp = flow(lo, la, a, b); if (pp.length > 2) inner += line(pp, r * w, HAIR_HI, ` opacity="${op}"`); }
    { const a = p2(-2, 0.32, 0), b = p2(2, 0.32, 0); inner += poly([a, b, [b[0], b[1] + 3 * r], [a[0], a[1] + 3 * r]], HAIR_LO, ' opacity=".55"'); } // short, darker sides
    inner += `<path d="${pathD(hairHull)}" fill="${G('hh')}"/>`;
    for (const [lo, la, e, op] of [[-72, 14, 0.5, 0.6], [-56, 36, 0.6, 0.7], [-34, 46, 0.66, 0.75], [-12, 47, 0.6, 0.7], [6, 46, 0.66, 0.75], [26, 47, 0.6, 0.7], [46, 42, 0.62, 0.7], [64, 28, 0.55, 0.6], [76, 8, 0.45, 0.6]]) { const pp = flow(lo, la, 0.02, e); if (pp.length > 2) inner += line(pp, fw * 0.9, '#6a4612', ` opacity="${op}"`); }
    for (const [lo, la, a, b] of [[-26, 47, 0.06, 0.3], [-48, 42, 0.1, 0.34], [-4, 47, 0.05, 0.24]]) { const pp = flow(lo, la, a, b, 1.0); if (pp.length > 2) inner += line(pp, fw * 1.1, SPEC, ' opacity=".75"'); }
    inner += rimPath(hairHull, rimW, lw * 0.5, 0.4);
    sil += pathD(hairHull);
    hairCap = `<mask id="${mid}" maskUnits="userSpaceOnUse" x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}"><rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="#fff"/><path d="${pathD(cutPoly)}" fill="#000"/></mask>`
      + `<clipPath id="${cid}"><path d="${pathD(hairHull)}"/></clipPath>`
      + `<g mask="url(#${mid})"><g clip-path="url(#${cid})"><path d="${pathD(hairHull)}" fill="${G('hg')}"/>${inner}</g><path d="${pathD(hairHull)}" fill="none" stroke="#5a3c10" stroke-width="${f(lw)}" stroke-linejoin="round"/></g>`
      + `<g clip-path="url(#${cid})"><path d="${pathD(cutPoly, false)}" fill="none" stroke="#6a4612" stroke-width="${f(lw * 0.9)}" stroke-linejoin="round" opacity=".8"/></g>`;
  }
  // ---------- EARS ----------
  let ears = '';
  for (const s of [-1, 1]) {
    const e = [p2(s * 0.91, -0.08, 0.03), p2(s * 1.02, -0.03, -0.14), p2(s * 1.06, -0.2, -0.2), p2(s * 1.0, -0.43, -0.12), p2(s * 0.92, -0.52, 0.02), p2(s * 0.89, -0.3, 0.08)];
    const m = s * (e[2][0] - e[5][0]) / r, k = ss(0.02, 0.14, m);
    if (k <= 0) continue;
    ears += `<g opacity="${f(k)}">${form(smooth(e, true, 3), { fill: G('sn'), line: LINE_S, sil: k > 0.9, in: [s > 0 ? poly([p2(0, 1, 0), p2(2, 1, 0), p2(2, -2, 0), p2(0, -2, 0)], SKIN_SH, ' opacity=".6"') : '', line(smooth([p2(s * 0.98, -0.11, -0.1), p2(s * 1.01, -0.25, -0.12), p2(s * 0.96, -0.38, -0.05)], false, 3), fw * 0.8, LINE_S, ' opacity=".8"')] })}</g>`;
  }

  // ---------- ASSEMBLE ----------
  const far = yaw >= 0 ? 1 : -1;
  let fig = (bust ? '' : leg(far) + leg(-far)) + pelvis + (bust ? '' : hips) + neck + cuirass + sash + arm(far, blade && far === -1) + arm(-far, blade && far === 1 ? false : blade && -far === -1) + head + hairCap + tufts + ears;
  let out = `<defs>${defs}</defs><path d="${sil}" fill="none" stroke="${INK}" stroke-width="${f(silW)}" stroke-linejoin="round"/>${fig}`;
  if (bust) { const c = nid(); out = `<clipPath id="${c}"><rect x="${f(x - h)}" y="${f(y - 1.4 * h)}" width="${f(2 * h)}" height="${f(0.88 * h)}"/></clipPath><g clip-path="url(#${c})">${out}</g>`; }
  return `<g class="darrow">${out}</g>`;
}
module.exports = { darrow };
