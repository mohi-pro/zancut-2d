// Ceiling projector; ceiling anchor, drawn downward..
ZS.define("ceilingProjector", {"about": "Ceiling projector; ceiling anchor, drawn downward.", "kind": "set", "tags": ["inside", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d0d7be","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-3,0,6,30,"#a6b29a",1);R(-41,28,82,28,c,6);C(19,42,10,"#829e8b");C(19,42,6,o.on?"#d8d5a8":"#a1beb0");for(let i=0;i<5;i++)R(-29+i*5,36,2,12,"#a6b69c",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
