// A student or office ID card badge with lanyard and photo portrait; pinched at the card edge or lanyard (0,0).
ZS.define("idCard", { about: "an ID card badge with a neck lanyard, about 10 cm", kind: "prop", grip: "pinch", base: [0, 0.45], tags: ["school", "work", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 66, seed = 1, color = "#2f6fb0", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.68;
  const c = color || k.pick(r, k.CLOTHS);
  k.P(g, `M0 ${-h * 0.56} L${-w * 0.28} ${-h * 0.95} L${-w * 0.18} ${-h * 0.95} L0 ${-h * 0.62} L${w * 0.18} ${-h * 0.95} L${w * 0.28} ${-h * 0.95}Z`, c);
  k.R(g, -w * 0.08, -h * 0.6, w * 0.16, h * 0.08, "#949ea8", 2);
  k.R(g, -w / 2, -h * 0.54, w, h * 0.96, "#fffaf0", 4);
  k.R(g, -w / 2, -h * 0.54, w, h * 0.18, c, 3);
  k.R(g, -w * 0.26, -h * 0.28, w * 0.52, h * 0.34, "#d8e6f0", 2);
  k.C(g, 0, -h * 0.16, h * 0.08, "#c88e68");
  k.P(g, `M${-w * 0.2} ${h * 0.06} Q0 ${-h * 0.08} ${w * 0.2} ${h * 0.06}Z`, c);
  k.R(g, -w * 0.32, h * 0.14, w * 0.64, h * 0.05, "#6e7882", 1);
  k.R(g, -w * 0.22, h * 0.24, w * 0.44, h * 0.04, "#9ca4ac", 1);
  return g;
});
