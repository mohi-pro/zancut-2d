// Supplemental story diagnostics: real predicted previous places, no teacher-forced location.
// This assistant-authored stress set is not a human-verified or professional-quality benchmark.
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import * as B from '../server/brain.mjs';
const file = 'brain/story-generalization.jsonl', rows = B.readJsonl(file);
const modelFile = process.argv[2] || B.paths.model, model = B.load(modelFile);
if (!model) throw Error('Saved model is absent or incompatible with this feature size');
// The normal app planner can be inspected only when evaluating the deployed model.
// Candidate files with a different feature size must never cause a root-model retrain.
const planner = path.resolve(modelFile) === path.resolve(B.paths.model) ? await import('../server/brainplan.mjs') : null;
const plannerPlace = { n: 0, correct: 0 };
const groups = new Map();
for (const row of rows) { if (!groups.has(row.storyId)) groups.set(row.storyId, []); groups.get(row.storyId).push(row); }
const details = [], totals = Object.fromEntries(Object.keys(B.HEADS).map(h => [h, { n: 0, correct: 0 }]));
for (const [storyId, story] of groups) {
  story.sort((a, b) => a.scene - b.scene); let previousPlace = 'none';
  const film = planner?.planFromBrain('', { duration: story.length * 4, timed: story.map((r, i) => ({ text: r.text, at: i * 4 })) });
  for (let i = 0; i < story.length; i++) {
    const row = story[i], ctx = { prevText: story[i - 1]?.text || '', nextText: story[i + 1]?.text || '', prevPlace: previousPlace };
    const predictions = B.predict(model, { currentText: row.text, ...ctx }), wrong = [];
    for (const head of Object.keys(totals)) if (row[head] != null) {
      totals[head].n++; totals[head].correct += predictions[head].label === row[head];
      if (predictions[head].label !== row[head]) wrong.push(head);
    }
    const finalPlace = film?.plan.receipts[i]?.place;
    if (finalPlace) { plannerPlace.n++; plannerPlace.correct += finalPlace === row.place; }
    details.push({ storyId, scene: row.scene, text: row.text, context: ctx, expected: Object.fromEntries(Object.keys(B.HEADS).filter(h => row[h] != null).map(h => [h, row[h]])), predicted: Object.fromEntries(Object.keys(B.HEADS).map(h => [h, { label: predictions[h].label, confidence: predictions[h].conf }])), ...(finalPlace ? { finalPlannerPlace: finalPlace } : {}), wrong });
    // Match the existing planner's confidence gate; never substitute the expected place.
    if (predictions.place.label !== 'none' && predictions.place.conf >= 0.45) previousPlace = predictions.place.label;
  }
}
const result = { at: new Date().toISOString(), benchmark: file, benchmarkSha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), model: modelFile, modelSha256: crypto.createHash('sha256').update(fs.readFileSync(modelFile)).digest('hex'), stories: groups.size, sentences: rows.length,
  notice: 'Assistant-authored targeted diagnostics; held out from all training and confidence fitting. Not independently human-verified. Classifier rollout does not apply the app’s deterministic location rules; planner location is reported separately. Mostly negative B-roll/graphic examples: do not use a pooled score to claim 95%.',
  plannerPlace: { ...plannerPlace, acc: plannerPlace.n ? plannerPlace.correct / plannerPlace.n : null },
  metrics: Object.fromEntries(Object.entries(totals).map(([h, t]) => [h, { ...t, acc: t.n ? t.correct / t.n : null }])), details };
const dest = process.argv[3] || 'data/teaching/2026-11-09/narrative-round/story-evaluation.json';
fs.mkdirSync(dest.slice(0, dest.lastIndexOf('/')) || '.', { recursive: true });
fs.writeFileSync(dest, JSON.stringify(result, null, 2)); console.log(JSON.stringify({ stories: result.stories, sentences: result.sentences, metrics: result.metrics, plannerPlace: result.plannerPlace }));
