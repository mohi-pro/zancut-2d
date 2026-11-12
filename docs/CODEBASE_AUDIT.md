# Step 1 — Codebase cleanup and modular audit

Completed 8 November 2026. Scope: remove Studio-only runtime dependencies and misleading workflow documents, preserve local behavior, verify imports and tests. No new animation, B-roll or brain features were added. Zancut Studio itself was not modified.

## Findings and boundary

The copied files could not safely be deleted just by name. `index.mjs` loaded the whole accounts/payment graph to get one local owner. The active queue imported the blocked AI editor and CTO/billing graph. Transcript and board helpers imported `gemini.mjs` for two ordinary sound-measurement functions. The scene-file compiler imported a director module that also loaded stock search, screen matching and pricing.

Cloud Gemini calls had their own environment switches; they were not all protected by `no-ai.mjs`. Removing those adapters eliminates that dormant route. No opt-in flag was added. `server/no-ai.mjs` is byte-for-byte unchanged and intentionally retained as the guard.

## Removed from the active tree, safely archived

All originals are preserved in [before-cleanup.tar.gz](../archives/studio-cleanup-2026-11-08/before-cleanup.tar.gz). Full file hashes: [removed-files.json](../archives/studio-cleanup-2026-11-08/removed-files.json).

| Category | Archived server files |
|---|---|
| Model clients, AI editor and voice/planning orchestration | `claude.mjs`, `claude-auth.mjs`, `codex-query.mjs`, `gemini.mjs`, `editor.mjs`, `animation.mjs`, `animpipe.mjs`, `prompts.mjs` |
| Accounts, billing, desktop and installation | `users.mjs`, `pricing.mjs`, `admin.mjs`, `desktop-client.mjs`, `routes-desktop.mjs`, `first-run.mjs`, `voice-setup.mjs` |
| CTO, reports and AI learning/style/title helpers | `cto.mjs`, `cto-windows.mjs`, `reports.mjs`, `learn.mjs`, `style.mjs`, `naming.mjs` |
| Studio media services and demos | `library.mjs`, `stock.mjs`, `screensync.mjs`, `clipsync.mjs`, `aftercheck.mjs`, `demo.mjs` |

**27 server files archived.** Four obsolete Studio workflow tests were also archived with their removed subjects: `animation-direction-test.mjs`, `check-prompts.mjs`, `continuity-test.mjs`, `voice-take-test.mjs`. They tested the retired AI production-script/editor/voice interfaces. Existing Chrome engine tests still cover anatomy, acting, hands, named shots, OTS, lip-sync and screen helpers. Required local tests were retained; prompt/guidance checks in film-kit/parts tests now import the extracted pure guidance module.

Historical Studio workflow documents were removed from the current `docs/` tree and retained in the snapshot: `2D-ANIMATION-PLAN.md`, `2D-WORLD-PLAN.md`, `ANIMATION-AUTHORED-SHOTS.md`, `STUDIO_SYNC.md`, `studio-sync-manifest.json`. Their engine/library updates remain installed. Asset briefs and the anatomy/design contracts remain reference material; they are not model instructions executed by the local pipeline.

## Retained and separated

| Module(s) | Current responsibility |
|---|---|
| `index.mjs`, `local-owner.mjs` | Local API and stable owner identity. Existing owner id and `users.json` contents are preserved; no sign-in/payment code loads. |
| `agent.mjs` | Only prepare, scene-file storyboard, render and cancellation; local sound checks, version exports and thumbnails retained. |
| `brain.mjs`, `brainplan.mjs`, `scriptplan.mjs` | Existing own-brain inference/training and rules fallback, unchanged. |
| `qa.mjs`, `codefilm.mjs`, `autopilot.mjs` | Existing checks/repairs, scene-file compiler and inbox/outbox worker, unchanged. |
| `director.mjs` | Deterministic storyboard normalization, scene-file validation/IO and engine plan assembly, mechanically retained. Cloud stock/screen-matching branches removed; unsupported Studio rows fail explicitly. |
| `audio-analysis.mjs`, `transcribe.mjs` | Sound-level/speech-gap functions extracted unchanged; existing local listening, repair and alignment retained. No cloud fallback. |
| `board.mjs`, `preview.mjs`, `media.mjs`, `videoqa.mjs` | Local transcript/trim/media helpers, stills, metadata, sound measurements and finished-video QA. Legacy cache fields remain readable. |
| `studio.mjs`, `colors.mjs`, `config.mjs` | Pure render/settings metadata, colour tokens and local paths. No account/CLI login probes, cloud settings, credential mutation or voice-generation menu. Default port 4500. |
| `store.mjs`, `parts.mjs`, `filmkit.mjs` | Project files, local library search, catalog and reusable kit helpers. |
| `animation-guidance.mjs`, `joins.mjs` | Pure authoring text/metadata and local visual comparison used by regression tools; outside the app runtime. |
| `no-ai.mjs` | Unchanged policy guard, independently tested; outside the app's now model-free runtime graph. |

There are **25 server modules, 22 reachable from `index.mjs`, zero broken static imports**. All 24 non-entry modules were also dynamically imported successfully. The entry was tested by launching an isolated app. Server source shrank from 10,235 to approximately 3,300 lines. Unused direct dependencies `nodemailer` and `zod` were removed from the package and lockfile.

The engine, brain/training data, example assets and seven protected core server files were checked against **961 pre-cleanup SHA-256 values**. No animation/brain logic changed. The integration fixture uses temporary project data and cached transcript words; no speech model runs and no training/feedback is written.

## Verification

| Command | Result |
|---|---|
| `npm test` | Passed before and after cleanup: 300 script syntax cases, QA, film-kit, parts and cartoon suites. |
| `node scripts/cartoon-test.mjs` (inside `npm test`) | Passed: 14 body-chart rows × 3 builds, 150 real frames through the body gate and invalid-body checks. |
| `node scripts/film-kit-test.mjs` (inside `npm test`) | Passed: real Chrome set pieces/actions, handovers, rig/face, named shots, OTS, lip-sync and screen checks. |
| `node scripts/parts-test.mjs` (inside `npm test`) | Passed: 60/60 first answers; 110/110 searches found in the top three. |
| `node scripts/qa-test.mjs` (inside `npm test`) | Passed: three seeded defects found, three repaired, zero remaining. |
| `node scripts/codefilm-test.mjs` | Passed: existing scene-file route composed, body gate clean, stills produced. A failed gate now causes a nonzero test exit. |
| `node scripts/world-test.mjs` | Passed: all ten size/depth/contact checks. |
| `node scripts/cleanup-test.mjs` | Passed: imports/guard, owner-id preservation, audio measurements, prepare → storyboard → real 6.00-second MP4, video QA, $0 model cost, app startup and library/project endpoints. HyperFrames ran with npm offline mode. |

All **eight active `scripts/*test.mjs`** are covered by `npm run test:all`. `npm run test:studio-sync` is a compatibility alias for that local suite. The four archived Studio tests are not included or presented as passing active tests.

Step 2 subsequently added `rig-motion-test.mjs`, bringing the active suite to nine scripts, and authorized changes to engine/codefilm/gesture-cache files. The Step 1 hashes remain historical evidence; the cleanup regression continues to protect the other 31 brain/planner/guard files. See [GESTURE_MOTION_AUDIT.md](GESTURE_MOTION_AUDIT.md).

This completes cleanup only. Node, Chrome, ffmpeg, HyperFrames and the existing local speech tools remain installation prerequisites; packaging them for a fresh offline machine and adding auto B-roll/graphics are later work.
