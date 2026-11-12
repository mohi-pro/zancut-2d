// A bright turquoise-and-orange Bangladeshi kingfisher (machranga) perched on a branch or diving in flight.
ZS.define("kingfisher", { about: "a bright turquoise and orange kingfisher on a branch, about 18 cm", kind: "set", tags: ["animal", "bird", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 48, seed = 1, color = "#1f8a9c", color2 = "#d96b2c", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = k.light(color, 0.18), fly = act === "fly", by = fly ? 0 : -h * 0.48;
  if (!fly) {
    k.P(g, `M${-h * 0.55} ${-h * 0.18} Q0 ${-h * 0.26} ${h * 0.48} ${-h * 0.16} L${h * 0.48} ${-h * 0.1} Q0 ${-h * 0.2} ${-h * 0.55} ${-h * 0.1}Z`, "#6e4e34");
    k.E(g, -h * 0.35, -h * 0.22, h * 0.1, h * 0.045, "#5a8f3c");
    k.R(g, -h * 0.04, by + h * 0.14, h * 0.025, -by - h * 0.32, "#c84a32");
    k.R(g, h * 0.02, by + h * 0.14, h * 0.025, -by - h * 0.32, "#c84a32");
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.18} ${by + h * 0.04} L${-h * 0.42} ${by + h * 0.14} L${-h * 0.38} ${by + h * 0.2} L${-h * 0.14} ${by + h * 0.1}Z`, dk);
  k.E(bd, 0, by, h * 0.26, h * 0.2, color2);
  k.P(bd, `M${-h * 0.25} ${by - h * 0.04} Q0 ${by - h * 0.24} ${h * 0.2} ${by - h * 0.08} Q${-h * 0.04} ${by + h * 0.08} ${-h * 0.25} ${by - h * 0.04}Z`, color);
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.E(hG, 0, 0, h * 0.18, h * 0.15, color);
  k.E(hG, -h * 0.03, -h * 0.06, h * 0.13, h * 0.06, lt);
  k.E(hG, h * 0.04, h * 0.05, h * 0.09, h * 0.05, "#f4efe6");
  k.P(hG, `M${h * 0.14} ${-h * 0.05} L${h * 0.48} 0 L${h * 0.14} ${h * 0.05}Z`, "#242024");
  k.C(hG, h * 0.06, -h * 0.03, h * 0.024, "#1c1420");
  k.C(hG, h * 0.065, -h * 0.035, h * 0.008, "#fff6e6");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat";
    const fy = fly ? Math.sin(s * 16) * h * 0.12 : 0;
    const rot = pck ? 35 + Math.sin(s * 12) * 10 : Math.sin(s * 2.5) * 2;
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${rot} 0 ${by})`);
    const hBob = Math.sin(s * 4.5) > 0.72 ? -h * 0.035 : 0;
    hG.setAttribute("transform", `translate(${h * 0.14} ${by - h * 0.16 + hBob}) rotate(${pck ? 24 : Math.sin(s * 3) * 5})`);
    if (fly) {
      const wf = Math.sin(s * 22) * h * 0.38;
      wg.setAttribute("d", `M${-h * 0.06} ${by - h * 0.04} Q0 ${by - wf * 1.3} ${h * 0.14} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.06} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.22} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.1} ${by + h * 0.04} Q${-h * 0.08} ${by + h * 0.14} ${-h * 0.24} ${by + h * 0.08}Z`);
    }
  };
  g.tick(0);
  return g;
});
