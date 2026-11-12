// A flag on a pole that waves: an example of a piece that MOVES (g.tick). x, y = the ground under the pole; h = the pole's height.
ZS.define("flag", { about: "a flag on a thin pole, waving gently; Bangladesh by default", kind: "set", tags: ["city", "school", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 320, seed = 1, color = "#1f7a4d", color2 = "#d8452f", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed), w = h * 0.42, fh = w * 0.6, phase = r() * 6;
  k.ground(g, h * 0.12);
  k.R(g, -h * 0.012, -h, h * 0.024, h, "#8d8a84");
  const cloth = k.el("g", {}, g), body = k.P(cloth, "", color), sun = k.C(cloth, 0, 0, fh * 0.2, color2);
  // the same t always draws the same wave: every value below comes from t and the seed only
  g.tick = (t) => {
    const a = Math.sin(t * 2.2 + phase) * fh * 0.08, b = Math.sin(t * 2.2 + phase + 1.6) * fh * 0.1;
    body.setAttribute("d", `M0 ${-h} C${w * 0.35} ${-h + a} ${w * 0.65} ${-h - a} ${w} ${-h + b} L${w} ${-h + fh + b} C${w * 0.65} ${-h + fh - a} ${w * 0.35} ${-h + fh + a} 0 ${-h + fh}Z`);
    sun.setAttribute("cx", w * 0.45); sun.setAttribute("cy", -h + fh / 2 + a * 0.3);
  };
  g.tick(0);
  return g;
});
