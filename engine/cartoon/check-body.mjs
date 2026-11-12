// The body gate: opens a composed 2D film (edit/hf) in real Chrome, plays every frame and fails on any broken rule.
//   H01–H21 on every full body (ZANATOMY.check on the pose and clothes really drawn), R1–R7 on every waist-up person's arms and
//   hands (R8–R10 hold by construction in rig.js / hands.js), H13 a body jumping between frames, CRASH a scene that failed to run.
// No AI. Run alone:  node engine/cartoon/check-body.mjs <job>/edit/hf [from to]   (exit 1 = rules broken, the lines say where)
// Inside the local pipeline: compose and `zen finish` (the render never starts on a fail).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openPage } from "../readcheck.mjs";

function runFrames({ from, to, fps }) {
  const plan = JSON.parse(document.getElementById("hf-plan").textContent), tl = window.__timelines.main, faults = [], seen = new Set();
  const rowOf = (t) => (plan.scenes || []).find((x) => t >= x.s && t < x.e)?.row ?? null;
  const kOf = (t) => (plan.scenes || []).find((x) => t >= x.s && t < x.e)?.k ?? null;
  const here = (w, t) => w.k == null || kOf(t) == null || w.k === kOf(t); // drawn in the scene that is on screen at t
  const fault = (t, who, rule, msg) => faults.push({ t: Math.round(t * 100) / 100, row: rowOf(t), who, rule, msg });
  for (const e of window.__sceneErrors || []) faults.push({ t: 0, row: e.row, who: "scene", rule: "CRASH", msg: e.message });
  const R = { minElbow: 30, maxWrist: 45, jump: 70, reachSlack: 6 }, dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const end = to ?? (plan.D || tl.duration()), step = 1 / fps;
  let prevRig = null, prevBody = {}, prevRow = null, frames = 0; const reached = {};
  // M1 / M2 / S1: who speaks when (compose writes it for a 2D film) and who is on screen (zc.js records it every frame)
  const spk = (() => { try { return JSON.parse(document.getElementById("hf-speakers")?.textContent || "[]"); } catch { return []; } })();
  const speakerAt = (t) => spk.find((x) => t >= x.s - 0.02 && t <= x.e + 0.02)?.who || null;
  const crowns = {}, armsOut = new Map(), shotRows = new Map(), lowEyes = new Map(), lastMouth = {}, wrongMouth = new Map(), ownMouth = new Map(), sides = {}, folded = new Map();
  for (let t = from; t < end - 1e-6; t += step) {
    window.__anatomy = {}; window.__rig = {}; window.__reach = {}; window.__who = {}; window.__waist = {}; window.__bodies = {}; window.__shots = {}; window.__custom = {};
    try { tl.seek(t, false); } catch (e) { fault(t, "scene", "CRASH", e.message); continue; }
    frames++;
    for (const [k, far] of Object.entries(window.__reach)) { const x = (reached[k] ||= { a: t, b: t, far }); x.b = t; }
    const row = rowOf(t), sameShot = row === prevRow; prevRow = row;
    for (const [id,c] of Object.entries(window.__custom || {})) {
      if (!here(c,t)) continue;
      if (c.dna?.kind !== 'prop') seen.add(id);
      try { window.ZDNA.validate(c.dna); } catch(e) { fault(t,id,'CG1',e.message); }
      if (![c.x,c.floor,c.scale].every(Number.isFinite) || !(c.scale > 0) || Object.values(c.joints || {}).some(p => !Number.isFinite(p.x) || !Number.isFinite(p.y))) fault(t,id,'CG1','custom geometry is not finite');
      if (c.heads !== c.dna?.headCount || c.arms !== c.dna?.armCount) fault(t,id,'CG2','drawn heads/arms do not match the creation DNA');
    }
    for (const [id, entry] of Object.entries(window.__anatomy)) {
      seen.add(id);
      // H05 under 1 U: the engine already bent the pose to reach (the limb is never stretched); a half-centimetre is not a break
      // (scripts/library-check.mjs only warns under 2 U)
      for (const x of window.ZANATOMY.check(entry.pose, entry.drape)) { if (x.rule === "H05" && Number((/([\d.]+) U/.exec(x.msg) || [])[1]) < 1) continue; fault(t, id, x.rule, x.msg); }
      const last = prevBody[id];
      // Same 1200 U/s limit as 40 U at production 30 fps; sparse sampling must not label a normal arm swing a teleport.
      if (last && sameShot) for (const k of window.ZANATOMY.JOINTS) { const a = last[k], b = entry.pose.joints[k]; if (Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z) > 40 * 30 / fps) { fault(t, id, "H13", `${k} jumped between frames: blend the two poses`); break; } }
      if (entry.pose.anchor) { const j = entry.pose.joints, a = entry.pose.anchor, foot = Math.min(...["heelL", "heelR", "toeL", "toeR"].map(k => j[k].y));
        if (Math.hypot(j.pelvis.x - a.root.x, j.pelvis.y - a.root.y, j.pelvis.z - a.root.z) > 0.1 || Math.abs(foot - a.foot_y) > 0.1) fault(t, id, "H25", "an upper-body gesture moved its root or ground contact"); }
      prevBody[id] = entry.pose.joints;
      // A1 (a note): a hand held far out in front of its shoulder (> 35 U, the arm nearly straight at the camera) in a pose that is not
      // reaching, pointing, giving or pushing: the robot-arm look. Natural holding keeps the elbows at the sides
      // Seated, hands on a lap or a table are naturally far in front of the shoulders: only a hand up near shoulder height counts there
      { const J = entry.pose.joints, seated = entry.pose.posture === "sit" || !!window.ZANATOMY.libraryDef?.(entry.pose.posture)?.seat, low = seated ? 20 : 45, high = (s) => J["hand" + s].y > J["shoulder" + s].y - low; // near shoulder height: held out, not resting low
        const out = Math.max(high("L") ? J.handL.z - J.shoulderL.z : 0, high("R") ? J.handR.z - J.shoulderR.z : 0);
        if (out > 35 && !window.ZANATOMY.reaches(entry.pose.posture)) { const k = `${row}|${id}`, x = armsOut.get(k) || { row, id, posture: entry.pose.posture, a: t, b: t, n: 0 }; x.b = t; x.n++; armsOut.set(k, x); } }
    }
    // Z1 / Z2: the world scale. A full body's size must match where its feet are: from the place's horizon and camera height,
    // feet at y mean s px per metre, so a person of m metres is about m × s tall (real height range + hair: ±18%)
    for (const [id, b] of Object.entries(window.__bodies || {})) {
      if (!here(b, t)) continue;
      const v = b.view; seen.add(id);
      if (b.F <= v.horizon + 1) { fault(t, id, "Z2", `stands with the feet at y ${b.F.toFixed(0)}, above the horizon (${v.horizon.toFixed(0)}): standing in the sky`); continue; }
      const key = JSON.stringify(b.spec), A = window.ZANATOMY;
      const crown = (crowns[key] ??= (() => { const ps = A.pose({ posture: "stand", profile: window.ZPEOPLE.biometrics(b.spec).profile || "adult" }); return ps.joints.head.y + A.RADII.head * ps.profile.headScale; })());
      const s = (b.F - v.horizon) / v.camH, m = window.ZW.statureOf(b.spec), k = b.H / ((m * s * 27) / crown);
      if (k < 0.82 || k > 1.18) fault(t, id, "Z1", `is drawn ${k > 1 ? "too big" : "too small"} for where the feet are: ${Math.round(k * 100)}% of a real ${m.toFixed(2)} m person at y ${b.F.toFixed(0)}`);
    }
    // C1–C4: the camera (camera rule book, Brief 9). Per person this frame: the shot size (head height ÷ frame height, the book's
    // ladder) and where the eyes sit in the frame
    { const ladder = [["extremeClose", 0.7], ["closeUp", 0.46], ["mediumClose", 0.323], ["medium", 0.22], ["mediumWide", 0.143], ["full", 0.076], ["wide", 0.027], ["extremeWide", 0]];
      for (const [id, x] of Object.entries(window.__shots || {})) {
        if (!here(x, t) || !x.svg?.__cam) continue;
        const c = x.svg.__cam, f = Math.max(x.box.headPx / c.ch, x.box.headPx / (c.cw * 0.8)) /* a tall frame is judged by its width too (camera.js keeps close sizes wide enough) */, size = ladder.find(([, m]) => f >= m)[0], eyes = (x.box.headY - (c.y - c.ch / 2)) / c.ch;
        if (Math.abs(x.box.x - c.x) > c.cw / 2 || eyes < -0.05 || eyes > 1.05) continue; // not in this frame
        const who = x.box.spec?.name || JSON.stringify(x.box.spec || id); // the same person in another scene is another actor object
        if (f >= 0.4 && x.box.upright && !["sajdah", "ruku"].includes(x.box.posture)) fault(t, id, "C5", `a ${size} shot of a full-body person: close shots use the waist-up person (ZC.person), drawn for that distance`);
        if (["sajdah", "ruku"].includes(x.box.posture) && f >= 0.323) fault(t, id, "C1", `a ${size} shot of someone in ${x.box.posture}: prayer is shown from a respectful distance`);
        const r = (shotRows.get(row) || new Map()); if (!r.has(who)) r.set(who, { id, first: { size, f, view: x.box.view, cw: c.cw }, last: null }); r.get(who).last = { size, f, view: x.box.view, cw: c.cw }; shotRows.set(row, r);
        if (f >= 0.22 && (eyes < 0.12 || eyes > 0.7)) { const k = `${row}|${id}`, q = lowEyes.get(k) || { row, id, a: t, b: t, eyes }; q.b = t; q.eyes = eyes; lowEyes.set(k, q); }
      } }
    const rig = window.__rig;
    for (const [id, arms] of Object.entries(rig)) {
      seen.add(id);
      arms.forEach((a, i) => {
        const who = `${id} arm ${i}`, p = sameShot ? prevRig?.[id]?.[i] : null;
        if (a.source && !["S", "E", "W"].every(j => ["x", "y", "z"].every(k => Number.isFinite(a.source[j]?.[k])))) {
          fault(t, who, "R1", "invalid 3D arm coordinates"); return;
        }
        // an arm with the skeleton's own elbow: a bone may look shorter (it points at the camera), never longer than the arm has
        if (a.given ? dist(a.S, a.E) + dist(a.E, a.W) > (a.up + a.fo) * 1.02 : Math.abs(dist(a.S, a.E) - a.up) > 0.5 || Math.abs(dist(a.E, a.W) - a.fo) > 0.5) fault(t, who, "R1", a.given ? "the arm is longer than its bones" : "bone length changed");
        if (Math.abs(a.rW - a.handW) > 0.6) fault(t, who, "R2", `wrist ${a.rW.toFixed(1)} vs hand ${a.handW.toFixed(1)}`);
        const v1 = [a.S[0] - a.E[0], a.S[1] - a.E[1]], v2 = [a.W[0] - a.E[0], a.W[1] - a.E[1]];
        const el = (Math.acos(Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) || 1)))) * 180) / Math.PI;
        let sourceAngle = null;
        if (a.source) { const u = ["x", "y", "z"].map(k => a.source.S[k] - a.source.E[k]), v = ["x", "y", "z"].map(k => a.source.W[k] - a.source.E[k]); sourceAngle = Math.acos(Math.max(-1, Math.min(1, u.reduce((sum, x, k) => sum + x * v[k], 0) / (Math.hypot(...u) * Math.hypot(...v) || 1)))) * 180 / Math.PI; }
        if (sourceAngle != null ? sourceAngle < R.minElbow - 0.5 : el < R.minElbow - 0.5 && !(a.given && Math.min(Math.hypot(...v1), Math.hypot(...v2)) < 0.55 * a.fo)) fault(t, who, "R3", `elbow bent to ${(sourceAngle ?? el).toFixed(0)}°`); // a 3D gesture uses its measured hinge angle, not its foreshortened picture
        if (Math.abs(a.wrist) > R.maxWrist) fault(t, who, "R4", `wrist ${a.wrist}°`);
        if (p) {
          if (p.source && a.source) {
            for (const joint of ["W", "E"]) { const delta = Math.hypot(...["x", "y", "z"].map(k => a.source[joint][k] - p.source[joint][k])); if (delta > 40 * 30 / fps) fault(t, who, "R5", `${joint === "W" ? "wrist" : "elbow"} jumped ${delta.toFixed(1)} skeleton units`); }
          } else {
            if (dist(p.W, a.W) > R.jump * 30 / fps) fault(t, who, "R5", `wrist jumped ${dist(p.W, a.W).toFixed(0)} px`);
            if (dist(p.E, a.E) > R.jump * 30 / fps) fault(t, who, "R5", `elbow jumped ${dist(p.E, a.E).toFixed(0)} px (flipped?)`);
          }
          if (dist(p.T, a.T) < 0.5 && dist(a.W, a.T) > R.reachSlack) fault(t, who, "R6", `wrist ${dist(a.W, a.T).toFixed(0)} px short of its target`);
        }
        const tip = [a.W[0] + Math.cos(a.ang) * 40, a.W[1] + Math.sin(a.ang) * 40];
        for (const [oid, o] of Object.entries(rig)) { if (oid === id || !o?.[0]) continue; const [hx, hy, hr] = o[0].head; if (dist(tip, [hx, hy]) < hr * 0.9 || dist(a.W, [hx, hy]) < hr * 0.9) fault(t, who, "R7", "hand in another person's face"); }
      });
    }
    // R9 (a note): an arm left folded across the belly with the elbow sticking out (the hand near the body's middle, below the
    // chest, the elbow wider than the shoulder): natural for a hand on the heart or the belly, wrong for an arm that has finished
    for (const [id, arms] of Object.entries(rig)) {
      if (arms.length < 2) continue;
      const mid = (arms[0].S[0] + arms[1].S[0]) / 2, half = Math.abs(arms[0].S[0] - arms[1].S[0]) / 2;
      arms.forEach((a, i) => {
        const side = Math.sign(a.S[0] - mid) || 1, inward = (a.E[0] - a.S[0]) * side, back = (a.W[0] - a.E[0]) * side;
        // R8: a Z-shaped arm seen from the front: the upper arm goes in across the chest, the forearm comes back out. No body does
        // that (a reach across the body keeps going across); the elbow belongs at the side.
        if (inward < -a.up * 0.3 && back > a.up * 0.2 && a.W[1] > a.E[1]) fault(t, `${id} arm ${i}`, "R8", "the upper arm crosses in over the chest and the forearm comes back out (a Z-shaped arm)");
        const inMiddle = Math.abs(a.W[0] - mid) < half * 0.55, low = a.W[1] > a.S[1] + a.up * 0.75, out = Math.abs(a.E[0] - mid) > half + a.up * 0.3;
        if (inMiddle && low && out) { const k = `${row}|${id}|${i}`, x = folded.get(k) || { row, id, i, a: t, b: t, n: 0 }; x.b = t; x.n++; folded.set(k, x); }
      });
    }
    prevRig = JSON.parse(JSON.stringify(rig));
    // W1: a waist-up body (no legs) whose lower edge shows inside the frame: a floating torso, or a shirt stretched to fill it
    for (const [id, w] of Object.entries(window.__waist || {})) {
      if (!here(w, t)) continue;
      if (w.cropped || !(w.right > w.frameLeft && w.left < w.frameRight)) continue;
      if (w.bottom < w.frameBottom - 4) fault(t, id, "W1", "a waist-up body ends inside the frame: its legs are missing");
      else if (w.natural < w.frameBottom - w.frameH * 0.06) fault(t, id, "W1", "the shirt is stretched (longer) down where the legs should show");
    }
    // O1: over the shoulder, the person seen from behind at the frame's edge (nearer the camera) is never smaller than the people they face
    { const seen = Object.values(window.__who || {}).filter((w) => here(w, t) && w.size > 0), backs = seen.filter((w) => w.back), faces = seen.filter((w) => !w.back);
      for (const w of backs) { const big = Math.max(0, ...faces.filter((f) => f.k === w.k).map((f) => f.size)); if (big && w.size < 0.9 * big) fault(t, w.cast + "-back", "O1", `the person seen from behind is ${Math.round((100 * w.size) / big)}% the size of the one facing the camera: nearer must be bigger (ZC.ots)`); } }
    const talking = speakerAt(t);
    for (const [id, w] of Object.entries(window.__who || {}).filter(([, w]) => here(w, t))) {
      const moved = Math.abs(w.mouth - (lastMouth[id] ?? w.mouth)) > 0.08 || w.mouth > 0.3; lastMouth[id] = w.mouth;
      if (row != null) { const r = (sides[row] ||= {}); const c = (r[w.cast] ||= { x: 0, n: 0 }); c.x += w.x; c.n++; }
      if (!talking) continue;
      if (w.cast !== talking && moved) { const k = `${row}|${w.cast}|${talking}`, x = wrongMouth.get(k) || { row, cast: w.cast, talking, a: t, b: t, n: 0 }; x.b = t; x.n++; wrongMouth.set(k, x); }
      if (w.cast === talking && !w.quiet) { const k = `${row}|${w.cast}`, x = ownMouth.get(k) || { row, cast: w.cast, a: t, b: t, n: 0, open: 0 }; x.b = t; x.n++; if (w.mouth > 0.15) x.open++; ownMouth.set(k, x); }
    }
  }
  for (const x of wrongMouth.values()) if (x.n >= 2) faults.push({ t: Math.round(x.a * 100) / 100, row: x.row, who: x.cast, rule: "M1", msg: `${x.cast}'s mouth moves while ${x.talking === "narrator" ? "the narrator" : x.talking} speaks (${x.a.toFixed(2)}–${x.b.toFixed(2)} s)` });
  // M2: a person on screen for their own words must move their mouth. Seen from behind, or marked quiet (a soft shoulder in front of the shot), no mouth shows
  for (const x of ownMouth.values()) if (x.n >= 3 && x.open / x.n < 0.1) faults.push({ t: Math.round(x.a * 100) / 100, row: x.row, who: x.cast, rule: "M2", msg: `${x.cast} is on screen for their own words (${x.a.toFixed(2)}–${x.b.toFixed(2)} s) but their mouth does not move (open in ${x.open} of ${x.n} frames)` });
  const talkNotes = [];
  // S1: two cast members swap sides of the screen between one shot and the next (a cut that crosses the line)
  const rowsSeen = Object.keys(sides).map(Number).sort((a, b) => a - b), sideNotes = [];
  for (let i = 1; i < rowsSeen.length; i++) {
    const A = sides[rowsSeen[i - 1]], B = sides[rowsSeen[i]], both = Object.keys(A).filter((c) => B[c]);
    for (let a = 0; a < both.length; a++) for (let b = a + 1; b < both.length; b++) {
      const [p, q] = [both[a], both[b]], was = Math.sign(A[p].x / A[p].n - A[q].x / A[q].n), now = Math.sign(B[p].x / B[p].n - B[q].x / B[q].n);
      if (was && now && was !== now) sideNotes.push(`S1 scene ${rowsSeen[i] + 1}: ${p} and ${q} swap sides of the screen after the cut from scene ${rowsSeen[i - 1] + 1} (${was < 0 ? p : q} was on the left). Keep screen direction unless the cut is meant to cross the line.`);
    }
  }
  const notes = Object.entries(reached).map(([k, x]) => `${k}: its target was ${x.far ? "beyond" : "inside"} the arm's reach from ${x.a.toFixed(2)} to ${x.b.toFixed(2)} s, so the hand stopped at the nearest point it can reach. If it must touch something, move the person or the thing.`);
  const armNotes = [...folded.values()].filter((x) => x.n >= Math.max(2, fps * 0.8)).map((x) => `R9 ${x.id} arm ${x.i}: folded across the body with the elbow out from ${x.a.toFixed(2)} to ${x.b.toFixed(2)} s. If the arm has finished its job, lower it to rest (hands: "rest") in one arc; keep it only for a hand on the heart or the belly that the action asks for.`);
  // C2 jump cut: the same person, the same size and view on both sides of a cut, the frame barely changed (< 1.25×)
  // C3 more than three close-ups in a row · C4 the eyes of a medium or closer shot outside the frame's safe band for half a second
  const camNotes = [], rowsList = [...shotRows.keys()].filter((r) => r != null).sort((a, b) => a - b); let cuRun = 0;
  rowsList.forEach((r, i) => {
    const now = shotRows.get(r), prev = i ? shotRows.get(rowsList[i - 1]) : null, main = [...now.values()].sort((a, b) => b.first.f - a.first.f)[0];
    if (prev && rowsList[i - 1] === r - 1) for (const [who, x] of now) { const p = prev.get(who)?.last; if (p && p.size === x.first.size && p.view === x.first.view && Math.max(p.cw, x.first.cw) / Math.min(p.cw, x.first.cw) < 1.25) camNotes.push(`C2 scene ${r + 1}: a jump cut on ${x.id} (the same ${p.size}, the same view, the frame barely changed). Change the size at least one step (closeUp → mediumClose → medium…) or the angle.`); }
    cuRun = main && main.first.f >= 0.46 ? cuRun + 1 : 0;
    if (cuRun === 4) camNotes.push(`C3 scene ${r + 1}: the fourth close-up in a row. Open up to a medium or a wide so the place and the others are seen again.`);
  });
  for (const q of lowEyes.values()) if (q.b - q.a >= 0.5) camNotes.push(`C4 scene ${q.row + 1}: ${q.id}'s eyes sit at ${Math.round(q.eyes * 100)}% of the frame height from ${q.a.toFixed(2)} to ${q.b.toFixed(2)} s (keep them in 15–65%: ZC.frame(W, b, size) places them).`);
  const outNotes = [...armsOut.values()].filter((x) => x.b - x.a >= 0.5).map((x) => `A1 ${x.id}: both or one arm held straight out in front ("${x.posture}") from ${x.a.toFixed(2)} to ${x.b.toFixed(2)} s, the robot-arm look. Holding something: elbows at the sides, forearms in toward the belly (ZC.hold()); reaching or giving: use an action that reaches, then bring the arm back to rest.`);
  return { faults, frames, people: seen.size, notes: [...notes, ...talkNotes, ...sideNotes, ...armNotes, ...outNotes, ...camNotes] };
}

// what to do about a broken rule, said once per rule and scene: the designer fixes it from the message, with no rule book open
const FIX = {
  H13: "same person, one shot: go from pose to pose with b.blend(a, c, u), or b.arrive / b.rise; a new camera on the same person does not excuse a jump.",
  R3: "the hand target is too close to the shoulder: move it away from the body.",
  R4: "the hand bends too far at the wrist: use another hand pose or move the target.",
  R5: "the hand or elbow jumps: move wrist targets with ZC.keys and keep one `bend` side through the shot.",
  R6: "the target is out of the arm's reach: move the person or the object closer.",
  R7: "this hand is in the other person's face: move the people apart or lower the target.",
  H02: "do not move head joints by hand: use trim headYaw, headPitch, headRoll.",
  H16: "a joint goes past its limit: reduce the trim; to look further round, turn the whole body (view, facing).",
  H18: "something goes through the floor or seat: use the named pose, and floor = the place's ground.",
  CRASH: "the scene's code failed on that frame: read the message; a person must be drawn before handAt.",
  R8: "keep the elbow at the side: give the arm a `bend` that puts the elbow outward (bend: [1 or -1, …] for that arm) or move the hand target out from the body; an arm at rest uses hands: \"rest\".",
  C5: "from medium-close in, draw the waist-up person (ZC.person) at the same place: the full body is drawn for distance, close up its neck, sleeves and head do not hold.",
  C1: "in prayer (sajdah, ruku) keep the camera at a medium-wide or wider, at eye level or a little high, never in front of the person within 2 m: ZC.frame(W, b, \"full\").",
  Z1: "place people with Z.person(spec, { x, dz }) and pieces with Z.put(id, layer, { x, dz }) (engine/cartoon/world.js): sizes come from metres and depth, never by eye; to make someone look bigger, bring them nearer (a smaller dz), not larger.",
  Z2: "put the person on the ground: Z.person(spec, { x, dz }) gives the floor line at that depth (feet always below the horizon).",
  W1: "the frame shows this person below the waist, so use the full body (ZC.actor, any size, with legs, trousers and shoes on the floor); keep the waist-up person only for a close shot whose frame cuts at the chest or waist (move the camera in or the person down), never fill the gap with `longer`.",
  O1: "over the shoulder: the person seen from behind is nearer, so the same size or bigger than the people they face. Use ZC.ots(layer, { spec, of: r, side }).",
  M2: "a person on screen for their own words must lip-sync: drive mouth with ZC.mouth(t + s, their words). words holds only this scene's words, so pick them by each word's i, never by position.",
  M1: "only the speaker's mouth moves: drive mouth with ZC.mouth(t, words) for the speaker alone; a listener keeps mouth 0 and reacts with the face and body.",
};

/** { ok, frames, people, faults: [{ t, row, who, rule, msg }], lines: one line per rule and person with its time span, notes: what the engine corrected by itself } */
// row: judge only that scene (the range may start a little earlier, in the scene before, so a cut into it is seen: S1)
export async function checkBody(hfDir, { from = 0, to = null, fps = 30, row = null } = {}) {
  if (!(Number.isFinite(fps) && fps > 0)) throw new Error('Body gate fps must be a positive finite number.');
  const o = await openPage(hfDir).catch((e) => { throw new Error(`The page did not open: ${e.message}`); });
  if (!o) throw new Error("The body gate needs Chrome and a composed page, and found neither.");
  try {
    const r = await o.page.evaluate(runFrames, { from, to, fps });
    if (row != null) { r.faults = r.faults.filter((f) => f.row === row); r.notes = r.notes.filter((n) => !/^S1 scene \d+:/.test(n) || n.startsWith(`S1 scene ${row + 1}:`)); }
    const groups = new Map();
    for (const f of r.faults) { const k = `${f.row}|${f.who}|${f.rule}|${f.msg.replace(/[\d.]+/g, "#")}`, g = groups.get(k) || { ...f, to: f.t, n: 0 }; g.to = f.t; g.n++; groups.set(k, g); }
    const told = new Set();
    const lines = [...groups.values()].map((g) => { const k = `${g.row}|${g.rule}`, hint = FIX[g.rule] && !told.has(k) ? ` Fix: ${FIX[g.rule]}` : ""; told.add(k); return `${g.t.toFixed(2)}–${g.to.toFixed(2)} s${g.row != null ? ` (scene ${g.row + 1})` : ""} ${g.who} ${g.rule}: ${g.msg}${g.n > 1 ? ` (${g.n} frames)` : ""}${hint}`; });
    return { ok: !r.faults.length, frames: r.frames, people: r.people, faults: r.faults, lines, notes: r.notes };
  } finally { await o.close?.(); }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [dir, from, to] = process.argv.slice(2);
  if (!dir) { console.error("usage: node engine/cartoon/check-body.mjs <job>/edit/hf [from to]"); process.exit(2); }
  const hf = dir.endsWith(".html") ? path.dirname(dir) : dir;
  if (!fs.existsSync(path.join(hf, "index.html"))) { console.error(`no page in ${hf}`); process.exit(2); }
  try {
    const r = await checkBody(hf, { from: Number(from) || 0, to: to != null ? Number(to) : null });
    for (const l of r.lines) console.log(`✗ ${l}`);
    console.log(r.ok ? `✓ every frame keeps the body rules (${r.frames} frames, ${r.people} people)` : `\n${r.faults.length} rule breaks in ${r.frames} frames`);
    process.exit(r.ok ? 0 : 1);
  } catch (e) { console.error(`✗ ${e.message}`); process.exit(1); }
}
