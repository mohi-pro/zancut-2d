// A cluster of glowing evening fireflies (jonaki poka) drifting and pulsing gently in the dusk or night air.
ZS.define("fireflies", { about: "a cluster of glowing fireflies (jonaki poka), swarm about 60 cm across", kind: "set", tags: ["animal", "insect", "village", "night", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 95, seed = 1, color = "#e8f26b", n = 9, flip, facing, speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed);
  const cnt = Math.max(4, Math.min(16, n)), bugs = [];
  for (let i = 0; i < cnt; i++) {
    const bx = (r() - 0.5) * h * 1.1, by = -h * (0.2 + r() * 0.75), ph = r() * 6.28, rx = h * (0.08 + r() * 0.08);
    const bg = k.el("g", {}, g);
    const halo = k.C(bg, 0, 0, h * 0.09, color, 0.25);
    const core = k.C(bg, 0, 0, h * 0.028, "#fffde0", 0.95);
    k.E(bg, -h * 0.02, -h * 0.01, h * 0.022, h * 0.012, "#2c2824");
    bugs.push({ bg, halo, core, bx, by, ph, rx });
  }
  g.tick = (t) => {
    for (const b of bugs) {
      const s = t * speed + b.ph;
      const dx = Math.sin(s * 1.6) * b.rx, dy = Math.cos(s * 2.1) * b.rx * 0.7;
      const glow = 0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(s * 3.2), 2);
      b.bg.setAttribute("transform", `translate(${b.bx + dx} ${b.by + dy})`);
      b.halo.setAttribute("opacity", (glow * 0.38).toFixed(2));
      b.halo.setAttribute("r", h * (0.05 + glow * 0.06));
      b.core.setAttribute("opacity", (0.35 + glow * 0.65).toFixed(2));
    }
  };
  g.tick(0);
  return g;
});
