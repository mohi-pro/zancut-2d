// river.
ZS.define("river", {"about": "river", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#79aeb7","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const w=o.w?o.w/h*100:260;P(`M${-w/2} -76 Q${-w/4} -94 0 -76 T${w/2} -76 L${w/2} -10 Q${w/4} 8 0 -10 T${-w/2} -10Z`,c);const waves=[];for(let i=0;i<7;i++){const xx=-65+r()*125,yy=-54+r()*32;waves.push([R(xx,yy,12+r()*16,1.3,light(c,.4),1),xx,yy]);}anim.push(t=>waves.forEach(([e,xx,yy],i)=>e.setAttribute("transform",`translate(${Math.sin(t*1.1+i+phase)*4} ${Math.cos(t+i)*.6})`)));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
