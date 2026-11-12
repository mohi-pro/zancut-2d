// A Bangladeshi short coconut-rib or grass broom (jharu / sholar jharu) without handle, gripped at the bound top wrap (0,0).
ZS.define("broom", { about: "a short Bangladeshi bound broom (jharu) without a handle, about 65 cm", kind: "prop", grip: "grip", base: [0, 0.88], tags: ["work", "village", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 115, seed = 1, color = "#c8a258", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.18), lt = k.light(color, 0.18);
  k.R(g, -h * 0.055, -h * 0.18, h * 0.11, h * 0.28, color, 4);
  k.R(g, -h * 0.06, -h * 0.08, h * 0.12, h * 0.16, color2, 2);
  k.R(g, -h * 0.06, h * 0.04, h * 0.12, h * 0.03, "#282424", 1);
  k.P(g, `M${-h * 0.055} ${h * 0.08} L${h * 0.055} ${h * 0.08} L${h * 0.24} ${h * 0.88} L${-h * 0.24} ${h * 0.88}Z`, color);
  k.P(g, `M0 ${h * 0.08} L${h * 0.055} ${h * 0.08} L${h * 0.24} ${h * 0.88} L0 ${h * 0.88}Z`, dk, 0.45);
  for (const sx of [-0.14, -0.06, 0.04, 0.12]) {
    k.P(g, `M${h * sx * 0.3} ${h * 0.12} L${h * sx} ${h * 0.88} L${h * (sx + 0.02)} ${h * 0.88} L${h * (sx * 0.3 + 0.01)} ${h * 0.12}Z`, sx < 0 ? lt : dk);
  }
  return g;
});
