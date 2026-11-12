// The planner built on Zancut's own brain (server/brain.mjs): script → scene file. No outside AI.
// The brain chooses meaning per sentence (place, action, face, who); code does geometry and timing; qa.mjs checks the result.
import { resolveStory, castSpec } from './entity-resolver.mjs';
import { sense } from './scene-sense.mjs';
import { locationIntent } from './location-intent.mjs';
import fs from 'node:fs';
import { load, save, train, predict, allExamples, learnMany, trainFull, coarseAction, ROLE_IDS, HEADS, paths as brainPaths } from './brain.mjs';
import { sentences, filmFromPlan, planFromScript, ROLES } from './scriptplan.mjs';
import { check } from './qa.mjs';
import { resolvePlace } from './place-registry.mjs';
import { applyProceduralDescriptions, describedSubject } from './procedural-creator.mjs';
import { applyToPlan, listRules } from './strict-rules.mjs';
import { syncShot } from './beat-sync.mjs';

let MODEL = null, MODEL_FILE = null;
const modelStamp = () => { try { const s = fs.statSync(brainPaths.model); return `${s.ino}:${s.mtimeMs}:${s.size}`; } catch { return null; } };
export function brain() {
  if (!MODEL || modelStamp() !== MODEL_FILE) { MODEL = load() || trainFull(); MODEL_FILE = modelStamp(); }
  return MODEL;
}
export function retrain() { MODEL = trainFull(); MODEL_FILE = modelStamp(); return { examples: MODEL.examples, trainedAt: MODEL.trainedAt }; }
export const forget = () => { MODEL = null; MODEL_FILE = null; }; // reload after local teaching or an external training command
export const brainInfo = () => { const m = brain(); return { examples: m.examples, trainedAt: m.trainedAt, heads: Object.fromEntries(Object.entries(m.heads).map(([k, h]) => [k, h.n])) }; };
const COMMON = new Set('stage level model language large small like you will what this that there here then when where who why how first second third last next some many much more most very just also only even still again ever never always now today tomorrow yesterday morning evening night day week year time people person thing things world life school road home house city village water food money work game story chapter part'.split(' '));
const STOP = new Set('The A An On In At He She They It His Her Their Then When After Before Suddenly One Every This That There But And So As If We I You Today Once Later Soon Finally Morning'.split(' '));

// variety: the same role (a mother, a boy, the narrator) looks different from story to story — one look per role inside a story
const hashStr = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };
export function roleSpec(role, seed) {
  const base = ROLES.find((r) => r.id === role)?.spec, ages = ['child', 'adult', 'adult', 'elderly', 'adult', 'child'];
  const gender = base?.gender || (seed % 2 ? 'female' : 'male'), age = base?.age || ages[(seed >>> 3) % ages.length];
  const sp = { ...castSpec(`${role}-${seed}`, gender, { age }), ...(base?.build ? { build: base.build } : {}) };
  if (age === 'child' && gender === 'female' && ['saree', 'abaya'].includes(sp.outfit?.type)) sp.outfit = { ...sp.outfit, type: 'salwar' }; // a girl wears a salwar kameez, not a saree
  return sp;
}
// a story that names no place still gets one that fits it, chosen per story (never always the same village home)
const OPEN_PLACES = ['park', 'village_road', 'city_street', 'school_yard', 'living_room', 'farm_field', 'river_ghat', 'market_bazaar', 'mountain_valley', 'sea_beach', 'tea_stall', 'rooftop'];
export function planFromBrain(text, { duration = 0, title = '', timed = null } = {}) {
  const sents = (timed ? timed.map((x) => x.text) : sentences(String(text ?? '').normalize('NFC'))).map((x) => String(x).normalize('NFC')); if (!sents.length) throw Object.assign(new Error('Paste the story script first.'), { customer: true });
  const m = brain(), chars = [], seen = new Set(), notes = [], shots = [], original = [];
  // a capitalised word is a NAME only if it comes back (2+ sentences) and is not a common word; at most 4 names, the most frequent
  const cnt = new Map(); sents.forEach((s) => { for (const n of new Set([...s.matchAll(/\b([A-Z][a-z]{2,})\b/g)].map((x) => x[1]))) if (!STOP.has(n) && !COMMON.has(n.toLowerCase())) cnt.set(n, (cnt.get(n) || 0) + 1); });
  const NAMES = new Set([...cnt].filter(([, c]) => c >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([n]) => n));
  const addChar = (id, role, spec) => { if (!seen.has(id)) { seen.add(id); chars.push({ id, role, ...(spec ? { spec } : {}) }); } };
  // Bengali and English names (server/entity-resolver.mjs: suffixes stripped, new names from speech verbs, one look per name)
  // and pronouns resolved to the active character or group
  const story = resolveStory(sents), named = Object.fromEntries(story.characters.map((c) => [c.id, c]));
  let place = null, last = [], hero = null, time = null; const seed = hashStr(sents.join(' '));
  sents.forEach((s, i) => {
    // Brain v2 reads the sentence with its neighbours and the place so far (story continuity)
    const pr = predict(m, { currentText: s, prevText: sents[i - 1] || '', nextText: sents[i + 1] || '', prevPlace: i && place ? place : 'none' }), here = [], sn = sense(s);
    for (const id of story.sentences[i].who) { const c = named[id]; if (!c) continue; addChar(id, c.spec.gender === 'female' ? 'girl' : 'boy', c.spec); if (!here.includes(id)) here.push(id); hero ||= id; }
    // names written with a capital (Latin script); roles from the brain
    for (const x of s.matchAll(/\b([A-Z][a-z]{2,})\b/g)) { const n = x[1]; if (!NAMES.has(n)) continue; const id = n.toLowerCase(); addChar(id, 'boy'); if (!here.includes(id)) here.push(id); hero ||= id; }
    for (const r of pr.roles.filter((r) => r.p > 0.5).sort((a, b) => b.p - a.p)) { const id = ROLE_IDS.includes(r.id) ? r.id : 'boy'; if (id === 'boy' && here.length && (/[A-Z][a-z]{2,}/.test(s) || story.sentences[i].who.length)) continue; addChar(id, id, roleSpec(id, seed)); if (!here.includes(id)) here.push(id); hero ||= id; }
    if (!here.length && /\b(he|she|his|her|him)\b|সে|তার|তাকে/i.test(s) && last.length) here.push(...last);
    // nobody in the sentence: if it is about the world (a place, an animal, a thing, the time of day) it is a scenery shot;
    // else the story's narrator (a look chosen per story) presents it
    const scenic = !here.length && !describedSubject(s) && (sn.subjects.length > 0 || !!sn.place || !!sn.time || !!sn.home); // a described character (a three-headed monster) is a someone, not scenery
    if (!here.length && !scenic && hero) here.push(hero);
    if (!here.length && !scenic) { addChar('narrator', 'narrator', roleSpec('narrator', seed)); hero = 'narrator'; here.push('narrator'); notes.push(`Sentence ${i + 1}: nobody named; a narrator presents it (rename them in the storyboard).`); }
    last = here;
    // the place: one the words name (or a learned concept is bound to) → the brain (when sure) → the home of the animals named
    const brainPl = pr.place.label !== 'none' && pr.place.conf >= 0.45 ? pr.place.label : null, before = place;
    const intent = locationIntent(s, { before: place }), home = intent.homeAllowed ? sn.home : null;
    const pl = intent.constrained ? intent.place : intent.place || sn.place || resolvePlace(s, { newOnly: true }) || (scenic && home ? home : null) || brainPl || (home && home !== place ? home : null);
    if (pl) place = pl; else if (!place) { place = OPEN_PLACES[seed % OPEN_PLACES.length]; notes.push(`Sentence ${i + 1} names no place: chose ${place} for this story.`); }
    if (sn.time) time = sn.time; else if (place !== before) time = null; // dawn / sunset / night lasts until the place changes
    // an action is done; a gesture is acted while standing (the 65 safe gestures are idle-stance moves)
    const a0 = pr.action.conf >= 0.4 ? pr.action.label : 'idle', gesture = coarseAction(a0) === a0 && ['idle', 'walk', 'run', 'wave', 'cheer', 'clap', 'point', 'sit'].includes(a0) ? null : a0, act = gesture ? 'idle' : a0, face = pr.face.conf >= 0.4 ? pr.face.label : 'neutral';
    const hint = (h, min) => (pr[h].conf >= min ? { label: pr[h].label, conf: +pr[h].conf.toFixed(2) } : null);
    shots.push({ sentence: i + 1, place, ...(time ? { time } : {}), ...(scenic ? { scenery: true } : {}), people: here.slice(0, 3).map((who, k) => ({ who, do: k === 0 ? act : 'idle', face, ...(k === 0 && gesture ? { gesture } : {}) })), brain: { broll: hint('broll', 0.5), graphic: hint('graphic', 0.5), cameraMove: hint('cameraMove', 0.5) } });
    original.push({ place, action: a0, face, conf: { place: +pr.place.conf.toFixed(2), action: +pr.action.conf.toFixed(2), face: +pr.face.conf.toFixed(2) } });
  });
  const film = filmFromPlan(sents, { characters: chars, shots }, { duration, title, starts: timed ? timed.map((x) => x.at) : null });
  film.plan.mode = `Zancut brain (own model, ${m.examples} examples)`; film.plan.original = original; film.plan.notes = [...notes, ...check(film, { duration }).filter((i) => i.severity === 'error').map((i) => i.evidence)];
  film.plan.roles = Object.fromEntries(chars.map((c) => [c.id.replace(/[^a-z0-9_]/g, ''), c.role]));
  if (!film.shots.length) return planFromScript(text, { duration, title });
  return finish(applyProceduralDescriptions(film, sents), sents);
}
// after the brain: the owner's strict rules win (data/brain/strict-rules.json: e.g. no big moves while talking unless the words
// say so), and the things each sentence names are shown when they are said (server/beat-sync.mjs). Every decision → a receipt.
export function finish(film, sents, { rules = listRules() } = {}) {
  const receipts = sents.map((text, i) => ({ sentence: i + 1, text, place: null, people: [], props: [], rules: [] }));
  // a sentence folded into the shot before it (same place and people, too soon to cut) is acted in that shot
  const pairs = sents.flatMap((_, i) => { const own = film.shots.filter((x) => x.sentence === i + 1); return (own.length ? own : film.shots.filter((x) => x.sentence < i + 1).slice(-1)).map((shot) => [i, shot]); });
  for (const [i, shot] of pairs) {
    const R = receipts[i]; if (!R) continue;
    R.place ||= shot.place; R.shot ||= film.shots.indexOf(shot) + 1; const conf = film.plan.original?.[i]?.conf || {};
    if (shot.camera?.kind !== 'establish') { if (shot.sentence === i + 1) R.rules.push(...applyToPlan(shot, sents[i], { rules, conf })); R.props.push(...syncShot(shot, sents[i])); } // the acting is judged by the shot's own sentence
    for (const p of shot.people || []) if (!R.people.some((x) => x.who === p.who)) R.people.push({ who: p.who, do: p.do, gesture: p.gesture || null, face: p.face || null });
    R.brain = Object.fromEntries(Object.entries(shot.brain || {}).filter(([, v]) => v).map(([h, v]) => [h, `${v.label} ${Math.round(v.conf * 100)}%`]));
  }
  film.plan.receipts = receipts;
  film.plan.teachingOriginal ||= Object.fromEntries(film.shots.map((s) => [teachingKey(s), teachingLabels(s)]));
  return film;
}

const teachingLabels = (shot) => {
  const people = shot.people || [], actor = people.find((p) => p.gesture || (p.do && p.do !== 'idle')) || people[0] || {};
  const labels = { place: shot.place, action: HEADS.action.includes(actor.gesture) ? actor.gesture : HEADS.action.includes(actor.do) ? actor.do : 'idle', face: people.find((p) => p.face && p.face !== 'neutral')?.face || 'neutral' };
  if (HEADS.cameraMove.includes(shot.camera?.move)) labels.cameraMove = shot.camera.move;
  if (shot.broll === false) labels.broll = 'none';
  else if (shot.broll?.template && HEADS.broll.includes(shot.broll.template)) labels.broll = shot.broll.template;
  else if (shot.broll?.recipe) labels.broll = 'compose_custom_recipe';
  if (Array.isArray(shot.overlays)) labels.graphic = shot.overlays.find((o) => HEADS.graphic.includes(o.kind))?.kind || 'none';
  return labels;
};
const teachingKey = (s) => `${s.sentence || 0}:${s.at || 0}`;

// What the owner corrected or approved becomes training data. changedOnly: only shots that differ from what the brain proposed.
export function teachFromFilm(film, { changedOnly = true } = {}) {
  const S = film.plan?.sentences || [], O = film.plan?.original || [], done = new Set(), out = [];
  const shots = [...(film.shots || [])].sort((a, b) => (a.at ?? 0) - (b.at ?? 0));
  shots.forEach((shot, k) => {
    if (!(shot.people || []).length) return; // a place shot says nothing about who does what
    const i = shot.sentence ? shot.sentence - 1 : S.findIndex((x) => Math.abs(x.at - shot.at) < 0.011); if (i < 0 || !S[i] || done.has(i)) return;
    const labels = teachingLabels(shot), was = film.plan.teachingOriginal?.[teachingKey(shot)] || O[i];
    const selected = changedOnly ? Object.fromEntries(Object.entries(labels).filter(([h, v]) => was && v !== was[h])) : labels;
    if (!Object.keys(selected).length) return;
    const ex = { text: S[i].text, ctx: { prevText: S[i - 1]?.text || '', nextText: S[i + 1]?.text || '', prevPlace: k ? shots[k - 1].place || 'none' : 'none' }, ...selected };
    // roles are NOT learned from a storyboard (the hero stays in every shot, so who is in a shot says little about the sentence)
    if (ex.place && !HEADS.place.includes(ex.place)) return; for (const kk of Object.keys(ex)) if (ex[kk] == null) delete ex[kk]; out.push(ex); done.add(i);
  });
  const accepted = learnMany(out); MODEL = null;
  // Repeated clicks must not multiply the same correction's training weight.
  if (accepted.length) film.plan.teachingOriginal = Object.fromEntries(film.shots.map((s) => [teachingKey(s), teachingLabels(s)]));
  return accepted.length;
}

// the voice's words (from the transcript) → sentences with their start second (a full stop / । / ? / ! or a pause over 0.7 s ends one)
export function sentencesFromWords(words) {
  const out = []; let cur = null;
  words.forEach((w, i) => { const t = String(w.text ?? w.word ?? '').trim(); if (!t) return; if (!cur) cur = { text: '', at: Math.max(0, (w.start ?? 0) - 0.1) }; cur.text = `${cur.text} ${t}`.trim();
    const nx = words[i + 1]; if (/[.!?।]$/.test(t) || !nx || (nx.start ?? 0) - (w.end ?? 0) > 0.7) { out.push(cur); cur = null; } });
  if (out[0]) out[0].at = 0; return out;
}
