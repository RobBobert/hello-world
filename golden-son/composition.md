# Golden Son — composition & camera

Frame 1080x1920, 30 fps. Target look: `ref/style-ref-swing.jpg`, `ref/style-ref-shots.jpg`.

## Safe areas (hard)

| zone | px | rule |
|---|---|---|
| caption band | y 270–560, x 150–930 | 2 lines max, 88 px Anton, each line <= ~19 characters. No face in the band while a caption is up. |
| face zone | y 625–1500 | hairline at y >= 625, chin above 1500 |
| player UI | y > 1540 | dressing only (cloth, blurred foreground, floor). Nothing the viewer must read. |

## Shot 01 — "The Bellona table" (`shots/bellona.js`, 9.6 s) — round 2, calm camera

World: standing adult = 1000 units, table top y = 0, Darrow at x = 0, Cassius seated at x = 520.
Stills: `out/comp-01..12.png`, `out/comp-fury.png`. Motion: `out/bellona-preview.mp4`.

Camera for this shot: no roll, no whip, no zoom punch, no flash, no 3D transforms. Table and windows stay level.
Three set-ups: a locked frame, one crane, one cut.

| # | time (s) | beat | framing / camera | caption (band 270–560) |
|---|---|---|---|---|
| 1a | 0.00–0.60 | Table, then boots drop in | Locked off at table height, zoom 2.5. Table lip level at y~1500, cloth + eagle below, guests soft behind. Goblet right of centre. Boots enter over the last 0.3 s. | `HE STOOD ON` on blurred wall / guests |
| 1b | 0.60–1.60 | Landing | Boots + greaves left of centre, y~650–1480; goblet, plate and wine on the right third. One shake: 12 px, 0.3 s. Soft ring on the cloth, plate shards, goblet tips, wine runs over the lip. Zoom breathes 2.50 -> 2.58. | + `THEIR TABLE.` (red) at 0.6, sits on background between and above the legs |
| 2a | 1.60–4.00 | Crane up the body | One eased vertical crane, 2.4 s, drifting 78 units left to centre him; zoom 2.58 -> 3.5. Head turn -8 deg -> about +3. No caption while the body passes the band. | none |
| 2b | 4.00–5.60 | The smile | Settle: hairline at y 625, chin ~1130, lion pauldrons to the frame edges. Push 3.5 -> 3.7 (5%). Blink at 4.0–4.1, `brood` -> `smile` blended over 4.15–4.85. Head turn continues to +9 deg. | `DARROW.` at 4.05, `SMILING.` (red) at 4.6 |
| 3 | 5.60 | CUT | Clean cut to Cassius (same eye height, same hairline position, so the cut reads as a look between the two). | none for 0.25 s |
| 3a | 5.85–7.30 | Cassius, calm | Bust, hairline at 625, zoom 3.0. Head drifts from -15 deg; eyes held on Darrow (up-left). Background drifts ~12 px against the turn. | `CASSIUS AU BELLONA.` on window / wall |
| 3b | 7.30–9.60 | Fury | Blink at 7.05–7.18, `neutral` -> `angry` blended over 7.3–8.3. Head reaches +15 deg, zoom reaches 3.2 (+6.7% over the whole beat), camera drifts 28 units right. Nothing else moves. | + `JULIAN'S BROTHER.` (red) at 7.8 |

Depth stack (back to front): far wall (blur 5–6, parallax .35) · guest silhouettes (blur 2.5–3, .70) · actors + table (sharp, 1.0) · foreground shapes at the frame edges (blur 15, 1.6) · bokeh/dust/grade · caption plate + caption.
Depth now comes only from parallax during the crane and from focus.

## Composition rules for the rest of the film

1. **Fill the frame.** Close-up: head + shoulders 60–70% of height. Medium: figure 75%+, cut at knee or waist, never floating whole in the middle. A full figure is allowed only as a deliberate scale shot (rule 8).
2. **Hairline at 625, eyes at 850–1000.** With a caption up, pin the top of the hair just under the band and let shoulders run out of the bottom. Without a caption the face may rise into the band (as in the rise, 1.5–2.75 s).
3. **Three depths minimum, always.** One blurred dark foreground shape touching a frame edge, the sharp subject, a blurred background. Foreground lives in the corners and below y 1450; it never crosses a face.
4. **Level camera, diagonal subjects.** The camera never rolls. Get diagonals from what is in frame: a blade, a hull, a banner, a light shaft, a look between two faces.
5. **Low angle for power, high angle for loss — by placement, not by 3D.** Power: camera at knee or table height, subject running out of the top of frame, others low in frame. Loss: subject low and small under empty space. No perspective transforms on layers or figures.
6. **Calm camera: one slow move per set-up, then a cut.** Locked frame, slow push (<= 8% zoom over a beat), or one eased crane/dolly of 2 s or more. No whips, no orbits, no zoom punches. Change subject with a clean cut. Head turns stay within about 30 deg per beat.
7. **Look-room and screen direction.** A face looking left sits right of centre and vice versa. Darrow faces/moves right through the film; whoever opposes him faces left. Break it only at the betrayal.
8. **Scale by contrast.** For fleets, armies, crowds: put something huge and close at one edge (a hull, a helmet, a banner) and the tiny thing it threatens deep in frame. Never a row of equal-size objects.
9. **Caption on quiet ground.** The band must sit on blurred background, sky, or a dark cloak. Red second line by default; gold only when the band lies on red (Mars, Augustus banners). A soft dark plate sits behind every caption. Two lines, <= 19 characters each; one caption per held frame.
10. **Let the picture carry the hit.** Impacts get one small shake (<= 12 px, under 0.3 s) and things in the frame reacting: plates, wine, cloaks, crowds, lagging the hit by 2–4 frames. No flash, no zoom punch.

## Shot list (framing only)

**Academy fleet defeat**
1. Extreme low angle: Karnus's flagship prow enters from top-right and fills 60% of frame, hull as a diagonal; Darrow's ships tiny, bottom-left, burning. Caption on black space.
2. Bridge close-up of Darrow, lit red from below-right, cracked viewport behind; slow push-in; debris drifts across the foreground out of focus.
3. Over-the-shoulder (Darrow's pauldron large, left foreground) onto the viewport: his last ship breaking in two.

**Augustus selling the contract**
1. Low angle up the dais steps: Augustus seated, lion banner behind, filling the top two thirds; Darrow's back small in the bottom corner, cut at the shoulders.
2. Insert: Augustus's ringed hand slides the contract across the desk toward camera; hand and paper fill the frame, his face a blur behind.
3. Close-up Darrow from slightly above (high angle = loss), eyes at y 950, empty corridor receding behind him on a diagonal.

**The bomb offer**
1. Tight two-shot in the dark: Harmony's scarred profile large at left edge (foreground, half lit), Darrow's face deep right, mine-orange rim.
2. Insert, low: the bomb in an open palm filling the frame, fingers as a cage, Darrow's eyes out of focus above it.
3. Push-in on Darrow closing his hand / turning away; the gala's windows as bokeh behind.

**The duel + Cassius loses his arm**
1. Wide but layered: the two blades cross in the foreground corner to corner (out of focus), duelists framed in the triangle between them, crowd ring behind.
2. Locked close on Darrow mid-swing, razor arc crossing the whole frame as one white diagonal.
3. Close on Cassius: shock expression, locked frame; the arm leaves frame bottom-left as a silhouette. Do not show the wound: cut to
4. Low angle: the Sovereign rising from her throne, tiny against the windows and Earth, hand raised; Darrow's shoulder large in foreground.

**The Iron Rain**
1. Looking straight up: hundreds of drop-pods as streaks converging to a vanishing point above; one pod huge at the frame edge passing camera.
2. Inside-helmet close-up of Darrow, visor reflections scrolling, shake; eyes at y 950.
3. Looking down past his boots (big, top of frame) at the Martian city and flak blooms below; fall continues toward camera.
4. Ground, low angle: Darrow lands in dust, silhouette against the orange sky, pods still raining behind on diagonals.

**Fitchner revealed as Ares**
1. The spiked Ares helmet fills the frame, front-lit red, absolutely symmetrical (the one symmetrical frame so far).
2. Hands lift it: slow push as it comes off; Fitchner's face revealed in three-quarter, crooked grin, helmet stays in the lower foreground.
3. Reverse close-up on Darrow, small flashback inset of the Proctor in the helmet's polished surface.

**Mustang shown the truth**
1. Over Mustang's shoulder (hair large, right foreground, blurred) onto the holo: the carving footage as a cold cyan rectangle on Darrow's side of frame.
2. Close-up Mustang lit by the holo, flicker on her face, slow push; Darrow out of focus deep behind her, on his knees (high angle on him).
3. Wide on the doorway: she walks out toward the light, small; Darrow's silhouette large in the foreground, back to camera, cut at the shoulders. Hold with no answer.

**The Triumph betrayal**
1. Low angle, gold and confetti: Darrow on the triumphal dais, arms of the crowd as foreground shapes, banners as diagonals.
2. Insert: Roque's hands present the box toward camera; box fills the lower half, Roque's face soft above it.
3. Darrow's face from inside the box (camera looks up through the opening, lid edge as a dark frame): smile dies. Never show the contents; a red glow on his face is enough.
4. Close two-shot: Roque's profile at Darrow's ear, needle glint at the neck, focus racks to Roque's eyes. Palette turns (`triumph` -> `sinister`).
5. Darrow's POV, sinking slowly and going soft: the Jackal's small silhouette over Augustus's fallen body, lion banner burning behind.
6. Top-down: Darrow on the floor, tiny, dragged out of a pool of light; boots of his captors large at the frame corners.

**Final card**
- Black. A single razor lies on a diagonal across the lower third, one red rim light. Title text sits in the caption band; nothing else in frame. Slow 3% push-in for the whole hold.
