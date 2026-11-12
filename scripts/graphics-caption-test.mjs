// Step 5: the caption writer (server/caption-writer.mjs), procedural motion graphics (engine/cartoon/graphics-fx.js) and camera
// moves (engine/cartoon/camera.js ZC.cameraMove). Part A proves the rules on sentences; Part B renders real scenes in Chrome, measures
// the overlays and the camera, and checks that compose's word-synced captions are the caption writer's chunks.
// Usage: node scripts/graphics-caption-test.mjs [--evidence dir]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'z2d-graphics-'));
process.env.ZANCUT_DATA = path.join(temp, 'data');
const CW = await import('../server/caption-writer.mjs');
const { shotScript, kitFor, validate, autoGraphics } = await import('../server/codefilm.mjs');
const { checkBody } = await import('../engine/cartoon/check-body.mjs');
const { openPage, showAt } = await import('../engine/readcheck.mjs');
const near = (a, b, e, msg) => assert.ok(Math.abs(a - b) <= e, `${msg}: ${a} vs ${b} (±${e})`);
const H = (s) => CW.headlineCaption(s).text, kinds = (s) => CW.graphicsFor(s).map((g) => g.kind);
try {
  // ---------- A. rules ----------
  // headlines: the owner's two examples, exactly, and every headline 2–5 words
  assert.equal(H('আমাদের শরীর সুস্থ রাখার জন্য প্রতিদিন সকালে অন্তত ৩০ মিনিট হাঁটা অত্যন্ত জরুরি'), 'প্রতিদিন ৩০ মিনিট হাঁটুন!');
  assert.equal(H('প্রথম নিয়ম হলো সকালে পানি খাওয়া'), 'নিয়ম #১: সকালে পানি খান');
  assert.equal(H('দ্বিতীয় নিয়ম হলো রাতে তাড়াতাড়ি ঘুমানো'), 'নিয়ম #২: রাতে তাড়াতাড়ি ঘুমান');
  assert.equal(H('প্রতিদিন আট ঘণ্টা ঘুমানো দরকার'), 'প্রতিদিন ৮ ঘণ্টা ঘুমান!');
  assert.equal(H('চালের দাম ৪০ টাকা থেকে বেড়ে ৭০ টাকা হয়েছে'), '৪০ → ৭০ টাকা ↑');
  assert.equal(H('দাম ৯০ টাকা থেকে কমে ৬০ টাকা হলো'), '৯০ → ৬০ টাকা ↓');
  assert.equal(H('সফল হওয়ার তিনটি উপায়: ধৈর্য, পরিশ্রম আর সততা'), 'সফল হওয়ার তিনটি উপায়');
  assert.equal(H('The first rule is to save money'), 'Rule #1: Save Money');
  assert.equal(H('It is important to drink eight glasses of water every day'), 'Drink Eight Glasses Of Water!');
  const SENT = ['আমাদের শরীর সুস্থ রাখার জন্য প্রতিদিন সকালে অন্তত ৩০ মিনিট হাঁটা অত্যন্ত জরুরি', 'দেশের ৮৫% মানুষ গ্রামে থাকে', 'সে ৫০০ টাকা ধার নিল', 'অর্ধেক কাজ শেষ', 'রাফি অবাক হয়ে গেল', 'মিনা মনে মনে একটা নতুন সাইকেলের কথা ভাবছে', 'রাফি স্কুলে গিয়ে বন্ধুদের সাথে খেলা করল', 'Prices rose from 40 to 70 taka', 'দশ বছর পরে সে গ্রামে ফিরল', 'Our village school finally got a new library this winter'];
  for (const s of SENT) { const n = H(s).split(/\s+/).length; assert.ok(n >= 2 && n <= 5, `"${H(s)}" is ${n} words`); }
  // numbers in speech: Bengali digits and number words, multipliers, units, years, half
  assert.deepEqual(CW.numbersIn('৫ হাজার টাকা আর ১০ বছর, $20 and 2024').map((x) => [x.value, x.kind]), [[5000, 'money'], [10, 'duration'], [20, 'money'], [2024, 'year']]);
  assert.deepEqual(CW.numbersIn('অর্ধেক কাজ').map((x) => [x.value, x.kind]), [[50, 'percent']]);
  assert.deepEqual(CW.numbersIn('দশ বছর পরে').map((x) => [x.value, x.kind, x.unit]), [[10, 'duration', 'বছর']]);
  // graphics from the words
  { const c = CW.graphicsFor('চালের দাম ৪০ টাকা থেকে বেড়ে ৭০ টাকা হয়েছে')[0]; assert.equal(c.kind, 'dynamic_comparison_chart'); assert.deepEqual(c.bars.map((b) => [b.label, b.value]), [['আগে', 40], ['এখন', 70]]); assert.equal(c.trend, 'up'); assert.equal(c.style, 'bar');
    near(c.bars[0].h / c.bars[1].h, 40 / 70, 1e-9, 'd3 bar heights are proportional to the values'); assert.match(c.line, /^M/); assert.ok(c.frame.length >= 1, 'rough.js frame'); }
  { const c = CW.graphicsFor('দাম ৯০ টাকা থেকে কমে ৬০ টাকা হলো')[0]; assert.equal(c.trend, 'down'); }
  { const c = CW.graphicsFor('২০২০ সালে ১০% আর ২০২৬ সালে ৮০% মানুষ মোবাইল ব্যবহার করে')[0]; assert.equal(c.style, 'line'); assert.deepEqual(c.bars.map((b) => [b.label, b.value]), [['২০২০', 10], ['২০২৬', 80]]); }
  { const c = CW.graphicsFor('Prices rose from 40 to 70 taka')[0]; assert.deepEqual(c.bars.map((b) => [b.label, b.value]), [['Before', 40], ['Now', 70]]); }
  { const r = CW.graphicsFor('দেশের ৮৫% মানুষ গ্রামে থাকে')[0]; assert.equal(r.kind, 'percentage_progress_ring'); assert.equal(r.value, 85); }
  assert.equal(CW.graphicsFor('অর্ধেক কাজ শেষ')[0].value, 50); assert.equal(CW.graphicsFor('The project is 100% done')[0].value, 100);
  { const b = CW.graphicsFor('সে ৫০০ টাকা ধার নিল')[0]; assert.equal(b.kind, 'number_badge_pop'); assert.equal(b.text, '৫০০ টাকা'); }
  assert.deepEqual(kinds('দশ বছর পরে সে গ্রামে ফিরল'), ['number_badge_pop']);
  assert.deepEqual(CW.graphicsFor('সফল হওয়ার তিনটি উপায়: ধৈর্য, পরিশ্রম আর সততা').find((g) => g.kind === 'step_list_card').items, ['ধৈর্য', 'পরিশ্রম', 'সততা']);
  assert.deepEqual(CW.graphicsFor('You need three things: patience, hard work and honesty').find((g) => g.kind === 'step_list_card').items, ['patience', 'hard work', 'honesty']);
  { const L = CW.listsAcross(['প্রথমত নিয়মিত ব্যায়াম করা।', 'দ্বিতীয়ত সঠিক খাবার খাওয়া।', 'তৃতীয়ত পর্যাপ্ত ঘুম।', 'এরপর সে বাড়ি গেল।']); assert.deepEqual(L.map((x) => x?.length ?? 0), [1, 2, 3, 0]); assert.equal(L[0][0], 'নিয়মিত ব্যায়াম করুন'); }
  { const c = CW.graphicsFor('মিনা মনে মনে একটা নতুন সাইকেলের কথা ভাবছে').find((g) => g.kind === 'thought_cloud'); assert.equal(c.icon, 'openmoji:1F6B2'); }
  for (const [s, e] of [['রাফি অবাক হয়ে গেল', 'shock'], ['বাবা খুব রেগে গেলেন', 'angry'], ['পরীক্ষার আগে সে নার্ভাস', 'sweat'], ['সে কেন এমন করল', 'question'], ['হঠাৎ তার মাথায় এল একটা বুদ্ধি', 'idea'], ['He was shocked', 'shock']]) assert.equal(CW.graphicsFor(s).find((g) => g.kind === 'comic_emotion_fx')?.emotion, e, s);
  assert.deepEqual(kinds('রাফি স্কুলে গিয়ে বন্ধুদের সাথে খেলা করল'), [], 'an ordinary sentence gets no data graphic');
  assert.equal(CW.cameraMoveFor('রাফি অবাক হয়ে গেল'), 'impact_shake'); assert.equal(CW.cameraMoveFor('দেশের ৮৫% মানুষ গ্রামে থাকে'), 'slow_push_in'); assert.equal(CW.cameraMoveFor('অবশেষে সে বাড়ি ফিরল'), 'slow_pull_out'); assert.equal(CW.cameraMoveFor('মা জিজ্ঞেস করলেন', { people: 2 }), 'over_the_shoulder');
  { const sp = CW.graphicsFor('দেশের ৮৫% মানুষ গ্রামে থাকে')[0].spring; assert.equal(sp.length, 41); assert.equal(sp[0], 0); near(sp.at(-1), 1, 0.02, 'animejs spring settles'); assert.ok(Math.max(...sp) > 1, 'the spring overshoots (a pop)'); }
  // word-synced subtitles: 2–5 words, a break at a pause or a full stop, every word once, in order
  const mk = (text, t0, gap = 0.32) => text.split(' ').map((w, i) => ({ text: w, start: t0 + i * gap, end: t0 + i * gap + gap * 0.85 }));
  { const ws = [...mk('আমাদের শরীর সুস্থ রাখার জন্য প্রতিদিন হাঁটা জরুরি।', 0), ...mk('প্রথম নিয়ম হলো সকালে পানি খাওয়া।', 4), ...mk('We walk every day', 7)], ch = CW.subtitles(ws);
    assert.deepEqual(ch.flatMap((c) => c.words.map((w) => w.text)), ws.map((w) => w.text)); for (const c of ch) assert.ok(c.words.length >= 2 && c.words.length <= 5, c.words.map((w) => w.text).join(' '));
    assert.ok(ch.some((c) => c.words.at(-1).text.endsWith('।')) && !ch.some((c) => c.words.slice(0, -1).some((w) => /।$/.test(w.text))), 'a full stop ends a line'); assert.equal(ch.at(-1).lang, 'en'); assert.equal(ch[0].lang, 'bn');
    const c0 = ch[0]; assert.equal(CW.activeWord(c0, c0.words[1].s + 0.01), 1, 'the active word follows the voice'); }
  // the scene file: automatic graphics only where the scene did not decide; switches; validation
  { const s = autoGraphics({ at: 0, place: 'park', people: [{ who: 'c0' }] }, 'দেশের ৮৫% মানুষ গ্রামে থাকে'); assert.equal(s.headline, '৮৫% মানুষ গ্রামে'); assert.equal(s.overlays[0].kind, 'percentage_progress_ring'); assert.equal(s.camera.move, 'slow_push_in'); }
  { const s = autoGraphics({ at: 0, place: 'park', overlays: [], camera: { move: 'gentle_pan' } }, 'দেশের ৮৫% মানুষ গ্রামে থাকে'); assert.deepEqual(s.overlays, []); assert.equal(s.camera.move, 'gentle_pan'); }
  { const s = autoGraphics({ at: 0, place: 'park' }, 'দেশের ৮৫% মানুষ গ্রামে থাকে', { film: { graphics: false, cameraMoves: false } }); assert.equal(s.headline, undefined); assert.equal(s.overlays, undefined); assert.equal(s.camera, undefined); }
  // automatic b-roll: a corner card under the headline when a template matches, never beside a data card; a cutaway without people
  { const s = autoGraphics({ at: 0, place: 'park', people: [{ who: 'c0' }] }, 'বাইরে খুব বৃষ্টি হচ্ছিল তাই সে ঘরে বসে ছিল'); assert.deepEqual(s.broll, { mode: 'pip_corner', template: 'heavy_rain_clouds', corner: 'tr', top: 0.17 }); }
  { const s = autoGraphics({ at: 0, place: 'park', people: [{ who: 'c0' }] }, 'মোবাইলের দাম ৪০ টাকা থেকে বেড়ে ৭০ টাকা'); assert.equal(s.broll, undefined, 'no b-roll card beside a chart'); }
  { const s = autoGraphics({ at: 0, place: 'park' }, 'The phone fell from the table'); assert.equal(s.broll.mode, 'cutaway'); assert.equal(s.broll.recipe.motion, 'fall'); }
  assert.equal(autoGraphics({ at: 0, place: 'park', people: [{ who: 'c0' }] }, 'বাইরে খুব বৃষ্টি হচ্ছিল', { film: { broll: false } }).broll, undefined);
  const cast = { c0: { gender: 'male', age: 'adult' }, c1: { gender: 'female', age: 'adult' } };
  { const e = validate({ cast, shots: [{ at: 0, place: 'park', camera: { move: 'barrel_roll' }, overlays: [{ kind: 'pie_chart' }], headline: 'x'.repeat(80) }] }); assert.ok(e.some((x) => /barrel_roll/.test(x)) && e.some((x) => /pie_chart/.test(x)) && e.some((x) => /headline/.test(x)), e.join(' | ')); }
  console.log('ok: headlines (owner examples exact, 2–5 words), Bengali/English numbers, charts (d3 geometry, rough frame, trend), ring, badge, lists (one sentence and across sentences), thought cloud, 5 emotions, camera moves, word-synced chunks');

  // ---------- B. real render ----------
  const film = { cast, shots: [] }, scenes = []; let cursor = 0;
  const add = (seconds, shot, text, tag) => { const s = text ? autoGraphics(shot, text, { list: shot.list }) : shot; scenes.push({ start: cursor, seconds, js: shotScript(s, film), tag, text: text || tag, shot: s }); cursor += seconds; };
  const one = (extra = {}) => ({ place: 'park', camera: { kind: 'wide', on: 'c0' }, people: [{ who: 'c0', x: -1.2, dz: 1 }], ...extra });
  add(3, one(), 'দেশের ৮৫% মানুষ গ্রামে থাকে', 'ring');
  add(3, { ...one(), camera: { kind: 'two', on: 'c0' }, people: [{ who: 'c0', x: -1.1, dz: 1 }, { who: 'c1', x: 1.1, dz: 1 }] }, 'তাদের সংগ্রহের ৮০ শতাংশ পূর্ণ হয়েছে', 'ring-two-people');
  add(3, one(), 'মিনা রাফিকে শিশুদের জন্য বই জোগাড় করতে বলল', 'bengali-headline-fit');
  add(3.2, one(), 'চালের দাম ৪০ টাকা থেকে বেড়ে ৭০ টাকা হয়েছে', 'chart-bar');
  add(3.2, { ...one(), people: [{ who: 'c0', x: 1.3, dz: 1 }] }, '২০২০ সালে ১০% আর ২০২৬ সালে ৮০% মানুষ মোবাইল ব্যবহার করে', 'chart-line');
  add(2.6, one(), 'সে ৫০০ টাকা ধার নিল', 'badge');
  add(3.2, one(), 'সফল হওয়ার তিনটি উপায়: ধৈর্য, পরিশ্রম আর সততা', 'list');
  add(3, one(), 'মিনা মনে মনে একটা নতুন সাইকেলের কথা ভাবছে', 'thought');
  for (const [s, e] of [['রাফি অবাক হয়ে গেল', 'shock'], ['বাবা খুব রেগে গেলেন', 'angry'], ['পরীক্ষার আগে সে নার্ভাস', 'sweat'], ['সে কেন এমন করল', 'question'], ['হঠাৎ তার মাথায় এল একটা বুদ্ধি', 'idea']]) add(2.4, one(), s, 'emotion:' + e);
  for (const mv of ['slow_push_in', 'slow_pull_out', 'gentle_pan', 'impact_shake']) add(2.4, one({ camera: { kind: 'wide', on: 'c0', move: mv } }), null, 'move:' + mv);
  add(3, one(), 'রাতে খুব বৃষ্টি হচ্ছিল আর রাফি জানালার পাশে দাঁড়িয়ে ছিল', 'auto-broll');
  add(2.6, { place: 'living_room', camera: { kind: 'wide', on: 'c0', move: 'over_the_shoulder' }, people: [{ who: 'c0', x: 1.2, dz: 1, speaks: true }, { who: 'c1', x: -1.2, dz: 1 }] }, null, 'move:over_the_shoulder');
  // the transcript is the scenes' own sentences; compose gets the caption writer's chunks
  const words = scenes.flatMap((s) => { const ws = s.text.split(/\s+/), g = (s.seconds - 0.3) / ws.length; return ws.map((w, i) => ({ text: w + (i === ws.length - 1 ? '।' : ''), start: +(s.start + 0.1 + i * g).toFixed(3), end: +(s.start + 0.1 + i * g + g * 0.9).toFixed(3) })); });
  const chunks = CW.subtitles(words);
  const job = path.join(temp, 'job'); for (const f of ['cut', 'work', 'edit/graphics']) fs.mkdirSync(path.join(job, f), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x222222:s=640x360:r=30', '-f', 'lavfi', '-i', 'anullsrc=r=48000', '-t', String(cursor), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(job, 'cut/cut.mp4')]);
  fs.writeFileSync(path.join(job, 'job.json'), '{}'); fs.writeFileSync(path.join(job, 'edit/film-kit.js'), kitFor(film)); fs.writeFileSync(path.join(job, 'cut/transcript.json'), JSON.stringify(words));
  let wi = 0; const plan = scenes.map((s, i) => { const n = s.text.split(/\s+/).length, file = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(job, file), `<script>ZK.unit(root);\n${s.js}\n</script>`); const row = { row: i, uid: 's' + i, startWord: wi, endWord: wi + n - 1, kind: 'graphic', mode: 'full-broll-takeover', file, transition: 'cut', captions: 'show', cues: [] }; wi += n; return row; });
  fs.writeFileSync(path.join(job, 'edit/plan.json'), JSON.stringify({ version: 2, canvas: '1920x1080', kind: 'faceless', style: '2d-animation', theme: 'light', tokens: {}, captions: { on: true, chunks: chunks.map((c) => ({ s: c.s, e: c.e })) }, scenes: plan }));
  const built = JSON.parse(execFileSync(process.execPath, [path.join(root, 'engine/compose/compose.mjs'), job], { encoding: 'utf8' }).trim().split('\n').at(-1));
  assert.equal(built.captions, chunks.length, 'compose shows exactly the caption writer\'s chunks');
  const hf = path.join(job, 'edit/hf'), html = fs.readFileSync(path.join(hf, 'index.html'), 'utf8');
  const caps = [...html.matchAll(/<div id="c\d+" class="cap[^>]*>([\s\S]*?)<\/div><\/div>/g)].map((m) => [...m[1].matchAll(/<span class="w" data-t0="([\d.]+)"[^>]*>([^<]*)<\/span>/g)].map((x) => x[2]));
  assert.deepEqual(caps, chunks.map((c) => c.words.map((w) => w.text)), 'each caption line is one chunk, word by word with its own timing');
  const gate = await checkBody(hf, { fps: 30 }); assert.ok(gate.ok, gate.lines.slice(0, 12).join('\n'));
  assert.deepEqual(gate.notes.filter((n) => /^A1/.test(n)), [], 'no arm held straight at the camera (library idle gestures keep the hands near the body)');
  const evidenceAt = process.argv.indexOf('--evidence'), evidence = evidenceAt >= 0 ? path.resolve(process.argv[evidenceAt + 1]) : null; if (evidence) fs.mkdirSync(evidence, { recursive: true });
  const o = await openPage(hf); await o.page.evaluate(() => { Math.random = () => { throw new Error('render used unseeded random'); }; });
  const look = () => o.page.evaluate(() => { const t = window.__timelines.main.time(), clip = [...document.querySelectorAll('.clip[data-start]')].find((c) => c.querySelector('svg') && t >= +c.dataset.start && t < +c.dataset.start + +c.dataset.duration), svg = clip?.querySelector('svg'); if (!svg) return null;
    const fxg = svg.querySelector('[data-fx]'), rec = Object.values(window.__fx || {}).find((r) => Math.abs(r.t - (t - +clip.dataset.start)) < 0.02) || null;
    const br = svg.querySelector('[data-broll]'), brRec = Object.values(window.__broll || {}).find((r) => r.visible && r.box && r.mode === 'pip_corner');
    const near = [...svg.querySelectorAll('g[filter]')].find((g) => g.querySelector('[data-shadow]'));
    return { pip: br && br.getAttribute('display') !== 'none' ? brRec?.box || null : null, nearBody: !!near, cam: svg.__cam, w: svg.viewBox.baseVal.width, h: svg.viewBox.baseVal.height, bad: /NaN|undefined/.test(svg.innerHTML), fx: rec, fxHtml: fxg ? fxg.innerHTML : null, who: Object.values(window.__who || {}) }; });
  const at = async (s, u) => { await o.page.evaluate(() => { window.__fx = {}; window.__who = {}; }); await showAt(o.page, s.start + Math.min(s.seconds - 0.04, Math.max(0.02, u * s.seconds))); return look(); };
  const report = { scenes: [] };
  try {
    for (const s of scenes) {
      const end = await at(s, 0.97), mid = await at(s, 0.5); assert.ok(end && !end.bad && mid && !mid.bad, `${s.tag}: invalid geometry`);
      const L = end.fx?.list || {}, lane = end.h * 0.78, inside = (b) => b.x >= -1 && b.y >= -1 && b.x + b.w <= end.w + 1 && b.y + b.h <= end.h + 1;
      if (s.shot.headline) { const b = L.headline; assert.ok(b && inside(b) && b.y + b.h < end.h * 0.2, `${s.tag}: the headline sits at the top`); }
      for (const k of ['dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card']) if (L[k]) assert.ok(inside(L[k]) && L[k].y + L[k].h <= lane + 1, `${s.tag}: ${k} stays out of the caption lane`);
      if (s.tag === 'ring') { near(L.percentage_progress_ring.value, 85, 0.5, 'the ring fills to 85%'); assert.ok(mid.fx.list.percentage_progress_ring.value < 85, 'the ring is still filling mid-shot'); }
      if (s.tag.startsWith('chart')) { assert.ok(L.dynamic_comparison_chart.bars.every((u) => Math.abs(u - 1) < 0.03), `${s.tag}: bars grew to their values`); assert.equal(L.dynamic_comparison_chart.trend, 'up'); }
      for (const k of ['dynamic_comparison_chart', 'percentage_progress_ring', 'number_badge_pop', 'step_list_card']) if (L[k]) for (const hd of end.fx.heads || []) assert.ok(!(hd.x > L[k].x && hd.x < L[k].x + L[k].w && hd.top + hd.size > L[k].y && hd.top < L[k].y + L[k].h), `${s.tag}: ${k} covers a face`);
      if (s.tag === 'badge') near(L.number_badge_pop.scale, 1, 0.03, 'the badge settles after its pop');
      if (s.tag === 'list') assert.equal(L.step_list_card.items, 3);
      if (s.tag === 'auto-broll') { assert.equal(s.shot.broll?.template, 'heavy_rain_clouds'); assert.ok(end.pip && L.headline && end.pip.y >= L.headline.y + L.headline.h, 'the corner b-roll sits below the headline'); assert.ok(end.pip.y + end.pip.h <= lane, 'and above the captions'); }
      if (s.tag === 'move:over_the_shoulder') assert.ok(mid.nearBody, 'the listener is drawn near the camera, from behind, blurred');
      if (s.tag === 'thought') { const c = L.thought_cloud; assert.ok(c && c.clear && inside(c), `the thought cloud stays inside the frame and off the face ${JSON.stringify(c)}`); assert.ok(end.fxHtml.includes('<svg'), 'the bicycle icon is drawn'); }
      if (s.tag.startsWith('emotion:')) { const f = L.comic_emotion_fx; assert.ok(f && f.emotion === s.tag.slice(8) && inside(f), `${s.tag}: drawn around the head, inside the frame ${JSON.stringify(f)}`); if (L.headline && ['angry', 'question', 'idea'].includes(f.emotion)) assert.ok(f.y >= L.headline.y + L.headline.h - 1, `${s.tag}: not under the headline`); }
      if (s.shot.headline || s.shot.overlays?.length) { await at(s, 0.1); const back = await at(s, 0.5); assert.equal(back.fxHtml, mid.fxHtml, `${s.tag}: overlays are seek-deterministic`); }
      if (evidence) { await at(s, 0.9); await o.page.screenshot({ path: path.join(evidence, `${scenes.indexOf(s)}-${s.tag.replace(/[^a-z0-9_-]+/gi, '_')}.jpg`), type: 'jpeg', quality: 82 }); }
      report.scenes.push({ tag: s.tag, text: s.text, headline: s.shot.headline || null, overlays: (s.shot.overlays || []).map((x) => x.kind), move: s.shot.camera?.move || null });
    }
    // camera moves, measured on the camera itself
    const cams = async (tag, us) => { const s = scenes.find((x) => x.tag === tag), out = []; for (const u of us) out.push((await at(s, u)).cam); return out; };
    { const [a, b] = await cams('move:slow_push_in', [0.02, 0.98]); near(b.cw / a.cw, 0.88, 0.01, 'push in by 12%'); }
    { const [a, b] = await cams('move:slow_pull_out', [0.02, 0.98]); near(b.cw / a.cw, 1 / 0.88, 0.015, 'pull out by 12%'); }
    { const [a, b] = await cams('move:gentle_pan', [0.02, 0.98]); near((b.x - a.x) / a.cw, 0.1, 0.01, 'pan 10% of the frame'); }
    { const s = scenes.find((x) => x.tag === 'move:impact_shake'), cs = [];
      for (let t = 0.06; t < 1.2; t += 1 / 30) { await o.page.evaluate(() => { window.__fx = {}; }); await showAt(o.page, s.start + t); cs.push({ t, c: (await look()).cam }); }
      const base = cs.at(-1).c, dev = cs.map(({ t, c }) => ({ t, d: Math.hypot(c.x - base.x, c.y - base.y) / c.cw }));
      assert.ok(Math.max(...dev.filter((x) => x.t > 0.15 && x.t < 0.4).map((x) => x.d)) > 0.004, 'the shake moves the frame');
      assert.ok(dev.filter((x) => x.t < 0.14 || x.t > 0.8).every((x) => x.d < 1e-9), 'still before the impact and settled after it'); report.shakePeak = +Math.max(...dev.map((x) => x.d)).toFixed(4); }
    { const r = await at(scenes.find((x) => x.tag === 'move:over_the_shoulder'), 0.5), c = r.cam, sx = (x) => (x - c.x) * (r.w / c.cw) + r.w / 2, kNow = Math.max(...r.who.map((w) => w.k)), xs = r.who.filter((w) => w.k === kNow).map((w) => sx(w.x)).sort((a, b) => a - b);
      near(xs[1] / r.w, 0.62, 0.04, 'the speaker at 62% across '); assert.ok(xs[0] / r.w < 0.12, 'the listener at the near edge'); report.ots = { listener: +(xs[0] / r.w).toFixed(3), speaker: +(xs[1] / r.w).toFixed(3) }; }
  } finally { await o.close(); }
  if (evidence) fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ ...report, captions: chunks.map((c) => c.words.map((w) => w.text).join(' ')), gate: { ok: gate.ok, frames: gate.frames, faults: gate.faults.length, notes: gate.notes } }, null, 2));
  console.log(`ok: ${scenes.length} scenes, ${gate.frames} real 30 fps frames through the body gate; headline/chart/ring/badge/list/thought/5 emotions measured; 5 camera moves measured; ${chunks.length} word-synced caption lines = compose's captions`);
} finally { if (!process.env.Z2D_KEEP) fs.rmSync(temp, { recursive: true, force: true }); else console.error('kept', temp); }
