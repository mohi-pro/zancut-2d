// A triangular bamboo-framed village hand fishing net (thela jaal / jhaki jaal) gripped at the pole junction (0,0).
ZS.define("fishingNetHeld", { about: "a bamboo-framed fishing net (jaal), about 110 cm", kind: "prop", grip: "grip", base: [0, 0.85], tags: ["work", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 135, seed = 1, color = "#6e8894", flip } = o;
  const g = k.group(layer, 0, 0, flip), bmb = "#9c7442";
  k.P(g, `M0 ${h * 0.08} L${-h * 0.36} ${h * 0.82} Q0 ${h * 0.94} ${h * 0.36} ${h * 0.82}Z`, color, 0.48);
  for (const y0 of [0.32, 0.5, 0.68]) {
    const hw = h * y0 * 0.42;
    k.R(g, -hw, h * y0, hw * 2, h * 0.012, "#d8e4ec", 1);
  }
  k.P(g, `M${-h * 0.02} ${-h * 0.14} L${h * 0.02} ${-h * 0.14} L${-h * 0.36} ${h * 0.84} L${-h * 0.39} ${h * 0.82}Z`, bmb);
  k.P(g, `M${-h * 0.02} ${-h * 0.14} L${h * 0.02} ${-h * 0.14} L${h * 0.39} ${h * 0.82} L${h * 0.36} ${h * 0.84}Z`, k.dark(bmb, 0.16));
  k.R(g, -h * 0.035, -h * 0.04, h * 0.07, h * 0.09, "#d8452f", 2);
  return g;
});
