// ZC.shot: a whole 2D shot by NAME, not by maths (skills/2d-animation/core-graphic.md §1). The designer says who stands where (metres),
// what each person does when (library actions, walks to a point, feelings, a prop in a hand, a hand-over) and the camera by shot size;
// the engine does the geometry: real sizes at each depth, steps that match the distance walked, blends between actions (no one-frame
// switch), lip-sync from who really speaks (the recorded lines), props kept on the hand in every rig, the waist-up person for close
// sizes standing in the same place (the place stays behind them), and a camera framed by the rule book. Every frame is a function of t.
//   ZC.shot(W, tl, s, d, words, {
//     place: "courtyard", view: "wide",                       (or ground: "#f4e3c3" for a moment with no place)
//     cast: { imran: { at: [-0.5, 3], view: "three", facing: 1, hold: { R: "bag" } }, mohi: { at: [0.5, 3], view: "three", facing: -1 } },
//     props: { bag: { part: "schoolBagHeld", color: "#2b2d33", text: "MOHI" } },
//     crowd: [{ n: 3, dz: 9, mode: "walk" }],
//     acts: { imran: [{ at: 0, do: "walk", to: [-0.5, 1] }, { at: 2.6, do: "stand", feel: "scared", look: "down" }],
//             mohi:  [{ at: 0, do: "walk", to: [0.5, 1], gesture: "talk_explain", look: "imran" }, { at: 2.9, do: "stand", feel: "surprised", look: "imran" }] },
//     camera: [{ at: 0, on: ["imran", "mohi"], size: "wide", to: "full" }, { at: 2.6, on: "imran", size: "closeUp" }],
//     draw(t, S) { … }                                         optional: this shot's own extra drawing every frame (graphics, effects)
//   })
// A beat: at (scene s) · do (walk run stand idle sit, any library action or gesture id) · to: [x, dz] (walk/run there; without it a
// walk goes on at its own speed) · by (when the move ends) · feel (ZC.feel card) · face (a face name or dials) · look ("down", "up",
// a cast id) · gesture (a gesture id over the action) · hands (waist-up hands name) · give: { what, to, hand, toHand, by } · say: true
// (lip-sync on the words inside this beat when the film has no recorded speakers). Errors come back all together in one message.
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, ease = (u) => u * u * (3 - 2 * u);
  const CLOSE = new Set(["closeUp", "mediumClose", "extremeClose"]);
  const SPEED = { walk: 1.3, run: 3.6 };
  const speakers = () => { if (root.__zcSpk) return root.__zcSpk; try { root.__zcSpk = JSON.parse(root.document?.getElementById("hf-speakers")?.textContent || "[]"); } catch { root.__zcSpk = []; } return root.__zcSpk; };

  function shot(W, tl, s0, d, words = [], plan = {}) {
    const ZC = root.ZC, A = root.ZANATOMY, errs = [];
    const lib = A.library(), ACTIONS = new Set([...lib.actions, "walk", "run", "stand", "idle", "sit", "squat", "ruku", "sajdah", "sleep", "wave", "point", "reach", "clap", "cheer", "hold", "jump"]), GESTURES = new Set(lib.gestures);
    const castIds = Object.keys(plan.cast || {}); if (!castIds.length && !plan.draw) errs.push("cast: name at least one person (a ZF.cast id) or give draw(t, S).");
    const sizeOk = (z) => { try { root.ZCAMERA.sizeId(z); return true; } catch { return false; } };
    // ---------- the world ----------
    let P = null, Z;
    if (plan.place) { try { P = ZC.place(plan.place, W, { view: plan.view, world: plan.world }); Z = P.Z; } catch (e) { errs.push(e.message); } }
    if (!Z) {
      W.layer("sky"); W.layer("far", { blur: 2.5 }); const L = W.layer("world"); W.alias("mid", "world"); W.alias("people", "world"); W.layer("front");
      Z = root.ZW.view(W, plan.world || {}); const g = plan.ground || "#f1dfbf", sky = W.layer("sky");
      ZC.el("rect", { x: -W.w * 3, y: -W.h * 3, width: W.w * 7, height: Z.horizon + W.h * 3, fill: root.ZS?.tint ? root.ZS.tint.light(g, 0.35) : g }, sky);
      ZC.el("rect", { x: -W.w * 3, y: Z.horizon, width: W.w * 7, height: W.h * 4, fill: g }, sky);
      P = { layer: L, Z, tick: () => {} };
    }
    const layer = P.layer, front = W.layer("front");
    // ---------- people ----------
    const who = {};
    for (const id of castIds) {
      const c = plan.cast[id] || {}, spec = c.spec || root.ZF?.cast?.[id];
      if (!spec) { errs.push(`cast.${id}: no such person (this film's cast: ${Object.keys(root.ZF?.cast || {}).join(", ") || "none"}).`); continue; }
      const at0 = Array.isArray(c.at) ? c.at : c.at ? [c.at.x ?? 0, c.at.dz ?? 0] : [0, 1];
      const a = Z.person(spec, { x: at0[0], dz: at0[1], layer });
      const view = c.view || "three";
      who[id] = { id, spec, view, facing: c.facing ?? 1, x0: at0[0], dz0: at0[1], slot: a.slot, body: ZC.actor(a.slot, { spec, ...a, view, facing: c.facing ?? 1, id: `shot-${id}` }), beats: [], rigs: {} };
    }
    // ---------- props ----------
    const props = {};
    for (const [pid, p] of Object.entries(plan.props || {})) {
      const part = p.part, draw = root.ZS?.[part];
      if (typeof draw !== "function") { errs.push(`props.${pid}: no part "${part}" (find one with find_parts).`); continue; }
      const metres = p.m || root.ZW.metresOf(part)?.m || 0.4;
      props[pid] = { id: pid, part, metres, spec: p, thing: null, s0: 1 };
    }
    // who holds what at the start
    const holds = {}; // prop → [{ t, who, hand }]
    for (const id of Object.keys(who)) for (const [hand, pid] of Object.entries(plan.cast[id].hold || {})) {
      if (!props[pid]) { errs.push(`cast.${id}.hold: no prop "${pid}" in props.`); continue; }
      (holds[pid] ||= []).push({ t: -1, who: id, hand: hand === "L" ? "L" : "R" });
    }
    // ---------- beats ----------
    for (const [id, list] of Object.entries(plan.acts || {})) {
      const P0 = who[id]; if (!P0) { errs.push(`acts.${id}: not in cast.`); continue; }
      let last = -1, x = P0.x0, dz = P0.dz0;
      (list || []).forEach((b, i) => {
        const tag = `acts.${id}[${i}]`, kind = b.do || "stand";
        if (!(Number(b.at) >= 0)) errs.push(`${tag}: give at (seconds in this scene).`);
        if (b.at < last) errs.push(`${tag}: at ${b.at} comes before the beat before it.`); last = b.at;
        if (!ACTIONS.has(kind) && !GESTURES.has(kind)) errs.push(`${tag}: no action "${kind}" (find_parts gives the ids).`);
        if (b.gesture && !GESTURES.has(b.gesture)) errs.push(`${tag}: no gesture "${b.gesture}".`);
        if (b.look && !["down", "up", "camera", "ahead"].includes(b.look) && !who[b.look]) errs.push(`${tag}: look "${b.look}" is not down, up, camera, ahead or a cast id.`);
        if (b.give) { if (!props[b.give.what]) errs.push(`${tag}: give.what "${b.give.what}" is not in props.`); if (!who[b.give.to]) errs.push(`${tag}: give.to "${b.give.to}" is not in cast.`); }
        const next = list[i + 1]?.at ?? d, moving = kind === "walk" || kind === "run";
        let to = b.to ? (Array.isArray(b.to) ? b.to : [b.to.x ?? x, b.to.dz ?? dz]) : null, by = b.by ?? next;
        if (moving && !to) { // on at its own speed: across the frame when side on, toward the camera otherwise
          const m = SPEED[kind] * Math.max(0.1, by - b.at), side = P0.view === "side";
          to = side ? [x + P0.facing * m, dz] : P0.view === "back" ? [x, dz + m] : [x, Math.max(0.5 - Z.d0 + 0.6, dz - m)];
        }
        const from = [x, dz]; if (to) { x = to[0]; dz = to[1]; }
        P0.beats.push({ ...b, kind, from, to: to || from, t0: b.at, t1: Math.max(b.at + 0.05, by), moving: moving && !!to });
        if (b.give && props[b.give.what]) (holds[b.give.what] ||= []).push({ t: b.give.by ?? b.at + 0.8, t0: b.at, who: b.give.to, hand: b.give.toHand === "L" ? "L" : "R", from: id, fromHand: b.give.hand === "L" ? "L" : "R" });
      });
      // a feeling line through the beats
      const fb = P0.beats.filter((b) => b.feel);
      if (fb.length) try { let F = ZC.feel(fb[0].feel, { spec: P0.spec, at: fb[0].at, level: fb[0].level }); for (const b of fb.slice(1)) F = F.then(b.feel, { at: b.at, level: b.level }); P0.F = F; } catch (e) { errs.push(`acts.${id}: ${e.message}`); }
    }
    const hos = Object.values(holds).flat().filter((e) => e.from).sort((a, b) => a.t0 - b.t0);
    for (const e of hos) { e.pre = 0.35; e.post = 0.35; }
    for (let i = 0; i < hos.length; i++) for (let j = i + 1; j < hos.length; j++) {
      const a = hos[i], b = hos[j], share = [a.from, a.who].some((x) => x === b.from || x === b.who); if (!share) continue;
      const gap = b.t0 - a.t; if (gap < 0) { errs.push(`hand-overs of "${a.from}" and "${b.from}" overlap: start the second after the first's by.`); continue; }
      // close together: the arm does not come down in between; the next reach starts from where the last one is (both ease, no jump)
    }
    for (const id of Object.keys(who)) if (!who[id].beats.length) who[id].beats.push({ kind: "idle", t0: 0, t1: d, from: [who[id].x0, who[id].dz0], to: [who[id].x0, who[id].dz0], moving: false });
    // ---------- camera ----------
    const cams = (plan.camera || []).map((c, i) => ({ ...c, on: [].concat(c.on || castIds) }));
    if (!cams.length) errs.push("camera: give the shot list ({ at, on, size, to }).");
    cams.forEach((c, i) => {
      if (!sizeOk(c.size)) errs.push(`camera[${i}]: no size "${c.size}" (closeUp, mediumClose, medium, mediumWide, full, wide, extremeWide).`);
      if (c.to && !sizeOk(c.to)) errs.push(`camera[${i}]: no size "${c.to}" in to.`);
      for (const o of c.on) if (!who[o]) errs.push(`camera[${i}]: "${o}" is not in cast.`);
      if (sizeOk(c.size) && c.to && sizeOk(c.to) && CLOSE.has(root.ZCAMERA.sizeId(c.size)) !== CLOSE.has(root.ZCAMERA.sizeId(c.to))) errs.push(`camera[${i}]: ${c.size} → ${c.to} crosses from a full body to a waist-up person: make it two shots (cut at the change).`);
    });
    if (errs.length) throw new Error(`ZC.shot: fix these (all of them, then save once):\n- ${errs.join("\n- ")}`);
    const camEnd = (i) => cams[i + 1]?.at ?? d;

    // ---------- the state of a person at t ----------
    const beatAt = (P0, t) => { let i = 0; for (let k = 0; k < P0.beats.length; k++) if (t >= P0.beats[k].t0) i = k; return i; };
    function where(P0, t) { // [x, dz] and how far walked in this beat (metres)
      const b = P0.beats[beatAt(P0, t)];
      if (t < b.t0) return { x: P0.x0, dz: P0.dz0, walked: 0 };
      const u = clamp((t - b.t0) / (b.t1 - b.t0), 0, 1), k = b.moving ? u : 1;
      const x = lerp(b.from[0], b.to[0], k), dz = lerp(b.from[1], b.to[1], k);
      return { x, dz, walked: Math.hypot(x - b.from[0], dz - b.from[1]), b, u };
    }
    const strideM = {}; // metres per cycle, from this person's own legs
    function stride(P0, kind) {
      const key = `${P0.id}:${kind}`; if (strideM[key]) return strideM[key];
      let lo = Infinity, hi = -Infinity; for (let a = 0; a < 360; a += 30) { const z = P0.body.pose(kind, a).joints.ankleL.z; lo = Math.min(lo, z); hi = Math.max(hi, z); }
      const q = Z.person(P0.spec, { x: P0.x0, dz: P0.dz0 }); return (strideM[key] = (2 * (hi - lo) * (q.H / 27)) / q.s);
    }
    const lookTrim = (P0, b, pos) => {
      if (!b.look) return {};
      if (b.look === "down") return { headPitch: 28 }; if (b.look === "up") return { headPitch: -20 }; if (b.look === "ahead" || b.look === "camera") return {};
      const o = where(who[b.look], b.t0 + 0.01), dx = o.x - pos.x, ahead = dx * P0.facing;
      return { headYaw: clamp((ahead >= 0 ? 1 : -1) * (P0.view === "side" ? 15 : 35), -45, 45) };
    };
    function beatPose(P0, i, t) {
      const b = P0.beats[i], pos = where(P0, Math.max(t, b.t0)), B = P0.body, trim = lookTrim(P0, b, pos), g = b.gesture ? { gesture: { id: b.gesture, phase: (((t - b.t0) / 2) % 1) * 360 } } : {};
      if (b.moving) {
        const walked = Math.hypot(pos.x - b.from[0], pos.dz - b.from[1]), mv = B.pose(b.kind, ((walked / stride(P0, b.kind)) % 1) * 360, { trim, ...g });
        const settle = ease(clamp((t - b.t1) / 0.3, 0, 1)); return settle > 0 ? B.blend(mv, B.pose("stand", 0, { trim }), settle) : mv;
      }
      if (P0.F && (b.kind === "stand" || b.kind === "idle") && !b.gesture) { const p = P0.F.pose(B, t); return Object.keys(trim).length ? B.blend(p, B.pose("stand", 0, { trim }), 0.6) : p; }
      if (b.kind === "idle") return B.pose("stand", (((t / 3.6) * 360) % 360), { trim, ...g });
      if (GESTURES.has(b.kind)) return B.pose("stand", 35, { trim, gesture: { id: b.kind, phase: clamp((t - b.t0) / (A.libraryDef(b.kind)?.seconds || 1.5), 0, 1) * 359 } });
      const def = A.libraryDef(b.kind), sec = def?.seconds || 1.6;
      const ph = def?.loop || ["walk", "run", "clap", "cheer", "wave"].includes(b.kind) ? ((((t - b.t0) / sec) % 1) * 360) : clamp((t - b.t0) / sec, 0, 1) * 359.9;
      return B.pose(b.kind, def || !["stand"].includes(b.kind) ? ph : 35, { trim, ...g });
    }
    function poseAt(P0, t) {
      const i = beatAt(P0, t), w = ease(clamp((t - P0.beats[i].t0) / 0.25, 0, 1)), cur = beatPose(P0, i, t);
      return i > 0 && w < 1 ? P0.body.blend(beatPose(P0, i - 1, t), cur, w) : cur;
    }
    function faceAt(P0, t) { const b = P0.beats[beatAt(P0, t)]; if (b.face) return b.face; return P0.F ? P0.F.face(t) : b.moving ? "happy" : "neutral"; }
    function mouthAt(P0, t) {
      const tv = t + s0, sp = speakers();
      if (sp.length) { const r = sp.find((x) => x.who === P0.id && tv >= x.s - 0.02 && tv <= x.e + 0.02); return r ? ZC.mouth(tv, words.filter((w) => (w.t ?? w.start) >= r.s - 0.05 && (w.e ?? w.end) <= r.e + 0.05)) : 0; }
      const b = P0.beats[beatAt(P0, t)]; return b.say ? ZC.mouth(tv, words.filter((w) => (w.t ?? w.start) - s0 >= b.t0 && (w.t ?? w.start) - s0 < b.t1)) : 0;
    }
    function drawBody(P0, t, pose) {
      const pos = where(P0, t), q = Z.person(P0.spec, { x: pos.x, dz: pos.dz }); Z.depth(P0.slot, pos.dz);
      let facing = P0.facing; const b = pos.b; if (b?.moving && P0.view === "side" && b.to[0] !== b.from[0]) facing = b.to[0] > b.from[0] ? 1 : -1;
      P0.at = { x: q.x, floor: q.floor, H: q.H, facing, s: q.s, dz: pos.dz, moving: !!(b?.moving && t < b.t1 && t >= b.t0) };
      P0.pose = pose || poseAt(P0, t);
      P0.body.draw(P0.pose, { ...P0.at, center: { x: 0, y: 0, z: 0 }, face: faceAt(P0, t), mouth: mouthAt(P0, t), blink: P0.F?.blink(t) || undefined });
    }
    // ---------- the camera at t: framed on the people at the shot's start (a still camera), `to` = a move to that size by its end ----------
    const camCache = {};
    function frameFor(list, size) {
      const rs = list.map((id) => { const c = root.ZCAMERA.frameOf(W, who[id].body, size); const h = c[2] / (W.w / W.h); return [c[0] - c[2] / 2, c[1] - h / 2, c[0] + c[2] / 2, c[1] + h / 2]; });
      let [l, tp, r, bt] = rs[0]; for (const q of rs.slice(1)) { l = Math.min(l, q[0]); tp = Math.min(tp, q[1]); r = Math.max(r, q[2]); bt = Math.max(bt, q[3]); }
      const asp = W.w / W.h, w = Math.max(r - l, (bt - tp) * asp); return [(l + r) / 2, (tp + bt) / 2, w];
    }
    function camAt(i, when) { // framing of shot i with everyone where they are at `when`
      const key = `${i}:${when.toFixed(3)}`; if (camCache[key]) return camCache[key];
      for (const id of Object.keys(who)) drawBody(who[id], when);
      const c = cams[i], end = camEnd(i);
      return (camCache[key] = frameFor(c.on, when >= end - 1e-6 && c.to ? c.to : c.size));
    }

    // ---------- props drawn once, kept on a hand ----------
    for (const p of Object.values(props)) {
      const h0 = holds[p.id]?.[0], P0 = h0 ? who[h0.who] : null, sNow = P0 ? Z.person(P0.spec, { x: P0.x0, dz: P0.dz0 }).s : Z.at(0, 0).s;
      p.s0 = sNow; const top = root.ZWORLD_DATA?.drawn?.pieces?.[p.part]?.top || 1;
      p.thing = ZC.prop(P0 ? P0.slot : front, (g) => {
        root.ZS[p.part](g, { h: (p.metres * sNow) / top, seed: p.spec.seed || 1, color: p.spec.color });
        if (p.spec.text) try { const bb = g.getBBox(), tw = bb.width * 0.62, th = bb.height * 0.17, cy = bb.y + bb.height * 0.6;
          ZC.el("rect", { x: bb.x + bb.width / 2 - tw / 2, y: cy - th / 2, width: tw, height: th, rx: th * 0.25, fill: "#ffffff" }, g);
          const tx = ZC.el("text", { x: bb.x + bb.width / 2, y: cy + th * 0.32, "text-anchor": "middle", "font-size": th * 0.8, "font-weight": 800, fill: "#1b2330", "font-family": "Nunito, Inter, Arial, sans-serif" }, g); tx.textContent = p.spec.text; } catch { /* no layout */ }
      });
    }
    const holderAt = (pid, t) => { let h = null; for (const e of holds[pid] || []) if (t >= (e.t0 ?? e.t)) h = e; return h; };

    // ---------- the waist-up person for close sizes, standing where the full body stands ----------
    // Its head is made as big as the full body's (hair top to chin, measured on the page) so the cut keeps the person's size; the close
    // camera is framed on this person itself, its bottom edge always above where the waist-up body ends (it never shows its end).
    const toSlot = (P0, rc) => { const m = P0.slot.getScreenCTM().inverse(), a = new DOMPoint(rc.left, rc.top).matrixTransform(m), b = new DOMPoint(rc.right, rc.bottom).matrixTransform(m); return { top: a.y, bottom: b.y, left: a.x, right: b.x }; };
    const headOf = (P0, g) => { const fig = [...g.querySelectorAll("g")].find((x) => x.children.length >= 4 && x.children[2].querySelector("path")); return toSlot(P0, fig.children[3].getBoundingClientRect()); };
    function rigFor(P0, i) {
      if (P0.rigs[i]) return P0.rigs[i];
      const B = P0.body.box(), look1 = root.ZPEOPLE.look({ ...P0.spec, scale: 1 }), shW1 = 2 * look1.arms[1].sh[0] * look1.s, scale = P0.at.H / (0.888 * shW1);
      let k = 0.84, y = B.headY;
      try {
        const vis = P0.body.box && P0.slot.firstChild.getAttribute("display"); P0.slot.firstChild.setAttribute("display", "inline");
        const aTop = P0.slot.firstChild.getBBox().y, aChin = B.headTop + B.headPx; P0.slot.firstChild.setAttribute("display", vis || "inline");
        const tmp = ZC.el("g", {}, P0.slot), r0 = ZC.person(tmp, { spec: P0.spec, x: B.x, y: B.headY, scale, id: `shot-${P0.id}-m${i}` }); r0.draw({ hands: "rest" }, 0);
        const h = headOf(P0, tmp); tmp.remove(); for (const rec of ["__who", "__waist", "__rig", "__reach"]) if (root[rec]) delete root[rec][`shot-${P0.id}-m${i}`];
        if (h.bottom - h.top > 1 && aChin - aTop > 1) { k = (aChin - aTop) / (h.bottom - h.top); y = aTop - (h.top - B.headY) * k; }
      } catch { /* no layout: the usual size */ }
      const n0 = P0.slot.children.length, r = ZC.person(P0.slot, { spec: P0.spec, x: B.x, y, scale: scale * k, id: `shot-${P0.id}-cu${i}` });
      const bodyG = P0.slot.children[n0];
      try { r.draw({ hands: "rest" }, 0); const h = headOf(P0, bodyG), bb = bodyG.getBBox(); r.metrics = { top: h.top, bottom: h.bottom, x: (h.left + h.right) / 2, end: bb.y + bb.height }; } catch { r.metrics = { top: y - 60 * k, bottom: y + 60 * k, x: B.x, end: y + 400 * k }; }
      for (const rec of ["__who", "__waist"]) if (root[rec]) delete root[rec][`shot-${P0.id}-cu${i}`];
      return (P0.rigs[i] = r);
    }
    const CU = { extremeClose: [1.5, 0.04], closeUp: [2.3, 0.07], mediumClose: [3.2, 0.08] }; // frame height in heads, headroom
    function rigFrame(list, size) {
      const asp = W.w / W.h; let top = Infinity, bottom = -Infinity, l = Infinity, r = -Infinity, end = Infinity;
      for (const m of list) { const hh = m.bottom - m.top, [n, room] = CU[size], Hf = n * hh; top = Math.min(top, m.top - room * Hf); bottom = Math.max(bottom, m.top - room * Hf + Hf); l = Math.min(l, m.x - hh * 1.3); r = Math.max(r, m.x + hh * 1.3); end = Math.min(end, m.end); }
      if (bottom > end - 4) bottom = end - 4; // the waist-up body always runs past the frame's bottom edge
      let h = bottom - top, w = h * asp; if (w < r - l) { w = r - l; h = w / asp; top = bottom - h; }
      return [(l + r) / 2, top + h / 2, w];
    }
    const shownRig = {};
    // crowds: real people at their depth, in the world layer
    const avg = { gender: "male", age: "adult" };
    const crowds = [].concat(plan.crowd || []).map((c) => { const a = Z.person(avg, { x: 0, dz: c.dz ?? 8, layer }), sp = Z.at(0, c.dz ?? 8).s;
      return ZC.crowd(a.slot, { n: c.n || 4, rows: c.rows || 1, x0: a.x + (c.x0 ?? -6) * sp, x1: a.x + (c.x1 ?? 6) * sp, floor: a.floor, H: a.H, mode: c.mode || "walk", seed: c.seed || 3 }); });
    // ---------- every frame ----------
    const S = { W, P, Z, who, props, layer, front, cams };
    ZC.clock(tl, s0, d, (t) => {
      P.tick?.(t);
      for (const c of crowds) c.draw(t);
      // the camera first (it needs everyone at the shot's start), then everyone at t
      let ci = 0; for (let k = 0; k < cams.length; k++) if (t >= cams[k].at) ci = k;
      const c = cams[ci], end = camEnd(ci), close = CLOSE.has(root.ZCAMERA.sizeId(c.size));
      for (const id of Object.keys(who)) who[id].body.show(true);
      let cam;
      if (!close) {
        const a = camAt(ci, c.at); cam = a;
        if (c.to) { const b2 = camAt(ci, end), u = ease(clamp((t - c.at) / Math.max(0.05, end - c.at), 0, 1)); cam = a.map((v, k) => lerp(v, b2[k], u)); }
        for (const id of Object.keys(who)) drawBody(who[id], t);
        if (c.follow) cam = frameFor(c.on, c.size);
      } else for (const id of Object.keys(who)) drawBody(who[id], t);
      // hand-overs: both hands go to the meeting point, the thing moves palm to palm
      for (const [pid, list] of Object.entries(holds)) for (const e of list) if (e.from && t >= e.t0 - e.pre && t <= e.t + e.post) {
        // both arms reach (the palm leads, the wrist straight), the hands meet between the two at elbow height
        const G = who[e.from], R = who[e.who], w = ease(clamp((t - (e.t0 - e.pre)) / e.pre, 0, 1)) * ease(clamp((e.t + e.post - t) / e.post, 0, 1));
        const ge = G.body.jointAt("elbow" + e.fromHand), re = R.body.jointAt("elbow" + e.hand), gh = G.body.handAt(e.fromHand), rh = R.body.handAt(e.hand);
        const m = { x: (gh.x + rh.x) / 2, y: (ge.y + re.y) / 2 + Math.abs(gh.x - rh.x) * 0.05 };
        for (const [X, hand] of [[G, e.fromHand], [R, e.hand]]) { const p = X.body.reach(X.pose, hand, m, w * 0.9, { ...X.at, straight: Math.min(1, w * 3) }); X.pose = p; X.body.draw(p, { ...X.at, center: p.center, face: faceAt(X, t), mouth: mouthAt(X, t) }); }
      }
      // a close shot: framed on this shot's waist-up people (made once, measured), the camera set before they are drawn (the gate reads it)
      if (close) {
        const ms = c.on.map((id) => rigFor(who[id], ci).metrics), a = rigFrame(ms, root.ZCAMERA.sizeId(c.size));
        cam = a; if (c.to) { const b2 = rigFrame(ms, root.ZCAMERA.sizeId(c.to)), u = ease(clamp((t - c.at) / Math.max(0.05, end - c.at), 0, 1)); cam = a.map((v, k) => lerp(v, b2[k], u)); }
      }
      W.cam(cam[0], cam[1], cam[2], c.tilt || 0);
      // the waist-up person of a close shot in place of the full body (the full body hidden, so it is not judged)
      for (const id of Object.keys(who)) {
        const P0 = who[id], useCu = close && c.on.includes(id);
        for (const [k, r] of Object.entries(P0.rigs)) if (!(useCu && Number(k) === ci)) r.show(false);
        shownRig[id] = null; if (!useCu) continue;
        if (P0.at.moving) throw new Error(`ZC.shot: camera[${ci}] is a close size on ${id} while ${id} walks: end the walk (by) before the close shot, or use medium or wider.`);
        const r = rigFor(P0, ci); P0.body.show(false); for (const rec of ["__who", "__shots", "__bodies"]) if (root[rec]) delete root[rec][P0.body.id];
        const b = P0.beats[beatAt(P0, t)], lk = b.look && who[b.look] ? clamp(Math.sign(who[b.look].at.x - P0.at.x), -1, 1) : 0;
        const fl = P0.F ? P0.F.person(t) : { face: faceAt(P0, t) };
        r.show(true); r.draw({ ...fl, ...(b.face ? { face: b.face } : {}), hands: b.hands || "rest", turn: lk * 0.5, look: lk * 0.8, down: b.look === "down" ? 0.5 : fl.down || 0, mouth: mouthAt(P0, t) }, t);
        shownRig[id] = r;
      }
      // props on their holder's hand (in whichever body is shown), in front of that person
      for (const [pid, p] of Object.entries(props)) {
        const h = holderAt(pid, t); if (!h) { p.thing.show(false); continue; }
        const X = who[h.who], r = shownRig[h.who]; p.thing.show(true);
        if (h.from && t < h.t) { const G = who[h.from], u = ease(clamp((t - h.t0) / Math.max(0.05, h.t - h.t0), 0, 1)), A1 = G.body.handAt(h.fromHand), B1 = X.body.handAt(h.hand);
          (u < 0.5 ? G : X).slot.appendChild(p.thing.g); p.thing.at(lerp(A1.x, B1.x, u), lerp(A1.y, B1.y, u), 0, X.at.s / p.s0); continue; }
        X.slot.appendChild(p.thing.g);
        // the waist-up person: in the hand a one-hand hold names (cup, sip), between both fists for a two-hand hold, else in the holding hand
        if (r) { const nm = X.beats[beatAt(X, t)]?.hands, one = r.holdsWith?.(nm);
          if (one != null) { const q = r.handAt(one); p.thing.at(q.x, q.y, 0, X.at.s / p.s0); }
          else if (nm === "hold") { const a = r.handAt(0), b = r.handAt(1); p.thing.at((a.x + b.x) / 2, (a.y + b.y) / 2, 0, X.at.s / p.s0); }
          else { const B = X.body.handAt(h.hand), side = B.x < X.at.x ? 0 : 1, q = r.handAt(side); p.thing.at(q.x, q.y, 0, X.at.s / p.s0); } }
        else { const q = X.body.handAt(h.hand), sw = X.at.moving ? Math.sin(t * 7) * 6 : 0; p.thing.at(q.x, q.y, sw, X.at.s / p.s0); }
      }
      if (plan.draw) plan.draw(t, S);
    });
    return S;
  }
  root.ZC = root.ZC || {};
  root.ZC.shot = shot;
})(typeof window !== "undefined" ? window : globalThis);
