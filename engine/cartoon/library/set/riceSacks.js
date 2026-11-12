// rice sacks.
ZS.define("riceSacks", {"about": "rice sacks", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c0ad7b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(let i=0;i<4;i++){const xx=-55+i*36,hh=66+r()*29;P(`M${xx-15} 0 Q${xx-25} ${-hh*.4} ${xx-13} ${-hh+6} L${xx-8} ${-hh} L${xx+9} ${-hh} Q${xx+24} ${-hh*.4} ${xx+17} 0Z`,c);R(xx-10,-hh+7,21,3,dark(c,.15),1);P(`M${xx-5} -10 Q${xx-14} -34 ${xx-5} -45 L${xx-3} -45 Q${xx-10} -30 ${xx-3} -10Z`,light(c,.18));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
