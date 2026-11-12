// Soft out-of-focus foreground leaf cluster for framing the very front edge of a shot, with gentle breeze sway.
ZS.define("nearLeavesSoft", {
  about: "a soft foreground cluster of broad leaves for framing the very front of a shot, swaying gently",
  kind: "set",
  tags: ["nature", "foreground", "foliage", "framing"],
  aliases: ["foreground leaves", "soft foliage", "framing leaves", "সামনের পাতা", "গাছের পাতা"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 240, seed = 1, color = "#3d7a4c", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const phase = r() * 6.28;
  const cBack = k.dark(color, 0.22), cMid = color, cFront = k.light(color, 0.16);

  // Stem cluster anchored at (0, 0) growing upward and arching into the frame
  const foliage = k.el("g", {}, g);

  const leaves = [
    { ang: -38 + (r() - 0.5) * 6, len: h * 0.88, wid: h * 0.26, col: cBack, op: 0.82, sp: 0.9 },
    { ang: -14 + (r() - 0.5) * 6, len: h * 0.98, wid: h * 0.28, col: cMid, op: 0.9, sp: 1.1 },
    { ang: 16 + (r() - 0.5) * 6, len: h * 0.92, wid: h * 0.27, col: cMid, op: 0.9, sp: 1.0 },
    { ang: 40 + (r() - 0.5) * 6, len: h * 0.82, wid: h * 0.25, col: cBack, op: 0.84, sp: 1.2 },
    { ang: 2 + (r() - 0.5) * 5, len: h * 0.76, wid: h * 0.3, col: cFront, op: 0.92, sp: 1.35 },
  ];

  const nodes = leaves.map((lf) => {
    const lg = k.el("g", {}, foliage);
    const L = lf.len, W = lf.wid;
    k.P(lg, `M0 0 C${-W * 0.65} ${-L * 0.28} ${-W * 0.55} ${-L * 0.78} 0 ${-L} C${W * 0.55} ${-L * 0.78} ${W * 0.65} ${-L * 0.28} 0 0Z`, lf.col, lf.op);
    k.P(lg, `M0 0 C${-W * 0.62} ${-L * 0.28} ${-W * 0.52} ${-L * 0.76} 0 ${-L} L0 0Z`, k.light(lf.col, 0.12), lf.op * 0.45);
    k.R(lg, -h * 0.006, -L * 0.82, h * 0.012, L * 0.8, k.light(lf.col, 0.22), h * 0.006);
    return { lg, baseAng: lf.ang, sp: lf.sp };
  });

  g.tick = (t) => {
    nodes.forEach((n, i) => {
      const sway = Math.sin(t * 1.6 * n.sp + phase + i * 0.9) * 3.2;
      n.lg.setAttribute("transform", `rotate(${(n.baseAng + sway).toFixed(2)})`);
    });
  };
  g.tick(0);

  return g;
});
