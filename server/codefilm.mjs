// Zancut 2D, no AI: the scene file (film.json) + the voice's words → the storyboard, the shots and the plan, all by code.
// The engine (engine/cartoon) and the library draw; this file only turns the scene file into scene scripts.
//
// film.json:
// { "title": "…",
//   "cast":  { "rafi": { "gender": "male", "age": "child", "skin": 3, "hair": {"style":"crop","color":"black"}, "outfit": {"type":"tshirt","color":"#e0862b"} } },
//   "shots": [ { "at": 0,                     // second the shot starts (the voice is the clock); the next shot's "at" ends it
//                "place": "village_road", "view": "wide",
//                "people": [ { "who": "rafi", "x": -2, "dz": 1, "do": "walk", "to": 2, "face": "happy", "facing": 1, "speaks": false } ],
//                "camera": { "on": "rafi", "frame": "medium" }   // optional; default = the whole place
//            } ] }
// "do": idle · walk · run · wave · cheer · clap · point · sit · or any id from engine/cartoon/library/actions (looped or stretched).
// Physics (engine/cartoon/physics-logic.js) checks and corrects every shot before it is drawn:
//   "props":   [ { "id": "table", "x": 1, "dz": 2 }, { "id": "cup", "on": 0 }, { "id": "phone", "zone": "HELD_IN_HAND", "by": "rafi" } ]
//   "weather": "rain"   (outdoors: over the place; indoors: only through a window, window_weather_view)
//   "broll":   { "mode": "cutaway" | "pip_corner", "template": "clock_ticking" } or { "mode": …, "recipe": { backdrop, props, motion } }
//              cutaway = full frame for the first 1.5–3 s of the shot; pip_corner = a card in a corner ("corner": tr · tl · br · bl)
// Graphics (engine/cartoon/graphics-fx.js, chosen from the words by server/caption-writer.mjs unless the shot gives its own):
//   "headline": "প্রতিদিন ৩০ মিনিট হাঁটুন!"   "overlays": [ { "kind": "percentage_progress_ring", "value": 85 }, … ]
//   "camera": { "move": "slow_push_in" | "slow_pull_out" | "gentle_pan" | "impact_shake" | "over_the_shoulder" }
//   film-wide switches: "captions": false · "graphics": false · "cameraMoves": false · "broll": false (automatic corner b-roll)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ENGINE_DIR } from './config.mjs';
import { firstCutWords, jobDir, tidyStoryboard, buildPlan, placeGraphic, writeGraphic, zen } from './director.mjs';
import { resolveCreation } from './procedural-creator.mjs';
import { sanitizeShot, sanitizeFilm, ZPHYS } from './physics.mjs';
import { resolveBroll, openmojiSvg, brollFor, matchTemplate } from './broll.mjs';
import { createVisualState, selectVisualTreatment } from './visual-policy.mjs';
import { learnedPropsJS, learnedProps, learnUnknown } from './web-learner.mjs';
import { propTimes } from './beat-sync.mjs';
import { applyToShot, listRules } from './strict-rules.mjs';
import { headlineCaption, graphicsFor, cameraMoveFor, listsAcross, subtitles, captionTrack } from './caption-writer.mjs';

const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const lib = (kind, id) => J(path.join(ENGINE_DIR, 'cartoon', 'library', kind, `${id}.json`));
const BASIC = { idle: (t) => `ZC.idle(${t})`, stand: () => 'ZC.stand()', walk: (t) => `ZC.walk(${t} / 1.1)`, run: (t) => `ZC.run(${t} / 0.55)`, wave: (t) => `ZC.wave(${t})`, cheer: (t) => `ZC.cheer(${t})`, clap: (t) => `ZC.clap(${t})`, point: () => 'ZC.point()', sit: () => 'ZC.sit()' };
const MOVING = new Set(['walk', 'run']);
export const BASIC_ACTIONS = Object.keys(BASIC);
const q = (x) => JSON.stringify(x);
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);

export function validate(film) {
  const errs = [];
  if (!film || typeof film !== 'object') return ['The scene file must be a JSON object.'];
  if (!film.cast || typeof film.cast !== 'object') errs.push('"cast" must be an object (empty for a film of places only).');
  else if (!Object.keys(film.cast).length && (film.shots || []).some((x) => x.people?.length)) errs.push('"cast" needs at least one person.'); // a film of scenery only (the sea at sunset) has nobody
  for (const [id, spec] of Object.entries(film.cast || {})) try { resolveCreation(spec, { persist: false }); } catch (e) { errs.push(`Cast ${id}: ${e.message}`); }
  if (!Array.isArray(film.shots) || !film.shots.length) errs.push('"shots" needs at least one shot.');
  const places = [...fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'places-kit.js'), 'utf8').matchAll(/ZF\.place\("(\w+)"/g)].map((m) => m[1]);
  (film.shots || []).forEach((s, i) => {
    if (!places.includes(s.place)) errs.push(`Shot ${i + 1}: place "${s.place}" is not ready. Ready places: ${places.join(', ')}.`);
    for (const p of s.people || []) {
      if (!film.cast?.[p.who]) errs.push(`Shot ${i + 1}: "${p.who}" is not in the cast.`);
      if (p.do && !BASIC[p.do] && !lib('actions', p.do)) errs.push(`Shot ${i + 1}: action "${p.do}" is not in the library.`);
    }
    for (const pr of s.props || []) if (!pieceExists(pr?.id)) errs.push(`Shot ${i + 1}: prop "${pr?.id}" is not a library piece.`);
    if (s.weather && !WEATHER_KINDS.includes(typeof s.weather === 'string' ? s.weather : s.weather.kind)) errs.push(`Shot ${i + 1}: weather must be one of ${WEATHER_KINDS.join(', ')}.`);
    if (s.camera?.move && !CAMERA_MOVES.includes(s.camera.move)) errs.push(`Shot ${i + 1}: camera move "${s.camera.move}" must be one of ${CAMERA_MOVES.join(', ')}.`);
    for (const o of s.overlays || []) if (!FX_KINDS.includes(o?.kind)) errs.push(`Shot ${i + 1}: overlay "${o?.kind}" is not one of ${FX_KINDS.join(', ')}.`);
    if (s.headline != null && (typeof s.headline !== 'string' || [...s.headline].length > 60)) errs.push(`Shot ${i + 1}: a headline is a short text (at most 60 characters).`);
    if (s.broll) try { resolveBroll(s.broll); if (s.broll.mode && !['cutaway', 'pip_corner'].includes(s.broll.mode)) errs.push(`Shot ${i + 1}: b-roll mode must be cutaway or pip_corner.`); } catch (e) { errs.push(`Shot ${i + 1}: ${e.message}`); }
  });
  return errs;
}
const WEATHER_KINDS = ['rain', 'storm', 'clouds', 'fog'];
const CAMERA_MOVES = ['slow_push_in', 'slow_pull_out', 'gentle_pan', 'impact_shake', 'over_the_shoulder', 'steady']; // steady: the owner chose no move
const FX_KINDS = ['dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card', 'thought_cloud', 'comic_emotion_fx'];
const ATTACHED = ['thought_cloud', 'comic_emotion_fx'];
// the words of a shot → its headline, overlays and camera move (only what the scene file did not already decide)
// the brain's hints (shot.brain from Brain v2: what the owner taught wins over the built-in rules when it is confident)
const hinted = (s, h, min) => (s.brain?.[h]?.conf >= min ? s.brain[h].label : null);
export function autoGraphics(shot, text, { corpus = [], list = null, film = {} } = {}) {
  const s = JSON.parse(JSON.stringify(shot)), who = s.camera?.on || s.people?.[0]?.who;
  if (film.graphics !== false && text) {
    if (s.headline == null) { const h = headlineCaption(text, { corpus }); if (h.rule !== 'keywords' || text.split(/\s+/).length >= 6) s.headline = h.text; }
    if (!s.overlays) {
      let o = graphicsFor(text, { corpus, list }).map((g) => (ATTACHED.includes(g.kind) ? { ...g, on: who } : g)).filter((g) => !ATTACHED.includes(g.kind) || g.on);
      const g = hinted(s, 'graphic', 0.6); // the rules extract the numbers; the brain decides which graphic, if any, is wanted
      if (g === 'none' && hinted(s, 'graphic', 0.8)) o = o.filter((x) => ATTACHED.includes(x.kind) && x.kind !== 'thought_cloud');
      else if (g && g !== 'none' && o.some((x) => x.kind === g)) o = o.filter((x) => x.kind === g || (ATTACHED.includes(x.kind) && g !== x.kind && x.kind === 'comic_emotion_fx'));
      s.overlays = o;
    }
  }
  // b-roll: a corner card under the headline when a template matches the words and no data card is already on screen
  const subjectDrawn = !s.people?.length && (s.props || []).some((p) => p.word); // the thing the words name is drawn in the scene itself: no card over it
  if (film.broll !== false && text && s.broll == null && !subjectDrawn && !(s.overlays || []).some((o) => !ATTACHED.includes(o.kind))) {
    // the brain's b-roll guess is used when the sentence's own words back it (or the brain is ≥ 90 % sure); an establishing shot shows the place
    const hb0 = hinted(s, 'broll', 0.6), mode = s.people?.length ? 'pip_corner' : 'cutaway', said = matchTemplate(text)?.id;
    const hb = hb0 && hb0 !== 'none' && hb0 !== 'compose_custom_recipe' && hb0 !== said && !hinted(s, 'broll', 0.9) ? null : hb0;
    if (s.camera?.kind === 'establish') return cameraOnly(s, text, film);
    const b = hb === 'none' ? null : hb && hb !== 'compose_custom_recipe' ? { mode, template: hb } : brollFor(text, { mode, recipes: !s.people?.length || hb === 'compose_custom_recipe' });
    if (b) s.broll = { mode: b.mode, ...(b.template ? { template: b.template } : { recipe: b.recipe }), ...(b.mode === 'pip_corner' ? { corner: 'tr', top: 0.17 } : {}) };
  }
  return cameraOnly(s, text, film);
}
function cameraOnly(s, text, film) {
  if (film.cameraMoves !== false && text && !s.camera?.move) { const hm = hinted(s, 'cameraMove', 0.6), m = hm ? (hm === 'steady' ? null : hm) : cameraMoveFor(text, { people: (s.people || []).length }); if (m && (m !== 'over_the_shoulder' || (s.people || []).length >= 2)) s.camera = { ...(s.camera || {}), move: m }; }
  return s;
}
const SET_SRC = fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'set.js'), 'utf8');
export const pieceExists = (id) => typeof id === 'string' && /^[A-Za-z][\w]*$/.test(id) && (!!learnedProps()[id] || fs.existsSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'set', `${id}.js`)) || fs.existsSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'props', `${id}.js`)) || new RegExp(`\\n\\s+${id}\\(layer`).test(SET_SRC));
const qs = (x) => q(x).replace(/<\//g, '<\\/'); // safe inside a <script>
// The physical world of a shot (already corrected by ZPHYS): its props, its weather and its b-roll, as scene-script code.
function worldCode(shot, people, ids) {
  const setup = [], tick = [], after = [];
  // surfaces before what rests on them (a table-top prop may come first in the list), each keeping its own index in PR
  const propOrder = (shot.props || []).map((p, i) => [p, i]).sort((a, b) => (a[0].zone === ZPHYS.ZONES.TABLE_TOP) - (b[0].zone === ZPHYS.ZONES.TABLE_TOP));
  propOrder.forEach(([p, i]) => {
    const Zn = ZPHYS.ZONES, m = num(p.m, 0.5), x = num(p.x), dz = num(p.dz, 1.5);
    if (p.zone === Zn.SKY_FLOATING) setup.push(`PR[${i}] = ZPHYS.drawAt(W.layer("sky"), ${q(p.id)}, W.w * ${(0.5 + x / 7).toFixed(3)}, P.Z.horizon * 0.55, Math.max(40, ${m} * P.Z.at(0, 30).s), ${i + 3});`);
    else if (p.zone === Zn.TABLE_TOP && Number.isInteger(p.on)) setup.push(`{ const sf = PR[${p.on}], top = P.Z.contact(sf, "top"), sc = P.Z.at(sf.world.x, sf.world.dz).s; PR[${i}] = ZPHYS.drawAt(sf.parentNode || P.layer, ${q(p.id)}, top.x, top.y, ${m} * sc, ${i + 3}); }`);
    else if (p.zone === Zn.HELD_IN_HAND && people.some((q0) => q0.who === p.by) && ids[people.findIndex((q0) => q0.who === p.by)]) {
      const a = ids[people.findIndex((q0) => q0.who === p.by)], pi = people.findIndex((q0) => q0.who === p.by);
      const options = p.id === 'bookHeld' ? { open: p.open === true || people[pi].gesture === 'read_book' || people[pi].do === 'read_book' } : {};
      setup.push(`PR[${i}] = ZPHYS.drawAt(ZC.el("g", {}, W.layer("front")), ${q(p.id)}, 0, 0, ${m} * P.Z.at(${num(people[pi].x)} * K, ${num(people[pi].dz, 1)}).s, ${i + 3}, ${q(options)});`);
      after.push(`{ const hd = ${a}.handAt(1); PR[${i}].parentNode.setAttribute("transform", \`translate(\${hd.x} \${hd.y})\`); }`);
    } else setup.push(`PR[${i}] = P.Z.put(${q(p.id)}, P.layer, { x: ${x} * K, dz: ${dz}, m: ${m}, seed: ${i + 3} });`);
    tick.push(`PR[${i}]?.tick?.(t);`);
    // beat sync: a prop the words name appears when its word is spoken (a 0.25 s fade-and-rise), not before
    if (p.at != null && num(p.at) > 0.05) tick.push(`{ const n = PR[${i}]?.setAttribute ? PR[${i}] : null, u = Math.max(0, Math.min(1, (t - ${num(p.at)}) / 0.25)); if (n) { n.setAttribute("opacity", u.toFixed(3)); n.style.translate = \`0 \${((1 - u) * 18).toFixed(1)}px\`; } }`);
  });
  const w = shot.weather;
  if (w && w.view === 'window_weather_view') {
    setup.push(`const WIN = P.Z.put("window", W.layer("far"), { x: -3.2 * K, dz: 5.5 }), wb = (WIN.parentNode || WIN).getBBox(), /* the depth slot has no transform: layer coordinates */ glass = { x: wb.x + wb.width * 0.16, y: wb.y + wb.height * 0.14, w: wb.width * 0.68, h: wb.height * 0.6 };
const wcid = W.idp + "wv", wcp = ZC.el("clipPath", { id: wcid }, W.defs); ZC.el("rect", { x: glass.x, y: glass.y, width: glass.w, height: glass.h }, wcp);
const WV = ZC.el("g", { "clip-path": \`url(#\${wcid})\`, "data-weather": ${q(w.kind)}, "data-weather-view": "window_weather_view" }, W.layer("far"));`);
    tick.push(`{ WV.replaceChildren(); ZC.el("rect", { x: glass.x, y: glass.y, width: glass.w, height: glass.h, fill: "#5d6b7c", opacity: 0.55 }, WV); const streaks = [];
  for (let i = 0; i < 26; i++) { const fx = ((i * 0.381966) % 1), x = glass.x + fx * glass.w, y = glass.y + ((((i * 0.618034) % 1) * glass.h + t * glass.h * 1.6) % glass.h); ZC.el("path", { d: \`M\${x},\${y} l-3,\${glass.h * 0.08}\`, stroke: "#d6e2ee", "stroke-width": 2, opacity: 0.8 }, WV); streaks.push({ x, y }); }
  (window.__weather ||= {})[W.idp] = { kind: ${q(w.kind)}, view: "window_weather_view", glass, streaks }; }`);
  } else if (w) {
    setup.push(`ZC.el("rect", { x: -W.w, y: -W.h, width: W.w * 3, height: W.h * 3, fill: "#44505e", opacity: ${w.kind === 'fog' ? 0 : 0.3} }, W.layer("sky"));
const RAIN = ${['rain', 'storm'].includes(w.kind) ? 'Array.from({ length: 5 }, (_, i) => ZS.rainfall(W.layer("front"), { x: W.w * (i - 0.5) / 2.5, y: W.h * 1.05, h: W.h * 1.15, seed: i + 1 }))' : '[]'};
${w.kind === 'fog' ? 'ZC.el("rect", { x: -W.w, y: -W.h, width: W.w * 3, height: W.h * 3, fill: "#eef1f4", opacity: 0.35 }, W.layer("front"));' : ''}`);
    tick.push(`RAIN.forEach((r) => r.tick?.(t)); (window.__weather ||= {})[W.idp] = { kind: ${q(w.kind)}, view: "sky", drops: RAIN.length };`);
  }
  if (shot.broll) {
    const b = resolveBroll(shot.broll);
    setup.push(`const BR = ZBROLL.mount(W, ${qs(b.spec)}, { mode: ${q(b.mode)}, corner: ${q(b.corner)}${b.seconds != null ? `, seconds: ${num(b.seconds)}` : ''}${b.top != null ? `, top: ${num(b.top)}` : ''} });`);
    after.push('BR.tick(t, d);');
  }
  if (shot.headline || shot.overlays?.length) {
    const overlays = (shot.overlays || []).map((o) => { const m = /^openmoji:([0-9A-F-]+)$/.exec(o.icon || ''); return m ? { ...o, svg: openmojiSvg(m[1]) } : o; });
    const actors = people.map((p0, i) => ids[i] ? `${q(p0.who)}: ${ids[i]}` : null).filter(Boolean).join(', ');
    setup.push(`const FX = ZFX.mount(W, ${qs({ headline: shot.headline || null, overlays })}, { actors: { ${actors} } });`);
    after.push('FX.tick(t, d);');
  }
  return { setup: (setup.length ? 'const PR = [];\n' : '') + setup.join('\n'), tick: tick.join(' '), after: after.join(' ') };
}
export const placeIds = () => [...fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'places-kit.js'), 'utf8').matchAll(/ZF\.place\("(\w+)"/g)].map((m) => m[1]);

// one shot → the scene script (runs after ZK.unit(root); tl, root, s, d, words are given).
// camera.kind (learned from the reference films: mostly medium and close shots, a place shot at a scene change, two-shots for pairs):
//   establish = the place alone, slow pan · wide = the place, or a full-body acting shot when focused on one standing person
//   two = the first two people framed together · single = one person, knees up
//   close = one person waist-up (the waist-up rig, never a zoomed full body) · default: wide
const HANDS = { wave: 'wave', cheer: 'cheer', clap: 'clap', point: 'point' };
// Standing actors use short, anchored library gestures, including close and short shots; face chooses the acting vocabulary.
const SAFE = (() => { try { return JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, '..', 'brain', 'gestures-gate.json'), 'utf8')).ok; } catch { return null; } })(); // gestures the body gate passed on a standing person (scripts/gesture-sweep.mjs)
// How much body a move uses (engine/cartoon/library/gesture-energy.json). The voice is playing in every shot: whoever talks acts
// with small conversational hands at a damped amount, with a breath of rest between moves; a listener mostly rests. Nothing big
// cycles on a loop (the old phrases chained thumbs-up → open-arm hug → explain for a whole shot: arms flying while someone talks).
export const ENERGY = JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'gesture-energy.json'), 'utf8'));
const CALM = new Set(ENERGY.CONVERSATIONAL_SAFE);
const IDLE_GESTURES = { neutral: ['talk_explain', 'count_fingers', 'hand_on_chest', 'ask_what_why'], happy: ['talk_explain', 'hand_on_chest', 'count_fingers'], worried: ['ask_what_why', 'chin_think', 'rub_hands'], sad: ['hand_on_chest', 'chin_think'], surprised: ['ask_what_why', 'talk_explain'], angry: ['finger_wag', 'talk_explain'] };
const LISTEN_GESTURES = { neutral: ['chin_think', 'hand_on_chest'], happy: ['hand_on_chest'], worried: ['chin_think', 'rub_hands'], sad: ['hand_on_chest'], surprised: ['chin_think'], angry: ['chin_think'] };
// who talks in a shot: an explicit "speaks" wins; when the shot says nothing about it, its focus (camera.on, else the first
// person) voices the line (narration too). film.lipSync === false: nobody.
export function talkersOf(shot, people, film = {}) {
  if (film.lipSync === false || !people.length) return new Set();
  if (people.some((p) => p.speaks != null)) return new Set(people.filter((p) => p.speaks).map((p) => p.who));
  return new Set([(people.find((p) => p.who === shot.camera?.on) || people[0]).who]);
}
// Custom creations are drawn straight-on (front projection), so a hand pushed toward the camera reads as a stiff "robot arm"
// (body gate A1, which spans from the first to the last frame a hand is > 35 U in front of its shoulder, so even a quick raise
// counts). Every gesture here was measured on all four profiles at its in-shot durations: the hand never passes 33.1 U.
const FRONT_IDLE_GESTURES = { neutral: ['chin_think', 'scratch_head'], happy: ['scratch_head', 'chin_think'], worried: ['scratch_head', 'chin_think'], sad: ['chin_think'], surprised: ['chin_think'], angry: ['scratch_head'] };
const gestureFor = (p, seed, front = false, talking = false) => { const lists = front ? FRONT_IDLE_GESTURES : talking ? IDLE_GESTURES : LISTEN_GESTURES, list = (lists[p.face] || lists.neutral).filter((g) => CALM.has(g) && lib('gestures', g) && (SAFE ? SAFE.includes(g) : ['check_watch', 'hand_on_chest'].includes(g))); return list.length ? [...list.slice(seed % list.length), ...list.slice(0, seed % list.length)] : null; };
const idleGesture = (p, shot, i, front = false, talking = false) => ['idle', 'stand'].includes(p.do || 'idle') && p.gesture !== false ? (typeof p.gesture === 'string' ? p.gesture : gestureFor(p, i + Math.round(num(shot.at) * 10), front, talking)) : null;
// an explicit (planned) gesture plays at full size once; the automatic acting is damped and rests between moves
const actingOf = (p, talking) => (typeof p.gesture === 'string' ? { amount: CALM.has(p.gesture) && talking ? Math.max(0.6, ENERGY.talkAmount) : 1, rest: 0.6 } : talking ? { amount: ENERGY.talkAmount, rest: 1.1 } : { amount: ENERGY.listenAmount, rest: 2.4 });
const gestureCode = (who, ids, { amount = 1, rest = 0.18 } = {}) => {
  const sequence = (Array.isArray(ids) ? ids : [ids]).map(id => [id, num(lib('gestures', id)?.seconds, 1.6) * 1.35]);
  // A deterministic phrase of related gestures, each followed by a rest (the feet stay planted, the arms come back down);
  // amount < 1 plays the same move smaller (talking hands, ENERGY.talkAmount).
  return `(() => { const phrase = ${q(sequence)}.map(([id, secs]) => [id, Math.min(secs, Math.max(0.5, d - 0.36))]), gap = ${num(rest, 0.18)}, period = phrase.reduce((n, [, secs]) => n + secs + gap, 0), cycle = Math.floor(Math.max(0, t - 0.18) / period); let start = 0.18 + cycle * period; for (const [id, secs] of phrase) { if (t < start + secs + gap) return ${who}.gesture(id, t, { start, duration: secs, amount: ${num(amount, 1)} }); start += secs + gap; } return ${who}.gesture(phrase[0][0], t, { start, duration: phrase[0][1], amount: ${num(amount, 1)} }); })()`;
};
export function shotScript(shot0, film) {
  const shot = sanitizeShot(shot0).shot; // gravity, real sizes, indoor/outdoor, supports, facing
  let kind = shot.camera?.kind || (shot.camera?.on ? 'single' : 'wide');
  const people = kind === 'establish' ? [] : shot.people || [], custom = p => { const s = film.cast?.[p?.who]; return !!(s?.description || s?.creation || s?.dna); };
  const focusIdx = Math.max(0, people.findIndex((p) => p.who === shot.camera?.on));
  if (kind === 'close' && custom(people[focusIdx])) kind = 'single'; // keep fantasy heads/wings/held props in a full rig
  const night = !!shot.night || shot.timeOfDay === 'night';
  if (kind === 'close' && people.length) {
    const wc = worldCode({ ...shot, props: (shot.props || []).filter((x) => x.zone !== ZPHYS.ZONES.HELD_IN_HAND) }, [people[focusIdx]], ['r']);
    const p = people[focusIdx], facing = num(p.facing, 1) < 0 ? -1 : 1, act = HANDS[p.do] || 'rest', talks = talkersOf(shot, [p], film).has(p.who);
    const gesture = idleGesture(p, shot, focusIdx, false, talks), movement = gesture ? `...${gestureCode('r', gesture, actingOf(p, talks))}, ` : lib('actions', p.do) ? `...r.pose(${q(p.do)}, Math.min(1, t / ${num(lib('actions', p.do)?.seconds, 2)}) * 360), ` : `hands: ${q(act)}, `;
    return `const W = ZC.world(root), P = ZC.place(${q(shot.place)}, W, { view: ${q(shot.view || 'wide')}, blur: 5, night: ${night}, timeOfDay: ${q(['dawn', 'sunset'].includes(shot.time) ? shot.time : night ? 'night' : 'day')} });
const S = W.h / 1080, r = ZC.person(W.layer("front"), { spec: ZF.cast[${q(p.who)}], x: W.w * ${(0.5 - 0.16 * facing).toFixed(2)}, y: W.h * 0.46, scale: 1.45 * S }), K = 1;
${wc.setup}
ZC.clock(tl, s, d, (t) => {
    P.tick(t); ${wc.tick} W.cam(W.w / 2, W.h / 2, W.w * 0.82 - t * 6);${shot.camera?.move && !['over_the_shoulder', 'steady'].includes(shot.camera.move) ? ` ZC.cameraMove(W, ${q(shot.camera.move)}, t, d);` : ''} ${wc.after}
    r.draw({ ${movement}face: ${q(p.face || 'neutral')}, turn: ${(0.35 * facing).toFixed(2)}, look: ${(0.3 * facing).toFixed(2)}${talks ? ', ...ZC.lip(t + s, words)' : ''} }, t);
});`;
  }
  const ids = people.map((_, i) => `a${i}`), talkers = talkersOf(shot, people, film);
  // Three-quarter standing acting keeps both hands visible; a pure profile hid most of the far arm. Explicit views win.
  const setup = people.map((p, i) => `{ const at = P.Z.person(ZF.cast[${q(p.who)}], { x: ${num(p.x)} * K, dz: ${num(p.dz, 1)}, layer: P.layer }); ${ids[i]} = ${custom(p) ? 'ZCUSTOM' : 'ZC'}.actor(at.slot, { ${custom(p) ? `id: ${q('cast-' + p.who)}, ` : ''}spec: ZF.cast[${q(p.who)}], ...at, view: ${q(p.view || (idleGesture(p, shot, i, custom(p)) ? 'three' : 'side'))}, facing: ${num(p.facing, 1) < 0 ? -1 : 1} }); }`).join('\n');
  // A focused standing actor needs a readable head-to-feet shot. Lock the camera to their neutral pose, so breathing/acting
  // never moves the camera. Unfocused place views, groups and travel shots retain their existing wider composition.
  const focusedStand = kind === 'wide' && people.length === 1 && shot.camera?.on === people[0].who && ['idle', 'stand'].includes(people[0].do || 'idle');
  const cameraSetup = focusedStand ? `a0.draw(a0.pose("stand", 0), { alive: false }); const actingCamera = ZC.frameOf(W, a0, ${q(shot.camera?.frame || 'full')});` : '';
  const draw = people.map((p, i) => {
    const act = p.do || 'idle', moving = MOVING.has(act), to = p.to != null ? num(p.to) : num(p.x);
    const posOf = `P.Z.at(${num(p.x)} * K, ${num(p.dz, 1)})`;
    let pose; const talks = talkers.has(p.who), gest = idleGesture(p, shot, i, custom(p), talks);
    if (gest) pose = gestureCode(ids[i], gest, actingOf(p, talks));
    else if (BASIC[act]) pose = BASIC[act]('t');
    else { const a = lib('actions', act) || {}, secs = num(a.seconds, 2); pose = `${ids[i]}.pose(${q(act)}, ${a.loop ? `((t / ${secs}) % 1) * 360` : `Math.min(1, t / Math.max(0.3, Math.min(d, ${secs}))) * 360`})`; }
    // R11 (server/qa.mjs): seated in the last shot, on their feet in this one (or back) → 0.35 s blend from that posture
    if (p.blendFrom && !moving && !(['sit', 'sleep', 'squat'].includes(p.blendFrom) !== ['sit', 'sleep', 'squat'].includes(act) && (p.blendFrom === 'sit' || act === 'sit') && !custom(p))) pose = `((to) => { const T = (x) => (x && x.joints ? x : ${ids[i]}.pose(x.posture || 'stand', x.phase ?? 35, x)); return t < 0.35 ? ${ids[i]}.blend(${ids[i]}.pose(${q(p.blendFrom)}, 35), T(to), t / 0.35) : to; })(${pose})`;
    const facing = num(p.facing, moving && to < num(p.x) ? -1 : 1) < 0 ? -1 : 1;
    const face = p.face ? `, face: ${q(p.face)}` : '', mouth = talks ? ', ...ZC.lip(t + s, words)' : '';
    // travelling: the steps come from the distance covered on this person's own legs (ZPHYS.travel), so the feet never slide
    if (moving) return `{ const tr = ZPHYS.travel(${ids[i]}, { from: P.Z.at(${num(p.x)} * K, ${num(p.dz, 1)}), to: P.Z.at(${to} * K, ${num(p.dz, 1)}), t0: 0, t1: Math.max(0.5, d - 0.2), kind: ${q(act)} }, t); ${ids[i]}.draw(tr.pose, { x: tr.x, floor: tr.y, facing: tr.facing, center: { x: 0, y: 0, z: 0 }${face}${mouth} }); }`;
    // seated in the last shot, standing now (or the reverse): the engine's own rise — weight forward, then up, feet planted
    const SEAT = ['sit', 'sleep', 'squat'], rises = p.blendFrom && !custom(p) && SEAT.includes(p.blendFrom) !== SEAT.includes(act) && (p.blendFrom === 'sit' || act === 'sit');
    if (rises) return `{ const at = ${posOf}; if (t < 0.6) ${ids[i]}.rise(t, { t0: 0, t1: 0.6${act === 'sit' ? ', down: true' : ''} }, { x: at.x, floor: at.y, facing: ${facing}${face}${mouth} }); else ${ids[i]}.draw(${act === 'sit' ? `${ids[i]}.pose('sit', 35, { props: false })` : pose}, { x: at.x, floor: at.y, facing: ${facing}${face}${mouth} }); }`;
    return `{ const at = ${posOf}; ${ids[i]}.draw(${pose}, { x: at.x, floor: at.y, facing: ${facing}${face}${mouth} }); }`;
  }).join('\n    ');
  let cam = 'W.cam(W.w / 2, W.h / 2, W.w);';
  if (focusedStand) cam = 'W.cam(...actingCamera);';
  else if (kind === 'establish') cam = 'W.cam(W.w / 2 - W.w * 0.06 + t * W.w * 0.03, W.h / 2, W.w * 0.92);';
  else if (kind === 'two' && ids.length >= 2) cam = `ZC.twoShot(W, a0, a1, "full");`;
  else if (kind === 'single' && ids.length) { const f = num(people[focusIdx]?.facing, 1) < 0 ? -1 : 1; cam = `ZC.frame(W, ${ids[focusIdx]}, ${q(shot.camera?.frame || (custom(people[focusIdx]) ? 'full' : 'mediumWide'))}, { x: ${f > 0 ? 0.42 : 0.58} });`; } // the face a little off centre, room in front of it (not pushed to the frame edge)
  const wc = worldCode(shot, people, ids), mv = shot.camera?.move === 'steady' ? null : shot.camera?.move;
  const other = people.findIndex((p0, i) => i !== focusIdx);
  if (mv) cam += ` ZC.cameraMove(W, ${q(mv)}, t, d${ids.length ? `, { on: ${ids[focusIdx]}${other >= 0 ? `, other: ${ids[other]}` : ''} }` : ''});`;
  if (shot.headline && ids.length && kind !== 'establish') cam += ` ZC.headroom(W, [${ids.join(', ')}]);`; // no face under the headline
  // a true over-the-shoulder: the listener is drawn nearer the camera, from behind and softly blurred, at the frame's near edge
  const ots = mv === 'over_the_shoulder' && other >= 0 && !custom(people[other]);
  if (ots) cam += ` OTS ||= ZC.ots(W.layer("near", { blur: 2 }), { spec: ZF.cast[${q(people[other].who)}], of: ${ids[focusIdx]}, side: ${ids[other]}.box().x < ${ids[focusIdx]}.box().x ? "left" : "right", x: ${ids[other]}.box().x, near: 1.3, posture: "stand", phase: 35 }); OTS.draw(t);`;
  return `const W = ZC.world(root), P = ZC.place(${q(shot.place)}, W, { view: ${q(shot.view || 'wide')}, night: ${night}, timeOfDay: ${q(['dawn', 'sunset'].includes(shot.time) ? shot.time : night ? 'night' : 'day')} });
const K = Math.min(1, (W.w / W.h) / 0.6 / 2.8); // positions are written for 16:9 (±2.8 m); a narrower frame squeezes them in
let ${ids.join(', ') || '_n'}${ots ? ', OTS = null' : ''};
${setup}
${ots ? `${ids[other]}.show(false);` : ''}
${wc.setup}
${cameraSetup}
ZC.clock(tl, s, d, (t) => {
    P.tick(t); ${wc.tick}
    ${draw}
    ${cam}
    ${wc.after}
});`;
}

// the film's kit: its cast + the ready places
// the voice's loudness at 30 fps (RMS, 0..1 against its own 95th percentile): the lip-sync's clock (ZC.lip). null = no voice file.
export function voiceEnvelope(file, fps = 30) {
  if (!file || !fs.existsSync(file)) return null;
  const sr = 16000, r = spawnSync('ffmpeg', ['-v', 'error', '-i', file, '-vn', '-ac', '1', '-ar', String(sr), '-f', 's16le', '-'], { maxBuffer: 1 << 28 });
  if (r.status !== 0 || !r.stdout?.length) return null;
  const pcm = new Int16Array(r.stdout.buffer, r.stdout.byteOffset, Math.floor(r.stdout.length / 2)), hop = sr / fps, n = Math.floor(pcm.length / hop), raw = new Float64Array(n);
  for (let i = 0; i < n; i++) { let e = 0; const a = Math.floor(i * hop), b = Math.floor((i + 1) * hop); for (let k = a; k < b; k++) e += pcm[k] * pcm[k]; raw[i] = Math.sqrt(e / Math.max(1, b - a)); }
  const sorted = [...raw].sort((x, y) => x - y), ref = sorted[Math.floor(n * 0.95)] || 1, low = sorted[Math.floor(n * 0.2)] || 0;
  // no voice in it: quieter than −40 dBFS (room tone, a silent track), or flat noise with no pauses → the words' times drive the mouth
  if (ref < 328 || ref < low * 1.6) return null;
  return { fps, env: Array.from(raw, (x) => Math.round(Math.min(1, x / ref) * 100) / 100) };
}
export function kitFor(film) {
  const cast = Object.fromEntries(Object.entries(film.cast).map(([id,spec]) => { const creation = resolveCreation(spec); return [id,creation ? {...spec,dna:creation.dna,creation:creation.id} : spec]; }));
  return `ZF.cast = ${JSON.stringify(cast)};\n${film.__voice ? `globalThis.ZVOICE = ${JSON.stringify(film.__voice)};\n` : ''}${fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'places-kit.js'), 'utf8')}${learnedPropsJS()}`;
}

export async function build(d, p, film, { step = () => {} } = {}) {
  const errs = validate(film); if (errs.length) throw Object.assign(new Error(errs.join(' ')), { customer: true });
  const J0 = jobDir(d.ws), words = firstCutWords(J0);
  if (!words.length) throw Object.assign(new Error('The voice has no words yet.'), { customer: true });
  step('Turning the scene file into shots (no AI)');
  const dur = words.at(-1)?.end ?? 0, phys = sanitizeFilm(film, { duration: dur }); film = phys.film;
  let voiceEnv = null;
  { const v = (p.assets || []).find((a) => a.role === 'voiceover'), env = v && d.assets ? voiceEnvelope(path.join(d.assets, v.file)) : null; // lip-sync clock
    voiceEnv = env;
    fs.mkdirSync(path.join(J0, 'work'), { recursive: true }); fs.writeFileSync(path.join(J0, 'work', 'lipsync.json'), JSON.stringify({ voice: !!env, frames: env?.env.length || 0, voiced: env ? env.env.filter((x) => x > 0.07).length : 0 })); }
  fs.mkdirSync(path.join(J0, 'work'), { recursive: true }); fs.writeFileSync(path.join(J0, 'work', 'physics.json'), JSON.stringify({ fixes: phys.fixes }, null, 1));
  if (phys.fixes.length) step(`Physics corrected ${phys.fixes.length} thing${phys.fixes.length > 1 ? 's' : ''} (work/physics.json)`);
  // the 12-rule QA (server/qa.mjs) inspects and repairs the scene file before anything is drawn; what it did → work/qa.json
  { const { repair: qaRepair } = await import('./qa.mjs'), q = qaRepair(film, { duration: dur }); film = q.film; fs.writeFileSync(path.join(J0, 'work', 'qa.json'), JSON.stringify({ repairs: q.log, remaining: q.remaining.map(({ repair, ...i }) => i) }, null, 1));
  Object.defineProperty(film, '__voice', { value: voiceEnv, enumerable: false, writable: true }); // after the repairs (they copy the film)
    const n = q.log.filter((x) => x.result === 'applied').length; if (n) step(`QA repaired ${n} thing${n > 1 ? 's' : ''} (work/qa.json)`); }
  const shots = [...film.shots].sort((a, b) => num(a.at) - num(b.at));
  const first = shots.map((s) => { const k = words.findIndex((w) => (w.start ?? w.t ?? 0) >= num(s.at) - 0.05); return k < 0 ? words.length - 1 : k; });
  const rows = shots.map((s, i) => ({ from: i === 0 ? 0 : first[i], to: i + 1 < shots.length ? Math.max(first[i], first[i + 1] - 1) : words.length - 1, piece: 'custom', say: words.slice(first[i], (first[i + 1] ?? words.length)).map((w) => w.text).join(' '), idea: s.place, transition: 'cut', archetype: 1, bgStage: 'none' }));
  const sb = tidyStoryboard(p, { video: { mood: 'calm', captions: film.captions === false ? 'off' : 'on' }, rows, film: { cast: Object.entries(film.cast).map(([id, spec]) => ({ id, spec })) } }, words.length);
  if (!sb) throw new Error('No shots could be placed on the voice.');
  fs.mkdirSync(path.join(J0, 'edit'), { recursive: true }); fs.mkdirSync(path.join(J0, 'work'), { recursive: true });
  fs.writeFileSync(path.join(J0, 'edit', 'film-kit.js'), kitFor(film));
  fs.writeFileSync(path.join(J0, 'work', 'storyboard.json'), JSON.stringify(sb, null, 1));
  step('Cutting the voice and planning the timeline');
  await buildPlan(d, p, sb, { step, ask: async () => null, runQuery: null });
  setMusic(J0, film);
  // captions (word-synced, from the caption writer) and each shot's headline / graphics / camera move from its own words
  const track = captionTrack(words); fs.writeFileSync(path.join(J0, 'work', 'captions.json'), JSON.stringify(track, null, 1));
  if (film.captions !== false) { const pf = path.join(J0, 'edit', 'plan.json'), plan = J(pf, {}); plan.captions = { ...(plan.captions || {}), on: true, chunks: track.subtitles.map((c) => ({ s: c.s, e: c.e })) }; fs.writeFileSync(pf, JSON.stringify(plan, null, 1)); }
  const says = sb.rows.map((r) => words.slice(r.from, r.to + 1).map((w) => w.text).join(' ')), lists = listsAcross(says);
  // unknown words are learned (local first, the open web only when allowed) so their props can be drawn; then the kit is rewritten
  if (film.learn !== false) { const learned = await learnUnknown(says, { online: film.learn === true || film.learnOnline === true, max: 4 }); if (learned.length) { step(`Learned ${learned.length} new word${learned.length > 1 ? 's' : ''}: ${learned.map((x) => x.term).join(', ')}`); fs.writeFileSync(path.join(J0, 'edit', 'film-kit.js'), kitFor(film)); } }
  const auto = [], rulesNow = listRules(), fired = [], visualState = createVisualState(sb.rows.length); // story-level repetition memory
  sb.rows.forEach((r, i) => {
    const explicit = shots[i] || shots.at(-1);
    const shot = propTimes(selectVisualTreatment(autoGraphics(explicit, says[i], { corpus: says, list: lists[i], film }), says[i], { state: visualState, film, explicit }), words.slice(r.from, r.to + 1), words[r.from]?.start ?? 0);
    for (const f of applyToShot(shot, says[i], { rules: rulesNow, graphicsFor: (t) => graphicsFor(t, { corpus: says, list: lists[i] }) })) fired.push({ shot: i + 1, ...f });
    const secs = Math.max(0.5, (words[r.to]?.end ?? 0) - (words[r.from]?.start ?? 0));
    const html = `<script>\nZK.unit(root);\n${shotScript(shot, film)}\n</script>\n<!--cues ${JSON.stringify(shot.sfx || [])}-->`; // R12: pops and whooshes
    const w = writeGraphic(J0, `s${i + 1}`, html); if (w.error) throw new Error(`Shot ${i + 1}: ${w.error}`);
    placeGraphic(d, p, sb, i, w.rel, secs);
    auto.push({ shot: i + 1, at: num(shot.at), place: shot.place, people: (shot.people || []).map((x) => x.who), headline: shot.headline || null, overlays: (shot.overlays || []).map((o) => o.kind), broll: shot.broll ? { mode: shot.broll.mode, template: shot.broll.template || null, recipe: !!shot.broll.recipe } : null, visualDecision: shot.visualDecision, move: shot.camera?.move || null, sfx: (shot.sfx || []).length, props: (shot.props || []).map((x) => ({ id: x.id, at: x.at ?? null, word: x.word || null })), talkers: [...talkersOf(shot, shot.people || [], film)] });
  });
  fs.writeFileSync(path.join(J0, 'work', 'auto-graphics.json'), JSON.stringify(auto, null, 1));
  fs.writeFileSync(path.join(J0, 'work', 'rules.json'), JSON.stringify({ fired, active: rulesNow.filter((r) => r.active !== false).length }, null, 1));
  // buildPlan composes before these native scene scripts exist. Recompose the completed
  // plan, otherwise storyboard previews show its stale text fallbacks until final render.
  const composed = await zen(d.ws, ['compose']);
  if (!composed.ok) throw new Error(`Could not compose the completed cartoon: ${composed.error || 'unknown error'}`);
  step(`Drew ${sb.rows.length} shot${sb.rows.length > 1 ? 's' : ''} from the library`);
  return sb;
}

// a music bed under the whole film (the reference cartoons are never silent): the mood from the film's faces and actions, one track
// chosen by the title so a film keeps its track; ducked under the voice by finalize.mjs. CC BY tracks carry their credit line.
export function setMusic(J0, film) {
  const cat = J(path.join(ENGINE_DIR, '..', 'assets', 'music', 'catalog.json'), null); if (!cat || film.music === false) return null;
  const all = (film.shots || []).flatMap((s) => s.people || []), n = (f) => all.filter(f).length;
  const sad = n((p) => ['sad', 'worried'].includes(p.face)), joy = n((p) => p.face === 'happy' || ['cheer', 'clap', 'wave', 'run'].includes(p.do));
  const mood = film.mood || (sad > joy ? 'emotional' : joy >= 3 ? 'funny' : 'acoustic');
  const have = cat.items.filter((x) => x.mood === mood && fs.existsSync(path.join(ENGINE_DIR, '..', 'assets', x.file)));
  const list = have.length ? have : cat.items.filter((x) => fs.existsSync(path.join(ENGINE_DIR, '..', 'assets', x.file))); if (!list.length) return null;
  let h = 0; for (const c of String(film.title || 'film')) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const t = list[h % list.length], pf = path.join(J0, 'edit', 'plan.json'), plan = J(pf, {});
  plan.music = { src: path.join(ENGINE_DIR, '..', 'assets', t.file), volume: Math.min(0.16, num(film.music?.volume, 0.14)), mood, title: t.title, credit: t.credit || '', license: t.license };
  fs.writeFileSync(pf, JSON.stringify(plan, null, 1)); return plan.music;
}
