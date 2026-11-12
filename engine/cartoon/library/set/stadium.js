// stadium.
ZS.define("stadium", {"about": "stadium", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c7c7ac","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  E(0,-43,112,45,c);E(0,-51,96,30,"#b5bca0");E(0,-49,65,17,"#88a078");P("M-112 -43 Q0 13 112 -43 L112 -17 Q0 30 -112 -17Z",dark(c,.12));for(let i=0;i<15;i++)R(-100+i*14,-25,5,18,"#859c8b",2);for(const xx of [-90,90]){R(xx,-96,3,55,"#a2ae9b");R(xx-10,-100,24,8,"#d8d7bd",1);}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
