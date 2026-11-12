# Brief 9: Camera rule book: notes

This folder has two files:

- `camera.json`: the rule book as data (valid JSON, no comments, UTF-8 with Bangla aliases).
- `NOTES.md`: this file. It explains why the numbers are what they are, lists what I added beyond the brief, and ranks the new drawings that would unlock the most shots.

## 1. What is in camera.json

| Key | What it holds | Count |
|---|---|---|
| `meta` | units, coordinate conventions, the engine assumptions I designed for | |
| `landmarks` | default body landmarks in head units (adult, child of 6), joint bands that must never be cut, safe cut lines | |
| `formats` | 9:16 and 16:9: pixels, platform safe zones (TikTok, Reels, Shorts), caption band, look room | 2 |
| `geometry` | the formulas: frame from landmarks, horizon, what shows behind the head, floor band, tabletops, depth scale, lens feel, dutch coverage, pan speed limit, blur | |
| `sizeClassify` | how a checker tells a shot's size from the projected head height | |
| `sizes` | the 11 sizes from the brief | 11 |
| `angles` | the 10 from the brief plus 5 more | 15 |
| `moves` | the 14 from the brief plus 7 more | 21 |
| `moveRules` | one move at a time, the allowed pairs, settling before a cut | |
| `cuts` | the 12 from the brief plus 9 more, each with seconds and frames at 30 fps | 21 |
| `rulesInput` | the fields a checker needs per shot (positions, depth, yaw, eye targets, camera) | |
| `rules` | rules a checker can test, each with `rule`, `test`, `fix` | 37 |
| `recipes` | story moments → shots, order, rhythm, cuts, rules to watch | 35 |
| `composition` | thirds, negative space, foreground, frame-in-frame, depth layers, tangents | |
| `style` | pace, Bangladeshi TV vs animated shorts vs Hollywood, the minimum set for a 1-min film, 5 cheap-looking mistakes | |
| `costLadder`, `newDrawings` | what is free, cheap, needs camera depth, or needs new art | |

How to read it. Each top-level framing number in a size or angle is the 9:16 value. `formats["16:9"]` lists only what changes. Framing uses body landmarks plus head offsets (`chin+0.7head` = 0.7 head-heights below the chin). Each landmark-framed size (`extremeClose` to `full`) also carries a `computed` block: frame width and height in metres for the reference woman (1.52 m), man (1.65 m) and child of 6 (1.15 m), so code can sanity-check its own maths.

## 2. The main decisions and why

### 2.1 Head units, and a ladder where every step is at least 1.4×

I wrote every size as "frame bottom at landmark + k heads" with headroom as a fraction of frame height. Then I picked k so that each size's frame height is at least 1.4× the next tighter size, in both formats (9:16: 1.14 → 1.80 → 2.61 → 3.67 → 5.62 → 8.72 heads). That makes the jump-cut rule simple: a one-step size change is always a legal cut on the same person. A frame-height ratio under 1.25 with no angle change fails. Between 1.25 and 1.4 it gets a warning. This matches the usual editing rule: move the camera at least 30° or change the shot size clearly, because a small change from the same angle reads as a jump cut ([Wikipedia: 30-degree rule](https://en.wikipedia.org/wiki/30-degree_rule), [FilmDaft](https://filmdaft.com/what-is-the-30-degree-rule-in-film/)).

All frame edges land on safe cut lines (upper chest, above the elbow, mid-forearm, above the knee, mid-shin). None of them falls in a joint band. `build/verify.py` (kept out of this folder) re-derives every size from the JSON text alone and checks the eye line, joints and ladder steps. All checks pass.

### 2.2 Why my close-up is not `chin+0.4head`

The brief's example puts the close-up's bottom at chin + 0.4 head. With normal headroom that frame is 1.49 heads tall. In 9:16 it is then only about 0.84 heads wide, which is narrower than most cartoon faces with hair and ears. It also cuts across the neck, which reads as a cut through the throat. So:

- 9:16 close-up: bottom at `chin+0.7head` (upper chest). The face fills the width (about 1.0 head, 0.22 m for the man), with the eyes at 0.33.
- 16:9 close-up: bottom at `chin+0.62head`, eyes at 0.35, with room to look across the frame.
- The tighter "face fills the frame" shot became `extremeClose.faceFill`.

### 2.3 Angles in a flat engine: the horizon rule

With a level camera, the horizon is the line at camera height. It therefore cuts every standing person at the same real height as the camera, whether they are near or far ([Yanick Paquette on the horizon as a height reference](https://yanickpaquette.substack.com/p/the-secrets-of-drawing-perspective)). This one rule drives almost all of the angle faking:

- **Eye level:** the horizon runs through the eyes.
- **Low camera:** the horizon is low in the frame or below it (it crosses the body at chest or hip height).
- **High camera:** the horizon is above the head or above the frame.

The brief's example gave a low angle `horizon: [0.1, 0.3]` (high in the frame). The geometry says the opposite, so I corrected it. Each angle now carries a computed horizon table for 9:16 and 16:9 at four sizes.

In medium and close shots the horizon is usually out of frame. There, the viewer reads camera height from what shows behind the head: `backgroundHeightBehindEyes = h + (eye − h) · D/d`. A low camera puts the upper wall, ceiling or sky behind the head. A high camera puts the floor behind the head. That is cheap to get right and it sells the angle.

The engine cannot pitch the camera (no converging verticals), so each angle's `flat2dFake` lists the cheap tools:

- move the horizon;
- scale the floor band with camera height (`h / 1.5`);
- stretch the whole character slightly (1.03–1.05× for low, 0.96–0.98× for high);
- add a big foreground object at 0.3–0.5× the subject's depth;
- hide what would look wrong.

The "hide" list matters most. Front-view pieces were (I assume) drawn for a camera about 1.5 m high. A tabletop shows a top band proportional to (h − s). Seen from 2.5 m, a 0.75 m table needs 2.3× the top that was drawn. Seen from 0.9 m it needs 0.2×. `rules.surfaceSide` turns this into a test with a tolerance of 0.7–1.4×.

What is honest about possibility:

| Possible today | Only partly | Needs new drawings |
|---|---|---|
| eye level, low, high (with the hide rules), over-the-shoulder, POV (no hands), profile, dutch, plus the extras: elevated wide, child height, frontal tableau, back view, through a frame | worm's eye (cheap version: horizon at the ankles plus giant foreground) | top-down of people, bird's eye, true worm's eye, the arc move |

### 2.4 Over-the-shoulder is possible; the missing piece is the reverse wall

People already have back views, so the near shoulder works: 2–3× the far person's scale, cut by the frame edge, blurred 1–2% of the short side and darkened 10–25%. A common guideline gives the foreground shoulder about a third of the frame ([Soundstripe](https://www.soundstripe.com/blogs/over-the-shoulder-shot)). I used 0.25–0.33 of the width in 16:9, and a lower-corner box (x 0–0.38, y 0.5–1.0) in 9:16, where the frame is narrow.

The real gap is behind A in the reverse shot: a front-view set has no opposite wall. The cheap fix is in the JSON (blur to colour blocks, reuse a door or window piece, or put A against a plain wall). The proper fix is new drawing number 1 (section 4).

### 2.5 9:16 changes the grammar

- **Two-shots get wide.** Two people facing each other 0.8 m apart need a 9:16 frame about 1.48 m wide, which is wider than a full shot. So side-by-side two-shots in 9:16 are full or wide shots. Dialogue is covered with over-the-shoulder shots and singles, and two-shots are staged in depth. That matches how vertical micro-dramas work: there is no width for a normal two-shot, so dialogue is alternating singles ([invideo](https://invideo.io/blog/ai-micro-drama-vertical-shot-generation/)).
- **Faces per frame.** For expressions to read on a phone, I required a head height of at least 0.10 of the frame height. That fits only 2 people side by side in 9:16 (7 in 16:9). `rules.groupThreshold` uses this.
- **Safe zones.** On 1080×1920, the platform UI covers roughly 14–15% at the top and 35% at the bottom on Reels and Shorts, and Shorts takes 192 px on the right ([bundle.social](https://bundle.social/tools/safe-zone-checker)). TikTok's bottom band is about 480 px ([revid.ai](https://www.revid.ai/tiktok-safe-zone)). My `keySafe` box for faces, text and key props is x 0.06–0.82, y 0.15–0.65. Burned-in captions go at y 0.58–0.64. Apps change their UI, so re-check yearly.
- **Centre framing helps fast cutting.** `rules.eyeTrace` keeps the next point of interest near where the eye already is when shots are under 1.5 s.

### 2.6 Timing numbers and where they come from

- **Cut on action.** The default is a straight cut (0 frame overlap), with −2…+3 frames allowed. Older editors asked for 2–5 frames of overlap. A 2023 viewer study found preferences within one frame of a straight cut ([Langkjær et al.](https://lup.lub.lu.se/record/cbd7788c-4320-4a5c-b0e6-e7a55742b782)). Another found that repeating or skipping up to 0.5 s of action barely changed smoothness ratings ([Levin et al.](https://experts.illinois.edu/en/publications/action-mismatches-across-movie-edits-minimally-impact-perceived-s/)). The motion after the cut is what hides it ([Smith & Martin-Portugues](https://ualresearchonline.arts.ac.uk/id/eprint/21152/)), hence `incomingMotionMin_f: 10`.
- **Pan speed.** The cinema "7-second rule" says an object should take 7 s to cross the frame at 24 fps ([Adobe community, Rick Gerard](https://community.adobe.com/t5/after-effects/avoiding-judder-in-motion-graphics-by-rick-gerard/m-p/11865336)). That is a step of about W/168 per frame. Carried to 30 fps, it is about 11 px per frame at a 1080 short side. So, with no motion blur, crossing the width takes at least 3.2 s in 9:16 and 5.6 s in 16:9. Flat colour with hard edges judders easily, so add motion blur for anything faster.
- **J- and L-cuts.** In dialogue I used 6–15 frames (0.2–0.5 s) of audio lead and 6–24 frames of trail. Scene transitions get 0.5–1.5 s or more. Guides give a 6–12 frame lead for quick lines at 30 fps ([CapCut](https://www.capcut.com/create/j-cuts-and-l-cuts-dialogue-edits)) and 0.5–2 s for most dialogue ([Cursa](https://cursa.app/en/article/j-cuts-and-l-cuts-how-audio-transitions-make-your-edits-invisible)).
- **Hold times.** Closer shots can be shorter: larger, less cluttered faces are read faster ([Cutting & Armstrong, Cornell](https://as.cornell.edu/news/heres-looking-you-kid-filmmakers-know-how-we-read-emotions)). So each size has its own `minHold`, and `rules.minShotLength` multiplies it by a clutter factor.
- **Text on screen.** Netflix limits most languages to 17 characters per second for adults and 13 for children's content ([Netflix Indonesian guide](https://backlothelp.netflix.com/hc/en-us/articles/216009727)), with a minimum of 5/6 s per subtitle ([Netflix](https://backlothelp.netflix.com/hc/en-us/articles/115000239632-Timed-Text-Style-Guide-Supplementals-Marketing-Assets)). I could not find Netflix's Bengali figure, so for Bangla on a phone I chose a conservative 13 cps for adults and 9 for children. Treat this as my choice, not a standard.
- **Handheld.** Translation is 0.4–0.6% of the short side for calm shots, 0.8–1.5% for tense ones and 2–3% for panic; roll 0.2–2°; 0.5–3 Hz. These are close to one tool's scale: 0.004 steady hand, 0.01 handheld, 0.03 running, 0.3° handheld roll, 1.5 Hz ([WAS camera shake](https://comfy.icu/node/WASVideoCameraShake)).
- **Dutch.** 5–10° (subtle), 12–18°, 20–25°, never more than 30° in drama. Common practice puts minor tilts at 5–15° and medium at 15–45° ([Epidemic Sound](https://www.epidemicsound.com/blog/what-is-a-dutch-angle/)). Rolling a 9:16 frame 15° needs a set 1.43× wider and 1.11× taller than the frame (computed).

### 2.7 Pace

- **Hollywood.** The average shot length fell from about 12 s in 1930 to about 2.5 s ([FlowingData on Cutting](https://flowingdata.com/2014/09/22/evolution-of-movies/)). Animated movies have shorter shots and more motion than live action ([Cutting](https://cornell.academia.edu/JamesECutting)).
- **Phone shorts.** Much online advice says "cut every 1–3 s", but that is marketing lore. The best measured number I found: 50 high-performing talking-head TikToks averaged 0.37 cuts/s (about 2.7 s per shot), and medium pace kept viewers watching better than high pace ([Dost & Huang 2026](https://archives.marketing-trends-congress.com/2026/pages/PDF/paper_professor_DOST_HUANG.pdf)).
- **My bands.** Average shot length 1.8–2.5 s for 30 s films, 2.2–3.0 s for 1 min, 2.6–3.5 s for 2 min. A climax drops to 0.4–0.6× the average for 3–8 shots, then releases on one long hold.
- **Small children.** After 9 minutes of a fast cartoon (a scene change every 11 s, versus every 34 s for a slow one), 4-year-olds did worse on executive-function tasks right after watching ([Lillard & Peterson 2011](https://uva.theopenscholar.com/files/early-development-lab/files/the_immediate_impact_8.pdf)). So the `kidsUnder7` profile is slow: average ≥ 4 s and no shots under 1.5 s. Those two numbers are my judgement.

### 2.8 Bangladesh-specific rules

- **Faith** (`rules.faithRespect`, `rules.qiblaConsistency`, recipe `prayerFaith`): no low, worm or dutch angles; no close-ups during sajdah; no POV from a person praying; no camera in front of them within 2 m. That follows the etiquette of not passing in front of someone praying ([mosque etiquette](https://arabiconline.eu/mosque-visit-etiquette/)) and of not photographing people in sujood ([Hajj photography etiquette](https://blog.wego.com/hajj-photography/)). Prophets are never depicted, and everyone praying together faces the same way across cuts. The same calm rules apply to puja, church and pagoda scenes.
- **Mirroring** (the cheap fix for a crossed 180° line) is checked by `rules.mirrorSafety`. A flip breaks:
  - Bangla text;
  - right-hand eating and giving;
  - vehicles, because Bangladesh drives on the left;
  - batting sides;
  - asymmetric character marks;
  - a prayer row's direction.
- **Screen direction:** outward journeys go left to right and the return comes back right to left. Bangla reads left to right, so the Western convention holds.

### 2.9 Three traditions, one blend

- **Bangladeshi natok.** Most are made in a few days on small budgets ([The Daily Star](https://images.thedailystar.net/node/3303401)). Often about 70% of the budget goes to the two lead actors ([Prothom Alo](https://www.prothomalo.com/entertainment/tv/এক-নাটকের-৭০-ভাগ-টাকা-নিয়ে-যাচ্ছেন-দুই-শিল্পী)), and the release is mainly on YouTube ([The Daily Star](https://images.thedailystar.net/node/1802158)). The camera style that follows: 1–2-camera dialogue coverage, zooms and drone top shots, music-led romance, frontal staging. Farooki brought precise pans and deadpan ([The Wire](https://thewire.in/146616/bangladesh-now-through-the-lens-of-mostafa-sarwar-farooki/)).
- **Hollywood and animated shorts.** These are summarised in `style.traditions`.
- **My recommended blend:** Hollywood continuity as the skeleton, Bangladeshi warmth and respect in what we show and how long we hold, and phone-short tightness in framing. The camera lines about natoks are observations from viewing and press coverage, not a measured study. I marked them that way in the JSON.

## 3. What I added beyond the brief

- **Sections:**
  - `landmarks`: default body chart, joint bands and safe cuts. Replace with Brief 6's measured chart; everything else adapts.
  - `formats`: safe zones, captions, the letterbox warning for 16:9 on phones.
  - `geometry`: formulas.
  - `sizeClassify`: so a checker can name a shot's size.
  - `composition`
  - `costLadder` and `newDrawings`
- **Angles:**
  - `elevatedWide`: a cheap bird's-eye built from stacked front pieces.
  - `childHeight`
  - `frontalTableau`: the most "intentional" look in flat 2D.
  - `backView`
  - `throughFrame`
- **Moves:**
  - `creep`
  - `parallaxDrift`: the cheapest cinematic move in flat 2D.
  - `impactShake`
  - `dollyZoom`
  - `lead`
  - `craneDown`
  - `arc`: marked not possible yet.
- **Cuts:** `crossCut`, `cutaway`, `montage`, `whiteFlash`, `wipe`, `irisOut`, `jumpCutStyle`, `objectWipe`, `soundBridge`.
- **Rules beyond the brief's list:**
  - eyeline height (vertical gaze matches real heights);
  - max shot length (dead air);
  - speaker coverage;
  - horizon consistency (catches floating, mis-scaled people);
  - surface side (tabletops);
  - safe zone;
  - face size for emotion;
  - close-up run;
  - one move at a time;
  - move settle;
  - establish new place;
  - shot/reverse-shot match;
  - eye trace;
  - set coverage;
  - line through head (tangents);
  - grounded (contact shadows);
  - look into lens;
  - mirror safety;
  - faith respect;
  - qibla consistency;
  - text read time;
  - cut in dialogue gaps;
  - flash safety (max 3 flashes per second);
  - monotony;
  - rhythm.
- **Recipes beyond the brief's 19:**
  - comedy beat;
  - direct-address explainer;
  - family meal;
  - work process;
  - goodbye;
  - idea;
  - surprise/scare;
  - cricket;
  - rain/storm;
  - festival (Eid, Pohela Boishakh, a wedding);
  - night/dream;
  - product/ad;
  - overhearing a secret;
  - shy romance;
  - "reveal", split into thing, result and person.

## 4. Shots I would add first if new drawings were possible

Ranked by how many shots each unlocks per hour of drawing:

1. **A reverse wall for the 5–8 most used sets.** This unlocks true shot/reverse-shot. Every over-the-shoulder reverse and every single of the second person currently sits against a faked background. Dialogue is most of every film, so nothing else pays back faster.
2. **ThreeBack (back three-quarter) head-and-shoulders views of the main characters.** Over-the-shoulder near shoulders look much better when the cheek edge shows.
3. **A ceiling strip (ceiling fan, beams, the underside of a tin roof) and floor/ground texture tiles.** These make low and high angles work indoors and in courtyards.
4. **A top-view kit:**
   - plates of bhat, dal and fish;
   - a table;
   - a bed with a mosquito net;
   - a floor mat and a jainamaz;
   - a phone or letter lying on a surface;
   - people from above in 4 poses.

   This unlocks top-down meals, exam writing and sleepless nights.
5. **A map kit (top views):**
   - tin, thatch and concrete roofs;
   - paddy fields, a river ribbon, roads and ponds;
   - rickshaws, CNGs, buses and boats from above;
   - tree canopies, people dots and umbrellas.

   Flat-colour top views are simple shapes. They unlock bird's-eye openings and endings, the drone shot Bangladeshi audiences know from natoks.
6. **POV hands** holding a phone, a letter, a rickshaw handlebar or a cup.
7. **Furniture with its top surface as a separate layer,** so tabletops can be scaled to any camera height.
8. **Last: under-chin heads, or a perspective mesh warp in code,** for a true worm's-eye view.

On the code side, **camera depth (z)** is the one engine feature I would add first. It unlocks dolly push-ins with real parallax, follow and lead shots, and the dolly zoom.

## 5. Assumptions to confirm

- **Drawing height.** Front-view pieces are drawn as seen from about 1.5 m (`h_ref`). If the real value differs, change `geometry.surfaceTop` and `geometry.floorBand`.
- **Body proportions.** The landmarks are a realistic 7.5-head adult and a 5.75-head child. Stylised characters need Brief 6's chart. The rules use landmark names, so they adapt.
- **Engine features.** Blur per layer, an affine stretch of a whole character, and a head-scale parameter are each assumed to be optional. Every fake that needs one says so.
- **Bangla reading speed.** 13/9 characters per second is my conservative choice. Test it with real viewers.
