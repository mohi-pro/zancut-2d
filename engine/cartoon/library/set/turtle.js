// A pond tortoise / turtle (kochchop) with patterned dome shell, extending neck and slow paddling walk.
ZS.define("turtle", { about: "a pond turtle with a patterned dome shell, about 22 cm", kind: "set", tags: ["animal", "water", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 44, seed = 1, color = "#4e6e3e", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const shC = "#6e5234", dk = k.dark(shC, 0.2), lt = k.light(shC, 0.18);
  const w = h * 1.55;
  k.ground(g, w * 0.9);
  const lB = k.E(g, -w * 0.24, -h * 0.08, h * 0.11, h * 0.06, k.dark(color, 0.18));
  const lF = k.E(g, w * 0.22, -h * 0.08, h * 0.11, h * 0.06, color);
  const hG = k.el("g", {}, g);
  k.P(hG, `M${-h * 0.12} ${h * 0.06} Q${h * 0.05} ${h * 0.04} ${h * 0.14} ${-h * 0.08} L${h * 0.04} ${-h * 0.14} Q0 ${-h * 0.04} ${-h * 0.12} ${-h * 0.04}Z`, color);
  k.E(hG, h * 0.12, -h * 0.11, h * 0.11, h * 0.08, color);
  k.C(hG, h * 0.16, -h * 0.13, h * 0.02, "#1c1420");
  const sh = k.el("g", {}, g);
  k.P(sh, `M${-w * 0.44} ${-h * 0.12} L${-w * 0.54} ${-h * 0.08} L${-w * 0.42} ${-h * 0.06}Z`, color);
  k.P(sh, `M${-w * 0.42} ${-h * 0.1} C${-w * 0.4} ${-h * 0.72} ${w * 0.4} ${-h * 0.72} ${w * 0.42} ${-h * 0.1}Z`, shC);
  k.E(sh, -w * 0.14, -h * 0.34, h * 0.14, h * 0.1, lt);
  k.E(sh, w * 0.12, -h * 0.34, h * 0.14, h * 0.1, dk);
  k.E(sh, 0, -h * 0.46, h * 0.16, h * 0.09, lt);
  k.R(sh, -w * 0.44, -h * 0.15, w * 0.88, h * 0.07, "#c9a86a", 3);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const sw = wlk ? Math.sin(s * 3.5) * h * 0.08 : 0;
    lB.setAttribute("cx", -w * 0.24 + sw);
    lF.setAttribute("cx", w * 0.22 - sw);
    const ext = h * (0.04 + Math.sin(s * 2) * 0.03);
    const hA = eat ? 24 + Math.sin(s * 5) * 6 : Math.sin(s * 2) * 4;
    hG.setAttribute("transform", `translate(${w * 0.38 + ext} ${-h * 0.16}) rotate(${hA})`);
  };
  g.tick(0);
  return g;
});
