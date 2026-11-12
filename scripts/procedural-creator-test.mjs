// Real recipes, persistence, local algorithms/assets, every place (20 + sea / mountain / desert) × day/night and the actual compose → Chrome body gate.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { execFileSync, spawn } from 'node:child_process';
const root=path.resolve(new URL('..',import.meta.url).pathname), temp=fs.mkdtempSync(path.join(os.tmpdir(),'z2d-procedural-'));
process.env.ZANCUT_DATA=path.join(temp,'data');process.env.npm_config_offline='true';
const {parseDNA,createCreation,getCreation,listCreations,creationId,validateDNA}=await import('../server/procedural-creator.mjs');
const {placeIds,shotScript,kitFor,validate}=await import('../server/codefilm.mjs');
const {readyPlaces,resolvePlace}=await import('../server/place-registry.mjs');
const power=await import('../server/power-libraries.mjs');
const {checkBody}=await import('../engine/cartoon/check-body.mjs');
const {openPage,showAt}=await import('../engine/readcheck.mjs');
let app;
try {
  const monster=parseDNA('তিন মাথার নীল রাক্ষস');
  assert.equal(monster.headCount,3);assert.deepEqual(monster.headAngles,[-25,0,25]);assert.equal(monster.palette.primary,'#367fe0');assert.equal(monster.scale,1.5);
  assert.ok(monster.traits.horns&&monster.traits.fangs&&monster.traits.glowingEyes);
  assert.deepEqual(parseDNA('three-headed blue monster'),monster);
  assert.equal(parseDNA('চার হাতের সবুজ দৈত্য').armCount,4);
  assert.equal(parseDNA('৪ হাতের কালো দৈত্য').armCount,4);
  assert.equal(parseDNA('two-headed golden robot').headCount,2);
  assert.equal(parseDNA('পিচ্চি নীল রাক্ষস').scale,.65);
  const horse=parseDNA('ডানাওয়ালা সাদা ঘোড়া');assert.equal(horse.archetype,'horse');assert.equal(horse.palette.primary,'#f3f1e9');assert.deepEqual(horse.attachments,['wings_attachment']);
  assert.equal(parseDNA('উড়ন্ত সাদা ঘোড়া').floating,true);
  const warrior=parseDNA('আগুনের তলোয়ার হাতে যোদ্ধা');
  assert.equal(warrior.archetype,'warrior');assert.deepEqual(warrior.effects,[]);assert.equal(warrior.held[0].dna.archetype,'sword');assert.deepEqual(warrior.held[0].dna.effects,['fire_aura']);
  assert.deepEqual(parseDNA('warrior holding a fire sword'),warrior);
  assert.deepEqual(parseDNA('বরফের ঢাল').effects,['ice_tint']);
  const car=parseDNA('ভাঙা লাল গাড়ি');assert.equal(car.palette.primary,'#de4941');assert.deepEqual(car.effects,['cracked_overlay']);
  // More nouns: the head noun is the last one, animals have no arms, held props need hands, false friends are not nouns.
  {const T=parseDNA('giant tiger');assert.equal(T.archetype,'tiger');assert.equal(T.scale,1.5);assert.equal(T.armCount,0);assert.deepEqual(parseDNA('বিশাল বাঘ'),T);}
  assert.equal(parseDNA('দুই মাথার কুকুর').headCount,2);assert.equal(parseDNA('কালো বিড়াল').palette.primary,'#242b39');assert.equal(parseDNA('গরু').kind,'creature');
  {const f=parseDNA('উড়ন্ত সোনালী মাছ');assert.equal(f.archetype,'fish');assert.ok(f.floating);assert.equal(f.palette.primary,'#e7bc4d');}
  {const b=parseDNA('flying red bird');assert.equal(b.archetype,'bird');assert.ok(b.floating);assert.deepEqual(b.attachments,[]);}
  {const g=parseDNA('সাদা ভূত');assert.equal(g.archetype,'ghost');assert.ok(g.floating);assert.equal(g.armCount,2);}
  {const k=parseDNA('লাঠি হাতে রাজা');assert.equal(k.archetype,'king');assert.equal(k.held[0].dna.archetype,'stick');}
  assert.equal(parseDNA('old man holding a black umbrella').held[0].dna.palette.primary,'#242b39');assert.equal(parseDNA('হারিকেন হাতে মেয়ে').held[0].dna.archetype,'lantern');
  assert.deepEqual(parseDNA('ভাঙা নৌকা').effects,['cracked_overlay']);assert.deepEqual(parseDNA('আগুনের গাছ').effects,['fire_aura']);assert.equal(parseDNA('লাল বাড়ি').archetype,'house');assert.deepEqual(parseDNA('বরফের বই').effects,['ice_tint']);
  for(const friend of ['রাজাকার','কাকা','মাছি'])assert.throws(()=>parseDNA(friend),/No supported/);
  {const d=parseDNA('giant tiger');d.armCount=2;assert.throws(()=>validateDNA(d));}
  for(const bad of ['', '99 headed monster','নয় মাথার দৈত্য','ten armed warrior','unrecognizable noun'])assert.throws(()=>parseDNA(bad));
  const bad=structuredClone(monster);bad.scale=NaN;assert.throws(()=>validateDNA(bad));
  const a=createCreation('তিন মাথার নীল রাক্ষস'),b=createCreation('three-headed blue monster');assert.equal(a.id,b.id);assert.equal(listCreations().length,1);
  assert.equal(getCreation(a.id).aliases.length,2);assert.equal(getCreation('__proto__'),null);
  assert.equal(creationId(Object.fromEntries(Object.entries(monster).reverse())),a.id);
  const file=path.join(process.env.ZANCUT_DATA,'brain/learned-creations.json');
  const restarted=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`import {getCreation} from ${JSON.stringify(new URL('../server/procedural-creator.mjs',import.meta.url).href)};console.log(JSON.stringify(getCreation(${JSON.stringify(a.id)})));`],{encoding:'utf8'}));assert.deepEqual(restarted.dna,monster);
  const corrupt=path.join(temp,'corrupt.json');fs.writeFileSync(corrupt,'{not json');assert.throws(()=>createCreation('blue monster',{file:corrupt}));assert.equal(fs.readFileSync(corrupt,'utf8'),'{not json');
  assert.ok(power.analyzeText('three monsters carry swords').verbs.length);assert.ok(power.analyzeText('three heads').numbers.length);
  assert.ok(power.analyzeText('তিন মাথার নীল রাক্ষস').tokens.includes('নীল'));
  assert.equal(power.rankDescriptions('নীল রাক্ষস',[{text:'লাল গাড়ি'},{text:'নীল রাক্ষস'}])[0].text,'নীল রাক্ষস');
  assert.deepEqual(power.roughPath([[0,0],[8,10],[15,6]],7),power.roughPath([[0,0],[8,10],[15,6]],7));
  assert.notDeepEqual(power.roughPath([[0,0],[8,10]],7),power.roughPath([[0,0],[8,10]],8));
  {const original=Math.random;try {Math.random=()=>{throw new Error('unseeded random call');};assert.ok(power.roughPath([[0,0],[8,10]],7).length);}finally{Math.random=original;}}
  assert.equal(power.tweenAt(0,10,.5),5);assert.ok(Number.isFinite(power.springAt(.5)));
  assert.equal(power.chartScale([0,10],[0,100])(5),50);assert.match(power.chartPath([[0,0],[10,10]]),/^M/);
  assert.deepEqual(power.physicsFrames({seconds:.3}),power.physicsFrames({seconds:.3}));
  assert.ok(power.assetCatalog('openmoji').total>=4000);assert.ok(power.assetCatalog('lucide').total>1000);
  assert.match(power.assetSvg('openmoji','1F409'),/<svg/);assert.match(power.assetSvg('lucide','flame'),/<svg/);assert.throws(()=>power.assetSvg('lucide','../../package'));
  console.log('ok: bilingual compositional DNA, scoped held props, deterministic local libraries/assets, atomic persistence and restart reuse');

  const ids=placeIds();assert.ok(ids.length>=23,`${ids.length} places`);assert.deepEqual(ids.sort(),Object.keys(readyPlaces).sort());
  for(const [id,p] of Object.entries(readyPlaces)) {assert.equal(resolvePlace(p.aliases[0]),id);assert.equal(resolvePlace(p.aliases.at(-1)),id);assert.deepEqual(p.times,['day','night']);}
  const {planFromScript}=await import('../server/scriptplan.mjs');assert.equal(planFromScript('The boy waits at the tea stall.').shots[0].place,'tea_stall');
  const {planFromBrain}=await import('../server/brainplan.mjs');assert.equal(planFromBrain('The boy waits at the hospital clinic.').shots.at(-1).place,'hospital_clinic');
  for(const planner of [planFromScript,planFromBrain]) {
    for(const phrase of ['তিন মাথার নীল রাক্ষস','আগুনের তলোয়ার হাতে যোদ্ধা','three-headed blue monster stands at the market bazaar.']) {
      const planned=planner(phrase), who=planned.shots.find(s=>s.people?.length).people[0].who;
      assert.ok(planned.cast[who].creation,'normal Story planning did not assemble the described subject');assert.ok(getCreation(planned.cast[who].creation));assert.deepEqual(validate(planned),[]);
    }
    const ordinary=planner('The boy waits at home.');assert.ok(Object.values(ordinary.cast).every(s=>!s.creation),'ordinary people were replaced with a custom rig');
  }
  const cases=['তিন মাথার নীল রাক্ষস','চার হাতের সবুজ দৈত্য','আগুনের তলোয়ার হাতে যোদ্ধা','ডানাওয়ালা সাদা ঘোড়া','উড়ন্ত সাদা ঘোড়া','ভাঙা লাল গাড়ি','বরফের ঢাল','আগুনের তলোয়ার','বিশাল বাঘ','দুই মাথার কুকুর','কালো বিড়াল','উড়ন্ত সোনালী মাছ','উড়ন্ত লাল পাখি','সাদা ভূত','লাঠি হাতে রাজা','হারিকেন হাতে মেয়ে','ভাঙা নৌকা','আগুনের গাছ','লাল বাড়ি','নীল ছাতা','বরফের বই'];
  const cast=Object.fromEntries(cases.map((description,i)=>['c'+i,{description,gender:'male',age:'adult'}]));
  const film={cast,shots:[]};assert.deepEqual(validate({...film,shots:[{at:0,place:'market_bazaar',people:[{who:'c0',do:'idle'}]}]}),[]);
  const kit=kitFor(film);assert.ok(listCreations().length>=cases.length,'building a cast description did not remember the creation');
  const scenes=[];let cursor=0;
  for(const id of ids)for(const night of [false,true]) {const seconds=.4;scenes.push({start:cursor,seconds,id,night,js:`const W=ZC.world(root),P=ZC.place(${JSON.stringify(id)},W,{night:${night}});ZC.clock(tl,s,d,t=>{P.tick(t);W.cam(W.w/2,W.h/2,W.w);});`});cursor+=seconds;}
  cases.forEach((phrase,i)=>{const shot={at:cursor,place:i===3||i===4?'forest_path':'market_bazaar',camera:{kind:i===0?'close':'wide',on:'c'+i},people:[{who:'c'+i,x:0,dz:1,do:'idle',speaks:i===2}]};scenes.push({start:cursor,seconds:3,creation:i,js:shotScript(shot,film)});cursor+=3;});
  const job=path.join(temp,'job');for(const f of ['cut','work','edit/graphics'])fs.mkdirSync(path.join(job,f),{recursive:true});
  execFileSync('ffmpeg',['-v','error','-y','-f','lavfi','-i','color=c=0x222222:s=640x360:r=30','-f','lavfi','-i','anullsrc=r=48000','-t',String(cursor),'-c:v','libx264','-pix_fmt','yuv420p','-c:a','aac','-shortest',path.join(job,'cut/cut.mp4')]);
  fs.writeFileSync(path.join(job,'job.json'),'{}');fs.writeFileSync(path.join(job,'edit/film-kit.js'),kit);
  fs.writeFileSync(path.join(job,'cut/transcript.json'),JSON.stringify(scenes.map(s=>({text:'test',start:s.start,end:s.start+s.seconds-.01}))));
  const plan=scenes.map((s,i)=>{const file=`edit/graphics/s${i}.html`;fs.writeFileSync(path.join(job,file),`<script>ZK.unit(root);\n${s.js}\n</script>`);return{row:i,uid:'s'+i,startWord:i,endWord:i,kind:'graphic',mode:'full-broll-takeover',file,transition:'cut',captions:'hide',cues:[]};});
  fs.writeFileSync(path.join(job,'edit/plan.json'),JSON.stringify({version:2,canvas:'1920x1080',kind:'faceless',style:'2d-animation',theme:'light',tokens:{},captions:{on:false},scenes:plan}));
  execFileSync(process.execPath,[path.join(root,'engine/compose/compose.mjs'),job],{stdio:'pipe'});
  const hf=path.join(job,'edit/hf'),gate=await checkBody(hf,{fps:30});assert.ok(gate.ok,gate.lines.slice(0,12).join('\n'));
  const evidenceAt=process.argv.indexOf('--evidence'),evidence=evidenceAt>=0?path.resolve(process.argv[evidenceAt+1]):null;if(evidence)fs.mkdirSync(evidence,{recursive:true});
  const o=await openPage(hf);let remote=[];o.page.on('request',r=>{if(/^https?:/.test(r.url())&&!/^http:\/\/127\.0\.0\.1:/.test(r.url()))remote.push(r.url());});
  await o.page.evaluate(()=>{Math.random=()=>{throw new Error('render used unseeded random');};});
  try {
    for(let i=0;i<scenes.length;i++) {
      const s=scenes[i];await showAt(o.page,s.start+s.seconds*.5);
      const r=await o.page.evaluate(()=>{const t=window.__timelines.main.time(),clip=[...document.querySelectorAll('.clip[data-start]')].find(c=>c.querySelector('svg[data-place]')&&t>=+c.dataset.start&&t<+c.dataset.start+ +c.dataset.duration),svg=clip?.querySelector('svg');if(!svg)return null;return {place:svg.dataset.place,night:svg.dataset.timeOfDay,moon:!!svg.querySelector('[data-moon]'),heads:svg.querySelectorAll('[data-custom-head]').length,arms:svg.querySelectorAll('[data-custom-arm]').length,fx:[...svg.querySelectorAll('[data-effect]')].map(e=>e.dataset.effect),wings:!!svg.querySelector('[data-attachment="wings_attachment"]'),bad:/NaN|undefined/.test(svg.innerHTML),custom:svg.querySelector('[data-custom-id]')?.outerHTML};});
      assert.ok(r&&!r.bad,`scene ${i} rendered invalid geometry`);
      if(s.id) {assert.equal(r.place,s.id);assert.equal(r.night,s.night?'night':'day');assert.equal(r.moon,s.night&&!readyPlaces[s.id].indoors);}
      else {const d=parseDNA(cases[s.creation]);assert.equal(r.heads,d.headCount);assert.equal(r.arms,d.armCount);for(const fx of [...d.effects,...d.held.flatMap(h=>h.dna.effects)])assert.ok(r.fx.includes(fx));assert.equal(r.wings,!!d.attachments.length);
        await showAt(o.page,s.start+.1);await showAt(o.page,s.start+s.seconds*.5);const again=await o.page.evaluate(()=>{const t=window.__timelines.main.time();return [...document.querySelectorAll('.clip[data-start]')].find(c=>c.querySelector('[data-custom-id]')&&t>=+c.dataset.start&&t<+c.dataset.start+ +c.dataset.duration)?.querySelector('[data-custom-id]').outerHTML;});assert.equal(again,r.custom,'custom recipe is not seek deterministic');}
      if(evidence)await o.page.screenshot({path:path.join(evidence,s.id?`${s.id}-${s.night?'night':'day'}.jpg`:`creation-${s.creation}.jpg`),type:'jpeg',quality:85});
    }
    assert.deepEqual(remote,[],'renderer fetched a remote resource');
  } finally {await o.close();}
  if(evidence){fs.writeFileSync(path.join(evidence,'body-gate.json'),JSON.stringify(gate,null,2));fs.writeFileSync(path.join(evidence,'scenes.json'),JSON.stringify(scenes.map(({js,...s})=>s),null,2));fs.cpSync(hf,path.join(evidence,'composition'),{recursive:true});}
  {const a1=gate.notes.filter(n=>/^A1 cast-c/.test(n));assert.deepEqual(a1,[],'custom creations still hold an arm straight at the camera');}
  console.log(`ok: all ${placeIds().length} places × day/night and ${cases.length} creations, ${gate.frames} real 30 fps frames; geometry/effects/seek/offline checks pass`);
  // A deliberately wrong fantasy attachment count must fail the gate.
  const broken=path.join(temp,'broken');for(const f of ['cut','work','edit/graphics'])fs.mkdirSync(path.join(broken,f),{recursive:true});
  fs.linkSync(path.join(job,'cut/cut.mp4'),path.join(broken,'cut/cut.mp4'));fs.writeFileSync(path.join(broken,'job.json'),'{}');fs.writeFileSync(path.join(broken,'cut/transcript.json'),JSON.stringify([{text:'bad',start:0,end:1}]));fs.writeFileSync(path.join(broken,'edit/film-kit.js'),kit);
  fs.writeFileSync(path.join(broken,'edit/graphics/s0.html'),`<script>ZK.unit(root);const W=ZC.world(root),a=ZCUSTOM.actor(W.layer('p'),{spec:ZF.cast.c0});ZC.clock(tl,s,d,t=>{a.draw(a.pose('stand'),{t});for(const c of Object.values(window.__custom||{}))c.heads=99;});</script>`);
  fs.writeFileSync(path.join(broken,'edit/plan.json'),JSON.stringify({version:2,canvas:'1920x1080',kind:'faceless',style:'2d-animation',captions:{on:false},scenes:[{...plan[0],file:'edit/graphics/s0.html'}]}));
  execFileSync(process.execPath,[path.join(root,'engine/compose/compose.mjs'),broken],{stdio:'pipe'});
  const badGate=await checkBody(path.join(broken,'edit/hf'),{to:1});assert.ok(!badGate.ok&&badGate.faults.some(f=>f.rule==='CG2'),'wrong custom attachment count escaped the body gate');

  const socket=net.createServer();await new Promise(r=>socket.listen(0,'127.0.0.1',r));const port=socket.address().port;await new Promise(r=>socket.close(r));
  app=spawn(process.execPath,['server/index.mjs'],{cwd:root,env:{...process.env,PORT:String(port)},stdio:['ignore','pipe','pipe']});let logs='';app.stdout.on('data',b=>logs+=b);app.stderr.on('data',b=>logs+=b);
  const base=`http://127.0.0.1:${port}`;let started=false;for(let i=0;i<150;i++){try{if((await fetch(base+'/api/places')).ok){started=true;break;}}catch{}assert.equal(app.exitCode,null,logs);await new Promise(r=>setTimeout(r,100));}assert.ok(started,logs);
  assert.equal((await(await fetch(base+'/api/places')).json()).length,placeIds().length);
  const response=await fetch(base+'/api/creations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phrase:'three-headed blue monster'})});assert.equal(response.status,200);const saved=await response.json();assert.equal(saved.id,a.id);
  assert.deepEqual((await(await fetch(base+'/api/creations/'+saved.id)).json()).dna,monster);
  assert.equal((await fetch(base+'/api/vector-assets/lucide/flame.svg')).status,200);assert.ok((await(await fetch(base+'/api/vector-assets?source=openmoji')).json()).total>=4000);
  assert.equal((await fetch(base+'/api/creations',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phrase:'99 headed monster'})})).status,400);
  console.log(`ok: local API creates/reuses saved DNA and serves ${placeIds().length} places and offline SVG catalogs`);
} finally {
  if(app&&app.exitCode===null){app.kill('SIGTERM');await new Promise(r=>app.once('exit',r));}
  fs.rmSync(temp,{recursive:true,force:true});
}
