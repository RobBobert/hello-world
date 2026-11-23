// Chibi v2 for Golden Son (style "B2 + O"): flat 2D characters with ARMS, long flowing hair for Darrow,
// Golden Son costumes (gold lion armour / silver + Bellona blue). Builds on rig.js head + body.
const R = require('./rig.js');
const INK = '#1b1210', D = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const f = v => v.toFixed(1);

// ---------- long flowing hair (2D shapes; hairline + side locks follow the head yaw) ----------
function longHair(cx, cy, r, o = {}) {
  const yaw = (o.yaw || 0) * D, t = o.wind || 0, hc = o.hairCol || '#e8b53a', hh = o.hairHi || '#fff0b0', hs = o.hairShade || '#b8862a';
  const sw = r * 0.085, P = (lon, lat, rad = 1) => { const L = lon * D + yaw, A = lat * D; return [cx + r * rad * Math.sin(L) * Math.cos(A), cy - r * rad * Math.sin(A), Math.cos(L) * Math.cos(A)]; };
  const sway = k => Math.sin(t * 2.2 + k) * r * 0.08, bx = -Math.sin(yaw) * r * 0.35; // back mass drifts opposite the turn
  // back mass: flows down behind the shoulders, ragged ends that sway
  const LEN = o.length === 'short' ? [[-1.05, 0.55], [-0.6, 0.72], [-0.2, 0.66], [0.2, 0.74], [0.6, 0.68], [1.06, 0.52]] : [[-1.18, 1.55], [-0.75, 1.85], [-0.25, 1.7], [0.25, 1.9], [0.75, 1.75], [1.2, 1.5]];
  const ends = LEN.map(([u, v], i) => [cx + bx + u * r + sway(i), cy + v * r + Math.abs(sway(i + 3)) * 0.4]);
  let d = `M${f(cx + bx - r * 1.08)} ${f(cy - r * 0.15)} C${f(cx + bx - r * 1.25)} ${f(cy + r * 0.6)}, ${f(ends[0][0] - r * 0.1)} ${f(ends[0][1] - r * 0.5)}, ${f(ends[0][0])} ${f(ends[0][1])}`;
  for (let i = 1; i < ends.length; i++) { const m = [(ends[i - 1][0] + ends[i][0]) / 2, Math.min(ends[i - 1][1], ends[i][1]) - r * 0.28]; d += ` Q${f(m[0])} ${f(m[1])} ${f(ends[i][0])} ${f(ends[i][1])}`; }
  d += ` C${f(ends[5][0] + r * 0.1)} ${f(ends[5][1] - r * 0.5)}, ${f(cx + bx + r * 1.25)} ${f(cy + r * 0.6)}, ${f(cx + bx + r * 1.08)} ${f(cy - r * 0.15)} A${f(r * 1.1)} ${f(r * 1.1)} 0 0 0 ${f(cx + bx - r * 1.08)} ${f(cy - r * 0.15)} Z`;
  const strands = o.length === 'short' ? '' : [-0.7, -0.3, 0.1, 0.5, 0.85].map((u, i) => `<path d="M${f(cx + bx + u * r * 0.9)} ${f(cy + r * 0.2)} Q${f(cx + bx + u * r * 1.05 + sway(i) * 0.5)} ${f(cy + r * 1.0)} ${f(cx + bx + u * r * 1.1 + sway(i))} ${f(cy + r * 1.55)}" stroke="${hs}" stroke-width="${f(r * 0.05)}" fill="none" stroke-linecap="round"/>`).join('');
  const back = `<path d="${d}" fill="${hc}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>${strands}`;
  // front: swept-back crown over the top of the head, hairline projected so it turns with the face
  const hl = []; for (let lon = -100; lon <= 100; lon += 10) { const u = Math.abs(lon) / 100, lat = -4 + 48 * (1 - Math.pow(u, 1.35)) - 5 * Math.exp(-Math.pow(lon / 12, 2)); hl.push(P(lon, lat)); }
  const vis = hl.filter(p => p[2] > -0.25);
  const L0 = vis[0], L1 = vis[vis.length - 1];
  const bk = -Math.sin(yaw) * r * 0.45; // volume sweeps away from where he's looking
  let crown = `M${f(L0[0])} ${f(L0[1])} ` + vis.map(p => `L${f(p[0])} ${f(p[1])}`).join(' ');
  crown += ` C${f(L1[0] + r * 0.3 + Math.max(0, bk))} ${f(cy - r * 0.55)}, ${f(cx + r * 1.1 + bk)} ${f(cy - r * (o.length === 'short' ? 1.62 : 1.48))}, ${f(cx + bk * 0.6)} ${f(cy - r * (o.length === 'short' ? 1.55 : 1.42))}`
    + ` C${f(cx - r * 1.1 + bk)} ${f(cy - r * (o.length === 'short' ? 1.62 : 1.48))}, ${f(L0[0] - r * 0.3 + Math.min(0, bk))} ${f(cy - r * 0.55)}, ${f(L0[0])} ${f(L0[1])} Z`;
  const dir = bk >= 0 ? 1 : -1; const sweep = [-60, -30, 0, 30, 60].map((lon, i) => { const a = P(lon, 40), b = [a[0] + dir * r * (0.35 + 0.15 * (1 - Math.abs(lon) / 60)), a[1] - r * (0.55 - Math.abs(lon) / 300)]; return a[2] > 0 ? `<path d="M${f(a[0])} ${f(a[1])} Q${f((a[0] + b[0]) / 2 + bk * 0.3)} ${f((a[1] + b[1]) / 2 - r * 0.05)} ${f(b[0])} ${f(b[1])}" stroke="${hs}" stroke-width="${f(r * 0.04)}" fill="none" stroke-linecap="round"/>` : ''; }).join('');
  const hi = [-35, 10].map((lon, i) => { const a = P(lon, 52, 1.04), b = [a[0] + dir * r * 0.4, a[1] - r * 0.38]; return a[2] > 0 ? `<path d="M${f(a[0])} ${f(a[1])} Q${f((a[0] + b[0]) / 2)} ${f((a[1] + b[1]) / 2 - r * 0.08)} ${f(b[0])} ${f(b[1])}" stroke="${hh}" stroke-width="${f(r * 0.05)}" fill="none" stroke-linecap="round" opacity=".9"/>` : ''; }).join('');
  // forelock: one loose lock falling across the forehead, swaying
  const fl = (() => { const a = P(10, 36), tip = [a[0] - r * 0.62 + sway(11), cy - r * 0.32]; return a[2] > 0.2 ? `<path d="M${f(a[0] + r * 0.12)} ${f(a[1] - r * 0.05)} Q${f(a[0] - r * 0.1)} ${f(cy - r * 0.5)} ${f(tip[0])} ${f(tip[1])} Q${f(a[0] - r * 0.25)} ${f(cy - r * 0.62)} ${f(a[0] - r * 0.22)} ${f(a[1] - r * 0.1)} Z" fill="${hc}" stroke="${INK}" stroke-width="${f(sw * 0.7)}" stroke-linejoin="round"/>` : ''; })();
  // side locks framing the face (in front of the ears), tips sway
  const locks = o.length === 'short' ? '' : [-1, 1].map((s, i) => { const a = P(s * 84, 4), z = a[2]; if (z < -0.1) return '';
    const tip = [a[0] + s * r * 0.18 + sway(i + 7), cy + r * 1.05]; const w = r * 0.26 * cl(z + 0.3, 0.35, 1);
    return `<path d="M${f(a[0] - w / 2)} ${f(a[1])} Q${f(a[0] + s * r * 0.12 - w)} ${f(cy + r * 0.5)} ${f(tip[0])} ${f(tip[1])} Q${f(a[0] + s * r * 0.25 + w)} ${f(cy + r * 0.45)} ${f(a[0] + w / 2)} ${f(a[1])} Z" fill="${hc}" stroke="${INK}" stroke-width="${f(sw * 0.8)}" stroke-linejoin="round"/>`; }).join('');
  const tufts = o.length !== 'short' ? '' : [-0.55, -0.15, 0.25, 0.6].map((u, i) => { const bx0 = cx + bk * 0.6 + u * r * 0.95, by0 = cy - r * (1.42 - Math.abs(u) * 0.35); const tx = bx0 + dir * r * 0.28 + sway(i) * 0.3, ty = by0 - r * 0.32;
    return `<path d="M${f(bx0 - r * 0.2)} ${f(by0 + r * 0.06)} Q${f(bx0)} ${f(by0 - r * 0.12)} ${f(tx)} ${f(ty)} Q${f(bx0 + r * 0.08)} ${f(by0 - r * 0.02)} ${f(bx0 + r * 0.2)} ${f(by0 + r * 0.08)} Z" fill="${hc}" stroke="${INK}" stroke-width="${f(sw * 0.8)}" stroke-linejoin="round"/>`; }).join('');
  const front = `${tufts}<path d="${crown}" fill="${hc}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>${sweep}${hi}${locks}${fl}`;
  return { back, front };
}

// ---------- arms ----------
// pose per side: 'hang' | 'hip' | 'blade' (right only) | 'table' | 'raise' | 'cross'
function arm(sx, sy, s, side, pose, col, o) {
  const P = {
    hang: [[side * 0.17, 0.42], [side * 0.22, 0.85]], hip: [[side * 0.34, 0.36], [side * 0.08, 0.72]], blade: [[side * 0.26, 0.38], [side * 0.36, 0.76]],
    table: [[side * 0.24, 0.42], [side * -0.02, 0.6]], raise: [[side * 0.26, -0.28], [side * 0.2, -0.62]], cross: [[side * 0.18, 0.4], [side * -0.3, 0.52]],
  }[pose] || [[side * 0.17, 0.42], [side * 0.22, 0.85]];
  const e = [sx + P[0][0] * s, sy + P[0][1] * s], h = [sx + P[1][0] * s, sy + P[1][1] * s], w = s * 0.15, sw = s * 0.04;
  const seg = (a, b, wd, c) => `<line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${INK}" stroke-width="${f(wd + sw * 2)}" stroke-linecap="round"/><line x1="${f(a[0])}" y1="${f(a[1])}" x2="${f(b[0])}" y2="${f(b[1])}" stroke="${c}" stroke-width="${f(wd)}" stroke-linecap="round"/>`;
  const upper = seg([sx, sy], e, w, col.sleeve), fore = seg(e, h, w * 0.92, col.fore || col.sleeve);
  const cuff = `<circle cx="${f(h[0] - (h[0] - e[0]) * 0.18)}" cy="${f(h[1] - (h[1] - e[1]) * 0.18)}" r="${f(w * 0.55)}" fill="${col.cuff || col.fore || col.sleeve}" stroke="${INK}" stroke-width="${f(sw * 0.8)}"/>`;
  const hand = `<circle cx="${f(h[0])}" cy="${f(h[1])}" r="${f(s * 0.085)}" fill="${col.hand}" stroke="${INK}" stroke-width="${f(sw * 0.9)}"/>`;
  let blade = '';
  if (pose === 'blade') { const [x, y] = h; blade = `<path d="M${f(x)} ${f(y)} q${f(s * 0.3)} ${f(s * 0.12)} ${f(s * 0.24)} ${f(s * 0.7)} q${f(-s * 0.22)} ${f(-s * 0.26)} ${f(-s * 0.2)} ${f(-s * 0.68)}Z" fill="#e9eef4" stroke="${INK}" stroke-width="${f(sw * 0.7)}" stroke-linejoin="round"/><path d="M${f(x + s * 0.04)} ${f(y + s * 0.05)} q${f(s * 0.17)} ${f(s * 0.12)} ${f(s * 0.17)} ${f(s * 0.5)}" stroke="#fff" stroke-width="${f(sw * 0.6)}" fill="none" stroke-linecap="round"/>`; }
  return blade + upper + fore + cuff + hand;
}


// slim armoured body (replaces the wide bell). (x,y) = between the feet; neck at y - 1.55s.
function body2(x, y, s, o = {}) {
  const k = -(o.yaw || 0) * s * 0.0016, sw = s * 0.042, fill = o.fill || '#d9a441', shade = o.shade || '#8e6420', trim = o.trim || '#f6dc8b';
  const leg = o.leg || '#1e1a1f', greave = o.greave || fill, boot = o.boot || '#2b211d';
  const P = (a, b) => `${f(x + a * s + k * (1 - b / 1.55))} ${f(y - b * s)}`;
  let g = '';
  if (o.cape) g += `<path d="M${P(-0.3, 1.5)} L${P(-0.62, 0.05)} Q${P(0, -0.02)} ${P(0.62, 0.05)} L${P(0.3, 1.5)} Z" fill="${o.cape}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
  for (const d of [-1, 1]) { // legs + greaves + boots
    g += `<path d="M${P(d * 0.06, 0.66)} L${P(d * 0.25, 0.66)} L${P(d * 0.22, 0.3)} L${P(d * 0.08, 0.3)} Z" fill="${leg}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
    g += `<path d="M${P(d * 0.07, 0.42)} L${P(d * 0.235, 0.42)} L${P(d * 0.22, 0.12)} L${P(d * 0.08, 0.12)} Z" fill="${greave}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
    g += `<path d="M${P(d * 0.075, 0.14)} L${P(d * 0.225, 0.14)} Q${P(d * 0.33, 0.06)} ${P(d * 0.32, 0)} L${P(d * 0.06, 0)} Z" fill="${boot}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
    g += `<path d="M${P(d * 0.1, 0.36)} L${P(d * 0.2, 0.36)}" stroke="${trim}" stroke-width="${f(s * 0.03)}" stroke-linecap="round"/>`;
  }
  // tassets (armour skirt flaps)
  g += `<path d="M${P(-0.3, 0.86)} L${P(0.3, 0.86)} L${P(0.33, 0.56)} L${P(0.12, 0.6)} L${P(0, 0.54)} L${P(-0.12, 0.6)} L${P(-0.33, 0.56)} Z" fill="${fill}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
  g += `<path d="M${P(0, 0.84)} L${P(0, 0.56)} M${P(-0.17, 0.84)} L${P(-0.2, 0.59)} M${P(0.17, 0.84)} L${P(0.2, 0.59)}" stroke="${shade}" stroke-width="${f(s * 0.025)}"/>`;
  // torso: broad shoulders -> narrow waist
  g += `<path d="M${P(-0.36, 1.5)} Q${P(0, 1.58)} ${P(0.36, 1.5)} L${P(0.31, 1.15)} Q${P(0.24, 0.98)} ${P(0.25, 0.84)} L${P(-0.25, 0.84)} Q${P(-0.24, 0.98)} ${P(-0.31, 1.15)} Z" fill="${fill}" stroke="${INK}" stroke-width="${f(sw)}" stroke-linejoin="round"/>`;
  g += `<path d="M${P(0.05, 1.52)} Q${P(0.3, 1.45)} ${P(0.3, 1.15)} Q${P(0.22, 0.98)} ${P(0.23, 0.86)} L${P(0.12, 0.86)} Q${P(0.15, 1.2)} ${P(0.05, 1.52)} Z" fill="${shade}" opacity=".55"/>`;
  g += `<path d="M${P(-0.2, 1.24)} Q${P(-0.1, 1.17)} ${P(0, 1.24)} Q${P(0.1, 1.17)} ${P(0.2, 1.24)}" stroke="${shade}" stroke-width="${f(s * 0.025)}" fill="none" stroke-linecap="round"/>`;
  g += `<path d="M${P(-0.3, 1.47)} Q${P(0, 1.36)} ${P(0.3, 1.47)}" stroke="${trim}" stroke-width="${f(s * 0.05)}" fill="none" stroke-linecap="round"/>`;
  if (o.sigil) g += `<g transform="translate(${f(x + k * 0.5)} ${f(y - 1.12 * s)}) scale(0.62) translate(${f(-x - k * 0.5)} ${f(-(y - 1.12 * s))})">${o.sigil(x + k * 0.5, y - 1.12 * s, s)}</g>`;
  g += `<rect x="${f(x - 0.12 * s + k * 0.5)}" y="${f(y - 1.62 * s)}" width="${f(0.24 * s)}" height="${f(0.14 * s)}" fill="${leg}" stroke="${INK}" stroke-width="${f(sw * 0.8)}"/>`;
  return g;
}

// ---------- assembled characters ----------
const sash = (x, y, s) => `<path d="M${f(x - s * 0.27)} ${f(y - s * 0.94)} L${f(x + s * 0.27)} ${f(y - s * 0.94)} L${f(x + s * 0.28)} ${f(y - s * 0.83)} L${f(x - s * 0.28)} ${f(y - s * 0.83)} Z" fill="#b3221d" stroke="${INK}" stroke-width="${f(s * 0.035)}"/>
  <path d="M${f(x - s * 0.12)} ${f(y - s * 0.84)} l${f(-s * 0.06)} ${f(s * 0.36)} l${f(s * 0.1)} ${f(-s * 0.02)} l${f(s * 0.04)} ${f(-s * 0.33)} Z" fill="#8f1a16" stroke="${INK}" stroke-width="${f(s * 0.03)}"/>`;
const pauldrons = (x, y, s, col, hi) => [-1, 1].map(d => `<path d="M${f(x + d * s * 0.16)} ${f(y - s * 1.5)} q${f(d * s * 0.2)} ${f(-s * 0.1)} ${f(d * s * 0.3)} ${f(s * 0.08)} q${f(-d * s * 0.02)} ${f(s * 0.1)} ${f(-d * s * 0.12)} ${f(s * 0.08)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(s * 0.04)}" stroke-linejoin="round"/><path d="M${f(x + d * s * 0.2)} ${f(y - s * 1.55)} q${f(d * s * 0.1)} ${f(-s * 0.03)} ${f(d * s * 0.18)} ${f(s * 0.02)}" stroke="${hi}" stroke-width="${f(s * 0.03)}" fill="none" stroke-linecap="round" opacity=".9"/>`).join('');

function build(x, y, s, o, kit) {
  const yaw = o.yaw ?? kit.yaw, k = -yaw * s * 0.0016, top = y - s * 1.55, r = s * 0.42, hx = x + yaw * s * 0.0012, hy = top - r * 0.78;
  const sx = s * 0.33, sy = top + s * 0.1;
  const arms = o.arms || kit.arms;
  const bodySvg = body2(x, y, s, { ...kit.body, yaw });
  const armSvg = side => arm(x + k + side * sx, sy, s, side, side < 0 ? arms[0] : arms[1], kit.armCol, o);
  // left arm behind body when crossing, otherwise in front
  const hairObj = kit.hair === 'long' ? longHair(hx, hy, r, { ...kit.hairOpts, yaw, wind: o.wind, length: o.hair || 'long' }) : null;
  const headSvg = R.head(hx, hy, r, { ...kit.headOpts, ...(kit.hair === 'long' ? { hair: 'none' } : {}), yaw, pitch: o.pitch, brow: o.brow ?? kit.headOpts.brow, mouth: o.mouth ?? kit.headOpts.mouth, blink: o.blink });
  // for long hair: suppress rig's own hair by drawing face only (strip hair groups is not possible), so draw rig head then cover with crown
  return `<g>${hairObj ? hairObj.back : ''}${bodySvg}${kit.extra ? kit.extra(x + k * .5, y, s) : ''}${armSvg(-1)}${armSvg(1)}${kit.top ? kit.top(x + k * .7, y, s) : ''}${headSvg}${hairObj ? hairObj.front : ''}</g>`;
}

const DARROW = { yaw: 15, hair: 'long', arms: ['hang', 'blade'],
  hairOpts: { hairCol: '#e8b53a', hairHi: '#fff2b8', hairShade: '#b8862a' },
  headOpts: { hairCol: '#e8b53a', hairHi: '#fff0b0', brow: 'angry', mouth: 'smirk', iris: '#e0a326' },
  body: { fill: '#d9a441', shade: '#8e6420', trim: '#f6dc8b', sigil: R.lion, leg: '#1e1a1f', greave: '#d9a441' },
  armCol: { sleeve: '#1e1a1f', fore: '#d9a441', cuff: '#f6dc8b', hand: '#e2a93b' },
  extra: sash, top: (x, y, s) => pauldrons(x, y, s, '#e2a93b', '#fff2b8') };
const CASSIUS = { yaw: -15, hair: 'curls', arms: ['table', 'table'],
  headOpts: { hair: 'curls', hairCol: '#d6a23c', hairHi: '#f8e09a', brow: 'soft', mouth: 'flat', iris: '#e8b53a' },
  body: { fill: '#d8e0ea', shade: '#8d9bb0', trim: '#2b4a8a', cape: '#2b4a8a', leg: '#1b2f5c', greave: '#d8e0ea', boot: '#1b2f5c', sigil: (a, b, c) => R.eagle(a, b, c, '#2b4a8a') },
  armCol: { sleeve: '#2b4a8a', fore: '#d8e0ea', cuff: '#ffffff', hand: '#e9eef5' },
  top: (x, y, s) => pauldrons(x, y, s, '#eef2f7', '#ffffff') };
const darrow = (x, y, s, o = {}) => build(x, y, s, o, DARROW);
const cassius = (x, y, s, o = {}) => build(x, y, s, o, CASSIUS);
module.exports = { darrow, cassius, longHair, arm, build };
