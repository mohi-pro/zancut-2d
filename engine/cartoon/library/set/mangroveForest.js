// mangrove forest.
ZS.define("mangroveForest", {"about": "mangrove forest", "kind": "set", "tags": ["city", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#7d9b5d","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  E(0,-10,110,10,"#8eb6ae");const count=o.far?8:5;for(let i=0;i<count;i++){const px=-90+i*180/(count-1),hh=55+r()*40;P(`M${px-3} -${hh} L${px+3} -${hh} L${px+4} -21 L${px+17} -5 L${px+7} -11 L${px} -22 L${px-13} -5 L${px-6} -24Z`,"#8a7354");E(px,-hh+8,22,22,c);E(px-8,-hh,18,15,light(c,.1));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
