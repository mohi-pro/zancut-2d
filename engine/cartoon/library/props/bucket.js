// A plastic or galvanised steel water bucket (balti) held by its arched wire bail handle at (0,0).
ZS.define("bucket", { about: "a household water bucket held by its handle, about 32 cm", kind: "prop", grip: "grip", base: [0, 0.94], tags: ["work", "water", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 100, seed = 1, color, full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#2f6fb0", "#d8452f", "#5a8f3c", "#98a2ac"]);
  const dk = k.dark(c, 0.2), lt = k.light(c, 0.18), w = h * 0.76;
  k.R(g, -w * 0.14, -h * 0.04, w * 0.28, h * 0.07, "#282428", 3);
  k.P(g, `M${-w * 0.46} ${h * 0.28} C${-w * 0.46} ${-h * 0.04} ${w * 0.46} ${-h * 0.04} ${w * 0.46} ${h * 0.28} L${w * 0.42} ${h * 0.28} C${w * 0.42} ${h * 0.02} ${-w * 0.42} ${h * 0.02} ${-w * 0.42} ${h * 0.28}Z`, "#7a848e");
  k.P(g, `M${-w * 0.46} ${h * 0.28} L${w * 0.46} ${h * 0.28} L${w * 0.34} ${h * 0.94} L${-w * 0.34} ${h * 0.94}Z`, c);
  k.P(g, `M0 ${h * 0.28} L${w * 0.46} ${h * 0.28} L${w * 0.34} ${h * 0.94} L0 ${h * 0.94}Z`, dk, 0.4);
  k.E(g, 0, h * 0.28, w * 0.48, h * 0.08, dk);
  if (full) k.E(g, 0, h * 0.29, w * 0.42, h * 0.06, "#5eb4d4");
  k.R(g, -w * 0.48, h * 0.26, w * 0.96, h * 0.06, lt, 3);
  return g;
});
