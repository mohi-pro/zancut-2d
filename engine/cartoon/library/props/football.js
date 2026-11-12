// A classic black-and-white panelled football (soccer ball) held with two hands or resting on a palm.
ZS.define("football", { about: "a black-and-white football, about 22 cm", kind: "prop", grip: "two", grip2: [36, 0], base: [0.2, 0.38], tags: ["sport", "play", "school", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 74, seed = 1, color = "#f7f4ec", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.18), blk = "#242228", cx = h * 0.2, r0 = h * 0.44;
  k.C(g, cx, -h * 0.06, r0, color);
  k.P(g, `M${cx} ${-h * 0.06 - r0} A${r0} ${r0} 0 0 1 ${cx} ${-h * 0.06 + r0}Z`, dk, 0.42);
  k.C(g, cx, -h * 0.06, r0 * 0.34, blk);
  for (let a = 0; a < 5; a++) {
    const ang = a * 1.256 - 0.3;
    k.C(g, cx + Math.cos(ang) * r0 * 0.66, -h * 0.06 + Math.sin(ang) * r0 * 0.66, r0 * 0.2, blk);
  }
  return g;
});
