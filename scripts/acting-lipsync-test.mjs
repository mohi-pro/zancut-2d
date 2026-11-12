// Part 1 of the master upgrade, measured in a real composed page (temporary data, no model):
//   lip-sync   — a voice with clear pauses (tone bursts) and Bangla words: the shot's focus person opens the mouth while the voice
//                sounds and closes it in the pauses; a listener's mouth stays shut; nobody set "speaks" (the default speaker)
//   acting     — automatic gestures are conversational only, damped (talk 0.35 / listen 0.3) and rest between moves; a big move
//                needs the sentence's own words and a sure brain; the default "calm while talking" strict rule blocks the rest
//   beat sync  — a prop the words name appears at the moment its word is spoken
//   framing    — in a 9:16 two-shot with a two-line headline, every face sits below the headline
//   Bangla     — transcript words are NFC (a decomposed ো becomes one letter), labels are cut by grapheme, conjuncts are shaped
//   body gate  — every frame passes (feet planted, no jumps)
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(new URL("..", import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), "z2d-lip-"));
process.env.ZANCUT_DATA = path.join(temp, "data"); fs.mkdirSync(path.join(temp, "data/brain"), { recursive: true });
fs.copyFileSync(path.join(root, "data/brain/model.json"), path.join(temp, "data/brain/model.json"));
const learnedProps = path.join(root, "engine/cartoon/library/learned-props.json"), lpBackup = fs.existsSync(learnedProps) ? fs.readFileSync(learnedProps) : null;
try {
  // ---------- rules and code (no page) ----------
  const E = await import("../server/energy.mjs"), C = await import("../server/codefilm.mjs"), BS = await import("../server/beat-sync.mjs"), SR = await import("../server/strict-rules.mjs");
  assert.ok(E.allowHigh("run", "সবাই ভয়ে দৌড়ে পালাল।", 0.92), "a run the words say, with a sure brain, stays");
  assert.ok(!E.allowHigh("run", "রাফি মাকে সব কথা বলল।", 0.95), "a run nobody said is refused");
  assert.ok(!E.allowHigh("jump", "রাফি লাফ দিল।", 0.6), "an unsure brain cannot make anyone jump");
  assert.ok(E.allowHigh("talk_explain", "anything", 0.1), "calm moves are always allowed");
  const people = [{ who: "rafi", x: -1.1 }, { who: "mother", x: 1.1 }];
  assert.deepEqual([...C.talkersOf({ camera: { on: "mother" } }, people)], ["mother"], "the focus voices the line by default");
  assert.deepEqual([...C.talkersOf({}, people)], ["rafi"], "no focus: the first person");
  assert.deepEqual([...C.talkersOf({}, [{ who: "rafi", speaks: false }, { who: "mother", speaks: true }])], ["mother"], "an explicit speaks wins");
  assert.equal(C.talkersOf({}, people, { lipSync: false }).size, 0);
  const film0 = { cast: { rafi: { gender: "male", age: "adult" }, mother: { gender: "female", age: "adult" } } };
  const code = C.shotScript({ at: 0, place: "living_room", camera: { kind: "two", on: "rafi" }, people: [{ who: "rafi", x: -1.1, do: "idle", face: "happy" }, { who: "mother", x: 1.1, do: "idle", face: "neutral" }] }, film0);
  assert.equal((code.match(/ZC\.lip\(t \+ s, words\)/g) || []).length, 1, "one talker's mouth follows the voice");
  assert.ok(/amount: 0\.35/.test(code) && /amount: 0\.3\b/.test(code), "talking hands at 35 %, listening at 30 %");
  const used = [...code.matchAll(/\["([a-z_]+)",[\d.]+\]/g)].map((m) => m[1]); assert.ok(used.length && used.every((g) => E.isCalm(g)), `automatic gestures are conversational only: ${used}`);
  assert.ok(!/hug_open_arms|thumbs_up|hands_to_cheeks|fist_pump/.test(code), "no big or reaction moves on a loop");
  // the default strict rule on a planned shot: a big move nobody said is replaced
  const shot = { place: "park", people: [{ who: "rafi", do: "run" }, { who: "mina", do: "idle", gesture: "fist_pump" }] };
  const fired = SR.applyToPlan(shot, "রাফি আর মিনা পার্কে গল্প করছে।", { rules: SR.listRules(), conf: { action: 0.95 } });
  assert.equal(shot.people[0].do, "idle"); assert.ok(fired.some((f) => f.rule === "calm-talk" && /blocked run/.test(f.did)), "calm-talk blocks the run");
  // beat sync and Bangla text
  assert.deepEqual(BS.thingsIn("মা বাজার থেকে একটা ছাতা কিনল।").map((x) => x.id), ["umbrella"]);
  const timed = BS.propTimes({ props: [{ id: "umbrella", word: "ছাতা" }] }, [{ text: "মা", start: 3 }, { text: "ছাতাটা", start: 3.8 }], 3); assert.equal(timed.props[0].at, 0.8, "the prop appears when its word is said");
  const { captionTrack } = await import("../server/caption-writer.mjs"), decomposed = "বোো".replace("বো", "ব"); // ব + ে + া (two signs for ো)
  assert.notEqual(decomposed, decomposed.normalize("NFC")); assert.equal(captionTrack([{ text: decomposed + "ন", start: 0, end: 0.5 }]).subtitles[0].words[0].text, "বোন", "caption words are NFC");
  console.log("ok: big moves need the words + a sure brain; the focus talks by default; automatic gestures calm and damped; calm-talk rule; beat-sync timing; NFC captions");

  // ---------- a voice with pauses → the composed page ----------
  const store = await import("../server/store.mjs"), agent = await import("../server/agent.mjs"), { localOwner } = await import("../server/local-owner.mjs"), { jobDir, zen } = await import("../server/director.mjs");
  const p = store.create({ name: "lip-sync", ownerId: localOwner().id, mode: "faceless", language: "bn" });
  const BURSTS = [[0.4, 2.2], [3.0, 5.6], [6.4, 8.6]], SECS = 9.4, d = store.dirs(p.id); fs.mkdirSync(d.assets, { recursive: true });
  const on = BURSTS.map(([a, b]) => `between(t,${a},${b})`).join("+");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", `sine=f=180:sample_rate=48000:duration=${SECS}`, "-af", `volume='if(${on},0.7*(0.55+0.45*abs(sin(2*PI*4*t))),0)':eval=frame`, path.join(d.assets, "voice.wav")]);
  const W = [["আজ", 0.45, 0.8], ["আমরা", 0.85, 1.3], ["বাজারে", 1.35, 2.15], ["মা", 3.05, 3.4], ["একটা", 3.45, 3.9], ["ছাতা", 3.95, 4.5], ["কিনলেন", 4.55, 5.5], ["ক্ষমা", 6.45, 7.0], ["করো", 7.05, 7.5], ["বোোন", 7.55, 8.5]].map(([text, start, end]) => ({ text, start, end }));
  W[W.length - 1].text = "বোন।"; W[2].text += "।"; W[6].text += "।"; // the last word decomposed on purpose (ো as ে + া)
  const cache = path.join(d.ws, "transcripts", "plate-plate"); fs.mkdirSync(cache, { recursive: true }); fs.writeFileSync(path.join(cache, "transcript.json"), JSON.stringify(W)); fs.writeFileSync(path.join(cache, "meta.json"), JSON.stringify({ language: "bn", conf: 1, words: W.length, tags: null }));
  Object.assign(p, { kind: "animation", format: "9:16", designStyle: "2d-animation", theme: "light", aiVoice: false, assets: [{ file: "voice.wav", role: "voiceover", hasAudio: true, duration: SECS }],
    film: { music: false, cast: { rafi: { gender: "male", age: "adult", skin: 3, outfit: { type: "shirt", color: "#3977ae" } }, mother: { gender: "female", age: "adult", skin: 3, outfit: { type: "salwar", color: "#c05050" } } },
      shots: [{ at: 0, place: "living_room", camera: { kind: "single", on: "rafi" }, headline: "আজ আমরা বাজারে", people: [{ who: "rafi", x: 0, do: "idle", face: "happy" }] },
        { at: 2.9, place: "market_bazaar", camera: { kind: "two", on: "mother" }, headline: "মা একটা ছাতা কিনলেন বাজার থেকে", props: [{ id: "umbrella", word: "ছাতা", zone: "HELD_IN_HAND", by: "mother" }], people: [{ who: "rafi", x: -1.1, do: "idle" }, { who: "mother", x: 1.1, do: "idle" }] },
        { at: 6.3, place: "living_room", camera: { kind: "close", on: "rafi" }, people: [{ who: "rafi", x: 0, do: "idle", face: "neutral" }] }] } });
  store.save(p, { immediate: true });
  const job = (kind) => new Promise((ok, no) => { const t = setTimeout(() => no(new Error(kind + " timed out")), 240000); agent.setJobDone((r) => { clearTimeout(t); setImmediate(() => (r.ok ? ok() : no(new Error(`${kind}: ${store.get(p.id)?.error}`)))); }); agent.enqueue(p.id, kind); });
  await job("prepare"); await job("storyboard"); const comp = await zen(d.ws, ["compose"]); assert.notEqual(comp?.ok, false, JSON.stringify(comp).slice(0, 300));
  const J0 = jobDir(d.ws), auto = JSON.parse(fs.readFileSync(path.join(J0, "work", "auto-graphics.json"), "utf8")), lip = JSON.parse(fs.readFileSync(path.join(J0, "work", "lipsync.json"), "utf8"));
  assert.ok(lip.voice && lip.voiced < lip.frames * 0.85 && lip.voiced > lip.frames * 0.5, `the voice envelope has its pauses: ${lip.voiced}/${lip.frames} voiced`);
  assert.deepEqual(auto.map((a) => a.talkers), [["rafi"], ["mother"], ["rafi"]]);
  const um = auto[1].props.find((x) => x.id === "umbrella"); assert.ok(um && Math.abs(um.at - (3.95 - 3.05)) < 0.15, `the umbrella appears when "ছাতা" is said (${um?.at} s into the shot)`);
  const cw = JSON.parse(fs.readFileSync(path.join(J0, "work", "captions.json"), "utf8")); assert.ok(cw.subtitles.flatMap((c) => c.words.map((w) => w.text)).includes("বোন।"), "the decomposed word reaches the captions as one NFC word");

  const { openPage, showAt } = await import("../engine/readcheck.mjs"), { checkBody } = await import("../engine/cartoon/check-body.mjs"), hf = path.join(J0, "edit", "hf");
  const o = await openPage(hf); const voiced = (t) => BURSTS.some(([a, b]) => t > a + 0.12 && t < b - 0.12), silent = (t) => !BURSTS.some(([a, b]) => t > a - 0.25 && t < b + 0.25);
  const samples = [];
  for (let t = 0.05; t < SECS - 0.1; t += 0.1) { await o.page.evaluate(() => { window.__who = {}; window.__shots = {}; window.__fx = {}; }); await showAt(o.page, t);
    samples.push({ t, ...(await o.page.evaluate(() => { const who = Object.values(window.__who || {}).map((x) => ({ cast: x.cast, mouth: x.mouth })); return { who }; })) }); }
  const mouthOf = (s, cast) => Math.max(0, ...s.who.filter((x) => x.cast === cast).map((x) => x.mouth || 0));
  const talkerAt = (t) => (t < 2.9 || t >= 6.3 ? "rafi" : "mother"), V = samples.filter((s) => voiced(s.t)), S = samples.filter((s) => silent(s.t));
  const openV = V.filter((s) => mouthOf(s, talkerAt(s.t)) > 0.05).length / V.length, shutS = S.filter((s) => mouthOf(s, talkerAt(s.t)) < 0.02).length / S.length;
  const listener = samples.filter((s) => s.t > 3.3 && s.t < 6.0).every((s) => mouthOf(s, "rafi") === 0);
  assert.ok(openV >= 0.8, `the talker's mouth is open while the voice sounds (${(openV * 100).toFixed(0)}% of voiced frames)`);
  assert.ok(shutS >= 0.95, `and shut in the pauses (${(shutS * 100).toFixed(0)}% of silent frames)`); assert.ok(listener, "the listener's mouth stays shut: " + JSON.stringify(samples.filter((s) => s.t > 3.3 && s.t < 6.0 && mouthOf(s, "rafi") !== 0).slice(0, 4).map((s) => ({ t: +s.t.toFixed(2), who: s.who }))));
  // framing: in the 9:16 two-shot with a two-line headline, every face is below the headline
  await o.page.evaluate(() => { window.__shots = {}; window.__fx = {}; }); await showAt(o.page, 5.4);
  const fr = await o.page.evaluate(() => { const fx = Object.values(window.__fx || {}).find((r) => r.list?.headline), hb = fx ? (fx.list.headline.y + fx.list.headline.h) / fx.frame.h : null;
    const eyes = Object.values(window.__shots || {}).filter((x) => x.svg?.__cam).map((x) => { const c = x.svg.__cam; return (x.box.headTop - (c.y - c.ch / 2)) / c.ch; }); return { hb, eyes }; });
  assert.ok(fr.hb && fr.eyes.length >= 2 && fr.eyes.every((e) => e > fr.hb), `faces below the headline: head tops ${fr.eyes.map((e) => e.toFixed(2))} vs headline bottom ${fr.hb?.toFixed(2)}`);
  // Bangla shaping with the bundled fonts: a conjunct is narrower than its parts drawn apart, and NFC text in the SVG
  const shape = await o.page.evaluate(async () => { await document.fonts.ready; const c = document.createElement("canvas").getContext("2d"), r = {}; for (const f of ["Hind Siliguri", "Anek Bangla"]) { c.font = `700 80px "${f}"`; r[f] = { whole: c.measureText("ক্ষ").width, apart: c.measureText("ক্‌ষ").width, ok: document.fonts.check(`700 80px "${f}"`, "ক্ষ") }; }
    const texts = [...document.querySelectorAll("text")].map((t) => t.textContent).filter((s) => /[ঀ-৿]/.test(s)); return { r, texts: texts.length, nfc: texts.every((s) => s === s.normalize("NFC")) }; });
  for (const [f, x] of Object.entries(shape.r)) assert.ok(x.ok && x.whole < x.apart * 0.92, `${f} shapes ক্ষ as one conjunct (${x.whole.toFixed(0)} vs ${x.apart.toFixed(0)} px apart)`);
  assert.ok(shape.texts > 0 && shape.nfc, "Bangla SVG text is NFC");
  await o.close?.();
  const gate = await checkBody(hf); assert.ok(gate.ok, gate.lines.join("\n"));
  console.log(`ok: lip-sync open ${(openV * 100).toFixed(0)}% of voiced frames, shut ${(shutS * 100).toFixed(0)}% of pauses, listener shut; umbrella at ${um.at} s (its word); faces below a two-line 9:16 headline; ক্ষ shaped in Hind Siliguri + Anek Bangla; NFC captions; body gate ${gate.frames} frames`);
} finally {
  if (lpBackup) fs.writeFileSync(learnedProps, lpBackup);
  fs.rmSync(temp, { recursive: true, force: true });
}
process.exit(0);
