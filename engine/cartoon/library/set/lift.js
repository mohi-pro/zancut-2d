// lift.
ZS.define("lift", {"about": "lift", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#ccd0b6","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-49,-100,98,100,c,3);R(-42,-87,77,87,"#a4b8a7",1);R(-4,-86,2,86,dark(c,.14));R(-42,-87,77,3,"#8ea28f");R(-16,-98,26,8,"#7d9380",1);R(39,-58,6,18,"#d2d4ba",1);C(42,-53,1.5,"#8fa780");C(42,-45,1.5,"#a28d71");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
