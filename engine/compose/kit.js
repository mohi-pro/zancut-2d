// Zancut graphic kit (window.ZK): the helpers every scene graphic may call. Seek-safe: everything is a tween on the paused
// GSAP timeline `tl`, at timeline seconds; no timers, no random numbers. Icons come from icons.js (Lucide + brand logos).
(function (g) {
  var OUT = "power3.out";
  var BN = "০১২৩৪৫৬৭৮৯";
  function el(tag, cls, parent, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; if (parent) parent.appendChild(e); return e; }
  function segs(t) { try { return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(String(t)), function (x) { return x.segment; }); } catch (e) { return Array.from(String(t)); } }
  var ZK = { el: el };

  // sizes: u = 1% of the frame's short side (also set as --u on root). Call it first in every scene.
  ZK.unit = function (root) {
    var W = root.offsetWidth || 1080, H = root.offsetHeight || 1920, u = Math.min(W, H) / 100;
    root.style.setProperty("--u", u + "px");
    return { W: W, H: H, u: u, tall: H > W * 1.15, wide: W > H * 1.15, square: !(H > W * 1.15) && !(W > H * 1.15) };
  };
  // safe text: escapes HTML; *word* → accent, **word** → accent box
  ZK.rich = function (t) {
    return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; })
      .replace(/\*\*(.+?)\*\*/g, '<b class="zk-box">$1</b>').replace(/\*(.+?)\*/g, '<em class="zk-hl">$1</em>');
  };
  // Bangla (or any non-Latin) text? Then: Bangla font, line-height ≥ 1.35, letter-spacing 0, solid ink.
  ZK.isBangla = function (t) { return /[ঀ-৿]/.test(String(t || "")); };
  ZK.text = function (e, t) { e.innerHTML = ZK.rich(t); if (ZK.isBangla(t)) e.classList.add("zk-bn"); return e; };
  // shrink a text until it fits its box (o.w / o.h in px), never below o.min (default 4u)
  ZK.fit = function (e, o) {
    o = o || {}; var u = o.u || 10, min = o.min == null ? u * 4 : o.min, f = parseFloat(getComputedStyle(e).fontSize) || u * 4, i = 0;
    while (i++ < 40 && f > min && ((o.h && e.offsetHeight > o.h) || (o.w && e.scrollWidth > o.w + 1))) { f = Math.max(min, f * 0.94); e.style.fontSize = f + "px"; }
    return f;
  };
  // motion presets: "pop" snappy scale · "glide" smooth slide (dir up|down|left|right) · "snap" sharp · "fade"
  ZK.motion = function (tl, e, name, t, o) {
    o = o || {}; var u = o.u || 10, dir = o.dir || "up", dx = dir === "left" ? u * 6 : dir === "right" ? -u * 6 : 0, dy = dir === "up" ? u * 6 : dir === "down" ? -u * 6 : 0;
    var M = { pop: [{ opacity: 0, scale: 0.6 }, 0.34, "back.out(1.8)"], glide: [{ opacity: 0, x: dx, y: dy }, 0.6, "expo.out"], snap: [{ opacity: 0, scale: 1.06 }, 0.14, "power4.out"], fade: [{ opacity: 0 }, 0.4, "power1.out"] }[name] || [{ opacity: 0, x: dx, y: dy }, 0.6, "expo.out"];
    if (o.out) { tl.to(e, Object.assign({}, M[0], { duration: Math.min(0.3, M[1] * 0.6), ease: "power2.in" }), t); return e; }
    tl.fromTo(e, M[0], { opacity: 1, scale: 1, x: 0, y: 0, duration: M[1], ease: M[2], immediateRender: true }, t); return e;
  };
  ZK.pop = function (tl, e, t, o) { o = o || {}; tl.fromTo(e, { opacity: 0, scale: o.from || 0.6 }, { opacity: 1, scale: 1, duration: o.dur || 0.3, ease: "back.out(1.8)", immediateRender: true }, t); return e; };
  // words appearing one by one, each at its own second (o.at = [t0, t1, …] — the spoken times) or o.t + i * o.step
  ZK.words = function (tl, e, o) {
    var ws = String(o.text != null ? o.text : e.textContent).split(/\s+/).filter(Boolean); e.innerHTML = "";
    if (ZK.isBangla(o.text)) e.classList.add("zk-bn");
    ws.forEach(function (w, i) {
      var s = el("span", "zk-w", e, null); s.innerHTML = ZK.rich(w) + (i < ws.length - 1 ? " " : "");
      var t = o.at && o.at[i] != null ? o.at[i] : (o.t || 0) + i * (o.step || 0.12);
      tl.fromTo(s, { opacity: 0, y: o.rise == null ? 24 : o.rise, filter: "blur(" + (o.blur == null ? 8 : o.blur) + "px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: o.dur || 0.24, ease: OUT, immediateRender: true }, t);
    });
    return e;
  };
  // typing, whole letters only (safe for Bangla), as frame steps so seeking shows it
  ZK.type = function (tl, e, o) {
    var gs = segs(o.text), dur = o.dur || Math.max(0.3, gs.length * 0.04), t0 = o.t || 0, caret = o.caret === false ? "" : "|";
    e.textContent = ""; tl.set(e, { textContent: "" }, 0);
    for (var i = 1; i <= gs.length; i++) tl.set(e, { textContent: gs.slice(0, i).join("") + (i < gs.length ? caret : "") }, t0 + dur * i / gs.length);
    return e;
  };
  // a rolling number that locks on its word: {from, to, t, dur, dec, prefix, suffix, bn}. Written as frame steps (tl.set),
  // so every renderer that seeks the timeline shows the right number (onUpdate callbacks are skipped while seeking).
  ZK.count = function (tl, e, o) {
    var from = o.from || 0, to = o.to, dec = o.dec || 0, dur = o.dur || 0.9, t0 = o.t || 0, n = Math.max(2, Math.min(60, Math.round(dur * 30)));
    var ease = gsap.parseEase(o.ease || "power2.out");
    var fmt = function (v) { var s = Number(v).toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec }); if (o.bn) s = s.replace(/[0-9]/g, function (d) { return BN[d]; }); return (o.prefix || "") + s + (o.suffix || ""); };
    e.style.fontVariantNumeric = "tabular-nums"; e.textContent = fmt(from);
    tl.set(e, { textContent: fmt(from) }, 0);
    for (var i = 1; i <= n; i++) tl.set(e, { textContent: fmt(from + (to - from) * ease(i / n)) }, t0 + dur * i / n);
    return e;
  };
  // draw every <path>/<line>/<polyline>/<circle> of an SVG with stroke-dashoffset
  ZK.draw = function (tl, svg, t, dur) {
    [].slice.call(svg.querySelectorAll("path,line,polyline,circle,rect")).forEach(function (p, i) {
      var L = 0; try { L = p.getTotalLength(); } catch (e) { L = 600; }
      p.style.strokeDasharray = L; p.style.strokeDashoffset = L;
      tl.to(p, { strokeDashoffset: 0, duration: dur || 0.6, ease: "power2.inOut" }, (t || 0) + i * 0.06);
    });
    return svg;
  };
  // an icon as inline SVG: "clock", a word ("time"), a brand ("logo:notion"), or any Iconify icon ("tabler:cash-register",
  // "logos:openai-icon": fetched into the job when the scene was saved, ZK_LIB). o = {stroke, color}
  ZK.icon = function (name, o) {
    o = o || {}; var I = g.ZK_ICONS || { line: {}, alias: {}, brand: {} }, n = String(name || "").toLowerCase().trim(), c = o.color || "currentColor";
    if (n.indexOf(":") > 0 && n.indexOf("logo:") !== 0) {
      var x = ((g.ZK_LIB || {}).icons || {})[n];
      if (x) return '<svg viewBox="0 0 ' + x.w + " " + x.h + '" style="width:100%;height:100%;display:block;overflow:visible;color:' + c + '">' + x.b + "</svg>";
      n = n.split(":")[1]; // not fetched: our own icon of that name (or a sparkle)
    }
    var lg = n.indexOf("logo:") === 0, k = (lg ? n.slice(5) : n).replace(/[^a-z0-9]+/g, lg ? "" : "-").replace(/^-|-$/g, "");
    var svg = function (body, filled) { return '<svg viewBox="0 0 24 24" style="width:100%;height:100%;display:block;overflow:visible" ' + (filled ? 'fill="' + c + '"' : 'fill="none" stroke="' + c + '" stroke-width="' + (o.stroke || 1.75) + '" stroke-linecap="round" stroke-linejoin="round"') + ">" + body + "</svg>"; };
    var b = I.brand[k] || I.brand[k.replace(/-/g, "")];
    if (lg && b) return svg('<path d="' + b + '"/>', true);
    var lb = lg && ((g.ZK_LIB || {}).icons || {})[n]; // a brand our set lacks, fetched when the scene was saved
    if (lb) return '<svg viewBox="0 0 ' + lb.w + " " + lb.h + '" style="width:100%;height:100%;display:block;overflow:visible;color:' + c + '">' + lb.b + "</svg>";
    if (I.line[k]) return svg(I.line[k]);
    if (I.alias[k]) return svg(I.line[I.alias[k]]);
    if (b) return svg('<path d="' + b + '"/>', true);
    return I.line.sparkles ? svg(I.line.sparkles) : "";
  };
  ZK.hasIcon = function (name) { var I = g.ZK_ICONS, k = String(name || "").toLowerCase().replace(/^logo:/, "").replace(/[^a-z0-9]+/g, "-"); return !!(I && (I.line[k] || I.alias[k] || I.brand[k.replace(/-/g, "")])); };

  // an emoji sticker: ZK.emoji("🚀", {style: "3d" | "flat"}) → an <img> of the file fetched when the scene was saved (ZK_LIB);
  // the other style when one was missing; the plain emoji character when neither was (it still shows). Fills its box.
  ZK.emoji = function (ch, o) {
    o = o || {}; var E = (g.ZK_LIB || {}).emoji || {}, st = o.style === "flat" ? "flat" : "3d";
    var f = E[ch + "|" + st] || E[ch + "|" + (st === "3d" ? "flat" : "3d")];
    if (f) return '<img src="assets/lib/' + f + '" alt="" style="width:100%;height:100%;object-fit:contain;display:block">';
    return '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block;overflow:visible"><text x="50" y="84" font-size="86" text-anchor="middle">' + ch + "</text></svg>";
  };

  // an ingredient (emoji, icon, person, photo: el holds it, in the page) dressed for the design system:
  //   "mono"   matte grey 3D, like a clay or stone sculpture (Minimal's 90 %)
  //   "accent" the same, in the video's accent colour (Minimal's one hero object)
  //   "slice"  grey with one wedge in full colour, pulled out a little (Minimal's poster trick); o.wedge = clip-path points
  //   "crisp"  full colour, a touch clearer, a soft card shadow (Standard)
  //   "glass"  full colour, clear: a thin white edge and a soft depth shadow, no coloured glow (Glossy)
  //   "neon"   full colour lit by a white and accent rim light (older Glossy videos)
  ZK.look = function (el, kind, o) {
    o = o || {}; if (!el) return el;
    var css = getComputedStyle(el), U = "var(--u)";
    var hex = String(css.getPropertyValue("--zk-a") || "#0866FF").trim(), m = hex.match(/^#?([0-9a-f]{6})$/i) || ["", "0866FF"];
    var rgb = [0, 2, 4].map(function (i) { return parseInt(m[1].slice(i, i + 2), 16) / 255; });
    var shadow = function (y, b, c) { return "drop-shadow(0 calc(" + U + "*" + y + ") calc(" + U + "*" + b + ") " + c + ")"; };
    var mono = "grayscale(1) contrast(1.18) brightness(1.04) " + shadow(1.6, 2.6, "rgba(11,11,15,.16)");
    if (kind === "mono") el.style.filter = mono;
    else if (kind === "accent") {
      // a duotone: the object's shadows a deep shade of the accent, its light parts the accent lifted toward white (so the 3D
      // shape still reads); an SVG filter made once per colour
      var id = "zk-duo-" + m[1].toLowerCase(), doc = el.ownerDocument;
      if (!doc.getElementById(id)) {
        var lo = rgb.map(function (v) { return v * 0.28; }), hi = rgb.map(function (v) { return v + (1 - v) * 0.55; });
        var row = function (k) { var d = (hi[k] - lo[k]) * 1.1; return (d * 0.2126).toFixed(4) + " " + (d * 0.7152).toFixed(4) + " " + (d * 0.0722).toFixed(4) + " 0 " + (lo[k] - 0.05).toFixed(4); };
        var s = doc.createElement("div"); s.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
        s.innerHTML = '<svg width="0" height="0"><filter id="' + id + '" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="' + row(0) + " " + row(1) + " " + row(2) + ' 0 0 0 1 0"/></filter></svg>';
        doc.body.appendChild(s);
      }
      el.style.filter = "url(#" + id + ") contrast(1.08) " + shadow(1.8, 3, "rgba(" + rgb.map(function (v) { return Math.round(v * 255); }).join(",") + ",.24)");
    } else if (kind === "slice") {
      var base = el.firstElementChild; if (!base) return el;
      el.style.position = "relative"; base.style.filter = mono;
      var cut = base.cloneNode(true);
      cut.style.cssText += ";position:absolute;inset:0;filter:contrast(1.1) saturate(1.2) " + shadow(0.5, 1.2, "rgba(0,0,0,.18)") + ";clip-path:polygon(" + (o.wedge || "50% 50%, 100% 0%, 100% 65%") + ");transform:translate(calc(" + U + "*.6), calc(" + U + "*-.6))";
      el.appendChild(cut); return cut; // the coloured wedge: animate it (pull it out on the key word)
    } else if (kind === "crisp") el.style.filter = "contrast(1.06) saturate(1.08) " + shadow(1.1, 2.2, "rgba(15,23,42,.18)");
    else if (kind === "glass") el.style.filter = "contrast(1.06) saturate(1.06) drop-shadow(0 0 calc(" + U + "*.15) rgba(255,255,255,.35)) " + shadow(1.2, 2.6, "rgba(0,0,0,.38)");
    else if (kind === "neon") el.style.filter = "contrast(1.22) saturate(1.15) drop-shadow(0 0 calc(" + U + "*.4) rgba(255,255,255,.55)) drop-shadow(0 0 calc(" + U + "*2.2) var(--zk-a))";
    return el;
  };

  // a hand-drawn person, head and shoulders (Open Peeps, built in: peeps.js, on a page whose scenes use it). o = {face, hair,
  // body, beard, glasses, skin, hairColor, top, outline}: part names from the find_people tool. Unknown names use a default.
  // Returns SVG text that fills its box (taller than wide, about 5:6).
  ZK.peep = function (o) {
    o = o || {}; var P = g.ZK_PEEPS; if (!P) return "";
    var has = function (set, k) { return k && set[k] ? k : null; };
    var body = has(P.bodies, o.body) || "Tee", hair = o.hair === "none" ? null : has(P.heads, o.hair) || "ShortTwo",
      face = has(P.faces, o.face) || "Smile", beard = has(P.beards, o.beard), acc = has(P.accessories, o.glasses);
    var col = { skinColor: o.skin, hairColor: o.hairColor, beardColor: o.hairColor, outlineColor: o.outline, topColor: o.top, blazerColor: o.top, jacketColor: o.top };
    var fill = function (s) { return s.replace(/\{(\w+)\}/g, function (_, k) { return col[k] || P.defaults[k] || "#000"; }); };
    var part = function (id, shift, inner) { return '<g transform="' + P.place[id] + '">' + (shift ? '<g transform="' + shift + '">' + inner + "</g>" : inner) + "</g>"; };
    var head = (hair ? part("Hair", P.shift.heads[hair], fill(P.heads[hair])) : "") + part("Face", P.shift.faces[face], fill(P.faces[face]))
      + (beard ? part("Beard", P.shift.beards[beard], fill(P.beards[beard])) : "") + (acc ? part("Accessories", P.shift.accessories[acc], fill(P.accessories[acc])) : "");
    var lift = P.headLift[body];
    return '<svg viewBox="' + P.viewBox + '" style="width:100%;height:100%;display:block;overflow:visible" xmlns="http://www.w3.org/2000/svg">'
      + part("Body", null, fill(P.bodies[body])) + (lift ? '<g transform="' + lift + '">' + head + "</g>" : head) + "</svg>";
  };

  // the speaker's face in this scene (frame pixels), or null: {x, y, w, h, head: {…}}. The engine writes it per scene.
  ZK.face = function (root) {
    var own = root.closest ? root.closest("[data-face-here]") : null;
    if (!own) return null;
    var f = own.getAttribute("data-face-here").split(",").map(Number);
    return { x: f[0], y: f[1], w: f[2], h: f[3], head: { x: f[0] - f[2] * 0.2, y: f[1] - f[3] * 0.45, w: f[2] * 1.4, h: f[3] * 1.7 } };
  };
  // the free zones of this scene's layout (frame pixels): ZK.zones(root).top / .card / .header / .device …
  ZK.zones = function (root) {
    var own = root.closest ? root.closest("[data-zones]") : null;
    try { return own ? JSON.parse(own.getAttribute("data-zones")) : {}; } catch (e) { return {}; }
  };
  // place el at the first spot clear of the face: spots [{x, y, ax, ay}] as fractions of the frame
  ZK.place = function (root, e, spots, o) {
    o = o || {}; var W = root.offsetWidth, H = root.offsetHeight, fz = o.face === false ? null : ZK.face(root), pad = Math.min(W, H) * 0.02;
    var ew = e.offsetWidth, eh = e.offsetHeight, best = null, bestHit = Infinity;
    var over = function (x, y, r) { if (!r) return 0; var ix = Math.max(0, Math.min(x + ew, r.x + r.w + pad) - Math.max(x, r.x - pad)), iy = Math.max(0, Math.min(y + eh, r.y + r.h + pad) - Math.max(y, r.y - pad)); return ix * iy; };
    for (var i = 0; i < spots.length; i++) {
      var s = spots[i], x = Math.max(0, Math.min(W - ew, s.x * W - (s.ax || 0) * ew)), y = Math.max(0, Math.min(H - eh, s.y * H - (s.ay || 0) * eh));
      var hit = fz ? over(x, y, fz) * 1000 + over(x, y, fz.head) : 0;
      if (hit === 0) { best = { x: x, y: y, i: i }; break; }
      if (hit < bestHit) { bestHit = hit; best = { x: x, y: y, i: i }; }
    }
    e.style.left = best.x + "px"; e.style.top = best.y + "px";
    return best.i;
  };

  // A Glossy background stage as the scene's first element: ZK.stage(tl, root, {kind, t, d}). kinds: stage-radial-tint,
  // stage-spotlight-cone, stage-perspective-floor, stage-eclipse-horizon, stage-elevated-wash. Returns the ground element.
  // Its grid follows --orb-x / --orb-y on root (tween them with your hero). Drifts slowly for the whole scene.
  // A ground that carries on: the page marks the section data-carry="N" when this scene joins the one before on its anchor (N = how
  // many scenes into the run) and data-from-x / data-from-y (the anchor's place, %). Then nothing restarts: the stage begins where the
  // scene before left it (the drift runs back and forth, so each scene starts at the end of the last one) and never enters again.
  ZK.stage = function (tl, root, o) {
    o = o || {}; var U = ZK.unit(root), t = o.t || 0, d = o.d || 3, kind = o.kind || "stage-radial-tint";
    var carry = parseInt(root.getAttribute("data-carry") || "0", 10) || 0, back = carry % 2 === 1;
    var swap = function (a, b) { return back ? [b, a] : [a, b]; }; // [from, to]; odd scenes of a run drift the way back
    if (!root.style.getPropertyValue("--orb-x")) {
      var fx = parseFloat(root.getAttribute("data-from-x")), fy = parseFloat(root.getAttribute("data-from-y"));
      root.style.setProperty("--orb-x", (carry > 0 && isFinite(fx) ? U.W * fx / 100 : U.W * 0.5) + "px"); root.style.setProperty("--orb-y", (carry > 0 && isFinite(fy) ? U.H * fy / 100 : U.H * 0.42) + "px");
    }
    var g0 = el("div", "zk-stage " + kind, null, null);
    root.insertBefore(g0, root.firstChild);
    if (kind === "stage-elevated-wash") { el("div", "zk-wash", g0, null); return g0; }
    var grid = el("div", "zk-grid", g0, null);
    var a = el("div", "zk-orb a", g0, null), b = el("div", "zk-orb b", g0, null);
    var oa = swap({ x: -U.u * 6, y: 0 }, { x: U.u * 8, y: U.u * 5 }), ob = swap({ x: U.u * 6, y: 0 }, { x: -U.u * 7, y: -U.u * 6 });
    tl.fromTo(a, oa[0], Object.assign({ duration: d, ease: "sine.inOut", immediateRender: true }, oa[1]), t);
    tl.fromTo(b, ob[0], Object.assign({ duration: d, ease: "sine.inOut", immediateRender: true }, ob[1]), t);
    if (kind === "stage-spotlight-cone") { var c = el("div", "zk-cone", g0, null), cr = swap({ opacity: 0.55, rotation: -3 }, { opacity: 0.85, rotation: 3 }); tl.fromTo(c, cr[0], Object.assign({ duration: d, ease: "sine.inOut", immediateRender: true }, cr[1]), t); }
    if (kind === "stage-perspective-floor") { var fw = el("div", "zk-floorwrap", g0, null), f = el("div", "zk-floor", fw, null), step = Math.round(U.u * 12), y0 = carry * step; el("div", "zk-horizon", g0, null); tl.fromTo(f, { backgroundPosition: "0px " + y0 + "px" }, { backgroundPosition: "0px " + (y0 + step) + "px", duration: d, ease: "none", immediateRender: true }, t); }
    if (kind === "stage-eclipse-horizon") { var h = el("div", "zk-eclipse", g0, null); if (carry > 0) tl.fromTo(h, { yPercent: 0 }, { yPercent: 0, duration: 0.01, immediateRender: true }, t); else tl.fromTo(h, { yPercent: 12 }, { yPercent: 0, duration: Math.min(1.2, d), ease: "expo.out", immediateRender: true }, t); }
    var gr = swap(0.7, 1); tl.fromTo(grid, { opacity: gr[0] }, { opacity: gr[1], duration: d, ease: "none", immediateRender: true }, t);
    return g0;
  };
  // the near-lens accent of the density contract: one soft blurred light drifting across (6.00x plane)
  ZK.bokeh = function (tl, root, o) {
    o = o || {}; var U = ZK.unit(root), b = el("div", "zk-bokeh", root, null);
    b.style.left = (o.x == null ? 0.78 : o.x) * U.W + "px"; b.style.top = (o.y == null ? 0.2 : o.y) * U.H + "px";
    tl.fromTo(b, { x: 0, y: 0, opacity: 0 }, { x: -U.u * 14, y: U.u * 6, opacity: o.opacity || 0.5, duration: o.d || 3, ease: "sine.inOut", immediateRender: true }, o.t || 0);
    return b;
  };
  // the continuous 4–7% push-in and ±1.5% breathing idle of rule 3/4 on any element
  ZK.push = function (tl, e, t, d, k) { tl.fromTo(e, { scale: 1 }, { scale: 1 + (k || 0.05), duration: d, ease: "none", immediateRender: true }, t); return e; };
  ZK.breathe = function (tl, e, t, d) { if (d <= 0.3) return e; var n = Math.max(1, Math.floor(d / 1.6)); tl.to(e, { scale: 1.015, duration: d / (n * 2), ease: "sine.inOut", yoyo: true, repeat: n * 2 - 1 }, t); return e; };

  g.ZK = ZK;
})(window);
