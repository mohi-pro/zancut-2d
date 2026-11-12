// mountain range.
ZS.define("mountainRange", {"about": "mountain range", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#9da9b3","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(let i=0;i<5;i++){const px=-100+i*50,hh=45+r()*55;P(`M${px-60} 0 L${px} ${-hh} L${px+65} 0Z`,i%2?c:dark(c,.14));if(o.snow!==false)P(`M${px-17} ${-hh*.71} L${px} ${-hh} L${px+20} ${-hh*.69} L${px+6} ${-hh*.77} L${px-3} ${-hh*.68} L${px-9} ${-hh*.77}Z`,"#ececdf");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
