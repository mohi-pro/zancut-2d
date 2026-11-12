// An acoustic wooden guitar held with two hands: left hand on the neck at (0,0) and right hand over the soundboard.
ZS.define("guitar", { about: "an acoustic wooden guitar, about 95 cm", kind: "prop", grip: "two", grip2: [52, 24], base: [0.35, 0.55], tags: ["music", "play", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 135, seed = 1, color = "#c87d38", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), lt = k.light(color, 0.18);
  const gg = k.el("g", { transform: "rotate(-28)" }, g);
  k.R(gg, -h * 0.04, -h * 0.36, h * 0.08, h * 0.14, "#4a2e1b", 2);
  k.R(gg, -h * 0.03, -h * 0.22, h * 0.06, h * 0.54, "#3a2416");
  k.E(gg, 0, h * 0.36, h * 0.22, h * 0.16, color);
  k.E(gg, 0, h * 0.58, h * 0.3, h * 0.22, color);
  k.P(gg, `M0 ${h * 0.2} C${h * 0.28} ${h * 0.22} ${h * 0.34} ${h * 0.78} 0 ${h * 0.8}Z`, dk, 0.35);
  k.E(gg, -h * 0.12, h * 0.54, h * 0.08, h * 0.12, lt, 0.5);
  k.C(gg, 0, h * 0.4, h * 0.085, "#241812");
  k.R(gg, -h * 0.09, h * 0.58, h * 0.18, h * 0.04, "#3a2416", 1);
  return g;
});
