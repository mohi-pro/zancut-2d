// Self-check for a 2D library delivery: the same number checks Zancut runs, without the Zancut app.
// Keep zancut-body-engine.js (or Zancut's anatomy.js and hands.js) next to this file, then:
//   node selfcheck.js <your delivery folder>        (the folder holds actions/ gestures/ hands/)
// "ERROR" must be fixed before delivery; "warn" is worth a look. A clean run prints READY.
const fs = require("fs"), path = require("path");
const one = path.join(__dirname, "zancut-body-engine.js");
if (fs.existsSync(one)) require(one); else { require(path.join(__dirname, "hands.js")); require(path.join(__dirname, "anatomy.js")); }
const A = globalThis.ZANATOMY, H = globalThis.HANDS, dir = path.resolve(process.argv[2] || ".");
const errors = [], warns = [], ls = (k) => { try { return fs.readdirSync(path.join(dir, k)).filter((f) => f.endsWith(".json")).sort(); } catch { return []; } };
const load = (k, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, k, f), "utf8")); } catch (e) { errors.push(`${k}/${f}: not valid JSON (${e.message})`); return null; } };
const PROFILES = ["adult", "child", "elderly", "athletic"], bones = A.pose({ posture: "stand" }).lengths;
for (const f of ls("hands")) { const p = load("hands", f); if (p) try { H.addPose(path.basename(f, ".json"), p); } catch (e) { errors.push(`hands/${f}: ${e.message}`); } }
for (const f of ls("actions")) {
  const d = load("actions", f); if (!d) continue;
  if (`${d.id}.json` !== f) errors.push(`actions/${f}: the file name must be its id`);
  try { A.addPosture(d); } catch (e) { errors.push(`actions/${f}: ${e.message}`); continue; }
  d.keys.forEach((k, i) => {
    for (const [n, p] of Object.entries(A.PARENT)) { if (!p || bones[n] < 2) continue; const a = k.joints[n], b = k.joints[p], l = Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]), off = Math.abs(l - bones[n]) / bones[n];
      if (off > 0.15) errors.push(`actions/${f} key ${i}: ${p}→${n} is ${l.toFixed(1)} U, the body's is ${bones[n].toFixed(1)}`); else if (off > 0.07) warns.push(`actions/${f} key ${i}: ${p}→${n} is ${l.toFixed(1)} U (body ${bones[n].toFixed(1)})`); }
    const low = Math.min(...Object.values(k.joints).map((p) => p[1])); if (low < -0.5) errors.push(`actions/${f} key ${i}: a joint is under the floor`);
  });
  const us = [...new Set([...d.keys.map((k) => k.u), ...d.keys.slice(1).map((k, i) => (k.u + d.keys[i].u) / 2)])];
  for (const profile of PROFILES) for (const u of us) { const ps = A.pose({ posture: d.id, phase: u * 360 - (d.loop && u === 1 ? 1e-6 : 0), profile });
    for (const x of [...ps.faults, ...A.check(ps)]) { const far = x.rule === "H05" && Number((/([\d.]+) U/.exec(x.msg) || [])[1]) > 2; (far || x.rule !== "H05" ? errors : warns).push(`actions/${f} ${profile} u ${u.toFixed(2)}: ${x.rule} ${x.msg}`); } }
}
for (const f of ls("gestures")) {
  const d = load("gestures", f); if (!d) continue;
  try { A.addGesture(d); } catch (e) { errors.push(`gestures/${f}: ${e.message}`); continue; }
  for (const base of d.on || ["stand", "sit", "walk"]) for (const profile of PROFILES) for (const k of d.keys) { const ps = A.pose({ posture: base, phase: 35, profile, gesture: { id: d.id, phase: k.u * 360 } });
    for (const x of [...ps.faults, ...A.check(ps)]) errors.push(`gestures/${f} on ${base}, ${profile}, u ${k.u}: ${x.rule} ${x.msg}`); }
}
errors.forEach((e) => console.log("ERROR ", e)); warns.forEach((w) => console.log("warn  ", w));
console.log(errors.length ? `NOT READY: ${errors.length} error(s)` : "READY");
