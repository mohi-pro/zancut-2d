// A striped honeybee (moumachi) hovering and buzzing in loops around a cluster of village flowers.
ZS.define("bee", { about: "a striped honeybee hovering around flowers, about 2 cm", kind: "set", tags: ["animal", "insect", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 42, seed = 1, color = "#e8b428", flip, facing, act = "fly", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = "#241e20", flC = k.pick(r, ["#d85268", "#e28438", "#8858b4"]);
  const stG = k.el("g", {}, g);
  k.P(stG, `M0 0 Q${-h * 0.08} ${-h * 0.28} ${-h * 0.04} ${-h * 0.52} L0 ${-h * 0.52} Q${-h * 0.03} ${-h * 0.28} ${h * 0.03} 0Z`, "#4e8c3a");
  k.E(stG, -h * 0.12, -h * 0.26, h * 0.1, h * 0.045, "#4e8c3a");
  for (let a = 0; a < 5; a++) {
    const ang = a * 1.256;
    k.C(stG, -h * 0.02 + Math.cos(ang) * h * 0.08, -h * 0.54 + Math.sin(ang) * h * 0.08, h * 0.055, flC);
  }
  k.C(stG, -h * 0.02, -h * 0.54, h * 0.045, "#f0c84b");
  const bG = k.el("g", {}, g);
  const w1 = k.E(bG, -h * 0.03, -h * 0.12, h * 0.08, h * 0.14, "#eaf3f7", 0.78);
  const w2 = k.E(bG, h * 0.03, -h * 0.11, h * 0.07, h * 0.12, "#fff6e6", 0.82);
  k.P(bG, `M${-h * 0.16} 0 L${-h * 0.23} 0 L${-h * 0.15} ${h * 0.03}Z`, dk);
  k.E(bG, 0, 0, h * 0.16, h * 0.11, color);
  k.R(bG, -h * 0.08, -h * 0.1, h * 0.04, h * 0.2, dk, 1);
  k.R(bG, 0, -h * 0.1, h * 0.04, h * 0.2, dk, 1);
  k.C(bG, h * 0.14, -h * 0.01, h * 0.075, dk);
  k.C(bG, h * 0.17, -h * 0.03, h * 0.02, "#fff6e6");
  g.tick = (t) => {
    const s = t * speed + ph, isP = act === "perch";
    stG.setAttribute("transform", `rotate(${Math.sin(s * 2) * 3} 0 0)`);
    const bx = isP ? h * 0.05 : Math.cos(s * 3.2) * h * 0.36;
    const by = isP ? -h * 0.62 : -h * 0.72 + Math.sin(s * 6.4) * h * 0.16;
    const tilt = isP ? 10 : Math.sin(s * 3.2) * 14;
    bG.setAttribute("transform", `translate(${bx} ${by}) rotate(${tilt})`);
    w1.setAttribute("ry", h * (0.06 + Math.abs(Math.sin(s * 28)) * 0.1));
    w2.setAttribute("ry", h * (0.05 + Math.abs(Math.cos(s * 28)) * 0.09));
  };
  g.tick(0);
  return g;
});
