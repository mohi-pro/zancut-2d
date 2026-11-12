// Open laptop seen from the front at table height, lid tilted back with a clean unobstructed screen area.
ZS.define("laptopFront", {
  about: "an open laptop seen from the front at table height, lid tilted back and screen area clear",
  kind: "set",
  tags: ["office", "desk", "tech", "interior"],
  aliases: ["open laptop", "laptop on desk", "computer front view", "ল্যাপটপ", "টেবিলের ল্যাপটপ"]
}, (layer, o, k) => {
  const { x = 0, y = 0, h = 160, seed = 1, color = "#5b6472", on = true, lit = false, flip } = o;
  const g = k.group(layer, x, y, flip), r = k.rngOf(seed);
  const w = h * (1.06 + (r() - 0.5) * 0.03);
  const baseH = h * 0.12, deckH = h * 0.14, lidTop = -h, lidBot = -baseH;
  const topW = w * 0.94, botW = w * 0.98;

  k.ground(g, w * 1.06, h * 0.05);

  // Outer lid shell (tilted slightly back from the viewer, top-left lit bevel)
  k.P(g, `M${-topW / 2 - h * 0.014} ${lidTop - h * 0.01} L${topW / 2 + h * 0.014} ${lidTop - h * 0.01} L${botW / 2 + h * 0.01} ${lidBot} L${-botW / 2 - h * 0.01} ${lidBot}Z`, k.light(color, 0.18));
  k.P(g, `M${-topW / 2} ${lidTop} L${topW / 2} ${lidTop} L${botW / 2} ${lidBot} L${-botW / 2} ${lidBot}Z`, k.dark(color, 0.16));

  // Clear open screen area (unobstructed so content/glow reads cleanly)
  const bezel = h * 0.052, scrTop = lidTop + bezel, scrBot = lidBot - bezel * 0.88;
  const scrTopW = topW - bezel * 1.7, scrBotW = botW - bezel * 1.7;
  const scrFill = on || lit ? "#d8eef8" : "#27313f";
  k.P(g, `M${-scrTopW / 2} ${scrTop} L${scrTopW / 2} ${scrTop} L${scrBotW / 2} ${scrBot} L${-scrBotW / 2} ${scrBot}Z`, scrFill);
  if (on || lit) {
    // Subtle top-left screen sheen leaving the central screen area completely clear
    k.P(g, `M${-scrTopW / 2} ${scrTop} L${-scrTopW * 0.14} ${scrTop} L${-scrBotW * 0.3} ${scrBot} L${-scrBotW / 2} ${scrBot}Z`, k.light(scrFill, 0.22), 0.55);
  }
  // Tiny webcam dot on top bezel
  k.C(g, 0, lidTop + bezel * 0.48, h * 0.009, k.dark(color, 0.35));

  // Hinge cylinder
  k.R(g, -botW * 0.36, lidBot - h * 0.018, botW * 0.72, h * 0.026, k.dark(color, 0.32), h * 0.01);

  // Foreshortened keyboard deck receding to the hinge
  const frontW = w * 1.04;
  k.P(g, `M${-botW / 2} ${lidBot} L${botW / 2} ${lidBot} L${frontW / 2} ${-baseH * 0.38} L${-frontW / 2} ${-baseH * 0.38}Z`, k.light(color, 0.12));
  // Recessed keyboard well
  k.P(g, `M${-botW * 0.42} ${lidBot + deckH * 0.16} L${botW * 0.42} ${lidBot + deckH * 0.16} L${frontW * 0.43} ${-baseH * 0.58} L${-frontW * 0.43} ${-baseH * 0.58}Z`, k.dark(color, 0.26));
  // Trackpad rectangle on front deck
  k.R(g, -frontW * 0.11, -baseH * 0.54, frontW * 0.22, baseH * 0.14, k.dark(color, 0.08), h * 0.008);

  // Front edge of the laptop chassis resting on the tabletop
  k.R(g, -frontW / 2, -baseH * 0.4, frontW, baseH * 0.4, color, h * 0.018);
  k.R(g, 0, -baseH * 0.4, frontW / 2, baseH * 0.4, k.dark(color, 0.12), h * 0.018);
  // Thumb notch on the front lip
  k.R(g, -frontW * 0.07, -baseH * 0.4, frontW * 0.14, baseH * 0.16, k.dark(color, 0.28), h * 0.008);

  return g;
});
