// A classic Bangladeshi tong-er dokan fluted tea glass with condensed milk tea and steam; grip (0,0) at the middle.
ZS.define("teaGlass", { about: "a Bangladeshi tea-stall glass with hot milk tea, about 10 cm", kind: "prop", grip: "grip", base: [0, 0.48], tags: ["food", "tea", "street", "bangladesh"] }, (layer, o, k) => {
  const { h = 68, seed = 1, color = "#d8e8ed", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const tea = "#c47438", foam = "#f2dec4", gls = color;
  k.P(g, `M${-h * 0.3} ${-h * 0.46} L${h * 0.3} ${-h * 0.46} L${h * 0.22} ${h * 0.48} L${-h * 0.22} ${h * 0.48}Z`, gls, 0.55);
  if (full) {
    k.P(g, `M${-h * 0.27} ${-h * 0.28} L${h * 0.27} ${-h * 0.28} L${h * 0.2} ${h * 0.42} L${-h * 0.2} ${h * 0.42}Z`, tea);
    k.P(g, `M0 ${-h * 0.28} L${h * 0.27} ${-h * 0.28} L${h * 0.2} ${h * 0.42} L0 ${h * 0.42}Z`, k.dark(tea, 0.16));
    k.E(g, 0, -h * 0.28, h * 0.27, h * 0.055, foam);
  }
  for (const fx of [-0.14, 0, 0.14]) k.R(g, h * fx - h * 0.015, -h * 0.2, h * 0.03, h * 0.6, "#fff6e6", 1);
  k.E(g, 0, -h * 0.46, h * 0.3, h * 0.055, k.light(gls, 0.2), 0.75);
  k.R(g, -h * 0.22, h * 0.42, h * 0.44, h * 0.06, k.dark(gls, 0.2), 2);
  if (full) {
    const st = k.P(g, "", "#fff6e6", 0.55);
    g.tick = (t) => {
      const sw = Math.sin(t * 2.4 + ph) * h * 0.09;
      st.setAttribute("d", `M${-h * 0.04} ${-h * 0.52} Q${sw} ${-h * 0.72} ${-sw * 0.6} ${-h * 0.94} L${h * 0.04 - sw * 0.6} ${-h * 0.94} Q${h * 0.05 + sw} ${-h * 0.72} ${h * 0.04} ${-h * 0.52}Z`);
    };
    g.tick(0);
  }
  return g;
});
