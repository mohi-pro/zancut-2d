// plane.
ZS.define("plane", {"about": "plane", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#e1ddd0","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  P("M-115 -40 Q-112 -48 -91 -49 L-29 -49 L11 -99 L29 -99 L5 -49 L78 -49 L94 -72 L108 -72 L102 -43 Q120 -31 92 -28 L4 -28 L30 -3 L12 -3 L-28 -28 L-91 -28 Q-109 -29 -115 -40Z",c);for(let i=0;i<9;i++)R(-83+i*16,-44,7,7,"#86a6af",3);P("M-111 -41 L-93 -45 L-93 -36 L-110 -36Z","#7c9aa3");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
