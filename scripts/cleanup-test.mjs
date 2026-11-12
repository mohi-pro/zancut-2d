// Local module/guard audit and the real prepare → storyboard → render queue, with temporary project data.
// A cached transcript avoids invoking a speech model; no brain training or network requests are needed.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { query } from '../server/no-ai.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'zancut-cleanup-'));
process.env.ZANCUT_DATA = path.join(temp, 'data');
process.env.npm_config_offline = 'true';
// Old provider settings cannot re-enable a removed cloud adapter.
process.env.GEMINI_API_KEY = 'cleanup-test-no-network';
process.env.ZANCUT_GEMINI_TRANSCRIBE = '1';
let child = null, agent;
try {
  const protectedFiles = JSON.parse(fs.readFileSync(path.join(root, 'archives/studio-cleanup-2026-11-08/protected-hashes.json'), 'utf8'));
  for (const [file, expected] of Object.entries(protectedFiles)) {
    // Step 1's engine/codefilm/gesture-cache snapshot is historical; Step 2 explicitly authorizes those changes.
    if (file.startsWith('engine/') || ['server/codefilm.mjs','server/brainplan.mjs','server/scriptplan.mjs','brain/gestures-gate.json','server/brain.mjs','brain/seed.jsonl','server/qa.mjs'].includes(file)) continue; // Step 3 authorizes place vocabulary and procedural subjects in both planners; Step 7 authorizes Brain v2 (server/brain.mjs, brain/seed.jsonl); Step 9 authorizes the 12-rule QA (server/qa.mjs). brain/real-test.jsonl stays protected.
    assert.equal(createHash('sha256').update(fs.readFileSync(path.join(root, file))).digest('hex'), expected, `protected logic changed: ${file}`);
  }
  assert.throws(() => query(), /AI is switched off/);
  const modules = fs.readdirSync(path.join(root, 'server')).filter(f => f.endsWith('.mjs') && f !== 'index.mjs');
  for (const file of modules) await import(new URL(`../server/${file}`, import.meta.url));
  console.log(`ok: ${modules.length} server modules import; protected brain/guard hashes unchanged; authorized place/creation adapters in planners; no-AI guard blocks queries`);

  const { localOwner } = await import('../server/local-owner.mjs');
  const ownerFile = path.join(process.env.ZANCUT_DATA, 'users.json');
  const existing = JSON.stringify({ users: [{ id: 'existing-owner', alias: 'local2d', email: 'local@zancut2d.app' }], preserved: { value: 7 } });
  fs.writeFileSync(ownerFile, existing);
  assert.equal(localOwner().id, 'existing-owner'); assert.equal(fs.readFileSync(ownerFile, 'utf8'), existing);
  fs.unlinkSync(ownerFile);
  const owner = localOwner(); assert.equal(localOwner().id, owner.id);
  const { speechHoles, levelsOf } = await import('../server/audio-analysis.mjs');
  assert.deepEqual(speechHoles(Array(80).fill(1e6))([{ s: 0, e: 0.5 }, { s: 3.5, e: 4 }], 0, 4), [[0.5, 3.5]]);

  const store = await import('../server/store.mjs'); agent = await import('../server/agent.mjs');
  const p = store.create({ name: 'Local cleanup regression', ownerId: owner.id, mode: 'faceless', language: 'en' });
  Object.assign(p, { kind: 'animation', format: '16:9', designStyle: '2d-animation', theme: 'light', aiVoice: false,
    assets: [{ file: 'voice.wav', role: 'voiceover', hasAudio: true, duration: 6 }],
    film: { music: false, cast: { person: { gender: 'male', age: 'adult', skin: 3, outfit: { type: 'shirt', color: '#3977ae' } } },
      shots: [{ at: 0, place: 'village_home', camera: { kind: 'wide' }, people: [{ who: 'person', x: 0, dz: 1, do: 'idle', gesture: false }] }] } });
  store.save(p, { immediate: true });
  const d = store.dirs(p.id);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'sine=frequency=440:sample_rate=16000', '-t', '6', path.join(d.assets, 'voice.wav')]);
  assert.equal(levelsOf(path.join(d.assets, 'voice.wav')).length, 120);
  const cache = path.join(d.ws, 'transcripts', 'plate-plate'); fs.mkdirSync(cache, { recursive: true });
  const oldTags = path.join(d.ws, 'job', 'work', 'GEMINI.json'); fs.mkdirSync(path.dirname(oldTags), { recursive: true });
  fs.writeFileSync(oldTags, JSON.stringify({ summary: 'stale Studio tags' }));
  const words = ['The', 'person', 'waits', 'at', 'home.'].map((text, i) => ({ text, start: i, end: i + 0.8 }));
  fs.writeFileSync(path.join(cache, 'transcript.json'), JSON.stringify(words));
  fs.writeFileSync(path.join(cache, 'meta.json'), JSON.stringify({ language: 'en', conf: 1, words: words.length, tags: null }));
  const job = (kind) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${kind} timed out`)), 180000);
    agent.setJobDone(result => { clearTimeout(timer); setImmediate(() => result.ok ? resolve() : reject(new Error(`${kind}: ${store.get(p.id)?.error}`))); });
    try { agent.enqueue(p.id, kind); } catch (error) { clearTimeout(timer); reject(error); }
  });
  await job('prepare'); assert.equal(p.transcript.words, words.length);
  assert.equal(fs.existsSync(oldTags), false); assert.equal(p.transcript.summary, '');
  await job('storyboard'); assert.equal(p.board.rows.length, 1);
  assert.match(fs.readFileSync(path.join(d.ws, 'job', 'edit', 'hf', 'index.html'), 'utf8'), /ZC\.place/, 'the storyboard preview contains completed cartoon scripts before rendering');
  { const cw = JSON.parse(fs.readFileSync(path.join(d.ws, 'job', 'work', 'captions.json'), 'utf8')), plan = JSON.parse(fs.readFileSync(path.join(d.ws, 'job', 'edit', 'plan.json'), 'utf8'));
    assert.deepEqual(cw.subtitles.flatMap((c) => c.words.map((w) => w.text)), words.map((w) => w.text), 'the caption writer chunked every word'); assert.equal(plan.captions.on, true); assert.equal(plan.captions.chunks.length, cw.subtitles.length);
    assert.ok(fs.existsSync(path.join(d.ws, 'job', 'work', 'physics.json')), 'physics corrections are written');
    const qa = JSON.parse(fs.readFileSync(path.join(d.ws, 'job', 'work', 'qa.json'), 'utf8')); assert.deepEqual(qa.remaining.filter((i) => i.severity === 'error'), [], 'the 12-rule QA leaves no error before rendering'); }
  await job('render'); assert.equal(p.versions.length, 1);
  const video = path.join(d.out, p.versions[0].file);
  const { checkVideo } = await import('../server/videoqa.mjs');
  const qa = checkVideo(video, { expectSeconds: 6, format: '16:9' });
  assert.equal(qa.ok, true, JSON.stringify(qa.issues));
  assert.equal(p.costUsd, 0);
  console.log(`ok: local owner retained; sound measurements; cached voice → prepare → storyboard → ${p.versions[0].duration.toFixed(2)} s MP4; video QA passed; cost $0`);

  const socket = net.createServer(); await new Promise(resolve => socket.listen(0, '127.0.0.1', resolve));
  const port = socket.address().port; await new Promise(resolve => socket.close(resolve));
  child = spawn(process.execPath, ['server/index.mjs'], { cwd: root, env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' }, stdio: ['ignore', 'pipe', 'pipe'] });
  let logs = ''; child.stdout.on('data', b => logs += b); child.stderr.on('data', b => logs += b);
  const base = `http://127.0.0.1:${port}`;
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { const response = await fetch(base + '/api/library'); if (response.ok) { ready = true; break; } } catch {}
    assert.equal(child.exitCode, null, logs);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.ok(ready, logs);
  const catalog = await (await fetch(base + '/api/library')).json(); assert.equal(catalog.counts.actions, 275);
  const projects = await (await fetch(base + '/api/projects')).json(); assert.equal(projects[0].id, p.id);
  const worker = await (await fetch(base + '/api/autopilot')).json(); assert.equal(worker.on, false);
  console.log('ok: index.mjs starts; library/project APIs respond; temporary Autopilot remains off');
} finally {
  if (child && child.exitCode === null) { child.kill('SIGTERM'); await new Promise(resolve => child.once('exit', resolve)); }
  agent?.shutdown();
  fs.rmSync(temp, { recursive: true, force: true });
}
