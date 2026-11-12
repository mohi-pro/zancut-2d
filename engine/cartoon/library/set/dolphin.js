// A Ganges/Padma river dolphin (shushuk) with long slender rostrum leaping in a graceful arc over water ripples.
ZS.define("dolphin", { about: "a Bangladeshi river dolphin (shushuk) leaping over water, about 180 cm", kind: "set", tags: ["animal", "water", "wild", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 110, seed = 1, color = "#6c7e8c", flip, facing, speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.2), lt = "#cfd8de";
  const r1 = k.E(g, 0, 0, h * 0.72, h * 0.11, "#5aa4b8", 0.42);
  const r2 = k.E(g, 0, 0, h * 0.45, h * 0.06, "#fff6e6", 0.5);
  const dG = k.el("g", {}, g);
  k.P(dG, `M${-h * 0.42} ${h * 0.05} L${-h * 0.62} ${-h * 0.08} L${-h * 0.55} ${h * 0.06} L${-h * 0.62} ${h * 0.18}Z`, dk);
  k.P(dG, `M${-h * 0.08} ${-h * 0.1} L${-h * 0.16} ${-h * 0.22} L${h * 0.06} ${-h * 0.12}Z`, dk);
  k.P(dG, `M${-h * 0.45} ${h * 0.04} C${-h * 0.2} ${-h * 0.22} ${h * 0.22} ${-h * 0.22} ${h * 0.36} 0 C${h * 0.18} ${h * 0.14} ${-h * 0.2} ${h * 0.14} ${-h * 0.45} ${h * 0.04}Z`, color);
  k.P(dG, `M${-h * 0.36} ${h * 0.04} Q0 ${h * 0.16} ${h * 0.32} ${h * 0.01} Q0 ${h * 0.06} ${-h * 0.36} ${h * 0.04}Z`, lt);
  k.P(dG, `M${h * 0.06} ${h * 0.04} L${-h * 0.02} ${h * 0.2} L${h * 0.16} ${h * 0.06}Z`, dk);
  k.P(dG, `M${h * 0.32} ${-h * 0.03} L${h * 0.56} 0 L${h * 0.32} ${h * 0.03}Z`, color);
  k.C(dG, h * 0.26, -h * 0.03, h * 0.016, "#1c1420");
  g.tick = (t) => {
    const u = ((t * speed * 0.65 + ph) % 2.4) / 2.4, a = u * 3.1416;
    const dx = (u - 0.5) * h * 1.15, dy = -Math.sin(a) * h * 0.68 + h * 0.08;
    const rot = -Math.cos(a) * 44;
    dG.setAttribute("transform", `translate(${dx} ${dy}) rotate(${rot})`);
    r1.setAttribute("rx", h * (0.48 + Math.sin(a) * 0.32));
    r2.setAttribute("rx", h * (0.28 + Math.sin(a) * 0.22));
  };
  g.tick(0);
  return g;
});
