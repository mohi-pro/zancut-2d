// A red metal mechanic's or carpenter's toolbox held by its top handle at (0,0).
ZS.define("toolBox", { about: "a metal toolbox with latches and a top handle, about 38 cm", kind: "prop", grip: "grip", base: [0, 0.72], tags: ["work", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 84, seed = 1, color = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.18), w = h * 1.35;
  k.P(g, `M${-w * 0.22} ${h * 0.14} L${-w * 0.22} ${-h * 0.03} L${w * 0.22} ${-h * 0.03} L${w * 0.22} ${h * 0.14} L${w * 0.16} ${h * 0.14} L${w * 0.16} ${h * 0.03} L${-w * 0.16} ${h * 0.03} L${-w * 0.16} ${h * 0.14}Z`, "#282428");
  k.R(g, -w / 2, h * 0.24, w, h * 0.48, color, 4);
  k.R(g, 0, h * 0.24, w / 2, h * 0.48, dk, 3);
  k.P(g, `M${-w * 0.52} ${h * 0.26} L${-w * 0.44} ${h * 0.12} L${w * 0.44} ${h * 0.12} L${w * 0.52} ${h * 0.26}Z`, lt);
  k.R(g, -w * 0.3, h * 0.22, w * 0.12, h * 0.12, "#c8d0d8", 2);
  k.R(g, w * 0.18, h * 0.22, w * 0.12, h * 0.12, "#c8d0d8", 2);
  return g;
});
