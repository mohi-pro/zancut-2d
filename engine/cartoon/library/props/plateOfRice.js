// A steel plate of steamed white rice, yellow dal and spicy curry resting on a flat palm at (0,0).
ZS.define("plateOfRice", { about: "a steel plate with rice, dal and curry, about 26 cm across", kind: "prop", grip: "flat", base: [0, 0], tags: ["food", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 65, seed = 1, color = "#c4ccd4", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 1.9;
  const dk = k.dark(color, 0.2), lt = k.light(color, 0.22);
  k.E(g, 0, -h * 0.14, w * 0.52, h * 0.16, dk);
  k.E(g, 0, -h * 0.2, w * 0.56, h * 0.18, color);
  k.E(g, 0, -h * 0.22, w * 0.48, h * 0.14, lt);
  if (full) {
    k.P(g, `M${-w * 0.42} ${-h * 0.22} C${-w * 0.38} ${-h * 0.78} ${w * 0.08} ${-h * 0.78} ${w * 0.14} ${-h * 0.22}Z`, "#faf6ee");
    k.P(g, `M${-w * 0.1} ${-h * 0.68} C${w * 0.04} ${-h * 0.66} ${w * 0.12} ${-h * 0.42} ${w * 0.14} ${-h * 0.22} L${-w * 0.1} ${-h * 0.22}Z`, "#e8e0d2");
    k.E(g, w * 0.22, -h * 0.26, w * 0.16, h * 0.09, "#e6b432");
    k.E(g, w * 0.08, -h * 0.18, w * 0.15, h * 0.08, "#b84428");
    k.C(g, w * 0.06, -h * 0.21, h * 0.06, "#8c321e");
    k.C(g, w * 0.13, -h * 0.19, h * 0.05, "#d88a32");
    k.P(g, `M${-w * 0.22} ${-h * 0.56} L${-w * 0.06} ${-h * 0.64} L${-w * 0.08} ${-h * 0.58}Z`, "#3f8c3a");
  }
  return g;
});
