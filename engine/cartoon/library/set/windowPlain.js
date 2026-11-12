// Plain wooden-framed window with no curtains and a clear open glass area so a background view can show through.
ZS.define("windowPlain", {
  about: "a plain window frame with no curtains and a clear open glass area so an outside view shows through",
  kind: "set",
  tags: ["interior", "wall", "window", "room"],
  aliases: ["plain window", "open window", "clear window frame", "জানালা", "খোলা জানালা"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 260, seed = 1, color = "#8c5d3c", lit = false, flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const w = h * (0.76 + (r() - 0.5) * 0.04);
  const frameT = h * 0.055, sillH = h * 0.05, sillW = w * 1.12;
  const innerW = w - frameT * 2, innerH = h - frameT * 2 - sillH;
  const innerX = -innerW / 2, innerY = -h + frameT;

  // Soft wall shadow under the sill
  k.R(g, -sillW * 0.48, 0, sillW * 0.96, h * 0.025, "#1c1420");
  g.lastChild.setAttribute("opacity", "0.14");

  // Clear open glass area (subtle sky/night tint at low opacity so any backdrop view shows clearly through)
  const glassTint = lit ? "#1d2a44" : "#cfe9f5";
  k.R(g, innerX, innerY, innerW, innerH, glassTint, h * 0.008);
  g.lastChild.setAttribute("opacity", lit ? "0.28" : "0.22");

  // Subtle corner glass sheen near top-left (leaves the entire center glass area open)
  k.P(g, `M${innerX + h * 0.02} ${innerY + h * 0.02} L${innerX + innerW * 0.22} ${innerY + h * 0.02} L${innerX + h * 0.02} ${innerY + innerH * 0.24}Z`, "#ffffff", 0.28);

  // Outer timber frame built from 4 bars (leaving the interior genuinely open/transparent)
  k.R(g, -w / 2, -h, w, frameT, k.light(color, 0.14), h * 0.01);
  k.R(g, -w / 2, -h + frameT * 0.5, frameT, h - sillH - frameT * 0.5, color);
  k.R(g, w / 2 - frameT, -h + frameT * 0.5, frameT, h - sillH - frameT * 0.5, k.dark(color, 0.14));
  k.R(g, -w / 2, -sillH - frameT, w, frameT, color);

  // Recessed inner casing bevel (top and left in shadow from top-left light, right and bottom lit)
  const bev = h * 0.016;
  k.R(g, innerX, innerY, innerW, bev, k.dark(color, 0.24));
  k.R(g, innerX, innerY, bev, innerH, k.dark(color, 0.2));
  k.R(g, innerX + innerW - bev, innerY, bev, innerH, k.light(color, 0.12));
  k.R(g, innerX, innerY + innerH - bev, innerW, bev, k.light(color, 0.16));

  // Projecting bottom window sill
  k.R(g, -sillW / 2, -sillH, sillW, sillH, k.dark(color, 0.08), h * 0.012);
  k.R(g, -sillW / 2, -sillH, sillW, sillH * 0.36, k.light(color, 0.18), h * 0.01);

  return g;
});
