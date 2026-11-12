// A warm handmade Bangladeshi flatbread (ruti / porota) with toasted brown spots, pinched at the edge (0,0).
ZS.define("breadOrRuti", { about: "a handmade Bangladeshi ruti flatbread or loaf, about 18 cm", kind: "prop", grip: "pinch", base: [0, 0.1], tags: ["food", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 58, seed = 1, color = "#eadbc2", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const dk = k.dark(color, 0.18), spot = "#9c683c";
  k.E(g, h * 0.14, -h * 0.26, h * 0.56, h * 0.32, dk);
  k.E(g, h * 0.12, -h * 0.3, h * 0.55, h * 0.3, color);
  for (let i = 0; i < 6; i++) {
    const sx = h * (-0.18 + r() * 0.6), sy = -h * (0.14 + r() * 0.32);
    k.E(g, sx, sy, h * (0.04 + r() * 0.04), h * 0.025, spot, 0.75);
  }
  return g;
});
