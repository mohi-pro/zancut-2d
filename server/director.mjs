// Deterministic scene-file IO and engine timeline assembly for Zancut 2D.
// Animation authoring guidance used by regression tools lives in animation-guidance.mjs.
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { SKILLS_DIR, ENGINE_DIR, ASSETS_DIR } from './config.mjs';
import { tokensFor, designOf, themeOf, FORMATS, styleInfo, screenLed, voiceSource, isOwnMedia } from './studio.mjs';
const fitsScreens = (p) => screenLed(p) && ['voice', 'ai', 'video'].includes(voiceSource(p));
const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
// the kind the plan is made for: the customer's type, or "screen" when screen recordings among the extra files carry the picture
const typeOf = (p) => (['talking', 'faceless', 'interview'].includes(p.kind) ? p.kind : p.mode === 'faceless' || !p.footage?.length ? 'faceless' : 'talking');
const kindOf = (p) => (screenLed(p) && voiceSource(p) !== 'video' ? 'screen' : typeOf(p));
// a talking head with screen recordings: the camera carries it, and "screen" rows show the recording matched to the voice
// (cut/screen.mp4, a layer of its own) in a window, zoomed to what is said
const beside = (p) => typeOf(p) === 'talking' && fitsScreens(p);
// every word the voice gave, in NFC (one code point sequence per Bangla letter: a vowel sign or a hasanta never travels alone)
const wordsOf = (t) => (Array.isArray(t) ? t : t?.words || []).map((w) => (typeof w?.text === 'string' && w.text !== w.text.normalize('NFC') ? { ...w, text: w.text.normalize('NFC') } : w));
export const jobDir = (ws) => path.join(ws, 'job');

export const mixOf = (sb) => (sb?.video?.mix && typeof sb.video.mix === 'object' && Object.keys(sb.video.mix).length ? sb.video.mix : null);
export const mineName = (file) => `assets/mine/${path.basename(String(file))}`;
export function parseStoryboard(text) {
  const m = String(text || '').match(/```json\s*([\s\S]*?)```/) || String(text || '').match(/(\{[\s\S]*\})/);
  if (!m) return null;
  try { const sb = JSON.parse(m[1]); return Array.isArray(sb.rows) && sb.rows.length ? sb : null; } catch { return null; }
}
// Code keeps only what must be true for the page to work: rows back to back (no gap, no overlap), valid values, anchors chained
// on cut joins (the cutless contract) and one ground per run of joined scenes. Every choice of design, pace and camera (how many
// scenes, where they cut, archetypes, stages, transitions, word locks, punch-ins, risers) stays as the director made it.
const STAGES = ['stage-radial-tint', 'stage-spotlight-cone', 'stage-perspective-floor', 'stage-eclipse-horizon', 'stage-elevated-wash'];
const POSE = (a) => (a && typeof a === 'object' && Number.isFinite(+a.xPct) && Number.isFinite(+a.yPct) ? { type: String(a.type || 'card').slice(0, 10), xPct: Math.max(0, Math.min(100, +a.xPct)), yPct: Math.max(0, Math.min(100, +a.yPct)), wPx: Math.max(4, Math.min(4000, +a.wPx || 200)), hPx: Math.max(4, Math.min(4000, +a.hPx || 120)), color: String(a.color || 'var(--zk-a)').slice(0, 40), scale: Math.max(0.1, Math.min(4, +a.scale || 1)), ...(typeof a.look === 'string' && a.look.trim() ? { look: a.look.trim().slice(0, 200) } : {}) } : null);
export function tidyStoryboard(p, sb, nWords) {
  // the visible transitions this design system allows (styles.json "transitions"; light leaks are not glass or editorial)
  let MOVES = (styleInfo(p)?.transitions || ['zoom-blur', 'blur']).filter((x) => ['zoom-blur', 'blur', 'light-leak'].includes(x));
  // where the director left no valid transition: a calm video gets the soft blur, others alternate (its own choice always stays)
  const calmMood = /calm|caring|gentle|soft|serious|informative|educational|medical|warm|relax/i.test(String(sb.video?.mood || ''));
  if (!MOVES.length) MOVES = ['blur'];
  const pick = (i) => (calmMood && MOVES.includes('blur') ? 'blur' : MOVES[i % MOVES.length]);
  const kind = kindOf(p), rows = sb.rows.map((r, k) => ({ ...r, _k: k })).filter((r) => Number.isInteger(+r.from) && Number.isInteger(+r.to)).map((r) => ({ ...r, from: +r.from, to: +r.to })).sort((a, b) => a.from - b.from);
  if (!rows.length) return null;
  rows[0].from = 0;
  for (let i = 1; i < rows.length; i++) rows[i].from = rows[i - 1].to + 1; // no gap, no overlap: each row starts right after the last
  for (let i = 0; i < rows.length; i++) rows[i].to = i < rows.length - 1 ? Math.max(rows[i].from, rows[i + 1].from - 1) : Math.max(rows[i].from, nWords - 1);
  const keep = rows.filter((r, i) => r.to >= r.from && (i === rows.length - 1 || r.from < nWords));
  keep.forEach((r, i) => {
    const prev = keep[i - 1];
    if (kind === 'faceless' && r.piece === 'speaker') r.piece = 'custom';
    if (kind === 'screen' && r.piece === 'speaker') r.piece = 'screen';
    if (!r.piece) r.piece = 'custom';
    const cutJoin = prev && prev.piece === 'custom' && r.piece === 'custom' && !['over-torso-glass', 'lower-third-kinetic', 'behind-head-depth'].includes(r.thMode) && !['over-torso-glass', 'lower-third-kinetic'].includes(prev.thMode);
    // One continuous film: scenes joined on an anchor keep ONE ground (the same stage, which carries on from where the last scene
    // left it). The ground changes only at a pivot, the director's deliberate turn of the idea: that join arrives with a visible
    // transition instead of a cut.
    const pivot = Boolean(cutJoin && r.pivot === true);
    const graphicChain = Boolean(cutJoin && !pivot);
    delete r.pivot; if (pivot) r.pivot = true;
    const frozen = r._frozen; delete r._frozen; // a scene built before and kept as it is (a part planned again): its ground stays as built
    if (r.piece === 'custom') {
      if (frozen) r.groundRun = graphicChain ? (prev.groundRun || 0) + 1 : 0;
      else if (graphicChain) { r.bgStage = prev.bgStage; r.groundRun = (prev.groundRun || 0) + 1; }
      else {
        r.groundRun = 0;
        if (!STAGES.includes(r.bgStage) && r.bgStage !== 'none') r.bgStage = STAGES[i % STAGES.length];
      }
      r.archetype = Math.max(1, Math.min(7, +r.archetype || 1));
    } else delete r.groundRun;
    r.anchorIn = POSE(r.anchorIn); r.anchorOut = POSE(r.anchorOut);
    if (graphicChain && prev.anchorOut) { r.anchorIn = prev.anchorOut; r.transition = 'cut'; }
    // a film's cut (styles.json filmCuts: 2D Animation): the director's hard cut between two shots stays a cut
    else if (styleInfo(p)?.filmCuts && (r.transition === 'cut' || !r.transition)) { r.transition = 'cut'; r.anchorIn = null; }
    else { if (r.transition === 'cut' || !r.transition || !MOVES.includes(r.transition)) r.transition = i === 0 ? 'cut' : pick(i); if (!graphicChain) r.anchorIn = null; }
    // the director's riser + hit into this scene (the engine places it where the director marks, nowhere else)
    if (r.rise === true) r.rise = true; else delete r.rise;
    // the icons, logos and emoji the row needs (code looks them up before its builder starts)
    r.icons = r.piece === 'custom' && Array.isArray(r.icons) ? [...new Set(r.icons.map((x) => String(x || '').trim().slice(0, 40)).filter(Boolean))].slice(0, 6) : [];
    if (!r.icons.length) delete r.icons;
    // a 2D shot's needs: what it uses, in plain words (code finds the library parts for them: server/parts.mjs)
    r.needs = r.piece === 'custom' && Array.isArray(r.needs) ? [...new Set(r.needs.map((x) => String(x || '').trim().slice(0, 100)).filter(Boolean))].slice(0, 12) : [];
    if (!r.needs.length) delete r.needs;
    // every word on screen, written out by the director: one set of words for the designer, the reviewer and the customer's changes
    r.texts = Array.isArray(r.texts) ? r.texts.map((x) => ({ on: String(x?.on || '').trim().slice(0, 80), words: String(x?.words || '').trim().slice(0, 300) })).filter((x) => x.words).slice(0, 16) : [];
    if (!r.texts.length) delete r.texts;
    r.wordLocks = (Array.isArray(r.wordLocks) ? r.wordLocks : []).filter((x) => x && Number.isInteger(+x.word) && +x.word >= r.from && +x.word <= r.to).slice(0, 8).map((x) => ({ word: +x.word, event: String(x.event || '').slice(0, 120) }));
    // punch-ins (a speaker row's zoom on its strongest words): whole word numbers inside the row, at most 2
    r.punch = r.piece === 'speaker' && Array.isArray(r.punch) ? [...new Set(r.punch.map(Number).filter((w) => Number.isInteger(w) && w >= r.from && w <= r.to))].sort((a, b) => a - b).slice(0, 2) : [];
    if (!r.punch.length) delete r.punch;
  });
  // reuse: the scene number as the lead sent it → an earlier graphic row of the tidy list that is built from zero (not itself a reuse)
  keep.forEach((r, i) => {
    const src = r.piece === 'custom' && r.reuse && typeof r.reuse === 'object' ? keep.findIndex((x) => x._k === Math.round(Number(r.reuse.scene)) - 1) : -1;
    r.reuse = src >= 0 && src < i - 1 && keep[src].piece === 'custom' && !keep[src].reuse?.scene ? { scene: src + 1, how: String(r.reuse.how || '').slice(0, 400) } : null;
  });
  keep.forEach((r) => { if (!r.reuse) delete r.reuse; delete r._k; });
  sb.rows = keep;
  sb.v = 3; // planned with the director deciding risers, music and captions (older storyboards keep the engine's own)
  return sb;
}

const PERSON_KINDS = new Set(['talking', 'interview']);
// the layout mode a scene is built for (the compositor's own default when the row has none)
export const modeOf = (p, r) => r.thMode || r.srMode || (kindOf(p) === 'screen' ? 'pc-browser-spotlight' : kindOf(p) === 'faceless' ? 'full-broll-takeover' : 'speaker');
export function writeGraphic(J0, name, html) {
  html = String(html || '').replace(/^\s*```html\s*/, '').replace(/```\s*$/, '').trim();
  if (!/<script>[\s\S]*<\/script>/.test(html)) return { error: 'The file needs one <script> block (the timeline code).' };
  const js = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join('\n');
  const bad = html.match(/setTimeout|setInterval|Math\.random|Date\.now|new Date|requestAnimationFrame|repeat:\s*-1|@keyframes/); // renders must repeat exactly
  if (bad) return { error: `The file uses "${bad[0]}": renders must repeat exactly. Animate only with tweens on tl.` };
  try { new Function('tl', 'root', 's', 'd', 'words', 'ZK', 'at', js); } catch (e) { return { error: `The script does not run: ${e.message}` }; }
  // a scene stays inside its own time and its own section: "visibility: visible" on a part shows it even while its scene is
  // hidden (a part of scene 7 was seen over 0–45 s), so it becomes "inherit" (visible exactly while the scene is); a lookup in
  // the whole page reaches other scenes' parts, so it looks in the scene only
  const fixed = [];
  const fix = (re, to, what) => { if (re.test(html)) { html = html.replace(re, to); fixed.push(what); } re.lastIndex = 0; };
  fix(/visibility\s*:\s*visible\b/gi, 'visibility:inherit', '"visibility: visible" is now "visibility:inherit" (a part may show only while its scene does)');
  fix(/(visibility\s*:\s*)(["'])visible\2/gi, '$1$2inherit$2', 'visibility "visible" in the script is now "inherit"');
  fix(/\bdocument\.querySelector(All)?\(/g, 'root.querySelector$1(', 'document.querySelector… is now root.querySelector… (only this scene\'s own parts)');
  const rel = `edit/scenes/${name}.html`;
  fs.mkdirSync(path.join(J0, 'edit', 'scenes'), { recursive: true });
  fs.writeFileSync(path.join(J0, rel), html);
  return { rel, fixed };
}
// the designer's sound cues (<!--cues [["wh-deep", 0.62], ...]-->): only families the sound kit has
let KIT = null;
// names from skill packs that our kit calls differently (skills/sound-system.md)
const CUE_ALIAS = { 'tx-reward': 'tx-success', 'wh-soft': 'wh-wind', 'wh-spacey': 'wh-future', 'wh-scifi': 'wh-future', 'tx-gizmo': 'tx-scifi-click' };
export function cuesOf(html, secs) {
  KIT ||= (J(path.join(ENGINE_DIR, 'sfx', 'pro-kit.json'), { items: [] }).items || []).map((x) => x.id);
  let list; try { list = JSON.parse((String(html).match(/<!--\s*cues\s*(\[[\s\S]*?\])\s*-->/) || [])[1]); } catch { return []; }
  if (!Array.isArray(list)) return [];
  const ok = (n) => n === 'typing' || n === 'hit' || /^lib:[a-z0-9-]+$/.test(n) || (/^(wh|tx|rs)-[a-z-]+$/.test(n) && KIT.some((id) => id === n || id.startsWith(`${n}-`))); // lib: = a sound found with find_sound
  return list.filter((x) => Array.isArray(x) && Number.isFinite(+x[1]) && +x[1] >= 0 && +x[1] < secs).map((x) => [CUE_ALIAS[String(x[0])] || String(x[0]), Math.round(+x[1] * 1000) / 1000]).filter(([n]) => ok(n)).slice(0, 8);
}

// ---------- storyboard → engine files ----------
export const firstCutWords = (J0) => wordsOf(J(path.join(J0, 'work', 'first-cut.json')) || J(path.join(J0, 'cut', 'transcript.json'), []));
export const cutWords = (J0) => wordsOf(J(path.join(J0, 'cut', 'transcript.json'), []));
const mapper = (firstWords, words) => (i, last) => {
  const src = firstWords[i]?.src; let k = src == null ? Math.min(i, words.length - 1) : words.findIndex((w) => w.src >= src);
  if (k < 0) k = words.length - 1; if (last && src != null && words[k]?.src > src && k > 0) k--; return Math.max(0, k);
};
export const zen = (ws, args, timeout = 40 * 60000) => new Promise((ok) => execFile('node', [path.join(ENGINE_DIR, 'zen.mjs'), args[0], '--ws', ws, ...args.slice(1)], { timeout, maxBuffer: 1 << 26 }, (e, so, se) => {
  const t = `${so || ''}${se || ''}`; let j = null; for (const s of [...t.matchAll(/\{[^\n]*\}/g)].map((x) => x[0]).reverse()) { try { j = JSON.parse(s); break; } catch { } } ok(j || { ok: false, error: t.slice(-600) });
}));
function layoutInfo(J0, p, r) {
  const f = FORMATS[p.format] || FORMATS['9:16'], W = f.w, H = f.h, TALL = H > W * 1.15, WIDE = W > H * 1.15;
  const R = (x, y, w, h) => ({ x: Math.round(x * W), y: Math.round(y * H), w: Math.round(w * W), h: Math.round(h * H) });
  const m = r.thMode || r.srMode;
  const Z = {
    'popout-box-split': TALL ? { top: R(0.06, 0.06, 0.88, 0.38), bridge: R(0.06, 0.45, 0.88, 0.06), speakerBox: R(0.06, 0.53, 0.88, 0.39) } : WIDE ? { top: R(0.04, 0.1, 0.46, 0.8), speakerBox: R(0.54, 0.16, 0.4, 0.76) } : { top: R(0.06, 0.05, 0.88, 0.36), speakerBox: R(0.08, 0.5, 0.84, 0.44) },
    'behind-head-depth': { behind: TALL ? R(0.04, 0.1, 0.92, 0.38) : R(0.04, 0.08, 0.92, 0.5) },
    'bg-replace-stage': { left: TALL ? R(0.02, 0.3, 0.3, 0.4) : R(0.03, 0.15, 0.3, 0.7), right: TALL ? R(0.68, 0.3, 0.3, 0.4) : R(0.67, 0.15, 0.3, 0.7), person: TALL ? R(0.25, 0.15, 0.5, 0.85) : R(0.33, 0.1, 0.34, 0.9) },
    'over-torso-glass': TALL ? { face: R(0.1, 0.1, 0.8, 0.33), header: R(0.08, 0.44, 0.84, 0.08), card: R(0.1, 0.53, 0.8, 0.31) } : { header: R(0.52, 0.4, 0.42, 0.1), card: R(0.55, 0.52, 0.37, 0.33) },
    'lower-third-kinetic': { lower: TALL ? R(0.06, 0.74, 0.88, 0.12) : R(0.05, 0.72, 0.5, 0.16) },
    'masked-pip-stage': TALL ? { pip: R(0.06, 0.6, 0.36, 0.3), stage: R(0.04, 0.06, 0.92, 0.52) } : { pip: R(0.04, 0.58, 0.24, 0.36), stage: R(0.3, 0.06, 0.66, 0.88) },
  }[m];
  if (Z) return { zones: Z, face: null };
  if (m === 'pc-browser-spotlight' || m === 'mobile-device-stage') {
    const sw = J(path.join(J0, 'work', 'screen.json'), {})?.aspect || 16 / 9;
    if (m === 'mobile-device-stage') { let h = H * (TALL ? 0.66 : 0.82), w = h * Math.min(sw, 0.6); if (w > W * 0.62) { w = W * 0.62; h = w / sw; } return { zones: { device: { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2), w: Math.round(w), h: Math.round(h) }, free: 'everything outside the device' } }; }
    let w = W * (TALL ? 0.92 : 0.74), h = w / sw; if (h > H * (TALL ? 0.6 : 0.78)) { h = H * (TALL ? 0.6 : 0.78); w = h * sw; }
    return { zones: { device: { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2 + (TALL ? H * 0.03 : H * 0.02)), w: Math.round(w), h: Math.round(h) }, free: 'everything outside the device' } };
  }
  return { zones: { full: R(0, 0, 1, 1), safe: TALL ? R(0.06, 0.08, 0.82, 0.77) : R(0.05, 0.06, 0.9, 0.88) } };
}
// Cut words of a row, scene-relative, with optional saved emphasis metadata.
function sceneWordsOf(J0, r, toNew, words, sceneStart, emph) {
  const a = toNew(r.from, false), b = toNew(r.to, true);
  return words.slice(a, b + 1).map((w, k) => ({ i: r.from + k, w: w.text, at: Math.max(0, w.start - sceneStart), end: Math.max(0, w.end - sceneStart), isEmphasis: emph.has(r.from + k) }));
}

// Each scene's facts for its builder, on the cut: its length, its words (scene-relative), its free zones and how it joins the next.
const cutLength = (J0) => Math.max(0, ...(J(path.join(J0, 'cut', 'segments.json'), {})?.segments || []).map((s) => Number(s.outEnd) || 0));
export function sceneContexts(d, p, sb) {
  const J0 = jobDir(d.ws), firstWords = firstCutWords(J0), words = cutWords(J0), toNew = mapper(firstWords, words);
  const gem = J(path.join(J0, 'work', 'GEMINI.json'), {}) || {};
  const emph = new Set([...(gem.emphasis || []).filter((e) => ['hero', 'key'].includes(e.kind || e[1])).map((e) => e.word ?? e[0]), ...(gem.moments || []).flatMap((m) => m.emphasisWords || [])]);
  // scene times on the cut (the compositor uses the same rule): each scene from its first word to the next scene
  const starts = sb.rows.map((r, i) => (i === 0 ? 0 : Math.max(0, (words[toNew(r.from, false)]?.start ?? 0) - 0.06)));
  // a 2D film's last scene runs to the end of the track: its silent end (a laugh, an end card) is part of the scene
  const trackEnd = J(path.join(J0, 'job.json'), {})?.keepTail ? cutLength(J0) : 0;
  const ends = sb.rows.map((r, i) => (i < sb.rows.length - 1 ? starts[i + 1] : Math.max(words.at(-1)?.end ?? 0, trackEnd)));
  return sb.rows.map((r, i) => {
    const L = layoutInfo(J0, p, r), nx = sb.rows[i + 1];
    const near = (x) => (x ? `${x.piece === 'custom' ? `graphic (${modeOf(p, x)}, archetype ${x.archetype || '-'}, ${x.bgStage || 'no stage'})` : x.piece}: "${String(x.metaphor || x.say || '').slice(0, 140)}"` : null);
    return { n: i + 1, secs: Math.max(1, ends[i] - starts[i]), sceneWords: sceneWordsOf(J0, r, toNew, words, starts[i], emph), zones: L.zones, face: L.face, memory: sb.memory, holdOut: !!(nx && nx.piece === 'custom' && nx.anchorIn && r.anchorOut), before: near(sb.rows[i - 1]), after: near(nx) };
  });
}
// The design system's ready parts (skills/<style>/atoms.css: its materials as classes), carried in the plan to the page
const atomsOf = (p) => { try { return fs.readFileSync(path.join(SKILLS_DIR, designOf(p), 'atoms.css'), 'utf8'); } catch { return ''; } };
// A ground that carries on (see tidyStoryboard): the page marks the scene so the stage starts where the scene before left it
const carryOf = (r) => (r.groundRun > 0 ? { carry: r.groundRun, ...(r.anchorIn ? { carryFrom: { x: r.anchorIn.xPct, y: r.anchorIn.yPct } } : {}) } : {});
// A graphic scene a builder saved, into the plan (the page is composed by the caller). Keeps the file on its row.
export function placeGraphic(d, p, sb, i, rel, secs) {
  const J0 = jobDir(d.ws), pf = path.join(J0, 'edit', 'plan.json'), plan = J(pf, null), r = sb.rows[i], nx = sb.rows[i + 1];
  const sc = plan?.scenes?.find((x) => x.row === i);
  if (!sc) throw new Error(`scene ${i + 1} is not in the plan`);
  const html = fs.readFileSync(path.join(J0, rel), 'utf8');
  delete sc.carry; delete sc.carryFrom;
  Object.assign(sc, { kind: 'graphic', mode: modeOf(p, r), file: rel, ...(r.media?.file ? { media: r.media.file } : {}), cues: cuesOf(html, secs), exit: !(nx && nx.piece === 'custom' && nx.anchorIn && r.anchorOut), ...carryOf(r) });
  r.file = rel;
  fs.writeFileSync(pf, JSON.stringify(plan, null, 1));
  fs.writeFileSync(path.join(J0, 'work', 'storyboard.json'), JSON.stringify(sb, null, 1));
}

function screenZooms(J0, p, screen, toCut) {
  const look = fitsScreens(p) ? J(path.join(J0, 'work', 'screen-focus.json'), []) || [] : [];
  const clicks = (screen?.events || []).filter((e) => e.focusRectPct && !e.idleScreen).map((e) => { const a = toCut(e.fromSec), b = toCut(e.toSec); return a != null && b != null && b > a ? { from: a, to: b, focus: e.focusRectPct, action: e.action } : null; }).filter(Boolean);
  return [...look, ...clicks.filter((c) => !look.some((l) => c.from < l.to && c.to > l.from))].sort((x, y) => x.from - y.from);
}
export async function buildPlan(d, p, sb, { step, ask, only = null, runQuery = null }) {
  const J0 = jobDir(d.ws), kind = kindOf(p);
  if (fitsScreens(p) || sb.rows.some(r => /^stock/.test(String(r.piece || '')) || r.media?.search || r.media?.steps?.length)) throw new Error('Studio stock search and AI screen matching are archived. Use a local 2D scene file.');
  const firstWords = firstCutWords(J0);
  const redo = only == null ? null : new Set([].concat(only)), mine = (i) => !redo || redo.has(i);
  // 1. the cut: the customer's removals and spelling fixes + the director's fixes (always from the prep's first cuts file)
  if (only == null) {
    const cuts = J(path.join(J0, 'work', 'cuts.first.json'), null) || J(path.join(J0, 'work', 'cuts.json'), {}) || {};
    const src = (i) => firstWords[i]?.src;
    const removed = (p.transcript?.removed || []).map(([a, b]) => [src(a), src(b)]).filter(([a, b]) => Number.isInteger(a) && Number.isInteger(b));
    if (removed.length) cuts.removeWords = [...(cuts.removeWords || []), ...removed];
    if (p.trim?.ranges?.length) cuts.removeRanges = [...(cuts.removeRanges || []), ...p.trim.ranges];
    const fixes = [...(sb.cut?.fixRanges || []).map(([a, b, t]) => [src(a), src(b), String(t || '')]), ...Object.entries(p.transcript?.fixes || {}).map(([i, t]) => [src(+i), src(+i), String(t || '')])].filter(([a, b, t]) => Number.isInteger(a) && Number.isInteger(b) && t);
    if (fixes.length) cuts.fixRanges = [...(cuts.fixRanges || []), ...fixes];
    cuts.decided = true; // the cut is exactly the customer's: roughcut.mjs shortens and speeds up nothing
    fs.writeFileSync(path.join(J0, 'work', 'cuts.json'), JSON.stringify(cuts, null, 1));
    step('Cutting');
    const c = await zen(d.ws, ['cut']); if (!c.ok) throw new Error(`cut: ${c.error}`);
  }
  const words = cutWords(J0), toNew = mapper(firstWords, words), ctxs = sceneContexts(d, p, sb);
  const old = J(path.join(J0, 'edit', 'plan.json'), null);
  // a graphic scene built over a photo or a clip ("media" on a custom row): a stock one is found and downloaded now, the
  // customer's own is linked; its builder gets it in the scene as .gx-media. Their files go into the job first (a fresh job
  // folder has none yet): a row is linked only to a file that is there
  for (const a of (p.assets || []).filter((x) => isOwnMedia(x, p))) { const to = path.join(J0, mineName(a.file)); if (!fs.existsSync(to)) { fs.mkdirSync(path.dirname(to), { recursive: true }); try { fs.linkSync(path.join(d.assets, a.file), to); } catch { fs.copyFileSync(path.join(d.assets, a.file), to); } } }
  const mediaRows = sb.rows.filter((r, i) => r.piece === 'custom' && r.media && !r.media.file && mine(i));
  for (const r of mediaRows) if (r.media.mine && fs.existsSync(path.join(J0, mineName(r.media.mine)))) r.media.file = mineName(r.media.mine);
  if (mediaRows.length) fs.writeFileSync(path.join(J0, 'work', 'storyboard.json'), JSON.stringify(sb, null, 1));
  // 3. the graphics their builders saved (the file each row recorded; never one guessed by its name: after a new plan, scene 5
  // is another scene)
  const files = {};
  sb.rows.forEach((r, i) => { if (r.piece === 'custom' && r.file && fs.existsSync(path.join(J0, r.file)) && fs.statSync(path.join(J0, r.file)).size > 50) files[i] = r.file; else delete r.file; });
  // 4. the plan
  const music = (() => {
    const own = (p.assets || []).find((a) => a.role === 'music');
    if (own) { const to = path.join(J0, mineName(own.file)); if (!fs.existsSync(to)) { fs.mkdirSync(path.dirname(to), { recursive: true }); try { fs.linkSync(path.join(d.assets, own.file), to); } catch { fs.copyFileSync(path.join(d.assets, own.file), to); } } return { src: mineName(own.file), volume: 0.112, own: true }; }
    // the director's call ("music": "bed" | "none"); with no call (older storyboards): none under Storytelling animations or in a
    // design system without a music bed (Minimal), a bed under a person speaking
    const want = sb.video?.music;
    if (want === 'none') return null;
    if (want !== 'bed' && (kind === 'faceless' || styleInfo(p).music === false)) return null;
    const cat = J(path.join(ASSETS_DIR, 'music', 'catalog.json'), { items: [] }), mood = String(sb.video?.mood || '').toLowerCase();
    const list = (cat.items || []).filter((x) => x.file); const pool = list.filter((x) => mood.includes(x.mood)); const all = pool.length ? pool : list.filter((x) => x.mood === 'inspiring').concat(list);
    const seed = [...String(p.id)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7), t = all[seed % Math.max(1, all.length)];
    return t ? { src: path.join(ASSETS_DIR, 'music', String(t.file).replace(/^music\//, '')), volume: 0.112, title: t.title, id: t.id } : null;
  })();
  const missing = [];
  const scenes = await Promise.all(sb.rows.map(async (r, i) => {
    const prevScene = old?.scenes?.find((x) => x.row === i);
    // a kept graphic keeps its file, but how it joins its neighbours is read again (a changed neighbour may now start from its anchor)
    if (!mine(i) && prevScene) {
      if (prevScene.kind !== 'graphic') return prevScene;
      const nx = sb.rows[i + 1], { carry, carryFrom, ...rest } = prevScene;
      return { ...rest, exit: !(nx && nx.piece === 'custom' && nx.anchorIn && r.anchorOut), ...carryOf(r) };
    }
    const base = {
      uid: prevScene?.uid || `u${Math.random().toString(36).slice(2, 10)}`, row: i, startWord: toNew(r.from, false), endWord: toNew(r.to, true), say: r.say, title: r.idea, transition: r.transition || 'cut', captions: r.captions || 'show',
      mode: modeOf(p, r), ...(Array.isArray(r.focus) ? { focus: r.focus } : {}), ...(r.punch?.length ? { punch: r.punch.map((w) => toNew(w, false)) } : {}), ...(r.rise ? { rise: true } : {})
    };
    const nx = sb.rows[i + 1];
    const snd = r.sound?.file && (p.assets || []).find((a) => a.role === 'sound' && a.file === path.basename(String(r.sound.file)));
    if (snd) { // a sound the customer attached to a comment: it plays at its moment in this scene
      const to = path.join(J0, 'assets', 'sounds', snd.file);
      if (!fs.existsSync(to)) { fs.mkdirSync(path.dirname(to), { recursive: true }); try { fs.linkSync(path.join(d.assets, snd.file), to); } catch { fs.copyFileSync(path.join(d.assets, snd.file), to); } }
      base.sound = { src: `assets/sounds/${snd.file}`, at: Math.max(0, Number(r.sound.at) || 0), vol: Math.max(0.05, Math.min(1.5, Number(r.sound.vol) || 0.7)) };
    }
    if (r.piece === 'custom') {
      const file = files[i];
      if (!file) { missing.push({ row: i, why: 'the graphic is not built yet' }); return { ...base, kind: kind === 'screen' || kind === 'faceless' ? 'fallback' : 'speaker', mode: kind === 'screen' ? 'concept-takeover-graphic' : base.mode === 'full-broll-takeover' ? 'speaker' : base.mode }; }
      const html = fs.readFileSync(path.join(J0, file), 'utf8');
      return { ...base, kind: 'graphic', file, ...(r.media?.file ? { media: r.media.file } : {}), cues: cuesOf(html, ctxs[i].secs), exit: !(nx && nx.piece === 'custom' && nx.anchorIn && r.anchorOut), ...carryOf(r) };
    }
    if (r.piece === 'mine' && r.mine?.file && fs.existsSync(path.join(J0, mineName(r.mine.file)))) return { ...base, kind: 'mine', media: mineName(r.mine.file), kicker: r.mine.kicker || '', text: r.mine.text || '' };
    const device = () => (['pc-browser-spotlight', 'mobile-device-stage'].includes(base.mode) ? base.mode : (J(path.join(J0, 'work', 'screen.json'), {})?.deviceAspect === 'mobile-9:16' ? 'mobile-device-stage' : 'pc-browser-spotlight'));
    if (kind === 'screen' || (r.piece === 'screen' && beside(p))) return { ...base, kind: 'screen', mode: device() };
    if (kind === 'faceless') return { ...base, kind: 'fallback' };
    return { ...base, kind: 'speaker', mode: 'speaker' };
  }));
  const screen = J(path.join(J0, 'work', 'screen.json'), null);
  const toCut = (sec) => { const fw = firstWords.findIndex((w) => w.start >= sec); return fw < 0 ? null : words[toNew(fw, false)]?.start; };
  // the customer's music level from a change round (the mix tool): quieter, louder or none
  const mdb = Number(mixOf(sb)?.musicDb);
  if (music && Number.isFinite(mdb) && mdb) music.volume = mdb <= -40 ? 0 : Math.round(music.volume * Math.pow(10, Math.max(-30, Math.min(6, mdb)) / 20) * 1000) / 1000;
  const plan = {
    version: 2, canvas: `${(FORMATS[p.format] || FORMATS['9:16']).w}x${(FORMATS[p.format] || FORMATS['9:16']).h}`, kind, style: designOf(p), theme: themeOf(p), tokens: tokensFor(p), ...(atomsOf(p) ? { atoms: atomsOf(p) } : {}),
    // running captions: always under a person speaking; in Storytelling only when the director turns them on
    captions: { on: kind === 'faceless' ? sb.video?.captions === 'on' : true }, ...(sb.v >= 3 ? { directorRisers: true } : {}), ...(music ? { music } : {}), ...(sb.video?.mood ? { mood: String(sb.video.mood).slice(0, 80) } : {}), ...(mixOf(sb) ? { mix: mixOf(sb) } : {}), ...(styleInfo(p).sound ? { soundProfile: styleInfo(p).sound } : {}), scenes,
    screenEvents: kind === 'screen' || beside(p) ? screenZooms(J0, p, screen, toCut) : [],
    ...(beside(p) && fs.existsSync(path.join(J0, 'cut', 'screen.mp4')) ? { screenVideo: 'cut/screen.mp4' } : {}),
    ...(old?.soundsOwn ? { sounds: old.sounds, soundsOwn: true } : {}), ...(old?.fx ? { fx: old.fx } : {}),
  };
  fs.mkdirSync(path.join(J0, 'edit'), { recursive: true });
  fs.writeFileSync(path.join(J0, 'edit', 'plan.json'), JSON.stringify(plan, null, 1));
  fs.writeFileSync(path.join(J0, 'work', 'storyboard.json'), JSON.stringify(sb, null, 1));
  step('Building the scenes');
  const c = await zen(d.ws, ['compose']); if (!c.ok) throw new Error(`compose: ${c.error}`);
  return { missing };
}
