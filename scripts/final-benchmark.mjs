// Step 12: the whole local pipeline, voice → words → brain plan → QA/physics → engine → body gate → MP4 → video QA, on
//   1. the owner's Bangla voice (94.6 s, the film that was 45 % nearly still), 2. Sports day 9:16 (English voice),
//   3. v2.mp4's sound (Bangla, 9:16, transcribed now by the local speech-to-text: the one allowed listener),
//   4. a new Bangla story with a procedural creature, numbers (→ charts) and words the brain never saw (no voice: a quiet
//      room-tone track and word times spread by length; no speech synthesis, which would be a pretrained model).
// Nothing is retrained. Projects live in <out>/store (its own ZANCUT_DATA); the originals, data/ and the engine library are untouched.
//   node scripts/final-benchmark.mjs [outdir] [--only=owner-bn-94s,story] [--fresh] (fresh: transcribe every voice again)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname), arg = (k) => process.argv.find((a) => a.startsWith(`--${k}`));
const out = path.resolve(process.argv.slice(2).find((a) => !a.startsWith('--')) || path.join(root, 'data/qa/step12'));
const only = arg('only')?.split('=')[1]?.split(','), fresh = !!arg('fresh');
process.env.ZANCUT_DATA = path.join(out, 'store'); process.env.npm_config_offline = 'true';
fs.mkdirSync(path.join(out, 'store/brain'), { recursive: true });
for (const f of ['model.json', 'learned-creations.json', 'learned-knowledge.json', 'feedback.jsonl']) { const src = path.join(root, 'data/brain', f); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(out, 'store/brain', f)); }
const guard = ['engine/cartoon/library/learned-props.json'].map((f) => path.join(root, f)).map((f) => ({ f, b: fs.existsSync(f) ? fs.readFileSync(f) : null }));
const md5 = (f) => crypto.createHash('md5').update(fs.readFileSync(path.join(root, f))).digest('hex'), noai0 = md5('server/no-ai.mjs');

const STORY = 'গ্রামের মেলায় হঠাৎ একটা তিন মাথার নীল রাক্ষস এসে হাজির হলো। সবাই ভয়ে দৌড়ে পালাল। রাফি সাহস করে রাক্ষসের সামনে দাঁড়াল। গত বছর চালের দাম ছিল ৪০ টাকা, এখন ৬৫ টাকা। রাক্ষস বলল, আমি শুধু ক্ষুধার্ত, চাল কিনতে পারছি না। গ্রামের ৮০ শতাংশ মানুষ এখন সৌর প্যানেল দিয়ে বিদ্যুৎ পায়। রাফি একটা ড্রোন উড়িয়ে আকাশ থেকে মেলার ছবি তুলল। শেষে সবাই মিলে রাক্ষসকে পিঠা খাওয়াল, আর সে হাসিমুখে বিদায় নিল।';
const CASES = [
  { id: 'owner-bn-94s', name: "Owner's Bangla voice", lang: 'bn', format: '16:9', voice: 'data/projects/zq4p3f38id/ws/assets/voice.mp3', cache: 'data/projects/zq4p3f38id/ws/transcripts/plate-plate', before: 'examples/out/owner-voice-bn-94s.mp4' },
  { id: 'sports-day-9x16', name: 'Sports day 9:16 (English voice)', lang: 'en', format: '9:16', voice: 'data/projects/34n8b8h9me/ws/assets/long.wav', cache: 'data/projects/34n8b8h9me/ws/transcripts/plate-plate', before: 'examples/out/sports-day-9x16.mp4' },
  { id: 'v2-bn-9x16', name: 'v2.mp4 sound (Bangla, 9:16)', lang: 'bn', format: '9:16', fromVideo: 'examples/out/v2.mp4', before: 'examples/out/v2.mp4' },
  { id: 'story', name: 'New story: creature + numbers + unseen words', lang: 'bn', format: '16:9', script: STORY, learnOnline: true },
].filter((c) => !only || only.includes(c.id));

const store = await import('../server/store.mjs'), agent = await import('../server/agent.mjs');
const { localOwner } = await import('../server/local-owner.mjs'), { firstCutWords, jobDir } = await import('../server/director.mjs');
const { planFromBrain, sentencesFromWords } = await import('../server/brainplan.mjs'), codefilm = await import('../server/codefilm.mjs');
const { check } = await import('../server/qa.mjs'), { checkVideo } = await import('../server/videoqa.mjs'), { measureMotion } = await import('../server/motionqa.mjs');
const { checkBody } = await import('../engine/cartoon/check-body.mjs'), { probe } = await import('../server/media.mjs');
const owner = localOwner(), log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const job = (p, kind) => new Promise((resolve, reject) => {
  agent.setJobDone((r) => setImmediate(() => (r.ok ? resolve() : reject(new Error(`${kind}: ${store.get(p.id)?.error}`)))));
  try { agent.enqueue(p.id, kind); } catch (e) { reject(e); }
});
const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const results = J(path.join(out, 'results.json'), { cases: {} });

try {
  for (const c of CASES) {
    const t0 = Date.now(), T = {}; log(`— ${c.name}`);
    const p = store.create({ name: c.name, ownerId: owner.id, mode: 'faceless', language: c.lang });
    Object.assign(p, { kind: 'animation', format: c.format, designStyle: '2d-animation', theme: 'light', aiVoice: false, setupDone: true, animFormat: 'mixed' });
    const d = store.dirs(p.id); fs.mkdirSync(d.assets, { recursive: true });
    const voice = path.join(d.assets, 'voice.wav');
    if (c.script) execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.004:sample_rate=48000', '-t', String(Math.ceil(c.script.split(/\s+/).length / 2.3) + 2), voice]);
    else execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(root, c.voice || c.fromVideo), '-vn', '-ac', '1', '-ar', '48000', voice]);
    const info = await probe(voice); p.assets = [{ file: 'voice.wav', original: path.basename(c.voice || c.fromVideo || 'room-tone.wav'), role: 'voiceover', hasAudio: true, duration: info.duration, size: fs.statSync(voice).size, addedAt: Date.now() }];
    let words = 'transcribed now (local speech-to-text)';
    if (c.script) { // word times spread by length over the room tone (the story has no voice)
      const ws = c.script.split(/\s+/), per = (info.duration - 1.5) / ws.reduce((a, w) => a + w.length + 2, 0); let t = 0.5;
      const tr = ws.map((w) => { const e = t + (w.length + 2) * per, x = { text: w, start: +t.toFixed(2), end: +(e - 0.04).toFixed(2) }; t = e; return x; });
      const dir = path.join(d.ws, 'transcripts', 'plate-plate'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'transcript.json'), JSON.stringify(tr)); fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ language: 'bn', conf: 1, words: tr.length, tags: null }));
      words = 'from the script text (no voice)';
    } else if (c.cache && !fresh) { fs.cpSync(path.join(root, c.cache), path.join(d.ws, 'transcripts', 'plate-plate'), { recursive: true }); words = 'cached local transcript of this same voice'; }
    store.save(p, { immediate: true });
    let t = Date.now(); await job(p, 'prepare'); T.words = (Date.now() - t) / 1000;
    const heard = firstCutWords(jobDir(d.ws)), timed = sentencesFromWords(heard); if (!timed.length) throw new Error(`${c.id}: no words`);
    t = Date.now(); const film = planFromBrain('', { duration: info.duration, title: c.name, timed }); T.plan = (Date.now() - t) / 1000;
    const errs = codefilm.validate(film); if (errs.length) throw new Error(`${c.id}: ${errs.join(' ')}`);
    if (c.learnOnline) film.learn = true; // unseen words: the web learner (Wikipedia/Wikidata facts, open-licence icons; no model)
    const qa0 = check(film, { duration: info.duration }); p.film = film; store.save(p, { immediate: true });
    t = Date.now(); await job(p, 'storyboard'); T.build = (Date.now() - t) / 1000;
    t = Date.now(); await job(p, 'render'); T.render = (Date.now() - t) / 1000;
    const pv = store.get(p.id), video = path.join(d.out, pv.versions.at(-1).file), keep = path.join(out, `${c.id}.mp4`); fs.copyFileSync(video, keep);
    const J0 = jobDir(d.ws), hf = path.join(J0, 'edit', 'hf');
    log('  body gate on every frame…'); t = Date.now(); const gate = await checkBody(hf); T.gate = (Date.now() - t) / 1000;
    const vqa = checkVideo(keep, { expectSeconds: info.duration, format: c.format }), after = measureMotion(keep), before = c.before ? measureMotion(path.join(root, c.before)) : null;
    const auto = J(path.join(J0, 'work', 'auto-graphics.json'), []), qa = J(path.join(J0, 'work', 'qa.json'), {}), phys = J(path.join(J0, 'work', 'physics.json'), { fixes: [] });
    const kn = J(path.join(out, 'store/brain/learned-knowledge.json'), {}), learned = Object.values(kn.concepts || {}).filter((x, i, all) => all.findIndex((y) => y.term === x.term) === i).map((x) => ({ term: x.term, category: x.category, prop: x.prop || null, known: !!x.known, sources: (x.sources || []).map((s) => s.kind || s) }));
    const castCreations = Object.entries(film.cast).filter(([, s]) => s.creation).map(([id]) => id);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', keep, '-vf', `fps=${(8 / info.duration).toFixed(4)},scale=${c.format === '9:16' ? 180 : 320}:-2,tile=8x1`, '-frames:v', '1', path.join(out, `${c.id}-strip.jpg`)]);
    results.cases[c.id] = {
      name: c.name, format: c.format, seconds: +info.duration.toFixed(2), words, wordCount: heard.length, sentences: timed.length, shots: auto.length, video: path.relative(root, keep),
      places: [...new Set(auto.map((x) => x.place))], learned, creations: castCreations.length, cast: Object.keys(film.cast).length,
      brollAuto: auto.filter((x) => x.broll).length, brollTemplates: [...new Set(auto.filter((x) => x.broll?.template).map((x) => x.broll.template))], brollRecipes: auto.filter((x) => x.broll?.recipe).length,
      charts: auto.filter((x) => x.overlays.includes('dynamic_comparison_chart')).length, graphics: auto.filter((x) => x.overlays.length).length, overlayKinds: [...new Set(auto.flatMap((x) => x.overlays))],
      headlines: auto.filter((x) => x.headline).length, cameraMoves: auto.filter((x) => x.move).length, sfx: auto.reduce((a, x) => a + x.sfx, 0),
      qaFoundBeforeBuild: qa0.length, qaRepairs: (qa.repairs || []).filter((x) => x.result === 'applied').length, qaRemainingErrors: (qa.remaining || []).filter((i) => i.severity === 'error').length, physicsFixes: phys.fixes.length,
      gate: { ok: gate.ok, frames: gate.frames, people: gate.people, faults: gate.faults.length, lines: gate.lines.slice(0, 5) },
      videoQa: { ok: vqa.ok, ...vqa.facts, issues: vqa.issues.map((i) => i.evidence) }, stillAfter: +(after.stillShare * 100).toFixed(2), stillBefore: before ? +(before.stillShare * 100).toFixed(2) : null, beforeFile: c.before || null,
      timings: { ...T, total: (Date.now() - t0) / 1000 },
    };
    fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1) + '\n');
    const r = results.cases[c.id]; log(`  ${r.shots} shots · still ${r.stillBefore ?? '—'}% → ${r.stillAfter}% · b-roll ${r.brollAuto} · charts ${r.charts} · graphics ${r.graphics} · headlines ${r.headlines} · gate ${gate.ok ? 'ok' : 'FAIL'} (${gate.frames} frames) · video QA ${vqa.ok ? 'ok' : 'FAIL'} · ${r.timings.total.toFixed(0)} s`);
  }
} finally {
  for (const g of guard) { if (g.b) fs.writeFileSync(g.f, g.b); else fs.rmSync(g.f, { force: true }); }
}

// ---------- the brain on held-out sentences (the deployed model; nothing retrained) ----------
const B = await import('../server/brain.mjs'), model = B.load(path.join(root, 'data/brain/model.json'));
const evalSet = (f) => { const T = B.readJsonl(path.join(root, f)), a = B.evaluate(model, T), co = T.filter((e) => e.action); a.actionCoarse = co.length ? co.filter((e) => B.coarseAction(B.predict(model, e.ctx ? { currentText: e.text, ...e.ctx } : e.text).action.label) === B.coarseAction(e.action)).length / co.length : null; return a; };
results.brain = { real34: evalSet('brain/real-test.jsonl'), holdoutTest: evalSet('brain/holdout-test.jsonl'), holdout200: evalSet('brain/holdout-200.jsonl'), examples: model.examples, trainedAt: model.trainedAt };
// ---------- the vault and the hub, the studio UI ----------
for (const [k, f] of [['securityHub', 'scripts/security-hub-test.mjs'], ['ui', 'scripts/ui-test.mjs']]) {
  const r = spawnSync(process.execPath, [path.join(root, f)], { cwd: root, encoding: 'utf8', timeout: 600000 }); const o = `${r.stdout}${r.stderr}`;
  results[k] = { pass: r.status === 0, okLines: (o.match(/^ok: /gm) || []).length, failed: r.status === 0 ? null : o.split('\n').filter((l) => /Error|assert/i.test(l)).slice(0, 3) };
}
results.noAiUnchanged = md5('server/no-ai.mjs') === noai0 && noai0 === '0f4e595ca4b82583c700541f009f5b50';
results.finishedAt = new Date().toISOString(); fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify(results, null, 1) + '\n');

// ---------- Before vs After ----------
const pc = (x) => (x == null ? '—' : `${(x * 100).toFixed(1)}%`), cs = Object.values(results.cases), row = (a) => `| ${a.join(' | ')} |`, Rb = results.brain;
const lines = ['', 'BEFORE vs AFTER (measured now; "before" = the old MP4s and docs/MODEL_EVAL.md\'s Step 7 column)', row(['metric', 'before', 'after']), row(['---', '---', '---'])];
for (const c of cs) lines.push(row([`near-still share — ${c.name} (${c.seconds} s)`, c.stillBefore == null ? '— (new)' : `${c.stillBefore}%`, `${c.stillAfter}% ${c.stillAfter < 8 ? '(<8% ✓)' : '(≥8% ✗)'}`]));
const sum = (k) => cs.reduce((a, c) => a + c[k], 0), shotsN = sum('shots');
lines.push(row(['auto b-roll cards', 'none (no b-roll kit)', `${sum('brollAuto')} on ${shotsN} shots`]), row(['charts (dynamic comparison)', 'none', String(sum('charts'))]), row(['shots with motion graphics', 'none', String(sum('graphics'))]),
  row(['headline captions', 'none', String(sum('headlines'))]), row(['camera moves', 'none', String(sum('cameraMoves'))]), row(['procedural creatures in a cast', 'none', String(sum('creations'))]),
  row(['QA repairs / errors left', '3-rule QA', `${sum('qaRepairs')} / ${sum('qaRemainingErrors')}`]), row(['physics corrections', '—', String(sum('physicsFixes'))]),
  row(['body + physics gate', '—', `${cs.filter((c) => c.gate.ok).length}/${cs.length} films, ${sum('shots') ? cs.reduce((a, c) => a + c.gate.frames, 0) : 0} frames, ${cs.reduce((a, c) => a + c.gate.faults, 0)} faults`]),
  row(['video QA', '—', `${cs.filter((c) => c.videoQa.ok).length}/${cs.length} pass`]));
const hb = { place: '61.0%', action: '57.0%', face: '47.0%', broll: '55.5%', graphic: '78.0%', cameraMove: '70.5%' };
for (const h of ['place', 'action', 'face', 'broll', 'graphic', 'cameraMove']) lines.push(row([`brain ${h} — holdout-200 (independent)`, `${hb[h]} (Step 7)`, pc(Rb.holdout200[h].acc)]));
lines.push(row(['brain roles F1 — holdout-200', '90.9% (Step 7)', pc(Rb.holdout200.roles.f1)]));
for (const h of ['place', 'action', 'face']) lines.push(row([`brain ${h} — owner's real-34`, '—', `${pc(Rb.real34[h].acc)}${h === 'action' ? ` (v1's 8: ${pc(Rb.real34.actionCoarse)})` : ''}`]));
lines.push(row(["brain roles F1 — owner's real-34", '—', pc(Rb.real34.roles.f1)]), row(['brain broll / graphic / camera — real-34', '—', 'not labelled in real-test.jsonl']));
lines.push(row(['AES-256-GCM vault + owner hub tests', 'none', `${results.securityHub.pass ? 'PASS' : 'FAIL'} (${results.securityHub.okLines} checks)`]), row(['studio UI test', '—', `${results.ui.pass ? 'PASS' : 'FAIL'} (${results.ui.okLines} checks)`]), row(['server/no-ai.mjs unchanged', '', results.noAiUnchanged ? 'yes' : 'NO']));
console.log(lines.join('\n')); fs.writeFileSync(path.join(out, 'before-after.md'), lines.join('\n') + '\n');
