// A red mudflat fiddler crab (lal kakra) of Cox's Bazar and Sundarbans beaches with waving claw and side-scuttling walk.
ZS.define("crab", { about: "a red beach crab (lal kakra) with a waving claw, about 10 cm", kind: "set", tags: ["animal", "water", "wild", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 36, seed = 1, color = "#d8442c", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = k.light(color, 0.18);
  k.ground(g, h * 1.2);
  const cG = k.el("g", {}, g);
  const lG = k.el("g", {}, cG);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      k.P(lG, `M${s * h * (0.2 + i * 0.08)} ${-h * 0.18} L${s * h * (0.42 + i * 0.1)} ${-h * 0.12} L${s * h * (0.48 + i * 0.1)} 0 L${s * h * (0.42 + i * 0.1)} 0 L${s * h * (0.36 + i * 0.1)} ${-h * 0.1}Z`, dk);
    }
  }
  k.E(cG, 0, -h * 0.24, h * 0.34, h * 0.18, color);
  k.E(cG, -h * 0.05, -h * 0.3, h * 0.22, h * 0.08, lt);
  k.R(cG, -h * 0.12, -h * 0.52, h * 0.035, h * 0.16, dk);
  k.R(cG, h * 0.08, -h * 0.52, h * 0.035, h * 0.16, dk);
  k.C(cG, -h * 0.1, -h * 0.54, h * 0.04, "#1c1420");
  k.C(cG, h * 0.1, -h * 0.54, h * 0.04, "#1c1420");
  const clw = k.el("g", {}, cG);
  k.E(clw, h * 0.18, -h * 0.18, h * 0.22, h * 0.12, color);
  k.P(clw, `M${h * 0.18} ${-h * 0.28} L${h * 0.46} ${-h * 0.22} L${h * 0.18} ${-h * 0.16}Z`, lt);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk";
    const sx = wlk ? Math.sin(s * 8) * h * 0.22 : Math.sin(s * 2.5) * h * 0.04;
    const sy = wlk ? Math.abs(Math.cos(s * 16)) * h * 0.04 : 0;
    cG.setAttribute("transform", `translate(${sx} ${-sy})`);
    clw.setAttribute("transform", `translate(${h * 0.22} ${-h * 0.26}) rotate(${-20 + Math.sin(s * 4.5) * 18})`);
  };
  g.tick(0);
  return g;
});
