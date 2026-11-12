#!/usr/bin/env node
// Finish line: edit/render.mp4 (+ optional music, ducked under the voice) -> outputs/<job>.final.mp4
//
//   node engine/finalize.mjs <job> [--music music/track.mp3] [--music-vol 0.16] [--music-start 0] [--no-music]
//
// Music: sidechain-ducked under voice+SFX, faded in/out, looped if short. Then two-pass loudnorm to
// -14 LUFS / -1 dBTP (YouTube, TikTok, Reels, Facebook all normalize near this). Also writes an .srt.
import { existsSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve, basename } from "node:path";
import { ROOT, readJSON, ffmpeg, probe, args, r3 } from "./lib.mjs";

const A = args();
const JOB = resolve(A._[0] || "");
if (!A._[0] || !existsSync(JOB)) { console.error("usage: finalize.mjs <projects/job> [--music file]"); process.exit(1); }
const name = basename(JOB);
const plan = readJSON(join(JOB, "edit", "plan.json"), {});
const input = resolve(JOB, A.input || "edit/render.mp4");
if (!existsSync(input)) throw new Error(`no render at ${input} — render the composition first (scripts/render.sh ${name} final)`);
const info = probe(input);
const D = info.duration;

let music = null;
if (!A["no-music"]) {
  const src = A.music || plan.music?.src;
  if (src) {
    const cands = [resolve(JOB, src), resolve(ROOT, src), resolve(ROOT, "music", src)];
    music = cands.find(existsSync);
    if (!music) throw new Error(`music not found: ${src}`);
  }
}
// music sits at −19 dB under the talking head (0.112), with a vocal notch (800 Hz–3 kHz, −6 dB) so the voice stays king, and is
// muted under full-screen graphics (the sound effects carry them): edit/hf/music-dips.json from the compositor
const vol = Number(A["music-vol"] ?? plan.music?.volume ?? 0.112);
const mstart = Number(A["music-start"] ?? plan.music?.start ?? 0);
// a 2D film is all drawn scenes: its music runs under everything (like the reference cartoons), ducked only under the voice
const dips = plan.style === "2d-animation" ? [] : (readJSON(join(JOB, "edit", "hf", "music-dips.json"), []) || []).filter((x) => Array.isArray(x) && x[1] > x[0]);
// a smooth 0.25 s ramp into and out of each dip, down to silence
const dipOne = ([s, e]) => `min((t-${(s - 0.25).toFixed(3)})/0.25\\,(${(e + 0.25).toFixed(3)}-t)/0.25)`;
const dipAll = dips.map(dipOne).reduce((acc, x) => (acc ? `max(${acc}\\,${x})` : x), ""); // ffmpeg's max() takes two values
const dipExpr = dips.length ? `,volume='1-max(0\\,min(1\\,${dipAll}))':eval=frame` : "";

const inputs = ["-i", input];
let graph;
if (music) {
  inputs.push("-stream_loop", "-1", "-ss", String(mstart), "-i", music);
  graph = [
    `[1:a]aresample=48000,atrim=0:${D.toFixed(3)},asetpts=PTS-STARTPTS,afade=t=in:d=0.4,afade=t=out:st=${Math.max(0, D - 1.5).toFixed(3)}:d=1.5,equalizer=f=1800:t=h:width=2200:g=-6,volume=${vol}${dipExpr}[m]`,
    `[0:a]aresample=48000,asplit=2[v][sc]`,
    `[m][sc]sidechaincompress=threshold=0.03:ratio=4:attack=25:release=700:makeup=1[md]`,
    `[v][md]amix=inputs=2:normalize=0:duration=first[mix]`,
  ];
} else {
  graph = [`[0:a]aresample=48000[mix]`];
}

// pass 1: measure
const meas = ffmpeg([...inputs, "-filter_complex", graph.join(";") + ";[mix]loudnorm=I=-14:TP=-1:LRA=11:print_format=json[o]", "-map", "[o]", "-f", "null", "-"], { loglevel: "info" });
const j = JSON.parse(meas.slice(meas.lastIndexOf("{"), meas.lastIndexOf("}") + 1));
// pass 2: apply (linear when possible = transparent gain, no pumping)
const ln = `loudnorm=I=-14:TP=-1:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,aresample=${A.ar || 48000}`;
mkdirSync(join(ROOT, "outputs"), { recursive: true });
const out = join(ROOT, "outputs", A.out || `${name}.final.mp4`);
const AR = String(A.ar || 48000);
ffmpeg([...inputs, "-filter_complex", graph.join(";") + `;[mix]${ln}[o]`, "-map", "0:v", "-map", "[o]", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k", "-ar", AR, "-ac", "2", "-movflags", "+faststart", "-shortest", out]);

// verify
const chk = ffmpeg(["-i", out, "-af", "ebur128=peak=true", "-f", "null", "-"], { loglevel: "info" });
const I = chk.match(/I:\s+([-\d.]+) LUFS/g)?.pop()?.match(/[-\d.]+/)?.[0];
const TP = chk.match(/Peak:\s+([-\d.]+) dBFS/g)?.pop()?.match(/[-\d.]+/)?.[0];

// SRT (YouTube CC / accessibility). Uses the same transcript as captions.
let srt = null;
const txPath = resolve(JOB, plan.transcript || "cut/transcript.json");
if (existsSync(txPath)) {
  const words = readJSON(txPath);
  const ts = (t) => { const ms = Math.round(t * 1000); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };
  const cues = [];
  let cur = [];
  words.forEach((w, k) => {
    cur.push(w);
    const nx = words[k + 1];
    if (!nx || cur.length >= 7 || /[.!?।]$/.test(w.text) || nx.start - w.end > 0.6) { cues.push(cur); cur = []; }
  });
  srt = join(ROOT, "outputs", `${name}.srt`);
  writeFileSync(srt, cues.map((c, i) => `${i + 1}\n${ts(c[0].start)} --> ${ts(c[c.length - 1].end)}\n${c.map((w) => w.text).join(" ")}\n`).join("\n"));
}

console.log(JSON.stringify({ ok: true, out, duration: r3(probe(out).duration), music: music || null, musicVolume: music ? vol : null, loudnessLUFS: Number(I), truePeak: Number(TP), srt }, null, 1));
