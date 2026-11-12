// A winter-evening badminton racket with isometric head and gripped handle at (0,0).
ZS.define("badmintonRacket", { about: "a badminton racket with a gripped handle, about 66 cm", kind: "prop", grip: "grip", base: [0, 0.22], tags: ["sport", "play", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 130, seed = 1, color = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.2);
  k.R(g, -h * 0.032, -h * 0.12, h * 0.064, h * 0.32, "#282428", 2);
  k.R(g, -h * 0.015, -h * 0.44, h * 0.03, h * 0.34, "#949ea8");
  k.P(g, `M0 ${-h * 0.38} L${-h * 0.08} ${-h * 0.48} L${h * 0.08} ${-h * 0.48}Z`, color);
  k.E(g, 0, -h * 0.72, h * 0.24, h * 0.28, color);
  k.E(g, 0, -h * 0.72, h * 0.2, h * 0.24, "#eaf3f7", 0.88);
  for (const gx of [-0.11, -0.04, 0.04, 0.11]) k.R(g, h * gx, -h * 0.94, h * 0.01, h * 0.44, "#b8c2cc");
  for (const gy of [-0.86, -0.77, -0.68, -0.59]) k.R(g, -h * 0.18, h * gy, h * 0.36, h * 0.01, "#b8c2cc");
  return g;
});
