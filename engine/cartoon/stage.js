// ZT: one place as a real space in metres, seen by a real camera, so a film can shoot the same room from any side, corner or height.
// The room is a box: walls, floor, ceiling and a table are drawn in perspective; things on a wall follow the wall's slant; things that stand
// are library pieces at their real size at their depth; everything is sorted by depth. People sit at their own points, and the side of them
// the camera sees comes from where the camera is. Nothing here belongs to a story: a place is data.
//   const st = ZT.stage(W, model, { eye: [x, y, z], at: [x, y, z], f, cx, cy })     x right, y up, z into the room (back wall z = room.d, front wall z = 0)
//   model = { room: { w, d, h }, wall: [top, bottom], floor: [near, far], seam, skirting, ceiling, walls: { back: [...], front: [...], left: [...], right: [...] },
//             stands: [{ id, x, z, m?, color?, seed?, flip? }], hangs: [{ id, x, z, color? }], table: { x, z, w, d, h, rot, color, edge, top: [{ id, x, z, m, color }] },
//             glows: [{ x, y, z, r, c, a }], outdoor: { sky: [a, b], low, bands: [{ z0, z1, colors: [near, far], plank, seam }], far: [{ id, x, z, m? }] } }
//   wall item: { id, u, y?, m?, seed?, color?, lit?, under? (a draw(g, box) for what shows behind it, in its own coordinates) }   u = metres along the wall from its middle, as seen facing it
//   view.solid: the table shown as a solid desk down to the floor (close shots of people with no legs drawn)
//   st.at([x, y, z]) → { x, y, s, z }   px, px per metre, depth    ·  st.slot(z) → a <g> in depth order  ·  st.seat(spec, { x, z, face: [dx, dz] }) → { x, floor, H, s, view, facing, slot }
(function (root) {
  const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], norm = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const mid = (v, d) => (Array.isArray(v) ? (v.length === 3 ? v[1] : (v[0] + v[v.length - 1]) / 2) : v ?? d);
  const sizeOf = (id) => root.ZWORLD_DATA?.sizes?.items?.[id] || {};
  const NEAR = 0.25;
  function camera({ eye, at, f, cx, cy }) {
    const F = norm(sub(at, eye)), R = norm(cross([0, 1, 0], F)), U = cross(F, R);
    const toCam = (p) => { const d = sub(p, eye); return [dot(d, R), dot(d, U), dot(d, F)]; }, proj = ([x, y, z]) => ({ x: cx + (f * x) / z, y: cy - (f * y) / z, s: f / z, z });
    return { eye, F, R, U, f, cx, cy, toCam, proj, at: (p) => proj(toCam(p)) };
  }
  // a flat shape, cut at the camera's near plane
  function clip(pts) { const out = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR; if (ia) out.push(a); if (ia !== ib) { const u = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, NEAR]); } } return out; }
  function stage(W, M, view) {
    const e = root.ZC.el, C = camera({ f: 1700, cx: W.w / 2, cy: W.h / 2, ...view }), L = W.layer("stage"), ids = `${W.idp}st`; let gid = 0;
    const flat = (pts, fill, into = L, extra = {}) => { const c = clip(pts.map(C.toCam)); if (c.length < 3) return null; return e("polygon", { points: c.map(C.proj).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" "), fill, ...extra }, into); };
    const line = (a, b, stroke, w, into = L, op = 0.3) => { const A = C.toCam(a), B = C.toCam(b); if (A[2] < NEAR && B[2] < NEAR) return; const u = (NEAR - A[2]) / (B[2] - A[2]), P = A[2] < NEAR ? add(A, sub(B, A), u) : A, Q = B[2] < NEAR ? add(A, sub(B, A), u) : B, p = C.proj(P), q = C.proj(Q); e("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke, "stroke-width": w, opacity: op }, into); };
    const grad = (a, b) => { const id = `${ids}${gid++}`, g = e("linearGradient", { id, x1: 0, y1: 0, x2: 0, y2: 1 }, W.defs); e("stop", { offset: 0, "stop-color": a }, g); e("stop", { offset: 1, "stop-color": b }, g); return `url(#${id})`; };
    const items = [];  // what stands, sorted far to near at the end
    const piece = (id, o = {}) => { const g = e("g", {}), T = root.ZS?.[id]; if (!T) return null; L.appendChild(g); T(g, { x: 0, y: 0, h: 200, seed: o.seed || 1, ...(o.color ? { color: o.color } : {}), ...(o.lit ? { lit: true } : {}), ...(o.on != null ? { on: o.on } : {}) }); return g; };
    // a piece on a plane: its box mapped onto a rectangle in the room (bl, br, tl), so it follows the wall's slant
    function onPlane(g, bl, br, tl) { const b = g.getBBox(); if (!(b.width > 0.1 && b.height > 0.1)) return; const P = C.at(bl), Q = C.at(br), T = C.at(tl), a = (Q.x - P.x) / b.width, bb = (Q.y - P.y) / b.width, c = -(T.x - P.x) / b.height, d = -(T.y - P.y) / b.height, b0 = b.y + b.height, tx = P.x - a * b.x - c * b0, ty = P.y - bb * b.x - d * b0; g.setAttribute("transform", `matrix(${[a, bb, c, d, tx, ty].map((v) => +v.toFixed(5)).join(" ")})`); }
    function wallItem(side, it, R) {
      const S = sizeOf(it.id), dir = { back: [1, 0, 0], front: [-1, 0, 0], left: [0, 0, 1], right: [0, 0, -1] }[side], base = { back: [0, 0, R.d - 0.02], front: [0, 0, 0.02], left: [-R.w / 2 + 0.02, 0, R.d / 2], right: [R.w / 2 - 0.02, 0, R.d / 2] }[side];
      const y0 = it.y ?? S.contacts?.bottom?.y ?? (S.anchor === "wall" ? 1.1 : 0), h = it.m ?? mid(S.height, 1.2), P = add(base, dir, it.u); P[1] = y0;
      const g = piece(it.id, it); if (!g) return; const b = g.getBBox(), w = h * (b.width / (b.height || 1)), bl = add(P, dir, -w / 2), br = add(P, dir, w / 2), tl = [bl[0], y0 + h, bl[2]];
      if ([bl, br, tl].some((p) => C.toCam(p)[2] < NEAR)) { g.remove(); return; }
      if (it.under) { const v = e("g", {}, L); L.insertBefore(v, g); it.under(v, b); const t0 = g; onPlane(t0, bl, br, tl); v.setAttribute("transform", t0.getAttribute("transform")); } else onPlane(g, bl, br, tl);
    }
    function surfaces() {
      if (M.outdoor) {
        const O = M.outdoor, H = C.at([C.eye[0] + C.F[0] * 900, 0, C.eye[2] + C.F[2] * 900]); e("rect", { x: -W.w, y: -W.h * 2, width: W.w * 3, height: H.y + W.h * 2 + 2, fill: grad(O.sky[0], O.sky[1]) }, L);
        if (O.low) { const id = `${ids}${gid++}`, g = e("radialGradient", { id }, W.defs); e("stop", { offset: 0, "stop-color": O.low, "stop-opacity": 0.9 }, g); e("stop", { offset: 1, "stop-color": O.low, "stop-opacity": 0 }, g); e("ellipse", { cx: W.w * 0.62, cy: H.y, rx: W.w, ry: W.h * 0.2, fill: `url(#${id})` }, L); }
        for (const b of O.bands) { const w = b.w ?? 500; flat([[-w, 0, b.z0], [w, 0, b.z0], [w, 0, b.z1], [-w, 0, b.z1]], grad(b.colors[1], b.colors[0])); if (b.plank) for (let z = b.z0; z < b.z1; z += 0.45) line([-w, 0, z], [w, 0, z], b.seam, 3, L, 0.7); }
        return;
      }
      const R = M.room; e("rect", { x: -W.w, y: -W.h, width: W.w * 3, height: W.h * 3, fill: M.floor[1] }, L); const c = [[-R.w / 2, 0], [R.w / 2, 0], [R.w / 2, R.d], [-R.w / 2, R.d]], eye = C.eye;
      flat([...c.map(([x, z]) => [x, 0, z])], grad(M.floor[1], M.floor[0]));
      for (let x = -R.w / 2 + 0.6; x < R.w / 2; x += 0.6) line([x, 0, 0], [x, 0, R.d], M.seam, 2);
      if (eye[1] < R.h) flat(c.map(([x, z]) => [x, R.h, z]), M.ceiling || "#f6f1e8");
      const W4 = [["back", [-R.w / 2, R.d], [R.w / 2, R.d], eye[2] < R.d], ["front", [R.w / 2, 0], [-R.w / 2, 0], eye[2] > 0], ["left", [-R.w / 2, 0], [-R.w / 2, R.d], eye[0] > -R.w / 2], ["right", [R.w / 2, R.d], [R.w / 2, 0], eye[0] < R.w / 2]];
      for (const [side, a, b, seen] of W4) { if (!seen) continue;
        flat([[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], R.h, b[1]], [a[0], R.h, a[1]]], grad(M.wall[0], M.wall[1]));
        flat([[a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], 0.1, b[1]], [a[0], 0.1, a[1]]], M.skirting);
        for (const it of M.walls?.[side] || []) wallItem(side, it, R); }
      for (const g of M.glows || []) { const p = C.at([g.x, g.y, g.z]); if (p.z < NEAR) continue; const id = `${ids}${gid++}`, r = e("radialGradient", { id }, W.defs); e("stop", { offset: 0, "stop-color": g.c, "stop-opacity": g.a }, r); e("stop", { offset: 1, "stop-color": g.c, "stop-opacity": 0 }, r); e("ellipse", { cx: p.x, cy: p.y, rx: g.r * p.s, ry: g.r * p.s * 0.85, fill: `url(#${id})` }, L); }
    }
    function tableBox(T0) { const T = view.solid ? { ...T0, solid: true } : T0, g = e("g", {}), c = Math.cos(((T.rot || 0) * Math.PI) / 180), s = Math.sin(((T.rot || 0) * Math.PI) / 180), P = (u, v, y) => [T.x + u * c + v * s, y, T.z - u * s + v * c], w = T.w / 2, d = T.d / 2, h = T.h, t = 0.045, leg = (u, v) => { const k = 0.035; flat([P(u - k, v, 0), P(u + k, v, 0), P(u + k, v, h), P(u - k, v, h)], T.edge, g); };
      [[-w + 0.08, -d + 0.08], [w - 0.08, -d + 0.08], [-w + 0.08, d - 0.08], [w - 0.08, d - 0.08]].sort((a, b) => C.toCam(P(b[0], b[1], 0))[2] - C.toCam(P(a[0], a[1], 0))[2]).forEach(([u, v]) => leg(u, v));
      const faces = [[[-w, -d], [w, -d]], [[w, -d], [w, d]], [[w, d], [-w, d]], [[-w, d], [-w, -d]]]; for (const [[a, b], [p, q]] of faces) { const n = [(q - b), 0, -(p - a)], m = P((a + p) / 2, (b + q) / 2, h), N = [n[0] * c + n[2] * s, 0, -n[0] * s + n[2] * c]; if (dot(sub(C.eye, m), N) > 0 || true) flat([P(a, b, T.solid ? 0 : h - t), P(p, q, T.solid ? 0 : h - t), P(p, q, h), P(a, b, h)], T.solid ? T.face || T.edge : T.edge, g); }
      if (C.eye[1] > h) flat([P(-w, -d, h), P(w, -d, h), P(w, d, h), P(-w, d, h)], T.color, g);
      return g; }
    const billboard = (o, y0 = 0, hang = false) => { const S = sizeOf(o.id), m = o.m ?? mid(S.height, 0.5), p = C.at([o.x, y0, o.z]); if (p.z < NEAR) return null; return { z: p.z, draw() { const g = piece(o.id, o); if (!g) return null; const b = g.getBBox(), k = (m * p.s) / (b.height || 1), fx = o.flip ? -1 : 1; g.setAttribute("transform", `translate(${(p.x - (b.x + b.width / 2) * k * fx).toFixed(1)} ${(p.y - (hang ? b.y : b.y + b.height) * k).toFixed(1)}) scale(${(k * fx).toFixed(4)} ${k.toFixed(4)})`); return g; } }; };
    surfaces();
    const stands = [];
    for (const o of M.outdoor?.far || []) { const x = billboard(o); if (x) stands.push(x); }
    for (const o of M.stands || []) { const x = billboard(o); if (x) stands.push(x); }
    for (const o of M.hangs || []) { const x = billboard(o, M.room.h, true); if (x) stands.push(x); }
    if (M.table) { const T = M.table, z = C.toCam([T.x, T.h, T.z])[2]; stands.push({ z, table: true, draw: () => { const g = tableBox(T); L.appendChild(g); return g; } }); for (const o of T.top || []) { const x = billboard(o, T.h); if (x) stands.push({ ...x, z: x.z - 0.01 }); } }
    stands.sort((a, b) => b.z - a.z);
    const mark = e("g", { "data-d": "999" }, L), out = { C, L, W, at: C.at, things: stands, table: null,
      // a <g> at a depth, among the things that stand
      slot(z) { const g = e("g", { "data-d": z.toFixed(3) }); for (const k of [...L.children]) if (k.dataset?.d != null && Number(k.dataset.d) < z && k !== mark) { L.insertBefore(g, k); return g; } L.appendChild(g); return g; },
      // what stands is drawn after people are given their slots: call once
      build(front) { for (const x of stands) { const g = x.draw(); if (!g) continue; g.dataset.d = x.z.toFixed(3); L.removeChild(g); let done = false; if (front?.drop && x.z < front.z) { g.remove(); continue; } const into = front?.layer && x.z < front.z ? front.layer : L; for (const k of [...into.children]) if (k.dataset?.d != null && Number(k.dataset.d) < x.z) { into.insertBefore(g, k); done = true; break; } if (!done) into.appendChild(g); if (x.table) out.table = g; } },
      // the chairs of people at their seats (call before build)
      seatChairs(ids, F, make) { for (const id of ids) { const o = M.seats?.[id]; if (!o || out._ch?.has(id)) continue; (out._ch ||= new Set()).add(id); const v = out.seat(F(id), o), x = billboard(make(out, id, v), 0); if (x) { x.z += 0.02; stands.push(x); } } stands.sort((a, b) => b.z - a.z); },
      // a person sitting at a floor point: size and side of them follow the camera
      seat(spec, { x, z, face = [0, 1], y = 0 }) { const p = C.at([x, y, z]), yawTo = Math.atan2(C.eye[0] - x, C.eye[2] - z), own = Math.atan2(face[0], face[1]); let a = ((yawTo - own) * 180) / Math.PI; a = ((a + 540) % 360) - 180; const ab = Math.abs(a), v = ab < 22 ? "front" : ab < 62 ? "three" : ab < 130 ? "side" : "back", ahead = C.at([x + face[0] * 0.5, y, z + face[1] * 0.5]), facing = ahead.x >= p.x ? 1 : -1, k = unit(spec); return { x: p.x, floor: p.y, H: k * p.s, s: p.s, z: p.z, view: v, facing, metres: root.ZW.statureOf(spec) }; },
      // the upper edge of the table on screen at px x (null = no table there): what hides whatever is behind it
      tableTop(x) { if (!M.table) return null; const T = M.table, c = Math.cos(((T.rot || 0) * Math.PI) / 180), s = Math.sin(((T.rot || 0) * Math.PI) / 180), P = (u, v) => C.at([T.x + u * c + v * s, T.h, T.z - u * s + v * c]), w = T.w / 2, d = T.d / 2, Q = [P(-w, -d), P(w, -d), P(w, d), P(-w, d)]; let top = null; for (let i = 0; i < 4; i++) { const a = Q[i], b = Q[(i + 1) % 4]; if (a.z < NEAR || b.z < NEAR) continue; if ((a.x - x) * (b.x - x) <= 0 && a.x !== b.x) { const y = a.y + ((x - a.x) / (b.x - a.x)) * (b.y - a.y); top = top == null ? y : Math.min(top, y); } } return top; },
    };
    return out;
  }
  const units = new Map(), unit = (spec) => { const key = JSON.stringify(spec); if (units.has(key)) return units.get(key); const fake = { w: 1080, h: 1920, svg: {} }, Z = root.ZW.view(fake, { horizon: 0.42, floor: 0.75 }), a = Z.person(spec, { x: 0, dz: 0 }); const k = a.H / a.s; units.set(key, k); return k; };
  root.ZT = { stage, camera };
})(typeof window !== "undefined" ? window : globalThis);
