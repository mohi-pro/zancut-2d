# Brief 4 — Props: the things people hold, carry, give and use

Give this file to the AI that makes the library **together with Brief 2** (`02-places-prompt.md`: the look, the helpers and
the full examples are there) and `docs/2d-library/tools/preview.html` (it marks each prop's grip point with a red cross).

---

## Your job

Props for Zancut's flat 2D cartoon films: a cup of tea, a phone, a report card, an umbrella, a cricket bat, a kolshi. People hold
them, pass them hand to hand and put them down, so a prop is drawn so that a hand can hold it:

```js
ZS.define("teaCup", { about: "a small white tea cup with a saucer, about 8 cm", kind: "prop", grip: "grip", tags: ["food", "tea"] },
  (layer, o, k) => {
    const { h = 60, seed = 1, color = "#fffaf0" } = o;
    const g = k.group(layer, 0, 0);       // 0,0 = THE GRIP POINT: where the fingers close on it
    // draw around the grip point; the cup's handle is at 0,0
    return g;
  });
```
- `kind: "prop"`. The piece is drawn **around its grip point at 0,0**: where the hand holds it (a cup's handle, a bat's handle, a
  card's lower edge, a phone's middle, a bag's handle). Zancut moves it with the hand (`ZC.carry`) and passes it between two
  hands (`ZC.handover`), so a wrong grip point makes it float off the fingers.
- `grip` says which hand shape holds it: `"grip"` (closed around a handle or stick), `"pinch"` (a flat card, sheet or note at its
  edge), `"flat"` (lying on an open palm: a plate, a phone being shown), `"two"` (held with both hands: a box, a tray, a big book;
  give the second grip point as `grip2: [x, y]` in the `about` object).
- `h` is its height in pixels; say its **real size in cm** in `about` so it is sized right against a person. Options: `seed`,
  `color`, and its own (`open` for an umbrella or a book, `full` for a glass or a bag, `on` for a screen, `text` for a sign).
- Same look and rules as Brief 2: flat fills, light from the top left, no outlines, simple and readable at small size, everything
  from the options and the seed, `tick(t)` only for something that moves (steam, a screen glow).
- A prop that is also set on a table or the floor looks right standing on its base: give `base: [x, y]` (the point it stands on)
  in the `about` object.

## What we need (camelCase ids)

- **P1 (food and home)**: `teaCup` (with a saucer), `teaGlass` (the glass of a tea stall, tea in it), `plateOfRice` (rice,
  dal and curry on a steel plate), `waterGlass`, `waterJug` (steel), `kolshi` (the clay or steel water pot carried on the hip:
  `grip: "two"`), `tiffinCarrier` (stacked steel boxes), `fruit` (option `kind`: mango, banana, apple, litchi, jackfruit
  slice, orange), `breadOrRuti`, `kettle` (pouring spout; the existing `kettle` is a set piece, this one is held)
- **P1 (school and work)**: `book` (open or closed), `notebook`, `pen`, `pencil`, `schoolBagHeld` (held by its handle; worn
  bags come from the person's own spec), `examPaper`, `certificate`, `trophy`, `medal` (on a ribbon),
  `laptopHeld`, `clipboard`, `idCard`
- **P1 (everyday)**: `phone` (held, screen `on`), `umbrella` (`open` or closed; the big black Bangladeshi umbrella),
  `shoppingBag` (polythene or jute), `takaNotes` (a few Bangladeshi taka notes, fanned), `coin`, `letter` (an envelope),
  `key`, `walletHeld`, `newspaper`, `handFan` (the woven haat pakha), `walkingStick` (lathi or cane), `giftBox`, `flowerBouquet`
- **P2 (play and sport)**: `football`, `cricketBat`, `cricketBall`, `kite` (ghuri, with its string and reel: `natai`),
  `marbles`, `badmintonRacket`, `toyCar`, `doll`, `balloon` (a string, gentle float `tick`)
- **P2 (work and village)**: `broom` (jharu, short, no handle), `hoe` (kodal), `sickle` (kaste), `fishingRod`, `fishingNet`,
  `bucket`, `basketOnHead` (a load carried on the head: `base` = the head's top), `hammer`, `spade`, `paintBrush`, `toolBox`
- **P2 (care and faith, respectful)**: `medicineStrip`, `thermometer`, `syringe` (a doctor's), `stethoscope` (around a
  neck: anchor = the neck point), `tasbih` (prayer beads), `prayerCap` (held), `lantern` (hariken, glow `tick`), `torch`
- **P3**: `camera`, `microphone`, `guitar`, `harmonium`, `ektara` (the one-string instrument), `placard` (option `text`),
  `flag` (option `country`, default Bangladesh, waving `tick`), `suitcase`, `ticket`, `remote`, `glasses` (held, not worn)

## How to deliver

One folder `props/`, one file per prop named by its id, P1 first; check each in `preview.html` (the red cross must sit
where the fingers hold it). A `NOTES.md` lists what was skipped or is unsure. Zancut checks it again
(`node scripts/library-check.mjs <folder>`) and tries each one in a hand.


---

## Appendix: a complete prop
```js
// A school report card: a prop. Drawn around its grip point (0, 0) = where the fingers hold it (its lower middle edge).
// ZC.prop(layer, (g) => ZS.reportCard(g, { h: 90, color })) then ZC.carry / ZC.handover move it with a hand.
ZS.define("reportCard", { about: "a folded school report card with a coloured band and marks", kind: "prop", tags: ["school", "paper"] }, (layer, o, k) => {
  const { h = 90, color = "#0a92cd", seed = 1 } = o;
  const g = k.group(layer, 0, 0), w = h * 0.72, r = k.rngOf(seed);
  k.R(g, -w / 2, -h, w, h, "#fffaf0", h * 0.04);
  k.R(g, -w / 2, -h, w, h * 0.22, color, h * 0.04);
  for (let i = 0; i < 4; i++) k.R(g, -w * 0.36, -h * (0.66 - i * 0.13), w * (0.4 + r() * 0.3), h * 0.04, "#8b95a0");
  k.C(g, w * 0.24, -h * 0.2, h * 0.11, "#e0a02c");
  return g;
});
```
