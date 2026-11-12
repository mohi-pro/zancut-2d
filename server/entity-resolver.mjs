// Bengali & English names, pronouns and concepts in a story, by rules and local data only (no model).
//   findNames(sentence)   → names said in it: the name list (engine/cartoon/library/names.json, Bengali suffixes stripped: রাফিকে,
//                           মিনার, রাফিরা, মিনাদের) or a new name standing as the subject of a person verb ("তানজিম বলল")
//   resolveStory(sents)   → characters (one stable look each, people.js spec), who each sentence is about, pronouns resolved
//                           (সে / তার / তাকে / তিনি → the active character, তারা / তাদের → the active group; he / she by gender)
//   concepts(text)        → #CONCEPT_… tokens from engine/cartoon/library/semantic-clusters.json (Bengali words and idioms, English)
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';

const NF = (s) => String(s ?? '').normalize('NFC');
const LIB = path.join(ENGINE_DIR, 'cartoon', 'library');
const NAMES = JSON.parse(fs.readFileSync(path.join(LIB, 'names.json'), 'utf8')).names;
const CLUSTERS = JSON.parse(fs.readFileSync(path.join(LIB, 'semantic-clusters.json'), 'utf8')).clusters.map((c) => ({ ...c, bn: c.bn.map(NF), all: [...c.bn.map(NF), ...c.en, ...(c.wordnet || [])] }));
const BY_FORM = new Map(); for (const n of NAMES) { if (n.bn) BY_FORM.set(NF(n.bn), n); BY_FORM.set(n.en.toLowerCase(), n); }
export const nameCount = () => ({ entries: NAMES.length, forms: BY_FORM.size });

// Bengali case and number endings, longest first: রাফিদের → রাফি, মিনাকে → মিনা, করিমের → করিম, সাকিবরা → সাকিব
const SUFFIXES = ['দেরকে', 'গুলোকে', 'দেরও', 'দেরই', 'কেও', 'কেই', 'দের', 'রাও', 'রাই', 'টাকে', 'টিকে', 'য়ের', 'এর', 'ের', 'কে', 'রা', 'টা', 'টি', 'ও', 'ই', 'র', 'য়', 'তে', 'ে'].map(NF); // … and the bare locative: বাজারে → বাজার
export function stems(token) {
  const t = NF(token).replace(/[^\p{L}\p{M}]/gu, ''), out = [t];
  for (const s of SUFFIXES) if (t.length > s.length + 1 && t.endsWith(s)) out.push(t.slice(0, -s.length));
  return [...new Set(out)];
}
const PERSON_SUFFIX = ['কে', 'দের', 'রা', 'দেরকে', 'কেও', 'কেই'].map(NF);
// verbs whose subject is a person: a name stands right before them
const PERSON_VERBS = ['বলল', 'বললো', 'বলেছিল', 'বলে উঠল', 'দেখল', 'দেখলো', 'ভাবল', 'ভাবলো', 'ভাবছে', 'শুনল', 'হাসল', 'হাসলো', 'কাঁদল', 'কাঁদছে', 'চিৎকার', 'জিজ্ঞেস', 'ডাকল', 'উত্তর', 'বুঝল', 'চাইল', 'গেল', 'এল', 'এলো', 'ফিরল', 'খেল', 'ঘুমাল', 'দৌড়াল', 'লিখল', 'পড়ল', 'হাঁটছে', 'বসল', 'দাঁড়াল', 'কিনল', 'পেল', 'জানাল', 'জানালো']
  .map(NF);
// Bengali puts the object before the verb ("আম কিনল", "স্কুলে গেল"): a NEW name is only taken from a speech or feeling verb, whose
// first word is its subject ("তানজিম বলল"), and never from a word with a case or place ending
const NEW_NAME_VERBS = ['বলল', 'বললো', 'বলে উঠল', 'বলেছিল', 'জিজ্ঞেস', 'চিৎকার', 'ডাকল', 'উত্তর', 'জানাল', 'জানালো', 'হাসল', 'হাসলো', 'কাঁদল', 'কাঁদছে', 'ভাবল', 'ভাবলো', 'ভাবছে'].map(NF);
// a subject may follow a participle clause or a linking word: "বাজারে গিয়ে নাবিলা বলল", "তারপর জিসান বলল"
const LEADS = new Set(['গিয়ে', 'এসে', 'দেখে', 'শুনে', 'হেসে', 'বসে', 'ফিরে', 'উঠে', 'পরে', 'তখন', 'হঠাৎ', 'তারপর', 'আর', 'এবং', 'কিন্তু', 'then', 'and', 'but'].map(NF));
const CASE_END = ['ে', 'তে', 'কে', 'র', 'এর', 'য়', 'রা', 'দের'].map(NF), EN_VERBS = /^(said|says|asked|asks|thought|thinks|replied|shouted|cried|laughed|smiled|looked|saw|went|came|ran|walked|wanted|told|answered)$/i;
const PRON_ONE = ['সে', 'তার', 'তাকে', 'ও', 'ওর', 'ওকে', 'তিনি', 'তাঁর', 'তাঁকে', 'উনি', 'ওনার', 'ওনাকে', 'তারই', 'তাকেও'].map(NF), PRON_MANY = ['তারা', 'তাদের', 'তাদেরকে', 'ওরা', 'ওদের', 'তাঁরা', 'তাঁদের'].map(NF);
const EN_ONE = { he: 'male', him: 'male', his: 'male', himself: 'male', she: 'female', her: 'female', hers: 'female', herself: 'female' }, EN_MANY = new Set(['they', 'them', 'their', 'theirs', 'themselves']);
// words that are never a new name, even before a person verb (pronouns, kin, roles, common nouns of the concept clusters)
const ROLE_WORDS = ['মা', 'বাবা', 'ভাই', 'বোন', 'দাদা', 'দাদি', 'নানা', 'নানি', 'চাচা', 'চাচি', 'খালা', 'মামা', 'ফুফু', 'স্যার', 'শিক্ষক', 'ডাক্তার', 'লোক', 'লোকটা', 'লোকটি', 'মেয়ে', 'মেয়েটা', 'মেয়েটি', 'ছেলে', 'ছেলেটা', 'ছেলেটি', 'সবাই', 'কেউ', 'বন্ধু', 'বন্ধুরা', 'আমি', 'আমরা', 'তুমি', 'তোমরা', 'আপনি', 'পুলিশ', 'দোকানদার', 'কৃষক', 'বুড়ো', 'বৃদ্ধ'].map(NF);
const WORDS = JSON.parse(fs.readFileSync(path.join(LIB, 'words.json'), 'utf8')), PIECE_WORDS = [...Object.values(WORDS.aliases || {}).flat(), ...Object.keys(WORDS.words || {})].map(NF).filter((w) => /[\u0980-\u09FF]/.test(w) && !w.includes(' '));
// creatures the procedural creator draws ("রাক্ষস বলল" is the monster speaking, not a person called Rakshs)
const CREATURES = ['রাক্ষস', 'রাক্ষসটা', 'রাক্ষসটি', 'দৈত্য', 'দৈত্যটা', 'দানব', 'ড্রাগন', 'রোবট', 'রোবটটা', 'বামন', 'ভূত', 'ভূতটা', 'পেত্নী', 'পরী', 'জিন', 'এলিয়েন'].map(NF);
const NOT_NAME = new Set([...PRON_ONE, ...PRON_MANY, ...ROLE_WORDS, ...PIECE_WORDS, ...CREATURES, ...CLUSTERS.flatMap((c) => c.bn.filter((w) => !w.includes(' ')))]);
const tokensOf = (s) => NF(s).split(/[\s,.!?।;:"'“”‘’()\-–—]+/u).filter(Boolean);

export function findNames(sentence, { known = new Set() } = {}) {
  const toks = tokensOf(sentence), out = [];
  toks.forEach((tok, i) => {
    const next = toks[i + 1] || '', verbNext = PERSON_VERBS.some((v) => next.startsWith(v)) || EN_VERBS.test(next), speechNext = NEW_NAME_VERBS.some((v) => next.startsWith(v)) || EN_VERBS.test(next);
    let hit = null, form = null;
    for (const st of stems(tok)) { const n = BY_FORM.get(st) || BY_FORM.get(st.toLowerCase()); if (n) { hit = n; form = st; break; } }
    if (/^[A-Za-z]/.test(tok) && hit && !/^[A-Z]/.test(tok)) hit = null; // an English name is written with a capital
    if (hit) {
      const suffixed = PERSON_SUFFIX.some((s) => NF(tok).endsWith(s) && NF(tok) !== form);
      if (hit.ambiguous && !(verbNext || suffixed || known.has(hit.en))) return; // আকাশ is the sky unless someone acts or is acted on
      out.push({ id: hit.en, name: hit.bn || cap(hit.en), gender: hit.gender, form: tok, index: i, via: 'names' });
      return;
    }
    // a new name: the subject of a person verb, not a pronoun, role or common word
    const prev = toks[i - 1] || '', clauseStart = i === 0 || LEADS.has(NF(prev)) || NF(prev).endsWith(NF('য়ে')) || NF(prev).endsWith(NF('িয়ে'));
    if (speechNext && clauseStart && !CASE_END.some((e) => NF(tok).endsWith(e)) && !NOT_NAME.has(stems(tok).at(-1)) && !NOT_NAME.has(NF(tok)) && /[\p{L}]/u.test(tok) && (!/^[A-Za-z]/.test(tok) || /^[A-Z][a-z]{2,}$/.test(tok)) && !['The', 'He', 'She', 'They', 'It', 'We', 'I', 'You'].includes(tok)) {
      const base = stems(tok).at(-1); out.push({ id: slug(base), name: base, gender: 'unknown', form: tok, index: i, via: 'verb-subject' });
    }
  });
  return out.filter((m, k) => out.findIndex((x) => x.id === m.id) === k);
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
// a cast id in Latin letters (filmFromPlan keeps [a-z0-9_]): a Bengali name not in the list is transliterated letter by letter
const TR = { অ: 'o', আ: 'a', ই: 'i', ঈ: 'i', উ: 'u', ঊ: 'u', ঋ: 'ri', এ: 'e', ঐ: 'oi', ও: 'o', ঔ: 'ou', ক: 'k', খ: 'kh', গ: 'g', ঘ: 'gh', ঙ: 'ng', চ: 'ch', ছ: 'chh', জ: 'j', ঝ: 'jh', ঞ: 'n', ট: 't', ঠ: 'th', ড: 'd', ঢ: 'dh', ণ: 'n', ত: 't', থ: 'th', দ: 'd', ধ: 'dh', ন: 'n', প: 'p', ফ: 'f', ব: 'b', ভ: 'bh', ম: 'm', য: 'j', র: 'r', ল: 'l', শ: 'sh', ষ: 'sh', স: 's', হ: 'h', ড়: 'r', ঢ়: 'rh', য়: 'y', ৎ: 't', 'া': 'a', 'ি': 'i', 'ী': 'i', 'ু': 'u', 'ূ': 'u', 'ৃ': 'ri', 'ে': 'e', 'ৈ': 'oi', 'ো': 'o', 'ৌ': 'ou', 'ং': 'ng', 'ঁ': '', '্': '', '়': '' };
export const slug = (s) => (/^[A-Za-z]/.test(s) ? s.toLowerCase() : [...NF(s).normalize('NFD').normalize('NFC')].map((c) => TR[c] ?? '').join('')).replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'person';

// one look per name, always the same (a seeded choice), so a character is recognisable in every shot
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const OUTFIT_COLORS = ['#4a78a6', '#e0862b', '#5a9a5a', '#a06ac0', '#c05050', '#2f8f8f', '#d4577a', '#7a5a3a'];
export function castSpec(id, gender = 'unknown', { age = 'adult' } = {}) {
  const h = hash(id), g = gender === 'unknown' ? (h % 2 ? 'female' : 'male') : gender, pick = (list, k) => list[(h >>> k) % list.length];
  const hair = g === 'female' ? { style: pick(['long', 'bun', 'bob', 'hijab'], 3), color: pick(['black', 'dark', 'brown'], 7) } : { style: pick(['crop', 'side', 'crop', 'cap'], 3), color: pick(['black', 'dark'], 7) };
  const outfit = g === 'female' ? { type: pick(['salwar', 'saree', 'salwar', 'abaya'], 11), color: pick(OUTFIT_COLORS, 13) } : { type: pick(['shirt', 'punjabi', 'tshirt', 'shirt'], 11), color: pick(OUTFIT_COLORS, 13) };
  return { gender: g, age, skin: 2 + ((h >>> 17) % 4), hair, outfit };
}

// the whole story: names first (a name said clearly anywhere lets its everyday-word spelling count elsewhere), then pronouns
export function resolveStory(sentences) {
  const clear = new Set(); for (const s of sentences) for (const m of findNames(s)) clear.add(m.id);
  const chars = new Map(), out = []; let active = [], prevSubject = null;
  sentences.forEach((s, i) => {
    const ms = findNames(s, { known: clear }), toks = tokensOf(s), who = [], via = {};
    for (const m of ms) { if (!chars.has(m.id)) chars.set(m.id, { id: m.id, name: m.name, gender: m.gender, spec: castSpec(m.id, m.gender), mentions: [] }); chars.get(m.id).mentions.push(i); who.push(m.id); via[m.id] = m.via; }
    // pronouns: a singular one is the active character (the last sentence's subject first; he/she must match gender);
    // a plural one is the active group
    toks.forEach((t, ti) => {
      const lt = t.toLowerCase();
      if (PRON_ONE.includes(NF(t)) || EN_ONE[lt]) {
        // after a named subject in the same sentence ("মিনা বলল, তার খিদে পেয়েছে") the pronoun is that subject; else the last one
        const own = ms.find((m) => m.index < ti), g = EN_ONE[lt], cands = [own && !EN_ONE[lt] ? own.id : null, prevSubject, ...active].filter(Boolean).filter((id) => !g || chars.get(id)?.gender === g || chars.get(id)?.gender === 'unknown');
        const id = cands[0]; if (id && !who.includes(id)) { who.push(id); via[id] = `pronoun:${t}`; }
      } else if (PRON_MANY.includes(NF(t)) || EN_MANY.has(lt)) {
        for (const id of active.slice(0, 4)) if (!who.includes(id)) { who.push(id); via[id] = `pronoun:${t}`; }
      }
    });
    if (who.length) { prevSubject = who[0]; active = [...who, ...active.filter((id) => !who.includes(id))].slice(0, 6); }
    out.push({ text: s, who, via, concepts: concepts(s).map((c) => c.id) });
  });
  return { characters: [...chars.values()], sentences: out };
}

// concept tokens: Bengali words and idioms (a word may carry a case ending: টাকার, বৃষ্টিতে), English words by word boundary
const hasTerm = (text, term) => {
  if (/^[\x00-\x7f]+$/.test(term)) return new RegExp(`(?:^|[^a-z])${term.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:s|es|d|ed|ing)?(?=$|[^a-z])`).test(text.toLowerCase()); // save → saved, saves, saving
  if (term.includes(' ')) return NF(text).includes(term);
  return tokensOf(text).some((t) => stems(t).includes(term));
};
export function concepts(text) {
  const out = [];
  for (const c of CLUSTERS) { const hits = c.all.filter((w) => hasTerm(text, w)); if (hits.length) out.push({ id: c.id, hits, score: hits.reduce((n, w) => n + w.length, 0), broll: c.broll || null, emotion: c.emotion || null, face: c.face || null, category: c.category || null }); }
  return out.sort((a, b) => b.score - a.score);
}
// every single word inside a concept idiom is a known word (দাম in "দাম বাড়া")
export const conceptWords = new Set(CLUSTERS.flatMap((c) => c.bn.flatMap((t) => t.split(/\s+/))));
export const conceptIds = () => CLUSTERS.map((c) => c.id);
export const clusterOf = (id) => CLUSTERS.find((c) => c.id === id) || null;
