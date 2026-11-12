// petrol pump.
ZS.define("petrolPump", {"about": "petrol pump", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#91a486","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-70,-77,5,77,"#a6b29d",1);R(65,-77,5,77,"#a6b29d",1);R(-85,-97,170,20,c,3);R(-85,-82,170,5,light(c,.25),1);for(const xx of [-40,20]){R(xx,-57,24,57,"#d9d5bd",4);R(xx+3,-50,18,17,"#7c9692",2);P(`M${xx+24} -44 Q${xx+42} -53 ${xx+38} -19 Q${xx+36} -10 ${xx+30} -20 L${xx+29} -31 L${xx+32} -31 L${xx+33} -21 Q${xx+36} -18 ${xx+35} -25 L${xx+35} -41 L${xx+24} -40Z`,"#65796d");R(xx+5,-26,14,3,c,1);}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
