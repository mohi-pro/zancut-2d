// dining table.
ZS.define("diningTable", {"about": "dining table", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b69971","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(const xx of [-68,48]){R(xx,-80,20,42,dark(c,.1),4);R(xx,-42,25,6,c,2);R(xx+2,-36,4,36,"#927d5e",1);R(xx+20,-36,4,36,"#927d5e",1);}R(-63,-52,126,10,c,3);R(-57,-42,5,42,dark(c,.12),1);R(52,-42,5,42,dark(c,.12),1);R(-61,-52,122,3,light(c,.23),1);for(const xx of [-31,31]){E(xx,-51,17,4,"#e3dbc1");E(xx,-51,12,2,"#cbcbb2");}R(-3,-65,6,12,"#bdc8af",2);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
