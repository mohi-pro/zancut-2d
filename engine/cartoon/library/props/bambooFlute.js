// A traditional Bangladeshi bamboo flute (banshi) with finger holes and red decorative bands; gripped at (0,0).
ZS.define("bambooFlute", { about: "a Bangladeshi bamboo flute (banshi) with finger holes, about 42 cm", kind: "prop", grip: "grip", base: [0, 0.45], tags: ["music", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { h = 95, seed = 1, color = "#d4a656", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.2), fg = k.el("g", { transform: "rotate(-62)" }, g);
  k.R(fg, -h * 0.045, -h * 0.48, h * 0.09, h * 0.96, color, h * 0.03);
  k.R(fg, 0, -h * 0.48, h * 0.045, h * 0.96, dk, h * 0.02);
  for (const ry of [-0.42, -0.34, 0.38]) k.R(fg, -h * 0.048, h * ry, h * 0.096, h * 0.035, "#d8452f", 1);
  for (let i = -2; i <= 3; i++) k.C(fg, -h * 0.01, h * (-0.16 + i * 0.085), h * 0.022, "#241a14");
  return g;
});
