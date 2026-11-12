// A ballpoint pen held at its lower finger grip (0,0), angled nicely for writing.
ZS.define("pen", { about: "a ballpoint pen with a clip cap, about 14 cm", kind: "prop", grip: "pinch", base: [0, 0.28], tags: ["school", "work", "bangladesh"] }, (layer, o, k) => {
  const { h = 62, seed = 1, color = "#2f6fb0", flip } = o;
  const g = k.group(layer, 0, 0, flip), pg = k.el("g", { transform: "rotate(-28)" }, g);
  k.P(pg, `M${-h * 0.04} ${h * 0.14} L${h * 0.04} ${h * 0.14} L0 ${h * 0.28}Z`, "#d8b454");
  k.C(pg, 0, h * 0.28, h * 0.015, "#1c1420");
  k.R(pg, -h * 0.045, -h * 0.12, h * 0.09, h * 0.26, k.dark(color, 0.22), 2);
  k.R(pg, -h * 0.045, -h * 0.72, h * 0.09, h * 0.62, "#f4efe6", 2);
  k.R(pg, -h * 0.05, -h * 0.76, h * 0.1, h * 0.22, color, 2);
  k.R(pg, h * 0.045, -h * 0.72, h * 0.025, h * 0.24, color, 1);
  return g;
});
