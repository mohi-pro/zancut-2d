// A digital/SLR camera held with two hands at (0,0) with prominent lens barrel and top flash housing.
ZS.define("camera", { about: "a handheld camera with a lens barrel, about 15 cm", kind: "prop", grip: "two", grip2: [32, 0], base: [0.18, 0.28], tags: ["work", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 58, seed = 1, color = "#282c34", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), w = h * 1.32, cx = w * 0.18;
  k.P(g, `M${cx - w * 0.2} ${-h * 0.26} L${cx - w * 0.12} ${-h * 0.42} L${cx + w * 0.16} ${-h * 0.42} L${cx + w * 0.24} ${-h * 0.26}Z`, color);
  k.R(g, cx - w * 0.36, -h * 0.34, w * 0.12, h * 0.08, "#d8452f", 1);
  k.R(g, cx - w * 0.46, -h * 0.28, w * 0.92, h * 0.56, color, 5);
  k.R(g, cx - w * 0.46, -h * 0.28, w * 0.2, h * 0.56, dk, 4);
  k.C(g, cx + w * 0.06, 0, h * 0.26, "#8c96a0");
  k.C(g, cx + w * 0.06, 0, h * 0.21, "#181c22");
  k.C(g, cx + w * 0.06, 0, h * 0.14, "#2d6a8c");
  k.C(g, cx + w * 0.01, -h * 0.05, h * 0.045, "#a8e0f8", 0.8);
  return g;
});
