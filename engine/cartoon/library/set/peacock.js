// An Indian peafowl / peacock (moyur) with royal blue neck, crown crest and shimmering eye-spotted tail fan.
ZS.define("peacock", { about: "a peacock with a shimmering eye-spotted tail fan, about 95 cm", kind: "set", tags: ["animal", "bird", "zoo", "story", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 115, seed = 1, color = "#1d568c", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const grn = "#2d8c5a", gold = "#e5b438", by = -h * 0.36;
  k.ground(g, h * 0.85);
  const fG = k.el("g", {}, g);
  k.E(fG, 0, -h * 0.12, h * 0.48, h * 0.44, grn);
  for (let i = -3; i <= 3; i++) {
    const a = i * 0.38, rd = h * 0.34;
    const ex = Math.sin(a) * rd, ey = -h * 0.12 - Math.cos(a) * rd * 0.85;
    k.E(fG, ex, ey, h * 0.055, h * 0.065, gold);
    k.C(fG, ex, ey, h * 0.032, color);
    k.C(fG, ex, ey, h * 0.016, "#1c1420");
  }
  k.R(g, -h * 0.03, by + h * 0.1, h * 0.022, -by - h * 0.1, "#9c7a54");
  k.R(g, h * 0.03, by + h * 0.1, h * 0.022, -by - h * 0.1, "#9c7a54");
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, h * 0.22, h * 0.15, color);
  k.E(bd, -h * 0.02, by + h * 0.02, h * 0.15, h * 0.09, k.dark(color, 0.2));
  const hG = k.el("g", {}, bd);
  k.P(hG, `M${-h * 0.04} ${h * 0.06} C${-h * 0.02} ${-h * 0.12} ${h * 0.02} ${-h * 0.26} ${h * 0.06} ${-h * 0.26} L${h * 0.11} ${-h * 0.24} C${h * 0.08} ${-h * 0.1} ${h * 0.06} 0 ${h * 0.04} ${h * 0.08}Z`, color);
  k.C(hG, h * 0.08, -h * 0.26, h * 0.065, color);
  for (const dx of [-0.03, 0, 0.03]) k.C(hG, h * (0.06 + dx), -h * 0.36, h * 0.015, gold);
  k.P(hG, `M${h * 0.13} ${-h * 0.28} L${h * 0.22} ${-h * 0.25} L${h * 0.13} ${-h * 0.23}Z`, "#d8b468");
  k.C(hG, h * 0.09, -h * 0.27, h * 0.014, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat";
    const sc = 0.94 + Math.sin(s * 2.5) * 0.06, rot = Math.sin(s * 1.8) * 3;
    fG.setAttribute("transform", `translate(${-h * 0.08} ${by}) rotate(${rot}) scale(${sc} ${sc})`);
    const hA = pck ? 38 + Math.sin(s * 10) * 8 : Math.sin(s * 2.4) * 4;
    hG.setAttribute("transform", `translate(${h * 0.14} ${by - h * 0.08}) rotate(${hA})`);
  };
  g.tick(0);
  return g;
});
