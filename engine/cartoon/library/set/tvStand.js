// tv stand.
ZS.define("tvStand", {"about": "tv stand", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b79c73","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-65,-32,130,27,c,3);R(-58,-6,5,6,"#897859",1);R(53,-6,5,6,"#897859",1);R(-58,-27,54,17,dark(c,.11),2);R(3,-27,54,17,light(c,.08),2);R(-57,-100,114,64,"#5e7169",4);R(-52,-95,104,54,o.on===false?"#6f8277":o.color2||"#a8c6bc",2);R(-3,-36,6,5,"#697b6e");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
