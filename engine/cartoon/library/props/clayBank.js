// A traditional Bangladeshi terracotta coin-saving pot (matir bank) with coin slot and floral motif, held with two hands.
ZS.define("clayBank", { about: "a terracotta coin-saving pot (matir bank), about 18 cm", kind: "prop", grip: "two", grip2: [32, 0], base: [0.18, 0.38], tags: ["everyday", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 68, seed = 1, color = "#c86438", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.18), cx = h * 0.18;
  k.E(g, cx, h * 0.34, h * 0.24, h * 0.06, dk);
  k.C(g, cx, 0, h * 0.36, color);
  k.P(g, `M${cx} ${-h * 0.36} A${h * 0.36} ${h * 0.36} 0 0 1 ${cx} ${h * 0.36}Z`, dk, 0.42);
  k.C(g, cx, -h * 0.38, h * 0.08, color);
  k.R(g, cx - h * 0.14, -h * 0.24, h * 0.28, h * 0.04, "#241814", 2);
  k.C(g, cx - h * 0.08, h * 0.04, h * 0.09, "#f4efe6");
  k.C(g, cx - h * 0.08, h * 0.04, h * 0.045, "#e8b428");
  return g;
});
