// Seeded defects: a person outside the frame, two people on one spot, a shot that is too short. Finds them, repairs them, proves the result.
// Usage: node scripts/qa-test.mjs   (writes docs/evidence/qa/{before,after}.film.json + report.json; render the two with codefilm-test.mjs)
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
import os0 from "node:os";
// a temporary data folder BEFORE any server module is imported (they read the data path once): the test never touches real data
process.env.ZANCUT_DATA = fs.mkdtempSync(path.join(os0.tmpdir(), "z2d-qa-data-"));
const { check, repair } = await import("../server/qa.mjs");
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const film = JSON.parse(fs.readFileSync(path.join(root, "examples/rafi.film.json"), "utf8"));
assert.equal(check(film, { duration: 10 }).filter((i) => i.severity === "error").length, 0, "the clean example has no errors");
const bad = JSON.parse(JSON.stringify(film));
bad.shots[1].people[0].x = -6.5;            // seeded 1: outside the frame
bad.shots[2].people[1].x = -1.0;            // seeded 2: on top of Rafi (x -1.2)
bad.shots[3].at = 9.8;                      // seeded 3: a 0.2 s shot
const issues = check(bad, { duration: 10 });
const cats = new Set(issues.map((i) => i.category)); for (const c of ["out-of-frame", "overlap", "timing"]) assert.ok(cats.has(c), `finds ${c}`);
const r = repair(bad, { duration: 10 });
assert.equal(r.remaining.length, 0, "after repair nothing remains: " + JSON.stringify(r.remaining));
// a repair that cannot clear its issue is rolled back (unknown place has no repair)
const worse = JSON.parse(JSON.stringify(bad)); worse.shots[0].place = "moon"; const w = repair(worse, { duration: 10 });
assert.ok(w.remaining.some((i) => i.category === "missing-asset"), "a missing place is reported, never invented");
const out = path.join(root, "docs/evidence/qa"); fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, "before.film.json"), JSON.stringify(bad, null, 1)); fs.writeFileSync(path.join(out, "after.film.json"), JSON.stringify(r.film, null, 1));
fs.writeFileSync(path.join(out, "report.json"), JSON.stringify({ found: issues.map(({ repair, ...i }) => i), repairs: r.log, remaining: r.remaining }, null, 1));
console.log(`qa test passed: ${issues.length} issues found, ${r.log.filter((x) => x.result === "applied").length} repaired, 0 remaining`);
issues.forEach((i) => console.log(` - [${i.category}] frame time ${i.t}s: ${i.evidence}`));

// ---------- Step 9: all 12 rules, each with an injected defect, repaired to 100% and rendered ----------
{
  const os = await import("node:os"), { execFileSync } = await import("node:child_process");
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "z2d-qa12-"));
  const { ZPHYS } = await import("../server/physics.mjs"), { validate, shotScript, kitFor } = await import("../server/codefilm.mjs"), { repairAsync, contrast, HEADLINE_COLORS } = await import("../server/qa.mjs");
  const base = JSON.parse(fs.readFileSync(path.join(root, "examples/rafi.film.json"), "utf8")), D = 31;
  const chart = { kind: "dynamic_comparison_chart", style: "bar", trend: "up", unit: "টাকা", bars: [{ label: "আগে", value: 40, text: "৪০", x: 0, w: 1, y: 1, h: 1 }, { label: "এখন", value: 70, text: "৭০", x: 2, w: 1, y: 0, h: 2 }], size: [560, 300], frame: [] };
  const film = { title: "QA: twelve defects", cast: base.cast, music: { volume: 0.4 }, shots: [
    { at: 0, place: "village_home", people: [{ who: "rafi", x: -1.2, dz: 1, do: "idle" }, { who: "তিন মাথার নীল রাক্ষস", x: 1.4, dz: 1.2, do: "idle" }], props: [{ id: "tea cup", x: 0.5, dz: 2 }, { id: "spaceshipX", x: 2, dz: 3 }] },        // R1 unknown creature, prop alias, unknown prop
    { at: 3, place: "bedroom", weather: "rain", people: [{ who: "rafi", x: -0.5, dz: 1, do: "idle", lift: 1.5 }], props: [{ id: "cloud" }] },                                       // R2 floating character, indoor rain clouds
    { at: 6, place: "kitchen", people: [{ who: "rafi", x: 0, dz: 1, do: "idle" }, { who: "baba", x: 0.2, dz: 1, do: "idle", facing: 1 }], props: [{ id: "table", x: 1.6, dz: 2 }, { id: "cup", m: 3, on: 0 }] }, // R3 giant teacup, R4 overlap + facing away
    { at: 9, place: "village_road", headline: "এই শিরোনামটি এত লম্বা যে কোনো ব্যানারে আঁটবে না কিছুতেই", people: [{ who: "rafi", x: 2.65, dz: 1, do: "idle", speaks: true }] }, // R5 speaker at the edge, overlong text
    { at: 12, place: "park", people: [{ who: "rafi", x: -1, dz: 1, do: "idle" }] },                                                                                                    // R6 a 9 s shot
    { at: 21, place: "park", people: [{ who: "rafi", x: -1, dz: 1, do: "idle" }] },                                                                                                    // R6 a 0.5 s shot
    { at: 21.5, place: "living_room", camera: { kind: "single", on: "baba" }, overlays: [chart], broll: { mode: "pip_corner", template: "clock_ticking" }, people: [{ who: "rafi", x: -1.5, dz: 1, do: "idle", gesture: false, speaks: true }, { who: "baba", x: 1.5, dz: 1, do: "idle", gesture: false, speaks: true }] }, // R7 static, R9 card over faces + card with pip, R10 two speakers + camera off the speaker, R12 no sounds
    { at: 24, place: "park", broll: { mode: "cutaway", template: "heavy_rain_clouds", seconds: 5 }, people: [{ who: "rafi", x: -1, dz: 1, do: "sit" }] },                                // R8 a 5 s cutaway
    { at: 26, place: "park", broll: { mode: "cutaway", template: "night_stars_moon" }, people: [{ who: "rafi", x: -1, dz: 1, do: "sit" }] },                                          // R8 two cutaways in a row
    { at: 28, place: "park", people: [{ who: "rafi", x: -1, dz: 1, do: "idle" }] },                                                                                                    // R11 seated → standing at the cut
  ] };
  const issues = check(film, { duration: D }), rules = new Set(issues.map((i) => i.rule));
  for (let n = 1; n <= 12; n++) assert.ok(rules.has(`R${n}`), `rule R${n} finds its defect (found: ${[...rules].join(", ")})`);
  const rp = repair(film, { duration: D }), f = rp.film;
  assert.deepEqual(rp.remaining, [], "100% repaired: " + JSON.stringify(rp.remaining.map((i) => i.evidence)));
  const shotAt = (t) => f.shots.find((s) => Math.abs(s.at - t) < 1e-6);
  // R1
  assert.equal(f.cast["তিন মাথার নীল রাক্ষস"].description, "তিন মাথার নীল রাক্ষস", "an unknown creature is built by the procedural creator");
  { const pr = shotAt(0).props, cup = pr.find((p) => p.id === "cup"); assert.ok(cup && !pr.some((p) => p.id === "spaceshipX" || p.id === "tea cup"), '"tea cup" is the library cup; the unknown spaceship is removed'); assert.ok(Number.isInteger(cup.on) && pr[cup.on], "and the cup rests on a surface"); }
  // R2
  assert.deepEqual(shotAt(3).weather, { kind: "rain", view: "window_weather_view" }); assert.ok(!shotAt(3).props.some((p) => p.id === "cloud"), "no cloud in the bedroom"); assert.equal(shotAt(3).people[0].lift, 0, "the floating character stands on the floor");
  // R3 / R4
  assert.ok(shotAt(6).props.find((p) => p.id === "cup").m <= ZPHYS.HEAD, "the giant teacup is a teacup again");
  { const [a, b] = shotAt(6).people; assert.ok(Math.abs(a.x - b.x) >= 0.7, "no overlap"); assert.ok((b.x > a.x ? a.facing === 1 && b.facing === -1 : a.facing === -1 && b.facing === 1), "they face each other"); }
  // R5
  assert.ok(Math.abs(shotAt(9).people[0].x) <= 2.8 * 0.85, "the speaker is inside the title-safe area"); assert.ok([...shotAt(9).headline].length <= 30, "the headline fits its banner");
  // R6
  assert.ok(f.shots.filter((s) => s.at >= 12 && s.at < 21).length === 2, "the 9 s shot is two camera angles"); assert.ok(!f.shots.some((s) => s.at === 21), "the 0.5 s shot is merged");
  // R7 / R9 / R10 / R12
  { const s = shotAt(21.5); assert.ok(s.camera.move, "the static shot moves"); assert.ok(s.people.every((p) => p.x < 0), "the card's side of the frame is free of faces"); assert.ok(!s.broll, "no b-roll card beside the data card");
    assert.equal(s.people.filter((p) => p.speaks).length, 1, "one speaker"); assert.equal(s.camera.on, s.people.find((p) => p.speaks).who, "the camera frames the speaker"); assert.ok(s.sfx.some((c) => c[0] === "tx-ui"), "the card pops with a sound"); }
  assert.ok(contrast(HEADLINE_COLORS.text, HEADLINE_COLORS.banner) >= 4.5, "headline contrast");
  // R8 / R11 / R12
  assert.equal(shotAt(24).broll.seconds, 3, "a cutaway lasts at most 3 s"); assert.equal(shotAt(26).broll.mode, "pip_corner", "no second cutaway in a row"); assert.ok(shotAt(24).sfx.some((c) => c[0] === "wh-short"), "a cutaway arrives with a whoosh");
  assert.equal(shotAt(28).people[0].blendFrom, "sit", "seated → standing blends"); assert.ok(f.music.volume <= 0.16 && f.music.duck, "the music sits under the voice");
  assert.deepEqual(validate(f), [], "the repaired film is a valid scene file");
  // the repaired film renders: every shot through compose and the body gate
  const job = path.join(temp, "job"); for (const d of ["cut", "work", "edit/graphics"]) fs.mkdirSync(path.join(job, d), { recursive: true });
  const shots = [...f.shots].sort((a, b) => a.at - b.at), ends = shots.map((s, i) => shots[i + 1]?.at ?? D);
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x222222:s=640x360:r=30", "-f", "lavfi", "-i", "anullsrc=r=48000", "-t", String(D), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", "-shortest", path.join(job, "cut/cut.mp4")]);
  fs.writeFileSync(path.join(job, "job.json"), "{}"); fs.writeFileSync(path.join(job, "edit/film-kit.js"), kitFor(f));
  fs.writeFileSync(path.join(job, "cut/transcript.json"), JSON.stringify(shots.map((s, i) => ({ text: "x", start: s.at, end: ends[i] - 0.01 }))));
  const plan = shots.map((s, i) => { const file = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(job, file), `<script>ZK.unit(root);\n${shotScript(s, f)}\n</script>\n<!--cues ${JSON.stringify(s.sfx || [])}-->`); return { row: i, uid: "s" + i, startWord: i, endWord: i, kind: "graphic", mode: "full-broll-takeover", file, transition: "cut", captions: "hide", cues: (s.sfx || []).filter((c) => c[1] < ends[i] - s.at) }; });
  fs.writeFileSync(path.join(job, "edit/plan.json"), JSON.stringify({ version: 2, canvas: "1920x1080", kind: "faceless", style: "2d-animation", captions: { on: false }, scenes: plan }));
  const built = JSON.parse(execFileSync(process.execPath, [path.join(root, "engine/compose/compose.mjs"), job], { encoding: "utf8" }).trim().split("\n").at(-1));
  const { checkBody } = await import("../engine/cartoon/check-body.mjs"), gate = await checkBody(path.join(job, "edit/hf"), { fps: 15 });
  assert.ok(gate.ok, gate.lines.slice(0, 8).join("\n")); assert.ok(built.sfx > 0, "the sound cues reach the mix");
  // R1 can also LEARN an unknown prop (server/web-learner.mjs, offline here) instead of removing it
  const propsFile = path.join(root, "engine/cartoon/library/learned-props.json"), had = fs.existsSync(propsFile) ? fs.readFileSync(propsFile) : null;
  try { const a = await repairAsync({ ...base, shots: [{ ...base.shots[0], props: [{ id: "telescope", x: 1, dz: 2 }] }] }, { duration: 3, online: false });
    assert.deepEqual(a.learned, [["telescope", "learnedTelescope"]]); assert.equal(a.film.shots[0].props[0].id, "learnedTelescope", "learned, not removed"); assert.deepEqual(a.remaining, []); }
  finally { if (had) fs.writeFileSync(propsFile, had); else fs.rmSync(propsFile, { force: true }); }
  fs.writeFileSync(path.join(out, "twelve-rules.json"), JSON.stringify({ found: issues.map(({ repair, ...i }) => i), repairs: rp.log, remaining: rp.remaining }, null, 1));
  console.log(`qa test (12 rules) passed: ${issues.length} issues across all 12 rules, ${rp.log.filter((x) => x.result === "applied").length} repairs applied, 0 remaining; the repaired film validates and renders (${gate.frames} frames through the body gate, ${built.sfx} sound cues); an unknown prop is learned`);
  fs.rmSync(temp, { recursive: true, force: true }); fs.rmSync(process.env.ZANCUT_DATA, { recursive: true, force: true });
}
