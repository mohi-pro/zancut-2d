// A golden winner's cup trophy on a dark wood pedestal; grip (0,0) is at the slender stem above the base.
ZS.define("trophy", { about: "a golden winner's trophy cup on a wooden base, about 28 cm", kind: "prop", grip: "grip", base: [0, 0.32], tags: ["school", "sport", "bangladesh"] }, (layer, o, k) => {
  const { h = 96, seed = 1, color = "#e8b428", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.18), lt = k.light(color, 0.24);
  k.P(g, `M${-h * 0.24} ${-h * 0.62} C${-h * 0.48} ${-h * 0.62} ${-h * 0.44} ${-h * 0.26} ${-h * 0.16} ${-h * 0.24} L${-h * 0.16} ${-h * 0.32} C${-h * 0.34} ${-h * 0.34} ${-h * 0.36} ${-h * 0.54} ${-h * 0.22} ${-h * 0.54}Z`, dk);
  k.P(g, `M${h * 0.24} ${-h * 0.62} C${h * 0.48} ${-h * 0.62} ${h * 0.44} ${-h * 0.26} ${h * 0.16} ${-h * 0.24} L${h * 0.16} ${-h * 0.32} C${h * 0.34} ${-h * 0.34} ${h * 0.36} ${-h * 0.54} ${h * 0.22} ${-h * 0.54}Z`, dk);
  k.R(g, -h * 0.06, -h * 0.22, h * 0.12, h * 0.34, color, 2);
  k.E(g, 0, 0, h * 0.09, h * 0.045, dk);
  k.P(g, `M${-h * 0.28} ${-h * 0.68} L${h * 0.28} ${-h * 0.68} C${h * 0.26} ${-h * 0.28} ${h * 0.14} ${-h * 0.16} 0 ${-h * 0.16} C${-h * 0.14} ${-h * 0.16} ${-h * 0.26} ${-h * 0.28} ${-h * 0.28} ${-h * 0.68}Z`, color);
  k.P(g, `M0 ${-h * 0.68} L${h * 0.28} ${-h * 0.68} C${h * 0.26} ${-h * 0.28} ${h * 0.14} ${-h * 0.16} 0 ${-h * 0.16}Z`, dk, 0.4);
  k.R(g, -h * 0.18, -h * 0.64, h * 0.07, h * 0.32, lt, 3);
  k.R(g, -h * 0.22, h * 0.12, h * 0.44, h * 0.2, "#4a3222", 3);
  k.R(g, -h * 0.12, h * 0.17, h * 0.24, h * 0.09, color, 1);
  return g;
});
