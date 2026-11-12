// Rebuild an existing local project in a temporary workspace, then compare to its original MP4.
// Does not edit the original project, retrain the brain, or call a speech/model service.
// node scripts/motion-benchmark.mjs <project-id> <before.mp4> <output-dir>
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from '../server/codefilm.mjs';
import { zen } from '../server/director.mjs';
import { measureMotion } from '../server/motionqa.mjs';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [id, beforeFile, outArg] = process.argv.slice(2);
if (!/^[a-z0-9]+$/.test(id || '') || !beforeFile) throw new Error('usage: node scripts/motion-benchmark.mjs <project-id> <before.mp4> <outdir>');
const source = path.join(root, 'data/projects', id), project = JSON.parse(fs.readFileSync(path.join(source, 'project.json'), 'utf8'));
if (!project.film) throw new Error('This project has no saved scene file.');
const out = path.resolve(outArg || path.join(os.tmpdir(), 'z2d-motion-benchmark')), ws = path.join(out, 'ws');
const resume = process.argv.includes('--resume');
if (fs.existsSync(ws) && !resume) throw new Error(`Use a new output directory: ${out}`);
fs.mkdirSync(out, { recursive: true });
if (!resume) fs.cpSync(path.join(source, 'ws'), ws, { recursive: true, dereference: true, filter: file => !/\/(exports|outputs|hf)(\/|$)|\/render\.mp4$/.test(file) });
const before = measureMotion(path.resolve(beforeFile)); fs.writeFileSync(path.join(out, 'before-motion.json'), JSON.stringify(before, null, 2));
console.log(`before: ${(before.stillShare * 100).toFixed(2)}% near-still; ${before.seconds.toFixed(2)} s; ${out}`);
process.env.npm_config_offline = 'true';
await build({ ws, assets: path.join(ws, 'assets') }, project, project.film, { step: console.log });
const result = await zen(ws, ['finish', 'v1']); if (!result.ok) throw new Error(result.error || JSON.stringify(result));
const video = path.join(out, 'after.mp4'); fs.copyFileSync(path.join(ws, 'exports/v1.mp4'), video);
const after = measureMotion(video), report = { project: id, beforeFile: path.resolve(beforeFile), afterFile: video, before, after, target: 0.08, passed: after.stillShare < 0.08 };
fs.writeFileSync(path.join(out, 'comparison.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`after: ${(after.stillShare * 100).toFixed(2)}% near-still; target <8%: ${report.passed ? 'PASS' : 'FAIL'}. ${video}`);
if (!report.passed) process.exitCode = 1;
