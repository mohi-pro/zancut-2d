// cactus.
ZS.define("cactus", {"about": "cactus", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#749b73","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-9,-100,18,100,c,9);P("M-5 -39 L-25 -39 Q-34 -39 -34 -50 L-34 -72 Q-34 -81 -26 -81 Q-19 -81 -19 -72 L-19 -54 L-5 -54Z",c);P("M5 -60 L22 -60 L22 -85 Q22 -94 29 -94 Q36 -94 36 -85 L36 -55 Q36 -46 25 -46 L5 -46Z",dark(c,.1));R(-5,-92,3,86,light(c,.25),1);for(let i=0;i<12;i++)R(-6+r()*12,-90+r()*83,1,2,"#d8d3a3",.5);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
