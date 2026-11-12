// A silver-gold village pond fish (rui/katla) that leaps in a smooth arc with concentric water ripples.
ZS.define("fishInPond", { about: "a pond fish jumping with ripples on the water surface, about 30 cm", kind: "set", tags: ["animal", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 75, seed = 1, color = "#c88a4b", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const belly = "#e8e2d5", dk = k.dark(color, 0.2);
  const r1 = k.E(g, 0, 0, h * 0.6, h * 0.1, "#5aa4b8", 0.4);
  const r2 = k.E(g, 0, 0, h * 0.35, h * 0.06, "#fff6e6", 0.5);
  const fG = k.el("g", {}, g);
  k.P(fG, `M${-h * 0.26} 0 L${-h * 0.44} ${-h * 0.14} L${-h * 0.38} 0 L${-h * 0.44} ${h * 0.14}Z`, dk);
  k.P(fG, `M${-h * 0.06} ${-h * 0.1} L${-h * 0.14} ${-h * 0.22} L${h * 0.06} ${-h * 0.12}Z`, dk);
  k.E(fG, 0, 0, h * 0.28, h * 0.12, belly);
  k.P(fG, `M${-h * 0.28} 0 Q0 ${-h * 0.22} ${h * 0.28} 0 Q0 ${-h * 0.04} ${-h * 0.28} 0Z`, color);
  k.C(fG, h * 0.18, -h * 0.02, h * 0.022, "#1c1420");
  const drp = k.C(g, 0, 0, h * 0.03, "#fff6e6", 0);
  g.tick = (t) => {
    const s = (t * speed * 0.85 + ph) % 3.2;
    if (s < 1.6) {
      const u = s / 1.6, a = u * 3.1416;
      const fx = (u - 0.5) * h * 0.9, fy = -Math.sin(a) * h * 0.72;
      const rot = -Math.cos(a) * 52;
      fG.setAttribute("opacity", "1");
      fG.setAttribute("transform", `translate(${fx} ${fy}) rotate(${rot})`);
      r1.setAttribute("rx", h * (0.35 + u * 0.45));
      r2.setAttribute("rx", h * (0.18 + u * 0.3));
      drp.setAttribute("opacity", u > 0.75 ? "0.7" : "0");
      drp.setAttribute("cx", fx * 0.9); drp.setAttribute("cy", fy * 0.5 - h * 0.1);
    } else {
      const v = (s - 1.6) / 1.6;
      fG.setAttribute("opacity", act === "jump" ? "1" : "0.25");
      fG.setAttribute("transform", `translate(${Math.sin(v * 6.28) * h * 0.15} ${h * 0.05}) rotate(0) scale(0.85 0.4)`);
      r1.setAttribute("rx", h * (0.8 - v * 0.35));
      r2.setAttribute("rx", h * (0.48 - v * 0.2));
      drp.setAttribute("opacity", "0");
    }
  };
  g.tick(0);
  return g;
});
