// An open laptop held with two hands at its base edge (0,0) with glowing screen (on: true).
ZS.define("laptopHeld", { about: "an open laptop computer held in the hands, about 32 cm", kind: "prop", grip: "two", grip2: [45, 0], base: [0.25, 0.05], tags: ["work", "school", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 85, seed = 1, color = "#6c7680", on = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.24), lt = k.light(color, 0.18), w = h * 1.25, cx = w * 0.2;
  k.P(g, `M${cx - w * 0.42} ${-h * 0.76} L${cx + w * 0.34} ${-h * 0.76} L${cx + w * 0.42} ${-h * 0.06} L${cx - w * 0.34} ${-h * 0.06}Z`, dk);
  const scr = k.P(g, `M${cx - w * 0.37} ${-h * 0.71} L${cx + w * 0.3} ${-h * 0.71} L${cx + w * 0.37} ${-h * 0.11} L${cx - w * 0.3} ${-h * 0.11}Z`, on ? "#6ab8e8" : "#282e36");
  if (on) {
    k.R(g, cx - w * 0.26, -h * 0.58, w * 0.38, h * 0.06, "#fff6e6", 2);
    k.R(g, cx - w * 0.24, -h * 0.46, w * 0.46, h * 0.05, "#d8eef8", 2);
    k.R(g, cx - w * 0.22, -h * 0.34, w * 0.3, h * 0.05, "#d8eef8", 2);
  }
  k.P(g, `M${cx - w * 0.34} ${-h * 0.06} L${cx + w * 0.42} ${-h * 0.06} L${cx + w * 0.54} ${h * 0.06} L${cx - w * 0.46} ${h * 0.06}Z`, lt);
  k.R(g, cx - w * 0.46, h * 0.04, w, h * 0.04, color, 2);
  if (on) {
    g.tick = (t) => {
      scr.setAttribute("opacity", (0.86 + Math.sin(t * 3.1 + ph) * 0.14).toFixed(3));
    };
    g.tick(0);
  }
  return g;
});
