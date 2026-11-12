import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
const tmp = fs.mkdtempSync(`${os.tmpdir()}/zancut-location-`);
process.env.ZANCUT_DATA = tmp;
const { locationIntent } = await import('../server/location-intent.mjs');
const B = await import('../server/brain.mjs');
const { planFromBrain } = await import('../server/brainplan.mjs');
try {
  const cases = [
    ['She remembered the mountain valley.', 'kitchen', 'kitchen', 'referenced-location'],
    ['She imagined the ocean.', 'classroom', 'classroom', 'referenced-location'],
    ['He discussed the village home.', 'office_room', 'office_room', 'referenced-location'],
    ['A picture of the forest lay on the table.', 'living_room', 'living_room', 'referenced-location'],
    ['A photo of a camel lay on the desk.', 'classroom', 'classroom', 'referenced-location'],
    ['সে সমুদ্রের ছবি আঁকল।', 'bedroom', 'bedroom', 'referenced-location'],
    ['সে বিদ্যালয়ের কথা মনে করল।', 'park', 'park', 'referenced-location'],
    ['সে সমুদ্রে যাওয়ার পরিকল্পনা করল।', 'living_room', 'living_room', 'referenced-location'],
    ['সে মরুভূমির গল্প বলল।', 'tea_stall', 'tea_stall', 'referenced-location'],
    ['In the kitchen, she remembered the mountain valley.', 'park', 'kitchen', 'current-location'],
    ['সে রান্নাঘরে বসে সমুদ্রের ছবি আঁকল।', 'park', 'kitchen', 'current-location'],
    ['He was walking toward the school.', null, 'village_road', 'destination-before-arrival'],
    ['She set off for the clinic.', 'office_room', 'city_street', 'destination-before-arrival'],
    ['সে বিদ্যালয়ে যাওয়ার পথে হাঁটছে।', 'bedroom', 'village_road', 'destination-before-arrival'],
    ['সে বাজারের দিকে রওনা হলো।', 'village_home', 'village_road', 'destination-before-arrival'],
    ['He was on his way to the market.', 'city_street', 'city_street', 'destination-before-arrival'],
    ['She wants to visit the forest.', 'bedroom', 'bedroom', 'referenced-location'],
    ['Tomorrow she will visit the beach.', 'park', 'park', 'referenced-location'],
    ['আগামী সপ্তাহে সে সমুদ্রে যাবে।', 'bedroom', 'bedroom', 'referenced-location'],
    ['She arrived in the classroom.', 'village_road', 'classroom', 'current-location'],
    ['He reached the market.', 'city_street', 'market_bazaar', 'current-location'],
    ['সে বিদ্যালয়ে পৌঁছাল।', 'village_road', 'school_yard', 'current-location'],
    ['সে শ্রেণিকক্ষে ঢুকল।', 'school_yard', 'classroom', 'current-location'],
    ['A dolphin swam near the beach.', null, 'sea_beach', 'current-location'],
    ['She spoke quietly.', 'park', null, null]
  ];
  for (const [text, before, place, reason] of cases) {
    const intent = locationIntent(text, { before });
    assert.equal(intent.place, place, text); assert.equal(intent.reason, reason, text);
  }
  // A deliberately conflicting classifier must not defeat explicit geography or reference scope.
  const model = B.train([{ text: 'A person waited quietly.', place: 'kitchen', action: 'idle', face: 'neutral', broll: 'none', graphic: 'none', cameraMove: 'steady' }], { heads: {}, epochs: 1 });
  B.save(model);
  for (const lines of [
    ['Mira waited in the kitchen.', 'She remembered the mountain valley.', 'She set off for school.', 'She arrived in the classroom.'],
    ['নাবিলা রান্নাঘরে দাঁড়াল।', 'সে সমুদ্রের কথা মনে করল।', 'সে বিদ্যালয়ের দিকে হাঁটছে।', 'সে শ্রেণিকক্ষে ঢুকল।']
  ]) {
    const film = planFromBrain('', { duration: 16, timed: lines.map((text, i) => ({ text, at: i * 4 })) });
    assert.deepEqual(film.plan.original.map(r => r.place), ['kitchen', 'kitchen', 'village_road', 'classroom']);
    assert.deepEqual(film.plan.receipts.map(r => r.place), ['kitchen', 'kitchen', 'village_road', 'classroom'], 'final shot geography retains the scoped decisions');
  }
  const film = planFromBrain('Mira waited in the classroom. She looked at a photo of a camel.', { duration: 8 });
  assert.ok(film.plan.original.every(r => r.place === 'classroom'), 'a pictured animal cannot move an established classroom to its habitat');
  console.log(`ok: ${cases.length} location-scope cases, two bilingual four-beat story routes, and depicted-animal continuity`);
} finally { fs.rmSync(tmp, { recursive: true, force: true }); }
