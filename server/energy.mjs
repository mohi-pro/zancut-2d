// How much body a move uses (engine/cartoon/library/gesture-energy.json): the planner and the strict rules ask here whether a
// big move (run, jump, dance, fight, wild wave, cheer…) is really what the sentence says.
import fs from 'node:fs';
import path from 'node:path';
import { ENGINE_DIR } from './config.mjs';

export const ENERGY = JSON.parse(fs.readFileSync(path.join(ENGINE_DIR, 'cartoon', 'library', 'gesture-energy.json'), 'utf8'));
const NF = (s) => String(s ?? '').normalize('NFC').toLowerCase();
const HIGH = Object.fromEntries(Object.entries(ENERGY.HIGH_ENERGY_LOCOMOTION).map(([k, ws]) => [k, ws.map(NF)]));
export const isHigh = (move) => Object.prototype.hasOwnProperty.call(HIGH, move);
export const isCalm = (move) => ENERGY.CONVERSATIONAL_SAFE.includes(move);
// the sentence's own words that call for this big move ([] = none)
export const triggersOf = (move, text) => (HIGH[move] || []).filter((w) => (/^[a-z !]+$/.test(w) ? new RegExp(`(?:^|[^a-z])${w.replace(/[!]/g, '\\$&')}`).test(NF(text)) : NF(text).includes(w)));
// a big move is allowed only when the words say it AND the brain is sure (ENERGY.minConfidence)
export const allowHigh = (move, text, conf) => !isHigh(move) || (conf > ENERGY.minConfidence && triggersOf(move, text).length > 0);
// the calm move that replaces a refused big one (a locomotion → standing; a big gesture → talking hands)
export const calmFor = (move) => (['run', 'jump', 'dance', 'fight'].includes(move) ? 'idle' : 'talk_explain');
