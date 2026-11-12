// Regression coverage for per-task feature fitting, persistence, feedback and vocabulary growth.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zancut-features-'));
process.env.ZANCUT_DATA = tmp;
const B = await import('../server/brain.mjs');
try {
  const f = B.feats('ordinary common'), other = B.feats('common');
  const original = [...f.val], tf = B.fitFeatureTransform([f, other], { context: 'current', idfPower: 1 });
  const common = new Set(other.idx), rare = [...f.idx].find(i => !common.has(i)), shared = [...f.idx].find(i => common.has(i));
  assert.ok(tf.idf[rare] > tf.idf[shared], 'IDF uses document frequency from the supplied training features');
  const weighted = B.applyFeatureTransform(f, tf);
  assert.ok(Math.abs([...weighted.val].reduce((s, v) => s + v * v, 0) - 1) < 1e-6, 'transformed features are normalized');
  assert.deepEqual([...f.val], original, 'weighting does not mutate the shared feature cache');
  assert.throws(() => B.fitFeatureTransform([f], { context: 'future' }), /configuration/);
  assert.throws(() => B.fitFeatureTransform([f], { idfPower: Infinity }), /configuration/);
  const rows = Array.from({ length: 24 }, (_, i) => ({
    text: i % 2 ? `Toma walks along the shore marker ${i}.` : `Dipu rests beside the dune marker ${i}.`,
    ctx: { prevText: i % 2 ? 'They arrived by the sea.' : 'They crossed a desert.', prevPlace: i % 2 ? 'sea_beach' : 'desert_dunes' },
    place: i % 2 ? 'sea_beach' : 'desert_dunes', action: i % 2 ? 'walk' : 'idle',
    face: 'neutral', broll: 'none', graphic: 'none', cameraMove: 'steady', roles: []
  }));
  const heads = { action: { context: 'current', idfPower: 1 }, place: { context: 'full', idfPower: 0.5 } };
  const model = B.train(rows, { heads, epochs: 12 });
  const input = { currentText: rows[1].text, prevText: 'A wholly unrelated preceding event.', prevPlace: 'classroom' };
  const p = B.predict(model, input), q = B.predict(model, { ...input, prevText: 'Another prior event.', nextText: 'A surprise follows.', prevPlace: 'rooftop' });
  assert.deepEqual(p.action, q.action, 'a current-only head ignores neighboring sentences at inference');
  for (const [head, prediction] of Object.entries(p)) if (head !== 'roles') {
    assert.ok(model.heads[head].counts[model.heads[head].classes.indexOf(prediction.label)] > 0, 'zero-example classes cannot win');
  }
  B.save(model);
  const reloaded = B.load(); assert.ok(reloaded);
  assert.deepEqual(reloaded.heads.action.transform.context, 'current');
  for (const head of Object.keys(B.HEADS)) {
    const r = B.predict(reloaded, input)[head];
    assert.equal(r.label, p[head].label, 'quantized save/load retains the decision');
    assert.ok(Math.abs(r.conf - p[head].conf) < 0.001, 'save/load retains calibrated probabilities within quantization tolerance');
  }
  const a = B.calibrate(model, rows).action, b = B.calibrate(reloaded, rows.map(e => ({ ...e, ctx: { prevText: 'Different context.', prevPlace: 'classroom' } }))).action;
  assert.equal(a.T, b.T, 'calibration applies the same current-only window as prediction');
  const idfBefore = [...reloaded.heads.action.transform.idf], novel = 'Toma lifts a hand in greeting beside the orange marker.';
  assert.equal(reloaded.heads.action.counts[B.HEADS.action.indexOf('wave')], 0);
  B.adapt(reloaded, [{ text: novel, action: 'wave', weight: 5, ctx: { prevPlace: 'sea_beach' } }], { epochs: 30, replay: 0 });
  const adapted = B.load();
  assert.equal(B.predict(adapted, novel).action.label, 'wave', 'a correction activates and teaches a previously unseen class');
  assert.deepEqual([...adapted.heads.action.transform.idf], idfBefore, 'incremental feedback keeps the fitted IDF stable');
  const legacy = B.train(rows, { heads: {}, epochs: 1 });
  B.save(legacy); assert.ok(B.load(), 'legacy heads without transforms remain readable');
  const broken = JSON.parse(fs.readFileSync(B.paths.model)); broken.heads.place.classes.pop();
  fs.writeFileSync(B.paths.model, JSON.stringify(broken)); assert.equal(B.load(), null, 'incompatible vocabulary is rejected');
  const result = B.feedMany([{ text: 'Toma watches shells beside the surf.', place: 'sea_beach' }]);
  assert.equal(result.retrained, true, 'a valid correction repairs an existing incompatible saved model');
  assert.deepEqual(B.load().heads.place.classes, B.HEADS.place);
  const neuralRows = Array.from({ length: 32 }, (_, i) => ({ text: i % 2 ? `Nila celebrates the finished drawing ${i}.` : `Nila studies the drawing quietly ${i}.`, face: i % 2 ? 'happy' : 'neutral' }));
  const neural = B.train(neuralRows, { heads: { face: { context: 'current', idfPower: 0.5, classifier: { algorithm: 'neural', dim: 8, epochs: 8, lr: 0.12, seed: 7 } } }, epochs: 1 });
  assert.equal(neural.heads.face.algorithm, 'neural');
  const probe = 'Nila celebrates the finished drawing 1.', before = B.predict(neural, probe).face;
  B.save(neural); const restored = B.load(); assert.ok(restored);
  const after = B.predict(restored, probe).face;
  assert.equal(after.label, before.label); assert.ok(Math.abs(after.conf - before.conf) < 0.001, 'neural save/load preserves probabilities');
  const prior = B.predict(restored, probe).face.conf;
  B.adapt(restored, [{ text: probe, face: 'surprised', weight: 5 }], { epochs: 30, replay: 0 });
  const corrected = B.predict(B.load(), probe).face;
  assert.equal(corrected.label, 'surprised', 'owner feedback also teaches an unseen neural class');
  assert.ok(Number.isFinite(prior) && Number.isFinite(corrected.conf));
  const { brain } = await import('../server/brainplan.mjs');
  const cached = brain();
  B.save({ ...B.load(), replacementMarker: 'external-training-command' });
  assert.notEqual(brain(), cached, 'the planner reloads an atomically replaced model without an app restart');
  assert.equal(brain().replacementMarker, 'external-training-command');
  assert.throws(() => B.fitHead(neuralRows, 'face', { algorithm: 'unknown' }), /classifier/);
  assert.throws(() => B.fitHead(neuralRows, 'face', { algorithm: 'neural', dim: 0 }), /dimension/);
  console.log('ok: task windows, training-only IDF, normalization, quantized persistence, calibration, unseen-class feedback and vocabulary retrain');
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
