// A willow cricket bat with gripped rubber handle at (0,0) and V-spliced blade below.
ZS.define("cricketBat", { about: "a wooden cricket bat with a gripped handle, about 85 cm", kind: "prop", grip: "grip", base: [0, 0.86], tags: ["sport", "play", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 145, seed = 1, color = "#d8b278", color2 = "#2d7f8c", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.18), lt = k.light(color, 0.16);
  k.R(g, -h * 0.032, -h * 0.16, h * 0.064, h * 0.38, "#f4efe6", 3);
  k.R(g, -h * 0.034, -h * 0.08, h * 0.068, h * 0.16, color2, 2);
  k.P(g, `M${-h * 0.085} ${h * 0.22} L${-h * 0.032} ${h * 0.18} L${h * 0.032} ${h * 0.18} L${h * 0.085} ${h * 0.22} L${h * 0.09} ${h * 0.84} C${h * 0.09} ${h * 0.88} ${-h * 0.09} ${h * 0.88} ${-h * 0.09} ${h * 0.84}Z`, color);
  k.P(g, `M0 ${h * 0.18} L${h * 0.032} ${h * 0.18} L${h * 0.085} ${h * 0.22} L${h * 0.09} ${h * 0.86} L0 ${h * 0.86}Z`, dk, 0.45);
  k.P(g, `M${-h * 0.032} ${h * 0.18} L0 ${h * 0.32} L${h * 0.032} ${h * 0.18}Z`, dk);
  k.R(g, -h * 0.065, h * 0.26, h * 0.025, h * 0.54, lt, 1);
  return g;
});
