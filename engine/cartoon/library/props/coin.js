// A shiny silver Bangladeshi Taka coin with octagonal inner rim, pinched at its bottom edge (0,0).
ZS.define("coin", { about: "a silver Bangladeshi Taka coin, about 3 cm", kind: "prop", grip: "pinch", base: [0, 0.1], tags: ["everyday", "bangladesh"] }, (layer, o, k) => {
  const { h = 38, seed = 1, color = "#c4ccd4", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || (r() > 0.7 ? "#dfae48" : "#c4ccd4");
  const dk = k.dark(c, 0.22), lt = k.light(c, 0.24), cy = -h * 0.42;
  k.C(g, 0, cy, h * 0.46, dk);
  k.C(g, -h * 0.02, cy - h * 0.02, h * 0.44, c);
  k.C(g, -h * 0.02, cy - h * 0.02, h * 0.34, dk);
  k.C(g, -h * 0.02, cy - h * 0.02, h * 0.31, lt);
  k.E(g, -h * 0.02, cy - h * 0.02, h * 0.14, h * 0.18, dk);
  return g;
});
