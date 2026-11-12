// mud path.
ZS.define("mudPath", {"about": "mud path", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c8ad82","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const w=o.w?o.w/h*100:240;P(`M${-w/2} 0 L${-w*.35} -100 L${w*.35} -100 L${w/2} 0Z`,c);for(let i=0;i<2;i++)P(`M${-w*.28+i*w*.5} -2 L${-w*.17+i*w*.3} -95 L${-w*.14+i*w*.3} -95 L${-w*.24+i*w*.5} -2Z`,dark(c,.08));for(let i=0;i<16;i++)E(-w*.3+r()*w*.6,-r()*85,2,1,light(c,.2));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
