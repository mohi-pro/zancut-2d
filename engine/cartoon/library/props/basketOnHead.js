// A woven bamboo village head-basket (tukri / jhuri) carried with two hands on the head; base [0,0] rests on the head's top.
ZS.define("basketOnHead", { about: "a woven bamboo basket (tukri) carried on the head, about 42 cm across", kind: "prop", grip: "two", grip2: [48, -12], base: [0, 0], tags: ["work", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { h = 72, seed = 1, color = "#c89b58", full = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.2), lt = k.light(color, 0.18), w = h * 1.65;
  if (full) {
    k.E(g, -w * 0.16, -h * 0.56, w * 0.22, h * 0.18, "#5a8f3c");
    k.E(g, w * 0.14, -h * 0.54, w * 0.22, h * 0.16, "#d8452f");
    k.E(g, 0, -h * 0.62, w * 0.2, h * 0.15, "#e0a02c");
  }
  k.P(g, `M${-w * 0.5} ${-h * 0.5} L${w * 0.5} ${-h * 0.5} C${w * 0.42} ${-h * 0.06} ${w * 0.24} 0 0 0 C${-w * 0.24} 0 ${-w * 0.42} ${-h * 0.06} ${-w * 0.5} ${-h * 0.5}Z`, color);
  k.P(g, `M0 ${-h * 0.5} L${w * 0.5} ${-h * 0.5} C${w * 0.42} ${-h * 0.06} ${w * 0.24} 0 0 0Z`, dk, 0.42);
  for (const ry of [-0.36, -0.2]) k.R(g, -w * 0.42, h * ry, w * 0.84, h * 0.04, dk, 2);
  k.R(g, -w * 0.53, -h * 0.54, w * 1.06, h * 0.08, lt, 4);
  return g;
});
