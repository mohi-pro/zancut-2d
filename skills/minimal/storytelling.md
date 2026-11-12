# Minimal — Storytelling Skill

In a Minimal Storytelling video, **every scene is a custom Minimal motion graphic (`"piece": "custom"`, `"captions": "hide"`)** over the architectural stone or graphite grounds with their corner shapes (`star`, `blob`, `burst`, `none`).

## 1. Cutless Continuous Flow & Pacing Rules
1. **Cutless Transition Chain**: every scene defines structured JSON `anchorIn` and `anchorOut` poses so neighbouring scenes connect physically:
   - **Infinite Canvas Whip-Pan**: the camera whips horizontally or vertically along a continuous dotted/blueprint ground while a dashed line or card bridges the frame boundary.
   - **Optical Blur-Swap**: the outgoing central card blurs out (`blur(16px)`) while the incoming card sharpens (`blur(16px) -> 0`) at the exact same `(50%, 50%)` centre.
   - **Dashed Wire Handoff**: a dashed connector wire draws from the bottom of Scene $i$'s card into the top pill of Scene $i+1$.
2. **Beats at the voice's pace**: one word-locked beat for each idea the voice says, never on a clock; between beats the scene breathes with its slow ambient life (never frozen, never rushing). A typical scene has 2–3 beats:
   - `Beat 1`: the lead line + the hero card/cutout enters (`power4.out`).
   - `Beat 2`: the inner action happens (a chat types word by word, cards deal out in a fan, an hourglass pours sand, a tangled line unspools, or checklist rows thump down).
   - `Beat 3`: the twist **Inverted Black Label Bar** or a green `#22C55E` confirm tick snaps in.
3. **Corner Shape Variety**: corner shapes belong to the ground, so they stay through a run of joined scenes and change at a pivot (`star` -> `blob` -> `burst` -> `none` across runs); turn corners `none` on wide comparison or giant-type scenes.
4. **No Default Music**: no music unless the customer explicitly asked for it. The untouched voice and the sound system in Minimal timbre carry the rhythm.

<!-- graphic -->
## Minimal Storytelling Rules for the scene file
- **All Spoken Keywords Live Inside the Graphic**: because captions are hidden, render the spoken hook/keywords directly inside your centred `.gx-group` using the 3-tier hierarchy (`.gx-lead` muted top line + `.gx-hero` giant bold word/metric + `.gx-bar` inverted black label bar on the twist word).
- **Strict 50% Vertical Centering**: always centre `.gx-group` at `y = 50%` (`±2%`) with `6%–12%` equal side margins.
- **Combine Tactile UI + Editorial Cutouts**: alternate between **Tactile Ceramic/Dark UI Cards** and **Editorial Greyscale + Single-Accent Metaphors** (brain, chess, coin, orbit collages) so no two consecutive scenes share the same silhouette.
