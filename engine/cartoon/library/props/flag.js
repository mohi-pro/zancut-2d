// A handheld flag on a short stick (option country, Bangladesh by default) gripped at (0,0) and waving gently via tick(t).
ZS.define("flag", { about: "a handheld waving flag on a stick (Bangladesh by default), about 55 cm", kind: "prop", grip: "grip", base: [0, 0.26], tags: ["everyday", "school", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 115, seed = 1, color = "#1f7a4d", color2 = "#d8452f", country = "BD", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const w = h * 0.68, fh = w * 0.6, topY = -h * 0.78;
  k.R(g, -h * 0.02, topY, h * 0.04, h * 1.04, "#8c6438", 2);
  k.C(g, 0, topY, h * 0.035, "#e0a02c");
  const cloth = k.el("g", {}, g), body = k.P(cloth, "", color);
  const sun = country === "BD" ? k.C(cloth, 0, 0, fh * 0.22, color2) : null;
  g.tick = (t) => {
    const a = Math.sin(t * 2.6 + ph) * fh * 0.09, b = Math.sin(t * 2.6 + ph + 1.6) * fh * 0.12;
    body.setAttribute("d", `M${h * 0.015} ${topY} C${w * 0.35} ${topY + a} ${w * 0.65} ${topY - a} ${w} ${topY + b} L${w} ${topY + fh + b} C${w * 0.65} ${topY + fh - a} ${w * 0.35} ${topY + fh + a} ${h * 0.015} ${topY + fh}Z`);
    if (sun) { sun.setAttribute("cx", w * 0.45); sun.setAttribute("cy", topY + fh / 2 + a * 0.35); }
  };
  g.tick(0);
  return g;
});
