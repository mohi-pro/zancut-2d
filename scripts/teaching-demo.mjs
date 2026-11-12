// Original story demo through the app's native pipeline. No generated voice: a captioned
// story with local music/SFX. The story is never fed back as evaluation or training data.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname),out=path.join(root,'data/teaching/2026-11-09/demo');
process.env.ZANCUT_DATA=path.join(out,'store');process.env.npm_config_offline='true';
fs.mkdirSync(path.join(out,'store/brain'),{recursive:true});
const stage=process.argv.includes('--render')?'render':process.argv.includes('--rebuild')?'rebuild':'build';
if(stage!=='render')for(const f of ['model.json','learned-knowledge.json','learned-creations.json','strict-rules.json']){const src=path.join(root,'data/brain',f);if(fs.existsSync(src))fs.copyFileSync(src,path.join(out,'store/brain',f));}
const store=await import('../server/store.mjs'),agent=await import('../server/agent.mjs');
const {localOwner}=await import('../server/local-owner.mjs');
const {planFromBrain}=await import('../server/brainplan.mjs');
const {jobDir}=await import('../server/director.mjs');
const {probe}=await import('../server/media.mjs');
const lines=[
 'বিকেলে মিনা গ্রামের বাড়ির উঠানে পুরোনো একটা বই খুঁজে পেল।',
 'বইয়ের ভেতরে লেখা ছিল, ছোট কাজও বড় পরিবর্তন আনতে পারে।',
 'মিনা পার্কে রাফিকে বলল, আমরা শিশুদের জন্য বই জোগাড় করব।',
 'রাফি চিন্তিত মুখে বলল, কিন্তু আমাদের কাছে টাকা খুব কম।',
 'খালি মানিব্যাগে একটি টাকাও অবশিষ্ট ছিল না।',
 'মিনা খাতায় লিখল, আগে ৮টি বই ছিল, এবার ২০টি বই চাই।',
 'প্রথমত, বন্ধুদের সঙ্গে কাজ ভাগ করে নিতে হবে।',
 'করিম পার্কে এসে মিনার দিকে নিজের বইটি বাড়িয়ে দিল।',
 'ক্যালেন্ডারের পাতা উল্টে গেল, কয়েক দিন পেরিয়ে গেল।',
 'তাদের ছোট্ট সংগ্রহের ৮০ শতাংশ পূর্ণ হয়েছে।',
 'করিম ঘড়ি দেখে বলল, শিশুদের আসতে আর দেরি নেই।',
 'পার্কে সবাই মিলে বই পড়ল, মিনা স্বস্তির হাসি হাসল।',
 'রাফি হাত নেড়ে বলল, আগামীকাল আবার দেখা হবে।'
];
function directStory(film) {
 const directed=structuredClone(film);
 directed.cast.reader_boy={gender:'male',age:'child',skin:3,hair:{style:'crop',color:'black'},outfit:{type:'tshirt',color:'#4382ad'}};
 directed.cast.reader_girl={gender:'female',age:'child',skin:3,hair:{style:'bob',color:'black'},outfit:{type:'salwar',color:'#d4577a'}};
 for(const s of directed.shots){
  if(s.sentence===8){s.camera={kind:'two',on:'karim',move:'steady'};s.people=[{who:'karim',x:-1.1,dz:1,do:'idle',gesture:'offer_give',face:'happy',speaks:false},{who:'mina',x:1.1,dz:1,do:'idle',gesture:'receive_take',face:'happy',facing:-1,speaks:false}];s.props=[{id:'bookHeld',zone:'HELD_IN_HAND',by:'karim',m:.24,at:0}];}
  if(s.sentence===12){s.camera={kind:'wide',on:'mina',move:'steady'};s.people=[{who:'reader_boy',x:-1.6,dz:1,do:'idle',gesture:'read_book',face:'happy',speaks:false},{who:'reader_girl',x:0,dz:1,do:'idle',gesture:'read_book',face:'happy',speaks:false},{who:'mina',x:1.6,dz:1,do:'idle',face:'happy',speaks:false}];s.props=[{id:'bookHeld',zone:'HELD_IN_HAND',by:'reader_boy',m:.24,open:true,at:0},{id:'bookHeld',zone:'HELD_IN_HAND',by:'reader_girl',m:.24,open:true,at:0}];s.broll=false;s.overlays=[];s.headline=null;}
 }
 directed.plan.directionNotes=['Director correction at 31.5s: keep giver and receiver visible.','Director correction at 49.5s: show children reading open books, rather than a lone character.'];
 fs.writeFileSync(path.join(out,'directed.film.json'),JSON.stringify(directed,null,2));return directed;
}
const job=(p,kind)=>new Promise((resolve,reject)=>{agent.setJobDone(r=>setImmediate(()=>r.ok?resolve():reject(new Error(store.get(p.id)?.error||kind))));agent.enqueue(p.id,kind);});
if(stage==='rebuild'){
 const meta=JSON.parse(fs.readFileSync(path.join(out,'demo.json'),'utf8')),p=store.get(meta.id);
 p.film=planFromBrain('',{duration:meta.duration,title:'এক বাক্স বই',timed:lines.map((text,i)=>({text,at:i*meta.duration/lines.length}))});
 p.film.learn=false;p.film.mood='acoustic';
 fs.writeFileSync(path.join(out,'automatic.film.json'),JSON.stringify(p.film,null,2));p.film=directStory(p.film);store.save(p,{immediate:true});await job(p,'storyboard');meta.authorship='Original assistant-authored story; automatic native plan plus two documented director corrections; no owner approval implied.';meta.directionCorrections=p.film.plan.directionNotes;fs.writeFileSync(path.join(out,'demo.json'),JSON.stringify(meta,null,2));console.log('Rebuilt completed story in existing preview');
}else if(stage==='build'){
 const duration=58.5,span=duration/lines.length;
 const p=store.create({name:'এক বাক্স বই — teaching demo',ownerId:localOwner().id,mode:'faceless',language:'bn'});
 Object.assign(p,{kind:'animation',format:'16:9',designStyle:'2d-animation',theme:'light',aiVoice:false,setupDone:true,animFormat:'mixed'});
 const d=store.dirs(p.id);fs.mkdirSync(d.assets,{recursive:true});const voice=path.join(d.assets,'story-timing.wav');
 execFileSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','anoisesrc=color=pink:amplitude=0.0001:sample_rate=48000','-t',String(duration),voice]);
 p.assets=[{file:path.basename(voice),original:'timing bed — no spoken narration',role:'voiceover',hasAudio:true,duration,size:fs.statSync(voice).size,addedAt:Date.now()}];
 const words=lines.flatMap((line,i)=>{const ws=line.split(/\s+/),dt=(span-.25)/ws.length;return ws.map((text,j)=>({text,start:+(i*span+.1+j*dt).toFixed(3),end:+(i*span+.1+(j+1)*dt-.025).toFixed(3)}));});
 const tr=path.join(d.ws,'transcripts/plate-plate');fs.mkdirSync(tr,{recursive:true});fs.writeFileSync(path.join(tr,'transcript.json'),JSON.stringify(words));fs.writeFileSync(path.join(tr,'meta.json'),JSON.stringify({language:'bn',conf:1,words:words.length,tags:null}));
 store.save(p,{immediate:true});await job(p,'prepare');
 const timed=lines.map((text,i)=>({text,at:i*span}));const film=planFromBrain('',{duration,title:'এক বাক্স বই',timed});film.learn=false;film.mood='acoustic';
 // This is a demonstrator, not a benchmark. Keep the automatic plan for inspection;
 // the two explicit direction corrections are saved separately below.
 fs.writeFileSync(path.join(out,'automatic.film.json'),JSON.stringify(film,null,2));
 p.film=directStory(film);store.save(p,{immediate:true});await job(p,'storyboard');
 const hf=path.join(jobDir(d.ws),'edit/hf');
 fs.writeFileSync(path.join(out,'demo.json'),JSON.stringify({id:p.id,ws:d.ws,hf,duration,story:lines,authorship:'Original assistant-authored story; automatic plan plus two documented director corrections; no owner approval implied.',audio:'Local music and effects; no spoken narration or voice synthesis.'},null,2));
 console.log(JSON.stringify({id:p.id,hf,shots:film.shots.length,cast:Object.keys(film.cast)}));
}else{
 const meta=JSON.parse(fs.readFileSync(path.join(out,'demo.json'),'utf8')),p=store.get(meta.id),d=store.dirs(p.id);
 await job(p,'render');const pv=store.get(p.id),video=path.join(d.out,pv.versions.at(-1).file),dest=path.join(root,'examples/out/teaching-one-box-of-books.mp4');fs.copyFileSync(video,dest);
 const {checkVideo}=await import('../server/videoqa.mjs'),{checkBody}=await import('../engine/cartoon/check-body.mjs');
 const gate=await checkBody(meta.hf),qa=checkVideo(dest,{expectSeconds:meta.duration,format:'16:9'});
 fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify({video:dest,gate:{ok:gate.ok,frames:gate.frames,people:gate.people,faults:gate.faults,lines:gate.lines},videoQa:qa},null,2));
 execFileSync('ffmpeg',['-v','error','-y','-i',dest,'-vf','fps=0.205128,scale=480:-2,tile=4x3','-frames:v','1',path.join(out,'contact-sheet.jpg')]);
 console.log(JSON.stringify({video:dest,gate:gate.ok,frames:gate.frames,videoQa:qa.ok}));
}
