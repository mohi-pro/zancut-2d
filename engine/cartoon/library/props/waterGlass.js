// A clear or steel drinking glass with cool water; grip (0,0) is around the middle of the glass.
ZS.define("waterGlass", { about: "a drinking glass of water, about 12 cm", kind: "prop", grip: "grip", base: [0, 0.48], tags: ["food", "water", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 72, seed = 1, color = "#d2e6ef", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const wtr = "#6ab8d4", dk = k.dark(color, 0.18);
  k.P(g, `M${-h * 0.32} ${-h * 0.48} L${h * 0.32} ${-h * 0.48} L${h * 0.24} ${h * 0.48} L${-h * 0.24} ${h * 0.48}Z`, color, 0.55);
  if (full) {
    k.P(g, `M${-h * 0.29} ${-h * 0.22} L${h * 0.29} ${-h * 0.22} L${h * 0.22} ${h * 0.43} L${-h * 0.22} ${h * 0.43}Z`, wtr, 0.72);
    k.E(g, 0, -h * 0.22, h * 0.29, h * 0.055, k.light(wtr, 0.22), 0.85);
  }
  k.P(g, `M${-h * 0.24} ${-h * 0.42} L${-h * 0.16} ${-h * 0.42} L${-h * 0.12} ${h * 0.38} L${-h * 0.18} ${h * 0.38}Z`, "#fff6e6", 0.55);
  k.E(g, 0, -h * 0.48, h * 0.32, h * 0.055, k.light(color, 0.2), 0.8);
  k.R(g, -h * 0.24, h * 0.42, h * 0.48, h * 0.06, dk, 2);
  return g;
});
