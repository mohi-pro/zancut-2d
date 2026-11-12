# Zancut 2D — সম্পূর্ণ লোকাল AI ট্রেনিং, ইঞ্জিন আর্কিটেকচার এবং ধাপে ধাপে ভাইব-কোডিং (Vibe-Coding) মাস্টার প্লেবুক

এই ডকুমেন্টটি আপনার **Zancut 2D** প্রজেক্টকে কোনো পেইড AI (যেমন Claude Opus) ছাড়াই **১০০% স্বয়ংক্রিয়, অফলাইন এবং লোকাল ব্রাউজার/অ্যান্টিগ্রাভিটি (Antigravity) পরিবেশে** চালানোর জন্য তৈরি করা হয়েছে। 

এখানে দুটি প্রধান অংশ রয়েছে:
1. **পর্ব ১ (সহজ ভাষায় আপনার বোঝার জন্য):** আপনার নিজস্ব লোকাল AI (`Brain`) আসলে কীভাবে কাজ করে, ট্রেনিং মানে কী, কোন ফাইল কার সাথে কথা বলে এবং কীভাবে Opus ছাড়াই এটি নিজে নিজে অ্যানিমেশন, বি-রোল (B-Roll) ও গ্রাফিক্স সাজাবে ও ভুল ঠিক করবে।
2. **পর্ব ২ (ভাইব-কোডিং মাস্টার প্রম্পট প্লেবুক — ১২টি ধাপ):** আপনি যেন একসাথে সব দিয়ে AI-এর কনটেক্সট না হারিয়ে ফেলেন, সেজন্য **১ থেকে ১২ নম্বর ধাপ পর্যন্ত রেডিমেড কপি-পেস্ট প্রম্পট** দেওয়া হয়েছে। আপনি একটি করে ধাপ কপি করে আপনার কোডিং এজেন্টকে দেবেন, টেস্ট করবেন এবং পরের ধাপে যাবেন।

## পর্ব ১: সহজ ভাষায় বুঝুন আপনার নিজস্ব লোকাল AI কীভাবে কাজ করে (Zero-LLM Architecture)

আপনি আগে যখন Claude Opus ব্যবহার করতেন, তখন সে আপনার স্ক্রিপ্ট পড়ে নিজের বিশাল ভাষা-মডেল থেকে অনুমান করত কোন শটে কী হবে, আর কোড ভেঙে গেলে আবার ঠিক করত। কিন্তু আপনার লক্ষ্য হলো **কোনো বাইরের AI ছাড়া ফ্রিতে** এই একই কাজ করা। 

এটি করার জন্য আমরা একটি **"Multi-Head Local Brain + Deterministic Rule & Self-Healing Engine"** তৈরি করছি। সহজ ভাষায় এর ভেতরের কলকব্জা নিচে বুঝিয়ে দেওয়া হলো:

### ১. আপনার নিজস্ব AI মডেল (`server/brain.mjs`) আসলে কী এবং কীভাবে শেখে?

অনেকে মনে করে AI মানেই শত শত গিগাবাইটের বিশাল মডেল। কিন্তু আপনার কাজটি হলো একটি **"Closed-World Decision Making"** কাজ—অর্থাৎ আপনার কাছে নির্দিষ্ট সংখ্যক জায়গা, নির্দিষ্ট সংখ্যক অ্যাকশন, নির্দিষ্ট সংখ্যক মুখের ভাব এবং নির্দিষ্ট সংখ্যক বি-রোল আছে। একটি বাক্য পড়ে শুধু সঠিক অপশনগুলো বেছে নিতে হবে।

আপনার `brain.mjs` যেভাবে কাজ করে (এবং আমরা এটিকে যেভাবে আপগ্রেড করব):

```
একটি বাংলা/ইংরেজি বাক্য:
"রহিম অবাক হয়ে দেখল মাত্র ৫০০ টাকায় এত বড় বাজার হয়ে গেছে!"
       │
       ▼
[১. টুকরো করা (Feature Extraction: Words + Bigrams + Char N-grams)]
   • একক শব্দ (Unigrams): "রহিম", "অবাক", "৫০০", "টাকায়", "বাজার"
   • জোড়া শব্দ (Bigrams): "অবাক হয়ে", "৫০০ টাকায়", "বড় বাজার"
   • অক্ষরের টুকরো (3-5 Char N-grams): "বাক", "টাক", "বাজ", "াজার" 
     (এটি বানান ভুল বা নতুন বিভক্তি থাকলেও শব্দ চিনে ফেলে!)
       │
       ▼
[২. ওজন গুণ করা (Multi-Head Linear/Softmax Classifier)]
   • মডেলের ভেতর একটি বিশাল টেবিল (Weights Matrix) থাকে।
   • ট্রেনিংয়ের সময় (`npm run brain`) মডেল হাজার হাজার উদাহরণ দেখে শেখে:
     - "বাজার" বা "দোকান" থাকলে → `place: market` এর নম্বর (+2.5) বাড়ে।
     - "অবাক" থাকলে → `face: shocked` (+3.1) এবং `action: look_surprised` (+2.8) বাড়ে।
     - "টাকায়" বা সংখ্যা থাকলে → `broll: money_count` (+2.4) এবং `graphic: number_pop` (+3.0) বাড়ে।
       │
       ▼
[৩. ফলাফল ও আত্মবিশ্বাস (Prediction + Confidence Score 0.0 to 1.0)]
   • Place Head   → "market" (Confidence: 0.92)
   • Action Head  → "look_surprised" (Confidence: 0.89)
   • Face Head    → "shocked" (Confidence: 0.94)
   • B-Roll Head  → "shopping_bag_closeup" (Confidence: 0.81)
   • Graphic Head → "kinetic_number_badge" (Confidence: 0.95)
   • Camera Head  → "fast_zoom_in" (Confidence: 0.86)
```

**ট্রেনিং (Training) কীভাবে হয়?**
1. আপনার `brain/seed.jsonl` ফাইলে হাজার হাজার বাক্য এবং তার সঠিক উত্তর (লেবেল) লেখা থাকে।
2. আপনি যখন `npm run brain` চালান, তখন `brain.mjs` প্রথম বাক্যটি পড়ে একটি অনুমান করে। যদি অনুমান ভুল হয়, তবে সে ভুল অপশনের ওজন কমিয়ে দেয় এবং সঠিক অপশনের ওজন একটু বাড়িয়ে দেয় (একে বলে **Gradient Descent / Perceptron Update**)।
3. পুরো ডেটাসেটের ওপর সে ১০ থেকে ২০ বার (Epochs) এই চর্চা চালায়। যেহেতু এটি বিশুদ্ধ গাণিতিক হিসাব এবং জাভাস্ক্রিপ্টে লেখা, তাই ১০,০০০ বাক্য শিখতেও তার মাত্র **৩ থেকে ৫ সেকেন্ড** সময় লাগে!
4. এছাড়া আপনি যখন ব্রাউজার UI-তে (`http://127.0.0.1:4500`) কোনো শটের জায়গা বা অ্যাকশন হাতে বদলে **"Teach the brain"** চাপেন, তখন সেটি `data/brain/feedback.jsonl`-এ জমা হয়। সেখানে আপনার হাতে করা সংশোধনের গুরুত্ব (Weight = 5x) সাধারণ ডেটার চেয়ে ৫ গুণ বেশি ধরা হয়, যাতে মডেল সাথে সাথে আপনার পছন্দ শিখে নেয়।

### ২. আপনার সিস্টেমের ৬টি কম্পোনেন্ট: কার কী দায়িত্ব?

Opus আগে একা যা করত, এখন নিচের ৬টি লোকাল ফাইল মিলে কোনো বাইরের AI ছাড়াই তার চেয়ে দ্রুত এবং নির্ভুলভাবে সেই কাজ করবে:

| কম্পোনেন্ট ও ফাইল | সহজ ভাষায় এর ভূমিকা (Analogy) | এর সুনির্দিষ্ট কারিগরি দায়িত্ব |
| :--- | :--- | :--- |
| **১. কান (`WhisperX` / `transcribe`)** | **শ্রোতা (Listener)** | ভয়েস অডিও ফাইল শুনে কোন সেকেন্ড থেকে কোন সেকেন্ডে কোন শব্দ ও বাক্য বলা হয়েছে তার টাইমস্ট্যাম্প বের করে। |
| **২. মস্তিষ্ক (`server/brain.mjs`)** | **সহকারী পরিচালক (Assistant Director)** | প্রতিটি বাক্য পড়ে ৬টি জিনিস অনুমান করে (`place`, `action`, `face`, `roles`, `broll`, `graphic`, `camera`) এবং প্রতিটির সাথে একটি **Confidence Score (০ থেকে ১)** দেয়। |
| **৩. প্রধান পরিচালক (`server/brainplan.mjs`)** | **প্রধান পরিচালক (Chief Director & Continuity Manager)** | ১. বাংলা নাম ও সর্বনাম ("রহিম" → "সে") মিলিয়ে চরিত্র ঠিক রাখে।<br>২. বাক্যে জায়গার নাম না থাকলে আগের শটের জায়গা ধরে রাখে।<br>৩. একই জায়গায় অনেকক্ষণ কথা চললে স্বয়ংক্রিয়ভাবে ক্যামেরা অ্যাঙ্গেল বদলায় বা B-Roll ঢুকিয়ে দেয়।<br>৪. যদি দেখে কোনো বাক্যে লোকাল Brain-এর Confidence একদম কম (< ০.৩৫) এবং আপনার ঐচ্ছিক Google API সুইচ অন আছে, কেবল তখনই [Gemini 2.5 Flash-Lite](https://aistudio.google.com/docs/models/gemini-2.5-flash-lite) থেকে পরামর্শ নেয়। |
| **৪. শিল্পী ও লাইব্রেরি (`engine/cartoon/`)** | **অ্যানিমেটর ও সেট ডিজাইনার (Animator & Prop Master)** | `anatomy.js`, `rig.js`, `places-kit.js`, `broll-kit.js` এবং `graphics-fx.js` ব্যবহার করে চরিত্রের হাঁটাচলা, চোখের পলক, শ্বাস নেওয়া, পটভূমি, বি-রোল এবং পপ-আপ গ্রাফিক্স ক্যানভাসে আঁকে। |
| **৫. স্বয়ংক্রিয় পরীক্ষক (`server/qa.mjs` + `check-body.mjs`)** | **ভুল সংশোধনকারী এডিটর (Self-Healing Editor)** | Opus যেভাবে ভুল খুঁজে ঠিক করত, `qa.mjs` কোডের নিয়ম দিয়ে তা করে: দুটি চরিত্র একে অপরের গায়ের ওপর উঠে গেলে সরিয়ে দেয়, ফ্রেমের বাইরে গেলে ভেতরে আনে, হাত-পা ভেঙে গেলে বা শরীর লাফ দিলে নিরাপদ পোজ বসিয়ে দেয় এবং একঘেয়ে স্থির শটে ক্যামেরা জুম যোগ করে। |
| **৬. ক্যামেরাম্যান (`engine/compose/` + `videoqa.mjs`)** | **রেন্ডার ও সাউন্ড ইঞ্জিনিয়ার** | ব্রাউজারে ফ্রেমগুলো রেন্ডার করে, ভয়েসের সাথে ব্যাকগ্রাউন্ড মিউজিক ও সাউন্ড ইফেক্ট (`engine/sfx/`) অটো-ডাকিং সহ মিক্স করে MP4 বানায় এবং কালো বা জমে যাওয়া ফ্রেম আছে কি না তা পরীক্ষা করে। |

## পর্ব ২: ভাইব-কোডিং (Vibe-Coding) করার নিয়মাবলি

আপনি যখন আপনার কোডিং এজেন্টকে (Antigravity / Cursor / Windsurf / Copilot) দিয়ে কাজ করাবেন, তখন নিচের ৩টি গোল্ডেন রুল মেনে চলবেন:
1. **একবারে মাত্র ১টি ধাপ (One Step at a Time):** নিচে মোট ১২টি ধাপ দেওয়া আছে। কখনোই দুটি ধাপ একসাথে পেস্ট করবেন না।
2. **টেস্ট পাস না করলে পরের ধাপে যাবেন না:** প্রতিটি প্রম্পটের নিচে **"কিভাবে চেক করবেন (Verification)"** দেওয়া আছে। এজেন্ট কাজ শেষ করলে সেই কমান্ডটি চালিয়ে নিশ্চিত হবেন সব টেস্ট সবুজ (`PASS`) হয়েছে কি না।
3. **নতুন চ্যাট/কনটেক্সট রিসেট:** প্রতি ২–৩টি ধাপ শেষ হওয়ার পর আপনার কোডিং এজেন্টের চ্যাট ক্লিয়ার বা নতুন সেশন শুরু করবেন। এতে এজেন্ট কখনো কনটেক্সট হারাবে না বা ভুল ফাইল এডিট করবে না।

## ধাপ ১: পুরনো অকেজো কোড পরিষ্কার ও ফোল্ডার সিম্পলিফিকেশন

**কেন এই ধাপটি প্রথমে করবেন:** আপনার `PROJECT_OVERVIEW.md`-এর ৯ নম্বর পয়েন্টে বলা আছে `server/` ফোল্ডারে পুরনো "Zancut Studio"-র অনেক মৃত ফাইল (`claude.mjs`, `gemini.mjs`, `editor.mjs`, `pricing.mjs`) পড়ে আছে। ভাইব-কোডিং করার সময় কোডিং এজেন্ট এগুলো দেখে বিভ্রান্ত হয়। তাই প্রথমেই প্রজেক্ট পরিষ্কার করতে হবে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
We are upgrading Zancut 2D into a clean, 100% self-contained local 2D animation + auto B-roll/graphics system.
Before adding new features, perform Step 1 (Codebase Cleanup & Modular Audit):

1. Inspect `server/` and `docs/`. Identify all legacy dead files left over from the old Zancut Studio copy (such as `claude.mjs`, `gemini.mjs`, `editor.mjs`, `pricing.mjs`, desktop app/CTO/payment modules) that are blocked by `server/no-ai.mjs` or unused by the Zancut 2D pipeline (`brain.mjs`, `brainplan.mjs`, `scriptplan.mjs`, `qa.mjs`, `codefilm.mjs`, `autopilot.mjs`, `index.mjs`).
2. Safely remove or archive those unused legacy files so they never confuse future edits, while keeping `server/no-ai.mjs` intact as our guard (we will add an explicit opt-in flag later only if requested).
3. Ensure `server/index.mjs` and all active modules have zero broken imports after removing the dead files.
4. Run `npm test` and all test scripts (`scripts/cartoon-test.mjs`, `scripts/film-kit-test.mjs`, `scripts/parts-test.mjs`, `scripts/qa-test.mjs`, `scripts/codefilm-test.mjs`) to verify everything still passes 100%.
5. Show me a summary of deleted files and test results. Do not touch any animation or brain logic yet.
```

**কিভাবে চেক করবেন:**
* টার্মিনালে `npm test` চালান। সব টেস্ট পাস করলে ধাপ ২-এ যান।

## ধাপ ২: ৪৫% স্থির ভিডিওর সমস্যা সমাধান (৪২টি ভাঙা জেসচার ঠিক করা + Micro-Motion)

**কেন এই ধাপটি করবেন:** আপনার রিপোর্টের সবচেয়ে বড় দুর্বলতা হলো লাইব্রেরির ৬৩টি জেসচারের মধ্যে ৪২টি দাঁড়ানো শরীরে "লাফ" দেয়, তাই সেগুলো বন্ধ রাখা হয়েছে এবং ভিডিওর ৪৫% অংশ স্থির হয়ে থাকে। এই ধাপে আমরা ৪২টি জেসচার ঠিক করব এবং কথা বলার সময় চরিত্রের শ্বাস-প্রশ্বাস ও চোখের পলক যোগ করব।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 2: Fix the 42 "jumping" gestures in `engine/cartoon/` and reduce the 45% static video ratio down to under 8% (matching reference cartoons).

Context & Tasks:
1. Inspect `engine/cartoon/library/`, `engine/cartoon/anatomy.js`, `engine/cartoon/rig.js`, and `engine/cartoon/check-body.mjs`.
2. Diagnose why 42 out of 63 gestures cause standing characters to "jump" or fail `check-body.mjs` (e.g., root pelvis/hip Y-coordinate offsets, foot anchor drift, or absolute vs. relative bone angles).
3. Implement a **Pose Anchor Normalizer & Root-Bone Clamping layer** in `rig.js` (and/or a library normalization script in `scripts/fix-gestures.mjs`):
   - Lock the character's standing foot ground contact (`foot_y`) and clamp root pelvis/hip vertical displacement so applying upper-body gestures never teleports or jumps the character's body.
   - Smoothly blend (lerp) joint angles over 4-6 frames at gesture start and end so transitions never snap.
4. Add an automatic **Alive Micro-Motion Layer** in the character rig/composer whenever a character is on screen:
   - Subtle breathing cycle (chest/shoulder rhythmic rise of 1.5-2%).
   - Automatic natural eye blinking every 2.8 to 4.2 seconds (deterministic seeded by shot/frame).
   - Slight head micro-nods synced with speech syllables when `talking: true`.
5. Run `check-body.mjs` across all 63 gestures and run `scripts/parts-test.mjs` and `scripts/cartoon-test.mjs`. Verify that all 63 gestures pass the body gate without jumping.
```

**কিভাবে চেক করবেন:**
* `npm test` চালান এবং নিশ্চিত হোন ৬৩টি জেসচারই এখন `check-body.mjs` পাস করছে।

## ধাপ ৩: নতুন জায়গা (Places) এবং প্রপস লাইব্রেরি সম্প্রসারণ

**কেন এই ধাপটি করবেন:** বর্তমানে মাত্র ৯টি জায়গা আছে (`places-kit.js`), ফলে গল্পের জায়গা না মিললে পুরো ভিডিও একই জায়গায় আটকে থাকে। আমরা আরও ১১টি জরুরি জায়গা যোগ করে মোট ২০টি জায়গা বানাব।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 3: Expand `engine/cartoon/places-kit.js` and `engine/cartoon/library/words.json` from 9 places to 20 versatile places (with day and night variants) using our existing 245 set pieces and 85 props.

Tasks:
1. Inspect `engine/cartoon/places-kit.js`, `engine/cartoon/world.js`, and `engine/cartoon/library/` to see how the existing 9 places (village road, village house, school yard, classroom, bedroom, city street, park, living room, kitchen) are constructed.
2. Build 11 new deterministic places using combinations of existing set pieces, props, and procedural canvas background layers:
   - `market_bazaar` (গ্রাম বা শহরের বাজার/দোকান)
   - `tea_stall` (চায়ের দোকান ও বেঞ্চ)
   - `office_room` (অফিস রুম, ডেস্ক ও চেয়ার)
   - `hospital_clinic` (হাসপাতাল/ডাক্তারের চেম্বার)
   - `river_ghat` (নদীর ঘাট, নৌকা ও গাছপালা)
   - `bus_stop` (বাস স্টপ ও রাস্তার মোড়)
   - `rooftop` (বাড়ির ছাদ ও শহরের দিগন্ত)
   - `forest_path` (জঙ্গলের পথ ও ঘন গাছ)
   - `restaurant_cafe` (রেস্তোরাঁ ও টেবিল)
   - `courthouse_hall` (বিচারালয় বা মিটিং হল)
   - `farm_field` (ধানক্ষেত বা ফসলের মাঠ)
3. Support both Day and Night lighting variants for all 20 places.
4. Register all new place IDs and their Bengali + English keywords in `engine/cartoon/library/words.json` and the `film.json` validator so `qa.mjs` and `codefilm.mjs` recognize them as valid closed-vocabulary places.
5. Run `scripts/film-kit-test.mjs` and `npm test` to verify all 20 places render cleanly without errors.
```

**কিভাবে চেক করবেন:**
* ব্রাউজার এডিটরে (`npm start` → `http://127.0.0.1:4500`) গিয়ে Library ট্যাবে ২০টি জায়গা দেখা যাচ্ছে কি না দেখুন।

## ধাপ ৪: স্বয়ংক্রিয় 2D B-Roll ইঞ্জিন তৈরি (`broll-kit.js`)

**কেন এই ধাপটি করবেন:** আপনি চেয়েছেন ভয়েসের ট্রান্সক্রিপ্ট অনুযায়ী সিস্টেম যেন নিজে নিজে প্রাসঙ্গিক **B-Roll** (দৃশ্যের ভেতর ছোট কাট-অ্যাওয়ে অ্যানিমেশন বা ভিজ্যুয়াল মেটাফোর) যোগ করতে পারে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 4: Create a native 2D Animated B-Roll Engine (`engine/cartoon/broll-kit.js`) so our films automatically insert visual B-roll cutaways or picture-in-picture inserts without needing external stock video.

Tasks:
1. Create `engine/cartoon/broll-kit.js` and register it with `engine/compose/` and `server/codefilm.mjs`.
2. Design 25 reusable, parameterized 2D animated B-Roll templates (each 1.5s to 3.5s long) built from our existing library props/set pieces and procedural canvas animation. Include categories such as:
   - Time & Weather: `clock_ticking` (ঘড়ির কাঁটা ঘোরা), `calendar_pages_flying` (দিন চলে যাওয়া), `sunrise_to_sunset` (সকাল থেকে সন্ধ্যা), `heavy_rain_clouds` (ঝড়-বৃষ্টি), `night_stars_moon` (গভীর রাত)
   - Money & Work: `money_coins_stacking` (টাকা/আয় বাড়ছে), `empty_wallet_fly` (পকেট খালি/অভাব), `laptop_typing_fast` (কাজ/কোডিং), `market_price_up` (দাম বাড়া/গ্রাফ)
   - Emotion & Action Cutaways: `phone_ringing_vibrate` (ফোনে কল আসা), `teacup_steaming` (চায়ের কাপে ধোঁয়া), `fast_running_feet` (দ্রুত দৌড়ানো), `door_slamming` (দরজা বন্ধ হওয়া), `lightbulb_idea_glow` (বুদ্ধি আসা), `broken_heart_crack` (মন ভাঙা), `books_stack_study` (পড়াশোনা), `car_driving_by` (গাড়ি চলে যাওয়া), `cooking_pot_boiling` (রান্না হওয়া)
3. Update the `film.json` schema and `server/codefilm.mjs` so any shot can optionally include `"broll": { "type": "<broll_id>", "mode": "cutaway" | "pip_corner", "duration": 2.0 }`.
   - In `"cutaway"` mode, the B-roll takes over the full frame for `duration` seconds in the middle or start of the shot while the voiceover continues underneath.
   - In `"pip_corner"` mode, the B-roll renders inside a stylized rounded card in the upper corner while the main character keeps talking.
4. Write unit tests in `scripts/film-kit-test.mjs` verifying all 25 B-roll templates render deterministically in both 16:9 and 9:16 formats.
```

**কিভাবে চেক করবেন:**
* `node scripts/film-kit-test.mjs` চালিয়ে নিশ্চিত হোন ২৫টি B-Roll টেম্পলেটই নিখুঁতভাবে রেন্ডার হচ্ছে।

## ধাপ ৫: স্বয়ংক্রিয় Motion Graphics, Text Popups ও সাবটাইটেল ইঞ্জিন (`graphics-fx.js`)

**কেন এই ধাপটি করবেন:** আপনি চেয়েছেন সিস্টেম যেন নিজে নিজে গ্রাফিক্স অ্যাড করতে পারে (যেমন: টাকার অংক পপ-আপ হওয়া, চমকে যাওয়ার কমিক লাইন, চিন্তা বাবল, ক্যামেরা মুভমেন্ট এবং বাংলা/ইংরেজি সাবটাইটেল)।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 5: Build the Auto Motion Graphics, Kinetic Overlay, and Dynamic Subtitle Engine (`engine/cartoon/graphics-fx.js` and `engine/cartoon/camera.js`).

Tasks:
1. Create `engine/cartoon/graphics-fx.js` supporting procedural 2D canvas motion graphics overlays that can be attached to any shot in `film.json` via `"graphics": [{ "type": "...", "text": "...", "target": "speaker" | "screen" }]`:
   - `number_badge_pop`: Animated spring pop-up badge displaying numbers/amounts mentioned in speech (e.g., "৫০০ টাকা", "১০ বছর", "১০০%").
   - `keyword_highlight_card`: Sleek lower-third or top callout banner highlighting key phrases.
   - `thought_cloud`: Animated floating thought bubble above a character's head containing an icon/prop or short text.
   - `comic_shock_burst`: Radial anime/comic action lines around the frame edges for sudden shock/surprise.
   - `emotion_fx_icon`: Floating animated symbols near the character's head (`angry_steam`, `sweat_drop`, `question_marks`, `sparkle_stars`, `idea_bulb`, `music_notes`).
   - `screen_transition`: Smooth transition effects between place changes (`wipe_left`, `iris_circle`, `fade_dip`).
2. Upgrade `engine/cartoon/camera.js` to support continuous intra-shot camera motion (`"cameraMove"` field in `film.json`):
   - `slow_push_in` (1.0x to 1.08x smooth zoom on emotional/important lines)
   - `slow_pull_out` (1.08x to 1.0x reveal on wide establishing shots)
   - `gentle_pan` (subtle horizontal drift so wide shots never look frozen)
   - `impact_shake` (brief damped camera shake on loud/shocking moments)
3. Add built-in word-synced **Bengali & English Subtitles** using the fonts in `engine/fonts/` (with toggleable style: clean bottom captions or highlighted active-word reels style for 9:16).
4. Add tests and verify with `npm test`.
```

**কিভাবে চেক করবেন:**
* `npm test` চালিয়ে দেখুন গ্রাফিক্স ওভারলে, সাবটাইটেল এবং ক্যামেরা জুম সব টেস্ট পাস করছে কি না।

## ধাপ ৬: বাংলা নাম, চরিত্রের ধারাবাহিকতা এবং জায়গা মনে রাখার বুদ্ধিমত্তা (`brainplan.mjs`)

**কেন এই ধাপটি করবেন:** আপনার রিপোর্টে বলা আছে Brain এখনো বাংলা নাম চিনতে পারে না এবং গল্পে জায়গার নাম না থাকলে ভুল করে। কোনো LLM ছাড়াই বাংলা নাম ও গল্পের ধারাবাহিকতা (Continuity) বজায় রাখার লজিক এই ধাপে তৈরি হবে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 6: Upgrade `server/brainplan.mjs` with a deterministic Bengali Name & Character Resolver (NER), Pronoun Coreference Tracker, and Scene Continuity State Machine.

Tasks:
1. Create `engine/cartoon/library/bengali-names.json` and a helper module `server/entity-resolver.mjs`:
   - Include a curated dictionary of 500+ common Bengali and English first names mapped to gender and age-group archetypes (`boy`, `girl`, `man`, `woman`, `elder_man`, `elder_woman`) plus role titles (`মা`, `বাবা`, `দাদা`, `দাদি`, `স্যার`, `ডাক্তার`, `পুলিশ`, `দোকানদার`, `বন্ধু`, `চোর`, `শিক্ষক`).
   - Add Bengali morphological suffix stripping (`-কে`, `-এর`, `-রা`, `-দের`, `-ও`, `-ই`) and verb-subject detection (words immediately preceding verbs like `বলল`, `গেল`, `দেখল`, `ভাবল`, `হাসল`, `জিজ্ঞেস করল`) so even unseen proper names are automatically detected as character roles.
   - Maintain a persistent `cast` registry across the entire story: once a character name is introduced in shot 1, lock their appearance/rig preset (`people.js`) for the entire film.
   - Implement Pronoun Coreference Tracking: when a sentence uses pronouns (`সে`, `তার`, `তাকে`, `তিনি`, `ও`, `তারা`, `he`, `she`, `they`), resolve them to the most recent active speaker/subject of matching number/honorific.
2. Implement a **Scene Continuity & Anti-Monotony State Machine** in `server/brainplan.mjs`:
   - If the current sentence has low place-prediction confidence (or no explicit location cue), inherit `previousShot.place` instead of randomly jumping to an unrelated location.
   - Never allow 3 consecutive shots to look identical: automatically alternate camera framing (`establish` -> `two-shot` -> `single` -> `close` -> `over-the-shoulder`) and inject `cameraMove` (`slow_push_in` or `gentle_pan`).
3. Write unit tests in a new test file `scripts/continuity-test.mjs` using multi-sentence Bengali stories with names and pronouns, and verify 100% pass rate.
```

**কিভাবে চেক করবেন:**
* `node scripts/continuity-test.mjs` চালিয়ে দেখুন বাংলা গল্পের নাম ("রহিম", "করিম", "মা") এবং সর্বনাম ("সে", "তার") ঠিকমতো চিনতে পারছে কি না।

## ধাপ ৭: আমাদের নিজস্ব মাল্টি-হেড লোকাল ব্রেইন (`brain.mjs` v2) আপগ্রেড করা

**কেন এই ধাপটি করবেন:** এখন আপনার `brain.mjs` শুধু ৪টি জিনিস অনুমান করে। আমরা এটিকে আপগ্রেড করে **৭টি জিনিস** (`place`, `action`, `face`, `roles`, `broll`, `graphic`, `cameraMove`) অনুমান করার ক্ষমতা দেব এবং প্রতিটি অনুমানের সাথে **Confidence Score** বের করব।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 7: Upgrade `server/brain.mjs` to Brain v2 — a Fast Multi-Head Local Classifier with TF-IDF weighting, Word/Bigram/Char-Ngram features, Regex Pattern Signals, and Calibrated Confidence Scores.

Tasks:
1. Inspect `server/brain.mjs` to understand how the current pure-JS feature extraction and regression/classification training works.
2. Upgrade the feature extractor in `server/brain.mjs` (keeping it 100% pure JavaScript with zero external heavy dependencies):
   - Unigrams (words), Bigrams (word pairs), and Character 3-to-5 n-grams (to handle Bengali inflections and spelling variations).
   - Add explicit **Signal Features**: presence of numbers/currency (`টাকা`, `দিন`, `বছর`, `%`, digits `০-৯`/`0-9`), question marks (`?`, `কেন`, `কীভাবে`), exclamations (`!`, `হঠাৎ`, `অবাক`), time/weather words, and dialogue quotes.
   - Apply sublinear TF-IDF scaling and L2 feature normalization so common stop-words don't overpower rare meaningful keywords.
3. Expand the model heads so a single forward pass predicts 7 targets along with calibrated probability/confidence scores (`0.0` to `1.0`):
   - `place` (from our 20 places)
   - `action` (from our library actions/gestures)
   - `face` (facial expression)
   - `roles` (character roles)
   - `broll` (`none` or one of the 25 B-roll template IDs when a visual cutaway fits)
   - `graphic` (`none` or one of the `graphics-fx.js` overlay types + extracted number/keyword text)
   - `cameraMove` (`slow_push_in`, `slow_pull_out`, `gentle_pan`, `impact_shake`, or `steady`)
4. Upgrade the training loop (`npm run brain`):
   - Give user corrections in `data/brain/feedback.jsonl` a 5x sample weight over synthetic seed data so owner feedback always takes priority.
   - Keep training time under 5 seconds on local CPU.
5. Ensure backward compatibility with existing calls and verify all tests pass.
```

**কিভাবে চেক করবেন:**
* `npm run brain` চালিয়ে দেখুন মডেলটি কয়েক সেকেন্ডের মধ্যে ট্রেন হচ্ছে কি না এবং নতুন ৭টি আউটপুট দিচ্ছে কি না।

## ধাপ ৮: ট্রেনিং ডেটাসেট ২,৪০০ থেকে ১২,০০০+ বাক্যে উন্নীত করা এবং মডেল ট্রেনিং

**কেন এই ধাপটি করবেন:** যেকোনো AI মডেলের বুদ্ধি আসে তার ডেটা থেকে। আপনার কাছে এখন ২,৪০০ বাক্য আছে এবং টেস্ট সেটে মাত্র ৩৪টি বাক্য আছে। এই ধাপে আমরা একটি ডেটা জেনারেটর স্ক্রিপ্ট তৈরি করব যা আপনার লাইব্রেরির সব আইটেম কভার করে ১২,০০০+ বাংলা ও ইংরেজি বাক্য বানিয়ে ব্রেইনকে ট্রেন করবে এবং ২০০+ বাক্যের একটি কঠিন টেস্ট সেটে পরীক্ষা নেবে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 8: Expand the training dataset (`brain/seed.jsonl`) and evaluation benchmark (`brain/real-test.jsonl`) to train Brain v2 to >90% accuracy across all 7 heads (including B-roll and Graphics).

Tasks:
1. Inspect `brain/seed.jsonl`, `brain/real-test.jsonl`, and the script that builds/trains the brain (`npm run brain`).
2. Create or upgrade the dataset generator script (`scripts/build-brain-data.mjs`) to generate 12,000+ rich, natural Bengali (70%) and English (30%) labeled sentences covering:
   - All 20 places in `places-kit.js`
   - Safe standing & acting gestures/actions and facial expressions
   - All 25 B-roll triggers (weather, time passing, money, phone call, study, travel, cooking, ideas, etc.) and `none` cases (when normal character acting should play without B-roll)
   - All Motion Graphics triggers (sentences with Bengali/English numbers/money triggering `number_badge_pop`, shock/anger triggering `comic_shock_burst` or `emotion_fx_icon`, thinking verbs triggering `thought_cloud`)
   - Camera movement labels (`slow_push_in`, `gentle_pan`, `impact_shake`, `steady`)
3. Expand `brain/real-test.jsonl` from 34 sentences to 200 diverse, hand-crafted realistic story sentences that have ZERO overlap with `brain/seed.jsonl` (strict train/test split check).
4. Run `npm run brain` to generate the dataset, train Brain v2, and print a complete accuracy table across all 7 heads on `brain/real-test.jsonl`.
5. Update `docs/MODEL_EVAL.md` with the new accuracy numbers and training speed.
```

**কিভাবে চেক করবেন:**
* টার্মিনালে `npm run brain` চালালে আপনি একটি টেবিল দেখতে পাবেন যেখানে `place`, `action`, `face`, `roles`, `broll`, `graphic`, `cameraMove`-এর নির্ভুলতা (Accuracy %) দেখাবে। লক্ষ্য রাখবেন যেন প্রতিটিতে নির্ভুলতা ৮৫%–৯৫% এর ওপরে থাকে।

## ধাপ ৯: স্বয়ংক্রিয় ভুল সংশোধনকারী ইঞ্জিন (`qa.mjs` v2 — Opus-এর বিকল্প)

**কেন এই ধাপটি করবেন:** আপনি বলেছেন Opus আগে লাইব্রেরি থেকে জিনিসপত্র এনে সাজানোর পর ভুলগুলো খুঁজে বের করে নিজে নিজে ঠিক করত। এই ধাপে আমরা `server/qa.mjs`-কে এমনভাবে শক্তিশালী করব যেন কোনো AI ছাড়াই সে ১২ ধরনের ভিজ্যুয়াল ও অ্যানিমেশন ভুল ধরে নিজে নিজে ঠিক (Auto-Heal) করতে পারে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 9: Upgrade `server/qa.mjs` into a deterministic Self-Healing Director QA Engine (replacing what we previously relied on an external LLM to inspect and fix).

Tasks:
1. Inspect `server/qa.mjs`, `server/autopilot.mjs`, and `scripts/qa-test.mjs`.
2. Upgrade `server/qa.mjs` so that before any `film.json` is rendered, it checks and automatically repairs all of the following 10 issues:
   - **Rule 1 (Invalid Library IDs):** If any `place`, `action`, `face`, `broll`, or `graphic` ID is missing from the library, auto-map it to the closest valid semantic fallback in `words.json` instead of crashing.
   - **Rule 2 (Character Collision & Overlap):** If two characters in a shot have X-positions too close (overlapping bodies), automatically separate them into balanced rule-of-thirds left/right positions and face them toward each other.
   - **Rule 3 (Out-of-Bounds Framing):** In both 16:9 and 9:16 aspect ratios, ensure all active speakers are inside the safe camera viewport for the chosen shot size.
   - **Rule 4 (Shot Duration Pacing):** Split overly long shots (>6.5 seconds) into two complementary camera angles (e.g., `two-shot` followed by `close` or a 2-second `broll` cutaway) so the pacing matches reference cartoons (~3.5s per cut). Merge micro-shots (<1.2 seconds) safely.
   - **Rule 5 (Anti-Static Guarantee):** If a shot has low action movement, automatically attach `cameraMove: "slow_push_in"` or `"gentle_pan"` and verify micro-motion (blinking/breathing) is active.
   - **Rule 6 (B-Roll Overuse/Clash Prevention):** Prevent back-to-back full-screen B-roll cutaways; enforce at least 1 character shot between two B-roll cutaways, or convert the second B-roll to `"pip_corner"` mode.
   - **Rule 7 (Graphic Text Sanity):** If `number_badge_pop` is selected, verify the extracted number/currency text is non-empty and under 20 characters; otherwise downgrade to an icon overlay.
   - **Rule 8 (Lip-Sync & Speaker Match):** Ensure the character marked `talking: true` is the camera focus in `single`/`close` shots.
   - **Rule 9 (Pose Jump Pre-Check):** Run a dry-run pose check on shot transitions and insert smooth blend frames if two consecutive actions have large arm/torso deltas.
   - **Rule 10 (Audio/Music Ducking Metadata):** Ensure background music and SFX markers (`engine/sfx/`) are aligned with B-roll and graphic pop-ups without drowning out the voiceover.
3. Expand `scripts/qa-test.mjs` to deliberately inject all 10 types of defects into test films and verify `qa.mjs` catches and fixes 100% of them automatically.
```

**কিভাবে চেক করবেন:**
* `node scripts/qa-test.mjs` চালিয়ে নিশ্চিত হোন ১০টি ভুলই সে নিজে নিজে ধরতে ও ঠিক করতে পারছে।

## ধাপ ১০: ঐচ্ছিক (Optional) Google লোয়েস্ট API ফলব্যাক যুক্ত করা (`server/cloud-assist.mjs`)

**কেন এই ধাপটি করবেন:** আপনি বলেছেন আমরা শতভাগ লোকাল ব্রেইন দিয়েই চালাব, কিন্তু কখনো যদি খুব জটিল কোনো স্ক্রিপ্টে ডিসিশন মেকিংয়ে সমস্যা হয়, তবে যেন একটি অপশন থাকে যার মাধ্যমে Google-এর সবচেয়ে সস্তা মডেল ([Gemini 2.5 Flash-Lite](https://aistudio.google.com/docs/models/gemini-2.5-flash-lite) বা [Gemini 3.5 Flash-Lite](https://aistudio.google.com/docs/models/gemini-3.5-flash-lite)) থেকে সামান্য ডিরেকশন নেওয়া যায়।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 10: Add an strictly optional, opt-in Low-Cost Google Gemini Flash-Lite Fallback (`server/cloud-assist.mjs`) for low-confidence edge cases, while keeping 100% Local Offline Mode as the default.

Tasks:
1. Respect our core rule in `server/no-ai.mjs`: by default, `ZANCUT_CLOUD_ASSIST` is `false` and `no-ai.mjs` blocks all external network AI calls.
2. Create `server/cloud-assist.mjs` which ONLY activates if the user explicitly enables `"cloudAssist": true` in UI settings AND provides a `GEMINI_API_KEY` (using Google's lowest-cost model `gemini-2.5-flash-lite`).
3. Implement Smart Hybrid Routing in `server/brainplan.mjs`:
   - Always run the local `brain.mjs` first (0ms cost, offline).
   - Calculate the shot's average confidence score across `place`, `action`, and `broll`.
   - ONLY if `cloudAssist` is enabled AND a specific sentence's local confidence falls below `0.40` (ambiguous/unseen metaphor), send a tiny structured JSON prompt containing ONLY those low-confidence sentences and the list of valid library IDs (`places`, `actions`, `faces`, `brolls`, `graphics`) to `gemini-2.5-flash-lite` to pick valid library IDs.
   - Pass the returned IDs through `server/qa.mjs` so the closed-world guarantee is never violated.
   - Automatically save the resolved sentence into `data/brain/feedback.jsonl` so the local `brain.mjs` learns it and NEVER needs to ask the API for a similar sentence again!
4. Write a test in `scripts/cloud-assist-test.mjs` (using a mock response when offline) to verify that default mode makes zero network calls and hybrid mode caches learned decisions locally.
```

**কিভাবে চেক করবেন:**
* দেখুন কী চমৎকার একটি লুপ তৈরি হলো! এমনকি যদি কখনো ঐচ্ছিক API কল হয়ও, সে তার উত্তরটি আপনার লোকাল ব্রেইনে (`feedback.jsonl`) শিখিয়ে রেখে দেবে, ফলে দ্বিতীয়বার একই ধরনের বাক্যে আর API লাগবেই না!

## ধাপ ১১: ব্রাউজার এডিটর (`ui/index.html`) আপগ্রেড — ওয়ান-ক্লিক ভয়েস টু ভিডিও এবং মোবাইল প্রিভিউ

**কেন এই ধাপটি করবেন:** আপনি এখন ব্রাউজারে (বা Antigravity পরিবেশে) কাজ করছেন এবং ভবিষ্যতে এটিকে অ্যান্ড্রয়েড অ্যাপ বানাবেন। তাই আপনার `ui/index.html` ব্রাউজার এডিটরকে এমনভাবে সাজাতে হবে যেন ভয়েস দিলেই সে অটোমেটিক ট্রান্সক্রিপশন, শট ডিভিশন, B-Roll, গ্রাফিক্স এবং এক ক্লিকে **"Teach the Brain"** দেখাতে পারে।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute Step 11: Upgrade the Browser UI Editor (`ui/index.html` and `server/index.mjs`) to support the new B-Roll, Motion Graphics, Confidence Badges, One-Click "Teach the Brain", and a Mobile-Responsive Viewport mode.

Tasks:
1. Inspect `ui/index.html` and `server/index.mjs`.
2. Update the **Storyboard Shot Cards** in `ui/index.html` so each shot card clearly displays and allows editing:
   - `Place` (20 places dropdown)
   - `Characters & Actions` (all 63 safe gestures + faces)
   - `B-Roll` (`none` or 25 B-roll templates + mode `cutaway` / `pip_corner`)
   - `Graphics Overlay` (`none` or badge/shock/thought + custom text)
   - `Camera Move` (`slow_push_in`, `gentle_pan`, etc.)
   - **Brain Confidence Badge:** Show a green/yellow badge on each shot card indicating how confident the local brain was (e.g., `Brain: 94%`), highlighting any shot under 60% so the user can review it in seconds.
3. Enhance the **"Teach the Brain" (Retrain) button** in the UI:
   - When the user modifies any dropdown (Place, Action, B-Roll, or Graphic) on a shot card and clicks "Teach Brain", save the diff to `data/brain/feedback.jsonl`, re-run `brain.mjs` training in the background (~2.5s), and show a toast notification with the updated brain accuracy.
4. Make `ui/index.html` responsive with a toggle for **"Mobile App Preview Layout"** (bottom navigation bar, touch-friendly cards) so we can test it directly in our mobile browser / Antigravity preview before wrapping it in an Android APK later.
5. Verify the server starts cleanly and UI endpoints respond without errors.
```

**কিভাবে চেক করবেন:**
* `npm start` দিয়ে ব্রাউজারে (`http://127.0.0.1:4500`) যান। দেখুন প্রতিটা শট কার্ডে B-Roll, Graphics, Camera Move এবং Brain Confidence দেখাচ্ছে কি না।

## ধাপ ১২: ফাইনাল এন্ড-টু-এন্ড ভয়েস টেস্ট (৯৪ সেকেন্ডের বাংলা ভয়েস দিয়ে পরীক্ষা)

**কেন এই ধাপটি করবেন:** আপনার প্রজেক্টে ইতিমধ্যে মালিকের ৯৪ সেকেন্ডের একটি বাংলা ভয়েস টেস্ট আছে (`examples/out/owner-voice-bn-94s.mp4`), যেখানে আগে স্থির অংশ ছিল ৪৫% এবং কোনো B-Roll বা গ্রাফিক্স ছিল না। এই শেষ ধাপে আমরা সেই একই ভয়েস দিয়ে নতুন সিস্টেমের পূর্ণাঙ্গ আউটপুট পরীক্ষা করব।

**এজেন্টকে দেওয়ার প্রম্পট (কপি করে পেস্ট করুন):**

```text
Now let's execute the Final Step 12: End-to-End Voice-to-MP4 Benchmark & Quality Comparison against our previous baseline.

Tasks:
1. Run our full local pipeline (zero external AI) on the existing Bengali voice sample / test story used for `owner-voice-bn-94s.mp4` (and `sports-day-9x16.mp4`).
2. Run `server/videoqa.mjs` and the reference comparison analyzer on the newly rendered output video.
3. Measure and report the before-and-after metrics in `docs/STATUS.md` and `docs/TEST_RESULTS.md`:
   - Static/frozen frame percentage (must drop from the old 45% down to <10%)
   - Number of B-Roll cutaways/PiPs automatically inserted
   - Number of Motion Graphics / kinetic pop-ups automatically inserted
   - Shots per minute and camera variety
   - Total render time and `check-body.mjs` pass rate (must be 100%)
4. Print the final comparison table so I can review the completed local AI engine.
```

**কিভাবে চেক করবেন:**
* নতুন রেন্ডার হওয়া MP4 ভিডিওটি চালিয়ে দেখুন: চরিত্রগুলো নড়াচড়া করছে কি না, কথা অনুযায়ী B-Roll ও গ্রাফিক্স পপ-আপ আসছে কি না এবং স্থির অংশ ৪৫% থেকে কমে ১০%-এর নিচে নেমেছে কি না!
* ব্রাউজারে যখন এই ১২টি ধাপ শতভাগ মনের মতো আউটপুট দেবে, তখন আমরা আমাদের আগের ব্লুপ্রিন্ট (`zancut_2d_mobile_blueprint_bn.md`) অনুযায়ী মাত্র ২ দিনে পুরো ব্রাউজার অ্যাপটিকে অ্যান্ড্রয়েড APK-তে র‍্যাপ করে ফেলব।
