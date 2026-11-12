// A small white ceramic tea cup with saucer and rising steam; grip (0,0) is at the cup's handle.
ZS.define("teaCup", { about: "a small white tea cup with a saucer, about 8 cm", kind: "prop", grip: "grip", base: [0.45, 0.42], tags: ["food", "tea", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 60, seed = 1, color = "#fffaf0", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.14), band = k.pick(r, ["#2d7f8c", "#d8452f", "#e0a02c"]);
  k.P(g, `M0 ${-h * 0.22} C${-h * 0.34} ${-h * 0.26} ${-h * 0.34} ${h * 0.24} 0 ${h * 0.2} L0 ${h * 0.1} C${-h * 0.18} ${h * 0.12} ${-h * 0.18} ${-h * 0.14} 0 ${-h * 0.12}Z`, dk);
  k.E(g, h * 0.46, h * 0.36, h * 0.64, h * 0.1, dk);
  k.E(g, h * 0.44, h * 0.33, h * 0.6, h * 0.08, color);
  k.P(g, `M${h * 0.02} ${-h * 0.32} L${h * 0.9} ${-h * 0.32} C${h * 0.86} ${h * 0.18} ${h * 0.72} ${h * 0.34} ${h * 0.46} ${h * 0.34} C${h * 0.2} ${h * 0.34} ${h * 0.06} ${h * 0.18} ${h * 0.02} ${-h * 0.32}Z`, color);
  k.P(g, `M${h * 0.5} ${-h * 0.32} L${h * 0.9} ${-h * 0.32} C${h * 0.86} ${h * 0.18} ${h * 0.72} ${h * 0.34} ${h * 0.46} ${h * 0.34}Z`, dk, 0.45);
  k.R(g, h * 0.05, -h * 0.2, h * 0.82, h * 0.06, band, 2);
  k.E(g, h * 0.46, -h * 0.32, h * 0.44, h * 0.09, dk);
  if (full) {
    k.E(g, h * 0.46, -h * 0.31, h * 0.39, h * 0.07, "#b56c38");
    const st1 = k.P(g, "", "#fff6e6", 0.55), st2 = k.P(g, "", "#fff6e6", 0.4);
    g.tick = (t) => {
      const s = t * 2.2 + ph, w1 = Math.sin(s) * h * 0.08, w2 = Math.cos(s * 1.1) * h * 0.08;
      st1.setAttribute("d", `M${h * 0.36} ${-h * 0.4} Q${h * 0.36 + w1} ${-h * 0.62} ${h * 0.38 - w1} ${-h * 0.84} L${h * 0.42 - w1} ${-h * 0.84} Q${h * 0.4 + w1} ${-h * 0.62} ${h * 0.4} ${-h * 0.4}Z`);
      st2.setAttribute("d", `M${h * 0.56} ${-h * 0.42} Q${h * 0.56 + w2} ${-h * 0.6} ${h * 0.54 - w2} ${-h * 0.78} L${h * 0.58 - w2} ${-h * 0.78} Q${h * 0.6 + w2} ${-h * 0.6} ${h * 0.6} ${-h * 0.42}Z`);
    };
    g.tick(0);
  }
  return g;
});
