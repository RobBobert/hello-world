// SHOT: "The Bellona table"  (hero moment, 8.8 s @ 30 fps, 1080x1920)
//   1  boots slam onto the Bellona table (low angle, table lip + cloth big in the foreground, plates jump, wine goes over)
//   2  camera climbs his body to the face: the smile
//   3  whip down to Cassius, seated; the camera swings round his face (yaw -45 -> +40) while calm turns to fury
//
// frame(t, deps) -> HTML string for one frame (a 1080x1920 stage: stacked layers + caption div).
// deps = { darrow, cassius, lighting?, anchors? }
//   darrow (x, y, h, { yaw, pitch, expr, blink, wind, blade, crop })            -> SVG string
//   cassius(x, y, h, { yaw, pitch, expr, blink, pose:'stand'|'seated', crop })  -> SVG string
//     (x, y) = point between the feet, h = STANDING height in px. pose:'seated' -> (x, y) is the TABLE EDGE in front of him
//     (models/cassius.js convention: upper body cut at y, fists resting on it).
//     yaw   deg, + = face turned toward screen-right.   pitch deg, + = chin up / seen from below.
//     expr  darrow: 'brood' -> 'smile' -> 'grin'      cassius: expr 'neutral' + exprTo 'angry' + mix 0..1 (+ look -1..1)
//     wind  seconds (phase for hair/cloak motion), crop: 'bust' only while nothing below the chest is in frame, else 'full'
//   lighting: optional. Either the lighting.js toolkit object (then bokeh/dust/grade('gala') go on top; actors carry their own rim),
//             or a function (t, { beat, focus:{x,y}, w, h }) -> HTML overlay string. Undefined -> built-in vignette + key/rim wash.
//   anchors: where the models put the hair top, as fractions of h above (x, y) - the camera frames faces from these.
// The host page must provide the caption font:  @font-face { font-family: Anton; src: url(fonts/anton.woff2) }
const gala = require('../sets/gala.js');
const S = require('../style.js');
const W = 1080, H = 1920, DUR = 8.8;
const LAND = 0.5, RISE0 = 1.5, RISE1 = 3.1, DROP0 = 4.4, DROP1 = 5.05, FURY = 6.9;
// fractions of h ABOVE the (x, y) handed to the model. Defaults match models/darrow.js + models/cassius.js.
const ANCHORS = { darrowHairTop: 1.0, darrowHeadC: 0.90, cassiusSeatedHairTop: 0.45, cassiusSeatedHeadC: 0.316 };
// world (see sets/gala.js): y=0 table top, floor y=400
const DAR = { x: 0, y: 0, h: 1000 }, CAS = { x: 520, y: -40, h: 980 };   // Cassius: seated, y = table edge his fists rest on
const CAP_BOTTOM = 560, FACE_TOP = 610;   // caption band ends at 560: hairline never rises above 610 while a caption is up

const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const sm = u => { u = cl(u); return u * u * (3 - 2 * u); };
const eo = u => 1 - Math.pow(1 - cl(u), 3);
const kf = (t, ks) => { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const [t0, v0] = ks[i - 1], [t1, v1] = ks[i]; return v0 + (v1 - v0) * io((t - t0) / (t1 - t0)); } return ks[ks.length - 1][1]; };
const f = v => (+v).toFixed(2);

function camera(t, A) {
  // frame a face so that its hair top sits at FACE_TOP for a given zoom
  const dTop = DAR.y - A.darrowHairTop * DAR.h, cTop = CAS.y - A.cassiusSeatedHairTop * CAS.h;
  const yFor = (top, z) => top + (H / 2 - FACE_TOP) / z;
  const Z = { b0: 2.5, b1: 2.8, f0: 2.75, f1: 3.0, c0: 2.7, c1: 3.5 };
  const c = {
    x: kf(t, [[0, 30], [LAND, 30], [RISE0, 12], [RISE1, -30], [DROP0, -18], [DROP1, CAS.x - 55], [DUR, CAS.x + 40]]),
    y: kf(t, [[0, -194], [LAND, -194], [RISE0, -172], [RISE1, yFor(dTop, Z.f0)], [DROP0, yFor(dTop, Z.f1)], [DROP1, yFor(cTop, Z.c0)], [DUR, yFor(cTop, Z.c1)]]),
    z: kf(t, [[0, Z.b0], [LAND, Z.b0], [RISE0, Z.b1], [RISE1, Z.f0], [DROP0, Z.f1], [DROP1, Z.c0], [DUR, Z.c1]]),
    roll: kf(t, [[0, -8], [LAND, -8], [RISE0, -5], [RISE1, 5], [DROP0, 3], [DROP1, -4], [DUR, 3]]),
    tilt: kf(t, [[0, 14], [RISE0, 14], [RISE1, 20], [DROP0, 20], [DROP1, -3], [DUR, -3]]),          // far wall leans back = low angle
    yaw: t < DROP0 ? 0 : t < DROP1 + 0.25 ? -45 * io((t - DROP0) / (DROP1 - DROP0)) : -45 + 87 * sm((t - DROP1 - 0.25) / (DUR - 0.1 - DROP1 - 0.25)),        // orbit round Cassius
  };
  if (t > LAND) { const d = t - LAND, a = Math.exp(-d * 7); c.z += 0.14 * a; c.sx = 34 * a * Math.sin(d * 95); c.sy = 46 * a * Math.cos(d * 78); c.roll += 2.2 * a * Math.sin(d * 60); } else { c.sx = c.sy = 0; }
  if (t > FURY) c.z += 0.13 * (1 - Math.exp(-(t - FURY) * 9));
  return c;
}

const CAPS = [ // start, end, cream line, red line, time the red line pops
  [0.0, RISE0 + 0.15, 'HE STOOD ON', 'THEIR TABLE.', LAND, 'gold'],   // gold, not red: the band sits on crimson armour here
  [RISE1 - 0.35, DROP0 + 0.1, 'DARROW.', 'SMILING.', RISE1 + 0.25],
  [DROP1 + 0.1, DUR, 'CASSIUS AU BELLONA.', "JULIAN'S BROTHER.", FURY],
];
function caption(t) {
  const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return '';
  const pop = t0 => { const u = cl((t - t0) / 0.14); return `transform:scale(${f(1.25 - 0.25 * eo(u))});opacity:${f(u)}`; };
  return `<div class="gs-plate"></div><div class="gs-cap"><div class="gs-l1" style="${pop(c[0])}">${c[2]}</div>${t >= c[4] ? `<div class="gs-l2" style="${pop(c[4])}${c[5] === 'gold' ? `;color:${S.capGold}` : ''}">${c[3]}</div>` : ''}</div>`;
}

function impactFx(t) {
  const d = t - LAND; if (d < 0 || d > 0.55) return ''; const u = d / 0.55; let o = '';
  for (let i = 0; i < 16; i++) { const a = (-176 + i * 11.5) * Math.PI / 180, r0 = 150 + 520 * eo(u) + (i % 3) * 40, r1 = r0 + 240 * (1 - u), k = 0.42;
    o += `<path d="M${f(DAR.x + Math.cos(a) * r0)} ${f(Math.sin(a) * r0 * k)} L${f(DAR.x + Math.cos(a) * r1)} ${f(Math.sin(a) * r1 * k)}" stroke="${i % 4 ? '#fff' : S.candleHot}" stroke-width="${f(16 * (1 - u))}" stroke-linecap="round" opacity="${f(1 - u)}"/>`; }
  return o + `<ellipse cx="${DAR.x}" cy="-8" rx="${f(220 + 760 * eo(u))}" ry="${f(20 + 70 * eo(u))}" fill="none" stroke="#fff" stroke-width="${f(14 * (1 - u))}" opacity="${f(0.85 * (1 - u))}"/>`;
}
function fallStreaks(t) { // vertical speed lines while the boots come down
  if (t < LAND - 0.22 || t > LAND + 0.06) return ''; let o = '';
  for (let i = 0; i < 9; i++) { const x = DAR.x - 230 + i * 58 + (i % 2) * 14; o += `<path d="M${x} ${-900 + (i * 97) % 300} V${-260 - (i * 53) % 160}" stroke="#fff" stroke-width="${5 + i % 3 * 3}" opacity=".5" stroke-linecap="round"/>`; }
  return o;
}

function frame(t, deps = {}) {
  const A = { ...ANCHORS, ...(deps.anchors || {}) };
  const c = camera(t, A), c2 = camera(Math.min(DUR, t + 1 / 30), A);
  const beat = t < RISE0 ? 'slam' : t < DROP0 ? 'rise' : 'cassius';
  const set = gala(t, { x: c.x, y: c.y, zoom: c.z, yaw: c.yaw }, { impact: LAND, impactX: DAR.x, stations: { boots: [25, -185], face: [-20, -940], cassius: [CAS.x, -275] } });
  const D = gala.DEPTH, K = 5.2; // K: px of slide per degree of orbit, per unit of depth difference
  const T = (p, e, x0 = W / 2, y0 = H / 2) => `translate(${f(x0 + c.sx * p + (p - 1) * c.yaw * K)} ${f(y0 + c.sy * p)}) rotate(${f(c.roll)}) scale(${f(Math.pow(c.z, e))}) translate(${f(-c.x * p)} ${f(-c.y * p)})`;

  // ---- performances
  const d = t - LAND;
  const fall = d < 0 ? -1700 * Math.pow(-d / LAND, 1.6) - (t < 0.12 ? 4000 : 0) : 0;
  const sq = d > 0 ? 1 - 0.07 * Math.exp(-d * 9) * Math.cos(d * 26) : 1.05;
  const dYaw = kf(t, [[0, -14], [RISE0, -14], [RISE1, -24], [DROP0, 14]]);
  const dExpr = t < RISE1 - 0.5 ? 'brood' : t < RISE1 + 0.25 ? 'smile' : 'grin';
  const L = deps.lighting && typeof deps.lighting === 'object' && deps.lighting.grade ? deps.lighting : null; // lighting.js toolkit
  const darrow = deps.darrow(DAR.x, DAR.y, DAR.h, { yaw: dYaw, pitch: 9, expr: dExpr, blink: t > RISE1 - 0.05 && t < RISE1 + 0.08, wind: t, blade: false, crop: t > RISE1 - 0.15 && t < DROP0 ? 'bust' : 'full' });
  const fury = sm((t - (FURY - 0.25)) / 0.5); // calm -> fury blend, centred on FURY
  const cassius = deps.cassius(CAS.x, CAS.y, CAS.h, { yaw: t < DROP0 ? -45 : c.yaw, pitch: 6, expr: 'neutral', exprTo: 'angry', mix: fury, blink: t > FURY - 0.42 && t < FURY - 0.3, look: cl(-c.yaw / 60, -1, 1) * 0.5, pose: 'seated', crop: 'full' });

  // ---- layers
  const PAD = 420, vb = `viewBox="${-PAD} ${-PAD} ${W + 2 * PAD} ${H + 2 * PAD}"`;
  const farCss = `transform:perspective(1500px) rotateX(${f(c.tilt)}deg) rotateY(${f(c.yaw * 0.22)}deg);filter:blur(5px)`;
  const far = `<div class="gs-pad" style="${farCss}"><svg ${vb}><g transform="${T(D.far, 0.55)}">${set.far}</g></svg></div>`;
  const mid = `<div class="gs-l" style="filter:blur(${beat === 'slam' ? 3 : 2}px)"><svg viewBox="0 0 ${W} ${H}"><g transform="${T(D.mid, 0.85)}">${set.mid}</g></svg></div>`;
  const main = `<div class="gs-l"><svg viewBox="0 0 ${W} ${H}"><g transform="${T(1, 1)}">
      ${cassius}${set.table}${fallStreaks(t)}</g></svg></div>`;
  // Darrow gets his own layer so he can be tipped back in 3D about his feet: legs huge, body receding = low angle.
  // The tip eases to 0 as the camera reaches his face (so face framing is exact).
  const lean = kf(t, [[0, 6], [RISE0, 6], [RISE1 - 0.3, 0]]);
  const fy = H / 2 + c.sy + (DAR.y - c.y) * c.z, fx = W / 2 + c.sx + (DAR.x - c.x) * c.z;
  const hero = `<div class="gs-l" style="overflow:visible;transform-origin:${f(fx)}px ${f(fy)}px;transform:perspective(1900px) rotateX(${f(lean)}deg)"><svg viewBox="0 0 ${W} ${H}" style="overflow:visible"><g transform="${T(1, 1)}">
      <g transform="translate(0 ${f(fall)}) translate(${DAR.x} ${DAR.y}) scale(${f(2 - sq)} ${f(sq)}) translate(${-DAR.x} ${-DAR.y})">${darrow}</g></g></svg></div>
    <div class="gs-l"><svg viewBox="0 0 ${W} ${H}"><g transform="${T(1, 1)}">${impactFx(t)}</g></svg></div>`;
  // foreground: set dressing + (in the swing) Darrow's own boots sweeping across the bottom of frame, out of focus
  let fgDarrow = '';
  if (t > DROP1 - 0.2) { const sx = 540 + c.yaw * 13.5, hh = 1750;
    fgDarrow = `<g mask="url(#gsFade)" style="filter:brightness(.45) saturate(.8)"><g transform="rotate(${f(c.roll)} 540 960)">${deps.darrow(sx, 1930, hh, { yaw: -c.yaw * 0.4, expr: 'grin', wind: t, crop: 'full' })}</g></g>`; }
  const near = `<div class="gs-l" style="filter:blur(15px)"><svg viewBox="0 0 ${W} ${H}"><defs><linearGradient id="gsFadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>
      <mask id="gsFade" maskUnits="userSpaceOnUse" x="-400" y="0" width="1900" height="2400"><rect x="-400" y="1440" width="1900" height="170" fill="url(#gsFadeG)"/><rect x="-400" y="1609" width="1900" height="900" fill="#fff"/></mask></defs>
      <g transform="${T(D.near, 1.2)}">${set.near}</g>${fgDarrow}</svg></div>`;

  // ---- light
  const focus = beat === 'cassius' ? { x: 540, y: 1050 } : beat === 'rise' ? { x: 540, y: 1000 } : { x: 540, y: 1150 };
  let light;
  if (L) light = `<div class="gs-l"><svg viewBox="0 0 ${W} ${H}">${L.bokeh(7, t, { count: 14 })}${L.dust(3, t, { count: 30, opacity: .45 })}</svg></div>${L.grade('gala', { t })}
      <div class="gs-l" style="background:linear-gradient(180deg,rgba(13,6,48,.6) 0,rgba(13,6,48,.3) ${CAP_BOTTOM}px,rgba(13,6,48,0) ${CAP_BOTTOM + 180}px,rgba(13,6,48,0) 1520px,rgba(13,6,48,.55) 100%)"></div>`;
  else if (typeof deps.lighting === 'function') light = deps.lighting(t, { beat, focus, w: W, h: H }) || '';
  else light = `<div class="gs-l" style="background:radial-gradient(ellipse 75% 60% at ${focus.x}px ${focus.y}px,rgba(13,6,48,0) 45%,rgba(13,6,48,.7) 100%)"></div>
      <div class="gs-l" style="background:linear-gradient(115deg,rgba(255,200,120,.20) 0%,rgba(255,200,120,0) 38%,rgba(90,140,255,0) 70%,rgba(90,140,255,.16) 100%);mix-blend-mode:screen"></div>
      <div class="gs-l" style="background:linear-gradient(180deg,rgba(13,6,48,.6) 0,rgba(13,6,48,.3) ${CAP_BOTTOM}px,rgba(13,6,48,0) ${CAP_BOTTOM + 180}px,rgba(13,6,48,0) 1520px,rgba(13,6,48,.55) 100%)"></div>`;
  const flash = d >= 0 && d < 0.1 ? `<div class="gs-l" style="background:#fff;opacity:${f(0.55 * (1 - d / 0.1))}"></div>` : '';
  const speed = Math.hypot((c2.x - c.x) * c.z, (c2.y - c.y) * c.z), whip = cl((speed - 70) / 12, 0, 8);

  return `<style>.gs-stage,.gs-l{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden}.gs-stage{background:${S.night}}.gs-l svg{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
    .gs-pad{position:absolute;left:${-PAD}px;top:${-PAD}px;width:${W + 2 * PAD}px;height:${H + 2 * PAD}px}.gs-pad svg{width:100%;height:100%}
    .gs-plate{position:absolute;left:0;top:170px;width:${W}px;height:490px;background:radial-gradient(ellipse 52% 50% at 50% 50%,rgba(13,6,48,.62) 0%,rgba(13,6,48,.45) 45%,rgba(13,6,48,0) 100%)}
    .gs-cap{position:absolute;top:270px;left:150px;right:150px;height:290px;display:flex;flex-direction:column;justify-content:center;text-align:center;font-family:Anton,Impact,sans-serif;line-height:1.1}
    .gs-l1,.gs-l2{font-size:88px;letter-spacing:1px;-webkit-text-stroke:10px ${S.INK};paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.55);white-space:nowrap}.gs-l1{color:${S.capCream}}.gs-l2{color:${S.capRed}}</style>
    <div class="gs-stage"><div class="gs-l" style="${whip > 0.3 ? `filter:blur(${f(whip)}px)` : ''}">${far}${mid}${main}${hero}${near}</div>${light}${flash}${caption(t)}</div>`;
}
module.exports = { frame, DUR, FPS: 30, W, H, ANCHORS, BEATS: { LAND, RISE0, RISE1, DROP0, DROP1, FURY } };
