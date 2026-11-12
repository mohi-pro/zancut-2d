// A fanned bundle of Bangladeshi Taka banknotes (100/500/1000 Tk colours) pinched at the lower corner (0,0).
ZS.define("takaNotes", { about: "fanned Bangladeshi Taka banknotes, about 15 cm", kind: "prop", grip: "pinch", base: [0, 0.1], tags: ["everyday", "work", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { h = 64, seed = 1, color, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const cols = [color || "#4a8c5c", "#5886b4", "#98648c"];
  for (let i = 0; i < 3; i++) {
    const rot = -22 + i * 16, c = cols[i % cols.length], w = h * 0.95, nh = h * 0.46;
    const ng = k.el("g", { transform: `rotate(${rot} 0 0)` }, g);
    k.R(ng, -w * 0.1, -nh * 0.9, w, nh, "#f8f4e8", 3);
    k.R(ng, -w * 0.05, -nh * 0.82, w * 0.9, nh * 0.84, c, 2);
    k.C(ng, w * 0.22, -nh * 0.4, nh * 0.24, k.light(c, 0.26));
    k.R(ng, w * 0.55, -nh * 0.65, w * 0.2, nh * 0.14, k.dark(c, 0.22), 1);
  }
  return g;
});
