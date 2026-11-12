// A gold medal hanging from a V-ribbon; pinched at the top of the ribbon (0,0) with gentle sway.
ZS.define("medal", { about: "a gold medal hanging on a ribbon, about 14 cm", kind: "prop", grip: "pinch", base: [0, 0.88], tags: ["school", "sport", "bangladesh"] }, (layer, o, k) => {
  const { h = 74, seed = 1, color = "#e8b428", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const mG = k.el("g", {}, g);
  k.P(mG, `M${-h * 0.18} 0 L${-h * 0.06} 0 L${h * 0.03} ${h * 0.54} L${-h * 0.05} ${h * 0.54}Z`, color2);
  k.P(mG, `M${h * 0.06} 0 L${h * 0.18} 0 L${h * 0.05} ${h * 0.54} L${-h * 0.03} ${h * 0.54}Z`, k.dark(color2, 0.18));
  k.C(mG, 0, h * 0.68, h * 0.2, color);
  k.C(mG, 0, h * 0.68, h * 0.15, k.dark(color, 0.16));
  k.C(mG, -h * 0.04, h * 0.64, h * 0.11, k.light(color, 0.22), 0.7);
  g.tick = (t) => {
    mG.setAttribute("transform", `rotate(${Math.sin(t * 2.5 + ph) * 4} 0 0)`);
  };
  g.tick(0);
  return g;
});
