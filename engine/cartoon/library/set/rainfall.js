// Rain overlay; anchor is bottom centre; h is overlay height. Falling streaks wrap..
ZS.define("rainfall", {"about": "Rain overlay; anchor is bottom centre; h is overlay height. Falling streaks wrap.", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a2b8c2","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const drops=[];for(let i=0;i<45;i++){const xx=-120+r()*240,yy=-r()*100;drops.push([P(`M${xx} ${yy} l-3 9 l1 .5 l3 -9Z`,c,.65),xx,yy]);}anim.push(t=>drops.forEach(([e,x,y],i)=>e.setAttribute("transform",`translate(0 ${(((t*65+y+100)%100+100)%100)-(y+100)})`)));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
