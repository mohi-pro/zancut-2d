// Autopilot: the app's own always-on worker. No AI model and no Claude: it drives the app's own pipeline and decides by rules and QA.
// Drop a folder into inbox/<name>/ with  script.txt  +  voice.(wav|mp3|m4a)  [+ film.json to skip planning] [+ format.txt: 16:9 | 9:16].
// It plans (own brain) → checks + repairs the storyboard (max 3 rounds) → renders → checks the MP4 → copies it to outbox/<name>.mp4.
// What it cannot decide (unfixable QA errors, a failed render twice) it stops on and writes the reason to inbox/<name>/result.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DATA_DIR, PORT } from './config.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), INBOX = path.join(ROOT, 'inbox'), OUTBOX = path.join(ROOT, 'outbox');
const CFG = path.join(DATA_DIR, 'autopilot.json'), LOG = path.join(DATA_DIR, 'autopilot.log');
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const log = (m) => { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.appendFileSync(LOG, `${new Date().toISOString()} ${m}\n`); };
const api = async (u, m = 'GET', b, raw) => { const r = await fetch(`http://127.0.0.1:${PORT}${u}`, { method: m, headers: { 'content-type': raw ? 'application/octet-stream' : 'application/json' }, body: raw ?? (b ? JSON.stringify(b) : undefined) }); const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || r.statusText); return j; };
export const state = () => ({ on: !!J(CFG, {}).on, inbox: INBOX, outbox: OUTBOX, busy: !!current, current, jobs: fs.existsSync(INBOX) ? fs.readdirSync(INBOX).filter((n) => fs.statSync(path.join(INBOX, n)).isDirectory()).map((n) => ({ name: n, ...J(path.join(INBOX, n, 'result.json'), { status: 'waiting' }) })) : [] });
export function set(on) { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(CFG, JSON.stringify({ on: !!on })); log(`autopilot ${on ? 'ON' : 'OFF'}`); return state(); }

let current = null, timer = null;
async function runOne(name) {
  const dir = path.join(INBOX, name), out = path.join(dir, 'result.json'), res = { status: 'running', startedAt: new Date().toISOString(), steps: [] }, save = () => fs.writeFileSync(out, JSON.stringify(res, null, 1)), step = (t) => { res.steps.push(t); log(`${name}: ${t}`); save(); };
  const stop = (status, why) => { res.status = status; res.reason = why; res.endedAt = new Date().toISOString(); save(); log(`${name}: ${status} — ${why}`); };
  try {
    const script = fs.existsSync(path.join(dir, 'script.txt')) ? fs.readFileSync(path.join(dir, 'script.txt'), 'utf8').trim() : '', voiceFile = fs.readdirSync(dir).find((f) => /^voice\.(wav|mp3|m4a|aac|ogg|flac)$/i.test(f)), film = J(path.join(dir, 'film.json'), null);
    if (!voiceFile) return stop('needs-owner', 'No voice file. Put voice.wav (or .mp3/.m4a) in this folder.');
    const format = fs.existsSync(path.join(dir, 'format.txt')) ? fs.readFileSync(path.join(dir, 'format.txt'), 'utf8').trim() : '16:9';
    const langFile = path.join(dir, 'lang.txt'), lang = fs.existsSync(langFile) ? fs.readFileSync(langFile, 'utf8').trim() : script ? (/[\u0980-\u09FF]/.test(script) ? 'bn' : 'en') : 'bn'; // a voice alone: Bangla unless lang.txt says otherwise
    let p = await api('/api/projects', 'POST', { name, language: lang, format }); res.project = p.id; step(`project ${p.id} (${format}, language ${lang})`);
    p = await api(`/api/projects/${p.id}/voice?name=${encodeURIComponent(voiceFile)}`, 'POST', undefined, fs.readFileSync(path.join(dir, voiceFile))); step(`voice ${Math.round(p.voice?.duration || 0)} s`);
    if (film) { await api(`/api/projects/${p.id}/film`, 'PUT', film); step('used film.json'); } else if (script) { p = await api(`/api/projects/${p.id}/plan`, 'POST', { script }); step(`planned by ${p.film.plan.mode}: ${p.film.shots.length} shots`); }
    else { await api(`/api/projects/${p.id}/plan`, 'POST', { script: '' }); step('no script: listening to the voice to plan from it'); const t0 = Date.now(); do { await new Promise((r) => setTimeout(r, 4000)); p = await api(`/api/projects/${p.id}`); } while (!p.film && p.stage !== 'failed' && Date.now() - t0 < 20 * 60000); if (!p.film) return stop('needs-owner', `Could not plan from the voice: ${p.error || 'timeout'}`); step(`planned from the voice by ${p.film.plan.mode}: ${p.film.shots.length} shots`); }
    for (let round = 1; round <= 3; round++) { // decide: errors are repaired (bounded), warnings are repaired once
      const iss = (await api(`/api/projects/${p.id}/qa`)).issues, errs = iss.filter((i) => i.severity === 'error');
      if (!errs.length) { step(round === 1 ? 'storyboard checks passed' : `storyboard repaired in ${round - 1} round(s)`); break; }
      if (round === 3) return stop('needs-owner', `Storyboard still has errors after 3 repairs: ${errs.map((i) => i.evidence).join(' | ')}`);
      const r = await api(`/api/projects/${p.id}/qa/repair`, 'POST'); step(`repair round ${round}: ${r.log.filter((x) => x.result === 'applied').length} fixed, ${r.remaining.length} left`);
    }
    for (let attempt = 1; attempt <= 2; attempt++) {
      await api(`/api/projects/${p.id}/make`, 'POST'); step(`render attempt ${attempt}`);
      const t0 = Date.now(); let q; do { await new Promise((r) => setTimeout(r, 4000)); q = await api(`/api/projects/${p.id}`); } while (!['done', 'failed'].includes(q.stage) && Date.now() - t0 < 40 * 60000);
      const v = q.versions.at(-1);
      if (q.stage === 'done' && v) {
        res.video = v.file; res.qa = v.qa; res.seconds = Math.round((Date.now() - t0) / 1000);
        if (v.qa && !v.qa.ok) return stop('needs-owner', `The film was made but its own checks failed: ${v.qa.issues.filter((i) => i.severity === 'error').map((i) => i.evidence).join(' | ')}`);
        fs.mkdirSync(OUTBOX, { recursive: true }); const dest = path.join(OUTBOX, `${name}.mp4`); const r = await fetch(`http://127.0.0.1:${PORT}/video/${p.id}/${v.file}`); fs.writeFileSync(dest, Buffer.from(await r.arrayBuffer())); res.output = dest;
        return stop('done', `film saved to outbox/${name}.mp4 (${res.seconds} s to render${v.qa?.issues?.length ? `, ${v.qa.issues.length} note(s) in qa` : ''})`);
      }
      step(`render attempt ${attempt} failed: ${q.error || q.stage}`);
    }
    stop('needs-owner', 'The render failed twice; see data/autopilot.log.');
  } catch (e) { stop('needs-owner', `Autopilot error: ${e.message}`); }
}
async function tick() {
  if (!state().on || current) return;
  const next = state().jobs.find((j) => j.status === 'waiting'); if (!next) return;
  current = next.name; try { await runOne(next.name); } finally { current = null; }
}
export function start() { fs.mkdirSync(INBOX, { recursive: true }); fs.mkdirSync(OUTBOX, { recursive: true }); clearInterval(timer); timer = setInterval(() => tick().catch((e) => log('tick error ' + e.message)), 10000); log('autopilot worker started (' + (state().on ? 'ON' : 'OFF') + ')'); }
