// apartment row.
ZS.define("apartmentRow", {"about": "apartment row", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bbb8a4","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const count=5;for(let j=0;j<count;j++){const xx=count===1?-24:-94+j*39,ww=count===1?48:34,hh=60+r()*40;R(xx,-hh,ww,hh,c,1);R(xx+ww*.75,-hh,ww*.25,hh,dark(c,.12));R(xx+4,-hh-6,12,6,"#8c968c",1);for(let row=0;row<6;row++)for(let col=0;col<3;col++){const y=-hh+8+row*(hh-12)/6,x=xx+3+col*(ww-5)/3;R(x,y,ww*.18,6,o.lit&&r()>.35?"#ebd298":"#8eafb5",1);R(x-1,y+7,ww*.22,2,"#dfd0b4",1);}}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
