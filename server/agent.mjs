// Local job queue: recorded voice → words → scene-file storyboard → render.
// Studio's AI editor, billing, desktop setup and CTO paths are archived.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import * as codefilm from './codefilm.mjs';
import * as store from './store.mjs';
import { probe, makeThumbs, measureMix } from './media.mjs';
import { transcribeFootage, alignScript, whisperxReady, relistenRange } from './transcribe.mjs';
import { jobExtras, FORMATS, screenLed, voiceSource } from './studio.mjs';
import { ENGINE_DIR, ASSETS_DIR } from './config.mjs';
import { zen, jobDir } from './director.mjs';
import { saveScript, makeBoard, needsJoin, joinedRel, restoreNotes } from './board.mjs';

const STOP_GRACE_MS = 15000;
const queue = [];
let running = null;
// HyperFrames keeps an undo history of every page it builds: Zancut's go to one folder, emptied when idle
export const HF_HISTORY = path.join(os.homedir(), '.cache', 'zancut', 'hf-history');
process.env.HYPERFRAMES_HISTORY_ROOT ||= HF_HISTORY;
const clearHistory = () => { if (!running && !queue.length) fs.rmSync(HF_HISTORY, { recursive: true, force: true }); };

export function shutdown() { queue.length = 0; if (running) { running.cancelled = true; running.abort.abort(); } }
export function status() { return { running: running?.id || null, queued: queue.map((j) => j.id) }; }
export function activeFor(ownerId) { const ids = [running?.id, ...queue.map((j) => j.id)].filter(Boolean); return ids.find((id) => store.get(id)?.ownerId === ownerId) || null; }
let onJobDone = () => { };
export const setJobDone = (fn) => { onJobDone = fn; };

export function enqueue(id, kind, extra = {}) {
  if (!['prepare', 'storyboard', 'render'].includes(kind)) throw new Error(`Unsupported local job: ${kind}`);
  const p = store.get(id);
  if (!p) throw new Error('Project not found');
  if (running?.id === id || queue.some((j) => j.id === id)) throw new Error('This video is already being edited.');
  p.status = 'queued'; p.error = null; p.job = { kind, queuedAt: Date.now(), steps: [], todos: [] };
  store.save(p, { immediate: true });
  queue.push({ id, kind, extra });
  pump();
}
export function cancel(id) {
  const i = queue.findIndex((j) => j.id === id);
  if (i >= 0) { queue.splice(i, 1); const p = store.get(id); p.status = store.idleStatus(p); p.job = null; store.save(p, { immediate: true }); return true; }
  if (running?.id === id) {
    const job = running; job.cancelled = true;
    const p = store.get(id); if (p?.job) { p.job.stopping = true; store.save(p, { immediate: true }); }
    job.abort.abort();
    setTimeout(() => { if (running === job && !job.finished) { console.error('[stop] releasing', id); finish(job, () => finishFailed(store.get(id), '', true)); running = null; pump(); } }, STOP_GRACE_MS);
    return true;
  }
  return false;
}
async function pump() {
  if (running || !queue.length) return;
  const job = queue.shift(), me = { ...job, abort: new AbortController(), cancelled: false, finished: false };
  running = me;
  try { await runJob(me); }
  catch (e) {
    // thrown before the job's own error handling (e.g. while its folder was being made ready): close it anyway, so the video is
    // never left waiting with no worker running
    console.error('[job]', job.id, e);
    if (!me.finished) { me.error = e; finish(me, () => finishFailed(store.get(job.id), e?.customer ? e.message : 'Something went wrong on our side. Your files are safe. Please press Retry; if it happens again, contact support.', false, e, job.extra)); }
  }
  finally { if (running === me) { running = null; pump(); clearHistory(); } }
}
function finish(job, fn) {
  if (job.finished) return;
  job.finished = true;
  fn();
  const p = store.get(job.id);
  try { onJobDone({ project: p, job, ok: p?.status !== 'error' && !p?.error && !job.cancelled, tokensIn: job.tokensIn || 0, tokensOut: job.tokensOut || 0, costUsd: Math.max(job.costUsd || 0, job.estUsd || 0), credits: job.credits || 0, byModel: job.byModel || {} }); }
  catch (e) { console.error('[jobDone]', e); }
}
class CustomerError extends Error { constructor(m) { super(m); this.customer = true; } }

export function mainClips(p) {
  const screen = (p.assets || []).filter((a) => a.role === 'screen');
  // Shared local media compatibility: a recorded voice is the animation main track.
  // Only screen recordings (no other voice): their own sound is the voice and they are the main track
  if (screen.length && screenLed(p)) return screen.map((a) => ({ ...a, hasAudio: a.hasAudio ?? true, rel: `assets/${a.file}` }));
  const joined = needsJoin(p) && p.joined && fs.existsSync(path.join(store.dirs(p.id).ws, joinedRel(p)));
  if (joined && p.footage.length && p.mode !== 'faceless') return [{ file: 'joined.mp4', rel: 'raw/joined.mp4', hasAudio: true, duration: p.joined.duration }];
  if (p.footage.length && p.mode !== 'faceless') return p.footage.map((f) => ({ ...f, rel: `raw/${f.file}` }));
  return [{ file: 'plate.mp4', rel: 'plate/plate.mp4', hasAudio: true, plate: true }];
}
// a person on the main track (a talking head, also with screen recordings: they are a layer of their own over the ground)
const hasPresenter = (p) => { const m = mainClips(p)[0]; return !m.plate && !String(m.rel).startsWith('assets/'); };
// a link to the customer's file in the job folder; where symbolic links are not allowed (Windows without Developer Mode) a
// hard link, else a copy
const relink = (target, at) => {
  try { const st = fs.lstatSync(at); if (st.isSymbolicLink() && fs.readlinkSync(at) === target) return; fs.rmSync(at, { force: true }); } catch { }
  const src = path.resolve(path.dirname(at), target);
  // not made yet (a Storytelling video's plate: makePlate makes it in this job, then linkMain runs again). A link to a file that
  // is not there works on a Mac but not on Windows (no symbolic links there, and nothing to hard-link or copy): it failed the job
  // before it even started, and the video stayed "waiting in line" for ever
  if (!fs.existsSync(src)) return;
  try { fs.symlinkSync(target, at); } catch (e) {
    try { fs.linkSync(src, at); } catch { fs.copyFileSync(src, at); }
  }
};
// the main track into the job's raw/ (numbered links, or their hard-link / copy stand-ins): the engine cuts whatever is there
function linkMain(d, p) {
  const J0 = jobDir(d.ws), main = mainClips(p);
  for (const f of fs.readdirSync(path.join(J0, 'raw'))) if (fs.lstatSync(path.join(J0, 'raw', f)).isSymbolicLink() || /^\d{2}-/.test(f)) fs.rmSync(path.join(J0, 'raw', f), { force: true });
  main.forEach((f, i) => { const at = path.join(J0, 'raw', `${String(i + 1).padStart(2, '0')}-${f.file}`); relink(path.relative(path.dirname(at), path.join(d.ws, f.rel)), at); });
  return main;
}
const GOLDEN_GRADE = 'hqdn3d=1.5:1.5:4:4,eq=contrast=1.06:brightness=0.02:saturation=1.06:gamma=1.02,colorbalance=rs=0.008:gs=0.0:bs=-0.015:rm=0.018:gm=0.005:bm=-0.02:rh=0.01:gh=0.005:bh=-0.01,vibrance=intensity=0.08,unsharp=5:5:0.6:5:5:0.0';
function prepareWorkspace(p) {
  const d = store.dirs(p.id), J0 = jobDir(d.ws);
  for (const x of [path.join(J0, 'raw'), path.join(J0, 'assets'), path.join(J0, 'work'), d.exports, d.assets]) fs.mkdirSync(x, { recursive: true });
  const main = linkMain(d, p);
  const jobFile = path.join(J0, 'job.json');
  // a screen recording that is the main picture keeps its own shape through the cut (the compositor puts it in a window or a
  // phone); existing camera-cut metadata remains readable
  const shot = screenLed(p) && voiceSource(p) !== 'video' && (p.assets || []).find((a) => a.role === 'screen');
  const shape = shot?.width && shot?.height ? { canvas: `${shot.width - (shot.width % 2)}x${shot.height - (shot.height % 2)}`, fit: 'cover' } : null;
  if (!fs.existsSync(jobFile)) {
    const x = jobExtras(p);
    const job = {
      format: 'short-explainer', lang: p.language && p.language !== 'auto' ? p.language : 'en', created: new Date().toISOString().slice(0, 10),
      ...(themeLight(p) && hasPresenter(p) ? { grade: GOLDEN_GRADE } : {}),
      ...(whisperxReady() ? { exactTimes: true } : {}),
      ...(hasPresenter(p) ? {} : { noPresenter: true, balance: false, grade: 'none' }),
      ...(mainClips(p)[0].plate && p.aiVoice && !(p.assets || []).some((a) => a.role === 'voiceover') ? { speed: 1 } : {}),
      ...(p.kind === 'animation' ? { keepTail: true } : {}), // the film's own silent end is part of it: a confirmed track is never shortened
      ...x, ...(shape || {}), cutBy: 'ai',
    };
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
  }
  // kept in step on every job (screen recordings can be added or removed after the first one): the type, the shape, whether a
  // person is on the main track
  try {
    const job = JSON.parse(fs.readFileSync(jobFile, 'utf8')), x = jobExtras(p);
    job.zancut = x.zancut; delete job.presenter;
    if (shape) Object.assign(job, shape); else { delete job.fit; if (x.canvas) job.canvas = x.canvas; else delete job.canvas; }
    if (hasPresenter(p)) { if (job.noPresenter) { delete job.noPresenter; delete job.balance; if (themeLight(p)) job.grade = GOLDEN_GRADE; else delete job.grade; } }
    else Object.assign(job, { noPresenter: true, balance: false, grade: 'none' });
    fs.writeFileSync(jobFile, JSON.stringify(job, null, 2));
  } catch (e) { console.error('[job.json]', e.message); }
  return d;
}
const themeLight = (p) => p.theme === 'light';
function seedWords(d, p, transcripts) {
  const J0 = jobDir(d.ws), main = mainClips(p), t = transcripts.find((x) => x.rel === main[0]?.rel);
  if (!t) return;
  try {
    const raw = path.join(J0, 'work', 'transcript.raw.json');
    if (main.length === 1 && !fs.existsSync(raw)) {
      const words = JSON.parse(fs.readFileSync(path.join(d.ws, t.transcript), 'utf8')).filter((w) => w && typeof w.text === 'string' && w.text.trim()).map((w) => ({ text: w.text.trim(), start: Number(w.start), end: Number(w.end), p: 1 }));
      if (words.length) fs.writeFileSync(raw, JSON.stringify(words));
    }
  } catch (e) { console.error('[seed]', p.id, e.message); }
}

async function makePlate(d, p, step) {
  const plate = path.join(d.ws, 'plate', 'plate.mp4');
  if (fs.existsSync(plate)) return;
  fs.mkdirSync(path.dirname(plate), { recursive: true });
  const run = (cmd, args) => new Promise((ok, no) => execFile(cmd, args, { timeout: 15 * 60000, maxBuffer: 1 << 24 }, (e, so, se) => (e ? no(new Error(String(se || so || e.message).slice(-300))) : ok(so))));
  const vo = (p.assets || []).find((a) => a.role === 'voiceover');
  let audio = needsJoin(p) && p.joined && fs.existsSync(path.join(d.ws, joinedRel(p))) ? path.join(d.ws, joinedRel(p)) : vo ? path.join(d.assets, vo.file) : null;
  if (!audio) throw new CustomerError('Upload a voice recording before preparing the animation.');
  const f = FORMATS[p.format] || FORMATS['9:16'];
  step('tool', 'Preparing the narration');
  const screen = mainClips(p)[0].screen;
  if (screen) await run('ffmpeg', ['-y', '-v', 'error', '-i', path.join(d.ws, screen), '-i', audio, '-filter_complex', '[0:v]fps=30,tpad=stop_mode=clone:stop_duration=900,format=yuv420p[v]', '-map', '[v]', '-map', '1:a:0', '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', plate]);
  else await run('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=${themeLight(p) ? '0xF4F3EF' : '0x0E0E13'}:s=${f.w}x${f.h}:r=30`, '-i', audio, '-map', '0:v', '-map', '1:a:0', '-shortest', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '28', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', plate]);
}

async function runJob(job) {
  const p = store.get(job.id);
  if (!p) return;
  const d = prepareWorkspace(p), J0 = jobDir(d.ws);
  const n = p.versions.length + 1;
  p.status = 'editing';
  p.job = { ...p.job, kind: job.kind, version: n, startedAt: Date.now(), steps: [], todos: [], ...(job.kind === 'scene' ? { row: job.extra.row } : {}) };
  store.save(p, { immediate: true });
  const step = (type, text) => { if (job.finished || !p.job) return; p.job.steps.push({ t: Date.now(), type, text }); if (p.job.steps.length > 300) p.job.steps.splice(0, p.job.steps.length - 300); store.save(p); };
  const renderer = async () => {
    const { chromePath, leakCheck } = await import(pathToFileURL(path.join(ENGINE_DIR, 'readcheck.mjs')).href);
    if (!chromePath()) throw new CustomerError('Chrome is required to render. Install it locally, then retry.');
    try {
      const hf = path.join(J0, 'edit', 'hf');
      if (fs.existsSync(path.join(hf, 'index.html'))) {
        const leaks = await leakCheck(hf);
        if (leaks.length) console.error('[render] parts seen outside their scene:', JSON.stringify(leaks));
      }
    } catch (e) { console.error('[render] leak check:', e.message); }
  };
  try {
    if (job.kind === 'prepare') await prepareScript(d, p, job, step);
    else if (job.kind === 'storyboard') {
      if (!p.film) throw new CustomerError('Add the scene file first (who is where, doing what).');
      const sb = await codefilm.build(d, p, p.film, { step: (t) => step('tool', t) });
      if (job.cancelled) throw new Error('cancelled');
      if (!sb) throw new CustomerError('The storyboard could not be made this time. Press Retry.');
      if (p.board) p.board = { rev: p.board.rev, rows: [] };
      await makeBoard(d, p, sb, { step: (t) => step('tool', t) });
    } else if (job.kind === 'render') {
      step('tool', 'Rendering your video'); await renderer();
      const r = await zen(d.ws, ['finish', `v${n}`]);
      if (!r.ok) { console.error('[render]', r.error); job.renderError = r.error; }
    } else throw new Error(`unknown job ${job.kind}`);
  } catch (e) {
    if (job.cancelled) return finish(job, () => finishFailed(p, '', true));
    console.error('[job]', p.id, job.kind, e); job.error = e;
    return finish(job, () => finishFailed(p, e.customer ? e.message : 'Something went wrong on our side. Your files are safe. Please press Retry; if it happens again, contact support.', false, e, job.extra));
  }
  if (job.finished) return;
  if (job.kind !== 'render') return finish(job, () => finishStep(p, job));

  const file = path.join(d.exports, `v${n}.mp4`);
  if (!fs.existsSync(file)) { job.error = new Error(`The render did not finish: ${String(job.renderError || 'no file was made').slice(0, 2000)}`); return finish(job, () => finishFailed(p, 'The render did not finish. Press Retry.')); }
  // the sound check, measured before the version is shown: a sound over the voice is lowered by what it needs (work/sfx-fix.json,
  // read by the compositor) and the video rendered once more, no AI; what is still over it is shown under the version
  const voiceOnly = path.join(J0, 'cut', 'cut.mp4'), placedNow = () => { try { return JSON.parse(fs.readFileSync(path.join(J0, 'edit', 'hf', 'sfx-auto.json'), 'utf8')); } catch { return []; } };
  let audio = null;
  if (fs.existsSync(voiceOnly)) {
    try {
      audio = await measureMix(file, voiceOnly, placedNow());
      if (!audio.ok && !job.cancelled) {
        step('tool', 'Lowering the sounds that cover your voice');
        const fx = path.join(J0, 'work', 'sfx-fix.json'); let list = []; try { list = JSON.parse(fs.readFileSync(fx, 'utf8')); } catch { }
        for (const i of audio.issues) if (i.name) { const old = list.find((x) => x.name === i.name && Math.abs(x.t - i.at) < 0.2); if (old) old.db = Math.min(30, old.db + i.db); else list.push({ t: i.at, name: i.name, db: i.db }); }
        fs.writeFileSync(fx, JSON.stringify(list, null, 1));
        const r = await zen(d.ws, ['finish', `v${n}`]);
        if (r.ok) audio = await measureMix(file, voiceOnly, placedNow()); else console.error('[sound fix] render:', String(r.error).slice(0, 200));
      }
    } catch (e) { console.error('[sound check]', String(e.message).slice(0, 160)); }
  }
  if (job.cancelled) return finish(job, () => finishFailed(p, '', true));
  let info; try { info = await probe(file); } catch { info = null; }
  if (!info?.hasVideo || info.duration < 1) return finish(job, () => finishFailed(p, 'The rendered file is broken. Press Retry.'));
  const name = `v${n}.mp4`, dest = path.join(d.out, name);
  fs.rmSync(dest, { force: true }); try { fs.linkSync(file, dest); } catch { fs.copyFileSync(file, dest); }
  let thumbs = null; try { thumbs = await makeThumbs(dest, d.out, `v${n}`, info.duration); } catch (e) { console.error('[thumbs]', e.message); }
  const nf = path.join(d.exports, `v${n}.md`);
  const notes = [fs.existsSync(nf) ? fs.readFileSync(nf, 'utf8').trim() : '', musicCredit(J0)].filter(Boolean).join('\n\n');
  finish(job, () => {
    p.versions.push({ n, file: name, duration: info.duration, width: info.width, height: info.height, size: info.size, notes, thumbs, createdAt: Date.now(), kind: job.extra?.manual ? 'manual' : 'local', ...(audio ? { audio: { ...audio, measured: true } } : {}), took: Date.now() - p.job.startedAt, costUsd: Number((p.costUsd || 0).toFixed(4)) });
    p.draft = null;
    finishStep(p, job);
  });
  // The sound check of every finished video, measured (not guessed): each placed sound against the voice-only track. Shown
  // under the version. All sound checks here use local measurements.
  if (!audio && fs.existsSync(voiceOnly)) {
    let placed = []; try { placed = JSON.parse(fs.readFileSync(path.join(J0, 'edit', 'hf', 'sfx-auto.json'), 'utf8')); } catch { }
    measureMix(dest, voiceOnly, placed).then((r) => { const q = store.get(p.id), v = q?.versions.find((x) => x.n === n); if (!v) return; v.audio = { ...r, measured: true }; store.save(q, { immediate: true }); }).catch((e) => console.error('[sound check]', e.message.slice(0, 160)));
  }
}

function finishStep(p, job) {
  p.spend = [...(p.spend || []), { kind: job.kind, at: Date.now(), sec: Math.round((Date.now() - (p.job?.startedAt || Date.now())) / 1000), usd: Number((p.job?.costUsd || 0).toFixed(4)), byModel: job.byModel || {} }].slice(-200);
  if (['storyboard', 'replan', 'scene'].includes(job.kind)) p.edited = p.built = Date.now();
  if (['storyboard', 'replan'].includes(job.kind)) p.boardAt = Date.now();
  p.status = store.idleStatus(p); p.error = null; p.quota = null;
  p.lastJob = { kind: job.kind, steps: (p.job?.steps || []).slice(-60) };
  p.job = null;
  store.save(p, { immediate: true });
}
// Local jobs have no subscription or model-quota state.
function finishFailed(p, message, cancelled = false, err = null, extra = null) {
  if (!p) return;
  p.status = store.idleStatus(p); p.error = cancelled ? null : message || null;
  if (cancelled && p.job?.kind === 'prepare' && !p.transcript && p.trim) p.trim.confirmed = false;
  p.lastJob = { kind: p.job?.kind, steps: (p.job?.steps || []).slice(-60), failed: !cancelled };
  p.job = null; store.save(p, { immediate: true });
}

async function prepareScript(d, p, job, step) {
  const J0 = jobDir(d.ws), main = mainClips(p), isPlate = !!main[0]?.plate;
  if (isPlate) { await makePlate(d, p, step); linkMain(d, p); } // the plate exists now: into raw/
  if (job.cancelled) throw new Error('cancelled');
  // Listen again (Step 2): only that part of the main track gets new words; everything after is made from the words again
  const again = job.extra?.relisten;
  if (again) {
    const r = await relistenRange(d.ws, main[0].rel, again[0], again[1], p, (t) => step('tool', t), job.abort.signal);
    if (!r) throw new CustomerError('That part could not be listened to again. Press Transcribe all again.');
    fs.rmSync(path.join(J0, 'work', 'transcript.raw.json'), { force: true });
    if (job.cancelled) throw new Error('cancelled');
  }
  const ttsWords = path.join(d.ws, 'plate', 'voice.words.json');
  if (isPlate && fs.existsSync(ttsWords) && fs.existsSync(path.join(d.ws, 'plate', 'voice.wav'))) {
    // 2D Animation: every word was already timed while the voices were recorded (animation.mjs recordLines)
    if (!(p.kind === 'animation' && fs.existsSync(path.join(d.ws, 'plate', 'aligned.json')))) {
      step('tool', 'Timing every word of your script (WhisperX)');
      await alignScript(path.join(d.ws, 'plate', 'voice.wav'), ttsWords, p.language || 'en', job.abort.signal);
    }
    fs.copyFileSync(ttsWords, path.join(J0, 'work', 'transcript.raw.json'));
    main.length = 0;
  }
  const tp = { ...p, footage: main, assets: (p.assets || []).filter((a) => !(isPlate && a.role === 'voiceover')) };
  const needs = tp.footage.length || (tp.assets || []).some((a) => a.role === 'voiceover');
  const transcripts = needs ? await transcribeFootage(d.ws, tp, (t) => step('tool', t), job.abort.signal) : [];
  if (job.cancelled) throw new Error('cancelled');
  seedWords(d, p, transcripts);
  // Step 2 again: the first cut starts from its own settings, never from the storyboard's (its spelling fixes join words,
  // which would renumber every word the storyboard's scenes point at)
  const firstCuts = path.join(J0, 'work', 'cuts.first.json');
  if (fs.existsSync(firstCuts)) fs.copyFileSync(firstCuts, path.join(J0, 'work', 'cuts.json'));
  step('tool', 'Putting the words on the timeline');
  const r = await zen(d.ws, ['prep'], 20 * 60000);
  if (!r.ok) {
    console.error('[prep]', r.error);
    // "check the sound" only when it really has none: otherwise that sends people looking for the wrong problem
    throw new CustomerError(main.some((m) => m.hasAudio === false) ? 'Your footage could not be prepared: it has no sound. Add footage with sound, then press Retry.'
      : 'Your footage could not be prepared. Press Retry; if it happens again, use Report a bug in your profile menu.');
  }
  if (job.cancelled) throw new Error('cancelled');
  // As before, a fresh local preparation discards stale Studio listening tags.
  fs.rmSync(path.join(J0, 'work', 'GEMINI.json'), { force: true });
  step('tool', 'Laying out your transcript');
  saveScript(d, p);
  if (job.extra?.notes) restoreNotes(d, p, job.extra.notes, again || null);
  p.board = null;
}
function musicCredit(J0) {
  try {
    const plan = JSON.parse(fs.readFileSync(path.join(J0, 'edit', 'plan.json'), 'utf8')), lines = [];
    if (plan.music?.id) { const t = JSON.parse(fs.readFileSync(path.join(ASSETS_DIR, 'music', 'catalog.json'), 'utf8')).items.find((x) => x.id === plan.music.id); if (t?.credit) lines.push(`- Music: ${t.credit}`); }
    const cr = (() => { try { return JSON.parse(fs.readFileSync(path.join(J0, 'work', 'credits.json'), 'utf8')); } catch { return {}; } })();
    for (const c of Object.values(cr)) if (c?.credit) lines.push(`- ${c.credit}`);
    return lines.length ? `Credits\n${lines.join('\n')}` : '';
  } catch { return ''; }
}
