// Measures how tall every 2D set piece and prop really draws for its `h` (in real Chrome, seeds 1–3), so the world scale
// (engine/cartoon/world.js) turns metres into exactly the right size. Writes engine/cartoon/library/drawn.json. No AI.
// Run after adding or changing pieces (then node scripts/build-library.mjs):   node scripts/measure-pieces.mjs
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromePath } from "../engine/readcheck.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const C = (f) => fs.readFileSync(path.join(root, "engine/cartoon", f), "utf8");
const OUT = path.join(root, "engine/cartoon/library/drawn.json");
const SKIP = ["sky", "floor", "road", "wall", "shadow", "sun", "moon", "tint", "names", "kit", "define", "info"];

const page = `<!doctype html><html><body><div id="r" style="position:relative;width:1080px;height:1920px"></div><script>
window.__ZC_FRAME = { w: 1080, h: 1920 };
${["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "set.js"].map(C).join("\n")}
${C("library.js").replace(/<\/(script)/gi, "<\\/$1")}
</script></body></html>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "zancut-measure-")), file = path.join(dir, "index.html");
fs.writeFileSync(file, page);

const puppeteer = (await import("puppeteer-core")).default;
const exe = chromePath(); if (!exe) { console.error("No Chrome found (the same one the body gate uses)."); process.exit(1); }
const browser = await puppeteer.launch({ executablePath: exe, headless: true, args: ["--no-sandbox", "--allow-file-access-from-files"] });
try {
  const tab = await browser.newPage(); const errs = []; tab.on("pageerror", (e) => errs.push(e.message));
  await tab.goto(`file://${file}`, { waitUntil: "load" });
  if (errs.length) throw new Error(errs[0]);
  const res = await tab.evaluate((SKIP) => {
    const W = ZC.world(document.getElementById("r")), L = W.layer("m"), out = {}, bad = {};
    for (const id of ZS.names.filter((k) => !SKIP.includes(k) && typeof ZS[k] === "function")) {
      const prop = (ZS.info[id] || {}).kind === "prop", got = [];
      for (const seed of [1, 2, 3]) {
        const g = ZC.el("g", {}, L);
        try {
          if (prop) ZS[id](g, { h: 100, seed }); else ZS[id](g, { x: 0, y: 0, h: 100, seed });
          const b = g.getBBox(); if (b.height > 0) got.push(b);
        } catch (e) { bad[id] = e.message; }
        g.remove();
      }
      if (!got.length) continue;
      const avg = (f) => Math.round((got.reduce((s, b) => s + f(b), 0) / got.length) * 10) / 1000; // per unit of h, 3 decimals
      // a set piece stands on y = 0: its height is how far it rises above that; a prop is drawn around its grip: its whole height
      // a piece that hangs (a ceiling fan) is drawn down from its point: its height is how far it hangs
      const up = avg((b) => -b.y), down = avg((b) => b.y + b.height);
      out[id] = prop ? { top: avg((b) => b.height), up, width: avg((b) => b.width) } : up < 0.05 ? { top: down, hang: true, width: avg((b) => b.width) } : { top: up, below: down, width: avg((b) => b.width) };
    }
    return { out, bad };
  }, SKIP);
  const sorted = Object.fromEntries(Object.keys(res.out).sort().map((k) => [k, res.out[k]]));
  fs.writeFileSync(OUT, JSON.stringify({ about: "How tall each piece draws per unit of its h (seeds 1-3, real Chrome): top = drawn height / h (a set piece above its ground point; a prop overall), width = drawn width / h. Made by scripts/measure-pieces.mjs; do not edit.", pieces: sorted }, null, 1) + "\n");
  const odd = Object.entries(sorted).filter(([, v]) => v.top < 0.5 || v.top > 1.6);
  console.log(`✓ measured ${Object.keys(sorted).length} pieces → ${path.relative(root, OUT)}`);
  if (odd.length) console.log(`  drawn height far from h (fine, world.js corrects it): ${odd.map(([k, v]) => `${k} ${v.top}`).join(", ")}`);
  for (const [k, m] of Object.entries(res.bad)) console.log(`  ✗ ${k}: ${m}`);
} finally { await browser.close(); fs.rmSync(dir, { recursive: true, force: true }); }
