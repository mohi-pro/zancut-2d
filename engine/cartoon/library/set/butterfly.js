// A colorful butterfly (projapoti) that flits in a gentle figure-eight around its anchor or rests on a blossom.
ZS.define("butterfly", { about: "a colorful butterfly flitting around its anchor, about 8 cm", kind: "set", tags: ["animal", "insect", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 38, seed = 1, color, color2 = "#2b222c", flip, facing, act = "fly", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const c = color || k.pick(r, ["#e6842e", "#3898b8", "#e2b838", "#d64a68", "#7a52b4"]);
  const lt = k.light(c, 0.22);
  const bG = k.el("g", {}, g), wG = k.el("g", {}, bG);
  k.P(wG, `M0 0 C${-h * 0.45} ${-h * 0.55} ${-h * 0.65} ${-h * 0.05} 0 ${h * 0.08}Z`, color2);
  k.P(wG, `M${-h * 0.03} ${-h * 0.02} C${-h * 0.38} ${-h * 0.45} ${-h * 0.52} ${-h * 0.06} ${-h * 0.03} ${h * 0.05}Z`, c);
  k.C(wG, -h * 0.24, -h * 0.18, h * 0.07, lt);
  k.P(wG, `M0 ${h * 0.05} C${-h * 0.42} ${h * 0.08} ${-h * 0.36} ${h * 0.48} 0 ${h * 0.24}Z`, color2);
  k.P(wG, `M${-h * 0.03} ${h * 0.06} C${-h * 0.34} ${h * 0.1} ${-h * 0.28} ${h * 0.38} ${-h * 0.03} ${h * 0.2}Z`, c);
  k.E(bG, h * 0.02, h * 0.08, h * 0.05, h * 0.2, color2);
  k.C(bG, h * 0.05, -h * 0.1, h * 0.055, color2);
  k.P(bG, `M${h * 0.06} ${-h * 0.14} Q${h * 0.18} ${-h * 0.28} ${h * 0.24} ${-h * 0.24} L${h * 0.22} ${-h * 0.22} Q${h * 0.15} ${-h * 0.24} ${h * 0.05} ${-h * 0.13}Z`, color2);
  g.tick = (t) => {
    const s = t * speed + ph, isP = act === "perch";
    const dx = isP ? 0 : Math.sin(s * 2.1) * h * 0.65;
    const dy = isP ? -h * 0.3 : -h * 0.6 + Math.sin(s * 4.2) * h * 0.28;
    const tilt = isP ? -15 : -18 + Math.cos(s * 2.1) * 14;
    const flap = isP ? 0.35 + Math.sin(s * 2.5) * 0.25 : 0.25 + Math.abs(Math.sin(s * 14)) * 0.85;
    bG.setAttribute("transform", `translate(${dx} ${dy}) rotate(${tilt})`);
    wG.setAttribute("transform", `scale(${flap} 1)`);
  };
  g.tick(0);
  return g;
});
