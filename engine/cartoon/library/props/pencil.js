// A yellow wooden pencil with pink eraser and sharpened graphite tip; pinched at (0,0).
ZS.define("pencil", { about: "a sharpened wooden pencil with an eraser, about 16 cm", kind: "prop", grip: "pinch", base: [0, 0.28], tags: ["school", "work", "bangladesh"] }, (layer, o, k) => {
  const { h = 64, seed = 1, color = "#e8b428", flip } = o;
  const g = k.group(layer, 0, 0, flip), pg = k.el("g", { transform: "rotate(-28)" }, g);
  k.P(pg, `M${-h * 0.048} ${h * 0.12} L${h * 0.048} ${h * 0.12} L0 ${h * 0.28}Z`, "#e5c89e");
  k.P(pg, `M${-h * 0.02} ${h * 0.21} L${h * 0.02} ${h * 0.21} L0 ${h * 0.28}Z`, "#2c2828");
  k.R(pg, -h * 0.048, -h * 0.64, h * 0.096, h * 0.76, color, 1);
  k.R(pg, h * 0.01, -h * 0.64, h * 0.038, h * 0.76, k.dark(color, 0.16));
  k.R(pg, -h * 0.048, -h * 0.7, h * 0.096, h * 0.06, "#b8c0c8");
  k.R(pg, -h * 0.048, -h * 0.78, h * 0.096, h * 0.08, "#e07a84", 2);
  return g;
});
