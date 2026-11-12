# Brief 3 — Animals and birds: set pieces that move

Give this file to the AI that makes the library **together with Brief 2** (`02-places-prompt.md`): the format, the look, the
helpers and two full examples (one still, one moving) are there. Also give it `docs/2d-library/tools/preview.html`.

---

## Your job

Animals and birds for Zancut's flat 2D cartoon films: the village cow, the street dog, a flock of crows, ducks on a pond. They are
set pieces (`ZS.define`, `kind: "set"`, `tags: ["animal"]`) in exactly the format of Brief 2, with two additions:

1. **They are alive**: every animal has a `tick(t)` with its idle life (a tail swish, ears, breathing, a head bob, a peck, a
   wing flap), gentle and from `t` only (the same `t`, the same picture).
2. **They can do a few things**: an option `act` picks the motion, and the animal draws it from `t`:
   - every walker: `act: "idle"` (default), `"walk"` (legs cycling in place; the designer moves `x`), `"eat"` (head down);
   - birds: `"perch"`, `"fly"` (wings flapping; flocks fly as a group), `"peck"`;
   - option `speed` (1 = normal) scales the cycle; option `facing` is the same as `flip`.

The anchor is the ground under the middle of the body (for a flying bird: the middle of the body, and `y` is its height in the
sky). `h` is the height of the standing animal (to the top of the head), so a designer can size it against a person: a person
is drawn about 27 × `scale` U tall; give each animal its **real height in cm** in `about` ("a cow, about 130 cm") so it can be
sized right.

## The look

The same as the people and the places: flat fills, soft under-shade, light from the top left, no outlines, simple friendly
shapes, real proportions (not a mascot: a cow is a cow), calm and warm colours. Legs bend the right way and stay on the ground
while walking (a planted hoof does not slide).

## What we need (camelCase ids)

- **P1 (village and street)**: `cow` (Bangladeshi deshi cow, white, brown or black by `seed`/`color`), `goat` (black Bengal
  goat), `hen` (and `rooster` via an option), `chick` (small, often 3–5 together: option `n`), `duck` (on land or swimming:
  `act: "swim"` on water), `streetDog`, `cat`, `crow`, `crowFlock` (n crows flying or on a wire), `sparrow`, `pigeon`,
  `butterfly` (flits around its anchor), `fishInPond` (a fish jumping or a ripple: `tick`)
- **P2**: `buffalo` (in water up to its back, `act: "wade"`), `horse`, `sheep`, `kingfisher` (on a branch), `myna`,
  `parrot`, `squirrel`, `frog` (on a lotus leaf), `bee` (around flowers), `flockOfBirds` (far, small, a V)
- **P3 (stories and the zoo)**: `royalBengalTiger`, `elephant`, `monkey`, `deer`, `camel`, `lion`, `rabbit`, `turtle`,
  `crocodile`, `owl`, `peacock`, `dolphin`

## How to deliver

One folder `set/`, one file per animal named by its id, P1 first; check each one moving in `preview.html`. A `NOTES.md`
lists what was skipped or is unsure. Zancut checks it again (`node scripts/library-check.mjs <folder>`).
