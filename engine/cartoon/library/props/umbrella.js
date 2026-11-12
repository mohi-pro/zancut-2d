// The classic big black Bangladeshi umbrella (chata), open or closed, gripped at the lower shaft above the J-handle (0,0).
ZS.define("umbrella", { about: "a large black Bangladeshi umbrella, open or closed, about 85 cm", kind: "prop", grip: "grip", base: [0, 0.22], tags: ["everyday", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 155, seed = 1, color = "#242228", open = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.2), lt = k.light(color, 0.18), wd = "#7a5232";
  k.P(g, `M${-h * 0.02} 0 L${-h * 0.02} ${h * 0.14} C${-h * 0.02} ${h * 0.24} ${-h * 0.16} ${h * 0.24} ${-h * 0.16} ${h * 0.14} L${-h * 0.11} ${h * 0.14} C${-h * 0.11} ${h * 0.18} ${-h * 0.06} ${h * 0.18} ${-h * 0.06} ${h * 0.14} L${-h * 0.06} 0Z`, wd);
  k.R(g, -h * 0.015, -h * 0.78, h * 0.03, h * 0.8, "#8c949c");
  if (open) {
    const cw = h * 1.08;
    k.P(g, `M${-cw / 2} ${-h * 0.44} C${-cw * 0.44} ${-h * 0.84} ${cw * 0.44} ${-h * 0.84} ${cw / 2} ${-h * 0.44} Q${cw * 0.25} ${-h * 0.52} 0 ${-h * 0.44} Q${-cw * 0.25} ${-h * 0.52} ${-cw / 2} ${-h * 0.44}Z`, color);
    k.P(g, `M${-cw / 2} ${-h * 0.44} C${-cw * 0.42} ${-h * 0.78} ${-cw * 0.12} ${-h * 0.8} 0 ${-h * 0.78} L0 ${-h * 0.44} Q${-cw * 0.25} ${-h * 0.52} ${-cw / 2} ${-h * 0.44}Z`, lt, 0.45);
  } else {
    k.P(g, `M${-h * 0.08} ${-h * 0.22} L0 ${-h * 0.76} L${h * 0.08} ${-h * 0.22}Z`, color);
    k.R(g, -h * 0.065, -h * 0.44, h * 0.13, h * 0.03, dk);
  }
  return g;
});
