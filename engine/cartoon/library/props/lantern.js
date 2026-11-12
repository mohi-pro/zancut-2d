// A traditional Bangladeshi kerosene hurricane lantern (hariken) held by its top bail wire at (0,0) with warm flickering glow.
ZS.define("lantern", { about: "a kerosene hurricane lantern (hariken) with warm flame glow, about 30 cm", kind: "prop", grip: "grip", base: [0, 0.94], tags: ["village", "home", "night", "bangladesh"] }, (layer, o, k) => {
  const { h = 105, seed = 1, color = "#3a444e", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), w = h * 0.56;
  const halo = k.C(g, 0, h * 0.54, h * 0.44, "#f6d258", 0.24);
  k.P(g, `M${-w * 0.34} ${h * 0.2} C${-w * 0.34} ${-h * 0.04} ${w * 0.34} ${-h * 0.04} ${w * 0.34} ${h * 0.2} L${w * 0.28} ${h * 0.2} C${w * 0.28} ${h * 0.02} ${-w * 0.28} ${h * 0.02} ${-w * 0.28} ${h * 0.2}Z`, dk);
  k.P(g, `M${-w * 0.48} ${h * 0.28} C${-w * 0.62} ${h * 0.5} ${-w * 0.62} ${h * 0.72} ${-w * 0.44} ${h * 0.84} L${w * 0.44} ${h * 0.84} C${w * 0.62} ${h * 0.72} ${w * 0.62} ${h * 0.5} ${w * 0.48} ${h * 0.28} L${w * 0.4} ${h * 0.28} C${w * 0.52} ${h * 0.5} ${w * 0.52} ${h * 0.7} ${w * 0.38} ${h * 0.8} L${-w * 0.38} ${h * 0.8} C${-w * 0.52} ${h * 0.7} ${-w * 0.52} ${h * 0.5} ${-w * 0.4} ${h * 0.28}Z`, color);
  k.E(g, 0, h * 0.54, w * 0.36, h * 0.24, "#faecc0", 0.75);
  const flm = k.E(g, 0, h * 0.58, h * 0.06, h * 0.11, "#f29c24");
  k.E(g, 0, h * 0.6, h * 0.03, h * 0.06, "#fff8d6");
  k.R(g, -w * 0.28, h * 0.16, w * 0.56, h * 0.12, color, 3);
  k.R(g, -w * 0.44, h * 0.78, w * 0.88, h * 0.16, color, 4);
  g.tick = (t) => {
    const fl = 0.88 + Math.sin(t * 7 + ph) * 0.12;
    halo.setAttribute("r", h * 0.42 * fl);
    flm.setAttribute("ry", h * 0.11 * fl);
  };
  g.tick(0);
  return g;
});
