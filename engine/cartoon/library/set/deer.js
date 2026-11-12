// A spotted Sundarbans chital deer (chitra horin) with white spots, slender legs and branching antlers.
ZS.define("deer", { about: "a spotted chital deer (chitra horin) of the Sundarbans, about 90 cm", kind: "set", tags: ["animal", "wild", "zoo", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 130, seed = 1, color = "#c87d42", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.18), lt = "#f4efe6", ant = "#7a6248";
  const w = h * 1.15, by = -h * 0.54;
  k.ground(g, w * 0.85);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.032} ${by + h * 0.06} L${hx + h * 0.032} ${by + h * 0.06} L${fx + h * 0.016} ${fy} L${fx - h * 0.016} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.24, dk), bFL = mkLeg(w * 0.22, dk);
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-w * 0.34} ${by - h * 0.06} L${-w * 0.42} ${by + h * 0.04} L${-w * 0.34} ${by + h * 0.04}Z`, lt);
  k.E(bd, 0, by, w * 0.34, h * 0.16, color);
  k.P(bd, `M${-w * 0.28} ${by + h * 0.05} Q0 ${by + h * 0.18} ${w * 0.28} ${by + h * 0.05}Z`, lt);
  for (const [sx, sy] of [[-0.2, -0.05], [-0.1, -0.08], [0, -0.04], [0.1, -0.07], [0.18, -0.03], [-0.14, 0.01], [0.04, 0.02]]) {
    k.C(bd, w * sx, by + h * sy, h * 0.018, lt);
  }
  const fBL = mkLeg(-w * 0.28, color), fFL = mkLeg(w * 0.25, color);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.05} ${h * 0.12} L${h * 0.02} ${-h * 0.22} L${h * 0.1} ${-h * 0.18} L${h * 0.04} ${h * 0.14}Z`, color);
  k.P(hG, `M${h * 0.02} ${-h * 0.2} L${-h * 0.06} ${-h * 0.38} L${-h * 0.03} ${-h * 0.38} L${h * 0.02} ${-h * 0.28} L${h * 0.07} ${-h * 0.35} L${h * 0.05} ${-h * 0.2}Z`, ant);
  k.E(hG, -h * 0.03, -h * 0.19, h * 0.055, h * 0.024, dk);
  k.E(hG, h * 0.09, -h * 0.19, h * 0.09, h * 0.055, color);
  k.C(hG, h * 0.17, -h * 0.19, h * 0.016, "#1c1420");
  k.C(hG, h * 0.08, -h * 0.2, h * 0.016, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 6.5)) * h * 0.022 : Math.sin(s * 2.2) * h * 0.007;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const hA = eat ? 58 + Math.sin(s * 5) * 5 : Math.sin(s * 2.4) * 4;
    hG.setAttribute("transform", `translate(${w * 0.28} ${by - h * 0.08 + bob + (eat ? h * 0.22 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 6 + p) * h * 0.11, Math.max(0, Math.cos(s * 6 + p)) * h * 0.055] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
