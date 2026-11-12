// The camera rule book (engine/cartoon/library/camera.json, Brief 9) for the designers: frame a person by shot size, two people
// together, and name a shot's size. Framing follows the book: the frame's top and bottom land on body landmarks (read from the person's
// own skeleton, in head units), headroom as a share of the frame, looking room on the side the person faces. Call after drawing.
//   ZC.frame(W, b, "closeUp")            closeUp · mediumClose · medium · mediumWide · full · wide · extremeWide (or an alias: "CU", "MS", "ক্লোজ আপ")
//   ZC.frame(W, b, "medium", { x: 0.45 }) the face's place across the frame (default: centre, or looking room when side on)
//   ZC.twoShot(W, a, b, "full")          both people in one frame at that size (9:16: stage them in depth, not side by side)
//   ZC.shotSize(W, b) → "medium"         the size this frame shows of b (the book's head-fraction ladder)
//   ZC.shots(W, t, [{ at: 0, frame: [b, "wide"] }, { at: 1.2, frame: [b, "closeUp"], to: [b, "mediumClose"] }])   a cut list that follows people
(function (root) {
  const D = () => root.ZCAMERA_DATA || {};
  const mid = (v, d = 0) => (Array.isArray(v) ? (v[0] + v[v.length - 1]) / 2 : v ?? d);
  const ALIAS = () => { const m = {}; for (const [k, v] of Object.entries(D().sizes || {})) { m[k.toLowerCase()] = k; for (const a of v.aliases || []) m[String(a).toLowerCase()] = k; } return m; };
  const sizeId = (s) => { const k = ALIAS()[String(s).toLowerCase()]; if (!k) throw new Error(`ZC.frame: no shot size "${s}" (closeUp, mediumClose, medium, mediumWide, full, wide, extremeWide)`); return k; };
  // "chin+0.7head" → that landmark + 0.7 head heights, in head units down from the skull top
  const at = (expr, lm) => { const m = String(expr).match(/^([a-zA-Z]+)\s*([+-]\s*[\d.]+)?\s*(?:head)?$/); if (!m) return null; const base = lm[m[1]] ?? D().landmarks?.adult?.[m[1]]; return base == null ? null : base + (m[2] ? Number(m[2].replace(/\s/g, "")) : 0); };

  // the camera [x, y, width] that frames this person at that size
  function frameOf(W, b, size, o = {}) {
    const id = sizeId(size), S = D().sizes[id], B = b.box(), aspect = W.w / W.h, lm = B.lm;
    let H, top;
    if (id === "wide" || id === "extremeWide") { // the person takes a share of the frame's height, the floor low in the frame
      const share = mid(S.personHeightOfFrame, id === "wide" ? 0.4 : 0.1), body = (lm.feet - lm.headTop) * B.headPx;
      H = body / share; top = B.floor - H * 0.82;
    } else {
      const t0 = S.frameTop?.landmark === "headTop" ? 0 : at(S.frameTop?.landmark, lm) ?? 0;
      const bottom = S.frameBottom === "belowFeet" ? lm.feet : at(S.frameBottom, lm);
      if (bottom == null) throw new Error(`ZC.frame: "${id}" has no body frame (use ZC.twoShot or a camera you author)`);
      const headroom = Math.max(0, mid(S.frameTop?.headroom, 0)), footroom = S.frameBottom === "belowFeet" ? mid(S.footroom, 0.05) : 0;
      H = ((bottom - t0) * B.headPx) / (1 - headroom - footroom);
      top = B.headTop + t0 * B.headPx - headroom * H;
    }
    // a tall frame (9:16) is narrow: a close size still shows the head with air and the top of the shoulders, so it is never
    // narrower than this many head heights; the wider frame keeps the eyes on the book's line
    const MINW = { closeUp: 2.7, mediumClose: 3.3, medium: 4.1, mediumWide: 4.4 }[id]; // a wider size is never narrower than a closer one (mediumWide in 9:16 was 3.1 heads: a close-up by width)
    if (MINW && H * aspect < MINW * B.headPx) { const H2 = (MINW * B.headPx) / aspect, eyes = B.headTop + (lm.eyes ?? 0.5) * B.headPx; top = eyes - mid(S.eyeLine, 0.34) * H2; H = H2; } // the eyes stay on the book's line
    // bowed, seated, kneeling or lying: the frame keeps the size it has for this person standing (the camera does not zoom in because
    // someone bows); full and wider keep the floor at the bottom, closer sizes centre on the head
    if (!B.upright) {
      const sb = D().landmarks?.adult || {}, k = B.standHeads / ((sb.feet ?? 7.5) || 7.5), stand = Object.fromEntries(Object.entries(sb).map(([n, v]) => [n, v * k]));
      const T = frameOf(W, { box: () => ({ ...B, lm: { ...stand, feet: B.standHeads }, upright: true, headTop: B.floor - B.standHeads * B.headPx }) }, id, { ...o, x: 0.5 });
      H = T[2] / aspect;
      top = ["full", "mediumWide", "wide", "extremeWide"].includes(id) ? B.floor + H * (S.frameBottom === "belowFeet" ? mid(S.footroom, 0.05) : 0.12) - H : B.headY - H * 0.4;
      top = Math.min(top, B.headTop - H * 0.05); // a seated person's head is never cut by the frame
    }
    const w = H * aspect, fx = o.x ?? (B.facing > 0 ? 0.45 : B.facing < 0 ? 0.55 : 0.5); // looking room on the side the person faces
    return [B.x - (fx - 0.5) * w, top + H / 2, w];
  }
  function frame(W, b, size, o = {}) { const c = frameOf(W, b, size, o); W.cam(c[0], c[1], c[2], o.tilt || 0); return c; }
  function twoShotOf(W, a, b, size = "full", o = {}) {
    const A = frameOf(W, a, size, o), B = frameOf(W, b, size, o), aspect = W.w / W.h;
    const hA = A[2] / aspect, hB = B[2] / aspect, top = Math.min(A[1] - hA / 2, B[1] - hB / 2), bottom = Math.max(A[1] + hA / 2, B[1] + hB / 2);
    const left = Math.min(a.box().x, b.box().x), right = Math.max(a.box().x, b.box().x), pad = Math.max(a.box().headPx, b.box().headPx) * 1.6;
    const w = Math.max((bottom - top) * aspect, right - left + 2 * pad), h = w / aspect;
    return [(left + right) / 2, Math.max(top + h / 2, (top + bottom) / 2), w];
  }
  function twoShot(W, a, b, size = "full", o = {}) { const c = twoShotOf(W, a, b, size, o); W.cam(c[0], c[1], c[2], o.tilt || 0); return c; }
  // the size whose frame for THIS person is closest to the camera's frame (a child is fewer heads tall than the book's head-fraction
  // ladder assumes, so the size is measured on the person's own body); the ladder is the fallback
  function shotSize(W, b) {
    const c = W.svg.__cam || { ch: W.h, cw: W.w };
    let best = null, err = Infinity;
    for (const k of ["closeUp", "mediumClose", "medium", "mediumWide", "full", "wide", "extremeWide"]) {
      try { const e = Math.abs(Math.log(frameOf(W, b, k)[2] / c.cw)); if (e < err) { err = e; best = k; } } catch { /* a size without a body frame */ }
    }
    if (best && b.box().headPx / c.ch > 0.7) return "extremeClose";
    if (best) return best;
    const f = b.box().headPx / c.ch, min = D().sizeClassify?.headFractionMin || {};
    return (D().sizeClassify?.ladder || []).slice().reverse().find((k) => f >= (min[k] ?? 0)) || "extremeWide";
  }
  // ZC.cameraMove(W, kind, t, d, { on, other, at }): a move over the shot's own framing (call it after the shot's camera is set).
  //   slow_push_in · slow_pull_out (12% over the shot, eased, toward the head of `on`) · gentle_pan (5% of the frame across the shot)
  //   impact_shake (a decaying shake starting at `at` s, 0.6 s, no tilt) · over_the_shoulder (`on` speaks at 62% across the frame,
  //   `other`'s shoulder at the near edge, framed at head height). Pure function of t: any frame can be drawn alone.
  const MOVES = ["slow_push_in", "slow_pull_out", "gentle_pan", "impact_shake", "over_the_shoulder"];
  function cameraMove(W, kind, t, d, o = {}) {
    if (!kind) return W.svg.__cam;
    if (!MOVES.includes(kind)) throw new Error(`ZC.cameraMove: no move "${kind}" (${MOVES.join(", ")})`);
    const c = { ...(W.svg.__cam || { x: W.w / 2, y: W.h / 2, cw: W.w }) }, u = Math.max(0, Math.min(1, t / Math.max(0.01, d))), e = u * u * (3 - 2 * u);
    let { x, y, cw } = c; const head = (() => { try { const B = o.on?.box?.(); return B ? { x: B.x, y: B.headTop + B.headPx * 0.6 } : null; } catch { return null; } })();
    if (kind === "slow_push_in" || kind === "slow_pull_out") {
      const k = kind === "slow_push_in" ? 1 - 0.12 * e : 0.88 + 0.12 * e, toward = kind === "slow_push_in" ? e : 1 - e;
      if (head) { x = x + (head.x - x) * 0.35 * toward; y = y + (head.y - y) * 0.35 * toward; }
      cw *= k;
    } else if (kind === "gentle_pan") x += cw * 0.05 * (e - 0.5) * 2 * (o.dir || 1);
    else if (kind === "impact_shake") { const s = t - (o.at ?? 0.15); if (s >= 0 && s < 0.6) { const a = 0.014 * cw * Math.exp(-s * 7); x += a * Math.sin(s * 55); y += a * 0.7 * Math.cos(s * 47); } }
    else if (kind === "over_the_shoulder" && o.on && o.other) {
      const A = o.on.box(), B = o.other.box(), left = B.x < A.x, sx = left ? 0.62 : 0.38, ex = left ? 0.06 : 0.94;
      cw = Math.max(W.w * 0.35, Math.abs(A.x - B.x) / Math.abs(sx - ex)); x = A.x - (sx - 0.5) * cw; y = A.headTop + A.headPx * 1.4;
    }
    W.cam(x, y, cw); return W.svg.__cam;
  }
  // a headline sits in the top band of the frame (graphics-fx: 4.5 % + one or two lines): the camera leaves that much air above
  // the highest head on screen, zooming out around the floor line (feet stay where they are), so no face is ever under the pill
  function headroom(W, actors, frac) {
    const c = W.svg.__cam; if (!c) return null; const f = frac ?? (W.w / W.h < 1 ? 0.2 : 0.17);
    const tops = actors.map((a) => { try { return a?.box?.(); } catch { return null; } }).filter((b) => b && Number.isFinite(b.headTop) && Math.abs(b.x - c.x) < c.cw / 2).map((b) => b.headTop);
    if (!tops.length) return c; const top = Math.min(...tops), camTop = c.y - c.ch / 2; if (top - camTop >= f * c.ch) return c;
    const bottom = c.y + c.ch / 2, ch = Math.min((bottom - top) / (1 - f), c.ch * 1.6), cw = ch * (W.w / W.h);
    W.cam(c.x, bottom - ch / 2, cw, c.tilt || 0); return W.svg.__cam;
  }
  root.ZCAMERA = { frameOf, frame, twoShotOf, twoShot, shotSize, sizeId, cameraMove, MOVES, headroom };
  if (root.ZC) Object.assign(root.ZC, { frame, twoShot, shotSize, frameOf, cameraMove, headroom });
})(typeof window !== "undefined" ? window : globalThis);
