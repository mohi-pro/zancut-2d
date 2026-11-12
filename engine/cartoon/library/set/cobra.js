// A spectacled Indian cobra (gokhra shap) with flared hood, swaying posture and flickering forked tongue.
ZS.define("cobra", { about: "a swaying spectacled cobra (gokhra shap), about 60 cm", kind: "set", tags: ["animal", "wild", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 76, seed = 1, color = "#6e5238", flip, facing, speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), belly = "#d9c698";
  k.ground(g, h * 0.85);
  k.E(g, -h * 0.04, -h * 0.06, h * 0.34, h * 0.08, dk);
  k.E(g, 0, -h * 0.12, h * 0.28, h * 0.075, color);
  k.E(g, -h * 0.02, -h * 0.18, h * 0.2, h * 0.06, dk);
  const uG = k.el("g", {}, g);
  const nk = k.P(uG, "", color);
  const hd = k.el("g", {}, uG);
  k.E(hd, 0, h * 0.08, h * 0.16, h * 0.22, color);
  k.E(hd, h * 0.03, h * 0.08, h * 0.1, h * 0.18, belly);
  for (let i = -2; i <= 2; i++) k.R(hd, -h * 0.04, h * (0.08 + i * 0.05), h * 0.14, h * 0.015, dk, 1);
  k.E(hd, h * 0.04, -h * 0.1, h * 0.1, h * 0.065, color);
  const tng = k.P(hd, "", "#d83832");
  k.C(hd, h * 0.08, -h * 0.11, h * 0.018, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, sw = Math.sin(s * 2.6) * h * 0.12;
    nk.setAttribute("d", `M${-h * 0.06} ${-h * 0.18} Q${-h * 0.08 + sw * 0.5} ${-h * 0.42} ${-h * 0.05 + sw} ${-h * 0.66} L${h * 0.05 + sw} ${-h * 0.66} Q${h * 0.06 + sw * 0.5} ${-h * 0.42} ${h * 0.06} ${-h * 0.18}Z`);
    hd.setAttribute("transform", `translate(${sw} ${-h * 0.72}) rotate(${Math.sin(s * 2.6) * 8})`);
    const ext = Math.sin(s * 9) > 0.3 ? h * 0.14 : h * 0.02;
    tng.setAttribute("d", `M${h * 0.12} ${-h * 0.09} L${h * 0.12 + ext} ${-h * 0.11} L${h * 0.12 + ext * 0.8} ${-h * 0.09} L${h * 0.12 + ext} ${-h * 0.07} L${h * 0.12} ${-h * 0.08}Z`);
  };
  g.tick(0);
  return g;
});
