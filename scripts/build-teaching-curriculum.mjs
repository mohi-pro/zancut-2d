import fs from 'node:fs';
import path from 'node:path';
import { lessons } from './data/teaching-curriculum.mjs';
import { storyLessons } from './data/teaching-stories.mjs';
import { HEADS, ROLE_IDS, testOverlap } from '../server/brain.mjs';
const experimentalStories = process.argv.includes('--stories'), outAt = process.argv.indexOf('--out');
const output = outAt >= 0 ? process.argv[outAt + 1] : 'brain/curriculum.jsonl';
if (!output || output.startsWith('--')) throw Error('Usage: node scripts/build-teaching-curriculum.mjs [--stories] [--out file.jsonl]');
const seen = new Set(), rows = [], refused = [];
for(const e of [...lessons, ...(experimentalStories ? storyLessons : [])]){
 const key=JSON.stringify([e.text,e.ctx||null]);
 if(seen.has(key))continue;seen.add(key);
 if([e.text,e.ctx?.prevText,e.ctx?.nextText].filter(Boolean).some(testOverlap)){refused.push({family:e.family,why:'protected test overlap'});continue;}
 for(const [h,classes] of Object.entries(HEADS))if(e[h]!=null&&!classes.includes(e[h]))throw Error(`${h}: ${e[h]}`);
 if(e.roles?.some(r=>!ROLE_IDS.includes(r)))throw Error('unknown role');
 rows.push({...e,weight:e.weight * 0.5,provenance:{kind:'assistant-authored',reference:e.family.startsWith('ref')?e.family.split('-')[0]:null,notHumanVerified:true}});
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output,rows.map(e=>JSON.stringify(e)).join('\n')+'\n');
const summary={rows:rows.length,bangla:rows.filter(e=>e.lang==='bn').length,contexts:rows.filter(e=>e.ctx).length,families:new Set(rows.map(e=>e.family)).size,labels:Object.fromEntries([...Object.keys(HEADS),'roles'].map(h=>[h,rows.filter(e=>e[h]!=null).length])),refused};
const summaryFile=output==='brain/curriculum.jsonl'?'data/teaching/2026-11-09/curriculum-build.json':`${output}.summary.json`;
fs.writeFileSync(summaryFile,JSON.stringify({...summary,experimentalStories,output},null,2));console.log(summary);
