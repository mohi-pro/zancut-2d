// classroom shelf.
ZS.define("classroomShelf", {"about": "classroom shelf", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b49a73","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-47,-100,94,100,c,3);R(-42,-95,84,89,dark(c,.17),1);for(let j=0;j<3;j++){const yy=-7-j*29;R(-44,yy,88,4,light(c,.15),1);for(let i=0;i<6;i++){const hh=13+r()*12;R(-37+i*8,yy-hh,6,hh,k.pick(r,["#b48a70","#8fa58f","#c2ae78","#95afb0"]),1);R(-36+i*8,yy-hh+4,4,1,"#e3d4b4");}}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
