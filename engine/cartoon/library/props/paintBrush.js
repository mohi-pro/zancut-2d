// A decorator's or artist's paintbrush with wooden handle gripped at (0,0), silver ferrule and wet paint tip.
ZS.define("paintBrush", { about: "a paintbrush with wet colour on its bristles, about 22 cm", kind: "prop", grip: "grip", base: [0, 0.25], tags: ["work", "school", "bangladesh"] }, (layer, o, k) => {
  const { h = 72, seed = 1, color = "#2d7f8c", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const tip = color || k.pick(r, k.CLOTHS);
  k.P(g, `M${-h * 0.05} ${-h * 0.18} L${h * 0.05} ${-h * 0.18} L${h * 0.03} ${h * 0.26} L${-h * 0.03} ${h * 0.26}Z`, "#c48448");
  k.R(g, -h * 0.12, -h * 0.28, h * 0.24, h * 0.12, "#b4bec8", 2);
  k.P(g, `M${-h * 0.13} ${-h * 0.28} L${h * 0.13} ${-h * 0.28} L${h * 0.16} ${-h * 0.64} L${-h * 0.16} ${-h * 0.64}Z`, "#3a322c");
  k.P(g, `M${-h * 0.15} ${-h * 0.48} L${h * 0.15} ${-h * 0.48} L${h * 0.16} ${-h * 0.64} Q0 ${-h * 0.68} ${-h * 0.16} ${-h * 0.64}Z`, tip);
  return g;
});
