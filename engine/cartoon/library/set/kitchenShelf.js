// kitchen shelf.
ZS.define("kitchenShelf", {"about": "kitchen shelf", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b49a73","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-47,-100,94,100,c,3);R(-42,-95,84,89,dark(c,.17),1);for(let j=0;j<3;j++){const yy=-7-j*29;R(-44,yy,88,4,light(c,.15),1);for(let i=0;i<3;i++){const xx=-27+i*27;R(xx-10,yy-18,20,16,"#aebaa5",5);E(xx,yy-18,10,3,"#ccd0b8");R(xx-3,yy-23,6,4,"#91a18b",1);}}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
