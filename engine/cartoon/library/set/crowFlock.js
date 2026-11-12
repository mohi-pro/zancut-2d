// A flock of crows perching along a wire or flying together across the sky.
ZS.define("crowFlock", { about: "a flock of house crows on a wire or flying together, each about 40 cm", kind: "set", tags: ["animal", "bird", "city", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 110, seed = 1, color = "#242228", n = 5, flip, facing, act = "fly", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed);
  const cnt = Math.max(2, Math.min(9, n)), fly = act === "fly";
  if (!fly) k.R(g, -h * 0.9, -h * 0.36, h * 1.8, h * 0.016, "#3a3632");
  const crows = [];
  for (let i = 0; i < cnt; i++) {
    const cx = (i - (cnt - 1) / 2) * h * 0.34 + (r() - 0.5) * h * 0.08;
    const cy = fly ? -h * 0.45 + (r() - 0.5) * h * 0.35 : -h * 0.36;
    const sc = 0.28 + r() * 0.06, bh = h * sc, ph = r() * 6.28;
    const cg = k.el("g", {}, g);
    k.P(cg, `M${-bh * 0.5} ${-bh * 0.2} L${-bh * 0.95} ${-bh * 0.08} L${-bh * 0.85} ${bh * 0.05} L${-bh * 0.4} ${-bh * 0.05}Z`, "#16141a");
    k.E(cg, 0, -bh * 0.22, bh * 0.48, bh * 0.24, color);
    k.E(cg, bh * 0.26, -bh * 0.3, bh * 0.22, bh * 0.2, "#54565e");
    const hd = k.el("g", {}, cg);
    k.C(hd, bh * 0.42, -bh * 0.42, bh * 0.18, color);
    k.P(hd, `M${bh * 0.55} ${-bh * 0.46} L${bh * 0.82} ${-bh * 0.39} L${bh * 0.55} ${-bh * 0.35}Z`, "#16141a");
    k.C(hd, bh * 0.46, -bh * 0.44, bh * 0.035, "#fff6e6");
    const wg = k.P(cg, "", "#16141a");
    if (!fly) k.R(cg, -bh * 0.05, -bh * 0.06, bh * 0.08, bh * 0.08, "#16141a");
    crows.push({ cg, hd, wg, cx, cy, bh, ph });
  }
  g.tick = (t) => {
    for (const c of crows) {
      const s = t * speed + c.ph, bh = c.bh;
      const dy = fly ? Math.sin(s * 9) * bh * 0.22 : Math.sin(s * 2.5) * bh * 0.03;
      const dx = fly ? Math.cos(s * 3) * bh * 0.15 : 0;
      c.cg.setAttribute("transform", `translate(${c.cx + dx} ${c.cy + dy})`);
      c.hd.setAttribute("transform", `rotate(${Math.sin(s * 3.5) > 0.6 ? -12 : 4} ${bh * 0.4} ${-bh * 0.4})`);
      if (fly) {
        const wf = Math.sin(s * 14) * bh * 0.75;
        c.wg.setAttribute("d", `M${-bh * 0.15} ${-bh * 0.25} Q0 ${-bh * 0.25 - wf * 1.2} ${bh * 0.25} ${-bh * 0.25 - wf} Q${bh * 0.1} ${-bh * 0.12} ${-bh * 0.15} ${-bh * 0.15}Z`);
      } else {
        c.wg.setAttribute("d", `M${-bh * 0.38} ${-bh * 0.24} Q0 ${-bh * 0.34} ${bh * 0.2} ${-bh * 0.18} Q${-bh * 0.1} ${-bh * 0.04} ${-bh * 0.42} ${-bh * 0.12}Z`);
      }
    }
  };
  g.tick(0);
  return g;
});
