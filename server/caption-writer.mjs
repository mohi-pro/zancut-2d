// Smart Bangla & English captions, headlines and data graphics from the spoken words: rules and local libraries only, no model.
//   subtitles(words)          → word-synced chunks (2–5 words, the active word lights up in compose's caption lane)
//   headlineCaption(sentence) → a 2–5 word banner ("প্রতিদিন ৩০ মিনিট হাঁটুন!", "নিয়ম #১: সকালে পানি খান")
//   graphicsFor(sentence)     → overlays for engine/cartoon/graphics-fx.js: comparison chart, progress ring, number badge, step list,
//                               thought cloud, comic emotion fx; plus a camera move (engine/cartoon/camera.js ZC.cameraMove)
// Chart geometry comes from d3-scale / d3-shape, hand-drawn outlines from rough.js and the pop curve from animejs's spring (power-libraries).
import { chartScale, chartPath, roughPath, springAt, unicodeTokens } from './power-libraries.mjs';
import { thingsNamed } from './broll.mjs';

// Bengali has two spellings of য় / ড় / ঢ় in Unicode: every literal below is normalised the same way as the input (NFC)
const NF = (x) => (x instanceof RegExp ? new RegExp(x.source.normalize('NFC'), x.flags) : typeof x === 'string' ? x.normalize('NFC') : x);
const NK = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k.normalize('NFC'), v]));
const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
export const toAscii = (s) => String(s).replace(NF(/[০-৯]/g), (d) => String(BN_DIGITS.indexOf(d)));
export const toBn = (s) => String(s).replace(/[0-9]/g, (d) => BN_DIGITS[+d]);
const isBn = (s) => NF(/[ঀ-৿]/).test(s);
const norm = (s) => String(s || '').normalize('NFC');
const fmt = (v, bn) => { const s = Number.isInteger(v) ? String(v) : String(Math.round(v * 10) / 10); return bn ? toBn(s) : s; };

// ---------- numbers in speech ----------
const WORD_NUM = NK({ এক: 1, দুই: 2, দু: 2, তিন: 3, চার: 4, পাঁচ: 5, ছয়: 6, সাত: 7, আট: 8, নয়: 9, দশ: 10, এগারো: 11, বারো: 12, পনেরো: 15, বিশ: 20, পঁচিশ: 25, ত্রিশ: 30, চল্লিশ: 40, পঞ্চাশ: 50, ষাট: 60, সত্তর: 70, আশি: 80, নব্বই: 90, একশ: 100, একশো: 100,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twenty: 20, thirty: 30, forty: 40, fifty: 50, hundred: 100 });
const MULT = NK({ হাজার: 1e3, লাখ: 1e5, লক্ষ: 1e5, কোটি: 1e7, thousand: 1e3, million: 1e6 });
const UNITS = [
  ['percent', NF(/^(%|শতাংশ|পার্সেন্ট|ভাগ|percent)/u), '%'],
  ['money', NF(/^(টাকা|টাকায়|টাকার|taka|tk|ডলার|dollars?)/iu), null],
  ['year', NF(/^(সালে|সাল|সনে|সন)/u), null],
  ['duration', NF(/^(বছর|মাস|সপ্তাহ|দিন|ঘণ্টা|ঘন্টা|মিনিট|সেকেন্ড|years?|months?|weeks?|days?|hours?|minutes?|seconds?)/iu), null],
  ['weight', NF(/^(কেজি|গ্রাম|kg|grams?)/iu), null], ['distance', NF(/^(কিলোমিটার|কিমি|মিটার|km|meters?|miles?)/iu), null],
];
export function numbersIn(sentence) {
  const s = norm(sentence), out = [], re = NF(/([৳$])?\s*([0-9০-৯]+(?:[.,][0-9০-৯]+)?)|([\p{L}\p{M}]+)/gu); let m, prev = null;
  const toks = []; while ((m = re.exec(s))) toks.push({ cur: m[1] || null, num: m[2] ? Number(toAscii(m[2]).replace(/,/g, '')) : null, word: m[3] || null, raw: m[0].trim(), index: m.index + (m[0].length - m[0].trimStart().length), end: re.lastIndex });
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i]; let value = t.num, j = i;
    if (value == null) { const w = t.word.toLowerCase(); if (['অর্ধেক', 'half'].includes(w)) { out.push({ value: 50, kind: 'percent', unit: '%', raw: t.raw, index: t.index, said: 'half' }); continue; } if (['সিকি', 'quarter'].includes(w)) { out.push({ value: 25, kind: 'percent', unit: '%', raw: t.raw, index: t.index, said: 'quarter' }); continue; } if (WORD_NUM[w] == null) continue; value = WORD_NUM[w]; }
    const nx = toks[j + 1]; if (nx?.word && MULT[nx.word.toLowerCase()]) { value *= MULT[nx.word.toLowerCase()]; j++; }
    const after = s.slice(toks[j].end).trimStart(), unitTok = toks[j + 1];
    let kind = 'plain', unit = '', pctEnd = 0;
    if (t.cur) { kind = 'money'; unit = t.cur; }
    else if (/^%/.test(after)) { kind = 'percent'; unit = '%'; pctEnd = s.indexOf('%', toks[j].end) + 1; }
    else if (unitTok?.word) for (const [k, rx, u] of UNITS) if (rx.test(unitTok.word)) { kind = k; unit = u ?? unitTok.word; j++; break; }
    if (kind === 'plain' && t.num != null && value >= 1900 && value <= 2100 && Number.isInteger(value)) kind = 'year';
    if (kind === 'year') unit = '';
    out.push({ value, kind, unit, raw: s.slice(t.index, Math.max(pctEnd, toks[j].end)).trim(), index: t.index });
    i = j; prev = t;
  }
  const typed = out.filter((x) => !['plain', 'year'].includes(x.kind));
  if (typed.length && typed.every((x) => x.kind === typed[0].kind)) for (const x of out) if (x.kind === 'plain' && out.length <= 4) { x.kind = typed[0].kind; x.unit = typed[0].unit; x.inherited = true; }
  return out;
}

// ---------- headline ----------
const STOP = new Set([].concat(['আমি', 'আমরা', 'আমাদের', 'আমার', 'তুমি', 'তোমার', 'আপনি', 'আপনার', 'সে', 'তার', 'তারা', 'তাদের', 'এই', 'ওই', 'সেই', 'যে', 'যা', 'জন্য', 'এবং', 'ও', 'আর', 'কিন্তু', 'হয়', 'হয়', 'হলো', 'হল', 'হলে', 'ছিল', 'করে', 'থেকে', 'অনেক', 'খুব', 'অত্যন্ত', 'একটি', 'একটা', 'কি', 'কী', 'না', 'তো', 'ই', 'তাই', 'যদি', 'তবে', 'এটা', 'এটি', 'ওটা', 'কারণ', 'মধ্যে', 'দিয়ে', 'দিয়ে', 'নিয়ে', 'নিয়ে', 'উপর', 'বেশ', 'সব', 'অন্তত', 'রাখার', 'আছে', 'নেই', 'করতে', 'করা', 'গিয়ে', 'বলে', 'মতো', 'শুধু', 'আসলে', 'এখন', 'তখন', 'কেউ', 'কোনো',
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'to', 'of', 'and', 'or', 'but', 'in', 'on', 'at', 'for', 'with', 'that', 'this', 'it', 'we', 'our', 'you', 'your', 'he', 'she', 'they', 'his', 'her', 'their', 'be', 'been', 'very', 'so', 'just', 'really', 'from', 'by', 'as', 'about', 'have', 'has', 'had', 'do', 'does', 'did', 'i', 'my', 'me', 'will', 'would', 'can', 'could', 'there', 'then', 'than', 'also']).map(NF));
const ORD = NK({ প্রথম: 1, দ্বিতীয়: 2, তৃতীয়: 3, চতুর্থ: 4, পঞ্চম: 5, ষষ্ঠ: 6, first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6 });
const ORD_RE = NF(/(প্রথম|দ্বিতীয়|তৃতীয়|চতুর্থ|পঞ্চম|ষষ্ঠ)(তঃ|ত)?(?=[\s,:।]|$)|\b(first|second|third|fourth|fifth|sixth)(ly)?\b/iu);
const TOPIC = NK({ নিয়ম: 'নিয়ম', ধাপ: 'ধাপ', কারণ: 'কারণ', উপায়: 'উপায়', টিপস: 'টিপস', কথা: 'কথা', কাজ: 'কাজ', rule: 'Rule', step: 'Step', reason: 'Reason', tip: 'Tip', way: 'Way', thing: 'Thing' });
const IMPERATIVE = NK({ হাঁটা: 'হাঁটুন', লেখা: 'লিখুন', শেখা: 'শিখুন', খাওয়া: 'খান', খাওয়া: 'খান', যাওয়া: 'যান', যাওয়া: 'যান', শোনা: 'শুনুন', দেখা: 'দেখুন', ঘুম: 'ঘুমান', হাসা: 'হাসুন', দৌড়ানো: 'দৌড়ান', দৌড়ানো: 'দৌড়ান', বাঁচা: 'বাঁচুন', ধোয়া: 'ধুয়ে নিন', ধোয়া: 'ধুয়ে নিন', নেওয়া: 'নিন', দেওয়া: 'দিন' });
export function imperative(verbal) {
  const w = norm(verbal), parts = w.split(/\s+/), last = parts.at(-1), head = parts.slice(0, -1).join(' ');
  const turn = (x) => IMPERATIVE[x] || IMPERATIVE[x.normalize('NFC')] || (x === 'করা' ? 'করুন' : x.endsWith('ানো') ? x.slice(0, -3) + 'ান' : x.endsWith('া') ? x.slice(0, -1) + 'ুন' : x);
  return (head ? head + ' ' : '') + turn(last);
}
const ADVICE_BN = NF(/(জরুরি|জরুরী|দরকার|উচিত|প্রয়োজন|প্রয়োজন|ভালো অভ্যাস|অভ্যাস করুন)/u), INTENS = new Set(['অত্যন্ত', 'খুব', 'খুবই', 'বেশ', 'অবশ্যই', 'ভীষণ', 'একান্ত'].map(NF));
const FREQ = ['প্রতিদিন', 'রোজ', 'প্রতি সপ্তাহে', 'নিয়মিত', 'প্রতি রাতে', 'সবসময়', 'every day', 'daily', 'every week', 'always'].map(NF);
const words = (s) => norm(s).replace(/[,.!?।;:"'()“”]/g, ' ').split(/\s+/).filter(Boolean);
const titleCase = (s) => s.replace(/\b([a-z])/g, (c) => c.toUpperCase());
function contentWords(s, n) { return words(s).filter((w) => !STOP.has(w.toLowerCase())).slice(0, n); }
// keywords by TF-IDF over the whole transcript (a word said in every sentence is not a headline), in spoken order
function keywords(sentence, corpus = [], n = 4) {
  const docs = (corpus.length ? corpus : [sentence]).map((d) => unicodeTokens(d)), N = docs.length, toks = unicodeTokens(sentence);
  const score = (w) => { const tf = toks.filter((x) => x === w).length / toks.length, df = docs.filter((d) => d.includes(w)).length; return tf * Math.log(1 + N / (1 + df)) + (NF(/\d|[০-৯]/).test(w) ? 0.5 : 0) + Math.min(w.length, 8) * 0.01; };
  const cand = [...new Set(toks)].filter((w) => !STOP.has(w) && w.length > 1).map((w) => ({ w, s: score(w), at: toks.indexOf(w) })).sort((a, b) => b.s - a.s).slice(0, n);
  return cand.sort((a, b) => a.at - b.at).map((c) => c.w);
}
export function headlineCaption(sentence, { corpus = [] } = {}) {
  const s = norm(sentence).trim(), bn = isBn(s), low = s.toLowerCase();
  // 1. a rule, step or point: "প্রথম নিয়ম হলো …" → "নিয়ম #১: …", "Secondly, …" → "#2: …"
  const om = ORD_RE.exec(s);
  if (om && om.index < 12) {
    const n = ORD[(om[1] || om[3]).toLowerCase()], rest = s.slice(om.index + om[0].length).trim();
    const tm = /^([\p{L}\p{M}]+)/u.exec(rest), topic = tm && TOPIC[tm[1].toLowerCase().replace(/s$/, '')] ? TOPIC[tm[1].toLowerCase().replace(/s$/, '')] : null;
    const body = rest.replace(/^([\p{L}\p{M}]+)\s*/u, topic ? '' : '$1 ').replace(NF(/^(হলো|হল|হচ্ছে|is|are|:|,)\s*/iu), '').replace(/^(to)\s+/i, '');
    const bw = words(body), doing = bn && bw.length > 1 && bw.at(-1) === NF('করা'); // "ব্যায়াম করা" → "ব্যায়াম করুন"
    let tail = contentWords(doing ? bw.slice(0, -1).join(' ') : body, doing ? 2 : 3);
    if (doing) tail.push(NF('করুন')); else if (bn && tail.length) tail[tail.length - 1] = imperative(tail.at(-1)).split(' ').at(-1);
    const label = `${topic ? topic + ' ' : ''}#${fmt(n, bn)}`;
    return { text: `${label}: ${bn ? tail.join(' ') : titleCase(tail.join(' '))}`.trim(), rule: 'ordinal' };
  }
  // 2. advice: "... প্রতিদিন সকালে অন্তত ৩০ মিনিট হাঁটা অত্যন্ত জরুরি" → "প্রতিদিন ৩০ মিনিট হাঁটুন!"
  const am = ADVICE_BN.exec(s);
  if (bn && am) {
    const before = words(s.slice(0, am.index)).filter((w) => !INTENS.has(w)); let verbal = before.at(-1) || '';
    if (verbal === 'করা' && before.length > 1) verbal = before.at(-2) + ' করা';
    if (verbal && !STOP.has(verbal)) {
      const freq = FREQ.find((f) => s.includes(f)), num = numbersIn(s.slice(0, am.index)).find((x) => x.kind === 'duration' || x.kind === 'plain' || x.kind === 'weight' || x.kind === 'distance');
      const parts = [freq, num ? `${fmt(num.value, true)}${num.unit ? ' ' + num.unit : ''}` : null, imperative(verbal)].filter(Boolean);
      return { text: parts.join(' ') + '!', rule: 'advice' };
    }
  }
  const em = /\b(?:it(?:'s| is) (?:important|essential|necessary)|you (?:should|must|need to|have to)|we (?:should|must|need to)|try to|remember to)\s+(?:to\s+)?(.+)$/i.exec(s);
  if (!bn && em) { const ws = words(em[1]).slice(0, 5); return { text: titleCase(ws.join(' ')) + '!', rule: 'advice' }; }
  // a list: its introduction is the headline ("সফল হওয়ার তিনটি উপায়: …" → "সফল হওয়ার তিনটি উপায়")
  const colon = s.indexOf(':'); if (colon > 3 && stepItems(s)) { const intro = words(s.slice(0, colon)).slice(-5); return { text: bn ? intro.join(' ') : titleCase(intro.join(' ')), rule: 'list' }; }
  // 3. a change between two amounts: "৪০ টাকা থেকে বেড়ে ৭০ টাকা" → "৪০ → ৭০ টাকা!"
  const nums = numbersIn(s), vals = nums.filter((x) => x.kind !== 'year');
  if (vals.length >= 2 && vals[0].kind === vals[1].kind) {
    const a = vals[0], b = vals.at(-1), up = b.value >= a.value, u = b.unit ? (b.unit === '%' ? '%' : ' ' + b.unit) : '';
    if (NF(/লক্ষ্য|চাই|চায়|\b(target|aim|goal|want)\b/iu).test(s)) return { text: `${bn ? 'লক্ষ্য' : 'Goal'}: ${fmt(a.value, bn)} → ${fmt(b.value, bn)}${u}`, rule: 'goal' };
    return { text: `${fmt(a.value, bn)} → ${fmt(b.value, bn)}${u} ${up ? '↑' : '↓'}`, rule: 'change' };
  }
  // 4. one percentage or amount with what it counts: "৮৫% মানুষ ..." → "৮৫% মানুষ"
  if (nums.length === 1) {
    const x = nums[0], after = contentWords(s.slice(x.index + x.raw.length), 2), u = x.unit === '%' ? '%' : x.unit ? ' ' + x.unit : '';
    const before = contentWords(s.slice(0, x.index), 4).slice(-2);
    const parts = x.kind === 'percent' ? [`${fmt(x.value, bn)}%`, ...after] : [...before.slice(-1), `${fmt(x.value, bn)}${u}`, ...after.slice(0, 1)];
    return { text: (bn ? parts.join(' ') : titleCase(parts.join(' '))) + (x.kind === 'percent' ? '' : '!'), rule: 'number' };
  }
  // 5. keywords (TF-IDF over the transcript), 2–4 words
  let kw = keywords(s, corpus, 4); if (kw.length < 2) kw = words(s).slice(0, 3);
  const text = kw.join(' '); return { text: bn ? text : titleCase(text), rule: 'keywords' };
}

// ---------- word-synced subtitles ----------
// words: [{ text, start, end }] → chunks of 2–5 words that break on a pause, a punctuation mark or a line that would be too long
export function subtitles(words0, { maxWords = 5, maxChars = 36, pause = 0.28 } = {}) {
  const words = (words0 || []).map((w) => ({ ...w, text: String(w.text ?? '').normalize('NFC') })); // NFC: never split a letter from its vowel sign
  const chunks = []; let cur = [];
  const push = () => { if (cur.length) chunks.push({ s: cur[0].start, e: cur.at(-1).end, lang: isBn(cur.map((w) => w.text).join(' ')) ? 'bn' : 'en', words: cur.map((w, i) => ({ text: w.text, s: w.start, e: w.end, i: w.i })) }); cur = []; };
  words.forEach((w0, i) => {
    const w = { ...w0, i }, prev = cur.at(-1), len = cur.reduce((n, x) => n + String(x.text).length + 1, 0) + String(w.text).length;
    if (prev && (w.start - prev.end > pause || cur.length >= maxWords || len > maxChars || /[.!?।,;:]$/.test(prev.text))) push();
    cur.push(w);
  });
  push();
  // a lone word joins its neighbour when it can (2–5 words a line)
  for (let k = chunks.length - 1; k > 0; k--) {
    const a = chunks[k - 1], b = chunks[k]; if (b.words.length !== 1 || /[.!?।]$/.test(a.words.at(-1).text) || b.words[0].s - a.words.at(-1).e > pause) continue;
    if (a.words.length < maxWords) { a.words.push(...b.words); a.e = b.e; chunks.splice(k, 1); }
    else { const w = a.words.pop(); a.e = a.words.at(-1).e; b.words.unshift(w); b.s = w.s; } // a full line lends its last word: 4 + 2, never 5 + 1
  }
  return chunks;
}
export const activeWord = (chunk, t) => chunk.words.findIndex((w, i) => t >= w.s && (t < (chunk.words[i + 1]?.s ?? chunk.e)));

// ---------- graphics ----------
const SPRING = Array.from({ length: 41 }, (_, i) => Math.round(springAt(i / 40) * 10000) / 10000); // animejs spring, sampled for the browser
const EMOTION = [['shock', NF(/অবাক|চমকে|চমক|হতবাক|shocked|surprised|stunned|can't believe/iu)], ['angry', NF(/রাগ|রেগে|ক্ষেপে|angry|furious|mad at/iu)], ['sweat', NF(/ভয়|ভয়|চিন্তায়|টেনশন|নার্ভাস|afraid|scared|nervous|worried/iu)], ['question', NF(/কেন(?=[\s,?।]|$)|কী হলো|কি হলো|বুঝতে পারছে না|why\b|confused|wonder/iu)], ['idea', NF(/বুদ্ধি|আইডিয়া|মাথায় এল|idea|realized|got it/iu)]];
const THINK = NF(/ভাবছে|ভাবল|ভাবলো|ভাবতে|স্বপ্ন|মনে মনে|কল্পনা|thinks?|thought of|dreams?|imagin/iu);
const LIST_SPLIT = NF(/\s*(?:,|،|;|\band\b|\s(?:আর|ও|এবং)\s)\s*/u);
// a chart from two or more values: bars (or a trend line over years), with d3 geometry, a rough.js frame and the trend
export function chartOf(sentence) {
  const s = norm(sentence), bn = isBn(s), nums = numbersIn(s), years = nums.filter((x) => x.kind === 'year'), vals = nums.filter((x) => x.kind !== 'year');
  if (vals.length < 2) return null;
  const kind = vals[0].kind, same = vals.filter((x) => x.kind === kind); if (same.length < 2) return null;
  const pts = same.slice(0, 6), byYear = years.length === pts.length;
  const fromTo = NF(/থেকে|from/iu).test(s) && pts.length === 2;
  const goal = pts.length === 2 && NF(/লক্ষ্য|চাই|চায়|\b(target|aim|goal|want)\b/iu).test(s);
  const labels = pts.map((p, i) => (byYear ? fmt(years[i].value, bn) : goal ? (bn ? ['এখন', 'লক্ষ্য'][i] : ['Current', 'Goal'][i]) : fromTo ? (bn ? ['আগে', 'এখন'][i] : ['Before', 'Now'][i]) : `${fmt(i + 1, bn)}`));
  const up = NF(/বেড়|বাড়|বৃদ্ধি|rose|rise|increase|up\b|grew/iu).test(s), down = NF(/কমে|কমেছে|হ্রাস|fell|drop|decrease|down\b/iu).test(s);
  const trend = up ? 'up' : down ? 'down' : pts.at(-1).value >= pts[0].value ? 'up' : 'down';
  const W = 560, H = 300, max = Math.max(...pts.map((p) => p.value)) * 1.15 || 1, y = chartScale([0, max], [H, 0]), bw = W / pts.length;
  const bars = pts.map((p, i) => ({ label: labels[i], value: p.value, text: `${fmt(p.value, bn)}${p.unit === '%' ? '%' : ''}`, x: i * bw + bw * 0.2, w: bw * 0.6, y: y(p.value), h: H - y(p.value) }));
  const line = chartPath(bars.map((b) => [b.x + b.w / 2, b.y]));
  const frame = roughPath([[0, 0], [0, H], [W, H]], pts.length * 7 + 3).map((p) => p.d);
  const unit = pts[0].unit && pts[0].unit !== '%' ? pts[0].unit : pts[0].unit === '%' ? '%' : '';
  return { kind: 'dynamic_comparison_chart', style: byYear ? 'line' : 'bar', purpose: goal ? 'goal' : 'comparison', trend, unit, bars, line, frame, size: [W, H], bn };
}
export function stepItems(sentence) {
  const s = norm(sentence), m = /[:：]\s*(.+)$/u.exec(s) || NF(/(?:তিনটি|তিনটা|চারটি|চারটা|দুটি|দুটো|পাঁচটি|three|four|two|five)\s+[\p{L}\p{M}]+\s+(?:হলো|হল|are|:)?\s*(.+)$/iu).exec(s);
  if (m) { const items = m[1].replace(/[.!?।]+$/u, '').split(LIST_SPLIT).map((x) => x.trim()).filter(Boolean); if (items.length >= 2) return items.slice(0, 6); }
  const nm = [...s.matchAll(NF(/(?:^|\s)([0-9০-৯])[.)]\s*([^0-9০-৯]+?)(?=\s[0-9০-৯][.)]|$)/gu))]; if (nm.length >= 2) return nm.map((x) => x[2].trim()).slice(0, 6);
  return null;
}
export function graphicsFor(sentence, { corpus = [], list = null } = {}) {
  const s = norm(sentence), bn = isBn(s), nums = numbersIn(s), out = [];
  const chart = chartOf(s);
  const pct = nums.filter((x) => x.kind === 'percent');
  if (chart) out.push(chart);
  else if (pct.length === 1) out.push({ kind: 'percentage_progress_ring', value: Math.max(0, Math.min(100, pct[0].value)), text: `${fmt(pct[0].value, bn)}%`, label: headlineCaption(s).text.replace(NF(/^[0-9০-৯.]+%\s*/), '') || '', bn });
  else { const one = nums.find((x) => ['money', 'duration', 'year', 'weight', 'distance'].includes(x.kind)); if (one && nums.length === 1) out.push({ kind: 'number_badge_pop', value: one.value, text: `${one.kind === 'money' && one.unit === '৳' ? '৳' : ''}${fmt(one.value, bn)}${one.unit && one.unit !== '৳' ? ' ' + one.unit : ''}`, unit: one.unit, what: one.kind, bn }); }
  const items = list || stepItems(s); if (items) out.push({ kind: 'step_list_card', items, bn });
  if (THINK.test(s)) { const thing = thingsNamed(s)[0]; out.push({ kind: 'thought_cloud', icon: thing ? `openmoji:${thing.hex}` : null, text: (thing?.said || keywords(s, corpus, 2).join(' ')).slice(0, 18), bn }); }
  const emo = EMOTION.find(([, rx]) => rx.test(s)); if (emo) out.push({ kind: 'comic_emotion_fx', emotion: emo[0] });
  return out.map((g) => ({ ...g, spring: SPRING }));
}
export function cameraMoveFor(sentence, { people = 1 } = {}) {
  const s = norm(sentence), emo = EMOTION.find(([, rx]) => rx.test(s))?.[0];
  if (emo === 'shock' || emo === 'angry') return 'impact_shake';
  if (ADVICE_BN.test(s) || NF(/important|remember|জরুরি|মনে রাখবেন/iu).test(s) || numbersIn(s).length) return 'slow_push_in';
  if (NF(/শেষে|অবশেষে|বিদায়|finally|in the end|goodbye/iu).test(s)) return 'slow_pull_out';
  if (people >= 2 && NF(/বলল|বললো|জিজ্ঞেস|উত্তর|said|asked|replied/iu).test(s)) return 'over_the_shoulder';
  return null;
}
// a numbered list said over several sentences ("প্রথমত … দ্বিতীয়ত …"): each sentence shows the list so far
export function listsAcross(sentences) {
  const runs = []; let run = null;
  sentences.forEach((s, i) => {
    const m = ORD_RE.exec(norm(s)), n = m && m.index < 12 ? ORD[(m[1] || m[3]).toLowerCase()] : null, text = n ? headlineCaption(s).text.replace(/^.*?#\S+:\s*/, '') : null;
    if (n && run && n === run.length + 1) run.push({ i, text });
    else if (n === 1) runs.push((run = [{ i, text }]));
    else run = null;
  });
  const out = sentences.map(() => null);
  for (const r of runs) if (r.length >= 2) r.forEach((x, k) => { out[x.i] = r.slice(0, k + 1).map((y) => y.text); out[x.i].total = r.length; }); // the card grows one item a sentence
  return out;
}
// the whole transcript: sentences with their time, headline, overlays, camera move, and the subtitle chunks
export function captionTrack(words0) {
  const words = (words0 || []).map((w) => ({ ...w, text: String(w.text ?? '').normalize('NFC') }));
  const sentences = []; let cur = [];
  words.forEach((w) => { cur.push(w); if (/[.!?।]$/.test(w.text)) { sentences.push(cur); cur = []; } }); if (cur.length) sentences.push(cur);
  const texts = sentences.map((ws) => ws.map((w) => w.text).join(' ')), lists = listsAcross(texts);
  return { sentences: sentences.map((ws, i) => ({ s: ws[0].start, e: ws.at(-1).end, text: texts[i], headline: headlineCaption(texts[i], { corpus: texts }).text, graphics: graphicsFor(texts[i], { corpus: texts, list: lists[i] }), cameraMove: cameraMoveFor(texts[i]) })), subtitles: subtitles(words) };
}
