# Zancut 4-Pass Sound System (every design system: Glossy, Minimal, Standard)

Every video has four passes of sound, all from Zancut's own sound kit: **WHOOSHES** (movement), **TEXTURES** (events),
**RISERS + HITS** (build and release) and **VOICE + MUSIC** (the master balance; the voice is untouched and always leads). The
director chooses motion that deserves sound, sets the video's mood and marks the scenes that deserve a riser + hit (`"rise"`);
the builders place the cues; the engine sets every level and lane and opens scenes with their whoosh where the design system asks.

- Read the tone of the script before you place any sound. For calm, trust-led content (medical, health, finance, education, advice, personal stories) use soft ticks and gentle whooshes only: no risers, no hits, no impacts. Keep effects about 8 dB below the promo level and the music bed low enough that the voice always clearly leads. Use risers and hits only for promo, hype or announcement energy, and never under a sentence the speaker is still saying. <!-- adopted 2026-10-24: amvlb9u0s6jxg -->
- A calm mood in the storyboard (calm, caring, informative, serious…) also makes the engine drop its risers and soften whooshes.

<!-- graphic -->
## How you place sound
At the very end of every graphic scene file write one comment: `<!--cues [["name", seconds], ...]-->`. Seconds are
scene-relative (from the scene's start). Use only these names (the engine picks a variant of each; code drops any other name):

| Family | Name: what it is for |
| :--- | :--- |
| Whoosh (movement): cue the **fastest frame** of the move (for an expo/power-out entrance ≈ 0.07–0.12 s after it starts); the engine lines the whoosh's own peak up with it | `wh-short` a tiny quick move · `wh-hollow` soft air: a smooth pan or UI slide · `wh-wind` a gentle, long drift · `wh-trans` a scene-to-scene morph · `wh-deep` a heavy low move: a card slide, a spline lift · `wh-future` a bright sci-fi move: a ribbon, a sci-fi slide · `wh-long` a long sweep, a slow build into a quick change |
| Texture (event): cue the exact second of the event (its word lock) | `tx-pop` a chip, icon or word pops · `tx-ui` a click, toggle, tap or slash · `tx-scifi-click` a bright digital click, a state or colour change · `tx-camera` a stamp, a snapshot, a card freezing into place, a laser flash · `tx-scan` a line, wire, bar or chart drawing · `tx-energy` something fills, grows or lights up · `tx-gears` a counter rolls, a clock sweeps, a calendar flips, a tile ripple · `tx-impact` a hero card, stamp or contrast bar slams in · `tx-success` a tick, a lock, a final step done · `typing` text being typed · `tx-choir` a huge reveal (rare: once in a video at most) |
| Riser + hit (build and release) | `rs-bass`, `rs-metal`, `rs-suck`, `rs-suspense` (risers) and `hit` (the impact): write the riser at the **reveal second** (the engine ends the riser there) and `hit` at the same second |

Old names map to these: `tx-reward` = `tx-success`, `wh-soft` = `wh-wind`, `wh-spacey` and `wh-scifi` = `wh-future`, `tx-gizmo` = `tx-scifi-click`.

- **A specific sound the kit lacks** (the picture shows a cash register, a bell, rain, a crowd, a rickshaw): `find_sound`
  finds free ones, you pick one, then cue it as `["lib:<name>", second]`. It is set to the kit's loudness. At most one or two
  per scene, on the moment the thing appears; never instead of the kit's whooshes and textures. Nothing found or the sound
  libraries are down: use the nearest kit family.

## Density (every graphic scene)
3 to 5 cues: **1 movement whoosh** on the main entrance or the hand-off, **2–3 event textures** on the scene's word locks, and
**1 resolution** (`tx-success`, `tx-camera`, or a riser + `hit` on the climax). At most 2 whooshes in a scene, never the same
texture twice in a row, never more than 8 cues (code keeps the first 8).
- Vary across the whole video too: rotate whoosh and texture names from scene to scene so no sound becomes repetitive.
- **Risers and hits**: the engine puts a riser + hit where the director marked a scene `"rise"` (it builds into that scene's
  arrival). You add a riser + `hit` yourself only for the climax reveal inside your scene, in promo or hype energy, never in calm
  content.
- Your design system's skill names its timbre: the families that sound like it. Prefer those.
