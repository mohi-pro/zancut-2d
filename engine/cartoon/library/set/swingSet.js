// swing set.
ZS.define("swingSet", {"about": "swing set", "kind": "set", "tags": ["city", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#93a88c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(const xx of [-65,65])P(`M${xx} -100 L${xx-25} 0 L${xx-19} 0 L${xx} -83 L${xx+19} 0 L${xx+25} 0Z`,c);R(-68,-100,136,5,c,2);const swing=G();R(-25,-95,2,76,"#9fae94",1,swing);R(23,-95,2,76,"#9fae94",1,swing);R(-31,-20,62,7,"#b9a174",2,swing);anim.push(t=>swing.setAttribute("transform",`rotate(${Math.sin(t*.9+phase)*6} 0 -95)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
