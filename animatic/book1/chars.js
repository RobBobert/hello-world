// Character + map art for the Book 1 animatic. All functions return SVG strings.
// (x, y) is the point between the character's feet; s is the unit size (~head radius*2.4).
const INK = '#1b1210';
const SKIN = '#f2d3b3', SKIN_SH = '#e2b994';

function bell(x, y, s, fill, shade) {
  // Tall bell/cone body, same silhouette family as the channel's characters.
  const top = y - s * 1.55;
  return `<path d="M${x - s*0.26} ${top} C${x - s*0.34} ${y - s*0.9}, ${x - s*0.62} ${y - s*0.35}, ${x - s*0.66} ${y}
    L${x + s*0.66} ${y} C${x + s*0.62} ${y - s*0.35}, ${x + s*0.34} ${y - s*0.9}, ${x + s*0.26} ${top} Z"
    fill="${fill}" stroke="${INK}" stroke-width="${s*0.045}" stroke-linejoin="round"/>
    <path d="M${x + s*0.05} ${top + s*0.08} C${x + s*0.2} ${y - s*0.8}, ${x + s*0.36} ${y - s*0.35}, ${x + s*0.42} ${y - s*0.03} L${x + s*0.62} ${y - s*0.03}
    C${x + s*0.58} ${y - s*0.35}, ${x + s*0.32} ${y - s*0.9}, ${x + s*0.24} ${top + s*0.05}Z" fill="${shade}" opacity=".55"/>`;
}
function head(x, cy, r, o = {}) {
  const eyeY = cy + r * 0.12, ex = r * 0.36;
  const iris = o.iris ? `<circle cx="${x - ex}" cy="${eyeY}" r="${r*0.15}" fill="${o.iris}"/><circle cx="${x + ex}" cy="${eyeY}" r="${r*0.15}" fill="${o.iris}"/>` : '';
  const brow = o.brow === 'angry'
    ? `<path d="M${x - ex - r*0.2} ${eyeY - r*0.32} L${x - ex + r*0.18} ${eyeY - r*0.2} M${x + ex + r*0.2} ${eyeY - r*0.32} L${x + ex - r*0.18} ${eyeY - r*0.2}" stroke="${INK}" stroke-width="${r*0.1}" stroke-linecap="round"/>`
    : o.brow === 'sad'
    ? `<path d="M${x - ex - r*0.18} ${eyeY - r*0.2} L${x - ex + r*0.18} ${eyeY - r*0.32} M${x + ex + r*0.18} ${eyeY - r*0.2} L${x + ex - r*0.18} ${eyeY - r*0.32}" stroke="${INK}" stroke-width="${r*0.09}" stroke-linecap="round"/>`
    : `<path d="M${x - ex - r*0.17} ${eyeY - r*0.27} q${r*0.17} ${-r*0.08} ${r*0.34} 0 M${x + ex - r*0.17} ${eyeY - r*0.27} q${r*0.17} ${-r*0.08} ${r*0.34} 0" stroke="${INK}" stroke-width="${r*0.08}" fill="none" stroke-linecap="round"/>`;
  const mouth = o.mouth === 'smile'
    ? `<path d="M${x - r*0.18} ${cy + r*0.48} q${r*0.18} ${r*0.16} ${r*0.36} 0" stroke="${INK}" stroke-width="${r*0.07}" fill="none" stroke-linecap="round"/>`
    : o.mouth === 'frown'
    ? `<path d="M${x - r*0.16} ${cy + r*0.56} q${r*0.16} ${-r*0.13} ${r*0.32} 0" stroke="${INK}" stroke-width="${r*0.07}" fill="none" stroke-linecap="round"/>`
    : `<path d="M${x - r*0.14} ${cy + r*0.52} h${r*0.28}" stroke="${INK}" stroke-width="${r*0.07}" stroke-linecap="round"/>`;
  const lashes = o.lashes ? `<path d="M${x - ex - r*0.13} ${eyeY - r*0.1} l${-r*0.08} ${-r*0.08} M${x + ex + r*0.13} ${eyeY - r*0.1} l${r*0.08} ${-r*0.08}" stroke="${INK}" stroke-width="${r*0.06}" stroke-linecap="round"/>` : '';
  const blush = o.blush ? `<circle cx="${x - r*0.58}" cy="${cy + r*0.38}" r="${r*0.13}" fill="#e88" opacity=".5"/><circle cx="${x + r*0.58}" cy="${cy + r*0.38}" r="${r*0.13}" fill="#e88" opacity=".5"/>` : '';
  const eyes = o.closed
    ? `<path d="M${x - ex - r*0.12} ${eyeY} q${r*0.12} ${r*0.1} ${r*0.24} 0 M${x + ex - r*0.12} ${eyeY} q${r*0.12} ${r*0.1} ${r*0.24} 0" stroke="${INK}" stroke-width="${r*0.07}" fill="none"/>`
    : `${iris}<circle cx="${x - ex}" cy="${eyeY}" r="${r*0.085}" fill="${INK}"/><circle cx="${x + ex}" cy="${eyeY}" r="${r*0.085}" fill="${INK}"/>
       <circle cx="${x - ex + r*0.03}" cy="${eyeY - r*0.03}" r="${r*0.025}" fill="#fff"/><circle cx="${x + ex + r*0.03}" cy="${eyeY - r*0.03}" r="${r*0.025}" fill="#fff"/>`;
  return `<circle cx="${x}" cy="${cy}" r="${r}" fill="${SKIN}" stroke="${INK}" stroke-width="${r*0.09}"/>
    <path d="M${x + r*0.2} ${cy + r*0.95} a${r} ${r} 0 0 0 ${r*0.75} ${-r*0.9} a${r*1.1} ${r*1.1} 0 0 1 ${-r*0.75} ${r*0.9}z" fill="${SKIN_SH}"/>
    ${blush}${eyes}${lashes}${brow}${mouth}`;
}
function spikyHair(x, cy, r, col, dark) {
  // Messy spiked fringe sitting on the top of the head.
  const t = cy - r;
  return `<path d="M${x - r*1.02} ${cy - r*0.05}
    C${x - r*1.1} ${t - r*0.1}, ${x - r*0.6} ${t - r*0.45}, ${x - r*0.1} ${t - r*0.3}
    L${x + r*0.05} ${t - r*0.62} L${x + r*0.25} ${t - r*0.25} L${x + r*0.62} ${t - r*0.5} L${x + r*0.6} ${t - r*0.12}
    C${x + r*1.05} ${t + r*0.05}, ${x + r*1.1} ${cy - r*0.3}, ${x + r*1.02} ${cy - r*0.05}
    L${x + r*0.8} ${cy - r*0.32} L${x + r*0.55} ${cy - r*0.5} L${x + r*0.32} ${cy - r*0.28} L${x + r*0.1} ${cy - r*0.55}
    L${x - r*0.15} ${cy - r*0.3} L${x - r*0.42} ${cy - r*0.55} L${x - r*0.62} ${cy - r*0.25} L${x - r*0.82} ${cy - r*0.4} Z"
    fill="${col}" stroke="${INK}" stroke-width="${r*0.08}" stroke-linejoin="round"/>
    <path d="M${x - r*0.5} ${t - r*0.12} q${r*0.4} ${-r*0.15} ${r*0.7} ${r*0.05}" stroke="${dark}" stroke-width="${r*0.08}" fill="none" stroke-linecap="round" opacity=".7"/>`;
}

// Darrow as a Red Helldiver: rust frysuit, harness, red spiked hair.
function darrowRed(x, y, s, o = {}) {
  const r = s * 0.42, cy = y - s * 1.55 - r * 0.78;
  return `<g>${bell(x, y, s, '#b3362b', '#7d1f17')}
    <path d="M${x - s*0.22} ${y - s*1.45} L${x + s*0.36} ${y - s*0.55}" stroke="#3b3b40" stroke-width="${s*0.09}"/>
    <rect x="${x - s*0.5}" y="${y - s*0.62}" width="${s*1.0}" height="${s*0.12}" rx="${s*0.03}" fill="#3b3b40" stroke="${INK}" stroke-width="${s*0.03}"/>
    <rect x="${x - s*0.08}" y="${y - s*0.64}" width="${s*0.16}" height="${s*0.16}" fill="#c9a24a" stroke="${INK}" stroke-width="${s*0.025}"/>
    ${head(x, cy, r, { brow: o.brow || 'angry', mouth: o.mouth, closed: o.closed })}
    ${spikyHair(x, cy, r, '#a52617', '#d9452e')}
    ${o.label ? label(x, y + s*0.38, o.label, o.lc) : ''}</g>`;
}
// Darrow carved into a Gold: gold hair + gold eyes, red House Mars cloak, white wolf-pelt hood.
function darrowGold(x, y, s, o = {}) {
  const r = s * 0.42, cy = y - s * 1.55 - r * 0.78;
  const blade = o.blade ? `<path d="M${x + s*0.55} ${y - s*0.4} L${x + s*0.75} ${y - s*1.5} Q${x + s*1.15} ${y - s*2.1} ${x + s*0.65} ${y - s*2.45} Q${x + s*0.95} ${y - s*1.95} ${x + s*0.68} ${y - s*1.45} Z" fill="#dfe4ea" stroke="${INK}" stroke-width="${s*0.035}"/>` : '';
  const wolf = o.hood === false ? spikyHair(x, cy, r, '#e8b53a', '#fff0b0') : `
    ${spikyHair(x, cy, r, '#e8b53a', '#fff0b0')}
    <path d="M${x - r*1.3} ${cy + r*0.6} C${x - r*1.5} ${cy - r*1.5}, ${x + r*1.5} ${cy - r*1.5}, ${x + r*1.3} ${cy + r*0.6}
      L${x + r*1.0} ${cy + r*0.1} C${x + r*0.85} ${cy - r*0.6}, ${x - r*0.85} ${cy - r*0.6}, ${x - r*1.0} ${cy + r*0.1} Z" fill="#e9e6df" stroke="${INK}" stroke-width="${r*0.08}"/>
    <path d="M${x - r*1.0} ${cy - r*0.65} L${x - r*0.95} ${cy - r*1.75} L${x - r*0.35} ${cy - r*1.15} Z M${x + r*1.0} ${cy - r*0.65} L${x + r*0.95} ${cy - r*1.75} L${x + r*0.35} ${cy - r*1.15} Z" fill="#e9e6df" stroke="${INK}" stroke-width="${r*0.08}" stroke-linejoin="round"/>
    <path d="M${x - r*0.85} ${cy - r*1.0} L${x - r*0.84} ${cy - r*1.45} L${x - r*0.55} ${cy - r*1.12}Z M${x + r*0.85} ${cy - r*1.0} L${x + r*0.84} ${cy - r*1.45} L${x + r*0.55} ${cy - r*1.12}Z" fill="#c9a0a0"/>
    <path d="M${x - r*0.42} ${cy - r*0.95} Q${x} ${cy - r*1.25} ${x + r*0.42} ${cy - r*0.95} L${x + r*0.3} ${cy - r*0.55} Q${x} ${cy - r*0.4} ${x - r*0.3} ${cy - r*0.55} Z" fill="#d6d2c8" stroke="${INK}" stroke-width="${r*0.07}"/>
    <ellipse cx="${x}" cy="${cy - r*0.55}" rx="${r*0.14}" ry="${r*0.09}" fill="${INK}"/>
    <path d="M${x - r*0.58} ${cy - r*1.0} l${r*0.2} ${r*0.06} M${x + r*0.58} ${cy - r*1.0} l${-r*0.2} ${r*0.06}" stroke="${INK}" stroke-width="${r*0.08}" stroke-linecap="round"/>`;
  return `<g>${blade}${bell(x, y, s, '#b8291f', '#7a160f')}
    <path d="M${x - s*0.3} ${y - s*1.5} Q${x} ${y - s*1.2} ${x + s*0.3} ${y - s*1.5} L${x + s*0.2} ${y - s*1.15} Q${x} ${y - s*1.0} ${x - s*0.2} ${y - s*1.15} Z" fill="#f2efe8" stroke="${INK}" stroke-width="${s*0.03}"/>
    ${head(x, cy, r, { brow: o.brow || 'angry', iris: '#e0a326', mouth: o.mouth })}
    ${wolf}
    ${o.label ? label(x, y + s*0.38, o.label, o.lc) : ''}</g>`;
}
// Eo: red dress, long red hair with a braid, red haemanthus flower.
function eo(x, y, s, o = {}) {
  const r = s * 0.42, cy = y - s * 1.55 - r * 0.78;
  return `<g>
    <path d="M${x - r*1.05} ${cy} C${x - r*1.25} ${cy + r*1.6}, ${x - r*0.9} ${cy + r*2.4}, ${x - r*0.55} ${cy + r*2.6} L${x + r*0.55} ${cy + r*2.6} C${x + r*0.9} ${cy + r*2.4}, ${x + r*1.25} ${cy + r*1.6}, ${x + r*1.05} ${cy}Z" fill="#8f2015" stroke="${INK}" stroke-width="${r*0.08}"/>
    ${bell(x, y, s * 1.02, '#cc3b2e', '#8f2015')}
    <path d="M${x - s*0.62} ${y - s*0.18} Q${x} ${y - s*0.05} ${x + s*0.62} ${y - s*0.18}" stroke="#f0c9a0" stroke-width="${s*0.05}" fill="none"/>
    ${head(x, cy, r, { brow: o.brow || 'soft', mouth: o.mouth || 'smile', lashes: true, blush: true, closed: o.closed })}
    <path d="M${x - r*1.05} ${cy + r*0.1} C${x - r*1.15} ${cy - r*1.35}, ${x + r*1.15} ${cy - r*1.35}, ${x + r*1.05} ${cy + r*0.1}
      C${x + r*0.85} ${cy - r*0.55}, ${x + r*0.3} ${cy - r*0.6}, ${x - r*0.05} ${cy - r*0.78} C${x - r*0.35} ${cy - r*0.5}, ${x - r*0.8} ${cy - r*0.5}, ${x - r*1.05} ${cy + r*0.1}Z"
      fill="#a3261a" stroke="${INK}" stroke-width="${r*0.08}" stroke-linejoin="round"/>
    ${[0,1,2,3].map(i => `<ellipse cx="${x + r*1.05}" cy="${cy + r*0.55 + i*r*0.42}" rx="${r*0.2}" ry="${r*0.25}" fill="#a3261a" stroke="${INK}" stroke-width="${r*0.06}"/>`).join('')}
    <g transform="translate(${x - r*0.7} ${cy - r*0.62})">${Array.from({length:6},(_,i)=>`<line x1="0" y1="0" x2="${Math.cos(i*Math.PI/3)*r*0.38}" y2="${Math.sin(i*Math.PI/3)*r*0.38}" stroke="#e8251c" stroke-width="${r*0.12}" stroke-linecap="round"/>`).join('')}<circle r="${r*0.11}" fill="#ffd34d"/></g>
    ${o.label ? label(x, y + s*0.38, o.label, o.lc) : ''}</g>`;
}
// Generic NPC in the same style (Golds, Reds, Proctors). hair: color; gold eyes optional.
function npc(x, y, s, body, hair, o = {}) {
  const r = s * 0.42, cy = y - s * 1.55 - r * 0.78;
  const hairPath = `<path d="M${x - r*1.0} ${cy - r*0.1} C${x - r*1.0} ${cy - r*1.3}, ${x + r*1.0} ${cy - r*1.3}, ${x + r*1.0} ${cy - r*0.1} Q${x + r*0.4} ${cy - r*0.6} ${x - r*0.2} ${cy - r*0.45} Q${x - r*0.7} ${cy - r*0.4} ${x - r*1.0} ${cy - r*0.1}Z" fill="${hair}" stroke="${INK}" stroke-width="${r*0.08}"/>`;
  return `<g opacity="${o.op ?? 1}">${bell(x, y, s, body, o.shade || 'rgba(0,0,0,.35)')}${head(x, cy, r, { brow: o.brow, mouth: o.mouth, iris: o.iris, closed: o.closed })}${hair ? hairPath : ''}${o.crown ? `<path d="M${x - r*0.6} ${cy - r*0.95} l${r*0.2} ${-r*0.5} l${r*0.2} ${r*0.3} l${r*0.2} ${-r*0.45} l${r*0.2} ${r*0.45} l${r*0.2} ${-r*0.3} l${r*0.2} ${r*0.5}z" fill="#f0b63c" stroke="${INK}" stroke-width="${r*0.06}"/>` : ''}${o.x ? xMark(x, cy, r*1.2) : ''}${o.label ? label(x, y + s*0.38, o.label, o.lc) : ''}</g>`;
}
function xMark(x, y, r) { return `<g stroke="#e8372c" stroke-width="${r*0.16}" stroke-linecap="round"><line x1="${x-r}" y1="${y-r}" x2="${x+r}" y2="${y+r}"/><line x1="${x+r}" y1="${y-r}" x2="${x-r}" y2="${y+r}"/></g>`; }
function label(x, y, t, c) { return `<text x="${x}" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="40" fill="${c || '#f3e6c8'}">${t}</text>`; }

// ---------- The user's Institute map, redrawn as vector (same regions, labels and layout) ----------
function mtn(x, y, s) { return `<path d="M${x - s} ${y} L${x} ${y - s*1.15} L${x + s} ${y} Z" fill="#9a7650" stroke="#5c4128" stroke-width="3"/><path d="M${x} ${y - s*1.15} L${x + s} ${y} L${x + s*0.25} ${y} Z" fill="#6f5235"/>`; }
function tree(x, y, s) { return `<path d="M${x} ${y - s*1.6} L${x + s*0.6} ${y} L${x - s*0.6} ${y} Z" fill="#3d5a34"/>`; }
function hill(x, y, s) { return `<path d="M${x - s} ${y} A${s} ${s*0.8} 0 0 1 ${x + s} ${y}" fill="none" stroke="#7a5c3a" stroke-width="4"/>`; }
function rng(seed) { let v = seed; return () => (v = (v * 9301 + 49297) % 233280) / 233280; }

function instituteMap(o = {}) {
  // Map occupies x 0..1080, y 560..1640 (1080 x 1080 square).
  const Y = 560, W = 1080, H = 1080, R = rng(7);
  let g = `<rect x="0" y="${Y}" width="${W}" height="${H}" fill="#e2c48a"/>`;
  for (let i = 0; i < 120; i++) g += `<path d="M${R()*W} ${Y + R()*H} l6 -4 l6 4" stroke="#c9a76c" stroke-width="2" fill="none"/>`;
  // South Sea
  g += `<path d="M300 ${Y+860} Q360 ${Y+830} 420 ${Y+860} T540 ${Y+860} T660 ${Y+860} T780 ${Y+860} T900 ${Y+860} T1020 ${Y+860} L1080 ${Y+850} L1080 ${Y+H} L300 ${Y+H} Z" fill="#8fa9b6" stroke="#5f7d8c" stroke-width="4"/>`;
  // Mountains (west + north)
  const mts = [];
  for (let i = 0; i < 70; i++) { const x = 20 + R()*300, y = Y + 40 + R()*620; if (!(x > 230 && y > Y+420)) mts.push([x, y, 22 + R()*16]); }
  for (let i = 0; i < 26; i++) mts.push([140 + R()*240, Y + 20 + R()*140, 20 + R()*12]);
  for (let i = 0; i < 22; i++) mts.push([520 + R()*260, Y + 80 + R()*200, 22 + R()*14]);
  mts.sort((a, b) => a[1] - b[1]).forEach(([x, y, s]) => g += mtn(x, y, s));
  // North woods
  for (let i = 0; i < 80; i++) g += tree(360 + R()*200, Y + 20 + R()*160, 10);
  // Greatwoods (dense)
  for (let i = 0; i < 520; i++) { const a = R()*Math.PI*2, d = Math.sqrt(R()); const x = 740 + Math.cos(a)*d*280, y = Y + 560 + Math.sin(a)*d*230; g += tree(x, y, 9); }
  // Postern hills
  for (let i = 0; i < 26; i++) g += hill(860 + R()*200, Y + 80 + R()*260, 18 + R()*8);
  // Rivers
  g += `<path d="M420 ${Y} Q425 ${Y+140} 410 ${Y+230} L395 ${Y+840} M410 ${Y+230} Q420 ${Y+160} 455 ${Y+60} Q470 ${Y+20} 480 ${Y} M410 ${Y+230} L560 ${Y+240} L640 ${Y+170} M640 ${Y+170} L700 ${Y+140}"
        stroke="#5f7d8c" stroke-width="16" fill="none" stroke-linejoin="round"/>
        <path d="M420 ${Y} Q425 ${Y+140} 410 ${Y+230} L395 ${Y+840} M410 ${Y+230} Q420 ${Y+160} 455 ${Y+60} Q470 ${Y+20} 480 ${Y} M410 ${Y+230} L560 ${Y+240} L640 ${Y+170} M640 ${Y+170} L700 ${Y+140}"
        stroke="#a9c3cf" stroke-width="9" fill="none" stroke-linejoin="round"/>`;
  const L = (x, y, t, sz = 34) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${sz}" fill="#2a1d12" stroke="#e2c48a" stroke-width="6" paint-order="stroke">${t}</text>`;
  g += L(170, Y + 420, 'MOUNTAINS') + L(380, Y + 120, 'NORTH WOODS') + L(670, Y + 330, 'HIGHLANDS') + L(780, Y + 560, 'GREATWOODS') + L(950, Y + 70, 'POSTERN HILLS', 30) + L(560, Y + 960, 'SOUTH SEA');
  g += `<rect x="0" y="${Y}" width="${W}" height="${H}" fill="none" stroke="#5c4128" stroke-width="8"/>`;
  return g + (o.overlay || '');
}
// Banner flag pinned on the map.
function flag(x, y, col, glyph = '', o = {}) {
  return `<g opacity="${o.op ?? 1}"><line x1="${x}" y1="${y}" x2="${x}" y2="${y - 90}" stroke="#2a1d12" stroke-width="6"/>
    <path d="M${x} ${y - 90} h70 l-14 22 l14 22 h-70 z" fill="${col}" stroke="#2a1d12" stroke-width="4"/>
    <text x="${x + 28}" y="${y - 56}" text-anchor="middle" font-family="Anton" font-size="28" fill="#fff">${glyph}</text>
    ${o.x ? xMark(x + 30, y - 68, 26) : ''}</g>`;
}
function marsWolfFlag(x, y) { return flag(x, y, '#c8312b', 'Ʌ'); }
module.exports = { darrowRed, darrowGold, eo, npc, instituteMap, flag, label, xMark, mtn, tree };
