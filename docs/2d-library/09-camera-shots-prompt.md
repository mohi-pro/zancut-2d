# Brief 9 — Camera: shot sizes, angles, moves, cuts, and which shot a story moment needs

Give this whole file to the AI. Nothing else is needed.

---

## Your job

Zancut makes 2D cartoon films (flat colour, no outlines) for Bangladesh and the world, mostly 9:16 phone videos, also 16:9.
An AI director plans the shots and code places the camera. Today the camera can only frame and slide over a flat front view,
so every film looks like one long medium shot.

You write the **camera rule book as data**: every shot size, angle, move and cut with exact numbers our code can use, how to
fake each angle in flat 2D, the rules a checker can test, and which shots tell which story moments. You write JSON and short
plain notes. You do not draw or write code.

## How our camera works (so your numbers fit)

- A place has a **ground** (the floor line), a **horizon line** (where the far ground meets the sky) and a **camera height** in
  metres. Things farther away are drawn smaller and higher, closer to the horizon. Sizes are real (a door 2.05 m, an adult
  woman 1.52 m, a man 1.65 m, a child of 6 about 1.15 m).
- The camera is `look at (x, y)`, a **frame width** and a **tilt** (rolling the frame for a Dutch angle). The frame height
  follows from the format (9:16 or 16:9).
- People can be shown **front**, **three-quarter**, **side** and **back**, full body or waist up, with the head turned and the
  eyes looking anywhere. Most set pieces exist only in a front view.

So give framing as **body landmarks** (where the frame's top and bottom cut a person) and **fractions of the frame**, never in
pixels. Give camera height in metres, or relative to the subject's eye height.

## The format: one file `camera.json`

```json
{
  "sizes": {
    "closeUp": {
      "aliases": ["CU", "close", "ক্লোজ আপ"],
      "frameTop": { "landmark": "headTop", "headroom": [0.04, 0.08] },
      "frameBottom": "chin+0.4head",
      "eyeLine": [0.3, 0.38],
      "body": "waistUp",
      "use": "emotion that matters; a reaction; a decision",
      "avoid": "more than 3 in a row; a close-up of someone who is not feeling anything",
      "hold": [1.5, 4],
      "formats": { "9:16": "…differences…", "16:9": "…" }
    }
  },
  "angles": { "low": { "cameraHeight": "…", "horizon": [0.1, 0.3], "subjectView": "front or three", "flat2dFake": "…", "needs": "…", "use": "…", "avoid": "…" } },
  "moves": { "pushIn": { "from": "medium", "to": "closeUp", "seconds": [2, 5], "ease": "slow in, slow out", "use": "…", "avoid": "…" } },
  "cuts": { "cutOnAction": { "rule": "…", "timing": "…", "use": "…" } },
  "rules": [ { "id": "line180", "rule": "…", "test": "…how code can check it from positions…", "fix": "…" } ],
  "recipes": [ { "moment": "two people talk", "shots": ["wide establish", "OTS A", "OTS B", "reaction CU"], "order": "…", "rhythm": "…" } ],
  "style": { "...": "see below" }
}
```

## What we need

**Shot sizes** (`sizes`, P1): `extremeWide`, `wide`, `full`, `mediumWide` (knees up), `medium` (waist up), `mediumClose` (chest
up), `closeUp`, `extremeClose` (eyes, mouth), `insert` (a hand, a thing: framing by the thing's size), `twoShot`, `group`.
For each: where the frame top and bottom cut the body (`headTop`, `eyes`, `chin`, `chest`, `waist`, `hips`, `knees`,
`feet`, `belowFeet`), the headroom as a fraction of the frame height, where the eyes sit (fraction from the top), whether the
legs must be drawn (`full body` or `waist up`), how long it usually holds, when to use it, when not, and how 9:16 differs from 16:9.

**Angles** (`angles`, P1): `eyeLevel`, `low`, `high`, `topDown`, `overShoulder` (OTS), `pov` (a person's point of view),
`profile` (both people side on), `dutch` (tilted), `worm` (very low), `bird` (very high, wide). For each:
- the camera height (metres, or "at the subject's eye height + 0.3 m") and where the horizon sits in the frame (fraction from the top);
- which view of each person it shows (`front`, `three`, `side`, `back`), and for OTS: how much of the near person shows
  (which shoulder, what fraction of the frame width, how blurred), where the far person stands;
- `flat2dFake`: how a flat cartoon shows this angle **without redrawing every piece**: horizon position, how much bigger the
  near things get, whether the floor shows more or less, whether the people look a little shorter or taller, what to hide;
- `needs`: what has to exist for it (a back view of the person, a side view of a table, a ceiling, a top view of a piece);
  mark the angles that are **not possible** with front-view pieces and say what would have to be drawn;
- when it tells the story (low = power, a child looking up at a parent; high = small, alone, defeated) and when it is wrong.

**Moves** (`moves`, P1): `static`, `pushIn`, `pullOut`, `panLeft/Right`, `tiltUp/Down`, `trackSide` (following a walk),
`followBehind`, `crane` (rising), `handheld` (gentle shake: give the amplitude as a fraction of the frame and the speed),
`whipPan`, `focusPull` (blur near or far: how much), `zoomPunch` (a quick small push on a word). Each with duration, ease,
how far it moves (from what size to what size, or what fraction of the frame), when to use, and when not (moves should be rare
in calm talk, never two moves at once).

**Cuts and transitions** (`cuts`, P1): `hardCut`, `cutOnAction`, `matchCut` (shape or movement), `eyelineMatch`, `reactionCut`,
`jCut` and `lCut` (sound leads or trails the picture: by how many seconds), `fade`, `dissolve`, `cutToBlack`, `smashCut`,
`timeJump` (how to show time passing). With timing in seconds and frames at 30 fps, and when each is right.

**Rules a checker can test** (`rules`, P1): each with the rule in one sentence, how code can **test it from positions and
facing** (people's x, depth, facing, eye targets, camera x and width), and the fix:
the 180° line in a conversation, screen direction of a walk across cuts, eyelines meeting (A looks right → B looks left),
headroom and lead room (looking room in the direction a person faces or moves), never cut between two shots of the same size
and angle on the same person (a jump cut), a change of at least how much size or angle per cut (the 30° rule), the subject's
eyes near the upper third, not cutting people at the joints (ankles, knees, wrists, neck), how long a shot must be at least to
read in a phone video, how many people fit a frame before it is a group shot, a speaker on screen when their mouth is seen.

**Recipes** (`recipes`, P1, about 20): which shots, in what order and rhythm, for story moments:
two people talk; three people talk; an argument building up; a sad moment / bad news; good news / joy; someone arrives; a
reveal (a thing, a result, a person); a decision; a chase or a hurry; waiting; a child with a parent; a classroom; a market or a
crowd; a journey (rickshaw, bus, boat); a prayer or a faith moment (respectful: no low angles on the person praying, no
close-ups during sajdah); a phone call; a flashback or memory; the opening of a film; the ending of a film.

**Style** (`style`, P2): pace for phone shorts (the average shot length for 30 s, 1 min and 2 min films; how fast cuts get at a
climax), how Bangladeshi TV dramas and modern animated shorts shoot these moments and where they differ from Hollywood, how
many angles a 1-minute 2D film really needs to feel cinematic (the minimum set that gives the most), and 5 mistakes that make
a cartoon look cheap on camera.

## Quality bar

- Numbers everywhere a number is possible: fractions of the frame, metres, seconds. "A bit of headroom" is not an answer.
- Everything works for 9:16 first (the phone), then 16:9.
- Honest about flat 2D: say what can be faked cheaply and what really needs new drawings. Recommend the cheap way first.

## How to deliver

One folder: `camera.json` (valid JSON, no comments) and `NOTES.md` (the reasoning behind the choices, and the shots you would
add first if new drawings were possible).
