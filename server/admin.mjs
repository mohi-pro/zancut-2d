// /admin — the owner's training studio (ui/admin.html). Every route needs the owner's hub session (server/central-hub.mjs).
//   feed      — bulk sentences / .txt / .jsonl → the brain's reading → owner-checked labels → data/brain/fed.jsonl (weight 2)
//   topic     — Wikipedia / Wikidata facts for a topic (server/web-learner.mjs: facts and open-licence icons, never a model)
//   teacher   — N labelled training sentences for a topic by OFFLINE template expansion (no model: CLAUDE.md forbids model APIs)
//   video     — a reference video's pacing measured with ffmpeg (cuts, motion, pauses, loudness) → data/brain/style-profile.json
//   rules     — strict Do's and Don'ts (server/strict-rules.mjs)
//   sandbox   — a story → brain + strict rules + QA + physics → a playable preview page (zen compose), with the decision receipt;
//               👍 teaches the shot as it is, 👎 corrects it, teaches the correction and rebuilds the preview
// The real-sentence test set (brain/real-test.jsonl) and holdout-200 are never fed: brain.feedMany refuses them.
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, execFileSync } from 'node:child_process';
import { DATA_DIR } from './config.mjs';
import * as store from './store.mjs';
import * as agent from './agent.mjs';
import { verify } from './central-hub.mjs';
import { predict, feedMany, testOverlap, HEADS, learnMany } from './brain.mjs';
import { brain as model, forget, planFromBrain, sentencesFromWords } from './brainplan.mjs';
import { sentences as splitSentences } from './scriptplan.mjs';
import { learn as webLearn, learnUnknown } from './web-learner.mjs';
import { sense } from './scene-sense.mjs';
import { listRules, addRule, setRule, deleteRule, parseStrict } from './strict-rules.mjs';
import { resolvePlace } from './place-registry.mjs';
import { matchTemplate } from './broll.mjs';
import { firstCutWords, jobDir, zen } from './director.mjs';
import { localOwner } from './local-owner.mjs';
import { measureMotion } from './motionqa.mjs';
import * as codefilm from './codefilm.mjs';

const NF = (s) => String(s ?? '').normalize('NFC');
const LABEL_HEADS = ['place', 'action', 'face', 'broll', 'graphic', 'cameraMove'];
const ADMIN = () => path.join(DATA_DIR, 'admin');
const owner = (req) => verify(req.get('authorization'), { role: 'owner' });
const guard = (fn) => async (req, res) => { try { owner(req); res.json(await fn(req, res)); } catch (e) { if (!res.headersSent) res.status(e.status || 400).json({ error: String(e.message || e).slice(0, 400) }); } };
const err = (status, message) => Object.assign(new Error(message), { status });

// ---------- 1. the multi-source feeder ----------
// text: one sentence per line, a story (split into sentences), or JSONL rows { text, place?, action?, … }
export async function readFeed(raw, { online = false, learnWords = true } = {}) {
  const lines = NF(raw).split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const asJson = (l) => { if (!l.startsWith('{')) return null; try { const x = JSON.parse(l); return typeof x?.text === 'string' ? x : null; } catch { return null; } };
  const rows = lines.flatMap((l) => asJson(l) ? [asJson(l)] : splitSentences(l).map((text) => ({ text }))); // a JSONL row, or sentences
  if (rows.length > 1000) throw err(413, `At most 1,000 sentences at once (got ${rows.length}).`);
  // 1. the words it does not know yet are learned first (local knowledge; the open web when allowed): facts, a picture, a place
  const learned = learnWords ? (await learnUnknown(rows.map((r) => r.text), { online, max: Math.min(40, 4 + Math.ceil(rows.length / 10)) }).catch(() => [])).map((x) => ({ term: x.term, category: x.category, piece: x.piece || null, prop: x.prop || null, place: x.place || null, from: x.from })) : [];
  // 2. the scene each line is about (a named or learned place, the home of the animals it names) beats the brain's guess
  const m = model();
  const out = rows.map((r, i) => {
    const p = predict(m, { currentText: r.text, prevText: rows[i - 1]?.text || '', nextText: rows[i + 1]?.text || '', prevPlace: 'none' }), sn = sense(r.text), sp = sn.place || sn.home, useScene = !r.place && sp && HEADS.place.includes(sp);
    const labels = Object.fromEntries(LABEL_HEADS.map((h) => [h, r[h] && HEADS[h].includes(r[h]) ? r[h] : h === 'place' && useScene ? sp : p[h].label]));
    return { text: NF(r.text), ctx: r.ctx || { prevText: rows[i - 1]?.text || '', nextText: rows[i + 1]?.text || '', prevPlace: 'none' }, labels, conf: Object.fromEntries(LABEL_HEADS.map((h) => [h, r[h] || (h === 'place' && useScene) ? 1 : Math.round(p[h].conf * 100) / 100])), given: LABEL_HEADS.filter((h) => r[h]), scene: { place: sp || null, time: sn.time, things: sn.things.map((t) => t.id) }, test: testOverlap(r.text) };
  });
  out.learned = learned; return out;
}
export function feed(rows) {
  const out = feedMany(rows.map((r) => ({ text: r.text, ctx: r.ctx, ...(r.labels || r) })));
  forget(); return out;
}

// ---------- 2. topics from the open web (facts only) ----------
export async function feedTopics(topics, { online = true } = {}) {
  const list = NF(topics).split(/[,،;\n]+/).map((t) => t.trim()).filter(Boolean).slice(0, 12), out = [];
  for (const t of list) { try { const r = await webLearn(t, { online }); out.push({ topic: t, known: !!r.known, category: r.category, english: r.english || null, prop: r.prop || null, synonyms: (r.synonyms || []).slice(0, 8), sources: (r.sources || []).map((s) => s.kind || s) }); } catch (e) { out.push({ topic: t, error: e.message }); } }
  return out;
}

// ---------- 3. the offline teacher: N labelled sentences for a topic (template expansion, no model) ----------
const NAMES = ['রাফি', 'মিনা', 'করিম', 'নাবিলা', 'জিসান', 'তানিয়া', 'সাকিব', 'রুমানা'];
const NUMS = [['২০', '৩৫'], ['৪০', '৬৫'], ['১২', '১৮'], ['৫০', '৮০'], ['১০০', '১৪০'], ['৭', '১১']];
const BN = [
  (T, n) => `${n} আজ ${T} নিয়ে কথা বলছে।`, (T, n) => `${T} নিয়ে ${n} খুব চিন্তিত।`, (T, n) => `${n} বলল, ${T} আমাদের জীবনে খুব জরুরি।`,
  (T, n) => `আজকের খবরে ${T} এর কথা এসেছে।`, (T, n) => `${n} সবাইকে ${T} সম্পর্কে বুঝিয়ে বলল।`, (T, n) => `${T} দেখে ${n} অবাক হয়ে গেল।`,
  (T, n) => `চলুন, আজ ${T} সম্পর্কে জানি।`, (T, n) => `${n} ভাবছে, ${T} কেন এত গুরুত্বপূর্ণ?`, (T, n) => `${n} হাসিমুখে ${T} এর গল্প শোনাল।`,
  (T, n, a, b) => `গত বছর ${T} ছিল ${a}, এ বছর ${b}।`, (T, n, a, b) => `${T} ${a} থেকে বেড়ে ${b} হয়েছে।`, (T, n) => `${n} খাতায় ${T} নিয়ে লিখছে।`,
  (T, n) => `সবাই মিলে ${T} নিয়ে আলোচনা করল।`, (T, n) => `${n} জিজ্ঞেস করল, ${T} আসলে কী?`, (T, n) => `${T} এর কারণে ${n} খুশি।`,
];
const EN = [(T, n) => `${n} is talking about ${T} today.`, (T, n) => `Everyone wants to know more about ${T}.`, (T, n) => `${n} explains ${T} to his friends.`, (T, n, a, b) => `Last year ${T} was ${a}, now it is ${b}.`, (T, n) => `${n} is worried about ${T}.`];
export function teacher(topic0, { n = 100, labels = {} } = {}) {
  const T = NF(topic0).trim(); if (!T || T.length > 80) throw err(400, 'Name one topic (up to 80 characters).');
  const N = Math.max(10, Math.min(300, Number(n) || 100)), m = model(), probe = predict(m, `${T} নিয়ে আজ সবাই কথা বলছে।`);
  // the topic's own labels: a named place (place registry), a b-roll its words call for (broll kit), else what the brain reads
  const base = { place: resolvePlace(T) || (probe.place.conf >= 0.5 ? probe.place.label : null), broll: matchTemplate(T)?.id || null, graphic: null, cameraMove: null, ...Object.fromEntries(Object.entries(labels).filter(([h, v]) => HEADS[h]?.includes(v))) };
  const out = [], seen = new Set(); let k = 0;
  while (out.length < N && k < N * 6) {
    // every template × name × number pair in turn (Bangla templates, then an English one every fifth row)
    const ALL = [...BN.map((f) => [f, NAMES]), ...EN.map((f) => [f, ['Rafi', 'Mina', 'Karim', 'Nabila']])], [f, names] = ALL[k % ALL.length], nm = names[Math.floor(k / ALL.length) % names.length], round = Math.floor(k / (ALL.length * names.length)), [a, b] = NUMS[round % NUMS.length], bn = names === NAMES;
    const PRE = bn ? ['', 'সকালে ', 'বিকেলে ', 'হঠাৎ ', 'সেদিন '] : ['', 'Today, ', 'In the evening, ', 'Suddenly, '], raw = f(T, nm, a, b), text = f.length > 2 ? raw : PRE[round % PRE.length] + (bn || !PRE[round % PRE.length] ? raw : raw[0].toLowerCase() + raw.slice(1)); k++;
    if (seen.has(text) || testOverlap(text)) continue; seen.add(text);
    const nums = /[0-9০-৯].*[0-9০-৯]/.test(text), p = predict(m, text);
    out.push({ text, labels: { place: base.place || p.place.label, action: p.action.label, face: p.face.label, broll: base.broll || (p.broll.conf >= 0.6 ? p.broll.label : 'none'), graphic: base.graphic || (nums ? 'dynamic_comparison_chart' : p.graphic.label), cameraMove: base.cameraMove || p.cameraMove.label } });
  }
  return { topic: T, rows: out, base, note: 'Offline template expansion (no model). Check the labels, change any column, then feed.' };
}

// ---------- 4. a reference video's style, measured ----------
const ffprobeSeconds = (f) => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f], { encoding: 'utf8' }).trim()) || 0;
export function analyzeVideo(file) {
  const seconds = ffprobeSeconds(file); if (!(seconds > 0.5)) throw err(400, 'That file has no readable video.');
  const r = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'info', '-i', file, '-an', '-vf', "fps=10,scale=320:-2,select='gte(scene,0)',metadata=print:key=lavfi.scene_score", '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28, timeout: 15 * 60000 });
  const scores = []; let t = null;
  for (const line of String(r.stderr).split('\n')) { const a = /pts_time:([\d.]+)/.exec(line); if (a) t = +a[1]; const b = /lavfi\.scene_score=([\d.]+)/.exec(line); if (b && t != null) scores.push([t, +b[1]]); }
  const cuts = []; for (const [tt, s] of scores) if (s > 0.3 && (!cuts.length || tt - cuts.at(-1) > 0.4)) cuts.push(tt);
  const bounds = [0, ...cuts, seconds], shots = bounds.slice(1).map((x, i) => x - bounds[i]).filter((x) => x > 0.15), sorted = [...shots].sort((x, y) => x - y);
  const avg = shots.reduce((x, y) => x + y, 0) / Math.max(1, shots.length), sd = Math.sqrt(shots.reduce((x, y) => x + (y - avg) ** 2, 0) / Math.max(1, shots.length));
  const calm = scores.filter(([, s]) => s <= 0.3).map(([, s]) => s), motion = calm.length ? calm.reduce((x, y) => x + y, 0) / calm.length : 0;
  let runs = 0, run = 0; for (const [, s] of scores) { if (s > 0.008 && s <= 0.3) run++; else { if (run >= 10) runs++; run = 0; } } if (run >= 10) runs++;
  const still = (() => { try { return measureMotion(file).stillShare; } catch { return null; } })();
  const a = spawnSync('ffmpeg', ['-hide_banner', '-nostdin', '-v', 'info', '-i', file, '-vn', '-af', 'silencedetect=n=-35dB:d=0.25,ebur128=framelog=quiet', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26, timeout: 10 * 60000 }), log = String(a.stderr || '');
  const pauses = [...log.matchAll(/silence_duration:\s*([\d.]+)/g)].map((m) => +m[1]), I = /\bI:\s*(-?[\d.]+) LUFS/.exec(log.split('Summary:').at(-1) || ''), LRA = /\bLRA:\s*([\d.]+) LU/.exec(log.split('Summary:').at(-1) || '');
  const audio = /Audio:/.test(log) || /Stream #.*Audio/.test(log);
  return {
    seconds: +seconds.toFixed(2), shots: shots.length, avgShotSeconds: +avg.toFixed(2), medianShotSeconds: +(sorted[Math.floor(sorted.length / 2)] || 0).toFixed(2), shotSecondsSd: +sd.toFixed(2), cutsPerMinute: +((cuts.length / seconds) * 60).toFixed(1),
    motionIntensity: +(Math.min(1, motion * 25) * 100).toFixed(0), movementRunsPerMinute: +((runs / seconds) * 60).toFixed(1), nearlyStillShare: still == null ? null : +(still * 100).toFixed(1),
    audio: audio ? { pausesPerMinute: +((pauses.length / seconds) * 60).toFixed(1), avgPauseSeconds: pauses.length ? +(pauses.reduce((x, y) => x + y, 0) / pauses.length).toFixed(2) : 0, speechShare: +(Math.max(0, 1 - pauses.reduce((x, y) => x + y, 0) / seconds) * 100).toFixed(0), loudnessLUFS: I ? +I[1] : null, loudnessRangeLU: LRA ? +LRA[1] : null, ducking: 'not measurable from one mixed track (needs the voice and music stems)' } : null,
    method: 'ffmpeg scene score at 10 fps (cut > 0.3), freezedetect, silencedetect −35 dB, EBU R128. Movement runs = ≥ 1 s of steady picture change (camera or subject; ffmpeg cannot tell which).',
  };
}
const styleFile = () => path.join(DATA_DIR, 'brain', 'style-profile.json');
export function applyStyle(profile, source = '') {
  const shotSeconds = Math.max(1.8, Math.min(6, Number(profile?.avgShotSeconds) || 3.5));
  const out = { ...profile, source, applied: { shotSeconds, at: new Date().toISOString() } }; fs.mkdirSync(path.dirname(styleFile()), { recursive: true }); fs.writeFileSync(styleFile(), JSON.stringify(out, null, 1)); return out;
}

// ---------- 5. the sandbox: a story → a playable preview + the decision receipt ----------
const RANDOM = [
  'রাফি সকালে উঠে জানালা খুলল। বাইরে হালকা বৃষ্টি পড়ছে। মা রান্নাঘরে চা বানাচ্ছেন। রাফি ছাতা হাতে স্কুলের দিকে রওনা দিল। পথে বন্ধু করিমের সাথে দেখা হলো।',
  'মিনা বাজারে গেল সবজি কিনতে। গত সপ্তাহে আলুর দাম ছিল ৩০ টাকা, আজ ৪৫ টাকা। দোকানদার হেসে বলল, সব জিনিসের দাম বেড়েছে। মিনা চিন্তিত মুখে বাড়ি ফিরল।',
  'বিকেলে মাঠে ক্রিকেট খেলা শুরু হলো। সাকিব ব্যাট হাতে মাঠে নামল। প্রথম বলেই ছক্কা! সবাই আনন্দে চিৎকার করে উঠল।',
  'নাবিলা লাইব্রেরিতে বসে বই পড়ছিল। হঠাৎ তার ফোন বেজে উঠল। বাবা বললেন, তাড়াতাড়ি বাড়ি এসো। নাবিলা ব্যাগ গুছিয়ে বের হয়ে গেল।',
  'গ্রামের ৭০ শতাংশ কৃষক এখন নতুন ধান চাষ করেন। করিম চাচা মাঠে কাজ করছেন। তাঁর ছেলে জিসান ঘুড়ি ওড়াচ্ছে। সন্ধ্যায় সবাই উঠানে গল্প করতে বসল।',
];
const jobs = new Map(); // sandbox id → { stage, error, at }
const BUSY = ['queued', 'editing'];
const waitIdle = (id) => new Promise((ok) => { const t = setInterval(() => { const p = store.get(id); if (!p || !BUSY.includes(p.status)) { clearInterval(t); ok(p); } }, 400); });
const run = async (id, kind) => { agent.enqueue(id, kind); await new Promise((r) => setTimeout(r, 300)); const p = await waitIdle(id); if (p?.error) throw new Error(p.error); return p; };
export function randomStory(seed = Date.now()) { return RANDOM[Math.abs(Math.floor(seed)) % RANDOM.length]; }
export async function sandboxCreate({ story, format = '16:9' } = {}) {
  const text = NF(story).trim(); if (!text) throw err(400, 'Write a story, or press Test on Random Story.'); if (text.length > 4000) throw err(413, 'Keep a sandbox story under 4,000 characters.');
  const p = store.create({ name: 'Sandbox ' + new Date().toISOString().slice(11, 19), ownerId: localOwner().id, mode: 'faceless', language: /[ঀ-৿]/.test(text) ? 'bn' : 'en' });
  Object.assign(p, { kind: 'animation', sandbox: true, format: ['16:9', '9:16', '1:1'].includes(format) ? format : '16:9', designStyle: '2d-animation', theme: 'light', aiVoice: false, setupDone: true, script: text });
  const d = store.dirs(p.id); fs.mkdirSync(d.assets, { recursive: true });
  // no voice in a typed story (no speech synthesis: a pretrained model): a quiet room tone and the words timed by their length;
  // the mouths then follow the syllables of the words (ZC.lip without a voice envelope)
  const ws = text.split(/\s+/).filter(Boolean), secs = Math.min(240, Math.ceil(ws.length / 2.3) + 2);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'anoisesrc=color=pink:amplitude=0.003:sample_rate=48000', '-t', String(secs), path.join(d.assets, 'voice.wav')]);
  p.assets = [{ file: 'voice.wav', original: 'room-tone.wav', role: 'voiceover', hasAudio: true, duration: secs, size: fs.statSync(path.join(d.assets, 'voice.wav')).size, addedAt: Date.now() }];
  const per = (secs - 1.5) / ws.reduce((a, w) => a + w.length + 2, 0); let t = 0.5;
  const tr = ws.map((w) => { const e = t + (w.length + 2) * per, x = { text: w, start: +t.toFixed(2), end: +(e - 0.04).toFixed(2) }; t = e; return x; });
  const dir = path.join(d.ws, 'transcripts', 'plate-plate'); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, 'transcript.json'), JSON.stringify(tr)); fs.writeFileSync(path.join(dir, 'meta.json'), JSON.stringify({ language: p.language, conf: 1, words: tr.length, tags: null }));
  store.save(p, { immediate: true }); jobs.set(p.id, { stage: 'queued', at: Date.now() }); sandboxBuild(p.id, { first: true }); return { id: p.id };
}
async function sandboxBuild(id, { first = false } = {}) {
  const J = jobs.get(id) || {}; jobs.set(id, { ...J, stage: 'planning', error: null, at: Date.now() });
  try {
    let p = store.get(id); if (first || !p.transcript) p = await run(id, 'prepare');
    if (first) { const timed = sentencesFromWords(firstCutWords(jobDir(store.dirs(id).ws))); p = store.get(id); p.film = planFromBrain('', { duration: p.assets[0].duration, title: p.name, timed }); const e = codefilm.validate(p.film); if (e.length) throw new Error(e.join(' ')); store.save(p, { immediate: true }); }
    jobs.set(id, { ...jobs.get(id), stage: 'building' }); await run(id, 'storyboard');
    jobs.set(id, { ...jobs.get(id), stage: 'composing' }); const r = await zen(store.dirs(id).ws, ['compose']); if (r && r.ok === false) throw new Error(r.error || 'compose failed');
    jobs.set(id, { ...jobs.get(id), stage: 'ready', built: Date.now() });
  } catch (e) { jobs.set(id, { ...jobs.get(id), stage: 'failed', error: String(e.message).slice(0, 400) }); }
}
const J0 = (id) => jobDir(store.dirs(id).ws), readJ = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
export function sandboxState(id) {
  const p = store.get(id); if (!p?.sandbox) throw err(404, 'No such sandbox.');
  const j = jobs.get(id) || { stage: fs.existsSync(path.join(J0(id), 'edit', 'hf', 'index.html')) ? 'ready' : 'unknown' }, w = path.join(J0(id), 'work');
  const auto = readJ(path.join(w, 'auto-graphics.json'), []), rules = readJ(path.join(w, 'rules.json'), { fired: [] }), lip = readJ(path.join(w, 'lipsync.json'), null), qa = readJ(path.join(w, 'qa.json'), {}), phys = readJ(path.join(w, 'physics.json'), { fixes: [] });
  const words = firstCutWords(J0(id)), syll = (s) => Math.max(1, Math.round([...new Intl.Segmenter('bn', { granularity: 'grapheme' }).segment(NF(s))].filter((g) => /[\p{L}\p{N}]/u.test(g.segment)).length / 1.5));
  const spoken = auto.filter((a) => a.talkers?.length).length;
  return { id, stage: j.stage, error: j.error || null, format: p.format, story: p.script, preview: j.stage === 'ready' ? `/admin/preview/${id}/index.html?v=${j.built || 0}` : null, duration: p.assets?.[0]?.duration || 0,
    receipts: p.film?.plan?.receipts || [], shots: auto, rulesFired: rules.fired || [], qaRepairs: (qa.repairs || []).filter((x) => x.result === 'applied').map((x) => x.rule || x.what || x.issue || JSON.stringify(x).slice(0, 80)), physicsFixes: phys.fixes.length,
    lipsync: { shotsWithASpeaker: spoken, shots: auto.length, syllables: words.reduce((a, x) => a + syll(x.text), 0), voice: !!lip?.voice, by: lip?.voice ? 'the voice energy (30 fps) + syllables' : 'the words’ syllables (no voice in a typed story)' } };
}
export async function sandboxFeedback(id, { shot, good, fix = {} }) {
  const p = store.get(id); if (!p?.sandbox || !p.film) throw err(404, 'No such sandbox.');
  const i = Number(shot) - 1, auto = readJ(path.join(J0(id), 'work', 'auto-graphics.json'), []), s = p.film.shots.slice().sort((a, b) => a.at - b.at)[i]; if (!s) throw err(400, 'No such shot.');
  const R = (p.film.plan?.receipts || []).find((r) => r.sentence === s.sentence) || {}, text = R.text || (p.film.plan?.sentences || [])[s.sentence - 1]?.text; if (!text) throw err(400, 'This shot has no sentence to learn from.');
  const lead = s.people?.[0], ex = { text };
  if (good) { ex.place = s.place; if (lead) { ex.action = lead.gesture || lead.do || 'idle'; ex.face = lead.face || 'neutral'; } const a = auto[i]; if (a) { ex.broll = a.broll?.template || 'none'; ex.cameraMove = a.move || 'steady'; } }
  else {
    for (const h of LABEL_HEADS) if (fix[h] != null && fix[h] !== '' && HEADS[h].includes(fix[h])) ex[h] = fix[h];
    if (ex.place && codefilm.placeIds().includes(ex.place)) s.place = ex.place;
    if (lead && ex.action) { if (['idle', 'walk', 'run', 'wave', 'cheer', 'clap', 'point', 'sit'].includes(ex.action)) { lead.do = ex.action; delete lead.gesture; } else { lead.do = 'idle'; lead.gesture = ex.action; } }
    if (lead && ex.face) lead.face = ex.face;
    if (ex.broll) { if (ex.broll === 'none') s.broll = false; else if (ex.broll !== 'compose_custom_recipe') s.broll = { mode: s.people?.length ? 'pip_corner' : 'cutaway', template: ex.broll, ...(s.people?.length ? { corner: 'tr', top: 0.17 } : {}) }; }
    if (ex.graphic) { if (ex.graphic === 'none') s.overlays = []; else { delete s.overlays; s.brain = { ...(s.brain || {}), graphic: { label: ex.graphic, conf: 1 } }; } }
    if (ex.cameraMove) s.camera = { ...(s.camera || {}), move: ex.cameraMove };
    if (Object.keys(ex).length < 2) throw err(400, 'Choose what to change.');
    store.save(p, { immediate: true });
  }
  if (testOverlap(text)) throw err(409, 'That sentence is in a test set: it is never trained on.');
  learnMany([ex]); forget();
  if (!good) sandboxBuild(id); // the corrected shot is rebuilt and recomposed
  return { learned: ex, rebuilding: !good };
}

// ---------- the router ----------
export function adminRouter() {
  const r = express.Router(), json = express.json({ limit: '4mb' });
  r.post('/feed/preview', json, guard(async (req) => { const rows = await readFeed(String(req.body?.text || ''), { online: req.body?.online === true }); return { rows, learned: rows.learned }; }));
  r.post('/feed', json, guard((req) => { const rows = Array.isArray(req.body?.rows) ? req.body.rows.slice(0, 1000) : []; if (!rows.length) throw err(400, 'Nothing to feed.'); return feed(rows); }));
  r.post('/feed-topic', json, guard((req) => feedTopics(String(req.body?.topics || ''), { online: req.body?.online !== false })));
  r.post('/teacher', json, guard((req) => teacher(req.body?.topic, { n: req.body?.n, labels: req.body?.labels || {} })));
  r.get('/heads', guard(() => ({ heads: Object.fromEntries(LABEL_HEADS.map((h) => [h, HEADS[h]])), places: codefilm.placeIds() })));
  r.post('/learn-from-video', express.raw({ type: '*/*', limit: '2gb' }), guard((req) => {
    if (!req.body?.length) throw err(400, 'Upload a video file.'); const dir = path.join(ADMIN(), 'videos'); fs.mkdirSync(dir, { recursive: true });
    const name = crypto.createHash('sha256').update(req.body).digest('hex').slice(0, 16) + '.mp4', f = path.join(dir, name); if (!fs.existsSync(f)) fs.writeFileSync(f, req.body);
    return { file: name, original: String(req.query.name || '').slice(0, 120), profile: analyzeVideo(f) };
  }));
  r.post('/style/apply', json, guard((req) => applyStyle(req.body?.profile || {}, String(req.body?.source || ''))));
  r.get('/style', guard(() => readJ(styleFile(), null)));
  r.get('/rules', guard(() => listRules()));
  r.post('/rules', json, guard((req) => (req.body?.preview ? parseStrict(req.body?.text) : addRule(req.body?.text))));
  r.post('/rules/:id', json, guard((req) => setRule(req.params.id, { active: req.body?.active })));
  r.delete('/rules/:id', guard((req) => deleteRule(req.params.id)));
  r.get('/random-story', guard(() => ({ story: randomStory(Math.random() * 1e6) })));
  r.post('/sandbox', json, guard((req) => sandboxCreate({ story: req.body?.random ? randomStory(Math.random() * 1e6) : req.body?.story, format: req.body?.format })));
  r.get('/sandbox/:id', guard((req) => sandboxState(req.params.id)));
  r.post('/sandbox/:id/feedback', json, guard((req) => sandboxFeedback(req.params.id, req.body || {})));
  return r;
}
// the composed preview page of a sandbox (static files of its edit/hf), for the player in ui/admin.html
export function previewFile(id, rel) {
  const p = store.get(id); if (!p?.sandbox) return null;
  const root = path.join(J0(id), 'edit', 'hf'), f = path.resolve(root, rel || 'index.html');
  return f.startsWith(root + path.sep) || f === root ? (fs.existsSync(f) ? f : null) : null;
}
