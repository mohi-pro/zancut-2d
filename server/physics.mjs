// Node side of engine/cartoon/physics-logic.js: the real size table is loaded once, then a film is checked and corrected
// before it is drawn. Deterministic rules only (no model).
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';
import '../engine/cartoon/physics-logic.js';

const Z = globalThis.ZPHYS;
const sizes = JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'sizes.json'), 'utf8'));
// props learned by server/web-learner.mjs join the size table (their class band and support zone)
export function refreshLearned(file = path.join(ENGINE_DIR, 'cartoon', 'library', 'learned-props.json')) {
  let learned = {}; try { learned = JSON.parse(fs.readFileSync(file, 'utf8')).props || {}; } catch { /* none learned yet */ }
  const items = { ...sizes.items }; for (const p of Object.values(learned)) items[p.id] = { what: `${p.label} (learned)`, anchor: { SKY_FLOATING: 'sky', HELD_IN_HAND: 'held', WALL_MOUNTED: 'wall' }[p.zone] || 'ground', height: p.metres ? [p.metres.min, p.metres.usual, p.metres.max] : [0.15, 0.2, 0.3] };
  Z.setData({ sizes: { ...sizes, items } }); return Object.keys(learned).length;
}
refreshLearned();
export const ZPHYS = Z;
export const sanitizeShot = (shot, opts = {}) => Z.sanitizeShot(shot, opts);
export const sanitizeFilm = (film, opts = {}) => Z.sanitizeFilm(film, opts);
export const { fall, throwArc, gait, zoneOf, classOf, outdoorOnly, saneMetres, placeKind, ZONES, PLACES } = Z;
