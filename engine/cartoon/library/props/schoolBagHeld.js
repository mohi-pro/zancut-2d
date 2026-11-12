// A student's backpack held by its top loop handle at (0,0), hanging downward with front pocket and straps.
ZS.define("schoolBagHeld", { about: "a school backpack held by its top handle, about 38 cm", kind: "prop", grip: "grip", base: [0, 0.96], tags: ["school", "bangladesh"] }, (layer, o, k) => {
  const { h = 115, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#2f6fb0", "#d8452f", "#2d7f8c", "#7a4fa3"]);
  const dk = k.dark(c, 0.2), lt = k.light(c, 0.16), w = h * 0.74;
  k.P(g, `M${-w * 0.22} ${h * 0.12} C${-w * 0.22} ${-h * 0.06} ${w * 0.22} ${-h * 0.06} ${w * 0.22} ${h * 0.12} L${w * 0.14} ${h * 0.12} C${w * 0.14} ${0} ${-w * 0.14} ${0} ${-w * 0.14} ${h * 0.12}Z`, "#2c282c");
  k.R(g, -w * 0.48, h * 0.1, w * 0.96, h * 0.86, c, h * 0.12);
  k.P(g, `M0 ${h * 0.1} L${w * 0.36} ${h * 0.1} Q${w * 0.48} ${h * 0.1} ${w * 0.48} ${h * 0.22} L${w * 0.48} ${h * 0.84} Q${w * 0.48} ${h * 0.96} ${w * 0.36} ${h * 0.96} L0 ${h * 0.96}Z`, dk, 0.38);
  k.R(g, -w * 0.38, h * 0.48, w * 0.76, h * 0.4, dk, h * 0.06);
  k.R(g, -w * 0.38, h * 0.54, w * 0.76, h * 0.03, "#e0a02c");
  k.E(g, -w * 0.22, h * 0.24, w * 0.16, h * 0.08, lt, 0.6);
  k.R(g, -w * 0.54, h * 0.58, w * 0.08, h * 0.28, "#3e4652", 3);
  k.R(g, w * 0.46, h * 0.58, w * 0.08, h * 0.28, "#3e4652", 3);
  return g;
});
