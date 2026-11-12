// A Bangladeshi common myna (shalik pakhi) with warm brown body, dark hood, yellow eye patch and beak.
ZS.define("myna", { about: "a Bangladeshi common myna (shalik) bird, about 23 cm", kind: "set", tags: ["animal", "bird", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 46, seed = 1, color = "#6e4636", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const hood = "#242026", yel = "#e8b428", dk = k.dark(color, 0.2), fly = act === "fly", by = fly ? 0 : -h * 0.46;
  if (!fly) k.ground(g, h * 0.65);
  const lG = k.el("g", {}, g);
  if (!fly) {
    k.R(lG, -h * 0.04, by + h * 0.12, h * 0.026, -by - h * 0.12, yel);
    k.R(lG, h * 0.03, by + h * 0.12, h * 0.026, -by - h * 0.12, yel);
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.2} ${by} L${-h * 0.5} ${by + h * 0.1} L${-h * 0.45} ${by + h * 0.18} L${-h * 0.15} ${by + h * 0.08}Z`, hood);
  k.E(bd, 0, by, h * 0.28, h * 0.19, color);
  k.E(bd, -h * 0.08, by + h * 0.1, h * 0.14, h * 0.07, "#f4efe6");
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.E(hG, 0, 0, h * 0.14, h * 0.12, hood);
  k.P(hG, `M${h * 0.11} ${-h * 0.04} L${h * 0.27} ${h * 0.01} L${h * 0.11} ${h * 0.05}Z`, yel);
  k.E(hG, h * 0.03, -h * 0.01, h * 0.05, h * 0.035, yel);
  k.C(hG, h * 0.04, -h * 0.015, h * 0.018, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk";
    const hop = fly ? Math.sin(s * 14) * h * 0.12 : (wlk ? Math.abs(Math.sin(s * 10)) * h * 0.1 : 0);
    const rot = pck ? 35 + Math.sin(s * 14) * 10 : Math.sin(s * 3) * 3;
    bd.setAttribute("transform", `translate(0 ${hop}) rotate(${rot} 0 ${by})`);
    hG.setAttribute("transform", `translate(${h * 0.18} ${by - h * 0.15}) rotate(${pck ? 20 : Math.sin(s * 4) * 7})`);
    if (fly) {
      const wf = Math.sin(s * 18) * h * 0.36;
      wg.setAttribute("d", `M${-h * 0.06} ${by - h * 0.04} Q0 ${by - wf * 1.3} ${h * 0.14} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.06} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.22} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.12} ${by + h * 0.02} Q${-h * 0.08} ${by + h * 0.14} ${-h * 0.24} ${by + h * 0.08}Z`);
    }
  };
  g.tick(0);
  return g;
});
