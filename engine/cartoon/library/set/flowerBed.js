// flower bed.
ZS.define("flowerBed", {"about": "flower bed", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#719359","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const kind=o.kind||"marigold";for(let i=0;i<9;i++){const px=-67+i*17,yy=-30-r()*55;if(kind==="shapla"){E(px,-9-r()*6,13,4,"#698c62");}else{R(px,yy,2,-yy,c,1);E(px-4,yy+17,7,3,c);}const cy=kind==="shapla"?-23:yy;for(let j=0;j<6;j++){const a=j*Math.PI/3;E(px+Math.cos(a)*5,cy+Math.sin(a)*5,4,6,kind==="marigold"?"#e9b34f":kind==="rose"?"#c87579":"#eee4d9");}C(px,cy,3,"#dfb756");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
