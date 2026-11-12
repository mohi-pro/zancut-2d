// Scene geography: a destination, memory or picture is not evidence of arrival.
// This conservative grammar constrains location selection; it does not label/train the classifier.
import { readyPlaces } from './place-registry.mjs';
const NF = s => String(s || '').normalize('NFC');
const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const aliases = Object.entries(readyPlaces).flatMap(([place, p]) => [place, ...p.aliases].map(alias => ({ place, alias: NF(alias).toLowerCase() })));
const referenceBefore = /\b(?:remember(?:ed|s|ing)?|imagin(?:e|ed|es|ing)|dream(?:ed|s|ing)?(?:\s+of)?|talk(?:ed|s|ing)?\s+about|discuss(?:ed|es|ing)?|(?:photo(?:graph)?|picture|drawing|story|postcard)\s+(?:of|about))\s+(?:(?:the|a|an|her|his|old|nearby)\s+){0,3}$/iu;
const referenceAfter = /^(?:ের|য়ের|র|এর|ে|য়)?\s*(?:ছবি|ছবির|স্মৃতি|কথা|গল্প|যাওয়ার কথা|যাবার কথা|যাওয়ার ইচ্ছে|যাওয়ার পরিকল্পনা)/u;
const future = /\b(?:will|would|plans?\s+to|want(?:s|ed)?\s+to|hopes?\s+to|tomorrow|next\s+week)\b|আগামী|যাওয়ার ইচ্ছে|যেতে চাই/u;
const travelBefore = /\b(?:on\s+(?:the|her|his|their)\s+way\s+to|(?:walk(?:ed|s|ing)?|head(?:ed|s|ing)?|travel(?:led|ing|s)?|go(?:ing)?)\s+(?:towards?|to)|set\s+off\s+for|left\s+for)\s+(?:(?:the|a|an|her|his)\s+){0,2}$/iu;
const travelAfter = /^(?:ের|য়ের|র|ে|য়)?\s*(?:যাওয়ার পথে|যাবার পথে|যাওয়ার উদ্দেশ্যে|যাচ্ছ|যেতে|দিকে|অভিমুখে|উদ্দেশে|পথে)/u;
const arrival = /\b(?:arriv(?:e|ed|es|ing)\s+(?:at|in)|reach(?:ed|es)?|enter(?:ed|s)?)\b|পৌঁছ|প্রবেশ|ঢুক/iu;
const departure = /\b(?:set\s+off|left\s+for)\b|রওনা\s*(?:হল|হলো|দিল)|বেরিয়ে\s*(?:পড়ল|পড়লো)/iu;
const walking = /\bwalk(?:ed|s|ing)?\b|হাঁট|হেঁটে/u;
const routes = new Set(['village_road', 'city_street', 'forest_path', 'mountain_valley', 'desert_dunes']);
const depictedSubject = /\b(?:photo(?:graph)?|picture|drawing|postcard)\s+of\b|\b(?:imagined?|dreamed\s+of)\b|ছবি\s*(?:আঁক|দেখ|দেখল)|ছবিতে|কল্পনায়|স্বপ্নে/u;

function mentions(text) {
  const found = [];
  for (const { place, alias } of aliases) {
    const re = /^[\x00-\x7f]+$/.test(alias) ? new RegExp(`(^|[^a-z])(${escape(alias)})(?=$|[^a-z])`, 'giu') : new RegExp(escape(alias), 'gu');
    for (const m of text.matchAll(re)) {
      const at = m.index + (m[2] ? m[1].length : 0), end = at + alias.length;
      const left = text.slice(Math.max(0, at - 90), at).split(/[,;।.!?]/u).at(-1), right = text.slice(end, end + 60);
      let kind = 'current';
      if (referenceBefore.test(left) || referenceAfter.test(right) || future.test(left)) kind = 'reference';
      else if ((travelBefore.test(left) || travelAfter.test(right)) && !arrival.test(left + ' ' + right.slice(0, 35))) kind = 'destination';
      found.push({ place, alias, at, end, kind });
    }
  }
  // A short alias inside a longer match cannot defeat that longer phrase's grammar.
  return found.filter(a => !found.some(b => b !== a && b.at <= a.at && b.end >= a.end && b.alias.length > a.alias.length));
}
export function locationIntent(sentence, { before = null } = {}) {
  const text = NF(sentence).toLowerCase(), all = mentions(text), current = all.filter(m => m.kind === 'current');
  const homeAllowed = !depictedSubject.test(text);
  if (current.length) {
    current.sort((a, b) => b.alias.length - a.alias.length || a.at - b.at);
    return { place: current[0].place, constrained: false, homeAllowed, reason: 'current-location' };
  }
  const traveling = all.some(m => m.kind === 'destination') && !all.some(m => m.kind === 'reference');
  if (traveling) {
    let place = before;
    if (!before || (departure.test(text) && !routes.has(before)) || (walking.test(text) && readyPlaces[before]?.indoors)) {
      place = ['office_room', 'hospital_clinic', 'restaurant_cafe', 'courthouse_hall'].includes(before) ? 'city_street' : 'village_road';
    }
    return { place, constrained: true, homeAllowed: false, reason: 'destination-before-arrival' };
  }
  if (all.length || !homeAllowed) return { place: before, constrained: true, homeAllowed: false, reason: 'referenced-location' };
  return { place: null, constrained: false, homeAllowed, reason: null };
}
