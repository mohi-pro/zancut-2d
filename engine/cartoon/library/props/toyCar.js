// A bright colourful toy car held in the hand around its roof/body (0,0) with rolling wheels.
ZS.define("toyCar", { about: "a small colourful toy car, about 14 cm", kind: "prop", grip: "grip", base: [0, 0.32], tags: ["play", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 52, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#d8452f", "#2f6fb0", "#e0a02c", "#5a8f3c"]);
  const dk = k.dark(c, 0.2), w = h * 1.55;
  k.P(g, `M${-w * 0.34} ${-h * 0.04} L${-w * 0.18} ${-h * 0.38} L${w * 0.16} ${-h * 0.38} L${w * 0.32} ${-h * 0.04}Z`, c);
  k.P(g, `M${-w * 0.15} ${-h * 0.32} L${w * 0.13} ${-h * 0.32} L${w * 0.24} ${-h * 0.06} L${-w * 0.26} ${-h * 0.06}Z`, "#98d2ec");
  k.R(g, -w * 0.48, -h * 0.06, w * 0.96, h * 0.28, c, h * 0.08);
  k.R(g, -w * 0.48, h * 0.1, w * 0.96, h * 0.12, dk, h * 0.04);
  k.C(g, w * 0.44, h * 0.04, h * 0.055, "#f4d858");
  for (const wx of [-0.28, 0.28]) {
    k.C(g, w * wx, h * 0.22, h * 0.15, "#242228");
    k.C(g, w * wx, h * 0.22, h * 0.07, "#d8cfbf");
  }
  return g;
});
