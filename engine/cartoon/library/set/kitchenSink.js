// kitchen sink.
ZS.define("kitchenSink", {"about": "kitchen sink", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b5b99f","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-64,-53,128,53,c,3);R(-68,-58,136,8,"#d0d5bd",2);E(0,-55,39,10,"#9bb0a1");E(0,-55,30,6,"#789586");P("M-3 -57 L-3 -86 Q-3 -106 16 -99 Q26 -95 23 -82 L16 -82 Q20 -96 9 -94 Q3 -93 3 -85 L3 -57Z","#a5b8a3");R(-58,-43,54,36,light(c,.1),2);R(4,-43,54,36,light(c,.1),2);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
