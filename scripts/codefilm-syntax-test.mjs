// Every shot kind × face × day/night × action → the generated scene script must compile (no AI, ~1 s).
import fs from "node:fs";
import { shotScript } from "../server/codefilm.mjs";
const film = JSON.parse(fs.readFileSync(new URL("../examples/rafi.film.json", import.meta.url), "utf8")); let n = 0, bad = 0;
for (const kind of ["establish", "wide", "two", "single", "close"]) for (const face of ["neutral", "happy", "sad", "worried", "surprised"]) for (const night of [false, true]) for (const act of ["idle", "walk", "wave", "sit", "point", "cheer"]) {
  const shot = { at: 0, place: "village_home", night, camera: { kind, on: "rafi" }, people: [{ who: "rafi", x: -1, dz: 1, do: act, face, speaks: true, to: 1 }, { who: "baba", x: 1, dz: 1, do: "idle", facing: -1 }] };
  n++; try { new Function("tl", "root", "s", "d", "words", "ZK", "at", shotScript(shot, film)); } catch (e) { bad++; console.log(kind, face, night, act, e.message); }
}
console.log(bad ? `FAILED: ${bad} of ${n} scripts do not compile` : `ok: ${n} generated scripts compile`); process.exit(bad ? 1 : 0);
