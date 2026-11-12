// Original assistant-authored teaching examples. They are not quotations/transcripts,
// independent human labels, or proof of real-world accuracy. Partial labels are intentional.
export const lessons = [];
const add = (family, labels, bn, en = '') => {
  for (const [lang, text] of [['bn', bn], ['en', en]]) for (const line of text.trim().split('\n').filter(Boolean)) lessons.push({ text: line.trim(), ...labels, lang, family, source: 'assistant-curriculum', review: 'assistant-authored-reviewed', weight: 3 });
};
add('reaction-loss', {face:'sad', action:'idle'}, `মায়ের পুরোনো চিঠিটি হারিয়ে মিনা চুপ করে রইল।
বন্ধুর মৃত্যুর খবর শুনে বৃদ্ধের চোখ ভিজে উঠল।
সারা দিনের পরিশ্রমের ফসল নষ্ট হয়ে গেল, করিমের মন ভেঙে গেল।
রুমানা বন্ধুর বিদায়ে নীরবে চোখের জল ফেলল।
শিশুটি ভাঙা খেলনাটা বুকে চেপে কাঁদছিল।
মেয়েটি তার অসুস্থ বোনকে দেখে মন খারাপ করে দাঁড়িয়ে আছে।
জিসান পরীক্ষায় অকৃতকার্য হয়ে মাথা নিচু করে রইল।
কেউ তার কথা বিশ্বাস করল না, সে একা চুপচাপ রইল।`, `The gardener stared sadly at the ruined flowers.
Her best friend had moved away and she felt lonely.
The little child cried over the broken toy.
After hearing of his friend's death, the old man stood in silence.`);
add('reaction-threat', {face:'worried',action:'idle'}, `অন্ধকার পথে পায়ের শব্দ শুনে তানিয়া ভয় পেল।
ছেলেটি হারিয়ে গেছে, বাবা কী করবেন বুঝতে পারছেন না।
আগামীকালের ভাড়া দেওয়ার টাকা নেই, করিমের কপালে ভাঁজ।
নৌকায় পানি ঢুকছে দেখে মাঝি আতঙ্কিত হয়ে তাকাল।
রোগীর অবস্থা দেখে পরিবারের সবাই উদ্বিগ্ন।
রাত হয়ে গেছে অথচ মেয়ে বাড়ি ফেরেনি, মা অস্থির।
দোকানের হিসাব মিলছে না, মালিক চিন্তায় পড়লেন।
ঝড়ে ঘরের চাল উড়ে যেতে পারে, বৃদ্ধের মুখে শঙ্কা।`, `The mother was anxious because her daughter had not returned.
He feared that the boat would sink.
The rent was due tomorrow and he had no money.
She heard footsteps in the dark and felt afraid.`);
add('reaction-relief', {face:'happy',action:'idle'}, `হারানো ব্যাগ ফিরে পেয়ে মিনা স্বস্তির হাসি হাসল।
ডাক্তার বললেন বিপদ কেটে গেছে, মা খুশি হলেন।
বহুদিন পর বন্ধুর দেখা পেয়ে রাফির মুখ উজ্জ্বল হলো।
বোনের ভালো ফল শুনে নাবিলা আনন্দ পেল।
প্রথম বেতনের খাম হাতে করিম মৃদু হাসল।
সবজি বিক্রি হয়ে গেছে, কৃষকের মুখে তৃপ্তির হাসি।
নতুন গাছের কুঁড়ি দেখে শিশুটি আনন্দ পেল।
সাহায্যের জন্য বৃদ্ধ হাসিমুখে কৃতজ্ঞতা জানালেন।`, `She smiled with relief when the missing bag was returned.
The farmer looked pleased with the harvest.
He was delighted to meet his friend again.
The child was happy to see a new leaf.`);
add('reaction-discovery', {face:'surprised',action:'idle'}, `বন্ধ বাক্সে আলো জ্বলছে দেখে মিনা হতবাক।
এত বড় মাছ আগে দেখেনি, শিশুটি অবাক হয়ে গেল।
নিজের নাম পুরস্কারের তালিকায় দেখে জিসান চমকে উঠল।
শুকনো পুকুরে হঠাৎ পানি দেখে সবাই বিস্মিত।
দরজায় বহুদিনের হারানো বন্ধুকে দেখে করিম অবাক।
এক রাতে গাছ এত বেড়ে গেছে দেখে সে বিশ্বাস করতে পারল না।`, `She was astonished to find a light inside the sealed box.
He could not believe his name was on the prize list.
The enormous fish left the child amazed.`);
add('neutral-observation', {face:'neutral',action:'idle'}, `সে মন দিয়ে কথাগুলো শুনল।
নাবিলা শান্তভাবে নিজের পালার জন্য অপেক্ষা করল।
করিম চুপ করে সামনে তাকিয়ে আছে।
কাজের তালিকাটি পড়ে সে কিছুক্ষণ ভাবল।
কেউ হাসছে না বা কাঁদছে না, সবাই মনোযোগ দিয়ে শুনছে।`, `He listened without speaking.
She waited calmly for her turn.
They watched quietly.`);
add('negative-emotion', {face:'neutral'}, `সে ভয় পায়নি, শান্ত মুখে অপেক্ষা করল।
মেয়েটি কাঁদছে না, চুপচাপ শুনছে।
করিম খুশি নয়, মুখে কোনো হাসি নেই।
কেউ অবাক হয়নি, খবরটা আগেই জানা ছিল।`, `He was not afraid and remained calm.
She was not crying; she was listening.
Nobody was surprised because they already knew.`);
add('negated-movement', {action:'idle',broll:'none',graphic:'none'}, `রাফি দৌড়ায়নি, সে সেখানেই দাঁড়িয়ে রইল।
মিনা হাঁটেনি, দরজার পাশে অপেক্ষা করল।
করিম হাততালি দেয়নি, চুপ করে অনুষ্ঠান দেখল।
তানিয়া কাউকে হাত নাড়ল না, স্থির হয়ে দাঁড়াল।
কেউ দৌড়াচ্ছে না, সবাই দাঁড়িয়ে শুনছে।
ছেলেটি বসেনি, জানালার পাশে দাঁড়িয়ে আছে।`, `He did not run; he stayed where he was.
She was not walking; she waited by the door.
Nobody clapped; they watched quietly.
He did not sit down; he remained standing.`);
add('literal-locomotion', {action:'walk',graphic:'none',broll:'none',face:'neutral'}, `রাফি ধীরে ধীরে সেতুর দিকে হেঁটে চলল।
মিনা বাজারের পথ ধরে হেঁটে গেল।
করিম পায়ে হেঁটে বাড়ি ফিরছিল।
নাবিলা এক পা এক পা করে সামনের দিকে এগোল।
লোকটি শান্তভাবে রাস্তা পার হয়ে গেল।`, `He walked slowly towards the bridge.
She crossed the road on foot.
The man walked back to his house.`);
add('urgent-locomotion', {action:'run',face:'worried',broll:'none',graphic:'none'}, `আগুন দেখে করিম দৌড়ে নিরাপদ জায়গায় গেল।
শেষ বাস ধরতে মিনা দ্রুত ছুটল।
শিশুটিকে বাঁচাতে রাফি প্রাণপণে দৌড়াল।
বৃষ্টি থেকে বাঁচতে সে ছুটে ঘরে ঢুকল।`, `He ran away from the fire.
She sprinted to catch the last bus.
The boy ran for shelter from the rain.`);
add('quiet-dialogue', {action:'talk_explain',broll:'none',graphic:'none',cameraMove:'steady'}, `মা শান্ত গলায় বোঝালেন কেন আগে কথা শুনতে হয়।
বৃদ্ধ লোকটি নিজের ছোটবেলার কথা বলতে লাগলেন।
শিক্ষক ধীরে ধীরে সমস্যাটি ব্যাখ্যা করলেন।
মিনা বলল, আমরা একসঙ্গে কাজটা শেষ করতে পারি।
করিম বন্ধুকে বুঝিয়ে বলল কীভাবে বীজ বুনতে হয়।
বাবা বললেন, কারও জিনিস নেওয়ার আগে অনুমতি চাইবে।`, `The teacher calmly explained the lesson.
His father said that they should listen first.
The old man told them about his childhood.
She explained how they could work together.`);
add('question', {action:'ask_what_why',broll:'none',graphic:'none'}, `মিনা জানতে চাইল, পাত্রটা এখানে কে রেখেছে?
রাফি জিজ্ঞেস করল, এখন আমরা কী করব?
শিশুটি বলল, চাঁদ দিনের বেলা কোথায় থাকে?
করিম প্রশ্ন করল, দোকান কখন খুলবে?
নাবিলা জানতে চাইল বন্ধুটি এত চুপ কেন।`, `She asked who had left the jar there.
He asked what they should do next.
The child wanted to know why the moon was visible.`);
add('receive-prop', {action:'receive_take',broll:'none',graphic:'none'}, `মিনা দুই হাত বাড়িয়ে খাতাটি নিল।
করিম বৃদ্ধের হাত থেকে ব্যাগ গ্রহণ করল।
শিশুটি মায়ের দেওয়া পেয়ালাটি সাবধানে নিল।`, `She reached out to receive the notebook.
He accepted the bag from the old man.`);
add('give-prop', {action:'offer_give',broll:'none',graphic:'none'}, `রাফি বন্ধুর দিকে বইটি বাড়িয়ে দিল।
মা শিশুটির হাতে খাবারের পাত্র এগিয়ে দিলেন।
করিম বৃদ্ধকে একটি চিঠি দিল।`, `He offered the book to his friend.
She held out the cup for the child.`);
add('seated', {action:'sit',broll:'none',graphic:'none'}, `ক্লান্ত মিনা বেঞ্চের ওপর বসল।
বৃদ্ধ লোকটি চেয়ারে বসে বিশ্রাম নিলেন।
করিম টেবিলের পাশে বসে অপেক্ষা করল।
তানিয়া বিছানার কিনারায় বসে রইল।`, `She sat down on the bench.
He rested in a chair beside the table.`);
add('reading', {action:'read_book',broll:'none',graphic:'none'}, `নাবিলা হাতে ধরা বইয়ের পাতা পড়ছে।
করিম খবরের কাগজের লেখায় চোখ রাখল।
শিশুটি বই খুলে গল্প পড়তে লাগল।`, `She opened her book and read quietly.
He read the letter carefully.`);
add('writing', {action:'write_desk',broll:'none',graphic:'none'}, `মিনা খাতায় পরিকল্পনাটি লিখে রাখল।
করিম কলম দিয়ে ঠিকানাটি লিখল।
শিক্ষক খাতায় হিসাব লিখছেন।`, `She wrote the plan in her notebook.
He used a pen to write the address.`);
add('phone-call', {action:'phone_call',broll:'none',graphic:'none'}, `করিম কানে ফোন ধরে বন্ধুর সঙ্গে কথা বলল।
মা মোবাইলে মেয়ের খবর নিলেন।
নাবিলা ফোনে সাহায্য চাইল।`, `He held the phone to his ear and called his friend.
She spoke to her daughter on the phone.`);
add('drink', {action:'drink_cup',broll:'none',graphic:'none'}, `মিনা পেয়ালা থেকে ধীরে এক চুমুক নিল।
করিম হাতে ধরা কাপ থেকে পানি খেল।
বৃদ্ধ লোকটি চা পান করছেন।`, `She took a sip from the cup.
He drank some water from his mug.`);
add('think', {action:'chin_think',broll:'none',graphic:'thought_cloud'}, `সমস্যার সমাধান খুঁজতে করিম থুতনিতে হাত রেখে ভাবল।
মিনা মনে মনে একটা নতুন উপায় কল্পনা করল।
রাফি ভাবল কীভাবে বন্ধুকে সাহায্য করা যায়।`, `He rested his hand on his chin and thought of a solution.
She imagined a way to help her friend.`);
add('point', {action:'point',broll:'none',graphic:'none'}, `মিনা সামনের দরজাটির দিকে আঙুল দেখাল।
বাবা জানালার বাইরের গাছটি দেখালেন।
রাফি রাস্তার বাঁকটি নির্দেশ করল।`, `She pointed towards the door.
He pointed to the bend in the road.`);
add('applause', {action:'clap',face:'happy',broll:'none',graphic:'none'}, `মিনার কাজ দেখে সবাই হাততালি দিল।
করিম আনন্দে হাততালি দিতে লাগল।
অনুষ্ঠান শেষে শিক্ষক হাততালি দিলেন।`, `Everyone clapped for her work.
He applauded with a smile.`);
add('goodbye', {action:'wave',broll:'none',graphic:'none'}, `মিনা দূর থেকে বন্ধুকে হাত নেড়ে বিদায় জানাল।
করিম বাসের জানালা দিয়ে হাত নাড়ল।
বাবা দরজায় দাঁড়িয়ে হাত নেড়ে অভিবাদন জানালেন।`, `She waved goodbye to her friend.
He waved from the bus window.`);
// Explicit places; never infer a new location solely because the narrator mentions a topic.
const places = [
 ['bedroom','মিনা নিজের শোবার ঘরে বিছানার পাশে দাঁড়িয়ে আছে।','বালিশ আর খাটসহ ঘরটিতে নাবিলা ঢুকল।','She was in her bedroom beside the bed.'],
 ['village_home','করিম গ্রামের বাড়ির উঠানে অপেক্ষা করছে।','টিনের বাড়ির আঙিনায় মা দাঁড়িয়ে আছেন।','He waited in the courtyard of the village house.'],
 ['village_road','মিনা গ্রামের মাটির রাস্তায় থামল।','ধানখেতের পাশের কাঁচা পথে করিম দাঁড়িয়ে আছে।','She stopped on the dirt road through the village.'],
 ['school_yard','স্কুলের খেলার মাঠে শিশুরা জড়ো হলো।','বিদ্যালয়ের উঠানে ঘণ্টা বাজল।','The children gathered in the school playground.'],
 ['classroom','শ্রেণিকক্ষে শিক্ষক বোর্ডের পাশে দাঁড়ালেন।','মিনা ক্লাসের ঘরে বেঞ্চের কাছে আছে।','The teacher stood beside the classroom board.'],
 ['city_street','ব্যস্ত শহরের রাস্তায় করিম অপেক্ষা করছে।','ফুটপাতের পাশে শহরের গাড়িগুলো চলছে।','He waited beside a busy city street.'],
 ['park','মিনা পার্কের বেঞ্চের কাছে দাঁড়াল।','সন্ধ্যায় বাগানের হাঁটার পথে নাবিলা থামল।','She stood beside a bench in the park.'],
 ['living_room','বসার ঘরে সোফার সামনে করিম দাঁড়িয়ে আছে।','পরিবার ড্রয়িং রুমে জড়ো হয়েছে।','The family gathered in the living room.'],
 ['kitchen','মা রান্নাঘরে চুলার পাশে আছেন।','হাঁড়ি পাতিল রাখা রান্নার ঘরে মিনা ঢুকল।','She entered the kitchen beside the stove.'],
 ['market_bazaar','করিম সবজির বাজারে দোকানের সামনে দাঁড়াল।','হাটের ভিড়ে মিনা ফলের দোকান খুঁজছে।','He stood at a vegetable stall in the bazaar.'],
 ['tea_stall','চায়ের দোকানে করিম পেয়ালার জন্য অপেক্ষা করছে।','রাস্তার পাশের টং দোকানে বৃদ্ধ বসে আছেন।','He waited for tea at the roadside tea stall.'],
 ['office_room','অফিসের ঘরে ডেস্কের পাশে নাবিলা দাঁড়াল।','কম্পিউটার রাখা কর্মস্থলের কক্ষে করিম ঢুকল।','She entered the office room beside the desk.'],
 ['hospital_clinic','ক্লিনিকে রোগীর শয্যার পাশে মা অপেক্ষা করছেন।','হাসপাতালের চিকিৎসার কক্ষে করিম দাঁড়াল।','She waited beside the patient in the hospital clinic.'],
 ['river_ghat','নদীর ঘাটে বাঁধা নৌকার পাশে করিম দাঁড়াল।','মিনা নদীর পাড়ের সিঁড়িতে অপেক্ষা করছে।','He waited beside a boat at the river landing.'],
 ['bus_stop','বাসস্টপের ছাউনির নিচে নাবিলা দাঁড়িয়ে আছে।','করিম বাসের অপেক্ষায় স্টপেজে থামল।','She waited under the shelter at the bus stop.'],
 ['rooftop','করিম বাড়ির ছাদের রেলিংয়ের কাছে দাঁড়াল।','মিনা ছাদে উঠে আকাশ দেখল।','He stood beside the railing on the rooftop.'],
 ['forest_path','বনের সরু পথে নাবিলা থামল।','ঘন জঙ্গলের গাছঘেরা পথে করিম দাঁড়িয়ে আছে।','She stopped on the narrow forest path.'],
 ['restaurant_cafe','রেস্তোরাঁয় টেবিলের পাশে মিনা অপেক্ষা করছে।','ক্যাফের কাউন্টারের কাছে করিম দাঁড়াল।','He stood beside the counter in the cafe.'],
 ['courthouse_hall','আদালতের হলঘরে করিম চুপ করে দাঁড়াল।','বিচারক আসার আগে সবাই কোর্টের কক্ষে অপেক্ষা করছে।','He waited quietly in the courthouse hall.'],
 ['farm_field','ধানের খেতে কৃষক ফসল দেখছেন।','মিনা চাষের জমিতে দাঁড়িয়ে আছে।','The farmer stood in the crop field.'],
 ['sea_beach','সমুদ্রসৈকতে মিনা ঢেউ দেখছে।','সমুদ্রের তীরের বালিতে করিম দাঁড়াল।','She watched the ocean from the sandy beach.'],
 ['mountain_valley','পাহাড়ের উপত্যকায় করিম থামল।','পর্বতের নিচের সবুজ উপত্যকায় মিনা দাঁড়িয়ে আছে।','He stopped in the valley between the mountains.'],
 ['desert_dunes','মরুভূমির বালিয়াড়িতে করিম দাঁড়াল।','শুকনো মরুর বালির ঢিবির পাশে মিনা অপেক্ষা করছে।','She waited beside a sand dune in the desert.']
];
for (const [place,b1,b2,en] of places) add('place-'+place,{place},`${b1}\n${b2}`,en);
add('price-comparison',{graphic:'dynamic_comparison_chart',broll:'none',action:'idle'},`গল্পের দোকানে খাতার দাম আগে ২৫ টাকা ছিল, এখন ৩৮ টাকা।
গত মাসে বিক্রি ছিল ১২ ঝুড়ি, এই মাসে ১৯ ঝুড়ি।
মিনা হিসাব করল, খরচ ৮০ থেকে কমে ৬০ টাকা হয়েছে।
আগে চার দিনে কাজ হতো, এবার দুই দিনে শেষ হলো।
চালের দুটি দামের তুলনা করল করিম: ৪৮ টাকা আর ৫৬ টাকা।`,`In this fictional shop the price rose from 25 to 38 taka.
The expense fell from 80 to 60 taka.
They compared twelve baskets last month with nineteen this month.`);
add('percentage',{graphic:'percentage_progress_ring',broll:'none',action:'idle'},`গল্পের গ্রামের ৬০ শতাংশ পরিবার নতুন উদ্যোগে যোগ দিল।
এই কাল্পনিক সমীক্ষায় ৭২% মানুষ সম্মতি জানাল।
কাজটির ৪৫ শতাংশ শেষ হয়েছে বলে মিনা জানাল।
করিম বলল, এই গল্পে ৯০ শতাংশ বীজ অঙ্কুরিত হয়েছে।`,`In the story, 60 percent of the families joined.
They had completed 45% of the task.`);
add('number',{graphic:'number_badge_pop',broll:'none'},`মোট ১৮টি বই সংগ্রহ করল মিনা।
এই গল্পের প্রতিযোগিতায় ২৭ জন অংশ নিল।
করিম গুনে দেখল, ঝুড়িতে ৩৬টি আম আছে।`,`They collected a total of eighteen books.
Twenty-seven people joined the fictional contest.`);
add('ordered-list',{graphic:'step_list_card',broll:'none'},`প্রথমত, পরিকল্পনাটি খাতায় লিখে নাও।
দ্বিতীয়ত, বন্ধুদের কাজ ভাগ করে দাও।
তৃতীয়ত, শেষে সবকিছু পরীক্ষা করো।
আমাদের কাজ তিনটি: সংগ্রহ, বাছাই, ব্যবহার।`,`First, write down the plan.
Second, divide the work among friends.
Third, check the result.`);
const inserts = [
 ['clock_ticking','দেয়ালের ঘড়ির কাঁটা টিকটিক করে এগিয়ে চলে।','The clock kept ticking as time passed.'],
 ['calendar_pages_flying','ক্যালেন্ডারের পাতা বদলাতে বদলাতে কয়েক সপ্তাহ পেরিয়ে গেল।','Weeks passed as the calendar pages turned.'],
 ['sunrise_to_sunset','ভোরের আলো থেকে বিকেলের রোদ, একটি দিন কেটে গেল।','The sun crossed the sky and the day passed.'],
 ['heavy_rain_clouds','বাইরে আকাশে ঘন মেঘ জমে প্রবল বৃষ্টি নামল।','Heavy rain fell beneath the dark clouds.'],
 ['night_stars_moon','রাতের আকাশে চাঁদ আর তারা দেখা যাচ্ছে।','The moon and stars shone in the night sky.'],
 ['money_coins_stacking','সঞ্চয়ের বাক্সে একটির পর একটি মুদ্রা জমছে।','Coins accumulated in the savings box.'],
 ['empty_wallet_fly','খালি মানিব্যাগে একটি টাকাও অবশিষ্ট নেই।','There was no money left in the empty wallet.'],
 ['laptop_typing_fast','ল্যাপটপের কিবোর্ডে দ্রুত টাইপ করার শব্দ শোনা যায়।','Fingers typed quickly on the laptop keyboard.'],
 ['phone_ringing_vibrate','টেবিলের ওপর রাখা ফোনটি বেজে উঠল।','The phone rang and vibrated on the table.'],
 ['teacup_steaming','গরম চায়ের পেয়ালা থেকে ধোঁয়া উঠছে।','Steam rose from the hot cup of tea.'],
 ['heartbeat_pulse','বুকের ধুকপুক শব্দ যেন দ্রুত হয়ে উঠল।','A heartbeat pulsed rapidly.'],
 ['lightbulb_idea','সমস্যা নিয়ে ভাবতে ভাবতে মাথায় একটি বুদ্ধি এলো।','A new idea suddenly occurred to her.'],
 ['hourglass_sand','বালুঘড়ির বালি ধীরে ধীরে নিচে নামছে।','Sand slipped through the hourglass.'],
 ['thunder_lightning','দূরের আকাশে বজ্রপাত হলো, মেঘ গর্জে উঠল।','Thunder rolled after a flash of lightning.'],
 ['wind_leaves_blowing','হাওয়ায় শুকনো পাতাগুলো উড়ে যাচ্ছে।','Dry leaves drifted in the wind.'],
 ['rice_bowl_steam','সদ্য রান্না করা ভাতের বাটি থেকে বাষ্প উঠছে।','Steam rose from a bowl of freshly cooked rice.'],
 ['books_stack_study','পড়ার টেবিলে বইয়ের স্তূপ সাজানো আছে।','A stack of study books lay on the desk.'],
 ['bus_passing_road','রাস্তা দিয়ে একটি বাস চলে গেল।','A bus passed along the road.'],
 ['notification_bell','মোবাইলে নতুন বার্তার নোটিফিকেশন এল।','A notification announced a new message.'],
 ['map_route_travel','মানচিত্রে যাত্রার পথটি দেখানো হলো।','The map showed the route of the journey.'],
 ['exam_result_grade','পরীক্ষার ফলের কাগজে নম্বর দেখা যাচ্ছে।','The examination result showed the final grades.'],
 ['fire_flames','চুলার আগুনের শিখা জ্বলছে।','Flames flickered in the stove.'],
 ['question_marks_float','রহস্যটির কোনো উত্তর পাওয়া যাচ্ছে না।','The mystery raised unanswered questions.']
];
for (const [broll,bn,en] of inserts) add('insert-'+broll,{broll,graphic:'none'},bn,en);
// Object mentions alone do not mean that the object needs a cutaway.
add('object-is-not-insert',{broll:'none',graphic:'none'},`মিনা ফোনটা পকেটে রেখে বন্ধুর কথা শুনল।
করিম বই হাতে দাঁড়িয়ে মায়ের সঙ্গে কথা বলল।
মা চায়ের কাপ হাতে মেয়ের খবর শুনছেন।
বৃষ্টি নিয়ে কথা বলতে বলতে তারা ঘরের ভেতরেই রইল।
সে টাকার কথা বলল, কোনো সংখ্যা বা তুলনা দিল না।
আগুনের গল্প শুনে শিশুটি মায়ের দিকে তাকাল।
বন্ধুর হাতে একটি চিঠি দিল রাফি।
দোকানের সামনে মিনা আর করিম কথা বলছে।`,`She put her phone away and listened to her friend.
He held a book while talking to his mother.
They discussed the rain without leaving the room.
She mentioned money without giving any figures.`);
// Context examples are authored as whole sequences; a place-neutral line stays in its
// established location. No reference dialogue or protected benchmark sentence is copied.
const continuations = [
 ['সে চুপ করে মাথা নাড়ল।','idle','neutral'],['মিনা ধীরে বেঞ্চে বসল।','sit','neutral'],['করিমের মুখে স্বস্তির হাসি ফুটল।','idle','happy'],['সে আশঙ্কায় কপাল কুঁচকাল।','idle','worried'],['নাবিলা বিস্ময়ে তাকিয়ে রইল।','idle','surprised'],['মিনা চোখের জল ফেলল।','idle','sad']
];
for(const [place,bn] of places) for(const [text,action,face] of continuations) lessons.push({text,ctx:{prevText:bn,nextText:'',prevPlace:place},place,action,face,broll:'none',graphic:'none',cameraMove:'steady',family:'continuity-'+place,lang:'bn',source:'assistant-curriculum',review:'assistant-authored-reviewed',weight:2});
const roleRows = [
 ['mother','মা মেয়েকে শান্তভাবে বোঝালেন।','The mother explained it to her daughter.'],
 ['father','বাবা ছেলেকে পাশে ডাকলেন।','The father called his son over.'],
 ['teacher','শিক্ষক ছাত্রদের কথা মন দিয়ে শুনলেন।','The teacher listened to the pupils.'],
 ['baba','বৃদ্ধ লোকটি লাঠি হাতে দাঁড়িয়ে আছেন।','The elderly man stood with his walking stick.'],
 ['boy','ছেলেটি খাতাটা বন্ধ করল।','The boy closed his notebook.'],
 ['girl','মেয়েটি জানালার পাশে দাঁড়াল।','The girl stood beside the window.']
];
for(const [role,bn,en] of roleRows)add('role-'+role,{roles:[role]},bn,en);
// Reference-derived structural lessons expressed as new situations, never original dialogue.
add('ref1-reaction',{place:'living_room',face:'worried',action:'idle',broll:'none'},`পরিবারের আলোচনায় মিনা উদ্বিগ্ন মুখে শুনছে।
বসার ঘরে বোনের দুঃসংবাদ শুনে নাবিলা চিন্তিত হলো।`);
add('ref2-care',{place:'hospital_clinic',face:'worried',action:'idle',broll:'none'},`ক্লিনিকের শয্যার পাশে করিম উদ্বিগ্ন হয়ে অপেক্ষা করল।
রোগীর পাশে নাবিলা চিন্তায় চুপ করে আছে।`);
add('ref3-domestic',{place:'kitchen',action:'stir_pot',broll:'none'},`রান্নাঘরে মা হাতা দিয়ে হাঁড়ির খাবার নাড়ছেন।
চুলার পাশে করিম পাত্রের ভেতর নাড়তে লাগল।`);
add('ref4-conversation',{action:'talk_explain',broll:'none',cameraMove:'steady'},`দুই বন্ধু মুখোমুখি দাঁড়িয়ে কাজের পরিকল্পনা নিয়ে কথা বলল।
নাবিলা সঙ্গীর দিকে তাকিয়ে ধীরে নিজের মত ব্যাখ্যা করল।`);
add('ref5-practical',{action:'offer_give',broll:'none'},`মিনা পুরোনো বোতল দিয়ে বানানো পাত্রটি বন্ধুকে এগিয়ে দিল।
করিম নতুন চারাগাছটি প্রতিবেশীর হাতে তুলে দিল।`);
// Second teaching batch: situational language, money/measurement semantics and transitions.
// Inspired by development-set error categories, never copied benchmark sentences.
add('implicit-disappointment',{face:'sad'},`চাকরির আবেদন আবার বাতিল হলো, মিনার মনটা ভারী হয়ে গেল।
সারা বছর যত্ন করা গাছটি মরে গেছে, শিশুটি চোখ নামিয়ে রাখল।
পরিশ্রমের স্বীকৃতি না পেয়ে করিমের চোখে জল এল।
বন্ধু প্রতিশ্রুতি রাখেনি, নাবিলা হতাশ হয়ে বসে আছে।
শেষ ট্রেন চলে যাওয়ায় বাড়ি যাওয়ার আশা ভেঙে গেল।
চিঠিতে বিচ্ছেদের খবর পড়ে সে নিঃশব্দে কাঁদল।`,`Another rejection left her heart heavy.
His cherished plant had died and he looked down sadly.
She felt disappointed when her friend broke the promise.`);
add('implicit-fear',{face:'worried'},`চোখের সামনে সেতুর কাঠ ভেঙে যাচ্ছে, করিমের বুক কেঁপে উঠল।
বিপদের খবর শুনে নাবিলার হাত ঠান্ডা হয়ে গেল।
পথ চিনতে না পেরে শিশুটি চারদিকে ভীত চোখে তাকাল।
কাল কাজ থাকবে কি না, এই দুশ্চিন্তায় মা ঘুমাতে পারছেন না।
অচেনা শব্দে বৃদ্ধের মুখ ফ্যাকাশে হয়ে গেল।
ঝুড়িতে সাপ দেখে মিনা আঁতকে উঠল।`,`She froze in fear at the unfamiliar noise.
He worried about losing his job tomorrow.
The lost child looked around anxiously.`);
add('implicit-confidence',{face:'happy'},`সব বাধা পেরিয়ে কাজটি শেষ হয়েছে, করিমের মুখ উজ্জ্বল।
ছোট্ট চারায় প্রথম ফুল দেখে মিনা তৃপ্ত হলো।
বন্ধুর সাহায্যে বিপদ কেটেছে, নাবিলা হাঁফ ছেড়ে বাঁচল।
ভালো খবরের চিঠি পড়ে বৃদ্ধের মুখে হাসি ফুটল।
সন্তানের সাফল্যে মা গর্ব অনুভব করলেন।`,`Relief spread across her face when help arrived.
He felt proud of his daughter's achievement.
The first flower brought a smile to her face.`);
add('waiting-clock',{action:'check_watch',broll:'clock_ticking',cameraMove:'steady'},`অনেকক্ষণ অপেক্ষা করে করিম কবজির ঘড়ি দেখল।
সময় ফুরিয়ে আসছে দেখে মিনা ঘড়ির দিকে তাকাল।
গাড়ি আসতে দেরি হচ্ছে, নাবিলা আবার সময় দেখল।
দেখতে দেখতে বেশ কিছুক্ষণ পেরিয়ে গেল, সে ঘড়ি পরীক্ষা করল।`,`He checked his watch after a long wait.
With time running out, she glanced at the clock.`);
add('computer-work',{action:'type_laptop',broll:'laptop_typing_fast',place:'office_room'},`কর্মস্থলে এসে নাবিলা কম্পিউটারে প্রতিবেদন টাইপ করতে বসল।
অফিসের ডেস্কে করিম ল্যাপটপ খুলে হিসাব লিখতে লাগল।
কিবোর্ডে আঙুল চালিয়ে মিনা কাজের তালিকা লিখল।`,`She opened her laptop at the office and typed the report.
He started entering the figures on the office computer.`);
add('meeting-friend',{action:'wave',face:'happy',broll:'none'},`পরিচিত বন্ধুকে দেখে মিনা হাত তুলে অভিবাদন করল।
অনেকদিন পর দেখা, করিম দূর থেকে হাত নেড়ে হাসল।
রাস্তায় পরিচিত মানুষটিকে দেখে নাবিলা হাত নাড়ল।`,`She greeted her old friend with a wave.
He waved happily when he recognized his neighbour.`);
add('travel-towards',{place:'village_road',action:'walk',broll:'none'},`বিদ্যালয়ে যাওয়ার পথে মিনা মাটির রাস্তা ধরে হাঁটছে।
করিম হাসপাতালের দিকে পায়ে হেঁটে রওনা হলো।
বাজারে পৌঁছানোর আগে নাবিলা গ্রামের পথ ধরে চলল।
বাড়ি ফেরার জন্য করিম রাস্তা ধরে হাঁটা শুরু করল।
নদীর ঘাটের উদ্দেশে মিনা পায়ে হেঁটে যাচ্ছে।`,`She was walking along the road on her way to school.
He set off on foot towards the clinic.
Before reaching the market, she followed the village path.`);
add('scene-not-human',{action:'idle',face:'neutral',graphic:'none',cameraMove:'gentle_pan'},`দিগন্তে রোদের রং ধীরে বদলে যাচ্ছে।
দূরের গাছের পাতায় হাওয়া দোল খেলছে।
পুকুরের পানিতে সন্ধ্যার আলো পড়ল।
নদীর ওপারে আলো জ্বলে উঠল।
আকাশে মেঘ ধীরে ভেসে যাচ্ছে।`,`Evening light spread across the pond.
Clouds drifted slowly across the sky.
The leaves moved in a gentle breeze.`);
add('shock-reaction',{face:'surprised',graphic:'comic_emotion_fx',cameraMove:'impact_shake'},`হিসাবের অঙ্ক দেখে মিনা হতবাক হয়ে গেল।
অচেনা শব্দে করিম চমকে উঠল।
দরজা খুলেই অসম্ভব দৃশ্য দেখে সে চোখ বড় করল।
কেউ হঠাৎ জোরে চিৎকার করায় নাবিলা চমকে গেল।`,`The impossible sight made him gasp.
The sudden shout startled her.
She stared at the unexpected bill in disbelief.`);
add('gentle-scenery',{graphic:'none',cameraMove:'gentle_pan',face:'neutral'},`ভোরের কুয়াশা ধীরে মাঠের ওপর ভাসছে।
মৃদু বাতাসে গাছের ডাল দুলে উঠল।
বিকেলের নদীর ওপর আলো ঝিকমিক করছে।
শান্ত বাগানে পাখির ডাক শোনা যায়।`,`Mist hung over the quiet fields.
Light shimmered on the afternoon river.
A breeze moved through the garden.`);
add('figurative-no-literal',{action:'idle',broll:'none'},`কথাটা শুনে করিমের মাথা ঘুরে গেল, সে কিন্তু পড়ে যায়নি।
মিনার মাথায় অনেক কাজ, কোনো বস্তু তার মাথার ওপর নেই।
সুযোগ হাতছাড়া হয়েছে বলে নাবিলা মন খারাপ করল।
সুখে তার মন নেচে উঠল, শরীর নিয়ে সে নাচছে না।
সময় উড়ে গেল, আকাশে কোনো ঘড়ি উড়ছে না।`,`His heart sank at the news, but he remained standing.
She had a lot on her plate, but she was not eating.
Time flew by while he waited.`);
add('numeric-words',{graphic:'percentage_progress_ring',broll:'none',cameraMove:'slow_push_in'},`গল্পের দোকানে পনেরো শতাংশ ছাড় ঘোষণা করা হলো।
এই কল্পিত সমীক্ষায় চল্লিশ শতাংশ ভোট পড়েছে।
কাজের অর্ধেক শেষ হয়েছে, মিনা তা দেখাল।
কাল্পনিক গ্রামের পঁয়ষট্টি শতাংশ পরিবার উদ্যোগে যোগ দিয়েছে।`,`In the fictional sale, customers received fifteen percent off.
Half of the work was complete.
Forty percent of the fictional survey participants agreed.`);
add('single-measurement',{graphic:'number_badge_pop',broll:'none'},`এখন এই গল্পে চালের দাম কেজিতে ৫৩ টাকা।
করিম মোট ২৪ টাকা জমা দিল।
মিনা পরীক্ষায় ৮৮ নম্বর পেয়েছে।
দোকানের হিসাব অনুযায়ী আজ ১৭টি পাত্র বিক্রি হয়েছে।`,`In this story a kilogram costs 53 taka.
She scored 88 marks in the test.
They sold seventeen pots today.`);
add('monthly-yearly',{graphic:'dynamic_comparison_chart',broll:'none'},`প্রতি মাসে ৩০০ টাকা রেখে বছরে ৩৬০০ টাকা জমল।
মিনা হিসাব করল, দিনে ৫টি হলে ছয় দিনে ৩০টি হবে।
করিমের হিসাবে সপ্তাহে ৮০ টাকা থেকে মাসে ৩২০ টাকা হলো।`,`Saving 300 each month gives 3600 over twelve months.
Five items per day becomes thirty items in six days.`);
add('new-data-only',{broll:'market_price_up',graphic:'dynamic_comparison_chart'},`এই গল্পের দোকানে পাত্রের দাম ২২ থেকে ৩১ টাকা হয়েছে।
সবজির মূল্য আগে ২৮ টাকা ছিল, এখন ৩৭ টাকা।
কল্পিত বাজারে এক মাসে দাম ১৪ থেকে ১৯ টাকা বেড়েছে।`,`In the fictional market the price rose from 22 to 31.
The story compares a price of 28 before with 37 now.`);
const carry = [
 ['সে নিজের খরচের কথা শান্তভাবে বলল।','talk_explain','neutral'],
 ['আকাশে মেঘ জমলেও তারা সেখানেই রইল।','idle','neutral'],
 ['বিক্রি গত মাসের চেয়ে কমেছে শুনে মিনা চিন্তিত।','idle','worried'],
 ['করিম বলল, এবার নতুন করে চেষ্টা করা যাক।','talk_explain','neutral'],
 ['কথাটা শুনে সবাই হাততালি দিল।','clap','happy'],
 ['একটু অপেক্ষার পর তারা বিদায়ের প্রস্তুতি নিল।','idle','neutral'],
 ['মিনা জিজ্ঞেস করল, এই কাজের দায়িত্ব কে নেবে?','ask_what_why','neutral'],
 ['নিজের ছোটবেলার কথা বলতে শুরু করল করিম।','talk_explain','neutral'],
 ['নাবিলা হাতের বইটি পড়তে লাগল।','read_book','neutral'],
 ['এখানেই সে পাত্রটি বন্ধুর দিকে বাড়িয়ে দিল।','offer_give','neutral']
];
for(const [place,bn] of places)for(const [text,action,face] of carry)lessons.push({text,ctx:{prevText:bn,nextText:'',prevPlace:place},place,action,face,lang:'bn',family:'context-diversity-'+place,source:'assistant-curriculum',review:'assistant-authored-reviewed',weight:2});
