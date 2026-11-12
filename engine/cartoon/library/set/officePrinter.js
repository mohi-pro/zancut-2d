// Compact desktop office laser/inkjet printer with top rear input paper tray and front output sheet.
ZS.define("officePrinter", {
  about: "a compact desktop office printer with a rear paper tray and printed sheet in the front tray",
  kind: "set",
  tags: ["office", "tech", "desk", "printer"],
  aliases: ["printer", "desk printer", "office copier", "প্রিন্টার", "অফিস প্রিন্টার"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 180, seed = 1, color = "#d8d4cc", color2 = "#3f4652", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const w = h * (0.98 + (r() - 0.5) * 0.03);
  const bodyH = h * 0.62, trayH = h * 0.38;

  k.ground(g, w * 1.04, h * 0.055);

  // Rear upright paper tray support & blank white sheets sticking up
  const trayW = w * 0.56, paperW = w * 0.48;
  k.R(g, -trayW / 2, -h * 0.94, trayW, trayH * 0.9, k.dark(color2, 0.14), h * 0.02);
  k.R(g, -paperW / 2, -h, paperW, trayH * 0.96, "#fffaf0", h * 0.012);
  k.R(g, paperW * 0.18, -h, paperW * 0.32, trayH * 0.96, "#efe9dc", h * 0.012);

  // Main printer body (rounded rectangular housing, top-left lit, right side shaded)
  k.R(g, -w / 2, -bodyH, w, bodyH, color, h * 0.045);
  k.R(g, w * 0.16, -bodyH, w * 0.34, bodyH, k.dark(color, 0.12), h * 0.045);

  // Top scanner lid with top-left highlight
  const lidH = bodyH * 0.22;
  k.R(g, -w * 0.48, -bodyH - lidH * 0.35, w * 0.96, lidH, k.light(color, 0.16), h * 0.03);
  k.R(g, -w * 0.48, -bodyH + lidH * 0.48, w * 0.96, h * 0.018, k.dark(color, 0.18));

  // Dark charcoal center recessed band & control panel on left
  k.R(g, -w * 0.44, -bodyH * 0.72, w * 0.88, bodyH * 0.22, color2, h * 0.02);
  k.R(g, -w * 0.38, -bodyH * 0.66, w * 0.14, bodyH * 0.1, "#9fd9e8", h * 0.01);
  k.C(g, -w * 0.18, -bodyH * 0.61, h * 0.018, "#4caf50");
  k.C(g, -w * 0.12, -bodyH * 0.61, h * 0.018, "#e0a02c");

  // Front output slot and dark tray lip
  const outW = w * 0.62, outY = -bodyH * 0.32;
  k.R(g, -outW / 2, outY, outW, bodyH * 0.22, k.dark(color2, 0.18), h * 0.016);
  k.R(g, -outW * 0.54, -bodyH * 0.12, outW * 1.08, h * 0.045, color2, h * 0.012);

  // Printed page emerging forward onto the output tray
  const outPaperW = w * 0.46;
  k.P(g, `M${-outPaperW / 2} ${outY + h * 0.04} L${outPaperW / 2} ${outY + h * 0.04} L${outPaperW * 0.56} ${-h * 0.03} L${-outPaperW * 0.56} ${-h * 0.03}Z`, "#fffaf0");
  for (let i = 0; i < 3; i++) {
    const ly = outY + h * (0.08 + i * 0.045);
    k.R(g, -outPaperW * 0.34, ly, outPaperW * (0.45 + r() * 0.2), h * 0.014, "#8b95a0", 1);
  }

  return g;
});
