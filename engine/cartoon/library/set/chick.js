// Small fluffy chicks (3 to 5 together via option n) that hop, peck and cheep around their anchor.
ZS.define("chick", { about: "a cluster of small fluffy yellow chicks, about 12 cm", kind: "set", tags: ["animal", "bird", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 28, seed = 1, color = "#f0c84b", n = 4, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed);
  const cnt = Math.max(1, Math.min(8, n));
  const items = [];
  for (let i = 0; i < cnt; i++) {
    const cx = cnt === 1 ? 0 : (i - (cnt - 1) / 2) * h * 0.95 + (r() - 0.5) * h * 0.25;
    const cy = (r() - 0.5) * h * 0.22, sc = 0.88 + r() * 0.22, ch = h * sc, ph = r() * 6.28;
    const col = k.mix(color, r() > 0.7 ? "#d99a4e" : "#f6d868", r() * 0.4);
    const dk = k.dark(col, 0.16), lt = k.light(col, 0.18), dir = r() > 0.35 ? 1 : -1;
    const cg = k.el("g", {}, g);
    k.ground(cg, ch * 0.7);
    const l1 = k.R(cg, -ch * 0.08, -ch * 0.22, ch * 0.04, ch * 0.22, "#d9822b");
    const l2 = k.R(cg, ch * 0.04, -ch * 0.22, ch * 0.04, ch * 0.22, "#e5943a");
    const bd = k.el("g", {}, cg);
    k.E(bd, 0, -ch * 0.42, ch * 0.32, ch * 0.26, col);
    k.E(bd, -ch * 0.04, -ch * 0.54, ch * 0.22, ch * 0.12, lt);
    k.E(bd, 0, -ch * 0.32, ch * 0.28, ch * 0.14, dk);
    k.C(bd, ch * 0.18, -ch * 0.62, ch * 0.2, col);
    const wg = k.E(bd, -ch * 0.04, -ch * 0.42, ch * 0.14, ch * 0.09, dk);
    k.P(bd, `M${ch * 0.34} ${-ch * 0.66} L${ch * 0.48} ${-ch * 0.61} L${ch * 0.34} ${-ch * 0.56}Z`, "#e07a24");
    k.C(bd, ch * 0.23, -ch * 0.65, ch * 0.032, "#1c1420");
    items.push({ cg, bd, wg, l1, l2, cx, cy, ch, ph, dir });
  }
  g.tick = (t) => {
    for (const it of items) {
      const s = t * speed + it.ph, pck = act === "peck" || act === "eat" || (act === "idle" && Math.sin(s * 2.3) > 0.45);
      const wlk = act === "walk";
      const hop = wlk ? Math.abs(Math.sin(s * 10)) * it.ch * 0.14 : Math.max(0, Math.sin(s * 6)) * it.ch * 0.05;
      const rot = pck ? 34 + Math.sin(s * 16) * 12 : Math.sin(s * 4) * 5;
      it.cg.setAttribute("transform", `translate(${it.cx} ${it.cy}) scale(${it.dir} 1)`);
      it.bd.setAttribute("transform", `translate(0 ${-hop}) rotate(${rot} 0 ${-it.ch * 0.4})`);
      it.wg.setAttribute("transform", `rotate(${Math.sin(s * 14) * 15} ${-it.ch * 0.04} ${-it.ch * 0.42})`);
      it.l1.setAttribute("x", -it.ch * 0.08 + (wlk ? Math.sin(s * 10) * it.ch * 0.08 : 0));
      it.l2.setAttribute("x", it.ch * 0.04 - (wlk ? Math.sin(s * 10) * it.ch * 0.08 : 0));
    }
  };
  g.tick(0);
  return g;
});
