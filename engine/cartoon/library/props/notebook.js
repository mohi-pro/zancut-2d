// A spiral or stitched school exercise khata (notebook) with a name label on the cover; pinched at (0,0).
ZS.define("notebook", { about: "a school exercise notebook (khata), about 22 cm", kind: "prop", grip: "pinch", base: [0.25, 0.1], tags: ["school", "work", "paper", "bangladesh"] }, (layer, o, k) => {
  const { h = 82, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.72;
  const c = color || k.pick(r, ["#2f6fb0", "#d8452f", "#5a8f3c", "#e0a02c"]);
  k.R(g, -w * 0.18, -h * 0.88, w, h, "#fffaf0", 3);
  k.R(g, -w * 0.22, -h * 0.9, w, h, c, 4);
  k.R(g, -w * 0.22, -h * 0.9, w * 0.12, h, k.dark(c, 0.24), 2);
  for (let i = 0; i < 6; i++) k.C(g, -w * 0.22, -h * (0.8 - i * 0.14), h * 0.025, "#5a626a");
  k.R(g, w * 0.02, -h * 0.68, w * 0.56, h * 0.24, "#fffaf0", 3);
  k.R(g, w * 0.08, -h * 0.6, w * 0.44, h * 0.03, "#949ea8", 1);
  k.R(g, w * 0.08, -h * 0.52, w * 0.32, h * 0.03, "#949ea8", 1);
  return g;
});
