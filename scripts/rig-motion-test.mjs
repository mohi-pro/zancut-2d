// Numeric root/foot/ROM/temporal invariants for every gesture and the shared deterministic alive layer.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { freezeStats } from '../server/motionqa.mjs';
for (const f of ['hands.js', 'anatomy.js', 'people.js', 'bodies.js', 'rig.js']) await import(new URL('../engine/cartoon/' + f, import.meta.url));
const dir = new URL('../engine/cartoon/library/', import.meta.url), A = globalThis.ZANATOMY;
for (const file of fs.readdirSync(new URL('hands/', dir)).filter(f => f.endsWith('.json'))) {
  const id = file.slice(0, -5); if (!HANDS.POSES[id]) HANDS.addPose(id, JSON.parse(fs.readFileSync(new URL('hands/' + file, dir))));
}
const gestures = fs.readdirSync(new URL('gestures/', dir)).filter(f => f.endsWith('.json')).map(f => JSON.parse(fs.readFileSync(new URL('gestures/' + f, dir))));
gestures.forEach(g => A.addGesture(g));
const specs = [{ gender: 'male', age: 'adult' }, { gender: 'female', age: 'adult' }, { gender: 'male', age: 'child' }, { gender: 'male', age: 'elderly' }];
const lower = ['pelvis', 'hipL', 'hipR', 'kneeL', 'kneeR', 'ankleL', 'ankleR', 'heelL', 'heelR', 'footL', 'footR', 'toeL', 'toeR'];
let frames = 0, worst = { units: 0 };
for (const spec of specs) for (const mirror of [false, true]) for (const gesture of gestures) for (const duration of [Math.min(gesture.seconds * 1.35, 3.64), 0.5]) {
  const profile = ZPEOPLE.biometrics(spec).profile; let previous;
  for (let frame = 0; frame < 120; frame++) {
    const t = frame / 30, phase = ((t / 3.6) % 1) * 360, base = A.pose({ posture: 'stand', profile, phase });
    const ps = A.gestureAt('stand', t, { id: gesture.id, profile, mirror, phase, start: 0.18, duration });
    const alive = A.alivePose(ps, ZRIG.motion(t, JSON.stringify(spec), 0.7, true));
    for (const joint of lower) assert.deepEqual(alive.joints[joint], base.joints[joint], `${gesture.id}/${joint}: root or support moved`);
    const faults = A.check(alive).filter(f => f.rule !== 'H05');
    assert.deepEqual(faults, [], `${gesture.id}/${JSON.stringify(spec)}/mirror=${mirror} at ${t}: ${JSON.stringify(faults)}`);
    if (previous) for (const joint of A.JOINTS) {
      const p = previous[joint], q = alive.joints[joint], units = Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
      if (units > worst.units) worst = { units, gesture: gesture.id, joint, spec, mirror, t };
      assert.ok(units <= 40, `${gesture.id}/${joint}/${JSON.stringify(spec)}/mirror=${mirror}/duration=${duration}: ${units} U in one 30 fps frame`);
    }
    previous = alive.joints; frames++;
  }
  // Attack and release return to the exact base pose, with no lingering root/hand offset.
  for (const t of [0.18, 0.18 + duration]) {
    const phase = ((t / 3.6) % 1) * 360, ps = A.gestureAt('stand', t, { id: gesture.id, profile, mirror, phase, start: 0.18, duration });
    const base = A.pose({ posture: 'stand', phase, profile });
    for (const joint of A.JOINTS) for (const axis of ['x', 'y', 'z']) assert.ok(Math.abs(ps.joints[joint][axis] - base.joints[joint][axis]) < 0.05, `${gesture.id}: endpoint ${joint}.${axis}`);
  }
}
const motions = [0.1, 0.4, 1.2, 3.8, 7.1].map(t => ZRIG.motion(t, 'speaker', 0.6, true));
for (const [i, t] of [0.1, 0.4, 1.2, 3.8, 7.1].entries()) assert.deepEqual(ZRIG.motion(t, 'speaker', 0.6, true), motions[i]);
assert.equal(ZRIG.motion(2, 'speaker', 0.8, false).nod, 0);
assert.ok(ZRIG.motion(2, 'speaker', 0.8, true).nod > ZRIG.motion(2, 'speaker', 0.2, true).nod);
assert.notDeepEqual(ZRIG.motion(2, 'speaker'), ZRIG.motion(2, 'listener'));
for (const seed of ['a', 'b', 'child']) {
  const peaks = []; let previous = 0, previous2 = 0;
  for (let i = 0; i < 30 * 24; i++) {
    const blink = ZRIG.motion(i / 30, seed).blink;
    if (previous > 0.8 && previous > previous2 && previous >= blink) peaks.push((i - 1) / 30);
    previous2 = previous; previous = blink;
  }
  assert.ok(peaks.length >= 5, 'automatic blinking missing');
  for (let i = 1; i < peaks.length; i++) assert.ok(peaks[i] - peaks[i - 1] >= 2.76 && peaks[i] - peaks[i - 1] <= 4.24, `blink interval: ${peaks}`);
}
const malformed = A.pose({ posture: 'stand' }); malformed.joints.head.x += 1000;
assert.equal(A.alivePose(malformed, ZRIG.motion(1, 'bad')), malformed, 'alive motion must not repair and hide an authored defect');
assert.deepEqual(freezeStats('freeze_start: 1\nfreeze_end: 3\nfreeze_start: 8', 10).intervals, [[1, 3], [8, 10]], 'EOF freezes must count');
console.log(`ok: ${gestures.length} gestures × 4 profiles × 2 mirror states × normal/short duration, ${frames} numeric frames; root/feet/ROM/entry/exit/seek invariants; blinking and speech nods; worst delta ${worst.units.toFixed(2)} U/frame (${worst.gesture})`);
