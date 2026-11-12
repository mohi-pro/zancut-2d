// ZanHuman full body: every full body in every film is one skeleton, engine/cartoon/anatomy.js (rules H01–H21 in
// skills/2d-animation/human-anatomy-rigging.md). This file is the bridge from a person's look to that skeleton.
//   ZBODY.pose3D(posture, phase, { look | spec, trim, props, gesture: { id, phase, mirror } })   a solved pose (a library gesture laid on it)
//   ZBODY.blend3D(a, b, u)                                       a smooth transition, bones kept
//   ZBODY.draw(g, { view, pose: solved | { posture, phase, props, trim }, H, look, spec, garment, cloth, face, smile, mouth, mouthRound, blink, eyesClosed, barefoot, center })
//   ZBODY.cycle("walk" | "run", u)                               u 0…1 through one cycle
(function (root) {
  function pose3D(posture = "stand", phase = 35, opts = {}) {
    const bio = opts.look?.biometrics || (opts.spec && root.ZPEOPLE?.biometrics?.(opts.spec)) || {};
    return root.ZANATOMY.pose({ posture, phase, profile: opts.profile || bio.profile || "adult", trim: opts.trim, props: opts.props, handPoses: opts.handPoses, seenSide: opts.seenSide, gesture: opts.gesture });
  }
  const blend3D = (poseA, poseB, u, opts = {}) => root.ZANATOMY.blend(poseA, poseB, u, opts);
  function gesture3D(id, t, opts = {}) {
    const bio = opts.look?.biometrics || (opts.spec && root.ZPEOPLE?.biometrics?.(opts.spec)) || {};
    return root.ZANATOMY.gestureAt(opts.posture || "stand", t, { ...opts, id, profile: opts.profile || bio.profile || "adult" });
  }
  const VIEW = { three: "threeQuarter", threeQuarter: "threeQuarter", side: "side", sideLeft: "sideLeft", front: "front", back: "back", top: "top" };
  function draw(g, { view = "front", pose, posture, phase = 35, H = 100, look = {}, spec, garment, cloth, props, marks = false, id, face, smile, mouth, mouthRound, blink, eyesClosed, barefoot, center, gaze } = {}) {
    const A = root.ZANATOMY, bio = look?.biometrics || (spec && root.ZPEOPLE?.biometrics?.(spec)) || {};
    if (pose && !pose.joints && !pose.posture && !posture) throw new Error("A full body needs a posture: ZC.stand(), ZC.walk(u), ZC.run(u), ZC.sit() … or actor.pose(name, phase).");
    const ps = pose && pose.joints ? pose : pose3D(posture || pose?.posture || "stand", pose?.phase ?? phase, { profile: pose?.profile || bio.profile, trim: pose?.trim, props: props ?? pose?.props, handPoses: pose?.handPoses, look, spec, seenSide: /^side/.test(view) });
    return A.draw(g, ps, {
      id: id || "body3d", view: VIEW[view] || "front", garment: garment || pose?.garment || bio.garment || "punjabi", cloth: { ...(bio.cloth || {}), ...(pose?.cloth || {}), ...(cloth || {}) },
      look, scale: H / 27, cx: 0, groundY: 0, groundLine: false, drawProps: props !== false && pose?.props !== false,
      marks, face, smile, mouth, mouthRound, blink, eyesClosed, barefoot, center, gaze,
    });
  }
  const cycle = (kind, u) => ({ posture: kind, phase: (((u % 1) + 1) % 1) * 360 });
  root.ZBODY = { draw, draw3D: draw, pose3D, gesture3D, blend3D, cycle };
})(typeof window !== "undefined" ? window : globalThis);
