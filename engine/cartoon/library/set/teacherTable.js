// teacher table.
ZS.define("teacherTable", {"about": "teacher table", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b69971","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-63,-52,126,10,c,3);R(-57,-42,5,42,dark(c,.12),1);R(52,-42,5,42,dark(c,.12),1);R(-61,-52,122,3,light(c,.23),1);R(17,-41,32,32,dark(c,.06),2);for(let i=0;i<2;i++){R(20,-38+i*14,26,11,c,1);R(30,-34+i*14,7,2,"#e0c699",1);}R(-45,-58,30,5,"#d2c7a5",1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
