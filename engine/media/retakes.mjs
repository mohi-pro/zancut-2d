// Retake / blooper finder: pure code, no AI. Reads the word list of the raw transcript and marks what is very likely a
// retake, a false start, a stutter or a "sorry, again" moment. The editor (AI) only confirms; high-confidence finds are
// pre-filled into work/cuts.json so a lighter model gets them right too.
//
//   findRetakes(words) -> [{ remove: [a, b], keep: [c, d] | null, kind, confidence: "high"|"medium"|"low", why }]
//   words: [{ i, text, start, end, filler? }]   (i = word number in the raw transcript)

// Words a speaker says when they mess up and go again (English, Bangla, Hindi; checked after normalising).
const CUE_PHRASES = [
  "sorry", "wait", "hold on", "let me redo", "let me start again", "let me say that again", "start again", "one more time",
  "take two", "cut that", "cut this", "again", "no no", "oops", "scratch that", "let me try again",
  "সরি", "স্যরি", "দাঁড়াও", "দাঁড়ান", "আবার", "আবার বলি", "আবার বলছি", "না না", "ভুল হয়ে গেছে", "ভুল হইছে", "এক সেকেন্ড", "কাট", "রিটেক",
  "माफ़ करना", "सॉरी", "रुको", "फिर से", "दोबारा", "नहीं नहीं",
].map((p) => p.split(" "));

// Normal repeats that are not mistakes ("very very", "বার বার", "ধীরে ধীরে", and Bangla's "which ones" doubling: "কোন কোন", "কী কী")
const OK_DOUBLES = new Set(["very", "so", "bye", "no", "yes", "ha", "বার", "ধীরে", "আস্তে", "কাছে", "মাঝে", "হ্যাঁ", "না", "জলদি", "बार", "धीरे",
  "কোন", "কোনো", "কী", "কি", "কে", "কারা", "কত", "কোথায়", "যে", "যা", "যার", "যত", "সব", "দিনে", "ঘরে", "পাশে", "क्या", "कौन", "कहाँ"]);
// Words that join items of a list or two parallel clauses: a phrase said again after one of them is the next item, not a retake
// or begin a new clause ("…does not come, in that case the child's teeth not coming…"): the phrase coming back is a new sentence
const LIST_JOIN = new Set(["বা", "অথবা", "কিংবা", "এবং", "ও", "আর", "নাকি", "তারপর", "or", "and", "then", "nor", "या", "और", "फिर",
  "সেক্ষেত্রে", "তাহলে", "তখন", "কারণ", "কিন্তু", "যদি", "যেহেতু", "so", "because", "but", "if", "when", "तो", "क्योंकि", "लेकिन"]);
const DIGITS = /[0-9০-৯०-९]/;
// Bangla doubles words on purpose all the time ("ধাপে ধাপে", "নিজে নিজে", "আস্তে আস্তে"): a doubled Bangla word is a stutter only
// when it is one of the short words a speaker trips on
const BN = /[\u0980-\u09ff]/, BN_STUTTER = new Set(["আমি", "আমরা", "তুমি", "আপনি", "আপনারা", "এটা", "ওটা", "সেটা", "এই", "ওই", "সে", "তো", "মানে", "এখন", "তাহলে", "কিন্তু", "এবং", "আর", "তারপর", "আমার", "আপনার"]);

export const norm = (t) => String(t).toLowerCase().normalize("NFC").replace(/[\p{P}\p{S}]/gu, "").trim();

export function findRetakes(words, opt = {}) {
  const W = words.filter((w) => !w.filler);
  const N = W.map((w) => norm(w.text));
  const out = [];
  const taken = new Set();
  const add = (r) => {
    for (let k = r.remove[0]; k <= r.remove[1]; k++) if (taken.has(k)) return;
    for (let k = r.remove[0]; k <= r.remove[1]; k++) taken.add(k);
    out.push(r);
  };
  const span = (a, b) => W.slice(a, b + 1).map((w) => w.text).join(" ");
  const maxLook = opt.maxLook ?? 30;   // words after a start we look for a restart
  const maxGapSec = opt.maxGapSec ?? 20;

  // 1. Cue phrases: "…the first tip is— sorry, the first tip is…" → remove from the start of the broken attempt to the cue.
  for (let k = 0; k < W.length; k++) {
    for (const cue of CUE_PHRASES) {
      if (cue.every((c, j) => N[k + j] === c)) {
        const cueEnd = k + cue.length - 1;
        // "again" alone is common speech; only a cue when a restart follows
        const weak = cue.length === 1 && ["again", "আবার", "wait"].includes(cue[0]);
        // find the start of the broken attempt: back to the previous sentence end / long pause, at most 15 words
        let a = k;
        while (a > 0 && k - a < 15 && !/[.!?।]$/.test(W[a - 1].text) && W[a].start - W[a - 1].end < 0.9) a--;
        // does what follows restart what came before? (same first word or two)
        const restart = a < k && N[a] && N.slice(cueEnd + 1, cueEnd + 6).includes(N[a]);
        if (weak && !restart) continue;
        add({ remove: [W[a].i, W[cueEnd].i], keep: restart ? [W[cueEnd + 1].i, W[Math.min(W.length - 1, cueEnd + 6)].i] : null, kind: "cue",
          confidence: restart || cue.length > 1 ? "high" : "medium", why: `"${span(k, cueEnd)}" — ${restart ? "then said again" : "speaker flagged a mistake"}: ${span(a, cueEnd)}` });
        k = cueEnd;
        break;
      }
    }
  }

  // 2. Restarts: the same 2+ words begin again shortly after → the earlier, broken try goes.
  for (let a = 0; a < W.length - 2; a++) {
    if (taken.has(a) || !N[a]) continue;
    for (let m = a + 2; m < Math.min(W.length - 1, a + maxLook); m++) {
      if (W[m].start - W[a].start > maxGapSec) break;
      let len = 0;
      while (m + len < W.length && a + len < m && N[a + len] && N[a + len] === N[m + len]) len++;
      if (len < 2) continue;
      const tryLen = m - a;                       // words in the first attempt
      const firstEndsSentence = /[.!?।]$/.test(W[m - 1].text);
      const pause = W[m].start - W[m - 1].end;
      // Complete sentences inside the first try = the speaker went on and came back to the idea: not a retake
      if (tryLen > 6 && W.slice(a, m - 1).some((w) => /[.!?।]$/.test(w.text))) continue;
      // A list or parallel clauses ("at 6 months it does not come, or at 12 months it does not come"): the first try said the
      // whole phrase and went on through a joining word, or named a new number: each repeat is the next item, never a retake
      const after = N.slice(a + len, m);
      if (tryLen > len && (after.some((x) => LIST_JOIN.has(x)) || W.slice(a + len, m).some((w) => DIGITS.test(w.text)))) continue;
      // the phrase finished a sentence the first time ("…কাজ করে।"): coming back to it later is not a broken try
      if (/[.!?।]$/.test(W[a + len - 1].text)) continue;
      // A full sentence repeated later = "same point twice", not a retake (low; editor decides)
      const conf = len >= 3 && (!firstEndsSentence || tryLen <= 6) ? "high"
        : len >= 2 && tryLen <= 8 && (pause > 0.35 || !firstEndsSentence) ? "medium" : "low";
      if (conf === "low" && tryLen > 14) continue;
      add({ remove: [W[a].i, W[m - 1].i], keep: [W[m].i, W[m + len - 1].i], kind: "restart", confidence: conf,
        why: `started "${span(a, a + len - 1)}" twice; first try: ${span(a, m - 1)}` });
      break;
    }
  }

  // 3. Stutters: the same word twice in a row ("I I think", "আমি আমি") → drop the first.
  for (let k = 0; k < W.length - 1; k++) {
    if (taken.has(k) || taken.has(k + 1)) continue;
    if (N[k] && N[k] === N[k + 1] && !OK_DOUBLES.has(N[k]) && (!BN.test(N[k]) || BN_STUTTER.has(N[k])) && W[k + 1].start - W[k].end < 1.0)
      add({ remove: [W[k].i, W[k].i], keep: [W[k + 1].i, W[k + 1].i], kind: "stutter", confidence: N[k].length <= 4 ? "high" : "medium", why: `"${W[k].text} ${W[k + 1].text}"` });
  }

  // 4. Cut-off word pieces: a very short word right before a word it is the start of ("pro- productivity")
  for (let k = 0; k < W.length - 1; k++) {
    if (taken.has(k)) continue;
    if (N[k].length >= 1 && N[k].length <= 4 && N[k + 1].length > N[k].length + 2 && N[k + 1].startsWith(N[k]) && W[k + 1].start - W[k].end < 0.8)
      add({ remove: [W[k].i, W[k].i], keep: [W[k + 1].i, W[k + 1].i], kind: "fragment", confidence: "medium", why: `"${W[k].text}" then "${W[k + 1].text}"` });
  }
  return out.sort((x, y) => x.remove[0] - y.remove[0]);
}

// Merge overlapping / touching ranges into removeWords format [[a, b], ...]
export function toRanges(list) {
  const r = list.map((x) => [...x.remove]).sort((a, b) => a[0] - b[0]);
  const m = [];
  for (const x of r) { const last = m[m.length - 1]; if (last && x[0] <= last[1] + 1) last[1] = Math.max(last[1], x[1]); else m.push(x); }
  return m;
}
