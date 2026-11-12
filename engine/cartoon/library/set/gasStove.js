// gas stove.
ZS.define("gasStove", {"about": "gas stove", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c0c7b1","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-62,-30,124,30,c,5);E(-31,-30,21,8,"#5d7167");E(31,-30,21,8,"#5d7167");for(const xx of [-31,31]){const flame=P(`M${xx-14} -30 l4 -12 l5 7 l5 -9 l4 14Z`,"#8bb8c1");if(o.on!==false)anim.push(t=>flame.setAttribute("opacity",.6+.3*Math.sin(t*6+phase)));else flame.setAttribute("opacity",0);}R(-51,-61,40,28,"#9aab98",8);E(-31,-61,20,5,"#bfccb7");R(-35,-70,8,5,"#879b88",2);for(const xx of [-37,37])C(xx,-12,4,"#7d8f7d");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
