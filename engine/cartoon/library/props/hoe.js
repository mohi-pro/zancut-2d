// A Bangladeshi digging hoe (kodal) with bamboo shaft gripped at (0,0) and angled iron blade at the bottom.
ZS.define("hoe", { about: "a Bangladeshi digging hoe (kodal) with an iron blade, about 85 cm", kind: "prop", grip: "grip", base: [0.1, 0.78], tags: ["work", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { h = 135, seed = 1, color = "#8c6238", flip } = o;
  const g = k.group(layer, 0, 0, flip), irn = "#586068", lt = "#88929c";
  k.R(g, -h * 0.03, -h * 0.24, h * 0.06, h * 1.0, color, 3);
  k.R(g, 0, -h * 0.24, h * 0.03, h * 1.0, k.dark(color, 0.2), 1);
  k.R(g, -h * 0.045, h * 0.62, h * 0.09, h * 0.09, k.dark(irn, 0.22), 2);
  k.P(g, `M${h * 0.03} ${h * 0.63} L${h * 0.38} ${h * 0.52} L${h * 0.44} ${h * 0.76} L${h * 0.03} ${h * 0.72}Z`, irn);
  k.P(g, `M${h * 0.35} ${h * 0.53} L${h * 0.38} ${h * 0.52} L${h * 0.44} ${h * 0.76} L${h * 0.39} ${h * 0.75}Z`, lt);
  return g;
});
