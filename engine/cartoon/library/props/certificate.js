// A framed or bordered award certificate with gold seal and ribbon, held with both hands (or pinched at 0,0).
ZS.define("certificate", { about: "an award certificate with a gold seal and ribbon, about 30 cm", kind: "prop", grip: "two", grip2: [48, 0], base: [0.3, 0.1], tags: ["school", "work", "paper", "bangladesh"] }, (layer, o, k) => {
  const { h = 82, seed = 1, color = "#e0a02c", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 1.32, cx = w * 0.22;
  k.R(g, cx - w / 2, -h * 0.9, w, h, color, 4);
  k.R(g, cx - w * 0.44, -h * 0.82, w * 0.88, h * 0.84, "#fffaf0", 2);
  k.R(g, cx - w * 0.26, -h * 0.68, w * 0.52, h * 0.07, k.dark(color, 0.2), 2);
  for (let i = 0; i < 3; i++) k.R(g, cx - w * 0.32, -h * (0.5 - i * 0.11), w * (0.5 + r() * 0.14), h * 0.035, "#8b95a0", 1);
  k.P(g, `M${cx + w * 0.22} ${-h * 0.2} L${cx + w * 0.17} ${-h * 0.02} L${cx + w * 0.24} ${-h * 0.06} L${cx + w * 0.29} ${-h * 0.02} L${cx + w * 0.26} ${-h * 0.2}Z`, "#d8452f");
  k.C(g, cx + w * 0.23, -h * 0.22, h * 0.095, color);
  k.C(g, cx + w * 0.23, -h * 0.22, h * 0.06, k.light(color, 0.22));
  return g;
});
