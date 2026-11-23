// GOLDEN SON in 2 minutes: all beats, chibi v2 cast in lit sets, calm camera.
// Each beat: start/pop cue (spoken words), captions, mood, art(t, p, pt) -> SVG (world space 1080x1920).
const L = require('./lighting.js'), K = require('./cast.js'), ACT = require('./shots/action-preview.js'), OTS = require('./shots/ots-frames.js');
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v)), io = u => { u = cl(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eo = u => 1 - Math.pow(1 - cl(u), 3), lerp = (a, b, u) => a + (b - a) * u;
const f = v => v.toFixed(1);
const RIM = (svg, mood, o = {}) => L.rimLight(svg, mood, o);
const T = (x, y, t, sz = 44, fill = '#f6ead2', op = 1) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${sz}" fill="${fill}" opacity="${op}">${t}</text>`;
const fade = (svg, u) => `<g opacity="${cl(u).toFixed(3)}">${svg}</g>`;
const slideIn = (svg, dx, u) => `<g transform="translate(${f(dx * (1 - eo(u)))} 0)" opacity="${cl(u * 2).toFixed(3)}">${svg}</g>`;
const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>
  <filter id="sepia" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.45 0.4 0.15 0 0.05  0.38 0.36 0.13 0 0.03  0.28 0.27 0.1 0 0.01  0 0 0 1 0"/></filter>`;
const room = (mood, t, o = {}) => mood === 'gala' && !o.color ? `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: o.floorY || 1470, par: o.par || 0 })}</g>` : L.skyOrRoom(mood, t, { floorY: o.floorY || 1470, ...o });
const TY = 1560;
const tableG = (t, o = {}) => { const land = o.land ?? -9, j = t > land ? Math.exp(-(t - land) * 8) * Math.sin((t - land) * 40) : 0, tip = cl((t - land) * 5), cloth = o.cloth || '#2b4a8a', trim = o.trim || '#d8e0ea', deep = o.deep || '#1b2f5c';
  const gob = (x, k, spill) => `<g transform="translate(${x} ${TY - Math.abs(j) * k}) rotate(${spill ? tip * 80 : j * k * .2})"><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5"/><rect x="-17" y="-94" width="34" height="12" fill="#8f1a16"/></g>`;
  const plate = (x, k) => `<g transform="translate(${x} ${TY - 6 - Math.abs(j) * k})"><ellipse rx="80" ry="15" fill="#eef1f5" stroke="#1b1210" stroke-width="5"/><ellipse rx="50" ry="8" fill="#cfd6df"/></g>`;
  return `<rect x="-300" y="${TY}" width="1680" height="800" fill="${cloth}"/><rect x="-300" y="${TY}" width="1680" height="20" fill="${trim}"/><rect x="-300" y="${TY + 20}" width="1680" height="60" fill="${deep}"/>`
    + (o.bare ? '' : plate(130, 50) + plate(980, 30) + gob(230, 45, false) + gob(640, 40, land > -9) + gob(1060, 25, false) + (t > land && land > -9 ? `<path d="M650 ${TY + 2} q${110 * eo((t - land) * 1.5)} -8 ${200 * eo((t - land) * 1.5)} 6" stroke="#a81f1c" stroke-width="12" stroke-linecap="round" fill="none"/>` : ''));
};
const fg = (dx = 0, col = '#0b0a18') => L.dof('near', `<path d="M${-120 + dx} 1920 V1240 q100 -130 200 0 V1920Z M${1000 + dx} 1920 V1300 q90 -110 180 0 V1920Z" fill="${col}"/>`);
const cam = (t, dur, z0, z1, fx = 540, fy = 1100, dx = 0) => { const u = io(t / Math.max(dur, 0.01)), z = lerp(z0, z1, u); return `translate(540 ${960}) scale(${f(z * 100) / 100}) translate(${f(-(fx + dx * u))} ${-fy})`; };
const W = (svg, t, dur, z0 = 1, z1 = 1.06, fx = 540, fy = 1100, dx = 0) => `<g transform="${cam(t, dur, z0, z1, fx, fy, dx)}">${svg}</g>`;
const banner = (x, y, w, h, col, emb) => `<path d="M${x} ${y} h${w} v${h} l${-w / 2} ${-h * .14} l${-w / 2} ${h * .14} Z" fill="${col}" stroke="#1b1210" stroke-width="7"/>${emb}`;
const device = (x, y, t, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="30" fill="#2a2a30" stroke="#1b1210" stroke-width="6"/><circle r="10" fill="#ff3a2a" opacity="${(0.55 + 0.45 * Math.sin(t * 8)).toFixed(2)}"/>${L.glow(0, 0, 50, '#ff3a2a', .35 + .25 * Math.sin(t * 8))}</g>`;
const boxG = (x, y, open = 0) => `<g transform="translate(${x} ${y})"><rect x="-150" y="-110" width="300" height="130" rx="10" fill="#3a1c12" stroke="#1b0e08" stroke-width="6"/><g transform="translate(-160 -110) rotate(${-open * 35})"><rect x="0" y="-32" width="320" height="42" rx="10" fill="#5a2c18" stroke="#1b0e08" stroke-width="6"/></g><rect x="-22" y="-112" width="44" height="50" rx="6" fill="#e2a93b" stroke="#1b0e08" stroke-width="5"/></g>`;
const blade = (x, y, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0 q60 25 52 150 q-40 -60 -38 -148Z" fill="#e6ebf1" stroke="#1b1210" stroke-width="6"/><rect x="-14" y="-40" width="22" height="46" rx="5" fill="#3a2418" stroke="#1b1210" stroke-width="5"/></g>`;
const holo = (x, y, t, inner) => `<g transform="translate(${x} ${y})">${L.glow(0, -120, 260, '#7fd3ff', .45)}<path d="M-150 0 L150 0 L90 -330 L-90 -330 Z" fill="#7fd3ff" opacity=".18"/><g opacity="${(0.75 + .15 * Math.sin(t * 6)).toFixed(2)}">${inner}</g><rect x="-40" y="0" width="80" height="40" rx="8" fill="#2a3a4a" stroke="#1b1210" stroke-width="5"/></g>`;
const streaks = (t, n = 40, par = 0) => { let o = ''; for (let i = 0; i < n; i++) { const sp = 0.5 + ((i * 37) % 10) / 14, ph = ((i * 61) % 100) / 100, k = ((t * sp * 0.55 + ph) % 1), x0 = ((i * 211) % 1500) - 150, far = i % 3;
    const x = x0 - 260 * k + par * (far ? .4 : .9), y = -250 + 1500 * k, len = far ? 130 : 240, wd = far ? 5 : 10;
    o += `<g opacity="${((far ? .55 : .95) * Math.min(1, k * 6) * (1 - Math.pow(k, 6))).toFixed(2)}"><line x1="${f(x + len * .17)}" y1="${f(y - len)}" x2="${f(x)}" y2="${f(y)}" stroke="#ffcf7a" stroke-width="${wd}" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="${wd * 1.1}" fill="#fff"/></g>`; } return L.screen(o); };
const crowd = (n, y, s, seed = 1, col = '#14141c') => { let o = ''; for (let i = 0; i < n; i++) { const x = ((i * 191 + seed * 53) % 1300) - 110, sc = s * (0.85 + ((i * 7) % 5) / 15); o += `<g opacity=".9"><circle cx="${x}" cy="${y - sc * 1.9}" r="${sc * .38}" fill="${col}"/><path d="M${x - sc * .5} ${y} Q${x - sc * .5} ${y - sc * 1.5} ${x} ${y - sc * 1.55} Q${x + sc * .5} ${y - sc * 1.5} ${x + sc * .5} ${y}Z" fill="${col}"/></g>`; } return o; };


// ---------------- OPENING (6.4 s): boot smashes the steak -> plates explode, wine stains Cassius -> two steps -> OTS "Cassius." / OTS "Darrow."
const OPEN = 6.4, LAND = 0.55, WINE_HIT = 1.75;
const shards = (cx, cy, k, n = 10, seed = 1) => { if (k <= 0 || k > 1.4) return ''; let o = '';
  for (let i = 0; i < n; i++) { const a = -Math.PI * (0.1 + 0.8 * ((i * 37 + seed * 13) % 100) / 100), v = 260 + ((i * 53) % 160), x = cx + Math.cos(a) * v * k, y = cy + Math.sin(a) * v * k + 520 * k * k, r = (i * 47) % 360 + k * 600;
    o += `<path d="M${f(x)} ${f(y)} l18 -8 l10 22 l-24 6 Z" fill="#eef1f5" stroke="#1b1210" stroke-width="4" transform="rotate(${f(r)} ${f(x)} ${f(y)})" opacity="${f(cl(1.4 - k))}"/>`; } return o; };
const stainOn = (t, x, y, s) => t >= WINE_HIT ? `<g opacity="${f(cl((t - WINE_HIT) / .2))}">${OTS.wine(x, y, s)}</g>` : '';
function opening(t) {
  // 1) close-up: steaming steak, boot slams down
  if (t < 1.3) { const fall = t < LAND ? -900 * Math.pow(1 - t / LAND, 2) : 0, k = (t - LAND) / .9, crushed = t >= LAND;
    const steam = crushed ? '' : Array.from({ length: 4 }, (_, i) => { const u = ((t * .9 + i * .25) % 1); return `<path d="M${470 + i * 50 + 20 * Math.sin(u * 6 + i)} ${1150 - 260 * u} q-24 -40 6 -80 q26 -40 0 -80" stroke="#fff" stroke-width="12" fill="none" stroke-linecap="round" opacity="${f(.45 * Math.sin(Math.PI * u))}"/>`; }).join('');
    const boot = `<g transform="translate(560 ${f(1190 + fall)})"><rect x="-120" y="-760" width="230" height="640" rx="30" fill="#9a6f22" stroke="#1b1210" stroke-width="10"/><rect x="-128" y="-420" width="246" height="40" fill="#e2b65a" stroke="#1b1210" stroke-width="8"/><path d="M-120 -140 L110 -140 Q260 -110 250 -10 L-130 -10 Z" fill="#141218" stroke="#1b1210" stroke-width="10" stroke-linejoin="round"/><rect x="-140" y="-24" width="400" height="30" rx="10" fill="#0a0808"/></g>`;
    let w = `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: 1000 })}</g><rect x="0" y="1200" width="1080" height="720" fill="#2b4a8a"/><rect x="0" y="1200" width="1080" height="26" fill="#d8e0ea"/>`
      + `<g transform="translate(540 1230) scale(2.2) translate(-540 -1230)">${crushed ? '' : OTS.steak(540, 1230, 1, false)}</g>` + steam
      + (crushed ? `<g transform="translate(540 1230) scale(2.2) translate(-540 -1230)">${OTS.steak(540, 1230, 1, true)}</g>` : '') + shards(540, 1210, k, 14, 3) + boot
      + (crushed ? ACT_IMPACT(540, 1180, k) : '');
    const sh = crushed && t < LAND + .3 ? Math.exp(-(t - LAND) * 14) * 22 : 0;
    return `<g transform="translate(${f(sh * Math.sin(t * 90))} ${f(sh * Math.cos(t * 77))})">${w}</g>` + (crushed && t < LAND + .12 ? `<rect width="1080" height="1920" fill="#fff" opacity="${f(.6 * (1 - (t - LAND) / .12))}"/>` : ''); }
  // 2) wide: plates explode off the table, wine flies onto Cassius, Darrow takes two steps
  if (t < 2.75) { const k = (t - LAND) / 1.1, walk = cl((t - 1.95) / .8), DX = 400 + 70 * walk, step = Math.abs(Math.sin(walk * Math.PI * 2)) * 16;
    const wu = cl((t - 1.35) / (WINE_HIT - 1.35)), wx = lerp(650, 760, wu), wy = 1470 - 220 * Math.sin(Math.PI * wu) + 0 * wu;
    const wine = t > 1.35 && t < WINE_HIT + .15 ? `<path d="M650 1480 Q${f(lerp(650, 705, wu))} ${f(1250)} ${f(wx)} ${f(wy)}" stroke="#8f1018" stroke-width="16" fill="none" stroke-linecap="round" opacity=".9"/>` + Array.from({ length: 5 }, (_, i) => `<circle cx="${f(wx - i * 14)}" cy="${f(wy - i * 6)}" r="${10 - i}" fill="#8f1018"/>`).join('') : '';
    return W(room('gala', t) + RIM(K.cassius(790, TY + 310, 330, { yaw: -18, brow: t > WINE_HIT ? 'angry' : 'soft', mouth: t > WINE_HIT ? 'frown' : 'flat', arms: ['table', 'table'] }), 'gala') + stainOn(t, 790, TY + 310, 330)
      + tableG(t, { land: LAND }) + shards(130, TY - 10, k, 9, 5) + shards(980, TY - 10, k * .9, 9, 8) + wine
      + L.floorShadow(DX, TY + 6, 290, { mood: 'gala' }) + `<g transform="translate(0 ${f(-step)})">${RIM(K.darrow(DX, TY, 340, { yaw: 14, mouth: 'smirk', arms: ['hang', 'hang'], wind: t }), 'gala')}</g>`, t - 1.3, 1.45, 1.08, 1.0, 560, 1080) + fg(-30); }
  // 3) OTS over Cassius: "Cassius."   4) swing -> OTS over Darrow: "Darrow."
  const SW = 4.35, sw = cl((t - SW) / .3), A = OTS.FRAMES['ots-cassius'](), B = OTS.FRAMES['ots-darrow']();
  const pushA = 1 + .04 * cl((t - 2.75) / 1.6), pushB = 1 + .04 * cl((t - SW) / 2);
  const ga = `<g transform="translate(${f(-1080 * eo(sw))} 0) translate(540 960) scale(${f(pushA)}) translate(-540 -960)">${A}</g>`;
  const gb = sw > 0 ? `<g transform="translate(${f(1080 * (1 - eo(sw)))} 0) translate(540 960) scale(${f(pushB)}) translate(-540 -960)">${B}</g>` : '';
  const blur = sw > 0 && sw < 1 ? Array.from({ length: 10 }, (_, i) => `<rect x="0" y="${i * 200 + 40}" width="1080" height="18" fill="#fff" opacity=".12"/>`).join('') : '';
  return ga + gb + blur;
}
const ACT_IMPACT = (x, y, u) => { if (u < 0 || u > 1) return ''; let o = ''; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, r0 = 40 + 300 * eo(u), r1 = r0 + 130 * (1 - u); o += `<line x1="${f(x + Math.cos(a) * r0)}" y1="${f(y + Math.sin(a) * r0 * .5)}" x2="${f(x + Math.cos(a) * r1)}" y2="${f(y + Math.sin(a) * r1 * .5)}" stroke="#fff6d0" stroke-width="${f(14 * (1 - u))}" stroke-linecap="round"/>`; } return o; };

const BEATS = [
  { fixed: true, t0f: 0, t1f: OPEN, l1: '', mood: 'gala', dialog: [[2.95, 'CASSIUS.'], [4.75, 'DARROW.']], art: (t) => opening(t) },
  // 1. continues from the opening: Darrow on the table, Cassius stained
  { start: 'house bellona wants', pop: 'so he walks', l1: 'HOUSE BELLONA WANTS HIM DEAD.', l2: 'SO HE WALKS ACROSS THEIR TABLE.', mood: 'gala',
    art: (t, p, pt, d) => W(room('gala', t) + RIM(K.cassius(790, TY + 310, 330, { yaw: -18, brow: 'angry', mouth: 'frown', arms: ['table', 'table'] }), 'gala') + OTS.wine(790, TY + 310, 330) + tableG(t, { land: -8 })
      + L.floorShadow(470, TY + 6, 290, { mood: 'gala' }) + RIM(K.darrow(470, TY, 340, { yaw: 14, mouth: 'smirk', arms: ['hang', 'hang'], wind: t }), 'gala'), t, d, 1.0, 1.1, 580, 1060, -40) + fg(-30) },
  // 2. rewind
  { start: 'how did he', l1: 'HOW DID HE GET HERE?', mood: 'gala',
    art: (t, p, pt, d) => `<g filter="url(#sepia)">${W(room('gala', t) + RIM(K.cassius(790, TY + 310, 330, { yaw: -18, brow: 'angry', mouth: 'frown' }), 'gala') + tableG(t) + RIM(K.darrow(400, TY, 340, { yaw: 14, mouth: 'smirk', arms: ['hang', 'blade'] }), 'gala'), t, d, 1.12, 1.0, 500, 1060)}</g>`
      + Array.from({ length: 9 }, (_, i) => `<rect x="0" y="${((i * 233 + t * 2600) % 1920)}" width="1080" height="${6 + (i % 3) * 5}" fill="#fff" opacity=".12"/>`).join('') },
  // 3. serves Augustus
  { start: 'years after', pop: 'the man who', l1: 'HE SERVES THE ARCHGOVERNOR.', l2: 'THE MAN WHO HANGED HIS WIFE.', mood: 'mars',
    art: (t, p, pt, d) => W(room('mars', t, { sunX: 800, sunH: 380, floorY: 1440 }) + banner(130, 520, 200, 520, '#8f1d16', '') + banner(750, 520, 200, 520, '#8f1d16', '')
      + L.floorShadow(640, 1640, 300, { mood: 'mars' }) + RIM(K.augustus(640, 1640, 360, { yaw: -10, arms: ['hip', 'hang'] }), 'mars') + RIM(K.darrow(300, 1660, 300, { yaw: 16, mouth: p ? 'frown' : 'flat', brow: p ? 'angry' : 'soft', arms: ['hang', 'hang'], wind: t }), 'mars'), t, d, 1, 1.07, 500, 1120) },
  // 4. Academy loss
  { start: 'then he loses', pop: 'karnus au', l1: 'THEN HE LOSES.', l2: 'KARNUS AU BELLONA BEATS HIM.', mood: 'space',
    art: (t, p, pt, d) => { const boom = (x, y, r, t0) => { const k = cl((t - t0) / 1.2); return k <= 0 ? '' : L.glow(x, y, r * (0.4 + eo(k)), '#ffb04a', 0.9 * (1 - k * .6)) + L.glow(x, y, r * .35 * (0.5 + eo(k)), '#fff3c4', 1 - k); };
      return W(room('space', t, { deck: true, floorY: 1440 }) + boom(760, 720, 240, 0.3) + boom(880, 1000, 160, 1.1) + boom(620, 1120, 120, 1.9)
        + (p ? slideIn(RIM(K.karnus(800, 1660, 340, { yaw: -14, mouth: 'smirk', arms: ['hip', 'hang'] }), 'space'), 300, pt / .5) : '')
        + RIM(K.darrow(320, 1660, 330, { yaw: 18, brow: 'sad', mouth: 'frown', arms: ['hang', 'hang'] }), 'space'), t, d, 1, 1.06, 540, 1120); } },
  // 5. contract for sale
  { start: 'augustus moves', pop: 'darrow is finished', l1: 'AUGUSTUS MOVES TO SELL HIS CONTRACT.', l2: 'DARROW IS FINISHED.', mood: 'mars',
    art: (t, p, pt, d) => { const tag = `<g transform="translate(330 ${1180 + 8 * Math.sin(t * 2)}) rotate(-8)"><rect x="-130" y="-60" width="260" height="120" rx="14" fill="#f3e6c8" stroke="#1b1210" stroke-width="7"/><circle cx="-100" cy="0" r="12" fill="#1b1210"/><text x="15" y="18" text-anchor="middle" font-family="Anton" font-size="52" fill="#a81f1c">FOR SALE</text></g>`;
      return W(room('mars', t, { sunX: 240, sunH: 260, floorY: 1440 }) + RIM(K.augustus(760, 1640, 360, { yaw: 40, arms: ['cross', 'hang'] }), 'mars') + RIM(K.darrow(330, 1660, 300, { yaw: 12, brow: 'sad', mouth: 'frown' }), 'mars') + fade(tag, (t - .5) / .4), t, d, 1.04, 1.0, 540, 1120); } },
  // 6. bomb offer
  { start: 'the rebels offer', pop: 'carry a bomb', l1: 'THE REBELS HAVE ONE LAST MOVE.', l2: 'A BOMB AT THE GALA.', mood: 'mine',
    art: (t, p, pt, d) => W(room('mine', t, { floorY: 1450 }) + RIM(K.harmony(330, 1660, 320, { yaw: 16, arms: ['hang', 'table'] }), 'mine') + (p ? device(440, 1180, t) : '') + RIM(K.darrow(760, 1660, 330, { yaw: -16, brow: 'angry', mouth: 'flat' }), 'mine'), t, d, 1, 1.07, 540, 1120) },
  // 7. never sets it off
  { start: 'he carries it', pop: 'and never', l1: 'HE CARRIES IT IN...', l2: 'AND NEVER SETS IT OFF.', l2color: 'gold', mood: 'gala',
    art: (t, p, pt, d) => W(room('gala', t) + crowd(10, 1500, 120, 3) + RIM(K.darrow(540, 1680, 380, { yaw: -6, brow: p ? 'angry' : 'soft', mouth: 'flat', arms: ['hang', 'table'] }), 'gala') + device(560, 1220 + (p ? 80 * eo(pt / .6) : 0), t, p ? 1 - .6 * eo(pt / .6) : 1), t, d, 1.0, 1.1, 540, 1120) },
  // 8. challenge
  { start: 'instead he climbs', pop: 'in front of', l1: 'HE CHALLENGES CASSIUS TO A DUEL.', l2: 'IN FRONT OF EVERYONE.', mood: 'gala',
    art: (t, p, pt, d) => W(room('gala', t) + crowd(14, 1460, 110, 5) + RIM(K.sovereign(880, 1450, 230, { yaw: -20 }), 'gala') + RIM(K.cassius(780, TY + 310, 320, { yaw: -18, brow: 'angry', mouth: 'frown' }), 'gala') + tableG(t)
      + RIM(K.darrow(360, TY, 330, { yaw: 16, mouth: 'smirk', arms: ['hang', 'blade'], wind: t }), 'gala'), t, d, 1.05, 0.98, 540, 1080) },
  // 9. duel (whip-razors, arm cut timed to 'he takes')
  { start: 'darrow wins', pop: 'he takes', l1: 'DARROW WINS.', l2: "HE TAKES CASSIUS'S SWORD ARM.", mood: 'gala', art: (t) => ACT.duel(Math.min(5.55, t + 2.12)).svg },
  // 10. Sovereign / bloodbath
  { start: 'the sovereign stops', pop: 'and the gala', l1: 'THE SOVEREIGN STOPS THE DUEL.', l2: 'THE GALA BECOMES A BLOODBATH.', mood: 'gala',
    art: (t, p, pt, d) => p ? `<g>${room('gala', t, { color: true })}</g><rect width="1080" height="1920" fill="#7a0d0d" opacity=".55"/>` + crowd(16, 1640, 160, 2, '#0a0505') + crowd(10, 1820, 220, 7, '#000') + L.dust(3, t, { count: 50, color: '#ff6a4a', opacity: .5 })
      : W(room('gala', t) + crowd(12, 1500, 110, 4) + RIM(K.sovereign(540, 1660, 360, { arms: ['hang', 'raise'], yaw: 0 }), 'gala'), t, d, 1, 1.06, 540, 1120) },
  // 11. civil war
  { start: 'just like that', pop: 'civil war', l1: 'JUST LIKE THAT...', l2: 'CIVIL WAR.', mood: 'void',
    art: (t, p, pt, d) => `<rect width="540" height="1920" fill="#5e1012"/><rect x="540" width="540" height="1920" fill="#162a54"/>` + W(banner(110, 560, 320, 820, '#a81f1c', K.cassius ? `<g transform="translate(270 900)">${require('./chibi2.js').lionFace(0, 0, 110, '#b8862a', '#e6bb5c', '#5a3a10')}</g>` : '')
      + banner(650, 560, 320, 820, '#2b4a8a', `<g transform="translate(810 900)">${require('./rig.js').eagle(0, 0, 520, '#d8e0ea')}</g>`) + T(270, 1500, 'AUGUSTUS', 56) + T(810, 1500, 'BELLONA', 56)
      + (p ? `<path d="M540 ${560} L520 900 L560 1150 L530 1500" stroke="#fff" stroke-width="10" fill="none" opacity="${eo(pt / .3).toFixed(2)}"/>` : ''), t, d, 1, 1.05, 540, 1060) },
  // 12. Ragnar
  { start: 'darrow builds', pop: 'ragnar', l1: 'DARROW BUILDS AN ARMY.', l2: 'RAGNAR. AN OBSIDIAN HE SETS FREE.', l2color: 'gold', mood: 'space',
    art: (t, p, pt, d) => W(room('space', t, { deck: true, floorY: 1440 }) + (p ? slideIn(RIM(K.ragnar(720, 1680, 360, { yaw: -12 }), 'space'), 260, pt / .5) : '') + RIM(K.darrow(300, 1680, 320, { yaw: 16, arms: ['hang', 'table'] }), 'space'), t, d, 1, 1.06, 540, 1120) },
  // 13. Lorn
  { start: 'lorn the old', pop: 'who taught', l1: 'LORN, THE OLD RAGE KNIGHT.', l2: 'WHO TAUGHT HIM THE BLADE.', l2color: 'gold', mood: 'void',
    art: (t, p, pt, d) => W(L.skyOrRoom('void', t, { floorY: 1450 }) + L.glow(540, 900, 600, '#9fc0ff', .25) + L.dust(5, t, { count: 50, color: '#e8f2ff', opacity: .6 }) + RIM(K.lorn(560, 1680, 360, { yaw: -8, arms: ['hang', 'blade'] }), 'void'), t, d, 1, 1.07, 540, 1120) },
  // 14. Sevro + Howlers (one woman, one with normal blonde hair)
  { start: 'sevro and his', pop: 'howlers', l1: 'SEVRO...', l2: 'AND HIS HOWLERS.', l2color: 'gold', mood: 'mars',
    art: (t, p, pt, d) => { const H = [[170, 14, { hair: 'long', kitOverride: { hairLong: true, hair: 'short', hairCol: '#3a2418', over: [] } }], [380, 14, { kitOverride: { hair: 'short', hairCol: '#e6c46a', over: [] } }], [700, -14, { kitOverride: { over: ['mohawk'], hairCol: '#2a2420' } }], [910, -14, { kitOverride: { hair: 'short', hairCol: '#8a5a2a', over: [] } }]];
      return W(room('mars', t, { sunX: 760, sunH: 300, floorY: 1440 }) + (p ? H.map(([x, yw, o], i) => slideIn(RIM(K.sevro(x, 1600, 230, { yaw: yw, mouth: 'flat', brow: 'angry', ...o }), 'mars'), i < 2 ? -200 : 200, (pt - i * .08) / .4)).join('') : '')
        + RIM(K.sevro(540, 1700, 330, { yaw: 0, mouth: 'smirk', arms: ['hip', 'hip'] }), 'mars'), t, d, 1, 1.06, 540, 1120); } },
  // 15-16. Iron Rain (one continuous action shot: drop, wolf jaws on Karnus, two more cuts)
  { start: 'then he drops', pop: 'the iron rain', l1: 'HE DROPS HIS ARMY FROM ORBIT.', l2: 'THE IRON RAIN.', l2color: 'gold', mood: 'mars', art: (t) => ACT.rain(t).svg },
  { start: 'darrow takes the', l1: 'MARS FALLS.', l2: 'TO DARROW.', l2color: 'gold', mood: 'mars', popAt: 0.2, art: (t) => ACT.rain(5.4 + t).svg },
  // 17. Ares is Fitchner
  { start: 'and he learns', pop: 'is fitchner', l1: 'WHO LEADS THE REBELLION?', l2: 'ARES... IS FITCHNER.', mood: 'void',
    art: (t, p, pt, d) => W(L.skyOrRoom('void', t, { floorY: 1450 }) + L.glow(540, 1000, 500, '#ff4a3a', .25) + (p ? fade(RIM(K.fitchner(540, 1700, 350, { yaw: -6, mouth: 'smirk', arms: ['hang', 'table'] }), 'void'), pt / .4) + `<g transform="translate(700 ${1270 + 40 * eo(pt / .5)})">${K.ares(0, 0, 360 * (1 - .3 * eo(pt / .5)))}</g>` : `<g transform="translate(540 ${1150 + 6 * Math.sin(t * 3)})">${K.ares(0, 0, 700)}</g>`), t, d, 1, 1.06, 540, 1120) },
  // 18. Proctor / Sevro's father
  { start: 'his old proctor', pop: "sevro's father", l1: 'HIS OLD PROCTOR.', l2: "SEVRO'S FATHER.", l2color: 'gold', mood: 'void',
    art: (t, p, pt, d) => W(L.skyOrRoom('void', t, { floorY: 1450 }) + L.glow(540, 1000, 520, '#ffd98a', .2) + RIM(K.fitchner(380, 1700, 350, { yaw: 14, mouth: 'smirk' }), 'void') + (p ? slideIn(RIM(K.sevro(760, 1700, 290, { yaw: -16, mouth: 'flat', brow: 'angry' }), 'void'), 220, pt / .45) : ''), t, d, 1, 1.06, 540, 1120) },
  // 19. Mustang to the mines
  { start: 'he takes mustang', pop: 'to the mines', l1: 'HE TAKES MUSTANG HOME.', l2: 'TO THE MINES OF LYKOS.', l2color: 'gold', mood: 'mine',
    art: (t, p, pt, d) => W(room('mine', t, { floorY: 1450 }) + RIM(K.darrow(380, 1680, 330, { yaw: 14, brow: 'soft', mouth: 'flat' }), 'mine') + RIM(K.mustang(720, 1680, 310, { yaw: -14, mouth: 'flat' }), 'mine'), t, d, 1, 1.07, 540, 1120) },
  // 20. born a Red
  { start: 'and shows her', pop: 'he was born', l1: 'HE SHOWS HER THE TRUTH.', l2: 'HE WAS BORN A RED.', mood: 'mine',
    art: (t, p, pt, d) => W(room('mine', t, { floorY: 1450 }) + RIM(K.mustang(300, 1680, 310, { yaw: 16, brow: p ? 'sad' : 'soft', mouth: p ? 'frown' : 'flat' }), 'mine') + holo(720, 1640, t, p ? K.red(0, -60, 150, { yaw: -10 }) : K.darrow(0, -60, 150, { yaw: -10 })), t, d, 1, 1.07, 540, 1120) },
  // 21. she leaves
  { start: 'she leaves', pop: 'without giving', l1: 'SHE LEAVES.', l2: 'NO ANSWER.', mood: 'mine',
    art: (t, p, pt, d) => W(room('mine', t, { floorY: 1450 }) + RIM(K.darrow(560, 1680, 330, { yaw: -4, brow: 'sad', mouth: 'flat' }), 'mine') + fade(RIM(K.mustang(880 + 120 * eo(t / 2), 1680, 300, { yaw: -40 }), 'mine'), 1 - t / 1.6), t, d, 1, 1.05, 560, 1120) },
  // 22. Triumph
  { start: 'they throw him', l1: 'THEY THROW HIM A TRIUMPH.', mood: 'triumph',
    art: (t, p, pt, d) => W(room('triumph', t, { turn: 0, floorY: 1440 }) + crowd(12, 1420, 110, 6, '#3a240e') + RIM(K.darrow(540, TY, 340, { yaw: 0, mouth: 'smirk', arms: ['raise', 'raise'] }), 'triumph', { turn: 0 }) + tableG(t, { cloth: '#5a3a14', trim: '#e2a93b', deep: '#3a240a' }) + L.candle(220, TY, 1.3, t) + L.candle(860, TY, 1.3, t + 1), t, d, 1.04, 1.0, 540, 1080) },
  // 23. Roque drugs him
  { start: 'at the feast', pop: 'roque drugs', l1: 'AT THE FEAST...', l2: 'ROQUE DRUGS HIM.', mood: 'triumph',
    art: (t, p, pt, d) => { const turn = p ? io(pt / 1.2) * .5 : 0; return W(room('triumph', t, { turn, floorY: 1440 }) + (p ? slideIn(RIM(K.roque(700, 1680, 330, { yaw: -14, brow: 'sad', mouth: 'flat', arms: ['hang', 'table'] }), 'triumph', { turn }), 140, pt / .5) : '')
      + `<g transform="rotate(${p ? 8 * eo(pt / .8) : 0} 420 1680)">${RIM(K.darrow(420, 1680, 330, { yaw: 10, brow: 'sad', blink: p && pt > .4, mouth: 'flat' }), 'triumph', { turn })}</g>` + tableG(t, { cloth: '#5a3a14', trim: '#e2a93b', deep: '#3a240a', bare: true }) + L.candle(220, TY, 1.3, t), t, d, 1, 1.06, 540, 1100); } },
  // 24. the box
  { start: 'then comes a', pop: 'inside', l1: 'THEN COMES A BOX.', l2: "INSIDE... FITCHNER'S HEAD.", mood: 'triumph',
    art: (t, p, pt, d) => W(room('triumph', t, { turn: .5 + .5 * (p ? eo(pt / 1) : 0), floorY: 1440 }) + RIM(K.darrow(540, TY + 40, 340, { yaw: 0, brow: 'sad', mouth: 'frown', blink: true }), 'triumph', { turn: 1 })
      + tableG(t, { cloth: '#3a0d10', trim: '#7a1c1c', deep: '#24080a', bare: true }) + boxG(540, TY + 20, p ? eo(pt / .5) : 0) + (p ? fade(`<g transform="translate(540 ${TY - 150})">${K.ares(0, 0, 260)}</g>` + L.glow(540, TY - 100, 220, '#ff4a3a', .4), pt / .5) : '') + L.candle(220, TY, 1.3, t) + L.candle(860, TY, 1.3, t + 1), t, d, 1, 1.08, 540, 1100) },
  // 25. Jackal kills his father
  { start: 'the jackal kills', pop: 'kills his own', l1: 'THE JACKAL...', l2: 'KILLS HIS OWN FATHER.', mood: 'triumph',
    art: (t, p, pt, d) => W(room('triumph', t, { turn: 1, floorY: 1440 }) + `<g transform="rotate(${p ? -70 * eo(pt / .8) : 0} 780 1690)" opacity="${p ? (1 - .5 * eo(pt / .8)).toFixed(2) : 1}">${RIM(K.augustus(780, 1690, 340, { yaw: -20, brow: p ? 'sad' : 'angry', mouth: 'frown' }), 'triumph', { turn: 1 })}</g>`
      + RIM(K.jackal(340, 1690, 310, { yaw: 16, mouth: 'smirk', arms: ['stump', 'raise'] }), 'triumph', { turn: 1 }) + (p ? `<rect width="1080" height="1920" fill="#c8312b" opacity="${(0.4 * cl(1 - pt / .25)).toFixed(2)}"/>` : ''), t, d, 1, 1.06, 540, 1120) },
  // 26. taken prisoner
  { start: 'and darrow is', pop: 'taken prisoner', l1: 'AND DARROW?', l2: 'TAKEN PRISONER.', mood: 'void',
    art: (t, p, pt, d) => W(L.skyOrRoom('void', t, { floorY: 1450 }) + L.glow(540, 700, 420, '#9fc0ff', .2) + RIM(K.guard(250, 1700, 330, { yaw: 14 }), 'void') + RIM(K.guard(830, 1700, 330, { yaw: -14 }), 'void')
      + `<g transform="translate(0 ${p ? 30 * eo(pt / .5) : 0})">${RIM(K.darrow(540, 1700, 330, { yaw: 0, brow: 'sad', mouth: 'frown', blink: true, arms: ['cross', 'cross'] }), 'void')}</g>` + blade(560, 1760, 95), t, d, 1, 1.05, 540, 1120) },
  // 27. outro card
  { start: 'he walked across', pop: 'and lost everything', outro: true, l1: 'HE WON MARS.', l2: 'AND LOST EVERYTHING.', q: 'Can Roque ever be forgiven?', a: 'Yes or No — Morning Star next?', mood: 'void', art: () => '' },
];
module.exports = { BEATS, MONO, OPEN };
