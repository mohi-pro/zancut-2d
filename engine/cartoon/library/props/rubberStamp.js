// Wooden-handled office rubber hand stamp; grip point (0, 0) is the contoured knob/neck where the fingers close around it.
ZS.define("rubberStamp", {
  about: "a wooden-handled office rubber stamp with metal mount and crimson ink pad, about 10 cm",
  kind: "prop",
  grip: "grip",
  base: [0, 26],
  tags: ["office", "desk", "stamp", "work"],
  aliases: ["hand stamp", "office stamp", "seal stamp", "রাবার স্ট্যাম্প", "সিলমোহর"]
}, (layer, o, k) => {
  const { h = 76, seed = 1, color = "#9c5a2e", color2 = "#c83e37" } = o;
  const g = k.group(layer, 0, 0);
  const sh = h * 0.78, baseW = sh * 0.72, baseY = sh * 0.36;

  // Soft contact shadow when resting on its base
  k.E(g, 0, baseY, baseW * 0.55, sh * 0.055, "#1c1420", 0.16);

  // Crimson ink-stained rubber die pad at the very bottom
  k.R(g, -baseW * 0.46, baseY - sh * 0.065, baseW * 0.92, sh * 0.065, color2, sh * 0.015);

  // Metallic/dark-grey flared stamp mount housing above the rubber die
  const mountTop = sh * 0.1, mountBot = baseY - sh * 0.055;
  k.P(g, `M${-baseW * 0.24} ${mountTop} L${baseW * 0.24} ${mountTop} L${baseW * 0.5} ${mountBot} L${-baseW * 0.5} ${mountBot}Z`, "#7a828c");
  k.P(g, `M0 ${mountTop} L${baseW * 0.24} ${mountTop} L${baseW * 0.5} ${mountBot} L0 ${mountBot}Z`, k.dark("#7a828c", 0.16));
  k.R(g, -baseW * 0.5, mountBot - sh * 0.055, baseW, sh * 0.06, k.dark("#7a828c", 0.22), sh * 0.015);

  // Brass collar ferrule below the grip neck
  k.R(g, -sh * 0.1, sh * 0.03, sh * 0.2, sh * 0.08, "#d6a95f", sh * 0.015);

  // Turned wooden handle: contoured neck at (0, 0) and rounded mushroom bulb above (-sh * 0.62 to +sh * 0.04)
  k.P(g, `M${-sh * 0.085} ${sh * 0.04} C${-sh * 0.07} ${-sh * 0.1} ${-sh * 0.24} ${-sh * 0.24} ${-sh * 0.24} ${-sh * 0.42} C${-sh * 0.24} ${-sh * 0.56} ${-sh * 0.12} ${-sh * 0.62} 0 ${-sh * 0.62} C${sh * 0.12} ${-sh * 0.62} ${sh * 0.24} ${-sh * 0.56} ${sh * 0.24} ${-sh * 0.42} C${sh * 0.24} ${-sh * 0.24} ${sh * 0.07} ${-sh * 0.1} ${sh * 0.085} ${sh * 0.04}Z`, color);

  // Right-side shade and top-left highlight on the wooden bulb
  k.P(g, `M0 ${-sh * 0.62} C${sh * 0.12} ${-sh * 0.62} ${sh * 0.24} ${-sh * 0.56} ${sh * 0.24} ${-sh * 0.42} C${sh * 0.24} ${-sh * 0.24} ${sh * 0.07} ${-sh * 0.1} ${sh * 0.085} ${sh * 0.04} L0 ${sh * 0.04}Z`, k.dark(color, 0.16));
  k.E(g, -sh * 0.08, -sh * 0.45, sh * 0.065, sh * 0.11, k.light(color, 0.22));

  return g;
});
