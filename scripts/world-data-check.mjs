// Checks a Brief 5 delivery (sizes.json: real sizes in metres + contacts) and, with --merge, adopts it into
// engine/cartoon/library/sizes.json (then run node scripts/build-library.mjs and node scripts/world-test.mjs). No AI.
//   node scripts/world-data-check.mjs <delivery folder or sizes.json> [--merge]
// Checks: every library part has an entry; every size is [min, usual, max] > 0 in order; contacts have a height and, except for
// wall / far / sky / held / worn parts (measured from the floor or the hand), stay inside the part's height.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2], merge = process.argv.includes("--merge");
if (!arg) { console.log("node scripts/world-data-check.mjs <folder or sizes.json> [--merge]"); process.exit(1); }
const file = fs.statSync(arg).isDirectory() ? path.join(arg, "sizes.json") : arg;
const got = JSON.parse(fs.readFileSync(file, "utf8")), OUT = path.join(root, "engine/cartoon/library/sizes.json");
const mine = JSON.parse(fs.readFileSync(OUT, "utf8"));
// parts whose drawing is not what the delivery measured (our built-in book is drawn standing, the cover's height; the built-in bench has no backrest)
const KEEP_OURS = ["book", "bench"]; // the built-in bench is drawn without a backrest: its height is the seat

// every part the library has (the same list the brief was given)
const lib = path.join(root, "engine/cartoon/library"), ids = new Set();
for (const m of fs.readFileSync(path.join(root, "engine/cartoon/set.js"), "utf8").matchAll(/^ {4}(\w+)\(layer, \{/gm)) if (!["sky", "shadow", "floor", "road", "wall"].includes(m[1])) ids.add(m[1]);
for (const d of ["set", "props"]) for (const f of fs.readdirSync(path.join(lib, d))) { const m = fs.readFileSync(path.join(lib, d, f), "utf8").match(/ZS\.define\(\s*"(\w+)"/); if (m) ids.add(m[1]); }

const errors = [], notes = [];
const tri = (id, k, v) => { if (v == null) return; if (!Array.isArray(v) || v.length !== 3 || !v.every(Number.isFinite) || !(v[0] > 0 && v[0] <= v[1] && v[1] <= v[2])) errors.push(`${id}.${k}: ${JSON.stringify(v)} is not [min, usual, max] > 0`); };
for (const id of ids) if (!got.items?.[id]) errors.push(`${id}: missing`);
for (const [id, x] of Object.entries(got.items || {})) {
  if (x.height == null) errors.push(`${id}: no height`);
  for (const k of ["height", "width", "depth", "length"]) tri(id, k, x[k]);
  const fromFloor = ["wall", "far", "sky", "held", "worn"].includes(x.anchor);
  for (const [c, v] of Object.entries(x.contacts || {})) {
    if (!Number.isFinite(v?.y)) errors.push(`${id}.contacts.${c}: no y`);
    else if (!fromFloor && x.height && v.y > x.height[2] * 1.05) errors.push(`${id}.contacts.${c}: y ${v.y} m above its own top (${x.height[2]} m)`);
  }
  if (!ids.has(id)) notes.push(id);
}
const P = got.standards?.people || {};
console.log(`${Object.keys(got.items || {}).length} parts (${ids.size} in the library, ${notes.length} extra kept for later), ${errors.length} problems`);
for (const e of errors.slice(0, 40)) console.log("  ✗", e);
if (!merge) process.exit(errors.length ? 1 : 0);
if (errors.length) { console.log("Not merged: fix the problems first."); process.exit(1); }

// people: the delivery's names → ours (gender.row, the rows world.js and the body chart use)
const map = { "male.adult": "adultMan", "female.adult": "adultWoman", "male.elderly": "elderlyMan", "female.elderly": "elderlyWoman", "male.teen": "teenBoy15", "female.teen": "teenGirl15",
  "male.child12": "childBoy12", "female.child12": "childGirl12", "male.child9": "childBoy9", "female.child9": "childGirl9", "male.child6": "childBoy6", "female.child6": "childGirl6",
  "male.toddler": "toddler2to3", "female.toddler": "toddler2to3", baby: "baby6to12MonthsLyingLength" };
const people = { ...mine.standards.people }; for (const [ours, theirs] of Object.entries(map)) if (P[theirs]) people[ours] = P[theirs];
const S = got.standards, building = { ...mine.standards.building, ...S.building };
if (S.building?.ceilingHeightFlat) building.ceiling = S.building.ceilingHeightFlat;
const items = { ...got.items }; for (const id of KEEP_OURS) if (mine.items[id]) items[id] = { ...items[id], ...mine.items[id], note: `${mine.items[id].note || ""} Kept Zancut's size: the drawing is the upright cover.`.trim() };
const out = { about: `Real sizes in metres ([min, usual, max]) and contact points of the 2D library (format: docs/2d-library/05-world-sizes-prompt.md). From the Brief 5 delivery (sources: notes/world-sizes-SOURCES.md), adopted by scripts/world-data-check.mjs. Wall parts' contacts are heights above the floor. engine/cartoon/world.js reads it.`,
  units: "metres", standards: { ...mine.standards, ...S, people, building, furniture: { ...mine.standards.furniture, ...S.furniture }, street: { ...mine.standards.street, ...S.street } }, items };
fs.writeFileSync(OUT, JSON.stringify(out, null, 1) + "\n");
const src = path.join(path.dirname(file), "SOURCES.md"); if (fs.existsSync(src)) fs.copyFileSync(src, path.join(lib, "notes/world-sizes-SOURCES.md"));
console.log(`✓ merged into ${path.relative(root, OUT)} (${Object.keys(items).length} parts). Next: node scripts/build-library.mjs && node scripts/world-test.mjs`);
