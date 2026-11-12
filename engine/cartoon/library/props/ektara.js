// A traditional Bangladeshi Baul one-stringed instrument (ektara) with gourd resonator and split bamboo neck gripped at (0,0).
ZS.define("ektara", { about: "a Bangladeshi Baul one-stringed ektara, about 58 cm", kind: "prop", grip: "grip", base: [0, 0.64], tags: ["music", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { h = 110, seed = 1, color = "#d69438", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.2), lt = k.light(color, 0.2), bmb = "#9c703c";
  k.P(g, `M${-h * 0.02} ${-h * 0.42} L${-h * 0.14} ${h * 0.36} L${-h * 0.1} ${h * 0.36} L0 ${-h * 0.42}Z`, bmb);
  k.P(g, `M0 ${-h * 0.42} L${h * 0.1} ${h * 0.36} L${h * 0.14} ${h * 0.36} L${h * 0.02} ${-h * 0.42}Z`, k.dark(bmb, 0.18));
  k.R(g, -h * 0.006, -h * 0.4, h * 0.012, h * 0.92, "#e8dec8");
  k.R(g, -h * 0.06, -h * 0.38, h * 0.12, h * 0.03, bmb, 1);
  k.E(g, 0, h * 0.44, h * 0.19, h * 0.2, color);
  k.P(g, `M0 ${h * 0.24} A${h * 0.19} ${h * 0.2} 0 0 1 0 ${h * 0.64}Z`, dk, 0.45);
  k.E(g, -h * 0.06, h * 0.4, h * 0.05, h * 0.09, lt, 0.65);
  k.R(g, -h * 0.15, h * 0.3, h * 0.3, h * 0.04, "#d8452f", 2);
  return g;
});
