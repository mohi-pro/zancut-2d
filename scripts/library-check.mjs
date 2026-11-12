// Checks a 2D library delivery (docs/2d-library) before it is added: numbers first (no browser), then the real route in Chrome
// (compose → the page → the body gate) and one picture of everything, so a person can look at it too. No AI, no tokens.
//   node scripts/library-check.mjs <delivery folder> [board.jpg]      the folder holds actions/ gestures/ hands/ set/ props/
//   node scripts/library-check.mjs --shipped [board.jpg]              the library already in engine/cartoon/library
// A clean delivery is copied into engine/cartoon/library/<same folders>, then: node scripts/build-library.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { libraryJS, LIB_DIR } from "./build-library.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const arg = process.argv[2];
if (!arg) { console.log("Usage: node scripts/library-check.mjs <delivery folder> [board.jpg]  (or --shipped)"); process.exit(1); }
const dir = arg === "--shipped" ? LIB_DIR : path.resolve(arg);
const boardOut = path.resolve(process.argv[3] || path.join(dir === LIB_DIR ? os.tmpdir() : dir, "library-board.jpg"));
const errors = [], warns = [];
const err = (m) => errors.push(m), warn = (m) => warns.push(m);
const list = (k, ext) => { try { return fs.readdirSync(path.join(dir, k)).filter((f) => f.endsWith(ext)).sort(); } catch { return []; } };
const readJSON = (k, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, k, f), "utf8")); } catch (e) { err(`${k}/${f}: not valid JSON (${e.message})`); return null; } };

// ---------- 1. the numbers (Node): every action and gesture on every body profile ----------
require(path.join(root, "engine/cartoon/hands.js"));
require(path.join(root, "engine/cartoon/anatomy.js"));
const A = globalThis.ZANATOMY, H = globalThis.HANDS;
for (const f of list("hands", ".json")) { const pose = readJSON("hands", f); if (pose) try { H.addPose(path.basename(f, ".json"), pose); } catch (e) { err(`hands/${f}: ${e.message}`); } }
const PROFILES = ["adult", "child", "elderly", "athletic"];
const toRefLen = A.pose({ posture: "stand" }).lengths; // the adult's fixed bones
const actions = [], gestures = [];
for (const f of list("actions", ".json")) {
  const d = readJSON("actions", f); if (!d) continue;
  if (`${d.id}.json` !== f) err(`actions/${f}: the file name must be its id (${d.id}.json)`);
  try { A.addPosture(d); actions.push(d); } catch (e) { err(`actions/${f}: ${e.message}`); continue; }
  for (const req of ["about", "group"]) if (!d[req]) warn(`actions/${f}: no "${req}"`);
  if (!(d.seconds > 0)) warn(`actions/${f}: no "seconds" (how long it takes an adult at a normal pace)`);
  // the authored bones against the real ones: the engine fits every bone, so a big difference means the pose is not what was drawn
  for (const [i, k] of d.keys.entries()) {
    let worst = 0, at = "";
    for (const [n, p] of Object.entries(A.PARENT)) { if (!p) continue; const a = k.joints[n], b = k.joints[p], l = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), r = toRefLen[n]; if (r > 2 && Math.abs(l - r) / r > worst) { worst = Math.abs(l - r) / r; at = `${p}→${n} ${l.toFixed(1)} U (the body's is ${r.toFixed(1)})`; } }
    if (worst > 0.15) err(`actions/${f} key ${i}: a bone is ${Math.round(worst * 100)}% off: ${at}`); else if (worst > 0.07) warn(`actions/${f} key ${i}: a bone is ${Math.round(worst * 100)}% off: ${at}`);
    const low = Math.min(...Object.values(k.joints).map((p) => p[1])); if (low < -0.5) err(`actions/${f} key ${i}: a joint is under the floor (y ${low.toFixed(1)})`);
    // a feeling or a rest is acted with the face: the head may drop at most ~18° past the chest, or the face hides and the neck shows
    // as a long stalk (an action that looks at something low, reads or works may look down further)
    if (["emotion", "idle", "feeling"].includes(d.group)) {
      const J = k.joints, dir = (a, b) => { const v = [J[b][0] - J[a][0], J[b][1] - J[a][1], J[b][2] - J[a][2]], l = Math.hypot(...v) || 1; return v.map((x) => x / l); };
      const t = dir("pelvis", "thorax"), n = dir("neckBase", "neckTop"), drop = (Math.acos(Math.max(-1, Math.min(1, t[0] * n[0] + t[1] * n[1] + t[2] * n[2]))) * 180) / Math.PI;
      if (drop > 22) warn(`actions/${f} key ${i}: the head drops ${Math.round(drop)}° past the chest; the face hides (keep it near 18°)`);
    }
  }
  // every profile, at every key and between them: reach (H05), clamps and the base rules
  const us = [...new Set([...d.keys.map((k) => k.u), ...d.keys.slice(1).map((k, i) => (k.u + d.keys[i].u) / 2)])];
  for (const profile of PROFILES) for (const u of us) {
    const ps = A.pose({ posture: d.id, phase: u * 360 - (d.loop && u === 1 ? 1e-6 : 0), profile });
    for (const x of [...ps.faults, ...A.check(ps)]) {
      const big = x.rule === "H05" && Number((/([\d.]+) U/.exec(x.msg) || [])[1]) > 2;
      (big || x.rule !== "H05" ? err : warn)(`actions/${f} ${profile} at u ${u.toFixed(2)}: ${x.rule} ${x.msg}`);
    }
  }
}
for (const f of list("gestures", ".json")) {
  const d = readJSON("gestures", f); if (!d) continue;
  if (`${d.id}.json` !== f) err(`gestures/${f}: the file name must be its id (${d.id}.json)`);
  try { A.addGesture(d); gestures.push(d); } catch (e) { err(`gestures/${f}: ${e.message}`); continue; }
  for (const base of d.on || ["stand", "sit", "walk"]) for (const profile of PROFILES) for (const k of d.keys) {
    const ps = A.pose({ posture: base, phase: 35, profile, gesture: { id: d.id, phase: k.u * 360 } });
    for (const x of [...ps.faults, ...A.check(ps)]) err(`gestures/${f} on ${base}, ${profile}, u ${k.u}: ${x.rule} ${x.msg}`);
  }
}
require(path.join(root, "engine/cartoon/set.js"));
const BUILT_IN = [...globalThis.ZS.names];
const setFiles = [...list("set", ".js").map((f) => `set/${f}`), ...list("props", ".js").map((f) => `props/${f}`)];
for (const f of setFiles) {
  const src = fs.readFileSync(path.join(dir, f), "utf8"), code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
  try { new Function("ZS", src); } catch (e) { err(`${f}: does not parse: ${e.message}`); }
  if (/\bMath\.random\b|\bDate\.now\b|performance\.now|setTimeout|setInterval|requestAnimationFrame/.test(code)) err(`${f}: uses randomness or a timer; everything must come from the seed and t (seek-safe)`);
  if (/stroke(-width)?["']?\s*:/.test(code) && !/\/\/ ?lines ok/.test(src)) warn(`${f}: uses strokes; the look has no outlines (thin details only, mark the file "// lines ok" when they are meant)`);
  if (/<image|href=|url\(|fetch\(|import\(/.test(code)) err(`${f}: loads something from outside; draw it with shapes`);
  const ids = [...src.matchAll(/ZS\.define\(\s*["'](\w+)["']/g)].map((m) => m[1]);
  if (!ids.length) err(`${f}: no ZS.define("id", …)`);
  for (const id of ids) if (BUILT_IN.includes(id)) err(`${f}: "${id}" is already a built-in piece (engine/cartoon/set.js); give it another name`);
  if (ids.length && path.basename(f, ".js") !== ids[0]) warn(`${f}: name the file after its piece (${ids[0]}.js)`);
}

// ---------- 2. the real route: a page of every part through compose, the body gate in Chrome, one picture ----------
const SPECS = {
  man: { gender: "male", age: "adult", skin: 5, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } },
  lady: { gender: "female", age: "adult", skin: 3, hair: { style: "bob", color: "dark" }, outfit: { type: "salwar", color: "#2f8f83", accent: "#f2c14e" } },
  boy: { gender: "male", age: "child", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } },
  dada: { gender: "male", age: "elderly", skin: 4, build: "thin", hair: { style: "cap", color: "white" }, outfit: { type: "punjabi", color: "#efe9da" }, extras: ["beard"] },
  nanu: { gender: "female", age: "elderly", skin: 4, hair: { style: "bun", color: "white" }, outfit: { type: "saree", color: "#b0344a", accent: "#f4d58d" } },
};
const label = (t) => `const lab = ZC.el("text", { x: 30, y: 60, "font-size": 40, fill: "#222", "font-family": "sans-serif" }, W.layer("z")); lab.textContent = ${JSON.stringify(t)};`;
const ground = `ZC.el("rect", { x: 0, y: 0, width: W.w, height: W.h, fill: "#f4efe6" }, W.layer("bg"));`;
// one still per part: four moments of an action across the top (adult side), then front and three-quarter, a child and an elderly person
const actionScene = (d) => `const W = ZC.world(root); ${ground} ${label(`action: ${d.id}`)}
const seats = W.layer("seats"), ppl = W.layer("p"), F1 = W.h * 0.47, F2 = W.h * 0.95, us = [0, 0.33, 0.66, 1], bodies = [];
const add = (spec, view, x, F, u) => { const b = ZC.actor(ppl, { spec, H: 46, x, floor: F, view }); ${d.seat ? 'ZS.chair(seats, { x, y: F, seat: b.seatHeight() });' : ""} bodies.push({ b, u }); };
us.forEach((u, i) => add(${JSON.stringify(SPECS.man)}, "side", 170 + i * 330, F1, u));
us.forEach((u, i) => add(${JSON.stringify(SPECS.lady)}, "three", 170 + i * 330, F2, u));
add(${JSON.stringify(SPECS.boy)}, "front", 1500, F2, 0.5); add(${JSON.stringify(SPECS.nanu)}, "side", 1760, F2, 0.5);
${d.group === "crowd" ? `const crowd = ZC.crowd(W.layer("crowd"), { n: 9, x0: 1380, x1: 1900, floor: W.h * 0.47, H: 30, rows: 2, mode: ${JSON.stringify(d.id)} });` : ""}
ZC.clock(tl, s, d, (t) => { for (const x of bodies) x.b.draw(x.b.pose(${JSON.stringify(d.id)}, x.u * 360 - ${d.loop ? 0.001 : 0})); ${d.group === "crowd" ? "crowd.draw(t + 0.3);" : ""} W.cam(W.w / 2, W.h / 2, W.w); });`;
const gestureScene = (d) => `const W = ZC.world(root); ${ground} ${label(`gesture: ${d.id} (on stand, sit, walk; then mirrored)`)}
const ppl = W.layer("p"), F = W.h * 0.9, bodies = [];
${JSON.stringify(d.on || ["stand", "sit", "walk"])}.forEach((base, i) => [0, 0.5, 1].forEach((u, k) => bodies.push({ b: ZC.actor(ppl, { spec: ${JSON.stringify(SPECS.man)}, H: 44, x: 150 + (i * 3 + k) * 190, floor: F, view: "three" }), base, u })));
bodies.push({ b: ZC.actor(ppl, { spec: ${JSON.stringify(SPECS.dada)}, H: 44, x: 1820, floor: F, view: "front" }), base: "stand", u: 1, mirror: true });
ZC.clock(tl, s, d, () => { for (const x of bodies) x.b.draw(x.b.pose(x.base, 35, { gesture: { id: ${JSON.stringify(d.id)}, phase: x.u * 360, mirror: !!x.mirror } })); W.cam(W.w / 2, W.h / 2, W.w); });`;
const pieceScene = (ids) => `const W = ZC.world(root); ${ground} ${label(`set pieces and props: ${ids.join(", ")}`)}
const L = W.layer("set"), F = W.h * 0.78, gap = W.w / ${ids.length}, movers = [];
ZC.el("rect", { x: 0, y: F, width: W.w, height: W.h - F, fill: "#e6dccb" }, L);
${JSON.stringify(ids)}.forEach((id, i) => { const prop = (ZS.info[id] || {}).kind === "prop", cx = gap * (i + 0.5);
  // three looks of one piece: seeds 1, 2, 3, smaller each time, the last one flipped; a prop is moved from its grip point
  [[1, 1, -0.3], [2, 0.7, 0.05], [3, 0.5, 0.33]].forEach(([seed, sc, dx], k) => {
    const h = (prop ? 150 : 330) * sc, x = cx + dx * gap;
    const g = prop ? ZC.el("g", { transform: \`translate(\${x} \${F - 40})\` }, L) : L, piece = ZS[id](g, prop ? { h, seed } : { x, y: F, h, seed, flip: k === 2 });
    if (piece && piece.tick) movers.push(piece); });
  const t = ZC.el("text", { x: cx, y: W.h - 30, "text-anchor": "middle", "font-size": 26, fill: "#555", "font-family": "sans-serif" }, W.layer("z")); t.textContent = id; });
ZC.clock(tl, s, d, (t) => { for (const g of movers) g.tick(t); W.cam(W.w / 2, W.h / 2, W.w); });`;
const handIds = list("hands", ".json").map((f) => path.basename(f, ".json"));
const handScene = `const W = ZC.world(root); ${ground} ${label(`hands: ${handIds.join(", ")}`)}
${JSON.stringify(handIds)}.forEach((h, i) => { const g = ZC.el("g", { transform: \`translate(\${200 + (i % 6) * 280} \${300 + Math.floor(i / 6) * 380}) scale(3.4)\` }, W.layer("h")); HANDS.drawHand(g, h, { skin: "#d9a074", shade: "#9a5a36", nail: "#f1d7c3" });
  const t = ZC.el("text", { x: 200 + (i % 6) * 280, y: 300 + Math.floor(i / 6) * 380 + 280, "text-anchor": "middle", "font-size": 26, fill: "#555", "font-family": "sans-serif" }, W.layer("z")); t.textContent = h; });
ZC.clock(tl, s, d, () => {});`;
const pieceIds = setFiles.flatMap((f) => [...fs.readFileSync(path.join(dir, f), "utf8").matchAll(/ZS\.define\(\s*["'](\w+)["']/g)].map((m) => m[1]));
const scenes = [...actions.map(actionScene), ...gestures.map(gestureScene), ...Array.from({ length: Math.ceil(pieceIds.length / 6) }, (_, i) => pieceScene(pieceIds.slice(i * 6, i * 6 + 6))), ...(handIds.length ? [handScene] : [])];

let board = null;
if (scenes.length && !errors.some((e) => /does not parse|not valid JSON/.test(e))) {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-library-")), canvas = "1920x1080";
  const libFile = path.join(out, "library.js"); fs.writeFileSync(libFile, libraryJS(dir));
  for (const x of ["cut", "edit/graphics", "work"]) fs.mkdirSync(path.join(out, x), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=0x222222:s=${canvas}:r=30`, "-f", "lavfi", "-i", "anullsrc=r=48000", "-t", String(scenes.length), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(out, "cut/cut.mp4")]);
  fs.writeFileSync(path.join(out, "job.json"), "{}");
  fs.writeFileSync(path.join(out, "cut/transcript.json"), JSON.stringify(scenes.map((_, i) => ({ text: `w${i}`, start: i, end: i + 0.95 }))));
  const plan = scenes.map((js, i) => { const f = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(out, f), `<script>\nZK.unit(root);\n${js}\n</script>`); return { row: i, uid: `s${i}`, startWord: i, endWord: i, kind: "graphic", mode: "full", file: f, s: i, e: i + 1 }; });
  fs.writeFileSync(path.join(out, "edit/plan.json"), JSON.stringify({ version: 2, canvas, kind: "faceless", style: "2d-animation", theme: "light", tokens: {}, captions: { on: false }, atoms: "", scenes: plan }));
  try { execFileSync(process.execPath, [path.join(root, "engine/compose/compose.mjs"), out], { stdio: "pipe", env: { ...process.env, ZANCUT_LIBRARY_JS: libFile } }); }
  catch (e) { const m = String(e.stderr || e.message); err(`The page did not build: ${(m.match(/^\w*Error.*$/m) || [m.slice(0, 400)])[0]}`); }
  const hf = path.join(out, "edit/hf");
  if (fs.existsSync(path.join(hf, "index.html"))) {
    const { openPage, showAt } = await import(path.join(root, "engine/readcheck.mjs"));
    const { checkBody } = await import(path.join(root, "engine/cartoon/check-body.mjs"));
    const o = await openPage(hf);
    if (!o) warn("No Chrome here: the picture and the body gate were skipped");
    else {
      const frames = path.join(out, "frames"); fs.mkdirSync(frames);
      try {
        for (const e of await o.page.evaluate(() => window.__sceneErrors || [])) err(`Part ${e.row + 1} fails in the page: ${e.message}`);
        for (let i = 0; i < scenes.length; i++) { await showAt(o.page, i + 0.5); await o.page.screenshot({ path: path.join(frames, `f${String(i).padStart(3, "0")}.jpg`), type: "jpeg", quality: 80 }); }
      } finally { await o.close?.(); }
      const cols = Math.min(2, scenes.length);
      // one picture per 80 parts (a JPEG stops at 65 500 px): library-board.jpg, then library-board-2.jpg, …
      const per = 80, pages = Math.ceil(scenes.length / per), outs = [];
      for (let p = 0; p < pages; p++) {
        const n = Math.min(per, scenes.length - p * per), file = p ? boardOut.replace(/\.jpg$/i, `-${p + 1}.jpg`) : boardOut;
        execFileSync("ffmpeg", ["-y", "-v", "error", "-framerate", "1", "-start_number", String(p * per), "-i", path.join(frames, "f%03d.jpg"), "-vf", `scale=960:-2,tile=${cols}x${Math.ceil(n / cols)}:padding=6:color=white`, "-frames:v", "1", "-update", "1", file]);
        outs.push(file);
      }
      board = outs.join(", ");
      if (actions.length || gestures.length) {
        const g = await checkBody(hf, { fps: 2 }).catch((e) => ({ lines: [`the body gate could not run: ${e.message}`] }));
        for (const l of g.lines || []) err(`Body gate: ${l}`);
      }
    }
  }
}

// search words: every part is found by its aliases (its own "aliases", or engine/cartoon/library/words.json); a part without them is hard to find
{ const words = (() => { try { return JSON.parse(fs.readFileSync(path.join(LIB_DIR, 'words.json'), 'utf8')).aliases || {}; } catch { return {}; } })();
  const bare = [...actions, ...gestures].filter((d) => !(d.aliases?.length || words[d.id]?.length)).map((d) => d.id);
  const bareP = pieceIds.filter((id) => !words[id]?.length && !setFiles.some((f) => new RegExp(`ZS\\.define\\(\\s*["']${id}["'][^)]*aliases`).test(fs.readFileSync(path.join(dir, f), 'utf8'))));
  if (bare.length + bareP.length) warn(`${bare.length + bareP.length} parts have no "aliases" (search words), add them in the part or engine/cartoon/library/words.json: ${[...bare, ...bareP].slice(0, 30).join(', ')}${bare.length + bareP.length > 30 ? '…' : ''}`); }
console.log(`Checked ${actions.length} actions, ${gestures.length} gestures, ${handIds.length} hands, ${pieceIds.length} set pieces and props.`);
for (const e of errors) console.log(`ERROR  ${e}`);
for (const w of warns.slice(0, 60)) console.log(`warn   ${w}`);
if (warns.length > 60) console.log(`warn   … and ${warns.length - 60} more`);
if (board) console.log(`Picture of everything: ${board}`);
console.log(errors.length ? `NOT READY: ${errors.length} error(s).` : "READY: copy the folders into engine/cartoon/library, then run node scripts/build-library.mjs");
process.exit(errors.length ? 1 : 0);
