// Book 1 beats, animated. art(p, t, pt): p = twist line showing, t = seconds since beat start, pt = seconds since twist (or -1).
const { cassius, soaLogo, darrowRed, darrowGold, eo, npc, instituteMap, flag, xMark } = require('./chars.js');
const C = { red: '#c8312b', gold: '#e2a93b', cream: '#f3e6c8' };
const T = (x, y, t, sz = 44, fill = C.cream, op = 1) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${sz}" fill="${fill}" opacity="${op}">${t}</text>`;

// ---- motion helpers ----
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = u => 1 - Math.pow(1 - cl(u), 3);
const easeIn = u => Math.pow(cl(u), 2);
const back = u => { u = cl(u); const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const bob = (svg, t, ph = 0, a = 7) => `<g transform="translate(0 ${(a * Math.sin(t * 2.4 + ph)).toFixed(2)})">${svg}</g>`;
const at = (svg, dx, dy, op = 1) => `<g transform="translate(${dx.toFixed(1)} ${dy.toFixed(1)})" opacity="${cl(op).toFixed(3)}">${svg}</g>`;
const scaleAt = (svg, x, y, k, op = 1) => `<g transform="translate(${x} ${y}) scale(${Math.max(0.001, k).toFixed(3)}) translate(${-x} ${-y})" opacity="${cl(op).toFixed(3)}">${svg}</g>`;
const popIn = (svg, x, y, u) => scaleAt(svg, x, y, back(u), cl(u * 3));
const drawX = (x, y, r, u) => { const a = cl(u * 2), b = cl(u * 2 - 1); return `<g stroke="#e8372c" stroke-width="${r * 0.16}" stroke-linecap="round"><line x1="${x - r}" y1="${y - r}" x2="${x - r + 2 * r * a}" y2="${y - r + 2 * r * a}"/>${b > 0 ? `<line x1="${x + r}" y1="${y - r}" x2="${x + r - 2 * r * b}" y2="${y - r + 2 * r * b}"/>` : ''}</g>`; };

// ---- props ----
const gallows = (x, y, o = 1, sway = 0) => `<g opacity="${cl(o)}"><g stroke="#2a1d16" stroke-width="24" fill="none" stroke-linecap="round"><path d="M${x - 170} ${y} H${x + 170} M${x - 110} ${y} V${y - 720} H${x + 130} M${x - 110} ${y - 600} L${x + 10} ${y - 720}"/></g><g transform="rotate(${sway} ${x + 130} ${y - 720})"><line x1="${x + 130}" y1="${y - 720}" x2="${x + 130}" y2="${y - 520}" stroke="#c9a46a" stroke-width="8"/><circle cx="${x + 130}" cy="${y - 500}" r="22" fill="none" stroke="#c9a46a" stroke-width="8"/></g></g>`;
const flower = (x, y, r, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})">${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="0" x2="${Math.cos(i * Math.PI / 3) * r}" y2="${Math.sin(i * Math.PI / 3) * r}" stroke="#e8251c" stroke-width="${r * 0.3}" stroke-linecap="round"/>`).join('')}<circle r="${r * 0.28}" fill="#ffd34d"/><line x1="0" y1="${r * 0.3}" x2="${r * 0.2}" y2="${r * 2.6}" stroke="#3d5a34" stroke-width="${r * 0.18}"/></g>`;
const mine = t => `<rect x="0" y="0" width="1080" height="1920" fill="#2a140c"/><path d="M0 760 Q300 640 540 700 T1080 680 V1920 H0Z" fill="#4a2414"/><path d="M0 1720 Q540 1660 1080 1720 V1920 H0Z" fill="#5c2e18"/>` + Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 173) % 1080}" cy="${820 + (i * 211) % 800 - ((t * 20 + i * 37) % 120)}" r="${6 + i % 4}" fill="#ff8a3d" opacity="${(0.2 + 0.25 * Math.sin(t * 3 + i)).toFixed(2)}"/>`).join('');
const city = t => { let o = ''; for (let i = 0; i < 9; i++) { const full = 220 + ((i * 71) % 320), ht = full * ease((t - i * 0.07) / 0.7); o += `<rect x="${60 + i * 108}" y="${1150 - ht}" width="86" height="${ht}" fill="${C.gold}" stroke="#7a5a10" stroke-width="5"/>`; for (let k = 0; k < ht / 62 - 1; k++) o += `<rect x="${80 + i * 108}" y="${1170 - ht + k * 62}" width="46" height="22" fill="#fff7d0" opacity="${(0.6 + 0.4 * Math.sin(t * 4 + i * 3 + k)).toFixed(2)}"/>`; } return o; };
const xray = t => { const sy = 660 + ((t * 520) % 1080); return `<rect x="190" y="660" width="700" height="1080" rx="30" fill="#0f2633" stroke="#5ec8ff" stroke-width="6"/><g stroke="#cfefff" stroke-width="16" stroke-linecap="round" fill="none"><circle cx="540" cy="860" r="95"/><line x1="540" y1="955" x2="540" y2="1350"/>${[0, 1, 2, 3, 4].map(i => `<path d="M440 ${1030 + i * 55} Q540 ${1000 + i * 55} 640 ${1030 + i * 55}"/>`).join('')}<line x1="540" y1="1050" x2="380" y2="1260"/><line x1="540" y1="1050" x2="700" y2="1260"/><line x1="540" y1="1350" x2="440" y2="1690"/><line x1="540" y1="1350" x2="640" y2="1690"/></g><g stroke="#ffcc33" stroke-width="10" fill="none"><circle cx="505" cy="860" r="18"/><circle cx="575" cy="860" r="18"/></g><rect x="194" y="${sy}" width="692" height="8" fill="#9fe3ff" opacity=".8"/><rect x="194" y="${sy - 60}" width="692" height="60" fill="#9fe3ff" opacity=".12"/>`; };
const HOUSES = [[150, 820, 'M', 'Mars'], [560, 760, 'J', 'Jupiter'], [960, 1000, 'P', ''], [260, 1110, 'Ce', ''], [880, 1200, 'Mi', 'Minerva'], [700, 1050, 'V', ''], [180, 1330, 'Ju', ''], [520, 1300, 'Me', ''], [900, 1420, 'D', 'Diana'], [640, 1460, 'A', 'Apollo'], [330, 1480, 'Ve', ''], [760, 880, 'Ba', '']];
const MARS = [690, 920];
// fallen: houses conquered so far (can be fractional: the next flag is mid-flip). appear: 0..1 per-flag reveal timing.
const houseFlags = (fallen = 0, appear = 99) => HOUSES.map(([x, y, g], i) => {
  if (i === 0) return '';
  const k = Math.floor(fallen), flip = i === k + 1 ? fallen - k : 0, red = i <= k;
  let f = flag(x, y, red ? C.red : '#2a2a2a', red ? 'M' : g);
  if (red && i === k) f = scaleAt(f, x, y, 1 + 0.25 * Math.max(0, 1 - (fallen - k) * 4));
  void flip;
  return popIn(f, x, y, (appear - i * 0.12) / 0.35);
}).join('') + popIn(flag(MARS[0], MARS[1], C.red, 'M'), MARS[0], MARS[1], appear / 0.35);
const odds = (t, fill) => {
  const rows = [['ARMOR', 95, 5], ['WEAPONS', 90, 10], ['TRAINING', 90, 10], ['SURPRISE', 4, 96]];
  let o = T(540, 560, 'OUR ESTIMATES', 40, '#3a2a18');
  o += popIn(npc(300, 900, 130, '#e0a326', '#f5d35e', { crown: true, iris: '#e0a326', label: 'THE JUDGES', lc: '#2a1d12' }), 300, 800, fill ? 1 : t / 0.4)
     + popIn(darrowGold(780, 900, 130, { label: 'DARROW', lc: '#2a1d12' }), 780, 800, fill ? 1 : (t - 0.15) / 0.4);
  rows.forEach(([n, a, b], i) => {
    const y = 1110 + i * 175, u = fill ? ease((t - i * 0.28) / 0.6) : 0;
    const va = Math.round(a * u), vb = Math.round(b * u), wa = 4 + 4 * va, wb = 4 + 4 * vb;
    const flash = fill && i === 3 && t > 1.4 ? 0.5 + 0.5 * Math.sin(t * 10) : 0;
    o += T(540, y, n, 44, '#2a1d12');
    o += `<rect x="${530 - wa}" y="${y + 25}" width="${wa}" height="44" fill="${C.gold}"/><rect x="550" y="${y + 25}" width="${wb}" height="44" fill="${C.red}"/>`;
    if (flash) o += `<rect x="546" y="${y + 21}" width="${wb + 8}" height="52" fill="none" stroke="#fff" stroke-width="4" opacity="${flash.toFixed(2)}"/>`;
    if (fill) o += `<text x="${520 - wa}" y="${y + 62}" text-anchor="end" font-family="Anton" font-size="40" fill="#8a6414">${va}%</text><text x="${560 + wb}" y="${y + 62}" font-family="Anton" font-size="40" fill="#8f1d16">${vb}%</text>`;
  });
  if (fill) o += T(540, 1830, 'THE ONLY ROW THAT MATTERED', 36, '#8f1d16', ease((t - 1.5) / 0.4));
  return o;
};
const olympus = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-260 40 Q0 260 260 40 Z" fill="#6b5a4a" stroke="#000" stroke-width="5"/><rect x="-200" y="-60" width="400" height="100" fill="#e9e3d6" stroke="#000" stroke-width="5"/>${[-160, -90, -20, 50, 120].map(cx => `<rect x="${cx}" y="-50" width="30" height="80" fill="#cfc6b4"/>`).join('')}<path d="M-120 -60 A120 120 0 0 1 120 -60 Z" fill="#f3efe6" stroke="#000" stroke-width="5"/></g>`;
const hand = (x, y, r = -25) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-50" y="-40" width="100" height="120" rx="30" fill="#f2d3b3" stroke="#000" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<rect x="${-48 + i * 26}" y="-110" width="20" height="80" rx="10" fill="#f2d3b3" stroke="#000" stroke-width="4"/>`).join('')}</g>`;
const chains = (x, y) => `<g stroke="#9aa0a8" stroke-width="12" fill="none">${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => `<ellipse cx="${x - 300 + i * 60}" cy="${y}" rx="34" ry="20"/>`).join('')}</g>`;
const note = (x, y, ch, op, sz) => `<text x="${x}" y="${y}" font-size="${sz}" fill="${C.gold}" opacity="${cl(op).toFixed(2)}">${ch}</text>`;
const PROCTOR = (x, y, s, o = {}) => npc(x, y, s, '#e0a326', '#f5d35e', { crown: true, iris: '#e0a326', ...o });


// ---- user's own Institute map (bitmap, placed full-width at y=560, 1080x870) ----
const MY = 560;
const MF = [[110, 45], [470, 160], [325, 237], [772, 110], [998, 180], [950, 335], [128, 272], [353, 387], [455, 445], [625, 562], [1040, 548], [775, 762]]; // flag body centres
const MARS_I = 3, ORDER = [4, 5, 1, 2, 9, 10, 8, 7, 6, 11, 0];
const wolf = (cx, cy) => `<path d="M${cx - 14} ${cy - 12} L${cx - 8} ${cy + 2} L${cx} ${cy + 12} L${cx + 8} ${cy + 2} L${cx + 14} ${cy - 12} L${cx + 5} ${cy - 5} L${cx - 5} ${cy - 5} Z" fill="#fff"/>`;
const redFlag = (i, k = 1) => { const [x, y0] = MF[i], y = MY + y0; return scaleAt(`<path d="M${x - 48} ${y - 36} h98 l-16 36 l16 36 h-98 z" fill="#d8352a" stroke="#1b1210" stroke-width="5" stroke-linejoin="round"/>` + wolf(x - 2, y), x - 48, y + 36, back(k), cl(k * 3)); };
const conquered = n => ORDER.map((i, j) => j < Math.floor(n) ? redFlag(i, 1) : (j === Math.floor(n) ? redFlag(i, n - Math.floor(n)) : '')).join('');
const numDot = (i, n, u) => { const [x, y0] = MF[i], y = MY + y0 - 52, cx = x - 46; return popIn(`<circle cx="${cx}" cy="${y}" r="24" fill="#e2a93b" stroke="#1b1210" stroke-width="4"/><text x="${cx}" y="${y + 10}" text-anchor="middle" font-family="Anton" font-size="28" fill="#1b1210">${n}</text>`, cx, y, u); };
const instLabel = op => T(540, 1515, 'THE INSTITUTE', 50, '#2a1d12', op);

const BEATS = [
  { bg: 'dark', l1: 'TO DESTROY THE GOLDS,', l2: 'HE HAD TO BECOME ONE.', start: 'to destroy', pop: 'he had to', l2color: 'gold',
    art: (p, t, pt) => bob(darrowRed(330, 1650, 230, { label: 'RED' }), t) +
      `<path pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - ease(t / 0.9)).toFixed(3)}" d="M540 900 L520 1100 L560 1250 L530 1450 L550 1700" stroke="${C.cream}" stroke-width="6" fill="none" opacity=".55"/>` +
      (p ? scaleAt(bob(darrowGold(760, 1650, 230, { label: 'GOLD' }), t, 1.5), 760, 1650, 0.9 + 0.1 * back(pt / 0.45), 0.2 + 0.8 * ease(pt / 0.35)) : `<g opacity=".18">${darrowGold(760, 1650, 230, { label: 'GOLD' })}</g>`) },
  { bg: 'none', l1: 'DARROW. 16. HELLDIVER.', l2: 'THE BEST MINER IN LYKOS.', start: 'mars', pop: 'the best',
    back: t => mine(t), art: (p, t) => at(darrowRed(500, 1680, 280, { label: 'DARROW', drill: true, dphase: t * 4 }), 2.5 * Math.sin(t * 40), 0) +
      Array.from({ length: 6 }, (_, i) => { const u = ((t * 2 + i / 6) % 1); return `<circle cx="${910 + 120 * u * Math.cos(i)}" cy="${1060 - 160 * u + 80 * u * u}" r="${6 * (1 - u)}" fill="#ffd36a" opacity="${(1 - u).toFixed(2)}"/>`; }).join('') },
  { bg: 'none', l1: 'THE REDS DIG TO SAVE MARS.', start: 'the reds dig', back: t => mine(t),
    art: (p, t) => {
      const u = ease(t / 1.6), val = (0.4 * u).toFixed(1), stall = t > 1.7 ? (Math.floor(t * 3) % 2 ? '…' : '') : '';
      return [180, 360, 540, 720, 900].map((x, i) => bob(npc(x, 1700 + (i % 2) * 40, 150, '#b3362b', '#a52617', { brow: 'sad' }), t * 1.6, i * 1.3, 10)).join('') +
        `<rect x="190" y="800" width="700" height="80" rx="40" fill="#222" stroke="${C.cream}" stroke-width="5"/><rect x="200" y="810" width="${(16 + 22 * u).toFixed(1)}" height="60" rx="12" fill="${C.red}" opacity="${(0.75 + 0.25 * Math.sin(t * 8)).toFixed(2)}"/>` +
        T(540, 770, 'TERRAFORMING PROGRESS', 40) + T(860, 935, 'GOAL: 100%', 30, '#9a8a70') +
        `<text x="540" y="985" text-anchor="middle" font-family="Anton" font-size="72" fill="${C.red}">${val}%${stall}</text>`;
    } },
  { bg: 'space', l1: '', l2: 'MARS WAS SAVED CENTURIES AGO.', start: 'but mars', l2color: 'gold',
    back: () => `<rect x="0" y="997" width="1080" height="923" fill="#3a1d12"/>`, art: (p, t) => city(t) + [240, 440, 640, 840].map((x, i) => bob(npc(x, 1720, 120, '#b3362b', '#a52617'), t, i)).join('') + T(540, 560, 'THE SURFACE', 44, '#fff', ease((t - 0.6) / 0.4)) + T(540, 1860, 'THE REDS BELOW', 40) },
  { bg: 'dark', l1: 'HIS CLAN EARNED THE PRIZE.', l2: 'THE GOLDS GAVE IT AWAY.', start: 'his clan', pop: 'the golds give',
    art: (p, t, pt) => {
      const u = p ? ease(pt / 0.75) : 0, lx = (1 - u) * (1 - u) * 250 + 2 * (1 - u) * u * 540 + u * u * 830, ly = (1 - u) * (1 - u) * 1180 + 2 * (1 - u) * u * 880 + u * u * 1180;
      const pulse = 1 + 0.06 * Math.sin(t * 6);
      return [170, 330].map((x, i) => bob(npc(x, 1700, 140, '#b3362b', '#a52617', { brow: p ? 'sad' : undefined, mouth: p ? 'frown' : 'smile' }), t, i)).join('') + T(250, 1790, 'LYKOS', 40) +
        [750, 910].map((x, i) => bob(npc(x, 1700, 140, '#8a4a2a', '#5a2a14', { mouth: 'smile' }), t, i + 2)).join('') + T(830, 1790, 'GAMMA', 40) +
        bob(npc(540, 1350, 170, '#e0a326', '#f5d35e', { iris: '#e0a326', label: 'THE GOLDS' }), t, 3, 4) +
        scaleAt(`<circle cx="${lx}" cy="${ly}" r="80" fill="none" stroke="${C.gold}" stroke-width="22" stroke-dasharray="30 10"/>`, lx, ly, pulse) + T(lx, ly - 120, 'THE LAUREL', 38, C.gold);
    } },
  { bg: 'dark', l1: 'EO WANTED MORE.', start: 'his wife eo',
    art: (p, t) => `<circle cx="540" cy="1300" r="420" fill="#fff4d6" opacity=".06"/>` + bob(darrowRed(330, 1700, 230, { brow: 'soft', mouth: 'smile', label: 'DARROW' }), t) + bob(eo(720, 1700, 230, { label: 'EO' }), t, 1) +
      scaleAt(`<path d="M525 1160 c-30 -40 -90 -20 -70 30 c10 25 70 60 70 60 c0 0 60 -35 70 -60 c20 -50 -40 -70 -70 -30z" fill="${C.red}"/>`, 525, 1190, 1 + 0.12 * Math.abs(Math.sin(t * 4.5))) },
  { bg: 'dark', l1: '', l2: 'SHE SANG THE FORBIDDEN SONG.', start: 'she sings',
    art: (p, t) => {
      const open = 0.5 + 0.5 * Math.sin(t * 9);
      const notes = Array.from({ length: 7 }, (_, i) => { const u = ((t + i * 0.42) / 2.2) % 1; const side = i % 2 ? 1 : -1; return note(540 + side * (170 + 60 * Math.sin(u * 6 + i)), 1120 - 420 * u, i % 3 ? '♪' : '♫', Math.sin(Math.PI * u) * 1.2, 90 + 30 * (i % 2)); }).join('');
      return `<path d="M540 480 L250 1600 H830 Z" fill="#fff6d6" opacity="${(0.11 + 0.03 * Math.sin(t * 2)).toFixed(3)}"/>` + eo(540, 1500 + 4 * Math.sin(t * 2), 270, { closed: true, mouth: 'sing', open }) + notes +
        [100, 260, 820, 980].map((x, i) => bob(npc(x, 1880, 120, '#b3362b', '#a52617', { op: .8 }), t, i)).join('') + npc(160, 1200, 110, '#e0a326', '#f5d35e', { iris: '#e0a326', brow: 'angry', op: .9 });
    } },
  { bg: 'blood', l1: 'THEY HANGED HER.', start: 'they hang her',
    art: (p, t) => gallows(470, 1700, 1, 3 * Math.sin(t * 2.2)) + flower(600 + 30 * Math.sin(t * 5) * (1 - ease(t / 1)), 900 + 780 * easeIn(t / 1.0), 40, 70 + 200 * ease(t / 1.0)) },
  { bg: 'blood', l1: 'HE PULLED HER FEET', l2: 'TO END HER PAIN.', start: 'darrow pulls', pop: 'to end',
    art: (p, t) => `<g opacity=".3">${gallows(760, 1700, 1, 2 * Math.sin(t * 2))}</g>` + darrowRed(420, 1720 + 3 * Math.sin(t * 1.5), 260, { closed: true, brow: 'sad', mouth: 'frown' }) +
      [0, 1].map(k => { const u = (t * 1.1 + k * 0.5) % 1; return `<path d="M${380 + k * 80} ${1240 + 110 * u} q-9 18 0 26 q9 -8 0 -26z" fill="#7fb8ff" opacity="${(1 - u).toFixed(2)}"/>`; }).join('') },
  { bg: 'dark', l1: 'HE BURIED HER.', l2: 'SO THEY HANGED HIM TOO.', start: 'he buries', pop: 'so they hang',
    art: (p, t, pt) => `<ellipse cx="540" cy="1620" rx="300" ry="70" fill="#4a2a18"/><path d="M290 1620 Q540 1460 790 1620Z" fill="#5c3520"/>` + flower(540, 1470, 46, 6 * Math.sin(t * 2)) + (p ? gallows(760, 1180, 0.55 * ease(pt / 0.5)) : '') + darrowRed(220, 1820, 160, { closed: true, brow: 'sad' }) },
  { bg: 'dark', l1: 'HE WOKE UP.', l2: 'RESCUED BY REBELS.', start: 'he wakes', pop: 'rescued',
    art: (p, t, pt) => { const u = p ? ease(pt / 0.5) : 0; return bob(darrowRed(540, 1700, 240, { brow: p ? 'angry' : 'sad', closed: t < 0.5 }), t) + (p ? at(npc(220, 1760, 170, '#1d1d22', '#1d1d22', { brow: 'angry' }), -420 * (1 - u), 0) + at(npc(860, 1760, 170, '#1d1d22', '#1d1d22', { brow: 'angry' }), 420 * (1 - u), 0) + scaleAt(soaLogo(520, 980, .42, '#b0231f', { rise: false, spin: t * 3, wind: t }), 560, 980, 0.6 + 0.4 * back(pt / 0.5), u) : ''); } },
  { bg: 'dark', l1: 'THE SONS OF ARES HAD A PLAN.', l2: 'CARVE HIM INTO A GOLD.', start: 'the sons of', pop: 'carve him', l2color: 'gold',
    art: (p, t) => scaleAt(soaLogo(500, 1180, 0.95, '#b0231f', { spin: t * 2, wind: t, drip: ease(t / 1.4) }), 560, 1150, 0.85 + 0.15 * back(t / 0.5)) + T(540, 1840, 'THE SONS OF ARES', 50) },
  { bg: 'dark', l1: 'NEW BONES. NEW EYES.', l2: 'GOLD HAIR.', start: 'new bones', pop: 'gold hair', l2color: 'gold',
    art: (p, t, pt) => p ? `<circle cx="540" cy="1350" r="${460 + 20 * Math.sin(t * 3)}" fill="${C.gold}" opacity="${(0.08 + 0.04 * Math.sin(t * 3)).toFixed(3)}"/>` + scaleAt(darrowGold(540, 1720, 300, { hood: false, mouth: 'flat' }), 540, 1720, back(pt / 0.5)) + `<rect x="-800" y="-800" width="2700" height="3600" fill="#fff" opacity="${cl(1 - pt / 0.25).toFixed(2)}"/>` : xray(t) },
  { bg: 'parch', l1: 'THE INSTITUTE.', l2: 'WHERE GOLDS LEARN TO RULE.', start: 'he enters', pop: 'where golds',
    mapImg: true, back: t => instLabel(ease((t - 0.3) / 0.4)), art: () => '' },
  { bg: 'parch', l1: 'FIRST NIGHT:', l2: 'KILL A CLASSMATE.', start: 'the first night', pop: 'kill a classmate',
    art: (p, t, pt) => `<ellipse cx="540" cy="1660" rx="460" ry="150" fill="#8b6b3f"/>` + at(darrowGold(330, 1660, 220, { hood: false, label: 'DARROW', lc: '#2a1d12' }), p ? 40 * ease(pt / 0.4) : 0, 0) + bob(npc(750, 1660, 220, '#e0a326', '#7a5a2a', { iris: '#e0a326', brow: 'sad', label: 'JULIAN', lc: '#2a1d12' }), t, 1, 4) },
  { bg: 'parch', l1: 'HE KILLED JULIAN.', l2: "CASSIUS'S BROTHER.", start: 'he kills julian', pop: "cassius's brother",
    art: (p, t, pt) => npc(300, 1650, 220, '#e0a326', '#7a5a2a', { iris: '#e0a326', closed: true, label: 'JULIAN', lc: '#2a1d12' }) + drawX(300, 1650 - 220 * 1.55 - 220 * 0.42 * 0.78, 110, t / 0.5) +
      (p ? at(`<circle cx="780" cy="1300" r="${260 + 10 * Math.sin(t * 3)}" fill="#fff" opacity=".25"/>` + cassius(780, 1650, 240, { label: 'CASSIUS', lc: '#2a1d12' }), 300 * (1 - ease(pt / 0.5)), 0, ease(pt / 0.3)) : '') },
  { bg: 'parch', l1: '12 HOUSES. ONE VALLEY.', start: 'then the war',
    mapImg: true, back: t => instLabel(1) + [0, 6, 2, 1, 3, 7, 8, 5, 4, 9, 10, 11].map((i, n) => numDot(i, n + 1, (t - n * 0.3) / 0.35)).join(''), art: () => '' },
  { bg: 'dark', l1: 'HIS OWN HOUSE TURNED SAVAGE.', l2: 'HE KILLED THEIR LEADER.', start: 'his own house', pop: 'darrow kills',
    art: (p, t, pt) => { const tilt = p ? 10 * ease(pt / 0.5) : 0; return `<g transform="rotate(${tilt} 680 1720)">${bob(npc(680, 1720, 330, '#b8291f', '#3a2a1a', { brow: 'angry', iris: '#e0a326', label: 'TITUS' }), t, 0, p ? 0 : 6)}</g>` + (p ? drawX(680, 1720 - 330 * 1.55 - 330 * 0.42 * 0.78, 160, pt / 0.4) : '') + bob(darrowGold(190, 1760, 190, { label: p ? 'DARROW' : '', blade: true, glow: 0.7 + 0.3 * Math.sin(t * 5) }), t, 2); } },
  { bg: 'dark', l1: 'THEY CALLED HIM', l2: 'THE REAPER.', start: 'they call him', pop: 'reaper',
    art: (p, t, pt) => `<circle cx="540" cy="1300" r="${480 + (p ? 40 * Math.sin(pt * 6) * Math.max(0, 1 - pt) : 0)}" fill="${C.red}" opacity="${p ? 0.16 : 0.08}"/>` + bob(darrowGold(420, 1760, 320, { blade: true, glow: 0.6 + 0.4 * Math.sin(t * 4) }), t, 0, 5) },
  { bg: 'parch', l1: 'HOUSE AFTER HOUSE FELL.', start: 'house after',
    mapImg: true, back: t => instLabel(1) + conquered(Math.min(7, t / 0.26)), art: () => '' },
  { bg: 'dark', l1: 'BUT THE JUDGES CHEATED.', l2: 'FOR THE JACKAL.', start: 'but the judges', pop: 'for the jackal',
    art: (p, t, pt) => [200, 440, 680].map((x, i) => bob(PROCTOR(x, 1500, 170, { mouth: p ? 'smile' : undefined }), t, i)).join('') + T(440, 1590, 'THE PROCTORS', 44) +
      (p ? at(npc(870, 1800, 190, '#d9c27a', '#efe2a8', { iris: '#e0a326', mouth: 'smile', label: 'THE JACKAL' }), 350 * (1 - ease(pt / 0.5)), 0) + `<path pathLength="1" stroke-dasharray="1" stroke-dashoffset="${(1 - ease((pt - 0.3) / 0.5)).toFixed(3)}" d="M720 1280 Q820 1300 860 1400" stroke="${C.gold}" stroke-width="10" fill="none"/>` : '') },
  { bg: 'parch', l1: 'THE ODDS', big: true, start: 'so what are', art: (p, t) => odds(t, false) },
  { bg: 'parch', l1: 'THE ODDS', big: true, start: 'the judges have', art: (p, t) => odds(t, true) },
  { bg: 'space', l1: 'HE RAIDED OLYMPUS.', l2: 'AND CHAINED THE JUDGES.', start: 'he raids', pop: 'and chains',
    art: (p, t, pt) => p
      ? [240, 540, 840].map((x, i) => at(PROCTOR(x, 1500, 170, { brow: 'sad', mouth: 'frown' }), 3 * Math.sin(t * 30 + i), 0)).join('') + at(chains(540, 1400), -700 * (1 - ease(pt / 0.5)), 0)
      : olympus(540, 1050 + 14 * Math.sin(t * 2), 1.3) + T(540, 820 + 14 * Math.sin(t * 2), 'OLYMPUS', 48) + [300, 420, 540, 660, 780].map((x, i) => at(darrowGold(x, 1800 - (i % 2) * 40, i === 2 ? 170 : 120, i === 4 ? { hair: '#3a2a20', hair2: '#6a5040', pelt: '#9a948a', patch: true, mouth: 'smile' } : { blade: i === 2 }), 0, 120 * (1 - ease(t / 1.2)) + 6 * Math.sin(t * 8 + i))).join('') },
  { bg: 'dark', l1: 'THE JACKAL TRIED TO BARGAIN.', l2: 'DARROW TOOK HIS HAND.', start: 'the jackal tries', pop: 'darrow takes',
    art: (p, t, pt) => bob(npc(680, 1720, 260, '#d9c27a', '#efe2a8', { iris: '#e0a326', mouth: p ? 'frown' : 'smile', brow: p ? 'sad' : undefined, label: 'THE JACKAL' }), t, 0, p ? 0 : 6) + bob(darrowGold(180, 1740, 190, { blade: true, glow: 0.7 + 0.3 * Math.sin(t * 5) }), t, 2) +
      (p ? hand(470, 1380 + 180 * easeIn(pt / 0.5), -25 - 120 * ease(pt / 0.5)) + `<rect x="-800" y="-800" width="2700" height="3600" fill="#c8312b" opacity="${(0.35 * cl(1 - pt / 0.2)).toFixed(2)}"/>` : '') },
  { bg: 'parch', l1: 'HE WON THE INSTITUTE.', start: 'darrow wins',
    mapImg: true, back: t => instLabel(1) + conquered(Math.min(11, 7 + t / 0.2)), art: () => '' },
  { bg: 'dark', l1: 'HIS PRIZE?', l2: 'SERVE THE MAN WHO HANGED EO.', start: 'his prize', pop: 'the man who',
    art: (p, t, pt) => (p ? gallows(870, 1500, 0.25 * ease(pt / 0.6)) + `<g opacity="${ease(pt / 0.6).toFixed(2)}">${flower(880, 1470, 30, 60)}</g>` : '') + bob(npc(620, 1700, 340, '#e0a326', '#cfcfcf', { crown: true, iris: '#e0a326', brow: 'angry', label: 'ARCHGOVERNOR AUGUSTUS' }), t, 0, 4) + darrowGold(230, 1700, 170, {}) },
  { bg: 'dark', outro: true, l1: 'HE BECAME A GOLD TO DESTROY THEM.', l2: 'NOW HE KNEELS TO ONE.', start: 'he became', pop: 'now he has',
    q: 'Do you want Golden Son next?', a: 'Yes or No', art: () => '' },
];
module.exports = { BEATS };
