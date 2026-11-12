// shop counter.
ZS.define("shopCounter", {"about": "shop counter", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b29a75","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-58,-50,116,39,c,3);R(-62,-55,124,7,light(c,.2),2);R(-58,-15,116,4,dark(c,.15),1);R(23,-96,3,40,"#8c907b",1);R(1,-88,48,3,"#8c907b",1);for(const xx of [4,45]){P(`M${xx} -87 l-10 19 l20 0Z`,"#b5b7a0",.6);E(xx,-67,12,3,"#909b87");}R(15,-60,20,5,"#8c907b",2);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
