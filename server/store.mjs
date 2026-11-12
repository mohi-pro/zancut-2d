// Projects live on disk as data/projects/<id>/project.json. Swap this file for a
// real database when Zancut moves to the cloud; nothing else touches the disk layout.
import fs from 'node:fs';
import path from 'node:path';
import { EventEmitter } from 'node:events';
import { customAlphabet } from 'nanoid';
import { DATA_DIR } from './config.mjs';

const newId = customAlphabet('abcdefghijkmnpqrstuvwxyz23456789', 10);
const PROJECTS = path.join(DATA_DIR, 'projects');
fs.mkdirSync(PROJECTS, { recursive: true });

export const events = new EventEmitter();
events.setMaxListeners(0);

const cache = new Map();

export function dirs(id) {
  const root = path.join(PROJECTS, id);
  const ws = path.join(root, 'ws');
  return {
    root,
    ws,                                  // the AI's working folder
    raw: path.join(ws, 'raw'),           // customer footage (never modified)
    brand: path.join(ws, 'brand'),       // logo
    assets: path.join(ws, 'assets'),     // voiceover, images, B-roll, music, reference files
    exports: path.join(ws, 'exports'),   // where the AI drops v<n>.mp4
    out: path.join(root, 'out'),         // finished versions served to the browser
  };
}

export function get(id) {
  if (!/^[a-z0-9]+$/.test(id)) return null;
  if (gone.has(id)) return null; // deleted (its folder may still be on its way out)
  if (cache.has(id)) return cache.get(id);
  const file = path.join(PROJECTS, id, 'project.json');
  if (!fs.existsSync(file)) return null;
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  // the Tutorial type is gone: its screen recordings are extra files of a Talking head (its raw video) or a Storytelling video
  if (p.kind === 'tutorial') { p.kind = p.screenVoice === 'video' && p.footage?.length ? 'talking' : 'faceless'; p.mode = p.kind === 'faceless' ? 'faceless' : 'face'; if (p.screenVoice === 'ai') p.aiVoice = true; }
  delete p.screenVoice;
  cache.set(id, p);
  return p;
}

export function list(filter = () => true) {
  return fs.readdirSync(PROJECTS)
    .map(get)
    .filter(Boolean)
    .filter(filter)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function create(fields) {
  const id = newId();
  const now = Date.now();
  const p = {
    id,
    ownerId: fields.ownerId || null,
    mode: fields.mode === 'faceless' ? 'faceless' : 'face',
    style: ['story', 'explainer'].includes(fields.style) ? fields.style : 'standard',
    inspiration: typeof fields.inspiration === 'string' ? fields.inspiration.slice(0, 60) : null,
    name: String(fields.name || 'Untitled video').slice(0, 80),
    type: fields.type === 'reel' ? 'reel' : 'youtube',
    theme: fields.theme === 'dark' ? 'dark' : 'light',
    voice: ['male', 'female'].includes(fields.voice) ? fields.voice : 'none', // no AI voiceover: the customer's own voice, or their uploaded voiceover
    colors: Array.isArray(fields.colors) ? fields.colors.filter((c) => /^#[0-9a-f]{6}$/i.test(c)).slice(0, 4) : [],
    font: /^[\w .-]{0,40}$/.test(fields.font || '') ? fields.font || '' : '',
    language: fields.language || 'auto',
    script: fields.script || '',
    prompt: fields.prompt || '',
    instructions: fields.instructions || '',
    footage: [],
    assets: [], // the customer's own materials: voiceover, images, B-roll clips, music, reference files
    logo: null,
    status: 'draft',
    job: null,
    error: null,
    sessionId: null,
    versions: [],
    comments: [],
    costUsd: 0,
    createdAt: now,
    updatedAt: now,
  };
  const d = dirs(id);
  for (const k of ['raw', 'brand', 'assets', 'exports', 'out']) fs.mkdirSync(d[k], { recursive: true });
  cache.set(id, p);
  save(p);
  return p;
}

let timers = new Map();
// Writes are cheap but the agent emits many steps a second; debounce the disk write,
// broadcast immediately.
export function save(p, { immediate = false } = {}) {
  if (gone.has(p.id)) return;
  p.updatedAt = Date.now();
  events.emit(`p:${p.id}`, p);
  const write = () => {
    timers.delete(p.id);
    const file = path.join(PROJECTS, p.id, 'project.json');
    fs.writeFileSync(file + '.tmp', JSON.stringify(p, null, 2));
    fs.renameSync(file + '.tmp', file);
  };
  clearTimeout(timers.get(p.id));
  if (immediate) write();
  else timers.set(p.id, setTimeout(write, 300));
}

// A deleted video may still have a job winding down (it was stopped a moment ago): its late saves must not bring the
// folder back or fail, so they are dropped.
const gone = new Set();
// A video's folder goes. On Windows a file still open (the job that was just stopped lets go of its files a moment later) makes
// the delete fail: it is tried again for a few seconds, then the folder is moved aside (.trash/) and emptied on the next start.
// Never throws: the video is gone for the customer either way.
export function remove(id) {
  gone.add(id); clearTimeout(timers.get(id)); timers.delete(id);
  cache.delete(id);
  const dir = path.join(PROJECTS, id);
  try { fs.rmSync(dir, { recursive: true, force: true, maxRetries: 10, retryDelay: 300 }); return; } catch (e) { console.error('[delete]', id, e.code || e.message); }
  try { const t = path.join(PROJECTS, '.trash'); fs.mkdirSync(t, { recursive: true }); fs.renameSync(dir, path.join(t, `${id}-${Date.now()}`)); } catch (e) { console.error('[delete] moving aside', id, e.code || e.message); }
}
// what a delete could not finish (moved aside, or a file that was still open), emptied at the start
export function emptyTrash() {
  const t = path.join(PROJECTS, '.trash');
  try { for (const f of fs.readdirSync(t)) fs.rmSync(path.join(t, f), { recursive: true, force: true, maxRetries: 3, retryDelay: 200 }); } catch {}
}

// After a restart nothing is running, so a project stuck mid-job can only be retried.
// Where a video rests between jobs: the furthest step it reached (Step 4 edit, Step 3 storyboard, Step 2 transcript, setup).
export const idleStatus = (p) => (p.versions?.length ? 'ready' : p.board ? 'board' : p.transcript ? 'script' : 'draft');

export function recoverInterrupted() {
  for (const p of list()) {
    if (['queued', 'editing', 'refining'].includes(p.status)) {
      p.status = idleStatus(p);
      p.error = 'The server restarted while the AI was working. Press retry to run it again.';
      p.job = null;
      save(p, { immediate: true });
    }
  }
}
