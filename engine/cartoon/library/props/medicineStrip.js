// A silver foil blister strip of tablets/capsules pinched at the bottom corner (0,0).
ZS.define("medicineStrip", { about: "a foil blister strip of medicine tablets, about 10 cm", kind: "prop", grip: "pinch", base: [0.22, 0.08], tags: ["care", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 58, seed = 1, color = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.68, cx = w * 0.22;
  const pil = color || k.pick(r, ["#d8452f", "#2f6fb0", "#e0a02c", "#fffaf0"]);
  k.R(g, cx - w / 2, -h * 0.92, w, h, "#cfd6dc", 4);
  k.R(g, cx, -h * 0.92, w / 2, h, "#b4bec6", 3);
  for (let row = 0; row < 4; row++) {
    for (const col of [-0.22, 0.22]) {
      const px = cx + w * col, py = -h * (0.78 - row * 0.21);
      k.E(g, px, py, w * 0.14, h * 0.065, pil);
      k.E(g, px - w * 0.03, py - h * 0.015, w * 0.06, h * 0.025, "#fff6e6", 0.7);
    }
  }
  return g;
});
