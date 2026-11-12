// A village haystack (khor-er gada) round a bamboo pole: a set piece. x, y = the ground under its middle; h = its height in px.
// Everything comes from the options and the seed (never Math.random); flat fills, light from the top left, no outlines.
ZS.define("haystack", { about: "a rounded village haystack on a bamboo pole", kind: "set", tags: ["village", "bangladesh", "field"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 220, seed = 1, color = "#d8b25a", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed), w = h * (0.9 + r() * 0.25);
  k.ground(g, w * 1.1);
  k.R(g, -h * 0.02, -h * 1.12, h * 0.04, h * 0.3, "#7a5a36");                       // the pole's top above the straw
  k.P(g, `M${-w / 2} 0 C${-w * 0.52} ${-h * 0.55} ${-w * 0.2} ${-h} 0 ${-h * 0.98} C${w * 0.2} ${-h} ${w * 0.52} ${-h * 0.55} ${w / 2} 0Z`, color);
  k.P(g, `M${w * 0.08} ${-h * 0.96} C${w * 0.3} ${-h * 0.88} ${w * 0.5} ${-h * 0.5} ${w / 2} 0 L${w * 0.12} 0 C${w * 0.22} ${-h * 0.4} ${w * 0.2} ${-h * 0.75} ${w * 0.08} ${-h * 0.96}Z`, k.dark(color, 0.16));
  for (let i = 0; i < 7; i++) { const a = -w * 0.36 + r() * w * 0.6, b = -h * (0.15 + r() * 0.7); k.R(g, a, b, w * (0.1 + r() * 0.12), h * 0.012, k.light(color, 0.22), 2); }
  return g;
});
