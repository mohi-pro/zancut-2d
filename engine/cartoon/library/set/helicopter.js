// helicopter.
ZS.define("helicopter", {"about": "helicopter", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a4b698","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  P("M-63 -29 Q-74 -59 -37 -74 L25 -74 Q49 -71 59 -43 L103 -53 L110 -43 L56 -24 L-39 -24Z",c);P("M-57 -48 Q-54 -66 -32 -67 L-15 -67 L-15 -43 L-57 -43Z","#91b6bc");R(-10,-66,30,23,"#86a9b0",4);R(-7,-90,5,17,"#858d7d");const rotor=R(-97,-94,185,4,dark(c,.18),2);anim.push(t=>rotor.setAttribute("transform",`translate(-5 -92) scale(${.2+.8*Math.abs(Math.cos(t*14))} 1) translate(5 92)`));R(-46,-11,87,4,"#8d9586",2);R(-31,-26,4,16,"#8d9586");R(24,-26,4,16,"#8d9586");C(101,-47,7,"#76897e");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
