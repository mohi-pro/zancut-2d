// Deterministic project settings, frame sizes, colour tokens and authoring metadata.
// Legacy media fields remain readable; no voice generator or cloud client is loaded.
import fs from 'node:fs';
import path from 'node:path';
import { SKILLS_DIR } from './config.mjs';
import { computeColorHarmony } from './colors.mjs';

const J = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(SKILLS_DIR, f), 'utf8')); } catch { return d; } };

export const FORMATS = {
  '9:16': { label: 'Reels / Shorts / TikTok', w: 1080, h: 1920 }, '16:9': { label: 'YouTube', w: 1920, h: 1080 },
  '1:1': { label: 'Square', w: 1080, h: 1080 }, '4:5': { label: 'Instagram feed', w: 1080, h: 1350 },
};
export const KINDS = {
  talking: { label: 'Talking head', sub: 'You on camera.' },
  faceless: { label: 'Storytelling', sub: 'Your recorded voice, told with motion graphics.' },
  animation: { label: '2D Animation', sub: 'A cartoon story: characters that talk, feel and act (engine/cartoon).' },
};
// Read legacy media flags without loading Studio screen-matching services.
export const screenLed = (p) => (p.assets || []).some((a) => a.role === 'screen') && voiceSource(p) === 'own';
// the customer's own video clips (a b-roll clip, or a screen recording beside a voice of its own) and pictures
export const isOwnClip = (a, p) => a.role === 'broll' || (a.role === 'screen' && !screenLed(p));
export const isOwnMedia = (a, p) => a.role === 'image' || isOwnClip(a, p);
// where a screen-led video's voice comes from: the camera video (talking head), a voice recording, the AI voice, or the screen
// recording's own sound
export const voiceSource = (p) => (p.kind === 'talking' && p.footage?.length ? 'video' : (p.assets || []).some((a) => a.role === 'voiceover') ? 'voice' : p.aiVoice ? 'ai' : 'own');
// no longer offered; an older video of this type still opens and renders as it was made
const RETIRED_KINDS = { interview: { label: 'Interview', sub: 'Two or more people talking, a podcast.' } };
export const NOISE = { auto: null, off: false, light: 12, medium: 20, strong: 30 };
// the pace leans the voice's own pace (the voice is the clock: scenes follow its thoughts, motion its energy)
export const PACES = { calm: 'Calm: fewer, longer scenes than the voice alone suggests, slow gentle motion, more time on the speaker.', normal: 'Normal: the voice sets the pace: one complete thought per scene, motion as relaxed or lively as the speaker.', fast: 'Fast: a little punchier than the voice: shorter scenes where the voice allows, snappier motion.' };
// colour themes (skills/palettes.json)
export function palettes() {
  const t = J('palettes.json', { palettes: {} });
  return Object.entries(t.palettes || {}).map(([k, v]) => ({ id: k, label: v.label, accent: v.accent, accent2: v.accent2, dark: v.darkBg, light: v.lightBg }));
}
// design systems (skills/styles.json); only the ready ones can be chosen
export function styleSystem() {
  const j = J('styles.json', { styles: {} });
  return { def: j.default, list: Object.entries(j.styles || {}).map(([id, x]) => ({ id, ...x })) };
}
// a design system with its own screen (kind "animation": 2D Animation, #/animation) is never a video's graphics style
const styleOf = (id) => styleSystem().list.find((x) => x.id === id && x.ready && !x.kind);
// a video type with its own design system (kind "animation": skills/2d-animation, through the same director → designers →
// review pipeline): that system, whatever the setup's graphics style says
const kindStyle = (p) => (p?.kind ? styleSystem().list.find((x) => x.kind === p.kind && x.ready) : null);
export const designOf = (p) => kindStyle(p)?.id || (styleOf(p.designStyle) ? p.designStyle : styleSystem().def);
export const themeOf = (p) => (kindStyle(p) ? kindStyle(p).defaultTheme || 'light' : p.theme === 'light' || p.theme === 'dark' ? p.theme : styleOf(designOf(p))?.defaultTheme || 'dark');
// the video's colour tokens: the customer's theme (Zancut cyan by default) + light/dark → the 8+ CSS tokens of every scene
// A design system may set its own grounds, cards and ink (styles.json "tokens": Minimal's neutral stone grey and graphite);
// the accents always come from the customer's colour theme.
export const paletteOf = (p) => palettes().find((x) => x.id === p.palette) || palettes().find((x) => x.id === styleOf(designOf(p))?.defaultPalette) || palettes().find((x) => x.id === 'zancut') || { accent: '#1FB6F5', accent2: '#7B4DFF' };
export function tokensFor(p) {
  const pal = paletteOf(p);
  return { ...computeColorHarmony(pal.accent, pal.accent2, themeOf(p)), ...((kindStyle(p) || styleOf(designOf(p)))?.tokens?.[themeOf(p)] || {}) };
}
// the design system's own settings beyond its skill: music bed (false = none unless the customer's own), sound profile
export const styleInfo = (p) => kindStyle(p) || styleOf(designOf(p)) || {};
// what the customer sees as the look, in plain words, with the exact colours (for the director, the designer and the checker)
export function styleLook(p) {
  const T = tokensFor(p), pal = paletteOf(p);
  return `${styleOf(designOf(p))?.name || 'Glossy'}, ${themeOf(p).toUpperCase()} mode, colour theme ${pal?.label || 'Zancut cyan'}: accent ${T['--zk-a']}, second ${T['--zk-b']}, third ${T['--zk-c']}, ground ${T['--zk-bg-mid']} → ${T['--zk-bg-deep']}, text ${T['--zk-ink']}.`;
}


// ---------- checking what the browser sends ----------
export function cleanStudio(k, v) {
  switch (k) {
    case 'format': return FORMATS[v] ? String(v) : undefined;
    case 'kind': return KINDS[v] ? v : undefined;
    case 'designStyle': return styleOf(v) ? v : undefined;
    case 'palette': return palettes().some((x) => x.id === v) ? v : undefined;
    case 'theme': return ['light', 'dark'].includes(v) ? v : undefined;
    case 'pace': return PACES[v] ? v : undefined;
    case 'noise': return v in NOISE ? v : undefined;
    case 'glossary': return typeof v === 'string' ? v.slice(0, 600) : undefined;
    // 2D Animation: who speaks (the script decides when it is clear; this is the fallback) and the narrator's voice
    case 'animFormat': return ['narrator', 'characters', 'mixed'].includes(v) ? v : undefined;
    case 'narratorGender': return ['male', 'female'].includes(v) ? v : undefined;
    case 'animSource': return ['script', 'voice'].includes(v) ? v : undefined;
    default: return undefined;
  }
}
export const STUDIO_FIELDS = ['format', 'kind', 'designStyle', 'palette', 'theme', 'pace', 'noise', 'glossary', 'animFormat', 'narratorGender', 'animSource'];

// the older fields the rest of the app reads, kept in step with the studio choices
export function syncLegacy(p) {
  if (p.format) p.type = p.format === '16:9' ? 'youtube' : 'reel';
  if (p.kind) p.mode = p.kind === 'faceless' || p.kind === 'animation' ? 'faceless' : 'face'; // 2D Animation: its voice track is the main clip, like Storytelling
  if (p.kind === 'faceless') p.voice = p.aiVoice ? (String(p.voiceId || '').startsWith('male') ? 'male' : 'female') : 'none';
}

// ---------- into the engine (job.json) ----------
export function jobExtras(p) {
  const x = {}, f = FORMATS[p.format] || FORMATS['9:16'];
  if (p.format && p.format !== '9:16') x.canvas = `${f.w}x${f.h}`;
  if (p.noise && NOISE[p.noise] !== null && p.noise in NOISE) x.denoise = NOISE[p.noise];
  x.zancut = { kind: screenLed(p) && voiceSource(p) !== 'video' ? 'screen' : p.kind || 'talking', palette: p.palette || 'zancut', pace: p.pace || 'normal', designStyle: designOf(p), theme: themeOf(p) };
  return x;
}

// ---------- readable setup metadata (used by authoring regression tools) ----------
const LANG = { en: 'English', bn: 'Bangla', hi: 'Hindi', ur: 'Urdu', ar: 'Arabic', es: 'Spanish', fr: 'French', de: 'German', pt: 'Portuguese', id: 'Indonesian', tr: 'Turkish' };
export const langName = (c) => LANG[c] || c;
export function setupBlock(p) {
  const kind = p.kind || 'talking', f = FORMATS[p.format] ? p.format : '9:16';
  const L = ["## The customer's setup (strict: their choices)"];
  L.push(`- Frame: ${f} (${FORMATS[f].label}, ${FORMATS[f].w}×${FORMATS[f].h}).`);
  L.push(`- Video type: ${(KINDS[kind] || RETIRED_KINDS[kind] || KINDS.talking).label}${screenLed(p) ? ', made of screen recordings with their own voice (the picture follows the voice through them where they fit; the customer\'s notes and Prompt say how to use them)' : (p.assets || []).some((a) => a.role === 'screen') ? ', with screen recordings among the customer\'s files (studied step by step: each step is shown on the words that talk about it)' : ''}.`);
  L.push(`- Design system: ${styleOf(designOf(p))?.name || 'Glossy'} — every graphic is designed for its moment in this style, strictly by its skill.`);
  L.push(`- Look (exact colours, already set as CSS tokens): ${styleLook(p)}`);
  L.push(`- Pace: ${PACES[p.pace] || PACES.normal}`);
  L.push(`- Language: every on-screen text in ${langName(p.language) || 'the language of the words'}${p.language === 'bn' ? ' (Bangla Unicode; English tech and brand words stay in Latin letters)' : ''}.`);
  if (p.glossary?.trim()) L.push(`- Spell these names exactly: ${p.glossary.trim()}`);
  return L.join('\n');
}
