// A handful of glossy glass marbles (guli) with colourful inner swirls resting on an open palm at (0,0).
ZS.define("marbles", { about: "a handful of colourful glass marbles (guli), each about 2 cm", kind: "prop", grip: "flat", base: [0, 0], tags: ["play", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 38, seed = 1, color = "#2d7f8c", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const cols = [color, "#5a8f3c", "#d8452f", "#e0a02c", "#2f6fb0"];
  const pos = [[-0.36, -0.18, 0.2], [0.02, -0.22, 0.22], [0.38, -0.16, 0.19], [-0.16, -0.34, 0.18], [0.2, -0.36, 0.18]];
  for (let i = 0; i < pos.length; i++) {
    const [mx, my, mr] = pos[i], mc = cols[i % cols.length];
    k.C(g, h * mx, h * my, h * mr, "#d8eef5", 0.78);
    k.E(g, h * mx, h * my, h * mr * 0.75, h * mr * 0.35, mc);
    k.C(g, h * (mx - mr * 0.3), h * (my - mr * 0.3), h * mr * 0.28, "#fff6e6", 0.85);
  }
  return g;
});
