// Zancut's own brain, v2: a context-aware multi-head classifier trained FROM SCRATCH on our own labelled sentences (no pretrained
// model, no outside AI). It reads a Bangla/English sentence with its neighbours and predicts what to draw.
//   Features (hashed into 2^14 buckets, L2-normalised): words, word pairs, character 3–5-grams (Bangla/English endings generalise),
//     #CONCEPT_* tokens (engine/cartoon/library/semantic-clusters.json), learned-knowledge categories (data/brain/learned-knowledge.json),
//     structural signals (numbers, percent, money, year, comparison, question, exclamation, list) and a context window:
//     the previous sentence (PREV, ×0.35), the next one (NEXT, ×0.20) and the previous place (story continuity).
//   Heads (softmax, calibrated by a per-head temperature fitted on held-out data): place (registry + none), action (8 actions +
//     the 65 safe gestures), face, broll (none + 25 templates + compose_custom_recipe), graphic, cameraMove; roles (sigmoid per role).
//   Model: linear softmax heads, with an optional small tanh head trained from random weights; pure JS SGD with L2.
//     Per-task context/IDF and the chosen classifier are in brain/training-config.json and persist with the weights.
//   Learning: the seed (brain/seed.jsonl) + the owner's feedback (data/brain/feedback.jsonl, weighted 5×). learn() and learnRule()
//     adapt the saved model in place in well under 3 s (a few SGD passes over the new examples with a replay sample of the seed).
// brain/real-test.jsonl (hand-written, hand-labelled) is never trained on: it is only for scripts/brain-train.mjs to measure.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, ENGINE_DIR } from './config.mjs';
import { fitNeural, neuralScores, updateNeural } from './brain-neural.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const NF = (s) => String(s ?? '').normalize('NFC');
export const NB = 1 << Number(process.env.ZANCUT_BRAIN_BITS || 14);
export const ROLE_IDS = ['boy', 'girl', 'father', 'mother', 'baba', 'teacher'];
const WORDS_JSON = J(path.join(ENGINE_DIR, 'cartoon', 'library', 'words.json'), {}), READY = Object.keys(WORDS_JSON.readyPlaces || {});
// place names in a rule ("অফিস দেখাও" → office_room), from the ready places' own aliases (longest first)
const PLACE_ALIASES = Object.entries(WORDS_JSON.readyPlaces || {}).flatMap(([id, p]) => (p.aliases || []).map((a) => [NF(a).toLowerCase(), id])).sort((a, b) => b[0].length - a[0].length);
const resolvePlaceSync = (t) => { const s = NF(t).toLowerCase(); return PLACE_ALIASES.find(([a]) => s.includes(a))?.[1] || null; };
// b-roll template words (the same lists as engine/cartoon/broll-kit.js) — read once, lazily
let TW = null; const TEMPLATE_WORDS_OF = () => (TW ||= (() => { const src = fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'broll-kit.js'), 'utf8'), out = []; for (const m of src.matchAll(/def\('([a-z_]+)', '[^']*', \[([^\]]*)\]/g)) out.push([m[1], [...m[2].matchAll(/'([^']+)'/g)].map((x) => x[1])]); return out; })());
const SAFE = J(path.join(ROOT, 'brain', 'gestures-gate.json'), { ok: [] }).ok;
const TEMPLATES = ['clock_ticking', 'calendar_pages_flying', 'sunrise_to_sunset', 'heavy_rain_clouds', 'night_stars_moon', 'money_coins_stacking', 'empty_wallet_fly', 'laptop_typing_fast', 'market_price_up', 'phone_ringing_vibrate', 'teacup_steaming', 'fast_running_feet', 'heartbeat_pulse', 'lightbulb_idea', 'hourglass_sand', 'thunder_lightning', 'wind_leaves_blowing', 'rice_bowl_steam', 'books_stack_study', 'bus_passing_road', 'notification_bell', 'map_route_travel', 'exam_result_grade', 'fire_flames', 'question_marks_float'];
const ACTIONS = ['idle', 'walk', 'run', 'wave', 'cheer', 'clap', 'point', 'sit'];
export const HEADS = {
  place: ['none', ...(READY.length ? READY : ['bedroom', 'village_home', 'village_road', 'school_yard', 'classroom', 'city_street', 'park', 'living_room', 'kitchen'])],
  action: [...ACTIONS, ...SAFE.filter((g) => !ACTIONS.includes(g))],
  face: ['neutral', 'happy', 'worried', 'sad', 'surprised'],
  broll: ['none', ...TEMPLATES, 'compose_custom_recipe'],
  graphic: ['none', 'dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card', 'thought_cloud', 'comic_emotion_fx'],
  cameraMove: ['steady', 'slow_push_in', 'slow_pull_out', 'gentle_pan', 'impact_shake'],
};
export const paths = { calibration: path.join(ROOT, 'brain', 'calibration.json'), seed: path.join(ROOT, 'brain', 'seed.jsonl'), real: path.join(ROOT, 'brain', 'real-test.jsonl'), model: path.join(DATA_DIR, 'brain', 'model.json'), feedback: path.join(DATA_DIR, 'brain', 'feedback.jsonl'), fed: path.join(DATA_DIR, 'brain', 'fed.jsonl'), knowledge: path.join(DATA_DIR, 'brain', 'learned-knowledge.json') };
export const FEEDBACK_WEIGHT = 5;
const EPOCHS = Number(process.env.ZANCUT_BRAIN_EPOCHS) || 0; // 0: by data size (more data needs fewer passes; keeps training under 5 s)
const epochsFor = (n) => EPOCHS || (n > 12000 ? 6 : n > 9000 ? 8 : 14);

// ---------- features ----------
const fnv = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) % NB; };
const wordsOf = (t) => NF(t).toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];
// concept clusters, precompiled: one word → clusters (with Bengali case endings stripped), phrases by substring
const CL = J(path.join(ENGINE_DIR, 'cartoon', 'library', 'semantic-clusters.json'), { clusters: [] }).clusters;
const ONE = new Map(), MANY = [];
for (const c of CL) for (const t0 of [...c.bn, ...c.en, ...(c.wordnet || [])]) { const t = NF(t0).toLowerCase(); if (t.includes(' ')) MANY.push([t, c.id]); else (ONE.get(t) || ONE.set(t, new Set()).get(t)).add(c.id); }
const ENDS = ['দেরকে', 'দের', 'কে', 'রা', 'য়ের', 'এর', 'ের', 'র', 'য়', 'তে', 'ে', 'টা', 'টি', 's', 'es', 'ed', 'ing', 'd'].map(NF);
const variants = (w) => { const out = [w]; for (const e of ENDS) if (w.length > e.length + 1 && w.endsWith(e)) out.push(w.slice(0, -e.length)); return out; };
function conceptTokens(text) {
  const t = NF(text).toLowerCase(), ids = new Set();
  for (const w of wordsOf(t)) for (const v of variants(w)) for (const id of ONE.get(v) || []) ids.add(id);
  for (const [p, id] of MANY) if (t.includes(p)) ids.add(id);
  return [...ids];
}
let WORDSET = null; const KNOWN_WORDS = () => (WORDSET ||= new Set(Object.values(J(path.join(ENGINE_DIR, 'cartoon', 'library', 'words.json'), {}).aliases || {}).flat().map((w) => NF(w).toLowerCase())));
let KNOW = null, KNOW_AT = 0;
const knowledge = () => { // learned web knowledge: a term's category (re-read when the file changes)
  try { const st = fs.statSync(paths.knowledge); if (!KNOW || st.mtimeMs !== KNOW_AT) { KNOW_AT = st.mtimeMs; const k = J(paths.knowledge, { concepts: {} }).concepts || {}; KNOW = new Map(); for (const c of Object.values(k)) for (const w of [c.term, c.english, c.key].filter(Boolean)) KNOW.set(NF(w).toLowerCase(), c); } } catch { KNOW = new Map(); KNOW_AT = 0; }
  return KNOW;
};
function structural(text) {
  const t = NF(text), low = t.toLowerCase(), nums = (t.match(/[0-9০-৯]+/g) || []).length, out = [];
  if (nums) out.push('num'); if (nums >= 2) out.push('num2');
  if (/%|শতাংশ|percent|অর্ধেক|\bhalf\b/iu.test(t)) out.push('pct');
  if (/টাকা|\btaka\b|৳|\$|ডলার|dollar/iu.test(t)) out.push('money');
  if (/\b(19|20)\d\d\b|[১২][৯০][০-৯]{2}|সালে/u.test(t)) out.push('year');
  if (/থেকে.*(বেড়|কম)|from\s+\S+\s+to|more than|less than|বেশি|rose|fell|increase|decrease/iu.test(low)) out.push('compare');
  if (/\?|\b(why|what|how|who)\b|কেন|কী\b|কি\b|কোথায়|কীভাবে/iu.test(t)) out.push('question');
  if (/!/.test(t)) out.push('exclaim');
  if (/[:：]|প্রথমত|দ্বিতীয়ত|তৃতীয়ত|\bfirst(ly)?\b|\bsecond(ly)?\b|[১২৩]\.|[123]\)/iu.test(t)) out.push('list');
  return out;
}
// input: a sentence, or { currentText | text, prevText, nextText, prevPlace }
const FEATURE_CACHE = new Map(); let FEATURE_KNOW_AT = null;
export function feats(input) {
  const o = typeof input === 'string' ? { currentText: input } : input || {}, cur = o.currentText ?? o.text ?? '', m = new Map();
  const K = knowledge();
  if (FEATURE_KNOW_AT !== KNOW_AT) { FEATURE_CACHE.clear(); FEATURE_KNOW_AT = KNOW_AT; }
  const cacheKey = JSON.stringify([cur, o.prevText || '', o.nextText || '', o.prevPlace || 'none']);
  if (FEATURE_CACHE.has(cacheKey)) return FEATURE_CACHE.get(cacheKey);
  const add = (k, v) => { const i = fnv(k); m.set(i, (m.get(i) || 0) + v); };
  const words = wordsOf(cur);
  words.forEach((w, i) => { add('w:' + w, 1); if (i) add(`b:${words[i - 1]}_${w}`, 0.7); const p = `^${w}$`; for (let n = 3; n <= 5; n++) for (let j = 0; j + n <= p.length; j++) add('c:' + p.slice(j, j + n), 0.45); });
  for (const id of conceptTokens(cur)) add('k:' + id, 1);
  for (const w of words) { const c = K.get(w); if (c) { add('kn:' + c.category, 0.8); if (c.prop) add('kn:prop', 0.5); } }
  for (const s of structural(cur)) add('s:' + s, 0.8);
  // the context window: the story so far and what comes next
  if (o.prevText) { for (const w of wordsOf(o.prevText)) add('P:w:' + w, 0.35); for (const id of conceptTokens(o.prevText)) add('P:k:' + id, 0.35); }
  if (o.nextText) { for (const w of wordsOf(o.nextText)) add('N:w:' + w, 0.2); for (const id of conceptTokens(o.nextText)) add('N:k:' + id, 0.2); }
  if (o.prevPlace && o.prevPlace !== 'none') add('pp:' + o.prevPlace, 0.8);
  add('bias', 1); let z = 0; for (const v of m.values()) z += v * v; z = Math.sqrt(z) || 1;
  const idx = new Int32Array(m.size), val = new Float32Array(m.size); let k = 0; for (const [i, v] of m) { idx[k] = i; val[k++] = v / z; }
  if (FEATURE_CACHE.size >= 24000) for (const key of [...FEATURE_CACHE.keys()].slice(0, 6000)) FEATURE_CACHE.delete(key);
  const f = { idx, val }; FEATURE_CACHE.set(cacheKey, f); return f;
}
const inputOf = (e) => (e.ctx ? { currentText: e.text, ...e.ctx } : { currentText: e.text });
export const trainingConfigFile = path.join(ROOT, 'brain', 'training-config.json');
// Each task can retain the whole story window or focus on the current sentence.
// IDF is fitted on training documents only and travels with the saved weights.
const featureInput = (input, context = 'full') => {
  const o = typeof input === 'string' ? { currentText: input } : input || {};
  if (context === 'current') return { currentText: o.currentText ?? o.text ?? '' };
  if (context === 'previous') return { currentText: o.currentText ?? o.text ?? '', prevText: o.prevText, prevPlace: o.prevPlace };
  return o;
};
export function fitFeatureTransform(features, { context = 'full', idfPower = 0 } = {}) {
  if (!['full', 'current', 'previous'].includes(context) || !Number.isFinite(idfPower) || idfPower < 0 || idfPower > 1) throw new Error('Invalid brain feature configuration');
  const transform = { context, idfPower };
  if (idfPower) {
    const df = new Uint32Array(NB);
    for (const f of features) for (const i of f.idx) df[i]++;
    transform.idf = Float32Array.from(df, n => 1 + Math.log((features.length + 1) / (n + 1)));
  }
  return transform;
}
export function applyFeatureTransform(f, transform) {
  if (!transform?.idfPower) return f;
  const val = new Float32Array(f.val.length); let z = 0;
  for (let k = 0; k < val.length; k++) { val[k] = f.val[k] * transform.idf[f.idx[k]] ** transform.idfPower; z += val[k] * val[k]; }
  z = Math.sqrt(z) || 1;
  for (let k = 0; k < val.length; k++) val[k] /= z;
  return { idx: f.idx, val };
}
const featuresForHead = (hd, input) => applyFeatureTransform(feats(featureInput(input, hd.transform?.context)), hd.transform);

// ---------- model: feature-major weights W[i * C + c] ----------
const rng = (seed) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
function scores(W, C, f, out) { out.fill(0); for (let k = 0; k < f.idx.length; k++) { const off = f.idx[k] * C, v = f.val[k]; for (let c = 0; c < C; c++) out[c] += W[off + c] * v; } return out; }
function headScores(hd, f) {
  const s = hd.algorithm === 'neural' ? neuralScores(hd, f) : scores(hd.w, hd.classes.length, f, new Float64Array(hd.classes.length));
  // New registry entries need examples before they can win a statistical decision.
  // This also keeps an untrained zero-weight class from beating negative logits.
  if (hd.counts?.some((n) => n > 0)) hd.counts.forEach((n, c) => { if (!n) s[c] = -1e9; });
  return s;
}
function softmax(s, T = 1) { let mx = -Infinity; for (const x of s) if (x > mx) mx = x; let z = 0; const p = new Float64Array(s.length); for (let c = 0; c < s.length; c++) { p[c] = Math.exp((s[c] - mx) / T); z += p[c]; } for (let c = 0; c < s.length; c++) p[c] /= z; return p; }
// rows: [{ f, y, w }]; C classes (C = 1: sigmoid). Updates skip classes whose gradient is negligible (most, once trained).
function sgd(W, rows, C, { epochs = 14, lr = 0.8, l2 = 1e-5, seed = 1, sigmoid = false, skip = 1e-3 } = {}) {
  const r = rng(seed), order = rows.map((_, i) => i), s = new Float64Array(Math.max(1, C)), g = new Float64Array(Math.max(1, C)), live = new Int32Array(Math.max(1, C)), p = new Float64Array(Math.max(1, C));
  for (let e = 0; e < epochs; e++) {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const step = lr / (1 + 0.15 * e);
    for (const n of order) {
      const { f, y, w = 1 } = rows[n], a = Math.min(1.5, step * w);
      if (sigmoid) { let z = 0; for (let k = 0; k < f.idx.length; k++) z += W[f.idx[k]] * f.val[k]; const gr = 1 / (1 + Math.exp(-z)) - y; for (let k = 0; k < f.idx.length; k++) { const i = f.idx[k]; W[i] -= a * (gr * f.val[k] + l2 * W[i]); } continue; }
      scores(W, C, f, s); let mx = -Infinity; for (let c = 0; c < C; c++) if (s[c] > mx) mx = s[c]; let z = 0; for (let c = 0; c < C; c++) { p[c] = Math.exp(s[c] - mx); z += p[c]; }
      let nl = 0; for (let c = 0; c < C; c++) { g[c] = p[c] / z - (c === y ? 1 : 0); if (g[c] > skip || g[c] < -skip) live[nl++] = c; } // classes with a negligible gradient are skipped
      for (let k = 0; k < f.idx.length; k++) { const off = f.idx[k] * C, v = f.val[k]; for (let q = 0; q < nl; q++) { const c = live[q], ix = off + c; W[ix] -= a * (g[c] * v + l2 * W[ix]); } }
    }
  }
  return W;
}
// class balance: a label that fills half the data (idle, neutral, none, steady) would become a prior that swallows the cues for the
// rest; each class weighs (N / (C · n_c))^0.5, between 0.5 and 5 (ZANCUT_BRAIN_BALANCE=0 turns it off)
const BALANCE = process.env.ZANCUT_BRAIN_BALANCE !== '0';
const rowsFor = (examples, h, classes, F) => { const R = examples.map((e, i) => [e, i]).filter(([e]) => classes.includes(e[h])), n = new Map(); for (const [e] of R) n.set(e[h], (n.get(e[h]) || 0) + 1);
  const cw = (c) => (BALANCE ? Math.max(0.5, Math.min(5, Math.sqrt(R.length / (n.size * n.get(c))))) : 1);
  return R.map(([e, i]) => ({ f: F[i], y: classes.indexOf(e[h]), w: (e.weight || (e.source === 'feedback' || e.source === 'rule' ? FEEDBACK_WEIGHT : 1)) * cw(e[h]) })); };
// a role is rare (most sentences have none of the six): its positive examples weigh by the class balance (capped at 4) so it is not drowned
const roleRows = (examples, role, F) => { const R = examples.map((e, i) => [e, i]).filter(([e]) => Array.isArray(e.roles)), pos = R.filter(([e]) => e.roles.includes(role)).length, bal = pos ? Math.min(4, Math.sqrt((R.length - pos) / pos)) : 1;
  return R.map(([e, i]) => { const y = e.roles.includes(role) ? 1 : 0, w0 = e.weight || (e.source === 'feedback' || e.source === 'rule' ? FEEDBACK_WEIGHT : 1); return { f: F[i], y, w: y ? w0 * bal : w0 }; }); };
// examples: [{ text, ctx?, place?, action?, face?, broll?, graphic?, cameraMove?, roles?, weight? }]; a missing label is skipped by that head
export function fitHead(examples, head, { features = examples.map((e) => feats(inputOf(e))), classes = HEADS[head], algorithm = 'linear', ...opt } = {}) {
  if (!classes?.length || features.length !== examples.length) throw new Error('fitHead needs known classes and one feature vector per example');
  const rows = rowsFor(examples, head, classes, features);
  if (algorithm === 'neural') return fitNeural(rows, classes, { nb: NB, ...opt });
  if (algorithm !== 'linear') throw new Error('Unknown brain classifier');
  const w = new Float32Array(classes.length * NB), counts = Array(classes.length).fill(0);
  for (const r of rows) counts[r.y]++;
  if (rows.length) sgd(w, rows, classes.length, { epochs: epochsFor(examples.length), ...opt });
  return { classes, counts, n: rows.length, T: 1, w };
}
export function train(examples, opt = {}) {
  const { heads: headConfig = J(trainingConfigFile, {}).heads || {}, ...settings } = opt;
  opt = { epochs: epochsFor(examples.length), ...settings };
  const F = examples.map((e) => feats(inputOf(e))), model = { version: 2, trainedAt: new Date().toISOString(), examples: examples.length, nb: NB, heads: {}, roles: {} };
  const windows = new Map([['full', F]]);
  for (const [h, classes] of Object.entries(HEADS)) {
    const spec = headConfig[h];
    if (!spec) { model.heads[h] = fitHead(examples, h, { features: F, classes, ...opt }); continue; }
    const context = spec.context || 'full';
    if (!windows.has(context)) windows.set(context, examples.map(e => feats(featureInput(inputOf(e), context))));
    const base = windows.get(context), transform = fitFeatureTransform(base, spec), features = base.map(f => applyFeatureTransform(f, transform));
    const classifier = spec.classifier || {};
    model.heads[h] = { ...fitHead(examples, h, { features, classes, ...opt, ...classifier }), transform };
  }
  for (const role of ROLE_IDS) { const R = roleRows(examples, role, F), W = new Float32Array(NB); if (R.length) sgd(W, R, 1, { ...opt, sigmoid: true }); model.roles[role] = { n: R.length, w: W }; }
  return model;
}
// calibration: one temperature per head, chosen to minimise the negative log-likelihood on held-out examples
export function calibrate(model, examples) {
  const out = {};
  for (const [h, hd] of Object.entries(model.heads)) {
    const T0 = examples.filter((e) => hd.classes.includes(e[h])); if (T0.length < 20) { out[h] = { T: hd.T, n: T0.length }; continue; }
    const S = T0.map((e) => ({ s: headScores(hd, featuresForHead(hd, inputOf(e))), y: hd.classes.indexOf(e[h]) }));
    let best = 1, bestNll = Infinity; for (let T = 0.3; T <= 4.01; T += 0.05) { let nll = 0; for (const { s, y } of S) nll -= Math.log(Math.max(1e-9, softmax(s, T)[y])); if (nll < bestNll) { bestNll = nll; best = +T.toFixed(2); } }
    // the log-loss temperature is kept only if it does not make the confidence less reliable (expected calibration error)
    const eceAt = (T) => { const bins = Array.from({ length: 10 }, () => [0, 0, 0]); for (const { s, y } of S) { const p = softmax(s, T); let c = 0; for (let k = 1; k < p.length; k++) if (p[k] > p[c]) c = k; const b = bins[Math.min(9, Math.floor(p[c] * 10))]; b[0]++; b[1] += p[c]; b[2] += c === y ? 1 : 0; } return bins.reduce((a, [n, cf, ok]) => a + (n ? (n / S.length) * Math.abs(cf / n - ok / n) : 0), 0); };
    if (eceAt(best) > eceAt(1)) best = 1;
    hd.T = best; out[h] = { T: best, n: T0.length };
  }
  return out;
}
// expected calibration error (10 bins): |confidence − accuracy|, weighted by bin size
export function ece(model, examples, head) {
  const hd = model.heads[head], T0 = examples.filter((e) => hd.classes.includes(e[head])); if (!T0.length) return null;
  const bins = Array.from({ length: 10 }, () => ({ n: 0, conf: 0, ok: 0 }));
  for (const e of T0) { const p = predict(model, e.ctx ? { currentText: e.text, ...e.ctx } : e.text)[head], b = bins[Math.min(9, Math.floor(p.conf * 10))]; b.n++; b.conf += p.conf; b.ok += p.label === e[head] ? 1 : 0; }
  return bins.reduce((a, b) => a + (b.n ? (b.n / T0.length) * Math.abs(b.conf / b.n - b.ok / b.n) : 0), 0);
}
// storage: int16 with one scale per head (a quarter of float32 JSON), restored to Float32Array on load
const pack = (w) => { let mx = 0; for (const x of w) mx = Math.max(mx, Math.abs(x)); const q = new Int16Array(w.length), s = mx / 32767 || 1; for (let i = 0; i < w.length; i++) q[i] = Math.round(w[i] / s); return { s, q: Buffer.from(q.buffer).toString('base64') }; };
const unpack = ({ s, q }) => { const b = Buffer.from(q, 'base64'), i16 = new Int16Array(b.buffer, b.byteOffset, b.byteLength / 2), w = new Float32Array(i16.length); for (let i = 0; i < i16.length; i++) w[i] = i16[i] * s; return w; };
const storedHead = h => ({ classes: h.classes, counts: h.counts, n: h.n, T: h.T,
  ...(h.algorithm === 'neural' ? { algorithm: 'neural', dim: h.dim, E: pack(h.embed), O: pack(h.output), B: pack(h.bias) } : { W: pack(h.w) }),
  ...(h.transform ? { transform: { context: h.transform.context, idfPower: h.transform.idfPower, ...(h.transform.idf ? { IDF: pack(h.transform.idf) } : {}) } } : {}) });
export function save(model, file = paths.model) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const { heads, roles, ...rest } = model, tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify({ ...rest, heads: Object.fromEntries(Object.entries(heads).map(([k, h]) => [k, storedHead(h)])), roles: Object.fromEntries(Object.entries(roles).map(([k, r]) => [k, { n: r.n, W: pack(r.w) }])) }));
  fs.renameSync(tmp, file);
}
export const load = (file = paths.model) => {
  try { const m = JSON.parse(fs.readFileSync(file, 'utf8')); if (m.version !== 2 || (m.nb && m.nb !== NB)) return null; // another version or hash size: retrain // a v1 model is retrained, never misread
    for (const h of Object.values(m.heads)) {
      if (h.algorithm === 'neural') {
        if (!Number.isInteger(h.dim) || h.dim < 1 || h.dim > 128) return null;
        h.embed = unpack(h.E); h.output = unpack(h.O); h.bias = unpack(h.B); delete h.E; delete h.O; delete h.B;
        if (h.embed.length !== NB * h.dim || h.output.length !== h.classes.length * h.dim || h.bias.length !== h.classes.length) return null;
      } else {
        if (h.algorithm && h.algorithm !== 'linear') return null;
        h.w = unpack(h.W); delete h.W;
        if (h.w.length !== NB * h.classes.length) return null;
      }
      if (h.transform) {
        const t = h.transform;
        if (!['full', 'current', 'previous'].includes(t.context) || !Number.isFinite(t.idfPower) || t.idfPower < 0 || t.idfPower > 1) return null;
        if (t.idfPower) { t.idf = unpack(t.IDF); if (t.idf.length !== NB || t.idf.some(x => !Number.isFinite(x) || x <= 0)) return null; }
        delete t.IDF;
      }
    } for (const r of Object.values(m.roles)) { r.w = unpack(r.W); delete r.W; }
    for (const [h, classes] of Object.entries(HEADS)) if (JSON.stringify(m.heads[h]?.classes) !== JSON.stringify(classes)) return null; // the label sets changed: retrain
    return m; } catch { return null; }
};
// input: a sentence or { currentText, prevText, nextText, prevPlace } → per head { label, conf, top: [{ label, p } ×3] }, roles [{ id, p }]
export function predict(model, input) {
  const f = feats(input), out = { roles: [] };
  for (const [h, hd] of Object.entries(model.heads)) {
    const p = softmax(headScores(hd, hd.transform ? featuresForHead(hd, input) : f), hd.T || 1), order = [...p.keys()].sort((a, b) => p[b] - p[a]);
    out[h] = { label: hd.classes[order[0]], conf: p[order[0]], top: order.slice(0, 3).map((c) => ({ label: hd.classes[c], p: p[c] })) };
  }
  for (const [role, r] of Object.entries(model.roles)) { let z = 0; for (let k = 0; k < f.idx.length; k++) z += r.w[f.idx[k]] * f.val[k]; out.roles.push({ id: role, p: 1 / (1 + Math.exp(-z)) }); }
  return out;
}
// a gesture in v1's 8-action vocabulary (real-test.jsonl was labelled with it): for a fair comparison with v1
const COARSE = { wave_hello: 'wave', wave_bye: 'wave', point_at: 'point', point_sky_high: 'point', fist_pump: 'cheer', both_hands_up: 'cheer' };
export const coarseAction = (a) => (ACTIONS.includes(a) ? a : COARSE[a] || 'idle');
export const readJsonl = (file) => { try { return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
export const curriculumFile = path.join(ROOT, 'brain', 'curriculum.jsonl');
// Keep validation rows and protected tests out of every retrain and replay. Assistant-authored
// teaching material remains separate from owner corrections, with its provenance intact.
export const allExamples = () => [...readJsonl(paths.seed), ...readJsonl(curriculumFile), ...readJsonl(paths.feedback), ...readJsonl(paths.fed)].filter((e) => !reservedExample(e));
// the owner's fed data (/admin: bulk stories, topics, the offline teacher) → data/brain/fed.jsonl, weight 2 (the owner's own
// corrections weigh 5). Never a test sentence: anything equal to, or sharing a 6-word run with, real-test.jsonl or
// holdout-200.jsonl is refused (the honest tests stay honest).
export const FED_WEIGHT = 2;
const normT = (t) => NF(t).toLowerCase().replace(/[^\p{L}\p{N}\p{M}\s]/gu, ' ').replace(/\s+/g, ' ').trim(), grams6 = (t) => { const w = normT(t).split(' '); return w.length < 6 ? [] : w.slice(0, -5).map((_, i) => w.slice(i, i + 6).join(' ')); };
let guardSets = null;
export function testOverlap(text) {
  if (!guardSets) { const T = [...readJsonl(paths.real), ...readJsonl(path.join(ROOT, 'brain', 'holdout-200.jsonl')), ...readJsonl(path.join(ROOT, 'brain', 'teaching-validation.jsonl')), ...readJsonl(path.join(ROOT, 'brain', 'story-generalization.jsonl'))].map((e) => e.text); guardSets = { same: new Set(T.map(normT)), grams: new Set(T.flatMap(grams6)) }; }
  return guardSets.same.has(normT(text)) || grams6(text).some((g) => guardSets.grams.has(g));
}
const reservedExample = (e) => e.held || [e.text, e.ctx?.prevText, e.ctx?.nextText].filter(Boolean).some(testOverlap);
export function feedMany(rows, { file = paths.model, source = 'fed' } = {}) {
  const ok = [], refused = [];
  for (const r of rows) { const e = { text: NF(r.text).trim() }; if (!e.text || e.text.length > 400) { refused.push({ text: r.text, why: 'empty or too long' }); continue; } if (testOverlap(e.text)) { refused.push({ text: e.text, why: 'a test sentence (or a 6-word run of one): never trained on' }); continue; }
    for (const h of Object.keys(HEADS)) if (r[h] != null && HEADS[h].includes(r[h])) e[h] = r[h]; if (Array.isArray(r.roles)) e.roles = r.roles.filter((x) => ROLE_IDS.includes(x));
    if (r.ctx && typeof r.ctx === 'object') e.ctx = { prevText: NF(r.ctx.prevText || '').slice(0, 800), nextText: NF(r.ctx.nextText || '').slice(0, 800), prevPlace: HEADS.place.includes(r.ctx.prevPlace) ? r.ctx.prevPlace : 'none' };
    if (reservedExample(e)) { refused.push({ text: e.text, why: 'reserved evaluation text in the example or its context' }); continue; }
    if (Object.keys(HEADS).some((h) => h in e) || 'roles' in e) ok.push({ ...e, source, weight: FED_WEIGHT, at: Date.now() }); else refused.push({ text: e.text, why: 'no valid label' }); }
  if (!ok.length) return { fed: 0, refused, ms: 0 };
  const t = Date.now(); fs.mkdirSync(path.dirname(paths.fed), { recursive: true }); fs.appendFileSync(paths.fed, ok.map((e) => JSON.stringify(e)).join('\n') + '\n');
  // a label the saved model has never had (a new place such as sea_beach) needs a full retrain (~4 s); otherwise adapt at once
  const m = load(file), fresh = m && ok.some((e) => Object.keys(HEADS).some((h) => e[h] != null && !m.heads[h]?.classes.includes(e[h])));
  if (fresh || (!m && fs.existsSync(file))) { trainFull(file); return { fed: ok.length, refused, ms: Date.now() - t, retrained: true }; }
  if (m) adapt(m, ok, { file }); return { fed: ok.length, refused, ms: Date.now() - t, retrained: false };
}
export function evaluate(model, tests) {
  const acc = {}, roles = { tp: 0, fp: 0, fn: 0 }, predictions = tests.map((e) => predict(model, inputOf(e)));
  for (const h of Object.keys(HEADS)) { const T = tests.map((e, i) => [e, i]).filter(([e]) => HEADS[h].includes(e[h])); acc[h] = { n: T.length, acc: T.length ? T.filter(([e, i]) => predictions[i][h].label === e[h]).length / T.length : null }; }
  for (const [i, e] of tests.entries()) { if (!Array.isArray(e.roles)) continue; const got = new Set(predictions[i].roles.filter((r) => r.p > 0.5).map((r) => r.id)), want = new Set(e.roles); for (const r of ROLE_IDS) { if (got.has(r) && want.has(r)) roles.tp++; else if (got.has(r)) roles.fp++; else if (want.has(r)) roles.fn++; } }
  acc.roles = { f1: roles.tp ? (2 * roles.tp) / (2 * roles.tp + roles.fp + roles.fn) : 0, ...roles };
  return acc;
}

// ---------- incremental learning ----------
// adapt the saved model to new examples in place: a few SGD passes over them (weighted 5×) with a replay sample of the seed, so the
// rest of what it knows stays put. Returns the adapted model (also saved).
export function adapt(model, examples, { epochs = 8, replay = 400, file = paths.model, seed = 3 } = {}) {
  examples = examples.filter((e) => !reservedExample(e)); if (!examples.length) return model;
  const r = rng(seed + examples.length), base = allExamples(), sample = Array.from({ length: Math.min(replay, base.length) }, () => base[Math.floor(r() * base.length)]);
  const batch = [...examples.map((e) => ({ ...e, weight: e.weight || FEEDBACK_WEIGHT })), ...sample], F = batch.map((e) => feats(inputOf(e)));
  for (const [h, hd] of Object.entries(model.heads)) {
    const features = hd.transform ? batch.map(e => featuresForHead(hd, inputOf(e))) : F, R = rowsFor(batch, h, hd.classes, features);
    if (R.some((x) => x.w > 1)) {
      if (hd.algorithm === 'neural') updateNeural(hd, R, { epochs, lr: 0.04, seed }); else sgd(hd.w, R, hd.classes.length, { epochs, lr: 0.5, seed });
      if (hd.counts) for (const r of R) hd.counts[r.y]++;
    }
  }
  for (const [role, rd] of Object.entries(model.roles)) { const R = roleRows(batch, role, F); if (R.some((x) => x.w > 1)) sgd(rd.w, R, 1, { epochs, lr: 0.5, sigmoid: true, seed }); }
  model.adaptedAt = new Date().toISOString(); model.examples += examples.length; save(model, file); return model;
}
// the owner's approved shots → training examples (what these sentences turned into), learned at once in one adaptation
export function learnMany(examples, { model = null, file = paths.model } = {}) {
  examples = examples.filter((e) => e.text && !reservedExample(e));
  if (!examples.length) return [];
  const es = examples.map((x) => ({ ...x, source: 'feedback', weight: FEEDBACK_WEIGHT, at: Date.now() }));
  fs.mkdirSync(path.dirname(paths.feedback), { recursive: true }); fs.appendFileSync(paths.feedback, es.map((e) => JSON.stringify(e)).join('\n') + '\n');
  const m = model || load(file); if (m) adapt(m, es, { file }); else if (fs.existsSync(file)) trainFull(file); return es;
}
export const learn = (example, o = {}) => learnMany([example], o)[0];
// a full retrain (seed + feedback) with the per-head temperatures measured by scripts/brain-train.mjs (brain/calibration.json)
export function trainFull(file = paths.model) {
  const m = train(allExamples()), cal = J(paths.calibration, {}); for (const [h, hd] of Object.entries(m.heads)) if (cal[h]?.T) hd.T = cal[h].T;
  save(m, file); return m;
}
// a rule in plain Bangla or English → examples → learned at once.
//   "যখন স্ক্রিপ্টে শেয়ার বাজারের কথা থাকবে তখন place হবে office_room আর graphic হবে dynamic_comparison_chart"
//   "when the script talks about the stock market then place is office_room and graphic is dynamic_comparison_chart"
const HEAD_WORDS = { place: 'place', জায়গা: 'place', স্থান: 'place', লোকেশন: 'place', action: 'action', অ্যাকশন: 'action', কাজ: 'action', face: 'face', মুখ: 'face', মুখভাব: 'face', অভিব্যক্তি: 'face', broll: 'broll', 'b-roll': 'broll', বিরোল: 'broll', 'বি-রোল': 'broll', graphic: 'graphic', graphics: 'graphic', গ্রাফিক: 'graphic', গ্রাফিকস: 'graphic', camera: 'cameraMove', cameramove: 'cameraMove', ক্যামেরা: 'cameraMove', role: 'roles', roles: 'roles', চরিত্র: 'roles' };
const FILLER = /(স্ক্রিপ্টে|স্ক্রিপ্টের|গল্পে|বাক্যে|লেখায়|কথায়|কথা|নিয়ে|সম্পর্কে|থাকবে|থাকে|থাকলে|আসবে|আসে|বলা হবে|বলা হয়|উল্লেখ|the script|the story|the sentence|script|story|sentence|mentions?|talks? about|is about|there is|there are|contains?|says?|about|anything|something)/giu;
const NATURAL = [
  ['graphic', 'dynamic_comparison_chart', /চার্ট|গ্রাফ|তুলনা|\bchart\b|\bgraph\b|comparison/iu], ['graphic', 'percentage_progress_ring', /শতাংশ|রিং|\bring\b|percent/iu], ['graphic', 'number_badge_pop', /ব্যাজ|\bbadge\b/iu],
  ['graphic', 'step_list_card', /তালিকা|লিস্ট|\blist\b/iu], ['graphic', 'thought_cloud', /ভাবনার মেঘ|চিন্তার মেঘ|thought (?:cloud|bubble)/iu], ['graphic', 'comic_emotion_fx', /ইমোশন ইফেক্ট|অনুভূতির ইফেক্ট|emotion effect/iu],
  ['cameraMove', 'slow_push_in', /জুম ইন|কাছে যাবে|কাছে আসবে|zoom in|push in/iu], ['cameraMove', 'slow_pull_out', /জুম আউট|দূরে সরে|zoom out|pull out/iu], ['cameraMove', 'gentle_pan', /প্যান|\bpan\b/iu], ['cameraMove', 'impact_shake', /ঝাঁকুনি|কেঁপে উঠবে|কাঁপবে|\bshake\b/iu],
  ['face', 'happy', /খুশি মুখ|হাসি মুখ|happy face/iu], ['face', 'sad', /দুঃখী মুখ|sad face/iu], ['face', 'worried', /চিন্তিত মুখ|worried face/iu], ['face', 'surprised', /অবাক মুখ|surprised face/iu],
];
function naturalLabels(text) {
  const out = {}, t = NF(text);
  for (const [h, v, rx] of NATURAL) if (!out[h] && rx.test(t)) out[h] = v;
  const pl = resolvePlaceSync(t); if (pl && HEADS.place.includes(pl)) out.place = pl;
  if (/বি-?রোল|b-?roll|কাটঅ্যাওয়ে|cutaway/iu.test(t)) { const b = TEMPLATE_WORDS_OF().find(([, ws]) => ws.some((w) => t.includes(NF(w)))); if (b) out.broll = b[0]; }
  return out;
}
export function parseRule(text) {
  const t = NF(text).trim(), m = /^(?:যখনই|যখন|যদি|when|whenever|if)\s+(.+?)\s*,?\s*(?:তখন|then)\s+(.+)$/iu.exec(t) || /^(.+?)\s*(?:হলে|থাকলে)\s*,?\s+(.+)$/u.exec(t);
  if (!m) throw new Error('Write the rule as "যখন … তখন place হবে …" or "when … then graphic is …".');
  // the topic, its last word without a genitive ending ("শেয়ার বাজারের কথা" → "শেয়ার বাজার")
  let topic = m[1].replace(FILLER, ' ').replace(/\s+/g, ' ').trim().replace(/^(the|a|an)\s+/i, '').replace(/([\u0980-\u09FF]{2,})(?:ের|এর)$/u, '$1');
  // a genitive র after a vowel ("বৃষ্টির" → "বৃষ্টি") only when the rest is a word we know (বাজার must not become বাজা)
  const last = topic.split(' ').pop(), bare = NF(last).replace(/র$/u, '');
  if (bare !== NF(last) && /[\u09BE-\u09CC]$/u.test(bare) && (ONE.has(bare) || KNOWN_WORDS().has(bare) || MANY.some(([p]) => p === NF(topic.slice(0, topic.length - last.length) + bare).toLowerCase()))) topic = topic.slice(0, topic.length - last.length) + bare;
  if (!topic) throw new Error('The rule needs a topic before তখন / then.');
  const labels = {}, problems = [];
  for (const part of m[2].split(/\s*,\s*|\s+(?:আর|এবং|and)\s+/iu).filter(Boolean)) { // (no \b: it does not work between Bengali letters)
    const a = /^(\S+)\s*(?:হবে|হোক|=|:|is|should be|will be|becomes?)\s*(\S+)/iu.exec(part.trim()); if (!a) { problems.push(`not understood: "${part}"`); continue; }
    const head = HEAD_WORDS[a[1].toLowerCase()] || HEAD_WORDS[NF(a[1])]; let value = a[2].replace(/[।.!,]+$/u, '');
    if (!head) { problems.push(`unknown head "${a[1]}" (place, action, face, broll, graphic, camera)`); continue; }
    if (head === 'roles') { if (!ROLE_IDS.includes(value)) problems.push(`role "${value}" is not one of ${ROLE_IDS.join(', ')}`); else labels.roles = [value]; continue; }
    if (!HEADS[head].includes(value)) { problems.push(`${head} "${value}" is not one of: ${HEADS[head].join(', ')}`); continue; }
    labels[head] = value;
  }
  // everyday words instead of "head হবে value": "চার্ট দেখাবা", "ক্যামেরা জুম করবে", "অফিস দেখাও", "বৃষ্টির বি-রোল"
  if (!Object.keys(labels).length) { const nat = naturalLabels(m[2]); if (Object.keys(nat).length) { Object.assign(labels, nat); problems.length = 0; } }
  if (!Object.keys(labels).length) throw new Error(`Nothing to learn: ${problems.join('; ')}`);
  return { topic, labels, problems };
}
const RULE_TEMPLATES = { bn: ['{T} নিয়ে আজ সবাই কথা বলছে।', 'আজকের খবরে {T} এর কথা এসেছে।', 'সে {T} সম্পর্কে জানতে চাইল।', '{T} এ আবার বড় পরিবর্তন হয়েছে।', 'রাফি {T} নিয়ে খুব চিন্তিত।', 'আমরা এখন {T} নিয়ে কথা বলব।', 'বাবা {T} এর খবর দেখছেন।', '{T} এর অবস্থা আজ ভালো নয়।'],
  en: ['Everyone is talking about the {T} today.', 'The news is all about the {T}.', 'She asked about the {T}.', 'There was a big change in the {T}.', 'Rafi is worried about the {T}.', 'Now we will talk about the {T}.', 'Father is watching news on the {T}.', 'The {T} is not doing well today.'] };
export function learnRule(text, { file = paths.model } = {}) {
  const t0 = Date.now(), rule = parseRule(text), bn = /[ঀ-৿]/.test(rule.topic);
  const examples = [NF(text), ...RULE_TEMPLATES[bn ? 'bn' : 'en'].map((s) => s.replace('{T}', rule.topic))].map((s) => ({ text: s, ...rule.labels, source: 'rule', weight: FEEDBACK_WEIGHT, rule: NF(text), at: Date.now() })).filter((e) => !reservedExample(e));
  if (!examples.length) throw new Error('This rule overlaps reserved evaluation text; it was not learned.');
  fs.mkdirSync(path.dirname(paths.feedback), { recursive: true }); fs.appendFileSync(paths.feedback, examples.map((e) => JSON.stringify(e)).join('\n') + '\n');
  let m = load(file); if (!m) m = trainFull(file); else adapt(m, examples, { file });
  return { ...rule, examples: examples.length, ms: Date.now() - t0, model: m };
}
