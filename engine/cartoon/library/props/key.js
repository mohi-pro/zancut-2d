// A brass padlock key on a metal ring, pinched at the bow/ring (0,0) and hanging down.
ZS.define("key", { about: "a brass key on a ring, about 7 cm", kind: "prop", grip: "pinch", base: [0, 0.85], tags: ["everyday", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 54, seed = 1, color = "#d8a438", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.2);
  k.C(g, 0, -h * 0.06, h * 0.16, "#8c949c");
  k.C(g, 0, -h * 0.06, h * 0.1, "#f4efe6");
  k.C(g, 0, h * 0.18, h * 0.18, color);
  k.C(g, -h * 0.03, h * 0.15, h * 0.14, lt, 0.5);
  k.C(g, 0, h * 0.18, h * 0.07, "#f4efe6");
  k.R(g, -h * 0.045, h * 0.32, h * 0.09, h * 0.54, color, 2);
  k.R(g, 0, h * 0.32, h * 0.045, h * 0.54, dk, 1);
  k.R(g, h * 0.04, h * 0.62, h * 0.12, h * 0.07, dk, 1);
  k.R(g, h * 0.04, h * 0.74, h * 0.15, h * 0.08, dk, 1);
  return g;
});
