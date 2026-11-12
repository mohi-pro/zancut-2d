# STATUS (2026-11-09)

## Teaching continuation — compatible model, mixed accuracy results (05:14 UTC)

806 assistant-authored curriculum examples (640 Bengali, 368 with context, 145 families); 14,138 total training rows. The saved model reloads with all 24 location labels, including none. Beach, mountain-valley and desert examples match the expanded registry. Per-task IDF is fitted only on training rows and persists through save/load and feedback. Action/camera can focus on the current sentence; expressions use a small local network trained from random weights. No pretrained animation model or external model API is used.

Latest saved/reloaded holdout-test (99): place **88.9%**, exact action **71.7%**, face **55.6%**, B-roll **67.7%**, graphics **84.8%**, camera **84.8%**, roles F1 **93.3%**. Development gains did not consistently transfer; expressions, B-roll and graphics regressed from the prior milestone. **95% is not reached.** Previous milestone results and development selection evidence remain in `data/teaching/2026-11-09/continuation/`.

`npm run test:all`: PASS, including security-hub-test, recorded in `continuation/full-tests.log` and `test-status.json`. Evaluation training took 3,136 ms; the full-suite training check passed at 4,329 ms with its unchanged five-second limit. Added checks cover feature persistence/calibration, unseen-class corrections, stale-vocabulary retraining and planner reload after atomic model replacement. Protected seed/test/no-AI hashes remain unchanged. The story MP4 remains the documented, partially directed 749-example milestone demonstration.

## Variety work — parallel editor's record

**Variety + learning fix** (owner report: "dolphin / ocean / sunset → always the same boy in the village home")
- **Causes (hardcoded):**
  1. Nobody named → a fixed boy "hero" (male child, orange t-shirt), every story.
  2. No place named → always village_home; no sea, mountain or desert place existed.
  3. Each role (mother, father, teacher, girl, old man) had one frozen look.
  4. The film builder pushed the first person into every shot and dropped shots without people.
  5. Learned words were text only (dolphin = "animal", no picture, no place). The library's dolphin piece (alias ডলফিন) was never used: beat-sync searched hand props only.
  6. Bulk feeding labelled lines with the brain's own guesses.
- **Fixes:**
  - **server/scene-sense.mjs** reads what a sentence is ABOUT: a named or learned place, the home of the animals it names, the time of day, and every library piece.
  - **Scenery shots:** a sentence about the world with nobody in it shows the place and its subject; no invented boy.
  - **Varied cast:** a narrator and every role get a look chosen per story.
  - **Places:** a story that names none gets one chosen per story.
  - **New places** sea_beach, mountain_valley, desert_dunes; dawn and sunset light.
  - **Animal colours:** animals keep their natural colours.
  - **Learning:** a learned word is bound to its piece and place.
  - **Feeding:** the feeder learns unknown words first and sets places from the scene; a new label triggers a full retrain.
- **Measured:**
  - "ocean sunset view" → sea beach at sunset; "dolphin in water" → dolphin over the sea.
  - Beach story → mother and girl at sunset; mountain dawn; desert camel.
  - 23 places × day/night pass the body gate.
- **Tests:** all pass except security-hub-test's "the global brain learned the approved rule". server/brain.mjs is being rewritten in parallel by another editor (fitHead, per-head transforms, training config), and that check runs inside it.

## Earlier today

## Teaching pass — 2026-11-09 (95% target remains open)

749 assistant-authored curriculum examples (586 Bengali, 320 with context); generated validation excluded from every retrain/replay. Saved-model holdout-test (99): place 86.9%, exact action 71.7%, face 57.6%, B-roll 68.7%, graphics 86.9%, camera 83.8%, roles F1 93.3%. These are not 95%, and the corpus is not owner-approved ground truth.

Five reference films: 769 approximate shots indexed over their full duration; sampled visual/ASR study is documented separately, and unreliable raw Bengali ASR was not fed into training. Added sourced editorial/world notes, story-level insert repetition/density controls, correction/context/leakage protections and a review queue. Fixed speaker framing, stale storyboard composition, empty-wallet inserts, Bengali headline measurement and cards covering paired faces.

Report: [TEACHING_REPORT.md](TEACHING_REPORT.md). Reference study: [TEACHING_REFERENCE_BREAKDOWN.md](TEACHING_REFERENCE_BREAKDOWN.md). Demo artifacts: `data/teaching/2026-11-09/demo/` (automatic plan plus two explicit director corrections, captions/music/SFX, no synthesized voice). The 59.4 s 1080p/30fps demo is rendered: video QA passes and all 1,782 frames pass the body gate with zero faults. `npm run test:all` passes, including the new teaching/layout regressions and the real queue integration. Full-corpus training measured 3.583 s in the final regression; no speed/accuracy threshold was loosened.

**Master upgrade: 4 output bugs fixed + the /admin training studio** (tests: scripts/acting-lipsync-test.mjs, scripts/ui-test.mjs)
- **Lip-sync:**
  - The build reads the voice file → RMS at 30 fps → `ZVOICE` in the film kit (work/lipsync.json). Room tone or silence below −40 dBFS → none.
  - `ZC.lip` opens the jaw with the voice energy, shapes it by the word's syllables and widens it by vowel signs (ো ু → round, ি ে → wide); it closes in pauses.
  - Talker = an explicit `speaks`; else the shot's focus (camera.on, else the first person). `film.lipSync:false` = nobody.
  - Measured: open in 100 % of voiced frames, shut in 100 % of pauses, listener shut.
- **Calm acting:**
  - engine/cartoon/library/gesture-energy.json: CONVERSATIONAL_SAFE / EXPRESSIVE / HIGH_ENERGY_LOCOMOTION (with trigger words).
  - Automatic gestures are conversational only, played at 35 % (talking) / 30 % (listening) with rests (1.1 / 2.4 s), feet planted. The old loop chained hug/thumbs-up/explain for whole shots.
  - A big move needs a trigger word in the sentence AND brain confidence > 0.80 (server/energy.mjs); the default strict rule "calm-talk" replaces the rest.
- **Bangla text:**
  - NFC at every entry: transcript words (director.wordsOf), the planner, captions, graphics.
  - Labels are cut and measured by grapheme (Intl.Segmenter). Anek Bangla is registered next to Hind Siliguri (ক্ষ is measured as shaped).
  - Whisper already got `--lang bn` + a Bangla prompt. The "মট" in your old transcript is Whisper mishearing মোট, not broken Unicode (0 non-NFC words found).
- **Visual beat sync** (server/beat-sync.mjs): the props a sentence names (words.json aliases, learned props) go in the speaker's hand or next to them, and pop in when the word is spoken; no piece → an icon b-roll callout.
- **Also fixed:**
  - In 9:16 the headline covered faces in two-shots (in the Step 12 films too). The camera now leaves headroom under the headline (ZC.headroom).
  - Creature mentions reuse one creation; রাক্ষস etc. are never person names; মেলা → market_bazaar.
- **/admin** (ui/admin.html, server/admin.mjs, owner hub session required):
  - 📥 Feeder: bulk / .txt / .jsonl preview → editable labels → data/brain/fed.jsonl (weight 2); test sentences refused. Web topics. Offline teacher (template expansion; Gemini NOT built — CLAUDE.md).
  - 🎥 Reference video: ffmpeg cuts, motion, pauses, LUFS → data/brain/style-profile.json (sets the shot length). Ducking cannot be measured from one mixed track.
  - 🚫 Strict rules: server/strict-rules.mjs + data/brain/strict-rules.json. Natural Bangla/English, toggle, delete; applied in the planner AND after the automatic graphics (work/rules.json).
  - 🧪 Sandbox: story → brain + rules + QA → playable page (zen compose) + receipt; 👍 teaches, 👎 corrects, teaches and rebuilds.
  - 🔐 Users / quarantine / vault.
- **Customer app (/):** 3 steps only (Voice & Story · Customize Scenes · Export MP4); owner tools moved to /admin.
- **Not built / limits:**
  - No voice in sandbox stories (speech synthesis is a pretrained model): mouths follow the syllables.
  - The body gate does not yet fail a face under a headline (the lip-sync test checks it instead).
  - ড্রোন-like words with no prop and no icon get nothing drawn.

## Step 12 (2026-11-09)
**Step 12: end-to-end benchmark — done.** Details: docs/TEST_RESULTS.md and data/qa/step12/. 4/4 films pass the body gate (8,589 frames, 0 faults) and video QA, all < 8 % nearly still (your film 45.24 % → 0 %). Brain on holdout-200: place 78.5, action 61.0, face 52.0, broll 64.5, graphic 84.0, camera 79.0, roles F1 91.9 (Step 7: 61.0 / 57.0 / 47.0 / 55.5 / 78.0 / 70.5 / 90.9). Vault/hub and UI tests pass.

## Step 11 (2026-11-09)
**Step 11: studio UI — creative controls, Teach & Create bar, Admin Hub, mobile preview** (ui/index.html; tested by scripts/ui-test.mjs in `npm test`):
- **Storyboard shot cards** (besides place, people, action, face):
  - B-roll: auto / none (`broll:false`) / any of the 27 templates; mode cutaway or pip_corner. A custom recipe stays as it is.
  - Motion graphics: auto / none (`overlays:[]`) / prefer a kind (`brain.graphic {label, conf:1}`).
  - Camera move: auto / steady / the 5 moves. Headline caption: free text.
  - Brain confidence %: place, action, face, b-roll, graphic, camera, from GET /api/projects/:id/brain.
  - The cast shows custom creations.
  - codefilm honours steady, `broll:false` and the brain hints (≥ 0.6).
- **Create new / Teach the brain bar** (on Story and Storyboard) → POST /api/command (server/command.mjs):
  - “যখন/যখনই … তখন …” teaches a rule. Natural words work: চার্ট, শতাংশ, জুম ইন/আউট, প্যান, ঝাঁকুনি, বি-রোল + a template word.
  - “… বানাও / make …” makes a creation. Engine preview: POST /api/creations/:id/preview. “Add to this film's cast” is one click.
  - “শেখো …” learns a word. Any other sentence shows what the brain would draw and how sure it is.
  - “Auto-Learn Unknown Words from Web” → POST /api/projects/:id/learn-unknown, with the learned SVG icons. It stays offline unless “allow the web” is ticked.
- **Admin Hub tab** (owner password; the session lives in page memory only):
  - Vault status: version, size, AES-256-GCM + HMAC, the measured accuracy table from docs/MODEL_EVAL.md.
  - “Lock & Encrypt Brain (AES-256)” → /api/hub/lock. Hub endpoints added: /status and /lock.
  - Quarantine queue with previews (prop SVG, rule text, correction labels): “Approve & Merge into Encrypted Master Brain” or Reject.
  - Users: create (device limit, expiry), devices listed, Active/Suspended kill-switch.
- **📱 Mobile preview:** a 400 px phone frame, one column, 44 px touch targets, no sideways scroll; remembered (localStorage, guarded).
- **Measured:**
  - ui-test passes: endpoints plus a headless Chrome clicking every control, with no page errors.
  - npm test plus codefilm/world/cleanup pass. no-ai.mjs md5 and the real-test hash are unchanged.
  - Brain training on everything takes 4.95–5.8 s while the IDE holds a CPU core, so the “< 5 s” check in brain-v2-test is now borderline (it failed 3 of 4 runs here). The training is unchanged; not loosened.
- **Still open:** Gemini fallback (Step 10) awaits the owner's decision. The Auto-Learn offline run learned 0 words for the test story; real learning needs the web box ticked.

## Step 10 (2026-11-09)
**Step 10: brain vault + owner hub** (Gemini fallback NOT built: CLAUDE.md forbids model APIs and any opt-in flag; awaiting the owner's decision):
- **server/security-vault.mjs** → data/brain/brain.zancut.enc:
  - Contents: model, calibration, semantic clusters, names, learned props/creations/knowledge, gzipped.
  - AES-256-GCM, keys by HKDF-SHA256 from the owner master (data/hub/owner.key, 32 random bytes, mode 600; or PBKDF2-SHA256 of ZANCUT_OWNER_PASSPHRASE, 310k rounds), a fresh salt per build.
  - A separate HMAC-SHA256 over magic + header + ciphertext, checked before decrypting. `openInMemory` never writes plain data.
  - Clients get the keys only wrapped for one session (X25519 ECDH + HKDF + AES-GCM, the session id as AAD).
  - Honest limit: a device that has opened the vault holds the data in its own RAM; the hub can stop future access, not un-share.
- **`npm run lock-brain`:** the vault + dist/client/ (the vault, a bundled/minified engine file — not real obfuscation — and a SHA-256 manifest); refuses if plain weights or library JSON reach dist/.
- **server/central-hub.mjs** at /api/hub (+ ui/hub.html):
  - Users (scrypt passwords, active/suspended, deviceLimit, expiresAt), HS256 JWT sessions (other algs refused), per-session delta signing.
  - Suspension bumps the token version: every live session is revoked at once and stays revoked after reactivation.
  - quarantine-queue.jsonl: signed deltas ≤ 5 KB (rule, feedback, word, prop), scored by the rule parser, the QA rules, physics sizes, the SVG sanitiser and licence list.
  - Owner "Approve to Global Brain" (or policy consensus: 3 different users, score ≥ 0.8) → merged into the hub's brain/knowledge/props → version + 1 → vault re-locked → pull-updates serves AES-GCM deltas to authenticated sessions.
  - Low scores need force; unsafe SVG scores 0.
  - `npm run hub-owner -- set-password "…"`.
- **Test:** scripts/security-hub-test.mjs (in `npm test`, real HTTP, temporary data) covers tamper/wrong key/truncation, no token/alg none/edited token, device limit, session-bound key wrap, quarantine → approval → customer 2 sync (encrypted, the brain predicts the rule), low score/unsafe refused, consensus, suspend/expire/revocation.

**Step 9: 12-rule self-healing QA** (server/qa.mjs, same check / applyRepair / repair API; repairAsync learns unknown props):
- **The 12 rules:**
  - R1 closed world: unknown creature → procedural-creator description, unknown person → stable look by name, prop alias → library piece / learned prop, otherwise removed with a note; places by alias, never invented.
  - R2 grounding (physics-logic: floating people/props, outdoor things and weather indoors → window view). R3 real scale.
  - R4 collision 0.7 m + facing. R5 frame ±2.8 m, speakers in the title-safe 85%, headline ≤ 30 (16:9) / 20 (9:16) characters.
  - R6 pacing: > 6.5 s → a second camera angle; < 1.2 s → merged.
  - R7 zero-static camera move. R8 cutaways ≤ 3 s, never two in a row.
  - R9 a data card never over faces or beside a b-roll card; chart/list text lengths; WCAG contrast ≥ 4.5.
  - R10 one speaker, the camera frames the speaker. R11 seated↔standing → the engine's `rise` (other changes blend 0.35 s).
  - R12 pop/whoosh cues for pop-ups and cutaways (into compose's sound kit), music ≤ 0.16 and ducked.
- **Contract:** issues have stable content keys; every repair is re-checked and rolled back if it does not clear its issue or adds an error.
- **Pipeline:** codefilm `build` now runs QA before drawing (work/qa.json; the cleanup test checks no error remains).
- **Test (scripts/qa-test.mjs):** one film with all 12 defect types (floating character, indoor rain clouds, giant teacup, overlap/facing, edge speaker + overlong headline, 9 s / 0.5 s shots, static shot, card over faces + pip, two speakers off-focus, 5 s cutaway + double cutaway, sit→stand, silent pop-ups + loud music) → 25 issues, 0 remaining. Specific end states are checked; the repaired film validates and renders (465 frames, body gate passes, 5 cues); an unknown prop is learned offline.
- **Found and fixed while testing:** table-top props drawn before their surface (codefilm crash); `ops` repairs were never applied; a test polluted real data (now isolated; the stray file removed); a stale learned prop in memory.
- **Brain (after Step 8):** the holdout is split into dev (inspected) / test (never inspected). Dev-guided additions: past/continuous tenses, situation → face, natural weather/time wording, class-balanced loss.
  - Test half: broll 63.6 → 68.7, face 55.6 → 58.6, place 80.8 → 81.8, graphic and camera unchanged, action 92.9 → 91.9.
  - Rule topics drop a genitive র only when the rest is a known word (বৃষ্টির → বৃষ্টি, বাজার stays).

**Step 8: 12k+ dataset, 200 holdout, measured (the >90% target is NOT met on independent sentences):**
- **Data:** scripts/build-brain-data.mjs (`npm run brain`; brain-seed.mjs is now a wrapper) writes brain/seed.jsonl: 14,681 sentences.
  - 70.6% Bangla, 3,981 in stories/sequences.
  - Kinds: plain banks with more place/face phrasings and 5 phrasings per gesture, dialogue, idioms, money/number comparisons, percentages, amounts, weather/time, scenery, endings, thoughts, procedural creatures, advice, lists, numbered rules, and stories (the place carries on or changes).
  - The build refuses any exact or 6-word overlap with the test sets.
- **Benchmark:**
  - brain/real-test.jsonl (the owner's 34 real sentences) is unchanged and still hash-protected. It was NOT expanded: CLAUDE.md keeps it real.
  - New brain/holdout-200.jsonl: 200 sentences (149 Bangla, 83 in stories) written and hand-labelled for all 7 heads by the assistant BEFORE the generator. Source scripts/data/holdout-200.txt, built by scripts/build-holdout.mjs, hashes checked in the test.
  - Its first build lost the story context (a bug), now fixed.
- **Results (docs/MODEL_EVAL.md, Top-1 · Top-2):**
  - holdout-200: place 75.5 · 94.0, action 61.5 · 71.0 (coarse 85.0), face 52.0 · 73.0, roles F1 91.9, broll 62.0 · 80.5, graphic 83.0 · 95.0, cameraMove 78.5 · 93.5. All above the Step 7 model (61 / 57 / 47 / 90.9 / 55.5 / 78 / 70.5).
  - Generated held-out: 89–97%.
  - Owner's real-34: place 76.5 (Step 7: 82.4), action 85.3 coarse (94.1), face 91.2 (91.2), roles F1 93.0 (97.7): lower than with the Step 7 seed.
  - Continuity on the holdout: 57.6% with context vs 10.2% without.
  - Training: 2.9 s, final model 4.2 s (epochs by data size: 6 above 12k rows).
- **Gap:** synthetic → natural language; more templates did not close it (more data, rebalanced place labels, a larger hash were tried and measured). What would close it: the owner's real sentences labelled through the storyboard or `npm run learn` (weighted 5×).

**Step 7 complete: Brain v2** (server/brain.mjs; numbers in docs/MODEL_EVAL.md, `node scripts/brain-train.mjs`):
- **Features:** words, word pairs, character 3–5-grams, #CONCEPT tokens, learned-knowledge categories, structural signals (numbers, %, money, year, comparison, question, exclamation, list) and a context window (previous sentence ×0.35, next ×0.20, previous place).
- **Model:** multinomial logistic regression per head (Float32Array, feature-major, SGD + L2, negligible class gradients skipped), int16 storage.
- **7 heads:** place 21, action 72 (8 actions + 65 safe gestures), face 5, broll 27, graphic 7, cameraMove 5, roles. Per-head temperature calibration that never raises ECE (brain/calibration.json).
- **Measured:** trains from scratch in 1.2 s (without held-out rows) / about 2–3 s on everything (< 5 s).
- **Real sentences (34, never trained on), v2 vs v1:** place 82.4% (85.3%; 2 misses predict the newer bus_stop), action in v1's vocabulary 94.1% (91.2%), face 91.2% (88.2%), roles F1 97.7% (97.7%).
- **Story continuity:** 89.9% with context vs 1.5% without.
- **Label sources:** broll/graphic/cameraMove are learned from our rule systems (agreement on unseen wording 83/97/96%) so the owner can override them. They have no real-sentence labels yet.
- **Instant learning:**
  - `npm run learn -- "যখন স্ক্রিপ্টে শেয়ার বাজারের কথা থাকবে তখন place হবে office_room আর graphic হবে dynamic_comparison_chart"` → parsed, 9 examples weighted 5×, adapted in about 110 ms. Unrelated sentences keep their predictions.
  - Storyboard edits (`/api/brain/teach`, teachFromFilm) are learned at once, with context and the new heads.
  - Everything goes to data/brain/feedback.jsonl (kept by full retrains).
- **Pipeline:** planners use the context window and pass gestures and hints (shot.brain). codefilm follows confident hints over its rules.
- **Protection:** scripts/cleanup-test.mjs now authorizes server/brain.mjs and brain/seed.jsonl; brain/real-test.jsonl stays hash-protected and is checked to be absent from training.
- Test: scripts/brain-v2-test.mjs (in `npm test`).
- **Gaps:** gestures learn from 3 phrasings each (37.6% on unseen paraphrases); held-out sets differ from v1's; the real set is small (34).
- **Also fixed (Step 6 gaps):** participles/pronouns are no longer "unknown words"; generic kind icons (jackfruit → a fruit icon, marked generic); Wikidata results ranked (Bangladesh/Bengal first, no disambiguation pages).

**Step 6 complete: self-learning knowledge + names/pronouns/concepts:**
- **server/web-learner.mjs** (no model):
  - **Step A, offline:** our memory → words.json/sizes.json pieces, names, concept clusters, b-roll lexicon → OpenMoji/Lucide → local WordNet. The sense is chosen in context: a library piece is never WordNet's "fierce person" sense of tiger; mango is the fruit, kite the toy.
  - **Step B, online and opt-in:** bn/en Wikipedia REST summaries plus Wikidata search/entities → category (9 classes), physical properties (zone, indoor/outdoor, size band, colour) and synonyms.
  - **Step C:** an icon from local OpenMoji first, else Iconify in permissive colour emoji sets. The SVG is sanitised (allow-listed elements/attributes, prefixed ids, internal `url(#)` only), normalised to 0 0 100 100, and its licence recorded. At draw time it is fitted to its visible bounds, so it truly rests on surfaces.
  - **Step D:** data/brain/learned-knowledge.json and engine/cartoon/library/learned-props.json (atomic writes). Learned props join the physics size table, the film kit (ZS pieces) and b-roll recipes.
  - **Politeness:** only the 4 hosts, a plain User-Agent (no personal data), 1.1 s between Wikimedia requests, and a 429 stops the lookup. Every response is cached on disk.
  - codefilm `build` learns up to 4 unknown words per film (offline unless `learn: true`).
  - API: GET /api/knowledge, POST /api/learn, POST /api/entities.
- **server/entity-resolver.mjs:**
  - 628 name forms (334 people, engine/cartoon/library/names.json). 27 everyday-word names (আকাশ, নদী) count only with a person verb or suffix.
  - Bengali suffix stripping. New names only from speech/feeling verbs in subject position (Bengali objects precede the verb).
  - Pronouns (সে/তার/তাকে/তিনি, তারা/তাদের, he/she by gender). One stable people.js look per name.
  - Both planners now read Bengali names; before, they used a generic boy.
  - engine/cartoon/library/semantic-clusters.json: 63 clusters, 2114 terms (1346 hand-written Bengali/English, 768 WordNet first-sense synonyms; scripts/build-semantic-clusters.mjs).
- **Tests:** scripts/web-learner-test.mjs (in `npm test`):
  - Offline table, cached real web answers (scripts/fixtures/web-learner-cache, recorded 2026-11-08), sanitiser, politeness and 429.
  - A learned prop (ইলিশ → learnedIlish) rendered on a table and in a b-roll, visible bottom measured on the surface, body gate 0 faults.
  - Live test only with Z2D_LIVE=1. `npm run test:all` passes. Evidence: data/qa/web-learner/.
- **Gaps:**
  - Bengali participles and locatives share the ে ending, so a few verb forms are tried as unknown words; they are not saved when nothing is found.
  - Iconify has no icon for many local things (jackfruit), so those concepts are learned without a prop.
  - Wikidata can pick the wrong sense of an ambiguous name; local pieces are checked first.

**Gap fixes after Step 5:**
- **Library idle gestures:** talk_explain, ask_what_why, hand_on_chest, count_fingers, thumbs_up, hug_open_arms and check_watch now keep the hands at most 32.9 U forward. Each wrist/hand target's forward reach is scaled; the solver keeps bone lengths. The body gate's A1 "robot-arm" note no longer fires on ordinary people (was 17 in the Step 5 render, now 0). Originals are recorded in each gesture's `about`. The rig-motion invariants (124,800 frames) still pass.
- **over_the_shoulder** is now a true OTS: the listener is redrawn nearer, from behind (ZC.ots), blurred, at the frame edge.
- **Automatic b-roll:** codefilm `build` adds a template b-roll as a corner card below the headline when a template matches and no data card is on screen; shots without people get a cutaway (`broll: false` turns it off).

**Step 5 complete: captions, headlines, motion graphics, camera moves:**
- **Caption writer** (server/caption-writer.mjs, rules + local libraries only):
  - Bengali/English numbers: digits, number words, হাজার/লাখ, units, years, অর্ধেক = 50%.
  - Word-synced subtitle chunks (2–5 words, never a lone word). Compose uses them as its karaoke caption lines; film.json `captions: false` turns them off.
  - `headlineCaption`: the owner's examples come out exactly ("প্রতিদিন ৩০ মিনিট হাঁটুন!", "নিয়ম #১: সকালে পানি খান"), plus changes ("৪০ → ৭০ টাকা ↑"), list intros, percentages and TF-IDF keywords.
  - Graphic selection, lists across sentences ("প্রথমত … দ্বিতীয়ত" grows the card), and camera-move suggestions.
- **Graphics** (engine/cartoon/graphics-fx.js): headline banner, dynamic_comparison_chart (bars, or a trend line over years; d3-scale/d3-shape geometry, rough.js frame, trend arrow), percentage_progress_ring, number_badge_pop (animejs spring sampled), step_list_card, thought_cloud (OpenMoji icon), comic_emotion_fx (shock/angry/sweat/question/idea).
  - Cards keep out of the caption lane and never cover a face. Head effects move beside the head when there's no room above.
  - Note: SVG, not Canvas (the engine renders SVG).
- **Camera** (engine/cartoon/camera.js `ZC.cameraMove`): slow_push_in / slow_pull_out (12%), gentle_pan (10%), impact_shake (decays in 0.6 s), over_the_shoulder framing (speaker at 62%, listener at the near edge).
- **codefilm `build`** adds headline, overlays and move to each shot from its own words unless the scene file set them (`graphics: false`, `cameraMoves: false`).
- **Tests:** scripts/graphics-caption-test.mjs (in `npm test`): 16 scenes, 1272 frames, body gate 0 faults. Compose's caption lines equal the writer's chunks word for word. The cleanup test now checks the real build writes captions.json and physics.json. `npm run test:all` passes. Evidence: data/qa/graphics-captions/.
- **Gaps:**
  - Headlines are rule-based: unusual sentences fall back to keywords.

**Step 4 complete: world physics & logic + 2D b-roll:**
- **Physics** (engine/cartoon/physics-logic.js, Node side server/physics.mjs): every shot is corrected before it is drawn (codefilm `build` writes work/physics.json).
  - Zones (GROUNDED, WALL_MOUNTED, TABLE_TOP, HELD_IN_HAND, SKY_FLOATING) come from the sizes.json anchors. Grounded things are put down, never float.
  - Sizes come from the real sizes.json ranges, with 6 class bands for unknown things. Cups and phones are never bigger than a head (0.226 m).
  - All 20 places are tagged INDOOR or OUTDOOR. Vehicles, tall trees, sky and water things are removed from rooms; indoor rain is a `window_weather_view`.
  - A table-top thing gets a surface and a held thing gets a hand.
  - People standing together face each other.
  - A walk faster than 2 m/s becomes a run; a run faster than 6.5 m/s is cut short.
  - Closed-form 9.8 m/s² falls with bounces and throw arcs are checked against numeric integration.
- **Walking:** root motion now comes from the pose itself. The planted heel/toe moves **0.003 px/frame** (max 0.011), down from **5.70** (max 13.8) with the old fixed 1.1 s cycle.
- **B-roll** (engine/cartoon/broll-kit.js, Node side server/broll.mjs):
  - 25 animated templates.
  - A recipe composer: backdrop + 1–3 local OpenMoji props (lexicon of 57 things / 141 Bengali+English words; every code verified in the package) + zoom, pan, fall, slide or bounce, checked by the physics rules (buildings never move; things too small to read are left out).
  - film.json `broll: { mode: "cutaway" | "pip_corner", template | recipe }`. A cutaway covers the frame for 1.5–3 s; pip_corner is a 34%-width corner card. Shots also take `props` and `weather`.
- **Tests:** scripts/physics-broll-test.mjs (in `npm test`): 34 scenes, 2040 frames through the body gate, 0 faults. `npm run test:all` passes. Evidence: data/qa/physics-broll/. server/qa.mjs (protected) and server/no-ai.mjs unchanged.
- **Gaps:**
  - B-roll is not auto-inserted by the planners yet; `brollFor(sentence)` exists for that.
  - Quadruped and fish legs don't step.
  - The gate's A1 note still fires on ordinary people using the `talk_explain` idle gesture (pre-existing).

**Step 3 complete (started by Codex, verified/finished in Claude Code):**
- **Libraries:** pinned in package.json, offline: openmoji, lucide-static, roughjs, matter-js, animejs, d3-shape/scale, compromise, natural. Rough.js is also vendored, seeded-only, as engine/cartoon/vendor/rough.js via `npm run vendor:cartoon`.
- **Places:** 9 → 20 ready places, each with day and night (`readyPlaces` in library/words.json; `server/place-registry.mjs`). The 11 new ones are flagged `step3`.
- **Procedural creator:** server/procedural-creator.mjs plus engine/cartoon/custom-assembler.js. The Bengali/English DNA parser reads head/arm count (heads at −25°/0°/+25°), colour palette, scale/archetype (বিশাল/রাক্ষস/দৈত্য 1.5 with horns, fangs and glowing eyes; পিচ্চি/বামন 0.65) and FX (fire_aura, ice_tint, cracked_overlay, wings_attachment + float). Creations persist to data/brain/learned-creations.json (8 saved) and are reused after restart.
- **Tests:** scripts/procedural-creator-test.mjs (part of `npm test`) covers all 20 places × day/night plus 8 creations: 1200 real 30 fps frames, body gate 0 faults. `npm run test:all` passes. Evidence: data/qa/procedural-step3/. server/no-ai.mjs unchanged.
- **Gaps closed (same day):**
  - The creator now has 24 nouns: monster, ghost, warrior, king, person (boy/girl/man/woman/old), robot, dragon, horse, tiger, dog, cat, cow, fish, bird, sword, shield, car, umbrella, stick, book, lantern, boat, tree, house.
  - The head noun is the last noun in the phrase ("giant tiger" is a tiger at 1.5×). False friends (রাজাকার, কাকা, মাছি, অদ্ভুত) are rejected. Animals have no arms, and only humanoids hold props.
  - Custom actors use measured front-view idle gestures (no hand passes 33.1 U toward the camera). Body gate: 21 creations + 40 place clips, 2370 frames, 0 faults, 0 notes (was 5 A1 notes).
  - Contact sheet: data/qa/procedural-step3/creations-sheet.jpg.

**Step 1 cleanup complete:** 27 Studio-only server modules, four obsolete Studio workflow tests and five historical workflow/provenance documents archived. Local pipeline imports no cloud model, accounts/payment, desktop or CTO service. `no-ai.mjs` and animation/brain logic unchanged (961 protected file hashes match). `npm test`, codefilm, world-scale and cleanup integration checks passed; the isolated queue produced a 6.00 s MP4 with video QA passing. Full inventory/results: [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md). Run every active test with `npm run test:all`.

**Engine/library:** the earlier Studio sync is retained: 275 actions, 65 gestures, 30 hands, 245 set pieces, 85 props; shot/stage/screen helpers and O1/M2 checks. Its historical report/manifest are in the cleanup archive. The own-brain camera vocabulary remains unchanged. No new feature work was included in cleanup.

## Previous verified status (2026-11-07)
**Running:** `npm start` → http://localhost:4500, Autopilot ON (watches inbox/).
**Verified this session (real runs, real files):**
- Reference study of the owner's 5 films → docs/REFERENCE_STUDY.md (pacing, framing, stillness, sound).
- Learned style applied: shot kinds establish/wide/two/single/close (waist-up rig), ~3.5 s pacing, music bed under everything (ducked under the voice), gate-safe idle gestures, "says/বলে" moves the mouth, night + 2 new interiors (living room pink, kitchen green), brain retrained (34 real sentences: place 85 % vs rules 50 %, action 91 %, face 88 %, roles 98 %).
- Plan from the voice (no script): owner's 94 s Bangla voice → local transcription (bn) → own brain → 25 shots → render → checks passed: examples/out/owner-voice-bn-94s.mp4.
- Tests: `npm test` (syntax of 300 generated scripts, QA seeded repair, film kit, parts, cartoon/body gate) all pass. Gesture sweep: 21/63 safe (brain/gestures-gate.json).
**Bugs found and fixed:** capital words taken as names (66-person cast); `//` inside generated code (render failed); autopilot language; gesture jumps (blend in, ping-pong repeat); study script overwrote a reference's stats; Gemini key removed from .env (it had not been used).
**Honest gaps:** 45 % nearly still (refs 2–8 %); one place for stories that name none; 42 library gestures jump on a standing body (library fix needed); no over-the-shoulder, subtitles, canvas drag editing; WhisperX (a pretrained speech model) is still used to hear the voice's words — the only pretrained model left, used for listening, not for making animation.
**Next:** fix the 42 jumping gestures in the library (engine-side, then re-sweep) → stillness down; more places; over-the-shoulder; subtitles.
