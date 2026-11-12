// An aluminium tea-stall kettle held by its arched top handle at (0,0) with curved pouring spout and steam.
ZS.define("kettleHeld", { about: "a held aluminium tea kettle with a pouring spout, about 24 cm", kind: "prop", grip: "grip", base: [0, 0.86], tags: ["food", "tea", "street", "bangladesh"] }, (layer, o, k) => {
  const { h = 95, seed = 1, color = "#b8c0c8", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = k.light(color, 0.22);
  k.R(g, -h * 0.16, -h * 0.05, h * 0.32, h * 0.08, "#282424", 4);
  k.P(g, `M${-h * 0.28} ${h * 0.32} C${-h * 0.32} ${-h * 0.04} ${h * 0.32} ${-h * 0.04} ${h * 0.28} ${h * 0.32} L${h * 0.22} ${h * 0.32} C${h * 0.24} ${h * 0.04} ${-h * 0.24} ${h * 0.04} ${-h * 0.22} ${h * 0.32}Z`, dk);
  k.P(g, `M${h * 0.26} ${h * 0.62} C${h * 0.48} ${h * 0.56} ${h * 0.56} ${h * 0.32} ${h * 0.64} ${h * 0.24} L${h * 0.56} ${h * 0.18} C${h * 0.46} ${h * 0.28} ${h * 0.4} ${h * 0.44} ${h * 0.22} ${h * 0.46}Z`, dk);
  k.E(g, 0, h * 0.56, h * 0.42, h * 0.3, color);
  k.P(g, `M0 ${h * 0.26} A${h * 0.42} ${h * 0.3} 0 0 1 0 ${h * 0.86}Z`, dk, 0.45);
  k.E(g, -h * 0.14, h * 0.48, h * 0.12, h * 0.16, lt, 0.6);
  k.E(g, 0, h * 0.28, h * 0.22, h * 0.06, dk);
  k.C(g, 0, h * 0.22, h * 0.045, "#282424");
  const st = k.P(g, "", "#fff6e6", 0.55);
  g.tick = (t) => {
    const sw = Math.sin(t * 2.6 + ph) * h * 0.08;
    st.setAttribute("d", `M${h * 0.62} ${h * 0.18} Q${h * 0.72 + sw} ${h * 0.02} ${h * 0.68 - sw} ${-h * 0.16} L${h * 0.74 - sw} ${-h * 0.16} Q${h * 0.78 + sw} ${h * 0.02} ${h * 0.66} ${h * 0.2}Z`);
  };
  g.tick(0);
  return g;
});
