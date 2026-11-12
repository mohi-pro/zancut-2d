// What a sentence is ABOUT, for the scene (rules and the owner's learned knowledge; no model):
//   place   — a place it names (place registry, incl. sea / mountain / desert), or a place a learned concept is bound to
//             (data/brain/learned-knowledge.json: "dolphin" → sea_beach), or the home of the animals it names (water → the sea or
//             a river, wild → the forest, desert → the dunes)
//   time    — dawn / sunset / night when the words say so (ভোর, সূর্যাস্ত, গোধূলি, রাত …)
//   things  — library pieces it names: animals and objects of the set library AND hand props (words.json aliases, learned props)
// Used by the planner (server/brainplan.mjs), the beat sync (server/beat-sync.mjs), the feeder (/admin) and the web learner.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR, DATA_DIR } from './config.mjs';
import { resolvePlace, readyPlaces } from './place-registry.mjs';
import { stems } from './entity-resolver.mjs';

const NF = (s) => String(s ?? '').normalize('NFC');
const LIB = path.join(ENGINE_DIR, 'cartoon', 'library');
const WORDS = JSON.parse(fs.readFileSync(path.join(LIB, 'words.json'), 'utf8'));
const SRC = fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'library.js'), 'utf8');
// the set library's animals and their tags (water, wild, bird, sky, field …)
export const ANIMALS = Object.fromEntries([...SRC.matchAll(/ZS\.define\("([a-zA-Z]+)", \{ about: "([^"]*)", kind: "set", tags: \[([^\]]*)\]/g)].map((m) => [m[1], { about: m[2], tags: m[3].replace(/"/g, '').split(',').map((t) => t.trim()) }]));
const PROPS = new Set(fs.readdirSync(path.join(LIB, 'props')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)));
const SETS = new Set(fs.existsSync(path.join(LIB, 'set')) ? fs.readdirSync(path.join(LIB, 'set')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)) : []);
// buildings, ground and scenery are the place's job (never "the thing a sentence is about")
const SCENERY = /front$|wave|hill|range|mountain|dune|sand|grass|water$|lake|sea[A-Z]|tower|building|house|wall|floor|road|path|bridge|field|street|shop|stall|market|school|hospital|mosque|temple|station|tree$|palm|bush|fence|pond$|river|sky|cloud|sun$|moon$|lamp|bench|table|desk|counter|chair|bed$|door|window|shelf|almirah|sofa/i;
export const kindOf = (id) => (ANIMALS[id] ? 'animal' : PROPS.has(id) ? 'prop' : SETS.has(id) ? 'thing' : 'learned');
let IDX = null, IDX_KEY = '';
function learned() {
  const f = path.join(DATA_DIR, 'brain', 'learned-knowledge.json'), g = path.join(LIB, 'learned-props.json');
  const key = [f, g].map((x) => { try { return fs.statSync(x).mtimeMs; } catch { return 0; } }).join(':');
  if (key === IDX_KEY && IDX) return IDX;
  const K = (() => { try { return JSON.parse(fs.readFileSync(f, 'utf8')).concepts || {}; } catch { return {}; } })(), P = (() => { try { return JSON.parse(fs.readFileSync(g, 'utf8')).props || {}; } catch { return {}; } })();
  const one = new Map(), many = [], placeOf = new Map(), add = (w, id) => { const t = NF(w).toLowerCase().trim(); if (!t || t.length < 2) return; if (t.includes(' ')) many.push([t, id]); else if (!one.has(t)) one.set(t, id); };
  for (const id of [...Object.keys(ANIMALS), ...PROPS, ...[...SETS].filter((x) => !SCENERY.test(x))]) for (const w of [id.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...(WORDS.aliases?.[id] || [])]) add(w, id);
  for (const [id, p] of Object.entries(P)) for (const w of [p.term, p.label, ...(p.synonyms || [])].filter(Boolean)) add(w, id);
  for (const c of Object.values(K)) { const id = c.piece || c.prop; for (const w of [c.term, c.english, ...(c.synonyms || [])].filter(Boolean)) { if (id) add(w, id); if (c.place) placeOf.set(NF(w).toLowerCase(), c.place); } }
  many.sort((a, b) => b[0].length - a[0].length);
  return (IDX = { one, many, placeOf }), (IDX_KEY = key), IDX;
}
const toks = (s) => NF(s).toLowerCase().split(/[\s,;:!?।.()"“”'‘’-]+/u).filter(Boolean);
// the things a sentence names, in the order they are said: [{ id, word, index, kind, tags }]
export function thingsIn(sentence) {
  const I = learned(), s = NF(sentence).toLowerCase(), T = toks(s), out = [], seen = new Set();
  for (const [ph, id] of I.many) { const at = s.indexOf(ph); if (at >= 0 && !seen.has(id)) { seen.add(id); out.push({ id, word: ph, index: s.slice(0, at).split(/\s+/).filter(Boolean).length }); } }
  T.forEach((tok, k) => { for (const st of /^[a-z]+$/.test(tok) ? [tok, tok.replace(/(es|s)$/, '')] : stems(tok)) { const id = I.one.get(st); if (id && !seen.has(id)) { seen.add(id); out.push({ id, word: tok, index: k }); break; } } });
  return out.sort((a, b) => a.index - b.index).map((x) => ({ ...x, kind: kindOf(x.id), tags: ANIMALS[x.id]?.tags || [] }));
}
const TIME = [['sunset', /সূর্যাস্ত|গোধূলি|বিকেলের শেষে|সন্ধ্যার আকাশ|\bsunset\b|\bdusk\b|\btwilight\b/iu], ['dawn', /ভোর|সূর্যোদয়|সূর্যোদয়|ঊষা|\bdawn\b|\bsunrise\b|\bdaybreak\b/iu], ['night', /রাত|রাতে|মধ্যরাত|অন্ধকার|জোছনা|\bnight\b|\bmidnight\b|\bdark\b/iu]];
export const timeOf = (s) => TIME.find(([, re]) => re.test(NF(s)))?.[0] || null;
// the place a thing lives in (an animal of the water stands in the sea or the river, a camel in the desert …)
export function habitatOf(things, sentence = '') {
  const s = NF(sentence).toLowerCase();
  for (const t of things) {
    const tags = t.tags || [];
    if (tags.includes('water') || /fish|dolphin|crab|whale|shark|boat|ship/i.test(t.id)) return /নদী|river|ঘাট|পুকুর|pond/iu.test(s) ? 'river_ghat' : 'sea_beach';
    if (/camel/i.test(t.id)) return 'desert_dunes';
    if (tags.includes('wild') || tags.includes('zoo')) return 'forest_path';
    if (tags.includes('field')) return 'farm_field';
  }
  return null;
}
export function sense(sentence) {
  const s = NF(sentence), things = thingsIn(s), I = learned();
  const named = resolvePlace(s), bound = toks(s).map((t) => I.placeOf.get(t)).find(Boolean) || [...I.placeOf].find(([w]) => w.includes(' ') && s.toLowerCase().includes(w))?.[1] || null;
  return { place: named || bound || null, home: habitatOf(things, s), time: timeOf(s), things, subjects: things.filter((t) => t.kind === 'animal' || t.kind === 'thing' || t.kind === 'learned') };
}
// a concept's place, from its own words and descriptions (the web learner binds it when it learns the word)
export function placeForTexts(texts) { const s = NF(texts.join(' ')).toLowerCase(); const named = resolvePlace(s); if (named) return named; if (/\b(ocean|sea|marine|coast|beach)\b|সমুদ্র|সাগর/iu.test(s)) return 'sea_beach'; if (/\b(mountain|alpine|himalaya)\b|পাহাড়|পর্বত/iu.test(s)) return 'mountain_valley'; if (/\bdesert\b|মরু/iu.test(s)) return 'desert_dunes'; if (/\b(river|freshwater|lake)\b|নদী/iu.test(s)) return 'river_ghat'; if (/\b(forest|jungle|wild)\b|বন|জঙ্গল/iu.test(s)) return 'forest_path'; return null; }
export const placeIds = () => Object.keys(readyPlaces);
