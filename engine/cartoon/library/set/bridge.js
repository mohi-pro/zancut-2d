// bridge.
ZS.define("bridge", {"about": "bridge", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b0b7ac","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-120,-62,240,10,c,2);for(const xx of [-80,65]){R(xx,-54,13,54,dark(c,.15));}R(-120,-86,240,5,c,2);for(let i=0;i<15;i++)R(-118+i*17,-82,2,20,c);P("M-110 -65 Q-58 -132 0 -66 Q58 -132 110 -65 L106 -65 Q58 -121 0 -58 Q-58 -121 -106 -65Z",light(c,.15));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
