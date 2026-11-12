// A wooden walking cane or village bamboo lathi held near the curved top handle at (0,0) and reaching the ground.
ZS.define("walkingStick", { about: "a wooden walking stick or bamboo lathi, about 88 cm", kind: "prop", grip: "grip", base: [0, 0.88], tags: ["everyday", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 150, seed = 1, color = "#8c5a32", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.18);
  k.P(g, `M${h * 0.025} ${h * 0.04} L${h * 0.025} ${-h * 0.05} C${h * 0.025} ${-h * 0.16} ${-h * 0.16} ${-h * 0.16} ${-h * 0.16} ${-h * 0.04} L${-h * 0.1} ${-h * 0.04} C${-h * 0.1} ${-h * 0.09} ${-h * 0.03} ${-h * 0.09} ${-h * 0.03} ${-h * 0.04} L${-h * 0.03} ${h * 0.04}Z`, dk);
  k.R(g, -h * 0.028, 0, h * 0.056, h * 0.86, color, 2);
  k.R(g, 0, 0, h * 0.028, h * 0.86, dk, 1);
  for (const ny of [0.22, 0.46, 0.7]) k.R(g, -h * 0.034, h * ny, h * 0.068, h * 0.02, lt, 1);
  k.R(g, -h * 0.032, h * 0.83, h * 0.064, h * 0.05, "#282424", 2);
  return g;
});
