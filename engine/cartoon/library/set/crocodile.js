// A Sundarbans saltwater crocodile (kumir) with armored scutes, long toothy jaws and sinuous tail.
ZS.define("crocodile", { about: "a Sundarbans crocodile with armored scutes, about 45 cm high and 280 cm long", kind: "set", tags: ["animal", "water", "wild", "zoo", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 65, seed = 1, color = "#4a6644", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), belly = "#c8c298", w = h * 3.1, by = -h * 0.24;
  k.ground(g, w * 0.92);
  const tP = k.P(g, `M${-w * 0.2} ${by - h * 0.14} L${-w * 0.52} ${by + h * 0.04} L${-w * 0.2} ${by + h * 0.12}Z`, dk);
  const bd = k.el("g", {}, g);
  k.E(bd, 0, by, w * 0.26, h * 0.18, color);
  k.P(bd, `M${-w * 0.24} ${by + h * 0.04} Q0 ${by + h * 0.2} ${w * 0.24} ${by + h * 0.04}Z`, belly);
  for (let i = -3; i <= 2; i++) {
    k.P(bd, `M${i * h * 0.22} ${by - h * 0.14} L${i * h * 0.22 + h * 0.08} ${by - h * 0.24} L${i * h * 0.22 + h * 0.16} ${by - h * 0.14}Z`, dk);
  }
  const l1 = k.R(bd, -w * 0.14, by + h * 0.04, h * 0.1, h * 0.18, dk, 3);
  const l2 = k.R(bd, w * 0.12, by + h * 0.04, h * 0.1, h * 0.18, color, 3);
  const hG = k.el("g", {}, g);
  k.P(hG, `M0 0 L${h * 0.72} ${h * 0.03} L${h * 0.68} ${h * 0.12} L0 ${h * 0.12}Z`, belly);
  const uJ = k.el("g", {}, hG);
  k.P(uJ, `M0 ${-h * 0.12} L${h * 0.75} ${-h * 0.06} L${h * 0.75} ${h * 0.03} L0 ${h * 0.02}Z`, color);
  for (let t = 1; t <= 4; t++) k.P(uJ, `M${t * h * 0.14} ${h * 0.02} L${t * h * 0.14 + h * 0.03} ${h * 0.08} L${t * h * 0.14 + h * 0.06} ${h * 0.02}Z`, "#fff6e6");
  k.C(uJ, h * 0.12, -h * 0.14, h * 0.055, color);
  k.C(uJ, h * 0.13, -h * 0.15, h * 0.028, "#e6c34a");
  k.E(uJ, h * 0.13, -h * 0.15, h * 0.008, h * 0.025, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat";
    const sw = Math.sin(s * 2.5) * h * 0.06;
    tP.setAttribute("transform", `translate(0 ${sw * 0.3}) rotate(${Math.sin(s * 2.5) * 4} ${-w * 0.2} ${by})`);
    hG.setAttribute("transform", `translate(${w * 0.22} ${by - h * 0.04})`);
    const jaw = eat ? -22 - Math.abs(Math.sin(s * 6)) * 12 : (Math.sin(s * 1.8) > 0.4 ? -14 : -2);
    uJ.setAttribute("transform", `rotate(${jaw} 0 0)`);
    l1.setAttribute("x", -w * 0.14 + (wlk ? Math.sin(s * 5) * h * 0.08 : 0));
    l2.setAttribute("x", w * 0.12 - (wlk ? Math.sin(s * 5) * h * 0.08 : 0));
  };
  g.tick(0);
  return g;
});
