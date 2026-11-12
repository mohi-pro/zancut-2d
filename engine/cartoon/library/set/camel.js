// A tall sandy camel (uut) with high rounded hump, curved S-neck, padded feet and chewing motion.
ZS.define("camel", { about: "a tall desert camel with a rounded hump, about 195 cm", kind: "set", tags: ["animal", "zoo", "story"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 195, seed = 1, color = "#c99b5e", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.18), lt = k.light(color, 0.16);
  const w = h * 1.15, by = -h * 0.58;
  k.ground(g, w * 0.88);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), ft = k.E(lg, 0, 0, h * 0.04, h * 0.018, dk);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.042} ${by + h * 0.08} L${hx + h * 0.042} ${by + h * 0.08} L${fx + h * 0.022} ${fy - h * 0.01} L${fx - h * 0.022} ${fy - h * 0.01}Z`);
      ft.setAttribute("cx", fx + h * 0.01); ft.setAttribute("cy", fy - h * 0.015);
    };
  };
  const bBL = mkLeg(-w * 0.22, dk), bFL = mkLeg(w * 0.2, dk);
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-w * 0.34} ${by - h * 0.04} L${-w * 0.37} ${by + h * 0.18} L${-w * 0.34} ${by + h * 0.18}Z`, dk);
  k.E(bd, -w * 0.02, by - h * 0.16, h * 0.18, h * 0.16, color);
  k.E(bd, -w * 0.03, by - h * 0.24, h * 0.12, h * 0.06, lt);
  k.E(bd, 0, by, w * 0.34, h * 0.18, color);
  k.P(bd, `M${-w * 0.28} ${by + h * 0.04} Q0 ${by + h * 0.2} ${w * 0.28} ${by + h * 0.04}Z`, dk);
  const fBL = mkLeg(-w * 0.26, color), fFL = mkLeg(w * 0.24, color);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.06} 0 C${h * 0.08} ${h * 0.12} ${h * 0.14} ${-h * 0.08} ${h * 0.12} ${-h * 0.28} L${h * 0.04} ${-h * 0.28} C${h * 0.04} ${-h * 0.1} ${h * 0.02} ${h * 0.04} ${-h * 0.06} ${-h * 0.08}Z`, color);
  k.C(hG, h * 0.05, -h * 0.3, h * 0.03, dk);
  k.E(hG, h * 0.12, -h * 0.27, h * 0.1, h * 0.055, color);
  k.C(hG, h * 0.11, -h * 0.28, h * 0.015, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 4.5)) * h * 0.02 : Math.sin(s * 2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const hA = eat ? 42 + Math.sin(s * 4) * 5 : Math.sin(s * 2) * 3;
    hG.setAttribute("transform", `translate(${w * 0.28} ${by - h * 0.02 + bob}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 4.5 + p) * h * 0.1, Math.max(0, Math.cos(s * 4.5 + p)) * h * 0.045] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
