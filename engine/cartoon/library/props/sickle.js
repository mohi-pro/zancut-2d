// A curved paddy-harvesting sickle (kaste) with wooden handle gripped at (0,0) and crescent steel blade above.
ZS.define("sickle", { about: "a curved paddy-harvesting sickle (kaste), about 32 cm", kind: "prop", grip: "grip", base: [0, 0.22], tags: ["work", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { h = 82, seed = 1, color = "#7a4e2c", flip } = o;
  const g = k.group(layer, 0, 0, flip), st = "#7e8892", lt = "#b4bec8";
  k.R(g, -h * 0.055, -h * 0.16, h * 0.11, h * 0.38, color, 4);
  k.R(g, -h * 0.045, -h * 0.22, h * 0.09, h * 0.07, "#42484e", 2);
  k.P(g, `M0 ${-h * 0.2} C${-h * 0.1} ${-h * 0.62} ${h * 0.38} ${-h * 0.84} ${h * 0.44} ${-h * 0.46} C${h * 0.32} ${-h * 0.68} ${h * 0.04} ${-h * 0.5} ${h * 0.04} ${-h * 0.2}Z`, st);
  k.P(g, `M${h * 0.04} ${-h * 0.24} C${h * 0.04} ${-h * 0.5} ${h * 0.3} ${-h * 0.66} ${h * 0.42} ${-h * 0.47} C${h * 0.28} ${-h * 0.58} ${h * 0.08} ${-h * 0.44} ${h * 0.04} ${-h * 0.2}Z`, lt);
  return g;
});
