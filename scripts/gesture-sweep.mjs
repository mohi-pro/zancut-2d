// All shipped gestures through the scene compiler + production 30 fps Chrome body gate.
// Four ages/looks; entry, exit and repeats. Only a completely clean sweep updates the runtime allowlist.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { shotScript, kitFor } from '../server/codefilm.mjs';
import { checkBody } from '../engine/cartoon/check-body.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ids = fs.readdirSync(path.join(root, 'engine/cartoon/library/gestures')).filter(f => f.endsWith('.json')).map(f => f.slice(0, -5)).sort();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'z2d-gesture-sweep-'));
const outAt = process.argv.indexOf('--out'), reportFile = outAt >= 0 ? path.resolve(process.argv[outAt + 1]) : path.join(root, 'archives/gesture-fix-2026-11-08/sweep.json');
const fpsAt = process.argv.indexOf('--fps'), fps = fpsAt >= 0 ? Number(process.argv[fpsAt + 1]) : 30;
const seconds = 6, cast = {
  child: { gender: 'male', age: 'child', skin: 3, outfit: { type: 'tshirt', color: '#e0862b' } },
  man: { gender: 'male', age: 'adult', skin: 4, outfit: { type: 'shirt', color: '#3977ae' } },
  woman: { gender: 'female', age: 'adult', skin: 3, hair: { style: 'hijab', color: '#6d4aa8' }, outfit: { type: 'abaya', color: '#3a3556' } },
  elder: { gender: 'male', age: 'elderly', skin: 4, hair: { style: 'cap' }, outfit: { type: 'punjabi', color: '#ddd2b5' }, extras: ['beard'] },
};
const cut = path.join(tmp, 'cut.mp4');
execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x222222:s=320x180:r=30', '-t', String(seconds * 2), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', cut]);
const results = { at: new Date().toISOString(), fps, secondsPerGesture: seconds, rigs: ['full-body', 'waist-up'], profiles: Object.keys(cast), count: ids.length, frames: 0, ok: [], jumps: {}, cases: [] };
fs.mkdirSync(path.dirname(reportFile), { recursive: true });
for (const id of ids) {
  const job = path.join(tmp, id); for (const folder of ['cut', 'work', 'edit/graphics']) fs.mkdirSync(path.join(job, folder), { recursive: true });
  fs.linkSync(cut, path.join(job, 'cut/cut.mp4')); fs.writeFileSync(path.join(job, 'job.json'), '{}');
  fs.writeFileSync(path.join(job, 'cut/transcript.json'), JSON.stringify([{ text: 'full', start: 0, end: seconds }, { text: 'close', start: seconds, end: seconds * 2 }]));
  const film = { cast, shots: [{ at: 0, place: 'village_home', camera: { kind: 'wide' }, people: Object.keys(cast).map((who, i) => ({ who, x: -1.8 + i * 1.2, dz: 1, do: 'idle', gesture: id, view: ['front', 'side', 'side', 'three'][i] })) }] };
  fs.writeFileSync(path.join(job, 'edit/film-kit.js'), kitFor(film));
  fs.writeFileSync(path.join(job, 'edit/graphics/scene.html'), `<script>ZK.unit(root);\n${shotScript(film.shots[0], film)}\n</script>`);
  const def = JSON.parse(fs.readFileSync(path.join(root, 'engine/cartoon/library/gestures', id + '.json'))), duration = Math.min(def.seconds * 1.35, seconds - 0.36);
  const setup = Object.keys(cast).map((who, i) => `const r${i} = ZC.person(W.layer("p${i}"), { spec: ZF.cast.${who}, x: W.w * ${(i + 0.5) / 4}, y: W.h * 0.35, scale: 0.55, cropped: true });`).join('\n');
  const draw = Object.keys(cast).map((who, i) => `r${i}.draw({ ...r${i}.gesture(${JSON.stringify(id)}, t, { start, duration: ${duration} }) }, t);`).join('\n');
  fs.writeFileSync(path.join(job, 'edit/graphics/close.html'), `<script>ZK.unit(root); const W = ZC.world(root); ${setup}\nZC.clock(tl, s, d, t => { W.cam(W.w/2,W.h/2,W.w); const period = ${duration} + 0.18, start = 0.18 + Math.floor(Math.max(0,t-0.18)/period)*period; ${draw} });</script>`);
  fs.writeFileSync(path.join(job, 'edit/plan.json'), JSON.stringify({ version: 2, canvas: '1920x1080', kind: 'faceless', style: '2d-animation', theme: 'light', tokens: {}, captions: { on: false }, scenes: ['scene', 'close'].map((name, i) => ({ row: i, uid: 's' + i, startWord: i, endWord: i, kind: 'graphic', mode: 'full-broll-takeover', file: `edit/graphics/${name}.html`, transition: 'cut', captions: 'hide', cues: [] })) }));
  try {
    execFileSync(process.execPath, [path.join(root, 'engine/compose/compose.mjs'), job], { stdio: 'pipe' });
    const gate = await checkBody(path.join(job, 'edit/hf'), { fps }); results.frames += gate.frames;
    results.cases.push({ id, ok: gate.ok, frames: gate.frames, people: gate.people, faults: gate.lines });
    if (gate.ok) results.ok.push(id); else results.jumps[id] = gate.lines;
    console.log(`${results.cases.length}/${ids.length} ${id}: ${gate.ok ? 'PASS' : 'FAIL ' + gate.lines.slice(0, 2).join(' | ')}`);
  } catch (error) { results.jumps[id] = [error.message]; results.cases.push({ id, ok: false, error: error.message }); console.log(`${id}: ERROR ${error.message.slice(0, 200)}`); }
  fs.writeFileSync(reportFile, JSON.stringify(results, null, 2) + '\n'); fs.rmSync(job, { recursive: true, force: true });
}
if (results.ok.length === ids.length && fps === 30 && !process.argv.includes('--no-update')) fs.writeFileSync(path.join(root, 'brain/gestures-gate.json'), JSON.stringify({ at: results.at, fps, profiles: results.profiles, ok: results.ok, jumps: {} }, null, 1) + '\n');
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${results.ok.length}/${ids.length} gestures passed at ${fps} fps; ${results.frames} frames, ${results.frames * 4} person-frames. Report: ${reportFile}`);
if (results.ok.length !== ids.length) process.exitCode = 1;
