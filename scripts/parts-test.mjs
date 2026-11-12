// The parts finder (server/parts.mjs), no AI: real phrases a director writes → the part that must come back in the top 3, the
// film parts file and the prompts carrying slices only. A miss is fixed in engine/cartoon/library/words.json, not here.
//   node scripts/parts-test.mjs
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findParts, placeParts, buildFilmParts, writeFilmParts, rowPartsText, placePartsText, partsIndex, skippedParts } from '../server/parts.mjs';

const I = partsIndex();
const assert_ = (ok, msg) => { if (!ok) { console.error(msg); process.exit(1); } };
if (I.parts.filter((p) => p.lib).length < 50 || I.parts.filter((p) => p.kind === 'action').length < 50) { console.log('parts test skipped: the library is not installed (engine/cartoon/library)'); process.exit(0); }
const CASES = [
  // moves
  ['old man sits on the bench', 'sit_down_slow|sit_audience|sit_down|sit_idle', 'elderly'], ['she sits down on the chair', 'sit_down'], ['he stands up from the chair', 'stand_up|rise'],
  ['grandfather stands up slowly', 'stand_up_slow', 'elderly'], ['grandmother walks with a stick', 'walk_cane', 'elderly'], ['boy runs happily to school', 'run_bouncy|run_jog|run|walk_happy', 'child'],
  ['walks in tired after work', 'walk_tired'], ['walks sadly home', 'walk_sad'], ['sneaks past quietly', 'walk_sneak'], ['runs away scared', 'run_scared'],
  ['climbs the stairs', 'stairs_up'], ['he collapses from the heat', 'faint'], ['trips and falls', 'trip_fall'], ['girl cries', 'cry_sob|wipe_tears'],
  ['laughs out loud', 'laugh_big'], ['stomps angrily', 'angry_stomp'], ['shrugs, he does not know', 'shrug'], ['jumps for joy', 'jump_joy|jump'],
  ['dances at the wedding', 'celebrate_dance|crowd_dance'], ['they hug', 'hug_a|hug_b|hug_open_arms'], ['they shake hands', 'handshake_a|handshake_b'],
  ['offers a cup of tea', 'offer_give|give_a|handover'], ['takes the report card', 'receive_take|take_b|handover'], ['gives the letter to Dada', 'offer_give|give_a|handover'],
  ['touches the feet of the elder', 'touch_feet_respect'], ['blesses the boy with a hand on his head', 'bless_head_a|bless_head_b'],
  ['prays namaz', 'takbir_start|pray_congregation|munajat|takbir'], ['raises hands in dua', 'munajat'], ['does sajda', 'sajdah_down'],
  ['farmer cuts paddy with a sickle', 'harvest_paddy'], ['plants rice seedlings', 'plant_seedling'], ['digs with a kodal', 'hoe_field'],
  ['pumps water at the tubewell', 'pump_tubewell'], ['carries a kolshi of water', 'carry_water_pot'], ['sweeps the yard', 'sweep_floor'],
  ['cooks and stirs the pot', 'cook_stir|stir_pot'], ['washes clothes at the pond', 'wash_clothes'], ['mother hangs washed clothes on the line', 'hang_clothes'], ['rows the boat', 'row_boat'],
  ['pedals the rickshaw', 'pedal_cycle|rickshaw_pull_stand'], ['flies a kite', 'fly_kite'], ['kicks the football', 'kick_ball'], ['bats in cricket', 'cricket_bat_swing'],
  ['writes homework at the desk', 'write_desk'], ['reads a book', 'read_book'], ['types on the laptop', 'type_laptop'], ['talks on the phone', 'phone_call'],
  ['scrolls the phone', 'look_at_phone'], ['waves goodbye', 'wave_bye'], ['waves hello', 'wave_hello|wave'], ['points at the board', 'point_at|point'],
  ['claps', 'clap|crowd_clap'], ['scratches his head, confused', 'scratch_head'], ['thinks with a hand on the chin', 'chin_think'], ['covers mouth in shock', 'cover_mouth_shock'],
  ['eats rice with her hand', 'eat_with_hand'], ['drinks tea at the stall', 'drink_tea_tong|drink_cup'], ['fans herself, it is hot', 'fan_hand'],
  ['raises his hand in class', 'raise_hand'], ['lies down in bed', 'lie_down|sleep'], ['the crowd cheers', 'crowd_cheer|cheer'], ['people wait in a queue', 'queue_wait'],
  ['দাদু বসে আছে', 'sit_down_slow|sit_audience|sit_idle|sit_down', 'elderly'], ['সালাম দেয়', 'salam_adab'],
  // things
  ['a CNG waits by the road', 'cngAuto'], ['a rickshaw passes', 'cycleRickshaw|rickshaw'], ['an ambulance with its siren', 'ambulance'], ['the local bus', 'localBus'],
  ['a hospital bed with saline', 'hospitalBed|dripStand'], ['the ceiling fan turns', 'ceilingFan'], ['an AC on the wall', 'splitAC'], ['the sofa in the drawing room', 'sofaSet|sofa'],
  ['the village tea stall', 'teaStall'], ['the tubewell in the yard', 'tubewell'], ['a clay chula with smoke', 'chula'], ['a mud house', 'mudHouse'],
  ['the school building', 'schoolFront|schoolTin'], ['the university campus', 'universityCampus'], ['a mosque', 'villageMosque|mosqueMinaret'], ['the river ghat', 'jetty|river'],
  ['rain falls', 'rainfall'], ['বৃষ্টি পড়ছে', 'rainfall'], ['a paddy field', 'paddyField'], ['the blackboard', 'blackboard'], ['mosquito net over the bed', 'mosquitoNet'],
  ['a cow grazes', 'cow'], ['crows sit on the wire', 'crowFlock|crow'], ['a street dog', 'streetDog'], ['a tiger in the forest', 'royalBengalTiger'], ['ducks swim in the pond', 'duck'],
  ['an owl at night', 'owl'], ['বাঘ', 'royalBengalTiger'], ['a flock of birds flies', 'flockOfBirds'], ['the hen pecks', 'hen'], ['a snake', 'cobra'], ['ছাগল', 'goat'],
  ['drinks tea from a glass', 'teaGlass|drink_tea_tong'], ['talks on the mobile phone', 'mobilePhone|phone_call'], ['reads a book', 'bookHeld|read_book'], ['raises the trophy', 'fist_pump|trophy'],
  ['gives him money', 'takaNotes|offer_give'], ['holds an umbrella in the rain', 'umbrella|hold_umbrella'], ['a hurricane lamp', 'lantern'], ['টাকা দেয়', 'takaNotes|offer_give'], ['the report card', 'reportCard'],
  ['the pharmacy', 'pharmacyFront'], ['a police station', 'policeStation'], ['the railway station', 'railStation'], ['a launch on the river', 'launch'], ['a cup of tea', 'cup'],
];
// a real film's needs where the search once went wrong (seated friends at a table): the right part first, or no wrong part offered
const SEATED_FILM = [['Fahad sits and leans forward in shock', 'sit_lean_forward'], ['finger resting on a line of a paper', 'tap_sheet'], ['Sadia turns a paper round and taps a line', 'tap_sheet'], ['Fahad holds a paper up, guilty look', 'hold_sheet|guilt_look_away'], ['hold paper up in front with both hands seated waist up', 'hold_sheet'], ['seated tapping a line on a paper', 'tap_sheet'], ['seated hands resting on table', 'hands_on_table|rest_sit_chair'], ['seated shocked leans forward', 'sit_lean_forward'], ['seated typing on a laptop', 'type_laptop|type_hands'], ['seated person laughing hard', 'sit_laugh_big']];
for (const [q, want] of SEATED_FILM) { const top = findParts(q, { seated: true }).motion[0]?.id; if (!new RegExp(`^(${want})$`).test(top)) { console.error(`seated need "${q}" → ${top}, wanted ${want}`); process.exit(1); } }
for (const [q, bad] of [['Fahad sits frozen, nervous', /^(pace|walk|run)/], ['Imran leans over to look at a paper', /^lean_on/], ['seated tapping a line on a paper', /^(sit_down|wait_)/]]) { const m = findParts(q, { seated: true }).motion; if (m.some((x) => bad.test(x.id))) { console.error(`seated need "${q}" offers ${m.map((x) => x.id)}`); process.exit(1); } }
assert_(findParts('finger resting on a line of a paper').motion.every((x) => !/^rest_stand/.test(x.id) || x.fit === 'near'), 'one matching word is not a close fit');
for (const [look, ban, need] of [['studyroom a small university study room with a table and shelves', /universityCampus|logPile|krishnachura|collegeFront|streetLamp|paddyStack/, ['table', 'chair']], ['fahadroom night a student bedroom with a desk and a laptop', /paddyStack|strawStack|streetLamp/, ['window']]]) { const ids = placeParts(look).map((x) => x.id); if (ids.some((i) => ban.test(i))) { console.error(`room "${look}" offers ${ids}`); process.exit(1); } for (const w of need) if (!ids.includes(w)) { console.error(`room "${look}" lacks ${w}: ${ids}`); process.exit(1); } }
// a scene that skipped a close part is named back; one that used it (by id, by ZS, or the sheet) is not
{ const list = [{ need: 'a', motion: [{ id: 'laugh_big', fit: 'close' }], things: [] }, { need: 'b', motion: [{ id: 'hold_sheet', fit: 'close' }], things: [] }, { need: 'c', motion: [], things: [{ id: 'table', fit: 'near' }] }];
  assert_(skippedParts(list, '').map((x) => x.need).join() === 'a,b', 'skipped: both close parts, never a near one');
  assert_(skippedParts(list, 'r.pose("laugh_big", 0); ZC.sheet(r, {})').length === 0, 'used parts are not named'); }
// first answer only: a builder with no AI takes the top motion (or the top thing), so these must be right first time, 100%
const FIRST = [
  ['Imran walks in with his backpack', 'm', 'walk|walk_happy|walk_confident'], ['he nods proudly', 'm', 'nod'], ['turns to the poster on the notice board', 'm', 'turn_to_partner|look_around|notice_left|notice_right'],
  ['gazes up through the leaves', 'm', 'look_up_high|look_up'], ['sprints right down the lane', 'm', 'run_sprint|run'], ['runs in from the left waving both arms', 'm', 'run|run_sprint|run_jog|wave|wave_hello|both_hands_up'],
  ['waves both arms', 'm', 'wave|wave_hello|both_hands_up|wave_bye'], ['leans forward asking', 'm', 'lean_forward|ask_what_why|talk_explain|sit_lean_forward'], ['chest out like a champion', 'm', 'proud_chest|proud_tall|hands_on_hips'],
  ['hides a smirk behind him', 'm', 'cover_mouth_shock|cover_mouth|shy_turn|hands_behind_back|rest_stand_a'], ['waits with open arms', 'm', 'hug_open_arms|both_hands_up|rest_wait'], ['press their lips to keep from laughing', 'm', 'cover_mouth_shock|cover_mouth|laugh_big|shy_turn'],
  ['the friends explode with laughter', 'm', 'laugh_big'], ['turns his baffled face, hands spread', 'm', 'shrug|ask_what_why'], ['leans back with a sly smirk', 'm', 'lean_back|rest_sit_bench|sit_lean_back|arms_crossed'],
  ['points lazily', 'm', 'point_at|point'], ['Tisha jumps up from the bench', 'm', 'stand_up_bench|stand_up|rise|jump'], ['presses her phone into his hand', 'm', 'give_one_hand|offer_give|handover|give_a'],
  ['points proudly into the phone', 'm', 'point_at|point'], ['stares at the phone, jaw falling', 'm', 'look_at_phone|startle_shock|cover_mouth_shock'], ['lifts his head at Mohi', 'm', 'look_up_high|look_up|notice_left|notice_right|turn_to_partner'],
  ['seals his lips', 'm', 'shh|cover_mouth'], ['leans in rubbing his fingers', 'm', 'rub_hands|count_fingers'], ['pulls Mohi up by the wrist and hurries right', 'm', 'lead_by_hand_a|guide_by_arm_a|pull_back_a|help_up_a|run|walk_fast|walk'],
  ['Mohi digging in to his biriyani', 'm', 'eat_with_hand|eat_rice_with_hand'], ['taps the table with one finger', 'm', 'point_at|point|tap_table'], ['nodding hard', 'm', 'nod'],
  ['raises his spoon and winks', 'm', 'eat_with_hand|eat_rice_with_hand|raise_hand|thumbs_up'], ['rests his chin on his hand and sighs', 'm', 'chin_think|sit_chin_hand|tired_slump_stand'], ['scrolls with one finger', 'm', 'look_at_phone|type_on_phone|type_laptop'],
  ['clicks post on the laptop', 'm', 'type_laptop'], ['slowly nodding', 'm', 'nod'], ['jaw set, starts to rise', 'm', 'stand_up|rise|stand_up_bench|stand_up_slow'],
  ['fist in the air, chest thumped', 'm', 'fist_pump|cheer'], ['Mohi gives a thumbs up', 'm', 'thumbs_up'], ['Tisha clapping', 'm', 'clap'], ['holds the bill up to the camera', 'm', 'hold_in_front|both_hands_up|offer_give|raise_hand'],
  ['freezes with a half-raised fist', 'm', 'fist_pump|shake_fist|startle_shock'], ['Mohi howling with laughter', 'm', 'laugh_big'], ['the three friends wave', 'm', 'wave|wave_hello|wave_bye'],
  ['sits on the bamboo bench', 'm', 'rest_sit_bench|sit_down_bench|sit_idle|sit_down'], ['drinks tea', 'm', 'drink_tea_tong|drink_cup|drink_from_glass'], ['he is shocked', 'm', 'startle_shock|cover_mouth_shock|jump_scare'],
  ['she cries quietly', 'm', 'cry_quiet_stand|cry_sob|wipe_tears'], ['they hug', 'm', 'hug_a|hug_front_a|hug_open_arms'], ['he waits', 'm', 'rest_wait|idle_breathe|idle_weight_shift'], ['leans over the table tapping it with one finger', 'm', 'point_at|point|sit_lean_peek'], ['he clicks post', 'm', 'type_laptop'], ['presses her phone into a startled Imran\'s hand', 'm', 'give_one_hand|offer_give|handover|give_a'],
  // things
  ['a sunny campus lane', 't', 'universityCampus'], ['the notice board', 't', 'noticeBoard|billboard'], ['the tea stall', 't', 'teaStall'], ['a bamboo bench', 't', 'bench|bambooBench'],
  ['a steaming biriyani table', 't', 'restaurantTable|diningTable|plateOfRice|biryaniPot'], ['his laptop', 't', 'laptop'], ['an iPhone', 't', 'mobilePhone|phone|smartphone'], ['the wall calendar', 't', 'wallCalendar'],
  ['a mug on the desk', 't', 'mug|cup|teaCup'], ['the bill', 't', 'paper'], ['his backpack', 't', 'backpack|schoolBagHeld'],
];
const firstMiss = [];
for (const [q, k, want] of FIRST) {
  const r = findParts(q), top = (k === 'm' ? r.motion : r.things)[0]?.id, wants = want.split('|');
  if (!wants.includes(top)) firstMiss.push(`"${q}" wanted ${want}, got ${top || 'nothing'} (then ${(k === 'm' ? r.motion : r.things).slice(1, 3).map((x) => x.id).join(', ')})`);
}
console.log(`first answer: ${FIRST.length - firstMiss.length}/${FIRST.length}`);
for (const m of firstMiss) console.log('  first:', m);

let ok = 0; const miss = [];
for (const [q, want, who] of CASES) {
  const r = findParts(q, { who }), ids = [...r.motion.slice(0, 3), ...r.things.slice(0, 3)].map((x) => x.id), wants = want.split('|');
  if (ids.some((id) => wants.includes(id))) ok++; else miss.push(`"${q}" wanted ${want}, got ${ids.join(', ') || 'nothing'}`);
}
const rate = ok / CASES.length;
console.log(`search: ${ok}/${CASES.length} found in the top 3 (${Math.round(rate * 100)}%)`);
for (const m of miss) console.log('  miss:', m);
const fail = []; const must = (c, m) => { if (!c) fail.push(m); };
must(rate >= 0.9, `under 90% (${Math.round(rate * 100)}%)`);
must(!firstMiss.length, `${firstMiss.length} first answers wrong (a builder with no AI takes the first one)`);
// nothing close: says so (the designer authors it)
must(findParts('a spaceship lands on mars').none || findParts('a spaceship lands on mars').motion.every((x) => x.fit === 'near'), 'a thing the library lacks is not marked none/near');
// places: the things that go together
const village = placeParts('village courtyard with a mud house').map((x) => x.id);
must(['mudHouse', 'courtyard', 'chula', 'tubewell'].every((id) => village.includes(id)), `village courtyard pieces: ${village}`);
const ward = placeParts('hospital ward, white walls, morning light').map((x) => x.id);
must(ward.includes('hospitalBed') && ward.includes('dripStand') && !ward.includes('streetLamp'), `hospital ward pieces: ${ward}`);
// any room: the word "room" alone never brings another room's furniture, a room inside a building never brings its front
for (const [look, need, ban] of [
  ['interview room with a table', ['meetingTable', 'chair', 'door'], /sofaSet|tvStand|fridge/],
  ['conference room', ['chair', 'door'], /sofaSet|tvStand|fridge/],
  ['doctor chamber', ['chair', 'door'], /Front|ambulance/],
  ['lawyer chamber', ['chair', 'door'], /Front|ambulance|hospitalBed/],
  ['HR manager cabin', ['officeDesk', 'chair'], /Front/],
  ['gym', ['weightBench', 'dumbbellRack'], /sofaSet/],
  ['hair salon', ['salonChair', 'mirror'], /sofaSet/],
  ['bakery', ['bakeryShelf'], /sofaSet/],
  ['warehouse', ['metalRack', 'cartonStack'], /sofaSet/],
  ['garage', ['metalRack'], /sofaSet/],
  ['stage auditorium', ['podium'], /sofaSet/],
  ['hotel lobby', ['door'], /Front/],
  ['tin shed room', ['table', 'chair', 'door'], /sofaSet|tvStand/],
  ['a room we have no words for', ['table', 'chair', 'door'], /sofaSet|fridge/],
  ['drawing room', ['sofaSet'], /fridge/],
]) { const ids = placeParts(look).map((x) => x.id), got = ids.join(' '); must(need.every((id) => ids.includes(id)) && !ban.test(got), `${look}: ${got}`); }
// a director's words that once found the wrong part: a friend watching is not arm wrestling, a laptop lid is not a door, a chat box is not a gift box, a room lamp is not a street lamp
for (const [need, not] of [['Sadia watches from across the table', /arm_wrestle/], ['closes a laptop', /close_door/], ['Mohi half closes a laptop and turns to Fahad', /close_door/], ['chat box', /giftBox|sweetBox/]]) { const f = findParts(need, { seated: true }, 3), got = [...f.motion, ...f.things].map((x) => x.id).join(' '); must(!not.test(got), `${need}: ${got}`); }
must(!placeParts('an old jetty on a river, palms on the far bank').some((x) => /bankFront|officeTower/.test(x.id)), 'a river bank is not a money bank');
must(!placeParts('a small office with a lamp').some((x) => x.id === 'lamp'), 'a street lamp offered for a room');
must(!placeParts('outside the hospital').length || placeParts('outside the hospital').some((x) => x.id === 'hospitalFront'), 'outside a building keeps its front');
must(!placeParts('inside a car').some((x) => x.id === 'table'), 'a vehicle is not a room');
for (const [need, id] of [['notice board with sticky notes', 'noticeBoard'], ['a whiteboard', 'whiteboard'], ['long interview table', 'meetingTable'], ['laptop open on a table', 'laptopSide']]) must(findParts(need).things[0]?.id === id && findParts(need).things[0].fit === 'close', `${need}: ${findParts(need).things[0]?.id}`);
for (const [need, id] of [['Mohi half closes a laptop', 'sit_close_laptop'], ['Sadia picks up a paper from the table', 'sit_pick_up_paper'], ['four friends laughing at a table', 'sit_laugh_big'], ['seated tapping a line on a paper', 'tap_sheet']]) must(findParts(need, { seated: true }).motion[0]?.id === id, `${need}: ${findParts(need, { seated: true }).motion[0]?.id}`);
// every id a place group names is in the library
{ const I = partsIndex(), miss = Object.entries(I.W.places).flatMap(([k, ids]) => ids.filter((id) => !I.byId.has(id)).map((id) => `${k}/${id}`)); must(!miss.length, `place groups name missing parts: ${miss}`); }
// a film: the parts file, slices per row and per place, the cast's age reaching the search
const sb = { film: { cast: [{ id: 'dada', name: 'Dada', spec: { age: 'elderly' } }, { id: 'tuhin', spec: { age: 'child' } }], places: [{ id: 'yard', look: 'village courtyard, a mud house, evening' }] },
  rows: [{ piece: 'custom', place: 'yard', people: ['dada', 'tuhin'], needs: ['Dada sits down on the bench', 'Tuhin gives Dada a cup of tea'] },
    { piece: 'custom', metaphor: 'Tuhin runs across the yard', design: 'Tuhin runs in from the left, then waves at Dada.' }, { piece: 'speaker' }] };
const fp = buildFilmParts(sb);
must(fp.rows[0]?.[0]?.motion?.[0]?.id === 'sit_down_slow', `Dada's sit is the elderly one: ${fp.rows[0]?.[0]?.motion?.map((x) => x.id)}`);
must(fp.rows[0]?.[0]?.things?.some((x) => x.id === 'bench'), 'the bench is found');
must(fp.rows[1]?.length > 0, 'a row without needs is searched from its design');
must(!fp.rows[2], 'a row that is not a drawn scene gets nothing');
must(fp.places.yard?.some((x) => x.id === 'mudHouse'), 'the place gets its pieces');
const text = rowPartsText(fp.rows[0]) + placePartsText(fp);
must(text.length < 2500, `the slices are small (${text.length} chars)`);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'parts-')); writeFilmParts(tmp, sb);
must(fs.existsSync(path.join(tmp, 'edit', 'film-parts.json')), 'film-parts.json is written'); fs.rmSync(tmp, { recursive: true, force: true });
// the prompts carry no whole list
const { directorSystem, builderSystem } = await import('../server/animation-guidance.mjs').catch(() => ({}));
if (builderSystem) {
  const p = { kind: 'animation', style: '2d-animation', format: 'vertical', lang: 'en' };
  let bs = '', ds = ''; try { bs = builderSystem(p); } catch {} try { ds = directorSystem ? directorSystem(p) : ''; } catch {}
  if (bs) must(!/badminton_smash|swim_breaststroke/.test(bs), 'the designers\' prompt still lists the whole library');
  if (ds) must(!/badminton_smash|swim_breaststroke/.test(ds), 'the director\'s prompt still lists the whole library');
}
if (fail.length) { for (const f of fail) console.log('FAIL', f); process.exit(1); }
// the thing itself must match for close: a shared describing word ("iron", "heavy") never makes a close part, and a weak one is dropped
for (const [q, bad] of [['iron handcuffs', 'gate'], ['heavy chain', 'lift_heavy_sack'], ['ring jewelry', 'parrot']]) { const r = findParts(q); const x = [...r.motion, ...r.things].find((y) => y.id === bad); if (x && x.fit === 'close') { console.error(`"${q}" calls ${bad} close`); process.exit(1); } if (bad === 'parrot' && x) { console.error('"ring jewelry" offers a parrot'); process.exit(1); } }
{ const r = findParts('coffee cup'); if (!r.things.some((x) => x.id === 'cup' && x.fit === 'close')) { console.error('"coffee cup" lost its cup'); process.exit(1); } }
console.log('ok: search, places, the film parts file and slices, no whole list in a prompt, the thing itself decides close');
