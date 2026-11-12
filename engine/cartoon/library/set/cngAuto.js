// cng auto.
ZS.define("cngAuto", {"about": "cng auto", "kind": "set", "tags": ["city", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#4a9168","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  P("M-60 -23 L-61 -68 Q-60 -85 -43 -88 L15 -88 Q37 -84 47 -59 L59 -42 L59 -21Z",c);P("M-64 -67 L-64 -77 Q-62 -94 -43 -94 L15 -94 Q37 -91 44 -72 L38 -69 Q26 -84 10 -84 L-45 -84 L-56 -67Z","#555d54");R(-51,-77,36,43,"#344f47",3);R(-44,-47,27,8,"#aa9c78",2);P("M-8 -81 L15 -81 L35 -59 L-8 -59Z","#a5c7c5");for(let i=0;i<5;i++)R(-48+i*7,-76,1,35,"#9db19b");R(-61,-27,119,5,"#d4d4ac",1);R(44,-45,12,9,"#eadcb0",3);wheel(-39,-14,14);wheel(38,-14,14);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
