// A traditional Bangladeshi terracotta or brass/steel water pot (kolshi) carried with two hands or on the hip.
ZS.define("kolshi", { about: "a Bangladeshi terracotta or metal water pot (kolshi), about 34 cm", kind: "prop", grip: "two", grip2: [36, 18], base: [0.18, 0.56], tags: ["water", "village", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 105, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#b8623e", "#c87a48", "#c8b478", "#bcc4cc"]);
  const dk = k.dark(c, 0.22), lt = k.light(c, 0.18), cx = h * 0.18;
  k.E(g, cx, h * 0.18, h * 0.42, h * 0.38, c);
  k.P(g, `M${cx} ${-h * 0.2} A${h * 0.42} ${h * 0.38} 0 0 1 ${cx} ${h * 0.56}Z`, dk, 0.55);
  k.E(g, cx - h * 0.14, h * 0.06, h * 0.12, h * 0.2, lt, 0.55);
  k.P(g, `M${cx - h * 0.16} ${-h * 0.16} L${cx - h * 0.12} ${-h * 0.36} L${cx + h * 0.12} ${-h * 0.36} L${cx + h * 0.16} ${-h * 0.16}Z`, c);
  k.E(g, cx, -h * 0.38, h * 0.19, h * 0.055, dk);
  k.E(g, cx, -h * 0.4, h * 0.18, h * 0.045, lt);
  k.E(g, cx, -h * 0.4, h * 0.12, h * 0.028, k.dark(c, 0.38));
  k.R(g, cx - h * 0.38, h * 0.08, h * 0.76, h * 0.035, dk, 2);
  return g;
});
