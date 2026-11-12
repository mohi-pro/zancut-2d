// A handheld loudspeaker megaphone (mike) with pistol grip at (0,0) and sound wave rings when on.
ZS.define("megaphone", { about: "a handheld announcement megaphone, about 32 cm", kind: "prop", grip: "grip", base: [0.18, 0.12], tags: ["work", "street", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 76, seed = 1, color = "#d8452f", on = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  k.R(g, -h * 0.06, -h * 0.18, h * 0.12, h * 0.3, "#282c34", 3);
  k.R(g, -h * 0.24, -h * 0.34, h * 0.22, h * 0.18, color, 3);
  k.P(g, `M${-h * 0.04} ${-h * 0.34} L${h * 0.62} ${-h * 0.62} L${h * 0.62} ${h * 0.12} L${-h * 0.04} ${-h * 0.16}Z`, "#f4efe6");
  k.P(g, `M${-h * 0.04} ${-h * 0.25} L${h * 0.62} ${-h * 0.25} L${h * 0.62} ${h * 0.12} L${-h * 0.04} ${-h * 0.16}Z`, "#dfd8ca");
  k.E(g, h * 0.62, -h * 0.25, h * 0.07, h * 0.37, color);
  if (on) {
    const wv = k.E(g, h * 0.82, -h * 0.25, h * 0.08, h * 0.24, color, 0.45);
    g.tick = (t) => {
      const u = 0.8 + Math.sin(t * 6 + ph) * 0.25;
      wv.setAttribute("ry", h * 0.24 * u);
      wv.setAttribute("opacity", (0.25 + Math.sin(t * 6 + ph) * 0.2).toFixed(3));
    };
    g.tick(0);
  }
  return g;
});
