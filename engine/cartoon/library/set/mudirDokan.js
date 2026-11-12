// mudir dokan.
ZS.define("mudirDokan", {"about": "mudir dokan", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#8b9d91","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const ww=132;R(-ww*.46,-86,4,86,"#9c8c6c",1);R(ww*.43,-86,4,86,"#9c8c6c",1);P(`M${-ww*.54} -81 L${-ww*.4} -100 L${ww*.4} -100 L${ww*.54} -81Z`,c);R(-ww*.54,-83,ww*1.08,5,dark(c,.12),1);R(-58,-79,115,41,"#ad9b79",1);R(-62,-35,124,35,"#b99065",2);R(-65,-39,130,6,"#d0b58a",2);for(let j=0;j<2;j++){R(-54,-61+j*20,105,3,"#806f51");for(let i=0;i<7;i++)R(-51+i*15,-77+j*20,10,15,k.pick(r,["#d0b47a","#a7b58c","#be8c72"]),1);}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
