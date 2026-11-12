// Strict rules: the owner's Do's and Don'ts, applied AFTER the brain's statistical guesses and the automatic graphics, so they
// always win. data/brain/strict-rules.json (owner-edited in /admin; the defaults below are written the first time).
//   never  — a head may not take these values (when the condition holds); a refused value is replaced by a safe one
//   always — a head takes this value (when the condition holds), or at least is never "none" (notNone)
// Conditions: talking (someone voices the line), places [...], words [...] (any of them in the sentence), numbers: 'any' | 'compare'.
// Special value sets: HIGH_ENERGY (engine/cartoon/library/gesture-energy.json; a big move the sentence itself says, e.g. দৌড়ে
// পালাল, stays — Part 1 rule 2c), OUTDOOR_BROLL (b-roll that shows the open sky, roads or weather).
// Every rule that fires leaves a receipt: { rule, text, shot, did }. Rules only; no model.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from './config.mjs';
import { isHigh, allowHigh, calmFor } from './energy.mjs';
import { parseRule } from './brain.mjs';
import { resolvePlace, readyPlaces } from './place-registry.mjs';

const NF = (s) => String(s ?? '').normalize('NFC');
export const file = () => path.join(DATA_DIR, 'brain', 'strict-rules.json');
export const OUTDOOR_BROLL = ['sunrise_to_sunset', 'heavy_rain_clouds', 'night_stars_moon', 'fast_running_feet', 'thunder_lightning', 'wind_leaves_blowing', 'bus_passing_road', 'map_route_travel'];
export const INDOOR_PLACES = ['bedroom', 'classroom', 'living_room', 'kitchen', 'office_room', 'hospital_clinic', 'restaurant_cafe', 'courthouse_hall'];
const DEFAULTS = [
  { id: 'calm-talk', kind: 'never', head: 'action', values: ['HIGH_ENERGY'], when: { talking: true }, text: 'কথা বলার সময় কখনো হাত পা ছুঁড়বে না, শান্তভাবে কথা বলবে (When talking → never jump, dance, wild-wave or run — unless the sentence itself says so)' },
  { id: 'indoor-broll', kind: 'never', head: 'broll', values: ['OUTDOOR_BROLL'], when: { places: INDOOR_PLACES }, text: 'When the place is indoors (bedroom, classroom…) → never an outdoor b-roll' },
  { id: 'money-graphic', kind: 'always', head: 'graphic', notNone: true, when: { words: ['টাকা', 'দাম', 'খরচ', 'price', 'cost', 'taka'], numbers: 'any' }, text: 'যখন টাকা / দাম / খরচের কথা আর সংখ্যা থাকবে → graphic কখনো none থাকবে না' },
  { id: 'compare-chart', kind: 'always', head: 'graphic', value: 'dynamic_comparison_chart', when: { numbers: 'compare' }, text: 'যখনই সংখ্যার তুলনা থাকবে তখন dynamic_comparison_chart দেখাবে' },
];
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const write = (rules) => { fs.mkdirSync(path.dirname(file()), { recursive: true }); const tmp = `${file()}.${process.pid}.tmp`; fs.writeFileSync(tmp, JSON.stringify({ version: 1, rules }, null, 1)); fs.renameSync(tmp, file()); return rules; };
export function listRules() { const f = J(file(), null); if (f?.rules) return f.rules; return write(DEFAULTS.map((r) => ({ ...r, active: true, builtin: true, at: new Date().toISOString() }))); }
export function setRule(id, { active } = {}) { const rs = listRules(), r = rs.find((x) => x.id === id); if (!r) throw Object.assign(new Error('No such rule.'), { status: 404 }); if (active != null) r.active = !!active; write(rs); return r; }
export function deleteRule(id) { const rs = listRules(), n = rs.length, left = rs.filter((x) => x.id !== id); if (left.length === n) throw Object.assign(new Error('No such rule.'), { status: 404 }); write(left); return { deleted: id }; }

// ---------- plain Bangla / English → a rule ----------
const NEVER = /কখনো|কখনোই|কোনোদিন|never|don'?t|do not|must not|না\s*করবে|করবে\s*না|ছুঁড়বে\s*না|দেখাবে\s*না|দেখাবা\s*না|থাকবে\s*না|ছাড়বে\s*না/iu;
const TALKING = /কথা\s*বলার\s*সময়|কথা\s*বলার\s*সময়|কথা\s*বলতে|while\s+talking|when\s+talking|talking|speaking|বলার\s*সময়/iu;
const FLAIL = /হাত\s*পা|ছুঁড়|ছোঁড়|লাফ|নাচ|দৌড়|দৌড়|flail|jump|danc|run|wild|wave/iu;
const OUTDOOR = /বাইরের|outdoor|outside|খোলা\s*আকাশ/iu;
const NUMBERS = /সংখ্যার\s*তুলনা|তুলনা|compare|comparison/iu, ANY_NUMBER = /সংখ্যা|number/iu;
const GRAPHIC = /graphic|গ্রাফিক|চার্ট|chart|গ্রাফ/iu, NONE = /none|ফাঁকা|খালি|ছাড়া|leave/iu;
const ACTION_WORDS = { jump: /লাফ|jump/iu, dance: /নাচ|danc/iu, run: /দৌড়|দৌড়|run/iu, wave: /wild.?wave|হাত\s*নাড়/iu, fight: /মারামারি|fight/iu };
export function parseStrict(text0) {
  const text = NF(text0).trim(); if (!text || text.length > 400) throw Object.assign(new Error('Write the rule in one sentence (up to 400 characters).'), { status: 400 });
  const when = {}, quoted = [...text.matchAll(/[\[“"'‘(]([^\]”"'’)]+)[\]”"'’)]/gu)].map((m) => m[1]).join(',').split(/[,،;|]+/).map((x) => NF(x).trim()).filter(Boolean);
  if (TALKING.test(text)) when.talking = true;
  const places = Object.keys(readyPlaces).filter((id) => new RegExp(`\\b${id}\\b`).test(text) || (readyPlaces[id].aliases || []).some((a) => /[ঀ-৿]/.test(a) && text.includes(NF(a))));
  if (/indoor|ঘরের\s*ভেতর|ভেতরে/iu.test(text)) places.push(...INDOOR_PLACES); if (places.length) when.places = [...new Set(places)];
  if (NUMBERS.test(text)) when.numbers = 'compare'; else if (ANY_NUMBER.test(text)) when.numbers = 'any';
  const money = ['টাকা', 'দাম', 'খরচ'].filter((w) => text.includes(w)); const words = [...new Set([...quoted.filter((w) => !/^[a-z_]+$/.test(w) || !/_/.test(w)), ...money])].filter((w) => !Object.keys(readyPlaces).includes(w));
  if (words.length && !when.talking) when.words = words;
  const id = 'r-' + crypto.createHash('sha1').update(text).digest('hex').slice(0, 8);
  if (NEVER.test(text)) {
    if (GRAPHIC.test(text) && NONE.test(text)) return { id, kind: 'always', head: 'graphic', notNone: true, when, text };
    if (OUTDOOR.test(text) || /b-?roll|বি-?রোল/iu.test(text)) return { id, kind: 'never', head: 'broll', values: OUTDOOR.test(text) ? ['OUTDOOR_BROLL'] : quoted.filter((q) => /^[a-z_]+$/.test(q)), when, text };
    if (FLAIL.test(text)) { const named = Object.entries(ACTION_WORDS).filter(([, re]) => re.test(text)).map(([a]) => a); return { id, kind: 'never', head: 'action', values: /হাত\s*পা|flail|শান্ত|calm/iu.test(text) || !named.length ? ['HIGH_ENERGY'] : named, when, text }; }
    const qv = quoted.filter((q) => /^[a-z_]+$/.test(q)); if (qv.length) return { id, kind: 'never', head: /broll/.test(qv[0]) ? 'broll' : 'action', values: qv, when, text };
    throw Object.assign(new Error('I could not tell what to forbid. Name it: actions [jump, dance], an outdoor b-roll, or graphic none.'), { status: 422 });
  }
  if (GRAPHIC.test(text) && (when.numbers || when.words)) return { id, kind: 'always', head: 'graphic', value: /chart|চার্ট|তুলনা/iu.test(text) ? 'dynamic_comparison_chart' : undefined, notNone: !/chart|চার্ট/iu.test(text), when, text };
  let pr; try { pr = parseRule(text); } catch { pr = null; }
  const [head, value] = Object.entries(pr?.labels || {})[0] || [];
  if (head && value) return { id, kind: 'always', head, value, when: { ...when, words: [...new Set([...(when.words || []), pr.topic].filter(Boolean))] }, text };
  throw Object.assign(new Error('I could not read that rule. Try: "যখনই … তখন … দেখাবে" or "… কখনো … করবে না".'), { status: 422 });
}
export function addRule(text) { const r = { ...parseStrict(text), active: true, at: new Date().toISOString() }, rs = listRules().filter((x) => x.id !== r.id); rs.push(r); write(rs); return r; }

// ---------- applying the rules ----------
const numbersIn = (s) => (NF(s).match(/[0-9০-৯]+(?:[.,][0-9০-৯]+)?/g) || []).length;
function holds(r, ctx) {
  const w = r.when || {}, s = NF(ctx.text).toLowerCase();
  if (w.talking && !ctx.talking) return false;
  if (w.places?.length && !w.places.includes(ctx.place)) return false;
  if (w.words?.length && !w.words.some((x) => s.includes(NF(x).toLowerCase()))) return false;
  if (w.numbers === 'any' && numbersIn(s) < 1) return false;
  if (w.numbers === 'compare' && numbersIn(s) < 2) return false;
  return true;
}
const expand = (vals) => vals.flatMap((v) => (v === 'OUTDOOR_BROLL' ? OUTDOOR_BROLL : [v]));
// the planner's shot (people's actions/gestures, the brain's hints): before the build. talking = the focus person voices the line.
export function applyToPlan(shot, text, { rules = listRules(), conf = {} } = {}) {
  const out = [], people = shot.people || [], focus = people.find((p) => p.who === shot.camera?.on) || people[0];
  for (const r of rules.filter((x) => x.active !== false)) {
    for (const p of people) {
      const ctx = { text, place: shot.place, talking: p === focus && p.speaks !== false };
      if (r.kind !== 'never' || r.head !== 'action' || !holds(r, ctx)) continue;
      for (const k of ['do', 'gesture']) {
        const v = p[k]; if (typeof v !== 'string') continue;
        const bad = r.values.includes('HIGH_ENERGY') ? isHigh(v) && !allowHigh(v, text, conf.action ?? 0) : r.values.includes(v);
        if (bad) { const to = calmFor(v); if (k === 'do') p.do = to === 'talk_explain' ? 'idle' : to; if (k === 'gesture' || to === 'talk_explain') p.gesture = to === 'idle' ? undefined : to; if (p.gesture === undefined) delete p.gesture; out.push({ rule: r.id, text: r.text, did: `blocked ${v} for ${p.who} → ${to}` }); }
      }
    }
    if (r.kind === 'never' && r.head === 'broll' && holds(r, { text, place: shot.place, talking: !!focus }) && expand(r.values).includes(shot.brain?.broll?.label)) { out.push({ rule: r.id, text: r.text, did: `blocked b-roll ${shot.brain.broll.label}` }); shot.brain.broll = { label: 'none', conf: 1 }; }
    if (r.kind === 'always' && r.value && holds(r, { text, place: shot.place, talking: !!focus }) && r.head !== 'action') {
      const before = shot.brain?.[r.head]?.label; shot.brain = { ...(shot.brain || {}), [r.head]: { label: r.value, conf: 1 } }; if (before !== r.value) out.push({ rule: r.id, text: r.text, did: `${r.head} → ${r.value}` });
    }
  }
  return out;
}
// the built shot (after the automatic graphics): b-roll and graphics the rules forbid or require
export function applyToShot(shot, text, { rules = listRules(), graphicsFor = null } = {}) {
  const out = [], people = shot.people || [], ctx = { text, place: shot.place, talking: people.length > 0 };
  for (const r of rules.filter((x) => x.active !== false && holds(x, ctx))) {
    if (r.kind === 'never' && r.head === 'broll' && shot.broll?.template && expand(r.values).includes(shot.broll.template)) { out.push({ rule: r.id, text: r.text, did: `removed b-roll ${shot.broll.template}` }); delete shot.broll; }
    if (r.kind === 'never' && r.head === 'graphic' && (shot.overlays || []).some((o) => expand(r.values).includes(o.kind))) { shot.overlays = shot.overlays.filter((o) => !expand(r.values).includes(o.kind)); out.push({ rule: r.id, text: r.text, did: 'removed a graphic' }); }
    if (r.kind === 'always' && r.head === 'graphic' && graphicsFor) {
      const data = (shot.overlays || []).filter((o) => !['comic_emotion_fx', 'thought_cloud'].includes(o.kind));
      const want = r.value && !data.some((o) => o.kind === r.value) ? graphicsFor(text).find((g) => g.kind === r.value) : null;
      if (want) { shot.overlays = [...(shot.overlays || []).filter((o) => o.kind !== 'number_badge_pop'), want]; out.push({ rule: r.id, text: r.text, did: `showed ${r.value}` }); }
      else if (r.notNone && !data.length) { const g = graphicsFor(text)[0]; if (g) { shot.overlays = [...(shot.overlays || []), g]; out.push({ rule: r.id, text: r.text, did: `graphic was none → ${g.kind}` }); } }
      if ((shot.overlays || []).some((o) => !['comic_emotion_fx', 'thought_cloud'].includes(o.kind)) && shot.broll?.mode === 'pip_corner') delete shot.broll; // one data card at a time
    }
  }
  return out;
}
