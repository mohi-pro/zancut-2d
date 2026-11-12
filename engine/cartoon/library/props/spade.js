// A digging spade / shovel (belcha) with D-grip handle at (0,0) and pointed steel blade at the bottom.
ZS.define("spade", { about: "a digging spade (belcha) with a steel blade, about 95 cm", kind: "prop", grip: "grip", base: [0, 0.92], tags: ["work", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { h = 140, seed = 1, color = "#8c5e34", flip } = o;
  const g = k.group(layer, 0, 0, flip), st = "#606a74", lt = "#9aa4ae";
  k.P(g, `M${-h * 0.09} ${-h * 0.1} L${h * 0.09} ${-h * 0.1} L${h * 0.06} ${h * 0.06} L${-h * 0.06} ${h * 0.06}Z`, color);
  k.R(g, -h * 0.05, -h * 0.06, h * 0.1, h * 0.08, "#f4efe6", 1);
  k.R(g, -h * 0.025, h * 0.04, h * 0.05, h * 0.58, color, 2);
  k.P(g, `M${-h * 0.16} ${h * 0.58} L${h * 0.16} ${h * 0.58} L${h * 0.14} ${h * 0.8} L0 ${h * 0.92} L${-h * 0.14} ${h * 0.8}Z`, st);
  k.P(g, `M0 ${h * 0.58} L${h * 0.16} ${h * 0.58} L${h * 0.14} ${h * 0.8} L0 ${h * 0.92}Z`, k.dark(st, 0.2));
  k.R(g, -h * 0.12, h * 0.6, h * 0.04, h * 0.18, lt, 1);
  return g;
});
