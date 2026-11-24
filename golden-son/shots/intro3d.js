// Golden Son cold open as ONE continuous camera move (no cuts):
// tight on the steak -> Darrow lands and smashes it -> camera pulls back into the over-the-shoulder behind Cassius
// -> "Cassius." -> camera orbits smoothly 180 deg to the over-the-shoulder behind Darrow -> Cassius sips -> "Darrow."
// Characters are 2D chibi billboards placed in a small 3D world; the camera orbits and projects them.
const L = require('../lighting.js'), K = require('../cast.js'), OTS = require('./ots-frames.js');
const W = 1080, H = 1920;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u, f = v => v.toFixed(1);
const io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const sio = u => { u = cl(u); return u * u * (3 - 2 * u); }; // gentle ease for the orbit
const MONO = `<g filter="url(#mono)">`;

// timeline (seconds)
const LAND = 0.55, PULL = [0.55, 2.1], STEP = [2.1, 2.8], DRAW = [2.85, 3.3], POINT = 3.45, ORBIT = [4.85, 6.45], SIP = [6.7, 7.5], WINE = 1.6;
// world (metres-ish). y up. Table top at 0.75.
const TOP = 0.75, D0 = { x: -0.22, z: 0 }, CAS = { x: 0.42, z: 1.1 }, M = { x: 0.1, z: 0.55 }, R = 1.3;
const FOC = 1100, HCH = 2.45; // chibi drawn height = HCH * s

function camera(t) {
  const th = Math.PI * sio((t - ORBIT[0]) / (ORBIT[1] - ORBIT[0]));
  const cx = M.x + R * Math.sin(th), cz = M.z + R * Math.cos(th);
  const fx = M.x - cx, fz = M.z - cz, n = Math.hypot(fx, fz);
  const u = sio((t - ORBIT[0]) / (ORBIT[1] - ORBIT[0]));
  return { th, cx, cz, fx: fx / n, fz: fz / n, rx: -fz / n, rz: fx / n, h: lerp(1.0, 1.6, u), hz: lerp(980, 800, u) };
}
const proj = (C, x, y, z) => { const vx = x - C.cx, vz = z - C.cz, d = vx * C.fx + vz * C.fz, l = vx * C.rx + vz * C.rz;
  return { X: W / 2 + FOC * l / d, Y: C.hz + FOC * (C.h - y) / d, d, sc: FOC / d }; };

// table top + front skirt, clipped against the near plane
function tableSvg(C) {
  const near = 0.08, toCam = p => { const vx = p[0] - C.cx, vz = p[2] - C.cz; return [vx * C.rx + vz * C.rz, p[1], vx * C.fx + vz * C.fz]; };
  const clip = poly => { const out = []; for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ina = a[2] >= near, inb = b[2] >= near;
      if (ina) out.push(a); if (ina !== inb) { const k = (near - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, near]); } } return out; };
  const scr = poly => clip(poly.map(toCam)).map(([l, y, d]) => `${f(W / 2 + FOC * l / d)} ${f(C.hz + FOC * (C.h - y) / d)}`).join(' L');
  const X0 = -4, X1 = 4, Z0 = -0.45, Z1 = 0.45, side = (CAS.z - 0.55) * Math.cos(C.th) > 0 ? Z1 : Z0;
  const topP = scr([[X0, TOP, Z0], [X1, TOP, Z0], [X1, TOP, Z1], [X0, TOP, Z1]]);
  const skirt = scr([[X0, TOP, side], [X1, TOP, side], [X1, 0, side], [X0, 0, side]]);
  const trim = scr([[X0, TOP, side], [X1, TOP, side], [X1, TOP - 0.03, side], [X0, TOP - 0.03, side]]);
  return (skirt ? `<path d="M${skirt} Z" fill="#1d3466" stroke="#1b1210" stroke-width="5"/>` : '') + (topP ? `<path d="M${topP} Z" fill="#2b4a8a" stroke="#1b1210" stroke-width="5"/>` : '')
    + (trim ? `<path d="M${trim} Z" fill="#d8e0ea"/>` : '');
}

// yaw for a billboard: facing direction vs. direction to camera (degrees, + = turns toward screen right)
function yawFor(C, px, pz, faceX, faceZ) {
  const tx = C.cx - px, tz = C.cz - pz, a = Math.atan2(faceX * tz - faceZ * tx, faceX * tx + faceZ * tz);
  return -a * 180 / Math.PI;
}

function intro(t) {
  const C = camera(t);
  // ---- Darrow: falls onto the steak, steps toward Cassius, draws + points the razor
  const fall = t < LAND ? 3.2 * Math.pow(1 - t / LAND, 2) : 0;
  const stepU = cl((t - STEP[0]) / (STEP[1] - STEP[0])), dz = 0.22 * io(stepU), bob = Math.abs(Math.sin(stepU * Math.PI * 2)) * 0.03;
  const dp = { x: D0.x, z: D0.z + dz };
  const dArm = t >= POINT ? 'bladePoint' : t >= DRAW[0] ? 'bladeUp' : 'hang';
  const pd = proj(C, dp.x, TOP + fall + bob, dp.z), sD = pd.sc * 1.0 / HCH;
  const yD = yawFor(C, dp.x, dp.z, CAS.x - dp.x, CAS.z - dp.z), dBack = Math.abs(yD) > 100;
  const darrow = K.darrow(pd.X, pd.Y, sD, { yaw: dBack ? 180 : cl(yD, -45, 45), back: dBack, mouth: t > LAND + .3 ? 'smirk' : 'flat', brow: 'angry',
    arms: dBack ? ['hang', dArm] : ['hang', dArm], drawn: true, wind: t });
  // ---- Cassius: seated (legs hidden), wine stain from WINE on, leans back + sips after the orbit
  const sipU = cl((t - SIP[0]) / (SIP[1] - SIP[0])), lean = -5 * io(cl((t - ORBIT[1]) / .5));
  const pc = proj(C, CAS.x, 0.08, CAS.z), sC = pc.sc * 1.0 / HCH;
  const yC = yawFor(C, CAS.x, CAS.z, dp.x - CAS.x, dp.z - CAS.z), cBack = Math.abs(yC) > 100;
  const raise = !cBack && t > SIP[0] - .25 && t < SIP[1] + .2;
  const cas = K.cassius(pc.X, pc.Y, sC, { yaw: cBack ? 180 : cl(yC, -40, 40), back: cBack, brow: t > WINE && t < ORBIT[1] ? 'angry' : 'soft',
    mouth: t > WINE && t < ORBIT[1] ? 'frown' : 'flat', blink: sipU > .25 && sipU < .8, arms: raise ? ['table', 'raise'] : ['table', 'table'] });
  const kC = -(cBack ? 0 : cl(yC, -40, 40)) * sC * 0.0016;
  const gob = (x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path d="M-22 -40 h44 l-6 34 q-6 14 -16 14 q-10 0 -16 -14 z" fill="#e2a93b" stroke="#1b1210" stroke-width="5" stroke-linejoin="round"/><path d="M-17 -34 h34 l-2 10 h-30z" fill="#8f1018"/><path d="M-4 8 v18 h-12 v7 h32 v-7 h-12 v-18z" fill="#c98f2a" stroke="#1b1210" stroke-width="4"/></g>`;
  const hand = raise ? [pc.X + kC + 0.53 * sC, pc.Y - 2.07 * sC + sC * 0.06] : null;
  const gobT = proj(C, CAS.x + 0.14, TOP, CAS.z - 0.36);
  const casSvg = `<g transform="rotate(${f(lean)} ${f(pc.X)} ${f(pc.Y)})">${L.rimLight(cas, 'gala')}${!cBack && t >= WINE ? `<g opacity="${f(cl((t - WINE) / .2))}">${OTS.wine(pc.X, pc.Y, sC)}</g>` : ''}${raise ? gob(hand[0], hand[1], sC / 150) : ''}</g>`;
  // ---- steak on a plate under Darrow's boot
  const ps = proj(C, dp.x - dz * 0 + 0.0, TOP, D0.z), stS = ps.sc / 900;
  const steak = `<g transform="translate(${f(ps.X)} ${f(ps.Y)}) scale(${f(stS)}) translate(${f(-ps.X)} ${f(-ps.Y)})">${OTS.steak(ps.X, ps.Y, 1, t >= LAND)}</g>`;
  const k = (t - LAND) / 1.0;
  const shards = k > 0 && k < 1.3 ? Array.from({ length: 16 }, (_, i) => { const a = -Math.PI * (0.05 + 0.9 * ((i * 37) % 100) / 100), v = (120 + (i * 53) % 120) * stS * 3, x = ps.X + Math.cos(a) * v * k * 2.2, y = ps.Y + Math.sin(a) * v * k * 1.6 + 900 * stS * k * k, r = (i * 47) % 360 + k * 500;
    return `<path d="M${f(x)} ${f(y)} l${f(18 * stS * 4)} ${f(-8 * stS * 4)} l${f(10 * stS * 4)} ${f(22 * stS * 4)} l${f(-24 * stS * 4)} ${f(6 * stS * 4)} Z" fill="#eef1f5" stroke="#1b1210" stroke-width="3" transform="rotate(${f(r)} ${f(x)} ${f(y)})" opacity="${f(cl(1.3 - k))}"/>`; }).join('') : '';
  const impact = k > 0 && k < .5 ? Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2, r0 = (30 + 260 * (k / .5)) * stS * 3, r1 = r0 + 110 * stS * 3 * (1 - k / .5);
    return `<line x1="${f(ps.X + Math.cos(a) * r0)}" y1="${f(ps.Y + Math.sin(a) * r0 * .5)}" x2="${f(ps.X + Math.cos(a) * r1)}" y2="${f(ps.Y + Math.sin(a) * r1 * .5)}" stroke="#fff6d0" stroke-width="${f(10 * (1 - k / .5))}" stroke-linecap="round"/>`; }).join('') : '';
  const steam = t < LAND ? Array.from({ length: 3 }, (_, i) => { const u = (t * .9 + i * .33) % 1, x = ps.X + (i - 1) * 40 * stS * 3 + 8 * Math.sin(u * 6 + i);
    return `<path d="M${f(x)} ${f(ps.Y - 40 * stS * 3 - 160 * stS * 3 * u)} q-14 -24 4 -48 q16 -24 0 -48" stroke="#fff" stroke-width="7" fill="none" stroke-linecap="round" opacity="${f(.5 * Math.sin(Math.PI * u))}"/>`; }).join('') : '';
  // wine arc from the knocked goblet onto Cassius
  const wu = cl((t - 1.2) / (WINE - 1.2)), g0 = proj(C, CAS.x - 0.2, TOP + .1, 0.3), g1 = proj(C, CAS.x, 0.55, CAS.z);
  const wine = t > 1.2 && t < WINE + .1 ? `<path d="M${f(g0.X)} ${f(g0.Y)} Q${f((g0.X + g1.X) / 2)} ${f(Math.min(g0.Y, g1.Y) - 200)} ${f(lerp(g0.X, g1.X, wu))} ${f(lerp(g0.Y, g1.Y, wu) - 200 * Math.sin(Math.PI * wu))}" stroke="#8f1018" stroke-width="${f(6 + 10 * wu)}" fill="none" stroke-linecap="round" opacity=".9"/>` : '';
  // ---- background hall pans with the orbit (two copies, motion-blurred while turning)
  const spin = Math.abs(Math.sin(Math.PI * cl((t - ORBIT[0]) / (ORBIT[1] - ORBIT[0])))), pan = -C.th / Math.PI * 1500;
  const off = ((pan % W) + W) % W - W;
  const hall = `<filter id="ib" x="-10%" y="0" width="120%" height="100%"><feGaussianBlur stdDeviation="${f(spin * 14)} 0"/></filter><g filter="url(#ib)">${[0, 1, 2].map(i => `<g transform="translate(${f(off + i * W)} ${f(C.hz - 1010)})">${MONO}${L.skyOrRoom('gala', t, { floorY: 1470 })}</g></g>`).join('')}</g>`;
  const floor = `<defs><linearGradient id="flr" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a6c76"/><stop offset="1" stop-color="#34343c"/></linearGradient></defs><rect x="0" y="${f(C.hz + 40)}" width="${W}" height="${f(H - C.hz)}" fill="url(#flr)"/>`;
  // ---- painter's order: table, then whoever is farther
  const casFar = pc.d > proj(C, CAS.x, TOP, 0.45 * Math.sign(CAS.z)).d;
  const fgBlur = d => d < 1.35 ? `<filter id="fb${d < 1 ? 1 : 2}"><feGaussianBlur stdDeviation="${f(cl((1.35 - d) * 18, 0, 9))}"/></filter>` : '';
  const wrap = (svg, d, id) => d < 1.35 ? `<filter id="${id}"><feGaussianBlur stdDeviation="${f(cl((1.35 - d) * 16, 0, 8))}"/></filter><g filter="url(#${id})">${svg}</g>` : svg;
  const dSvg = `${L.floorShadow(pd.X, pd.Y + 4, sD * .85, { mood: 'gala' })}${L.rimLight(darrow, 'gala')}`;
  let scene = hall + floor;
  const casLayer = wrap(casSvg, pc.d, 'fbc'), darLayer = wrap(dSvg, pd.d, 'fbd');
  if (casFar) scene += casLayer + tableSvg(C) + steak + steam + shards + darLayer;
  else scene += tableSvg(C) + steak + steam + shards + darLayer + casLayer;
  scene += impact + wine;
  // ---- the pull-back: start zoomed tight on the steak, ease out to the full OTS frame (same shot, no cut)
  const zu = io((t - PULL[0]) / (PULL[1] - PULL[0])), z = t < PULL[0] ? 3.6 : lerp(3.6, 1, zu);
  const pu = io((t - ORBIT[1] + .35) / 1.1), z2 = lerp(1, 1.75, pu);
  const fx = lerp(lerp(ps.X, W / 2, zu), pc.X, pu), fy = lerp(lerp(ps.Y - 60, H / 2, zu), pc.Y - 1.75 * sC, pu);
  const sh = t >= LAND && t < LAND + .35 ? Math.exp(-(t - LAND) * 12) * 26 : 0;
  const flash = t >= LAND && t < LAND + .12 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${f(.55 * (1 - (t - LAND) / .12))}"/>` : '';
  return `<g transform="translate(${f(sh * Math.sin(t * 90))} ${f(sh * Math.cos(t * 77))}) translate(${W / 2} ${H / 2}) scale(${f(z * z2 * 1000) / 1000}) translate(${f(-fx)} ${f(-fy)})">${scene}</g>${flash}`;
}
module.exports = { intro, LAND, ORBIT };
