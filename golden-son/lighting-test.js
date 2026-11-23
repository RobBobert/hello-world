// Renders one 1080x1920 style frame per mood into out/lighting-<mood>.png with stand-in silhouettes, and times a frame.
// usage: node lighting-test.js [mood ...]
const fs = require('fs'); const { chromium } = require('playwright');
const L = require('./lighting.js'); const S = require('./style.js');
const INK = S.INK, FY = 1260;

// stand-ins: flat local colour + ink line only. ALL light on them comes from lighting.js (lit / floorShadow).
function figure(x, y, h) { const u = h / 900, D = S.darrow; return `<g transform="translate(${x} ${y}) scale(${u})" stroke="${INK}" stroke-width="9" stroke-linejoin="round">
  <path d="M-150 -640 L-235 -20 L-70 0 L0 -330 L70 0 L235 -20 L150 -640Z" fill="${D.cloak}"/>
  <path d="M-62 -330 L-84 -8 h66 L0 -250 L18 -8 h66 L62 -330Z" fill="#2a2030"/>
  <path d="M-128 -650 L-98 -300 H98 L128 -650 L60 -700 H-60Z" fill="${D.armor}"/>
  <path d="M-128 -650 l-74 34 l10 250 l52 -8z M128 -650 l74 34 l-10 250 l-52 -8z" fill="${D.armor}"/>
  <path d="M-190 -610 q60 -110 130 -90 l60 46 l60 -46 q70 -20 130 90 l-90 30 l-100 -34 l-100 34z" fill="${D.pelt}"/>
  <path d="M-34 -700 h68 v-46 h-68z" fill="${D.skin}"/>
  <path d="M-58 -842 q0 -62 58 -62 q58 0 58 62 v52 l-30 54 h-56 l-30 -54z" fill="${D.skin}"/>
  <path d="M-66 -818 q-14 -104 66 -106 q84 2 66 110 q-20 -66 -66 -70 q-40 4 -66 66z M62 -850 q60 30 50 150 q-34 -50 -52 -74z" fill="${D.hair}"/>
  <path d="M-36 -810 h26 M12 -810 h26" fill="none"/></g>`; }
function table(x, y, w, c1, c2) { const h = 240; return `<g stroke="${INK}" stroke-width="9" stroke-linejoin="round">
  <path d="M${x} ${y} h${w} l-24 ${h} h${-(w - 48)}z" fill="${c1}"/><path d="M${x - 26} ${y - 30} h${w + 52} v34 h${-(w + 52)}z" fill="${c2}"/>
  <path d="M${x + w * .62} ${y - 30} h34 l-6 -58 h10 l10 -62 h-62 l10 62 h10z" fill="${S.gold}"/><ellipse cx="${x + w * .28}" cy="${y - 34}" rx="70" ry="13" fill="${S.silver}"/></g>`; }
const FG = c => `<path d="M-80 1920 V1560 q40 -150 170 -150 q150 0 170 170 q110 40 150 340z" fill="${c}"/><circle cx="110" cy="1390" r="96" fill="${c}"/><path d="M930 1920 v-300 h-40 l30 -130 h180 l30 130 h-40 v300z" fill="${c}"/>`;

const SET = { // per-mood props for the stand-in scene
  gala:    { cloth: S.bellonaBlue, top: S.silver, cast: 150, bokeh: { count: 18 }, dust: { count: 30, opacity: .45 }, shafts: null },
  space:   { cloth: '#2a3a8a', top: '#9fb0d8', cast: 120, room: { deck: true }, bokeh: { count: 8, colors: ['#58e4ff', '#ff9648'], opacity: .22 }, dust: null },
  mars:    { cloth: '#8a2420', top: '#e0b080', cast: 420, bokeh: null, dust: { count: 50, color: '#ffd08a', opacity: .6, rise: 20 }, shafts: [300, 1110, 28, { count: 5, spread: 44, length: 1300, width: 60, color: '#ffe08a', opacity: .2 }] },
  mine:    { cloth: '#3a1a14', top: '#6a4a3a', cast: 200, bokeh: null, dust: null },
  triumph: { cloth: '#a81f1c', top: S.goldHi, cast: 150, room: { turn: .25 }, turn: .25, bokeh: { count: 16 }, dust: { count: 30 } },
  'triumph-red': { mood: 'triumph', cloth: '#a81f1c', top: S.goldHi, cast: 150, room: { turn: 1 }, turn: 1, bokeh: { count: 10, colors: ['#ff3a2a', '#ff8a3a'] }, dust: { count: 40, color: '#ff5a3a', rise: 30 } },
  void:    { cloth: '#1a1420', top: '#3a3040', cast: 0, bokeh: null, dust: null, noTable: true },
};
function frame(name, t = 1.3) {
  const C = SET[name], mood = C.mood || name, turn = C.turn || 0, P = L.palette(mood, turn), o = { mood, turn };
  const flip = mood === 'mars', fx = name === 'void' ? 540 : flip ? 690 : 400, fy = 1470, tx = flip ? 90 : 620, ty = 1330;
  let s = L.skyOrRoom(mood, t, { floorY: FY, ...(C.room || {}) });
  if (C.shafts) s += L.lightShafts(C.shafts[0], C.shafts[1], C.shafts[2], t, C.shafts[3]);
  if (!C.noTable) s += L.floorShadow(tx + 190, ty + 240, 400, { ...o, cast: C.cast * .5 }) + L.lit(table(tx, ty, 380, C.cloth, C.top), mood, { turn, depth: 90, rim: 8 });
  s += L.floorShadow(fx, fy, 330, { ...o, cast: C.cast }) + L.lit(figure(fx, fy, 900), mood, { turn, depth: 105, rim: 10, key: 6 });
  if (!C.noTable && mood !== 'mars' && mood !== 'space') s += L.candle(tx + 60, ty - 30, 110, t) + L.candle(tx + 330, ty - 30, 80, t + 2);
  s += L.dof('near', FG(P.shadow));
  if (C.bokeh) s += L.bokeh(7, t, C.bokeh);
  if (C.dust) s += L.dust(3, t, C.dust);
  return L.frame(s, mood, { t, turn });
}
(async () => {
  const names = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(SET);
  fs.mkdirSync(__dirname + '/out', { recursive: true });
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.setContent(`<style>html,body{margin:0;width:1080px;height:1920px;overflow:hidden;background:#000}#w{position:absolute;inset:0;overflow:hidden}</style><div id="w"></div>`);
  for (const n of names) {
    await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, frame(n));
    await p.screenshot({ path: `${__dirname}/out/lighting-${n}.png` });
    // timing: 6 consecutive animated frames, set + jpeg screenshot (what the shot renderer does)
    const t0 = Date.now(); const K = 6;
    for (let i = 0; i < K; i++) { const h = frame(n, 2 + i / 30); await p.evaluate(h => { document.getElementById('w').innerHTML = h; }, h); await p.screenshot({ type: 'jpeg', quality: 90 }); }
    console.log(`${n.padEnd(12)} ${((Date.now() - t0) / K).toFixed(0)} ms/frame  (${(frame(n).length / 1024).toFixed(0)} KB markup)`);
  }
  await b.close();
})();
