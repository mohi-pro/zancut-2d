// A small brown house sparrow (chorui pakhi) that hops, pecks and flutters its wings.
ZS.define("sparrow", { about: "a small brown house sparrow, about 15 cm", kind: "set", tags: ["animal", "bird", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 36, seed = 1, color = "#9c6b46", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), belly = "#dfd6c6", fly = act === "fly", by = fly ? 0 : -h * 0.46;
  if (!fly) k.ground(g, h * 0.65);
  const lG = k.el("g", {}, g);
  if (!fly) {
    k.R(lG, -h * 0.05, by + h * 0.12, h * 0.025, -by - h * 0.12, "#7a583e");
    k.R(lG, h * 0.03, by + h * 0.12, h * 0.025, -by - h * 0.12, "#7a583e");
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.2} ${by} L${-h * 0.52} ${by - h * 0.12} L${-h * 0.48} ${by + h * 0.04} L${-h * 0.16} ${by + h * 0.08}Z`, dk);
  k.E(bd, 0, by, h * 0.28, h * 0.2, belly);
  k.P(bd, `M${-h * 0.26} ${by - h * 0.04} Q0 ${by - h * 0.24} ${h * 0.24} ${by - h * 0.06} Q0 ${by + h * 0.04} ${-h * 0.26} ${by - h * 0.04}Z`, color);
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.C(hG, 0, 0, h * 0.16, color);
  k.E(hG, h * 0.02, h * 0.04, h * 0.09, h * 0.06, "#e8dfd2");
  k.P(hG, `M${h * 0.08} ${h * 0.06} L${h * 0.15} ${h * 0.06} L${h * 0.1} ${h * 0.16}Z`, "#241e1c");
  k.P(hG, `M${h * 0.13} ${-h * 0.05} L${h * 0.26} ${0} L${h * 0.13} ${h * 0.05}Z`, "#3a322e");
  k.C(hG, h * 0.06, -h * 0.03, h * 0.024, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk";
    const hop = fly ? Math.sin(s * 15) * h * 0.12 : (wlk ? Math.abs(Math.sin(s * 12)) * h * 0.12 : (Math.sin(s * 5) > 0.75 ? -h * 0.06 : 0));
    const rot = pck ? 38 + Math.sin(s * 16) * 12 : Math.sin(s * 4) * 4;
    bd.setAttribute("transform", `translate(0 ${hop}) rotate(${rot} 0 ${by})`);
    hG.setAttribute("transform", `translate(${h * 0.18} ${by - h * 0.14}) rotate(${pck ? 20 : Math.sin(s * 6) * 8})`);
    if (fly) {
      const wf = Math.sin(s * 20) * h * 0.36;
      wg.setAttribute("d", `M${-h * 0.06} ${by - h * 0.04} Q0 ${by - wf * 1.3} ${h * 0.12} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.06} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.22} ${by - h * 0.04} Q0 ${by - h * 0.12} ${h * 0.12} ${by + h * 0.02} Q${-h * 0.06} ${by + h * 0.14} ${-h * 0.24} ${by + h * 0.06}Z`);
    }
  };
  g.tick(0);
  return g;
});
