# Brief 2 — Places: set pieces for nature, villages, cities, vehicles and rooms

Give this whole file to the AI that makes the library. It is complete on its own: the helpers, two full working examples and
the rules are inside (appendix at the end). Also give it `docs/2d-library/tools/preview.html` (one self-contained page: open it
in a browser, choose your .js files, and every piece shows in three seeds, day or night, the moving ones moving).

---

## Your job

Zancut makes flat 2D cartoon films (Bangladeshi and global stories). Before the shots, one designer composes every **place** of a
film (a village pond, a Dhaka street, a classroom) from **set pieces**: one tree, one house, one rickshaw, one shelf. You make
those pieces. **Parts, never finished scenes**: a piece is one thing that a designer places, sizes, colours and combines; it is
never a whole background. Every piece must look different with another `seed` (another mango tree, not a copy), so a film never
repeats itself.

## The look

- **Flat colour shapes, no outlines.** Shape is made by fills: a body colour, one darker side or under-shade, one lighter top
  edge. Light always comes from the **top left**.
- **Simple, rounded, friendly**: big readable shapes, few small details (a few windows, a few leaves, a crease). A phone screen
  shows the piece small, so it must read at 1/4 size.
- **Warm, soft colours**: earthy walls, leafy greens, warm wood, sky blues; never neon, never glossy, never gradients except a sky.
- **Real places**: Bangladeshi things look like Bangladesh (a tin-roof house, a tubewell, a CNG auto-rickshaw in green, a tea stall
  with glass jars and a kettle), global things look generic and current.
- **No text** unless the piece takes a `text` option (signs). Bangla text uses the font `'Hind Siliguri', sans-serif`.

## The format (one piece per file: `set/<camelCaseId>.js`)

```js
// A one-line comment: what it is.
ZS.define("tubewell", { about: "a green hand-pump tubewell on a small concrete base", kind: "set", tags: ["village", "bangladesh", "water"], aliases: ["chapakol", "hand pump", "টিউবওয়েল", "চাপকল"] },
  (layer, o, k) => {
    const { x = 0, y = 0, h = 200, seed = 1, color = "#3f8f5a", flip } = o;
    const g = k.group(layer, x, y, flip), r = k.rngOf(seed);   // g's 0,0 = the ground under the piece's middle
    k.ground(g, h * 0.6);                                       // the soft contact shadow
    // ... draw with k.R (rect), k.C (circle), k.E (ellipse), k.P (path d) or k.el(tag, attrs, parent)
    return g;                                                   // always return the group
  });
```
- **The anchor**: `x, y` is the point **on the ground under the middle** of the piece; it is drawn upward (negative y) from
  there. `h` is its height in pixels. Width follows from `h` (and the seed). Hanging things (a ceiling fan, a lamp) anchor at
  the ceiling point and are drawn downward: say so in `about`.
- **Options every piece takes**: `x, y, h, seed, color, flip`. Add the piece's own (`color2`, `roof`, `lit` for lit windows at
  night, `open` for a door, `text` for a sign, `full` for a full or empty basket). Defaults must look good on their own.
- **The helpers in `k`** (their full code is in the appendix): `k.el(tag, attrs, parent)`, `k.R(parent, x, y, w, h, fill, rx)`,
  `k.C(parent, cx, cy, r, fill, opacity)`, `k.E(parent, cx, cy, rx, ry, fill, opacity)`, `k.P(parent, d, fill, opacity)`,
  `k.group(layer, x, y, flip)`, `k.ground(g, width)`, `k.rngOf(seed)` (a random function from the seed),
  `k.dark(c, amount)`, `k.light(c, amount)`, `k.mix(a, b, u)`, `k.pick(r, list)`, `k.WALLS`, `k.CLOTHS` (ready colour lists).
- **The same picture every time**: everything comes from the options and `k.rngOf(seed)`. Never `Math.random`, `Date`, timers
  or anything loaded from outside (no images, no fonts besides the one above, no fetch).
- **Things that move** (leaves, steam, a fan, water, smoke, a flag, a rickshaw's wheels) put a `tick` on the group: `g.tick =
  (t) => { ... }` where `t` is seconds. It sets attributes from `t` only (the same `t` always gives the same picture), gently.
- **Size**: keep a piece under about 120 lines and 200 shapes. A far piece (a skyline, a hill row) is simpler than a near one.

## What we need (by priority; ids are camelCase)

**Nature** (`tags: ["nature"]`)
- P1: `mangoTree`, `banyanTree` (wide, with hanging roots), `bambooClump`, `bananaPlant`, `coconutPalm` (taller, more
  leaning than the existing `palm`), `krishnachura` (flame tree in red bloom), `grassTuft`, `flowerBed` (option `kind`:
  marigold, rose, shapla water lily), `paddyField` (rows of green rice; option `ripe` for golden; drawn as a wide strip, `w`
  option), `mustardField` (yellow strip), `pond` (water with a bank; option `ghat` for brick steps; a `tick` for ripples),
  `river` (a wide band with soft waves, `tick`), `rock`, `bushRow`
- P2: `teaGardenRows` (Sylhet hills of tea bushes), `hillRange` (far, layered), `mountainRange` (far, snow option),
  `seaWaves` (a beach edge, `tick`), `sandDune`, `pineTree`, `cactus`, `jackfruitTree`, `logPile`, `mudPath`, `waterfall`
- P3: `rainfall` (streaks over an area, `tick`), `fog`, `stars` (a field of stars, twinkle `tick`), `rainbow`, `lightning`

**Village Bangladesh** (`tags: ["village", "bangladesh"]`)
- P1: `tinHouse` (tin roof and walls, a door, a window; `color` for paint), `mudHouse` (mud walls, a thatched roof),
  `tubewell`, `chula` (a clay stove with a pot, smoke `tick`), `clothesLine` (laundry on a line between two poles, a gentle
  sway `tick`), `boat` (a wooden nouka, with or without a sail; floats, `tick`), `villageMosque` (small, white, one dome),
  `kutchaRoad` (an earth road strip, ruts), `bambooBridge` (a sanko over a canal), `strawStack` (see the example haystack)
- P2: `teaStall` (counter with glass jars, kettle, a bench; parts, not a scene), `mudirDokan` (a small grocery shop front),
  `rickshawVan`, `bullockCart`, `paddyStack`, `clayPots` (a row of matka and kolshi), `fishTrap`, `schoolTin` (a village school),
  `temple` (a small Hindu temple), `church` (a small one), `bazaarShed` (a village market roof on posts)

**City Bangladesh and global city** (`tags: ["city"]`)
- P1: `cngAuto` (the green CNG auto-rickshaw; wheels `tick` option `moving`), `localBus` (colourful, dented, people's heads
  in the windows as simple shapes), `truck` (painted Bangladeshi truck), `motorbike`, `bicycle`, `footBridge` (an overpass
  over a road), `trafficLight` (option `light`: red, yellow, green), `roadDivider` (with small plants), `billboard`
  (option `text`, blank by default), `teaCart`, `apartmentRow` (far: a strip of Dhaka apartments with water tanks and
  balconies, more varied than `building`), `mosqueMinaret`
- P2: `skyscraper` (glass and concrete, global), `trainCoach` + `railTrack`, `launch` (a river ferry), `cityPark`
  (a park bench row, a lamp, a fountain: parts), `shoppingMall` (front), `hospitalFront`, `schoolFront` (gate, a flag pole
  with the Bangladesh flag option), `busStop`, `zebraCrossing`, `streetVendor` (a fruit van)
- P1 (emergency and service vehicles): `ambulance` (white with a red cross and a light bar, `tick` for the flashing light,
  option `moving`), `policeCar`, `fireTruck`, `microbus` (the white Bangladeshi microbus), `pickupVan`, `leguna` (the small
  human-hauler), `privateCar` (sedan, hatchback or SUV by `kind`; the existing `car` stays for the far road)
- P1 (institutions and buildings, fronts only): `collegeFront` (a gate with a name board, a building behind), `universityCampus`
  (a big academic building, steps, trees; option `text`), `officeTower` (glass and concrete, global), `bankFront`,
  `policeStation`, `garmentFactory` (the long Bangladeshi factory building, workers' gate), `marketStreet` (a row of small shop
  fronts with signs, `text` per sign), `footpath` (a sidewalk strip with a kerb), `petrolPump`
- P2: `railStation` (a platform with a roof), `busTerminal`, `mangroveForest` (the Sundarbans: roots in water, far and near
  options), `shrine` (a domed mazar), `courtFront`, `hotelFront`, `cinemaHall`, `constructionSite` (bamboo scaffolding, bricks)
- P3: `airportFront`, `plane` (in the sky), `stadium` (far), `bridge` (a big river bridge, far), `tower` (a TV tower), `helicopter`, `ship`

**Rooms, in parts** (`tags: ["inside"]`; the room's walls and floor come from the existing `wall` and `floor`)
- P1: `ceilingFan` (anchored at the ceiling; turning blades `tick`, option `on`), `almirah` (a steel wardrobe), `mosquitoNet`
  (hung over the existing `bed`), `blackboard` (option `text`), `schoolDesk` (a bench-desk for two pupils), `teacherTable`,
  `window` (on a wall: grills, curtains, day or night outside, option `open`), `door` (option `open`), `tvStand` (a TV on a
  stand; the screen shows a colour, option `on`), `kitchenShelf` (pots and pans), `gasStove` (two burners, a pot, flame `tick`),
  `fridge`, `diningTable` (with chairs), `prayerMat` (on the floor), `wallClock` (hands from `t`)
- P2: `officeDesk` (computer, papers), `computerScreen`, `hospitalBed` + `dripStand`, `classroomShelf`, `wallCalendar`,
  `mirror`, `showcase` (glass cabinet with plates), `pressureCooker`, `splitAC` (an air conditioner on the wall, option `on` with a
  soft breeze `tick`), `tubeLight` (option `on`, a soft glow), `ceilingLamp`, `curtains` (option `open`, a gentle sway `tick`),
  `kitchenSink`, `waterFilter`, `washingMachine`, `wallSwitchboard`, `photoFrame` (a blank or coloured picture), `bookshelf`, `rackOfClothes` (a shop rack), `shopCounter`
  (with a scale `daripalla`), `fruitPile` (option `kind`: mango, banana, jackfruit, litchi), `vegetableBasket`, `fishTray`, `riceSacks`
- P3: `bookshelfFull`, `aquarium`, `bathroomTap`, `staircase` (inside), `lift` (elevator doors)

## Quality bar

- Looks like the examples in the appendix when they stand side by side: same light, same softness, same detail level.
- Each seed gives a really different but believable variant (shape, proportion, small details, colour inside its family).
- Night works: a piece with windows takes `lit`, and its colours still read on a dark blue sky.
- Bangladeshi things are accurate (look at real photos): the CNG's shape and green, the tin house's corrugated roof, the
  tubewell's handle, the rickshaw van's flat bed.

## How to deliver

One folder `set/`, one file per piece named by its id, P1 first. Check each one in `preview.html` (three seeds, day and
night, the moving ones moving), and add a `NOTES.md` with anything you skipped or are unsure of. Zancut then checks it again
in its real pages (`node scripts/library-check.mjs <folder>`): it must parse, draw from the seed only, and look right on
the board of every piece.


---

## Appendix A: the helpers every piece receives as `k` (exact code)
```js
// el(tag, attrs, parent) makes an SVG element: document.createElementNS("http://www.w3.org/2000/svg", tag) with the attributes, appended to parent
const rngOf = (seed = 1) => { let s = (Math.abs(Math.round(seed * 7919)) % 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };
const hex = (c) => { const m = String(c).replace("#", ""); const f = m.length === 3 ? m.split("").map((x) => x + x).join("") : m; return [0, 2, 4].map((i) => parseInt(f.slice(i, i + 2), 16)); };
const mix = (a, b, u) => { const A = hex(a), B = hex(b); return `#${A.map((v, i) => Math.round(v + (B[i] - v) * u).toString(16).padStart(2, "0")).join("")}`; };
const dark = (c, u = 0.14) => mix(c, "#1c1420", u), light = (c, u = 0.14) => mix(c, "#fff6e6", u);
const pick = (r, list) => list[Math.floor(r() * list.length) % list.length];
const R = (p, x, y, w, h, fill, rx = 0) => el("rect", { x, y, width: Math.max(0, w), height: Math.max(0, h), fill, rx }, p);
const C = (p, cx, cy, r, fill, o = 1) => el("circle", { cx, cy, r, fill, opacity: o }, p);
const E = (p, cx, cy, rx, ry, fill, o = 1) => el("ellipse", { cx, cy, rx, ry, fill, opacity: o }, p);
const P = (p, d, fill, o = 1) => el("path", { d, fill, opacity: o }, p);
const group = (layer, x, y, flip) => el("g", { transform: `translate(${x} ${y})${flip ? " scale(-1 1)" : ""}` }, layer);
const ground = (g, w, h = w * 0.07) => E(g, 0, 0, w * 0.55, h, "#1c1420", 0.16);
const WALLS = ["#d98f6a", "#c9a27a", "#e0b98c", "#b98a78", "#a9b3a0", "#d6a95f", "#c97f5e", "#9fb2b8"];
const CLOTHS = ["#d8452f", "#2d7f8c", "#e0a02c", "#5a8f3c", "#7a4fa3", "#2f6fb0"];
// k = { el, rngOf, hex, mix, dark, light, pick, R, C, E, P, group, ground, WALLS, CLOTHS }
```

## Appendix B: a complete still piece
```js
// A village haystack (khor-er gada) round a bamboo pole: a set piece. x, y = the ground under its middle; h = its height in px.
// Everything comes from the options and the seed (never Math.random); flat fills, light from the top left, no outlines.
ZS.define("haystack", { about: "a rounded village haystack on a bamboo pole", kind: "set", tags: ["village", "bangladesh", "field"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 220, seed = 1, color = "#d8b25a", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed), w = h * (0.9 + r() * 0.25);
  k.ground(g, w * 1.1);
  k.R(g, -h * 0.02, -h * 1.12, h * 0.04, h * 0.3, "#7a5a36");                       // the pole's top above the straw
  k.P(g, `M${-w / 2} 0 C${-w * 0.52} ${-h * 0.55} ${-w * 0.2} ${-h} 0 ${-h * 0.98} C${w * 0.2} ${-h} ${w * 0.52} ${-h * 0.55} ${w / 2} 0Z`, color);
  k.P(g, `M${w * 0.08} ${-h * 0.96} C${w * 0.3} ${-h * 0.88} ${w * 0.5} ${-h * 0.5} ${w / 2} 0 L${w * 0.12} 0 C${w * 0.22} ${-h * 0.4} ${w * 0.2} ${-h * 0.75} ${w * 0.08} ${-h * 0.96}Z`, k.dark(color, 0.16));
  for (let i = 0; i < 7; i++) { const a = -w * 0.36 + r() * w * 0.6, b = -h * (0.15 + r() * 0.7); k.R(g, a, b, w * (0.1 + r() * 0.12), h * 0.012, k.light(color, 0.22), 2); }
  return g;
});
```

## Appendix C: a complete piece that moves (`g.tick`)
```js
// A flag on a pole that waves: an example of a piece that MOVES (g.tick). x, y = the ground under the pole; h = the pole's height.
ZS.define("flag", { about: "a flag on a thin pole, waving gently; Bangladesh by default", kind: "set", tags: ["city", "school", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 320, seed = 1, color = "#1f7a4d", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed), w = h * 0.42, fh = w * 0.6, phase = r() * 6;
  k.ground(g, h * 0.12);
  k.R(g, -h * 0.012, -h, h * 0.024, h, "#8d8a84");
  const cloth = k.el("g", {}, g), body = k.P(cloth, "", color), sun = k.C(cloth, 0, 0, fh * 0.2, color2);
  // the same t always draws the same wave: every value below comes from t and the seed only
  g.tick = (t) => {
    const a = Math.sin(t * 2.2 + phase) * fh * 0.08, b = Math.sin(t * 2.2 + phase + 1.6) * fh * 0.1;
    body.setAttribute("d", `M0 ${-h} C${w * 0.35} ${-h + a} ${w * 0.65} ${-h - a} ${w} ${-h + b} L${w} ${-h + fh + b} C${w * 0.65} ${-h + fh - a} ${w * 0.35} ${-h + fh + a} 0 ${-h + fh}Z`);
    sun.setAttribute("cx", w * 0.45); sun.setAttribute("cy", -h + fh / 2 + a * 0.3);
  };
  g.tick(0);
  return g;
});
```
