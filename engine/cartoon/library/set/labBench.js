// lab bench.
ZS.define("labBench", {"about": "lab bench", "kind": "set", "tags": ["inside", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b69971","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-63,-52,126,10,c,3);R(-57,-42,5,42,dark(c,.12),1);R(52,-42,5,42,dark(c,.12),1);R(-61,-52,122,3,light(c,.23),1);R(-40,-96,3,43,"#7f9688",1);R(-46,-95,28,3,"#7f9688",1);R(-29,-95,8,25,"#b4c7ba",2);P("M20 -88 L28 -88 L28 -72 L42 -56 L7 -56 L20 -72Z","#b4c7ba");P("M16 -66 L32 -66 L38 -58 L10 -58Z","#8dafa8");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
