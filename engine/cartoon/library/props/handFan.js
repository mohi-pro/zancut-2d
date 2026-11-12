// A traditional Bangladeshi woven palm-leaf hand fan (taalpatar haat pakha) with red cloth trim; gripped at handle (0,0).
ZS.define("handFan", { about: "a woven Bangladeshi palm-leaf hand fan (haat pakha), about 34 cm", kind: "prop", grip: "grip", base: [0, 0.26], tags: ["everyday", "village", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 92, seed = 1, color = "#dfc282", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.18), lt = k.light(color, 0.16);
  k.R(g, -h * 0.035, -h * 0.78, h * 0.07, h * 1.04, "#7a5230", 3);
  k.C(g, h * 0.22, -h * 0.48, h * 0.34, color2);
  k.C(g, h * 0.22, -h * 0.48, h * 0.28, color);
  k.P(g, `M${h * 0.22} ${-h * 0.76} A${h * 0.28} ${h * 0.28} 0 0 1 ${h * 0.22} ${-h * 0.2}Z`, dk, 0.38);
  for (const r0 of [0.1, 0.19]) {
    k.C(g, h * 0.22, -h * 0.48, h * r0, color2);
    k.C(g, h * 0.22, -h * 0.48, h * (r0 - 0.025), color);
  }
  k.R(g, -h * 0.04, -h * 0.56, h * 0.08, h * 0.16, color2, 2);
  return g;
});
