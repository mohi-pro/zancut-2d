// A sealed postal envelope / chithi with stamp and flap, pinched at its lower corner (0,0).
ZS.define("letter", { about: "a sealed postal letter envelope, about 16 cm", kind: "prop", grip: "pinch", base: [0.3, 0.05], tags: ["everyday", "paper", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 58, seed = 1, color = "#f5ebd6", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 1.42, cx = w * 0.28;
  const dk = k.dark(color, 0.14), vdk = k.dark(color, 0.24);
  k.R(g, cx - w / 2, -h * 0.92, w, h * 0.94, color, 3);
  k.P(g, `M${cx - w / 2} ${-h * 0.02} L${cx} ${-h * 0.48} L${cx + w / 2} ${-h * 0.02}Z`, dk);
  k.P(g, `M${cx - w / 2} ${-h * 0.92} L${cx} ${-h * 0.38} L${cx + w / 2} ${-h * 0.92}Z`, vdk);
  k.P(g, `M${cx - w / 2} ${-h * 0.92} L${cx} ${-h * 0.42} L${cx + w / 2} ${-h * 0.92}Z`, k.light(color, 0.12));
  k.C(g, cx, -h * 0.42, h * 0.09, "#d8452f");
  k.R(g, cx + w * 0.26, -h * 0.82, w * 0.16, h * 0.2, "#2d7f8c", 1);
  return g;
});
