// A domestic or courtyard cat with fluid S-tail, pointy ears, quiet prowl walk and eating motion.
ZS.define("cat", { about: "a courtyard cat with a swaying tail, about 28 cm", kind: "set", tags: ["animal", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 58, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#d98a46", "#7a7874", "#322e34", "#dfd6c8", "#b86b3a"]);
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.16), vd = k.dark(c, 0.28);
  const w = h * 1.25, by = -h * 0.5;
  k.ground(g, w * 0.85);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), pw = k.E(lg, 0, 0, h * 0.036, h * 0.018, col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.04} ${by + h * 0.06} L${hx + h * 0.04} ${by + h * 0.06} L${fx + h * 0.022} ${fy - h * 0.01} L${fx - h * 0.022} ${fy - h * 0.01}Z`);
      pw.setAttribute("cx", fx + h * 0.01); pw.setAttribute("cy", fy - h * 0.015);
    };
  };
  const bBL = mkLeg(-w * 0.25, vd), bFL = mkLeg(w * 0.22, vd);
  const tP = k.P(g, "", dk);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.36, h * 0.18, c);
  k.P(bd, `M${-w * 0.3} ${by - h * 0.08} Q0 ${by - h * 0.2} ${w * 0.3} ${by - h * 0.08}Z`, lt);
  k.P(bd, `M${-w * 0.3} ${by + h * 0.04} Q0 ${by + h * 0.18} ${w * 0.3} ${by + h * 0.04}Z`, dk);
  const fBL = mkLeg(-w * 0.29, c), fFL = mkLeg(w * 0.26, c);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.04} ${-h * 0.12} L${-h * 0.09} ${-h * 0.26} L${h * 0.02} ${-h * 0.18}Z`, dk);
  k.P(hG, `M${h * 0.05} ${-h * 0.14} L${h * 0.09} ${-h * 0.27} L${h * 0.15} ${-h * 0.14}Z`, c);
  k.E(hG, h * 0.06, -h * 0.08, h * 0.14, h * 0.12, c);
  k.E(hG, h * 0.16, -h * 0.05, h * 0.05, h * 0.04, lt);
  k.C(hG, h * 0.2, -h * 0.06, h * 0.018, "#d97a72");
  k.E(hG, h * 0.11, -h * 0.1, h * 0.024, h * 0.028, "#88b858");
  k.E(hG, h * 0.115, -h * 0.1, h * 0.008, h * 0.024, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 6)) * h * 0.016 : Math.sin(s * 2.4) * h * 0.007;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const sw = Math.sin(s * 2.6) * h * 0.12, tx = -w * 0.33, ty = by - h * 0.05 + bob;
    tP.setAttribute("d", `M${tx} ${ty} C${tx - h * 0.18} ${ty - h * 0.12} ${tx - h * 0.14 + sw} ${ty - h * 0.34} ${tx - h * 0.04 + sw} ${ty - h * 0.42} L${tx + h * 0.01 + sw} ${ty - h * 0.4} C${tx - h * 0.08 + sw} ${ty - h * 0.3} ${tx - h * 0.1} ${ty - h * 0.1} ${tx + h * 0.04} ${ty + h * 0.03}Z`);
    const hA = eat ? 38 + Math.sin(s * 7) * 5 : Math.sin(s * 2) * 4;
    const hY = by - h * 0.08 + bob + (eat ? h * 0.16 : 0);
    hG.setAttribute("transform", `translate(${w * 0.3} ${hY}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 5.8 + p) * h * 0.1, Math.max(0, Math.cos(s * 5.8 + p)) * h * 0.045] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
