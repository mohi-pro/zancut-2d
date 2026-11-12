# MODEL EVAL — deployed local brain

Measured 2026-11-09T05:10:24.049Z. Reproduce: `node scripts/brain-train.mjs`. This fits weights and calibration; protected tests are read only to report results.

14138 training rows, including 806 assistant-authored curriculum rows. Generated held-out rows stay out of every full retrain and incremental replay. Training: 3136 ms. The model is saved, reloaded and then evaluated, so reported scores include owner corrections and quantization.

| Task | Generated validation (related wording) | Owner real-34 | Protected holdout-test (99 sentences) |
|---|---|---|---|
| place | 96.8% | 76.5% | 88.9% |
| action | 91.9% | 82.4% | 71.7% |
| face | 92.4% | 91.2% | 55.6% |
| broll | 88.3% | — | 67.7% |
| graphic | 89.0% | — | 84.8% |
| cameraMove | 92.6% | — | 84.8% |
| roles | 98.4% | 95.2% | 93.3% |

Roles uses F1; other rows use exact Top-1, including fine gestures. The coarse action mapping is reported separately in evaluation.json and is not interchangeable with exact action accuracy.

**95% target achieved: no.** Required: every categorical head >=95% and roles F1 >=95% on the independent set. These labels have creative ambiguity and the set is small; this does not establish professional video quality. The existing holdout was assistant-authored previously, not independently human-verified. It was not rewritten or fed back into training.

Calibration uses 2952 generated validation examples plus 32 separately authored validation examples, never the protected tests. Confidence reliability on natural language must be inspected separately; high confidence is not evidence that a prediction is supported by the transcript.

Full counts, exact/coarse actions, ECE, model hash and all seven task results: data/teaching/2026-11-09/evaluation.json. Training data provenance: scripts/data/teaching-curriculum.mjs and brain/curriculum.jsonl.
