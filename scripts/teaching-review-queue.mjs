// Select useful decisions for human review; never approve or train the brain's own guesses.
// node scripts/teaching-review-queue.mjs story.txt [review.json] [limit]
import fs from 'node:fs';import {load,predict,testOverlap,HEADS}from'../server/brain.mjs';
import {sentences}from'../server/scriptplan.mjs';import {matchTemplate}from'../server/broll.mjs';
const file=process.argv[2];if(!file)throw Error('Usage: node scripts/teaching-review-queue.mjs story.txt [review.json] [limit]');
const model=load();if(!model)throw Error('Train the local brain first.');
const text=fs.readFileSync(file,'utf8'),lines=sentences(text),limit=Math.max(1,Math.min(100,Number(process.argv[4])||20)),rows=[];let place='none';
for(const [i,line]of lines.entries()){
 const ctx={prevText:lines[i-1]||'',nextText:lines[i+1]||'',prevPlace:place};const pr=predict(model,{currentText:line,...ctx});
 const reasons=[],perHead=Object.fromEntries(Object.keys(HEADS).map(h=>{const p=pr[h],margin=p.top[0].p-(p.top[1]?.p||0);if(p.conf<.6||margin<.15)reasons.push(`${h}: uncertain or close alternatives`);return[h,{confidence:p.conf,choices:p.top}];}));
 const supported=matchTemplate(line)?.id;
 if(pr.broll.label!=='none'&&pr.broll.label!=='compose_custom_recipe'&&supported!==pr.broll.label)reasons.push('B-roll guess lacks matching transcript evidence; inspect even if confident');
 if(testOverlap(line)){reasons.push('Reserved evaluation text: review only, never train');}
 const score=Object.values(perHead).reduce((n,p)=>n+1-p.conf,0)+(reasons.some(r=>r.startsWith('B-roll guess'))?1:0);
 rows.push({sentence:i+1,text:line,ctx,priority:score,reasons,predictions:perHead,roles:pr.roles,reviewStatus:'pending',reserved:testOverlap(line)});
 if(pr.place.label!=='none'&&pr.place.conf>=.45)place=pr.place.label;
}
// Mix uncertainty with coverage: reserve every fifth slot for a high-confidence audit,
// and deduplicate near-identical normalized wording before presenting a short review queue.
const sorted=[...rows].sort((a,b)=>b.priority-a.priority),chosen=[],seen=new Set();
const add=r=>{if(!r||chosen.includes(r))return;const key=r.text.normalize('NFC').toLowerCase().replace(/[0-9০-৯]+/g,'#').replace(/[^\p{L}\p{M}\s#]/gu,'').replace(/\s+/g,' ').trim();if(seen.has(key))return;seen.add(key);chosen.push(r);};
for(let k=0;chosen.length<limit&&k<sorted.length;k++){add(sorted[k]);if(chosen.length%5===4){const audit=rows.find(r=>!chosen.includes(r)&&!r.reasons.length);add(audit);}}
const result={source:file,modelTrainedAt:model.trainedAt,notice:'Review suggestions, not approved labels. Do not train unreviewed predictions. Export only explicitly approved fields with the saved context.',total:rows.length,selected:chosen.slice(0,limit)};
const dest=process.argv[3]||'review-queue.json';fs.writeFileSync(dest,JSON.stringify(result,null,2));console.log(`${result.selected.length}/${rows.length} decisions queued in ${dest}; no model or training data changed.`);
