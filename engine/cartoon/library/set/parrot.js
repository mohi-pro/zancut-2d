// A bright green rose-ringed parakeet (tiya pakhi) with red hooked beak, collar ring and long tail.
ZS.define("parrot", { about: "a green rose-ringed parakeet (tiya) with a red beak, about 38 cm", kind: "set", tags: ["animal", "bird", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 64, seed = 1, color = "#52a442", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.2), lt = k.light(color, 0.18), fly = act === "fly", by = fly ? 0 : -h * 0.52;
  if (!fly) {
    k.R(g, -h * 0.35, -h * 0.22, h * 0.7, h * 0.04, "#6e4e34", 2);
    k.R(g, -h * 0.04, by + h * 0.14, h * 0.025, -by - h * 0.36, "#5a544e");
    k.R(g, h * 0.02, by + h * 0.14, h * 0.025, -by - h * 0.36, "#5a544e");
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.14} ${by + h * 0.08} L${-h * 0.56} ${by + h * 0.42} L${-h * 0.5} ${by + h * 0.46} L${-h * 0.08} ${by + h * 0.14}Z`, dk);
  k.E(bd, 0, by, h * 0.24, h * 0.18, color);
  k.P(bd, `M${-h * 0.2} ${by - h * 0.06} Q0 ${by - h * 0.2} ${h * 0.2} ${by - h * 0.06}Z`, lt);
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.C(hG, 0, 0, h * 0.13, color);
  k.R(hG, -h * 0.1, h * 0.08, h * 0.2, h * 0.025, "#d8452f", 2);
  k.R(hG, -h * 0.08, h * 0.06, h * 0.18, h * 0.02, "#1c1420", 1);
  k.P(hG, `M${h * 0.1} ${-h * 0.05} C${h * 0.24} ${-h * 0.05} ${h * 0.24} ${h * 0.06} ${h * 0.16} ${h * 0.1} L${h * 0.1} ${h * 0.03}Z`, "#d8382c");
  k.C(hG, h * 0.04, -h * 0.02, h * 0.022, "#fff6e6");
  k.C(hG, h * 0.042, -h * 0.02, h * 0.012, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat";
    const fy = fly ? Math.sin(s * 14) * h * 0.1 : 0;
    const rot = pck ? 32 + Math.sin(s * 10) * 8 : (fly ? -12 : Math.sin(s * 2.5) * 3);
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${rot} 0 ${by})`);
    hG.setAttribute("transform", `translate(${h * 0.14} ${by - h * 0.16}) rotate(${pck ? 22 : Math.sin(s * 3.2) * 8})`);
    if (fly) {
      const wf = Math.sin(s * 18) * h * 0.36;
      wg.setAttribute("d", `M${-h * 0.06} ${by - h * 0.04} Q0 ${by - wf * 1.3} ${h * 0.14} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.06} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.2} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.1} ${by + h * 0.04} Q${-h * 0.06} ${by + h * 0.14} ${-h * 0.22} ${by + h * 0.08}Z`);
    }
  };
  g.tick(0);
  return g;
});
