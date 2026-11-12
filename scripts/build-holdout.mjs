// Builds brain/holdout-200.jsonl from scripts/data/holdout-200.txt (written and labelled by hand before the Step 8 generator; NOT
// the owner's real sentences). Rows with the same story id form a story: prevText / nextText / prevPlace come from their neighbours.
import fs from "node:fs";
import { HEADS, ROLE_IDS } from "../server/brain.mjs";
const src = fs.readFileSync(new URL("data/holdout-200.txt", import.meta.url), "utf8").split("\n").filter((l) => l && !l.startsWith("#"));
const raw = src.map((l) => { const [id, text, place, action, face, roles, broll, graphic, cameraMove] = l.split("|"); return { id, text: text.normalize("NFC"), place, action, face, roles: roles ? roles.split(",") : [], broll, graphic, cameraMove }; });
const bad = []; for (const r of raw) { for (const h of ["place", "action", "face", "broll", "graphic", "cameraMove"]) if (!HEADS[h].includes(r[h])) bad.push(`${r.text.slice(0, 30)}: ${h}=${r[h]}`); for (const x of r.roles) if (!ROLE_IDS.includes(x)) bad.push(`role ${x}`); }
if (bad.length || raw.length !== 200) { console.error(`not written: ${raw.length} rows, ${bad.join("; ")}`); process.exit(1); }
// the story ids are read from the untouched source rows (the first version removed them while still reading: no context)
const rows = raw.map((r, i) => { const p = raw[i - 1], n = raw[i + 1], inStory = r.id !== "-", { id, ...rest } = r;
  return { ...rest, ...(inStory ? { ctx: { prevText: p?.id === id ? p.text : "", nextText: n?.id === id ? n.text : "", prevPlace: p?.id === id ? p.place : "none" } } : {}), lang: /[ঀ-৿]/.test(r.text) ? "bn" : "en", source: "holdout-200 (assistant-written before the Step 8 generator, hand-labelled)" }; });
fs.writeFileSync(new URL("../brain/holdout-200.jsonl", import.meta.url), rows.map((x) => JSON.stringify(x)).join("\n") + "\n");
// a fixed dev / test split (stories kept whole): dev may be inspected to improve the generator, test never is
let unit = -1, last = null; const half = raw.map((r) => { if (r.id === "-" || r.id !== last) unit++; last = r.id; return unit % 2 ? "test" : "dev"; });
for (const part of ["dev", "test"]) fs.writeFileSync(new URL(`../brain/holdout-${part}.jsonl`, import.meta.url), rows.filter((_, i) => half[i] === part).map((x) => JSON.stringify(x)).join("\n") + "\n");
console.log(`split: dev ${half.filter((h) => h === "dev").length}, test ${half.filter((h) => h === "test").length}`);
console.log(`holdout-200: ${rows.length} rows (${rows.filter((r) => r.lang === "bn").length} Bangla), ${rows.filter((r) => r.ctx).length} in stories, ${rows.filter((r) => r.ctx?.prevText).length} with a previous sentence`);
