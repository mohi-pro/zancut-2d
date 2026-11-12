// Local transcript, trim, storyboard and media-file helpers. No AI service:
//   Step 2  media:      the main track (a small copy, its filmstrip and waveform), the customer's trims, then the words
//                       in sentences, with trim metadata and a note per line
//   Step 3  storyboard: one still per scene, taken from the built video page (no render)
//   Local media:       plan.json, file joining and frame strips
//   The editor's look: 3 frames of one graphic scene (start, its key word, its end), the way a viewer sees them
import fs from 'node:fs';
import path from 'node:path';
import { execFile, spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { firstCutWords, cutWords, zen } from './director.mjs';
import { ENGINE_DIR, ASSETS_DIR } from './config.mjs';
import { levelsOf, speechHoles } from './audio-analysis.mjs';
import { isOwnClip, isOwnMedia } from './studio.mjs';

const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const run = (cmd, args, timeout = 120000) => new Promise((ok, no) => execFile(cmd, args, { timeout, maxBuffer: 1 << 27, encoding: 'buffer' }, (e, so, se) => (e ? no(new Error(String(se || e.message).slice(-300))) : ok(so))));
const jobDir = (d) => path.join(d.ws, 'job');
const r2 = (n) => Math.round(n * 100) / 100;

// ---------- Step 2: the main track on a timeline ----------
// Loudness every `step` seconds, 0–100 (the waveform the customer trims on).
async function peaksOf(file, step = 0.05) {
  const rate = 8000, per = Math.max(1, Math.round(rate * step));
  const pcm = await run('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(rate), '-f', 's16le', 'pipe:1'], 10 * 60000);
  const n = Math.floor(pcm.length / 2), out = [];
  let peak = 1;
  for (let i = 0; i < n; i += per) { let m = 0; for (let k = i; k < Math.min(n, i + per); k++) { const v = Math.abs(pcm.readInt16LE(k * 2)); if (v > m) m = v; } out.push(m); if (m > peak) peak = m; }
  return out.map((m) => Math.round((m / peak) * 100));
}
const probeOf = (file) => {
  const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', file], { encoding: 'utf8', timeout: 30000 }); // a time limit: a hung ffprobe here would freeze the whole server
  const j = JSON.parse(r.stdout || '{}'), v = (j.streams || []).find((s) => s.codec_type === 'video');
  return { duration: Number(j.format?.duration || 0), video: !!v, ar: v?.width && v?.height ? v.width / v.height : 16 / 9 };
};
const making = new Map(); // one preparation per project at a time
// The main track (camera footage, a voice recording, the AI voice's plate, a screen recording) made ready to trim in the
// browser: a small copy every browser plays, a filmstrip (up to 60 frames in one image) and the waveform. Made once.
// audio = treat it as a voice track (the faceless plate is a plain picture: no filmstrip, no video to watch)
export async function mainMedia(d, p, rel, { audio = false, into = 'main' } = {}) {
  const src = rel && path.join(d.ws, rel);
  if (!src || !fs.existsSync(src)) return { ready: false };
  const dir = path.join(d.out, into), metaFile = path.join(dir, 'meta.json'), key = `${rel}:${fs.statSync(src).size}:${audio ? 'a' : 'v'}:2`, mk = `${p.id}:${into}`;
  const meta = J(metaFile);
  if (meta?.key === key) return { ready: true, ...meta.view };
  if (making.has(mk)) return making.get(mk);
  const job = (async () => {
    fs.mkdirSync(dir, { recursive: true });
    const info = probeOf(src), D = info.duration;
    if (audio) info.video = false;
    const proxy = info.video ? 'proxy.mp4' : 'proxy.m4a';
    await run('ffmpeg', ['-v', 'error', '-y', '-i', src, ...(info.video ? ['-vf', "scale='if(gt(iw,ih),-2,720)':'if(gt(iw,ih),540,-2)'", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-g', '30'] : ['-vn']), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', path.join(dir, proxy)], 20 * 60000);
    let strip = null;
    if (info.video) {
      const count = Math.max(8, Math.min(60, Math.round(D / 1.5))), every = D / count;
      await run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, proxy), '-vf', `fps=1/${every.toFixed(3)},scale=-2:90,tile=${count}x1`, '-frames:v', '1', '-q:v', '5', path.join(dir, 'strip.jpg')], 5 * 60000).catch(() => null);
      if (fs.existsSync(path.join(dir, 'strip.jpg'))) strip = { src: `${into}/strip.jpg`, count, every: r2(every) };
    }
    const ar = info.video ? probeOf(path.join(dir, proxy)).ar : 1; // the small copy is turned upright: its own shape
    const view = { kind: info.video ? 'video' : 'audio', src: `${into}/${proxy}`, duration: r2(D), ar: r2(ar), peaks: await peaksOf(path.join(dir, proxy)).catch(() => []), step: 0.05, strip }; // a clip without sound: a flat waveform
    fs.writeFileSync(metaFile, JSON.stringify({ key, view }));
    return { ready: true, ...view };
  })().finally(() => making.delete(mk));
  making.set(mk, job);
  return job;
}

// Lines use optional legacy tags when present, otherwise sentences; every word belongs to one line.
export function linesFrom(words, gemini, o = {}) {
  const n = words.length, out = [];
  const moments = (gemini?.moments || []).filter((m) => Number.isInteger(m.from) && Number.isInteger(m.to) && m.to >= m.from).sort((a, b) => a.from - b.from);
  let at = 0;
  for (const m of moments) {
    if (m.from > at) splitSentences(words, at, Math.min(n - 1, m.from - 1), o.breaks).forEach((x) => out.push(x));
    const from = Math.max(at, m.from), to = Math.min(n - 1, m.to);
    if (to >= from) { out.push({ from, to }); at = to + 1; }
  }
  if (at < n) splitSentences(words, at, n - 1, o.breaks).forEach((x) => out.push(x));
  // a line too short to be a scene joins its neighbour (at a script line end it stays alone only if long enough)
  const MIN = o.min || 2.2, len = (l) => (words[l.to]?.end ?? 0) - (words[l.from]?.start ?? 0);
  for (let k = 0; k < out.length; k++) {
    if (len(out[k]) >= MIN || out.length < 2) continue;
    const prev = out[k - 1], next = out[k + 1], into = prev && (!next || len(prev) <= len(next)) ? prev : next;
    if (!into || (into.to - into.from) + (out[k].to - out[k].from) > 22) continue;
    into.from = Math.min(into.from, out[k].from); into.to = Math.max(into.to, out[k].to); out.splice(k, 1); k = Math.max(-1, k - 2);
  }
  return out.map((l) => ({ ...l, hint: '', file: null }));
}
function splitSentences(words, a, b, breaks = null) {
  const out = []; let s = a;
  for (let i = a; i <= b; i++) {
    // a line ends at a sentence end, at a comma / dash once it has 6+ words, at a pause, or at 12 words: short scenes
    const end = /[.!?।]$/.test(words[i].text) || breaks?.has(i) || (i - s >= 5 && /[,،;:—–-]$/.test(words[i].text)) || (words[i + 1] && words[i + 1].start - words[i].end > 0.6) || (i - s >= 11 && !words.slice(i + 1, i + 4).some((w) => /[.!?।]$/.test(w.text))) || i - s >= 15; // (a sentence ending within 3 words stays whole)
    if (end || i === b) { out.push({ from: s, to: i }); s = i + 1; }
  }
  return out;
}

// Each first-cut word's time on the main track as uploaded (the timeline the customer trims), from the raw words.
function rawTimes(J0) {
  const raw = J(path.join(J0, 'work', 'transcript.json'), []), list = Array.isArray(raw) ? raw : raw.words || [];
  return firstCutWords(J0).map((w) => { const r = list[w.src] || w; return { t: w.text, s: r2(r.start), e: r2(r.end) }; });
}
// After local listening: the words, lines and Magic Cut list kept for the customer (their trims are applied to them).
// an AI voice reads the customer's script: where they pressed Enter, a line ends (the words are the script's, in order)
function scriptBreaks(p, words) {
  if (!p.aiVoice || !p.script) return null;
  const out = new Set(), toks = []; const re = /(\S+)(\s*)/g; let m;
  while ((m = re.exec(String(p.script)))) toks.push({ t: m[1], nl: /\n/.test(m[2]) });
  const norm = (x) => String(x || '').replace(/[^\p{L}\p{N}]/gu, '');
  let j = 0;
  for (let i = 0; i < words.length && j < toks.length; i++) {
    let k = j; while (k < toks.length && k < j + 3 && norm(toks[k].t) !== norm(words[i].text)) k++; // a word the cut removed: skip ahead a little
    if (k < toks.length && norm(toks[k].t) === norm(words[i].text)) { if (toks[k].nl) out.add(i); j = k + 1; }
  }
  return out;
}
export function saveScript(d, p) {
  const J0 = jobDir(d);
  fs.writeFileSync(path.join(J0, 'work', 'first-cut.json'), fs.readFileSync(path.join(J0, 'cut', 'transcript.json')));
  if (!fs.existsSync(path.join(J0, 'work', 'cuts.first.json'))) fs.copyFileSync(path.join(J0, 'work', 'cuts.json'), path.join(J0, 'work', 'cuts.first.json'));
  const words = firstCutWords(J0), gem = J(path.join(J0, 'work', 'GEMINI.json')), times = rawTimes(J0);
  // Magic Cut: fillers, false starts and repeats Gemini heard, as ranges on the main track (seconds)
  // (a range whose words cover far more time than words take, like 2 words over 23 s, is speech the transcript missed: never offered)
  const magic = (gem?.cut || []).filter((c) => Number.isInteger(c.from) && c.from < words.length).map((c) => {
    const to = Math.min(words.length - 1, Math.max(c.from, c.to ?? c.from)), a = times[c.from], b = times[to];
    return { from: a.s, to: b.e, why: c.why || 'filler', text: c.words || words.slice(c.from, to + 1).map((w) => w.text).join(' '), n: to - c.from + 1 };
  }).filter((m) => m.to - m.from <= 0.7 * m.n + 1.5).map(({ n: _, ...m }) => m);
  // dead air longer than 0.45 s between two kept words is offered too (a little breath is left on both sides), only where the
  // sound itself is quiet: a gap between words over speech is words the transcript missed, not a pause
  const quiet = quietCheck(path.join(J0, 'work', 'audio16k.wav'));
  if (gem) for (let i = 0; i + 1 < words.length; i++) { const a = times[i].e + 0.15, b = times[i + 1].s - 0.1; if (times[i + 1].s - times[i].e > 0.45 && b - a >= 0.2 && quiet(a, b)) magic.push({ from: r2(a), to: r2(b), why: 'dead air', text: '' }); }
  p.transcript = { lines: linesFrom(words, gem, { breaks: scriptBreaks(p, words), min: p.pace === 'fast' ? 1.8 : p.pace === 'calm' ? 2.8 : 2.2 }), magic, removed: [], fixes: {}, words: words.length, summary: gem?.summary || '', gaps: gapsOf(J0, times), at: Date.now() };
  applyTrim(d, p);
}
// speech (over 2 s) with no word on it: the customer sees it in red on the transcript and can have it listened to again;
// the storyboard waits until it is heard or marked as no speech. → [[from, to]] seconds on the main track
function gapsOf(J0, times) {
  try {
    const wav = path.join(J0, 'work', 'audio16k.wav'); if (!fs.existsSync(wav)) return [];
    const rms = levelsOf(wav);
    return speechHoles(rms)(times.map((w) => ({ s: w.s, e: w.e })), 0, rms.length / 20);
  } catch (e) { console.error('[gaps]', e.message?.slice(0, 120)); return []; }
}
// The customer's notes on lines and word fixes, by time, so they survive the words being made again (Listen again, the
// language changed): a note goes to the new line it overlaps most, a fix to the word at its time (not inside `skip`, the part
// heard again, where the words are new)
// What still stands between the transcript and the director (checked by code when Make Storyboard is pressed): speech with no
// words that the customer has not marked as "no speech", and a word stretched over seconds (speech the transcriber skipped).
// The director plans only from the words, so a part without words would be planned as if nothing were said there.
export function openGaps(d, p) {
  const t = p.transcript; if (!t) return [];
  const marked = t.noSpeech || [], cover = (a, b) => marked.reduce((n, [x, y]) => n + Math.max(0, Math.min(b, y) - Math.max(a, x)), 0);
  const long = rawTimes(jobDir(d)).filter((w) => w.e - w.s > 2).map((w) => [w.s, w.e]);
  return [...(t.gaps || []), ...long].filter(([a, b]) => cover(a, b) < (b - a) / 2).sort((x, y) => x[0] - y[0]);
}
export function notesOf(d, p) {
  const t = p.transcript; if (!t) return null;
  const times = rawTimes(jobDir(d));
  const lines = (t.lines || []).filter((l) => (l.hint || '').trim() || l.file).map((l) => ({ a: times[l.from]?.s, b: times[l.to]?.e, hint: l.hint || '', file: l.file || null })).filter((x) => Number.isFinite(x.a) && Number.isFinite(x.b));
  const fixes = Object.entries(t.fixes || {}).map(([i, text]) => times[+i] && { m: (times[+i].s + times[+i].e) / 2, text }).filter(Boolean);
  const marked = t.noSpeech || [];
  return lines.length || fixes.length || marked.length ? { lines, fixes, noSpeech: marked } : null;
}
export function restoreNotes(d, p, notes, skip = null) {
  const t = p.transcript; if (!t || !notes) return;
  const times = rawTimes(jobDir(d));
  for (const n of notes.lines || []) {
    let best = -1, bo = 0;
    t.lines.forEach((l, i) => { const o = Math.min(n.b, times[l.to]?.e ?? 0) - Math.max(n.a, times[l.from]?.s ?? 0); if (o > bo) { bo = o; best = i; } });
    if (best < 0) continue;
    const l = t.lines[best];
    l.hint = [l.hint, n.hint].filter((x) => (x || '').trim()).join(' · ').slice(0, 1500);
    if (n.file && !l.file) l.file = n.file;
  }
  const out = {};
  for (const f of notes.fixes || []) {
    if (skip && f.m >= skip[0] && f.m < skip[1]) continue;
    const i = times.findIndex((w) => f.m >= w.s - 0.05 && f.m <= w.e + 0.05); if (i >= 0) out[i] = f.text;
  }
  t.fixes = out;
  t.noSpeech = (notes.noSpeech || []).filter(([a, b]) => !skip || b <= skip[0] || a >= skip[1]);
}
// (a, b) → true when at most a tenth of the sound between a and b (seconds) is speech; without the sound file: true
function quietCheck(wav) {
  let rms = null; try { if (fs.existsSync(wav)) rms = levelsOf(wav); } catch { }
  if (!rms?.length) return () => true;
  const sorted = rms.filter((v) => v > 1e4).sort((x, y) => x - y), level = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 1e6;
  return (a, b) => { let v = 0, n = 0; for (let i = Math.floor(a * 20); i < Math.min(rms.length, Math.ceil(b * 20)); i++) { n++; if (rms[i] > level * 0.05) v++; } return !n || v / n <= 0.1; };
}
export function scriptWords(d) { return rawTimes(jobDir(d)); }

// The customer's trims (seconds on the main track): checked and merged; words mostly inside a trim are removed.
export function cleanTrims(ranges, duration) {
  const list = (Array.isArray(ranges) ? ranges : []).filter((x) => Array.isArray(x) && Number.isFinite(+x[0]) && Number.isFinite(+x[1]))
    .map(([a, b]) => [Math.max(0, r2(+a)), Math.min(duration || 1e9, r2(+b))]).filter(([a, b]) => b - a >= 0.05);
  return mergeRanges(list, 0.01).slice(0, 500);
}
export function applyTrim(d, p) {
  if (!p.transcript) return;
  const times = rawTimes(jobDir(d)), ranges = p.trim?.ranges || [];
  const gone = times.map((w, i) => ({ i, m: (w.s + w.e) / 2 })).filter(({ m }) => ranges.some(([a, b]) => m >= a && m <= b)).map(({ i }) => [i, i]);
  p.transcript.removed = mergeRanges(gone, 1);
}
export function mergeRanges(list, gap = 1) {
  const s = [...list].sort((a, b) => a[0] - b[0]), out = [];
  for (const r of s) { const last = out.at(-1); if (last && r[0] <= last[1] + gap) last[1] = Math.max(last[1], r[1]); else out.push([...r]); }
  return out;
}
// A note and a file per line, and spelling fixes.
export function cleanScript(p, body) {
  const t = p.transcript, n = t.words;
  if (body.fixes && typeof body.fixes === 'object') t.fixes = Object.fromEntries(Object.entries(body.fixes).filter(([i, v]) => Number.isInteger(+i) && +i < n && typeof v === 'string' && v.trim()).slice(0, 500).map(([i, v]) => [i, v.trim().slice(0, 60)]));
  // gaps the customer marked as "no speech here" (music, a silence): the storyboard may go on over them
  if (Array.isArray(body.noSpeech)) t.noSpeech = body.noSpeech.filter((x) => Array.isArray(x) && Number.isFinite(+x[0]) && Number.isFinite(+x[1]) && +x[1] > +x[0]).slice(0, 100).map(([a, b]) => [+a, +b]);
  if (Array.isArray(body.lines) && body.lines.length === t.lines.length) {
    t.lines = t.lines.map((l, i) => {
      const x = body.lines[i] || {};
      const file = typeof x.file === 'string' && (p.assets || []).some((a) => a.file === x.file) ? x.file : null;
      return { ...l, hint: typeof x.hint === 'string' ? x.hint.slice(0, 1500) : l.hint, file };
    });
  }
  return t;
}

// ---------- Step 3: the storyboard as scenes with stills ----------
const NAMES = { graphic: 'Glossy scene', speaker: 'Speaker', screen: 'Screen recording', stock: 'Stock picture', mine: 'Your file', fallback: 'Text scene' };
const MODE_NAMES = { 'popout-box-split': 'Head pops out of the box', 'behind-head-depth': 'Text behind the head', 'bg-replace-stage': 'New background', 'over-torso-glass': 'Glass card on the speaker', 'lower-third-kinetic': 'Lower third', 'masked-pip-stage': 'Speaker in a corner', 'full-broll-takeover': 'Full-screen graphic', speaker: 'Speaker', 'pc-browser-spotlight': 'Screen in a browser window', 'mobile-device-stage': 'Phone screen', 'concept-takeover-graphic': 'Full-screen graphic', 'speaker-intro-hook': 'Outcome hook' };
// the video's length: to the last word, or to the end of the track when it keeps a silent end (2D Animation)
export const lengthOf = (J0, words) => {
  const last = words.length ? words.at(-1).end : 0;
  if (!J(path.join(J0, 'job.json'), {})?.keepTail) return r2(last);
  return r2(Math.max(last, ...(J(path.join(J0, 'cut', 'segments.json'), {})?.segments || []).map((x) => Number(x.outEnd) || 0)));
};
// each scene's seconds on the cut (the compositor's own rule, written next to the page)
const sceneTimes = (J0) => J(path.join(J0, 'edit', 'hf', 'scenes.json'), []);
// One still per scene from the built page (no render, no AI). only = a scene index: just that scene's still is new.
export async function makeBoard(d, p, sb, { only = null, step = () => {} } = {}) {
  const pickOnly = only == null ? null : new Set([].concat(only));
  const J0 = jobDir(d), plan = J(path.join(J0, 'edit', 'plan.json'), { scenes: [] }), times = sceneTimes(J0), words = cutWords(J0);
  const old = p.board?.rows || [], rev = (p.board?.rev || 0) + 1, dir = path.join(d.out, 'board');
  fs.mkdirSync(dir, { recursive: true });
  const rows = sb.rows.map((r, i) => {
    const sc = (plan.scenes || []).find((x) => x.row === i) || {}, tm = times.find((x) => x.row === i);
    return { say: String(r.say || '').slice(0, 300), idea: r.idea || '', show: String(r.metaphor || r.design || '').slice(0, 400), piece: sc.kind || r.piece,
      name: sc.kind === 'graphic' ? `${MODE_NAMES[sc.mode] || 'Glossy scene'}${r.archetype ? ` · archetype ${r.archetype}` : ''}` : MODE_NAMES[sc.mode] && sc.kind === 'speaker' ? MODE_NAMES[sc.mode] : NAMES[sc.kind] || 'Scene',
      mode: sc.mode || '', transition: r.transition || '', s: tm ? r2(tm.s) : null, e: tm ? r2(tm.e) : null,
      thumb: pickOnly && !pickOnly.has(i) ? old[i]?.thumb || null : null, look: pickOnly && !pickOnly.has(i) ? old[i]?.look || null : null, comments: old.length === sb.rows.length ? old[i]?.comments || [] : [] };
  });
  const want = rows.map((r, i) => ({ r, i })).filter(({ r, i }) => r.s != null && (!pickOnly || pickOnly.has(i)));
  if (want.length) {
    step(!pickOnly ? 'Drawing every scene' : 'Drawing the new scene');
    const { stills } = await import(pathToFileURL(path.join(ENGINE_DIR, 'readcheck.mjs')).href);
    const list = want.map(({ r, i }) => { const uid = (plan.scenes || []).find((x) => x.row === i)?.uid, a = r.s + Math.min(0.3, (r.e - r.s) * 0.2), z = Math.max(a, r.e - 0.15);
      return { ts: [0.35, 0.55, 0.72, 0.86, 1].map((f) => r2(a + (z - a) * f)), uid, file: path.join(dir, `r${i}-${rev}.jpg`), i }; });
    try { await stills(path.join(J0, 'edit', 'hf'), list); } catch (e) { console.error('[stills]', e.message); }
    for (const x of list) if (fs.existsSync(x.file)) rows[x.i].thumb = `board/r${x.i}-${rev}.jpg`;
  }
  const keep = new Set(rows.map((r) => r.thumb && path.basename(r.thumb)));
  for (const f of fs.readdirSync(dir)) if (!keep.has(f) && !f.startsWith('note-') && !f.startsWith('qa-')) fs.rmSync(path.join(dir, f), { force: true });
  // the director's notes for the customer about their files (a part left out or shown another way, and why): shown with the storyboard
  const fileNotes = (Array.isArray(sb.fileNotes) ? sb.fileNotes : []).map((x) => String(x || '').trim().slice(0, 300)).filter(Boolean).slice(0, 8);
  // Legacy instruction-status metadata stays readable on an existing storyboard.
  const asked = (Array.isArray(sb.asked) ? sb.asked : []).filter((x) => x?.what).slice(0, 20);
  p.board = { rev, rows, video: sb.video || {}, memory: sb.memory || {}, duration: lengthOf(J0, words), ...(fileNotes.length ? { fileNotes } : {}), ...(asked.length ? { asked } : {}) };
  return p.board;
}
// The editor's look: frames of each graphic scene across all of it — just after it starts, the moment its first word lock
// lands (the key word), one every ~2 s between, and just before it ends (3 to 6) — side by side in one picture. A long scene
// is seen whole: no stretch of it goes unseen. Returns [{ row, uid, ts, file (a JPEG), plan }].
export async function sceneSheets(d, p, plan, sb, only = null) {
  const J0 = jobDir(d), times = sceneTimes(J0), words = cutWords(J0), first = firstCutWords(J0), dir = path.join(d.ws, 'qa'); // inside the workspace: Claude may read pictures there
  fs.mkdirSync(dir, { recursive: true });
  const toCut = (fi) => { const src = first[fi]?.src; const w = src == null ? words[fi] : words.find((x) => x.src >= src); return w?.start; };
  const want = (plan.scenes || []).filter((sc) => sc.kind === 'graphic' && (only == null || sc.row === only)).map((sc) => {
    const tm = times.find((x) => x.row === sc.row); if (!tm) return null;
    const r = sb.rows[sc.row] || {}, lock = (r.wordLocks || [])[0], tl = lock ? toCut(lock.word) : null;
    const mid = tl != null && tl > tm.s + 0.2 && tl < tm.e - 0.2 ? Math.min(tm.e - 0.1, tl + 0.35) : tm.s + (tm.e - tm.s) * 0.55;
    const a = tm.s + Math.min(0.15, (tm.e - tm.s) * 0.5), z = Math.max(tm.s, tm.e - 0.1), k = Math.max(3, Math.min(6, Math.round((tm.e - tm.s) / 2) + 1));
    const ts = Array.from({ length: k }, (_, j) => a + ((z - a) * j) / (k - 1));
    ts[ts.reduce((b, t, j) => (j && j < k - 1 && Math.abs(t - mid) < Math.abs(ts[b] - mid) ? j : b), 1)] = mid; // the key word's frame replaces the nearest one
    return { sc, r, ts: ts.sort((x, y) => x - y).map(r2) };
  }).filter(Boolean);
  if (!want.length) return [];
  const { stills } = await import(pathToFileURL(path.join(ENGINE_DIR, 'readcheck.mjs')).href);
  const list = want.flatMap((w) => w.ts.map((t, j) => ({ t, file: path.join(dir, `qa-${w.sc.row}-${j}.jpg`) })));
  try { await stills(path.join(J0, 'edit', 'hf'), list); } catch (e) { console.error('[qa stills]', e.message); return []; }
  const out = [];
  for (const w of want) {
    const f = w.ts.map((_, j) => path.join(dir, `qa-${w.sc.row}-${j}.jpg`)), sheet = path.join(dir, `qa-${w.sc.row}.jpg`), H = f.length > 3 ? 480 : 640;
    if (!f.every((x) => fs.existsSync(x))) continue;
    await run('ffmpeg', ['-v', 'error', '-y', ...f.flatMap((x) => ['-i', x]), '-filter_complex', `${f.map((_, j) => `[${j}]scale=-2:${H}[f${j}]`).join(';')};${f.map((_, j) => `[f${j}]`).join('')}hstack=${f.length}`, sheet]).catch(() => null);
    if (fs.existsSync(sheet)) out.push({ row: w.sc.row, uid: w.sc.uid, ts: w.ts, file: sheet, plan: `${MODE_NAMES[w.sc.mode] || w.sc.mode}. Metaphor: ${String(w.r.metaphor || '').slice(0, 200)}. Words said: "${String(w.r.say || '').slice(0, 160)}". Frames left to right in time; one of them is the key word landing.` });
  }
  return out;
}

// ---------- Step 4: Advanced editing (the plan's scenes as tracks; no AI) ----------
const TRANSITIONS = ['cut', 'zoom-blur', 'blur', 'light-leak'];
const FILTERS = ['warm', 'cool', 'bw', 'vivid', 'fade', 'dramatic'];
const FXS = ['vignette', 'letterbox', 'leak', 'scanlines'];
const MEDIA = /\.(mp4|mov|m4v|webm)$/i;
const newUid = () => `u${Math.random().toString(36).slice(2, 10)}`;
const musicList = () => (J(path.join(ASSETS_DIR, 'music', 'catalog.json'), { items: [] }).items || []).map((x) => ({ id: x.id, title: x.title, mood: x.mood, src: path.join(ASSETS_DIR, 'music', String(x.file).replace(/^music\//, '')), url: `/music/${String(x.file).replace(/^music\//, '')}`, seconds: x.seconds }));
// the sound kit for the Sounds panel (whooshes, textures, risers, hits), measured once
let sfxInfo = null;
const sfxList = () => (sfxInfo ||= (() => { const kit = J(path.join(ENGINE_DIR, 'sfx', 'pro-kit.json'), { items: [] }).items || []; const extra = ['typing']; return [...kit.map((x) => ({ id: x.id, group: { whoosh: 'Whooshes', texture: 'Textures', riser: 'Risers', hit: 'Hits' }[x.family] || 'Other', dur: r2(x.dur || 0.5), src: `/sfx/${x.id}.wav` })), ...extra.filter((id) => fs.existsSync(path.join(ENGINE_DIR, 'sfx', `${id}.wav`))).map((id) => ({ id, group: 'Textures', dur: 1, src: `/sfx/${id}.wav` }))]; })());
export async function timelineView(d, p) {
  const J0 = jobDir(d), plan = J(path.join(J0, 'edit', 'plan.json'), { scenes: [] }), words = cutWords(J0);
  let voice = null;
  const cut = path.join(J0, 'cut', 'cut.mp4'), pf = path.join(d.out, 'edit-voice.json');
  if (fs.existsSync(cut)) { const key = String(fs.statSync(cut).mtimeMs), c = J(pf); if (c?.key === key) voice = c.peaks; else { try { voice = await peaksOf(cut, 0.1); fs.writeFileSync(pf, JSON.stringify({ key, peaks: voice })); } catch {} } }
  const scenes = [...(plan.scenes || [])].sort((a, b) => a.startWord - b.startWord);
  return {
    duration: lengthOf(J0, words),
    words: words.map((w) => ({ t: w.text, s: r2(w.start), e: r2(w.end) })),
    voice, voiceStep: 0.1,
    beats: scenes.map((sc, k) => ({ k, uid: sc.uid, type: sc.kind === 'graphic' ? 'custom' : sc.kind === 'mine' || sc.kind === 'stock' ? (MEDIA.test(sc.media || '') ? 'broll' : 'image') : sc.kind, row: sc.row ?? null,
      name: sc.kind === 'graphic' ? (MODE_NAMES[sc.mode] || 'Glossy scene') : NAMES[sc.kind] || sc.kind, mode: sc.mode || '', startWord: sc.startWord, endWord: scenes[k + 1] ? Math.max(sc.startWord, scenes[k + 1].startWord - 1) : words.length - 1,
      src: sc.media || null, hidden: !!sc.hidden, transition: sc.transition || 'cut', fadeIn: sc.fadeIn || 0, fadeOut: sc.fadeOut || 0, filter: sc.filter || '', params: sc.kind === 'mine' || sc.kind === 'stock' ? { text: sc.text || '', kicker: sc.kicker || '' } : {} })),
    fx: (plan.fx || []).map((f) => ({ ...f })),
    sounds: plan.soundsOwn ? plan.sounds || [] : J(path.join(J0, 'edit', 'hf', 'sfx-auto.json'), []).map((x, i) => ({ uid: `auto${i}`, t: x.t, name: x.name, vol: x.vol })),
    soundsOwn: !!plan.soundsOwn,
    music: plan.music ? { src: plan.music.src, volume: plan.music.volume ?? 0.112, own: !!plan.music.own } : null,
    captions: { on: plan.captions?.on !== false },
    lists: { music: musicList(), sounds: sfxList(), filters: FILTERS, transitions: TRANSITIONS, effects: FXS,
      media: (p.assets || []).filter((a) => isOwnMedia(a, p)).map((a) => ({ file: a.file, name: a.original || a.file, kind: isOwnClip(a, p) ? 'clip' : 'picture', src: `/media/${p.id}/assets/${encodeURIComponent(a.file)}` })) },
  };
}
// The customer's edits → plan.json, then the compositor (~3 s) so the live preview shows them at once.
export async function applyTimeline(d, p, body) {
  const J0 = jobDir(d), file = path.join(J0, 'edit', 'plan.json');
  const plan = J(file, { scenes: [] }), words = cutWords(J0), n = words.length;
  const word = (x, lo = 0) => Math.max(lo, Math.min(n - 1, Math.round(Number(x) || 0)));
  const num = (v, lo, hi) => (Number.isFinite(+v) ? Math.max(lo, Math.min(hi, +v)) : null);
  const out = [];
  for (const x of Array.isArray(body.beats) ? body.beats.slice(0, 300) : []) {
    let sc = (plan.scenes || []).find((y) => y.uid === (x.from || x.uid));
    sc = sc ? structuredClone(sc) : null;
    if (!sc) { // the customer's own picture or clip, added as a scene of its own
      const a = typeof x.file === 'string' && (p.assets || []).find((y) => y.file === x.file && isOwnMedia(y, p));
      if (!a) continue;
      const rel = `assets/mine/${path.basename(a.file)}`, to = path.join(J0, rel);
      if (!fs.existsSync(to)) { fs.mkdirSync(path.dirname(to), { recursive: true }); try { fs.linkSync(path.join(d.assets, a.file), to); } catch { fs.copyFileSync(path.join(d.assets, a.file), to); } }
      sc = { uid: newUid(), row: null, kind: 'mine', media: rel, mode: 'full-broll-takeover', transition: 'zoom-blur' };
    }
    if (x.from && out.some((y) => y.uid === sc.uid)) sc.uid = newUid();
    sc.startWord = word(x.startWord);
    sc.hidden = !!x.hidden || undefined; if (!sc.hidden) delete sc.hidden;
    if (TRANSITIONS.includes(x.transition)) sc.transition = x.transition;
    for (const f of ['fadeIn', 'fadeOut']) if (f in x) { const v = num(x[f], 0, 3); if (v) sc[f] = v; else delete sc[f]; }
    if ('filter' in x) { if (FILTERS.includes(x.filter)) sc.filter = x.filter; else delete sc.filter; }
    if (x.params && (sc.kind === 'mine' || sc.kind === 'stock')) { if (typeof x.params.text === 'string') sc.text = x.params.text.slice(0, 160); if (typeof x.params.kicker === 'string') sc.kicker = x.params.kicker.slice(0, 40); }
    out.push(sc);
  }
  if (out.length) plan.scenes = out.sort((a, b) => a.startWord - b.startWord);
  if (Array.isArray(body.fx)) plan.fx = body.fx.slice(0, 40).filter((f) => FXS.includes(f.id)).map((f) => ({ id: f.id, s: r2(Math.max(0, +f.s || 0)), e: r2(Math.max(0, +f.e || 0)), a: num(f.a, 0, 1) ?? 1 })).filter((f) => f.e > f.s);
  const KIT = new Set(sfxList().map((x) => x.id));
  if (body.soundsAuto === true) { delete plan.sounds; delete plan.soundsOwn; }
  else if (Array.isArray(body.sounds)) { plan.soundsOwn = true; plan.sounds = body.sounds.slice(0, 300).filter((x) => KIT.has(x.name) && Number.isFinite(+x.t)).map((x) => ({ uid: /^u\w{4,12}$/.test(String(x.uid || '')) ? x.uid : newUid(), t: r2(Math.max(0, +x.t)), name: x.name, vol: r2(Math.max(0, Math.min(1.5, Number(x.vol ?? 0.5)))) })); }
  if (body.music === null) delete plan.music;
  else if (body.music) { const own = plan.music?.own && body.music.src === plan.music.src, lib = musicList().find((m) => m.src === body.music.src); if (own || lib) plan.music = { ...(plan.music || {}), src: body.music.src, volume: Math.max(0, Math.min(0.4, Number(body.music.volume) || 0.112)), ...(lib ? { id: lib.id, own: false } : {}) }; }
  if (body.captions) plan.captions = { ...(plan.captions || {}), on: body.captions.on !== false };
  fs.writeFileSync(file, JSON.stringify(plan, null, 1));
  const built = await zen(d.ws, ['compose']);
  if (!built.ok) throw new Error('That change could not be built. Undo it and try another.');
  return (plan.scenes || []).length;
}

// ---------- Step 2: several clips joined into one main track ----------
// The customer's clips (camera footage, or voice recordings for a Storytelling video) in their order; a clip can be split to
// put another one inside it. Each piece is made the same size / frame rate / sound once (HDR phone video turned to normal
// colours, as the engine does), then they are joined without encoding again: ws/raw/joined.mp4 (or assets/joined-voice.m4a).
export function clipSources(p) {
  if (p.footage.length && p.mode !== 'faceless') return { kind: 'video', list: p.footage.map((f) => ({ file: f.file, rel: `raw/${f.file}`, dur: f.duration || 0, name: f.original || f.file, w: f.width, h: f.height, hasAudio: f.hasAudio !== false })) };
  const vo = (p.assets || []).filter((a) => a.role === 'voiceover');
  if (vo.length) return { kind: 'voice', list: vo.map((a) => ({ file: a.file, rel: `assets/${a.file}`, dur: a.duration || 0, name: a.original || a.file, hasAudio: true })) };
  return null;
}
export function sequenceOf(p) {
  const src = clipSources(p); if (!src) return [];
  const ok = (p.sequence || []).filter((s) => src.list.some((x) => x.file === s.file));
  return ok.length ? ok : src.list.map((x) => ({ id: x.file, file: x.file, in: 0, out: r2(x.dur) }));
}
export const joinedRel = (p) => (clipSources(p)?.kind === 'voice' ? 'assets/joined-voice.m4a' : 'raw/joined.mp4');
// joined only when there is more than one piece or a piece is shortened (one whole clip is used as it is)
export function needsJoin(p) {
  const s = sequenceOf(p), src = clipSources(p); if (!src || !s.length) return false;
  if (s.length > 1 || s.some((x) => x.crop)) return true;
  const full = src.list.find((x) => x.file === s[0].file)?.dur || 0;
  return s[0].in > 0.05 || s[0].out < full - 0.05;
}
export function cleanSequence(p, list) {
  const src = clipSources(p); if (!src || !Array.isArray(list)) return [];
  return list.slice(0, 60).map((s, i) => { const x = src.list.find((y) => y.file === s.file); if (!x) return null; const a = Math.max(0, Math.min(x.dur, Number(s.in) || 0)), b = Math.max(a, Math.min(x.dur, Number(s.out ?? x.dur))), crop = src.kind === 'video' ? cleanCrop(s.crop) : null; return b - a >= 0.3 ? { id: /^[\w.-]{1,60}$/.test(String(s.id || '')) ? s.id : `s${i}-${Date.now().toString(36)}`, file: x.file, in: r2(a), out: r2(b), ...(crop ? { crop } : {}) } : null; }).filter(Boolean);
}
// a crop: the part of the picture kept, as fractions of the frame (x, y, w, h); null when it keeps (nearly) all of it
export function cleanCrop(c) {
  if (!c || typeof c !== 'object' || ![c.x, c.y, c.w, c.h].every((v) => Number.isFinite(+v))) return null;
  const q = (v) => Math.round(v * 10000) / 10000, x = Math.max(0, Math.min(0.95, +c.x)), y = Math.max(0, Math.min(0.95, +c.y));
  const w = Math.max(0.05, Math.min(1 - x, +c.w)), h = Math.max(0.05, Math.min(1 - y, +c.h));
  return x < 0.005 && y < 0.005 && w > 0.995 && h > 0.995 ? null : { x: q(x), y: q(y), w: q(w), h: q(h) };
}
const cropVf = (c) => (c ? `crop=trunc(iw*${c.w}/2)*2:trunc(ih*${c.h}/2)*2:trunc(iw*${c.x}):trunc(ih*${c.y}),` : '');
// the output size for pieces whose first is w×h (display pixels) cropped by c: even, at most 1080p
const sizeOf = (w, h, c) => {
  let W = (w || 1080) * (c?.w || 1), H = (h || 1920) * (c?.h || 1);
  if (W * H > 1920 * 1080) { const k = Math.sqrt((1920 * 1080) / (W * H)); W *= k; H *= k; } // 1080p is plenty (renders are 1080p)
  return [Math.round(W / 2) * 2, Math.round(H / 2) * 2];
};
// one piece of a video (s.in–s.out, its crop) made W×H, 30 fps, normal colours (HDR phone video turned to SDR), with sound
async function videoPiece(file, s, W, H, out, hasAudio) {
  const tmp = `${out}.part.mp4`, cut = ['-ss', String(s.in), '-t', String(r2(s.out - s.in))];
  const aud = ['-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k'];
  const fit = `${cropVf(s.crop)}scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p`;
  const silent = hasAudio ? [] : ['-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo'], maps = hasAudio ? [] : ['-map', '0:v', '-map', '1:a', '-shortest'];
  const enc = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', ...aud, '-movflags', '+faststart'];
  const tr = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=color_transfer', '-of', 'csv=p=0', file], { encoding: 'utf8', timeout: 30000 }).stdout?.trim() || '';
  const hdr = /arib-std-b67|smpte2084/.test(tr);
  const plain = () => run('ffmpeg', ['-v', 'error', '-y', ...cut, '-i', file, ...silent, ...maps, '-vf', hdr ? `colorspace=all=bt709:iall=bt2020:fast=1,eq=contrast=1.06:saturation=1.08,${fit}` : fit, ...enc, tmp], 30 * 60000);
  if (hdr) await run('ffmpeg', ['-v', 'error', '-y', '-hwaccel', 'videotoolbox', '-hwaccel_output_format', 'videotoolbox_vld', ...cut, '-i', file, ...silent, ...maps, '-vf', `scale_vt=color_matrix=bt709:color_primaries=bt709:color_transfer=bt709,hwdownload,format=p010le,${fit}`, ...enc, tmp], 30 * 60000).catch(plain);
  else await plain();
  fs.renameSync(tmp, out);
}
const joining = new Map();
export const isJoining = (id) => joining.has(id);
export function joinClips(d, p) {
  if (joining.has(p.id)) return joining.get(p.id);
  const job = (async () => {
    const src = clipSources(p), seq = sequenceOf(p), voice = src.kind === 'voice';
    const dir = path.join(d.ws, 'join'); fs.mkdirSync(dir, { recursive: true });
    const first = src.list.find((x) => x.file === seq[0].file) || src.list[0];
    const [W, H] = sizeOf(first.w, first.h, seq[0].crop); // the first piece (as cropped) sets the size
    const parts = [];
    for (const s of seq) {
      const x = src.list.find((y) => y.file === s.file), file = path.join(d.ws, x.rel), c = s.crop;
      const key = `${s.file}-${s.in}-${s.out}-${W}x${H}${c ? `-c${c.x}_${c.y}_${c.w}_${c.h}` : ''}`.replace(/[^\w.-]/g, '_'), out = path.join(dir, `${key}.${voice ? 'm4a' : 'mp4'}`);
      if (!fs.existsSync(out)) {
        if (voice) { const tmp = `${out}.part.m4a`; await run('ffmpeg', ['-v', 'error', '-y', '-ss', String(s.in), '-t', String(r2(s.out - s.in)), '-i', file, '-vn', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k', tmp], 20 * 60000); fs.renameSync(tmp, out); }
        else await videoPiece(file, s, W, H, out, x.hasAudio);
      }
      parts.push(out);
    }
    const list = path.join(dir, 'list.txt'), dest = path.join(d.ws, joinedRel(p)), tmp = `${dest}.part${path.extname(dest)}`;
    fs.writeFileSync(list, parts.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', tmp], 10 * 60000);
    fs.renameSync(tmp, dest);
    return r2(probeOf(dest).duration);
  })().finally(() => joining.delete(p.id));
  joining.set(p.id, job);
  return job;
}

// Step 2 clip editing in the browser: each clip's own small copy, filmstrip and waveform (out/src/<n>/), so the order,
// splits and deletions play at once without joining anything; nothing is joined or listened to until Magic Cut / Confirm
export async function sourcesView(d, p) {
  const src = clipSources(p); if (!src) return null;
  const out = [];
  for (const [i, x] of src.list.entries()) {
    const into = `src/${x.file.replace(/[^\w.-]/g, '_')}`;
    const ready = fs.existsSync(path.join(d.out, into, 'meta.json')) ? await mainMedia(d, p, x.rel, { audio: src.kind === 'voice', into }) : null;
    if (!ready) mainMedia(d, p, x.rel, { audio: src.kind === 'voice', into }).catch((e) => console.error('[source]', e.message)); // made in the background
    out.push({ file: x.file, name: x.name, dur: x.dur, i, ...(ready?.ready ? ready : { ready: false }) });
  }
  return { kind: src.kind, sources: out, sequence: sequenceOf(p) };
}
export const sigOf = (seq) => JSON.stringify((seq || []).map((s) => [s.file, s.in, s.out, ...(s.crop ? [s.crop] : [])]));
export function cleanSourceTrims(p, list) {
  const src = clipSources(p); if (!src || !Array.isArray(list)) return [];
  return list.slice(0, 500).map((t) => { const x = src.list.find((y) => y.file === t.file); if (!x) return null; const a = Math.max(0, Math.min(x.dur, +t.a || 0)), b = Math.max(a, Math.min(x.dur, +t.b || 0)); return b - a > 0.04 ? { file: x.file, a: r2(a), b: r2(b), why: String(t.why || '').slice(0, 60) } : null; }).filter(Boolean);
}

// Confirm: the Magic Cut marks are cut out of the clips themselves, so the joined video is the final piece before
// the words are made (nothing is trimmed afterwards)
export function bakeTrims(seq, trims) {
  const out = [];
  for (const s of seq) {
    const cuts = (trims || []).filter((t) => t.file === s.file && t.b > s.in && t.a < s.out).map((t) => [Math.max(s.in, t.a), Math.min(s.out, t.b)]).sort((a, b) => a[0] - b[0]);
    let from = s.in, k = 0;
    const crop = s.crop ? { crop: s.crop } : {};
    for (const [a, b] of cuts) { if (a - from >= 0.15) out.push({ id: `${s.id}-${k++}`, file: s.file, in: r2(from), out: r2(a), ...crop }); from = Math.max(from, b); }
    if (s.out - from >= 0.15) out.push({ id: k ? `${s.id}-${k}` : s.id, file: s.file, in: r2(from), out: r2(s.out), ...crop });
  }
  return out;
}

// ---------- Step 2: an extra file trimmed and cropped before it is used ----------
// edit = { parts: [{ a, b, crop }] } for a video clip (the kept parts, joined in order into one clip) or { crop } for a
// picture. The customer's file stays as it came in assets/originals/, so the edit can be changed later; the result is the
// asset's own file (a clip is always .mp4). Returns { file, duration, width, height, edit } (edit null = the file as it came).
export const ORIGINALS = 'originals';
export function cleanEdit(role, e, dur = 0) {
  if (!e || typeof e !== 'object') return null;
  if (role === 'image') { const crop = cleanCrop(e.crop); return crop ? { crop } : null; }
  const parts = (Array.isArray(e.parts) ? e.parts : []).slice(0, 40).map((x) => { const a = Math.max(0, Math.min(dur, +x.a || 0)), b = Math.max(a, Math.min(dur, +x.b || 0)), crop = cleanCrop(x.crop); return b - a >= 0.2 ? { a: r2(a), b: r2(b), ...(crop ? { crop } : {}) } : null; }).filter(Boolean).sort((x, y) => x.a - y.a);
  if (!parts.length) return null;
  return parts.length === 1 && parts[0].a < 0.05 && parts[0].b > dur - 0.05 && !parts[0].crop ? null : { parts };
}
// taken: the other assets' file names (a clip that becomes .mp4 never takes one of them)
export async function editAsset(d, a, edit, info, taken = new Set()) {
  const origDir = path.join(d.assets, ORIGINALS), src = path.join(origDir, a.orig || a.file);
  fs.mkdirSync(origDir, { recursive: true });
  if (!a.orig) fs.renameSync(path.join(d.assets, a.file), src); // the first edit keeps the file as it came
  const base = a.file.replace(/\.\w+$/, '');
  // a clip becomes .mp4, a music track or a sound .m4a (its kept parts joined), a picture keeps its name
  const sound = a.role === 'music' || a.role === 'sound', clip = a.role === 'broll' || a.role === 'screen', ext = clip ? '.mp4' : sound ? '.m4a' : null;
  let file = ext ? `${base}${ext}` : a.file;
  for (let i = 2; file !== a.file && taken.has(file); i++) file = `${base}-${i}${ext}`;
  const dest = path.join(d.assets, file);
  const tmpDir = path.join(d.ws, 'asset-edit', base.replace(/[^\w.-]/g, '_')); fs.rmSync(tmpDir, { recursive: true, force: true }); fs.mkdirSync(tmpDir, { recursive: true });
  try {
    if (!edit) fs.copyFileSync(src, dest);
    else if (a.role === 'image') { const out = path.join(tmpDir, `x${path.extname(file)}`); await run('ffmpeg', ['-v', 'error', '-y', '-i', src, '-vf', cropVf(edit.crop).replace(/,$/, ''), '-frames:v', '1', out]); fs.renameSync(out, dest); }
    else if (sound) {
      const parts = [];
      for (const [k, x] of edit.parts.entries()) { const out = path.join(tmpDir, `p${k}.m4a`); await run('ffmpeg', ['-v', 'error', '-y', '-ss', String(x.a), '-t', String(r2(x.b - x.a)), '-i', src, '-vn', '-c:a', 'aac', '-ar', '48000', '-ac', '2', '-b:a', '192k', out], 10 * 60000); parts.push(out); }
      const list = path.join(tmpDir, 'list.txt'), tmp = path.join(tmpDir, 'joined.m4a');
      fs.writeFileSync(list, parts.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
      await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', tmp], 10 * 60000);
      fs.renameSync(tmp, dest);
    }
    else {
      const [W, H] = sizeOf(info.width, info.height, edit.parts[0].crop), parts = [];
      for (const [k, x] of edit.parts.entries()) { const out = path.join(tmpDir, `p${k}.mp4`); await videoPiece(src, { in: x.a, out: x.b, crop: x.crop }, W, H, out, info.hasAudio); parts.push(out); }
      const list = path.join(tmpDir, 'list.txt'), tmp = path.join(tmpDir, 'joined.mp4');
      fs.writeFileSync(list, parts.map((f) => `file '${f.replace(/'/g, "'\\''")}'`).join('\n'));
      await run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', tmp], 10 * 60000);
      fs.renameSync(tmp, dest);
    }
  } finally { fs.rmSync(tmpDir, { recursive: true, force: true }); }
  if (file !== a.file) fs.rmSync(path.join(d.assets, a.file), { force: true });
  // the job's own copy of the old file (linked into the video when it was planned) is made again from the new one
  fs.rmSync(path.join(d.ws, 'job', 'assets', 'mine', a.file), { force: true });
  const pr = clip || sound ? probeOf(dest) : null;
  return { file, orig: a.orig || a.file, edit, ...(pr ? { duration: r2(pr.duration) } : {}) };
}
