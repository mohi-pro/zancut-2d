// bicycle.
ZS.define("bicycle", {"about": "bicycle", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#839b72","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  const yy=-21;wheel(-57,yy,21);wheel(54,yy,21);P("M-57 -23 L-28 -60 L7 -23 L-57 -23 L-18 -54 L33 -54 L54 -23 L48 -23 L29 -49 L-15 -49 L-48 -27 L0 -27 L-29 -54 L-52 -20Z",c);R(-33,-67,22,5,"#665d50",2);P("M28 -54 L26 -72 L41 -72 L41 -68 L31 -68 L34 -53Z","#737c75");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
