// A brown leather bifold wallet with a peeking green Taka note, gripped at (0,0).
ZS.define("walletHeld", { about: "a folded leather wallet with a banknote peeking out, about 11 cm", kind: "prop", grip: "grip", base: [0.15, 0.38], tags: ["everyday", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 56, seed = 1, color = "#6e4228", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.16), w = h * 1.25;
  k.R(g, -w * 0.28, -h * 0.52, w * 0.76, h * 0.3, "#4a8c5c", 2);
  k.R(g, -w * 0.36, -h * 0.38, w * 0.92, h * 0.76, dk, 5);
  k.R(g, -w * 0.4, -h * 0.34, w * 0.92, h * 0.74, color, 5);
  k.R(g, -w * 0.36, -h * 0.3, w * 0.84, h * 0.08, lt, 2);
  k.P(g, `M${w * 0.18} ${-h * 0.08} L${w * 0.54} ${-h * 0.08} L${w * 0.54} ${h * 0.14} L${w * 0.18} ${h * 0.14} C${w * 0.1} ${h * 0.14} ${w * 0.1} ${-h * 0.08} ${w * 0.18} ${-h * 0.08}Z`, dk);
  k.C(g, w * 0.22, h * 0.03, h * 0.045, "#d8a848");
  return g;
});
