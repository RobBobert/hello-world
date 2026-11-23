// "Realistic stick figure" prototype: heroic ~8-head proportions, tapered limbs, simple flat armour shapes,
// minimal or no face. hero(x, y, h, kit, opts) draws a standing or seated figure; (x, y) = between the feet.
const INK = '#120d0f';
const f = v => v.toFixed(1);
const cl = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// tapered segment a->b with widths wa, wb (round joints)
function limb(a, b, wa, wb, fill, stroke = INK, sw = 3) {
  const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const p = [[a[0] + nx * wa / 2, a[1] + ny * wa / 2], [b[0] + nx * wb / 2, b[1] + ny * wb / 2], [b[0] - nx * wb / 2, b[1] - ny * wb / 2], [a[0] - nx * wa / 2, a[1] - ny * wa / 2]];
  return `<path d="M${p.map(q => q.map(f).join(' ')).join(' L')} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`
    + `<circle cx="${f(a[0])}" cy="${f(a[1])}" r="${f(wa / 2)}" fill="${fill}"/><circle cx="${f(b[0])}" cy="${f(b[1])}" r="${f(wb / 2)}" fill="${fill}"/>`;
}
const poly = (pts, fill, sw = 3, extra = '') => `<path d="M${pts.map(q => q.map(f).join(' ')).join(' L')} Z" fill="${fill}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" ${extra}/>`;

function lionFace(x, y, r, col, hi, dk) {
  let mane = ''; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 - Math.PI / 2; mane += `<circle cx="${f(x + Math.cos(a) * r * .75)}" cy="${f(y + Math.sin(a) * r * .8)}" r="${f(r * .38)}" fill="${col}" stroke="${INK}" stroke-width="${f(r * .07)}"/>`; }
  return `${mane}<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .78)}" fill="${col}"/><path d="M${f(x - r * .5)} ${f(y - r * .3)} Q${f(x)} ${f(y - r * .6)} ${f(x + r * .5)} ${f(y - r * .3)} Q${f(x + r * .55)} ${f(y + r * .35)} ${f(x)} ${f(y + r * .65)} Q${f(x - r * .55)} ${f(y + r * .35)} ${f(x - r * .5)} ${f(y - r * .3)}Z" fill="${hi}" stroke="${INK}" stroke-width="${f(r * .07)}"/>
    <path d="M${f(x - r * .38)} ${f(y - r * .1)} l${f(r * .24)} ${f(r * .08)} M${f(x + r * .38)} ${f(y - r * .1)} l${f(-r * .24)} ${f(r * .08)}" stroke="${INK}" stroke-width="${f(r * .09)}" stroke-linecap="round"/><path d="M${f(x - r * .13)} ${f(y + r * .14)} h${f(r * .26)} l${f(-r * .13)} ${f(r * .15)}Z" fill="${dk}"/>`;
}
function sun(x, y, r, col, core) {
  let s = ''; for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, L = i % 2 ? .95 : 1.4, w = .13; s += `<path d="M${f(x + Math.cos(a - w) * r * .55)} ${f(y + Math.sin(a - w) * r * .55)} L${f(x + Math.cos(a) * r * L)} ${f(y + Math.sin(a) * r * L)} L${f(x + Math.cos(a + w) * r * .55)} ${f(y + Math.sin(a + w) * r * .55)}Z" fill="${col}" stroke="${INK}" stroke-width="${f(r * .06)}"/>`; }
  return s + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * .58)}" fill="${core}" stroke="${INK}" stroke-width="${f(r * .08)}"/>`;
}

// joints in units of h (y negative = up)
const STAND = { head: [0, -.965], neck: [0, -.862], sL: [-.128, -.83], sR: [.128, -.83], eL: [-.16, -.66], eR: [.16, -.66], wL: [-.165, -.5], wR: [.165, -.5],
  hL: [-.085, -.52], hR: [.085, -.52], kL: [-.075, -.275], kR: [.075, -.275], aL: [-.072, -.045], aR: [.072, -.045] };

function hero(x, y, h, kit, o = {}) {
  const yaw = o.yaw || 0, seated = o.pose === 'seated', sw = Math.max(2, h * .0055);
  const Jp = { ...STAND };
  const arms = o.arms || kit.arms || ['hang', 'hang'];
  const setArm = (side, pose) => { const S = side < 0 ? 'L' : 'R', d = side;
    if (pose === 'blade') { Jp['e' + S] = [d * .17, -.66]; Jp['w' + S] = [d * .19, -.5]; }
    if (pose === 'hip') { Jp['e' + S] = [d * .22, -.68]; Jp['w' + S] = [d * .11, -.56]; }
    if (pose === 'table') { Jp['e' + S] = [d * .2, -.63]; Jp['w' + S] = [d * .07, -.545]; }
    if (pose === 'cross') { Jp['e' + S] = [d * .15, -.68]; Jp['w' + S] = [-d * .07, -.7]; }
    if (pose === 'raise') { Jp['e' + S] = [d * .2, -.97]; Jp['w' + S] = [d * .17, -1.1]; } };
  setArm(-1, arms[0]); setArm(1, arms[1]);
  if (o.stance === 'wide') { Jp.kL = [-.1, -.275]; Jp.kR = [.1, -.275]; Jp.aL = [-.13, -.045]; Jp.aR = [.13, -.045]; }
  const J = {}; for (const k in Jp) J[k] = [x + Jp[k][0] * h + (k === 'head' || k === 'neck' ? yaw * h * .0006 : 0), y + Jp[k][1] * h];
  const C = kit.col, W = v => v * h;
  let g = '';
  // cape behind
  if (kit.cape) { const flut = Math.sin((o.wind || 0) * 1.8) * W(.02); g += `<path d="M${f(J.sL[0])} ${f(J.sL[1])} L${f(J.sR[0])} ${f(J.sR[1])} Q${f(x + W(.24) + flut)} ${f(y - W(.4))} ${f(x + W(.28) + flut * 2)} ${f(y - W(seated ? .48 : .02))} L${f(x - W(.26) + flut)} ${f(y - W(seated ? .48 : .0))} Q${f(x - W(.22))} ${f(y - W(.4))} ${f(J.sL[0])} ${f(J.sL[1])} Z" fill="${kit.cape}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`; }
  // long sash tail behind the legs
  if (kit.sash) g += `<path d="M${f(x + W(.05))} ${f(y - W(.58))} L${f(x + W(.11))} ${f(y - W(.58))} L${f(x + W(.13) + Math.sin((o.wind || 0) * 2) * W(.01))} ${f(y - W(seated ? .5 : .06))} L${f(x + W(.07))} ${f(y - W(seated ? .5 : .06))} Z" fill="${kit.sash}" stroke="${INK}" stroke-width="${sw}"/>`;
  // back arm (viewer-left for positive yaw)
  const arm = side => { const S = side < 0 ? 'L' : 'R'; let a = limb(J['s' + S], J['e' + S], W(.05), W(.042), C.suit, INK, sw) + limb(J['e' + S], J['w' + S], W(.044), W(.036), C.suit, INK, sw)
      + limb([J['e' + S][0] + (J['w' + S][0] - J['e' + S][0]) * .25, J['e' + S][1] + (J['w' + S][1] - J['e' + S][1]) * .25], J['w' + S], W(.054), W(.044), C.plate, INK, sw)
      + `<ellipse cx="${f(J['w' + S][0])}" cy="${f(J['w' + S][1] + W(.03))}" rx="${f(W(.022))}" ry="${f(W(.03))}" fill="${C.hand}" stroke="${INK}" stroke-width="${sw}"/>`;
    if ((side < 0 ? arms[0] : arms[1]) === 'blade') { const [hx, hy] = [J['w' + S][0], J['w' + S][1] + W(.03)]; a = `<path d="M${f(hx)} ${f(hy)} q${f(side * W(.07))} ${f(W(.08))} ${f(side * W(.05))} ${f(W(.33))} q${f(-side * W(.05))} ${f(-W(.15))} ${f(-side * W(.03))} ${f(-W(.33))}Z" fill="#e6ebf1" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>` + a; }
    return a; };
  g += arm(-1);
  if (!seated) {
    // legs: undersuit thighs, armoured greaves, boots
    for (const S of ['L', 'R']) {
      g += limb(J['h' + S], J['k' + S], W(.075), W(.055), C.suit, INK, sw);
      g += limb(J['k' + S], J['a' + S], W(.062), W(.05), C.greave, INK, sw);
      g += `<ellipse cx="${f(J['k' + S][0])}" cy="${f(J['k' + S][1])}" rx="${f(W(.04))}" ry="${f(W(.032))}" fill="${C.plate}" stroke="${INK}" stroke-width="${sw}"/>`;
      const d = S === 'L' ? -1 : 1, ax = J['a' + S][0]; g += poly([[ax - W(.032), J['a' + S][1] - W(.03)], [ax + W(.032), J['a' + S][1] - W(.03)], [ax + (d > 0 ? W(.075) : W(.036)), y - W(.004)], [ax + (d > 0 ? -W(.036) : -W(.075)), y - W(.004)]], C.boot, sw) + `<rect x="${f(ax - W(.034))}" y="${f(J['a' + S][1] - W(.034))}" width="${f(W(.068))}" height="${f(W(.012))}" fill="${C.plateHi}" stroke="${INK}" stroke-width="${f(sw * .7)}"/>`;
    }
    // tassets
    g += poly([[x - W(.105), y - W(.6)], [x + W(.105), y - W(.6)], [x + W(.12), y - W(.46)], [x + W(.04), y - W(.48)], [x, y - W(.45)], [x - W(.04), y - W(.48)], [x - W(.12), y - W(.46)]], C.plate, sw);
  }
  // torso undersuit + cuirass (V shape)
  g += poly([[J.sL[0] - W(.01), J.sL[1]], [J.sR[0] + W(.01), J.sR[1]], [x + W(.085), y - W(.58)], [x - W(.085), y - W(.58)]], C.suit, sw);
  g += poly([[J.sL[0] + W(.015), J.sL[1] + W(.012)], [x, J.sL[1] + W(.03)], [J.sR[0] - W(.015), J.sR[1] + W(.012)], [x + W(.095), y - W(.7)], [x + W(.082), y - W(.6)], [x - W(.082), y - W(.6)], [x - W(.095), y - W(.7)]], C.plate, sw);
  g += `<path d="M${f(x)} ${f(J.sL[1] + W(.05))} V${f(y - W(.61))} M${f(x - W(.07))} ${f(y - W(.66))} Q${f(x - W(.035))} ${f(y - W(.675))} ${f(x)} ${f(y - W(.66))} Q${f(x + W(.035))} ${f(y - W(.675))} ${f(x + W(.07))} ${f(y - W(.66))}" stroke="${C.plateDk}" stroke-width="${f(sw * .8)}" fill="none"/>`;
  g += `<path d="M${f(x + W(.01))} ${f(J.sL[1] + W(.04))} L${f(J.sR[0] - W(.02))} ${f(J.sR[1] + W(.02))} L${f(x + W(.09))} ${f(y - W(.7))} L${f(x + W(.078))} ${f(y - W(.61))} L${f(x + W(.01))} ${f(y - W(.61))} Z" fill="${C.plateDk}" opacity=".35"/>`;
  if (kit.emblem === 'lion') g += lionFace(x, y - W(.745), W(.042), C.plateDk, C.plateHi, '#3a2508');
  if (kit.emblem === 'sun') g += sun(x, y - W(.745), W(.036), C.plateHi, '#f6c24a');
  // sash at waist
  if (kit.sash) g += poly([[x - W(.09), y - W(.615)], [x + W(.09), y - W(.615)], [x + W(.095), y - W(.585)], [x - W(.095), y - W(.585)]], kit.sash, sw);
  // pauldrons
  for (const S of ['L', 'R']) { const d = S === 'L' ? -1 : 1, [px, py] = J['s' + S];
    g += `<path d="M${f(px - d * W(.05))} ${f(py - W(.005))} Q${f(px + d * W(.01))} ${f(py - W(.05))} ${f(px + d * W(.06))} ${f(py + W(.01))} Q${f(px + d * W(.05))} ${f(py + W(.05))} ${f(px - d * W(.01))} ${f(py + W(.045))} Z" fill="${C.plate}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
    if (kit.emblem === 'lion') g += lionFace(px + d * W(.008), py + W(.01), W(.02), C.plateDk, C.plateHi, '#3a2508'); }
  // neck + head
  g += limb([J.neck[0], J.neck[1] + W(.01)], [J.head[0], J.head[1]], W(.05), W(.05), C.skin, INK, sw) + `<path d="M${f(J.neck[0] - W(.04))} ${f(J.neck[1] + W(.012))} L${f(J.neck[0] - W(.034))} ${f(J.neck[1] - W(.014))} Q${f(J.neck[0])} ${f(J.neck[1] - W(.004))} ${f(J.neck[0] + W(.034))} ${f(J.neck[1] - W(.014))} L${f(J.neck[0] + W(.04))} ${f(J.neck[1] + W(.012))} Z" fill="${C.suit}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  const [hx, hy] = J.head, rx = W(.07), ry = W(.086);
  if (kit.hairBack) g += kit.hairBack(hx, hy, rx, ry, yaw, sw, o);
  g += `<path d="M${f(hx - rx)} ${f(hy - ry * .1)} Q${f(hx - rx)} ${f(hy - ry)} ${f(hx)} ${f(hy - ry)} Q${f(hx + rx)} ${f(hy - ry)} ${f(hx + rx)} ${f(hy - ry * .1)} Q${f(hx + rx * .92)} ${f(hy + ry * .6)} ${f(hx + rx * .3)} ${f(hy + ry * .98)} L${f(hx - rx * .3)} ${f(hy + ry * .98)} Q${f(hx - rx * .92)} ${f(hy + ry * .6)} ${f(hx - rx)} ${f(hy - ry * .1)} Z" fill="${C.skin}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;
  // shadow side of the face (moves with yaw)
  const sd = yaw >= 0 ? -1 : 1; g += `<path d="M${f(hx + sd * rx * (0.35 - Math.abs(yaw) / 120))} ${f(hy - ry * .7)} Q${f(hx + sd * rx * .2)} ${f(hy + ry * .2)} ${f(hx + sd * rx * .2)} ${f(hy + ry * .95)} L${f(hx + sd * rx * .32)} ${f(hy + ry * .97)} Q${f(hx + sd * rx * .95)} ${f(hy + ry * .55)} ${f(hx + sd * rx)} ${f(hy - ry * .1)} Q${f(hx + sd * rx)} ${f(hy - ry * .7)} ${f(hx + sd * rx * .35)} ${f(hy - ry * .7)}Z" fill="${C.skinDk}" opacity=".75"/>`;
  if ((o.face || 'simple') !== 'none') { const fx = hx + yaw / 30 * rx * .35, ey = hy + ry * .05;
    const ang = o.expr === 'angry' ? .32 : o.expr === 'sad' ? -.25 : .12;
    for (const d of [-1, 1]) g += `<path d="M${f(fx + d * rx * .62)} ${f(ey - ry * .14 - d * 0)} L${f(fx + d * rx * .18)} ${f(ey - ry * .14 + ry * ang)}" stroke="${INK}" stroke-width="${f(sw * 1.3)}" stroke-linecap="round"/><ellipse cx="${f(fx + d * rx * .38)}" cy="${f(ey + ry * .06)}" rx="${f(rx * .11)}" ry="${f(ry * .07)}" fill="${INK}"/>`;
    g += `<path d="M${f(fx + rx * .02)} ${f(ey + ry * .1)} L${f(fx + rx * .12)} ${f(ey + ry * .38)} L${f(fx - rx * .04)} ${f(ey + ry * .4)}" stroke="${INK}" stroke-width="${f(sw * .8)}" fill="none" stroke-linejoin="round"/>`;
    const m = o.expr === 'smile' ? `M${f(fx - rx * .22)} ${f(ey + ry * .6)} Q${f(fx + rx * .02)} ${f(ey + ry * .7)} ${f(fx + rx * .26)} ${f(ey + ry * .54)}` : o.expr === 'angry' ? `M${f(fx - rx * .22)} ${f(ey + ry * .66)} Q${f(fx)} ${f(ey + ry * .56)} ${f(fx + rx * .22)} ${f(ey + ry * .66)}` : `M${f(fx - rx * .18)} ${f(ey + ry * .62)} L${f(fx + rx * .18)} ${f(ey + ry * .62)}`;
    g += `<path d="${m}" stroke="${INK}" stroke-width="${f(sw * 1.05)}" fill="none" stroke-linecap="round"/>`; }
  if (kit.hairFront) g += kit.hairFront(hx, hy, rx, ry, yaw, sw, o);
  // front arm
  g += arm(1);
  if (seated) g = `<clipPath id="seat${f(x)}"><rect x="${f(x - h)}" y="${f(y - 2 * h)}" width="${f(2 * h)}" height="${f(2 * h - W(.52))}"/></clipPath><g clip-path="url(#seat${f(x)})">${g}</g>`;
  return `<g>${g}</g>`;
}

// ---- hair ----
const shortSwept = col => ({
  hairFront: (x, y, rx, ry, yaw, sw) => { const b = -yaw / 30 * rx * .25;
    return `<path d="M${f(x - rx * 1.04)} ${f(y - ry * .02)} Q${f(x - rx * 1.12)} ${f(y - ry * 1.15)} ${f(x + b)} ${f(y - ry * 1.32)} Q${f(x + rx * 1.18)} ${f(y - ry * 1.2)} ${f(x + rx * 1.04)} ${f(y - ry * .02)} Q${f(x + rx * .9)} ${f(y - ry * .5)} ${f(x + rx * .55)} ${f(y - ry * .62)} Q${f(x + rx * .1)} ${f(y - ry * .5)} ${f(x - rx * .3)} ${f(y - ry * .66)} Q${f(x - rx * .8)} ${f(y - ry * .55)} ${f(x - rx * 1.04)} ${f(y - ry * .02)} Z" fill="${col[0]}" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>
      <path d="M${f(x - rx * .55)} ${f(y - ry * .72)} Q${f(x - rx * .1)} ${f(y - ry * 1.2)} ${f(x + rx * .55 + b)} ${f(y - ry * 1.15)} M${f(x - rx * .1)} ${f(y - ry * .62)} Q${f(x + rx * .3)} ${f(y - ry * 1.05)} ${f(x + rx * .85 + b)} ${f(y - ry * .95)}" stroke="${col[1]}" stroke-width="${f(sw * 1.1)}" fill="none" stroke-linecap="round"/>`; } });
const curls = col => ({
  hairFront: (x, y, rx, ry, yaw, sw) => { let s = ''; const pts = [];
    for (let i = 0; i < 9; i++) { const a = Math.PI * (1.02 + i / 8 * .96); pts.push([x + Math.cos(a) * rx * 1.08, y + Math.sin(a) * ry * 1.02 - ry * .1, rx * .46]); }
    pts.push([x - rx * .4, y - ry * 1.05, rx * .44], [x + rx * .35, y - ry * 1.08, rx * .44], [x, y - ry * 1.25, rx * .42], [x - rx * 1.05, y + ry * .15, rx * .38], [x + rx * 1.05, y + ry * .15, rx * .38]);
    for (const [cx, cy, r] of pts) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${col[0]}" stroke="${INK}" stroke-width="${sw}"/>`;
    for (const [cx, cy, r] of pts.slice(0, 12)) s += `<path d="M${f(cx - r * .4)} ${f(cy)} a${f(r * .4)} ${f(r * .4)} 0 1 1 ${f(r * .55)} ${f(r * .3)}" stroke="${col[1]}" stroke-width="${f(sw * .8)}" fill="none"/>`;
    return s; } });

const DARROW = { emblem: 'lion', sash: '#a81c1a', arms: ['hang', 'blade'],
  col: { suit: '#141218', plate: '#b8862a', plateHi: '#e6bb5c', plateDk: '#6e4a14', greave: '#9a6f22', boot: '#141218', hand: '#e9c3a0', skin: '#e9c3a0', skinDk: '#b98a6a' }, ...shortSwept(['#d9a441', '#fff0b0']) };
const CASSIUS = { emblem: 'sun', cape: '#f2efe8', arms: ['hang', 'hang'],
  col: { suit: '#22407a', plate: '#f0c04a', plateHi: '#fff1c2', plateDk: '#a87818', greave: '#f0c04a', boot: '#1b2f5c', hand: '#d9a777', skin: '#d9a777', skinDk: '#a8724c' }, ...curls(['#d6a23c', '#f8e09a']) };
module.exports = { hero, limb, DARROW, CASSIUS, darrow: (x, y, h, o) => hero(x, y, h, DARROW, o), cassius: (x, y, h, o) => hero(x, y, h, CASSIUS, o) };
