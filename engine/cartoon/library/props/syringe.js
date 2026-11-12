// A doctor's medical syringe with graduated barrel, plunger and fine tip; gripped around the barrel (0,0).
ZS.define("syringe", { about: "a doctor's medical syringe, about 14 cm", kind: "prop", grip: "grip", base: [0, 0.38], tags: ["care", "bangladesh"] }, (layer, o, k) => {
  const { h = 68, seed = 1, color = "#5eb8d8", flip } = o;
  const g = k.group(layer, 0, 0, flip), sg = k.el("g", { transform: "rotate(-25)" }, g);
  k.R(sg, -h * 0.025, -h * 0.62, h * 0.05, h * 0.32, "#cfd8e0");
  k.R(sg, -h * 0.11, -h * 0.64, h * 0.22, h * 0.04, "#cfd8e0", 1);
  k.R(sg, -h * 0.14, -h * 0.32, h * 0.28, h * 0.04, "#dce4ec", 1);
  k.R(sg, -h * 0.075, -h * 0.3, h * 0.15, h * 0.56, "#e8f2f8", 2);
  k.R(sg, -h * 0.065, -h * 0.1, h * 0.13, h * 0.34, color, 1);
  k.R(sg, -h * 0.07, -h * 0.14, h * 0.14, h * 0.04, "#282c32", 1);
  for (let i = 0; i < 4; i++) k.R(sg, h * 0.02, -h * (0.2 - i * 0.1), h * 0.045, h * 0.015, "#5a646e");
  k.R(sg, -h * 0.03, h * 0.26, h * 0.06, h * 0.08, "#2d7f8c", 1);
  k.R(sg, -h * 0.008, h * 0.34, h * 0.016, h * 0.22, "#9aa4ae");
  return g;
});
