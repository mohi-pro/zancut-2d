// office desk.
ZS.define("officeDesk", {"about": "office desk", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b69971","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-63,-52,126,10,c,3);R(-57,-42,5,42,dark(c,.12),1);R(52,-42,5,42,dark(c,.12),1);R(-61,-52,122,3,light(c,.23),1);R(-33,-99,58,37,"#667e75",3);R(-29,-95,50,29,"#a9c5c3",1);R(-6,-62,5,10,"#8e9b87");R(-18,-55,29,3,"#8e9b87",1);R(-28,-52,43,3,"#d8d3b9",1);R(31,-59,16,6,"#e3d8b8",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
