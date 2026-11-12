// A wooden Bangladeshi country-boat paddle (noukar boitha) gripped on the shaft at (0,0) with wide leaf blade below.
ZS.define("boatOar", { about: "a wooden country-boat paddle (boitha), about 135 cm", kind: "prop", grip: "grip", base: [0, 0.88], tags: ["work", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 155, seed = 1, color = "#8c5832", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.16);
  k.R(g, -h * 0.07, -h * 0.28, h * 0.14, h * 0.04, dk, 2);
  k.R(g, -h * 0.024, -h * 0.26, h * 0.048, h * 0.68, color, 2);
  k.P(g, `M${-h * 0.024} ${h * 0.38} L${h * 0.024} ${h * 0.38} L${h * 0.14} ${h * 0.56} L${h * 0.11} ${h * 0.88} L${-h * 0.11} ${h * 0.88} L${-h * 0.14} ${h * 0.56}Z`, color);
  k.P(g, `M0 ${h * 0.38} L${h * 0.024} ${h * 0.38} L${h * 0.14} ${h * 0.56} L${h * 0.11} ${h * 0.88} L0 ${h * 0.88}Z`, dk, 0.45);
  k.R(g, -h * 0.08, h * 0.52, h * 0.03, h * 0.3, lt, 1);
  return g;
});
