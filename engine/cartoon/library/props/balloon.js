// A bright floating balloon on a string; pinched at the string's lower end (0,0) with gentle bobbing tick(t).
ZS.define("balloon", { about: "a floating party balloon on a string, about 35 cm", kind: "prop", grip: "pinch", base: [0, 0], tags: ["play", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 115, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#d8452f", "#2d7f8c", "#e0a02c", "#7a4fa3", "#5a8f3c"]);
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.28);
  const str = k.P(g, "", "#b8b0a4");
  const bG = k.el("g", {}, g);
  k.P(bG, `M0 0 L${-h * 0.04} ${h * 0.05} L${h * 0.04} ${h * 0.05}Z`, dk);
  k.E(bG, 0, -h * 0.28, h * 0.24, h * 0.29, c);
  k.P(bG, `M0 ${-h * 0.57} A${h * 0.24} ${h * 0.29} 0 0 1 0 ${h * 0.01}Z`, dk, 0.35);
  k.E(bG, -h * 0.09, -h * 0.36, h * 0.06, h * 0.1, lt, 0.75);
  g.tick = (t) => {
    const sw = Math.sin(t * 2.1 + ph) * h * 0.08, by = -h * 0.42 + Math.cos(t * 2.6 + ph) * h * 0.03;
    bG.setAttribute("transform", `translate(${sw} ${by}) rotate(${sw * 0.3})`);
    str.setAttribute("d", `M0 0 Q${sw * 0.4} ${by * 0.5} ${sw} ${by} L${sw + h * 0.014} ${by} Q${sw * 0.4 + h * 0.014} ${by * 0.5} ${h * 0.014} 0Z`);
  };
  g.tick(0);
  return g;
});
