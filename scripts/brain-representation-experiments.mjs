// Change only hash capacity; fit and select using training + development data.
// Run with ZANCUT_BRAIN_BITS=15 (or 16). Never deploys or evaluates final/real tests.
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as B from '../server/brain.mjs';
const dir = 'data/teaching/2026-11-09/representation-round';
fs.mkdirSync(dir, { recursive: true });
const baseline = JSON.parse(fs.readFileSync('data/teaching/2026-11-09/narrative-round/baseline-development.json')).metrics;
const protocol = JSON.parse(fs.readFileSync('data/teaching/2026-11-09/narrative-round/protocol.json')).promotion;
const t = Date.now(), examples = B.allExamples(), model = B.train(examples), trainingMs = Date.now() - t;
B.calibrate(model, [...B.readJsonl(B.paths.seed).filter(e => e.held), ...B.readJsonl('brain/teaching-validation.jsonl')]);
const file = `${dir}/candidate-${B.NB}.json`;
B.save(model, file); const saved = B.load(file);
if (!saved) throw Error('Candidate cannot reload its feature vocabulary');
const metrics = B.evaluate(saved, B.readJsonl('brain/holdout-dev.jsonl'));
const heads = Object.keys(B.HEADS), delta = Object.fromEntries(heads.map(h => [h, metrics[h].acc - baseline[h].acc]));
const macroGain = heads.reduce((s, h) => s + delta[h], 0) / heads.length;
const eligibleForPromotion = macroGain >= protocol.minimumCategoricalMacroGain && heads.every(h => delta[h] >= -protocol.maximumSingleHeadDrop) && metrics.roles.f1 - baseline.roles.f1 >= -protocol.maximumRolesF1Drop;
const result = { at: new Date().toISOString(), selectionSet: 'holdout-dev only', nb: B.NB, examples: examples.length, trainingMs, metrics, delta, macroGain, eligibleForPromotion, promotionCriteria: protocol,
  caveat: 'Changing capacity also changes random embedding initialization and may overfit the small development set. Eligibility is not deployment or a 95% claim.',
  modelSha256: crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'), bytes: fs.statSync(file).size };
fs.writeFileSync(`${dir}/result-${B.NB}.json`, JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
