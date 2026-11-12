// A handheld wooden protest or welcome placard sign (with option text in Bangla or English), gripped on the stick at (0,0).
ZS.define("placard", { about: "a handheld placard sign on a wooden stick, about 75 cm", kind: "prop", grip: "grip", base: [0, 0.32], tags: ["everyday", "school", "city", "bangladesh"] }, (layer, o, k) => {
  const { h = 135, seed = 1, color = "#fffaf0", color2 = "#d8452f", text = "স্বাগতম", flip } = o;
  const g = k.group(layer, 0, 0, flip), w = h * 0.84;
  k.R(g, -h * 0.028, -h * 0.42, h * 0.056, h * 0.74, "#8c6238", 2);
  k.R(g, -w / 2, -h * 0.88, w, h * 0.52, color2, 5);
  k.R(g, -w * 0.45, -h * 0.84, w * 0.9, h * 0.44, color, 3);
  if (text) {
    const t = k.el("text", { x: 0, y: -h * 0.58, "text-anchor": "middle", fill: "#1c1420", "font-family": "'Hind Siliguri', sans-serif", "font-size": h * 0.14, "font-weight": "700" }, g);
    t.textContent = text;
  }
  return g;
});
