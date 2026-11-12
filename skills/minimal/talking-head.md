# Minimal — A Person on Camera (talking head): 7 speaker layouts

The same Minimal process as every video; the person speaking is the anchor, framed with clean editorial restraint over the
architectural ground. Where the person is seen, where a graphic takes the frame and where both share it is your decision, moment by
moment (the shared playbook's "A person on camera"). These are Minimal's layouts for those moments (`thMode`), led by the signature
**Pop-Out Speaker Card** and the **Greyscale Cutout + Spinning Starburst**:

1. **`popout-box-split` (the signature Pop-Out Speaker Card + a top Minimal piece)**:
   - **Top Stage (`y: 6%–46%`)**: any Minimal graphic above the speaker: a numbered header (`#1 / NAME`), step cards joined by arrows, tool tiles, or a framed screenshot with a red highlight box + pointer arrow.
   - **Middle Caption Bridge (`y: 46%–52%`)**: a crisp word-by-word reveal with bold key words and a black label bar on the twist phrase.
   - **Bottom Pop-Out Speaker Card (`y: 53%–92%`, `x: 8%–92%`)**: a white or graphite rounded card (`border-radius: 28px`, `border: 2px solid var(--zk-ink)`, soft elevation shadow) whose top border crosses the forehead, while the speaker's cut-out head rises cleanly out of it.
2. **`bg-replace-stage` (Greyscale/Clean Cutout + Spinning Accent Starburst)**:
   - The camera background is hidden. The speaker's cut-out (crisp high-contrast greyscale or clean studio tone) stands over the dot-matrix ground, with a bold **spinning 8-point accent starburst** (`var(--zk-a)` or the ink) turning slowly behind the head and shoulders, and kinetic headlines/chips popping beside and above them (never covering the face).
3. **`behind-head-depth` (Editorial Giant Word Behind the Speaker)**:
   - The full-frame speaker video with a giant `160px–240px` ultra-bold word in the ink colour (or a cropped clock/orbit ring) at `y: 10%–44%`, placed behind the speaker's cut-out.
4. **`over-torso-glass` (Tactile Ceramic Card Over the Lower Torso)**:
   - The full-screen speaker with a clean ceramic card (or a dark balance card, `$22,677.45`) floating over `y: 54%–76%` (above the caption lane) while the face (`y: 8%–45%`) stays 100% clear.
5. **`lower-third-kinetic` (Minimal Black-Bar / Coin Lower Third)**:
   - The full-screen speaker with a crisp white card + black label bar lower-third capsule (`y: 63%–75%`, above the caption lane) and an embossed logo coin on the left.
6. **`masked-pip-stage` (Framed Corner Card + 75% Editorial Stage)**:
   - The speaker reframes into a rounded corner card while 75% of the canvas builds a multi-step workflow or a comparison table.
7. **`full-broll-takeover` (a full Minimal scene)**:
   - The speaker is hidden while a full-screen Minimal metaphor (a tangled-to-clean line, a 3D staircase, a chat card, an editorial brain/chess cutout) takes the canvas, joined to its neighbours with cutless transitions.
Plus `speaker` (the plain speaker, no graphic) for short breathing moments.

## Choosing them
- The hook (`0.0s–3.5s`) is a designed moment: usually `popout-box-split` or `bg-replace-stage` (or a full graphic when the words are a striking image); rarely a plain camera shot.
- Change the layout with the meaning, on phrase boundaries; never the same layout twice in a row; use cutless anchors whenever two `full-broll-takeover` scenes sit back-to-back.
- `popout-box-split`, `behind-head-depth` and `bg-replace-stage` need the speaker cut-out: when the Brief says it is not usable, use the other layouts.

<!-- graphic -->
## Minimal Talking-Head Layout Zones (the engine gives you the exact free zone in pixels)
- **`popout-box-split`**: build all top-stage cards, step pills (`#1 / NAME`), and red-box screenshots strictly inside `x: 8%–92%, y: 6%–44%` (`16:9`: the left stage `x: 6%–54%, y: 10%–88%`). Keep `y: 45%–95%` (`16:9`: `x: 55%–94%`) transparent so the pop-out head breaks cleanly above the card border without colliding with top graphics.
- **`bg-replace-stage`**: render the dot ground, mount a slowly turning 8-point SVG starburst (`220px–280px` across, in `var(--zk-a)`) behind the speaker's head (the face box), and place bold mixed-weight text + white logo chips in the upper/side free zones (`y: 8%–36%`) with zero overlap over the face.
- **`behind-head-depth`**: a transparent root; place the giant `weight: 900` word or orbital dial inside `y: 10%–44%` so the speaker cut-out covers the centre letters cleanly.
- **`over-torso-glass` / `lower-third-kinetic`**: a transparent root; mount the ceramic card or dark balance card inside `y: 54%–76%` (`lower-third-kinetic`: `y: 63%–75%`), leaving the face clear; `y: 77%–93%` is the caption lane (keep it empty).
