// ZC: the 2D Animation design system's kit for the motion designers (skills/2d-animation/core-graphic.md). A scene draws its
// own world as SVG and puts ZanHuman people in it; the people keep the body rules by themselves (rig.js R1–R10 for the acting
// person, anatomy.js H01–H21 for the full body). Every frame is drawn from the timeline's time (seek-safe): ZC.clock calls the
// scene's draw(t) on every seek.
//   const W = ZC.world(root)                       an SVG world the size of the video's frame (W.w, W.h, W.svg, W.layer(name), W.cam(x, y, w))
//   ZC.clock(tl, s, d, (t, u) => { … })              t = seconds inside the scene, u = 0..1
//   const r = ZC.person(W.layer("people"), { spec, x, y, scale, longer })   waist up: face, mouth, hands (talking, acting, close shots)
//     r.draw({ face, turn, down, tilt, look, mouth, round, blink, hands, handPoses, lean, nod }, t)   hands: "rest" | "wave" | "cheer" |
//       "clap" | "point" | "chest" | "face" | "hold" | "hips" | [[x, y], [x, y]]
//   const b = ZC.actor(W.layer("run"), { spec, H, x, floor, view: "side" | "front" | "three" | "back", facing: 1 | -1 })   (ZC.body is the same)
//     b.draw(ZC.run(u) | ZC.walk(u) | ZC.stand() | ZC.sit() | ZC.squat() | ZC.ruku() | ZC.sajdah() | ZC.sleep() | ZC.clap(t) | ZC.cheer(t) | ZC.wave(t) | ZC.fingerUp() | ZC.point() | ZC.reach() | ZC.hold() | ZC.jump(k) | b.blend(a, b2, u))
//   const c = ZC.crowd(W.layer("stands"), { n, x0, x1, floor, H, mode: "clap" | "cheer" | "watch" | "walk" | a library action id, seed, rows })   c.draw(t)
//   ZC.mouth(t, words)   open 0..1 from the spoken words' times (lip-sync for the line's speaker only)
//   ZC.keys(t, [[t0, v0], [t1, v1], …])   eased value between keys (numbers or arrays)
//   ZC.FACES   neutral talk listen happy sad surprised think angry proud scared worried relieved embarrassed excited determined tired
(function (root) {
  const NS = "http://www.w3.org/2000/svg";
  const el = (tag, a = {}, p) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, ease = (u) => u * u * (3 - 2 * u);
  let n = 0;
  const FACES = {
    neutral: { smile: 0.15, raise: 0.05, inner: 0, lid: 0.08 }, talk: { smile: 0.25, raise: 0.2, inner: 0, lid: 0.05 }, listen: { smile: 0.15, raise: 0.1, inner: 0, lid: 0.08 },
    happy: { smile: 1, raise: 0.35, inner: 0, lid: 0.15 }, sad: { smile: -0.5, raise: 0.45, inner: 0.9, lid: 0.35 }, surprised: { smile: -0.1, raise: 1.5, inner: 0, lid: -0.35, open: 0.6 },
    think: { smile: 0, raise: 0.2, inner: -0.35, lid: 0.3 }, angry: { smile: -0.55, raise: -0.45, inner: -0.8, lid: 0.2 }, proud: { smile: 0.85, raise: 0.3, inner: 0, lid: 0.25 },
    scared: { smile: -0.6, raise: 1.3, inner: 1.0, lid: -0.3, open: 0.35 }, worried: { smile: -0.35, raise: 0.7, inner: 1.0, lid: 0.05 }, relieved: { smile: 0.7, raise: 0.2, inner: 0.3, lid: 0.45 },
    embarrassed: { smile: 0.25, raise: 0.4, inner: 0.7, lid: 0.4 }, excited: { smile: 1, raise: 1.0, inner: 0, lid: -0.15, open: 0.45 }, determined: { smile: 0.1, raise: -0.25, inner: -0.6, lid: 0.25 },
    tired: { smile: -0.15, raise: -0.1, inner: 0.4, lid: 0.6 },
  };
  const K = (t, keys) => { if (!keys?.length) return undefined; if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [t0, v0] = keys[i - 1], [t1, v1] = keys[i], u = ease((t - t0) / (t1 - t0)); return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], u)) : lerp(v0, v1, u); }
    return keys[keys.length - 1][1]; };

  // the world is the real frame by default (9:16, 16:9, 1:1, 4:5): compose tells the kit its size
  function world(rootEl, { w = root.__ZC_FRAME?.w || 1080, h = root.__ZC_FRAME?.h || 1920 } = {}) {
    const idp = `zc${++n}-`, svg = el("svg", { viewBox: `0 0 ${w} ${h}`, width: "100%", height: "100%", preserveAspectRatio: "xMidYMid slice", style: "position:absolute;inset:0;overflow:hidden" }, rootEl);
    const defs = el("defs", {}, svg), cam = el("g", {}, svg), layers = {};
    svg.__cam = { x: w / 2, y: h / 2, cw: w, ch: h }; // what the camera sees, in world px (the gate checks framing against it: W1)
    const grad = (id, stops) => { const g = el("linearGradient", { id, x1: 0, y1: 0, x2: 1, y2: 0 }, defs); stops.forEach(([o, c, a]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": a }, g)); };
    grad("g-shade", [[0, "#5a2c14", 0.3], [0.55, "#5a2c14", 0]]); grad("g-shadeB", [[0, "#1c1410", 0.2], [0.6, "#1c1410", 0]]); grad("g-shadeG", [[0, "#1c1410", 0.2], [0.6, "#1c1410", 0]]);
    const blur = (px) => { const id = `${idp}b${String(px).replace(".", "_")}`; if (!defs.querySelector || !defs.querySelector("#" + id)) { const f = el("filter", { id, x: "-20%", y: "-20%", width: "140%", height: "140%" }, defs); el("feGaussianBlur", { stdDeviation: px }, f); } return `url(#${id})`; };
    return {
      svg, defs, idp, el, blur, w, h,
      // a named layer, in the order first asked (back to front); blur: soft depth for far layers
      layer(name, o = {}) { if (!layers[name]) { layers[name] = el("g", o.blur ? { filter: blur(o.blur) } : {}, cam); } return layers[name]; },
      // another name for a layer (a place's "mid" and "people" are both its depth-sorted "world" layer)
      alias(name, to) { layers[name] = this.layer(to); return layers[name]; },
      // the camera: the point it looks at and the width it sees (1080 = the whole world), a little tilt
      cam(x, y, cw, tilt = 0) {
        if (![x, y, cw, tilt].every(Number.isFinite) || cw <= 0) throw new Error("Author this shot's camera: cam(x, y, width, tilt).");
        svg.__cam = { x, y, cw, ch: (cw * h) / w };
        const k = w / cw; cam.setAttribute("transform", `translate(${w / 2} ${h / 2}) rotate(${tilt}) scale(${k}) translate(${-x} ${-y})`);
      },
    };
  }
  // The clock draws through the tweened value itself (a setter), so every way of moving the timeline redraws the scene:
  // the render, the page's checks and a plain seek. onUpdate would stay silent on a seek and freeze the checkers on frame 0.
  function clock(tl, s, d, fn) { let now = 0; const draw = t => { const before = root.__zcTime; root.__zcTime = { t, s, d }; try { fn(t, t / d); } finally { root.__zcTime = before; } }; const o = { get t() { return now; }, set t(v) { now = v; draw(v); } }; draw(0); tl.fromTo(o, { t: 0 }, { t: d, duration: d, ease: "none", immediateRender: false }, s); }

  // ---------- who is on screen this frame (for the body gate): the cast id, how open the lip-sync mouth is, where they stand ----------
  // A drawn person is matched to the film's cast (ZF.cast) by their spec; the gate checks that only the speaker's mouth moves and
  // that people keep their side of the screen across a cut. Strangers (a crowd, a passer-by) are not cast and are not recorded.
  const castIds = new WeakMap(), bare = (sp) => JSON.stringify(sp, (k, v) => (k === "scale" || k === "longer" ? undefined : v));
  function castOf(spec) {
    if (!spec || typeof spec !== "object") return null;
    if (castIds.has(spec)) return castIds.get(spec);
    const c = root.ZF?.cast || {}, key = bare(spec), id = Object.keys(c).find((k) => c[k] === spec || bare(c[k]) === key) || null;
    castIds.set(spec, id); return id;
  }
  // the scene a drawing belongs to (its section's data-k): every scene's clock draws on a seek, so the gate keeps only the scene on screen
  const sceneOf = (node) => { const sec = node?.closest ? node.closest("section[data-k]") : null; return sec ? Number(sec.dataset.k) : null; };
  // a person's size on screen in the actor's H unit (the same stature looks the same size in both drawings): the gate compares people in one shot with it
  const SIZE_PER_SHOULDER = 0.888; // a waist-up person looks as big as an actor of H = 0.888 × its shoulder width (measured in Chrome: film-kit-test §18)
  const screenSize = (node, units) => { try { const m = node.getScreenCTM(); return m ? units * Math.hypot(m.a, m.b) : 0; } catch { return 0; } };
  // seen from behind at the frame's edge = an over-the-shoulder figure (one seen from behind across the room is farther, and smaller by right)
  const atEdge = (g) => { try { const a = g.getBoundingClientRect(), f = g.ownerSVGElement.getBoundingClientRect(); return a.width > 0 && (a.left < f.left + 2 || a.right > f.right - 2 || a.bottom > f.bottom - 2); } catch { return false; } };
  function onScreen(id, spec, mouth, x, shown, more = {}, node = null) {
    if (!shown) return;
    const cast = castOf(spec), k = sceneOf(node);
    if (cast) (root.__who ||= {})[id] = { cast, mouth: Number(mouth) || 0, x, k, quiet: !!more.quiet, back: !!more.back, size: more.size || 0 };
    if (more.bottom != null) (root.__waist ||= {})[id] = { ...more, k }; // W1: where a waist-up body ends against the frame (cast or not)
  }

  // ---------- the acting person (waist up: rig.js) ----------
  function person(layer, { spec = {}, x = 540, y = 1000, scale = 1, longer = 0, id, cropped = false, alive = true } = {}) {
    const look = root.ZPEOPLE.look({ ...spec, scale: (spec.scale || 1) * scale, longer: longer || spec.longer || 0 });
    const W = layer.ownerSVGElement || layer, defs = W.querySelector ? W.querySelector("defs") : null;
    const idp = `zp${++n}-`, rig = root.ZRIG.create({ el, defs: defs || el("defs", {}, W), idp });
    const body = el("g", {}, layer), held = el("g", {}, layer), arms = el("g", {}, layer), pid = id || `p${n}`; // held: a paper lies over the body, under the fingers
    const p = rig.person({ ...look, x, y, id: pid }, body, arms);
    const a = look.arms[1], s = look.s, reach = (a.up + a.fo) * s, sh = [[x - a.sh[0] * s, y + a.sh[1] * s], [x + a.sh[0] * s, y + a.sh[1] * s]];
    const H = { // hand targets (world) for the named gestures; t gives the clap and the wave their beat
      rest: () => [[sh[0][0] + 0.1 * reach, sh[0][1] + 0.82 * reach], [sh[1][0] - 0.1 * reach, sh[1][1] + 0.82 * reach]],
      hips: () => [[sh[0][0] - 0.05 * reach, sh[0][1] + 0.62 * reach], [sh[1][0] + 0.05 * reach, sh[1][1] + 0.62 * reach]],
      chest: () => [[x - 0.05 * reach, sh[0][1] + 0.3 * reach], [sh[1][0] - 0.1 * reach, sh[1][1] + 0.82 * reach]],
      face: () => [[x - 0.18 * reach, y + 10 * s], [x + 0.18 * reach, y + 10 * s]],
      hold: () => [[x - 0.22 * reach, sh[0][1] + 0.45 * reach], [x + 0.22 * reach, sh[1][1] + 0.45 * reach]],
      point: () => [[sh[0][0] + 0.1 * reach, sh[0][1] + 0.82 * reach], [sh[1][0] + 0.55 * reach, sh[1][1] + 0.2 * reach]],
      wave: (t) => [[sh[0][0] + 0.1 * reach, sh[0][1] + 0.82 * reach], [sh[1][0] + 0.32 * reach + Math.sin(t * 10) * 16, sh[1][1] - 0.62 * reach]],
      cheer: (t) => [[sh[0][0] - 0.25 * reach, sh[0][1] - 0.7 * reach + Math.sin(t * 7) * 10], [sh[1][0] + 0.25 * reach, sh[1][1] - 0.7 * reach + Math.sin(t * 7 + 1) * 10]],
      clap: (t) => { const o = 0.05 + 0.16 * Math.abs(Math.sin(t * Math.PI * 2.6)); return [[x - o * reach, sh[0][1] + 0.4 * reach], [x + o * reach, sh[1][1] + 0.4 * reach]]; },
      // seated or standing with a sheet, a table, a laptop (the elbows stay at the sides, the forearms come in)
      paper: () => [[x - 0.3 * reach, sh[0][1] + 0.62 * reach], [x + 0.3 * reach, sh[1][1] + 0.62 * reach]], // a sheet held up in both hands
      read: () => [[x - 0.26 * reach, sh[0][1] + 0.74 * reach], [x + 0.26 * reach, sh[1][1] + 0.74 * reach]], // lower, looking down at it
      tap: (t) => [[x - 0.3 * reach, sh[0][1] + 0.68 * reach], [x + 0.1 * reach, sh[1][1] + 0.52 * reach + Math.abs(Math.sin(t * 7)) * 6]], // one hand holds, the other taps a line
      table: () => [[x - 0.34 * reach, sh[0][1] + 0.8 * reach], [x + 0.34 * reach, sh[1][1] + 0.8 * reach]], // forearms resting on a table
      type: (t) => [[x - 0.2 * reach, sh[0][1] + 0.76 * reach + Math.sin(t * 21) * 3], [x + 0.2 * reach, sh[1][1] + 0.76 * reach + Math.sin(t * 17 + 1) * 3]],
      // one hand holds a cup or a phone (a prop held in this hand sits in it): at the chest, or raised to the mouth for a sip; the other rests
      cup: () => [[sh[0][0] + 0.1 * reach, sh[0][1] + 0.82 * reach], [x + 0.14 * reach, sh[1][1] + 0.5 * reach]],
      sip: () => [[sh[0][0] + 0.1 * reach, sh[0][1] + 0.82 * reach], [x + 0.1 * reach, y + 118 * s]],
    };
    const POSE = { rest: ["rest", "rest"], hips: ["fist", "fist"], chest: ["open", "rest"], face: ["open", "open"], hold: ["fist", "fist"], point: ["rest", "point"], wave: ["rest", "open"], cheer: ["fist", "fist"], clap: ["open", "open"], paper: ["fist", "fist"], read: ["fist", "fist"], tap: ["fist", "point"], table: ["rest", "rest"], type: ["open", "open"], cup: ["rest", "fist"], sip: ["rest", "fist"] };
    // hands that come toward the camera: the elbow stays at the ribs and the forearm looks short, it never flares out sideways
    const RIBS = { paper: 0.4, read: 0.42, tap: 0.4, table: 0.46, type: 0.42, hold: 0.42 };
    // one hand up (cup, sip): only that arm's elbow stays down at the ribs; the resting arm hangs as it does
    const ONE = { cup: 0.44, sip: 0.46 };
    const elbowsOf = (name) => (ONE[name] != null ? [null, [sh[1][0] - 0.02 * reach, sh[1][1] + ONE[name] * reach]] : RIBS[name] == null ? null : [[sh[0][0] + 0.03 * reach, sh[0][1] + RIBS[name] * reach], [sh[1][0] - 0.03 * reach, sh[1][1] + RIBS[name] * reach]]);
    let last = null, lastT = null, drawn = null, visible = true; const fade = [null, null];
    // a library action or gesture on the waist-up person: the one skeleton's arms, body and head, read off the pose and laid on this
    // body's own shoulders, so close shots use the same library as wide ones. Spread it into draw: r.draw({ ...r.pose("sit_lean_forward", u * 360), face }, t)
    function fromSkeleton(posture, phase = 35, o = {}) {
      const A = root.ZANATOMY, ps = o.solved || root.ZBODY.pose3D(posture, phase, { look, spec, trim: o.trim, gesture: o.gesture, props: false }), J = ps.joints;
      const pr = (q) => A.project(q, "front", { scale: 1, cx: 0, groundY: 0, center: { x: 0, y: 0, z: 0 } });
      const left = pr(J.shoulderL).x <= pr(J.shoulderR).x ? "L" : "R", sides = [left, left === "L" ? "R" : "L"];
      const len = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
      const elbows = [null, null], hands = sides.map((c, i) => {
        const S = J["shoulder" + c], E = J["elbow" + c], Wr = J["wrist" + c], Hd = J["hand" + c], arm = len(S, E) + len(E, Wr) + len(Wr, Hd) || 1;
        const a = pr(S), b = pr(Hd);
        const e = pr(E); elbows[i] = [sh[i][0] + ((e.x - a.x) / arm) * reach, sh[i][1] + ((e.y - a.y) / arm) * reach];
        return [sh[i][0] + ((b.x - a.x) / arm) * reach, sh[i][1] + ((b.y - a.y) / arm) * reach];
      });
      const hp = (ps.handPoses || []).slice(0, 2), known = (h) => (h && root.HANDS?.POSES?.[h] ? h : "rest"), shapes = (left === "L" ? hp : hp.reverse()).map(known);
      const hd = ps.head || {};
      const base = root.ZBODY.pose3D(o.from || posture, o.from ? 35 : 0, { look, spec, props: false }).joints, unit = reach / (len(J.shoulderR, J.elbowR) + len(J.elbowR, J.wristR) + len(J.wristR, J.handR) || 1);
      const cl = (v, m) => Math.max(-m, Math.min(m, v)), p0 = pr(base.thorax), p1 = pr(J.thorax), m = 0.22 * reach;
      const source = o.solved ? { sourceArms: sides.map(c => ({ S: J["shoulder" + c], E: J["elbow" + c], W: J["wrist" + c] })),
        wrists: sides.map((c, i) => { const a = pr(J["shoulder" + c]), w = pr(J["wrist" + c]), arm = len(J["shoulder" + c], J["elbow" + c]) + len(J["elbow" + c], J["wrist" + c]) + len(J["wrist" + c], J["hand" + c]); return [sh[i][0] + (w.x - a.x) / arm * reach, sh[i][1] + (w.y - a.y) / arm * reach]; }) } : {};
      return { ...source, hands, elbows, handPoses: shapes, lean: [cl((p1.x - p0.x) * unit, m), cl((p1.y - p0.y) * unit, m)], turn: cl((hd.yaw || 0) / 60, 1), down: cl((hd.pitch || 0) / 40, 1), tilt: cl(hd.roll || 0, 14) };
    }
    return {
      look, x, y, s, reach, shoulders: sh, head: [x, y], held, rest: H.rest(), handsOf: (name, t = 0) => H[name](t), handPosesOf: (name) => POSE[name] || ["rest", "rest"],
      pose: fromSkeleton,
      gesture: (id, t, o = {}) => fromSkeleton("stand", 0, { solved: root.ZBODY.gesture3D(id, t, { look, spec, props: false, ...o }) }),
      // a named hand ("paper", "tap", "table", "type"…) in the same form, to blend with: r.draw({ ...r.blend(r.named("paper", t), r.named("tap", t), u), face }, t)
      holdsWith: (name) => (ONE[name] != null ? 1 : null), // the hand a named one-hand hold puts the prop in
      named: (name, t = 0) => ({ hands: H[name](t), elbows: elbowsOf(name) || undefined, handPoses: POSE[name] || ["rest", "rest"], lean: [0, 0], turn: 0, down: 0, tilt: 0 }),
      // from one r.pose(…) to another (u 0…1): spread into draw, the hands never jump
      blend(a, b, u) { const v = Math.max(0, Math.min(1, u)), m = (p, q) => p + (q - p) * v; return { ...(v < 0.5 ? a : b), hands: a.hands.map((h, i) => [m(h[0], b.hands[i][0]), m(h[1], b.hands[i][1])]), elbows: a.elbows && b.elbows ? a.elbows.map((e, i) => e && b.elbows[i] ? [m(e[0], b.elbows[i][0]), m(e[1], b.elbows[i][1])] : null) : undefined, lean: [m(a.lean[0], b.lean[0]), m(a.lean[1], b.lean[1])], turn: m(a.turn, b.turn), down: m(a.down, b.down), tilt: m(a.tilt, b.tilt) }; },
      draw(q = {}, t = 0) {
        if (!Array.isArray(q.hands) && !Object.hasOwn(H, q.hands)) throw new Error("Author this person's hand pose or targets for the shot; no resting pose is implied.");
        if (Array.isArray(q.hands) && (q.hands.length !== 2 || q.hands.some(h => !Array.isArray(h) || h.length !== 2 || !h.every(Number.isFinite)))) throw new Error("Hand targets must contain two finite [x, y] positions.");
        const f = { ...FACES.neutral, ...(q.face && typeof q.face === "object" ? q.face : FACES[q.face] || {}) }; // a name, or the dials (ZC.feel)
        const hands = Array.isArray(q.hands) ? q.hands.map((h) => h.slice()) : H[q.hands](t);
        const poses = q.handPoses || POSE[q.hands] || ["rest", "rest"];
        const micro = alive && q.alive !== false ? root.ZRIG.motion(t, `${castOf(spec) || pid}:${sceneOf(layer)}`, q.mouth || 0, q.talking ?? (q.mouth > 0)) : { breath: 0, blink: 0, nod: 0 };
        const lean = q.lean || [0, 0], lift = -micro.breath * reach; for (const h of hands) { h[0] += lean[0]; h[1] += lean[1] + lift; }
        const blink = q.eyesClosed ? 1 : q.blink ?? micro.blink;
        const st = { t, lean, breath: lift, chest: micro.breath, nod: (q.nod || 0) + micro.nod * 2, turn: q.turn || 0, down: q.down || 0, smile: q.smile ?? f.smile, raise: q.raise ?? f.raise, inner: q.inner ?? f.inner,
          dials: f, gx: q.look ?? 0, gy: q.gy || 0, lid: q.lid ?? f.lid, tilt: q.tilt || 0, blink, hands, elbows: (q.elbows || elbowsOf(q.hands))?.map((e) => (e ? [e[0] + lean[0], e[1] + lean[1] + lift] : null)), reach: [1, 1], bend: q.bend || [0, 0], elbowDown: [false, false], poses,
          wrists: q.wrists?.map(w => [w[0] + lean[0], w[1] + lean[1] + lift]), sourceArms: q.sourceArms,
          holds: {}, open: Math.max(q.mouth || 0, f.open || 0), round: q.round || 0 };
        // R10: a hand that changes pose fades from the last one over three frames; a seek (time jumps) starts clean
        const moved = lastT == null ? 1 : t - lastT, seek = moved < 0 || moved > 0.2;
        st.blend = poses.map((pp, i) => {
          if (q.sourceArms) return null; // timed gestures are sampled directly; a random seek must not inherit a finger fade
          if (seek) fade[i] = null; else if (last && last[i] !== pp) fade[i] = { from: last[i], t0: t };
          const u = fade[i] ? (t - fade[i].t0 + 1 / 30) / 0.1 : 1;
          if (u >= 1 - 1e-6) { fade[i] = null; return null; }
          return { from: fade[i].from, u };
        });
        last = poses; lastT = t;
        st.out = []; p.update(st); drawn = st.out;
        // the waist-up body has no legs: its lower edge must be outside the frame (or inside a card that crops it: cropped)
        let more = {}; try { const bb = body.getBBox(), c = W.__cam || { y: 960, ch: 1920 }; const ext = (longer || spec.longer || 0) * s; more = { bottom: bb.y + bb.height, natural: bb.y + bb.height - ext, frameBottom: c.y + c.ch / 2, frameH: c.ch, cropped, left: bb.x, right: bb.x + bb.width, frameLeft: (c.x ?? 540) - (c.cw ?? 1080) / 2, frameRight: (c.x ?? 540) + (c.cw ?? 1080) / 2 }; } catch { /* no layout here */ }
        onScreen(pid, spec, q.mouth, x + lean[0], visible, { ...more, quiet: !!q.quiet, size: screenSize(body, SIZE_PER_SHOULDER * Math.abs(sh[1][0] - sh[0][0])) }, W);
      },
      // the palm of hand i as drawn this frame (world px; ang = the way the hand points, degrees): a held thing follows it
      handAt(i) { const h = drawn?.[i]; if (!h) throw new Error("Draw this person before asking where the hand is."); const back = 18 * (look.arms[i].hand / 20) * s; return { x: h.W[0] + Math.cos(h.ang) * back, y: h.W[1] + Math.sin(h.ang) * back, ang: (h.ang * 180) / Math.PI }; },
      show(on) { visible = !!on; const v = on ? "inline" : "none"; body.setAttribute("display", v); arms.setAttribute("display", v); },
      // the lower edge is hidden by something really drawn over it (a table's edge): the W1 gate does not ask for legs here
      crop(on) { cropped = !!on; },
    };
  }

  // ---------- the full body: one skeleton (anatomy.js), the same head as the waist-up person ----------
  function body(layer, { spec = {}, H = 60, x = 540, floor = 1500, view = "side", facing = 1, garment, cloth, marks = false, id, alive = true } = {}) {
    const look = root.ZPEOPLE.look(spec), g = el("g", {}, layer), own = id || `actor${++n}`;
    let cur = null, shown = null, stride = {}, visible = true;
    const px = () => H / 27; // the skeleton's unit in pixels at this person's size
    // one cycle's travel, measured from this person's own legs, so the feet land where the body is (any age or build)
    const cycleOf = (kind) => { if (stride[kind]) return stride[kind]; let lo = Infinity, hi = -Infinity; for (let a = 0; a < 360; a += 30) { const z = root.ZBODY.pose3D(kind, a, { look, spec }).joints.ankleL.z; lo = Math.min(lo, z); hi = Math.max(hi, z); } return (stride[kind] = 2 * (hi - lo) * px()); };
    const me = {
      look, H, spec, id: own,
      pose(posture, phase = 35, o = {}) { return root.ZBODY.pose3D(posture, phase, { look, spec, seenSide: view === "side", ...o }); },
      gesture: (id, t, o = {}) => root.ZBODY.gesture3D(id, t, { look, spec, seenSide: view === "side", ...o }),
      blend(poseA, poseB, u, o = {}) { return root.ZBODY.blend3D(poseA, poseB, u, o); },
      draw(pose, at = {}) {
        const time = at.t ?? root.__zcTime?.t ?? 0, micro = alive && at.alive !== false ? root.ZRIG.motion(time, `${castOf(spec) || own}:${sceneOf(layer)}`, at.mouth || 0, at.talking ?? (at.mouth > 0)) : { breath: 0, blink: 0, nod: 0 };
        const ps = pose?.joints ? pose : root.ZBODY.pose3D(pose?.posture || "stand", pose?.phase ?? 35, { look, spec, ...pose });
        pose = root.ZANATOMY.alivePose(ps, micro);
        // Standing render origin is fixed, rather than the centroid of arms that move during a gesture.
        if (!at.center && !pose.center && (pose.posture === "stand" || pose.posture === "neutral")) {
          const rest = me.pose("stand", 0).joints, keys = root.ZANATOMY.JOINTS;
          at = { ...at, center: { x: keys.reduce((v, k) => v + rest[k].x, 0) / keys.length, y: 0, z: keys.reduce((v, k) => v + rest[k].z, 0) / keys.length } };
        }
        at = { ...at, blink: at.blink ?? micro.blink };
        if (cur) g.removeChild(cur);
        const X = at.x ?? x, F = at.floor ?? floor, fc = at.facing ?? facing, v = at.view || view, turned = v === "side" || v === "three" || v === "threeQuarter", H0 = at.H ?? H;
        cur = el("g", { transform: `translate(${X} ${F}) scale(${turned ? fc : 1} 1)` }, g);
        const r = root.ZBODY.draw(cur, { id: at.id || own, view: v, pose, H: H0, look, spec, garment: at.garment || garment, cloth: at.cloth || cloth, props: at.props, marks: at.marks ?? marks, face: at.face, smile: at.smile, mouth: at.mouth, mouthRound: at.round, blink: at.blink, eyesClosed: at.eyesClosed, barefoot: at.barefoot, center: at.center, gaze: at.gaze });
        // the feet touch the floor: a soft shadow under the body, fainter as the feet leave the ground (a jump)
        if (r?.pose?.joints) { const J = r.pose.joints, lift = Math.min(J.heelL.y, J.heelR.y, J.toeL.y, J.toeR.y), k = H0 / 27, sh = el("ellipse", { "data-shadow": 1, cx: 0, cy: 2, rx: 27 * k, ry: 4.5 * k, fill: "#1a0e08", opacity: Math.max(0.05, 0.2 - lift * 0.004) }); cur.insertBefore(sh, cur.firstChild); }
        shown = { pose: r?.pose, X, F, fc: turned ? fc : 1, v, H0, center: at.center }; onScreen(own, spec, at.mouth, X, visible, { quiet: !!at.quiet || v === "back", back: v === "back" && atEdge(g), size: screenSize(g, H0) }, g);
        // Z1/Z2: in a place with a world view (engine/cartoon/world.js) the gate checks this body's size against where its feet are
        const wv = g.ownerSVGElement?.__world?.view; if (wv && visible) (root.__bodies ||= {})[own] = { spec, F, H: H0, view: wv, k: sceneOf(g) };
        // C1–C4: the camera checks read where this person is in the frame (the camera itself is read at the end of the frame)
        if (visible && root.__shots) try { root.__shots[own] = { k: sceneOf(g), svg: g.ownerSVGElement, box: me.box() }; } catch { /* no layout */ }
      },
      // the palm of hand i ("L" | "R" or 0 | 1) as drawn this frame, in world px: a held thing follows it
      handAt(i) {
        if (!shown?.pose) throw new Error("Draw this person before asking where the hand is.");
        const k = i === 0 || i === "L" ? "handL" : "handR", V = { three: "threeQuarter" }[shown.v] || shown.v;
        const J = shown.pose.joints, names = root.ZANATOMY.JOINTS, mean = (q) => names.reduce((m, n) => m + J[n][q], 0) / names.length; // the same centre the drawing uses
        const p = root.ZANATOMY.project(J[k], V, { scale: shown.H0 / 27, cx: 0, groundY: 0, center: shown.center || { x: mean("x"), y: 0, z: mean("z") } });
        return { x: shown.X + p.x * shown.fc, y: shown.F + p.y, ang: 0 };
      },
      // any joint as drawn this frame, in world px ("shoulderL", "head", "handR", "wristL", "pelvis"…): a target for someone's hand
      jointAt(name) {
        if (!shown?.pose) throw new Error("Draw this person before asking where a joint is.");
        const J = shown.pose.joints; if (!J[name]) throw new Error(`No joint "${name}" (joints: ${root.ZANATOMY.JOINTS.join(", ")})`);
        const V = { three: "threeQuarter" }[shown.v] || shown.v, names = root.ZANATOMY.JOINTS, mean = (q) => names.reduce((m, n) => m + J[n][q], 0) / names.length;
        const p = root.ZANATOMY.project(J[name], V, { scale: shown.H0 / 27, cx: 0, groundY: 0, center: shown.center || { x: mean("x"), y: 0, z: mean("z") } });
        return { x: shown.X + p.x * shown.fc, y: shown.F + p.y, depth: p.depth };
      },
      // the same pose with one hand ("L" | "R") on a point of the page (world px), by weight w (0 = as authored, 1 = there): the arm keeps
      // its bones and the elbow its side and limit; the depth stays the hand's own. Draw the result with at.center = result.center
      // (the body does not slide when an arm moves). `at` = what this draw will use (x, floor, facing, view, H).
      reach(pose, side, pt, w = 1, at = {}) {
        if (Array.isArray(pt)) pt = { x: pt[0], y: pt[1] }; // [x, y] or { x, y }
        const A = root.ZANATOMY, J0 = pose.joints, names = A.JOINTS, s = side === 0 || side === "L" ? "L" : "R";
        const mean = (q) => names.reduce((m, n) => m + J0[n][q], 0) / names.length, center = at.center || pose.center || { x: mean("x"), y: 0, z: mean("z") };
        if (!(w > 0) || !pt) return { ...pose, center };
        const X = at.x ?? x, F = at.floor ?? floor, v = at.view || view, turned = v === "side" || v === "three" || v === "threeQuarter", fc = turned ? at.facing ?? facing : 1, k = (at.H ?? H) / 27;
        const V = { three: "threeQuarter" }[v] || v, pr = (q) => A.project(q, V, { scale: 1, cx: 0, groundY: 0, center });
        const S = J0["shoulder" + s], E = J0["elbow" + s], Wr = J0["wrist" + s], Hd = J0["hand" + s], h0 = pr(Hd);
        // the 3D move of the hand that lands it on the point and keeps its depth: solve the view's linear map (its three columns)
        const col = (dx, dy, dz) => { const q = pr({ x: Hd.x + dx, y: Hd.y + dy, z: Hd.z + dz }); return [q.x - h0.x, q.y - h0.y, q.depth - h0.depth]; };
        const M = [col(1, 0, 0), col(0, 1, 0), col(0, 0, 1)], want = [((pt.x - X) / fc) / k - h0.x, (pt.y - F) / k - h0.y, 0];
        const det3 = (a, b, c) => a[0] * (b[1] * c[2] - b[2] * c[1]) - b[0] * (a[1] * c[2] - a[2] * c[1]) + c[0] * (a[1] * b[2] - a[2] * b[1]), D = det3(M[0], M[1], M[2]);
        if (Math.abs(D) < 1e-9) return { ...pose, center };
        const d = [det3(want, M[1], M[2]) / D, det3(M[0], want, M[2]) / D, det3(M[0], M[1], want) / D];
        const goal = { x: Hd.x + d[0] * w, y: Hd.y + d[1] * w, z: Hd.z + d[2] * w };
        let palm = { x: Hd.x - Wr.x, y: Hd.y - Wr.y, z: Hd.z - Wr.z };
        const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z), solve = () => A.ik(S, { x: goal.x - palm.x, y: goal.y - palm.y, z: goal.z - palm.z }, E, dist(S, E), dist(E, Wr), (A.ROM?.elbowInteriorMin ?? 30) + 0.5);
        let r = solve();
        // at.straight (0…1, true = 1): the hand turns toward the line of the new forearm by that much (a palm that leads a reach or a
        // hand-over keeps its wrist straight, H07); 0 keeps the pose's own wrist, so a reach that eases in starts without a jump
        const kS = at.straight === true ? 1 : clamp(Number(at.straight) || 0, 0, 1);
        for (let it = 0; kS > 0 && it < 2; it++) { const L = Math.hypot(palm.x, palm.y, palm.z), f = { x: r.E.x - r.M.x, y: r.E.y - r.M.y, z: r.E.z - r.M.z }, n = Math.hypot(f.x, f.y, f.z) || 1, P0 = { x: Hd.x - Wr.x, y: Hd.y - Wr.y, z: Hd.z - Wr.z };
          const q = { x: lerp(P0.x, (f.x / n) * L, kS), y: lerp(P0.y, (f.y / n) * L, kS), z: lerp(P0.z, (f.z / n) * L, kS) }, m = Math.hypot(q.x, q.y, q.z) || 1; palm = { x: (q.x / m) * L, y: (q.y / m) * L, z: (q.z / m) * L }; r = solve(); }
        const joints = { ...J0, ["elbow" + s]: r.M, ["wrist" + s]: r.E, ["hand" + s]: { x: r.E.x + palm.x, y: r.E.y + palm.y, z: r.E.z + palm.z } };
        return { ...pose, joints, center, short: r.short };
      },
      show(on) { visible = !!on; g.setAttribute("display", on ? "inline" : "none"); },
      // where this person is on the page this frame (for the camera, engine/cartoon/camera.js): the head's centre and size, the top of
      // the skull, the feet, the facing, and body landmarks in head units down from the skull top (chin, chest, waist, knees, feet…)
      box() {
        if (!shown?.pose) throw new Error("Draw this person before framing them.");
        const J = shown.pose.joints, V = { three: "threeQuarter" }[shown.v] || shown.v, k = shown.H0 / 27, r = root.ZANATOMY.RADII.head * shown.pose.profile.headScale;
        const names = root.ZANATOMY.JOINTS, mean = (q) => names.reduce((m, n) => m + J[n][q], 0) / names.length;
        const hp = root.ZANATOMY.project(J.head, V, { scale: k, cx: 0, groundY: 0, center: shown.center || { x: mean("x"), y: 0, z: mean("z") } });
        const top = J.head.y + r, hu = 2 * r, at = (y) => (top - y) / hu, low = (a, b) => Math.min(J[a].y, J[b].y);
        const lm = { headTop: 0, eyes: 0.5, nose: 0.68, mouth: 0.8, chin: 1, neck: at(J.neckBase.y), shoulders: at((J.shoulderL.y + J.shoulderR.y) / 2), chest: at(J.thorax.y) + 0.35,
          elbows: at((J.elbowL.y + J.elbowR.y) / 2), waist: at(J.lumbar.y), hips: at(J.pelvis.y), knees: at((J.kneeL.y + J.kneeR.y) / 2), ankles: at((J.ankleL.y + J.ankleR.y) / 2), feet: at(Math.min(0, low("toeL", "toeR"))) };
        const st = root.ZANATOMY.pose({ posture: "neutral", profile: shown.pose.profile }).joints, standU = st.head.y + r; // the standing height, in skeleton units
        return { x: shown.X + hp.x * shown.fc, headY: shown.F + hp.y, headTop: shown.F + hp.y - r * k, headPx: hu * k, floor: shown.F, facing: shown.v === "front" || shown.v === "back" ? 0 : shown.fc, view: shown.v, posture: shown.pose.posture, lm, spec,
          upright: top / standU > 0.85, standHeads: standU / hu };
      },
      // how high the seat is under this person, in px above the floor: draw your bench or chair at floor - seatHeight()
      seatHeight() { return (me.pose("sit", 35, { props: false }).joints.pelvis.y - 2.5) * px(); },
      // walking or running in to a stop: the feet land (the steps come from the distance travelled), then the body settles standing
      arrive(t, { x0, x1, t0 = 0, t1, kind = "walk", settle = 0.3, phase = 0 } = {}, at = {}) {
        const u = clamp((t - t0) / Math.max(0.01, t1 - t0), 0, 1), k = 1 - (1 - u) * (1 - u), X = lerp(x0, x1, k), dist = Math.abs(X - x0);
        const moving = me.pose(kind, (phase + (dist / cycleOf(kind)) * 360) % 360), w = ease(clamp((t - t1 + settle) / settle, 0, 1));
        me.draw(w > 0 ? me.blend(moving, me.pose("stand"), w) : moving, { facing: x1 >= x0 ? 1 : -1, center: { x: 0, y: 0, z: 0 }, ...at, x: X });
        return X;
      },
      // from the seat to the feet (or down, t1 < t0 in `down`): weight forward, then up; the feet stay planted. Side view: x is where the seat is
      rise(t, { t0, t1, down = false, lean = 16 } = {}, at = {}) {
        const u0 = clamp((t - t0) / Math.max(0.01, t1 - t0), 0, 1), u = down ? 1 - u0 : u0, a = me.pose("sit", 35, { props: false }), l = me.pose("sit", 35, { props: false, trim: { spinePitch: lean, headPitch: -lean * 0.4 } }), c = me.pose("stand");
        // preparation → weight forward (a third of the time, still on the seat) → up (off the seat: it no longer holds the hips)
        const up = clamp((u - 1 / 3) * 1.5, 0, 1), p = up > 0 ? me.blend(l, c, up) : me.blend(a, l, u * 3);
        if (up > 0) { p.supports = c.supports; p.props = false; }
        const fc = at.facing ?? facing, dx = (a.joints.ankleL.z - p.joints.ankleL.z) * px() * fc;
        me.draw(p, { center: { x: 0, y: 0, z: 0 }, ...at, x: (at.x ?? x) + dx, props: false });
        return (at.x ?? x) + dx;
      },
    };
    return me;
  }
  // ---------- things in hands ----------
  // a thing drawn once, moved whole: const card = ZC.prop(layer, (g) => { …draw it around 0,0, its grip point… }); card.at(x, y, rotateDeg, scale)
  function prop(layer, drawIt) { const g = el("g", {}, layer); drawIt(g); return { g, at(x, y, rot = 0, sc = 1) { g.setAttribute("transform", `translate(${x} ${y}) rotate(${rot}) scale(${sc})`); return this; }, show(on) { g.setAttribute("display", on ? "inline" : "none"); return this; } }; }
  // a sheet held in both hands, for anyone in any shot: the paper lies over the body and under the fingers (waist up), its middle
  // between the two palms, turning with them. const cv = ZC.sheet(r, { w: 300, h: 400, draw: (g, w, h) => {…around 0,0…} }); after r.draw each
  // frame: cv.follow(). Full body: ZC.sheet(b, { layer: front, w: 60, h: 80 }). o: dy, rot, scale, one: 0 | 1 (a single hand holds it)
  function sheet(who, { layer, w = 300, h = 400, draw, fill = "#fff", radius = 8 } = {}) {
    const into = who.held || layer; if (!into) throw new Error("ZC.sheet: a full body needs { layer } (the layer in front of it).");
    const thing = prop(into, (g) => { el("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: radius, fill }, g); if (draw) draw(g, w, h); });
    return { ...thing, follow(o = {}) {
      if (o.one === 0 || o.one === 1) { const a = who.handAt(o.one); return thing.at(a.x, a.y + (o.dy ?? -h * 0.18), o.rot || 0, o.scale ?? 1); }
      const a = who.handAt(0), b = who.handAt(1), r = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI, turn = Math.abs(r) > 90 ? r - Math.sign(r) * 180 : r;
      return thing.at((a.x + b.x) / 2, (a.y + b.y) / 2 + (o.dy ?? -h * 0.18), (o.rot || 0) + clamp(turn * 0.5, -6, 6), o.scale ?? 1);
    } };
  }
  // keeps the thing on a hand this frame (call after that person's draw). o: dx, dy, rot, scale, follow (turn with the hand)
  function carry(thing, who, i, o = {}) { const h = who.handAt(i); return thing.at(h.x + (o.dx || 0), h.y + (o.dy || 0), (o.rot || 0) + (o.follow ? h.ang : 0), o.scale ?? 1); }
  // a hand-over (H12: giver grip → shared contact → receiver grip → giver release): on the giver before t0, on the receiver after t1,
  // moving between the two palms in between. Author both wrists to the same meeting point for t0…t1; call after both draws.
  function handover(thing, t, { from: [a, i], to: [b, j], t0, t1, dx = 0, dy = 0, rot = 0, scale = 1 }) {
    const A = a.handAt(i), B = b.handAt(j), u = ease(clamp((t - t0) / Math.max(0.01, t1 - t0), 0, 1));
    return thing.at(lerp(A.x, B.x, u) + dx, lerp(A.y, B.y, u) + dy, rot, scale);
  }
  // the camera through a shot list: hard cuts at each `at`, an optional slow move inside a shot (eased). Call after drawing the people it frames. Same place, new framing: the cheap way
  // to keep a talk alive. list = [{ at: 0, cam: [x, y, width], to: [x, y, width] }, …]; returns the index of the shot on screen
  function shots(W, t, list) {
    let n = 0; for (let i = 0; i < list.length; i++) if (t >= list[i].at) n = i;
    // a shot may follow a person: frame: [who, "closeUp", { x }] (engine/cartoon/camera.js), and `to` may too (a push in from one size to another)
    const camOf = (q) => (Array.isArray(q) && q[0] && typeof q[0].box === "function" ? root.ZCAMERA.frameOf(W, q[0], q[1], q[2] || {}) : q);
    const s = list[n], end = list[n + 1]?.at ?? s.until ?? s.at + 1, c0 = camOf(s.frame || s.cam), c1 = s.to ? camOf(s.to) : null;
    const u = clamp((t - s.at) / Math.max(0.01, end - s.at), 0, 1), k = u * u * (3 - 2 * u), c = c1 ? c0.map((v, i) => lerp(v, c1[i], k)) : c0;
    W.cam(c[0], c[1], c[2], s.tilt || 0); return n;
  }
  // ---------- the film's own kit (edit/film-kit.js): its places are drawn once and every shot of that place asks for one ----------
  const ZF = root.ZF = { cast: {}, places: {}, parts: {}, partInfo: {}, place(id, meta, fn) { ZF.places[id] = { ...meta, fn }; },
    // a new generic thing worth keeping for later films (a banyan tree, a mosque, a boat): ZF.parts.id(layer, { x, y, h, seed, color })
    part(id, about, fn) { ZF.parts[id] = fn; ZF.partInfo[id] = { about: String(about || "") }; } };
  // const P = ZC.place("market", W, { view: "reverse" }) draws the place in the layers sky, far and world; P.Z is its world scale
  // (engine/cartoon/world.js: metres and depth → px), P.layer its depth-sorted world layer (W.layer("mid") and W.layer("people") are
  // the same layer), near things that always stay in front in W.layer("front"). People: const a = P.Z.person(spec, { x, dz, layer: P.layer });
  // ZC.actor(a.slot, { spec, ...a, view }). P.floor, P.spots (from the kit, in metres { x, dz } when it uses the world), P.tick(t).
  // The kit's meta may give the camera per view: world: { wide: { horizon, floor, ppm }, reverse: { … } } (px; defaults fit the frame).
  function place(id, W, o = {}) {
    const p = ZF.places[id]; if (!p) throw new Error(`This film has no place "${id}". It has: ${Object.keys(ZF.places).join(", ") || "none"}.`);
    W.layer("sky"); W.layer("far", { blur: o.blur ?? 2.5 }); const L = W.layer("world"); W.alias("mid", "world"); W.alias("people", "world"); W.layer("front");
    const timeOfDay = o.timeOfDay || (o.night || o.view === "night" ? "night" : "day");
    if (!["day", "night", "dawn", "sunset"].includes(timeOfDay)) throw new Error("Place timeOfDay must be day, dawn, sunset or night.");
    const view = ["day", "night"].includes(o.view) ? (p.views?.[0] || "wide") : o.view || p.views?.[0] || "wide"; if (p.views && !p.views.includes(view)) throw new Error(`The place "${id}" has the views ${p.views.join(", ")}, not "${view}".`);
    // the world view is made when the kit or the shot first uses Z (a place drawn the old way, in pixels, is not judged by Z1/Z2)
    const cam = p.world?.[view] || p.world?.wide || (p.world && p.world.horizon != null ? p.world : {});
    let Z = null; const getZ = () => (Z ||= root.ZW ? root.ZW.view(W, { ...cam, ...(o.world || {}) }) : null);
    if (p.world) getZ();
    const arg = { ...o, view, timeOfDay, night: timeOfDay === "night", layer: L }; Object.defineProperty(arg, "Z", { get: getZ, enumerable: true });
    const out = p.fn(W, arg) || {};
    // a kit may make its own layers (a ground, leaf shade) after the world layer: the people's world layer always comes back above
    // them and "front" stays the nearest, so a place never paints over its people
    const wl = W.layer("world"), fl = W.layer("front"); wl.parentNode.appendChild(wl); fl.parentNode.appendChild(fl);
    W.svg.setAttribute("data-place", id); W.svg.setAttribute("data-time-of-day", timeOfDay);
    if (timeOfDay === "night") {
      if (!p.indoors) {
        const sky = W.layer("sky"); sky.replaceChildren();
        root.ZS.sky(sky, { w: W.w * 3, h: (Z?.horizon || W.h * 0.4) + 80, top: "#12223e", bottom: "#354c70" });
        for (let i = 0; i < 22; i++) el("circle", { cx: W.w * ((i * 0.618034) % 1), cy: W.h * (0.04 + ((i * 0.371) % 0.28)), r: 1.5 + (i % 3), fill: "#fff3cf", "data-star": i }, sky);
        const moon = root.ZS.moon(sky, { x: W.w * 0.8, y: W.h * 0.14, r: 40, sky: "#203654" }); moon.setAttribute("data-moon", "true");
      }
      // Frame-space lighting stays above every world layer, including actors created after the place.
      el("rect", { x: 0, y: 0, width: W.w, height: W.h, fill: "#10244d", opacity: p.indoors ? 0.24 : 0.36, "pointer-events": "none", "data-night-lighting": "true" }, W.svg);
    }
    // dawn and sunset: the sky turns (outdoors), the sun sits low over the horizon and a warm light falls on everything
    if (timeOfDay === "sunset" || timeOfDay === "dawn") {
      const dusk = timeOfDay === "sunset";
      if (!p.indoors) { const sky = W.layer("sky"); sky.replaceChildren(); const hz = Z?.horizon || W.h * 0.4;
        root.ZS.sky(sky, { w: W.w * 3, h: hz + 80, top: dusk ? "#43457a" : "#7f8fc9", bottom: dusk ? "#f59a5b" : "#fbc9b0" });
        el("circle", { cx: W.w * (dusk ? 0.68 : 0.3), cy: hz - W.h * 0.05, r: W.h * 0.075, fill: dusk ? "#ffcf6e" : "#fff0c2", opacity: 0.95, "data-sun": timeOfDay }, sky); }
      el("rect", { x: 0, y: 0, width: W.w, height: W.h, fill: dusk ? "#ff7a2f" : "#ffb38a", opacity: p.indoors ? 0.1 : 0.16, "pointer-events": "none", "data-light": timeOfDay }, W.svg);
    }
    const res = { floor: out.floor ?? (Z ? Z.floor : (p.floor ?? 0.8) * W.h), spots: out.spots || p.spots || {}, tick: out.tick || (() => {}), view, timeOfDay, layer: L };
    Object.defineProperty(res, "Z", { get: () => out.Z || getZ(), enumerable: true });
    return res;
  }
  const actor = (layer, opts = {}) => body(layer, opts);
  // Over the shoulder: the person in front, seen from behind at the edge of the frame. Sized from the person they face, never by eye:
  // the same stature, and nearer to the camera, so a little bigger (near = 1.05–1.3). A small dark blob at the edge reads as a child or a doll.
  //   const n = ZC.ots(W.layer("near", { blur: 1.5 }), { spec, of: r, side: "left" });   in the clock: n.draw(t)
  // of: the waist-up person (ZC.person) or actor (ZC.actor) they face, drawn in the same world. side: the frame edge they sit at.
  function ots(layer, { spec = {}, of, side = "left", near = 1.1, posture = "rest_sit_chair", phase = 60, x, top } = {}) {
    if (!of) throw new Error("ZC.ots: give `of`, the person this one faces, so they are drawn at the right size.");
    const base = of.H || SIZE_PER_SHOULDER * Math.abs(of.shoulders[1][0] - of.shoulders[0][0]), H = base * Math.max(1, near);
    const cx = of.H ? of.box().x : (of.shoulders[0][0] + of.shoulders[1][0]) / 2, X = x ?? cx + (side === "left" ? -1 : 1) * 0.9 * H; // beside the face they look at, at the frame's edge
    const b = body(layer, { spec, H, x: X, floor: (of.head?.[1] ?? 0) + 4 * H, view: "back", facing: 1 });
    const goal = top ?? (of.head ? of.head[1] + 0.05 * H : of.box().headTop + 0.35 * of.box().headPx); // nearer and a little lower than the face they look at, so the face stays clear
    return { body: b, H, draw(t, o = {}) { b.draw(b.pose(posture, phase), { props: false, face: "neutral", ...o }); const B = b.box(); const dy = goal - B.headTop; if (Math.abs(dy) > 0.5) b.draw(b.pose(posture, phase), { props: false, face: "neutral", floor: B.floor + dy, ...o }); } };
  }
  const pose3D = (posture = "stand", phase = 35, opts = {}) => root.ZBODY.pose3D(posture, phase, opts);
  const blend3D = (poseA, poseB, u, opts = {}) => root.ZBODY.blend3D(poseA, poseB, u, opts);
  const named = (posture) => (opts = {}) => ({ posture, phase: opts.phase ?? 35, props: opts.props, trim: opts.trim, handPoses: opts.handPoses });
  const sit = named("sit"), sleep = named("sleep"), squat = named("squat"), ruku = named("ruku"), sajdah = named("sajdah");
  // the relaxed stand, breathing: one breath every 3.6 s (shoulders rise, the chest opens); use it for anyone just standing
  const idle = (t = 0, o = {}) => ({ posture: "stand", phase: ((t + (o.offset || 0)) / 3.6 * 360) % 360, trim: o.trim, handPoses: o.handPoses });
  const stand = (sway = 0, o = {}) => ({ posture: "stand", phase: 35, trim: { headRoll: sway, ...(o.trim || {}) }, handPoses: o.handPoses });
  const beat = (posture, rate) => (t = 0, k = 0, o = {}) => ({ posture, phase: ((t + k) * 360 * rate) % 360, trim: o.trim, handPoses: o.handPoses });
  const clap = beat("clap", 1.3), cheer = beat("cheer", 1.1), wave = beat("wave", 1.4);
  const point = (o = {}) => ({ posture: "point", phase: 35, ...o }), reach = (o = {}) => ({ posture: "reach", phase: 35, ...o }), hold = (o = {}) => ({ posture: "hold", phase: 35, ...o });
  const fingerUp = (o = {}) => ({ posture: "wave", phase: 35, handPoses: ["rest", "point"], ...o }); // one finger raised: the person's own hand, for anyone
  const jump = (k) => ({ posture: "jump", phase: clamp(k, 0, 1) * 359.9 });

  // ---------- a crowd (full bodies, small): stands, a lane, an audience ----------
  const CLOTH = ["#2f4f7a", "#8a2f2f", "#3d6b4a", "#c98a2b", "#4a3a5e", "#1f2a36", "#a8553a", "#6b7f8f", "#7a5230", "#2b5f6b", "#c0506a", "#e0b040"];
  function crowd(layer, { n = 8, x0 = 0, x1 = 1080, floor = 1200, H = 30, mode = "clap", seed = 3, rows = 1, view = "front" } = {}) {
    let sd = seed * 9301 + 49297; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const people = [];
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) {
      const f = i % 2 ? "female" : "male", k = r * n + i;
      people.push({ x: x0 + ((i + 0.5 + (r % 2) * 0.5) / n) * (x1 - x0), floor: floor - r * H * 2.6, H: H * (1 - r * 0.08), ph: rnd() * 3, walk: mode === "walk", dir: k % 2 ? -1 : 1,
        b: body(layer, { spec: { gender: f, age: k % 7 === 3 ? "elderly" : k % 5 === 2 ? "child" : "adult", skin: 2 + Math.floor(rnd() * 5),
          hair: { style: f === "female" ? (rnd() < 0.4 ? "hijab" : "long") : rnd() < 0.2 ? "cap" : "side", color: "black" }, outfit: { type: f === "female" ? "salwar" : "shirt", color: CLOTH[k % CLOTH.length] } }, H: H * (1 - r * 0.08), view: mode === "walk" ? "side" : view }) });
    }
    people.reverse(); // back rows first
    return {
      people,
      draw(t) { for (const p of people) {
        if (p.walk) { const span = x1 - x0 + 300, x = x0 - 150 + ((((p.x - x0) + p.dir * 1.5 * p.H * t) % span) + span) % span; p.b.draw(root.ZBODY.cycle("walk", t / 1.1 + p.ph), { x, floor: p.floor, facing: p.dir }); continue; }
        // a library action (a crowd_* loop, sit_audience…): each person a little out of step, from its own seconds
        const lib = !["cheer", "clap", "watch"].includes(mode) && root.ZANATOMY.library().actions.includes(mode);
        const pose = lib ? p.b.pose(mode, ((t / Math.max(0.3, p.sec || 1.6) + p.ph) % 1) * 360) : mode === "cheer" ? cheer(t, p.ph) : mode === "clap" ? clap(t, p.ph) : stand(Math.sin(t + p.ph * 3) * 3);
        p.b.draw(pose, { x: p.x, floor: p.floor });
      } },
    };
  }

  // lip-sync. The voice's own energy (root.ZVOICE: RMS at 30 fps, 0..1, written by the build from the voice file) opens the jaw on
  // every frame and closes it in the pauses; inside a spoken word its syllables shape the beat and its vowel signs the width
  // (ো ৌ ু ূ / o u → round, া / a → open, ি ী ে ৈ / i e → wide). Without the voice (a preview), the words' times alone drive it.
  const SEG = (() => { try { return new Intl.Segmenter("bn", { granularity: "grapheme" }); } catch { return null; } })();
  const graphemes = (s) => (SEG ? [...SEG.segment(s)].map((x) => x.segment) : [...s]);
  const ROUND = /[\u09CB\u09CC\u09C1\u09C2\u0993\u0994\u0989\u098A]|[ouOU]/, WIDE = /[\u09BF\u09C0\u09C7\u09C8\u0987\u0988\u098F\u0990]|[ieIE]/;
  function lip(t, words = []) {
    const V = root.ZVOICE, fps = V?.fps || 30, n = V?.env?.length || 0, E = (k) => (n ? V.env[Math.max(0, Math.min(n - 1, k))] || 0 : 0), i = Math.round(t * fps);
    const w = words.find((x) => t >= (x.t ?? x.start) - 0.03 && t <= (x.e ?? x.end) + 0.03);
    let syl = 0, round = 0;
    if (w) {
      const a = w.t ?? w.start, b = w.e ?? w.end, g = graphemes(String(w.text || "").normalize("NFC")).filter((c) => /[\p{L}\p{N}]/u.test(c));
      const k = Math.max(1, /[\u0980-\u09FF]/.test(g.join("")) ? Math.round(g.length / 1.5) : (String(w.text).match(/[aeiouy]+/gi) || [1]).length), u = clamp((t - a) / Math.max(0.08, b - a), 0, 1);
      syl = Math.abs(Math.sin(u * Math.PI * k)); const part = g.slice(Math.floor((Math.min(k - 1, Math.floor(u * k)) / k) * g.length), Math.ceil(((Math.min(k - 1, Math.floor(u * k)) + 1) / k) * g.length)).join("");
      round = ROUND.test(part) ? 0.7 : WIDE.test(part) ? 0 : 0.2;
    }
    let open;
    if (n) { const e = (E(i - 2) + 2 * E(i - 1) + 3 * E(i) + 2 * E(i + 1) + E(i + 2)) / 9, gate = clamp((e - 0.07) / 0.13, 0, 1); open = gate * clamp(0.18 + 0.8 * e, 0, 1) * (w ? 0.55 + 0.45 * syl : 0.7); }
    else open = w ? clamp(0.25 + 0.6 * syl, 0, 1) : 0;
    return { mouth: Math.round(open * 1000) / 1000, round: open > 0.05 ? round : 0, talking: true };
  }
  const mouth = (t, words = []) => lip(t, words).mouth;

  // a nod (yes) or a head shake (no), as a trim on any pose: b.pose("stand", 0, { trim: { headPitch: ZC.nod(t, { t0, t1 }) } }).
  // Each beat dips and comes back; it eases in and out so it starts and ends at the pose's own head.
  const headBeat = (t, { t0 = 0, t1 = 1, times = 2, deg = 14 } = {}) => {
    if (t <= t0 || t >= t1) return 0;
    const u = (t - t0) / (t1 - t0), env = Math.sin(Math.PI * u);
    return deg * env * Math.sin(Math.PI * 2 * times * u - Math.PI / 2) * 0.5 + deg * env * 0.5;
  };
  const nod = (t, o = {}) => headBeat(t, { deg: 14, ...o });
  const headShake = (t, o = {}) => { const v = headBeat(t, { deg: 18, times: 2.5, ...o }); return v - (o.deg ?? 18) * 0.5 * (t > (o.t0 ?? 0) && t < (o.t1 ?? 1) ? Math.sin(Math.PI * (t - (o.t0 ?? 0)) / ((o.t1 ?? 1) - (o.t0 ?? 0))) : 0); };
  // a two-person library move (a file with pair: { with, partner: [side, forward] } and contacts on "partner.<joint>"): both people play
  // their halves at the same moment u (0…1), the partner stands where the file puts them (unless at.bx), and every contact becomes a
  // real reach: the hand lands on the other person's joint, eased in and out over its window. Sizes may differ (a child, an elder).
  //   ZC.pair(a, b, "hug_front_a", u, { a: { x, floor, facing, view }, b: { … }, t })   → { bx }
  function pair(a, b, id, u, o = {}) {
    const A = root.ZANATOMY, defA = A.libraryDef(id);
    if (!defA?.pair?.with) throw new Error(`ZC.pair: "${id}" is not a two-person move (no pair.with)`);
    const idB = defA.pair.with, defB = A.libraryDef(idB) || {}, ph = clamp(u, 0, 1) * 360 - (u >= 1 && defA.loop ? 1e-3 : 0);
    const atA = { ...(o.a || {}) }, atB = { ...(o.b || {}) };
    let pa = a.pose(id, ph), pb = b.pose(idB, ph);
    // coming from another move: each authored half blends in from the pose that person had (o.a.from, o.a.w 0…1), so nothing jumps
    if (atA.from && atA.w < 1) pa = a.blend(atA.from, pa, Math.max(0, atA.w)); if (atB.from && atB.w < 1) pb = b.blend(atB.from, pb, Math.max(0, atB.w));
    delete atA.from; delete atA.w; delete atB.from; delete atB.w;
    // the file's side axis has the right shoulder at +x; the posed skeleton may be mirrored, so the side follows its own shoulders
    const hand = Math.sign(pa.joints.shoulderR.x - pa.joints.shoulderL.x) || 1;
    const [side0 = 0, fwd = 0] = defA.pair.partner || [], side = side0 * hand;
    const fa = atA.facing ?? 1, face2face = fwd > Math.abs(side0);
    if (atB.x == null) {
      // the partner's feet: the offset is in the first person's own frame (U), seen through the shot's view
      const k = (atA.H ?? a.H) / 27, v = atA.view || "side", V = { three: "threeQuarter" }[v] || v, turned = /side|three/.test(v);
      const p0 = A.project({ x: 0, y: 0, z: 0 }, V, { scale: 1, cx: 0, groundY: 0 }), p1 = A.project({ x: side, y: 0, z: fwd }, V, { scale: 1, cx: 0, groundY: 0 });
      atB.x = (atA.x ?? 0) + (p1.x - p0.x) * k * (turned ? fa : 1);
    }
    if (atB.facing == null) atB.facing = face2face ? -fa : fa;
    if (atB.view == null && atA.view) atB.view = atA.view;
    // a contact touches at `from` and lets go at `to`: the hand travels there in the 0.12 before and leaves in the 0.12 after
    const win = (c) => { const from = c.from ?? 0, to = c.to ?? 1, r = 0.12, i = from <= 0 ? 1 : clamp((u - (from - r)) / r, 0, 1), out = to >= 1 ? 1 : clamp((to + r - u) / r, 0, 1); return ease(i) * ease(out); };
    // two hands that reach for each other meet halfway (salam, holding hands); any other contact goes to the other person's joint
    const live = (def) => (def.contacts || []).filter((c) => /^partner\./.test(c.on || "") && /^(hand|wrist)[LR]$/.test(c.joint || ""));
    const cA = live(defA), cB = live(defB), mutual = (c, others) => others.find((o2) => o2.on.slice(8) === c.joint && o2.joint === c.on.slice(8));
    b.draw(pb, atB); a.draw(pa, atA);                    // both as authored, so every joint is known
    const mid = new Map();
    for (const c of cA) { const m = mutual(c, cB); if (m) { const p = a.jointAt(c.joint), q = b.jointAt(m.joint); mid.set(c, { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }); mid.set(m, mid.get(c)); } }
    const reachAll = (who, ps, list, other, at) => {
      for (const c of list) { const w = win(c); if (w > 0) ps = who.reach(ps, c.joint.slice(-1), mid.get(c) || other.jointAt(c.on.slice(8)), w, { ...at, center: ps.center }); }
      return ps.center ? ps : who.reach(ps, "R", null, 0, at);
    };
    pa = reachAll(a, pa, cA, b, atA); a.draw(pa, { ...atA, center: pa.center });
    pb = reachAll(b, pb, cB, a, atB); b.draw(pb, { ...atB, center: pb.center });
    return { bx: atB.x, facing: atB.facing };
  }
  root.ZC = { world, clock, nod, headShake, pair, person, body, actor, ots, crowd, mouth, lip, prop, sheet, carry, handover, shots, place, keys: K, FACES, pose3D, blend3D, idle, sit, sleep, squat, ruku, sajdah, point, reach, run: (u) => root.ZBODY.cycle("run", u), walk: (u) => root.ZBODY.cycle("walk", u), stand, clap, cheer, wave, fingerUp, hold, jump, el };
})(typeof window !== "undefined" ? window : globalThis);
