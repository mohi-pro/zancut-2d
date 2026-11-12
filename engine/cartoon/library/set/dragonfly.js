// A pond dragonfly (grasshopper-hawk / foring) hovering and darting above a reed stem with four shimmering wings.
ZS.define("dragonfly", { about: "a pond dragonfly (foring) hovering by a reed stem, about 7 cm", kind: "set", tags: ["animal", "insect", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 48, seed = 1, color = "#2b9eb8", flip, facing, act = "fly", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#2b9eb8", "#d84a38", "#58a442"]);
  k.P(g, `M${-h * 0.08} 0 Q${-h * 0.02} ${-h * 0.35} ${h * 0.04} ${-h * 0.65} L${h * 0.07} ${-h * 0.65} Q${h * 0.02} ${-h * 0.35} ${-h * 0.03} 0Z`, "#4e7c3e");
  const dG = k.el("g", {}, g);
  const w1 = k.E(dG, h * 0.04, -h * 0.14, h * 0.06, h * 0.22, "#eaf3f7", 0.72);
  const w2 = k.E(dG, -h * 0.04, -h * 0.12, h * 0.055, h * 0.2, "#fff6e6", 0.76);
  k.R(dG, -h * 0.42, -h * 0.025, h * 0.42, h * 0.045, c, 2);
  k.E(dG, h * 0.04, 0, h * 0.1, h * 0.055, k.dark(c, 0.16));
  k.C(dG, h * 0.15, -h * 0.01, h * 0.055, c);
  k.C(dG, h * 0.17, -h * 0.02, h * 0.03, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, isP = act === "perch";
    const dx = isP ? h * 0.06 : Math.sin(s * 2.4) * h * 0.32;
    const dy = isP ? -h * 0.66 : -h * 0.76 + Math.cos(s * 3.8) * h * 0.14;
    const rot = isP ? -8 : Math.cos(s * 2.4) * 10;
    dG.setAttribute("transform", `translate(${dx} ${dy}) rotate(${rot})`);
    w1.setAttribute("ry", h * (isP ? 0.18 : 0.08 + Math.abs(Math.sin(s * 32)) * 0.16));
    w2.setAttribute("ry", h * (isP ? 0.16 : 0.07 + Math.abs(Math.cos(s * 32)) * 0.15));
  };
  g.tick(0);
  return g;
});
