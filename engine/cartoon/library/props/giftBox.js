// A wrapped gift box with contrasting ribbon and top bow, held with both hands around (0,0).
ZS.define("giftBox", { about: "a wrapped gift box with a ribbon bow, about 24 cm", kind: "prop", grip: "two", grip2: [42, 0], base: [0.22, 0.36], tags: ["everyday", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 82, seed = 1, color, color2 = "#e8b428", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#d8452f", "#2d7f8c", "#7a4fa3", "#2f6fb0"]);
  const dk = k.dark(c, 0.2), w = h * 0.92, cx = w * 0.24;
  k.R(g, cx - w * 0.46, -h * 0.36, w * 0.92, h * 0.72, c, 4);
  k.R(g, cx, -h * 0.36, w * 0.46, h * 0.72, dk, 3);
  k.R(g, cx - w * 0.5, -h * 0.46, w, h * 0.16, k.light(c, 0.14), 4);
  k.R(g, cx - w * 0.08, -h * 0.46, w * 0.16, h * 0.82, color2);
  k.R(g, cx - w * 0.46, -h * 0.06, w * 0.92, h * 0.12, color2);
  k.E(g, cx - w * 0.16, -h * 0.54, w * 0.16, h * 0.09, color2);
  k.E(g, cx + w * 0.16, -h * 0.54, w * 0.16, h * 0.09, k.dark(color2, 0.16));
  k.C(g, cx, -h * 0.5, h * 0.06, k.light(color2, 0.2));
  return g;
});
