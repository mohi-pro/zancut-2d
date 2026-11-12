// Original practice stories, not quotations, user corrections, or evaluation stories.
// Labels are assistant editorial proposals. A missing field is intentionally unlabelled.
// Unsupported showing/writing variants omit action labels; small nods keep the body idle.
// The central character's present state wins over a remembered, quoted, or other person's state.
const stories = [];
const story = (id, lang, place, principle, beats) => stories.push({ id, lang, place, principle, beats });

story('bn-lost-sketch', 'bn', 'classroom', 'Loss, investigation and recovery have different emotional states; preserve the drawing action.', [
  ['চারুকলার শ্রেণিকক্ষে রুনা নিজের আঁকার খাতাটি মেলল।', 'read_book', 'neutral'],
  ['সবচেয়ে যত্নের ছবিটা ছেঁড়া দেখে তার চোখ ভিজে উঠল।', 'idle', 'sad'],
  ['কোথায় বাকি টুকরো আছে জানতে সে শিক্ষিকাকে প্রশ্ন করল।', 'ask_what_why', 'worried'],
  ['শিক্ষিকা পাশের ফাইল থেকে অক্ষত ছবিটি বের করে দেখালেন।', null, 'neutral'],
  ['আসল ছবিটা ফিরে পেয়ে রুনার মুখ উজ্জ্বল হয়ে উঠল।', 'idle', 'happy'],
  ['সে বন্ধুকে ছবির গল্প বুঝিয়ে বলতে শুরু করল।', 'talk_explain', 'happy']
]);
story('bn-roof-seedlings', 'bn', 'rooftop', 'A forecast is not the same as experienced weather; an outcome changes the reaction.', [
  ['বাড়ির ছাদে তুলি টবে লাগানো চারাগুলো পরীক্ষা করছিল।', 'idle', 'neutral'],
  ['ঝোড়ো হাওয়ায় পাতাগুলো ভেঙে যাবে ভেবে সে অস্থির হলো।', 'idle', 'worried'],
  ['দূরের কালো মেঘের দিকে সে আঙুল তুলে দেখাল।', 'point_at', 'worried'],
  ['নিরাপদ জায়গায় টব রাখার উপায় সে ভাইকে বুঝিয়ে বলল।', 'talk_explain', 'neutral'],
  ['হাওয়া থামার পর চারাগুলো অক্ষত দেখে সে হাঁপ ছাড়ল।', 'idle', 'happy'],
  ['পরদিনের পরিচর্যার কথা তুলি খাতায় লিখে রাখল।', null, 'neutral']
]);
story('bn-two-neighbours', 'bn', 'village_home', 'Attribute a reaction to its experiencer, not to every person in a sentence.', [
  ['গ্রামের বাড়ির বারান্দায় নীলা প্রতিবেশীর সঙ্গে বসল।', 'sit', 'neutral'],
  ['নীলা শান্ত মুখে শুনল, প্রতিবেশী হারানো ছাগলের জন্য কাঁদছেন।', 'idle', 'neutral'],
  ['প্রতিবেশীর কষ্টের কথা ভেবে নীলার নিজেরও মন ভার হলো।', 'idle', 'sad'],
  ['পাশের উঠানে ছাগলটি ফিরে এসেছে শুনে সে চমকে উঠল।', 'idle', 'surprised'],
  ['ছাগলটিকে সুস্থ দেখে নীলার দুশ্চিন্তা কেটে গেল।', 'idle', 'happy'],
  ['বিদায়ের সময় নীলা বারান্দা থেকে হাত নাড়ল।', 'wave', 'happy']
]);
story('bn-pottery-order', 'bn', 'market_bazaar', 'Financial trouble may worry someone; quoting a number does not require a graphic on every shot.', [
  ['কুমোরের বাজারের দোকানে অর্ণব মাটির পাত্র সাজাল।', 'idle', 'neutral'],
  ['বড় ক্রেতা অর্ডার বাতিল করায় তার মুখ মলিন হয়ে গেল।', 'idle', 'sad'],
  ['পরের দিনের মজুরি কোথা থেকে আসবে ভেবে সে উদ্বিগ্ন হলো।', 'idle', 'worried'],
  ['নতুন ক্রেতাকে সে পাত্র তৈরির পদ্ধতি বোঝাল।', 'talk_explain', 'neutral'],
  ['ক্রেতা সব পাত্র নেবেন বলায় অর্ণব আনন্দে হাততালি দিল।', 'clap', 'happy'],
  ['শেষে সে প্যাকেটটি ক্রেতার দিকে এগিয়ে দিল।', 'offer_give', 'happy']
]);
story('bn-clinic-reassurance', 'bn', 'hospital_clinic', 'Show concern and reassurance without inventing treatment or a medical conclusion.', [
  ['ক্লিনিকের অপেক্ষার ঘরে সেঁজুতি বাবার পাশে বসেছিল।', 'sit', 'neutral'],
  ['পরীক্ষার খবর আসছে না দেখে তার কপালে চিন্তার ভাঁজ পড়ল।', 'idle', 'worried'],
  ['কতক্ষণ অপেক্ষা করতে হবে সে সহকারীকে জিজ্ঞেস করল।', 'ask_what_why', 'worried'],
  ['সহকারী শান্তভাবে বললেন, ডাক পড়লে তিনি জানাবেন।', 'talk_explain', 'neutral'],
  ['বাবা স্বস্তি পেয়েছেন শুনে সেঁজুতির মুখে হাসি ফিরল।', 'idle', 'happy'],
  ['বাবার বাড়ানো হাত সে দুহাতে ধরে রাখল।', null, 'happy']
]);
story('bn-station-delay', 'bn', 'bus_stop', 'Waiting, anticipation and relief differ; never depict boarding while the person is still waiting.', [
  ['বাসস্টপের ছাউনির নিচে পলাশ ব্যাগ হাতে দাঁড়াল।', 'idle', 'neutral'],
  ['অনুষ্ঠান শুরু হয়ে যাবে অথচ বাস নেই, এই ভেবে সে অস্থির।', 'idle', 'worried'],
  ['সে কবজির ঘড়িটা চোখের সামনে তুলে সময় মিলিয়ে নিল।', 'check_watch', 'worried'],
  ['কুয়াশার ফাঁক দিয়ে নিজের বাসটি দেখে তার মুখ খুলে গেল।', 'idle', 'happy'],
  ['পাশের যাত্রীকে সে বাসের নম্বর আঙুল দিয়ে দেখাল।', 'point_at', 'happy'],
  ['চালককে ধন্যবাদ জানিয়ে পলাশ সামনের দিকে হাত নাড়ল।', 'wave', 'happy']
]);
story('bn-festival-return', 'bn', 'village_road', 'A remembered sad event does not override a clearly happy present reunion.', [
  ['উৎসবের সকালে ইমা গ্রামের সরু রাস্তা ধরে হাঁটল।', 'walk', 'neutral'],
  ['অনেকদিন পর বন্ধুকে দেখে সে দুহাত নেড়ে ডাকল।', 'wave', 'happy'],
  ['পুরোনো মনখারাপের দিনের কথা বললেও আজ তার চোখে আনন্দ।', 'talk_explain', 'happy'],
  ['বন্ধুর নতুন কাজের খবর শুনে ইমা বিস্ময়ে থমকে গেল।', 'idle', 'surprised'],
  ['তারপর সে সাফল্যের জন্য বন্ধুকে হাততালি দিয়ে অভিনন্দন জানাল।', 'clap', 'happy'],
  ['দুজন পাশাপাশি ধীরে ধীরে পথ ধরে এগিয়ে গেল।', 'walk', 'happy']
]);
story('bn-quiet-library', 'bn', 'classroom', 'A book on screen supports reading; figurative flight is not physical running or flying.', [
  ['বিদ্যালয়ের পড়ার ঘরে রিদয় বেঞ্চে বসে বই খুলল।', 'read_book', 'neutral'],
  ['গল্পে ভয় পেয়েছে এক রাজা, কিন্তু রিদয় শান্তভাবেই পড়ছে।', 'read_book', 'neutral'],
  ['পরের পাতায় অপ্রত্যাশিত শেষ দেখে সে চোখ বড় করল।', 'idle', 'surprised'],
  ['লেখকের মজার কথায় তার ঠোঁটের কোণে হাসি ফুটল।', 'idle', 'happy'],
  ['বন্ধুকে দেখানোর জন্য সে খোলা বইটি তুলে ধরল।', null, 'happy'],
  ['সময় উড়ে গেলেও রিদয় একই বেঞ্চে বসে রইল।', 'sit', 'neutral']
]);
story('bn-night-message', 'bn', 'bedroom', 'Negated danger is not present danger; show the recipient reaction rather than repeated phone inserts.', [
  ['নিজের শোবার ঘরে মেহের বালিশের পাশে বসে ছিল।', 'sit', 'neutral'],
  ['ফোনে অচেনা নম্বরের বার্তা দেখে সে থমকে গেল।', 'idle', 'surprised'],
  ['বন্ধু নিরাপদে পৌঁছায়নি ভেবে তার বুকের ভেতর দুশ্চিন্তা বাড়ল।', 'idle', 'worried'],
  ['বন্ধু লিখল যে কোনো বিপদ ঘটেনি, সে পৌঁছে গেছে।', null, null],
  ['খবরটা পড়েই মেহেরের মুখ থেকে উদ্বেগ সরে গেল।', 'idle', 'happy'],
  ['সে ধীরে মাথা নেড়ে ফোনটি পাশে রেখে দিল।', 'idle', 'neutral']
]);
story('bn-office-demonstration', 'bn', 'office_room', 'Describing an action is different from doing it; preserve the person who demonstrates.', [
  ['অফিসের টেবিলে নওরিন পরীক্ষার নোটগুলো খুলে রাখল।', 'idle', 'neutral'],
  ['সে বলল যে গতকাল দলের একজন দৌড়েছিল, নিজে স্থির দাঁড়িয়ে।', 'talk_explain', 'neutral'],
  ['বিষয়টি পরিষ্কার করতে নওরিন বোর্ডের দিকে আঙুল তুলল।', 'point_at', 'neutral'],
  ['প্রশ্ন শুনে প্রথমে তার ভ্রু দুটো ওপরে উঠল।', 'idle', 'surprised'],
  ['সমাধান বুঝতে পেরে সে নিশ্চিন্তভাবে মাথা নাড়ল।', 'idle', 'happy'],
  ['শেষে ল্যাপটপে নিজের সংশোধিত নোট টাইপ করতে বসল।', 'type_laptop', 'neutral']
]);
story('bn-farm-rain', 'bn', 'farm_field', 'Weather alone has no human facial expression; label an expression only when a person reacts.', [
  ['ধানের খেতে কৃষক হারুন মাটির অবস্থা দেখছিলেন।', 'idle', 'neutral'],
  ['খরা কাটবে না ভেবে হারুনের মুখে উদ্বেগ ফুটে উঠল।', 'idle', 'worried'],
  ['দিগন্তে বৃষ্টির মেঘ ভেসে এলো, মানুষ দেখা যাচ্ছে না।', 'idle', null, 'heavy_rain_clouds'],
  ['প্রথম ফোঁটা গায়ে পড়তেই হারুন আনন্দে দুহাত তুললেন।', 'both_hands_up', 'happy'],
  ['তিনি সহকর্মীকে জমির পানি যাওয়ার পথ দেখালেন।', 'point_at', 'neutral'],
  ['সন্ধ্যায় খেতের ধারে দাঁড়িয়ে হারুন স্বস্তির হাসি হাসলেন।', 'idle', 'happy']
]);
story('bn-sea-postcard', 'bn', 'sea_beach', 'Keep the actual beach setting; an imagined home must not teleport the scene.', [
  ['সমুদ্রের ধারের বালিতে জুঁই একটি চিঠি খুলল।', 'read_book', 'neutral'],
  ['বাড়ির কথা মনে পড়তেই তার চোখ দুটি ভারী হয়ে এলো।', 'idle', 'sad'],
  ['চিঠিতে মায়ের হাসির কথা আছে, তবু জুঁই এখন বিষণ্ণ।', 'read_book', 'sad'],
  ['পরের লাইন পড়ে জানল মা কাল এখানে আসবেন।', 'read_book', 'surprised'],
  ['দেখা হওয়ার আনন্দে সে চিঠিটি বুকে চেপে হাসল।', null, 'happy'],
  ['ঢেউয়ের পাশ দিয়ে জুঁই ধীরে হাঁটতে লাগল।', 'walk', 'happy']
]);
story('bn-mountain-map', 'bn', 'mountain_valley', 'A planning graphic supports orientation, but does not replace the central interaction.', [
  ['পাহাড়ের উপত্যকায় দিশা পথের মানচিত্র মেলে ধরল।', 'read_book', 'neutral'],
  ['কোন পথ নিতে হবে বুঝতে না পেরে সে দুশ্চিন্তায় পড়ল।', 'idle', 'worried'],
  ['সঙ্গীকে সে দুটো রাস্তার কথা প্রশ্ন করে জানতে চাইল।', 'ask_what_why', 'worried'],
  ['সঙ্গী নিরাপদ চেনা পথটির দিকে আঙুল দিয়ে দেখাল।', 'point_at', 'neutral'],
  ['চিহ্নগুলো মিলে যাওয়ায় দিশা স্বস্তিতে মাথা নাড়ল।', 'idle', 'happy'],
  ['তারপর তারা উপত্যকার পথ বেয়ে ধীরে হাঁটা দিল।', 'walk', 'neutral']
]);
story('bn-desert-shadow', 'bn', 'desert_dunes', 'Surprise can resolve without ongoing panic; do not use an unrelated rain insert.', [
  ['মরুর বালিয়াড়ির পাশে সাবিত ছায়া দেখে থামল।', 'idle', 'neutral'],
  ['আচমকা নড়ে ওঠা ছায়ায় তার চোখ গোল হয়ে গেল।', 'idle', 'surprised'],
  ['সামনে কে আছে না বুঝে সে উদ্বিগ্নভাবে অপেক্ষা করল।', 'idle', 'worried'],
  ['চেনা সঙ্গীকে চিনতে পেরে সাবিত হেসে হাত নাড়ল।', 'wave', 'happy'],
  ['এতক্ষণ ভুল বোঝার কথাটা সে বন্ধুকে বুঝিয়ে বলল।', 'talk_explain', 'happy'],
  ['দুজন বালির সরু পথ ধরে পাশাপাশি এগিয়ে গেল।', 'walk', 'neutral']
]);
story('bn-cafe-apology', 'bn', 'restaurant_cafe', 'Someone else laughing does not make the apologizing speaker happy.', [
  ['ক্যাফের কোণের টেবিলে সায়েম একা বসেছিল।', 'sit', 'neutral'],
  ['বন্ধু অপেক্ষা করছে জেনেও দেরি করায় সে মন খারাপ করল।', 'idle', 'sad'],
  ['বন্ধু হেসে উঠলেও সায়েম অনুতপ্ত মুখে ক্ষমা চাইল।', 'talk_explain', 'sad'],
  ['বন্ধু বলল অসুবিধা হয়নি, সায়েমের ভ্রু শিথিল হলো।', 'idle', 'neutral'],
  ['দুজনের ভুল বোঝাবুঝি মিটে গেলে সায়েমও হাসল।', 'idle', 'happy'],
  ['সে বন্ধুর দিকে খাতাটি বাড়িয়ে দিল।', 'offer_give', 'happy']
]);
story('bn-park-repair', 'bn', 'park', 'A broken object can motivate concern without physical collapse; an offer stays on screen.', [
  ['পার্কের বেঞ্চে বসে অনিক নিজের ঘুড়ি পরীক্ষা করল।', 'sit', 'neutral'],
  ['ঘুড়ির কাঠি ভাঙা দেখে তার মুখের হাসি মিলিয়ে গেল।', 'idle', 'sad'],
  ['ওড়ানোর সময় ফুরিয়ে যাবে ভেবে সে চিন্তায় পড়ল।', 'idle', 'worried'],
  ['মেরামতের সুতো পেয়ে সে বিস্ময়ে বন্ধুর দিকে তাকাল।', 'idle', 'surprised'],
  ['সাহায্যের জন্য অনিক আনন্দে বন্ধুকে হাততালি দিল।', 'clap', 'happy'],
  ['মেরামত করা ঘুড়িটি সে বন্ধুর হাতে তুলে দিল।', 'offer_give', 'happy']
]);
story('bn-kitchen-measure', 'bn', 'kitchen', 'A recipe step list is different from an unexplained data chart; no invented health claims.', [
  ['রান্নাঘরের টেবিলে বীথি পরিবারের রেসিপির খাতা রাখল।', 'idle', 'neutral'],
  ['পুরোনো পাতাটি না পেয়ে তার মুখে চিন্তা ফুটল।', 'idle', 'worried'],
  ['আলাদা খামে রাখা পাতাটি পেয়ে সে অবাক হলো।', 'idle', 'surprised'],
  ['প্রথমে উপকরণ মাপতে হবে, তারপর মেশাতে হবে বলে বীথি বোঝাল।', 'talk_explain', 'neutral', 'none', 'step_list_card'],
  ['তৈরি পিঠা দেখে পরিবারের প্রশংসায় তার মুখ উজ্জ্বল হলো।', 'idle', 'happy'],
  ['বীথি হাসতে হাসতে পিঠার থালাটি এগিয়ে দিল।', 'offer_give', 'happy']
]);
story('bn-riverside-meeting', 'bn', 'river_ghat', 'A safe reunion can end anticipation; do not turn an awaited boat into an actual boat ride.', [
  ['নদীর ঘাটের সিঁড়িতে ইশান ছোট বোনের জন্য দাঁড়াল।', 'idle', 'neutral'],
  ['ফেরার সময় পেরিয়ে যাওয়ায় ইশানের কপাল কুঁচকে উঠল।', 'idle', 'worried'],
  ['কখন নৌকা আসবে সে মাঝিকে জিজ্ঞাসা করল।', 'ask_what_why', 'worried'],
  ['চেনা নৌকার পাশেই বোনকে দেখে সে হাত তুলে ডাকল।', 'wave', 'happy'],
  ['বোনের দেওয়া অপ্রত্যাশিত উপহার দেখে ইশান হতবাক হলো।', 'idle', 'surprised'],
  ['উপহারটি হাতে নিয়ে সে আনন্দে মাথা নাড়ল।', 'receive_take', 'happy']
]);
story('bn-courthouse-note', 'bn', 'courthouse_hall', 'A formal setting does not imply guilt, fear or a legal result without transcript evidence.', [
  ['আদালতের হলঘরের বেঞ্চে আয়ান নথি নিয়ে বসেছিল।', 'sit', 'neutral'],
  ['নথির একটি পাতা খুঁজে না পেয়ে সে অস্থির হলো।', 'idle', 'worried'],
  ['সহকারীকে পাতাটির নম্বর সে শান্তভাবে বুঝিয়ে বলল।', 'talk_explain', 'neutral'],
  ['ভুল ফাইল থেকে পাতাটি বেরোতে দেখে সে অবাক হলো।', 'idle', 'surprised'],
  ['সব কাগজ গুছিয়ে পাওয়ায় আয়ানের উদ্বেগ কেটে গেল।', 'idle', 'happy'],
  ['সে নথিগুলো সহকারীর দিকে বাড়িয়ে দিল।', 'offer_give', 'neutral']
]);
story('bn-small-presentation', 'bn', 'school_yard', 'Expressions may change while the physical action stays still; no need for constant gestures.', [
  ['বিদ্যালয়ের উঠানে সোহা ছোট প্রদর্শনীর পাশে দাঁড়াল।', 'idle', 'neutral'],
  ['কেউ কাজটি দেখবে না ভেবে সে দুশ্চিন্তায় ছিল।', 'idle', 'worried'],
  ['দর্শক ভিড় করতে শুরু করলে তার চোখ বড় হয়ে গেল।', 'idle', 'surprised'],
  ['সোহা শান্ত গলায় নিজের কাজের পদ্ধতি বুঝিয়ে বলল।', 'talk_explain', 'neutral'],
  ['দর্শকদের প্রশংসা শুনে তার মুখে স্বস্তির হাসি ফুটল।', 'idle', 'happy'],
  ['শেষে বন্ধুদের দিকে সোহা হাত নেড়ে কৃতজ্ঞতা জানাল।', 'wave', 'happy']
]);

story('en-unexpected-repair', 'en', 'park', 'A remembered worry must not overwrite an explicit present smile.', [
  ['At the park bench, Leena examined her torn paper kite.', 'idle', 'neutral'],
  ['She lowered her eyes when she saw the ruined painting on it.', 'idle', 'sad'],
  ['Not knowing whether it could be repaired, she looked anxious.', 'idle', 'worried'],
  ['A friend produced the missing piece, and her eyes widened.', 'idle', 'surprised'],
  ['She described yesterday’s worry with a relieved smile today.', 'talk_explain', 'happy'],
  ['Leena offered the repaired kite to her friend.', 'offer_give', 'happy']
]);
story('en-shared-desk', 'en', 'office_room', 'The speaker and the person whose feelings are quoted can differ.', [
  ['At her office desk, Tara opened the project notebook.', 'read_book', 'neutral'],
  ['Tara listened calmly while her colleague described his anxiety.', 'idle', 'neutral'],
  ['Learning that her own notes were missing made Tara uneasy.', 'idle', 'worried'],
  ['The notebook was under her folder, an unexpected discovery.', 'idle', 'surprised'],
  ['Tara relaxed into a smile after finding every page.', 'idle', 'happy'],
  ['She typed a short summary on the office laptop.', 'type_laptop', 'neutral']
]);
story('en-seaside-letter', 'en', 'sea_beach', 'Thinking about home does not move the character away from the beach.', [
  ['On the sandy beach, Rehan unfolded a letter from home.', 'read_book', 'neutral'],
  ['Homesickness brought tears to his eyes as he read it.', 'read_book', 'sad'],
  ['The letter described a cheerful party, but Rehan still looked sad.', 'read_book', 'sad'],
  ['Then an unexpected invitation made him raise his eyebrows.', 'idle', 'surprised'],
  ['Knowing his family would visit brought a broad smile.', 'idle', 'happy'],
  ['Rehan walked slowly along the shore with the letter.', 'walk', 'happy']
]);
story('en-clinic-companion', 'en', 'hospital_clinic', 'Do not infer diagnoses, procedures or an emotion from the setting alone.', [
  ['In the clinic waiting room, Isha sat beside her aunt.', 'sit', 'neutral'],
  ['The long silence made Isha fret about the delayed news.', 'idle', 'worried'],
  ['She asked the assistant when the family would be called.', 'ask_what_why', 'worried'],
  ['The assistant explained the waiting arrangement in a calm voice.', 'talk_explain', 'neutral'],
  ['Her aunt felt comfortable again, and Isha smiled with relief.', 'idle', 'happy'],
  ['Isha nodded to thank the assistant for the update.', 'idle', 'happy']
]);
story('en-valley-path', 'en', 'mountain_valley', 'Unknown direction, discovery and confirmed orientation are separate beats.', [
  ['In the mountain valley, Omi stopped beside a trail marker.', 'idle', 'neutral'],
  ['Unable to match the marker to his map, he looked uneasy.', 'idle', 'worried'],
  ['He asked his companion which direction the village lay.', 'ask_what_why', 'worried'],
  ['A familiar sign appeared behind them, surprising Omi.', 'idle', 'surprised'],
  ['His companion pointed toward the familiar winding path.', 'point_at', 'neutral'],
  ['Omi smiled with relief and resumed walking along the valley.', 'walk', 'happy']
]);
story('en-market-package', 'en', 'market_bazaar', 'A number in dialogue does not automatically justify hiding a human exchange.', [
  ['At the market stall, Dev arranged the handmade cups.', 'idle', 'neutral'],
  ['A cancelled order left him with a disappointed expression.', 'idle', 'sad'],
  ['He worried about paying the workshop expenses tomorrow.', 'idle', 'worried'],
  ['Dev explained the cups’ patterns to a new customer.', 'talk_explain', 'neutral'],
  ['The customer chose a whole set, and Dev beamed.', 'idle', 'happy'],
  ['Dev offered the wrapped package to the customer.', 'offer_give', 'happy']
]);
story('en-roof-garden', 'en', 'rooftop', 'Describing danger is different from experiencing it; use visible evidence for reactions.', [
  ['On the rooftop, Noor checked the young plants in their pots.', 'idle', 'neutral'],
  ['She talked calmly about the storm that had already passed.', 'talk_explain', 'neutral'],
  ['One empty pot made her worry that a plant was gone.', 'idle', 'worried'],
  ['Finding it safe behind the watering can surprised her.', 'idle', 'surprised'],
  ['Noor smiled as she showed the little plant to her sister.', null, 'happy'],
  ['She nodded after they agreed where to keep the pots.', 'idle', 'neutral']
]);
story('en-classroom-showcase', 'en', 'classroom', 'Fear mentioned in a story belongs to the fictional character until the reader reacts.', [
  ['In the classroom, Rini opened her illustrated storybook.', 'read_book', 'neutral'],
  ['The story described a frightened king, while Rini read calmly.', 'read_book', 'neutral'],
  ['The unexpected ending made Rini stare at the page.', 'idle', 'surprised'],
  ['Her classmates appreciated the ending, and Rini smiled.', 'idle', 'happy'],
  ['She held the open book up for the class to see.', null, 'happy'],
  ['Rini explained how she had planned the final picture.', 'talk_explain', 'neutral']
]);

export const teachingStories = stories;
export const storyLessons = stories.flatMap(s => s.beats.map(([text, action, face, broll = 'none', graphic = 'none'], index) => ({
  text, place: s.place, ...(action ? { action } : {}), ...(face ? { face } : {}), broll, graphic,
  ctx: { prevText: s.beats[index - 1]?.[0] || '', nextText: s.beats[index + 1]?.[0] || '', prevPlace: index ? s.place : 'none' },
  lang: s.lang, family: `story-${s.id}`, storyId: s.id, beat: index + 1, teachingPrinciple: s.principle,
  source: 'assistant-curriculum', review: 'assistant-authored-reviewed', weight: 3
})));
