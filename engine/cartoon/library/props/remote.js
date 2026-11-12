// A television or AC remote control with red power button and channel keypad, gripped around the lower half (0,0).
ZS.define("remote", { about: "a TV or AC remote control with keypad buttons, about 17 cm", kind: "prop", grip: "grip", base: [0, 0.42], tags: ["everyday", "home", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 64, seed = 1, color = "#2c3038", flip } = o;
  const g = k.group(layer, 0, 0, flip), dk = k.dark(color, 0.22), w = h * 0.46;
  k.R(g, -w / 2, -h * 0.58, w, h, color, h * 0.06);
  k.R(g, 0, -h * 0.58, w / 2, h, dk, h * 0.04);
  k.C(g, -w * 0.22, -h * 0.46, h * 0.045, "#d8452f");
  k.C(g, 0, -h * 0.24, h * 0.1, "#4a525e");
  k.C(g, 0, -h * 0.24, h * 0.045, "#8c96a0");
  for (let row = 0; row < 3; row++) {
    for (const col of [-0.24, 0, 0.24]) {
      k.R(g, w * col - h * 0.025, -h * 0.04 + row * h * 0.11, h * 0.05, h * 0.06, "#78828e", 1);
    }
  }
  return g;
});
