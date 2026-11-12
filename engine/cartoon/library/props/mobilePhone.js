// A smartphone held in the hand around its middle (0,0) with screen on/off and subtle notification glow.
ZS.define("mobilePhone", { about: "a smartphone held in the hand, about 15 cm", kind: "prop", grip: "grip", base: [0, 0.5], tags: ["everyday", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 68, seed = 1, color = "#242830", on = true, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), ph = r() * 6.28, w = h * 0.52;
  k.R(g, -w / 2, -h / 2, w, h, color, h * 0.08);
  const scr = k.R(g, -w * 0.43, -h * 0.43, w * 0.86, h * 0.84, on ? "#68b8e8" : "#181b20", h * 0.05);
  k.R(g, -w * 0.14, -h * 0.46, w * 0.28, h * 0.025, "#14161a", 1);
  if (on) {
    k.R(g, -w * 0.34, -h * 0.3, w * 0.68, h * 0.16, "#fff6e6", 3);
    k.R(g, -w * 0.34, -h * 0.08, w * 0.48, h * 0.12, "#d8f0fc", 3);
    k.C(g, -w * 0.22, h * 0.26, h * 0.055, "#5a8f3c");
    k.C(g, 0, h * 0.26, h * 0.055, "#d8452f");
    k.C(g, w * 0.22, h * 0.26, h * 0.055, "#e0a02c");
    g.tick = (t) => {
      scr.setAttribute("opacity", (0.86 + Math.sin(t * 3.2 + ph) * 0.14).toFixed(3));
    };
    g.tick(0);
  }
  return g;
});
