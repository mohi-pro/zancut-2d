// A white Bangladeshi cattle/pond egret (bok pakhi) with slender S-neck and long wading legs.
ZS.define("egret", { about: "a white pond egret (bok pakhi) wading or stalking fish, about 65 cm", kind: "set", tags: ["animal", "bird", "water", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 98, seed = 1, color = "#f7f4ec", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const shd = "#dfd9cc", bill = "#e5a62e", legC = "#2e3230", fly = act === "fly", by = fly ? 0 : -h * 0.52;
  if (!fly) k.ground(g, h * 0.55);
  const l1 = !fly ? k.P(g, "", legC) : null, l2 = !fly ? k.P(g, "", legC) : null;
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, h * 0.24, h * 0.14, color);
  k.P(bd, `M${-h * 0.22} ${by + h * 0.02} Q0 ${by + h * 0.16} ${h * 0.22} ${by + h * 0.02}Z`, shd);
  const wg = k.P(bd, "", shd);
  const hG = k.el("g", {}, bd);
  k.P(hG, `M0 0 C${h * 0.08} ${-h * 0.08} ${-h * 0.04} ${-h * 0.22} ${h * 0.05} ${-h * 0.32} L${h * 0.1} ${-h * 0.3} C${h * 0.03} ${-h * 0.2} ${h * 0.14} ${-h * 0.06} ${h * 0.06} ${h * 0.04}Z`, color);
  k.E(hG, h * 0.08, -h * 0.32, h * 0.08, h * 0.06, color);
  k.P(hG, `M${h * 0.14} ${-h * 0.34} L${h * 0.36} ${-h * 0.3} L${h * 0.14} ${-h * 0.28}Z`, bill);
  k.C(hG, h * 0.1, -h * 0.33, h * 0.014, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk";
    const fy = fly ? Math.sin(s * 9) * h * 0.1 : (wlk ? Math.abs(Math.sin(s * 4.5)) * h * 0.02 : 0);
    bd.setAttribute("transform", `translate(0 ${fy})`);
    const hA = pck ? 56 + Math.sin(s * 7) * 12 : Math.sin(s * 2) * 4;
    hG.setAttribute("transform", `translate(${h * 0.18} ${by - h * 0.06}) rotate(${hA})`);
    if (fly) {
      const wf = Math.sin(s * 11) * h * 0.42;
      wg.setAttribute("d", `M${-h * 0.08} ${by - h * 0.02} Q0 ${by - wf * 1.3} ${h * 0.14} ${by - wf} Q${h * 0.04} ${by + h * 0.06} ${-h * 0.08} ${by + h * 0.04}Z`);
    } else {
      wg.setAttribute("d", `M${-h * 0.2} ${by - h * 0.02} Q0 ${by - h * 0.1} ${h * 0.12} ${by + h * 0.02} Q${-h * 0.06} ${by + h * 0.12} ${-h * 0.22} ${by + h * 0.06}Z`);
      const sw = wlk ? Math.sin(s * 4.5) * h * 0.09 : 0;
      l1.setAttribute("d", `M${-h * 0.02} ${by + h * 0.1} L${-h * 0.02 + sw} 0 L${h * 0.01 + sw} 0 L${h * 0.01} ${by + h * 0.1}Z`);
      l2.setAttribute("d", `M${h * 0.03} ${by + h * 0.1} L${h * 0.06 - sw} ${-h * 0.18} L${h * 0.02 - sw} ${-h * 0.12} L0 ${by + h * 0.1}Z`);
    }
  };
  g.tick(0);
  return g;
});
