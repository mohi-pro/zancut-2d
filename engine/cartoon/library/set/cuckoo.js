// An Asian koel / cuckoo (kokil pakhi) with glossy blue-black feathers, ruby-red eye and singing throat pulse.
ZS.define("cuckoo", { about: "a glossy black Asian koel (kokil pakhi) with a red eye, about 42 cm", kind: "set", tags: ["animal", "bird", "village", "bangladesh"] }, (layer, o, k) => {
  const { x = 0, y = 0, h = 62, seed = 1, color = "#1d222e", flip, facing, act = "perch", speed = 1 } = o;
  const g = k.group(layer, x, y, flip ?? facing), r = k.rngOf(seed), ph = r() * 6.28;
  const lt = "#343e52", dk = "#12151e", fly = act === "fly", by = fly ? 0 : -h * 0.5;
  if (!fly) {
    k.R(g, -h * 0.36, -h * 0.2, h * 0.72, h * 0.038, "#644830", 2);
    k.R(g, -h * 0.04, by + h * 0.12, h * 0.024, -by - h * 0.32, "#464a52");
    k.R(g, h * 0.02, by + h * 0.12, h * 0.024, -by - h * 0.32, "#464a52");
  }
  const bd = k.el("g", {}, g);
  k.P(bd, `M${-h * 0.18} ${by + h * 0.04} L${-h * 0.58} ${by + h * 0.28} L${-h * 0.5} ${by + h * 0.35} L${-h * 0.12} ${by + h * 0.12}Z`, dk);
  k.E(bd, 0, by, h * 0.26, h * 0.16, color);
  k.P(bd, `M${-h * 0.22} ${by - h * 0.05} Q0 ${by - h * 0.18} ${h * 0.22} ${by - h * 0.05}Z`, lt);
  const wg = k.P(bd, "", dk);
  const hG = k.el("g", {}, bd);
  k.E(hG, 0, 0, h * 0.13, h * 0.11, color);
  const bkU = k.P(hG, `M${h * 0.1} ${-h * 0.04} L${h * 0.26} ${-h * 0.01} L${h * 0.1} ${h * 0.01}Z`, "#8fa288");
  const bkL = k.P(hG, `M${h * 0.1} 0 L${h * 0.25} ${h * 0.02} L${h * 0.1} ${h * 0.04}Z`, "#74866e");
  k.C(hG, h * 0.04, -h * 0.02, h * 0.026, "#d8322c");
  k.C(hG, h * 0.042, -h * 0.02, h * 0.012, "#1c1420");
  g.tick = (t) => {
    const s = t * speed + ph, sng = 0.5 + 0.5 * Math.sin(s * 3.5);
    const fy = fly ? Math.sin(s * 14) * h * 0.1 : Math.sin(s * 2.2) * h * 0.008;
    bd.setAttribute("transform", `translate(0 ${fy}) rotate(${-sng * 5} 0 ${by})`);
    hG.setAttribute("transform", `translate(${h * 0.18} ${by - h * 0.14}) rotate(${-sng * 12})`);
    bkU.setAttribute("transform", `rotate(${-sng * 10} ${h * 0.1} 0)`);
    bkL.setAttribute("transform", `rotate(${sng * 8} ${h * 0.1} 0)`);
    const wf = fly ? Math.sin(s * 18) * h * 0.36 : 0;
    wg.setAttribute("d", `M${-h * 0.22} ${by - h * 0.02} Q0 ${by - h * 0.1 - wf} ${h * 0.12} ${by + h * 0.02 - wf * 0.8} Q${-h * 0.06} ${by + h * 0.12} ${-h * 0.24} ${by + h * 0.06}Z`);
  };
  g.tick(0);
  return g;
});
