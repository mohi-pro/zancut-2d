// Local listening only: recorded speech → words/times. No hosted transcription or generation service.
import { speechHoles as wordGapHoles, levelsOf } from './audio-analysis.mjs';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { PYTHON, ENGINE_DIR, venvPython } from './config.mjs';
import { npx } from '../engine/media/lib.mjs';

// Runs a command in its own process group so Stop can kill it and everything it started (npx → whisper).
let currentSignal = null;
// (Windows has no process groups: there the child stays attached, and taskkill /T ends it and everything it started)
function run(cmd, args, { cwd, timeout = 0 } = {}) {
  return new Promise((resolve, reject) => {
    const win = process.platform === 'win32';
    const child = spawn(cmd, args, { cwd, detached: !win, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (b) => { if (stdout.length < 1 << 24) stdout += b; });
    child.stderr.on('data', (b) => { if (stderr.length < 1 << 24) stderr += b; });
    const kill = () => { try { if (win) spawn('taskkill', ['/T', '/F', '/PID', String(child.pid)], { windowsHide: true, stdio: 'ignore' }); else process.kill(-child.pid, 'SIGKILL'); } catch {} };
    const timer = timeout ? setTimeout(kill, timeout) : null;
    const onAbort = () => kill();
    currentSignal?.addEventListener('abort', onAbort, { once: true });
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      currentSignal?.removeEventListener('abort', onAbort);
      if (currentSignal?.aborted) return reject(new Error('cancelled'));
      if (code === 0) resolve({ stdout, stderr });
      else reject(Object.assign(new Error(`${path.basename(cmd)} exited with ${code}: ${stderr.slice(-400)}`), { stdout, stderr }));
    });
  });
}
const MODELS = path.join(os.homedir(), '.cache', 'hyperframes', 'whisper', 'models');
// WhisperX in its own Python (scripts/setup-whisperx.sh): the word-timing aligner (engine/media/align.py)
const WX_PY = process.env.ZANCUT_WHISPERX_PYTHON || venvPython('wx');

// A known words file: WhisperX finds when each word is said (wider window: rough times are
// spread by length). Nothing is transcribed; the words never change.
export const whisperxReady = () => fs.existsSync(WX_PY) && process.env.ZANCUT_WHISPERX !== '0';
export async function alignScript(wav, wordsFile, lang, signal) {
  if (!fs.existsSync(WX_PY) || process.env.ZANCUT_WHISPERX === '0') return;
  try { const { stdout } = await run(WX_PY, [path.join(ENGINE_DIR, 'media', 'align.py'), wav, wordsFile, wordsFile, '--lang', lang, '--pad', '0.8', '--jump', '3'], { timeout: 20 * 60000, signal }); console.log(`[transcribe] script: WhisperX ${String(stdout).trim().split('\n').pop()}`); }
  catch (e) { if (signal?.aborted) throw e; console.error('[whisperx] script:', e.message?.slice(0, 200)); }
}
function whisperCli() {
  try { return JSON.parse(fs.readFileSync(path.join(os.homedir(), '.cache', 'hyperframes', 'working-whisper.json'), 'utf8')).path; } catch {}
  return 'whisper-cli';
}

// Detects the spoken language from the first 30 s. Returns { lang, p } (p = how sure whisper is, 0–1) or null.
async function detectLanguage(wav) {
  const model = ['ggml-large-v3-turbo.bin', 'ggml-large-v3.bin', 'ggml-small.bin']
    .map((m) => path.join(MODELS, m)).find((m) => fs.existsSync(m));
  if (!model) return null;
  const read = (text) => {
    const m = String(text).match(/auto-detected language:\s*([a-z]{2,3})(?:\s*\(p\s*=\s*([\d.]+)\))?/);
    return m ? { lang: m[1], p: m[2] ? Number(m[2]) : 1 } : null;
  };
  try {
    const { stdout, stderr } = await run(whisperCli(), ['-m', model, '-l', 'auto', '-dl', '-d', '30000', '-f', wav], { timeout: 120000 });
    return read(stderr + stdout);
  } catch (e) {
    return read(e.stderr || '');
  }
}

// Speech that mixes a local language with English words (Bangla + English is common) is often detected as English,
// and the English-only transcriber then writes nonsense that later local listening passes must repair. When whisper
// says "English" but isn't sure, use the fallback language instead (ZANCUT_FALLBACK_LANG, empty = trust whisper).
const FALLBACK_LANG = process.env.ZANCUT_FALLBACK_LANG ?? 'bn';
const SURE = Number(process.env.ZANCUT_LANG_SURE || 0.9);

// Whisper sometimes writes the unassigned Bangla-block code U+09B5 where ভ belongs ("ভিডিও" comes out broken).
const clean = (text, lang) => {
  const t = String(text || '').replace(/\uFFFD/g, '').trim();
  return lang === 'bn' ? t.replace(/\u09B5/g, 'ভ') : t;
};

// Seeds whisper's spelling style. People mix English words into Bangla, so the Bangla seed does too: English words
// then stay in Latin letters ("first testing video") instead of being spelt out in Bangla script.
const STYLE_PROMPT = { bn: 'আজকে আমরা কথা বলব। এই video-টা খুবই important, তাই না? চলুন start করি।' };
const promptFor = (lang, p) => [STYLE_PROMPT[lang] || '', String(p.script || '').replace(/\s+/g, ' ').slice(0, 160)].filter(Boolean).join(' ');

// The studio's own transcriber (mlx-whisper large-v3 with real word timings): Apple Silicon, when Zancut's Python
// has mlx-whisper (scripts/setup-python.sh). Far better than whisper-cli on Bangla and mixed speech.
let mlxOk = null;
async function hasMlx() {
  if (mlxOk !== null) return mlxOk;
  if (process.platform !== 'darwin' || process.arch !== 'arm64') return (mlxOk = false);
  try { await run(PYTHON, ['-c', 'import mlx_whisper'], { timeout: 60000 }); mlxOk = true; } catch { mlxOk = false; }
  return mlxOk;
}
// The voice is listened to in short pieces (4–9 s), each cut at the quietest moment between words, never in one long pass:
// one long pass loses its place. A customer's 93 s voice came back as 48 s: whisper stretched one word over 23 s, then
// looped a phrase to 104 s, and what was said in between was never written. In short pieces every word sits on its own
// sound. Silences of 1 s or more are left out. rms: levelsOf (50 ms steps) → [[from, to]] in seconds
export function piecesOf(rms, { min = 4, max = 9 } = {}) {
  const F = 20, n = rms.length, sorted = rms.filter((v) => v > 1e4).sort((x, y) => x - y), level = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 1e6;
  const quiet = rms.map((v) => v < level * 0.01), regions = []; // speech between silences of 1 s or more (50 ms frames)
  for (let i = 0; i < n;) {
    while (i < n && quiet[i]) i++;
    if (i >= n) break;
    let j = i, last = i;
    for (let q = 0; j < n && q < F; j++) { if (quiet[j]) q++; else { q = 0; last = j; } }
    regions.push([i, last + 1]); i = j;
  }
  const out = [];
  for (let [a, b] of regions) {
    while (b - a > max * F) { // too long: cut at the quietest 200 ms between min and max seconds in
      let best = a + min * F, bv = Infinity;
      for (let k = a + min * F; k + 4 <= Math.min(b, a + max * F); k++) { const v = rms[k] + rms[k + 1] + rms[k + 2] + rms[k + 3]; if (v < bv) { bv = v; best = k + 2; } }
      out.push([a, best]); a = best;
    }
    const prev = out.at(-1); // a short bit joins its neighbour
    if (prev && b - prev[0] <= max * F && a - prev[1] <= 1.2 * F && (prev[1] - prev[0] < min * F || b - a < min * F)) prev[1] = b;
    else out.push([a, b]);
  }
  return out.filter(([a, b]) => b - a >= 3).map(([a, b]) => [+(a / F).toFixed(2), +(b / F).toFixed(2)]);
}

// Listens to the pieces with one engine → the words on the whole voice's time. A word heard in a piece's 0.15 s padding
// belongs to the piece its middle is in (no word twice). 'mlx' = the studio's mlx-whisper (Apple Silicon); 'whisper' =
// whisper-cli large-v3, every piece in one run so the model loads once, one word per segment (-ml 1 -sow; the hyperframes
// wrapper runs Bangla together into a few giant "words"); 'whisper-cpu' = the same on the CPU (some Macs' GPU run returns
// a single wrong word).
async function listen(engine, wav, lang, dir, ps, prompt) {
  if (!ps.length) return [];
  if (engine === 'mlx') {
    const sp = path.join(dir, 'pieces.json'), raw = path.join(dir, 'mlx.json');
    fs.writeFileSync(sp, JSON.stringify({ pieces: ps }));
    try {
      await run(PYTHON, [path.join(ENGINE_DIR, 'media', 'transcribe.py'), wav, raw, '--lang', lang, '--model', 'large', '--prompt', prompt, '--chunks', sp], { timeout: 30 * 60000 });
      return JSON.parse(fs.readFileSync(raw, 'utf8')).map((w) => ({ text: clean(w.text, lang), start: w.start, end: w.end, p: w.p })).filter((w) => w.text);
    } finally { fs.rmSync(sp, { force: true }); fs.rmSync(raw, { force: true }); }
  }
  const model = path.join(MODELS, 'ggml-large-v3.bin');
  if (!fs.existsSync(model)) throw new Error('whisper large-v3 model missing');
  const pd = path.join(dir, 'pieces'); fs.rmSync(pd, { recursive: true, force: true }); fs.mkdirSync(pd, { recursive: true });
  try {
    const clips = [];
    for (const [i, [a, b]] of ps.entries()) {
      const from = Math.max(0, a - 0.15), f = path.join(pd, `${String(i).padStart(4, '0')}.wav`);
      await run('ffmpeg', ['-v', 'error', '-y', '-ss', from.toFixed(3), '-to', (b + 0.15).toFixed(3), '-i', wav, '-ac', '1', '-ar', '16000', f], { timeout: 120000 });
      clips.push({ f, from, a, b });
    }
    for (let k = 0; k < clips.length; k += 40) {
      await run(whisperCli(), [...(engine === 'whisper-cpu' ? ['-ng'] : []), '-m', model, '-l', lang, ...(prompt ? ['--prompt', prompt] : []), ...clips.slice(k, k + 40).flatMap((c) => ['-f', c.f]), '-ml', '1', '-sow', '-oj'], { timeout: 40 * 60000 });
    }
    const words = [];
    for (const c of clips) {
      let j = null; try { j = JSON.parse(fs.readFileSync(`${c.f}.json`, 'utf8')); } catch { continue; }
      for (const seg of j.transcription || []) {
        const text = clean(seg.text, lang), s = c.from + seg.offsets.from / 1000, e = c.from + seg.offsets.to / 1000;
        if (text && !/^\[.*\]$/.test(text) && (s + e) / 2 >= c.a && (s + e) / 2 < c.b) words.push({ text, start: +s.toFixed(3), end: +e.toFixed(3) });
      }
    }
    return words;
  } finally { fs.rmSync(pd, { recursive: true, force: true }); }
}

// What gives a wrong listen away: one word stretched over seconds (nobody says a word for 2 s; that is speech it skipped),
// a phrase looped (1 word 4+ times in a row, 2–4 words 3+ times), or speech with no word on it for over 2 s (holesOf:
// audio-analysis.mjs speechHoles on the sound's levels).
const LONG_WORD = 1.6;
const normW = (t) => String(t).toLowerCase().replace(/[\p{P}\s]/gu, '');
export function loopRepeats(ws) { // → the indexes of the repeats (the first time stays)
  const t = ws.map((w) => normW(w.text)), drop = new Set();
  for (let n = 1; n <= 4; n++) for (let i = 0; i + n <= t.length; i++) {
    const unit = t.slice(i, i + n).join(' ');
    if (t.slice(i, i + n).some((x) => !x)) continue;
    let k = 1; while (i + (k + 1) * n <= t.length && t.slice(i + k * n, i + (k + 1) * n).join(' ') === unit) k++;
    if (k >= (n === 1 ? 4 : 3)) { for (let j = i + n; j < i + k * n; j++) drop.add(j); i += k * n - 1; }
  }
  return [...drop].sort((x, y) => x - y);
}
export function troubleOf(words, [a, b], holesOf) {
  const ws = words.filter((w) => (w.start + w.end) / 2 >= a && (w.start + w.end) / 2 < b), why = [];
  if (ws.some((w) => w.end - w.start > LONG_WORD)) why.push('a word stretched over seconds');
  if (loopRepeats(ws).length) why.push('a phrase looped');
  if (holesOf && holesOf(ws.map((w) => ({ s: w.start, e: w.end })), a, b).length) why.push('speech with no words');
  return why;
}
const inPiece = (w, [a, b]) => (w.start + w.end) / 2 >= a && (w.start + w.end) / 2 < b;
// a piece in two at its quietest moment near the middle (a fresh start often hears what one listen got lost in)
function halves([a, b], rms) {
  if (b - a < 3) return [[a, b]];
  let best = Math.round(((a + b) / 2) * 20), bv = Infinity;
  for (let k = Math.round((a + 1.2) * 20); k + 4 <= Math.round((b - 1.2) * 20); k++) { const v = rms[k] + rms[k + 1] + rms[k + 2] + rms[k + 3]; if (v < bv) { bv = v; best = k + 2; } }
  return [[a, +(best / 20).toFixed(2)], [+(best / 20).toFixed(2), b]];
}

// Every second of the voice gets its words. The pieces with a wrong listen are heard again: split in two with the same
// engine, and whole with the other one; the best of those per piece is kept. What still loops is dropped to its first time;
// a word still stretched over seconds keeps its start only (the rest shows as a gap). Words after the end of the sound are
// not real. → { words, fixed (pieces repaired), gaps: [[from, to]] of speech still without words, for the customer to see }
async function repair(words, { wav, lang, dir, p, rms, engines }) {
  const D = rms.length / 20, holesOf = wordGapHoles(rms), ps = piecesOf(rms), prompt = promptFor(lang, p);
  words = words.filter((w) => w.start < D - 0.05).map((w) => (w.end > D ? { ...w, end: +D.toFixed(3) } : w));
  let bad = ps.filter((pc) => troubleOf(words, pc, holesOf).length);
  const fixed = new Set();
  if (bad.length) console.log(`[transcribe] heard wrong in ${bad.length} of ${ps.length} pieces: ${bad.map((pc) => `${pc[0]}–${pc[1]} s (${troubleOf(words, pc, holesOf).join(', ')})`).join('; ')}`);
  // the cheapest try first, the next only for the pieces still wrong
  const tries = engines.flatMap((e, k) => (k ? [[e, false], [e, true]] : [[e, true]]));
  for (const [e, split] of tries) {
    if (!bad.length) break;
    let got = null;
    try { got = await listen(e, wav, lang, dir, split ? bad.flatMap((pc) => halves(pc, rms)) : bad, prompt); } catch (err) { console.error('[transcribe] again', e, err.message?.slice(0, 160)); continue; }
    for (const pc of bad) {
      const score = (ws) => troubleOf(ws, pc, holesOf).length * 1000 - ws.filter((w) => inPiece(w, pc)).length + loopRepeats(ws.filter((w) => inPiece(w, pc))).length * 2;
      if (score(got) < score(words)) { words = [...words.filter((w) => !inPiece(w, pc)), ...got.filter((w) => inPiece(w, pc))].sort((x, y) => x.start - y.start); fixed.add(pc); }
    }
    bad = bad.filter((pc) => troubleOf(words, pc, holesOf).length);
  }
  const loops = new Set(loopRepeats(words));
  words = words.filter((w, i) => !loops.has(i)).map((w) => (w.end - w.start > LONG_WORD ? { ...w, end: +(w.start + 0.8).toFixed(3) } : w));
  const gaps = holesOf(words.map((w) => ({ s: w.start, e: w.end })), 0, D);
  return { words: words.map((w, i) => ({ ...w, id: `w${i}` })), fixed: fixed.size, gaps };
}

// Non-English speech: the studio transcriber (mlx-whisper) when it is there, else whisper-cli (GPU, then CPU if that came
// back with almost nothing), both in pieces; then the repair. Writes `out`; → { how, fixed, gaps }
const tooFew = (n, seconds) => n < Math.max(2, (seconds || 0) / 4);
async function localWords(wav, lang, dir, out, p, rms) {
  const ps = piecesOf(rms), D = rms.length / 20, prompt = promptFor(lang, p), engines = [];
  if (await hasMlx()) engines.push('mlx');
  if (fs.existsSync(path.join(MODELS, 'ggml-large-v3.bin'))) engines.push('whisper');
  let words = [], how = '';
  for (const e of engines) {
    try { words = await listen(e, wav, lang, dir, ps, prompt); how = e; } catch (err) { console.error('[transcribe]', e, err.message?.slice(0, 200)); }
    if (!tooFew(words.length, D)) break;
  }
  if (tooFew(words.length, D) && engines.includes('whisper')) { words = await listen('whisper-cpu', wav, lang, dir, ps, prompt); how = 'whisper-cpu'; }
  if (!how) throw new Error('no speech model to listen with');
  const r = await repair(words, { wav, lang, dir, p, rms, engines: [how, ...engines.filter((e) => e !== how)] });
  fs.writeFileSync(out, JSON.stringify(r.words.map(({ p: _, ...w }) => w), null, 1));
  // heard in short pieces: these times are the anchors reAnchor would otherwise listen to the whole voice again for
  fs.writeFileSync(path.join(dir, 'heard-anchors.json'), JSON.stringify(r.words.map((w) => ({ w: w.text, s: w.start, e: w.end, p: w.p ?? 0.8 }))));
  console.log(`[transcribe] ${lang} with ${how}: ${ps.length} pieces, ${r.words.length} words${r.fixed ? `, ${r.fixed} pieces heard again` : ''}${r.gaps.length ? `, speech still without words: ${JSON.stringify(r.gaps)}` : ''}`);
  return { how, fixed: r.fixed, gaps: r.gaps };
}


// WhisperX forced alignment of a words file in place (exact times, each word's "conf"); → { ok, conf, low } or null
async function alignFile(wav, file, lang, signal) {
  try {
    const { stdout } = await run(WX_PY, [path.join(ENGINE_DIR, 'media', 'align.py'), wav, file, file, '--lang', lang], { timeout: 20 * 60000 });
    const r = JSON.parse(String(stdout).trim().split('\n').pop());
    console.log(`[transcribe] WhisperX ${JSON.stringify(r)}`);
    return r.ok ? r : null;
  } catch (e) { if (signal?.aborted) throw e; console.error('[whisperx]', e.message?.slice(0, 200)); return null; }
}
// WhisperX, kept only when it does not make the words worse: on speech it cannot follow it can stretch a word over seconds
// or move words past the end. Then the times as heard stay.
async function alignGuarded(wav, file, lang, signal, rms) {
  const before = fs.readFileSync(file, 'utf8'), bad = (ws) => ws.filter((w) => w.end - w.start > LONG_WORD || w.start >= rms.length / 20).length;
  const r = await alignFile(wav, file, lang, signal);
  try {
    const was = bad(JSON.parse(before)), now = bad(JSON.parse(fs.readFileSync(file, 'utf8')));
    if (now > was) { fs.writeFileSync(file, before); console.error(`[transcribe] WhisperX made ${now - was} words impossible: the times as heard kept`); return null; }
  } catch { fs.writeFileSync(file, before); return null; }
  return r;
}
// The times drifted (a noisy take: whisper skipped stretches and the aligner had no hold there): whisper listens again in
// short windows for anchors (anchors.py), the words are matched to them and aligned from there (align.py --anchors). Kept
// only when it is clearly better. The words never change. → the new { ok, conf, low } or null
const RE_ANCHOR = () => Number(process.env.ZANCUT_ANCHOR_CONF || 0.8);
async function reAnchor(wav, file, lang, wx, dir, signal) {
  const heard = path.join(dir, 'heard-anchors.json'), own = fs.existsSync(heard); // the words were heard in short pieces already
  if (!own && !(await hasMlx())) return null;
  const anchors = own ? heard : path.join(dir, 'anchors.json'), tmp = path.join(dir, 'anchored.json');
  try {
    if (!own) await run(PYTHON, [path.join(ENGINE_DIR, 'media', 'anchors.py'), wav, anchors, '--lang', lang], { timeout: 30 * 60000 });
    fs.copyFileSync(file, tmp);
    const { stdout } = await run(WX_PY, [path.join(ENGINE_DIR, 'media', 'align.py'), wav, tmp, tmp, '--lang', lang, '--anchors', anchors], { timeout: 20 * 60000 });
    const r = JSON.parse(String(stdout).trim().split('\n').pop());
    console.log(`[transcribe] anchored: ${JSON.stringify(r)} (before: conf ${wx?.conf ?? 'n/a'}, low ${wx?.low ?? 'n/a'})`);
    if (!r.ok || r.conf == null || r.conf < (wx?.conf ?? 0) + 0.03) return null;
    fs.copyFileSync(file, path.join(dir, 'drifted-words.json')); fs.renameSync(tmp, file);
    return r;
  } catch (e) { if (signal?.aborted) throw e; console.error('[anchors]', e.message?.slice(0, 200)); return null; }
  finally { fs.rmSync(tmp, { force: true }); }
}
export const slug = (file) => file.replace(/\.[^.]+$/, '').replace(/[^\w-]+/g, '_');

// Writes ws/transcripts/<clip>/transcript.json (word-level) for each clip. Never throws: if it fails,
// the caller reports the local listening failure.
export async function transcribeFootage(ws, p, onStep, signal) {
  currentSignal = signal || null;
  const results = [];
  // Camera footage and uploaded voiceovers both get word-level transcripts.
  const items = [
    ...p.footage.map((f) => ({ ...f, rel: f.rel || `raw/${f.file}` })),
    ...(p.assets || []).filter((a) => a.role === 'voiceover').map((a) => ({ ...a, hasAudio: true, rel: `assets/${a.file}` })),
  ];
  for (const f of items) {
    const tname = slug(f.rel.replace(/\//g, '-'));
    const dir = path.join(ws, 'transcripts', tname);
    const transcript = `transcripts/${tname}/transcript.json`;
    const out = path.join(dir, 'transcript.json');
    const meta = path.join(dir, 'meta.json');
    if (fs.existsSync(out) && fs.existsSync(meta)) { results.push({ file: f.file, rel: f.rel, transcript, ...JSON.parse(fs.readFileSync(meta, 'utf8')) }); continue; }
    if (!f.hasAudio) continue;
    fs.mkdirSync(dir, { recursive: true });
    try {
      onStep(`Listening to ${f.original || f.file}`);
      const wav = path.join(dir, 'audio.wav');
      await run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ws, f.rel), '-vn', '-ac', '1', '-ar', '16000', wav], { timeout: 600000 });
      fs.rmSync(path.join(dir, 'heard-anchors.json'), { force: true });
      const rms = levelsOf(wav); // the sound's level every 50 ms: where the speech is (the pieces, and the check that every second has words)
      let lang = p.language && p.language !== 'auto' ? p.language : null;
      if (!lang) {
        const d = await detectLanguage(wav);
        lang = d?.lang || FALLBACK_LANG || 'en'; // nothing detected (timeout): the fallback language, not English by default
        if (d && d.lang !== 'en' && d.p < 0.6 && FALLBACK_LANG) lang = FALLBACK_LANG; // an unsure guess (Bangla heard as Hindi, p 0.32): the fallback
        if (d && lang === 'en' && d.p < SURE && FALLBACK_LANG) lang = FALLBACK_LANG;
        console.log(`[transcribe] ${f.file}: detected ${d ? `${d.lang} (p=${d.p})` : 'nothing'} → using ${lang}`);
      }
      // 1A: the local transcriber first, then WhisperX for the millisecond word boundaries and how much of the speech it can trust
      onStep(`Transcribing ${f.original || f.file} (${lang})`);
      let gaps = [];
      if (lang === 'en') {
        // Parakeet: fastest and most accurate for English.
        const [nc, na] = npx(['hyperframes', 'transcribe', wav, '-d', dir, '--json', '-l', 'en']);
        const { stdout } = await run(nc, na, { cwd: dir, timeout: 30 * 60000 });
        // it can end "fine" having done nothing ({"ok":false,"skipped":true,"reason":"whisper_unavailable"}: no speech model):
        // Say why, so the local log shows the real cause
        const said = String(stdout).trim().split('\n').reverse().map((l) => { try { return JSON.parse(l); } catch { return null; } }).find((j) => j && 'ok' in j);
        if (said && !said.ok) throw new Error(`hyperframes transcribe did nothing: ${said.reason || said.error || 'no reason given'}${said.install ? ` (needs: ${said.install})` : ''}`);
        // the same checks as every language: pieces it heard wrong (a word over seconds, a loop, speech without words) heard again
        const words = fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, 'utf8')) : null;
        if (Array.isArray(words) && words.length) {
          const engines = [...(await hasMlx() ? ['mlx'] : []), ...(fs.existsSync(path.join(MODELS, 'ggml-large-v3.bin')) ? ['whisper'] : [])];
          const r = await repair(words.map((w) => ({ ...w, text: String(w.text ?? w.word ?? '').trim() })).filter((w) => w.text), { wav, lang, dir, p, rms, engines });
          fs.writeFileSync(out, JSON.stringify(r.words, null, 1)); gaps = r.gaps;
          if (r.fixed) onStep(`Some speech was heard wrong: ${r.fixed} part${r.fixed > 1 ? 's' : ''} listened to again`);
        }
      } else {
        const r = await localWords(wav, lang, dir, out, p, rms); gaps = r.gaps;
        if (r.fixed) onStep(`Some speech was heard wrong: ${r.fixed} part${r.fixed > 1 ? 's' : ''} listened to again`);
      }
      if (!fs.existsSync(out)) throw new Error('no transcript written');
      let wx = null;
      if (whisperxReady()) { onStep('Timing every word exactly (WhisperX)'); wx = await alignGuarded(wav, out, lang, signal, rms); }
      console.log(`[transcribe] ${f.file}: local words kept (${lang}, confidence ${wx?.conf ?? 'n/a'})`);
      if (whisperxReady() && wx && (wx.conf < RE_ANCHOR() || wx.low > 0.15)) { onStep('Some word times are unsure: checking them against what was heard'); wx = await reAnchor(wav, out, lang, wx, dir, signal) || wx; }
      const words = JSON.parse(fs.readFileSync(out, 'utf8'));
      // the last check: speech (over 2 s) that still has no words is named, so the customer sees it on the transcript
      gaps = Array.isArray(words) ? wordGapHoles(rms)(words.map((w) => ({ s: w.start, e: w.end })), 0, rms.length / 20) : gaps;
      const info = { language: lang, words: Array.isArray(words) ? words.length : 0, conf: wx?.conf ?? null, tags: null, ...(gaps.length ? { gaps } : {}) };
      fs.writeFileSync(meta, JSON.stringify(info));
      fs.rmSync(wav, { force: true });
      results.push({ file: f.file, rel: f.rel, transcript, ...info });
    } catch (e) {
      if (signal?.aborted) return results;
      console.error('[transcribe]', f.file, e.message?.slice(0, 300));
      onStep(`Couldn't pre-transcribe ${f.original || f.file}; retry the local listening step`);
    }
  }
  return results;
}

// The customer heard a part of the transcript wrong (Step 2, "Listen again"): only [from, to] (seconds on that clip) is
// listened to again: in pieces cut at other moments than the first time, with the first engine and whole with the other one,
// and the listen with the fewest troubles (then the most words) replaces the words there. Every other word stays as it is.
// → { before, after } (the words in that part), or null when that clip has no transcript
export async function relistenRange(ws, rel, from, to, p, onStep, signal) {
  currentSignal = signal || null;
  const dir = path.join(ws, 'transcripts', slug(rel.replace(/\//g, '-'))), out = path.join(dir, 'transcript.json'), metaF = path.join(dir, 'meta.json');
  if (!fs.existsSync(out)) return null;
  const meta = JSON.parse(fs.readFileSync(metaF, 'utf8')), lang = meta.language || p.language || 'en';
  const wav = path.join(dir, 'audio.wav');
  await run('ffmpeg', ['-v', 'error', '-y', '-i', path.join(ws, rel), '-vn', '-ac', '1', '-ar', '16000', wav], { timeout: 600000 });
  try {
    const rms = levelsOf(wav), holesOf = wordGapHoles(rms), prompt = promptFor(lang, p);
    const ps = piecesOf(rms).map(([a, b]) => [Math.max(a, from), Math.min(b, to)]).filter(([a, b]) => b - a >= 0.3);
    const words = JSON.parse(fs.readFileSync(out, 'utf8')), mid = (w) => (w.start + w.end) / 2, inside = (w) => mid(w) >= from && mid(w) < to;
    const before = words.filter(inside);
    if (!ps.length) return { before: before.length, after: before.length };
    const engines = [...(await hasMlx() ? ['mlx'] : []), ...(fs.existsSync(path.join(MODELS, 'ggml-large-v3.bin')) ? ['whisper'] : [])];
    onStep('Listening to that part again');
    const tries = [];
    for (const [k, e] of engines.entries()) {
      try { tries.push((await listen(e, wav, lang, dir, k ? ps : ps.flatMap((pc) => halves(pc, rms)), prompt)).filter(inside)); } catch (err) { console.error('[relisten]', e, err.message?.slice(0, 160)); }
    }
    if (!tries.length) throw new Error('no speech model to listen with');
    const score = (ws) => ps.reduce((n, pc) => n + troubleOf(ws, pc, holesOf).length, 0) * 1000 - ws.length + loopRepeats(ws).length * 2;
    const best = tries.reduce((x, y) => (score(y) < score(x) ? y : x));
    const loops = new Set(loopRepeats(best));
    const got = best.filter((w, i) => !loops.has(i)).map(({ p: _, ...w }) => (w.end - w.start > LONG_WORD ? { ...w, end: +(w.start + 0.8).toFixed(3) } : w));
    const next = [...words.filter((w) => !inside(w)), ...got].sort((x, y) => x.start - y.start).map((w, i) => ({ ...w, id: `w${i}` }));
    fs.writeFileSync(out, JSON.stringify(next, null, 1));
    console.log(`[relisten] ${rel} ${from}–${to} s: ${before.length} → ${got.length} words (${engines.join(', ')})`);
    return { before: before.length, after: got.length };
  } finally { fs.rmSync(wav, { force: true }); }
}

