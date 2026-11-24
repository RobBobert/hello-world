# Channel workflow rules (Red Rising explainer Shorts)

## Fact-checking — mandatory, two passes
Book details are easy to misremember (Book 1 mistake: the script said Darrow killed Titus; actually Darrow
arranged the public execution and Cassius killed Titus in the duel).
1. **Script pass:** before generating any voiceover, list every plot claim in the script (who did what, to whom,
   when, which eye/hand, etc.) and verify each one against sources (wiki, chapter summaries). Flag anything that
   can't be confirmed instead of guessing. Get the user's OK on the claim list.
2. **Final pass:** after the whole video is finished (captions, visuals, narration), fact-check AGAIN end to end —
   captions and visuals can introduce errors the script didn't have (e.g. an X drawn on the wrong character).
   Report findings before the user posts.
- Prefer phrasing that is true even if a detail is fuzzy ("Darrow takes down Titus" vs. "Darrow kills Titus").
- Don't fold to the user's memory without evidence either; cite sources both ways.

## Format rules (from the user's reference Shorts)
- 9:16, ~60–120 s. Hook = a paradox or conflict, then escalate; ending reframes the hook.
- Captions: two lines — setup line in cream `#f6ead2`, twist line in red `#e8372c` (or gold) that pops in on the
  matching spoken word. Anton font; Cinzel for labels. Keep captions inside the safe area (≈150 px side margins,
  top ≈270 px) and keep ALL art/labels above the bottom ~20% (player UI covers it).
- Outro: dark `#1c1512` card, final punchline, gold-ring avatar, `@AVANZO.TV`, a question in Cinzel small caps +
  gold answer line (e.g. "Do you want Golden Son next? / Yes or No").
- Style: flat 2D, bell-shaped characters with ink outlines; the channel's own Institute map is used as a bitmap.
- Darrow (Gold) carries a curved razor (C-sweep, flared tip, black grip; ref: user's fan-art pick), holstered at the hip except when fighting. All Golds have golden hair (except the old gray Lorn) and the Peerless scar (crescent on the right cheek); non-Golds (Reds, Obsidians, Grays) keep their colors. Sevro: gold mohawk, gray wolf pelt,
  eye patch (Book 1, lost to the Jackal's knife; user says right eye — unverified).

## Audio rules
- Narration: ElevenLabs voice "Mark Vale – Deep Storyteller" (`PXMcl9zGUnc9w7DofLWk`), model eleven_v4.
- Music is a steady, even bed (no ducking pump), ~13 dB under the voice; tame cymbals/highs so they never sit on
  the voice. Final mix ≈ −14 LUFS, true peak ≤ −1.5 dBFS.
- Copyrighted songs (e.g. "Broken Boy") must NOT be baked into YouTube uploads (Shorts > 1 min with a Content ID
  claim get blocked). Ship a voice-only file for in-app music, and/or an original generated bed (ElevenLabs Music).

## Pipeline
- Animatic sources live in `animatic/book1/` (chars.js, scenes_anim.js, render_anim.js): frame-by-frame render in
  headless Chromium, then ffmpeg mux. Word timings come from ElevenLabs speech-to-text on the narration.
