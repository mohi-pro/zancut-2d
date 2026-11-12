// A spotted barn/fish owl (pecha) perched on a branch with big golden eyes, blinking, head swiveling and flying.
ZS.define("owl", { about: "a wise owl with large golden eyes on a branch, about 36 cm", kind: "set", tags: ["animal", "bird", "village", "night", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 58, seed = 1, color = "#7a583e", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const dk = k.dark(color, 0.22), lt = "#dfd2bc", fly = act === "fly", by = fly ? 0 : -h * 0.46;
  if (!fly) {
    k.R(g, -h * 0.38, -h * 0.16, h * 0.76, h * 0.045, "#543c28", 2);
    k.E(g, -h * 0.06, -h * 0.17, h * 0.045, h * 0.025, "#d89e3a");
    k.E(g, h * 0.06, -h * 0.17, h * 0.045, h * 0.025, "#d89e3a");
  }
  const bd = k.el("g", {}, g);
  const wL = k.E(bd, -h * 0.18, by, h * 0.1, h * 0.24, dk);
  const wR = k.E(bd, h * 0.18, by, h * 0.1, h * 0.24, dk);
  k.E(bd, 0, by, h * 0.22, h * 0.28, color);
  k.E(bd, 0, by + h * 0.03, h * 0.15, h * 0.21, lt);
  for (const [sx, sy] of [[-0.06, -0.04], [0.06, -0.04], [0, 0.04], [-0.05, 0.11], [0.05, 0.11]]) {
    k.E(bd, h * sx, by + h * sy, h * 0.022, h * 0.012, dk);
  }
  const hG = k.el("g", {}, bd);
  k.P(hG, `M${-h * 0.16} ${-h * 0.08} L${-h * 0.22} ${-h * 0.22} L${-h * 0.08} ${-h * 0.14}Z`, dk);
  k.P(hG, `M${h * 0.16} ${-h * 0.08} L${h * 0.22} ${-h * 0.22} L${h * 0.08} ${-h * 0.14}Z`, dk);
  k.E(hG, 0, 0, h * 0.2, h * 0.16, color);
  k.C(hG, -h * 0.075, 0, h * 0.08, lt);
  k.C(hG, h * 0.075, 0, h * 0.08, lt);
  const ey1 = k.E(hG, -h * 0.075, 0, h * 0.048, h * 0.048, "#f0b828");
  const ey2 = k.E(hG, h * 0.075, 0, h * 0.048, h * 0.048, "#f0b828");
  const p1 = k.E(hG, -h * 0.075, 0, h * 0.026, h * 0.026, "#1c1420");
  const p2 = k.E(hG, h * 0.075, 0, h * 0.026, h * 0.026, "#1c1420");
  k.P(hG, `M${-h * 0.03} ${h * 0.02} L${h * 0.03} ${h * 0.02} L0 ${h * 0.09}Z`, "#3a322e");
  g.tick = (t) => {
    const s = t * speed + ph;
    const fy = fly ? Math.sin(s * 10) * h * 0.12 : Math.sin(s * 2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${fy})`);
    const swv = Math.sin(s * 1.8) * h * 0.03, rot = Math.sin(s * 2.4) * 8;
    hG.setAttribute("transform", `translate(${swv} ${by - h * 0.26}) rotate(${rot})`);
    const blk = Math.sin(s * 3.7) > 0.92 ? h * 0.006 : h * 0.048;
    ey1.setAttribute("ry", blk); ey2.setAttribute("ry", blk);
    p1.setAttribute("ry", blk * 0.55); p2.setAttribute("ry", blk * 0.55);
    const wf = fly ? Math.sin(s * 14) * 45 : 0;
    wL.setAttribute("transform", `rotate(${wf} ${-h * 0.14} ${by - h * 0.1})`);
    wR.setAttribute("transform", `rotate(${-wf} ${h * 0.14} ${by - h * 0.1})`);
  };
  g.tick(0);
  return g;
});
