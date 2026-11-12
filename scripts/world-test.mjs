// The world scale (engine/cartoon/world.js) in real Chrome, no AI: people and pieces come out their real size at every depth,
// far is smaller and higher, a nearer thing is drawn over a farther one, contacts (a seat, a ceiling) land where they should.
// Writes one picture of a street and a room. Run after changing world.js, sizes.json, drawn.json or a piece:
//   node scripts/world-test.mjs [picture.jpg]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { chromePath } from "../engine/readcheck.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = (f) => fs.readFileSync(path.join(root, "engine/cartoon", f), "utf8");
const pic = path.resolve(process.argv[2] || path.join(os.tmpdir(), "zancut-world-test.jpg"));
const page = `<!doctype html><html><body style="margin:0"><div id="r" style="position:relative;width:1080px;height:1920px;overflow:hidden"></div><script>
window.__ZC_FRAME = { w: 1080, h: 1920 };
${["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "set.js"].map(C).join("\n")}
${C("library.js").replace(/<\/(script)/gi, "<\\/$1")}
${C("world.js")}
</script></body></html>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-world-")), file = path.join(dir, "index.html");
fs.writeFileSync(file, page);

const puppeteer = (await import("puppeteer-core")).default;
const exe = chromePath(); if (!exe) { console.log("No Chrome here: skipped"); process.exit(0); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
let failed = 0;
const check = (name, fn) => { try { fn(); console.log(`✓ ${name}`); } catch (e) { failed++; console.log(`✗ ${name}\n  ${e.message}`); } };
try {
  const tab = await browser.newPage(); const errs = []; tab.on("pageerror", (e) => errs.push(e.message));
  await tab.setViewport({ width: 1080, height: 1920 });
  await tab.goto(`file://${file}`, { waitUntil: "load" });
  if (errs.length) throw new Error(errs[0]);
  const r = await tab.evaluate(() => {
    const W = ZC.world(document.getElementById("r")), Z = ZW.view(W), out = { people: [], pieces: [] };
    ZS.sky(W.layer("sky"), { w: W.w, h: Z.horizon + 40 });
    ZC.el("rect", { x: 0, y: Z.horizon, width: W.w, height: W.h - Z.horizon, fill: "#cdbb98" }, W.layer("ground"));
    const set = W.layer("world"); // pieces and people share one layer, so depth sorts them together
    const bb = (g) => { const b = g.getBBox(); return { top: b.y, bottom: b.y + b.height, h: b.height }; };
    // pieces: drawn height against the real height at that depth (a near tree is put first: depth order must still put it in front)
    const near = Z.put("bananaPlant", set, { x: 1.6, dz: -2.2, seed: 2 });
    for (const [id, x, dz, seed] of [["mangoTree", -2.5, 9, 1], ["busStop", -0.6, 2.5, 2], ["cngAuto", 2.4, 4, 1], ["streetLamp", 2.2, 1.5, 1], ["cow", -2.2, 0.6, 3], ["bench", 1.2, 0.3, 1]]) {
      const g = Z.put(id, set, { x, dz, seed }), box = bb(g.closest("[data-d]")); out.pieces.push({ id, dz, real: g.world.m * g.world.px.s, drawn: g.world.px.y - box.top, foot: g.world.px.y, bottom: box.bottom, from: g.world.from, s: g.world.px.s });
      if (id === "bench") out.seat = { y: Z.contact(g, "seat").y, floor: g.world.px.y, s: g.world.px.s };
    }
    // people: a man, a woman, a child of 6 and an elderly woman, near and far
    const cast = [{ gender: "male", age: "adult" }, { gender: "female", age: "adult", hair: { style: "hijab" } }, { gender: "male", age: "child", years: 6 }, { gender: "female", age: "elderly" }];
    cast.forEach((spec, i) => [[-1.4 + i * 0.9, 1.8], [-1 + i * 0.6, 7]].forEach(([x, dz]) => {
      const at = Z.person(spec, { x, dz, layer: set }), b = ZC.actor(at.slot, { spec, ...at, view: "front" }); b.draw(b.pose("stand"));
      const g = at.slot; g.querySelectorAll("[data-shadow]").forEach((x) => x.remove()); /* the floor shadow is not the body */ out.people.push({ spec, dz, real: at.metres * at.s, drawn: bb(g).h, foot: at.floor, bottom: bb(g).bottom, m: at.metres });
    }));
    out.order = [...set.children].map((c) => Number(c.dataset.d)); out.nearLast = set.lastElementChild === near.closest("[data-d]");
    // a room (hidden, not in the picture): the fan hangs from the ceiling, not from the floor
    const room = ZC.world(document.body.appendChild(Object.assign(document.createElement("div"), { style: "position:absolute;left:-3000px;width:1080px;height:1920px" }))), R = ZW.view(room), fan = R.put("ceilingFan", room.layer("x"), { x: 0, dz: 1 });
    out.fan = { top: fan.closest("[data-d]").getBBox().y, ceiling: fan.world.px.y - 2.9 * fan.world.px.s };
    out.far = { a: Z.at(0, 0), b: Z.at(0, 10) };
    // a wall piece hangs at its height above the floor (a wall clock's bottom at contacts.bottom), not standing on the floor
    const clock = R.put("wallClock", room.layer("x"), { x: 1, dz: 1 }), cb = clock.closest("[data-d]").getBBox();
    out.clock = { bottom: cb.y + cb.height, want: clock.world.px.y - clock.world.item.contacts.bottom.y * clock.world.px.s, s: clock.world.px.s };
    return out;
  });
  const pct = (a, b) => Math.abs(a - b) / b;
  check("far is smaller and higher (toward the horizon)", () => { assert.ok(r.far.b.s < r.far.a.s && r.far.b.y < r.far.a.y); });
  check("every piece draws its real height at its depth (±6%)", () => { for (const p of r.pieces) assert.ok(pct(p.drawn, p.real) < 0.06, `${p.id} at dz ${p.dz}: ${p.drawn.toFixed(0)} px drawn, ${p.real.toFixed(0)} px real (size from ${p.from})`); });
  // its lowest point is on the floor or a little below it (its ground shadow), never above it (floating)
  check("every piece stands on its floor point", () => { for (const p of r.pieces) assert.ok(p.bottom >= p.foot - 2 && p.bottom - p.foot < Math.max(6, p.s * 0.4), `${p.id}: bottom ${p.bottom.toFixed(0)}, floor ${p.foot.toFixed(0)}`); });
  check("every person draws their real height (±6%) and stands on the floor", () => { for (const p of r.people) { assert.ok(pct(p.drawn, p.real) < 0.06, `${JSON.stringify(p.spec)} at dz ${p.dz}: ${p.drawn.toFixed(0)} px drawn, ${p.real.toFixed(0)} px for ${p.m} m`); assert.ok(Math.abs(p.bottom - p.foot) < 6, `${p.spec.gender} ${p.spec.age}: feet at ${p.bottom.toFixed(0)}, floor ${p.foot.toFixed(0)}`); } });
  check("a man is taller than a woman, an adult than a child of 6, at the same depth", () => { const at = (g, a) => r.people.find((p) => p.spec.gender === g && p.spec.age === a && p.dz === 1.8).drawn; assert.ok(at("male", "adult") > at("female", "adult") && at("female", "adult") > at("male", "child") * 1.2); });
  check("a nearer thing is drawn over a farther one, people and pieces together, whatever order they were put in", () => { assert.ok(r.nearLast, "the near banana plant is not the last (front) group"); for (let i = 1; i < r.order.length; i++) assert.ok(r.order[i - 1] >= r.order[i], `depth order ${r.order.join(" ")}`); });
  check("a bench's seat is 0.45 m above its floor", () => { assert.ok(Math.abs((r.seat.floor - r.seat.y) / r.seat.s - 0.45) < 0.01); });
  check("a ceiling fan hangs from the ceiling", () => { assert.ok(Math.abs(r.fan.top - r.fan.ceiling) < 6, `fan top ${r.fan.top.toFixed(0)}, ceiling ${r.fan.ceiling.toFixed(0)}`); });
  check("a wall clock hangs at its height above the floor", () => { assert.ok(Math.abs(r.clock.bottom - r.clock.want) < r.clock.s * 0.06, `clock bottom ${r.clock.bottom.toFixed(0)}, wanted ${r.clock.want.toFixed(0)}`); });
  // the size table against a person (engine/cartoon/library/sizes.json): the relations a picture must keep
  check("the size table keeps people and things in proportion", () => {
    const S = JSON.parse(fs.readFileSync(path.join(root, "engine/cartoon/library/sizes.json"), "utf8")), it = S.items, P = S.standards.people, R0 = S.standards.handAndReach?.adultMan || {}, u = (v) => (Array.isArray(v) ? v[1] : v);
    const man = u(P["male.adult"]), woman = u(P["female.adult"]), kid = u(P["male.child6"]);
    assert.ok(man > woman && woman > kid && kid > u(P["male.toddler"]), "people get taller with age, men taller than women");
    assert.ok(u(it.door.height) > man + 0.3, `a door (${u(it.door.height)} m) is well above a man (${man} m)`);
    assert.ok(it.busStop.contacts.roofUnder.y > man + 0.3, "a man stands under a bus-stop roof with room to spare");
    assert.ok(u(R0.kneeHeight) <= it.chair.contacts.seat.y + 0.03 && it.chair.contacts.seat.y < u(R0.hipHeight), "a chair seat is at knee height");
    assert.ok(it.table.contacts.top.y > u(R0.kneeHeight) && it.table.contacts.top.y < u(R0.elbowHeight), "a table top is between knee and elbow");
    assert.ok(u(it.cup.height) < u(R0.handLength), "a cup is smaller than a hand");
    assert.ok(u(it.cow.height) > kid && u(it.cow.height) < man, "a cow is taller than a child of 6, shorter than a man");
    assert.ok(u(it.cngAuto.height) > man, "a CNG is a little taller than a man");
  });
  await tab.screenshot({ path: pic, type: "jpeg", quality: 80 });
  console.log(`picture: ${pic}`);
} finally { await browser.close(); fs.rmSync(dir, { recursive: true, force: true }); }
if (failed) { console.log(`\n${failed} world check(s) failed`); process.exit(1); }
console.log("\n✓ the world scale holds");
