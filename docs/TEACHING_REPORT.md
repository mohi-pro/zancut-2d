# Zancut teaching report — 9 November 2026

**The 95% target has not been reached.** This run improved parts of transcript planning and fixed several visible production defects. It does not establish professional animation quality or general world understanding.

## Measured classifier results

The same protected 99-sentence test subset, evaluated on the saved/reloaded deployed model before and after:

| Task | Before teaching | 749-example milestone | Current |
|---|---|---|---|
| place | 82.8% | 86.9% | 88.9% |
| action | 69.7% | 71.7% | 71.7% |
| face | 56.6% | 57.6% | 55.6% |
| broll | 68.7% | 68.7% | 67.7% |
| graphic | 87.9% | 86.9% | 84.8% |
| cameraMove | 84.8% | 83.8% | 84.8% |
| Roles (F1) | 93.3% | 93.3% | 93.3% |

The target requires at least 95% exact Top-1 for every categorical task and at least 95% roles F1. Fine action labels and coarse action categories are different measures: coarse action is 92.9%, **not** the exact action result above. These creative labels have ambiguity; a 99-sentence set cannot certify universal behavior. The existing benchmark was assistant-authored previously, not independently human-verified. Its text/labels were not edited or fed into training. Its headline metrics have been observed during development, so a future release should also use fresh owner-reviewed stories.

The curriculum now includes beach, mountain-valley and desert settings. The location vocabulary grew from 21 to 24 labels including none. The saved model has been retrained and reloads with all 24 labels. Per-task context and training-only IDF are stored with the weights. Expressions use a small 32-unit network trained from random weights on local examples; all other tasks retain their local linear classifiers. No pretrained animation model or external model service is used.

Configuration was selected on the 101-sentence development subset before final evaluation. On development, action rose from 54.5% to 59.4%, expression from 49.5% to 54.5%, and camera from 75.2% to 77.2%, compared with a same-vocabulary baseline. Those gains did not reliably transfer: final exact action stayed at 71.7%, expression fell from 57.6% to 55.6%, B-roll from 68.7% to 67.7%, and graphics from 86.9% to 84.8%; location rose from 86.9% to 88.9% and camera from 83.8% to 84.8%. Roles stayed at 93.3% F1. This is mixed evidence, not a general accuracy improvement. Later candidates must use development decisions and fresh owner-reviewed stories rather than repeatedly tuning to this test. Selection, experiments and previous milestone results are preserved under data/teaching/2026-11-09/continuation/.

Detailed counts, calibration reliability on each set, all 200 holdout sentences, model hash and the owner's 34-sentence benchmark: [evaluation.json](../data/teaching/2026-11-09/evaluation.json) and [MODEL_EVAL.md](MODEL_EVAL.md).

## What was taught

- 806 original assistant-authored examples across 145 families; 640 Bengali examples, 368 with surrounding story context. These are teaching proposals reviewed by the assistant, not owner-approved ground truth.
- Partial labels cover all seven tasks: location, action/gesture, expression, roles, B-roll, graphic and camera choice. Missing labels are intentionally skipped rather than invented.
- Subjects, calm dialogue, reactions to loss/threat/relief/discovery, negated actions, practical props, movement towards a destination, ordinary settings, story continuity, numbers, percentages and lists.
- 14138 total training examples after reserving generated validation rows. The earlier model included those rows in full retrains; they are now excluded.
- A separate 32-example assistant-authored validation collection is reserved; confidence fitting uses it alongside generated validation, never the protected tests. It remains a small and limited calibration sample.

Training sources are traceable in [curriculum.jsonl](../brain/curriculum.jsonl), [the source curriculum](../scripts/data/teaching-curriculum.mjs) and [visual-knowledge.json](../brain/visual-knowledge.json). The latest evaluation trained in 3136 ms. The unchanged five-second regression requirement remains active; timing varies with contention. The latest full-suite log is data/teaching/2026-11-09/continuation/full-tests.log; earlier timing evidence remains in data/teaching/2026-11-09/speed-evidence.json.

## Five-film breakdown

All five films were indexed across their full duration: 769 approximate shots across 3607 seconds. Technical indexing is not semantic understanding. This run inspected the earlier 100 sampled frames plus 20 additional timestamped frames, and processed two 36-second audio excerpts per film. Bengali recognition errors were conspicuous, so raw transcripts were not fed as trusted labels.

Read [the breakdown](TEACHING_REFERENCE_BREAKDOWN.md). Source frames/audio stay local study material; no reference character art, backgrounds, dialogue or audio was copied into the demo or product library. New reference-derived examples describe original domestic reactions, care, practical work, conversation and object-giving situations.

## Internet knowledge and editorial behavior

This is a focused knowledge pack, not a download of all world knowledge. Existing executable knowledge still supplies dimensions, ground/support relationships, indoor/outdoor rules, identity, camera geometry and local assets. New sourced notes cover animation staging, supporting action, supplemental footage, synchronized captions, readable text and basic water/weather behavior. A broader experimental language dictionary slightly reduced development performance and was **rejected**; its presence in research notes is not active classifier knowledge.

Automatic treatment now follows these local, tunable defaults:

1. Preserve important dialogue, physical action and emotional reactions on screen.
2. Require transcript evidence for an insert; classifier confidence alone cannot justify unrelated imagery. A directly supported template can replace a contradictory guess.
3. Use each automatic insert at most once in a film, leave two intervening shots, and budget roughly 30% of shots for automatic inserts. Explicit author choices remain authoritative.
4. A supported time bridge can use a short full-frame cutaway. Unclear prose alone never justifies random B-roll; preserve the established world instead.
5. Avoid simultaneous data cards and B-roll. Keep captions as the normal narration channel instead of popping a headline on every ordinary shot.
6. Keep targeted/aspirational numbers distinct from achieved results; chart labels now distinguish current values from goals.
7. Give generated inserts/graphics appropriate existing local cues after the automatic pass, while ordinary dialogue shots remain free of gratuitous pop sounds.

Sources, paraphrased into the local knowledge pack:

- [Adobe: animation principles](https://www.adobe.com/creativecloud/animation/discover/principles-of-animation.html): staging, anticipation, timing and supporting action.
- [Adobe: B-roll](https://www.adobe.com/creativecloud/video/discover/b-roll.html): supplemental footage should clarify or connect the main narrative.
- [W3C: captions](https://www.w3.org/WAI/media/av/captions/): synchronize meaningful speech/audio information.
- [W3C: contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): readable text contrast.
- [W3C: flashes](https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html): avoid strobe-like treatment; this note alone is not an accessibility certification.
- [USGS: water cycle](https://www.usgs.gov/water-science-school/water-cycle): water changes state and moves through the environment; gravity supports downward rain/runoff depictions.

## Production and teaching fixes

- Default storyboard teaching learns changed fields rather than approving every prediction. Teaching an expression does not quietly approve location/action. Repeated clicks do not amplify the same correction. Explicit approval of an entire storyboard remains available through the API.
- Bulk teaching preserves the context window. Protected test/validation text is guarded in direct input, context, incremental adaptation, rule expansion and retraining/replay.
- Evaluation now measures the stored model, including feedback and quantization. The planner notices atomic model replacement and reloads it on its next use.
- New classes cannot win a prediction before receiving training examples. Corrections trigger a compatible full retrain when the saved vocabulary is stale. Feature weighting, neural weights and class counts survive save/load and incremental correction.
- A bounded feature cache speeds repeated training/evaluation and invalidates when learned knowledge changes or is removed. The review-queue command selects uncertain/contradictory decisions for later approval and never feeds its own predictions back automatically.
- Closeups and speech follow the sentence's resolved subject, rather than accidentally choosing the recurring hero/listener.
- Empty-wallet narration no longer selects accumulating coins just because it contains a money word.
- Completed native scripts are recomposed before storyboard thumbnails, preventing stale text-only previews.
- Bengali headlines use actual font measurement. Data cards consider every face, including two-character shots, instead of only average head position; there is a below-face fallback above the caption lane.

## Story video

[এক বাক্স বই — MP4](../examples/out/teaching-one-box-of-books.mp4). An original Bengali story about friends collecting books for children, rendered at the earlier 749-example milestone; it has not been rerendered with the later classifier. The classifier supplies an automatic plan; two explicit director corrections widen the offering shot and show children reading in the payoff. Existing code, the editorial policy and layout/physics rules produce the final scenes. Both automatic.film.json and directed.film.json are saved; this is a partially directed demonstration, not a claim of autonomous 95% performance. The saved automatic scene file, directed scene file and shot decisions make that distinction inspectable. Held books now expose the existing open-book variant when a reader uses the reading gesture. The story itself was not used as training/evaluation data.

**Audio:** local music and effects; **no spoken narration or speech synthesis**. Captions carry the story. Its book counts/progress are fictional story values.

Video QA: PASS. Body gate: PASS, 1782 frames, 0 faults.

Preview: http://localhost:3054/#project/hf . Editable source: `data/teaching/2026-11-09/demo/`. Verification and decoded contact sheet live there too.

## Validation and limits

- Full active test suite: PASS. Additional teaching tests check context retention, leakage protection, correction isolation/idempotence, supported inserts, repetition/density/cooldown, goal labeling and speaker identity.
- Graphics regression: 19 scenes and 1,542 real 30fps frames, including paired faces. The full-film body/video results above are separate checks.
- Latest saved HyperFrames check: PASS. Warnings must be interpreted alongside native body/layout checks and actual decoded frames; zero warnings is not claimed.
- Frozen source/test hashes unchanged: YES. The no-AI guard is unchanged.
- Baseline testing failed the existing 5-second training-speed assertion (5,084/5,080 ms). Later runs are recorded separately; no accuracy or speed threshold was loosened.

The largest remaining classifier weakness is expressions and fine action selection on unfamiliar language. More of the same template expansion did not produce 95%. The next useful teaching material is whole, realistically written stories with owner-reviewed decisions, acceptable creative alternatives, and error categories. The current runtime still has a closed visual vocabulary; it cannot animate every arbitrary action or learn a complete studio's style by measuring five films.
