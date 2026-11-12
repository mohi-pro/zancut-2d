// Step 10: the brain vault (server/security-vault.mjs), npm run lock-brain, and the owner's hub (server/central-hub.mjs) over real HTTP.
//   tampered / wrong-key / truncated vaults never open; unauthenticated, forged and expired clients get no key; the key is wrapped for
//   one session only; the device limit holds; a suspended user is blocked at once (old sessions stay revoked after reactivation);
//   Customer 1's learning stays in quarantine until the owner approves it, and only then reaches Customer 2 (encrypted);
//   low-scoring learnings are refused; consensus (3 different users) can approve on the owner's policy. Temporary data only.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import net from "node:net";
import crypto from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
const root = path.resolve(new URL("..", import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), "z2d-hub-"));
process.env.ZANCUT_DATA = path.join(temp, "data"); process.env.ZANCUT_DIST = path.join(temp, "dist"); delete process.env.ZANCUT_OWNER_PASSPHRASE;
fs.mkdirSync(path.join(temp, "data/brain"), { recursive: true }); fs.copyFileSync(path.join(root, "data/brain/model.json"), path.join(temp, "data/brain/model.json"));
const V = await import("../server/security-vault.mjs"), H = await import("../server/central-hub.mjs");
let app;
try {
  // ---------- the vault and the distribution ----------
  const out = execFileSync(process.execPath, [path.join(root, "scripts/lock-brain.mjs")], { encoding: "utf8", env: process.env }); assert.match(out, /no plain weights shipped/);
  const vault = fs.readFileSync(path.join(temp, "data/brain/brain.zancut.enc")), dist = path.join(temp, "dist/client");
  assert.deepEqual(fs.readdirSync(dist).sort(), ["brain.zancut.enc", "manifest.json", "zancut-engine.min.js"]);
  for (const needle of ['"heads"', "#CONCEPT_", '"clusters"', "semantic"]) assert.ok(!vault.includes(needle), `no plain "${needle}" in the vault`);
  assert.ok(fs.statSync(path.join(temp, "data/hub/owner.key")).mode % 0o1000 === 0o600, "the owner key is readable by the owner only");
  const keys = V.keysFor(vault), opened = V.openInMemory(vault, { key: keys.enc, macKey: keys.mac });
  assert.ok(opened.payload.model?.heads?.place && opened.payload.clusters?.clusters?.length >= 60, "the owner opens the vault in memory: model + clusters");
  const flip = (b, at) => { const c = Buffer.from(b); c[at] ^= 1; return c; }, hdrEnd = 8 + vault.readUInt32BE(4);
  assert.throws(() => V.openInMemory(flip(vault, vault.length - 5), { key: keys.enc, macKey: keys.mac }), /HMAC/, "a flipped ciphertext bit is caught");
  assert.throws(() => V.openInMemory(Buffer.concat([vault.subarray(0, 8), Buffer.from(vault.subarray(8, hdrEnd).toString().replace('"version":', '"version":9')), vault.subarray(hdrEnd)]), { key: keys.enc, macKey: keys.mac }), /damaged|HMAC/, "an edited header is caught");
  assert.throws(() => V.openInMemory(vault.subarray(0, vault.length - 40), { key: keys.enc, macKey: keys.mac }), /HMAC/, "a truncated vault is caught");
  { const other = V.vaultKeys(crypto.randomBytes(32), Buffer.from(V.readHeader(vault).head.salt, "base64")); assert.throws(() => V.openInMemory(vault, { key: other.enc, macKey: other.mac }), /HMAC/, "another master key cannot open it"); }
  assert.throws(() => V.openInMemory(vault, { key: keys.enc, macKey: crypto.randomBytes(32) }), /HMAC/, "the right AES key without the HMAC key is refused");
  assert.throws(() => V.openInMemory(Buffer.from("ZCV1garbage"), { key: keys.enc, macKey: keys.mac }), /damaged|vault/);
  console.log(`ok: vault ${(vault.length / 1024).toFixed(0)} KB (AES-256-GCM + HMAC-SHA256, keys by HKDF from a 600-mode owner key); opens only in memory with both keys; tampered, edited, truncated, wrong-key → refused; dist/ ships no plain weights`);

  // ---------- the hub over HTTP ----------
  H.setOwnerPassword("owner-secret-123");
  const socket = net.createServer(); await new Promise((r) => socket.listen(0, "127.0.0.1", r)); const port = socket.address().port; await new Promise((r) => socket.close(r));
  app = spawn(process.execPath, ["server/index.mjs"], { cwd: root, env: { ...process.env, PORT: String(port) }, stdio: ["ignore", "pipe", "pipe"] }); let logs = ""; app.stdout.on("data", (b) => (logs += b)); app.stderr.on("data", (b) => (logs += b));
  const base = `http://127.0.0.1:${port}/api/hub`; for (let i = 0; i < 150; i++) { try { if ((await fetch(base + "/pull-updates")).status) break; } catch {} await new Promise((r) => setTimeout(r, 100)); }
  const call = async (p, { body, token, method } = {}) => { const r = await fetch(base + p, { method: method || (body ? "POST" : "GET"), headers: { "content-type": "application/json", ...(token ? { authorization: "Bearer " + token } : {}) }, body: body ? JSON.stringify(body) : undefined }); const t = r.headers.get("content-type")?.includes("json") ? await r.json() : Buffer.from(await r.arrayBuffer()); return { status: r.status, body: t }; };
  { const page = await fetch(`http://127.0.0.1:${port}/hub.html`); assert.equal(page.status, 200); const html = await page.text(); assert.ok(html.includes("Approve to Global Brain") && html.includes("/api/hub"), "the owner page is served"); }
  assert.equal((await call("/owner/login", { body: { password: "wrong" } })).status, 401);
  const owner = (await call("/owner/login", { body: { password: "owner-secret-123" } })).body.token;
  for (const [id, lim] of [["customer1", 2], ["customer2", 2], ["customer3", 1]]) assert.equal((await call("/users", { token: owner, body: { id, password: "pass-" + id, deviceLimit: lim } })).status, 200);
  const signIn = async (id, dev) => (await call("/login", { body: { id, password: "pass-" + id, deviceId: dev } })).body;
  const c1 = await signIn("customer1", "phone-aaa111"), c2 = await signIn("customer2", "laptop-bbb222"), c3 = await signIn("customer3", "tab-ccc333");
  assert.ok(c1.token && c1.sessionKey && c2.token);
  // unauthenticated, forged, wrong role
  const kp = V.clientKeyPair();
  assert.equal((await call("/vault-key", { body: { publicKey: kp.publicKey } })).status, 401, "no token, no key");
  assert.equal((await call("/vault")).status, 401, "no token, no vault file");
  const [h, p] = c1.token.split("."), none = `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")}.${p}.`;
  assert.equal((await call("/vault-key", { token: none, body: { publicKey: kp.publicKey } })).status, 401, 'alg "none" is refused');
  const forged = `${h}.${Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(p, "base64url")), sub: "customer2" })).toString("base64url")}.${c1.token.split(".")[2]}`;
  assert.equal((await call("/vault-key", { token: forged, body: { publicKey: kp.publicKey } })).status, 401, "an edited token is refused");
  assert.equal((await call("/queue", { token: c1.token })).status, 403, "a customer cannot read the queue");
  assert.equal((await signIn("customer3", "phone-ddd444")).error, "device limit reached (1)", "the device limit holds");
  // the key, wrapped for one session
  const wk = await call("/vault-key", { token: c1.token, body: { publicKey: kp.publicKey } }); assert.equal(wk.status, 200);
  const jti1 = JSON.parse(Buffer.from(c1.token.split(".")[1], "base64url")).jti, k1 = V.unwrapWith(kp.privateKey, wk.body.wrapped, jti1);
  const file = (await call("/vault", { token: c1.token })).body, mine = V.openInMemory(file, { key: k1.encKey, macKey: k1.macKey }); assert.ok(mine.payload.model.heads.place, "customer 1 opens the vault in memory");
  assert.throws(() => V.unwrapWith(V.clientKeyPair().privateKey, wk.body.wrapped, jti1), "another device's key cannot unwrap it");
  assert.throws(() => V.unwrapWith(kp.privateKey, wk.body.wrapped, "another-session"), "it is bound to this session");
  console.log("ok: owner and customer sign-in; no token / alg none / edited token → 401; customers cannot read the queue; device limit; the vault key is wrapped for one session and device");

  // ---------- quarantine: customer 1 learns, customer 2 gets it only after the owner approves ----------
  const rule = "যখন স্ক্রিপ্টে শেয়ার বাজারের কথা থাকবে তখন place হবে office_room আর graphic হবে dynamic_comparison_chart", delta = { type: "rule", text: rule };
  assert.equal((await call("/submit-learning", { token: c1.token, body: { delta, signature: "00".repeat(32) } })).status, 401, "a wrong signature is refused");
  assert.equal((await call("/submit-learning", { token: c1.token, body: { delta: { type: "rule", text: "x".repeat(6000) }, signature: H.signDelta({ type: "rule", text: "x".repeat(6000) }, c1.sessionKey) } })).status, 413, "over 5 KB is refused");
  const sub = await call("/submit-learning", { token: c1.token, body: { delta, signature: H.signDelta(delta, c1.sessionKey) } });
  assert.equal(sub.status, 200); assert.equal(sub.body.status, "pending"); assert.equal(sub.body.score, 1, `the rule scores well: ${JSON.stringify(sub.body.reasons)}`);
  assert.deepEqual((await call("/pull-updates?since=0", { token: c2.token })).body, { version: 0, updates: [] }, "customer 2 sees nothing while it is in quarantine");
  assert.ok(fs.readFileSync(path.join(temp, "data/hub/quarantine-queue.jsonl"), "utf8").includes("শেয়ার বাজার"), "it sits in quarantine-queue.jsonl");
  assert.equal((await call("/approve", { token: c2.token, body: { id: sub.body.id } })).status, 403, "a customer cannot approve");
  const vaultBefore = fs.readFileSync(path.join(temp, "data/brain/brain.zancut.enc"));
  const ap = await call("/approve", { token: owner, body: { id: sub.body.id } }); assert.equal(ap.status, 200, JSON.stringify(ap.body)); assert.equal(ap.body.version, 1);
  const vaultAfter = fs.readFileSync(path.join(temp, "data/brain/brain.zancut.enc")); assert.ok(!vaultAfter.equals(vaultBefore) && V.readHeader(vaultAfter).head.version === 1, "the vault is re-locked as v1");
  const kp2 = V.clientKeyPair(), w2 = (await call("/vault-key", { token: c2.token, body: { publicKey: kp2.publicKey } })).body, k2 = V.unwrapWith(kp2.privateKey, w2.wrapped, JSON.parse(Buffer.from(c2.token.split(".")[1], "base64url")).jti);
  const pulled = (await call("/pull-updates?since=0", { token: c2.token })).body; assert.equal(pulled.version, 1); assert.equal(pulled.updates.length, 1);
  assert.ok(!JSON.stringify(pulled).includes("শেয়ার"), "the update travels encrypted"); assert.equal(V.decryptDelta(pulled.updates[0].box, k2.updatesKey).delta.text, rule, "customer 2 decrypts the approved rule");
  const B = await import("../server/brain.mjs"), probe = B.predict(B.load(), "শেয়ার বাজারে আজ বড় দরপতন হয়েছে।"); assert.equal(probe.place.label, "office_room", "the global brain learned it"); assert.equal(probe.graphic.label, "dynamic_comparison_chart");
  // a learning that fails the checks is never merged without force
  const bad = { type: "feedback", example: { text: "রাফি চাঁদে গেল।", place: "moon_base", action: "fly_rocket" } }, sb = (await call("/submit-learning", { token: c1.token, body: { delta: bad, signature: H.signDelta(bad, c1.sessionKey) } })).body;
  assert.ok(sb.score < 0.8 && sb.reasons.some((r) => /moon_base/.test(r)), `scored low: ${JSON.stringify(sb)}`);
  assert.equal((await call("/approve", { token: owner, body: { id: sb.id } })).status, 422, "a low score is not approved without force"); assert.equal((await call("/reject", { token: owner, body: { id: sb.id, why: "not a real place" } })).body.status, "rejected");
  const unsafe = { type: "prop", prop: { id: "learnedEvil", label: "evil", viewBox: "0 0 10 10", body: '<g onload="alert(1)"><path d="M0 0h5"/></g><script>x()</script>', zone: "TABLE_TOP", metres: { usual: 0.2 }, source: { license: "MIT" } } }, su = (await call("/submit-learning", { token: c1.token, body: { delta: unsafe, signature: H.signDelta(unsafe, c1.sessionKey) } })).body;
  assert.equal(su.score, 0, "an unsafe SVG prop scores 0");
  // consensus: three different customers send the same word → approved by the owner's policy
  const word = { type: "word", concept: { term: "ইলিশ", category: "animal", english: "hilsa", properties: { zone: "GROUNDED", metres: { usual: 0.42 } } } };
  for (const c of [c1, c2]) assert.equal((await call("/submit-learning", { token: c.token, body: { delta: word, signature: H.signDelta(word, c.sessionKey) } })).body.status, "pending");
  const third = (await call("/submit-learning", { token: c3.token, body: { delta: word, signature: H.signDelta(word, c3.sessionKey) } })).body; assert.equal(third.consensus, true); assert.equal(third.version, 2, "3 customers agreed → merged as v2");
  console.log("ok: customer 1's rule waited in quarantine (customer 2 saw nothing, customers cannot approve) → owner approved → brain v1, vault re-locked → customer 2 pulled it encrypted and the brain predicts it; low-score and unsafe learnings refused; 3-customer consensus merged v2");

  // ---------- the kill switch ----------
  assert.equal((await call("/users/customer2", { token: owner, body: { status: "suspended" } })).body.status, "suspended");
  assert.equal((await call("/pull-updates?since=0", { token: c2.token })).status, 403, "suspended: no updates, at once");
  assert.equal((await call("/vault-key", { token: c2.token, body: { publicKey: kp2.publicKey } })).status, 403, "suspended: no key");
  assert.equal((await call("/vault", { token: c2.token })).status, 403, "suspended: no vault");
  assert.equal((await signIn("customer2", "laptop-bbb222")).error, "this account is suspended", "suspended: cannot sign in");
  await call("/users/customer2", { token: owner, body: { status: "active" } });
  assert.equal((await call("/pull-updates?since=0", { token: c2.token })).status, 401, "the old session stays revoked after reactivation");
  assert.equal((await call("/pull-updates?since=1", { token: (await signIn("customer2", "laptop-bbb222")).token })).body.updates.length, 1, "a new sign-in works");
  await call("/users/customer1", { token: owner, body: { expiresAt: new Date(Date.now() - 1000).toISOString() } });
  assert.equal((await call("/pull-updates", { token: c1.token })).status, 403, "an expired account is blocked");
  console.log("ok: suspending a customer blocks updates, the key, the vault and sign-in at once; their old sessions stay revoked; an expired account is blocked");
} finally {
  if (app && app.exitCode === null) { app.kill("SIGTERM"); await new Promise((r) => app.once("exit", r)); }
  fs.rmSync(temp, { recursive: true, force: true });
}
