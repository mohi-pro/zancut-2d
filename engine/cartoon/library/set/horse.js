// A graceful brown or bay horse with flowing mane and tail, trotting, grazing and breathing.
ZS.define("horse", { about: "a graceful horse with a flowing mane and tail, about 155 cm", kind: "set", tags: ["animal", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 175, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#9e5b36", "#c48852", "#4a3830", "#d8cfc2"]);
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.15), hair = k.dark(c, 0.38), hoof = "#241e1c";
  const w = h * 1.25, by = -h * 0.58;
  k.ground(g, w * 0.9);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), l = k.P(lg, "", col), hf = k.P(lg, "", hoof);
    return (sw, lft) => {
      const kx = hx + sw * 0.45, ky = -h * 0.28 - lft * 0.4, fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.048} ${by + h * 0.08} L${hx + h * 0.048} ${by + h * 0.08} L${kx + h * 0.026} ${ky} L${kx - h * 0.026} ${ky}Z`);
      l.setAttribute("d", `M${kx - h * 0.024} ${ky} L${kx + h * 0.024} ${ky} L${fx + h * 0.02} ${fy - h * 0.04} L${fx - h * 0.02} ${fy - h * 0.04}Z`);
      hf.setAttribute("d", `M${fx - h * 0.022} ${fy - h * 0.04} L${fx + h * 0.026} ${fy - h * 0.04} L${fx + h * 0.03} ${fy} L${fx - h * 0.022} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.25, dk), bFL = mkLeg(w * 0.23, dk);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 C${-h * 0.14} ${h * 0.06} ${-h * 0.18} ${h * 0.28} ${-h * 0.1} ${h * 0.42} C${-h * 0.02} ${h * 0.3} ${-h * 0.02} ${h * 0.12} ${h * 0.04} 0Z`, hair);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.36, h * 0.19, c);
  k.P(bd, `M${-w * 0.3} ${by - h * 0.09} Q0 ${by - h * 0.21} ${w * 0.3} ${by - h * 0.09}Z`, lt);
  k.P(bd, `M${-w * 0.32} ${by + h * 0.04} Q0 ${by + h * 0.21} ${w * 0.32} ${by + h * 0.04}Z`, dk);
  const fBL = mkLeg(-w * 0.29, c), fFL = mkLeg(w * 0.27, c);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.06} ${-h * 0.28} C${-h * 0.14} ${-h * 0.18} ${-h * 0.16} ${-h * 0.02} ${-h * 0.1} ${h * 0.12} L0 ${h * 0.08} L${h * 0.04} ${-h * 0.26}Z`, hair);
  k.P(hG, `M${-h * 0.08} ${h * 0.12} L${h * 0.02} ${-h * 0.26} L${h * 0.14} ${-h * 0.18} L${h * 0.06} ${h * 0.16}Z`, c);
  k.P(hG, `M${h * 0.02} ${-h * 0.25} L${h * 0.04} ${-h * 0.35} L${h * 0.09} ${-h * 0.26}Z`, c);
  k.P(hG, `M0 ${-h * 0.26} C${h * 0.14} ${-h * 0.26} ${h * 0.26} ${-h * 0.12} ${h * 0.23} ${-h * 0.04} C${h * 0.18} 0 ${h * 0.05} ${-h * 0.04} 0 ${-h * 0.12}Z`, c);
  k.E(hG, h * 0.21, -h * 0.07, h * 0.045, h * 0.038, dk);
  k.C(hG, h * 0.1, -h * 0.2, h * 0.017, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 6)) * h * 0.022 : Math.sin(s * 2.2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.33} ${by - h * 0.06 + bob}) rotate(${Math.sin(s * 4) * 10})`);
    const hA = eat ? 54 + Math.sin(s * 5) * 5 : Math.sin(s * 2.2) * 4 + (wlk ? Math.sin(s * 6) * 5 : 0);
    hG.setAttribute("transform", `translate(${w * 0.29} ${by - h * 0.1 + bob + (eat ? h * 0.24 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 5.6 + p) * h * 0.11, Math.max(0, Math.cos(s * 5.6 + p)) * h * 0.06] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
