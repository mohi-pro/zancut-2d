// ZBROLL: animated 2D b-roll, drawn by code from time alone (seek-safe, no randomness, no model).
//   25 templates (TEMPLATES) + a recipe composer: [backdrop] + [1–3 props: library pieces or local OpenMoji SVG] + [motion]
//   (zoom · pan · fall · slide · bounce). Recipes are checked by physics-logic.js first (zones, real sizes, indoor/outdoor).
//   Modes: "cutaway" covers the whole frame for 1.5–3 s at the start of its shot; "pip_corner" is a card in a corner for the shot.
//   const B = ZBROLL.mount(W, { template: "clock_ticking" } | { recipe }, { mode: "cutaway", corner: "tr" });  ZC.clock(..., t => B.tick(t, d))
// The node side reads TEMPLATES (ids + words) to choose; the draw functions only run in the browser.
(function (root) {
  const VW = 1600, VH = 900, GY = 700; // every b-roll is drawn in this virtual box; ground_y = GY
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, u) => a + (b - a) * u, TAU = Math.PI * 2;
  const rng = (seed) => { let s = (Math.abs(Math.round(seed * 7919)) % 2147483646) + 1; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; };
  const ease = (u) => { const v = clamp(u, 0, 1); return v * v * (3 - 2 * v); };
  const mix = (a, b, u) => { const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)), A = h(a), B = h(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], clamp(u, 0, 1))).toString(16).padStart(2, '0')).join(''); };
  const phys = () => root.ZPHYS;

  // a tiny drawing kit on one <g>
  function K(g) {
    const el = (t, a, p = g) => root.ZC.el(t, a, p);
    const k = {
      g, el,
      r: (x, y, w, h, fill, a = {}) => el('rect', { x, y, width: Math.max(0, w), height: Math.max(0, h), fill, ...a }),
      c: (x, y, r, fill, a = {}) => el('circle', { cx: x, cy: y, r: Math.max(0, r), fill, ...a }),
      e: (x, y, rx, ry, fill, a = {}) => el('ellipse', { cx: x, cy: y, rx: Math.max(0, rx), ry: Math.max(0, ry), fill, ...a }),
      p: (d, fill, a = {}) => el('path', { d, fill, ...a }),
      l: (x1, y1, x2, y2, stroke, w = 4, a = {}) => el('path', { d: `M${x1},${y1} L${x2},${y2}`, fill: 'none', stroke, 'stroke-width': w, 'stroke-linecap': 'round', ...a }),
      t: (x, y, s, size, fill, a = {}) => { const n = el('text', { x, y, 'font-size': size, fill, 'text-anchor': 'middle', 'font-family': 'Hind Siliguri, Noto Sans Bengali, Arial, sans-serif', 'font-weight': 700, ...a }); n.textContent = s; return n; },
      sub: (transform, a = {}) => K(el('g', { transform, ...a })),
    };
    return k;
  }
  const sky = (k, top, bottom, ground) => { k.r(0, 0, VW, VH, top); k.r(0, VH * 0.45, VW, VH * 0.55, bottom, { opacity: 0.6 }); if (ground) k.r(0, GY, VW, VH - GY, ground); };
  const cloud = (k, x, y, s, fill = '#ffffff') => { for (const [dx, dy, r] of [[-60, 10, 42], [-15, -12, 55], [40, 5, 45], [80, 18, 32]]) k.c(x + dx * s, y + dy * s, r * s, fill); k.r(x - 95 * s, y + 10 * s, 205 * s, 40 * s, fill, { rx: 20 * s }); };
  const coin = (k, x, y, r = 34) => { k.e(x, y, r, r * 0.32, '#c98f1d'); k.r(x - r, y - 14, r * 2, 14, '#c98f1d'); k.e(x, y - 14, r, r * 0.32, '#f2c14e'); k.t(x, y - 6, '৳', 22, '#a8740f'); };
  const flame = (k, x, y, s, t, i) => { const f = 1 + 0.12 * Math.sin(t * 9 + i * 1.7); k.p(`M${x - 40 * s},${y} Q${x - 50 * s},${y - 70 * s * f} ${x},${y - 140 * s * f} Q${x + 50 * s},${y - 70 * s * f} ${x + 40 * s},${y} Z`, '#ed6735'); k.p(`M${x - 22 * s},${y} Q${x - 26 * s},${y - 45 * s * f} ${x},${y - 85 * s * f} Q${x + 26 * s},${y - 45 * s * f} ${x + 22 * s},${y} Z`, '#ffca48'); };
  const phone = (k, x, y, s = 1) => { k.r(x - 70 * s, y - 130 * s, 140 * s, 260 * s, '#24303f', { rx: 22 * s }); k.r(x - 58 * s, y - 112 * s, 116 * s, 210 * s, '#7fc3ea', { rx: 8 * s }); k.c(x, y + 116 * s, 7 * s, '#55657a'); };
  const steam = (k, x, y, t, n = 3, h = 160) => { for (let i = 0; i < n; i++) { const ph = ((t * 0.45 + i / n) % 1), yy = y - ph * h, sx = x + (i - (n - 1) / 2) * 28; k.p(`M${sx},${yy + 40} q14,-12 0,-24 q-14,-12 0,-24`, 'none', { stroke: '#ffffff', 'stroke-width': 7, 'stroke-linecap': 'round', opacity: (1 - ph) * 0.8 }); } };

  // ---------- the 25 templates: draw(k, u, t, d) with u = t / d ----------
  const T = {};
  const def = (id, about, words, draw) => { T[id] = { id, about, words, draw }; };
  def('clock_ticking', 'a wall clock whose second hand ticks once a second', ['সময়', 'ঘড়ি', 'দেরি', 'ঘণ্টা', 'মিনিট', 'time', 'clock', 'late', 'hour', 'minute', 'deadline'], (k, u, t) => {
    sky(k, '#f3e6cf', '#e9d6b5'); k.c(800, 450, 290, '#5a3b2a'); k.c(800, 450, 265, '#fffaf0');
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.l(800 + Math.sin(a) * 225, 450 - Math.cos(a) * 225, 800 + Math.sin(a) * 250, 450 - Math.cos(a) * 250, '#3b2a20', i % 3 ? 6 : 12); }
    const sec = Math.floor(t) + ease((t % 1) * 6), a = (sec / 60) * TAU, m = ((10 + t / 60) / 60) * TAU;
    k.l(800, 450, 800 + Math.sin(m * 12) * 130, 450 - Math.cos(m * 12) * 130, '#3b2a20', 16); k.l(800, 450, 800 + Math.sin(m) * 200, 450 - Math.cos(m) * 200, '#3b2a20', 10);
    k.l(800, 450, 800 + Math.sin(a) * 235, 450 - Math.cos(a) * 235, '#d8452f', 5); k.c(800, 450, 16, '#d8452f');
  });
  def('calendar_pages_flying', 'calendar pages tear off and fly away: days passing', ['দিন', 'মাস', 'বছর', 'তারিখ', 'ক্যালেন্ডার', 'কেটে গেল', 'days', 'months', 'years', 'calendar', 'date', 'passed'], (k, u, t) => {
    sky(k, '#dbe9f2', '#c8dceb'); const n = Math.floor(t * 2.5), day = 1 + (n % 30);
    k.r(560, 200, 480, 520, '#ffffff', { rx: 18 }); k.r(560, 200, 480, 110, '#d8452f', { rx: 18 }); k.t(800, 280, 'মাস', 60, '#ffffff'); k.t(800, 560, String(day), 220, '#2b3440');
    for (let i = 0; i < 3; i++) { const ph = ((t * 2.5) % 1) + i, x = 800 + ph * 260, y = 460 - ph * ph * 120, r = ph * 50; if (ph > 2.6) continue;
      const s = k.sub(`translate(${x} ${y}) rotate(${r})`, { opacity: clamp(1 - ph / 2.6, 0, 1) }); s.r(-200, -160, 400, 320, '#fbf6ea', { rx: 10 }); s.t(0, 70, String(Math.max(1, day - i - 1)), 160, '#9aa3ad'); }
  });
  def('sunrise_to_sunset', 'the sun rises, crosses the sky and sets', ['সারাদিন', 'সকাল থেকে', 'সূর্য', 'ভোর', 'সন্ধ্যা', 'all day', 'sunrise', 'sunset', 'sun', 'dawn', 'dusk'], (k, u) => {
    const a = u * Math.PI, sx = 800 - Math.cos(a) * 640, sy = GY - Math.sin(a) * 520, hi = Math.sin(a);
    sky(k, mix('#f19a5b', '#6fb7e6', hi), mix('#ffd29a', '#cfe9f7', hi)); k.c(sx, sy, 70, mix('#ff7a3d', '#ffd84a', hi)); k.c(sx, sy, 100, '#ffd84a', { opacity: 0.25 });
    k.r(0, GY, VW, VH - GY, mix('#4f6b3a', '#78a85a', hi)); k.p(`M0,${GY} Q400,${GY - 90} 800,${GY} T1600,${GY} V${VH} H0Z`, mix('#3e5a2d', '#5d8c45', hi));
  });
  def('heavy_rain_clouds', 'dark clouds drift and heavy rain falls', ['বৃষ্টি', 'ঝড়', 'বর্ষা', 'মেঘ', 'rain', 'storm', 'monsoon', 'clouds', 'raining'], (k, u, t) => {
    sky(k, '#5b6878', '#7d8a98', '#4f6152'); const r = rng(7);
    for (let i = 0; i < 140; i++) { const x0 = r() * (VW + 200), sp = 900 + r() * 400, y = ((r() * VH + t * sp) % (VH + 100)) - 60, x = x0 - (y + 60) * 0.18; k.l(x, y, x - 8, y + 34, '#c9d6e3', 3, { opacity: 0.75 }); }
    for (let i = 0; i < 6; i++) { const ph = ((t * 0.9 + i / 6) % 1); k.e(150 + i * 260, GY + 60, 20 + ph * 70, (20 + ph * 70) * 0.25, 'none', { stroke: '#a9bccc', 'stroke-width': 3, opacity: 1 - ph }); }
    for (let i = 0; i < 4; i++) cloud(k, ((i * 480 + t * 40) % 2000) - 200, 120 + (i % 2) * 50, 1.6, '#3f4a57');
  });
  def('night_stars_moon', 'a night sky with twinkling stars and the moon', ['রাত', 'চাঁদ', 'তারা', 'night', 'moon', 'stars', 'midnight'], (k, u, t) => {
    sky(k, '#0f1a33', '#1d2c4f', '#141d2c'); const r = rng(3);
    for (let i = 0; i < 90; i++) { const x = r() * VW, y = r() * (GY - 80), s = 1.5 + r() * 3; k.c(x, y, s * (0.6 + 0.4 * Math.sin(t * 3 + i)), '#fff7d6'); }
    k.c(1180, 220, 90, '#fff2c4'); k.c(1220, 195, 80, '#0f1a33'); for (let i = 0; i < 3; i++) cloud(k, ((i * 600 + t * 25) % 1900) - 150, 380 + i * 40, 0.9, '#22314f');
  });
  def('money_coins_stacking', 'coins drop and stack up: money growing', ['টাকা', 'সঞ্চয়', 'আয়', 'লাভ', 'কয়েন', 'money', 'savings', 'income', 'profit', 'coins', 'earn'], (k, u, t) => {
    sky(k, '#e8f4ea', '#d3ead8'); k.r(0, GY, VW, VH - GY, '#b98a5e');
    for (const [col, x] of [[0, 560], [1, 800], [2, 1040]]) { const n = 12 - col * 3; for (let i = 0; i < n; i++) { const ts = 0.12 + (i + col * 0.5) * 0.22, f = phys().fall(t - ts, { h0: 1.4, e: 0.25 }), rest = GY - i * 16, y = rest - f.y * 420; if (t < ts) continue; coin(k, x, Math.min(rest, y)); } }
  });
  def('empty_wallet_fly', 'an empty wallet: the last note flies away', ['টাকা নেই', 'খালি', 'গরিব', 'দেনা', 'ঋণ', 'empty wallet', 'broke', 'no money', 'debt', 'poor'], (k, u, t) => {
    sky(k, '#f2ece2', '#e5dccd'); k.r(500, 420, 600, 300, '#6b4a33', { rx: 30 }); k.r(500, 420, 600, 90, '#7d5a40', { rx: 30 }); k.r(560, 380, 480, 80, '#3a2a20', { rx: 12 });
    const x = 800 + t * 220, y = 380 - t * 150 + Math.sin(t * 5) * 30, flap = Math.sin(t * 14) * 18; const s = k.sub(`translate(${x} ${y}) rotate(${-15 + flap})`); s.r(-90, -45, 180, 90, '#8fc29a', { rx: 6 }); s.t(0, 14, '৳', 44, '#3f7a4a');
    for (let i = 0; i < 3; i++) k.c(700 + i * 90 + Math.sin(t * 3 + i) * 10, 360 - ((t * 60 + i * 40) % 160), 6, '#b8aa96', { opacity: 0.6 });
  });
  def('laptop_typing_fast', 'hands type fast on a laptop, lines of text appear', ['ল্যাপটপ', 'কম্পিউটার', 'অফিসের কাজ', 'টাইপ', 'লিখছে', 'laptop', 'computer', 'typing', 'working', 'email', 'code'], (k, u, t) => {
    sky(k, '#e9eef3', '#d9e1e8'); k.r(0, GY - 40, VW, VH, '#a87b55'); k.p(`M420,${GY - 40} L1180,${GY - 40} L1260,${GY + 10} L340,${GY + 10}Z`, '#3a4350');
    k.r(480, 180, 640, 420, '#2b323c', { rx: 16 }); k.r(505, 205, 590, 370, '#f7f9fb');
    const lines = Math.floor(t * 6); for (let i = 0; i < 9; i++) { const w = i < lines % 10 ? 140 + ((i * 97) % 380) : 0; k.r(535, 230 + i * 36, w, 14, i % 3 ? '#9fb3c8' : '#2f6fb0', { rx: 7 }); }
    for (let i = 0; i < 18; i++) k.r(470 + (i % 9) * 75, GY - 30 + Math.floor(i / 9) * 18, 60, 12, Math.floor(t * 12 + i * 7) % 5 === 0 ? '#ffd27a' : '#555f6d', { rx: 3 });
  });
  def('market_price_up', 'bars and a price tag climb: prices going up', ['দাম বাড়', 'দাম', 'মূল্য', 'দ্রব্যমূল্য', 'মোবাইলের দাম', 'price', 'prices', 'expensive', 'inflation', 'cost'], (k, u, t) => {
    sky(k, '#fbf3e6', '#f3e4cc'); k.l(260, GY, 1340, GY, '#5b4a3a', 6); k.l(260, GY, 260, 160, '#5b4a3a', 6);
    for (let i = 0; i < 6; i++) { const h = ease(u * 1.4 - i * 0.12) * (90 + i * 85); k.r(330 + i * 165, GY - h, 110, h, i === 5 ? '#d8452f' : '#e0a02c', { rx: 8 }); }
    const a = ease(u * 1.2); k.l(330, GY - 80, 330 + a * 1000, GY - 80 - a * 470, '#d8452f', 10); k.p(`M${330 + a * 1000},${GY - 80 - a * 470} l-40,6 l26,32Z`, '#d8452f');
    k.r(1120, 150, 300, 120, '#ffffff', { rx: 16, stroke: '#d8452f', 'stroke-width': 6 }); k.t(1270, 235, '৳' + Math.round(40 + 60 * a), 72, '#d8452f');
  });
  def('phone_ringing_vibrate', 'a phone rings and vibrates', ['ফোন', 'কল', 'ফোন এল', 'মোবাইল', 'phone', 'call', 'ringing', 'mobile', 'rang'], (k, u, t) => {
    sky(k, '#e3edf5', '#cfdde9'); k.r(0, GY - 20, VW, VH, '#b08960'); const on = Math.floor(t * 1.4) % 2 === 0, jx = on ? Math.sin(t * 70) * 9 : 0, jr = on ? Math.sin(t * 55) * 4 : 0;
    const s = k.sub(`translate(${800 + jx} ${450}) rotate(${jr})`); phone(s, 0, 0, 1.4); s.c(0, -10, 50, '#3fae63'); s.t(0, 8, '☎', 52, '#ffffff');
    if (on) for (let i = 0; i < 3; i++) { const ph = (t * 2 + i / 3) % 1, r = 140 + ph * 140; for (const sd of [-1, 1]) k.p(`M${800 + sd * r * 0.7},${450 - r * 0.7} A${r},${r} 0 0 ${sd > 0 ? 1 : 0} ${800 + sd * r * 0.7},${450 + r * 0.7}`, 'none', { stroke: '#3fae63', 'stroke-width': 8, opacity: 1 - ph, 'stroke-linecap': 'round' }); }
  });
  def('teacup_steaming', 'a hot cup of tea steams', ['চা', 'চায়ের', 'কাপ', 'আড্ডা', 'tea', 'cup', 'chai', 'coffee'], (k, u, t) => {
    sky(k, '#f4e3cc', '#ead1b1'); k.r(0, GY - 60, VW, VH, '#8a5a3c'); k.e(800, GY - 60, 260, 40, '#f4f1ea'); k.p(`M610,${GY - 300} L990,${GY - 300} Q980,${GY - 90} 800,${GY - 80} Q620,${GY - 90} 610,${GY - 300}Z`, '#fbfaf6');
    k.e(800, GY - 300, 190, 30, '#9a5a2c'); k.p(`M985,${GY - 260} q90,10 70,80 q-20,50 -90,40`, 'none', { stroke: '#fbfaf6', 'stroke-width': 26 }); steam(k, 800, GY - 330, t, 3, 220);
  });
  def('fast_running_feet', 'feet run fast on the ground with speed lines', ['দৌড়', 'দৌড়াচ্ছে', 'তাড়াতাড়ি', 'ছুটছে', 'run', 'running', 'hurry', 'rush', 'race'], (k, u, t) => {
    sky(k, '#cfe6f5', '#e8f2f8', '#c9a77c'); for (let i = 0; i < 12; i++) { const x = VW - ((t * 1400 + i * 260) % (VW + 300)); k.r(x, GY + 40 + (i % 3) * 40, 120, 10, '#a98557', { rx: 5 }); }
    for (let i = 0; i < 7; i++) k.l(160, 220 + i * 60, 160 + 260 + (i % 2) * 120, 220 + i * 60, '#ffffff', 8, { opacity: 0.7 });
    for (const sd of [0, 1]) { const a = Math.sin(t * 16 + sd * Math.PI), x = 800 + a * 170, lift = Math.max(0, -Math.cos(t * 16 + sd * Math.PI)) * 70;
      k.l(800, 260, x, GY - 60 - lift, '#2f4f7a', 50); k.p(`M${x - 50},${GY - 60 - lift} h140 q20,0 20,22 v20 h-170 z`, sd ? '#d8452f' : '#e0612f'); }
  });
  def('heartbeat_pulse', 'a heart beats with a pulse line', ['হৃদয়', 'হার্ট', 'ভালোবাসা', 'অসুস্থ', 'heart', 'love', 'pulse', 'heartbeat', 'sick'], (k, u, t) => {
    sky(k, '#1f2a36', '#24313f'); const beat = Math.max(0, Math.sin(((t * 1.2) % 1) * Math.PI * 4)) * 0.18, s = 1 + beat;
    k.p(`M800,${560 * 1} C${800 - 260 * s},${430 - 130 * s} ${800 - 120 * s},${250 - 60 * s} 800,${350 - 40 * s} C${800 + 120 * s},${250 - 60 * s} ${800 + 260 * s},${430 - 130 * s} 800,560Z`, '#e5484d');
    let d = ''; for (let x = 0; x <= VW; x += 10) { const ph = ((x / VW) * 3 - t * 1.2) % 1, p = ph < 0 ? ph + 1 : ph, y = 720 - (p > 0.45 && p < 0.5 ? -120 : p > 0.5 && p < 0.55 ? 160 : 0); d += (x ? 'L' : 'M') + x + ',' + y; } k.p(d, 'none', { stroke: '#3fdc8a', 'stroke-width': 6 });
  });
  def('lightbulb_idea', 'a light bulb switches on: an idea', ['বুদ্ধি', 'আইডিয়া', 'মাথায় এল', 'ভাবনা', 'idea', 'think', 'realized', 'plan', 'solution'], (k, u, t) => {
    const on = ease((t - 0.4) * 3); sky(k, mix('#2b3340', '#fff3c9', on), mix('#343d4b', '#ffe9a6', on));
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; k.l(800 + Math.cos(a) * 250, 380 + Math.sin(a) * 250, 800 + Math.cos(a) * (250 + 90 * on), 380 + Math.sin(a) * (250 + 90 * on), '#f2b13c', 10, { opacity: on }); }
    k.c(800, 380, 190, mix('#c9ced6', '#ffe36e', on)); k.r(720, 540, 160, 120, '#8b95a3', { rx: 14 }); for (let i = 0; i < 3; i++) k.l(725, 570 + i * 30, 875, 570 + i * 30, '#6b7482', 6);
  });
  def('hourglass_sand', 'sand flows through an hourglass: waiting', ['অপেক্ষা', 'বালিঘড়ি', 'ধৈর্য', 'wait', 'waiting', 'patience', 'hourglass'], (k, u) => {
    sky(k, '#efe4d2', '#e2d2b9'); k.r(600, 140, 400, 30, '#6b4a33', { rx: 10 }); k.r(600, 730, 400, 30, '#6b4a33', { rx: 10 });
    k.p('M640,170 L960,170 L820,450 L960,730 L640,730 L780,450Z', '#ddeef7', { opacity: 0.7, stroke: '#9bb4c4', 'stroke-width': 4 });
    const top = 1 - u, bot = u; k.p(`M${800 - 150 * top},${450 - 270 * top} L${800 + 150 * top},${450 - 270 * top} L800,445Z`, '#e0b46a'); k.p(`M${800 - 160},730 L${800 + 160},730 L${800 + 160 * (1 - bot * 0.6)},${730 - 200 * bot} L${800 - 160 * (1 - bot * 0.6)},${730 - 200 * bot}Z`, '#e0b46a');
    if (u < 1) k.l(800, 450, 800, 730 - 200 * bot, '#e0b46a', 5);
  });
  def('thunder_lightning', 'thunder clouds and a lightning flash', ['বজ্র', 'বিদ্যুৎ চমক', 'বাজ', 'thunder', 'lightning', 'thunderstorm'], (k, u, t) => {
    const flash = [0.6, 1.9].some((x) => t > x && t < x + 0.12) ? 1 : 0; sky(k, mix('#2c3442', '#e8ecf5', flash * 0.8), '#3a4352', '#2f3a33');
    for (let i = 0; i < 5; i++) cloud(k, 120 + i * 340 + Math.sin(t + i) * 20, 140 + (i % 2) * 40, 1.5, '#262e3a');
    if (flash) k.p('M860,200 L760,420 L840,420 L720,680 L900,380 L820,380 L920,200Z', '#fff3a6');
  });
  def('wind_leaves_blowing', 'wind blows leaves across the frame', ['বাতাস', 'হাওয়া', 'ঝড়ো', 'wind', 'windy', 'breeze', 'blowing'], (k, u, t) => {
    sky(k, '#a9d4ec', '#d9eef8', '#8fbf62'); const r = rng(11);
    for (let i = 0; i < 6; i++) { const y = 160 + i * 90, x = ((t * 500 + i * 300) % (VW + 600)) - 300; k.p(`M${x},${y} q120,-30 240,0 t240,0`, 'none', { stroke: '#ffffff', 'stroke-width': 6, opacity: 0.6, 'stroke-linecap': 'round' }); }
    for (let i = 0; i < 18; i++) { const sp = 300 + r() * 300, x = ((t * sp + r() * VW) % (VW + 100)) - 50, y = 150 + r() * 450 + Math.sin(t * 3 + i) * 40; k.sub(`translate(${x} ${y}) rotate(${t * 200 + i * 40})`).e(0, 0, 22, 10, i % 3 ? '#5e9a3f' : '#d39a2c'); }
  });
  def('rice_bowl_steam', 'a steaming bowl of rice: a meal', ['ভাত', 'খাবার', 'খাওয়া', 'ক্ষুধা', 'রান্না', 'rice', 'food', 'meal', 'eat', 'hungry', 'lunch', 'dinner'], (k, u, t) => {
    sky(k, '#f6e7cf', '#eed7b3'); k.r(0, GY - 40, VW, VH, '#9a6b47'); k.e(800, GY - 40, 330, 50, '#e6dccb');
    k.p(`M520,${GY - 260} Q800,${GY + 60} 1080,${GY - 260}Z`, '#2f6fb0'); for (let i = 0; i < 40; i++) k.e(560 + ((i * 53) % 480), GY - 262 - ((i * 37) % 60) * Math.sin(((i * 53) % 480) / 480 * Math.PI), 16, 9, '#fffdf6');
    steam(k, 800, GY - 330, t, 4, 230);
  });
  def('books_stack_study', 'books drop onto a stack: studying', ['পড়া', 'পড়াশোনা', 'পরীক্ষা', 'বই', 'study', 'studying', 'books', 'exam', 'homework', 'learn'], (k, u, t) => {
    sky(k, '#e8eef6', '#d6e0ee'); k.r(0, GY, VW, VH, '#a87b55'); const col = ['#d8452f', '#2d7f8c', '#e0a02c', '#5a8f3c', '#7a4fa3', '#2f6fb0'];
    for (let i = 0; i < 6; i++) { const ts = 0.1 + i * 0.32, f = phys().fall(t - ts, { h0: 1.2, e: 0.2 }), rest = GY - i * 52 - 52, y = rest - f.y * 380; if (t < ts) continue; k.r(620 + (i % 2) * 30, Math.min(rest, y), 360 - (i % 3) * 30, 50, col[i], { rx: 6 }); k.r(640 + (i % 2) * 30, Math.min(rest, y) + 10, 300 - (i % 3) * 30, 8, '#fbf6ea'); }
  });
  def('bus_passing_road', 'a bus drives past on the road, wheels rolling', ['বাস', 'যাত্রা', 'রাস্তা', 'গাড়ি চলে', 'bus', 'journey', 'road', 'travel', 'commute'], (k, u, t) => {
    sky(k, '#9fd0ee', '#dff0f8', '#7f8a8f'); k.r(0, GY + 60, VW, 14, '#f2f2f2'); for (let i = 0; i < 8; i++) k.r(((i * 240 - t * 300) % VW + VW) % VW, GY + 120, 120, 12, '#f2e27a');
    const x = lerp(-500, VW + 500, ease(u)), dist = (VW + 1000) * ease(u), rot = (dist / 50) * (180 / Math.PI); // the wheels turn by distance ÷ radius
    k.r(x - 320, GY - 250, 640, 240, '#2f8f5b', { rx: 26 }); for (let i = 0; i < 5; i++) k.r(x - 290 + i * 115, GY - 225, 95, 80, '#cfe8f5', { rx: 8 }); k.r(x - 320, GY - 120, 640, 26, '#e0a02c');
    for (const wx of [-200, 200]) { const s = k.sub(`translate(${x + wx} ${GY - 10}) rotate(${rot})`); s.c(0, 0, 50, '#222831'); s.c(0, 0, 22, '#b7bfca'); s.l(-22, 0, 22, 0, '#5c6570', 6); }
  });
  def('notification_bell', 'a bell rings and a badge count goes up', ['খবর', 'নোটিফিকেশন', 'বার্তা', 'মেসেজ', 'news', 'notification', 'message', 'alert', 'update'], (k, u, t) => {
    sky(k, '#eef2f8', '#dfe6f0'); const ang = 22 * Math.exp(-((t % 1.6) * 1.8)) * Math.sin((t % 1.6) * 14); // a damped swing
    const s = k.sub(`translate(800 220) rotate(${ang})`); s.p('M-150,320 Q-150,60 0,40 Q150,60 150,320 L190,370 L-190,370Z', '#f2b13c'); s.c(0, 395, 40, '#c98f1d'); s.c(0, 30, 22, '#c98f1d');
    k.c(960, 250, 64, '#e5484d'); k.t(960, 276, String(1 + Math.floor(t * 1.5)), 68, '#ffffff');
  });
  def('map_route_travel', 'a route draws itself across a map to a pin', ['যাওয়া', 'গ্রামে গেল', 'গ্রামে যাচ্ছে', 'গ্রামে ফিরল', 'শহরে গেল', 'শহরে যাচ্ছে', 'শহরে এল', 'ভ্রমণ', 'যাত্রা', 'রওনা', 'ঢাকায় গেল', 'ঢাকা যাচ্ছে', 'map', 'route', 'trip', 'journey', 'travel', 'going to', 'went to the village', 'went to the city'] /* travel, not a bare mention of a village or a city */, (k, u) => {
    sky(k, '#e9e2c6', '#e0d6b4'); k.p('M100,700 Q400,560 600,640 T1100,520 T1500,600 L1500,900 L100,900Z', '#bcd3a0'); k.p('M0,300 Q300,250 500,330 T1000,280 T1600,320', 'none', { stroke: '#7fb2d6', 'stroke-width': 30 });
    const P = [[260, 680], [520, 520], [820, 600], [1060, 380], [1330, 300]]; const total = P.length - 1, upto = ease(u * 1.1) * total;
    let d = `M${P[0][0]},${P[0][1]}`; for (let i = 1; i <= total; i++) { const f = clamp(upto - (i - 1), 0, 1); if (f <= 0) break; d += ` L${lerp(P[i - 1][0], P[i][0], f)},${lerp(P[i - 1][1], P[i][1], f)}`; }
    k.p(d, 'none', { stroke: '#d8452f', 'stroke-width': 12, 'stroke-dasharray': '30 20', 'stroke-linecap': 'round' }); k.c(P[0][0], P[0][1], 20, '#2f6fb0');
    const pin = ease((u - 0.85) * 8); k.p(`M1330,${300} q-50,-70 0,-120 q50,50 0,120Z`, '#d8452f', { opacity: pin }); k.c(1330, 220, 18, '#ffffff', { opacity: pin });
  });
  def('exam_result_grade', 'an answer sheet gets an A+ stamp', ['ফলাফল', 'রেজাল্ট', 'পাস', 'জিপিএ', 'ভালো ফল', 'result', 'grade', 'passed', 'marks', 'gpa'], (k, u, t) => {
    sky(k, '#e5ecf2', '#d4dee8'); k.r(520, 120, 560, 680, '#ffffff', { rx: 10 }); for (let i = 0; i < 12; i++) k.r(580, 220 + i * 44, 300 + ((i * 71) % 140), 12, '#c3ccd6', { rx: 6 });
    const st = ease((t - 0.6) * 4), sc = 1 + (1 - st) * 1.5; if (t > 0.6) { const s = k.sub(`translate(900 300) scale(${sc}) rotate(-14)`, { opacity: st }); s.c(0, 0, 120, 'none', { stroke: '#d8452f', 'stroke-width': 12 }); s.t(0, 34, 'A+', 100, '#d8452f'); }
  });
  def('fire_flames', 'flames burning', ['আগুন', 'পুড়', 'অগ্নিকাণ্ড', 'fire', 'burning', 'flames', 'burn'], (k, u, t) => {
    sky(k, '#2a1d1a', '#3a2620', '#2d2420'); for (let i = 0; i < 7; i++) flame(k, 380 + i * 140, GY, 1.6 + 0.4 * Math.sin(i * 2.1), t, i);
    for (let i = 0; i < 20; i++) { const ph = (t * 0.7 + i / 20) % 1; k.c(400 + ((i * 97) % 800) + Math.sin(t * 4 + i) * 20, GY - 120 - ph * 520, 5 * (1 - ph), '#ffb347', { opacity: 1 - ph }); }
  });
  def('question_marks_float', 'question marks rise: confusion', ['কেন', 'কী হলো', 'বুঝতে পারছে না', 'প্রশ্ন', 'রহস্য', 'why', 'confused', 'question', 'mystery', 'wonder'], (k, u, t) => {
    sky(k, '#ece6f6', '#ddd3ef'); for (let i = 0; i < 9; i++) { const ph = (t * 0.35 + i / 9) % 1, x = 200 + ((i * 173) % 1200) + Math.sin(t * 2 + i) * 40; k.t(x, VH - ph * (VH + 150), '?', 90 + (i % 3) * 50, i % 2 ? '#7a4fa3' : '#2f6fb0', { opacity: Math.sin(ph * Math.PI) }); }
  });
  const TEMPLATES = Object.fromEntries(Object.entries(T).map(([id, x]) => [id, { id, about: x.about, words: x.words }]));

  // ---------- the recipe composer ----------
  // recipe = { backdrop: "sky"|"room"|"table"|"night"|"paper"|"#hex", props: [{ label, svg | piece, m, zone }], motion, caption }
  const BACKDROPS = { sky: ['#a9d4ec', '#dff0f8', '#8fbf62'], room: ['#efe2c8', '#e6d4b3', '#b58a62'], table: ['#e9eef3', '#d9e1e8', '#a87b55'], night: ['#0f1a33', '#1d2c4f', '#141d2c'], paper: ['#fbf6ea', '#f3ead7', '#e2d5b8'] };
  function drawAsset(k, prop, x, bottom, hpx) {
    const n = k.el('g', { 'data-broll-prop': prop.label || prop.piece || 'prop', 'data-zone': prop.zone });
    if (prop.piece && typeof root.ZS?.[prop.piece] === 'function') {
      const isProp = (root.ZS.info?.[prop.piece] || {}).kind === 'prop';
      isProp ? root.ZS[prop.piece](root.ZC.el('g', { transform: `translate(${x} ${bottom})` }, n), { h: hpx, seed: 3 }) : root.ZS[prop.piece](n, { x, y: bottom, h: hpx, seed: 3 });
    } else if (prop.svg && typeof DOMParser !== 'undefined') {
      const doc = new DOMParser().parseFromString(prop.svg, 'image/svg+xml'), src = doc.documentElement;
      if (src && src.nodeName.toLowerCase() === 'svg') {
        for (const bad of [...src.querySelectorAll('script,foreignObject')]) bad.remove();
        const vb = (src.getAttribute('viewBox') || '0 0 72 72').split(/[\s,]+/).map(Number), box = root.ZC.el('svg', { viewBox: vb.join(' '), x: x - hpx / 2, y: bottom - hpx, width: hpx, height: hpx, overflow: 'visible' }, n);
        for (const c of [...src.childNodes]) { const imp = n.ownerDocument.importNode(c, true); if (imp.querySelectorAll) for (const e of [imp, ...imp.querySelectorAll('*')]) for (const a of [...(e.attributes || [])]) if (/^on/i.test(a.name) || a.name === 'id') e.removeAttribute(a.name); box.appendChild(imp); }
        // icons are padded inside their box: fit the view to the drawing, so its visible bottom rests on the ground line
        try { const g = root.ZC.el('g', {}, box); for (const c of [...box.childNodes]) if (c !== g) g.appendChild(c); const b = g.getBBox(); if (b.width > 0 && b.height > 0) { const w = hpx * b.width / b.height; box.setAttribute('viewBox', [b.x, b.y, b.width, b.height].join(' ')); box.setAttribute('x', x - w / 2); box.setAttribute('width', w); } } catch { /* no layout */ }
      }
    } else k.r(x - hpx / 2, bottom - hpx, hpx, hpx, '#9aa3ad', { rx: hpx * 0.15 });
    return n;
  }
  function recipeDraw(recipe) {
    const props = (recipe.props || []).slice(0, 3), Z = phys().ZONES;
    const real = props.filter((p) => p.zone !== Z.SKY_FLOATING).map((p) => p.m || 0.2), FM = Math.max(0.2, ...real) * 2.4, ppm = (GY - 60) / FM; // the frame is 2.4 × the tallest thing
    const surface = props.some((p) => p.zone === Z.TABLE_TOP || p.zone === Z.HELD_IN_HAND);
    return (k, u, t, d) => {
      const bd = BACKDROPS[recipe.backdrop] || (String(recipe.backdrop || '').startsWith('#') ? [recipe.backdrop, recipe.backdrop, mix(recipe.backdrop, '#000000', 0.25)] : BACKDROPS.sky);
      const motion = recipe.motion || 'pan', cam = motion === 'zoom' ? `translate(800 ${GY}) scale(${1 + 0.18 * ease(u)}) translate(-800 ${-GY})` : motion === 'pan' ? `translate(${lerp(60, -60, ease(u))} 0)` : '';
      const s = k.sub(cam); s.r(-200, -200, VW + 400, VH + 400, bd[0]); s.r(-200, VH * 0.45, VW + 400, VH, bd[1], { opacity: 0.6 }); s.r(-200, GY, VW + 400, VH, surface ? '#a87b55' : bd[2]);
      if (surface) s.r(-200, GY, VW + 400, 18, '#8a6242');
      const record = [];
      props.forEach((p, i) => {
        const tx = VW * (i + 1) / (props.length + 1), sky = p.zone === Z.SKY_FLOATING, hpx = sky ? 170 : Math.max(24, (p.m || 0.2) * ppm);
        let x = tx, bottom = sky ? 300 + Math.sin(t * 1.2 + i) * 14 : GY, rot = 0;
        const ts = i * 0.25;
        if (!sky && p.movable !== false && (motion === 'fall' || motion === 'bounce')) { const f = phys().fall(t - ts, { h0: (GY + hpx) / ppm, e: motion === 'bounce' ? 0.72 : 0.35, rest: motion === 'bounce' ? 0.05 : 0.12 }); bottom = GY - f.y * ppm; }
        if (motion === 'slide' && p.movable !== false) { x = lerp(-hpx - 100, tx, ease((t - ts) / 1.1)); rot = 0; }
        if (sky) x = tx + Math.sin(t * 0.6 + i) * 40;
        const g = drawAsset(s, p, x, bottom, hpx); if (rot) g.setAttribute('transform', `rotate(${rot} ${x} ${bottom})`);
        record.push({ label: p.label, zone: p.zone, bottom: Math.round(bottom * 100) / 100, groundY: GY, h: Math.round(hpx), m: p.m });
      });
      if (recipe.caption) { s.r(VW / 2 - 420, 40, 840, 110, '#ffffff', { rx: 24, opacity: 0.9 }); s.t(VW / 2, 118, recipe.caption, 64, '#2b3440'); }
      return record;
    };
  }

  // ---------- mounting a b-roll on a scene ----------
  function mount(W, spec = {}, { mode = 'cutaway', corner = 'tr', seconds, top } = {}) {
    const draw = spec.template ? T[spec.template]?.draw : spec.recipe ? recipeDraw(spec.recipe) : null;
    if (!draw) throw new Error(`ZBROLL: unknown b-roll ${JSON.stringify(spec.template || spec.recipe)}. Templates: ${Object.keys(T).join(', ')}`);
    const el = (t, a, p) => root.ZC.el(t, a, p), w = W.w, h = W.h, svg = W.svg, id = `${W.idp || 'b'}broll`;
    const outer = el('g', { 'data-broll': spec.template || 'recipe', 'data-broll-mode': mode }, svg); // after the camera group: screen-fixed, above everything
    let box, inner;
    if (mode === 'pip_corner') {
      const cw = w * 0.34, ch = cw * (VH / VW), m = w * 0.03, x = /l/.test(corner) ? m : w - cw - m, y = top != null ? h * top : /b/.test(corner) ? h - ch - m : m; // top: a share of the frame height (below a headline)
      box = { x, y, w: cw, h: ch };
      const defs = W.defs || el('defs', {}, svg), clip = el('clipPath', { id: id + 'c' }, defs); el('rect', { x, y, width: cw, height: ch, rx: cw * 0.04 }, clip);
      el('rect', { x: x + 6, y: y + 10, width: cw, height: ch, rx: cw * 0.04, fill: '#000', opacity: 0.22 }, outer);
      inner = el('g', { 'clip-path': `url(#${id}c)` }, outer); el('rect', { x, y, width: cw, height: ch, rx: cw * 0.04, fill: 'none', stroke: '#ffffff', 'stroke-width': Math.max(4, w * 0.004) }, outer);
    } else { box = { x: 0, y: 0, w, h }; inner = el('g', {}, outer); }
    const s = Math.max(box.w / VW, box.h / VH), ox = box.x + (box.w - VW * s) / 2, oy = box.y + (box.h - VH * s) / 2;
    const stage = el('g', { transform: `translate(${ox} ${oy}) scale(${s})` }, inner);
    return {
      element: outer, box,
      tick(t, d) {
        const show = mode === 'cutaway' ? Math.min(d, clamp(seconds ?? Math.min(d, 3), 1.5, 3)) : d;
        const on = t < show, fade = mode === 'cutaway' ? clamp((show - t) / 0.2, 0, 1) : clamp(t / 0.3, 0, 1);
        outer.setAttribute('display', on ? 'inline' : 'none'); outer.setAttribute('opacity', fade.toFixed(3));
        stage.replaceChildren(); if (!on) { (root.__broll ||= {})[id] = { mode, visible: false }; return; }
        const rec = draw(K(stage), clamp(t / Math.max(0.01, show), 0, 1), t, show) || [];
        (root.__broll ||= {})[id] = { mode, visible: true, template: spec.template || null, box, show, props: rec };
      },
    };
  }
  root.ZBROLL = { TEMPLATES, VW, VH, GY, mount, recipeDraw, ids: () => Object.keys(T) };
})(typeof window !== 'undefined' ? window : globalThis);
