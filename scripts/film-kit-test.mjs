// The 2D film's kit, set pieces and action helpers (no AI). All files in the OS temp directory; no story is shipped.
// Run after changing engine/cartoon/set.js, zc.js's helpers or server/filmkit.mjs:  node scripts/film-kit-test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { checkBody } from "../engine/cartoon/check-body.mjs";
import { openPage, showAt } from "../engine/readcheck.mjs";
import { saveKit, kitBlock, writeCast, needsKit } from "../server/filmkit.mjs";
import { builderSystem, videoHandoff } from "../server/animation-guidance.mjs";
import { joinLine } from "../server/joins.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."), ENGINE = path.join(root, "engine");
const out = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-kit-"));
process.env.ZANCUT_PARTS_FILE = path.join(out, "parts.json");
const A = { gender: "male", age: "child", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } };
const B = { gender: "male", age: "elderly", skin: 4, build: "thin", hair: { style: "cap", color: "white" }, outfit: { type: "punjabi", color: "#efe9da" }, extras: ["beard", "glasses"] };
const C = { gender: "female", age: "adult", skin: 3, hair: { style: "hijab", color: "#6d4aa8" }, outfit: { type: "abaya", color: "#3a3556" } };
function job(name, scenes, seconds = 2, kit = "") {
  const d = path.join(out, name); for (const x of ["cut", "edit/graphics", "work"]) fs.mkdirSync(path.join(d, x), { recursive: true });
  const D = scenes.length * seconds;
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", "color=c=0x222222:s=1080x1920:r=30", "-f", "lavfi", "-i", "anullsrc=r=48000", "-t", String(D), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(d, "cut/cut.mp4")]);
  fs.writeFileSync(path.join(d, "job.json"), "{}"); if (kit) fs.writeFileSync(path.join(d, "edit/film-kit.js"), kit);
  fs.writeFileSync(path.join(d, "cut/transcript.json"), JSON.stringify(scenes.flatMap((_, i) => [{ text: `a${i}`, start: i * seconds, end: i * seconds + 0.9 }, { text: `b${i}`, start: i * seconds + 1, end: (i + 1) * seconds - 0.05 }])));
  const plan = scenes.map((js, i) => { const f = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(d, f), `<script>\nZK.unit(root);\n${js}\n</script>`); return { row: i, uid: `s${i}`, startWord: i * 2, endWord: i * 2 + 1, kind: "graphic", mode: "full-broll-takeover", file: f, transition: "cut", captions: "hide", cues: [] }; });
  fs.writeFileSync(path.join(d, "edit/plan.json"), JSON.stringify({ version: 2, canvas: "1080x1920", kind: "faceless", style: "2d-animation", theme: "light", tokens: {}, captions: { on: false }, atoms: "", scenes: plan }));
  execFileSync(process.execPath, [path.join(ENGINE, "compose/compose.mjs"), d], { stdio: "pipe" });
  return path.join(d, "edit/hf");
}
const J = JSON.stringify;

// 1. the set pieces: every one draws for any seed, the same seed gives the same picture, another seed another shape, nothing random
{
  const hf = job("set", [`const W = ZC.world(root); W.layer("x"); ZC.clock(tl, s, d, () => W.cam(W.w / 2, W.h / 2, W.w));`]);
  const o = await openPage(hf);
  const r = await o.page.evaluate(() => {
    const svg = document.querySelector("svg"), l = window.ZC.el("g", {}, svg), bad = [], flat = [], lines = [], base = { x: 400, y: 900, h: 200, w: 300, r: 40 };
    const real = Math.random; Math.random = () => { bad.push("Math.random was used"); return real(); };
    const draw = (n, seed) => { l.innerHTML = ""; window.ZS[n](l, { ...base, seed, text: "x" }); return l.innerHTML; };
    for (const n of window.ZS.names) {
      for (const seed of [1, 2, 3, 7, 19]) try { if (!draw(n, seed)) bad.push(`${n}: drew nothing`); if (/NaN|undefined/.test(l.innerHTML)) bad.push(`${n} seed ${seed}: bad numbers`); } catch (e) { bad.push(`${n}: ${e.message}`); }
      if (draw(n, 4) !== draw(n, 4)) bad.push(`${n}: not the same for one seed`);
      if (new Set([1, 2, 3, 7, 19].map((sd) => draw(n, sd))).size > 2) flat.push(n);
      if (/stroke="#(0|1)/.test(draw(n, 3)) && !["pole", "kettle"].includes(n)) lines.push(n);
    }
    Math.random = real;
    return { bad, varied: flat, lines, names: window.ZS.names };
  });
  await o.close?.();
  assert.deepEqual(r.bad, [], r.bad.join("; "));
  assert.deepEqual(r.lines, [], `dark outlines on set pieces: ${r.lines}`);
  for (const n of ["tree", "palm", "bush", "house", "building", "shop", "rickshaw", "car", "cloud", "hill", "fence", "shelf", "plant", "jars"]) assert.ok(r.varied.includes(n), `${n} does not change with its seed`);
  assert.ok(r.names.length >= 30, "the starter library has its parts");
}

// 2. the actions hold the body rules for anyone, and a held thing stays on the hand in both bodies
{
  const scene = (spec) => `const W = ZC.world(root), l = W.layer("p"), f = W.layer("f"), fl = W.h * 0.8, sp = ${J(spec)};
    const a = ZC.actor(l, { spec: sp, H: 90, x: 100, floor: fl, view: "side" }), b = ZC.actor(l, { spec: sp, H: 90, x: 760, floor: fl, view: "side", facing: -1, id: "riser" });
    const c = ZC.prop(f, (g) => ZS.paper(g, { x: 0, y: 40, w: 60 })); window.__P = window.__P || []; const rec = window.__P;
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); a.arrive(t, { x0: 80, x1: 420, t0: 0, t1: 1.4 }); ZC.carry(c, a, 1); b.rise(t, { t0: 0.3, t1: 1.8 }, { x: 760 }); rec.length = 0; rec.push(a.handAt(1), c.g.getAttribute("transform"), b.seatHeight()); });`;
  const hf = job("actions", [scene(A), scene(B), scene(C)]);
  const g = await checkBody(hf);
  assert.ok(g.ok, `the ready actions break a rule:\n${g.lines.join("\n")}`);
  const o = await openPage(hf); await showAt(o.page, 0.9);
  const [hand, tr, seat] = await o.page.evaluate(() => window.__P); await o.close?.();
  assert.ok(tr.includes(`translate(${hand.x} ${hand.y})`), `a carried thing is not on the hand: ${tr} / ${J(hand)}`);
  assert.ok(seat > 40 && seat < 200, `seat height ${seat}`);
}

// 3. the hand-over keeps contact, and a target out of reach is corrected and noted, never a broken rule
{
  const js = `const W = ZC.world(root), l = W.layer("p"), f = W.layer("f"); const a = ZC.person(l, { cropped: true, spec: ${J(A)}, x: 300, y: 500, scale: 1 }), b = ZC.person(l, { cropped: true, spec: ${J(B)}, x: 780, y: 500, scale: 1 });
    const c = ZC.prop(f, (g) => ZS.paper(g, { x: 0, y: 40, w: 60 })), m = [540, 760]; window.__H = [];
    ZC.clock(tl, s, d, (t) => { const u = ZC.keys(t, [[0, 0], [0.6, 1], [1.4, 1], [1.9, 0]]), lerp2 = (r, i) => [r.rest[i][0] + (m[0] - r.rest[i][0]) * u, r.rest[i][1] + (m[1] - r.rest[i][1]) * u];
      a.draw({ face: "happy", hands: [a.rest[0], lerp2(a, 1)] }, t); b.draw({ face: "think", hands: [lerp2(b, 0), b.rest[1]], bend: [1, 0] }, t); ZC.handover(c, t, { from: [a, 1], to: [b, 0], t0: 0.7, t1: 1.2 }); window.__H = [a.handAt(1), b.handAt(0), c.g.getAttribute("transform")]; });`;
  const far = `const W = ZC.world(root), l = W.layer("p"); const a = ZC.person(l, { cropped: true, spec: ${J(C)}, x: 300, y: 500, scale: 1 }); ZC.clock(tl, s, d, (t) => { a.draw({ face: "happy", hands: [a.rest[0], [1000, 200]] }, t); });`;
  const hf = job("reach", [js, far]);
  const g = await checkBody(hf);
  assert.ok(g.ok, `hand-over or reach broke a rule:\n${g.lines.join("\n")}`);
  assert.ok(g.notes.some((x) => /beyond the arm's reach/.test(x)), "an unreachable target is not reported");
  const o = await openPage(hf);
  const at = async (t) => { await showAt(o.page, t); return o.page.evaluate(() => window.__H); };
  const on = (tr, h) => { const [x, y] = tr.match(/translate\(([-\d.]+) ([-\d.]+)\)/).slice(1).map(Number); return Math.hypot(x - h.x, y - h.y) < 0.5; };
  const before = await at(0.3), after = await at(1.5);
  await o.close?.();
  assert.ok(on(before[2], before[0]), "before the hand-over the thing is on the giver's hand");
  assert.ok(on(after[2], after[1]), "after the hand-over the thing is on the receiver's hand");
}

// 4. the kit: cast by code, places once, a board of real frames, its errors named, and every shot uses it
{
  const d = path.join(out, "film"), J0 = path.join(d, "job"), ws = d; for (const x of ["edit", "work"]) fs.mkdirSync(path.join(J0, x), { recursive: true });
  fs.writeFileSync(path.join(J0, "edit/plan.json"), J({ canvas: "1080x1920", atoms: "" }));
  const sb = { rows: [], film: { cast: [{ id: "boy", name: "Boy", spec: A }, { id: "dada", spec: B }], places: [{ id: "lane", look: "a lane", views: ["wide", "reverse"] }, { id: "room", look: "a room", views: ["close"] }] } };
  const E = { J0, d: { ws }, sb, p: { kind: "animation" } };
  assert.ok(needsKit(E)); writeCast(E);
  assert.match(fs.readFileSync(path.join(J0, "edit/film-kit.js"), "utf8"), /ZF\.cast = \{"boy"/);
  assert.match(kitBlock(sb), /ZF\.cast\.boy/); assert.ok(!/ZC\.place/.test(kitBlock(sb)), "no place is promised before it is drawn");
  const lane = `ZF.place("lane", { views: ["wide", "reverse"], floor: 0.74 }, (W, o) => { const f = W.h * 0.74; ZS.sky(W.layer("sky"), { w: W.w, h: f }); ZS.floor(W.layer("mid"), { w: W.w, y: f, h: W.h - f }); ZS.house(W.layer("mid"), { x: o.view === "reverse" ? 800 : 300, y: f, h: 400, seed: 2 }); return { floor: f }; });`;
  let r = await saveKit(E, "this is not ) code", ENGINE); assert.match(r.text, /does not parse/);
  r = await saveKit(E, lane, ENGINE); assert.match(r.text, /place "room" is missing/); assert.ok(needsKit(E), "a broken kit is not accepted");
  r = await saveKit(E, `${lane}\nZF.place("room", { views: ["close"] }, (W) => { ZS.wall(W.layer("mid"), { w: W.w, h: W.h }); nothing(); });`, ENGINE); assert.match(r.text, /nothing is not defined|room/); assert.ok(needsKit(E));
  r = await saveKit(E, `${lane}\nZF.place("room", { views: ["close"], floor: 0.8 }, (W) => { ZS.wall(W.layer("mid"), { w: W.w, h: W.h }); ZS.sofa(W.layer("mid"), { x: 500, y: W.h * 0.8, seed: 2 }); });`, ENGINE);
  assert.ok(r.ok, r.text); assert.ok(fs.existsSync(r.file)); assert.ok(!needsKit(E)); assert.match(kitBlock(sb), /ZC\.place\("id", W/); assert.match(kitBlock(sb), /"lane": views wide, reverse/);
  if (process.env.FILM_KIT_BOARD) fs.copyFileSync(r.file, process.env.FILM_KIT_BOARD);
  // parts kept for later films: a good one is saved, a broken one is refused, a later film gets only what it uses
  const withPart = `ZF.part("banyan", "a wide old tree", (layer, { x, y, h, seed = 1, color = "#4f8f4c" }) => { ZS.tree(layer, { x, y, h, seed, color }); });\n`;
  const places2 = `${lane}\nZF.place("room", { views: ["close"] }, (W) => { ZF.parts.banyan(W.layer("mid"), { x: 300, y: W.h * 0.8, h: 300 }); });`;
  delete sb.film.kit; r = await saveKit(E, `ZF.part("broken", "x", () => { nothing(); });\n${withPart}${places2}`, ENGINE); assert.match(r.text, /part "broken" fails/); assert.ok(!fs.existsSync(process.env.ZANCUT_PARTS_FILE) || !JSON.parse(fs.readFileSync(process.env.ZANCUT_PARTS_FILE, "utf8")).banyan, "a broken kit keeps no part");
  r = await saveKit(E, `${withPart}${places2}`, ENGINE); assert.ok(r.ok, r.text);
  assert.ok(JSON.parse(fs.readFileSync(process.env.ZANCUT_PARTS_FILE, "utf8")).banyan.src.includes("ZS.tree"), "the part is kept");
  assert.match(kitBlock(sb), /ZF\.parts\.banyan/);
  delete sb.film.kit; r = await saveKit(E, places2, ENGINE); assert.ok(r.ok, `a later film uses a kept part: ${r.text}`); assert.match(fs.readFileSync(path.join(J0, "edit/film-kit.js"), "utf8"), /ZF\.part\("banyan"/);
  // a film's own part is put in a place like a library piece (by id, "ZF.parts." allowed), with its real height
  const putOwn = (m) => `${withPart}${lane}\nZF.place("room", { views: ["close"], world: { close: { horizon: 0.42, floor: 0.8 } } }, (W, o) => { o.Z.put("ZF.parts.banyan", o.layer, { x: 0, dz: 3${m} }); return {}; });`;
  delete sb.film.kit; r = await saveKit(E, putOwn(""), ENGINE); assert.match(r.text, /own part, so give its real height/);
  delete sb.film.kit; r = await saveKit(E, putOwn(", m: 8"), ENGINE); assert.ok(r.ok, `a film's own part is put by id: ${r.text}`);
  delete sb.film.kit; r = await saveKit(E, places2, ENGINE); assert.ok(r.ok, r.text);
  // a shot on the kit: the place, its layers in order, the cast by id; a place or view the film does not have fails by name
  const kit = fs.readFileSync(path.join(J0, "edit/film-kit.js"), "utf8");
  const ok = `const W = ZC.world(root), P = ZC.place("lane", W, { view: "reverse" }), b = ZC.actor(W.layer("people"), { spec: ZF.cast.boy, H: 60, x: 400, floor: P.floor, view: "side" }); ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); P.tick(t); b.draw(ZC.walk(t / 1.1), {}); });`;
  const g = await checkBody(job("shot", [ok], 2, kit)); assert.ok(g.ok, g.lines.join("\n"));
  const bad = await checkBody(job("shotbad", [`const W = ZC.world(root); ZC.place("moon", W);`], 2, kit)); assert.ok(bad.lines.some((l) => /no place "moon"/.test(l)), "an unknown place is named");
  // the prompts: the whole script stays out once the film has its plan, the kit goes in
  const p = { kind: "animation", studio: { format: "9:16", design: "2d-animation" }, assets: [], name: "t" };
  const h = videoHandoff(p, { rows: [], video: {}, memory: {}, film: sb.film }, { animScript: "THE-WHOLE-SCRIPT" });
  assert.ok(!h.includes("THE-WHOLE-SCRIPT") && h.includes("ZF.cast.boy"), "a designer with the film's plan does not read the whole script");
  assert.ok(videoHandoff(p, { rows: [], video: {}, memory: {} }, { animScript: "THE-WHOLE-SCRIPT" }).includes("THE-WHOLE-SCRIPT"), "an older storyboard keeps the script");
  assert.ok(!builderSystem(p).includes("The 20 compositional mechanics") && !builderSystem(p).includes("Joint Range of Motion"), "the 2D designer reads the short rules");
  assert.ok(builderSystem(p).includes("ZC.handover") && builderSystem(p).includes("b.arrive") && builderSystem(p).includes("rickshaw"), "the 2D designer knows the helpers and parts");
  assert.ok(joinLine("x", { ground: 40, whole: 40, jump: true, groundJump: true }).includes("JUMP"), "other design systems keep the join check");
}
// 7. mouths and sides (M1, S1): ali speaks in scene 1, bina in scene 2. In scene 2 ali's mouth still lip-syncs (wrong: M1) and
//    the two have swapped sides of the screen (S1). The speakers come from plate/lines.json beside the job, as in a real film.
{
  const ali = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const bina = { gender: "female", age: "adult", skin: 3, hair: { style: "long", color: "black" }, outfit: { type: "salwar", color: "#2f8f83" } };
  fs.mkdirSync(path.join(out, "talk", "plate"), { recursive: true });
  fs.writeFileSync(path.join(out, "talk", "plate", "lines.json"), J([{ speaker: "ali", w0: 0, w1: 2 }, { speaker: "bina", w0: 2, w1: 4 }]));
  const two = (xa, xb, aliTalks) => `const W = ZC.world(root), L = W.layer("p");
const a = ZC.person(L, { cropped: true, spec: ${J(ali)}, x: ${xa}, y: 1000, scale: 0.8 }), b = ZC.person(L, { cropped: true, spec: ${J(bina)}, x: ${xb}, y: 1000, scale: 0.8 });
ZC.clock(tl, s, d, (t) => { const lip = 0.5 + 0.5 * Math.sin(t * 22);
  a.draw({ hands: "rest", mouth: ${aliTalks ? "lip" : "0"} }, t); b.draw({ hands: "rest", mouth: ${aliTalks ? "0" : "lip"} }, t); W.cam(W.w / 2, W.h / 2, W.w); });`;
  const hf = job("talk/job", [two(300, 780, true), `${two(780, 300, false).replace('a.draw({ hands: "rest", mouth: 0 }', 'a.draw({ hands: "rest", mouth: lip }')}`], 2, `ZF.cast = ${J({ ali, bina })};\n`);
  const all = await checkBody(hf, { fps: 10 });
  const m1 = all.faults.filter((f) => f.rule === "M1");
  assert.ok(m1.length && m1.every((f) => f.row === 1 && f.who === "ali"), `M1 only on ali in scene 2: ${J(m1)}`);
  const second = await checkBody(hf, { from: 1.4, to: 4, fps: 10, row: 1 });
  assert.ok(second.notes.some((n) => n.startsWith("S1 scene 2:")), `S1 note on the cut into scene 2: ${J(second.notes)}`);
  const first = await checkBody(hf, { from: 0, to: 2, fps: 10, row: 0 });
  assert.ok(!first.faults.some((f) => f.rule === "M1") && !first.notes.some((n) => /^S1/.test(n)), "scene 1 is clean");
}
// 8. the lower body (W1): a waist-up body (no legs) that ends inside the frame fails, so does a shirt stretched with `longer`
//    where the legs should be; a close-up the frame cuts at the waist passes, so does a person cropped inside a card
{
  const sp = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const one = (opt, cam = "W.cam(W.w / 2, W.h / 2, W.w)") => `const W = ZC.world(root), r = ZC.person(W.layer("p"), { spec: ${J(sp)}, x: 540, ${opt} }); ZC.clock(tl, s, d, (t) => { ${cam}; r.draw({ hands: "rest" }, t); });`;
  const hf = job("waist", [one("y: 700, scale: 1"), one("y: 700, scale: 1, longer: 900"), one("y: 1500, scale: 1.3"), one("y: 700, scale: 1, cropped: true")], 1);
  const g = await checkBody(hf, { fps: 6 }), w1 = new Set(g.faults.filter((f) => f.rule === "W1").map((f) => f.row));
  assert.ok(w1.has(0) && w1.has(1), `a floating torso and a stretched shirt fail W1: ${J([...w1])}`);
  assert.ok(!w1.has(2) && !w1.has(3), `a close-up cut by the frame and a card-cropped person pass: ${J([...w1])}`);
}
// 9. the world scale (Z1, Z2): people put with Z.person in a place with a world view pass at any depth; a person drawn by eye
//    three times too big, or standing above the horizon, fails; a scene without a world view is not judged
{
  const sp = { gender: "female", age: "adult", skin: 3, hair: { style: "bun", color: "black" }, outfit: { type: "salwar", color: "#2d7f8c" } };
  const kid = { gender: "male", age: "child", years: 8, skin: 4, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } };
  const world = (body) => `const W = ZC.world(root), L = W.layer("world"), Z = ZW.view(W); Z.put("busStop", L, { x: -1, dz: 2 }); ${body}`;
  const good = world(`const a = Z.person(${J(sp)}, { x: 0.5, dz: 1, layer: L }), b = Z.person(${J(kid)}, { x: -0.6, dz: 4, layer: L });
    const A = ZC.actor(a.slot, { spec: ${J(sp)}, ...a, view: "front" }), B = ZC.actor(b.slot, { spec: ${J(kid)}, ...b, view: "three" });
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); A.draw(A.pose("stand")); B.draw(B.pose("walk", t * 300)); });`);
  const giant = world(`const a = Z.person(${J(sp)}, { x: 0.5, dz: 1 }), A = ZC.actor(L, { spec: ${J(sp)}, x: a.x, floor: a.floor, H: a.H * 3, view: "front" });
    ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); A.draw(A.pose("stand")); });`);
  const sky = world(`const A = ZC.actor(L, { spec: ${J(sp)}, x: 540, floor: Z.horizon - 200, H: 20, view: "front" }); ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); A.draw(A.pose("stand")); });`);
  const noWorld = `const W = ZC.world(root), A = ZC.actor(W.layer("p"), { spec: ${J(sp)}, x: 540, floor: 1700, H: 200, view: "front" }); ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); A.draw(A.pose("stand")); });`;
  const g = await checkBody(job("world", [good, giant, sky, noWorld], 1), { fps: 6 }), by = (rule) => new Set(g.faults.filter((f) => f.rule === rule).map((f) => f.row));
  assert.ok(!by("Z1").has(0) && !by("Z2").has(0), `real sizes at two depths pass: ${g.lines.join("\n")}`);
  assert.ok(by("Z1").has(1), "a person three times too big fails Z1");
  assert.ok(by("Z2").has(2), "a person standing above the horizon fails Z2");
  assert.ok(!by("Z1").has(3) && !by("Z2").has(3), "a scene without a world view is not judged by the world rules");
  assert.ok(g.lines.some((l) => /Z1:.*Fix: place people with Z\.person/.test(l)), "a Z1 failure says how to fix it");
}
// 10. a kit place with a world view: the kit puts its pieces in metres, a shot puts the cast at a spot, "mid" and "people" are the
//     place's one depth-sorted layer, and the gate finds every size right
{
  const sp = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const kit = `ZF.place("street", { views: ["wide"], world: { wide: { horizon: 0.4, floor: 0.82 } }, spots: { stop: { x: -0.8, dz: 2.6 } } }, (W, o) => {
    ZS.sky(W.layer("sky"), { w: W.w, h: o.Z.horizon + 60 }); o.Z.put("busStop", o.layer, { x: -1, dz: 2.5, seed: 2 }); o.Z.put("streetLamp", o.layer, { x: 2, dz: 1.5 }); return {}; });`;
  const shot = `const W = ZC.world(root), P = ZC.place("street", W), a = P.Z.person(${J(sp)}, { ...P.spots.stop, layer: P.layer }), b = ZC.actor(a.slot, { spec: ${J(sp)}, ...a, view: "front" });
    window.__K = { same: W.layer("people") === P.layer && W.layer("mid") === P.layer, horizon: P.Z.horizon, floor: P.floor, a };
    ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); b.draw(b.pose("stand")); });`;
  const hf = job("worldkit", [shot], 1, kit), g = await checkBody(hf, { fps: 6 });
  assert.ok(g.ok, `a kit place in metres keeps every rule:\n${g.lines.join("\n")}`);
  const o = await openPage(hf); await showAt(o.page, 0.5); const k = await o.page.evaluate(() => window.__K); await o.close?.();
  assert.ok(k.same, "mid and people are the place's depth-sorted world layer");
  assert.ok(Math.abs(k.horizon - 1920 * 0.4) < 1 && Math.abs(k.floor - 1920 * 0.82) < 1, `the kit's camera is used: ${J(k)}`);
  const manM = JSON.parse(fs.readFileSync(path.join(root, "engine/cartoon/library/sizes.json"), "utf8")).standards.people["male.adult"][1];
  assert.ok(k.a.floor < k.floor && k.a.metres === manM, `the spot is behind the floor line, a man of the size table's ${manM} m: ${J(k.a)}`);
}
// 11. acting (ZC.feel, the acting cards): the timing rules in plain Node, then a full body and a waist-up person acting through
//     feeling changes keep every body rule in real Chrome
{
  globalThis.ZACTING_DATA = JSON.parse(fs.readFileSync(path.join(root, "engine/cartoon/library/acting.json"), "utf8"));
  await import(path.join(root, "engine/cartoon/acting.js"));
  const Z = globalThis.ZACTING, card = (id, lv = "mild", age = "adult") => Z.resolve(id, lv, age);
  const F = Z.feel("neutral", { at: 0 }).then("sad", { level: "strong", at: 1 }), sad = card("sad", "strong"), on = sad.timing.onset;
  const done = 1 + on.notice + on.change + on.settle + 0.01;
  assert.equal(F.at(0.5).face.smile, card("neutral").face.smile, "before the change the first feeling holds");
  assert.ok(Math.abs(F.at(done).body.headPitch - sad.body.headPitch) < 1e-6 && Math.abs(F.at(done).face.inner - sad.face.inner) < 1e-6, "after notice + change + settle the strong card is reached");
  const mid = 1 + on.notice + on.change * 0.12, s0 = F.at(mid);
  assert.ok(Math.abs(s0.face.raise - card("neutral").face.raise) > 1e-3 && Math.abs(s0.body.elbowZ - card("neutral").body.elbowZ) < 1e-6, "the brows move before the hands (the card's leads)");
  const later = done + sad.timing.hold + 0.7;
  assert.ok(Math.abs(F.at(later).body.headPitch - card("sad").body.headPitch) < 1e-6, "a strong feeling eases to its mild card after its hold");
  const T = Z.feel("happy", { level: "strong", at: 0 }).then("sad", { at: 1 }), tr = globalThis.ZACTING_DATA.transitions.find((x) => x.from === "happy" && x.to === "sad");
  assert.ok(tr, "happy → sad has a transition"); const b1 = tr.beats[1];
  assert.ok(Math.abs(T.at(1 + b1.at).face.inner - b1.face.inner) < 1e-6, "a change with a transition follows its beats");
  const kid = Z.feel("neutral", { spec: { age: "child", years: 8 } }).then("joy", { at: 1 }), grown = Z.feel("neutral").then("joy", { at: 1 }), q = 1 + card("joy").timing.onset.notice + 0.15;
  assert.ok(Math.abs(kid.at(q).body.chestLift) >= Math.abs(grown.at(q).body.chestLift), "a child acts quicker and bigger than an adult");
  assert.throws(() => Z.feel("happpy"), /no feeling "happpy"/, "an unknown feeling names the ones there are");
  assert.equal(Z.feel("pleased").id(0), "happy", "a feeling is found by its aliases");
  assert.equal(Z.feel("মন খারাপ").id(0), "sad", "a feeling is found by its Bangla words");

  const sp = { gender: "female", age: "adult", skin: 3, hair: { style: "hijab", color: "#6d4aa8" }, outfit: { type: "kameez", color: "#2d7f8c" } };
  const kidSp = { gender: "male", age: "child", years: 8, skin: 4, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } };
  const body = `const W = ZC.world(root), L = W.layer("p"), b = ZC.actor(L, { spec: ${J(sp)}, H: 60, x: 300, floor: 1500, view: "three" }), c = ZC.actor(L, { spec: ${J(kidSp)}, H: 46, x: 760, floor: 1500, view: "front", facing: -1 });
    const F = ZC.feel("worried", { spec: ${J(sp)} }).then("scared", { level: "strong", at: 0.3 }).then("relieved", { at: 1.1 }), G = ZC.feel("sad", { spec: ${J(kidSp)}, level: "strong" }).then("hopeful", { at: 0.9 });
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); F.draw(b, t); G.draw(c, t); });`;
  const waist = `const W = ZC.world(root), r = ZC.person(W.layer("p"), { cropped: true, spec: ${J(sp)}, x: 540, y: 700, scale: 1 }), F = ZC.feel("happy", { level: "strong", spec: ${J(sp)} }).then("sad", { at: 0.4 });
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); r.draw({ ...F.person(t), hands: "rest" }, t); });`;
  const g = await checkBody(job("acting", [body, waist], 2), { fps: 10 });
  assert.ok(g.ok, `acting through feeling changes keeps every body rule:\n${g.lines.join("\n")}`);
}
// 12. the camera (camera rule book): ZC.frame gives each size (named back by ZC.shotSize, eyes in the book's band) for an adult and a
//     child; a shot list follows a walking person; prayer is never shot close (C1); the same close-up across a cut is a jump cut (C2)
{
  const man = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const kid = { gender: "female", age: "child", years: 7, skin: 3, hair: { style: "long", color: "black" }, outfit: { type: "tshirt", color: "#d8607a" } };
  const probe = `const W = ZC.world(root), L = W.layer("p"), a = ZC.actor(L, { spec: ${J(man)}, H: 60, x: 300, floor: 1500, view: "three" }), c = ZC.actor(L, { spec: ${J(kid)}, H: 45, x: 800, floor: 1500, view: "front" });
    const sizes = ["closeUp", "mediumClose", "medium", "mediumWide", "full", "wide"], R = window.__CAM = [];
    ZC.clock(tl, s, d, (t) => { a.draw(a.pose("stand")); c.draw(c.pose("stand")); R.length = 0;
      for (const [who, b] of [["man", a], ["kid", c]]) for (const z of sizes) { ZC.frame(W, b, z); const cam = W.svg.__cam, bx = b.box(); R.push({ who, z, got: ZC.shotSize(W, b), eyes: (bx.headY - (cam.y - cam.ch / 2)) / cam.ch, feet: (bx.floor - (cam.y - cam.ch / 2)) / cam.ch }); }
      ZC.frame(W, a, "medium"); });`;
  const walk = `const W = ZC.world(root), b = ZC.actor(W.layer("p"), { spec: ${J(man)}, H: 50, x: 100, floor: 1500, view: "side" }); window.__FOL = [];
    ZC.clock(tl, s, d, (t) => { b.arrive(t, { x0: 100, x1: 900, t0: 0, t1: 1.8 }); ZC.shots(W, t, [{ at: 0, frame: [b, "full"] }]); const c = W.svg.__cam; window.__FOL.push(Math.abs(b.box().x - c.x) / c.cw); });`;
  const pray = (size) => `const W = ZC.world(root), b = ZC.actor(W.layer("p"), { spec: ${J(man)}, H: 60, x: 540, floor: 1500, view: "side" }); ZC.clock(tl, s, d, () => { b.draw(b.pose("sajdah")); ZC.frame(W, b, "${size}"); });`;
  const one = (size) => `const W = ZC.world(root), b = ZC.actor(W.layer("p"), { spec: ${J(man)}, H: 60, x: 540, floor: 1500, view: "front" }); ZC.clock(tl, s, d, () => { b.draw(b.pose("stand")); ZC.frame(W, b, "${size}"); });`;
  const hf = job("camera", [probe, walk, pray("closeUp"), pray("full"), one("closeUp"), one("closeUp"), one("medium")], 1), g = await checkBody(hf, { fps: 6 });
  const o = await openPage(hf); await showAt(o.page, 0.5); const R = await o.page.evaluate(() => window.__CAM); await showAt(o.page, 1.9); const fol = await o.page.evaluate(() => window.__FOL); await o.close?.();
  const book = JSON.parse(fs.readFileSync(path.join(root, "engine/cartoon/library/camera.json"), "utf8")).sizes;
  for (const r of R) {
    assert.equal(r.got, r.z, `${r.who} framed as ${r.z} reads as ${r.got}`);
    const band = book[r.z].eyeLine; if (Array.isArray(band)) assert.ok(r.eyes > band[0] - 0.06 && r.eyes < band[1] + 0.06, `${r.who} ${r.z}: eyes at ${r.eyes.toFixed(2)} of the frame, the book says ${band}`);
    if (r.z === "full") assert.ok(r.feet < 1 && r.feet > 0.85, `${r.who} full: the feet are in the frame near its bottom (${r.feet.toFixed(2)})`);
  }
  assert.ok(fol.length >= 2 && fol.every((x) => x < 0.12), `a shot that follows a walking person keeps them framed: ${fol.map((x) => x.toFixed(2)).join(" ")}`);
  const c1 = new Set(g.faults.filter((f) => f.rule === "C1").map((f) => f.row));
  assert.ok(c1.has(2) && !c1.has(3), `a close shot of sajdah fails C1, a full shot passes: ${J([...c1])}`);
  assert.ok(g.notes.some((n) => /^C2 scene 6:/.test(n)) && !g.notes.some((n) => /^C2 scene 7:/.test(n)), `the same close-up across a cut is a jump cut; close-up → medium is not: ${g.notes.filter((n) => n.startsWith("C")).join(" | ")}`);
}
// 13. hands reach real targets (ZC.pair + b.reach): a two-person move between people of different sizes lands each contact on the
//     other person's joint (salam hands meet; a man's hand on a shorter woman's shoulder; an adult's hands on a child being lifted)
{
  const man = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const lady = { gender: "female", age: "adult", skin: 3, hair: { style: "bun", color: "black" }, outfit: { type: "salwar", color: "#2d8f7c" } };
  const kid = { gender: "male", age: "child", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } };
  const probe = `const W = ZC.world(root), L = W.layer("p"); window.__PAIR = [];
    const cases = [["salam_greet_a", ${J(lady)}, 0.55, "side"], ["hand_on_shoulder_a", ${J(lady)}, 0.8, "front"], ["lift_child_up_a", ${J(kid)}, 0.5, "side"]];
    ZC.clock(tl, s, d, () => { window.__PAIR.length = 0; cases.forEach(([id, spec, u, view], i) => {
      const x = 300 + i * 700, a = ZC.actor(L, { spec: ${J(man)}, H: 50, x, floor: 1500, view }), b = ZC.actor(L, { spec, H: 44, x, floor: 1500, view });
      ZC.pair(a, b, id, u, { a: { x, floor: 1500, facing: 1, view }, b: { floor: 1500 } });
      const def = ZANATOMY.libraryDef(id), H = a.box().headPx * 7;
      for (const c of def.contacts || []) if (/^partner\./.test(c.on) && u >= (c.from ?? 0) && u <= (c.to ?? 1) && /^hand/.test(c.joint)) {
        const p = a.jointAt(c.joint), q = b.jointAt(c.on.slice(8)); window.__PAIR.push({ id, c: c.joint + "→" + c.on, gap: Math.hypot(p.x - q.x, p.y - q.y) / H }); }
    }); });`;
  // every named mouth of the acting cards draws on the full body, front and side, and the new dials do not break a face
  const faces = `const W = ZC.world(root), L = W.layer("p"), names = ZACTING_DATA.dialRanges.mouthNames; window.__MOUTH = [];
    ZC.clock(tl, s, d, () => { window.__MOUTH.length = 0; names.forEach((m, i) => { const a = ZC.actor(L, { spec: ${J(man)}, H: 60, x: 60 + i * 64, floor: 900, view: i % 2 ? "side" : "front" });
      a.draw(a.pose("stand"), { face: { mouth: m, browL: 0.5, squint: 0.4, tears: 0.6, sweat: 0.5, look: [0.5, 0.3], wink: "L" } });
      window.__MOUTH.push({ m, ok: i % 2 ? true : !!document.querySelector('[data-mouth="' + m + '"]') || m === "rest" }); }); });`;
  const hf = job("pair", [probe, faces], 1), o = await openPage(hf); await showAt(o.page, 0.5); const P = await o.page.evaluate(() => window.__PAIR); await showAt(o.page, 1.5); const M = await o.page.evaluate(() => window.__MOUTH); await o.close?.();
  assert.ok(M.length >= 15 && M.every((x) => x.ok), `every named mouth draws: ${J(M.filter((x) => !x.ok))}`);
  assert.ok(P.length >= 3, `the contacts were measured: ${J(P)}`);
  for (const p of P) assert.ok(p.gap < 0.06, `${p.id}: ${p.c} lands on the partner (gap ${(p.gap * 100).toFixed(1)}% of the body)`);
}
// 14. a person looks right close up: the neck shows above the cloth (no dome of cloth to the chin) for any outfit, and a full body
//     framed close fails the gate (C5: close shots are the waist-up person)
{
  const specs = [{ gender: "male", age: "adult", skin: 3, hair: { style: "side", color: "black" }, outfit: { type: "tshirt", color: "#2563eb" } }, { gender: "male", age: "adult", skin: 3, hair: { style: "crop", color: "dark" }, outfit: { type: "shirt", color: "#374151" } }, { gender: "female", age: "adult", skin: 3, hair: { style: "long", color: "black" }, outfit: { type: "kameez", color: "#db2777" } }, { gender: "male", age: "child", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } }];
  const probe = `const W = ZC.world(root), L = W.layer("p"), specs = ${J(specs)}; window.__NECK = [];
    ZC.clock(tl, s, d, () => { window.__NECK.length = 0; specs.forEach((spec, i) => ["front", "three"].forEach((view, k) => { const x = 200 + i * 200 + k * 90, a = ZC.actor(L, { spec, H: 60, x, floor: 1500, view }); a.draw(a.pose("stand")); const B = a.box(), g = W.svg.querySelectorAll('[data-part="torso"] > g[fill]'), top = g[g.length - 1].getBBox().y + 1500; window.__NECK.push({ who: spec.outfit.type + "/" + view, gap: (top - (B.headTop + B.headPx)) / B.headPx }); })); });`;
  const closeFull = `const W = ZC.world(root), b = ZC.actor(W.layer("p"), { spec: ${J(specs[0])}, H: 60, x: 540, floor: 1500, view: "front" }); ZC.clock(tl, s, d, () => { b.draw(b.pose("stand")); ZC.frame(W, b, "closeUp"); });`;
  const hf = job("close", [probe, closeFull], 1), g = await checkBody(hf, { fps: 6 }), o = await openPage(hf); await showAt(o.page, 0.5); const N = await o.page.evaluate(() => window.__NECK); await o.close?.();
  assert.ok(N.length === 8, `measured: ${J(N)}`);
  for (const n of N) assert.ok(n.gap > 0.04, `${n.who}: the neck shows above the cloth (gap ${n.gap.toFixed(2)} of a head)`);
  assert.ok(g.faults.some((f) => f.rule === "C5"), "a full body framed close fails the gate (C5)");
}
// 15. the waist-up person plays the library: every action and gesture lands both hands inside the arm's reach for anyone; a move
//     runs through the gate on real frames; a sheet lies over the body and under the fingers; a seated lap is no "robot arm"
{
  const people = [{ gender: "male", age: "adult", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#6B7B3A" } }, { gender: "female", age: "adult", skin: 3, hair: { style: "bob", color: "black" }, outfit: { type: "kurti", color: "#b6a2e0" } }, { gender: "male", age: "child", skin: 4, hair: { style: "crop", color: "dark" }, outfit: { type: "shirt", color: "#2f6fb0" } }];
  const sweep = `const W = ZC.world(root), specs = ${J(people)}; window.__POSES = { n: 0, bad: [] }; ZC.clock(tl, s, d, () => {});
    const A = window.ZANATOMY.library(); specs.forEach((spec, k) => { const r = ZC.person(W.layer("p" + k), { spec, x: 300 + k * 240, y: 700, scale: 0.7 });
      const check = (id, q) => { window.__POSES.n++; const ok = q.hands.flat().every(Number.isFinite) && q.hands.every((h, i) => Math.hypot(h[0] - r.shoulders[i][0], h[1] - r.shoulders[i][1]) <= r.reach * 1.02) && q.handPoses.length === 2; if (!ok) window.__POSES.bad.push(id); };
      for (const id of A.actions) for (const ph of [0, 120, 240]) check(id, r.pose(id, ph));
      for (const id of A.gestures) { try { check(id, r.pose("sit", 35, { gesture: { id, phase: 90 } })); } catch { window.__POSES.bad.push("g:" + id); } } });`;
  const move = (ids, q = "") => `const W = ZC.world(root), r = ZC.person(W.layer("p"), { spec: ${J(people[0])}, x: 540, y: 900, scale: 1.6 });
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); const u = t / d, a = r.pose(${J(ids[0])}, u * 360), b = r.pose(${J(ids[1] || ids[0])}, u * 360); r.draw({ ...r.blend(a, b, u), face: "neutral", ${q} }, t); });`;
  const paper = `const W = ZC.world(root), r = ZC.person(W.layer("p"), { spec: ${J(people[1])}, x: 540, y: 800, scale: 1.7 }), cv = ZC.sheet(r, { w: 340, h: 460 }); window.__SHEET = [];
    ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); r.draw({ ...r.blend(r.named("paper", t), r.named("tap", t), ZC.keys(t, [[0.7, 0], [1.2, 1]])), face: "think" }, t); cv.follow(); const b = cv.g.getBoundingClientRect(), sv = cv.g.ownerSVGElement.getBoundingClientRect(), k = 1080 / sv.width, at = (i) => r.handAt(i);
      const order = [...cv.g.parentNode.parentNode.children].indexOf(cv.g.parentNode); window.__SHEET.push({ a: at(0), b: at(1), box: cv.g.getCTM() ? cv.g.getBBox() : null, order, m: cv.g.getAttribute("transform") }); });`;
  const seatedLap = `const W = ZC.world(root), b = ZC.actor(W.layer("p"), { spec: ${J(people[0])}, H: 200, x: 540, floor: 1500, view: "front" }); ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); b.draw(ZC.sit()); });`;
  const seatedLib = seatedLap.replace("ZC.sit()", `b.pose("rest_sit_chair", 90)`);
  const hf = job("waistlib", [sweep, move(["sit_idle", "sit_lean_forward"]), move(["rest_sit_chair", "laugh_big"]), move(["hold_in_front", "shrug"]), paper, seatedLap, seatedLib], 2);
  const g = await checkBody(hf, { fps: 30 }), o = await openPage(hf); await showAt(o.page, 1); const P = await o.page.evaluate(() => window.__POSES); await showAt(o.page, 9); const S = await o.page.evaluate(() => window.__SHEET.at(-1));
  if (process.env.KIT_PICS) for (const t of [2.6, 3.6, 4.6, 5.6, 6.6, 7.6, 8.5, 9.6]) { await showAt(o.page, t); await o.page.screenshot({ path: path.join(process.env.KIT_PICS, `t${t}.jpg`), type: "jpeg", quality: 80 }); }
  await o.close?.();
  assert.ok(P.n > 2000, `swept ${P.n} poses`);
  assert.ok(!P.bad.length, `every library move stays in reach on the waist-up person: ${[...new Set(P.bad)].slice(0, 12).join(" ")}`);
  const bodyFaults = g.faults.filter((f) => [1, 2, 3, 4].includes(f.row) && !["W1"].includes(f.rule));
  assert.ok(!bodyFaults.length, `library moves on the waist-up person pass the gate: ${J(bodyFaults.slice(0, 5))}`);
  assert.equal(S.order, 1, "the sheet's layer is between the body and the arms");
  const c = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(S.m).slice(1).map(Number);
  assert.ok(Math.abs(c[0] - (S.a.x + S.b.x) / 2) < 3, "the sheet sits between the two palms");
  for (const h of [S.a, S.b]) assert.ok(Math.abs(h.x - c[0]) < 200 && Math.abs(h.y - c[1]) < 260, `each hand is on the sheet: ${J({ h, c })}`);
  assert.ok(!g.notes.some((n) => /^A1 /.test(n) && /"(sit|rest_sit_chair)"/.test(n)), `hands in a seated lap are not a robot arm: ${g.notes.filter((n) => /^A1/.test(n)).slice(0, 2).join(" | ")}`);
}
fs.rmSync(out, { recursive: true, force: true });
// 16. a hand that changes shape folds over frames and is never see-through (a see-through hand reads as a ghost); a seek starts clean
{
  const fade = `try { const W = ZC.world(root), l = W.layer("p"), r = ZC.person(l, { spec: { gender: "male", age: "adult", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#6B7B3A" } }, x: 540, y: 800, scale: 1.4 });
    const half = () => l.querySelectorAll('g[data-fade="1"]').length, see = () => l.querySelectorAll("g[data-fade]").length && [...l.querySelectorAll("g[data-fade]")].filter((e) => { const v = +e.getAttribute("opacity"); return v > 0 && v < 1; }).length, f = 1 / 30, A = window.__FADE = [];
    const at = (hands, t) => { r.draw({ hands, face: "neutral" }, t); A.push(half()); window.__SEE = (window.__SEE || 0) + see(); };
    at("paper", 0); at("paper", f); at("type", 2 * f); at("type", 3 * f); at("type", 4 * f); at("type", 5 * f); at("paper", 3); at("paper", 3 + f); at("type", 1);
    ZC.clock(tl, s, d, () => {}); } catch (e) { window.__FADE = String(e.stack || e); }`;
  const hf = job("fade", [fade], 1), o = await openPage(hf); await showAt(o.page, 0.5); const F = await o.page.evaluate(() => window.__FADE), see = await o.page.evaluate(() => window.__SEE); await o.close?.();
  assert.equal(see, 0, "a hand is never see-through");
  if (process.env.KIT_PICS) {
    const pose = `const W = ZC.world(root), r = ZC.person(W.layer("p"), { spec: { gender: "male", age: "adult", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#6B7B3A" } }, x: 540, y: 620, scale: 1 });
      const a = r.named("paper", 0), b = r.pose("shrug", 35); window.__HP = [a.handPoses, b.handPoses];
      ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); r.draw({ ...(t < 1 ? a : b), face: "neutral" }, t); });`;
    const p = await openPage(job("ghost", [pose], 2));
    await showAt(p.page, 0.8); console.log(J(await p.page.evaluate(() => window.__HP))); for (let i = 0; i < 6; i++) { const t = 0.9 + i / 30; await showAt(p.page, t + 1e-4); await p.page.screenshot({ path: path.join(process.env.KIT_PICS, `ghost${i}.jpg`), type: "jpeg", quality: 85 }); }
    await p.close?.();
  }
  assert.ok(Array.isArray(F), `the fade scene ran: ${F}`);
  assert.deepEqual(F.slice(0, 2), [0, 0], "no fade before a change");
  assert.ok(F[2] > 0 && F[3] > 0, `the change fades over two frames: ${J(F)}`);
  assert.deepEqual(F.slice(4, 6), [0, 0], `then it is done: ${J(F)}`);
  assert.deepEqual(F.slice(6), [0, 0, 0], `a jump in time starts clean, forward or back: ${J(F)}`);
}

// the stage (engine/cartoon/stage.js): a real camera over a place in metres; loaded with the kit
{
  const src = fs.readFileSync(new URL("../engine/cartoon/stage.js", import.meta.url), "utf8"), box = {}; new Function("window", src)(box); const c = box.ZT.camera({ eye: [0, 1.5, 0], at: [0, 1.5, 4], f: 1000, cx: 540, cy: 960 }), p = c.at([1, 1.5, 4]);
  assert.ok(Math.abs(p.x - 790) < 1e-6 && Math.abs(p.y - 960) < 1e-6 && Math.abs(p.s - 250) < 1e-6, `a point one metre right, four away: ${JSON.stringify(p)}`);
  assert.ok(c.at([0, 2.5, 4]).y < 960, "up is up on screen");
  assert.ok(fs.readFileSync(new URL("../engine/compose/compose.mjs", import.meta.url), "utf8").includes('"stage.js"'), "compose loads the stage");
  assert.ok(!/Math\.random|setTimeout|Date\.now/.test(src), "the stage is seek-safe");
}

// the designed screens and beat graphics (engine/cartoon/screens.js): parts only, loaded with the kit, no words of their own
{
  const src = fs.readFileSync(new URL("../engine/cartoon/screens.js", import.meta.url), "utf8"), box = {}; new Function("window", src)(box);
  for (const k of ["layer", "pill", "laptop", "chat", "doc", "list", "window", "dock", "poster", "match", "card", "stamp", "questions", "bulb", "thought", "calendar", "drop", "formPage", "postBody", "tail", "folder", "topThings", "monitor", "scroll", "sticker", "chatBox", "docWindow", "tray", "cursor", "fly", "thumb", "slash", "ringOn", "ground", "in", "out", "type"]) assert.equal(typeof box.ZD[k], "function", `ZD.${k}`);
  assert.ok(fs.readFileSync(new URL("../engine/compose/compose.mjs", import.meta.url), "utf8").includes('"screens.js"'), "compose loads the screens kit");
  assert.ok(!/Math\.random|setTimeout|setInterval|Date\.now/.test(src), "the screens kit is seek-safe: no clocks, no random");
}

// 17. M2: a speaker on screen with a closed mouth is refused; a quiet shoulder or someone seen from behind is not
{
  const ali = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  fs.mkdirSync(path.join(out, "lips", "plate"), { recursive: true }); fs.writeFileSync(path.join(out, "lips", "plate", "lines.json"), J([{ speaker: "ali", w0: 0, w1: 6 }]));
  const scene = (draw) => `const W = ZC.world(root), a = ZC.person(W.layer("p"), { cropped: true, spec: ${J(ali)}, x: 540, y: 1000, scale: 0.8 });
ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); a.draw({ hands: "rest", ${draw} }, t); });`;
  const hf = job("lips/job", [scene("mouth: ZC.mouth(t + s, words)"), scene("mouth: 0"), scene("quiet: true, mouth: 0")], 2, `ZF.cast = ${J({ ali })};\n`);
  const g = await checkBody(hf, { fps: 10 }), m2 = g.faults.filter((f) => f.rule === "M2");
  assert.equal(m2.length, 1, `M2 only on the closed mouth: ${J(m2)}`); assert.equal(m2[0].row, 1);
}

// 18. over the shoulder (O1): a person seen from behind is sized from the one they face (ZC.ots); a small one is refused.
//     The two drawings agree on size: a waist-up person and an actor of H = 0.888 × its shoulder width are the same width on screen.
{
  const ali = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const bina = { gender: "female", age: "adult", skin: 3, hair: { style: "long", color: "black" }, outfit: { type: "salwar", color: "#2f8f83" } };
  const shot = (near) => `const W = ZC.world(root), r = ZC.person(W.layer("p"), { cropped: true, spec: ${J(bina)}, x: 620, y: 860, scale: 2 });
const n = ${near};
ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); r.draw({ hands: "rest", face: "listen" }, t); n.draw(t); });`;
  const good = shot(`ZC.ots(W.layer("near", { blur: 1.5 }), { spec: ${J(ali)}, of: r, side: "left" })`);
  const small = shot(`(() => { const b = ZC.actor(W.layer("near"), { spec: ${J(ali)}, H: 340, x: 170, floor: W.h * 1.42, view: "back" }); return { draw: () => b.draw(b.pose("rest_sit_chair", 60), { props: false }) }; })()`);
  const size = `const W = ZC.world(root), r = ZC.person(W.layer("p"), { spec: ${J(ali)}, x: 300, y: 900, scale: 1.3 }); r.draw({ hands: "rest" }, 0);
const b = ZC.actor(W.layer("a"), { spec: ${J(ali)}, H: 0.888 * Math.abs(r.shoulders[1][0] - r.shoulders[0][0]), x: 780, floor: 1600, view: "front" }); b.draw(b.pose("rest_sit_chair", 60), { props: false });
window.__SZ = [W.layer("p").getBoundingClientRect().width, W.layer("a").getBoundingClientRect().width]; ZC.clock(tl, s, d, () => {});`;
  const hf = job("ots", [good, small, size], 2, `ZF.cast = ${J({ ali, bina })};\n`);
  const g = await checkBody(hf, { fps: 10 }), o1 = g.faults.filter((f) => f.rule === "O1");
  assert.ok(o1.length && o1.every((f) => f.row === 1), `O1 only on the small back figure: ${J(o1.slice(0, 3))}`);
  const o = await openPage(hf); await showAt(o.page, 5); const SZ = await o.page.evaluate(() => window.__SZ);
  const holds = await o.page.evaluate(() => {
    const layer = ZC.el("g", {}, document.querySelector("svg"));
    const p = ZC.person(layer, { spec: ZF.cast.ali, x: 540, y: 900, scale: 1 });
    for (const [a, b] of [["cup", "sip"], ["sip", "table"], ["table", "cup"]]) for (const u of [0, 0.25, 0.5, 0.75, 1]) p.draw(p.blend(p.named(a), p.named(b), u), u);
    return { invalid: /NaN|undefined/.test(layer.innerHTML), size: layer.getBBox().width };
  });
  await o.close?.();
  assert.ok(!holds.invalid && holds.size > 0, `one-hand holds blend and draw in Chrome: ${J(holds)}`);
  assert.ok(Math.abs(SZ[0] / SZ[1] - 1) < 0.15, `same stature, same width on screen: ${J(SZ)}`);
}

// 19. a shot by name (engine/cartoon/shot.js): two people walk, one holds a prop with a tag, a hand-over, then a close shot of the
//     waist-up person in the same world. The body gate is clean at 30 fps, the prop stays on a hand, the close frame never shows the
//     waist-up body's end, and every mistake in a plan comes back in one message.
{
  const ali = { gender: "male", age: "adult", skin: 4, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" } };
  const bina = { gender: "female", age: "adult", skin: 3, hair: { style: "long", color: "black" }, outfit: { type: "salwar", color: "#2f8f83" } };
  const plan = `{ ground: "#efd9b4",
    cast: { ali: { at: [-1.2, 2], view: "side", facing: 1, hold: { R: "box" } }, bina: { at: [1, 2], view: "side", facing: -1 } },
    props: { box: { part: "${"schoolBagHeld"}", color: "#333", text: "ALI" } },
    acts: { ali: [{ at: 0, do: "walk", to: [-0.35, 2], by: 1.4, say: true }, { at: 1.4, do: "stand", give: { what: "box", to: "bina", by: 2.4 } }, { at: 2.8, do: "stand", feel: "happy" }],
            bina: [{ at: 0, do: "idle", look: "ali" }, { at: 3, do: "stand", feel: "surprised", say: true }] },
    camera: [{ at: 0, on: ["ali", "bina"], size: "full" }, { at: 3, on: "bina", size: "closeUp" }] }`;
  const good = `const W = ZC.world(root); window.__S = ZC.shot(W, tl, s, d, words, ${plan});`;
  const bad = `const W = ZC.world(root); try { ZC.shot(W, tl, s, d, words, { cast: { ali: { at: [0, 1] }, nobody: {} }, props: { x: { part: "noSuchPart" } }, acts: { ali: [{ at: 0, do: "flyAway" }] }, camera: [{ at: 0, on: "ali", size: "medium", to: "closeUp" }] }); } catch (e) { window.__E = e.message; } ZC.clock(tl, s, d, () => {});`;
  const hf = job("byname", [good, bad], 4.5, `ZF.cast = ${J({ ali, bina })};\n`);
  const g = await checkBody(hf, { fps: 30, row: 0 }); assert.ok(g.ok, g.lines.join("\n"));
  const o = await openPage(hf);
  const at = async (t) => { await showAt(o.page, t); return o.page.evaluate(() => { const S = window.__S, b = S.props.box.thing.g.getBoundingClientRect(), shown = b.width > 2 && S.props.box.thing.g.getAttribute("display") !== "none";
    const w = window.__waist || {}, cu = Object.entries(w).find(([k]) => /cu/.test(k))?.[1]; return { shown, box: [b.left, b.top, b.right, b.bottom], cu: cu ? cu.bottom > cu.frameBottom : null, E: window.__E }; }); };
  const a = await at(0.7), b = await at(3.6); await showAt(o.page, 5.5); const E = await o.page.evaluate(() => window.__E); await o.close?.();
  assert.ok(a.shown, "the prop is drawn while carried"); assert.equal(b.cu, true, "the close frame cuts the waist-up body above its end");
  for (const want of ["nobody", "noSuchPart", "flyAway", "two shots"]) assert.ok(E && E.includes(want), `one message names every mistake (${want}): ${E}`);
}

console.log("ok: set pieces, ready actions, hand-over, reach, film kit, kept parts, prompts, mouths, screen sides, the lower body, the world scale, acting, the camera, hands that reach people, every mouth, bodies that hold close up the library on the waist-up person and the screens kit");
