// CASSIUS AU BELLONA: graphic-novel cel model (see ref/cassius-ref.png for design, ref/style-ref-*.jpg for rendering).
// cassius(x, y, h, opts) -> SVG string. (x, y) = point between the feet, h = full standing height (feet to top of hair).
// opts: yaw -60..60 (deg, + = turned to viewer's right), pitch -20..20 (+ = chin up),
//       expr 'neutral'|'smirk'|'shock'|'angry'|'pain', exprTo + mix (0..1) to blend two expressions,
//       blink (bool or 0..1), look (-1..1 iris shift), bodyYaw (deg, default yaw*0.45),
//       pose 'stand'|'seated' (seated: upper body cut at the table edge y, forearms resting on it), crop 'full'|'bust'
//       (bust skips legs/forearms for close-ups; same anchor). A habitual +4 deg chin-up is added to pitch.
// The head is a stack of 3D cross-sections; the silhouette, every feature and every hair curl is re-projected for the
// requested yaw/pitch, so the camera can swing round the face with no popping.
'use strict';
const S = require('../style.js');
const C = S.cassius, INK = S.INK, RIM = S.rim;
const D = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const sst = (a, b, v) => { const t = cl((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const f = v => String(Math.round(v * 10) / 10);
const pt = p => f(p[0]) + ' ' + f(p[1]);
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const mix = (a, b, t) => { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], t)).toString(16).padStart(2, '0')).join(''); };
let UID = 0;

// ---------- palette ----------
const SKIN = C.skin, SKIN_SH = C.skinShade, SKIN_MID = mix(C.skin, C.skinShade, 0.5), SKIN_HI = mix(C.skin, '#ffe9c8', 0.55);
const HAIR = C.hair, HAIR_HI = C.hairHi, HAIR_SH = C.hairShade, HAIR_LINE = mix(C.hairShade, INK, 0.45);
const GOLD = C.armor, GOLD_HI = C.armorHi, GOLD_SH = C.armorShade, GOLD_DK = mix(C.armorShade, INK, 0.45);
const BLUE = C.cloth, BLUE_SH = C.clothShade, BLUE_HI = mix(C.cloth, '#9fc0ff', 0.35);
const SILVER = S.silver, SILVER_SH = S.silverShade;
const LIP_LO = mix(SKIN, '#b44a40', 0.42), LIP_UP = mix(SKIN_SH, '#7c2f2c', 0.42);
const BROW = '#4a2f10', EYE_W = '#f6ecd9', EYE_WSH = '#c2ae93';

// ---------- head geometry: horizontal cross-sections [y, halfWidth, zFront, zBack, squareness] ----------
const SL = [
  [1.04, 0.05, 0.02, -0.22, 1.0],
  [0.97, 0.36, 0.40, -0.56, 1.0],
  [0.82, 0.58, 0.64, -0.82, 1.0],
  [0.62, 0.72, 0.80, -0.96, 0.95],
  [0.40, 0.79, 0.88, -1.03, 0.9],
  [0.19, 0.81, 0.93, -1.05, 0.82],  // brow ridge
  [0.02, 0.79, 0.80, -1.04, 0.95],  // eye line (sockets recessed)
  [-0.22, 0.775, 0.87, -1.00, 0.84], // cheekbones
  [-0.45, 0.73, 0.89, -0.92, 0.84],
  [-0.64, 0.685, 0.91, -0.78, 0.82],
  [-0.82, 0.64, 0.91, -0.52, 0.8],  // jaw corner
  [-0.97, 0.56, 0.88, -0.22, 0.8],
  [-1.11, 0.42, 0.87, 0.08, 0.8],
  [-1.225, 0.275, 0.84, 0.32, 0.8], // chin
  [-1.29, 0.13, 0.76, 0.5, 0.9],
];
function slice(y) {
  if (y >= SL[0][0]) return SL[0];
  for (let i = 0; i < SL.length - 1; i++) if (y >= SL[i + 1][0]) { const a = SL[i], b = SL[i + 1], t = (a[0] - y) / (a[0] - b[0]); return a.map((v, k) => lerp(v, b[k], t)); }
  return SL[SL.length - 1];
}
function zFace(x, y) {
  const s = slice(y), zc = (s[2] + s[3]) / 2, d = (s[2] - s[3]) / 2, e = s[4];
  const st = Math.pow(cl(Math.abs(x) / s[1], 0, 1), 1 / e), ct = Math.sqrt(Math.max(0, 1 - st * st));
  return zc + d * Math.pow(ct, e);
}

// ---------- hair: curls on an ellipsoid round the skull ----------
function rngf(seed) { let v = seed; return () => (v = (v * 9301 + 49297) % 233280) / 233280; }
const CURLS = (() => {
  const R = rngf(11), out = [];
  const minLat = a => a < 44 ? 50 : a < 74 ? lerp(50, 2, (a - 44) / 30) : a < 112 ? -42 : -58;
  const rings = [82, 69, 56, 43, 30, 17, 4, -9, -22, -35, -48];
  rings.forEach((lat, ri) => {
    const n = Math.max(4, Math.round(16 * Math.cos(lat * D)));
    for (let i = 0; i < n; i++) {
      let lon = -180 + 360 * (i + (ri % 2) * 0.5) / n;
      if (lat < minLat(Math.abs(lon)) - 1) { R(); R(); R(); R(); continue; }
      lon += (R() - 0.5) * 9; const la = lat + (R() - 0.5) * 7;
      const hor = la < 0 ? Math.cos(la * 0.6 * D) : Math.cos(la * D);
      const top = sst(20, 80, la);
      out.push({ lon, lat: la, x: 1.13 * hor * Math.sin(lon * D), y: 0.12 + 1.2 * Math.sin(la * D) + top * 0.05, z: -0.1 + 1.22 * hor * Math.cos(lon * D),
        s: (0.255 + R() * 0.12 + top * 0.04) * (la < -15 ? 0.85 : 1), a: R() * 360, k: out.length });
    }
  });
  for (const [fx, fy, fs] of [[-0.42, 0.74, 0.17], [-0.2, 0.8, 0.15], [0.04, 0.72, 0.18], [0.28, 0.79, 0.16], [0.5, 0.7, 0.15], [-0.6, 0.6, 0.14], [0.66, 0.55, 0.13]])
    out.push({ lon: 0, lat: 40, x: fx, y: fy, z: zFace(fx, fy) + 0.06, s: fs, a: R() * 360, k: out.length });
  return out;
})();
// loose forehead locks: [x at hairline, length, curl direction, thickness]
const LOCKS = [];

// ---------- expressions (index 0 = viewer's-left half of the face at yaw 0) ----------
const EX = {
  neutral: { bi: [0, 0], bm: [0, 0], bo: [0, 0], sq: 0, open: [0.8, 0.8], low: [1, 1], mw: 0.27, mc: [0.0, 0.0], mx: 0, mo: 0, mu: 0, tu: 0, tl: 0, fur: 0, nl: 0, jaw: 0, nf: 0 },
  smirk:   { bi: [0.0, 0.035], bm: [-0.01, 0.075], bo: [-0.01, 0.05], sq: 0, open: [0.7, 0.8], low: [0.85, 0.8], mw: 0.285, mc: [-0.02, 0.062], mx: 0.022, mo: 0, mu: 0.004, tu: 0, tl: 0, fur: 0, nl: 0.45, jaw: 0, nf: 0 },
  shock:   { bi: [0.085, 0.085], bm: [0.1, 0.1], bo: [0.07, 0.07], sq: -0.01, open: [1.32, 1.32], low: [1.15, 1.15], mw: 0.2, mc: [-0.03, -0.03], mx: 0, mo: 0.17, mu: 0.015, tu: 0.3, tl: 0, fur: 0, nl: 0, jaw: 0.07, nf: 0.2 },
  angry:   { bi: [-0.095, -0.095], bm: [-0.01, -0.01], bo: [0.045, 0.045], sq: 0.035, open: [0.7, 0.7], low: [0.72, 0.72], mw: 0.295, mc: [-0.012, -0.012], mx: 0, mo: 0.1, mu: 0.06, tu: 0.52, tl: 0.48, fur: 1, nl: 0.6, jaw: 0.015, nf: 1 },
  pain:    { bi: [0.05, 0.05], bm: [-0.03, -0.03], bo: [-0.075, -0.075], sq: 0.035, open: [0.1, 0.16], low: [0.45, 0.5], mw: 0.31, mc: [-0.03, 0.02], mx: 0.01, mo: 0.11, mu: 0.05, tu: 0.52, tl: 0.48, fur: 1, nl: 1, jaw: 0.03, nf: 0.6 },
};
function blendExpr(a, b, t) {
  const A = EX[a] || EX.neutral; if (!b || !t) return A; const B = EX[b] || EX.neutral, o = {};
  for (const k in A) o[k] = Array.isArray(A[k]) ? A[k].map((v, i) => lerp(v, B[k][i], t)) : lerp(A[k], B[k], t);
  return o;
}

// ---------- path helpers ----------
function spline(p, k = 1) { // closed Catmull-Rom
  const n = p.length; let d = 'M' + pt(p[0]);
  for (let i = 0; i < n; i++) {
    const p0 = p[(i + n - 1) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n];
    d += 'C' + f(p1[0] + (p2[0] - p0[0]) * k / 6) + ' ' + f(p1[1] + (p2[1] - p0[1]) * k / 6) + ' ' + f(p2[0] - (p3[0] - p1[0]) * k / 6) + ' ' + f(p2[1] - (p3[1] - p1[1]) * k / 6) + ' ' + pt(p2);
  }
  return d + 'Z';
}
function poly(p, r = 0) { // closed polygon with rounded corners
  const n = p.length; if (!r) return 'M' + p.map(pt).join('L') + 'Z';
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = p[(i + n - 1) % n], b = p[i], c = p[(i + 1) % n];
    const la = Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, lc = Math.hypot(c[0] - b[0], c[1] - b[1]) || 1;
    const ra = Math.min(r, la * 0.45), rc = Math.min(r, lc * 0.45);
    const s = [b[0] + (a[0] - b[0]) * ra / la, b[1] + (a[1] - b[1]) * ra / la], e = [b[0] + (c[0] - b[0]) * rc / lc, b[1] + (c[1] - b[1]) * rc / lc];
    d += (i ? 'L' : 'M') + pt(s) + 'Q' + pt(b) + ' ' + pt(e);
  }
  return d + 'Z';
}
function hull(pts) {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], up = [];
  for (const q of p) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (let i = p.length - 1; i >= 0; i--) { const q = p[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const area = p => { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[(i + 1) % p.length]; a += p[i][0] * q[1] - q[0] * p[i][1]; } return a / 2; };
// crescent = the part of circle (cx,cy,R) that lies outside the same circle shifted by (dx,dy)
function crescent(cx, cy, R, dx, dy) {
  const dl = Math.hypot(dx, dy); if (dl < 1e-6 || dl >= 2 * R) return '';
  const hh = Math.sqrt(R * R - dl * dl / 4), mx = cx + dx / 2, my = cy + dy / 2, px = -dy / dl, py = dx / dl;
  const p1 = [mx + px * hh, my + py * hh], p2 = [mx - px * hh, my - py * hh];
  const nm = a => ((a % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI), phi = Math.atan2(-dy, -dx);
  const a1 = Math.atan2(p1[1] - cy, p1[0] - cx), a2 = Math.atan2(p2[1] - cy, p2[0] - cx);
  const sw1 = nm(phi - a1) < nm(a2 - a1) ? 1 : 0;
  const b2 = Math.atan2(p2[1] - cy - dy, p2[0] - cx - dx), b1 = Math.atan2(p1[1] - cy - dy, p1[0] - cx - dx);
  const sw2 = nm(phi - b2) < nm(b1 - b2) ? 1 : 0;
  return `M${pt(p1)}A${f(R)} ${f(R)} 0 1 ${sw1} ${pt(p2)}A${f(R)} ${f(R)} 0 0 ${sw2} ${pt(p1)}Z`;
}
// one cel-shaded form: fill, hard shadow (the shape minus itself shifted toward the key), cool rim on right edges, ink line.
function form(d, fill, sh, u, o = {}) {
  const id = 'cas' + (++UID), dx = (o.dx === undefined ? 0.16 : o.dx) * u, dy = (o.dy === undefined ? 0.07 : o.dy) * u, sw = (o.sw || 0.06) * u;
  const rim = o.rim === false ? '' : `<use href="#${id}p" fill="${RIM}"/>`;
  return `<defs><path id="${id}p" d="${d}"/></defs><use href="#${id}p" fill="${fill}"/><clipPath id="${id}"><use href="#${id}p"/></clipPath><g clip-path="url(#${id})">${rim}<use href="#${id}p" fill="${sh}" transform="translate(${f(-(o.rw || 0.035) * u)} 0)"/><use href="#${id}p" fill="${fill}" transform="translate(${f(-dx)} ${f(-dy)})"/>${o.inner || ''}</g>`
    + (o.noStroke ? '' : `<use href="#${id}p" fill="none" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`);
}

// ================= HEAD =================
function buildHead(X, Y, u, yawDeg, pitchDeg, E, o) {
  const ya = yawDeg * D, pa = pitchDeg * D, cy = Math.cos(ya), sy = Math.sin(ya), cp = Math.cos(pa), sp = Math.sin(pa);
  const PZ = -0.12, PY = -0.8;
  const P = (x, y, z) => { const yy = y - PY, zz = z - PZ, y1 = yy * cp + zz * sp, z1 = zz * cp - yy * sp; return [X + u * (x * cy + z1 * sy), Y - u * (y1 + PY), z1 * cy - x * sy]; };
  const F = (x, y, dz = 0) => P(x, y, zFace(x, y) + dz);
  const OUT = 0.07 * u, MID = 0.045 * u, FINE = 0.027 * u;
  const st = (w, c = INK) => `fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"`;
  const id = 'cas' + (++UID);

  // --- silhouette: extreme points of every cross-section ---
  const Ls = [], Rs = [];
  for (const s of SL) {
    const jy = s[0] <= -0.8 ? -E.jaw * sst(-0.7, -1.2, s[0]) : 0; // jaw drops when the mouth opens
    const zc = (s[2] + s[3]) / 2, dd = (s[2] - s[3]) / 2, e = s[4]; let mn = null, mxp = null;
    for (let i = 0; i < 56; i++) {
      const t = i / 56 * 2 * Math.PI, sn = Math.sin(t), cs = Math.cos(t);
      const q = P(s[1] * Math.sign(sn) * Math.pow(Math.abs(sn), e), s[0] + jy, zc + dd * Math.sign(cs) * Math.pow(Math.abs(cs), e));
      if (!mn || q[0] < mn[0]) mn = q; if (!mxp || q[0] > mxp[0]) mxp = q;
    }
    Ls.push(mn); Rs.push(mxp);
  }
  const hullD = spline(Ls.concat(Rs.reverse()), 0.85);

  // --- nose ---
  const nz = (x, y, dz) => F(x, y, dz);
  const R0 = nz(0, 0.06, 0.035), nT = nz(0, -0.365, 0.3), T2 = nz(0, -0.425, 0.255), NB = nz(0, -0.47, 0.05), T0 = nz(0, -0.3, 0.275);
  const Wg = [-1, 1].map(s => nz(s * 0.148, -0.415, 0.03)), Wt = [-1, 1].map(s => nz(s * 0.125, -0.31, 0.035)), Sr = [-1, 1].map(s => nz(s * 0.08, 0.02, 0.0));
  const Wl = [-1, 1].map(s => nz(s * 0.1, -0.455, 0.07));
  const noseD = poly(hull([R0, nT, T2, T0, NB, ...Wg, ...Wt, ...Sr, ...Wl]), 0.035 * u);

  // --- shading inside the head: fixed light, so the shadow crescent stays put on screen while the face turns through it ---
  const shx = -0.4 * u, shy = -0.12 * u, rw = 0.04 * u;
  const cover = `<use href="#${id}h" fill="${SKIN}" transform="translate(${f(shx)} ${f(shy)})"/><use href="#${id}n" fill="${SKIN}" transform="translate(${f(shx)} ${f(shy)})"/>`;
  const shadeIn = `<rect x="${f(X - 3 * u)}" y="${f(Y - 3 * u)}" width="${f(6 * u)}" height="${f(6 * u)}" fill="${RIM}"/><g transform="translate(${f(-rw)} 0)"><use href="#${id}h" fill="${SKIN_SH}"/><use href="#${id}n" fill="${SKIN_SH}"/></g>${cover}`;

  // --- features ---
  let feat = '';
  // cheek plane shadow under the cheekbone on the side away from the key
  { const a = F(0.74, -0.12), b = F(0.5, -0.36), c = F(0.56, -0.78), d = F(0.7, -0.84), e2 = F(0.79, -0.4);
    if (area([a, b, c, d, e2]) < 0) feat += `<path d="${poly([a, b, c, d, e2], 0.03 * u)}" fill="${SKIN_SH}"/>`; }
  // under-nose cast shadow
  feat += `<path d="${poly([Wg[0], NB, Wg[1], [Wg[1][0] + 0.03 * u, Wg[1][1] + 0.06 * u], [NB[0] + 0.05 * u, NB[1] + 0.085 * u], [Wg[0][0] + 0.045 * u, Wg[0][1] + 0.03 * u]], 0.02 * u)}" fill="${SKIN_SH}"/>`;
  const blink = o.blink === true ? 1 : (+o.blink || 0), look = cl(+o.look || 0, -1, 1);
  [-1, 1].forEach((s, si) => {
    const open = E.open[si] * (1 - blink), low = lerp(E.low[si], 0.55, blink);
    const lowY = -0.092 * low - 0.01 * blink, upY = lowY + 0.245 * open, bi = E.bi[si], bm = E.bm[si], bo = E.bo[si], sq = E.sq;
    const I = F(s * 0.165, lowY * 0.25 - 0.016), O = F(s * 0.6, 0.03 - 0.035 * blink);
    const U1 = F(s * 0.25, upY + bi * 0.3), U2 = F(s * 0.49, upY + 0.016), L1 = F(s * 0.5, lowY), L2 = F(s * 0.28, lowY - 0.006);
    // socket shadow between brow and lid
    const so = [F(s * 0.12, 0.13 + bi), F(s * 0.3, 0.21 + bm * 0.6), F(s * 0.66, 0.16 + bo), F(s * 0.64, 0.03), F(s * 0.4, upY * 0.8 + 0.02), F(s * 0.14, -0.01)];
    feat += `<path d="${poly(so, 0.03 * u)}" fill="${SKIN_MID}"/>`;
    const eyeD = `M${pt(I)}C${pt(U1)} ${pt(U2)} ${pt(O)}C${pt(L1)} ${pt(L2)} ${pt(I)}Z`;
    const ir = 0.116, ix = s * 0.378 + look * 0.05, iy = 0.004, ring = (r) => { const q = []; for (let i = 0; i < 14; i++) { const a = i / 14 * 2 * Math.PI; q.push(F(ix + r * Math.cos(a), iy + r * Math.sin(a))); } return spline(q, 1); };
    const ic = F(ix, iy);
    feat += `<clipPath id="${id}e${si}"><path d="${eyeD}"/></clipPath><path d="${eyeD}" fill="${EYE_W}"/><g clip-path="url(#${id}e${si})">`
      + `<path d="${ring(ir)}" fill="${C.eye}" stroke="${mix(C.eye, INK, 0.7)}" stroke-width="${f(0.022 * u)}"/><path d="${ring(ir * 0.56)}" fill="${mix(C.eye, '#fff2b0', 0.55)}"/><path d="${ring(ir * 0.4)}" fill="${INK}"/>`
      + `<path d="M${pt(I)}C${pt(U1)} ${pt(U2)} ${pt(O)}" ${st(0.085 * u, EYE_WSH)} opacity=".9"/>`
      + `<circle cx="${f(ic[0] - 0.03 * u)}" cy="${f(ic[1] - 0.03 * u)}" r="${f(0.022 * u)}" fill="#fff"/></g>`;
    // lash line (heavy), crease, lower lid
    const tl = Math.hypot(O[0] - U2[0], O[1] - U2[1]) || 1, fl = [O[0] + (O[0] - U2[0]) / tl * 0.045 * u, O[1] + (O[1] - U2[1]) / tl * 0.02 * u];
    feat += `<path d="M${pt(I)}C${pt(U1)} ${pt(U2)} ${pt(O)}L${pt(fl)}" ${st(0.06 * u)}/>`;
    const c1 = F(s * 0.2, upY + 0.02 + bi * 0.3), c2 = F(s * 0.4, upY + 0.075 * (0.4 + 0.6 * cl(open)) + 0.01), c3 = F(s * 0.635, 0.09 - 0.03 * blink);
    feat += `<path d="M${pt(c1)}Q${pt(c2)} ${pt(c3)}" ${st(FINE)}/>`;
    const l1 = F(s * 0.37, lowY * 0.8);
    feat += `<path d="M${pt(O)}Q${pt(L1)} ${pt(l1)}" ${st(FINE * 0.9)}/>`;
    // brow
    const a = F(s * (0.125 - sq), 0.165 + bi, 0.012), b = F(s * (0.105 - sq), 0.262 + bi, 0.012), q1 = F(s * 0.27, 0.305 + lerp(bi, bm, 0.6), 0.012), c = F(s * 0.47, 0.31 + bm, 0.012),
      d = F(s * 0.72, 0.185 + bo, 0.012), q2 = F(s * 0.5, 0.24 + bm * 0.9, 0.012), q3 = F(s * 0.28, 0.222 + lerp(bi, bm, 0.55), 0.012);
    feat += `<path d="M${pt(a)}L${pt(b)}Q${pt(q1)} ${pt(c)}L${pt(d)}Q${pt(q2)} ${pt(q3)}Z" fill="${BROW}" stroke="${INK}" stroke-width="${f(FINE * 0.8)}" stroke-linejoin="round"/>`;
    // anger lines
    if (E.fur > 0.02) { const g1 = F(s * 0.05, 0.215 + bi * 0.6), g2 = F(s * 0.066, 0.1 + bi * 0.5); feat += `<path d="M${pt(g1)}L${pt(g2)}" ${st(FINE * 1.1 * E.fur)}/>`; }
    if (E.nl > 0.02) { const g1 = F(s * 0.215, -0.39), g2 = F(s * 0.32, -0.48), g3 = F(s * 0.345, -0.61); feat += `<path d="M${pt(g1)}Q${pt(g2)} ${pt(g3)}" ${st(FINE * 1.15 * E.nl * (si === 0 && E.mc[1] > E.mc[0] + 0.03 ? 0.2 : 1))}/>`; }
  });
  // mouth
  { const w = E.mw, mx = E.mx, my = -0.728, c0 = E.mc[0], c1 = E.mc[1], up = E.mu, mo = E.mo, lz = 0.03, jy = -E.jaw;
    const M = (x, y) => F(x, y, lz * (1 - Math.pow(cl(Math.abs(x - mx) / (w + 0.02)), 2)));
    const cL = M(mx - w, my + c0), cR = M(mx + w, my + c1), tilt = x => lerp(c0, c1, (x - mx + w) / (2 * w)) * 0.55;
    const yT = my + 0.094 + up, yD = my + 0.066 + up, yU = my + up * 0.75 + 0.004, yL = yU - mo, yB = yL - 0.118 - mo * 0.12;
    const t1 = M(mx - 0.2, yT - 0.012 + tilt(mx - 0.2)), t2 = M(mx - 0.088, yT + tilt(mx - 0.088)), t3 = M(mx - 0.04, yD + 0.004), t4 = M(mx, yD), t5 = M(mx + 0.04, yD + 0.004), t6 = M(mx + 0.088, yT + tilt(mx + 0.088)), t7 = M(mx + 0.2, yT - 0.012 + tilt(mx + 0.2));
    const u1 = M(mx + 0.15, yU + 0.012 + tilt(mx + 0.15)), u2 = M(mx, yU - 0.008 + tilt(mx)), u3 = M(mx - 0.15, yU + 0.012 + tilt(mx - 0.15));
    const d1 = M(mx - 0.16, yL + tilt(mx - 0.16) * 0.5), d2 = M(mx, yL - 0.004), d3 = M(mx + 0.16, yL + tilt(mx + 0.16) * 0.5);
    const b1 = M(mx + 0.215, yB + 0.03 + tilt(mx + 0.2)), b2 = M(mx + 0.085, yB), b3 = M(mx - 0.085, yB), b4 = M(mx - 0.215, yB + 0.03 + tilt(mx - 0.2));
    const upper = `M${pt(cL)}Q${pt(t1)} ${pt(t2)}Q${pt(t3)} ${pt(t4)}Q${pt(t5)} ${pt(t6)}Q${pt(t7)} ${pt(cR)}Q${pt(u1)} ${pt(u2)}Q${pt(u3)} ${pt(cL)}Z`;
    const lower = `M${pt(cL)}Q${pt(d1)} ${pt(d2)}Q${pt(d3)} ${pt(cR)}Q${pt(b1)} ${pt(b2)}L${pt(b3)}Q${pt(b4)} ${pt(cL)}Z`;
    const inner = `M${pt(cL)}Q${pt(u3)} ${pt(u2)}Q${pt(u1)} ${pt(cR)}Q${pt(d3)} ${pt(d2)}Q${pt(d1)} ${pt(cL)}Z`;
    // shadow under the lower lip
    feat += `<path d="M${pt(M(mx - 0.15, yB + 0.004))}Q${pt(M(mx, yB - 0.085))} ${pt(M(mx + 0.15, yB + 0.004))}Q${pt(M(mx, yB - 0.022))} ${pt(M(mx - 0.15, yB + 0.004))}Z" fill="${SKIN_SH}"/>`;
    feat += `<path d="${upper}" fill="${LIP_UP}"/><path d="${lower}" fill="${LIP_LO}"/>`;
    feat += `<path d="M${pt(M(mx - 0.11, yL - 0.035))}Q${pt(M(mx - 0.02, yL - 0.05))} ${pt(M(mx + 0.05, yL - 0.036))}Q${pt(M(mx - 0.02, yL - 0.075))} ${pt(M(mx - 0.11, yL - 0.035))}Z" fill="${mix(LIP_LO, '#ffe2c8', 0.5)}"/>`;
    if (mo > 0.004) {
      feat += `<clipPath id="${id}m"><path d="${inner}"/></clipPath><path d="${inner}" fill="#3a1016"/><g clip-path="url(#${id}m)">`;
      const band = (ya2, yb2) => `<path d="M${pt(M(mx - w, ya2))}Q${pt(M(mx, ya2 - 0.01))} ${pt(M(mx + w, ya2))}L${pt(M(mx + w, yb2))}Q${pt(M(mx, yb2 - 0.012))} ${pt(M(mx - w, yb2))}Z" fill="#f7efe0"/>`;
      if (E.tu > 0.01) feat += band(yU + 0.03, yU - mo * E.tu);
      if (E.tl > 0.01) feat += band(yL + mo * E.tl - 0.006, yL - 0.03);
      if (E.tu > 0.01) for (const tx of [-0.2, -0.13, -0.065, 0, 0.065, 0.13, 0.2]) feat += `<path d="M${pt(M(mx + tx, yU + 0.02))}L${pt(M(mx + tx, yU - mo * E.tu + 0.004))}" ${st(FINE * 0.55, '#9a8f86')}/>`;
      feat += `</g>`;
    }
    feat += `<path d="${inner}" ${st(MID * 0.95)}/>`;
    // corner ticks + cupid's bow + under-lip accent
    feat += `<path d="M${pt(cL)}L${pt(M(mx - w - 0.03, my + c0 - 0.012 + c0 * 0.3))}" ${st(MID * 0.9)}/><path d="M${pt(cR)}L${pt(M(mx + w + 0.03, my + c1 - 0.012 + c1 * 0.3))}" ${st(MID * 0.9)}/>`;
    feat += `<path d="M${pt(t2)}Q${pt(t3)} ${pt(t4)}Q${pt(t5)} ${pt(t6)}" ${st(FINE * 0.8)}/><path d="M${pt(b3)}L${pt(b2)}" ${st(FINE)}/>`;
    // chin dimple
    feat += `<path d="M${pt(F(-0.05, -1.1 + jy))}Q${pt(F(0, -1.075 + jy))} ${pt(F(0.05, -1.1 + jy))}" ${st(FINE * 0.8)} opacity=".65"/>`;
  }

  // --- nose on top of the face ---
  const turn = (nT[0] - R0[0]) / u; // signed: how far the tip has swung off the bridge
  let nose = `<clipPath id="${id}nc"><use href="#${id}n"/></clipPath><use href="#${id}n" fill="${SKIN}"/><g clip-path="url(#${id}nc)">${shadeIn}`;
  { const side = [nz(0.03, 0.0, 0.06), nz(0.035, -0.3, 0.26), nz(0.035, -0.37, 0.28), nz(0.03, -0.43, 0.24), nz(0.03, -0.47, 0.05), Wl[1], Wg[1], Wt[1], Sr[1]];
    if (area(side) < 0) nose += `<path d="${poly(side, 0.02 * u)}" fill="${SKIN_SH}"/>`; }
  nose += `</g>`;
  const rk = sst(0.015, 0.12, Math.abs(turn));
  const Rm = nz(0, -0.02, 0.085), Tu = nz(0, -0.45, 0.17);
  if (rk > 0.03) nose += `<path d="M${pt(Rm)}L${pt(T0)}Q${pt([nT[0] + (nT[0] - Rm[0]) * 0.08, nT[1] + 0.01 * u])} ${pt(T2)}" ${st(MID * rk)}/>`;
  nose += `<path d="M${pt(Wl[0])}Q${pt(nz(-0.05, -0.475, 0.08))} ${pt(Tu)}Q${pt(nz(0.05, -0.475, 0.08))} ${pt(Wl[1])}" ${st(MID * 0.85)}/>`;
  [-1, 1].forEach((s, si) => {
    const vis = sst(0.015, 0.075, s * (Wg[si][0] - NB[0]) / u); if (vis < 0.02) return;
    const k = [Wg[si][0] + (Wg[si][0] - NB[0]) * 0.4, Wg[si][1] + 0.03 * u], e = [lerp(Wg[si][0], Wt[si][0], 0.55), lerp(Wg[si][1], Wt[si][1], 0.55)];
    nose += `<path d="M${pt(Wl[si])}Q${pt(k)} ${pt(e)}" ${st(MID * 0.8 * vis)}/>`;
    if (E.nf > 0.02) { const g = nz(s * 0.185, -0.33, 0.01); nose += `<path d="M${pt(Wt[si])}L${pt(g)}" ${st(FINE * E.nf * vis)}/>`; }
  });

  const main = `<defs><path id="${id}h" d="${hullD}"/><path id="${id}n" d="${noseD}"/></defs><use href="#${id}h" fill="${INK}" stroke="${INK}" stroke-width="${f(OUT * 2)}" stroke-linejoin="round"/><use href="#${id}n" fill="${INK}" stroke="${INK}" stroke-width="${f(OUT * 1.7)}" stroke-linejoin="round"/>`
    + `<use href="#${id}h" fill="${SKIN}" stroke="none"/><clipPath id="${id}hc"><path d="${hullD}"/></clipPath><g clip-path="url(#${id}hc)">${shadeIn}${feat}</g>${nose}`;

  // --- hair ---
  const pr = CURLS.map(c => { const p = P(c.x, c.y, c.z); return { c, x: p[0], y: p[1], zn: p[2] / 1.15, r: c.s * u }; });
  const circ = (q, r, sw) => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(r)}"${sw === undefined ? '' : ` stroke-width="${f(sw)}"`}/>`;
  const detail = (q, r, a) => { // per-curl cel detail: shade crescent low-right, highlight crescent up-left, spiral line
    if (r < 0.06 * u) return ['', '', '', ''];
    const sh = crescent(q.x, q.y, r * 0.97, -r * 0.34, -r * 0.3), hi = crescent(q.x - r * 0.05, q.y - r * 0.05, r * 0.7, r * 0.2, r * 0.17);
    const a0 = (q.c.a) * D, r1 = r * 0.5, r2 = r * 0.22, a1 = a0 + 200 * D;
    const s0 = [q.x + r1 * Math.cos(a0), q.y + r1 * Math.sin(a0)], s1 = [q.x + r1 * Math.cos(a1), q.y + r1 * Math.sin(a1)];
    const c2 = [s1[0] - r2 * Math.cos(a1), s1[1] - r2 * Math.sin(a1)], a2 = a1 + 170 * D, s2 = [c2[0] + r2 * Math.cos(a2), c2[1] + r2 * Math.sin(a2)];
    const ln = q.c.k % 3 === 0 ? '' : `M${pt(s0)}A${f(r1)} ${f(r1)} 0 1 1 ${pt(s1)}A${f(r2)} ${f(r2)} 0 0 1 ${pt(s2)}`;
    const b0 = a0 + 2.2, rb = r * 0.8, e0 = [q.x + rb * Math.cos(b0), q.y + rb * Math.sin(b0)], e1 = [q.x + rb * Math.cos(b0 + 2.1), q.y + rb * Math.sin(b0 + 2.1)];
    const ink = q.c.k % 4 === 1 ? `M${pt(e0)}A${f(rb)} ${f(rb)} 0 0 1 ${pt(e1)}` : '';
    return [sh, hi, ln, ink];
  };
  const cs = pr.map(q => circ(q, q.r)).join('');
  let dsh = '', dhi = '', dln = '', dik = '';
  for (const q of pr) { const d3 = detail(q, q.r); dsh += d3[0]; dhi += d3[1]; dln += d3[2]; dik += d3[3]; }
  const paint = `<g id="${id}hp"><rect x="${f(X - 3 * u)}" y="${f(Y - 3 * u)}" width="${f(6 * u)}" height="${f(6 * u)}" fill="${RIM}"/>`
    + `<g fill="${HAIR_SH}" transform="translate(${f(-0.035 * u)} 0)">${cs}</g><g fill="${HAIR}" transform="translate(${f(-0.2 * u)} ${f(-0.12 * u)})">${cs}</g>`
    + `<path d="${dsh}" fill="${HAIR_SH}"/><path d="${dhi}" fill="${HAIR_HI}"/><path d="${dln}" ${st(FINE * 1.15, HAIR_SH)}/><path d="${dik}" ${st(FINE * 0.9, HAIR_LINE)}/></g>`;
  const back = `<g fill="${INK}" stroke="${INK}" stroke-width="${f(OUT * 1.8)}">${cs}</g><clipPath id="${id}hb">${cs}</clipPath><g clip-path="url(#${id}hb)">${paint}</g>`;
  const fl = pr.map(q => ({ q, rr: q.r * sst(-0.3, 0.0, q.zn) })).filter(e => e.rr > 0.02 * u);
  const chinY = P(0, -1.29, 0.6)[1];
  // front-curl ink only where hair crosses the face / costume (never over the hair mass behind, so nothing rings or pops)
  let front = `<clipPath id="${id}ho"><use href="#${id}h"/><rect x="${f(X - 3 * u)}" y="${f(chinY - 0.25 * u)}" width="${f(6 * u)}" height="${f(3 * u)}"/></clipPath>`
    + `<g clip-path="url(#${id}ho)" fill="${INK}" stroke="${INK}">${fl.map(e => circ(e.q, e.rr, OUT * 1.8 * Math.pow(e.rr / e.q.r, 2))).join('')}</g>`
    + `<g clip-path="url(#${id}hc)" fill="${HAIR_SH}">${fl.map(e => circ(e.q, e.rr * 1.14)).join('')}</g>`
    + `<clipPath id="${id}hf">${fl.map(e => circ(e.q, e.rr)).join('')}</clipPath><g clip-path="url(#${id}hf)"><use href="#${id}hp"/></g>`;
  // loose locks on the forehead
  for (const [lx, len, dir, th] of LOCKS) {
    const y0 = 0.74, a = F(lx, y0, 0.03), b = F(lx + dir * 0.03, y0 - len * 0.55, 0.035), c = F(lx - dir * 0.02, y0 - len, 0.04);
    const rr = 0.058, cc = F(lx - dir * 0.02 + dir * rr, y0 - len, 0.04), e2 = F(lx - dir * 0.02 + dir * rr * 1.9, y0 - len + 0.03, 0.04), e3 = F(lx - dir * 0.02 + dir * rr, y0 - len - rr * 0.95, 0.04), e4 = F(lx + dir * (rr * 0.9), y0 - len + rr * 0.75, 0.04);
    const vis = sst(-0.1, 0.25, a[2] - 0.5); if (vis < 0.05) continue;
    const d = `M${pt(a)}Q${pt(b)} ${pt(c)}Q${pt([2 * c[0] - (c[0] + e3[0]) / 2 - (e3[0] - c[0]) * 0.1, e3[1]])} ${pt(e3)}Q${pt([e2[0], e3[1]])} ${pt(e2)}Q${pt([e2[0], e4[1]])} ${pt(e4)}`;
    front += `<path d="${d}" ${st((th + 0.05) * u * vis)}/><path d="${d}" ${st(th * u * vis, HAIR)}/><path d="M${pt(a)}Q${pt(b)} ${pt(c)}" ${st(th * 0.3 * u * vis, HAIR_HI)}/>`;
  }
  const chin = P(0, -1.29 - E.jaw, 0.6), neckTop = P(0, -0.95, -0.15);
  return { back, main, front, hullD, chin, neckTop, id };
}

// ================= BODY =================
function eagle(cx, cy, s, kx) { // Bellona eagle, wings spread; kx = horizontal squash from body turn
  const p = [[0, -0.4], [0.07, -0.33], [0.05, -0.24], [0.2, -0.3], [0.58, -0.52], [0.47, -0.31], [0.56, -0.25], [0.42, -0.14], [0.5, -0.05], [0.3, 0.0], [0.13, 0.02], [0.1, 0.14], [0.2, 0.4], [0.06, 0.3], [0, 0.42]];
  const all = p.concat(p.slice(1, -1).reverse().map(q => [-q[0], q[1]]));
  const d = 'M' + all.map(q => f(cx + q[0] * s * kx) + ' ' + f(cy + q[1] * s)).join('L') + 'Z';
  const beak = `M${f(cx - 0.05 * s * kx)} ${f(cy - 0.35 * s)}L${f(cx - 0.17 * s * kx)} ${f(cy - 0.3 * s)}L${f(cx - 0.04 * s * kx)} ${f(cy - 0.27 * s)}Z`;
  return `<path d="${d}" fill="${SILVER}" stroke="${INK}" stroke-width="${f(s * 0.04)}" stroke-linejoin="round"/><path d="${beak}" fill="${SILVER}" stroke="${INK}" stroke-width="${f(s * 0.035)}" stroke-linejoin="round"/>`
    + `<path d="M${f(cx + 0.04 * s * kx)} ${f(cy - 0.2 * s)}L${f(cx + 0.09 * s * kx)} ${f(cy + 0.05 * s)}L${f(cx)} ${f(cy + 0.36 * s)}L${f(cx + 0.17 * s * kx)} ${f(cy + 0.36 * s)}L${f(cx + 0.11 * s * kx)} ${f(cy + 0.1 * s)}L${f(cx + 0.44 * s * kx)} ${f(cy - 0.1 * s)}L${f(cx + 0.36 * s * kx)} ${f(cy - 0.16 * s)}L${f(cx + 0.5 * s * kx)} ${f(cy - 0.27 * s)}L${f(cx + 0.2 * s * kx)} ${f(cy - 0.24 * s)}Z" fill="${SILVER_SH}" opacity=".8"/>`;
}

function cassius(x, y, h, opts = {}) {
  const o = opts || {};
  const yaw = cl(+o.yaw || 0, -60, 60), pitch = cl(+o.pitch || 0, -20, 20) + 4; // +4: his habitual chin-up
  const E = blendExpr(o.expr || 'neutral', o.exprTo, cl(+o.mix || 0));
  const seated = o.pose === 'seated', bust = o.crop === 'bust';
  const u = h / 12.3, HS = 0.88;
  const bYaw = cl(o.bodyYaw === undefined ? yaw * 0.45 : +o.bodyYaw, -40, 40) * D, cb = Math.cos(bYaw), sb = Math.sin(bYaw);
  const SEAT = 6.85;                       // body height (in u) that sits at the table edge when seated
  const Y0 = seated ? y + SEAT * u : y;
  const wf = Math.sqrt(cb * cb + 0.36 * sb * sb);
  const B = (bx, by, bz = 0) => [x + u * (bx * cb + bz * sb), Y0 - u * by];
  const TZ = bx => 0.93 * Math.sqrt(Math.max(0, 1 - (bx / 1.6) * (bx / 1.6)));  // torso surface depth
  const T = (bx, by) => B(bx, by, TZ(bx));                                      // point on the chest surface
  const W = (bx, by) => [x + u * bx * wf, Y0 - u * by];                         // point on the torso silhouette
  const OUT = 0.07, MID = 0.045 * u, FINE = 0.027 * u;
  const st = (w, c = INK) => `fill="none" stroke="${c}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"`;
  const sym = pts => pts.concat(pts.slice().reverse().map(p => [-p[0], p[1]]));

  // head placement: neck pivot rides the body, the head leans a touch into its turn
  const HY = 9.66 + 1.29 * HS, hx = x + u * (0.1 * Math.sin(yaw * D) + 0.25 * sb), hy = Y0 - u * HY;
  const H = buildHead(hx, hy, u * HS, yaw, pitch, E, o);

  let s = '';
  // ---- cape (behind everything) ----
  { const sway = -sb * 0.7, pts = [[-1.5, 8.9], [1.5, 8.9], [2.35 + sway * 0.3, 6.2], [2.3 + sway, 2.3], [1.45 + sway, 1.75], [0.7 + sway, 2.25], [-0.1 + sway, 1.7], [-0.9 + sway, 2.2], [-1.6 + sway, 1.7], [-2.3 + sway, 2.35], [-2.35 + sway * 0.3, 6.2]].map(p => [x + u * p[0] * (0.9 + 0.1 * cb), Y0 - u * p[1]]);
    const d = poly(pts, 0.12 * u);
    const trim = `<path d="${poly(pts.map((p, i) => i < 2 ? p : [x + (p[0] - x) * 0.93, p[1] - 0.16 * u]), 0.1 * u)}" ${st(0.05 * u, SILVER_SH)}/>`;
    s += form(d, BLUE_SH, mix(BLUE_SH, INK, 0.5), u, { dx: 0.3, dy: 0.0, inner: trim, sw: OUT }); }
  // ---- collar back (inside face of the high collar, behind the neck) ----
  { const tl = B(-1.13, 10.0, -0.3), tr = B(1.13, 10.0, -0.3), bl = B(-1.0, 8.8, -0.2), br = B(1.0, 8.8, -0.2), tm = B(0, 9.62, -0.45);
    s += `<path d="M${pt(tl)}Q${pt(tm)} ${pt(tr)}L${pt(br)}L${pt(bl)}Z" fill="${GOLD_DK}" stroke="${INK}" stroke-width="${f(OUT * u)}" stroke-linejoin="round"/>`; }
  s += H.back;

  const limb = (a, wa, b2, wb) => { const dx = b2[0] - a[0], dy = b2[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    return poly([[a[0] + nx * wa, a[1] + ny * wa], [b2[0] + nx * wb, b2[1] + ny * wb], [b2[0] - nx * wb, b2[1] - ny * wb], [a[0] - nx * wa, a[1] - ny * wa]], Math.min(wa, wb) * 0.7); };

  // ---- arms (standing: hang at the sides, behind the torso) ----
  const armX = 1.74 * cb;
  if (!seated) for (const sd of [-1, 1]) {
    const sh = [x + sd * armX * u, Y0 - 8.5 * u], el = [x + sd * (armX + 0.3) * u, Y0 - 6.75 * u], wr = [x + sd * (armX + 0.32) * u + sb * 0.25 * u, Y0 - 5.2 * u], hd = [wr[0] + sb * 0.05 * u, wr[1] + 0.42 * u];
    s += form(limb(sh, 0.47 * u, el, 0.4 * u), BLUE, BLUE_SH, u, { dx: 0.2 });
    if (!bust) {
      s += form(`M${f(hd[0] - 0.33 * u)} ${f(hd[1] - 0.3 * u)}h${f(0.66 * u)}l${f(-0.04 * u)} ${f(0.52 * u)}q${f(-0.29 * u)} ${f(0.2 * u)} ${f(-0.58 * u)} 0Z`, GOLD, GOLD_SH, u, { dx: 0.13 });
      s += `<path d="M${f(hd[0] - 0.1 * u)} ${f(hd[1] + 0.02 * u)}v${f(0.28 * u)}M${f(hd[0] + 0.08 * u)} ${f(hd[1] + 0.02 * u)}v${f(0.28 * u)}" ${st(FINE)}/>`;
      const vam = limb([el[0], el[1] + 0.2 * u], 0.44 * u, wr, 0.31 * u);
      s += form(vam, GOLD, GOLD_SH, u, { dx: 0.16, inner: `<path d="M${f(el[0] - 0.26 * u)} ${f(el[1] + 0.35 * u)}L${f(wr[0] - 0.2 * u)} ${f(wr[1] - 0.25 * u)}" ${st(0.09 * u, GOLD_HI)}/>` });
      s += `<path d="M${f(wr[0] - 0.33 * u)} ${f(wr[1] - 0.12 * u)}h${f(0.66 * u)}" ${st(0.09 * u, SILVER)}/><path d="M${f(wr[0] - 0.35 * u)} ${f(wr[1] - 0.18 * u)}h${f(0.7 * u)}M${f(wr[0] - 0.34 * u)} ${f(wr[1] - 0.06 * u)}h${f(0.68 * u)}" ${st(FINE)}/>`;
      s += form(`M${f(el[0] - 0.44 * u)} ${f(el[1] + 0.28 * u)}Q${f(el[0] - 0.5 * u)} ${f(el[1] - 0.25 * u)} ${f(el[0])} ${f(el[1] - 0.3 * u)}Q${f(el[0] + 0.5 * u)} ${f(el[1] - 0.25 * u)} ${f(el[0] + 0.44 * u)} ${f(el[1] + 0.28 * u)}Q${f(el[0])} ${f(el[1] + 0.42 * u)} ${f(el[0] - 0.44 * u)} ${f(el[1] + 0.28 * u)}Z`, GOLD, GOLD_SH, u, { dx: 0.14 });
    }
  }

  // ---- legs, boots ----
  if (!seated && !bust) {
    for (const sd of [-1, 1]) {
      const hip = [x + sd * 0.56 * cb * u, Y0 - 5.95 * u], kn = [x + sd * 0.7 * cb * u, Y0 - 3.05 * u], an = [x + sd * 0.8 * cb * u, Y0 - 0.62 * u];
      const toe = sd * 0.5 + sb * 0.75;
      // boot
      const bt = `M${f(an[0] - 0.33 * u)} ${f(an[1] - 0.1 * u)}L${f(an[0] + 0.33 * u)} ${f(an[1] - 0.1 * u)}L${f(an[0] + (toe > 0 ? 0.36 + toe * 0.9 : 0.36) * u)} ${f(Y0 - 0.12 * u)}L${f(an[0] + (toe > 0 ? 0.3 + toe * 0.9 : 0.36) * u)} ${f(Y0)}L${f(an[0] - (toe < 0 ? 0.3 - toe * 0.9 : 0.36) * u)} ${f(Y0)}L${f(an[0] - (toe < 0 ? 0.36 - toe * 0.9 : 0.36) * u)} ${f(Y0 - 0.12 * u)}Z`;
      s += form(bt, GOLD, GOLD_SH, u, { dx: 0.14, dy: 0.05, inner: `<rect x="${f(an[0] - 2 * u)}" y="${f(Y0 - 0.1 * u)}" width="${f(4 * u)}" height="${f(0.2 * u)}" fill="${GOLD_DK}"/>` });
      s += form(limb(hip, 0.58 * u, kn, 0.38 * u), BLUE, BLUE_SH, u, { dx: 0.2 });
      // greave
      const gr = poly([[kn[0] - 0.38 * u, kn[1] + 0.1 * u], [kn[0] + 0.38 * u, kn[1] + 0.1 * u], [kn[0] + 0.43 * u, kn[1] + 0.9 * u], [an[0] + 0.3 * u, an[1] + 0.05 * u], [an[0] - 0.3 * u, an[1] + 0.05 * u], [kn[0] - 0.43 * u, kn[1] + 0.9 * u]], 0.1 * u);
      s += form(gr, GOLD, GOLD_SH, u, { dx: 0.17, inner: `<path d="M${f(kn[0] - 0.24 * u)} ${f(kn[1] + 0.45 * u)}L${f(an[0] - 0.17 * u)} ${f(an[1] - 0.25 * u)}" ${st(0.1 * u, GOLD_HI)}/>` });
      s += `<path d="M${f(kn[0] + sb * 0.2 * u)} ${f(kn[1] + 0.5 * u)}L${f(an[0] + sb * 0.15 * u)} ${f(an[1] - 0.1 * u)}" ${st(FINE)}/><path d="M${f(an[0] - 0.33 * u)} ${f(an[1] - 0.02 * u)}h${f(0.66 * u)}" ${st(0.08 * u, SILVER)}/><path d="M${f(an[0] - 0.34 * u)} ${f(an[1] - 0.07 * u)}h${f(0.68 * u)}M${f(an[0] - 0.34 * u)} ${f(an[1] + 0.03 * u)}h${f(0.68 * u)}" ${st(FINE)}/>`;
      // knee cop
      const kc = `M${f(kn[0] - 0.44 * u)} ${f(kn[1] + 0.2 * u)}L${f(kn[0] - 0.38 * u)} ${f(kn[1] - 0.28 * u)}L${f(kn[0] + sb * 0.2 * u)} ${f(kn[1] - 0.66 * u)}L${f(kn[0] + 0.38 * u)} ${f(kn[1] - 0.28 * u)}L${f(kn[0] + 0.44 * u)} ${f(kn[1] + 0.2 * u)}L${f(kn[0] + sb * 0.2 * u)} ${f(kn[1] + 0.48 * u)}Z`;
      s += form(kc, GOLD, GOLD_SH, u, { dx: 0.15, inner: `<path d="M${f(kn[0] - 0.3 * u)} ${f(kn[1] - 0.2 * u)}L${f(kn[0] - 0.02 * u + sb * 0.2 * u)} ${f(kn[1] - 0.5 * u)}L${f(kn[0] - 0.22 * u)} ${f(kn[1] + 0.12 * u)}Z" fill="${GOLD_HI}"/>` });
    }
    // side tassets
    for (const sd of [-1, 1]) {
      const c0 = x + sd * 0.98 * wf * u + sb * 0.25 * u;
      const d = poly([[c0 - 0.5 * u, Y0 - 6.25 * u], [c0 + 0.5 * u, Y0 - 6.25 * u], [c0 + sd * 0.1 * u + 0.48 * u, Y0 - 5.2 * u], [c0 + sd * 0.12 * u, Y0 - 4.55 * u], [c0 + sd * 0.1 * u - 0.48 * u, Y0 - 5.2 * u]], 0.08 * u);
      s += form(d, GOLD, GOLD_SH, u, { dx: 0.16, inner: `<path d="M${f(c0 - 0.3 * u)} ${f(Y0 - 6.0 * u)}L${f(c0 - 0.26 * u + sd * 0.1 * u)} ${f(Y0 - 5.2 * u)}" ${st(0.1 * u, GOLD_HI)}/>` });
      s += `<path d="M${f(c0 - 0.46 * u)} ${f(Y0 - 5.75 * u)}Q${f(c0)} ${f(Y0 - 5.6 * u)} ${f(c0 + 0.46 * u)} ${f(Y0 - 5.75 * u)}" ${st(FINE)}/>`;
    }
    // tabard
    { const c0 = x + sb * 0.9 * u, d = poly([[c0 - 0.6 * u, Y0 - 6.25 * u], [c0 + 0.6 * u, Y0 - 6.25 * u], [c0 + 0.52 * u - sb * 0.2 * u, Y0 - 3.95 * u], [c0 - sb * 0.25 * u, Y0 - 3.35 * u], [c0 - 0.52 * u - sb * 0.2 * u, Y0 - 3.95 * u]], 0.05 * u);
      const tr = `<path d="M${f(c0 - 0.46 * u - sb * 0.2 * u)} ${f(Y0 - 4.08 * u)}L${f(c0 - sb * 0.25 * u)} ${f(Y0 - 3.55 * u)}L${f(c0 + 0.46 * u - sb * 0.2 * u)} ${f(Y0 - 4.08 * u)}" ${st(0.09 * u, SILVER)}/>`;
      s += form(d, BLUE, BLUE_SH, u, { dx: 0.22, inner: tr });
      s += `<path d="M${f(c0)} ${f(Y0 - 6.1 * u)}L${f(c0 - sb * 0.22 * u)} ${f(Y0 - 4.3 * u)}" ${st(FINE, BLUE_SH)}/>` + eagle(c0 - sb * 0.1 * u, Y0 - 5.15 * u, 0.85 * u, cb); }
  }

  // ---- torso ----
  const cx0 = T(0, 8)[0] - x; // screen offset of the sternum line
  { const d = poly(sym([[0.5, 9.1], [1.5, 8.9], [1.66, 8.45], [1.6, 7.95], [1.4, 7.4], [1.1, 6.75], [1.04, 6.45], [1.12, 6.1]]).map(p => W(p[0], p[1])), 0.14 * u);
    let inn = '';
    // pec shadow + abdominal lames
    const pl = [T(-1.38, 8.05), T(-0.75, 7.68), T(0, 7.78), T(0.75, 7.68), T(1.38, 8.05)];
    inn += `<path d="M${pt(pl[0])}Q${pt(pl[1])} ${pt(pl[2])}Q${pt(pl[3])} ${pt(pl[4])}L${pt(T(1.4, 7.8))}Q${pt(T(0.75, 7.5))} ${pt(T(0, 7.62))}Q${pt(T(-0.75, 7.5))} ${pt(T(-1.4, 7.8))}Z" fill="${GOLD_SH}"/>`;
    // speculars (upper-left planes)
    inn += `<path d="${poly([T(-1.32, 8.62), T(-0.62, 8.72), T(-0.5, 8.5), T(-0.95, 8.3), T(-1.4, 8.3)], 0.05 * u)}" fill="${GOLD_HI}"/>`;
    inn += `<path d="${poly([T(-1.12, 7.42), T(-0.72, 7.34), T(-0.74, 7.15), T(-1.02, 7.2)], 0.03 * u)}" fill="${GOLD_HI}"/><path d="${poly([T(-0.98, 7.02), T(-0.7, 6.96), T(-0.7, 6.82), T(-0.92, 6.86)], 0.03 * u)}" fill="${GOLD_HI}"/>`;
    inn += `<path d="${poly([T(0.25, 8.68), T(0.7, 8.72), T(0.62, 8.56)], 0.03 * u)}" fill="${GOLD_HI}"/>`;
    s += form(d, GOLD, GOLD_SH, u, { dx: 0.3, dy: 0.05, inner: inn, sw: OUT });
    s += `<path d="M${pt(pl[0])}Q${pt(pl[1])} ${pt(pl[2])}Q${pt(pl[3])} ${pt(pl[4])}" ${st(MID)}/>`;
    for (const ly of [7.3, 6.92]) s += `<path d="M${pt(W(-lerp(1.36, 1.1, (7.4 - ly) / 0.65), ly + 0.06))}Q${pt(T(0, ly - 0.14))} ${pt(W(lerp(1.36, 1.1, (7.4 - ly) / 0.65), ly + 0.06))}" ${st(FINE * 1.2)}/>`;
    s += `<path d="M${pt(T(0, 7.74))}L${pt(T(0, 6.5))}" ${st(FINE)}/>`;
    // Bellona shield + eagle on the chest
    const sh = [T(-0.72, 8.62), T(0.72, 8.62), T(0.66, 8.12), T(0, 7.72), T(-0.66, 8.12)];
    s += form(poly(sh, 0.06 * u), BLUE, BLUE_SH, u, { dx: 0.14, dy: 0.04, sw: 0.05, rim: false });
    s += `<path d="${poly(sh.map((p, i) => { const c = T(0, 8.22); return [c[0] + (p[0] - c[0]) * 0.84, c[1] + (p[1] - c[1]) * 0.84]; }), 0.04 * u)}" ${st(FINE, SILVER)}/>`;
    s += eagle(T(0, 8.2)[0], T(0, 8.2)[1] + 0.02 * u, 0.98 * u, cb);
    // belt
    const b1 = W(-1.07, 6.5), b2 = W(1.07, 6.5), b3 = W(1.14, 6.12), b4 = W(-1.14, 6.12), bm = T(0, 6.36);
    s += `<path d="M${pt(b1)}Q${pt(T(0, 6.38))} ${pt(b2)}L${pt(b3)}Q${pt(T(0, 6.0))} ${pt(b4)}Z" fill="${SILVER}" stroke="${INK}" stroke-width="${f(MID)}" stroke-linejoin="round"/>`
      + `<path d="M${pt([lerp(b1[0], b2[0], 0.72), b2[1] - 0.02 * u])}L${pt(b2)}L${pt(b3)}L${pt([lerp(b4[0], b3[0], 0.66), b3[1] - 0.06 * u])}Z" fill="${SILVER_SH}"/>`
      + `<circle cx="${f(bm[0])}" cy="${f(bm[1] + 0.14 * u)}" r="${f(0.25 * u)}" fill="${GOLD}" stroke="${INK}" stroke-width="${f(MID)}"/><circle cx="${f(bm[0])}" cy="${f(bm[1] + 0.14 * u)}" r="${f(0.12 * u)}" fill="${BLUE}" stroke="${INK}" stroke-width="${f(FINE)}"/>`;
  }

  // ---- neck + ribbed gorget ----
  { const nb = B(0, 9.0, 0.1), tx = H.neckTop[0], ty = H.chin[1] - 0.5 * u, nw = 0.49 * u;
    const d = `M${f(nb[0] - nw * 1.08)} ${f(nb[1])}L${f(tx - nw)} ${f(ty)}L${f(tx + nw)} ${f(ty)}L${f(nb[0] + nw * 1.08)} ${f(nb[1])}Z`;
    const nid = 'cas' + (++UID);
    s += `<path d="${d}" fill="${SKIN}" stroke="${INK}" stroke-width="${f(OUT * u)}" stroke-linejoin="round"/><clipPath id="${nid}"><path d="${d}"/></clipPath>`
      + `<g clip-path="url(#${nid})"><path d="${H.hullD}" fill="${SKIN_SH}" transform="translate(${f(0.16 * u)} ${f(0.5 * u)})"/><rect x="${f(nb[0] + nw * 0.35)}" y="${f(ty - u)}" width="${f(u)}" height="${f(3 * u)}" fill="${SKIN_SH}"/></g>`;
    // gorget: ribbed tube
    const g0 = 9.0, g1 = 9.42, gx = t => lerp(nb[0], tx, (t - 9.0) / ((Y0 - ty) / u - 9.0));
    const gw = 0.58 * u, gl = [gx(g1) - gw * 0.94, Y0 - g1 * u], gr = [gx(g1) + gw * 0.94, Y0 - g1 * u], gd = `M${f(nb[0] - gw * 1.06)} ${f(Y0 - (g0 - 0.25) * u)}L${pt(gl)}Q${f(gx(g1))} ${f(gl[1] + 0.2 * u)} ${pt(gr)}L${f(nb[0] + gw * 1.06)} ${f(Y0 - (g0 - 0.25) * u)}Z`;
    let ribs = '';
    for (let i = 1; i <= 4; i++) { const yy = lerp(g1, g0 - 0.2, i / 5), cxr = gx(yy); ribs += `<path d="M${f(cxr - gw * 1.1)} ${f(Y0 - yy * u)}Q${f(cxr)} ${f(Y0 - yy * u + 0.2 * u)} ${f(cxr + gw * 1.1)} ${f(Y0 - yy * u)}" ${st(FINE * 1.1)}/>`; }
    s += form(gd, GOLD, GOLD_SH, u, { dx: 0.3, dy: 0, inner: `<rect x="${f(nb[0] - gw * 0.72)}" y="${f(Y0 - 10 * u)}" width="${f(0.13 * u)}" height="${f(2 * u)}" fill="${GOLD_HI}"/>` + ribs, sw: 0.055 });
  }

  // ---- collar wings (front, ribbed) ----
  for (const sd of [-1, 1]) {
    const A = B(sd * 0.08, 8.52, 0.92), Tp = B(sd * 1.16, 10.05, -0.28), Cc = B(sd * 1.5, 8.98, 0.05), Dd = B(sd * 0.78, 8.62, 0.8);
    let ribs = ''; for (let i = 1; i <= 4; i++) { const t = i / 5; ribs += `<path d="M${pt([lerp(A[0], Dd[0], t), lerp(A[1], Dd[1], t)])}L${pt([lerp(Tp[0], Cc[0], t * 0.9), lerp(Tp[1], Cc[1], t * 0.9)])}" ${st(FINE * 1.1)}/>`; }
    const hi = `<path d="M${pt([lerp(A[0], Dd[0], 0.12), lerp(A[1], Dd[1], 0.12) - 0.1 * u])}L${pt([lerp(Tp[0], Cc[0], 0.1), lerp(Tp[1], Cc[1], 0.1) + 0.25 * u])}" ${st(0.08 * u, GOLD_HI)}/>`;
    s += form(poly([A, Tp, Cc, Dd], 0.05 * u), GOLD, GOLD_SH, u, { dx: 0.22, dy: 0.02, inner: (sd < 0 ? hi : '') + ribs, sw: 0.06 });
    s += `<path d="M${pt(A)}L${pt(Tp)}" ${st(0.075 * u, SILVER)}/><path d="M${pt(A)}L${pt(Tp)}" ${st(FINE * 0.8)} transform="translate(${f(sd * 0.05 * u)} ${f(0.03 * u)})"/>`;
  }

  // ---- pauldrons: three layered lames per shoulder ----
  for (const sd of [-1, 1]) {
    const k = 1 - 0.3 * sd * sb, ox = x + sd * 1.6 * cb * u, oy = Y0 - 8.74 * u;
    const lame = (ax, ay, w, hg, lift) => { const Q = (px, py) => [ox + sd * px * k * u, oy - py * u];
      const a = Q(ax, ay), tp = Q(ax + w * 0.42, ay + hg), tip = Q(ax + w, ay + lift), lo = Q(ax + w * 0.55, ay - hg * 0.42), a2 = Q(ax + 0.05, ay - hg * 0.5);
      const d = `M${pt(a)}Q${pt(Q(ax + w * 0.08, ay + hg * 0.95))} ${pt(tp)}Q${pt(Q(ax + w * 0.8, ay + hg * 0.95))} ${pt(tip)}Q${pt(Q(ax + w * 0.85, ay - hg * 0.3))} ${pt(lo)}Q${pt(Q(ax + w * 0.25, ay - hg * 0.62))} ${pt(a2)}Z`;
      const trim = `M${pt(tip)}Q${pt(Q(ax + w * 0.85, ay - hg * 0.3))} ${pt(lo)}Q${pt(Q(ax + w * 0.25, ay - hg * 0.62))} ${pt(a2)}`;
      const hl = Q(ax + w * (sd < 0 ? 0.62 : 0.22), ay + hg * 0.62), hl2 = Q(ax + w * (sd < 0 ? 0.3 : 0.5), ay + hg * 0.78), hl3 = Q(ax + w * (sd < 0 ? 0.42 : 0.4), ay + hg * 0.4);
      return form(d, GOLD, GOLD_SH, u, { dx: 0.2, dy: 0.1, sw: 0.062, inner: `<path d="${trim}" ${st(0.17 * u, SILVER)}/><path d="${trim}" ${st(FINE)} transform="translate(0 ${f(-0.1 * u)})"/><path d="${poly([hl, hl2, hl3], 0.04 * u)}" fill="${GOLD_HI}"/>` }); };
    s += lame(0.05, -0.92, 0.95, 0.42, -0.12) + lame(-0.2, -0.46, 1.2, 0.5, -0.02) + lame(-0.62, 0.05, 1.5, 0.62, 0.16);
  }

  // ---- seated: forearms and fists resting on the table ----
  if (seated) for (const sd of [-1, 1]) {
    const sh = [x + sd * armX * u, Y0 - 8.5 * u], el = [x + sd * (armX + 0.42) * u, y - 0.42 * u], hd = [x + sd * 0.62 * u + sb * 0.45 * u, y - 0.36 * u];
    s += form(limb(sh, 0.47 * u, [el[0], el[1] - 0.25 * u], 0.42 * u), BLUE, BLUE_SH, u, { dx: 0.2 });
    s += form(limb([el[0] + sd * 0.05 * u, el[1]], 0.4 * u, [hd[0] + sd * 0.3 * u, hd[1]], 0.3 * u), GOLD, GOLD_SH, u, { dx: 0.1, dy: 0.14,
      inner: `<path d="M${f(el[0] - sd * 0.15 * u)} ${f(el[1] - 0.22 * u)}L${f(hd[0] + sd * 0.45 * u)} ${f(hd[1] - 0.16 * u)}" ${st(0.08 * u, GOLD_HI)}/>` });
    s += `<path d="M${f(hd[0] + sd * 0.42 * u)} ${f(hd[1] - 0.3 * u)}v${f(0.62 * u)}" ${st(0.09 * u, SILVER)}/>`;
    s += form(`M${f(hd[0] - 0.36 * u)} ${f(hd[1] - 0.26 * u)}q${f(0.36 * u)} ${f(-0.14 * u)} ${f(0.72 * u)} 0l${f(0.02 * u)} ${f(0.64 * u)}h${f(-0.76 * u)}Z`, GOLD, GOLD_SH, u, { dx: 0.14 });
    s += `<path d="M${f(hd[0] - 0.18 * u)} ${f(hd[1] - 0.02 * u)}v${f(0.34 * u)}M${f(hd[0])} ${f(hd[1] - 0.02 * u)}v${f(0.34 * u)}M${f(hd[0] + 0.18 * u)} ${f(hd[1] - 0.02 * u)}v${f(0.34 * u)}" ${st(FINE)}/>`;
  }

  s += H.main + H.front;
  if (seated) { const cid = 'cas' + (++UID); return `<g><clipPath id="${cid}"><rect x="${f(x - 6 * u)}" y="${f(y - 9 * u)}" width="${f(12 * u)}" height="${f(9 * u)}"/></clipPath><g clip-path="url(#${cid})">${s}</g></g>`; }
  return `<g>${s}</g>`;
}

module.exports = { cassius };
