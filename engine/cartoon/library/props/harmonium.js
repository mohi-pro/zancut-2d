// A traditional wooden Indian/Bangladeshi harmonium with bellows, brass stops and black-and-white keys; held with both hands.
ZS.define("harmonium", { about: "a wooden Bangladeshi harmonium with keys and bellows, about 55 cm wide", kind: "prop", grip: "two", grip2: [58, 0], base: [0.28, 0.32], tags: ["music", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 78, seed = 1, color = "#8c4e28", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.24), lt = k.light(color, 0.16), w = h * 1.48, cx = w * 0.26;
  k.P(g, `M${cx - w * 0.42} ${-h * 0.32} L${cx + w * 0.36} ${-h * 0.44} L${cx + w * 0.42} ${-h * 0.16} L${cx - w * 0.42} ${-h * 0.16}Z`, "#e8dec8");
  k.R(g, cx - w * 0.48, -h * 0.2, w * 0.96, h * 0.52, color, 4);
  k.R(g, cx, -h * 0.2, w * 0.48, h * 0.52, dk, 3);
  k.R(g, cx - w * 0.42, -h * 0.18, w * 0.84, h * 0.12, "#faf6ee", 2);
  for (let i = -5; i <= 5; i++) {
    if (i % 3 !== 0) k.R(g, cx + i * w * 0.065, -h * 0.18, w * 0.035, h * 0.07, "#1e1a1c", 1);
  }
  for (let s = -2; s <= 2; s++) k.C(g, cx + s * w * 0.14, h * 0.1, h * 0.035, "#e0b448");
  k.R(g, cx - w * 0.5, h * 0.26, w, h * 0.07, dk, 2);
  return g;
});
