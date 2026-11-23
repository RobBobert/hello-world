# Seedance prompt — Golden Son opening (Bellona table)

Model: ByteDance Seedance 2.5 (ElevenLabs) · 9:16 · ~10 s · ≈ $3.36 per clip
Start frame: a still of the steak close-up (`out/pick-00008.jpg` style) · Voices added afterwards (no dialogue from Seedance)

## Full prompt (copy-paste)

Flat 2D cartoon animation, chibi characters with bold ink outlines and cel shading, vertical 9:16, smooth cinematic
camera. A grand moonlit banquet hall drained to gray tones; the characters stay in full color.

[0–2s] Extreme close-up of a thick seared steak on a white plate, steam rising. A heavy gold armored boot slams down
onto it; the plate shatters, juice and shards burst outward, the table shakes. The camera stays on the boots.

[2–5s] The camera pulls back and lowers into an over-the-shoulder shot from behind a seated knight with big golden
curls and gold sun-emblem armor. Only a thin sliver of his shoulder and curls shows at the frame edge, so the warrior
fills the shot. On the table, a blond young warrior in dark-gold lion armor with a crimson sash walks two steps
forward, raises a half-moon hooked sickle blade — a sharp crescent like a scythe — and points it down at the knight
in challenge, smiling boldly as he speaks.

[5–7s] One continuous camera arc spins around the room to the reverse over-the-shoulder shot behind the warrior
(only the edge of his shoulder visible), looking down at the curly-haired knight.

[7–10s] The knight leans back lazily in his chair, crosses one leg over the other, lifts a gold goblet and takes a
slow sip of wine, feigning no surprise, a red wine stain on his armor, then answers with a bored, unimpressed glance.

Keep both characters' faces, colors and proportions identical in every shot. No text, no subtitles, no extra people
in the foreground, no blood, no photorealism.

## Breakdown — what each part does

| Part | Why it's written that way |
|---|---|
| Style line ("flat 2D cartoon… bold ink outlines… cel shading… gray hall, full-color characters") | Locks Seedance to our look so it doesn't drift into 3D/realism. Stated first because these models weight the opening words most. |
| Time tags [0–2s] [2–5s] … | Seedance follows ordered beats far better than one long sentence. The tags pace the 10 s clip. |
| Steak close-up + boot slam | Your opening: the steaming steak, the impact, shards and the shake. "Camera stays on the boots" keeps the focus where you asked before it pulls back. |
| "Pulls back and lowers into an over-the-shoulder…" | One continuous move from boots to Cassius's POV instead of a cut. |
| "Only a thin sliver of his shoulder and curls" | Your note: less back of the head, so Darrow's face and gesture read clearly. |
| "Half-moon hooked sickle blade — a sharp crescent like a scythe" | Describes the blade three ways (half-moon, hooked, scythe) so it doesn't default to a straight sword. |
| "Points it down at the knight in challenge, smiling boldly as he speaks" | The challenge pose plus the smile, timed for Darrow's line "Cassius." |
| "One continuous camera arc spins around the room" | The swing to Darrow's shoulder as a single orbit, not a hard cut. |
| "Leans back lazily… crosses one leg… slow sip… feigning no surprise" | Cassius's nonchalant reaction, written as separate visible actions so each one actually gets animated. |
| "Wine stain on his armor" | Continuity with the wine that splashes him in the wide shot. |
| Closing "Keep… identical… No text, no blood…" | Negative instructions: stops character drift, burned-in captions, extra people blocking the frame, gore. |

## Dialogue (added in the edit, not by Seedance)
- ~4.0 s — Darrow: "Cassius." (proud, bold) — ElevenLabs voice "Clive – Determined Hero"
- ~9.0 s — Cassius: "Darrow." (annoyed, bored) — ElevenLabs voice "Posh Josh"

## Risks
- Two characters across three camera moves in one clip is a lot; Seedance may change a face or costume mid-arc.
  Fallback: two clips (0–5 s and 5–10 s) from two start frames, ≈ $6.72.
- Chibi style can soften toward generic anime; if so, add "thick black outlines, simple flat shapes" to the style line.
