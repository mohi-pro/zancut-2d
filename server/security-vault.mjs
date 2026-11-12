// The brain vault: our trained weights and libraries as one authenticated, encrypted file (data/brain/brain.zancut.enc).
//   payload  — brain model + calibration, semantic clusters, names, learned props / creations / knowledge (gzip)
//   keys     — an owner master secret (data/hub/owner.key, 32 random bytes, mode 600; or PBKDF2-SHA256 of ZANCUT_OWNER_PASSPHRASE,
//              310,000 rounds) → HKDF-SHA256 per vault build (fresh salt): an AES-256-GCM key and a separate HMAC-SHA256 key
//   file     — "ZCV1" | u32 header length | header JSON (salt, iv, GCM tag, brain version, HMAC) | ciphertext
//              The HMAC covers magic + header (without the HMAC) + ciphertext and is checked BEFORE decrypting; GCM checks again.
//   clients  — never get the master. The hub hands an authenticated session the vault key wrapped for that session alone
//              (X25519 ECDH with the client's one-time key → HKDF → AES-256-GCM, the session id as associated data); the
//              client opens the vault in memory (openInMemory) and never writes plain weights to disk.
// What this does and does not do: it keeps weights out of distributed files and lets the owner stop future access (a suspended
// user gets no key and no updates). A device that HAS opened the vault holds the plain data in its own memory while it runs;
// no client-side scheme can make that impossible to extract for a determined attacker with the device.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { DATA_DIR, ENGINE_DIR } from './config.mjs';

const MAGIC = Buffer.from('ZCV1'), te = new TextEncoder();
export const vaultPaths = () => ({ vault: path.join(DATA_DIR, 'brain', 'brain.zancut.enc'), ownerKey: path.join(DATA_DIR, 'hub', 'owner.key') });
// the owner's master secret: from a passphrase (PBKDF2) or a random key file created once (readable by the owner only)
export function ownerMaster() {
  if (process.env.ZANCUT_OWNER_PASSPHRASE) return crypto.pbkdf2Sync(process.env.ZANCUT_OWNER_PASSPHRASE, 'zancut-owner-master-v1', 310_000, 32, 'sha256');
  const f = vaultPaths().ownerKey;
  if (!fs.existsSync(f)) { fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, crypto.randomBytes(32).toString('base64'), { mode: 0o600 }); }
  const k = Buffer.from(fs.readFileSync(f, 'utf8').trim(), 'base64'); if (k.length !== 32) throw new Error('data/hub/owner.key is damaged (expected 32 bytes)'); return k;
}
const hkdf = (key, salt, info, n = 32) => Buffer.from(crypto.hkdfSync('sha256', key, salt, te.encode(info), n));
export const vaultKeys = (master, salt) => ({ enc: hkdf(master, salt, 'zancut-vault-aes-256-gcm'), mac: hkdf(master, salt, 'zancut-vault-hmac-sha256') });
export const updatesKey = (master) => hkdf(master, Buffer.from('zancut-updates'), 'zancut-updates-aes-256-gcm-v1');

// what goes into the vault (plain files read here, on the owner's machine only)
export function collectPayload({ extra = {} } = {}) {
  const J = (f) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }, lib = path.join(ENGINE_DIR, 'cartoon', 'library');
  return { model: J(path.join(DATA_DIR, 'brain', 'model.json')), calibration: J(path.join(ENGINE_DIR, '..', 'brain', 'calibration.json')), clusters: J(path.join(lib, 'semantic-clusters.json')), names: J(path.join(lib, 'names.json')),
    learnedProps: J(path.join(lib, 'learned-props.json')), learnedCreations: J(path.join(DATA_DIR, 'brain', 'learned-creations.json')), learnedKnowledge: J(path.join(DATA_DIR, 'brain', 'learned-knowledge.json')), ...extra };
}
// seal: payload → vault bytes (+ the AES key, which the hub wraps for authenticated sessions)
export function seal(payload, { master = ownerMaster(), version = 1 } = {}) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12), { enc, mac } = vaultKeys(master, salt);
  const plain = zlib.gzipSync(Buffer.from(JSON.stringify(payload)), { level: 9 }), c = crypto.createCipheriv('aes-256-gcm', enc, iv); c.setAAD(MAGIC);
  const ct = Buffer.concat([c.update(plain), c.final()]), tag = c.getAuthTag();
  const head = { v: 1, alg: 'AES-256-GCM', kdf: 'HKDF-SHA256', mac: 'HMAC-SHA256', version, created: new Date().toISOString(), salt: salt.toString('base64'), iv: iv.toString('base64'), tag: tag.toString('base64') };
  const h0 = Buffer.from(JSON.stringify(head)), hm = crypto.createHmac('sha256', mac).update(MAGIC).update(h0).update(ct).digest('base64');
  const header = Buffer.from(JSON.stringify({ ...head, hmac: hm })), len = Buffer.alloc(4); len.writeUInt32BE(header.length);
  return { bytes: Buffer.concat([MAGIC, len, header, ct]), key: enc, macKey: mac, version };
}
export function readHeader(bytes) {
  const b = Buffer.from(bytes); if (b.length < 8 || !b.subarray(0, 4).equals(MAGIC)) throw new Error('not a Zancut vault');
  const n = b.readUInt32BE(4); if (n > 4096 || 8 + n > b.length) throw new Error('vault header is damaged');
  let head; try { head = JSON.parse(b.subarray(8, 8 + n).toString('utf8')); } catch { throw new Error('vault header is damaged'); }
  return { head, ct: b.subarray(8 + n) };
}
// open: with the AES key and the HMAC key (the hub holds both; a client receives them wrapped for its session) — memory only
export function openInMemory(bytes, { key, macKey }) {
  const { head, ct } = readHeader(bytes), { hmac, ...rest } = head;
  const want = crypto.createHmac('sha256', macKey).update(MAGIC).update(Buffer.from(JSON.stringify(rest))).update(ct).digest();
  const got = Buffer.from(String(hmac || ''), 'base64'); if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) throw new Error('vault integrity check failed (HMAC): tampered or wrong key');
  try { const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(head.iv, 'base64')); d.setAAD(MAGIC); d.setAuthTag(Buffer.from(head.tag, 'base64'));
    return { version: head.version, payload: JSON.parse(zlib.gunzipSync(Buffer.concat([d.update(ct), d.final()])).toString('utf8')) }; }
  catch { throw new Error('vault decryption failed (AES-GCM): tampered or wrong key'); }
}
// the owner's side: build and write the vault (atomic), returning its keys for the hub
export function lockBrain({ version = 1, extra = {}, file = vaultPaths().vault } = {}) {
  const master = ownerMaster(), payload = collectPayload({ extra }); if (!payload.model) throw new Error('no trained brain to lock: run npm run brain first');
  const s = seal(payload, { master, version }); fs.mkdirSync(path.dirname(file), { recursive: true }); const tmp = `${file}.${process.pid}.tmp`; fs.writeFileSync(tmp, s.bytes); fs.renameSync(tmp, file);
  return { file, version, bytes: s.bytes.length, key: s.key, macKey: s.macKey };
}
// the owner re-derives a built vault's keys from its salt (the hub never stores them)
export function keysFor(bytes, master = ownerMaster()) { const { head } = readHeader(bytes); return { ...vaultKeys(master, Buffer.from(head.salt, 'base64')), version: head.version }; }

// ---------- key wrapping for one session (X25519 + HKDF + AES-256-GCM) ----------
export function clientKeyPair() { const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519'); return { publicKey: publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), privateKey }; }
export function wrapFor(clientPublicKeyB64, secrets, sessionId) {
  let pub; try { pub = crypto.createPublicKey({ key: Buffer.from(String(clientPublicKeyB64), 'base64'), format: 'der', type: 'spki' }); } catch { throw new Error('a valid X25519 public key is required'); }
  if (pub.asymmetricKeyType !== 'x25519') throw new Error('a valid X25519 public key is required');
  const eph = crypto.generateKeyPairSync('x25519'), shared = crypto.diffieHellman({ privateKey: eph.privateKey, publicKey: pub }), k = hkdf(shared, Buffer.from(sessionId), 'zancut-session-wrap-v1'), iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', k, iv); c.setAAD(Buffer.from(sessionId)); const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(Object.fromEntries(Object.entries(secrets).map(([n, v]) => [n, Buffer.isBuffer(v) ? v.toString('base64') : v]))))), c.final()]);
  return { hubPublicKey: eph.publicKey.export({ type: 'spki', format: 'der' }).toString('base64'), iv: iv.toString('base64'), ct: ct.toString('base64'), tag: c.getAuthTag().toString('base64') };
}
export function unwrapWith(privateKey, wrapped, sessionId) {
  const pub = crypto.createPublicKey({ key: Buffer.from(wrapped.hubPublicKey, 'base64'), format: 'der', type: 'spki' }), shared = crypto.diffieHellman({ privateKey, publicKey: pub }), k = hkdf(shared, Buffer.from(sessionId), 'zancut-session-wrap-v1');
  const d = crypto.createDecipheriv('aes-256-gcm', k, Buffer.from(wrapped.iv, 'base64')); d.setAAD(Buffer.from(sessionId)); d.setAuthTag(Buffer.from(wrapped.tag, 'base64'));
  const o = JSON.parse(Buffer.concat([d.update(Buffer.from(wrapped.ct, 'base64')), d.final()]).toString('utf8')); return Object.fromEntries(Object.entries(o).map(([n, v]) => [n, typeof v === 'string' && n.endsWith('Key') ? Buffer.from(v, 'base64') : v]));
}
// small encrypted deltas for pull-updates (the updates key comes in the same wrapped bundle)
export function encryptDelta(obj, key) { const iv = crypto.randomBytes(12), c = crypto.createCipheriv('aes-256-gcm', key, iv), ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(obj))), c.final()]); return { iv: iv.toString('base64'), ct: ct.toString('base64'), tag: c.getAuthTag().toString('base64') }; }
export function decryptDelta(box, key) { const d = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(box.iv, 'base64')); d.setAuthTag(Buffer.from(box.tag, 'base64')); return JSON.parse(Buffer.concat([d.update(Buffer.from(box.ct, 'base64')), d.final()]).toString('utf8')); }
