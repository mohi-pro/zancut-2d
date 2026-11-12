// A river water buffalo (mohish) with wide curved horns, standing on land, walking, grazing or wading in water (act: "wade").
ZS.define("buffalo", { about: "a dark water buffalo on land or wading in water, about 140 cm", kind: "set", tags: ["animal", "village", "water", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 165, seed = 1, color = "#38363c", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = k.light(color, 0.14), horn = "#5e5a54", wde = act === "wade";
  const w = h * 1.4, by = wde ? -h * 0.12 : -h * 0.58;
  if (!wde) k.ground(g, w * 0.95);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col);
    return (sw, lft) => {
      if (wde) { u.setAttribute("d", ""); return; }
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.055} ${by + h * 0.08} L${hx + h * 0.055} ${by + h * 0.08} L${fx + h * 0.04} ${fy} L${fx - h * 0.04} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.26, dk), bFL = mkLeg(w * 0.22, dk);
  const tG = k.el("g", {}, g);
  if (!wde) k.P(tG, `M0 0 Q${-h * 0.06} ${h * 0.2} ${-h * 0.02} ${h * 0.4} L${h * 0.02} ${h * 0.4} Q${h * 0.01} ${h * 0.2} ${h * 0.03} 0Z`, dk);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.42, h * 0.27, color);
  k.E(bd, w * 0.18, by - h * 0.18, h * 0.16, h * 0.11, color);
  k.P(bd, `M${-w * 0.36} ${by - h * 0.12} Q0 ${by - h * 0.3} ${w * 0.32} ${by - h * 0.14}Z`, lt);
  if (!wde) k.P(bd, `M${-w * 0.38} ${by + h * 0.06} Q0 ${by + h * 0.3} ${w * 0.38} ${by + h * 0.06}Z`, dk);
  const fBL = mkLeg(-w * 0.31, color), fFL = mkLeg(w * 0.26, color);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.1} ${h * 0.08} L${h * 0.04} ${-h * 0.12} L${h * 0.18} 0 L${h * 0.04} ${h * 0.16}Z`, color);
  k.P(hG, `M${h * 0.02} ${-h * 0.1} C${-h * 0.14} ${-h * 0.16} ${-h * 0.26} ${-h * 0.02} ${-h * 0.2} ${-h * 0.24} C${-h * 0.14} ${-h * 0.1} ${-h * 0.02} ${-h * 0.04} ${h * 0.06} ${-h * 0.04}Z`, horn);
  const ear = k.E(hG, -h * 0.04, -h * 0.02, h * 0.075, h * 0.032, dk);
  k.P(hG, `M0 ${-h * 0.12} C${h * 0.18} ${-h * 0.12} ${h * 0.28} ${h * 0.01} ${h * 0.25} ${h * 0.09} C${h * 0.18} ${h * 0.14} ${h * 0.04} ${h * 0.1} 0 ${h * 0.03}Z`, color);
  k.E(hG, h * 0.22, h * 0.06, h * 0.06, h * 0.045, dk);
  k.C(hG, h * 0.1, -h * 0.03, h * 0.018, "#1c1420");
  const wR = wde ? k.E(g, 0, 0, w * 0.56, h * 0.09, "#5aa4b8", 0.42) : null;
  if (wde) k.R(g, -w * 0.62, 0, w * 1.24, h * 0.28, "#3e7e94", 0.82);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wde ? Math.sin(s * 2.2) * h * 0.018 : (wlk ? Math.abs(Math.sin(s * 4.5)) * h * 0.016 : Math.sin(s * 1.8) * h * 0.008);
    bd.setAttribute("transform", `translate(0 ${bob})`);
    tG.setAttribute("transform", `translate(${-w * 0.39} ${by - h * 0.06 + bob}) rotate(${Math.sin(s * 3) * 12})`);
    const hA = eat ? 38 + Math.sin(s * 4) * 5 : (wde ? -12 + Math.sin(s * 2) * 3 : Math.sin(s * 1.8) * 3);
    hG.setAttribute("transform", `translate(${w * 0.37} ${by - h * 0.08 + bob + (eat ? h * 0.18 : 0)}) rotate(${hA})`);
    ear.setAttribute("transform", `rotate(${Math.sin(s * 3.8) * 14} ${-h * 0.02} ${-h * 0.02})`);
    if (wde) wR.setAttribute("rx", w * (0.54 + Math.sin(s * 2.5) * 0.05));
    const st = (p) => wlk ? [Math.sin(s * 4.2 + p) * h * 0.09, Math.max(0, Math.cos(s * 4.2 + p)) * h * 0.04] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
