// rickshaw van.
ZS.define("rickshawVan", {"about": "rickshaw van", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#839b72","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  const yy=-21;wheel(-57,yy,21);wheel(54,yy,21);R(-79,-46,107,12,c,2);for(let i=0;i<9;i++)R(-74+i*11,-45,1,9,dark(c,.2));P("M25 -24 L35 -54 L55 -24 L49 -24 L34 -46 L31 -23Z","#717f70");R(22,-61,20,4,"#676858",2);R(48,-69,4,23,"#84907b",1);R(43,-70,14,4,"#84907b",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
