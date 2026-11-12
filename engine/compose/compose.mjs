#!/usr/bin/env node
// The Glossy compositor: edit/plan.json → edit/hf/index.html (a HyperFrames page) + its assets.
//   node engine/compose/compose.mjs <job>
//
// One plan = scenes in order (no gaps, no overlaps), each with its layout mode. The engine places the people and screens
// (speaker video, speaker cut-out, the pop-out box, the browser window or phone) and the scene's own graphic (an HTML file
// the motion designer wrote) on one paused GSAP timeline. It also places the captions, every sound (peak-locked whooshes,
// textures on three tracks, risers + hits) and tells finalize where the music must be silent.
import { existsSync, mkdirSync, copyFileSync, linkSync, rmSync, writeFileSync, statSync, readFileSync } from "node:fs";
import { join, resolve, basename, dirname, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { readJSON, writeJSON, probe, args, r3, HOME } from "../media/lib.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const A = args();
const JOB = resolve(A._[0] || "");
if (!A._[0] || !existsSync(JOB)) { console.error("usage: compose.mjs <job folder>"); process.exit(1); }
const plan = readJSON(join(JOB, "edit", "plan.json"));
const job = readJSON(join(JOB, "job.json"), {});
const warnings = [], warn = (m) => warnings.push(m);
const [W, H] = String(plan.canvas || "1080x1920").split("x").map(Number);
const fps = 30, TALL = H > W * 1.15, WIDE = W > H * 1.15, U = Math.min(W, H) / 100;
const KIND0 = plan.kind || job.zancut?.kind || "talking";
const KIND = KIND0 === "tutorial" ? "screen" : KIND0; // talking | faceless (Storytelling) | screen (the screen recording is the picture) | interview; "tutorial" = an older plan's screen

const OUT = join(JOB, "edit", "hf"), AS = join(OUT, "assets");
for (const d of ["fonts", "sfx", "media"]) mkdirSync(join(AS, d), { recursive: true });
const place = (src, dst) => {
  if (existsSync(dst)) { const a = statSync(src), b = statSync(dst); if (a.ino === b.ino || (a.size === b.size && a.mtimeMs <= b.mtimeMs)) return; rmSync(dst); }
  try { linkSync(src, dst); } catch { copyFileSync(src, dst); }
};
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isBn = (t) => /[ঀ-৿]/.test(String(t || ""));

// ---------- the main track and the words ----------
const videoSrc = resolve(JOB, "cut/cut.mp4");
if (!existsSync(videoSrc)) throw new Error("no cut/cut.mp4 — run the cut first");
const vinfo = probe(videoSrc);
const D0 = r3(Math.floor(vinfo.duration * fps) / fps), D = D0;
place(videoSrc, join(AS, "media", "aroll.mp4"));
const words = (() => { const t = readJSON(join(JOB, "cut", "transcript.json"), []); return (Array.isArray(t) ? t : t.words || []).map((w, i) => ({ ...w, i })); })();
const wStart = (i) => words[Math.max(0, Math.min(words.length - 1, i))]?.start ?? 0;
const wEnd = (i) => words[Math.max(0, Math.min(words.length - 1, i))]?.end ?? D;

// the speaker: median face from the face track (fractions of the cut frame), the cut-out when it is usable
const ft = readJSON(join(JOB, "cut", "facetrack.json"), null);
const FACE = (() => {
  const tr = (ft?.ok && ft.track || []).filter((p) => p && p.h);
  if (!tr.length) return null;
  const med = (k) => tr.map((p) => p[k]).sort((a, b) => a - b)[tr.length >> 1];
  return { x: med("x"), y: med("y"), h: med("h") };
})();
const matteLog = join(JOB, "cut", "matte.log");
const CUTOUT = existsSync(join(JOB, "cut", "subject.webm")) && existsSync(matteLog) && /"ok":\s*true/.test(readFileSync(matteLog, "utf8")) && !/"reliable":\s*false/.test(readFileSync(matteLog, "utf8"));
if (CUTOUT) place(join(JOB, "cut", "subject.webm"), join(AS, "media", "subject.webm"));

// the mix the customer asked for in a change round (plan.mix, set by the editor's mix tool): effects level, no risers,
// music level (applied by finish), speaker zoom, captions on/off and their size
const MIX = plan.mix && typeof plan.mix === "object" ? plan.mix : {};
// ---------- layouts (frame pixels) ----------
const R = (x, y, w, h) => ({ x: Math.round(x * W), y: Math.round(y * H), w: Math.round(w * W), h: Math.round(h * H) });
const RAD = Math.round(U * 3); // the rounded box corners (32 px on a 1080-wide frame)
const FULL = { x: 0, y: 0, w: W, h: H };
const insetOf = (b, open = {}) => `inset(${open.top ? 0 : b.y}px ${W - b.x - b.w}px ${H - b.y - b.h}px ${b.x}px round ${open.top ? 0 : b === FULL ? 0 : RAD}px ${open.top ? 0 : b === FULL ? 0 : RAD}px ${b === FULL ? 0 : RAD}px ${b === FULL ? 0 : RAD}px)`;
// scale + move the speaker video (W×H) so the face is centred in box and the top of the head sits `pop` px above it
function fitHead(box, pop = 0, want = 0.3) {
  if (!FACE) return { k: 1, x: 0, y: 0 };
  const fx = FACE.x, fh = FACE.h, yht = Math.max(0, FACE.y - fh * 0.62), bcx = box.x + box.w / 2; // the face track gives the eye line (y) and the face box height (h); hair tops out ≈0.62 h above the eyes
  let k = Math.max((box.w / 2) / Math.max(0.05, fx * W), (box.w / 2) / Math.max(0.05, (1 - fx) * W), (box.h + pop) / Math.max(0.1, H * (1 - yht)), (want * box.h) / Math.max(0.02, fh * H));
  k = Math.min(2.6, k);
  return { k: r3(k), x: Math.round(bcx - fx * W * k), y: Math.round(box.y - pop - yht * H * k) };
}
const faceRect = (m) => { if (!FACE) return null; const cx = m.x + FACE.x * W * m.k, eye = m.y + FACE.y * H * m.k, fh = FACE.h * H * m.k; return [Math.round(cx - fh * 0.42), Math.round(eye - fh * 0.42), Math.round(fh * 0.84), Math.round(fh)]; }; // forehead → chin
const SPEAKER_MODES = ["speaker", "popout-box-split", "behind-head-depth", "bg-replace-stage", "over-torso-glass", "lower-third-kinetic", "masked-pip-stage", "full-broll-takeover"];
const SCREEN_MODES = ["speaker-intro-hook", "pc-browser-spotlight", "mobile-device-stage", "concept-takeover-graphic", "screen-full"];
const NEEDS_CUTOUT = new Set(["popout-box-split", "behind-head-depth", "bg-replace-stage"]);
// the speaker layer, the cut-out layer, the box and the graphic's free zones for one talking-head mode
function speakerLayout(mode) {
  const L = { spk: { clip: insetOf(FULL), m: { k: 1, x: 0, y: 0 }, z: 10, o: 1 }, cut: { on: false, clip: insetOf(FULL), z: 30 }, box: null, vig: 0, zones: {}, gz: 20 };
  if (mode === "popout-box-split") {
    const box = TALL ? R(0.06, 0.53, 0.88, 0.39) : WIDE ? R(0.54, 0.16, 0.4, 0.76) : R(0.08, 0.5, 0.84, 0.44);
    const pop = Math.round(TALL ? H * 0.085 : H * 0.12), m = fitHead(box, pop);
    Object.assign(L, { box, gz: 20 });
    L.spk = { clip: insetOf(box), m, z: 25, o: 1 };
    L.cut = { on: true, clip: insetOf(box, { top: true }), z: 35 };
    L.zones = TALL ? { top: R(0.06, 0.06, 0.88, 0.38), bridge: R(0.06, 0.45, 0.88, 0.06), box } : WIDE ? { top: R(0.04, 0.1, 0.46, 0.8), box } : { top: R(0.06, 0.05, 0.88, 0.36), box };
  } else if (mode === "behind-head-depth") {
    L.cut = { on: true, clip: insetOf(FULL), z: 30 }; L.zones = { behind: TALL ? R(0.04, 0.1, 0.92, 0.38) : R(0.04, 0.08, 0.92, 0.5) };
  } else if (mode === "bg-replace-stage") {
    L.spk.o = 0; L.cut = { on: true, clip: insetOf(FULL), z: 30, rim: true }; L.zones = { left: TALL ? R(0.02, 0.3, 0.3, 0.4) : R(0.03, 0.15, 0.3, 0.7), right: TALL ? R(0.68, 0.3, 0.3, 0.4) : R(0.67, 0.15, 0.3, 0.7) };
  } else if (mode === "over-torso-glass") {
    L.vig = 1; L.zones = TALL ? { face: R(0.1, 0.1, 0.8, 0.33), header: R(0.08, 0.44, 0.84, 0.08), card: R(0.1, 0.53, 0.8, 0.23) } : { header: R(0.52, 0.4, 0.42, 0.1), card: R(0.55, 0.52, 0.37, 0.33) };
  } else if (mode === "lower-third-kinetic") {
    L.zones = { lower: TALL ? R(0.06, 0.63, 0.88, 0.12) : R(0.05, 0.6, 0.5, 0.16) };
  } else if (mode === "masked-pip-stage") {
    const pip = TALL ? R(0.06, 0.6, 0.36, 0.3) : R(0.04, 0.58, 0.24, 0.36), m = fitHead(pip, -pip.h * 0.12, 0.42);
    L.spk = { clip: insetOf(pip), m, z: 25, o: 1 }; L.box = pip; L.zones = { pip, stage: TALL ? R(0.04, 0.06, 0.92, 0.52) : R(0.3, 0.06, 0.66, 0.88) };
  }
  if (NEEDS_CUTOUT.has(mode) && !CUTOUT) { L.cut.on = false; if (mode === "bg-replace-stage") L.spk.o = 1; }
  // the customer's "zoom in on me" (plan.mix.zoom): a full-frame speaker scaled about the face, the frame always covered
  const Z = Math.max(1, Math.min(1.8, Number(MIX.zoom) || 1));
  if (Z > 1 && L.spk.clip === insetOf(FULL)) { const fx = FACE ? FACE.x : 0.5, fy = FACE ? FACE.y : 0.4; L.spk.m = { k: r3(Z), x: Math.round(fx * W * (1 - Z)), y: Math.round(fy * H * (1 - Z)) }; }
  L.face = faceRect(L.spk.m);
  return L;
}
// the screen recording: a glossy browser window or a phone, with zoom events. A talking head's screen recordings are a video of
// their own (fitted to the voice by server/screensync.mjs), shown in the window on its "screen" scenes while the camera hides
const SCREEN_SRC = KIND === "talking" && plan.screenVideo ? resolve(JOB, plan.screenVideo) : null;
const BESIDE = !!(SCREEN_SRC && existsSync(SCREEN_SRC));
if (BESIDE) place(SCREEN_SRC, join(AS, "media", "screen.mp4"));
const sinfo = BESIDE ? probe(SCREEN_SRC) : vinfo;
const SCREEN_AR = sinfo.width && sinfo.height ? sinfo.width / sinfo.height : 16 / 9;
function screenLayout(mode) {
  if (mode === "mobile-device-stage" || (mode !== "pc-browser-spotlight" && SCREEN_AR < 0.8 && mode === "screen-full")) {
    let h = H * (TALL ? 0.66 : 0.82), w = h * SCREEN_AR; if (w > W * 0.62) { w = W * 0.62; h = w / SCREEN_AR; }
    const r = { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2 + (TALL ? H * 0.02 : 0)), w: Math.round(w), h: Math.round(h) };
    return { kind: "phone", rect: r, chrome: 0, radius: Math.round(U * 4.4), zones: { device: r } };
  }
  const chrome = Math.round(U * (TALL ? 4.6 : 3.2));
  // a wide screen in a tall or square frame would be a thin strip at full width: a tall window instead, the screen inside as tall
  // as the window (about twice as big) and panned to where the action is (runtime.js)
  if (SCREEN_AR > (W / H) * 1.3) {
    const w = Math.round(W * 0.94), h = Math.round(Math.min(H * (TALL ? 0.58 : 0.74), w * 1.15));
    const r = { x: Math.round((W - w) / 2), y: Math.round((H - h) / 2 + (TALL ? H * 0.02 : 0)), w, h };
    return { kind: "window", rect: r, chrome, radius: Math.round(U * 2), zones: { device: r }, fill: true, ar: r3(SCREEN_AR) };
  }
  let w = W * (TALL ? 0.92 : 0.74), h = w / SCREEN_AR; if (h + chrome > H * (TALL ? 0.6 : 0.78)) { h = H * (TALL ? 0.6 : 0.78) - chrome; w = h * SCREEN_AR; }
  const r = { x: Math.round((W - w) / 2), y: Math.round((H - h - chrome) / 2 + (TALL ? H * 0.03 : H * 0.02)), w: Math.round(w), h: Math.round(h + chrome) };
  return { kind: "window", rect: r, chrome, radius: Math.round(U * 2), zones: { device: r } };
}

// ---------- scenes: times on the cut, strictly one after another ----------
const raw = (plan.scenes || []).filter((sc) => !sc.hidden);
if (!raw.length) throw new Error("the plan has no scenes");
const scenes = raw.map((sc, k) => ({ ...sc, k })).sort((a, b) => (a.startWord ?? 0) - (b.startWord ?? 0));
scenes.forEach((sc, i) => { sc.s = i === 0 ? 0 : r3(Math.max(0, wStart(sc.startWord ?? 0) - 0.06)); });
scenes.forEach((sc, i) => {
  if (i > 0 && sc.s <= scenes[i - 1].s + 0.4) sc.s = r3(scenes[i - 1].s + 0.4); // never overlapping, never a sliver
  sc.e = i < scenes.length - 1 ? null : D;
});
scenes.forEach((sc, i) => { if (sc.e == null) sc.e = r3(Math.min(D, scenes[i + 1].s)); });
for (const sc of scenes) if (sc.e - sc.s < 1.2) warn(`scene ${sc.row + 1} is only ${(sc.e - sc.s).toFixed(2)} s`);

// what each scene shows (its mode) and where its graphic sits
const BANNED = /repeat\s*:\s*-1|Math\.random|setTimeout|setInterval|Date\.now|new Date|requestAnimationFrame|\bfetch\(/;
function loadGraphic(sc) {
  const p = resolve(JOB, sc.file);
  if (!existsSync(p)) { warn(`scene ${sc.row + 1}: graphic not found ${sc.file}`); return null; }
  // a part of a scene never shows outside its scene's time (server/director.mjs writeGraphic does the same when a scene is saved;
  // here it also covers files saved before that): "visibility: visible" would show it while its scene is hidden
  const src = readFileSync(p, "utf8").replace(/visibility\s*:\s*visible\b/gi, "visibility:inherit").replace(/(visibility\s*:\s*)(["'])visible\2/gi, "$1$2inherit$2");
  const g = { css: [...src.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join("\n"), js: [...src.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]).join("\n"),
    html: src.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "").replace(/<!--[\s\S]*?-->/g, "").trim() };
  if (BANNED.test(g.js)) warn(`scene ${sc.row + 1}: its script uses a timer or random numbers — renders may differ`);
  try { new Function("tl", "root", "s", "d", "words", "ZK", "at", g.js); } catch (err) { warn(`scene ${sc.row + 1}: script error (${err.message}) — left out`); return null; }
  for (const m of g.html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)) { const f = resolve(JOB, m[1]); if (existsSync(f)) { const n = basename(f).replace(/[^\w.\-]/g, "_"); place(f, join(AS, "media", n)); g.html = g.html.split(m[1]).join(`assets/media/${n}`); } }
  return g;
}
const media = (src) => { const p = resolve(JOB, src); if (!existsSync(p)) { warn(`missing media ${src}`); return ""; } const n = basename(p).replace(/[^\w.\-]/g, "_"); place(p, join(AS, "media", n)); return `assets/media/${n}`; };
const MEDIA_RE = /\.(mp4|mov|m4v|webm)$/i;
const SCREEN = KIND === "screen";
for (const sc of scenes) {
  if (sc.mode === "split-popout-tutorial") sc.mode = "pc-browser-spotlight"; // an older plan's split layout: the window alone
  if (sc.kind === "screen" && !SCREEN && !BESIDE) { sc.kind = "speaker"; sc.mode = "speaker"; } // no screen video (any more): the speaker
  sc.mode = sc.mode || (SCREEN ? (sc.kind === "graphic" ? "concept-takeover-graphic" : "pc-browser-spotlight") : sc.kind === "graphic" ? "full-broll-takeover" : "speaker");
  if (KIND === "interview" && NEEDS_CUTOUT.has(sc.mode)) sc.mode = sc.kind === "graphic" ? "over-torso-glass" : "speaker";
  if (KIND === "faceless" && sc.kind === "speaker") { sc.kind = "graphic"; sc.mode = "full-broll-takeover"; }
  if (SCREEN) sc.layout = SCREEN_MODES.includes(sc.mode) && !["speaker-intro-hook", "concept-takeover-graphic"].includes(sc.mode) ? { screen: screenLayout(sc.mode) } : { cover: true };
  else if (KIND === "faceless") sc.layout = { cover: true };
  else if (BESIDE && sc.kind === "screen") { sc.mode = SCREEN_MODES.includes(sc.mode) ? sc.mode : "pc-browser-spotlight"; const L = speakerLayout("speaker"); L.spk.o = 0; sc.layout = { speaker: L, screen: screenLayout(sc.mode) }; }
  else sc.layout = { speaker: speakerLayout(SPEAKER_MODES.includes(sc.mode) ? sc.mode : "speaker") };
  sc.graphic = sc.file ? loadGraphic(sc) : null;
  if (sc.kind === "graphic" && !sc.graphic) { sc.kind = SCREEN || KIND === "faceless" ? "fallback" : "speaker"; if (sc.kind === "speaker") sc.layout = { speaker: speakerLayout("speaker") }; }
  if ((sc.kind === "stock" || sc.kind === "mine") && sc.media) sc.mediaSrc = media(sc.media);
}

// ---------- captions: 2–4 words, the active word lights up ----------
// A person on camera (talking, interview): the whole video, always in the one caption lane under the face (y 78–92%: graphics
// keep out of it), never on the face; under the window on a screen scene. A screen-led video: only where the scene shows no words
// of its own.
const CAP_ON = (MIX.captions === "on" || (plan.captions?.on !== false && MIX.captions !== "off")) && (KIND !== "faceless" || MIX.captions === "on" || (plan.captions?.on === true && MIX.captions !== "off"));
const PERSON = KIND === "talking" || KIND === "interview";
const capHide = (sc) => (PERSON ? sc.kind === "fallback" : plan.style === "2d-animation" ? sc.captions === "hide" : sc.captions === "hide" || ["full-broll-takeover", "over-torso-glass", "lower-third-kinetic", "masked-pip-stage", "concept-takeover-graphic", "speaker-intro-hook"].includes(sc.mode) || ["stock", "mine", "fallback"].includes(sc.kind) || (sc.kind === "graphic" && sc.layout.cover));
const chunks = [];
// server/caption-writer.mjs may hand its own word-synced chunks (time windows); they are used only when they cover the words here
const givenChunks = (() => { const c = plan.captions?.chunks; if (!CAP_ON || !Array.isArray(c) || !c.length) return null;
  const got = c.map((x) => words.filter((w) => w.start >= x.s - 0.02 && w.start < x.e - 0.001)).filter((ws) => ws.length), n = got.reduce((k, ws) => k + ws.length, 0);
  return n >= words.length * 0.9 && n <= words.length ? got : null; })();
if (givenChunks) chunks.push(...givenChunks);
else if (CAP_ON) {
  let cur = [];
  const push = () => { if (cur.length) chunks.push(cur); cur = []; };
  words.forEach((w) => {
    const prev = cur[cur.length - 1], len = cur.reduce((n, x) => n + String(x.text).length + 1, 0) + String(w.text).length;
    if (prev && (w.start - prev.end > 0.28 || cur.length >= (TALL ? 3 : 5) || len > (TALL ? 22 : 36) || /[.!?।,;:]$/.test(prev.text))) push();
    cur.push(w);
  });
  push();
}
const sceneAt = (t) => scenes.find((sc) => t >= sc.s - 0.01 && t < sc.e) || scenes[scenes.length - 1];
// a caption is on screen about as long as its words take to say, never longer (a word timed over 19 s once froze one caption
// for 20 s): at most 0.8 s a word and 1.2 s more
const capItems = chunks.map((ws) => ({ s: r3(ws[0].start), e: r3(Math.min(ws[ws.length - 1].end + 0.3, ws[0].start + ws.length * 0.8 + 1.2)), ws, sc: sceneAt(ws[0].start) })).filter((c) => !capHide(c.sc));
capItems.forEach((c, i) => { const nx = capItems[i + 1]; c.e = r3(Math.min(c.e, nx ? nx.s : D, c.sc.e)); if (c.e - c.s < 0.25) c.e = r3(c.s + 0.25); });
const capPos = (sc) => (PERSON || plan.style === "2d-animation" ? "lane" : sc.mode === "popout-box-split" ? (TALL ? "bridge" : "low") : sc.mode === "behind-head-depth" || sc.mode === "bg-replace-stage" ? "low" : "mid");

// ---------- sounds ----------
const SFXDIR = join(HOME, "sfx");
const PRO = Object.fromEntries((readJSON(join(SFXDIR, "pro-kit.json"), { items: [] }).items || []).map((x) => [x.id, x]));
const famOf = (n) => PRO[n]?.family || (/^wh-/.test(n) ? "whoosh" : /^rs-/.test(n) ? "riser" : /^hit/.test(n) ? "hit" : "texture");
const used = {}, variant = (prefix) => { const ids = Object.keys(PRO).filter((id) => id === prefix || id.startsWith(prefix + "-")); if (!ids.length) return existsSync(join(SFXDIR, `${prefix}.wav`)) ? prefix : null; used[prefix] = ((used[prefix] ?? -1) + 1) % ids.length; return ids[used[prefix]]; };
const DB = (db) => r3(Math.pow(10, db / 20));
const sfx = [];
// whooshes: the cue is the fastest frame (v_max) → start = scene start + v_max − the file's own peak
// a sound its builder searched for ("lib:cash-register", server/library.mjs): its own file in the job, played as a texture
const libSound = (id) => join(JOB, "assets", "lib", "sfx", `${id.replace(/^lib[:-]/, "")}.wav`);
const cue = (sc, name, at) => {
  if (/^lib:[a-z0-9-]+$/.test(name)) { const f = libSound(name); if (!existsSync(f)) return warn(`missing sound ${name}`); sfx.push({ t: r3(sc.s + Math.max(0, Number(at) || 0)), id: `lib-${name.slice(4)}`, file: f, fam: "texture", vol: DB(-7) }); return; }
  const id = variant(name); if (!id) return warn(`unknown sound ${name}`);
  const fam = famOf(id), t0 = sc.s + Math.max(0, Number(at) || 0), dur = PRO[id]?.dur || 0.5;
  if (fam === "whoosh") sfx.push({ t: r3(Math.max(0, t0 - (PRO[id]?.peak || 0))), id, fam, vol: DB(/trans/.test(id) ? -10 : -12) });
  else if (fam === "riser") sfx.push({ t: r3(Math.max(0, t0 - dur)), id, fam, vol: DB(-5) }); // a riser asked by a scene ends ON its cue (the reveal)
  else if (fam === "hit") sfx.push({ t: r3(t0), id, fam, vol: DB(-7.5) });
  else sfx.push({ t: r3(t0), id, fam: "texture", vol: DB(dur < 0.2 ? -6 : -7) });
};
// A design system's sound profile (styles.json "sound", e.g. Minimal): the same shared kit, its own rules. Kept by code, so
// they hold whatever the scene's cues say: only its families (others swapped for a soft one), a quiet whoosh opening every
// scene (never the same one twice in a row), each tactile sound once per scene (the repeats become its "vary" sounds),
// no risers or hits, and its own level. No profile (Glossy): the cues play as written.
const SP = plan.soundProfile && typeof plan.soundProfile === "object" ? plan.soundProfile : null;
let lastIn = null, varyAt = 0, inAt = 0;
const profiled = (list) => {
  if (!SP) return list;
  const allow = new Set(SP.allow || []), swap = SP.swap || {}, once = new Set(SP.once || []), vary = SP.vary || [], ins = SP.entrance || [];
  let out = list.map(([n, at]) => [swap[n] || n, at]).filter(([n]) => !allow.size || allow.has(n) || n.startsWith("lib:")); // a searched sound was asked for by name: it stays
  if (ins.length) {
    out = out.filter(([n, at]) => !(/^wh-/.test(n) && at < 0.3));
    let w = ins[inAt++ % ins.length]; if (w === lastIn && ins.length > 1) w = ins[inAt++ % ins.length];
    lastIn = w; out.unshift([w, 0.05]);
  }
  const seen = {}; let last = null;
  out = out.map(([n, at], k) => {
    if (k && once.has(n) && (seen[n] || n === last) && vary.length) { for (let j = 0; j < vary.length && (seen[n] || n === last); j++) n = vary[varyAt++ % vary.length]; }
    seen[n] = (seen[n] || 0) + 1; last = n; return [n, at];
  });
  varyAt++;
  return out;
};
for (const sc of scenes) {
  const list = profiled(Array.isArray(sc.cues) ? sc.cues.filter((x) => Array.isArray(x) && x[0]) : []);
  if (list.length) list.forEach(([n, at]) => cue(sc, n, at));
  else if (sc.k > 0 && sc.transition !== "cut") cue(sc, sc.kind === "graphic" ? "wh-trans" : "wh-deep", 0.08); // a scene change with no cues of its own
}
if (SP && Number(SP.gainDb)) for (const s of sfx) s.vol = r3(s.vol * Math.pow(10, Number(SP.gainDb) / 20));
if (PERSON) for (const s of sfx) s.vol = r3(s.vol * 0.7); // under a person's own voice the effects sit 3 dB lower: the voice leads
// a calm video (the storyboard's mood: calm, caring, informative, serious…) gets no risers or hits, and its whooshes sit 3 dB lower
const CALM = /calm|caring|gentle|soft|serious|informative|educational|medical|warm|relax/i.test(String(plan.mood || ""));
if (CALM) for (const s of sfx) if (s.fam === "whoosh") s.vol = r3(s.vol * 0.7);
// risers + hits: into the segment changes (a graphic after the speaker, a new chapter), the first ~5 s after the hook
// (not in a design system whose sound profile has none)
if (Number(MIX.sfxDb)) for (const s of sfx) s.vol = r3(s.vol * Math.pow(10, Math.max(-24, Math.min(6, Number(MIX.sfxDb))) / 20));
// sounds the measured check found over the voice (server/agent.mjs, after a render): lowered by what that moment needed
// (every sound still playing in that moment: the check measures the moment, and a long texture or whoosh under it counts too)
for (const f of readJSON(join(JOB, "work", "sfx-fix.json"), [])) for (const s of sfx) { const end = s.t + (PRO[s.id]?.dur || 0.5); if (s.t < f.t + 0.4 && end > f.t - 0.05) s.vol = r3(s.vol * DB(-Math.max(0, Math.min(30, Number(f.db) || 0)))); }
// The director marks the scenes that deserve one ("rise" on its row): they get it, nothing else does (a storyboard from before
// that: the automatic rule below, which a calm mood switches off).
if (plan.directorRisers && (!SP || SP.risers !== false) && MIX.risers !== false) {
  let last = -9;
  for (const sc of scenes.filter((x, i) => i > 0 && x.rise && x.s > 1.5 && x.s < D - 1)) {
    if (sc.s - last < 4) continue;
    const fam = sfx.filter((x) => x.fam === "riser").length % 2 ? "rs-metal" : "rs-bass";
    const id = Object.keys(PRO).filter((x) => x.startsWith(fam) && PRO[x].dur <= sc.s - Math.max(0, last) - 0.3).sort((a, b) => PRO[b].dur - PRO[a].dur)[0];
    if (!id) continue;
    sfx.push({ t: r3(sc.s - PRO[id].dur), id, fam: "riser", vol: DB(-5) });
    const h = variant("hit"); if (h) sfx.push({ t: r3(sc.s - 0.02), id: h, fam: "hit", vol: DB(-7.5) });
    last = sc.s;
  }
} else if ((!SP || SP.risers !== false) && !CALM && MIX.risers !== false) {
  const seg = scenes.filter((sc, i) => i > 0 && sc.transition !== "cut" && (sc.kind === "graphic" || sc.kind === "stock" || sc.kind === "mine")).map((sc) => sc.s);
  let last = 0, n = 0;
  const first = seg.find((x) => x >= 3.5 && x <= 7) ?? seg.find((x) => x >= 3.5);
  for (const end of seg) {
    if (end < (first ?? D) || end > D - 1 || (n > 0 && end - last < 8)) continue;
    const room = end - last - 0.3, fam = n % 2 ? "rs-metal" : "rs-bass";
    const id = Object.keys(PRO).filter((x) => x.startsWith(fam) && PRO[x].dur <= room).sort((a, b) => PRO[b].dur - PRO[a].dur)[0];
    if (!id) continue;
    sfx.push({ t: r3(end - PRO[id].dur), id, fam: "riser", vol: DB(-5) });
    const h = variant("hit"); if (h) sfx.push({ t: r3(end - 0.02), id: h, fam: "hit", vol: DB(-7.5) });
    last = end; n++;
  }
}
// the customer's own sound list (Advanced editing) replaces the automatic one
// A sound the customer attached to a comment (a scene's "sound": { src, at, vol }): it plays at its moment in that scene,
// next to the kit's sounds (not replaced by the customer's own sound list in Advanced editing).
const OWNSND = scenes.filter((sc) => sc.sound?.src && existsSync(resolve(JOB, String(sc.sound.src)))).map((sc, k) => ({ t: r3(sc.s + Math.max(0, Number(sc.sound.at) || 0)), id: `own${k}-${basename(String(sc.sound.src)).replace(/[^\w]+/g, "_")}`, file: resolve(JOB, String(sc.sound.src)), fam: "texture", vol: r3(Math.max(0.05, Math.min(1.5, Number(sc.sound.vol ?? 0.7)))) })).filter((x) => x.t < D);
const SOUNDS0 = plan.soundsOwn && Array.isArray(plan.sounds) ? plan.sounds.filter((x) => x && /^[\w-]+$/.test(String(x.name)) && +x.t < D).map((x) => ({ t: r3(Math.max(0, +x.t)), id: String(x.name), fam: famOf(String(x.name)), vol: r3(Math.max(0, Math.min(1.5, Number(x.vol ?? 0.5)))) })) : sfx;
const SOUNDS = [...SOUNDS0, ...OWNSND];
SOUNDS.sort((a, b) => a.t - b.t);
// tracks: WHOOSHES 20+, TEXTURES_A/B/C 26–28, RISERS 32+, HITS 35+ (overlaps go to the next lane of their family)
const BAND = { whoosh: [20, 25], texture: [26, 29], riser: [32, 35], hit: [35, 38] }, laneEnd = {}, sfxDur = {};
const sfxHTML = SOUNDS.map((s, k) => {
  const ext = s.file ? extname(s.file) : ".wav", f = s.file || (s.id.startsWith("lib-") ? libSound(s.id) : join(SFXDIR, `${s.id}.wav`)); if (!existsSync(f)) return "";
  place(f, join(AS, "sfx", `${s.id}${ext}`));
  const d = r3(Math.min(sfxDur[s.id] ??= probe(f).duration, D - s.t)); if (d <= 0) return "";
  const [lo, hi] = BAND[s.fam] || [38, 44], ends = (laneEnd[s.fam] ||= []);
  let lane = ends.findIndex((e) => e <= s.t); if (lane < 0) { lane = ends.length; ends.push(0); }
  ends[lane] = s.t + d + 0.01;
  return `<audio id="sfx${k}" src="assets/sfx/${s.id}${ext}" data-start="${s.t}" data-duration="${d}" data-track-index="${Math.min(hi, lo + lane)}" data-volume="${s.vol}"></audio>`;
}).filter(Boolean).join("\n      ");
writeJSON(join(OUT, "sfx-auto.json"), sfx.map((s) => ({ t: s.t, name: s.id, fam: s.fam, vol: s.vol })));
// music: silent under full-screen graphic moments (the effects carry them); a faceless video has none unless it is the customer's
const fullCover = (sc) => sc.layout.cover || sc.mode === "full-broll-takeover" || sc.kind === "stock" || sc.kind === "mine" || sc.kind === "fallback";
writeJSON(join(OUT, "music-dips.json"), scenes.filter(fullCover).map((sc) => [sc.s, sc.e]).filter(([s, e]) => e - s > 0.6));

// ---------- fonts, kit, vendor ----------
const FONTS = [["Inter", "Inter-Variable.ttf", "100 900"], ["Hind Siliguri", "HindSiliguri-Medium.ttf", "500"], ["Hind Siliguri", "HindSiliguri-SemiBold.ttf", "600"], ["Hind Siliguri", "HindSiliguri-Bold.ttf", "700"], ["JetBrains Mono", "JetBrainsMono-Variable.ttf", "100 800"]];
const extraFonts = [["Plus Jakarta Sans", "PlusJakartaSans-Variable.ttf", "200 800"], ["Noto Sans Bengali", "NotoSansBengali-Variable.ttf", "100 900"], ["Anek Bangla", "AnekBangla-Variable.ttf", "100 800"]].filter(([, f]) => existsSync(join(HOME, "fonts", f)));
const faces = [...FONTS, ...extraFonts].filter(([, f]) => existsSync(join(HOME, "fonts", f))).map(([fam, f, w]) => { place(join(HOME, "fonts", f), join(AS, "fonts", f)); return `@font-face{font-family:"${fam}";src:url("assets/fonts/${f}") format("truetype");font-weight:${w};font-style:normal;font-display:block}`; }).join("\n");
const DISPLAY = extraFonts.some(([n]) => n === "Plus Jakarta Sans") ? '"Plus Jakarta Sans","Inter"' : '"Inter"';
const BANGLA = ['"Hind Siliguri"', ...["Anek Bangla", "Noto Sans Bengali"].filter((n) => extraFonts.some(([m]) => m === n)).map((n) => `"${n}"`)].join(","); // bundled faces first: a missing glyph never falls to a system font that lacks conjuncts
place(join(HOME, "vendor", "gsap.min.js"), join(AS, "gsap.min.js"));
const kitJS = readFileSync(join(HERE, "kit.js"), "utf8") + "\n" + (existsSync(join(HERE, "icons.js")) ? readFileSync(join(HERE, "icons.js"), "utf8") : "");
// the outside ingredients its scenes use (server/library.mjs fetched them into the job: icons, emoji files) and, only when a
// scene draws a person, the people library (peeps.js, about 1 MB)
const LIB = readJSON(join(JOB, "assets", "lib", "lib.json"), { icons: {}, emoji: {} });
for (const f of Object.values(LIB.emoji || {})) { const src = join(JOB, "assets", "lib", f); if (existsSync(src)) { mkdirSync(dirname(join(AS, "lib", f)), { recursive: true }); place(src, join(AS, "lib", f)); } }
const usesPeeps = scenes.some((sc) => /\.peep\(/.test(sc.graphic?.js || "")) && existsSync(join(HERE, "peeps.js"));
const libJS = `window.ZK_LIB = ${JSON.stringify({ icons: LIB.icons || {}, emoji: LIB.emoji || {} }).replace(/<\/(script)/gi, "<\\/$1")};\n` + (usesPeeps ? readFileSync(join(HERE, "peeps.js"), "utf8") : "");
// a 2D Animation scene (skills/2d-animation): the cartoon kit ZC and the ZanHuman people it draws (engine/cartoon)
const usesZC = scenes.some((sc) => /\b(ZC|ZS|ZF|ZANATOMY|ZCUSTOM)\./.test(sc.graphic?.js || ""));
// the film's own kit (its cast and places, made once before the shots; edit/film-kit.js) follows the engine's parts
const filmKit = join(JOB, "edit", "film-kit.js");
// the 2D library (actions, gestures, hands, set pieces, props: scripts/build-library.mjs); ZANCUT_LIBRARY_JS = a delivery being checked
// a 2D film: who speaks when (plate/lines.json: each recorded line's speaker and its words), so the body gate can check that
// only the speaker's mouth moves. A transcript word keeps its recorded word index in `src`.
const speakers = (() => {
  const lines = readJSON(join(JOB, "..", "plate", "lines.json"), []); if (!Array.isArray(lines) || !lines.length) return [];
  const out = [];
  for (const w of words) {
    const k = Number.isFinite(w.src) ? w.src : w.i, l = lines.find((x) => k >= x.w0 && k < x.w1); if (!l?.speaker) continue;
    const last = out.at(-1);
    if (last && last.who === l.speaker && w.start - last.e < 0.6) last.e = w.end; else out.push({ who: String(l.speaker), s: w.start, e: w.end });
  }
  return out;
})();
const cartoonLib = process.env.ZANCUT_LIBRARY_JS || join(HERE, "..", "cartoon", "library.js");
const zcJS = usesZC ? `window.__ZC_FRAME = { w: ${W}, h: ${H} };\n` + ["hands.js", "rig.js", "anatomy.js", "people.js", "bodies.js", "body.js", "zc.js", "creation-dna.js", "vendor/rough.js", "custom-assembler.js", "physics-logic.js", "broll-kit.js", "graphics-fx.js", "acting.js", "camera.js", "set.js", "world.js", "screens.js", "stage.js", "shot.js"].map((f) => readFileSync(join(HERE, "..", "cartoon", f), "utf8")).join("\n") + (existsSync(cartoonLib) ? `\n${readFileSync(cartoonLib, "utf8").replace(/<\/(script)/gi, "<\\/$1")}` : "") + (existsSync(filmKit) ? `\n${readFileSync(filmKit, "utf8").replace(/<\/(script)/gi, "<\\/$1")}` : "") : "";

// ---------- the page ----------
const T = plan.tokens || {};
const vars = { "--cap": String(Math.max(0.7, Math.min(1.5, Number(MIX.capScale) || 1))), "--W": `${W}px`, "--H": `${H}px`, "--u": `${U}px`, "--zk-display": `${DISPLAY},${BANGLA},sans-serif`, "--zk-font": `"Inter",${BANGLA},sans-serif`, "--zk-bangla": `${BANGLA},sans-serif`, "--rad": `${RAD}px`, ...T };
const zonesAttr = (z) => esc(JSON.stringify(z || {}));
const sceneEls = scenes.map((sc) => {
  const d = r3(sc.e - sc.s), L = sc.layout.speaker || sc.layout.screen || {}, face = sc.mode === "full-broll-takeover" ? null : sc.layout.speaker?.face; // a full-frame graphic hides the speaker: no face to keep clear
  const attrs = `data-start="${sc.s}" data-duration="${d}" data-k="${sc.k}" data-zones="${zonesAttr(L.zones)}"${face ? ` data-face-here="${face.join(",")}"` : ""}`;
  // a graphic built over a photo or a clip: the picture is the section's first element (.gx-media), the builder's design over it
  const gm = sc.kind === "graphic" && sc.media ? media(sc.media) : "";
  const gmHTML = !gm ? "" : MEDIA_RE.test(gm) ? `<div class="gx-media"><video class="clip" src="${gm}" data-start="${sc.s}" data-duration="${d}" data-media-start="0" data-track-index="5" muted playsinline></video></div>` : `<div class="gx-media"><img src="${gm}" alt=""/></div>`;
  // a ground that carries on from the scene before (ZK.stage reads these): how many scenes into the run and where the anchor is
  const carry = sc.kind === "graphic" && sc.carry > 0 ? ` data-carry="${sc.carry}"${Number.isFinite(sc.carryFrom?.x) && Number.isFinite(sc.carryFrom?.y) ? ` data-from-x="${sc.carryFrom.x}" data-from-y="${sc.carryFrom.y}"` : ""}` : "";
  if (sc.kind === "graphic") return `<section id="b${sc.k}" data-lib="glossy-${sc.row + 1}" class="zc clip layer-${sc.layout.cover || sc.mode === "full-broll-takeover" || sc.mode === "masked-pip-stage" || sc.mode === "bg-replace-stage" || sc.layout.screen ? "full" : "over"}" ${attrs}${carry} data-track-index="4">${gmHTML}${sc.graphic.html}</section>`;
  if (sc.kind === "stock") return `<section id="b${sc.k}" class="zm clip stock" ${attrs} data-track-index="4">${MEDIA_RE.test(sc.mediaSrc) ? `<video class="zm-media clip" src="${sc.mediaSrc}" data-start="${sc.s}" data-duration="${d}" data-media-start="0" data-track-index="5" muted playsinline></video>` : `<img class="zm-media" src="${sc.mediaSrc}" alt=""/>`}<div class="zm-tint"></div>${sc.text ? `<div class="zm-text${isBn(sc.text) ? " zk-bn" : ""}">${esc(sc.text)}${sc.sub ? `<small>${esc(sc.sub)}</small>` : ""}</div>` : ""}</section>`;
  if (sc.kind === "mine") return `<section id="b${sc.k}" class="zm clip mine" ${attrs} data-track-index="4"><div class="zm-ground"></div><div class="zm-card">${sc.kicker ? `<div class="zm-kicker">${esc(sc.kicker)}</div>` : ""}<div class="zm-frame">${MEDIA_RE.test(sc.mediaSrc) ? `<video class="zm-media clip" src="${sc.mediaSrc}" data-start="${sc.s}" data-duration="${d}" data-media-start="0" data-track-index="5" muted playsinline></video>` : `<img class="zm-media" src="${sc.mediaSrc}" alt=""/>`}</div>${sc.text ? `<div class="zm-cap${isBn(sc.text) ? " zk-bn" : ""}">${esc(sc.text)}</div>` : ""}</div></section>`;
  if (sc.kind === "fallback") return `<section id="b${sc.k}" class="zm clip fallback" ${attrs} data-track-index="4"><div class="zm-ground"></div><div class="zm-say${isBn(sc.say) ? " zk-bn" : ""}">${esc(sc.say || "")}</div></section>`;
  return "";
}).filter(Boolean).join("\n      ");
// a tall screen window fills the middle of the frame: its captions go under it, on the plain ground (over the recording they
// would sit on whatever the screen shows, often too dark or too busy to read)
const capUnder = (sc) => { const L = sc.layout?.screen; return L?.fill ? ` style="top:${(((L.rect.y + L.rect.h) / H) * 100 + 1.6).toFixed(1)}%"` : ""; };
const capHTML = capItems.map((c, k) => `<div id="c${k}" class="cap clip cap-${capUnder(c.sc) ? "under" : capPos(c.sc)}"${capUnder(c.sc)} data-start="${c.s}" data-duration="${r3(c.e - c.s)}" data-track-index="6"><div class="cap-inner${c.ws.some((w) => isBn(w.text)) ? " zk-bn" : ""}">${c.ws.map((w) => `<span class="w" data-t0="${r3(w.start)}" data-t1="${r3(w.end)}">${esc(w.text)}</span>`).join(" ")}</div></div>`).join("\n      ");
const customCSS = scenes.filter((sc) => sc.graphic?.css.trim()).map((sc) => `#b${sc.k}{${sc.graphic.css}}`).join("\n");
const customJS = scenes.filter((sc) => sc.graphic).map((sc) => `<script>window.__zc=window.__zc||{};window.__zc[${sc.k}]=function(tl,root,s,d,words,ZK,at){\n${sc.graphic.js}\n};</script>`).join("\n    ");

// a plain speaker scene's punch-ins: the strongest words (from the storyboard) → a quick zoom on the face, held through the phrase
const punchOf = (sc) => {
  if (sc.kind !== "speaker" || sc.mode !== "speaker" || !Array.isArray(sc.punch) || !sc.punch.length) return null;
  const at = sc.punch.map((i) => r3(wStart(i))).filter((t) => t > sc.s + 0.25 && t < sc.e - 0.8).filter((t, k, a) => k === 0 || t - a[k - 1] >= 0.9); // room to zoom back
  const f = sc.layout.speaker?.face;
  return at.length ? { at, o: f ? `${r3(((f[0] + f[2] / 2) / W) * 100)}% ${r3(((f[1] + f[3] * 0.45) / H) * 100)}%` : "50% 35%" } : null;
};
const FILTERS = { warm: "sepia(0.18) saturate(1.15) hue-rotate(-6deg)", cool: "saturate(0.95) hue-rotate(8deg) brightness(1.02)", bw: "grayscale(1) contrast(1.08)", vivid: "saturate(1.35) contrast(1.06)", fade: "contrast(0.88) saturate(0.8) brightness(1.06)", dramatic: "contrast(1.25) saturate(0.9) brightness(0.94)" };
const runtimePlan = {
  D, W, H, fps, kind: KIND, tall: TALL, cutout: CUTOUT, theme: plan.theme || "dark", rad: RAD,
  scenes: scenes.map((sc) => ({ k: sc.k, uid: sc.uid, row: sc.row, s: sc.s, e: sc.e, kind: sc.kind, mode: sc.mode, transition: sc.transition || "cut", exit: sc.exit, fadeIn: sc.fadeIn, fadeOut: sc.fadeOut,
    spk: sc.layout.speaker ? { clip: sc.layout.speaker.spk.clip, m: sc.layout.speaker.spk.m, z: sc.layout.speaker.spk.z, o: sc.layout.speaker.spk.o, cut: sc.layout.speaker.cut, box: sc.layout.speaker.box, vig: sc.layout.speaker.vig } : null,
    scr: sc.layout.screen || null, cover: !!sc.layout.cover,
    focus: Array.isArray(sc.focus) && sc.focus.length === 4 ? sc.focus.map(Number) : null,
    words: words.filter((w) => w.start >= sc.s - 0.12 && w.start < sc.e).map((w) => ({ text: w.text, t: r3(w.start), e: r3(w.end), i: w.i })),
    punch: punchOf(sc),
    filter: FILTERS[sc.filter] || null })),
  events: (plan.screenEvents || []).filter((e) => Array.isArray(e.focus) && e.focus.length === 4 && e.to > e.from).map((e) => ({ from: r3(e.from), to: r3(e.to), focus: e.focus.map(Number), action: e.action || "click" })),
  fx: (Array.isArray(plan.fx) ? plan.fx : []).filter((f) => f && f.e > f.s),
};

const html = `<!doctype html>
<html lang="${job.lang || "en"}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${W}, height=${H}" />
    <title>${esc(basename(JOB))}</title>
    <script src="assets/gsap.min.js"></script>
    <style>
      ${faces}
      :root{${Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(";")}}
      ${readFileSync(join(HERE, "runtime.css"), "utf8")}
      ${typeof plan.atoms === "string" ? plan.atoms.replace(/<\/style/gi, "") : ""}
      ${customCSS}
    </style>
  </head>
  <body class="${TALL ? "tall" : WIDE ? "wide" : "square"} theme-${plan.theme || "dark"} kind-${KIND} style-${String(plan.style || "glossy").replace(/[^a-z0-9-]/gi, "")}">
    <div id="root" data-composition-id="main" data-start="0" data-duration="${D}" data-width="${W}" data-height="${H}">
      <div id="ground"></div>
      ${SCREEN ? `<div id="scr" class="scr"><div class="scr-chrome"><i></i><i></i><i></i><span class="scr-url"></span></div><div class="scr-view"><div id="scr-inner"><video id="aroll" src="assets/media/aroll.mp4" data-start="0" data-duration="${D0}" data-media-start="0" data-track-index="0" playsinline data-has-audio="true"></video><div id="scr-hl"></div></div></div><div id="scr-tap"></div></div>`
    : `<div id="spk-clip"><div id="spk-move"><div id="spk-drift"><video id="aroll" src="assets/media/aroll.mp4" data-start="0" data-duration="${D0}" data-media-start="0" data-track-index="0" playsinline data-has-audio="true"${KIND === "faceless" ? ' data-plate="1"' : ""}></video></div></div></div>
      <div id="torso-vig"></div>
      ${CUTOUT ? `<div id="cut-clip"><div id="cut-move"><div id="cut-drift"><video id="cutout" src="assets/media/subject.webm" data-start="0" data-duration="${D0}" data-media-start="0" data-track-index="2" muted playsinline></video></div></div></div>` : ""}
      <div id="spk-box"></div>${BESIDE ? `
      <div id="scr" class="scr"><div class="scr-chrome"><i></i><i></i><i></i><span class="scr-url"></span></div><div class="scr-view"><div id="scr-inner"><video id="scrv" src="assets/media/screen.mp4" data-start="0" data-duration="${D0}" data-media-start="0" data-track-index="1" muted playsinline></video><div id="scr-hl"></div></div></div><div id="scr-tap"></div></div>` : ""}`}
      ${sceneEls}
      ${capHTML}
      ${sfxHTML}
    </div>
    <script id="hf-plan" type="application/json">${JSON.stringify(runtimePlan).replace(/<\/(script)/gi, "<\\/$1")}</script>${usesZC && speakers.length ? `\n    <script id="hf-speakers" type="application/json">${JSON.stringify(speakers).replace(/<\/(script)/gi, "<\\/$1")}</script>` : ""}
    <script>
${libJS}
${kitJS}
${zcJS}
    </script>
    ${customJS}
    <script>
${readFileSync(join(HERE, "runtime.js"), "utf8")}
    </script>
  </body>
</html>
`;
writeFileSync(join(OUT, "index.html"), html);
writeJSON(join(OUT, "hyperframes.json"), { $schema: "https://hyperframes.heygen.com/schema/hyperframes.json", paths: { assets: "assets" }, media: { autoProxy: true } });
writeJSON(join(OUT, "meta.json"), { id: basename(JOB), name: basename(JOB) });
writeJSON(join(OUT, "scenes.json"), scenes.map((sc) => ({ row: sc.row, uid: sc.uid, s: sc.s, e: sc.e, kind: sc.kind, mode: sc.mode })));

const report = { ok: true, duration: D, scenes: scenes.length, captions: capItems.length, sfx: SOUNDS.length, cutout: CUTOUT, face: !!FACE,
  modes: Object.fromEntries([...new Set(scenes.map((s) => s.mode))].map((m) => [m, scenes.filter((s) => s.mode === m).length])), warnings };
writeJSON(join(JOB, "edit", "build-report.json"), report);
console.log(JSON.stringify(report));
