// A bouquet of marigolds and roses wrapped in paper Cone with a ribbon, gripped at the stem wrap (0,0).
ZS.define("flowerBouquet", { about: "a wrapped bouquet of fresh flowers, about 32 cm", kind: "prop", grip: "grip", base: [0, 0.32], tags: ["everyday", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 92, seed = 1, color = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  k.P(g, `M${-h * 0.08} ${h * 0.08} L${-h * 0.14} ${h * 0.32} L${h * 0.14} ${h * 0.32} L${h * 0.08} ${h * 0.08}Z`, "#4a8638");
  k.P(g, `M${-h * 0.38} ${-h * 0.44} L${h * 0.38} ${-h * 0.44} L${h * 0.1} ${h * 0.14} L${-h * 0.1} ${h * 0.14}Z`, "#f0e4ce");
  k.P(g, `M0 ${-h * 0.44} L${h * 0.38} ${-h * 0.44} L${h * 0.1} ${h * 0.14} L0 ${h * 0.14}Z`, "#dfd0b4");
  for (const [lx, ly] of [[-0.26, -0.5], [0.26, -0.5], [0, -0.62]]) k.E(g, h * lx, h * ly, h * 0.16, h * 0.09, "#4a8c3c");
  for (const [fx, fy, fc] of [[-0.18, -0.52, "#e89e28"], [0.18, -0.52, "#f0c238"], [0, -0.64, color], [-0.06, -0.44, color], [0.08, -0.44, "#e86478"]]) {
    k.C(g, h * fx, h * fy, h * 0.11, fc);
    k.C(g, h * fx, h * fy, h * 0.05, k.light(fc, 0.25));
  }
  k.R(g, -h * 0.12, -h * 0.04, h * 0.24, h * 0.07, color, 2);
  return g;
});
