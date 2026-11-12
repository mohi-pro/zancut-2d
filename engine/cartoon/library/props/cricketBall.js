// A crimson leather cricket ball (or taped tennis ball by seed) with stitched seam, gripped at (0,0).
ZS.define("cricketBall", { about: "a red leather cricket ball with a white seam, about 7 cm", kind: "prop", grip: "grip", base: [0, 0.36], tags: ["sport", "play", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 38, seed = 1, color = "#b82824", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.24), lt = k.light(color, 0.22);
  k.C(g, 0, 0, h * 0.42, color);
  k.P(g, `M0 ${-h * 0.42} A${h * 0.42} ${h * 0.42} 0 0 1 0 ${h * 0.42}Z`, dk, 0.45);
  k.C(g, -h * 0.14, -h * 0.14, h * 0.12, lt, 0.65);
  k.P(g, `M${-h * 0.28} ${-h * 0.3} Q${h * 0.1} 0 ${-h * 0.28} ${h * 0.3} L${-h * 0.22} ${h * 0.32} Q${h * 0.16} 0 ${-h * 0.22} ${-h * 0.32}Z`, "#f4efe6", 0.85);
  return g;
});
