# Brief 7 — Acting cards: an emotion is a face, a body and a timing together

Give this whole file to the AI. Nothing else is needed.

---

## Your job

Zancut makes 2D cartoon films. Its people have a face with dials (eyebrows, eyelids, mouth) and a body with dials (lean, head
tilt, shoulders, arms). Today a feeling lives **only in the face**: a sad face sits on a normal standing body, and an expression
switches on in one frame. Real acting is the whole body, over time: sad means the head down, the shoulders dropping, everything
slower; joy rises, quickens and opens.

You write **acting cards**: for every feeling, the face values, the body values and the timing, for mild and strong, and how
age changes it. Plus the rules of where people look (gaze) and how one feeling turns into another. You write JSON numbers and
short plain notes. You do not draw or write code. Our engine reads your cards directly.

## The dials you set

**Face** (numbers; 0 = relaxed):
| dial | range | what it does |
|---|---|---|
| `smile` | −1 … 1 | mouth corners: −1 deep frown, 1 big smile |
| `raise` | −0.5 … 1.5 | both eyebrows up (+) or pulled down (−) |
| `inner` | −1 … 1 | inner ends of the brows: + lifted (worry, sadness), − pulled down and together (anger, focus) |
| `browL`, `browR` | −0.6 … 0.6 | extra lift of one brow only (doubt, scepticism, a raised eyebrow). L/R = the person's own left/right |
| `lid` | −0.35 … 1 | upper eyelids: − wide open (fear, surprise), 0.3 relaxed-heavy, 0.6 sleepy, 1 shut |
| `squint` | 0 … 1 | lower lids up (a real smile, suspicion, sun) |
| `open` | 0 … 1 | mouth open at rest (not talking) |
| `round` | 0 … 1 | mouth rounded ("oh") |
| `mouth` | name | a mouth shape on top of the dials: `rest`, `smileClosed`, `smileOpen`, `grin`, `laugh`, `frownClosed`, `pout`, `lipBite`, `tight` (pressed lips), `openO`, `trembling`, `smirkL`, `smirkR`, `yawn`, `teethClenched` |
| `look` | `[x, y]` −1 … 1 | eyes only: x − left / + right (the person's own), y − down / + up |
| `blinkRate` | per minute | normal ≈ 15; nervous more, focused fewer, sleepy slow long blinks |
| `blush`, `tears`, `sweat` | 0 … 1 | colour on the cheeks, wet eyes / a tear, a drop on the temple |

The engine's current faces, for reference (so your numbers stay in the same world):
```
neutral  { smile: 0.15, raise: 0.05, inner: 0,    lid: 0.08 }
happy    { smile: 1,    raise: 0.35, inner: 0,    lid: 0.15 }
sad      { smile: -0.5, raise: 0.45, inner: 0.9,  lid: 0.35 }
surprised{ smile: -0.1, raise: 1.5,  inner: 0,    lid: -0.35, open: 0.6 }
angry    { smile: -0.55,raise: -0.45,inner: -0.8, lid: 0.2 }
scared   { smile: -0.6, raise: 1.3,  inner: 1.0,  lid: -0.3, open: 0.35 }
worried  { smile: -0.35,raise: 0.7,  inner: 1.0,  lid: 0.05 }
tired    { smile: -0.15,raise: -0.1, inner: 0.4,  lid: 0.6 }
```

**Body** (degrees or −1 … 1; 0 = a relaxed natural stand):
| dial | range | what it does |
|---|---|---|
| `spinePitch` | −35 … 45 ° | the whole upper body leans forward (+) or back (−) from the hips |
| `chestLift` | −1 … 1 | chest up and open (+ proud, joy) or caved in (− sad, ashamed) |
| `shoulderLift` | −1 … 1 | shoulders up to the ears (+ fear, tension, a shrug) or dropped low (− sadness, tiredness) |
| `headPitch` | −45 … 50 ° | head nods down (+) or tips up (−) |
| `headYaw` | −75 … 75 ° | head turns (the person's own left −, right +); past 75 the chest turns too |
| `headRoll` | −30 … 30 ° | head tilts toward a shoulder (curiosity, tenderness, doubt) |
| `armSpread` | −25 … 65 ° | upper arms in to the body (−) or out from it (+) |
| `elbowZ` | −60 … 60 ° | extra elbow bend added to the pose |
| `hands` | name | where the hands go by default: `sides`, `front` (loosely in front of the belly), `clasped`, `chest`, `face`, `hips`, `behind`, `pockets`, `crossed` |
| `stanceWidth` | −6 … 20 | feet closer (−) or wider (+) |
| `weight` | −1 … 1 | weight on the left leg (−), even (0), right leg (+); hips swing toward that leg |
| `breath` | 0.5 … 2 | breathing speed (1 = calm) |
| `breathDepth` | 0 … 2 | how much the chest rises (sighs, sobs, panting) |
| `sway` | 0 … 1 | small idle movement while holding the feeling (fidget, rocking, trembling) |
| `tremble` | 0 … 1 | fast tiny shake (fear, cold, sobbing) |

**Timing** (seconds, or a multiplier):
- `speed`: how fast every movement plays while in this feeling (1 = normal; sad 0.7, excited 1.3).
- `onset`: how it starts, as beats: `notice` (the eyes and a tiny freeze before anything changes), `change` (face and body
  move into it), `settle` (a small overshoot that comes back), each in seconds. A surprise is a fast change; sadness a slow sink.
- `hold`: how long a strong version usually holds before easing to the mild one.
- `leads`: which part moves first, in order (`["eyes", "brows", "head", "shoulders", "chest", "hands"]`). Eyes nearly always lead.
- `ease`: `soft`, `snap` (fast in, soft settle), or `sink` (slow in, heavy end).

## The format: one file `acting.json`

```json
{
  "emotions": {
    "sad": {
      "aliases": ["unhappy", "sorrow", "low", "দুঃখী", "মন খারাপ"],
      "family": "sadness",
      "mild": {
        "face": { "smile": -0.3, "raise": 0.3, "inner": 0.6, "lid": 0.3, "look": [0, -0.3], "blinkRate": 10 },
        "body": { "spinePitch": 4, "chestLift": -0.3, "shoulderLift": -0.3, "headPitch": 10, "hands": "front", "weight": 0.3, "breath": 0.8 },
        "timing": { "speed": 0.8, "onset": { "notice": 0.2, "change": 0.9, "settle": 0.3 }, "hold": 0, "ease": "sink", "leads": ["eyes", "brows", "head", "shoulders", "chest"] }
      },
      "strong": { "face": { "...": "…" }, "body": { "...": "…" }, "timing": { "...": "…" } },
      "gestures": ["wipe_tears", "hand_on_chest", "head_in_hands"],
      "voice": "quiet, slower, falling at the ends of lines",
      "age": {
        "toddler": { "note": "cries openly, mouth wide, whole body", "strong": { "face": { "mouth": "laugh" }, "body": { "tremble": 0.5 } } },
        "child":   { "note": "…" },
        "teen":    { "note": "hides it: looks away, arms crossed" },
        "elder":   { "note": "still, slow; a hand to the face" }
      },
      "avoid": "a sad face on an upright, open body; a sudden switch"
    }
  },
  "transitions": [
    { "from": "happy", "to": "sad", "trigger": "bad news heard", "beats": [
      { "at": 0,   "what": "freeze: the smile stays, the eyes stop", "face": { "look": [0, 0] } },
      { "at": 0.3, "what": "the brows go first, the smile falls slowly", "face": { "inner": 0.5, "smile": 0.2 } },
      { "at": 1.2, "what": "head drops, shoulders sink, a breath out", "body": { "headPitch": 14, "shoulderLift": -0.4, "breathDepth": 1.4 } }
    ] }
  ],
  "gaze": { "...": "see below" },
  "ages": { "...": "see below" }
}
```
Give only the dials that change in each version: anything left out stays at its relaxed value.

## What we need

**The feelings** (each with `mild` and `strong`, ids as written):
- **P1**: `neutral`, `calm`, `listening`, `happy`, `joy`, `laughing`, `proud`, `relieved`, `excited`, `loving` (tender, warm),
  `grateful`, `hopeful`, `sad`, `grief`, `lonely`, `disappointed`, `worried`, `nervous`, `scared`, `shocked`, `surprised`,
  `confused`, `thinking`, `curious`, `determined`, `angry`, `annoyed`, `frustrated`, `embarrassed`, `shy`, `guilty`, `ashamed`,
  `tired`, `bored`, `sick`, `in pain`.
- **P2**: `jealous`, `disgusted`, `suspicious`, `smug`, `impatient`, `defeated`, `amazed` (awe), `peaceful` (prayer, quiet), `cold`, `hot` (heat), `hungry`, `sleepy`, `drunk on joy` (giddy), `respectful` (before elders, teachers: the Bangladeshi lowered gaze and soft hands).

**Transitions** (P1): 12 common changes with their beats: happy → sad (bad news), neutral → shocked, shocked → scared,
worried → relieved, sad → hopeful, angry → guilty, neutral → joy (good news), proud → embarrassed (praised in public),
thinking → determined (decides), scared → brave, angry → calm (a breath, cooling down), crying → smiling through tears.

**Gaze** (`gaze` object): plain rules with numbers we can turn into code:
- the eyes lead a head turn by how long, and the head leads the chest by how long; how far the eyes turn before the head joins;
- a listener looks at the speaker's face what part of the time, and where else (down when thinking, away when shy);
- how often the eyes dart while thinking or nervous, how far, how long each look holds;
- how a person looks at a thing they hold, at something far away, at someone taller (a child at a parent) or shorter;
- in a group: who people look at when someone new arrives or something happens (everyone turns, in what order);
- cultural notes for Bangladesh: lowering the gaze before elders, teachers, parents; how that differs by age and setting.

**Ages** (`ages` object): how acting changes, for `toddler`, `child`, `teen`, `adult`, `elder`: `speed` multiplier, how much they
fidget (`sway`), how big the gestures are, how long they hold a feeling, what they do while waiting, and 3 typical behaviours
each (a child swings its legs on a high seat and looks around a lot; an elder settles slowly and moves the head before the eyes).

## Quality bar

- Every card has the body, not just the face. If a feeling doesn't change the body much (`listening`), say so and keep it small.
- `mild` is not `strong` × 0.5: a mildly sad person stands almost normally with a heavier head; a strongly sad one has caved in.
- The numbers stay inside the ranges in the tables. A strong feeling uses the range; a mild one stays near the middle.
- Bangladeshi everyday acting, not exaggerated Western cartoon acting: big for children and comedy, quiet and real for adults
  and elders, respectful in faith moments.

## How to deliver

One folder: `acting.json` (valid JSON, no comments) and `NOTES.md` (anything the dials can't say, and new dials you wished
for, with what each would do).
