# Golden Son: palette + lighting rules

Source of truth is `lighting.js` (`MOODS`, `palette(mood, turn)`); the per-mood light colours are mirrored in
`style.js` as `S.moods`. Style frames: `out/lighting-<mood>.png` (rebuild with `node lighting-test.js`).

What was wrong with the rejected shot: navy figure on navy wall on navy table (one hue, one value), no light source,
no shadow shapes, nothing out of focus. The fix is three contrasts in every frame: **warm vs cool**, **light vs dark**,
**sharp vs soft**.

## Palettes

Each mood: `bg` (top to bottom), `key` (warm light, upper-left), `rim` (edge light, from the right), `shadow` (deepest
value: vignette, foreground silhouettes), `shadowMul` (multiplied into cel shadows), `accent` (the one loud colour),
`hot` (light-source core), `haze`, `floor`.

### gala: night ballroom on Luna (the most used set)
| role | hex | used for |
|---|---|---|
| bg | `#0a0530` `#1e1374` `#4a2a9a` | wall, deep indigo at the top (caption zone) to violet at the floor line |
| windows | `#0a1258` `#1a3cae` `#3688e6` `#6fd0f8` | Luna night sky in the arches, brightest at the horizon; towers `#142a86` / `#1a3aa6` |
| key | `#ffbf5e` | candle gold: key edge on forms, window arch trim, floor line, pillar caps |
| light pools | `#f2601c` painted, `#ffae3c` + `#fff3c8` additive | chandelier haze on wall and floor, pillar faces `#ee6a34` |
| rim | `#6fd6ff` | moonlight edge on the right of every form, floor reflections, pillar slivers |
| shadowMul | `#5a46b4` | cel shadows are violet, never grey |
| shadow | `#0d0630` | vignette, foreground silhouettes, ink in the far set |
| accent | `#e0304e` | banners (lit side `#ff6f5e`, shade `#8a1230`); keep it off the walls |
| floor | `#3a2590` to `#150b48`, joints `#8a66f0` | polished floor |
| crowd | `#4733a6` `#5a40b6` `#3b2994` | far guests: lighter and bluer than the foreground, warm on their left |

### space: fleet battle
| role | hex | used for |
|---|---|---|
| bg | `#04051a` `#0c1650` `#14407a` | space, top to bottom |
| nebula | `#ff4f8a` `#2fd0ff` `#6a3aff` `#ffa040` | large painted glows |
| key | `#ff9648` | explosions / sunlit hull sides, key edge |
| rim | `#58e4ff` | engine glow, bridge floor line, rim edge |
| shadowMul / shadow | `#3a3fa0` / `#03041a` | cel shadows / struts, vignette |
| accent | `#ff3d74` | enemy fire (friendly fire is the rim cyan) |
| planet | `#ff9a4a` to `#6a1626` | Mars limb, lit from the upper-left |

### mars: rust red dusk
| role | hex | used for |
|---|---|---|
| bg | `#4a1470` `#d0302a` `#ff8a2a` `#ffd76a` | sky: plum zenith to yellow horizon |
| sun | `#fff8de` core, `#ffe9a0` disc, `#ffd060` glow | low on the left (key side) |
| key | `#ffb45a` | sunlit edges, mesa tops `#ffb060` / `#ff8a3a` |
| rim | `#9ab8ff` | cool sky bounce on the right of forms |
| shadowMul / shadow | `#8a3a78` / `#22081f` | plum shadows / foreground |
| mesas | far `#e0562c`, mid `#7a1f2c`, clouds `#8a2a90` to `#ff5a4a` | lighter + oranger with distance |
| floor | `#b83c24` to `#3a0f2a` | ground |
| accent | `#ffe28a` | sun flare, gold details |

### mine: dark ember
| role | hex | used for |
|---|---|---|
| bg | `#070308` `#210a10` `#5a160c` | rock |
| key | `#ff7a2a` | lamp (upper-left), lit edges of timber and rails |
| tunnel mouth | `#ffd27a` core, `#ffb040`, `#ff4a1a` | the only bright area; rock rings `#6a1c10` `#3a0f12` `#1a070c` far to near |
| rim | `#3fd0c4` | cold teal edge (the one cool note) |
| shadowMul / shadow | `#5a2a50` / `#050206` | |
| accent | `#ffcf5a` | sparks, embers |

### triumph: gold feast (turn = 0) turning sinister (turn = 1)
| role | gold feast | blood red | used for |
|---|---|---|---|
| bg | `#40140a` `#b0560f` `#f6b63c` | `#0e0206` `#470810` `#b0141c` | hall |
| key | `#ffdc80` | `#ff5a36` | key edge, trims |
| rim | `#8fd4ff` | `#ff2438` | rim turns red: the cool relief disappears |
| shadowMul | `#a0503c` | `#7a1830` | cel shadows |
| shadow | `#2a0a08` | `#0a0204` | vignette, silhouettes |
| accent | `#d21f2a` | `#ffd77a` | drapes at the feast; the last gold once it turns |
| sun-disc | `#fff3c0` | `#e01a1a` | glory behind the high table |

### void: the ending
| role | hex | used for |
|---|---|---|
| bg | `#020206` `#07060e` `#100a16` | near-black, slightly violet |
| key | `#c4d0e8` | one cold shaft from the upper-left |
| rim / accent | `#c0141f` | crimson edge on the right, horizon line: the only colour |
| shadowMul / shadow | `#2a2440` / `#010103` | |

## Lighting rules for shot builders

1. **One light logic for the whole film.** Warm KEY from the upper-left, cool RIM from the right, in every shot, on every
   form. Put the practical that motivates the key (chandelier, sun, lamp) on the left of frame; windows/moon on the right.
2. **Never colour a subject like its background.** Background walls sit in the mood's `bg` hues at low-mid value; the
   subject must differ in value and temperature (crimson, gold, pale skin against violet/blue). No navy on navy.
3. **Shadows are coloured and hard.** One hard-edged shadow shape per form, filled with the mood's `shadowMul` in
   multiply at ~85%. Never black, never a soft gradient, never `#000` at an opacity. Use `lit()` on props and sets;
   characters that draw their own shadow shapes use `S.moods[mood].shadowMul` and get `rimLight()`.
4. **Every form gets a rim.** A thin `rim`-coloured edge on the right (8-10 px at full-figure scale) is what separates
   dark costumes from dark sets. Darrow's black cloak must always carry it.
5. **Light is painted first, then glows.** Lay a saturated alpha pool (`glow(..., {blend:false})`, colour `S.ember`) where
   light lands on walls/floors, then add a small additive `glow()` core at the source. Additive light alone goes pink
   and muddy on violet.
6. **Three depths, three sharpnesses.** Far set and far cast: lighter, bluer, blurred (`dof('far')`; rooms already blur
   their far layers). Subject plane: sharp, full ink line. Foreground: a few `shadow`-coloured silhouettes cutting the
   frame edges, wrapped in `dof('near')`. Add `bokeh()` / `dust()` between planes.
7. **Ground everything.** Each character and prop gets `floorShadow()` (with `cast` > 0 when the key is low, e.g. Mars).
8. **One grade.** Finish every frame with `grade(mood)` (or build the frame with `frame()`), nothing else on top except
   captions. Keep the top ~450 px of sets dark and simple: captions live there.

## Cost rules (frames are screenshotted one by one)

- Every `mix-blend-mode` element and every filter costs a pass proportional to its area. Batch big additive lights in
  one `screen(...)` group with `{blend:false}` children; `bokeh` and `dust` default to plain alpha.
- Do not blur full-frame groups more than once per frame; never use `backdrop-filter` or an SVG colour filter for
  grading (100-200 ms). The contrast/saturation lift is a CSS filter on `.gsl-frame` (~5 ms).
- No `feTurbulence`: grain is a 128 px PNG tile inside the grade.
