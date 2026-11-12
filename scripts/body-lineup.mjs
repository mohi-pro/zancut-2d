// A picture of every body in real Chrome, no AI: women and men from toddler to elder at their real heights (world scale), each age
// in thin / average / heavy, and the same people with the old profiles for comparison. Run after build-bodies or anatomy changes:
//   node scripts/body-lineup.mjs [picture.jpg] [--old]   (--old adds a second row drawn without the measured bodies)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromePath } from "../engine/readcheck.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = (f) => fs.readFileSync(path.join(root, "engine/cartoon", f), "utf8");
const args = process.argv.slice(2), old = args.includes("--old"), pic = path.resolve(args.find((a) => !a.startsWith("--")) || path.join(os.tmpdir(), "zancut-body-lineup.jpg"));
const W = 2400, H = old ? 1800 : 1250;
const page = `<!doctype html><html><body style="margin:0;background:#f4efe6"><div id="r" style="position:relative;width:${W}px;height:${H}px"></div><script>
window.__ZC_FRAME = { w: ${W}, h: ${H} };
${["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "set.js", "world.js"].map(C).join("\n")}
</script></body></html>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-lineup-")), file = path.join(dir, "index.html");
fs.writeFileSync(file, page);
const puppeteer = (await import("puppeteer-core")).default;
const exe = chromePath(); if (!exe) { console.log("No Chrome here"); process.exit(1); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
try {
  const tab = await browser.newPage(); const errs = []; tab.on("pageerror", (e) => errs.push(e.message));
  await tab.setViewport({ width: W, height: H });
  await tab.goto(`file://${file}`, { waitUntil: "load" });
  if (errs.length) throw new Error(errs[0]);
  await tab.evaluate((old) => {
    const Wd = ZC.world(document.getElementById("r")), L = Wd.layer("p"), T = Wd.layer("t");
    const label = (x, y, s, size = 22) => { const t = ZC.el("text", { x, y, "text-anchor": "middle", "font-size": size, fill: "#4a4038", "font-family": "sans-serif" }, T); t.textContent = s; };
    const ages = [["toddler", 2.5], ["child6", 6], ["child9", 9], ["child12", 12], ["teen", 15], ["adult", 30], ["elder", 72]];
    const outfit = (g, a) => (a === "toddler" || a.startsWith("child") ? { type: "tshirt", color: g === "female" ? "#d8607a" : "#3f7fc0" } : g === "female" ? { type: "salwar", color: "#2d8f7c" } : { type: "shirt", color: "#e7dcc6" });
    const draw = (spec, x, floor, ppm, noMeasured) => {
      const keep = window.ZBODIES; if (noMeasured) window.ZBODIES = null;
      const m = ZW.statureOf(spec), A = window.ZANATOMY, prof = ZPEOPLE.biometrics(spec).profile, ps = A.pose({ posture: "stand", profile: prof }), crown = ps.joints.head.y + A.RADII.head * ps.profile.headScale;
      const b = ZC.actor(L, { spec, H: (m * ppm * 27) / crown, x, floor, view: "front" }); b.draw(b.pose("stand"));
      window.ZBODIES = keep;
    };
    // row 1: every age, women then men, average build, real heights on one floor
    const ppm = 300, floor1 = 640; let x = 90;
    for (const g of ["female", "male"]) { for (const [a, years] of ages) { draw({ gender: g, age: a === "elder" ? "elderly" : a === "toddler" ? "child" : a.startsWith("child") ? "child" : a, years, skin: 4, hair: { style: g === "female" ? (years > 12 ? "bun" : "long") : "side", color: a === "elder" ? "grey" : "black" }, outfit: outfit(g, a) }, x, floor1, ppm); label(x, floor1 + 34, `${g === "female" ? "F" : "M"} ${a}`); x += 158; } x += 40; }
    // row 2: adult and child9 in thin / average / heavy
    const floor2 = 1180; x = 120;
    for (const [g, a, years] of [["female", "adult", 30], ["male", "adult", 30], ["female", "child9", 9], ["male", "child9", 9]]) for (const build of ["thin", "average", "heavy"]) {
      draw({ gender: g, age: a === "adult" ? "adult" : "child", years, build, skin: 5, hair: { style: g === "female" ? "hijab" : "crop", color: "black" }, outfit: outfit(g, a) }, x, floor2, ppm);
      label(x, floor2 + 34, `${g === "female" ? "F" : "M"} ${a} ${build}`, 18); x += 190; }
    // row 3 (optional): the old profiles, the same people as row 1
    if (old) { const floor3 = 1720; x = 90; label(Wd.w / 2, floor3 - 470, "before: the old profiles (one limb thickness for everyone, no female body)", 26);
      for (const g of ["female", "male"]) { for (const [a, years] of ages) { draw({ gender: g, age: a === "elder" ? "elderly" : a === "toddler" ? "child" : a.startsWith("child") ? "child" : a, years, skin: 4, hair: { style: g === "female" ? (years > 12 ? "bun" : "long") : "side", color: a === "elder" ? "grey" : "black" }, outfit: outfit(g, a) }, x, floor3, ppm, true); x += 158; } x += 40; } }
  }, old);
  await tab.screenshot({ path: pic, type: "jpeg", quality: 82 });
  console.log(`picture: ${pic}`);
} finally { await browser.close(); fs.rmSync(dir, { recursive: true, force: true }); }
