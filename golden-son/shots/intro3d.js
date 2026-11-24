// Golden Son cold open as ONE continuous camera move (no cuts):
// tight on the steak -> Darrow lands and smashes it -> camera pulls back into the over-the-shoulder behind Cassius
// -> "Cassius." -> camera orbits smoothly 180 deg to the over-the-shoulder behind Darrow -> Cassius sips -> "Darrow."
// Characters are 2D chibi billboards placed in a small 3D world; the camera orbits and projects them.
const L = require('../lighting.js'), K = require('../cast.js'), OTS = require('./ots-frames.js');
const W = 1080, H = 1920;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), lerp = (a, b, u) => a + (b - a) * u, f = v => v.toFixed(1);
const io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eoK = u => 1 - Math.pow(1 - cl(u), 3);
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
  return a * 180 / Math.PI;
}
// talking mouth during a spoken window
const talk = (t, a, b, rest) => t >= a && t < b ? ['talk', 'open', 'flat', 'open'][Math.floor(t * 13) % 4] : rest;
const SAY_D = [3.65, 4.76], SAY_C = [7.8, 8.63];

function intro(t) {
  const C = camera(t);
  // ---- Darrow: falls onto the steak, steps toward Cassius, draws + points the razor
  const fall = t < LAND ? 3.2 * Math.pow(1 - t / LAND, 2) : 0;
  const stepU = cl((t - STEP[0]) / (STEP[1] - STEP[0])), dz = 0.22 * io(stepU), bob = Math.abs(Math.sin(stepU * Math.PI * 2)) * 0.03;
  const dp = { x: D0.x, z: D0.z + dz };
  const dArm = t >= POINT ? 'bladePoint' : t >= DRAW[0] ? 'bladeUp' : 'hang';
  const pd = proj(C, dp.x, TOP + fall + bob, dp.z), sD = pd.sc * 1.0 / HCH;
  const yD = yawFor(C, dp.x, dp.z, CAS.x - dp.x, CAS.z - dp.z), dBack = Math.abs(yD) > 100;
  const darrow = K.darrow(pd.X, pd.Y, sD, { yaw: dBack ? 180 : cl(yD, -45, 45), back: dBack, mouth: talk(t, SAY_D[0], SAY_D[1], t > LAND + .3 ? 'smirk' : 'flat'), brow: 'angry',
    arms: dBack ? ['hang', dArm] : ['hang', dArm], drawn: true, wind: t });
  // ---- Cassius: seated (legs hidden), wine stain from WINE on, leans back + sips after the orbit
  const sipU = cl((t - SIP[0]) / (SIP[1] - SIP[0])), lean = -5 * io(cl((t - ORBIT[1]) / .5));
  const pc = proj(C, CAS.x, 0.08, CAS.z), sC = pc.sc * 1.0 / HCH;
  const yC = yawFor(C, CAS.x, CAS.z, dp.x - CAS.x, dp.z - CAS.z), cBack = Math.abs(yC) > 100;
  const raise = !cBack && t > SIP[0] - .25 && t < SIP[1] + .2;
  const cas = K.cassius(pc.X, pc.Y, sC, { yaw: cBack ? 180 : cl(yC, -40, 40), back: cBack, brow: t > WINE && t < ORBIT[1] ? 'angry' : 'soft',
    mouth: talk(t, SAY_C[0], SAY_C[1], t > WINE && t < ORBIT[1] ? 'frown' : 'flat'), blink: sipU > .25 && sipU < .8, arms: raise ? ['table', 'raise'] : ['table', 'table'] });
  const kC = -(cBack ? 0 : cl(yC, -40, 40)) * sC * 0.0016;
  const gob = (x, y, s) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><path d="M-22 -40 h44 l-6 34 q-6 14 -16 14 q-10 0 -16 -14 z" fill="#e2a93b" stroke="#1b1210" stroke-width="5" stroke-linejoin="round"/><path d="M-17 -34 h34 l-2 10 h-30z" fill="#8f1018"/><path d="M-4 8 v18 h-12 v7 h32 v-7 h-12 v-18z" fill="#c98f2a" stroke="#1b1210" stroke-width="4"/></g>`;
  const hand = raise ? [pc.X + kC + 0.53 * sC, pc.Y - 2.07 * sC + sC * 0.06] : null;
  const gobT = proj(C, CAS.x + 0.14, TOP, CAS.z - 0.36);
  const casSvg = `<g transform="rotate(${f(lean)} ${f(pc.X)} ${f(pc.Y)})">${L.rimLight(cas, 'gala')}${!cBack && t >= WINE ? `<g opacity="${f(cl((t - WINE) / .2))}">${OTS.wine(pc.X, pc.Y, sC)}</g>` : ''}${raise ? gob(hand[0], hand[1], sC / 150) : ''}</g>`;
  // ---- steak on a plate under Darrow's boot
  const ps = proj(C, dp.x - dz * 0 + 0.0, TOP, D0.z), stS = ps.sc / 900;
  const steak = `<g transform="translate(${f(ps.X)} ${f(ps.Y)}) scale(${f(stS)}) translate(${f(-ps.X)} ${f(-ps.Y)})">${OTS.steak(ps.X, ps.Y, 1, t >= LAND)}</g>`;
  const k = (t - LAND) / 1.0;
  const kk = k < .45 ? k * .45 : .2025 + (k - .45) * 1.15; // slow motion right after the hit
  const shards = k > 0 && k < 1.6 ? Array.from({ length: 22 }, (_, i) => {
      const a = -Math.PI * (0.04 + 0.92 * ((i * 37) % 100) / 100), sp = (260 + (i * 53) % 220) * stS, vx = Math.cos(a) * sp * 3.6, vy = Math.sin(a) * sp * 3.0;
      let x = ps.X + vx * kk, y = ps.Y + vy * kk + 2600 * stS * kk * kk; const floorY = ps.Y + (i % 3) * 18 * stS;
      if (y > floorY && kk > .05) { const tb = kk * .55; y = floorY - Math.abs(Math.sin(tb * 9)) * 60 * stS * Math.exp(-tb * 5); x = ps.X + vx * kk * .75; }
      const R0 = (22 + (i * 29) % 34) * stS * (i % 5 === 0 ? 1.6 : 1), rot = (i * 47) % 360 + kk * (260 + i * 25), flip = .65 + .35 * Math.cos(kk * (6 + i % 4) + i);
      const a0 = -.55 - (i % 3) * .1, a1 = .55 + (i % 4) * .08, P = (a, r) => `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r - R0 * .5)}`;
      const jag = `L${P(a1 - .1, R0 * .45)} L${P((a0 + a1) / 2 + .15, R0 * .62)} L${P((a0 + a1) / 2 - .1, R0 * .28)} L${P(a0 + .12, R0 * .5)}`;
      const shape = `M${P(a0, R0)} A${f(R0)} ${f(R0)} 0 0 1 ${P(a1, R0)} ${jag} Z`, th = R0 * .16;
      return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(1 ${f(flip)})" opacity="${f(cl(1.6 - k))}">`
        + `<path d="${shape}" transform="translate(0 ${f(th)})" fill="#8f9bab" stroke="#1b1210" stroke-width="${f(Math.max(1.5, R0 * .06))}" stroke-linejoin="round"/>`
        + `<path d="${shape}" fill="#f4f6f9" stroke="#1b1210" stroke-width="${f(Math.max(1.5, R0 * .06))}" stroke-linejoin="round"/>`
        + `<path d="M${P(a0 + .06, R0 * .86)} A${f(R0 * .86)} ${f(R0 * .86)} 0 0 1 ${P(a1 - .06, R0 * .86)}" stroke="#9fb3cf" stroke-width="${f(R0 * .1)}" fill="none"/>`
        + `<path d="M${P(a0 + .2, R0 * .7)} A${f(R0 * .7)} ${f(R0 * .7)} 0 0 1 ${P(a0 + .5, R0 * .7)}" stroke="#ffffff" stroke-width="${f(R0 * .07)}" fill="none" stroke-linecap="round"/></g>`; }).join('')
    + Array.from({ length: 14 }, (_, i) => { const a = -Math.PI * (0.1 + 0.8 * ((i * 61) % 100) / 100), sp = (200 + (i * 41) % 260) * stS, x = ps.X + Math.cos(a) * sp * 2 * kk, y = ps.Y - 30 * stS + Math.sin(a) * sp * 2.4 * kk + 3000 * stS * kk * kk;
      return i % 3 ? `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(7 * stS)}" ry="${f(11 * stS)}" fill="#7a1010" opacity="${f(cl(1.2 - k))}"/>` : `<path d="M${f(x - 14 * stS)} ${f(y)} q${f(10 * stS)} ${f(-16 * stS)} ${f(26 * stS)} ${f(-4 * stS)} q${f(4 * stS)} ${f(12 * stS)} ${f(-26 * stS)} ${f(4 * stS)}Z" fill="#6a2c16" stroke="#1b1210" stroke-width="2" opacity="${f(cl(1.3 - k))}"/>`; }).join('') : '';
  const dust = k > 0 && k < 1 ? `<ellipse cx="${f(ps.X)}" cy="${f(ps.Y - 10 * stS)}" rx="${f((60 + 320 * eoK(k)) * stS)}" ry="${f((16 + 70 * eoK(k)) * stS)}" fill="#e8e4dc" opacity="${f(.35 * (1 - k))}"/>` : '';
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
  // ---- the long Bellona table: family seated (some with Cassius's curls), a few on their feet, angry, all eyes on Darrow
  const wrap = (svg, d, id) => d < 1.35 ? `<filter id="${id}"><feGaussianBlur stdDeviation="${f(cl((1.35 - d) * 16, 0, 8))}"/></filter><g filter="url(#${id})">${svg}</g>` : svg;
  const far = [], near = [], props = [];
  const isFar = z => z * C.cz < 0;
  const chair = (x, z, sg) => { const b = proj(C, x, 0, z + sg * .16), tp = proj(C, x, .66, z + sg * .16); if (b.d < .3) return ''; const w = .5 * b.sc, X = b.X, y0 = tp.Y, y1 = proj(C, x, .36, z + sg * .16).Y;
    return `<path d="M${f(X - w * .4)} ${f(b.Y)} V${f(y1)} M${f(X + w * .4)} ${f(b.Y)} V${f(y1)}" stroke="#2a180e" stroke-width="${f(w * .08)}"/><path d="M${f(X - w / 2)} ${f(y1)} V${f(y0 + w * .2)} Q${f(X)} ${f(y0 - w * .25)} ${f(X + w / 2)} ${f(y0 + w * .2)} V${f(y1)} Z" fill="#3e2616" stroke="#1b1210" stroke-width="${f(Math.max(2, w * .03))}" stroke-linejoin="round"/><path d="M${f(X - w * .36)} ${f(y1 - w * .1)} V${f(y0 + w * .3)} Q${f(X)} ${f(y0 - w * .02)} ${f(X + w * .36)} ${f(y0 + w * .3)} V${f(y1 - w * .1)}" stroke="#c9a24a" stroke-width="${f(Math.max(1.5, w * .025))}" fill="none"/>`; };
  const plateAt = (x, z) => { const p = proj(C, x, TOP, z); if (p.d < .3) return ''; const rx = .13 * p.sc, g = .14 * p.sc / 80;
    return `<ellipse cx="${f(p.X)}" cy="${f(p.Y)}" rx="${f(rx)}" ry="${f(rx * .28)}" fill="#eef1f5" stroke="#1b1210" stroke-width="${f(Math.max(1.5, rx * .04))}"/><ellipse cx="${f(p.X)}" cy="${f(p.Y)}" rx="${f(rx * .62)}" ry="${f(rx * .16)}" fill="#cfd6df"/>`
      + (() => { const q = proj(C, x + .16, TOP, z); return gob(q.X, q.Y - 26 * g, g); })(); };
  const GUESTS = [
    { x: -2.5, z: 1.1, hair: 'curls', hc: '#d6a23c', brow: 'angry', mouth: 'frown', fill: '#2b4a8a' },
    { x: -1.55, z: 1.22, hair: 'short', hc: '#e2b24a', stand: true, brow: 'angry', mouth: 'shout', arms: ['hang', 'raise'], fill: '#24407a' },
    { x: 1.35, z: 1.1, hair: 'curls', hc: '#c9962e', brow: 'angry', mouth: 'flat', fill: '#2b4a8a' },
    { x: 2.3, z: 1.1, hair: 'long', hc: '#e8c060', brow: 'sad', mouth: 'frown', fill: '#33558f' },
    { x: 3.25, z: 1.22, hair: 'curls', hc: '#dcae48', stand: true, brow: 'angry', mouth: 'frown', arms: ['hip', 'hip'], fill: '#24407a' },
    { x: -2.1, z: -.8, hair: 'short', hc: '#d9b25a', brow: 'angry', mouth: 'flat', fill: '#2b4a8a' },
    { x: -1.05, z: -.8, hair: 'curls', hc: '#e0aa40', brow: 'soft', mouth: 'frown', fill: '#33558f' },
    { x: 1.0, z: -.95, hair: 'spikes', hc: '#c99a34', stand: true, brow: 'angry', mouth: 'shout', arms: ['hang', 'thrust'], fill: '#24407a' },
    { x: 2.05, z: -.8, hair: 'long', hc: '#f0c868', brow: 'angry', mouth: 'flat', fill: '#2b4a8a' },
  ];
  GUESTS.forEach((g, gi) => { const sg = Math.sign(g.z), p = proj(C, g.x, g.stand ? 0 : .08, g.z); if (p.d < .35 || p.X < -700 || p.X > W + 700) return;
    const s0 = p.sc * (g.stand ? 1.25 : 1) / HCH, yw = yawFor(C, g.x, g.z, dp.x - g.x, dp.z - g.z), back = Math.abs(yw) > 100;
    const mouth = g.mouth === 'shout' ? (t > LAND + .2 ? ['open', 'talk'][Math.floor(t * 7 + gi) % 2] : 'flat') : g.mouth;
    const fig = K.karnus(p.X, p.Y, s0 / 1.12, { yaw: back ? 180 : cl(yw, -40, 40), back, brow: t > LAND ? g.brow : 'soft', mouth: t > LAND ? mouth : 'flat', arms: g.stand ? g.arms : ['table', 'table'],
      kitOverride: { hair: g.hair === 'long' ? 'short' : g.hair, hairLong: g.hair === 'long', hairCol: g.hc, over: [], fill: g.fill, cape: g.stand ? '#1b2f5c' : undefined } });
    const body = L.rimLight(fig, 'gala'), ch = g.stand ? '' : chair(g.x, g.z, sg), svg = back ? body + ch : ch + body;
    (isFar(g.z) ? far : near).push({ d: p.d, svg: wrap(svg, p.d, 'gb' + gi) });
    if (!g.stand) props.push(plateAt(g.x, sg * .3)); });
  // Cassius + his chair + plate
  const casChair = chair(CAS.x, CAS.z, 1), casFull = cBack ? casSvg + casChair : casChair + casSvg;
  (isFar(CAS.z) ? far : near).push({ d: pc.d, svg: wrap(casFull, pc.d, 'fbc') });
  props.push(plateAt(CAS.x + .1, .32), plateAt(-1.6, -.3), plateAt(1.5, .3));
  const dSvg = `${L.floorShadow(pd.X, pd.Y + 4, sD * .85, { mood: 'gala' })}${L.rimLight(darrow, 'gala')}`;
  near.push({ d: pd.d, svg: wrap(dSvg, pd.d, 'fbd') });
  const byDepth = a => a.sort((p, q) => q.d - p.d).map(o => o.svg).join('');
  let scene = hall + floor + byDepth(far) + tableSvg(C) + props.join('') + steak + steam + dust + byDepth(near) + shards + impact + wine;
  // ---- the pull-back: start zoomed tight on the steak, ease out to the full OTS frame (same shot, no cut)
  const zu = io((t - PULL[0]) / (PULL[1] - PULL[0])), z = t < PULL[0] ? 3.6 : lerp(3.6, 1, zu);
  const pu = io((t - ORBIT[1] + .35) / 1.1), z2 = lerp(1, 1.75, pu);
  const fx = lerp(lerp(ps.X, W / 2, zu), pc.X, pu), fy = lerp(lerp(ps.Y - 60, H / 2, zu), pc.Y - 1.75 * sC, pu);
  const sh = t >= LAND && t < LAND + .35 ? Math.exp(-(t - LAND) * 12) * 26 : 0;
  const flash = t >= LAND && t < LAND + .12 ? `<rect width="${W}" height="${H}" fill="#fff" opacity="${f(.55 * (1 - (t - LAND) / .12))}"/>` : '';
  return `<g transform="translate(${f(sh * Math.sin(t * 90))} ${f(sh * Math.cos(t * 77))}) translate(${W / 2} ${H / 2}) scale(${f(z * z2 * 1000) / 1000}) translate(${f(-fx)} ${f(-fy)})">${scene}</g>${flash}`;
}
module.exports = { intro, LAND, ORBIT };
