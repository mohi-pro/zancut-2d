# Notes and verification

## Coverage

No explicitly requested ID was skipped: all 150 are included, plus 35 additions. The 185 IDs are unique. The additions extend this Places pack; they do not replace the People, Animals or Handheld Props jobs.

The existing `wall`, `floor`, `bed`, `palm`, `building` and `car` assets mentioned in the brief were not supplied and are not overwritten. A composed film still needs those existing base pieces, people, animals, foreground props, cameras and shot timing from the other systems.

## Validation performed

- 185 files registered against the exact helper implementation supplied in the original preview.
- 1,337 draw and option cases passed: three seeds in day/night settings, relevant options, primary colour overrides and flipping.
- Draw output repeats exactly with the same inputs. `tick(2)`, `tick(7)`, `tick(2)` repeats the same SVG state. `tick(0)` restores the initial state.
- No NaN/Infinity/undefined values found in tested output. No random/time/network APIs are used by asset files.
- Maximum 198 SVG nodes per tested piece, including grouping nodes; each file is under 120 lines.
- Every default piece was rasterized with an SVG renderer and reviewed on category boards. Visual corrections included the banana silhouette, tin roof corrugation, basket edge and ceiling-fan anchor.
- Preview initialization, all 185 three-seed inspectors, extra filtering, search, night toggle, pagination and scrubbing passed a lightweight DOM harness.

## Remaining verification

The real Zancut repository, `scripts/library-check.mjs`, and production composition pages were not supplied. Their checks have not been run. A full browser layout/playback test could not be completed in this execution environment; the preview logic was tested in the DOM harness and the SVG artwork was rendered separately. Open the preview in Chrome, Safari or Firefox for the final interactive review, then run the real host checker before importing into production.

## Design choices

- Flat SVG fills, restrained warm colours, no outline strokes, no gradients, embedded pictures or remote requests.
- Seeds change proportions and palette within a family; nature and repetitive structures also vary their individual details. Some manufactured pieces intentionally retain a consistent design across seeds.
- Motion is gentle and based on absolute seconds. Source files use no timers. The preview owns its animation loop.
- Vehicle wheels animate only with `moving: true`; vehicles do not travel by themselves. Emergency beacons flash even when parked.
- Buildings expose `lit`; night mode lights their windows without applying a global colour filter. `window.lit` means a night exterior, rather than a glowing building window.
- Typography is blank by default and uses the requested Hind Siliguri family with sans-serif fallback; no font is downloaded. Install or supply that font in the host for Bangla text.
- Related fronts and furniture share a consistent visual family. They are simplified film set pieces, not architecturally measured or photorealistic illustrations.
- Weather pieces are overlays; lightning is intentionally intermittent and can appear blank at some timeline positions. Stars and fog are deliberately subtle in daylight.
- `cityPark` is an option-selected part, not a complete composed background. The bullock cart does not include an animal. Shelves include simplified contents as requested by the brief.

## Reference inspection

Bangladesh-specific forms were informed by the reference images listed in `REFERENCES.md`. No reference image is embedded, copied into the delivery, or fetched at runtime.
