import path from 'node:path';
import fs from 'node:fs';
// Script → scene file, by rules only (no model). "Template mode": it reads a Bangla or English script, splits it into sentences,
// times them over the voice, picks a ready place per sentence from keywords, finds who is there and what they do.
// It is honest about its limits: it only uses places, actions and people that exist, and lists what it could not place in `notes`.
import { resolveStory } from './entity-resolver.mjs';
import { placeIds } from './codefilm.mjs';
import { resolvePlace } from './place-registry.mjs';
import { applyProceduralDescriptions } from './procedural-creator.mjs';
import { DATA_DIR as STYLE_DATA } from './config.mjs';
// the cut rhythm: 3.5 s per shot (the reference study), or what the owner learned from a reference video in /admin
// (data/brain/style-profile.json, kept between 1.8 and 6 s)
const styleShot = () => { try { const p = JSON.parse(fs.readFileSync(path.join(STYLE_DATA, 'brain', 'style-profile.json'), 'utf8')); const x = Number(p.applied?.shotSeconds ?? p.avgShotSeconds); return Number.isFinite(x) ? Math.max(1.8, Math.min(6, x)) : 3.5; } catch { return 3.5; } };

const PLACES = {
  bedroom: ['bed', 'wake', 'woke', 'sleep', 'asleep', 'morning', 'বিছানা', 'ঘুম', 'ঘুম থেকে', 'সকালে'],
  village_home: ['home', 'house', 'yard', 'village', 'courtyard', 'বাড়ি', 'ঘর', 'উঠান', 'গ্রাম', 'বাড়ির'],
  village_road: ['road', 'path', 'way', 'walk', 'walks', 'walked', 'street', 'রাস্তা', 'পথ', 'হাঁট', 'যায়', 'যাচ্ছ'],
  school_yard: ['school', 'স্কুল', 'বিদ্যালয়'],
  classroom: ['classroom', 'class', 'teacher', 'lesson', 'ক্লাস', 'শিক্ষক', 'পড়া'],
  city_street: ['city', 'bus', 'traffic', 'শহর', 'বাস', 'শহরের'],
  park: ['park', 'garden', 'bench', 'পার্ক', 'বাগান'],
};
const ACTIONS = [
  ['run', ['run', 'ran', 'running', 'rush', 'দৌড়', 'ছুট']], ['walk', ['walk', 'walks', 'walked', 'go', 'goes', 'went', 'pack', 'হাঁট', 'হেঁটে', 'যায়', 'গেল', 'যাচ্ছ']],
  ['wave', ['wave', 'waves', 'waved', 'hello', 'goodbye', 'হাত নাড়', 'বিদায়']], ['cheer', ['cheer', 'happy', 'joy', 'celebrate', 'win', 'won', 'খুশি', 'আনন্দ']],
  ['clap', ['clap', 'applause', 'হাততালি']], ['point', ['point', 'show', 'দেখাল', 'দেখায়']], ['sit', ['sit', 'sat', 'sits', 'seat', 'বস']],
];
const FACES = [['happy', ['smile', 'smiles', 'happy', 'thank', 'joy', 'laugh', 'খুশি', 'হাসি', 'ধন্যবাদ']], ['worried', ['worry', 'worried', 'afraid', 'lost', 'problem', 'চিন্তা', 'ভয়']], ['sad', ['sad', 'cry', 'cried', 'tears', 'কান্না', 'দুঃখ']], ['surprised', ['surprise', 'suddenly', 'shock', 'অবাক', 'হঠাৎ']]];
export const ROLES = [
  { id: 'baba', label: 'old man', words: ['old man', 'grandfather', 'বৃদ্ধ লোক', 'বুড়ো লোক', 'বৃদ্ধ', 'দাদু', 'ঠাকুরদা', 'বুড়ো'], spec: { gender: 'male', age: 'elderly', skin: 4, build: 'thin', hair: { style: 'cap', color: 'white' }, outfit: { type: 'punjabi', color: '#efe9da' }, extras: ['beard', 'glasses'] } },
  { id: 'mother', label: 'woman', words: ['mother', 'mom', 'woman', 'lady', 'মা', 'নারী', 'মহিলা'], spec: { gender: 'female', age: 'adult', skin: 3, hair: { style: 'hijab', color: '#6d4aa8' }, outfit: { type: 'abaya', color: '#3a3556' } } },
  { id: 'father', label: 'man', words: ['father', 'dad', 'man', 'বাবা', 'পুরুষ', 'লোক'], spec: { gender: 'male', age: 'adult', skin: 3, hair: { style: 'crop', color: 'black' }, outfit: { type: 'shirt', color: '#4a78a6' } } },
  { id: 'teacher', label: 'teacher', words: ['teacher', 'শিক্ষক', 'স্যার'], spec: { gender: 'male', age: 'adult', skin: 3, hair: { style: 'crop', color: 'dark' }, outfit: { type: 'shirt', color: '#7a5aa0' } } },
  { id: 'girl', label: 'girl', words: ['girl', 'মেয়ে'], spec: { gender: 'female', age: 'child', skin: 3, hair: { style: 'bob', color: 'black' }, outfit: { type: 'salwar', color: '#d4577a' } } },
  { id: 'boy', label: 'boy', words: ['boy', 'child', 'kid', 'ছেলে', 'শিশু'], spec: { gender: 'male', age: 'child', skin: 3, hair: { style: 'crop', color: 'black' }, outfit: { type: 'tshirt', color: '#e0862b' } } },
];
const STOP = new Set('The A An On In At He She They It His Her Their Then When After Before Suddenly One Every This That There But And So As If We I You Today Once Later Soon Finally Morning'.split(' '));
const COLORS = ['#e0862b', '#4a78a6', '#d4577a', '#5a9a5a', '#a06ac0', '#c05050'];
const has = (s, words) => words.some((w) => (/^[\x00-\x7f]+$/.test(w) ? new RegExp(`\\b${w}`, 'i').test(s) : s.includes(w)));
export const sentences = (text) => String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?।])\s+/).map((x) => x.trim()).filter(Boolean);

export function planFromScript(text, { duration = 0, title = '' } = {}) {
  const sents = sentences(text), notes = [], cast = {}, places = new Set(placeIds());
  if (!sents.length) throw Object.assign(new Error('Paste the story script first.'), { customer: true });
  const total = sents.reduce((a, s) => a + s.length, 0), dur = duration > 0 ? duration : Math.max(6, sents.length * 3);
  let t = 0, place = 'village_home', last = null, hero = null, ci = 0;
  const story = resolveStory(sents), named = Object.fromEntries(story.characters.map((c) => [c.id, c])); // Bengali/English names, pronouns
  const shots = sents.map((s, i) => {
    const at = Math.round(t * 100) / 100; t += (s.length / total) * dur;
    // who: names (a capital word not at the start of a common phrase) and roles
    const here = [];
    for (const id of story.sentences[i].who) { if (!named[id]) continue; cast[id] ||= named[id].spec; if (!here.includes(id)) here.push(id); hero ||= id; }
    for (const m of s.matchAll(/\b([A-Z][a-z]{2,})\b/g)) { const n = m[1]; if (STOP.has(n)) continue; const id = n.toLowerCase(); if (!cast[id]) cast[id] = { ...ROLES.find((r) => r.id === 'boy').spec, outfit: { type: 'tshirt', color: COLORS[ci++ % COLORS.length] } }; if (!here.includes(id)) here.push(id); hero ||= id; }
    let rest = s; // a role's words are used up once matched, so "old man" is not also "man"
    for (const r of ROLES) { const w = r.words.find((x) => has(rest, [x])); if (!w) continue; rest = rest.replace(new RegExp(/^[\x00-\x7f]+$/.test(w) ? `\\b${w}\\w*` : w, 'ig'), ' '); if (!cast[r.id]) cast[r.id] = r.spec; if (!here.includes(r.id)) here.push(r.id); hero ||= r.id; }
    if (hero && !here.includes(hero) && here.length < 3) here.unshift(hero); // the hero stays in the scene
    if (!here.length && /\b(he|she|his|her)\b|সে|তার/i.test(s) && last?.length) here.push(...last);
    if (!here.length && hero) here.push(hero);
    if (!here.length) { cast.boy ||= ROLES.find((r) => r.id === 'boy').spec; hero = 'boy'; here.push('boy'); notes.push(`Sentence ${i + 1}: nobody named, used a boy. Rename the cast in the scene file.`); }
    last = here;
    // where
    let best = null, hits = 0; for (const [id, w] of Object.entries(PLACES)) { const n = w.filter((x) => has(s, [x])).length; if (n > hits && places.has(id)) { best = id; hits = n; } }
    best = resolvePlace(s) || best;
    if (best) place = best; else if (i === 0) notes.push(`Sentence 1: no place words, started at ${place}.`);
    // what
    const act = (ACTIONS.find(([, w]) => has(s, w)) || ['idle'])[0], face = (FACES.find(([, w]) => has(s, w)) || [null, null])[0];
    const n = here.length, xs = n === 1 ? [0] : n === 2 ? [-1.3, 1.3] : [-2.2, 0, 2.2];
    const people = here.slice(0, 3).map((who, k) => {
      const mover = (k === 0 && (act === "walk" || act === "run")), d = n === 1 ? 1.2 : 0;
      const p = { who, x: mover ? -d - 1.5 : xs[k], dz: 1, do: k === 0 || n === 1 ? act : 'idle' };
      if (mover) p.to = d + 1; if (face) p.face = face; if (k === 1) p.facing = -1; if (n > 1 && k === 0 && !mover) p.facing = 1; return p;
    });
    return { at, place, view: 'wide', people, sentence: i + 1, say: s.slice(0, 120) };
  });
  const film = { title: title || 'Untitled', cast, shots: shots.map(({ say, ...x }) => x), plan: { mode: 'rules (no AI model)', sentences: shots.map((s, i) => ({ n: i + 1, at: s.at, text: s.say })), notes } };
  return applyProceduralDescriptions(film, sents);
}

// Geometry is code, meaning is the model: a plan { characters: [{id, role}], shots: [{ sentence, place, people: [{who, do, face}] }] } → a scene file.
export const PLAN_ACTIONS = ['idle', 'walk', 'run', 'wave', 'cheer', 'clap', 'point', 'sit'];
export const PLAN_FACES = ['neutral', 'happy', 'worried', 'sad', 'surprised'];
const r2 = (x) => Math.round(x * 100) / 100;
export function filmFromPlan(sents, plan, { duration = 0, title = '', starts: given = null } = {}) {
  const places = new Set(placeIds()), total = sents.reduce((a, s) => a + s.length, 0) || 1, dur = duration > 0 ? duration : Math.max(6, sents.length * 3);
  // the voice's own word times when we have them (plan from the voice); else spread by sentence length
  const starts = []; let t = 0; for (const s of sents) { starts.push(Math.round(t * 100) / 100); t += (s.length / total) * dur; } if (Array.isArray(given) && given.length === sents.length) given.forEach((x, i) => { starts[i] = Math.round(x * 100) / 100; });
  const cast = {}; let ci = 0;
  for (const c of plan.characters || []) { const r = ROLES.find((x) => x.id === c.role) || ROLES.find((x) => x.id === 'boy'); const id = String(c.id || r.id).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || r.id; cast[id] = { ...r.spec, ...(c.spec || {}) }; c._id = id; } // c.spec: one look per name (entity-resolver), or a varied look per story for a role (brainplan.roleSpec); // a named character keeps one look (server/entity-resolver.mjs)
  const ids = Object.fromEntries((plan.characters || []).map((c) => [c.id, c._id]));
  // pacing learned from the reference films (data/references): a cut every ~3.5 s, a place shot when the place changes,
  // pairs framed together, then the one who acts closer. Movement stays wide (it needs room).
  const STYLE = { shot: styleShot(), establish: 1.6 }, ends = starts.map((x, i) => (i + 1 < starts.length ? starts[i + 1] : dur));
  const shots = []; let lastPlace = null, k = 0, night = false;
  (plan.shots || []).filter((x) => Number.isInteger(x.sentence) && x.sentence >= 1 && x.sentence <= sents.length).sort((a, b) => a.sentence - b.sentence).forEach((x) => {
    const here = (x.people || []).map((p) => ({ ...p, who: ids[p.who] })).filter((p) => p.who && cast[p.who]).slice(0, 3), hero = ids[(plan.characters || [])[0]?.id];
    if (hero && !x.scenery && x.keepHero !== false && !here.some((p) => p.who === hero)) here.unshift({ who: hero, do: 'idle', face: 'neutral' }); here.splice(3);
    if (!here.length && !x.scenery) return;
    const n = here.length, xs = n === 1 ? [0] : n === 2 ? [-1.1, 1.1] : [-2, 0, 2], place = places.has(x.place) ? x.place : lastPlace || [...places][0], sentence = x.sentence, s0 = starts[sentence - 1], s1 = ends[sentence - 1];
    const people = here.map((p, k2) => { const act = PLAN_ACTIONS.includes(p.do) ? p.do : 'idle', mover = ['walk', 'run'].includes(act), o = { who: p.who, x: mover ? (n === 1 ? -2.2 : xs[k2] - 1) : xs[k2], dz: 1, do: act };
      if (mover) o.to = n === 1 ? 2.2 : xs[k2] + 1; if (PLAN_FACES.includes(p.face) && p.face !== 'neutral') o.face = p.face; if (k2 === 1) o.facing = -1; if (typeof p.gesture === 'string' && act === 'idle') o.gesture = p.gesture; return o; }); // a gesture the brain chose
    // The resolver orders the sentence's subject first. Adding the recurring hero must
    // not silently make a listener speak or crop the actual actor out of a close-up.
    const subject = ids[x.people?.[0]?.who];
    const actor = people.find((p) => p.who === subject) || people.find((p) => p.gesture || p.do !== 'idle') || people[0];
    if (/\b(says?|said|asks?|asked|tells?|told|shouts?|replies|replied|answers?|calls?)\b|["“”]|বল(ে|েন|ল|লেন|লো)|জিজ্ঞেস|উত্তর|ডাক/i.test(sents[sentence - 1])) actor.speaks = true; // the narrator voices the line: the actor's mouth moves
    const moving = people.some((p) => ['walk', 'run'].includes(p.do));
    let t = s0;
    if (x.time === 'night' || /\bnight\b|\bevening\b|\bdark\b|রাত|সন্ধ্যা|অন্ধকার/i.test(sents[sentence - 1])) night = true; else if (place !== lastPlace) night = false; // night lasts until the place changes
    const time = x.time && x.time !== 'night' ? { time: x.time } : {};
    // a scenery shot: the place itself (the sea at sunset, a dolphin over the water) — nobody is put into it
    if (!here.length) { const prev = shots.at(-1); if (prev && prev.people.length === 0 && prev.place === place && s0 - prev.at < STYLE.shot * 0.8) return;
      shots.push({ at: r2(s0), place, view: 'wide', camera: { kind: 'wide' }, people: [], sentence, scenery: true, ...(night ? { night: true } : {}), ...time, ...(x.brain ? { brain: x.brain } : {}) }); lastPlace = place; return; }
    if (place !== lastPlace && s1 - s0 >= STYLE.establish + STYLE.shot * 0.85) { shots.push({ at: r2(t), place, view: 'wide', camera: { kind: 'establish' }, people: [], sentence, ...(night ? { night: true } : {}) }); t += STYLE.establish; }
    lastPlace = place;
    const left = s1 - t, parts = Math.max(1, Math.min(3, Math.floor(left / (STYLE.shot * 1.3)) + (left >= STYLE.shot * 1.3 ? 1 : 0)));
    const CYCLE = n >= 2 ? ['two', 'close', 'single'] : ['wide', 'close', 'single'];
    for (let j = 0; j < parts; j++) {
      const at = r2(t + (left / parts) * j), prev = shots.at(-1), same = prev && prev.place === place && prev.camera.kind !== 'establish' && prev.people.map((p) => p.who).join() === people.map((p) => p.who).join();
      // the voice is the clock but a cut needs a reason: under ~2.8 s since the last cut, the same place and people → the shot carries on
      if (same && at - prev.at < STYLE.shot * 0.8) { prev.people = prev.camera.kind === 'close' ? prev.people : people; continue; }
      // too soon after the last cut in the same place (under 2.4 s): no new shot, the newcomers join the shot on screen
      if (prev && prev.place === place && prev.camera.kind !== 'establish' && at - prev.at < 2.4 && !moving && people.every((p) => p.do === 'idle')) { /* an action always gets its own shot */ const seen = new Set(prev.people.map((p) => p.who)); for (const p of people) if (!seen.has(p.who)) prev.people.push(p); if (prev.camera.kind === 'close' && prev.people.length > 1) prev.camera.kind = 'two'; prev.people.splice(3); continue; }
      const kind = moving ? 'wide' : CYCLE[k++ % CYCLE.length];
      shots.push({ at, place, view: 'wide', camera: { kind, on: actor.who }, people: kind === 'close' ? [actor] : people, sentence, ...(night ? { night: true } : {}), ...time, ...(x.brain ? { brain: x.brain } : {}) }); // the brain's hints for codefilm
    }
  });
  return { title: title || 'Untitled', cast, shots, plan: { sentences: sents.map((text, i) => ({ n: i + 1, at: starts[i], text })), notes: [] } };
}
