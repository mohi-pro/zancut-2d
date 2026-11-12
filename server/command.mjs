// The "Create New / Teach Brain" command bar: one plain Bangla or English instruction → what it means, done locally (no AI).
//   "যখন(ই) … তখন …" / "when … then …"     → a brain rule (server/brain.mjs learnRule: adapted at once, weighted 5×)
//   "… বানাও / তৈরি করো / আঁকো", "make / create / draw …" → a procedural creation (server/procedural-creator.mjs)
//   "শেখো … / শিখে নাও … / learn …"          → a word looked up and remembered (server/web-learner.mjs; the web only if allowed)
//   anything else                              → what the brain predicts for that sentence, with its confidence
import { learnRule, parseRule } from './brain.mjs';
import { createCreation } from './procedural-creator.mjs';
import { learn } from './web-learner.mjs';
import { brain, forget } from './brainplan.mjs';
import { predict } from './brain.mjs';

const CREATE = /^(?:make|create|draw|build)\s+(?:a|an|the)?\s*(.+)$|^(.+?)\s*(?:বানাও|বানান|তৈরি করো|তৈরি কর|আঁকো|বানিয়ে দাও)\s*[।.!]?$/iu;
const LEARN = /^(?:learn|teach yourself|look up)\s+(.+)$|^(?:শেখো|শিখে নাও|শিখো|খুঁজে দেখো)\s+(.+?)[।.!]?$|^(.+?)\s+(?:শেখো|শিখে নাও)\s*[।.!]?$/iu;
export async function runCommand(text, { online = false } = {}) {
  const t = String(text || '').normalize('NFC').trim(); if (!t || t.length > 300) throw Object.assign(new Error('Type one instruction (up to 300 characters).'), { status: 400 });
  if (/^(?:যখনই|যখন|যদি|when|whenever|if)\s/iu.test(t)) {
    const rule = parseRule(t), r = learnRule(t); forget();
    return { kind: 'rule', topic: rule.topic, labels: rule.labels, examples: r.examples, ms: r.ms, said: `Learned: when the script mentions “${rule.topic}”, ${Object.entries(rule.labels).map(([h, v]) => `${h} = ${v}`).join(', ')} (${r.ms} ms).` };
  }
  const c = CREATE.exec(t);
  if (c) { const phrase = (c[1] || c[2]).trim(), made = createCreation(phrase); return { kind: 'creation', id: made.id, phrase, dna: made.dna, said: `Made “${phrase}”: ${made.dna.kind} (${made.dna.archetype}${made.dna.headCount > 1 ? `, ${made.dna.headCount} heads` : ''}${made.dna.effects.length ? `, ${made.dna.effects.join(', ')}` : ''}).` }; }
  const l = LEARN.exec(t);
  if (l) { const term = (l[1] || l[2] || l[3]).trim(), r = await learn(term, { online });
    return { kind: 'learned', term, result: r, said: r.known ? `Learned “${term}”: ${r.category}${r.prop ? ` with a prop (${r.prop})` : ''}${r.sources.length ? ` from ${r.sources.map((s) => s.kind).join(' + ')}` : ''}.` : `Could not learn “${term}”${online ? '' : ' offline (allow the web to try Wikipedia/Wikidata)'}.` }; }
  const p = predict(brain(), t), heads = Object.fromEntries(['place', 'action', 'face', 'broll', 'graphic', 'cameraMove'].map((h) => [h, { label: p[h].label, conf: +p[h].conf.toFixed(2) }]));
  return { kind: 'predict', heads, roles: p.roles.filter((r) => r.p > 0.5).map((r) => r.id), said: 'This is what the brain would draw for that sentence. To teach it, write “যখন … তখন …”.' };
}
