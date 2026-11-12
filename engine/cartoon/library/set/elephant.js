// An Asian elephant (hati) with rounded dome head, flapping ears, swinging trunk, ivory tusks and pillar legs.
ZS.define("elephant", { about: "an Asian elephant with a swinging trunk, about 270 cm", kind: "set", tags: ["animal", "wild", "zoo", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 230, seed = 1, color = "#787c82", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.18), vd = k.dark(color, 0.28), lt = k.light(color, 0.14);
  const w = h * 1.22, by = -h * 0.56;
  k.ground(g, w * 0.95);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.075} ${by + h * 0.08} L${hx + h * 0.075} ${by + h * 0.08} L${fx + h * 0.07} ${fy} L${fx - h * 0.07} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.22, vd), bFL = mkLeg(w * 0.2, vd);
  const tG = k.P(g, `M${-w * 0.38} ${by - h * 0.04} Q${-w * 0.44} ${by + h * 0.18} ${-w * 0.41} ${by + h * 0.32} L${-w * 0.39} ${by + h * 0.32}Z`, dk);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.4, h * 0.3, color);
  k.P(bd, `M${-w * 0.34} ${by - h * 0.14} Q0 ${by - h * 0.34} ${w * 0.32} ${by - h * 0.14}Z`, lt);
  k.P(bd, `M${-w * 0.35} ${by + h * 0.08} Q0 ${by + h * 0.32} ${w * 0.35} ${by + h * 0.08}Z`, dk);
  const fBL = mkLeg(-w * 0.27, color), fFL = mkLeg(w * 0.25, color);
  const hG = k.el("g", {}, g);
  const trk = k.P(hG, "", color);
  k.C(hG, h * 0.04, -h * 0.06, h * 0.18, color);
  k.C(hG, h * 0.02, -h * 0.18, h * 0.12, lt);
  const ear = k.E(hG, -h * 0.08, -h * 0.04, h * 0.13, h * 0.17, dk);
  k.P(hG, `M${h * 0.14} ${h * 0.04} Q${h * 0.26} ${h * 0.1} ${h * 0.3} ${h * 0.02} Q${h * 0.24} ${h * 0.04} ${h * 0.14} 0Z`, "#f4efe6");
  k.C(hG, h * 0.12, -h * 0.08, h * 0.016, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 3.8)) * h * 0.015 : Math.sin(s * 1.6) * h * 0.007;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    hG.setAttribute("transform", `translate(${w * 0.33} ${by - h * 0.1 + bob})`);
    ear.setAttribute("rx", h * (0.11 + Math.abs(Math.sin(s * 2.8)) * 0.035));
    const sw = eat ? h * 0.14 + Math.sin(s * 4) * h * 0.06 : Math.sin(s * 2.1) * h * 0.12;
    const ty = eat ? h * 0.24 : h * 0.34;
    trk.setAttribute("d", `M${h * 0.14} ${-h * 0.08} C${h * 0.24} ${h * 0.06} ${h * 0.16 + sw} ${ty * 0.7} ${h * 0.12 + sw} ${ty} L${h * 0.06 + sw} ${ty} C${h * 0.08 + sw} ${ty * 0.7} ${h * 0.14} ${h * 0.06} ${h * 0.08} 0Z`);
    const st = (p) => wlk ? [Math.sin(s * 3.8 + p) * h * 0.075, Math.max(0, Math.cos(s * 3.8 + p)) * h * 0.035] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
