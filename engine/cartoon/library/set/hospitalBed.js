// hospital bed.
ZS.define("hospitalBed", {"about": "hospital bed", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bac9b3","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-80,-52,160,14,c,5);R(-73,-53,146,7,"#e3dfc8",3);R(-80,-78,5,74,"#95aa97",2);R(75,-70,5,66,"#95aa97",2);R(-78,-79,28,4,"#95aa97",2);R(52,-71,26,4,"#95aa97",2);R(-65,-64,38,12,"#eee6cd",5);R(-20,-52,82,12,o.color2||"#a7c2b3",3);for(const xx of [-71,70]){R(xx,-39,4,32,"#95aa97");C(xx+2,-5,5,"#829584");}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
