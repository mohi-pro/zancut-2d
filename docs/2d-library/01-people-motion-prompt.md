# Brief 1 — People in motion: actions, gestures and hand shapes

Give this whole file to the AI that makes the library. It is complete on its own: everything it needs to know, with full
working examples in the appendix at the end. Optional, so it can check its own work: attach `engine/cartoon/anatomy.js`,
`engine/cartoon/hands.js` and `docs/2d-library/tools/selfcheck.js` from the Zancut repository (the check is described below).

---

## Your job

You are making the **motion library** for Zancut, an app that makes flat 2D cartoon films (Bangladeshi and global stories,
Bangla and English voices). Every person in a film is drawn by Zancut's own engine from one shared skeleton; the engine already
draws faces, hair, skin, clothes, shoes, hands and shading, and already keeps every bone its fixed length. **You deliver motion as
numbers, not pictures**: where the joints of the skeleton are at a few key moments of each action. Zancut does the rest (ages,
builds, clothes, views, drawing).

Three kinds of file:
1. **Actions**: the whole body (all 26 joints): walk tired, sit down on a chair, sweep the floor, fall and get up.
2. **Gestures**: one or both arms only, relative to the shoulder, laid on top of any action (standing, sitting or walking):
   drink tea, phone call, wave, scratch head.
3. **Hand shapes**: the outline of one hand in a pose (grip a cup, pinch a card, thumbs up), as SVG path data.

**No clothes, no drawings of people, no faces, no colours.** Clothes are chosen once per character at the start of a film (the
director's cast list) and the engine dresses the same skeleton the same way in every shot, so your motion works for anyone.

## The skeleton and its space

One unisex adult. Units are **U**; the adult stands about **189 U** to the top of the head (1 U ≈ 0.9 cm).

- **Floor** at `y = 0`. **+y is up**. **+z is the way the body faces** (forward). **The character's LEFT side is at −x**,
  its right side at +x. (So `shoulderL` has a negative x, `shoulderR` a positive x.)
- 26 joints, each `[x, y, z]`, with these parents (the bone runs from the parent to the joint):

| Joint | Parent | Bone length (U) |
|---|---|---|
| pelvis | — (the root) | — |
| lumbar | pelvis | 23.1 |
| thorax | lumbar | 28.2 |
| neckBase | thorax | 2.2 |
| neckTop | neckBase | 14.1 |
| head (centre of the skull) | neckTop | 14.0 |
| shoulderL / shoulderR | thorax | 22.1 |
| elbowL / elbowR | shoulder | 32.2 |
| wristL / wristR | elbow | 28.9 |
| handL / handR (middle of the palm) | wrist | 12.2 |
| hipL / hipR | pelvis | 12.4 |
| kneeL / kneeR | hip | 43.0 |
| ankleL / ankleR | knee | 41.2 |
| heelL / heelR | ankle | 7.1 |
| footL / footR (ball of the foot) | ankle | 16.8 |
| toeL / toeR | foot | 7.1 |

**The standing pose** (copy it as your starting point; it is also key 0 of the example in the appendix):
```json
{ "pelvis": [0, 95, 0], "lumbar": [0, 118, 2], "thorax": [0, 146, -1], "neckBase": [0, 148, 0], "neckTop": [0, 162, 2],
  "head": [0, 176, 3], "shoulderL": [-22, 144, -1], "shoulderR": [22, 144, -1], "elbowL": [-25, 112, -3], "elbowR": [25, 112, -3],
  "wristL": [-24, 84, 4], "wristR": [24, 84, 4], "handL": [-23, 72, 6], "handR": [23, 72, 6], "hipL": [-12, 92, 0], "hipR": [12, 92, 0],
  "kneeL": [-12, 49, 2], "kneeR": [12, 49, 2], "ankleL": [-12, 8, -2], "ankleR": [12, 8, -2], "heelL": [-12, 3, -7], "heelR": [12, 3, -7],
  "footL": [-13, 3, 14], "footR": [13, 3, 14], "toeL": [-13, 2, 21], "toeR": [13, 2, 21] }
```

## The body rules (every key, every moment in between)

These are Zancut's anatomy rules (H01–H21). The engine enforces the measurable ones, and `selfcheck.js` reports a break.
- **Bones never change length.** Keep each bone within ±5% of the table (the engine re-fits bones, so a wrong length means
  the pose you see is not the pose you wrote). A limb never stretches to reach: move the body instead.
- **Connected and natural**: knees bend forward only, elbows bend the natural way only, no joint flips or pops between keys.
  An elbow never folds tighter than 30°, a knee than 20°; a wrist bends at most 45°.
- **Head and spine**: the head turns at most 75° from the chest (further = turn the chest, hips and feet too); the neck bends at
  most 60° against the chest; no kink at the waist: the upper and lower spine differ by at most 50°.
- **Hips**: the thigh folds forward at most 160° from the trunk, goes back at most 30°, out to the side at most 45°. The upper
  arm goes back at most 60°.
- **Floor**: no joint below `y = 0`. A planted foot rests with its ankle at y ≈ 8, its heel at ≈ 3, its ball at ≈ 3, its toe at ≈ 2.
- **Planted feet never slide**: while a foot carries weight its `ankle`, `heel`, `foot` and `toe` keep exactly the same x and z
  in every key. Weight moves over the feet, not the feet under the weight.
- **Weight and balance**: the hips sit over the supporting foot (or between both feet); a lean forward is balanced by the hips
  going back. Every move has its preparation (a dip, a lean, a wind-up), the action, and a settle. Nothing snaps.
- **Sitting**: the seat is drawn by the scene. On a chair the seat top is at y = 45.5 and the hip joints sit 2.5 above it
  (y ≈ 48). On the floor the hips sit at y ≈ 12–16. Say `"seat": true` (a chair) or `"floorSit": true` in the file.
- **Arms at rest** hang close to the body with a soft elbow. A raised arm has a reason and a target. A hand near the face never
  covers the person's own face (a raised hand comes up forward and outside the head).
- **Keys close enough**: the engine moves each joint in a straight line from one key to the next and then fits the bones. For a
  big move (sit down, bend, throw) put a key at least every 0.2 of the action, or the arms and legs shorten in between
  (`selfcheck.js` reports it as H05 "out of reach").
- **Loops** (walk, run, idle breathing, clapping, sweeping) end exactly where they begin, so key `u: 1` is not written: the
  loop runs from the last key back to the first. A walk or run is done **in place** (the hips do not travel): Zancut moves the
  person along the ground from the length of the stride, so the feet land where the body is.

## Ages and builds: deliver the adult

The engine makes a child (4.5 heads tall, scale 0.72), an elderly person (a 14° stoop, a little shorter) and a broad adult from
the same numbers, so deliver every action **once, for the unisex adult**. Add a separate file only when the motion itself is
different, not just the size:
- **child-only** (`"who": "child"`): skipping, a tantrum, swinging legs on a high seat, a bouncy run;
- **elderly-only** (`"who": "elderly"`): a slow sit with a hand on the knee, a walk with a cane, standing up in two efforts;
- a **mood variant** of a common action is its own id: `walk_tired`, `walk_happy`, `walk_sneak`.

## The file formats

**An action** (`actions/<id>.json`, the file name is the id):
```json
{
  "id": "sit_down",                      // snake_case, unique
  "about": "from standing in front of a seat down onto it: knees bend, weight back, settle",
  "group": "sit-stand",                  // one of the groups in the list below
  "aliases": ["sits", "takes a seat", "বসা"], // 3–8 other ways people say it: plain English words and Bangla (how it is searched)
  "seconds": 1.2,                        // how long it takes an adult at a normal pace
  "loop": false,                          // true = a cycle (walk, idle); then the last key is NOT u = 1
  "ease": "inOut",                       // "inOut" (soft start and stop) or "linear" (for loops)
  "seat": true,                           // optional: ends seated on a chair the scene draws (or "floorSit": true)
  "who": "any",                           // optional: "any" (default), "child", "elderly"
  "props": [],                            // leave empty: the scene draws chairs, tables and beds
  "keys": [
    { "u": 0, "joints": { "pelvis": [0, 95, 0], "...": "all 26 joints" }, "hands": ["rest", "rest"] },
    { "u": 0.2, "joints": { "...": "..." } },
    { "u": 1, "joints": { "...": "..." }, "hands": ["rest", "rest"] }
  ]
}
```
- `u` runs 0 → 1 over the action. Every key has all 26 joints. `hands` (optional) = `[left hand, right hand]` shape names from
  the hand list (`rest`, `open`, `point`, `fist`, `pencil`, `phone`, or one of yours); it switches at the halfway point
  between two keys.
- Optional `"headForward": [x, y, z]` on a key: where the face points (default forward `[0, 0, 1]`; looking down = `[0, -0.6, 0.8]`).

Every action and gesture also carries `"aliases"`: the other words a film script would use for it (English and Bangla, 3–8).
The library is searched by these words, so a part without them is hard to find.

**A gesture** (`gestures/<id>.json`): only the arms, as offsets **from that side's shoulder** (same axes, same units), so the
same gesture works on a standing, sitting or walking body. Write the arm(s) it moves; the other arm keeps what the action does.
```json
{
  "id": "raise_hand", "about": "the right hand comes up beside the head, palm open", "group": "arms",
  "seconds": 0.7, "loop": false, "on": ["stand", "sit", "walk"],
  "keys": [
    { "u": 0,   "arms": { "R": { "elbow": [3, -32, -2], "wrist": [2, -60, 5], "hand": [1, -72, 7] } }, "hands": ["rest", "rest"] },
    { "u": 0.5, "arms": { "R": { "elbow": [...], "wrist": [...], "hand": [...] } }, "hands": ["rest", "open"] },
    { "u": 1,   "arms": { "R": { "elbow": [...], "wrist": [...], "hand": [...] } }, "hands": ["rest", "open"] }
  ]
}
```
- Author one-handed gestures for the **right** arm; Zancut mirrors them for the left (`mirror`). Two-handed gestures write
  `"L"` and `"R"`. Offsets must respect the bone lengths: shoulder→elbow 32.2, elbow→wrist 28.9, wrist→hand 12.2.
- `"on"` lists the actions it was tested on.

**A hand shape** (`hands/<camelCaseName>.json`): one hand in **hand space**: the wrist centre at `0,0`, the hand runs toward
**+y** (fingers at about y 55–75), the **thumb on +x**, the wrist 26 wide (x from −13 to +13). Same format as `hands.js`
(the full example is in the appendix):
```json
{ "view": "back", "parts": [{ "d": "M-13,0 C-15,9 … 13,0", "open": true }],
  "lines": ["M-14,44 C-13,40 -13,38 -13.4,35"], "soft": [], "nails": [[x, y, rx, ry, rotateDeg]] }
```
- `parts`: closed outlines, one per overlapping mass (palm and folded fingers, a finger lying over a held thing, the thumb),
  starting and ending at the wrist; filled with skin. **No outlines** around the hand.
- `lines`: thin soft creases between fingers only (drawn faint). `nails`: small ellipses on visible fingertips.
- Four fingers and one thumb, the thumb on the correct side. `"view"`: `"back"` (the back of the hand to the viewer) or
  `"palm"`. For the most used shapes give both, named `gripBack` / `gripPalm`.

## What we need (the full list, by priority)

P1 = the first delivery (the most common moments in stories). P2 next, P3 later. Use these ids.

**Locomotion** (`group: "locomotion"`, loops in place unless noted)
- P1: `walk_slow`, `walk_brisk`, `walk_tired`, `walk_happy` (light bounce), `walk_sad` (head down, short steps), `run_jog`,
  `run_sprint`, `walk_start` (from standing to the first stride, not a loop), `walk_stop` (from stride to standing, not a loop)
- P2: `walk_sneak` (tiptoe), `run_scared` (arms up, looking back), `walk_backwards`, `limp`, `walk_carry_heavy` (both arms
  holding a box at the belly), `walk_head_load` (both hands steadying a load on the head: very common in Bangladesh),
  `walk_cane` (`who: "elderly"`, cane in the right hand), `skip` (`who: "child"`), `hop_one_leg`
- P3: `stairs_up`, `stairs_down` (each step 17 U high, 28 U deep; not in place: the body rises, say so in `about`), `climb_ladder`, `swim_breaststroke`

**Standing and idle** (`group: "idle"`)
- P1: `idle_breathe` (loop, tiny chest and shoulder rise), `idle_weight_shift` (loop), `arms_crossed`, `hands_on_hips`,
  `hands_behind_back`, `look_around` (head and chest turn left and right), `shrug`, `bow_greeting` (a small polite bow)
- P2: `wait_impatient` (tapping a foot, loop), `lean_on_wall` (shoulder on a wall at the person's right), `stretch_yawn`,
  `shiver_cold` (loop), `peek_around` (lean sideways from behind something)

**Sit and stand** (`group: "sit-stand"`)
- P1: `sit_down` (chair), `stand_up` (chair), `sit_idle` (loop on a chair: breathing, small shifts), `sit_lean_forward`
  (elbows on knees, listening), `sit_lean_back` (relaxed), `sit_slumped` (sad, shoulders down), `sit_floor_down` (to
  cross-legged on the floor), `stand_up_floor`, `sit_cross_legged` (idle loop on the floor)
- P2: `sit_on_heels` (kneeling sit, also the prayer sitting), `kneel_one_knee`, `kneel_down`, `squat_down` (to pick something
  up and back), `lie_down` (from sitting on a bed edge to lying), `get_up_bed`, `sit_rocking_worry` (loop), `sit_down_slow`
  (`who: "elderly"`, a hand on the knee), `stand_up_slow` (`who: "elderly"`, two efforts)

**Arms, as gestures** (`gestures/`, `group: "arms"`; on stand, sit and walk unless the move needs a stance)
- P1: `wave_hello` (loop), `wave_bye` (loop), `point_at` (arm out, the hand's own `point`), `beckon` (come here),
  `raise_hand`, `clap` (loop, two hands), `thumbs_up`, `hand_on_chest` (sincere), `chin_think`, `scratch_head` (confused),
  `facepalm`, `cover_mouth_shock`, `hands_to_cheeks` (surprise), `talk_explain` (loop: one hand then the other opens and
  turns, as people talk), `talk_argue` (loop: sharp chops), `offer_give` (both hands forward, palms up, as giving a thing),
  `receive_take` (both hands come forward, take, come back), `phone_call` (phone at the ear, the `phone` hand),
  `look_at_phone` (phone in front of the chest), `drink_cup` (to the mouth and back), `eat_with_hand` (right hand from a plate
  at the belly to the mouth: how rice is eaten in Bangladesh), `salam_adab` (the right hand rises to the forehead, the
  Bangladeshi greeting), `munajat` (both hands up in front of the chest, palms up, in prayer)
- P2: `wipe_tears`, `wipe_sweat` (back of the hand across the forehead), `rub_hands` (excited, loop), `count_fingers`
  (counting on the fingers of the left hand with the right index), `shake_fist` (angry), `stop_palm` (palm out, "stop"),
  `shh` (index to the lips), `cover_ears`, `both_hands_up` (surrender or joy), `fist_pump` (victory), `hug_open_arms`,
  `handshake_offer`, `take_photo` (phone held up in both hands), `read_book` (book in both hands in front of the chest),
  `write_desk` (the `pencil` hand writing at desk height, seated), `type_laptop` (seated, loop), `hold_umbrella`,
  `carry_bag_strap` (a hand holding a shoulder strap), `takbir` (both hands to the ears, prayer), `hands_folded_qiyam`
  (right hand over the left on the chest, prayer)
- P3: `throw_overarm`, `catch_both_hands`, `knock_door`, `push_door`, `pour_tea` (a kettle in the right hand, pouring down),
  `stir_pot`, `tie_hair`, `fix_glasses`, `check_watch`

**Daily life and work, as actions** (`group: "work"`, the whole body moves)
- P1: `sweep_floor` (bent with a short broom, the Bangladeshi jharu, loop), `cook_stir` (standing at a stove, loop),
  `lift_box` (squat, grip, lift with a straight back), `carry_box` (loop, walking in place with the box), `pedal_cycle`
  (seated pedalling a bicycle or rickshaw: seat at y 85, pedals turning around a point 30 U in front and 40 U below the hips;
  loop), `pull_rope`
- P2: `push_cart` (loop), `hoe_field` (a kodal hoe, loop: lift and strike), `plant_seedling` (bent, both hands to the ground,
  loop), `row_boat` (seated, a paddle, loop), `wash_clothes` (squatting at a pond's edge, beating cloth, loop), `fish_cast`
  (cast a fishing rod), `hang_clothes` (reaching up to a line), `carry_water_pot` (a kolshi on the hip, walking in place)
- P3: `hammer`, `saw_wood`, `paint_wall`, `pick_fruit` (reaching up), `milk_cow` (squat)

**Play and sport** (`group: "play"`)
- P1: `kick_ball`, `throw_ball`, `jump_joy` (both arms up, loop of 1), `celebrate_dance` (a short happy dance, loop)
- P2: `cricket_bat_swing`, `cricket_bowl`, `catch_ball`, `fly_kite` (looking up, pulling the string, loop),
  `jump_rope` (loop), `run_and_jump`
- P3: `badminton_smash`, `football_header`, `swing_on_swing` (seated swing, loop)

**Feelings with the whole body** (`group: "feeling"`)
- P1: `laugh_big` (bending with laughter, loop), `cry_sob` (shoulders shaking, hands to the face, loop), `angry_stomp`,
  `scared_flinch` (recoil, arms up), `relief_sigh` (shoulders drop), `proud_chest` (stands taller, chin up), `shy_sway` (loop)
- P2: `tantrum` (`who: "child"`), `faint` (to the ground, safely), `trip_fall` (falling forward onto the hands),
  `get_up_after_fall`, `jump_scare` (startled jump back), `dejected_kneel`

**Prayer** (`group: "prayer"`, respectful and exact; the built-ins `ruku` and `sajdah` already exist)
- P2: `takbir_start` (from standing, hands to the ears, then folded), `ruku_down` (from standing into ruku and back up),
  `sajdah_down` (from standing to sajdah), `jalsa` (the sitting between sajdahs: `sit_on_heels`), `salam_turn` (seated, the head
  turns right then left)

**Crowds** (`group: "crowd"`): Zancut fills audiences, streets and markets with many small people who all use the actions in
this library, each a little out of step, so every crowd action must loop and read at a small size.
- P1: `crowd_watch` (standing, small head turns and weight shifts, loop), `crowd_cheer` (arms up and down, loop),
  `crowd_clap` (loop), `sit_audience` (seated on a chair or bench, watching, small moves, loop), `queue_wait` (standing in
  a line, shifting, looking ahead, loop)
- P2: `march_protest` (walking in place with a fist raised on the beat, loop), `crowd_dance` (simple group dance, loop),
  `market_browse` (stand, lean, look down at goods, loop), `pray_congregation` (standing in a row with hands folded, loop)

**Two people together** (`group: "pair"`): two files that play at the same time, one for each person. Write both for the
adult skeleton; each file says who its partner is and where the partner's pelvis stands relative to its own
(`"pair": { "with": "handshake_b", "partner": [x, z] }`, in U, in this file's space), so the hands meet exactly.
- P2: `handshake_a` + `handshake_b`, `hug_a` + `hug_b`, `give_a` + `take_b` (one hands a thing to the other: the giver's hand
  and the taker's hand meet at the same point at the same `u`), `help_up_a` + `help_up_b` (one pulls the other up from the
  ground), `walk_together_a` + `walk_together_b` (side by side, hands linked)
- P3: `carry_child_a` (an adult carrying a child on the hip) + `carry_child_b` (the child, written in the child's own units:
  the adult skeleton scaled by 0.72 from the floor), `push_wheelchair_a` + `sit_wheelchair_b`

**Hand shapes** (`hands/`, camelCase)
- P1: `relaxed` (the natural hanging hand, fingers a little curled: used for every arm at rest), `grip` (a closed grip round
  a handle, cup or stick, the hole through it about 7 U wide), `pinch` (thumb and index holding a flat card or sheet at its
  edge), `cupped` (palm up, fingers together, as in receiving or in prayer), `thumbsUp`, `openSide` (an open hand seen from
  its little-finger side, as in a handshake or a chop)
- P2: `peace` (V), `ok`, `claw` (scared or angry), `countTwo`, `countThree`, `countFour`, `countFive`, `holdStrap`, `pointUp`
  (the index up beside the face), `flatPalmOut` (stop)
- For P1 give both `…Back` and `…Palm` views where both are seen (grip, pinch, cupped).

## Quality bar: what makes it look like Zancut

- **Clear silhouettes**: in a side view the action reads from its outline alone (arms not hidden in front of the chest unless
  the action is that).
- **Weight**: anticipation before, follow-through after, a settle at the end. Heavy things are lifted with the legs.
- **Calm, real people**: no exaggerated cartoon squash and stretch, no rubber limbs. Children are lively, elderly people careful.
- **Respect**: prayer and greetings exactly as people do them; no mocking poses.
- **Seek-safe**: the action is fully described by its keys (no randomness).

## How to deliver

One folder: `actions/`, `gestures/`, `hands/`, one JSON file per item, named by its id. If the check files were attached, run
`node selfcheck.js <your folder>` (with `anatomy.js` and `hands.js` next to it) until it prints `READY`; if not, check
every key against the bone table and the rules by hand, and list in a
short `NOTES.md` anything you could not make or are unsure about. Start with P1, deliver it, then P2, then P3.

Zancut then checks it again in its real pages (`node scripts/library-check.mjs <folder>`): every action on a man, a woman, a
child and an elderly woman, in three views, through the frame-by-frame body gate, with a picture of everything.


---

## Appendix: complete, working examples (copy their exact shape)

These three files pass every check. Numbers are in the space described above.

**actions/sit_down.json** (a transition with 6 keys; the first key is the standing pose)
```json
{
  "id": "sit_down",
  "about": "from standing in front of a seat down onto it: knees bend, weight back, hands may touch the thighs, settle",
  "group": "sit-stand",
  "seconds": 1.2,
  "loop": false,
  "ease": "inOut",
  "props": [],
  "seat": true,
  "keys": [
    {"u":0,"joints":{"pelvis":[0,95,0],"lumbar":[0,118,2],"thorax":[0,146,-1],"neckBase":[0,148,0],"neckTop":[0,162,2],"head":[0,176,3],"shoulderL":[-22,144,-1],"elbowL":[-25,112,-3],"wristL":[-24,84,4],"handL":[-23,72,6],"hipL":[-12,92,0],"kneeL":[-12,49,2],"ankleL":[-12,8,-2],"heelL":[-12,3,-7],"footL":[-13,3,14],"toeL":[-13,2,21],"shoulderR":[22,144,-1],"elbowR":[25,112,-3],"wristR":[24,84,4],"handR":[23,72,6],"hipR":[12,92,0],"kneeR":[12,49,2],"ankleR":[12,8,-2],"heelR":[12,3,-7],"footR":[13,3,14],"toeR":[13,2,21]},"hands":["rest","rest"]},
    {"u":0.2,"joints":{"pelvis":[0,95,0],"lumbar":[0,116.3,9],"thorax":[0,143.8,14.8],"neckBase":[0,145.4,16.4],"neckTop":[0,158.7,21.2],"head":[0,172.2,25.1],"shoulderL":[-22,141.9,14.2],"elbowL":[-25,112.1,2.4],"wristL":[-24,83.3,0.4],"handL":[-23,71.3,-1.4],"hipL":[-12,92,0],"kneeL":[-12,49,2],"ankleL":[-12,8,-2],"heelL":[-12,3,-7],"footL":[-13,3,14],"toeL":[-13,2,21],"shoulderR":[22,141.9,14.2],"elbowR":[25,112.1,2.4],"wristR":[24,83.3,0.4],"handR":[23,71.3,-1.4],"hipR":[12,92,0],"kneeR":[12,49,2],"ankleR":[12,8,-2],"heelR":[12,3,-7],"footR":[13,3,14],"toeR":[13,2,21]},"hands":["rest","rest"]},
    {"u":0.45,"joints":{"pelvis":[0,86.9,-4.9],"lumbar":[0,108.5,3.2],"thorax":[0,135.7,10.6],"neckBase":[0,137.3,12.2],"neckTop":[0,150.6,16.9],"head":[0,164.1,20.9],"shoulderL":[-22,133.8,10],"elbowL":[-26.7,102.9,2.3],"wristL":[-20.8,75.7,10],"handL":[-19.5,64.2,13.8],"hipL":[-12.1,84.3,-4.9],"kneeL":[-13.5,48.5,19],"ankleL":[-13.1,7.4,18.5],"heelL":[-13.1,2,13.8],"footL":[-14.2,3,34.6],"toeL":[-14.2,2.5,41.7],"shoulderR":[22,133.8,10],"elbowR":[26.7,102.9,2.3],"wristR":[20.8,75.7,10],"handR":[19.5,64.2,13.8],"hipR":[12.1,84.3,-4.9],"kneeR":[13.5,48.5,19],"ankleR":[13.1,7.4,18.5],"heelR":[13.1,2,13.8],"footR":[14.2,3,34.6],"toeR":[14.2,2.5,41.7]},"hands":["rest","rest"]},
    {"u":0.7,"joints":{"pelvis":[0,56.7,-12.5],"lumbar":[0,78.8,-5.9],"thorax":[0,105.2,4],"neckBase":[0,106.8,5.6],"neckTop":[0,120.2,10],"head":[0,133.6,14.3],"shoulderL":[-22,103.2,3.5],"elbowL":[-29.2,71.9,2.2],"wristL":[-17.3,54.7,22.1],"handL":[-16.1,48.6,32.6],"hipL":[-12.2,54.7,-12.5],"kneeL":[-15,48.8,30],"ankleL":[-14,7.8,34.7],"heelL":[-14,2,30.7],"footL":[-15.3,4.6,51.1],"toeL":[-15.3,4.9,58.2],"shoulderR":[22,103.2,3.5],"elbowR":[29.2,71.9,2.2],"wristR":[17.3,54.7,22.1],"handR":[16.1,48.6,32.6],"hipR":[12.2,54.7,-12.5],"kneeR":[15,48.8,30],"ankleR":[14,7.8,34.7],"heelR":[14,2,30.7],"footR":[15.3,4.6,51.1],"toeR":[15.3,4.9,58.2]},"hands":["rest","rest"]},
    {"u":0.85,"joints":{"pelvis":[0,49.9,-14],"lumbar":[0,72.1,-7.6],"thorax":[0,98.2,2.8],"neckBase":[0,99.9,4.3],"neckTop":[0,113.3,8.7],"head":[0,126.7,13.1],"shoulderL":[-22,96.3,2.2],"elbowL":[-29.7,65,2.2],"wristL":[-17,50.5,23.6],"handL":[-15.8,46,34.9],"hipL":[-12.2,48,-14],"kneeL":[-15.1,49,28.9],"ankleL":[-14,8.2,34.6],"heelL":[-14,2.2,30.8],"footL":[-15.3,5.1,51.1],"toeL":[-15.3,5.6,58.2],"shoulderR":[22,96.3,2.2],"elbowR":[29.7,65,2.2],"wristR":[17,50.5,23.6],"handR":[15.8,46,34.9],"hipR":[12.2,48,-14],"kneeR":[15.1,49,28.9],"ankleR":[14,8.2,34.6],"heelR":[14,2.2,30.8],"footR":[15.3,5.1,51.1],"toeR":[15.3,5.6,58.2]},"hands":["rest","rest"]},
    {"u":1,"joints":{"pelvis":[0,49.9,-14],"lumbar":[0,73,-14],"thorax":[0,101,-11.2],"neckBase":[0,103,-10.2],"neckTop":[0,117,-8.2],"head":[0,130.9,-6.2],"shoulderL":[-22,99,-11.2],"elbowL":[-29.7,68.9,-2.7],"wristL":[-17,60.9,22],"handL":[-15.8,59.7,34.1],"hipL":[-12.2,48,-14],"kneeL":[-15.1,49,28.9],"ankleL":[-14,8.2,34.6],"heelL":[-14,2.2,30.8],"footL":[-15.3,5.1,51.1],"toeL":[-15.3,5.6,58.2],"shoulderR":[22,99,-11.2],"elbowR":[29.7,68.9,-2.7],"wristR":[17,60.9,22],"handR":[15.8,59.7,34.1],"hipR":[12.2,48,-14],"kneeR":[15.1,49,28.9],"ankleR":[14,8.2,34.6],"heelR":[14,2.2,30.8],"footR":[15.3,5.1,51.1],"toeR":[15.3,5.6,58.2]},"hands":["rest","rest"]}
  ]
}
```

**gestures/raise_hand.json** (the right arm only, offsets from the right shoulder)
```json
{
  "id": "raise_hand",
  "about": "the right hand comes up beside the head, palm open, as a pupil asks to speak",
  "group": "arms",
  "seconds": 0.7,
  "loop": false,
  "on": [
    "stand",
    "sit",
    "walk"
  ],
  "keys": [
    {"u":0,"arms":{"R":{"elbow":[3,-32,-2],"wrist":[2,-60,5],"hand":[1,-72,7]}},"hands":["rest","rest"]},
    {"u":0.5,"arms":{"R":{"elbow":[22.1,-19.9,12.7],"wrist":[19.5,-19.5,23.5],"hand":[19.5,-19.5,27.5]}},"hands":["rest","open"]},
    {"u":1,"arms":{"R":{"elbow":[29.2,-7.7,11.3],"wrist":[29,21,14],"hand":[30,33,16]}},"hands":["rest","open"]}
  ]
}
```

**hands/fistExample.json** (the closed fist, in hand space; a new shape uses the same fields)
```json
{
  "view": "back",
  "parts": [{"d":"M-13,0 C-15,9 -18,18 -19,28 C-19.8,36 -18,42 -14,44 C-12,47 -6,48 -4,45.6 C-2.4,49 4,49.6 5.6,46.4 C7.4,49.4 13,49 14.6,45 C17.6,46 21,42 21.2,36 C21.4,28 19.4,18 18,12 C16.6,7 15,3 13,0","open":true}],
  "lines": ["M-14,44 C-13,40 -13,38 -13.4,35","M-4,45.6 C-4,41.4 -4,39 -4.4,36","M5.6,46.4 C5.8,42.4 5.6,39.6 5.2,37","M14.6,45 C16,38 16.6,28 15.8,19"],
  "soft": ["M-17.8,36.6 q2.6,-2.6 5.2,0","M-9.6,37.8 q2.8,-2.8 5.6,0","M-0.6,38.4 q2.8,-2.8 5.6,0","M8,37.6 q2.6,-2.6 5.2,0","M-17,41.6 C-10,43.6 4,44 14.4,41.4"],
  "nails": []
}
```
