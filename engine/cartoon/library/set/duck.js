// A Bangladeshi pond duck (pati hash) that waddles on land, grazes, or glides on water with ripples (act: "swim").
ZS.define("duck", { about: "a pond duck on land or swimming on water, about 42 cm", kind: "set", tags: ["animal", "bird", "village", "water", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 72, seed = 1, color, flip, facing, act = "idle", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const drake = r() > 0.5;
  const c = color || (drake ? "#a89882" : "#b88a58"), hdC = drake ? "#285c48" : c;
  const dk = k.dark(c, 0.18), lt = k.light(c, 0.16), bill = "#e59a2e";
  const swm = act === "swim", by = swm ? -h * 0.18 : -h * 0.42;
  if (!swm) k.ground(g, h * 0.8);
  const rip1 = swm ? k.E(g, 0, 0, h * 0.55, h * 0.09, "#5aa4b8", 0.35) : null;
  const rip2 = swm ? k.E(g, -h * 0.1, 0, h * 0.38, h * 0.06, "#fff6e6", 0.45) : null;
  const lG = k.el("g", {}, g);
  const l1 = !swm ? k.P(lG, "", "#d97a24") : null, l2 = !swm ? k.P(lG, "", "#e88b30") : null;
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.44} ${by - h * 0.08} L${-h * 0.24} ${by - h * 0.12} L${-h * 0.24} ${by + h * 0.08}Z`, dk);
  k.E(bd, 0, by, h * 0.36, h * 0.2, c);
  k.P(bd, `M${-h * 0.3} ${by - h * 0.06} Q0 ${by - h * 0.22} ${h * 0.3} ${by - h * 0.06}Z`, lt);
  k.P(bd, `M${-h * 0.32} ${by + h * 0.04} Q0 ${by + h * 0.22} ${h * 0.32} ${by + h * 0.04}Z`, dk);
  const wg = k.E(bd, -h * 0.03, by - h * 0.01, h * 0.22, h * 0.11, dk);
  const hG = k.el("g", {}, bd);
  k.P(hG, `M${-h * 0.06} ${h * 0.06} C${-h * 0.04} ${-h * 0.14} ${h * 0.02} ${-h * 0.26} ${h * 0.08} ${-h * 0.26} L${h * 0.14} ${-h * 0.22} C${h * 0.1} ${-h * 0.1} ${h * 0.08} ${h * 0.02} ${h * 0.06} ${h * 0.08}Z`, hdC);
  if (drake) k.R(hG, -h * 0.01, -h * 0.11, h * 0.1, h * 0.025, "#f4efe6", 2);
  k.E(hG, h * 0.09, -h * 0.26, h * 0.11, h * 0.095, hdC);
  k.P(hG, `M${h * 0.17} ${-h * 0.29} C${h * 0.32} ${-h * 0.29} ${h * 0.34} ${-h * 0.22} ${h * 0.17} ${-h * 0.22}Z`, bill);
  k.C(hG, h * 0.11, -h * 0.28, h * 0.018, "#1c1420");
  if (swm) k.R(g, -h * 0.55, 0, h * 1.1, h * 0.22, "#4a90a4", 0.28);
  g.tick = (t) => {
    const s = t * speed + ph, wlk = act === "walk", eat = act === "eat" || act === "peck", fly = act === "fly";
    const bob = swm ? Math.sin(s * 3) * h * 0.025 : (fly ? -Math.abs(Math.sin(s * 9)) * h * 0.25 : (wlk ? Math.abs(Math.sin(s * 7)) * h * 0.02 : 0));
    const sway = wlk ? Math.sin(s * 7) * 4 : (swm ? Math.sin(s * 2.5) * 2.5 : 0);
    bd.setAttribute("transform", `translate(0 ${bob}) rotate(${sway} 0 ${by})`);
    const hRot = eat ? 55 + Math.sin(s * 8) * 8 : Math.sin(s * 2.8) * 4;
    hG.setAttribute("transform", `translate(${h * 0.24} ${by - h * 0.08}) rotate(${hRot})`);
    wg.setAttribute("transform", `rotate(${fly ? Math.sin(s * 18) * 38 : Math.sin(s * 2.5) * 2} ${-h * 0.03} ${by})`);
    if (swm) {
      rip1.setAttribute("rx", h * (0.52 + Math.sin(s * 3) * 0.06));
      rip2.setAttribute("cx", -h * 0.12 + Math.cos(s * 3) * h * 0.04);
    } else {
      const s1 = wlk ? Math.sin(s * 7) * h * 0.08 : 0, s2 = -s1;
      l1.setAttribute("d", `M${-h * 0.04} ${by + h * 0.1} L${-h * 0.04 + s1} 0 L${h * 0.05 + s1} 0 L${s1} ${-h * 0.03}Z`);
      l2.setAttribute("d", `M${h * 0.04} ${by + h * 0.1} L${h * 0.04 + s2} 0 L${h * 0.13 + s2} 0 L${h * 0.08 + s2} ${-h * 0.03}Z`);
    }
  };
  g.tick(0);
  return g;
});
