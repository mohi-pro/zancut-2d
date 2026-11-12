# Standard — A Person on Camera (talking head): 7 speaker layouts

The same Standard process as every video; the person speaking is the anchor, framed in clean solid broadcast containers, pop-out
squircles, audio-spectrum rings or a 3-zone masterclass HUD while context-driven solid cards, comparisons and ✓ rows animate
around them. Where the person is seen, where a graphic takes the frame and where both share it is your decision, moment by moment
(the shared playbook's "A person on camera"). These are Standard's layouts (`thMode`); change them with the meaning, on sentence
boundaries, never the same layout twice in a row:

1. **`popout-box-split`**: top stage (y 6–45%) a Standard graphic (M02 phone, M04 contrast, M11 pipeline) over a clean grid; a caption bridge (y 45–51%, a #1E293B pill with a #FACC15 emphasis word, or a solid accent pill); the speaker in a rounded box at the bottom (y 52–92%, x 8–92%, `border-radius: 28px`, a 2.5 px accent or white border, a deep shadow) whose top border crosses the forehead so the head rises out of it.
2. **`masked-pip-stage`** (the primary Standard mode: M18 / M19): the speaker in a rounded broadcast frame (`border-radius: 24px`, a red ● LIVE pill top-left, a name and role banner bottom-left). 9:16: the frame at y 22–54%, ✓ rows or the M15 offer card at y 56–84%. 16:9: the frame left (x 5–42%), the right stage (x 45–95%) with M04 comparisons, M10 mystery cards or the M19 HUD with its chapter rail.
3. **`behind-head-depth`**: full-screen speaker with bold display type (110–160 px) or concentric radar or clock rings behind the head (y 10–44%), the cut-out in front.
4. **`bg-replace-stage`**: the camera background gone; the cut-out on a Standard gradient and grid ground (or inside an M17 audio ring) with solid icon cards and curved arrows beside them.
5. **`over-torso-glass`**: full-screen speaker with a crisp solid white or navy card (an M13 calendar and clock, an M15 metric, an M09 checklist) at y 53–76% (the caption lane under it stays empty), the face (y 8–46%) clear.
6. **`lower-third-kinetic`**: full-screen speaker with a solid lower-third banner (y 63–75%, above the caption lane): a round avatar or icon badge, the bold name, a solid accent role or topic pill.
7. **`full-broll-takeover`**: the speaker hidden while full-screen Standard mechanics play with cutless joins.
Plus `speaker` (the plain speaker, no graphic) for short breathing moments.

The hook (0–3.5 s) is a designed moment: usually `popout-box-split`, `masked-pip-stage` or `bg-replace-stage` (or a full graphic
when the words are a striking image); rarely a plain talking head. `popout-box-split`, `behind-head-depth` and `bg-replace-stage`
need the speaker cut-out: when the Brief says it is not usable, use the other layouts.

<!-- graphic -->
## Standard talking-head zones for the scene file
- **`popout-box-split`**: top cards and devices strictly inside x 6–94%, y 7–44% (16:9: the left stage x 6–54%, y 10–88%). Leave the speaker box transparent so the head breaks out above its border.
- **`masked-pip-stage`**: keep the frame's inside transparent so the speaker video is fully visible; draw its 2 px border, the red ● LIVE pill (`background: #EF4444; color: #fff; font-weight: 800; border-radius: 999px; padding: 4px 14px`) and the nameplate. In the companion zone (9:16 y 56–84%; 16:9 x 45–95%) animate the script's cards (✓ rows, M10 cards, the M15 card) on their word times.
- **`behind-head-depth`**: a transparent root; the giant text or rings inside y 10–44% behind the cut-out.
- **`over-torso-glass` / `lower-third-kinetic`**: a transparent root; solid cards inside y 53–76% (lower third y 63–75%); y 77–93% is the caption lane (keep it empty); the face is never covered.
