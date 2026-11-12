// rack of clothes.
ZS.define("rackOfClothes", {"about": "rack of clothes", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b19b78","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-64,-100,128,4,"#9caa93",1);R(-62,-99,4,99,"#9caa93",1);R(58,-99,4,99,"#9caa93",1);for(let i=0;i<6;i++){const xx=-48+i*18;P(`M${xx} -95 l-8 11 l16 0Z`,"#a99b7c");P(`M${xx-7} -84 l-5 15 l7 3 l0 32 l15 0 l0 -32 l7 -3 l-8 -15Z`,i? k.pick(r,k.CLOTHS):c);}R(-70,-4,20,4,"#8c9e86",1);R(50,-4,20,4,"#8c9e86",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
