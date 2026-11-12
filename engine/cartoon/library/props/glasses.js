// A pair of reading or prescription eyeglasses held by a temple arm at (0,0), not worn.
ZS.define("glasses", { about: "a pair of eyeglasses held in the hand, about 14 cm wide", kind: "prop", grip: "pinch", base: [0.42, 0.16], tags: ["everyday", "work", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 48, seed = 1, color = "#2c2420", flip } = o;
  const g = k.group(layer, 0, 0, flip), w = h * 1.9, cx = w * 0.36;
  k.P(g, `M0 0 L${cx - w * 0.44} ${-h * 0.26} L${cx - w * 0.44} ${-h * 0.18} L0 ${h * 0.06}Z`, color);
  k.P(g, `M${cx + w * 0.44} ${-h * 0.26} L${cx + w * 0.12} ${-h * 0.54} L${cx + w * 0.12} ${-h * 0.46} L${cx + w * 0.44} ${-h * 0.18}Z`, k.dark(color, 0.2));
  k.R(g, cx - w * 0.46, -h * 0.3, w * 0.38, h * 0.44, color, h * 0.08);
  k.R(g, cx + w * 0.08, -h * 0.3, w * 0.38, h * 0.44, color, h * 0.08);
  k.R(g, cx - w * 0.1, -h * 0.22, w * 0.2, h * 0.07, color, 2);
  k.R(g, cx - w * 0.41, -h * 0.24, w * 0.28, h * 0.32, "#cfe8f4", h * 0.05);
  k.R(g, cx + w * 0.13, -h * 0.24, w * 0.28, h * 0.32, "#cfe8f4", h * 0.05);
  return g;
});
