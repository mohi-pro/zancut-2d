// The owner's central hub (runs on our Express server; tokens are standard HS256 JWTs, so the same checks port to a Worker).
//   users     data/hub/users.json — status active | suspended, deviceLimit, expiresAt, scrypt password hash, token version.
//             Suspending a user bumps their token version: every session they hold stops working at once (no key, no updates).
//   sessions  login → a JWT (12 h) + a per-session signing key. The vault key is only ever handed out wrapped for one session.
//   learning  a client's tiny signed delta (≤ 5 KB: a rule, a feedback example, a learned word or prop) goes to
//             data/hub/quarantine-queue.jsonl, scored by our own checks (the rule parser, physics-logic sizes, the QA rules, the SVG
//             sanitiser and licence list). It reaches nobody until the OWNER approves it — or, if the owner's policy allows,
//             enough different users sent the same thing and it scored well (consensus).
//   approval  merges it into the global brain (the hub's own model / knowledge / props), bumps the global version, re-locks the
//             vault, and serves the delta, encrypted, to active authenticated clients (pull-updates).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { DATA_DIR } from './config.mjs';
import { ownerMaster, lockBrain, keysFor, vaultPaths, wrapFor, updatesKey, encryptDelta } from './security-vault.mjs';

const te = new TextEncoder(), MAX_DELTA = 5120, TOKEN_TTL = 12 * 3600;
const P = () => { const d = path.join(DATA_DIR, 'hub'); return { dir: d, users: path.join(d, 'users.json'), owner: path.join(d, 'owner.json'), queue: path.join(d, 'quarantine-queue.jsonl'), updates: path.join(d, 'global-updates.jsonl'), state: path.join(d, 'state.json'), policy: path.join(d, 'policy.json') }; };
const J = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { if (e.code === 'ENOENT') return d; throw e; } };
const W = (f, v) => { fs.mkdirSync(path.dirname(f), { recursive: true }); const t = `${f}.${process.pid}.tmp`; fs.writeFileSync(t, JSON.stringify(v, null, 1), { mode: 0o600 }); fs.renameSync(t, f); };
const lines = (f) => { try { return fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); } catch { return []; } };
const fail = (status, message) => Object.assign(new Error(message), { status });
const b64u = (b) => Buffer.from(b).toString('base64url');
const canonical = (x) => (Array.isArray(x) ? `[${x.map(canonical).join(',')}]` : x && typeof x === 'object' ? `{${Object.keys(x).sort().map((k) => `${JSON.stringify(k)}:${canonical(x[k])}`).join(',')}}` : JSON.stringify(x));
const secret = (info) => Buffer.from(crypto.hkdfSync('sha256', ownerMaster(), Buffer.from('zancut-hub'), te.encode(info), 32));
const hashPass = (pw, salt = crypto.randomBytes(16)) => ({ salt: salt.toString('base64'), hash: crypto.scryptSync(String(pw), salt, 32).toString('base64') });
const passOk = (pw, rec) => { if (!rec?.salt) return false; const a = Buffer.from(hashPass(pw, Buffer.from(rec.salt, 'base64')).hash, 'base64'), b = Buffer.from(rec.hash, 'base64'); return a.length === b.length && crypto.timingSafeEqual(a, b); };
export const policy = () => ({ consensusThreshold: 3, autoApproveConsensus: true, minScore: 0.8, ...J(P().policy, {}) });
export const setPolicy = (p) => W(P().policy, { ...policy(), ...p });
const users = () => J(P().users, { users: {} }), saveUsers = (u) => W(P().users, u);
const state = () => J(P().state, { version: 0 });

// ---------- tokens (HS256 only; "none" and every other alg are refused) ----------
function sign(claims) { const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' })), p = b64u(JSON.stringify(claims)), s = crypto.createHmac('sha256', secret('jwt')).update(`${h}.${p}`).digest(); return `${h}.${p}.${b64u(s)}`; }
export function verify(token, { role = 'user' } = {}) {
  const parts = String(token || '').replace(/^Bearer\s+/i, '').split('.'); if (parts.length !== 3) throw fail(401, 'sign in first');
  let h, c; try { h = JSON.parse(Buffer.from(parts[0], 'base64url')); c = JSON.parse(Buffer.from(parts[1], 'base64url')); } catch { throw fail(401, 'invalid token'); }
  if (h.alg !== 'HS256') throw fail(401, 'invalid token');
  const want = crypto.createHmac('sha256', secret('jwt')).update(`${parts[0]}.${parts[1]}`).digest(), got = Buffer.from(parts[2], 'base64url');
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) throw fail(401, 'invalid token');
  if (!(c.exp > Date.now() / 1000)) throw fail(401, 'session expired: sign in again');
  if (role === 'owner') { if (c.role !== 'owner') throw fail(403, 'only the owner can do this'); return c; }
  if (c.role !== 'user') throw fail(403, 'not a customer session');
  const u = users().users[c.sub]; if (!u) throw fail(401, 'unknown user');
  if (u.status !== 'active') throw fail(403, 'this account is suspended');
  if (u.expiresAt && Date.parse(u.expiresAt) < Date.now()) throw fail(403, 'this account has expired');
  if ((u.tokenVersion || 0) !== c.ver) throw fail(401, 'this session was revoked');
  if (!u.devices?.includes(c.dev)) throw fail(403, 'this device is not registered');
  return c;
}
const sessionKey = (jti) => Buffer.from(crypto.hkdfSync('sha256', secret('session'), Buffer.from(jti), te.encode('zancut-delta-signing'), 32));

// ---------- the owner ----------
export function setOwnerPassword(pw) { if (String(pw).length < 10) throw fail(400, 'use at least 10 characters'); W(P().owner, { pass: hashPass(pw), at: new Date().toISOString() }); }
export function ownerLogin(pw) { const o = J(P().owner, null); if (!o || !passOk(pw, o.pass)) throw fail(401, 'wrong owner password'); return { token: sign({ role: 'owner', sub: 'owner', iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + TOKEN_TTL, jti: crypto.randomUUID() }) }; }
export function createUser(ownerToken, { id, password, deviceLimit = 2, expiresAt = null, name = '' }) {
  verify(ownerToken, { role: 'owner' }); if (!/^[a-z0-9_.-]{3,40}$/i.test(String(id))) throw fail(400, 'user id: 3–40 letters, digits, _ . -'); if (String(password).length < 8) throw fail(400, 'password: at least 8 characters');
  const u = users(); if (u.users[id]) throw fail(409, 'that user exists'); u.users[id] = { id, name, pass: hashPass(password), status: 'active', deviceLimit: Math.max(1, Math.min(10, +deviceLimit || 2)), expiresAt, devices: [], tokenVersion: 0, createdAt: new Date().toISOString() }; saveUsers(u); return publicUser(u.users[id]);
}
export function setUser(ownerToken, id, patch) {
  verify(ownerToken, { role: 'owner' }); const u = users(), x = u.users[id]; if (!x) throw fail(404, 'no such user');
  if (patch.status && !['active', 'suspended'].includes(patch.status)) throw fail(400, 'status is active or suspended');
  if (patch.status === 'suspended' && x.status !== 'suspended') x.tokenVersion = (x.tokenVersion || 0) + 1; // the kill switch: every live session is revoked now
  for (const k of ['status', 'deviceLimit', 'expiresAt', 'name']) if (k in patch) x[k] = patch[k];
  if (patch.resetDevices) { x.devices = []; x.tokenVersion = (x.tokenVersion || 0) + 1; }
  saveUsers(u); return publicUser(x);
}
const publicUser = ({ pass, ...x }) => x;
export const listUsers = (ownerToken) => { verify(ownerToken, { role: 'owner' }); return Object.values(users().users).map(publicUser); };

// ---------- customers ----------
const attempts = new Map();
export function login({ id, password, deviceId }) {
  const a = attempts.get(id) || []; const recent = a.filter((t) => Date.now() - t < 60_000); if (recent.length >= 5) throw fail(429, 'too many attempts: wait a minute');
  const u = users(), x = u.users[id]; if (!x || !passOk(password, x.pass)) { attempts.set(id, [...recent, Date.now()]); throw fail(401, 'wrong user or password'); }
  if (x.status !== 'active') throw fail(403, 'this account is suspended');
  if (x.expiresAt && Date.parse(x.expiresAt) < Date.now()) throw fail(403, 'this account has expired');
  if (!/^[\w.-]{6,80}$/.test(String(deviceId))) throw fail(400, 'a device id is required');
  if (!x.devices.includes(deviceId)) { if (x.devices.length >= x.deviceLimit) throw fail(403, `device limit reached (${x.deviceLimit})`); x.devices.push(deviceId); saveUsers(u); }
  const jti = crypto.randomUUID(), now = Math.floor(Date.now() / 1000);
  return { token: sign({ role: 'user', sub: id, dev: deviceId, ver: x.tokenVersion || 0, iat: now, exp: now + TOKEN_TTL, jti }), sessionKey: sessionKey(jti).toString('base64'), version: state().version };
}
// the vault keys, wrapped for this session only (the client sends a one-time X25519 public key)
export function vaultKey(token, clientPublicKey) {
  const c = verify(token), f = vaultPaths().vault; if (!fs.existsSync(f)) throw fail(503, 'the brain is not locked yet: run npm run lock-brain');
  const k = keysFor(fs.readFileSync(f)); return { version: k.version, wrapped: wrapFor(clientPublicKey, { encKey: k.enc, macKey: k.mac, updatesKey: updatesKey(ownerMaster()) }, c.jti) };
}
export const signDelta = (delta, sessionKeyB64) => crypto.createHmac('sha256', Buffer.from(sessionKeyB64, 'base64')).update(canonical(delta)).digest('hex');

// ---------- the quarantine ----------
export async function scoreLearning(delta) {
  const reasons = []; let s = 1;
  const { HEADS, parseRule } = await import('./brain.mjs'), { ZPHYS } = await import('./physics.mjs'), { check } = await import('./qa.mjs'), { CATEGORIES, sanitizeSvg } = await import('./web-learner.mjs');
  const qaOf = (labels) => { const film = { cast: { a: { gender: 'female', age: 'adult' } }, shots: [{ at: 0, place: labels.place && labels.place !== 'none' ? labels.place : 'park', people: [{ who: 'a', x: 0, dz: 1, do: HEADS.action.includes(labels.action) ? labels.action : 'idle' }], ...(labels.broll && labels.broll !== 'none' && labels.broll !== 'compose_custom_recipe' ? { broll: { mode: 'pip_corner', template: labels.broll } } : {}) }] };
    const errs = check(film, { duration: 3 }).filter((i) => i.severity === 'error'); if (errs.length) { s -= 0.5; reasons.push(...errs.map((e) => `QA: ${e.evidence}`)); } };
  if (delta.type === 'rule') { try { const r = parseRule(delta.text); if (r.problems.length) { s -= 0.3; reasons.push(...r.problems); } qaOf(r.labels); } catch (e) { s = 0; reasons.push(e.message); } }
  else if (delta.type === 'feedback') { const e = delta.example || {}; if (!e.text || String(e.text).length > 300) { s = 0; reasons.push('an example needs a sentence (≤ 300 characters)'); }
    for (const h of Object.keys(HEADS)) if (e[h] != null && !HEADS[h].includes(e[h])) { s -= 0.5; reasons.push(`${h} "${e[h]}" is not a known label`); } qaOf(e); }
  else if (delta.type === 'word') { const c = delta.concept || {}; if (!c.term || !CATEGORIES.includes(c.category)) { s = 0; reasons.push('a word needs a term and one of the categories'); }
    const m = c.properties?.metres?.usual; if (m != null && !(m > 0 && m < 50)) { s -= 0.5; reasons.push(`a real size of ${m} m is not believable`); } if (c.properties?.zone && !ZPHYS.ZONES[c.properties.zone]) { s -= 0.3; reasons.push(`zone ${c.properties.zone} is not a support zone`); } }
  else if (delta.type === 'prop') { const p = delta.prop || {};
    if (!/^learned[A-Z]\w{1,40}$/.test(String(p.id))) { s = 0; reasons.push('a prop id is learnedSomething'); }
    try { const clean = sanitizeSvg(`<svg viewBox="${p.viewBox}">${p.body}</svg>`, p.id).body; if (!clean.includes('<path') && !clean.includes('<circle') && !clean.includes('<rect')) { s -= 0.5; reasons.push('the prop draws nothing'); } if (/script|on\w+=|javascript:|href=/i.test(String(p.body))) { s = 0; reasons.push('unsafe SVG'); } } catch (e) { s = 0; reasons.push(`SVG: ${e.message}`); }
    if (!['MIT', 'Apache-2.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'ISC'].includes(p.source?.license)) { s -= 0.5; reasons.push(`licence ${p.source?.license || 'unknown'} is not on the allowed list`); }
    const m = p.metres?.usual; if (m != null) { const sane = ZPHYS.saneMetres(null, m, undefined, p.metres?.cls || 'hand_prop'); if (Math.abs(sane - m) > 0.01 && !(m > 0 && m < 12)) { s -= 0.5; reasons.push(`a real size of ${m} m is not believable`); } } }
  else { s = 0; reasons.push('unknown learning type (rule, feedback, word, prop)'); }
  return { score: Math.max(0, Math.round(s * 100) / 100), reasons };
}
const fingerprint = (delta) => crypto.createHash('sha256').update(canonical(delta)).digest('hex').slice(0, 24);
export async function submitLearning(token, delta, signature) {
  const c = verify(token), raw = canonical(delta);
  if (Buffer.byteLength(raw) > MAX_DELTA) throw fail(413, `a learning delta is at most ${MAX_DELTA} bytes`);
  const want = Buffer.from(signDelta(delta, sessionKey(c.jti).toString('base64')), 'hex'), got = Buffer.from(String(signature || ''), 'hex');
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) throw fail(401, 'the delta signature does not match this session');
  const { score, reasons } = await scoreLearning(delta), fp = fingerprint(delta), q = lines(P().queue);
  const same = q.find((x) => x.fp === fp && x.status === 'pending');
  let item;
  if (same) { if (!same.from.includes(c.sub)) same.from.push(c.sub); item = same; fs.writeFileSync(P().queue, q.map((x) => JSON.stringify(x)).join('\n') + '\n'); }
  else { item = { id: crypto.randomUUID(), fp, delta, from: [c.sub], score, reasons, status: 'pending', at: new Date().toISOString() }; fs.mkdirSync(P().dir, { recursive: true }); fs.appendFileSync(P().queue, JSON.stringify(item) + '\n'); }
  const pol = policy();
  if (pol.autoApproveConsensus && item.from.length >= pol.consensusThreshold && item.score >= pol.minScore) return { ...(await merge(item.id, 'consensus')), consensus: true };
  return { id: item.id, status: item.status, score: item.score, reasons: item.reasons, supporters: item.from.length };
}
export const queue = (ownerToken, { status } = {}) => { verify(ownerToken, { role: 'owner' }); return lines(P().queue).filter((x) => !status || x.status === status); };
export async function approve(ownerToken, id, { force = false } = {}) { verify(ownerToken, { role: 'owner' }); return merge(id, 'owner', { force }); }
export function reject(ownerToken, id, why = '') { verify(ownerToken, { role: 'owner' }); const q = lines(P().queue), x = q.find((y) => y.id === id); if (!x) throw fail(404, 'no such item'); if (x.status !== 'pending') throw fail(409, `already ${x.status}`); Object.assign(x, { status: 'rejected', why, decidedAt: new Date().toISOString() }); fs.writeFileSync(P().queue, q.map((y) => JSON.stringify(y)).join('\n') + '\n'); return x; }
// approved → into the global brain → version + 1 → vault re-locked → served to clients
async function merge(id, by, { force = false } = {}) {
  const q = lines(P().queue), x = q.find((y) => y.id === id); if (!x) throw fail(404, 'no such item'); if (x.status !== 'pending') throw fail(409, `already ${x.status}`);
  if (x.score < policy().minScore && !force) throw fail(422, `this learning scored ${x.score} (${x.reasons.join('; ')}): reject it, or approve with force`);
  const d = x.delta, B = await import('./brain.mjs');
  if (d.type === 'rule') B.learnRule(d.text);
  else if (d.type === 'feedback') { if (!B.load()) B.trainFull(); B.learnMany([d.example]); }
  else if (d.type === 'word') { const f = path.join(DATA_DIR, 'brain', 'learned-knowledge.json'), k = J(f, { version: 1, concepts: {} }); k.concepts[String(d.concept.term).toLowerCase()] = { ...d.concept, from: 'hub' }; W(f, k); }
  else if (d.type === 'prop') { const { ENGINE_DIR } = await import('./config.mjs'), f = path.join(ENGINE_DIR, 'cartoon', 'library', 'learned-props.json'), lib = J(f, { props: {} }); lib.props[d.prop.id] = { ...d.prop, approvedAt: new Date().toISOString() }; W(f, lib); }
  const version = state().version + 1; W(P().state, { version, at: new Date().toISOString() });
  fs.appendFileSync(P().updates, JSON.stringify({ version, delta: d, approvedBy: by, at: new Date().toISOString() }) + '\n');
  Object.assign(x, { status: 'approved', approvedBy: by, version, decidedAt: new Date().toISOString() }); fs.writeFileSync(P().queue, q.map((y) => JSON.stringify(y)).join('\n') + '\n');
  lockBrain({ version }); // the vault is re-encrypted with the merged brain (a fresh salt: new keys)
  return { id, status: 'approved', version, approvedBy: by };
}
// what changed since a client's version, each update encrypted with the updates key (which only an authenticated session receives)
export function pullUpdates(token, since = 0) {
  verify(token); const k = updatesKey(ownerMaster()), all = lines(P().updates).filter((u) => u.version > (+since || 0));
  return { version: state().version, updates: all.map((u) => ({ version: u.version, box: encryptDelta({ version: u.version, delta: u.delta }, k) })) };
}

// the measured numbers from docs/MODEL_EVAL.md (Top-1 · Top-2 per head on the three test sets)
function modelEval() {
  let md = ''; try { md = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'docs', 'MODEL_EVAL.md'), 'utf8'); } catch { return null; }
  const rows = [...md.matchAll(/^\| (place|action[^|]*|face|roles[^|]*|broll|graphic|cameraMove) \| ([^|]*) \| ([^|]*) \| ([^|]*) \|/gm)].map((m) => ({ head: m[1].split(' ')[0], generated: m[2].trim(), real: m[3].trim(), holdout: m[4].trim() }));
  return { rows, run: (md.match(/Last run: ([^.\n]+)/) || [])[1] || null };
}
// ---------- the HTTP face (mounted at /api/hub by server/index.mjs) ----------
export function hubRouter() {
  const r = express.Router(), json = express.json({ limit: '8kb' }), auth = (req) => req.get('authorization');
  const h = (fn) => async (req, res) => { try { res.json(await fn(req)); } catch (e) { res.status(e.status || (e.type === 'entity.too.large' ? 413 : 500)).json({ error: e.status ? e.message : 'hub error' }); if (!e.status) console.error('hub:', e); } };
  r.post('/owner/login', json, h((q) => ownerLogin(q.body?.password)));
  r.post('/login', json, h((q) => login(q.body || {})));
  r.post('/vault-key', json, h((q) => vaultKey(auth(q), q.body?.publicKey)));
  r.get('/vault', (req, res) => { try { verify(auth(req)); const f = vaultPaths().vault; if (!fs.existsSync(f)) return res.status(503).json({ error: 'not locked yet' }); res.type('application/octet-stream').send(fs.readFileSync(f)); } catch (e) { res.status(e.status || 500).json({ error: e.message }); } });
  r.post('/submit-learning', json, h((q) => submitLearning(auth(q), q.body?.delta, q.body?.signature)));
  r.get('/pull-updates', h((q) => pullUpdates(auth(q), q.query.since)));
  r.get('/queue', h((q) => queue(auth(q), { status: q.query.status })));
  r.post('/approve', json, h((q) => approve(auth(q), q.body?.id, { force: q.body?.force === true })));
  r.post('/reject', json, h((q) => reject(auth(q), q.body?.id, q.body?.why)));
  r.get('/users', h((q) => listUsers(auth(q))));
  r.post('/users', json, h((q) => createUser(auth(q), q.body || {})));
  r.post('/users/:id', json, h((q) => setUser(auth(q), q.params.id, q.body || {})));
  // the vault's state and the brain's measured accuracy (docs/MODEL_EVAL.md), and the owner's "Lock & Encrypt" button
  r.get('/status', h(async (q) => { verify(auth(q), { role: 'owner' }); const f = vaultPaths().vault, { brainInfo } = await import('./brainplan.mjs'), { readHeader } = await import('./security-vault.mjs');
    const vault = fs.existsSync(f) ? (() => { const hd = readHeader(fs.readFileSync(f)).head; return { exists: true, bytes: fs.statSync(f).size, version: hd.version, created: hd.created, alg: `${hd.alg} + ${hd.mac}` }; })() : { exists: false };
    return { version: state().version, vault, brain: brainInfo(), eval: modelEval(), queue: { pending: lines(P().queue).filter((x) => x.status === 'pending').length } }; }));
  r.post('/lock', h((q) => { verify(auth(q), { role: 'owner' }); const v = lockBrain({ version: Math.max(1, state().version) }); return { version: v.version, bytes: v.bytes }; }));
  r.get('/policy', h((q) => { verify(auth(q), { role: 'owner' }); return policy(); }));
  r.post('/policy', json, h((q) => { verify(auth(q), { role: 'owner' }); setPolicy({ consensusThreshold: Math.max(2, +q.body?.consensusThreshold || 3), autoApproveConsensus: q.body?.autoApproveConsensus !== false, minScore: Math.min(1, Math.max(0.5, +q.body?.minScore || 0.8)) }); return policy(); }));
  return r;
}
