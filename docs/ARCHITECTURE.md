# ARCHITECTURE
```
Browser editor (ui/index.html · 127.0.0.1:4500): Story · Storyboard cards · Library · Render · Advanced JSON · undo/redo
  └─ Node/Express API (server/index.mjs) — project JSON + scene-file revisions in data/projects
       ├─ brain.mjs / brainplan.mjs   OUR OWN model, trained from scratch (no pretrained model): sentence → place, action, face, who
       ├─ scriptplan.mjs              geometry + timing, rules fallback, cast roles
       ├─ qa.mjs                      scene checks + bounded, rolled-back repairs
       ├─ codefilm.mjs                scene file → shots → engine scene scripts (closed DSL, allowlisted fields)
       ├─ preview.mjs                 one-shot still from the real engine
       ├─ agent.mjs                   local prepare/storyboard/render queue; no AI editor or billing dependencies
       ├─ audio-analysis.mjs          local sound levels and speech-gap measurements
       ├─ local-owner.mjs             stable local owner id, no account/payment service
       ├─ videoqa.mjs                 checks on the finished MP4 (size, fps, length, audio, black/static)
       └─ engine/ (cartoon + compose) → body gate → Chrome frames → ffmpeg → MP4
```
**No AI model of any kind** is used to make animation: `server/no-ai.mjs` blocks any call; the Claude SDK is uninstalled; Ollama and Qwen were tried and removed (DECISIONS). The "intelligence" is the brain trained on our own data plus deterministic rules.
**Learning loop:** the owner edits a shot → "Make" (or "Teach the brain") stores only the corrected shots (sentence → place/action/face) in `data/brain/feedback.jsonl` → retrain (seconds) → measured by `scripts/brain-train.mjs` (docs/MODEL_EVAL.md). Roles are never learned from storyboards (see DECISIONS).
**Frames:** 16:9, 9:16, 1:1, 4:5. Positions are written for 16:9 and squeezed by the frame's aspect at render time. **Bind:** 127.0.0.1, no auth (single local user).

**Cleanup boundary (2026-11-08):** 27 Studio-only modules are compressed in `archives/studio-cleanup-2026-11-08/`, with no runtime imports into that archive. `director.mjs` retains deterministic scene assembly; `animation-guidance.mjs` retains pure authoring metadata for regression tools. `transcribe.mjs` has only its existing local listening path. Every active test: `npm run test:all`. Module inventory and measured results: [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md).
