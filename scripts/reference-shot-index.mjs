// Full-file approximate cut index; semantic labels remain sampled and explicitly uncertain.
import fs from 'node:fs';import path from 'node:path';import {spawnSync,execFileSync}from'node:child_process';
const files=fs.readdirSync('examples').filter(f=>f.endsWith('.mp4')).sort();
for(const [i,name]of files.entries()){
 const source=path.resolve('examples',name),out=`data/teaching/2026-11-09/references/ref${i+1}`,dest=`${out}/shot-index.json`;if(fs.existsSync(dest))continue;
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',source]));const duration=+probe.format.duration;
 const r=spawnSync('ffmpeg',['-v','info','-i',source,'-an','-vf',"fps=5,scale=320:-2,select='gt(scene,0.32)',showinfo",'-f','null','-'],{encoding:'utf8',maxBuffer:2**27});if(r.status)throw Error(r.stderr.slice(-400));
 const cuts=[...r.stderr.matchAll(/pts_time:([\d.]+)/g)].map(m=>+m[1]).filter((t,k,a)=>!k||t-a[k-1]>.4),bounds=[0,...cuts,duration];
 const shots=bounds.slice(1).map((end,k)=>({shot:k+1,start:bounds[k],end,seconds:+(end-bounds[k]).toFixed(3),semanticReview:'not individually annotated'}));
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(dest,JSON.stringify({source:name,bytes:fs.statSync(source).size,duration,method:'ffmpeg scene score >0.32 on 5fps 320px copy; approximate cuts, not semantic scene detection',shots},null,1));console.log(`ref${i+1}: ${shots.length} indexed shots`);
}
