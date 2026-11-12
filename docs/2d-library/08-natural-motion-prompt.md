# Brief 8 — Natural motion: a relaxed body, feelings in the body, using things, touching people

Give this file to the AI together with the people-motion brief (`01-people-motion-prompt.md`: the skeleton, the body rules and
the file formats live there) and the same check files (`zancut-body-engine.js`, `selfcheck.js`). This brief adds to it; where
they differ, this one wins.

---

## Your job

The first library delivery moves correctly but looks stiff. The standing pose the engine started from has **straight arms
with no elbow bend, both sides exactly alike, the weight on both legs and no breath**, and actions that hold or reach push both
arms straight out at the camera. Feelings live only in the face. People touch things and each other without knowing where the
handle, the seat or the other person's shoulder is.

You make new actions, in exactly the action format of the people-motion brief (26 joints per key, units U, floor `y = 0`, +z
forward, the character's left at −x), with three additions below (`rest`, `contacts`, `sounds`). Run `selfcheck.js` on your
folder until it prints READY.

You do **not** need to redo the old actions: the engine will lay the relaxed arms below over any action that leaves the arms at
rest. Make the actions in the list.

## A natural rest (the rules every action follows from now on)

- **Soft elbows**: hanging arms bend a little at the elbow (the inside angle 160–170°, never 180°); the hands hang beside and a
  little in front of the thighs, the palms facing the legs, the fingers relaxed (`rest`).
- **The two sides differ**: the left and right arm are never mirror copies (a few U different in height, bend and forward
  position); one hand may rest a little further forward.
- **Weight on one leg** (contrapposto): the hip of the standing leg is a little higher and out to that side, that knee straight,
  the other knee softly bent with its heel a little lifted or its foot turned out; the shoulders tilt the other way, slightly.
- **Breathing**: in a held pose the thorax rises 0.6–1.2 U and the shoulders 0.3–0.6 U, about once every 3–4 s (a loop).
- **Arms toward the camera**: a hand more than 35 U in front of its shoulder (+z) for longer than 0.5 s is wrong, unless the action
  is reaching, holding out, pointing, giving or pushing something. Mark those actions `"reach": true`. Holding something in
  front of the body (a cup, a phone, a book) keeps the elbows at the sides and the forearms angled in toward the belly or chest: hands 20–32 U in front.
- **Movement**: anticipation before a big move (a small move the other way first), follow-through after it (the arms and the
  head arrive a beat after the body and overshoot a little), and a settle. No key may jump: the selfcheck flags a joint moving
  more than 40 U between frames.

## The three new fields

```json
{
  "id": "pick_up_floor",
  "about": "bends the knees and back, the right hand takes a thing from the floor in front, stands up holding it at the belly",
  "group": "object",
  "aliases": ["picks up", "lifts from the ground", "তুলে নেয়"],
  "seconds": 1.6, "loop": false, "ease": "inOut",
  "rest": false,
  "reach": true,
  "contacts": [
    { "from": 0.45, "to": 1, "joint": "handR", "on": "item.grip" },
    { "from": 0, "to": 0.45, "joint": "handR", "near": "item.grip", "note": "the hand goes to it" }
  ],
  "sounds": [ { "u": 0.48, "what": "pick up", "on": "item" } ],
  "keys": [ "…as in the people-motion brief…" ]
}
```
- `rest`: `true` for an idle or a held pose that follows the natural-rest rules (the engine uses these as the default stand).
- `contacts`: which joint touches what, from `u` to `u`. `on` = it really touches (the engine pins it there); `near` = it moves
  toward it. The target is either `item.<contact>` (a contact of the thing being used, named as in the sizes brief: `grip`,
  `handle`, `seat`, `top`, `doorHandle`, `entry`, `strap`, `head` of an animal…) or `partner.<joint>` for two people
  (`partner.shoulderL`, `partner.handR`). Write the keys for an adult and a thing of the usual size; the engine bends the arm to the
  real contact for other sizes (a child, a higher table), so the contact list matters more than the exact numbers.
  `floor` is a target too (a hand on the floor, a knee on the floor).
- `sounds`: what makes a sound and at which `u` (a footstep is not needed: walks get their steps from the feet). Plain words:
  `pick up`, `put down`, `door open`, `cloth rustle`, `sit on wood`, `clap`, `slap knee`, `pat`, `kiss on forehead`, `thud`.

## What we need (ids as written; a pair is two files `_a` and `_b`)

**Rest and idle** (`group: "idle"`, all loops, `rest: true`)
- P1: `rest_stand_a`, `rest_stand_b`, `rest_stand_c` (three different relaxed stands: weight left, weight right, hands loosely
  in front), `rest_listen` (head a little forward, small nods), `rest_wait` (weight shifts every few seconds), `rest_sit_chair`,
  `rest_sit_floor` (cross-legged), `rest_sit_bench` (hands on the knees or the bench)
- P1 by age: `rest_stand_child` (`who: "child"`: more fidget, looks around, weight shifts often), `rest_stand_elderly`
  (`who: "elderly"`: still, a slight stoop, hands clasped in front or behind)

**Feelings in the body** (`group: "emotion"`): each is the body of one acting card, held or moving into it
- P1: `sink_sad` (from rest into a sad stand: head and shoulders drop slowly, a breath out; ends held), `sad_idle` (loop),
  `rise_joy` (rises up on the toes, chest up, arms open a little), `joy_idle` (loop, light bounce), `startle_shock` (a small
  jump back, hands up near the chest, freeze), `fear_shrink` (shoulders up, arms in, a step back), `anger_tense_idle` (loop:
  fists, shoulders up, weight forward), `worry_hands` (wringing the hands in front, loop), `shy_turn` (half turn away, a hand
  to the neck or the dupatta end), `think_shift` (weight shift, a hand to the chin, looks up and aside), `relief_exhale`
  (shoulders drop, head back a little, a big breath out), `tired_slump_stand`
- P2: `brighten_up` (sad → hopeful: the head comes up first), `cry_quiet_stand` (no sobbing: one hand to the eyes), `pace_worry`
  (a few steps and back, loop), `proud_tall` (from rest: grows taller, chin up, hands on hips at the end)

**Noticing and turning** (`group: "look"`)
- P1: `notice_left`, `notice_right` (eyes first is the face's job; here the head turns, then the chest, then a foot steps
  round, ending facing that side: give `headForward` on every key), `look_up_high`, `look_down_low`, `look_back_over_shoulder`,
  `turn_to_partner` (a quarter turn toward someone at the side)

**Using things** (`group: "object"`, every one with `contacts` on `item.*`)
- P1: `pick_up_floor`, `pick_up_table`, `put_down_floor`, `put_down_table`, `hold_in_front` (both hands, a box or a tray),
  `hold_one_hand` (a cup or a phone at the chest, elbow bent), `give_one_hand` + `take_one_hand`, `give_two_hands` +
  `take_two_hands` (the respectful Bangladeshi way: right hand giving, left hand touching the right forearm), `open_door_push`,
  `open_door_pull`, `close_door`, `knock_and_wait`, `sit_down_bench`, `stand_up_bench`, `sit_down_low_stool` (piri/mora),
  `lean_on_wall_back`, `lean_on_counter` (elbows on a shop counter or a table top)
- P2: `get_into_rickshaw`, `get_out_rickshaw`, `get_into_cng`, `get_out_cng`, `get_on_bus` (steps up), `get_off_bus`,
  `ride_bicycle` (loop, seated), `put_on_bag_back`, `take_off_bag`, `open_umbrella`, `pour_from_jug`, `drink_from_glass`,
  `eat_rice_with_hand` (seated), `write_at_desk` (seated), `read_book_held`, `type_on_phone`
- P3: `lift_heavy_sack`, `carry_on_head` (a basket or a pot, one hand up to it), `pull_rickshaw_seat` (the puller, loop),
  `row_boat`, `draw_water_tubewell` (pumping the hand pump)

**People touching people** (`group: "pair"`, both files, with `pair.partner` and `contacts` on `partner.*`)
- P1: `hand_on_shoulder_a/_b` (comfort from the side), `hold_hands_walk_a/_b` (loop, side by side), `lead_by_hand_a/_b` (an
  adult leads a child: write both for adults, the engine fits the child; say which is the leader), `pat_back_a/_b`,
  `side_hug_a/_b`, `help_up_a/_b` (one pulls the other up from the floor), `guide_by_arm_a/_b` (a hand at the elbow, walking)
- P2: `salam_greet_a/_b` (right hands meet, left hands may cover), `touch_feet_salam_a/_b` (the younger bends to touch the
  elder's feet, the elder's hand on the head: respectful), `push_away_a/_b`, `pull_back_a/_b` (stopping someone),
  `wipe_tears_of_other_a/_b`, `carry_on_back_a/_b` (piggyback)
- P3: `hug_front_a/_b`, `forehead_kiss_a/_b` (a parent and a child), `arm_wrestle_a/_b` (seated at a table), `lift_child_up_a/_b`

## Quality bar

- Every action starts and ends close to a `rest_stand` (or `rest_sit_*` for seated ones), so they chain without a jump.
- Look at your own frames from the front and from the side: elbows never fully straight unless pushing or reaching, the two
  arms never identical, feet flat on the floor unless a heel is meant to lift.
- Every `contacts` entry is one a real person makes: a hand on a door handle at about hip height (100 U), a seat at 50 U, a table
  top at 80 U, a counter at 100 U, a child's hand at an adult's hip height.

## How to deliver

One folder with `actions/` (and `gestures/` if you made any), exactly as the people-motion brief says, P1 first, plus a
`NOTES.md`: what you were unsure of, and anything a feeling or a contact needed that the format could not say.
