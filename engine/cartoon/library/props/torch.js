// A handheld electric flashlight (torchlight) gripped around the barrel (0,0) with warm light beam cone when on.
ZS.define("torch", { about: "a handheld electric torchlight with a light beam, about 20 cm", kind: "prop", grip: "grip", base: [0, 0.18], tags: ["everyday", "village", "night", "bangladesh"] }, (layer, o, k) => {
  const { h = 58, seed = 1, color = "#2e343c", on = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), yel = "#e5a828";
  const bm = on ? k.P(g, `M${h * 0.52} ${-h * 0.22} L${h * 1.45} ${-h * 0.56} L${h * 1.45} ${h * 0.56} L${h * 0.52} ${h * 0.22}Z`, "#fae888", 0.34) : null;
  k.R(g, -h * 0.48, -h * 0.14, h * 0.78, h * 0.28, color, 3);
  k.R(g, -h * 0.48, 0, h * 0.78, h * 0.14, dk, 2);
  k.P(g, `M${h * 0.28} ${-h * 0.14} L${h * 0.48} ${-h * 0.24} L${h * 0.48} ${h * 0.24} L${h * 0.28} ${h * 0.14}Z`, yel);
  k.E(g, h * 0.48, 0, h * 0.05, h * 0.24, on ? "#fff8c8" : "#9aa4ae");
  k.R(g, -h * 0.1, -h * 0.18, h * 0.14, h * 0.05, "#d8452f", 2);
  if (on) {
    g.tick = (t) => {
      bm.setAttribute("opacity", (0.28 + Math.sin(t * 4 + ph) * 0.08).toFixed(3));
    };
    g.tick(0);
  }
  return g;
});
