// A white embroidered Bangladeshi Muslim prayer cap (tupi) with geometric band, held at its rim (0,0).
ZS.define("prayerCap", { about: "an embroidered white prayer cap (tupi), about 18 cm across", kind: "prop", grip: "pinch", base: [0.35, 0.06], tags: ["faith", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 52, seed = 1, color = "#faf6ee", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.14), pat = "#c8bfa8", w = h * 1.48, cx = w * 0.32;
  k.P(g, `M${cx - w / 2} 0 C${cx - w / 2} ${-h * 0.88} ${cx + w / 2} ${-h * 0.88} ${cx + w / 2} 0Z`, color);
  k.P(g, `M${cx} ${-h * 0.66} C${cx + w * 0.25} ${-h * 0.66} ${cx + w / 2} ${-h * 0.44} ${cx + w / 2} 0 L${cx} 0Z`, dk, 0.45);
  k.R(g, cx - w * 0.48, -h * 0.22, w * 0.96, h * 0.14, pat, 2);
  for (let i = -3; i <= 3; i++) {
    k.C(g, cx + i * w * 0.12, -h * 0.15, h * 0.035, color);
  }
  k.R(g, cx - w / 2, -h * 0.06, w, h * 0.08, dk, 2);
  return g;
});
