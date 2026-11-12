// washing machine.
ZS.define("washingMachine", {"about": "washing machine", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d3d8c1","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-43,-100,86,100,c,5);R(-37,-92,74,17,"#c1ceb6",2);C(23,-84,6,"#8da58f");R(-29,-88,27,7,"#a0b4a1",1);C(0,-40,29,"#91a995");const drum=G();C(0,-40,23,"#bdd1c1",1,drum);P("M-18 -39 Q0 -21 18 -41 Q8 -8 -12 -23Z","#a4bda6",1,drum);if(o.on)anim.push(t=>drum.setAttribute("transform",`rotate(${t*60} 0 -40)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
