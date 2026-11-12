// Ready places for Zancut 2D: composed by code from the library's set pieces, no AI. Each place is ZF.place(id, meta, fn)
// (see zc.js). A film's edit/film-kit.js = its cast + this file. Metres: x right of the middle, dz behind the floor line.
// Add a place = add one ZF.place block here; the scene file then says "place": "<id>".
ZF.place("village_road", { views: ["wide", "reverse"], world: { wide: { horizon: 0.42, floor: 0.8, ppm: 0.3 }, reverse: { horizon: 0.44, floor: 0.8, ppm: 0.3 } }, spots: { left: { x: -2.2, dz: 1 }, right: { x: 2.2, dz: 1 }, mid: { x: 0, dz: 1 } } }, (W, o) => {
  const Z = o.Z, far = W.layer("far"), L = o.layer, f = o.view === "reverse" ? -1 : 1;
  ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: "#79bfe6", bottom: "#fde7bf" });
  ZS.sun(W.layer("sky"), { x: W.w * 0.78, y: Z.horizon * 0.45, r: 64 });
  ZS.cloud(W.layer("sky"), { x: W.w * 0.2, y: Z.horizon * 0.35, h: 70, seed: 2 }); ZS.cloud(W.layer("sky"), { x: W.w * 0.6, y: Z.horizon * 0.2, h: 55, seed: 5 });
  ZS.hill(far, { x: W.w * 0.2, y: Z.horizon + 6, w: W.w * 0.9, h: 170, seed: 1, color: "#8bb98a" }); ZS.hill(far, { x: W.w * 0.85, y: Z.horizon + 6, w: W.w * 0.8, h: 130, seed: 4, color: "#7fae83" });
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#8fbf62", seed: 3, marks: 0.2 });
  Z.put("mudPath", L, { x: 0, dz: 0, seed: 1 });
  Z.put("mangoTree", L, { x: -4.5 * f, dz: 5, seed: 2 }); Z.put("tinHouse", L, { x: 5.5 * f, dz: 6, seed: 1 }); Z.put("coconutPalm", L, { x: -7 * f, dz: 9, seed: 3 }); Z.put("bushRow", L, { x: 3 * f, dz: 3.5, seed: 2 });
  Z.put("grassTuft", W.layer("front"), { x: -2 * f, dz: -1.2, seed: 4 });
  return {};
});
ZF.place("village_home", { views: ["wide", "close"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 }, close: { horizon: 0.4, floor: 0.82, ppm: 0.3 } }, spots: { door: { x: 1.8, dz: 1.5 }, yard: { x: -1, dz: 1 } } }, (W, o) => {
  const Z = o.Z, far = W.layer("far"), L = o.layer;
  ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: "#86c6ea", bottom: "#fde9c4" });
  ZS.cloud(W.layer("sky"), { x: W.w * 0.35, y: Z.horizon * 0.4, h: 60, seed: 3 });
  ZS.hill(far, { x: W.w * 0.5, y: Z.horizon + 6, w: W.w * 1.1, h: 140, seed: 2, color: "#86b684" });
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#b99a73", seed: 2, marks: 0.3 });
  Z.put("mudHouse", L, { x: 1.5, dz: 3, seed: 1 }); Z.put("mangoTree", L, { x: -4, dz: 5, seed: 4 }); Z.put("bananaPlant", L, { x: 5, dz: 4, seed: 2 }); Z.put("tubewell", L, { x: -2.2, dz: 2.2 });
  return {};
});
ZF.place("school_yard", { views: ["wide", "reverse"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 } }, spots: { gate: { x: 0, dz: 2.5 }, yard: { x: -1.5, dz: 1 } } }, (W, o) => {
  const Z = o.Z, far = W.layer("far"), L = o.layer;
  ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: "#7dc2e8", bottom: "#fdebc8" });
  ZS.cloud(W.layer("sky"), { x: W.w * 0.25, y: Z.horizon * 0.35, h: 60, seed: 6 });
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#c9ad86", seed: 5, marks: 0.2 });
  Z.put("schoolFront", L, { x: 0, dz: 8, seed: 1 }); Z.put("boundaryWall", L, { x: -3, dz: 5, seed: 1 }); Z.put("gate", L, { x: 3.5, dz: 4.5, seed: 1 }); Z.put("swingSet", L, { x: -5, dz: 3, seed: 1 });
  return {};
});
ZF.place("classroom", { indoors: true, views: ["wide", "close"], world: { wide: { horizon: 0.4, floor: 0.78, ppm: 0.3 }, close: { horizon: 0.4, floor: 0.8, ppm: 0.3 } }, spots: { desk: { x: -1.2, dz: 1.2 }, front: { x: 1.8, dz: 1 } } }, (W, o) => {
  const Z = o.Z, L = o.layer;
  ZS.wall(W.layer("far"), { w: W.w * 3, y: 0, h: Z.floor, color: "#f0e2c8", seed: 2 }); ZS.floor(L, { w: W.w * 3, y: Z.floor - 20, h: W.h, color: "#b58a62", seed: 3, marks: 0.4 });
  Z.put("blackboard", W.layer("far"), { x: 1.5, dz: 6 }); Z.put("window", W.layer("far"), { x: -3.5, dz: 6 }); Z.put("wallClock", W.layer("far"), { x: 0, dz: 6 }); Z.put("schoolDesk", L, { x: -1.5, dz: 2.2 }); Z.put("schoolDesk", L, { x: 0.6, dz: 2.2 }); Z.put("teacherTable", L, { x: 2.8, dz: 4 });
  return {};
});
ZF.place("bedroom", { indoors: true, views: ["wide", "close"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 }, close: { horizon: 0.4, floor: 0.82, ppm: 0.3 } }, spots: { bed: { x: -1.5, dz: 2 }, door: { x: 3, dz: 1.5 } } }, (W, o) => {
  const Z = o.Z, L = o.layer;
  ZS.wall(W.layer("far"), { w: W.w * 3, y: 0, h: Z.floor, color: "#ead9bf", seed: 4 }); ZS.floor(L, { w: W.w * 3, y: Z.floor - 20, h: W.h, color: "#a97b57", seed: 6, marks: 0.4 });
  Z.put("window", W.layer("far"), { x: 1.6, dz: 5 }); Z.put("curtains", W.layer("far"), { x: 1.6, dz: 5 }); Z.put("bookshelf", L, { x: 3.4, dz: 4 }); Z.put("bedsideTable", L, { x: -0.2, dz: 3 }); Z.put("wallClock", W.layer("far"), { x: -2, dz: 5 });
  return {};
});
ZF.place("city_street", { views: ["wide", "reverse"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 } }, spots: { walk: { x: 0, dz: 1 }, stop: { x: -2, dz: 2.5 } } }, (W, o) => {
  const Z = o.Z, far = W.layer("far"), L = o.layer;
  ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: "#8ec9ea", bottom: "#fdebd0" });
  Z.put("skyscraper", far, { x: -4, dz: 24, seed: 1 }); Z.put("officeTower", far, { x: 6, dz: 20, seed: 2 });
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#7f8187", seed: 7, marks: 0.1 });
  Z.put("footpath", L, { x: 0, dz: 5 }); Z.put("marketStreet", L, { x: 0, dz: 8 }); Z.put("streetLamp", L, { x: -3, dz: 3 }); Z.put("busStop", L, { x: 3.4, dz: 3 }); Z.put("trafficLight", L, { x: 5, dz: 2 });
  return {};
});
ZF.place("park", { views: ["wide", "reverse"], world: { wide: { horizon: 0.42, floor: 0.8, ppm: 0.3 } }, spots: { bench: { x: -1.5, dz: 1.5 }, path: { x: 1.5, dz: 1 } } }, (W, o) => {
  const Z = o.Z, far = W.layer("far"), L = o.layer;
  ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: "#80c5ea", bottom: "#fcebc9" });
  ZS.cloud(W.layer("sky"), { x: W.w * 0.7, y: Z.horizon * 0.3, h: 65, seed: 8 });
  ZS.hill(far, { x: W.w * 0.4, y: Z.horizon + 6, w: W.w, h: 120, seed: 3, color: "#7fb07f" });
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#88bb5e", seed: 9, marks: 0.2 });
  Z.put("footpath", L, { x: 1.5, dz: 3 }); Z.put("banyanTree", L, { x: -5, dz: 7, seed: 1 }); Z.put("flowerBed", L, { x: 4, dz: 4, seed: 2 }); Z.put("streetLamp", L, { x: 3, dz: 6 });
  ZS.bench(L, { x: Z.at(-3.5, 2).x, y: Z.at(-3.5, 2).y, w: 3.2 * Z.at(-3.5, 2).s, seat: 0.45 * Z.at(-3.5, 2).s, seed: 1 });
  return {};
});
// interiors in the saturated wall colours of the reference cartoons (pink, green), built from the library's furniture
ZF.place("living_room", { indoors: true, views: ["wide", "close"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 }, close: { horizon: 0.4, floor: 0.82, ppm: 0.3 } }, spots: { sofa: { x: -1.5, dz: 2 }, door: { x: 2.5, dz: 1.5 } } }, (W, o) => {
  const Z = o.Z, L = o.layer;
  ZS.wall(W.layer("far"), { w: W.w * 3, y: 0, h: Z.floor, color: "#c95a7c", seed: 3 }); ZS.floor(L, { w: W.w * 3, y: Z.floor - 20, h: W.h, color: "#b0805a", seed: 4, marks: 0.3 });
  Z.put("door", W.layer("far"), { x: 3.2, dz: 6 }); Z.put("window", W.layer("far"), { x: -2.6, dz: 6 }); Z.put("photoFrame", W.layer("far"), { x: 0.4, dz: 6 }); Z.put("wallClock", W.layer("far"), { x: -0.8, dz: 6 });
  Z.put("sofaSet", L, { x: -1.6, dz: 3.2 }); Z.put("tvStand", L, { x: 1.8, dz: 4.2 });
  return {};
});
ZF.place("kitchen", { indoors: true, views: ["wide", "close"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 }, close: { horizon: 0.4, floor: 0.82, ppm: 0.3 } }, spots: { stove: { x: 1.2, dz: 1.5 } } }, (W, o) => {
  const Z = o.Z, L = o.layer;
  ZS.wall(W.layer("far"), { w: W.w * 3, y: 0, h: Z.floor, color: "#7fae6a", seed: 5 }); ZS.floor(L, { w: W.w * 3, y: Z.floor - 20, h: W.h, color: "#a57a55", seed: 2, marks: 0.3 });
  Z.put("window", W.layer("far"), { x: -1.8, dz: 6 }); Z.put("kitchenShelf", W.layer("far"), { x: 1.6, dz: 6 });
  Z.put("gasStove", L, { x: 1.4, dz: 3.4 }); Z.put("fridge", L, { x: -3.2, dz: 4 }); Z.put("kitchenSink", L, { x: -0.6, dz: 4.2 });
  return {};
});

// Step 3: eleven distinct places, assembled from the existing metre-scaled library. Day/night is shared by ZC.place.
const _placeMeta = (indoors = false) => ({ indoors, times: ["day", "night"], views: ["wide", "close", "reverse"], world: { wide: { horizon: 0.4, floor: 0.8, ppm: 0.3 } }, spots: { left: { x: -1.5, dz: 1 }, right: { x: 1.5, dz: 1 }, mid: { x: 0, dz: 1 } } });
function _placeBase(W, o, { wall, ground = "#b69d79", sky = "#8ac9e8" } = {}) {
  const Z = o.Z, L = o.layer, far = W.layer("far"), sign = o.view === "reverse" ? -1 : 1;
  if (wall) ZS.wall(far, { w: W.w * 3, h: Z.floor, color: wall, seed: 16 });
  else { ZS.sky(W.layer("sky"), { w: W.w * 3, h: Z.horizon + 80, top: sky, bottom: "#fae6c1" }); ZS.cloud(W.layer("sky"), { x: W.w * 0.23, y: Z.horizon * 0.3, h: 60, seed: 12 }); }
  ZS.floor(L, { w: W.w * 3, y: wall ? Z.floor - 20 : Z.horizon, h: W.h, color: ground, marks: 0.15, seed: 18 });
  const put = (id, x, dz, seed = 1) => Z.put(id, L, { x: x * sign, dz, seed });
  const hang = (id, x, dz = 7) => Z.put(id, far, { x: x * sign, dz });
  return { Z, L, far, put, hang };
}
ZF.place("market_bazaar", _placeMeta(), (W, o) => {
  const { put } = _placeBase(W, o, { ground: "#bd9970" });
  put("bazaarShed", -3, 7); put("streetVendor", 3.3, 5, 2); put("vegetableBasket", -2.1, 3); put("riceSacks", 3.4, 3); put("mangoTree", -6, 9, 3); return {};
});
ZF.place("tea_stall", _placeMeta(), (W, o) => {
  const { put } = _placeBase(W, o, { ground: "#b69c7b" });
  put("teaStall", 0.4, 5); put("teaCart", -3.1, 3); put("bench", 2.6, 2); put("mangoTree", -5, 7, 5); return {};
});
ZF.place("office_room", _placeMeta(true), (W, o) => {
  const { put, hang } = _placeBase(W, o, { wall: "#98b7c9", ground: "#aa8d77" });
  put("officeDesk", 1.5, 3); put("officePrinter", -2.7, 3); put("bookshelfFull", -4, 5); hang("window", 0.2); hang("wallClock", 2.4); hang("door", 4.2); return {};
});
ZF.place("hospital_clinic", _placeMeta(true), (W, o) => {
  const { put, hang, Z, far } = _placeBase(W, o, { wall: "#c0ded6", ground: "#9ab7b4" });
  put("hospitalBed", -2.5, 4); put("officeDesk", 2.7, 4); put("washBasin", 4.3, 5); hang("window", -3); hang("wallClock", 2.2);
  const p = Z.at(0, 7), g = ZC.el("g", { transform: `translate(${p.x} ${p.y - 2.3 * p.s})`, "data-clinic-cross": 1 }, far);
  ZC.el("rect", { x: -22, y: -58, width: 44, height: 116, fill: "#d95757" }, g); ZC.el("rect", { x: -58, y: -22, width: 116, height: 44, fill: "#d95757" }, g); return {};
});
ZF.place("river_ghat", _placeMeta(), (W, o) => {
  const { put, Z, L } = _placeBase(W, o, { ground: "#afba89" });
  const shore = W.h * 0.7, f = o.view === "reverse" ? -1 : 1;
  ZC.el("rect", { x: -W.w, y: Z.horizon, width: W.w * 3, height: shore - Z.horizon, fill: "#71b5c6", "data-river-surface": 1 }, L);
  for (let i = 0; i < 4; i++) { const y = shore + i * W.h * 0.027, half = W.w * (0.13 + i * 0.018); ZC.el("path", { d: `M${W.w/2-half},${y} h${half*2} l24,${W.h*.027} h${-half*2-48}Z`, fill: i % 2 ? "#c0b7a0" : "#a8a28e", "data-ghat-step": i }, L); }
  Z.put("bambooBridge", L, { x: -4 * f, dz: 18, color: "#b4a476" }); put("boat", 3, 9); put("coconutPalm", 7, 15);
  const ripples = ZC.el("path", { fill: "none", stroke: "#c1e4e5", "stroke-width": 3, "data-ripples": 1 }, L), y = (shore + Z.horizon) / 2;
  return { tick(t) { ripples.setAttribute("d", Array.from({ length: 6 }, (_, i) => { const x = W.w * (0.17 + i * 0.12); return `M${x} ${y + Math.sin(t * 1.7 + i) * 3} q18,4 36,0`; }).join(" ")); } };
});
ZF.place("bus_stop", _placeMeta(), (W, o) => {
  const { put } = _placeBase(W, o, { ground: "#878991" });
  put("busStop", -1.5, 4); put("localBus", 4.5, 7); put("streetLamp", -4.1, 4); put("officeTower", 5, 25); return {};
});
ZF.place("rooftop", _placeMeta(), (W, o) => {
  const { put } = _placeBase(W, o, { ground: "#c0a79a" });
  put("officeTower", -9, 120); put("skyscraper", 15, 400); put("boundaryWall", -4, 6); put("boundaryWall", 0, 6); put("boundaryWall", 4, 6); put("waterTank", 3.6, 3); put("plant", -3.2, 3); return {};
});
ZF.place("forest_path", _placeMeta(), (W, o) => {
  const { put } = _placeBase(W, o, { ground: "#779761", sky: "#86bfc4" });
  put("mudPath", 0, 0); put("banyanTree", -4.5, 6, 3); put("pineTree", 4.6, 7, 2); put("jackfruitTree", -7, 11, 7); put("bushRow", 3.5, 3, 4); return {};
});
ZF.place("restaurant_cafe", _placeMeta(true), (W, o) => {
  const { put, hang } = _placeBase(W, o, { wall: "#d99972", ground: "#a57d63" });
  put("restaurantTable", -2.2, 3.5); put("restaurantTable", 2.6, 4); put("shopCounter", 0, 6); put("chair", -3.7, 3.8); hang("window", -2); hang("wallClock", 2.5); return {};
});
ZF.place("courthouse_hall", _placeMeta(true), (W, o) => {
  const { put, hang } = _placeBase(W, o, { wall: "#b99a79", ground: "#9d7357" });
  put("teacherTable", 0, 6); put("bench", -3.4, 3); put("bench", 3.4, 3); put("bookshelfFull", 4.4, 7); hang("door", -4.3); hang("wallClock", 0); return {};
});
ZF.place("farm_field", _placeMeta(), (W, o) => {
  const { put, Z, L } = _placeBase(W, o, { ground: "#a6b759" });
  for (let i = -5; i <= 5; i++) ZC.el("path", { d: `M${W.w/2+i*W.w*.06},${Z.horizon+10} L${W.w/2+i*W.w*.2},${W.h}`, fill: "none", stroke: i % 2 ? "#779442" : "#c3ca73", "stroke-width": W.h*.015, "data-crop-row": i }, L);
  put("paddyField", 0, 7); put("paddyStack", -3.7, 3); put("riceSacks", 3.4, 3); put("mudHouse", -6, 12); put("coconutPalm", 5.3, 10); return {};
});
// ---------- open nature (Step 13): the sea, the mountains, the desert — places a story about the world can stand in ----------
// The world's depth: dz small = near the camera (people stand at dz 1), dz large = toward the horizon. On the beach the sea starts
// past dz ~6, so an animal of the water (a dolphin) is put at dz 10–16 and is drawn over the sea, never on the sand.
ZF.place("sea_beach", { ..._placeMeta(), water: { from: 6 } }, (W, o) => {
  const Z = o.Z, L = o.layer, sky = W.layer("sky"), shore = Z.at(0, 6).y;
  ZS.sky(sky, { w: W.w * 3, h: Z.horizon + 80, top: "#5fb3e6", bottom: "#d9f0fb" }); ZS.cloud(sky, { x: W.w * 0.7, y: Z.horizon * 0.35, h: 70, seed: 4 });
  const g = ZC.el("linearGradient", { id: W.idp + "sea", x1: 0, y1: 0, x2: 0, y2: 1 }, W.defs); ZC.el("stop", { offset: 0, "stop-color": "#2f7fb8" }, g); ZC.el("stop", { offset: 1, "stop-color": "#57b9d6" }, g);
  ZC.el("rect", { x: -W.w, y: Z.horizon, width: W.w * 3, height: shore - Z.horizon + 2, fill: `url(#${W.idp}sea)`, "data-sea": 1 }, L);
  ZS.floor(L, { w: W.w * 3, y: shore, h: W.h, color: "#e9d29a", marks: 0.08, seed: 21 });
  const waves = ZC.el("path", { fill: "none", stroke: "#e8f7fb", "stroke-width": 3, opacity: 0.8, "data-waves": 1 }, L), foam = ZC.el("path", { fill: "#f6fbfc", opacity: 0.9, "data-foam": 1 }, L);
  const put = (id, x, dz, seed = 1) => Z.put(id, L, { x: o.view === "reverse" ? -x : x, dz, seed }); put("coconutPalm", -7.5, 9); put("coconutPalm", 8.5, 12, 2);
  return { tick(t) {
    waves.setAttribute("d", Array.from({ length: 9 }, (_, i) => { const y = Z.horizon + (shore - Z.horizon) * (0.18 + 0.09 * i), x = ((i * 0.37 + t * 0.03) % 1) * W.w; return `M${x - 60},${y + Math.sin(t * 1.3 + i) * 2} q30,-6 60,0 q30,6 60,0`; }).join(" "));
    const s = shore + Math.sin(t * 0.9) * 6; foam.setAttribute("d", `M${-W.w},${s} ${Array.from({ length: 24 }, (_, i) => `Q${-W.w + (i + 0.5) * W.w * 0.125},${s + 9 + Math.sin(t * 2 + i) * 4} ${-W.w + (i + 1) * W.w * 0.125},${s}`).join(" ")} L${W.w * 2},${s + 3} L${-W.w},${s + 3}Z`);
  } };
});
ZF.place("mountain_valley", _placeMeta(), (W, o) => {
  const Z = o.Z, L = o.layer, far = W.layer("far"), sky = W.layer("sky");
  ZS.sky(sky, { w: W.w * 3, h: Z.horizon + 80, top: "#7fbde6", bottom: "#e7f3f6" }); ZS.cloud(sky, { x: W.w * 0.3, y: Z.horizon * 0.3, h: 60, seed: 9 });
  const peaks = (y0, hs, fill, snow) => { const n = hs.length, d = [`M${-W.w},${y0}`]; hs.forEach((h, i) => { const x = -W.w + ((i + 0.5) / n) * W.w * 3; d.push(`L${x - W.w * 0.09},${y0 - h * 0.35} L${x},${y0 - h} L${x + W.w * 0.1},${y0 - h * 0.4}`); }); d.push(`L${W.w * 2},${y0} Z`); ZC.el("path", { d: d.join(" "), fill }, far);
    if (snow) hs.forEach((h, i) => { const x = -W.w + ((i + 0.5) / n) * W.w * 3; ZC.el("path", { d: `M${x - h * 0.12},${y0 - h * 0.82} L${x},${y0 - h} L${x + h * 0.13},${y0 - h * 0.8} L${x + h * 0.04},${y0 - h * 0.85} L${x - h * 0.04},${y0 - h * 0.79}Z`, fill: "#f4f7fa" }, far); }); };
  peaks(Z.horizon + 4, [W.h * 0.3, W.h * 0.42, W.h * 0.26, W.h * 0.38, W.h * 0.3, W.h * 0.44, W.h * 0.28], "#8aa0b8", true); peaks(Z.horizon + 6, [W.h * 0.16, W.h * 0.22, W.h * 0.13, W.h * 0.2, W.h * 0.17, W.h * 0.24, W.h * 0.15, W.h * 0.19], "#6f8f69", false);
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#94b56a", marks: 0.15, seed: 23 });
  const put = (id, x, dz, seed = 1) => Z.put(id, L, { x: o.view === "reverse" ? -x : x, dz, seed }); put("pineTree", -7, 16); put("pineTree", 8, 20, 2); put("pineTree", -11, 26, 3); put("bushRow", 5.5, 7, 4); return {};
});
ZF.place("desert_dunes", _placeMeta(), (W, o) => {
  const Z = o.Z, L = o.layer, far = W.layer("far"), sky = W.layer("sky");
  ZS.sky(sky, { w: W.w * 3, h: Z.horizon + 80, top: "#6fb4e0", bottom: "#fbe7c2" });
  ZC.el("circle", { cx: W.w * 0.78, cy: Z.horizon * 0.35, r: W.h * 0.06, fill: "#fff2b8", "data-sun": 1 }, sky);
  for (const [k, c] of [[0, "#e7c27f"], [1, "#dbb06a"]]) ZC.el("path", { d: `M${-W.w},${Z.horizon + 6} ${Array.from({ length: 7 }, (_, i) => `Q${-W.w + (i + 0.5) * W.w * 3 / 7},${Z.horizon - W.h * (0.06 + 0.04 * ((i + k) % 3))} ${-W.w + (i + 1) * W.w * 3 / 7},${Z.horizon + 6}`).join(" ")} L${W.w * 2},${W.h} L${-W.w},${W.h}Z`, fill: c }, far);
  ZS.floor(L, { w: W.w * 3, y: Z.horizon, h: W.h, color: "#e3c48a", marks: 0.06, seed: 25 }); return {};
});
