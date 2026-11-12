// playground slide.
ZS.define("playgroundSlide", {"about": "playground slide", "kind": "set", "tags": ["city", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b99d73","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-51,-100,5,100,"#a7b099",1);R(-21,-100,5,100,"#a7b099",1);for(let j=0;j<6;j++)R(-47,-87+j*14,26,4,"#b4bda1",1);P("M-16 -91 Q17 -59 38 -13 Q45 -2 65 -6 L66 0 Q39 8 30 -9 Q6 -56 -20 -83Z",c);R(-56,-100,43,5,light(c,.16),1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
