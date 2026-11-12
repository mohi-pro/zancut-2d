// 2D body regression (no AI). Everything goes through the real route: compose.mjs → the page → the gate in real Chrome.
// All generated files live in the OS temp directory; no story or customer project is needed.
// Run after changing anything in engine/cartoon/:  node scripts/cartoon-test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { checkBody } from "../engine/cartoon/check-body.mjs";
import { openPage, showAt } from "../engine/readcheck.mjs";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

// 0. measured proportions (no browser): every gender × age × build, as people.js builds it from bodies.js, drawn on the real skeleton,
//    must keep the body chart's cartoon ranges (engine/cartoon/library/body-chart.json): no puffy child, no bodybuilder arms, a woman's
//    frame is not a man's. Front-view widths from the capsule radii × each part's thickness, over the drawn stature (the crown).
{
  for (const f of ["hands.js", "anatomy.js", "people.js", "bodies.js"]) await import(path.join(root, "engine/cartoon", f));
  const A = globalThis.ZANATOMY, P = globalThis.ZPEOPLE, B = globalThis.ZBODIES, R = A.RADII, bad = [];
  assert.ok(B?.rows, "engine/cartoon/bodies.js is missing: run node scripts/build-bodies.mjs");
  const ageSpec = { toddler: ["child", 2.5], child6: ["child", 6], child9: ["child", 9], child12: ["child", 12], teen: ["teen", 15], adult: ["adult", 30], elder: ["elderly", 72] };
  const thinWords = { thin: "thin", average: "average", heavy: "heavy" };
  for (const id of Object.keys(B.rows)) for (const build of Object.keys(thinWords)) {
    const [gender, row] = id.split("."), [age, years] = ageSpec[row], prof = P.biometrics({ gender, age, years, build }).profile;
    const ps = A.pose({ posture: "neutral", profile: prof }), J = ps.joints, q = ps.profile, crown = J.head.y + R.head * q.headScale;
    const half = (a, b) => (Math.abs(J[a].x) + Math.abs(J[b].x)) / 2;
    const got = {
      "headHeight/stature": (2 * R.head * q.headScale) / crown,
      "upperArmWidth/stature": ((R.upperArm[0] + R.upperArm[1]) * q.armThick) / crown,
      "shoulderWidth/stature": (2 * (half("shoulderL", "shoulderR") + R.upperArm[0] * q.armThick)) / crown,
      "hipWidth/stature": (2 * (half("hipL", "hipR") + R.thigh[0] * q.legThick)) / crown,
    };
    got["upperArmWidth/thighWidth"] = ((R.upperArm[0] + R.upperArm[1]) * q.armThick) / (2 * R.thigh[0] * q.legThick);
    for (const [k, v] of Object.entries(got)) {
      const r = B.ranges[id]?.[k]; if (!r) continue;
      // builds widen or narrow the ranges the chart gives for the average body: 15% of room either way for thin and heavy
      const slack = build === "average" ? 0.02 : 0.15, lo = r[0] * (1 - slack), hi = r[1] * (1 + slack);
      if (v < lo || v > hi) bad.push(`${id} ${build}: ${k} ${v.toFixed(3)} outside ${lo.toFixed(3)}–${hi.toFixed(3)}`);
    }
    if (gender === "female" && row === "adult" && build === "average") {
      const man = P.biometrics({ gender: "male", age: "adult", build }).profile;
      if (!(q.armThick < man.armThick && q.shoulderWidth < man.shoulderWidth)) bad.push("a woman's arms and shoulders are not slimmer than a man's");
    }
  }
  assert.deepEqual(bad, [], `body proportions outside the chart:\n${bad.join("\n")}`);
  console.log(`✓ measured proportions: ${Object.keys(B.rows).length} rows × 3 builds inside the body chart's cartoon ranges`);
  // a man with long hair reads as a man at phone size: hair to the jaw (not a woman's fall to the back) and stubble when beardless
  { const man = P.look({ gender: "male", age: "adult", hair: { style: "long" }, outfit: { type: "punjabi" } }), woman = P.look({ gender: "female", age: "adult", hair: { style: "long" }, outfit: { type: "salwar" } });
    const low = (d) => Math.max(...String(d || "").match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, k) => k % 2));
    assert.ok(low(man.hairBehind) <= 130 && low(woman.hairBehind) >= 250, `long hair: a man's ends at the jaw (${low(man.hairBehind)}), a woman's falls (${low(woman.hairBehind)})`);
    assert.ok(man.stubble && !woman.stubble && man.hairLen < 1 && (woman.hairLen ?? 1) === 1, "a beardless long-haired man gets stubble and short side hair; a woman keeps hers");
    assert.ok(!P.look({ gender: "male", age: "adult", hair: { style: "long" }, extras: ["beard"] }).stubble, "a beard is not covered by stubble"); }
  // a king reads as a king: a crown on top (front, the waist-up person, side and back views) and the royal coat in deep red and gold
  { const k = P.look({ gender: "male", age: "adult", hair: { style: "side" }, outfit: { type: "royal" }, extras: ["crown"] });
    assert.ok(k.crown && k.overHead.length >= 4, "the crown is drawn on the head"); assert.ok(!P.look({ gender: "male", age: "adult" }).crown, "no crown unless asked"); }
  console.log("✓ a long-haired man reads as a man (jaw-length hair, stubble when beardless)");
}
const out = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-cartoon-"));
const SPECS = {
  king: { gender: "male", age: "adult", skin: 2, hair: { style: "long", color: "brown" }, outfit: { type: "royal" }, extras: ["crown", "moustache"] },
  boy: { gender: "male", age: "child", skin: 3, hair: { style: "crop", color: "black" }, outfit: { type: "tshirt", color: "#e0862b" } },
  girl: { gender: "female", age: "child", skin: 4, hair: { style: "long", color: "black" }, outfit: { type: "salwar", color: "#d9558a", accent: "#ffd166" } },
  lady: { gender: "female", age: "adult", skin: 3, hair: { style: "bob", color: "dark" }, outfit: { type: "salwar", color: "#2f8f83", accent: "#f2c14e" } },
  hijabi: { gender: "female", age: "teen", skin: 2, build: "slim", hair: { style: "hijab", color: "#6d4aa8" }, outfit: { type: "abaya", color: "#3a3556" } },
  man: { gender: "male", age: "adult", skin: 5, build: "stocky", hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#2f6fb0" }, extras: ["stubble"] },
  heavy: { gender: "male", age: "adult", skin: 6, build: "heavy", hair: { style: "bald" }, outfit: { type: "kurta", color: "#7a5230" } },
  dada: { gender: "male", age: "elderly", skin: 4, build: "thin", hair: { style: "cap", color: "white" }, outfit: { type: "punjabi", color: "#efe9da" }, extras: ["beard", "glasses"] },
  nanu: { gender: "female", age: "elderly", skin: 4, hair: { style: "bun", color: "white" }, outfit: { type: "saree", color: "#b0344a", accent: "#f4d58d" } },
};
// a real job folder: compose.mjs turns scenes (what a designer writes) into the page the render uses
function job(name, canvas, scenes, { captions = false } = {}) {
  const d = path.join(out, name); for (const x of ["cut", "edit/graphics", "work"]) fs.mkdirSync(path.join(d, x), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-v", "error", "-f", "lavfi", "-i", `color=c=0x222222:s=${canvas}:r=30`, "-f", "lavfi", "-i", "anullsrc=r=48000", "-t", String(scenes.length), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(d, "cut/cut.mp4")]);
  fs.writeFileSync(path.join(d, "job.json"), "{}");
  fs.writeFileSync(path.join(d, "cut/transcript.json"), JSON.stringify(scenes.map((_, i) => ({ text: `w${i}`, start: i, end: i + 0.95 }))));
  const plan = scenes.map((js, i) => { const f = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(d, f), `<script>\nZK.unit(root);\n${js}\n</script>`); return { row: i, uid: `s${i}`, startWord: i, endWord: i, kind: "graphic", mode: "full-broll-takeover", file: f, transition: "cut", ...(captions ? {} : { captions: "hide" }), cues: [] }; });
  fs.writeFileSync(path.join(d, "edit/plan.json"), JSON.stringify({ version: 2, canvas, kind: "faceless", style: "2d-animation", theme: "light", tokens: {}, captions: { on: captions }, atoms: fs.readFileSync(path.join(root, "skills/2d-animation/atoms.css"), "utf8"), scenes: plan }));
  execFileSync(process.execPath, [path.join(root, "engine/compose/compose.mjs"), d], { stdio: "pipe" });
  return path.join(d, "edit/hf");
}
const start = (id = "man") => `const W = ZC.world(root), ppl = W.layer("p"); const b = ZC.actor(ppl, { spec: ${JSON.stringify(SPECS[id])}, H: 60, x: 400, floor: W.h * 0.8, view: "side" });`;
const moving = (expr) => `${start()} ZC.clock(tl, s, d, (t) => { b.draw(${expr}, {}); W.cam(W.w / 2, W.h / 2, W.w); });`;

// the skeleton, rules, limits and drawing: every person × every posture × every view, in real Chrome
function bodyRules(R) {
  const A = window.ZANATOMY, P = window.ZPEOPLE, bad = [], VIEWS = ["front", "three", "side", "back"];
  for (const [id, spec] of Object.entries(R.SPECS)) {
    const bio = P.biometrics(spec), look = P.look(spec);
    for (const posture of A.REF_POSTURES) for (const phase of [0, 45, 90, 135, 180, 225, 270, 315]) {
      const ps = A.pose({ posture, phase, profile: bio.profile }), dr = A.drape(ps, bio.garment, bio.cloth);
      for (const f of A.check(ps, dr)) bad.push(`${id}/${posture}/${phase}: ${f.rule} ${f.msg}`);
    }
    for (const posture of A.REF_POSTURES) for (const view of VIEWS) {
      // H02 on the real drawing: the head's picture touches the neck's in every view
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg"); svg.setAttribute("width", 800); svg.setAttribute("height", 900); svg.style.cssText = "position:fixed;left:0;top:0;z-index:99"; document.body.appendChild(svg);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("transform", "translate(400 800)"); svg.appendChild(g);
      window.ZBODY.draw(g, { view, pose: { posture, phase: 35, profile: bio.profile }, H: 60, look, spec });
      if (/NaN|undefined/.test(g.innerHTML)) bad.push(`${id}/${posture}/${view}: invalid drawing`);
      const head = g.querySelector('[data-part="head"]'), neck = g.querySelector('[data-part="neck"]');
      if (!head || !neck) bad.push(`${id}/${posture}/${view}: head or neck not drawn`);
      else { const A2 = head.getBoundingClientRect(), B2 = neck.getBoundingClientRect(); if (A2.right < B2.left || B2.right < A2.left || A2.bottom < B2.top || B2.bottom < A2.top) bad.push(`${id}/${posture}/${view}: H02 the drawn head does not touch the drawn neck`); }
      // the owner's rules: the neck is always behind the head, has no outline, and every person wears shoes
      // the owner's look: no outline on any body part (only soft fold lines marked data-detail); hands from the one hand library
      for (const part of g.querySelectorAll('[data-part="torso"],[data-part="sleeve"],[data-part="leg"],[data-part="arm"],[data-part="hand"],[data-part="shoe"],[data-part="apron"],[data-part="bag"]'))
        for (const e of part.querySelectorAll("[stroke]")) if (!e.hasAttribute("data-detail") && e.getAttribute("stroke") !== "none") { bad.push(`${id}/${posture}/${view}: ${part.getAttribute("data-part")} has an outline`); break; }
      if (g.querySelectorAll('[data-part="hand"]').length !== 2) bad.push(`${id}/${posture}/${view}: hands not drawn from the hand library`);
      const pp = A.pose({ posture, phase: 35, profile: bio.profile }).handPoses;
      for (const h of g.querySelectorAll('[data-part="hand"]')) if (!h.querySelector("path")) bad.push(`${id}/${posture}/${view}: an empty hand`);
      if (posture === "point" && !g.querySelector('[data-pose="point"]')) bad.push(`${id}/${posture}/${view}: pointing without the hand's own finger`);
      if (head && neck) { if (!(neck.compareDocumentPosition(head) & Node.DOCUMENT_POSITION_FOLLOWING)) bad.push(`${id}/${posture}/${view}: the neck is drawn over the head`); if (neck.querySelector('[stroke]')) bad.push(`${id}/${posture}/${view}: the neck has an outline`); }
      if (!["sleep", "ruku", "sajdah"].includes(posture)) {
        const shoes = [...g.querySelectorAll('[data-part="shoe"]')], legs = [...g.querySelectorAll('[data-part="leg"]')];
        if (shoes.length !== 2) bad.push(`${id}/${posture}/${view}: ${shoes.length} shoes`);
        // the shoe rule: no skin between the hem and the shoe, and each shoe's mouth is inside a trouser hem
        if (g.querySelector('[data-part="ankle"]')) bad.push(`${id}/${posture}/${view}: skin shows at the shoe`);
        if (view === "side" && ["sari", "abaya"].includes(bio.garment) && g.querySelector('[data-part="hem"]')) bad.push(`${id}/${posture}/${view}: a coloured hem beside the shoe reads as the foot`);
        for (const sh of shoes) { const r = sh.getBoundingClientRect(), inHem = legs.some((l) => { const q = l.getBoundingClientRect(); return r.left < q.right && q.left < r.right && r.top < q.bottom && q.top < r.bottom; }); if (!inHem) bad.push(`${id}/${posture}/${view}: a shoe does not meet its trouser hem`); if (legs.length && !(legs.every((l) => sh.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING) || legs.some((l) => sh.compareDocumentPosition(l) & Node.DOCUMENT_POSITION_FOLLOWING))) bad.push(`${id}/${posture}/${view}: the shoe is over its hem`); }
      }
      svg.remove();
    }
  }
  // the ear: short hair shows the near ear in a turned head (far ear away), never hides the near one; a hijab shows none
  const drawn = (spec, view, o = {}) => { const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"); s.setAttribute("width", 800); s.setAttribute("height", 900); s.style.cssText = "position:fixed;left:0;top:0"; document.body.appendChild(s); const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); g.setAttribute("transform", "translate(400 800)"); s.appendChild(g); window.ZBODY.draw(g, { view, posture: "stand", H: 60, look: P.look(spec), spec, ...o }); return { g, s }; };
  for (const [id, spec] of Object.entries(R.SPECS)) { const coveredEars = ["hijab", "long", "bob"].includes(spec.hair?.style) || P.look(spec).hairStyle === "long"; if (coveredEars) continue; for (const [view, n] of [["front", 2], ["three", 1], ["side", 1]]) { const d = drawn(spec, view); const ears = d.g.querySelectorAll('[data-part="ear"]').length; if (ears < n) bad.push(`${id}/${view}: ${ears} ears, expected at least ${n}`); d.s.remove(); } }
  { const d = drawn(R.SPECS.hijabi, "side"); if (d.g.querySelector('[data-part="ear"]')) bad.push("hijab: an ear shows"); d.s.remove(); }
  // the shoulder: its top sits below the chin in the standing pose (never a hump beside the head)
  for (const [id, spec] of Object.entries(R.SPECS)) { const d = drawn(spec, "front"), sl = [...d.g.querySelectorAll('[data-part="sleeve"]')].map((e) => e.querySelector("path:not([data-detail])")?.getBoundingClientRect()).filter(Boolean), head = d.g.querySelector('[data-part="head"]').getBoundingClientRect(); for (const b of sl) if (b.top < head.bottom - head.height * 0.3) bad.push(`${id}: the shoulder rises beside the head`); d.s.remove(); }
  // a raised hand comes up in front of the face, so from the side the arm never crosses it
  for (const [id, spec] of Object.entries(R.SPECS)) for (const phase of [0, 90, 180, 270]) { const prof = P.biometrics(spec).profile, ps = A.pose({ posture: "wave", phase, profile: prof, seenSide: true }), j = ps.joints, top = (j.head.z || 0) + A.RADII.head * ps.profile.headScale * 0.7; if (j.wristR.z < top) bad.push(`${id}/wave: the raised forearm crosses the face from the side`);
    const up = A.pose({ posture: "wave", phase, profile: prof }).joints; if (up.handR.y < up.shoulderR.y + 18) bad.push(`${id}/wave: the raised hand stays below the head`); if (Math.abs(up.wristR.x) < Math.abs(up.shoulderR.x)) bad.push(`${id}/wave: the raised hand folds in front of the chest`);
    for (const f of A.pose({ posture: "wave", phase, profile: prof, seenSide: true }).faults) bad.push(`${id}/wave seen from the side: ${f.rule} ${f.msg}`); }
  // the backpack belongs to the person and shows from every side: straps on the chest in front, the bag itself from behind
  for (const [id, spec0] of Object.entries(R.SPECS)) { const bag = { ...spec0, bag: { color: "#2d8fc4" } }; for (const view of ["front", "three", "side", "back"]) { const d = drawn(bag, view); if (/NaN|undefined/.test(d.g.innerHTML)) bad.push(`${id}/bag/${view}: invalid drawing`); if (!d.g.querySelector('[data-part="bag"]')) bad.push(`${id}/bag/${view}: no bag`); if (view !== "back" && !d.g.querySelector('[data-part="bag-strap"]')) bad.push(`${id}/bag/${view}: no strap`); const o = d.g.querySelector('[data-part="bag"]')?.querySelector("[stroke]:not([data-detail])"); if (o) bad.push(`${id}/bag/${view}: outline`); d.s.remove(); }
    // one finger up, for anyone: the hand's own finger, from every view
    const a = window.ZC.fingerUp(); for (const view of ["front", "three", "side", "back"]) { const d = drawn(spec0, view, { posture: a.posture, phase: a.phase, pose: { posture: a.posture, phase: a.phase, handPoses: a.handPoses } }); if (!d.g.querySelector('[data-pose="point"]')) bad.push(`${id}/fingerUp/${view}: not the hand's own finger`); d.s.remove(); }
    // the waist-up person: the same look. No outline on the body, arms, hands, hair or face shape; the near ear, the finger and the bag all there
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"), defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"), l = document.createElementNS("http://www.w3.org/2000/svg", "g"); s.append(defs, l); s.style.cssText = "position:fixed;left:0;top:0"; s.setAttribute("width", 800); s.setAttribute("height", 900); document.body.appendChild(s);
    const r = window.ZC.person(l, { cropped: true, spec: bag, x: 400, y: 200, scale: 0.8 }); r.draw({ hands: "wave", handPoses: ["rest", "point"], turn: 0.3 }, 0.3);
    const lineC = P.look(spec0).line; for (const e of l.querySelectorAll("[stroke]")) if (e.getAttribute("stroke") === lineC || e.getAttribute("stroke") === "#0c0807") { bad.push(`${id}/waist-up: an outline on the body (${e.tagName})`); break; }
    if (spec0.hair?.style !== "hijab" && !l.querySelector('ellipse[rx="16"]')) bad.push(`${id}/waist-up: no ear`);
    s.remove(); }
  // any new character: a wide sweep of what the planner can write (and words it should not), every view and many postures. Nothing may crash, draw invalid numbers or break a body rule
  { const pick = (arr, i) => arr[i % arr.length]; const genders = ["male", "female"], ages = ["child", "teen", "adult", "elderly"], builds = ["slim", "average", "stocky", "heavy", "thin"], hairs = ["crop", "side", "bun", "long", "bob", "bald", "hijab", "cap", "afro"], outfits = ["tshirt", "shirt", "suit", "blazer", "punjabi", "kurta", "sherwani", "thobe", "salwar", "kameez", "saree", "lehenga", "abaya", "burqa", "uniform", "jersey"], colors = ["#efe9da", "#111111", "#d9558a", "#2f6fb0", "red"], extras = [[], ["glasses"], ["beard"], ["moustache", "stubble"], ["earrings", "bindi", "bangles"], ["mole", "freckles", "wrinkles"]];
    const svgS = document.createElementNS("http://www.w3.org/2000/svg", "svg"); document.body.appendChild(svgS);
    for (let i = 0; i < 160; i++) { const spec = { gender: pick(genders, i), age: pick(ages, i * 3 + (i >> 2)), skin: 1 + (i % 8), build: pick(builds, i * 7), hair: { style: pick(hairs, i * 5), color: pick(["black", "grey", "white", "#6d3bb0"], i) }, outfit: { type: pick(outfits, i), color: pick(colors, i * 11) }, extras: pick(extras, i), ...(i % 3 === 0 ? { bag: { color: "#2d8fc4" } } : {}) }, name = JSON.stringify(spec);
      const look = P.look(spec), bio = P.biometrics(spec);
      for (const posture of ["stand", "walk", "run", "sit", "wave", "cheer", "squat"]) { const ps = A.pose({ posture, phase: (i * 37) % 360, profile: bio.profile, seenSide: i % 2 === 0 }), dr = A.drape(ps, bio.garment, bio.cloth); for (const f of A.check(ps, dr)) bad.push(`sweep ${posture}: ${f.rule} ${f.msg} ${name}`);
        for (const view of ["front", "three", "side", "back"]) { const g = document.createElementNS("http://www.w3.org/2000/svg", "g"); svgS.appendChild(g); try { window.ZBODY.draw(g, { view, pose: ps, H: 60, look, spec }); if (/NaN|undefined|null/.test(g.innerHTML)) bad.push(`sweep ${posture}/${view}: invalid drawing ${name}`); for (const e of g.querySelectorAll('[data-part="torso"] [stroke],[data-part="apron"] [stroke],[data-part="leg"] [stroke]')) if (!e.hasAttribute("data-detail")) { bad.push(`sweep ${posture}/${view}: an outline ${name}`); break; } } catch (e) { bad.push(`sweep ${posture}/${view}: crash ${e.message} ${name}`); } g.remove(); } }
      try { const r = window.ZC.person(svgS, { cropped: true, spec, x: 400, y: 200, scale: 0.8 }); r.draw({ hands: "wave", handPoses: ["rest", "point"], face: "happy" }, 0.3); } catch (e) { bad.push(`sweep waist-up: crash ${e.message} ${name}`); } }
    svgS.remove(); }
  // the one-cloth rule: a long garment is one shape, wider than any leg at the hips, and no hip shows outside it, in every view
  for (const [id, spec] of Object.entries(R.SPECS)) { const garment = P.biometrics(spec).garment; if (!["sari", "abaya", "kameez", "punjabi"].includes(garment)) continue;
    for (const view of ["front", "three", "side", "back"]) for (const posture of ["stand", "walk"]) { const ps = A.pose({ posture, phase: 90, profile: P.biometrics(spec).profile }), d = drawn(spec, view, { pose: ps }), ap = d.g.querySelectorAll('[data-part="apron"]'); if (ap.length !== 1) bad.push(`${id}/${posture}/${view}: ${ap.length} pieces of cloth`); else { const cloth = ap[0].querySelector("path").getBoundingClientRect(); for (const l of d.g.querySelectorAll('[data-part="leg"]')) { const q = l.getBoundingClientRect(), top = q.top + Math.min(8, q.height * 0.12); if (posture === "stand" && top < cloth.bottom && (q.left < cloth.left - 3 || q.right > cloth.right + 3) && top < cloth.top + cloth.height * 0.3) bad.push(`${id}/${posture}/${view}: a hip shows outside the cloth`); } } d.s.remove(); } }
  // a woman's waist-up body has a waist; it is never a straight tube
  if (P.look({ gender: "female", age: "adult" }).torso === P.look({ gender: "male", age: "adult" }).torso || !/ C/.test(P.look({ gender: "female", age: "adult" }).torso.split("L40")[1].split("L")[0])) bad.push("the waist-up woman has no waist");
  // the waist-up body is the full body's own clothes: never a flared gown (no wider at the bottom than at the shoulders; a woman's hips
  // up to 5 % more), a short top ends at the hip with the trousers below it, a long garment stays one piece; a cup sits in one hand
  for (const [id, spec] of Object.entries({ ...R.SPECS, tee: { gender: "male", age: "adult", outfit: { type: "tshirt" } }, suit: { gender: "male", age: "adult", outfit: { type: "suit" } }, teeF: { gender: "female", age: "adult", outfit: { type: "tshirt" } } })) {
    const lk = P.look(spec), xs = String(lk.torso).match(/-?\d+(?:\.\d+)?/g).map(Number).filter((_, k) => k % 2 === 0), shX = Math.abs(xs[0]), widest = Math.max(...xs.map(Math.abs));
    if (widest > shX * 1.05 + 1) bad.push(`${id}/waist-up: the torso flares to ${Math.round((widest / shX) * 100)} % of the shoulders (a gown)`);
    const shortTop = ["tshirt", "shirt", "suit", "blazer", "coat"].includes(String(spec.outfit?.type || "")); if (shortTop !== !!lk.pantsD) bad.push(`${id}/waist-up: ${shortTop ? "a short top without trousers below its hem" : "a long garment cut by trousers"}`);
    const s = document.createElementNS("http://www.w3.org/2000/svg", "svg"), defs = document.createElementNS("http://www.w3.org/2000/svg", "defs"), l = document.createElementNS("http://www.w3.org/2000/svg", "g"); s.append(defs, l); s.style.cssText = "position:fixed;left:0;top:0"; s.setAttribute("width", 800); s.setAttribute("height", 900); document.body.appendChild(s);
    const r = window.ZC.person(l, { cropped: true, spec, x: 400, y: 200, scale: 0.8 }), shY = r.shoulders[1][1];
    if (r.holdsWith("cup") !== 1 || r.holdsWith("hold") != null) bad.push(`${id}/waist-up: a one-hand hold does not name its hand`);
    r.draw({ hands: "cup" }, 0); const cup = r.handAt(1), rest = r.handAt(0); r.draw({ hands: "sip" }, 0); const sip = r.handAt(1);
    if (!(cup.y > shY && cup.y < rest.y - 20)) bad.push(`${id}/waist-up: the cup is not held at the chest`);
    if (!(sip.y < shY && sip.y > r.head[1])) bad.push(`${id}/waist-up: a sip does not bring the hand to the mouth`);
    s.remove(); }
  const trim = (t) => A.pose({ posture: "stand", trim: t });
  const limits = { yaw: trim({ headYaw: 180 }).head.yaw, pitch: trim({ headPitch: 90 }).head.pitch, roll: trim({ headRoll: 90 }).head.roll, flagged: trim({ headYaw: 180 }).faults.some((f) => f.rule === "H16") };
  const stretched = A.pose({ posture: "stand" }); stretched.joints.head = { ...stretched.joints.head, y: stretched.joints.head.y + 40 };
  const sit = A.pose({ posture: "sit" });
  const hijab = P.look(R.SPECS.hijabi), hSvg = document.createElementNS("http://www.w3.org/2000/svg", "g");
  window.ZBODY.draw(hSvg, { view: "front", pose: { posture: "stand" }, H: 60, look: hijab, spec: R.SPECS.hijabi });
  return { bad, limits, stretchedCaught: A.check(stretched).some((f) => f.rule === "H02"),
    boxCaught: A.check(sit, A.drape(sit, "punjabi", { staticBox: true }, { staticBox: true })).some((f) => /H19|H20/.test(f.rule)),
    heads: A.headsTall("adult"), postures: A.REF_POSTURES,
    garments: Object.fromEntries(["kurta", "panjabi", "salwar", "kameez", "saree", "sherwani", "thobe", "suit", "abaya"].map((t) => [t, P.biometrics({ outfit: { type: t } }).garment])),
    chairAlone: A.pose({ posture: "sit" }).props, table: A.pose({ posture: "sit", props: ["chair_table"] }).props,
    slimDiffers: JSON.stringify(P.biometrics({ build: "slim", gender: "male" }).profile) !== JSON.stringify(P.biometrics({ gender: "male" }).profile),
    hijabDrawn: hSvg.innerHTML.includes(R.SPECS.hijabi.hair.color), actor: typeof window.ZC.actor, transition: typeof A.transition };
}

try {
  const good = job("good", "1080x1920", [moving("ZC.walk(t / 1.1)"), moving("ZC.run(t / 0.55)"), moving("ZC.sit()"),
    `const W = ZC.world(root), ppl = W.layer("p"); const r = ZC.person(ppl, { cropped: true, spec: ${JSON.stringify(SPECS.lady)}, x: 540, y: 800, scale: 1.3, longer: 400 }); ZC.clock(tl, s, d, (t) => { r.draw({ face: "happy", hands: "chest" }, t); });`,
    `const W = ZC.world(root), far = W.layer("f"); const c = ZC.crowd(far, { n: 6, rows: 2, x0: 0, x1: W.w, floor: 1200, H: 26, mode: "cheer", seed: 3 }); ZC.clock(tl, s, d, (t) => c.draw(t));`]);
  // the customer's route for the owner's picture rules: every person with a bag and one finger up, as a designer writes it, through compose and the gate
  const everyone = job("everyone", "1080x1920", Object.values(SPECS).map((spec) => `const W = ZC.world(root), ppl = W.layer("p"), sp = ${JSON.stringify({ ...spec, bag: { color: "#2d8fc4" } })}; const b = ZC.actor(ppl, { spec: sp, H: 60, x: 300, floor: W.h * 0.8, view: "three" }), r = ZC.person(ppl, { cropped: true, spec: sp, x: 760, y: 700, scale: 1, longer: 300 }); ZC.clock(tl, s, d, (t) => { b.draw(ZC.fingerUp(), { face: "happy" }); r.draw({ hands: "wave", handPoses: ["rest", "point"], face: "happy" }, t); });`));
  // captions in a 2D film: they show, in the lower part of the frame, and never on a head
  { const hf = job("captions", "1080x1920", [`const W = ZC.world(root), ppl = W.layer("p"), r = ZC.person(ppl, { cropped: true, spec: ${JSON.stringify(SPECS.lady)}, x: 540, y: 620, scale: 1.4, longer: 500 }); ZC.clock(tl, s, d, (t) => { r.draw({ face: "happy", hands: "rest" }, t); });`], { captions: true });
    const o = await openPage(hf); await showAt(o.page, 0.4);
    const cap = await o.page.evaluate(() => { const c = document.querySelector(".cap"); if (!c) return null; const b = c.getBoundingClientRect(), h = document.documentElement.getBoundingClientRect().height || innerHeight; const inner = getComputedStyle(c.querySelector(".cap-inner")); return { top: b.top, h, shown: getComputedStyle(c).visibility !== "hidden", pill: inner.backgroundColor, ink: inner.color }; });
    if (process.env.CARTOON_TEST_SHOT) await o.page.screenshot({ path: process.env.CARTOON_TEST_SHOT, type: "jpeg" });
    await o.close?.();
    assert.ok(cap, "a 2D film with captions on shows no captions");
    assert.ok(cap.pill !== "rgba(0, 0, 0, 0)" && cap.ink === "rgb(255, 255, 255)", `2D captions must stay readable on any picture: ${cap.pill} / ${cap.ink}`);
    assert.ok(cap.top / cap.h > 0.62, `the 2D caption sits too high (${Math.round((cap.top / cap.h) * 100)}%): it can cover a face`); }
  const E = await checkBody(everyone);
  assert.ok(E.ok, `bag and raised finger broke the gate:\n${E.lines.join("\n")}`);
  // the gate on a good film: real frames, real scenes (ZK.unit runs), every person counted
  const G = await checkBody(good);
  assert.ok(G.ok, `the gate failed a good film:\n${G.lines.join("\n")}`);
  assert.ok(G.frames >= 140 && G.people >= 13, `the gate did not see the film: ${G.frames} frames, ${G.people} people`);
  // the frame: a plain seek (the checkers' and the stills') shows the real moment, not frame 0
  const o = await openPage(good);
  try {
    const frameAt = async (t) => { await showAt(o.page, t); return o.page.evaluate(() => document.querySelector("#b0 svg").innerHTML); };
    assert.notEqual(await frameAt(0.1), await frameAt(0.7), "the checkers are frozen on one frame");
    const r = await o.page.evaluate(bodyRules, { SPECS });
    assert.deepEqual(r.bad, [], r.bad.slice(0, 12).join("\n"));
    assert.deepEqual(r.limits, { yaw: 75, pitch: 50, roll: 30, flagged: true });
    assert.ok(r.stretchedCaught, "a head pulled off its neck was not caught (H02)");
    assert.ok(r.boxCaught, "a static box dress was not caught");
    assert.ok(r.heads >= 7 && r.heads <= 8, /* 7–8 heads: the neck is the body chart's real length */ `an adult is ${r.heads} heads tall`);
    for (const x of ["reach", "wave", "point", "clap", "cheer", "hold", "jump"]) assert.ok(r.postures.includes(x), x);
    assert.equal(r.garments.suit, "shirt_pant"); assert.equal(r.garments.saree, "sari"); assert.equal(r.garments.kameez, "kameez"); assert.equal(r.garments.abaya, "abaya"); assert.equal(r.garments.kurta, "punjabi");
    assert.deepEqual(r.chairAlone, ["chair"]); assert.deepEqual(r.table, ["chair_table"]);
    assert.ok(r.slimDiffers, "slim has no effect"); assert.ok(r.hijabDrawn, "the full body lost the hijab");
    assert.equal(r.actor, "function"); assert.equal(r.transition, "function");
  } finally { await o.close(); }
  // Actual screen contacts, not just skeleton-space joints: moving arms must never recenter the body. Random seeks must
  // reproduce the same SVG in both rigs, including automatic blinks/breathing and gesture entry/exit.
  {
    const browser = await openPage(good);
    try {
      const result = await browser.page.evaluate(spec => {
        const host = document.createElement("div"); host.style.cssText = "position:relative;width:1920px;height:1080px"; document.body.appendChild(host);
        const W = ZC.world(host), layer = W.layer("test"), b = ZC.actor(layer, { spec, H: 60, x: 700, floor: 900, view: "three" });
        const c = ZC.person(W.layer("close"), { spec, x: 1300, y: 350, scale: 0.7, cropped: true });
        const contact = [], shots = {};
        function draw(t) {
          b.draw(b.gesture("both_hands_up", t, { start: 0.18, duration: 2 }), { t });
          c.draw({ ...c.gesture("both_hands_up", t, { start: 0.18, duration: 2 }) }, t);
          // Full-body sleeve clips get fresh unique ids on each draw. Compare the same geometry and references with
          // locally canonical names, rather than treating a different (invisible) id counter as a changed frame.
          const ids = new Map(); return W.svg.innerHTML.replace(/\bzb\d+/g, id => { if (!ids.has(id)) ids.set(id, `zb${ids.size}`); return ids.get(id); });
        }
        for (let f = 0; f < 90; f++) { const t = f / 30, svg = draw(t); contact.push(["pelvis", "toeL", "toeR", "heelL", "heelR"].map(k => b.jointAt(k))); if ([0, 6, 30, 60, 66, 89].includes(f)) shots[t] = svg; }
        const seeks = Object.keys(shots).reverse().map(t => { const actual = draw(Number(t)), expected = shots[t]; if (actual === expected) return null;
          let i = 0; while (actual[i] === expected[i] && i < actual.length) i++; return { t, at: i, actual: actual.slice(i - 60, i + 100), expected: expected.slice(i - 60, i + 100) }; });
        const first = contact[0], max = Math.max(...contact.flatMap(frame => frame.map((p, i) => Math.hypot(p.x - first[i].x, p.y - first[i].y))));
        host.remove(); return { max, seeks };
      }, SPECS.man);
      assert.ok(result.max < 0.01, `standing pelvis/feet drifted ${result.max} screen pixels`);
      assert.ok(result.seeks.every(x => x === null), `alive motion or gesture rendering depends on previous seek history: ${JSON.stringify(result.seeks.filter(Boolean))}`);
      console.log("✓ standing screen contacts stay fixed; both gesture rigs reproduce identical frames after random seeks");
    } finally { await browser.close(); }
  }
  // deliberately broken films must FAIL the gate
  const expect = async (name, js, rule) => { const g = await checkBody(job(name, "1080x1920", [js])); assert.ok(!g.ok && g.faults.some((f) => f.rule === rule), `${name} should break ${rule}: ${JSON.stringify(g.lines)}`); };
  await expect("head-off", `${start()} ZC.clock(tl, s, d, () => { const p = b.pose("stand", 35); p.joints.head = { ...p.joints.head, y: p.joints.head.y + 40 }; b.draw(p, {}); });`, "H02");
  await expect("spin", moving(`{ posture: "stand", phase: 35, trim: { headYaw: 180 } }`), "H16");
  await expect("crash", `${start()} ZC.nothing();`, "CRASH");
  await expect("crash-frame", `${start()} ZC.clock(tl, s, d, (t) => { if (t > 0.2) nothing(); b.draw(ZC.stand(), {}); });`, "CRASH");
  await expect("snap", `${start()} ZC.clock(tl, s, d, (t) => b.draw(t < 0.5 ? ZC.stand() : ZC.sajdah(), {}));`, "H13");
  // the frame the customer picked
  const wide = job("wide", "1920x1080", [`const W = ZC.world(root); window.__w = [W.w, W.h]; ZC.clock(tl, s, d, () => W.cam(W.w / 2, W.h / 2, W.w));`]), w = await openPage(wide);
  try { assert.deepEqual(await w.page.evaluate(() => window.__w), [1920, 1080], "the world is not the video's frame"); } finally { await w.close(); }
  console.log(`✓ every person, posture and view; ${G.frames} real frames through the gate; broken bodies caught`);
  console.log("cartoon test passed");
} catch (e) {
  console.log(e.stdout?.toString() || "", e.message);
  console.log("cartoon test FAILED");
  process.exitCode = 1;
} finally {
  fs.rmSync(out, { recursive: true, force: true });
}
