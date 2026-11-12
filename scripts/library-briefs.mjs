// Packs the 2D library briefs (docs/2d-library) into four folders OUTSIDE the repository, one per brief, each holding every
// file to give the outside AI and nothing else. Run again after changing a brief.
//   node scripts/library-briefs.mjs [out folder]      (default: ../Zancut-Library-Briefs next to the repository)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "docs/2d-library"), out = path.resolve(process.argv[2] || path.join(root, "..", "Zancut-Library-Briefs"));
const read = (f) => fs.readFileSync(path.join(src, f), "utf8");
const cut = (s, from, to) => { const a = s.indexOf(from); if (a < 0) throw new Error(`missing "${from}"`); const b = to ? s.indexOf(to, a) : s.length; return s.slice(a, b < 0 ? s.length : b).trim(); };
const put = (dir, name, text) => { fs.mkdirSync(path.join(out, dir), { recursive: true }); fs.writeFileSync(path.join(out, dir, name), text); };
const copy = (dir, from, name) => { fs.mkdirSync(path.join(out, dir), { recursive: true }); fs.copyFileSync(from, path.join(out, dir, name)); };
const header = (title, files) => `> **For the AI reading this:** everything you need is in this file. ${files}\n\n`;

fs.rmSync(out, { recursive: true, force: true });
// 1: people in motion + the body engine as ONE file + the self-check
let b1 = read("01-people-motion-prompt.md").replace(/Give this whole file to the AI[\s\S]*?\n---\n/, "");
b1 = b1.replace(/If the check files were attached, run\n`node selfcheck\.js <your folder>` \(with `anatomy\.js` and `hands\.js` next to it\)/, "If you can run code, run\n`node selfcheck.js <your folder>` (it uses `zancut-body-engine.js`, both in this folder)");
put("1-people-motion", "PROMPT.md", b1.replace(/^(# .*\n)/, `$1\n${header("", "Two other files come with it: `zancut-body-engine.js` (Zancut's real skeleton and hand code: the rules, limits and bone lengths in code; you do not edit it) and `selfcheck.js` (run `node selfcheck.js <your folder>` to test your files against that engine before delivering).")}`));
fs.writeFileSync(path.join(out, "1-people-motion", "zancut-body-engine.js"), `// Zancut's body engine (hands.js + anatomy.js), for checking a library delivery. Do not edit.\n${fs.readFileSync(path.join(root, "engine/cartoon/hands.js"), "utf8")}\n${fs.readFileSync(path.join(root, "engine/cartoon/anatomy.js"), "utf8")}`);
copy("1-people-motion", path.join(src, "tools/selfcheck.js"), "selfcheck.js");
// 2: places
const b2 = read("02-places-prompt.md").replace(/Give this whole file to the AI[\s\S]*?\n---\n/, "");
put("2-places", "PROMPT.md", b2.replace(/^(# .*\n)/, `$1\n${header("", "One other file comes with it: `preview.html` (open it in a browser, choose your .js files, and you see each piece in three seeds, day or night, moving ones moving).")}`));
copy("2-places", path.join(src, "tools/preview.html"), "preview.html");
// 3 and 4: their own list + the places brief's look, format, helpers and examples, so each folder stands alone
const shared = `\n\n---\n\n# The look, the format and the helpers (shared with the places library)\n\n${cut(b2, "## The look", "## What we need")}\n\n${cut(b2, "## Appendix A")}\n`;
for (const [dir, f] of [["3-animals", "03-animals-prompt.md"], ["4-props", "04-props-prompt.md"]]) {
  const b = read(f).replace(/Give this file to the AI[\s\S]*?\n---\n/, "").replace(/Brief 2/g, "the format section below");
  const see = dir === "4-props" ? "a prop's grip point shows as a red cross" : "each animal shows in three seeds, moving";
  put(dir, "PROMPT.md", b.replace(/^(# .*\n)/, `$1\n${header("", `One other file comes with it: \`preview.html\` (open it in a browser and choose your .js files to see them; ${see}).`)}`) + shared);
  copy(dir, path.join(src, "tools/preview.html"), "preview.html");
}
// every part we have, read from the code (so the list never goes stale): the sizes brief fills one entry per id
const lib = path.join(root, "engine/cartoon/library"), items = [];
for (const m of fs.readFileSync(path.join(root, "engine/cartoon/set.js"), "utf8").matchAll(/^ {4}(\w+)\(layer, \{([^}]*)\}/gm))
  if (!["sky", "shadow", "floor", "road", "wall"].includes(m[1])) /* grounds fill the frame: no size of their own */ items.push({ id: m[1], kind: "builtin", about: `built-in ${m[1]}`, options: m[2].replace(/\s+/g, " ").trim() });
for (const dir of ["set", "props"]) for (const f of fs.readdirSync(path.join(lib, dir)).filter((x) => x.endsWith(".js")).sort()) {
  const s = fs.readFileSync(path.join(lib, dir, f), "utf8"), m = s.match(/ZS\.define\(\s*"(\w+)"\s*,\s*\{([^}]*)\}/);
  if (!m) continue;
  const field = (k) => m[2].match(new RegExp(`"?${k}"?\\s*:\\s*"([^"]*)"`))?.[1], tags = m[2].match(/"?tags"?\s*:\s*\[([^\]]*)\]/)?.[1];
  items.push({ id: m[1], kind: field("kind") || (dir === "props" ? "prop" : "set"), about: field("about") || m[1], tags: tags ? tags.split(",").map((t) => t.trim().replace(/"/g, "")).filter(Boolean) : [] });
}
const motions = (dir) => fs.readdirSync(path.join(lib, dir)).filter((x) => x.endsWith(".json")).sort().map((f) => { const j = JSON.parse(fs.readFileSync(path.join(lib, dir, f), "utf8")); return { id: j.id, group: j.group, about: j.about }; });
const plain = (f) => read(f).replace(/Give this (whole )?file to the AI[\s\S]*?\n---\n/, "");
// 5: world sizes + the list of every item
put("5-world-sizes", "PROMPT.md", plain("05-world-sizes-prompt.md").replace(/^(# .*\n)/, `$1\n${header("", "One other file comes with it: `library-items.json` (every part Zancut has: give one size entry for each id).")}`));
put("5-world-sizes", "library-items.json", JSON.stringify({ about: "every part in the Zancut 2D library; kind builtin/set = scenery, furniture, vehicles, animals; prop = held or carried", count: items.length, items }, null, 1));
// 6 and 7: numbers only, nothing else needed
put("6-body-proportions", "PROMPT.md", plain("06-body-proportions-prompt.md").replace(/^(# .*\n)/, `$1\n${header("", "No other file is needed.")}`));
put("7-acting-cards", "PROMPT.md", plain("07-acting-cards-prompt.md").replace(/^(# .*\n)/, `$1\n${header("", "No other file is needed.")}`));
put("9-camera-shots", "PROMPT.md", plain("09-camera-shots-prompt.md").replace(/^(# .*\n)/, `$1\n${header("", "No other file is needed.")}`));
// 8: natural motion = brief 1's skeleton and formats + the new rules, the same engine and self-check, and what already exists
put("8-natural-motion", "PROMPT.md", plain("08-natural-motion-prompt.md").replace(/^(# .*\n)/, `$1\n${header("", "Also read `people-motion-brief.md` first (the skeleton, the body rules, the file formats and complete examples; skip its \"What we need\" list). `zancut-body-engine.js` + `selfcheck.js` check your work; `existing-motion.json` lists what already exists (do not remake those ids).")}`));
put("8-natural-motion", "people-motion-brief.md", b1);
fs.copyFileSync(path.join(out, "1-people-motion", "zancut-body-engine.js"), path.join(out, "8-natural-motion", "zancut-body-engine.js"));
copy("8-natural-motion", path.join(src, "tools/selfcheck.js"), "selfcheck.js");
put("8-natural-motion", "existing-motion.json", JSON.stringify({ actions: motions("actions"), gestures: motions("gestures") }, null, 1));

fs.writeFileSync(path.join(out, "START-HERE.md"), `# The Zancut 2D library: nine jobs for another AI

Each folder is one job. Give the other AI **every file in that folder** (nothing else) and say:
"Read PROMPT.md and make what it asks, P1 first. Deliver one folder in the format it describes."

| Folder | It makes | Files to give |
|---|---|---|
| 1-people-motion | how people move: walking, sitting, gestures, work, crowds, two people together, hand shapes | PROMPT.md, zancut-body-engine.js, selfcheck.js |
| 2-places | trees, fields, rivers, houses, streets, vehicles, schools, hospitals, room furniture | PROMPT.md, preview.html |
| 3-animals | cows, goats, birds, dogs, ducks… that move | PROMPT.md, preview.html |
| 4-props | things people hold: cups, phones, books, umbrellas, bats, money | PROMPT.md, preview.html |
| 5-world-sizes | the real size in metres of every part, and where people touch it (seat, handle, roof) | PROMPT.md, library-items.json |
| 6-body-proportions | a measured body chart: women and men, toddler to elder, thin to heavy | PROMPT.md |
| 7-acting-cards | each feeling as face + body + timing, how feelings change, where people look | PROMPT.md |
| 8-natural-motion | relaxed stands, feelings in the body, using things, people touching people | PROMPT.md, people-motion-brief.md, zancut-body-engine.js, selfcheck.js, existing-motion.json |

| 9-camera-shots | shot sizes, angles, moves, cuts as numbers; the rules a checker tests; which shots each story moment needs | PROMPT.md |

Jobs 5, 6, 7 and 9 are numbers only (no drawing, no code): they can run at the same time, in separate chats. Job 8 needs an AI that
can run code (for selfcheck.js).

What the extra files are:
- **zancut-body-engine.js**: Zancut's real body code (skeleton, joint limits, hands). The other AI does not change it; it uses it to test.
- **selfcheck.js**: a small test the other AI runs (\`node selfcheck.js <its folder>\`); it prints READY when the motion is right.
- **preview.html**: a page to open in a browser to SEE the drawings (choose the .js files it made).

When an AI finishes, bring its folder back to Claude in the Zancut project and say: "check this library delivery". It is checked on the
real pages (no AI cost), you both look at the picture of everything, and only then it is added.
`);
console.log(`Briefs packed in ${out}`);
for (const d of fs.readdirSync(out).sort()) console.log(" ", d, fs.statSync(path.join(out, d)).isDirectory() ? fs.readdirSync(path.join(out, d)).join(", ") : "");
