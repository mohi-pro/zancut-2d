// ZPHYS: the world's physical and logical sanity rules, deterministic (no model, no randomness, seek-safe).
// One file for both sides: Node repairs a film before it is drawn (server/physics.mjs), the browser uses the same rules and the
// closed-form trajectories while drawing (codefilm scene scripts, broll-kit.js).
//   Zones: every person, piece and prop has one support zone. GROUNDED things stand on ground_y; nothing GROUNDED floats.
//   Sizes: real metres from engine/cartoon/library/sizes.json (the authority); class bands only for things it does not know.
//   Places: the 20 ready places are INDOOR or OUTDOOR; outdoor-only things never spawn indoors, indoor weather is a window view.
//   Motion: gravity 9.8 m/s² falls with restitution bounces, throw arcs, stride-locked walking (the feet never slide), facing.
(function (root) {
  const ZONES = Object.freeze({ GROUNDED: 'GROUNDED', WALL_MOUNTED: 'WALL_MOUNTED', TABLE_TOP: 'TABLE_TOP', HELD_IN_HAND: 'HELD_IN_HAND', SKY_FLOATING: 'SKY_FLOATING' });
  const G = 9.8, REF_HUMAN = 1.70, HEAD = Math.floor((REF_HUMAN / 7.5) * 1000) / 1000; // an adult head is about one seventh and a half of the body (0.227 m)
  // Fallback size bands (metres tall) for things sizes.json does not list (b-roll icons, a film's own parts).
  const BANDS = Object.freeze({ hand_prop: [0.10, 0.30], pet: [0.25, 0.60], furniture: [0.75, 1.20], vehicle: [1.50, 3.20], building_tree: [3.50, 6.00], person: [0.9, 1.95] });
  // The 20 ready places (engine/cartoon/places-kit.js). scripts/physics-broll-test.mjs proves this matches the kit's own flags.
  const PLACES = Object.freeze({
    village_road: 'OUTDOOR', village_home: 'OUTDOOR', school_yard: 'OUTDOOR', classroom: 'INDOOR', bedroom: 'INDOOR', city_street: 'OUTDOOR', park: 'OUTDOOR',
    living_room: 'INDOOR', kitchen: 'INDOOR', market_bazaar: 'OUTDOOR', tea_stall: 'OUTDOOR', office_room: 'INDOOR', hospital_clinic: 'INDOOR', river_ghat: 'OUTDOOR',
    bus_stop: 'OUTDOOR', rooftop: 'OUTDOOR', forest_path: 'OUTDOOR', restaurant_cafe: 'INDOOR', courthouse_hall: 'INDOOR', farm_field: 'OUTDOOR', sea_beach: 'OUTDOOR', mountain_valley: 'OUTDOOR', desert_dunes: 'OUTDOOR',
  });
  const VEHICLES = new Set(['car', 'privateCar', 'policeCar', 'rickshaw', 'cycleRickshaw', 'rickshawVan', 'ambulance', 'bicycle', 'motorbike', 'bullockCart', 'cngAuto', 'easyBikeAuto', 'leguna', 'microbus', 'pickupVan', 'localBus', 'bus', 'doubleDeckerBus', 'truck', 'fireTruck', 'tractorTiller', 'metroCoach', 'trainCoach', 'boat', 'ship', 'launch', 'plane', 'helicopter']);
  const BIG_ANIMALS = new Set(['cow', 'horse', 'buffalo', 'elephant', 'tiger', 'goat', 'camel', 'deer']);
  const PETS = new Set(['cat', 'dog', 'goat', 'hen', 'duck', 'rabbit', 'squirrel', 'mongoose', 'parrot', 'pigeon', 'crow']);
  const SURFACES = ['table', 'diningTable', 'officeDesk', 'schoolDesk', 'teacherTable', 'restaurantTable', 'meetingTable', 'shopCounter', 'bedsideTable', 'labBench', 'teaStall', 'teaCart', 'tvStand'];
  const WEATHER = new Set(['rain', 'storm', 'thunder', 'clouds', 'fog', 'snow', 'rainfall', 'lightning']);
  const mid = (v) => (Array.isArray(v) ? (v.length === 3 ? v[1] : (v[0] + v[v.length - 1]) / 2) : v);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round = (v, n = 3) => Math.round(v * 10 ** n) / 10 ** n;
  let NODE_DATA = null;
  const data = (d) => d || NODE_DATA || root.ZWORLD_DATA || { sizes: { items: {} } };
  const itemOf = (id, d) => data(d).sizes?.items?.[id] || null;

  // ---------- classification ----------
  function realRange(id, d) { const it = itemOf(id, d); if (!it || it.height == null) return null; const h = it.height; return Array.isArray(h) ? [h[0], mid(h), h[h.length - 1]] : [h, h, h]; }
  function classOf(id, d, hint) {
    if (hint && BANDS[hint]) return hint;
    const r = realRange(id, d), m = r ? r[1] : null, it = itemOf(id, d);
    if (VEHICLES.has(id)) return 'vehicle';
    if (PETS.has(id)) return 'pet';
    if (m == null) return 'hand_prop';
    if (m >= 3.5) return 'building_tree';
    if (it?.anchor === 'held' || it?.anchor === 'worn' || m < 0.35) return 'hand_prop';
    if (m <= 1.3) return 'furniture';
    return m >= 1.5 && m <= 4.5 && /vehicle|bus|truck|car|van|cart|rickshaw/i.test(it?.what || '') ? 'vehicle' : 'furniture';
  }
  // The support zone a thing has by its nature (sizes.json anchor), before a shot asks for anything.
  function zoneOf(id, d) {
    const it = itemOf(id, d), a = it?.anchor;
    if (a === 'sky') return ZONES.SKY_FLOATING;
    if (a === 'wall' || a === 'ceiling') return ZONES.WALL_MOUNTED; // fixed to the room's structure
    if (a === 'held' || a === 'worn') return ZONES.HELD_IN_HAND;
    if (a === 'ground') { const r = realRange(id, d); if (r && r[1] < 0.35 && !PETS.has(id)) return ZONES.TABLE_TOP; } // a cup, a phone: on a surface
    return ZONES.GROUNDED; // ground, water surface, far scenery, unknown things
  }
  function outdoorOnly(id, d) {
    if (WEATHER.has(id) || VEHICLES.has(id) || BIG_ANIMALS.has(id)) return true;
    const it = itemOf(id, d); if (!it) return false;
    if (['sky', 'far', 'water'].includes(it.anchor)) return true;
    const r = realRange(id, d); return it.anchor === 'ground' && !!r && r[1] >= 3.5; // tall trees, buildings, poles
  }
  const placeKind = (place) => PLACES[place] || null;
  // A size the world can trust: inside the thing's real range (sizes.json), else its class band; hand props never outgrow a head.
  function saneMetres(id, m, d, hint) {
    const r = realRange(id, d), cls = classOf(id, d, hint), band = r ? [r[0], r[2]] : BANDS[cls];
    let v = Number.isFinite(+m) && +m > 0 ? +m : (r ? r[1] : (band[0] + band[1]) / 2);
    v = clamp(v, band[0], band[1]);
    // a thing smaller than a head in real life (a cup, a phone) or an unknown hand prop can never be drawn bigger than a head
    if (cls === 'hand_prop' && (!r || r[1] <= HEAD)) v = Math.min(v, HEAD);
    return round(v);
  }

  // ---------- shot sanity ----------
  // shot.props: [{ id, x, dz, m, zone, lift, on, by }]  shot.weather: "rain" | { kind }   →   a corrected copy + what was fixed and why
  function sanitizeShot(shot, { data: d, seconds } = {}) {
    const s = JSON.parse(JSON.stringify(shot || {})), fixes = [], kind = placeKind(s.place), fix = (rule, evidence) => fixes.push({ rule, evidence });
    const people = s.people || [];
    // P1 indoor/outdoor: outdoor-only things are removed from rooms; indoor weather is seen through a window
    if (s.weather) {
      const w = typeof s.weather === 'string' ? { kind: s.weather } : { ...s.weather };
      const view = kind === 'INDOOR' ? 'window_weather_view' : 'sky';
      if (w.view !== view) { if (kind === 'INDOOR') fix('P1', `${w.kind} inside ${s.place} (indoors) is shown through a window`); w.view = view; }
      s.weather = w;
    }
    const props = [];
    for (const p0 of s.props || []) {
      const p = { ...p0 };
      if (!p.id) { fix('P0', 'a prop without an id was dropped'); continue; }
      if (kind === 'INDOOR' && outdoorOnly(p.id, d)) {
        if (WEATHER.has(p.id)) { s.weather = { kind: p.id === 'rainfall' ? 'rain' : p.id, view: 'window_weather_view' }; fix('P1', `${p.id} inside ${s.place} became a window weather view`); }
        else fix('P1', `${p.id} cannot be inside ${s.place} (an outdoor-only thing): removed`);
        continue;
      }
      const natural = zoneOf(p.id, d);
      // P2 zones: a declared zone may narrow the nature (a phone in a hand) but never defy gravity
      let zone = ZONES[p.zone] ? p.zone : natural;
      if (zone === ZONES.SKY_FLOATING && natural !== ZONES.SKY_FLOATING) { fix('P2', `${p.id} is a ${natural.toLowerCase()} thing: it cannot float in the sky`); zone = natural; }
      if (zone === ZONES.GROUNDED && natural === ZONES.SKY_FLOATING) zone = natural;
      p.zone = zone;
      if (zone === ZONES.GROUNDED && p.lift) { fix('P2', `${p.id} floated ${p.lift} m above the ground: put down on ground_y`); p.lift = 0; }
      if (p.dz != null && (p.dz < -1.5 || p.dz > 12)) { const v = clamp(p.dz, -1.5, 12); fix('P2', `${p.id} at depth ${p.dz} m is off the ground plane: moved to ${v} m`); p.dz = v; }
      // P3 sizes
      const m = saneMetres(p.id, p.m, d, p.cls);
      if (p.m != null && Math.abs(m - p.m) > 1e-6) fix('P3', `${p.id} asked for ${p.m} m; drawn at ${m} m, inside its real size${m <= HEAD ? ' (never bigger than a head)' : ''}`);
      p.m = m;
      props.push(p);
    }
    // P2 supports: held things need a hand, table-top things need a surface
    for (const p of props) {
      if (p.zone === ZONES.HELD_IN_HAND) {
        if (people.some((q) => q.who === p.by)) continue;
        if (people.length) { p.by = people[0].who; fix('P2', `${p.id} is held: given to ${p.by}`); continue; }
        p.zone = ZONES.TABLE_TOP; fix('P2', `${p.id} is held but nobody is in the shot: put on a surface`);
      }
      if (p.zone === ZONES.TABLE_TOP) {
        const surf = (i) => props[i] && SURFACES.includes(props[i].id);
        if (Number.isInteger(p.on) && surf(p.on)) continue;
        let i = props.findIndex((q) => SURFACES.includes(q.id));
        if (i < 0) { props.push({ id: kind === 'OUTDOOR' ? 'teaCart' : 'table', x: p.x ?? 0, dz: p.dz ?? 1.5, zone: ZONES.GROUNDED, m: saneMetres(kind === 'OUTDOOR' ? 'teaCart' : 'table', null, d), added: true }); i = props.length - 1; fix('P2', `${p.id} needs a surface: a ${props[i].id} was put under it`); }
        else fix('P2', `${p.id} rests on the ${props[i].id}`);
        p.on = i; p.x = props[i].x ?? 0; p.dz = props[i].dz ?? 1.5;
      }
    }
    if (s.props || props.length) s.props = props;
    // P4 facing: people standing together in a shot face each other (unless the scene says one looks away)
    const still = people.filter((q) => !['walk', 'run'].includes(q.do) && !q.lookAway);
    if (people.length >= 2) for (const q of still) {
      const others = people.filter((o) => o !== q && !o.lookAway); if (!others.length) continue; // someone looking away is not a partner
      const near = others.reduce((a, o) => (Math.abs((o.x ?? 0) - (q.x ?? 0)) < Math.abs((a.x ?? 0) - (q.x ?? 0)) ? o : a), others[0]);
      const dx = (near.x ?? 0) - (q.x ?? 0); if (Math.abs(dx) < 1e-6) continue;
      const want = dx > 0 ? 1 : -1;
      if (q.facing !== want) { if (q.facing != null) fix('P4', `${q.who} turned their back on ${near.who}: now faces them`); q.facing = want; }
    }
    // P5 gait: a walk faster than people walk becomes a run; a run faster than people run is shortened
    if (Number.isFinite(seconds)) for (const q of people) {
      if (!['walk', 'run'].includes(q.do) || q.to == null) continue;
      const T = Math.max(0.5, seconds - 0.2), dist = Math.abs(q.to - (q.x ?? 0)), v = dist / T;
      if (q.do === 'walk' && v > GAIT.walk.max) { fix('P5', `${q.who} would walk ${round(v, 2)} m/s (people walk ≤ ${GAIT.walk.max}): runs instead`); q.do = 'run'; }
      if (q.do === 'run' && v > GAIT.run.max) { const to = round((q.x ?? 0) + Math.sign(q.to - (q.x ?? 0)) * GAIT.run.max * T, 2); fix('P5', `${q.who} would run ${round(v, 2)} m/s (people run ≤ ${GAIT.run.max}): stops at x=${to}`); q.to = to; }
    }
    return { shot: s, fixes };
  }
  // the whole film: each shot's length is the gap to the next shot (the voice is the clock)
  function sanitizeFilm(film, { data: d, duration } = {}) {
    const f = JSON.parse(JSON.stringify(film)), fixes = [];
    const order = (f.shots || []).map((s, i) => ({ s, i })).sort((a, b) => (a.s.at ?? 0) - (b.s.at ?? 0));
    order.forEach(({ s, i }, k) => {
      const end = k + 1 < order.length ? order[k + 1].s.at : duration || (s.at ?? 0) + 3;
      const r = sanitizeShot(s, { data: d, seconds: end - (s.at ?? 0) });
      f.shots[i] = r.shot; for (const x of r.fixes) fixes.push({ shot: i, ...x });
    });
    return { film: f, fixes };
  }

  // ---------- b-roll recipes (broll-kit.js): the same zones, sizes and indoor rules, plus a readable scale ----------
  const SKY_WORDS = /\b(cloud|sun|moon|star|bird|plane|airplane|helicopter|kite|rainbow|lightning|balloon)s?\b/i;
  const MOTIONS = ['zoom', 'pan', 'fall', 'slide', 'bounce'];
  function validateRecipe(recipe, { data: d } = {}) {
    const r = JSON.parse(JSON.stringify(recipe || {})), fixes = [], fix = (rule, evidence) => fixes.push({ rule, evidence });
    const indoor = ['room', 'table'].includes(r.backdrop);
    if (!MOTIONS.includes(r.motion)) { if (r.motion) fix('B1', `motion "${r.motion}" is not one of ${MOTIONS.join(', ')}: pan`); r.motion = 'pan'; }
    let props = Array.isArray(r.props) ? r.props : [];
    if (props.length > 3) { fix('B1', `${props.length} props: a b-roll shows at most 3`); props = props.slice(0, 3); }
    const out = [];
    for (const p0 of props) {
      const p = { ...p0 }, key = p.piece || p.sizeId || null, name = p.label || key || 'prop';
      if (indoor && ((key && outdoorOnly(key, d)) || (!key && SKY_WORDS.test(name)))) { fix('P1', `${name} cannot be inside a room backdrop: removed`); continue; }
      const natural = key && itemOf(key, d) ? zoneOf(key, d) : SKY_WORDS.test(name) ? ZONES.SKY_FLOATING : classOf(key, d, p.cls) === 'hand_prop' ? ZONES.TABLE_TOP : ZONES.GROUNDED;
      if (p.zone && p.zone !== natural && (p.zone === ZONES.SKY_FLOATING || natural === ZONES.SKY_FLOATING)) fix('P2', `${name} is ${natural.toLowerCase()}, not ${String(p.zone).toLowerCase()}`);
      p.zone = natural === ZONES.HELD_IN_HAND ? ZONES.TABLE_TOP : natural; // no hand in a b-roll: a held thing rests on the surface
      if (p.zone === ZONES.TABLE_TOP && !indoor) p.zone = ZONES.GROUNDED; // outdoors there is no table: small things rest on the ground
      const m = saneMetres(key, p.m, d, p.cls || (key ? undefined : 'hand_prop'));
      if (p.m != null && Math.abs(m - p.m) > 1e-6) fix('P3', `${name} asked for ${p.m} m: drawn at ${m} m, inside its real size`);
      p.m = m;
      // buildings, trees and furniture do not fly about: only the camera moves on them
      p.movable = p.zone === ZONES.SKY_FLOATING || !['building_tree', 'furniture'].includes(classOf(key, d, p.cls || (key ? undefined : 'hand_prop')));
      out.push(p);
    }
    // all grounded things share one ground and one scale: one too small to read next to the biggest is left out (its own b-roll)
    const ground = out.filter((p) => p.zone !== ZONES.SKY_FLOATING), big = ground.reduce((a, p) => (p.m > (a?.m || 0) ? p : a), null);
    r.props = out.filter((p) => { if (p.zone === ZONES.SKY_FLOATING || !big || p === big || p.m / (big.m * 2.4) >= 0.04) return true; fix('P3', `${p.label || p.piece} (${p.m} m) is too small to read beside ${big.label || big.piece} (${big.m} m): left out`); return false; });
    if (['fall', 'bounce'].includes(r.motion) && !r.props.some((p) => p.zone !== ZONES.SKY_FLOATING)) { fix('B1', 'only sky things: they drift, they do not fall'); r.motion = 'pan'; }
    if (['fall', 'bounce', 'slide'].includes(r.motion) && r.props.length && !r.props.some((p) => p.movable && p.zone !== ZONES.SKY_FLOATING)) { fix('B1', `${r.props.map((p) => p.label || p.piece).join(', ')} cannot ${r.motion}: the camera zooms instead`); r.motion = 'zoom'; }
    if (!r.props.length) fix('B1', 'no prop survived the checks');
    return { recipe: r, fixes };
  }

  // ---------- motion: closed form in t, so any frame can be drawn alone ----------
  const GAIT = Object.freeze({ walk: { min: 0.3, max: 2.0, step: 0.415 }, run: { min: 2.0, max: 6.5, step: 0.65 } }); // m/s; step length ÷ stature
  // gravity drop from h0 metres (v0 up is positive) with ground bounces losing (1 − e) of their speed: { y, vy, bounces, resting }
  function fall(t, { h0 = 1, v0 = 0, g = G, e = 0.45, rest = 0.12 } = {}) {
    if (t <= 0) return { y: h0, vy: v0, bounces: 0, resting: false };
    let T = t, v = v0, y = h0, n = 0;
    const t1 = (v + Math.sqrt(v * v + 2 * g * y)) / g; // first contact
    if (T < t1) return { y: y + v * T - 0.5 * g * T * T, vy: v - g * T, bounces: 0, resting: false };
    T -= t1; v = e * (g * t1 - v0); n = 1;
    while (v > rest) { const air = (2 * v) / g; if (T < air) return { y: v * T - 0.5 * g * T * T, vy: v - g * T, bounces: n, resting: false }; T -= air; v *= e; n++; }
    return { y: 0, vy: 0, bounces: n, resting: true };
  }
  // a throw from (x0, y0) landing at (x1, y1) after T seconds, metres: { x, y, vx, vy, apex, landed }
  function throwArc(t, { x0 = 0, y0 = 1.4, x1 = 3, y1 = 0, T = 1, g = G } = {}) {
    const vx = (x1 - x0) / T, vy0 = (y1 - y0 + 0.5 * g * T * T) / T, apex = y0 + (vy0 > 0 ? (vy0 * vy0) / (2 * g) : 0);
    const u = clamp(t, 0, T);
    return { x: x0 + vx * u, y: y0 + vy0 * u - 0.5 * g * u * u, vx, vy: t < T ? vy0 - g * u : 0, apex, landed: t >= T };
  }
  // walking or running speed for a person of this stature: the cadence that makes the steps cover the ground
  function gait(speed, stature = REF_HUMAN) {
    const kind = speed > GAIT.walk.max ? 'run' : 'walk', step = GAIT[kind].step * stature, cadence = speed / step; // steps per second
    return { kind, speed, step, cadence, cycle: step > 0 && speed > 0 ? (2 * step) / speed : Infinity, ok: speed >= 0 && speed <= GAIT.run.max };
  }
  const smooth = (u) => { const v = clamp(u, 0, 1); return v * v * v * (v * (6 * v - 15) + 10); }; // starts and stops at rest
  // Browser: a person travelling from px point a to b over t0..t1, with root motion taken from the pose itself. For each 2° of the
  // cycle the engine's own pose says how far the planted heel or toe moves back under the body; the cumulative table is inverted, so
  // the phase at any distance is the one that keeps the contact on the ground in place: no moonwalking, at any speed or easing.
  const CONTACTS = ['heelL', 'heelR', 'toeL', 'toeR'], tables = new WeakMap();
  function rootTable(actor, kind) {
    let c = tables.get(actor); if (!c) tables.set(actor, (c = {}));
    if (c[kind]) return c[kind];
    const N = 180, J = Array.from({ length: N + 1 }, (_, i) => actor.pose(kind, (i * 360) / N).joints), adv = [0];
    for (let i = 0; i < N; i++) {
      const a = J[i], b = J[i + 1], floor = Math.min(...CONTACTS.map((k) => a[k].y)), k = CONTACTS.reduce((m, x) => (a[x].y < a[m].y ? x : m), CONTACTS[0]);
      adv.push(adv[i] + Math.max(0, a[k].z - b[k].z) * (a[k].y <= floor + 1e-9 ? 1 : 0)); // the planted point slides back by exactly the body's advance
    }
    const unit = (actor.H / 27) * (actor.spec?.dna?.scale || 1), cycle = adv[N];
    return (c[kind] = { adv, cycle: Math.max(1e-6, cycle), unit, N });
  }
  function phaseAt(tab, distPx) {
    const u = distPx / tab.unit, n = Math.floor(u / tab.cycle), rem = u - n * tab.cycle, A = tab.adv;
    let lo = 0, hi = tab.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (A[m] <= rem) lo = m; else hi = m; }
    const f = A[hi] > A[lo] ? (rem - A[lo]) / (A[hi] - A[lo]) : 0;
    return ((lo + f) * 360) / tab.N;
  }
  function travel(actor, { from, to, t0 = 0, t1 = 1, kind = 'walk', settle = 0.25 }, t) {
    const u = (t - t0) / Math.max(0.01, t1 - t0), k = smooth(u), x = from.x + (to.x - from.x) * k, y = from.y + (to.y - from.y) * k;
    const dist = Math.hypot(x - from.x, y - from.y), phase = phaseAt(rootTable(actor, kind), dist);
    const moving = actor.pose(kind, phase), w = clamp((t - t1) / settle, 0, 1);
    return { x, y, facing: to.x >= from.x ? 1 : -1, phase, pose: w > 0 ? actor.blend(moving, actor.pose('stand'), w) : moving, arrived: u >= 1 };
  }
  // Browser: a library piece whose base sits exactly at (x, y) px and that really draws hpx tall (measured, then redrawn once)
  function drawAt(layer, id, x, y, hpx, seed = 1, options = {}) {
    const ZS = root.ZS, info = ZS?.info?.[id] || {}, g = root.ZC.el('g', { 'data-phys': id }, layer);
    if (typeof ZS?.[id] !== 'function') throw new Error(`ZPHYS.drawAt: no piece "${id}"`);
    const make = (k) => { while (g.firstChild) g.removeChild(g.firstChild); return info.kind === 'prop' ? ZS[id](root.ZC.el('g', { transform: `translate(${x} ${y})` }, g), { ...options, h: hpx * k, seed }) : ZS[id](g, { ...options, x, y, h: hpx * k, seed }); };
    let piece = make(1);
    try { const b = g.getBBox(); if (b.height > 0.5 && Math.abs(b.height / hpx - 1) > 0.02) piece = make(hpx / b.height); } catch { /* no layout outside a browser */ }
    g.tick = piece?.tick; return g;
  }
  // two people in conversation face each other: the facing for a at ax looking at b at bx
  const faceToward = (ax, bx) => (bx >= ax ? 1 : -1);

  root.ZPHYS = { ZONES, BANDS, PLACES, SURFACES, G, HEAD, REF_HUMAN, GAIT, classOf, zoneOf, outdoorOnly, placeKind, saneMetres, realRange, sanitizeShot, sanitizeFilm, validateRecipe, MOTIONS, drawAt, fall, throwArc, gait, travel, smooth, faceToward,
    setData(d) { NODE_DATA = d; } };
})(typeof window !== 'undefined' ? window : globalThis);
