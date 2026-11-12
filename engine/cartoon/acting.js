// ZC.feel: the acting cards (engine/cartoon/library/acting.json, Brief 7) played on a person. A feeling is a face, a body and a
// timing together: it starts with a notice beat, the parts join in order (eyes, brows, head, shoulders, chest, hands), settles with a
// small overshoot, and a strong feeling eases back to its mild version after its hold. A change to another feeling replays the card's
// transition beats when there is one (happy → sad on bad news), else the same notice → change → settle. Seek-safe: every value is a
// function of t only.
//   const F = ZC.feel("worried", { spec, at: 0.4 }).then("relieved", { at: 2.6 }).then("happy", { level: "strong", at: 4 });
//   full body:  F.draw(b, t)                       (or b.draw(F.pose(b, t), { face: F.face(t), blink: F.blink(t) }))
//   waist up:   r.draw({ ...F.person(t), hands: "rest", mouth: ZC.mouth(t + s, words) }, t)
//   F.at(t) → { face, body } (every dial of the card), F.id(t) → the feeling on screen
// Levels: "mild" (default) | "strong". Age from spec (toddler, child, teen, adult, elder): speed, size of moves, holds.
(function (root) {
  const D = () => root.ZACTING_DATA;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u;
  const smooth = (u) => u * u * (3 - 2 * u);
  const EASE = { soft: smooth, snap: (u) => 1 - (1 - u) ** 3, sink: (u) => u * u };
  // which dials move with which part (the card's `leads` order); dials of no part start with the change
  const GROUP = { eyes: ["look", "lid", "squint", "blinkRate"], brows: ["raise", "inner", "browL", "browR"], head: ["headPitch", "headYaw", "headRoll"],
    shoulders: ["shoulderLift"], chest: ["chestLift", "spinePitch", "breath", "breathDepth"], hands: ["armSpread", "elbowZ", "hands"] };
  const ANGULAR = new Set(["spinePitch", "chestLift", "shoulderLift", "headPitch", "headYaw", "headRoll", "armSpread", "elbowZ"]);
  const HAND_MIN = 0.5; // seconds: the shortest time a pair of hands takes to change pose
  const TRIM_KEYS = ["spinePitch", "headPitch", "headYaw", "headRoll", "armSpread", "elbowZ", "stanceWidth", "shoulderLift", "chestLift"];

  function ageOf(o = {}) {
    if (o.age && D()?.ages?.[o.age]) return o.age;
    const sp = o.spec || {}, y = Number(sp.years);
    if (Number.isFinite(y)) return y < 4 ? "toddler" : y < 13 ? "child" : y < 18 ? "teen" : y < 60 ? "adult" : "elder";
    return { child: "child", toddler: "toddler", teen: "teen", elderly: "elder" }[sp.age] || "adult";
  }
  function card(id) {
    const d = D(); if (!d) throw new Error("ZC.feel: the acting cards are not loaded (engine/cartoon/library/acting.json → build-library.mjs)");
    if (d.emotions[id]) return [id, d.emotions[id]];
    const want = String(id).toLowerCase();
    for (const [k, e] of Object.entries(d.emotions)) if ((e.aliases || []).some((a) => String(a).toLowerCase() === want)) return [k, e];
    throw new Error(`ZC.feel: no feeling "${id}". Some: ${Object.keys(d.emotions).slice(0, 24).join(", ")} …`);
  }
  // defaults → the level → the age's patch → the age's size of moves → the dial ranges (playback.stateResolution)
  function resolve(id, level, age) {
    const d = D(), [key, e] = card(id), lv = e[level] ? level : "mild", A = d.ages[age] || {}, patch = e.age?.[age]?.[lv] || {};
    const face = { ...d.defaults.face, ...(e[lv].face || {}), ...(patch.face || {}) }, body = { ...d.defaults.body, ...(e[lv].body || {}), ...(patch.body || {}) };
    for (const k of d.playback.ageScaledBodyChannels || []) if (typeof body[k] === "number") body[k] *= A.gestureScale ?? 1;
    if (!(e[lv].body && "sway" in e[lv].body) && !(patch.body && "sway" in patch.body)) body.sway = A.sway ?? body.sway;
    for (const [part, st] of [["face", face], ["body", body]]) for (const [k, r] of Object.entries(d.dialRanges?.[part] || {})) {
      if (Array.isArray(st[k])) st[k] = st[k].map((v) => clamp(v, r[0], r[1])); else if (typeof st[k] === "number") st[k] = clamp(st[k], r[0], r[1]);
    }
    return { id: key, level: lv, face, body, timing: { ...(e[lv].timing || {}) }, gestures: e.gestures || [] };
  }
  const mix = (a, b, u) => (Array.isArray(a) ? a.map((v, i) => lerp(v, b[i] ?? v, u)) : typeof a === "number" && typeof b === "number" ? lerp(a, b, u) : u < 0.5 ? a : b);
  const patchState = (s, p = {}) => ({ face: { ...s.face, ...(p.face || {}) }, body: { ...s.body, ...(p.body || {}) } });

  function feel(first, o = {}) {
    const age = ageOf(o), A = () => D().ages[age] || { speed: 1, holdMultiplier: 1 }, seed = Number(o.seed ?? 1);
    const segs = [];
    const P = {
      age,
      then(id, q = {}) {
        const level = q.level || "mild", target = resolve(id, level, age), prev = segs[segs.length - 1];
        const at = Number(q.at ?? (prev ? prev.at + 2 : 0));
        if (prev && at < prev.at) throw new Error(`ZC.feel: "${id}" at ${at} s comes before "${prev.target.id}" at ${prev.at} s`);
        const tr = prev ? (D().transitions || []).find((x) => x.from === prev.target.id && x.to === target.id) : null;
        segs.push({ at, target, mild: level === "strong" ? resolve(id, "mild", age) : null, tr, start: null });
        return P;
      },
      // the feeling's own value at t (before the living layer: breath, sway, tremble, blinks)
      at(t) {
        let i = segs.length - 1; while (i > 0 && segs[i].at > t) i--;
        return stateIn(i, t);
      },
      id(t) { return segs[segAt(t)].target.id; },
      // the engine face: the card's dials (the face renderers read smile, raise, inner, lid, open, round)
      // every face dial the heads draw (anatomy.js headArt): one brow, squint, eye direction, tears, sweat and the card's named mouth
      face(t) { const f = P.at(t).face; return { smile: f.smile, raise: f.raise, browL: f.browL, browR: f.browR, inner: f.inner, lid: f.lid, squint: f.squint, open: f.open, round: f.round, blush: f.blush, tears: f.tears, sweat: f.sweat, look: f.look, mouth: f.mouth }; },
      // a blink: 0 open … 1 shut, on the card's blink rate, a little irregular per person (deterministic from the seed)
      blink(t) {
        const rate = Math.max(1, P.at(t).face.blinkRate || 15), period = 60 / rate, n = Math.floor(t / period);
        const jitter = (Math.sin((n + 1) * 12.9898 * seed) * 43758.5453) % 1, start = n * period + Math.abs(jitter) * period * 0.5, u = (t - start) / 0.16;
        return u > 0 && u < 1 ? Math.sin(Math.PI * u) : 0;
      },
      // the body: the card's trim, its breathing on the stand's phase, its sway and tremble, its hands as a library part
      pose(b, t, posture = "stand") {
        const s = P.at(t).body, trim = {}, gs = segs[segAt(t)].target.gestures;
        for (const k of TRIM_KEYS) trim[k] = s[k] || 0;
        if (trim.armSpread > 12) trim.elbowZ += (trim.armSpread - 12) * 0.6; // open arms bend at the elbow (never flung out straight)
        trim.headRoll += (s.sway || 0) * 7 * Math.sin(t * 0.9 + seed); trim.spinePitch += (s.sway || 0) * 3 * Math.sin(t * 0.55 + seed * 2);
        trim.shoulderLift += (s.tremble || 0) * 0.08 * Math.sin(t * 41 + seed); trim.headRoll += (s.tremble || 0) * 1.2 * Math.sin(t * 37);
        const breathPhase = (((t * (s.breath || 1)) / 3.6) * 360) % 360;
        trim.shoulderLift += Math.sin((breathPhase * Math.PI) / 180) * 0.06 * ((s.breathDepth ?? 1) - 1);
        if (posture !== "stand") return b.pose(posture, 35, { trim });
        if (s._hA && s._hB && s._hA !== s._hB && s._hU > 0 && s._hU < 1) return b.blend(handsPose(b, s._hA, trim, breathPhase, gs), handsPose(b, s._hB, trim, breathPhase, gs), s._hU);
        return handsPose(b, s._hU != null && s._hU <= 0 ? s._hA : s.hands, trim, breathPhase, gs);
      },
      draw(b, t, at = {}) { const bl = P.blink(t); b.draw(P.pose(b, t, at.posture), { ...at, face: P.face(t), blink: bl }); return P; },
      // for the waist-up person (ZC.person): face, eyes, head tilt and nod from the card
      person(t) { const st = P.at(t), f = P.face(t); return { face: f, look: clamp(st.face.look?.[0] || 0, -1, 1), tilt: (st.body.headRoll || 0) + (st.body.sway || 0) * 6 * Math.sin(t * 0.9 + seed), down: clamp((st.body.headPitch || 0) / 30, -1, 1), blink: P.blink(t) }; },
    };
    function segAt(t) { let i = segs.length - 1; while (i > 0 && segs[i].at > t) i--; return i; }
    // hands from the card → the library's ready parts (an action for crossed / hips / behind, a gesture for chest / face), else trim
    // a hand to the face is the feeling's own gesture: a hand on the chin when thinking, covering the face in grief, the temple when
    // frustrated, the mouth when embarrassed, wiping a tear when crying (card gesture → library gesture)
    const FACE_GESTURE = { "chin-touch": "chin_think", "cover-face": "facepalm", "temple-touch": "scratch_head", "cover-mouth": "cover_mouth_shock", "wipe-tear": "wipe_tears", "wipe-brow": "wipe_sweat", "fan-face": "fan_hand", "hand-to-chest": "hand_on_chest" };
    function handsPose(b, h, trim, phase, gestures = []) {
      const A0 = root.ZANATOMY, lib = A0.library?.() || { actions: [], gestures: [] }, has = (k, id) => lib[k].includes(id);
      const own = h === "face" ? gestures.map((g) => FACE_GESTURE[g]).find((g) => g && has("gestures", g)) : null;
      const act = { crossed: "arms_crossed", hips: "hands_on_hips", behind: "hands_behind_back" }[h], ges = own || { chest: "hand_on_chest", face: "hands_to_cheeks" }[h];
      if (act && has("actions", act)) return b.pose(act, 180, { trim });
      if (ges && has("gestures", ges)) return b.pose("stand", phase, { trim, gesture: { id: ges, phase: 180 } });
      if (h === "front" || h === "clasped" || h === "pockets") return b.pose("stand", phase, { trim: { ...trim, elbowZ: trim.elbowZ + (h === "clasped" ? 38 : 22), armSpread: trim.armSpread - 6 } });
      return b.pose("stand", phase, { trim });
    }
    // the value inside segment i at t
    function stateIn(i, t) {
      const g = segs[i], sp = A().speed || 1;
      if (i === 0 && !g.start) g.start = { face: { ...g.target.face }, body: { ...g.target.body } }; // the film opens in the first feeling
      if (!g.start) g.start = stateIn(i - 1, g.at);
      const from = g.start, to = { face: g.target.face, body: g.target.body }, dt = (t - g.at) * sp;
      if (i === 0) return decay(g, to, dt);
      if (g.tr) { // the card's transition: beats accumulate from the captured state, the last one is the full destination
        const beats = g.tr.beats; let cur = from, prevAt = 0;
        for (let k = 0; k < beats.length; k++) {
          const last = k === beats.length - 1, next = last ? to : patchState(cur, beats[k]), at = beats[k].at;
          if (dt <= at) { const u = at > prevAt ? smooth(clamp((dt - prevAt) / (at - prevAt), 0, 1)) : 1; return blendState(cur, next, () => u); }
          cur = next; prevAt = at;
        }
        return decay(g, to, dt - prevAt);
      }
      const T = g.target.timing, on = T.onset || { notice: 0.2, change: 0.8, settle: 0.3 }, ease = EASE[T.ease] || smooth, leads = T.leads || [];
      const offs = D().playback.leadsOffsetsAsFractionOfChange || [0, 0.07, 0.14, 0.21, 0.28, 0.35];
      return handsOver(from, to, phaseIn(), dt, on, leads, offs);
      function phaseIn() {
      if (dt <= on.notice) return { face: { ...from.face, look: to.face.look }, body: from.body }; // the eyes answer first
      const c = dt - on.notice;
      if (c <= on.change) return blendState(from, to, (k) => { const li = leads.findIndex((p) => GROUP[p]?.includes(k)), off = (li < 0 ? 0 : offs[Math.min(li, offs.length - 1)]) * on.change; return ease(clamp((c - off) / Math.max(0.01, on.change - off), 0, 1)); });
      const st = c - on.change;
      if (st <= on.settle) { // a small overshoot on the body's angles that comes back (never on the face, tears or hands)
        const k = Math.sin(Math.PI * (st / on.settle)) * (D().playback.settleOvershootFraction ?? 0.035), body = { ...to.body };
        for (const n of ANGULAR) if (typeof body[n] === "number" && typeof from.body[n] === "number") body[n] += (to.body[n] - from.body[n]) * k;
        return { face: to.face, body };
      }
      return decay(g, to, dt - on.notice - on.change - on.settle);
      }
    }
    // the arms take their own time: a change of hands (and the arm dials with it) lasts at least HAND_MIN seconds from the moment the
    // hands' turn in the leads comes, even when the face has finished (a startle can't throw the arms in one frame)
    function handsOver(from, to, st, dt, on, leads, offs) {
      const off = (() => { const li = leads.findIndex((p) => p === "hands"); return (li < 0 ? 0 : offs[Math.min(li, offs.length - 1)]) * on.change; })();
      const len = Math.max(HAND_MIN, on.change - off), u = clamp((dt - on.notice - off) / len, 0, 1);
      if (u >= 1 || (from.body.hands === to.body.hands && Math.abs((from.body.elbowZ || 0) - (to.body.elbowZ || 0)) < 1e-6 && Math.abs((from.body.armSpread || 0) - (to.body.armSpread || 0)) < 1e-6)) return st;
      const k = smooth(u), body = { ...st.body, elbowZ: lerp(from.body.elbowZ || 0, to.body.elbowZ || 0, k), armSpread: lerp(from.body.armSpread || 0, to.body.armSpread || 0, k) };
      if (from.body.hands !== to.body.hands) { body._hA = from.body.hands; body._hB = to.body.hands; body._hU = k; body.hands = k < 0.5 ? from.body.hands : to.body.hands; }
      return { face: st.face, body };
    }
    // a strong feeling held, then eased to the same feeling's mild card (intensity, not recovery)
    function decay(g, to, after) {
      if (!g.mild) return to;
      const hold = (g.target.timing.hold || 0) * (A().holdMultiplier || 1);
      if (!(hold > 0) || after <= hold) return to;
      return blendState(to, { face: g.mild.face, body: g.mild.body }, () => smooth(clamp((after - hold) / 0.6, 0, 1)));
    }
    function blendState(a, b, uOf) {
      const face = {}, body = {};
      for (const k of new Set([...Object.keys(a.face), ...Object.keys(b.face)])) face[k] = mix(a.face[k] ?? b.face[k], b.face[k] ?? a.face[k], uOf(k));
      for (const k of new Set([...Object.keys(a.body), ...Object.keys(b.body)])) if (k[0] !== "_") body[k] = mix(a.body[k] ?? b.body[k], b.body[k] ?? a.body[k], uOf(k));
      // hands are a pose, not a number: keep both and how far between them, so the drawn arms blend (never jump)
      const ha = a.body._hB ? (a.body._hU >= 1 ? a.body._hB : null) : a.body.hands;
      if ((ha ?? a.body.hands) !== b.body.hands) { body._hA = ha ?? a.body.hands; body._hB = b.body.hands; body._hU = smooth(clamp(uOf("hands"), 0, 1)); }
      return { face, body };
    }
    P.then(first, { level: o.level, at: o.at ?? 0 });
    return P;
  }
  const feelings = () => Object.keys(D()?.emotions || {});
  root.ZACTING = { feel, resolve, feelings, ageOf };
  if (root.ZC) Object.assign(root.ZC, { feel, feelings });
})(typeof window !== "undefined" ? window : globalThis);
