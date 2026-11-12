// A book (open: true spreads two pages over the hand; open: false is a closed hardcover held at the spine).
ZS.define("bookHeld", { about: "a hardcover or textbook, open or closed, about 24 cm", kind: "prop", grip: "two", grip2: [38, 0], base: [0, 0.15], tags: ["school", "work", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 80, seed = 1, color, open = false, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const c = color || k.pick(r, k.CLOTHS), dk = k.dark(c, 0.2), pg = "#fcf8ee";
  if (open) {
    const w = h * 1.35;
    k.P(g, `M${-w * 0.5} ${-h * 0.72} L0 ${-h * 0.64} L${w * 0.5} ${-h * 0.72} L${w * 0.5} ${h * 0.06} L0 ${h * 0.14} L${-w * 0.5} ${h * 0.06}Z`, c);
    k.P(g, `M${-w * 0.46} ${-h * 0.76} Q${-w * 0.22} ${-h * 0.82} 0 ${-h * 0.68} L0 ${h * 0.08} Q${-w * 0.22} ${-h * 0.04} ${-w * 0.46} ${0}Z`, pg);
    k.P(g, `M0 ${-h * 0.68} Q${w * 0.22} ${-h * 0.82} ${w * 0.46} ${-h * 0.76} L${w * 0.46} 0 Q${w * 0.22} ${-h * 0.04} 0 ${h * 0.08}Z`, k.dark(pg, 0.08));
    for (let i = 0; i < 4; i++) {
      const ly = -h * (0.58 - i * 0.13);
      k.R(g, -w * 0.38, ly, w * 0.3, h * 0.03, "#9ca4ac", 1);
      k.R(g, w * 0.08, ly, w * 0.3, h * 0.03, "#9ca4ac", 1);
    }
  } else {
    const w = h * 0.74;
    k.R(g, -w * 0.1, -h * 0.85, w * 0.88, h, dk, 4);
    k.R(g, -w * 0.06, -h * 0.88, w * 0.84, h * 0.96, pg, 3);
    k.R(g, -w * 0.12, -h * 0.9, w * 0.86, h, c, 4);
    k.R(g, -w * 0.12, -h * 0.9, w * 0.12, h, dk, 3);
    k.R(g, w * 0.08, -h * 0.68, w * 0.48, h * 0.16, "#f4efe6", 2);
  }
  return g;
});
