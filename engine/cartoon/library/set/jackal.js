// A golden jackal / fox (shiyal, iconic character of Bangla fables) with pointy muzzle, bushy tail and trotting gait.
ZS.define("jackal", { about: "a golden jackal (shiyal) from village fables, about 45 cm", kind: "set", tags: ["animal", "wild", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 82, seed = 1, color = "#b87e42", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = "#e5d8c0", tip = "#282220";
  const w = h * 1.28, by = -h * 0.52;
  k.ground(g, w * 0.88);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.04} ${by + h * 0.06} L${hx + h * 0.04} ${by + h * 0.06} L${fx + h * 0.02} ${fy} L${fx - h * 0.02} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.25, dk), bFL = mkLeg(w * 0.22, dk);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 C${-h * 0.2} ${h * 0.04} ${-h * 0.34} ${h * 0.2} ${-h * 0.28} ${h * 0.32} C${-h * 0.16} ${h * 0.32} ${-h * 0.04} ${h * 0.18} ${h * 0.04} 0Z`, color);
  k.E(tG, -h * 0.24, h * 0.26, h * 0.06, h * 0.08, tip);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.36, h * 0.17, color);
  k.P(bd, `M${-w * 0.28} ${by - h * 0.08} Q0 ${by - h * 0.2} ${w * 0.26} ${by - h * 0.08}Z`, dk);
  k.P(bd, `M${-w * 0.28} ${by + h * 0.05} Q0 ${by + h * 0.18} ${w * 0.28} ${by + h * 0.05}Z`, lt);
  const fBL = mkLeg(-w * 0.29, color), fFL = mkLeg(w * 0.26, color);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.06} ${h * 0.08} L${h * 0.02} ${-h * 0.14} L${h * 0.12} ${-h * 0.08} L${h * 0.06} ${h * 0.12}Z`, color);
  k.P(hG, `M${-h * 0.02} ${-h * 0.12} L${-h * 0.06} ${-h * 0.28} L${h * 0.04} ${-h * 0.16}Z`, dk);
  k.P(hG, `M${h * 0.04} ${-h * 0.14} L${h * 0.06} ${-h * 0.29} L${h * 0.12} ${-h * 0.14}Z`, color);
  k.E(hG, h * 0.08, -h * 0.1, h * 0.1, h * 0.08, color);
  k.P(hG, `M${h * 0.12} ${-h * 0.14} L${h * 0.3} ${-h * 0.08} L${h * 0.12} ${-h * 0.03}Z`, color);
  k.P(hG, `M${h * 0.12} ${-h * 0.07} L${h * 0.28} ${-h * 0.07} L${h * 0.12} ${-h * 0.03}Z`, lt);
  k.C(hG, h * 0.29, -h * 0.08, h * 0.018, tip);
  k.C(hG, h * 0.12, -h * 0.11, h * 0.017, "#e5b42e");
  k.C(hG, h * 0.125, -h * 0.11, h * 0.008, tip);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 7)) * h * 0.02 : Math.sin(s * 2.5) * h * 0.007;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.33} ${by - h * 0.04 + bob}) rotate(${Math.sin(s * 4) * 10})`);
    const hA = eat ? 40 + Math.sin(s * 6) * 5 : Math.sin(s * 2.4) * 4;
    hG.setAttribute("transform", `translate(${w * 0.3} ${by - h * 0.1 + bob + (eat ? h * 0.18 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 6.5 + p) * h * 0.11, Math.max(0, Math.cos(s * 6.5 + p)) * h * 0.05] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
