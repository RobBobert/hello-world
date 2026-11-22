// Book 1 beats. art(pop) gets true once the twist line is showing.
const { cassius, soaLogo, darrowRed, darrowGold, eo, npc, instituteMap, flag, label, xMark } = require('./chars.js');
const C = { red: '#c8312b', gold: '#e2a93b', obs: '#2b2b33', gray: '#8a8f98', cream: '#f3e6c8' };
const T = (x, y, t, sz = 44, fill = C.cream) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="${sz}" fill="${fill}">${t}</text>`;

const gallows = (x, y, o = 1) => `<g opacity="${o}" stroke="#2a1d16" stroke-width="24" fill="none" stroke-linecap="round"><path d="M${x - 170} ${y} H${x + 170} M${x - 110} ${y} V${y - 720} H${x + 130} M${x - 110} ${y - 600} L${x + 10} ${y - 720}"/></g><line x1="${x + 130}" y1="${y - 720}" x2="${x + 130}" y2="${y - 520}" stroke="#c9a46a" stroke-width="8"/><circle cx="${x + 130}" cy="${y - 500}" r="22" fill="none" stroke="#c9a46a" stroke-width="8"/>`;
const flower = (x, y, r, rot = 0) => `<g transform="translate(${x} ${y}) rotate(${rot})">${Array.from({ length: 6 }, (_, i) => `<line x1="0" y1="0" x2="${Math.cos(i * Math.PI / 3) * r}" y2="${Math.sin(i * Math.PI / 3) * r}" stroke="#e8251c" stroke-width="${r * 0.3}" stroke-linecap="round"/>`).join('')}<circle r="${r * 0.28}" fill="#ffd34d"/><line x1="0" y1="${r*0.3}" x2="${r*0.2}" y2="${r * 2.6}" stroke="#3d5a34" stroke-width="${r*0.18}"/></g>`;
const mine = () => `<rect x="0" y="0" width="1080" height="1920" fill="#2a140c"/><path d="M0 760 Q300 640 540 700 T1080 680 V1920 H0Z" fill="#4a2414"/><path d="M0 1720 Q540 1660 1080 1720 V1920 H0Z" fill="#5c2e18"/>` + Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 173) % 1080}" cy="${820 + (i * 211) % 800}" r="${6 + i % 4}" fill="#ff8a3d" opacity=".35"/>`).join('');
const city = (h = 1) => { let o = ''; for (let i = 0; i < 9; i++) { const ht = (220 + ((i * 71) % 320)) * h; o += `<rect x="${60 + i * 108}" y="${1150 - ht}" width="86" height="${ht}" fill="${C.gold}" stroke="#7a5a10" stroke-width="5"/>`; for (let k = 0; k < ht / 62 - 1; k++) o += `<rect x="${80 + i * 108}" y="${1170 - ht + k * 62}" width="46" height="22" fill="#fff7d0"/>`; } return o; };
const sigil = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><g stroke="${C.gold}" stroke-width="14">${Array.from({ length: 16 }, (_, i) => `<line x1="0" y1="0" x2="${Math.cos(i * Math.PI / 8) * 360}" y2="${Math.sin(i * Math.PI / 8) * 360}"/>`).join('')}</g><circle r="200" fill="#1b1410" stroke="${C.gold}" stroke-width="14"/><path d="M-120 40 Q-120 -150 0 -150 Q120 -150 120 40 L60 40 L40 100 H-40 L-60 40Z" fill="${C.gold}"/><rect x="-80" y="-40" width="160" height="26" fill="#1b1410"/></g>`;
const xray = () => `<rect x="190" y="660" width="700" height="1080" rx="30" fill="#0f2633" stroke="#5ec8ff" stroke-width="6"/><g stroke="#cfefff" stroke-width="16" stroke-linecap="round" fill="none"><circle cx="540" cy="860" r="95"/><line x1="540" y1="955" x2="540" y2="1350"/>${[0, 1, 2, 3, 4].map(i => `<path d="M440 ${1030 + i * 55} Q540 ${1000 + i * 55} 640 ${1030 + i * 55}"/>`).join('')}<line x1="540" y1="1050" x2="380" y2="1260"/><line x1="540" y1="1050" x2="700" y2="1260"/><line x1="540" y1="1350" x2="440" y2="1690"/><line x1="540" y1="1350" x2="640" y2="1690"/></g><g stroke="#ffcc33" stroke-width="10" fill="none"><circle cx="505" cy="860" r="18"/><circle cx="575" cy="860" r="18"/></g>`;
// 12 houses on the user's map
const HOUSES = [[150, 820, 'M', 'Mars'], [560, 760, 'J', 'Jupiter'], [960, 1000, 'P', ''], [260, 1110, 'Ce', ''], [880, 1200, 'Mi', 'Minerva'], [700, 1050, 'V', ''], [180, 1330, 'Ju', ''], [520, 1300, 'Me', ''], [900, 1420, 'D', 'Diana'], [640, 1460, 'A', 'Apollo'], [330, 1480, 'Ve', ''], [760, 880, 'Ba', '']];
const MARS = [690, 920];
const houseFlags = (fallen = 0) => HOUSES.map(([x, y, g], i) => i === 0 ? '' : flag(x, y, i <= fallen ? C.red : '#2a2a2a', i <= fallen ? 'M' : g, { x: false })).join('') + flag(MARS[0], MARS[1], C.red, 'M');
const odds = (fill) => {
  const rows = [['ARMOR', .95, .05], ['WEAPONS', .9, .1], ['TRAINING', .9, .1], ['SURPRISE', .04, .96]];
  let o = T(540, 560, 'OUR ESTIMATES', 40, '#3a2a18');
  o += npc(300, 900, 130, '#e0a326', '#f5d35e', { crown: true, iris: '#e0a326', label: 'THE JUDGES', lc: '#2a1d12' }) + darrowGold(780, 900, 130, { label: 'DARROW', lc: '#2a1d12' });
  rows.forEach(([n, a, b], i) => { const y = 1110 + i * 175; o += T(540, y, n, 44, '#2a1d12'); const wa = fill ? 400 * a : 4, wb = fill ? 400 * b : 4; o += `<rect x="${530 - wa}" y="${y + 25}" width="${wa}" height="44" fill="${C.gold}"/><rect x="550" y="${y + 25}" width="${wb}" height="44" fill="${C.red}"/>`; });
  if (fill) o += T(540, 1830, 'THE ONLY ROW THAT MATTERED', 36, '#8f1d16');
  return o;
};
const olympus = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-260 40 Q0 260 260 40 Z" fill="#6b5a4a" stroke="#000" stroke-width="5"/><rect x="-200" y="-60" width="400" height="100" fill="#e9e3d6" stroke="#000" stroke-width="5"/>${[-160, -90, -20, 50, 120].map(cx => `<rect x="${cx}" y="-50" width="30" height="80" fill="#cfc6b4"/>`).join('')}<path d="M-120 -60 A120 120 0 0 1 120 -60 Z" fill="#f3efe6" stroke="#000" stroke-width="5"/></g>`;
const hand = (x, y) => `<g transform="translate(${x} ${y}) rotate(-25)"><rect x="-50" y="-40" width="100" height="120" rx="30" fill="#f2d3b3" stroke="#000" stroke-width="5"/>${[0, 1, 2, 3].map(i => `<rect x="${-48 + i * 26}" y="-110" width="20" height="80" rx="10" fill="#f2d3b3" stroke="#000" stroke-width="4"/>`).join('')}</g>`;
const chains = (x, y) => `<g stroke="#9aa0a8" stroke-width="12" fill="none">${[0, 1, 2, 3, 4].map(i => `<ellipse cx="${x - 120 + i * 60}" cy="${y}" rx="34" ry="20"/>`).join('')}</g>`;

const BEATS = [
  { bg: 'dark', l1: 'TO DESTROY THE GOLDS,', l2: 'HE HAD TO BECOME ONE.', start: 'to destroy', pop: 'he had to', l2color: 'gold',
    art: p => darrowRed(330, 1650, 230, { label: 'RED', drill: true }) + `<path d="M540 900 L520 1100 L560 1250 L530 1450 L550 1700" stroke="${C.cream}" stroke-width="6" fill="none" opacity=".5"/>` + darrowGold(760, 1650, 230, { label: 'GOLD', op: p ? 1 : .25 }).replace('<g>', `<g opacity="${p ? 1 : 0.2}">`) },
  { bg: 'none', l1: 'DARROW. 16. HELLDIVER.', l2: 'THE BEST MINER IN LYKOS.', start: 'mars', pop: 'the best',
    art: () => mine() + darrowRed(500, 1680, 280, { label: 'DARROW', drill: true }) },
  { bg: 'none', l1: 'THE REDS DIG TO SAVE MARS.', start: 'the reds dig',
    art: () => mine() + [180, 360, 540, 720, 900].map((x, i) => npc(x, 1700 + (i % 2) * 40, 150, '#b3362b', '#a52617', { brow: 'sad' })).join('') + `<rect x="190" y="800" width="700" height="80" rx="40" fill="#222" stroke="${C.cream}" stroke-width="5"/><rect x="200" y="810" width="24" height="60" rx="12" fill="${C.red}"/>` + T(540, 770, 'TERRAFORMING PROGRESS', 40) + `<text x="540" y="970" text-anchor="middle" font-family="Anton" font-size="64" fill="${C.red}">0.4%</text>` },
  { bg: 'space', l1: '', l2: 'MARS WAS SAVED CENTURIES AGO.', start: 'but mars', l2color: 'gold',
    art: () => city() + `<rect x="0" y="1150" width="1080" height="770" fill="#3a1d12"/>` + [240, 440, 640, 840].map(x => npc(x, 1720, 120, '#b3362b', '#a52617')).join('') + T(540, 560, 'THE SURFACE', 44, '#fff') + T(540, 1860, 'THE REDS BELOW', 40) },
  { bg: 'dark', l1: 'HIS CLAN EARNED THE PRIZE.', l2: 'THE GOLDS GAVE IT AWAY.', start: 'his clan', pop: 'the golds give',
    art: p => [170, 330].map(x => npc(x, 1700, 140, '#b3362b', '#a52617', { brow: p ? 'sad' : undefined, mouth: p ? 'frown' : 'smile' })).join('') + T(250, 1790, 'LYKOS', 40) + [750, 910].map(x => npc(x, 1700, 140, '#8a4a2a', '#5a2a14', { mouth: 'smile' })).join('') + T(830, 1790, 'GAMMA', 40) + npc(540, 1350, 170, '#e0a326', '#f5d35e', { iris: '#e0a326', label: 'THE GOLDS' }) +
      `<g transform="translate(${p ? 830 : 250} ${p ? 1180 : 1180})"><circle r="80" fill="none" stroke="${C.gold}" stroke-width="22" stroke-dasharray="30 10"/></g>` + (p ? `<path d="M330 1100 Q540 940 760 1100" stroke="${C.gold}" stroke-width="10" fill="none" stroke-dasharray="20 14"/>` : '') + T(p ? 830 : 250, 1060, 'THE LAUREL', 38, C.gold) },
  { bg: 'dark', l1: 'EO WANTED MORE.', start: 'his wife eo',
    art: () => `<circle cx="540" cy="1300" r="420" fill="#fff4d6" opacity=".06"/>` + darrowRed(330, 1700, 230, { brow: 'soft', mouth: 'smile', label: 'DARROW' }) + eo(720, 1700, 230, { label: 'EO' }) + `<path d="M525 1160 c-30 -40 -90 -20 -70 30 c10 25 70 60 70 60 c0 0 60 -35 70 -60 c20 -50 -40 -70 -70 -30z" fill="${C.red}" opacity=".9"/>` },
  { bg: 'dark', l1: '', l2: 'SHE SANG THE FORBIDDEN SONG.', start: 'she sings',
    art: () => `<path d="M540 480 L250 1600 H830 Z" fill="#fff6d6" opacity=".13"/>` + eo(540, 1500, 270, { closed: true, mouth: 'smile' }) + `<text x="800" y="1000" font-size="140" fill="${C.gold}">♪</text><text x="200" y="1150" font-size="110" fill="${C.gold}">♫</text>` + [100, 260, 820, 980].map(x => npc(x, 1880, 120, '#b3362b', '#a52617', { op: .8 })).join('') + npc(160, 1200, 110, '#e0a326', '#f5d35e', { iris: '#e0a326', brow: 'angry', op: .9 }) },
  { bg: 'blood', l1: 'THEY HANGED HER.', start: 'they hang her',
    art: () => gallows(470, 1700) + flower(600, 1680, 40, 70) },
  { bg: 'blood', l1: 'HE PULLED HER FEET', l2: 'TO END HER PAIN.', start: 'darrow pulls', pop: 'to end',
    art: () => `<g opacity=".3">${gallows(760, 1700)}</g>` + darrowRed(420, 1720, 260, { closed: true, brow: 'sad', mouth: 'frown' }) + `<path d="M380 1240 l-10 50 M460 1240 l10 50" stroke="#7fb8ff" stroke-width="10" stroke-linecap="round" opacity=".8"/>` },
  { bg: 'dark', l1: 'HE BURIED HER.', l2: 'SO THEY HANGED HIM TOO.', start: 'he buries', pop: 'so they hang',
    art: p => `<ellipse cx="540" cy="1620" rx="300" ry="70" fill="#4a2a18"/><path d="M290 1620 Q540 1460 790 1620Z" fill="#5c3520"/>` + flower(540, 1470, 46, 0) + (p ? `<g opacity=".55">${gallows(760, 1180)}</g>` : '') + darrowRed(220, 1820, 160, { closed: true, brow: 'sad' }) },
  { bg: 'dark', l1: 'HE WOKE UP.', l2: 'RESCUED BY REBELS.', start: 'he wakes', pop: 'rescued',
    art: p => darrowRed(540, 1700, 240, { brow: p ? 'angry' : 'sad' }) + (p ? npc(220, 1760, 170, '#1d1d22', '#1d1d22', { brow: 'angry' }) + npc(860, 1760, 170, '#1d1d22', '#1d1d22', { brow: 'angry' }) + soaLogo(560, 980, .42, '#b0231f', { rise: false }) : '') },
  { bg: 'dark', l1: 'THE SONS OF ARES HAD A PLAN.', l2: 'CARVE HIM INTO A GOLD.', start: 'the sons of', pop: 'carve him', l2color: 'gold',
    art: () => soaLogo(560, 1150, 1.05) + T(540, 1840, 'THE SONS OF ARES', 50) },
  { bg: 'dark', l1: 'NEW BONES. NEW EYES.', l2: 'GOLD HAIR.', start: 'new bones', pop: 'gold hair', l2color: 'gold',
    art: p => p ? `<circle cx="540" cy="1350" r="460" fill="${C.gold}" opacity=".08"/>` + darrowGold(540, 1720, 300, { hood: false, mouth: 'flat' }) : xray() },
  { bg: 'parch', l1: 'THE INSTITUTE.', l2: 'WHERE GOLDS LEARN TO RULE.', start: 'he enters', pop: 'where golds',
    art: () => instituteMap({ overlay: houseFlags(0) }) + T(540, 1800, 'THE INSTITUTE', 56, '#2a1d12') },
  { bg: 'parch', l1: 'FIRST NIGHT:', l2: 'KILL A CLASSMATE.', start: 'the first night', pop: 'kill a classmate',
    art: () => `<ellipse cx="540" cy="1660" rx="460" ry="150" fill="#8b6b3f"/>` + darrowGold(330, 1660, 220, { hood: false, label: 'DARROW', lc: '#2a1d12' }) + npc(750, 1660, 220, '#e0a326', '#7a5a2a', { iris: '#e0a326', brow: 'sad', label: 'JULIAN', lc: '#2a1d12' }) },
  { bg: 'parch', l1: 'HE KILLED JULIAN.', l2: "CASSIUS'S BROTHER.", start: 'he kills julian', pop: "cassius's brother",
    art: p => npc(300, 1650, 220, '#e0a326', '#7a5a2a', { iris: '#e0a326', closed: true, x: true, label: 'JULIAN', lc: '#2a1d12' }) + (p ? `<circle cx="780" cy="1300" r="260" fill="#fff" opacity=".25"/>` + cassius(780, 1650, 240, { label: 'CASSIUS', lc: '#2a1d12' }) : '') },
  { bg: 'parch', l1: '12 HOUSES. ONE VALLEY.', start: 'then the war',
    art: () => instituteMap({ overlay: houseFlags(0) + HOUSES.filter(h => h[3]).map(([x, y, , n]) => `<text x="${x + 35}" y="${y + 34}" text-anchor="middle" font-family="Cinzel" font-weight="700" font-size="26" fill="#2a1d12">${n.toUpperCase()}</text>`).join('') }) },
  { bg: 'dark', l1: 'HIS OWN HOUSE TURNED SAVAGE.', l2: 'HE KILLED THEIR LEADER.', start: 'his own house', pop: 'darrow kills',
    art: p => npc(680, 1720, 330, '#b8291f', '#3a2a1a', { brow: 'angry', iris: '#e0a326', x: p, label: 'TITUS' }) + darrowGold(260, 1760, 200, { label: p ? 'DARROW' : '' }) },
  { bg: 'dark', l1: 'THEY CALLED HIM', l2: 'THE REAPER.', start: 'they call him', pop: 'reaper',
    art: () => `<circle cx="540" cy="1300" r="480" fill="${C.red}" opacity=".08"/>` + darrowGold(500, 1760, 320, { blade: true }) },
  { bg: 'parch', l1: 'HOUSE AFTER HOUSE FELL.', start: 'house after',
    art: () => instituteMap({ overlay: houseFlags(7) }) },
  { bg: 'dark', l1: 'BUT THE JUDGES CHEATED.', l2: 'FOR THE JACKAL.', start: 'but the judges', pop: 'for the jackal',
    art: p => [200, 440, 680].map(x => npc(x, 1500, 170, '#e0a326', '#f5d35e', { crown: true, iris: '#e0a326' })).join('') + T(440, 1590, 'THE PROCTORS', 44) + (p ? npc(870, 1800, 190, '#d9c27a', '#efe2a8', { iris: '#e0a326', mouth: 'smile', label: 'THE JACKAL' }) + `<path d="M720 1280 Q820 1300 860 1400" stroke="${C.gold}" stroke-width="10" fill="none" stroke-dasharray="18 12"/>` : '') },
  { bg: 'parch', l1: 'THE ODDS', big: true, start: 'so what are', art: () => odds(false) },
  { bg: 'parch', l1: 'THE ODDS', big: true, start: 'the judges have', art: () => odds(true) },
  { bg: 'space', l1: 'HE RAIDED OLYMPUS.', l2: 'AND CHAINED THE JUDGES.', start: 'he raids', pop: 'and chains',
    art: p => p ? [240, 540, 840].map(x => npc(x, 1500, 170, '#e0a326', '#f5d35e', { crown: true, iris: '#e0a326', brow: 'sad', mouth: 'frown' })).join('') + chains(540, 1400) : olympus(540, 1050, 1.3) + T(540, 820, 'OLYMPUS', 48) + [300, 420, 540, 660, 780].map((x, i) => darrowGold(x, 1800 - (i % 2) * 40, i === 2 ? 170 : 120, { blade: i === 2 })).join('') },
  { bg: 'dark', l1: 'THE JACKAL TRIED TO BARGAIN.', l2: 'DARROW TOOK HIS HAND.', start: 'the jackal tries', pop: 'darrow takes',
    art: p => npc(680, 1720, 260, '#d9c27a', '#efe2a8', { iris: '#e0a326', mouth: p ? 'frown' : 'smile', brow: p ? 'sad' : undefined, label: 'THE JACKAL' }) + darrowGold(260, 1740, 200, { blade: true }) + (p ? hand(470, 1560) + `<path d="M420 1440 l30 40 l-20 30" stroke="${C.red}" stroke-width="10" fill="none"/>` : '') },
  { bg: 'parch', l1: 'HE WON THE INSTITUTE.', start: 'darrow wins',
    art: () => instituteMap({ overlay: houseFlags(11) }) },
  { bg: 'dark', l1: 'HIS PRIZE?', l2: 'SERVE THE MAN WHO HANGED EO.', start: 'his prize', pop: 'the man who',
    art: p => (p ? `<g opacity=".25">${gallows(870, 1500)}</g>` + flower(880, 1470, 30, 60) : '') + npc(620, 1700, 340, '#e0a326', '#cfcfcf', { crown: true, iris: '#e0a326', brow: 'angry', label: 'ARCHGOVERNOR AUGUSTUS' }) + darrowGold(230, 1700, 170, {}) },
  { bg: 'dark', outro: true, l1: 'HE BECAME A GOLD TO DESTROY THEM.', l2: 'NOW HE KNEELS TO ONE.', start: 'he became', pop: 'now he has',
    q: 'Do you want Golden Son next?', a: 'Yes or No', art: () => '' },
];
module.exports = { BEATS };
