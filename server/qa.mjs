// Quality loop, no model: 12 deterministic rules inspect a scene file before it is rendered; each issue carries evidence and a
// bounded repair. repair() applies them one at a time, re-checks, and rolls a repair back if it does not clear its own issue or adds
// an error. The rules:
//   R1  closed world     unknown people → a cast entry (a described creature via procedural-creator, else a stable look by name);
//                        unknown props → a library piece by its alias / a learned prop, else removed with a note (repairAsync
//                        first tries server/web-learner.mjs); unknown places → their alias, else reported (never invented)
//   R2  grounding        physics-logic: nothing grounded floats (props or people lifted off ground_y), no outdoor thing or
//                        weather inside a room (indoor rain becomes a window view)
//   R3  real scale       props clamped to their real size (a cup is never bigger than a head); creations to 0.4–2× a person
//   R4  collision/facing people at least 0.7 m apart; people standing together face each other
//   R5  safe zones       people inside the frame (±2.8 m), speakers inside the title-safe 85%; headlines short enough to fit
//   R6  pacing           a shot over 6.5 s becomes two camera angles; a shot under 1.2 s is merged (the last one is moved)
//   R7  zero static      a shot with no locomotion, no gesture and no camera move gets a gentle camera move
//   R8  b-roll spacing   no two full-screen cutaways in a row (the second becomes a corner card); a cutaway lasts at most 3 s
//   R9  readability      a data card never shares the frame with faces on both sides (people move to one side), never with a
//                        b-roll card; chart and list text short enough; headline colours keep WCAG contrast ≥ 4.5
//   R10 lip-sync/focus   one speaker per shot; a single / close shot frames the speaker; the camera's subject is in the shot
//   R11 pose transitions the same person seated in one shot and on their feet in the next gets a 0.35 s blend
//   R12 audio            every pop-up graphic and b-roll gets a pop / whoosh cue; the music bed sits under speech (≤ 0.16)
import { validate, pieceExists } from './codefilm.mjs';
import { sanitizeShot, ZPHYS } from './physics.mjs';
import { parseDNA } from './procedural-creator.mjs';
import { findNames, castSpec, slug } from './entity-resolver.mjs';
import { resolvePlace } from './place-registry.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';

export const LIMITS = { halfWidth: 2.8, safe: 0.85, minShot: 1.2, maxShot: 6.5, minGap: 0.7, maxCutaway: 3, headlineChars: { '16:9': 30, '9:16': 20 } };
const clone = (x) => JSON.parse(JSON.stringify(x));
const num = (x, d = 0) => (Number.isFinite(+x) ? +x : d);
const WORDS = JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'words.json'), 'utf8'));
const ALIAS = new Map(); for (const [id, ws] of Object.entries(WORDS.aliases || {})) for (const w of [id, ...ws]) ALIAS.set(String(w).normalize('NFC').toLowerCase(), id);
const VERB = new Map(Object.entries(WORDS.words || {}).map(([w, a]) => [w.toLowerCase(), a]));
const BASIC = ['idle', 'stand', 'walk', 'run', 'wave', 'cheer', 'clap', 'point', 'sit'];
const SEATED = new Set(['sit', 'sleep', 'squat', 'sajdah', 'ruku']);
const CARD = ['dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card'];
const lum = (hex) => { const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
export const contrast = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
export const HEADLINE_COLORS = { text: '#1f2630', banner: '#ffd84a', card: '#fffaf0', cardText: '#1f2630' }; // engine/cartoon/graphics-fx.js
const shotKey = (s) => `${num(s.at).toFixed(2)}@${s.place}`;
const ops = (...list) => ({ kind: 'ops', ops: list });
const lenOf = (order, k, duration) => { const s = order[k].s, end = k + 1 < order.length ? order[k + 1].s.at : duration || num(s.at) + 3; return end - num(s.at); };

export function check(film, { duration = 0 } = {}) {
  const issues = [], add = (rule, category, severity, shot, evidence, repair, key) => issues.push({ rule, category, severity, shot, t: shot != null ? num(film.shots[shot]?.at) : 0, evidence, repair, key: `${rule}|${key ?? evidence}` });
  const order = [...(film.shots || [])].map((s, i) => ({ s, i })).sort((a, b) => num(a.s.at) - num(b.s.at)), fmt = film.format === '9:16' ? '9:16' : '16:9';
  // ---- R1: the closed world ----
  const cast = film.cast || {};
  for (const { s, i } of order) {
    for (const [j, p] of (s.people || []).entries()) {
      if (p.who && !cast[p.who]) { let spec; try { parseDNA(p.who); spec = { description: p.who }; } catch { const n = findNames(p.who)[0]; spec = castSpec(slug(p.who), n?.gender || 'unknown'); }
        add('R1', 'missing-asset', 'error', i, `"${p.who}" in shot ${i + 1} is not in the cast`, { kind: 'cast', who: p.who, spec }, `cast:${p.who}`); }
      if (p.do && !BASIC.includes(p.do) && !fs.existsSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'actions', `${p.do}.json`))) { const a = VERB.get(String(p.do).toLowerCase()) || 'idle'; add('R1', 'missing-asset', 'error', i, `action "${p.do}" in shot ${i + 1} is not in the library`, ops({ shot: i, person: j, set: { do: BASIC.includes(a) || fs.existsSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'actions', `${a}.json`)) ? a : 'idle' } }), `act:${shotKey(s)}:${p.who}`); }
    }
    (s.props || []).forEach((pr, j) => { if (pieceExists(pr?.id)) return; const id = ALIAS.get(String(pr?.id || '').normalize('NFC').toLowerCase()) || ALIAS.get(String(pr?.id || '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase());
      add('R1', 'missing-asset', 'error', i, `prop "${pr?.id}" in shot ${i + 1} is not a library piece${id ? `: it is the "${id}"` : ' (removed; teach it with POST /api/learn)'}`, ops(id ? { shot: i, prop: j, set: { id } } : { shot: i, removeProp: j }), `prop:${shotKey(s)}:${pr?.id}`); });
    if (s.place && !ZPHYS.PLACES[s.place]) { const id = resolvePlace(String(s.place).replace(/_/g, ' ')); add('R1', 'missing-asset', 'error', i, `place "${s.place}" in shot ${i + 1} is not ready${id ? `: it is "${id}"` : ''}`, id ? ops({ shot: i, set: { place: id } }) : null, `place:${shotKey(s)}`); }
  }
  for (const e of validate(film)) if (!issues.some((x) => e.includes(x.evidence.split(' ')[0]))) add('R1', 'missing-asset', 'error', null, e, null);
  // ---- per shot: R2 R3 R4 R5 R7 R9 R10 R12 ----
  order.forEach(({ s, i }, k) => {
    const ppl = s.people || [], key = shotKey(s), len = lenOf(order, k, duration);
    // R2 / R3 / R4-facing: the physics engine's corrections (props, weather, supports, sizes, facing)
    const phy = sanitizeShot(s), byRule = (r) => phy.fixes.filter((f) => f.rule === r);
    for (const r of ['P1', 'P2']) if (byRule(r).length) add('R2', 'grounding', 'error', i, byRule(r).map((f) => f.evidence).join('; '), ops({ shot: i, set: { props: phy.shot.props, weather: phy.shot.weather } }), `${r}:${key}`);
    if (byRule('P3').length) add('R3', 'scale', 'error', i, byRule('P3').map((f) => f.evidence).join('; '), ops({ shot: i, set: { props: phy.shot.props } }), `P3:${key}`);
    if (byRule('P4').length) add('R4', 'facing', 'warn', i, byRule('P4').map((f) => f.evidence).join('; '), ops(...phy.shot.people.map((p, j) => ({ shot: i, person: j, set: { facing: p.facing } }))), `P4:${key}`);
    ppl.forEach((p, j) => {
      const floats = cast[p.who]?.dna?.floating || /ভূত|ghost|flying|উড়ন্ত/i.test(cast[p.who]?.description || '');
      if (num(p.lift) > 0 && !floats) add('R2', 'grounding', 'error', i, `${p.who} floats ${p.lift} m above the ground in shot ${i + 1}`, ops({ shot: i, person: j, set: { lift: 0 } }), `lift:${key}:${p.who}`);
      if (p.dz != null && (p.dz < 0 || p.dz > 8)) add('R2', 'grounding', 'error', i, `${p.who} has depth dz=${p.dz} (the floor runs 0–8 m): not on the ground`, ops({ shot: i, person: j, set: { dz: Math.max(0, Math.min(8, p.dz)) } }), `dz:${key}:${p.who}`);
      if (p.scale != null && (p.scale < 0.6 || p.scale > 1.4)) add('R3', 'scale', 'error', i, `${p.who} is drawn at ${p.scale}× a person's size`, ops({ shot: i, person: j, set: { scale: Math.max(0.6, Math.min(1.4, p.scale)) } }), `pscale:${key}:${p.who}`);
      // R5: in the frame, speakers in the title-safe area
      const lim = LIMITS.halfWidth * (p.speaks ? LIMITS.safe : 1);
      for (const [f, x] of [['x', num(p.x)], ...(['walk', 'run'].includes(p.do) && p.to != null ? [['to', num(p.to)]] : [])]) if (Math.abs(x) > lim) add('R5', 'out-of-frame', 'error', i, `${p.who} stands at ${f}=${x} m in shot ${i + 1}; the frame shows ±${LIMITS.halfWidth} m${p.speaks ? `, a speaker stays within ±${lim.toFixed(2)} m` : ''}`, ops({ shot: i, person: j, set: { [f]: Math.sign(x) * Math.round((lim - 0.1) * 100) / 100 } }), `frame:${key}:${p.who}:${f}`);
    });
    // R4: collisions
    for (let a = 0; a < ppl.length; a++) for (let b = a + 1; b < ppl.length; b++) if (Math.abs(num(ppl[a].x) - num(ppl[b].x)) < LIMITS.minGap && Math.abs(num(ppl[a].dz, 1) - num(ppl[b].dz, 1)) < 0.4) {
      const side = num(ppl[b].x) >= num(ppl[a].x) ? 1 : -1, nx = Math.max(-2.3, Math.min(2.3, num(ppl[a].x) + side * 1.1)), x2 = Math.abs(nx - num(ppl[a].x)) < LIMITS.minGap ? num(ppl[a].x) - side * 1.1 : nx;
      add('R4', 'overlap', 'warn', i, `${ppl[a].who} and ${ppl[b].who} stand ${Math.abs(num(ppl[a].x) - num(ppl[b].x)).toFixed(2)} m apart in shot ${i + 1}`, { kind: 'person-x', shot: i, person: b, value: Math.round(x2 * 100) / 100 }, `overlap:${key}:${ppl[a].who}:${ppl[b].who}`); }
    // R5: a headline must fit its banner
    const maxH = LIMITS.headlineChars[fmt]; if (s.headline && [...s.headline].length > maxH) { let h = ''; for (const w of s.headline.split(/\s+/)) { if ([...`${h} ${w}`.trim()].length > maxH) break; h = `${h} ${w}`.trim(); } add('R5', 'safe-zone', 'warn', i, `headline "${s.headline}" is ${[...s.headline].length} characters; a ${fmt} banner fits ${maxH}`, ops({ shot: i, set: { headline: h || [...s.headline].slice(0, maxH).join('') } }), `headline:${key}`); }
    // R7: zero static
    const moving = ppl.some((p) => ['walk', 'run'].includes(p.do) || (p.do && !['idle', 'stand'].includes(p.do))), gesturing = ppl.some((p) => ['idle', 'stand', undefined].includes(p.do) && p.gesture !== false);
    if (!moving && !gesturing && !s.camera?.move) add('R7', 'static', 'warn', i, `shot ${i + 1} has no locomotion, no gesture and no camera move`, ops({ shot: i, set: { camera: { ...(s.camera || {}), move: ppl.length ? 'slow_push_in' : 'gentle_pan' } } }), `static:${key}`);
    // R9: readability
    const cards = (s.overlays || []).filter((o) => CARD.includes(o.kind));
    if (cards.length && ppl.length >= 2 && ppl.some((p) => num(p.x) < -0.4) && ppl.some((p) => num(p.x) > 0.4)) { const xs = ppl.map((_, j) => -2.3 + j * 1.0); add('R9', 'readability', 'warn', i, `a data card in shot ${i + 1} would cover a face: people stand on both sides`, ops(...ppl.map((p, j) => ({ shot: i, person: j, set: { x: Math.round(xs[j] * 100) / 100, ...(['walk', 'run'].includes(p.do) ? { to: Math.round(Math.min(-0.3, xs[j] + 0.6) * 100) / 100 } : {}) } }))), `card-faces:${key}`); }
    if (cards.length && s.broll?.mode === 'pip_corner') add('R9', 'readability', 'warn', i, `shot ${i + 1} has both a data card and a b-roll card`, ops({ shot: i, delete: 'broll' }), `card-pip:${key}`);
    for (const [o, oi] of (s.overlays || []).map((o, oi) => [o, oi])) {
      if (o.kind === 'dynamic_comparison_chart' && Array.isArray(o.bars) && (o.bars.length > 6 || o.bars.some((b) => [...String(b.label || '')].length > 10))) add('R9', 'readability', 'warn', i, `chart in shot ${i + 1}: ${o.bars.length} bars, labels up to ${Math.max(...o.bars.map((b) => [...String(b.label || '')].length))} characters`, ops({ shot: i, overlay: oi, set: { bars: o.bars.slice(0, 6).map((b) => ({ ...b, label: [...String(b.label || '')].slice(0, 10).join('') })) } }), `chart:${key}:${oi}`);
      if (o.kind === 'step_list_card' && Array.isArray(o.items) && o.items.some((x) => [...String(x)].length > 26)) add('R9', 'readability', 'warn', i, `list in shot ${i + 1} has an item over 26 characters`, ops({ shot: i, overlay: oi, set: { items: o.items.map((x) => [...String(x)].slice(0, 26).join('')) } }), `list:${key}:${oi}`);
    }
    // R10: lip-sync and focus
    const speakers = ppl.map((p, j) => [p, j]).filter(([p]) => p.speaks);
    if (speakers.length > 1) add('R10', 'lip-sync', 'warn', i, `${speakers.length} people speak at once in shot ${i + 1}`, ops(...speakers.slice(1).map(([, j]) => ({ shot: i, person: j, set: { speaks: false } }))), `speakers:${key}`);
    const kind = s.camera?.kind;
    if (s.camera?.on && !ppl.some((p) => p.who === s.camera.on)) add('R10', 'focus', 'warn', i, `the camera of shot ${i + 1} follows ${s.camera.on}, who is not in it`, ops({ shot: i, set: { camera: { ...s.camera, on: speakers[0]?.[0].who || ppl[0]?.who } } }), `focus-missing:${key}`);
    else if (speakers.length && ['single', 'close'].includes(kind) && s.camera?.on !== speakers[0][0].who) add('R10', 'focus', 'warn', i, `${speakers[0][0].who} speaks in shot ${i + 1} but the camera frames ${s.camera?.on || 'nobody'}`, ops({ shot: i, set: { camera: { ...s.camera, on: speakers[0][0].who } } }), `focus:${key}`);
    // R12: sound for what pops up
    const want = [...(s.headline ? [['tx-pop', 0.12]] : []), ...(cards.length || (s.overlays || []).some((o) => !CARD.includes(o.kind)) ? [['tx-ui', 0.3]] : []), ...(s.broll ? [[s.broll.mode === 'cutaway' ? 'wh-short' : 'tx-pop', s.broll.mode === 'cutaway' ? 0 : 0.3]] : [])].filter(([, t]) => t < len);
    const have = new Set((s.sfx || []).map((c) => c[0]));
    if (want.some(([n]) => !have.has(n))) add('R12', 'audio', 'warn', i, `shot ${i + 1} shows ${want.map(([n]) => n).join(', ')} pop-ups without their sound cues`, ops({ shot: i, set: { sfx: [...(s.sfx || []), ...want.filter(([n]) => !have.has(n))] } }), `sfx:${key}:${want.map(([n]) => n).join('+')}`);
  });
  // ---- across shots: R6 R8 R11 ----
  order.forEach(({ s, i }, k) => {
    const len = lenOf(order, k, duration), key = shotKey(s), prev = order[k - 1]?.s, next = order[k + 1]?.s;
    if (len > LIMITS.maxShot + 1e-6) { const mid = Math.round((num(s.at) + len / 2) * 100) / 100, alt = { ...clone(s), at: mid, camera: { ...(s.camera || {}), kind: (s.people || []).length ? (['close', 'single'].includes(s.camera?.kind) ? 'wide' : (s.people || []).length >= 2 ? 'two' : 'single') : 'establish', move: undefined } };
      delete alt.broll; delete alt.headline; delete alt.overlays; delete alt.sfx; if (alt.camera.move === undefined) delete alt.camera.move;
      add('R6', 'pacing', 'warn', i, `shot ${i + 1} lasts ${len.toFixed(2)} s (over ${LIMITS.maxShot} s): a second camera angle at ${mid} s`, { kind: 'insert-shot', shot: alt }, `long:${key}`); }
    if (len < LIMITS.minShot - 1e-6) {
      if (next) add('R6', 'timing', 'warn', i, `shot ${i + 1} lasts ${len.toFixed(2)} s (minimum ${LIMITS.minShot} s): merged into the shot before it`, k ? { kind: 'remove-shot', shot: i } : { kind: 'shot-at', shot: order[1].i, value: 0 }, `short:${key}`);
      else { const end = duration || num(s.at) + len, room = prev ? end - num(prev.at) : Infinity; add('R6', 'timing', 'warn', i, `shot ${i + 1} lasts ${len.toFixed(2)} s (minimum ${LIMITS.minShot} s)`, room >= 2 * LIMITS.minShot ? { kind: 'shot-at', shot: i, value: Math.round((end - LIMITS.minShot) * 100) / 100 } : { kind: 'remove-shot', shot: i }, `short:${key}`); }
    }
    if (k === 0 && duration && num(s.at) > 0.05) add('R6', 'timing', 'warn', i, `nothing is shown from 0 s to ${s.at} s`, { kind: 'shot-at', shot: i, value: 0 }, 'gap-start');
    // R8: cutaways
    if (s.broll?.mode === 'cutaway' && num(s.broll.seconds, Math.min(len, 3)) > LIMITS.maxCutaway) add('R8', 'b-roll', 'warn', i, `cutaway in shot ${i + 1} would hide the story for ${num(s.broll.seconds).toFixed(1)} s`, ops({ shot: i, set: { broll: { ...s.broll, seconds: LIMITS.maxCutaway } } }), `cut-long:${key}`);
    if (s.broll?.mode === 'cutaway' && prev?.broll?.mode === 'cutaway') add('R8', 'b-roll', 'warn', i, `shots ${order[k - 1].i + 1} and ${i + 1} are both full-screen cutaways: the characters vanish for too long`, ops({ shot: i, set: { broll: { ...s.broll, mode: 'pip_corner', corner: 'tr', top: 0.17 } } }), `cut-twice:${key}`);
    // R11: pose transitions
    if (prev && prev.place === s.place) for (const [j, p] of (s.people || []).entries()) { const q = (prev.people || []).find((x) => x.who === p.who); if (!q) continue; const was = q.do || 'idle', now = p.do || 'idle';
      if (SEATED.has(was) !== SEATED.has(now) && !p.blendFrom) add('R11', 'pose-jump', 'warn', i, `${p.who} goes from ${was} to ${now} at the cut into shot ${i + 1}`, ops({ shot: i, person: j, set: { blendFrom: was } }), `blend:${key}:${p.who}`); }
  });
  // R9 (palette) and R12 (music bed)
  if (contrast(HEADLINE_COLORS.text, HEADLINE_COLORS.banner) < 4.5 || contrast(HEADLINE_COLORS.cardText, HEADLINE_COLORS.card) < 4.5) add('R9', 'readability', 'error', null, 'headline / card colours have contrast under 4.5', null, 'contrast');
  if (film.music && typeof film.music === 'object' && num(film.music.volume, 0.14) > 0.16) add('R12', 'audio', 'warn', null, `music bed at ${film.music.volume} would cover the voice (≤ 0.16, ducked under speech)`, { kind: 'film-set', set: { music: { ...film.music, volume: 0.14, duck: true } } }, 'music');
  return issues;
}

// ---------- repairs: small data operations on a copy ----------
export function applyRepair(film, r) {
  const f = clone(film);
  if (r.kind === 'cast') { f.cast = { ...(f.cast || {}), [r.who]: r.spec }; return f; }
  if (r.kind === 'film-set') return Object.assign(f, r.set);
  if (r.kind === 'insert-shot') { f.shots.push(clone(r.shot)); return f; }
  if (r.kind === 'remove-shot') { f.shots.splice(r.shot, 1); return f; }
  if (r.kind === 'ops') { for (const o of r.ops) { const t = f.shots[o.shot]; if (!t) continue;
    if (o.person != null) { const p = t.people?.[o.person]; if (p) for (const [k, v] of Object.entries(o.set || {})) if (v === undefined) delete p[k]; else p[k] = v; }
    else if (o.prop != null) { const p = t.props?.[o.prop]; if (p) Object.assign(p, o.set); }
    else if (o.removeProp != null) t.props.splice(o.removeProp, 1);
    else if (o.overlay != null) { const ov = t.overlays?.[o.overlay]; if (ov) Object.assign(ov, o.set); }
    else if (o.delete) delete t[o.delete];
    else for (const [k, v] of Object.entries(o.set || {})) if (v === undefined) delete t[k]; else t[k] = v; }
    return f; }
  const s = f.shots[r.shot]; if (!s) return f;
  if (r.kind === 'shot-at') s.at = r.value;
  else if (r.kind === 'person-x' || r.kind === 'person-to' || r.kind === 'person-dz') { const p = s.people?.[r.person]; if (p) p[r.kind.slice(7)] = r.value; }
  return f;
}
// repair each issue in turn (re-checking after every one); keep a repair only if its own issue is gone and no new error appeared
export function repair(film, opts = {}) {
  let cur = film; const log = [], tried = new Set();
  for (let round = 0; round < 300; round++) {
    const now = check(cur, opts), next = now.find((x) => x.repair && !tried.has(x.key)); if (!next) break;
    tried.add(next.key);
    const cand = applyRepair(cur, next.repair), after = check(cand, opts), errs = (l) => l.filter((x) => x.severity === 'error').length;
    const cleared = !after.some((a) => a.key === next.key), worse = errs(after) > errs(now);
    if (cleared && !worse) { log.push({ rule: next.rule, issue: next.evidence, repair: next.repair.kind, result: 'applied' }); cur = cand; } else log.push({ rule: next.rule, issue: next.evidence, repair: next.repair.kind, result: 'rolled back' });
  }
  return { film: cur, log, remaining: check(cur, opts) };
}
// the same, after first trying to LEARN unknown props (server/web-learner.mjs: local knowledge, the open web when allowed)
export async function repairAsync(film, { online = false, ...opts } = {}) {
  const unknown = [...new Set((film.shots || []).flatMap((s) => (s.props || []).map((p) => p?.id)).filter((id) => id && !pieceExists(id) && !ALIAS.has(String(id).toLowerCase())))];
  const learned = [];
  if (unknown.length) { const { learn } = await import('./web-learner.mjs'); for (const id of unknown) { try { const r = await learn(String(id).replace(/([a-z])([A-Z])/g, '$1 $2'), { online }); if (r.prop) learned.push([id, r.prop]); } catch { /* stays unknown: R1 removes it with a note */ } } }
  let f = film; if (learned.length) { f = clone(film); for (const s of f.shots) for (const p of s.props || []) { const hit = learned.find(([id]) => id === p.id); if (hit) p.id = hit[1]; } }
  return { ...repair(f, opts), learned };
}
