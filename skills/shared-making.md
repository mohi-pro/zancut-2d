# Zancut Making Playbook: how every scene is planned, built and moved (every design system)

This playbook is shared by every design system. The design system's own skill decides how things LOOK (grounds, cards, colours,
type, light); this playbook decides how a scene is BUILT and how it MOVES. Where they disagree, the design system wins.
One process for every video: light or dark only changes the colours (the page's `--zk-*` tokens), and a person on camera only
adds where that person is seen. Everything else is the same.

## The customer comes first
Read what the customer gave before anything else: their Prompt of orders, their note on any line, and the extra files with their
"where to use" notes. These are orders: follow each one exactly, then go beyond what they hoped for in this design system.

**Core law: 100% dynamic context adaptation, zero rigid templates.** A script may be about AI, health, property, fitness, food, shops, money, code or school. Never copy the topics, prices, dates, names or icons of the examples here.
1. Read the spoken words, the emphasis (★) and what the sentence DOES (lists pains, contrasts, negates, explains a process, teases, reveals a number, asks for action).
2. Take the exact nouns, verbs and numbers of the script and invent a fresh, literal visual metaphor for this moment.
3. Use the mechanics below as motion grammar, styled by the active design system.

**The quality bar (every video, even when the customer wrote no orders):**
- **The clearest explainer**: every line is acted out on screen with a literal, contextual visual metaphor; the viewer understands the point with the sound off.
- **Real ingredients, generously**: real icons and brand logos, 3D emoji, people, phone and browser mockups, charts, numbers, ✓ / ✕ badges; every scene has at least one real ingredient next to its text.
- **No empty or static scene**: a hero plus supporting elements on a stage, always something moving on the words; every scene hands over to the next with a smooth cutless move.
- **Varied, fitting sound**: whooshes on moves, pops, clicks, typing and success on events, a riser + hit on the climax when the tone allows (see the sound system); never the same sound again and again.
- **Perfect on-screen text**: words spelled exactly as spoken (brand and tool names in their real English spelling: Raycast, Alfred, ChatGPT), Bangla never clipped or broken.

## The voice sets the pace (every video, every design system)
The voice is the clock, not a timer. There is no fixed number of seconds per scene or per beat: the speaker's own pace decides.
- **A scene is one complete thought**, as long as the speaker takes to say it, and it ends where the speaker breathes (code lists
  those points). A slow, calm speaker gets fewer and longer scenes; a brisk one may get more. Never a new scene for each clause,
  never a scene that ends in the middle of a phrase.
- **Beats follow the words, not a clock**: one visual event for each idea the voice says, landing on its word. Between beats the
  scene breathes: what has landed stays still enough to be read, with only a slow continuous drift. Never several things flying
  in within the same second.
- **Relaxed, smooth motion** that matches the speaker's energy: soft eases, nothing faster than the voice, the graphic complete
  before the speaker finishes the thought, so the words and the picture end together.
- **Cutless wherever possible**: joined scenes flow as one continuous shot (the anchor hand-off); a visible transition only where
  the story really turns or the picture source changes (the person, a screen, a photo).

## The 20 compositional mechanics (choose by what the sentence does)

| ID | Mechanic | When the sentence… | How it moves (filled 100% with the script's own words) |
| :--- | :--- | :--- | :--- |
| M01 | Recurring problem loop → hero morph | lists 2–3 repeated chores or frustrations solved by one thing | Beat 1: 2–3 task cards enter with looping arrows (↻) or stuck bars, one per pain. Beat 2 (the solution word): they slide to the centre, shrink and morph (`back.out(1.8)`) into one hero squircle with the solution, 3–4 capability pills orbiting it. |
| M02 | Device or workspace stage + flanking pills | shows an app, website, dashboard, service or a result being made | A phone (9:16 bezel) or browser window (16:9), centred or tilted in 3D (`perspective(1000px) rotateY(-12deg) rotateX(6deg)`), rises in with a LIVE mini UI inside (a ring 0→99%, a chat, a graph; never a blank screen). Each benefit spoken pops a pill (icon + word + ✓) beside it, with a thin leader line. |
| M03 | Tool or ingredient dock | names several tools, platforms, ingredients or parts | A row of 4–6 rounded squircles (56–76 px, radius 18 px) under or around the hero; each pops on its word (`scale 0 → 1.08 → 1`, `back.out(1.7)`) with its own icon and label. |
| M04 | Split contrast (✕ vs ✓) | contrasts old vs new, hard vs easy, wrong vs right | Left card (the rejected way) muted with a red ✕; right card (the winner) scales up on its word (`scale 1.06`, `back.out(1.6)`) in the accent with a ✓ and a takeaway pill under it. |
| M05 | Myth, object or cost + diagonal slash | negates a thing or a cost ("X লাগবে না", "no coding") | Beat 1: a tactile card of the exact thing being negated (with an OFF or warning tag). Beat 2 (the negative syllable): a sharp diagonal red slash draws across it in 0.18 s, the card dims and shrinks, the positive alternative pops beside it. |
| M06 | Input → hub → output + scrub bar | explains how something raw becomes something finished | Left: the input with a live indicator (a waveform, raw rows). Centre: wires feed a processing squircle. Right: the output lights up on the outcome word, with a progress or player bar whose playhead sweeps. |
| M07 | Question cloud → bold answer | voices what the audience thinks or asks | Beat 1: 2–3 chat bubbles (small avatar + the question) pop in the upper half and bob gently. Beat 2: the main question or answer slams in below (`scale 1.25 → 1`, `power4.out`), the key phrase in an accent pill. |
| M08 | Multi-track editor or workspace mockup | talks about editing, building, layering, managing a project | An app window: a preview pane + an inspector (swatches, sliders) on top; below, a multi-track timeline of coloured clips with a playhead sweeping across. |
| M09 | Strikethrough rows / inline word cross-out | removes old pains one by one, or corrects a wrong idea mid-sentence | Mode A: 3 stacked rows; on each phrase a strike line crosses the text and its badge flips ✕ → ✓. Mode B: on the correction word a red line strikes through the wrong words of the headline and the right phrase pops under it. |
| M10 | 3 tilted mystery cards + progress rail | teases 3 secrets, tools, mistakes or pillars | 3 rounded cards dealt out from the centre to −6°, 0°, +6° in 3 contrasting fills with a big ? or number; under them a start-to-finish rail whose dot travels. |
| M11 | Connected step pipeline (01 → 05) | walks through a 3–5 step process | 3–5 connected cards in a row (a vertical stepper on 9:16). Each pops its icon and number on its word; the last fills solid with the accent and a done or play icon (`scale 0.92 → 1.05 → 1`). |
| M12 | Origin → drawn curved arrow → outcome | shows the leap from a start to a result | A start card (a bulb, a seed, a starter badge) low-left; on the turn word a curved arrow draws across (`stroke-dashoffset`) into a larger outcome card with a star, crown or play badge. |
| M13 | Calendar flip + clock or time gauge | mentions dates, deadlines, schedules, time passing | A calendar card with a coloured top band and a giant numeral; for time passing, flip 3–4 sheets fast (`rotateX(-75deg)`, 0.14 s each). A clock face whose hands sweep to the spoken time. |
| M14 | Slapped stamp + bonus card | highlights a qualifier (free, guaranteed, bonus, lifetime) | A solid stamp bar (`rotate(-4deg)`) slaps onto the card (`scale 2.2 → 1`, `back.out(2.2)`); a bonus row slides in under it. |
| M15 | Hero value, metric or price card + clicked button | reveals a number, a result or an offer, then asks for action | A high-contrast card: a small label and giant `tabular-nums` numerals (rolling up or slamming in); under it an action pill; a pointer moves in and clicks it (`scale 0.92 → 1.04 → 1`). |
| M16 | Live chat or comment box typing | asks the viewer to comment, message or type something | A real-looking input card (avatar and header above, a rounded input with a send arrow); the exact spoken phrase types in word by word with a blinking cursor; the send button pulses and clicks. |
| M17 | Audio-spectrum speaker avatar | voice-only parts or authority lines with no camera | A round portrait or monogram inside a double ring of 48 radial bars pulsing with the voice, a name badge, the word-locked headline under it. |
| M18 | Framed broadcast speaker (● LIVE) + ticked list | a speaker explaining takeaways or proofs | The speaker in a rounded broadcast frame (a ● LIVE or topic pill top-left, a nameplate bottom-left); beside it (16:9) or under it (9:16), 3–4 rows each stamping a ✓ on its word. |
| M19 | 3-zone masterclass HUD (16:9) | structured lessons or multi-chapter explainers | Left 3–24%: speaker frame + a live level meter + title. Centre 26–78%: the stage where the other mechanics play. Right 80–97%: a chapter rail 01…08 lighting the current one in the accent. |
| M20 | Tangle → line, 3D staircase, editorial cutout | simplifying complexity, step-by-step growth, a sharp insight | A chaotic knot unspools into one straight line; or a ball climbs a 3D staircase on each milestone; or a greyscale cutout (90% neutral) with one vivid coloured slice. |

## The 7 cutless transitions (how scene i hands over to scene i+1)
Never a dead hard cut between two graphic scenes: every graphic row has `anchorIn` / `anchorOut` poses and `"transition": "cut"`;
scene i ends exactly where scene i+1 begins, on the same ground (a run of joined scenes keeps one `bgStage`; it changes only at a
`"pivot": true` row, which arrives with a visible transition) and the same shape (the pose's `look` says how it is drawn).
1. **Whip-pan**: scene i pans briskly off over its last 0.22 s (`power3.inOut`); scene i+1 continues the same pan over the same ground.
2. **Portal zoom**: the camera pushes into a phone screen, hero squircle or window (`scale 1 → 2.6`, `power3.in`) and its inside becomes the next stage.
3. **Optical swap**: the centre card blurs out (`blur(16px)`, `scale 0.95`) over the last 0.2 s while the next centre card sharpens in the same place.
4. **Card reframe**: the hero ends centred; the next scene starts it centred and slides it aside (to 28% or 26%) to make room for new cards.
5. **Wire thread**: an arrow or dashed line draws to the edge (e.g. 50%, 92%) and enters the next scene from the opposite edge into its header pill.
6. **Colour-block wipe**: on a big pivot, a pill or card grows over 0.2 s to fill the whole canvas with a bold solid colour for the next scene.
7. **Badge spin**: a coin, dial or number badge spins or scales up to become the next scene's hub or header badge.

<!-- director -->
## Your decisions, like an editor in a chat
Code measures and builds; every creative choice is yours, from what is said and how: how many scenes and where they cut, what
each moment is (a graphic, b-roll, the person, a lower third, words behind the head, the screen, a photo), the word locks, the
punch-ins, and for the whole video:
- `"music"`: `"bed"` (a quiet bed under the voice) or `"none"` (the voice and the sound effects carry it); follow the design
  system and the customer (their own music track is always the bed).
- `"captions"` (Storytelling): `"on"` when running captions help (a documentary over stock, a dense explainer), else `"off"`
  (the key words live inside the graphics). A person on camera always has captions under them.
- `"rise": true` on the one or two rows that deserve a riser + hit as they arrive (the hook's turn, the big reveal); the engine
  places them only there. None in calm, caring content.

## A person on camera (talking head, interview): where the person is seen
The same process as every video: every moment is read, given a metaphor and designed. The person is the video's anchor, and
where the person is seen is your decision, moment by moment, from the words and the customer's notes:
- **Show the person** when their presence carries the moment: an opinion, a story, an emotion, advice, a warning, the call to
  action, a hook their face sells.
- **Give the frame to a graphic** when the words show something better seen than told: a process, a number, a comparison, a list,
  a tool, a place, a product. How much of each is decided by the content, not by a quota (in a 1-minute video the person may be
  seen for 20 s or for 40 s); a tutorial shows its screen recording when a line is about the screen.
- **Both at once**: the design system's talking-head layouts keep the person on screen while a graphic plays (a pop-out head over
  a graphic, words behind the head, a card over the torso, a lower third, a framed corner). They keep the flow cutless (the person
  stays while the graphic changes), so prefer them to jumping between full graphics and the full speaker. Choose them by meaning;
  never the same layout twice in a row, and the person comes back between full-screen graphics.
- **Punch-ins** (`"punch": [word]` on a speaker row: a quick zoom on the face, held through the phrase): a camera move that
  means something. Only on the one word a stretch hinges on: a warning, a number that matters, the turn of the argument, a
  strong emotion. Rarely (about one in 10 s of speaker time at most), never two in one sentence, none in a calm explaining
  stretch and none in the first speaker row after a graphic. Most speaker rows have no punch.
- **B-roll** (the person hidden for a moment, then back) where the words show something; choose what carries it best:
  - a designed graphic (`"piece": "custom"`, `"thMode": "full-broll-takeover"`, its own ground): a process, a timeline, a
    comparison, a list of causes, a number;
  - a photo or a clip WITH graphics over it (a custom row with `"media": {"search": "2–4 plain English words", "kind": "photo
    | video"}`, or `{"mine": "<the customer's file>"}`): a real thing, place or person named in the words, framed in a card or
    a device or under a tint, with the labels, numbers and arrows over it;
  - a plain stock photo or clip (`"piece": "stock-photo" | "stock-video"`) with one headline, or the customer's own picture
    or clip (`"piece": "mine"`) where its note says.
  The customer's own files come first. Every graphic counts in the graphic budget.
- Captions run under the face for the whole video; graphics keep the face and the caption lane clear (code gives the zones).

## Screen recordings among the extra files (Talking head or Storytelling)
- Code matches the customer's screen recordings to the voice line by line ("What the screen shows, line by line" in the brief:
  SCREEN or GRAPHIC per line) and zooms the window to the exact element each SCREEN line names: it reads along a wide row (Record,
  then Upload), and moves on when something new appears (the player after Generate). Their notes and Prompt say how to use them.
- Never draw on the recording: no boxes, rings, arrows, dimming or cards over the window. A step pill, when used, sits above the
  window. Captions sit under the window (code); graphics keep out of the window and that caption strip.
- Storytelling with screen recordings ("srMode"): `pc-browser-spotlight` (a PC recording) or `mobile-device-stage` (a phone)
  for SCREEN lines; GRAPHIC lines are designed graphics like any Storytelling scene (`concept-takeover-graphic`): the intro,
  opinions, advice, warnings, the outro. A line that only says to go to a website is a designed browser bar typing that exact
  address and the page appearing: never the raw recording, never a plain text card.
- Talking head with screen recordings: SCREEN lines are "screen" rows (the camera steps aside, the window shows the recording);
  the other lines are the person or graphics as usual. Opinions, advice and the call to action are the person.
- Sound: `wh-hollow` on the move into a screen scene, `tx-ui` on a click the line names, `typing` on typed text, `tx-success`
  when a step is done; quiet, the voice leads.
- A recording given as a video clip (shown inside a graphic, e.g. in a phone mockup): the brief lists what happens when in it.
  The row gives its moments, `"media": {"mine": "<file>", "steps": [[word, second], …]}`: one pair per spoken step. Code cuts
  the clip to those words, so what the voice says is what the screen shows. Picking the moments:
  - the word: the one that names the step ("শেয়ার", "More", "Edit"), not the start of the sentence;
  - the second: for "tap / open / press / go to" the moment the tap lands ([tap] in the list); for "you will see / now it is
    there" the result ([result]); for "scroll / find" the screen that shows it;
  - every spoken step gets its own pair, in order; waits and loading ([idle]) are never a moment (code plays the clip at
    0.7–2× and cuts what is too long, keeping its end);
  - a step the clip never shows (the voice says "drag it to the front", the clip only shows it already there): its nearest real
    result, never another step's screen, and say so in your report;
  - only the part that belongs to the row: never another phone's or app's part of the clip.

## Real ingredients the builders have (ask for them in a row's design brief when they carry the moment)
- **People's reactions**: hand-drawn people (head and shoulders) with 33 expressions: shocked, laughing, worried, angry, tired,
  in love… Write who and how they feel ("a shopkeeper, worried", "the customer laughing", a before/after face); the builder
  draws them in the video's colours (a design system without hand-drawn people uses its own alternative).
- **Real icons and brand logos** (a bank, an app, a platform) and **3D emoji** for a feeling.
- **Stock**: real places, people and things named in the words (`media.search`); space and science subjects also come from NASA.
- **Specific sounds** the kit lacks (a cash register, a rickshaw bell, rain, a crowd): the builder finds them.
- **Name the icons, logos and emoji a scene needs** in its row: `"icons": ["rocket", "openai", "😂"]` (plain words, brand
  names, or the emoji itself; at most 6). Code fetches them before the builder starts, so the builder has them ready.
None of these is ever required: when one is not available the builder designs it, so a brief never depends on one.

<!-- graphic -->
## How the scene file carries it out
1. **100% script-specific content**: every title, pill label, icon, number and mockup comes from the scene's own words and the metaphor; never placeholder labels from examples.
2. **Beats on the words, at the voice's pace**: each word lock of the row is one beat (beat 1: the main card or device enters; then chips, arrows or rows on the words that name them; the stamp, slash, strike or click on the punch word). Entrances take 0.6–1.2 s with soft eases (`power2.out`, `power3.out`, `sine.inOut`) and start a little before their word, so each element is complete as the word is said; a tactile overshoot only for a press, a stamp or the punch word's landing (point 8). Between beats nothing new arrives: the scene breathes with a slow drift, and it is never frozen. A calm voice: fewer, slower beats.
3. **Text and Bangla**: put text in with `ZK.text(el, "…")` or `ZK.words(…)`: for Bangla they add the `zk-bn` class, which sets
   the Bangla font, `line-height: 1.38` and `letter-spacing: 0` for you. Give a Bangla line room (at least 10 px padding above
   and below, never `overflow: hidden` on its box) and animate Bangla by whole words or phrases, never letter by letter (that
   breaks যুক্তবর্ণ). English names and numerals: `var(--zk-display)` or `var(--zk-font)`, weight 700–800, `tabular-nums`.
4. **Sound**: 3–5 cues per scene from the sound system (its names only), in your design system's timbre.
5. **At least one real ingredient per scene** (`ZK.icon`, `ZK.emoji`, `ZK.peep`, a brand logo, a device or chart mockup), never a scene of text alone.
6. **Names in their real spelling**: a brand, app or tool the voice names (even when the transcript wrote it in Bangla letters, e.g. রেকাস্ট) is shown in English with its logo: Raycast, Alfred, ChatGPT.
7. **Joins**: when the scene starts from `anchorIn`, draw that exact shape (place, size, colour, `look`) in the first frame and grow
   the scene out of it. When the next scene starts from your `anchorOut`, end on that exact shape, held still for the last 0.3 s.
   Otherwise end on a full, finished frame: the engine fades the scene out itself (never fade it out yourself). After a hand-off,
   hide its helpers: a dashed wire, a guide line or an anchor dot never stays on screen as a stray line or dot.
8. **The finish of a landing** (any design system, in its own colours and materials):
   - The punch word or hero lands with a breath of anticipation: a slight squash (`scaleX 1.06, scaleY 0.95`) just before its
     word, then one small settle (`back.out(1.4)`) into place. Never a bounce, never on every element.
   - Two elements arriving together come from opposite sides (the left one from the left, the right one from the right) on
     shallow arcs and meet in the middle.
   - A card, device or pill lifted off the ground has its design system's soft shadow under it, tightening as it lands.
   - Data builds in reading order: the frame or axes first, then the small or old value, then the big or new one (the contrast
     is the story); a line draws itself and its markers pop on in order; ranked rows arrive one by one, their scores last.
9. **Every part stays inside its scene**: in its own section (`root.querySelector`, never the whole page) and its own time.
   Never `visibility: visible` on a part (it shows the part while the scene is hidden, over every other scene); show and hide
   parts with opacity or `visibility: inherit`.
10. **A clip cut to the words** (your row's media has "steps"): code already cut it so each step is on screen while it is said.
   Place it (a phone mockup, a card) and let it play straight through: never set its `currentTime` or `playbackRate`. Your
   brief lists each step's time: the step pill, its caption and a short cut flash change on those times, the screen zooms
   gently to the tapped spot where the brief says (scale the clip inside the screen, never the mockup) and back out before the
   next step, a tap gets `tx-ui` and the result `tx-success`. Nothing drawn over the recording.

## Real ingredients (use them: they look better than drawing the same thing by hand)
- **Icons and logos**: `ZK.icon("name")` for our own (2,000+ line icons: "clock", "wallet", "shield-check"; brands as
  "logo:youtube"). The icons your scene's row named are already fetched: their names are in your task. For anything else,
  `find_icons` (a word, a brand by its company name) and use the name it gives: `ZK.icon("tabler:cash-register")`, colour logos
  `ZK.icon("logos:openai-icon")`. A brand logo always beats a drawn one; one icon family per scene (do not mix line icons from
  two sets). Size it with its box; colour it with `{color: "var(--zk-a)"}`.
- **A person's reaction** (any moment about how someone feels): `ZK.peep({face, hair, body, …})` returns SVG; put it in a box
  about 5:6 (it is head and shoulders). `find_people` lists the names: 33 faces (Awe, Fear, SmileLOL, Concerned, Angry, Tired,
  Cheeky…), 53 hair styles (Hijab, Turban, Bald, Afro, LongCurly…), 27 bodies (Coffee, Computer, Explaining, PointingUp,
  TeeArmsCrossed…), beards and glasses. Dress them in the video's tokens (`top: "var(--zk-a)"`), give the skin a natural tone
  (Bangladesh: `#C68642`, `#8D5524`, `#E0AC69`), animate the whole figure (pop in, a small nod or tilt on the reaction word)
  and swap the face for a second reaction by swapping two figures. One or two people per scene. (Your design system may use
  another way to show people: then follow it.)
- **Emoji stickers**: `ZK.emoji("😂", {style: "3d"})` (Microsoft's 3D) or `{style: "flat"}`: big and crisp for a feeling, or a
  reaction badge on a card. Pass the emoji character itself. At most two per scene, always inside the design (a tile, a card,
  a badge), never as the whole graphic.
- **Specific sounds**: `find_sound` (e.g. "cash register", "rickshaw bell", "crowd cheering"), pick one, then cue it as
  `["lib:cash-register", 1.2]`. Only for a sound the kit truly lacks and the picture shows; the kit's families stay the base.
- **Dress every ingredient for the design system** with `ZK.look(box, "mono" | "accent" | "slice" | "crisp" | "glass")` on
  the element that holds it: your design system's skill says which looks it uses. A raw full-colour emoji or photo in a
  design system that asks for a look breaks the style.
- **When a source is down** nothing breaks: an icon that could not be fetched shows as our own icon of that name, an emoji in
  its other style or as the plain character, a sound search answers "use the kit". The save tells you; then pick another or
  draw it yourself. People are built in and never fail.

<!-- both -->
## Moments around the person (talking head: a menu, not a quota)
The speaker can get a moment built around them. The director picks one only where the words call for it, names it in the
row's `design` ("lights out: the word SECRET behind the head"), and sets the layout it needs; the designer builds it in the
design system's own materials and colours (its rules win: no glow where it forbids glow). Most rows have none: at most about
one in 15 s of speaker time, never on two rows in a row, never the same one twice in a video. The face and the caption lane always stay clear.

Behind the person (`behind-head-depth` or `bg-replace-stage`; they need the cut-out, else choose one from the second list):
| Moment | When the words… | How it is built |
| :--- | :--- | :--- |
| Lights out | turn dramatic: a secret, a warning, "here's the truth" | A near-black layer covers the room behind the person on the turn word, so only they stay lit; one big word or sign behind the head (or a sign that types itself out, line by line). |
| Pile-up | prove by volume: "I've made 200 of these", overwhelm, everyone's talking | Cards, headlines or screenshots pile up behind the head one by one, faster and faster, then one total pops in front of the pile. |
| Arc above the head | list options, tools or steps | Numbered tiles fan out in an arc above the head line, one per word that names them. |
| Rain | speak of abundance: so many shortcuts, tools, coins, messages | Small objects (keys, icons, coins) fall behind the person, never in front of the face. |
| Receipt | list instructions, costs or what you get | A receipt prints down from above the head line by line, each line on its word, the total last. |
| Match cut | say one word that is everywhere | Sources (headline cards, pages) swap fast behind the head while the one word stays locked in place in a box. |
| Flip clock | count down: "3 things", a deadline, time running out | A flip clock above the head flips on each number spoken. |

Over the person (`over-torso-glass` or `lower-third-kinetic`):
| Moment | When the words… | How it is built |
| :--- | :--- | :--- |
| Live checklist | walk through steps, requirements or settings | A card where each item ticks (or a switch flips on) on the word that names it. |
| Message stack | quote what people say or ask: DMs, comments, feedback | Message notifications pop in one after another and stack, the older ones stepping back. |
| Follow tap | ask to follow or subscribe | A follow button pops up and flips to "Following" on the ask word, the cursor tapping it. |
| Climbing graph | tell a result that grew | A card where a line climbs while its number counts up to the spoken figure. |
| Tier list | rank or judge things | A small ranking board; the thing named flies into the top tier on its word. |
| Marker doodles | point at the person or a detail in a casual way | Hand-drawn arrows, circles and an underlined label draw themselves around the person, never on the face (only in a design system that allows hand-drawn marks). |
