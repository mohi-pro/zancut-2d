// The Oriental magpie-robin (doel pakhi), national bird of Bangladesh, with navy-black and white plumage and cocked tail.
ZS.define("doel", { about: "a Bangladeshi national magpie-robin (doel pakhi) with an upright tail, about 19 cm", kind: "set", tags: ["animal", "bird", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 44, seed = 1, color = "#1f2836", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const wht = "#f4efe6", dk = "#141822", fly = act === "fly", by = fly ? 0 : -h * 0.46;
  if (!fly) {
    k.ground(g, h * 0.65);
    k.R(g, -h * 0.04, by + h * 0.12, h * 0.025, -by - h * 0.12, "#2e3238");
    k.R(g, h * 0.03, by + h * 0.12, h * 0.025, -by - h * 0.12, "#2e3238");
  }
  const bd = k.el("g", {}, g);
  const tG = k.el("g", {}, bd);
  k.P(tG, `M0 0 L${-h * 0.32} ${-h * 0.34} L${-h * 0.24} ${-h * 0.38} L${h * 0.04} ${-h * 0.04}Z`, color);
  k.P(tG, `M${-h * 0.04} 0 L${-h * 0.3} ${-h * 0.28} L${-h * 0.26} ${-h * 0.22} L${-h * 0.02} ${h * 0.04}Z`, wht);
  k.E(bd, 0, by, h * 0.27, h * 0.18, wht);
  k.P(bd, `M${-h * 0.25} ${by - h * 0.03} Q0 ${by - h * 0.22} ${h * 0.22} ${by - h * 0.04} L${h * 0.12} ${by + h * 0.04} L${-h * 0.22} ${by + h * 0.02}Z`, color);
  const wg = k.el("g", {}, bd), wP = k.P(wg, "", dk), wS = k.E(wg, -h * 0.04, by, h * 0.12, h * 0.035, wht);
  const hG = k.el("g", {}, bd);
  k.E(hG, 0, 0, h * 0.14, h * 0.12, color);
  k.P(hG, `M${h * 0.11} ${-h * 0.04} L${h * 0.26} 0 L${h * 0.11} ${h * 0.04}Z`, dk);
  k.C(hG, h * 0.05, -h * 0.02, h * 0.022, "#1c1420");
  k.C(hG, h * 0.055, -h * 0.025, h * 0.008, wht);
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat";
    const fy = fly ? Math.sin(s * 15) * h * 0.12 : 0;
    const rot = pck ? 35 + Math.sin(s * 14) * 10 : Math.sin(s * 3) * 3;
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${rot} 0 ${by})`);
    tG.setAttribute("transform", `translate(${-h * 0.2} ${by - h * 0.04}) rotate(${Math.sin(s * 5.5) * 14})`);
    hG.setAttribute("transform", `translate(${h * 0.18} ${by - h * 0.14}) rotate(${pck ? 20 : Math.sin(s * 4) * 6})`);
    const wf = fly ? Math.sin(s * 20) * h * 0.35 : 0;
    wP.setAttribute("d", `M${-h * 0.2} ${by - h * 0.02} Q0 ${by - h * 0.1 - wf} ${h * 0.12} ${by + h * 0.02 - wf * 0.8} Q${-h * 0.06} ${by + h * 0.12} ${-h * 0.22} ${by + h * 0.06}Z`);
    wS.setAttribute("cy", by - wf * 0.4);
  };
  g.tick(0);
  return g;
});
