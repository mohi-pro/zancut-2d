#!/usr/bin/env node
// Cut the speaker out of the cut video (for text-behind-subject, pop-out speaker cards and background swaps).
//   node engine/matte.mjs <job> --early  → work/alpha-early.mov: the WHOLE take, framed like the cut, at 720p, made
//                                          while the AI plans (prep writes work/frame.json). ~2–3 s per second.
//   node engine/matte.mjs <job>          → cut/subject.webm (VP9 + alpha, main speaker only). With a matching early
//                                          cut-out it is only trimmed to the cut (seconds); otherwise the model runs on
//                                          the cut video (~5 s per second). Re-run after every re-cut.
// The picture always comes from the cut video itself (sharp, graded, frame-exact); only the outline comes from the model.
import { existsSync, readFileSync, writeFileSync, renameSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { ENGINE, ROOT, PY, args, npx } from "./lib.mjs";

const A = args();
const JOB = resolve(A._[0] || "");
const W = join(JOB, "work"), C = join(JOB, "cut");
const J = (f) => { try { return JSON.parse(readFileSync(f, "utf8")); } catch { return null; } };
const run = (cmd, a) => spawnSync(cmd, a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 });
const fail = (r) => { console.error(String(r.stdout || "").slice(-600), String(r.stderr || "").slice(-1200)); process.exit(1); };
const ffmpeg = (a) => { const r = run("ffmpeg", ["-v", "error", "-y", ...a]); if (r.status !== 0) fail(r); };
const removeBg = (inp, out) => { const [c, a, o] = npx(["hyperframes", "remove-background", inp, "-o", out, "--quality", "fast", "--json"]); const r = spawnSync(c, a, { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26, ...o }); if (r.status !== 0) fail(r); };
const frame = J(join(W, "frame.json"));
const keyOf = (f) => f && createHash("md5").update(JSON.stringify([f.src, f.vf, f.fps, f.w, f.h, f.duration])).digest("hex");
const early = join(W, "alpha-early.mov"), earlyInfo = join(W, "alpha-early.json");

if (A.early) {
  if (!frame || !existsSync(frame.src)) { console.error("no work/frame.json: run the prep first"); process.exit(1); }
  // the source framed exactly like the cut (same fps grid, same crop), scaled so its short side is 720 px
  const small = join(W, "early-src.mp4"), tmp = join(W, "alpha-early.part.mov"), lock = join(W, "alpha-early.lock");
  rmSync(earlyInfo, { force: true });
  writeFileSync(lock, String(process.pid)); process.on("exit", () => rmSync(lock, { force: true })); // the cut's cut-out waits while this exists
  const s720 = frame.w <= frame.h ? "scale=720:-2" : "scale=-2:720";
  // at most 15 frames a second: the outline of a talking person barely moves between frames, and the model is the slow
  // part (the cut repeats each outline frame to its own frame rate)
  const efps = Math.min(15, frame.fps);
  ffmpeg(["-i", frame.src, "-an", "-vf", `setpts=PTS-STARTPTS,fps=${efps},${frame.vf},${s720},setsar=1,format=yuv420p`, "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-r", String(efps), small]);
  removeBg(small, tmp);
  renameSync(tmp, early);
  writeFileSync(earlyInfo, JSON.stringify({ ok: true, key: keyOf(frame) }));
  console.log(JSON.stringify({ ok: true, early }));
  process.exit(0);
}

const cut = join(C, "cut.mp4"), segs = J(join(C, "segments.json"));
if (!existsSync(cut)) { console.error("run the rough cut first"); process.exit(1); }
const raw = join(W, "subject-raw.mov");
const out = join(C, "subject.webm");
// an early cut-out still being made for this take: wait for it (it started minutes ago), else make one now
const ready = () => J(earlyInfo)?.ok && J(earlyInfo).key === keyOf(frame);
for (let i = 0; i < 200 && frame && !ready() && existsSync(join(W, "alpha-early.lock")); i++) spawnSync("sleep", ["3"]);
let how = "model on the cut";
if (ready() && segs?.segments?.length && existsSync(early)) {
  // trim the early outline exactly like the cut (same select, same speed), scale it to the frame, put it on the cut's picture
  const fps = segs.fps || frame.fps, F = 1 / fps, sp = segs.speed || 1;
  const last = segs.segments[segs.segments.length - 1], D = (Math.floor((last.outEnd || 0) * fps) / fps).toFixed(4); // the cut's exact length
  const sel = segs.segments.map((s) => `between(t\\,${(s.srcStart - F / 2).toFixed(4)}\\,${(s.srcEnd - F / 2).toFixed(4)})`).join("+");
  const graph = `[1:v]setpts=PTS-STARTPTS,fps=${fps},select='${sel}',setpts=N/${fps}/TB,setpts=PTS/${sp},fps=${fps},alphaextract,scale=${frame.w}:${frame.h},tpad=stop_mode=clone:stop_duration=1[a];[0:v][a]alphamerge,format=yuva444p10le,trim=0:${D}[v]`;
  const gfile = join(W, "matte.filtergraph"); writeFileSync(gfile, graph);
  ffmpeg(["-i", cut, "-i", early, "-/filter_complex", gfile, "-map", "[v]", "-shortest", "-c:v", "prores_ks", "-profile:v", "4444", "-pix_fmt", "yuva444p10le", raw]);
  how = "early cut-out, trimmed";
} else removeBg(cut, raw);
// keep only the main speaker, feather the edge, and judge the outline (other people, flicker, empty frames)
rmSync(join(W, "matte-quality.json"), { force: true });
const r = run(PY, [join(ENGINE, "matte_clean.py"), raw, out, "--fps", String(segs?.fps || frame?.fps || 30), "--quality", join(W, "matte-quality.json")]);
if (r.status !== 0) fail(r);
const q = J(join(W, "matte-quality.json")) || {};
console.log(JSON.stringify({ ok: true, out, how, reliable: q.reliable !== false, ...(q.reliable === false ? { why: q.why } : {}) }));
