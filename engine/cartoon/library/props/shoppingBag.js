// A Bangladeshi bazar shopping bag (jute chot bag or striped polythene) held by its top handles at (0,0).
ZS.define("shoppingBag", { about: "a jute or polythene bazar shopping bag, about 38 cm", kind: "prop", grip: "grip", base: [0, 0.94], tags: ["everyday", "food", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 105, seed = 1, color, full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#c89e68", "#d8b480", "#2d7f8c", "#d8452f"]);
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.16), w = h * 0.72;
  k.P(g, `M${-w * 0.24} ${h * 0.22} C${-w * 0.24} ${-h * 0.06} ${w * 0.24} ${-h * 0.06} ${w * 0.24} ${h * 0.22} L${w * 0.15} ${h * 0.22} C${w * 0.15} ${h * 0.02} ${-w * 0.15} ${h * 0.02} ${-w * 0.15} ${h * 0.22}Z`, dk);
  if (full) {
    k.E(g, -w * 0.18, h * 0.18, w * 0.18, h * 0.1, "#4e8c3a");
    k.E(g, w * 0.14, h * 0.2, w * 0.16, h * 0.09, "#d8452f");
    k.P(g, `M${-w * 0.04} ${h * 0.22} L${w * 0.08} ${h * 0.04} L${w * 0.18} ${h * 0.22}Z`, "#5a9c42");
  }
  k.P(g, `M${-w * 0.44} ${h * 0.2} L${w * 0.44} ${h * 0.2} L${w * 0.5} ${h * 0.94} L${-w * 0.5} ${h * 0.94}Z`, c);
  k.P(g, `M0 ${h * 0.2} L${w * 0.44} ${h * 0.2} L${w * 0.5} ${h * 0.94} L0 ${h * 0.94}Z`, dk, 0.35);
  k.R(g, -w * 0.46, h * 0.42, w * 0.92, h * 0.05, "#d8452f");
  k.R(g, -w * 0.47, h * 0.52, w * 0.94, h * 0.04, "#5a8f3c");
  return g;
});
