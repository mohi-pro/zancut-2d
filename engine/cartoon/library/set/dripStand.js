// drip stand.
ZS.define("dripStand", {"about": "drip stand", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#9eb29d","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,24,3.2);
  R(-2,-100,4,94,c,1);R(-20,-99,40,3,c,1);R(6,-95,15,27,"#c2d1bf",4);R(8,-81,11,11,"#a4c0b3",2);P("M13 -68 L14 -68 Q5 -36 17 -11 L15 -11 Q3 -37 13 -68Z","#b6c7b5");R(-24,-5,48,3,c,1);for(const xx of [-24,24])C(xx,-3,3,"#7b9180");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
