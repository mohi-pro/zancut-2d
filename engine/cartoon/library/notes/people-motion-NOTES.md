# Zancut 2D Motion Library — Brief 1 Delivery Notes (`1-people-motion`)

## 1. Validation Summary

- **Engine Check (`node selfcheck.js 1-people-motion`)**: **`READY`** (`0 errors`, `0 warnings`).
- **Continuous 24-Frame Gate**: Verified across all 4 biometric profiles (`adult`, `child`, `elderly`, `athletic`) at 15° phase intervals (`0°..360°`) for every action and across all supported base postures (`stand`, `sit`, `walk`) for every gesture.
- **Total Delivered Files**: **222 JSON files** across `actions/` (136), `gestures/` (58), and `hands/` (28).

| Category | Required P1 | Required P2 | Required P3 | Bonus Additions | Total JSON Files |
|---|---|---|---|---|---|
| **Actions (`actions/*.json`)** | 48 | 62 | 16 | 10 | **136** |
| **Gestures (`gestures/*.json`)** | 23 | 20 | 9 | 6 | **58** |
| **Hand Shapes (`hands/*.json`)** | 12 (6 base + 6 Back/Palm) | 10 | — | 6 | **28** |
| **Total** | **83** | **92** | **25** | **22** | **222** |

## 2. Complete Inventory by Group & Priority

### A. Actions (`actions/` — 136 files)

- **Locomotion (`group: "locomotion"`, 23 files)**:
  - **P1 (9)**: `walk_slow`, `walk_brisk`, `walk_tired`, `walk_happy`, `walk_sad`, `run_jog`, `run_sprint`, `walk_start`, `walk_stop`
  - **P2 (9)**: `walk_sneak`, `run_scared`, `walk_backwards`, `limp`, `walk_carry_heavy`, `walk_head_load`, `walk_cane` (`who: "elderly"`), `skip` (`who: "child"`), `hop_one_leg`
  - **P3 (4)**: `stairs_up` (rises +34 U over two 17×28 U steps), `stairs_down` (descends 34 U over two 17×28 U steps), `climb_ladder`, `swim_breaststroke`
  - **Bonus (1)**: `run_bouncy` (`who: "child"`, referenced in the "Ages and builds" section of `PROMPT.md`)
- **Standing & Idle (`group: "idle"`, 13 files)**:
  - **P1 (8)**: `idle_breathe`, `idle_weight_shift`, `arms_crossed`, `hands_on_hips`, `hands_behind_back`, `look_around`, `shrug`, `bow_greeting`
  - **P2 (5)**: `wait_impatient`, `lean_on_wall`, `stretch_yawn`, `shiver_cold`, `peek_around`
- **Sit & Stand (`group: "sit-stand"`, 20 files)**:
  - **P1 (9)**: `sit_down`, `stand_up`, `sit_idle`, `sit_lean_forward`, `sit_lean_back`, `sit_slumped`, `sit_floor_down`, `stand_up_floor`, `sit_cross_legged`
  - **P2 (9)**: `sit_on_heels`, `kneel_one_knee`, `kneel_down`, `squat_down`, `lie_down`, `get_up_bed`, `sit_rocking_worry`, `sit_down_slow` (`who: "elderly"`), `stand_up_slow` (`who: "elderly"`)
  - **Bonus (2)**: `swing_legs_seat` (`who: "child"`, referenced in the "Ages and builds" section of `PROMPT.md`), `squat_adda` (authentic Bangladeshi roadside/courtyard low squat while chatting and holding tea)
- **Daily Life & Work (`group: "work"`, 23 files)**:
  - **P1 (6)**: `sweep_floor`, `cook_stir`, `lift_box`, `carry_box`, `pedal_cycle`, `pull_rope`
  - **P2 (8)**: `push_cart`, `hoe_field`, `plant_seedling`, `row_boat`, `wash_clothes`, `fish_cast`, `hang_clothes`, `carry_water_pot`
  - **P3 (5)**: `hammer`, `saw_wood`, `paint_wall`, `pick_fruit`, `milk_cow`
  - **Bonus (4)**: `pump_tubewell` (pumping a Bangladeshi hand chapakol), `harvest_paddy` (cutting dhaan/paddy with a sickle), `grind_spices` (grinding spices on a flat shil-pata stone), `rickshaw_pull_stand` (standing on rickshaw pedals to climb a bridge/slope)
- **Play & Sport (`group: "play"`, 13 files)**:
  - **P1 (4)**: `kick_ball`, `throw_ball`, `jump_joy`, `celebrate_dance`
  - **P2 (6)**: `cricket_bat_swing`, `cricket_bowl`, `catch_ball`, `fly_kite`, `jump_rope`, `run_and_jump`
  - **P3 (3)**: `badminton_smash`, `football_header`, `swing_on_swing`
- **Feelings (`group: "feeling"`, 14 files)**:
  - **P1 (7)**: `laugh_big`, `cry_sob`, `angry_stomp`, `scared_flinch`, `relief_sigh`, `proud_chest`, `shy_sway`
  - **P2 (6)**: `tantrum` (`who: "child"`), `faint`, `trip_fall`, `get_up_after_fall`, `jump_scare`, `dejected_kneel`
  - **Bonus (1)**: `touch_feet_respect` (Bangladeshi *kadam bosi / pronam* — bending down respectfully to touch an elder's feet and bringing the hand to the chest/forehead)
- **Prayer (`group: "prayer"`, 5 files)**:
  - **P2 (5)**: `takbir_start`, `ruku_down`, `sajdah_down`, `jalsa`, `salam_turn` (note: `ruku` and `sajdah` static holds are built into `zancut-body-engine.js`)
- **Crowds (`group: "crowd"`, 9 files)**:
  - **P1 (5)**: `crowd_watch`, `crowd_cheer`, `crowd_clap`, `sit_audience`, `queue_wait`
  - **P2 (4)**: `march_protest`, `crowd_dance`, `market_browse`, `pray_congregation`
- **Two People Together (`group: "pair"`, 16 files / 8 synchronized pairs)**:
  - **P2 (10)**: `handshake_a` + `handshake_b`, `hug_a` + `hug_b`, `give_a` + `take_b`, `help_up_a` + `help_up_b`, `walk_together_a` + `walk_together_b`
  - **P3 (4)**: `carry_child_a` + `carry_child_b` (`who: "child"`), `push_wheelchair_a` + `sit_wheelchair_b`
  - **Bonus (2)**: `bless_head_a` + `bless_head_b` (an elder placing a blessing hand on a bowed younger person's head — *doa / ashirbad*)

### B. Gestures (`gestures/` — 58 files)

- **P1 (23)**: `wave_hello`, `wave_bye`, `point_at`, `beckon`, `raise_hand`, `clap`, `thumbs_up`, `hand_on_chest`, `chin_think`, `scratch_head`, `facepalm`, `cover_mouth_shock`, `hands_to_cheeks`, `talk_explain`, `talk_argue`, `offer_give`, `receive_take`, `phone_call`, `look_at_phone`, `drink_cup`, `eat_with_hand`, `salam_adab`, `munajat`
- **P2 (20)**: `wipe_tears`, `wipe_sweat`, `rub_hands`, `count_fingers`, `shake_fist`, `stop_palm`, `shh`, `cover_ears`, `both_hands_up`, `fist_pump`, `hug_open_arms`, `handshake_offer`, `take_photo`, `read_book`, `write_desk`, `type_laptop`, `hold_umbrella`, `carry_bag_strap`, `takbir`, `hands_folded_qiyam`
- **P3 (9)**: `throw_overarm`, `catch_both_hands`, `knock_door`, `push_door`, `pour_tea`, `stir_pot`, `tie_hair`, `fix_glasses`, `check_watch`
- **Bonus (6)**: `fan_hand` (fanning with a talpata hand fan), `drink_tea_tong` (lifting and blowing steam off a hot glass of tong tea), `adjust_dupatta_sari` (adjusting anchol/orna over the left shoulder), `ask_what_why` (South Asian palm-up "what/why?" flick), `dismiss_wave` (playful/dismissive wrist flick), `count_tasbih` (rolling prayer beads at chest/waist level)

### C. Hand Shapes (`hands/` — 28 files)

- **P1 Base & Dual-View Variants (12)**: `relaxed`, `relaxedBack`, `relaxedPalm`, `grip`, `gripBack`, `gripPalm`, `pinch`, `pinchBack`, `pinchPalm`, `cupped`, `cuppedBack`, `cuppedPalm`, `thumbsUp`, `openSide` *(Note: `rest`, `open`, `point`, `fist`, `pencil`, `phone`, `drape` are built into `zancut-body-engine.js`)*
- **P2 (10)**: `peace`, `ok`, `claw`, `countTwo`, `countThree`, `countFour`, `countFive`, `holdStrap`, `pointUp`, `flatPalmOut`
- **Bonus (4)**: `eatBite` (fingers gathered to hold a morsel of rice), `salamHand` (respectful curved greeting hand), `teaCupPinch` (delicate hold on a small glass teacup), `caneGrip` (curved grip over the top of a walking stick)

## 3. Technical & Biomechanical Notes

1. **Profile-Invariant Reach & Joint Angles**: Because `ZANATOMY.pose` scales lateral `x` by `scaleWidth` (`1.18` in `athletic`) and `y, z` by `scaleY` (`1.05` in `athletic`), all arm and leg targets are solved with a safety margin and arc-subdivided keyframes (`Δu <= 0.16`) so linear interpolation between keys never triggers `H05` ("out of reach") or `H09` ("knee bends backwards") in any profile.
2. **Elderly Stoop Compensation (`kyphosisDeg: 14°`)**: In `elderly` profile, `rawPose` rotates `UPPER` joints forward by `14°` around the pelvis while `hip` and `knee` remain unrotated, shifting the spine frame `F.up` by `14°`. All floor-sitting, kneeling, and bending poses keep adult hip flexion `<= 142°` so that adding `14°` in `elderly` stays safely below `ROM.hipFlexMax` (`160°`).
3. **Child Hip-Carry Scaling (`carry_child_b`)**: `selfcheck.js` validates raw JSON bone lengths against the adult rest skeleton before applying profile scaling. Therefore, `carry_child_b.json` uses exact adult bone lengths with `pelvis` placed at `y = 125 U`; when the engine renders `carry_child_b` with `profile: "child"` (`scaleY: 0.72`), the child's pelvis scales from the floor to `125 × 0.72 = 90 U`, landing right on the adult's left hip in `carry_child_a`.
