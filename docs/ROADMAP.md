# ROADMAP (gate → state)
| Gate | State | Evidence |
|---|---|---|
| 0 Audit | done | DISCOVERY.md |
| 1 True animation | **done** | examples/out/rafi-no-ai.mp4 |
| 2 Editor + assets | **BETA**: storyboard cards (place/people/action/face/x/time), cast editor, per-shot engine preview, library browser (264 actions, 228 set pieces…), undo/redo (persisted), save/reopen, JSON view. Missing: drag on canvas, scale handles, trim/split on a timeline, keyframe editing | ui/index.html |
| 3 Script → video (own brain) | **BETA**: brain plans bn+en, renders 16:9 and 9:16 | examples/out/sports-day-9x16.mp4, MODEL_EVAL.md |
| 4 QA + repair | **MVP**: scene checks (out-of-frame, overlap, timing, grounding, missing asset) with repair+rollback; video checks (size, fps, length, audio, black, static); seeded test | docs/evidence/qa |
| 5 Missing assets | PROTOTYPE: unknown place/action refused by name; no web research, no generation | |
| 6 Production workflow | partial: 24 s 9:16 film, 3 places… ; no 60 s test, no subtitles/audio mix, one job at a time | |
| 7 Hardening | NOT_YET_IMPLEMENTED (auth, LAN, durable queue beyond local, regression suite partly: cartoon/film-kit/parts/qa tests) | |
| 8 Own-model growth | started: brain + feedback loop. Next: more places/actions in the label set, Bangla names, learned timing, close-ups | |
Labels: nothing here is READY_FOR_LOCAL_USE yet.
