// A printed bus, train or launch ticket with perforated stub and coloured header band, pinched at (0,0).
ZS.define("ticket", { about: "a bus, train or launch travel ticket, about 14 cm", kind: "prop", grip: "pinch", base: [0.3, 0.05], tags: ["everyday", "paper", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 48, seed = 1, color = "#e5b84b", color2 = "#2d7f8c", flip } = o;
  const g = k.group(layer, 0, 0, flip), w = h * 1.85, cx = w * 0.28;
  k.R(g, cx - w / 2, -h * 0.88, w, h * 0.9, color, 4);
  k.R(g, cx - w / 2, -h * 0.88, w * 0.72, h * 0.22, color2, 3);
  for (let i = 0; i < 5; i++) k.C(g, cx + w * 0.22, -h * (0.8 - i * 0.18), h * 0.03, "#f4efe6");
  k.R(g, cx - w * 0.42, -h * 0.54, w * 0.52, h * 0.08, "#2c2828", 1);
  k.R(g, cx - w * 0.42, -h * 0.36, w * 0.36, h * 0.06, "#5a544e", 1);
  k.R(g, cx - w * 0.42, -h * 0.2, w * 0.44, h * 0.06, "#d8452f", 1);
  return g;
});
