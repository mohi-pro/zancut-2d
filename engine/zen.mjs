#!/usr/bin/env node
// The engine's step runner for one video. Each verb runs several engine steps and prints one JSON line (last line).
//   node engine/zen.mjs prep    --ws <workspace>   first cut, face track, numbers → job/work/BRIEF.md
//   node engine/zen.mjs cut     --ws <workspace>   cut with job/work/cuts.json, face track, the cut-out in the background
//   node engine/zen.mjs screen  --ws <workspace> [screen.mp4]   screen recordings: tracks the screen locally (no AI) → job/work/screenEvents.json
//   node engine/zen.mjs compose --ws <workspace> [--wait 60]   edit/plan.json → edit/hf (waits for the cut-out if a scene needs it)
//   node engine/zen.mjs finish  --ws <workspace> vN   compose, render, music + loudness, checks → exports/vN.mp4
// The job lives in <workspace>/job; engine outputs in <workspace>/outputs (ZEN_ROOT), so videos never mix.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { npx } from './media/lib.mjs';

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2), verb = argv[0];
const opt = (k, d = null) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : d; };
const WS = path.resolve(opt('ws', process.cwd())), JOB = path.join(WS, 'job');
const env = { ...process.env, ZEN_ROOT: WS };
const J = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } };
const sh = (cmd, a, o = {}) => spawnSync(cmd, a, { cwd: WS, encoding: 'utf8', maxBuffer: 1 << 27, env, ...o });
const out = (r) => `${r.stdout || ''}${r.stderr || ''}`;
const lastJson = (text) => { for (const s of [...String(text).matchAll(/\{[^\n]*\}/g)].map((x) => x[0]).reverse()) { try { return JSON.parse(s); } catch {} } return null; };
const r2 = (n) => Math.round(n * 100) / 100;
const done = (o) => { console.log(JSON.stringify({ ok: true, ...o })); process.exit(0); };
const die = (msg) => { console.log(JSON.stringify({ ok: false, error: String(msg).slice(-800) })); process.exit(1); };
const PY = [process.env.ZANCUT_PYTHON, path.join(process.env.HOME || process.env.USERPROFILE || '', '.cache', 'zancut', 'py', ...(process.platform === 'win32' ? ['Scripts', 'python.exe'] : ['bin', 'python']))].find((p) => p && fs.existsSync(p)) || (process.platform === 'win32' ? 'python' : 'python3');
const media = (f) => path.join(ENGINE, 'media', f);
if (!fs.existsSync(JOB)) die(`no job folder at ${JOB}`);
const job = () => J(path.join(JOB, 'job.json')) || {};
const noPresenter = () => !!job().noPresenter;

function probe(file) {
  const r = sh('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_type,width,height:format=duration', '-of', 'json', file]);
  const j = JSON.parse(r.stdout || '{}'), v = (j.streams || []).find((s) => s.codec_type === 'video') || {};
  return { w: v.width, h: v.height, duration: r2(Number(j.format?.duration || 0)), audio: (j.streams || []).some((s) => s.codec_type === 'audio') };
}
const hasPerson = () => !noPresenter(); // a person on the main track
const TD = () => path.join(JOB, 'cut'); // where the face track and the cut-out live
// ---- the speaker cut-out (background removal), made once per cut, in the background ----
const matteLog = () => path.join(TD(), 'matte.log'), matteFor = () => path.join(TD(), 'matte.for');
const segHash = () => crypto.createHash('md5').update(JSON.stringify(J(path.join(JOB, 'cut', 'segments.json'))?.segments || [])).digest('hex');
const matteDone = () => fs.existsSync(path.join(TD(), 'subject.webm')) && /"ok":\s*true/.test(fs.existsSync(matteLog()) ? fs.readFileSync(matteLog(), 'utf8') : '');
const matteState = () => (!hasPerson() ? 'none' : fs.existsSync(matteFor()) && fs.readFileSync(matteFor(), 'utf8') === segHash() ? (matteDone() ? 'ready' : /error|Traceback/i.test(fs.existsSync(matteLog()) ? fs.readFileSync(matteLog(), 'utf8') : '') ? 'failed' : 'running') : 'none');
function startMatte() {
  if (!hasPerson() || matteState() !== 'none') return;
  fs.rmSync(path.join(TD(), 'subject.webm'), { force: true });
  fs.writeFileSync(matteFor(), segHash());
  const fd = fs.openSync(matteLog(), 'w');
  spawn('node', [media('matte.mjs'), JOB], { cwd: WS, env, detached: true, windowsHide: true, stdio: ['ignore', fd, fd] }).unref();
}
function doCut() {
  const r = sh('node', [media('roughcut.mjs'), 'cut', JOB]);
  const j = lastJson(out(r)); if (!j?.ok) die(`cut: ${out(r).slice(-500)}`);
  let face = null;
  if (!noPresenter()) face = lastJson(out(sh(PY, [media('track.py'), path.join(JOB, 'cut', 'cut.mp4'), path.join(JOB, 'cut', 'facetrack.json')])));
  return { cut: j, face };
}
const words = () => { const w = J(path.join(JOB, 'cut', 'transcript.json')) || []; return Array.isArray(w) ? w : w.words || []; };
// the shot measured by code: how big the face is, where the top of the head sits (for the pop-out box and behind-head text)
function framing() {
  const t = J(path.join(TD(), 'facetrack.json')), tr = (t?.track || []).filter((x) => x && x.h);
  if (!tr.length) return null;
  const med = (k) => tr.map((x) => x[k]).sort((a, b) => a - b)[tr.length >> 1];
  const h = med('h'), y = med('y'), x = med('x');
  const sj = J(path.join(TD(), 'segments.json')), ar = (sj?.canvas?.width || 1080) / (sj?.canvas?.height || 1920); // face box height is in frame heights
  return { faceBox: [r2((x - h * 0.42 / ar) * 100), r2((y - h * 0.42) * 100), r2(h * 84 / ar), r2(h * 100)], headTopYPct: r2(Math.max(0, y - h * 0.62) * 100), shot: h >= 0.26 ? 'close-up' : h >= 0.14 ? 'medium' : 'wide', detected: t.detected };
}

/* ---------- prep: everything that needs no judgement ---------- */
if (verb === 'prep') {
  const pr = sh('node', [media('roughcut.mjs'), 'prep', JOB]);
  if (!lastJson(out(pr))?.ok) die(`prep: ${out(pr).slice(-400)}`);
  const { cut } = doCut();
  const cutFile = path.join(JOB, 'cut', 'cut.mp4'), pb = probe(cutFile);
  const vol = out(sh('ffmpeg', ['-v', 'info', '-i', cutFile, '-af', 'volumedetect', '-vn', '-f', 'null', '-']));
  const fr = framing(), ws = words(), rt = J(path.join(JOB, 'work', 'retakes.json')) || [];
  const brief = `# Brief (facts measured by code before the director starts)

- Main track: ${pb.w}x${pb.h}, ${pb.duration} s after the first cut (${cut.before} s → ${cut.after} s). Language \`${job().lang}\`. Voice ${Number((vol.match(/mean_volume: ([-\d.]+)/) || [])[1])} dB mean.
- ${noPresenter() ? (job().zancut?.kind === 'screen' ? 'The main track is the screen recording (nobody on camera).' : 'Nobody on the main track (storytelling): every moment is a full-frame scene.') : (fr ? `Speaker framing: ${fr.shot} shot; faceBox [x,y,w,h] % = [${fr.faceBox.join(', ')}]; top of the head at ${fr.headTopYPct}% of the frame height (seen in ${Math.round((fr.detected || 0) * 100)}% of frames).` : 'Speaker: the face was not found reliably — avoid the pop-out box, behind-head and background-replace modes.')}
- Retakes found by code: ${rt.length ? rt.map((r) => `#${r.remove[0]}–#${r.remove[1]} ${r.kind} (${r.confidence})`).join('; ') : 'none'}.

## The first cut (word numbers for the storyboard: number:word@second)
${ws.map((x, i) => `${i}:${x.text}@${r2(x.start)}`).join(' ')}
`;
  fs.writeFileSync(path.join(JOB, 'work', 'BRIEF.md'), brief);
  if (fr) fs.writeFileSync(path.join(JOB, 'work', 'framing.json'), JSON.stringify(fr));
  done({ brief: 'job/work/BRIEF.md', seconds: pb.duration, framing: fr });
}

/* ---------- cut (the customer's decided cut) ---------- */
if (verb === 'cut') {
  const { cut, face } = doCut();
  if (job().cutBy !== 'ai' || (J(path.join(JOB, 'work', 'cuts.json')) || {}).decided) startMatte();
  const fr = framing(); if (fr) fs.writeFileSync(path.join(JOB, 'work', 'framing.json'), JSON.stringify(fr));
  done({ before: cut.before, after: cut.after, segments: cut.segments, matte: matteState(), face: !!face });
}

/* ---------- compose ---------- */
function compose(waitSec) {
  const pf = path.join(JOB, 'edit', 'plan.json'), planText = fs.existsSync(pf) ? fs.readFileSync(pf, 'utf8') : '';
  if (!planText) die('no edit/plan.json');
  if (/"(popout-box-split|behind-head-depth|bg-replace-stage)"/.test(planText)) {
    startMatte();
    const t0 = Date.now(); while (matteState() === 'running' && Date.now() - t0 < waitSec * 1000) spawnSync('sleep', ['3']);
  }
  const r = sh('node', [path.join(ENGINE, 'compose', 'compose.mjs'), JOB]);
  const rep = lastJson(out(r)); if (!rep?.ok) die(`compose: ${out(r).slice(-800)}`);
  return rep;
}
if (verb === 'compose') done({ ...compose(Number(opt('wait', 0))), matte: matteState() });
if (verb === 'matte') { startMatte(); done({ matte: matteState() }); }

/* ---------- finish vN ---------- */
if (verb === 'finish') {
  const v = argv.find((a) => /^v\d+(-[\w]+)?$/.test(a)); if (!v) die('usage: finish vN');
  const rep = compose(540);
  const hf = path.join(JOB, 'edit', 'hf');
  // a 2D Animation: the body gate (every frame in real Chrome, rules H01–H21 and R1–R7). A film that breaks them never renders.
  if ((J(path.join(JOB, 'edit', 'plan.json')) || {}).style === '2d-animation') {
    const g = sh('node', [path.join(ENGINE, 'cartoon', 'check-body.mjs'), hf], { timeout: 30 * 60000 });
    if (g.status !== 0) die(`The characters break the body rules, so this version was not rendered. ${out(g).slice(0, 700)}`);
  }
  fs.rmSync(path.join(JOB, 'edit', 'render.mp4'), { force: true });
  const patch = path.join(process.env.HOME || '', '.cache', 'zancut', 'sandbox-os-patch.cjs');
  const renv = { ...env, ...(fs.existsSync(patch) && !/sandbox-os-patch/.test(env.NODE_OPTIONS || '') ? { NODE_OPTIONS: `${env.NODE_OPTIONS || ''} --require ${patch}`.trim() } : {}) };
  const [nc, na, no] = npx(['hyperframes', 'render', '-o', '../render.mp4', '--quality', 'delivery', '--fps', '30', '--workers', '4', '--experimental-fast-capture', '--quiet']);
  const r = sh(nc, na, { ...no, cwd: hf, env: renv, timeout: 60 * 60000 });
  if (!fs.existsSync(path.join(JOB, 'edit', 'render.mp4'))) die(`render: ${out(r).slice(-600)}`);
  const f = sh('node', [media('finalize.mjs'), JOB]);
  const fin = (() => { const t = out(f); try { return JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1)); } catch { return null; } })();
  const final = path.join(WS, 'outputs', 'job.final.mp4');
  if (!fin?.ok || !fs.existsSync(final)) die(`finalize: ${out(f).slice(-500)}`);
  const pb = probe(final);
  const dec = out(sh('ffmpeg', ['-v', 'error', '-i', final, '-f', 'null', '-'])).trim();
  const sil = (out(sh('ffmpeg', ['-hide_banner', '-i', final, '-af', 'silencedetect=n=-45dB:d=0.5', '-vn', '-f', 'null', '-'])).match(/silence_start/g) || []).length;
  fs.mkdirSync(path.join(WS, 'exports'), { recursive: true });
  fs.copyFileSync(final, path.join(WS, 'exports', `${v}.mp4`));
  const plan = J(path.join(JOB, 'edit', 'plan.json')) || {}, cw = words(), mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
  const notes = [`# ${v}`, '', ...(plan.scenes || []).filter((sc) => !sc.hidden).map((sc) => `- ${mmss(cw[sc.startWord]?.start || 0)} — ${sc.title || sc.mode || sc.kind}${sc.say ? `: "${String(sc.say).slice(0, 70)}"` : ''}`), '', `- Music: ${plan.music?.src ? (plan.music.own ? 'your track' : 'from the Zancut music library') : 'none'}. Length: ${pb.duration} s.`];
  fs.writeFileSync(path.join(WS, 'exports', `${v}.md`), notes.join('\n') + '\n');
  const bad = [dec ? `decode: ${dec.slice(0, 120)}` : '', Math.abs(fin.loudnessLUFS + 14) > 1 ? `loudness ${fin.loudnessLUFS}` : '', fin.truePeak > -1 ? `true peak ${fin.truePeak}` : '', sil ? `${sil} silent part(s)` : ''].filter(Boolean);
  done({ file: `exports/${v}.mp4`, w: pb.w, h: pb.h, duration: pb.duration, lufs: fin.loudnessLUFS, peak: fin.truePeak, music: fin.music || null, checks: bad, warnings: rep.warnings });
}
/* ---------- screen: the screen recording tracked locally (frame differencing at 4 fps, no AI) ---------- */
if (verb === 'screen') {
  const skip = new Set(); argv.forEach((a, i) => { if (a.startsWith('--')) { skip.add(i); skip.add(i + 1); } });
  const given = argv.find((a, i) => i > 0 && !skip.has(i));
  const src = given ? path.resolve(given) : path.join(JOB, 'cut', 'cut.mp4');
  if (!fs.existsSync(src)) die(`no screen recording at ${src}`);
  fs.mkdirSync(path.join(JOB, 'work'), { recursive: true });
  const file = path.join(JOB, 'work', 'screenEvents.json');
  const r = lastJson(out(sh(PY, [media('screen.py'), src, file])));
  if (!r?.ok) die(`screen: ${r?.why || 'tracking failed'}`);
  fs.copyFileSync(file, path.join(JOB, 'work', 'screen.json')); // the director and the compositor read this name
  done({ events: r.events, deviceAspect: r.deviceAspect, file: 'job/work/screenEvents.json' });
}

die(`unknown verb ${verb}: prep | cut | screen | compose | matte | finish vN`);
