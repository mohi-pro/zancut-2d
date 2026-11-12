// The no-AI scene builder: a scene file → shots → engine, checked by the body gate, with stills. Usage: node scripts/codefilm-test.mjs [film.json] [out.jpg]
import fs from "node:fs";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { checkBody } from "../engine/cartoon/check-body.mjs";
import { stills } from "../engine/readcheck.mjs";
import { shotScript, kitFor, validate } from "../server/codefilm.mjs";
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const film = JSON.parse(fs.readFileSync(process.argv[2] || path.join(root, "examples/rafi.film.json"), "utf8"));
const errs = validate(film); if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
const secs = Number(process.env.SHOT_SECS || 2.5), d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "z2d-")), "job");
for (const x of ["cut", "edit/graphics", "work"]) fs.mkdirSync(path.join(d, x), { recursive: true });
const shots = film.shots, D = shots.length * secs;
execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x222222:s=1920x1080:r=30", "-f", "lavfi", "-i", "anullsrc=r=48000", "-t", String(D), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(d, "cut/cut.mp4")]);
fs.writeFileSync(path.join(d, "job.json"), "{}"); fs.writeFileSync(path.join(d, "edit/film-kit.js"), kitFor(film));
fs.writeFileSync(path.join(d, "cut/transcript.json"), JSON.stringify(shots.flatMap((_, i) => [{ text: `a${i}`, start: i * secs, end: i * secs + 1 }, { text: `b${i}`, start: i * secs + 1.1, end: (i + 1) * secs - 0.05 }])));
const plan = shots.map((sh, i) => { const f = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(d, f), `<script>\nZK.unit(root);\n${shotScript(sh, film)}\n</script>`); return { row: i, uid: `s${i}`, startWord: i * 2, endWord: i * 2 + 1, kind: "graphic", mode: "full-broll-takeover", file: f, transition: "cut", captions: "hide", cues: [] }; });
fs.writeFileSync(path.join(d, "edit/plan.json"), JSON.stringify({ version: 2, canvas: "1920x1080", kind: "faceless", style: "2d-animation", theme: "light", tokens: {}, captions: { on: false }, atoms: "", scenes: plan }));
execFileSync(process.execPath, [path.join(root, "engine/compose/compose.mjs"), d], { stdio: "pipe" });
const hf = path.join(d, "edit/hf");
const g = await checkBody(hf, { fps: Number(process.env.GATE_FPS || 30) }); console.log(g.ok ? "body gate: ok" : "body gate FAILED:\n" + g.lines.join("\n"));
assert.ok(g.ok, g.lines.join("\n"));
const out = process.argv[3] || path.join(os.tmpdir(), "z2d-stills"); fs.mkdirSync(out, { recursive: true });
await stills(hf, plan.map((s, i) => ({ ts: [i * secs + 1.5], uid: s.uid, file: path.join(out, `shot${i + 1}.jpg`), i })));
console.log("stills:", out);
