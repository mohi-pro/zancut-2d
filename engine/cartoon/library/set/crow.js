// A Bangladeshi house crow (pati kak) with grey neck collar, sharp beak, perching, pecking and flying.
ZS.define("crow", { about: "a Bangladeshi house crow with a grey neck, about 40 cm", kind: "set", tags: ["animal", "bird", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 62, seed = 1, color = "#242228", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const neck = "#54565e", dk = "#16141a", lt = "#3c3a44", fly = act === "fly";
  const by = fly ? 0 : -h * 0.46;
  if (!fly) k.ground(g, h * 0.65);
  const lG = k.el("g", {}, g);
  if (!fly) {
    k.R(lG, -h * 0.05, by + h * 0.1, h * 0.025, -by - h * 0.1, dk);
    k.R(lG, h * 0.03, by + h * 0.1, h * 0.025, -by - h * 0.1, dk);
    k.R(lG, -h * 0.09, -h * 0.025, h * 0.18, h * 0.025, dk, 1);
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.22} ${by} L${-h * 0.56} ${by + h * 0.12} L${-h * 0.5} ${by + h * 0.2} L${-h * 0.18} ${by + h * 0.08}Z`, dk);
  k.E(bd, -h * 0.04, by, h * 0.28, h * 0.16, color);
  k.E(bd, h * 0.14, by - h * 0.06, h * 0.14, h * 0.13, neck);
  k.P(bd, `M${-h * 0.26} ${by - h * 0.06} Q0 ${by - h * 0.18} ${h * 0.2} ${by - h * 0.08}Z`, lt);
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.E(hG, 0, 0, h * 0.13, h * 0.11, color);
  k.P(hG, `M${h * 0.09} ${-h * 0.05} L${h * 0.3} ${h * 0.01} L${h * 0.09} ${h * 0.05}Z`, dk);
  k.C(hG, h * 0.04, -h * 0.02, h * 0.02, "#1c1420");
  k.C(hG, h * 0.044, -h * 0.024, h * 0.007, "#fff6e6");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk";
    const fy = fly ? Math.sin(s * 12) * h * 0.1 : (wlk ? Math.abs(Math.sin(s * 9)) * h * 0.04 : 0);
    const rot = pck ? 35 + Math.sin(s * 14) * 12 : (fly ? -8 + Math.sin(s * 12) * 4 : Math.sin(s * 2.5) * 2);
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${rot} 0 ${by})`);
    const hRot = pck ? 22 + Math.sin(s * 14) * 10 : (Math.sin(s * 3.8) > 0.65 ? -14 : 4);
    hG.setAttribute("transform", `translate(${h * 0.22} ${by - h * 0.14}) rotate(${hRot})`);
    if (fly) {
      const wf = Math.sin(s * 14) * h * 0.38;
      wg.setAttribute("d", `M${-h * 0.08} ${by - h * 0.04} Q${-h * 0.02} ${by - wf * 1.3} ${h * 0.12} ${by - wf} Q${h * 0.06} ${by + h * 0.04} ${-h * 0.08} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.24} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.12} ${by + h * 0.02} Q${-h * 0.08} ${by + h * 0.14} ${-h * 0.28} ${by + h * 0.08}Z`);
    }
  };
  g.tick(0);
  return g;
});
