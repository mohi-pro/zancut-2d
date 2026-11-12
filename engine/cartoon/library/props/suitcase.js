// A travel suitcase held by its top handle at (0,0) with corner guards, straps and latches.
ZS.define("suitcase", { about: "a travel suitcase held by its top handle, about 52 cm", kind: "prop", grip: "grip", base: [0, 0.82], tags: ["everyday", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 105, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#6e4832", "#2f5678", "#3e5848", "#8c3832"]);
  const dk = k.dark(c, 0.22), lt = k.light(c, 0.16), w = h * 1.18;
  k.P(g, `M${-w * 0.18} ${h * 0.12} L${-w * 0.18} ${-h * 0.03} L${w * 0.18} ${-h * 0.03} L${w * 0.18} ${h * 0.12} L${w * 0.12} ${h * 0.12} L${w * 0.12} ${h * 0.03} L${-w * 0.12} ${h * 0.03} L${-w * 0.12} ${h * 0.12}Z`, "#282424");
  k.R(g, -w / 2, h * 0.1, w, h * 0.72, c, h * 0.07);
  k.R(g, 0, h * 0.1, w / 2, h * 0.72, dk, h * 0.05);
  k.R(g, -w * 0.34, h * 0.1, w * 0.07, h * 0.72, "#4a3020");
  k.R(g, w * 0.27, h * 0.1, w * 0.07, h * 0.72, "#4a3020");
  k.R(g, -w * 0.24, h * 0.08, w * 0.08, h * 0.06, "#e0b448", 1);
  k.R(g, w * 0.16, h * 0.08, w * 0.08, h * 0.06, "#e0b448", 1);
  k.R(g, -w * 0.42, h * 0.18, w * 0.18, h * 0.12, lt, 2);
  return g;
});
