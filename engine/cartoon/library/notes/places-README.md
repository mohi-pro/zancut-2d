# Zancut Places Library

185 independent SVG set pieces: 150 from the supplied brief and 35 additions. All names, documentation and preview controls are in English.

## Open the preview first

Open `Zancut-Places-Preview.html` in a modern browser. It is self-contained and works offline; no file selection or installation is needed.

- Search or filter by category, priority, motion support or **35 additions**.
- Click a card to inspect three seeds, including a flipped variant, and edit piece-specific options.
- Toggle Night / lit, Pause / Play, enable motion options, scrub time, or change the seed.
- The gallery enables `moving` and `on` for demonstration. Turn off that checkbox to see stationary/off versions. The defaults in the actual files remain unchanged.
- All four static category boards are in `contact-sheets/`.

## Delivery format

| File | Purpose |
|---|---|
| `set/<camelCaseId>.js` | One standalone `ZS.define` registration per piece; these are the integration deliverables |
| `Zancut-Places-Preview.html` | Complete offline interactive visual review |
| `original-preview.html` | Your supplied preview, unchanged; select files from `set/` manually |
| `manifest.json` | Priorities, categories, extra flags, anchors and options |
| `COVERAGE.md` | Every required and added ID |
| `ADDITIONS.md` | The 35 extra pieces and the gaps they fill |
| `NOTES.md` | Checks, implementation decisions and outstanding host verification |
| `selfcheck.cjs` | Portable Node validation using the supplied helper contract |
| `contact-sheets/` | Static visual boards, one category per image |

Priorities: 67 P1, 66 P2, 17 P3, 35 extra. 54 files support motion, sometimes gated by `moving` or `on`.

## Integrating

1. Load the P1 files first, then P2 and P3, using `manifest.json` order. The files have no cross-dependencies.
2. Execute each file in the existing environment that provides `ZS.define` and the supplied `k` helper contract. Do not load the preview script into the production application.
3. Draw a piece through the host registry, passing `x`, `y`, `h`, `seed`, `color` and `flip` as needed. Additional options are listed in the manifest.
4. If the returned group has `tick`, call `g.tick(t)` with absolute scene time in seconds. It is safe to scrub backward and repeat a time. Moving wheels do not move a vehicle across the shot; translate the parent group to travel.
5. Run the real project check: `node scripts/library-check.mjs <path-to-delivery-folder>` and review in the production composition board before merging.

Example for a registry matching the supplied preview:

```js
const pump = ZS.tubewell(svgLayer, {x: 400, y: 520, h: 160, seed: 7});
const car = ZS.cngAuto(svgLayer, {x: 600, y: 520, h: 180, seed: 2, moving: true});
if (car.tick) car.tick(sceneTimeSeconds);
```

## Placement and scale

Ground pieces use bottom-centre anchors and draw upward. Wall pieces use the bottom centre of their own bounding area; set `y` to the desired mounting height. Ceiling pieces anchor at the ceiling and draw downward. Weather overlays use bottom-centre area anchors. Aircraft use a bottom-centre local anchor placed in the sky. Small decorative details and shadows may extend beyond nominal `h`; inspect actual SVG bounds when composing.

`h` is a visual scale parameter, not a physical measurement. Width follows the asset and seed. The `w` option is available only where recorded in the manifest, and seed variation also affects horizontal scale. `color` overrides the primary fill; `color2` is supported only by pieces that use it. A parent scene can apply an overall night palette; this pack switches windows through `lit` without recolouring every surface.

`marketStreet.text` accepts a string for all signs or a three-item string array for separate signs. `cityPark.part` selects one independent bench, lamp or fountain, rather than returning a whole park. `bullockCart` contains the cart only: supply the ox from the animals pack. `mosquitoNet` contains no bed.

## Run local checks

```sh
node selfcheck.cjs
```

No npm installation is required for this check. It tests registration, seeded repeatability, finite attributes, time scrubbing, node budget, option variants and flipping. It is a contract test with a lightweight SVG DOM, not the real production renderer.
