// Golden Son lighting + colour toolkit. Pure functions -> SVG/HTML strings. Deterministic (seeded), no DOM, no deps.
// Frame space is 1080x1920. Everything returns SVG markup to drop inside the shot's <svg>.
// Light logic for the whole film: WARM KEY from upper-left, COOL RIM from the right, coloured (never black) shadows.
// Layer order for a shot (back to front):
//   defs() · skyOrRoom() · lightShafts() · [far cast, wrapped in dof('far')] · floorShadow()+lit(characters/props)
//   · candle()/glow() practicals · dof('near', foreground silhouettes) · bokeh()/dust() · grade() last. Or use frame().
'use strict';
const zlib = require('zlib');

// ---------------------------------------------------------------- utils
const f = n => +(+n).toFixed(1);
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const hash = s => { let h = 5381; s = String(s); for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h.toString(36); };
const rng = seed => { let a = (seed * 2654435761 >>> 0) || 1; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
const rgb = h => { h = h.replace('#', ''); if (h.length === 3) h = h.replace(/./g, c => c + c); return [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16)); };
const mix = (a, b, t) => { const A = rgb(a), B = rgb(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * cl(t)).toString(16).padStart(2, '0')).join(''); };
const rgba = (h, o) => { const c = rgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${f(o * 1000) / 1000})`; };
const SCREEN = 'style="mix-blend-mode:screen"', MULT = 'style="mix-blend-mode:multiply"';
// inline gradient with a content-hashed id (identical content => identical id, so duplicates are harmless)
const radial = (stops, extra = '') => { const body = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join(''); const id = 'gsl-r' + hash(body + extra); return { id, def: `<radialGradient id="${id}" ${extra}>${body}</radialGradient>` }; };
const linear = (stops, extra = 'x1="0" y1="0" x2="0" y2="1"') => { const body = stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join(''); const id = 'gsl-l' + hash(body + extra); return { id, def: `<linearGradient id="${id}" ${extra}>${body}</linearGradient>` }; };

// ---------------------------------------------------------------- palettes
// bg: gradient stops top->bottom · key: warm light colour · rim: edge light from the right · shadow: deepest value
// (vignette, silhouettes; never pure black) · shadowMul: colour multiplied into cel shadows · accent: the one loud
// colour of the mood · hot: light-source core · haze: atmosphere tint between layers · floor: ground stops.
const MOODS = {
  gala:    { bg: ['#0a0530', '#1e1374', '#4a2a9a'], key: '#ffbf5e', rim: '#6fd6ff', shadow: '#0d0630', shadowMul: '#5a46b4', accent: '#e0304e', hot: '#fff3c8', haze: '#8a4fd0', floor: ['#3a2590', '#150b48'] },
  space:   { bg: ['#04051a', '#0c1650', '#14407a'], key: '#ff9648', rim: '#58e4ff', shadow: '#03041a', shadowMul: '#3a3fa0', accent: '#ff3d74', hot: '#fff0d0', haze: '#2a6ad0', floor: ['#1a2360', '#070a2a'] },
  mars:    { bg: ['#4a1470', '#d0302a', '#ff8a2a', '#ffd76a'], key: '#ffb45a', rim: '#9ab8ff', shadow: '#22081f', shadowMul: '#8a3a78', accent: '#ffe28a', hot: '#fff6d8', haze: '#ff6a3a', floor: ['#b83c24', '#3a0f2a'] },
  mine:    { bg: ['#070308', '#210a10', '#5a160c'], key: '#ff7a2a', rim: '#3fd0c4', shadow: '#050206', shadowMul: '#5a2a50', accent: '#ffcf5a', hot: '#ffe9b0', haze: '#c2360f', floor: ['#3a1210', '#0a0408'] },
  triumph: { bg: ['#40140a', '#b0560f', '#f6b63c'], key: '#ffdc80', rim: '#8fd4ff', shadow: '#2a0a08', shadowMul: '#a0503c', accent: '#d21f2a', hot: '#fff6d0', haze: '#ffb040', floor: ['#8a4a14', '#2e1008'] },
  // triumph at turn=1 (the feast becomes the massacre). skyOrRoom/grade/lit lerp triumph -> sinister with opts.turn.
  sinister:{ bg: ['#0e0206', '#470810', '#b0141c'], key: '#ff5a36', rim: '#ff2438', shadow: '#0a0204', shadowMul: '#7a1830', accent: '#ffd77a', hot: '#ffd0a0', haze: '#d01020', floor: ['#4a0a12', '#0c0206'] },
  void:    { bg: ['#020206', '#07060e', '#100a16'], key: '#c4d0e8', rim: '#c0141f', shadow: '#010103', shadowMul: '#2a2440', accent: '#c0141f', hot: '#eef2ff', haze: '#2a1020', floor: ['#0c0810', '#020204'] },
};
function palette(mood, turn = 0) {
  const P = MOODS[mood] || MOODS.gala;
  if (mood !== 'triumph' || !turn) return P;
  const S = MOODS.sinister, o = {};
  for (const k in P) o[k] = Array.isArray(P[k]) ? P[k].map((c, i) => mix(c, S[k][Math.min(i, S[k].length - 1)], turn)) : mix(P[k], S[k], turn);
  return o;
}

// ---------------------------------------------------------------- film grain (one tiny PNG tile, built once)
const GRAIN = (() => {
  const N = 128, r = rng(77), raw = Buffer.alloc((N * 2 + 1) * N);
  for (let y = 0; y < N; y++) { raw[y * (N * 2 + 1)] = 0; for (let x = 0; x < N; x++) { const v = (r() + r() + r()) / 3; const i = y * (N * 2 + 1) + 1 + x * 2; raw[i] = v > .5 ? 215 : 40; raw[i + 1] = Math.round(cl(Math.abs(v - .5) * 2 * 150, 0, 255)); } }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xFFFFFFFF; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(N, 0); ihdr.writeUInt32BE(N, 4); ihdr[8] = 8; ihdr[9] = 4; // grey+alpha
  const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  return 'data:image/png;base64,' + png.toString('base64');
})();

// ---------------------------------------------------------------- defs
// Put once per frame inside the shot <svg>. Filter ids are stable: gsl-far, gsl-mid, gsl-near, gsl-bloom, gsl-soft.
function defs() {
  const fl = (id, sd, pad = 8) => `<filter id="${id}" x="-${pad}%" y="-${pad}%" width="${100 + 2 * pad}%" height="${100 + 2 * pad}%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
  return `<defs>${fl('gsl-far', 5)}${fl('gsl-mid', 2.2)}${fl('gsl-near', 15, 15)}${fl('gsl-soft', 28, 25)}
<filter id="gsl-bloom" x="-30%" y="-30%" width="160%" height="160%" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="14" result="b"/><feColorMatrix in="b" type="matrix" values="1.25 0 0 0 0  0 1.15 0 0 0  0 0 1.1 0 0  0 0 0 .85 0" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="gsl-grain" width="128" height="128" patternUnits="userSpaceOnUse"><image href="${GRAIN}" width="128" height="128"/></pattern></defs>`;
}
// Depth of field wrapper. level: 'far' (background cast/props), 'mid', 'near' (foreground silhouettes), 'soft', 'bloom'.
const dof = (level, svg) => `<g filter="url(#gsl-${level})">${svg}</g>`;

// ---------------------------------------------------------------- light primitives
// Additive soft light blob. Use for practicals, window haze, explosion cores, warm pools on walls/floors.
// opts: squash (ry/rx), blend:false (plain alpha instead of screen; use inside screen() or for cheap haze)
function glow(x, y, r, color = '#ffbf5e', opacity = 0.6, opts = {}) {
  const g = radial([[0, color, 1], [0.35, color, 0.55], [0.7, color, 0.16], [1, color, 0]]);
  const sy = opts.squash || 1;
  return `<defs>${g.def}</defs><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * sy)}" fill="url(#${g.id})" opacity="${f(opacity * 100) / 100}" ${opts.blend === false ? '' : SCREEN}/>`;
}
const G = (x, y, r, c, op, o = {}) => glow(x, y, r, c, op, { ...o, blend: false });
// Put several un-blended lights (glow/lightShafts/bokeh with {blend:false}) into ONE additive layer. Every blended
// element costs a compositing pass proportional to its area, so batch big ones with this.
const screen = svg => `<g ${SCREEN}>${svg}</g>`;
// Fan of tapered beams from (x,y) travelling along `angle` degrees (0 = right, 90 = straight down).
// opts: count(5) spread(26 deg) length(1500) width(70 start width) color opacity(.22) seed blend(false = no screen layer)
function lightShafts(x, y, angle, t = 0, opts = {}) {
  const { count = 5, spread = 26, length = 1500, width = 70, color = '#ffe2a0', opacity = 0.22, seed = 1, blend = true } = opts;
  const r = rng(seed * 13 + 5), g = linear([[0, color, 1], [0.55, color, 0.45], [1, color, 0]], `gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${length}" y2="0"`);
  let o = '';
  for (let i = 0; i < count; i++) {
    const a = (count === 1 ? 0 : (i / (count - 1) - .5) * spread) + (r() - .5) * spread * .18;
    const w0 = width * (.5 + r() * .9), w1 = w0 * (2.6 + r() * 1.6);
    const op = opacity * (.55 + r() * .45) * (.85 + .15 * Math.sin(t * (.7 + r()) + i * 1.9));
    o += `<path transform="rotate(${f(a)})" d="M0 ${f(-w0 / 2)} L${length} ${f(-w1 / 2)} L${length} ${f(w1 / 2)} L0 ${f(w0 / 2)}Z" fill="url(#${g.id})" opacity="${f(op * 1000) / 1000}"/>`;
  }
  return `<defs>${g.def}</defs><g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})" ${blend ? SCREEN : ''}>${o}</g>`;
}
// Candle with flickering flame + halo. (x,y) = base of the candle, s = candle height in px (flame adds ~0.6s).
function candle(x, y, s = 120, t = 0, opts = {}) {
  const ph = (x * .37 + y * .11) % 6.28, fl = .5 + .5 * Math.sin(t * 11 + ph) * Math.sin(t * 5.3 + ph * 2) + .18 * Math.sin(t * 23 + ph * 3);
  const k = 1 + .10 * fl, lean = 5 * Math.sin(t * 3.1 + ph), w = s * .2, fh = s * .55 * k, ty = y - s;
  const halo = opts.halo === false ? '' : screen(G(x, ty - fh * .5, s * (2.6 + .25 * fl), '#ffb040', .55 + .08 * fl) + G(x, ty - fh * .5, s * (.85 + .08 * fl), '#fff0c0', .8));
  const stick = opts.stick === false ? '' : `<path d="M${f(x - w / 2)} ${f(y)} V${f(ty + 4)} q${f(w / 2)} ${f(-w * .35)} ${f(w)} 0 V${f(y)}Z" fill="#f6e6c4" stroke="#120d0f" stroke-width="${f(Math.max(3, s * .04))}" stroke-linejoin="round"/><path d="M${f(x + w * .12)} ${f(y)} V${f(ty + 2)} h${f(w * .38)} V${f(y)}Z" fill="#c98a5a" opacity=".7"/>`;
  const flame = `<g transform="translate(${f(x)} ${f(ty)}) rotate(${f(lean)})"><path d="M0 ${f(-fh)} C${f(w * .9)} ${f(-fh * .45)} ${f(w * .75)} 0 0 0 C${f(-w * .75)} 0 ${f(-w * .9)} ${f(-fh * .45)} 0 ${f(-fh)}Z" fill="#ffb238"/><path d="M0 ${f(-fh * .7)} C${f(w * .5)} ${f(-fh * .3)} ${f(w * .4)} ${f(-2)} 0 ${f(-2)} C${f(-w * .4)} ${f(-2)} ${f(-w * .5)} ${f(-fh * .3)} 0 ${f(-fh * .7)}Z" fill="#fff6d0"/></g>`;
  return halo + stick + flame;
}
// Out-of-focus discs drifting slowly. opts: count(16) colors[] area[x,y,w,h] rMin rMax opacity(.3) drift(12) blend(true = additive, costs one full-frame pass)
function bokeh(seed = 1, t = 0, opts = {}) {
  const { count = 16, colors = ['#ffbf5e', '#fff0c0', '#ff8a3a'], area = [0, 0, 1080, 1920], rMin = 14, rMax = 64, opacity = 0.3, drift = 12, blend = false } = opts;
  const r = rng(seed * 101 + 3), gs = colors.map(c => radial([[0, c, .55], [.72, c, .6], [.9, c, 1], [1, c, 0]]));
  let o = '';
  for (let i = 0; i < count; i++) {
    const bx = area[0] + r() * area[2], by = area[1] + r() * area[3], rad = rMin + Math.pow(r(), 1.7) * (rMax - rMin), p = r() * 6.28, sp = .25 + r() * .5;
    const x = bx + Math.sin(t * sp + p) * drift * 2, y = by - ((t * drift * sp) % 40) + Math.cos(t * sp * .7 + p) * drift;
    const op = opacity * (.45 + .55 * r()) * (.75 + .25 * Math.sin(t * (1 + sp * 2) + p));
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rad)}" fill="url(#${gs[i % gs.length].id})" opacity="${f(op * 1000) / 1000}"/>`;
  }
  return `<defs>${gs.map(g => g.def).join('')}</defs><g ${blend ? SCREEN : ''}>${o}</g>`;
}
// Fine drifting motes / embers. opts: count(46) color opacity(.5) area rise(px/s, positive = upward) size(3.2)
function dust(seed = 1, t = 0, opts = {}) {
  const { count = 46, color = '#ffe2a0', opacity = 0.5, area = [0, 0, 1080, 1920], rise = 14, size = 3.2 } = opts;
  const r = rng(seed * 59 + 11); let o = '';
  for (let i = 0; i < count; i++) {
    const p = r() * 6.28, sp = .4 + r(), sz = size * (.4 + r() * 1.1), bx = area[0] + r() * area[2], by0 = r() * area[3];
    const y = area[1] + (((by0 - t * rise * sp) % area[3]) + area[3]) % area[3], x = bx + Math.sin(t * sp * .8 + p) * 22;
    const op = opacity * (.3 + .7 * r()) * (.6 + .4 * Math.sin(t * 2.2 * sp + p));
    o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(sz)}" fill="${color}" opacity="${f(op * 1000) / 1000}"/>`;
  }
  return `<g>${o}</g>`;
}
// Contact shadow under feet / props: soft dark core + optional hard cast shadow thrown AWAY from the key (down-right).
// (x,y) = contact point, w = object width. opts: mood, turn, cast (length px, 0 = none), opacity(.6)
function floorShadow(x, y, w, opts = {}) {
  const P = palette(opts.mood || 'gala', opts.turn), { cast = 0, opacity = 0.6 } = opts;
  const g = radial([[0, P.shadow, 1], [.55, P.shadow, .75], [1, P.shadow, 0]]);
  let o = `<defs>${g.def}</defs>`;
  if (cast) o += `<path d="M${f(x - w * .42)} ${f(y)} L${f(x + w * .42)} ${f(y)} L${f(x + w * .55 + cast)} ${f(y + cast * .34)} L${f(x - w * .1 + cast)} ${f(y + cast * .34)}Z" fill="${P.shadow}" opacity="${f(opacity * .62 * 100) / 100}"/>`;
  return o + `<ellipse cx="${f(x + w * .04)}" cy="${f(y)}" rx="${f(w * .62)}" ry="${f(Math.max(8, w * .11))}" fill="url(#${g.id})" opacity="${opacity}"/>`;
}

// ---------------------------------------------------------------- cel lighting for forms (filters; work on any SVG)
function celFilter(P, o) {
  const { depth = 60, rim = 9, key = 5, shadow = true, rimOn = true, shadowOpacity = 0.85 } = o;
  const id = 'gsl-cel' + hash([P.shadowMul, P.rim, P.key, depth, rim, key, shadow, rimOn, shadowOpacity].join());
  let s = `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">`, last = 'SourceGraphic';
  if (shadow) { s += `<feOffset in="SourceAlpha" dx="${-depth}" dy="${f(-depth * .55)}" result="o1"/><feComposite in="SourceAlpha" in2="o1" operator="out" result="sa"/><feFlood flood-color="${P.shadowMul}" flood-opacity="${shadowOpacity}"/><feComposite in2="sa" operator="in" result="sh"/><feBlend in="sh" in2="SourceGraphic" mode="multiply" result="g1"/><feComposite in="g1" in2="SourceAlpha" operator="in" result="g1"/>`; last = 'g1'; }
  let merge = `<feMergeNode in="${last}"/>`;
  if (key > 0) { s += `<feOffset in="SourceAlpha" dx="${key}" dy="${key}" result="o3"/><feComposite in="SourceAlpha" in2="o3" operator="out" result="ka"/><feFlood flood-color="${P.key}" flood-opacity=".5"/><feComposite in2="ka" operator="in" result="kl"/>`; merge += `<feMergeNode in="kl"/>`; }
  if (rimOn && rim > 0) { s += `<feOffset in="SourceAlpha" dx="${-rim}" dy="${f(rim * .25)}" result="o2"/><feComposite in="SourceAlpha" in2="o2" operator="out" result="ra"/><feFlood flood-color="${P.rim}" flood-opacity=".95"/><feComposite in2="ra" operator="in" result="rl"/>`; merge += `<feMergeNode in="rl"/>`; }
  return { id, def: s + `<feMerge>${merge}</feMerge></filter>` };
}
// Full cel lighting on any group: hard coloured shadow on the side away from the key + warm key edge + cool rim edge.
// opts: turn, depth (px, how much of the form the key side keeps lit, ~25-35% of its width), rim (px), key (px)
function lit(svg, mood = 'gala', opts = {}) { const F = celFilter(palette(mood, opts.turn), opts); return `<defs>${F.def}</defs><g filter="url(#${F.id})">${svg}</g>`; }
// Rim + key edge only (for characters that already draw their own shadow shapes).
function rimLight(svg, mood = 'gala', opts = {}) { return lit(svg, mood, { ...opts, shadow: false }); }
// Hard shadow only (sets, props).
function celShadow(svg, mood = 'gala', opts = {}) { return lit(svg, mood, { ...opts, rimOn: false, key: 0 }); }

// ---------------------------------------------------------------- rooms & skies
const stars = (seed, n, area, t, col = '#dff2ff') => { const r = rng(seed); let o = ''; for (let i = 0; i < n; i++) { const x = area[0] + r() * area[2], y = area[1] + r() * area[3], s = .8 + Math.pow(r(), 3) * 3.2, p = r() * 6.28; o += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s)}" fill="${col}" opacity="${f((.45 + .5 * r()) * (.8 + .2 * Math.sin(t * 2 + p)) * 100) / 100}"/>`; } return o; };
const vgrad = (cols, y0, y1) => linear(cols.map((c, i) => [f(i / (cols.length - 1) * 100) / 100, c]), `gradientUnits="userSpaceOnUse" x1="0" y1="${y0}" x2="0" y2="${y1}"`);
const X0 = -420, XW = 1920; // horizontal bleed so the camera can drift
// one blur pass for a room's far layers, with the filter region clamped to the frame band y0..y1 (cost ~ region area)
const roomBlur = (svg, y0, y1, sd = 3.2) => { const id = 'gsl-rb' + hash([y0, y1, sd].join()); return `<defs><filter id="${id}" filterUnits="userSpaceOnUse" x="-60" y="${f(y0)}" width="1200" height="${f(y1 - y0)}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${sd}"/></filter></defs><g filter="url(#${id})">${svg}</g>`; };

function gala(t, o) {
  const P = MOODS.gala, FY = o.floorY || 1260, par = o.par || 0, INK = '#0b052c';
  const [chx, chy, chs] = o.chandelier || [290, 205, 1.3], cx = chx + par * .8;
  const wall = vgrad(P.bg, 0, FY), sky = vgrad(['#0c1560', '#1b40b0', '#3d96ee', '#9be8ff'], 300, FY - 150), fl = vgrad(P.floor, FY, 1920);
  const warmth = x => cl(Math.max(1 - Math.abs(x - chx) / 720, .7 * (1 - Math.abs(x - 900) / 520)), .12, 1); // light falls off away from the chandeliers
  const pil = w => linear([[0, mix('#3a2590', '#ffb04e', w)], [.3, mix('#30208a', '#ee6a34', w)], [.3, '#24157a'], [.88, '#190e5c'], [.88, '#56b4ff'], [1, '#56b4ff']], 'x1="0" y1="0" x2="1" y2="0"');
  let pdefs = '';
  let far = `<rect x="${X0}" y="-300" width="${XW}" height="${FY + 300}" fill="url(#${wall.id})"/>`;
  // tall arched windows: Luna night (stars, Earth, city towers), the cold shapes of the frame
  const winX = [-140, 220, 580, 940, 1300], ww = 216, wt = 380, wb = FY - 150, rs = rng(17);
  winX.forEach((wx0, i) => {
    const wx = wx0 + par * .5, d = `M${f(wx)} ${wb} V${wt + 110} q${ww / 2} -170 ${ww} 0 V${wb}Z`;
    far += `<path d="${d}" fill="url(#${sky.id})"/>` + stars(40 + i, 14, [wx + 12, wt + 20, ww - 24, 380], t)
      + (i === 2 ? `<circle cx="${f(wx + 128)}" cy="${wt + 190}" r="46" fill="#c8f4ff"/><circle cx="${f(wx + 146)}" cy="${wt + 177}" r="42" fill="#1b40b0"/>` : '');
    for (let k = 0, x = wx + 8; x < wx + ww - 30; k++) { const w = 22 + rs() * 34, h = 60 + rs() * 230; far += `<rect x="${f(x)}" y="${f(wb - h)}" width="${f(Math.min(w, wx + ww - 8 - x))}" height="${f(h)}" fill="${k % 2 ? '#1a3aa6' : '#142a86'}"/><rect x="${f(x + 6)}" y="${f(wb - h + 14 + rs() * 30)}" width="5" height="9" fill="#ffd98a"/>`; x += w + 4; }
    far += `<path d="M${f(wx + ww / 2)} ${wt + 28} V${wb} M${f(wx)} ${wt + 330} h${ww} M${f(wx)} ${wt + 590} h${ww}" stroke="${INK}" stroke-width="9" fill="none"/>`
      + `<path d="${d}" fill="none" stroke="${INK}" stroke-width="18"/><path d="M${f(wx - 10)} ${wb} V${wt + 110} q${ww * .3} -118 ${ww * .5 + 10} -96" fill="none" stroke="${P.key}" stroke-width="7"/>`;
  });
  // pillars between windows: warm slab on the key side, dark core, cool sliver on the rim side. Banners hang high.
  winX.forEach((wx0, i) => {
    const px = wx0 + par * .5 - 137, pw = 130, bc = [P.accent, '#ff6f5e', '#8a1230'], w = warmth(wx0 - 72), pl = pil(f(w * 10) / 10); pdefs += pl.def;
    far += `<rect x="${f(px)}" y="-300" width="${pw}" height="${FY + 300}" fill="url(#${pl.id})"/><rect x="${f(px - 16)}" y="${FY - 100}" width="${pw + 32}" height="100" fill="#190e5c"/><rect x="${f(px - 16)}" y="${FY - 100}" width="48" height="100" fill="${mix('#30208a', '#ee6a34', w)}"/><rect x="${f(px - 16)}" y="${FY - 100}" width="${pw + 32}" height="12" fill="${mix('#6a4ad0', P.key, w)}"/>`
      + (i % 2 ? '' : `<path d="M${f(px + 14)} 40 h102 v500 l-51 -60 l-51 60z" fill="${bc[0]}"/><path d="M${f(px + 14)} 40 h36 v464 l-36 36z" fill="${bc[1]}"/><path d="M${f(px + 88)} 40 h28 v500 l-28 -32z" fill="${bc[2]}"/><path d="M${f(px + 14)} 40 h102 v24 h-102z" fill="${P.key}"/><path d="M${f(px + 65)} 232 l26 42 l-26 42 l-26 -42z" fill="${P.key}"/>`);
  });
  // far crowd: lighter-violet atmospheric silhouettes, warm on the key side
  let crowd = ''; const r = rng(9);
  if (o.crowd !== false) for (let i = 0; i < 13; i++) { const x = X0 + 60 + i * 148 + r() * 60 + par * .7, h = 250 + r() * 70, c = ['#4733a6', '#5a40b6', '#3b2994'][i % 3], y = FY + 16; crowd += `<path d="M${f(x - 52)} ${y} q-8 ${f(-h * .62)} 52 ${f(-h * .7)} q60 ${f(h * .08)} 52 ${f(h * .7)}z" fill="${c}"/><circle cx="${f(x)}" cy="${f(y - h * .82)}" r="31" fill="${c}"/><path d="M${f(x - 30)} ${f(y - h * .86)} a31 31 0 0 1 36 -26 a40 40 0 0 0 -36 26z" fill="${P.key}"/><path d="M${f(x - 50)} ${y} q-6 ${f(-h * .6)} 40 ${f(-h * .69)} q-26 ${f(h * .2)} -22 ${f(h * .69)}z" fill="#e8743c" opacity=".8"/>`; }
  // polished floor: cool window reflections, warm pool under the chandelier, perspective joints
  let floor = `<rect x="${X0}" y="${FY}" width="${XW}" height="${1920 - FY + 300}" fill="url(#${fl.id})"/>`;
  const refl = linear([[0, '#7fe0ff', .5], [1, '#7fe0ff', 0]]);
  winX.forEach(wx0 => { const wx = wx0 + par * .5; floor += `<path d="M${f(wx + 20)} ${FY} h${ww - 40} l${-60} 400 h${-(ww - 40) - 80}z" fill="url(#${refl.id})"/>`; });
  for (let i = -9; i <= 9; i++) floor += `<path d="M${f(540 + i * 95 + par * .5)} ${FY} L${f(540 + i * 420 + par)} 2000" stroke="#8a66f0" stroke-width="3" opacity=".3"/>`;
  [40, 110, 220, 390, 640].forEach(d => floor += `<path d="M${X0} ${FY + d} h${XW}" stroke="#8a66f0" stroke-width="${f(2 + d / 160)}" opacity=".26"/>`);
  floor += `<rect x="${X0}" y="${FY - 5}" width="${XW}" height="10" fill="${P.key}" opacity=".8"/>`;
  // chandelier = the practical key source (upper-left by default; move with opts.chandelier [x,y,scale])
  const chand = (x, y, s) => { let c = `<path d="M${x} -60 V${f(y - 120 * s)}" stroke="${INK}" stroke-width="${f(8 * s)}"/><path d="M${x} ${f(y - 128 * s)} l${f(-22 * s)} ${f(36 * s)} l${f(22 * s)} ${f(30 * s)} l${f(22 * s)} ${f(-30 * s)}z" fill="#b5651a"/>`;
    [[62, -88, 5], [112, -46, 7], [160, 0, 10]].forEach(([rx, dy, n]) => { const ry = rx * .22 * s, yy = y + dy * s;
      c += `<ellipse cx="${x}" cy="${f(yy)}" rx="${f(rx * s)}" ry="${f(ry)}" fill="none" stroke="#8a4a12" stroke-width="${f(15 * s)}"/><path d="M${f(x - rx * s)} ${f(yy)} a${f(rx * s)} ${f(ry)} 0 0 0 ${f(rx * 2 * s)} 0" fill="none" stroke="${P.key}" stroke-width="${f(15 * s)}"/><path d="M${f(x - rx * s)} ${f(yy)} a${f(rx * s)} ${f(ry)} 0 0 0 ${f(rx * .9 * s)} ${f(ry * .98)}" fill="none" stroke="${P.hot}" stroke-width="${f(7 * s)}"/>`;
      for (let i = 0; i < n; i++) { const a = i / n * 6.283 + .3 + dy; c += candle(x + Math.cos(a) * rx * s, yy + Math.sin(a) * ry - 5 * s, 30 * s, t + i * 1.7, { halo: false }); } });
    return c + `<path d="M${x} ${f(y + 30 * s)} l${f(-17 * s)} ${f(34 * s)} l${f(17 * s)} ${f(44 * s)} l${f(17 * s)} ${f(-44 * s)}z" fill="${P.hot}"/>`; };
  const fk = 1 + .03 * Math.sin(t * 9) * Math.sin(t * 4.1), c2x = f(900 + par * .6);
  const moon = lightShafts(1250 + par * .5, 470, 152, t, { count: 4, spread: 20, length: 1500, width: 120, color: '#8fdcff', opacity: .15, seed: 4, blend: false });
  // painted (alpha) orange pools first so the warm areas stay saturated, then one additive layer for the hot cores
  const lights = G(cx, chy - 30, 760 * fk, '#f2601c', .62) + G(c2x, 130, 360, '#f2601c', .5) + G(cx + 60, FY + 230, 620, '#f2601c', .5, { squash: .32 })
    + screen(moon + G(cx, chy - 30, 520 * fk, '#ffae3c', .7) + G(cx, chy - 40, 200 * chs, P.hot, .85) + G(c2x, 140, 200, '#ffae3c', .7))
    + chand(f(cx), chy, chs) + chand(c2x, 150, chs * .42);
  // moonlight slanting in from the windows on the right (the rim source)
  return `<defs>${wall.def}${sky.def}${fl.def}${pdefs}${refl.def}</defs>` + (o.blur === false ? far + crowd : roomBlur(far + crowd, -40, FY + 60)) + floor + lights;
}

function space(t, o) {
  const P = MOODS.space, par = o.par || 0, g = vgrad(P.bg, 0, 1920);
  let s = `<defs>${g.def}</defs><rect x="${X0}" y="-300" width="${XW}" height="2520" fill="url(#${g.id})"/>`;
  s += screen(G(160 + par * .2, 520, 900, '#ff4f8a', .34) + G(940 + par * .2, 300, 760, '#2fd0ff', .3) + G(520 + par * .2, 1050, 800, '#6a3aff', .32) + G(60 + par * .2, 240, 420, '#ffa040', .42));
  s += stars(3, 150, [X0, -100, XW, 1700], t) + stars(8, 30, [X0, -100, XW, 1700], t, '#ffd9a0');
  // planet limb (Mars from orbit) lit from upper-left, with a cyan atmosphere line
  const pg = radial([[0, '#ff9a4a'], [.5, '#d2472a'], [.8, '#6a1626'], [1, '#2a0a2a']], 'gradientUnits="userSpaceOnUse" cx="420" cy="1560" r="1250" fx="300" fy="1420"');
  s += `<defs>${pg.def}</defs><circle cx="${f(900 + par * .35)}" cy="2628" r="1240" fill="${P.rim}" opacity=".55"/><circle cx="${f(900 + par * .35)}" cy="2640" r="1240" fill="url(#${pg.id})"/><path d="M${f(-300 + par * .35)} 2250 q500 -640 1300 -830" stroke="#ffd9a0" stroke-width="7" fill="none" opacity=".85"/>`;
  // fleet: far silhouettes with engine glows, crossing fire, bursts
  const r = rng(21); let ships = '', fx = '';
  for (let i = 0; i < 9; i++) { const x = X0 + 200 + r() * 1500 + par * .5 + t * (6 + i), y = 260 + r() * 1050, sc = .35 + r() * .8, dir = i % 2 ? -1 : 1, c = i % 3 ? '#0a1140' : '#1c2a78';
    ships += `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc * dir * 100) / 100} ${f(sc * 100) / 100})"><path d="M-150 0 L-60 -34 L90 -26 L170 -4 L90 22 L-70 30Z" fill="${c}"/><path d="M-150 0 L-60 -34 L90 -26 L170 -4 L40 -10Z" fill="${dir > 0 ? '#ff9a5a' : '#3f6fe0'}" opacity=".85"/><path d="M-20 -30 l14 -32 h44 l10 34z" fill="${c}"/><circle cx="-156" cy="0" r="13" fill="#bff4ff"/></g>` ;
    fx += G(x - 156 * sc * dir, y, 70 * sc, P.rim, .8); }
  for (let i = 0; i < 9; i++) { const x1 = X0 + r() * XW, y1 = 200 + r() * 1200, a = (r() - .5) * 1.2 + (i % 2 ? Math.PI : 0), L = 260 + r() * 420, on = Math.sin(t * (5 + i) + i * 2.1) > -.2, c = i % 2 ? P.accent : P.rim;
    if (on) fx += `<path d="M${f(x1)} ${f(y1)} l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}" stroke="${c}" stroke-width="9" stroke-linecap="round" opacity=".9"/><path d="M${f(x1)} ${f(y1)} l${f(Math.cos(a) * L)} ${f(Math.sin(a) * L)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`; }
  [[250, 760, 150], [840, 560, 100], [600, 1130, 80]].forEach(([x, y, rad], i) => { const k = .7 + .3 * Math.sin(t * 6 + i * 2); fx += G(x + par * .5, y, rad * 3.2 * k, '#ff7a2a', .75) + G(x + par * .5, y, rad * k, '#fff0c0', .95) + `<path d="M${f(x + par * .5)} ${f(y - rad * .9 * k)} l${f(rad * .22)} ${f(rad * .6 * k)} l${f(rad * .7 * k)} ${f(rad * .3)} l${f(-rad * .7 * k)} ${f(rad * .25)} l${f(-rad * .22)} ${f(rad * .7 * k)} l${f(-rad * .22)} ${f(-rad * .7 * k)} l${f(-rad * .7 * k)} ${f(-rad * .25)} l${f(rad * .7 * k)} ${f(-rad * .3)}z" fill="#fff6d8"/>`; });
  s += (o.blur === false ? ships : roomBlur(ships, 120, 1500, 2.6)) + `<g ${SCREEN}>${fx}</g>`;
  if (o.deck) { const FY = o.floorY || 1300, d = vgrad(P.floor, FY, 1920); // bridge: viewport struts + deck
    s += `<defs>${d.def}</defs><path d="M${X0} -300 H${X0 + XW} V${FY} H${X0}Z M70 150 H1010 L1040 ${FY - 110} H40Z" fill="#070a2a" fill-rule="evenodd"/><path d="M70 150 H1010 L1040 ${FY - 110} H40Z" fill="none" stroke="#2c48b8" stroke-width="10"/><path d="M40 ${FY - 110} L70 150 H400" fill="none" stroke="${P.key}" stroke-width="6" opacity=".8"/><path d="M360 150 L330 ${FY - 110} M720 150 L750 ${FY - 110}" stroke="#070a2a" stroke-width="30"/>`
      + `<rect x="${X0}" y="${FY}" width="${XW}" height="900" fill="url(#${d.id})"/><rect x="${X0}" y="${FY - 4}" width="${XW}" height="8" fill="${P.rim}" opacity=".8"/>` + G(540, FY + 40, 760, P.rim, .3, { squash: .3 }) + G(200, FY + 220, 520, P.key, .3, { squash: .35 });
    for (let i = -6; i <= 6; i++) s += `<path d="M${540 + i * 120} ${FY} L${540 + i * 520} 2000" stroke="#3f6fe0" stroke-width="3" opacity=".35"/>`; }
  return s;
}

function mesas(seed, y, hMin, hMax, col, topCol, par) { const r = rng(seed); let d = `M${X0} ${y + 400} V${y}`, tops = '', x = X0; while (x < X0 + XW) { const w = 90 + r() * 260, h = r() < .3 ? 0 : hMin + r() * (hMax - hMin), sl = 14 + r() * 30; d += ` L${f(x + sl + par)} ${f(y - h)} H${f(x + w - sl + par)} L${f(x + w + par)} ${y}`; if (h) tops += `<path d="M${f(x + sl + par)} ${f(y - h)} H${f(x + w - sl + par)}" stroke="${topCol}" stroke-width="7"/><path d="M${f(x + par)} ${y} L${f(x + sl + par)} ${f(y - h)} h${f(w * .22)} L${f(x + w * .16 + par)} ${y}z" fill="${topCol}" opacity=".55"/>`; x += w + r() * 60; } return `<path d="${d} V${y + 400}Z" fill="${col}"/>` + tops; }
function mars(t, o) {
  const P = MOODS.mars, FY = o.floorY || 1260, par = o.par || 0, g = vgrad(P.bg, -100, FY), fl = vgrad(P.floor, FY, 1920), sx = (o.sunX == null ? 250 : o.sunX) + par * .1, sy = FY - (o.sunH == null ? 300 : o.sunH);
  let s = `<defs>${g.def}${fl.def}</defs><rect x="${X0}" y="-300" width="${XW}" height="${FY + 300}" fill="url(#${g.id})"/>`;
  s += screen(G(sx, sy, 1000, '#ffd060', .75)) + `<circle cx="${f(sx)}" cy="${sy}" r="210" fill="#ffe9a0"/><circle cx="${f(sx)}" cy="${sy}" r="170" fill="#fff8de"/>`;
  // graphic cloud bars: dark plum up high, hot pink-orange near the sun
  const r = rng(5); let cl2 = '';
  for (let i = 0; i < 12; i++) { const y = 140 + i * 78 + r() * 30, w = 300 + r() * 620, x = X0 + r() * XW + par * .2 + t * (3 + i % 3), k = y / (FY - 200), c = mix('#8a2a90', '#ff5a4a', k), h = 18 + r() * 28; cl2 += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${f(h / 2)}" fill="${c}" opacity="${f((.55 + .3 * k) * 100) / 100}"/><rect x="${f(x + w * .1)}" y="${f(y + h - 6)}" width="${f(w * .6)}" height="6" rx="3" fill="#ffc46a" opacity="${f(k * .9 * 100) / 100}"/>`; }
  s += cl2;
  const far = mesas(31, FY - 60, 90, 260, '#e0562c', '#ffb060', par * .3) + `<path d="M${f(760 + par * .3)} ${FY - 60} v-420 l26 -70 l26 70 v130 h40 v-250 l30 -90 l30 90 v540z" fill="#d04a2a"/><path d="M${f(760 + par * .3)} ${FY - 60} v-420 l26 -70 v490z M${f(852 + par * .3)} ${FY - 60} v-540 l30 -90 v630z" fill="#ffb060" opacity=".8"/>`;
  const mid = mesas(47, FY + 10, 70, 210, '#7a1f2c', '#ff8a3a', par * .6);
  s += (o.blur === false ? far : roomBlur(far, FY - 760, FY + 40, 3.6)) + G(540, FY - 40, 900, '#ff7a3a', .4, { squash: .22 }) + mid;
  s += `<rect x="${X0}" y="${FY}" width="${XW}" height="900" fill="url(#${fl.id})"/>` + G(sx, FY + 30, 800, '#ffb050', .6, { squash: .2 });
  const r2 = rng(12); for (let i = 0; i < 16; i++) { const y = FY + 30 + Math.pow(r2(), 1.5) * 620, w = 120 + r2() * 420, x = X0 + r2() * XW + par; s += `<path d="M${f(x)} ${f(y)} h${f(w)} l${f(w * .2)} ${f(8 + (y - FY) / 30)} h${f(-w * 1.1)}z" fill="${i % 3 ? '#4a1226' : '#c8452a'}" opacity=".6"/>`; }
  return s + `<rect x="${X0}" y="${FY - 4}" width="${XW}" height="8" fill="#ffb060" opacity=".7"/>`;
}

function mine(t, o) {
  const P = MOODS.mine, FY = o.floorY || 1260, par = o.par || 0, g = vgrad(P.bg, 0, 1920), mx = 610 + par * .3, my = FY - 330;
  let s = `<defs>${g.def}</defs><rect x="${X0}" y="-300" width="${XW}" height="2520" fill="url(#${g.id})"/>`;
  s += screen(G(mx, my, 760, '#ff4a1a', .8) + G(mx, my, 300, '#ffb040', .9)) + `<ellipse cx="${f(mx)}" cy="${my}" rx="120" ry="170" fill="#ffd27a"/>`;
  // rock arches receding into the tunnel: each ring darker and bigger (hole cut with evenodd)
  const ring = (seed, rx, ry, col, edge, p) => { const r = rng(seed), n = 18; let d = ''; for (let i = 0; i < n; i++) { const a = i / n * 6.283, k = .86 + r() * .28; d += `${i ? 'L' : 'M'}${f(mx + p + Math.cos(a) * rx * k)} ${f(my + 80 + Math.sin(a) * ry * k)} `; } return `<path d="M${X0} -300 H${X0 + XW} V2220 H${X0}Z ${d}Z" fill="${col}" fill-rule="evenodd"/><path d="${d}Z" fill="none" stroke="${edge}" stroke-width="7" opacity=".8"/>`; };
  const r1 = ring(3, 250, 330, '#6a1c10', '#ffa040', 0), r2 = ring(8, 430, 560, '#3a0f12', '#e0541c', par * .3), r3 = ring(14, 690, 880, '#1a070c', '#8a2812', par * .7);
  s += (o.blur === false ? r1 + r2 : roomBlur(r1 + r2, -40, 1960, 3)) + r3;
  // floor + rails running to the mouth, timber frame, hanging lamp (key, upper-left)
  const fl = vgrad(['#4a160e', '#0c0508'], FY, 1920);
  s += `<defs>${fl.def}</defs><path d="M${X0} ${FY} H${X0 + XW} V2220 H${X0}Z" fill="url(#${fl.id})"/>` + G(mx, FY + 20, 700, '#ff5a1a', .6, { squash: .28 });
  s += `<path d="M${f(mx - 40)} ${FY} L${f(120 + par)} 2000 M${f(mx + 40)} ${FY} L${f(1060 + par)} 2000" stroke="#0a0408" stroke-width="20"/><path d="M${f(mx - 46)} ${FY} L${f(104 + par)} 2000 M${f(mx + 34)} ${FY} L${f(1044 + par)} 2000" stroke="#ff8a3a" stroke-width="5" opacity=".9"/>`;
  [60, 160, 320, 560].forEach(d => { const k = d / 700; s += `<rect x="${f(mx - 70 - k * 560 + par * k)}" y="${FY + d}" width="${f(140 + k * 1120)}" height="${f(10 + k * 30)}" fill="#12060a"/><rect x="${f(mx - 70 - k * 560 + par * k)}" y="${FY + d}" width="${f(140 + k * 1120)}" height="4" fill="#c2461c" opacity=".7"/>`; });
  const lx = 190 + par * .8, sw = Math.sin(t * 1.3) * 3;
  s += `<path d="M${f(-60 + par)} -300 V${FY + 40} h90 V-300z M${f(1040 + par)} -300 V${FY + 40} h90 V-300z M${f(-120 + par)} 60 h1320 v86 h-1320z" fill="#0c0508"/><path d="M${f(30 + par)} 146 V${FY + 40} h-14 V146z M${f(-120 + par)} 146 h1320 v-9 h-1320z" fill="#ff7a2a" opacity=".85"/><path d="M${f(1040 + par)} 146 V${FY + 40} h10 V146z" fill="${P.rim}" opacity=".7"/>`;
  s += screen(lightShafts(lx, 330, 78, t, { count: 3, spread: 46, length: 1200, width: 90, color: '#ff9a3a', opacity: .3, seed: 2, blend: false }) + G(lx, 330, 520, '#ff7a2a', .8) + G(lx, 330, 130, P.hot, 1))
    + `<g transform="rotate(${f(sw)} ${f(lx)} 146)"><path d="M${f(lx)} 146 V270" stroke="#0c0508" stroke-width="6"/><path d="M${f(lx - 46)} 300 l20 -40 h52 l20 40z" fill="#0c0508"/><path d="M${f(lx - 34)} 300 h68 l-10 62 h-48z" fill="${P.hot}"/><path d="M${f(lx - 34)} 300 h68 l-10 62 h-48z" fill="none" stroke="#0c0508" stroke-width="6"/></g>`;
  return s + dust(31, t, { count: 40, color: '#ffb040', opacity: .9, rise: 60, size: 4, area: [0, 300, 1080, 1500] });
}

function triumph(t, o) {
  const T = cl(o.turn || 0), P = palette('triumph', T), FY = o.floorY || 1260, par = o.par || 0, L = (a, b) => mix(a, b, T);
  const g = vgrad(P.bg, -100, FY), fl = vgrad(P.floor, FY, 1920), cx = 540 + par * .3, cy = 560;
  let s = `<defs>${g.def}${fl.def}</defs><rect x="${X0}" y="-300" width="${XW}" height="${FY + 300}" fill="url(#${g.id})"/>`;
  // radiant sun-disc behind the high table: gold glory that curdles into a blood moon
  let rays = ''; for (let i = 0; i < 24; i++) rays += `<path transform="rotate(${f(i * 15 + t * 2)} ${f(cx)} ${cy})" d="M${f(cx - 26)} ${cy - 330} L${f(cx)} ${cy - (i % 2 ? 620 : 900)} L${f(cx + 26)} ${cy - 330}Z" fill="${L('#ffe9a0', '#ff3a2a')}" opacity="${i % 2 ? .5 : .32}"/>`;
  s += screen(G(cx, cy, 1100, L('#ffd060', '#ff1a1a'), .8) + rays) + `<circle cx="${f(cx)}" cy="${cy}" r="310" fill="${L('#fff3c0', '#e01a1a')}"/><circle cx="${f(cx)}" cy="${cy}" r="310" fill="none" stroke="${L('#c97a14', '#3a0408')}" stroke-width="26"/><circle cx="${f(cx)}" cy="${cy}" r="250" fill="none" stroke="${L('#ffd060', '#7a0a10')}" stroke-width="10"/>`;
  // columns (warm slab left, dark core, rim sliver) and swagged drapes
  const col = linear([[0, L('#ffe08a', '#ff5a36')], [.28, L('#f0a030', '#c0202a')], [.28, L('#8a3c0c', '#3a060c')], [.88, L('#6a2a08', '#240408')], [.88, P.rim], [1, P.rim]], 'x1="0" y1="0" x2="1" y2="0"');
  let cols = `<defs>${col.def}</defs>`;
  [-210, 60, 880, 1150].forEach(x0 => { const x = x0 + par * .6; cols += `<rect x="${f(x)}" y="-300" width="140" height="${FY + 300}" fill="url(#${col.id})"/><rect x="${f(x - 22)}" y="${FY - 110}" width="184" height="110" fill="${L('#6a2a08', '#240408')}"/><rect x="${f(x - 22)}" y="${FY - 110}" width="56" height="110" fill="${L('#f0a030', '#c0202a')}"/><rect x="${f(x - 22)}" y="${FY - 110}" width="184" height="12" fill="${P.key}"/>`; });
  const dr = L('#c81e28', '#5a060e'), drL = L('#ff5a4a', '#b0141c'), drD = L('#7a0c18', '#1c0206');
  let drape = ''; for (let i = -1; i < 4; i++) { const x = i * 360 - 60 + par * .8; drape += `<path d="M${f(x)} -300 V150 q180 250 360 0 V-300z" fill="${dr}"/><path d="M${f(x)} -300 V150 q90 125 150 150 q-70 -120 -60 -450z" fill="${drL}"/><path d="M${f(x + 250)} -300 q20 330 -50 590 q100 -40 160 -140 V-300z" fill="${drD}"/><path d="M${f(x)} 150 q180 250 360 0" fill="none" stroke="${P.key}" stroke-width="12"/><circle cx="${f(x)}" cy="150" r="26" fill="${P.key}"/>`; }
  s += (o.blur === false ? cols : roomBlur(cols, -40, FY + 40, 2.6)) + drape;
  s += `<rect x="${X0}" y="${FY}" width="${XW}" height="900" fill="url(#${fl.id})"/>` + G(cx, FY + 60, 820, L('#ffd060', '#ff1a1a'), .55, { squash: .3 });
  for (let i = -8; i <= 8; i++) s += `<path d="M${f(540 + i * 100 + par * .5)} ${FY} L${f(540 + i * 440 + par)} 2000" stroke="${L('#ffc050', '#c0202a')}" stroke-width="3" opacity=".3"/>`;
  [50, 130, 260, 450].forEach(d => s += `<path d="M${X0} ${FY + d} h${XW}" stroke="${L('#ffc050', '#c0202a')}" stroke-width="3" opacity=".25"/>`);
  return s + `<rect x="${X0}" y="${FY - 5}" width="${XW}" height="10" fill="${P.key}" opacity=".8"/>` + G(140 + par, 200, 700, P.key, .35 * (1 - T * .6));
}

function voidRoom(t, o) {
  const P = MOODS.void, FY = o.floorY || 1260, g = vgrad(P.bg, 0, 1920);
  let s = `<defs>${g.def}</defs><rect x="${X0}" y="-300" width="${XW}" height="2520" fill="url(#${g.id})"/>`;
  s += G(540, FY, 900, '#8a0c16', .5, { squash: .16 }) + `<rect x="${X0}" y="${FY - 2}" width="${XW}" height="4" fill="${P.accent}" opacity=".55"/>`;
  s += screen(lightShafts(160, -80, 62, t, { count: 2, spread: 12, length: 1900, width: 150, color: '#aebfe6', opacity: .13, seed: 6, blend: false }) + G(430, FY + 80, 420, '#aebfe6', .16, { squash: .3 }));
  return s + dust(5, t, { count: 26, color: '#c4d0e8', opacity: .35, rise: 6, size: 2.6 });
}

const ROOMS = { gala, space, mars, mine, triumph, void: voidRoom };
// Background for a mood. opts: par (parallax px, mid/far layers slide less than fg), floorY (horizon/floor line, 1260),
// blur (false = no depth-of-field on far layers), turn (triumph only: 0 gold feast -> 1 blood red), deck (space: bridge), crowd (gala)
function skyOrRoom(mood, t = 0, opts = {}) { return `<g class="gsl-room gsl-${mood}">${(ROOMS[mood] || gala)(t, opts)}</g>`; }

// ---------------------------------------------------------------- grade
const GRADE = { // wash = soft-light strengths for key (upper-left) / rim (lower-right); vig = vignette strength; lift = overlay contrast lift on the subject area
  gala: { wk: .5, wr: .45, vig: .8, lift: .22, con: 1.1, sat: 1.16 }, space: { wk: .35, wr: .5, vig: .75, lift: .22, con: 1.1, sat: 1.16 },
  mars: { wk: .45, wr: .4, vig: .65, lift: .22, con: 1.1, sat: 1.16 }, mine: { wk: .5, wr: .3, vig: .9, lift: .22, con: 1.1, sat: 1.16 },
  triumph: { wk: .45, wr: .3, vig: .7, lift: .22, con: 1.1, sat: 1.16 }, void: { wk: .2, wr: .5, vig: .95, lift: .22, con: 1.1, sat: 1.16 },
};
// CSS filter (contrast + saturation lift) for the frame <svg>. grade() applies it automatically to any element with
// class="gsl-frame" (it is ~5 ms as a CSS filter; never do this with backdrop-filter or an SVG filter: 100-200 ms).
function gradeFilter(mood = 'gala') { const G = GRADE[mood] || GRADE.gala; return `contrast(${G.con}) saturate(${G.sat})`; }
// Shared grade. Returns SVG markup: put it as the LAST child of the frame <svg> (outside any camera group), and give
// that <svg> class="gsl-frame" so the contrast/saturation lift applies. Captions go on top, outside the svg.
// Layers: one soft-light group (key wash upper-left, rim wash lower-right, subject lift, grain) + vignette toward the
// mood's deep shadow colour. opts: t (animates grain), turn (triumph), grain (false = off), strength (0..1)
function grade(mood = 'gala', opts = {}) {
  const P = palette(mood, opts.turn), G = GRADE[mood] || GRADE.gala, k = opts.strength == null ? 1 : opts.strength, t = opts.t || 0;
  const gx = Math.floor(t * 30 * 37) % 128, gy = Math.floor(t * 30 * 53) % 128;
  const wash = linear([[0, P.key, G.wk * k], [.46, P.key, 0], [.58, P.rim, 0], [1, P.rim, G.wr * k]], 'gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="1080" y2="1670"');
  const lift = radial([[0, mix(P.key, '#ffffff', .5), G.lift * k], [.7, P.key, 0], [1, P.key, 0]], 'gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(454 845) scale(864 1152)"');
  const vig = radial([[0, P.shadow, 0], [.52, P.shadow, 0], [.82, P.shadow, G.vig * .5 * k], [1, P.shadow, G.vig * .92 * k]], 'gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(540 883) scale(842 1190)"');
  const R = 'x="0" y="0" width="1080" height="1920"';
  return `<style>.gsl-frame{filter:${gradeFilter(mood)}}</style><g class="gsl-grade" pointer-events="none"><defs>${wash.def}${lift.def}${vig.def}</defs>`
    + `<g style="mix-blend-mode:soft-light"><rect ${R} fill="url(#${wash.id})"/><rect ${R} fill="url(#${lift.id})"/>${opts.grain === false ? '' : `<rect x="-128" y="-128" width="1336" height="2176" fill="url(#gsl-grain)" transform="translate(${gx} ${gy})"/>`}</g>`
    + `<rect ${R} fill="url(#${vig.id})"/></g>`;
}
// Whole graded frame in one call: <svg class="gsl-frame"> containing defs() + your content + grade().
function frame(svgContent, mood = 'gala', opts = {}) { return `<svg class="gsl-frame" viewBox="0 0 1080 1920" width="1080" height="1920" style="position:absolute;inset:0">${defs()}${svgContent}${grade(mood, opts)}</svg>`; }

module.exports = { MOODS, palette, defs, dof, screen, skyOrRoom, lightShafts, glow, candle, bokeh, dust, floorShadow, lit, rimLight, celShadow, grade, gradeFilter, frame, mix };
