// A clinical digital or glass fever thermometer pinched at its upper body (0,0) with red/LCD reading.
ZS.define("thermometer", { about: "a clinical fever thermometer, about 13 cm", kind: "prop", grip: "pinch", base: [0, 0.35], tags: ["care", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 60, seed = 1, color = "#f4f6f8", flip } = o;
  const g = k.group(layer, 0, 0, flip), tg = k.el("g", { transform: "rotate(-30)" }, g);
  k.R(tg, -h * 0.07, -h * 0.56, h * 0.14, h * 0.76, color, h * 0.06);
  k.R(tg, -h * 0.04, h * 0.18, h * 0.08, h * 0.18, color, 2);
  k.R(tg, -h * 0.03, h * 0.32, h * 0.06, h * 0.08, "#b4bec8", 2);
  k.R(tg, -h * 0.045, -h * 0.34, h * 0.09, h * 0.28, "#8ec4a8", 1);
  k.R(tg, -h * 0.02, -h * 0.02, h * 0.04, h * 0.24, "#d8452f", 1);
  k.C(tg, 0, -h * 0.44, h * 0.035, "#2f6fb0");
  return g;
});
