// A marked school exam sheet with red A+ circle and ruled lines, pinched near the lower edge (0,0).
ZS.define("examPaper", { about: "a marked school exam paper sheet, about 29 cm", kind: "prop", grip: "pinch", base: [0.22, 0.1], tags: ["school", "paper", "bangladesh"] }, (layer, o, k) => {
  const { h = 92, seed = 1, color = "#fffaf0", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.72;
  k.R(g, -w * 0.2, -h * 0.9, w, h, k.dark(color, 0.12), 2);
  k.R(g, -w * 0.24, -h * 0.94, w, h, color, 2);
  k.R(g, -w * 0.14, -h * 0.84, w * 0.48, h * 0.045, "#4a545e", 1);
  k.C(g, w * 0.54, -h * 0.78, h * 0.09, "#d8452f", 0.22);
  k.C(g, w * 0.54, -h * 0.78, h * 0.065, "#d8452f");
  k.C(g, w * 0.54, -h * 0.78, h * 0.045, color);
  for (let i = 0; i < 6; i++) {
    k.R(g, -w * 0.14, -h * (0.66 - i * 0.1), w * (0.52 + r() * 0.26), h * 0.028, "#8b95a0", 1);
  }
  k.P(g, `M${w * 0.34} ${-h * 0.42} L${w * 0.42} ${-h * 0.34} L${w * 0.58} ${-h * 0.52} L${w * 0.55} ${-h * 0.55} L${w * 0.42} ${-h * 0.4} L${w * 0.37} ${-h * 0.45}Z`, "#d8452f");
  return g;
});
