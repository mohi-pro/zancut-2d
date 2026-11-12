// npm run lock-brain — packages the trained brain + libraries into data/brain/brain.zancut.enc (AES-256-GCM + HMAC, server/security-vault.mjs)
// and writes a client distribution to dist/client/: the vault, a bundled copy of the browser engine (one file, comments and blank lines
// stripped — bundling and minifying, not real obfuscation: shipped JavaScript can always be read), and a manifest with SHA-256 hashes.
// The build refuses to finish if any plain weights or library JSON ended up in dist/. The owner key never leaves data/hub/.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { lockBrain, readHeader } from "../server/security-vault.mjs";
const root = path.resolve(new URL("..", import.meta.url).pathname), dist = path.join(process.env.ZANCUT_DIST || path.join(root, "dist"), "client");
const state = (() => { try { return JSON.parse(fs.readFileSync(path.join(process.env.ZANCUT_DATA || path.join(root, "data"), "hub", "state.json"), "utf8")); } catch { return { version: 0 }; } })();
const v = lockBrain({ version: state.version || 1 });
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(dist, { recursive: true });
fs.copyFileSync(v.file, path.join(dist, "brain.zancut.enc"));
const ENGINE = ["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "creation-dna.js", "custom-assembler.js", "physics-logic.js", "broll-kit.js", "graphics-fx.js", "camera.js", "world.js", "set.js"];
const strip = (src) => src.replace(/^\s*\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "").split("\n").map((l) => l.trimEnd()).filter((l) => l.trim()).join("\n");
const bundle = ENGINE.map((f) => `/* ${f} */\n${strip(fs.readFileSync(path.join(root, "engine/cartoon", f), "utf8"))}`).join("\n");
fs.writeFileSync(path.join(dist, "zancut-engine.min.js"), bundle);
const files = fs.readdirSync(dist).map((f) => ({ file: f, bytes: fs.statSync(path.join(dist, f)).size, sha256: crypto.createHash("sha256").update(fs.readFileSync(path.join(dist, f))).digest("hex") }));
fs.writeFileSync(path.join(dist, "manifest.json"), JSON.stringify({ built: new Date().toISOString(), brainVersion: v.version, vault: readHeader(fs.readFileSync(v.file)).head.alg, files }, null, 1));
// no plain weights or library JSON in the distribution
const leaks = []; for (const f of fs.readdirSync(dist)) { const s = fs.readFileSync(path.join(dist, f)); for (const needle of ['"heads"', '"roles":{', '"clusters"', '#CONCEPT_', 'semantic-clusters', '"wordnet"']) if (s.includes(needle)) leaks.push(`${f}: ${needle}`); if (/\.(json)$/.test(f) && f !== "manifest.json") leaks.push(`${f}: a JSON file`); }
if (leaks.length) { console.error(`refusing: plain brain data in dist/: ${leaks.join("; ")}`); process.exit(1); }
console.log(`locked brain v${v.version} → ${path.relative(root, v.file)} (${(v.bytes / 1024).toFixed(0)} KB, AES-256-GCM + HMAC-SHA256); client → ${path.relative(root, dist)}/ (${files.map((f) => f.file).join(", ")}); no plain weights shipped`);
