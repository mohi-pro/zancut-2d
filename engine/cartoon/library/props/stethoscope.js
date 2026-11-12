// A doctor's stethoscope draped around the neck; anchor (0,0) is the back-of-neck point and it hangs down the chest.
ZS.define("stethoscope", { about: "a doctor's stethoscope draped from the neck anchor (0,0), about 45 cm", kind: "prop", grip: "pinch", base: [0, 0.88], tags: ["care", "work", "bangladesh"] }, (layer, o, k) => {
  const { h = 105, seed = 1, color = "#283038", flip } = o;
  const g = k.group(layer, 0, 0, flip), mtl = "#b8c2cc";
  k.P(g, `M${-h * 0.22} 0 C${-h * 0.28} ${h * 0.28} ${-h * 0.18} ${h * 0.54} ${-h * 0.16} ${h * 0.76} L${-h * 0.1} ${h * 0.76} C${-h * 0.12} ${h * 0.52} ${-h * 0.2} ${h * 0.26} ${-h * 0.15} 0Z`, color);
  k.P(g, `M${h * 0.15} 0 C${h * 0.22} ${h * 0.3} ${h * 0.18} ${h * 0.56} ${h * 0.12} ${h * 0.7} L${h * 0.18} ${h * 0.7} C${h * 0.24} ${h * 0.56} ${h * 0.28} ${h * 0.3} ${h * 0.22} 0Z`, color);
  k.P(g, `M${-h * 0.18} ${h * 0.72} L${-h * 0.24} ${h * 0.88} L${-h * 0.18} ${h * 0.88} L${-h * 0.13} ${h * 0.76} L${-h * 0.08} ${h * 0.88} L${-h * 0.02} ${h * 0.88} L${-h * 0.08} ${h * 0.72}Z`, mtl);
  k.C(g, h * 0.15, h * 0.76, h * 0.095, mtl);
  k.C(g, h * 0.15, h * 0.76, h * 0.055, "#88929c");
  return g;
});
