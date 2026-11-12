// The parts finder (no AI): the 2D library is searched by code, never read whole by a prompt. The director writes what a shot needs
// in plain words (a row's "needs"), this finds the closest parts and their near alternatives, and writes one small file per film
// (edit/film-parts.json); each designer gets only its own rows' slice, the film-kit designer only its places'. Anything missed:
// the find_parts tool (same search). The search words live in engine/cartoon/library/words.json (aliases in English and Bangla,
// word forms, the things that go together in a place); a miss is fixed there and tested by scripts/parts-test.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { DATA_DIR } from './config.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB_DIR = () => process.env.ZANCUT_LIBRARY_DIR || path.join(ROOT, 'engine', 'cartoon', 'library');
const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const ls = (d, ext) => { try { return fs.readdirSync(d).filter((f) => f.endsWith(ext)).sort().map((f) => path.join(d, f)); } catch { return []; } };

// ---------- words ----------
const STOP = new Set('a an the of on in at to into onto from with by for and or but then while as is are was be it its his her their they he she him them this that these those one two some very slowly quickly gently softly near next beside behind front back left right side small big little'.split(' '));
const stem = (w) => (w.length > 5 && w.endsWith('ing') ? w.slice(0, -3) : w.length > 4 && w.endsWith('ed') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
function tokens(text, W) {
  const raw = String(text || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^\p{L}\p{M}0-9']+/u).filter(Boolean);
  const out = [];
  for (let w of raw) { w = w.replace(/'s$/, ''); if (STOP.has(w)) continue; if (Object.hasOwn(W.words, w)) { if (W.words[w]) out.push(W.words[w]); continue; } out.push(stem(w)); }
  return out;
}

// ---------- the index: every part on this computer, with the words it is found by ----------
// built in: engine/cartoon/set.js pieces and the ready moves of engine/cartoon/zc.js
const READY = [
  ['walk', 'ZC.walk(u) / b.arrive(t, { x0, x1, t0, t1 }): walks in and stops', 'walk walks arrive enter come'],
  ['run', 'ZC.run(u): a run cycle', 'run runs'],
  ['rise', 'b.rise(t, { t0, t1, down }): stands up from a seat, or sits down (down: true)', 'stand up sit down rise'],
  ['handover', 'ZC.prop + ZC.handover(thing, t, { from, to, t0, t1 }): one person gives a thing to another, both hands meet', 'give hand over pass take receive'],
  ['carry', 'ZC.carry(thing, b, side): a thing held in a hand', 'carry hold holding'],
  ['sleep', 'ZC.sleep(): lying asleep', 'sleep lie bed'],
  ['point', 'ZC.point(...): points at something', 'point show'],
  ['clap', 'ZC.clap(u): claps', 'clap applause'],
  ['wave', 'ZC.wave(u): waves', 'wave hello bye'],
  ['cheer', 'ZC.cheer(u): cheers with arms up', 'cheer celebrate'],
  ['jump', 'ZC.jump(u): a jump', 'jump'],
  ['nod', 'trim: { headPitch: ZC.nod(t, { t0, t1, times }) } on any pose: the head nods yes', 'nod nods yes agree'],
  ['head_shake', 'trim: { headYaw: ZC.headShake(t, { t0, t1, times }) } on any pose: the head shakes no', 'shake head no refuse disagree'],
  ['hold_sheet', 'r.draw({ hands: "paper" }, t) + ZC.sheet(r, { draw }) then cv.follow(): a sheet held in both hands, under the fingers, seated or standing', 'hold holding paper sheet document cv page form letter report both hands up read reading'],
  ['tap_sheet', 'r.draw({ hands: "tap" }, t) + ZC.sheet(r, { draw }) then cv.follow(): one hand holds a sheet, the other taps a line on it', 'tap taps tapping finger line paper sheet cv page document turn show point'],
  ['hands_on_table', 'r.draw({ hands: "table" }, t): forearms resting on a table, elbows at the sides', 'hands forearms resting rest table desk edge seated lap fold'],
  ['type_hands', 'r.draw({ hands: "type" }, t): typing on a laptop, waist up', 'type types typing laptop keyboard computer waist'],
  ['crowd', 'ZC.crowd(layer, { n, x0, x1, floor, H, rows, mode }): a crowd, mode = a crowd action', 'crowd people many audience'],
];
let cache = null;
export function partsIndex() {
  const dir = LIB_DIR(), stamp = [dir, ...['actions', 'gestures', 'hands', 'set', 'props', 'animals'].map((k) => { try { return fs.statSync(path.join(dir, k)).mtimeMs; } catch { return 0; } }), (() => { try { return fs.statSync(path.join(dir, 'words.json')).mtimeMs; } catch { return 0; } })()].join('|');
  if (cache?.stamp === stamp) return cache;
  const W = { aliases: {}, words: {}, places: {}, phrases: [], ...J(path.join(dir, 'words.json'), {}) };
  W.phraseRes = (W.phrases || []).map(([re, to]) => [new RegExp(re, 'gi'), to]);
  const parts = [];
  const add = (p) => parts.push({ tags: [], ...p });
  for (const f of ls(path.join(dir, 'actions'), '.json')) { const d = J(f); if (d?.id) add({ id: d.id, kind: 'action', group: d.group || '', about: String(d.about || ''), who: d.who && d.who !== 'any' ? d.who : '', seat: !!d.seat, loop: !!d.loop, seconds: d.seconds || null, aliases: d.aliases, pair: /_[ab]$/.test(d.id) ? d.id.replace(/_([ab])$/, (m, x) => `_${x === 'a' ? 'b' : 'a'}`) : null }); }
  for (const f of ls(path.join(dir, 'gestures'), '.json')) { const d = J(f); if (d?.id) add({ id: d.id, kind: 'gesture', group: d.group || 'arms', about: String(d.about || ''), on: d.on || null, aliases: d.aliases }); }
  for (const f of ls(path.join(dir, 'hands'), '.json')) { const id = path.basename(f, '.json'); add({ id, kind: 'hand', about: `hand shape ${id}` }); }
  for (const k of ['set', 'props', 'animals']) for (const f of ls(path.join(dir, k), '.js')) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/ZS\.define\(\s*["'](\w+)["']\s*,\s*(\{[^}]*\})/g)) {
      let a = {}; try { a = JSON.parse(m[2]); } catch { try { a = JSON.parse(m[2].replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":').replace(/'/g, '"').replace(/,\s*}/, '}')); } catch {} if (!a.about) { const ab = /["']?about["']?\s*:\s*["'`]([^"'`]*)/.exec(m[2]); a = { ...a, about: ab ? ab[1] : '' }; } }
      add({ id: m[1], kind: k === 'animals' || (Array.isArray(a.tags) && a.tags.includes('animal')) ? 'animal' : k === 'set' ? 'piece' : 'prop', about: String(a.about || m[1]), tags: Array.isArray(a.tags) ? a.tags.filter((t) => t !== 'extra') : [], aliases: a.aliases, lib: true });
    }
  }
  try { const req = createRequire(import.meta.url); req(path.join(ROOT, 'engine/cartoon/set.js')); for (const id of globalThis.ZS?.names || []) if (!parts.some((p) => p.id === id)) add({ id, kind: ['cup', 'phone', 'book', 'paper', 'kettle', 'laptop'].includes(id) ? 'prop' : 'piece', about: id, builtIn: true }); } catch {}
  for (const [id, about, words] of READY) add({ id, kind: 'ready', about, extra: words });
  // the generic parts earlier films on this computer kept (ZF.part)
  for (const [id, v] of Object.entries(J(process.env.ZANCUT_PARTS_FILE || path.join(DATA_DIR, 'parts.json'), {}) || {})) add({ id, kind: 'kept', about: String(v.about || id) });
  // the words each part is found by, weighted: its name and aliases count most, its description less, its group and tags least
  const df = new Map();
  for (const p of parts) {
    const al = [...(W.aliases[p.id] || []), ...(Array.isArray(p.aliases) ? p.aliases.map(String) : [])];
    p.strong = new Set([...tokens(p.id, W), ...al.flatMap((a) => tokens(a, W)), ...tokens(p.extra || '', W)]);
    p.weak = new Set([...tokens(p.about, W), ...tokens(p.group || '', W), ...p.tags.flatMap((t) => tokens(t, W))]);
    p.word = /^[a-z]+$/.test(p.id) ? stem(p.id) : null;
    const act = p.id.replace(/^sit_(?!down|floor)/, ''); // a seated move is named by what it does (sit_close_laptop = close), not by sitting
    p.verb = MOTION.has(p.kind) ? tokens(act.split(/[_A-Z]/)[0], W)[0] || null : null;
    // the words of a move's name after its verb ("scared" in run_scared); a pair's a/b and place words like "down" do not count
    p.mods = p.verb ? tokens(act.split('_').slice(1).filter((x) => !/^(a|b|c|up|down|in|out|on|off|one|two|stand|idle)$/.test(x)).join(' '), W).filter((m) => m !== p.verb) : [];
    p.phrases = [p.id.replace(/[_-]/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase(), ...al.map((a) => a.toLowerCase())].filter((x) => x.includes(' ') || /[^\x00-\x7f]/.test(x)).map((raw) => { const t = tokens(raw, W); return { raw, t: t.length > 1 ? ` ${t.join(' ')} ` : null }; });
    for (const t of new Set([...p.strong, ...p.weak])) df.set(t, (df.get(t) || 0) + 1);
  }
  const idf = (t) => Math.log(1 + parts.length / (df.get(t) || 0.5));
  cache = { stamp, W, parts, idf, byId: new Map(parts.map((p) => [p.id, p])), verbs: new Set(parts.map((p) => p.verb).filter(Boolean)) };
  return cache;
}

const MOTION = new Set(['action', 'gesture', 'ready']), THING = new Set(['piece', 'prop', 'animal', 'kept']);
// someone seated: moves that need the legs or stand them up are not offered unless the phrase asks for them; the seated ones come first
const SEATED = /\b(seated|sitting|at (?:a |the )?(?:table|desk)|in (?:a |his |her |their )?chair|behind (?:a |the )?desk)\b/i; // "sits down" is the move itself, not someone already seated
const LEGS = /^(walk|run|pace|jump|stairs|climb|kick|dance|squat|kneel|lie|trip|faint|stomp|hop|march|rest_stand|stand|lean_on|sit_down|sit_floor|rest_wait|rest_listen|queue|wait_)/;
// score every part for one phrase; ctx.who = "elderly" | "child" when the person is known
// a phrase's meaning before its words: words.json "phrases" ([pattern, meaning]) turn "lifts his head" into "look up"
function meaning(phrase, W) {
  let s = String(phrase || '');
  for (const [re, to] of W.phraseRes || []) s = s.replace(re, to);
  return s.replace(/\s+/g, ' ').trim();
}
function score(I, phrase0, ctx = {}) {
  const phrase = meaning(phrase0, I.W), q = tokens(phrase, I.W), low = String(phrase).toLowerCase();
  const who = ctx.who || (q.includes('elderly') ? 'elderly' : q.includes('child') ? 'child' : '');
  const seq = ` ${q.join(' ')} `, lead = q.find((t) => I.verbs.has(t)) || null; // the first word that names a move
  // the thing itself: the last word that is not a move or a person ("iron handcuffs" → handcuffs, "heavy chain" → chain)
  const head = [...q].reverse().find((t) => !I.verbs.has(t) && t !== 'elderly' && t !== 'child') || null;
  const qs = new Set(q.filter((t) => t !== 'elderly' && t !== 'child')); // who it is picks the variant, it is not what is done
  const seated = ctx.seated || SEATED.test(phrase);
  const out = [];
  if (!qs.size) return { q, out };
  for (const p of I.parts) {
    let s = 0, hit = 0;
    for (const t of qs) { if (p.strong.has(t)) { s += 3 * I.idf(t); hit++; } else if (p.weak.has(t)) { s += I.idf(t); hit++; } }
    const named = p.phrases.some((ph) => low.includes(ph.raw) || (ph.t && seq.includes(ph.t)));
    if (named) s += 6; // a named phrase counts once
    if (p.word && qs.has(p.word)) s += 5;
    if (p.verb && qs.has(p.verb)) s += p.verb === lead ? 7 : 3; // a move is named by its verb, the sentence's first verb most ("hangs washed clothes")            // the part's own one-word name ("bench", "cup")
    if (!s) continue;
    if (p.who) s += p.who === who ? 8 : -8;
    if (p.kind === 'prop' && p.builtIn) s -= 4;     // a library prop is drawn round its grip for the hand; the old built-in is not          // an elderly-only or child-only move fits only that person
    s *= 0.6 + 0.4 * (hit / qs.size);                 // covering more of the phrase beats one rare word
    if (p.mods?.length && !named && !(p.who && p.who === who) && !p.mods.some((m) => qs.has(m))) s *= 0.7; // "run_scared", "wait_impatient": the plain move wins unless the phrase says how
    if (seated && MOTION.has(p.kind)) { if (LEGS.test(p.id) && !named && !(p.verb && qs.has(p.verb) && !/^sit/.test(p.id))) s *= 0.3; else if (p.seat) s *= 1.3; }
    const headHit = !head || named || p.strong.has(head) || p.weak.has(head) || p.word === head;
    out.push({ p, s, cover: hit / qs.size, headHit, lead });
  }
  out.sort((a, b) => b.s - a.s);
  // the person's own variant of the same move goes first ("Dada sits down on the bench" → the elderly sit, not the general bench sit)
  if (who) {
    const top = out[0]?.p, own = top && !top.who && out.slice(1, 12).find((x) => x.s >= out[0].s * 0.45 && x.p.who === who && x.p.kind === top.kind && x.p.verb && x.p.verb === top.verb);
    if (own) { out.splice(out.indexOf(own), 1); out.unshift(own); }
  }
  return { q, out };
}
// close = use it as it is: strong, and it matches at least half of what was asked ("rest" alone is not "a finger resting on a line")
const fitOf = (s, top, cover = 1) => (s >= 9 && s >= top * 0.75 && cover >= 0.5 ? 'close' : 'near');
const useOf = (p) => ({
  action: `b.pose("${p.id}", u * 360)${p.seat ? ' (needs a seat)' : ''}${p.loop ? ' (loop)' : ''}${p.seconds ? ` ~${p.seconds}s` : ''}${p.pair ? ` (pair with ${p.pair})` : ''}`,
  gesture: `gesture: { id: "${p.id}", phase }${p.on ? ` on ${p.on.join('/')}` : ''}`,
  hand: `hand pose "${p.id}"`,
  piece: `ZS.${p.id}(layer, { x, y, h, seed, color, flip })`,
  prop: p.lib ? `ZC.prop(layer, (g) => ZS.${p.id}(g, { h }))` : `ZS.${p.id}(layer, { x, y, h })`,
  animal: `ZS.${p.id}(layer, { x, y, h, seed, color, flip, act })`,
  ready: p.about.split(':')[0],
  kept: `ZF.parts.${p.id}(layer, { x, y, h, seed, color })`,
}[p.kind]);
const short = (p) => ({ id: p.id, kind: p.kind, about: p.about.slice(0, 90), use: useOf(p) });

// one need → the best moves and things, with the near ones; none = author it
export function findParts(phrase, ctx = {}, n = 3) {
  const I = partsIndex(), { q, out } = score(I, phrase, ctx), said = new Set(q), names = (x) => x.p.mods?.some((m) => said.has(m));
  const pick = (fam) => {
    // a thing that only shares a describing word ("iron" gate for "iron handcuffs") is never close, and a weak one is dropped;
    // a phrase with no move in it ("heavy chain") is never a close move
    const all = out.filter((x) => fam.has(x.p.kind) && x.s >= 4 && (fam !== THING || x.headHit || x.s >= 6)), top = all[0];
    // the same verb on another object is another move: "closes a laptop" never offers close_door once sit_close_laptop matched
    const xs = all.filter((x) => !(top && x !== top && x.p.verb && x.p.verb === top.p.verb && names(top) && x.p.mods?.length && !names(x))).slice(0, n);
    const capped = (x) => (fam === THING ? !x.headHit : !x.lead);
    return xs.map((x, k) => ({ ...short(x.p), fit: capped(x) ? 'near' : fitOf(x.s, k === 0 ? x.s : xs[0].s, x.cover), score: Math.round(x.s * 10) / 10 }));
  };
  const motion = pick(MOTION), things = pick(THING);
  // a two-person move brings its partner
  const pair = motion.find((m) => I.byId.get(m.id)?.pair);
  if (pair) { const q = I.byId.get(I.byId.get(pair.id).pair); if (q && !motion.some((m) => m.id === q.id)) motion.push({ ...short(q), fit: pair.fit, partner: true }); }
  return { need: String(phrase).slice(0, 120), motion, things, none: !motion.length && !things.length };
}

// a place's look → the pieces that build it: the ones its words name, then the things that usually go with that kind of place
const STYLE = /\b(walls?|ceiling|floor|sky|light|lit|lighting|morning|evening|afternoon|dawn|dusk|golden|warm|cool|soft|bright|dark|pale|white|black|red|blue|green|yellow|orange|pink|purple|brown|grey|gray|palette|colou?rs?|tones?|mood|hour|glow|shadows?)\b/gi;
// a place indoors: the things that stand outdoors (trees, stalls, streets, campuses) are not offered
const INDOORS = /room\b|\b(kitchen|office|hall|ward|inside|indoors?|interior|library|lab|shop|store|cabin|chamber|clinic|pharmacy|corridor|lobby|restaurant|cafe|canteen|salon|gym|bakery|garage|warehouse|auditorium)\b/i;
const OUTSIDE = /\b(outside|outdoors?|exterior|front of|street|road)\b/i;
const GENERIC = new Set(['room', 'hall']); // a word every room shares: alone it says nothing about which room it is
const VEHICLE = /\b(car|bus|train|boat|launch|rickshaw|van|plane|ship)\b/i;
const ANY_ROOM = 'plain room'; // a room the words do not recognise still gets what any room has
const OUTDOOR = new Set(['city', 'nature', 'village', 'field', 'water', 'street', 'wild', 'sky', 'animal', 'zoo', 'insect', 'bird']);
const fitsPlace = (p, indoors) => !indoors || (!/Front$/.test(p.id) && p.id !== 'lamp' && (p.tags.includes('inside') || !p.tags.some((t) => OUTDOOR.has(t))));
export function placeParts(look, n = 14) {
  const whole = meaning(look, partsIndex().W), named = whole.replace(/([a-z])room\b/gi, '$1 room'); // "studyroom" = study room
  look = named.replace(STYLE, ' '); // the light and palette are the designer's; the things are what is searched
  const I = partsIndex(), lowTok = new Set([...tokens(look, I.W), ...tokens(whole.replace(STYLE, ' '), I.W)]), indoors = INDOORS.test(named) && !OUTSIDE.test(named);
  const fits = (id) => { const p = I.byId.get(id); return p && fitsPlace(p, indoors); };
  const direct = score(I, look.replace(/\b(room|hall)\b/gi, ' ')).out.filter((x) => THING.has(x.p.kind) && x.s >= 5 && fitsPlace(x.p, indoors)).slice(0, 8).map((x) => x.p.id);
  const groups = Object.entries(I.W.places).map(([name, ids]) => {
    const t = tokens(name, I.W), own = t.filter((w) => !GENERIC.has(w)), hit = own.filter((w) => lowTok.has(w)).length;
    const member = hit ? ids.filter((id) => direct.includes(id)).length : 0; // sharing a table with a place does not make it that place
    return { ids, s: hit * 3 + member, hit };
  }).filter((g) => g.s > 0 && g.hit).sort((a, b) => b.s - a.s).slice(0, 2);
  const base = indoors && !groups.length && !VEHICLE.test(named) ? I.W.places[ANY_ROOM] || [] : [];
  const ids = [...new Set([...groups.flatMap((g) => g.ids), ...direct, ...base])].filter(fits).slice(0, n);
  return ids.map((id) => short(I.byId.get(id)));
}

// the words a row's people bring (an elderly or a child cast member), so "Dada sits" finds the elderly sit
function whoOf(sb, row, text) {
  const cast = sb.film?.cast || [], low = String(text).toLowerCase();
  const named = cast.filter((c) => low.includes(String(c.id).toLowerCase()) || (c.name && low.includes(String(c.name).toLowerCase())));
  const pool = named.length ? named : cast.filter((c) => (row.people || []).includes(c.id));
  const ages = new Set(pool.map((c) => c.spec?.age).filter(Boolean));
  return ages.size === 1 ? ([...ages][0] === 'elderly' ? 'elderly' : [...ages][0] === 'child' ? 'child' : '') : '';
}
// a row without needs: its design's clauses are the needs (only close fits are kept from them)
const clauses = (r) => `${r.metaphor || ''}. ${r.design || ''}`.split(/[.;:\n•·]|,\s*then\s|\sthen\s/i).map((x) => x.trim()).filter((x) => x.split(/\s+/).length >= 2).slice(0, 10);

export const filmPartsFile = (J0) => path.join(J0, 'edit', 'film-parts.json');
export function buildFilmParts(sb) {
  const out = { places: {}, rows: {} };
  for (const pl of sb.film?.places || []) if (pl?.id) out.places[pl.id] = placeParts(`${pl.id.replace(/[-_]/g, ' ')} ${pl.look || ''}`);
  (sb.rows || []).forEach((r, i) => {
    if (!r || r.piece !== 'custom') return;
    const own = Array.isArray(r.needs) && r.needs.length;
    const seated = SEATED.test(`${r.show || ''} ${r.design || ''}`); // a shot of people at a table: its needs are seated, even "looks up"
    const list = (own ? r.needs : clauses(r)).map((need) => findParts(need, { who: whoOf(sb, r, need), seated }))
      .map((x) => (own ? x : { ...x, motion: x.motion.filter((m) => m.fit === 'close'), things: x.things.filter((t) => t.fit === 'close') }))
      .filter((x) => own || x.motion.length || x.things.length);
    if (list.length) out.rows[i] = list;
  });
  return out;
}
export function writeFilmParts(J0, sb) { const fp = buildFilmParts(sb); fs.mkdirSync(path.join(J0, 'edit'), { recursive: true }); fs.writeFileSync(filmPartsFile(J0), JSON.stringify(fp, null, 1)); return fp; }

// the close parts a scene's code left out: named back to its builder at the save and to the reviewer (no AI). [{ need, ids }]
const USED = { hold_sheet: /ZC\.sheet|"paper"/, tap_sheet: /ZC\.sheet|"tap"/, hands_on_table: /"table"/, type_hands: /"type"/ };
export function skippedParts(list, code = '') {
  const used = (x) => USED[x.id]?.test(code) || code.includes(`"${x.id}"`) || code.includes(`'${x.id}'`) || code.includes(`ZS.${x.id}`) || code.includes(`ZF.parts.${x.id}`);
  return (list || []).map((n) => ({ need: n.need, parts: [...(n.motion || []), ...(n.things || [])].filter((x) => x.fit === 'close') })).filter((n) => n.parts.length && !n.parts.some(used)).map((n) => ({ need: n.need, ids: n.parts.map((x) => x.id).slice(0, 3) }));
}
export const skippedText = (xs) => xs.slice(0, 5).map((x) => `"${x.need}": ${x.ids.join(' or ')}`).join('; ');

// ---------- what a prompt carries ----------
const item = (x) => `${x.id} [${x.kind}] ${x.use}${x.fit === 'near' ? ' (near)' : ''}`;
export function partsLines(list) {
  return list.map((x) => `  · "${x.need}" → ${x.none ? 'not in the library: author it' : [...x.motion, ...x.things].map(item).join(' | ')}`).join('\n');
}
export function rowPartsText(list) {
  if (!list?.length) return '';
  return `- From the library for this scene, the place to start (found by code, closest first; close = use it, near = take it and adapt it, none = author it; find_parts before you draw or key anything else):\n${partsLines(list)}\n`;
}
export function placePartsText(fp) {
  const e = Object.entries(fp?.places || {}).filter(([, xs]) => xs.length);
  if (!e.length) return '';
  return `- Library pieces found for each place (use them first, recolour to the place's palette; find_parts for anything else):\n${e.map(([id, xs]) => `  · ${id}: ${xs.map((x) => `${x.kind === 'kept' ? `ZF.parts.${x.id} (kept from an earlier film)` : x.id}${/ceiling/i.test(x.about) ? ' (hangs from y)' : /wall-mounted/i.test(x.about) ? ' (on the wall)' : ''}`).join(', ')}`).join('\n')}\nPieces take ZS.id(layer, { x, y, h, seed, color, flip }); animals also act: "idle" | "walk" | "eat" (birds "perch" | "peck" | "fly", duck "swim", buffalo "wade"), h = real height against the people; "hangs from y" pieces are drawn down from the ceiling at y; "on the wall" ones stand on y.\n`;
}
export function findPartsText(queries, ctx = {}) {
  return queries.slice(0, 12).map((q) => findParts(q, ctx, 5)).map((x) => `"${x.need}" → ${x.none ? 'nothing close: author it' : [...x.motion, ...x.things].map((y) => `${item(y)}: ${y.about}`).join('\n    ')}`).join('\n');
}
