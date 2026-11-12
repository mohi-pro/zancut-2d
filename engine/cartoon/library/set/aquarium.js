// aquarium.
ZS.define("aquarium", {"about": "aquarium", "kind": "set", "tags": ["inside"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#9fac92","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-75,-87,150,80,c,3);R(-69,-81,138,68,"#a7c8bd",2);R(-69,-26,138,13,"#cbbd8e",1);for(let i=0;i<6;i++)P(`M${-57+i*22} -26 q-12 -24 0 -45 q5 18 0 45Z`,"#88ab87");for(let i=0;i<3;i++){const fish=G();E(-26+i*26,-45-i*7,11,5,"#d3ac77",1,fish);P(`M${-18+i*26} ${-45-i*7} l9 -7 l0 14Z`,"#c79a6d",1,fish);anim.push(t=>fish.setAttribute("transform",`translate(${Math.sin(t*.6+i+phase)*15} 0)`));}R(-77,-91,154,7,dark(c,.12),1);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
