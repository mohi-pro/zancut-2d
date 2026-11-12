// rickshaw.
ZS.define("cycleRickshaw", {"about": "rickshaw", "kind": "set", "tags": ["village", "bangladesh", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a36f5f","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  const yy=-21;wheel(-57,yy,21);wheel(54,yy,21);R(-70,-44,67,10,c,3);P("M-75 -47 L-75 -76 Q-40 -111 -7 -77 L-7 -47 L-14 -47 L-14 -73 Q-40 -95 -68 -73 L-68 -47Z",c);R(-64,-56,49,9,"#b78a63",3);P("M-10 -25 L17 -55 L54 -25 L48 -21 L17 -48 L-3 -21Z",dark(c,.1));R(7,-61,19,5,"#6b6454",2);R(34,-69,4,22,"#8b9385",1);R(30,-72,15,4,"#8b9385",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
