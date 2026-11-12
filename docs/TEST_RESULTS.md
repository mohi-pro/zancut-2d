# Step 12 — end-to-end benchmark (2026-11-09)
`node scripts/final-benchmark.mjs data/qa/step12` → videos, strips, results.json, before-after.md in data/qa/step12/. Own data store; nothing retrained; originals untouched.

| film | format | length | words | shots | nearly still (old → new) | b-roll | charts | graphics | headlines | camera moves | gate frames / faults | video QA | time |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Owner's Bangla voice | 16:9 | 93.65 s | cached local transcript of this same voice | 25 | 45.24% → 0% | 1 | 1 | 2 | 25 | 2 | 2841 / 0 | pass | 168 s |
| Sports day 9:16 (English voice) | 9:16 | 23.29 s | cached local transcript of this same voice | 8 | 87.65% → 0% | 3 | 0 | 0 | 8 | 0 | 723 / 0 | pass | 58 s |
| v2.mp4 sound (Bangla, 9:16) | 9:16 | 132.8 s | transcribed now (local speech-to-text) | 34 | 0% → 0% | 1 | 0 | 1 | 32 | 5 | 4005 / 0 | pass | 648 s |
| New story: creature + numbers + unseen words | 16:9 | 33 s | from the script text (no voice) | 10 | —% → 0% | 1 | 1 | 3 | 8 | 7 | 1020 / 0 | pass | 79 s |

BEFORE vs AFTER (measured now; "before" = the old MP4s and docs/MODEL_EVAL.md's Step 7 column)
| metric | before | after |
| --- | --- | --- |
| near-still share — Owner's Bangla voice (93.65 s) | 45.24% | 0% (<8% ✓) |
| near-still share — Sports day 9:16 (English voice) (23.29 s) | 87.65% | 0% (<8% ✓) |
| near-still share — v2.mp4 sound (Bangla, 9:16) (132.8 s) | 0% | 0% (<8% ✓) |
| near-still share — New story: creature + numbers + unseen words (33 s) | — (new) | 0% (<8% ✓) |
| auto b-roll cards | none (no b-roll kit) | 6 on 77 shots |
| charts (dynamic comparison) | none | 2 |
| shots with motion graphics | none | 6 |
| headline captions | none | 73 |
| camera moves | none | 14 |
| procedural creatures in a cast | none | 1 |
| QA repairs / errors left | 3-rule QA | 6 / 0 |
| physics corrections | — | 1 |
| body + physics gate | — | 4/4 films, 8589 frames, 0 faults |
| video QA | — | 4/4 pass |
| brain place — holdout-200 (independent) | 61.0% (Step 7) | 78.5% |
| brain action — holdout-200 (independent) | 57.0% (Step 7) | 61.0% |
| brain face — holdout-200 (independent) | 47.0% (Step 7) | 52.0% |
| brain broll — holdout-200 (independent) | 55.5% (Step 7) | 64.5% |
| brain graphic — holdout-200 (independent) | 78.0% (Step 7) | 84.0% |
| brain cameraMove — holdout-200 (independent) | 70.5% (Step 7) | 79.0% |
| brain roles F1 — holdout-200 | 90.9% (Step 7) | 91.9% |
| brain place — owner's real-34 | — | 76.5% |
| brain action — owner's real-34 | — | 76.5% (v1's 8: 85.3%) |
| brain face — owner's real-34 | — | 91.2% |
| brain roles F1 — owner's real-34 | — | 95.5% |
| brain broll / graphic / camera — real-34 | — | not labelled in real-test.jsonl |
| AES-256-GCM vault + owner hub tests | none | PASS (4 checks) |
| studio UI test | — | PASS (7 checks) |
| server/no-ai.mjs unchanged |  | yes |

**Honest notes**
- **Old 45 % → 0 %:** this is your 94.6 s film, measured the same way as Step 2 (5.29 % then). v2.mp4 was made outside this app and was already 0 % still, so it shows no improvement; it proves the voice → MP4 run on a new voice (local Whisper: 350 words, confidence 0.76, one looped phrase re-heard).
- **B-roll and charts are rare on the real voices** (1–3 b-roll, ≤1 chart per film): they appear only where the words call for them. Fixed during this step: a village was read as a trip (map b-roll), the brain's b-roll guess was used without the words backing it, establishing shots got a b-roll, 9:16 headlines overflowed, the ring and chart could be cut before they finished, and 9:16 mediumWide frames broke the body gate (C5).
- **Brain, all 7 heads:** real-test.jsonl labels only place, action, face and roles; broll/graphic/camera are measured on holdout-200. These are the DEPLOYED model's numbers (seed + feedback). docs/MODEL_EVAL.md measures a train-split model, so its real-34 action (82.4 %) differs from 76.5 % here.
- **Unseen words:** the story's web learning found রাক্ষস and a wrong stem "হাজি" (from হাজির); not ড্রোন / সৌর প্যানেল. Open gap.
- **The new story has no voice** (no speech synthesis allowed): a quiet room-tone track, words timed from the text.

## Earlier

# Step 2 verification (2026-11-08)

- `npm run test:all`: all **nine** active test scripts passed, including all requested cartoon/parts/film-kit/QA/codefilm checks.
- Gesture sweep: **65/65** pass at 30 fps in both full-body and waist-up rigs, four profiles, **23,400 frames / 93,600 character frames**.
- Numeric gesture/micro-motion regression: **124,800 frames**, normal and half-second durations, both mirror states; root/feet/ROM/entry/exit checks pass. Maximum displacement **36.50 U/frame**, below the unchanged production 40 U limit.
- Browser regression: pelvis/heels/toes stay fixed on screen; reverse seeks reproduce identical frame geometry. Intentionally broken bodies still fail.
- Parts: **60/60** first answers and **110/110** top-three matches. Syntax: **300** scripts compile. QA: three defects found and repaired, zero remaining.
- Owner's **94.60 s** benchmark rerender: **45.24% → 5.29%** nearly static with the same reference-study settings; video QA passes at 1920×1080/30 fps with audio.
- Brain/planner/guard integrity and isolated local render/API checks pass. Details and evidence: [GESTURE_MOTION_AUDIT.md](GESTURE_MOTION_AUDIT.md).

## Previous Step 1 cleanup verification (2026-11-08)

- `npm test`: passed before and after cleanup. Includes cartoon (150 real frames), film-kit, parts (60/60 first answers; 110/110 top-three matches), QA (3 found/3 repaired/0 remaining) and 300 generated-script syntax cases.
- `node scripts/codefilm-test.mjs`: body gate passed; stills produced in the OS temp directory. Gate failures now fail the process.
- `node scripts/world-test.mjs`: all ten scale/contact/depth checks passed.
- `node scripts/cleanup-test.mjs`: 24 server modules import, no-AI guard blocks queries, 961 protected hashes unchanged, stable local owner, sound analysis, real prepare/storyboard/render queue → 6.00 s MP4, video QA passed, model cost $0; isolated app/library/project API smoke check passed. Uses temporary data, cached transcript words and npm offline mode.
- All eight active test scripts: `npm run test:all`. The four archived Studio-only tests are historical, not active successes.
- Source inventory, archive and limits: [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md).

## Previous measured results

# TEST RESULTS (2026-11-06) — all run on this Mac
- `node scripts/cartoon-test.mjs` → "cartoon test passed" (engine, 150 real frames through the body gate).
- `node scripts/film-kit-test.mjs`, `node scripts/parts-test.mjs` → ok.
- `node scripts/codefilm-test.mjs` → body gate ok; stills in examples/out/shot*.jpg.
- Render: `examples/out/rafi-no-ai.mp4` (voice + scene file, 1920×1080, 30 fps, 9.3 s). Contact strip: examples/out/render-strip.jpg.
- Render: `examples/out/bangla-plan-test.mp4` — Bangla script → rules planner → render. Known weakness: Bangla names are not recognised, hero became a generic boy.
- `node scripts/qa-test.mjs` → 3 seeded defects found (out-of-frame x=-6.5 at 2.5 s, overlap 0.2 m at 5.5 s, 0.2 s shot at 9.8 s), 3 repaired, 0 remaining; before/after pictures docs/evidence/qa/before-after.jpg.
- NOT measured yet: render time per 10 s, peak memory, 720p timing, LLM benchmark (no LLM installed).
