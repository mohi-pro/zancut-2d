// fruit pile.
ZS.define("fruitPile", {"about": "fruit pile", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c4b46c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const kind=o.kind||"mango";for(let j=0;j<3;j++)for(let i=0;i<5-j;i++){const xx=-48+i*24+j*12,yy=-13-j*21;if(kind==="banana"){P(`M${xx-10} ${yy-9} Q${xx-2} ${yy+11} ${xx+12} ${yy-8} Q${xx+7} ${yy+20} ${xx-10} ${yy-9}Z`,"#d3bb6a");}else if(kind==="jackfruit"){E(xx,yy,10,16,"#a6b072");for(let q=0;q<6;q++)C(xx-6+r()*12,yy-11+r()*20,1,"#81965d");}else if(kind==="litchi"){for(let q=0;q<5;q++)C(xx-8+r()*16,yy-8+r()*15,4,"#bd8b74");}else{E(xx,yy,12,9,c);E(xx-3,yy-3,6,3,light(c,.18));}}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
