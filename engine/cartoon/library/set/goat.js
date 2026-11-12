// A Black Bengal goat with perky tail, beard, floppy ears, walking, idle bleat/chew and grazing.
ZS.define("goat", { about: "a Black Bengal goat, about 55 cm", kind: "set", tags: ["animal", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 95, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#2d292e", "#3b353c", "#6e4b3a", "#d9cdb8", "#483c38"]);
  const dk = k.dark(c, 0.2), lt = k.light(c, 0.15), hoof = "#1c1420";
  const w = h * 1.18, by = -h * 0.56;
  k.ground(g, w * 0.85);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), l = k.P(lg, "", col), hf = k.P(lg, "", hoof);
    return (sw, lft) => {
      const kx = hx + sw * 0.4, ky = -h * 0.24 - lft * 0.35, fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.042} ${by + h * 0.08} L${hx + h * 0.042} ${by + h * 0.08} L${kx + h * 0.025} ${ky} L${kx - h * 0.025} ${ky}Z`);
      l.setAttribute("d", `M${kx - h * 0.024} ${ky} L${kx + h * 0.024} ${ky} L${fx + h * 0.02} ${fy - h * 0.035} L${fx - h * 0.02} ${fy - h * 0.035}Z`);
      hf.setAttribute("d", `M${fx - h * 0.022} ${fy - h * 0.035} L${fx + h * 0.025} ${fy - h * 0.035} L${fx + h * 0.028} ${fy} L${fx - h * 0.022} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.24, dk), bFL = mkLeg(w * 0.21, dk);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 Q${-h * 0.08} ${-h * 0.14} ${-h * 0.03} ${-h * 0.2} Q${h * 0.03} ${-h * 0.12} ${h * 0.03} 0Z`, c);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.36, h * 0.2, c);
  k.P(bd, `M${-w * 0.3} ${by - h * 0.1} Q0 ${by - h * 0.22} ${w * 0.28} ${by - h * 0.1} Q0 ${by - h * 0.14} ${-w * 0.3} ${by - h * 0.1}Z`, lt);
  k.P(bd, `M${-w * 0.32} ${by + h * 0.05} Q0 ${by + h * 0.22} ${w * 0.32} ${by + h * 0.05}Z`, dk);
  const fBL = mkLeg(-w * 0.28, c), fFL = mkLeg(w * 0.25, c);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.07} ${h * 0.12} L${h * 0.02} ${-h * 0.16} L${h * 0.12} ${-h * 0.08} L${h * 0.04} ${h * 0.16}Z`, c);
  k.P(hG, `M0 ${-h * 0.16} Q${-h * 0.05} ${-h * 0.27} ${-h * 0.11} ${-h * 0.24} Q${-h * 0.03} ${-h * 0.18} ${h * 0.04} ${-h * 0.14}Z`, "#7a7067");
  k.P(hG, `M${h * 0.16} ${-h * 0.02} Q${h * 0.19} ${h * 0.08} ${h * 0.14} ${h * 0.12} Q${h * 0.12} ${h * 0.04} ${h * 0.13} ${-h * 0.02}Z`, dk);
  const ear = k.E(hG, -h * 0.03, -h * 0.05, h * 0.032, h * 0.085, dk);
  k.P(hG, `M0 ${-h * 0.16} C${h * 0.15} ${-h * 0.16} ${h * 0.24} ${-h * 0.05} ${h * 0.21} ${h * 0.01} C${h * 0.16} ${h * 0.05} ${h * 0.03} ${h * 0.04} 0 ${-h * 0.04}Z`, c);
  k.C(hG, h * 0.08, -h * 0.09, h * 0.018, "#e6c35c");
  k.C(hG, h * 0.082, -h * 0.09, h * 0.008, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" ? 1 : 0, eat = act === "eat" ? 1 : 0;
    const bob = wlk ? Math.abs(Math.sin(s * 6.5)) * h * 0.018 : Math.sin(s * 2.6) * h * 0.007;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.33} ${by - h * 0.08 + bob}) rotate(${Math.sin(s * 7) * 14})`);
    const hA = eat ? 48 + Math.sin(s * 6) * 6 : Math.sin(s * 2.2) * 4 + (wlk ? Math.sin(s * 6.5) * 5 : 0);
    const hY = by - h * 0.14 + bob + (eat ? h * 0.22 : 0);
    hG.setAttribute("transform", `translate(${w * 0.31} ${hY}) rotate(${hA})`);
    ear.setAttribute("transform", `rotate(${18 + Math.sin(s * 4.5) * 8} ${-h * 0.03} ${-h * 0.09})`);
    const st = (p) => {
      if (!wlk) return [0, 0];
      const u = (s * 5.5 + p) % 6.283;
      return [Math.sin(u) * h * 0.095, Math.max(0, Math.cos(u)) * h * 0.05];
    };
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
