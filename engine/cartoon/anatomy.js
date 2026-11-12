// ZanHuman BASE ANATOMY: the one unisex skeleton every character is built on, its proportions (biometrics), joint
// limits and breaking points, the orthographic views (front, side, back, 3/4) and the garment drape over it.
// Authority: skills/2d-animation/human-anatomy-rigging.md, sections 16–23 (rules H14–H21). Change the rules there first.
// Reference: "Universal Human & Articulated Cloth Rigging Engine v3.0" (key poses, radii, profiles, cloth zones). Its numbers
// are copied verbatim into REF below; the engine adds fixed bone lengths, joint limits and contact so no pose can stretch a
// limb, spin a head or push cloth through a leg.
//
// Space (engine space): units U, floor at Y = 0, +Y up, +Z = the way the body faces, +X = the CHARACTER'S LEFT.
// The reference stored its data mirrored (its "L" joints at −X); REF keeps those numbers and toEngine() flips X once.
// One skeleton, many 2D views: every view is an orthographic projection of the same joints (no replacement bodies).
//
//   ZANATOMY.pose({ posture, phase, profile, trim })        → { joints, lengths, profile, head, props, supports, faults }
//   ZANATOMY.drape(pose, garment, cloth)                    → { front[5], back[5], pallu[4] } garment control chains
//   ZANATOMY.check(pose, drape?)                            → [{ rule, msg }]  (empty = every base rule kept)
//   ZANATOMY.project(point, view, opts) / ZANATOMY.svg(pose, { view, garment, drape })  → 2D
(function (root) {
  "use strict";

  // ───────────────────────────── vectors ─────────────────────────────
  const P = (x, y, z) => ({ x, y, z });
  const add = (a, b) => P(a.x + b.x, a.y + b.y, a.z + b.z);
  const sub = (a, b) => P(a.x - b.x, a.y - b.y, a.z - b.z);
  const mul = (a, s) => P(a.x * s, a.y * s, a.z * s);
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const cross = (a, b) => P(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
  const len = (a) => Math.hypot(a.x, a.y, a.z);
  const norm = (a, fb) => { const l = len(a); return l > 1e-9 ? mul(a, 1 / l) : (fb || P(0, 0, 1)); };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  const lerp3 = (a, b, t) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t), lerp(a.z, b.z, t));
  const rad = (d) => (d * Math.PI) / 180;
  const deg = (r) => (r * 180) / Math.PI;
  const angle = (a, b) => deg(Math.acos(clamp(dot(norm(a), norm(b)), -1, 1)));
  const perp = (a, axis) => sub(a, mul(axis, dot(a, axis))); // the part of a at right angles to a unit axis
  function rotX(p, d) { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return P(p.x, p.y * c - p.z * s, p.y * s + p.z * c); }
  function rotY(p, d) { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return P(p.x * c + p.z * s, p.y, -p.x * s + p.z * c); }
  function rotZ(p, d) { const c = Math.cos(rad(d)), s = Math.sin(rad(d)); return P(p.x * c - p.y * s, p.x * s + p.y * c, p.z); }
  const copy = (j) => Object.fromEntries(Object.entries(j).map(([k, p]) => [k, P(p.x, p.y, p.z)]));

  // ───────────────────────────── H14 · the hierarchy ─────────────────────────────
  // Insertion order is the solve order (parents first). foot = the ball of the foot.
  const PARENT = { pelvis: null, lumbar: "pelvis", thorax: "lumbar", neckBase: "thorax", neckTop: "neckBase", head: "neckTop" };
  for (const s of ["L", "R"]) Object.assign(PARENT, {
    ["shoulder" + s]: "thorax", ["elbow" + s]: "shoulder" + s, ["wrist" + s]: "elbow" + s, ["hand" + s]: "wrist" + s,
    ["hip" + s]: "pelvis", ["knee" + s]: "hip" + s, ["ankle" + s]: "knee" + s, ["heel" + s]: "ankle" + s,
    ["foot" + s]: "ankle" + s, ["toe" + s]: "foot" + s,
  });
  const JOINTS = Object.keys(PARENT);
  const UPPER = ["lumbar", "thorax", "neckBase", "neckTop", "head", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "handL", "handR"];
  const LEG_BELOW_HIP = (s) => ["knee" + s, "ankle" + s, "heel" + s, "foot" + s, "toe" + s];

  // ───────────────────────────── REF · reference v3.0 data (verbatim, reference space) ─────────────────────────────
  // The unisex adult stands 183 U to the crown (head centre 169.5 + head radius 13.5); the neck is the body chart's length, never longer.
  const REF_POSTURES = ["stand", "walk", "run", "sit", "squat", "ruku", "sajdah", "sleep", "wave", "point", "reach", "clap", "cheer", "hold", "jump"];
  const ARM_POSTURES = new Set(["wave", "point", "reach", "clap", "cheer", "hold", "jump"]);

  // ─────────── the action library (engine/cartoon/library.js, built from library/actions/*.json; docs/2d-library) ───────────
  // A library posture is key poses of all 26 joints in this reference space (adult, 189.5 U, floor Y = 0, +Z = facing, the
  // character's left at −X); the pose pipeline then scales it to the person, fits every bone to its fixed length (an authored
  // length is never trusted), plants the feet and checks it. A gesture is arm keys relative to the shoulder, laid on any posture.
  const LIB = {}, GESTURES = {}, HAND_NAMES = new Set(["rest", "open", "point", "fist", "pencil", "phone"]);
  const v3 = (a, what) => { if (!Array.isArray(a) || a.length !== 3 || !a.every(Number.isFinite)) throw new Error(`ZANATOMY library: ${what} must be [x, y, z] numbers`); return P(a[0], a[1], a[2]); };
  const keysOf = (def, check) => {
    if (!Array.isArray(def.keys) || def.keys.length < 1) throw new Error(`ZANATOMY library "${def.id}": keys missing`);
    const keys = def.keys.map((k, i) => { const u = Number(k.u); if (!(u >= 0 && u <= 1)) throw new Error(`ZANATOMY library "${def.id}": key ${i} u must be 0…1`); return { ...k, u, ...check(k, i) }; }).sort((a, b) => a.u - b.u);
    for (const k of keys) for (const h of k.hands || []) if (!HAND_NAMES.has(h) && !root.HANDS?.POSES?.[h]) throw new Error(`ZANATOMY library "${def.id}": unknown hand "${h}" (known: ${[...HAND_NAMES].join(", ")})`);
    return keys;
  };
  function addPosture(def) {
    if (!def || !/^[a-z][a-z0-9_]*$/.test(def.id || "")) throw new Error("ZANATOMY library: an action needs an id in snake_case");
    if (REF_POSTURES.includes(def.id)) throw new Error(`ZANATOMY library: "${def.id}" is a built-in posture`);
    for (const p of def.props || []) if (!PROPS[p]) throw new Error(`ZANATOMY library "${def.id}": unknown prop "${p}" (known: ${Object.keys(PROPS).join(", ")})`);
    const keys = keysOf(def, (k, i) => ({ j: Object.fromEntries(JOINTS.map((n) => [n, v3(k.joints?.[n], `"${def.id}" key ${i} joint ${n}`)])), fwd: k.headForward ? v3(k.headForward, "headForward") : null }));
    LIB[def.id] = { ...def, keys };
    return def.id;
  }
  function addGesture(def) {
    if (!def || !/^[a-z][a-z0-9_]*$/.test(def.id || "")) throw new Error("ZANATOMY library: a gesture needs an id in snake_case");
    const keys = keysOf(def, (k, i) => ({ arms: Object.fromEntries(Object.entries(k.arms || {}).map(([s, a]) => {
      if (s !== "L" && s !== "R") throw new Error(`ZANATOMY library "${def.id}": arms are "L" and "R"`);
      return [s, Object.fromEntries(["elbow", "wrist", "hand"].map((q) => [q, v3(a[q], `"${def.id}" key ${i} ${s}.${q}`)]))];
    })) }));
    GESTURES[def.id] = { ...def, keys };
    return def.id;
  }
  // the two keys around u and how far between them (a loop wraps from the last key to the first)
  function around(keys, u, loop) {
    if (keys.length === 1) return [keys[0], keys[0], 0];
    let i = keys.findIndex((k) => k.u > u);
    if (i === 0) return loop ? [keys.at(-1), keys[0], (u + 1 - keys.at(-1).u) / Math.max(1e-6, keys[0].u + 1 - keys.at(-1).u)] : [keys[0], keys[0], 0];
    if (i < 0) return loop ? [keys.at(-1), keys[0], (u - keys.at(-1).u) / Math.max(1e-6, keys[0].u + 1 - keys.at(-1).u)] : [keys.at(-1), keys.at(-1), 0];
    const a = keys[i - 1], b = keys[i];
    return [a, b, (u - a.u) / Math.max(1e-6, b.u - a.u)];
  }
  const uOf = (def, phaseDeg) => (def.loop ? ((((phaseDeg % 360) + 360) % 360) / 360) : clamp(phaseDeg / 360, 0, 1));
  const easeOf = (def, t) => (def.loop || def.ease === "linear" ? t : t * t * (3 - 2 * t));
  function libPose(def, phaseDeg, want) {
    const [a, b, t0] = around(def.keys, uOf(def, phaseDeg), def.loop), t = easeOf(def, t0), j = {};
    for (const n of JOINTS) j[n] = lerp3(a.j[n], b.j[n], t);
    const fwd = a.fwd || b.fwd ? norm(lerp3(a.fwd || P(0, 0, 1), b.fwd || P(0, 0, 1), t)) : P(0, 0, 1);
    return { j, headForward: fwd, props: Array.isArray(want) && want.length ? want : (def.props || []).slice(), handPoses: (t < 0.5 ? a : b).hands || def.hands || ["rest", "rest"] };
  }
  // a gesture on a posture: each arm it moves is placed from that side's shoulder, so the same wave works standing, sitting or walking
  function layGesture(r, g) {
    const def = GESTURES[g?.id];
    if (!def) throw new Error(`ZANATOMY: unknown gesture "${g?.id}" (known: ${Object.keys(GESTURES).join(", ") || "none yet"})`);
    const [a, b, t0] = around(def.keys, uOf(def, Number(g.phase ?? 0)), def.loop), t = easeOf(def, t0), flip = !!g.mirror;
    for (const s of ["L", "R"]) {
      const from = flip ? (s === "L" ? "R" : "L") : s, A = a.arms[from], B = b.arms[from];
      if (!A || !B) continue;
      const sh = r.j["shoulder" + s], q = flip ? -1 : 1;
      for (const k of ["elbow", "wrist", "hand"]) { const o = lerp3(A[k], B[k], t); r.j[k + s] = add(sh, P(o.x * q, o.y, o.z)); }
    }
    const hp = (t < 0.5 ? a : b).hands || def.hands;
    if (hp) r.handPoses = flip ? [hp[1], hp[0]] : hp.slice();
    return r;
  }

  function refPose(posture, phaseDeg, sx, want, seenSide = false) {
    if (LIB[posture]) return libPose(LIB[posture], phaseDeg, want);
    const ph = rad(phaseDeg), s = Math.sin(ph), c = Math.cos(ph);
    let j, fwd = P(0, 0, 1), props = [];
    if (ARM_POSTURES.has(posture)) { // standing actions: the stand's body, the arms (and for a jump the legs) authored here; fit() keeps every bone
      j = copy(refPose("stand", phaseDeg, sx).j);
      const arm = (side, e, w, h) => { const q = side === "L" ? -1 : 1; j["elbow" + side] = P(q * e[0], e[1], e[2]); j["wrist" + side] = P(q * w[0], w[1], w[2]); j["hand" + side] = P(q * h[0], h[1], h[2]); };
      const both = (e, w, h) => { arm("L", e, w, h); arm("R", e, w, h); };
      let handPoses = ["rest", "rest"];
      if (posture === "wave") { // a raised hand: up beside the head; seen from the side it comes forward instead, so the arm never crosses the face
        if (seenSide) arm("R", [42, 124, 24], [47 + s * 2, 143, 40], [48 + s * 3, 155, 43]); else arm("R", [45, 139, 8], [51 + s * 3, 165, 13], [52 + s * 4, 177, 15]); handPoses = ["rest", "open"]; }
      else if (posture === "point") { arm("R", [27, 130, 24], [28, 128, 54], [28, 127, 66]); handPoses = ["rest", "point"]; }
      else if (posture === "reach") { arm("R", [26, 150, 26], [26, 158, 54], [26, 160, 66]); handPoses = ["rest", "open"]; }
      else if (posture === "clap") { const a = 3 + Math.abs(s) * 9; both([30, 120, 16], [a + 2, 128, 40], [a, 131, 51]); handPoses = ["open", "open"]; }
      else if (posture === "cheer") { both([36, 168, 2], [30, 196 + s * 4, 4], [29, 208 + s * 4, 4]); handPoses = ["fist", "fist"]; }
      else if (posture === "hold") { both([25, 114, 0], [13, 98, 22], [10, 94, 30]); handPoses = ["fist", "fist"]; } // H24: elbows at the sides, forearms in toward the belly, never arms out at the camera
      else { // jump: phase 0…360 = crouch → push → air → land → stand
        const k = ((phaseDeg % 360) + 360) % 360 / 360, air = clamp((k - 0.18) / 0.64, 0, 1), flight = Math.sin(Math.PI * air) * 34;
        const crouch = k < 0.18 ? Math.sin(Math.PI * k / 0.18) : k > 0.82 ? Math.sin(Math.PI * (k - 0.82) / 0.18) : 0, dy = flight - crouch * 16;
        for (const q of ["pelvis", "lumbar", "thorax", "neckBase", "neckTop", "head", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "handL", "handR", "hipL", "hipR"]) j[q].y += dy;
        for (const sd of ["L", "R"]) {
          for (const q of ["ankle", "heel", "foot", "toe"]) j[q + sd].y += flight;
          j["knee" + sd] = P(j["knee" + sd].x, 49 + dy * 0.75, 2 + crouch * 14 + flight * 0.25);
          j["wrist" + sd].y += flight * 0.8; j["wrist" + sd].z += 8; j["hand" + sd].y += flight * 0.8; j["hand" + sd].z += 8;
        }
        handPoses = ["open", "open"];
      }
      return { j, headForward: fwd, props, handPoses };
    }
    if (posture === "neutral") { // the symmetric reference stand: bone rest lengths are measured on it (never drawn as a pose)
      j = {
        pelvis: P(0, 95, 0), lumbar: P(0, 118, 2), thorax: P(0, 146, -1), neckBase: P(0, 148, 0), neckTop: P(0, 155.5, 2), head: P(0, 169.5, 3), // the neck is the body chart's 3.9 % of stature (≈ a third of the head on screen)
        shoulderL: P(-22, 144, -1), shoulderR: P(22, 144, -1), elbowL: P(-25, 112, -3), elbowR: P(25, 112, -3),
        wristL: P(-24, 84, 4), wristR: P(24, 84, 4), handL: P(-23, 72, 6), handR: P(23, 72, 6),
        hipL: P(-12, 92, 0), hipR: P(12, 92, 0), kneeL: P(-12 - sx * 0.5, 49, 2), kneeR: P(12 + sx * 0.5, 49, 2),
        ankleL: P(-12 - sx, 8, -2), ankleR: P(12 + sx, 8, -2), heelL: P(-12 - sx, 3, -7), heelR: P(12 + sx, 3, -7),
        footL: P(-13 - sx, 3, 14), footR: P(13 + sx, 3, 14), toeL: P(-13 - sx, 2, 21), toeR: P(13 + sx, 2, 21),
      };
    } else if (posture === "stand") {
      // H24 the relaxed stand: weight on the right leg (the pelvis shifted over it, the shoulders tilting the other way; the hips stay
      // level so a long garment still covers both knees in every view), the left foot turned a little out, soft elbows that bend forward and in so the hands hang a little in front of the thighs, the
      // two arms never mirror copies. Breathing: phase 0…360 is one breath (shoulders rise, the chest opens); phase 0 = rest.
      const br = s, sh = br * 0.5, ch = br * 0.6;
      j = {
        pelvis: P(1.4, 95, 0), lumbar: P(0.9, 118, 2), thorax: P(0.2, 146, -1 - ch), neckBase: P(0, 148 + sh * 0.6, -ch * 0.5), neckTop: P(-0.2, 162 + sh * 0.6, 2), head: P(-0.4, 176 + sh * 0.6, 3),
        shoulderL: P(-22, 144.6 + sh, -1), shoulderR: P(22, 143.4 + sh, -1),
        elbowL: P(-24.5, 113 + sh, -1.5), elbowR: P(24.5, 112 + sh, -0.8),
        wristL: P(-23.5, 85.5 + sh, 3.5), wristR: P(24, 85 + sh, 5),
        handL: P(-22.5, 74 + sh, 5.5), handR: P(23, 73.5 + sh, 7.5),
        hipL: P(-10.6, 92, 0), hipR: P(13.4, 92, 0), kneeL: P(-12.2 - sx * 0.5, 49, 2), kneeR: P(13.1 + sx * 0.5, 49, 2),
        ankleL: P(-12.5 - sx, 8, -2), ankleR: P(12.5 + sx, 8, -2), heelL: P(-12.5 - sx, 3, -7), heelR: P(12.5 + sx, 3, -7),
        footL: P(-13.8 - sx, 3, 14), footR: P(13.5 + sx, 3, 14), toeL: P(-14.3 - sx, 2, 21), toeR: P(14 + sx, 2, 21),
      };
    } else if (posture === "walk") {
      const bob = Math.abs(s) * 3.5, strideL = s * 26, strideR = -s * 26, liftL = Math.max(0, c) * 8, liftR = Math.max(0, -c) * 8;
      j = {
        pelvis: P(s * 1.5, 93 + bob, 0), lumbar: P(s * 1.0, 116 + bob, 3), thorax: P(0, 144 + bob, 2), neckBase: P(0, 146 + bob, 3),
        neckTop: P(0, 160 + bob, 5), head: P(0, 174 + bob, 6),
        shoulderL: P(-22, 142 + bob, 2 - s * 3), shoulderR: P(22, 142 + bob, 2 + s * 3),
        elbowL: P(-24, 112 + bob, -s * 14 - 2), elbowR: P(24, 112 + bob, s * 14 - 2),
        wristL: P(-23, 88 + bob + Math.max(0, -s) * 6, -s * 24 + 8), wristR: P(23, 88 + bob + Math.max(0, s) * 6, s * 24 + 8),
        handL: P(-22, 78 + bob + Math.max(0, -s) * 6, -s * 28 + 11), handR: P(22, 78 + bob + Math.max(0, s) * 6, s * 28 + 11),
        hipL: P(-12, 90 + bob, s * 2), hipR: P(12, 90 + bob, -s * 2),
        kneeL: P(-12 - sx * 0.5, 48 + liftL * 0.7, strideL * 0.65 + 6), kneeR: P(12 + sx * 0.5, 48 + liftR * 0.7, strideR * 0.65 + 6),
        ankleL: P(-12 - sx, 8 + liftL, strideL), ankleR: P(12 + sx, 8 + liftR, strideR),
        heelL: P(-12 - sx, 3 + liftL + (strideL < -10 ? 6 : 0), strideL - 5), heelR: P(12 + sx, 3 + liftR + (strideR < -10 ? 6 : 0), strideR - 5),
        footL: P(-12 - sx, 3 + liftL * 0.6, strideL + 13), footR: P(12 + sx, 3 + liftR * 0.6, strideR + 13),
        toeL: P(-12 - sx, 2 + liftL * 0.4, strideL + 20), toeR: P(12 + sx, 2 + liftR * 0.4, strideR + 20),
      };
    } else if (posture === "run") {
      const flight = Math.abs(Math.sin(ph * 2)) * 8;
      const leg = (x, f, l) => {
        const drive = f > 0, kz = drive ? f * 34 + 8 : f * 18 - 4, ky = drive ? 48 + f * 22 : 44 + Math.max(0, l) * 10;
        const az = drive ? f * 26 + 2 : f * 32 - 8, curl = !drive ? Math.abs(f) * 34 : Math.max(0, l) * 12, ay = 8 + curl;
        return { knee: P(x, ky + flight * 0.75, kz), ankle: P(x, ay + flight * 0.75, az), heel: P(x, ay + 4 + flight * 0.75, az - 5),
          foot: P(x, Math.max(3, ay - 5 + flight * 0.65), az + 11), toe: P(x, Math.max(2, ay - 7 + flight * 0.65), az + 18) };
      };
      const L = leg(-12 - sx, s, c), R = leg(12 + sx, -s, -c);
      j = {
        pelvis: P(0, 88 + flight, -2), lumbar: P(0, 110 + flight, 5), thorax: P(0, 136 + flight, 13), neckBase: P(0, 138 + flight, 14),
        neckTop: P(0, 152 + flight, 19), head: P(0, 166 + flight, 22),
        shoulderL: P(-22, 134 + flight, 13 - s * 4), shoulderR: P(22, 134 + flight, 13 + s * 4),
        elbowL: P(-25, 104 + flight, 8 - s * 22), elbowR: P(25, 104 + flight, 8 + s * 22),
        wristL: P(-19, 112 + flight - s * 10, 26 - s * 24), wristR: P(19, 112 + flight + s * 10, 26 + s * 24),
        handL: P(-17, 114 + flight - s * 12, 32 - s * 28), handR: P(17, 114 + flight + s * 12, 32 + s * 28),
        hipL: P(-12, 86 + flight, -2), hipR: P(12, 86 + flight, -2),
        kneeL: L.knee, kneeR: R.knee, ankleL: L.ankle, ankleR: R.ankle, heelL: L.heel, heelR: R.heel, footL: L.foot, footR: R.foot, toeL: L.toe, toeR: R.toe,
      };
    } else if (posture === "sit") {
      props = Array.isArray(want) && want.length ? want : ["chair"]; // a chair alone unless the shot asks for a table: ["chair_table"]
      const atTable = props.includes("chair_table");
      j = {
        pelvis: P(0, 50, -14), lumbar: P(0, 74, -14), thorax: P(0, 104, -11), neckBase: P(0, 106, -10), neckTop: P(0, 120, -8), head: P(0, 134, -6),
        shoulderL: P(-22, 102, -11), shoulderR: P(22, 102, -11), elbowL: P(-24, 72, 4), elbowR: P(24, 72, 4),
        wristL: atTable ? P(-16, 71, 30) : P(-17, 61, 22), wristR: atTable ? P(16, 71, 30) : P(17, 61, 22), handL: atTable ? P(-14, 70, 40) : P(-16, 60, 32), handR: atTable ? P(14, 70, 40) : P(16, 60, 32),
        hipL: P(-13, 48, -14), hipR: P(13, 48, -14), kneeL: P(-15 - sx * 0.6, 48, 28), kneeR: P(15 + sx * 0.6, 48, 28),
        ankleL: P(-14 - sx * 0.5, 8, 26), ankleR: P(14 + sx * 0.5, 8, 26), heelL: P(-14 - sx * 0.5, 3, 21), heelR: P(14 + sx * 0.5, 3, 21),
        footL: P(-15 - sx * 0.5, 3, 38), footR: P(15 + sx * 0.5, 3, 38), toeL: P(-15 - sx * 0.5, 2, 45), toeR: P(15 + sx * 0.5, 2, 45),
      };
    } else if (posture === "ruku") {
      fwd = P(0, -1, 0.2);
      j = {
        pelvis: P(0, 92, -18), lumbar: P(0, 93, 10), thorax: P(0, 94, 40), neckBase: P(0, 94, 43), neckTop: P(0, 94, 56), head: P(0, 93, 68),
        shoulderL: P(-22, 92, 38), shoulderR: P(22, 92, 38), elbowL: P(-24, 70, 16), elbowR: P(24, 70, 16),
        wristL: P(-15 - sx * 0.5, 54, -2), wristR: P(15 + sx * 0.5, 54, -2), handL: P(-13 - sx * 0.5, 47, -4), handR: P(13 + sx * 0.5, 47, -4),
        hipL: P(-12, 90, -18), hipR: P(12, 90, -18), kneeL: P(-12 - sx * 0.5, 48, -6), kneeR: P(12 + sx * 0.5, 48, -6),
        ankleL: P(-12 - sx, 8, -10), ankleR: P(12 + sx, 8, -10), heelL: P(-12 - sx, 3, -15), heelR: P(12 + sx, 3, -15),
        footL: P(-12 - sx, 3, 6), footR: P(12 + sx, 3, 6), toeL: P(-12 - sx, 2, 13), toeR: P(12 + sx, 2, 13),
      };
    } else if (posture === "sajdah") {
      fwd = P(0, -1, 0.1);
      j = {
        pelvis: P(0, 52, -24), lumbar: P(0, 54, 4), thorax: P(0, 38, 30), neckBase: P(0, 35, 34), neckTop: P(0, 22, 45), head: P(0, 12, 56),
        shoulderL: P(-20, 35, 30), shoulderR: P(20, 35, 30), elbowL: P(-31, 22, 24), elbowR: P(31, 22, 24),
        wristL: P(-24, 4, 46), wristR: P(24, 4, 46), handL: P(-23, 2, 58), handR: P(23, 2, 58),
        hipL: P(-12, 49, -24), hipR: P(12, 49, -24), kneeL: P(-14 - sx * 0.4, 6, -10), kneeR: P(14 + sx * 0.4, 6, -10),
        ankleL: P(-12 - sx * 0.4, 12, -46), ankleR: P(12 + sx * 0.4, 12, -46), heelL: P(-12 - sx * 0.4, 19, -46), heelR: P(12 + sx * 0.4, 19, -46),
        footL: P(-12 - sx * 0.4, 3, -48), footR: P(12 + sx * 0.4, 3, -48), toeL: P(-12 - sx * 0.4, 2, -40), toeR: P(12 + sx * 0.4, 2, -40),
      };
    } else if (posture === "sleep") {
      fwd = P(0, 1, 0); props = ["pillow"];
      j = {
        head: P(0, 15, -72), neckTop: P(0, 11, -58), neckBase: P(0, 11, -46), thorax: P(0, 12, -38), lumbar: P(0, 10, -12), pelvis: P(0, 11, 14),
        shoulderL: P(-23, 11, -38), shoulderR: P(23, 11, -38), elbowL: P(-28, 7, -10), elbowR: P(28, 7, -10),
        wristL: P(-22, 9, 16), wristR: P(22, 9, 16), handL: P(-17, 12, 26), handR: P(17, 12, 26),
        hipL: P(-12, 11, 14), hipR: P(12, 11, 14), kneeL: P(-13 - sx * 0.4, 10, 54), kneeR: P(13 + sx * 0.4, 10, 54),
        ankleL: P(-12 - sx * 0.4, 7, 90), ankleR: P(12 + sx * 0.4, 7, 90), heelL: P(-12 - sx * 0.4, 3, 92), heelR: P(12 + sx * 0.4, 3, 92),
        footL: P(-13 - sx * 0.4, 17, 94), footR: P(13 + sx * 0.4, 17, 94), toeL: P(-13 - sx * 0.4, 24, 95), toeR: P(13 + sx * 0.4, 24, 95),
      };
    } else if (posture === "squat") {
      j = {
        pelvis: P(0, 24, -16), lumbar: P(0, 44, -8), thorax: P(0, 68, 6), neckBase: P(0, 70, 8), neckTop: P(0, 83, 13), head: P(0, 97, 16),
        shoulderL: P(-22, 66, 6), shoulderR: P(22, 66, 6), elbowL: P(-20, 48, 22), elbowR: P(20, 48, 22),
        wristL: P(-12, 44, 36), wristR: P(12, 44, 36), handL: P(-8, 42, 42), handR: P(8, 42, 42),
        hipL: P(-13, 23, -16), hipR: P(13, 23, -16), kneeL: P(-20 - sx * 0.5, 44, 20), kneeR: P(20 + sx * 0.5, 44, 20),
        ankleL: P(-14 - sx * 0.4, 8, -6), ankleR: P(14 + sx * 0.4, 8, -6), heelL: P(-14 - sx * 0.4, 3, -11), heelR: P(14 + sx * 0.4, 3, -11),
        footL: P(-16 - sx * 0.4, 3, 10), footR: P(16 + sx * 0.4, 3, 10), toeL: P(-17 - sx * 0.4, 2, 17), toeR: P(17 + sx * 0.4, 2, 17),
      };
    } else throw new Error(`ZANATOMY: unknown posture "${posture}" (known: ${[...REF_POSTURES, ...Object.keys(LIB)].join(", ")})`);
    return { j, headForward: fwd, props };
  }
  const toEngine = (p) => P(-p.x, p.y, p.z); // reference space → engine space (+X = character's left)

  // ───────────────────────────── H15 · body profiles (biometrics) ─────────────────────────────
  // Reference multipliers kept exactly. scaleY scales lengths, scaleWidth the lateral spans, headScale the head radius,
  // limbThick every capsule radius, kyphosisDeg the upper-body stoop around the pelvis. shoulderWidth / hipWidth (1 = base)
  // are the engine's unisex build dials: they move the arm or leg roots sideways without changing any bone length.
  const PROFILES = {
    adult:    { label: "Adult",   refLabel: "7.5H ADULT",   scaleY: 1.0,  scaleWidth: 1.0,  headScale: 0.93,  limbThick: 1.0,  kyphosisDeg: 0 },
    child:    { label: "Child",   refLabel: "4.5H CHILD",   scaleY: 0.72, scaleWidth: 0.78, headScale: 1.12, limbThick: 0.86, kyphosisDeg: 0 },
    elderly:  { label: "Elderly", refLabel: "6.8H ELDERLY", scaleY: 0.94, scaleWidth: 0.95, headScale: 0.98, limbThick: 0.90, kyphosisDeg: 14 },
    athletic: { label: "Broad",   refLabel: "8.0H BROAD",   scaleY: 1.05, scaleWidth: 1.18, headScale: 0.93, limbThick: 1.20, kyphosisDeg: 0 },
  };
  // A custom character may move each dial only inside these bounds (outside = not a human proportion; check() reports H15).
  const PROFILE_BOUNDS = {
    scaleY: [0.55, 1.15], scaleWidth: [0.72, 1.3], headScale: [0.85, 1.3], limbThick: [0.4, 1.4], kyphosisDeg: [0, 25],
    shoulderWidth: [0.35, 1.3], hipWidth: [0.35, 1.3], // the measured bodies (bodies.js) move the joints in for children and women
    armThick: [0.4, 1.4], legThick: [0.45, 1.6], chestThick: [0.5, 1.7], waistThick: [0.6, 1.9], pelvisThick: [0.55, 1.7],
  };
  function profileOf(p) {
    const base = typeof p === "string" ? PROFILES[p] : PROFILES[(p && p.base) || "adult"];
    if (!base) throw new Error(`ZANATOMY: unknown profile "${p}" (known: ${Object.keys(PROFILES).join(", ")})`);
    const out = { shoulderWidth: 1, hipWidth: 1, ...base, ...(typeof p === "object" ? p : {}) };
    out.outOfBounds = Object.entries(PROFILE_BOUNDS).filter(([k, [a, b]]) => out[k] < a - 1e-9 || out[k] > b + 1e-9).map(([k]) => k);
    return out;
  }

  // ───────────────────────────── H15 · body shape (capsule radii, U, × limbThick) ─────────────────────────────
  // [radius at first joint, radius at second joint]; torso pieces have a front/back width and a narrower profile depth.
  const RADII = {
    pelvis_lumbar: { front: [15.5, 13.5], profile: [11.5, 10.5] },
    lumbar_thorax: { front: [13.5, 17.5], profile: [10.5, 12.5] },
    clavicle: [9.5, 8.0], pelvis_hip: [10.5, 9.0], neck: [6.0, 5.5],
    upperArm: [7.4, 5.9], forearm: [5.9, 4.3], hand: [4.4, 3.5],
    thigh: [10.0, 7.2], calf: [7.2, 4.7], heel: [4.7, 4.5], foot: [4.7, 4.1], toe: [4.1, 2.9],
    head: 13.5, // × headScale; the neck-to-head hull starts at the neck radius 6.0
  };
  const BODY_CAPSULES = [ // [id, joint a, joint b, radii key]
    ["pelvis_lumbar", "pelvis", "lumbar", "pelvis_lumbar"], ["lumbar_thorax", "lumbar", "thorax", "lumbar_thorax"],
    ["clavicle_L", "thorax", "shoulderL", "clavicle"], ["clavicle_R", "thorax", "shoulderR", "clavicle"],
    ["pelvis_L", "pelvis", "hipL", "pelvis_hip"], ["pelvis_R", "pelvis", "hipR", "pelvis_hip"], ["neck", "neckBase", "neckTop", "neck"],
    ...["L", "R"].flatMap((s) => [
      ["upperArm_" + s, "shoulder" + s, "elbow" + s, "upperArm"], ["forearm_" + s, "elbow" + s, "wrist" + s, "forearm"],
      ["hand_" + s, "wrist" + s, "hand" + s, "hand"], ["thigh_" + s, "hip" + s, "knee" + s, "thigh"], ["calf_" + s, "knee" + s, "ankle" + s, "calf"],
      ["heel_" + s, "ankle" + s, "heel" + s, "heel"], ["foot_" + s, "heel" + s, "foot" + s, "foot"], ["toe_" + s, "foot" + s, "toe" + s, "toe"],
    ]),
  ];

  // ───────────────────────────── H16 · joint ranges and breaking points ─────────────────────────────
  // TRIM = the art-direction dials on top of a key pose (reference slider ranges, clamped; a clamp is reported).
  const TRIM = {
    spinePitch: [-35, 45],  // ° forward lean of the whole upper body about the pelvis (− = lean back)
    headPitch: [-45, 50],   // ° nod about the neck base (reference kept it at 0; engine range = comfortable nod)
    headYaw: [-75, 75],     // ° head turn about the neck base. NEVER more: turning further is a chest + feet turn
    headRoll: [-30, 30],    // ° head tilt toward a shoulder
    armSpread: [-25, 65],   // ° shoulder abduction added to the key pose
    elbowZ: [-60, 60],      // ° elbow flexion added to the key pose (the elbow still may not break backwards)
    stanceWidth: [-6, 20],  // U extra foot spacing per side
    shoulderLift: [-1, 1],  // acting: shoulders up to the ears (+, fear, a shrug) or dropped low (−, sadness, tiredness), ±5 U
    chestLift: [-1, 1],     // acting: chest up and open (+, pride, joy) or caved in (−, sadness, shame), ±8° about the waist
  };
  // ROM = hard anatomical limits measured on the solved skeleton (stylised animation limits, not medical ones).
  const ROM = {
    neckFlexMax: 60,        // ° neck segment vs chest segment (nod / look down / look up)
    headYawHard: 90,        // ° absolute ceiling, even for authored poses: a head never spins past the shoulder line
    spineBendMax: 50,       // ° between the lower (pelvis→lumbar) and upper (lumbar→thorax) spine: no waist kink
    elbowInteriorMin: 30,   // ° fully bent elbow (legacy R3)
    kneeInteriorMin: 20,    // ° deepest squat / sajdah fold
    hipFlexMax: 160,        // ° trunk–thigh fold: thigh vs the lower-spine "down" axis (deep squat + stoop; chest never into thighs)
    hipExtMax: 30,          // ° thigh behind the body (walk / run push-off)
    hipAbdMax: 45,          // ° thigh out to the side
    shoulderExtMax: 60,     // ° upper arm behind the body
    wristBendMax: 45,       // ° legacy R4
    floorClearance: 1.5,    // U the lowest joint centre may sit above the floor (joint centres, not skin)
  };
  // Breaking points: where the body folds and where every garment MUST hinge, crease or separate.
  const BREAKING_POINTS = {
    neck: { joints: ["neckBase", "neckTop"], garment: "collar stays on the neck base; never floats above a turned head" },
    shoulder: { joints: ["shoulderL", "shoulderR"], garment: "yoke seam; sleeve root rotates with the socket" },
    elbow: { joints: ["elbowL", "elbowR"], garment: "sleeve compression crease on the inside of the bend" },
    waist: { joints: ["lumbar"], garment: "belt / tuck line; bodice splits upper chest from lower waist" },
    hipGroin: { joints: ["hipL", "hipR"], garment: "HIP BREAKING POINT: tunic hinges at the groin crease; lap folds when seated" },
    knee: { joints: ["kneeL", "kneeR"], garment: "trouser knee crease; tunic wraps the kneecap then drops by gravity" },
    ankle: { joints: ["ankleL", "ankleR"], garment: "cuff / hem line; never below the floor" },
  };

  // ───────────────────────────── props and supports (world, not scaled) ─────────────────────────────
  const PROPS = {
    chair_table: {
      boxes: [ // [label, centre, half-size, kind]
        ["CHAIR SEAT", P(0, 43, -13), P(21, 2.5, 15), "chair"], ["", P(0, 76, -27), P(20, 30, 2), "chair"],
        ["", P(-18, 20.5, -25), P(1.5, 20.5, 1.5), "leg"], ["", P(18, 20.5, -25), P(1.5, 20.5, 1.5), "leg"],
        ["", P(-18, 20.5, 0), P(1.5, 20.5, 1.5), "leg"], ["", P(18, 20.5, 0), P(1.5, 20.5, 1.5), "leg"],
        ["TABLE / DESK", P(0, 66.5, 48), P(34, 2, 16), "table"], ["", P(-30, 32.5, 58), P(1.8, 32.5, 1.8), "table"], ["", P(30, 32.5, 58), P(1.8, 32.5, 1.8), "table"],
      ],
      supports: [{ id: "seat", top: 45.5, x: [-21, 21], z: [-28, 2], seat: true }, { id: "table", top: 68.5, x: [-34, 34], z: [32, 64] }],
    },
    pillow: { boxes: [["PILLOW", P(0, 4, -72), P(19, 4, 12), "pillow"]], supports: [{ id: "pillow", top: 8, x: [-19, 19], z: [-84, -60] }] },
  };
  PROPS.chair = { boxes: PROPS.chair_table.boxes.filter((b) => b[3] !== "table"), supports: PROPS.chair_table.supports.filter((q) => q.seat) };
  const FLOOR = { id: "floor", top: 0, x: [-Infinity, Infinity], z: [-Infinity, Infinity] };
  const SEAT_HIP_OFFSET = 2.5; // reference: hip joint centre 2.5 U above the seat top
  const CONTACT_FOOT_Y = 8;    // reference rest ankle height; an ankle target at or below this (+1.5) is planted

  // ───────────────────────────── pose pipeline ─────────────────────────────
  function clampTrim(t = {}) {
    const out = {}, clamped = [];
    for (const [k, [a, b]] of Object.entries(TRIM)) {
      const v = Number(t[k] || 0), c = clamp(v, a, b);
      if (c !== v) clamped.push(`${k} ${v} → ${c}`);
      out[k] = c;
    }
    return { trim: out, clamped };
  }
  // the reference steps, in the reference order: key pose → stoop/lean → head → arms → profile scaling → engine space
  function rawPose(posture, phase, prof, trim, want, seenSide, gesture = null) {
    const r0 = refPose(posture, phase, trim.stanceWidth, want, seenSide), r = gesture ? layGesture({ ...r0, j: copy(r0.j) }, gesture) : r0, j = copy(r.j);
    let hf = r.headForward;
    const lean = prof.kyphosisDeg + trim.spinePitch;
    if (Math.abs(lean) > 0.1 && posture !== "sleep") {
      for (const k of UPPER) j[k] = add(j.pelvis, rotX(sub(j[k], j.pelvis), lean));
      hf = rotX(hf, lean);
    }
    // acting dials (acting cards): the chest opens or caves about the waist, the shoulders rise or drop with the whole arm
    if (Math.abs(trim.chestLift || 0) > 0.01) for (const k of ["thorax", "neckBase", "neckTop", "head", "shoulderL", "shoulderR", "elbowL", "elbowR", "wristL", "wristR", "handL", "handR"]) j[k] = add(j.lumbar, rotX(sub(j[k], j.lumbar), -8 * trim.chestLift));
    if (Math.abs(trim.shoulderLift || 0) > 0.01) for (const s of ["L", "R"]) for (const k of ["shoulder" + s, "elbow" + s, "wrist" + s, "hand" + s]) j[k] = add(j[k], P(0, 5 * trim.shoulderLift, 0));
    if (Math.abs(trim.headPitch) > 0.1 || Math.abs(trim.headYaw) > 0.1 || Math.abs(trim.headRoll) > 0.1) {
      for (const k of ["neckTop", "head"]) j[k] = add(j.neckBase, rotY(rotX(rotZ(sub(j[k], j.neckBase), trim.headRoll), trim.headPitch), trim.headYaw));
      hf = rotY(rotX(hf, trim.headPitch), trim.headYaw);
    }
    if (Math.abs(trim.armSpread) > 0.1 || Math.abs(trim.elbowZ) > 0.1) {
      for (const s of ["L", "R"]) {
        const sign = s === "L" ? -1 : 1, sh = j["shoulder" + s];
        for (const k of ["elbow" + s, "wrist" + s, "hand" + s]) j[k] = add(sh, rotZ(sub(j[k], sh), sign * trim.armSpread));
        const el = j["elbow" + s];
        for (const k of ["wrist" + s, "hand" + s]) j[k] = add(el, rotX(sub(j[k], el), -trim.elbowZ));
      }
    }
    for (const k of JOINTS) j[k] = P(j[k].x * prof.scaleWidth, j[k].y * prof.scaleY, j[k].z * prof.scaleY);
    for (const s of ["L", "R"]) { // unisex build dials: move whole limbs sideways, never resize them
      const dSh = j["shoulder" + s].x * (prof.shoulderWidth - 1), dHip = j["hip" + s].x * (prof.hipWidth - 1);
      for (const k of ["shoulder" + s, "elbow" + s, "wrist" + s, "hand" + s]) j[k].x += dSh;
      for (const k of ["hip" + s, ...LEG_BELOW_HIP(s)]) j[k].x += dHip;
    }
    const e = {};
    for (const k of JOINTS) e[k] = toEngine(j[k]);
    return { j: e, headForward: toEngine(hf), props: r.props, handPoses: r.handPoses };
  }
  // H05/H09: rest bone lengths are measured once per profile from the neutral stand and never change afterwards
  const lengthCache = new Map();
  function restLengths(prof) {
    const key = JSON.stringify([prof.scaleY, prof.scaleWidth, prof.shoulderWidth, prof.hipWidth]);
    if (lengthCache.has(key)) return lengthCache.get(key);
    const { j } = rawPose("neutral", 0, { ...prof, kyphosisDeg: 0 }, clampTrim().trim), L = {}; // the symmetric reference stand (H24)
    for (const k of JOINTS) if (PARENT[k]) L[k] = len(sub(j[k], j[PARENT[k]]));
    lengthCache.set(key, L);
    return L;
  }
  // two-bone IK in 3D: root A, target T, pole P (the authored middle joint keeps the bend on its side), bones a, b
  function ik(A, T, Pole, a, b, minInterior = 0) { // minInterior: the hinge never folds tighter than this (elbow, knee)
    const dMin = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(rad(minInterior)));
    const AT = sub(T, A), dRaw = len(AT), d = clamp(dRaw, Math.max(Math.abs(a - b) + 1e-3, dMin), a + b - 1e-3);
    const dir = norm(AT, P(0, -1, 0));
    let pn = perp(sub(Pole, A), dir);
    if (len(pn) < 1e-6) pn = perp(P(0, 0, 1), dir);
    if (len(pn) < 1e-6) pn = perp(P(0, 1, 0), dir);
    pn = norm(pn);
    const ca = clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1), sa = Math.sqrt(1 - ca * ca);
    return { M: add(A, add(mul(dir, a * ca), mul(pn, a * sa))), E: add(A, mul(dir, d)), short: Math.max(0, dRaw - (a + b)) };
  }
  // fit a raw pose to fixed lengths: spine/neck/head/clavicles/feet keep their authored directions, arms and legs
  // reach their authored wrist/ankle targets by IK. An unreachable target is reported (H05), never stretched to.
  function fit(raw, L) {
    const out = {}, reach = [];
    for (const k of JOINTS) {
      if (out[k]) continue;
      const p = PARENT[k];
      if (!p) { out[k] = P(raw[k].x, raw[k].y, raw[k].z); continue; }
      if (/^(elbow|knee)/.test(k)) {
        const s = k.slice(-1), tip = k.startsWith("elbow") ? "wrist" + s : "ankle" + s;
        const r = ik(out[p], raw[tip], raw[k], L[k], L[tip], k.startsWith("elbow") ? ROM.elbowInteriorMin + 0.5 : ROM.kneeInteriorMin + 0.5);
        out[k] = r.M; out[tip] = r.E;
        if (r.short > 0.5) reach.push({ rule: "H05", msg: `${tip} target ${r.short.toFixed(1)} U out of reach (pose revised, limb not stretched)` });
        continue;
      }
      let dir = norm(sub(raw[k], raw[p]));
      if (k === "handL" || k === "handR") {
        const fo = norm(sub(out[p], out["elbow" + k.slice(-1)])), wr = angle(fo, dir);
        for (let i = 0; i < 6 && angle(fo, dir) > ROM.wristBendMax - 1; i++) dir = norm(lerp3(fo, dir, (ROM.wristBendMax - 1) / angle(fo, dir)), fo); // the wrist stays in range, whatever the arm does
      }
      out[k] = add(out[p], mul(dir, L[k]));
    }
    return { joints: out, reach };
  }
  // H18 contact: a planted foot keeps its floor contact; if the stride is too long for fixed legs the pelvis lowers
  function plantFeet(raw, L, prof) {
    const contactY = CONTACT_FOOT_Y * prof.scaleY + 1.5;
    let drop = 0;
    for (const s of ["L", "R"]) {
      const H = raw["hip" + s], T = raw["ankle" + s];
      if (T.y > contactY) continue;
      const reachMax = L["knee" + s] + L["ankle" + s] - 0.05, h = Math.hypot(T.x - H.x, T.z - H.z);
      if (h >= reachMax) continue; // a horizontal miss cannot be fixed by height; fit() reports it
      drop = Math.max(drop, H.y - T.y - Math.sqrt(reachMax * reachMax - h * h));
    }
    if (drop <= 0) return raw;
    const out = copy(raw), keep = new Set([...LEG_BELOW_HIP("L"), ...LEG_BELOW_HIP("R")]);
    for (const k of JOINTS) if (!keep.has(k)) out[k].y -= drop;
    return out;
  }
  function pose(opts = {}) {
    const posture = opts.posture || "stand", phase = Number(opts.phase ?? 35);
    const prof = profileOf(opts.profile || "adult"), { trim, clamped } = clampTrim(opts.trim);
    const raw = rawPose(posture, phase, prof, trim, opts.props, opts.seenSide, opts.gesture || null), L = restLengths(prof);
    const { joints, reach } = fit(plantFeet(raw.j, L, prof), L);
    const supports = [FLOOR, ...raw.props.flatMap((id) => PROPS[id].supports)]; // props: false hides the drawing (the scene draws its own seat); the body still sits
    // root placement on the support: seated pelvis on the seat (a child's feet may then hang), otherwise feet on the floor
    const seat = supports.find((s) => s.seat);
    if (seat) {
      const seatDy = seat.top + SEAT_HIP_OFFSET - (joints.hipL.y + joints.hipR.y) / 2;
      for (const k of JOINTS) joints[k].y += seatDy;
    }
    if (seat) { // a tall person stays on the seat: the shins swing forward until the feet clear the floor, bones unchanged
      for (const sd of ["L", "R"]) {
        const chain = ["ankle", "heel", "foot", "toe"].map((q) => q + sd), low = Math.min(...chain.map((k) => joints[k].y));
        if (low >= 2) continue;
        const K = joints["knee" + sd], shin = L["ankle" + sd], a0 = sub(joints["ankle" + sd], K), now = Math.acos(clamp(-a0.y / shin, -1, 1));
        const swing = deg(Math.acos(clamp(Math.cos(now) - (2 - low) / shin, -1, 1)) - now);
        for (const k of chain) joints[k] = add(K, rotX(sub(joints[k], K), -swing));
      }
    }
    const minY = Math.min(...JOINTS.map((k) => joints[k].y));
    if (minY < 2) for (const k of JOINTS) joints[k].y += 2 - minY;
    const faults = [...reach, ...clamped.map((c) => ({ rule: "H16", msg: `trim clamped to its range: ${c}` })),
      ...prof.outOfBounds.map((k) => ({ rule: "H15", msg: `profile ${k} = ${prof[k]} is outside ${PROFILE_BOUNDS[k].join("…")}` }))];
    const solved = { posture, phase, profile: prof, trim, lengths: L, joints, supports,
      props: opts.props === false ? [] : raw.props,
      head: { forward: norm(raw.headForward), yaw: trim.headYaw, pitch: trim.headPitch, roll: trim.headRoll }, handPoses: opts.handPoses || raw.handPoses || ["rest", "rest"], faults };
    if (!opts.gesture) return solved;
    const base = pose({ ...opts, gesture: null }), weight = clamp(Number(opts.gesture.weight ?? 1), 0, 1);
    if (weight < 1e-9) return anchorGesture(base, base);
    const mixed = weight < 1 ? blend(base, solved, weight, { linear: true }) : solved;
    // Spherical direction blending preserves lengths but can fold an elbow below its hinge limit mid-transition.
    const constrained = weight < 1 ? fit(mixed.joints, L) : null;
    return anchorGesture(constrained ? { ...mixed, joints: constrained.joints, faults: [...mixed.faults, ...constrained.reach] } : mixed, base);
  }

  // H25: upper-body gestures cannot move the root or its supporting leg chain.
  function anchorGesture(ps, base) {
    const joints = copy(ps.joints), delta = sub(base.joints.pelvis, joints.pelvis);
    for (const k of JOINTS) joints[k] = add(joints[k], delta);
    for (const k of ["pelvis", "hipL", "hipR", ...LEG_BELOW_HIP("L"), ...LEG_BELOW_HIP("R")]) joints[k] = { ...base.joints[k] };
    return { ...ps, joints, anchor: { root: { ...base.joints.pelvis }, foot_y: Math.min(...["heelL", "heelR", "toeL", "toeR"].map(k => base.joints[k].y)) } };
  }
  // Stateless six-frame attack/release: a seek never depends on a previous frame.
  function gestureAt(posture, t, { id, start = 0, duration, fade = 6 / 30, amount = 1, ...opts } = {}) {
    const def = GESTURES[id]; if (!def) throw new Error(`ZANATOMY: unknown gesture "${id}"`);
    const seconds = Math.max(1 / 30, Number(duration ?? def.seconds ?? 1.6)), local = t - start;
    const ramp = Math.max(1 / 30, Math.min(fade, seconds / 2)), smooth = u => {
      const v = clamp(u, 0, 1), edge = 0.15; // short eased shoulders, bounded nearly-linear angular speed in the middle
      return v < edge ? v * v / (2 * edge * (1 - edge)) : v > 1 - edge ? 1 - (1 - v) ** 2 / (2 * edge * (1 - edge)) : (v - edge / 2) / (1 - edge);
    };
    const coverage = Math.min(1, seconds / Number(def.seconds || 1.6)) ** 2;
    const weight = smooth(local / ramp) * smooth((seconds - local) / ramp) * coverage * clamp(Number(amount), 0, 1); // amount < 1: the same move, smaller (talking hands)
    // A very short shot may show part of an action, but must not accelerate its authored joints into a snap.
    const phaseSeconds = Math.max(seconds, Number(def.seconds || 1.6));
    return pose({ ...opts, posture, phase: opts.phase ?? ((t / 3.6) % 1) * 360,
      gesture: { id, phase: clamp(local / phaseSeconds, 0, 1) * 360, mirror: opts.mirror, weight } });
  }
  // Small upper-body directions only; fixed bone lengths and foot contacts are retained.
  function alivePose(ps, motion) {
    if (!motion || (!motion.breath && !motion.nod)) return ps;
    // Performance must never repair/hide a malformed authored pose from the body gate.
    if (check(ps).some(f => f.rule !== "H05")) return ps;
    const raw = copy(ps.joints), F = frame(raw), pivot = raw.lumbar;
    const rotate = (v, axis, theta) => add(add(mul(v, Math.cos(theta)), mul(cross(axis, v), Math.sin(theta))), mul(axis, dot(axis, v) * (1 - Math.cos(theta))));
    for (const k of UPPER.filter(k => k !== "lumbar")) raw[k] = add(pivot, rotate(sub(raw[k], pivot), F.left, motion.breath * 0.55));
    for (const side of ["L", "R"]) for (const k of ["shoulder", "elbow", "wrist", "hand"]) raw[k + side] = add(raw[k + side], mul(F.up, ps.lengths.thorax * motion.breath));
    for (const k of ["neckTop", "head"]) raw[k] = add(raw.neckBase, rotate(sub(raw[k], raw.neckBase), F.left, rad(motion.nod || 0)));
    const fitted = fit(raw, ps.lengths);
    for (const k of ["pelvis", "hipL", "hipR", ...LEG_BELOW_HIP("L"), ...LEG_BELOW_HIP("R")]) fitted.joints[k] = { ...ps.joints[k] };
    return { ...ps, joints: fitted.joints, faults: [...ps.faults, ...fitted.reach], head: { ...ps.head, forward: rotate(ps.head.forward, F.left, rad(motion.nod || 0)) } };
  }

  // the body's own axes, read from the skeleton (so lying down, bowing or prostrating all work the same way)
  function frame(j) {
    const left = norm(sub(j.hipL, j.hipR), P(1, 0, 0)), up = norm(sub(j.lumbar, j.pelvis), P(0, 1, 0));
    return { left, up, fwd: norm(cross(left, up), P(0, 0, 1)), hipMid: lerp3(j.hipL, j.hipR, 0.5) };
  }

  function slerp3(a, b, t, fallback = P(0, 0, 1)) {
    const na = norm(a), nb = norm(b), c = clamp(dot(na, nb), -1, 1);
    if (c > 0.9995) return norm(lerp3(na, nb, t), na);
    if (c < -0.9995) {
      const axis = norm(perp(fallback, na), P(0, 1, 0)), th = Math.PI * t;
      return add(mul(na, Math.cos(th)), mul(axis, Math.sin(th)));
    }
    const th = Math.acos(c), s = Math.sin(th);
    return norm(add(mul(na, Math.sin((1 - t) * th) / s), mul(nb, Math.sin(t * th) / s)), na);
  }

  // Smooth, bone-length-invariant, ROM-safe 3D pose transition between any two solved poses
  function blend(poseA, poseB, u, opts = {}) {
    const t = clamp(Number(u) || 0, 0, 1), e = opts.linear ? t : t * t * (3 - 2 * t);
    if (t === 0 || t === 1) { const end = t === 0 ? poseA : poseB; return opts.props === false ? { ...end, props: [] } : end; }
    const jA = poseA.joints, jB = poseB.joints, L = poseA.lengths, prof = poseA.profile;
    const FA = frame(jA), FB = frame(jB);
    const left0 = slerp3(FA.left, FB.left, e, P(0, 1, 0));
    const up0 = norm(perp(slerp3(FA.up, FB.up, e, P(0, 0, 1)), left0), P(0, 1, 0));
    const fwd0 = norm(cross(left0, up0), P(0, 0, 1));
    const toLocal = (v, F) => P(dot(v, F.left), dot(v, F.up), dot(v, F.fwd));
    const toWorld = (loc) => norm(add(add(mul(left0, loc.x), mul(up0, loc.y)), mul(fwd0, loc.z)));
    const joints = { pelvis: lerp3(jA.pelvis, jB.pelvis, e) };
    for (const k of JOINTS) {
      const p = PARENT[k];
      if (!p) continue;
      const vA = norm(sub(jA[k], jA[p])), vB = norm(sub(jB[k], jB[p]));
      const loc = slerp3(toLocal(vA, FA), toLocal(vB, FB), e, P(0, 0, 1));
      let dir = toWorld(loc);
      if (k === "handL" || k === "handR") {
        const fo = norm(sub(joints[p], joints["elbow" + k.slice(-1)])), wr = angle(fo, dir);
        if (wr > ROM.wristBendMax - 1) dir = norm(lerp3(fo, dir, (ROM.wristBendMax - 1) / wr), fo);
      }
      joints[k] = add(joints[p], mul(dir, L[k]));
    }
    const minYA = Math.min(...JOINTS.map((k) => jA[k].y)), minYB = Math.min(...JOINTS.map((k) => jB[k].y));
    const targetMinY = Math.max(2, lerp(minYA, minYB, e));
    const curMinY = Math.min(...JOINTS.map((k) => joints[k].y));
    const dy = curMinY < 2 ? 2 - curMinY : (poseA.posture !== poseB.posture ? targetMinY - curMinY : 0);
    if (dy) for (const k of JOINTS) joints[k].y += dy;
    const hfLoc = slerp3(toLocal(poseA.head.forward, FA), toLocal(poseB.head.forward, FB), e, P(0, 0, 1));
    const supports = e < 0.5 ? poseA.supports : poseB.supports;
    const props = opts.props === false ? [] : (e < 0.5 ? poseA.props : poseB.props);
    return {
      posture: e < 0.5 ? poseA.posture : poseB.posture,
      phase: lerp(poseA.phase || 0, poseB.phase || 0, e),
      profile: prof,
      trim: {
        headYaw: lerp(poseA.trim?.headYaw || 0, poseB.trim?.headYaw || 0, e),
        headPitch: lerp(poseA.trim?.headPitch || 0, poseB.trim?.headPitch || 0, e),
        spinePitch: lerp(poseA.trim?.spinePitch || 0, poseB.trim?.spinePitch || 0, e),
        armSpread: lerp(poseA.trim?.armSpread || 0, poseB.trim?.armSpread || 0, e),
        elbowZ: lerp(poseA.trim?.elbowZ || 0, poseB.trim?.elbowZ || 0, e),
        stanceWidth: lerp(poseA.trim?.stanceWidth || 0, poseB.trim?.stanceWidth || 0, e),
      },
      lengths: L,
      joints,
      supports,
      props,
      head: {
        forward: toWorld(hfLoc),
        yaw: lerp(poseA.head?.yaw || 0, poseB.head?.yaw || 0, e),
        pitch: lerp(poseA.head?.pitch || 0, poseB.head?.pitch || 0, e),
      },
      faults: [],
    };
  }

  // ───────────────────────────── H19–H21 · garments ─────────────────────────────
  const GARMENTS = {
    punjabi: { id: "G-01", name: "Punjabi / Panjabi & Pajama", apron: true, drop: 48, chaak: 1.0, sleeves: "full", lower: "pajama", placket: true, hues: [38, 210] },
    sari: { id: "G-02", name: "Nivi Sari (Kuchi pleats & Pallu)", apron: true, drop: 84, chaak: 0.2, sleeves: "choli", lower: "petticoat", pleats: true, pallu: "nivi", waistBodice: false, hues: [342, 45] },
    shirt_pant: { id: "G-03", name: "Formal Shirt & Tailored Pant", apron: false, tucked: true, belt: true, sleeves: "full", lower: "pant", placket: true, hues: [198, 222] },
    kameez: { id: "G-04", name: "Salwar Kameez & Dupatta", apron: true, drop: 54, chaak: 1.0, sleeves: "full", lower: "salwar", pallu: "dupatta", hues: [162, 280] },
    abaya: { id: "G-06", name: "Abaya", apron: true, drop: 84, chaak: 0.2, sleeves: "full", lower: "petticoat", hues: [260, 260] },
    none: { id: "G-05", name: "Base Anatomical Mannequin", apron: false, sleeves: null, lower: null, hues: [200, 200] },
  };
  // garment shells (U, × limbThick): each garment layer is a capsule a little larger than the body under it
  const GARMENT_RADII = {
    lower: { pajama: [11.8, 9.2, 6.5], pant: [11.8, 9.2, 6.5], salwar: [13.2, 11.5, 6.8], petticoat: [10.5, 9.5, 7] }, // hip, knee, ankle
    waistband: { front: 17.2, profile: 13.0, lumbarRatio: 0.88 },
    bodice: { thorax: [14.5, 10.4], lumbar: [13.8, 9.8], pelvis: [15.8, 11] },       // [front, profile]
    yoke: [8.2, 7.6], sleeve: [7.5, 6.4, 5], choli: { radii: [9.0, 7.6], reach: 0.58 }, // sleeve: shoulder, elbow, wrist
    sash: [11, 9.5], dupatta: [6.5, 7.5], tail: { start: 8, grow: 1, end: 9.5, endGrow: 1.2 },
    panelHalfWidth: { top: 16.5, perNode: 1.4 }, panelFrontOffset: 9.5, panelLift: 3, clothGap: 1.5, floorClearance: 2.5,
  };
  // painter's order: a bigger bias draws later (in front) at the same depth
  const DRAW_BIAS = { prop_backrest: -16, prop_chair: -12, prop_pillow: -15, prop_table: 8, back_apron: -1.2, body_under_cloth: -0.8,
    waistband: 0.2, trouser: 0.3, bodice: 0.9, yoke: 1.0, sleeve: 1.0, front_apron: 1.2, sash: 2.2, head: 2.5 };
  const CLOTH_DEFAULT = { lengthScale: 1.0, stiffness: 0.25, chaakHeight: null };
  const CLOTH_BOUNDS = { lengthScale: [0.55, 1.35], stiffness: [0, 1], chaakHeight: [0.2, 1.0] };

  function supportTop(supports, p) {
    let best = FLOOR;
    for (const s of supports) if (p.x >= s.x[0] && p.x <= s.x[1] && p.z >= s.z[0] && p.z <= s.z[1] && s.top <= p.y + 0.01 && s.top > best.top) best = s;
    return best;
  }
  // walk a guide polyline for `length` U; when the cloth meets a support it lies on it (floor: pools outward;
  // seat: bunches under the sitter). Returns 5 nodes at equal arc length (the 4 articulated zones).
  function layAlong(guide, length, supports, outward, clear) {
    const step = 0.5, pts = [guide[0]];
    let pos = guide[0], seg = 1, travelled = 0, onSupport = null;
    while (travelled < length - 1e-6) {
      let dir;
      if (onSupport) dir = norm(P(outward.x, 0, outward.z), P(0, 0, 1));
      else {
        while (seg < guide.length - 1 && len(sub(guide[seg], pos)) < 1e-6) seg++;
        dir = norm(sub(guide[seg], pos));
        const toNext = len(sub(guide[seg], pos));
        if (toNext < step && toNext <= length - travelled && seg < guide.length - 1) { pos = guide[seg]; seg++; pts.push(pos); travelled += toNext; continue; }
      }
      const h = Math.min(step, length - travelled);
      let next = add(pos, mul(dir, onSupport && onSupport.seat ? h * 0.12 : h));
      // cloth that is sat on stays trapped on the seat: it bunches, it never slides off behind the sitter
      if (onSupport && onSupport.seat) next = P(clamp(next.x, onSupport.x[0], onSupport.x[1]), next.y, clamp(next.z, onSupport.z[0] + 0.01, onSupport.z[1] - 0.01));
      const s = supportTop(supports, pos);
      if (next.y < s.top + clear) { next = P(next.x, s.top + clear, next.z); onSupport = s; }
      else if (onSupport && supportTop(supports, next) !== onSupport) onSupport = null; // slid off the edge: hang again
      if (onSupport && !onSupport.seat) outward = P(outward.x, 0, outward.z);
      pos = next; travelled += h; pts.push(pos);
    }
    // resample to 5 nodes by travelled distance (compressed seat steps count as full cloth length)
    const nodes = [], n = pts.length - 1;
    for (let i = 0; i <= 4; i++) nodes.push(pts[Math.round((i / 4) * n)]);
    return nodes;
  }
  // push a node (and both panel edges) out of every leg capsule and above the floor
  function legCapsules(j, lt) {
    const out = [];
    for (const s of ["L", "R"]) {
      out.push([j["hip" + s], j["knee" + s], RADII.thigh[0] * lt, RADII.thigh[1] * lt]);
      out.push([j["knee" + s], j["ankle" + s], RADII.calf[0] * lt, RADII.calf[1] * lt]);
    }
    return out;
  }
  function penetration(p, cap) {
    const [a, b, r1, r2] = cap, ab = sub(b, a), t = clamp(dot(sub(p, a), ab) / Math.max(1e-9, dot(ab, ab)), 0, 1);
    const c = add(a, mul(ab, t)), d = sub(p, c), R = lerp(r1, r2, t);
    return { depth: R - len(d), dir: norm(d, P(0, 1, 0)) };
  }
  function resolveNode(node, left, caps, gap, floorClear) {
    let p = P(node.x, node.y, node.z);
    // every push of one round is summed before the node moves: two thighs pushing a lap panel from both sides cancel sideways and
    // add upward, so the cloth rises onto the lap instead of ping-ponging between the legs
    for (let iter = 0; iter < 16; iter++) {
      let push = P(0, 0, 0), moved = false;
      for (const e of [0, -1, 1]) {
        const q = add(p, mul(left, e * node.w));
        for (const cap of caps) {
          const pen = penetration(q, cap);
          if (pen.depth + gap > 0) { push = add(push, mul(pen.dir, pen.depth + gap)); moved = true; }
        }
      }
      if (!moved) break;
      p = add(p, push);
    }
    if (p.y < floorClear) p = P(p.x, floorClear, p.z);
    return { ...node, x: p.x, y: p.y, z: p.z };
  }
  // where the panel lies on a thigh near the knee: the thigh side facing `want` (front panel: forward + up)
  function thighSurface(j, s, want, fallback, r) {
    const a = norm(sub(j["knee" + s], j["hip" + s]));
    let n = perp(want, a);
    if (len(n) < 0.2) n = perp(fallback, a);
    return add(j["knee" + s], mul(norm(n), r));
  }

  const GARMENT_ALIAS = {
    kurta: "punjabi", panjabi: "punjabi", sherwani: "punjabi", thobe: "punjabi", jubba: "punjabi",
    shalwar: "kameez", salwar: "kameez", burqa: "abaya",
    suit: "shirt_pant", blazer: "shirt_pant", coat: "shirt_pant", shirt: "shirt_pant", tshirt: "shirt_pant", uniform: "shirt_pant", polo: "shirt_pant", hoodie: "shirt_pant", jacket: "shirt_pant",
    saree: "sari", lehenga: "sari",
  };
  const garmentKey = (id) => (!id || id === "none" ? "none" : GARMENTS[id] ? id : GARMENT_ALIAS[String(id).toLowerCase()] || "punjabi");

  function drape(ps, garmentId = "punjabi", clothIn = {}, opts = {}) {
    const gid = garmentKey(garmentId), g = GARMENTS[gid];
    if (!g) throw new Error(`ZANATOMY: unknown garment "${garmentId}"`);
    // girth: how far in front of and behind the hips the cloth hangs follows the body's depth there (the measured bodies give the thighs
    // and the pelvis their own thickness); the panel's width stays with the frame (sw)
    const j = ps.joints, prof = ps.profile, lt = prof.limbThick, ll = prof.legThick ?? lt, sw = prof.scaleWidth, girth = sw * Math.max(1, ll, prof.pelvisThick ?? 0), GR = GARMENT_RADII;
    const cloth = { ...CLOTH_DEFAULT, chaakHeight: g.chaak ?? 1, ...Object.fromEntries(Object.entries(clothIn).filter(([, v]) => v != null)) };
    for (const [k, [a, b]] of Object.entries(CLOTH_BOUNDS)) cloth[k] = clamp(cloth[k], a, b);
    const out = { garment: gid, cloth, front: [], back: [], pallu: [] };
    const F = frame(j), { left, up, fwd, hipMid } = F, kneeMid = lerp3(j.kneeL, j.kneeR, 0.5);
    const width = (i) => (GR.panelHalfWidth.top + GR.panelHalfWidth.perNode * i) * sw;

    if (g.apron) {
      const length = g.drop * cloth.lengthScale * prof.scaleY, gap = GR.clothGap, rKnee = RADII.thigh[1] * ll + gap;
      const anchorF = add(add(hipMid, mul(fwd, GR.panelFrontOffset * girth)), mul(up, GR.panelLift));
      const anchorB = add(add(hipMid, mul(fwd, -GR.panelFrontOffset * girth)), mul(up, GR.panelLift));
      if (opts.staticBox || clothIn.staticBox) { // the forbidden "static box": rigid along the torso, ignoring hips, thighs, seat and gravity
        const dir = norm(sub(j.pelvis, j.thorax));
        for (let i = 0; i <= 4; i++) {
          const d = (i / 4) * length;
          out.front.push({ ...add(add(j.pelvis, mul(dir, d)), mul(fwd, 10.5 * sw)), w: (17 + i * 1.2) * sw });
          out.back.push({ ...add(add(j.pelvis, mul(dir, d)), mul(fwd, -10.5 * sw)), w: (17 + i * 1.2) * sw });
        }
        return out;
      }
      const ahead = (s) => dot(sub(j["knee" + s], hipMid), fwd);
      const lead = ahead("L") >= ahead("R") ? "L" : "R", rear = lead === "L" ? "R" : "L";
      const midLateral = (p) => add(p, mul(left, dot(sub(kneeMid, p), left))); // the panel spans both legs: centre it
      // FRONT: hip breaking point → over the lead thigh → kneecap wrap → gravity drop (stiff cloth keeps some direction)
      const kneeF = midLateral(thighSurface(j, lead, add(fwd, up), up, rKnee));
      const thighDir = norm(sub(kneeF, anchorF), P(0, -1, 0)), k = cloth.stiffness * 0.35;
      const hangF = norm(add(mul(P(0, -1, 0), 1 - k), mul(thighDir, k)));
      const guideF = [anchorF, kneeF, add(kneeF, mul(hangF, 400))];
      // BACK: follows the rear thigh only when that thigh swings behind the body; otherwise hangs from the seat line
      const guideB = ahead(rear) < -4
        ? (() => { const kb = midLateral(thighSurface(j, rear, mul(fwd, -1), mul(up, -1), rKnee)); return [anchorB, kb, add(kb, P(0, -400, 0))]; })()
        : [anchorB, add(anchorB, P(0, -400, 0))];
      const flat = (v) => norm(P(v.x, 0, v.z), P(0, 0, 1));
      const front = layAlong(guideF, length, ps.supports, flat(fwd.y < -0.5 ? hangF : add(fwd, mul(hangF, 0.01))), GR.floorClearance);
      const back = layAlong(guideB, length, ps.supports, flat(mul(fwd, -1)), GR.floorClearance);
      // CHAAK: the side slit lets the two panels part; a low slit (closed skirt) pulls the hems toward each other
      const freedom = 0.35 + 0.65 * cloth.chaakHeight, caps = legCapsules(j, ll);
      const tags = ["HIP BREAKING POINT", "LAP / THIGH ENVELOPE", "THIGH ENVELOPE", "KNEE PATELLA WRAP", "GRAVITY KNEE DROP"];
      for (let i = 0; i <= 4; i++) {
        const t = i / 4, mid = lerp3(front[i], back[i], 0.5), keep = lerp(1, freedom, t);
        const f = { ...lerp3(mid, front[i], keep), w: width(i), tag: tags[i] }, b = { ...lerp3(mid, back[i], keep), w: width(i) };
        out.front.push(resolveNode(f, left, caps, gap, GR.floorClearance));
        out.back.push(resolveNode(b, left, caps, gap, GR.floorClearance));
      }
    }
    if (g.pallu) { // gravity chain from the left shoulder: hangs down when bowing, trails behind when moving
      const sh = j.shoulderL, bow = F.fwd.y < -0.5, supine = F.fwd.y > 0.5, wave = Math.sin(rad(ps.phase));
      const sway = ps.posture === "run" ? -24 - Math.abs(wave) * 10 : ps.posture === "walk" ? -8 - wave * 6 : -6;
      for (let i = 0; i <= 3; i++) {
        const t = i / 3;
        if (supine) out.pallu.push(P(sh.x + 4 * t, Math.max(2.5, sh.y - 6 * t), sh.z + t * 48));
        else if (bow) out.pallu.push(P(sh.x + 3 * t, Math.max(2.5, sh.y - t * 52), sh.z + t * 8));
        else out.pallu.push(P(sh.x + 2 * t, Math.max(3, sh.y - t * 56 * cloth.lengthScale * prof.scaleY), sh.z - 7 + sway * t));
      }
    }
    return out;
  }

  // ───────────────────────────── check · every base rule on one solved pose ─────────────────────────────
  function check(ps, dr) {
    const j = ps.joints, L = ps.lengths, faults = [...(ps.faults || [])], F = frame(j);
    const f = (rule, msg) => faults.push({ rule, msg });
    for (const k of JOINTS) if (PARENT[k]) {
      const d = len(sub(j[k], j[PARENT[k]]));
      if (Math.abs(d - L[k]) > 0.5) f(k === "head" || k === "neckTop" || k === "neckBase" ? "H02" : /^(shoulder)/.test(k) ? "H04" : "H05", `${PARENT[k]}→${k} is ${d.toFixed(1)} U, rest ${L[k].toFixed(1)} U`);
    }
    const chest = sub(j.thorax, j.lumbar), low = sub(j.lumbar, j.pelvis), neck = sub(j.neckTop, j.neckBase);
    if (angle(low, chest) > ROM.spineBendMax) f("H03", `waist kink ${angle(low, chest).toFixed(0)}° > ${ROM.spineBendMax}°`);
    if (angle(chest, neck) > ROM.neckFlexMax) f("H16", `neck bent ${angle(chest, neck).toFixed(0)}° from the chest > ${ROM.neckFlexMax}°`);
    if (Math.abs(ps.head?.yaw || 0) > ROM.headYawHard) f("H16", `head turned ${ps.head.yaw}°: turn the chest and feet instead`);
    if (dot(sub(j.shoulderL, j.shoulderR), sub(j.hipL, j.hipR)) <= 0) f("H16", "chest twisted more than 90° from the hips");
    for (const s of ["L", "R"]) {
      const up = sub(j["shoulder" + s], j["elbow" + s]), fo = sub(j["wrist" + s], j["elbow" + s]), el = angle(up, fo);
      if (el < ROM.elbowInteriorMin) f("H06", `${s} elbow folded to ${el.toFixed(0)}° < ${ROM.elbowInteriorMin}°`);
      const wr = angle(fo, sub(j["hand" + s], j["wrist" + s]));
      if (wr > ROM.wristBendMax) f("H07", `${s} wrist bent ${wr.toFixed(0)}° > ${ROM.wristBendMax}°`);
      const th = sub(j["knee" + s], j["hip" + s]), sh = sub(j["ankle" + s], j["knee" + s]), kn = angle(mul(th, -1), sh);
      if (kn < ROM.kneeInteriorMin) f("H09", `${s} knee folded to ${kn.toFixed(0)}° < ${ROM.kneeInteriorMin}°`);
      if (kn < 170 && dot(cross(th, sh), F.left) < 0) f("H09", `${s} knee bends backwards`);
      const down = mul(F.up, -1), flex = angle(down, th), fwdSide = dot(th, F.fwd) >= 0;
      if (fwdSide && flex > ROM.hipFlexMax) f("H09", `${s} hip flexed ${flex.toFixed(0)}° > ${ROM.hipFlexMax}°`);
      if (!fwdSide && angle(down, perp(th, F.left)) > ROM.hipExtMax) f("H09", `${s} hip extended ${angle(down, perp(th, F.left)).toFixed(0)}° > ${ROM.hipExtMax}°`);
      const abd = deg(Math.asin(clamp(Math.abs(dot(norm(th), F.left)), 0, 1)));
      if (abd > ROM.hipAbdMax) f("H09", `${s} thigh ${abd.toFixed(0)}° out to the side > ${ROM.hipAbdMax}°`);
      const sag = perp(mul(up, -1), F.left), ext = angle(mul(F.up, -1), sag); // upper arm in the side plane
      if (dot(sag, F.fwd) < 0 && dot(sag, F.up) < 0 && ext > ROM.shoulderExtMax) f("H04", `${s} upper arm ${ext.toFixed(0)}° behind the body > ${ROM.shoulderExtMax}°`);
    }
    const low3 = JOINTS.filter((k) => j[k].y < ROM.floorClearance);
    if (low3.length) f("H18", `below the floor: ${low3.join(", ")}`);
    // H01 the skeleton is whole; H02 the head truly meets the neck; H11 a seated body is on its seat
    for (const k of JOINTS) if (![j[k]?.x, j[k]?.y, j[k]?.z].every(Number.isFinite)) f("H01", `${k} has no valid position`);
    const headR = RADII.head * ps.profile.headScale;
    if (len(sub(j.head, j.neckTop)) - RADII.neck[1] > headR) f("H02", `gap between the neck and the head (${(len(sub(j.head, j.neckTop)) - RADII.neck[1] - headR).toFixed(1)} U)`);
    const seat = (ps.supports || []).find((q) => q.seat);
    if (seat && Math.abs((j.hipL.y + j.hipR.y) / 2 - seat.top - SEAT_HIP_OFFSET) > 3) f("H11", "the hips are not on the seat");
    if (dr) {
      const caps = legCapsules(j, ps.profile.legThick ?? ps.profile.limbThick), left = F.left;
      for (const [name, chain] of [["front", dr.front], ["back", dr.back]]) chain.forEach((n, i) => {
        if (n.y < GARMENT_RADII.floorClearance - 0.5) f("H20", `${name} apron node ${i} under the floor`);
        let worst = 0;
        for (const e of [0, -1, 1]) for (const cap of caps) worst = Math.max(worst, penetration(add(n, mul(left, e * n.w)), cap).depth);
        if (worst > 0.75) f("H20", `${name} apron node ${i} cuts ${worst.toFixed(1)} U into a leg (static box?)`);
      });
      for (const n of dr.pallu || []) if (n.y < GARMENT_RADII.floorClearance - 0.5) { f("H20", "pallu under the floor"); break; }
      // H19 the side slit really opens: a seated tunic's front lies on the thighs while its back panel hangs
      if (dr.garment && !GARMENTS[dr.garment]) f("H21", `unknown garment ${dr.garment}`);
      if (seat && dr.front?.[4] && dr.back?.[4] && dr.cloth?.chaakHeight >= 0.5 && len(sub(dr.front[4], dr.back[4])) < 6) f("H19", "the tunic's front and back did not separate at the side slit (static box)");
    }
    return faults;
  }

  // ───────────────────────────── H17 · orthographic views ─────────────────────────────
  // front: viewer in front (character's left on screen right) · back · side = the right profile facing screen right ·
  // sideLeft · threeQuarter (yaw + turns the face toward screen right, pitch + = camera above) · top.
  function project(p, view = "front", o = {}) {
    const c = o.center || P(0, 0, 0), x = p.x - c.x, y = p.y, z = p.z - c.z;
    let sx, sy = y, depth;
    if (view === "front") { sx = x; depth = z; }
    else if (view === "back") { sx = -x; depth = -z; }
    else if (view === "side") { sx = z; depth = -x; }
    else if (view === "sideLeft") { sx = -z; depth = x; }
    else if (view === "threeQuarter" || view === "top") {
      const yaw = view === "top" ? 0 : o.yaw ?? 38, pitch = view === "top" ? 82 : o.pitch ?? 8, pivot = 60;
      const r = rotX(rotY(P(x, y - pivot, z), yaw), pitch);
      sx = r.x; sy = r.y + pivot; depth = r.z;
    } else throw new Error(`ZANATOMY: unknown view "${view}"`);
    const k = clamp(1 + depth * (o.perspective || 0), 0.82, 1.2), s = (o.scale || 1.44) * k; // perspective 0 = orthographic
    return { x: (o.cx ?? 210) + sx * s, y: (o.groundY ?? 312) - sy * s, depth, scale: s };
  }

  // ───────────────────────────── a small SVG renderer (pose sheets, review, tests) ─────────────────────────────
  const f1 = (n) => n.toFixed(1);
  function capsulePath(a, b, r1, r2) {
    const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    if (d < 1.2) { const r = Math.max(r1, r2); return `M ${f1(a.x - r)} ${f1(a.y)} a ${f1(r)} ${f1(r)} 0 1 0 ${f1(r * 2)} 0 a ${f1(r)} ${f1(r)} 0 1 0 ${f1(-r * 2)} 0 Z`; }
    const nx = dy / d, ny = -dx / d;
    return `M ${f1(a.x + nx * r1)} ${f1(a.y + ny * r1)} L ${f1(b.x + nx * r2)} ${f1(b.y + ny * r2)} A ${f1(r2)} ${f1(r2)} 0 0 1 ${f1(b.x - nx * r2)} ${f1(b.y - ny * r2)} L ${f1(a.x - nx * r1)} ${f1(a.y - ny * r1)} A ${f1(r1)} ${f1(r1)} 0 0 1 ${f1(a.x + nx * r1)} ${f1(a.y + ny * r1)} Z`;
  }
  function tone(depth, hue, isCloth, alpha) {
    const n = clamp((depth + 55) / 110, 0, 1);
    return { fill: `hsla(${hue}, ${isCloth ? 68 : 48}%, ${Math.round((isCloth ? 20 : 14) + n * 22)}%, ${alpha})`, stroke: `hsl(${hue}, 88%, ${Math.round((isCloth ? 52 : 44) + n * 30)}%)` };
  }
  function hexRgb(h) {
    if (!/^#?[0-9a-f]{3,8}$/i.test(String(h || ""))) return [136, 136, 136];
    const s = String(h).replace("#", "");
    const full = s.length === 3 ? s.split("").map((c) => c + c).join("") : s.padEnd(6, "0");
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) || 0);
  }
  function mixHex(a, b, u) {
    const ca = hexRgb(a), cb = hexRgb(b), t = clamp(u, 0, 1);
    return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, "0")).join("");
  }
  function lookTone(depth, baseHex, strokeHex) {
    const n = clamp((depth + 55) / 110, 0, 1);
    const shaded = n < 0.5 ? mixHex("#1e1410", baseHex, 0.72 + n * 0.56) : mixHex(baseHex, "#ffffff", (n - 0.5) * 0.14);
    return { fill: shaded, stroke: strokeHex || mixHex("#140d0a", baseHex, 0.38) };
  }
  // The picture has no outlines on the body: bones and capsules are the mechanism, never the look. The form comes from
  // flat colour, soft shade and cloth folds. A fold is darker on a light cloth and lighter on a very dark one (else it vanishes).
  const isDark = (h) => { const [r, g, b] = hexRgb(h); return 0.299 * r + 0.587 * g + 0.114 * b < 62; };
  const foldHex = (h, u = 0.34) => (isDark(h) ? mixHex(h, "#ffffff", u * 0.62) : mixHex(h, "#1a0e08", u));
  const fold = (d, hex, w, op = 0.6) => `<path data-detail="1" d="${d}" fill="none" stroke="${hex}" stroke-width="${f1(w)}" stroke-opacity="${op}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const curve = (A, C, B) => `M ${f1(A.x)} ${f1(A.y)} Q ${f1(C.x)} ${f1(C.y)} ${f1(B.x)} ${f1(B.y)}`;
  let clipSeq = 0;
  // the shade one part throws on the part under it, kept inside that part (clipId), so it never spills onto the background
  const castOn = (clipId, d, hex, dx, dy) => `<g clip-path="url(#${clipId})"><path d="${d}" transform="translate(${f1(dx)} ${f1(dy)})" fill="${foldHex(hex, 0.45)}" fill-opacity="0.32"/></g>`;
  // a rounded polygon through screen points
  function roundPoly(pts, r) {
    const n = pts.length; let d = "";
    pts.forEach((q, i) => {
      const a = pts[(i + n - 1) % n], b = pts[(i + 1) % n], la = Math.hypot(a.x - q.x, a.y - q.y) || 1, lb = Math.hypot(b.x - q.x, b.y - q.y) || 1, ra = Math.min(r, la / 2), rb = Math.min(r, lb / 2);
      const s = { x: q.x + ((a.x - q.x) / la) * ra, y: q.y + ((a.y - q.y) / la) * ra }, e = { x: q.x + ((b.x - q.x) / lb) * rb, y: q.y + ((b.y - q.y) / lb) * rb };
      d += `${i ? " L" : "M"} ${f1(s.x)} ${f1(s.y)} Q ${f1(q.x)} ${f1(q.y)} ${f1(e.x)} ${f1(e.y)}`;
    });
    return d + " Z";
  }
  function hull(pts) { // convex hull of screen points
    const s = pts.slice().sort((a, b) => a.x - b.x || a.y - b.y), cr = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x), lo = [], up = [];
    for (const q of s) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of s.slice().reverse()) { while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  function catmullSegs(pts, tension = 0.25) {
    let d = "";
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) * tension, c1y = p1.y + (p2.y - p0.y) * tension;
      const c2x = p2.x - (p3.x - p1.x) * tension, c2y = p2.y - (p3.y - p1.y) * tension;
      d += ` C ${f1(c1x)} ${f1(c1y)}, ${f1(c2x)} ${f1(c2y)}, ${f1(p2.x)} ${f1(p2.y)}`;
    }
    return d;
  }
  // Continuous Catmull-Rom 2-segment limb/torso silhouette (no internal joint circle seams)
  function smoothLimb(S, E, W, rS, rU, rE, rF, rW, capStart = true, capEnd = true) {
    const u1x = E.x - S.x, u1y = E.y - S.y, L1 = Math.hypot(u1x, u1y) || 1;
    const u2x = W.x - E.x, u2y = W.y - E.y, L2 = Math.hypot(u2x, u2y) || 1;
    const n1 = { x: -u1y / L1, y: u1x / L1 }, n2 = { x: -u2y / L2, y: u2x / L2 };
    const nm = { x: n1.x + n2.x, y: n1.y + n2.y }, nml = Math.hypot(nm.x, nm.y) || 1;
    nm.x /= nml; nm.y /= nml;
    const U = { x: (S.x + E.x) / 2, y: (S.y + E.y) / 2 }, F = { x: (E.x + W.x) / 2, y: (E.y + W.y) / 2 };
    const off = (p, n, d) => ({ x: p.x + n.x * d, y: p.y + n.y * d });
    const a = [off(S, n1, rS), off(U, n1, rU), off(E, nm, rE), off(F, n2, rF), off(W, n2, rW)];
    const b = [off(S, n1, -rS), off(U, n1, -rU), off(E, nm, -rE), off(F, n2, -rF), off(W, n2, -rW)];
    const cross2 = (u1x * u2y - u1y * u2x) / (L1 * L2);
    const untangle = (pts) => {
      if (Math.hypot(pts[3].x - pts[1].x, pts[3].y - pts[1].y) < Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y)) {
        pts[2] = { x: (pts[1].x + pts[3].x) / 2, y: (pts[1].y + pts[3].y) / 2 };
      }
    };
    if (cross2 > 0) untangle(b); else untangle(a);
    const bRev = b.slice().reverse();
    const endCap = capEnd
      ? ` A ${f1(rW)} ${f1(rW)} 0 0 0 ${f1(bRev[0].x)} ${f1(bRev[0].y)}`
      : ` L ${f1(bRev[0].x)} ${f1(bRev[0].y)}`;
    const startCap = capStart
      ? ` A ${f1(rS)} ${f1(rS)} 0 0 0 ${f1(a[0].x)} ${f1(a[0].y)} Z`
      : ` Z`;
    const outline = `M ${f1(a[0].x)} ${f1(a[0].y)}${catmullSegs(a)}${endCap}${catmullSegs(bRev)}${startCap}`;
    let crease = "";
    if (Math.abs(cross2) > 0.38) {
      const sgn = cross2 > 0 ? -1 : 1;
      const c0 = off(E, nm, sgn * rE * 0.85), c1 = off(E, nm, sgn * rE * 0.15);
      crease = `M ${f1(c0.x)} ${f1(c0.y)} L ${f1(c1.x)} ${f1(c1.y)}`;
    }
    return { outline, crease, endA: a[4], endB: b[4], startA: a[0], startB: b[0] };
  }
  // A hand with real fingers from the one hand library (hands.js), in the pose the action asks for: rest · open · fist · point.
  // thumb = +1 / −1 (the side the thumb is on). A raised finger is this hand's own index finger, never an added shape.
  function sculptedHand(Wr, Hnd, c, kind = "rest", thumb = 1, wristR = 4, Elb = null, boneLen = 0, outward = 1, foreLen = 0) {
    const hs = (wristR * 0.8) / 13, want = boneLen * (Wr.scale || 1), len = Math.hypot(Hnd.x - Wr.x, Hnd.y - Wr.y), seen = want ? clamp(len / want, 0, 1) : 1;
    // seen head-on the hand's own direction means nothing on screen: use the forearm's, and foreshorten the length
    const elbLen = Elb ? Math.hypot(Wr.x - Elb.x, Wr.y - Elb.y) : 0, useFore = seen < 0.55 && elbLen > wristR * 0.5;
    const headOn = seen < 0.55 && foreLen && elbLen < foreLen * (Wr.scale || 1) * 0.6; // the whole forearm points at the camera: the hand reads best lifted a little to the outside, never hanging
    const dx = headOn ? outward * 0.75 : useFore ? Wr.x - Elb.x : Hnd.x - Wr.x, dy = headOn ? -0.65 : useFore ? Wr.y - Elb.y : Hnd.y - Wr.y, ang = (Math.atan2(dy, dx) * 180) / Math.PI, hy = hs * clamp(seen, 0.55, 1);
    const inner = root.HANDS ? root.HANDS.handSvg(kind, { skin: c.fill, shade: foldHex(c.fill, 0.42), nail: mixHex(c.fill, "#ffffff", 0.4), w: Math.max(1.8, 1.1 / hs) }) : `<ellipse cx="0" cy="34" rx="18" ry="34" fill="${c.fill}"/>`;
    return `<g data-part="hand" data-pose="${kind}" transform="translate(${f1(Wr.x)} ${f1(Wr.y)}) rotate(${f1(ang - 90)}) scale(${(-thumb * hs).toFixed(4)} ${hy.toFixed(4)})">${inner}</g>`;
  }
  // The standard shoe every person wears: a short boot with a real heel, a sole and a rounded toe. Bare feet only when asked for (prayer, sleep).
  function shoe(Ank, Heel, Foot, Toe, hex, sw, s) {
    const c = lookTone(Ank.depth, hex), soleC = mixHex(hex, "#120b07", 0.72);
    const dx = Toe.x - Heel.x, dy = Toe.y - Heel.y, d = Math.hypot(dx, dy) || 1;
    if (d < 8 * s) { // from the front or the back
      const cx = (Foot.x + Ank.x) / 2, top = Ank.y - 3 * s, by = Math.max(Foot.y, Heel.y, Toe.y) + 1.6 * s, w = 4 * s, seenBack = Toe.depth < Heel.depth;
      const upper = `M ${f1(cx - w * 0.72)} ${f1(top)} L ${f1(cx + w * 0.72)} ${f1(top)} C ${f1(cx + w * 0.8)} ${f1(top + (by - top) * 0.5)} ${f1(cx + w * 1.15)} ${f1(by - 2.2 * s)} ${f1(cx + w)} ${f1(by)} L ${f1(cx - w)} ${f1(by)} C ${f1(cx - w * 1.15)} ${f1(by - 2.2 * s)} ${f1(cx - w * 0.8)} ${f1(top + (by - top) * 0.5)} ${f1(cx - w * 0.72)} ${f1(top)} Z`;
      return `<g data-part="shoe"><path d="${upper}" fill="${c.fill}"/><rect x="${f1(cx - w * 1.05)}" y="${f1(by - 0.3 * s)}" width="${f1(w * 2.1)}" height="${f1(1.1 * s)}" rx="${f1(s * 0.4)}" fill="${soleC}"/>${seenBack ? `<rect x="${f1(cx - w * 0.6)}" y="${f1(by + 0.6 * s)}" width="${f1(w * 1.2)}" height="${f1(1.2 * s)}" rx="${f1(s * 0.3)}" fill="${soleC}"/>` : ""}</g>`;
    }
    const ux = dx / d, uy = dy / d; let nx = -uy, ny = ux;
    if ((Ank.x - Heel.x) * nx + (Ank.y - Heel.y) * ny < 0) { nx = -nx; ny = -ny; }
    const at = (Q, a, b) => ({ x: Q.x + ux * a + nx * b, y: Q.y + uy * a + ny * b }), Q = (q) => `${f1(q.x)} ${f1(q.y)}`;
    const cuffB = at(Ank, -3.2 * s, 3.4 * s), cuffF = at(Ank, 3.2 * s, 3.4 * s), instep = at(Foot, -1.5 * s, 3.5 * s), toeTop = at(Toe, 0.2 * s, 2.5 * s), toeTip = at(Toe, 2.6 * s, 0.4 * s), toeLow = at(Toe, 1.8 * s, -1 * s), heelLow = at(Heel, -2.7 * s, -1 * s), heelBack = at(Heel, -3.2 * s, 1.5 * s);
    const upper = `M ${Q(cuffB)} L ${Q(cuffF)} Q ${Q(at(Ank, 3.4 * s, 0.6 * s))} ${Q(instep)} Q ${Q(at(Toe, -2.2 * s, 3.1 * s))} ${Q(toeTop)} Q ${Q(at(Toe, 2.2 * s, 2.3 * s))} ${Q(toeTip)} Q ${Q(at(Toe, 2.9 * s, -0.5 * s))} ${Q(toeLow)} L ${Q(heelLow)} Q ${Q(at(Heel, -3.6 * s, -0.4 * s))} ${Q(heelBack)} Z`;
    const sole = `M ${Q(toeLow)} L ${Q(heelLow)} L ${Q(at(Heel, -2.7 * s, -1.9 * s))} L ${Q(at(Toe, 1.8 * s, -1.9 * s))} Z`;
    const heel = `M ${Q(at(Heel, -2.7 * s, -1.8 * s))} L ${Q(at(Heel, 2.3 * s, -1.8 * s))} L ${Q(at(Heel, 1.9 * s, -3.4 * s))} L ${Q(at(Heel, -2.5 * s, -3.4 * s))} Z`;
    return `<g data-part="shoe"><path d="${heel}" fill="${soleC}"/><path d="${sole}" fill="${soleC}"/><path d="${upper}" fill="${c.fill}"/>${fold(curve(at(Ank, -2.6 * s, 0.9 * s), at(Ank, 0, 0.1 * s), at(Ank, 2.8 * s, 0.7 * s)), foldHex(c.fill, 0.38), 0.55 * s, 0.7)}</g>`;
  }
  function sculptedFoot(Ank, Heel, Foot, Toe, skinC, shoeHex, sw, bare, lt = 1) {
    const s = (Ank.scale || 1.4) * lt, rA = 2.6 * s, rH = 2.5 * s, rT = 2.0 * s;
    if (!bare && shoeHex) return shoe(Ank, Heel, Foot, Toe, shoeHex, sw, s);
    const dx = Toe.x - Heel.x, dy = Toe.y - Heel.y, d = Math.hypot(dx, dy) || 1;
    if (d < 8 * s) { // a bare foot from the front or the back: rounded on the floor, never a spike
      const cx = (Foot.x + Ank.x) / 2, by = Math.max(Foot.y, Heel.y, Toe.y) + s * 1.2, top = Ank.y - s * 1.5, fw = 4.3 * s;
      return `<path d="M ${f1(cx - fw * 0.55)} ${f1(top)} C ${f1(cx - fw * 1.1)} ${f1((top + by) / 2)} ${f1(cx - fw)} ${f1(by)} ${f1(cx)} ${f1(by)} C ${f1(cx + fw)} ${f1(by)} ${f1(cx + fw * 1.1)} ${f1((top + by) / 2)} ${f1(cx + fw * 0.55)} ${f1(top)} Z" fill="${skinC.fill}"/>`;
    }
    const ux = dx / d, uy = dy / d;
    let nx = -uy, ny = ux;
    if ((Ank.x - Heel.x) * nx + (Ank.y - Heel.y) * ny < 0) { nx = -nx; ny = -ny; }
    const hB = { x: Heel.x - ux * rH * 0.6 - nx * rH * 0.35, y: Heel.y - uy * rH * 0.6 - ny * rH * 0.35 };
    const hT = { x: Ank.x - ux * rA * 0.75 + nx * rA * 0.35, y: Ank.y - uy * rA * 0.75 + ny * rA * 0.35 };
    const aF = { x: Ank.x + ux * rA * 0.75 + nx * rA * 0.4, y: Ank.y + uy * rA * 0.75 + ny * rA * 0.4 };
    const bridge = { x: Foot.x + nx * rA * 0.75, y: Foot.y + ny * rA * 0.75 };
    const tTop = { x: Toe.x + ux * rT * 0.65 + nx * rT * 0.85, y: Toe.y + uy * rT * 0.65 + ny * rT * 0.85 };
    const tBot = { x: Toe.x + ux * rT * 0.7 - nx * rT * 0.35, y: Toe.y + uy * rT * 0.7 - ny * rT * 0.35 };
    const soleM = { x: (Heel.x + Toe.x) * 0.5 - nx * rT * 0.3, y: (Heel.y + Toe.y) * 0.5 - ny * rT * 0.3 };
    return `<path d="M ${f1(hT.x)} ${f1(hT.y)} Q ${f1(hB.x - ux * rH * 0.4)} ${f1(hB.y + ny * rH * 0.4)} ${f1(hB.x)} ${f1(hB.y)} Q ${f1(soleM.x)} ${f1(soleM.y)} ${f1(tBot.x)} ${f1(tBot.y)} Q ${f1(tTop.x + ux * rT * 0.4)} ${f1(tTop.y)} ${f1(tTop.x)} ${f1(tTop.y)} Q ${f1(bridge.x)} ${f1(bridge.y)} ${f1(aF.x)} ${f1(aF.y)} Z" fill="${skinC.fill}"/>`;
  }
  // A long garment (abaya, saree, kameez, punjabi, kurta) is ONE piece of cloth around the body, whatever the pose or view: the outline
  // of the solved cloth from the waist to the hem, front and back together. It never splits into strips, slides off a leg or lets a hip through.
  function clothShell(dr, pr, left, shinAt, waistA, waistB, onLap, lapDepth, scale) {
    const below = (n, t) => P(n.x, n.y - t, n.z), wide = (n, q = n) => [add(q, mul(left, -n.w)), add(q, mul(left, n.w))];
    const corners = (i) => (onLap
      ? [...wide(dr.front[i]), ...wide(dr.front[i], i <= 2 ? below(dr.front[i], lapDepth) : shinAt(dr.front[i].y)), // along the lap with the thigh's depth; falling from the knee it follows the shin, never a loose piece
         ...(i === 0 ? wide(dr.back[0]) : [])]
      : [...wide(dr.front[i]), ...wide(dr.back[i])]).map(pr);
    const base = [0, 1, 2, 3, 4].map(corners), levels = [];
    const cr = (a, b, c, d, t) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (3 * b - a - 3 * c + d) * t * t * t);
    for (let i = 0; i < 4; i++) for (let s = 0; s < (i === 3 ? 4 : 3); s++) {
      const t = s / 3; levels.push(base[i].map((_, n) => n).filter((n) => n < 4).map((n) => { const q = (m) => base[Math.max(0, Math.min(4, m))][n]; return { x: cr(q(i - 1).x, q(i).x, q(i + 1).x, q(i + 2).x, t), y: cr(q(i - 1).y, q(i).y, q(i + 1).y, q(i + 2).y, t) }; }));
    }
    const all = [[waistA, waistB], ...(onLap ? [base[0]] : []), ...levels];
    let d = ""; for (let i = 0; i < all.length - 1; i++) { const h = hull([...all[i], ...all[i + 1]]); d += (onLap && i < 2 ? roundPoly(h, 5 * scale) : "M " + h.map((q) => `${f1(q.x)} ${f1(q.y)}`).join(" L ") + " Z") + " "; } // the seat is round, never a box corner
    return { d, levels };
  }
  // ───────────────────────────── the person's own head (the same face, hair and marks as the waist-up rig) ─────────────────────────────
  // Art space: the look's paths from people.js (face about ±90 wide, crown near −100, chin near +115). `k` = art units → pixels.
  const NECK_DRAW = [4.6, 4.2], NECK_SINK = 7.5; // the drawn neck (U): thinner than the bone's capsule, the head a little lower on it
  const artPath = (d, fill, stroke, w, extra = "") => `<path d="${d}" fill="${fill || "none"}"${stroke ? ` stroke="${stroke}" stroke-width="${w}"` : ""} stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
  const zcFaces = () => root.ZC?.FACES || {};
  // the named mouths of the acting cards (engine/cartoon/library/acting.json mouthNames), front view, around the mouth's centre.
  // smirkL lifts the person's left corner (the screen's right). Talking (lip-sync) replaces them while a line is spoken.
  function mouthArt(name, w0, lip, inside, teeth, W) {
    const w = w0, P2 = (d, fill = "", stroke = lip, sw = 3.2, extra = "") => artPath(d, fill, stroke, W(sw), extra);
    switch (name) {
      case "smileClosed": return P2(`M${f1(-w * 1.15)},-5 Q0,10 ${f1(w * 1.15)},-5`);
      case "smileOpen": return P2(`M${f1(-w * 1.15)},-5 Q0,-1 ${f1(w * 1.15)},-5 Q0,22 ${f1(-w * 1.15)},-5Z`, inside) + `<path d="M${f1(-w * 0.9)},-3.6 Q0,0 ${f1(w * 0.9)},-3.6 L${f1(w * 0.8)},1 Q0,3.6 ${f1(-w * 0.8)},1Z" fill="${teeth}"/>`;
      case "grin": return P2(`M${f1(-w * 1.3)},-5 Q0,-1 ${f1(w * 1.3)},-5 Q0,17 ${f1(-w * 1.3)},-5Z`, teeth) + P2(`M${f1(-w * 1.05)},1 Q0,4 ${f1(w * 1.05)},1`, "", lip, 1.4);
      case "laugh": return P2(`M${f1(-w * 1.25)},-6 Q0,-2 ${f1(w * 1.25)},-6 Q0,32 ${f1(-w * 1.25)},-6Z`, inside) + `<path d="M${f1(-w)},-4.6 Q0,-1 ${f1(w)},-4.6 L${f1(w * 0.85)},1 Q0,4 ${f1(-w * 0.85)},1Z" fill="${teeth}"/><ellipse cx="0" cy="15" rx="${f1(w * 0.55)}" ry="5" fill="#d9656b"/>`;
      case "frownClosed": return P2(`M${f1(-w)},6 Q0,-6 ${f1(w)},6`);
      case "pout": return `<ellipse cx="0" cy="2" rx="${f1(w * 0.42)}" ry="6.5" fill="${lip}" opacity="0.85"/>` + P2(`M${f1(-w * 0.32)},2 Q0,0 ${f1(w * 0.32)},2`, "", "#3a1608", 1.4);
      case "lipBite": return P2(`M${f1(-w)},0 Q0,4 ${f1(w)},0`) + `<rect x="${f1(-w * 0.35)}" y="0.5" width="${f1(w * 0.7)}" height="4.5" rx="1.5" fill="${teeth}"/>`;
      case "tight": return P2(`M${f1(-w * 0.62)},1 L${f1(w * 0.62)},1`, "", lip, 3.8);
      case "openO": return `<ellipse cx="0" cy="3" rx="${f1(w * 0.45)}" ry="11" fill="${inside}" stroke="${lip}" stroke-width="${W(3)}"/>`;
      case "yawn": return `<ellipse cx="0" cy="8" rx="${f1(w * 0.62)}" ry="19" fill="${inside}" stroke="${lip}" stroke-width="${W(3)}"/><ellipse cx="0" cy="18" rx="${f1(w * 0.38)}" ry="6" fill="#d9656b"/>`;
      case "trembling": { const q = w / 3; return P2(`M${f1(-w)},3 q${f1(q / 2)},-4 ${f1(q)},0 t${f1(q)},0 t${f1(q)},0 t${f1(q)},0 t${f1(q)},0 t${f1(q)},0`); }
      case "smirkL": return P2(`M${f1(-w)},2 Q${f1(w * 0.1)},5 ${f1(w * 1.05)},-7`);
      case "smirkR": return P2(`M${f1(-w * 1.05)},-7 Q${f1(-w * 0.1)},5 ${f1(w)},2`);
      case "teethClenched": return `<rect x="${f1(-w)}" y="-6" width="${f1(w * 2)}" height="12" rx="5" fill="${teeth}" stroke="${lip}" stroke-width="${W(2.6)}"/>` + P2(`M${f1(-w + 2)},0 L${f1(w - 2)},0 M${f1(-w * 0.45)},-5 L${f1(-w * 0.45)},5 M0,-6 L0,6 M${f1(w * 0.45)},-5 L${f1(w * 0.45)},5`, "", "#b9ada0", 1.2);
      default: return P2(`M${f1(-w)},0 Q0,2 ${f1(w)},0`);
    }
  }
  const MOUTH_BIG = { laugh: 1.45, grin: 1.3, smileOpen: 1.3, openO: 1.3, yawn: 1.3, teethClenched: 1.2, smileClosed: 1.1, frownClosed: 1.1 };
  const mouthShape = (name, w, lip) => `<g transform="scale(${MOUTH_BIG[name] || 1})" data-mouth="${name}">${mouthArt(name, w, lip, "#5b2522", "#f8f4ec", (x) => f1(x))}</g>`;
  function headArt(L, mode, turn, o, ps, k) {
    const W = (x) => f1(Math.max(x, 0.9 / k)), line = L.line || "#3a1608", shade = L.shade || line, skin = L.skin || "#e8b791", hair = L.hair || "#1a1412";
    const fc = { smile: 0.3, raise: 0.1, inner: 0, lid: 0.08, ...(o.face && typeof o.face === "object" ? o.face : zcFaces()[o.face] || {}) } /* a name, or the dials themselves (ZC.feel) */, smile = o.smile ?? fc.smile;
    const open = Math.max(o.mouth || 0, fc.open || 0), rest = ps.posture === "sleep" || ps.posture === "sajdah";
    const closed = o.eyesClosed ?? ((o.blink || 0) > 0.6 || rest), style = L.hairStyle || "side", u = 107;
    const hijabC = L.hijabColor, capC = L.capColor || "#f8fafc";
    const U = (n) => f1(n * u);
    if (mode === "profile") {
      let back = "", top = "";
      const earP = hijabC ? "" : `<g data-part="ear"><ellipse cx="${U(0.06)}" cy="${U(0.08)}" rx="${U(0.15)}" ry="${U(0.24)}" fill="${shade}" opacity="0.32"/><ellipse cx="${U(0.02)}" cy="${U(0.06)}" rx="${U(0.14)}" ry="${U(0.23)}" fill="${o.fill || skin}"/>${artPath(`M${U(0.07)},${U(-0.08)} q${U(-0.1)},${U(0.12)} ${U(-0.01)},${U(0.26)}`, "", shade, W(3.2), ' opacity="0.75"')}</g>`;
      const shortHair = `M${U(-0.86)},${U(-0.1)} C${U(-0.9)},${U(-0.8)} ${U(-0.4)},${U(-1.12)} ${U(0.2)},${U(-1.06)} C${U(0.64)},${U(-1.02)} ${U(0.86)},${U(-0.72)} ${U(0.8)},${U(-0.44)} C${U(0.6)},${U(-0.56)} ${U(0.3)},${U(-0.6)} ${U(0.1)},${U(-0.5)} C${U(0.02)},${U(-0.3)} ${U(-0.1)},${U(-0.14)} ${U(-0.2)},${U(-0.04)} C${U(-0.4)},${U(0.1)} ${U(-0.6)},${U(0.26)} ${U(-0.78)},${U(0.3)}Z`;
      // the fall's length: 1 = long to the back; a man's long hair (hairLen 0.5, people.js) ends at the shoulder
      const HL = (v) => U(0.4 + (v - 0.4) * (L.hairLen ?? 1));
      if (style === "long") back += artPath(`M${U(-0.85)},${U(-0.4)} C${U(-1.02)},${U(0.4)} ${U(-0.98)},${HL(1.2)} ${U(-0.92)},${HL(2.1)} C${U(-0.6)},${HL(2.25)} ${U(-0.25)},${HL(2.2)} ${U(-0.1)},${HL(2.05)} C${U(-0.12)},${HL(1.3)} ${U(-0.08)},${HL(0.8)} ${U(-0.14)},${U(0.1)}Z`, hair);
      if (style === "bob") back += artPath(`M${U(-0.85)},${U(-0.4)} C${U(-1.04)},${U(0.2)} ${U(-1.0)},${U(0.6)} ${U(-0.94)},${U(0.86)} C${U(-0.6)},${U(0.98)} ${U(-0.25)},${U(0.94)} ${U(-0.08)},${U(0.8)} C${U(-0.1)},${U(0.5)} ${U(-0.08)},${U(0.3)} ${U(-0.14)},${U(0.1)}Z`, hair);
      if (style === "bun" && !hijabC) back += `<circle cx="${U(-0.84)}" cy="${U(-0.62)}" r="${U(0.3)}" fill="${hair}"/>`;
      const skull = `M${U(-0.05)},${U(-0.95)} C${U(0.5)},${U(-1.02)} ${U(0.82)},${U(-0.7)} ${U(0.8)},${U(-0.28)} L${U(0.98)},${U(0.02)} C${U(1.02)},${U(0.08)} ${U(0.9)},${U(0.14)} ${U(0.84)},${U(0.16)} L${U(0.86)},${U(0.36)} C${U(0.8)},${U(0.4)} ${U(0.76)},${U(0.46)} ${U(0.8)},${U(0.56)} C${U(0.72)},${U(0.84)} ${U(0.4)},${U(0.92)} ${U(0.1)},${U(0.8)} C${U(-0.3)},${U(0.7)} ${U(-0.78)},${U(0.4)} ${U(-0.8)},${U(-0.15)} C${U(-0.82)},${U(-0.7)} ${U(-0.5)},${U(-0.95)} ${U(-0.05)},${U(-0.95)}Z`;
      let face = artPath(skull, o.fill || skin);
      if (!hijabC) { const nh = Math.max(1, (o.neckHalf || 34) - W(2.5) * 0.6); face += `<rect x="${f1(-21 - nh)}" y="${U(0.45)}" width="${f1(nh * 2)}" height="${U(0.5)}" fill="${o.fill || skin}"/>`; }
      if (L.earring && !hijabC) face += `<circle cx="${U(0.03)}" cy="${U(0.34)}" r="${U(0.05)}" fill="#e0b545"/>`;
      face += `<ellipse cx="${U(0.52)}" cy="${U(0.3)}" rx="${U(0.2)}" ry="${U(0.12)}" fill="#e0786a" opacity="${L.blush ?? 0.15}"/>`;
      // the side face: one eye, one brow (the two brows' average), the mouth's profile; wink, squint, tears and sweat as from the front
      const brow1 = ((fc.browL || 0) + (fc.browR || 0)) / 2, by = -0.33 - fc.raise * 0.1 - brow1 * 0.18, sq = clamp(fc.squint || 0, 0, 1), lookY = Array.isArray(fc.look) ? clamp(fc.look[1] || 0, -1, 1) : 0;
      const winked = (fc.winkL || 0) > 0.5 || (fc.winkR || 0) > 0.5 || fc.wink === "L" || fc.wink === "R";
      if (closed) face += artPath(`M${U(0.4)},${U(-0.12)} q${U(0.14)},${U(0.08)} ${U(0.28)},0`, "", "#1d120c", W(3));
      else if (winked) face += artPath(`M${U(0.4)},${U(-0.1)} q${U(0.14)},${U(-0.09)} ${U(0.28)},0`, "", "#1d120c", W(3));
      else {
        const ey = -0.13 + fc.lid * 0.06 + sq * 0.03;
        face += artPath(`M${U(0.42)},${U(ey)} q${U(0.12)},${U(-0.11 * (1 - fc.lid) * (1 - sq * 0.5))} ${U(0.24)},0 q${U(-0.12)},${U(0.08 * (1 - sq * 0.7))} ${U(-0.24)},0Z`, "#fbf8f2", "#1d120c", W(1.5));
        face += `<circle cx="${U(0.58)}" cy="${U(ey - 0.01 - lookY * 0.03)}" r="${U(0.055 * (1 - sq * 0.3))}" fill="${L.iris || "#2f1c10"}"/>`;
        if (L.flick) face += artPath(`M${U(0.66)},${U(ey)} l${U(0.05)},${U(-0.05)}`, "", "#1d120c", W(2));
      }
      if ((fc.tears || 0) > 0.05) face += `<g opacity="${f1(0.4 + fc.tears * 0.6)}">${fc.tears > 0.45 ? artPath(`M${U(0.56)},${U(-0.04)} C${U(0.58)},${U(0.12)} ${U(0.54)},${U(0.24)} ${U(0.57)},${U(0.3 + fc.tears * 0.15)}`, "", "#8fd0f4", W(5)) : ""}<ellipse cx="${U(0.56)}" cy="${U(-0.04)}" rx="${U(0.03)}" ry="${U(0.045)}" fill="#8fd0f4"/></g>`;
      if ((fc.sweat || 0) > 0.05) face += `<path d="M${U(0.3)},${U(-0.5)} c${U(-0.05)},${U(0.08)} ${U(-0.06)},${U(0.13)} 0,${U(0.14)} c${U(0.06)},0 ${U(0.05)},${U(-0.06)} 0,${U(-0.14)}Z" fill="#bfe6fb" opacity="${f1(0.5 + fc.sweat * 0.5)}"/>`;
      face += artPath(`M${U(0.36)},${U(by)} q${U(0.18)},${U(-0.08)} ${U(0.34)},${U(-0.02)}`, "", L.brow || hair, W(L.browW || 7));
      const pm = fc.mouth && fc.mouth !== "rest" && open <= 0.1 ? fc.mouth : null, OPENS = { laugh: 0.9, yawn: 1, openO: 0.6, smileOpen: 0.45, grin: 0.35 };
      const pOpen = pm && OPENS[pm] ? OPENS[pm] : open, pSmile = pm ? ({ smileClosed: 0.8, smileOpen: 0.8, grin: 1, laugh: 1, smirkL: 0.6, smirkR: 0.6, frownClosed: -0.8, trembling: -0.4, pout: -0.2 })[pm] ?? 0 : smile;
      if (pOpen > 0.1) face += `<ellipse cx="${U(0.72)}" cy="${U(0.5)}" rx="${U(0.09)}" ry="${U(0.03 + pOpen * 0.1)}" fill="#5b2522" stroke="${L.lip || line}" stroke-width="${W(1.6)}"/>${pm === "grin" || pm === "laugh" ? `<rect x="${U(0.66)}" y="${U(0.46)}" width="${U(0.12)}" height="${U(0.03)}" fill="#f8f4ec"/>` : ""}`;
      else if (pm === "pout") face += `<ellipse cx="${U(0.8)}" cy="${U(0.5)}" rx="${U(0.05)}" ry="${U(0.045)}" fill="${L.lip || line}" opacity="0.85"/>`;
      else if (pm === "tight" || pm === "teethClenched" || pm === "lipBite") face += artPath(`M${U(0.64)},${U(0.49)} l${U(0.16)},0`, "", L.lip || line, W(3.4));
      else face += artPath(`M${U(0.62)},${U(0.48 - pSmile * 0.02)} q${U(0.08)},${U(0.03 + pSmile * 0.05)} ${U(0.18)},${U(0.02)}`, "", L.lip || line, W(3));
      if (L.beard) face += artPath(`M${U(0)},${U(0.12)} C${U(-0.05)},${U(0.5)} ${U(0.1)},${U(0.98)} ${U(0.55)},${U(0.98)} C${U(0.82)},${U(0.98)} ${U(0.92)},${U(0.72)} ${U(0.86)},${U(0.5)} C${U(0.7)},${U(0.58)} ${U(0.62)},${U(0.46)} ${U(0.72)},${U(0.34)} C${U(0.5)},${U(0.38)} ${U(0.3)},${U(0.3)} ${U(0.2)},${U(0.1)}Z`, hair);
      else if (L.stubble) face += artPath(`M${U(0.05)},${U(0.3)} C${U(0.1)},${U(0.8)} ${U(0.6)},${U(0.92)} ${U(0.8)},${U(0.56)} C${U(0.6)},${U(0.5)} ${U(0.3)},${U(0.42)} ${U(0.05)},${U(0.3)}Z`, hair, "", 0, ` opacity="0.22"`);
      if (L.beard || L.moustache) face += artPath(`M${U(0.56)},${U(0.36)} q${U(0.14)},${U(-0.05)} ${U(0.28)},${U(0.02)} q${U(-0.14)},${U(0.08)} ${U(-0.28)},${U(-0.02)}Z`, hair);
      if (L.glasses) face += artPath(`M${U(0.36)},${U(-0.28)} h${U(0.36)} v${U(0.26)} q0,${U(0.06)} ${U(-0.06)},${U(0.06)} h${U(-0.24)} q${U(-0.06)},0 ${U(-0.06)},${U(-0.06)}Z M${U(0.36)},${U(-0.2)} L${U(0.02)},${U(-0.06)}`, "#ffffff14", "#2a2420", W(3.4));
      if (hijabC) {
        top += artPath(`M${U(0.62)},${U(-0.72)} C${U(0.1)},${U(-1.16)} ${U(-0.78)},${U(-1.12)} ${U(-0.97)},${U(-0.35)} C${U(-1.14)},${U(0.3)} ${U(-1.05)},${U(1.1)} ${U(-0.72)},${U(1.72)} C${U(-0.2)},${U(2.0)} ${U(0.5)},${U(1.85)} ${U(0.92)},${U(1.3)} C${U(0.84)},${U(1.08)} ${U(0.66)},${U(0.98)} ${U(0.48)},${U(0.9)} C${U(0.3)},${U(0.72)} ${U(0.2)},${U(0.42)} ${U(0.18)},${U(0.02)} C${U(0.2)},${U(-0.36)} ${U(0.36)},${U(-0.62)} ${U(0.62)},${U(-0.72)}Z`, hijabC);
        top += artPath(`M${U(-0.62)},${U(-0.2)} C${U(-0.7)},${U(0.4)} ${U(-0.5)},${U(1.0)} ${U(-0.2)},${U(1.5)}`, "", foldHex(hijabC, 0.3), W(4), ' opacity="0.55"');
        top += artPath(`M${U(0.18)},${U(0.5)} C${U(0.1)},${U(0.9)} ${U(0.2)},${U(1.3)} ${U(0.44)},${U(1.58)}`, "", foldHex(hijabC, 0.3), W(4), ' opacity="0.55"');
      } else if (style === "bald") {
        top += artPath(`M${U(-0.78)},${U(-0.1)} C${U(-0.82)},${U(0.1)} ${U(-0.7)},${U(0.3)} ${U(-0.5)},${U(0.42)} C${U(-0.4)},${U(0.25)} ${U(-0.3)},${U(0.05)} ${U(-0.3)},${U(-0.2)} C${U(-0.45)},${U(-0.3)} ${U(-0.65)},${U(-0.3)} ${U(-0.78)},${U(-0.1)}Z`, hair);
      } else {
        top += artPath(shortHair, hair);
        if (L.cap) top += artPath(`M${U(-0.62)},${U(-0.6)} C${U(-0.62)},${U(-1.24)} ${U(0.62)},${U(-1.24)} ${U(0.74)},${U(-0.58)} C${U(0.3)},${U(-0.72)} ${U(-0.25)},${U(-0.72)} ${U(-0.62)},${U(-0.6)}Z`, capC);
      }
      // a crown seen from the side: the band on the hair, three points rising (people.js extras "crown")
      if (L.crown) top += artPath(`M${U(-0.66)},${U(-0.92)} L${U(-0.7)},${U(-1.14)} L${U(-0.5)},${U(-1.38)} L${U(-0.3)},${U(-1.16)} L${U(0.05)},${U(-1.46)} L${U(0.32)},${U(-1.16)} L${U(0.55)},${U(-1.38)} L${U(0.72)},${U(-1.12)} L${U(0.7)},${U(-0.9)} C${U(0.3)},${U(-0.98)} ${U(-0.3)},${U(-0.98)} ${U(-0.66)},${U(-0.92)}Z`, L.crown)
        + artPath(`M${U(-0.68)},${U(-1.02)} C${U(-0.3)},${U(-1.1)} ${U(0.3)},${U(-1.1)} ${U(0.71)},${U(-1.0)} L${U(0.7)},${U(-0.9)} C${U(0.3)},${U(-0.98)} ${U(-0.3)},${U(-0.98)} ${U(-0.66)},${U(-0.92)}Z`, foldHex(L.crown, 0.35));
      return back + face + top + earP;
    }
    if (mode === "back") {
      let out = "";
            if (!hijabC) for (const s of [-1, 1]) out += `<ellipse cx="${s * (L.earX || 88)}" cy="6" rx="15" ry="25" fill="${o.fill || skin}"/>`;
      if (hijabC) return out + artPath(`M-120,60 C-138,-120 -64,-196 0,-196 C64,-196 138,-120 120,60 C116,150 70,196 0,202 C-70,196 -116,150 -120,60Z`, hijabC) + artPath("M-50,-120 C-62,-30 -56,80 -30,170 M56,-110 C66,-20 58,90 34,166", "", foldHex(hijabC, 0.3), W(4), ' opacity="0.5"');
      out += artPath(L.face, o.fill || skin);
      if (style === "bald") return out + artPath("M-98,6 C-72,46 72,46 98,6 C94,58 52,86 0,88 C-52,86 -94,58 -98,6Z", hair);
      // seen from behind: long hair falls past the ears; short hair ends at a nape line above the collar, the ears stand out at the
      // sides over its edge, and a few soft strands from the crown give the hair a direction (fold-like detail, not an outline)
      const longish = style === "long" || style === "bob", sheen = foldHex(hair, 0.5);
      if (longish) out += artPath(`M-98,50 C-112,-110 -60,-186 0,-186 C60,-186 112,-110 98,50 C60,84 -60,84 -98,50Z`, hair);
      else out += artPath(`M-102,-6 C-114,-118 -62,-188 0,-188 C62,-188 114,-118 102,-6 C100,34 84,58 58,70 C34,62 14,66 0,80 C-14,66 -34,62 -58,70 C-84,58 -100,34 -102,-6Z`, hair);
      if (L.bun) out += `<circle cx="0" cy="-70" r="40" fill="${hair}"/>`;
      if (longish && L.hairBehind) out += artPath(L.hairBehind, hair);
      out += artPath(longish ? "M-8,-170 C-40,-120 -60,-40 -66,40 M10,-170 C30,-110 52,-40 60,40 M0,-176 C-6,-100 -4,-20 0,50" : "M0,-150 C-30,-150 -58,-120 -70,-60 M0,-150 C32,-148 60,-118 72,-62 M0,-150 C-10,-110 -16,-40 -20,30 M0,-150 C12,-108 20,-40 24,28", "", sheen, W(4), ' data-detail="1" opacity="0.45"');
      if (!longish && !L.cap) for (const s of [-1, 1]) { const ex = s * ((L.earX || 88) + 10); out += `<g data-part="ear"><ellipse cx="${ex}" cy="10" rx="16" ry="26" fill="${o.fill || skin}"/><ellipse cx="${ex - s * 3}" cy="10" rx="8" ry="16" fill="${shade}" opacity="0.28"/></g>`; }
      if (L.cap) out += artPath("M-84,-90 C-82,-172 82,-172 84,-90 C40,-104 -40,-104 -84,-90Z", capC);
      if (L.crown) out += artPath("M-80,-150 L-82,-184 L-56,-214 L-36,-184 L0,-238 L36,-184 L56,-214 L82,-184 L80,-150 C40,-158 -40,-158 -80,-150Z", L.crown) + artPath("M-81,-168 C-40,-176 40,-176 81,-168 L80,-150 C40,-158 -40,-158 -80,-150Z", foldHex(L.crown, 0.35));
      return out;
    }
    // front and 3/4: the rig's drawing; features slide toward where the head turns
    const fx = turn * 26, skinFill = o.fill || skin;
    let out = "";
    if (L.hairBack && L.hairBack !== "M0,0Z") out += artPath(L.hairBack, hair);
    if (L.bun) out += `<circle cx="${f1(84 - turn * 16)}" cy="-116" r="34" fill="${hair}"/>`;
    // the ears: the far one turns away behind the head; the near one comes onto the side of the face and stays visible.
    // Long hair and a hijab cover them; short hair leaves them showing, drawn over the hair's edge.
    const covered = hijabC || style === "long" || style === "bob", earOf = (s) => {
      const near = s * turn < -0.12, ex = s * ((L.earX || 88) + 3 - Math.abs(turn) * (near ? 12 : 0));
      const ring = artPath(`M${f1(ex - s * 4)},-10 q${s * 9},13 ${f1(s * 1)},27`, "", shade, W(3.2), ' opacity="0.75"');
      return `<g data-part="ear">${near ? `<ellipse cx="${f1(ex - s * 5)}" cy="8" rx="17" ry="26" fill="${shade}" opacity="0.32"/>` : ""}<ellipse cx="${f1(ex)}" cy="6" rx="16" ry="25" fill="${skinFill}"/>${ring}${L.earring ? `<circle cx="${f1(ex)}" cy="34" r="5" fill="#e0b545"/>` : ""}</g>`;
    };
    let earsOver = "";
    for (const s of [-1, 1]) {
      if (s * turn > 0.32) continue; // the far ear turns away
      if (covered || s * turn > -0.12) out += earOf(s); else earsOver += earOf(s);
    }
    out += artPath(L.face, skinFill);
    out += `<g transform="translate(${f1(fx)} 0)">`;
    for (const s of [-1, 1]) out += `<ellipse cx="${s * 52}" cy="38" rx="22" ry="13" fill="#e0786a" opacity="${L.blush ?? 0.15}"/>`;
    if (L.nose) out += artPath(L.nose, "", shade, W(3.5));
    for (const d of L.lines || []) out += artPath(d, "", shade, W(2), ` opacity="0.3"`);
    for (const [mx, my, mr] of L.moles || []) out += `<circle cx="${mx}" cy="${my}" r="${mr}" fill="#5a3020" opacity="0.8"/>`;
    for (const [mx, my] of L.freckles || []) out += `<circle cx="${mx}" cy="${my}" r="1.6" fill="${shade}" opacity="0.45"/>`;
    const my = L.mouthY ?? 70, mw = ((L.mouthW ?? 19) + 6 * Math.max(0, smile)) * (1 - 0.32 * clamp(open >= 0.06 ? o.mouthRound || 0 : 0, 0, 1)), cy = -6 * smile; // a round vowel narrows the open mouth
    const lipC = L.lip || line, inside = "#5b2522", teeth = "#f8f4ec", shape = (fc.mouth && fc.mouth !== "rest" && open < 0.06) ? fc.mouth : null;
    const BIG = { laugh: 1.45, grin: 1.3, smileOpen: 1.3, openO: 1.3, yawn: 1.3, teethClenched: 1.2, smileClosed: 1.1, frownClosed: 1.1 }; // open mouths read from a full shot
    if (shape) out += `<g transform="translate(0 ${my}) scale(${BIG[shape] || 1})" data-mouth="${shape}">${mouthArt(shape, L.mouthW ?? 19, lipC, inside, teeth, W)}</g>`;
    else if (open < 0.06) out += `<g transform="translate(0 ${my})">${artPath(`M${f1(-mw)},${f1(cy)} Q0,${f1(2 + 7 * smile)} ${f1(mw)},${f1(cy)}`, "", lipC, W(3.2))}</g>`;
    else { const tp = -2 - 2 * open, bt = 2 + 24 * open; out += `<g transform="translate(0 ${my})">${artPath(`M${f1(-mw)},${f1(cy)} C${f1(-mw * 0.6)},${f1(tp)} ${f1(mw * 0.6)},${f1(tp)} ${f1(mw)},${f1(cy)} C${f1(mw * 0.7)},${f1(bt)} ${f1(-mw * 0.7)},${f1(bt)} ${f1(-mw)},${f1(cy)}Z`, inside, lipC, W(3.2))}${open > 0.22 ? `<rect x="${f1(-mw * 0.7)}" y="${f1(tp + 1)}" width="${f1(mw * 1.4)}" height="${f1(Math.min(8, bt * 0.35))}" fill="${teeth}"/>` : ""}</g>`; }
    const lid = fc.lid;
    for (const s of [-1, 1]) {
      const ew = s * turn < -0.2 ? 0.82 : 1, tr = `translate(${s * (L.eyeX ?? 36)} ${L.eyeY ?? -6}) scale(${ew} 1)`;
      // the screen's right eye is the person's left (the front view faces us); a wink closes one eye in a happy arc
      const side = s > 0 ? "L" : "R", wink = Math.max(fc["wink" + side] || 0, fc.wink === side ? 1 : 0);
      if (closed) { out += `<g transform="${tr}">${artPath("M-20,2 Q0,12 20,2", "", "#1d120c", W(L.lash || 3.4))}</g>`; continue; }
      if (wink > 0.5) { out += `<g transform="${tr}">${artPath("M-20,4 Q0,-8 20,4", "", "#1d120c", W(L.lash || 3.4))}</g>`; continue; }
      const sq = clamp(fc.squint || 0, 0, 1), c = -20 + lid * 22 + sq * 7, low = 18 - sq * 13, look = Array.isArray(fc.look) ? fc.look : [0, 0];
      const ix = turn * 5 + (o.gaze || 0) * 7 + clamp(look[0] || 0, -1, 1) * 8, iy = lid * 3 - clamp(look[1] || 0, -1, 1) * 5 + sq * 2;
      out += `<g transform="${tr}">${artPath(`M-20,1 Q0,${f1(c - 4)} 20,1 Q0,18 -20,1Z`, "#fbf8f2", "#1d120c", W(1.2))}<circle cx="${f1(ix)}" cy="${f1(iy)}" r="9.5" fill="${L.iris || "#2f1c10"}"/><circle cx="${f1(ix)}" cy="${f1(iy)}" r="4.6" fill="#120a06"/><circle cx="${f1(ix - 3)}" cy="${f1(iy - 3.5)}" r="2.6" fill="#fff"/>${sq > 0.05 ? `<path d="M-21,1 Q0,${f1(low)} 21,1 L21,20 L-21,20Z" fill="${o.fill || skin}"/>` : ""}${artPath(`M-19.5,0.5 Q0,${f1(c)} 19.5,0.5`, "", "#1d120c", W(L.lash || 3.4))}${sq > 0.3 ? artPath(`M-16,${f1(low * 0.55 + 2)} Q0,${f1(low * 0.75)} 16,${f1(low * 0.55 + 2)}`, "", shade, W(1.6), ' opacity="0.5"') : ""}${L.flick ? artPath(`M${s * 19},0 l${s * 8},-4 M${s * 14},-5 l${s * 6},-6`, "", "#1d120c", W(2.2)) : ""}</g>`;
      // tears: a drop on the lower lid, a line down the cheek when they run
      const tears = clamp(fc.tears || 0, 0, 1);
      if (tears > 0.05) out += `<g transform="translate(${s * (L.eyeX ?? 36)} ${L.eyeY ?? -6})" opacity="${f1(0.4 + tears * 0.6)}">${tears > 0.45 ? artPath(`M${s * 8},14 C${s * 10},30 ${s * 6},44 ${s * 9},${f1(44 + tears * 22)}`, "", "#8fd0f4", W(5)) : ""}<path d="M${s * 8},10 c-4,6 -4,11 0,11 c4,0 4,-5 0,-11Z" fill="#8fd0f4"/></g>`;
    }
    for (const q of L.overFace || []) out += artPath(q.d, q.fill || "", q.stroke || "", W(q.w || 0), q.opacity != null ? ` opacity="${q.opacity}"` : "");
    const sweat = clamp(fc.sweat || 0, 0, 1);
    if (sweat > 0.05) out += `<g opacity="${f1(0.5 + sweat * 0.5)}" transform="translate(66 -46) scale(${f1(0.7 + sweat * 0.6)})"><path d="M0,-12 C-6,-2 -8,4 -8,8 a8,8 0 0 0 16,0 C8,4 6,-2 0,-12Z" fill="#bfe6fb"/><circle cx="-3" cy="5" r="2.2" fill="#fff"/></g>`;
    for (const s of [-1, 1]) { const r = fc.raise * 11 + (fc[s > 0 ? "browL" : "browR"] || 0) * 26, inn = fc.inner * 7, by = L.browY ?? -32; out += artPath(`M${s * 16},${f1(by - r - inn)} Q${s * 36},${f1(by - 9 - r - inn * 0.3)} ${s * 57},${f1(by - 2 - r + inn * 0.35)}`, "", L.brow || hair, W((L.browW || 7) * 1.1)); }
    out += `</g><g transform="translate(${f1(turn * 6)} 0)">`;
    if (L.hairFront && L.hairFront !== "M0,0Z") {
      out += artPath(L.hairFront, hair);
      for (const d of L.shine || []) out += artPath(d, "", L.hairShine || hair, W(6), ` opacity="0.45"`);
    }
    for (const q of L.overHead || []) out += artPath(q.d, q.fill || "", q.stroke || "", W(q.w || 0), `${q.rule ? ` fill-rule="${q.rule}"` : ""}`);
    out += "</g>" + earsOver;
    return out;
  }
  // one tapered strip of cloth through a line of points (a dupatta, a pallu): never a chain of capsules
  function clothRibbon(pts, r0, r1, c, sw, edge) {
    const n = pts.length, A = [], B = [];
    pts.forEach((q, i) => {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1, r = lerp(r0, r1, i / Math.max(1, n - 1));
      A.push({ x: q.x - (dy / d) * r, y: q.y + (dx / d) * r }); B.push({ x: q.x + (dy / d) * r, y: q.y - (dx / d) * r });
    });
    const Br = B.slice().reverse(), d = `M ${f1(A[0].x)} ${f1(A[0].y)}${catmullSegs(A)} L ${f1(Br[0].x)} ${f1(Br[0].y)}${catmullSegs(Br)} Z`;
    return `<path d="${d}" fill="${c.fill}"/>${edge ? `<path d="M ${f1(A[0].x)} ${f1(A[0].y)}${catmullSegs(A)}" fill="none" stroke="${edge}" stroke-width="${f1(Number(sw) * 1.2)}" stroke-linecap="round"/>` : ""}`;
  }
  function svg(ps, o = {}) {
    const view = o.view || "front", gid = garmentKey(o.garment || "none"), g = GARMENTS[gid], dressed = gid !== "none";
    const dr = dressed ? o.drape || drape(ps, gid, o.cloth || {}) : null, j = ps.joints, prof = ps.profile, lt = prof.limbThick, la = prof.armThick ?? lt, ll = prof.legThick ?? lt, lc = prof.chestThick ?? lt, lw = prof.waistThick ?? lt, lp = prof.pelvisThick ?? lt;
    // H15b thickness per body part (arms, legs, chest, waist, pelvis; the neck and bag straps keep limbThick)
    const TH = { upperArm: [la, la], forearm: [la, la], hand: [la, la], thigh: [ll, ll], calf: [ll, ll], heel: [ll, ll], foot: [ll, ll], toe: [ll, ll], pelvis_lumbar: [lp, lw], lumbar_thorax: [lw, lc], clavicle: [lc, la], pelvis_hip: [lp, ll], neck: [lt, lt] };
    const xs = JOINTS.map((k) => j[k]), center = o.center || P(xs.reduce((s, p) => s + p.x, 0) / xs.length, 0, xs.reduce((s, p) => s + p.z, 0) / xs.length);
    const po = { ...o, center }, pr = (p) => project(p, view, po), p = Object.fromEntries(JOINTS.map((k) => [k, pr(j[k])]));
    const profileView = view === "side" || view === "sideLeft", L = o.look || null;
    const xray = dressed ? (o.xray ?? (L ? 1 : 0.35)) : 0.95, items = [];
    const push = (depth, html) => { const it = { depth, html }; items.push(it); return it; };
    const armItems = { L: [], R: [] }; let lapTopD = -Infinity;
    const lateUnder = [], armShapes = {}; let underDepth = p.thorax.depth - 1, lateHead = null;
    const norm2 = (A, B) => { const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy) || 1; return { x: dx / d, y: dy / d }; };
    // the drawn shoulder sits a little below its joint, so the arm hangs from a slope and never rises round beside the neck (the bone itself does not move)
    const dropShoulder = (S, r, down, E) => { const h = E ? norm2(S, E) : down, k = clamp(h.x * down.x + h.y * down.y, 0, 1) * 0.62; return { x: S.x + down.x * r * k, y: S.y + down.y * r * k, depth: S.depth, scale: S.scale }; };
    const W = o.width || 420, H = o.height || 360, gy = pr(P(center.x, 0, center.z)).y;
    let out = o.groundLine === false ? "" : `<line x1="10" y1="${f1(gy)}" x2="${W - 10}" y2="${f1(gy)}" stroke="#38bdf8" stroke-width="1.4" stroke-opacity="0.6"/>`;
    if (o.drawProps !== false) {
      for (const id of ps.props) for (const [label, c, h, kind] of PROPS[id].boxes) {
        const pts = [];
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) pts.push(pr(P(c.x + sx * h.x, c.y + sy * h.y, c.z + sz * h.z)));
        const x0 = Math.min(...pts.map((q) => q.x)), x1 = Math.max(...pts.map((q) => q.x)), y0 = Math.min(...pts.map((q) => q.y)), y1 = Math.max(...pts.map((q) => q.y));
        const col = kind === "table" ? "#10b981" : kind === "leg" ? "#475569" : "#38bdf8", bias = DRAW_BIAS["prop_" + (kind === "leg" ? "chair" : kind)] || 0;
        const fill = L ? (kind === "table" ? "#8b5a2b" : kind === "leg" ? "#5c3a21" : kind === "pillow" ? "#f8fafc" : "#cbd5e1") : "rgba(15,23,42,0.6)";
        const stroke = L ? "#291d12" : col;
        push(pr(c).depth + bias, `<rect x="${f1(x0)}" y="${f1(y0)}" width="${f1(x1 - x0)}" height="${f1(y1 - y0)}" rx="3" fill="${fill}"${L ? "" : ` stroke="${stroke}" stroke-width="1.2" stroke-dasharray="4 2"`}/>${!L && label ? `<text x="${f1(x0 + 4)}" y="${f1(y0 + 10)}" fill="${col}" font-family="monospace" font-size="8">${label}</text>` : ""}`);
      }
    }
    if (!L || o.style === "skeleton") {
      for (const [id, a, b, key] of BODY_CAPSULES) {
        const r = RADII[key], rr = Array.isArray(r) ? r : r[profileView ? "profile" : "front"], A = p[a], B = p[b], d = (A.depth + B.depth) / 2;
        const crisp = /hand|foot|toe|heel|neck/.test(id);
        const alpha = crisp ? 0.92 : xray;
        const c = tone(d, id.endsWith("_L") ? 202 : 196, false, alpha);
        if (o.style === "skeleton") push(d, `<line x1="${f1(A.x)}" y1="${f1(A.y)}" x2="${f1(B.x)}" y2="${f1(B.y)}" stroke="${c.stroke}" stroke-width="2"/><circle cx="${f1(A.x)}" cy="${f1(A.y)}" r="3" fill="#060a12" stroke="${c.stroke}" stroke-width="1.5"/>`);
        else push(d + (dressed ? DRAW_BIAS.body_under_cloth : 0), `<path d="${capsulePath(A, B, rr[0] * (TH[key] || [lt, lt])[0] * A.scale, rr[1] * (TH[key] || [lt, lt])[1] * B.scale)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.2" stroke-opacity="${alpha}"/>`);
      }
    } else {
      // Seamless Cartoon Body Renderer (L mode): continuous Catmull-Rom limbs, sculpted hands, sculpted feet/sandals
      const skinHex = L.skin || "#e8b791", lineHex = L.line || "#3a1608", shortSleeve = dressed && g.sleeves === "full" && o.cloth?.short;
      const bareFeet = o.barefoot ?? (ps.posture === "sleep" || ps.posture === "ruku" || ps.posture === "sajdah");
      const bBias = dressed ? DRAW_BIAS.body_under_cloth : 0;
      const armDown = norm2(p.thorax, p.lumbar);
      if (!dressed) {
        const k = profileView ? "profile" : "front";
        const rP = RADII.pelvis_lumbar[k][0] * lp * p.pelvis.scale, rL = RADII.pelvis_lumbar[k][1] * lw * p.lumbar.scale, rT = RADII.lumbar_thorax[k][1] * lc * p.thorax.scale;
        const tr = smoothLimb(p.pelvis, p.lumbar, p.thorax, rP, (rP + rL) * 0.5, rL, (rL + rT) * 0.5, rT);
        const cT = lookTone((p.pelvis.depth + p.thorax.depth) * 0.5, skinHex, lineHex);
        push((p.pelvis.depth + p.thorax.depth) * 0.5, `<path d="${tr.outline}" fill="${cT.fill}"/>`);
      }
      for (const s of ["L", "R"]) {
        // Legs & Sculpted Feet
        const H_ = p["hip" + s], K_ = p["knee" + s], N_ = p["ankle" + s], Hl = p["heel" + s], Ft = p["foot" + s], To = p["toe" + s];
        const legD = (H_.depth + K_.depth + N_.depth) / 3, swL = f1(1.35 * N_.scale);
        const cLeg = lookTone(legD, skinHex);
        if (!dressed || !g.lower) {
          const [rH0, rK0] = RADII.thigh, [rK1, rA0] = RADII.calf;
          const lg = smoothLimb(H_, K_, N_, rH0 * ll * H_.scale, ((rH0 + rK0) * 0.5) * ll * H_.scale, rK0 * ll * K_.scale, ((rK1 + rA0) * 0.5) * ll * K_.scale, rA0 * ll * N_.scale);
          push(legD + bBias, `<path d="${lg.outline}" fill="${cLeg.fill}"/>`);
        } else {
          // Ankle connection between trouser cuff and a bare foot (a shoe covers it)
          const rA0 = RADII.calf[1] * ll * N_.scale;
          if (bareFeet) push(N_.depth + bBias, `<path data-part="ankle" d="${capsulePath(lerp3(K_, N_, 0.78), N_, rA0 * 1.04, rA0 * 0.96)}" fill="${cLeg.fill}"/>`);
        }
        // shoe rule: the shoe's mouth is inside the trouser hem (never skin or a gap between them), so the shoe is drawn under its leg
        push(dressed && g.lower && !bareFeet ? legD + DRAW_BIAS.trouser - 0.01 : (N_.depth + Ft.depth) * 0.5, sculptedFoot(N_, Hl, Ft, To, lookTone(Ft.depth, skinHex, lineHex), L.shoe || "#5a3a24", swL, bareFeet, ll));

        // Arms & Sculpted Hands
        const S_ = p["shoulder" + s], E_ = p["elbow" + s], Wr = p["wrist" + s], Hnd = p["hand" + s];
        const armBaseD = S_.depth > p.thorax.depth + 4 ? Math.max((S_.depth + E_.depth + Wr.depth) / 3, S_.depth) : (S_.depth + E_.depth + Wr.depth) / 3;
        const armD = armBaseD, farArm = S_.depth < p["shoulder" + (s === "L" ? "R" : "L")].depth - 3;
        const armHex = farArm ? mixHex(skinHex, "#3a1608", 0.1) : skinHex, cArm = { fill: armHex }, Sd = dropShoulder(S_, RADII.upperArm[0] * la * S_.scale, armDown, E_);
        if (!dressed || g.sleeves !== "full" || shortSleeve) {
          const [rS0, rE0] = RADII.upperArm, [rE1, rW0] = RADII.forearm;
          const covered = dressed && (shortSleeve || g.sleeves === "choli"), from = covered ? lerp3(Sd, E_, 0.3) : Sd; from.depth = S_.depth; from.scale = S_.scale;
          const ar = smoothLimb(from, E_, Wr, (covered ? (rS0 + rE0) * 0.5 : rS0) * la * S_.scale, ((rS0 + rE0) * 0.5) * la * S_.scale, rE0 * 0.94 * la * E_.scale, ((rE1 + rW0) * 0.46) * la * E_.scale, rW0 * 0.8 * la * Wr.scale, !covered, true);
          armShapes[s] = { outline: ar.outline, depth: armD + bBias, hex: skinHex };
          armItems[s].push(push(armD + bBias, `<path data-part="arm" d="${ar.outline}" fill="${cArm.fill}"/>${ar.crease && !o.cloth?.short ? fold(ar.crease, foldHex(cArm.fill, 0.34), 0.8 * E_.scale, 0.6) : ""}`));
        }
        armItems[s].push(push(Math.max((Wr.depth + Hnd.depth) * 0.5, armBaseD) + 3.2, sculptedHand(Wr, Hnd, { fill: armHex }, (ps.handPoses || [])[s === "L" ? 0 : 1] || "rest", s === "L" ? 1 : -1, RADII.forearm[1] * la * Wr.scale, E_, Math.hypot(j["hand" + s].x - j["wrist" + s].x, j["hand" + s].y - j["wrist" + s].y, j["hand" + s].z - j["wrist" + s].z), Math.sign(Wr.x - p.thorax.x) || 1, Math.hypot(j["wrist" + s].x - j["elbow" + s].x, j["wrist" + s].y - j["elbow" + s].y, j["wrist" + s].z - j["elbow" + s].z))));
      }
    }
    { // head: one hull from the neck top (H02: no gap), plus the gaze line or 3D-projected ZanHuman facial features
      const hd = p.head, r3D = RADII.head * prof.headScale, rH = r3D * hd.scale;
      let headSvg = "";
      const c = L ? lookTone(hd.depth, L.skin || "#e8b791", L.line || "#3a1608") : tone(hd.depth, 198, false, 0.95);
      const gz = pr(add(j.head, mul(ps.head.forward, 14)));
      if (!L) {
        const face = gz.depth - hd.depth >= -1
          ? `<line x1="${f1(hd.x)}" y1="${f1(hd.y)}" x2="${f1(gz.x)}" y2="${f1(gz.y)}" stroke="#38bdf8" stroke-width="1.8"/><circle cx="${f1(gz.x)}" cy="${f1(gz.y)}" r="2.2" fill="#38bdf8"/>` : "";
        push(hd.depth + DRAW_BIAS.head, `<path d="${capsulePath(p.neckTop, hd, RADII.neck[0] * p.neckTop.scale, rH)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.6"/><circle cx="${f1(hd.x)}" cy="${f1(hd.y)}" r="${f1(rH)}" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.6"/>${face}`);
      } else {
        // The person's own head: the same face, hair and marks as the waist-up rig, turned to where the 3D head points
        const F = frame(j), hUp = norm(sub(j.head, j.neckBase), F.up);
        const hFwd = norm(perp(ps.head.forward, hUp), F.fwd), hLeft = norm(cross(hUp, hFwd), F.left);
        const ptH = (lx, ly, lz) => pr(add(j.head, add(add(mul(hLeft, lx * r3D), mul(hUp, ly * r3D)), mul(hFwd, lz * r3D))));
        const crP = ptH(0, 1, 0); let cdx = crP.x - hd.x, cdy = crP.y - hd.y, cd = Math.hypot(cdx, cdy);
        if (cd < rH * 0.2) { const a2 = pr(j.neckTop); cdx = hd.x - a2.x; cdy = hd.y - a2.y; cd = Math.hypot(cdx, cdy) || 1; } // the head seen from straight above: up follows the neck
        const ux = cdx / cd, uy = cdy / cd, fP = ptH(0, 0, 1), turn = clamp(((fP.x - hd.x) * -uy + (fP.y - hd.y) * ux) / rH, -1, 1), away = fP.depth < hd.depth - 1;
        const artK = rH / 107, mode = away && Math.abs(turn) < 0.75 ? "back" : Math.abs(turn) > 0.82 ? "profile" : "front";
        const rot = (Math.atan2(uy, ux) * 180) / Math.PI + 90, sx = mode === "profile" && turn < 0 ? -artK : artK;
        const art = headArt(L, mode, mode === "front" ? turn : 0, { ...o, fill: c.fill, neckHalf: (NECK_DRAW[1] * lt * p.neckTop.scale) / artK }, ps, artK);
        // the head sits a little down the neck bone so the visible neck is about a third of the head (the bones keep their length)
        const sink = NECK_SINK / Math.max(1, RADII.neck[1] + 8.5), hc = { x: lerp(hd.x, p.neckTop.x, sink), y: lerp(hd.y, p.neckTop.y, sink) };
        const place = `translate(${f1(hc.x)} ${f1(hc.y)}) rotate(${f1(rot)}) scale(${sx.toFixed(4)} ${artK.toFixed(4)}) translate(${mode === "profile" ? 21 : 0} ${mode === "profile" ? 0 : -8})`;
        headSvg = `<g data-part="head" transform="${place}">${art}</g>`;
        // the neck goes under the clothes and into the head: filled only, no outline at all, so it reads as one with the head and the body (as on the waist-up rig)
        const nA0 = p.neckBase, nB = hc, nd0 = Math.hypot(nB.x - nA0.x, nB.y - nA0.y) || 1, reachDown = NECK_DRAW[0] * lt * p.neckBase.scale * 2.4, nA = { ...nA0, x: nA0.x - ((nB.x - nA0.x) / nd0) * reachDown, y: nA0.y - ((nB.y - nA0.y) / nd0) * reachDown }, ndx = nB.x - nA.x, ndy = nB.y - nA.y, nd = Math.hypot(ndx, ndy) || 1, nnx = -ndy / nd, nny = ndx / nd; // the neck runs on under the collar
        const nR0 = NECK_DRAW[0] * lt * p.neckBase.scale, nR1 = NECK_DRAW[1] * lt * p.neckTop.scale;
        const neckFill = L.hijabColor || c.fill;
        // the chin's shade (light from above and in front): the jaw shades only the top of the throat, just under the chin. Its length
        // follows the head: longer when the head bows, almost gone when it looks up; from the side it lies on the throat (the face's side)
        // only, the nape stays lit; from behind there is none. t runs along the neck from its base (0) to the head's centre (1).
        let chin = "";
        if (!L.hijabColor && mode !== "back") {
          const nW = (t, s) => { const r = lerp(nR0, nR1, t); return `${f1(lerp(nA.x, nB.x, t) + nnx * r * s)} ${f1(lerp(nA.y, nB.y, t) + nny * r * s)}`; };
          const tJaw = clamp(1 - ((mode === "profile" ? 0.72 : 0.78) * rH) / nd, 0.05, 0.95), pitch = clamp(ps.head.forward.y, -1, 1);
          const share = clamp(0.4 - pitch * 0.7, 0.08, 0.66), tEnd = tJaw * (1 - share);
          const chinHex = foldHex(c.fill, 0.24);
          if (mode === "profile") {
            const face = Math.sign((fP.x - hd.x) * nnx + (fP.y - hd.y) * nny) || 1, f = (s) => s * face;
            chin = `<path data-chin="1" d="M ${nW(1, f(-0.15))} L ${nW(1, f(1))} L ${nW(tEnd, f(1))} Q ${nW(lerp(tEnd, tJaw, 0.55), f(0.15))} ${nW(tJaw, f(-0.15))} Z" fill="${chinHex}" fill-opacity="0.6"/>`;
          } else {
            chin = `<path data-chin="1" d="M ${nW(1, 1)} L ${nW(lerp(tEnd, tJaw, 0.45), 1)} Q ${nW(tEnd - (tJaw - tEnd) * 0.6, 0)} ${nW(lerp(tEnd, tJaw, 0.45), -1)} L ${nW(1, -1)} Z" fill="${chinHex}" fill-opacity="0.55"/>`;
          }
        }
        lateUnder.push(`<g data-part="neck"><path d="M ${f1(nA.x + nnx * nR0)} ${f1(nA.y + nny * nR0)} L ${f1(nB.x + nnx * nR1)} ${f1(nB.y + nny * nR1)} L ${f1(nB.x - nnx * nR1)} ${f1(nB.y - nny * nR1)} L ${f1(nA.x - nnx * nR0)} ${f1(nA.y - nny * nR0)} Z" fill="${neckFill}"/>${chin}</g>`);
        if (L.hairBehind && mode === "front") lateUnder.unshift(`<g transform="${place}">${artPath(L.hairBehind, L.hair || "#1a1412", "#0c0807", f1(Math.max(2, 0.9 / artK)))}</g>`);
        lateHead = { depth: hd.depth + DRAW_BIAS.head, html: headSvg };
      }
    }
    function backpack(B, bodD) {
      const F = frame(j), S3L = j.shoulderL, S3R = j.shoulderR, cd = GARMENT_RADII.bodice.thorax[1] * lt, bd = 5.2 * lt;
      const tLen = Math.hypot(j.thorax.x - j.pelvis.x, j.thorax.y - j.pelvis.y, j.thorax.z - j.pelvis.z), sW = Math.hypot(S3L.x - S3R.x, S3L.y - S3R.y, S3L.z - S3R.z) / 2;
      const hh = tLen * 0.4, hw = sW * 0.66, c3 = add(add(j.thorax, mul(F.up, -hh * 1.05)), mul(F.fwd, -(cd + bd * 0.9)));
      const pt = (x, y, z, base = c3) => add(add(add(base, mul(F.left, x)), mul(F.up, y)), mul(F.fwd, z));
      const box = (b, w, h, d) => [-1, 1].flatMap((sx) => [-1, 1].flatMap((sy) => [-1, 1].map((sz) => pr(pt(sx * w, sy * h, sz * d, b)))));
      const c0 = pr(c3), scl = p.thorax.scale, r = 3.2 * scl, bagDepth = c0.depth, backFace = pr(pt(0, 0, -bd)).depth > c0.depth + 0.5;
      const body = roundPoly(hull(box(c3, hw, hh, bd)), r), id = `zb${++clipSeq}`, pocketC = pt(0, -hh * 0.34, -bd * 1.25);
      const handle = pr(pt(0, hh + 2.6 * lt, -bd * 0.2)), hA = pr(pt(-hw * 0.32, hh - 0.2, -bd * 0.2)), hB = pr(pt(hw * 0.32, hh - 0.2, -bd * 0.2));
      let html = fold(curve(hA, handle, hB), B.strap, 1.5 * scl, 1) + `<clipPath id="${id}"><path d="${body}"/></clipPath>`;
      html += roundPoly(hull(box(pocketC, hw * 0.68, hh * 0.42, bd * 0.42)), r * 0.7).replace(/^/, '<path data-part="bag-pocket" fill="' + B.strap + '" d="') + '"/>';
      html += `<path d="${body}" fill="${B.color}"/><g clip-path="url(#${id})"><path d="${body}" fill="${B.shade}" fill-opacity="0.32" transform="translate(${f1(-hw * 0.3 * scl)} ${f1(1.6 * scl)})"/><path d="${body}" fill="${B.color}" transform="translate(${f1(hw * 0.14 * scl)} ${f1(-1.4 * scl)})"/></g>`;
      if (backFace) {
        const q = (x, y) => pr(pt(x, y, -bd * 1.02)), pk = [q(-hw * 0.7, -hh * 0.82), q(hw * 0.7, -hh * 0.82), q(hw * 0.7, -hh * 0.06), q(-hw * 0.7, -hh * 0.06)];
        html += `<path d="${roundPoly(pk, r * 0.8)}" fill="${B.strap}"/>` + fold(`M ${f1(lerp(pk[3].x, pk[0].x, 0.2))} ${f1(lerp(pk[3].y, pk[0].y, 0.2))} L ${f1(lerp(pk[2].x, pk[1].x, 0.2))} ${f1(lerp(pk[2].y, pk[1].y, 0.2))}`, B.shade, 0.8 * scl, 1);
        html += fold(curve(q(-hw * 0.94, hh * 0.46), q(0, hh * 0.92), q(hw * 0.94, hh * 0.46)), B.strap, 0.9 * scl, 0.9);
      } else html += fold(curve(pr(pt(0, hh * 0.86, -bd)), pr(pt(0, 0, -bd * 1.1)), pr(pt(0, -hh * 0.9, -bd))), B.shade, 0.8 * scl, 0.65);
      push(bagDepth, `<g data-part="bag">${html}</g>`);
      // the straps: over the top of each shoulder, down the chest, under the arm and back to the bag's lower corner
      const seenFront = pr(add(j.thorax, mul(F.fwd, 10))).depth > pr(j.thorax).depth;
      for (const s of ["L", "R"]) {
        const S3 = s === "L" ? S3L : S3R, k = s === "L" ? 1 : -1, outw = sub(S3, j.thorax), topS = add(lerp3(j.neckBase, S3, 0.62), mul(F.up, 3.2 * lt));
        const rS = 1.9 * lt * scl, strapC = lookTone(p["shoulder" + s].depth, B.strap);
        const back = [topS, pt(k * hw * 0.5, hh * 0.98, bd * 0.4)].map(pr);
        const chest = [add(topS, mul(F.fwd, 2)), add(add(add(j.thorax, mul(outw, 0.66)), mul(F.fwd, cd * 0.95)), mul(F.up, 1)), add(add(lerp3(j.thorax, j.lumbar, 0.52), mul(outw, 0.86)), mul(F.fwd, cd * 0.86)), add(add(lerp3(j.thorax, j.lumbar, 0.92), mul(outw, 1.02)), mul(F.fwd, cd * 0.16))].map(pr);
        push(seenFront ? bagDepth - 0.1 : bagDepth + 0.1, `<g data-part="bag-strap">${clothRibbon(back, rS, rS, strapC)}</g>`);
        const nearSide = p["shoulder" + s].depth >= p.thorax.depth - 3;
        const m = chest[2], buckleN = norm2(chest[1], chest[2]);
        const buckle = fold(`M ${f1(m.x - buckleN.x * rS * 0.8 - buckleN.y * rS * 1.25)} ${f1(m.y - buckleN.y * rS * 0.8 + buckleN.x * rS * 1.25)} L ${f1(m.x - buckleN.x * rS * 0.8 + buckleN.y * rS * 1.25)} ${f1(m.y - buckleN.y * rS * 0.8 - buckleN.x * rS * 1.25)}`, B.shade, rS * 0.85, 1);
        if (seenFront && nearSide) push(bodD + 0.05, `<g data-part="bag-strap">${clothRibbon(chest, rS, rS, strapC)}${buckle}</g>`);
      }
    }
    if (dressed) {
      const GR = GARMENT_RADII;
      const clothColor = (hue, isSecondary) => {
        if (!L) return null;
        return isSecondary ? (L.pants || L.accent || "#f8fafc") : (L.cloth || "#f1ede4");
      };
      const cap = (A, B, r1, r2, hue, depth, extra = "", stroke, isSecondary = false) => {
        const baseHex = clothColor(hue, isSecondary);
        const c = baseHex ? lookTone(depth, baseHex, L.clothLine) : tone(depth, hue, true, o.style === "wireframe" ? 0.45 : 0.92);
        push(depth, `<g><path d="${capsulePath(A, B, r1, r2)}" fill="${c.fill}"${L ? "" : ` stroke="${stroke || c.stroke}" stroke-width="1.5"`}/>${extra}</g>`);
      };
      const [hue1, hue2] = g.hues, bodiceHue = gid === "sari" ? hue2 : hue1;
      if (!L) {
        if (g.lower) {
          const [rh, rk, ra] = GR.lower[g.lower], wb = (profileView ? GR.waistband.profile : GR.waistband.front) * lp * p.pelvis.scale;
          const belt = g.belt ? `<line x1="${f1(p.lumbar.x - wb * 0.9)}" y1="${f1(p.lumbar.y)}" x2="${f1(p.lumbar.x + wb * 0.9)}" y2="${f1(p.lumbar.y)}" stroke="#f59e0b" stroke-width="3.2"/>` : "";
          cap(p.pelvis, p.lumbar, wb, wb * GR.waistband.lumbarRatio, hue2, p.pelvis.depth + DRAW_BIAS.waistband, belt, undefined, true);
          for (const s of ["L", "R"]) {
            const A = p["hip" + s], K = p["knee" + s], N = p["ankle" + s];
            cap(A, K, rh * ll * A.scale, rk * ll * K.scale, hue2, (A.depth + K.depth) / 2 + DRAW_BIAS.trouser, "", undefined, true);
            cap(K, N, rk * ll * K.scale, ra * ll * N.scale, hue2, (K.depth + N.depth) / 2 + DRAW_BIAS.trouser, "", undefined, true);
          }
        }
        const bi = profileView ? 1 : 0, rT = GR.bodice.thorax[bi] * lc * p.thorax.scale, rL = GR.bodice.lumbar[bi] * lw * p.lumbar.scale, rP = GR.bodice.pelvis[bi] * lp * p.pelvis.scale;
        const plk = g.placket && view !== "back" ? (() => { const b = lerp3(p.thorax, p.lumbar, 0.78); return `<line x1="${f1(p.neckBase.x)}" y1="${f1(p.neckBase.y)}" x2="${f1(b.x)}" y2="${f1(b.y)}" stroke="#fef08a" stroke-width="2.2"/>`; })() : "";
        cap(p.lumbar, p.thorax, rL, rT, bodiceHue, (p.thorax.depth + p.lumbar.depth) / 2 + DRAW_BIAS.bodice, plk, undefined, gid === "sari");
        if (g.waistBodice !== false) cap(p.pelvis, p.lumbar, rP, rL, bodiceHue, (p.lumbar.depth + p.pelvis.depth) / 2 + DRAW_BIAS.bodice, "", undefined, gid === "sari");
        for (const s of ["L", "R"]) {
          const S = p["shoulder" + s], E = p["elbow" + s], Wr = p["wrist" + s];
          cap(p.thorax, S, GR.yoke[0] * lc * p.thorax.scale, GR.yoke[1] * la * S.scale, bodiceHue, (p.thorax.depth + S.depth) / 2 + DRAW_BIAS.yoke, "", undefined, gid === "sari");
          if (g.sleeves === "choli") cap(S, lerp3(S, E, GR.choli.reach), GR.choli.radii[0] * la * S.scale, GR.choli.radii[1] * la * E.scale, bodiceHue, (S.depth + E.depth) / 2 + DRAW_BIAS.sleeve, "", "#fbbf24", true);
          else if (g.sleeves === "full") {
            cap(S, E, GR.sleeve[0] * la * S.scale, GR.sleeve[1] * la * E.scale, bodiceHue, (S.depth + E.depth) / 2 + DRAW_BIAS.sleeve);
            cap(E, Wr, GR.sleeve[1] * la * E.scale, GR.sleeve[2] * la * Wr.scale, bodiceHue, (E.depth + Wr.depth) / 2 + DRAW_BIAS.sleeve);
          }
        }
        if (g.apron) {
          const left = frame(j).left, thick = profileView ? 4.8 : 2.5;
          const quad = (n1, n2, hue, bias, pleats) => {
            const e = (n, sgn) => pr(add(n, mul(left, sgn * n.w))), t = (n, sgn) => pr(add(n, P(0, 0, sgn * thick)));
            const c1 = [e(n1, -1), e(n1, 1), e(n2, 1), e(n2, -1)], c2 = [t(n1, -1), t(n1, 1), t(n2, 1), t(n2, -1)];
            const span = (q) => Math.hypot(q[1].x - q[0].x, q[1].y - q[0].y), q = span(c1) >= span(c2) ? c1 : c2, d = (c1[0].depth + c1[1].depth + c1[2].depth + c1[3].depth) / 4;
            const c = o.staticBox ? { fill: "rgba(225,29,72,0.38)", stroke: "#fb7185" } : tone(d, hue, true, 0.92);
            let extra = "";
            if (pleats && span(c1) > 12) for (let k = -2; k <= 2; k++) { const fr = 0.5 + k * 0.14; extra += `<line x1="${f1(lerp(q[0].x, q[1].x, fr))}" y1="${f1(lerp(q[0].y, q[1].y, fr))}" x2="${f1(lerp(q[3].x, q[2].x, fr))}" y2="${f1(lerp(q[3].y, q[2].y, fr))}" stroke="${c.stroke}" stroke-width="0.9" stroke-opacity="0.65"/>`; }
            push(d + bias, `<g><path d="M ${q.map((v) => `${f1(v.x)} ${f1(v.y)}`).join(" L ")} Z" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5" stroke-linejoin="round"/>${extra}</g>`);
          };
          for (let i = 0; i < 4; i++) { quad(dr.front[i], dr.front[i + 1], hue1, DRAW_BIAS.front_apron, g.pleats); quad(dr.back[i], dr.back[i + 1], hue1, DRAW_BIAS.back_apron, false); }
        }
      } else {
        // Seamless Cartoon Garment Renderer (L mode): continuous pajama legs, continuous bodice, unified 4-zone tunic apron, continuous sleeves
        const primaryHex = clothColor(bodiceHue, gid === "sari"), secHex = clothColor(hue2, true), accentHex = L.accent || "#d4af37";
        const hipMaxD = Math.max(p.hipL.depth, p.hipR.depth), hipMinD = Math.min(p.hipL.depth, p.hipR.depth);
        if (g.lower) {
          const [rh, rk, ra] = GR.lower[g.lower], wb = (profileView ? GR.waistband.profile : GR.waistband.front) * lp * p.pelvis.scale;
          if (!g.apron) { const rb = GR.bodice.pelvis[profileView ? 1 : 0] * lp * p.pelvis.scale * 0.96; cap(p.pelvis, lerp3(p.pelvis, p.lumbar, 0.1), rb, rb, hue2, p.pelvis.depth + DRAW_BIAS.waistband, "", undefined, true); }
          for (const s of ["L", "R"]) {
            const A = p["hip" + s], K = p["knee" + s], N = p["ankle" + s], dL = (A.depth + K.depth + N.depth) / 3;
            const rH = rh * ll * A.scale, rK = rk * ll * K.scale, rA = ra * ll * N.scale;
            const legTop = lerp3(A, p.pelvis, 0.45), rTop = rH * 0.85; legTop.depth = A.depth; legTop.scale = A.scale;
            const tr = smoothLimb(legTop, K, N, rTop, (rTop + rK) * 0.5, rK, (rK + rA) * 0.5, rA, false, false);
            const farLeg = A.depth < p["hip" + (s === "L" ? "R" : "L")].depth - 3, cP = { fill: farLeg ? mixHex(secHex, "#3a3028", 0.14) : secHex };
            const fHex = foldHex(cP.fill, 0.36), kn = norm2(A, K), kx = -kn.y, ky = kn.x, at = (Q, a, b) => ({ x: Q.x + kn.x * a * K.scale + kx * b * K.scale, y: Q.y + kn.y * a * K.scale + ky * b * K.scale });
            const nn = norm2(K, N), hemA = { x: N.x - nn.x * 2.2 * N.scale - nn.y * rA * 0.85, y: N.y - nn.y * 2.2 * N.scale + nn.x * rA * 0.85 }, hemB = { x: N.x - nn.x * 2.2 * N.scale + nn.y * rA * 0.85, y: N.y - nn.y * 2.2 * N.scale - nn.x * rA * 0.85 };
            const details = (tr.crease ? fold(tr.crease, fHex, 0.8 * K.scale, 0.6) : "") + fold(curve(at(K, -3, -rK * 0.62 / K.scale), at(K, -0.6, 0), at(K, -2.4, rK * 0.5 / K.scale)), fHex, 0.65 * K.scale, 0.5) + fold(curve(at(A, 5, rH * 0.2 / A.scale), at(A, 9, -rH * 0.15 / A.scale), at(A, 14, -rH * 0.58 / A.scale)), fHex, 0.65 * K.scale, 0.42) + fold(curve(hemA, { x: N.x, y: N.y }, hemB), fHex, 0.65 * N.scale, 0.55);
            push(dL + DRAW_BIAS.trouser, `<g data-part="leg"><path d="${tr.outline}" fill="${cP.fill}"/>${details}</g>`);
          }
        }
        // Continuous Bodice (pelvis → lumbar → thorax) + Seamless Shoulder Yokes + Mandarin Collar + Golden Placket
        const bi = profileView ? 1 : 0, rT = GR.bodice.thorax[bi] * lc * p.thorax.scale, rL = GR.bodice.lumbar[bi] * lw * p.lumbar.scale, rP = GR.bodice.pelvis[bi] * lp * p.pelvis.scale;
        const bodD = Math.max((p.thorax.depth + p.lumbar.depth + p.pelvis.depth) / 3, hipMaxD) + 1.2;
        const cBod = { fill: primaryHex }, fHex = foldHex(cBod.fill, 0.34), tScale = p.thorax.scale;
        const chestTop = lerp3(p.thorax, p.lumbar, 0.5); // its round top stays below the collar chestTop.depth = p.thorax.depth; chestTop.scale = p.thorax.scale;
        const hipOut = (Math.hypot(p.hipL.x - p.hipR.x, p.hipL.y - p.hipR.y) / 2) * 0.55 + (g.lower ? GR.lower[g.lower][0] : 0) * 0.85 * ll * p.pelvis.scale;
        const rHem = g.apron ? Math.min(rP, (profileView ? 8.6 : 15) * prof.scaleWidth * p.pelvis.scale) : Math.max(rP, hipOut * 1.02);
        const hemAt = lerp3(p.pelvis, p.lumbar, g.apron ? -0.42 : -0.18); hemAt.depth = p.pelvis.depth; hemAt.scale = p.pelvis.scale;
        const bod = smoothLimb(hemAt, p.lumbar, chestTop, rHem, (rHem + rL) * 0.5, rL, (rL + rT) * 0.5, rT, false, true);
        underDepth = bodD - 0.4;
        const down = norm2(p.thorax, p.lumbar), sideX = -down.y, sideY = down.x, sleeveHere = o.cloth?.short || g.sleeves === "choli";
        const nR = NECK_DRAW[0] * lt * p.neckBase.scale, shapes = [bod.outline], sDrawn = {};
        // the cloth stops at the collar, below the neck's base: the neck is seen above it (never a dome of cloth up to the chin)
        const nk = { ...p.neckBase, x: p.neckBase.x + down.x * nR * 1.05, y: p.neckBase.y + down.y * nR * 0.6 };
        for (const s of ["L", "R"]) {
          const S = p["shoulder" + s], rY = (sleeveHere ? GR.choli.radii[0] * 0.8 : GR.sleeve[0]) * la * S.scale, Sd = dropShoulder(S, rY, down, p["elbow" + s]);
          sDrawn[s] = { Sd, rY };
          shapes.push(capsulePath(nk, Sd, nR * 0.9, rY), capsulePath(lerp3(p.thorax, p.lumbar, 0.42), Sd, Math.min(GR.yoke[0] * lc * tScale, rT * 0.9), rY));
        }
        const clipId = `zb${++clipSeq}`, solid = shapes.map((d) => `<path d="${d}"/>`).join("");
        // the light comes from one side: a soft band down the other side; the chin's shade at the collar; folds under the arms and at the waist
        const gradId = `${clipId}g`, gx0 = p.thorax.x + sideX * rT, gy0 = p.thorax.y + sideY * rT, gx1 = p.thorax.x + sideX * rT * 0.2, gy1 = p.thorax.y + sideY * rT * 0.2;
        const shadeBand = `<linearGradient id="${gradId}" gradientUnits="userSpaceOnUse" x1="${f1(gx0)}" y1="${f1(gy0)}" x2="${f1(gx1)}" y2="${f1(gy1)}"><stop offset="0" stop-color="${mixHex(cBod.fill, "#1a0e08", 0.3)}" stop-opacity="0.38"/><stop offset="1" stop-color="${mixHex(cBod.fill, "#1a0e08", 0.34)}" stop-opacity="0"/></linearGradient><path d="${bod.outline}" fill="url(#${gradId})"/>`;
        const at = (Q, a, b) => ({ x: Q.x + down.x * a + sideX * b, y: Q.y + down.y * a + sideY * b });
        let folds = "";
        if (!g.apron) folds += fold(curve(at(hemAt, -1.2 * tScale, -rHem), at(hemAt, -0.6 * tScale, 0), at(hemAt, -1.2 * tScale, rHem)), fHex, 0.7 * tScale, 0.55);
        if (!profileView) for (const k of [-1, 1]) folds += fold(curve(at(p.thorax, rT * 0.42, k * rT * 0.92), at(p.thorax, rT * 0.62, k * rT * 0.62), at(p.thorax, rT * 1.02, k * rT * 0.4)), fHex, 0.72 * tScale, 0.55);
        const wS = rL * 0.92;
        folds += fold(curve(at(p.lumbar, -rL * 0.24, -wS), at(p.lumbar, rL * 0.1, -wS * 0.3), at(p.lumbar, -rL * 0.06, wS * 0.3)), fHex, 0.72 * tScale, 0.5);
        folds += fold(curve(at(p.lumbar, rL * 0.3, wS), at(p.lumbar, rL * 0.56, wS * 0.34), at(p.lumbar, rL * 0.42, -wS * 0.18)), fHex, 0.72 * tScale, 0.45);
        let bodExtra = "";
        if (view !== "back" && !profileView && o.cloth?.short) { // the T-shirt's round neck: a band of the same cloth
          bodExtra += `<path d="M ${f1(nk.x - nR * 1.25)} ${f1(nk.y - nR * 0.9)} L ${f1(nk.x + nR * 1.25)} ${f1(nk.y - nR * 0.9)} L ${f1(nk.x + nR * 1.25)} ${f1(nk.y - nR * 0.05)} Q ${f1(nk.x)} ${f1(nk.y + nR * 2.6)} ${f1(nk.x - nR * 1.25)} ${f1(nk.y - nR * 0.05)} Z" fill="${L.skin || "#e8b791"}"/>`;
          bodExtra += fold(curve({ x: nk.x - nR * 1.25, y: nk.y - nR * 0.05 }, { x: nk.x, y: nk.y + nR * 1.55 }, { x: nk.x + nR * 1.25, y: nk.y - nR * 0.05 }), foldHex(cBod.fill, 0.28), 1.2 * tScale, 0.85);
        }
        if (L.jacket && view !== "back" && !profileView) { // shirt and tie in the jacket's V, the lapels, the jacket's front line and buttons
          const V = at(p.thorax, rT * 1.15, 0), nL = { x: nk.x - sideX * nR * 1.5, y: nk.y - sideY * nR * 1.5 }, nRt = { x: nk.x + sideX * nR * 1.5, y: nk.y + sideY * nR * 1.5 }, lapel = foldHex(cBod.fill, 0.2);
          bodExtra += `<path d="M ${f1(nL.x)} ${f1(nL.y)} L ${f1(V.x)} ${f1(V.y)} L ${f1(nRt.x)} ${f1(nRt.y)} Z" fill="#f4f4f0"/>`;
          const kA = { x: lerp(nk.x, V.x, 0.12), y: lerp(nk.y, V.y, 0.12) }, kB = { x: lerp(nk.x, V.x, 0.98), y: lerp(nk.y, V.y, 0.98) };
          bodExtra += `<path d="M ${f1(kA.x - sideX * nR * 0.34)} ${f1(kA.y - sideY * nR * 0.34)} L ${f1(kA.x + sideX * nR * 0.34)} ${f1(kA.y + sideY * nR * 0.34)} L ${f1(kB.x + sideX * nR * 0.46)} ${f1(kB.y + sideY * nR * 0.46)} L ${f1(kB.x)} ${f1(kB.y + down.y * nR * 0.5)} L ${f1(kB.x - sideX * nR * 0.46)} ${f1(kB.y - sideY * nR * 0.46)} Z" fill="${L.tie}"/>`;
          for (const q of [nL, nRt]) { const out3 = { x: V.x + (q.x - V.x) * 0.5 + (q.x - nk.x) * 1.4, y: V.y + (q.y - V.y) * 0.5 }; bodExtra += `<path d="M ${f1(q.x)} ${f1(q.y)} L ${f1(out3.x)} ${f1(out3.y)} L ${f1(V.x)} ${f1(V.y)} Z" fill="${lapel}"/>`; }
          bodExtra += fold(`M ${f1(V.x)} ${f1(V.y)} L ${f1(hemAt.x)} ${f1(hemAt.y)}`, foldHex(cBod.fill, 0.42), 0.9 * tScale, 0.9);
          for (const u of [0.28, 0.6]) bodExtra += `<circle cx="${f1(lerp(V.x, hemAt.x, u))}" cy="${f1(lerp(V.y, hemAt.y, u))}" r="${f1(0.9 * tScale)}" fill="${foldHex(cBod.fill, 0.5)}"/>`;
        } else if (g.placket && view !== "back" && !profileView && !o.cloth?.short) {
          const pb = lerp3(p.neckBase, p.lumbar, 0.65);
          const colW = RADII.neck[0] * lt * nk.scale * 1.35;
          // Mandarin Collar band + embroidered golden placket with 3 buttons
          bodExtra += `<path d="${capsulePath(nk, pb, 2.6 * tScale, 2.2 * tScale)}" fill="${accentHex}"/>`;
          bodExtra += fold(curve({ x: nk.x - colW * 0.9, y: nk.y - colW * 0.2 }, { x: nk.x, y: nk.y + colW * 0.82 }, { x: nk.x + colW * 0.9, y: nk.y - colW * 0.2 }), accentHex, 1.5 * tScale, 1);
          for (const u of [0.25, 0.52, 0.78]) {
            const bt = lerp3(p.neckBase, pb, u);
            bodExtra += `<circle cx="${f1(bt.x)}" cy="${f1(bt.y)}" r="${f1(1.1 * tScale)}" fill="#ffffff"/>`;
          }
        }
        push(bodD, `<g data-part="torso"><clipPath id="${clipId}">${solid}</clipPath><g fill="${cBod.fill}">${solid}</g><g clip-path="url(#${clipId})">${shadeBand}${folds}</g>${bodExtra}</g>`);
        if (L.bag) backpack(L.bag, bodD);

        // the skin arm under a short sleeve throws no shade of its own on the shirt's outside: only cloth over cloth, and skin over cloth
        for (const s of ["L", "R"]) if (armShapes[s] && armShapes[s].depth > bodD) { const E = p["elbow" + s], Wr = p["wrist" + s], S0 = lerp3(p["shoulder" + s], E, 0.6), rE = RADII.upperArm[1] * la * E.scale, rW = RADII.forearm[1] * la * Wr.scale; S0.depth = E.depth; S0.scale = E.scale; push(armShapes[s].depth - 0.001, castOn(clipId, smoothLimb(S0, E, Wr, rE, rE, rE, (rE + rW) * 0.5, rW, false, false).outline, cBod.fill, -0.8 * tScale, 0.6 * tScale)); }

        // Continuous Sleeves (shoulder → elbow → wrist with tailored cuff and zero elbow circles)
        for (const s of ["L", "R"]) {
          const S = p["shoulder" + s], E = p["elbow" + s], Wr = p["wrist" + s];
          const slBaseD = S.depth > p.thorax.depth + 4 ? Math.max((S.depth + E.depth + Wr.depth) / 3, S.depth) : (S.depth + E.depth + Wr.depth) / 3;
          const slD = slBaseD + DRAW_BIAS.sleeve, far = S.depth < p["shoulder" + (s === "L" ? "R" : "L")].depth - 3;
          const slHex = far ? mixHex(cBod.fill, "#3a3028", 0.14) : cBod.fill, { Sd, rY } = sDrawn[s];
          if (sleeveHere) { // a short sleeve: it grows from the shoulder and ends in a straight hem on the arm
            const reach = GR.choli.reach, H = lerp3(S, E, reach), r1 = rY, r2 = Math.max(GR.choli.radii[1] * 0.92, RADII.upperArm[1] + 1.2) * la * E.scale;
            const u = norm2(Sd, H), nx = -u.y, ny = u.x, cS = { fill: slHex };
            const d = `M ${f1(Sd.x + nx * r1)} ${f1(Sd.y + ny * r1)} L ${f1(H.x + nx * r2)} ${f1(H.y + ny * r2)} L ${f1(H.x - nx * r2)} ${f1(H.y - ny * r2)} L ${f1(Sd.x - nx * r1)} ${f1(Sd.y - ny * r1)} Z`;
            const hemIn = 1.2 * E.scale, hem = `M ${f1(H.x - u.x * hemIn + nx * r2)} ${f1(H.y - u.y * hemIn + ny * r2)} L ${f1(H.x - u.x * hemIn - nx * r2)} ${f1(H.y - u.y * hemIn - ny * r2)}`;
            const onSkin = `M ${f1(H.x + u.x * hemIn * 0.7 + nx * r2 * 0.86)} ${f1(H.y + u.y * hemIn * 0.7 + ny * r2 * 0.86)} L ${f1(H.x + u.x * hemIn * 0.7 - nx * r2 * 0.86)} ${f1(H.y + u.y * hemIn * 0.7 - ny * r2 * 0.86)}`;
            const wr = fold(curve(lerp3(Sd, H, 0.32), { x: lerp(Sd.x, H.x, 0.5) + nx * r1 * 0.3, y: lerp(Sd.y, H.y, 0.5) + ny * r1 * 0.3 }, { x: lerp(Sd.x, H.x, 0.68) + nx * r1 * 0.72, y: lerp(Sd.y, H.y, 0.68) + ny * r1 * 0.72 }), foldHex(cS.fill, 0.3), 0.62 * E.scale, 0.5);
            armItems[s].push(push(slD, `<g data-part="sleeve">${fold(onSkin, foldHex(L.skin || "#e8b791", 0.34), 1.3 * E.scale, 0.5)}<path d="${d}" fill="${cS.fill}"/>${wr}${fold(hem, foldHex(cS.fill, 0.34), 0.75 * E.scale, 0.8)}</g>`));
          } else if (g.sleeves === "full") {
            const rS = GR.sleeve[0] * la * S.scale, rE = GR.sleeve[1] * la * E.scale, rW = GR.sleeve[2] * la * Wr.scale;
            const sl = smoothLimb(Sd, E, Wr, rS, (rS + rE) * 0.5, rE, (rE + rW) * 0.5, rW, false, false);
            const cSl = { fill: slHex }, slF = foldHex(cSl.fill, 0.34), u1 = norm2(S, E), u2 = norm2(E, Wr), castFrom = lerp3(Sd, E, 0.42); castFrom.depth = E.depth; castFrom.scale = E.scale;
            const castLimb = smoothLimb(castFrom, E, Wr, (rS + rE) * 0.5, (rS + rE) * 0.5, rE, (rE + rW) * 0.5, rW, false, false).outline;
            const elbowFold = (a, b, w) => { const n1 = { x: -u1.y, y: u1.x }, q = { x: E.x - u1.x * a * E.scale + n1.x * b * rE, y: E.y - u1.y * a * E.scale + n1.y * b * rE }, q2 = { x: E.x + u2.x * a * E.scale - n1.x * b * rE * 0.8, y: E.y + u2.y * a * E.scale - n1.y * b * rE * 0.8 }; return fold(curve(q, E, q2), slF, w * E.scale, 0.5); };
            const crease = (sl.crease ? fold(sl.crease, slF, 0.8 * E.scale, 0.6) : "") + elbowFold(3, 0.72, 0.62) + fold(curve(lerp3(Sd, E, 0.2), lerp3(Sd, E, 0.3), { x: lerp(Sd.x, E.x, 0.42) - u1.y * rS * 0.6, y: lerp(Sd.y, E.y, 0.42) + u1.x * rS * 0.6 }), slF, 0.6 * E.scale, 0.42);
            const cuff = fold(`M ${f1(sl.endA.x)} ${f1(sl.endA.y)} L ${f1(sl.endB.x)} ${f1(sl.endB.y)}`, accentHex, 1.5 * Wr.scale, 1);
            const slClip = `zb${++clipSeq}`;
            armItems[s].push(push(slD, `<g data-part="sleeve">${castOn(clipId, castLimb, cBod.fill, -0.7 * tScale, 0.5 * tScale)}<clipPath id="${slClip}"><path d="${sl.outline}"/></clipPath><path d="${sl.outline}" fill="${cSl.fill}"/><g clip-path="url(#${slClip})">${crease}</g>${cuff}</g>`));
          }
        }

        // Unified 4-Zone Apron Panels (dr.front[0..4] and dr.back[0..4]) — one smooth Catmull-Rom silhouette per panel!
        if (g.apron) {
          const F = frame(j), sc = p.pelvis.scale, wA = { x: p.lumbar.x + sideX * rL, y: p.lumbar.y + sideY * rL }, wB = { x: p.lumbar.x - sideX * rL, y: p.lumbar.y - sideY * rL };
          const onLap = dot(norm(sub(dr.front[2], dr.front[0]), P(0, -1, 0)), F.up) > -0.5;
          const shell = clothShell(dr, pr, F.left, (y) => { const kn = lerp3(j.kneeL, j.kneeR, 0.5), an = lerp3(j.ankleL, j.ankleR, 0.5), t = clamp((kn.y - y) / Math.max(1, kn.y - an.y), 0, 1); return lerp3(kn, an, t); }, wA, wB, onLap, 16 * ll, sc), lv = shell.levels, last = lv[lv.length - 1];
          const fHex = foldHex(cBod.fill, 0.3), mid = (L) => ({ x: L.reduce((v, q) => v + q.x, 0) / L.length, y: L.reduce((v, q) => v + q.y, 0) / L.length });
          const c0 = mid(lv[0]), c1 = mid(last), dl = Math.hypot(c1.x - c0.x, c1.y - c0.y) || 1, px = -(c1.y - c0.y) / dl, py = (c1.x - c0.x) / dl;
          // the hem and the folds run between the cloth's edges at each height; on a lap only the part that falls from the knee
          const edges = (L) => { const pts = onLap ? L.slice(0, 2) : L, s = pts.slice().sort((u, v) => (u.x * px + u.y * py) - (v.x * px + v.y * py)); return [s[0], s[s.length - 1]]; };
          let extra = "";
          const nF = g.pleats ? 5 : 3;
          if (!(onLap && profileView)) for (let k = 1; k <= nF; k++) { const fr = k / (nF + 1), pts = lv.filter((_, i) => i >= 3 && i % 2 === 1).concat([last]).map((L) => { const [u, v] = edges(L); return { x: lerp(u.x, v.x, fr), y: lerp(u.y, v.y, fr) }; }); extra += `<path data-detail="1" d="M ${f1(pts[0].x)} ${f1(pts[0].y)}${catmullSegs(pts, 0.22)}" fill="none" stroke="${fHex}" stroke-width="${f1(0.8 * sc)}" stroke-opacity="${g.pleats ? 0.55 : 0.42}" stroke-linecap="round"/>`; }
          const [hA, hB] = edges(last), hemW = Math.hypot(hB.x - hA.x, hB.y - hA.y);
          // a floor-length garment from the side has no coloured hem: next to the shoe it reads as the foot showing
          if (hemW > 6 * sc && !(profileView && (g.drop >= 80 || onLap))) extra += `<path data-part="hem" data-detail="1" d="M ${f1(hA.x)} ${f1(hA.y)} Q ${f1((hA.x + hB.x) / 2)} ${f1((hA.y + hB.y) / 2 + hemW * 0.05)} ${f1(hB.x)} ${f1(hB.y)}" fill="none" stroke="${accentHex}" stroke-width="${f1(1.7 * sc)}" stroke-opacity="0.88" stroke-linecap="round"/>`;
          // on a lap the cloth lies over the thighs and the near arms rest on top of it
          const legTopD = Math.max(...["L", "R"].map((s) => (p["hip" + s].depth + p["knee" + s].depth + p["ankle" + s].depth) / 3)) + DRAW_BIAS.trouser, clothD = Math.max(hipMaxD, onLap ? legTopD : -Infinity) + (onLap ? 0.2 : 1);
          push(clothD, `<g data-part="apron"><path d="${shell.d}" fill="${cBod.fill}"/>${onLap ? "" : `<path d="${shell.d}" fill="url(#${gradId})"/>`}${extra}</g>`);
          lapTopD = onLap ? clothD : -Infinity;
          if (onLap) for (const s of ["L", "R"]) if (p["shoulder" + s].depth >= p["shoulder" + (s === "L" ? "R" : "L")].depth - 3) (armItems[s] || []).forEach((it, n) => { it.depth = Math.max(it.depth, clothD + 0.1 + n * 0.01); });
        }
      }
      if (g.pallu && L) {
        const F = frame(j), accent = L.accent || "#d4af37", zS = Math.max(p.thorax.depth, p.lumbar.depth, profileView ? -Infinity : lapTopD + 0.05 - DRAW_BIAS.sash) + DRAW_BIAS.sash, scl = p.thorax.scale, swR = f1(1.2 * scl);
        const toneS = lookTone(zS, accent), trim = gid === "sari" ? L.cloth : null;
        const tail = dr.pallu.map((n) => pr(n)), dT = tail.reduce((v, q) => v + q.depth, 0) / tail.length;
        push(Math.min(dT, underDepth - 0.2), clothRibbon(tail, (gid === "sari" ? 8 : 4.5) * scl, (gid === "sari" ? 10 : 6) * scl, lookTone(dT, accent), swR, trim));
        if (g.pallu === "nivi") {
          const m = pr(add(lerp3(j.hipR, j.shoulderL, 0.5), mul(F.fwd, profileView ? 9 : 13)));
          push(zS, clothRibbon([p.hipR, m, p.shoulderL], (profileView ? 4.5 : 8.5) * scl, (profileView ? 4 : 6.5) * scl, toneS, swR, trim));
        } else {
          const lowC = pr(add(add(j.thorax, mul(F.up, -15)), mul(F.fwd, 15)));
          push(zS, clothRibbon([p.shoulderL, lowC, p.shoulderR], 3.8 * scl, 3.8 * scl, toneS, swR));
        }
      } else if (g.pallu) {
        const sashHue = gid === "sari" ? hue1 : hue2, zS = Math.max(p.thorax.depth, p.lumbar.depth) + DRAW_BIAS.sash, isSec = gid !== "sari";
        if (g.pallu === "nivi") cap(p.hipR, p.shoulderL, GR.sash[0] * p.hipR.scale, GR.sash[1] * p.shoulderL.scale, sashHue, zS, "", "#fbbf24", isSec);
        else { const F = frame(j), lowC = pr(add(add(j.thorax, mul(F.up, -16)), mul(F.fwd, 13))); cap(p.shoulderL, lowC, GR.dupatta[0] * p.shoulderL.scale, GR.dupatta[1] * lowC.scale, sashHue, zS, "", undefined, isSec); cap(lowC, p.shoulderR, GR.dupatta[1] * lowC.scale, GR.dupatta[0] * p.shoulderR.scale, sashHue, zS, "", undefined, isSec); }
        for (let i = 0; i < dr.pallu.length - 1; i++) {
          const a = pr(dr.pallu[i]), b = pr(dr.pallu[i + 1]), T = GR.tail;
          cap(a, b, (T.start + i * T.grow) * a.scale, (T.end + i * T.endGrow) * b.scale, sashHue, (a.depth + b.depth) / 2, "", "#fbbf24", isSec);
        }
      }
      const showMarks = L ? o.marks === true : o.marks !== false;
      if (g.apron && showMarks && !o.staticBox) {
        const hb = pr(dr.front[0]), kw = pr(dr.front[3]); // hip breaking point (green) and knee wrap (amber), drawn on top
        items.push({ depth: Infinity, html: `<circle cx="${f1(hb.x)}" cy="${f1(hb.y)}" r="4" fill="#10b981" stroke="#060a12" stroke-width="1.5"/><circle cx="${f1(kw.x)}" cy="${f1(kw.y)}" r="3.6" fill="#f59e0b" stroke="#060a12" stroke-width="1.5"/>` });
      }
    }
    // Fixed order, in every pose and view: neck → clothes → head (face, ears, hair, beard). The neck can never come over the head.
    if (L) { lateUnder.forEach((h, i) => push(underDepth - 0.1 + i * 0.01, h)); if (lateHead) push(Math.max(lateHead.depth, underDepth + 1.5), lateHead.html); }
    items.sort((a, b) => a.depth - b.depth);
    out += items.map((i) => i.html).join("");
    if (o.innerOnly) return out;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${out}</svg>`;
  }

  // Mount a solved 3D pose + garment drape into an SVG group element and record it for rule verification
  function draw(gEl, ps, o = {}) {
    const gid = garmentKey(o.garment || "none"), dressed = gid !== "none";
    const dr = dressed ? (o.drape || drape(ps, gid, o.cloth || {})) : null;
    if (root.__anatomy) root.__anatomy[o.id || "actor"] = { pose: ps, drape: dr };
    const inner = svg(ps, { ...o, drape: dr, innerOnly: true, groundLine: o.groundLine ?? false });
    if (gEl && "innerHTML" in gEl) gEl.innerHTML = inner;
    else if (gEl && gEl.setAttribute) gEl.setAttribute("data-anatomy-posture", ps.posture);
    return { pose: ps, drape: dr };
  }

  // heads tall, measured (crown ÷ head height) — the honest number for a profile
  function headsTall(profile) {
    const ps = pose({ posture: "stand", profile }), r = RADII.head * ps.profile.headScale;
    return (ps.joints.head.y + r) / (2 * r);
  }

  root.ZANATOMY = {
    version: "3.0.0", PARENT, JOINTS, REF_POSTURES, PROFILES, PROFILE_BOUNDS, RADII, BODY_CAPSULES, TRIM, ROM, BREAKING_POINTS,
    PROPS, GARMENTS, GARMENT_RADII, DRAW_BIAS, CLOTH_DEFAULT, CLOTH_BOUNDS, REF_PERSPECTIVE: 0.0018,
    // A1: may this posture hold a hand far out in front (reaching, pointing, giving, pushing)? Every other pose keeps the elbows bent
    reaches: (posture) => posture === "reach" || posture === "point" || !!LIB[posture]?.reach || ["object", "pair"].includes(LIB[posture]?.group),
    refPose, profileOf, restLengths, pose, gestureAt, anchorGesture, alivePose, addPosture, addGesture, library: () => ({ actions: Object.keys(LIB), gestures: Object.keys(GESTURES) }), libraryDef: (id) => LIB[id] || GESTURES[id] || null, mouthShape, blend, transition: blend, frame, drape, check, project, svg, draw, capsulePath, headsTall, ik,
  };
})(typeof window !== "undefined" ? window : globalThis);
