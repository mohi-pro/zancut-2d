// A village hen (or rooster with rooster: true) that pecks, walks, bobs its head and ruffles its tail.
ZS.define("hen", { about: "a village hen or rooster, about 35 cm", kind: "set", tags: ["animal", "bird", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 68, seed = 1, color, rooster, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const isR = rooster ?? (r() > 0.65);
  const c = color || (isR ? k.pick(r, ["#c85228", "#b83c2a", "#d67a2e"]) : k.pick(r, ["#b96a38", "#e2d4be", "#5c4332", "#c98a4b"]));
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.16), tCol = isR ? "#234a3c" : dk, comb = "#d8382c", legC = "#d99b38";
  const by = -h * 0.48;
  k.ground(g, h * 0.65);
  const mkLeg = (lx, col) => {
    const lg = k.el("g", {}, g), sh = k.P(lg, "", col), ft = k.P(lg, "", col);
    return (sw, lft) => {
      const fx = lx + sw, fy = -lft;
      sh.setAttribute("d", `M${lx - h * 0.02} ${by + h * 0.12} L${lx + h * 0.02} ${by + h * 0.12} L${fx + h * 0.015} ${fy} L${fx - h * 0.015} ${fy}Z`);
      ft.setAttribute("d", `M${fx - h * 0.06} ${fy} L${fx + h * 0.08} ${fy} L${fx + h * 0.06} ${fy - h * 0.025} L${fx - h * 0.04} ${fy - h * 0.025}Z`);
    };
  };
  const bL = mkLeg(-h * 0.03, k.dark(legC, 0.18)), fL = mkLeg(h * 0.04, legC);
  const bd = k.el("g", {}, g), tG = k.el("g", {}, bd);
  if (isR) {
    k.P(tG, `M0 0 C${-h * 0.18} ${-h * 0.35} ${-h * 0.38} ${-h * 0.28} ${-h * 0.42} ${-h * 0.05} C${-h * 0.28} ${-h * 0.14} ${-h * 0.14} ${-h * 0.12} 0 ${h * 0.06}Z`, tCol);
    k.P(tG, `M0 ${h * 0.02} C${-h * 0.14} ${-h * 0.24} ${-h * 0.3} ${-h * 0.18} ${-h * 0.34} ${h * 0.04}Z`, k.dark(tCol, 0.2));
  } else {
    k.P(tG, `M0 0 L${-h * 0.22} ${-h * 0.2} L${-h * 0.25} ${-h * 0.04} L${-h * 0.16} ${h * 0.08}Z`, tCol);
  }
  k.E(bd, 0, by, h * 0.3, h * 0.22, c);
  k.P(bd, `M${-h * 0.25} ${by - h * 0.08} Q0 ${by - h * 0.24} ${h * 0.24} ${by - h * 0.08}Z`, lt);
  k.P(bd, `M${-h * 0.26} ${by + h * 0.05} Q0 ${by + h * 0.24} ${h * 0.26} ${by + h * 0.04}Z`, dk);
  const wG = k.E(bd, -h * 0.02, by + h * 0.01, h * 0.18, h * 0.11, dk);
  const hG = k.el("g", {}, bd);
  k.P(hG, `M${-h * 0.08} ${h * 0.08} L${h * 0.02} ${-h * 0.18} L${h * 0.12} ${-h * 0.12} L${h * 0.08} ${h * 0.1}Z`, isR ? "#d88a2c" : c);
  k.C(hG, h * 0.06, -h * 0.16, h * 0.09, c);
  k.C(hG, h * 0.06, -h * 0.26, isR ? h * 0.055 : h * 0.032, comb);
  k.C(hG, h * 0.02, -h * 0.24, isR ? h * 0.045 : h * 0.025, comb);
  k.E(hG, h * 0.1, -h * 0.09, h * 0.022, isR ? h * 0.045 : h * 0.025, comb);
  k.P(hG, `M${h * 0.13} ${-h * 0.19} L${h * 0.23} ${-h * 0.15} L${h * 0.13} ${-h * 0.12}Z`, "#e5a93b");
  k.C(hG, h * 0.08, -h * 0.17, h * 0.016, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, pck = act === "peck" || act === "eat", wlk = act === "walk", fly = act === "fly";
    const pitch = pck ? 36 + Math.sin(s * 14) * 14 : Math.sin(s * 3) * 3;
    const fy = fly ? -Math.abs(Math.sin(s * 9)) * h * 0.25 : (wlk ? Math.abs(Math.sin(s * 8)) * h * 0.02 : 0);
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${pitch} 0 ${by})`);
    tG.setAttribute("transform", `translate(${-h * 0.22} ${by - h * 0.08}) rotate(${Math.sin(s * 4) * 5})`);
    const hBob = pck ? 18 + Math.sin(s * 14) * 10 : (wlk ? Math.sin(s * 8) * 10 : Math.sin(s * 3.5) * 4);
    hG.setAttribute("transform", `translate(${h * 0.2} ${by - h * 0.1}) rotate(${hBob})`);
    wG.setAttribute("transform", `rotate(${fly ? Math.sin(s * 18) * 35 : Math.sin(s * 3) * 3} ${-h * 0.02} ${by})`);
    const st = (p) => wlk ? [Math.sin(s * 8 + p) * h * 0.09, Math.max(0, Math.cos(s * 8 + p)) * h * 0.05] : [0, 0];
    bL(...st(0)); fL(...st(3.14));
  };
  g.tick(0);
  return g;
});
