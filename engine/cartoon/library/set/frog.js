// A green pond frog (kuno bang / sona bang) sitting on a floating lotus leaf with pulsing throat and leap.
ZS.define("frog", { about: "a green frog sitting on a floating lotus leaf, about 12 cm", kind: "set", tags: ["animal", "water", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 42, seed = 1, color = "#589c42", flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = "#d8e288", padC = "#3f8248";
  const r1 = k.E(g, 0, 0, h * 0.85, h * 0.15, "#5aa4b8", 0.35);
  const pad = k.el("g", {}, g);
  k.P(pad, `M0 0 L${-h * 0.65} ${-h * 0.05} A${h * 0.68} ${h * 0.14} 0 1 1 ${-h * 0.58} ${h * 0.06}Z`, padC);
  k.P(pad, `M0 0 L${-h * 0.5} ${-h * 0.03} A${h * 0.52} ${h * 0.1} 0 1 1 ${-h * 0.45} ${h * 0.04}Z`, k.light(padC, 0.14));
  const fG = k.el("g", {}, g);
  k.E(fG, -h * 0.12, -h * 0.1, h * 0.14, h * 0.09, dk);
  k.R(fG, -h * 0.22, -h * 0.04, h * 0.16, h * 0.035, dk, 2);
  k.E(fG, 0, -h * 0.2, h * 0.22, h * 0.16, color);
  k.E(fG, h * 0.08, -h * 0.17, h * 0.14, h * 0.11, lt);
  k.R(fG, h * 0.08, -h * 0.16, h * 0.045, h * 0.15, color, 2);
  const sac = k.C(fG, h * 0.18, -h * 0.22, h * 0.08, "#ede6b8");
  k.E(fG, h * 0.12, -h * 0.3, h * 0.15, h * 0.1, color);
  k.C(fG, h * 0.14, -h * 0.38, h * 0.055, color);
  k.C(fG, h * 0.15, -h * 0.38, h * 0.03, "#f0c84b");
  k.C(fG, h * 0.155, -h * 0.38, h * 0.015, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, jmp = act === "walk" || act === "jump";
    const bob = Math.sin(s * 2.5) * h * 0.02;
    pad.setAttribute("transform", `translate(0 ${bob})`);
    r1.setAttribute("rx", h * (0.82 + Math.sin(s * 2.5) * 0.06));
    const jy = jmp ? -Math.abs(Math.sin(s * 6)) * h * 0.55 : bob;
    const jx = jmp ? Math.sin(s * 6) * h * 0.2 : 0;
    const jRot = jmp ? -Math.sin(s * 6) * 22 : 0;
    fG.setAttribute("transform", `translate(${jx} ${jy}) rotate(${jRot} 0 ${-h * 0.2})`);
    const pulse = Math.max(0, Math.sin(s * 5)) * h * 0.095;
    sac.setAttribute("r", h * 0.03 + pulse);
  };
  g.tick(0);
  return g;
});
