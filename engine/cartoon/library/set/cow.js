// A Bangladeshi deshi village cow with gentle hump, dewlap, ear flick, tail swish, walking and grazing.
ZS.define("cow", { about: "a Bangladeshi deshi village cow, about 125 cm", kind: "set", tags: ["animal", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 150, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#e8dfd1", "#b87344", "#463d38", "#c98e5b", "#dfd5c6"]);
  const dk = k.dark(c, 0.16), vd = k.dark(c, 0.3), lt = k.light(c, 0.14), hoof = "#2c2420", horn = "#8a7f72";
  const w = h * 1.32, by = -h * 0.62, hasSpot = r() > 0.45, spX = (r() - 0.5) * w * 0.22;
  k.ground(g, w * 0.92);
  const mkLeg = (hx, col, hc) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), l = k.P(lg, "", col), hf = k.P(lg, "", hc);
    return (sw, lft) => {
      const kx = hx + sw * 0.42 - h * 0.015, ky = -h * 0.25 - lft * 0.35, fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.05} ${by + h * 0.1} L${hx + h * 0.05} ${by + h * 0.1} L${kx + h * 0.032} ${ky} L${kx - h * 0.032} ${ky}Z`);
      l.setAttribute("d", `M${kx - h * 0.03} ${ky} L${kx + h * 0.03} ${ky} L${fx + h * 0.025} ${fy - h * 0.04} L${fx - h * 0.025} ${fy - h * 0.04}Z`);
      hf.setAttribute("d", `M${fx - h * 0.028} ${fy - h * 0.042} L${fx + h * 0.03} ${fy - h * 0.042} L${fx + h * 0.036} ${fy} L${fx - h * 0.028} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.26, vd, hoof), bFL = mkLeg(w * 0.22, vd, hoof);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 C${-h * 0.05} ${h * 0.16} ${-h * 0.04} ${h * 0.34} ${-h * 0.02} ${h * 0.46} L${h * 0.015} ${h * 0.46} C${h * 0.01} ${h * 0.32} ${h * 0.02} ${h * 0.15} ${h * 0.03} 0Z`, dk);
  k.E(tG, -h * 0.005, h * 0.48, h * 0.028, h * 0.055, hoof);
  const bd = k.el("g", {}, g);
  k.E(bd, -w * 0.12, by + h * 0.18, h * 0.08, h * 0.055, "#d8a494");
  k.E(bd, 0, by, w * 0.38, h * 0.23, c);
  k.E(bd, w * 0.22, by - h * 0.2, h * 0.11, h * 0.08, c);
  k.P(bd, `M${-w * 0.33} ${by - h * 0.12} Q0 ${by - h * 0.26} ${w * 0.28} ${by - h * 0.14} Q0 ${by - h * 0.18} ${-w * 0.33} ${by - h * 0.12}Z`, lt);
  k.P(bd, `M${-w * 0.36} ${by + h * 0.05} Q0 ${by + h * 0.27} ${w * 0.36} ${by + h * 0.05} Q0 ${by + h * 0.16} ${-w * 0.36} ${by + h * 0.05}Z`, dk);
  if (hasSpot) k.E(bd, spX, by - h * 0.03, h * 0.11, h * 0.07, dk);
  k.P(bd, `M${w * 0.18} ${by + h * 0.04} Q${w * 0.36} ${by + h * 0.25} ${w * 0.42} ${by - h * 0.04} L${w * 0.28} ${by - h * 0.08}Z`, dk);
  const fBL = mkLeg(-w * 0.31, c, hoof), fFL = mkLeg(w * 0.27, c, hoof);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.08} ${h * 0.08} L${h * 0.04} ${-h * 0.14} L${h * 0.16} ${-h * 0.02} L${h * 0.04} ${h * 0.16}Z`, c);
  k.P(hG, `M${-h * 0.02} ${-h * 0.13} Q${-h * 0.06} ${-h * 0.25} ${-h * 0.12} ${-h * 0.22} Q${-h * 0.05} ${-h * 0.18} ${h * 0.03} ${-h * 0.12}Z`, horn);
  const ear = k.E(hG, -h * 0.06, -h * 0.06, h * 0.075, h * 0.032, dk);
  k.P(hG, `M0 ${-h * 0.15} C${h * 0.15} ${-h * 0.15} ${h * 0.26} ${-h * 0.02} ${h * 0.24} ${h * 0.06} C${h * 0.2} ${h * 0.12} ${h * 0.04} ${h * 0.1} 0 ${h * 0.04}Z`, c);
  k.E(hG, h * 0.21, h * 0.04, h * 0.055, h * 0.042, "#3a302c");
  k.C(hG, h * 0.225, h * 0.035, h * 0.012, "#1c1420");
  k.C(hG, h * 0.09, -h * 0.05, h * 0.018, "#1c1420");
  k.C(hG, h * 0.085, -h * 0.056, h * 0.006, "#fff6e6");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" ? 1 : 0, eat = act === "eat" ? 1 : 0;
    const br = Math.sin(s * 2.1) * h * 0.008, bob = wlk ? Math.abs(Math.sin(s * 5)) * h * 0.015 : br;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const tA = Math.sin(s * 2.8) * 10 + Math.sin(s * 6.3) * 4;
    tG.setAttribute("transform", `translate(${-w * 0.36} ${by - h * 0.08 + bob}) rotate(${tA})`);
    const hA = eat ? 42 + Math.sin(s * 4.5) * 5 : Math.sin(s * 1.7) * 3 + (wlk ? Math.sin(s * 5) * 4 : 0);
    const hY = by - h * 0.12 + bob + (eat ? h * 0.2 : 0);
    hG.setAttribute("transform", `translate(${w * 0.35} ${hY}) rotate(${hA})`);
    ear.setAttribute("transform", `rotate(${Math.sin(s * 3.4) > 0.7 ? -22 : 12} ${-h * 0.03} ${-h * 0.06})`);
    const st = (p) => {
      if (!wlk) return [0, 0];
      const u = (s * 4.2 + p) % 6.283;
      return [Math.sin(u) * h * 0.09, Math.max(0, Math.cos(u)) * h * 0.045];
    };
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
