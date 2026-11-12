// Wooden table seen from straight above, with a few loose items arranged around a clear central surface.
ZS.define("tableTopView", {
  about: "a warm wooden table seen from straight above, with a few loose items near the edges",
  kind: "set",
  tags: ["interior", "office", "table", "topDown"],
  aliases: ["table from above", "top view desk", "overhead table", "উপর থেকে টেবিল", "টেবিলের উপরিভাগ"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 220, seed = 1, color = "#b57c4a", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const w = h * 1.12, topH = h * 0.78, topY = -topH - h * 0.04, rx = h * 0.04, rim = h * 0.028;

  // Ambient drop shadow on the floor underneath the tabletop
  k.R(g, -w / 2 + h * 0.02, topY + h * 0.025, w, topH, "#1c1420", rx * 1.1);
  g.lastChild.setAttribute("opacity", "0.18");

  // Outer table rim (top-left lit, bottom-right shaded)
  k.R(g, -w / 2, topY, w, topH, k.dark(color, 0.16), rx);
  k.R(g, -w / 2, topY, w - h * 0.01, topH - h * 0.01, k.light(color, 0.16), rx);

  // Main wooden surface
  k.R(g, -w / 2 + rim, topY + rim, w - rim * 2, topH - rim * 2, color, rx * 0.7);

  // Subtle horizontal wood plank seams and warm grain streaks
  for (let i = 1; i <= 3; i++) {
    const py = topY + (topH * i) / 4;
    k.R(g, -w / 2 + rim, py, w - rim * 2, h * 0.005, k.dark(color, 0.12));
  }
  for (let i = 0; i < 5; i++) {
    const gx = -w * 0.36 + r() * w * 0.52, gy = topY + topH * (0.18 + r() * 0.65);
    k.R(g, gx, gy, w * (0.14 + r() * 0.12), h * 0.007, k.light(color, 0.12), h * 0.004);
  }

  // Loose item 1: A4 notepad/sheet near top-left corner
  const padX = -w * 0.38, padY = topY + topH * 0.14, padW = w * 0.18, padH = topH * 0.34;
  k.R(g, padX + h * 0.007, padY + h * 0.009, padW, padH, "#1c1420", h * 0.008);
  g.lastChild.setAttribute("opacity", "0.14");
  k.R(g, padX, padY, padW, padH, "#fffaf0", h * 0.008);
  k.R(g, padX, padY, padW, padH * 0.13, "#2f6fb0", h * 0.007);
  for (let i = 0; i < 4; i++) {
    k.R(g, padX + padW * 0.14, padY + padH * (0.28 + i * 0.15), padW * (0.5 + r() * 0.22), h * 0.01, "#9aa3ad", 2);
  }

  // Loose item 2: Pen resting beside the pad
  const penX = padX + padW + w * 0.028, penY = padY + padH * 0.16;
  k.R(g, penX, penY, w * 0.015, padH * 0.7, "#2d7f8c", w * 0.006);
  k.R(g, penX, penY, w * 0.015, padH * 0.18, "#e0a02c", w * 0.006);

  // Loose item 3: Warm yellow sticky note near bottom-left
  const noteX = -w * 0.37, noteY = topY + topH * 0.68, noteS = topH * 0.17;
  k.R(g, noteX, noteY, noteS, noteS, "#f2c94c", h * 0.008);
  k.R(g, noteX, noteY, noteS, noteS * 0.2, k.light("#f2c94c", 0.2), h * 0.008);

  // Loose item 4: Tea cup on saucer seen from straight above near top-right
  const cupX = w * 0.31, cupY = topY + topH * 0.28, saucerR = h * 0.078, cupR = h * 0.05;
  k.C(g, cupX + h * 0.007, cupY + h * 0.009, saucerR, "#1c1420", 0.15);
  k.C(g, cupX, cupY, saucerR, "#ebe4d8");
  k.C(g, cupX, cupY, saucerR * 0.68, "#d9d0c1");
  k.R(g, cupX + cupR * 0.72, cupY - h * 0.01, h * 0.025, h * 0.02, "#fffaf0", h * 0.007);
  k.C(g, cupX, cupY, cupR, "#fffaf0");
  k.C(g, cupX, cupY, cupR * 0.78, "#9c5a2e");
  k.C(g, cupX - cupR * 0.22, cupY - cupR * 0.22, cupR * 0.22, "#c98a58", 0.55);

  return g;
});
