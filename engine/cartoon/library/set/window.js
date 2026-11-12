// window (wall-mounted; anchor is bottom centre).
ZS.define("window", {"about": "window (wall-mounted; anchor is bottom centre)", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a99473","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  R(-49,-100,98,100,c,3);R(-43,-94,86,88,o.lit?"#354858":"#b3d0cc",1);if(!o.open){R(-1,-94,3,88,light(c,.15));R(-43,-52,86,3,light(c,.15));}for(let i=0;i<5;i++)R(-36+i*18,-94,1.5,88,"#8f9e8c");P("M-49 -100 L-22 -100 Q-29 -56 -43 -39 L-49 -8Z",o.color2||"#c0a280");P("M49 -100 L22 -100 Q29 -56 43 -39 L49 -8Z",o.color2||"#c0a280");R(-54,-6,108,6,light(c,.13),1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
