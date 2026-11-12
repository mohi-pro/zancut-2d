// almirah.
ZS.define("almirah", {"about": "almirah", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#9cafa2","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-36,-100,72,100,c,4);R(25,-98,10,96,dark(c,.15),2);R(-32,-95,29,88,light(c,.08),2);R(0,-95,29,88,light(c,.03),2);R(-8,-60,2,14,"#d5d3b6",1);R(4,-60,2,14,"#d5d3b6",1);for(let i=0;i<3;i++){R(-26,-87+i*4,18,1,dark(c,.15));R(6,-87+i*4,18,1,dark(c,.15));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
