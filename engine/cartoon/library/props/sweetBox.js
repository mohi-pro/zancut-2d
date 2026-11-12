// A traditional Bangladeshi sweetshop box (mishtir packet) tied with red cotton twine, held on the palm or by string.
ZS.define("sweetBox", { about: "a Bangladeshi sweetshop box (mishtir packet) tied with string, about 24 cm", kind: "prop", grip: "flat", base: [0, 0], tags: ["food", "everyday", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 62, seed = 1, color = "#f4ebd8", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.16), w = h * 1.45;
  k.R(g, -w / 2, -h * 0.56, w, h * 0.56, color, 4);
  k.R(g, 0, -h * 0.56, w / 2, h * 0.56, dk, 3);
  k.R(g, -w * 0.52, -h * 0.62, w * 1.04, h * 0.14, k.light(color, 0.1), 3);
  k.R(g, -w * 0.3, -h * 0.42, w * 0.6, h * 0.24, color2, 3);
  k.R(g, -w * 0.2, -h * 0.34, w * 0.4, h * 0.08, "#f0c84b", 2);
  k.R(g, -w * 0.02, -h * 0.62, w * 0.04, h * 0.62, color2);
  k.E(g, -w * 0.08, -h * 0.66, w * 0.08, h * 0.05, color2);
  k.E(g, w * 0.08, -h * 0.66, w * 0.08, h * 0.05, color2);
  return g;
});
