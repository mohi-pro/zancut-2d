// A distant V-formation flock of birds gliding and flapping gracefully high in the sky.
ZS.define("flockOfBirds", { about: "a distant V-formation flock of birds in the sky, each about 35 cm", kind: "set", tags: ["animal", "bird", "sky", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 95, seed = 1, color = "#363e4a", n = 7, flip, facing, speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed);
  const cnt = Math.max(3, Math.min(11, n)), birds = [];
  for (let i = 0; i < cnt; i++) {
    const rank = Math.ceil(i / 2), side = i % 2 === 1 ? 1 : -1;
    const bx = i === 0 ? h * 0.35 : h * 0.35 - rank * h * 0.22 + (r() - 0.5) * h * 0.05;
    const by = i === 0 ? -h * 0.5 : -h * 0.5 + side * rank * h * 0.14 + (r() - 0.5) * h * 0.04;
    const sc = (1 - rank * 0.07) * h * 0.14, ph = i * 0.55 + r() * 0.4;
    const p = k.P(g, "", color, 0.85 - rank * 0.06);
    birds.push({ p, bx, by, sc, ph });
  }
  g.tick = (t) => {
    for (const b of birds) {
      const s = t * speed + b.ph, w = b.sc;
      const fy = b.by + Math.sin(s * 4) * w * 0.25;
      const wf = Math.sin(s * 7.5) * w * 0.65;
      b.p.setAttribute("d", `M${b.bx - w} ${fy - wf} Q${b.bx - w * 0.4} ${fy - wf * 0.4} ${b.bx} ${fy} Q${b.bx + w * 0.4} ${fy - wf * 0.4} ${b.bx + w} ${fy - wf} Q${b.bx + w * 0.4} ${fy - wf * 0.4 + w * 0.22} ${b.bx} ${fy + w * 0.2} Q${b.bx - w * 0.4} ${fy - wf * 0.4 + w * 0.22} ${b.bx - w} ${fy - wf}Z`);
    }
  };
  g.tick(0);
  return g;
});
