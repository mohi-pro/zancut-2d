// A diamond Bangladeshi paper kite (ghuri) with wooden reel (natai) held at (0,0) and kite swaying above.
ZS.define("kite", { about: "a colourful paper kite (ghuri) with a string reel (natai), about 45 cm", kind: "prop", grip: "grip", base: [0, 0.18], tags: ["play", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 125, seed = 1, color, color2 = "#e8b428", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#d8452f", "#2d7f8c", "#7a4fa3", "#5a8f3c"]);
  k.R(g, -h * 0.03, -h * 0.14, h * 0.06, h * 0.32, "#6e4626", 2);
  k.R(g, -h * 0.09, -h * 0.08, h * 0.18, h * 0.16, "#c84638", 2);
  const str = k.P(g, "", "#d8cfbf");
  const kG = k.el("g", {}, g);
  k.P(kG, `M0 ${-h * 0.28} L${h * 0.28} 0 L0 ${h * 0.28} L${-h * 0.28} 0Z`, c);
  k.P(kG, `M0 ${-h * 0.28} L${h * 0.28} 0 L0 ${h * 0.28}Z`, color2);
  k.P(kG, `M0 ${h * 0.26} L${-h * 0.1} ${h * 0.42} L${h * 0.1} ${h * 0.42}Z`, c);
  k.R(kG, -h * 0.01, -h * 0.28, h * 0.02, h * 0.56, "#6e4e32");
  g.tick = (t) => {
    const s = t * 2.2 + ph, kx = h * 0.22 + Math.sin(s) * h * 0.08, ky = -h * 0.62 + Math.cos(s * 1.3) * h * 0.05;
    kG.setAttribute("transform", `translate(${kx} ${ky}) rotate(${-12 + Math.sin(s) * 8})`);
    str.setAttribute("d", `M0 ${-h * 0.04} Q${kx * 0.3} ${ky * 0.5} ${kx} ${ky} L${kx + h * 0.015} ${ky} Q${kx * 0.3 + h * 0.015} ${ky * 0.5} ${h * 0.015} ${-h * 0.04}Z`);
  };
  g.tick(0);
  return g;
});
