// A small neural classifier trained from random weights on Zancut examples only.
// This research harness never reads the protected final/owner sets or deploys a model.
import fs from'node:fs';
import{allExamples,readJsonl,feats,NB,HEADS}from'../server/brain.mjs';
const dir='data/teaching/2026-11-09/continuation',examples=allExamples(),dev=readJsonl('brain/holdout-dev.jsonl');
const input=e=>({currentText:e.text,...e.ctx});
const F=examples.map(e=>feats(input(e))),D=dev.map(e=>feats(input(e)));
const rng=(seed)=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
function forward(net,f,h,out){h.fill(0);for(let k=0;k<f.idx.length;k++){const off=f.idx[k]*net.dim,v=f.val[k];for(let j=0;j<net.dim;j++)h[j]+=net.embed[off+j]*v;}for(let j=0;j<h.length;j++)h[j]=Math.tanh(h[j]);for(let c=0;c<out.length;c++){let z=net.bias[c];for(let j=0;j<h.length;j++)z+=h[j]*net.output[j*out.length+c];out[c]=z;}return out;}
function predict(net,f){const s=forward(net,f,new Float64Array(net.dim),new Float64Array(net.classes.length));let best=0;for(let c=1;c<s.length;c++)if(s[c]>s[best])best=c;return net.classes[best];}
function train(head,{dim=32,epochs=8,lr=.08,seed=7}={}){
 const classes=HEADS[head],C=classes.length,r=rng(seed),net={classes,dim,embed:Float32Array.from({length:NB*dim},()=>r()*.5-.25),output:Float32Array.from({length:dim*C},()=>r()*.5-.25),bias:new Float32Array(C)};
 const rows=examples.map((e,i)=>({e,f:F[i],y:classes.indexOf(e[head])})).filter(e=>e.y>=0),counts=Array(C).fill(0);for(const x of rows)counts[x.y]++;for(const x of rows)x.weight=(x.e.weight||1)*Math.min(5,Math.max(.5,Math.sqrt(rows.length/(C*counts[x.y]))));
 const order=rows.map((_,i)=>i),h=new Float64Array(dim),s=new Float64Array(C),p=new Float64Array(C),dh=new Float64Array(dim);
 for(let ep=0;ep<epochs;ep++){
  for(let i=order.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
  const rate=lr/(1+.12*ep);
  for(const index of order){const row=rows[index],f=row.f,a=Math.min(.5,rate*row.weight);forward(net,f,h,s);let max=-Infinity;for(const z of s)if(z>max)max=z;let sum=0;for(let c=0;c<C;c++){p[c]=Math.exp(s[c]-max);sum+=p[c];}for(let c=0;c<C;c++)p[c]=p[c]/sum-(c===row.y?1:0);
   dh.fill(0);for(let j=0;j<dim;j++){const off=j*C;let g=0;for(let c=0;c<C;c++){g+=p[c]*net.output[off+c];net.output[off+c]-=a*(p[c]*h[j]+1e-5*net.output[off+c]);}dh[j]=Math.max(-2,Math.min(2,g*(1-h[j]*h[j])));}
   for(let c=0;c<C;c++)net.bias[c]-=a*p[c];
   for(let k=0;k<f.idx.length;k++){const off=f.idx[k]*dim,v=f.val[k];for(let j=0;j<dim;j++)net.embed[off+j]-=a*(dh[j]*v+1e-5*net.embed[off+j]);}
  }
 }
 return net;
}
const results=[],best={},compact=process.argv.includes('--compact'),name=compact?'neural-compact':'neural';
for(const head of ['face','broll'])for(const dim of compact?[32]:[16,32])for(const lr of compact?[.04]:[.04,.12])for(const epochs of compact?[4,6]:[8]){
 const t=Date.now(),net=train(head,{dim,lr,epochs}),rows=dev.map((e,i)=>[e,i]).filter(([e])=>HEADS[head].includes(e[head])),acc=rows.filter(([e,i])=>predict(net,D[i])===e[head]).length/rows.length;
 const result={head,dim,lr,epochs,acc,n:rows.length,ms:Date.now()-t};results.push(result);console.log(JSON.stringify(result));
 if(!best[head]||acc>best[head].acc){best[head]=result;fs.writeFileSync(`${dir}/${name}-best-${head}.json`,JSON.stringify({...result,classes:net.classes,embed:Array.from(net.embed),output:Array.from(net.output),bias:Array.from(net.bias)}));}
 fs.writeFileSync(`${dir}/${name}-experiments.json`,JSON.stringify({selectionSet:'holdout-dev only',trainingRows:examples.length,results,best},null,2));
}
