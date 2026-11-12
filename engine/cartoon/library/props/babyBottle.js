// A baby's milk feeding bottle with measurement markings and silicone teat, gripped around the middle (0,0).
ZS.define("babyBottle", { about: "a baby's milk feeding bottle, about 16 cm", kind: "prop", grip: "grip", base: [0, 0.46], tags: ["care", "home", "food", "bangladesh"] }, (layer, o, k) => {
  const { h = 62, seed = 1, color = "#5eb8d8", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), w = h * 0.48;
  k.R(g, -w / 2, -h * 0.28, w, h * 0.74, "#e6f2f8", h * 0.08);
  if (full) k.R(g, -w * 0.44, -h * 0.08, w * 0.88, h * 0.5, "#fffaf0", h * 0.05);
  for (let i = 0; i < 4; i++) k.R(g, w * 0.12, -h * (0.16 - i * 0.13), w * 0.22, h * 0.025, color);
  k.R(g, -w * 0.46, -h * 0.38, w * 0.92, h * 0.12, color, 3);
  k.P(g, `M${-w * 0.24} ${-h * 0.38} C${-w * 0.22} ${-h * 0.56} ${-w * 0.1} ${-h * 0.66} 0 ${-h * 0.66} C${w * 0.1} ${-h * 0.66} ${w * 0.22} ${-h * 0.56} ${w * 0.24} ${-h * 0.38}Z`, "#e5b478");
  return g;
});
