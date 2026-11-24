// Start/end frames + character refs for Seedance v2 (our chibi models, no captions).
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, L = require('../lighting.js'), K = require('../cast.js');
const C2 = require('../chibi2.js'), OTS = require('./ots-frames.js');
const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const goblet = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-22 -40 h44 l-6 34 q-6 14 -16 14 q-10 0 -16 -14 z" fill="#e2a93b" stroke="#1b1210" stroke-width="5" stroke-linejoin="round"/><path d="M-17 -34 h34 l-2 10 h-30z" fill="#8f1018"/><path d="M-4 8 v18 h-12 v7 h32 v-7 h-12 v-18z" fill="#c98f2a" stroke="#1b1210" stroke-width="4"/></g>`;
const room = () => `<g filter="url(#mono)">${L.skyOrRoom('gala', 0, { floorY: 1300 })}</g>`;
const FR = {
  start: () => OTS.FRAMES['ots-cassius'](['blade', 'hang']),
  end: () => {
    const TY = 1480, x = 790, y = TY + 330, s = 360, side = 1;
    const cas = K.cassius(x, y, s, { yaw: -14, pitch: 6, brow: 'soft', mouth: 'flat', arms: ['table', 'raise'] });
    const [hx, hy] = C2.handAt(x, y, s, side, 'raise', -14);
    const table = `<rect x="-200" y="${TY}" width="1480" height="700" fill="#2b4a8a"/><rect x="-200" y="${TY}" width="1480" height="18" fill="#d8e0ea"/>`;
    return room() + L.rimLight(cas, 'gala') + OTS.wine(x, y, s) + goblet(988, 1050, 1.5) + table
      + L.dof('near', L.rimLight(K.darrow(130, 2560, 740, { back: true, yaw: 180, arms: ['hang', 'hang'] }), 'gala'));
  },
  'ref-darrow': () => `<rect width="1080" height="1920" fill="#e9e6e0"/>` + K.darrow(320, 1500, 420, { yaw: 0, mouth: 'smirk', arms: ['blade', 'hang'] }) + K.darrow(800, 1500, 420, { yaw: 40, mouth: 'smirk', arms: ['hang', 'hang'] }),
  'ref-cassius': () => `<rect width="1080" height="1920" fill="#e9e6e0"/>` + K.cassius(320, 1500, 420, { yaw: 0, mouth: 'flat', arms: ['hang', 'hang'] }) + K.cassius(800, 1500, 420, { yaw: 180, back: true, arms: ['hang', 'hang'] }),
};
module.exports = { FR };
if (require.main === module) (async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  const only = process.argv[2] ? process.argv[2].split(',') : Object.keys(FR);
  for (const k of only) { await p.setContent(`<style>body{margin:0}svg{position:absolute;inset:0}</style><svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${FR[k]()}${k.startsWith('ref') ? '' : L.grade('gala', {})}</svg>`);
    await p.screenshot({ path: `${ROOT}/seedance/${k}.jpg`, type: 'jpeg', quality: 92 }); }
  await b.close(); console.log('ok', only.join(' '));
})();
