'use strict';
// DARROW: graphic-novel cel model (see ../style.js). Pure function -> SVG string.
//   darrow(x, y, h, opts)   (x, y) = point between the feet, h = full standing height in px.
//   opts: yaw -60..60 (deg, + = turned to viewer's right), pitch -20..20 (+ = chin up),
//         expr 'neutral'|'smile'|'grin'|'angry'|'brood', blink, wind (seconds), blade, crop 'full'|'bust', scar (default true)
// Technique: the head is a set of 3D landmarks (unit = skull radius) rotated by yaw/pitch and projected flat; the outline is the
// convex hull of those points, so the jaw stays angular and nothing pops between angles. The body is a stack of elliptical
// cross-sections turned by 0.55*yaw. Light is fixed in the world: warm key upper-left, hard shadow on the right, cool rim on right edges.
const ST = require('../style.js');
const C = ST.darrow, INK = ST.INK, RIM = ST.rim;
const D = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ss = (a, b, v) => { const t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const f = v => String(Math.round(v * 10) / 10);
const hash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const pathD = (pts, closed = true) => 'M' + pts.map(p => f(p[0]) + ' ' + f(p[1])).join('L') + (closed ? 'Z' : '');
const norm3 = v => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

// Catmull-Rom densify -> polyline
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
// thin cool rim along the right-facing edges of a closed polygon, inset inside the ink line
function rimPath(pts, w, inset) {
  const N = pts.length; if (N < 3) return '';
  const sgn = area(pts) > 0 ? 1 : -1; // screen coords (y down): positive area = clockwise
  const a = [], b = [], k = [];
  for (let i = 0; i < N; i++) {
    const p0 = pts[(i - 1 + N) % N], p1 = pts[i], p2 = pts[(i + 1) % N];
    let nx = (p2[1] - p0[1]) * sgn, ny = -(p2[0] - p0[0]) * sgn; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
    const kk = ss(0.25, 0.8, nx - 0.25 * ny * (ny > 0 ? 1 : 0)); // favour right / upper-right
    k.push(kk); a.push([p1[0] - nx * inset, p1[1] - ny * inset]); b.push([p1[0] - nx * (inset + w * kk), p1[1] - ny * (inset + w * kk)]);
  }
  let start = -1; for (let i = 0; i < N; i++) if (k[i] <= 0) { start = i; break; }
  if (start < 0) start = 0;
  let d = '', run = [];
  const flush = () => { if (run.length > 1) d += pathD(run.map(i => a[i]).concat(run.slice().reverse().map(i => b[i]))); run = []; };
  for (let j = 0; j <= N; j++) { const i = (start + j) % N; if (k[i] > 0 || (run.length && j < N)) { run.push(i); if (k[i] <= 0) flush(); } else flush(); }
  flush();
  return d ? `<path d="${d}" fill="${RIM}" opacity=".9"/>` : '';
}
// zig-zag fur outline from a closed base polygon (fixed sample count per edge => stable under animation)
function fur(base, nPer, amp, seed) {
  const sgn = area(base) > 0 ? 1 : -1, out = [], N = base.length; let c = 0;
  for (let i = 0; i < N; i++) {
    const p = base[i], q = base[(i + 1) % N], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, nx = dy / l * sgn, ny = -dx / l * sgn;
    const n = typeof nPer === 'function' ? nPer(i) : nPer, am = typeof amp === 'function' ? amp(i) : amp;
    for (let k = 0; k < n; k++, c++) {
      const t = k / n, o = (k % 2 ? am * (0.55 + 0.9 * hash(seed + c)) : -am * 0.15), sl = (k % 2 ? am * 0.5 * (hash(seed + c * 3) - 0.2) : 0);
      out.push([lerp(p[0], q[0], t) + nx * o + dx / l * sl, lerp(p[1], q[1], t) + ny * o + dy / l * sl + (k % 2 ? am * 0.35 : 0)]);
    }
  }
  return out;
}

const SKIN_LINE = '#6e3f31', BROW = '#4a3010', SCLERA = '#f1e6d2', TEETH = '#f6f0e2';
const LEATHER = '#3f2a25', LEATHER_HI = '#6e4a39', LEATHER_SH = '#221615', SOLE = '#0f0b0b';
const CLOTH = '#332b3b', CLOTH_SH = '#1d1722', CLOTH_HI = '#50445d', CLOAK_HI = '#2e2437', CLOAK_LINE = '#3d3149', PELT_MID = '#b3b9c8';
const STEEL = ST.silver, STEEL_SH = ST.silverShade, GOLD = ST.gold, GOLD_HI = ST.goldHi;

function darrow(x, y, h, opts = {}) {
  const yaw = cl(+opts.yaw || 0, -75, 75), pitch = cl(+opts.pitch || 0, -25, 25);
  const expr = opts.expr || 'neutral', blink = !!opts.blink, wind = +opts.wind || 0, blade = !!opts.blade, bust = opts.crop === 'bust', scar = opts.scar !== false;
  // deterministic id (same inputs -> same string; different calls -> different ids)
  let hs = 2166136261; for (const ch of [x, y, h, yaw, pitch, expr, blink, wind, blade, bust, scar].join('|')) hs = Math.imul(hs ^ ch.charCodeAt(0), 16777619) >>> 0;
  const id = 'dw' + hs.toString(36); let idn = 0; const nid = () => id + '_' + (idn++);

  const sw = h * 0.0058;                                  // main ink weight
  const M = (px, py) => [x + px * h, y - py * h];          // body units (fractions of h, y up) -> screen
  const line = (pts, w, col = INK, extra = '') => `<path d="${pathD(pts, false)}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  const poly = (pts, fill, extra = '') => `<path d="${pathD(pts)}" fill="${fill}"${extra}/>`;
  function form(pts, o) {
    const d = pathD(pts), w = o.sw === undefined ? sw : o.sw;
    let s = `<path d="${d}" fill="${o.fill}"/>`;
    if ((o.in && o.in.length) || o.rim) { const c = nid(); s += `<clipPath id="${c}"><path d="${d}"/></clipPath><g clip-path="url(#${c})">${(o.in || []).join('')}${o.rim ? rimPath(pts, o.rim, w * 0.5) : ''}</g>`; }
    if (w) s += `<path d="${d}" fill="none" stroke="${o.stroke || INK}" stroke-width="${f(w)}" stroke-linejoin="round"/>`;
    return s + (o.over || '');
  }
  const rimW = h * 0.0034;

  // ---------- BODY FRAME ----------
  const by = yaw * 0.55 * D, cb = Math.cos(by), sb = Math.sin(by);
  const ell = (cx, cz, a, b) => ({ c: cx * cb + cz * sb, w: Math.sqrt(a * a * cb * cb + b * b * sb * sb) });
  const sx = (e, phi) => e.c + e.w * Math.sin(cl(phi * D + by, -Math.PI / 2, Math.PI / 2)); // point fixed on the body surface
  const wx = (e, psi) => e.c + e.w * Math.sin(psi * D);                                       // point fixed in the world (lighting)
  const gust = Math.sin(wind * 1.3) * 0.5 + Math.sin(wind * 2.9 + 1) * 0.5;
  const stream = -(Math.sin(yaw * D) * 0.6 + 0.32 * Math.cos(yaw * D)) + 0.06 * gust;        // hair/cloak trail direction (x per unit drop)

  // ---------- CLOAK (back panel behind everything + a front drape over his left shoulder) ----------
  let cloak = '', drape = '';
  const CE = ell(0, 0, 0.2, 0.125);
  {
    const k = 0.9 + 0.1 * cb, off = stream * 0.03, sway = i => 0.01 * Math.sin(wind * 2.2 + i * 1.1) + off * (0.6 + 0.4 * Math.sin(i * 2.3));
    const hemY = [0.075, 0.105, 0.06, 0.095, 0.055, 0.09, 0.065, 0.1, 0.07];
    const base = [M(-0.15 * k, 0.76), M(-0.19 * k, 0.62), M(-0.205 * k + off * 0.5, 0.38)];
    const hem = hemY.map((hy, i) => M((-0.225 + i * 0.45 / 8) * k + sway(i), hy + 0.008 * Math.sin(wind * 2.6 + i)));
    const pts = base.concat(hem, [M(0.205 * k + off * 0.5, 0.38), M(0.19 * k, 0.62), M(0.15 * k, 0.76)]);
    const folds = [-0.15, -0.05, 0.06, 0.15].map((fx, i) => line(smooth([M(fx * 0.7 * k, 0.6), M(fx * k + off * 0.5, 0.36), M(fx * 1.2 * k + sway(i * 2 + 1), 0.12)], false, 5), sw * 0.7, CLOAK_LINE)).join('');
    const hi = poly([M(-0.3, 0.8), M(-0.17 * k, 0.8), M(-0.18 * k + off * 0.6, 0.36), M(-0.19 * k + off, 0.03), M(-0.34, 0.03)], CLOAK_HI);
    cloak = form(pts, { fill: C.cloak, in: [folds, hi], rim: rimW });
    // front drape: hangs from under the pelt over his left arm (viewer's right at yaw 0)
    const W = CE.w, sw2 = i => 0.008 * Math.sin(wind * 2.4 + i * 1.3) + stream * 0.012;
    const inner = [[8, 0.77], [15, 0.66], [27, 0.53], [41, 0.42], [50, 0.335]].map(([p, py]) => M(sx(CE, p), py));
    const tail = [M(lerp(sx(CE, 50), W * 1.05, 0.3) + sw2(1), 0.3), M(lerp(sx(CE, 50), W * 1.05, 0.62) + sw2(2), 0.34), M(W * 1.06 + sw2(3), 0.285), M(W * 1.1 + sw2(4), 0.42), M(W * 1.04, 0.6), M(W * 0.9, 0.77)];
    const dp = inner.concat(tail);
    const fold = poly(inner.concat([M(sx(CE, 56), 0.36), M(sx(CE, 40), 0.5), M(sx(CE, 27), 0.64), M(sx(CE, 18), 0.77)]), CLOAK_HI);
    const fl = [0.45, 0.75].map((t, i) => line(smooth([M(lerp(sx(CE, 12), W * 0.9, t), 0.7), M(lerp(sx(CE, 30), W, t), 0.52), M(lerp(sx(CE, 50), W * 1.08, t) + sw2(i), 0.34)], false, 5), sw * 0.7, CLOAK_LINE)).join('');
    drape = form(dp, { fill: C.cloak, in: [fold, fl], rim: rimW });
  }

  // ---------- LEGS + BOOTS ----------
  function leg(s) {
    const cxAt = py => s * lerp(0.076, 0.056, cl((py - 0.07) / 0.4));
    const LV = [[0.475, 0.054, 0.058], [0.38, 0.052, 0.056], [0.285, 0.041, 0.045], [0.215, 0.044, 0.047], [0.13, 0.034, 0.038], [0.075, 0.029, 0.034]];
    const E = py => { let i = 0; while (i < LV.length - 2 && py < LV[i + 1][0]) i++; const a = LV[i], b = LV[i + 1], t = cl((a[0] - py) / (a[0] - b[0])); return ell(cxAt(py), 0, lerp(a[1], b[1], t), lerp(a[2], b[2], t)); };
    const face = s * 9;                                   // leg turned out a little
    const fx = (py, phi) => sx(E(py), phi + face);
    const ys = [0.475, 0.43, 0.38, 0.33, 0.285, 0.25];
    const thigh = ys.map(py => M(E(py).c - E(py).w, py)).concat(ys.slice().reverse().map(py => M(E(py).c + E(py).w, py)));
    let o = form(thigh, { fill: CLOTH, in: [poly([M(wx(E(0.475), 8), 0.5), M(wx(E(0.25), 14), 0.24), M(1, 0.24), M(1, 0.5)], CLOTH_SH), poly([M(wx(E(0.44), -58), 0.5), M(wx(E(0.44), -38), 0.5), M(wx(E(0.3), -40), 0.29), M(wx(E(0.3), -56), 0.29)], CLOTH_HI),
      poly([M(-1, 0.5), M(1, 0.5), M(1, 0.4), M(E(0.4).c + 0.02, 0.385), M(E(0.4).c - 0.02, 0.37), M(-1, 0.385)], CLOTH_SH)], rim: rimW });
    // boot shaft
    const bys = [0.262, 0.245, 0.215, 0.17, 0.13, 0.095, 0.07];
    const infl = py => (py > 0.24 ? 0.011 : 0.006);
    const shaft = bys.map(py => M(E(py).c - E(py).w - infl(py), py)).concat(bys.slice().reverse().map(py => M(E(py).c + E(py).w + infl(py), py)));
    // foot
    const al = by + s * 15 * D, ca = Math.cos(al), sa = Math.sin(al), ea = E(0.075), xa = ea.c;
    const heel = [xa - 0.034 * sa, 0.037 + 0.005 * ca], toe = [xa + 0.1 * sa, 0.031 - 0.011 * ca], trx = 0.02 + 0.017 * Math.abs(ca), hrx = 0.02 + 0.008 * Math.abs(ca);
    const circ = (c, rx, ry, n = 14, a0 = 0, a1 = 360) => Array.from({ length: n }, (_, i) => { const a = (a0 + (a1 - a0) * i / (a1 - a0 === 360 ? n : n - 1)) * D; return [c[0] + rx * Math.cos(a), c[1] + ry * Math.sin(a)]; });
    const upRaw = [[xa - 0.031, 0.1], [xa + 0.031, 0.1]].concat(circ(heel, hrx, 0.022), circ(toe, trx, 0.021));
    const up = hull(upRaw.map(p => M(p[0], p[1])));
    const soleRaw = circ([heel[0], heel[1] - 0.021], hrx + 0.006, 0.022).concat(circ([toe[0], toe[1] - 0.016], trx + 0.006, 0.021));
    const sole = hull(soleRaw.map(p => M(p[0], p[1])));
    o += form(sole, { fill: SOLE, in: [line(sole.map(p => [p[0], p[1] - h * 0.008]), sw * 0.55, '#3a2c2a')], rim: rimW * 0.8 });
    const ank = [xa, 0.082], fd = [toe[0] - ank[0], toe[1] - 0.012 - ank[1]], fl = Math.hypot(fd[0], fd[1]) || 1, ux = fd[0] / fl, uy = fd[1] / fl;
    const at = (t, side) => M(ank[0] + ux * fl * t - uy * side, ank[1] + uy * fl * t + ux * side); // t along the foot, side across it
    const footIn = [
      poly([M(wx(ea, 12) + 0.1 * Math.max(0, sa), 0.12), M(wx(ea, 26) + 0.1 * Math.max(0, sa), -0.04), M(1, -0.04), M(1, 0.12)], LEATHER_SH),
      poly([M(xa - 0.027, 0.098), M(xa - 0.015, 0.098), at(0.5, -0.004 - trx * 0.5), at(0.5, -0.014 - trx * 0.5)], LEATHER_HI),
      poly([at(0.7, -0.1), at(0.7, 0.1), at(2, 0.1), at(2, -0.1)], C.armor),
      poly([at(0.7, 0.006), at(0.7, 0.1), at(2, 0.1), at(2, 0.012)], C.armorShade),
      poly([at(0.77, -trx * 0.75), at(0.77, -trx * 0.3), at(0.92, -trx * 0.25), at(0.95, -trx * 0.7)], C.armorHi),
      line([at(0.7, -0.1), at(0.7, 0.1)], sw * 0.8),
      poly([at(0.3, -0.1), at(0.3, 0.1), at(0.46, 0.1), at(0.46, -0.1)], LEATHER_SH, ` stroke="${INK}" stroke-width="${f(sw * 0.6)}"`),
      poly([at(0.28, -0.008), at(0.28, 0.008), at(0.48, 0.008), at(0.48, -0.008)], GOLD, ` stroke="${INK}" stroke-width="${f(sw * 0.5)}"`),
    ];
    o += form(up, { fill: LEATHER, in: footIn, rim: rimW });
    // shaft over foot
    const sIn = [
      poly([M(wx(E(0.26), 14) , 0.27), M(wx(E(0.07), 18), 0.06), M(1, 0.06), M(1, 0.27)], LEATHER_SH),
      poly([M(wx(E(0.24), -62), 0.235), M(wx(E(0.24), -48), 0.235), M(wx(E(0.1), -52), 0.09), M(wx(E(0.1), -66), 0.09)], LEATHER_HI),
      line([M(-1, 0.238), M(1, 0.238)], sw * 0.7),
    ];
    o += form(shaft, { fill: LEATHER, in: sIn, rim: rimW });
    // greave plate + knee cop
    const gr = [[0, 0.335], [30, 0.31], [52, 0.278], [45, 0.25], [52, 0.222], [47, 0.14], [34, 0.096], [0, 0.08], [-34, 0.096], [-47, 0.14], [-52, 0.222], [-45, 0.25], [-52, 0.278], [-30, 0.31]].map(([p, py]) => M(fx(py, p), py));
    const grIn = [
      poly([M(wx(E(0.33), 10), 0.34), M(wx(E(0.26), 22), 0.26), M(wx(E(0.2), 14), 0.2), M(wx(E(0.08), 12), 0.07), M(1, 0.07), M(1, 0.34)], C.armorShade),
      poly([M(wx(E(0.225), -40), 0.228), M(wx(E(0.225), -22), 0.234), M(wx(E(0.12), -20), 0.115), M(wx(E(0.12), -34), 0.12)], C.armorHi),
      poly([M(fx(0.3, -30), 0.3), M(fx(0.3, -10), 0.316), M(fx(0.27, -12), 0.27), M(fx(0.27, -36), 0.275)], C.armorHi),
      line([M(fx(0.25, -45), 0.25), M(fx(0.245, 0), 0.24), M(fx(0.25, 45), 0.25)], sw * 0.7),
      line([M(fx(0.235, 0), 0.235), M(fx(0.085, 0), 0.085)], sw * 0.5, C.armorShade),
    ];
    for (const sy of [0.19, 0.125]) o += line([M(E(sy).c - E(sy).w - 0.006, sy + 0.004), M(fx(sy, -50), sy)], h * 0.0085, LEATHER_SH) + line([M(fx(sy, 50), sy), M(E(sy).c + E(sy).w + 0.006, sy + 0.004)], h * 0.0085, LEATHER_SH);
    o += form(gr, { fill: C.armor, sw: sw * 0.85, in: grIn });
    return o;
  }

  // ---------- TORSO ----------
  const TV = [[0.758, 0.112, 0.068], [0.705, 0.134, 0.086], [0.645, 0.124, 0.083], [0.55, 0.094, 0.068], [0.5, 0.1, 0.072], [0.45, 0.108, 0.078]];
  const TE = py => { let i = 0; while (i < TV.length - 2 && py < TV[i + 1][0]) i++; const a = TV[i], b = TV[i + 1], t = cl((a[0] - py) / (a[0] - b[0])); return ell(0, 0, lerp(a[1], b[1], t), lerp(a[2], b[2], t)); };
  const tx = (py, phi) => sx(TE(py), phi), twx = (py, psi) => wx(TE(py), psi);
  let torso = '', tassets = '';
  {
    const ys = [0.758, 0.735, 0.705, 0.675, 0.645, 0.6, 0.55, 0.52, 0.497];
    const out = smooth(ys.map(py => M(-TE(py).w, py)), false, 3).concat(smooth(ys.slice().reverse().map(py => M(TE(py).w, py)), false, 3));
    const shadeP = [[0.77, 16], [0.71, 12], [0.655, 22], [0.648, 34], [0.61, 20], [0.607, 30], [0.573, 18], [0.57, 27], [0.535, 16], [0.49, 20]].map(([py, ps]) => M(twx(py, ps), py)).concat([M(1, 0.49), M(1, 0.77)]);
    const pecL = [[0, 0.652], [-30, 0.642], [-62, 0.662], [-80, 0.69]].map(([p, py]) => M(tx(py, p), py)), pecR = [[0, 0.652], [30, 0.642], [62, 0.662], [80, 0.69]].map(([p, py]) => M(tx(py, p), py));
    const under = poly(smooth(pecL, false, 4).concat([M(tx(0.672, -66), 0.648), M(tx(0.64, -30), 0.628), M(tx(0.64, 0), 0.638)]), C.armorShade);
    const hi = [
      poly([M(twx(0.72, -62), 0.728), M(twx(0.72, -36), 0.735), M(twx(0.675, -30), 0.672), M(twx(0.675, -56), 0.676)], C.armorHi),
      poly([M(twx(0.62, -56), 0.625), M(twx(0.62, -42), 0.628), M(twx(0.56, -44), 0.552), M(twx(0.56, -58), 0.556)], C.armorHi),
      poly([M(twx(0.7, 62), 0.722), M(twx(0.7, 70), 0.72), M(twx(0.6, 66), 0.6), M(twx(0.6, 58), 0.6)], C.armor),
    ];
    const lines = [
      line(smooth(pecL, false, 4), sw * 0.8), line(smooth(pecR, false, 4), sw * 0.8),
      line([0.75, 0.7, 0.652, 0.6, 0.55, 0.5].map(py => M(tx(py, 0), py)), sw * 0.7),
      ...[0.61, 0.573, 0.537].map(py => line([M(tx(py + 0.008, -52), py + 0.008), M(tx(py, 0), py - 0.004), M(tx(py + 0.008, 52), py + 0.008)], sw * 0.6)),
    ];
    const PEc = ell(0, 0, 0.212, 0.125), cpx = phi => sx(PEc, phi);
    const cast = poly([M(-1, 0.8), M(1, 0.8), M(1, 0.62), M(cpx(50) + 0.01, 0.598), M(cpx(17) + 0.008, 0.63), M(cpx(0) + 0.006, 0.7), M(cpx(-17) + 0.008, 0.636), M(cpx(-50) + 0.012, 0.602), M(-1, 0.625)], C.armorShade);
    torso = form(out, { fill: C.armor, in: [poly(shadeP, C.armorShade), under, ...hi, cast, ...lines], rim: rimW });
    // belt
    const bl = [M(-TE(0.512).w - 0.003, 0.514), M(TE(0.512).w + 0.003, 0.514), M(TE(0.485).w + 0.004, 0.482), M(-TE(0.485).w - 0.004, 0.482)];
    const bk = [[-11, 0.52], [11, 0.52], [11, 0.476], [-11, 0.476]].map(([p, py]) => M(tx(0.5, p), py));
    const belt = form(bl, { fill: LEATHER_SH, sw: sw * 0.8, in: [poly([M(-1, 0.514), M(twx(0.5, -10), 0.514), M(twx(0.5, -10), 0.5), M(-1, 0.5)], LEATHER)] }) + form(bk, { fill: GOLD, sw: sw * 0.7, in: [poly([bk[0], [lerp(bk[0][0], bk[1][0], 0.45), bk[0][1]], [lerp(bk[0][0], bk[1][0], 0.2), bk[2][1]], bk[3]], GOLD_HI)] });
    // tassets
    const HE = TE(0.46);
    const tp = (p1, p2, top, bot) => { const pm = (p1 + p2) / 2; return [M(sx(HE, p1), top), M(sx(HE, p2), top), M(sx(HE, p2) , bot + 0.022), M(sx(HE, pm), bot), M(sx(HE, p1), bot + 0.022)]; };
    const tIn = (p1) => [poly([M(wx(HE, 18), 0.5), M(wx(HE, 24), 0.36), M(1, 0.36), M(1, 0.5)], C.armorShade)];
    for (const [p1, p2, bot] of [[-88, -30, 0.4], [30, 88, 0.4], [-28, 28, 0.415]]) {
      const pp = tp(p1, p2, 0.487, bot);
      tassets += form(pp, { fill: C.armor, sw: sw * 0.85, in: tIn(p1).concat(p1 < 20 ? [poly([M(wx(HE, -60), 0.48), M(wx(HE, -44), 0.48), M(wx(HE, -46), 0.425), M(wx(HE, -58), 0.43)], C.armorHi)] : []) });
    }
    tassets += belt;
  }

  // ---------- ARMS ----------
  const A3 = (X, Y, Z) => [X * cb + Z * sb, Y];
  function arm(s, withBlade) {
    const sh = A3(s * 0.156, 0.722, 0), el = A3(s * 0.178, 0.57, -0.015), wr = A3(s * 0.168, 0.445, 0.035), hd = A3(s * 0.165, 0.405, 0.045);
    const seg = (a, b, wa, wb) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l; return [[a[0] + nx * wa, a[1] + ny * wa], [b[0] + nx * wb, b[1] + ny * wb], [b[0] - nx * wb, b[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]]; };
    const fr = 0.82 + 0.18 * cb;
    const up = seg(sh, el, 0.036 * fr, 0.03 * fr), fo = seg([el[0], el[1] + 0.012], wr, 0.033 * fr, 0.025 * fr);
    const shadeX = c => M(c[0] + (s > 0 ? -0.012 : 0.006), c[1]);
    const mk = (q, fill, extra = []) => form(smooth([q[0], [lerp(q[0][0], q[1][0], 0.5), lerp(q[0][1], q[1][1], 0.5)], q[1], q[2], [lerp(q[2][0], q[3][0], 0.5), lerp(q[2][1], q[3][1], 0.5)], q[3]].map(p => M(p[0], p[1])), true, 3), { fill, in: [poly([shadeX([sh[0], 0.8]), shadeX([wr[0], 0.38]), M(1, 0.38), M(1, 0.8)], C.armorShade)].concat(extra), rim: rimW });
    const hiU = poly([M(sh[0] - 0.024 * fr, 0.69), M(sh[0] - 0.011 * fr, 0.69), M(el[0] - 0.01 * fr, 0.6), M(el[0] - 0.021 * fr, 0.6)], C.armorHi);
    const hiF = poly([M(el[0] - 0.023 * fr, 0.55), M(el[0] - 0.01 * fr, 0.55), M(wr[0] - 0.007 * fr, 0.465), M(wr[0] - 0.017 * fr, 0.465)], C.armorHi);
    const bands = [0.655, 0.625].map(py => line([M(lerp(sh[0], el[0], (0.722 - py) / 0.152) - 0.04, py + 0.004), M(lerp(sh[0], el[0], (0.722 - py) / 0.152) + 0.04, py - 0.004)], sw * 0.6)).join('');
    let o = mk(up, C.armor, [hiU, bands]) + mk(fo, C.armor, [hiF, line([M(wr[0] - 0.04, 0.462), M(wr[0] + 0.04, 0.458)], sw * 0.6)]);
    // elbow cop
    const ec = [[-0.038, 0.012], [0, 0.032], [0.038, 0.012], [0.032, -0.022], [0, -0.036], [-0.032, -0.022]].map(([dx, dy]) => M(el[0] + dx * fr, el[1] + dy));
    o += form(ec, { fill: C.armor, sw: sw * 0.85, in: [poly([M(el[0] + (s > 0 ? -0.012 : 0.008), 0.62), M(el[0] + (s > 0 ? -0.006 : 0.014), 0.52), M(1, 0.52), M(1, 0.62)], C.armorShade), poly([M(el[0] - 0.024 * fr, el[1] + 0.012), M(el[0] - 0.006 * fr, el[1] + 0.02), M(el[0] - 0.01 * fr, el[1] - 0.004), M(el[0] - 0.024 * fr, el[1] - 0.008)], C.armorHi)] });
    let bl = '';
    if (withBlade) {
      const th = -9 * D, ct = Math.cos(th), st = Math.sin(th), kx = 0.7 + 0.3 * cb;
      const B = (u, v) => M(hd[0] + (u * kx) * ct + v * st, hd[1] - (-(u * kx) * st + v * ct));
      const cen = [[0, 0.03], [0, 0.1], [0, 0.17], [-0.004, 0.225], [-0.018, 0.272], [-0.045, 0.308], [-0.082, 0.325], [-0.118, 0.318]];
      const cs = smooth(cen, false, 4), n = cs.length, L = [], R = [];
      for (let i = 0; i < n; i++) { const a = cs[Math.max(0, i - 1)], b = cs[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, t = i / (n - 1), w = 0.015 * Math.pow(1 - t, 0.55) * (t < 0.85 ? 1 : 1) + 0.0005; L.push([cs[i][0] + dy / l * w, cs[i][1] - dx / l * w]); R.push([cs[i][0] - dy / l * w, cs[i][1] + dx / l * w]); }
      const bp = L.concat(R.reverse()).map(p => B(p[0], p[1]));
      const inner = cs.map(p => B(p[0], p[1]));
      bl += form(bp, { fill: STEEL, sw: sw * 0.85, in: [line(inner.map(p => [p[0] + h * 0.0085, p[1] - h * 0.004]), h * 0.014, STEEL_SH), line(inner.map(p => [p[0] - h * 0.006, p[1]]), h * 0.003, '#ffffff')], rim: rimW * 0.7 });
      bl += form([B(-0.026, 0.022), B(0.026, 0.022), B(0.02, 0.036), B(-0.02, 0.036)], { fill: GOLD, sw: sw * 0.7, in: [poly([B(-0.026, 0.022), B(-0.004, 0.022), B(-0.008, 0.036), B(-0.02, 0.036)], GOLD_HI)] });
      bl += form([B(-0.008, -0.05), B(0.008, -0.05), B(0.009, 0.024), B(-0.009, 0.024)], { fill: LEATHER_SH, sw: sw * 0.7 });
      bl += form([B(-0.012, -0.064), B(0.012, -0.064), B(0.014, -0.05), B(-0.014, -0.05)], { fill: GOLD, sw: sw * 0.7 });
    }
    // gauntlet fist
    const fist = [[-0.029, 0.034], [0.027, 0.036], [0.032, 0.004], [0.026, -0.028], [0.002, -0.04], [-0.024, -0.03], [-0.032, 0]].map(([dx, dy]) => M(hd[0] + dx * fr, hd[1] + dy));
    const fistIn = [poly([M(hd[0] + (s > 0 ? -0.01 : 0.006), 0.45), M(hd[0] + (s > 0 ? -0.004 : 0.012), 0.36), M(1, 0.36), M(1, 0.45)], C.armorShade),
      line([M(hd[0] - 0.03, hd[1] + 0.006), M(hd[0] + 0.03, hd[1] + 0.004)], sw * 0.6), line([M(hd[0] - 0.008 * fr, hd[1] + 0.004), M(hd[0] - 0.007 * fr, hd[1] - 0.028)], sw * 0.5), line([M(hd[0] + 0.007 * fr, hd[1] + 0.004), M(hd[0] + 0.008 * fr, hd[1] - 0.03)], sw * 0.5),
      poly([M(hd[0] - 0.02 * fr, hd[1] + 0.024), M(hd[0] - 0.006 * fr, hd[1] + 0.026), M(hd[0] - 0.008 * fr, hd[1] + 0.012), M(hd[0] - 0.021 * fr, hd[1] + 0.01)], C.armorHi)];
    return o + bl + form(fist, { fill: C.armor, sw: sw * 0.9, in: fistIn, rim: rimW * 0.8 });
  }

  // ---------- WOLF PELT (two fur layers) ----------
  let pelt = '';
  {
    const PE = ell(0, 0, 0.212, 0.125), W = PE.w, px = phi => sx(PE, phi);
    const tuft = i => h * (i >= 3 && i <= 10 ? 0.022 : 0.011);
    const under = [[-0.5 * W, 0.78], [-0.98 * W, 0.74], [-1.07 * W, 0.685], [-0.98 * W, 0.625], [px(-52), 0.598], [px(-20), 0.63], [px(-4), 0.7], [px(4), 0.7], [px(20), 0.63], [px(52), 0.598], [0.98 * W, 0.625], [1.07 * W, 0.685], [0.98 * W, 0.74], [0.5 * W, 0.78]].map(p => M(p[0], p[1]));
    const up = fur(under, i => [2, 3, 4, 5, 4, 3, 1, 3, 4, 5, 4, 3, 2, 2][i], i => h * (i >= 1 && i <= 11 ? 0.022 : 0.01), 3);
    const shadeR = poly([M(wx(PE, 26), 0.84), M(wx(PE, 18), 0.72), M(wx(PE, 32), 0.56), M(1, 0.56), M(1, 0.84)], C.peltShade);
    pelt += form(up, { fill: PELT_MID, in: [shadeR], rim: rimW });
    const base = [[-0.3 * W, 0.805], [-0.62 * W, 0.8], [-0.9 * W, 0.768], [-0.99 * W, 0.722], [-0.9 * W, 0.672], [px(-48), 0.655], [px(-15), 0.688], [px(0), 0.748], [px(15), 0.688], [px(48), 0.655], [0.9 * W, 0.672], [0.99 * W, 0.722], [0.9 * W, 0.768], [0.62 * W, 0.8], [0.3 * W, 0.805]].map(p => M(p[0], p[1]));
    const pp = fur(base, i => [2, 3, 3, 3, 5, 4, 3, 3, 4, 5, 3, 3, 3, 2, 2][i], tuft, 7);
    const clumps = [[-74, 0.752, 1], [-50, 0.728, 1.2], [-28, 0.756, 0.9], [-64, 0.705, 1.1], [-38, 0.7, 1], [-84, 0.715, 0.9], [-16, 0.725, 0.8], [34, 0.74, 1], [58, 0.716, 1.2], [44, 0.695, 1], [74, 0.742, 0.9], [22, 0.715, 0.8]]
      .map(([p, py, k], i) => { const q = M(px(p), py), l = h * 0.02 * k, lean = (p < 0 ? -1 : 1) * l * 0.25; return poly([[q[0] - l * 0.42, q[1] - l * 0.35], [q[0] + lean, q[1] + l * 0.75], [q[0] + l * 0.4, q[1] - l * 0.45], [q[0] + lean * 0.3, q[1] - l * 0.05]], p > 18 ? '#5d6579' : C.peltShade); });
    pelt += form(pp, { fill: C.pelt, in: [shadeR].concat(clumps), rim: rimW });
  }

  // ---------- HEAD ----------
  const r = h * 0.082, ya = yaw * D, pa = pitch * D, cy_ = Math.cos(ya), sy_ = Math.sin(ya), cp = Math.cos(pa), sp = Math.sin(pa);
  const hcx = x + h * 0.014 * sy_, hcy = y - h * 0.9;
  const P = (X, Y, Z) => { const y1 = Y * cp + Z * sp, z1 = -Y * sp + Z * cp; return [hcx + (X * cy_ + z1 * sy_) * r, hcy - y1 * r, -X * sy_ + z1 * cy_]; };
  const toLocal = v => { const X = v[0] * cy_ - v[2] * sy_, z1 = v[0] * sy_ + v[2] * cy_; return [X, v[1] * cp - z1 * sp, v[1] * sp + z1 * cp]; };
  const fw = r * 0.062; // face ink weight
  // ellipsoid form shadow (terminator arc + silhouette arc on the dark side)
  function formShadow(ctr, ax, Lw, grow) {
    const Ll = toLocal(Lw), Vl = toLocal([0, 0, 1]);
    const Lp = [Ll[0] * ax[0], Ll[1] * ax[1], Ll[2] * ax[2]], Vp = [Vl[0] * ax[0], Vl[1] * ax[1], Vl[2] * ax[2]]; // plane normals in unit-sphere space
    const j = norm3(cross(Lp, Vp)); let e2 = norm3(cross(Lp, j)); if (dot(e2, Vp) < 0) e2 = e2.map(v => -v);
    let g = norm3(cross(Vp, j)); if (dot(g, Lp) > 0) g = g.map(v => -v);
    const pt = (s, k) => { const q = P(ctr[0] + ax[0] * s[0] * k, ctr[1] + ax[1] * s[1] * k, ctr[2] + ax[2] * s[2] * k); return [q[0], q[1]]; };
    const out = [], n = 16;
    for (let i = 0; i <= n; i++) { const t = Math.PI * i / n, c = Math.cos(t), s = Math.sin(t); out.push(pt([j[0] * c + e2[0] * s, j[1] * c + e2[1] * s, j[2] * c + e2[2] * s], 1)); }
    for (let i = 0; i <= n; i++) { const t = Math.PI * i / n, c = Math.cos(t), s = Math.sin(t); out.push(pt([-j[0] * c + g[0] * s, -j[1] * c + g[1] * s, -j[2] * c + g[2] * s], grow)); }
    return out;
  }
  const LIGHT = norm3([-0.8, 0.38, 0.42]);
  const shadowPts = formShadow([0, -0.15, -0.05], [1.0, 1.4, 1.1], LIGHT, 1.7);

  // skull + jaw hull
  const hp = [];
  for (let la = -60; la <= 90; la += 15) for (let lo = 0; lo < 360; lo += 20) { const A = la * D, L = lo * D; hp.push(P(0.9 * Math.cos(A) * Math.sin(L), 0.05 + Math.sin(A), -0.08 + 1.05 * Math.cos(A) * Math.cos(L))); }
  for (const s of [-1, 1]) hp.push(P(s * 0.75, -0.8, -0.05), P(s * 0.81, -0.3, 0.42), P(s * 0.27, -1.45, 0.66), P(s * 0.54, -1.2, 0.38), P(s * 0.3, 0.02, 0.93), P(s * 0.42, -0.55, 0.74));
  hp.push(P(0, -1.48, 0.7), P(0, 0.05, 0.97), P(0, 0.5, 0.86), P(0, -0.98, 0.9), P(0, -1.3, 0.8));
  const headHull = hull(hp.map(p => [p[0], p[1]]));

  // hair volume hull (swept-back mass + nape)
  const HC = [0, 0.14, -0.22], HA = [1.03, 1.2, 1.24];
  const HP = (v, k = 1) => P(HC[0] + HA[0] * v[0] * k, HC[1] + HA[1] * v[1] * k, HC[2] + HA[2] * v[2] * k);
  const dir = (lo, la) => { const A = la * D, L = lo * D; return [Math.cos(A) * Math.sin(L), Math.sin(A), Math.cos(A) * Math.cos(L)]; };
  const hh = [];
  for (let la = -45; la <= 90; la += 15) for (let lo = 0; lo < 360; lo += 20) hh.push(HP(dir(lo, la)));
  hh.push(P(0, -1.3, -1.0), P(-0.5, -1.15, -0.85), P(0.5, -1.15, -0.85), P(0, 0.9, -1.2));
  const hairHull = hull(hh.map(p => [p[0], p[1]]));
  // hairline: 3D points from behind the viewer-left ear, over the forehead (widow's peak), to behind the right ear
  const sk = (lo, la) => { const v = dir(lo, la); return [0.9 * v[0], 0.05 + v[1], -0.08 + 1.05 * v[2]]; };
  const half = [[0.8, -0.9, -0.3], [0.88, -0.5, -0.36], [0.93, -0.12, -0.2], sk(86, -6), sk(76, -14), sk(72, 4), sk(66, 22), sk(56, 38), sk(40, 49), sk(22, 54), sk(8, 50)];
  const HL3 = half.map(v => [-v[0], v[1], v[2]]).concat([sk(0, 45)], half.slice().reverse());
  const cut = HL3.map(v => { const q = P(v[0], v[1], v[2]); return [q[0] + ss(0, -0.35, q[2]) * 0.9 * r * Math.sign(v[0] || 1), q[1]]; });
  const cutPoly = [[cut[0][0], cut[0][1] + 3 * r]].concat(cut, [[cut[cut.length - 1][0], cut[cut.length - 1][1] + 3 * r]]);

  // ---------- HAIR LOCKS ----------
  // tapered ribbon along a quadratic curve; tone 0 = lit lock, 1 = under layer, 2 = lock on the shadow side
  function ribbon(R0, Cq, T, w0, tone, rim, spindle) {
    const n = 10, Lp = [], Rp = [], Hi1 = [], Hi2 = [], Sh1 = [];
    for (let k = 0; k <= n; k++) {
      const t = k / n, u = 1 - t, cx0 = u * u * R0[0] + 2 * u * t * Cq[0] + t * t * T[0], cy0 = u * u * R0[1] + 2 * u * t * Cq[1] + t * t * T[1];
      let dx = 2 * u * (Cq[0] - R0[0]) + 2 * t * (T[0] - Cq[0]), dy = 2 * u * (Cq[1] - R0[1]) + 2 * t * (T[1] - Cq[1]); const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const hw = spindle ? w0 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.62)), 0.8) + 0.1 : w0 * Math.pow(1 - t, 0.75) * (0.8 + 0.2 * Math.sin(Math.PI * Math.min(1, t * 2))) + 0.2;
      Lp.push([cx0 + dy * hw, cy0 - dx * hw]); Rp.push([cx0 - dy * hw, cy0 + dx * hw]);
      // the lit side of a lock is its upper-left edge in screen space
      const lx = -0.8, ly = -0.6, sg = (dy * lx - dx * ly) >= 0 ? 1 : -1;
      if (t > 0.05 && t < 0.82) { Hi1.push([cx0 + sg * dy * hw * 0.7, cy0 - sg * dx * hw * 0.7]); Hi2.push([cx0 + sg * dy * hw * 0.3, cy0 - sg * dx * hw * 0.3]); }
      Sh1.push([cx0 - sg * dy * hw * (tone === 2 ? -0.35 : 0.25), cy0 + sg * dx * hw * (tone === 2 ? -0.35 : 0.25), sg * dy, -sg * dx]);
    }
    const pts = Lp.concat(Rp.reverse());
    if (tone === 1) return form(pts, { fill: C.hairShade, sw: sw * 0.8, in: [poly(Hi1.concat(Hi2.reverse()), '#a97a2a')] });
    const shade = poly(Sh1.map(p => [p[0], p[1]]).concat(Sh1.slice().reverse().map(p => [p[0] - p[2] * 4 * w0, p[1] - p[3] * 4 * w0])), C.hairShade);
    return form(pts, { fill: C.hair, sw: sw * 0.8, in: [shade, tone === 0 ? poly(Hi1.concat(Hi2.reverse()), C.hairHi) : ''], rim: rim ? rimW * 0.8 : 0 });
  }
  let backHair = '', sideLocks = '';
  {
    // lon, lat, length, root width, wind gain, tone   (all in skull radii)
    const LOCKS = [[180, -25, 2.7, 0.8, 0.4, 1], [-140, -18, 3.0, 0.55, 0.65, 1], [140, -18, 3.0, 0.55, 0.65, 1],
      [-150, 25, 1.2, 0.32, 1.5, 1], [150, 25, 1.2, 0.32, 1.5, 1], [180, 55, 0.9, 0.3, 1.8, 1],
      [-125, -12, 3.1, 0.42, 0.85, 0], [125, -12, 3.1, 0.42, 0.85, 0], [-104, -6, 2.7, 0.36, 0.6, 0], [104, -6, 2.7, 0.36, 0.6, 0],
      [-118, 6, 3.3, 0.14, 1.45, 0], [118, 6, 3.3, 0.14, 1.45, 0], [-150, 12, 3.0, 0.1, 1.9, 0], [150, 12, 3.0, 0.1, 1.9, 0]];
    LOCKS.forEach(([lo, la, len, w0, gain, tone], i) => {
      const R0 = HP(dir(lo, la), 0.85), rel = (R0[0] - hcx) / r, vx = stream * gain + rel * 0.18, nl = Math.hypot(vx, 1), ph = i * 1.7, ln = len * r;
      const T = [R0[0] + ln * vx / nl + ln * 0.06 * Math.sin(wind * 2.3 + ph), R0[1] + ln / nl + ln * 0.025 * Math.cos(wind * 1.9 + ph)];
      const Cq = [R0[0] + ln * 0.62 * vx / nl + rel * r * 0.3 + ln * 0.03 * Math.sin(wind * 2.3 + ph + 1), R0[1] + ln * 0.3 / nl];
      backHair += ribbon(R0, Cq, T, w0 * r, tone === 0 && T[0] > hcx + r * 0.2 ? 0 : tone, w0 > 0.25);
    });
    // thin strands from the temples that frame the face
    for (const s of [-1, 1]) {
      const v = sk(s * 63, 25), q = P(v[0] * 1.04, v[1] * 1.03, v[2] * 1.04), vis = ss(-0.05, 0.3, q[2]);
      if (vis <= 0) continue;
      const ph = s * 2.1, side = 1 - 0.55 * ss(0.7, 1.0, q[2]), len = (2.25 - 0.5 * ss(0.7, 1.0, q[2])) * r;
      const T = [q[0] + (s * 0.1 + stream * 0.7) * r + 0.12 * r * Math.sin(wind * 2.3 + ph), q[1] + len], Cq = [q[0] + s * 0.42 * r + 0.05 * r * Math.sin(wind * 2.3 + ph + 1), q[1] + 0.42 * len];
      sideLocks += ribbon([q[0], q[1]], Cq, T, 0.12 * r * vis * side, s > 0 ? 2 : 0, false, true);
    }
  }

  // ---------- NECK ----------
  let neck = '';
  {
    const nx0 = (hcx - x) / h, back = 0.016 * ss(0, 60, Math.abs(yaw));
    const lft = -0.04 + (yaw > 0 ? back : 0), rgt = 0.04 - (yaw < 0 ? back : 0);
    const np = [M(nx0 * 0.9 + lft, 0.81), M(nx0 * 0.9 + rgt, 0.81), M(nx0 * 0.3 + rgt + 0.008, 0.742), M(nx0 * 0.3 + lft - 0.008, 0.742)];
    neck = form(np, { fill: C.skinShade, sw: sw * 0.85, in: [poly([M(nx0 * 0.9 + lft, 0.775), M(nx0 * 0.9 + lft + 0.02, 0.77), M(nx0 * 0.3 + lft + 0.016, 0.73), M(nx0 * 0.3 + lft - 0.02, 0.73)], C.skin)] });
    // gorget
    const g = [[-46, 0.772], [0, 0.752], [46, 0.772], [50, 0.75], [0, 0.722], [-50, 0.75]].map(([p, py]) => M(sx(ell(0, 0, 0.062, 0.05), p) + nx0 * 0.3, py));
    neck += form(g, { fill: C.armor, sw: sw * 0.85, in: [poly([M(nx0 * 0.3 + 0.012, 0.8), M(nx0 * 0.3 + 0.02, 0.7), M(1, 0.7), M(1, 0.8)], C.armorShade), poly([g[0], [lerp(g[0][0], g[1][0], 0.6), lerp(g[0][1], g[1][1], 0.6)], [lerp(g[5][0], g[4][0], 0.55), lerp(g[5][1], g[4][1], 0.55) - h * 0.008], [g[5][0], g[5][1] - h * 0.008]], C.armorHi)] });
  }

  // ---------- FACE ----------
  const p2 = (X, Y, Z) => { const q = P(X, Y, Z); return [q[0], q[1]]; };
  const EX = {
    neutral: { open: 0.9, bi: 0.02, bo: 0.065, sock: 0.6 }, brood: { open: 0.68, bi: -0.04, bo: 0.05, sock: 1 }, angry: { open: 0.62, bi: -0.085, bo: 0.11, sock: 1 },
    smile: { open: 0.8, bi: 0.05, bo: 0.085, sock: 0.45 }, grin: { open: 0.85, bi: 0.03, bo: 0.115, sock: 0.45 },
  }[expr] || { open: 0.9, bi: 0.02, bo: 0.065, sock: 0.6 };
  const open = blink ? 0.04 : EX.open;
  let faceShade = [], feat = '';
  faceShade.push(poly(shadowPts, C.skinShade));
  // hair cast shadow under the hairline
  faceShade.push(`<path d="${pathD(cutPoly, false)}" fill="none" stroke="${C.skinShade}" stroke-width="${f(r * 0.2)}" stroke-linejoin="round"/>`);
  for (const s of [-1, 1]) {
    // socket shadow
    const k = EX.sock;
    faceShade.push(poly([p2(s * 0.1, EX.bi, 0.93), p2(s * 0.42, EX.bo + 0.02, 0.86), p2(s * 0.7, EX.bo - 0.03, 0.62), p2(s * 0.68, -0.14 - 0.1 * k, 0.64), p2(s * 0.45, -0.2 - 0.1 * k, 0.82), p2(s * 0.15, -0.16 - 0.08 * k, 0.88)], C.skinShade));
    // cheek plane line
    const c1 = P(s * 0.74, -0.42, 0.5), c2 = P(s * 0.56, -0.86, 0.68);
    feat += line([[c1[0], c1[1]], [c2[0], c2[1]]], fw * 0.55, SKIN_LINE, ` opacity="${f(ss(0.05, 0.35, c1[2]) * 0.8)}"`);
  }
  // under-lip + chin shade
  faceShade.push(poly([p2(-0.2, -1.14, 0.88), p2(0.2, -1.14, 0.88), p2(0.1, -1.22, 0.88), p2(-0.1, -1.22, 0.88)], C.skinShade));
  // eyes
  for (const s of [-1, 1]) {
    const I = P(s * 0.17, -0.155, 0.88), O = P(s * 0.6, -0.105, 0.67);
    const vis = ss(0.07, 0.2, Math.abs(O[0] - I[0]) / r);
    if (vis <= 0) continue;
    const yTop = -0.155 + open * 0.115, eye = [[I[0], I[1]], p2(s * 0.3, yTop - 0.012, 0.87), p2(s * 0.48, yTop + 0.012, 0.8), [O[0], O[1]], p2(s * 0.46, -0.215 + (1 - open) * 0.06, 0.8), p2(s * 0.28, -0.2 + (1 - open) * 0.05, 0.86)];
    const ic = P(s * 0.385, -0.13, 0.85), ie = P(s * 0.385 + 0.105, -0.13, 0.85 - s * 0.03), irx = Math.max(r * 0.03, Math.abs(ie[0] - ic[0])), iry = r * 0.11;
    const cid = nid();
    let e = `<clipPath id="${cid}"><path d="${pathD(eye)}"/></clipPath><path d="${pathD(eye)}" fill="${SCLERA}"/><g clip-path="url(#${cid})">`
      + `<ellipse cx="${f(ic[0])}" cy="${f(ic[1])}" rx="${f(irx)}" ry="${f(iry)}" fill="${C.eye}" stroke="${INK}" stroke-width="${f(fw * 0.5)}"/>`
      + `<ellipse cx="${f(ic[0])}" cy="${f(ic[1])}" rx="${f(irx * 0.45)}" ry="${f(iry * 0.45)}" fill="${INK}"/>`
      + `<ellipse cx="${f(ic[0] - irx * 0.35)}" cy="${f(ic[1] - iry * 0.4)}" rx="${f(irx * 0.22)}" ry="${f(iry * 0.2)}" fill="#fff"/>`
      + `<path d="${pathD([eye[0], eye[1], eye[2], eye[3], [eye[3][0], eye[3][1] + r * 0.03], [eye[0][0], eye[0][1] + r * 0.035]])}" fill="${C.skinShade}" opacity=".3"/></g>`;
    e += line([eye[0], eye[1], eye[2], eye[3], p2(s * 0.66, -0.08, 0.6)], fw * 1.15) + line([eye[3], eye[4], eye[5]], fw * 0.5);
    if (blink) e = line([eye[0], eye[5], eye[4], eye[3]], fw * 1.1);
    feat += `<g opacity="${f(vis)}">${e}</g>`;
    // brow
    const bi = EX.bi, bo = EX.bo;
    const brow = [p2(s * 0.11, bi - 0.035, 0.94), p2(s * 0.09, bi + 0.06, 0.95), p2(s * 0.42, bo + 0.085, 0.86), p2(s * 0.72, bo - 0.02, 0.6), p2(s * 0.44, lerp(bi, bo, 0.6) - 0.012, 0.85)];
    feat += `<g opacity="${f(vis)}"><path d="${pathD(brow)}" fill="${BROW}" stroke="${INK}" stroke-width="${f(fw * 0.5)}" stroke-linejoin="round"/></g>`;
  }
  if (expr === 'angry') feat += line([p2(-0.045, EX.bi + 0.1, 0.96), p2(-0.03, EX.bi - 0.02, 0.96)], fw * 0.6, SKIN_LINE) + line([p2(0.045, EX.bi + 0.1, 0.96), p2(0.03, EX.bi - 0.02, 0.96)], fw * 0.6, SKIN_LINE);
  // nose: two planes, far one first (drawn over the head outline so it can project past the cheek)
  let noseOver = '';
  { const keep = feat; feat = '';
    const bt = p2(0, 0.0, 0.92), bm = p2(0, -0.36, 1.12), tip = p2(0, -0.67, 1.38), ut = p2(0, -0.78, 1.18), nb = p2(0, -0.84, 0.92);
    const plane = s => [bt, bm, tip, ut, nb, p2(s * 0.215, -0.76, 0.9), p2(s * 0.25, -0.5, 0.86), p2(s * 0.12, -0.06, 0.88)];
    const far = yaw >= 0 ? 1 : -1;
    const drawPlane = s => poly(plane(s), s > 0 ? C.skinShade : C.skin);
    feat += poly([nb, p2(0.215, -0.76, 0.9), p2(0.3, -0.93, 0.85), p2(0.06, -0.9, 0.92)], C.skinShade); // cast shadow
    feat += drawPlane(far) + drawPlane(-far);
    const prot = Math.abs(tip[0] - nb[0]) / r;
    feat += line(smooth([bt, bm, tip], false, 4).concat([ut, nb]), fw * (0.15 + 0.85 * ss(0.03, 0.3, prot)), INK, ` opacity="${f(ss(0.0, 0.12, prot))}"`);
    feat += line(smooth([p2(-0.215, -0.76, 0.9), p2(-0.12, -0.815, 0.98), ut, p2(0.12, -0.815, 0.98), p2(0.215, -0.76, 0.9)], false, 4), fw * 0.75);
    feat += line([p2(-0.215, -0.76, 0.9), p2(-0.235, -0.68, 0.9)], fw * 0.6) + line([p2(0.215, -0.76, 0.9), p2(0.235, -0.68, 0.9)], fw * 0.6);
    noseOver = feat; feat = keep;
  }
  // mouth
  {
    const mp = (a) => smooth(a.map(q => p2(q[0], q[1], q[2])), false, 5);
    if (expr === 'grin' || expr === 'angry') {
      const g = expr === 'grin';
      const cL = g ? [-0.44, -0.94, 0.74] : [-0.34, -1.07, 0.78], cR = g ? [0.44, -0.92, 0.74] : [0.34, -1.07, 0.78];
      const top = mp([cL, [-0.2, g ? -1.0 : -0.98, 0.9], [0, g ? -1.0 : -0.96, 0.94], [0.2, g ? -1.0 : -0.98, 0.9], cR]);
      const bot = mp([cR, [0.22, g ? -1.19 : -1.15, 0.86], [0, g ? -1.24 : -1.17, 0.9], [-0.22, g ? -1.19 : -1.15, 0.86], cL]);
      const m = top.concat(bot), mid = mp([[cL[0] * 0.9, cL[1] - (g ? 0.1 : 0.03), 0.78], [0, g ? -1.115 : -1.065, 0.92], [cR[0] * 0.9, cR[1] - (g ? 0.1 : 0.03), 0.78]]);
      const teeth = [-0.22, -0.11, 0, 0.11, 0.22].map(tx0 => line([p2(tx0, g ? -1.0 : -0.97, 0.92), p2(tx0, g ? -1.115 : -1.065, 0.92)], fw * 0.3, '#b9a892')).join('');
      feat += form(m, { fill: TEETH, sw: fw * 0.95, in: [teeth, line(mid, fw * 0.5), poly([p2(0.12, -0.9, 0.9), p2(0.6, -0.9, 0.7), p2(0.6, -1.3, 0.7), p2(0.2, -1.3, 0.9)], '#cbbfae')] });
      if (g) feat += line(mp([[-0.5, -0.86, 0.72], [-0.48, -0.94, 0.72], [-0.5, -1.02, 0.72]]), fw * 0.5, SKIN_LINE) + line(mp([[0.5, -0.84, 0.72], [0.48, -0.92, 0.72], [0.5, -1.0, 0.72]]), fw * 0.5, SKIN_LINE);
    } else {
      const sm = expr === 'smile', br = expr === 'brood';
      const pts = sm ? [[-0.37, -0.955, 0.77], [-0.2, -1.02, 0.88], [0, -1.035, 0.93], [0.2, -1.03, 0.88], [0.34, -0.985, 0.78]]
        : [[-0.3, br ? -1.055 : -1.035, 0.8], [-0.15, -1.012, 0.9], [0, -1.02, 0.93], [0.15, -1.012, 0.9], [0.3, br ? -1.055 : -1.035, 0.8]];
      feat += line(mp(pts), fw * 1.0);
      feat += line(mp([[-0.13, -1.125, 0.9], [0, -1.14, 0.92], [0.13, -1.125, 0.9]]), fw * 0.5, SKIN_LINE);
      if (sm) feat += line(mp([[-0.44, -0.9, 0.72], [-0.42, -0.96, 0.72], [-0.44, -1.03, 0.72]]), fw * 0.5, SKIN_LINE);
    }
  }
  if (scar) feat += line([p2(-0.52, 0.2, 0.74), p2(-0.47, -0.02, 0.8)], fw * 0.7, '#b9705f') + line([p2(-0.47, -0.24, 0.8), p2(-0.44, -0.46, 0.8)], fw * 0.7, '#b9705f');
  const head = form(headHull, { fill: C.skin, sw: sw, in: faceShade.concat([feat]), rim: rimW, over: noseOver });

  // ---------- HAIR CAP ----------
  let hairCap = '';
  {
    const mid = nid(), cid = nid(), bb = [hcx - 3 * r, hcy - 3 * r, 6 * r, 6 * r].map(f);
    const rotX = (v, b) => [v[0], v[1] * Math.cos(b) + v[2] * Math.sin(b), -v[1] * Math.sin(b) + v[2] * Math.cos(b)];
    const flow = (lo, la, s0, s1, n = 14) => { // swept-back path over the hair volume, only the part facing the camera
      const A = la * D, L = lo * D, v0 = [Math.cos(A) * Math.sin(L), Math.sin(A), Math.cos(A) * Math.cos(L)], out = [];
      for (let i = 0; i <= n; i++) { const s = lerp(s0, s1, i / n), v = rotX(v0, s * 135 * D), q = HP([v[0] * (1 + 0.3 * s), v[1], v[2]], 1.0); if (q[2] < -0.02) break; out.push([q[0], q[1]]); }
      return out;
    };
    let inner = '';
    // highlights (key side) then form shadow, then ink flow lines
    for (const [lo, la, a, b, w] of [[-44, 46, 0.1, 0.55, 0.15], [-20, 52, 0.08, 0.5, 0.13], [-64, 30, 0.12, 0.6, 0.12], [4, 50, 0.1, 0.42, 0.1]]) { const pp = flow(lo, la, a, b); if (pp.length > 2) inner += line(pp, r * w, C.hairHi); }
    inner += poly(shadowPts, C.hairShade);
    for (const [lo, la, a, b, w] of [[30, 52, 0.12, 0.4, 0.07]]) { const pp = flow(lo, la, a, b); if (pp.length > 2) inner += line(pp, r * w, C.hair); }
    for (const [lo, la] of [[-70, 18], [-46, 44], [-14, 50], [20, 52], [50, 42], [72, 14]]) { const pp = flow(lo, la, 0.03, 0.55 + 0.2 * hash(lo)); if (pp.length > 2) inner += line(pp, fw * 0.75, INK); }
    inner += rimPath(hairHull, rimW, sw * 0.5);
    let capStroke = ''; { const N = hairHull.length, sg = area(hairHull) > 0 ? 1 : -1; let run = [], rw = 0;
      const flush = () => { if (run.length > 1) capStroke += line(run, rw); run = []; };
      for (let i = 0; i < N; i++) { const a = hairHull[i], b = hairHull[(i + 1) % N], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, ny = -(b[0] - a[0]) / l * sg, w = sw * ss(0.55, 0.15, ny);
        if (w <= 0.01) { flush(); continue; } if (run.length && Math.abs(w - rw) > 0.01) flush(); if (!run.length) { run.push(a); rw = w; } run.push(b); }
      flush(); }
    hairCap = `<mask id="${mid}" maskUnits="userSpaceOnUse" x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}"><rect x="${bb[0]}" y="${bb[1]}" width="${bb[2]}" height="${bb[3]}" fill="#fff"/><path d="${pathD(cutPoly)}" fill="#000"/></mask>`
      + `<clipPath id="${cid}"><path d="${pathD(hairHull)}"/></clipPath>`
      + `<g mask="url(#${mid})"><g clip-path="url(#${cid})"><path d="${pathD(hairHull)}" fill="${C.hair}"/>${inner}</g>${capStroke}</g>`
      + `<g clip-path="url(#${cid})"><path d="${pathD(cutPoly, false)}" fill="none" stroke="${INK}" stroke-width="${f(sw * 0.8)}" stroke-linejoin="round"/></g>`;
  }
  // ---------- EARS ----------
  let ears = '';
  for (const s of [-1, 1]) {
    const e = [p2(s * 0.92, -0.04, 0.03), p2(s * 1.07, 0.02, -0.14), p2(s * 1.13, -0.2, -0.2), p2(s * 1.05, -0.47, -0.12), p2(s * 0.93, -0.57, 0.02), p2(s * 0.9, -0.3, 0.08)];
    const m = s * (e[2][0] - e[5][0]) / r, k = ss(0.02, 0.14, m);
    if (k <= 0) continue;
    ears += `<g opacity="${f(k)}">${form(smooth(e, true, 3), { fill: s > 0 ? C.skinShade : C.skin, sw: sw * 0.85, in: [line([p2(s * 1.03, -0.08, -0.1), p2(s * 1.05, -0.26, -0.12), p2(s * 0.98, -0.4, -0.05)], fw * 0.6, SKIN_LINE)] })}</g>`;
  }

  // ---------- ASSEMBLE ----------
  // his left arm (s = +1) is under the cloak drape, so only the blade arm is drawn
  let body = (yaw >= 0 ? '' : '') + (bust ? '' : leg(yaw >= 0 ? 1 : -1) + leg(yaw >= 0 ? -1 : 1)) + torso + (bust ? '' : tassets) + drape + arm(-1, blade);
  let out = (bust ? '' : cloak) + body + pelt + backHair + neck + head + hairCap + ears + sideLocks;
  if (bust) { const c = nid(); out = `<clipPath id="${c}"><rect x="${f(x - h)}" y="${f(y - 1.4 * h)}" width="${f(2 * h)}" height="${f(0.93 * h)}"/></clipPath><g clip-path="url(#${c})">${out}</g>`; }
  return `<g class="darrow">${out}</g>`;
}
module.exports = { darrow };
