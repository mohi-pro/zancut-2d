# Local 2D library: formats, validation and use

These briefs document the formats of the existing asset library. Their historical references to outside designers describe how assets were originally delivered, not the current application's runtime. Zancut 2D uses its own brain and deterministic code; it does not call a model to create assets or animation.

| Reference | Library data |
|---|---|
| 01 people motion | Actions, gestures and hand shapes |
| 02 places / 03 animals / 04 props | Reusable drawing parts, animals and carried objects |
| 05 world sizes | Metres and contact points (`sizes.json`) |
| 06 body proportions | Body chart and profiles |
| 07 acting cards | Feeling/timing cards (`acting.json`) |
| 08 natural motion | Additional actions and contacts |
| 09 camera shots | Shot sizes, moves and checks (`camera.json`) |

For a new owner-provided asset delivery:

1. Place its `actions/`, `gestures/`, `hands/`, `set/` and/or `props/` folders in a separate working directory.
2. Run `node scripts/library-check.mjs <folder>` for numeric checks, real Chrome body checks and a preview board.
3. Inspect the actual board before adopting the assets.
4. Copy validated parts into `engine/cartoon/library/`, then run `node scripts/build-library.mjs`.
5. Run `node scripts/cartoon-test.mjs`, `node scripts/film-kit-test.mjs` and `node scripts/parts-test.mjs`.

Existing built-in names must not be overwritten accidentally. Keep generic source/format notes in `engine/cartoon/library/notes/`; generated preview boards and temporary deliveries stay outside the shipped library.

`server/parts.mjs` searches the local library using English/Bangla aliases in `words.json` and each part's metadata. `server/codefilm.mjs` consumes the scene file and uses only known places/actions/cast ids. The own brain supplies its existing labels; a newly imported helper is not automatically new brain behavior.

Clothes, faces and skeletons follow the shared engine's anatomy contract. Step 1 cleanup did not change any library, drawing, animation or brain logic. Current module boundary: [CODEBASE_AUDIT.md](../CODEBASE_AUDIT.md). Old Studio director/editor workflow notes are in the compressed archive, outside active documentation.
