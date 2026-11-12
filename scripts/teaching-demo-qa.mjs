import fs from'node:fs';import assert from'node:assert/strict';import {openPage,showAt}from'../engine/readcheck.mjs';
const meta=JSON.parse(fs.readFileSync('data/teaching/2026-11-09/demo/demo.json')),o=await openPage(meta.hf),report={frames:0,facesChecked:0,headlinesChecked:0,cardsChecked:0,skippedCards:0,problems:[]};
try{
 const scenes=await o.page.evaluate(()=>JSON.parse(document.getElementById('hf-plan').textContent).scenes);
 for(const sc of scenes)for(const u of [.25,.5,.8]){
  await o.page.evaluate(()=>{window.__fx={};});await showAt(o.page,sc.s+(sc.e-sc.s)*u);
  const facts=await o.page.evaluate(()=>({fx:Object.values(window.__fx||{}).map(r=>({heads:r.heads,frame:r.frame,list:r.list})),headlines:[...document.querySelectorAll('[data-fx-kind="headline"]')].filter(g=>{for(let e=g;e&&e!==document.body;e=e.parentElement){const c=getComputedStyle(e);if(c.visibility==='hidden'||c.display==='none'||+c.opacity<.9)return false;}return true;}).map(g=>({backing:(()=>{const r=g.querySelector('rect[fill="#ffd84a"]')?.getBBox();return r?{x:r.x,y:r.y,w:r.width,h:r.height}:null;})(),text:[...g.querySelectorAll('text')].map(t=>{const r=t.getBBox();return{x:r.x,y:r.y,w:r.width,h:r.height};})}))}));
  report.frames++;
  for(const h of facts.headlines){if(!h.backing)continue;report.headlinesChecked++;for(const t of h.text)if(t.x<h.backing.x+2||t.x+t.w>h.backing.x+h.backing.w-2)report.problems.push({shot:sc.row+1,u,problem:'headline escapes its backing'});}
  for(const fx of facts.fx){for(const [kind,c]of Object.entries(fx.list||{})){
   if(['dynamic_comparison_chart','percentage_progress_ring','number_badge_pop','step_list_card'].includes(kind)){
    if(c.skipped){report.skippedCards++;continue;}report.cardsChecked++;
    for(const h of fx.heads||[]){report.facesChecked++;if(c.x<h.x+h.size*.5&&c.x+c.w>h.x-h.size*.5&&c.y<h.top+h.size&&c.y+c.h>h.top)report.problems.push({shot:sc.row+1,u,kind,problem:'card covers face'});}
    if(c.y+c.h>fx.frame.lane+1)report.problems.push({shot:sc.row+1,u,kind,problem:'card enters caption lane'});
   }
  }}
 }
 report.ok=report.problems.length===0;fs.writeFileSync('data/teaching/2026-11-09/demo/layout-qa.json',JSON.stringify(report,null,2));assert.ok(report.ok,JSON.stringify(report.problems));console.log(report);
}finally{await o.close();}
