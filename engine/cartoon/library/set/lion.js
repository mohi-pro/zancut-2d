// A golden lion (shingho) with full dark-brown mane, tufted tail, proud stride and breathing.
ZS.define("lion", { about: "a golden lion with a full brown mane, about 115 cm", kind: "set", tags: ["animal", "wild", "zoo", "story"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 140, seed = 1, color = "#d89e48", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.18), lt = k.light(color, 0.16), mane = "#6e3e24";
  const w = h * 1.38, by = -h * 0.54;
  k.ground(g, w * 0.9);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), pw = k.E(lg, 0, 0, h * 0.055, h * 0.024, col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.058} ${by + h * 0.08} L${hx + h * 0.058} ${by + h * 0.08} L${fx + h * 0.036} ${fy - h * 0.015} L${fx - h * 0.036} ${fy - h * 0.015}Z`);
      pw.setAttribute("cx", fx + h * 0.015); pw.setAttribute("cy", fy - h * 0.02);
    };
  };
  const bBL = mkLeg(-w * 0.25, dk), bFL = mkLeg(w * 0.22, dk);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 Q${-h * 0.22} ${h * 0.14} ${-h * 0.3} ${-h * 0.04} L${-h * 0.28} ${-h * 0.08} Q${-h * 0.18} ${h * 0.08} ${h * 0.04} 0Z`, color);
  k.E(tG, -h * 0.3, -h * 0.06, h * 0.045, h * 0.03, mane);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.38, h * 0.21, color);
  k.P(bd, `M${-w * 0.3} ${by - h * 0.1} Q0 ${by - h * 0.23} ${w * 0.28} ${by - h * 0.1}Z`, lt);
  k.P(bd, `M${-w * 0.32} ${by + h * 0.05} Q0 ${by + h * 0.22} ${w * 0.32} ${by + h * 0.05}Z`, dk);
  const fBL = mkLeg(-w * 0.3, color), fFL = mkLeg(w * 0.26, color);
  const hG = k.el("g", {}, g);
  k.E(hG, 0, 0, h * 0.22, h * 0.25, mane);
  k.E(hG, -h * 0.04, -h * 0.02, h * 0.18, h * 0.2, k.dark(mane, 0.18));
  k.C(hG, h * 0.06, -h * 0.16, h * 0.045, color);
  k.E(hG, h * 0.08, -h * 0.02, h * 0.13, h * 0.12, color);
  k.E(hG, h * 0.18, 0, h * 0.065, h * 0.05, lt);
  k.C(hG, h * 0.22, -h * 0.02, h * 0.022, "#3a2822");
  k.C(hG, h * 0.12, -h * 0.06, h * 0.02, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 5.2)) * h * 0.02 : Math.sin(s * 2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.34} ${by - h * 0.04 + bob}) rotate(${Math.sin(s * 3) * 10})`);
    const hA = eat ? 32 + Math.sin(s * 5) * 5 : Math.sin(s * 1.8) * 3;
    hG.setAttribute("transform", `translate(${w * 0.3} ${by - h * 0.06 + bob + (eat ? h * 0.16 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 5 + p) * h * 0.11, Math.max(0, Math.cos(s * 5 + p)) * h * 0.05] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
