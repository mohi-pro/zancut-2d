# GLOSSY + A PERSON ON CAMERA (talking head): 7 speaker layouts

The same Glossy process as every video; the person speaking is the human anchor. Where the person is seen, where a graphic takes
the frame and where both share it is your decision, moment by moment (the shared playbook's "A person on camera"). These are
Glossy's layouts for those moments: every row sets `thMode`. The engine moves the speaker video, the speaker cut-out (the person
without their background) and the box around them; the motion designer draws the graphic layer into the zone the engine leaves
free. The Brief gives the face box, the top of the head and the moments the speaker points or counts.

## The 7 modes (`thMode`)
1. `popout-box-split` — the viral "head pops out of the box": a top graphic stage (y 6–44%), a word-locked caption bridge
   (y 45–51%), and the speaker in a rounded box at the bottom (y 53–92%) whose top border crosses the forehead, so the head and hair
   break out above it. For hooks, step-by-step ("01 How to get it"), showing a UI window, comparing two options.
2. `behind-head-depth` — giant metallic glass type, a horizon arc or a rising spline BEHIND the speaker's head and shoulders
   (y 10–48%), the cut-out in front. For power statements, chapter titles, huge numbers ($12B, 300%, 10X), turning points.
3. `bg-replace-stage` — the camera background disappears; the speaker cut-out stands in an animated glossy stage with cards floating
   behind the shoulders, rim-lit by `--zk-a`. For high-energy hooks, climaxes, or a note asking to change the background.
4. `over-torso-glass` — the speaker full screen with a dark bottom vignette; a kinetic header (y 44–52%) and a frosted glass card
   over the lower torso (y 53–76%, above the caption lane). Face (y 10–43%) stays 100% clear. For proof, client lists, streaks, metrics.
5. `lower-third-kinetic` — the speaker full screen; an asymmetric glass lower-third capsule (y 63–75%, above the caption lane) with a liquid-glass icon squircle,
   a metallic headline and a coloured delta pill (+78%). For introducing someone, a source, a one-line takeaway.
6. `masked-pip-stage` — the speaker shrinks into a corner squircle (or a circle) while 75% of the frame shows a diagram, ribbons or a
   comparison table. For architecture flows, convergences, tables.
7. `full-broll-takeover` — a full-screen glossy metaphor (or the customer's own clip, `"piece": "mine"`) for as long as its thought; the voice
   keeps driving every word-locked event. For the strongest visual metaphors.
Plus `speaker` (plain speaker, no graphic) for short breathing moments between modes — rare.

## Choosing them
- The hook (0.0–3.5 s) is a designed moment: usually `popout-box-split`, `behind-head-depth` or `bg-replace-stage` (or a full
  graphic when the words are a striking image); rarely a plain talking head.
- Change the layout with the meaning, on sentence boundaries; never the same layout twice in a row. Modes 1–6 keep the person on
  screen; `full-broll-takeover` hands the whole frame to the strongest metaphors.
- `popout-box-split`, `behind-head-depth` and `bg-replace-stage` need the speaker cut-out: when the Brief says the cut-out is not
  usable, use modes 4–7 instead.
- 16:9: popout-box-split becomes a side split (graphic left 55%, speaker box right 45% with the head popping above its border);
  over-torso cards sit lower-right or lower-left (x 55–92%, y 52–85%).
<!-- graphic -->
## Your scene's mode (the engine gives you the exact free zone in pixels)
- `popout-box-split`: your root covers the whole frame UNDER the speaker box. Draw the full-bleed `bgStage` ground, then the hero
  graphic inside the top stage zone, topped by a centred frosted step pill (e.g. "01 How to get it" with a `--zk-b` number badge).
  Keep the bridge zone and the speaker box zone free of content (the engine draws the box, its border and the caption bridge).
- `behind-head-depth`: transparent root, drawn BETWEEN the speaker video and the cut-out. Giant display type (110–160 px, -0.04em)
  or a horizon arc / spline in the upper zone; the head will cover its centre — make it readable around the head (split the word
  left/right of the head, or set it above the head line).
- `bg-replace-stage`: your root is the full ground (the camera background is hidden). Draw the `bgStage` and 1–3 glass cards,
  nodes or bars placed behind the shoulders (left/right of the body zone). The cut-out stands in front of you.
- `over-torso-glass`: transparent root over the speaker. A kinetic header in the header zone (bold sans + one italic accent word),
  and ONE frosted card in the card zone with staggered rows / a rolling counter / a calendar grid (`back.out(1.4)` entrance).
  Nothing in the face zone.
- `lower-third-kinetic`: transparent root. One asymmetric glass capsule in the lower-third zone: icon squircle left, metallic
  headline, delta pill right.
- `masked-pip-stage`: your root is the full frame (ground + diagram) — the engine draws the speaker on top in the corner badge;
  keep that corner rect clear.
- `full-broll-takeover`: a complete full-frame glossy scene (ground + hero + chips).
