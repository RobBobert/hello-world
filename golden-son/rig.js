// 2.5D character rig: flat 2D style, but the head is a sphere whose features (eyes, nose, mouth, ears, hair clumps)
// are placed by longitude/latitude and re-projected for any yaw/pitch, so the camera can "swing" around a face.
const INK = '#1b1210', SKIN = '#f2d3b3', SKIN_SH = '#dcae88';
const D = Math.PI / 180;
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

function rngf(seed) { let v = seed; return () => (v = (v * 9301 + 49297) % 233280) / 233280; }

// hair clump sets (lon, lat, size) on the unit sphere
function curls(seed = 3) {
  const R = rngf(seed), out = [];
  for (let lat = 18; lat <= 84; lat += 16) {
    const n = Math.max(3, Math.round(15 * Math.cos(lat * D)));
    for (let i = 0; i < n; i++) out.push({ lon: -180 + (360 / n) * (i + (lat / 16) % 2 * 0.5) + (R() - .5) * 8, lat: lat + (R() - .5) * 6, s: 0.3 + R() * 0.07 });
  }
  for (let lon = 75; lon <= 285; lon += 24) for (const lat of [-2, -22]) out.push({ lon: lon > 180 ? lon - 360 : lon, lat, s: 0.28 });
  return out;
}
function spikes(seed = 5) {
  const R = rngf(seed), out = [];
  for (let lat = 22; lat <= 82; lat += 20) {
    const n = Math.max(3, Math.round(12 * Math.cos(lat * D)));
    for (let i = 0; i < n; i++) out.push({ lon: -180 + (360 / n) * (i + 0.3) + (R() - .5) * 10, lat: lat + (R() - .5) * 6, s: 0.27, spike: 0.5 + R() * 0.3 });
  }
  for (let lon = 80; lon <= 280; lon += 25) for (const lat of [0, -20]) out.push({ lon: lon > 180 ? lon - 360 : lon, lat, s: 0.27 });
  return out;
}
const HAIR = { curls: curls(), spikes: spikes() };

// head(cx, cy, r, { yaw, pitch (deg), hair:'curls'|'spikes', hairCol, hairHi, iris, brow:'angry'|'soft'|'sad', mouth:'smile'|'smirk'|'flat'|'frown'|'open', blink })
function head(cx, cy, r, o = {}) {
  const yaw = (o.yaw || 0) * D, pitch = (o.pitch || 0) * D;
  const P = (lon, lat, rad = 1) => {
    const L = lon * D + yaw, A = lat * D + pitch;
    return { x: cx + r * rad * Math.sin(L) * Math.cos(A), y: cy - r * rad * Math.sin(A), z: Math.cos(L) * Math.cos(A) };
  };
  const f = v => v.toFixed(1);
  const sw = r * 0.085;
  let back = '', front = '';
  // hair
  const hc = o.hairCol || '#c48a2c', hh = o.hairHi || '#f0c46a';
  const clumps = (HAIR[o.hair || 'curls']).map(c => ({ ...c, p: P(c.lon, c.lat, 1.02) })).sort((a, b) => a.p.z - b.p.z);
  const unified = o.hair === 'spikes';
  const shape = (c, stroke) => {
    const { p } = c, rr = c.s * r, st = stroke ? `fill="${INK}" stroke="${INK}" stroke-width="${f(sw * 1.7)}" stroke-linejoin="round"` : `fill="${hc}"`;
    let g = `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(rr)}" ${st}/>`;
    if (c.spike) { const dx = p.x - cx, dy = p.y - cy, d = Math.hypot(dx, dy) || 1, ux = dx / d, uy = dy / d, k = (0.25 + 0.75 * (d / r)) * c.spike * r;
      g += `<path d="M${f(p.x - uy * rr)} ${f(p.y + ux * rr)} L${f(p.x + ux * (rr + k))} ${f(p.y + uy * (rr + k))} L${f(p.x + uy * rr)} ${f(p.y - ux * rr)} Z" ${st}/>`; }
    return g;
  };
  const isBack = c => c.p.z < 0.12, hidden = c => !isBack(c) && c.lat < 30 && Math.abs(Math.sin(c.lon * D + yaw)) < 0.72;
  if (unified) {
    const B = clumps.filter(isBack), F = clumps.filter(c => !isBack(c) && !hidden(c));
    back = B.map(c => shape(c, true)).join('') + B.map(c => shape(c, false)).join('');
    front = F.map(c => shape(c, true)).join('') + F.map(c => shape(c, false)).join('')
      + F.filter((c, i) => i % 3 === 0).map(c => `<path d="M${f(c.p.x - c.s * r * 0.5)} ${f(c.p.y - c.s * r * 0.2)} q${f(c.s * r * 0.5)} ${f(-c.s * r * 0.4)} ${f(c.s * r)} 0" stroke="${hh}" stroke-width="${f(r * 0.045)}" fill="none" stroke-linecap="round" opacity=".8"/>`).join('');
  } else for (const c of clumps) {
    const { p } = c, rr = c.s * r;
    let g = `<circle cx="${f(p.x)}" cy="${f(p.y)}" r="${f(rr)}" fill="${hc}" stroke="${INK}" stroke-width="${f(sw * 0.8)}"/>`;
    if (p.z > 0.2) g += `<path d="M${f(p.x - rr * 0.4)} ${f(p.y)} a${f(rr * 0.45)} ${f(rr * 0.45)} 0 1 1 ${f(rr * 0.6)} ${f(rr * 0.3)}" stroke="${hh}" stroke-width="${f(r * 0.04)}" fill="none" opacity=".7"/>`;
    if (isBack(c)) back += g; else if (!hidden(c)) front += g;
  }
  // ears
  let earBack = '', earFront = '';
  for (const s of [-1, 1]) {
    const L = s * 90 * D + yaw, e = P(s * 90, -8, 1.0), vis = Math.abs(Math.sin(L));
    const g = `<ellipse cx="${f(e.x)}" cy="${f(e.y)}" rx="${f(r * (0.07 + 0.11 * (1 - vis) + 0.05))}" ry="${f(r * 0.2)}" fill="${SKIN}" stroke="${INK}" stroke-width="${f(sw * 0.8)}"/>`;
    if (e.z > 0.18) earFront += g; else if (e.z > -0.5) earBack += g;
  }
  // face
  let face = '';
  const iris = o.iris || '#e0a326';
  for (const s of [-1, 1]) {
    const e = P(s * 25, -5), w = cl(e.z, 0, 1);
    if (e.z > 0.08) {
      const rx = r * 0.2 * Math.max(0.3, w), ry = r * 0.2 * (o.blink ? 0.12 : 1);
      face += `<ellipse cx="${f(e.x)}" cy="${f(e.y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${iris}"/><ellipse cx="${f(e.x)}" cy="${f(e.y)}" rx="${f(rx * 0.55)}" ry="${f(ry * 0.55)}" fill="${INK}"/>`
        + (o.blink ? '' : `<circle cx="${f(e.x + rx * 0.2)}" cy="${f(e.y - ry * 0.25)}" r="${f(r * 0.028)}" fill="#fff"/>`);
      const tilt = o.brow === 'angry' ? [18, 9] : o.brow === 'sad' ? [9, 17] : [15, 15];
      const b1 = P(s * 38, tilt[0]), b2 = P(s * 12, tilt[1]);
      face += `<path d="M${f(b1.x)} ${f(b1.y)} L${f(b2.x)} ${f(b2.y)}" stroke="${INK}" stroke-width="${f(r * 0.1)}" stroke-linecap="round"/>`;
    }
  }
  // nose: sticks out as the head turns
  const n0 = P(0, -6), n1 = P(0, -20, 1.2), n2 = P(0, -27);
  face += `<path d="M${f(n0.x)} ${f(n0.y)} L${f(n1.x)} ${f(n1.y)} L${f(n2.x)} ${f(n2.y)}" fill="${SKIN}" stroke="${INK}" stroke-width="${f(sw * 0.75)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  // mouth
  const m = o.mouth || 'flat', mw = 15;
  const ml = P(-mw, -42), mr = P(mw, -42), mc = P(0, m === 'smile' || m === 'smirk' ? -52 : m === 'frown' ? -36 : -42);
  if (m === 'smirk') { const mr2 = P(mw + 4, -36); face += `<path d="M${f(ml.x)} ${f(ml.y)} Q${f(mc.x)} ${f(mc.y)} ${f(mr2.x)} ${f(mr2.y)}" stroke="${INK}" stroke-width="${f(r * 0.075)}" fill="none" stroke-linecap="round"/>`; }
  else if (m === 'grin') { const a = P(-24, -38), b2 = P(24, -38), top = P(0, -44), bot = P(0, -66), mid = P(0, -50);
    face += `<path d="M${f(a.x)} ${f(a.y)} Q${f(top.x)} ${f(top.y)} ${f(b2.x)} ${f(b2.y)} Q${f(bot.x)} ${f(bot.y)} ${f(a.x)} ${f(a.y)} Z" fill="#fff" stroke="${INK}" stroke-width="${f(r * 0.07)}" stroke-linejoin="round"/>
      <path d="M${f(a.x + (mid.x - a.x) * 0.3)} ${f(mid.y)} L${f(b2.x + (mid.x - b2.x) * 0.3)} ${f(mid.y)}" stroke="${INK}" stroke-width="${f(r * 0.035)}" opacity=".5"/>`; }
  else face += `<path d="M${f(ml.x)} ${f(ml.y)} Q${f(mc.x)} ${f(mc.y)} ${f(mr.x)} ${f(mr.y)}" stroke="${INK}" stroke-width="${f(r * 0.075)}" fill="none" stroke-linecap="round"/>`;
  // scar / extras hook
  const extra = o.extra ? o.extra(P, f) : '';
  // shade crescent on the side turned away
  const sd = yaw >= 0 ? -1 : 1, sa = cl(Math.abs(yaw) / (50 * D), 0.25, 1);
  const shade = `<path d="M${f(cx + sd * r * 0.25)} ${f(cy - r * 0.96)} A${f(r)} ${f(r)} 0 0 ${sd > 0 ? 1 : 0} ${f(cx + sd * r * 0.25)} ${f(cy + r * 0.96)} A${f(r * (1.6 - sa * 0.5))} ${f(r * (1.6 - sa * 0.5))} 0 0 ${sd > 0 ? 0 : 1} ${f(cx + sd * r * 0.25)} ${f(cy - r * 0.96)} Z" fill="${SKIN_SH}" opacity=".85"/>`;
  return `${back}${earBack}<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${SKIN}" stroke="${INK}" stroke-width="${f(sw)}"/>
    <clipPath id="hc${f(cx)}_${f(cy)}"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r - sw * 0.4)}"/></clipPath><g clip-path="url(#hc${f(cx)}_${f(cy)})">${shade}</g>
    ${earFront}${face}${extra}${front}`;
}

// bell body, shoulders shift a touch with yaw. opts: fill, shade, trim, sigil(svg fn), boots, cape
function body(x, y, s, o = {}) {
  const top = y - s * 1.55, k = -(o.yaw || 0) * s * 0.0016, hem = o.boots ? y - s * 0.34 : y;
  const path = `M${x - s * 0.27 + k} ${top} C${x - s * 0.35 + k} ${y - s * 0.9}, ${x - s * 0.62} ${y - s * 0.4}, ${x - s * 0.66} ${hem} L${x + s * 0.66} ${hem} C${x + s * 0.62} ${y - s * 0.4}, ${x + s * 0.35 + k} ${y - s * 0.9}, ${x + s * 0.27 + k} ${top} Z`;
  const boots = o.boots ? [-1, 1].map(d => { const bx = x + d * s * 0.3, w = s * 0.3, toe = d * s * 0.1; return `
      <rect x="${bx - w / 2}" y="${hem - s * 0.04}" width="${w}" height="${y - hem - s * 0.02}" rx="${s * 0.04}" fill="#2b211d" stroke="${INK}" stroke-width="${s * 0.04}"/>
      <path d="M${bx - w / 2} ${y - s * 0.16} h${w} q${toe + (d > 0 ? s * 0.06 : -s * 0.06)} ${s * 0.02} ${toe} ${s * 0.1} h${-w - toe} Z" fill="#2b211d" stroke="${INK}" stroke-width="${s * 0.04}" stroke-linejoin="round"/>
      <rect x="${bx - w / 2 - s * 0.03 + Math.min(0, toe)}" y="${y - s * 0.07}" width="${w + s * 0.06 + Math.abs(toe)}" height="${s * 0.07}" rx="${s * 0.02}" fill="#0c0908" stroke="${INK}" stroke-width="${s * 0.03}"/>
      <rect x="${bx - w / 2}" y="${hem + s * 0.03}" width="${w}" height="${s * 0.04}" fill="${o.trim || '#e2a93b'}"/>
      <path d="M${bx - w * 0.25} ${hem + s * 0.1} v${s * 0.1}" stroke="#4a3a32" stroke-width="${s * 0.03}" stroke-linecap="round"/>`; }).join('') : '';
  return `${o.cape ? `<path d="M${x - s * 0.3} ${top + s * 0.05} L${x - s * 0.82} ${hem + s * 0.05} L${x + s * 0.82} ${hem + s * 0.05} L${x + s * 0.3} ${top + s * 0.05} Z" fill="${o.cape}" stroke="${INK}" stroke-width="${s * 0.04}" stroke-linejoin="round"/>` : ''}
    ${boots}<path d="${path}" fill="${o.fill || '#222'}" stroke="${INK}" stroke-width="${s * 0.045}" stroke-linejoin="round"/>
    <path d="M${x + s * 0.06 + k} ${top + s * 0.08} C${x + s * 0.2} ${y - s * 0.8}, ${x + s * 0.36} ${y - s * 0.4}, ${x + s * 0.42} ${hem - s * 0.03} L${x + s * 0.62} ${hem - s * 0.03} C${x + s * 0.58} ${y - s * 0.4}, ${x + s * 0.32} ${y - s * 0.9}, ${x + s * 0.24 + k} ${top + s * 0.05}Z" fill="${o.shade || 'rgba(0,0,0,.35)'}" opacity=".6"/>
    <path d="M${x - s * 0.29 + k} ${top + s * 0.1} Q${x + k} ${top + s * 0.34} ${x + s * 0.29 + k} ${top + s * 0.1}" stroke="${o.trim || '#e2a93b'}" stroke-width="${s * 0.06}" fill="none" stroke-linecap="round"/>
    ${o.sigil ? o.sigil(x + k * 0.5, y - s * 0.85, s) : ''}`;
}
function character(x, y, s, o = {}) {
  const r = s * 0.42, cy = y - s * 1.55 - r * 0.78;
  return `<g>${body(x, y, s, o)}${head(x + (o.yaw || 0) * s * 0.0012, cy, r, o)}</g>`;
}
const lion = (x, y, s) => `<g transform="translate(${x} ${y})"><circle r="${s * 0.13}" fill="#e2a93b" stroke="${INK}" stroke-width="${s * 0.025}"/>${Array.from({ length: 10 }, (_, i) => `<path d="M${Math.cos(i * 36 * D) * s * 0.12} ${Math.sin(i * 36 * D) * s * 0.12} L${Math.cos((i * 36 + 18) * D) * s * 0.2} ${Math.sin((i * 36 + 18) * D) * s * 0.2} L${Math.cos((i * 36 + 36) * D) * s * 0.12} ${Math.sin((i * 36 + 36) * D) * s * 0.12}Z" fill="#e2a93b" stroke="${INK}" stroke-width="${s * 0.018}"/>`).join('')}<circle r="${s * 0.07}" fill="#b0231f"/></g>`;
const eagle = (x, y, s, col = '#dfe6ee') => `<g transform="translate(${x} ${y})" fill="${col}" stroke="${INK}" stroke-width="${s * 0.02}" stroke-linejoin="round"><path d="M0 ${-s * 0.1} L${s * 0.05} ${-s * 0.02} L${s * 0.26} ${-s * 0.12} L${s * 0.16} ${s * 0.04} L${s * 0.05} ${s * 0.06} L0 ${s * 0.18} L${-s * 0.05} ${s * 0.06} L${-s * 0.16} ${s * 0.04} L${-s * 0.26} ${-s * 0.12} L${-s * 0.05} ${-s * 0.02} Z"/></g>`;

// presets
const darrow = (x, y, s, o = {}) => character(x, y, s, { hair: 'spikes', hairCol: '#e8b53a', hairHi: '#fff0b0', fill: '#231c1a', shade: '#000', trim: '#e2a93b', cape: '#8f1d16', sigil: lion, brow: 'angry', boots: true, ...o });
const cassius = (x, y, s, o = {}) => character(x, y, s, { hair: 'curls', hairCol: '#c48a2c', hairHi: '#f0c46a', fill: '#2c4f86', shade: '#16294a', trim: '#dfe6ee', cape: '#dfe6ee', sigil: eagle, brow: 'soft', mouth: 'smirk', ...o });
module.exports = { head, body, character, darrow, cassius, lion, eagle, INK, SKIN };
