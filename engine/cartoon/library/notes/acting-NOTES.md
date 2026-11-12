# Zancut acting cards — delivery notes

English • Brief 7 • 6 November 2026

## Delivery

The required `7-acting-cards` folder contains exactly `acting.json` and `NOTES.md`. The separately delivered HTML is a data preview; `optional-extras` contains a coverage table, resolved snapshots and validation report. No drawings, production engine code or rendered motion clips are included.

All 36 P1 and 14 P2 IDs appear exactly as requested, including the spaces in `in pain` and `drunk on joy`. Fourteen extras make 64 cards. Every card has distinct mild and strong face/body/timing, gestures, voice notes, age variants, intent and an avoid note. The 24 transitions include all 12 required changes. Forty gesture references resolve to coarse timed specifications in `gestureRegistry`.

The 14 extras are **brave, crying, smiling through tears, apologetic, reassuring, empathetic, skeptical, alert, realization, overwhelmed, conflicted, uncertain, playful, hiding sadness**. The first three close otherwise undefined transition endpoints. The others cover social repair, mixed feelings, attention and restrained acting. These are useful starting choices, not an exhaustive taxonomy of human emotion.

## Evidence and interpretation

Every exact dial value, duration, gaze weight, age multiplier and gesture beat is an **authored animation preset**. The research supports mechanisms and design choices; it does not measure Zancut's normalized dials. No numerical preset is presented as a diagnostic signature, population average or scientifically validated emotion-recognition rule. The source register below states the actual use of each source.

The face and body should usually support one readable intention, but not always match literally. A polite smile over a closed body may deliberately show hidden sadness. Tears may accompany joy, grief, pain or relief. Looking away may mean thinking, comfort, task attention or social choice. Do not use these cards to infer a real person's truthfulness, guilt, personality or diagnosis.

Bangladesh-specific formal respect is an **opt-in interpretation of the user's brief**. The research did not establish a numeric Bangladesh-wide eye-contact rule. Formal classroom, family, workplace and faith contexts differ, and reciprocal eye contact can be respectful. The card uses loosely held hands in front, not a universal prayer pose. Faith-specific postures need explicit scene direction and appropriate motion assets.

## Defaults and sparse cards

The brief says omitted dials return to relaxed values, while its reference neutral expression has a slight smile. This pack makes the distinction explicit: `defaults` uses zero for relaxed numeric face channels, `rest` mouth, centered look and 15 blinks/minute. Body defaults are zero with `sides` hands, breathing speed 1 and depth 1. The `neutral` card explicitly adds the supplied slight smile/brow/lid values. `blinkRate`'s 0–40 validation range is an authored operating cap; the original brief did not give one.

On every card change, resolve **defaults → chosen intensity → age patch → age scaling → scene constraints**. Never overlay a new card directly onto the previous one: this would leak tears, sweat, blush, closed lids or crossed hands. Within a transition, intermediate sparse beats intentionally accumulate from the captured current state; the last beat resets to the full destination. Its `resolveTarget` reference is authoritative for the chosen age. Explicit full adult endpoint values are also included for inspection.

`mouth` and `hands` are enums, not numbers. Mouth shape names do not silently alter `open` or `round`; the card sets those separately. The renderer must combine shape and dials without applying the same smile twice. Body degree channels retain the brief's signs. `headRoll` is explicitly positive toward the actor's right shoulder in this specification; verify the engine convention. `stanceWidth` keeps the brief's −6…20 **engine units** because a physical unit was not supplied. Do not treat it as metres or degrees without an adapter.

All left/right values are the character's own sides. Screen mirroring and camera projection happen later. A character turning around must not reverse the semantic identities of left brow, right brow or left hand.

## Timing, leads and transitions

Each onset is notice → change → settle in seconds. Notice gives the eyes a first response; face and body parts then join in `leads` order across the first 35% of the change interval. This is a production convention, not a universal physiological sequence. Positive hold is measured **after** onset. After hold, strong intensity eases to the same feeling's mild card over 0.6 seconds adjusted by age; grief does not automatically become happy. A zero hold disables automatic decay. Story cues can interrupt any card.

Onset and transition times already express the feeling's pace. Divide them by the age speed only. Gesture/locomotion playback speed uses card speed × age speed. Do not divide the same onset twice or speed up voice recordings. Hold uses the age hold multiplier. The preview implements these rules for its data timelines.

`soft`, `snap` and `sink` have explicit easing formulas in `playback`. Optional settling overshoot is at most 3.5% of the change on suitable torso/angular channels and is clamped. Contact constraints override it. Avoid overshoot on tears, eyes, blinks and mouth names. The preview shows interpolated numeric beats, not a complete skeletal settle simulation.

The 12 required transitions are happy→sad; neutral→shocked; shocked→scared; worried→relieved; sad→hopeful; angry→guilty; neutral→joy; proud→embarrassed; thinking→determined; scared→brave; angry→calm; crying→smiling through tears. Twelve extra transitions add realization, apology, reconnection, refocusing, de-escalation and masked-emotion release. Triggers describe story events, not guaranteed psychological outcomes. For example, an apology need not produce forgiveness.

## Ages without caricature

The five groups are toddler, child, teen, adult and elder. Child6/child9/child12 from the body-proportions pack map to child; child12 can optionally use a smaller gesture multiplier. The values are selectable performance styles, not mandatory age behaviours. Personality, relationship, mobility and scene intent take precedence.

Age gesture scale affects only the listed body channels, relative to relaxed zero, and never bone length or face identity. Per-card or age-patch sway wins; age sway is only a fallback. Strong toddler sadness uses `trembling`, never `laugh`. Teens are not automatically embarrassed or closed off. Elders are not automatically frail, hunched, trembling or slow to understand. Head-before-eyes is offered only as a deliberate task-specific option: the cited studies concern head contribution and task-dependent coordination, not a universal head-first rule.

## Gaze mechanism

Gaze is target-based. Resolve a world-space anchor, compute target yaw/elevation, allocate root/head motion within the rig's limits, then compute the remaining eye displacement. The normalized 20° horizontal / 12° vertical mapping and 18° head-join threshold are **authored rig defaults**, not anatomical limits. At large angles, request a root/chest turn from the motion system rather than forcing the pupils or adding an unsupported chest-yaw dial to a card.

Listener and speaker schedules use normalized target weights summing to one. They indicate time-budget preferences, not unbroken eye contact or measured national statistics. Fixation duration, sparse search clusters and target priority prevent jitter. A held object uses its attention anchor, not necessarily the grip point. A child looking at a parent uses actual eye heights and distance, not a fixed universal upward angle.

Group reactions are staggered by awareness, visibility, sound and proximity; actors who cannot see the event need another cue. Do not turn every head on the same frame or always make the oldest person react last. A deterministic per-actor seed makes small blink/gaze differences reproducible.

Blink frequency and duration are separate. A temporary blink closes the current lid, then restores the active expression. Sleepy uses a longer blink option; it should not just blink faster. Nervous rates are stylistic choices, not measures of dishonesty. During speech, the phoneme layer owns mouth/open/round while expression can retain compatible corners and brows. A yawn is an event, not a strong sleepy mouth held indefinitely.

## Gestures and physical limitations

The registry supplies timing and coarse existing dials for every referenced gesture. It does **not** supply joint keyframes, finger poses, IK, contact geometry, prop anchors or foot planting. `hands: face` cannot distinguish wiping one eye, touching a temple and covering a mouth by itself. The registry notes the intended action; the motion library must supply its trajectory.

Occupied-hand and seating constraints have priority. Do not pull a held cup through a face, uncross arms through another person, or slide feet to widen a stance. Preserve the current contact until a reachable trajectory is available. Hand changes have a minimum 0.35-second move budget; retain the old pose or extend the transition when that is too short. Optional comforting contact requires relationship/context and a contact plan. `protect-area` needs the scripted painful body region; the front-hand pose is only a fallback, not a claim that every pain is abdominal.

The coarse `anticipatory-bounce` is upper-body buoyancy, not a jump. Tears and sweat are effect amounts; emission, gravity, lifetime and cleanup still belong to the effects system. Laughter/sobbing need irregular pulses with rests rather than an endless sine wave. `drunk on joy` means giddy happiness; no intoxication is implied.

## New dials and data the existing controls cannot express

These are proposals only; none is silently inserted into a card's face/body dial blocks.

| Proposed addition | Suggested range / type | Purpose |
|---|---|---|
| `noseWrinkle` | 0…1 | Distinguish disgust from anger |
| `lidL`, `lidR` | −0.35…1 each | Winks, asymmetrical lids and side-specific squints |
| `lipPress`, `lipTremble` | 0…1 each | Separate tension/trembling from the named mouth mesh |
| `jawOffsetX` | −1…1 | Restrained asymmetrical mouth action |
| `blinkDuration` | 0.08…0.65 seconds | Separate long blinks from low blink frequency |
| `gazeTarget` | world-space anchor ID | Track a partner or prop through movement |
| `chestYaw` / root-turn request | degrees / motion event | Complete gaze beyond the head's comfort range |
| `shoulderLiftL`, `shoulderLiftR` | −1…1 each | One-sided shrugs and restrained asymmetry |
| `handTargetL`, `handTargetR` | anchor ID + contact mode | Exact unilateral gestures and occupied-hand handling |
| `fingerPoseL`, `fingerPoseR` | named shape + blend | A relaxed hand, grip, open palm or pinch |
| `breathPhase`, `breathHold` | 0…1 phase / seconds | Place an inhale, exhale or brief pause at the right beat |
| `trembleFrequency`, `trembleSeed` | Hz / integer | Separate bounded fine trembling from large rocking |
| `tearEmit`, `tearLifetime` | event rate / seconds | Permit tear cleanup and a lingering tearful smile |
| `painRegion` | body anchor ID | Protect the actual scripted location |
| `supportContacts` | feet/seat/hand anchor list | Preserve physical support during emotion changes |

New dials require explicit engine implementation. Proposed numeric ranges are design suggestions, not medical or anatomical facts.

## Integration and acceptance

Core keys follow the brief (`emotions`, `transitions`, `gaze`, `ages`), with versioned defaults, range definitions, playback semantics and a gesture registry. These additional metadata keys are documented; an importer that rejects unknown keys needs a schema adapter. **Direct engine compatibility is not verified:** the actual body/face engine and selfcheck were not attached. No READY claim is made.

Check these in Zancut before production: all 64 mild/strong looks; all five ages; actor-left/right at multiple facings; named mouth plus numeric mouth composition; tear/sweat reset; face-body intent at wide and close shots; speech ownership; transition interruption; group gaze; hands with props; seated and walking support; expressive and restrained variants; local cultural review. A numeric range pass cannot establish readable acting or physical contact.

The optional JSON holds 640 resolved snapshots for inspection, not 640 animated clips. The preview allows card/age/intensity comparison, an extras filter, exact JSON inspection, and play/scrub of transition dial timelines. No character art is claimed. Renderer verification and empirically calibrated Zancut values remain outstanding.

## Research register

Primary studies and official studio/engine sources were reviewed for this delivery. Exact numerical settings remain authored; no population dataset was converted into these dials. The research scope was acting, temporal expression, face/body context, gaze, blinking, age variation and animation-layer mechanisms—not an exhaustive survey of every animation discipline.

### S01 — Walt Disney Animation Studios — Animation

https://www.disneyanimation.com/process/animation/

Studio primary source. Timing, anticipation, follow-through and secondary action guide the onset/change/settle design. It supplies no dial calibration.

### S02 — Walt Disney Animation Studios — Hand-Drawn Animation

https://www.disneyanimation.com/process/hand-drawn-animation/

Studio primary source. Character poses and facial acting are planned together. Used for coordinated card intent and gesture staging.

### S03 — Aviezer, Trope & Todorov (2012), Body cues, not facial expressions, discriminate between intense positive and negative emotions

https://collaborate.princeton.edu/en/publications/body-cues-not-facial-expressions-discriminate-between-intense-pos/

Primary experiment, Science, DOI 10.1126/science.1224313. Supports reading the body and context alongside an intense face; does not imply all emotions have one correct pose.

### S04 — Aviezer, Trope & Todorov (2012), Holistic person processing: Faces with bodies tell the whole story

https://pubmed.ncbi.nlm.nih.gov/22352325/

Primary experiments. Face-body congruence affects recognition. Informed coordinated states and explicitly intentional mismatch cards such as hiding sadness.

### S05 — Jack, Garrod & Schyns (2014), Dynamic facial expressions of emotion transmit an evolving hierarchy of signals over time

https://pubmed.ncbi.nlm.nih.gov/24388852/

Primary research, DOI 10.1016/j.cub.2013.11.064. Supports temporal ordering of signals rather than changing every face dial in one frame; exact authored beat lengths are not taken from the study.

### S06 — Goldring et al. (1996), Combined eye-head gaze shifts to visual and auditory targets in humans

https://pubmed.ncbi.nlm.nih.gov/8891638/

Primary human study. Eye/head contributions vary substantially between people and target conditions. Supports configurable gaze allocation, not a universal head-join threshold.

### S07 — Ho, Foulsham & Kingstone (2015), Speaking and Listening with the Eyes

https://pmc.ncbi.nlm.nih.gov/articles/PMC4550266/

Primary dyadic eye-tracking study. Gaze helps signal speaking-turn changes. The exported 65% listener-face preference is an authored scheduler weight, not a measured Bangladesh norm.

### S08 — Doherty-Sneddon & Phelps (2005), Gaze aversion: a response to cognitive or social difficulty?

https://pubmed.ncbi.nlm.nih.gov/16248336/

Primary experiment with 8-year-olds. Looking away can support difficult thinking; it is not evidence of lying, guilt or disrespect. Used for thinking/uncertain gaze.

### S09 — Doherty-Sneddon et al. (2002), Development of gaze aversion as disengagement from visual information

https://pubmed.ncbi.nlm.nih.gov/12005386/

Primary child research. Younger and older children differed in task-linked gaze aversion. Avoids making one adult gaze policy mandatory for all children.

### S10 — Nakano et al. (2013), Blink-related momentary activation of the default mode network while viewing videos

https://pubmed.ncbi.nlm.nih.gov/23267078/

Primary research, DOI 10.1073/pnas.1214804110. Motivates irregular blinking near attention breaks. Does not establish the emotion-specific rates or sleepy blink durations in this pack.

### S11 — Poirier, Giraudet & Faubert (2015), Head-Eye Coordination Increases with Age and Varies across Countries

https://pubmed.ncbi.nlm.nih.gov/26421683/

Primary large-sample study. Head contribution can vary with age; this is not proof that all older people move the head before the eyes. Elder head-first timing is therefore opt-in.

### S12 — Proudlock, Shekhar & Gottlob (2004), Age-related changes in head and eye coordination

https://pubmed.ncbi.nlm.nih.gov/15465636/

Primary experiment. Age differences depend on the gaze task. Used as context for configurable elder gaze, not as numeric animation limits.

### S13 — Jack et al. (2012), Facial expressions of emotion are not culturally universal

https://pmc.ncbi.nlm.nih.gov/articles/PMC3358835/

Primary study of particular Western/Eastern samples. Supports caution about one universal display template; not direct evidence about Bangladesh. Do not generalize its samples to every country.

### S14 — Unity — Animation Layers

https://docs.unity.cn/Manual/AnimationLayers.html

Official engine documentation, primary implementation reference. Override/additive layers and masks inform channel ownership. This is not a claim that Zancut is Unity-based or that its importer already supports these metadata fields.


## Verification performed

28,092 numerical, structural and reference assertions passed across the authored data. The offline preview logic passed 640 card selections, 2,520 sampled transition frames and 120 age-specific endpoints, plus extras filtering, alias search and play/pause handling. These checks used DOM stubs. Browser layout and character rendering were not visually verified; browser process creation was blocked in this environment. Actual Zancut integration remains outstanding.
