// A bounded compositional grammar, not a language model. Bengali and English describe the same reusable vector DNA.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { DATA_DIR } from './config.mjs';
import { analyzeText } from './power-libraries.mjs';
import '../engine/cartoon/creation-dna.js';
export const validateDNA = globalThis.ZDNA.validate;
const COLORS = [
  ['#367fe0',['নীল','blue']], ['#de4941',['লাল','red']], ['#242b39',['কালো','black']], ['#e7bc4d',['সোনালী','সোনালি','golden','gold']],
  ['#4eaa68',['সবুজ','green']], ['#f3f1e9',['সাদা','white']], ['#a275d4',['বেগুনি','purple']], ['#efab3d',['হলুদ','yellow']], ['#e88836',['কমলা','orange']],
];
const BASES = [
  ['warrior',['যোদ্ধা','সৈনিক','warrior','soldier','knight']], ['king',['রাজা','রানী','রাণী','king','queen','emperor']],
  ['horse',['ঘোড়া','ঘোড়া','horse','pegasus']], ['tiger',['বাঘ','tiger']], ['dog',['কুকুর','dog','puppy']], ['cat',['বিড়াল','বিড়াল','cat','kitten']],
  ['cow',['গরু','গাভী','cow','bull']], ['fish',['মাছ','fish']], ['bird',['পাখি','পাখী','টিয়া','bird','parrot','crow']],
  ['dragon',['ড্রাগন','dragon']], ['ghost',['ভূত','পেত্নী','প্রেত','ghost','spirit']], ['monster',['রাক্ষস','দৈত্য','দানব','জন্তু','monster','giant','demon','creature']],
  ['robot',['রোবট','robot']], ['human',['মানুষ','লোক','বামন','পিচ্চি','ছেলে','মেয়ে','মেয়ে','মহিলা','বুড়ো','বুড়ি','human','person','dwarf','child','boy','girl','man','woman']],
  ['sword',['তলোয়ার','তলোয়ার','তরবারি','sword','blade']], ['car',['গাড়ি','গাড়ি','car','vehicle']], ['shield',['ঢাল','shield']],
  ['umbrella',['ছাতা','umbrella']], ['stick',['লাঠি','stick','staff','cane']], ['book',['বই','book']], ['lantern',['হারিকেন','লণ্ঠন','লন্ঠন','প্রদীপ','lantern','lamp']],
  ['boat',['নৌকা','boat']], ['tree',['গাছ','tree']], ['house',['কুঁড়েঘর','বাড়ি','বাড়ি','house','hut']],
];
// Words that contain a noun but mean something else (রাজাকার is not a king, কাকা is an uncle, মাছি is a fly, অদ্ভুত is "strange").
const FALSE_FRIENDS = ['রাজাকার','অদ্ভুত','অদ্ভূত','মাছি','কাকা','বইছে','গাছা'];
const NUMBER = { এক:1,দুই:2,দু:2,তিন:3,চার:4,পাঁচ:5,পাচ:5,ছয়:6,ছয়:6,সাত:7,আট:8,নয়:9,নয়:9,দশ:10,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10 };
const numberOf = s => { const v = String(s).replace(/[০-৯]/g, d => String(d.charCodeAt(0) - 0x09e6)); return /^\d+$/.test(v) ? Number(v) : NUMBER[v]; };
const NUM = '(?:[0-9০-৯]+|' + Object.keys(NUMBER).sort((a,b)=>b.length-a.length).join('|') + ')';
const wordHit = (s, w) => /^[a-z ]+$/.test(w) ? new RegExp('(?:^|[^a-z])'+w+'(?:s|es)?(?=$|[^a-z])','i').test(s) : s.includes(w.normalize('NFC'));
const has = (s, words) => words.some(w => wordHit(s,w));
const lastAt = (s, w) => { if (!/^[a-z ]+$/.test(w)) return s.lastIndexOf(w.normalize('NFC')); let at = -1; for (const m of s.matchAll(new RegExp('(?:^|[^a-z])('+w+')(?:s|es)?(?=$|[^a-z])','gi'))) at = m.index + m[0].indexOf(m[1]); return at; };
const unfriend = s => FALSE_FRIENDS.reduce((x, w) => x.split(w.normalize('NFC')).join(' '.repeat(w.normalize('NFC').length)), s);
// The head noun is the last body/prop noun in the phrase ("giant tiger", "বিশাল বাঘ", "three-headed blue monster").
const archetypeOf = raw => { const s = unfriend(raw); let best = null, at = -1; for (const [a, words] of BASES) for (const w of words) { const i = lastAt(s, w); if (i > at) { at = i; best = a; } } return best; };
const kindOf = a => globalThis.ZDNA.kindOf(a), humanoid = a => globalThis.ZDNA.isHumanoid(a);
const BODY_HINT = 'Try a monster, ghost, warrior, king, person, robot, dragon, horse, tiger, dog, cat, cow, fish, bird, sword, shield, car, umbrella, stick, book, lantern, boat, tree or house.';
function countOf(s, part, fallback) {
  const names = part === 'head' ? '(?:মাথা(?:র|ওয়ালা|ওয়ালা)?|heads?|headed)' : '(?:হাত(?:ের|ওয়ালা|ওয়ালা)?|arms?|armed)';
  const m = new RegExp('('+NUM+')\\s*(?:টি\\s*)?'+names,'iu').exec(s);
  if (!m) return fallback;
  const n = numberOf(m[1]), max = part === 'head' ? 6 : 8;
  if (!(n >= (part === 'head' ? 1 : 0) && n <= max)) throw new Error(`${part} count is outside the supported 1–${max} range.`);
  return n;
}
function cleanPhrase(phrase) {
  if (typeof phrase !== 'string' || !phrase.trim() || phrase.length > 500) throw new Error('Describe one creation in 1–500 characters.');
  return phrase.normalize('NFC').toLowerCase().replace(/[‐‑–—-]/g,' ').replace(/\s+/g,' ').trim();
}
function splitHeld(s) {
  const bn = /^(.*?)\s+হাতে\s+(.+)$/u.exec(s);
  if (bn) {
    const a = archetypeOf(bn[1]), b = archetypeOf(bn[2]);
    if (a && b && kindOf(a) === 'prop' && humanoid(b)) return [bn[2],bn[1]];
    if (a && b && humanoid(a) && kindOf(b) === 'prop') return [bn[1],bn[2]];
  }
  const en = /^(.*?)\s+(?:holding|carrying|with)\s+(?:an?\s+)?(.+)$/.exec(s);
  if (en && archetypeOf(en[1]) && humanoid(archetypeOf(en[1])) && kindOf(archetypeOf(en[2])) === 'prop') return [en[1],en[2]];
  return [s,null];
}
const DEFAULTS = {
  car:['#bd5146','#283347','#f3ce76'], sword:['#bac9da','#705348','#edc66b'], shield:['#bac9da','#705348','#edc66b'], horse:['#ba9274','#5b4033','#edd6b2'],
  king:['#7a3fa0','#3a2d4a','#f0c040'], ghost:['#eef2f7','#b9c3d1','#7fd3ff'], tiger:['#e88a2e','#2b2522','#fff1dc'], dog:['#b98b5e','#5b4033','#f3e3cc'],
  cat:['#9a9aa3','#4a4a52','#f3d27a'], cow:['#f1ece2','#3b3330','#e8a7a0'], fish:['#3fa0c8','#1f5f7a','#ffd36b'], bird:['#d9534f','#5b3b2e','#f2b13c'],
  umbrella:['#2f5fa8','#3b2f2a','#d8dde6'], stick:['#8a5a32','#5b3b22','#c9a277'], book:['#a33b3b','#f3ead7','#e0b84a'], lantern:['#d9a032','#3b3a3a','#ffe9a6'],
  boat:['#8a5a32','#e9dcc0','#5b3b22'], tree:['#4e9a4f','#6b4a2e','#83c47a'], house:['#c9734f','#7a4a32','#f1d9a8'],
};
export function parseDNA(phrase) {
  const input = cleanPhrase(phrase), [s, held] = splitHeld(input), archetype = archetypeOf(s);
  if (!archetype) throw new Error('No supported body or prop noun found. '+BODY_HINT);
  const kind = kindOf(archetype), monster = ['monster','dragon'].includes(archetype);
  const matches = COLORS.flatMap(([hex,words])=>words.filter(w=>wordHit(s,w)).map(w=>({hex,index:s.indexOf(w.normalize('NFC'))}))).sort((a,b)=>a.index-b.index);
  const defaults = DEFAULTS[archetype] || ['#6b9a68','#453966','#ffcc68'];
  const headCount = kind === 'prop' ? 0 : countOf(s,'head',1), armCount = humanoid(archetype) ? countOf(s,'arm',2) : 0;
  const flying = has(s,['উড়ন্ত','উড়ন্ত','উড়ছে','উড়ছে','flying','floating']);
  const hovers = flying || ['ghost','fish'].includes(archetype); // ghosts drift and fish swim without wings
  const wings = flying || has(s,['ডানাওয়ালা','ডানাওয়ালা','ডানাযুক্ত','ডানা','winged','wings','pegasus']);
  const effects = [];
  if (has(s,['আগুনের','আগুন','অগ্নি','fire','fiery','flaming'])) effects.push('fire_aura');
  if (has(s,['বরফের','বরফ','ice','icy','frozen'])) effects.push('ice_tint');
  if (has(s,['ভাঙা','ফাটা','broken','cracked','damaged'])) effects.push('cracked_overlay');
  const small = has(s,['পিচ্চি','বামন','ছোট','tiny','small','dwarf','little']), huge = monster || has(s,['বিশাল','বড়','বড়','huge','giant','massive']);
  return validateDNA({ version:1, kind, archetype, headCount, armCount, headAngles:Array.from({length:headCount},(_,i)=>headCount===1?0:-25+i*50/(headCount-1)),
    palette:{primary:matches[0]?.hex || defaults[0],secondary:matches[1]?.hex || defaults[1],accent:defaults[2]}, scale:small?0.65:huge?1.5:1,
    traits:{horns:monster || has(s,['শিংওয়ালা','শিংওয়ালা','horned','horns']),fangs:monster || has(s,['দাঁতাল','fangs','fanged']),glowingEyes:monster || has(s,['জ্বলন্ত চোখ','glowing eyes'])},
    effects, attachments:wings && archetype !== 'bird' ? ['wings_attachment'] : [], floating:hovers, held:held?[{hand:'R',dna:parseDNA(held)}]:[] });
}
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object' ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])) : x;
export const creationId = dna => 'creation_' + createHash('sha256').update(JSON.stringify(canonical(validateDNA(dna)))).digest('hex').slice(0,20);
const storeFile = options => options?.file || path.join(DATA_DIR,'brain','learned-creations.json');
function readStore(file) {
  if (!fs.existsSync(file)) return {version:1,creations:{}};
  const store = JSON.parse(fs.readFileSync(file,'utf8'));
  if (store.version !== 1 || !store.creations || typeof store.creations !== 'object' || Array.isArray(store.creations)) throw new Error('Invalid learned-creations store; existing file was preserved.');
  for (const [id,record] of Object.entries(store.creations)) { validateDNA(record.dna); if (id !== creationId(record.dna) || record.id !== id) throw new Error('Invalid learned creation identity.'); }
  return store;
}
let revision = 0;
export function createCreation(phrase, options = {}) {
  const dna = parseDNA(phrase), id = creationId(dna), file = storeFile(options), store = readStore(file);
  let record = store.creations[id], changed = !record;
  if (!record) record = store.creations[id] = {id,label:phrase.trim(),aliases:[],dna};
  if (!record.aliases.includes(phrase.trim())) { record.aliases.push(phrase.trim()); changed = true; }
  if (changed) {
    fs.mkdirSync(path.dirname(file),{recursive:true}); const temp = file + `.${process.pid}.${++revision}.tmp`;
    try { fs.writeFileSync(temp,JSON.stringify(store,null,2)+'\n',{flag:'wx'}); fs.renameSync(temp,file); } finally { fs.rmSync(temp,{force:true}); }
  }
  return structuredClone(record);
}
export function getCreation(id, options = {}) { if (!/^creation_[a-f0-9]{20}$/.test(String(id))) return null; return readStore(storeFile(options)).creations[id] || null; }
export function listCreations(options = {}) { return Object.values(readStore(storeFile(options)).creations); }
export function inspectPhrase(phrase) { return {dna:parseDNA(phrase),nlp:analyzeText(phrase)}; }
// A cast description is automatically learned when a film is built. A saved creation id reuses its exact DNA.
export function resolveCreation(spec, { persist = true, ...options } = {}) {
  if (spec?.dna) return {id:creationId(spec.dna),dna:validateDNA(spec.dna)};
  if (spec?.creation) { const saved = getCreation(spec.creation, options); if (!saved) throw new Error(`Unknown saved creation: ${spec.creation}`); return saved; }
  if (spec?.description) return persist ? createCreation(spec.description,options) : {dna:parseDNA(spec.description)};
  return null;
}

// Conservative bridge from a described subject in the normal Story flow to the compositional creator.
// The grammar handles one described subject per sentence; regular people and unmodified everyday props stay with the brain.
export function describedSubject(sentence) {
  const phrase = String(sentence).split(/\b(?:stands?|walks?|runs?|waits?|speaks?|says?|goes?|flies?|drives?|then|at|near|into|inside)\b|দাঁড়িয়ে|দাঁড়িয়ে|দাঁড়িয়ে|হাঁটছিল|হাঁটছে|দৌড়াচ্ছে|দৌড়াচ্ছে|বলল|বললো|বসে আছে/iu)[0].replace(/[.!?।]+$/u,'').trim();
  if (!phrase || phrase.length > 500) return null;
  let dna; try { dna = parseDNA(phrase); } catch { return null; }
  const s = cleanPhrase(phrase), modified = dna.headCount > 1 || (dna.armCount !== 2 && dna.armCount > 0) || dna.effects.length || dna.attachments.length || dna.held.length || COLORS.some(([,words])=>has(s,words));
  const nouns = CREATURE_NOUNS.filter(w=>wordHit(s,w)), fantasy = nouns.length > 0;
  if (['boat','tree','house'].includes(dna.archetype)) return null; // scenery is the place's job, never a stand-in for a person
  if (!(fantasy || modified) || (dna.archetype === 'human' && !dna.attachments.length && dna.headCount === 1 && dna.armCount === 2 && !has(s,['বামন','dwarf']))) return null;
  return {phrase,dna,nouns,modified};
}
const CREATURE_NOUNS = ['রাক্ষস','দৈত্য','দানব','ড্রাগন','monster','demon','dragon','রোবট','robot','বামন','dwarf','ভূত','পেত্নী','ghost'];
export function applyProceduralDescriptions(film, sentences) {
  // one creature per story: "তিন মাথার নীল রাক্ষস" first, then a bare "রাক্ষস" / "রাক্ষসের" / "রাক্ষসকে" is the SAME creature;
  // a newly described one ("একটা লাল দৈত্য") is a new creation
  const made = [];
  sentences.forEach((sentence,i)=>{
    const subject = describedSubject(sentence), own = film.shots.filter(s=>s.sentence === i+1 && s.people?.length);
    // a sentence folded into the shot before it (same place and people, too soon to cut) is carried by that shot
    const carry = own.length ? [] : film.shots.filter(s=>s.people?.length && s.sentence < i+1).slice(-1), shots = own.length ? own : carry; if (!shots.length) return;
    if (!subject || (carry.length && made.some(x=>x.nouns.some(n=>subject.nouns.includes(n))))) { // only mentioned: the creature joins the shot (after whoever acts), at most three people
      const t = cleanPhrase(String(sentence).slice(0,500) || ' '), m = made.find(x=>x.nouns.some(n=>wordHit(t,n))); if (!m) return;
      for (const shot of shots) if (!shot.people.some(p=>p.who===m.id) && shot.people.length < 3) shot.people.push({who:m.id,do:'idle',face:shot.people[0]?.face||'neutral'});
      return;
    }
    const prior = !subject.modified && made.find(x=>x.nouns.some(n=>subject.nouns.includes(n)));
    const c = prior ? {id:prior.id} : createCreation(subject.phrase); if (!prior) made.push({id:c.id,nouns:subject.nouns}); film.cast[c.id] = {creation:c.id,gender:'male',age:'adult'};
    for (const shot of shots) { shot.people = shot.people.filter((p,k)=>k===0||p.who!==c.id); shot.people[0] = {...shot.people[0],who:c.id}; }
    if (prior) return;
    film.plan.notes = (film.plan.notes || []).filter(n=>!n.startsWith(`Sentence ${i+1}: nobody named`));
    film.plan.notes.push(`Sentence ${i+1}: assembled ${subject.dna.archetype} from a local descriptive recipe (${c.id}).`);
    if (film.plan.roles) film.plan.roles[c.id] = subject.dna.archetype;
  });
  const used = new Set(film.shots.flatMap(s=>(s.people||[]).map(p=>p.who)));
  for (const id of Object.keys(film.cast)) if (!used.has(id)) {delete film.cast[id];if(film.plan.roles)delete film.plan.roles[id];}
  return film;
}
