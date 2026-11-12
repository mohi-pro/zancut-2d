// ZD: designed screens and beat graphics for 2D films, as parts: a scene gives the words, the kit gives the look and the motion.
// Everything is HTML over the world, on the scene's GSAP timeline, seek-safe (nothing runs outside the timeline).
// A part never holds story text of its own: every word on it comes from the caller.
//   const o = ZD.layer(root)                       a full-frame layer (call ZK.unit(root) first); several can stack
//   ZD.pill(o, { text, icon, emoji, num, count, tone, x, y })       chip at x, y (% of the frame); returns { el, text(node) }
//   ZD.laptop(o) / ZD.phone(o)                     a device filling the frame: .screen is where a screen part goes
//   ZD.chat(screen, { title, input })              .say(tl, { side, text, at, typed, tone }) · .attach(tl, text, at) · .rule(tl, text, at, { n, mark })
//   ZD.doc(o, { title, sub, lines, x, y, w, h })   a sheet: .mark / .ring / .tick / .print per line index
//   ZD.list(o, { kicker, title, rows, x, y, w })   a card of rows: .row(tl, i, at) · .tick(tl, i, at)
//   ZD.window(screen, { title, logo, n })          an app window on a screen, stacked in the order made · ZD.dock(screen, logos)
//   ZD.poster(into, { title, sub, seed })          a coloured event poster from its words
//   ZD.match(o, { title, left, right, rows })      two columns joined line by line: .join(tl, i, at)
//   ZD.card(o, { title, sub, emoji, x, y, w })     a big result card
//   ZD.stamp(o, { text, x, y, tone }) · ZD.questions(o, { n, x, y }) · ZD.bulb(o, { x, y }) · ZD.thought(o, { x, y })
//   ZD.formPage(screen, …) · ZD.postBody(into, …) · ZD.tail(el) · ZD.folder(screen, …) · ZD.topThings(o, …) · ZD.monitor(o) · ZD.scroll(o, …) · ZD.sticker(o, …) · ZD.chatBox(o, …) · ZD.tray(o)
//   ZD.calendar(o, { text, x, y }) · ZD.drop(o, { x, y }) · ZD.cursor(screen, tl, …) · ZD.fly(screen, tl, …) · ZD.thumb(into, { title, lines })
//   ZD.slash(target) · ZD.ringOn(target) · ZD.ground(o, { deep, mid })
//   ZD.in(tl, el, at, how) (pop slam up down left right fade) · ZD.out(tl, el, at) · ZD.type(tl, node, text, at, dur)
(function (root) {
  const ZD = (root.ZD = {});
  const CSS = `
.zd-o{position:absolute;inset:0;pointer-events:none;--zd-ink:var(--zk-ink,#14213a);--zd-a:var(--zk-a,#0a92cd);--zd-b:var(--zk-b,#7c4dff);--zd-neg:var(--zk-neg,#e70d85);--zd-pos:var(--zk-pos,#0fa985)}
.zd-at{position:absolute;transform:translate(-50%,-50%)}
.zd-t{font-family:var(--zk-bangla,"Hind Siliguri"),var(--zk-display,"Inter"),sans-serif;line-height:1.35}
.zd-pill{display:inline-flex;align-items:center;gap:calc(var(--u)*1.8);padding:calc(var(--u)*1.7) calc(var(--u)*4.2);border-radius:calc(var(--u)*7);background:#fff;color:var(--zd-ink);font-weight:800;font-size:calc(var(--u)*6);white-space:nowrap;box-shadow:0 0 0 calc(var(--u)*.45) var(--zd-a),0 calc(var(--u)*1.2) calc(var(--u)*5) rgba(10,146,205,.34)}
.zd-pill.big{font-size:calc(var(--u)*6.8);padding:calc(var(--u)*2.2) calc(var(--u)*5.4)}
.zd-pill.gold{box-shadow:0 0 0 calc(var(--u)*.5) #e8a91d,0 calc(var(--u)*1.2) calc(var(--u)*5) rgba(232,169,29,.5);background:#fffbe9}
.zd-pill.ink{background:linear-gradient(135deg,var(--zd-b),var(--zk-c,#111ed4));color:#fff;box-shadow:0 calc(var(--u)*1.2) calc(var(--u)*5) rgba(124,77,255,.5)}
.zd-pill.bad{background:var(--zd-neg);color:#fff;box-shadow:0 calc(var(--u)*1.2) calc(var(--u)*5) rgba(231,13,133,.45);padding:calc(var(--u)*1.2) calc(var(--u)*2.6)}
.zd-pill.pos{box-shadow:0 0 0 calc(var(--u)*.45) var(--zd-pos),0 calc(var(--u)*1.2) calc(var(--u)*5) rgba(15,169,133,.34)}
.zd-ic{width:1.15em;height:1.15em;display:inline-flex;color:var(--zd-b)}.zd-ic svg,.zd-ic img{width:100%;height:100%}
.zd-num{width:1.5em;height:1.5em;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;background:var(--zd-b);color:#fff;font-size:.8em}
.zd-dev{position:absolute;left:0;right:0;top:0;bottom:0}
.zd-lap-screen{position:absolute;left:3.5%;right:3.5%;top:7.5%;height:53%;background:#141c30;border-radius:calc(var(--u)*3);padding:calc(var(--u)*1.5);box-shadow:0 0 calc(var(--u)*7) rgba(10,146,205,.45)}
.zd-screen{position:relative;width:100%;height:100%;overflow:hidden;border-radius:calc(var(--u)*1.7);background:linear-gradient(180deg,#fff,#e9e2f6)}
.zd-lap-base{position:absolute;left:0;right:0;top:60%;height:17%;background:linear-gradient(180deg,#cfd6de,#a9b1bf);clip-path:polygon(5% 0,95% 0,100% 100%,0 100%)}
.zd-keys{position:absolute;left:12%;right:12%;top:7%;height:52%;background:#3a4153;border-radius:calc(var(--u)*1);background-image:repeating-linear-gradient(90deg,transparent 0 calc(var(--u)*3),rgba(255,255,255,.3) calc(var(--u)*3) calc(var(--u)*3.3)),repeating-linear-gradient(180deg,transparent 0 calc(var(--u)*2.3),rgba(255,255,255,.3) calc(var(--u)*2.3) calc(var(--u)*2.6))}
.zd-pad{position:absolute;left:38%;right:38%;top:66%;height:27%;border-radius:calc(var(--u)*1);background:rgba(255,255,255,.3)}
.zd-chat{position:absolute;inset:0;display:flex;flex-direction:column;background:linear-gradient(180deg,#fff,#e6def5)}
.zd-chat-top{flex:none;display:flex;align-items:center;gap:calc(var(--u)*1.6);padding:calc(var(--u)*2.2) calc(var(--u)*3.4);background:#fff;font-weight:800;font-size:calc(var(--u)*3.6);color:var(--zd-ink);box-shadow:0 1px 0 rgba(20,33,58,.1)}
.zd-chat-top b{width:calc(var(--u)*2);height:calc(var(--u)*2);border-radius:50%;background:var(--zd-a)}
.zd-chat-body{position:relative;flex:1;display:flex;flex-direction:column;gap:calc(var(--u)*2.4);padding:calc(var(--u)*2.6) calc(var(--u)*3);overflow:hidden}
.zd-chat-in{flex:none;margin:0 calc(var(--u)*3) calc(var(--u)*2.6);padding:calc(var(--u)*1.8) calc(var(--u)*3);border-radius:calc(var(--u)*6);background:#fff;color:#8b93a6;font-size:calc(var(--u)*3);box-shadow:0 calc(var(--u)*.5) calc(var(--u)*2) rgba(20,33,58,.14)}
.zd-msg{max-width:84%;padding:calc(var(--u)*2.2) calc(var(--u)*3.2);border-radius:calc(var(--u)*2.6);font-size:calc(var(--u)*4.2);font-weight:600;line-height:1.4}
.zd-msg.me{align-self:flex-end;background:var(--zd-a);color:#fff}
.zd-msg.ai{align-self:flex-start;background:#fff;color:var(--zd-ink);box-shadow:0 0 0 calc(var(--u)*.3) rgba(20,33,58,.8)}
.zd-msg.big{max-width:100%;font-size:calc(var(--u)*3.9);background:linear-gradient(135deg,var(--zd-a),var(--zk-c,#111ed4))}
.zd-msg .hot{border-radius:calc(var(--u)*.6);padding:0 calc(var(--u)*.6)}
.zd-attach{align-self:flex-end;display:flex;gap:calc(var(--u)*1.2)}
.zd-rule{align-self:flex-start;font-size:calc(var(--u)*4.6)}
.zd-sheet{position:absolute;background:#fff;border-radius:calc(var(--u)*1);padding:calc(var(--u)*3.4);box-sizing:border-box;box-shadow:0 calc(var(--u)*1.6) calc(var(--u)*5) rgba(40,30,20,.3);color:var(--zd-ink)}
.zd-doc-t{font-family:var(--zk-display,"Inter"),var(--zk-bangla,"Hind Siliguri");font-weight:800;font-size:calc(var(--u)*4.6);line-height:1.2}
.zd-doc-s{font-size:calc(var(--u)*2.5);color:#7b8496;margin-bottom:calc(var(--u)*1.4)}
.zd-doc-rule{height:calc(var(--u)*.4);background:var(--zd-a);margin-bottom:calc(var(--u)*1.2)}
.zd-ln{position:relative;display:flex;align-items:center;justify-content:space-between;gap:calc(var(--u)*1.5);min-height:calc(var(--u)*4);padding:calc(var(--u)*.8) calc(var(--u)*1);font-size:calc(var(--u)*3.3);font-weight:700;border-radius:calc(var(--u)*.8)}
.zd-ln.bar:before{content:"";flex:1;height:calc(var(--u)*1.1);border-radius:calc(var(--u)*.6);background:#d9deea;max-width:var(--w,100%)}
.zd-ln .zd-tick,.zd-row .zd-tick{flex:none;width:calc(var(--u)*4);height:calc(var(--u)*4);border-radius:50%;background:var(--zd-pos);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:calc(var(--u)*2.8);opacity:0}
.zd-warn{flex:none;width:calc(var(--u)*4);height:calc(var(--u)*4);border-radius:50%;background:var(--zk-neg,#e70d85);color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:calc(var(--u)*3);font-weight:900;opacity:0}
.zd-mark{position:absolute;inset:0;border-radius:calc(var(--u)*.8);transform-origin:left center;transform:scaleX(0);z-index:-1}
.zd-ring{position:absolute;left:-6%;right:-6%;top:-34%;bottom:-34%;border-radius:50%;border:calc(var(--u)*.7) solid var(--zd-a);opacity:0;box-shadow:0 0 calc(var(--u)*2) var(--zd-a)}
.zd-card{position:absolute;box-sizing:border-box;padding:calc(var(--u)*3.6);border-radius:calc(var(--u)*3.2);background:#fff;color:var(--zd-ink);box-shadow:0 0 0 calc(var(--u)*.45) rgba(20,33,58,.85),0 calc(var(--u)*1.6) calc(var(--u)*6) rgba(30,60,140,.24)}
.zd-kick{font-size:calc(var(--u)*3);font-weight:800;color:var(--zd-b)}
.zd-card-t{font-size:calc(var(--u)*5);font-weight:800;line-height:1.3}
.zd-row{display:flex;align-items:center;gap:calc(var(--u)*2);padding:calc(var(--u)*1.5) calc(var(--u)*1.8);margin-top:calc(var(--u)*1.4);border-radius:calc(var(--u)*1.8);background:#f2f5fa;font-size:calc(var(--u)*3.9);font-weight:700;line-height:1.3}
.zd-row>span.tx{flex:1}
.zd-win{position:absolute;border-radius:calc(var(--u)*1.4);overflow:hidden;background:#fff;box-shadow:0 calc(var(--u)*1) calc(var(--u)*4) rgba(20,33,58,.32),0 0 0 calc(var(--u)*.2) rgba(20,33,58,.2)}
.zd-win-bar{display:flex;align-items:center;gap:calc(var(--u)*1.2);padding:calc(var(--u)*1) calc(var(--u)*1.8);background:#eef2f8;font-weight:800;font-size:calc(var(--u)*2.8);color:var(--zd-ink);white-space:nowrap;overflow:hidden}
.zd-win-bar.tinted{background:#1b74e4;color:#fff}
.zd-win-logo{width:calc(var(--u)*3.2);height:calc(var(--u)*3.2);display:inline-flex}.zd-win-logo svg{width:100%;height:100%}
.zd-dock{position:absolute;left:50%;bottom:calc(var(--u)*2);transform:translateX(-50%);display:flex;gap:calc(var(--u)*1.6);padding:calc(var(--u)*1) calc(var(--u)*1.8);border-radius:calc(var(--u)*1.6);background:rgba(255,255,255,.8);box-shadow:0 calc(var(--u)*.5) calc(var(--u)*2) rgba(20,33,58,.2);color:#1b74e4}.zd-dock .zd-win-logo{width:calc(var(--u)*5);height:calc(var(--u)*5)}
.zd-cur{position:absolute;width:calc(var(--u)*5.2);height:calc(var(--u)*5.2);z-index:9}.zd-cur svg{width:100%;height:100%;display:block}
.zd-thumb{flex:none;width:calc(var(--u)*14);padding:calc(var(--u)*1.2);border-radius:calc(var(--u)*.8);background:#f5f7fb;box-shadow:0 0 0 calc(var(--u)*.2) rgba(20,33,58,.2);font-size:calc(var(--u)*2.2)}.zd-thumb b{display:block;line-height:1.2}.zd-thumb i{display:block;height:calc(var(--u)*.7);margin-top:calc(var(--u)*.7);background:#b9c3d6;border-radius:calc(var(--u)*.4)}
.zd-poster{position:relative;overflow:hidden;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;color:#fff;font-weight:800;padding:calc(var(--u)*2);box-sizing:border-box}
.zd-poster i{position:absolute;border-radius:50%}
.zd-poster b{position:relative;font-size:calc(var(--u)*8);line-height:1.2}.zd-poster small{position:relative;font-size:calc(var(--u)*2.8);margin-top:calc(var(--u)*1)}
.zd-stamp{padding:calc(var(--u)*2.4) calc(var(--u)*5);border-radius:calc(var(--u)*2.2);border:calc(var(--u)*1) solid var(--zd-b);background:rgba(255,255,255,.93);color:var(--zk-c,#111ed4);font-weight:800;font-size:calc(var(--u)*8.4);white-space:nowrap;box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*6) rgba(10,20,80,.45)}
.zd-stamp.small{font-size:calc(var(--u)*3.6);padding:calc(var(--u)*.8) calc(var(--u)*2);color:var(--zd-pos);border-color:var(--zd-pos);border-width:calc(var(--u)*.5)}
.zd-q{position:absolute;width:calc(var(--u)*15);height:calc(var(--u)*15);border-radius:50%;background:radial-gradient(circle at 35% 30%,#a98bff,var(--zd-b));color:#fff;display:flex;align-items:center;justify-content:center;font:900 calc(var(--u)*10)/1 var(--zk-display,"Inter");box-shadow:0 calc(var(--u)*.8) calc(var(--u)*3) rgba(124,77,255,.5)}
.zd-bulb svg{width:calc(var(--u)*22);height:calc(var(--u)*24);display:block}
.zd-thought{width:calc(var(--u)*24);height:calc(var(--u)*17);border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 calc(var(--u)*.4) var(--zd-a)}
.zd-thought:before,.zd-thought:after{content:"";position:absolute;border-radius:50%;background:#fff;box-shadow:0 0 0 calc(var(--u)*.3) var(--zd-a)}
.zd-thought:before{width:calc(var(--u)*4);height:calc(var(--u)*4);left:12%;bottom:-16%}.zd-thought:after{width:calc(var(--u)*2.4);height:calc(var(--u)*2.4);left:4%;bottom:-34%}
.zd-load{width:calc(var(--u)*8);height:calc(var(--u)*8);border-radius:50%;border:calc(var(--u)*1.3) solid #dfe3ee;border-top-color:var(--zd-b)}
.zd-cal{min-width:calc(var(--u)*24);width:max-content;padding:0;border-radius:calc(var(--u)*3);overflow:hidden;background:#fff;box-shadow:0 0 0 calc(var(--u)*.4) var(--zd-a),0 calc(var(--u)*1.4) calc(var(--u)*5) rgba(10,146,205,.35);text-align:center}
.zd-cal:before{content:"";display:block;height:calc(var(--u)*5);background:linear-gradient(90deg,var(--zd-a),var(--zd-b))}
.zd-cal b{display:block;padding-left:calc(var(--u)*3)!important;padding-right:calc(var(--u)*3)!important;color:var(--zd-b);font-size:calc(var(--u)*8);padding:calc(var(--u)*1) 0 calc(var(--u)*2);line-height:1.3}
.zd-drop svg{width:calc(var(--u)*5);height:calc(var(--u)*7);display:block}
.zd-match{position:absolute;box-sizing:border-box;padding:calc(var(--u)*2.6);border-radius:calc(var(--u)*2.8);background:#27344c;box-shadow:0 calc(var(--u)*1.6) calc(var(--u)*6) rgba(30,60,140,.3)}
.zd-match-bar{display:flex;align-items:center;gap:calc(var(--u)*1);color:#fff;font-weight:700;font-size:calc(var(--u)*2.8);padding:0 calc(var(--u)*.8) calc(var(--u)*1.8)}
.zd-match-bar i{width:calc(var(--u)*1.6);height:calc(var(--u)*1.6);border-radius:50%;background:#ff6b6b}.zd-match-bar i+i{background:#ffd166}.zd-match-bar i+i+i{background:#06d6a0}
.zd-match-in{display:grid;grid-template-columns:1fr calc(var(--u)*12) 1fr;background:#fff;border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*2)}
.zd-match-h{font-weight:800;font-size:calc(var(--u)*3.8);padding-bottom:calc(var(--u)*1.4);border-top:calc(var(--u)*.5) solid var(--zd-a);padding-top:calc(var(--u)*1)}
.zd-match-c{font-weight:700;font-size:calc(var(--u)*3);background:#e9f7f1;border-radius:calc(var(--u)*1.2);padding:calc(var(--u)*1.3) calc(var(--u)*1.5);margin-bottom:calc(var(--u)*1.6);line-height:1.3}
.zd-match-j{position:relative;margin-bottom:calc(var(--u)*1.6)}
.zd-match-j i{position:absolute;left:0;right:0;top:50%;height:calc(var(--u)*.5);background:var(--zd-a);transform-origin:left center;transform:scaleX(0)}
.zd-match-j b{position:absolute;left:50%;top:50%;margin:calc(var(--u)*-2.6);width:calc(var(--u)*5.2);height:calc(var(--u)*5.2);border-radius:50%;background:var(--zd-pos);color:#fff;display:flex;align-items:center;justify-content:center;font-size:calc(var(--u)*3.4);opacity:0}
.zd-sl{position:absolute;left:-4%;right:-4%;top:48%;height:calc(var(--u)*1.2);border-radius:calc(var(--u)*1);background:var(--zd-neg);transform-origin:left center;transform:rotate(-7deg) scaleX(0)}
.zd-gr{position:absolute;inset:0;background:linear-gradient(180deg,var(--zk-bg-mid,#dfd7f4),var(--zk-bg-deep,#eff7fb))}
.zd-gr i{position:absolute;border-radius:50%;opacity:.55}
`;
  const mk = (tag, cls, p, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (p) p.appendChild(e); if (html != null) e.innerHTML = html; return e; };
  const txt = (e, t) => { if (root.ZK) root.ZK.text(e, t); else e.textContent = t; e.classList.add("zd-t"); return e; };
  const at = (o, x, y) => { const w = mk("div", "zd-at", o); w.style.left = `${x}%`; w.style.top = `${y}%`; return w; };
  const icon = (name, o) => { try { return root.ZK.icon(name, o); } catch { return ""; } };
  const emoji = (ch) => { try { return root.ZK.emoji(ch, { style: "3d" }); } catch { return ""; } };
  const rngOf = (seed) => { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; };

  ZD.layer = function (rootEl, { z = 5 } = {}) {
    if (!document.getElementById("zd-css")) { const s = mk("style", null, document.head); s.id = "zd-css"; s.textContent = CSS; }
    const o = mk("div", "zd-o", rootEl); o.style.zIndex = z; return o;
  };
  ZD.show = (o, on) => { o.style.visibility = on ? "visible" : "hidden"; };
  // ---------- motion, all on the scene's timeline ----------
  const HOW = {
    pop: [{ opacity: 0, scale: 0.7, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.35, ease: "back.out(2)" }],
    slam: [{ opacity: 0, scale: 2.4 }, { opacity: 1, scale: 1, duration: 0.2, ease: "power4.in" }],
    up: [{ opacity: 0, y: 120 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }],
    down: [{ opacity: 0, y: -140 }, { opacity: 1, y: 0, duration: 0.42, ease: "power3.out" }],
    left: [{ opacity: 0, x: 90 }, { opacity: 1, x: 0, duration: 0.38, ease: "power3.out" }],
    right: [{ opacity: 0, x: -90 }, { opacity: 1, x: 0, duration: 0.38, ease: "power3.out" }],
    fade: [{ opacity: 0 }, { opacity: 1, duration: 0.3, ease: "none" }],
  };
  ZD.in = (tl, el, t, how = "pop") => { const [a, b] = HOW[how] || HOW.pop; tl.fromTo(el, a, { ...b, immediateRender: true }, t); return el; };
  ZD.out = (tl, el, t, d = 0.2) => { tl.to(el, { opacity: 0, duration: d, ease: "none" }, t); return el; };
  ZD.type = (tl, node, text, t, d = 1) => { // letter by letter, by what a reader sees as a letter (Bangla signs stay on their letter)
    const seg = typeof Intl.Segmenter === "function" ? [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text)].map((x) => x.segment) : [...text];
    const o = { get n() { return 0; }, set n(v) { node.textContent = seg.slice(0, Math.round(v)).join(""); } };
    node.textContent = ""; tl.fromTo(o, { n: 0 }, { n: seg.length, duration: d, ease: "none", immediateRender: false }, t);
  };
  // ---------- chips ----------
  ZD.pill = function (o, { text = "", icon: ic, emoji: em, logos, num, count = 1, tone = "", x = 50, y = 12, big = false } = {}) {
    const w = at(o, x, y), el = mk("div", `zd-pill zd-t ${tone}${big ? " big" : ""}`, w);
    if (num != null) txt(mk("span", "zd-num", el), String(num));
    for (const l of logos || []) mk("span", "zd-ic", el, icon(l));
    if (ic) for (let i = 0; i < count; i++) mk("span", "zd-ic", el, icon(ic));
    if (em) mk("span", "zd-ic", el, emoji(em));
    const s = mk("span", "", el); if (text) txt(s, text);
    return { el, wrap: w, text: s };
  };
  // ---------- devices ----------
  ZD.laptop = function (o, { tall = false } = {}) {
    const d = mk("div", "zd-dev", o), scr = mk("div", "zd-lap-screen", d); if (tall) { scr.style.top = "3%"; scr.style.height = "74%"; }
    const screen = mk("div", "zd-screen", scr), base = mk("div", "zd-lap-base", d); if (tall) base.style.top = "77%";
    mk("div", "zd-keys", base); mk("div", "zd-pad", base); return { el: d, screen };
  };
  // a screen with no keyboard, glowing in a dim room
  ZD.monitor = function (o) { const d = mk("div", "zd-dev", o), dim = mk("div", "", d); dim.style.cssText = "position:absolute;inset:0;background:rgba(8,14,34,.55)"; const scr = mk("div", "zd-lap-screen", d); scr.style.cssText += ";top:12%;height:60%;left:6%;right:6%;box-shadow:0 0 calc(var(--u)*9) rgba(60,190,255,.65)"; const screen = mk("div", "zd-screen", scr); return { el: d, screen }; };
  // a long page running past fast on a screen: its words, again and again
  ZD.scroll = function (o, { lines = [], title = "", tl, t, d = 2 }) { const dev = ZD.monitor(o), page = mk("div", "", dev.screen), inner = mk("div", "", page); page.style.cssText = "position:absolute;inset:0;overflow:hidden;background:linear-gradient(180deg,#e9f6ff,#5cc0ec);padding:calc(var(--u)*4)"; for (let r = 0; r < 6; r++) { if (title) txt(mk("div", "zd-doc-t", inner), title).style.color = "var(--zk-c,#111ed4)"; for (const l of lines) { txt(mk("div", "", inner), `★ ${l}`).style.cssText += ";font-weight:800;font-size:calc(var(--u)*4);margin:calc(var(--u)*2) 0"; const b = mk("div", "", inner); b.style.cssText = "height:calc(var(--u)*1.2);width:70%;background:rgba(20,33,58,.16);border-radius:9px;margin-bottom:calc(var(--u)*2)"; } } tl.fromTo(inner, { yPercent: 0 }, { yPercent: -55, duration: d, ease: "none", immediateRender: false }, t); return dev; };
  // a big picture with no chip around it
  ZD.sticker = function (o, { emoji: em, x = 80, y = 50, size = 24 } = {}) { const w = at(o, x, y), e = mk("div", "", w, emoji(em)); e.style.width = e.style.height = `calc(var(--u)*${size})`; return { el: e, wrap: w }; };
  // a small chat box with a line in it
  ZD.chatBox = function (o, { label = "", emoji: em, chip, x = 70, y = 44, w = 48 } = {}) { const e = mk("div", "zd-card", o); e.style.left = `${x - w / 2}%`; e.style.top = `${y}%`; e.style.width = `${w}%`; e.style.padding = "calc(var(--u)*2.4)"; const top = mk("div", "", e); top.style.cssText = "display:flex;align-items:center;gap:calc(var(--u)*1.6);font-weight:800;font-size:calc(var(--u)*3.8)"; if (em) { const i = mk("span", "zd-ic", top, emoji(em)); i.style.fontSize = "calc(var(--u)*5)"; } txt(mk("span", "", top), label); const box = mk("div", "", e); box.style.cssText = "margin-top:calc(var(--u)*1.6);padding:calc(var(--u)*1.4);border-radius:calc(var(--u)*1.4);background:#f2f5fa;font-size:calc(var(--u)*3);font-weight:700"; if (chip) txt(mk("span", "", box), chip); return { el: e }; };
  // a document window: a title bar, a page, a caret
  ZD.docWindow = function (o, { title = "", x = 50, y = 5, w = 62 } = {}) { const e = mk("div", "zd-card", o); e.style.cssText += `;left:${x - w / 2}%;top:${y}%;width:${w}%;padding:0;overflow:hidden;background:rgba(255,255,255,.96)`; const bar = mk("div", "", e); bar.style.cssText = "display:flex;align-items:center;gap:calc(var(--u)*1.1);padding:calc(var(--u)*1.5) calc(var(--u)*2.6);background:#e3f3fb;font-weight:800;font-size:calc(var(--u)*3)"; for (let i = 0; i < 3; i++) { const d = mk("i", "", bar); d.style.cssText = "width:calc(var(--u)*1.5);height:calc(var(--u)*1.5);border-radius:50%;background:var(--zd-a)"; } txt(mk("span", "", bar), title); const body = mk("div", "", e); body.style.cssText = "position:relative;height:calc(var(--u)*17)"; const c = mk("i", "", body); c.style.cssText = "position:absolute;right:16%;top:26%;width:calc(var(--u)*.6);height:calc(var(--u)*8);background:var(--zd-ink)"; return { el: e, body }; };
  // an application page: a heading, lines, a drop box for a file
  ZD.formPage = function (screen, { title = "", lines = [], tl, t = 0 } = {}) { const e = mk("div", "", screen); e.style.cssText = "position:absolute;left:6%;right:6%;top:4%"; txt(mk("div", "zd-card-t", e), title); lines.slice(0, 1).forEach((l) => txt(mk("div", "zd-kick", e), l)); const box = mk("div", "", e); box.style.cssText = "margin-top:calc(var(--u)*2);height:calc(var(--u)*7);border:calc(var(--u)*.4) dashed var(--zd-a);border-radius:calc(var(--u)*1.6);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--zd-a);font-size:calc(var(--u)*3)"; if (lines[1]) txt(mk("span", "", box), lines[1]); if (tl) ZD.in(tl, e, t, "fade"); return e; };
  // a social post: who, a line, the picture
  ZD.postBody = function (into, { name = "", text = "", poster = "" } = {}) { const e = mk("div", "", into); e.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;background:#fff"; const top = mk("div", "", e); top.style.cssText = "display:flex;align-items:center;gap:calc(var(--u)*1.4);padding:calc(var(--u)*1.4) calc(var(--u)*1.8);font-weight:800;font-size:calc(var(--u)*2.8)"; const a = mk("i", "", top); a.style.cssText = "width:calc(var(--u)*4.4);height:calc(var(--u)*4.4);border-radius:50%;background:#1b74e4"; txt(mk("span", "", top), name); const l = txt(mk("div", "", e), text); l.style.cssText += ";padding:0 calc(var(--u)*1.8) calc(var(--u)*1);font-weight:700;font-size:calc(var(--u)*2.8)"; const box = mk("div", "", e); box.style.cssText = "flex:1;position:relative"; ZD.poster(box, { title: poster, seed: 0 }); return e; };
  // the little point under a speech bubble
  ZD.tail = function (el) { const t = mk("i", "", el); t.style.cssText = "position:absolute;left:18%;bottom:calc(var(--u)*-2.4);width:calc(var(--u)*5);height:calc(var(--u)*5);background:#fff;transform:rotate(45deg);box-shadow:calc(var(--u)*.3) calc(var(--u)*.3) 0 var(--zd-a);z-index:-1"; return t; };
  // a printer's tray at the top of a table seen from above
  ZD.tray = function (o) { const d = mk("div", "", o); d.style.cssText = "position:absolute;left:8%;right:8%;top:-1%;height:calc(var(--u)*11.5);border-radius:0 0 calc(var(--u)*2.4) calc(var(--u)*2.4);background:linear-gradient(180deg,#f5f0ff,#d9d2ea);box-shadow:0 calc(var(--u)*1.4) calc(var(--u)*4) rgba(40,30,20,.3);z-index:3"; const s = mk("i", "", d); s.style.cssText = "position:absolute;left:6%;right:6%;bottom:calc(var(--u)*1.2);height:calc(var(--u)*.8);background:#23283a;border-radius:9px"; return d; };
  // ---------- a chat on a screen ----------
  ZD.chat = function (screen, { title = "", input = "" } = {}) {
    const c = mk("div", "zd-chat", screen), top = mk("div", "zd-chat-top zd-t", c); mk("b", "", top); txt(mk("span", "", top), title);
    const body = mk("div", "zd-chat-body", c), inp = txt(mk("div", "zd-chat-in", c), input); inp.style.cssText += ";display:flex;justify-content:space-between;align-items:center"; const send = mk("i", "", inp); send.style.cssText = "width:calc(var(--u)*3.4);height:calc(var(--u)*3.4);border-radius:50%;background:var(--zd-a)";
    return { el: c, body,
      say(tl, { side = "me", text = "", at: t = 0, typed = false, big = false, wait = 0 }) { const m = mk("div", `zd-msg zd-t ${side}${big ? " big" : ""}`, body), node = mk("span", "", m);
        if (typed) { m.style.minHeight = "1.4em"; ZD.in(tl, m, t, "fade"); ZD.type(tl, node, text, t, Math.min(1.6, text.length * 0.03)); } else { txt(node, text); ZD.in(tl, m, t, side === "me" ? "up" : "left"); }
        return m; },
      card(tl, { head, doc, at: t }) { const m = mk("div", "zd-msg zd-t ai", body); if (head) txt(mk("div", "", m), head); const d = mk("div", "", m); d.style.marginTop = "0.4em"; if (doc?.title) txt(mk("div", "zd-doc-t", d), doc.title); (doc?.lines || []).forEach((l) => { const r = txt(mk("div", "", d), l); r.style.color = "var(--zd-b)"; }); ZD.in(tl, m, t, "left"); return m; },
      think(tl, t0, t1) { const d = mk("div", "zd-msg ai", body); d.style.cssText += ";display:flex;gap:calc(var(--u)*1)"; const B = [0, 1, 2].map(() => { const i = mk("i", "", d); i.style.cssText = "width:calc(var(--u)*1.6);height:calc(var(--u)*1.6);border-radius:50%;background:#9aa3ad"; return i; }); ZD.in(tl, d, t0, "fade"); B.forEach((i, k) => tl.to(i, { y: -8, duration: 0.18, yoyo: true, repeat: 3, ease: "sine.inOut" }, t0 + k * 0.08)); tl.set(d, { display: "none" }, t1); return d; },
      attach(tl, text, t) { let r = body.querySelector(".zd-attach"); if (!r) r = mk("div", "zd-attach", body); const p = ZD.pill(r, { text, icon: "lucide:paperclip" }); p.wrap.style.position = "static"; p.wrap.style.transform = "none"; p.el.style.fontSize = "calc(var(--u)*3)"; ZD.in(tl, p.el, t); },
      rule(tl, text, t, { n, mark } = {}) { const p = ZD.pill(body, { text, num: n }); p.wrap.classList.add("zd-rule"); p.wrap.style.position = "static"; p.wrap.style.transform = "none"; p.el.style.fontSize = "inherit"; ZD.in(tl, p.el, t); if (mark) { const u = mk("i", "zd-sl", p.el); u.style.top = "86%"; u.style.transform = "scaleX(0)"; tl.to(u, { scaleX: 1, duration: 0.3 }, t + 0.25); } return p; },
    };
  };
  // ---------- a sheet ----------
  ZD.doc = function (o, { title, sub, lines = [], x = 50, y = 30, w = 56, h, rule = true, plain = false } = {}) {
    const e = mk("div", plain ? "zd-card" : "zd-sheet", o); e.style.left = `${x - w / 2}%`; e.style.top = `${y}%`; e.style.width = `${w}%`; if (h) e.style.height = `${h}%`;
    if (title) txt(mk("div", "zd-doc-t", e), title); if (sub) txt(mk("div", "zd-doc-s", e), sub); if (rule && (title || sub)) mk("div", "zd-doc-rule", e);
    const L = lines.map((l) => { const b = typeof l === "number"; const r = mk("div", `zd-ln${b ? " bar" : ""}`, e); if (b) r.style.setProperty("--w", `${l * 100}%`); else txt(mk("span", "", r), l); r.style.zIndex = 0; return r; });
    return { el: e, lines: L,
      mark(tl, i, t, color = "rgba(10,146,205,.28)") { const m = mk("i", "zd-mark", L[i]); m.style.background = color; tl.to(m, { scaleX: 1, duration: 0.35, ease: "power2.out" }, t); },
      ring(tl, i, t) { const r = mk("i", "zd-ring", L[i]); tl.fromTo(r, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: true }, t); },
      tick(tl, i, t) { const k = mk("span", "zd-tick", L[i], "✓"); tl.fromTo(k, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: true }, t); },
      warn(tl, i, t) { const k = mk("span", "zd-warn", L[i], "!"); tl.fromTo(k, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: true }, t); this.mark(tl, i, t, "rgba(231,13,133,.16)"); },
      print(tl, i, t, d = 0.5) { const n = L[i].querySelector("span"); if (n) ZD.type(tl, n, n.textContent, t, d); ZD.in(tl, L[i], t, "fade"); },
    };
  };
  // ---------- a card of rows ----------
  ZD.list = function (o, { kicker, title, rows = [], x = 50, y = 20, w = 60 } = {}) {
    const e = mk("div", "zd-card", o); e.style.left = `${x - w / 2}%`; e.style.top = `${y}%`; e.style.width = `${w}%`;
    if (kicker) txt(mk("div", "zd-kick", e), kicker); if (title) txt(mk("div", "zd-card-t", e), title);
    const R = rows.map((r) => { const d = mk("div", "zd-row", e); if (r.emoji) mk("span", "zd-ic", d, emoji(r.emoji)); else if (r.icon) mk("span", "zd-ic", d, icon(r.icon)); txt(mk("span", "tx", d), r.text); return d; });
    return { el: e, rows: R, row(tl, i, t) { ZD.in(tl, R[i], t, "left"); }, typeRow(tl, i, t, d = 0.3) { const n = R[i].querySelector(".tx"); ZD.in(tl, R[i], t, "fade"); ZD.type(tl, n, n.textContent, t, d); }, tick(tl, i, t) { const k = mk("span", "zd-tick", R[i], "✓"); tl.fromTo(k, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: true }, t); } };
  };
  ZD.card = function (o, { title, sub, emoji: em, x = 50, y = 20, w = 62 } = {}) {
    const e = mk("div", "zd-card", o); e.style.left = `${x - w / 2}%`; e.style.top = `${y}%`; e.style.width = `${w}%`; e.style.textAlign = "center";
    if (em) { const i = mk("div", "zd-ic", e, emoji(em)); i.style.fontSize = "calc(var(--u)*12)"; } if (title) txt(mk("div", "zd-card-t", e), title); if (sub) { const s = txt(mk("div", "zd-kick", e), sub); s.style.color = "var(--zk-c,#111ed4)"; }
    return { el: e };
  };
  // ---------- windows on a screen, each stacked a little over the last ----------
  ZD.folder = function (screen, { title = "" } = {}) { const w = at(screen, 50, 40), e = mk("div", "", w); e.style.cssText = "text-align:center;font-weight:800;font-size:calc(var(--u)*5)"; const i = mk("div", "", e, icon("lucide:folder", { color: "#e8a91d" })); i.style.cssText = "width:calc(var(--u)*22);height:calc(var(--u)*22);margin:auto"; txt(mk("div", "", e), title); return { el: e }; };
  ZD.topThings = function (o, { items = [] } = {}) { const b = mk("div", "", o); b.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden"; if (items.some((x) => /notebook|book/.test(x))) { const n = mk("div", "", b); n.style.cssText = "position:absolute;left:-7%;bottom:-3%;width:34%;height:15%;background:#fff;border-left:calc(var(--u)*2) solid var(--zd-b);transform:rotate(9deg);box-shadow:0 calc(var(--u)*1) calc(var(--u)*3) rgba(40,30,20,.3)"; } if (items.includes("pen")) { const n = mk("div", "", b); n.style.cssText = "position:absolute;right:13%;bottom:7%;width:calc(var(--u)*1.6);height:12%;background:var(--zd-a);border-radius:9px;transform:rotate(22deg)"; } if (items.includes("cup")) { const n = mk("div", "", b); n.style.cssText = "position:absolute;right:-5%;bottom:-2%;width:calc(var(--u)*24);height:calc(var(--u)*24);border-radius:50%;background:#5a3a22;box-shadow:0 0 0 calc(var(--u)*2) var(--zd-a)"; } return b; };
  ZD.window = function (screen, { title = "", logo, tint = false, n = 0, side = false } = {}) {
    const e = mk("div", "zd-win", screen); e.style.left = `${4 + n * 9}%`; e.style.top = `${5 + n * 7}%`; e.style.width = n ? "70%" : "58%"; e.style.height = `${68 - n * 8}%`;
    const bar = mk("div", `zd-win-bar zd-t${tint ? " tinted" : ""}`, e); if (logo) mk("span", "zd-win-logo", bar, icon(logo)); txt(mk("span", "", bar), title);
    const body = mk("div", "", e); body.style.height = "calc(100% - calc(var(--u)*5))"; body.style.position = "relative"; if (side) { const sb = mk("div", "", body); sb.style.cssText = "position:absolute;left:0;top:0;bottom:0;width:13%;background:#1e2a44;z-index:2"; for (let i = 0; i < 4; i++) { const d = mk("i", "", sb); d.style.cssText = `display:block;margin:calc(var(--u)*1.8) auto;width:calc(var(--u)*2.4);height:calc(var(--u)*2.4);border-radius:calc(var(--u)*.6);background:${i ? "#55607a" : "#1ec8a0"}`; } } return { el: e, body };
  };
  const POSTER = [["#2b39d6", "#7c4dff", "#f4c141", "#ff6f9c"], ["#0a92cd", "#0fa985", "#ffd166", "#ef476f"], ["#e0569a", "#7c4dff", "#ffb347", "#3ad6c5"], ["#1e8a5f", "#14625a", "#f6d55c", "#ed553b"]];
  ZD.poster = function (into, { title = "", sub = "", seed = 1 } = {}) {
    const r = rngOf(seed + 3), c = POSTER[seed % POSTER.length], e = mk("div", "zd-poster", into); e.style.background = `linear-gradient(160deg,${c[0]},${c[1]})`;
    [[c[2], 46], [c[3], 26]].forEach(([col, size], i) => { const b = mk("i", "", e); b.style.background = col; b.style.width = b.style.height = `${size}%`; b.style.left = `${r() * 70 - (i ? 0 : 20)}%`; b.style.top = `${i ? 58 + r() * 20 : -10 - r() * 10}%`; });
    txt(mk("b", "", e), title); if (sub) txt(mk("small", "", e), sub); return e;
  };
  ZD.dock = function (screen, logos = []) { const d = mk("div", "zd-dock", screen); for (const l of logos) { const c = mk("span", "zd-win-logo", d, icon(l)); if (!c.querySelector("path,rect,circle,polygon,g")) { c.textContent = String(l).split(":").pop().slice(0, 1).toUpperCase(); c.style.cssText = "align-items:center;justify-content:center;border-radius:50%;background:#14b8c8;color:#fff;font-weight:800;font-size:calc(var(--u)*3)"; } } return d; };
  // ---------- two columns joined line by line ----------
  ZD.match = function (o, { title, left, right, rows = [], x = 50, y = 13, w = 90 } = {}) {
    const e = mk("div", "zd-match", o); e.style.left = `${x - w / 2}%`; e.style.top = `${y}%`; e.style.width = `${w}%`;
    const bar = mk("div", "zd-match-bar zd-t", e); mk("i", "", bar); mk("i", "", bar); mk("i", "", bar); txt(mk("span", "", bar), title || "");
    const g = mk("div", "zd-match-in", e); txt(mk("div", "zd-match-h", g), left || ""); mk("div", "", g); txt(mk("div", "zd-match-h", g), right || "");
    const J = rows.map(([a, b]) => { txt(mk("div", "zd-match-c", g), a); const j = mk("div", "zd-match-j", g), l = mk("i", "", j), k = mk("b", "", j, "✓"); txt(mk("div", "zd-match-c", g), b); return [l, k]; });
    return { el: e, join(tl, i, t) { tl.to(J[i][0], { scaleX: 1, duration: 0.3 }, t); tl.fromTo(J[i][1], { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.25, ease: "back.out(3)", immediateRender: true }, t + 0.2); } };
  };
  // ---------- beats ----------
  ZD.stamp = function (o, { text = "", x = 50, y = 50, rot = -6, small = false } = {}) { const w = at(o, x, y), e = mk("div", `zd-stamp zd-t${small ? " small" : ""}`, w); txt(mk("span", "", e), text); w.style.transform = `translate(-50%,-50%) rotate(${rot}deg)`; return { el: e, wrap: w }; };
  ZD.questions = function (o, { n = 3, x = 50, y = 12 } = {}) { const w = at(o, x, y), sp = [[-20, 4], [0, -2], [17, 4], [-34, 9], [30, 9]]; const el = mk("div", "", w); el.style.position = "relative"; el.style.width = el.style.height = "1px";
    const Q = []; for (let i = 0; i < n; i++) { const q = mk("div", "zd-q", el, "?"), [dx, dy] = sp[i % sp.length]; q.style.left = `calc(var(--u)*${dx - 6})`; q.style.top = `calc(var(--u)*${dy * 2 - 6})`; Q.push(q); }
    return { el, Q, spin(tl, t) { Q.forEach((q, i) => { ZD.in(tl, q, t + i * 0.08); tl.to(q, { rotation: (i % 2 ? -1 : 1) * 720, duration: 3, ease: "none" }, t + 0.1); }); } }; };
  ZD.bulb = function (o, { x = 50, y = 12 } = {}) { const w = at(o, x, y), e = mk("div", "zd-bulb", w, `<svg viewBox="0 0 110 120"><g stroke="#2aa7dc" stroke-width="5" stroke-linecap="round"><path d="M55 4v12M16 18l9 9M94 18l-9 9M4 58h12M94 58h12"/></g><circle cx="55" cy="58" r="42" fill="#8fe3ff" opacity=".35"/><circle cx="55" cy="56" r="26" fill="#6fd3f7"/><circle cx="46" cy="47" r="7" fill="#dff7ff"/><rect x="44" y="80" width="22" height="12" rx="3" fill="#7d8797"/><rect x="47" y="93" width="16" height="6" rx="3" fill="#596273"/></svg>`); return { el: e }; };
  ZD.thought = function (o, { x = 50, y = 12 } = {}) { const w = at(o, x, y), e = mk("div", "zd-thought", w), l = mk("div", "zd-load", e); return { el: e, loader: l, spin(tl, t, d) { tl.to(l, { rotation: 360 * Math.max(1, Math.round(d)), duration: d, ease: "none" }, t); } }; };
  ZD.calendar = function (o, { text = "", x = 50, y = 13 } = {}) { const w = at(o, x, y), e = mk("div", "zd-cal", w); txt(mk("b", "", e), text); return { el: e }; };
  ZD.drop = function (o, { x = 60, y = 24 } = {}) { const w = at(o, x, y), e = mk("div", "zd-drop", w, `<svg viewBox="0 0 30 42"><path d="M15 1C20 13 29 19 29 28a14 14 0 0 1-28 0C1 19 10 13 15 1z" fill="#7fd6f7"/><ellipse cx="10" cy="29" rx="3" ry="5" fill="#fff" opacity=".7"/></svg>`); return { el: e }; };
  ZD.slash = function (target, tl, t, { diag = false } = {}) { const s = mk("i", "zd-sl", target), rot = diag ? -24 : -7; if (diag) { s.style.height = "calc(var(--u)*1.5)"; s.style.top = "52%"; } s.style.transform = `rotate(${rot}deg) scaleX(0)`; tl.fromTo(s, { rotation: rot, scaleX: 0 }, { rotation: rot, scaleX: 1, duration: 0.28, ease: "power3.out", immediateRender: true }, t); return s; };
  // the mouse arrow on a screen: from → to, or a path of [t, x, y]
  ZD.cursor = function (screen, tl, { from, to, t, d = 0.4, path } = {}) { const c = mk("div", "zd-cur", screen, `<svg viewBox="0 0 24 24"><path d="M4 2l16 12-7 1.5L16.5 23l-3.4 1.5-3.3-7.6L4 22z" fill="#14213a" stroke="#fff" stroke-width="1.6"/></svg>`); const pts = path || [[t, from[0], from[1]], [t + d, to[0], to[1]]]; c.style.left = `${pts[0][1]}%`; c.style.top = `${pts[0][2]}%`; pts.slice(1).forEach((p, i) => tl.to(c, { left: `${p[1]}%`, top: `${p[2]}%`, duration: Math.max(0.1, Math.min(0.5, p[0] - pts[i][0])), ease: "power2.inOut" }, p[0] - 0.3)); return c; };
  // a small paper flying into place on a screen
  ZD.fly = function (screen, tl, { from, to, t, d = 0.5 }) { const w = at(screen, from[0], from[1]), p = mk("div", "zd-sheet", w); p.style.position = "static"; p.style.width = "calc(var(--u)*10)"; p.style.height = "calc(var(--u)*13)"; tl.fromTo(w, { left: `${from[0]}%`, top: `${from[1]}%`, opacity: 1 }, { left: `${to[0]}%`, top: `${to[1]}%`, opacity: 0, duration: d, ease: "power2.in", immediateRender: false }, t); return w; };
  // a tiny page inside a bubble
  ZD.thumb = function (into, { title = "", lines = [] } = {}) { const e = mk("div", "zd-thumb"); if (title) txt(mk("b", "", e), title); lines.slice(0, 5).forEach((l, i) => { const r = mk("i", "", e); r.style.width = `${typeof l === "number" ? l * 100 : 90}%`; if (typeof l === "string") r.style.background = "#ffd166"; }); return e; };
  ZD.ringOn = function (node, tl, t) { const r = mk("i", "zd-ring", node); tl.fromTo(r, { opacity: 0, scale: 1.5 }, { opacity: 1, scale: 1, duration: 0.3, ease: "back.out(2)", immediateRender: true }, t); return r; };
  ZD.ground = function (o, { circles = true } = {}) { const g = mk("div", "zd-gr", o); if (circles) [["#b9cdec", 62, 62, 2], ["#cbb9f0", 48, -14, 30]].forEach(([c, s, l, tp]) => { const i = mk("i", "", g); i.style.background = c; i.style.width = `${s}%`; i.style.aspectRatio = "1"; i.style.left = `${l}%`; i.style.top = `${tp}%`; }); return g; };
})(typeof window !== "undefined" ? window : globalThis);
