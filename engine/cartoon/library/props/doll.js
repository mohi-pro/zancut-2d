// A traditional Bangladeshi cloth/terracotta doll (putul) in a bright sari/frock, held around the waist (0,0).
ZS.define("doll", { about: "a traditional Bangladeshi cloth doll (putul), about 22 cm", kind: "prop", grip: "grip", base: [0, 0.48], tags: ["play", "village", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 76, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, ["#d8452f", "#e0a02c", "#7a4fa3", "#2d7f8c"]);
  const skin = "#d89e72", hair = "#1e1a1c";
  k.R(g, -h * 0.12, h * 0.26, h * 0.07, h * 0.22, skin, 3);
  k.R(g, h * 0.05, h * 0.26, h * 0.07, h * 0.22, skin, 3);
  k.P(g, `M${-h * 0.14} ${-h * 0.16} L${h * 0.14} ${-h * 0.16} L${h * 0.26} ${h * 0.3} L${-h * 0.26} ${h * 0.3}Z`, c);
  k.R(g, -h * 0.25, h * 0.22, h * 0.5, h * 0.06, "#f0c838", 1);
  k.P(g, `M${-h * 0.14} ${-h * 0.14} L${-h * 0.32} ${h * 0.06} L${-h * 0.26} ${h * 0.12} L${-h * 0.1} ${-h * 0.04}Z`, skin);
  k.P(g, `M${h * 0.14} ${-h * 0.14} L${h * 0.32} ${h * 0.06} L${h * 0.26} ${h * 0.12} L${h * 0.1} ${-h * 0.04}Z`, skin);
  k.C(g, 0, -h * 0.34, h * 0.17, hair);
  k.C(g, 0, -h * 0.31, h * 0.14, skin);
  k.C(g, -h * 0.05, -h * 0.32, h * 0.02, hair);
  k.C(g, h * 0.05, -h * 0.32, h * 0.02, hair);
  k.C(g, 0, -h * 0.37, h * 0.02, "#d8452f");
  return g;
});
