// The 2D character rig: one person = head (face, eyes, brows, mouth, hair), torso, two arms with drawn hands.
// Built once, then moved every frame by update(state). The body rules R1–R10 are enforced here and checked on every
// frame by check-body.mjs. Uses HANDS (hands.js) for the hands and the one-shape arm.
// ZRIG.create({ el, defs }) → { person(P, bodyLayer, armLayer), RULES, WRIST }
(function (root) {
  // Shared deterministic performance for full and waist-up bodies. No previous-frame state.
  function motion(t = 0, seed = "person", mouth = 0, talking = false) {
    let h = 2166136261; for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
    const a = 2.8 + 1.4 * ((h & 65535) / 65535), b = 2.8 + 1.4 * ((h >>> 16) / 65535), period = a + b;
    const phase = ((h >>> 8) % 1000) / 1000, u = ((t + phase * 1.5) % period + period) % period;
    const distance = Math.min(Math.abs(u - a), u, period - u), blink = distance < 0.095 ? Math.pow(Math.cos(distance / 0.095 * Math.PI / 2), 2) : 0;
    const k = Math.max(0, Math.min(1, t / (5 / 30))), fade = k * k * (3 - 2 * k);
    return { breath: fade * 0.0175 * Math.sin(t * Math.PI * 2 / 3.6 + phase * Math.PI * 2), blink: fade * blink,
      nod: fade * (talking ? 1.2 * Math.max(0, Math.min(1, mouth)) : 0), intervals: [a, b] };
  }
  root.ZRIG = {
    motion,
    create({ el, defs, idp = "" }) { // idp: this scene's id prefix (ids are unique on the assembled page)
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const HL = root.HANDS;
      const WRIST = { rest: 22, open: 15, drape: 45, fist: 0, point: 0, pencil: 0, phone: 0 }; // the wrist bend each pose holds (toward the thumb)
      const grad = (id, x2, y2, stops, extra = {}) => { if (defs.querySelector && defs.querySelector("#" + id)) return; const g = el("linearGradient", { id, x1: 0, y1: 0, x2, y2, ...extra }, defs); stops.forEach(([o, c, a = 1]) => el("stop", { offset: o, "stop-color": c, "stop-opacity": a }, g)); };
      grad("g-shade", 1, 0, [[0, "#5a2c14", 0.3], [0.55, "#5a2c14", 0]]);
      grad("g-shadeB", 1, 0, [[0, "#1c1410", 0.2], [0.6, "#1c1410", 0]]);
      grad("g-shadeG", 1, 0, [[0, "#1c1410", 0.2], [0.6, "#1c1410", 0]]);
      // Anatomy authority: skills/2d-animation/human-anatomy-rigging.md (H01–H13).
      // Legacy R1–R10 IDs below map to its implementation inventory. Keep executable
      // constraints here; do not maintain a second prose specification in this file.
      const RULES = { minElbow: 30, maxWrist: 45, minReach: 0.6 };
      window.__rig = {};
      // ---------------- limbs and hands ----------------
      // a tapered capsule = the hull of two circles; chains of them make arms, fingers and thumbs
      function capsule(a, ra, b, rb) {
        const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.max(0.01, Math.hypot(dx, dy)), ux = dx / d, uy = dy / d;
        const k = clamp((ra - rb) / d, -0.99, 0.99), c = Math.sqrt(1 - k * k);
        const n1 = [ux * k - uy * c, uy * k + ux * c], n2 = [ux * k + uy * c, uy * k - ux * c];
        const P = (p, n, r) => `${(p[0] + n[0] * r).toFixed(1)},${(p[1] + n[1] * r).toFixed(1)}`;
        return `M${P(a, n1, ra)} L${P(b, n1, rb)} A${rb},${rb} 0 ${k < 0 ? 1 : 0} 0 ${P(b, n2, rb)} L${P(a, n2, ra)} A${ra},${ra} 0 ${k > 0 ? 1 : 0} 0 ${P(a, n1, ra)}Z`;
      }
      const along = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];

      // ---------------- a 2D character rig ----------------
      function person(P, bodyLayer, armLayer) {
        const fig = el("g", {}, bodyLayer);
        const behind = el("g", {}, fig); // long hair and anything else that hangs behind the body; moves with the head
        if (P.bag) { el("rect", { x: -P.arms[1].sh[0] * 0.95, y: 190, width: P.arms[1].sh[0] * 1.9, height: 340, rx: 46, fill: P.bag.color }, behind); }
        if (P.hairBehind) el("path", { d: P.hairBehind, fill: P.hair }, behind);
        const neckFirst = el("g", {}, fig);
        const torso = el("g", {}, fig);
        el("path", { d: P.torso, fill: P.cloth }, torso);
        el("path", { d: P.torso, fill: P.clothShade }, torso);
        // a short top ends at the hip: the trousers below it (the same colour as the full body's), a soft shade under the hem, no outline
        if (P.pantsD) { el("path", { d: P.pantsD, fill: P.pants }, torso); el("path", { d: P.pantsD, fill: P.clothShade, opacity: 0.6 }, torso);
          el("path", { d: P.flyD, fill: "none", stroke: "#000", "stroke-width": 2.4, opacity: 0.14 }, torso);
          const hw = P.arms[1].sh[0] * 1.06; el("path", { d: `M${-hw},${P.hemY - 2} Q0,${P.hemY + 10} ${hw},${P.hemY - 2} L${hw},${P.hemY + 12} Q0,${P.hemY + 24} ${-hw},${P.hemY + 12}Z`, fill: "#000", opacity: 0.12 }, torso); }
        // no outlines on the body: the form comes from shade and cloth folds
        const tc = P.arms[1].sh, ftop = tc[1];
        for (const d of [`M${-tc[0] * 0.62},${ftop + 66} Q${-tc[0] * 0.42},${ftop + 92} ${-tc[0] * 0.3},${ftop + 136}`, `M${tc[0] * 0.62},${ftop + 66} Q${tc[0] * 0.42},${ftop + 92} ${tc[0] * 0.3},${ftop + 136}`, `M${-tc[0] * 0.78},${ftop + 250} Q${-tc[0] * 0.3},${ftop + 278} ${tc[0] * 0.12},${ftop + 262}`, `M${tc[0] * 0.8},${ftop + 300} Q${tc[0] * 0.4},${ftop + 322} ${tc[0] * 0.02},${ftop + 316}`])
          el("path", { d, fill: "none", stroke: "#000", "stroke-width": 3, "stroke-linecap": "round", opacity: 0.13 }, torso);
        if (P.neckline) el("path", { d: P.neckline, fill: P.necklineC || P.skin }, torso);
        if (P.tieD) { el("path", { d: P.tieD, fill: P.tie }, torso); for (const d of P.lapels) el("path", { d, fill: "#000", opacity: 0.16 }, torso); el("path", { d: P.jacketLine, fill: "none", stroke: "#000", "stroke-width": 3, opacity: 0.3 }, torso); }
        if (P.collar) el("path", { d: P.collar, fill: "none", stroke: P.collarC, "stroke-width": 9, "stroke-linecap": "round" }, torso);
        if (P.bag) for (const sd of [-1, 1]) { const x0 = sd * P.arms[1].sh[0] * 0.52, y0 = ftop - 36; el("path", { d: `M${x0},${y0} C${x0 + sd * 2},${y0 + 90} ${x0 + sd * 8},${y0 + 190} ${x0 + sd * 52},${y0 + 300}`, fill: "none", stroke: P.bag.strap, "stroke-width": 26, "stroke-linecap": "butt" }, torso); el("rect", { x: x0 + sd * 3 - 17, y: y0 + 120, width: 34, height: 15, rx: 4, fill: P.bag.shade }, torso); }
        if (P.orna) { el("path", { d: P.orna, fill: P.ornaC }, torso); el("path", { d: P.orna, fill: "url(#g-shadeG)" }, torso); }
        const neck = neckFirst;
        el("path", { d: "M-30,60 L30,60 L34,176 L-34,176Z", fill: P.skin }, neck);
        el("path", { d: "M-31,100 L31,100 L32,132 Q0,152 -32,132Z", fill: P.shade, opacity: 0.6 }, neck); // the shade under the chin, inside the neck
        const head = el("g", {}, fig);
        if (P.hairBack) el("path", { d: P.hairBack, fill: P.hair }, head);
        if (P.bun) {
          const head0 = head; { const head = el("g", { transform: "translate(18 -46) scale(1.12)" }, head0);
          el("circle", { cx: 72, cy: -100, r: 37, fill: P.hair }, head);
          for (const d of ["M46,-110 C56,-134 92,-132 100,-106", "M44,-94 C52,-120 98,-122 106,-96", "M50,-78 C64,-70 94,-76 104,-92", "M60,-128 C74,-136 92,-128 96,-116"]) el("path", { d, fill: "none", stroke: P.strandC, "stroke-width": 2.4, "stroke-linecap": "round", opacity: 0.85 }, head);
          el("path", { d: "M62,-132 C76,-138 90,-132 96,-122", fill: "none", stroke: P.hairShine, "stroke-width": 4, "stroke-linecap": "round", opacity: 0.5 }, head);
          el("path", { d: "M44,-112 C38,-98 40,-82 50,-70", fill: "none", stroke: "#b0473c", "stroke-width": 8, "stroke-linecap": "round" }, head); }
        }
        const ears = el("g", {}, head);
        const earSide = {}; // one group per ear: a head turned three-quarters hides the far ear
        for (const s of [-1, 1]) { const g = (earSide[s] = el("g", { "data-ear": s }, ears)); el("ellipse", { cx: s * (P.earX + 3), cy: 6, rx: 16, ry: 25, fill: P.skin }, g); el("path", { d: `M${s * (P.earX - 3)},-6 q${s * 7},10 0,22`, stroke: P.shade, "stroke-width": 3, fill: "none" }, g); }
        if (P.earring) for (const s of [-1, 1]) el("circle", { cx: s * P.earX, cy: 34, r: 5, fill: "#e0b545" }, earSide[s]);
        const cid = idp + "fc-" + P.id;
        const cp = el("clipPath", { id: cid }, defs); el("path", { d: P.face }, cp);
        el("path", { d: P.face, fill: P.skin }, head);
        el("path", { d: P.face, fill: "url(#g-shade)", opacity: 0.55 }, head);
        const feat = el("g", { "clip-path": `url(#${cid})` }, head);
        const featIn = el("g", {}, feat);
        for (const s of [-1, 1]) el("ellipse", { cx: s * 52, cy: 38, rx: 22, ry: 13, fill: "#e0786a", opacity: P.blush }, featIn);
        el("path", { d: P.nose, fill: "none", stroke: P.shade, "stroke-width": 3.5, "stroke-linecap": "round" }, featIn);
        el("ellipse", { cx: -8, cy: 30, rx: 10, ry: 14, fill: P.shade, opacity: 0.18 }, featIn);
        el("ellipse", { cx: 7, cy: 14, rx: 3.5, ry: 12, fill: "#fff4e4", opacity: 0.35 }, featIn);           // light on the nose bridge
        el("ellipse", { cx: 24, cy: -62, rx: 44, ry: 18, fill: "#fff4e4", opacity: 0.07 }, featIn);          // forehead catching the window light
        el("ellipse", { cx: 0, cy: P.mouthY + 30, rx: 22, ry: 8, fill: P.shade, opacity: 0.16 }, featIn);    // under the lower lip
        for (const d of P.lines || []) el("path", { d, fill: "none", stroke: P.shade, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.14 }, featIn);
        for (const [mx, my, mr] of P.moles || []) el("circle", { cx: mx, cy: my, r: mr, fill: "#5a3020", opacity: 0.8 }, featIn);
        for (const [fx, fy] of P.freckles || []) el("circle", { cx: fx, cy: fy, r: 1.6, fill: P.shade, opacity: 0.45 }, featIn);
        // mouth
        const mg = el("g", { transform: `translate(0 ${P.mouthY})` }, featIn);
        const mid = idp + "mc-" + P.id, mcp = el("clipPath", { id: mid }, defs), mClip = el("path", {}, mcp);
        const mFill = el("path", { fill: "#5b2522" }, mg);
        const mIn = el("g", { "clip-path": `url(#${mid})` }, mg);
        const teeth = el("rect", { x: -30, y: -12, width: 60, height: 8, fill: "#f8f4ec" }, mIn);
        const tongue = el("ellipse", { cx: 0, cy: 14, rx: 14, ry: 7, fill: "#c4625b" }, mIn);
        const mLine = el("path", { fill: "none", stroke: P.lip, "stroke-width": 3.2, "stroke-linecap": "round" }, mg);
        const mLow = el("path", { fill: "none", stroke: P.shade, "stroke-width": 2.5, "stroke-linecap": "round", opacity: 0.6 }, mg);
        const mNamed = el("g", {}, mg), fxG = el("g", {}, featIn); // a named mouth of the acting cards; tears and sweat
        // eyes
        const eyes = [-1, 1].map((s) => {
          const g = el("g", { transform: `translate(${s * P.eyeX} ${P.eyeY})` }, featIn);
          const eid = `${idp}ec-${P.id}${s}`, ecp = el("clipPath", { id: eid }, defs);
          const alm = "M-20,1 Q0,-25 20,1 Q0,18 -20,1Z";
          el("path", { d: alm }, ecp);
          el("path", { d: alm, fill: "#fbf8f2" }, g);
          const inner = el("g", { "clip-path": `url(#${eid})` }, g);
          const iris = el("g", {}, inner);
          el("circle", { r: 9.5, fill: P.iris }, iris); el("circle", { r: 4.6, fill: "#120a06" }, iris); el("circle", { cx: -3, cy: -3.5, r: 2.6, fill: "#fff" }, iris);
          const lid = el("path", { fill: P.lidC }, inner);
          const lowLid = el("path", { fill: P.lidC }, inner);
          const lash = el("path", { fill: "none", stroke: "#1d120c", "stroke-width": P.lash, "stroke-linecap": "round" }, g);
          el("path", { d: "M-19,-9 Q0,-25 20,-8", fill: "none", stroke: P.shade, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.55 }, g); // lid crease
          const low = el("path", { d: "M-16,4 Q0,14 16,4", fill: "none", stroke: P.shade, "stroke-width": 1.6, opacity: 0.5 }, g);
          const flick = P.flick ? el("path", { fill: "none", stroke: "#1d120c", "stroke-width": 2.2, "stroke-linecap": "round" }, g) : null;
          return { s, iris, lid, lowLid, lash, flick };
        });
        for (const o of P.overFace || []) el("path", { d: o.d, fill: o.fill || "none", stroke: o.stroke || "none", "stroke-width": o.w || 0, opacity: o.opacity ?? 1, "stroke-linecap": "round", "stroke-linejoin": "round", "fill-rule": o.rule || "nonzero" }, featIn);
        const brows = [-1, 1].map(() => el("path", { fill: P.brow, stroke: P.brow, "stroke-width": 1, "stroke-linejoin": "round" }, featIn));
        const browPath = (p0, p1, p2, W0) => {
          const L = [], R = [];
          for (let k = 0; k <= 10; k++) {
            const u = k / 10, q = (a, b, c) => (1 - u) * (1 - u) * a + 2 * u * (1 - u) * b + u * u * c;
            const x = q(p0[0], p1[0], p2[0]), y = q(p0[1], p1[1], p2[1]);
            const tx = 2 * (1 - u) * (p1[0] - p0[0]) + 2 * u * (p2[0] - p1[0]), ty = 2 * (1 - u) * (p1[1] - p0[1]) + 2 * u * (p2[1] - p1[1]), tl = Math.hypot(tx, ty) || 1;
            const w = W0 * (u < 0.3 ? 0.75 + u : 1.05 - (u - 0.3) * 1.25) / 2;
            L.push(`${(x - (ty / tl) * w).toFixed(1)},${(y + (tx / tl) * w).toFixed(1)}`); R.unshift(`${(x + (ty / tl) * w).toFixed(1)},${(y - (tx / tl) * w).toFixed(1)}`);
          }
          return `M${L.join(" L")} L${R.join(" L")}Z`;
        };
        const hairF = el("g", {}, head);
        el("path", { d: P.hairFront, fill: P.hair }, hairF);
        const hcid = idp + "hc-" + P.id, hcp = el("clipPath", { id: hcid }, defs); el("path", { d: P.hairFront }, hcp);
        const hIn = el("g", { "clip-path": `url(#${hcid})` }, hairF);
        el("path", { d: P.hairFront, fill: "url(#g-shade)", opacity: 0.6 }, hIn);
        for (const d of P.strands || []) el("path", { d, fill: "none", stroke: P.strandC, "stroke-width": 2.2, "stroke-linecap": "round", opacity: 0.9 }, hIn); // hair lines follow the hair's own colour, so white hair never looks like wire
        for (const d of P.shine || []) { el("path", { d, fill: "none", stroke: P.hairShine, "stroke-width": 7, "stroke-linecap": "round", opacity: 0.55 }, hIn); }
        if (P.part) el("path", { d: P.part, fill: "none", stroke: P.strandC, "stroke-width": 2.6, "stroke-linecap": "round" }, hIn);
        for (const d of P.wisps || []) el("path", { d, fill: "none", stroke: P.hair, "stroke-width": 1.8, "stroke-linecap": "round" }, hairF);
        for (const o of P.overHead || []) el("path", { d: o.d, fill: o.fill || "none", stroke: o.stroke || "none", "stroke-width": o.w || 0, opacity: o.opacity ?? 1, "stroke-linecap": "round", "stroke-linejoin": "round", "fill-rule": o.rule || "nonzero" }, hairF);
        if (P.cowlick) el("path", { d: P.cowlick, fill: P.hair }, hairF);
        // arms (world space)
        const arms = P.arms.map((A, i) => {
          const g = el("g", {}, armLayer);
          const mk = (fill, stroke) => ({ o: el("path", { fill: stroke, stroke, "stroke-width": 5, "stroke-linejoin": "round" }, g), f: el("path", { fill }, g) });
          const cid = `${idp}arm-${P.id}${i}`, cp = el("clipPath", { id: cid }, defs), clip = el("path", {}, cp);
          const skin = { f: el("path", { fill: P.skin }, g), o: el("path", { fill: "none" }, g) };
          const skinShade = el("path", { fill: "none" }, g);
          const crease = el("path", { fill: "none", stroke: P.shade, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.6 }, g);
          const scid = `slv-${P.id}${i}`, scp = el("clipPath", { id: scid }, defs), sclip = el("path", {}, scp);
          const slv = { f: el("path", { fill: P.cloth }, g), o: el("path", { fill: "none" }, g) };
          const bcid = `${idp}bl-${P.id}${i}`, bcp = el("clipPath", { id: bcid }, defs), blendE = el("ellipse", {}, bcp);
          const blendOuter = el("g", { "clip-path": `url(#${bcid})` }), blend = el("g", {}, blendOuter);
          el("path", { d: P.torso, fill: P.cloth }, blend); el("path", { d: P.torso, fill: P.clothShade }, blend);
          const swid = `${idp}g-sw-${P.id}${i}`, sw = el("linearGradient", { id: swid, gradientUnits: "userSpaceOnUse", x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
          for (const [o, a] of [[0, 0.2], [0.6, 0]]) el("stop", { offset: o, "stop-color": "#1c1410", "stop-opacity": a }, sw);
          const slvShade = el("path", { fill: `url(#${swid})` }, g);
                    const folds = el("path", { fill: "none", stroke: "#000", "stroke-width": 2.6, "stroke-linecap": "round", opacity: 0.18 }, g);
          const hem = el("path", { fill: "none", stroke: A.trim || "#000", "stroke-width": A.trim ? 6 : 2.6, "stroke-linecap": "round", opacity: A.trim ? 0.9 : 0.16 }, g);
          const bangles = A.bangle ? [0, 1].map((k) => el("ellipse", { fill: "none", stroke: k ? "#c08a2a" : "#e3b44a", "stroke-width": 4.5 }, g)) : [];
          const hand = el("g", {}, g), joint = el("circle", { fill: P.skin }, hand), handB = el("g", {}, hand), handA = el("g", {}, hand);
          return { sw, handA, handB, joint, poseB: "", A, skin, skinShade, clip, crease, slv, sclip, blend, blendE, slvShade, folds, hem, bangles, hand, pose: "" };
        });
        function ik(S, T, a, b, side, down, bendSide) {
          let dx = T[0] - S[0], dy = T[1] - S[1], d = Math.hypot(dx, dy);
          const dMin = Math.sqrt(a * a + b * b - 2 * a * b * Math.cos((RULES.minElbow * Math.PI) / 180)); // R3
          const dd = clamp(d, dMin, a + b - 0.5);
          const th = Math.atan2(dy, dx), al = Math.acos(clamp((a * a + dd * dd - b * b) / (2 * a * dd), -1, 1));
          const c1 = [S[0] + a * Math.cos(th + al), S[1] + a * Math.sin(th + al)], c2 = [S[0] + a * Math.cos(th - al), S[1] + a * Math.sin(th - al)];
          const score = (E) => (down ? 0.15 : 1) * side * (E[0] - S[0]) + (down ? 1 : 0.35) * (E[1] - S[1]);
          // R3: an explicit bend side (+1 / -1) from the acting; it may only change while the arm is straight
          const E = bendSide ? (bendSide > 0 ? c1 : c2) : score(c1) > score(c2) ? c1 : c2;
          const Tc = [S[0] + dd * Math.cos(th), S[1] + dd * Math.sin(th)], ang = Math.atan2(Tc[1] - E[1], Tc[0] - E[0]);
          return { E, Wp: [E[0] + b * Math.cos(ang), E[1] + b * Math.sin(ang)], ang };
        }
        return {
          update(s) {
            const x = P.x + s.lean[0], y = P.y + s.lean[1] + s.breath, sc = P.s;
            fig.setAttribute("transform", `translate(${x} ${y}) scale(${sc})`);
            torso.setAttribute("transform", `translate(0 0) scale(1 ${1 + (s.chest || 0)})`);
            head.setAttribute("transform", `translate(${s.turn * 6} ${s.down * 6 + s.nod}) rotate(${s.tilt} 0 100)`);
            // a turn: the face slides toward where the head turns and narrows a little (three-quarters), the far ear goes behind the head
            const ta = Math.max(0, Math.min(1, (Math.abs(s.turn) - 0.5) / 0.45)), far = ta > 0.3 ? Math.sign(s.turn) : 0; // up to half a turn: as before; past it, three-quarters
            ears.setAttribute("transform", `translate(${-s.turn * (5 + 9 * ta)} 0)`); for (const k of [-1, 1]) earSide[k].setAttribute("display", k === far ? "none" : "inline");
            featIn.setAttribute("transform", `translate(${s.turn * (13 + 22 * ta)} ${s.down * 9}) scale(${(1 - 0.12 * ta).toFixed(3)} 1)`);
            hairF.setAttribute("transform", `translate(${s.turn * (4 + 6 * ta)} ${s.down * 3})`);
            behind.setAttribute("transform", `translate(${s.turn * 5} ${s.down * 4 + s.nod})`);
            // eyes
            const fc = s.dials || {}, look = Array.isArray(fc.look) ? fc.look : [0, 0], sq = clamp(fc.squint || 0, 0, 1);
            for (const e of eyes) {
              const side = e.s > 0 ? "L" : "R", closed = clamp(s.lid + s.blink + sq * 0.2 + (fc.wink === side || (fc["wink" + side] || 0) > 0.5 ? 1 : 0), -0.2, 1);
              e.iris.setAttribute("transform", `translate(${s.gx * 7 + clamp(look[0] || 0, -1, 1) * 7} ${s.gy * 4.5 - clamp(look[1] || 0, -1, 1) * 4.5})`);
              e.lowLid.setAttribute("d", sq > 0.05 ? `M-22,${20 - sq * 15} Q0,${16 - sq * 14} 22,${20 - sq * 15} L22,24 L-22,24Z` : "M0,0Z");
              const c = -20 + closed * 34, lt = -20 + Math.max(0, closed) * 34;
              e.lid.setAttribute("d", `M-22,0 Q0,${c} 22,0 L22,-24 L-22,-24Z`);
              e.lash.setAttribute("d", `M-19.5,0.5 Q0,${lt} 19.5,0.5`);
              if (e.flick) { const ly = (x) => { const u = (x + 19.5) / 39; return (1 - u) * (1 - u) * 0.5 + 2 * u * (1 - u) * lt + u * u * 0.5; };
                e.flick.setAttribute("d", [[19, 8, -4], [15, 6, -6], [10, 4, -7], [5, 2, -6]].map(([x, dx, dy]) => `M${e.s * x},${ly(e.s * x)} l${e.s * dx},${dy}`).join(" ")); }
            }
            // brows: raise lifts both ends; inner > 0 lifts the inner end (worry), < 0 pulls it down (focus)
            brows.forEach((b, i) => { const sd = i ? 1 : -1, r = s.raise * 11 + (fc[i ? "browL" : "browR"] || 0) * 26, inn = s.inner * 7;
              b.setAttribute("d", browPath([sd * 16, P.browY - r - inn], [sd * 36, P.browY - 9 - r - inn * 0.3], [sd * 57, P.browY - 2 - r + inn * 0.35], P.browW * 1.25)); });
            // mouth: lip-sync open / round when speaking, else the rest smile
            const op = s.open, rd = s.round, sm = s.smile, named = fc.mouth && fc.mouth !== "rest" && op < 0.06 && root.ZANATOMY?.mouthShape ? fc.mouth : null;
            mNamed.innerHTML = named ? root.ZANATOMY.mouthShape(named, P.mouthW, P.lip) : "";
            for (const q of [mLine, mFill, mLow]) q.setAttribute("display", named ? "none" : "inline");
            const tears = clamp(fc.tears || 0, 0, 1), sweat = clamp(fc.sweat || 0, 0, 1);
            fxG.innerHTML = (tears > 0.05 ? [-1, 1].map((k) => `<g transform="translate(${k * P.eyeX} ${P.eyeY})" opacity="${0.4 + tears * 0.6}">${tears > 0.45 ? `<path d="M${k * 8},14 C${k * 10},30 ${k * 6},44 ${k * 9},${44 + tears * 22}" fill="none" stroke="#8fd0f4" stroke-width="5" stroke-linecap="round"/>` : ""}<path d="M${k * 8},10 c-4,6 -4,11 0,11 c4,0 4,-5 0,-11Z" fill="#8fd0f4"/></g>`).join("") : "") + (sweat > 0.05 ? `<g transform="translate(66 -46) scale(${0.7 + sweat * 0.6})" opacity="${0.5 + sweat * 0.5}"><path d="M0,-12 C-6,-2 -8,4 -8,8 a8,8 0 0 0 16,0 C8,4 6,-2 0,-12Z" fill="#bfe6fb"/></g>` : "");
            const w = (P.mouthW + 6 * Math.max(0, sm)) * (1 - 0.32 * rd), cy = -6 * sm, top = -2 - 2 * op, bot = 2 + 24 * op * (1 - 0.15 * rd);
            if (op < 0.06) {
              const d = `M${-w},${cy} Q0,${2 + 7 * sm} ${w},${cy}`;
              mLine.setAttribute("d", d); mFill.setAttribute("d", ""); mClip.setAttribute("d", "M0,0Z");
              mLow.setAttribute("d", `M${-w * 0.45},${10 + 3 * sm} Q0,${14 + 3 * sm} ${w * 0.45},${10 + 3 * sm}`);
              teeth.setAttribute("opacity", 0); tongue.setAttribute("opacity", 0);
            } else {
              const d = `M${-w},${cy} C${-w * 0.6},${top} ${w * 0.6},${top} ${w},${cy} C${w * 0.7},${bot} ${-w * 0.7},${bot} ${-w},${cy}Z`;
              mFill.setAttribute("d", d); mClip.setAttribute("d", d); mLine.setAttribute("d", d);
              mLow.setAttribute("d", `M${-w * 0.45},${bot + 7} Q0,${bot + 10} ${w * 0.45},${bot + 7}`);
              teeth.setAttribute("opacity", op > 0.22 ? 1 : 0); teeth.setAttribute("y", top - 3);
              tongue.setAttribute("opacity", 1); tongue.setAttribute("cy", bot - 3);
            }
            // arms
            arms.forEach((a, i) => {
              const A = a.A, S = [x + sc * A.sh[0], y + sc * A.sh[1]], T0 = s.hands[i], tl = Math.hypot(T0[0] - S[0], T0[1] - S[1]) || 1, back = 18 * (A.hand / 20) * sc, T = s.wrists?.[i]?.slice() || [T0[0] - ((T0[0] - S[0]) / tl) * back, T0[1] - ((T0[1] - S[1]) / tl) * back];
              const fsh = clamp((s.reach && s.reach[i]) || 1, RULES.minReach, 1); // R1 // < 1: the arm points toward the camera and looks shorter
              const given = s.elbows && s.elbows[i]; // the skeleton's own elbow (a library move, or an arm at rest on a sheet or a table): each bone as short as the camera sees it
              if (!given) { // H05: a target the arm cannot reach: the hand goes to the nearest point it can, the bones never stretch, and the gate's notes say so
                const a0 = A.up * sc * fsh, b0 = A.fo * sc * fsh, far = a0 + b0 - 1, near = Math.sqrt(a0 * a0 + b0 * b0 - 2 * a0 * b0 * Math.cos((RULES.minElbow * Math.PI) / 180)) + 1, tx = T[0] - S[0], ty = T[1] - S[1], td = Math.hypot(tx, ty) || 1, fit = clamp(td, near, far);
                if (Math.abs(fit - td) > 0.01) { T[0] = S[0] + (tx / td) * fit; T[1] = S[1] + (ty / td) * fit; if (window.__reach) window.__reach[`${P.id} arm ${i}`] = td > far; }
              }
              const { E, Wp, ang } = given ? { E: given, Wp: T, ang: Math.atan2(T[1] - given[1], T[0] - given[0]) } : ik(S, T, A.up * sc * fsh, A.fo * sc * fsh, A.sh[0] < 0 ? -1 : 1, s.elbowDown && s.elbowDown[i], s.bend && s.bend[i]);
              const hs = (A.hand / 20) * sc;
              // shoulder (deltoid) → biceps → elbow → forearm swell → wrist
              const rS = (A.wU / 2 + 1) * sc, rM = (A.wU / 2 - 1) * sc, rE = (A.wF / 2 + 0.5) * sc, rB = (A.wF / 2 + 1.5) * sc, rW = 13 * hs;
              const AR = HL.arm(S, E, Wp, { shoulder: A.sleeve < 1 ? rS - 5 * sc : rS, upper: rM, elbow: rE, fore: rB, wrist: 13 * hs }), armD = AR.fill; // R8
              a.skin.o.setAttribute("d", AR.line); a.skin.f.setAttribute("d", armD); a.clip.setAttribute("d", armD);
              // light from the window on the right: the far side of each limb is in shade
              a.skinShade.setAttribute("d", armD);
              // elbow crease on the inside of the bend
              const mid = along(S, Wp, 0.5), ix = mid[0] - E[0], iy = mid[1] - E[1], il = Math.hypot(ix, iy) || 1;
              const bend = clamp(1 - il / (0.5 * (A.up + A.fo) * sc * fsh), 0, 1);
              const cx0 = E[0] + (ix / il) * rE * 0.55, cy0 = E[1] + (iy / il) * rE * 0.55;
              a.crease.setAttribute("d", A.sleeve < 1 && AR.crease ? `M${AR.crease[0]},${AR.crease[1]} L${AR.crease[0] + (E[0] - AR.crease[0]) * 0.45},${AR.crease[1] + (E[1] - AR.crease[1]) * 0.45}` : bend > 0.08 && A.sleeve < 1 ? `M${cx0 - (iy / il) * 6},${cy0 + (ix / il) * 6} Q${cx0 + (ix / il) * 3},${cy0 + (iy / il) * 3} ${cx0 + (iy / il) * 6},${cy0 - (ix / il) * 6}` : "");
              // sleeve: round over the shoulder, open (and a little flared) at the hem
              const tube = (a0, r0, b0, r1) => {
                const dx = b0[0] - a0[0], dy = b0[1] - a0[1], d = Math.hypot(dx, dy) || 1, n = [-dy / d, dx / d], u = [dx / d, dy / d];
                const p = (q, r, sg) => `${(q[0] + n[0] * r * sg).toFixed(1)},${(q[1] + n[1] * r * sg).toFixed(1)}`;
                return { d: `M${p(a0, r0, 1)} L${p(b0, r1, 1)} Q${(b0[0] + u[0] * 5).toFixed(1)},${(b0[1] + u[1] * 5).toFixed(1)} ${p(b0, r1, -1)} L${p(a0, r0, -1)} A${r0},${r0} 0 1 0 ${p(a0, r0, 1)}Z`, n, u };
              };
              let slD, hemAt, hemN, hemR;
              if (A.sleeve < 1) {
                const H = along(S, E, A.sleeve), t0 = tube(S, rS + 2.5 * sc, H, rM + 7 * sc);
                slD = t0.d; hemAt = [H[0] - t0.u[0] * 6, H[1] - t0.u[1] * 6]; hemN = t0.n; hemR = rM + 6 * sc;
                a.folds.setAttribute("d", `M${along(S, H, 0.25)[0] + t0.n[0] * 6},${along(S, H, 0.25)[1] + t0.n[1] * 6} Q${along(S, H, 0.6)[0]},${along(S, H, 0.6)[1]} ${H[0] - t0.u[0] * 12 - t0.n[0] * 8},${H[1] - t0.u[1] * 12 - t0.n[1] * 8}`);
              } else {
                const C = along(E, Wp, A.sleeveF), rC = rB + 6.5 * sc, t1 = tube(E, rE + 7 * sc, C, rC);
                const SA = HL.arm(S, E, C, { shoulder: rS + 2.5 * sc, upper: rM + 4.5 * sc, elbow: rE + 6 * sc, fore: rB + 5.5 * sc, wrist: rC });
                slD = SA.fill; a.slvLine = SA.line; hemAt = [C[0] - t1.u[0] * 4, C[1] - t1.u[1] * 4]; hemN = t1.n; hemR = rC - 1;
                const ex = E[0] + (ix / il) * rE * 0.7, ey = E[1] + (iy / il) * rE * 0.7;
                a.folds.setAttribute("d", bend > 0.08 ? `M${ex - (iy / il) * 9},${ey + (ix / il) * 9} q${(ix / il) * 6},${(iy / il) * 6} ${(iy / il) * 18},${-(ix / il) * 18} M${ex - (iy / il) * 7 - (ix / il) * 9},${ey + (ix / il) * 7 - (iy / il) * 9} q${(ix / il) * 4},${(iy / il) * 4} ${(iy / il) * 13},${-(ix / il) * 13}` : "");
              }
              a.slv.o.setAttribute("d", A.sleeve < 1 ? slD : a.slvLine); a.slv.f.setAttribute("d", slD); a.sclip.setAttribute("d", slD);
              a.slvShade.setAttribute("d", slD);
              const hw = (P.id === "r" ? 150 : 156) * sc; a.sw.setAttribute("x1", x - hw); a.sw.setAttribute("x2", x + hw); // the torso's own shading, in world space
              // the shoulder grows out of the body: hide the sleeve's outline on the side toward the neck
              const toC = Math.sign(x - S[0]); a.blendE.setAttribute("cx", S[0] + toC * rS * 0.8); a.blendE.setAttribute("cy", S[1] + rS * 0.1); a.blendE.setAttribute("rx", rS * 0.95); a.blendE.setAttribute("ry", rS * 1.05);
              a.blend.setAttribute("transform", fig.getAttribute("transform"));
              a.hem.setAttribute("d", `M${hemAt[0] + hemN[0] * hemR},${hemAt[1] + hemN[1] * hemR} L${hemAt[0] - hemN[0] * hemR},${hemAt[1] - hemN[1] * hemR}`);
              // bangles sit just above the wrist, seen a little from above
              a.bangles.forEach((b, k) => { const q = along(E, Wp, 0.8 - k * 0.07); b.setAttribute("cx", q[0]); b.setAttribute("cy", q[1]); b.setAttribute("rx", rW + 3.5); b.setAttribute("ry", 4.5); b.setAttribute("transform", `rotate(${(ang * 180) / Math.PI + 90} ${q[0]} ${q[1]})`); });
              // the hand: thumb on the inside (toward the body's middle) for hands on the desk
              const pose = s.poses[i];
              const col = { skin: P.skin, shade: P.shade, nail: P.nail, w: 2.6 / hs };
              if (pose !== a.pose) { HL.drawHand(a.handA, pose, col); a.pose = pose; }
              const bl = s.blend && s.blend[i]; // R10: the previous pose folds away behind the new one, solid: a see-through hand reads as a ghost
              if (bl && bl.from !== a.poseB) { HL.drawHand(a.handB, bl.from, col); a.poseB = bl.from; }
              a.handB.setAttribute("opacity", bl ? 1 : 0); a.handB.setAttribute("transform", bl ? `scale(${1 - 0.45 * bl.u})` : ""); a.handB.setAttribute("data-fade", bl ? 1 : 0); a.handA.setAttribute("opacity", 1);
              const wristOf = (p) => clamp(WRIST[p] || 0, -RULES.maxWrist, RULES.maxWrist); // R4
              const m = A.sh[0] < 0 ? 1 : -1, wrist = wristOf(pose);
              // Seeking also redraws the end states of earlier, hidden clips. Only
              // publish the current clip's people to the body collision checker.
              if (s.out) s.out[i] = { W: Wp, ang };
              const clip = bodyLayer.closest?.('.clip[data-start]'), time = window.__timelines?.main?.time();
              if (!clip || time == null || (time >= +clip.dataset.start && time < +clip.dataset.start + +clip.dataset.duration))
                (window.__rig[P.id] ||= [])[i] = { S, E, W: Wp, T, ang, source: s.sourceArms?.[i], given: !!given, up: A.up * sc * fsh, fo: A.fo * sc * fsh, wrist, rW, handW: 13 * hs, pose, head: [x, y, 105 * sc] };
              a.joint.setAttribute("r", 12.4); a.joint.setAttribute("cx", 0); a.joint.setAttribute("cy", 0);
              a.hand.setAttribute("transform", `translate(${Wp[0]} ${Wp[1]}) rotate(${(ang * 180) / Math.PI - 90}) scale(${m * hs} ${hs})`);
              a.handA.setAttribute("transform", `rotate(${-wrist})`); a.handB.setAttribute("transform", `rotate(${-(bl ? wristOf(bl.from) : wrist)})`);
            });
          },
        };
      }
      return { person, RULES, WRIST };
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
