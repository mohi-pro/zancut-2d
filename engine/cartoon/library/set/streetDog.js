// A Bangladeshi deshi street dog (pariah dog) with curled tail, warm sandy coat, panting, trotting and sniffing.
ZS.define("streetDog", { about: "a Bangladeshi street dog with a curled tail, about 52 cm", kind: "set", tags: ["animal", "street", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 92, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#c88e52", "#b87a42", "#d9aa72", "#52463e", "#a86b3c"]);
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.16), vd = k.dark(c, 0.28);
  const w = h * 1.28, by = -h * 0.56;
  k.ground(g, w * 0.88);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col), l = k.P(lg, "", col), pw = k.E(lg, 0, 0, h * 0.035, h * 0.018, col);
    return (sw, lft) => {
      const kx = hx + sw * 0.45, ky = -h * 0.25 - lft * 0.35, fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.045} ${by + h * 0.08} L${hx + h * 0.045} ${by + h * 0.08} L${kx + h * 0.026} ${ky} L${kx - h * 0.026} ${ky}Z`);
      l.setAttribute("d", `M${kx - h * 0.024} ${ky} L${kx + h * 0.024} ${ky} L${fx + h * 0.02} ${fy - h * 0.015} L${fx - h * 0.02} ${fy - h * 0.015}Z`);
      pw.setAttribute("cx", fx + h * 0.015); pw.setAttribute("cy", fy - h * 0.015);
    };
  };
  const bBL = mkLeg(-w * 0.26, vd), bFL = mkLeg(w * 0.22, vd);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 C${-h * 0.18} ${-h * 0.06} ${-h * 0.22} ${-h * 0.28} ${-h * 0.06} ${-h * 0.3} C${h * 0.02} ${-h * 0.28} ${-h * 0.08} ${-h * 0.18} ${-h * 0.08} ${-h * 0.06}Z`, c);
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-w * 0.34} ${by - h * 0.1} C${-w * 0.1} ${by - h * 0.18} ${w * 0.2} ${by - h * 0.18} ${w * 0.34} ${by - h * 0.06} C${w * 0.36} ${by + h * 0.12} ${w * 0.12} ${by + h * 0.18} 0 ${by + h * 0.14} C${-w * 0.18} ${by + h * 0.08} ${-w * 0.34} ${by + h * 0.1} ${-w * 0.34} ${by - h * 0.1}Z`, c);
  k.P(bd, `M${-w * 0.28} ${by - h * 0.12} Q0 ${by - h * 0.2} ${w * 0.28} ${by - h * 0.1}Z`, lt);
  k.P(bd, `M${-w * 0.28} ${by + h * 0.06} Q${w * 0.08} ${by + h * 0.18} ${w * 0.3} ${by + h * 0.06}Z`, dk);
  const fBL = mkLeg(-w * 0.3, c), fFL = mkLeg(w * 0.26, c);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.08} ${h * 0.08} L${h * 0.02} ${-h * 0.15} L${h * 0.14} ${-h * 0.08} L${h * 0.06} ${h * 0.12}Z`, c);
  const ear = k.P(hG, `M0 ${-h * 0.14} L${-h * 0.04} ${-h * 0.27} L${h * 0.07} ${-h * 0.16}Z`, dk);
  k.E(hG, h * 0.09, -h * 0.11, h * 0.1, h * 0.085, c);
  k.P(hG, `M${h * 0.14} ${-h * 0.15} L${h * 0.28} ${-h * 0.1} L${h * 0.26} ${-h * 0.04} L${h * 0.12} ${-h * 0.04}Z`, c);
  const tng = k.E(hG, h * 0.21, -h * 0.03, h * 0.022, h * 0.038, "#d95b66");
  k.C(hG, h * 0.27, -h * 0.09, h * 0.02, "#1c1420");
  k.C(hG, h * 0.13, -h * 0.12, h * 0.017, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 7)) * h * 0.022 : Math.sin(s * 3.5) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.31} ${by - h * 0.06 + bob}) rotate(${Math.sin(s * 8) * 14})`);
    const hA = eat ? 44 + Math.sin(s * 6) * 5 : Math.sin(s * 2.5) * 4 + (wlk ? Math.sin(s * 7) * 4 : 0);
    const hY = by - h * 0.12 + bob + (eat ? h * 0.2 : 0);
    hG.setAttribute("transform", `translate(${w * 0.31} ${hY}) rotate(${hA})`);
    ear.setAttribute("transform", `rotate(${Math.sin(s * 4) * 6} ${h * 0.02} ${-h * 0.15})`);
    tng.setAttribute("ry", h * (0.025 + Math.abs(Math.sin(s * 9)) * 0.02));
    const st = (p) => wlk ? [Math.sin(s * 6.5 + p) * h * 0.11, Math.max(0, Math.cos(s * 6.5 + p)) * h * 0.055] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
