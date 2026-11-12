// A still of one shot from the real engine: the same page and the same body gate the render uses (no AI). ~10–20 s on the M4.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { ENGINE_DIR } from './config.mjs';
import { shotScript, kitFor } from './codefilm.mjs';

const SIZES = { '16:9': [1280, 720], '9:16': [720, 1280], '1:1': [1000, 1000], '4:5': [800, 1000] };
export async function previewShot(film, i, root, format = '16:9') {
  const shot = film.shots[i]; if (!shot) throw new Error('No such shot.');
  const [w, h] = SIZES[format] || SIZES['16:9'], secs = 3, d = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'z2d-prev-')), 'job');
  for (const x of ['cut', 'edit/graphics', 'work']) fs.mkdirSync(path.join(d, x), { recursive: true });
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `color=c=0x222222:s=${w}x${h}:r=30`, '-f', 'lavfi', '-i', 'anullsrc=r=48000', '-t', String(secs), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(d, 'cut/cut.mp4')]);
  fs.writeFileSync(path.join(d, 'job.json'), '{}'); fs.writeFileSync(path.join(d, 'edit/film-kit.js'), kitFor(film));
  fs.writeFileSync(path.join(d, 'cut/transcript.json'), JSON.stringify([{ text: 'a', start: 0, end: 1.4 }, { text: 'b', start: 1.5, end: 2.9 }]));
  const f = 'edit/graphics/s0.html'; fs.writeFileSync(path.join(d, f), `<script>\nZK.unit(root);\n${shotScript(shot, film)}\n</script>`);
  fs.writeFileSync(path.join(d, 'edit/plan.json'), JSON.stringify({ version: 2, canvas: `${w}x${h}`, kind: 'faceless', style: '2d-animation', theme: 'light', tokens: {}, captions: { on: false }, atoms: '', scenes: [{ row: 0, uid: 's0', startWord: 0, endWord: 1, kind: 'graphic', mode: 'full-broll-takeover', file: f, transition: 'cut', captions: 'hide', cues: [] }] }));
  execFileSync(process.execPath, [path.join(ENGINE_DIR, 'compose/compose.mjs'), d], { stdio: 'pipe' });
  const { stills } = await import(pathToFileURL(path.join(ENGINE_DIR, 'readcheck.mjs')).href);
  const out = path.join(root, 'previews'); fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `shot${i + 1}-${Date.now()}.jpg`);
  for (const old of fs.readdirSync(out)) if (old.startsWith(`shot${i + 1}-`)) fs.rmSync(path.join(out, old), { force: true });
  await stills(path.join(d, 'edit/hf'), [{ ts: [1.5], uid: 's0', file, i: 0 }]);
  fs.rmSync(path.dirname(d), { recursive: true, force: true });
  if (!fs.existsSync(file)) throw new Error('The engine drew nothing for this shot (check its place, people and actions).');
  return file;
}
