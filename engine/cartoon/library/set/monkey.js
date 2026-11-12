// A playful rhesus macaque monkey (banor) with pink face, long curled tail, scratching, walking and eating.
ZS.define("monkey", { about: "a rhesus macaque monkey with a long curled tail, about 50 cm", kind: "set", tags: ["animal", "wild", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 72, seed = 1, color = "#9c744c", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.18), face = "#d9927c";
  k.ground(g, h * 0.8);
  const tP = k.P(g, "", dk);
  const bd = k.el("g", {}, g);
  const l1 = k.R(bd, -h * 0.12, -h * 0.24, h * 0.065, h * 0.24, dk, 3);
  const l2 = k.R(bd, h * 0.02, -h * 0.24, h * 0.065, h * 0.24, color, 3);
  k.E(bd, -h * 0.02, -h * 0.42, h * 0.18, h * 0.24, color);
  k.E(bd, h * 0.04, -h * 0.4, h * 0.12, h * 0.18, k.light(color, 0.16));
  const arm = k.P(bd, "", color);
  const hG = k.el("g", {}, bd);
  k.C(hG, -h * 0.08, 0, h * 0.045, face);
  k.C(hG, 0, 0, h * 0.13, color);
  k.E(hG, h * 0.05, h * 0.02, h * 0.095, h * 0.085, face);
  k.C(hG, h * 0.07, -h * 0.01, h * 0.018, "#1c1420");
  k.C(hG, h * 0.12, h * 0.03, h * 0.012, "#7a4438");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const bob = wlk ? Math.abs(Math.sin(s * 8)) * h * 0.06 : Math.sin(s * 3.5) * h * 0.015;
    bd.setAttribute("transform", `translate(0 ${-bob})`);
    const sw = Math.sin(s * 3) * h * 0.1;
    tP.setAttribute("d", `M${-h * 0.14} ${-h * 0.24 - bob} C${-h * 0.42} ${-h * 0.2 - bob} ${-h * 0.48} ${-h * 0.62 + sw} ${-h * 0.28} ${-h * 0.68 + sw} C${-h * 0.18} ${-h * 0.68 + sw} ${-h * 0.26} ${-h * 0.48 + sw} ${-h * 0.32} ${-h * 0.36} L${-h * 0.12} ${-h * 0.2 - bob}Z`);
    hG.setAttribute("transform", `translate(${h * 0.04} ${-h * 0.68}) rotate(${Math.sin(s * 4.5) * 8})`);
    const ay = eat ? -h * 0.6 + Math.sin(s * 10) * h * 0.05 : -h * 0.26 + Math.sin(s * 4) * h * 0.05;
    arm.setAttribute("d", `M${h * 0.02} ${-h * 0.54} Q${h * 0.2} ${-h * 0.42} ${h * 0.14} ${ay} L${h * 0.08} ${ay} Q${h * 0.12} ${-h * 0.4} ${-h * 0.02} ${-h * 0.5}Z`);
    l1.setAttribute("x", -h * 0.12 + (wlk ? Math.sin(s * 8) * h * 0.08 : 0));
    l2.setAttribute("x", h * 0.02 - (wlk ? Math.sin(s * 8) * h * 0.08 : 0));
  };
  g.tick(0);
  return g;
});
