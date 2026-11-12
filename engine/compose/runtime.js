// Glossy runtime: ONE paused, seekable GSAP timeline from the page + #hf-plan. Timing lives in data-start/data-duration;
// motion lives here: the speaker / cut-out / box layout of each scene, the screen window and its zooms, the scene graphics
// (each isolated), their transitions, the captions and the customer's own fades, filters and frame effects.
(function () {
  var __run = function () {
  var P = JSON.parse(document.getElementById("hf-plan").textContent);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var tl = gsap.timeline({ paused: true });
  var IR = { immediateRender: false };

  // ---------- the speaker: each scene's layout (clip, scale + position, layer order, cut-out, box), 0.45 s between ----------
  var spk = $("#spk-clip"), mv = $("#spk-move"), dr = $("#spk-drift"), cut = $("#cut-clip"), cmv = $("#cut-move"), cdr = $("#cut-drift"), box = $("#spk-box"), vig = $("#torso-vig");
  if (spk) {
    var prev = null;
    P.scenes.forEach(function (sc) {
      var L = sc.spk; if (!L) return;
      var t = sc.s, first = !prev, dur = first ? 0 : 0.45, at = Math.max(0, t - 0.02);
      var m = { x: L.m.x, y: L.m.y, scale: L.m.k, transformOrigin: "0 0" };
      if (first) {
        tl.set(spk, { clipPath: L.clip, zIndex: L.z, opacity: L.o }, 0); tl.set(mv, m, 0);
        if (cut) { tl.set(cut, { clipPath: L.cut.clip, zIndex: L.cut.z, opacity: L.cut.on ? 1 : 0 }, 0); tl.set(cmv, m, 0); }
      } else {
        tl.set(spk, { zIndex: L.z }, at);
        tl.to(spk, { clipPath: L.clip, opacity: L.o, duration: dur, ease: "power3.inOut" }, at);
        tl.to(mv, Object.assign({ duration: dur, ease: "power3.inOut" }, m), at);
        if (cut) {
          tl.set(cut, { zIndex: L.cut.z }, at);
          tl.to(cut, { clipPath: L.cut.clip, opacity: L.cut.on ? 1 : 0, duration: L.cut.on && prev.cut.on ? dur : 0.2, ease: "power3.inOut" }, at);
          tl.to(cmv, Object.assign({ duration: dur, ease: "power3.inOut" }, m), at);
        }
      }
      if (cut) tl.set(cut, { filter: L.cut.rim ? "drop-shadow(0 -2px 20px var(--zk-a)) drop-shadow(0 0 2px rgba(255,255,255,.6))" : "none" }, t);
      // the pop-out box (or the pip badge frame) around the speaker
      if (box) {
        if (L.box) { tl.set(box, { left: L.box.x, top: L.box.y, width: L.box.w, height: L.box.h, borderRadius: P.rad, zIndex: sc.mode === "masked-pip-stage" ? 26 : 30 }, at); tl.fromTo(box, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none", immediateRender: false }, t + 0.1); }
        else tl.set(box, { opacity: 0 }, at);
      }
      if (vig) tl.to(vig, { opacity: L.vig ? 1 : 0, duration: 0.3, ease: "none" }, t);
      // the continuous push-in (4–7%) of every speaker scene
      var d = sc.e - sc.s;
      tl.fromTo(dr, { scale: 1 }, { scale: sc.mode === "speaker" ? 1.06 : 1.04, duration: d, ease: "none", immediateRender: first }, sc.s);
      if (cdr) tl.fromTo(cdr, { scale: 1 }, { scale: sc.mode === "speaker" ? 1.06 : 1.04, duration: d, ease: "none", immediateRender: first }, sc.s);
      // punch-ins on the strongest words: a snap to 1.14 on the face, held through the phrase, eased back before the next
      tl.set(spk, { scale: 1, transformOrigin: sc.punch ? sc.punch.o : "50% 40%" }, at);
      if (sc.punch) sc.punch.at.forEach(function (t0, k) {
        var nxt = k + 1 < sc.punch.at.length ? sc.punch.at[k + 1] : sc.e, off = Math.max(t0 + 0.4, Math.min(t0 + 1.8, nxt - 0.3));
        tl.fromTo(spk, { scale: 1 }, { scale: 1.14, duration: 0.14, ease: "power3.out", immediateRender: false }, t0 - 0.04);
        tl.to(spk, { scale: 1, duration: 0.3, ease: "power2.inOut" }, off);
      });
      prev = L;
    });
  }

  // ---------- the screen recording: window or phone, zooms to the clicked element, dim + highlight box ----------
  var scr = $("#scr"), inner = $("#scr-inner"), hl = $("#scr-hl"), tap = $("#scr-tap");
  if (scr) {
    var last = null, lastCx = null;
    P.scenes.forEach(function (sc) {
      var t = sc.s;
      if (!sc.scr) { tl.set(scr, { opacity: 0 }, t); return; }
      var r = sc.scr.rect, phone = sc.scr.kind === "phone";
      var to = { left: r.x, top: r.y, width: r.w, height: r.h, borderRadius: sc.scr.radius, opacity: 1, "--chrome": sc.scr.chrome + "px" };
      if (!last) tl.set(scr, to, t); else tl.to(scr, Object.assign({ duration: 0.45, ease: "power3.inOut" }, to), Math.max(0, t - 0.02));
      tl.set(scr, { className: "scr " + (phone ? "phone" : "window") }, t);
      // the screen inside: as wide as the window, or (fill: a wide screen in a tall window) as tall as it, panned to the action
      var vw = r.w, vh = r.h - sc.scr.chrome, fill = !!sc.scr.fill, iw = fill ? vh * sc.scr.ar : vw, ih = vh;
      var panX = function (cx, z) { return Math.max(vw - iw * z, Math.min(0, vw / 2 - cx * z)); }, panY = function (cy, z) { return Math.max(vh - ih * z, Math.min(0, vh / 2 - cy * z)); };
      // the scene's own focus (the plan's guess) only when nothing was aimed at in it: the aimed spot is the thing being said
      var evs = P.events.filter(function (ev) { return ev.from >= sc.s - 0.05 && ev.from < sc.e - 0.3; });
      if (!evs.length && sc.focus) evs = [{ from: sc.s + 0.4, to: sc.e - 0.3, focus: sc.focus }];
      var cx0 = evs.length ? (evs[0].focus[0] + evs[0].focus[2] / 2) / 100 * iw : (lastCx != null ? lastCx : iw / 2);
      // filled: it rests a little closer (1.35×, centred on the last thing talked about) so a desktop screen is readable on a phone
      var z0 = fill ? 1.35 : 1, cy0 = evs.length ? (evs[0].focus[1] + evs[0].focus[3] / 2) / 100 * ih : ih / 2;
      tl.set(inner, { width: iw, height: ih, scale: z0, x: fill ? panX(cx0, z0) : 0, y: fill ? panY(cy0, z0) : 0, transformOrigin: "0 0" }, t);
      last = sc;
      // zoom events inside this scene: to the focus rect (1.5–2.2×; filled: 1–2.4× on top of it), the rest dimmed, a neon box;
      // held to the event's end, and straight on to the next one when it follows within 0.7 s (no zoom out and back in)
      evs.forEach(function (ev, i) {
        var f = ev.focus, fx = f[0] / 100 * iw, fy = f[1] / 100 * ih, fw = Math.max(8, f[2] / 100 * iw), fh = Math.max(8, f[3] / 100 * ih);
        if (phone) { // a tap on the phone: a pulsing ring at the tap point, no zoom
          tl.set(tap, { left: r.x + fx + fw / 2, top: r.y + sc.scr.chrome + fy + fh / 2, opacity: 0, scale: 0.4 }, Math.max(0, ev.from - 0.01));
          tl.to(tap, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(2)" }, ev.from).to(tap, { opacity: 0, scale: 1.6, duration: 0.4, ease: "power2.in" }, Math.min(ev.to, ev.from + 0.9));
          return;
        }
        // filled: the marked area fits the window (a small element up to 2.6×), never below the resting 1.35× (readable on a phone);
        // a big area is shown whole rather than cropped around its middle (which can be empty space)
        // a wide area (a row of buttons, a player, a text box) is read along instead: at least 1.9× and glided left to right over the line
        var z = fill ? Math.max(z0, Math.min(2.6, vh / (fh * 1.1), Math.max(1.9, vw / (fw * 1.1)))) : Math.max(1.5, Math.min(2.2, Math.min(vw / (fw * 1.8), vh / (fh * 1.8))));
        var cx = fx + fw / 2, cy = fy + fh / 2, wide = fill && fw * z > vw * 0.95;
        if (wide) cx = fx + vw / (2 * z) - 10 / z;
        lastCx = cx;
        tl.to(inner, { scale: z, x: panX(cx, z), y: panY(cy, z), duration: 0.55, ease: "power2.inOut" }, ev.from);
        if (wide) { cx = fx + fw - vw / (2 * z) + 10 / z; lastCx = cx; tl.to(inner, { x: panX(cx, z), duration: Math.max(0.6, Math.min(sc.e, ev.to) - ev.from - 0.75), ease: "sine.inOut" }, ev.from + 0.6); }
        // the box and the dimmed rest: only on a plain window (a filled one zooms straight to the thing; nothing drawn on it)
        if (!fill) {
          tl.set(hl, { left: fx, top: fy, width: fw, height: fh }, ev.from);
          tl.fromTo(hl, { opacity: 0, scale: 1.15 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power3.out", immediateRender: false }, ev.from + 0.35);
        }
        var back = Math.min(sc.e - 0.05, ev.to), nx = evs[i + 1];
        if (!fill) tl.to(hl, { opacity: 0, duration: 0.2, ease: "none" }, back - 0.2);
        if (!(nx && nx.from - back < 0.7)) tl.to(inner, { scale: z0, x: fill ? panX(cx, z0) : 0, y: fill ? panY(cy, z0) : 0, duration: 0.5, ease: "power2.inOut" }, back);
      });
    });
  }

  // ---------- scene graphics, each isolated; transitions in, the anchor hold or a short fade out ----------
  var meta = {}; P.scenes.forEach(function (b) { meta[b.k] = b; });
  $$(".zc").forEach(function (sec) {
    var k = parseInt(sec.getAttribute("data-k"), 10), b = meta[k] || {}, s = b.s, d = b.e - b.s, fn = (window.__zc || {})[k];
    try { if (fn) fn(tl, sec, s, d, b.words || [], window.ZK, function (x) { return s + x; }); }
    catch (err) { console.error("scene " + k + ": " + err.message); sec.style.display = "none"; (window.__sceneErrors = window.__sceneErrors || []).push({ k: k, row: b.row, message: err.message }); }
  });
  $$(".zc, .zm").forEach(function (sec) {
    var k = parseInt(sec.getAttribute("data-k"), 10), b = meta[k] || {}, s = b.s, e = b.e, T = b.transition;
    if (s > 0.05 && T && T !== "cut") {
      var go = function (from, to) { tl.fromTo(sec, from, Object.assign({}, IR, to), s); };
      if (T === "blur") go({ opacity: 0, filter: "blur(18px)", scale: 1.03 }, { opacity: 1, filter: "blur(0px)", scale: 1, duration: 0.42, ease: "power2.out" });
      else if (T === "light-leak") { var lk = document.createElement("div"); lk.className = "leak"; sec.appendChild(lk); tl.set(lk, { opacity: 0 }, 0); tl.fromTo(lk, { opacity: 0, xPercent: -30 }, { opacity: 1, xPercent: 0, duration: 0.18, ease: "power1.out", immediateRender: false }, Math.max(0, s - 0.06)).to(lk, { opacity: 0, xPercent: 30, duration: 0.42, ease: "power1.in" }, s + 0.12); go({ opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none" }); }
      else go({ scale: 1.5, opacity: 0, filter: "blur(16px)" }, { scale: 1, opacity: 1, filter: "blur(0px)", duration: 0.42, ease: "expo.out" }); // zoom-blur
    }
    if (sec.classList.contains("zm")) {
      var md = $(".zm-media", sec); if (md) tl.fromTo(md, { scale: 1.02 }, { scale: 1.1, duration: Math.max(0.5, e - s), ease: "none", immediateRender: false }, s);
      var tx = $(".zm-text, .zm-card, .zm-say", sec); if (tx) tl.fromTo(tx, { opacity: 0, y: 46 }, { opacity: 1, y: 0, duration: 0.5, ease: "expo.out", immediateRender: false }, s + 0.12);
    }
    if (e < P.D - 0.06 && b.exit !== false) tl.to(sec, { opacity: 0, duration: 0.14, ease: "power1.in" }, e - 0.14);
  });

  // ---------- captions: the group pops in, the spoken word lights up ----------
  $$(".cap").forEach(function (c) {
    var s = parseFloat(c.getAttribute("data-start")) || 0, ci = $(".cap-inner", c);
    tl.fromTo(ci, { y: 26, opacity: 0, scale: 0.92 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: "back.out(1.8)", immediateRender: false }, s);
    $$(".w", c).forEach(function (w) {
      var t0 = parseFloat(w.getAttribute("data-t0")), t1 = parseFloat(w.getAttribute("data-t1"));
      tl.set(w, { className: "w on" }, Math.max(s, t0)); tl.set(w, { className: "w said" }, Math.max(t1, t0 + 0.14));
    });
  });

  // ---------- the customer's fades, colour filters and frame effects (Advanced editing) ----------
  P.scenes.forEach(function (b) {
    var el = document.getElementById("b" + b.k); if (!el) return;
    if (b.fadeIn) tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: Math.min(3, b.fadeIn), ease: "none", immediateRender: false }, b.s);
    if (b.fadeOut) tl.to(el, { opacity: 0, duration: Math.min(3, b.fadeOut), ease: "none" }, Math.max(b.s, b.e - b.fadeOut));
  });
  var rootEl = document.getElementById("root");
  P.scenes.forEach(function (b) { if (b.filter) { tl.set(rootEl, { filter: b.filter }, b.s); tl.set(rootEl, { filter: "none" }, b.e); } });
  var FXS = { vignette: "background:radial-gradient(ellipse 75% 70% at 50% 45%,transparent 50%,rgba(0,0,0,.7) 100%)", letterbox: "background:linear-gradient(#000 0 11%,transparent 11% 89%,#000 89%)",
    leak: "background:radial-gradient(50% 60% at 15% 20%,rgba(255,150,60,.7),transparent 70%),radial-gradient(40% 50% at 90% 80%,rgba(255,60,120,.5),transparent 70%);mix-blend-mode:screen",
    scanlines: "background:repeating-linear-gradient(0deg,rgba(0,0,0,.28) 0 1px,transparent 1px 3px)" };
  (P.fx || []).forEach(function (f) {
    if (!FXS[f.id]) return; var o = document.createElement("div"); o.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:60;" + FXS[f.id]; rootEl.appendChild(o);
    tl.set(o, { opacity: 0 }, 0); tl.set(o, { opacity: f.a == null ? 1 : f.a }, f.s); tl.set(o, { opacity: 0 }, f.e);
  });

  tl.set({}, {}, P.D);
  window.__timelines = window.__timelines || {};
  window.__timelines["main"] = tl;
  };
  if (document.fonts && document.fonts.forEach) { var ff = []; document.fonts.forEach(function (f) { ff.push(f.load().catch(function () {})); }); Promise.all(ff).then(__run, __run); } else __run();
})();
