// Golden Son art direction: shared tokens. Every model/set/shot imports these so the film reads as one piece.
// Look: graphic-novel cel shading (see ref/style-ref-*.jpg): flat fills, bold ink line of varying weight, ONE hard-edged
// shadow shape per form, angular faces, stylised but adult proportions (about 5 heads tall). No chibi, no bell bodies.
// Light: warm KEY from upper-left, cool RIM from the right, ink shadows. Night interiors, candle gold practicals.
module.exports = {
  INK: '#120d0f',
  // world
  night: '#0b1022', navy: '#141c3a', navyLight: '#22305e', candle: '#f2b950', candleHot: '#ffe3a1',
  key: '#ffd9a0',          // warm key-light tint
  rim: '#7fb0ff',          // cool rim-light colour (thin edge on the right side of forms)
  shadowMul: '#1a1238',    // colour used for hard cel shadows at ~45% opacity (multiply feel)
  // houses
  bellonaBlue: '#2b4a8a', bellonaDeep: '#162a54', silver: '#d8e0ea', silverShade: '#8d9bb0',
  augustusRed: '#a81f1c', augustusDeep: '#5e1012', gold: '#e2a93b', goldHi: '#f6dc8b', goldShade: '#8e6420',
  // Darrow: pale skin, long swept-back blond hair, wolf pelt, crimson armour
  darrow: { skin: '#e9c3a0', skinShade: '#b07a5e', hair: '#d9a441', hairHi: '#f6dc8b', hairShade: '#8e6420', eye: '#e0a326',
            armor: '#a81f1c', armorHi: '#d8453a', armorShade: '#5e1012', pelt: '#d9dde6', peltShade: '#7f8798', cloak: '#17121a' },
  // Cassius: tan skin, big golden curls, gold armour over Bellona blue
  cassius: { skin: '#d9a777', skinShade: '#a86f48', hair: '#d6a23c', hairHi: '#f8e09a', hairShade: '#8a5f1e', eye: '#e8b53a',
             armor: '#e2a93b', armorHi: '#fbe6a6', armorShade: '#9a6a1c', cloth: '#2b4a8a', clothShade: '#162a54' },
  // captions (unchanged house style)
  capCream: '#f6ead2', capRed: '#e8372c', capGold: '#f0b63c',
};
