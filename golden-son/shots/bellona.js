// SHOT: "The Bellona table"  (hero moment, 9.6 s @ 30 fps, 1080x1920)  -- round 2: calm camera
//   1  locked-off at table height: Darrow's boots land on the Bellona table (plates hop, a goblet goes over, wine runs)
//   2  one steady crane up his body to the face; settle; a small dangerous smile
//   3  CUT to Cassius, seated. Near-static frame: a slow 30-degree head drift while calm turns to fury
// Camera rules: no roll, no whip, no zoom punch, no flash, no CSS 3D. Eased crane / dolly only; depth comes from
// layer parallax and focus, not from tricks. One small shake (< 0.3 s) on the landing.
//
// frame(t, deps) -> HTML string for one frame (a 1080x1920 stage: stacked layers + caption div).
// deps = { darrow, cassius, lighting?, anchors? }
//   darrow (x, y, h, { yaw, pitch, expr, blink, wind, blade, crop })            -> SVG string
//   cassius(x, y, h, { yaw, pitch, expr, blink, pose:'stand'|'seated', crop })  -> SVG string
//     (x, y) = point between the feet, h = STANDING height in px. pose:'seated' -> (x, y) is the TABLE EDGE in front of him
//     (models/cassius.js convention: upper body cut at y, fists resting on it).
//     yaw   deg, + = face turned toward screen-right.   pitch deg, + = chin up / seen from below.
//     expr  darrow: 'brood' -> 'smile' (exprTo/mix passed too, used if the model supports it)      cassius: expr 'neutral' + exprTo 'angry' + mix 0..1 (+ look -1..1)
//     wind  seconds (phase for hair/cloak motion), crop: 'bust' only while nothing below the chest is in frame, else 'full'
//   lighting: optional. Either the lighting.js toolkit object (then bokeh/dust/grade('gala') go on top; actors carry their own rim),
//             or a function (t, { beat, focus:{x,y}, w, h }) -> HTML overlay string. Undefined -> built-in vignette + key/rim wash.
//   anchors: where the models put the hair top, as fractions of h above (x, y) - the camera frames faces from these.
// The host page must provide the caption font:  @font-face { font-family: Anton; src: url(fonts/anton.woff2) }
const gala = require('../sets/gala.js');
const S = require('../style.js');
const W = 1080, H = 1920, DUR = 9.6;
const LAND = 0.6, RISE0 = 1.6, RISE1 = 4.0, SMILE = 4.5, CUT = 5.6, FURY = 7.8;
// fractions of h ABOVE the (x, y) handed to the model. Defaults match models/darrow.js + models/cassius.js.
const ANCHORS = { darrowHairTop: 1.017, darrowHeadC: 0.90, cassiusSeatedHairTop: 0.45, cassiusSeatedHeadC: 0.316 };
// world (see sets/gala.js): y=0 table top, floor y=400
const DAR = { x: 0, y: 0, h: 1000 }, CAS = { x: 520, y: -40, h: 980 };   // Cassius: seated, y = table edge his fists rest on
const CAP_BOTTOM = 560, FACE_TOP = 625;   // caption band ends at 560: hairline rests at 625 while a caption is up

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
  const Z = { b0: 2.5, b1: 2.58, f0: 3.5, f1: 3.7, c0: 3.0, c1: 3.2 };
  let c;
  if (t < CUT) c = {   // boots (locked, breathing push) -> one crane -> settle on the face
    x: kf(t, [[0, 78], [RISE0, 78], [RISE1, 0], [CUT, 0]]),
    y: kf(t, [[0, -190], [RISE0, -186], [RISE1, yFor(dTop, Z.f0)], [CUT, yFor(dTop, Z.f1)]]),
    z: kf(t, [[0, Z.b0], [RISE0, Z.b1], [RISE1, Z.f0], [CUT, Z.f1]]),
    yaw: 0,
  }; else { const u = sm((t - CUT) / (DUR - CUT)); c = {   // Cassius: slow drift, zoom +6.7% over the whole beat
    x: CAS.x - 14 + 28 * u, y: yFor(cTop, Z.c0) + (yFor(cTop, Z.c1) - yFor(cTop, Z.c0)) * u, z: Z.c0 + (Z.c1 - Z.c0) * u,
    yaw: -15 + 30 * u,
  }; }
  c.sx = c.sy = 0;
  if (t > LAND && t < LAND + 0.3) { const d = t - LAND, a = 1 - d / 0.3; c.sy = 12 * a * a * Math.cos(d * 70); c.sx = 4 * a * a * Math.sin(d * 55); }
  return c;
}

const CAPS = [ // start, end, cream line, red line, time the red line pops
  [0.0, RISE0 + 0.2, 'HE STOOD ON', 'THEIR TABLE.', LAND],
  [RISE1 + 0.05, CUT, 'DARROW.', 'SMILING.', SMILE + 0.1],     // only once the head has come to rest under the band
  [CUT + 0.25, DUR, 'CASSIUS AU BELLONA.', "JULIAN'S BROTHER.", FURY],
];
function caption(t) {
  const c = CAPS.find(c => t >= c[0] && t < c[1]); if (!c) return '';
  const pop = t0 => { const u = cl((t - t0) / 0.2); return `transform:scale(${f(1.06 - 0.06 * eo(u))});opacity:${f(u)}`; };
  return `<div class="gs-plate"></div><div class="gs-cap"><div class="gs-l1" style="${pop(c[0])}">${c[2]}</div>${t >= c[4] ? `<div class="gs-l2" style="${pop(c[4])}${c[5] === 'gold' ? `;color:${S.capGold}` : ''}">${c[3]}</div>` : ''}</div>`;
}

function impactFx(t) { // one soft ring + a few short dust ticks on the cloth; nothing crosses the frame
  const d = t - LAND; if (d < 0 || d > 0.45) return ''; const u = d / 0.45; let o = '';
  for (let i = 0; i < 8; i++) { const a = (-160 + i * 20) * Math.PI / 180, r0 = 150 + 150 * eo(u), r1 = r0 + 60 * (1 - u), k = 0.3;
    o += `<path d="M${f(DAR.x + Math.cos(a) * r0)} ${f(Math.sin(a) * r0 * k)} L${f(DAR.x + Math.cos(a) * r1)} ${f(Math.sin(a) * r1 * k)}" stroke="${S.candleHot}" stroke-width="${f(7 * (1 - u))}" stroke-linecap="round" opacity="${f(0.8 * (1 - u))}"/>`; }
  return o + `<ellipse cx="${DAR.x}" cy="-6" rx="${f(170 + 260 * eo(u))}" ry="${f(14 + 22 * eo(u))}" fill="none" stroke="${S.candleHot}" stroke-width="${f(6 * (1 - u))}" opacity="${f(0.6 * (1 - u))}"/>`;
}

function frame(t, deps = {}) {
  const A = { ...ANCHORS, ...(deps.anchors || {}) };
  const c = camera(t, A);
  const beat = t < RISE0 ? 'slam' : t < CUT ? 'rise' : 'cassius';
  const set = gala(t, { x: c.x, y: c.y, zoom: c.z, yaw: c.yaw }, { impact: LAND, impactX: DAR.x, stations: { boots: [78, -188], face: [0, -940], cassius: [CAS.x, -275] } });
  const D = gala.DEPTH, K = 1.3; // K: px of drift per degree of Cassius's turn, per unit of depth difference (slight)
  const T = (p, e) => `translate(${f(W / 2 + c.sx * p + (p - 1) * c.yaw * K)} ${f(H / 2 + c.sy * p)}) scale(${f(Math.pow(c.z, e))}) translate(${f(-c.x * p)} ${f(-c.y * p)})`;

  // ---- performances
  const d = t - LAND;
  const fall = d < 0 ? -1500 * Math.pow(-d / 0.3, 1.5) : 0;                       // drops in over the last 0.3 s before LAND
  const sq = d > 0 ? 1 - 0.035 * Math.exp(-d * 9) * Math.cos(d * 22) : 1.02;
  const dYaw = kf(t, [[0, -8], [RISE0, -8], [CUT, 9]]);                            // one slow turn, within +-12
  const smile = sm((t - (SMILE - 0.35)) / 0.7);
  const L = deps.lighting && typeof deps.lighting === 'object' && deps.lighting.grade ? deps.lighting : null; // lighting.js toolkit
  const darrow = t < CUT ? deps.darrow(DAR.x, DAR.y, DAR.h, { yaw: dYaw, pitch: 6, expr: smile < 0.5 ? 'brood' : 'smile', exprTo: 'smile', mix: smile, blink: t > SMILE - 0.5 && t < SMILE - 0.38, wind: t * 0.4, blade: false, crop: t > RISE1 - 0.1 ? 'bust' : 'full' }) : '';
  const fury = sm((t - (FURY - 0.5)) / 1.0); // calm -> fury blend over 1 s, centred on FURY
  const cassius = t >= CUT - 0.01 || t < RISE0 ? deps.cassius(CAS.x, CAS.y, CAS.h, { yaw: t < CUT ? -15 : c.yaw, pitch: 4, expr: 'neutral', exprTo: 'angry', mix: fury, blink: t > FURY - 0.75 && t < FURY - 0.62, look: cl(-0.3 - c.yaw / 60, -1, 1), pose: 'seated', crop: 'full' }) : '';

  // ---- layers (plain 2D: parallax by depth, focus by blur)
  const layer = (blur, inner) => `<div class="gs-l"${blur ? ` style="filter:blur(${blur}px)"` : ''}><svg viewBox="0 0 ${W} ${H}">${inner}</svg></div>`;
  const far = layer(beat === 'cassius' ? 6 : 5, `<g transform="${T(D.far, 0.55)}">${set.far}</g>`);
  const mid = layer(beat === 'slam' ? 3 : 2.5, `<g transform="${T(D.mid, 0.85)}">${set.mid}</g>`);
  const main = layer(0, `<g transform="${T(1, 1)}">${cassius}${set.table}
      <g transform="translate(0 ${f(fall)}) translate(${DAR.x} ${DAR.y}) scale(${f(2 - sq)} ${f(sq)}) translate(${-DAR.x} ${-DAR.y})">${darrow}</g>${impactFx(t)}</g>`);
  const near = layer(15, `<g transform="${T(D.near, 1.2)}">${set.near}</g>`);

  // ---- light
  const focus = beat === 'cassius' ? { x: 540, y: 1050 } : beat === 'rise' ? { x: 540, y: 1000 } : { x: 540, y: 1150 };
  let light;
  if (L) light = `<div class="gs-l"><svg viewBox="0 0 ${W} ${H}">${L.bokeh(7, t, { count: 14 })}${L.dust(3, t, { count: 30, opacity: .45 })}</svg></div>${L.grade('gala', { t })}
      <div class="gs-l" style="background:linear-gradient(180deg,rgba(13,6,48,.6) 0,rgba(13,6,48,.3) ${CAP_BOTTOM}px,rgba(13,6,48,0) ${CAP_BOTTOM + 180}px,rgba(13,6,48,0) 1520px,rgba(13,6,48,.55) 100%)"></div>`;
  else if (typeof deps.lighting === 'function') light = deps.lighting(t, { beat, focus, w: W, h: H }) || '';
  else light = `<div class="gs-l" style="background:radial-gradient(ellipse 75% 60% at ${focus.x}px ${focus.y}px,rgba(13,6,48,0) 45%,rgba(13,6,48,.7) 100%)"></div>
      <div class="gs-l" style="background:linear-gradient(115deg,rgba(255,200,120,.20) 0%,rgba(255,200,120,0) 38%,rgba(90,140,255,0) 70%,rgba(90,140,255,.16) 100%);mix-blend-mode:screen"></div>
      <div class="gs-l" style="background:linear-gradient(180deg,rgba(13,6,48,.6) 0,rgba(13,6,48,.3) ${CAP_BOTTOM}px,rgba(13,6,48,0) ${CAP_BOTTOM + 180}px,rgba(13,6,48,0) 1520px,rgba(13,6,48,.55) 100%)"></div>`;

  return `<style>.gs-stage,.gs-l{position:absolute;left:0;top:0;width:${W}px;height:${H}px;overflow:hidden}.gs-stage{background:${S.night}}.gs-l svg{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
    .gs-plate{position:absolute;left:0;top:170px;width:${W}px;height:490px;background:radial-gradient(ellipse 52% 50% at 50% 50%,rgba(13,6,48,.62) 0%,rgba(13,6,48,.45) 45%,rgba(13,6,48,0) 100%)}
    .gs-cap{position:absolute;top:270px;left:150px;right:150px;height:290px;display:flex;flex-direction:column;justify-content:center;text-align:center;font-family:Anton,Impact,sans-serif;line-height:1.1}
    .gs-l1,.gs-l2{font-size:88px;letter-spacing:1px;-webkit-text-stroke:10px ${S.INK};paint-order:stroke fill;text-shadow:0 7px 0 rgba(0,0,0,.55);white-space:nowrap}.gs-l1{color:${S.capCream}}.gs-l2{color:${S.capRed}}</style>
    <div class="gs-stage">${far}${mid}${main}${near}${light}${caption(t)}</div>`;
}
module.exports = { frame, DUR, FPS: 30, W, H, ANCHORS, BEATS: { LAND, RISE0, RISE1, SMILE, CUT, FURY } };
