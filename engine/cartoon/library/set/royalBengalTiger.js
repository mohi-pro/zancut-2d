// A Royal Bengal Tiger of the Sundarbans with warm orange fur, dark stripes, white ruff, prowl walk and roar.
ZS.define("royalBengalTiger", { about: "a Royal Bengal Tiger with black stripes, about 105 cm", kind: "set", tags: ["animal", "wild", "zoo", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 135, seed = 1, color = "#d97a2b", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.2), lt = "#f4efe6", stC = "#221c20";
  const w = h * 1.48, by = -h * 0.54;
  k.ground(g, w * 0.92);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), pw = k.E(lg, 0, 0, h * 0.055, h * 0.025, col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.06} ${by + h * 0.08} L${hx + h * 0.06} ${by + h * 0.08} L${fx + h * 0.038} ${fy - h * 0.015} L${fx - h * 0.038} ${fy - h * 0.015}Z`);
      pw.setAttribute("cx", fx + h * 0.015); pw.setAttribute("cy", fy - h * 0.02);
    };
  };
  const bBL = mkLeg(-w * 0.26, dk), bFL = mkLeg(w * 0.23, dk);
  const tP = k.P(g, "", color);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.39, h * 0.22, color);
  k.P(bd, `M${-w * 0.32} ${by + h * 0.06} Q0 ${by + h * 0.24} ${w * 0.32} ${by + h * 0.06}Z`, lt);
  for (const sx of [-0.24, -0.14, -0.04, 0.06, 0.16, 0.25]) {
    k.P(bd, `M${w * sx} ${by - h * 0.2} L${w * (sx + 0.03)} ${by - h * 0.2} L${w * (sx + 0.01)} ${by + h * 0.04}Z`, stC);
  }
  const fBL = mkLeg(-w * 0.31, color), fFL = mkLeg(w * 0.27, color);
  const hG = k.el("g", {}, g);
  k.C(hG, -h * 0.05, -h * 0.16, h * 0.045, stC);
  k.C(hG, h * 0.05, -h * 0.17, h * 0.045, color);
  k.E(hG, h * 0.04, -h * 0.04, h * 0.16, h * 0.14, color);
  k.E(hG, h * 0.02, h * 0.02, h * 0.15, h * 0.09, lt);
  k.E(hG, h * 0.16, -h * 0.02, h * 0.07, h * 0.055, lt);
  k.P(hG, `M${h * 0.02} ${-h * 0.15} L${h * 0.06} ${-h * 0.15} L${h * 0.04} ${-h * 0.05}Z`, stC);
  k.C(hG, h * 0.21, -h * 0.04, h * 0.025, "#d86b62");
  k.C(hG, h * 0.11, -h * 0.08, h * 0.022, "#e8c438");
  k.C(hG, h * 0.115, -h * 0.08, h * 0.01, stC);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 5.5)) * h * 0.022 : Math.sin(s * 2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const sw = Math.sin(s * 2.5) * h * 0.12, tx = -w * 0.36, ty = by - h * 0.04 + bob;
    tP.setAttribute("d", `M${tx} ${ty} C${tx - h * 0.22} ${ty + h * 0.14} ${tx - h * 0.36} ${ty - h * 0.08 + sw} ${tx - h * 0.42} ${ty - h * 0.16 + sw} L${tx - h * 0.38} ${ty - h * 0.2 + sw} C${tx - h * 0.3} ${ty - h * 0.1 + sw} ${tx - h * 0.18} ${ty + h * 0.08} ${tx + h * 0.04} ${ty - h * 0.04}Z`);
    const hA = eat ? 36 + Math.sin(s * 5) * 5 : Math.sin(s * 2) * 3;
    hG.setAttribute("transform", `translate(${w * 0.34} ${by - h * 0.08 + bob + (eat ? h * 0.18 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 5 + p) * h * 0.12, Math.max(0, Math.cos(s * 5 + p)) * h * 0.05] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
