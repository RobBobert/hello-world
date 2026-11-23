# Golden Son — composition & camera

Frame 1080x1920, 30 fps. Target look: `ref/style-ref-swing.jpg`, `ref/style-ref-shots.jpg`.

## Safe areas (hard)

| zone | px | rule |
|---|---|---|
| caption band | y 270–560, x 150–930 | 2 lines max, 88 px Anton, each line <= ~19 characters. No face in the band while a caption is up. |
| face zone | y 610–1500 | hairline at y >= 610, chin above 1500 |
| player UI | y > 1540 | dressing only (cloth, blurred foreground, floor). Nothing the viewer must read. |

## Shot 01 — "The Bellona table" (`shots/bellona.js`, 8.8 s)

World: standing adult = 1000 units, table top y = 0, Darrow at x = 0, Cassius seated at x = 520.
Stills: `out/comp-01..12.png`, `out/comp-fury.png`. Motion: `out/bellona-preview.mp4`.

| # | time (s) | beat | framing / camera | caption (band 270–560) |
|---|---|---|---|---|
| 1a | 0.00–0.50 | Calm table, then boots drop in | Low camera at table height, zoom 2.5, rolled -8 deg (table lip is a rising diagonal). Table lip at y~1480, cloth + silver eagle fill the bottom, blurred goblet silhouette bottom-left. Speed lines on the drop. | `HE STOOD ON` — sits on blurred guests / wall |
| 1b | 0.50–1.50 | SLAM | Boots + greaves fill y 600–1480 (46% of height, legs run out the top). White flash 3 frames, 46 px shake, zoom punch +0.14, impact rays, shards, plates hop, goblet goes over, wine runs over the lip (right of the boots). Slow push 2.5 -> 2.8. Far wall tipped back 14 deg, Darrow tipped 6 deg about his feet (low angle). | + `THEIR TABLE.` in gold (band lies on his dark cloak / crimson armour, so not red) |
| 2a | 1.50–3.10 | Rise up the body | Crane up 0 -> head, zoom 2.8 -> 2.75, roll swings -5 -> +5 deg, guests sink out of the bottom of frame (he towers). No caption while the body passes through the band. | none until 2.75, then `DARROW.` |
| 2b | 3.10–4.40 | The smile | Close-up: hairline pinned at y 610, chin ~1250, pelt and collar to the bottom edge; head+shoulders = 68% of height. Push 2.75 -> 3.0. Expression brood -> smile (blink at 3.1) -> grin at 3.35. Background: banner + window + chandelier, blurred. | `DARROW.` / `SMILING.` (red, pops at 3.35) on blurred wall above the hair |
| 3a | 4.40–5.05 | Whip down to Cassius | 0.65 s diagonal whip (down-right) with motion blur, roll +3 -> -4. No caption. | none |
| 3b | 5.05–6.65 | Cassius, calm | Bust, zoom 2.7, hairline at 610, he sits right of centre looking left (look-room toward Darrow). Yaw -45 -> -12. Blurred candelabra crosses the left foreground, guests behind slide left, far wall rotates. | `CASSIUS AU BELLONA.` on window/wall |
| 3c | 6.65–8.80 | Fury | Blink at 6.5, expression blend neutral -> angry centred on 6.9 (face near-frontal, yaw -5), zoom punch +0.13, push to 3.6, yaw continues to +42, camera drifts so he ends left of centre looking right. Darrow's own boots sweep left -> right across the bottom of frame, out of focus (below y 1450). | + `JULIAN'S BROTHER.` (red, pops at 6.9) |

Depth stack used in every beat (back to front): far wall (blur 5, parallax .35, CSS 3D tilt/rotate) · guest silhouettes (blur 2–3, .70) · actors + table (sharp, 1.0) · foreground shapes (blur 15, 1.6) · bokeh/dust/grade · caption.
During the swing, layers slide by `(depth - 1) * yaw * 5.2 px`: far goes against the face turn, near goes with it.

## Composition rules for the rest of the film

1. **Fill the frame.** Close-up: head + shoulders 60–70% of height. Medium: figure 75%+, cut at knee or waist, never floating whole in the middle. A full figure is allowed only as a deliberate scale shot (rule 8).
2. **Hairline at 610, eyes at 850–1000.** With a caption up, pin the top of the hair just under the band and let shoulders run out of the bottom. Without a caption the face may rise into the band (as in the rise, 1.5–2.75 s).
3. **Three depths minimum, always.** One blurred dark foreground shape touching a frame edge, the sharp subject, a blurred background. Foreground lives in the corners and below y 1450; it never crosses a face.
4. **No level horizons.** Roll the camera 3–8 deg and reverse the roll across a move. Tables, floors, ship hulls, blades run corner to corner.
5. **Low angle for power, high angle for loss.** Tip the far layer back (rotateX 12–20 deg) and the figure 4–8 deg about its feet when someone dominates; flatten or reverse it when they lose (Darrow at the Academy, the box).
6. **One camera idea per shot, eased, with a hold.** Push, crane, whip or orbit — not two at once. Start and end on a readable held frame (>= 0.4 s). Whips are 0.5–0.7 s with blur and carry no caption.
7. **Look-room and screen direction.** A face looking left sits right of centre and vice versa. Darrow faces/moves right through the film; whoever opposes him faces left. Break it only at the betrayal.
8. **Scale by contrast.** For fleets, armies, crowds: put something huge and close at one edge (a hull, a helmet, a banner) and the tiny thing it threatens deep in frame. Never a row of equal-size objects.
9. **Caption on quiet ground.** The band must sit on blurred background, sky, or a dark cloak. Red second line by default; gold when the band lies on red (armour, Mars). Two lines, <= 19 characters each; one caption per held frame.
10. **Cut on the hit.** Impacts get: 1 anticipation frame, 2–3 frame white/colour flash, shake decaying in 0.4 s, zoom punch, debris that crosses the frame edge. Reactions (plates, cloaks, crowds) lag the hit by 2–4 frames.

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
2. Whip-orbit close on Darrow mid-swing, razor arcs across the whole frame as a white diagonal smear.
3. Close on Cassius: shock expression, frame rolled 8 deg; the arm leaves frame bottom-left as a silhouette; 3-frame red flash. Do not show the wound: cut to
4. Low angle: the Sovereign rising from her throne, tiny against the windows and Earth, hand raised; Darrow's shoulder large in foreground.

**The Iron Rain**
1. Looking straight up: hundreds of drop-pods as streaks converging to a vanishing point above; one pod huge at the frame edge passing camera.
2. Inside-helmet close-up of Darrow, visor reflections scrolling, shake; eyes at y 950.
3. Looking down past his boots (big, top of frame) at the Martian city and flak blooms below; fall continues toward camera.
4. Ground, low angle: Darrow lands in dust, silhouette against the orange sky, pods still raining behind on diagonals.

**Fitchner revealed as Ares**
1. The spiked Ares helmet fills the frame, front-lit red, absolutely symmetrical (the one symmetrical frame so far).
2. Hands lift it: camera orbits 40 deg as it comes off; Fitchner's face revealed in three-quarter, crooked grin, helmet stays in the lower foreground.
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
5. Darrow's POV, rolled 15 deg and going soft: the Jackal's small silhouette over Augustus's fallen body, lion banner burning behind.
6. Top-down: Darrow on the floor, tiny, dragged out of a pool of light; boots of his captors large at the frame corners.

**Final card**
- Black. A single razor lies on a diagonal across the lower third, one red rim light. Title text sits in the caption band; nothing else in frame. Slow 3% push-in for the whole hold.
