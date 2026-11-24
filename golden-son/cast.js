// Golden Son supporting cast in the chibi v2 style (same builder as Darrow/Cassius).
const R = require('./rig.js'), C = require('./chibi2.js');
const { build, lionFace, sunEmblem } = C, INK = '#1b1210';
const f = v => v.toFixed(1);

// extra hair styles built from rig.js heads: 'curls' | 'spikes' | 'short' | 'none', plus overlays drawn here
const overlay = {
  slick: (x, y, r, col) => `<path d="M${f(x - r * 1.0)} ${f(y - r * .05)} Q${f(x - r * 1.05)} ${f(y - r * 1.08)} ${f(x)} ${f(y - r * 1.08)} Q${f(x + r * 1.05)} ${f(y - r * 1.08)} ${f(x + r * 1.0)} ${f(y - r * .05)} Q${f(x + r * .7)} ${f(y - r * .55)} ${f(x)} ${f(y - r * .62)} Q${f(x - r * .7)} ${f(y - r * .55)} ${f(x - r * 1.0)} ${f(y - r * .05)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}" stroke-linejoin="round"/>${[-.5, -.15, .2, .55].map(k => `<path d="M${f(x + k * r)} ${f(y - r * .62)} Q${f(x + k * r * 1.1)} ${f(y - r * .95)} ${f(x + k * r * .4)} ${f(y - r * 1.05)}" stroke="#c9b06a" stroke-width="${f(r * .035)}" fill="none"/>`).join('')}`,
  // Bonerider jackal-skull mask (covers the face)
  jackalMask: (x, y, r) => `<g><path d="M${f(x - r * .95)} ${f(y - r * .55)} L${f(x - r * .7)} ${f(y - r * 1.45)} L${f(x - r * .35)} ${f(y - r * .8)} Z M${f(x + r * .95)} ${f(y - r * .55)} L${f(x + r * .7)} ${f(y - r * 1.45)} L${f(x + r * .35)} ${f(y - r * .8)} Z" fill="#efe6cf" stroke="${INK}" stroke-width="${f(r * .07)}" stroke-linejoin="round"/>
    <path d="M${f(x - r * .9)} ${f(y - r * .6)} Q${f(x)} ${f(y - r * 1.05)} ${f(x + r * .9)} ${f(y - r * .6)} L${f(x + r * .78)} ${f(y + r * .1)} L${f(x + r * .3)} ${f(y + r * .35)} L${f(x + r * .2)} ${f(y + r * 1.05)} L${f(x - r * .2)} ${f(y + r * 1.05)} L${f(x - r * .3)} ${f(y + r * .35)} L${f(x - r * .78)} ${f(y + r * .1)} Z" fill="#efe6cf" stroke="${INK}" stroke-width="${f(r * .08)}" stroke-linejoin="round"/>
    ${[-1, 1].map(d => `<path d="M${f(x + d * r * .62)} ${f(y - r * .3)} L${f(x + d * r * .18)} ${f(y - r * .16)} L${f(x + d * r * .5)} ${f(y + r * .08)} Z" fill="#1a1210"/><circle cx="${f(x + d * r * .4)}" cy="${f(y - r * .14)}" r="${f(r * .06)}" fill="#ff3a2a"/>`).join('')}
    <path d="M${f(x - r * .08)} ${f(y + r * .82)} h${f(r * .16)} l${f(-r * .08)} ${f(r * .14)} Z" fill="#1a1210"/>
    ${[-3, -2, -1, 0, 1, 2, 3].map(i => `<path d="M${f(x + i * r * .055)} ${f(y + r * .5)} l${f(r * .025)} ${f(r * .12)} l${f(r * .025)} ${f(-r * .12)}" fill="#fff" stroke="${INK}" stroke-width="${f(r * .025)}"/>`).join('')}
    <path d="M${f(x - r * .55)} ${f(y - r * .72)} q${f(r * .12)} ${f(r * .1)} ${f(r * .3)} ${f(r * .06)} M${f(x + r * .25)} ${f(y - r * .66)} q${f(r * .18)} ${f(-r * .02)} ${f(r * .3)} ${f(-r * .1)}" stroke="#b8ab8a" stroke-width="${f(r * .04)}" fill="none"/></g>`,
  bald: () => '',
  bun: (x, y, r, col) => `<circle cx="${f(x)}" cy="${f(y - r * 1.05)}" r="${f(r * .38)}" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}"/>`,
  mohawk: (x, y, r, col) => `<path d="M${f(x - r * .3)} ${f(y - r * .75)} L${f(x - r * .2)} ${f(y - r * 1.5)} L${f(x)} ${f(y - r * 1.25)} L${f(x + r * .12)} ${f(y - r * 1.6)} L${f(x + r * .25)} ${f(y - r * 1.25)} L${f(x + r * .38)} ${f(y - r * 1.45)} L${f(x + r * .35)} ${f(y - r * .75)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}" stroke-linejoin="round"/>`,
  braid: (x, y, r, col) => `<path d="M${f(x)} ${f(y - r * .98)} Q${f(x + r * .3)} ${f(y - r * 1.5)} ${f(x + r * .7)} ${f(y - r * 1.25)}" stroke="${INK}" stroke-width="${f(r * .34)}" fill="none" stroke-linecap="round"/><path d="M${f(x)} ${f(y - r * .98)} Q${f(x + r * .3)} ${f(y - r * 1.5)} ${f(x + r * .7)} ${f(y - r * 1.25)}" stroke="${col}" stroke-width="${f(r * .24)}" fill="none" stroke-linecap="round"/>`,
  beard: (x, y, r, col) => `<path d="M${f(x - r * .82)} ${f(y + r * .1)} Q${f(x - r * .7)} ${f(y + r * 1.25)} ${f(x)} ${f(y + r * 1.32)} Q${f(x + r * .7)} ${f(y + r * 1.25)} ${f(x + r * .82)} ${f(y + r * .1)} Q${f(x + r * .5)} ${f(y + r * .7)} ${f(x)} ${f(y + r * .62)} Q${f(x - r * .5)} ${f(y + r * .7)} ${f(x - r * .82)} ${f(y + r * .1)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .07)}" stroke-linejoin="round"/>`,
  stubble: (x, y, r) => `<path d="M${f(x - r * .7)} ${f(y + r * .35)} Q${f(x)} ${f(y + r * 1.15)} ${f(x + r * .7)} ${f(y + r * .35)}" stroke="#8a7a6a" stroke-width="${f(r * .22)}" fill="none" opacity=".45"/>`,
  scar: (x, y, r) => `<path d="M${f(x - r * .75)} ${f(y - r * .25)} q${f(r * .25)} ${f(r * .35)} ${f(r * .1)} ${f(r * .8)} q${f(r * .2)} ${f(-r * .1)} ${f(r * .3)} ${f(r * .2)}" fill="#c98a7a" stroke="#8a4a3a" stroke-width="${f(r * .05)}" opacity=".85"/>`,
  tattoo: (x, y, r) => `<path d="M${f(x - r * .5)} ${f(y - r * .55)} l${f(r * .15)} ${f(r * .5)} l${f(-r * .1)} ${f(r * .4)} M${f(x + r * .5)} ${f(y - r * .55)} l${f(-r * .15)} ${f(r * .5)} l${f(r * .1)} ${f(r * .4)}" stroke="#2a3a6a" stroke-width="${f(r * .08)}" fill="none" stroke-linecap="round"/>`,
  crown: (x, y, r) => `<path d="M${f(x - r * .55)} ${f(y - r * .95)} l${f(r * .18)} ${f(-r * .42)} l${f(r * .18)} ${f(r * .25)} l${f(r * .19)} ${f(-r * .38)} l${f(r * .19)} ${f(r * .38)} l${f(r * .18)} ${f(-r * .25)} l${f(r * .18)} ${f(r * .42)} Z" fill="#f0c04a" stroke="${INK}" stroke-width="${f(r * .07)}" stroke-linejoin="round"/>`,
  patchEye: (x, y, r) => `<path d="M${f(x - r * .95)} ${f(y - r * .55)} L${f(x + r * .95)} ${f(y + r * .25)}" stroke="#141010" stroke-width="${f(r * .09)}"/><ellipse cx="${f(x + r * .36)}" cy="${f(y + r * .08)}" rx="${f(r * .27)}" ry="${f(r * .22)}" fill="#141010" stroke="#000" stroke-width="${f(r * .05)}"/>`,
  pony: (x, y, r, col) => `<path d="M${f(x + r * .55)} ${f(y - r * .75)} Q${f(x + r * 1.55)} ${f(y - r * .6)} ${f(x + r * 1.35)} ${f(y + r * .9)} Q${f(x + r * 1.15)} ${f(y + r * .1)} ${f(x + r * .75)} ${f(y - r * .35)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}" stroke-linejoin="round"/><circle cx="${f(x + r * .78)}" cy="${f(y - r * .62)}" r="${f(r * .14)}" fill="#a81f1c" stroke="${INK}" stroke-width="${f(r * .05)}"/>`,
  mechEye: (x, y, r) => `<circle cx="${f(x + r * .36)}" cy="${f(y + r * .07)}" r="${f(r * .2)}" fill="#7fd3ff" stroke="${INK}" stroke-width="${f(r * .05)}" opacity=".9"/>`,
};

// kit(name): body colors, head options, overlays, height factor
function kit(o) {
  return { yaw: o.yaw ?? 0, hair: o.hairLong ? 'long' : o.hair, arms: o.arms || ['hang', 'hang'],
    hairOpts: { hairCol: o.hairCol, hairHi: o.hairHi || '#fff2c4', hairShade: o.hairShade || '#8a6a2a' },
    headOpts: { hair: o.hair || 'short', hairCol: o.hairCol, hairHi: o.hairHi || '#fff2c4', brow: o.brow || 'soft', mouth: o.mouth || 'flat', iris: o.iris || '#e0a326' },
    body: { fill: o.fill, shade: o.shade, trim: o.trim, cape: o.cape, leg: o.leg || '#1e1a1f', greave: o.greave || o.fill, boot: o.boot || '#1e1a1f', sigil: o.sigil },
    armCol: { sleeve: o.sleeve || o.leg || '#1e1a1f', fore: o.fore || o.fill, cuff: o.trim, hand: o.hand || '#f2d3b3' },
    extra: o.extra, top: o.top, scar: o.scar, over: o.over || [], overCol: o.overCol || o.hairCol, skin: o.skin };
}
function make(K) {
  return (x, y, s, o = {}) => { const k = kit({ ...K, ...o.kitOverride });
    let svg = build(x, y, s * (K.scale || 1), { ...(K.hairLong ? { hair: 'long' } : {}), ...o }, k);
    const S = s * (K.scale || 1), yaw = o.yaw ?? k.yaw, r = S * 0.42, hx = x, hy = y - S * 1.55 - r + S * 0.02; // keep in sync with chibi2 build()
    const ov = k.over.map(n => overlay[n](hx, hy, r, k.overCol)).join('');
    if (K.skin) svg = svg.replace(/#f2d3b3/g, K.skin).replace(/#dcae88/g, K.skinSh || '#b98a6a');
    return svg.replace(/<\/g>$/, ov + '</g>');
  };
}
const eagle = col => (a, b, c) => R.eagle(a, b, c, col);
const rune = (x, y, s) => `<path d="M${f(x)} ${f(y - s * .14)} v${f(s * .28)} M${f(x - s * .1)} ${f(y - s * .06)} l${f(s * .1)} ${f(s * .08)} l${f(s * .1)} ${f(-s * .08)}" stroke="#7fb8ff" stroke-width="${f(s * .03)}" fill="none"/>`;
const wolf = (x, y, s) => `<path d="M${f(x - s * .16)} ${f(y - s * .1)} l${f(s * .06)} ${f(-s * .1)} l${f(s * .06)} ${f(s * .07)} h${f(s * .08)} l${f(s * .06)} ${f(-s * .07)} l${f(s * .06)} ${f(s * .1)} l${f(-s * .06)} ${f(s * .2)} l${f(-s * .1)} ${f(s * .05)} l${f(-s * .1)} ${f(-s * .05)} Z" fill="#cfd4dc" stroke="${INK}" stroke-width="${f(s * .02)}"/>`;
const helmetAres = (x, y, s) => { let sp = ''; for (let i = 0; i < 9; i++) { const a = (-160 + i * 17.5) * Math.PI / 180; sp += `<path d="M${f(x + Math.cos(a - .08) * s * .13)} ${f(y + Math.sin(a - .08) * s * .13)} L${f(x + Math.cos(a) * s * .26)} ${f(y + Math.sin(a) * s * .26)} L${f(x + Math.cos(a + .08) * s * .13)} ${f(y + Math.sin(a + .08) * s * .13)}Z" fill="#b0231f" stroke="${INK}" stroke-width="${f(s * .015)}"/>`; }
  return sp + `<path d="M${f(x - s * .13)} ${f(y + s * .1)} Q${f(x - s * .14)} ${f(y - s * .14)} ${f(x)} ${f(y - s * .15)} Q${f(x + s * .14)} ${f(y - s * .14)} ${f(x + s * .13)} ${f(y + s * .1)} L${f(x + s * .05)} ${f(y + s * .12)} L${f(x + s * .04)} ${f(y)} L${f(x - s * .04)} ${f(y)} L${f(x - s * .05)} ${f(y + s * .12)} Z" fill="#b0231f" stroke="${INK}" stroke-width="${f(s * .02)}" stroke-linejoin="round"/>`; };

const CAST = {
  augustus: make({ hair: 'short', hairCol: '#d9b456', fill: '#2a2224', shade: '#120e10', trim: '#e2a93b', cape: '#8f1d16', leg: '#1a1416', brow: 'angry', mouth: 'frown', sigil: (x, y, s) => lionFace(x, y, s * .16, '#b8862a', '#e6bb5c', '#5a3a10'), over: ['crown'], scale: 1.0 }),
  karnus: make({ hair: 'spikes', hairCol: '#a8782a', fill: '#2b4a8a', shade: '#16294a', trim: '#d8e0ea', cape: '#1b2f5c', leg: '#16294a', brow: 'angry', mouth: 'smirk', sigil: eagle('#d8e0ea'), scale: 1.12 }),
  harmony: make({ scar: false, hair: 'short', hairCol: '#b3361f', fill: '#3a2a26', shade: '#1e1412', trim: '#b0231f', leg: '#2a1e1a', brow: 'angry', mouth: 'flat', iris: '#8a3a2a', over: ['scar'], scale: .9 }),
  sovereign: make({ hair: 'none', hairCol: '#e8d28e', hairHi: '#fff6d8', fill: '#1c181a', shade: '#0c0a0b', trim: '#e2c070', leg: '#141012', sleeve: '#1c181a', fore: '#1c181a', brow: 'soft', mouth: 'flat', over: ['slick', 'bun'], overCol: '#e8d28e', sigil: (x, y, s) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(s * .13)}" fill="none" stroke="#e2c070" stroke-width="${f(s * .022)}"/><path d="M${f(x)} ${f(y - s * .11)} L${f(x + s * .095)} ${f(y + s * .065)} L${f(x - s * .095)} ${f(y + s * .065)} Z" fill="none" stroke="#e2c070" stroke-width="${f(s * .02)}" stroke-linejoin="round"/><path d="M${f(x - s * .3)} ${f(y - s * .32)} L${f(x - s * .16)} ${f(y - s * .1)} L${f(x - s * .2)} ${f(y + s * .4)} M${f(x + s * .3)} ${f(y - s * .32)} L${f(x + s * .16)} ${f(y - s * .1)} L${f(x + s * .2)} ${f(y + s * .4)}" stroke="#e2c070" stroke-width="${f(s * .016)}" fill="none"/>`, scale: .92 }),
  ragnar: make({ scar: false, hair: 'none', hairCol: '#eef2f6', fill: '#2a2a32', shade: '#14141a', trim: '#7fb8ff', leg: '#1e1e24', brow: 'angry', mouth: 'flat', iris: '#1b1210', over: ['tattoo', 'braid'], overCol: '#eef2f6', skin: '#e8e4e0', skinSh: '#c4beb8', sigil: rune, scale: 1.25 }),
  lorn: make({ hair: 'short', hairCol: '#d6bc6a', fill: '#6a5a3a', shade: '#3a301e', trim: '#c9a24a', cape: '#5a4a3a', leg: '#2a241c', brow: 'soft', mouth: 'flat', over: ['beard'], overCol: '#cdb466', scale: 1.0 }),
  sevro: make({ hair: 'none', hairCol: '#e8ae3a', fill: '#3a3a3e', shade: '#1e1e22', trim: '#cfd4dc', cape: '#7f8798', leg: '#26262a', brow: 'angry', mouth: 'smirk', over: ['mohawk', 'patchEye'], sigil: wolf, scale: .86 }),
  fitchner: make({ hair: 'short', hairCol: '#b8964a', fill: '#7a6a3a', shade: '#4a3e20', trim: '#c9a24a', leg: '#3a3020', brow: 'soft', mouth: 'smirk', over: ['stubble'], scale: .95 }),
  mustang: make({ hairLong: true, hair: 'short', hairCol: '#f2d27a', over: ['pony'], overCol: '#f2d27a', fill: '#f4ecd8', shade: '#c9b98a', trim: '#e2a93b', leg: '#d8ccb0', brow: 'soft', mouth: 'smile', sigil: (x, y, s) => lionFace(x, y, s * .12, '#e2a93b', '#fff2c4', '#8a6a1a'), scale: .92 }),
  roque: make({ hairLong: true, hair: 'short', hairCol: '#e0a636', hairHi: '#fbe08a', hairShade: '#a8761e', fill: '#5a2e6a', shade: '#2e1838', trim: '#e2a93b', leg: '#2e1838', brow: 'sad', mouth: 'flat', scale: .97 }),
  jackal: make({ hair: 'short', hairCol: '#e2c062', fill: '#4a3e2a', shade: '#2a2216', trim: '#c9a24a', leg: '#2a2216', brow: 'soft', mouth: 'smirk', iris: '#c9a24a', arms: ['hang', 'stump'], scale: .9 }),
  red: make({ scar: false, hair: 'short', hairCol: '#a52617', hairShade: '#6e180e', hairHi: '#e0604a', fill: '#8a3a2a', shade: '#4a1e14', trim: '#c9a24a', leg: '#3a1e14', brow: 'sad', mouth: 'flat', scale: .95 }),
  guard: make({ scar: false, hair: 'none', hairCol: '#2a2a2a', fill: '#e6dcc4', shade: '#a89878', trim: '#7a6a4a', leg: '#2a2420', sleeve: '#2a2420', fore: '#d8ccb0', brow: 'angry', mouth: 'flat', over: ['jackalMask'], sigil: (x, y, s) => [-2, -1, 0, 1, 2].map(i => `<path d="M${f(x - s * .2)} ${f(y - s * .12 + i * s * .07)} Q${f(x)} ${f(y - s * .06 + i * s * .07)} ${f(x + s * .2)} ${f(y - s * .12 + i * s * .07)}" stroke="#8a7a5a" stroke-width="${f(s * .022)}" fill="none"/>`).join('') + `<path d="M${f(x)} ${f(y - s * .2)} V${f(y + s * .2)}" stroke="#8a7a5a" stroke-width="${f(s * .03)}"/>`, scale: 1 }),
};
CAST.darrow = C.darrow; CAST.cassius = C.cassius; CAST.ares = helmetAres;
module.exports = CAST;
