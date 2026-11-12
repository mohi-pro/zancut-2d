// A grey rock pigeon (kabutor) with iridescent neck sheen, rhythmic head bobbing, pecking and flight.
ZS.define("pigeon", { about: "a rock pigeon with a green-purple neck sheen, about 32 cm", kind: "set", tags: ["animal", "bird", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 54, seed = 1, color = "#8a949e", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = k.light(color, 0.16), fly = act === "fly", by = fly ? 0 : -h * 0.45;
  if (!fly) k.ground(g, h * 0.65);
  const lG = k.el("g", {}, g);
  if (!fly) {
    k.R(lG, -h * 0.04, by + h * 0.12, h * 0.025, -by - h * 0.12, "#c8464c");
    k.R(lG, h * 0.03, by + h * 0.12, h * 0.025, -by - h * 0.12, "#c8464c");
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.22} ${by} L${-h * 0.54} ${by + h * 0.12} L${-h * 0.48} ${by + h * 0.2} L${-h * 0.16} ${by + h * 0.08}Z`, dk);
  k.E(bd, 0, by, h * 0.3, h * 0.19, color);
  k.P(bd, `M${-h * 0.24} ${by - h * 0.06} Q0 ${by - h * 0.22} ${h * 0.24} ${by - h * 0.06}Z`, lt);
  k.E(bd, h * 0.16, by - h * 0.08, h * 0.12, h * 0.11, "#3e8c78");
  k.E(bd, h * 0.14, by - h * 0.04, h * 0.1, h * 0.07, "#7a528c", 0.7);
  const wg = k.el("g", {}, bd), wP = k.P(wg, "", dk);
  const hG = k.el("g", {}, bd);
  k.C(hG, 0, 0, h * 0.12, dk);
  k.P(hG, `M${h * 0.1} ${-h * 0.04} L${h * 0.23} ${h * 0.01} L${h * 0.1} ${h * 0.04}Z`, "#343038");
  k.E(hG, h * 0.11, -h * 0.03, h * 0.03, h * 0.02, "#f4efe6");
  k.C(hG, h * 0.04, -h * 0.02, h * 0.024, "#e0682c");
  k.C(hG, h * 0.042, -h * 0.02, h * 0.01, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk";
    const fy = fly ? Math.sin(s * 13) * h * 0.1 : (wlk ? Math.abs(Math.sin(s * 9)) * h * 0.025 : 0);
    const rot = pck ? 36 + Math.sin(s * 14) * 10 : Math.sin(s * 3) * 2;
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${rot} 0 ${by})`);
    const hBob = wlk ? Math.sin(s * 9) * h * 0.04 : Math.sin(s * 4) * h * 0.015;
    hG.setAttribute("transform", `translate(${h * 0.2 + hBob} ${by - h * 0.18}) rotate(${pck ? 22 : 0})`);
    if (fly) {
      const wf = Math.sin(s * 16) * h * 0.38;
      wP.setAttribute("d", `M${-h * 0.08} ${by - h * 0.04} Q0 ${by - wf * 1.3} ${h * 0.14} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.08} ${by + h * 0.04}Z`);
    } else {
      wP.setAttribute("d", `M${-h * 0.24} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.12} ${by + h * 0.02} Q${-h * 0.08} ${by + h * 0.14} ${-h * 0.28} ${by + h * 0.08}Z`);
    }
  };
  g.tick(0);
  return g;
});
