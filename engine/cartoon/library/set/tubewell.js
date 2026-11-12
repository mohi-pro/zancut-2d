// tubewell.
ZS.define("tubewell", {"about": "tubewell", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#568d69","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  E(0,-4,40,7,"#b5b4a3");R(-28,-12,56,9,"#c4c2af",3);R(-5,-71,10,59,c,2);R(-8,-80,16,13,c,3);P("M-7 -70 L-25 -65 L-25 -58 L-31 -58 L-31 -70 L-8 -80Z",dark(c,.12));P("M0 -79 L3 -86 L36 -95 L39 -91 L9 -80Z","#6b7966");C(1,-81,3,"#b0b7a3");R(-9,-20,18,8,dark(c,.1),2);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
