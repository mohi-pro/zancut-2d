// Story-level editorial choices. This is deliberately separate from the classifier:
// a plausible individual insert can still be repetitive or badly timed in a film.
import fs from 'node:fs';
import { brollFor, matchTemplate, thingsNamed } from './broll.mjs';

export const VISUAL_KNOWLEDGE = JSON.parse(fs.readFileSync(new URL('../brain/visual-knowledge.json', import.meta.url), 'utf8'));
export const createVisualState = (total = 1) => ({ total, index: 0, inserts: 0, lastInsert: -100, used: new Map(), lastGraphic: null });
const attached = new Set(['thought_cloud', 'comic_emotion_fx']);
const nf = (s) => String(s || '').normalize('NFC').toLowerCase();
export function transcriptIntent(text) {
  const t = nf(text);
  const dialogue = /[“”«»"]|\b(said|asked|replied|told|answered)\b|বলল|বললেন|জিজ্ঞেস|উত্তর দিল|বলছে/u.test(t);
  const comparison = /[0-9০-৯].*(থেকে|বেড়|কমে|আগে|এখন|from| to |now|before|after)/u.test(t) && (t.match(/[0-9০-৯]+/g) || []).length >= 2;
  const data = comparison || /[0-9০-৯]\s*%|শতাংশ|percent|প্রথমত|দ্বিতীয়ত|firstly|secondly/u.test(t);
  const timeBridge = ['পরদিন', 'কয়েক দিন পর', 'কিছুক্ষণ পর', 'সপ্তাহ পরে', 'বছর কেটে', 'দিন পেরিয়ে', 'পাতা উল্টে', 'meanwhile', 'later that', 'days later', 'weeks later', 'time passed'].some((w) => t.includes(nf(w)));
  const emotion = /কাঁদ|কান্না|হাসল|হাসি|খুশি|ভয়|অবাক|চিন্তিত|\b(cried|crying|smiled|afraid|surprised|worried)\b/u.test(t);
  const explicitAction = /দৌড়|হাঁট|বসল|হাততালি|হাত নাড়|ধরল|দিল|তুলল|\b(ran|runs|walked|walks|sat|clapped|waved|handed|picked)\b/u.test(t);
  const negated = /\b(did not|does not|never|not|no longer)\b|দৌড়ায়নি|দৌড়াল না|হাঁটেনি|করেনি|করল না|নয়|নেই/u.test(t);
  return { dialogue, data, comparison, timeBridge, emotion, explicitAction, negated };
}
const assetKey = (b) => b?.template || (b?.recipe ? `recipe:${b.recipe.props.map((p) => p.sizeId || p.asset || p.piece || p.label).sort().join('|')}` : null);
export function selectVisualTreatment(shot, text, { state = createVisualState(), film = {}, explicit = {} } = {}) {
  const s = structuredClone(shot), intent = transcriptIntent(text), i = state.index++;
  const policy = VISUAL_KNOWLEDGE.editorialPolicy;
  const notes = [], manualBroll = explicit.broll != null;
  const dataCards = (s.overlays || []).filter((o) => !attached.has(o.kind));
  if (explicit.headline == null && !intent.data && !dataCards.length && i > 0) {
    if (s.headline) notes.push('Let captions carry the narration instead of repeating a headline banner on every shot.');
    s.headline = null;
  }
  // Author choices remain authoritative. Only automatically chosen inserts are rationed.
  if (!manualBroll && s.broll) {
    const named = thingsNamed(text), matched = matchTemplate(text);
    if (s.broll.template && matched && matched.id !== s.broll.template) {
      notes.push('Replaced an unsupported classifier insert with the template directly supported by the transcript.');
      s.broll = { ...s.broll, template: matched.id };
    }
    const key = assetKey(s.broll);
    const supported = s.broll.template ? matched?.id === s.broll.template : named.length > 0;
    const densityLimit = Math.max(1, Math.ceil(state.total * policy.maxAutomaticInsertShare));
    let why = null;
    if (!supported) why = 'The transcript does not support this insert; keep the scene.';
    else if (s.camera?.kind === 'establish') why = 'Let the new location establish before an insert.';
    else if (dataCards.length) why = 'The data graphic already explains this beat.';
    else if (intent.dialogue || intent.emotion || (intent.explicitAction && !intent.timeBridge)) why = 'Keep the character action or reaction visible.';
    else if (state.used.has(key)) why = 'This insert already appeared; return to the scene instead of replaying it.';
    else if (i - state.lastInsert <= policy.minimumShotsBetweenInserts) why = 'Leave breathing room between inserts.';
    else if (state.inserts >= densityLimit) why = 'The film already has enough automatic inserts.';
    if (why) { s.broll = false; notes.push(why); }
  }
  // A time bridge is one useful scene replacement. Unknown prose alone never justifies
  // unrelated stock-like imagery: require a supported template/recipe and leave a receipt.
  if (s.broll == null && !manualBroll && film.broll !== false && intent.timeBridge && !intent.dialogue && !dataCards.length && s.camera?.kind !== 'establish') {
    const candidate = brollFor(text, { mode: 'cutaway' });
    const key = assetKey(candidate);
    if (candidate && !state.used.has(key) && i - state.lastInsert > policy.minimumShotsBetweenInserts && state.inserts < Math.max(1, Math.ceil(state.total * policy.maxAutomaticInsertShare))) s.broll = candidate;
  }
  if (s.broll && !manualBroll && intent.timeBridge) s.broll = { ...s.broll, mode: 'cutaway', seconds: Math.min(3, s.broll.seconds || 2.5) };
  if (s.broll) { state.inserts++; state.lastInsert = i; state.used.set(assetKey(s.broll), i); }
  // Repeated decorative head effects are not a substitute for acting. Explicit overlays,
  // and charts with newly narrated values, are retained.
  if (!explicit.overlays && !intent.data) {
    s.overlays = (s.overlays || []).filter((o) => {
      if (attached.has(o.kind) && state.lastGraphic === o.kind) { notes.push('Rest the repeated decorative effect; keep the facial performance.'); return false; }
      return true;
    });
  }
  state.lastGraphic = s.overlays?.at(-1)?.kind || null;
  // These elements are created after the first QA pass. Give their visible entrances
  // the existing local cues, without adding a sound to every ordinary dialogue shot.
  if (film.soundEffects !== false) {
    const cues = s.broll ? [[s.broll.mode === 'cutaway' ? 'wh-short' : 'tx-pop', s.broll.mode === 'cutaway' ? 0 : 0.3]] : s.headline || s.overlays?.length ? [['tx-ui', 0.3]] : [];
    const have = new Set((s.sfx || []).map(([id]) => id));
    s.sfx = [...(s.sfx || []), ...cues.filter(([id]) => !have.has(id))];
  }
  s.visualDecision = { kind: s.broll ? s.broll.mode === 'cutaway' ? 'cutaway' : 'scene_with_insert' : dataCards.length ? 'scene_with_graphic' : 'scene', intent, notes,
    fallback: !s.broll && !dataCards.length ? 'Retain the cast/location and literal supported action; do not invent an event.' : null };
  return s;
}
