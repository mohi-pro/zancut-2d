// Wooden/upholstered desk chair seen from behind, so a seated character sits naturally in front of its backrest.
ZS.define("chairBackView", {
  about: "a chair seen from behind with a broad backrest, armrests and four legs",
  kind: "set",
  tags: ["interior", "office", "furniture", "chair"],
  aliases: ["chair from behind", "back of chair", "desk chair back", "চেয়ারের পেছন", "চেয়ার"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 230, seed = 1, color = "#7c5234", color2 = "#3b5968", flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const w = h * (0.64 + (r() - 0.5) * 0.03);
  const seatY = -h * 0.46, seatH = h * 0.075, legW = w * 0.085;

  k.ground(g, w * 1.05, h * 0.055);

  // Slightly foreshortened front legs (tucked slightly inward and darker)
  k.R(g, -w * 0.34, seatY, legW * 0.85, -seatY - h * 0.03, k.dark(color, 0.26), legW * 0.25);
  k.R(g, w * 0.34 - legW * 0.85, seatY, legW * 0.85, -seatY - h * 0.03, k.dark(color, 0.32), legW * 0.25);

  // Seat cushion & wooden seat apron
  k.R(g, -w * 0.48, seatY - seatH * 0.45, w * 0.96, seatH * 0.7, color2, h * 0.025);
  k.R(g, -w * 0.46, seatY, w * 0.92, seatH, k.dark(color, 0.1), h * 0.02);

  // Curved armrests on left and right sides
  const armY = -h * 0.66, armW = w * 0.09, armH = h * 0.21;
  k.R(g, -w * 0.52, armY, armW, armH, color, armW * 0.4);
  k.R(g, w * 0.52 - armW, armY, armW, armH, k.dark(color, 0.16), armW * 0.4);
  k.R(g, -w * 0.54, armY, armW * 1.25, h * 0.04, k.light(color, 0.16), h * 0.015);
  k.R(g, w * 0.54 - armW * 1.25, armY, armW * 1.25, h * 0.04, color, h * 0.015);

  // Rear legs continuing up into the backrest side stiles
  k.R(g, -w * 0.42, -h * 0.96, legW, h * 0.96, color, legW * 0.35);
  k.R(g, -w * 0.42, -h * 0.96, legW * 0.4, h * 0.96, k.light(color, 0.16), legW * 0.2);
  k.R(g, w * 0.42 - legW, -h * 0.96, legW, h * 0.96, k.dark(color, 0.14), legW * 0.35);
  // Lower rear cross-stretcher bar between back legs
  k.R(g, -w * 0.38, -h * 0.2, w * 0.76, h * 0.04, k.dark(color, 0.18));

  // Backrest outer wooden frame & upholstered/panelled back seen from behind
  const backW = w * 0.88, backH = h * 0.48, backTop = -h;
  k.R(g, -backW / 2, backTop, backW, backH, color, h * 0.045);
  k.R(g, -backW / 2, backTop, backW, backH * 0.12, k.light(color, 0.18), h * 0.04);
  k.R(g, 0, backTop, backW / 2, backH, k.dark(color, 0.12), h * 0.045);

  // Recessed rear cushion panel & center vertical spine plate
  const padW = backW * 0.78, padH = backH * 0.72;
  k.R(g, -padW / 2, backTop + backH * 0.14, padW, padH, k.dark(color2, 0.08), h * 0.03);
  k.R(g, -w * 0.06, backTop + backH * 0.18, w * 0.12, backH * 0.84, k.dark(color, 0.2), h * 0.02);

  return g;
});
