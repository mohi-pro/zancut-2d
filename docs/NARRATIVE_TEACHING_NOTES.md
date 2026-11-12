# Narrative teaching and location continuity

The active curriculum remains at **806** examples. The additional **168 examples in 28 original stories** are research material, not deployed teaching. They cover emotion ownership, remembered versus present feelings, recovery after loss, descriptions versus performed actions, and readable human exchanges. Labels are assistant proposals, not owner-approved ground truth.

The candidate failed the criteria recorded before evaluation. On the 101-sentence development set, mean categorical accuracy fell by 0.66 percentage points; expression fell from 54.5% to 52.5% and B-roll from 63.4% to 61.4%. Neither a doubled nor quadrupled hash capacity passed the same development gate. No candidate was evaluated on the final benchmark or substituted for the deployed model.

Reproduce the story experiment without changing active data:

```sh
npm run teach:stories
node scripts/brain-narrative-experiment.mjs
ZANCUT_BRAIN_BITS=15 node scripts/brain-representation-experiments.mjs
ZANCUT_BRAIN_BITS=16 node scripts/brain-representation-experiments.mjs
```

Location continuity received a separate executable correction. Establishing shots help orient viewers to a scene's location and time. [Columbia Film Language Glossary](https://filmglossary.ccnmtl.columbia.edu/term/establishing-shot/), [Adobe: establishing shots](https://www.adobe.com/creativecloud/video/production/cinematography/camera-shots-and-angles/establishing-shot.html).

The following are our local interpretations of that principle, implemented in `server/location-intent.mjs`:

| Transcript meaning | Planning behavior |
|---|---|
| Someone remembers or discusses another place | Retain the established setting. |
| Someone looks at or draws a picture of another place/animal | Do not move the scene to the pictured location or animal habitat. |
| Someone plans a visit | Retain the current setting until movement or arrival is stated. |
| Someone travels toward a destination | Keep an established outdoor route, or choose a road when actual departure requires one. |
| Someone reaches or enters a named location | Establish the named location. |
| One place is current and another is remembered | Prefer the current location. |

This is a conservative Bengali/English grammar, not complete language understanding. Complex quotations, relative clauses, ambiguous travel origins and unfamiliar constructions still need review. It changes planner rules, not classifier labels or the 95% success definition.

The location regression covers 25 cases and two bilingual four-beat routes. A controlled comparison disables only this grammar while retaining the same model and planner: 4/8 location decisions were correct without it, 8/8 with it. This is a targeted regression result, not an independent benchmark score. Details: `data/teaching/2026-11-09/narrative-round/location-ablation.json`.

Six fresh assistant-authored stories (30 sentences) are reserved in `brain/story-generalization.jsonl`, with a frozen hash. They are excluded from teaching, context ingestion, retraining/replay and confidence fitting. The classifier is evaluated with its own predicted prior locations, not the expected prior locations. This diagnostic reports 60.0% location, 66.7% action and 70.0% expression accuracy; the full planner's deterministic location rules produce 30/30 correct locations. B-roll/graphic examples are mostly negatives, camera has no labels, and the stories are not independently human-verified. These results cannot establish the requested 95% across all seven tasks.

```sh
npm run teach:story-eval
node scripts/location-intent-test.mjs
```

The live app had retained the old 21-location vocabulary and wrote an incompatible model. After confirming no active video jobs, that model was backed up, the app restarted, and the evaluated 24-label model restored. Experiments now write candidate curriculum files separately. Runtime evidence and the backed-up model are under `data/teaching/2026-11-09/narrative-round/`.

The next high-value source is real, owner-reviewed scripts. Assistant-generated examples and a small development set do not provide enough independent evidence to claim general filmmaking skill.
