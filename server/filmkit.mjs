// The 2D film's kit: its cast and places, made once before the shots, so no shot designer draws them again (edit/film-kit.js, loaded by
// compose.mjs after engine/cartoon). The cast costs no AI: the director's specs are copied by code and checked by the body gate. The
// places are drawn in ONE designer call from the built-in set pieces (engine/cartoon/set.js) and shown on a board of real frames.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { DATA_DIR } from './config.mjs';
import { placePartsText } from './parts.mjs';

const J = (f, d = null) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
// the parts this computer has kept from earlier films (generic things only; the customer's own, never in the app): one line each for the
// designer, and only the parts a film uses go into its page
const libFile = () => process.env.ZANCUT_PARTS_FILE || path.join(DATA_DIR, 'parts.json');
const library = () => J(libFile(), {});
const keepParts = (found) => { const lib = library(), now = Date.now(); for (const [id, x] of Object.entries(found)) lib[id] = { ...x, at: now }; const kept = Object.entries(lib).sort((a, b) => (b[1].at || 0) - (a[1].at || 0)).slice(0, 120); fs.mkdirSync(path.dirname(libFile()), { recursive: true }); fs.writeFileSync(libFile(), JSON.stringify(Object.fromEntries(kept), null, 1)); };
const usedParts = (code) => { const lib = library(), own = new Set([...code.matchAll(/ZF\.part\(\s*["'`](\w+)/g)].map((m) => m[1])); return [...new Set([...code.matchAll(/ZF\.parts\.(\w+)/g)].map((m) => m[1]))].filter((id) => lib[id] && !own.has(id)).map((id) => `ZF.part(${JSON.stringify(id)}, ${JSON.stringify(lib[id].about || '')}, ${lib[id].src});\n`).join(''); };
// The 2D library on this computer (engine/cartoon/library, made outside from docs/2d-library and added with build-library.mjs):
// one short line per part for the prompts that pick them. Empty until a delivery is added.
const LIB_DIR = process.env.ZANCUT_LIBRARY_DIR || path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'engine', 'cartoon', 'library');
export function libraryCatalog() {
  const ls = (k, ext) => { try { return fs.readdirSync(path.join(LIB_DIR, k)).filter((f) => f.endsWith(ext)).sort().map((f) => path.join(LIB_DIR, k, f)); } catch { return []; } };
  const motion = (k) => ls(k, '.json').map((f) => J(f)).filter((d) => d?.id).map((d) => ({ id: d.id, group: d.group || 'other', about: String(d.about || '').slice(0, 90), seconds: d.seconds || null, loop: !!d.loop, who: d.who || 'any' }));
  const pieces = (k) => ls(k, '.js').flatMap((f) => [...fs.readFileSync(f, 'utf8').matchAll(/ZS\.define\(\s*["'](\w+)["']\s*,\s*\{[^}]*?["']?about["']?:\s*["'`]([^"'`]*)/g)].map((m) => ({ id: m[1], about: m[2].slice(0, 80) })));
  return { actions: motion('actions'), gestures: motion('gestures'), hands: ls('hands', '.json').map((f) => path.basename(f, '.json')), set: pieces('set'), props: pieces('props') };
}
const line = (x) => `${x.id}${x.loop ? ' (loop)' : ''}${x.who !== 'any' && x.who ? ` [${x.who}]` : ''}: ${x.about}`;
// The library is never listed whole in a prompt: code finds the parts each shot and place needs (server/parts.mjs, edit/film-parts.json)
// and the designers get their slice. The designers' prompt keeps only how to call each kind of part.
export function libraryForBuilders() {
  const c = libraryCatalog(); if (!c.actions.length && !c.gestures.length && !c.props.length && !c.hands.length && !c.set.length) return '';
  return `
## The library on this computer (checked parts; your scene's task lists the ones found for it, find_parts finds more)
- The library comes first: it is what keeps a film cheap, and its parts already hold the body rules. A close fit: use it. A near fit: take it and adapt it (timing on
  the words, a gesture on top, colour, size, two parts together). Only when find_parts has nothing: author it. Never swap the story's action for an easier one because the library lacks it.
- Actions: \`b.draw(b.pose("id", u * 360))\`, u 0…1 through the action (a loop repeats; blend in and out with b.blend). A "_a"/"_b" pair is two
  people in one move: one each, the same u. Gestures on any posture: \`b.pose("sit", 35, { gesture: { id, phase: u * 360, mirror } })\`
  (mirror = the other hand). Hand shapes: in handPoses / hands. Pieces in a place: \`P.Z.put(id, P.layer, { x, dz, seed, color, flip })\` (metres; real size by itself); \`ZS.id(layer, { x, y, h })\` only off the world (a card). Props, drawn
  round their grip point: \`ZC.prop(layer, (g) => ZS.id(g, { h }))\`, then ZC.carry / ZC.handover.
`;
}

export const kitFile = (E) => path.join(E.J0, 'edit', 'film-kit.js');
const castJS = (sb) => `ZF.cast = ${JSON.stringify(Object.fromEntries((sb.film?.cast || []).filter((c) => c?.id && c.spec).map((c) => [c.id, c.spec])))};\n`;
// the cast goes in by code, always: every designer has one spec per person, whether or not the places are made yet
export function writeCast(E) { const f = kitFile(E); if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, castJS(E.sb)); } }
export const needsKit = (E) => E.p.kind === 'animation' && !!E.sb?.film?.places?.length && !E.sb.film.kit;

// thenScenes: the first builder draws the places in its own conversation, then goes straight on to its scenes
export function kitTask(sb, fp = null, { thenScenes = false } = {}) {
  const places = sb.film.places.map((x) => `- ${x.id}: ${String(x.look || '').slice(0, 500)}. Views: ${(x.views || ['wide']).join(', ')}`).join('\n');
  return `${thenScenes ? 'FIRST, before your scenes' : 'Before the shots are built'}, draw ALL of this film's places in ONE save_kit call. Every shot of a place then asks for it, so this is where its beauty is made.
${sb.film.palette ? `The film's palette (every place is a light and time of day of it): ${String(sb.film.palette).slice(0, 300)}\n` : ''}
${places}

Write plain JavaScript, one ZF.place per place (no <script> tag):
ZF.place("id", { views: ["wide", "reverse"], world: { wide: { horizon: 0.42, floor: 0.8 } }, spots: { bench: { x: 1.2, dz: 1 } } }, (W, o) => {
  const sky = W.layer("sky"), far = W.layer("far"), L = o.layer, Z = o.Z; // o.view picks the view; o.seed changes small things
  // Z = this view's world scale: x metres right of the middle, dz metres behind the floor line; real sizes come by themselves
  ZS.sky(sky, { w: W.w, h: Z.horizon + 60, top: "#f6a860", bottom: "#ffe2b0" }); Z.put("building", far, { x: -8, dz: 30, seed: 3 });
  Z.put("teaStall", L, { x: 1.5, dz: 2.5, seed: 2 }); Z.put("bench", L, { x: 1.2, dz: 1 }); // L sorts by depth: nearer covers farther
  return {}; // optional: tick(t) for things that move (steam, a passing rickshaw), seek-safe, from t only
});

- Build from the set pieces and your own flat shapes. Place every piece with Z.put in metres (x, dz), never a pixel height: a door, a roof, a tree and a person then fit each other. Your own shape: size it from Z.at(x, dz) (y = its floor, s = px per metre). Spots in metres. Draw past the frame edges so a camera can pan.
- Every view is really another picture of the place: the reverse looks the other way (what was behind the camera), a close view is a soft crop with big simple shapes. Not the same drawing moved.
- Draw what each place's look names plus the touches that make it true and alive (signs, goods, lights, a passer-by layer), then stop: ZS pieces first (another seed or colour is another shape), your own shapes only for what no piece has. The WIDE view is the place's establishing picture: rich in far, middle and front layers, the people's spot big enough to read. About 60–120 lines per place: no extra places or views the plan did not ask for.
- An indoor modern room (office, classroom, shop, flat) is never a pale empty wall: fill the back wall with what that room has
  (windows with a city view, shelves, framed pictures, a whiteboard, plants, a clock), give the walls and floor colours from the film's
  palette (never near-white), and a warm or cool light pool where the people stand.
- Give each place its own palette, light and things. Vary seeds and colours so no two buildings or trees repeat. Never one background look for the whole film.
${placePartsText(fp)}- A new thing any film could use (a banyan tree, a mosque, a boat, not this story's sign or text) goes in a part, drawn at x, y with options so seed and colour vary it: ZF.part("banyan", "a wide old tree", (layer, { x, y, h, seed, color }) => { … }). It is kept for later films. At most 3 per film. Put it in a place like any piece, by its id and real height: Z.put("banyan", L, { x: 2, dz: 6, m: 9 }).
- No people here (they come with the shot). Far, middle and front depth; keep the caption lane (78–92% of the height) plain.
- Cinematic light in every place: a clear key light (sun, window, lamp) with its warm or cool colour, a soft glow or haze in the far
  layer, darker corners that lead the eye to the people's spot, and one accent colour that pops against the ground.
save_kit answers with a board of real frames and the errors. Fix with edit_kit (small exact replacements, never the whole kit again) only if something is wrong, at most twice, then ${thenScenes ? 'go straight on to your scenes (no answer line for the kit).' : 'answer with one line.'}`;
}

// the board: one real frame per place and view + the cast standing, through the real compose and the real gate
export async function saveKit(E, code, ENGINE_DIR) {
  try { new Function('ZF', 'ZS', 'ZC', code); } catch (e) { return { text: `Not saved: the code does not parse: ${e.message}` }; }
  fs.writeFileSync(kitFile(E), `${castJS(E.sb)}${usedParts(code)}${code}\n`);
  const plan0 = J(path.join(E.J0, 'edit', 'plan.json'), {}), canvas = plan0.canvas || '1080x1920', d = path.join(E.d.ws, 'qa', 'kit');
  fs.rmSync(d, { recursive: true, force: true });
  for (const x of ['cut', 'edit/graphics', 'work']) fs.mkdirSync(path.join(d, x), { recursive: true });
  fs.copyFileSync(kitFile(E), path.join(d, 'edit', 'film-kit.js'));
  const shots = [];
  for (const pl of E.sb.film.places) for (const view of pl.views?.length ? pl.views : ['wide']) shots.push({ label: `${pl.id}/${view}`, js: `const W = ZC.world(root), P = ZC.place(${JSON.stringify(pl.id)}, W, { view: ${JSON.stringify(view)} }); ZC.clock(tl, s, d, (t) => { W.cam(W.w / 2, W.h / 2, W.w); P.tick(t + 3); });` });
  const cast = (E.sb.film.cast || []).map((c) => c.id);
  if (cast.length) shots.push({ label: 'cast', js: `const W = ZC.world(root), l = W.layer("p"), ids = ${JSON.stringify(cast)}, H = Math.min(90, (W.w / ids.length) * 0.32), bs = ids.map((id, i) => ZC.actor(l, { spec: ZF.cast[id], H, x: ((i + 0.5) / ids.length) * W.w, floor: W.h * 0.8, view: "three", id: "cast-" + id })); ZS.floor(W.layer("g"), { w: W.w, y: W.h * 0.8, h: W.h * 0.2 }); ZC.clock(tl, s, d, () => { W.cam(W.w / 2, W.h / 2, W.w); bs.forEach((b) => b.draw(ZC.stand(), { face: "happy" })); });` });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x222222:s=${canvas}:r=30`, '-f', 'lavfi', '-i', 'anullsrc=r=48000', '-t', String(shots.length), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(d, 'cut', 'cut.mp4')]);
  fs.writeFileSync(path.join(d, 'job.json'), '{}');
  fs.writeFileSync(path.join(d, 'cut', 'transcript.json'), JSON.stringify(shots.map((_, i) => ({ text: `w${i}`, start: i, end: i + 0.95 }))));
  const scenes = shots.map((x, i) => { const f = `edit/graphics/k${i}.html`; fs.writeFileSync(path.join(d, f), `<script>\nZK.unit(root);\n${x.js}\n</script>`); return { row: i, uid: `k${i}`, startWord: i, endWord: i, kind: 'graphic', mode: 'full-broll-takeover', file: f, transition: 'cut', captions: 'hide', cues: [] }; });
  fs.writeFileSync(path.join(d, 'edit', 'plan.json'), JSON.stringify({ version: 2, canvas, kind: 'faceless', style: '2d-animation', theme: 'light', tokens: {}, captions: { on: false }, atoms: plan0.atoms || '', scenes }));
  try { execFileSync(process.execPath, [path.join(ENGINE_DIR, 'compose', 'compose.mjs'), d], { stdio: 'pipe' }); } catch (e) { return { text: `The kit did not build: ${String(e.stderr || e.message).slice(-600)}` }; }
  const hf = path.join(d, 'edit', 'hf'), url = (f) => pathToFileURL(path.join(ENGINE_DIR, f)).href;
  const { openPage, showAt } = await import(url('readcheck.mjs')), { checkBody } = await import(url('cartoon/check-body.mjs'));
  const o = await openPage(hf); if (!o) return { text: 'Saved. The board could not open (no browser here): the shots will show it.' };
  const frames = path.join(d, 'frames'); fs.mkdirSync(frames); let meta = {}, errors = [], parts = {};
  try {
    errors = (await o.page.evaluate(() => window.__sceneErrors || [])).map((e) => `${shots[e.row]?.label || e.row}: ${e.message}`);
    meta = await o.page.evaluate(() => Object.fromEntries(Object.entries(window.ZF?.places || {}).map(([k, v]) => [k, { views: v.views || [], floor: v.floor ?? null, spots: v.spots || {} }])));
    parts = await o.page.evaluate(() => Object.fromEntries(Object.entries(window.ZF?.parts || {}).map(([k, f]) => { let bad = ''; try { const g = window.ZC.el('g', {}, document.querySelector('svg')); for (const seed of [1, 2]) f(g, { x: 300, y: 600, h: 200, w: 200, seed }); if (/NaN/.test(g.innerHTML)) bad = 'bad numbers'; g.remove(); } catch (e) { bad = e.message; } return [k, { about: window.ZF.partInfo[k]?.about || '', src: f.toString(), bad }]; })));
    for (const [k, x] of Object.entries(parts)) if (x.bad) errors.push(`The part "${k}" fails: ${x.bad}`);
    for (let i = 0; i < shots.length; i++) { await showAt(o.page, i + 0.5); await o.page.screenshot({ path: path.join(frames, `f${String(i).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 70 }); }
  } finally { await o.close?.(); }
  const gate = await checkBody(hf, { fps: 2 }).catch(() => ({ lines: [] }));
  for (const l of gate.lines || []) errors.push(`Cast: ${l}`);
  for (const pl of E.sb.film.places) if (!meta[pl.id]) errors.push(`The place "${pl.id}" is missing: add ZF.place("${pl.id}", …).`);
  const file = path.join(d, 'board.jpg'), cols = Math.min(shots.length, 4);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-framerate', '1', '-i', path.join(frames, 'f%02d.jpg'), '-vf', `scale=300:-2,tile=${cols}x${Math.ceil(shots.length / cols)}:padding=4:color=white`, '-frames:v', '1', '-update', '1', file]);
  if (!errors.length) { keepParts(Object.fromEntries(Object.entries(parts).map(([k, { about, src }]) => [k, { about, src }]))); E.sb.film.parts = Object.keys(parts); E.sb.film.kit = meta; fs.writeFileSync(path.join(E.J0, 'work', 'storyboard.json'), JSON.stringify(E.sb, null, 1)); }
  return { file, ok: !errors.length, text: `The board, left to right: ${shots.map((x) => x.label).join(' · ')}.\n${errors.length ? `Fix these, then save_kit again:\n${errors.map((x) => `- ${x}`).join('\n')}` : 'Code found nothing wrong (it cannot judge beauty: you do). Saved: the shots will use it.'}` };
}

// what every shot designer is told about the kit (in the cached system prompt, so it is read once)
export function kitBlock(sb) {
  const f = sb?.film; if (!f?.cast?.length && !f?.kit) return '';
  const cast = (f.cast || []).map((c) => `- ${c.id}${c.name ? ` (${c.name})` : ''}: ZF.cast.${c.id}`).join('\n');
  const places = f.kit ? Object.entries(f.kit).map(([k, v]) => `- "${k}": views ${v.views.join(', ') || 'wide'}${Object.keys(v.spots || {}).length ? `; spots ${JSON.stringify(v.spots)}` : ''}`).join('\n') : '';
  const parts = f.parts?.length ? `Extra parts for this film: ${f.parts.map((x) => `ZF.parts.${x}(layer, { x, y, h, seed, color })`).join(', ')}.\n` : '';
  const palette = f.palette ? `The film's palette (backgrounds, B-roll and cards keep to it; each place is a light of it): ${String(f.palette).slice(0, 300)}\n` : '';
  return `\n## This film's kit (ready: never draw these again)\n${palette}${cast ? `The cast, one spec per person (spec: ZF.cast.id):\n${cast}\n` : ''}${parts}${places ? `The places, drawn once: \`const P = ZC.place("id", W, { view })\` draws it; call P.tick(t) in the clock. People at their real size: \`const a = P.Z.person(spec, { x, dz, layer: P.layer }), b = ZC.actor(a.slot, { spec, ...a, view })\` (x, dz in metres, or a spot: \`{ ...P.spots.bench, layer: P.layer }\`); this shot's pieces \`P.Z.put(id, P.layer, { x, dz })\`. Nearer = bigger: never set H by eye. Near things that always stay in front: W.layer("front").\n${places}\n` : ''}`;
}
