// private car.
ZS.define("privateCar", {"about": "private car", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bd947c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  const suv=o.kind==="suv",hatch=o.kind==="hatchback";P(`M-90 -20 L-88 -44 L-54 -53 L-28 ${suv?-85:-77} L${hatch?46:30} ${suv?-85:-77} L60 -50 L88 -42 L91 -20Z`,c);P(`M-45 -52 L-24 ${suv?-79:-71} L-5 ${suv?-79:-71} L-5 -52Z`,"#93b7c0");P(`M2 ${suv?-79:-71} L${hatch?40:25} ${suv?-79:-71} L48 -52 L2 -52Z`,"#88aab4");R(-87,-32,175,6,dark(c,.12),2);R(75,-44,12,8,"#e9dab0",2);R(-87,-43,8,8,"#bd7b66",2);R(4,-45,10,2,"#d0d3be",1);wheel(-54,-17,17);wheel(54,-17,17);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
