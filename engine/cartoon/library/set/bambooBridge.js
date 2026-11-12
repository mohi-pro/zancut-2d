// bamboo bridge.
ZS.define("bambooBridge", {"about": "bamboo bridge", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b4a476","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(let i=0;i<5;i++){R(-100+i*50,-63,3,63,"#a58d5f",1);}R(-106,-36,212,8,c,2);for(let i=0;i<28;i++)R(-103+i*7.5,-37,5,11,light(c,.1),1);R(-100,-65,203,3,c,1);R(-100,-49,203,2,c,1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
