// Builds brain/seed.jsonl for Brain v2 (Step 8): 12,000+ labelled Bangla (≈70%) and English story sentences for all 7 heads.
//   single sentences (places × actions × gestures × faces × roles × names), multi-sentence stories (prevText / nextText / prevPlace:
//   the place carries on, sometimes changes), dialogue, idioms and metaphors, money and number comparisons (charts, rings,
//   badges), weather and time transitions (b-roll), scenery (pan) and endings (pull out), thoughts, creatures and props from the
//   procedural creator's vocabulary, advice, lists and numbered rules.
// Labels are true by construction (each phrase carries its meaning). Where a sentence's own bank says nothing about broll / graphic /
// cameraMove, our rule systems (server/broll.mjs, server/caption-writer.mjs) label it, so the owner can override them later.
// Every bank's LAST entry is held out (row.held) for the generated evaluation. The build refuses to write if any sentence equals one in
// brain/real-test.jsonl or brain/holdout-200.jsonl, or shares a 6-word run with them. Run: node scripts/build-brain-data.mjs
import fs from "node:fs";
import { matchTemplate, brollFor } from "../server/broll.mjs";
import { graphicsFor, cameraMoveFor } from "../server/caption-writer.mjs";
import { B, G, X, SCENIC } from "./data/brain-banks.mjs";
import * as N from "./data/brain-banks2.mjs";

const ROOT = new URL("../", import.meta.url), NAMES = JSON.parse(fs.readFileSync(new URL("engine/cartoon/library/names.json", ROOT), "utf8")).names;
let seed = 2026; const r = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32), pick = (a) => a[Math.floor(r() * a.length)], chance = (p) => r() < p;
const BN = "০১২৩৪৫৬৭৮৯", bnNum = (n) => String(n).replace(/[0-9]/g, (d) => BN[+d]);
// merged banks: the v2 banks + Step 8's extra phrasings (each list's last entry stays the held-out one)
const merge = (a, b) => { const out = {}; for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) out[k] = [0, 1].map((L) => [...(a[k]?.[L] || []), ...(b[k]?.[L] || [])]); return out; };
const PLACE = merge(B.place, N.PLACE_MORE), FACE = merge(B.face, N.FACE_MORE), ACTION = merge(merge(B.action, N.GESTURE_MORE), N.ACTION_PAST), ROLES = B.roles; // + past / continuous tenses
const nameOf = (L) => { if (chance(0.35)) return pick(B.names[L]); const n = pick(NAMES.filter((x) => (L ? x.bn && !x.ambiguous : !x.bn))); return L ? n.bn : n.en[0].toUpperCase() + n.en.slice(1); };
const ph = (L, bank) => { const keys = Object.keys(bank), id = pick(keys), list = bank[id][L], v = Math.floor(r() * list.length); return { id, text: list[v], v, last: v === list.length - 1 }; };
const fromList = (list) => { const v = Math.floor(r() * list.length); return { item: list[v], v, last: v === list.length - 1 }; };
const teacher = (text) => { const t = matchTemplate(text); return { broll: t ? t.id : brollFor(text, { recipes: true }) ? "compose_custom_recipe" : "none", graphic: graphicsFor(text)[0]?.kind || "none", cameraMove: cameraMoveFor(text) || "steady" }; };
const finish = (L, s) => { const t = s.replace(/\s+/g, " ").trim(); return L ? (/[।?!]$/.test(t) ? t : t + "।") : (/[.?!]$/.test(t) ? t : t + ".")[0].toUpperCase() + (/[.?!]$/.test(t) ? t : t + ".").slice(1); };
const rows = [];
// labels: { place, action, face, roles, broll, graphic, cameraMove } (missing broll/graphic/cameraMove → the rules), held, kind
const add = (L, text0, lab, extra = {}) => { const text = finish(L, text0), t = teacher(text); rows.push({ text, place: lab.place ?? "none", action: lab.action ?? "idle", face: lab.face ?? "neutral", roles: lab.roles ?? [], broll: lab.broll ?? t.broll, graphic: lab.graphic ?? t.graphic, cameraMove: lab.cameraMove ?? t.cameraMove, lang: L ? "bn" : "en", source: "seed", ...extra }); return rows.at(-1); };
const subject = (L) => { if (chance(0.4)) { const R = ph(L, ROLES); return { text: R.text, roles: [R.id] }; } return { text: nameOf(L), roles: [] }; };
// a plain sentence from the banks (as v1/v2, with more phrasings and names)
function plain(L, { usePlace = chance(0.65), subj = subject(L), P = null } = {}) {
  const Pp = P || (usePlace ? ph(L, PLACE) : null), A = chance(0.85) ? ph(L, ACTION) : null, F = chance(0.5) ? ph(L, FACE) : null;
  const parts = L ? [Pp?.text, subj.text, F?.text, A?.text || pick(["আছে", "বসে আছে", ""])] : [subj.text, A?.text || pick(["is there", "stays", ""]), Pp?.text, F?.text];
  if (!L && F && chance(0.3)) { parts.splice(parts.indexOf(F.text), 1); parts.splice(1, 0, F.text); }
  return { text: parts.filter(Boolean).join(" "), lab: { place: Pp ? Pp.id : "none", action: A ? A.id : "idle", face: F ? F.id : "neutral", roles: subj.roles }, held: !!(Pp?.last || A?.last || F?.last), v: [Pp ? Pp.v : -1, A ? A.v : -1, F ? F.v : -1] };
}
const LANG = () => (chance(0.7) ? 1 : 0);
// real stories say dialogue, feelings and news *somewhere*: 40% of the special sentences also name a place (labelled), so place
// words keep their meaning in every kind of sentence (without this the "none" label grew to half the data)
const placed = (L, text, lab, extra, p = 0.4) => { if (!chance(p) || lab.place) return add(L, text, lab, extra); const P = ph(L, PLACE), t = finish(L, text).replace(/[।.?!]$/u, "");
  return add(L, L ? `${P.text} ${t}` : `${t} ${P.text}`, { ...lab, place: P.id }, { ...extra, held: extra.held || P.last }); };
// 1. plain sentences
for (let n = 0; n < 5000; n++) { const L = LANG(), s = plain(L); add(L, s.text, s.lab, { held: s.held, v: s.v, kind: "plain" }); }
// 2. dialogue
for (let n = 0; n < 1200; n++) {
  const L = LANG(), u = fromList(N.UTTER[L ? "bn" : "en"]), sv = fromList(N.SAY_VERBS[L ? "bn" : "en"]), subj = subject(L), [verb, vface, vact] = sv.item, [said, lab] = u.item;
  const text = chance(0.5) ? (L ? `${subj.text} ${verb}, "${said}।"` : `${subj.text} ${verb}, "${said[0].toUpperCase() + said.slice(1)}."`) : (L ? `"${said}," ${verb} ${subj.text}` : `"${said[0].toUpperCase() + said.slice(1)}," ${subj.text} ${verb}`);
  placed(L, text, { face: lab.face || vface || "neutral", action: lab.action || vact || "talk_explain", roles: subj.roles, broll: lab.broll || "none", graphic: "none", cameraMove: "steady" }, { held: u.last || sv.last, kind: "dialogue" });
}
// 3. idioms and metaphors
for (let n = 0; n < 700; n++) { const L = LANG(), i = fromList(N.IDIOMS[L ? "bn" : "en"]), subj = subject(L), [pred, face, action, graphic, cam] = i.item, lead = L ? pick(["খবরটা শুনে", "কথাটা শোনামাত্র", "ফলাফল দেখে", ""]) : pick(["Hearing the news,", "When she saw it,", "At that moment", ""]);
  placed(L, L ? `${lead} ${subj.text} ${pred}` : `${lead} ${subj.text} ${pred}`, { face, action, roles: subj.roles, broll: "none", graphic, cameraMove: cam }, { held: i.last, kind: "idiom" }); }
// 4. money and numbers
const num = (L, x) => (L ? bnNum(x) : String(x));
const CMP = { bn: [(i, a, b) => [`${i} দাম ${a} টাকা থেকে বেড়ে ${b} টাকা হয়েছে`, "up"], (i, a, b) => [`আগে ${i} দাম ছিল ${a} টাকা, এখন ${b} টাকা`, "up"], (i, a, b) => [`এক বছরে ${i} দাম ${a} থেকে ${b} টাকায় উঠেছে`, "up"], (i, a, b) => [`${i} দাম ${b} টাকা থেকে কমে ${a} টাকায় নেমেছে`, "down"], (i, a, b) => [`গত মাসে ${i} দাম ছিল ${a} টাকা, এ মাসে তা ${b} টাকা`, "up"]],
  en: [(i, a, b) => [`the price of ${i} rose from ${a} to ${b} taka`, "up"], (i, a, b) => [`${i} used to cost ${a} taka, now it costs ${b}`, "up"], (i, a, b) => [`in one year ${i} went up from ${a} to ${b} taka`, "up"], (i, a, b) => [`${i} fell from ${b} taka to ${a} taka`, "down"], (i, a, b) => [`last month ${i} was ${a} taka, this month it is ${b}`, "up"]] };
const YEARS = { bn: [(p, q, y1, y2) => `${y1} সালে ${p}% পরিবারে বিদ্যুৎ ছিল, ${y2} সালে ${q}%`, (p, q, y1, y2) => `${y1} সালে শিক্ষার হার ছিল ${p}%, ${y2} সালে বেড়ে ${q}%`, (p, q, y1, y2) => `${y1} সালে ${p}% আর ${y2} সালে ${q}% মানুষ ইন্টারনেট ব্যবহার করত`],
  en: [(p, q, y1, y2) => `in ${y1}, ${p}% of homes had electricity; by ${y2}, ${q}%`, (p, q, y1, y2) => `literacy was ${p}% in ${y1} and ${q}% in ${y2}`, (p, q, y1, y2) => `${p}% used the internet in ${y1}, ${q}% in ${y2}`] };
const PCT = { bn: [(p) => [`দেশের ${p}% মানুষ গ্রামে বাস করে`, "none"], (p) => [`এবার ${p} শতাংশ শিক্ষার্থী পাস করেছে`, "exam_result_grade"], (p) => [`কারখানার ${p}% শ্রমিক নারী`, "none"], (p) => [`জরিপে ${p}% মানুষ দাম বাড়ার কথা বলেছে`, "market_price_up"], () => [`অর্ধেক পরিবারের কোনো সঞ্চয় নেই`, "empty_wallet_fly"]],
  en: [(p) => [`${p}% of people live in villages`, "none"], (p) => [`${p} percent of the students passed this year`, "exam_result_grade"], (p) => [`${p}% of the factory workers are women`, "none"], (p) => [`${p}% of people said prices had gone up`, "market_price_up"], () => [`half of the families have no savings`, "empty_wallet_fly"]] };
const AMT = { bn: [(s, a) => [`${s} ব্যাংক থেকে ${a} টাকা ধার নিল`, "empty_wallet_fly", "worried", "slow_push_in"], (s, a) => [`${s} প্রতি মাসে ${a} টাকা জমায়`, "money_coins_stacking", "happy", "slow_push_in"], (s, a) => [`${s} বাজারে ${a} টাকা খরচ করল`, "none", "neutral", "slow_push_in"], (s, a, n) => [`${n} বছর পর ${s} গ্রামে ফিরল`, "calendar_pages_flying", "happy", "steady"], (s, a, n) => [`${s} ${n} ঘণ্টা ধরে অপেক্ষা করছে`, "hourglass_sand", "worried", "steady"]],
  en: [(s, a) => [`${s} borrowed ${a} taka from the bank`, "empty_wallet_fly", "worried", "slow_push_in"], (s, a) => [`${s} saves ${a} taka every month`, "money_coins_stacking", "happy", "slow_push_in"], (s, a) => [`${s} spent ${a} taka at the market`, "none", "neutral", "slow_push_in"], (s, a, n) => [`after ${n} years ${s} came back to the village`, "calendar_pages_flying", "happy", "steady"], (s, a, n) => [`${s} has been waiting for ${n} hours`, "hourglass_sand", "worried", "steady"]] };
for (let n = 0; n < 1150; n++) {
  const L = LANG(), k = L ? "bn" : "en", kind = n % 23 < 10 ? "cmp" : n % 23 < 13 ? "years" : n % 23 < 18 ? "pct" : "amt";
  if (kind === "cmp") { const t = fromList(CMP[k]), a = 20 + Math.floor(r() * 80), b = a + 5 + Math.floor(r() * 90), [s, dir] = t.item(pick(N.ITEMS[k]), num(L, a), num(L, b));
    add(L, s, { face: dir === "up" ? "worried" : "happy", broll: dir === "up" ? "market_price_up" : "none", graphic: "dynamic_comparison_chart", cameraMove: "slow_push_in" }, { held: t.last, kind: "money" }); }
  else if (kind === "years") { const t = fromList(YEARS[k]), y1 = 1995 + Math.floor(r() * 20), y2 = y1 + 5 + Math.floor(r() * 10), p = 5 + Math.floor(r() * 40), q = p + 10 + Math.floor(r() * 45);
    add(L, t.item(num(L, p), num(L, q), num(L, y1), num(L, y2)), { face: "neutral", broll: "none", graphic: "dynamic_comparison_chart", cameraMove: "slow_push_in" }, { held: t.last, kind: "money" }); }
  else if (kind === "pct") { const t = fromList(PCT[k]), [s, broll] = t.item(num(L, 5 + Math.floor(r() * 90))); add(L, s, { face: "neutral", broll, graphic: "percentage_progress_ring", cameraMove: "slow_push_in" }, { held: t.last, kind: "money" }); }
  else { const t = fromList(AMT[k]), subj = subject(L), [s, broll, face, cam] = t.item(subj.text, num(L, 100 * (2 + Math.floor(r() * 60))), num(L, 2 + Math.floor(r() * 9))); placed(L, s, { face, roles: subj.roles, broll, graphic: "number_badge_pop", cameraMove: cam }, { held: t.last, kind: "money" }); }
}
// 4b. a face read from the situation (birthday → happy, a pile of work → worried, a lost kitten → sad, an unexpected visitor → surprised)
for (let n = 0; n < 900; n++) { const L = LANG(), t = fromList(N.SITUATIONS[L ? "bn" : "en"]), subj = subject(L), [tail, face] = t.item; placed(L, `${subj.text} ${tail}`, { face, roles: subj.roles }, { held: t.last, kind: "situation" }); }
// 5. weather and time, scenery, endings
for (let n = 0; n < 700; n++) { const L = LANG(), t = fromList(N.WEATHER_MORE[L ? "bn" : "en"]), [s, broll, cam, face] = t.item; placed(L, s, { face, broll, graphic: "none", cameraMove: cam }, { held: t.last, kind: "time" }, 0.3); }
for (let n = 0; n < 650; n++) { const L = LANG(), t = fromList(N.TIMES[L ? "bn" : "en"]), [s, broll, cam, face] = t.item; placed(L, s, { face, broll, graphic: "none", cameraMove: cam }, { held: t.last, kind: "time" }, 0.3); }
for (let n = 0; n < 260; n++) { const L = LANG(), t = fromList(N.SCENERY[L ? "bn" : "en"]); add(L, t.item, { broll: "none", graphic: "none", cameraMove: "gentle_pan" }, { held: t.last, kind: "scenery" }); }
for (let n = 0; n < 220; n++) { const L = LANG(), t = fromList(N.ENDINGS[L ? "bn" : "en"]); add(L, t.item, { face: "happy", broll: "none", graphic: "none", cameraMove: "slow_pull_out" }, { held: t.last, kind: "ending" }); }
// 6. thoughts, creatures, advice, lists
for (let n = 0; n < 320; n++) { const L = LANG(), t = fromList(N.THINK[L ? "bn" : "en"]), subj = subject(L); placed(L, `${subj.text} ${t.item[0]}`, { face: "happy", action: "chin_think", roles: subj.roles, broll: "none", graphic: "thought_cloud", cameraMove: "steady" }, { held: t.last, kind: "thought" }); }
for (let n = 0; n < 420; n++) { const L = LANG(), k = L ? "bn" : "en", C = N.CREATURE, ap = fromList(C.appear[k]), [verb, face, graphic, cam] = ap.item, kind = pick(C.kinds[k]), color = pick(C.colors[k]), heads = chance(0.4) ? (L ? `${pick(C.counts.bn)} মাথার ` : `${pick(C.counts.en)}-headed `) : "";
  placed(L, L ? `${heads}${color} ${kind}টা ${verb}` : `a ${heads}${color} ${kind} ${verb}`, { face, broll: "none", graphic, cameraMove: cam }, { held: ap.last, kind: "creature" }); }
for (let n = 0; n < 260; n++) { const L = LANG(), t = fromList(N.ADVICE[L ? "bn" : "en"]); add(L, t.item[0], { broll: "none", graphic: t.item[1], cameraMove: "slow_push_in" }, { held: t.last, kind: "advice" }); }
for (let n = 0; n < 160; n++) { const L = LANG(), t = fromList(N.LISTS[L ? "bn" : "en"]); add(L, t.item[0], { action: "count_fingers", broll: "none", graphic: "step_list_card", cameraMove: "slow_push_in" }, { held: t.last, kind: "list" }); }
// numbered rules said over several sentences (a story with context)
for (let n = 0; n < 60; n++) { const L = LANG(), k = L ? "bn" : "en", steps = [...N.RULE_STEPS[k]].sort(() => r() - 0.5).slice(0, 3), texts = steps.map((s, j) => finish(L, L ? `${N.ORDINALS.bn[j]}, ${s}` : `${N.ORDINALS.en[j]}, ${s}`));
  texts.forEach((t, j) => add(L, t, { action: "finger_wag", broll: "none", graphic: "step_list_card", cameraMove: "slow_push_in" }, { ctx: { prevText: texts[j - 1] || "", nextText: texts[j + 1] || "", prevPlace: "none" }, held: n % 10 === 9, kind: "rules", story: `r${n}` })); }
// 7. stories: the first sentence names the place; the rest carry it on (dialogue, thoughts, weather, idioms in between);
//    sometimes the story moves to a new place half-way
const PRON = { bn: ["সে", "তারা"], en: ["He", "She", "They"] };
for (let n = 0; n < 950; n++) {
  const L = LANG(), k = L ? "bn" : "en", subj0 = subject(L), len = 3 + Math.floor(r() * 3), held = n % 10 === 9, items = [];
  let P = ph(L, PLACE);
  for (let j = 0; j < len; j++) {
    const move = j > 1 && chance(0.15); if (move) P = ph(L, PLACE);
    const named = j === 0 || move, roll = r(), sub = j === 0 ? subj0 : { text: pick(PRON[k]), roles: [] };
    if (named || roll < 0.55) { const s = plain(L, { subj: sub, P: named ? P : null, usePlace: false }); items.push([s.text, { ...s.lab, place: P.id }]); }
    else if (roll < 0.68) { const u = fromList(N.UTTER[k]), [said, lab] = u.item; items.push([L ? `${sub.text} বলল, "${said}।"` : `${sub.text} said, "${said[0].toUpperCase() + said.slice(1)}."`, { place: P.id, face: lab.face || "neutral", action: lab.action || "talk_explain", broll: lab.broll || "none", graphic: "none", cameraMove: "steady" }]); }
    else if (roll < 0.78) { const t = fromList(N.TIMES[k]), [s, broll, cam, face] = t.item; items.push([s, { place: P.id, face, broll, graphic: "none", cameraMove: cam }]); }
    else if (roll < 0.86) { const i = fromList(N.IDIOMS[k]), [pred, face, action, graphic, cam] = i.item; items.push([`${sub.text} ${pred}`, { place: P.id, face, action, broll: "none", graphic, cameraMove: cam }]); }
    else if (roll < 0.93) { const t = fromList(N.THINK[k]); items.push([`${sub.text} ${t.item[0]}`, { place: P.id, face: "happy", action: "chin_think", broll: "none", graphic: "thought_cloud", cameraMove: "steady" }]); }
    else { const t = fromList(N.SCENERY[k]); items.push([t.item, { place: P.id, broll: "none", graphic: "none", cameraMove: "gentle_pan" }]); }
  }
  const texts = items.map(([t]) => finish(L, t));
  items.forEach(([, lab], j) => add(L, texts[j], lab, { ctx: { prevText: texts[j - 1] || "", nextText: texts[j + 1] || "", prevPlace: j ? items[j - 1][1].place : "none" }, held, kind: "story", story: `s${n}` }));
}
// 8. the v2 extra sentences (numbers, b-roll words, scenery) stay in
for (const group of Object.keys(X)) for (const L of [0, 1]) X[group][L ? "bn" : "en"].forEach((s0, v, list) => { for (let k = 0; k < 6; k++) { const s = s0.replace("{a}", num(L, 30 + k * 7)).replace("{b}", num(L, 70 + k * 9)).replace("{p}", num(L, 10 + k * 4)).replace("{q}", num(L, 40 + k * 6)).replace("{n}", num(L, 2 + k)).replace("{name}", nameOf(L)); add(L, s, SCENIC.has(s0) ? { cameraMove: "gentle_pan" } : {}, { held: v === list.length - 1, kind: "extra" }); } });

// ---------- honesty checks: nothing from the two test sets ----------
const norm = (s) => s.normalize("NFC").toLowerCase().replace(/[^\p{L}\p{M}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim(), grams = (s, n = 6) => { const w = norm(s).split(" "), g = []; for (let i = 0; i + n <= w.length; i++) g.push(w.slice(i, i + n).join(" ")); return g; };
const tests = ["brain/real-test.jsonl", "brain/holdout-200.jsonl"].flatMap((f) => fs.readFileSync(new URL(f, ROOT), "utf8").trim().split("\n").map((l) => JSON.parse(l).text));
const testSet = new Set(tests.map(norm)), testGrams = new Set(tests.flatMap((t) => grams(t)));
const clash = rows.filter((x) => testSet.has(norm(x.text)) || grams(x.text).some((g) => testGrams.has(g)));
if (clash.length) { console.error(`refusing to write: ${clash.length} training sentences overlap the test sets, e.g. ${clash.slice(0, 3).map((x) => x.text).join(" | ")}`); process.exit(1); }
fs.writeFileSync(new URL("brain/seed.jsonl", ROOT), rows.map((x) => JSON.stringify(x)).join("\n") + "\n");
const bn = rows.filter((x) => x.lang === "bn").length, by = (k) => Object.fromEntries([...new Set(rows.map((x) => x[k]))].map((v) => [v, rows.filter((x) => x[k] === v).length]));
console.log(`wrote ${rows.length} sentences: ${bn} Bangla (${(100 * bn / rows.length).toFixed(0)}%), ${rows.filter((x) => x.ctx).length} in stories/sequences, ${rows.filter((x) => x.held).length} held out; zero exact and 6-word overlap with real-test (${tests.length - 200}) and holdout-200`);
console.log("kinds", JSON.stringify(by("kind")));
