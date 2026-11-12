// ZFX: procedural motion graphics on a scene, drawn from time alone (seek-safe, no randomness, no model).
//   const FX = ZFX.mount(W, { headline: "প্রতিদিন ৩০ মিনিট হাঁটুন!", overlays: [ ...from server/caption-writer.mjs ] }, { actors: { rafi: a0 } });
//   in the clock, after the camera: FX.tick(t, d)
// Overlays: dynamic_comparison_chart · percentage_progress_ring · number_badge_pop · step_list_card · thought_cloud · comic_emotion_fx.
// Geometry for charts comes from d3-scale / d3-shape and rough.js on the node side; the pop is animejs's spring curve, sampled there.
// Everything is screen-fixed (above the camera) and kept out of the caption lane (the bottom 22% of the frame). A thought cloud or an
// emotion effect is attached to a person: it follows their head through the camera's moves.
(function (root) {
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, TAU = Math.PI * 2;
  const ease = (u) => { const v = clamp(u, 0, 1); return 1 - Math.pow(1 - v, 3); };
  const BN = '০১২৩৪৫৬৭৮৯', bnNum = (n, bn) => { const s = Number.isInteger(n) ? String(n) : (Math.round(n * 10) / 10).toString(); return bn ? s.replace(/[0-9]/g, (d) => BN[+d]) : s; };
  const FONT = '"Hind Siliguri", "Anek Bangla", "Noto Sans Bengali", "Kohinoor Bangla", Arial, sans-serif', LANE = 0.78; // the caption lane starts at 78% of the frame height
  function springOf(table) { const T = table && table.length > 1 ? table : null; return (u) => { if (!T) return ease(u); const v = clamp(u, 0, 1) * (T.length - 1), i = Math.floor(v), f = v - i; return i >= T.length - 1 ? T[T.length - 1] : lerp(T[i], T[i + 1], f); }; }
  function K(g) {
    const el = (t, a, p = g) => root.ZC.el(t, a, p);
    return { g, el,
      r: (x, y, w, h, fill, a = {}) => el('rect', { x, y, width: Math.max(0, w), height: Math.max(0, h), fill, ...a }),
      c: (x, y, r, fill, a = {}) => el('circle', { cx: x, cy: y, r: Math.max(0, r), fill, ...a }),
      e: (x, y, rx, ry, fill, a = {}) => el('ellipse', { cx: x, cy: y, rx: Math.max(0, rx), ry: Math.max(0, ry), fill, ...a }),
      p: (d, fill, a = {}) => el('path', { d, fill, ...a }),
      t: (x, y, s, size, fill, a = {}) => { const n = el('text', { x, y, 'font-size': size, fill, 'text-anchor': 'middle', 'font-family': FONT, 'font-weight': 700, ...a }); n.textContent = NFC(s); return n; },
      sub: (transform, a = {}) => K(el('g', { transform, ...a })) };
  }
  // Bangla is shaped by the font: a conjunct (ক্ষ) or a vowel sign (ি) is part of one visible letter. Text is NFC; it is measured and
  // cut by grapheme (Intl.Segmenter), never by code point, so a cut never leaves a dangling sign or hasanta.
  const SEG = (() => { try { return new Intl.Segmenter('bn', { granularity: 'grapheme' }); } catch { return null; } })();
  const NFC = (s) => String(s ?? '').normalize('NFC'), graphemes = (s) => (SEG ? [...SEG.segment(NFC(s))].map((x) => x.segment) : [...NFC(s)]);
  const clip = (s, n) => { const g = graphemes(s); return g.length <= n ? g.join('') : g.slice(0, Math.max(1, n - 1)).join('').trimEnd() + '…'; };
  const measure = (() => { try { return root.document?.createElement('canvas').getContext('2d') || null; } catch { return null; } })();
  const textW = (s, size) => {
    // Bundled fonts are loaded before the render timeline starts. A grapheme estimate
    // underestimated shaped Bengali and let headlines escape their backing pill.
    if (measure) { measure.font = `700 ${size}px ${FONT}`; return measure.measureText(NFC(s)).width; }
    return graphemes(s).length * size * 0.8;
  };
  function card(k, x, y, w, h, seed) {
    k.r(x + 6, y + 10, w, h, '#000', { rx: 22, opacity: 0.18 }); k.r(x, y, w, h, '#fffaf0', { rx: 22 });
    if (root.rough) { const gen = root.rough.generator(); for (const p of gen.toPaths(gen.rectangle(x + 4, y + 4, w - 8, h - 8, { seed: seed || 1, roughness: 1.2, stroke: '#2b3440', strokeWidth: 3 }))) k.p(p.d, 'none', { stroke: p.stroke, 'stroke-width': p.strokeWidth }); }
    else k.r(x, y, w, h, 'none', { rx: 22, stroke: '#2b3440', 'stroke-width': 3 });
  }
  // world px → screen px through the camera (W.svg.__cam is what the camera sees)
  const toScreen = (W, x, y) => { const c = W.svg.__cam || { x: W.w / 2, y: W.h / 2, cw: W.w, ch: W.h }, k = W.w / c.cw; return { x: (x - c.x) * k + W.w / 2, y: (y - c.y) * k + W.h / 2, k }; };
  function headOf(W, a) {
    if (!a) return null;
    try { if (a.box) { const b = a.box(), s = toScreen(W, b.x, b.headTop); return { x: s.x, top: s.y, size: b.headPx * s.k, facing: b.facing || 1 }; } } catch { /* not drawn yet */ }
    if (a.head) { const s = toScreen(W, a.head[0], a.head[1] - (a.headR || 40)); return { x: s.x, top: s.y, size: (a.headR || 40) * 2 * s.k, facing: 1 }; }
    return null;
  }

  // ---------- the overlays: draw(k, spec, L, t, d, spr) where L is the layout box ----------
  const D = {};
  D.headline = (k, sp, L, t, d, spr) => {
    // fits the frame: shrinks first, then breaks into two lines at the space nearest the middle (a 9:16 frame is narrow)
    const base = L.S * 54, maxW = L.W * 0.86, fit = (txt, z) => Math.min(z, (z * (maxW - z * 1.6)) / Math.max(1, textW(txt, z)));
    let lines = [String(sp.text)], size = fit(lines[0], base);
    if (size < base * 0.72) { const words = lines[0].split(' '); if (words.length > 1) { let best = 1, gap = Infinity; for (let i = 1; i < words.length; i++) { const g = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length); if (g < gap) { gap = g; best = i; } } lines = [words.slice(0, best).join(' '), words.slice(best).join(' ')]; size = Math.min(...lines.map((l) => fit(l, base))); } }
    size = Math.round(Math.max(base * 0.45, size));
    const lh = size * 1.15, w = Math.min(maxW, Math.max(...lines.map((l) => textW(l, size))) + size * 1.6), h = size * 1.75 + lh * (lines.length - 1), x = (L.W - w) / 2, y = L.H * 0.045;
    const pop = spr((t - 0.12) / 0.55), out = clamp((d - t) / 0.25, 0, 1), s = k.sub(`translate(${L.W / 2} ${y + h / 2}) scale(${Math.max(0.001, pop)}) translate(${-L.W / 2} ${-(y + h / 2)})`, { opacity: out });
    s.r(x + 5, y + 8, w, h, '#000', { rx: h / 2, opacity: 0.2 }); s.r(x, y, w, h, '#ffd84a', { rx: h / 2 }); s.r(x, y, w, h, 'none', { rx: h / 2, stroke: '#2b3440', 'stroke-width': 4 });
    lines.forEach((l, i) => s.t(L.W / 2, y + size * 1.16 + lh * i, l, size, '#1f2630'));
    return { x, y, w, h, scale: pop };
  };
  D.dynamic_comparison_chart = (k, sp, L, t, d, spr) => {
    const { x, y, w, h } = L.slot; card(k, x, y, w, h, 7);
    const [GW, GH] = sp.size || [560, 300], pad = L.S * 46, sc = Math.min((w - pad * 2) / GW, (h - pad * 3.2) / GH), ox = x + (w - GW * sc) / 2, oy = y + pad * 1.9;
    const g = k.sub(`translate(${ox} ${oy}) scale(${sc})`); for (const fd of sp.frame || []) g.p(fd, 'none', { stroke: '#2b3440', 'stroke-width': 3 });
    const n = sp.bars.length, shown = [];
    const q = Math.min(1, (d * 0.55) / (1.1 + (n - 1) * 0.28)); // a short shot: every bar is up by its middle
    sp.bars.forEach((b, i) => {
      const u = spr((t / q - 0.3 - i * 0.28) / 0.8), hh = b.h * Math.max(0, u), up = sp.trend === 'up';
      if (sp.style === 'line') g.c(b.x + b.w / 2, GH - (GH - b.y) * Math.max(0, u), 10, up ? '#2f8f5b' : '#d8452f');
      else g.r(b.x, GH - hh, b.w, hh, i === n - 1 ? (up ? '#2f8f5b' : '#d8452f') : '#e0a02c', { rx: 8 });
      const val = b.value * clamp(u, 0, 1); g.t(b.x + b.w / 2, GH - hh - 14, `${bnNum(Math.round(val), sp.bn)}${b.text.endsWith('%') ? '%' : ''}`, 34, '#1f2630');
      g.t(b.x + b.w / 2, GH + 38, b.label, 30, '#55606e'); shown.push(+(clamp(u, 0, 1)).toFixed(3));
    });
    if (sp.style === 'line' && sp.line) { const reveal = ease((t - 0.3) / (0.8 + n * 0.28)), p = g.p(sp.line, 'none', { stroke: sp.trend === 'up' ? '#2f8f5b' : '#d8452f', 'stroke-width': 7, 'stroke-linecap': 'round', pathLength: 1, 'stroke-dasharray': 1, 'stroke-dashoffset': 1 - reveal }); }
    const ar = spr((t - 0.4 - n * 0.28) / 0.6), ax = x + w - pad * 1.3, ay = y + pad * 1.05, up = sp.trend === 'up';
    const a = k.sub(`translate(${ax} ${ay}) scale(${Math.max(0.001, ar) * L.S}) rotate(${up ? 0 : 180})`); a.p('M0,-34 L28,4 L10,4 L10,34 L-10,34 L-10,4 L-28,4Z', up ? '#2f8f5b' : '#d8452f');
    if (sp.unit) k.t(x + pad * 1.6, y + pad * 1.15, sp.unit, L.S * 30, '#55606e');
    return { x, y, w, h, bars: shown, trend: sp.trend, arrow: +ar.toFixed(3) };
  };
  D.percentage_progress_ring = (k, sp, L, t, d, spr) => {
    const { x, y, w, h } = L.slot; card(k, x, y, w, h, 11);
    const cx = x + w / 2, cy = y + h * 0.45, r = Math.min(w, h) * 0.3, q = Math.min(1, (d * 0.6) / 1.65) /* a short shot: the count ends by 60 % of it */, u = ease((t / q - 0.25) / 1.4), v = sp.value * u, sw = r * 0.22;
    k.c(cx, cy, r, 'none', { stroke: '#e6dccb', 'stroke-width': sw });
    k.c(cx, cy, r, 'none', { stroke: v >= 50 ? '#2f8f5b' : '#e0a02c', 'stroke-width': sw, 'stroke-linecap': 'round', pathLength: 100, 'stroke-dasharray': `${Math.max(0.01, v)} 100`, transform: `rotate(-90 ${cx} ${cy})` });
    k.t(cx, cy + r * 0.2, `${bnNum(Math.round(v), sp.bn)}%`, r * 0.58, '#1f2630');
    if (sp.label) k.t(cx, y + h * 0.9, clip(sp.label, 22), L.S * 34, '#55606e');
    return { x, y, w, h, value: +v.toFixed(2), target: sp.value };
  };
  D.number_badge_pop = (k, sp, L, t, d, spr) => {
    const size = L.S * 62, w = Math.max(L.S * 240, textW(sp.text, size) + size), h = size * 1.9, x = L.slot.x + (L.slot.w - w) / 2, y = L.slot.y + L.S * 30;
    const pop = spr((t - 0.2) / 0.6), cx = x + w / 2, cy = y + h / 2, s = k.sub(`translate(${cx} ${cy}) scale(${Math.max(0.001, pop)}) rotate(${-6 * (1 - clamp(pop, 0, 1))})`);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; s.p(`M${Math.cos(a) * w * 0.52},${Math.sin(a) * h * 0.62} L${Math.cos(a + 0.13) * w * 0.62},${Math.sin(a + 0.13) * h * 0.78} L${Math.cos(a + 0.26) * w * 0.52},${Math.sin(a + 0.26) * h * 0.62}Z`, '#d8452f'); }
    s.r(-w / 2, -h / 2, w, h, '#d8452f', { rx: h / 2 }); s.r(-w / 2 + 6, -h / 2 + 6, w - 12, h - 12, 'none', { rx: h / 2, stroke: '#ffd84a', 'stroke-width': 4 }); s.t(0, size * 0.35, sp.text, size, '#ffffff');
    return { x, y, w, h, scale: +pop.toFixed(3) };
  };
  D.step_list_card = (k, sp, L, t, d, spr) => {
    const items = sp.items.slice(0, 6), n = items.length, { x, y, w } = L.slot, row = L.S * Math.min(96, (L.slot.h - 50) / Math.max(1, n)), h = row * n + L.S * 50; card(k, x, y, w, h, 13);
    const stagger = n > 1 ? Math.min(0.55, Math.max(0.2, (d - 0.8) / n)) : 0.5, seen = [], newest = sp.items.total ? n - 1 : -1;
    items.forEach((it, i) => {
      const at = sp.items.total ? (i < n - 1 ? -1 : 0.2) : 0.3 + i * stagger, u = spr((t - at) / 0.45), yy = y + L.S * 25 + row * i;
      if (u <= 0) return; const s = k.sub(`translate(${lerp(-40, 0, clamp(u, 0, 1))} 0)`, { opacity: clamp(u, 0, 1) });
      s.c(x + L.S * 50, yy + row / 2, row * 0.3, i === newest ? '#2f8f5b' : '#2f6fb0'); s.t(x + L.S * 50, yy + row / 2 + row * 0.13, bnNum(i + 1, sp.bn), row * 0.36, '#ffffff');
      s.t(x + L.S * 50 + row * 0.6, yy + row / 2 + row * 0.15, clip(it, 26), row * 0.46, '#1f2630', { 'text-anchor': 'start' });
      const ck = ease((t - at - 0.3) / 0.3); if (ck > 0) s.p(`M${x + w - L.S * 70},${yy + row / 2} l${12 * L.S * ck},${12 * L.S * ck} l${22 * L.S * ck},${-24 * L.S * ck}`, 'none', { stroke: '#2f8f5b', 'stroke-width': 7 * L.S, 'stroke-linecap': 'round' });
      seen.push(i);
    });
    return { x, y, w, h, items: seen.length };
  };
  function cloudPath(cx, cy, rx, ry, n = 9) { let d = ''; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU, b = ((i + 0.5) / n) * TAU, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry, bx = cx + Math.cos(b) * rx * 1.28, by = cy + Math.sin(b) * ry * 1.32; d += i ? ` Q${bx - Math.cos(b) * 0},${by} ${x},${y}` : `M${x},${y}`; void bx; } return d + 'Z'; }
  D.thought_cloud = (k, sp, L, t, d, spr) => {
    const hd = headOf(L.W0, L.actor); if (!hd) return null;
    const rx = Math.max(L.S * 150, textW(sp.text || '', L.S * 34) / 2 + L.S * 90), ry = L.S * 85, side = hd.x > L.W / 2 ? -1 : 1;
    let cx = clamp(hd.x + side * rx * 0.55, rx + 10, L.W - rx - 10), cy = hd.top - ry - hd.size * 0.55;
    const top = L.headlineBottom ? L.headlineBottom + 12 : 10;
    if (cy - ry * 1.3 < top) { // no room above the head (a full-body shot, a headline): the cloud floats beside the head instead
      cy = Math.max(top + ry * 1.3, hd.top + hd.size * 0.2); cx = clamp(hd.x + side * (rx + hd.size * 1.1), rx + 10, L.W - rx - 10);
      if (Math.abs(cx - hd.x) < rx + hd.size * 0.6) cx = clamp(hd.x - side * (rx + hd.size * 1.1), rx + 10, L.W - rx - 10);
    }
    const pop = spr((t - 0.25) / 0.6), bob = Math.sin(t * 2.2) * L.S * 4, s = k.sub(`translate(${cx} ${cy + bob}) scale(${Math.max(0.001, pop)}) translate(${-cx} ${-cy})`);
    for (const [f, r] of [[0.25, 0.07], [0.5, 0.11]]) s.c(lerp(hd.x, cx - side * rx * 0.5, f), lerp(hd.top - hd.size * 0.1, cy + ry, f), ry * r * 2.2, '#ffffff', { stroke: '#2b3440', 'stroke-width': 3 });
    s.p(cloudPath(cx, cy, rx, ry), '#ffffff', { stroke: '#2b3440', 'stroke-width': 4 });
    const iconW = sp.svg ? ry * 1.1 : 0;
    if (sp.svg && typeof DOMParser !== 'undefined') { const doc = new DOMParser().parseFromString(sp.svg, 'image/svg+xml'), src = doc.documentElement; if (src?.nodeName.toLowerCase() === 'svg') { const box = root.ZC.el('svg', { viewBox: src.getAttribute('viewBox') || '0 0 72 72', x: cx - rx * 0.62 - iconW / 2 + (sp.text ? 0 : rx * 0.62), y: cy - iconW / 2, width: iconW, height: iconW }, s.g); for (const c of [...src.childNodes]) { const imp = s.g.ownerDocument.importNode(c, true); if (imp.querySelectorAll) for (const e of [imp, ...imp.querySelectorAll('*')]) for (const a of [...(e.attributes || [])]) if (/^on/i.test(a.name) || a.name === 'id') e.removeAttribute(a.name); box.appendChild(imp); } } }
    if (sp.text) s.t(cx + iconW * 0.45, cy + L.S * 12, sp.text, L.S * 34, '#1f2630');
    const box = { x: cx - rx * 1.15, y: cy - ry * 1.3, w: rx * 2.3, h: ry * 2.6 }, hx0 = hd.x - hd.size * 0.5, hx1 = hd.x + hd.size * 0.5;
    const clear = box.x > hx1 || box.x + box.w < hx0 || box.y > hd.top + hd.size || box.y + box.h < hd.top; // never over the face
    return { ...box, head: hd, above: cy + ry < hd.top, clear };
  };
  D.comic_emotion_fx = (k, sp, L, t, d, spr) => {
    let hd = headOf(L.W0, L.actor); if (!hd) return null;
    let cx = hd.x; const cy = hd.top + hd.size * 0.5, R = hd.size * 0.9, on = ease((t - 0.1) / 0.3), em = sp.emotion;
    // steam, question marks and the bulb rise above the head; with no room there (a full-body shot, a headline) they sit beside it
    const ceiling = (L.headlineBottom || 0) + 8, need = R * 1.75, side = hd.x > L.W / 2 ? -1 : 1;
    let topY = hd.top; if (['angry', 'question', 'idea'].includes(em) && hd.top - need < ceiling) { topY = Math.max(ceiling + need, hd.top + R * 0.2); cx = clamp(hd.x + side * R * 1.9, R * 1.8, L.W - R * 1.8); }
    hd = { ...hd, top: topY };
    const Rs = Math.min(R, (cy - 6) / 1.68); // the burst tightens near the frame's top edge rather than leaving it
    if (em === 'shock') for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU, pulse = 1 + 0.12 * Math.sin(t * 18 + i); k.p(`M${cx + Math.cos(a) * Rs * 1.05},${cy + Math.sin(a) * Rs * 1.05} L${cx + Math.cos(a) * Rs * (1.05 + 0.55 * pulse * on)},${cy + Math.sin(a) * Rs * (1.05 + 0.55 * pulse * on)}`, 'none', { stroke: '#2b3440', 'stroke-width': Math.max(2, Rs * 0.06), 'stroke-linecap': 'round' }); }
    if (em === 'angry') for (let i = 0; i < 3; i++) { const ph = (t * 0.9 + i / 3) % 1, x = cx + (i - 1) * R * 0.6, y = hd.top - ph * R * 1.6; k.c(x + Math.sin(t * 3 + i) * R * 0.1, y, R * (0.18 + ph * 0.25), '#eef1f4', { opacity: (1 - ph * 0.7) * on, stroke: '#5f6873', 'stroke-width': 3.5 }); }
    if (em === 'sweat') for (let i = 0; i < 2; i++) { const ph = (t * 0.7 + i * 0.5) % 1, x = cx + R * (0.62 + i * 0.12), y = hd.top + hd.size * 0.15 + ph * hd.size * 0.6, s = R * 0.16; k.p(`M${x},${y - s * 1.6} Q${x + s},${y} ${x},${y + s * 0.6} Q${x - s},${y} ${x},${y - s * 1.6}Z`, '#7fc3ea', { opacity: on * (1 - ph * 0.5), stroke: '#3f86b8', 'stroke-width': 2 }); }
    if (em === 'question') for (let i = 0; i < 3; i++) { const u = spr((t - 0.15 - i * 0.25) / 0.5); if (u > 0) k.t(cx + (i - 1) * R * 0.75, hd.top - R * (0.45 + 0.25 * (i % 2)) + Math.sin(t * 4 + i) * 4, '?', R * (0.7 + 0.15 * (i % 2)) * Math.max(0, u), i % 2 ? '#7a4fa3' : '#2f6fb0', { stroke: '#fff', 'stroke-width': 2 }); }
    if (em === 'idea') { const glow = 0.6 + 0.4 * Math.sin(t * 6), bx = cx, by = hd.top - R * 0.9; k.c(bx, by, R * 0.75 * glow * on, '#ffe36e', { opacity: 0.35 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; k.p(`M${bx + Math.cos(a) * R * 0.5},${by + Math.sin(a) * R * 0.5} L${bx + Math.cos(a) * R * 0.8},${by + Math.sin(a) * R * 0.8}`, 'none', { stroke: '#f2b13c', 'stroke-width': R * 0.07, opacity: on, 'stroke-linecap': 'round' }); } k.c(bx, by, R * 0.36 * on, '#ffe36e', { stroke: '#c98f1d', 'stroke-width': 3 }); k.r(bx - R * 0.14, by + R * 0.3, R * 0.28 * on, R * 0.2 * on, '#8b95a3', { rx: 3 }); }
    const lifted = ['angry', 'question', 'idea'].includes(em), RR = em === 'shock' ? Rs : R, top = lifted ? hd.top - R * 1.7 : cy - RR * 1.67;
    if (em === 'sweat') return { x: cx + R * 0.45, y: hd.top - R * 0.1, w: R * 0.5, h: hd.size * 0.95, head: hd, emotion: em }; // the drops' own extent
    return { x: cx - RR * 1.7, y: top, w: RR * 3.4, h: lifted ? R * 1.9 : RR * 3.34, head: hd, emotion: em };
  };

  function mount(W, { headline = null, overlays = [] } = {}, { actors = {}, slot } = {}) {
    const el = (t, a, p) => root.ZC.el(t, a, p), outer = el('g', { 'data-fx': 1 }, W.svg), id = `${W.idp || 'f'}fx`;
    const list = [...(headline ? [{ kind: 'headline', text: headline }] : []), ...(overlays || [])].filter((o) => D[o.kind]);
    const springs = list.map((o) => springOf(o.spring || overlays.find((x) => x.spring)?.spring));
    return {
      element: outer, kinds: list.map((o) => o.kind),
      tick(t, d) {
        outer.replaceChildren(); const S = W.h / 1080, rec = {};
        // the data card goes on the side away from the people (their heads, through the camera)
        const heads = Object.values(actors).map((a) => headOf(W, a)).filter(Boolean), meanX = heads.length ? heads.reduce((n, h) => n + h.x, 0) / heads.length : W.w * 0.3;
        const sw = W.w * 0.36, sh = W.h * 0.5, margin = W.w * 0.04;
        let sx = slot === 'left' || (slot !== 'right' && meanX > W.w / 2) ? margin : W.w - sw - margin;
        let sy = W.h * 0.17, cardH = Math.min(sh, W.h * LANE - W.h * 0.2);
        const intersects = (x, y, w, h) => heads.some((hd) => x < hd.x + hd.size * 0.65 && x + w > hd.x - hd.size * 0.65 && y < hd.top + hd.size * 1.1 && y + h > hd.top - hd.size * 0.1);
        if (intersects(sx, sy, sw, cardH)) {
          // Mean head position is insufficient for a two/three-shot. Try gaps between
          // every face, then use the area below the faces and above the caption lane.
          const candidates = [margin, W.w - sw - margin, ...heads.flatMap((hd) => [hd.x + hd.size * 0.65 + margin, hd.x - hd.size * 0.65 - margin - sw])]
            .map((x) => clamp(x, margin, W.w - sw - margin));
          const clear = candidates.find((x) => !intersects(x, sy, sw, cardH));
          if (clear != null) sx = clear;
          else { sy = Math.max(sy, ...heads.map((hd) => hd.top + hd.size * 1.1 + W.h * 0.025)); cardH = Math.max(0, Math.min(sh, W.h * LANE - sy - W.h * 0.025)); sx = (W.w - sw) / 2; }
        }
        const L = { W: W.w, H: W.h, S, W0: W, slot: { x: sx, y: sy, w: sw, h: cardH }, headlineBottom: 0 };
        list.forEach((o, i) => {
          if (!['headline', 'thought_cloud', 'comic_emotion_fx'].includes(o.kind) && cardH < W.h * 0.12) { rec[o.kind] = { kind: o.kind, skipped: true, reason: 'No readable card area without covering faces or captions.' }; return; }
          const actor = actors[o.on] || Object.values(actors)[0] || null;
          const r = D[o.kind](K(el('g', { 'data-fx-kind': o.kind }, outer)), o, { ...L, actor }, t, d, springs[i]);
          if (o.kind === 'headline' && r) L.headlineBottom = r.y + r.h;
          rec[o.kind] = r ? { ...r, kind: o.kind } : { kind: o.kind, skipped: true };
        });
        (root.__fx ||= {})[id] = { t, list: rec, heads, frame: { w: W.w, h: W.h, lane: W.h * LANE } };
      },
    };
  }
  root.ZFX = { mount, kinds: Object.keys(D), springOf, toScreen };
})(typeof window !== 'undefined' ? window : globalThis);
