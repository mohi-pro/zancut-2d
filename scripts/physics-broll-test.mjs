// Step 4: world physics & logical sanity (engine/cartoon/physics-logic.js) and the 2D b-roll kit (engine/cartoon/broll-kit.js).
// Part A proves the rules on data: indoor/outdoor, gravity zones, real sizes, supports, facing, gait, closed-form motion, recipes.
// Part B renders a real composition in Chrome and measures it: window weather, props on surfaces, foot slide, 25 templates,
// cutaway / pip_corner, composed recipes, and the body gate. Usage: node scripts/physics-broll-test.mjs [--evidence dir]
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname), temp = fs.mkdtempSync(path.join(os.tmpdir(), 'z2d-physics-'));
process.env.ZANCUT_DATA = path.join(temp, 'data');
const { ZPHYS, sanitizeShot, sanitizeFilm } = await import('../server/physics.mjs');
const { brollFor, matchTemplate, resolveBroll, TEMPLATES, LEXICON, openmojiExists } = await import('../server/broll.mjs');
const { shotScript, kitFor, validate } = await import('../server/codefilm.mjs');
const { readyPlaces } = await import('../server/place-registry.mjs');
const { checkBody } = await import('../engine/cartoon/check-body.mjs');
const { openPage, showAt } = await import('../engine/readcheck.mjs');
const Z = ZPHYS.ZONES, near = (a, b, e, msg) => assert.ok(Math.abs(a - b) <= e, `${msg}: ${a} vs ${b} (±${e})`);
try {
  // ---------- A. rules ----------
  assert.equal(Object.keys(ZPHYS.PLACES).length, Object.keys(readyPlaces).length, "every registered place has an indoor/outdoor tag");
  for (const [id, p] of Object.entries(readyPlaces)) assert.equal(ZPHYS.PLACES[id], p.indoors ? 'INDOOR' : 'OUTDOOR', `${id} indoor/outdoor tag`);
  // indoor/outdoor sanity: outdoor-only things never spawn in a room; indoor weather is a window view
  for (const room of ['bedroom', 'living_room', 'kitchen', 'classroom', 'office_room', 'hospital_clinic']) {
    const r = sanitizeShot({ place: room, weather: 'rain', props: ['car', 'localBus', 'boat', 'mangoTree', 'cloud', 'rainfall', 'chair'].map((id) => ({ id })) });
    assert.deepEqual(r.shot.props.map((p) => p.id), ['chair'], `${room} kept only indoor things`);
    assert.deepEqual(r.shot.weather, { kind: 'rain', view: 'window_weather_view' });
    assert.ok(r.fixes.filter((f) => f.rule === 'P1').length >= 6);
  }
  { const r = sanitizeShot({ place: 'park', weather: 'rain', props: [{ id: 'car' }, { id: 'mangoTree' }, { id: 'cloud' }] }); assert.deepEqual(r.shot.props.map((p) => p.id), ['car', 'mangoTree', 'cloud']); assert.equal(r.shot.weather.view, 'sky'); }
  // gravity & zones: grounded things never float; nothing grounded is allowed into the sky
  { const r = sanitizeShot({ place: 'park', props: [{ id: 'chair', lift: 1.2 }, { id: 'car', zone: 'SKY_FLOATING' }, { id: 'bench', dz: -9 }] });
    assert.equal(r.shot.props[0].lift, 0); assert.equal(r.shot.props[1].zone, Z.GROUNDED); assert.equal(r.shot.props[2].dz, -1.5); assert.ok(r.fixes.some((f) => /floated 1.2 m/.test(f.evidence))); }
  const zones = { cup: Z.TABLE_TOP, phone: Z.TABLE_TOP, wallClock: Z.WALL_MOUNTED, ceilingFan: Z.WALL_MOUNTED, umbrella: Z.HELD_IN_HAND, mangoTree: Z.GROUNDED, localBus: Z.GROUNDED, cat: Z.GROUNDED, chair: Z.GROUNDED, cloud: Z.SKY_FLOATING, moon: Z.SKY_FLOATING };
  for (const [id, z] of Object.entries(zones)) assert.equal(ZPHYS.zoneOf(id), z, `${id} zone`);
  // real metres: the size table is the authority; a cup or phone is never bigger than a head; classes for unknown things
  const sized = (id, m, cls) => ZPHYS.saneMetres(id, m, undefined, cls);
  assert.ok(sized('cup', 0.8) <= ZPHYS.HEAD && sized('cup', 0.8) >= 0.07); assert.ok(sized('phone', 2) <= ZPHYS.HEAD); assert.equal(sized('cat', 3), 0.32); assert.equal(sized('localBus', 20), 3.25); assert.equal(sized('chair', 0.05), 0.82);
  assert.equal(sized('umbrella', 0.85), 0.85, 'a big held thing is not shrunk to a head');
  for (const [cls, [lo, hi]] of Object.entries(ZPHYS.BANDS)) { assert.equal(sized(null, 100, cls), cls === 'hand_prop' ? Math.min(hi, ZPHYS.HEAD) : hi); assert.equal(sized(null, 0.001, cls), lo); }
  { const r = sanitizeShot({ place: 'kitchen', props: [{ id: 'cup', m: 0.8 }, { id: 'phone', m: 2 }] }); assert.ok(r.shot.props.filter((p) => ['cup', 'phone'].includes(p.id)).every((p) => p.m <= ZPHYS.HEAD)); assert.ok(r.fixes.filter((f) => f.rule === 'P3').length === 2); }
  // supports: table-top things get a surface, held things get a hand
  { const r = sanitizeShot({ place: 'bedroom', people: [{ who: 'a', x: -1 }], props: [{ id: 'cup' }, { id: 'phone', zone: 'HELD_IN_HAND' }] });
    const cup = r.shot.props.find((p) => p.id === 'cup'), table = r.shot.props[cup.on]; assert.equal(table.id, 'table'); assert.equal(table.zone, Z.GROUNDED); assert.equal(r.shot.props.find((p) => p.id === 'phone').by, 'a'); }
  { const r = sanitizeShot({ place: 'tea_stall', props: [{ id: 'cup' }] }); assert.equal(r.shot.props[r.shot.props[0].on].id, 'teaCart', 'outdoors a cup rests on the tea cart'); }
  // facing: people standing together face each other
  { const r = sanitizeShot({ place: 'park', people: [{ who: 'a', x: -1 }, { who: 'b', x: 1, facing: 1 }, { who: 'c', x: 2.5, lookAway: true, facing: 1 }] }); assert.deepEqual(r.shot.people.map((p) => p.facing), [1, -1, 1]); }
  // gait: walking faster than people walk is a run; running faster than people run is cut short
  { const r = sanitizeShot({ place: 'park', people: [{ who: 'a', x: -2, do: 'walk', to: 2.5 }, { who: 'b', x: -2.5, do: 'run', to: 2.5 }] }, { seconds: 0.8 });
    assert.equal(r.shot.people[0].do, 'run'); assert.ok(Math.abs(r.shot.people[1].to + 2.5) / 0.6 <= ZPHYS.GAIT.run.max + 1e-6); }
  { const g = ZPHYS.gait(1.3, 1.65); near(g.step * g.cadence, 1.3, 1e-9, 'steps cover the ground'); near(g.cycle, (2 * g.step) / 1.3, 1e-9, 'cycle'); assert.equal(ZPHYS.gait(3).kind, 'run'); }
  // closed-form gravity: first contact at √(2h/g); each bounce reaches e² of the last height; checked against fine numeric integration
  { const h0 = 1.5, e = 0.5, t1 = Math.sqrt((2 * h0) / 9.8); assert.ok(ZPHYS.fall(t1 - 1e-4, { h0, e }).y > 0); near(ZPHYS.fall(t1 + 1e-4, { h0, e }).bounces, 1, 0, 'bounce count');
    const v1 = e * 9.8 * t1, apex = ZPHYS.fall(t1 + v1 / 9.8, { h0, e }).y; near(apex, e * e * h0, 1e-6, 'bounce apex');
    let y = h0, v = 0, maxErr = 0; for (let t = 0, dt = 1e-5; t < t1 * 0.999; t += dt) { v -= 9.8 * dt; y += v * dt; maxErr = Math.max(maxErr, Math.abs(y - ZPHYS.fall(t + dt, { h0, e }).y)); } assert.ok(maxErr < 1e-3, `fall vs numeric ${maxErr}`);
    assert.ok(ZPHYS.fall(10, { h0, e }).resting); for (let t = 0; t < 4; t += 0.01) assert.ok(ZPHYS.fall(t, { h0, e }).y >= -1e-9, 'never below the ground'); }
  { const a = ZPHYS.throwArc(1.2, { x0: 0, y0: 1.4, x1: 4, y1: 0, T: 1.2 }); near(a.x, 4, 1e-9, 'throw lands at x1'); near(a.y, 0, 1e-9, 'throw lands at y1'); assert.ok(ZPHYS.throwArc(0.3, { T: 1.2 }).y < ZPHYS.throwArc(0, { T: 1.2 }).apex + 1e-9); }
  // whole film: corrections carry the shot index and the gait sees each shot's real length
  { const r = sanitizeFilm({ cast: {}, shots: [{ at: 0, place: 'bedroom', props: [{ id: 'car' }] }, { at: 1, place: 'park', people: [{ who: 'a', x: -2, do: 'walk', to: 2 }] }] }, { duration: 2 });
    assert.deepEqual(r.fixes.map((f) => [f.shot, f.rule]), [[0, 'P1'], [1, 'P5']]); }
  // b-roll recipes: at most 3 props, no outdoor things in a room, real sizes, one readable scale, immovable things stay put
  { const v = ZPHYS.validateRecipe({ backdrop: 'room', motion: 'fly', props: [{ label: 'car', sizeId: 'car' }, { label: 'cup', sizeId: 'cup', m: 2 }, { label: 'cloud' }, { label: 'book', sizeId: 'book' }, { label: 'pen' }] });
    assert.equal(v.recipe.motion, 'pan'); assert.deepEqual(v.recipe.props.map((p) => p.label), ['cup']); assert.ok(v.recipe.props[0].m <= ZPHYS.HEAD); assert.ok(v.fixes.some((f) => /at most 3/.test(f.evidence))); }
  { const v = ZPHYS.validateRecipe({ backdrop: 'sky', motion: 'slide', props: [{ label: 'bus', sizeId: 'localBus' }, { label: 'key' }] }); assert.deepEqual(v.recipe.props.map((p) => p.label), ['bus'], 'a key beside a bus is too small to read'); }
  { const v = ZPHYS.validateRecipe({ backdrop: 'sky', motion: 'slide', props: [{ label: 'house', sizeId: 'house' }] }); assert.equal(v.recipe.motion, 'zoom'); assert.equal(v.recipe.props[0].movable, false); }
  // choosing b-roll from sentences (Bengali and English), never on a false friend
  assert.equal(Object.keys(TEMPLATES).length, 25); for (const t of Object.values(TEMPLATES)) assert.ok(t.words.length >= 4 && t.about);
  for (const [w, hex] of LEXICON.map((l) => [l[0][0], l[1]])) assert.ok(openmojiExists(hex), `OpenMoji ${hex} (${w}) is in the local package`);
  const pick = { 'বাইরে খুব বৃষ্টি হচ্ছিল': 'heavy_rain_clouds', 'রাফি চায়ের দোকানে বসে': 'teacup_steaming', 'মোবাইলের দাম বেড়ে গেছে': 'market_price_up', 'টাকা নেই, খালি পকেট': 'empty_wallet_fly', 'সে ভাত খেল': 'rice_bowl_steam', 'He was late for the meeting': 'clock_ticking', 'রাত গভীর হলো': 'night_stars_moon' };
  for (const [s, id] of Object.entries(pick)) assert.equal(brollFor(s)?.template, id, s);
  assert.equal(matchTemplate('সে চাকরি খুঁজছে'), null, 'চাকরি (a job) is not চা (tea)');
  { const b = brollFor('The phone fell from the table'); assert.equal(b.recipe.motion, 'fall'); assert.equal(b.recipe.backdrop, 'table'); assert.equal(b.recipe.props[0].label, 'phone'); }
  { const b = brollFor('সে বাড়ি গেল'); assert.equal(b.recipe.motion, 'zoom'); }
  { const b = brollFor('The kite rose into the sky'); assert.equal(b.recipe.backdrop, 'sky'); assert.equal(b.recipe.props[0].zone, Z.SKY_FLOATING); }
  // the scene file: bad props, weather and b-roll are refused with a reason
  const cast = { c0: { gender: 'male', age: 'adult' }, c1: { gender: 'female', age: 'adult' } };
  const errs = validate({ cast, shots: [{ at: 0, place: 'park', props: [{ id: 'spaceship' }], weather: 'meteor', broll: { mode: 'cutaway', template: 'dance_party' } }] });
  assert.ok(errs.some((e) => /spaceship/.test(e)) && errs.some((e) => /weather/.test(e)) && errs.some((e) => /dance_party/.test(e)), errs.join(' | '));
  assert.deepEqual(validate({ cast, shots: [{ at: 0, place: 'bedroom', props: [{ id: 'table' }, { id: 'cup' }], weather: 'rain', broll: { mode: 'pip_corner', template: 'clock_ticking' } }] }), []);
  console.log(`ok: 20 places tagged; indoor/outdoor, gravity zones, real sizes (${Object.keys(ZPHYS.BANDS).length} classes), supports, facing, gait, falls/throws, recipes and sentence → b-roll`);

  // ---------- B. real render ----------
  const film = { cast, shots: [] }, scenes = []; let cursor = 0;
  const add = (seconds, js, tag) => { scenes.push({ start: cursor, seconds, js, tag }); cursor += seconds; };
  const bedroom = { place: 'bedroom', weather: 'rain', camera: { kind: 'wide' }, people: [{ who: 'c0', x: -1.2, dz: 1 }, { who: 'c1', x: 1.2, dz: 1, facing: 1 }], props: [{ id: 'car', x: 0, dz: 3 }, { id: 'table', x: 0.2, dz: 2.6 }, { id: 'cup', m: 0.8, on: 1 }, { id: 'chair', x: -2.3, dz: 2.8, lift: 1.2 }, { id: 'phone', zone: 'HELD_IN_HAND', by: 'c0' }] };
  const bedJs = shotScript(bedroom, film); assert.match(bedJs, /a0\.draw\([^\n]*facing: 1[ ,}]/); assert.match(bedJs, /a1\.draw\([^\n]*facing: -1[ ,}]/); assert.doesNotMatch(bedJs, /"car"/, 'the car never reaches the bedroom script');
  add(3, bedJs, 'bedroom-rain');
  add(3, shotScript({ place: 'park', weather: 'rain', camera: { kind: 'wide' }, people: [{ who: 'c0', x: -1.4, dz: 1 }], props: [{ id: 'car', x: 1.8, dz: 3 }, { id: 'cloud', x: -1 }] }, film), 'park-rain');
  const walker = (method) => `const W = ZC.world(root), P = ZC.place("park", W, {}), pw = P.Z.person(ZF.cast.c0, { x: -2, dz: 1, layer: P.layer }), a = ZC.actor(pw.slot, { spec: ZF.cast.c0, ...pw, view: "side" });
ZC.clock(tl, s, d, (t) => { P.tick(t); const A = P.Z.at(-2, 1), B = P.Z.at(2, 1);
  ${method === 'new' ? 'const tr = ZPHYS.travel(a, { from: A, to: B, t0: 0, t1: d - 0.2, kind: "walk" }, t), X = tr.x, ps = tr.pose; a.draw(ps, { x: X, floor: A.y, facing: 1, center: { x: 0, y: 0, z: 0 } });'
    : 'const X = A.x + (B.x - A.x) * Math.min(1, t / Math.max(0.5, d - 0.2)), ps = a.pose("walk", ((t / 1.1) % 1) * 360); a.draw(ps, { x: X, floor: A.y, facing: 1, center: { x: 0, y: 0, z: 0 } });'}
  window.__walk = { method: ${JSON.stringify(method)}, t, X, k: a.H / 27, J: ps.joints }; W.cam(W.w / 2, W.h / 2, W.w); });`;
  add(3, walker('new'), 'walk-new'); add(3, walker('old'), 'walk-old');
  add(3, shotScript({ place: 'park', camera: { kind: 'wide' }, people: [{ who: 'c0', x: -2, dz: 1, do: 'walk', to: 2 }] }, film), 'walk-codefilm');
  const templ = Object.keys(TEMPLATES); for (const id of templ) add(1.6, shotScript({ place: 'park', camera: { kind: 'establish' }, broll: { mode: 'cutaway', template: id } }, film), 'template:' + id);
  add(3, shotScript({ place: 'living_room', camera: { kind: 'wide' }, people: [{ who: 'c1', x: -0.8, dz: 1 }], broll: { mode: 'pip_corner', corner: 'tr', template: 'clock_ticking' } }, film), 'pip');
  const recipes = ['The phone fell from the table', 'A ball bounced near the car', 'সে বাড়ি গেল'].map((s) => brollFor(s, { mode: 'cutaway' }));
  recipes.forEach((b, i) => add(i === 0 ? 4 : 3, shotScript({ place: 'park', camera: { kind: 'establish' }, broll: { mode: 'cutaway', recipe: b.recipe } }, film), 'recipe:' + b.recipe.motion));
  const job = path.join(temp, 'job'); for (const f of ['cut', 'work', 'edit/graphics']) fs.mkdirSync(path.join(job, f), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=c=0x222222:s=640x360:r=30', '-f', 'lavfi', '-i', 'anullsrc=r=48000', '-t', String(cursor), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', path.join(job, 'cut/cut.mp4')]);
  fs.writeFileSync(path.join(job, 'job.json'), '{}'); fs.writeFileSync(path.join(job, 'edit/film-kit.js'), kitFor(film));
  fs.writeFileSync(path.join(job, 'cut/transcript.json'), JSON.stringify(scenes.map((s) => ({ text: 'test', start: s.start, end: s.start + s.seconds - 0.01 }))));
  const plan = scenes.map((s, i) => { const file = `edit/graphics/s${i}.html`; fs.writeFileSync(path.join(job, file), `<script>ZK.unit(root);\n${s.js}\n</script>`); return { row: i, uid: 's' + i, startWord: i, endWord: i, kind: 'graphic', mode: 'full-broll-takeover', file, transition: 'cut', captions: 'hide', cues: [] }; });
  fs.writeFileSync(path.join(job, 'edit/plan.json'), JSON.stringify({ version: 2, canvas: '1920x1080', kind: 'faceless', style: '2d-animation', theme: 'light', tokens: {}, captions: { on: false }, scenes: plan }));
  execFileSync(process.execPath, [path.join(root, 'engine/compose/compose.mjs'), job], { stdio: 'pipe' });
  const hf = path.join(job, 'edit/hf'), gate = await checkBody(hf, { fps: 30 });
  assert.ok(gate.ok, gate.lines.slice(0, 12).join('\n'));
  const evidenceAt = process.argv.indexOf('--evidence'), evidence = evidenceAt >= 0 ? path.resolve(process.argv[evidenceAt + 1]) : null; if (evidence) fs.mkdirSync(evidence, { recursive: true });
  const o = await openPage(hf); const remote = []; o.page.on('request', (r) => { if (/^https?:/.test(r.url()) && !/^http:\/\/127\.0\.0\.1:/.test(r.url())) remote.push(r.url()); });
  await o.page.evaluate(() => { Math.random = () => { throw new Error('render used unseeded random'); }; });
  const svgNow = () => o.page.evaluate(() => { const t = window.__timelines.main.time(), clip = [...document.querySelectorAll('.clip[data-start]')].find((c) => c.querySelector('svg') && t >= +c.dataset.start && t < +c.dataset.start + +c.dataset.duration), svg = clip?.querySelector('svg'); if (!svg) return null;
    const idp = Object.keys(window.__weather || {}).find((k) => svg.querySelector(`[clip-path*="${k}"]`)) || null, bb = (sel) => { const e = svg.querySelector(sel); if (!e) return null; const b = e.getBBox(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
    const html = svg.innerHTML, at = html.search(/NaN|undefined/);
    return { w: svg.viewBox.baseVal.width, h: svg.viewBox.baseVal.height, bad: at >= 0, badAt: at >= 0 ? html.slice(Math.max(0, at - 160), at + 40) : null, things: (svg.__world?.things || []).map((x) => ({ id: x.id, anchor: x.anchor, px: x.px, m: x.m })), weather: idp ? window.__weather[idp] : Object.values(window.__weather || {}).find((w) => w.view === 'sky' && svg.querySelector('[data-weather]') == null) || null,
      cup: bb('[data-phys="cup"]'), phone: bb('[data-phys="phone"]'), cloud: bb('[data-phys="cloud"]'), skyWeather: !!svg.querySelector('[data-weather-view]') ? 'window' : null,
      broll: (() => { const g = svg.querySelector('[data-broll]'); if (!g) return null; const k = Object.keys(window.__broll || {}).find((id) => g.ownerSVGElement === svg); return { mode: g.dataset.brollMode, display: g.getAttribute('display'), rec: Object.values(window.__broll || {}).find((r) => r.visible && r.box && Math.abs(r.box.w - (g.dataset.brollMode === 'pip_corner' ? svg.viewBox.baseVal.width * 0.34 : svg.viewBox.baseVal.width)) < 1) || null }; })() }; });
  const report = { scenes: [], walk: {} };
  try {
    for (const s of scenes) {
      await showAt(o.page, s.start + s.seconds * 0.5); await o.page.evaluate(() => { window.__weather = {}; window.__broll = {}; }); await showAt(o.page, s.start + s.seconds * 0.5 + 1 / 30);
      const r = await svgNow(); if (!r) console.error('scene errors:', JSON.stringify(await o.page.evaluate(() => window.__sceneErrors || [])).slice(0, 600));
      assert.ok(r && !r.bad, `${s.tag}: rendered invalid geometry ${r ? r.badAt : 'no svg on screen'}`);
      if (s.tag === 'bedroom-rain') {
        assert.ok(!r.things.some((x) => x.id === 'car'), 'no car in the bedroom'); const table = r.things.find((x) => x.id === 'table'); assert.ok(table && r.cup, 'table and cup drawn');
        const top = table.px.y - 0.75 * table.px.s; near(r.cup.y + r.cup.h, top, 0.06 * table.px.s, 'the cup stands on the table top'); assert.ok(r.cup.h <= ZPHYS.HEAD * table.px.s * 1.08, 'the cup is no bigger than a head');
        const chair = r.things.find((x) => x.id === 'chair'); assert.ok(chair && chair.anchor === 'ground', 'the chair is on the floor'); assert.ok(r.phone, 'the phone is in a hand');
        const w = await o.page.evaluate(() => Object.values(window.__weather).find((x) => x.view === 'window_weather_view')); assert.ok(w && w.streaks.length === 26, 'rain is seen through the window');
        const win = r.things.filter((x) => x.id === 'window').find((x) => Math.abs(w.glass.x + w.glass.w / 2 - x.px.x) < w.glass.w); assert.ok(win, 'the rain glass sits on a window in the world');
        assert.ok(w.glass.y > 0 && w.glass.y + w.glass.h < win.px.y && w.glass.w > 20 && w.glass.h > 20, 'the glass is above the window\'s floor point, on screen');
        for (const p of w.streaks) assert.ok(p.x >= w.glass.x - 0.5 && p.x <= w.glass.x + w.glass.w + 0.5 && p.y >= w.glass.y - 0.5 && p.y <= w.glass.y + w.glass.h + 0.5, 'every rain streak is inside the window glass');
        report.bedroom = { table: table.px, cupBottom: r.cup.y + r.cup.h, tableTop: top, streaks: w.streaks.length };
      }
      if (s.tag === 'park-rain') { assert.ok(r.things.some((x) => x.id === 'car'), 'the car stays in the park'); assert.ok(r.cloud && r.cloud.y + r.cloud.h < r.h * 0.5, 'the cloud is in the sky'); const w = await o.page.evaluate(() => Object.values(window.__weather).find((x) => x.view === 'sky')); assert.ok(w && w.drops === 5, 'outdoor rain falls over the place'); }
      if (s.tag.startsWith('template:')) { assert.ok(r.broll?.rec?.template === s.tag.slice(9) && r.broll.mode === 'cutaway' && r.broll.display === 'inline', `${s.tag} shows full frame`); }
      if (s.tag === 'pip') { const b = r.broll.rec; assert.equal(r.broll.mode, 'pip_corner'); near(b.box.w, r.w * 0.34, 1, 'card width'); assert.ok(b.box.x + b.box.w <= r.w && b.box.y >= 0 && b.box.y + b.box.h <= r.h * 0.5, 'the card sits in the top-right corner'); }
      if (evidence) await o.page.screenshot({ path: path.join(evidence, `${scenes.indexOf(s)}-${s.tag.replace(/[^a-z0-9_-]+/gi, '_')}.jpg`), type: 'jpeg', quality: 82 });
      report.scenes.push({ tag: s.tag, start: s.start, seconds: s.seconds });
    }
    // cutaway timing: full frame for at most 3 s, then the shot's place plays
    { const s = scenes.find((x) => x.tag === 'recipe:fall'); await showAt(o.page, s.start + 1); assert.equal((await svgNow()).broll.display, 'inline'); await showAt(o.page, s.start + 3.4); assert.equal((await svgNow()).broll.display, 'none', 'a cutaway ends after 3 s'); }
    // recipes obey gravity: falling and bouncing things never pass the ground and come to rest on it; immovable things stay put
    for (const s of scenes.filter((x) => x.tag.startsWith('recipe:'))) {
      let last = null; for (let t = 0.05; t < Math.min(s.seconds, 3) - 0.05; t += 1 / 30) { await showAt(o.page, s.start + t); const rec = await o.page.evaluate(() => Object.values(window.__broll || {}).find((r) => r.visible && r.props?.length)); if (!rec) continue; for (const p of rec.props) if (p.zone !== 'SKY_FLOATING') assert.ok(p.bottom <= p.groundY + 0.01, `${s.tag}: ${p.label} went below the ground`); last = rec; }
      for (const p of last.props) if (p.zone !== 'SKY_FLOATING') assert.equal(p.bottom, p.groundY, `${s.tag}: ${p.label} ends resting on the ground`);
      report.scenes.find((x) => x.tag === s.tag).props = last.props;
    }
    // foot slide: a heel or toe on the ground (within 0.3 U of the floor) must stay at the same screen x from frame to frame
    // (px at 1920 × 1080). The ankle is not the contact: the foot rolls heel → toe over it.
    for (const method of ['new', 'old']) {
      const s = scenes.find((x) => x.tag === 'walk-' + method), drift = [];
      let prev = null; for (let t = 0.3; t < s.seconds - 0.4; t += 1 / 30) {
        await showAt(o.page, s.start + t); const w = await o.page.evaluate(() => window.__walk), floor = Math.min(...['heelL', 'heelR', 'toeL', 'toeR'].map((k) => w.J[k].y));
        const down = Object.fromEntries(['heelL', 'heelR', 'toeL', 'toeR'].filter((k) => w.J[k].y <= floor + 0.3).map((k) => [k, w.X + w.J[k].z * w.k]));
        if (prev) for (const [k, x] of Object.entries(down)) if (k in prev) drift.push(Math.abs(x - prev[k]));
        prev = down;
      }
      const mean = drift.reduce((a, b) => a + b, 0) / drift.length; report.walk[method] = { contacts: drift.length, meanPx: +mean.toFixed(3), maxPx: +Math.max(...drift).toFixed(3) };
    }
    if (process.env.Z2D_DEBUG) console.error(JSON.stringify(report.walk));
    assert.ok(report.walk.new.maxPx < 1.5, `planted foot slides ${report.walk.new.maxPx} px/frame`);
    assert.ok(report.walk.new.meanPx * 4 < report.walk.old.meanPx, 'stride locking removes most of the old foot slide');
    assert.deepEqual(remote, [], 'renderer fetched a remote resource');
  } finally { await o.close(); }
  if (evidence) fs.writeFileSync(path.join(evidence, 'report.json'), JSON.stringify({ ...report, gate: { ok: gate.ok, frames: gate.frames, faults: gate.faults.length, notes: gate.notes } }, null, 2));
  console.log(`ok: ${scenes.length} scenes, ${gate.frames} real 30 fps frames through the body gate; window rain, props on surfaces, 25 templates, cutaway/pip, recipes rest on the ground; foot slide ${report.walk.new.meanPx} px/frame (was ${report.walk.old.meanPx})`);
} finally { if (!process.env.Z2D_KEEP) fs.rmSync(temp, { recursive: true, force: true }); else console.error("kept", temp); }
