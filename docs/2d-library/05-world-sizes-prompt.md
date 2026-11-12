# Brief 5 — World sizes: how big every thing is, and where people touch it

Give this whole file to the AI, together with `library-items.json` (made by `node scripts/library-briefs.mjs`).

---

## Your job

Zancut makes 2D cartoon films for Bangladesh (and the wider world). Its films are built from ready parts: trees, houses, bus
stops, vehicles, furniture, props people hold, animals. Today every part is sized by eye in pixels, so a person can be taller
than a door or smaller than a cup. We are fixing that with **one world scale in metres**: every part gets its real size, and the
engine turns metres into pixels by how far the thing is from the camera.

You give the **real-world facts**. You never draw anything and never write code. We fit our drawings to your numbers and check
them on real pictures.

`library-items.json` lists every part we have: its `id`, `kind` (`set` = scenery, furniture, vehicles, animals; `prop` = a
thing held or carried; `builtin` = an engine piece), and a short `about`. Give **one entry for every id in that file**, plus
the standard measures below.

## Where the numbers come from

- Use real measures: building codes, furniture standards, vehicle spec sheets, zoology references, anthropometry. For
  Bangladesh-specific things (CNG auto-rickshaw, cycle rickshaw, local bus, tin house, tea stall, launch, mosque minaret, mud
  stove, kolshi) use Bangladeshi sizes, not American or European ones.
- Every size is `[min, usual, max]` in **metres**: the range a real one has. `usual` is what we draw when the story says nothing.
- Unsure? Say so in `"note"`, and still give your best range. Never leave a field out to save time.

## The format: one file `sizes.json`

```json
{
  "units": "metres",
  "standards": { "...": "see the next section" },
  "items": {
    "busStop": {
      "what": "a city bus-stop shelter: a roof on two posts, a bench under it",
      "anchor": "ground",
      "height": [2.4, 2.6, 2.9],
      "width": [3.0, 4.0, 6.0],
      "depth": [1.2, 1.5, 2.0],
      "contacts": {
        "seat":      { "y": 0.45, "x": [-1.2, 1.2], "z": 0.3 },
        "roofUnder": { "y": 2.3,  "x": [-1.8, 1.8] }
      },
      "covers": "roofUnder",
      "use": ["under", "sit"],
      "surface": "concrete",
      "checks": ["an adult of 1.75 m stands under the roof with at least 0.4 m to spare", "the bench seat is at knee height of an adult"],
      "note": ""
    },
    "teaCup": {
      "what": "a small white tea cup with a saucer",
      "anchor": "held",
      "height": [0.06, 0.07, 0.09],
      "width": [0.07, 0.08, 0.1],
      "contacts": { "grip": { "y": 0.04, "x": [0.04, 0.05] }, "base": { "y": 0, "x": [-0.03, 0.03] } },
      "use": ["hold", "drink", "putDown"],
      "checks": ["held between thumb and two fingers; fits inside an adult hand of 0.18 m"]
    },
    "cow": {
      "what": "a Bangladeshi deshi cow",
      "anchor": "ground",
      "height": [1.05, 1.2, 1.35],
      "length": [1.6, 1.9, 2.2],
      "parts": { "withers": [1.0, 1.15, 1.3], "headTop": [1.2, 1.35, 1.5] },
      "contacts": { "head": { "y": 1.1, "x": [0.8, 1.0] }, "back": { "y": 1.15, "x": [-0.5, 0.4] }, "mouth": { "y": 0.95, "x": [1.0, 1.1] } },
      "use": ["pat", "lead", "feed", "milk"],
      "checks": ["an adult's hand rests on its back at about chest height"]
    }
  }
}
```

**Fields** (give every one that applies):
- `what`: one plain sentence on what the real thing is.
- `anchor`: where it sits. One of `ground` (stands on the floor/ground), `wall` (hangs on a wall: give `y` = height of its
  bottom edge above the floor in `contacts.bottom`), `ceiling` (hangs from it: give the drop), `sky` (clouds, sun, birds in
  flight, planes), `water` (floats or wades: give the waterline in `contacts.waterline`), `held` (in a hand), `worn` (on a
  body), `far` (scenery seen far away: hills, skylines, forests; give its real size anyway, e.g. a hill 40–300 m).
- `height`: from the ground (or its own bottom) to its top. For a held prop, its own height. For an animal, to the top of the head
  when standing normally; add `parts.withers` (shoulder height) for four-legged animals.
- `width`: side to side as we see it from the front. `depth`: front to back. `length`: for animals and vehicles seen side on.
- `contacts`: **the places a person, an animal or another thing touches it**, each with `y` = height above its bottom in metres,
  `x` = `[from, to]` in metres from its middle (− = left as we look at it, + = right), and `z` (optional) = how far in front of its
  middle. Use these names wherever they fit, and invent clear camelCase names for the rest:
  - sitting and resting: `seat`, `seatBack`, `armrest`, `top` (a table top, a counter, a wall top), `shelf1`, `shelf2`…, `bed`, `pillow`
  - going in and out: `door` (give `x`, `y` = 0, and a `height` field inside it), `doorHandle`, `step`, `window` (sill `y` and top),
    `gate`, `entry` (where a person gets into a vehicle), `driverSeat`, `passengerSeat`, `roofUnder` (the underside of a roof, an awning, a hood)
  - holding and using: `grip` (where a hand holds a prop), `handle`, `strap`, `spout`, `screen`, `rim`, `base` (what rests on a surface)
  - animals: `head`, `back`, `neck`, `mouth`, `tail`, `rider` (for a horse, an elephant, a buffalo with a child on it)
- `covers`: the name of the contact that keeps rain and sun off what is under it (`roofUnder`). Leave out if nothing.
- `inside`: `true` for a room piece that only exists indoors (bed, almirah, ceiling fan).
- `use`: what people do with it, from: `sit`, `lie`, `stand on`, `under`, `in`, `lean`, `hold`, `carry`, `wear`, `give`, `open`,
  `close`, `push`, `pull`, `ride`, `drive`, `get in`, `get out`, `climb`, `pat`, `lead`, `feed`, `milk`, `drink`, `eat`, `write`,
  `read`, `cook`, `wash`, `putDown`, `pickUp`, `look at`, `none`.
- `surface`: what a foot on it is: `concrete`, `tile`, `wood`, `mud`, `grass`, `sand`, `water`, `metal`, `carpet`, `brick`, `none`.
- `checks`: 1–3 plain sentences comparing it to a person, so we can test our picture ("a 1.50 m woman reaches the top shelf
  only on tiptoe").
- `note`: anything special (sizes that change a lot, a regional variant, what you were unsure of).

## The standards (the `standards` object)

These are what the engine falls back on and what the size checker compares against. Give each as `[min, usual, max]` metres,
with Bangladeshi values where they differ:

- **People** (full height, standing straight, no shoes): adult man, adult woman, elderly man, elderly woman (70+),
  teen boy and girl (15), child boy and girl at 12, 9 and 6, toddler (2–3), baby (6–12 months, lying length).
- **Building**: storey floor-to-floor (city flat, village house), ceiling height (flat, tin house, mud house, school, office,
  mosque), door (house, shop shutter, school, hospital, gate), door handle height, window sill and top, stair step rise and run,
  railing, boundary wall, a one-storey village house to the roof ridge, a 5-storey city building.
- **Furniture**: chair seat, sofa seat, bench seat, low stool (piri/mora), dining table, study desk, school bench + desk, office
  desk, counter (shop, kitchen), bed top (city bed, village chouki), almirah, wall shelf, ceiling fan height.
- **Street**: kerb, footpath width, lane width, street lamp, electric pole, signboard bottom, bus-stop roof, rickshaw hood top,
  CNG roof, local bus roof, truck, car, motorbike seat.
- **Nature**: grass, paddy plant (young and ripe), banana plant, coconut palm, mango tree, banyan, bamboo, a village pond
  bank, a river boat's side above water.
- **Hand and reach** (adult man and woman): hand length, grip width, shoulder height, eye height standing and sitting,
  elbow height, hip height, knee height, overhead reach, arm reach forward, step length walking and running.

## What we need (by priority)

- **P1**: the `standards` object, then every item in `library-items.json` whose `kind` is `builtin`, then everything tagged
  `village`, `city`, `home`, `school`, `street`, `vehicle`, `animal`.
- **P2**: every other `set` item.
- **P3**: every `prop` item (props are small, but a cup bigger than a head ruins a shot).

## Quality bar

- An entry with only `height` is not done: think about how people use it and give its contacts.
- Ranges are real: a door is not `[1, 2, 3]`. If one thing comes in very different sizes (a boat: a dinghy or a launch), say it in
  `note` and give the size of what the `about` describes.
- Keep the numbers consistent across items: the bench in `busStop` and the `bench` item have the same seat height; a chair, a
  stool and a sofa are not the same seat.

## How to deliver

One file `sizes.json` (valid JSON, no comments), P1 items first. A short `SOURCES.md` listing where the main numbers came from
(standards, spec sheets, papers) and anything you guessed. Bring both back as one folder.
