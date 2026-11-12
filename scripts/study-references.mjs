// Study reference films (no AI, ffmpeg only): length, cuts and shot lengths, how much moves, colours, sound. Reference only:
// nothing from these films is copied into the library or the product. Output: data/references/<n>/{stats.json, sheet.jpg}.
// Usage: node scripts/study-references.mjs examples/*.mp4
import fs from "node:fs";
import path from "node:path";
import { spawnSync, execFileSync } from "node:child_process";
const args = process.argv.slice(2), tagAt = args.indexOf("--as"), as = tagAt >= 0 ? args.splice(tagAt, 2)[1] : null; // --as <name>: study one of OUR films under its own name
const out = path.resolve(as ? "data/ours" : "data/references"); fs.mkdirSync(out, { recursive: true });
const run = (a) => spawnSync("ffmpeg", a, { encoding: "utf8", maxBuffer: 1 << 28 }).stderr || "";
const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[Math.min(s.length - 1, Math.floor(p * s.length))] : 0; };
const all = [];
for (const [k, file] of args.entries()) {
  const id = as || `ref${k + 1}`, dir = path.join(out, id); fs.mkdirSync(dir, { recursive: true });
  const pr = JSON.parse(execFileSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,width,height,r_frame_rate:format=duration", "-of", "json", file], { encoding: "utf8" }));
  const v = pr.streams.find((s) => s.codec_type === "video"), dur = +pr.format.duration;
  // cuts: scene score on a small copy (5 fps is enough for cut timing ±0.2 s)
  const cutLog = run(["-v", "info", "-i", file, "-an", "-vf", "fps=5,scale=320:-2,select='gt(scene,0.32)',showinfo", "-f", "null", "-"]);
  const cuts = [...cutLog.matchAll(/pts_time:([\d.]+)/g)].map((m) => +m[1]).filter((t, i, a) => i === 0 || t - a[i - 1] > 0.4);
  const shots = [0, ...cuts, dur].map((t, i, a) => (i ? t - a[i - 1] : null)).filter((x) => x > 0.2);
  // how much of the film is (nearly) still
  const frz = run(["-v", "info", "-i", file, "-an", "-vf", "fps=5,scale=320:-2,freezedetect=n=-55dB:d=1.5", "-f", "null", "-"]);
  const fs0 = [...frz.matchAll(/freeze_duration: ([\d.]+)/g)].reduce((a, m) => a + +m[1], 0);
  // speech/sound: silence share and loudness
  const sil = run(["-v", "info", "-i", file, "-vn", "-af", "silencedetect=n=-35dB:d=0.6,ebur128", "-f", "null", "-"]);
  const silent = [...sil.matchAll(/silence_duration: ([\d.]+)/g)].reduce((a, m) => a + +m[1], 0), lufs = +(sil.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold[\s\S]*$/)?.[1] ?? NaN);
  // colours: a 12-colour palette over the whole film
  const pal = path.join(dir, "palette.png"); run(["-y", "-v", "error", "-i", file, "-vf", "fps=0.5,scale=160:-2,palettegen=max_colors=12:stats_mode=full", pal]);
  const raw = execFileSync("ffmpeg", ["-v", "error", "-i", pal, "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]); const cols = []; for (let i = 0; i < raw.length; i += 3) cols.push("#" + [raw[i], raw[i + 1], raw[i + 2]].map((x) => x.toString(16).padStart(2, "0")).join(""));
  // a contact sheet: 20 frames spread over the film (for a human to look at; stays in data/)
  const sheet = path.join(dir, "sheet.jpg"); run(["-y", "-v", "error", "-i", file, "-vf", `fps=${(20 / dur).toFixed(5)},scale=384:-2,tile=5x4:padding=4`, "-frames:v", "1", sheet]);
  const st = { id, file: path.basename(file).slice(0, 90), seconds: Math.round(dur), width: v.width, height: v.height, fps: v.r_frame_rate, cuts: cuts.length, cutsPerMinute: +(cuts.length / (dur / 60)).toFixed(1),
    shotSeconds: { median: +q(shots, 0.5).toFixed(2), p25: +q(shots, 0.25).toFixed(2), p75: +q(shots, 0.75).toFixed(2), p90: +q(shots, 0.9).toFixed(2) }, stillShare: +(fs0 / dur).toFixed(2), silentShare: +(silent / dur).toFixed(2), loudnessLUFS: lufs, palette: [...new Set(cols)].slice(0, 12) };
  fs.writeFileSync(path.join(dir, "stats.json"), JSON.stringify(st, null, 1)); all.push(st); console.log(JSON.stringify(st));
}
if (!as) fs.writeFileSync(path.join(out, "summary.json"), JSON.stringify(all, null, 1));
