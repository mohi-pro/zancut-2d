// Hand library + continuous arm, shared by the hand sheet and the film rig.
// Hand space: wrist centre at 0,0, the hand runs toward +y, the thumb is on +x, the wrist is 26 wide (±13).
// Each pose is drawn as an artist would: one filled silhouette per overlapping part (palm mass, a finger lying over a
// prop, the thumb), with NO outline: only a soft line between the fingers. A raised finger is the pose's own finger.
// Both bodies use this one library (rig.js for the waist-up person, anatomy.js for the full body).
(function (root) {
  const SVGNS = "http://www.w3.org/2000/svg";
  const mk = (tag, a, p) => { const e = document.createElementNS(SVGNS, tag); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; };

  // a part: d = closed outline starting and ending at the wrist side; open = true leaves the last segment unstroked
  const part = (d, open = true) => ({ d, open });
  const POSES = {
    // palm down on the desk, fingers together and relaxed, thumb lying along the inner side
    rest: {
      parts: [part("M-13,0 C-14,8 -17,18 -17.6,30 C-18,34 -19.2,37 -19.5,40 L-19.6,51.5 C-19.6,56.5 -13.6,57 -13.3,52.5 L-12.8,51 C-12.9,58 -12.6,62.6 -8.5,62.6 C-4.6,62.6 -4.2,59 -4.1,55.8 L-3.8,55.4 C-3.8,61 -3.4,65.6 0.7,65.6 C4.8,65.6 5.2,61.5 5.3,57.8 L5.6,57.4 C5.6,59 6,62.6 9.9,62.6 C13.6,62.4 14.2,58.6 14.2,55 L14.6,48 C15,44 15.6,41 16.4,39 C18.4,42 20.6,46 22.4,49.6 C24,52.6 28.4,51.4 27.6,47.6 C26.6,41 26,32 24,24 C22,16 18.2,8 13,0")],
      lines: ["M16.4,39 C17.6,32 17.8,26 17,20", "M-12.8,51 C-13,47 -13.2,44 -13.4,41", "M-3.8,55.4 C-4,51 -4.2,46 -4.4,42", "M5.6,57.4 C5.6,52 5.4,47 5.2,43"],
      soft: ["M-18.2,39.6 q2.4,-2.2 4.8,0", "M-10.8,40.8 q2.6,-2.4 5.2,0", "M-1.8,41.4 q2.6,-2.4 5.2,0", "M7.4,40.6 q2.5,-2.3 5,0", "M-18,48 q1.8,1.2 3.6,0", "M-10.4,51.4 q2,1.3 4,0", "M-1.2,53.4 q2,1.3 4,0", "M8,51.2 q1.9,1.2 3.8,0", "M21,38 q2.4,0.6 4,-1.2"],
      nails: [[-16.5, 53.6, 2.1, 2.5, 0], [-8.5, 59.2, 2.5, 2.9, 0], [0.7, 62.2, 2.6, 3, 0], [9.9, 59.2, 2.5, 2.9, 0], [25.2, 49.2, 2.3, 2.7, -25]],
    },
    // the palm toward the viewer, fingers open (explaining, offering)
    open: {
      build: { fingers: [ // base x, base y, direction°, [lengths], half widths, curl per joint°
        [-13.6, 39, -13, [10, 6.5, 5], [3.7, 3.4, 3.1], [6, 6, 4]], [-5, 41.4, -5, [12.5, 8, 6], [4.2, 3.9, 3.5], [4, 5, 3]],
        [4, 42, 0, [13.5, 8.6, 6.4], [4.4, 4.1, 3.7], [3, 4, 3]], [12.8, 40.4, 7, [12, 7.6, 6], [4.2, 3.9, 3.5], [3, 4, 3]]],
        thumb: [[17, 14], 52, [13, 11], [6.4, 5.4], [10, 8]], wrist: 13, palmUlnar: [-17.6, 36], palmRadial: [17.4, 37] },
      parts: [part("M-13,0 C-15,10 -19,22 -19,32 C-21,38 -26,46 -28.6,50.5 C-30.6,54 -26.4,56.6 -24.6,53.2 C-22.6,49.4 -19.6,44 -16.6,40.4 C-16.4,46 -15.8,54 -15.6,58.6 C-15.4,63.4 -9.6,63.6 -9.4,58.8 C-9,52 -8,46 -7,42.4 C-7,49 -7.2,57 -7,61.6 C-6.8,66.6 0.6,66.6 0.6,61.6 C0.8,55 1.2,48 2.2,42.6 C2.8,48 3.8,54 4.6,58.6 C5.4,63.6 11.6,62.6 11,57.8 C10.2,51 10.6,45 12.6,39.6 C14,36 16,33.5 19,31.6 C23,30 27,30.6 30,32.4 C34,34.6 34.4,29 31.8,26.6 C28,22 24,16 21,12 C18,7 16,3 13,0")],
      lines: ["M-15.6,30 C-8,27.6 2,28 10.6,32.6", "M14,24.6 C6,23 -4,24.4 -12.4,30.4", "M13.6,30 C9,22 8.4,13 9.6,5"],
      soft: [],
      nails: [],
    },
    // index finger points, the others curl into the palm, thumb resting on the middle finger (back view)
    point: {
      parts: [
        part("M-13,0 C-15,10 -18,20 -18.5,30 C-19,38 -17.5,43.6 -13.4,44.6 C-11,47.6 -6,48 -4.4,45.6 C-3,49.4 3,49.6 4.4,46.2 C6,44 9,42 13.6,42 C17,42 20,40 21,36 C22.6,30 21.6,22 20.6,16 C19,9 16,4 13,0"),
        part("M3.4,43 C3.2,52 3.6,62 4,70 C4.2,76.4 12.4,76.4 12.6,70 C13,60 13.6,50 14.8,41.4", true),
      ],
      lines: ["M-13.4,44.6 C-12.4,40.6 -12.4,37.4 -12.8,34", "M-4.4,45.6 C-4.2,41.4 -4.2,38.4 -4.6,35.4", "M13.8,42 C15,34 16,26 15.6,19"],
      soft: ["M-17.6,37 q2.4,-2.2 4.8,0", "M-9.6,38.4 q2.5,-2.3 5,0", "M-1,38.8 q2.5,-2.3 5,0", "M6.6,57 q2,1.3 4,0", "M6.8,65.2 q1.8,1 3.6,0", "M-16.6,42.6 q2,1.4 3.4,0.6", "M-9,45.4 q2,1.4 3.6,0.4", "M-0.6,46.6 q2,1.3 3.6,0.2"],
      nails: [[8.3, 71.2, 2.9, 3.2, 0]],
    },
    // a closed fist, knuckles to the viewer
    fist: {
      parts: [part("M-13,0 C-15,9 -18,18 -19,28 C-19.8,36 -18,42 -14,44 C-12,47 -6,48 -4,45.6 C-2.4,49 4,49.6 5.6,46.4 C7.4,49.4 13,49 14.6,45 C17.6,46 21,42 21.2,36 C21.4,28 19.4,18 18,12 C16.6,7 15,3 13,0")],
      lines: ["M-14,44 C-13,40 -13,38 -13.4,35", "M-4,45.6 C-4,41.4 -4,39 -4.4,36", "M5.6,46.4 C5.8,42.4 5.6,39.6 5.2,37", "M14.6,45 C16,38 16.6,28 15.8,19"],
      soft: ["M-17.8,36.6 q2.6,-2.6 5.2,0", "M-9.6,37.8 q2.8,-2.8 5.6,0", "M-0.6,38.4 q2.8,-2.8 5.6,0", "M8,37.6 q2.6,-2.6 5.2,0", "M-17,41.6 C-10,43.6 4,44 14.4,41.4"],
      nails: [],
    },
    // writing grip, seen from above: index along the pencil, thumb pinching it, middle under it, ring and little finger curled
    pencil: {
      parts: [
        part("M-13,0 C-15,9 -18,19 -18.6,29 C-19,36 -17,42 -13,44 C-10.6,47.6 -5,48.6 -3,46 C-3.6,52 -3.6,57 -1.4,61 C0.4,64.4 4.6,63.6 4.8,60 C5,55 5.6,48 8,42 C12,38 17,30 20,22 C21.4,16 18.6,7 13,0"),
        { prop: "pencil", from: [1, 82], to: [38, -32] },
        part("M7,40 C6,50 4,60 3.2,67 C2.6,72.6 9,73.6 9.6,68 C10.4,60 12.6,50 15,41", true),
        part("M11,14 C16,20 19,28 18.6,36 C18,44 14,51 10.4,56 C8.4,59.4 12.6,62 16,58.6 C22,52 27,42 26,32 C25,22 20,10 13,4", true),
      ],
      lines: ["M-13,44 C-12,40 -12,37.6 -12.4,34.6", "M-3,46 C-3.2,42 -3.2,39.6 -3.6,37"],
      soft: ["M-17.4,37 q2.4,-2.2 4.8,0", "M-9.4,38.6 q2.5,-2.3 5,0", "M5.6,53 q2,1.2 4,0", "M21.6,38 q2.4,0.6 4,-1.6", "M-16.6,42.6 q2,1.4 3.4,0.6", "M-8.8,45.6 q2,1.4 3.6,0.4"],
      nails: [[6.4, 68.6, 2.3, 2.8, 8], [13.2, 57.6, 2.3, 2.7, 40]],
    },
    // holding a phone up to show it: palm behind the phone, thumb on its edge, fingertips round the far edge
    phone: {
      parts: [
        part("M-13,0 C-15,6 -16.4,10 -17,14 L17,14 C16.4,10 15,6 13,0"),
        { prop: "phone", x: -18, y: 10, w: 36, h: 72 },
        part("M-15,24 C-18.6,23.4 -22,24.6 -22,27.6 C-22,30.6 -18.6,31.4 -15,30.8"),
        part("M-15,32.4 C-19,31.8 -22.6,33 -22.6,36.2 C-22.6,39.4 -19,40.2 -15,39.6"),
        part("M-15,41.2 C-18.8,40.6 -22,41.8 -22,44.8 C-22,47.8 -18.8,48.6 -15,48"),
        part("M-15,49.6 C-18,49.2 -20.6,50.2 -20.6,52.8 C-20.6,55.4 -18,56 -15,55.6"),
        part("M9,10 C12,12 14.4,16 14.6,22 C15,28 13.6,33.4 11.4,37.4 C9.6,40.6 12.6,43.4 15.4,41 C19,38 22.2,32 22.6,24 C23,16 19,8 12,4"),
      ],
      lines: [],
      soft: ["M15.6,27 q2.6,1 4.6,-0.6"],
      nails: [[13.6, 38.6, 2.2, 2.7, -30]],
    },
    // resting on someone's shoulder: fingers bend over and hang down
    drape: null, // filled below from rest (fingers longer and hooked)
  };
  POSES.drape = {
    ...POSES.rest,
    parts: [part("M-13,0 C-14,8 -17,18 -17.6,30 C-18,34 -19.4,38 -20,42 C-21,48 -21.4,54 -20.6,58 C-19.6,62 -14.4,62 -14.2,58 L-13.6,56 C-13.8,62 -13,68 -8.6,68.4 C-4.6,68.6 -4,64 -4,60 L-3.8,59.6 C-3.6,66 -3,71 0.8,71 C4.8,71 5.4,66 5.4,61.6 L5.6,61.2 C5.8,64 6.4,67.4 10,67.2 C13.6,67 14.2,63 14.2,59 L14.6,50 C15,45 15.6,42 16.4,40 C18.4,43 20.6,47 22.4,50.6 C24,53.6 28.4,52.4 27.6,48.6 C26.6,42 26,32 24,24 C22,16 18.2,8 13,0")],
    lines: ["M16.4,40 C17.6,32 17.8,26 17,20", "M-13.6,56 C-13.8,50 -13.6,46 -13.6,42", "M-3.8,59.6 C-4,53 -4.2,48 -4.4,43", "M5.6,61.2 C5.6,55 5.4,49 5.2,44"],
    soft: ["M-18.4,40 q2.4,-2.2 4.8,0", "M-10.8,41 q2.6,-2.4 5.2,0", "M-1.8,41.6 q2.6,-2.4 5.2,0", "M7.4,40.8 q2.5,-2.3 5,0", "M-19.4,50 q2.4,1.6 4.6,0", "M-11.2,54 q2.4,1.6 4.8,0", "M-1.6,56 q2.4,1.6 4.8,0", "M7.6,54 q2.2,1.6 4.6,0"],
    nails: [[-17.4, 59.4, 2.1, 2.2, 0], [-8.6, 65, 2.5, 2.4, 0], [0.8, 67.6, 2.6, 2.5, 0], [9.9, 64, 2.5, 2.4, 0], [25.2, 50.2, 2.3, 2.7, -25]],
  };

  // a hand from finger chains: every joint bends one way only (toward the palm), widths taper, one outline
  function build(B) {
    const f2 = (v) => v.toFixed(1), P = (p) => `${f2(p[0])},${f2(p[1])}`;
    const chainOf = ([bx, by, dir, L, W, curl]) => { let a = (dir * Math.PI) / 180, p = [bx, by]; const pts = [{ p, a, w: W[0] }];
      L.forEach((l, j) => { a += -Math.sign(bx || 1) * 0 + (curl[j] * Math.PI) / 180 * (bx < 0 ? 1 : -1) * 0.2; p = [p[0] + Math.sin(a) * l, p[1] + Math.cos(a) * l]; pts.push({ p, a, w: W[Math.min(j + 1, W.length - 1)] * (j === L.length - 1 ? 0.95 : 1) }); });
      return pts; };
    const edge = (pts, sg) => pts.map(({ p, a, w }) => [p[0] - Math.cos(a) * w * sg, p[1] + Math.sin(a) * w * sg]);
    const F = B.fingers.map(chainOf), creases = [];
    let d = `M${-B.wrist},0 C${-B.wrist - 1.6},10 ${B.palmUlnar[0] + 0.4},${B.palmUlnar[1] - 14} ${P(B.palmUlnar)}`;
    F.forEach((pts, i) => {
      const L = edge(pts, 1), R = edge(pts, -1), tip = pts[pts.length - 1], tw = tip.w;
      d += ` Q${P([L[0][0], L[0][1] - 2])} ${P(L[0])}`;
      for (let k = 1; k < L.length; k++) d += ` L${P(L[k])}`;
      const ext = [tip.p[0] + Math.sin(tip.a) * tw * 1.25, tip.p[1] + Math.cos(tip.a) * tw * 1.25];
      d += ` C${P([L[L.length - 1][0] + Math.sin(tip.a) * tw * 1.3, L[L.length - 1][1] + Math.cos(tip.a) * tw * 1.3])} ${P([R[R.length - 1][0] + Math.sin(tip.a) * tw * 1.3, R[R.length - 1][1] + Math.cos(tip.a) * tw * 1.3])} ${P(R[R.length - 1])}`;
      for (let k = R.length - 2; k >= 0; k--) d += ` L${P(R[k])}`;
      const next = F[i + 1];
      if (next) { const nL = edge(next, 1)[0]; d += ` Q${P([(R[0][0] + nL[0]) / 2, (R[0][1] + nL[1]) / 2 + 3.2])} ${P(nL)}`; }
      pts.slice(1, -1).forEach(({ p, a, w }) => creases.push(`M${f2(p[0] - Math.cos(a) * w * 0.7)},${f2(p[1] + Math.sin(a) * w * 0.7)} q${f2(Math.cos(a) * w * 0.7)},1.6 ${f2(Math.cos(a) * w * 1.4)},${f2(-Math.sin(a) * w * 1.4)}`));
    });
    // web of the thumb, the thumb, back to the wrist
    const [tb, tdir, TL, TW, tcurl] = B.thumb; let ta = (tdir * Math.PI) / 180, tp = tb; const tpts = [{ p: tp, a: ta, w: TW[0] }];
    TL.forEach((l, j) => { ta -= (tcurl[j] * Math.PI) / 180 * 0.3; tp = [tp[0] + Math.sin(ta) * l, tp[1] + Math.cos(ta) * l]; tpts.push({ p: tp, a: ta, w: TW[Math.min(j + 1, TW.length - 1)] }); });
    const tL = edge(tpts, -1), tR = edge(tpts, 1), tt = tpts[tpts.length - 1];
    d += ` C${P([B.palmRadial[0] + 1, B.palmRadial[1] - 4])} ${P([tR[0][0] - 2, tR[0][1] + 8])} ${P(tR[1])}`;
    for (let k = 2; k < tR.length; k++) d += ` L${P(tR[k])}`;
    d += ` C${P([tR[tR.length - 1][0] + Math.sin(tt.a) * tt.w * 1.3, tR[tR.length - 1][1] + Math.cos(tt.a) * tt.w * 1.3])} ${P([tL[tL.length - 1][0] + Math.sin(tt.a) * tt.w * 1.3, tL[tL.length - 1][1] + Math.cos(tt.a) * tt.w * 1.3])} ${P(tL[tL.length - 1])}`;
    for (let k = tL.length - 2; k >= 1; k--) d += ` L${P(tL[k])}`;
    d += ` C${P([tL[0][0] + 1, tL[0][1] - 6])} ${P([B.wrist + 2, 8])} ${B.wrist},0`;
    return { d, creases };
  }
  // the shapes of a pose, once for both ways of drawing: [tag, attributes]. c = { skin, shade, nail, w }
  function handShapes(pose, c) {
    const P = POSES[pose] || POSES.rest, w = c.w || 2.2, out = [];
    if (P.build && !P._built) { const b = build(P.build); P.parts = [part(b.d)]; P._built = true; }
    P.parts.forEach((pt, k) => {
      if (c.only && !c.only.includes(k)) return;
      if (pt.prop) out.push(["prop", pt]);
      else out.push(["path", { d: pt.d + "Z", fill: c.skin }]);
    });
    if (c.details === false) return out;
    for (const d of P.lines) out.push(["path", { d, fill: "none", stroke: c.shade, "stroke-width": w * 0.6, "stroke-linecap": "round", opacity: 0.6, "data-detail": 1 }]);
    for (const [x, y, rx, ry, rot] of P.nails) out.push(["ellipse", { cx: x, cy: y, rx, ry, fill: c.nail, opacity: 0.7, transform: `rotate(${rot} ${x} ${y})` }]);
    return out;
  }
  /** draw a hand pose into group g (hand space) */
  function drawHand(g, pose, c) {
    g.textContent = "";
    for (const [tag, a] of handShapes(pose, c)) {
      if (tag !== "prop") mk(tag, a, g);
      else if (a.prop === "pencil") drawPencil(g, a.from, a.to);
      else if (a.prop === "phone") drawPhone(g, a);
    }
  }
  /** the same hand as markup, for the full body's drawing */
  const handSvg = (pose, c) => handShapes(pose, c).filter(([t]) => t !== "prop").map(([t, a]) => `<${t} ${Object.entries(a).map(([k, v]) => `${k}="${v}"`).join(" ")}/>`).join("");
  function drawPencil(g, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, at = (t) => [a[0] + ux * t, a[1] + uy * t];
    const seg = (t0, t1, col, wd) => { const p = at(t0), q = at(t1); mk("path", { d: `M${p[0]},${p[1]} L${q[0]},${q[1]}`, stroke: col, "stroke-width": wd, "stroke-linecap": t1 >= L ? "round" : "butt" }, g); };
    seg(9, L, "#6b4a1e", 7.6); seg(9, L - 1, "#f0c040", 5.4); seg(9, L - 1, "#d9a52c", 1.6);
    seg(L - 8, L, "#c9c9c9", 6.2); seg(L - 6, L, "#e58f9a", 5.8);
    const p0 = at(0), p9 = at(9), n = [-uy, ux];
    mk("path", { d: `M${p0[0]},${p0[1]} L${p9[0] + n[0] * 3.2},${p9[1] + n[1] * 3.2} L${p9[0] - n[0] * 3.2},${p9[1] - n[1] * 3.2}Z`, fill: "#ecd2a8", stroke: "#6b4a1e", "stroke-width": 1, "stroke-linejoin": "round" }, g);
    const p3 = at(3); mk("path", { d: `M${p0[0]},${p0[1]} L${p3[0] + n[0] * 1.2},${p3[1] + n[1] * 1.2} L${p3[0] - n[0] * 1.2},${p3[1] - n[1] * 1.2}Z`, fill: "#333" }, g);
  }
  function drawPhone(g, p) {
    mk("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: 9, fill: "#1b1d22", stroke: "#0d0e11", "stroke-width": 1.6 }, g);
    const k = p.w / 60;
    mk("rect", { x: p.x + 2.5, y: p.y + 3, width: p.w - 5, height: p.h - 6, rx: 5, fill: "#eef2f8" }, g);
    for (const [y, x, w, col] of [[14, 22, 30, "#3f7ae0"], [24, 6, 30, "#ffffff"], [36, 16, 34, "#3f7ae0"], [48, 6, 38, "#ffffff"]]) mk("rect", { x: p.x + x * k, y: p.y + y, width: w * k, height: 6, rx: 3, fill: col }, g);
  }

  /** One continuous arm from shoulder S over elbow E to wrist W (world space). Returns { fill, line, crease, inner }:
      fill = closed silhouette, line = the outline left OPEN at the wrist (the hand continues it). */
  function arm(S, E, W, r) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1]], len = (v) => Math.hypot(v[0], v[1]), nrm = (v) => { const l = len(v) || 1; return [v[0] / l, v[1] / l]; };
    const u1 = nrm(sub(E, S)), u2 = nrm(sub(W, E)), L1 = len(sub(E, S)), L2 = len(sub(W, E));
    const turn = Math.acos(Math.max(-1, Math.min(1, u1[0] * u2[0] + u1[1] * u2[1])));
    const R = Math.min(0.42 * L1, 0.42 * L2, r.elbow * (0.6 + 1.3 * Math.sin(turn / 2)));
    const P1 = [E[0] - u1[0] * R, E[1] - u1[1] * R], P2 = [E[0] + u2[0] * R, E[1] + u2[1] * R];
    // centre line samples with their width
    const pts = [];
    const total = L1 + L2;
    const width = (s) => { // s along the arm, 0 shoulder → total wrist
      const k = [[0, r.shoulder], [0.45 * L1, r.upper], [L1, r.elbow], [L1 + 0.28 * L2, r.fore], [total, r.wrist]];
      for (let i = 1; i < k.length; i++) if (s <= k[i][0]) { const u = (s - k[i - 1][0]) / (k[i][0] - k[i - 1][0]), e = u * u * (3 - 2 * u); return k[i - 1][1] + (k[i][1] - k[i - 1][1]) * e; }
      return r.wrist;
    };
    const N1 = 14, NB = 14, N2 = 14;
    for (let i = 0; i <= N1; i++) { const t = i / N1; pts.push({ p: [S[0] + (P1[0] - S[0]) * t, S[1] + (P1[1] - S[1]) * t], d: u1, s: (L1 - R) * t }); }
    for (let i = 1; i < NB; i++) { const t = i / NB, a = 1 - t; const p = [a * a * P1[0] + 2 * a * t * E[0] + t * t * P2[0], a * a * P1[1] + 2 * a * t * E[1] + t * t * P2[1]];
      const d = nrm([2 * a * (E[0] - P1[0]) + 2 * t * (P2[0] - E[0]), 2 * a * (E[1] - P1[1]) + 2 * t * (P2[1] - E[1])]); pts.push({ p, d, s: L1 - R + 2 * R * t }); }
    for (let i = 0; i <= N2; i++) { const t = i / N2; pts.push({ p: [P2[0] + (W[0] - P2[0]) * t, P2[1] + (W[1] - P2[1]) * t], d: u2, s: L1 + R + (L2 - R) * t }); }
    const side = (sg) => pts.map(({ p, d, s }) => { const w = width(s); return [p[0] - d[1] * w * sg, p[1] + d[0] * w * sg]; });
    let A = side(1), B = side(-1);
    // the side inside the bend folds onto itself: cut the loop where it crosses (that point is the elbow crease)
    const cross = (u1[0] * u2[1] - u1[1] * u2[0]);
    const inner = cross > 0 ? "B" : "A";
    let creaseAt = null;
    const untangle = (Q) => {
      for (let i = 0; i < Q.length - 1; i++) for (let j = Q.length - 2; j > i + 1; j--) {
        const h = segX(Q[i], Q[i + 1], Q[j], Q[j + 1]);
        if (h) { creaseAt = h; return [...Q.slice(0, i + 1), h, ...Q.slice(j + 1)]; }
      }
      return Q;
    };
    if (inner === "A") A = untangle(A); else B = untangle(B);
    // shoulder cap: half circle around S
    const capN = 10, a0 = Math.atan2(B[0][1] - S[1], B[0][0] - S[0]), a1 = Math.atan2(A[0][1] - S[1], A[0][0] - S[0]);
    let da = a1 - a0; const back = Math.atan2(-u1[1], -u1[0]);
    // go round through the back of the shoulder
    const mid = (a0 + da / 2), facing = Math.cos(mid - back);
    if (facing < 0) da = da > 0 ? da - 2 * Math.PI : da + 2 * Math.PI;
    const cap = []; for (let i = 1; i < capN; i++) { const a = a0 + (da * i) / capN; cap.push([S[0] + Math.cos(a) * r.shoulder, S[1] + Math.sin(a) * r.shoulder]); }
    const ring = [...[...B].reverse().slice(0, -1).reverse()]; // B from shoulder to wrist
    const outline = [...[...A].reverse(), ...cap.reverse(), ...B]; // wrist(A) → shoulder → wrist(B)
    const line = smooth(outline, false);
    return { fill: line + "Z", line, crease: creaseAt, elbow: E, inner, turn };
  }
  function segX(p, p2, q, q2) {
    const r = [p2[0] - p[0], p2[1] - p[1]], s = [q2[0] - q[0], q2[1] - q[1]], d = r[0] * s[1] - r[1] * s[0];
    if (Math.abs(d) < 1e-9) return null;
    const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / d, u = ((q[0] - p[0]) * r[1] - (q[1] - p[1]) * r[0]) / d;
    return t > 0 && t < 1 && u > 0 && u < 1 ? [p[0] + r[0] * t, p[1] + r[1] * t] : null;
  }
  // Catmull-Rom through the points → cubic path
  function smooth(P, close) {
    const f = (v) => v.toFixed(1);
    let d = `M${f(P[0][0])},${f(P[0][1])}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
    }
    return close ? d + "Z" : d;
  }
  // a library hand shape (engine/cartoon/library/hands/*.json): { parts: [{ d, open }], lines, soft, nails } in this hand space
  function addPose(name, pose) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(String(name))) throw new Error(`HANDS.addPose: "${name}" must be camelCase letters`);
    if (POSES[name]) throw new Error(`HANDS.addPose: "${name}" already exists`);
    if (!Array.isArray(pose?.parts) || !pose.parts.every((x) => typeof x?.d === "string")) throw new Error(`HANDS.addPose("${name}"): parts = [{ d, open }]`);
    POSES[name] = { lines: [], soft: [], nails: [], ...pose };
    return name;
  }
  root.HANDS = { POSES, drawHand, handSvg, arm, mk, addPose };
})(typeof window !== "undefined" ? window : globalThis);
