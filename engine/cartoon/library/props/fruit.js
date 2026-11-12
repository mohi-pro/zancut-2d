// A fresh Bangladeshi fruit (option kind: mango, banana, apple, litchi, jackfruit, orange) held at (0,0).
ZS.define("fruit", { about: "a ripe fruit (mango, banana, apple, litchi, jackfruit or orange), about 12 cm", kind: "prop", grip: "grip", base: [0, 0.35], tags: ["food", "village", "home", "bangladesh"] }, (layer, o, k) => {
  const { h = 56, seed = 1, color, kind, flip } = o;
  const g = k.group(layer, 0, 0, flip), r = k.rngOf(seed);
  const fn = kind || k.pick(r, ["mango", "banana", "apple", "litchi", "jackfruit", "orange"]);
  if (fn === "banana") {
    const c = color || "#f0c838";
    k.P(g, `M${-h * 0.12} ${-h * 0.52} C${h * 0.38} ${-h * 0.32} ${h * 0.42} ${h * 0.32} ${-h * 0.08} ${h * 0.52} C${h * 0.16} ${h * 0.24} ${h * 0.14} ${-h * 0.24} ${-h * 0.18} ${-h * 0.46}Z`, c);
    k.C(g, -h * 0.14, -h * 0.5, h * 0.045, "#5a4628");
  } else if (fn === "apple") {
    const c = color || "#d8382c";
    k.C(g, -h * 0.12, 0, h * 0.34, c); k.C(g, h * 0.12, 0, h * 0.34, k.dark(c, 0.14));
    k.R(g, -h * 0.02, -h * 0.46, h * 0.04, h * 0.16, "#5a3e28");
    k.E(g, h * 0.12, -h * 0.42, h * 0.14, h * 0.06, "#4e8c3a");
  } else if (fn === "litchi") {
    const c = color || "#d6384c";
    k.R(g, -h * 0.02, -h * 0.5, h * 0.04, h * 0.45, "#5a4228");
    k.E(g, h * 0.16, -h * 0.38, h * 0.18, h * 0.06, "#427a34");
    for (const [lx, ly] of [[-0.18, 0.02], [0.16, 0.05], [0, 0.24]]) {
      k.C(g, h * lx, h * ly, h * 0.2, c);
      k.C(g, h * (lx - 0.04), h * (ly - 0.04), h * 0.06, k.light(c, 0.22));
    }
  } else if (fn === "jackfruit") {
    const c = color || "#f0b428";
    k.P(g, `M${-h * 0.38} ${h * 0.2} Q0 ${h * 0.42} ${h * 0.38} ${h * 0.2} L${h * 0.32} ${-h * 0.22} Q0 ${-h * 0.38} ${-h * 0.32} ${-h * 0.22}Z`, c);
    for (const bx of [-0.18, 0, 0.18]) k.E(g, h * bx, -h * 0.02, h * 0.11, h * 0.18, k.light(c, 0.16));
  } else if (fn === "orange") {
    const c = color || "#e87e24";
    k.C(g, 0, 0, h * 0.4, c); k.C(g, -h * 0.12, -h * 0.12, h * 0.14, k.light(c, 0.2));
    k.C(g, 0, -h * 0.38, h * 0.04, "#4a7c36");
  } else {
    const c = color || "#e89c28";
    k.P(g, `M0 ${-h * 0.44} C${h * 0.38} ${-h * 0.42} ${h * 0.44} ${h * 0.12} ${h * 0.14} ${h * 0.44} C${-h * 0.12} ${h * 0.5} ${-h * 0.38} ${h * 0.18} ${-h * 0.32} ${-h * 0.16} C${-h * 0.28} ${-h * 0.38} ${-h * 0.12} ${-h * 0.44} 0 ${-h * 0.44}Z`, c);
    k.E(g, -h * 0.1, -h * 0.12, h * 0.14, h * 0.22, "#f4c842", 0.65);
    k.E(g, h * 0.12, -h * 0.44, h * 0.14, h * 0.055, "#4a8638");
  }
  return g;
});
