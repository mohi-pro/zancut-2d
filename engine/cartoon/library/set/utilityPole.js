// utility pole.
ZS.define("utilityPole", {"about": "utility pole", "kind": "set", "tags": ["city", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#a7a88e","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,50,3.2);
  R(-3,-100,6,100,c,1);for(const y of [-86,-66]){R(-28,y,56,4,c,1);for(const xx of [-23,-13,13,23])R(xx,y-6,3,6,"#d0cbb2",1);}for(let i=0;i<3;i++)P(`M-100 ${-94+i*10} Q-44 ${-65+i*10} 0 ${-84+i*10} Q51 ${-66+i*10} 100 ${-93+i*10} L100 ${-92+i*10} Q51 ${-65+i*10} 0 ${-83+i*10} Q-44 ${-64+i*10} -100 ${-93+i*10}Z`,"#7f8c7b");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
