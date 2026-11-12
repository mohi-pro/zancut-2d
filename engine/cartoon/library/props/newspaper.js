// A folded morning newspaper (kagoj) with masthead banner, photo box and columns; held at side edge (0,0).
ZS.define("newspaper", { about: "a folded newspaper with headline and columns, about 32 cm", kind: "prop", grip: "pinch", base: [0.3, 0.1], tags: ["everyday", "paper", "tea", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 86, seed = 1, color = "#efeae0", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.88, cx = w * 0.28;
  k.R(g, cx - w * 0.46, -h * 0.86, w * 0.96, h * 0.94, k.dark(color, 0.14), 3);
  k.R(g, cx - w * 0.5, -h * 0.9, w * 0.96, h * 0.94, color, 3);
  k.R(g, cx - w * 0.42, -h * 0.82, w * 0.8, h * 0.11, "#d8452f", 2);
  k.R(g, cx - w * 0.42, -h * 0.66, w * 0.8, h * 0.06, "#2c2828", 1);
  k.R(g, cx - w * 0.42, -h * 0.54, w * 0.38, h * 0.28, "#7a8c98", 2);
  for (let i = 0; i < 6; i++) {
    k.R(g, cx + w * 0.02, -h * (0.54 - i * 0.07), w * 0.36, h * 0.035, "#8b95a0", 1);
  }
  for (let i = 0; i < 3; i++) {
    k.R(g, cx - w * 0.42, -h * (0.2 - i * 0.07), w * 0.38, h * 0.035, "#8b95a0", 1);
  }
  return g;
});
