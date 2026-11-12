// A handheld stage or reporter's microphone with mesh grille and station cube flag, gripped around the handle (0,0).
ZS.define("microphone", { about: "a handheld stage or reporter's microphone, about 22 cm", kind: "prop", grip: "grip", base: [0, 0.36], tags: ["work", "city", "school", "bangladesh"] }, (layer, o, k) => {
  const { h = 72, seed = 1, color = "#2d7f8c", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const badge = color || k.pick(r, ["#2d7f8c", "#d8452f", "#e0a02c"]);
  k.P(g, `M${-h * 0.065} ${-h * 0.28} L${h * 0.065} ${-h * 0.28} L${h * 0.045} ${h * 0.36} L${-h * 0.045} ${h * 0.36}Z`, "#2a2e34");
  k.R(g, -h * 0.14, -h * 0.26, h * 0.28, h * 0.18, badge, 3);
  k.R(g, -h * 0.09, -h * 0.2, h * 0.18, h * 0.06, "#fffaf0", 1);
  k.C(g, 0, -h * 0.44, h * 0.16, "#9aa4ae");
  k.C(g, -h * 0.04, -h * 0.48, h * 0.07, "#cfd8e0", 0.65);
  k.R(g, -h * 0.16, -h * 0.46, h * 0.32, h * 0.035, "#68727c", 1);
  return g;
});
