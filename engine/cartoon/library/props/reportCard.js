// A folded school report card with coloured header band, marks rows and gold seal; pinched at lower middle edge (0,0).
ZS.define("reportCard", { about: "a folded school report card with a coloured band and marks, about 22 cm", kind: "prop", grip: "pinch", base: [0, 0], tags: ["school", "paper", "bangladesh"] }, (layer, o, k) => {
  const { h = 90, color = "#0a92cd", seed = 1, flip } = o;
  const g = k.group(layer, 0, 0, flip), w = h * 0.72, r = k.rngOf(seed);
  k.R(g, -w / 2, -h, w, h, "#fffaf0", h * 0.04);
  k.R(g, -w / 2, -h, w, h * 0.22, color, h * 0.04);
  for (let i = 0; i < 4; i++) k.R(g, -w * 0.36, -h * (0.66 - i * 0.13), w * (0.4 + r() * 0.3), h * 0.04, "#8b95a0");
  k.C(g, w * 0.24, -h * 0.2, h * 0.11, "#e0a02c");
  return g;
});
