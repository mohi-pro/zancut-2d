// A bamboo village fishing rod (borshi) gripped near the base (0,0) with red-and-white float bobbing on a line.
ZS.define("fishingRod", { about: "a bamboo fishing rod (borshi) with line and float, about 140 cm", kind: "prop", grip: "grip", base: [0, 0.18], tags: ["work", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 160, seed = 1, color = "#a88248", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  k.P(g, `M${-h * 0.025} ${h * 0.18} L${h * 0.025} ${h * 0.18} L${h * 0.54} ${-h * 0.78} L${h * 0.52} ${-h * 0.79}Z`, color);
  const ln = k.P(g, "", "#c8c2b8");
  const flt = k.el("g", {}, g);
  k.E(flt, 0, 0, h * 0.025, h * 0.055, "#d8452f");
  k.E(flt, 0, h * 0.02, h * 0.024, h * 0.03, "#fff6e6");
  g.tick = (t) => {
    const sw = Math.sin(t * 2.4 + ph) * h * 0.05, fy = -h * 0.15 + Math.cos(t * 3.1 + ph) * h * 0.025;
    const fx = h * 0.53 + sw;
    ln.setAttribute("d", `M${h * 0.53} ${-h * 0.78} L${fx} ${fy} L${fx + h * 0.008} ${fy} L${h * 0.538} ${-h * 0.78}Z`);
    flt.setAttribute("transform", `translate(${fx} ${fy})`);
  };
  g.tick(0);
  return g;
});
