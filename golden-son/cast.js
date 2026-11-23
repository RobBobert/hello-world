// Golden Son supporting cast in the chibi v2 style (same builder as Darrow/Cassius).
const R = require('./rig.js'), C = require('./chibi2.js');
const { build, lionFace, sunEmblem } = C, INK = '#1b1210';
const f = v => v.toFixed(1);

// extra hair styles built from rig.js heads: 'curls' | 'spikes' | 'short' | 'none', plus overlays drawn here
const overlay = {
  bald: () => '',
  bun: (x, y, r, col) => `<circle cx="${f(x)}" cy="${f(y - r * 1.05)}" r="${f(r * .38)}" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}"/>`,
  mohawk: (x, y, r, col) => `<path d="M${f(x - r * .3)} ${f(y - r * .75)} L${f(x - r * .2)} ${f(y - r * 1.5)} L${f(x)} ${f(y - r * 1.25)} L${f(x + r * .12)} ${f(y - r * 1.6)} L${f(x + r * .25)} ${f(y - r * 1.25)} L${f(x + r * .38)} ${f(y - r * 1.45)} L${f(x + r * .35)} ${f(y - r * .75)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .08)}" stroke-linejoin="round"/>`,
  braid: (x, y, r, col) => `<path d="M${f(x)} ${f(y - r * .98)} Q${f(x + r * .3)} ${f(y - r * 1.5)} ${f(x + r * .7)} ${f(y - r * 1.25)}" stroke="${INK}" stroke-width="${f(r * .34)}" fill="none" stroke-linecap="round"/><path d="M${f(x)} ${f(y - r * .98)} Q${f(x + r * .3)} ${f(y - r * 1.5)} ${f(x + r * .7)} ${f(y - r * 1.25)}" stroke="${col}" stroke-width="${f(r * .24)}" fill="none" stroke-linecap="round"/>`,
  beard: (x, y, r, col) => `<path d="M${f(x - r * .82)} ${f(y + r * .1)} Q${f(x - r * .7)} ${f(y + r * 1.25)} ${f(x)} ${f(y + r * 1.32)} Q${f(x + r * .7)} ${f(y + r * 1.25)} ${f(x + r * .82)} ${f(y + r * .1)} Q${f(x + r * .5)} ${f(y + r * .7)} ${f(x)} ${f(y + r * .62)} Q${f(x - r * .5)} ${f(y + r * .7)} ${f(x - r * .82)} ${f(y + r * .1)} Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .07)}" stroke-linejoin="round"/>`,
  stubble: (x, y, r) => `<path d="M${f(x - r * .7)} ${f(y + r * .35)} Q${f(x)} ${f(y + r * 1.15)} ${f(x + r * .7)} ${f(y + r * .35)}" stroke="#8a7a6a" stroke-width="${f(r * .22)}" fill="none" opacity=".45"/>`,
  scar: (x, y, r) => `<path d="M${f(x - r * .75)} ${f(y - r * .25)} q${f(r * .25)} ${f(r * .35)} ${f(r * .1)} ${f(r * .8)} q${f(r * .2)} ${f(-r * .1)} ${f(r * .3)} ${f(r * .2)}" fill="#c98a7a" stroke="#8a4a3a" stroke-width="${f(r * .05)}" opacity=".85"/>`,
  tattoo: (x, y, r) => `<path d="M${f(x - r * .5)} ${f(y - r * .55)} l${f(r * .15)} ${f(r * .5)} l${f(-r * .1)} ${f(r * .4)} M${f(x + r * .5)} ${f(y - r * .55)} l${f(-r * .15)} ${f(r * .5)} l${f(r * .1)} ${f(r * .4)}" stroke="#2a3a6a" stroke-width="${f(r * .08)}" fill="none" stroke-linecap="round"/>`,
  crown: (x, y, r) => `<path d="M${f(x - r * .55)} ${f(y - r * .95)} l${f(r * .18)} ${f(-r * .42)} l${f(r * .18)} ${f(r * .25)} l${f(r * .19)} ${f(-r * .38)} l${f(r * .19)} ${f(r * .38)} l${f(r * .18)} ${f(-r * .25)} l${f(r * .18)} ${f(r * .42)} Z" fill="#f0c04a" stroke="${INK}" stroke-width="${f(r * .07)}" stroke-linejoin="round"/>`,
  patchEye: () => '',
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
    extra: o.extra, top: o.top, over: o.over || [], overCol: o.overCol || o.hairCol, skin: o.skin };
}
function make(K) {
  return (x, y, s, o = {}) => { const k = kit({ ...K, ...o.kitOverride });
    let svg = build(x, y, s * (K.scale || 1), { ...(K.hairLong ? { hair: 'long' } : {}), ...o }, k);
    const S = s * (K.scale || 1), yaw = o.yaw ?? k.yaw, r = S * 0.42, hx = x + yaw * S * 0.0012, hy = y - S * 1.55 - r * 0.78;
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
  augustus: make({ hair: 'short', hairCol: '#c9b27a', fill: '#2a2224', shade: '#120e10', trim: '#e2a93b', cape: '#8f1d16', leg: '#1a1416', brow: 'angry', mouth: 'frown', sigil: (x, y, s) => lionFace(x, y, s * .16, '#b8862a', '#e6bb5c', '#5a3a10'), over: ['crown'], scale: 1.0 }),
  karnus: make({ hair: 'spikes', hairCol: '#a8782a', fill: '#2b4a8a', shade: '#16294a', trim: '#d8e0ea', cape: '#1b2f5c', leg: '#16294a', brow: 'angry', mouth: 'smirk', sigil: eagle('#d8e0ea'), scale: 1.12 }),
  harmony: make({ hair: 'short', hairCol: '#b3361f', fill: '#3a2a26', shade: '#1e1412', trim: '#b0231f', leg: '#2a1e1a', brow: 'angry', mouth: 'flat', iris: '#8a3a2a', over: ['scar'], scale: .9 }),
  sovereign: make({ hair: 'short', hairCol: '#e6cf8a', fill: '#f2efe8', shade: '#b8b2a6', trim: '#e2a93b', cape: '#e2a93b', leg: '#d8d2c6', brow: 'soft', mouth: 'flat', over: ['bun', 'crown'], overCol: '#e6cf8a', sigil: (x, y, s) => sunEmblem(x, y, s * .12), scale: .92 }),
  ragnar: make({ hair: 'none', hairCol: '#eef2f6', fill: '#2a2a32', shade: '#14141a', trim: '#7fb8ff', leg: '#1e1e24', brow: 'angry', mouth: 'flat', iris: '#1b1210', over: ['tattoo', 'braid'], overCol: '#eef2f6', skin: '#e8e4e0', skinSh: '#c4beb8', sigil: rune, scale: 1.25 }),
  lorn: make({ hair: 'short', hairCol: '#b8b4ac', fill: '#6a5a3a', shade: '#3a301e', trim: '#c9a24a', cape: '#5a4a3a', leg: '#2a241c', brow: 'soft', mouth: 'flat', over: ['beard'], overCol: '#b8b4ac', scale: 1.0 }),
  sevro: make({ hair: 'none', hairCol: '#c9a24a', fill: '#3a3a3e', shade: '#1e1e22', trim: '#cfd4dc', cape: '#7f8798', leg: '#26262a', brow: 'angry', mouth: 'smirk', over: ['mohawk', 'mechEye'], sigil: wolf, scale: .86 }),
  fitchner: make({ hair: 'short', hairCol: '#b8964a', fill: '#7a6a3a', shade: '#4a3e20', trim: '#c9a24a', leg: '#3a3020', brow: 'soft', mouth: 'smirk', over: ['stubble'], scale: .95 }),
  mustang: make({ hairLong: true, hair: 'short', hairCol: '#f2d27a', over: ['pony'], overCol: '#f2d27a', fill: '#f4ecd8', shade: '#c9b98a', trim: '#e2a93b', leg: '#d8ccb0', brow: 'soft', mouth: 'smile', sigil: (x, y, s) => lionFace(x, y, s * .12, '#e2a93b', '#fff2c4', '#8a6a1a'), scale: .92 }),
  roque: make({ hairLong: true, hair: 'short', hairCol: '#e6c46a', fill: '#5a2e6a', shade: '#2e1838', trim: '#e2a93b', leg: '#2e1838', brow: 'sad', mouth: 'flat', scale: .97 }),
  jackal: make({ hair: 'short', hairCol: '#c9b27a', fill: '#4a3e2a', shade: '#2a2216', trim: '#c9a24a', leg: '#2a2216', brow: 'soft', mouth: 'smirk', iris: '#c9a24a', arms: ['hang', 'stump'], scale: .9 }),
  red: make({ hair: 'spikes', hairCol: '#a52617', fill: '#8a3a2a', shade: '#4a1e14', trim: '#c9a24a', leg: '#3a1e14', brow: 'sad', mouth: 'flat', scale: .95 }),
  guard: make({ hair: 'short', hairCol: '#2a2a2a', fill: '#3a3a40', shade: '#1e1e22', trim: '#8a8f98', leg: '#26262a', brow: 'angry', mouth: 'flat', scale: 1 }),
};
CAST.darrow = C.darrow; CAST.cassius = C.cassius; CAST.ares = helmetAres;
module.exports = CAST;
