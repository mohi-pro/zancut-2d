// A woolly sheep (bhera) with soft cream fleece, dark face and legs, grazing and walking.
ZS.define("sheep", { about: "a woolly village sheep, about 65 cm", kind: "set", tags: ["animal", "village", "field", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 100, seed = 1, color = "#ede6d8", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.16), lt = k.light(color, 0.12), skin = "#3b3532";
  const w = h * 1.18, by = -h * 0.54;
  k.ground(g, w * 0.85);
  const mkLeg = (hx, col) => {
    const lg = k.el("g", {}, g), u = k.P(lg, "", col);
    return (sw, lft) => {
      const fx = hx + sw, fy = -lft;
      u.setAttribute("d", `M${hx - h * 0.035} ${by + h * 0.1} L${hx + h * 0.035} ${by + h * 0.1} L${fx + h * 0.024} ${fy} L${fx - h * 0.024} ${fy}Z`);
    };
  };
  const bBL = mkLeg(-w * 0.22, k.dark(skin, 0.2)), bFL = mkLeg(w * 0.2, k.dark(skin, 0.2));
  const bd = k.el("g", {}, g);
  k.E(bd, -w * 0.36, by + h * 0.02, h * 0.06, h * 0.1, dk);
  k.E(bd, 0, by, w * 0.38, h * 0.24, color);
  for (const [cx, cy, cr] of [[-0.22, -0.12, 0.15], [0, -0.15, 0.16], [0.2, -0.12, 0.15], [-0.15, 0.08, 0.14], [0.14, 0.08, 0.14]]) {
    k.C(bd, w * cx, by + h * cy, h * cr, cy < 0 ? lt : dk);
  }
  k.E(bd, 0, by, w * 0.34, h * 0.19, color);
  const fBL = mkLeg(-w * 0.26, skin), fFL = mkLeg(w * 0.24, skin);
  const hG = k.el("g", {}, g);
  k.E(hG, 0, -h * 0.04, h * 0.12, h * 0.14, color);
  k.E(hG, -h * 0.03, -h * 0.05, h * 0.065, h * 0.028, skin);
  k.P(hG, `M0 ${-h * 0.14} C${h * 0.16} ${-h * 0.14} ${h * 0.24} ${-h * 0.02} ${h * 0.2} ${h * 0.06} C${h * 0.14} ${h * 0.1} ${h * 0.02} ${h * 0.08} 0 0Z`, skin);
  k.C(hG, h * 0.05, -h * 0.13, h * 0.075, lt);
  k.C(hG, h * 0.09, -h * 0.05, h * 0.018, "#e6c35c");
  k.C(hG, h * 0.092, -h * 0.05, h * 0.008, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 6)) * h * 0.018 : Math.sin(s * 2.5) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${bob})`);
    const hA = eat ? 46 + Math.sin(s * 6) * 5 : Math.sin(s * 2.2) * 4;
    hG.setAttribute("transform", `translate(${w * 0.31} ${by - h * 0.1 + bob + (eat ? h * 0.22 : 0)}) rotate(${hA})`);
    const st = (p) => wlk ? [Math.sin(s * 5.5 + p) * h * 0.08, Math.max(0, Math.cos(s * 5.5 + p)) * h * 0.04] : [0, 0];
    bBL(...st(0)); fBL(...st(3.14)); bFL(...st(1.57)); fFL(...st(4.71));
  };
  g.tick(0);
  return g;
});
