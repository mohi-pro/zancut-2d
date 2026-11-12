// Development-only experiments. These never read final/real test labels or replace the deployed model.
// Feature IDF is fitted solely on allExamples(), which excludes reserved input/context.
import fs from'node:fs';
import {allExamples,readJsonl,feats,fitHead,NB,HEADS,train,save}from'../server/brain.mjs';
const dir='data/teaching/2026-11-09/continuation',examples=allExamples(),dev=readJsonl('brain/holdout-dev.jsonl');
const input=(e,context)=>context==='current'?e.text:context==='previous'?{currentText:e.text,prevText:e.ctx?.prevText,prevPlace:e.ctx?.prevPlace}:{currentText:e.text,...e.ctx};
const transform=(f,idf,power)=>{if(!power)return f;const val=new Float32Array(f.val.length);let z=0;for(let k=0;k<val.length;k++){val[k]=f.val[k]*idf[f.idx[k]]**power;z+=val[k]*val[k];}z=Math.sqrt(z)||1;for(let k=0;k<val.length;k++)val[k]/=z;return{idx:f.idx,val};};
const label=(hd,f)=>{const s=new Float64Array(hd.classes.length);for(let k=0;k<f.idx.length;k++){const off=f.idx[k]*s.length;for(let c=0;c<s.length;c++)s[c]+=hd.w[off+c]*f.val[k];}let best=-1;for(let c=0;c<s.length;c++)if(hd.counts[c]&& (best<0||s[c]>s[best]))best=c;return hd.classes[Math.max(0,best)];};
const results=[],best={};
for(const context of ['full','current','previous']){
 const F=examples.map(e=>feats(input(e,context))),D=dev.map(e=>feats(input(e,context))),df=new Uint32Array(NB);for(const f of F)for(const i of f.idx)df[i]++;
 const idf=Float32Array.from(df,n=>1+Math.log((F.length+1)/(n+1)));
 for(const power of [0,.5,1]){
  const features=F.map(f=>transform(f,idf,power)),validation=D.map(f=>transform(f,idf,power));
  for(const head of Object.keys(HEADS)){
   const t=Date.now(),model=fitHead(examples,head,{features}),rows=dev.map((e,i)=>[e,i]).filter(([e])=>HEADS[head].includes(e[head])),acc=rows.filter(([e,i])=>label(model,validation[i])===e[head]).length/rows.length;
   const r={head,context,idfPower:power,acc,n:rows.length,ms:Date.now()-t};results.push(r);console.log(JSON.stringify(r));
   if(!best[head]||acc>best[head].acc){best[head]=r;const compact={...model,w:Array.from(model.w),idf:power?Array.from(idf):null,config:{context,idfPower:power}};fs.writeFileSync(`${dir}/feature-best-${head}.json`,JSON.stringify(compact));}
  }
  fs.writeFileSync(`${dir}/feature-experiments.json`,JSON.stringify({trainingRows:examples.length,selectionSet:'holdout-dev only',results,best},null,2));
 }
}
console.log('Selected on development:',best);
