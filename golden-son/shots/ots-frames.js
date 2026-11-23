// Starting frames for the Seedance over-the-shoulder exchange ("Cassius." / "Darrow.").
const fs = require('fs'), path = require('path'); const { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), W = 1080, H = 1920, L = require('../lighting.js'), K = require('../cast.js');
const MONO = `<filter id="mono" x="0" y="0" width="100%" height="100%"><feColorMatrix type="matrix" values="0.32 0.34 0.34 0 -0.03  0.32 0.34 0.34 0 -0.03  0.33 0.34 0.38 0 0  0 0 0 1 0"/></filter>`;
const f = v => v.toFixed(1);
// seared steak on a plate; crushed = flattened with juice splash
const steak = (x, y, s = 1, crushed = false) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse rx="120" ry="24" fill="#eef1f5" stroke="#1b1210" stroke-width="6"/><ellipse rx="86" ry="14" fill="#cfd6df"/>
  ${crushed ? `<ellipse cx="0" cy="-6" rx="96" ry="12" fill="#6a2c16" stroke="#1b1210" stroke-width="5"/><path d="M-110 -4 q-30 -20 -50 -6 M110 -4 q30 -24 54 -10 M-60 -10 q-10 -30 -30 -34" stroke="#8a1a12" stroke-width="8" fill="none" stroke-linecap="round"/>`
  : `<path d="M-70 -14 Q-80 -52 -20 -58 Q50 -64 74 -36 Q86 -16 60 -10 Z" fill="#7a3418" stroke="#1b1210" stroke-width="6" stroke-linejoin="round"/><path d="M-50 -24 l30 -26 M-15 -20 l30 -30 M20 -18 l28 -28" stroke="#3a1608" stroke-width="7" stroke-linecap="round"/><path d="M-60 -18 Q-10 -30 60 -14" stroke="#c96a3a" stroke-width="5" fill="none" opacity=".7"/>
    ${[-40, 0, 38].map((sx, i) => `<path d="M${sx} -70 q-16 -30 4 -56 q18 -26 0 -54" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" opacity=".35"/>`).join('')}`}</g>`;
const room = t => `<g filter="url(#mono)">${L.skyOrRoom('gala', t, { floorY: 1300 })}</g>`;
const crowd = (n, y, s, col = '#14141c') => { let o = ''; for (let i = 0; i < n; i++) { const x = ((i * 191 + 53) % 1300) - 110, sc = s * (0.85 + ((i * 7) % 5) / 15); o += `<circle cx="${x}" cy="${y - sc * 1.9}" r="${sc * .38}" fill="${col}"/><path d="M${x - sc * .5} ${y} Q${x - sc * .5} ${y - sc * 1.5} ${x} ${y - sc * 1.55} Q${x + sc * .5} ${y - sc * 1.5} ${x + sc * .5} ${y}Z" fill="${col}"/>`; } return o; };
const wine = (x, y, s) => `<path d="M${x - s * .18} ${y - s * 1.3} q${s * .06} ${s * .1} ${s * .02} ${s * .26} q${s * .1} ${s * .02} ${s * .08} ${s * .18} q${-s * .12} ${s * .04} ${-s * .2} ${-s * .06} q${-s * .06} ${-s * .18} ${s * .1} ${-s * .38}Z" fill="#7a1018" opacity=".78"/>`;
const FRAMES = {
  // A: over Cassius's shoulder (fg right), looking up at Darrow on the table
  'ots-cassius': () => {
    const TY = 1330;
    const table = `<rect x="-200" y="${TY}" width="1480" height="700" fill="#2b4a8a"/><rect x="-200" y="${TY}" width="1480" height="18" fill="#d8e0ea"/><rect x="-200" y="${TY + 18}" width="1480" height="40" fill="#1b2f5c"/>`;
    return room(0) + crowd(12, 1290, 90) + table + steak(560, TY, .9, true) + `<g transform="translate(150 ${TY}) "><path d="M-22 -100 h44 l-7 52 h-10 v34 h18 v12 h-46 v-12 h18 v-34 h-10z" fill="#e2a93b" stroke="#1b1210" stroke-width="5" transform="rotate(75)"/></g>`
      + L.floorShadow(430, TY + 6, 200, { mood: 'gala' }) + L.rimLight(K.darrow(430, TY, 300, { yaw: -14, pitch: -8, mouth: 'smirk', brow: 'angry', arms: ['hang', 'hang'] }), 'gala')
      + L.dof('near', L.rimLight(K.cassius(840, 2520, 640, { back: true, yaw: 180, arms: ['table', 'table'] }), 'gala'));
  },
  // B: over Darrow's shoulder (fg left, from behind/above), looking down at Cassius seated
  'ots-darrow': () => {
    const TY = 1480;
    const table = `<rect x="-200" y="${TY}" width="1480" height="700" fill="#2b4a8a"/><rect x="-200" y="${TY}" width="1480" height="18" fill="#d8e0ea"/><rect x="-200" y="${TY + 18}" width="1480" height="60" fill="#1b2f5c"/>`;
    const cas = K.cassius(790, TY + 330, 360, { yaw: -14, pitch: 12, brow: 'angry', mouth: 'frown', arms: ['table', 'table'] });
    return room(0) + crowd(10, 1300, 100) + L.rimLight(cas, 'gala') + wine(790, TY + 330, 360) + table + steak(330, TY + 10, .8, false).replace(/<path d="M-?\d+ -70[^>]*>/g, '')
      + L.dof('near', L.rimLight(K.darrow(130, 2560, 740, { back: true, yaw: 180, arms: ['hang', 'hang'] }), 'gala'));
  },
};
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  for (const [k, fn] of Object.entries(FRAMES)) { await p.setContent(`<style>body{margin:0}svg{position:absolute;inset:0}</style><svg class="gsl-frame" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><defs>${MONO}</defs>${L.defs()}${fn()}${L.bokeh(3, 0, { count: 14, opacity: .4 })}${L.grade('gala', {})}</svg>`); await p.screenshot({ path: `${ROOT}/out/${k}.png` }); }
  await b.close();
})();
