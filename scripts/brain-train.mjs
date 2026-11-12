// Train and evaluate the actual deployed model. Protected benchmarks are never used to
// fit weights, confidence temperatures, or select a candidate. Validation stays out of training.
import fs from 'node:fs';
import crypto from 'node:crypto';
import { train, readJsonl, paths, predict, allExamples, HEADS, calibrate, ece, save, load, evaluate, coarseAction } from '../server/brain.mjs';
const root = new URL('../', import.meta.url);
const read = (name) => readJsonl(new URL(name, root).pathname);
const seed = readJsonl(paths.seed), examples = allExamples(), held = seed.filter(e => e.held), validation = read('brain/teaching-validation.jsonl');
const calibrationRows = [...held, ...validation];
if (examples.some(e=>e.held)) throw Error('Validation row in training');
const t = Date.now(), model = train(examples), trainingMs = Date.now()-t;
const before = Object.fromEntries(Object.keys(HEADS).map(h=>[h,ece(model,calibrationRows,h)]));
const cal = calibrate(model,calibrationRows);
const calibration = Object.fromEntries(Object.entries(cal).map(([h,c])=>[h,{...c,source:'generated validation + separately authored teaching validation; never protected tests',eceBefore:before[h],eceAfter:ece(model,calibrationRows,h)}]));
fs.writeFileSync(new URL('brain/calibration.json',root),JSON.stringify(calibration,null,1)+'\n');
save(model);
// Metrics describe the stored, quantized model the application will actually load.
const deployed=load(), sets={};
for(const [name,rows] of [['generated-validation',held],['teaching-validation',validation],['real-34',read('brain/real-test.jsonl')],['holdout-dev',read('brain/holdout-dev.jsonl')],['holdout-test',read('brain/holdout-test.jsonl')],['holdout-200',read('brain/holdout-200.jsonl')]]){
 if(!rows.length)continue;
 const metrics=evaluate(deployed,rows), actionRows=rows.filter(e=>e.action);
 metrics.actionCoarse={n:actionRows.length,acc:actionRows.length?actionRows.filter(e=>coarseAction(predict(deployed,e.ctx?{currentText:e.text,...e.ctx}:e.text).action.label)===coarseAction(e.action)).length/actionRows.length:null};
 sets[name]={rows:rows.length,metrics,ece:Object.fromEntries(Object.keys(HEADS).map(h=>[h,ece(deployed,rows,h)]))};
}
const percent=x=>x==null?'—':`${(100*x).toFixed(1)}%`;
const final=sets['holdout-test'].metrics;
const reached95=Object.keys(HEADS).every(h=>final[h].acc>=.95)&&final.roles.f1>=.95;
const report={at:new Date().toISOString(),trainingMs,examples:examples.length,curriculum:read('brain/curriculum.jsonl').length,modelSha256:crypto.createHash('sha256').update(fs.readFileSync(paths.model)).digest('hex'),target:'Each of six categorical heads >=95% Top-1 and roles F1 >=95% on protected holdout-test; video quality assessed separately.',reached95,calibration,sets};
fs.mkdirSync(new URL('data/teaching/2026-11-09/',root),{recursive:true});
fs.writeFileSync(new URL('data/teaching/2026-11-09/evaluation.json',root),JSON.stringify(report,null,2)+'\n');
const names=['place','action','face','broll','graphic','cameraMove','roles'];
const table=names.map(h=>`| ${h} | ${percent(sets['generated-validation'].metrics[h].acc??sets['generated-validation'].metrics[h].f1)} | ${percent(sets['real-34'].metrics[h].acc??sets['real-34'].metrics[h].f1)} | ${percent(final[h].acc??final[h].f1)} |`).join('\n');
fs.writeFileSync(new URL('docs/MODEL_EVAL.md',root),`# MODEL EVAL — deployed local brain\n\nMeasured ${report.at}. Reproduce: \`node scripts/brain-train.mjs\`. This fits weights and calibration; protected tests are read only to report results.\n\n${examples.length} training rows, including ${report.curriculum} assistant-authored curriculum rows. Generated held-out rows stay out of every full retrain and incremental replay. Training: ${trainingMs} ms. The model is saved, reloaded and then evaluated, so reported scores include owner corrections and quantization.\n\n| Task | Generated validation (related wording) | Owner real-34 | Protected holdout-test (99 sentences) |\n|---|---|---|---|\n${table}\n\nRoles uses F1; other rows use exact Top-1, including fine gestures. The coarse action mapping is reported separately in evaluation.json and is not interchangeable with exact action accuracy.\n\n**95% target achieved: ${reached95?'yes':'no'}.** Required: every categorical head >=95% and roles F1 >=95% on the independent set. These labels have creative ambiguity and the set is small; this does not establish professional video quality. The existing holdout was assistant-authored previously, not independently human-verified. It was not rewritten or fed back into training.\n\nCalibration uses ${held.length} generated validation examples plus ${validation.length} separately authored validation examples, never the protected tests. Confidence reliability on natural language must be inspected separately; high confidence is not evidence that a prediction is supported by the transcript.\n\nFull counts, exact/coarse actions, ECE, model hash and all seven task results: data/teaching/2026-11-09/evaluation.json. Training data provenance: scripts/data/teaching-curriculum.mjs and brain/curriculum.jsonl.\n`);
console.log(JSON.stringify({trainingMs,examples:examples.length,reached95,holdoutTest:final}));
