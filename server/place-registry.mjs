// Ready scene vocabulary is distinct from words.json's existing part-co-occurrence buckets.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';
export const readyPlaces = JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, 'cartoon/library/words.json'), 'utf8')).readyPlaces;
export function resolvePlace(text, { newOnly = false } = {}) {
  const s = String(text).normalize('NFC').toLowerCase(); let best = null, length = 0;
  for (const [id, place] of Object.entries(readyPlaces)) {
    if (newOnly && !place.step3) continue;
    for (const alias of [id, ...place.aliases]) {
      const needle = alias.normalize('NFC').toLowerCase(), escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const hit = /^[\x00-\x7f]+$/.test(needle) ? new RegExp(`(?:^|[^a-z])${escaped}(?=$|[^a-z])`).test(s) : s.includes(needle);
      if (hit && needle.length > length) { best = id; length = needle.length; }
    }
  }
  return best;
}
