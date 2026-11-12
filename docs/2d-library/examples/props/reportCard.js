// A school report card: a prop. Drawn around its grip point (0, 0) = where the fingers hold it (its lower middle edge).
// ZC.prop(layer, (g) => ZS.reportCard(g, { h: 90, color })) then ZC.carry / ZC.handover move it with a hand.
ZS.define("reportCard", { about: "a folded school report card with a coloured band and marks", kind: "prop", tags: ["school", "paper"] }, (layer, o, k) => {
  const { h = 90, color = "#0a92cd", seed = 1 } = o;
  const g = k.group(layer, 0, 0), w = h * 0.72, r = k.rngOf(seed);
  k.R(g, -w / 2, -h, w, h, "#fffaf0", h * 0.04);
  k.R(g, -w / 2, -h, w, h * 0.22, color, h * 0.04);
  for (let i = 0; i < 4; i++) k.R(g, -w * 0.36, -h * (0.66 - i * 0.13), w * (0.4 + r() * 0.3), h * 0.04, "#8b95a0");
  k.C(g, w * 0.24, -h * 0.2, h * 0.11, "#e0a02c");
  return g;
});
