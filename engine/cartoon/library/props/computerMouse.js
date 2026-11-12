// Ergonomic desk computer mouse; grip point (0, 0) is the top arch where the palm and fingers rest.
ZS.define("computerMouse", {
  about: "a rounded desk computer mouse with a scroll wheel, about 11 cm",
  kind: "prop",
  grip: "flat",
  base: [0, 10],
  tags: ["office", "tech", "desk"],
  aliases: ["mouse", "desk mouse", "wireless mouse", "কম্পিউটার মাউস", "মাউস"]
}, (layer, o, k) => {
  const { h = 48, seed = 1, color = "#4a525e", color2 = "#2d7f8c" } = o;
  const g = k.group(layer, 0, 0);
  const mh = h * 0.52, w = mh * 1.54, topY = -mh * 0.68, botY = mh * 0.32;

  // Soft contact shadow under the mouse base
  k.E(g, 0, botY, w * 0.52, mh * 0.1, "#1c1420", 0.18);

  // Dark lower chassis base plate
  k.P(g, `M${-w * 0.48} ${botY} C${-w * 0.5} ${topY * 0.2} ${-w * 0.28} ${topY * 0.85} 0 ${topY * 0.88} C${w * 0.34} ${topY * 0.85} ${w * 0.5} ${topY * 0.1} ${w * 0.48} ${botY}Z`, k.dark(color, 0.24));

  // Arched upper shell around grip point (0, 0)
  k.P(g, `M${-w * 0.47} ${botY - mh * 0.08} C${-w * 0.48} ${topY * 0.35} ${-w * 0.24} ${topY} ${-w * 0.02} ${topY} C${w * 0.28} ${topY} ${w * 0.48} ${topY * 0.25} ${w * 0.47} ${botY - mh * 0.08}Z`, color);

  // Top-left light highlight along the upper arch
  k.P(g, `M${-w * 0.4} ${botY - mh * 0.18} C${-w * 0.38} ${topY * 0.35} ${-w * 0.18} ${topY * 0.92} ${w * 0.04} ${topY * 0.9} C${-w * 0.08} ${topY * 0.55} ${-w * 0.22} ${topY * 0.15} ${-w * 0.4} ${botY - mh * 0.18}Z`, k.light(color, 0.18));

  // Button split seam and raised scroll wheel on the front slope (+x side)
  k.R(g, w * 0.1, topY * 0.52, w * 0.28, mh * 0.035, k.dark(color, 0.32), mh * 0.015);
  k.R(g, w * 0.2, topY * 0.68, w * 0.13, mh * 0.14, color2, mh * 0.04);
  k.R(g, w * 0.22, topY * 0.68, w * 0.09, mh * 0.05, k.light(color2, 0.22), mh * 0.02);

  return g;
});
