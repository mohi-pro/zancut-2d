// Zancut 2D: one local app. Voice + story in, a finished 2D animation out.
// Flow: recorded voice → local words → own-brain scene file → deterministic engine → render.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as store from './store.mjs';
import { localOwner } from './local-owner.mjs';
import * as agent from './agent.mjs';
import * as board from './board.mjs';
import * as studio from './studio.mjs';
import { probe } from './media.mjs';
import { PORT, HOST } from './config.mjs';
import * as codefilm from './codefilm.mjs';
import { check, repair } from './qa.mjs';
import { checkVideo } from './videoqa.mjs';
import * as autopilot from './autopilot.mjs';
import { previewShot } from './preview.mjs';
import { libraryCatalog } from './filmkit.mjs';
import { planFromBrain, teachFromFilm, retrain, brainInfo, sentencesFromWords, brain as brainModel } from './brainplan.mjs';
import { predict as predictBrain } from './brain.mjs';
import { firstCutWords, jobDir } from './director.mjs';
import { createCreation, getCreation, listCreations } from './procedural-creator.mjs';
import { assetCatalog, assetSvg } from './power-libraries.mjs';
import { learn, knowledge, learnedProps, webStatus, learnUnknown } from './web-learner.mjs';
const learnedPropsNow = () => learnedProps();
import { resolveStory, concepts } from './entity-resolver.mjs';
import { hubRouter } from './central-hub.mjs';
import { adminRouter, previewFile } from './admin.mjs';
import { runCommand } from './command.mjs';
import { TEMPLATES } from './broll.mjs';
import { DATA_DIR as DATA } from './config.mjs';

const UI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'ui');
const app = express();

// one local owner: no sign-in
const owner = localOwner();

const FORMATS = ['16:9', '9:16', '1:1', '4:5'];
const AUDIO = /\.(mp3|wav|m4a|aac|ogg|flac|webm|mp4|mov)$/i;
const safe = (s) => String(s || 'voice').replace(/[^\w.\- ]+/g, '_').slice(0, 80);
const view = (p) => ({
  id: p.id, name: p.name, status: p.status, error: p.error, job: p.job && { kind: p.job.kind, steps: (p.job.steps || []).slice(-12), startedAt: p.job.startedAt },
  language: p.language, format: p.format, animFormat: p.animFormat, narratorGender: p.narratorGender, instructions: p.instructions,
  film: p.film || null, canUndo: (p.filmAt ?? 0) > 0, canRedo: (p.filmRevs?.length ?? 0) - 1 > (p.filmAt ?? 0), format: p.format, voice: (p.assets || []).find((a) => a.role === 'voiceover') || null, stage: p.stage2d || 'draft',
  animation: p.animation || null, versions: (p.versions || []).map((v) => ({ qa: v.qa || null, music: v.music || null, n: v.n, file: v.file, duration: v.duration, width: v.width, height: v.height, createdAt: v.createdAt })), costUsd: p.costUsd || 0,
});
const need = (req, res) => { const p = store.get(req.params.id); if (!p) { res.status(404).json({ error: 'Project not found' }); return null; } return p; };
const BUSY = ['queued', 'editing'];
// the scene file's history: every save is a revision (kept on disk, so undo/redo survive a restart); at most 60
function pushFilm(p, film) {
  p.filmRevs = (p.filmRevs || (p.film ? [p.film] : [])).slice(0, (p.filmAt ?? (p.film ? 0 : -1)) + 1); p.filmRevs.push(film);
  if (p.filmRevs.length > 60) p.filmRevs.shift(); p.filmAt = p.filmRevs.length - 1; p.film = film; p.board = null;
}
function stepFilm(p, d) { const i = (p.filmAt ?? 0) + d; if (!p.filmRevs?.[i]) return false; p.filmAt = i; p.film = p.filmRevs[i]; p.board = null; return true; }

app.use(express.static(UI));
// the owner's central hub: customer sessions, the quarantine queue, approvals, encrypted brain updates (server/central-hub.mjs)
app.use('/api/hub', hubRouter());
// the owner's training studio (ui/admin.html; every /api/admin route needs the owner's hub session)
app.get('/admin', (req, res) => res.sendFile(path.join(UI, 'admin.html')));
app.use('/api/admin', adminRouter());
app.get(/^\/admin\/preview\/([a-z0-9]+)\/(.+)$/, (req, res) => { const f = previewFile(req.params[0], decodeURIComponent(req.params[1])); f ? res.sendFile(f) : res.status(404).end(); });
app.get('/api/autopilot', (req, res) => res.json(autopilot.state()));
app.post('/api/autopilot', express.json(), (req, res) => res.json(autopilot.set(!!req.body?.on)));
app.get('/api/brain', (req, res) => res.json(brainInfo()));
app.post('/api/brain/retrain', (req, res) => res.json(retrain()));
// teach the brain from this storyboard: the changed shots are learned at once (Brain v2 adapts in place, feedback weighted 5×)
app.post('/api/projects/:id/teach', (req, res) => {
  const p = need(req, res); if (!p?.film) return res.status(409).json({ error: 'No storyboard to learn from.' });
  const t0 = Date.now(), n = teachFromFilm(p.film, { changedOnly: req.body?.all !== true }); store.save(p, { immediate: true }); res.json({ learned: n, ms: Date.now() - t0, ...brainInfo() });
});
app.get('/api/places', (req, res) => res.json(codefilm.placeIds()));
app.get('/api/creations', (req, res) => res.json(listCreations()));
// self-learning knowledge (server/web-learner.mjs): local first; the open web only when the request asks for it ("online": true)
app.get('/api/knowledge', (req, res) => res.json({ concepts: knowledge(), props: Object.keys(learnedProps()), web: webStatus() }));
app.post('/api/learn', express.json({ limit: '4kb' }), async (req, res) => { try { res.json(await learn(String(req.body?.term || ''), { online: req.body?.online === true })); } catch (e) { res.status(400).json({ error: e.message }); } });
app.post('/api/entities', express.json({ limit: '64kb' }), (req, res) => { const s = Array.isArray(req.body?.sentences) ? req.body.sentences.slice(0, 200).map(String) : []; res.json({ ...resolveStory(s), concepts: s.map((x) => concepts(x).map((c) => c.id)) }); });
app.get('/api/creations/:id', (req, res) => { const c = getCreation(req.params.id); c ? res.json(c) : res.status(404).json({error:'Creation not found.'}); });
app.post('/api/creations', express.json({limit:'16kb'}), (req,res) => {
  try { const c = createCreation(req.body?.phrase); res.json({...c,castSpec:{creation:c.id}}); }
  catch(e) { res.status(400).json({error:e.message}); }
});
app.get('/api/vector-assets', (req,res) => {
  try { res.json(assetCatalog(String(req.query.source || 'openmoji'),{q:String(req.query.q || ''),limit:req.query.limit})); }
  catch(e) {res.status(400).json({error:e.message});}
});
app.get('/api/vector-assets/:source/:id.svg', (req,res) => {
  try {res.type('image/svg+xml').set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; sandbox").send(assetSvg(req.params.source,req.params.id));}
  catch(e) {res.status(e.code === 'ENOENT'?404:400).json({error:'Local SVG not found.'});}
});
app.get('/api/example', (req, res) => res.sendFile(path.join(UI, '..', 'examples', 'rafi.film.json')));

app.get('/api/projects', (req, res) => res.json(store.list().filter((p) => p.kind === 'animation' && !p.sandbox).map(view))); // owner sandboxes (/admin) stay out of the customer's list
app.post('/api/projects', express.json(), (req, res) => {
  const b = req.body || {};
  const p = store.create({ name: String(b.name || 'New animation').slice(0, 60), ownerId: owner.id, mode: 'faceless', language: b.language || 'bn', instructions: String(b.instructions || '').slice(0, 6000), script: String(b.script || '').slice(0, 20000) });
  const set = { format: FORMATS.includes(b.format) ? b.format : '16:9', kind: 'animation', theme: 'light', palette: 'zancut', designStyle: '2d-animation', pace: 'normal', noise: 'auto' };
  for (const k of studio.STUDIO_FIELDS) { const v = studio.cleanStudio(k, set[k]); if (v !== undefined) p[k] = v; }
  p.kind = 'animation'; p.aiVoice = false; p.setupDone = true;
  p.animFormat = ['mixed', 'dialogue', 'narration'].includes(b.animFormat) ? b.animFormat : 'mixed'; p.narratorGender = b.narratorGender === 'female' ? 'female' : 'male';
  studio.syncLegacy(p); store.save(p, { immediate: true });
  res.json(view(p));
});
app.get('/api/projects/:id', (req, res) => { const p = need(req, res); if (p) res.json(view(p)); });
app.patch('/api/projects/:id', express.json(), (req, res) => {
  const p = need(req, res); if (!p) return;
  if (BUSY.includes(p.status)) return res.status(409).json({ error: 'Wait until it finishes.' });
  const b = req.body || {};
  for (const k of ['name', 'language', 'instructions', 'script']) if (typeof b[k] === 'string') p[k] = b[k].slice(0, 20000);
  if (FORMATS.includes(b.format)) p.format = b.format;
  if (['mixed', 'dialogue', 'narration'].includes(b.animFormat)) p.animFormat = b.animFormat;
  if (['male', 'female'].includes(b.narratorGender)) p.narratorGender = b.narratorGender;
  store.save(p, { immediate: true }); res.json(view(p));
});
// the scene file: who is where, doing what (no AI: the engine draws it from the library)
app.put('/api/projects/:id/film', express.json({ limit: '2mb' }), (req, res) => {
  const p = need(req, res); if (!p) return;
  if (BUSY.includes(p.status)) return res.status(409).json({ error: 'Wait until it finishes.' });
  const errs = codefilm.validate(req.body); if (errs.length) return res.status(400).json({ error: errs.join(' ') });
  pushFilm(p, req.body); store.save(p, { immediate: true }); res.json(view(p));
});
// the story script → a scene file (rules, no model). The voice's length times the shots.
app.post('/api/projects/:id/plan', express.json({ limit: '2mb' }), async (req, res) => {
  const p = need(req, res); if (!p) return;
  const text = String(req.body?.script ?? p.script ?? '').trim(), voice = (p.assets || []).find((a) => a.role === 'voiceover');
  if (!text) { // no script: plan from the voice itself (its words and their times)
    if (!voice) return res.status(400).json({ error: 'Paste the script, or upload the voice and plan from it.' });
    if (BUSY.includes(p.status) || running.has(p.id)) return res.status(409).json({ error: 'Already working on it.' });
    planFromVoice(p.id); return res.json({ ...view(p), planning: true });
  }
  try {
    const film = planFromBrain(text, { duration: voice?.duration || 0, title: p.name });
    const errs = codefilm.validate(film); if (errs.length) return res.status(400).json({ error: errs.join(' ') });
    p.script = text; pushFilm(p, film); store.save(p, { immediate: true }); res.json(view(p));
  } catch (e) { res.status(400).json({ error: e.message }); }
});
for (const dir of ['undo', 'redo']) app.post(`/api/projects/:id/film/${dir}`, (req, res) => {
  const p = need(req, res); if (!p) return;
  if (!stepFilm(p, dir === 'undo' ? -1 : 1)) return res.status(409).json({ error: `Nothing to ${dir}.` });
  store.save(p, { immediate: true }); res.json(view(p));
});
// QA on the current scene file (with the voice's length); repair applies the allowlisted fixes
app.get('/api/projects/:id/qa', (req, res) => { const p = need(req, res); if (!p) return; if (!p.film) return res.json({ issues: [] }); const v = (p.assets || []).find((a) => a.role === 'voiceover'); res.json({ issues: check(p.film, { duration: v?.duration || 0 }) }); });
app.post('/api/projects/:id/qa/repair', (req, res) => {
  const p = need(req, res); if (!p) return; if (!p.film) return res.status(409).json({ error: 'No scene file.' });
  const v = (p.assets || []).find((a) => a.role === 'voiceover'), r = repair(p.film, { duration: v?.duration || 0 });
  pushFilm(p, r.film); store.save(p, { immediate: true }); res.json({ log: r.log, remaining: r.remaining, project: view(p) });
});
// the library: places and actions the engine really has (read-only)
app.get('/api/library', (req, res) => {
  const c = libraryCatalog(), q = String(req.query.q || '').toLowerCase(), f = (l) => l.filter((x) => !q || `${x.id} ${x.about || ''} ${x.group || ''}`.toLowerCase().includes(q)).slice(0, 80);
  res.json({ brollTemplates: Object.values(TEMPLATES).map((t) => ({ id: t.id, about: t.about })), graphicKinds: ['dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card', 'thought_cloud', 'comic_emotion_fx'], cameraMoves: ['slow_push_in', 'slow_pull_out', 'gentle_pan', 'impact_shake', 'over_the_shoulder'], places: codefilm.placeIds(), basicActions: codefilm.BASIC_ACTIONS, actions: f(c.actions), gestures: f(c.gestures), set: f(c.set), props: f(c.props), counts: { actions: c.actions.length, gestures: c.gestures.length, set: c.set.length, props: c.props.length, hands: c.hands.length } });
});
// the command bar: a rule, a creation, a word to learn, or a sentence to predict (server/command.mjs)
app.post('/api/command', express.json({ limit: '8kb' }), async (req, res) => { try { res.json(await runCommand(req.body?.text, { online: req.body?.online === true })); } catch (e) { res.status(e.status || 400).json({ error: String(e.message).slice(0, 300) }); } });
// what the brain thinks of each shot's sentence (with its neighbours and the place so far), for the confidence badges
app.get('/api/projects/:id/brain', (req, res) => {
  const p = need(req, res); if (!p) return; const S = p.film?.plan?.sentences || []; if (!p.film || !S.length) return res.json({ shots: [] });
  const m = brainModel(); res.json({ shots: p.film.shots.map((s) => { const i = (s.sentence || 0) - 1; if (i < 0 || !S[i]) return null; const r = predictBrain(m, { currentText: S[i].text, prevText: S[i - 1]?.text || '', nextText: S[i + 1]?.text || '', prevPlace: 'none' });
    return Object.fromEntries(['place', 'action', 'face', 'broll', 'graphic', 'cameraMove'].map((h) => [h, { label: r[h].label, conf: Math.round(r[h].conf * 100) }])); }) });
});
// learn the story's unknown words (local first; the open web only when asked) and show what was learned
app.post('/api/projects/:id/learn-unknown', express.json(), async (req, res) => {
  const p = need(req, res); if (!p) return; const S = (p.film?.plan?.sentences || []).map((x) => x.text); if (!S.length) return res.status(409).json({ error: 'Plan the story first: the words come from its sentences.' });
  try { const done = await learnUnknown(S, { online: req.body?.online === true, max: 6 }); const props = learnedPropsNow();
    res.json({ learned: done.map((r) => ({ term: r.term, category: r.category, english: r.english, prop: r.prop, svg: r.prop && props[r.prop] ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${props[r.prop].body}</svg>` : null, sources: r.sources.map((x) => x.kind), from: r.from })) }); }
  catch (e) { res.status(500).json({ error: String(e.message).slice(0, 300) }); }
});
// a still of a new creation, drawn by the real engine in a plain place
app.post('/api/creations/:id/preview', express.json(), async (req, res) => {
  const c = getCreation(req.params.id); if (!c) return res.status(404).json({ error: 'Creation not found.' });
  const film = { cast: { c: { creation: c.id, gender: 'male', age: 'adult' } }, shots: [{ at: 0, place: req.body?.place && codefilm.placeIds().includes(req.body.place) ? req.body.place : 'park', camera: { kind: 'wide', on: 'c' }, people: [{ who: 'c', x: 0, dz: 1, do: 'idle' }] }] };
  try { const f = await previewShot(film, 0, path.join(DATA, 'creation-previews', c.id), '16:9'); res.json({ url: `/creation-preview/${c.id}/${path.basename(f)}?t=${Date.now()}` }); } catch (e) { res.status(500).json({ error: String(e.message).slice(0, 300) }); }
});
app.get('/creation-preview/:id/:file', (req, res) => { if (!/^creation_[a-f0-9]{20}$/.test(req.params.id)) return res.status(404).end(); const f = path.join(DATA, 'creation-previews', req.params.id, 'previews', path.basename(req.params.file)); fs.existsSync(f) ? res.sendFile(f) : res.status(404).end(); });
// a still of one shot, drawn by the real engine (same page the render uses)
app.post('/api/projects/:id/preview', express.json(), async (req, res) => {
  const p = need(req, res); if (!p?.film) return res.status(409).json({ error: 'No scene file.' });
  try { const f = await previewShot(p.film, Number(req.body?.shot) || 0, store.dirs(p.id).root, p.format); res.json({ url: `/preview/${p.id}/${path.basename(f)}?t=${Date.now()}` }); } catch (e) { res.status(500).json({ error: String(e.message).slice(0, 300) }); }
});
app.get('/preview/:id/:file', (req, res) => { const p = need(req, res); if (!p) return; const f = path.join(store.dirs(p.id).root, 'previews', path.basename(req.params.file)); fs.existsSync(f) ? res.sendFile(f) : res.status(404).end(); });
// the voice recording: one request, the whole file
app.post('/api/projects/:id/voice', express.raw({ type: '*/*', limit: '1gb' }), async (req, res) => {
  const p = need(req, res); if (!p) return;
  const name = safe(req.query.name); if (!AUDIO.test(name)) return res.status(400).json({ error: 'Use an audio file (mp3, wav, m4a…).' });
  const d = store.dirs(p.id); fs.mkdirSync(d.assets, { recursive: true });
  for (const a of (p.assets || []).filter((x) => x.role === 'voiceover')) fs.rmSync(path.join(d.assets, a.file), { force: true });
  const dest = path.join(d.assets, name); fs.writeFileSync(dest, req.body);
  const info = await probe(dest).catch(() => null);
  if (!info?.hasAudio) { fs.rmSync(dest, { force: true }); return res.status(400).json({ error: 'That file has no sound we can read.' }); }
  p.assets = (p.assets || []).filter((x) => x.role !== 'voiceover');
  p.assets.push({ file: name, original: name, role: 'voiceover', size: fs.statSync(dest).size, duration: info.duration || null, hasAudio: true, note: '', addedAt: Date.now() });
  p.transcript = null; p.board = null; store.save(p, { immediate: true }); res.json(view(p));
});

// ---- the whole make: words → plan → pictures → render, one after another ----
const wait = (id) => new Promise((ok) => { const t = setInterval(() => { const p = store.get(id); if (!p || !BUSY.includes(p.status)) { clearInterval(t); ok(p); } }, 1500); });
const running = new Set();
async function make(id) {
  const stage = (s) => { const p = store.get(id); p.stage2d = s; store.save(p, { immediate: true }); };
  const run = async (kind, label) => { stage(label); agent.enqueue(id, kind); await new Promise((r) => setTimeout(r, 400)); const p = await wait(id); if (p.status === 'error' || p.error) throw new Error(p.error || `${label} failed`); return p; };
  try {
    let p = store.get(id);
    if (!p.transcript) p = await run('prepare', 'words');
    if (!p.transcript) throw new Error('The words could not be made from the voice.');
    if (!p.trim?.confirmed) { // 2D keeps the whole voice: nothing is trimmed
      p.trim = { ranges: [], magic: false, confirmed: true }; board.applyTrim(store.dirs(id), p); p.scriptAt = Date.now(); store.save(p, { immediate: true });
    }
    p = store.get(id);
    if (!p.board) p = await run('storyboard', 'plan');
    p = await run('render', 'render');
    try { // the finished file is examined: size, fps, length, audio, black or frozen stretches
      const v = p.versions.at(-1), voice = (p.assets || []).find((a) => a.role === 'voiceover'); stage('checking');
      v.qa = checkVideo(path.join(store.dirs(id).out, v.file), { expectSeconds: voice?.duration || 0, format: p.format || '16:9' });
      try { const m = JSON.parse(fs.readFileSync(path.join(store.dirs(id).ws, 'job', 'edit', 'plan.json'), 'utf8')).music; if (m) v.music = { title: m.title, mood: m.mood, credit: m.credit, license: m.license }; } catch {}
      store.save(p, { immediate: true });
    } catch (e) { console.error('[videoqa]', e.message); }
    stage('done');
  } catch (e) { const p = store.get(id); if (p) { p.stage2d = 'failed'; p.error = p.error || e.message; store.save(p, { immediate: true }); } console.error('[make]', id, e.message); }
  finally { running.delete(id); }
}
async function planFromVoice(id) {
  running.add(id);
  try {
    let p = store.get(id); p.stage2d = 'words'; p.error = null; store.save(p, { immediate: true });
    if (!p.transcript) { agent.enqueue(id, 'prepare'); await new Promise((r) => setTimeout(r, 400)); p = await wait(id); if (!p.transcript) throw new Error(p.error || 'The words could not be made from the voice.'); }
    const words = firstCutWords(jobDir(store.dirs(id).ws)), timed = sentencesFromWords(words); if (!timed.length) throw new Error('No words were heard in the voice.');
    const voice = (p.assets || []).find((a) => a.role === 'voiceover'), film = planFromBrain('', { duration: voice?.duration || 0, title: p.name, timed });
    film.plan.mode += ' · from the voice'; pushFilm(p, film); p.stage2d = 'draft'; store.save(p, { immediate: true });
  } catch (e) { const p = store.get(id); p.error = e.message; p.stage2d = 'failed'; store.save(p, { immediate: true }); }
  finally { running.delete(id); }
}
app.post('/api/projects/:id/make', (req, res) => {
  const p = need(req, res); if (!p) return;
  if (running.has(p.id) || BUSY.includes(p.status)) return res.status(409).json({ error: 'Already working on it.' });
  if (!(p.assets || []).some((a) => a.role === 'voiceover')) return res.status(400).json({ error: 'Upload the voice first.' });
  if (!p.film) return res.status(400).json({ error: 'Add the scene file first.' });
  try { if (teachFromFilm(p.film, { changedOnly: true })) retrain(); } catch (e) { console.error('[brain]', e.message); } // the owner's corrections teach the brain
  p.error = null; store.save(p, { immediate: true }); running.add(p.id); make(p.id); res.json(view(p));
});
app.post('/api/projects/:id/cancel', (req, res) => { const p = need(req, res); if (!p) return; agent.cancel(p.id); running.delete(p.id); res.json(view(store.get(p.id))); });
app.get('/video/:id/:file', (req, res) => {
  const p = need(req, res); if (!p) return;
  const f = path.join(store.dirs(p.id).out, path.basename(req.params.file));
  if (!fs.existsSync(f)) return res.status(404).end();
  req.query.dl ? res.download(f) : res.sendFile(f);
});

app.listen(PORT, HOST, () => { console.log(`Zancut 2D → http://${HOST}:${PORT}`); autopilot.start(); });
