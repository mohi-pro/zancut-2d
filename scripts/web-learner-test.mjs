// Step 6: the self-learning knowledge explorer (server/web-learner.mjs) and the names/pronouns/concepts engine (server/entity-resolver.mjs).
// Offline lookups, cached real web answers (scripts/fixtures/web-learner-cache: recorded from Wikipedia, Wikidata and Iconify),
// SVG sanitising, permanent memory, politeness (allowed hosts, User-Agent, 429), planner integration and a real render of a learned prop.
// A live test runs only with Z2D_LIVE=1. Usage: node scripts/web-learner-test.mjs
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'z2d-learn-'));
process.env.ZANCUT_DATA = path.join(temp, 'data');
const WL = await import('../server/web-learner.mjs');
const ER = await import('../server/entity-resolver.mjs');
const FIX = path.join(root, 'scripts/fixtures/web-learner-cache');
const opts = (extra = {}) => ({ knowledgeFile: path.join(temp, 'k.json'), propsFile: path.join(temp, 'p.json'), cacheDir: path.join(temp, 'cache'), ...extra });
try {
  // ---------- names, pronouns, concepts ----------
  const nc = ER.nameCount(); assert.ok(nc.forms >= 500, `${nc.forms} name forms`);
  assert.deepEqual(ER.findNames('মিনাকে দেখে করিমের মন ভালো হলো।').map((m) => m.id), ['mina', 'karim'], 'case endings are stripped');
  assert.deepEqual(ER.findNames('সাকিবরা মাঠে খেলছে, রাফিদের বাড়ি পাশেই।').map((m) => m.id), ['sakib', 'rafi']);
  assert.deepEqual(ER.findNames('আকাশ মেঘলা ছিল।'), [], 'আকাশ (the sky) is not a name without a person verb');
  assert.deepEqual(ER.findNames('আকাশ বলল, চলো যাই।').map((m) => m.id), ['akash']);
  assert.deepEqual(ER.findNames('তানজিম বলল সে আসবে।').map((m) => [m.id, m.via]), [['tanjim', 'verb-subject']], 'a new name from a speech verb');
  assert.deepEqual(ER.findNames('বাজারে গিয়ে নাবিলা বলল, চলো।').map((m) => m.id), ['nabila'], 'after a participle clause');
  for (const s of ['রাফি স্কুলে গেল।', 'সে একটা আম কিনল।', 'মা বলল ভাত খাও।', 'দোকানদার বলল দাম বেশি।']) assert.ok(!ER.findNames(s).some((m) => m.via === 'verb-subject'), `no false name in "${s}" (Bengali objects come before the verb)`);
  { const r = ER.resolveStory(['রাফি আর মিনা বাজারে গেল।', 'সে একটা আম কিনল।', 'তারা বাড়ি ফিরল।', 'মিনা বলল, তার খুব খিদে পেয়েছে।', 'John met Sarah.', 'She smiled at him.']);
    assert.deepEqual(r.sentences.map((x) => x.who), [['rafi', 'mina'], ['rafi'], ['rafi', 'mina'], ['mina'], ['john', 'sarah'], ['sarah', 'john']]);
    assert.equal(r.sentences[1].via.rafi, 'pronoun:সে'); assert.equal(r.sentences[5].via.sarah, 'pronoun:She', 'she → the woman');
    assert.deepEqual(ER.castSpec('rafi', 'male'), r.characters.find((c) => c.id === 'rafi').spec, 'one look per name, every time'); assert.equal(r.characters.find((c) => c.id === 'mina').spec.gender, 'female'); }
  const clusters = JSON.parse(fs.readFileSync(path.join(root, 'engine/cartoon/library/semantic-clusters.json'), 'utf8')).clusters, terms = clusters.reduce((n, c) => n + c.bn.length + c.en.length + c.wordnet.length, 0), hand = clusters.reduce((n, c) => n + c.bn.length + c.en.length, 0);
  assert.ok(clusters.length >= 60 && terms >= 1500 && hand >= 1000, `${clusters.length} clusters, ${terms} terms (${hand} by hand)`);
  for (const [t, id] of [['চালের দাম আকাশছোঁয়া', '#CONCEPT_PRICE_RISE'], ['বাইরে ঝুম বৃষ্টি', '#CONCEPT_RAIN'], ['তার মাথায় একটা বুদ্ধি এল', '#CONCEPT_IDEA'], ['সে খুব মন খারাপ করে বসে আছে', '#CONCEPT_SADNESS'], ['টাকার অভাবে কষ্টে দিন কাটে', '#CONCEPT_POVERTY'], ['কালবৈশাখী ঝড়ে গাছ ভেঙে পড়ল', '#CONCEPT_STORM'], ['He was furious', '#CONCEPT_ANGER'], ['They saved money every month', '#CONCEPT_SAVINGS']]) assert.ok(ER.concepts(t).some((c) => c.id === id), `${t} → ${id}: ${ER.concepts(t).map((c) => c.id)}`);
  // the planners read Bengali names now (one look per name, pronouns keep them in their shots)
  { const { planFromBrain } = await import('../server/brainplan.mjs'), f = planFromBrain('রাফি আর মিনা বাজারে গেল। সে একটা আম কিনল। তারা বাড়ি ফিরল।');
    assert.deepEqual(Object.keys(f.cast).sort(), ['mina', 'rafi']); assert.deepEqual(f.cast.mina, ER.castSpec('mina', 'female')); assert.ok(f.shots.every((s) => s.people.some((p) => p.who === 'rafi'))); }
  { const { planFromScript } = await import('../server/scriptplan.mjs'), f = planFromScript('রাফি আর মিনা বাজারে গেল। সে একটা আম কিনল।'); assert.deepEqual(Object.keys(f.cast).sort(), ['mina', 'rafi']); assert.ok(!f.plan.notes.some((n) => /nobody named/.test(n))); }
  console.log(`ok: ${nc.forms} name forms (suffixes, ambiguous words, new names from speech verbs), pronouns (bn/en), ${clusters.length} concept clusters / ${terms} terms, planners read Bengali names`);

  // ---------- Step A: offline ----------
  const off = opts({ online: false }), table = { rickshaw: ['vehicle', 'GROUNDED'], mango: ['food', 'HELD_IN_HAND'], ছাতা: ['tool', 'HELD_IN_HAND'], বাঘ: ['animal', 'GROUNDED'], হাতি: ['animal', 'GROUNDED'], kite: ['tool', 'HELD_IN_HAND'], eagle: ['animal', 'SKY_FLOATING'], টাকা: ['finance', 'HELD_IN_HAND'], courage: ['abstract_concept', null], রাফি: ['person', 'GROUNDED'], mosque: ['building', 'GROUNDED'], chair: ['tool', 'GROUNDED'] };
  assert.equal((await WL.learn('kite', opts({ online: false, knowledgeFile: path.join(temp, 'kk.json') }))).properties.flying, true, 'a kite is held on its reel and flies');
  for (const [t, [cat, zone]] of Object.entries(table)) { const r = await WL.learn(t, off); assert.equal(r.category, cat, `${t} category`); assert.equal(r.properties.zone, zone, `${t} zone`); assert.ok(r.known); assert.equal(r.sources.length, 0, 'offline: no web'); }
  { const r = await WL.learn('telescope', off); assert.equal(r.prop, 'learnedTelescope', 'a local OpenMoji icon became a prop'); const p = WL.learnedProps(off).learnedTelescope; assert.match(p.source.provider, /^openmoji:/); assert.equal(p.source.license, 'CC-BY-SA-4.0'); assert.equal(p.viewBox, '0 0 100 100'); }
  { const r = await WL.learn('ইলিশ', off); assert.equal(r.known, false); assert.equal(r.from, 'unknown'); assert.ok(!WL.knowledge(off)['ইলিশ'], 'an unknown word is never saved as knowledge'); }
  { const r = await WL.learn('mosque', off); assert.equal(r.from, 'memory', 'learned once, remembered'); }
  // ---------- Step B/C: cached real web answers (no network) ----------
  const cached = opts({ online: false, cacheDir: FIX, knowledgeFile: path.join(temp, 'k2.json'), propsFile: path.join(temp, 'p2.json') });
  { const r = await WL.learn('ইলিশ', cached); assert.equal(r.category, 'animal'); assert.equal(r.properties.zone, 'GROUNDED', 'a fish does not fly'); assert.ok(r.synonyms.some((s) => /hilsa/i.test(s))); assert.ok(r.sources.some((s) => s.kind === 'wikidata' && s.id === 'Q1709642' && s.cached)); assert.equal(r.prop, 'learnedIlish', 'its icon is a fish (the description\'s key word)'); }
  { const r = await WL.learn('কাঁঠাল', cached); assert.equal(r.category, 'food'); assert.equal(r.english, 'Jackfruit'); assert.equal(r.prop, 'learnedJackfruit'); assert.match(WL.learnedProps(cached).learnedJackfruit.generic, /generic fruit icon/, 'no jackfruit icon exists: a generic fruit icon, marked as generic'); }
  { const r = await WL.learn('শাপলা', cached); assert.equal(r.category, 'nature'); }
  { const r = await WL.learn('Padma Bridge', cached); assert.equal(r.category, 'building'); assert.ok(r.synonyms.some((s) => /পদ্মা/.test(s)), 'Bengali names come from Wikidata'); }
  // ---------- Step D: memory files ----------
  { const k = JSON.parse(fs.readFileSync(path.join(temp, 'k2.json'), 'utf8')), p = JSON.parse(fs.readFileSync(path.join(temp, 'p2.json'), 'utf8')); assert.ok(k.concepts['ইলিশ'] && p.props.learnedIlish); assert.ok(!fs.readdirSync(temp).some((f) => f.endsWith('.tmp')), 'atomic writes leave no temp files'); }
  // ---------- SVG sanitising ----------
  { const bad = `<svg viewBox="10 10 20 40" onload="alert(1)"><script>alert(1)</script><style>*{}</style><foreignObject><div>x</div></foreignObject><defs><linearGradient id="g"><stop offset="0" stop-color="#f00"/></linearGradient></defs><path d="M10 10h5" fill="url(#g)" onclick="x()"/><rect x="1" y="1" width="2" height="2" fill="url(http://evil.example/x.svg#a)"/><a href="javascript:alert(1)"><circle r="3"/></a><image href="http://evil.example/p.png"/><use href="http://evil.example/u.svg#x"/></svg>`, s = WL.sanitizeSvg(bad, 'learnedTest');
    for (const bit of ['script', 'onload', 'onclick', 'foreignObject', 'style', 'javascript', 'evil.example', '<image', '<use', '<a ']) assert.ok(!s.body.includes(bit), `sanitiser removed ${bit}`);
    assert.match(s.body, /id="learnedTest-g"/); assert.match(s.body, /fill="url\(#learnedTest-g\)"/); assert.equal(s.viewBox, '0 0 100 100'); assert.match(s.body, /^<g transform="translate\(0 -25\) scale\(2\.5\)">/, "a 20×40 box at (10,10): scaled 2.5×, its origin moved, centred across"); }
  assert.throws(() => WL.sanitizeSvg('<svg><path d="M0 0"/></svg>', 'x'), /viewBox/);
  // ---------- politeness: only the four public hosts, a plain User-Agent (no personal data), one try on a 429 ----------
  { const seen = []; const stub = async (url, init) => { seen.push({ url, ua: init.headers['User-Agent'] }); return { ok: false, status: 429, headers: { get: () => '120' }, text: async () => '' }; };
    const r = await WL.learn('zorbingball', opts({ online: true, fetch: stub, cacheDir: path.join(temp, 'c3'), knowledgeFile: path.join(temp, 'k3.json') }));
    assert.equal(r.known, false); assert.ok(r.notes.some((n) => /rate-limited/.test(n)), 'a 429 is reported'); const hosts = new Set(seen.map((x) => new URL(x.url).host));
    for (const h of hosts) assert.ok(['en.wikipedia.org', 'bn.wikipedia.org', 'www.wikidata.org', 'api.iconify.design'].includes(h)); assert.ok(seen.length <= 3, `no retry storm after a 429 (${seen.length} requests)`);
    assert.ok(seen.every((x) => x.ua === WL.UA && !/@/.test(x.ua)), 'a plain User-Agent with no e-mail'); }
  // ---------- unknown words in a story, and learned props in films ----------
  assert.deepEqual(WL.unknownWords(['রাফি বাজারে গিয়ে একটা ইলিশ কিনল।', 'মিনা নদীর পাড়ে শাপলা তুলল।'], { max: 3 }), ['ইলিশ', 'পাড়', 'শাপলা']);
  assert.deepEqual(WL.unknownWords(['চালের দাম বেড়ে গেছে।', 'সে খেয়ে দেয়ে ঘুমিয়ে পড়ল।'], { max: 8 }), ['চাল'], 'participles (বেড়ে, খেয়ে) and pronouns are not unknown nouns');
  { const learned = await WL.learnUnknown(['রাফি বাজারে গিয়ে একটা ইলিশ কিনল।'], { ...cached, knowledgeFile: path.join(temp, 'k4.json'), propsFile: path.join(temp, 'p4.json') }); assert.deepEqual(learned.map((x) => x.term), ['ইলিশ']); }
  if (process.env.Z2D_LIVE === '1') { const r = await WL.learn('কদম ফুল', opts({ online: true, cacheDir: path.join(temp, 'live') })); assert.ok(r.known && r.sources.length, 'live web lookup'); console.log(`live: কদম ফুল → ${r.category}`); }
  console.log('ok: offline table (12 words), local icon → prop, unknown never saved, memory, 4 cached real web answers (Wikipedia/Wikidata), SVG sanitiser, allowed hosts / plain User-Agent / 429, unknown words in stories');

  // ---------- a learned prop in a real scene and a b-roll, through the body gate ----------
  const propsFile = path.join(root, 'engine/cartoon/library/learned-props.json'), had = fs.existsSync(propsFile) ? fs.readFileSync(propsFile) : null;
  const knowFile = path.join(process.env.ZANCUT_DATA, 'brain/learned-knowledge.json');
  try {
    fs.mkdirSync(path.dirname(knowFile), { recursive: true });
    await WL.learn('ইলিশ', { online: false, cacheDir: FIX, knowledgeFile: knowFile, propsFile });
    const { refreshLearned } = await import('../server/physics.mjs'); refreshLearned(propsFile);
    const { shotScript, kitFor, validate, autoGraphics } = await import('../server/codefilm.mjs'), { brollFor } = await import('../server/broll.mjs');
    const film = { cast: { c0: { gender: 'male', age: 'adult' } }, shots: [] }, b = brollFor('রাফি একটা বড় ইলিশ কিনল', { mode: 'cutaway' });
    assert.equal(b.recipe.props[0].piece, 'learnedIlish', 'the learned word is now a b-roll prop'); assert.equal(b.recipe.props[0].zone, 'GROUNDED', 'an animal rests on the ground');
    const shots = [{ at: 0, place: 'kitchen', camera: { kind: 'wide' }, people: [{ who: 'c0', x: -1, dz: 1 }], props: [{ id: 'table', x: 0.6, dz: 2 }, { id: 'learnedIlish', on: 0, zone: 'TABLE_TOP' }] }, { at: 3, place: 'park', camera: { kind: 'establish' }, broll: { mode: 'cutaway', recipe: b.recipe } }];
    assert.deepEqual(validate({ ...film, shots }), [], 'a learned prop is a valid prop');
    const job = path.join(temp, 'job'); for (const f of ['cut', 'work', 'edit/graphics']) fs.mkdirSync(path.join(job, f), { recursive: true });
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x222222:s=640x360:r=30', '-f', 'lavfi', '-i', 'anullsrc=r=48000', '-t', '6', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(job, 'cut/cut.mp4')]);
    fs.writeFileSync(path.join(job, 'job.json'), '{}'); fs.writeFileSync(path.join(job, 'edit/film-kit.js'), kitFor(film)); fs.writeFileSync(path.join(job, 'cut/transcript.json'), JSON.stringify([{ text: 'a', start: 0, end: 2.9 }, { text: 'b', start: 3, end: 5.9 }]));
    const plan = shots.map((sh, i) => { const file = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(job, file), `<script>ZK.unit(root);\n${shotScript(sh, film)}\n</script>`); return { row: i, uid: 's' + i, startWord: i, endWord: i, kind: 'graphic', mode: 'full-broll-takeover', file, transition: 'cut', captions: 'hide', cues: [] }; });
    fs.writeFileSync(path.join(job, 'edit/plan.json'), JSON.stringify({ version: 2, canvas: '1920x1080', kind: 'faceless', style: '2d-animation', captions: { on: false }, scenes: plan }));
    execFileSync(process.execPath, [path.join(root, 'engine/compose/compose.mjs'), job], { stdio: 'pipe' });
    const { checkBody } = await import('../engine/cartoon/check-body.mjs'), { openPage, showAt } = await import('../engine/readcheck.mjs'), hf = path.join(job, 'edit/hf');
    const gate = await checkBody(hf, { fps: 30 }); assert.ok(gate.ok, gate.lines.slice(0, 8).join('\n'));
    const o = await openPage(hf); try {
      await showAt(o.page, 1.5); const a = await o.page.evaluate(() => { const svg = [...document.querySelectorAll('svg[data-place]')].find((s) => s.querySelector('[data-phys="learnedIlish"]')); const e = svg?.querySelector('[data-phys="learnedIlish"]'); if (!e) return null;
        const vis = [...e.querySelectorAll('path,circle,ellipse,rect,polygon')].map((x) => x.getBoundingClientRect()).filter((r) => r.height > 0), bottom = Math.max(...vis.map((r) => r.bottom));
        const t = (svg.__world?.things || []).find((x) => x.id === 'table'), ctm = svg.getScreenCTM(), cam = svg.querySelector('g').getCTM(), top = t ? new DOMPoint(t.px.x, t.px.y - 0.75 * t.px.s).matrixTransform(svg.querySelector('g').getScreenCTM()).y : null;
        return { bad: /NaN|undefined/.test(e.innerHTML), paths: vis.length, bottom, top, px: t ? 0.75 * t.px.s * ctm.a : null }; });
      assert.ok(a && !a.bad && a.paths > 0, `the learned fish is drawn ${JSON.stringify(a)}`);
      assert.ok(Math.abs(a.bottom - a.top) <= Math.max(3, a.px * 0.06), `the fish's visible bottom rests on the table top (${a.bottom.toFixed(1)} vs ${a.top.toFixed(1)} px)`);
      await showAt(o.page, 4.5); const c = await o.page.evaluate(() => Object.values(window.__broll || {}).find((r) => r.visible)?.props || null); assert.ok(c && c[0].label && c[0].bottom === c[0].groundY, 'the b-roll draws the learned prop resting on its surface');
      const vb = await o.page.evaluate(() => { const g = [...document.querySelectorAll('[data-broll-prop]')].find((x) => x.closest('.clip') && x.getBoundingClientRect().height > 0); if (!g) return null; const vis = [...g.querySelectorAll('path,circle,ellipse,rect,polygon')].map((x) => x.getBoundingClientRect()).filter((r) => r.height > 0), st = g.closest('svg'), gy = window.ZBROLL.GY, stage = g.parentNode.closest('g[transform]'); const p = new DOMPoint(0, gy).matrixTransform(stage.getScreenCTM()); return { bottom: Math.max(...vis.map((r) => r.bottom)), ground: p.y }; });
      assert.ok(vb && Math.abs(vb.bottom - vb.ground) <= 3, `the b-roll fish's visible bottom is on the ground (${JSON.stringify(vb)})`);
      if (process.argv.includes('--evidence')) { const dir = path.resolve(process.argv[process.argv.indexOf('--evidence') + 1]); fs.mkdirSync(dir, { recursive: true }); await showAt(o.page, 1.5); await o.page.screenshot({ path: path.join(dir, 'learned-prop-scene.jpg'), type: 'jpeg', quality: 82 }); await showAt(o.page, 5); await o.page.screenshot({ path: path.join(dir, 'learned-prop-broll.jpg'), type: 'jpeg', quality: 82 }); }
    } finally { await o.close(); }
    console.log(`ok: a learned prop (ইলিশ → learnedIlish) drawn in a scene and a b-roll, ${gate.frames} real frames through the body gate`);
  } finally { if (had) fs.writeFileSync(propsFile, had); else fs.rmSync(propsFile, { force: true }); }
} finally { fs.rmSync(temp, { recursive: true, force: true }); }
