// A wooden inspection or teacher's clipboard with metal clip and checklist paper; gripped at side edge (0,0).
ZS.define("clipboard", { about: "a wooden clipboard with a metal clip and paper, about 32 cm", kind: "prop", grip: "pinch", base: [0.24, 0.12], tags: ["work", "school", "bangladesh"] }, (layer, o, k) => {
  const { h = 92, seed = 1, color = "#9c683c", flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed), w = h * 0.72, cx = w * 0.25;
  k.R(g, cx - w / 2, -h * 0.88, w, h, color, 5);
  k.R(g, cx - w * 0.42, -h * 0.8, w * 0.84, h * 0.86, "#fffaf0", 2);
  k.R(g, cx - w * 0.22, -h * 0.93, w * 0.44, h * 0.11, "#9aa4ae", 3);
  k.C(g, cx, -h * 0.94, h * 0.035, "#68727c");
  for (let i = 0; i < 5; i++) {
    const ly = -h * (0.64 - i * 0.12);
    k.R(g, cx - w * 0.32, ly, h * 0.04, h * 0.04, "#5a8f3c", 1);
    k.R(g, cx - w * 0.2, ly + h * 0.005, w * (0.36 + r() * 0.18), h * 0.03, "#8b95a0", 1);
  }
  return g;
});
