#!/usr/bin/env node
// Rough cut: raw clip -> tight, fast, clean talking-head cut + re-timed transcript.
//
//   node engine/roughcut.mjs prep <job>   transcribe + snap + write work/script.md and work/cuts.json
//   node engine/roughcut.mjs cut  <job>   apply work/cuts.json -> cut/cut.mp4, cut/transcript.json, cut/script.txt
//
// Options: --format <short-explainer|short-tiktok|long-youtube>  --lang bn  --engine mlx|hf
//          --threshold -36 (silence dB)  --speed 1.1  --cropx 0.5  --fit crop|blur
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { homedir } from "node:os";
import { ENGINE, ROOT, PRESETS, PY, npx, readJSON, writeJSON, loadStyle, ffmpeg, probe, listMedia, args, r3, graphemes } from "./lib.mjs";
import { findRetakes, toRanges } from "./retakes.mjs";
import { measure, correction, look } from "./color.mjs";

const A = args();
const [cmd, jobArg] = A._;
if (!cmd || !jobArg) {
  console.error("usage: roughcut.mjs prep|cut <projects/job> [--format ..] [--lang bn]");
  process.exit(1);
}
const JOB = resolve(jobArg);
const W = join(JOB, "work");
const C = join(JOB, "cut");
mkdirSync(W, { recursive: true });

const jobFile = join(JOB, "job.json");
const job = readJSON(jobFile, {});
if (A.format) job.format = A.format;
if (A.lang) job.lang = A.lang;
if (A.cropx) job.cropX = Number(A.cropx);
if (A.fit) job.fit = A.fit;
if (A.speed) job.speed = Number(A.speed);
job.format ||= "short-explainer";
job.lang ||= "bn";
writeJSON(jobFile, job);
const { brand, fmt } = loadStyle(job.format, job.canvas);
const RC = { ...fmt.roughCut, ...(job.roughCut || {}) }; // job.json "roughCut" overrides the preset per job

// Pure filler sounds — always safe to drop. Semantic fillers ("মানে", "আসলে", "like") are Claude's call in cuts.json.
const FILLERS = new Set(["um", "uh", "uhm", "umm", "ah", "er", "erm", "hmm", "mm", "উম", "উমম", "আ", "আআ", "এ", "এহ", "উহ", "আহ", "হুম", "অ্যা", "এম"]);
const norm = (t) => t.toLowerCase().replace(/[.,!?।;:"'“”‘’…\-]/g, "").trim();

// iPhone/Android HDR (HLG / PQ) -> SDR bt709 via VideoToolbox tonemapping; otherwise colors wash out.
function toSDR(f, out) {
  // the cut is an in-between file (the final render encodes again): veryfast + crf 14 is visually the same, ~2x faster
  const enc = ["-c:v", "libx264", "-preset", "veryfast", "-crf", "14", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
    "-c:a", "aac", "-ar", "48000", "-b:a", "256k", out];
  try {
    ffmpeg(["-hwaccel", "videotoolbox", "-hwaccel_output_format", "videotoolbox_vld", "-i", f,
      "-vf", "scale_vt=color_matrix=bt709:color_primaries=bt709:color_transfer=bt709,hwdownload,format=p010le,format=yuv420p", ...enc]);
  } catch {
    // Zancut: no VideoToolbox (Linux server, or blocked by the sandbox) -> software tonemap with zscale.
    try {
      ffmpeg(["-i", f, "-vf", "zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p", ...enc]);
    } catch {
      // No zscale either: a plain BT.2020 -> BT.709 conversion with a little contrast back.
      ffmpeg(["-i", f, "-vf", "colorspace=all=bt709:iall=bt2020:fast=1,eq=contrast=1.06:saturation=1.08,format=yuv420p", ...enc]);
    }
  }
  return out;
}

function sourceFile() {
  const raws = listMedia(join(JOB, "raw"));
  if (!raws.length) throw new Error(`no video in ${join(JOB, "raw")}`);
  if (raws.length === 1) {
    if (!probe(raws[0]).hdr) return raws[0];
    const out = join(W, "source-sdr.mp4");
    if (!existsSync(out)) { console.error("HDR source detected — tonemapping to SDR (one time)…"); toSDR(raws[0], out); }
    return out;
  }
  // Several clips: normalize (+ tonemap HDR) and join in filename order.
  const out = join(W, "source.mp4");
  if (!existsSync(out)) {
    const list = join(W, "concat.txt");
    const parts = raws.map((f, i) => {
      const p = join(W, `part${i}.mp4`);
      if (probe(f).hdr) toSDR(f, join(W, `part${i}-sdr.mp4`)), (f = join(W, `part${i}-sdr.mp4`));
      ffmpeg(["-i", f, "-vf", "fps=30,format=yuv420p", "-c:v", "libx264", "-crf", "14", "-preset", "fast", "-c:a", "aac", "-ar", "48000", "-b:a", "256k", p]);
      return `file '${p}'`;
    });
    writeFileSync(list, parts.join("\n"));
    ffmpeg(["-f", "concat", "-safe", "0", "-i", list, "-c", "copy", out]);
  }
  return out;
}

// ---------- prep ----------
function silences(wav, thr) {
  const log = ffmpeg(["-i", wav, "-af", `highpass=f=100,lowpass=f=7000,silencedetect=n=${thr}dB:d=0.1`, "-f", "null", "-"], { loglevel: "info" });
  const out = [];
  let s = null;
  for (const line of log.split("\n")) {
    const a = line.match(/silence_start: ([\d.]+)/);
    const b = line.match(/silence_end: ([\d.]+)/);
    if (a) s = Number(a[1]);
    if (b && s !== null) { out.push([s, Number(b[1])]); s = null; }
  }
  return out;
}

function islandsFrom(sil, dur) {
  const isl = [];
  let t = 0;
  for (const [a, b] of sil) { if (a > t) isl.push([t, a]); t = b; }
  if (t < dur) isl.push([t, dur]);
  return isl.filter(([a, b]) => b - a >= 0.05);
}

// Re-time words onto real speech islands. Whisper drifts into pauses; energy doesn't lie.
// Monotone DP: each island takes a contiguous (maybe empty) block of words. Cost = speaking-rate fit
// + distance from Whisper's own timing + sentence punctuation landing mid-island. Language-agnostic.
function snap(words, isl) {
  if (!isl.length || !words.length) return words;
  const n = words.length, m = isl.length, MAXB = 48;
  const g = words.map((w) => graphemes(w.text) + 1);
  const G = [0];
  g.forEach((x, i) => (G[i + 1] = G[i] + x));
  const speechDur = isl.reduce((s, [a, b]) => s + (b - a), 0);
  const R = G[n] / speechDur; // graphemes per second of speech
  const TERM = /[.!?।]$/, ANYP = /[.,!?।;:…]$/;
  const dist = (w, [a, b]) => {
    const mid = (w.start + w.end) / 2;
    return mid < a - 0.1 ? a - 0.1 - mid : mid > b + 0.1 ? mid - b - 0.1 : 0;
  };
  const cost = (k, j, jj) => {
    const [a, b] = isl[k];
    const d = b - a;
    if (jj === j) return 1.5 * d; // island with no words (breath, noise, untranscribed "um")
    const E = (G[jj] - G[j]) / R;
    let c = 2 * Math.abs(Math.log((d + 0.15) / (E + 0.15)));
    for (let i = j; i < jj; i++) {
      c += 1.5 * dist(words[i], isl[k]);
      if (i < jj - 1 && TERM.test(words[i].text)) c += 0.6;
    }
    if (!ANYP.test(words[jj - 1].text) && jj < n) c += 0.25;
    return c;
  };
  const INF = 1e18;
  const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1).fill(INF));
  const bk = Array.from({ length: m + 1 }, () => new Int32Array(n + 1).fill(-1));
  dp[0][0] = 0;
  for (let k = 0; k < m; k++) {
    for (let j = 0; j <= n; j++) {
      if (dp[k][j] >= INF) continue;
      for (let jj = j; jj <= Math.min(n, j + MAXB); jj++) {
        const v = dp[k][j] + cost(k, j, jj);
        if (v < dp[k + 1][jj]) { dp[k + 1][jj] = v; bk[k + 1][jj] = j; }
      }
    }
  }
  if (dp[m][n] >= INF) return words; // could not align (block cap) — keep Whisper timing
  let j = n;
  for (let k = m; k > 0; k--) {
    const j0 = bk[k][j];
    for (let i = j0; i < j; i++) words[i]._isl = k - 1;
    j = j0;
  }
  const groups = new Map();
  for (const w of words) { if (!groups.has(w._isl)) groups.set(w._isl, []); groups.get(w._isl).push(w); }
  for (const [i, ws] of groups) {
    const [a, b] = isl[i];
    const span = b - a;
    const clamped = ws.map((w) => [Math.min(Math.max(w.start, a), b), Math.min(Math.max(w.end, a), b)]);
    const cover = clamped.reduce((s, [x, y]) => s + (y - x), 0);
    const collapsed = clamped.some(([x, y]) => y - x < 0.04);
    if (collapsed || cover < 0.45 * span) {
      // proportional to grapheme count
      const wt = ws.map((w) => graphemes(w.text) + 1.5);
      const tot = wt.reduce((s, x) => s + x, 0);
      let t = a;
      ws.forEach((w, k) => { w.start = r3(t); t += (span * wt[k]) / tot; w.end = r3(t); });
    } else {
      ws.forEach((w, k) => { w.start = r3(clamped[k][0]); w.end = r3(clamped[k][1]); });
      ws[0].start = r3(a);
      ws[ws.length - 1].end = r3(b);
      for (let k = 0; k < ws.length - 1; k++) if (ws[k + 1].start - ws[k].end < 0.15) ws[k].end = ws[k + 1].start;
    }
  }
  for (const w of words) delete w._isl;
  return words;
}

function applyCorrections(words) {
  const cc = readJSON(join(PRESETS, "caption-corrections.json"), { words: {} });
  for (const w of words) {
    const m = w.text.match(/^(.*?)([.,!?।;:…]*)$/);
    const core = m[1], punct = m[2];
    if (cc.words?.[core]) w.text = cc.words[core] + punct;
  }
  return words;
}

function transcribe(wav, out) {
  const py = PY;
  const useMlx = (A.engine || "mlx") === "mlx" && existsSync(py);
  if (useMlx) {
    const r = spawnSync(py, [join(ENGINE, "transcribe.py"), wav, out, "--lang", job.lang], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
    if (r.status === 0) return "mlx-whisper";
    console.error("mlx-whisper failed, falling back to hyperframes whisper.cpp");
  }
  const tmp = join(W, "hf-tx");
  mkdirSync(tmp, { recursive: true });
  const model = job.lang === "en" ? "small.en" : "large-v3";
  const [nc, na, no] = npx(["hyperframes", "transcribe", wav, "-d", tmp, "--json", "-m", model, "-l", job.lang, "-e", "whisper"]);
  const r = spawnSync(nc, na, { encoding: "utf8", cwd: ROOT, ...no });
  if (r.status !== 0) throw new Error("transcription failed:\n" + r.stderr);
  const words = readJSON(join(tmp, "transcript.json")).map((w) => ({ text: w.text, start: w.start, end: w.end, p: 1 }));
  writeJSON(out, words);
  return "whisper.cpp " + model;
}

// Voice enhancement. Output: work/voice.wav (48k mono); silence detection, transcription and the cut's audio use it.
// Noise removal runs ONLY when the clip has real room noise: on a clean mic it can only damage the voice (a clean
// clip once came back with ~700 swallowed word pieces from the FFT filter + gate). DeepFilterNet3 is preferred; the
// built-in filter is a gentle fallback. Every result is compared with the original voice and thrown away if it ate speech.
const VOICE_EQ = [
  "highpass=f=85:poles=2",
  "equalizer=f=250:t=q:w=1.1:g=-2",      // room mud
  "equalizer=f=3500:t=q:w=1.4:g=2.5",    // presence / clarity
  "highshelf=f=9000:g=1.5",               // air
  "deesser=i=0.3:m=0.5:f=0.5",
  "acompressor=threshold=-22dB:ratio=2.5:attack=8:release=150:makeup=2",
].join(",");
// 20 ms levels (dB) of a file's first audio stream, 16 kHz mono
function levels(file) {
  const pcm = spawnSync("ffmpeg", ["-v", "error", "-i", file, "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], { maxBuffer: 1 << 29 }).stdout || Buffer.alloc(0);
  const lv = [];
  for (let o = 0; o + 640 <= pcm.length; o += 640) { let e = 0; for (let k = o; k < o + 640; k += 2) { const v = pcm.readInt16LE(k) / 32768; e += v * v; } lv.push(10 * Math.log10(e / 320 + 1e-12)); }
  return lv;
}
// room noise = the level of the quietest 3–8% of moments (true digital silence left out)
function roomNoise(lv) {
  const s = lv.filter((d) => d > -85).sort((a, b) => a - b);
  const part = s.slice(Math.floor(s.length * 0.03), Math.max(Math.floor(s.length * 0.03) + 1, Math.floor(s.length * 0.08)));
  return Math.max(-80, Math.min(-25, part.length ? part.reduce((a, b) => a + b, 0) / part.length : -60));
}
// share of speech moments a clean-up pushed down by more than 10 dB (after allowing for the overall level change)
function swallowed(a, b) {
  const n = Math.min(a.length, b.length), d = [];
  for (let i = 0; i < n; i++) if (a[i] > -35) d.push(b[i] - a[i]);
  if (!d.length) return 0;
  const med = d.sort((x, y) => x - y)[Math.floor(d.length / 2)];
  let sp = 0, bad = 0;
  for (let i = 0; i < n; i++) if (a[i] > -40) { sp++; if (b[i] - a[i] - med < -10) bad++; }
  return bad / Math.max(1, sp);
}
function enhance(src) {
  const out = join(W, "voice.wav");
  if (job.enhance === false) return null;
  const orig = join(W, "orig48.wav");
  ffmpeg(["-i", src, "-map", "0:a:0", "-vn", "-ac", "1", "-ar", "48000", orig]);
  const lv0 = levels(orig), floor = roomNoise(lv0);
  // job.json "denoise": a number forces noise removal at that strength, false turns it off
  const noisy = job.denoise === false ? false : job.denoise != null ? true : floor > -58;
  const report = { roomNoiseDb: +floor.toFixed(1), noisy, method: "voice EQ only (clean recording)" };
  let den = orig, chain = VOICE_EQ;
  if (noisy) {
    const strength = typeof job.denoise === "number" ? job.denoise : floor > -45 ? 30 : 18;
    // DeepFilterNet (scripts/setup-audio.sh installs it): the first copy found is used.
    const home = process.env.HOME || homedir();
    const df = [process.env.ZANCUT_DEEPFILTER, join(ENGINE, "bin", "deep-filter"), join(home, ".cache", "zancut", "bin", "deep-filter"), "/usr/local/bin/deep-filter", "/opt/homebrew/bin/deep-filter", ...(process.env.PATH || "").split(process.platform === "win32" ? ";" : ":").flatMap((d) => [join(d, "deep-filter"), join(d, "deep-filter.exe")])].find((f) => f && existsSync(f)) || "";
    if (df) {
      const r = spawnSync(df, ["-D", "-a", String(strength), "-o", join(W, "df"), orig], { encoding: "utf8" });
      if (r.status === 0 && existsSync(join(W, "df", "orig48.wav"))) { den = join(W, "df", "orig48.wav"); report.method = `DeepFilterNet ${strength} dB`; }
      else console.error(`deep-filter failed (${String(r.stderr || r.error || "").slice(-160)}); using the built-in filter`);
    } else console.error("deep-filter not found: run scripts/setup-audio.sh. Using the built-in filter");
    if (den === orig) {
      // one gentle pass, no gate: a gate or a second pass chops soft word endings
      chain = `afftdn=nr=${Math.min(strength, 20)}:nf=${Math.max(-70, Math.min(-30, floor + 4)).toFixed(0)}:tn=0,${VOICE_EQ}`;
      report.method = `built-in filter ${Math.min(strength, 20)} dB`;
    }
  }
  ffmpeg(["-i", den, "-af", chain, "-ar", "48000", out]);
  // safety check: the clean-up must not eat the voice. If it did, keep the original voice with the EQ only.
  report.swallowed = +swallowed(lv0, levels(out)).toFixed(4);
  if (report.swallowed > 0.01 && (den !== orig || chain !== VOICE_EQ)) {
    console.error(`voice clean-up removed parts of the speech (${(report.swallowed * 100).toFixed(1)}% of moments): using the original voice with EQ only`);
    ffmpeg(["-i", orig, "-af", VOICE_EQ, "-ar", "48000", out]);
    report.method += " -> rejected, voice EQ only";
    report.swallowed = +swallowed(lv0, levels(out)).toFixed(4);
  }
  writeJSON(join(W, "voice-report.json"), report);
  console.error(`voice: room noise ${report.roomNoiseDb} dB, ${report.method}, speech damaged ${(report.swallowed * 100).toFixed(2)}%`);
  return out;
}

function prep() {
  const src = sourceFile();
  const info = probe(src);
  const voice = enhance(src);
  const wav = join(W, "audio16k.wav");
  ffmpeg(["-i", voice || src, "-vn", "-ac", "1", "-ar", "16000", wav]);
  const mean = Number(ffmpeg(["-i", wav, "-af", "volumedetect", "-f", "null", "-"], { loglevel: "info" }).match(/mean_volume: ([-\d.]+)/)?.[1] ?? -24);
  const thr = A.threshold ? Number(A.threshold) : Math.max(-50, Math.min(-28, Math.round(mean - 14)));
  const sil = silences(wav, thr);
  const isl = islandsFrom(sil, info.duration);
  writeJSON(join(W, "speech.json"), { threshold: thr, meanVolume: mean, islands: isl.map(([a, b]) => [r3(a), r3(b)]) });

  const rawTx = join(W, "transcript.raw.json");
  let engine = "cached";
  if (!existsSync(rawTx) || A.retranscribe) engine = transcribe(wav, rawTx);
  let words = readJSON(rawTx).map((w) => ({ ...w }));
  words = applyCorrections(job.exactTimes ? words : snap(words, isl)); // exact times (WhisperX) are kept as they are
  words.forEach((w, i) => {
    w.i = i;
    if (FILLERS.has(norm(w.text))) w.filler = true;
  });
  writeJSON(join(W, "transcript.json"), words);

  // Human/Claude-readable script: one line per sentence-ish phrase, with word index ranges.
  const lines = [];
  let cur = [];
  const flush = () => {
    if (!cur.length) return;
    const a = cur[0], b = cur[cur.length - 1];
    const txt = cur.map((w) => (w.filler ? `~~${w.text}~~` : w.p < 0.45 ? `${w.text}⚠` : w.text)).join(" ");
    lines.push(`- \`#${a.i}–#${b.i}\` [${a.start.toFixed(2)}–${b.end.toFixed(2)}] ${txt}`);
    cur = [];
  };
  words.forEach((w, k) => {
    cur.push(w);
    const nxt = words[k + 1];
    if (/[.!?।]$/.test(w.text) || !nxt || nxt.start - w.end > 0.6) flush();
  });
  flush();
  // Retakes, false starts, stutters, "sorry, again" — found by code; high-confidence ones are pre-filled into cuts.json.
  const retakes = findRetakes(words);
  writeJSON(join(W, "retakes.json"), retakes);
  const rtLines = retakes.map((r) => `- ${r.confidence === "high" ? "**cut**" : r.confidence === "medium" ? "check" : "maybe"} \`#${r.remove[0]}–#${r.remove[1]}\` ${r.kind}: ${r.why}`);
  const md = [
    `# Script — ${relative(ROOT, JOB)}`,
    "",
    `Source: \`${relative(JOB, src)}\` · ${info.width}x${info.height} · ${info.duration.toFixed(1)}s · transcribed with ${engine} (lang=${job.lang}) · silence threshold ${thr} dB`,
    "",
    "~~struck~~ = filler, removed automatically. ⚠ = low-confidence word, check it.",
    "Edit `work/cuts.json`: `removeWords` (inclusive index ranges: retakes, false starts, rambling), `removeRanges` (seconds), `fix` (index → corrected text).",
    "",
    ...lines,
    "",
    `## Retakes found by code (${retakes.length}): **cut** = already in cuts.json (undo by removing it), check / maybe = your call`,
    ...(rtLines.length ? rtLines : ["- none"]),
    "",
  ].join("\n");
  writeFileSync(join(W, "script.md"), md);
  // how the cut will frame the source: the cut-out can start on the whole take now, while the AI plans (matte.mjs --early)
  writeJSON(join(W, "frame.json"), { src, fps: fmt.canvas.fps || 30, vf: canvasVf(info), w: fmt.canvas.width, h: fmt.canvas.height, duration: r3(info.duration) });
  const cutsFile = join(W, "cuts.json");
  if (!existsSync(cutsFile)) {
    // job.json from the setup page: "aiCut": false = the customer cut it themselves (no automatic retake cuts),
    // "keepFillers" = keep um/uh, "manualCuts" = their own cuts (seconds of the joined raw footage)
    // job.json "cutBy": "ai" = Gemini marks the cut, Opus confirms it in the storyboard: the engine removes nothing by itself
    const auto = job.aiCut === false || job.cutBy === "ai" ? [] : retakes.filter((r) => r.confidence === "high");
    writeJSON(cutsFile, { removeWords: toRanges(auto), removeRanges: job.manualCuts || [], fix: {}, keepFillers: !!job.keepFillers || job.cutBy === "ai",
      notes: auto.length ? `auto (code): ${auto.map((r) => `${r.kind} #${r.remove[0]}–#${r.remove[1]}`).join(", ")}` : "" });
  }
  console.log(JSON.stringify({ ok: true, source: src, duration: r3(info.duration), size: `${info.width}x${info.height}`, words: words.length, retakes: retakes.length, engine, threshold: thr, script: join(W, "script.md") }));
}

// 5 ms RMS envelope of a (mono) wav, plus the typical speech level (median of voiced frames)
function energyEnvelope(wav) {
  if (!existsSync(wav)) return null;
  const r = spawnSync("ffmpeg", ["-v", "error", "-i", wav, "-f", "s16le", "-ac", "1", "-ar", "16000", "-"], { maxBuffer: 1 << 30 });
  if (r.status !== 0) return null;
  const b = r.stdout, n = b.length >> 1, hopN = 80, rms = [];
  for (let i = 0; i + hopN <= n; i += hopN) { let e = 0; for (let j = 0; j < hopN; j++) { const v = b.readInt16LE((i + j) * 2) / 32768; e += v * v; } rms.push(Math.sqrt(e / hopN)); }
  const voiced = rms.filter((v) => v > 0.01).sort((x, y) => x - y);
  return { hop: hopN / 16000, rms, speech: voiced.length ? voiced[Math.floor(voiced.length / 2)] : 0.05 };
}

// the source framed to the canvas (crop, or blurred sides); shared by the cut and the early cut-out (matte.mjs --early)
function canvasVf(info) {
  const { width: TW, height: TH } = fmt.canvas;
  const cropX = job.cropX ?? 0.5, cropY = job.cropY ?? 0.5;
  const srcAR = info.width / info.height, tAR = TW / TH;
  if (job.fit === "blur" && Math.abs(srcAR - tAR) > 0.01)
    return `split[m][b];[b]scale=${TW}:${TH}:force_original_aspect_ratio=increase,crop=${TW}:${TH},gblur=sigma=40,eq=brightness=-0.08[bg];[m]scale=${TW}:${TH}:force_original_aspect_ratio=decrease[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2`;
  if (srcAR > tAR) return `scale=-2:${TH},crop=${TW}:${TH}:(iw-${TW})*${cropX}:0`;
  return `scale=${TW}:-2,crop=${TW}:${TH}:0:(ih-${TH})*${cropY}`;
}

// ---------- cut ----------
function cut() {
  // --variant raw: identical timing, but no grade / no voice enhancement (for before/after reveals)
  const RAW = A.variant === "raw";
  const src = sourceFile();
  const info = probe(src);
  const words = readJSON(join(W, "transcript.json"));
  const cuts = readJSON(join(W, "cuts.json"), { removeWords: [], removeRanges: [], fix: {} });
  for (const [k, v] of Object.entries(cuts.fix || {})) if (words[k]) words[k].text = v;
  const removed = new Set();
  if (!cuts.keepFillers) words.forEach((w) => w.filler && removed.add(w.i));
  for (const r of cuts.removeWords || []) {
    const [a, b] = Array.isArray(r) ? r : [r, r];
    for (let i = a; i <= b; i++) removed.add(i);
  }
  for (const [a, b] of cuts.removeRanges || []) words.forEach((w) => { if (w.start >= a - 0.02 && w.end <= b + 0.02) removed.add(w.i); });

  // the customer decides the cut (job.cutBy "ai"): what goes is only what they chose on step 2 (their own cuts, the Magic Cut
  // ranges they kept, the words they removed). Nothing else, ever: no pause is shortened, nothing is sped up
  const AIC = job.cutBy === "ai";
  const MAXG = AIC ? Infinity : RC.maxGap;
  const speed = AIC ? 1 : job.speed || RC.speed || 1;
  const fps = fmt.canvas.fps || 30;
  const F = 1 / fps;
  const snapF = (t) => Math.round(t / F) * F;

  // the sound itself (the cut audit below)
  const env = energyEnvelope(existsSync(join(W, "voice.wav")) && !RAW ? join(W, "voice.wav") : join(W, "audio16k.wav"));

  // Build keep segments.
  const segs = [];
  if (AIC) {
    // the customer's cut: the whole track stays and only what they removed goes. Nothing is ever dropped for having no words,
    // so wrong or missing words never shorten the video (a 93 s voice whose transcript stopped at 48 s was cut to 48 s). Only
    // the silence after the last sound (the file's own padding) is left off; a 2D film's quiet end is planned (a laugh, an end card): job.keepTail
    let end = info.duration;
    if (env && !job.keepTail) { let k = env.rms.length - 1; while (k > 0 && env.rms[k] < 0.003) k--; end = Math.min(info.duration, (k + 1) * env.hop + 0.4); }
    const gone = (cuts.removeRanges || []).map(([a, b]) => [a, b]);
    // a removed run of words: from the kept word before it to the kept word after it (its pauses go with it)
    for (let k = 0; k < words.length; k++) {
      if (!removed.has(words[k].i)) continue;
      let j = k; while (j + 1 < words.length && removed.has(words[j + 1].i)) j++;
      const prev = words[k - 1], next = words[j + 1];
      gone.push([prev ? Math.min(words[k].start, prev.end + RC.padOut) : Math.max(0, words[k].start - RC.padIn), next ? Math.max(words[j].end, next.start - RC.padIn) : end]);
      k = j;
    }
    gone.sort((x, y) => x[0] - y[0]);
    let at = 0;
    for (const [a, b] of [...gone, [end, Infinity]]) { if (Math.min(a, end) - at > 2 * F) segs.push({ a: at, b: Math.min(a, end), words: [] }); at = Math.max(at, b); }
    for (const w of words) { const m = (w.start + w.end) / 2, s = !removed.has(w.i) && segs.find((x) => m >= x.a && m < x.b); if (s) s.words.push(w); }
  } else words.forEach((w, k) => {
    if (removed.has(w.i)) return;
    const prevEnd = k > 0 ? words[k - 1].end : 0;
    const nextStart = k < words.length - 1 ? words[k + 1].start : info.duration;
    let a = Math.max(0, Math.max(w.start - RC.padIn, removed.has(w.i - 1) ? prevEnd : -1));
    const b = Math.min(info.duration, Math.min(w.end + RC.padOut, removed.has(w.i + 1) ? nextStart : Infinity));
    const last = segs[segs.length - 1];
    if (last && !removed.has(w.i - 1) && a - last.b <= MAXG) last.b = Math.max(last.b, b), last.words.push(w);
    else if (last && a <= last.b + 0.01) last.b = Math.max(last.b, b), last.words.push(w);
    else {
      segs.push({ a, b, words: [w] });
    }
  });
  if (!segs.length) throw new Error("nothing left to keep — check cuts.json");
  // CUT AUDIT: never split a word. Snap every edge to the quietest 5 ms within ±60 ms (the real gap
  // between sounds), then flag any edge that still lands on loud audio. Report: work/cut-audit.json
  const audit = [];
  if (env) {
    const at = (t) => env.rms[Math.max(0, Math.min(env.rms.length - 1, Math.round(t / env.hop)))];
    const quietest = (t, lo, hi) => { let best = t, bv = Infinity; for (let x = Math.max(lo, t - 0.06); x <= Math.min(hi, t + 0.06); x += env.hop) { const v = at(x); if (v < bv - 1e-9) { bv = v; best = x; } } return best; };
    segs.forEach((sg, k) => {
      const prevB = k ? segs[k - 1].b : 0, nextA = k < segs.length - 1 ? segs[k + 1].a : info.duration;
      const a0 = sg.a, b0 = sg.b;
      sg.a = quietest(sg.a, prevB, sg.words[0]?.start ?? sg.b);
      sg.b = quietest(sg.b, sg.words.at(-1)?.end ?? sg.a, nextA);
      for (const [edge, t, was] of [["in", sg.a, a0], ["out", sg.b, b0]]) {
        const rel = at(t) / env.speech;
        audit.push({ seg: k, edge, t: r3(t), moved: r3(t - was), level: r3(rel) });
      }
    });
  }
  const risky = audit.filter((x) => x.level > 0.3);
  writeJSON(join(W, "cut-audit.json"), { edges: audit.length, risky: risky.length, details: risky });
  if (risky.length) console.error(`cut audit: ${risky.length} edge(s) still on loud audio (possible split word): ` + risky.map((x) => `seg${x.seg}.${x.edge}@${x.t}s(${x.level})`).join(", "));
  for (const s of segs) { s.a = snapF(s.a); s.b = Math.max(snapF(s.b), s.a + F); }

  // Remap word times to the new timeline.
  let acc = 0;
  const out = [];
  const segOut = [];
  for (const s of segs) {
    for (const w of s.words) {
      const st = Math.max(w.start, s.a), en = Math.min(w.end, s.b);
      out.push({ text: w.text, start: r3((acc + st - s.a) / speed), end: r3((acc + en - s.a) / speed), src: w.i });
    }
    segOut.push({ srcStart: r3(s.a), srcEnd: r3(s.b), outStart: r3(acc / speed), outEnd: r3((acc + s.b - s.a) / speed) });
    acc += s.b - s.a;
  }
  const newDur = acc / speed;

  // Sentence-level proofreading: [a, b, "corrected text"] replaces kept words a..b (raw indices).
  // Times are re-mapped by character position, so word count may change and stay in sync.
  for (const [a, b, text] of cuts.fixRanges || []) {
    const idx = out.map((w, k) => (w.src >= a && w.src <= b ? k : -1)).filter((k) => k >= 0);
    if (!idx.length) { console.error(`fixRanges [${a},${b}]: no kept words in range (removed?)`); continue; }
    const olds = idx.map((k) => out[k]);
    const lens = olds.map((w) => graphemes(w.text) + 1);
    const total = lens.reduce((s, x) => s + x, 0);
    const timeAt = (pos) => { // char position -> time, linear inside each old word
      let p = 0;
      for (let k = 0; k < olds.length; k++) {
        if (pos <= p + lens[k] || k === olds.length - 1) return olds[k].start + (olds[k].end - olds[k].start) * Math.min(1, (pos - p) / lens[k]);
        p += lens[k];
      }
    };
    const nw = String(text).split(/\s+/).filter(Boolean);
    const nl = nw.map((t) => graphemes(t) + 1);
    const ntot = nl.reduce((s, x) => s + x, 0);
    let p = 0;
    const repl = nw.map((t, k) => {
      const s0 = timeAt((p / ntot) * total), s1 = timeAt(((p + nl[k]) / ntot) * total);
      p += nl[k];
      return { text: t, start: r3(s0), end: r3(Math.max(s1, s0 + 0.05)), src: a + Math.min(k, b - a), fixed: true };
    });
    out.splice(idx[0], idx[idx.length - 1] - idx[0] + 1, ...repl);
  }

  // Reframe to canvas.
  const cropX = job.cropX ?? 0.5, cropY = job.cropY ?? 0.5;
  let vf = canvasVf(info);
  // Colour (color.mjs): automatic correction first (exposure, white balance, hot highlights, flat colour), then the look.
  // job.json "grade": a look name from presets/looks.json, "none", or a raw filter string; "balance": false = no correction.
  const grade = RAW ? "" : look(job.grade || "house", brand);
  if (!RAW && job.balance !== false) {
    const m = measure(src, 24, info.duration, vf.includes("split[") ? "" : vf);
    const target = /brightness=0\.0[2-9]/.test(grade) ? 106 : 116; // a look that lifts by itself starts lower
    const c = correction(m, { target, face: job.faceless !== true });
    if (c.filters) vf = `${vf},${c.filters}`;
    writeJSON(join(W, "color.json"), { measured: m, correction: c.notes, filters: c.filters, look: job.grade || "house" });
    console.error(`colour: ${c.notes.join("; ")}; look ${job.grade || "house"}`);
  }
  if (grade) vf = `${vf},${grade}`;
  const sel = segs.map((s) => `between(t\\,${(s.a - F / 2).toFixed(4)}\\,${(s.b - F / 2).toFixed(4)})`).join("+");
  const voice = join(W, "voice.wav");
  const useVoice = !RAW && existsSync(voice) && job.enhance !== false;
  const audioChain = (useVoice || RAW ? [] : ["highpass=f=80", "afftdn=nf=-28:tn=1", "acompressor=threshold=-20dB:ratio=3:attack=5:release=120:makeup=2"])
    .concat(["loudnorm=I=-16:TP=-1.5:LRA=11", "aresample=48000"]).join(",");
  const D = (Math.floor(newDur * fps) / fps).toFixed(4); // exact frame-aligned length for both streams
  const graph = [
    `[0:v]setpts=PTS-STARTPTS,fps=${fps},select='${sel}',setpts=N/${fps}/TB,setpts=PTS/${speed},fps=${fps},${vf},setsar=1,format=yuv420p,tpad=stop_mode=clone:stop_duration=1,trim=0:${D}[v]`,
    `[${useVoice ? 1 : 0}:a]asetpts=PTS-STARTPTS,aresample=48000,asetnsamples=n=${48000 / fps}:p=0,aselect='${sel}',asetpts=N/SR/TB,atempo=${speed},${audioChain},apad=whole_dur=${D},atrim=0:${D}[a]`,
  ].join(";\n");
  mkdirSync(C, { recursive: true });
  const gfile = join(W, "cut.filtergraph");
  writeFileSync(gfile, graph);
  const outMp4 = join(C, RAW ? "cut-raw.mp4" : "cut.mp4");
  ffmpeg(["-i", src, ...(useVoice ? ["-i", voice] : []), "-/filter_complex", gfile, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-r", String(fps), "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", outMp4]);
  const got = probe(outMp4);
  if (RAW) { console.log(JSON.stringify({ ok: true, out: outMp4, duration: r3(got.duration) })); return; }

  writeJSON(join(C, "transcript.json"), out);
  writeJSON(join(C, "segments.json"), { source: src, speed, fps, canvas: fmt.canvas, crop: { cropX, cropY, fit: job.fit || "crop" }, segments: segOut });
  // Clean script for reading / thumbnail / titles.
  const txt = [];
  let line = [];
  out.forEach((w, k) => {
    line.push(w.text);
    if (/[.!?।]$/.test(w.text) || k === out.length - 1) { txt.push(line.join(" ")); line = []; }
  });
  writeFileSync(join(C, "script.txt"), txt.join("\n") + "\n");
  // Numbered words on the CUT timeline — what the graphics plan references (startWord/endWord).
  const wl = [];
  let cur = [];
  out.forEach((w, k) => {
    cur.push(`${k}:${w.text}`);
    if (/[.!?।]$/.test(w.text) || k === out.length - 1 || (out[k + 1] && out[k + 1].start - w.end > 0.5)) {
      const a = out[k - cur.length + 1];
      wl.push(`- [${a.start.toFixed(2)}–${w.end.toFixed(2)}] ${cur.join(" ")}`);
      cur = [];
    }
  });
  writeFileSync(join(C, "words.md"), `# Cut words — ${(newDur).toFixed(1)}s\n\nFormat: index:word. Use indices as startWord/endWord in edit/plan.json.\n\n${wl.join("\n")}\n`);
  console.log(JSON.stringify({ ok: true, out: outMp4, before: r3(info.duration), after: r3(got.duration), expected: r3(newDur), segments: segs.length, removedWords: removed.size, speed }));
}

if (cmd === "prep") prep();
else if (cmd === "cut") cut();
else { console.error("unknown command " + cmd); process.exit(1); }
