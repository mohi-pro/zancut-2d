// The studio UI over real HTTP and in a real headless browser (temporary data; engine library and brain files restored).
//   customer app (/)   — exactly three steps (Voice & Story · Customize Scenes · Export MP4); the shot controls (b-roll, mode,
//                        graphic, camera move, headline) change the scene file; no owner tools; the mobile preview toggles
//   owner admin (/admin) — owner sign-in; 📥 feeder (bulk preview → feed, test sentences refused, the offline teacher, topics),
//                        🎥 reference-video style (measured, applied), 🚫 strict rules (natural text → rule, toggle, delete),
//                        🧪 sandbox (random story → brain + rules + QA → a playable page + receipt; 👍 teaches; 👎 fixes, teaches
//                        and rebuilds), 🔐 users (create, kill-switch), quarantine approve → re-encrypted vault, Lock & Encrypt
//   every /api/admin route refuses a missing or customer session
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { spawn, execFileSync } from "node:child_process";
const root = path.resolve(new URL("..", import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), "z2d-ui-"));
process.env.ZANCUT_DATA = path.join(temp, "data"); delete process.env.ZANCUT_OWNER_PASSPHRASE;
fs.mkdirSync(path.join(temp, "data/brain"), { recursive: true }); fs.copyFileSync(path.join(root, "data/brain/model.json"), path.join(temp, "data/brain/model.json"));
const guard = ["engine/cartoon/library/learned-props.json", "brain/calibration.json"].map((f) => path.join(root, f)).map((f) => ({ f, had: fs.existsSync(f), b: fs.existsSync(f) ? fs.readFileSync(f) : null }));
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(path.join(root, f))).digest("hex");
const before = { noai: crypto.createHash("md5").update(fs.readFileSync(path.join(root, "server/no-ai.mjs"))).digest("hex"), real: sha("brain/real-test.jsonl"), seed: sha("brain/seed.jsonl") };
const H = await import("../server/central-hub.mjs");
const { chromePath } = await import("../engine/readcheck.mjs"), puppeteer = (await import("puppeteer-core")).default;
let app, browser;
try {
  H.setOwnerPassword("owner-secret-123");
  const socket = net.createServer(); await new Promise((r) => socket.listen(0, "127.0.0.1", r)); const port = socket.address().port; await new Promise((r) => socket.close(r));
  app = spawn(process.execPath, ["server/index.mjs"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] }); let logs = ""; app.stdout.on("data", (b) => (logs += b)); app.stderr.on("data", (b) => (logs += b));
  const B = `http://127.0.0.1:${port}`; for (let i = 0; i < 150; i++) { try { if ((await fetch(B + "/api/library")).ok) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  const call = async (p, body, { method, token, raw } = {}) => { const r = await fetch(B + p, { method: method || (body || raw ? "POST" : "GET"), headers: { ...(raw ? { "content-type": "application/octet-stream" } : { "content-type": "application/json" }), ...(token ? { authorization: "Bearer " + token } : {}) }, body: raw || (body ? JSON.stringify(body) : undefined) }); return { status: r.status, body: await r.json().catch(() => null) }; };
  const until = async (fn, what, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { const v = await fn(); if (v) return v; await new Promise((r) => setTimeout(r, 300)); } throw new Error("timed out waiting for " + what); };

  // ---------- endpoints the customer app uses ----------
  const lib = (await call("/api/library")).body;
  assert.ok(lib.brollTemplates.length >= 20 && lib.graphicKinds.includes("dynamic_comparison_chart") && lib.cameraMoves.includes("slow_push_in") && lib.places.length >= 20);
  const made = (await call("/api/command", { text: "তিন মাথার নীল রাক্ষস বানাও" })).body; assert.equal(made.kind, "creation"); assert.equal(made.dna.headCount, 3);
  const proj = (await call("/api/projects", { name: "UI test", language: "bn" })).body;
  const planned = (await call(`/api/projects/${proj.id}/plan`, { script: "রাফি সকালে বাজারে গেল। চালের দাম বাড়ছে, সবাই চিন্তিত। সে বাড়ি ফিরে মাকে সব বলল। বিকেলে মাঠে ক্রিকেট খেলা হলো।" })).body;
  assert.ok(planned.film?.shots?.length >= 3 && planned.film.plan.receipts?.length === 4, "the plan carries a decision receipt per sentence");
  console.log(`ok: library extras; command → creation; a ${planned.film.shots.length}-shot plan with ${planned.film.plan.receipts.length} receipts`);

  // ---------- the admin API: owner only ----------
  const own = (await call("/api/hub/owner/login", { password: "owner-secret-123" })).body.token;
  await call("/api/hub/users", { id: "customer1", password: "pass-customer1", deviceLimit: 2 }, { token: own });
  const c1 = (await call("/api/hub/login", { id: "customer1", password: "pass-customer1", deviceId: "phone-aaa111" })).body;
  for (const [p, b] of [["/api/admin/rules"], ["/api/admin/feed/preview", { text: "x" }], ["/api/admin/sandbox", { random: true }]]) { assert.equal((await call(p, b)).status, 401, `${p} needs a session`); assert.equal((await call(p, b, { token: c1.token })).status, 403, `${p} refuses a customer`); }
  // 📥 bulk feeder: preview, a real-test sentence is marked and refused, feeding trains at once
  const realLine = fs.readFileSync(path.join(root, "brain/real-test.jsonl"), "utf8").split("\n")[0], realText = JSON.parse(realLine).text;
  const prev = (await call("/api/admin/feed/preview", { text: `মিনা হাসপাতালে ডাক্তারের সাথে কথা বলছে।\n${realText}\n{"text":"করিম অফিসে ল্যাপটপে কাজ করছে।","place":"office_room"}` }, { token: own })).body.rows;
  assert.equal(prev.length, 3); assert.ok(prev[1].test, "a real-test sentence is marked"); assert.equal(prev[2].labels.place, "office_room"); assert.deepEqual(prev[2].given, ["place"]);
  const fed = (await call("/api/admin/feed", { rows: prev.map((r) => ({ text: r.text, ...r.labels })) }, { token: own })).body;
  assert.equal(fed.fed, 2); assert.equal(fed.refused.length, 1); assert.match(fed.refused[0].why, /test sentence/);
  const fedFile = fs.readFileSync(path.join(temp, "data/brain/fed.jsonl"), "utf8"); assert.ok(!fedFile.includes(realText), "the real-test sentence never reaches fed.jsonl");
  // the offline teacher
  const tch = (await call("/api/admin/teacher", { topic: "শেয়ার বাজার", n: 100 }, { token: own })).body;
  assert.equal(tch.rows.length, 100); assert.equal(new Set(tch.rows.map((r) => r.text)).size, 100); assert.ok(tch.rows.some((r) => r.labels.graphic === "dynamic_comparison_chart"), "numbers → a chart label");
  assert.equal((await call("/api/admin/feed", { rows: tch.rows.map((r) => ({ text: r.text, ...r.labels })) }, { token: own })).body.fed, 100);
  // 🚫 strict rules: the four defaults, natural text → a rule, toggle, delete
  const rs0 = (await call("/api/admin/rules", null, { token: own })).body; assert.deepEqual(rs0.map((r) => r.id), ["calm-talk", "indoor-broll", "money-graphic", "compare-chart"]);
  const nr = (await call("/api/admin/rules", { text: "When talking never use actions [jump, dance]" }, { token: own })).body; assert.deepEqual([nr.kind, nr.head, nr.values], ["never", "action", ["jump", "dance"]]);
  assert.equal((await call(`/api/admin/rules/${nr.id}`, { active: false }, { token: own })).body.active, false);
  assert.equal((await call(`/api/admin/rules/${nr.id}`, null, { method: "DELETE", token: own })).status, 200);
  assert.equal((await call("/api/admin/rules", { text: "hello there" }, { token: own })).status, 422, "an unreadable rule is refused with a hint");
  // 🎥 a reference video (6 s, 3 cuts, a tone with pauses) is measured and applied
  const vid = path.join(temp, "ref.mp4");
  execFileSync("ffmpeg", ["-v", "error", "-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=25:duration=2", "-f", "lavfi", "-i", "smptebars=size=320x240:rate=25:duration=2", "-f", "lavfi", "-i", "color=c=red:size=320x240:rate=25:duration=2", "-f", "lavfi", "-i", "sine=f=300:duration=6", "-filter_complex", "[0][1][2]concat=n=3:v=1:a=0[v];[3]volume='if(between(t,2,2.6),0,1)':eval=frame[a]", "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-c:a", "aac", vid]);
  const vp = (await call("/api/admin/learn-from-video?name=ref.mp4", null, { token: own, raw: fs.readFileSync(vid) })).body.profile;
  assert.equal(vp.shots, 3); assert.ok(Math.abs(vp.avgShotSeconds - 2) < 0.3, `average shot ${vp.avgShotSeconds} s`); assert.ok(vp.audio && vp.audio.pausesPerMinute > 0 && Number.isFinite(vp.audio.loudnessLUFS));
  assert.equal((await call("/api/admin/style/apply", { profile: vp, source: "ref.mp4" }, { token: own })).body.applied.shotSeconds, 2);
  console.log(`ok: admin API owner-only (401/403); feeder 2 fed + 1 real-test sentence refused; teacher 100 unique examples fed; 4 default rules + natural rule toggle/delete; video: ${vp.shots} shots, ${vp.avgShotSeconds} s average, ${vp.audio.loudnessLUFS} LUFS → applied`);

  // a customer's rule waits in the quarantine for the browser
  const delta = { type: "rule", text: "যখন স্ক্রিপ্টে শেয়ার বাজারের কথা থাকবে তখন place হবে office_room আর graphic হবে dynamic_comparison_chart" };
  assert.equal((await call("/api/hub/submit-learning", { delta, signature: H.signDelta(delta, c1.sessionKey) }, { token: c1.token })).status, 200);

  // ---------- the browser: the customer app ----------
  browser = await puppeteer.launch({ executablePath: chromePath(), headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage(), errors = []; page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && !/Failed to load resource/.test(m.text()) && errors.push(m.text()));
  page.on("dialog", (d) => d.accept());
  await page.setViewport({ width: 1280, height: 900 }); await page.goto(B + "/", { waitUntil: "networkidle0" });
  const wait = (fn, what, ms) => until(() => page.evaluate(fn).catch(() => false), what, ms).catch(async (e) => { throw new Error(`${e.message} — page: ${await page.evaluate(() => (document.querySelector('#sm')?.textContent || '') + ' | ' + (typeof SB === 'object' && SB ? JSON.stringify({ stage: SB.stage, error: SB.error }) : '')).catch(() => '')} — server: ${logs.slice(-600)}`); });
  const snap = async (n) => process.env.UI_SHOTS && page.screenshot({ path: path.join(process.env.UI_SHOTS, n + ".png"), fullPage: true });
  const tabTo = async (k) => { await page.click(`#tabs button[data-k="${k}"]`); await new Promise((r) => setTimeout(r, 300)); };
  await page.select("#proj", proj.id).catch(() => {}); await wait(() => document.querySelector("#script"), "the story step");
  assert.deepEqual(await page.$$eval("#tabs button", (b) => b.map((x) => x.textContent)), ["1. Voice & Story", "2. Customize Scenes", "3. Export MP4"], "three steps only");
  for (const k of ["render", "story"]) { await tabTo(k); assert.ok(await page.$("#main .card"), `the ${k} step draws`); }
  await tabTo("board"); await wait(() => document.querySelector("[data-cx]"), "the scene controls");
  assert.equal(await page.$("#cmdt"), null, "no owner command bar for customers"); assert.equal(await page.$(".conf"), null, "no confidence badges for customers");
  const setCtl = async (f, v, i = 1) => { await page.select(`[data-cx="${i}"][data-f="${f}"]`, v); await new Promise((r) => setTimeout(r, 600)); return (await call(`/api/projects/${proj.id}`)).body.film.shots[i]; };
  const tpl = lib.brollTemplates[1].id;
  assert.equal((await setCtl("broll", tpl)).broll.template, tpl); assert.equal((await setCtl("bmode", "pip_corner")).broll.mode, "pip_corner"); assert.equal((await setCtl("broll", "none")).broll, false);
  assert.deepEqual((await setCtl("graphic", "percentage_progress_ring")).brain.graphic, { label: "percentage_progress_ring", conf: 1 }); assert.equal((await setCtl("move", "steady")).camera.move, "steady");
  await page.$eval('[data-cx="1"][data-f="headline"]', (e) => { e.value = "চালের দাম"; e.dispatchEvent(new Event("change")); }); await new Promise((r) => setTimeout(r, 600));
  assert.equal((await call(`/api/projects/${proj.id}`)).body.film.shots[1].headline, "চালের দাম"); await snap("customer");
  await page.click("#mob"); const w = await page.$eval("main", (m) => m.getBoundingClientRect().width); assert.ok(w <= 400 && (await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)), "phone frame"); await page.click("#mob");
  console.log("ok: browser / — 3 steps only, no owner tools; b-roll/mode/none, graphic, camera, headline save; mobile preview");

  // ---------- the browser: /admin ----------
  await page.goto(B + "/admin", { waitUntil: "networkidle0" });
  await page.type("#pw", "owner-secret-123"); await page.click("#go"); await wait(() => document.querySelectorAll("#tabs button").length === 5, "the five admin tabs");
  assert.deepEqual(await page.$$eval("#tabs button", (b) => b.map((x) => x.textContent)), ["📥 Feeder", "🎥 Reference video", "🚫 Rules", "🧪 Sandbox", "🔐 Users & vault"]);
  await page.$eval("#bulk", (e) => (e.value = "নাবিলা স্কুলে বই পড়ছে।\nসাকিব মাঠে ক্রিকেট খেলছে।")); await page.click("#bp"); await wait(() => document.querySelectorAll("#ft select").length === 12, "the preview table");
  await page.select('#ft select[data-r="1"][data-h="place"]', "school_yard"); await page.click("#bfd"); await wait(() => /Fed 2 sentences/.test(document.querySelector("#bm").textContent), "feeding");
  assert.ok(fs.readFileSync(path.join(temp, "data/brain/fed.jsonl"), "utf8").includes('"text":"সাকিব মাঠে ক্রিকেট খেলছে।","place":"school_yard"'), "the owner's corrected label is what is fed");
  await page.type("#tt", "ক্রিকেট"); await page.$eval("#tn", (e) => (e.value = "20")); await page.click("#tgen"); await wait(() => document.querySelectorAll("#gtb tr").length === 21, "teacher rows"); await snap("admin-feeder");
  await page.click('#tabs button[data-k="rules"]'); await wait(() => document.querySelector("#rt"), "the rules tab");
  await page.type("#rt", "When place is bedroom or classroom never use outdoor b-roll"); await page.click("#rp"); await wait(() => /never broll/.test(document.querySelector("#rm").textContent), "rule preview");
  await page.$eval('[data-tg="money-graphic"]', (c) => c.closest("label").click()); await new Promise((r) => setTimeout(r, 500)); assert.equal((await call("/api/admin/rules", null, { token: own })).body.find((r) => r.id === "money-graphic").active, false, "the toggle disables a rule");
  await page.$eval('[data-tg="money-graphic"]', (c) => c.closest("label").click()); await new Promise((r) => setTimeout(r, 500)); await snap("admin-rules");
  // 🧪 the sandbox: a random story → a playable page and the decision receipt
  await page.click('#tabs button[data-k="sandbox"]'); await wait(() => document.querySelector("#sr"), "the sandbox tab");
  await page.click("#sr"); await wait(() => !!document.querySelector("#pv")?.contentWindow?.__timelines?.main, "the sandbox preview", 240000);
  const sbId = await page.evaluate(() => SB.id), st = (await call(`/api/admin/sandbox/${sbId}`, null, { token: own })).body;
  assert.equal(st.stage, "ready"); assert.ok(st.receipts.length >= 3 && st.shots.length >= 2, "receipt + shots"); assert.ok(st.lipsync.shotsWithASpeaker >= 1 && st.lipsync.syllables > 10, "lip-sync is on");
  assert.ok(!(await call("/api/projects")).body.some((p) => p.id === sbId), "a sandbox never shows in the customer's list");
  await page.click("#pp"); await new Promise((r) => setTimeout(r, 1200)); await page.click("#pp");
  const shown = await page.$eval("#pt", (e) => parseFloat(e.textContent)); assert.ok(shown > 0.5, `the preview plays (${shown} s)`);
  assert.ok(await page.evaluate(() => [...document.querySelector("#pv").contentDocument.querySelectorAll(".clip[data-start]")].some((c) => c.style.visibility !== "hidden")), "a scene is on screen");
  await snap("admin-sandbox");
  const nFb = () => fs.existsSync(path.join(temp, "data/brain/feedback.jsonl")) ? fs.readFileSync(path.join(temp, "data/brain/feedback.jsonl"), "utf8").trim().split("\n").length : 0, fb0 = nFb();
  await page.click('[data-good="1"]'); await wait(() => document.querySelector('[data-good="1"]').disabled, "👍"); assert.equal(nFb(), fb0 + 1, "👍 teaches the shot");
  await page.click('[data-fixit="1"]'); await page.select('[data-fixbox="1"] [data-fx="place"]', "river_ghat"); await page.click('[data-save="1"]');
  await new Promise((r) => setTimeout(r, 2000)); await wait(() => SB.stage === "ready" && !!document.querySelector("#pv"), "the rebuilt preview", 240000);
  const st2 = (await call(`/api/admin/sandbox/${sbId}`, null, { token: own })).body; assert.equal(st2.shots[0].place, "river_ghat", "👎 fix → the shot is rebuilt with the correction"); assert.equal(nFb(), fb0 + 2, "and the correction is learned");
  console.log(`ok: browser /admin — sign-in, 5 tabs, feeder preview → corrected label fed, teacher, rules check + toggle, sandbox ${st.shots.length} shots playing with receipt (lip-sync ${st.lipsync.shotsWithASpeaker}/${st.lipsync.shots} shots, ${st.lipsync.syllables} syllables), 👍 learned, 👎 fixed + rebuilt`);
  // 🔐 users, quarantine, vault
  await page.click('#tabs button[data-k="users"]'); await wait(() => document.querySelector("#lock"), "the users tab");
  await page.type("#hu", "customer2"); await page.type("#hp", "pass-customer2"); await page.click("#hadd"); await wait(() => document.querySelector('[data-hks="customer2"]'), "the new user");
  await page.click('[data-hks="customer2"]'); await wait(() => document.querySelector('[data-hks="customer2"]')?.dataset.to === "active", "the kill-switch");
  assert.equal((await call("/api/hub/login", { id: "customer2", password: "pass-customer2", deviceId: "laptop-bbb222" })).body.error, "this account is suspended");
  await page.click("[data-hap]"); await wait(() => !document.querySelector("[data-hap]"), "the approval");
  const hs = (await call("/api/hub/status", null, { token: own })).body; assert.equal(hs.version, 1); assert.equal(hs.vault.alg, "AES-256-GCM + HMAC-SHA256");
  await page.click("#lock"); await wait(() => /Locked and encrypted/.test(document.querySelector("#lm")?.textContent || ""), "lock"); await snap("admin-users");
  assert.deepEqual(errors, [], "no page errors");
  console.log("ok: browser /admin — create user, kill-switch (sign-in refused), approve → brain v1 re-encrypted, Lock & Encrypt; no page errors");
} catch (e) { if (app) console.error(String(e?.stack || e)); throw e; }
finally {
  if (browser) await browser.close().catch(() => {});
  if (app && app.exitCode === null) { app.kill("SIGTERM"); await new Promise((r) => app.once("exit", r)); }
  for (const g of guard) { if (g.had) fs.writeFileSync(g.f, g.b); else fs.rmSync(g.f, { force: true }); }
  fs.rmSync(temp, { recursive: true, force: true });
}
const after = { noai: crypto.createHash("md5").update(fs.readFileSync(path.join(root, "server/no-ai.mjs"))).digest("hex"), real: sha("brain/real-test.jsonl"), seed: sha("brain/seed.jsonl") };
assert.deepEqual(after, before, "no-ai.mjs, the real test set and the seed are untouched");
console.log("ok: no-ai.mjs, brain/real-test.jsonl and brain/seed.jsonl unchanged; the engine library and calibration restored");
