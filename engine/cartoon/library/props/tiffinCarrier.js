// A 3-tier stainless-steel Bangladeshi tiffin carrier (bati) held by its top latch handle at (0,0).
ZS.define("tiffinCarrier", { about: "a 3-tier stainless-steel tiffin carrier, about 24 cm", kind: "prop", grip: "grip", base: [0, 0.96], tags: ["food", "work", "school", "bangladesh"] }, (layer, o, k) => {
  const { h = 95, seed = 1, color = "#c4ccd4", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.22), w = h * 0.62;
  k.R(g, -w * 0.32, -h * 0.04, w * 0.64, h * 0.07, dk, 3);
  k.R(g, -w * 0.54, h * 0.03, w * 0.05, h * 0.88, dk, 2);
  k.R(g, w * 0.49, h * 0.03, w * 0.05, h * 0.88, dk, 2);
  for (let i = 0; i < 3; i++) {
    const ty = h * (0.14 + i * 0.27);
    k.R(g, -w * 0.48, ty, w * 0.96, h * 0.25, color, 4);
    k.R(g, 0, ty, w * 0.48, h * 0.25, dk, 2);
    k.R(g, -w * 0.36, ty + h * 0.02, w * 0.14, h * 0.21, lt, 2);
    k.R(g, -w * 0.5, ty - h * 0.02, w, h * 0.04, dk, 2);
  }
  k.E(g, 0, h * 0.12, w * 0.48, h * 0.06, lt);
  return g;
});
