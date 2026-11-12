// photo frame (wall-mounted; anchor is bottom centre).
ZS.define("photoFrame", {"about": "photo frame (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b59d76","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-55,-100,110,87,c,3);R(-49,-94,98,75,"#e2d9b9",1);R(-44,-89,88,65,o.color2||"#b6c9b6",1);if(o.picture){C(19,-72,10,"#e0c88e");P("M-43 -25 L-19 -65 L6 -38 L20 -55 L43 -25Z","#8fa78d");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
