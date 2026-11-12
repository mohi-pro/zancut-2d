// sofa.
ZS.define("sofaSet", {"about": "sofa", "kind": "set", "tags": ["inside", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a5b49a","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-76,-82,152,67,c,13);R(-63,-70,59,39,light(c,.08),8);R(4,-70,59,39,light(c,.08),8);R(-78,-44,20,36,dark(c,.07),7);R(58,-44,20,36,dark(c,.07),7);R(-58,-30,116,20,light(c,.11),5);for(const xx of [-64,59])R(xx,-10,5,10,"#9a835f",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
