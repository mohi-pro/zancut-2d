// wash basin.
ZS.define("washBasin", {"about": "wash basin", "kind": "set", "tags": ["inside", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d4dcc4","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  P("M-50 -70 Q-46 -40 -10 -38 L-13 0 L13 0 L10 -38 Q46 -40 50 -70Z",c);E(0,-70,50,14,light(c,.1));E(0,-69,39,8,"#afc6b5");P("M-3 -72 L-3 -92 Q-3 -106 14 -98 L14 -92 Q3 -99 3 -90 L3 -72Z","#91aa94");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
