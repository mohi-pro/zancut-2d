// ZanHuman looks: every person is the same rig, dressed from a short spec, so a director writes words, never paths.
//   ZPEOPLE.look(spec) → the rig's P (look) object
//   spec = { gender: "male" | "female", age: "child" | "teen" | "adult" | "elderly", skin: 1–8 (light → deep),
//            build: "thin" | "average" | "heavy", hair: { style, color }, outfit: { type, color, accent },
//            extras: ["glasses", "beard", "moustache", "stubble", "crown", "earrings", "bindi", "bangles", "mole", "freckles", "wrinkles"] }
//   hair.style: crop · side · bun · long · bob · bald · hijab · cap        (hijab covers the hair; cap = prayer cap over short hair)
//   (the director's own: scale = nearer the camera, longer = the torso goes on down past the frame)
//   outfit.type: tshirt · shirt · punjabi · salwar · saree · abaya · uniform · royal (a long coat, deep red and gold by default)
// Proportions and joints come from the one body (rig.js rules R1–R10), so every person keeps the same body rules.
(function (root) {
  // colours from a script may be words: a word we know becomes its colour, anything else falls back, nothing ever breaks the drawing
  const NAMED = { red: "#c8352e", blue: "#2f6fb0", green: "#3d8a4f", yellow: "#e8c23a", orange: "#e0862b", purple: "#6d3bb0", pink: "#e0689a", brown: "#7a5230", black: "#1f1d22", white: "#f4f1ea", grey: "#8a8580", gray: "#8a8580", navy: "#23303f", maroon: "#7a2230", teal: "#2f8f83", cream: "#efe9da", beige: "#d9c7a4", gold: "#d4af37", sky: "#7fb8e0", olive: "#6b7a3a" };
  const col = (v, dflt) => { if (v == null || v === "") return dflt; const s = String(v).trim().toLowerCase(); if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/.test(s)) return s; return NAMED[s] || dflt; };
  const hex = (h) => { const f = h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h; return [1, 3, 5].map((i) => parseInt(f.slice(i, i + 2), 16)); };
  const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, u) => toHex(hex(a).map((v, i) => v + (hex(b)[i] - v) * u));
  // warm skin tones, light → deep (the full human range; 2–4 are the usual Bangladeshi wheatish)
  const SKIN = ["#f6d6be", "#efc09c", "#e8b791", "#d9a074", "#c68a5e", "#a8714a", "#8a5a3a", "#6a4330"];
  const tone = (n) => { const s = SKIN[Math.max(0, Math.min(7, (n || 3) - 1))];
    return { skin: s, shade: mix(s, "#7a3a1c", 0.28), line: mix(s, "#3a1608", 0.55), lidC: mix(s, "#7a3a1c", 0.1), nail: mix(s, "#ffffff", 0.35), lip: mix(s, "#8a2c24", 0.45) }; };
  const HAIR = { black: "#1a1412", dark: "#2a1c16", brown: "#4a2e1e", grey: "#8a8580", white: "#d8d4ce" };

  // faces (head space: the face is about ±90 wide, the crown near −100, the chin near +115)
  const FACE = {
    child: { face: "M-90,-28 C-92,-120 92,-120 90,-28 C90,40 66,98 0,112 C-66,98 -90,40 -90,-28Z", earX: 88, eyeX: 37, eyeY: -4, mouthY: 66, mouthW: 19, nose: "M-3,12 Q-11,36 -1,40 Q8,42 13,35" },
    female: { face: "M-86,-30 C-88,-124 86,-124 86,-30 C86,46 58,102 0,116 C-58,102 -86,46 -86,-30Z", earX: 84, eyeX: 35, eyeY: -6, mouthY: 70, mouthW: 18, nose: "M-2,10 Q-10,38 -1,42 Q7,44 12,37" },
    male: { face: "M-92,-30 C-94,-126 92,-126 92,-30 C92,54 68,112 0,124 C-68,112 -92,54 -92,-30Z", earX: 90, eyeX: 36, eyeY: -6, mouthY: 74, mouthW: 21, nose: "M-3,8 Q-12,40 -1,45 Q9,47 14,39" },
  };
  // hair (front over the forehead, back behind the head, behind = falls behind the shoulders)
  const STYLES = {
    crop: { hairBack: "M-108,-8 C-124,-124 -62,-190 10,-188 C86,-186 126,-124 108,-8Z",
      hairFront: "M-99,-14 C-110,-60 -110,-106 -88,-134 Q-86,-154 -64,-162 Q-56,-182 -30,-182 Q-12,-198 10,-190 Q30,-202 50,-186 Q74,-188 84,-168 Q104,-158 104,-128 C114,-94 108,-52 99,-14 C96,-40 92,-58 86,-70 Q74,-60 62,-44 Q64,-70 50,-86 Q34,-64 12,-48 Q20,-74 4,-90 Q-14,-66 -38,-50 Q-30,-74 -46,-90 Q-64,-68 -82,-50 Q-76,-70 -86,-82 Q-96,-60 -96,-40Z",
      strands: ["M10,-186 C0,-140 -34,-96 -70,-56", "M30,-188 C30,-136 2,-96 -34,-56", "M50,-180 C56,-130 38,-90 12,-54", "M74,-170 C84,-124 76,-84 60,-50", "M-14,-186 C-44,-156 -72,-110 -88,-68", "M92,-140 C100,-110 98,-76 92,-50", "M-46,-170 C-74,-146 -92,-104 -96,-64"],
      shine: ["M-62,-150 C-40,-170 -14,-178 8,-176", "M26,-176 C46,-172 64,-162 76,-150"] },
    side: { hairBack: "M-104,-6 C-118,-118 -60,-172 6,-170 C78,-168 120,-116 104,-6Z",
      hairFront: "M-98,-10 C-106,-84 -70,-152 0,-160 C70,-162 110,-104 100,-10 C97,-42 91,-64 80,-78 C58,-96 26,-100 -14,-92 C-44,-86 -68,-78 -86,-60 C-93,-44 -96,-28 -98,-10Z",
      strands: ["M-40,-156 C-10,-150 40,-130 74,-92", "M-40,-156 C-60,-140 -80,-110 -90,-70", "M-20,-150 C10,-140 50,-118 84,-80", "M-40,-152 C-48,-130 -56,-110 -70,-82"],
      shine: ["M-30,-150 C0,-156 30,-150 56,-136"], part: "M-40,-158 C-42,-140 -44,-120 -46,-96" },
    bun: { hairBack: "M-106,14 C-124,-112 -62,-180 0,-180 C66,-180 124,-114 106,14Z", bun: true,
      hairFront: "M-102,8 C-114,-70 -92,-152 -20,-172 C10,-180 40,-178 58,-170 C98,-152 114,-96 102,8 C98,-30 90,-66 72,-88 C58,-100 42,-104 28,-100 C0,-96 -40,-86 -64,-62 C-84,-42 -94,-18 -102,8Z",
      strands: ["M24,-168 C-10,-162 -62,-132 -88,-56", "M26,-152 C-4,-142 -48,-114 -74,-66", "M28,-132 C4,-124 -32,-102 -60,-72", "M30,-168 C68,-162 98,-122 100,-40", "M32,-150 C62,-142 86,-112 90,-50", "M10,-174 C-30,-170 -80,-140 -98,-60"],
      shine: ["M-66,-138 C-44,-158 -12,-168 14,-168", "M46,-166 C68,-160 86,-146 94,-128"], part: "M26,-174 C27,-150 28,-122 28,-100",
      wisps: ["M-94,-30 C-108,0 -98,30 -108,60", "M-88,-42 C-96,-16 -92,8 -98,28", "M94,-52 C104,-22 98,6 104,32"] },
    long: { hairBack: "M-108,20 C-126,-112 -62,-182 0,-182 C64,-182 126,-112 108,20Z",
      hairBehind: "M-112,-40 C-130,60 -128,180 -140,300 C-100,320 -60,316 -40,300 L40,300 C60,316 100,320 140,300 C128,180 130,60 112,-40Z",
      hairFront: "M-104,40 C-116,-70 -92,-154 -14,-174 C20,-180 50,-176 66,-166 C104,-146 116,-90 104,40 C100,0 92,-50 74,-80 C58,-98 40,-102 24,-98 C-8,-92 -44,-78 -68,-50 C-88,-26 -98,6 -104,40Z",
      strands: ["M20,-170 C-14,-160 -64,-124 -92,-30", "M24,-150 C-6,-138 -50,-104 -78,-40", "M28,-170 C70,-160 100,-110 100,0", "M30,-146 C62,-134 88,-96 92,-20"],
      shine: ["M-60,-140 C-38,-160 -8,-170 18,-168"], part: "M22,-176 C23,-150 24,-124 24,-98",
      wisps: ["M-100,0 C-112,60 -104,120 -118,180", "M100,-6 C112,50 106,110 118,170"] },
    bob: { hairBack: "M-108,20 C-126,-112 -62,-182 0,-182 C64,-182 126,-112 108,20Z",
      hairBehind: "M-112,-40 C-128,30 -126,90 -118,130 C-80,142 80,142 118,130 C126,90 128,30 112,-40Z",
      hairFront: "M-106,60 C-118,-60 -90,-156 0,-170 C90,-156 118,-60 106,60 C100,10 94,-30 84,-58 C60,-50 30,-56 6,-70 C-20,-56 -54,-52 -84,-58 C-94,-30 -100,10 -106,60Z",
      strands: ["M0,-168 C-30,-150 -70,-110 -94,-20", "M0,-168 C30,-150 70,-110 94,-20", "M-30,-160 C-60,-130 -84,-80 -96,10"], shine: ["M-50,-150 C-20,-166 20,-166 50,-150"] },
    // bald: a low band of hair round the sides and the back, rounded at the temples (never pointing up)
    bald: { hairBack: "M-104,26 C-112,-8 -108,-40 -96,-58 C-90,-40 -90,-10 -88,26Z M104,26 C112,-8 108,-40 96,-58 C90,-40 90,-10 88,26Z",
      hairFront: "M-99,14 C-104,-12 -101,-36 -92,-50 C-89,-32 -89,-10 -87,14Z M99,14 C104,-12 101,-36 92,-50 C89,-32 89,-10 87,14Z", strands: [], shine: [] },
  }
  // a man's long hair is shoulder length (a long-haired man's cut): the waist-long fall of "long" reads as a woman at phone size
  STYLES.longMale = { ...STYLES.long,
    hairBehind: "M-110,-40 C-122,10 -120,60 -118,104 C-96,116 -70,112 -56,100 L56,100 C70,112 96,116 118,104 C120,60 122,10 110,-40Z",
    wisps: ["M-100,0 C-108,30 -104,60 -110,90", "M100,-6 C108,24 106,54 112,84"] };
  // a hijab frames the face and falls over the shoulders; a prayer cap sits on short hair
  const HIJAB = (c) => [{ d: "M-120,60 C-138,-120 -64,-196 0,-196 C64,-196 138,-120 120,60 C116,150 70,196 0,202 C-70,196 -116,150 -120,60Z M-80,-40 C-84,-112 84,-112 80,-40 C80,30 56,92 0,104 C-56,92 -80,30 -80,-40Z", fill: c, rule: "evenodd" }, { d: "M-98,-28 C-104,44 -82,112 -44,152 M98,-28 C104,44 82,112 44,152", stroke: "#00000022", w: 5 },
    { d: "M-76,-60 C-60,-100 60,-100 76,-60", stroke: "#ffffff30", w: 4 }];
  const CROWN = (c) => [
    { d: "M-80,-150 L-82,-184 L-56,-214 L-36,-184 L0,-238 L36,-184 L56,-214 L82,-184 L80,-150 C40,-158 -40,-158 -80,-150Z", fill: c },
    { d: "M-81,-168 C-40,-176 40,-176 81,-168 L80,-150 C40,-158 -40,-158 -80,-150Z", fill: mix(c, "#5a3a08", 0.35) },
    { d: "M0,-176 l7,8 -7,8 -7,-8Z", fill: "#c8352e" }, { d: "M-46,-172 l5,6 -5,6 -5,-6Z", fill: "#2f6fb0" }, { d: "M46,-172 l5,6 -5,6 -5,-6Z", fill: "#3d8a4f" },
    { d: "M-61,-214 a5,5 0 1 0 10,0 a5,5 0 1 0 -10,0Z M-5,-238 a5,5 0 1 0 10,0 a5,5 0 1 0 -10,0Z M51,-214 a5,5 0 1 0 10,0 a5,5 0 1 0 -10,0Z", fill: mix(c, "#ffffff", 0.35) }];
  const CAP = (c) => [{ d: "M-82,-112 C-80,-176 80,-176 82,-112 C40,-122 -40,-122 -82,-112Z", fill: c }, { d: "M-70,-128 L70,-128 M-60,-146 L60,-146", stroke: "#00000022", w: 2 }];

  // bodies: torso paths by age and build; arms from the same body (lengths in rig units)
  // waist: how far the body comes in at the waist (1 = straight, as on a man), so a woman's body is never a tube; hips then return from there
  const torsoPath = (w, top, bottom, waist = 1, waistY = top + 250) => { const shoulders = `M${-w},${top + 50} C${-w + 10},${top + 14} ${-w * 0.56},${top + 4} -40,${top} L40,${top} C${w * 0.56},${top + 4} ${w - 10},${top + 14} ${w},${top + 50}`;
    // a man's body: the shoulders are its widest line, the sides come in a little to the waist and run straight down (never a flare:
    // a torso wider at the bottom than at the shoulders reads as a gown, and the hanging arms then lie on the shirt instead of beside it)
    if (waist >= 1) { const side = (s) => `C${s * w * 1.0},${top + 130} ${s * w * 0.95},${waistY - 90} ${s * w * 0.93},${waistY}`;
      return `${shoulders} ${side(1)} L${w * 0.95},${bottom} L${-w * 0.95},${bottom} L${-w * 0.93},${waistY} C${-w * 0.95},${waistY - 90} ${-w},${top + 130} ${-w},${top + 50}Z`; }
    const W = w * waist, H = w * 1.03, hipY = waistY + 130, side = (s) => `C${s * w * 0.98},${top + 130} ${s * W},${waistY - 70} ${s * W},${waistY} C${s * W},${waistY + 60} ${s * H},${hipY - 40} ${s * H},${hipY}`;
    return `${shoulders} ${side(1)} L${H},${Math.max(bottom, hipY)} L${-H},${Math.max(bottom, hipY)} L${-H},${hipY} C${-H},${hipY - 40} ${-W},${waistY + 60} ${-W},${waistY} C${-W},${waistY - 70} ${-w * 0.98},${top + 130} ${-w},${top + 50}Z`; };
  const BODY = { // shoulder half-width, neck top, torso bottom, arm (upper, fore, widths), hand size, figure scale
    child: { w: 128, top: 136, bottom: 520, up: 122, fo: 116, wU: 40, wF: 30, hand: 20, s: 1, sh: [116, 196] },
    teen: { w: 128, top: 140, bottom: 580, up: 140, fo: 132, wU: 38, wF: 29, hand: 19, s: 1.02, sh: [118, 200] },
    adultF: { w: 132, top: 146, bottom: 640, up: 165, fo: 155, wU: 34, wF: 28, hand: 18, s: 1.05, sh: [120, 208] },
    adultM: { w: 142, top: 150, bottom: 660, up: 170, fo: 160, wU: 40, wF: 32, hand: 20, s: 1.1, sh: [128, 214] },
  };
  const BUILD = { thin: 0.9, slim: 0.9, average: 1, stocky: 1.12, heavy: 1.2 };

  // H15–H21: canonical 3D biometric profile + 4-zone garment mapping for ZANATOMY
  function biometrics(spec = {}) {
    const age = spec.age || "adult", g = spec.gender || "female", build = spec.build || "average";
    const base = age === "child" ? "child" : age === "elderly" ? "elderly" : (build === "heavy" && g === "male" ? "athletic" : "adult");
    // the measured bodies (engine/cartoon/bodies.js from the body chart): one profile per gender × age × build; spec.years picks the age
    const ZB = root.ZBODIES, y = Number(spec.years);
    const row = Number.isFinite(y) ? (y < 4 ? "toddler" : y < 7.5 ? "child6" : y < 10.5 ? "child9" : y < 13.5 ? "child12" : y < 18 ? "teen" : y < 60 ? "adult" : "elder")
      : ({ toddler: "toddler", child: "child9", teen: "teen", elderly: "elder" }[age] || "adult");
    const set = ZB?.rows?.[`${g === "male" ? "male" : "female"}.${row}`];
    const mixP = (a, b, k) => Object.fromEntries(Object.keys(a).map((n) => [n, typeof a[n] === "number" ? a[n] + (b[n] - a[n]) * k : a[n]]));
    const measured = set && (build === "stocky" ? mixP(set.average, set.heavy, 0.5) : set[{ thin: "thin", slim: "thin", heavy: "heavy" }[build] || "average"]);
    const profile = measured ? { ...measured, ...(spec.profile || {}) } : {
      base,
      ...(age === "teen" ? { scaleY: 0.88, scaleWidth: 0.9, headScale: 1.05 } : {}),
      ...(build === "thin" || build === "slim" ? { limbThick: base === "child" ? 0.8 : 0.88, scaleWidth: base === "child" ? 0.75 : 0.92 } : {}),
      ...(build === "stocky" ? { limbThick: 1.1, scaleWidth: 1.07 } : {}),
      ...(build === "heavy" && base !== "athletic" ? { limbThick: 1.18, scaleWidth: 1.12 } : {}),
      shoulderWidth: g === "male" ? 1.04 : 0.96,
      hipWidth: g === "female" ? 1.04 : 0.98,
      ...(spec.profile || {}),
    };
    const out = spec.outfit || {}, type = String(out.type || (age === "child" || age === "teen" ? "tshirt" : g === "male" ? "shirt" : "salwar")).toLowerCase();
    // every outfit name a script may use → the garment the body wears (traditional long tunics keep the 4-zone drape)
    const garmentMap = { punjabi: "punjabi", panjabi: "punjabi", kurta: "punjabi", sherwani: "punjabi", royal: "punjabi", thobe: "punjabi", salwar: "kameez", shalwar: "kameez", kameez: "kameez", saree: "sari", sari: "sari", lehenga: "sari", shirt: "shirt_pant", tshirt: "shirt_pant", uniform: "shirt_pant", suit: "shirt_pant", blazer: "shirt_pant", coat: "shirt_pant", abaya: "abaya", burqa: "abaya", none: "none" };
    const garment = out.garment || garmentMap[type] || "punjabi";
    const cloth = {
      stiffness: out.stiffness ?? (type === "saree" || type === "sari" ? 0.25 : 0.35),
      chaakHeight: out.chaakHeight ?? (garment === "abaya" || garment === "sari" ? 0.2 : 0.85),
      lengthScale: out.lengthScale ?? 1.0,
      short: type === "tshirt" || type === "uniform", // short sleeves, no front placket
    };
    return { profile, garment, cloth };
  }

  // a school bag / backpack is part of the person (spec.bag: true or { color }), so it follows every pose and view
  // shoes differ from person to person (one brown pair for everyone looked like a uniform): a real shoe colour chosen from the
  // person's own spec, so the same person always wears the same pair; outfit.shoe chooses it
  const SHOES = ["#5a3a24", "#1f1f24", "#8a5a34", "#3d3f47", "#7b2318", "#25344f", "#e9e5dc", "#6b5d3f", "#a0522d", "#4a2f45"];
  const shoeOf = (spec) => { let h = 7; for (const c of JSON.stringify([spec.gender, spec.age, spec.skin, spec.hair, spec.outfit?.type, spec.outfit?.color, spec.outfit?.pants])) h = (h * 31 + c.charCodeAt(0)) >>> 0; return SHOES[h % SHOES.length]; };
  const bagOf = (spec) => { const b = spec.bag ?? spec.outfit?.bag; if (!b) return null; const color = col(typeof b === "object" ? b.color : null, "#2d8fc4"); return { color, strap: mix(color, "#000000", 0.22), shade: mix(color, "#000000", 0.38), light: mix(color, "#ffffff", 0.16) }; };
  function look(spec = {}) {
    const age = spec.age || "adult", g = spec.gender || "female", kid = age === "child" || age === "teen";
    const T = tone(spec.skin), ex = new Set(spec.extras || []);
    const F = FACE[kid ? "child" : g === "male" ? "male" : "female"];
    const B = BODY[age === "child" ? "child" : age === "teen" ? "teen" : g === "male" ? "adultM" : "adultF"], bw = BUILD[spec.build] || 1;
    const hs = spec.hair || {}, longMan = g === "male" && !kid && hs.style === "long";
    const style = (longMan && STYLES.longMale) || STYLES[hs.style === "hijab" || hs.style === "cap" ? (g === "male" ? "side" : "bun") : hs.style] || STYLES[kid ? (g === "male" ? "crop" : "long") : g === "male" ? "side" : "bun"];
    const hair = HAIR[hs.color] || col(hs.color, age === "elderly" ? HAIR.grey : HAIR.black);
    const out = spec.outfit || {}, rawType = String(out.type || (kid ? "tshirt" : g === "male" ? "shirt" : "salwar")).toLowerCase();
    const TYPE_MAP = { kurta: "punjabi", panjabi: "punjabi", sherwani: "punjabi", royal: "punjabi", thobe: "punjabi", sari: "saree", lehenga: "saree", shalwar: "salwar", kameez: "salwar", suit: "shirt", blazer: "shirt", coat: "shirt" };
    const type = TYPE_MAP[rawType] || rawType;
    const royal = rawType === "royal"; // a king's or queen's long coat: deep red and gold unless the spec gives its own colours
    const cloth = col(out.color, null) || (royal ? "#8e1f2c" : null) || { tshirt: "#3c7cc8", shirt: "#e8e2d4", punjabi: "#f1ede4", salwar: "#4e8a5c", saree: "#b0344a", abaya: "#2c2a33", uniform: "#f4f4f0" }[type] || "#e8e2d4";
    const accent = col(out.accent, null) || (royal ? "#e2b23c" : null) || mix(cloth, "#ffffff", 0.35), darker = mix(cloth, "#000000", 0.2);
    const isJacket = ["suit", "blazer", "coat"].includes(rawType); // a suit's trousers match its jacket, a blazer's don't
    const pants = col(out.pants, null) || (type === "saree" || type === "abaya" || rawType === "suit" ? cloth : type === "punjabi" || type === "salwar" ? "#f8fafc" : "#3a4150"); // a saree or abaya has no trousers of another colour
    const bio = biometrics(spec);
    const hasBeard = Boolean(ex.has("beard") || hs.beard || spec.beard);
    const w = B.w * bw;
    const P = {
      ...T, hair, iris: "#2f1c10", blush: kid ? 0.18 : 0.15, ...F, s: B.s * (spec.scale || 1), brow: mix(hair, "#000000", 0.2), browW: g === "male" ? 8 : kid ? 7 : 6, browY: g === "male" ? -30 : -32,
      lash: g === "female" ? 4 : 3.4, flick: g === "female" && !kid,
      ...style, torso: torsoPath(w, B.top, B.bottom + (spec.longer || 0) /* longer: someone near the camera */, g === "female" ? (kid ? 0.92 : spec.build === "heavy" || spec.build === "stocky" ? 0.9 : 0.8) : 1, B.top + (B.bottom - B.top) * 0.5),
      cloth, pants, accent, clothLine: darker, shoe: col(out.shoe, shoeOf(spec)),
      cap: hs.style === "cap", capColor: col(hs.capColor || out.capColor, "#f8fafc"), beard: hasBeard,
      biometrics: bio, bag: bagOf(spec), jacket: isJacket, tie: col(out.tie || out.accent, "#8a2f2f"), strandC: mix(hair, "#000000", 0.16), hairShine: mix(hair, "#ffffff", 0.22),
      clothShade: g === "male" || kid ? "url(#g-shadeB)" : "url(#g-shadeG)",
      overFace: [], overHead: [],
      hairStyle: hs.style && STYLES[hs.style] ? hs.style : hs.style === "hijab" || hs.style === "cap" ? (g === "male" ? "side" : "bun") : kid ? (g === "male" ? "crop" : "long") : g === "male" ? "side" : "bun",
      // a long-haired man with no beard gets stubble, so his jaw reads as a man's even in a wide shot
      glasses: ex.has("glasses"), moustache: ex.has("moustache"), stubble: ex.has("stubble") || (longMan && !hasBeard), hairLen: longMan ? 0.3 : 1,
    };
    // a short top (T-shirt, shirt, jacket) ends at the hip, with the person's own trousers below it, as on the full body; a long garment
    // (punjabi, salwar, saree, abaya, uniform) stays one piece of cloth down past the frame
    if (type === "tshirt" || type === "shirt") { const hemY = B.top + (B.bottom - B.top) * 0.8, end = B.bottom + (spec.longer || 0) + 40, hw = w * 0.97;
      P.hemY = hemY; P.pantsD = `M${-hw},${hemY - 4} L${hw},${hemY - 4} L${hw},${end} L${-hw},${end}Z`; P.flyD = `M0,${hemY + 6} L0,${end}`; }
    if (hs.style === "hijab") { P.hairFront = "M0,0Z"; P.strands = []; P.shine = []; P.wisps = []; P.part = null; P.bun = false; P.hairBack = "M0,0Z"; P.hairBehind = null; P.bun = false; P.earring = false; P.hijabColor = hs.color && !HAIR[hs.color] ? col(hs.color, accent) : accent; P.overHead = HIJAB(P.hijabColor); P.brow = "#2a1c14"; } // the brows keep a hair colour, never the hijab's
    if (hs.style === "cap") P.overHead = CAP(col(out.accent, "#f4f1ea"));
    if (ex.has("crown")) { P.crown = col(spec.crownColor, "#e8b828"); P.overHead = [...(hs.style === "cap" ? [] : P.overHead), ...CROWN(P.crown)]; }
    // clothes
    const sleeve = { tshirt: [0.45], uniform: [0.45], shirt: [1, 0.92], punjabi: [1, 0.88], salwar: [1, 0.55], saree: [0.3], abaya: [1, 0.92] }[type] || [1, 0.88];
    if (type === "tshirt" || type === "uniform") { P.collar = `M-40,${B.top + 2} Q0,${B.top + 40} 40,${B.top + 2}`; P.collarC = darker; }
    if (type === "shirt" || type === "uniform") P.neckline = `M-34,${B.top} L0,${B.top + 46} L34,${B.top}Z`;
    if (isJacket) { P.neckline = `M-40,${B.top} L0,${B.top + 190} L40,${B.top}Z`; P.necklineC = "#f4f4f0"; P.tieD = `M-11,${B.top + 6} L11,${B.top + 6} L15,${B.top + 150} L0,${B.top + 180} L-15,${B.top + 150}Z`; P.lapels = [`M-40,${B.top} L-86,${B.top + 96} L0,${B.top + 190}Z`, `M40,${B.top} L86,${B.top + 96} L0,${B.top + 190}Z`]; P.jacketLine = `M0,${B.top + 190} L0,${B.bottom}`; }
    if (type === "punjabi") { P.neckline = `M-22,${B.top} Q0,${B.top + 22} 22,${B.top}Z`; P.collar = `M0,${B.top + 14} L0,${B.top + 120}`; P.collarC = darker; }
    if (type === "salwar") { P.neckline = `M-38,${B.top} Q0,${B.top + 50} 38,${B.top}Z`; P.orna = `M${-w - 4},${B.top + 68} C-70,${B.top + 154} 70,${B.top + 154} ${w + 4},${B.top + 68} L${w + 14},${B.top + 116} C64,${B.top + 204} -64,${B.top + 204} ${-w - 14},${B.top + 116}Z`; P.ornaC = accent; }
    if (type === "saree") { P.neckline = `M-40,${B.top} Q0,${B.top + 44} 40,${B.top}Z`; P.orna = `M${-w + 6},${B.top + 40} L-40,${B.top + 20} L${w * 1.1},${B.bottom - 40} L${w * 0.4},${B.bottom}Z`; P.ornaC = accent; }
    if (type === "abaya") P.neckline = `M-26,${B.top} Q0,${B.top + 26} 26,${B.top}Z`;
    const trim = type === "salwar" || type === "saree" ? "#d9b45a" : null;
    P.arms = [-1, 1].map((sd) => ({ sh: [sd * B.sh[0] * bw, B.sh[1]], up: B.up, fo: B.fo, wU: B.wU * bw, wF: B.wF * Math.sqrt(bw), sleeve: sleeve[0], ...(sleeve[1] ? { sleeveF: sleeve[1] } : {}), hand: B.hand,
      ...(trim ? { trim } : {}), ...(ex.has("bangles") || type === "salwar" || type === "saree" ? { bangle: true } : {}) }));
    // the face's own marks
    if (ex.has("earrings") || (g === "female" && !kid && hs.style !== "hijab")) P.earring = true;
    if (ex.has("mole")) P.moles = [[g === "female" ? -24 : 46, g === "female" ? 60 : 24, 2.4]];
    if (ex.has("freckles")) P.freckles = [[-44, 18], [-36, 24], [-50, 26], [40, 18]];
    const lines = [];
    if (age === "elderly" || ex.has("wrinkles")) lines.push("M-50,-60 Q0,-68 50,-60", "M-40,-70 Q0,-77 40,-70", "M-30,46 Q-38,60 -33,74", "M30,46 Q38,60 33,74", "M-60,-2 l-8,-4 M-60,4 l-9,0", "M60,-2 l8,-4 M60,4 l9,0", "M-50,8 Q-38,14 -24,9", "M24,9 Q38,14 50,8");
    if (lines.length) P.lines = lines;
    if (ex.has("bindi")) P.overFace.push({ d: "M0,-46 m-4,0 a4,4 0 1,0 8,0 a4,4 0 1,0 -8,0", fill: "#b3202c" });
    if (ex.has("beard")) P.overFace.push({ d: `M-84,10 C-80,70 -50,118 0,${F.mouthY + 60} C50,118 80,70 84,10 C72,50 50,${F.mouthY + 6} 30,${F.mouthY + 12} C12,${F.mouthY + 20} -12,${F.mouthY + 20} -30,${F.mouthY + 12} C-50,${F.mouthY + 6} -72,50 -84,10Z`, fill: hair, opacity: 0.92 });
    if (P.stubble && !P.beard) P.overFace.push({ d: `M-80,20 C-76,74 -46,114 0,${F.mouthY + 50} C46,114 76,74 80,20 C60,70 30,${F.mouthY + 26} 0,${F.mouthY + 28} C-30,${F.mouthY + 26} -60,70 -80,20Z`, fill: hair, opacity: 0.22 });
    if (ex.has("moustache") || ex.has("beard")) P.overFace.push({ d: `M-30,${F.mouthY - 8} C-18,${F.mouthY - 22} -4,${F.mouthY - 18} 0,${F.mouthY - 12} C4,${F.mouthY - 18} 18,${F.mouthY - 22} 30,${F.mouthY - 8} C16,${F.mouthY - 10} 6,${F.mouthY - 8} 0,${F.mouthY - 6} C-6,${F.mouthY - 8} -16,${F.mouthY - 10} -30,${F.mouthY - 8}Z`, fill: hair });
    if (ex.has("glasses")) { const y = F.eyeY, x = F.eyeX; P.overFace.push({ d: `M${-x - 27},${y - 16} h54 a6,6 0 0 1 6,6 v18 a14,14 0 0 1 -14,14 h-38 a14,14 0 0 1 -14,-14 v-18 a6,6 0 0 1 6,-6Z M${x - 27},${y - 16} h54 a6,6 0 0 1 6,6 v18 a14,14 0 0 1 -14,14 h-38 a14,14 0 0 1 -14,-14 v-18 a6,6 0 0 1 6,-6Z M${-x + 27},${y - 6} Q0,${y - 14} ${x - 27},${y - 6}`, stroke: "#2a2420", w: 4, fill: "#ffffff14" }); }
    if (age === "elderly") { P.blush = 0.1; P.browW = Math.max(5, P.browW - 1); }
    return P;
  }
  root.ZPEOPLE = { look, biometrics, SKIN, HAIR, STYLES: Object.keys(STYLES).concat(["hijab", "cap"]) };
})(typeof window !== "undefined" ? window : globalThis);
