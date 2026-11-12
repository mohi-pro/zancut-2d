// Pure animation authoring text/metadata, retained for engine and library regression checks.
// This module has no model client, query runner or network service.
import fs from 'node:fs';
import path from 'node:path';
import { SKILLS_DIR } from './config.mjs';
import { setupBlock, designOf, isOwnMedia } from './studio.mjs';
import { kitBlock, libraryForBuilders } from './filmkit.mjs';
import { modeOf } from './director.mjs';
const typeOf = (p) => (['talking', 'faceless', 'interview'].includes(p.kind) ? p.kind : p.mode === 'faceless' || !p.footage?.length ? 'faceless' : 'talking');
const TYPE_FILE = { talking: 'talking-head', faceless: 'storytelling', interview: 'interview-broll' };
const readSkill = (style, name) => { try { return fs.readFileSync(path.join(SKILLS_DIR, style, `${name}.md`), 'utf8').trim(); } catch { return ''; } };
const readShared = (name) => { try { return fs.readFileSync(path.join(SKILLS_DIR, `${name}.md`), 'utf8').trim(); } catch { return ''; } };
// One anatomy contract reaches the planner, every shot designer and the reviewer.
// Do not silently continue without it for a human animation project.
// the anatomy every 2D prompt carries: the short card; the full contract (human-anatomy-rigging.md) is for whoever changes the engine
const humanRules = (p) => {
  if (designOf(p) !== '2d-animation') return '';
  const rules = fs.readFileSync(path.join(SKILLS_DIR, '2d-animation', 'anatomy-card.md'), 'utf8').trim();
  if (!rules) throw new Error('The universal human anatomy and rigging contract is empty.');
  return rules;
};
const hasOwnMedia = (p) => (p.assets || []).some((a) => isOwnMedia(a, p));
// Every skill file is read in parts by who it is for: the director (plans the video) or the builder (writes one scene's file).
// A part starts at a marker line, <!-- director -->, <!-- graphic --> (the builder) or <!-- both -->; the text before the first
// marker is for the file's own reader (core-director and a video type's file: the director; core-graphic: the builder; the
// shared files: both). Each reader gets only its parts, so neither reads rules that are not its job.
const MARKS = /^<!-- (director|graphic|both) -->[ \t]*$/m;
export function skillPart(text, who, first) {
  const out = []; let aud = first;
  String(text || '').split(MARKS).forEach((piece, k) => {
    if (k % 2) { aud = piece; return; }
    if (piece.trim() && (aud === who || aud === 'both')) out.push(piece.trim());
  });
  return out.join('\n\n');
}
// the customer's own pictures and clips (in the interview file of every design system): read by any video that has some
const OWN = "## The customer's own pictures and clips";
const ownMedia = (st, who) => { const part = skillPart(readSkill(st, 'interview-broll'), who, 'director'); if (who === 'graphic') return part; const at = part.indexOf(OWN); return at < 0 ? '' : part.slice(at); };
// the director: core-director + the video type's director part (+ the customer-footage part when they added pictures or clips)
export function directorSkill(p) {
  const st = designOf(p), type = TYPE_FILE[typeOf(p)];
  return [humanRules(p), readSkill(st, 'core-director'), skillPart(readSkill(st, type), 'director', 'director'), type !== 'interview-broll' && hasOwnMedia(p) ? ownMedia(st, 'director') : ''].filter(Boolean).join('\n\n');
}
// the motion designer: core-graphic + the video type's graphic part (+ how to frame the customer's own pictures and clips)
export function graphicSkill(p) {
  const st = designOf(p), type = TYPE_FILE[typeOf(p)];
  return [humanRules(p), skillPart(readSkill(st, 'core-graphic'), 'graphic', 'graphic'), skillPart(readSkill(st, type), 'graphic', 'director'), type !== 'interview-broll' && hasOwnMedia(p) ? ownMedia(st, 'graphic') : ''].filter(Boolean).join('\n\n');
}

// The shared making playbook (how a scene is planned, built and moves, any design system) and the 4-pass sound system, read
// after the design system's own skill, so the style decides the look and these decide the method and the sound.
// (+ how the customer's files are placed and shown, when they added any)
// a 2D shot designer reads the 2D playbook (in core-graphic.md), not the general one written for cards and joins
// and the 2D director reads its one file (core-director.md), not the playbook written for motion-graphics cards and joins
const is2d = (p) => !!p && designOf(p) === '2d-animation';
export const sharedSkill = (who, p = null) => [...(is2d(p) ? [] : ['shared-making']), 'sound-system', ...(p && hasOwnMedia(p) ? ['shared-files'] : [])].map((f) => skillPart(readShared(f), who, 'both')).filter(Boolean).map((x) => `# SHARED BY EVERY DESIGN SYSTEM (the design system above wins where they disagree)\n\n${x}`).join('\n\n');
const checkSkill = (who) => skillPart(readShared('check'), who, 'both');

// ---------- the system prompts (cached: nothing about one video in them except its type and own-media rules) ----------
// The director plans the video, judges it and answers the customer's changes; a builder writes one scene's file at a time. Each
// reads only its own parts of the skill. Every builder of a video has the same system prompt, so it is read from the cache.
export function directorSystem(p) {
  return `You are the director of Zancut, a premium video studio: a senior editor at a desk. You read the customer's material,
plan the video scene by scene, judge the rendered frames and answer the customer's changes; motion designers build the scenes you
plan. You turn what is said into what is seen: for every moment you read its meaning and feeling and the customer's note for
those words, find a literal visual metaphor that acts out the words, and brief its design from scratch for that moment. Strictly
by the design system skill below.

The customer's own inputs are orders, not suggestions: their notes on lines, their Prompt of orders, and the files they add with
where they want them. Read them first, follow them and make them look premium; never ignore one. A file goes where it truly fits
the words: when a part of one fits nowhere, it is shown another way or left out and the customer is told why (the files skill).
Their real file always beats a drawing of it: a recording that shows what the words say is shown as it is, never redrawn. Only
a part that is wrong for its words (an error on screen, something off-topic) may be shown another way, and only until they ask
for it: when they say to use it anyway, use it exactly as they ask.

Your tools are your desk: save_storyboard (plan), look (one scene's real frames), look_video (one frame of every scene and the
joins), change_scenes (the customer's changes), check_sync and retime (word timing), mix (the whole video's sound and frame) and
report. Code checks every call and tells you what is wrong. You never ask questions: you decide like a senior editor and keep your
messages short (the work is in the tools).

# THE DESIGN SYSTEM SKILL (your only rules — follow them strictly)

## Directing
${directorSkill(p)}
${sharedSkill('director', p)}

${is2d(p) ? '' : `# JUDGING THE WORK (look shows you a scene the way a viewer sees it on a phone)
${checkSkill('director')}
`}
${ADOPT}`;
}
export function builderSystem(p) {
  return `You are a motion designer of Zancut, a premium video studio. The director planned this video scene by scene; you build
the graphic scenes you are given as HTML + CSS + GSAP, look at the real rendered frames and fix what you see until it is right.
Every scene acts out its words with the literal visual metaphor of its row, designed from scratch for that moment. Strictly by the
design system skill below. The customer's notes and orders for your scene are orders: follow them exactly and make them premium.
You never ask questions and keep your messages short (the work is in the tools).

# THE DESIGN SYSTEM SKILL (your only rules — follow them strictly)

## Designing the graphics
${graphicSkill(p)}
${is2d(p) ? libraryForBuilders() : ''}
${GRAPHIC_CONTRACT}

${sharedSkill('graphic', p)}

# CHECKING YOUR WORK (the frames you get back show the scene the way a viewer sees it on a phone)
${checkSkill('graphic')}
Never stop at "it renders": stop when it would pass a senior art director at a premium studio.`;
}

// ---------- the storyboard ----------
const ADOPT = `Adopt & Elevate: customers write casual notes ("make it go boom", "something cool here", "show money"). Adopt the wish
behind the words and elevate it into a professional choice in this design system: the metaphor, archetype, mode, motion and
where the sound lands ("boom" → a fast radial ripple with an impact; "show growth" → a luminous spline climbing to the number
that is said; "calm here" → a slow drift, no texture sound). Never ignore a note; never take it so literally that it looks cheap.`;
export function voicePace(words) {
  const W = (words || []).filter((w) => Number.isFinite(+w?.start) && Number.isFinite(+w?.end));
  if (W.length < 4) return null;
  const secs = Math.max(1, W.at(-1).end - W[0].start), rate = W.length / secs, ends = [], lens = [];
  const END = /[.!?।]["')]*$/, punct = W.some((w) => END.test(String(w.text || ''))), gap = (i) => W[i + 1].start - W[i].end;
  W.forEach((w, i) => { if (i < W.length - 1 && (punct ? END.test(String(w.text || '')) || gap(i) >= 0.6 : gap(i) >= 0.45)) ends.push(i); });
  let a = 0; for (const b of ends) { lens.push(W[b].end - W[a].start); a = b + 1; }
  if (a < W.length) lens.push(W.at(-1).end - W[a].start);
  const sentence = [...lens].sort((x, y) => x - y)[Math.floor(lens.length / 2)] || secs;
  return { secs: Math.round(secs), rate: Math.round(rate * 100) / 100, feel: rate < 2.4 ? 'calm' : rate < 3 ? 'steady' : 'brisk', ends, sentence: Math.round(sentence * 10) / 10 };
}
export const ordersText = (p) => [p.prompt, p.instructions, p.filmOrders].map((x) => String(x || '').trim()).filter(Boolean).join('\n'); // filmOrders: the film-wide directions the 2D planner read in the customer's script
const ordersBlock = (p) => (ordersText(p) ? `\n## The customer's orders (the most important input: follow every line exactly, before your own ideas; where an order and the skill disagree, the order wins unless it would break the frame, the readability or the voice timing)\n${ordersText(p).slice(0, 4000)}\n` : '');

export const GRAPHIC_CONTRACT = `## The scene file (strict — the engine renders by seeking the timeline)
- ONE html file: the markup, then one <style>, then one <script>, then the cues comment as its last line.
- The script body runs as function (tl, root, s, d, words, ZK, at): tl = the paused GSAP timeline, root = this scene's section
  (full frame), s = the scene's start second on the video, d = its length, words = [{text, t, e}] spoken in it (video seconds),
  at(x) = s + x. Call \`ZK.unit(root)\` FIRST (it sets --u = 1% of the frame's short side).
- Animate ONLY with tweens on tl at times between s and s + d (use \`immediateRender: true\` on fromTo tweens that start after s).
  Never gsap.to on its own, timers, Math.random, Date, requestAnimationFrame, CSS animations or transitions, repeat: -1.
- Give every class and id the prefix gx- (the page already styles other names). Sizes as calc(var(--u)*N); colours only from the
  tokens (var(--zk-a), --zk-b, --zk-a-tint, --zk-c, --zk-pos, --zk-neg, --zk-bg-deep, --zk-bg-mid, --zk-glass, --zk-ink, --zk-mute,
  --zk-line, --zk-grid) or the recipe's whites; fonts var(--zk-display), var(--zk-font), var(--zk-bangla).
- Kit (ZK): unit(root) · stage(tl, root, {kind, t: s, d}) draws Glossy's bgStage ground as the first element (it carries on from
  the scene before by itself) · rich("text *accent*") · text(el, "…") (Bangla gets its font and spacing by itself) · fit(el, {u, w, h}) · motion(tl, el,
  "pop|glide|snap|fade", time, {dir}) · pop(tl, el, time) · words(tl, el, {text, at: [seconds per word]}) · type(tl, el, {text, t,
  dur}) · count(tl, el, {from, to, t, dur, dec, prefix, suffix}) · draw(tl, svg, time, dur) · icon("name" | "logo:brand" | "set:name"
  from find_icons) → SVG text · emoji("😂", {style: "3d" | "flat"}) → a sticker · peep({face, hair, body, beard, glasses, skin, hairColor,
  top}) → a hand-drawn person (find_people lists the names) · push(tl, el, t, d, 0.05) · breathe(tl, el, t, d) · zones(root) → this layout's free zones in
  pixels · face(root) → the speaker's face box or null · place(root, el, spots).
- Ready parts: the page already has your design system's materials as classes (zk-card, zk-pill, zk-tile, zk-title, zk-num and
  the others your skill lists), for light and dark. Put them on your elements for the material and add your own gx- class for
  size, place and motion; you write less, and every scene shares the exact look.`;
export function videoHandoff(p, sb, extra = {}) {
  const line = (r, i) => `${i + 1}. ${r.piece === 'custom' ? `graphic · ${modeOf(p, r)} · archetype ${r.archetype || '-'} · ${r.bgStage || 'no stage'}${r.groundRun > 0 ? ' (same ground as before)' : ''}` : r.piece}: "${String(r.say || '').slice(0, 160)}" → ${String(r.metaphor || r.idea || '').slice(0, 220)}`;
  const v = sb.video || {};
  const isLong = (sb.rows || []).length > 30;
  const scenesText = isLong
    ? `${sb.rows.slice(0, 4).map(line).join('\n')}\n… [Scenes 5–${sb.rows.length - 4} planned in acts; each builder's task receives its exact 3-scene window: Scene N-1, Scene N, Scene N+1] …\n${sb.rows.slice(-4).map((r, idx) => line(r, sb.rows.length - 4 + idx)).join('\n')}`
    : sb.rows.map(line).join('\n');
  return `# THIS VIDEO (you are one of its scene builders: the lead editor planned it; other builders make the other scenes at the same time)

${setupBlock(p)}
${ordersBlock(p)}${(p.styleMemory || []).length ? `\n## This customer's taste\n${p.styleMemory.map((x) => `- ${x}`).join('\n')}\n` : ''}${extra.animScript && !sb.film?.cast?.length ? `\n## The production script (the 2D film's plan, written by the animation planner; the words are recorded)\n${extra.animScript}\n` : ''}${extra.reference ? `\n## Style reference (from a video the customer gave; take its feel in this design system)\n${String(extra.reference).slice(0, 3000)}\n` : ''}${extra.facts ? `\n## Facts from the customer's reference files (names, numbers and claims come from here)\n${String(extra.facts).slice(0, 4000)}\n` : ''}
## The video as the lead planned it
${[v.mood && `Mood: ${v.mood}`, v.hook && `Hook: ${v.hook}`, v.ending && `Ending: ${v.ending}`].filter(Boolean).join(' · ')}
The memory card (the one look, motion and rhythm every scene shares: match it): ${JSON.stringify(sb.memory || {})}${(() => { const v = voicePace(extra.words); return v ? `\nThe voice: ${v.rate} words per second, a ${v.feel} speaker (a sentence lasts about ${v.sentence} s). Motion follows it: ${v.feel === 'brisk' ? 'lively but never ahead of the words' : 'relaxed and smooth, every element given time to be read'}.` : ''; })()}

${kitBlock(sb)}
## Scenes overview
${scenesText}`;
}
