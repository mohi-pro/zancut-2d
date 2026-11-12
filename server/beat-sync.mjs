// Visual beat sync: the concrete things a sentence names are SHOWN, at the moment they are said.
//   1. a library prop (engine/cartoon/library/props, words.json aliases in Bangla and English) or a learned prop
//      (engine/cartoon/library/learned-props.json, server/web-learner.mjs) → placed in the shot: in the speaker's hand, on the
//      ground next to them or in the sky (the physics engine's zone), with `word` so the build pops it in when the word is spoken
//   2. no piece for it, but an icon exists (OpenMoji, server/broll.mjs thingsNamed) → a b-roll callout of that thing
// Rules only (no model). Used by server/brainplan.mjs (planning) and server/codefilm.mjs (timing: words → seconds).
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';
import { stems } from './entity-resolver.mjs';
import { zoneOf, ZONES } from './physics.mjs';
import { thingsNamed } from './broll.mjs';
import { thingsIn as senseThings } from './scene-sense.mjs';

const NF = (s) => String(s ?? '').normalize('NFC');
const LIB = path.join(ENGINE_DIR, 'cartoon', 'library');
const PROPS = new Set(fs.readdirSync(path.join(LIB, 'props')).filter((f) => f.endsWith('.js')).map((f) => f.slice(0, -3)));
const WORDS = JSON.parse(fs.readFileSync(path.join(LIB, 'words.json'), 'utf8'));
// words that name a prop but usually mean something else in a story (a "key" point, a "flag" of a country in news, money talk)
const NOT_THING = new Set(['key', 'point', 'chart', 'bank', 'note', 'টাকা', 'চাবিকাঠি'].map(NF));
let cache = null;
function index() {
  const learned = (() => { try { return JSON.parse(fs.readFileSync(path.join(LIB, 'learned-props.json'), 'utf8')).props || {}; } catch { return {}; } })();
  const key = Object.keys(learned).join(',');
  if (cache?.key === key) return cache;
  const one = new Map(), many = []; // one word → id; several words → [phrase, id]
  const add = (w, id) => { const t = NF(w).toLowerCase().trim(); if (!t || NOT_THING.has(t)) return; if (t.includes(' ')) many.push([t, id]); else if (!one.has(t)) one.set(t, id); };
  for (const id of PROPS) for (const w of [id.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...(WORDS.aliases?.[id] || [])]) add(w, id); // its id as words too (cricketBat → cricket bat)
  for (const [id, p] of Object.entries(learned)) for (const w of [p.term, p.label, ...(p.synonyms || [])].filter(Boolean)) add(w, id);
  many.sort((a, b) => b[0].length - a[0].length);
  return (cache = { key, one, many });
}
// the things a sentence names, in the order they are said: [{ id, word, index }] (index = the word's position)
export function thingsIn(sentence) {
  const I = index(), s = NF(sentence).toLowerCase(), toks = s.split(/[\s,;:!?।.()"“”'‘’-]+/u).filter(Boolean), out = [], seen = new Set();
  for (const [ph, id] of I.many) { const at = s.indexOf(ph); if (at >= 0 && !seen.has(id)) { seen.add(id); out.push({ id, word: ph, index: s.slice(0, at).split(/\s+/).filter(Boolean).length }); } }
  toks.forEach((tok, k) => { for (const st of /^[a-z]+$/.test(tok) ? [tok, tok.replace(/(es|s)$/, '')] : stems(tok)) { const id = I.one.get(st); if (id && !seen.has(id)) { seen.add(id); out.push({ id, word: tok, index: k }); break; } } });
  return out.sort((a, b) => a.index - b.index);
}
// one shot: up to two named things are shown. A hand prop goes in the speaker's hand; an animal of the water goes out on the water
// (dz 12) when the place has water; with nobody in the shot the first thing is the subject, centre stage and near (dz 3).
const WATER_PLACES = new Set(['sea_beach', 'river_ghat']);
export function syncShot(shot, sentence) {
  const done = [], people = shot.people || [], who = people[0]?.who, have = new Set((shot.props || []).map((p) => p.id)), scenery = !people.length;
  const list = senseThings(sentence).filter((x) => !have.has(x.id)).slice(0, 2);
  list.forEach((t, k) => {
    const zone = zoneOf(t.id), water = WATER_PLACES.has(shot.place) && (t.tags?.includes('water') || /dolphin|fish|crab|duck|boat|ship/i.test(t.id));
    const held = !scenery && zone === ZONES.HELD_IN_HAND && who && t.kind !== 'animal' && !(shot.props || []).some((p) => p.zone === ZONES.HELD_IN_HAND);
    const prop = held ? { id: t.id, zone, by: who, word: t.word } : zone === ZONES.SKY_FLOATING ? { id: t.id, zone, x: scenery ? 0 : 1.5, word: t.word }
      : water ? { id: t.id, x: scenery ? (k ? 2.5 : 0) : 2.2, dz: scenery && !k ? 7.5 : 11, word: t.word } : scenery ? { id: t.id, x: k ? 2.4 : 0, dz: k ? 5 : 3, word: t.word } : { id: t.id, x: num(people[0]?.x) + (done.length ? -1.4 : 1.4), dz: num(people[0]?.dz, 1) + 0.2, word: t.word };
    (shot.props ||= []).push(prop); done.push({ id: t.id, word: t.word, how: held ? 'in hand' : water ? 'on the water' : zone === ZONES.SKY_FLOATING ? 'sky' : scenery ? 'the subject, centre stage' : 'next to the speaker' });
  });
  if (!done.length && !shot.broll) { const icon = thingsNamed(sentence)[0]; if (icon) { shot.brain = { ...(shot.brain || {}), broll: { label: 'compose_custom_recipe', conf: 0.9 } }; done.push({ id: `openmoji:${icon.hex}`, word: icon.said, how: 'b-roll callout' }); } }
  return done;
}
const num = (x, d = 0) => (Number.isFinite(Number(x)) ? Number(x) : d);
// the build: a prop with a `word` appears when that word is spoken in its shot (seconds from the shot's start)
export function propTimes(shot, shotWords, t0) {
  for (const p of shot.props || []) {
    if (p.at != null || !p.word) continue;
    const w = NF(p.word).toLowerCase(), hit = shotWords.find((x) => { const tk = NF(x.text).toLowerCase(); return tk.includes(w) || stems(tk).includes(w) || stems(w).includes(tk); });
    if (hit) p.at = Math.max(0, Math.round(((hit.start ?? hit.t ?? 0) - t0) * 100) / 100);
  }
  return shot;
}
