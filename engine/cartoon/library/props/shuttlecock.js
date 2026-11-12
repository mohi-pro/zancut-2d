// A white feathered badminton shuttlecock (cork and skirt) pinched at the cork base (0,0).
ZS.define("shuttlecock", { about: "a white feathered badminton shuttlecock, about 9 cm", kind: "prop", grip: "pinch", base: [0, 0.14], tags: ["sport", "play", "bangladesh"] }, (layer, o, k) => {
  const { h = 46, seed = 1, color = "#faf6ee", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.16);
  k.P(g, `M${-h * 0.16} ${-h * 0.14} L${-h * 0.44} ${-h * 0.82} L${h * 0.44} ${-h * 0.82} L${h * 0.16} ${-h * 0.14}Z`, color);
  for (const fx of [-0.28, -0.1, 0.1, 0.28]) {
    k.P(g, `M${h * fx * 0.4} ${-h * 0.16} L${h * fx} ${-h * 0.82} L${h * (fx + 0.05)} ${-h * 0.82} L${h * (fx * 0.4 + 0.03)} ${-h * 0.16}Z`, dk);
  }
  k.R(g, -h * 0.18, -h * 0.2, h * 0.36, h * 0.06, "#d8452f", 1);
  k.C(g, 0, -h * 0.04, h * 0.17, color);
  return g;
});
