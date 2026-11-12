// ZW: one world scale in metres for a 2D film. A place is seen by one camera: a horizon line, a main floor line and how many
// pixels a metre is on that line. Everything farther away is smaller and higher (toward the horizon), nearer is bigger and lower.
// Pieces, props and people are put in metres and depth; pixels come from here, never from the designer's eye.
//   const Z = ZW.view(W, { horizon: 0.42, floor: 0.72, ppm: 0.2 })   (shares of the frame height, or px; all optional)
//   Z.put("busStop", W.layer("mid"), { x: -1.5, dz: 2, seed: 3 })    x metres right of the middle, dz metres behind the floor line
//   const at = Z.person(spec, { x: 0.8, dz: 1 })  →  ZC.actor(layer, { spec, ...at, view: "side" })
//   Z.contact(piece, "seat")  → { x, y } px of that piece's seat;  Z.at(x, dz) → { x, y, s }  (s = px per metre there)
// Sizes: engine/cartoon/library/sizes.json (real [min, usual, max] metres + contacts), else the cm in the part's own `about`;
// how tall each drawing really comes out for its `h`: engine/cartoon/library/drawn.json (scripts/measure-pieces.mjs).
// Every put is recorded on W.svg.__world for the world gate (sizes against each other, feet on the floor, depth order, cover).
(function (root) {
  const DATA = () => root.ZWORLD_DATA || { sizes: { standards: {}, items: {} }, drawn: {} };
  const mid = (v) => (Array.isArray(v) ? (v.length === 3 ? v[1] : (v[0] + v[v.length - 1]) / 2) : v);

  // the real height of a part (metres): asked for, else sizes.json, else "about 125 cm" / "about 2.4 m" in its own about
  function metresOf(id) {
    const it = DATA().sizes.items?.[id];
    if (it && it.height != null) return { m: mid(it.height), range: it.height, from: "sizes" };
    const about = String(root.ZS?.info?.[id]?.about || "");
    const hi = about.match(/about\s+([\d.]+)\s*(cm|m)\s+(?:high|tall)/i), any = about.match(/about\s+([\d.]+)\s*(cm|m)\b(?!\s*(?:long|across|wide|wingspan))/i), q = hi || any;
    if (q) { const m = Number(q[1]) / (q[2].toLowerCase() === "cm" ? 100 : 1); return { m, range: [m * 0.85, m, m * 1.15], from: "about" }; }
    return null;
  }
  // a person's real height from the cast spec: gender + age (spec.years for an exact age, spec.height in metres to override)
  function statureOf(spec = {}) {
    if (Number(spec.height) > 0.3) return Number(spec.height);
    const g = spec.gender === "male" ? "male" : "female", P = DATA().sizes.standards?.people || {};
    const y = Number(spec.years), age = spec.age || "adult";
    const row = Number.isFinite(y) ? (y < 4 ? "toddler" : y < 7.5 ? "child6" : y < 10.5 ? "child9" : y < 13.5 ? "child12" : y < 18 ? "teen" : y < 60 ? "adult" : "elderly")
      : ({ toddler: "toddler", child: "child9", teen: "teen", elderly: "elderly" }[age] || "adult");
    const fallback = { toddler: 0.9, child6: 1.12, child9: 1.27, child12: 1.46, teen: 1.55, adult: g === "male" ? 1.64 : 1.51, elderly: g === "male" ? 1.6 : 1.47 };
    return mid(P[`${g}.${row}`]) || fallback[row];
  }
  // how many skeleton units this person's crown stands above the floor (the drawn height of a full body)
  function crownU(spec) {
    const A = root.ZANATOMY, bio = root.ZPEOPLE?.biometrics?.(spec) || {}, ps = A.pose({ posture: "stand", profile: bio.profile || "adult" });
    return ps.joints.head.y + A.RADII.head * ps.profile.headScale;
  }

  // built-in pieces sized by their own options (a seat height, a table top, a width) rather than only by h
  const contactY = (it, k, d) => it?.contacts?.[k]?.y ?? d, widthOf = (it, d) => mid(it?.width) || d;
  const OWN = {
    chair: (it, s) => ({ seat: contactY(it, "seat", 0.45) * s }),
    bench: (it, s) => ({ seat: contactY(it, "seat", 0.45) * s, w: widthOf(it, 1.6) * s }),
    table: (it, s, m) => ({ top: m * s, w: widthOf(it, 1.2) * s }),
  };
  const TAKES_W = new Set(["hill", "shop", "sign", "fence", "bed", "sofa", "shelf", "rug", "jars", "book", "paper"]);

  function view(W, o = {}) {
    const h = W.h, w = W.w;
    // horizon and floor in px, or as a share of the frame height (0.42); ppm in px, or as a share of the frame height (0.2)
    const frac = (v, d, max) => (v == null ? d * h : v <= max ? v * h : v);
    // default camera: eye level (1.5 m, Brief 5 standards) 6 m from the floor line; the floor line at 72% of the frame stays above
    // the caption lane (78–92%)
    const horizon = frac(o.horizon, 0.42, 1.5), floor = frac(o.floor, 0.72, 1.5), ppm = frac(o.ppm, 0.2, 3), d0 = o.d0 ?? 6, cx = o.cx ?? w / 2;
    if (!(floor > horizon)) throw new Error("ZW.view: the floor line must be below the horizon (floor > horizon).");
    const f = ppm * d0, camH = (floor - horizon) / ppm; // the lens (px) and the camera's height above the floor (m)
    const log = (W.svg.__world ||= { view: null, things: [] });
    log.view = { horizon, floor, ppm, d0, camH };
    const at = (x = 0, dz = 0) => {
      const d = d0 + dz; if (!(d > 0.5)) throw new Error(`ZW: dz ${dz} puts it behind the camera (the floor line is ${d0} m away; dz must be more than ${(0.5 - d0).toFixed(1)}).`);
      const s = f / d; return { x: cx + x * s, y: horizon + camH * s, s, d };
    };
    // depth order inside a layer: a nearer thing is always drawn over a farther one, whatever order the code puts them in
    const slot = (layer, d) => {
      const g = root.ZC.el("g", { "data-d": d.toFixed(3) }, layer);
      for (const k of [...layer.children]) if (k !== g && k.dataset?.d != null && Number(k.dataset.d) < d) { layer.insertBefore(g, k); break; }
      return g;
    };
    // how much taller this person draws than the crown of the skull (hair, a cap, a hijab, a big child's head), measured once per
    // look by drawing them hidden; the stature is to the top of the skull, the hair may add up to 4% on top of it
    const hairs = new Map();
    const hairOf = (spec) => {
      const key = JSON.stringify(spec); if (hairs.has(key)) return hairs.get(key);
      let k = 1;
      try {
        // its own hidden svg (not the film's world): the gates never see this body
        const svg = root.ZC.el("svg", { width: 10, height: 10, style: "position:absolute;left:-9999px;opacity:0" }, root.document.body), tmp = root.ZC.el("g", {}, svg);
        const b = root.ZC.actor(tmp, { spec, H: 27, x: 0, floor: 0, view: "front", id: "__zw_measure" });
        b.draw(b.pose("stand")); const box = tmp.getBBox(); svg.remove();
        for (const rec of ["__anatomy", "__who", "__waist", "__bodies", "__rig", "__reach"]) if (root[rec]) delete root[rec].__zw_measure;
        if (box.height > 1) k = Math.max(0.9, Math.min(1.25, box.height / crownU(spec) / 1.03));
      } catch { /* no layout here */ }
      hairs.set(key, k); return k;
    };
    // a part placed without a colour gets a lively one (the library defaults are muted greys): chosen by its id and seed, so a film
    // looks the same every time. Nature and animals keep their own, and so do parts whose colour means something.
    const LIVELY = ["#e63946", "#f4a261", "#2a9d8f", "#3a86ff", "#ffbe0b", "#8338ec", "#06d6a0", "#ef476f", "#118ab2", "#ff9f1c", "#c8784a", "#5fb3a6"];
    const OWN_COLOUR = new Set(["ambulance", "fireTruck", "policeCar", "zebraCrossing", "trafficLight", "footpath", "roadDivider", "railTrack", "drain", "utilityPole", "metroPillar", "mosquitoNet", "toilet", "shower", "washBasin", "bathroomTap", "kitchenSink", "fridge", "splitAC", "tubeLight", "ceilingFan", "ceilingLamp", "wallSwitchboard", "mirror", "solarPanel", "window", "streetLamp", "blackboard", "computerScreen", "lightning", "rainbow", "rainfall", "fog", "stars"]);
    function livelyColor(id, seed) {
      const inf = root.ZS?.info?.[id]; if (!inf || inf.kind === "prop" || OWN_COLOUR.has(id)) return null;
      const tags = inf.tags || []; if (!tags.length || tags.includes("nature") || tags.includes("extra") || tags.includes("animal")) return null; // an animal keeps its own colours (a camel is never pink)
      let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
      return LIVELY[(h + (Number(seed) || 1) * 7) % LIVELY.length];
    }
    const Z = {
      horizon, floor, ppm, d0, camH, at,
      // metres → px at a depth (a size, not a position)
      px: (m, dz = 0) => m * at(0, dz).s,
      put(id, layer, { x = 0, dz = 0, m, seed = 1, flip, ...rest } = {}) {
        if (rest.color === undefined) { const c = livelyColor(id, seed); if (c) rest.color = c; } else if (rest.color === null) delete rest.color; // color: null keeps the part's own default
        // a film's own part (ZF.part) is put like a library piece: by its id, with or without "ZF.parts."
        id = String(id).replace(/^ZF\.parts\./, "");
        const own0 = typeof root.ZS?.[id] !== "function" && typeof root.ZF?.parts?.[id] === "function";
        const draw = own0 ? root.ZF.parts[id] : root.ZS?.[id]; if (typeof draw !== "function") throw new Error(`ZW.put: no piece "${id}"`);
        if (own0 && !m && !metresOf(id)) throw new Error(`ZW.put("${id}"): it is this film's own part, so give its real height: m: <metres tall>.`);
        const real = m ? { m, range: [m, m, m], from: "asked" } : metresOf(id);
        if (!real) throw new Error(`ZW.put("${id}"): its real size is unknown. Give it as m: <metres tall> (and add it to engine/cartoon/library/sizes.json).`);
        const p = at(x, dz), it = DATA().sizes.items?.[id] || null, dr = DATA().drawn?.pieces?.[id], top = dr?.top || 1; // drawn height per unit of h (1 when not measured yet)
        const prop = (root.ZS.info?.[id] || {}).kind === "prop", hpx = (real.m * p.s) / top, own = OWN[id] ? OWN[id](it, p.s, real.m) : {};
        if (TAKES_W.has(id) && it?.width) own.w = mid(it.width) * p.s;
        // a hanging piece (ceiling fan, ceiling lamp) is fixed at the ceiling above its floor point
        // a wall piece (a clock, a mirror, a sign, a split AC) is mounted at its bottom's height above the floor (contacts.bottom, from the floor)
        const ceiling = rest.ceiling ?? mid(DATA().sizes.standards?.building?.ceiling) ?? 2.9, mount = rest.mount ?? it?.contacts?.bottom?.y ?? 1.2;
        const y = dr?.hang || it?.anchor === "ceiling" ? p.y - ceiling * p.s : it?.anchor === "wall" ? p.y - mount * p.s : p.y;
        const g = slot(layer, p.d), hang = dr?.hang || it?.anchor === "ceiling";
        const make = (k) => { const opts = { h: hpx * k, seed, flip, ...own, ...rest }; return prop ? draw(root.ZC.el("g", { transform: `translate(${p.x} ${y})` }, g), opts) : draw(g, { x: p.x, y, ...opts }); };
        let piece = make(1);
        // measured on the page: drawn once more at the corrected size when this seed draws taller or shorter than measured
        // (a piece sized by its own options, a seat or a width, is left as it is)
        if (!OWN[id]) try {
          const b = g.getBBox(), got = prop ? b.height : hang ? b.y + b.height - y : y - b.y, want = real.m * p.s;
          if (got > 0.5 && Math.abs(got / want - 1) > 0.015) { while (g.firstChild) g.removeChild(g.firstChild); piece = make(want / got); }
        } catch { /* no layout here (not in a browser): the measured table is used as it is */ }
        const thing = { id, kind: prop ? "prop" : "set", x, dz, d: p.d, m: real.m, range: real.range, from: real.from, flip: !!flip, px: { x: p.x, y: p.y, s: p.s, h: real.m * p.s }, item: it, measured: !!dr, anchor: it?.anchor || (dr?.hang ? "ceiling" : "ground") };
        log.things.push(thing);
        return Object.assign(piece || g, { world: thing });
      },
      // where a person stands: the actor's x, floor and H (its size unit) so that it is its real height at that depth.
      // Give the same layer as the pieces (o.layer) to get `slot`: draw the actor in it and it sorts by depth with them.
      person(spec = {}, { x = 0, dz = 0, layer } = {}) {
        const p = at(x, dz), m = statureOf(spec), H = (m * p.s * 27) / (crownU(spec) * hairOf(spec));
        log.things.push({ id: spec.name || "person", kind: "person", x, dz, d: p.d, m, px: { x: p.x, y: p.y, s: p.s, h: m * p.s } });
        return { x: p.x, floor: p.y, H, metres: m, s: p.s, ...(layer ? { slot: slot(layer, p.d) } : {}) };
      },
      // someone walking toward or away from the camera: re-sort their slot at the new depth (and scale them with Z.at(x, dz).s)
      depth(g, dz) { const d = d0 + dz, layer = g.parentNode; g.dataset.d = d.toFixed(3); layer.removeChild(g); layer.appendChild(g);
        for (const k of [...layer.children]) if (k !== g && k.dataset?.d != null && Number(k.dataset.d) < d) { layer.insertBefore(g, k); break; } return g; },
      // a contact of a piece put here (sizes.json), in px: the seat, the table top, the underside of a roof
      contact(piece, name, side = 0.5) {
        const t = piece?.world; if (!t) throw new Error("Z.contact: give a piece made by Z.put");
        const c = t.item?.contacts?.[name]; if (!c) throw new Error(`"${t.id}" has no contact "${name}"${t.item?.contacts ? ` (it has: ${Object.keys(t.item.contacts).join(", ")})` : " (none listed in sizes.json)"}`);
        const xs = Array.isArray(c.x) ? c.x : [c.x || 0, c.x || 0], xm = (xs[0] + (xs[1] - xs[0]) * side) * (t.flip ? -1 : 1), k = t.px.h / t.m;
        return { x: t.px.x + xm * k, y: t.px.y - c.y * k, s: k };
      },
    };
    return Z;
  }

  root.ZW = { view, metresOf, statureOf };
})(typeof window !== "undefined" ? window : globalThis);
