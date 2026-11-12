// solar panel.
ZS.define("solarPanel", {"about": "solar panel", "kind": "set", "tags": ["city", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bbc2ac","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-50,-42,5,42,"#969f8b",1);R(43,-42,5,42,"#969f8b",1);P("M-69 -21 L-43 -100 L69 -100 L45 -21Z",c);for(let j=0;j<4;j++)for(let i=0;i<6;i++)P(`M${-40+i*17-j*6} ${-96+j*18} l15 0 l-5 16 l-15 0Z`,"#8ba9ae");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
