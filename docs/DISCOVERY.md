# DISCOVERY (2026-11-06)
**Machine (read-only checks):** macOS 27.0.1, arm64, Apple M4, 10 cores, 16 GB RAM. Memory pressure at start: 32 % free.
**Disk:** 460 GiB drive; was ~21 GiB free at first check, ~83 GiB after the owner cleaned up.
**Tools:** node 24.12, npm 11.6, python 3.9.6, git 2.50, ffmpeg 9.0.2, brew 7.0.12. pnpm not installed; Ollama was installed for a test and removed (DECISIONS).

**Engine (found, not guessed):** `engine/cartoon/` (copied from Zancut Studio, JS): skeleton + body gate (`anatomy.js`, `body.js`, `check-body.mjs`), waist-up rig, hands, camera rules, acting, world scale, set pieces. Render = `engine/compose` (HTML page seeked frame by frame in Chrome) → ffmpeg. Deterministic: scenes use only seek-safe timeline tweens.
**Library (inside `engine/cartoon/library`):** 264 actions, 228 set pieces (places, objects, animals), 178 gestures/props/hand shapes, body chart, camera book, real sizes. All are playable animation data, not just JSON cards.
**Not present:** the separate `zancut-body-engine.js` / `selfcheck.js` packs named in the master prompt. The engine above is what exists; it is used unmodified (adapters only).
**Licensing:** engine and library are the owner's own. Chrome (puppeteer-core) and ffmpeg are external tools; ffmpeg build license not yet reviewed (open item).
**Immutability:** originals live in Zancut Studio (untouched). Zancut 2D is a copy; project data goes to `data/`.
