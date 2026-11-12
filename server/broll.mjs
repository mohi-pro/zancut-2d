// B-roll from a sentence, no model: a template when its words are said, else a recipe composed from the things named
// ([backdrop] + 1–3 local OpenMoji props + a motion read from the verbs), checked by physics-logic.js before it is drawn.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import '../engine/cartoon/broll-kit.js';
import { ZPHYS } from './physics.mjs';
import { DATA_DIR } from './config.mjs';

const require = createRequire(import.meta.url);
const OPENMOJI_DIR = path.join(path.dirname(require.resolve('openmoji/package.json')), 'color', 'svg');
export const TEMPLATES = globalThis.ZBROLL.TEMPLATES;
export const MODES = ['cutaway', 'pip_corner'];
// word (Bengali or English) → the OpenMoji code, and the sizes.json id that gives its real size (when the library knows it)
export const LEXICON = [
  [['ফোন', 'মোবাইল', 'phone', 'mobile'], '1F4F1', 'phone'], [['ছাতা', 'umbrella'], '2602', 'umbrella'], [['চিঠি', 'খাম', 'letter', 'envelope'], '2709', null],
  [['চাবি', 'key'], '1F511', null], [['আম', 'mango'], '1F96D', null], [['বল', 'ফুটবল', 'ball', 'football'], '26BD', null], [['উপহার', 'গিফট', 'gift', 'present'], '1F381', 'giftBox'],
  [['মাছ', 'fish'], '1F41F', null, 'pet'], [['মেঘ', 'cloud'], '2601', 'cloud'], [['গাড়ি', 'car'], '1F697', 'car'], [['বাস', 'bus'], '1F68C', 'localBus'], [['সাইকেল', 'bicycle', 'cycle'], '1F6B2', 'bicycle'],
  [['ওষুধ', 'ঔষধ', 'medicine', 'pill', 'tablet'], '1F48A', null], [['ইনজেকশন', 'syringe', 'injection'], '1F489', null], [['বই', 'book'], '1F4D5', 'book'], [['কলম', 'pen'], '1F58A', null],
  [['টাকার থলে', 'money bag'], '1F4B0', null], [['নোট', 'banknote'], '1F4B5', null], [['গাছ', 'tree'], '1F333', 'mangoTree'], [['ফুল', 'flower'], '1F33C', null], [['বাড়ি', 'ঘর', 'house', 'home'], '1F3E0', 'house'],
  [['নৌকা', 'boat'], '26F5', 'boat'], [['ভাত', 'rice'], '1F35A', null], [['ডিম', 'egg'], '1F95A', null], [['রুটি', 'bread'], '1F35E', null], [['কেক', 'cake'], '1F382', null], [['আপেল', 'apple'], '1F34E', null],
  [['কলা', 'banana'], '1F34C', null], [['ট্রেন', 'train'], '1F686', 'trainCoach'], [['বিমান', 'প্লেন', 'airplane', 'plane'], '2708', 'plane'], [['বিড়াল', 'cat'], '1F408', 'cat'], [['কুকুর', 'dog'], '1F415', 'dog'],
  [['গরু', 'cow'], '1F404', 'cow'], [['মুরগি', 'hen', 'chicken'], '1F414', null, 'pet'], [['ল্যাপটপ', 'laptop'], '1F4BB', 'laptop'], [['টিভি', 'television', 'tv'], '1F4FA', null], [['টিকেট', 'টিকিট', 'ticket'], '1F3AB', null],
  [['ব্যাগ', 'bag', 'backpack'], '1F392', null], [['চশমা', 'glasses'], '1F453', null], [['জুতা', 'shoe', 'shoes'], '1F45E', null], [['চেয়ার', 'chair'], '1FA91', 'chair'], [['খাট', 'বিছানা', 'bed'], '1F6CF', null, 'furniture'],
  [['দরজা', 'door'], '1F6AA', 'door'], [['মোমবাতি', 'candle'], '1F56F', null], [['বাল্ব', 'bulb', 'lamp'], '1F4A1', null], [['ট্রফি', 'trophy', 'cup prize'], '1F3C6', null], [['মেডেল', 'পদক', 'medal'], '1F3C5', null],
  [['ঘুড়ি', 'kite'], '1FA81', null], [['বেলুন', 'balloon'], '1F388', 'balloon'], [['সূর্য', 'sun'], '2600', 'sun'], [['চাঁদ', 'moon'], '1F319', 'moon'], [['তারা', 'star'], '2B50', 'stars'], [['পাখি', 'bird'], '1F426', null],
  [['পানি', 'জল', 'water'], '1F4A7', null], [['আগুন', 'fire'], '1F525', null], [['হাতুড়ি', 'hammer'], '1F528', null], [['ঘড়ি', 'watch'], '231A', null],
];
const MOTION_WORDS = { fall: ['পড়ে', 'পড়ল', 'পড়লো', 'ফেলে', 'fell', 'fall', 'falls', 'drop', 'dropped', 'drops'], bounce: ['লাফ', 'লাফিয়ে', 'লাফায়', 'bounce', 'bounced', 'jump', 'jumped', 'jumps'],
  slide: ['চলে', 'আসছে', 'যাচ্ছে', 'এল', 'এলো', 'গেল', 'চালায়', 'drive', 'drove', 'came', 'comes', 'arrive', 'arrived', 'went', 'goes', 'move', 'moved', 'slides', 'rolled'],
  zoom: ['বাড়ছে', 'বাড়ল', 'বড়', 'অনেক', 'grow', 'grew', 'rise', 'rose', 'increase', 'increased', 'more', 'huge'] };
const BN_SUFFIX = ['', 'ের', 'র', 'য়ের', 'য়ের', 'টা', 'টি', 'কে', 'ও', 'ই', 'তে', 'য়', 'য়', 'গুলো', 'রা', 'দের', 'টার', 'টির'];
const norm = (s) => String(s || '').normalize('NFC').toLowerCase();
const tokens = (s) => norm(s).split(/[\s,.!?।;:"'()\-–—]+/u).filter(Boolean);
function said(sentence, word) {
  const s = norm(sentence), w = norm(word);
  if (/^[a-z ]+$/.test(w)) return new RegExp(`(?:^|[^a-z])${w}(?:s|es|ed|ing)?(?=$|[^a-z])`).test(s);
  if (w.includes(' ')) return s.includes(w);
  return tokens(s).some((t) => (w.length <= 3 ? BN_SUFFIX.map((x) => x.normalize('NFC')).includes(t.startsWith(w) ? t.slice(w.length) : '\u0000') : t.startsWith(w)));
}
export function matchTemplate(sentence) {
  // A negated amount is not accumulating money. Generic word scores used to choose
  // coins for "not a single taka in the empty wallet".
  const text = norm(sentence);
  const emptyMoney = ['খালি মানিব্যাগ', 'টাকা নেই', 'টাকাও নেই', 'টাকাও অবশিষ্ট', 'empty wallet', 'no money', 'not a single coin'].map(norm).find((w) => text.includes(w));
  if (emptyMoney && !/\bnot empty\b/.test(text)) return { id: 'empty_wallet_fly', hits: [emptyMoney], score: 100 };
  let best = null;
  for (const t of Object.values(TEMPLATES)) { const hits = t.words.filter((w) => said(sentence, w)); const score = hits.reduce((n, w) => n + w.length, 0); if (hits.length && (!best || score > best.score)) best = { id: t.id, hits, score }; }
  return best;
}
const knowFile = () => path.join(DATA_DIR, 'brain', 'learned-knowledge.json');
const learnedThings = () => { try { const k = JSON.parse(fs.readFileSync(knowFile(), 'utf8')).concepts || {}; return Object.values(k).filter((c) => c.prop); } catch { return []; } };
export function thingsNamed(sentence) {
  const out = [];
  for (const c of learnedThings()) { const w = [c.term, c.english, ...(c.synonyms || [])].filter(Boolean).find((x) => said(sentence, x)); if (w && !out.some((o) => o.piece === c.prop)) out.push({ label: c.english || c.term, said: w, piece: c.prop, sizeId: c.prop, learned: true }); }
  for (const [words, hex, sizeId, cls] of LEXICON) { const w = words.find((x) => said(sentence, x)); if (w && !out.some((o) => o.hex === hex)) out.push({ label: /^[a-z ]+$/.test(w) ? w : words.find((x) => /^[a-z ]+$/.test(x)) || w, said: w, hex, sizeId, cls }); }
  return out.slice(0, 3);
}
export function motionOf(sentence) { for (const [m, words] of Object.entries(MOTION_WORDS)) if (words.some((w) => said(sentence, w))) return m; return 'pan'; }
// a recipe for a sentence's things; the backdrop follows what they are (a sky for big outdoor things, a table for hand-sized ones)
export function composeRecipe(sentence) {
  const things = thingsNamed(sentence); if (!things.length) return null;
  const props = things.map((t) => ({ label: t.label, ...(t.piece ? { piece: t.piece } : { asset: `openmoji:${t.hex}` }), ...(t.sizeId ? { sizeId: t.sizeId } : {}), ...(t.cls ? { cls: t.cls } : {}) }));
  const night = ['রাত', 'night'].some((w) => said(sentence, w));
  const skyish = props.some((p) => (p.sizeId && ZPHYS.zoneOf(p.sizeId) === ZPHYS.ZONES.SKY_FLOATING) || /\b(kite|bird|cloud|sun|moon|star|plane|airplane|balloon)\b/.test(p.label));
  const small = props.every((p) => ZPHYS.classOf(p.sizeId, undefined, p.cls || (p.sizeId ? undefined : 'hand_prop')) === 'hand_prop');
  return { backdrop: night ? 'night' : skyish || !small ? 'sky' : 'table', props, motion: motionOf(sentence) };
}
// sentence → { template } | { recipe } | null ; mode: "cutaway" (full frame 1.5–3 s) or "pip_corner"
export function brollFor(sentence, { mode = 'pip_corner', recipes = true } = {}) {
  // a template, unless the sentence makes a named thing fall or bounce (that motion is the point: compose it)
  const t = matchTemplate(sentence), physical = ['fall', 'bounce'].includes(motionOf(sentence)) && thingsNamed(sentence).length;
  if (t && !physical) return { mode, template: t.id, why: `said: ${t.hits.join(', ')}` };
  if (!recipes) return null;
  const recipe = composeRecipe(sentence); if (!recipe) return null;
  const v = ZPHYS.validateRecipe(recipe); if (!v.recipe.props.length) return null;
  return { mode, recipe: v.recipe, why: `named: ${v.recipe.props.map((p) => p.label).join(', ')}`, fixes: v.fixes };
}
// film.json b-roll → what the scene script draws: the template, or the checked recipe with its local SVG inlined
export function resolveBroll(broll) {
  if (!broll) return null;
  const mode = MODES.includes(broll.mode) ? broll.mode : 'cutaway', base = { mode, corner: broll.corner || 'tr', seconds: broll.seconds, ...(Number.isFinite(+broll.top) && broll.top != null ? { top: Math.max(0, Math.min(0.6, +broll.top)) } : {}) };
  if (broll.template) { if (!TEMPLATES[broll.template]) throw new Error(`b-roll template "${broll.template}" is not in the kit (${Object.keys(TEMPLATES).length} templates)`); return { ...base, spec: { template: broll.template }, fixes: [] }; }
  if (!broll.recipe) throw new Error('a b-roll needs a template or a recipe');
  const v = ZPHYS.validateRecipe(broll.recipe);
  if (!v.recipe.props.length) throw new Error(`b-roll recipe has nothing left to show: ${v.fixes.map((f) => f.evidence).join('; ')}`);
  const props = v.recipe.props.map((p) => {
    const m = /^openmoji:([0-9A-F]+(?:-[0-9A-F]+)*)$/.exec(p.asset || '');
    if (!m) return p;
    const file = path.join(OPENMOJI_DIR, `${m[1]}.svg`); if (!fs.existsSync(file)) throw new Error(`OpenMoji ${m[1]} is not in the local package`);
    return { ...p, svg: fs.readFileSync(file, 'utf8').replace(/<script[\s\S]*?<\/script>/gi, '') };
  });
  return { ...base, spec: { recipe: { ...v.recipe, props } }, fixes: v.fixes };
}
export const openmojiSvg = (hex) => { if (!/^[0-9A-F]+(?:-[0-9A-F]+)*$/.test(hex)) throw new Error('bad OpenMoji code'); return fs.readFileSync(path.join(OPENMOJI_DIR, `${hex}.svg`), 'utf8').replace(/<script[\s\S]*?<\/script>/gi, ''); };
export const openmojiExists = (hex) => fs.existsSync(path.join(OPENMOJI_DIR, `${hex}.svg`));
