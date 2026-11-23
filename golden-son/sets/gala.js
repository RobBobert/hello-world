// SET: the Sovereign's gala, Luna. Layered so the camera can parallax through it.
//
//   const { far, mid, table, near } = gala(t, cam, { impact, impactX })
//
// cam = { x, y, zoom, yaw }  (world camera; only x / yaw are used here, for the Earth's extra-deep parallax)
// Every layer is an SVG string authored in its OWN layer space. The caller draws layer L with
//     translate(screenCentre) scale(zoom^e) translate(-cam.x * DEPTH.L, -cam.y * DEPTH.L)
// so DEPTH 1 = the plane the actors stand in, <1 = further away (moves less), >1 = closer (moves more).
//
// WORLD (depth 1) UNITS: a standing adult is ~1000 tall.  y = 0 is where a boot lands on the table top,
// the table's front lip is y = +14, its far edge y = -46, the ballroom floor is y = +400.
//
// layers, back to front:
//   far   (DEPTH .35) wall of tall arched windows, Earth + stars beyond, columns, Bellona banners, chandeliers
//   mid   (DEPTH .70) guest silhouettes (rim-lit) standing behind the table, for scale
//   table (DEPTH 1)   banquet table in Bellona blue / silver + tableware that reacts to `impact`
//                     draw order: seated actors -> table -> anyone standing ON the table
//   near  (DEPTH 1.6) big dark out-of-focus foreground shapes (caller should blur ~14-18px)
const S = require('../style.js');
const DEPTH = { far: 0.35, mid: 0.7, table: 1, near: 1.6 };
const INK = S.INK;
const f = v => (+v).toFixed(1);
// room colours follow lighting.js MOODS.gala (violet room, warm key from upper-left, cyan rim from the right)
const C = { wall0: '#0e0738', wall1: '#21157a', wall2: '#34209a', dado: '#150b48', lead: '#150b48', col: '#3a2590', colSh: '#1d1160', key: '#ffbf5e', rim: '#6fd6ff', dark: '#0d0630' };
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const rng = seed => { let v = seed; return () => (v = (v * 9301 + 49297) % 233280) / 233280; };

// House Bellona eagle, wings spread. Unit box ~1 x 1 centred on 0,0.
const EAGLE_HALF = [[0, -.46], [.07, -.36], [.05, -.26], [.2, -.34], [.5, -.5], [.47, -.3], [.52, -.24], [.42, -.12], [.45, -.04], [.32, .04], [.15, .06], [.1, .2], [.2, .44], [.07, .34], [0, .5]];
const EAGLE_D = (() => { const r = EAGLE_HALF, l = r.slice(1, -1).reverse().map(([x, y]) => [-x, y]); return 'M' + r.concat(l).map(p => p.join(' ')).join('L') + 'Z'; })();
const eagle = (x, y, s, fill, extra = '') => `<path d="${EAGLE_D}" transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" fill="${fill}" ${extra}/>`;

const flame = (x, y, s, t, i = 0) => { const k = 1 + 0.12 * Math.sin(t * 13 + i * 2.1) + 0.06 * Math.sin(t * 29 + i), lean = 2.5 * Math.sin(t * 7 + i * 1.3) * s;
  return `<path d="M${f(x - 6 * s)} ${f(y)} Q${f(x - 9 * s)} ${f(y - 12 * s * k)} ${f(x + lean)} ${f(y - 30 * s * k)} Q${f(x + 9 * s)} ${f(y - 12 * s * k)} ${f(x + 6 * s)} ${f(y)} Z" fill="${S.candleHot}"/>`; };

// ---------------------------------------------------------------- FAR
const WIN = i => i * 420 + 130;            // window centres
const COL = i => i * 420 - 80;             // columns sit between windows
function farLayer(t, cam) {
  const R = rng(11); let o = '';
  o += `<defs>
    <linearGradient id="gaWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.wall0}"/><stop offset=".55" stop-color="${C.wall1}"/><stop offset="1" stop-color="${C.wall2}"/></linearGradient>
    <linearGradient id="gaSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1250"/><stop offset=".6" stop-color="#2452c4"/><stop offset="1" stop-color="#58a0ff"/></linearGradient>
    <radialGradient id="gaGlow"><stop offset="0" stop-color="${S.candleHot}" stop-opacity=".95"/><stop offset=".25" stop-color="${S.candle}" stop-opacity=".5"/><stop offset="1" stop-color="${S.candle}" stop-opacity="0"/></radialGradient>
    <radialGradient id="gaEarthGlow"><stop offset=".7" stop-color="#6fa8ff" stop-opacity=".55"/><stop offset="1" stop-color="#6fa8ff" stop-opacity="0"/></radialGradient>
    <clipPath id="gaWin">`;
  const winD = x => `M${x - 125} 230 V-500 Q${x - 125} -640 ${x} -700 Q${x + 125} -640 ${x + 125} -500 V230 Z`;
  for (let i = -4; i <= 5; i++) o += `<path d="${winD(WIN(i))}"/>`;
  o += `</clipPath></defs>`;
  o += `<rect x="-2200" y="-1700" width="4800" height="3200" fill="url(#gaWall)"/>`;
  // beyond the glass: stars + the Earth (deeper than the wall, so it lags behind the wall when the camera moves)
  const lag = (cam && cam.x || 0) * 0.12 + (cam && cam.yaw || 0) * 0.9;
  o += `<g clip-path="url(#gaWin)"><rect x="-2200" y="-900" width="4800" height="1300" fill="url(#gaSky)"/>`;
  for (let i = 0; i < 150; i++) { const x = -1900 + R() * 4000 + lag * 0.6, y = -720 + R() * 900, r = 1.5 + R() * 3.2;
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="#fff" opacity="${f(0.45 + 0.5 * R())}"/>`; }
  const ex = 250 + lag, ey = -330, er = 290;
  o += `<circle cx="${f(ex)}" cy="${ey}" r="${er * 1.35}" fill="url(#gaEarthGlow)"/>
    <circle cx="${f(ex)}" cy="${ey}" r="${er}" fill="#3f78d8"/>
    <g fill="#e9f1ff" opacity=".9"><path d="M${f(ex - 230)} ${ey - 70} q90 -50 190 -18 q70 22 150 -8 q-40 52 -140 46 q-110 -8 -200 -20z"/><path d="M${f(ex - 150)} ${ey + 90} q120 -36 250 6 q50 16 110 4 q-70 46 -170 34 q-110 -12 -190 -44z"/><path d="M${f(ex - 40)} ${ey - 190} q70 -26 150 4 q-60 26 -150 -4z"/></g>
    <path d="M${f(ex - 60)} ${ey - 130} q70 30 60 110 q-50 30 -110 -10 q-10 -70 50 -100z" fill="#3c9a6a" opacity=".85"/>
    <path d="M${f(ex + 60)} ${ey - er * 0.98} A${er} ${er} 0 0 1 ${f(ex + 60)} ${ey + er * 0.98} A${er * 1.5} ${er * 1.5} 0 0 0 ${f(ex + 60)} ${ey - er * 0.98}Z" fill="#06102e" opacity=".8"/></g>`;
  // window leading + frames
  for (let i = -4; i <= 5; i++) { const x = WIN(i);
    o += `<g fill="none" stroke="${C.lead}" stroke-width="9"><path d="M${x} -700 V230"/><path d="M${x - 125} -500 H${x + 125} M${x - 125} -290 H${x + 125} M${x - 125} -80 H${x + 125}"/><path d="M${x - 125} -500 Q${x} -560 ${x} -700 M${x + 125} -500 Q${x} -560 ${x} -700"/></g>
      <path d="${winD(x)}" fill="none" stroke="${C.lead}" stroke-width="26"/><path d="${winD(x)}" fill="none" stroke="${C.key}" stroke-width="7" opacity=".7" transform="translate(-9 0)"/>`; }
  // cool light shafts falling from the windows (diagonals)
  for (let i = -4; i <= 5; i++) { const x = WIN(i); o += `<path d="M${x - 120} -480 L${x + 120} -480 L${x + 620} 700 L${x + 170} 700 Z" fill="${C.rim}" opacity=".10"/>`; }
  // dado / lower wall
  o += `<rect x="-2200" y="230" width="4800" height="1300" fill="${C.dado}"/><rect x="-2200" y="230" width="4800" height="16" fill="${C.key}" opacity=".6"/>`;
  // columns + banners + sconces
  for (let i = -4; i <= 6; i++) { const x = COL(i);
    o += `<rect x="${x - 62}" y="-1700" width="124" height="2600" fill="${C.col}"/><rect x="${x + 4}" y="-1700" width="58" height="2600" fill="${C.colSh}"/><rect x="${x - 62}" y="-1700" width="20" height="2600" fill="${C.key}" opacity=".85"/><rect x="${x + 54}" y="-1700" width="8" height="2600" fill="${C.rim}" opacity=".8"/>
      <path d="M${x - 30} -1700 V900 M${x - 8} -1700 V900" stroke="${C.colSh}" stroke-width="5" opacity=".6"/>
      <rect x="${x - 82}" y="-640" width="164" height="42" fill="${S.goldShade}"/><rect x="${x - 82}" y="-640" width="164" height="12" fill="${S.gold}"/>
      <rect x="${x - 76}" y="196" width="152" height="60" fill="${C.colSh}"/>`;
    const sw = 7 * Math.sin(t * 1.3 + i * 1.7), bw = 92;
    o += `<g transform="translate(${x} -590) skewX(${f(sw * 0.35)})"><path d="M${-bw} 0 H${bw} V470 L0 400 L${-bw} 470 Z" fill="${S.bellonaBlue}" stroke="#0a0f24" stroke-width="7" stroke-linejoin="round"/>
      <path d="M${bw * 0.1} 0 H${bw} V470 L${bw * 0.1} 407 Z" fill="${S.bellonaDeep}" opacity=".75"/>
      <path d="M${-bw + 13} 12 V440 M${bw - 13} 12 V440" stroke="${S.silver}" stroke-width="5" opacity=".8"/>
      ${eagle(0, 190, 150, S.silver, `stroke="#0a0f24" stroke-width=".02"`)}<rect x="${-bw - 10}" y="-12" width="${bw * 2 + 20}" height="18" rx="6" fill="${S.silverShade}"/></g>`;
    o += `<circle cx="${x}" cy="120" r="${f(120 + 10 * Math.sin(t * 9 + i))}" fill="url(#gaGlow)" opacity=".55"/>${flame(x, 132, 1.5, t, i)}<rect x="${x - 6}" y="130" width="12" height="34" fill="${S.silver}"/>`;
  }
  // chandeliers: rings of candles hanging in front of the windows
  for (const k of [-3, -1, 1, 3]) { const x = WIN(k), y = -640 + (k % 2 ? 0 : 60), swing = 6 * Math.sin(t * 0.9 + k);
    o += `<g transform="translate(${f(x + swing)} ${y})"><path d="M0 -1100 V-40 M-150 0 L0 -70 L150 0" stroke="${S.goldShade}" stroke-width="7" fill="none"/>
      <circle r="${f(250 + 14 * Math.sin(t * 8 + k))}" fill="url(#gaGlow)" opacity=".6"/>
      <ellipse rx="160" ry="27" fill="none" stroke="${S.gold}" stroke-width="13"/><path d="M-160 0 A160 27 0 0 0 160 0" fill="none" stroke="${S.goldShade}" stroke-width="13"/>`;
    for (let c = 0; c < 7; c++) { const a = c / 7 * Math.PI * 2 + 0.3, cx = Math.cos(a) * 160, cy = Math.sin(a) * 27; o += `<rect x="${f(cx - 5)}" y="${f(cy - 34)}" width="10" height="34" fill="${S.capCream}"/>${flame(cx, cy - 34, 1.1, t, c + k)}`; }
    o += `</g>`; }
  return o;
}

// ---------------------------------------------------------------- MID (guests)
const GUESTS = [ // x, head-centre y, scale, palette, hair, goblet arm
  [-560, -330, 1.05, 0, 0, 1], [-345, -300, 0.95, 1, 1, 0], [-150, -345, 1.1, 2, 2, 0], [95, -290, 0.92, 0, 1, -1],
  [225, -340, 1.04, 1, 0, 0], [520, -315, 0.98, 2, 2, 1], [690, -350, 1.1, 0, 1, 0], [880, -300, 0.95, 1, 0, -1], [1080, -335, 1.05, 2, 2, 0],
];
const GPAL = ['#2a1a78', '#3a2590', '#22145f'];
function guest(x, y, s, pal, hair, arm, t, jolt) {
  const yy = y - jolt * 16, hairD = [
    `M${-52} ${-10} Q${-62} ${-78} 0 ${-76} Q62 ${-78} 52 ${-10} Q30 ${-44} 0 ${-40} Q${-30} ${-44} ${-52} ${-10}Z`,                       // short
    `M${-56} 30 Q${-76} ${-84} 0 ${-84} Q76 ${-84} 56 30 L70 150 L40 60 Q0 ${-30} ${-40} 60 L${-70} 150Z`,                                   // long
    `M${-50} ${-6} Q${-70} ${-60} ${-30} ${-78} Q0 ${-104} 30 ${-78} Q70 ${-60} 50 ${-6} Q0 ${-50} ${-50} ${-6}Z`,                          // piled up
  ][hair];
  const body = `<path d="${hairD}"/><ellipse rx="46" ry="57"/><path d="M-22 44 h44 v40 h-44z"/>
    <path d="M-175 190 Q-170 96 -40 78 L40 78 Q170 96 175 190 L205 1400 L-205 1400 Z"/>` +
    (arm ? `<path d="M${arm * 150} 150 L${arm * 215} 70 L${arm * 200} -30 L${arm * 232} -34 L${arm * 262} 84 L${arm * 190} 210Z"/><path d="M${arm * 190} -30 h${arm * 52} l${-arm * 8} -66 h${-arm * 36}z"/>` : '');
  const lean = jolt * (x < 0 ? -3 : 3);
  return `<g transform="translate(${f(x)} ${f(yy)}) rotate(${f(lean)} 0 700) scale(${s})"><g fill="${C.rim}" opacity=".9" transform="translate(7 -2)">${body}</g><g fill="${C.key}" opacity=".6" transform="translate(-5 -1)">${body}</g><g fill="${GPAL[pal]}">${body}</g></g>`;
}
function midLayer(t, cam, o) {
  const dt = t - o.impact, jolt = dt > 0 ? Math.exp(-dt * 3.5) * Math.abs(Math.sin(dt * 9)) + 0.25 * cl(dt * 6) : 0;
  return GUESTS.map(g => guest(g[0], g[1], g[2], g[3], g[4], g[5], t, jolt * Math.exp(-Math.abs(g[0] - o.impactX * DEPTH.mid) / 900))).join('');
}

// ---------------------------------------------------------------- TABLE + tableware
const WINE = '#8c1717', WINE_HI = '#c23a2c';
const WARE = [ // type, x (relative to impactX), depth 0 (far edge) .. 1 (front lip)
  ['plate', -640, .55], ['goblet', -545, .3], ['cand', -430, .25], ['plate', -168, .8], ['goblet', -215, .35], ['knife', -250, .9],
  ['spill', 158, .75], ['plate', 320, .3], ['plate', -330, .3], ['plate', 470, .85], ['knife', 590, .9], ['bowl', 745, .25], ['goblet', 700, .85], ['cand', 900, .25], ['goblet', 990, .6], ['plate', 1090, .6], ['knife', 395, .92],
];
const ol = `stroke="${INK}" stroke-width="5" stroke-linejoin="round"`;
function gobletSvg(wine) { return `<path d="M-26 -112 H26 L20 -66 Q0 -50 -20 -66 Z" fill="${S.silver}" ${ol}/><path d="M4 -110 H24 L18 -68 Q10 -60 4 -58Z" fill="${S.silverShade}"/>
  ${wine ? `<path d="M-23 -108 H23 L22 -98 H-22Z" fill="${WINE}"/>` : ''}<path d="M-5 -56 h10 v38 l18 12 v6 h-46 v-6 l18 -12z" fill="${S.silver}" ${ol}/>`; }
function ware(type, x, y, sc, t, dt, a, i) {
  const live = dt > 0, hop = live ? a * 120 * Math.exp(-dt * 3.2) * Math.abs(Math.sin(dt * 10.5)) : 0, rot = live ? a * 16 * Math.exp(-dt * 3.4) * Math.sin(dt * 19 + i * 1.9) : 0;
  const g = (inner, r = rot, h = hop) => `<g transform="translate(${f(x)} ${f(y - h)}) rotate(${f(r)}) scale(${f(sc)})">${inner}</g>`;
  const shadow = `<ellipse cx="${f(x)}" cy="${f(y + 2)}" rx="${f((type === 'plate' ? 74 : 34) * sc * (1 - hop / 400))}" ry="${f(7 * sc)}" fill="${S.bellonaDeep}" opacity=".7"/>`;
  if (type === 'plate') return shadow + g(`<ellipse rx="74" ry="12" fill="${S.silver}" ${ol}/><ellipse cy="-2" rx="48" ry="6.5" fill="${S.silverShade}"/>
    <path d="M-30 -5 q10 -22 32 -18 q22 -6 30 14 q-30 10 -62 4z" fill="${i % 2 ? '#b5642c' : '#7d9a3a'}" ${ol}/>`);
  if (type === 'goblet') return shadow + g(gobletSvg(true));
  if (type === 'knife') return g(`<path d="M-44 0 L20 -3 L44 0 L20 3Z" fill="${S.silver}" stroke="${INK}" stroke-width="3"/>`, live ? a * 420 * cl(dt * 2.2) + i * 30 : i * 14 - 20, live ? a * 260 * Math.sin(Math.PI * cl(dt / 0.75)) : 0);
  if (type === 'bowl') return shadow + g(`<circle cx="-22" cy="-44" r="19" fill="#b4232a" ${ol}/><circle cx="14" cy="-48" r="21" fill="${S.gold}" ${ol}/><circle cx="-2" cy="-64" r="17" fill="#7a3f9a" ${ol}/>
    <path d="M-58 -36 H58 Q52 0 18 0 H-18 Q-52 0 -58 -36Z" fill="${S.silver}" ${ol}/><path d="M10 -34 H56 Q50 -2 18 -2Z" fill="${S.silverShade}"/>`);
  if (type === 'cand') { const fl = [-58, 0, 58].map((dx, k) => `<rect x="${dx - 7}" y="${-300 - (k === 1 ? 44 : 0)}" width="14" height="60" fill="${S.capCream}" stroke="${INK}" stroke-width="4"/>${flame(dx, -300 - (k === 1 ? 44 : 0), 1.5 + (live ? a * Math.exp(-dt * 2) : 0), t * (live ? 1 + 2 * a * Math.exp(-dt * 2) : 1), i + k)}`).join('');
    return shadow + `<circle cx="${f(x)}" cy="${f(y - 330 * sc)}" r="${f(260 * sc)}" fill="url(#gaGlow2)" opacity="${f(0.55 + 0.08 * Math.sin(t * 11 + i))}"/>` + g(`<path d="M-58 -240 Q-58 -190 0 -190 Q58 -190 58 -240" fill="none" stroke="${INK}" stroke-width="20"/><path d="M-58 -240 Q-58 -190 0 -190 Q58 -190 58 -240" fill="none" stroke="${S.silver}" stroke-width="11"/>
      <path d="M-7 -284 h14 v250 l24 22 v12 h-62 v-12 l24 -22z" fill="${S.silver}" ${ol}/><path d="M1 -280 h6 v246 l22 22 v8 h-28z" fill="${S.silverShade}"/>${fl}`, rot * 0.35, hop * 0.5); }
  if (type === 'spill') { // the goblet that goes over
    const k = live ? cl(dt / 0.32) : 0, tip = live ? 98 * (1 - Math.pow(1 - k, 2)) + 7 * Math.exp(-dt * 5) * Math.sin(dt * 22) : 0;
    let s = shadow;
    if (live) { const u = cl((dt - 0.15) / 1.6), e = 1 - Math.pow(1 - u, 3), px = x + 95 * sc; // pool on the cloth, then runs over the lip
      s += `<path d="M${f(px - 70)} ${f(y - 2)} Q${f(px - 40 + 10 * e)} ${f(y - 16 - 6 * e)} ${f(px + 60 * e)} ${f(y - 12 - 6 * e)} Q${f(px + 150 * e)} ${f(y - 6)} ${f(px + 120 * e)} ${f(y + 8)} L${f(px - 60)} ${f(y + 8)}Z" fill="${WINE}" ${ol}/>`; }
    return s + g(gobletSvg(!live), tip, hop * 0.6);
  }
  return '';
}
function tableLayer(t, cam, o) {
  const ix = o.impactX, dt = t - o.impact, live = dt > 0; let s = '';
  s += `<defs><radialGradient id="gaGlow2"><stop offset="0" stop-color="${S.candleHot}" stop-opacity=".9"/><stop offset=".3" stop-color="${S.candle}" stop-opacity=".4"/><stop offset="1" stop-color="${S.candle}" stop-opacity="0"/></radialGradient>
    <linearGradient id="gaCloth" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${S.bellonaBlue}"/><stop offset="1" stop-color="${S.bellonaDeep}"/></linearGradient></defs>`;
  const X0 = ix - 2600, X1 = ix + 3200;
  // top surface (seen at a grazing, low angle), silver runner, lip, cloth with hard-edged folds
  s += `<rect x="${X0}" y="-46" width="${X1 - X0}" height="62" fill="#3d62b0"/><rect x="${X0}" y="-46" width="${X1 - X0}" height="9" fill="#5a80cc"/>
    <rect x="${X0}" y="-22" width="${X1 - X0}" height="13" fill="${S.silver}" opacity=".5"/><path d="M${X0} -46 H${X1}" stroke="${INK}" stroke-width="6"/>
    <rect x="${X0}" y="52" width="${X1 - X0}" height="1700" fill="url(#gaCloth)"/>`;
  for (let i = -18; i < 24; i++) { const x = ix + i * 138 + 30, w = 46 + (i * 37 % 30 + 30) % 30;
    s += `<path d="M${x} 52 L${x + w} 52 L${x + w + 26} 1700 L${x - 18} 1700 Z" fill="${S.bellonaDeep}" opacity=".55"/><path d="M${x - 40} 52 L${x - 28} 52 L${x - 46} 1700 L${x - 70} 1700Z" fill="#4a70bd" opacity=".35"/>`; }
  s += `<rect x="${X0}" y="52" width="${X1 - X0}" height="46" fill="${S.shadowMul}" opacity=".5"/>`;
  // big silver eagle embroidered on the drop, under where the boots land
  s += eagle(ix + 20, 300, 420, S.silver, `opacity=".9" stroke="${INK}" stroke-width=".012"`) ;
  s += `<path d="M${ix + 40} 150 L${ix + 320} 150 L${ix + 320} 700 L${ix + 60} 700Z" fill="${S.bellonaDeep}" opacity=".35"/>`;
  // lip
  s += `<rect x="${X0}" y="14" width="${X1 - X0}" height="40" fill="${S.silver}" stroke="${INK}" stroke-width="6"/><rect x="${X0}" y="36" width="${X1 - X0}" height="15" fill="${S.silverShade}"/>`;
  for (let i = -30; i < 40; i++) s += `<path d="M${ix + i * 84} 24 l14 9 l-14 9 l-14 -9z" fill="${S.bellonaBlue}"/>`;
  // tableware, far edge first
  const items = WARE.map((w, i) => ({ w, i })).sort((p, q) => p.w[2] - q.w[2]);
  for (const { w, i } of items) { const [type, dx, d] = w, x = ix + dx, y = -40 + d * 46, a = Math.exp(-Math.abs(dx) / 620);
    s += ware(type, x, y, 1.15 + d * 0.4, t, dt, a, i); }
  if (live) {
    // wine running over the lip and down the cloth
    const px = ix + 158 + 150, u = cl((dt - 0.5) / 2.4), e = 1 - Math.pow(1 - u, 2);
    [[0, 330, 26], [44, 190, 20], [-38, 120, 16], [80, 80, 14]].forEach(([dx, len, w], k) => { const L = len * cl(e * 1.3 - k * 0.12); if (L > 2)
      s += `<path d="M${px + dx - w / 2} 6 V${f(14 + L)} a${w / 2} ${w / 2 + 3} 0 0 0 ${w} 0 V6 Z" fill="${WINE}" ${ol}/><path d="M${px + dx - w / 4} 18 V${f(10 + L)}" stroke="${WINE_HI}" stroke-width="4" stroke-linecap="round"/>`; });
    // thrown droplets + shards of the plate under his heel
    const R = rng(7);
    for (let k = 0; k < 9; k++) { const vx = 260 + R() * 520, vy = -(520 + R() * 620), x = ix + 180 + vx * dt, y = -90 + vy * dt + 1500 * dt * dt, r = 11 + R() * 13; if (y < 30 && dt < 1.2) s += `<path d="M${f(x)} ${f(y - r * 1.5)} q${f(r)} ${f(r * 1.4)} 0 ${f(r * 2.3)} q${f(-r)} ${f(-r * 0.9)} 0 ${f(-r * 2.3)}z" fill="${WINE}" stroke="${INK}" stroke-width="3" transform="rotate(${f(Math.atan2(vy + 3000 * dt, vx) * 57.3 + 90)} ${f(x)} ${f(y)})"/>`; }
    for (let k = 0; k < 10; k++) { const dir = k % 2 ? 1 : -1, vx = dir * (160 + R() * 620), vy = -(620 + R() * 760), x = ix + dir * 120 + vx * dt, y = -10 + vy * dt + 1700 * dt * dt, r = 14 + R() * 18; if (y < 40 && dt < 1.3) s += `<path d="M${-r} ${r * 0.5} L${r * 0.2} ${-r} L${r} ${r * 0.7}Z" fill="${k % 3 ? S.silver : '#fff'}" stroke="${INK}" stroke-width="4" stroke-linejoin="round" transform="translate(${f(x)} ${f(y)}) rotate(${f(dt * 700 * dir + k * 40)})"/>`; }
  }
  return s;
}

// ---------------------------------------------------------------- NEAR (out-of-focus foreground dressing)
// Each piece is pinned to one camera "station" (the world point the camera looks at when the piece should be in frame):
// station [cx, cy] -> near-space origin [cx * DEPTH.near, cy * DEPTH.near]; offsets are near-space units (~1/3.5 screen px).
function nearLayer(t, cam, o) {
  const st = o.stations, D = DEPTH.near, DARK = C.dark; let s = '';
  const at = (k, dx, dy) => [st[k][0] * D + dx, st[k][1] * D + dy];
  { // boots station: a tall goblet silhouette hard against the left edge, candle flare low right
    const [x, y] = at('boots', -215, 330);
    s += `<g transform="translate(${f(x)} ${f(y)}) scale(2.5)"><path d="M-30 -116 H30 L23 -66 Q0 -48 -23 -66 Z M-6 -56 h12 v38 l20 12 v40 h-52 v-40 l20 -12z" fill="${DARK}"/><path d="M22 -112 L17 -70" stroke="${S.candle}" stroke-width="5" opacity=".7"/></g>`;
    const [x2, y2] = at('boots', 240, 330);
    s += `<circle cx="${f(x2)}" cy="${f(y2 - 110)}" r="${f(70 + 6 * Math.sin(t * 10))}" fill="${S.candle}" opacity=".5"/><circle cx="${f(x2)}" cy="${f(y2 - 110)}" r="24" fill="${S.candleHot}"/><rect x="${f(x2 - 20)}" y="${f(y2 - 80)}" width="40" height="400" fill="${DARK}"/>`;
  }
  { // face station: a banner tail hanging into the top-right corner, a raised glass low left
    const [x, y] = at('face', 150, -330);
    s += `<path d="M${f(x - 30)} ${f(y - 300)} H${f(x + 200)} V${f(y + 190)} L${f(x + 60)} ${f(y + 110)} L${f(x - 30)} ${f(y + 200)}Z" fill="#1a1466"/>`;
    const [x2, y2] = at('face', -190, 250);
    s += `<g transform="translate(${f(x2)} ${f(y2)}) rotate(-14) scale(1.25)"><path d="M-30 -116 H30 L23 -66 Q0 -48 -23 -66 Z M-6 -56 h12 v38 h-12z" fill="${DARK}"/><path d="M-34 -24 q34 -22 68 0 l24 300 h-116z" fill="${DARK}"/></g>`;
  }
  { // cassius station: neighbour's shoulder + hair on the right, candelabra on the left
    const [x, y] = at('cassius', 215, 60);
    s += `<path d="M${f(x - 60)} ${f(y + 60)} Q${f(x - 40)} ${f(y - 40)} ${f(x + 40)} ${f(y - 60)} Q${f(x + 20)} ${f(y - 190)} ${f(x + 120)} ${f(y - 200)} H${f(x + 400)} V${f(y + 600)} H${f(x - 90)}Z" fill="${DARK}"/><path d="M${f(x - 60)} ${f(y + 60)} Q${f(x - 40)} ${f(y - 40)} ${f(x + 40)} ${f(y - 60)}" stroke="${S.candle}" stroke-width="7" fill="none" opacity=".6"/>`;
    const [x2, y2] = at('cassius', -205, 300);
    s += `<g transform="translate(${f(x2)} ${f(y2)})"><rect x="-9" y="-330" width="18" height="640" fill="${DARK}"/><path d="M-60 -330 Q-60 -280 0 -280 Q60 -280 60 -330" stroke="${DARK}" stroke-width="16" fill="none"/>
      ${[-60, 0, 60].map((dx, k) => `<rect x="${dx - 8}" y="${-400 - (k === 1 ? 30 : 0)}" width="16" height="74" fill="${DARK}"/><circle cx="${dx}" cy="${-425 - (k === 1 ? 30 : 0)}" r="${f(40 + 5 * Math.sin(t * 9 + k))}" fill="${S.candle}" opacity=".55"/><circle cx="${dx}" cy="${-425 - (k === 1 ? 30 : 0)}" r="15" fill="${S.candleHot}"/>`).join('')}</g>`;
  }
  return s;
}

function gala(t, cam = {}, opts = {}) {
  const o = { impact: Infinity, impactX: 0, stations: { boots: [0, -170], face: [0, -940], cassius: [520, -270] }, ...opts };
  return { far: farLayer(t, cam), mid: midLayer(t, cam, o), table: tableLayer(t, cam, o), near: nearLayer(t, cam, o) };
}
module.exports = gala; module.exports.gala = gala; module.exports.DEPTH = DEPTH; module.exports.eagle = eagle;
