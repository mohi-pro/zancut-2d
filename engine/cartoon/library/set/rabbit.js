// A soft white-or-fawn rabbit (khorgosh) with long upright ears, cotton tail, nose twitch and hopping gait.
ZS.define("rabbit", { about: "a soft rabbit with long upright ears, about 25 cm", kind: "set", tags: ["animal", "village", "story", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 50, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#f2ede4", "#d6b898", "#a89e94"]);
  const dk = k.dark(c, 0.14), pink = "#e59a9c";
  k.ground(g, h * 0.8);
  const bd = k.el("g", {}, g);
  k.C(bd, -h * 0.28, -h * 0.18, h * 0.085, "#fff6e6");
  k.E(bd, -h * 0.08, -h * 0.14, h * 0.16, h * 0.12, dk);
  k.E(bd, 0, -h * 0.04, h * 0.14, h * 0.045, dk);
  k.E(bd, 0, -h * 0.26, h * 0.26, h * 0.2, c);
  k.E(bd, h * 0.16, -h * 0.1, h * 0.05, h * 0.1, c);
  const hG = k.el("g", {}, bd);
  const e1 = k.E(hG, -h * 0.06, -h * 0.22, h * 0.045, h * 0.18, dk);
  const e2 = k.el("g", {}, hG);
  k.E(e2, 0, -h * 0.22, h * 0.05, h * 0.19, c);
  k.E(e2, h * 0.01, -h * 0.21, h * 0.025, h * 0.13, pink);
  k.E(hG, h * 0.04, -h * 0.04, h * 0.15, h * 0.13, c);
  const ns = k.C(hG, h * 0.18, -h * 0.03, h * 0.022, pink);
  k.C(hG, h * 0.09, -h * 0.07, h * 0.024, "#2b2024");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk" || act === "jump", eat = act === "eat";
    const hop = wlk ? Math.abs(Math.sin(s * 9)) * h * 0.22 : 0;
    const rot = wlk ? -Math.sin(s * 9) * 14 : Math.sin(s * 3) * 2;
    bd.setAttribute("transform", `translate(0 ${-hop}) rotate(${rot} 0 ${-h * 0.2})`);
    const hY = -h * 0.42 + (eat ? h * 0.16 : 0);
    hG.setAttribute("transform", `translate(${h * 0.18} ${hY}) rotate(${eat ? 32 + Math.sin(s * 12) * 5 : 0})`);
    e1.setAttribute("transform", `rotate(${-12 + Math.sin(s * 5) * 6} ${-h * 0.06} ${-h * 0.06})`);
    e2.setAttribute("transform", `rotate(${-4 + Math.cos(s * 5) * 8} 0 ${-h * 0.06})`);
    ns.setAttribute("cy", -h * 0.03 + Math.sin(s * 18) * h * 0.01);
  };
  g.tick(0);
  return g;
});
