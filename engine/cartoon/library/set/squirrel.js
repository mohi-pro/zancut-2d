// A striped palm squirrel (kathbirali) with bushy arched tail, nibbling a nut with its paws or scampering.
ZS.define("squirrel", { about: "a striped palm squirrel with a bushy tail, about 18 cm", kind: "set", tags: ["animal", "village", "city", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 44, seed = 1, color = "#9c6b42", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.2), lt = "#e8dec8";
  k.ground(g, h * 0.75);
  const tG = k.el("g", {}, g);
  k.P(tG, `M0 0 C${-h * 0.38} ${-h * 0.05} ${-h * 0.45} ${-h * 0.65} ${-h * 0.08} ${-h * 0.78} C${h * 0.12} ${-h * 0.78} ${-h * 0.08} ${-h * 0.42} 0 ${-h * 0.12}Z`, dk);
  k.P(tG, `M${-h * 0.04} ${-h * 0.06} C${-h * 0.3} ${-h * 0.12} ${-h * 0.34} ${-h * 0.58} ${-h * 0.08} ${-h * 0.68} C0 ${-h * 0.65} ${-h * 0.1} ${-h * 0.36} ${-h * 0.02} ${-h * 0.12}Z`, color);
  const bd = k.el("g", {}, g);
  k.E(bd, -h * 0.06, -h * 0.14, h * 0.14, h * 0.12, dk);
  k.E(bd, h * 0.02, -h * 0.04, h * 0.12, h * 0.04, dk);
  k.E(bd, 0, -h * 0.34, h * 0.18, h * 0.24, color);
  k.P(bd, `M${-h * 0.14} ${-h * 0.48} Q${-h * 0.18} ${-h * 0.3} ${-h * 0.1} ${-h * 0.16}`, lt);
  k.R(bd, -h * 0.11, -h * 0.48, h * 0.035, h * 0.26, lt, 2);
  k.R(bd, -h * 0.04, -h * 0.46, h * 0.03, h * 0.24, lt, 2);
  const hG = k.el("g", {}, bd);
  k.P(hG, `M${-h * 0.04} ${-h * 0.1} L${-h * 0.02} ${-h * 0.22} L${h * 0.05} ${-h * 0.12}Z`, dk);
  k.E(hG, h * 0.04, -h * 0.04, h * 0.13, h * 0.11, color);
  k.C(hG, h * 0.08, -h * 0.06, h * 0.024, "#1c1420");
  k.C(hG, h * 0.16, -h * 0.03, h * 0.016, "#2c221e");
  const pG = k.el("g", {}, bd);
  k.E(pG, 0, 0, h * 0.08, h * 0.04, color);
  k.C(pG, h * 0.08, -h * 0.02, h * 0.045, "#6e4726");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "run";
    const hop = wlk ? Math.abs(Math.sin(s * 12)) * h * 0.16 : 0;
    const rot = wlk ? 24 + Math.sin(s * 12) * 10 : Math.sin(s * 4) * 2;
    bd.setAttribute("transform", `translate(0 ${-hop}) rotate(${rot} 0 ${-h * 0.25})`);
    tG.setAttribute("transform", `translate(${-h * 0.12} ${-h * 0.14 - hop}) rotate(${Math.sin(s * 9) * 12})`);
    const nib = Math.sin(s * 18) * h * 0.02;
    hG.setAttribute("transform", `translate(${h * 0.06} ${-h * 0.56 + nib * 0.5}) rotate(${Math.sin(s * 18) * 4})`);
    pG.setAttribute("transform", `translate(${h * 0.14} ${-h * 0.42 - nib})`);
  };
  g.tick(0);
  return g;
});
