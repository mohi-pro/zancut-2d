// A carpenter's claw hammer with wooden shaft gripped at (0,0) and forged steel head above.
ZS.define("hammer", { about: "a carpenter's claw hammer with a wooden handle, about 32 cm", kind: "prop", grip: "grip", base: [0, 0.24], tags: ["work", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 84, seed = 1, color = "#9c6838", flip } = o;
  const g = k.group(layer, 0, 0, flip), st = "#58626c", lt = "#949ea8";
  k.R(g, -h * 0.045, -h * 0.68, h * 0.09, h * 0.92, color, 3);
  k.R(g, 0, -h * 0.68, h * 0.045, h * 0.92, k.dark(color, 0.2), 1);
  k.P(g, `M${-h * 0.34} ${-h * 0.58} Q${-h * 0.18} ${-h * 0.74} ${h * 0.18} ${-h * 0.74} L${h * 0.18} ${-h * 0.58} Q${-h * 0.14} ${-h * 0.6} ${-h * 0.32} ${-h * 0.5}Z`, st);
  k.R(g, h * 0.16, -h * 0.77, h * 0.12, h * 0.22, st, 2);
  k.R(g, h * 0.24, -h * 0.77, h * 0.04, h * 0.22, lt, 1);
  return g;
});
