// A picture of the acting cards on real people (no AI): feelings at full strength as full bodies and as waist-up close shots, so
// face, body and hands can be judged together. Run after changing acting.js or engine/cartoon/library/acting.json:
//   node scripts/acting-board.mjs [picture.jpg] [feeling,feeling,…] [--mild]
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromePath } from "../engine/readcheck.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = (f) => fs.readFileSync(path.join(root, "engine/cartoon", f), "utf8");
const args = process.argv.slice(2), level = args.includes("--mild") ? "mild" : "strong";
const pic = path.resolve(args.find((a) => /\.(jpe?g|png)$/i.test(a)) || path.join(os.tmpdir(), "zancut-acting-board.jpg"));
const list = (args.find((a) => !a.startsWith("--") && !/\.(jpe?g|png)$/i.test(a)) || "neutral,happy,joy,proud,sad,grief,scared,shocked,angry,shy,thinking,tired").split(",");
const W = 2400, H = 1500;
const page = `<!doctype html><html><body style="margin:0"><div id="r" style="position:relative;width:${W}px;height:${H}px;background:#f3ede2"></div><script>
window.__ZC_FRAME = { w: ${W}, h: ${H} };
${["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "acting.js", "set.js", "world.js"].map(C).join("\n")}
${C("library.js").replace(/<\/(script)/gi, "<\\/$1")}
</script></body></html>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-acting-")), file = path.join(dir, "index.html");
fs.writeFileSync(file, page);
const puppeteer = (await import("puppeteer-core")).default;
const exe = chromePath(); if (!exe) { console.log("No Chrome here"); process.exit(1); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
try {
  const tab = await browser.newPage(); const errs = []; tab.on("pageerror", (e) => errs.push(e.message));
  await tab.setViewport({ width: W, height: H });
  await tab.goto(`file://${file}`, { waitUntil: "load" });
  if (errs.length) throw new Error(errs[0]);
  const bad = await tab.evaluate((list, level) => {
    const Wd = ZC.world(document.getElementById("r")), L = Wd.layer("p"), T = Wd.layer("t"), bad = [];
    const label = (x, y, s) => { const t = ZC.el("text", { x, y, "text-anchor": "middle", "font-size": 24, fill: "#4a4038", "font-family": "sans-serif" }, T); t.textContent = s; };
    const woman = { gender: "female", age: "adult", skin: 4, hair: { style: "bun", color: "black" }, outfit: { type: "salwar", color: "#2d8f7c" } };
    const man = { gender: "male", age: "adult", skin: 5, hair: { style: "side", color: "black" }, outfit: { type: "shirt", color: "#3f6fb0" } };
    const step = Wd.w / list.length;
    list.forEach((id, i) => {
      const x = step * (i + 0.5), spec = i % 2 ? man : woman;
      try {
        // the feeling has fully arrived (notice + change + settle are over) and the strong one has not eased yet
        const F = ZC.feel("neutral", { spec }).then(id, { level, at: 0.2 }), t = 3.2;
        const b = ZC.actor(L, { spec, H: 52, x, floor: 720, view: "three", facing: i % 2 ? -1 : 1 }); F.draw(b, t);
        const r = ZC.person(L, { cropped: true, spec, x, y: 1060, scale: 0.62 }); r.draw({ ...F.person(t), blink: 0, hands: "rest" }, t);
        label(x, 770, id); label(x, 1440, F.id(t));
      } catch (e) { bad.push(`${id}: ${e.message}`); }
    });
    return bad;
  }, list, level);
  await tab.screenshot({ path: pic, type: "jpeg", quality: 82 });
  console.log(`picture: ${pic}`); for (const b of bad) console.log("  ✗", b);
} finally { await browser.close(); fs.rmSync(dir, { recursive: true, force: true }); }
