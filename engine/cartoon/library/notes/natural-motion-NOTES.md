# Brief 8 natural motion: what was taken and why (6 Nov 2026)

The delivery (`docs/2d-library/08-natural-motion-prompt.md`): 132 actions, 12 gestures, 22 hand shapes. Every file passed
`node scripts/library-check.mjs` (bone lengths 0% off, reach, floor, all four profiles). The numbers cannot show whether a pose
reads, so each group was drawn large on a man (side), a woman (three-quarter), a child (front) and an elder (side) and judged.

The motions carry no body sizes: the engine keeps each bone's direction and uses the person's own lengths, so a child or an elder
gets their own proportions. Odd proportions seen in another tool's preview do not come into Zancut.

## Taken (91 actions, 5 gestures)
- Rest idles (`rest_stand_a/b/c`, `rest_listen`, `rest_wait`, sits, `rest_squat_adda`, `rest_sit_piri`, child / elder stands).
- Feelings and looks. The head dropped 25–34° past the chest in `sink_sad`, `sad_idle`, `cry_quiet_stand`, `tired_slump_stand`,
  `guilt_look_away`, `brighten_up` and others, which hid the face and showed a long neck. It is capped at 18° (the neck and head turned
  back toward the chest line, `headForward` with them); the `about` says so. `library-check` warns past 22° from now on.
- Objects and Bangladesh work: pick up / put down, give / take, doors, sitting on bench / stool, getting in and out of a rickshaw,
  CNG, bus and boat, eating rice by hand, cooking at a chula, winnowing, the dheki, carrying on the head, the bhar, the dhol, the
  harmonium and the ektara. `row_boat` replaces ours: the same look, plus its contacts and sounds.
- Gestures: `point_sky_high`, `whisper_aside`, `hold_nose_smell`, `eid_salam_chest`, `fan_with_pakha`.

## Not taken
- **Hand shapes (22):** small edits of the ones we ship; `ok` loses its thumb shape, `cuppedPalm` and `pinchPalm` get double palm
  lines. Ours stay.
- **`help_up_a/b`:** ours read better (the helper reaches out; the fallen person kneels and reaches up).
- **`fear_shrink`:** leans toward the danger; fear pulls back.
- **Gestures (7):** `namaskar_pronam`, `blow_hot_tea` and `play_flute_banshi` cross the forearms into an X from the front instead of
  meeting the palms; `hold_lantern_up` stays at the face, `raise_placard_slogan` never goes above the head, `pat_own_belly` floats in
  front of the belly, `shield_eyes_sun` covers the cheek from the front.
- **Pairs (38 files):** the stance offsets are right, but the contacts are written for two adults of the same size, and the engine
  does not yet bend an arm to `partner.<joint>`. So salam hands do not meet, the hug does not wrap, touch-feet bumps the chest and
  the child is never lifted. They are kept in the delivery folder until the contact solver exists, then rechecked.
