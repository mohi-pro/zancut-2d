# Brief 6 — Body proportions: a real chart for every age, gender and build

Give this whole file to the AI. Nothing else is needed.

---

## Your job

Zancut draws 2D cartoon people (flat colour, soft shading, no outlines) on one shared skeleton. Today it has only four body
profiles (adult, child, elderly, broad) and no female body: a woman gets a man's limb thickness (her arms look like a
bodybuilder's), and a child's limbs are thicker for its height than an adult's (the child looks puffy).

We need a **measured chart**: the real proportions of a person at each age, for women and men, and how build changes them.
We turn your chart into body profiles and into an automatic test (for example limb width ÷ height must stay inside your range),
so a puffy child or bodybuilder arms fail the test by themselves. You give numbers and ranges. You do not draw or write code.

The people in our films are mostly **Bangladeshi / South Asian**: use South Asian data where it exists (national surveys,
WHO growth standards, Indian and Bangladeshi anthropometric studies), and say in `sources` what you used. Then give the same
chart's range wide enough to cover people from anywhere (our films also show other countries).

## Who

- Genders: `female`, `male`.
- Ages: `toddler` (2–3 years), `child6`, `child9`, `child12`, `teen` (15–16), `adult` (25–40), `elder` (70+).
- Builds: `thin`, `average`, `heavy`. (A heavy child is a heavy child, not a small heavy adult.)

That is 14 rows (gender × age) for `average`, plus how `thin` and `heavy` change each row.

## What to measure (for every row)

All lengths in **metres**, each as `[min, usual, max]` for that row (min/max ≈ the 10th and 90th percentile).
Widths are **as seen from the front**, standing straight, arms down, at the widest point of the body there.

- `stature`: full height, no shoes.
- `headHeight`: chin to the top of the skull (no hair). `headWidth`: side to side at the ears' height.
- `headsTall`: stature ÷ headHeight (the classic "heads tall": about 4 for a toddler, 7–7.5 for an adult).
- `neckLength` (chin to the notch between the collarbones, seen from the front) and `neckWidth`.
- `shoulderWidth`: across the outer edges of the shoulders (bideltoid). `chestWidth`: across the chest under the armpits.
- `waistWidth`: at the narrowest part of the torso. `hipWidth`: across the widest part of the hips and buttocks (bitrochanteric).
- `chestDepth` and `waistDepth`: front to back (we see people from the side too).
- `shoulderHeight`, `elbowHeight`, `wristHeight`, `crotchHeight` (inside leg), `kneeHeight`, `ankleHeight`: from the floor.
- `upperArmLength` (shoulder joint to elbow), `forearmLength` (elbow to wrist), `handLength` (wrist to fingertip), `handWidth`.
- `thighLength` (hip joint to knee), `shinLength` (knee to ankle), `footLength`.
- **Limb widths, seen from the front**: `upperArmWidth` (at the biceps, arm hanging relaxed, not flexed), `elbowWidth`,
  `forearmWidth` (widest), `wristWidth`, `thighWidth` (top, below the crotch), `kneeWidth`, `calfWidth` (widest), `ankleWidth`.
- For `elder` add `stoopDeg` (forward bend of the upper back), and the height lost compared with `adult`.

## The ratios (what the test checks)

For every row, give `[min, max]` of these ratios, computed from your measures (we compare our drawn people against them):

- `headHeight / stature`
- `shoulderWidth / stature`, `hipWidth / stature`, `shoulderWidth / hipWidth` (women and men differ here the most)
- `waistWidth / hipWidth`
- `upperArmWidth / stature`, `forearmWidth / stature`, `thighWidth / stature`, `calfWidth / stature`
- `upperArmWidth / thighWidth` (arms are much thinner than legs; a cartoon that gets this wrong looks muscle-bound)
- `(upperArmLength + forearmLength) / stature`, `(thighLength + shinLength) / stature` (a child's legs are short for its height)
- `crotchHeight / stature`

## Cartoon allowance

Our people are stylised, not photoreal. For each ratio also give `cartoonRange`: how far a friendly 2D cartoon can push it
before the body reads wrong for that age (for example a child's head may be up to 15% bigger than real; an adult woman's
upper arm may be up to 10% thinner than real but never thicker). Explain each allowance in one line in `cartoonNotes`. The
test fails anything outside `cartoonRange`.

## Builds

For `thin` and `heavy`, give a multiplier per measure (`1.0` = same as `average`). Bones do not change with build: lengths of
arms, legs and stature stay `1.0`; widths and depths change, and not evenly (weight goes to the belly, hips, thighs and upper arms
first; wrists, ankles, hands, head size barely change). Give the women's and men's builds separately: they gain weight in
different places.

## How it moves with age (`motion`)

For every age give, in one small object: `walkSpeed` (m/s, normal pace), `stepLength` (m), `cadence` (steps per minute),
`runSpeed`, how fast they turn their head, and how long a sit-down or a stand-up takes (seconds). Elders: also what slows them
(one hand on the knee to stand, shorter steps, a pause before sitting).

## The format: one file `proportions.json`

```json
{
  "units": "metres",
  "sources": ["WHO Child Growth Standards …", "…"],
  "rows": {
    "female.adult": {
      "measures": { "stature": [1.46, 1.51, 1.58], "headHeight": [0.205, 0.215, 0.225], "...": "every measure above" },
      "ratios": { "headHeight/stature": { "real": [0.135, 0.147], "cartoonRange": [0.13, 0.17] }, "...": "every ratio above" },
      "motion": { "walkSpeed": [1.1, 1.25, 1.4], "stepLength": [0.55, 0.62, 0.68], "cadence": [105, 115, 125], "...": "…" }
    },
    "male.child6": { "...": "…" }
  },
  "builds": {
    "female": { "thin": { "upperArmWidth": 0.85, "...": "…" }, "heavy": { "upperArmWidth": 1.35, "...": "…" } },
    "male":   { "thin": { "...": "…" }, "heavy": { "...": "…" } }
  },
  "cartoonNotes": { "headHeight/stature": "children's heads read cuter a little big; never more than 15%", "...": "…" }
}
```

## Quality bar

- Every one of the 14 rows has every measure and every ratio. No row copied from another with only the stature changed:
  a 6-year-old is not a small adult (bigger head, shorter legs, no waist, narrow shoulders).
- Girls and boys are nearly the same before about 10; differences grow in the teens. Show that in the numbers.
- The numbers agree with each other: the lengths add up to the stature, and every ratio matches its measures.

## How to deliver

One folder: `proportions.json` (valid JSON, no comments) and `SOURCES.md` (where each group of numbers came from, and what
you estimated).
