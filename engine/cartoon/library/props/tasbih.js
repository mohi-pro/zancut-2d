// A loop of prayer beads (tasbih) with tassel, pinched at the top bead (0,0) and swaying gently.
ZS.define("tasbih", { about: "a loop of prayer beads (tasbih) with a tassel, about 24 cm", kind: "prop", grip: "pinch", base: [0, 0.88], tags: ["faith", "care", "home", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 84, seed = 1, color = "#6e462a", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#6e462a", "#3f7a58", "#c89b52"]);
  const tG = k.el("g", {}, g);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * 6.283 - 1.57;
    const bx = Math.cos(a) * h * 0.16, by = h * 0.34 + Math.sin(a) * h * 0.32;
    k.C(tG, bx, by, h * 0.036, i % 2 ? c : k.light(c, 0.16));
  }
  k.R(tG, -h * 0.025, h * 0.66, h * 0.05, h * 0.1, c, 2);
  k.P(tG, `M${-h * 0.02} ${h * 0.76} L${h * 0.02} ${h * 0.76} L${h * 0.06} ${h * 0.9} L${-h * 0.06} ${h * 0.9}Z`, "#d8a438");
  g.tick = (t) => {
    tG.setAttribute("transform", `rotate(${Math.sin(t * 2.2 + ph) * 3.5} 0 0)`);
  };
  g.tick(0);
  return g;
});
