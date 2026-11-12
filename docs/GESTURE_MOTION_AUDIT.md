# Step 2 — anchored gestures and alive motion (2026-11-08)

The current library contains **65 gestures**, including the original 63. All 65 pass the production 30 fps body gate in both full-body and waist-up rigs. The owner's unchanged 94.60 s scene file now renders with **5.29% nearly static footage**, versus **45.24%** in its original MP4.

## Diagnosis

The historical “42 jumping gestures” report was not evidence of 42 broken pelvis offsets. Replaying the original solver and original compiled schedule from the backup reproduced 43/65 failures at 6 fps (the original 42 plus `finger_wag`), but zero at 30 fps. The old sweep applied a 40 U **per-sample** displacement limit at 6 fps, although production uses 30 fps. Original pelvis and foot drift in skeleton space measured zero.

There was a separate visible defect: the renderer centered a standing body on the mean of all joints. Moving an arm changed that center, translating the drawn body despite stable root/feet. The old center moved up to 4.586 U between 6 fps samples. Standing rendering now uses a fixed neutral center, also shared by joint/hand projection.

Static footage had additional causes: short shots skipped gestures, repeats held still for 2.2 s, close shots used resting hands, and small profile characters hid most of their gesturing arm. Breathing alone cannot solve those composition/acting problems.

## Implementation

- `anatomy.js`: shoulder-relative gestures normalize to the base pelvis and preserve its complete supporting leg/foot chain. `anchor.root` and `anchor.foot_y` expose the invariant to H25. Bone-direction interpolation, followed by the existing constraint solver, gives a six-frame attack/release. Shortened gestures reduce their range and retain authored phase speed rather than accelerating a throw into a snap. Walking, jumping and seated base motion is preserved.
- `rig.js`, `zc.js`: both rigs automatically breathe with a 1.75% chest/shoulder cycle, blink at seeded 2.8–4.2 s intervals and make small speech nods from the existing lip-sync syllable envelope. Time and shot/person identity determine every sample; no random clock or previous-frame integration is used. Explicit `blink`, `eyesClosed` and `alive: false` remain available.
- The waist-up gesture adapter forwards the actual projected wrist instead of reconstructing it toward the shoulder. It supplies the original 3D arm coordinates so the gate measures the real hinge, including foreshortened arms. Invalid source coordinates still fail.
- `codefilm.mjs`: short and close idle shots use the gesture rig; automatic acting cycles related face-appropriate gestures with short rests. Default standing acting uses three-quarter staging so both hands remain visible. A wide shot explicitly focused on one stationary actor uses a fixed head-to-feet frame based on their neutral pose. Explicit views/frame sizes win; groups, travel and unfocused place views retain their previous composition. The fixed acting camera does not follow breathing.
- `check-body.mjs`: H13 still limits displacement to **40 U per production 30 fps frame**. Other sample rates use the equivalent 1200 U/s limit. R3 checks actual 3D hinge angles for the new projected gesture adapter; ordinary 2D targets retain their existing checks. H25 checks root/contact drift. Existing deliberately broken films still fail.
- SVG gradient selectors use equivalent string concatenation, avoiding HyperFrames' template-selector bundler error.

The 65 source gesture JSON files are unchanged. The runtime allowlist was regenerated only after the complete sweep passed. Brain/training data, planners, QA rules and `server/no-ai.mjs` were not changed; Zancut Studio was not modified.

## Verification

| Check | Result |
|---|---|
| `npm run test:all` (includes `npm test`) | All nine active test scripts passed |
| `scripts/gesture-sweep.mjs` → `check-body.mjs` | 65/65, two rigs, four profiles, 23,400 frames / 93,600 character frames |
| `scripts/rig-motion-test.mjs` | 124,800 numeric frames: 65 gestures × four profiles × two mirror states × normal/half-second duration |
| Numeric displacement maximum | 36.50 U/frame; pelvis/leg/foot invariants and exact attack/release endpoints passed |
| `scripts/cartoon-test.mjs` | Passed; 150 gate frames, 14 body rows × three builds, malformed bodies still caught; screen-space contacts and reverse-seek geometry passed |
| `scripts/parts-test.mjs` | 60/60 first answers; 110/110 top-three matches |
| Film-kit, QA, codefilm, world and cleanup integration | Passed, including isolated cached-voice → 6.00 s MP4 and local API checks |
| Owner's benchmark video QA | 1920×1080, 30 fps, 94.60 s, audio present; no issues |
| Full HyperFrames `check --json` | Passed, zero errors; two existing assembly-size/track-density warnings |

Numeric checks assert contact equality on every lower joint. Browser checks additionally verify that pelvis, heels and toes stay fixed on screen and that both rigs reproduce identical geometry when seeking backward. Unique SVG clip ids are canonicalized only for comparison; joint geometry is not rounded or ignored.

## Measured static ratio

Both videos use the unchanged reference-study filter:

```text
fps=5,scale=320:-2,freezedetect=n=-55dB:d=1.5
```

| Same 94.60 s film | Near-still seconds | Share |
|---|---:|---:|
| Original MP4 | 42.80 | 45.24% |
| Step 2 rerender | 5.00 | **5.29%** |

No new cuts, noise or camera wobble were added to defeat the measurement. The saved scene file, voice and brain model were reused in an isolated workspace. The ratio is a verified result on this benchmark, not a guarantee for arbitrary authored still scenes or `gesture: false` shots.

Evidence: [sweep](../archives/gesture-fix-2026-11-08/sweep.json), [test log](../archives/gesture-fix-2026-11-08/tests.log), [baseline diagnosis](../archives/gesture-fix-2026-11-08/baseline-analysis.json), [motion comparison](../archives/gesture-fix-2026-11-08/motion-comparison.json), [video QA](../archives/gesture-fix-2026-11-08/video-qa.json). The pre-change source is in `archives/gesture-fix-2026-11-08/before-fix.tar.gz`.

The [HyperFrames report](../archives/gesture-fix-2026-11-08/hyperframes-check.json) passes lint, runtime, layout, motion, contrast and audio. Its two warnings concern the existing monolithic assembly and 25 elements on one track. Informational world-layer overflow is intentional: the camera crops a place larger than the frame. Visual review of the decoded MP4/contact sheet checked the new standing compositions, hand visibility and foot contacts.

Review artifacts: [rerendered MP4](../data/qa/gesture-step2/owner-voice-bn-94s.mp4), [contact sheet](../data/qa/gesture-step2/contact-sheet.jpg). Original project and original MP4 are retained.

Reproduce the sweep with `node scripts/gesture-sweep.mjs --no-update`. Reproduce the benchmark with `node scripts/motion-benchmark.mjs zq4p3f38id examples/out/owner-voice-bn-94s.mp4 /tmp/z2d-motion-new-run` (use a fresh output directory).
