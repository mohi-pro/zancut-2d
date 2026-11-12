// mosque minaret.
ZS.define("mosqueMinaret", {"about": "mosque minaret", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d8d1b6","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,24,3.2);
  R(-10,-83,20,83,c,3);R(4,-83,6,83,dark(c,.1));R(-16,-65,32,7,light(c,.2),2);R(-14,-88,28,6,light(c,.2),2);P("M-11 -88 Q-14 -96 0 -100 Q14 -96 11 -88Z","#81a088");for(let j=0;j<3;j++)R(-4,-77+j*22,8,12,o.lit?"#efd698":"#74959c",4);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
