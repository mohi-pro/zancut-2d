// A shiny stainless-steel water jug with pouring spout and sturdy handle; grip (0,0) is at the handle.
ZS.define("waterJug", { about: "a stainless-steel water jug with a handle, about 22 cm", kind: "prop", grip: "grip", base: [0.42, 0.5], tags: ["food", "water", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 95, seed = 1, color = "#bfc8d0", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.22);
  k.P(g, `M${h * 0.14} ${-h * 0.28} L${-h * 0.08} ${-h * 0.28} L${-h * 0.08} ${h * 0.24} L${h * 0.16} ${h * 0.24} L${h * 0.16} ${h * 0.15} L${h * 0.02} ${h * 0.15} L${h * 0.02} ${-h * 0.19} L${h * 0.14} ${-h * 0.19}Z`, dk);
  k.P(g, `M${h * 0.16} ${-h * 0.42} L${h * 0.72} ${-h * 0.42} L${h * 0.84} ${-h * 0.5} L${h * 0.76} ${-h * 0.26} C${h * 0.86} ${h * 0.06} ${h * 0.82} ${h * 0.38} ${h * 0.72} ${h * 0.5} L${h * 0.16} ${h * 0.5} C${h * 0.08} ${h * 0.36} ${h * 0.08} ${-h * 0.2} ${h * 0.16} ${-h * 0.42}Z`, color);
  k.P(g, `M${h * 0.48} ${-h * 0.42} L${h * 0.72} ${-h * 0.42} L${h * 0.84} ${-h * 0.5} L${h * 0.76} ${-h * 0.26} C${h * 0.86} ${h * 0.06} ${h * 0.82} ${h * 0.38} ${h * 0.72} ${h * 0.5} L${h * 0.46} ${h * 0.5}Z`, dk, 0.55);
  k.R(g, h * 0.22, -h * 0.36, h * 0.09, h * 0.8, lt, 3);
  k.E(g, h * 0.45, -h * 0.42, h * 0.3, h * 0.055, dk);
  return g;
});
