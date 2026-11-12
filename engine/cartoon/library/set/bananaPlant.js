// banana plant.
ZS.define("bananaPlant", {"about": "banana plant", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#648c52","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,50,3.2);
  P("M-7 0 L-4 -72 L4 -72 L8 0Z","#9bac71");const leaves=G();
for(let i=0;i<5;i++){const a=(i-2)*36,leaf=k.el("g",{},leaves);leaf.setAttribute("transform",`rotate(${a} 0 -62)`);P("M0 -61 Q-22 -88 -7 -108 Q13 -106 15 -87 Q13 -71 0 -61Z",i%2?c:light(c,.14),1,leaf);P("M0 -62 L-5 -103 L-3 -103 L2 -62Z","#a9b879",1,leaf);}
P("M1 -57 Q25 -69 23 -49 Q18 -42 8 -41Z","#b4bb6c");for(let i=0;i<4;i++)E(10+i*3,-49+i,2,5,"#ced07a");anim.push(t=>leaves.setAttribute("transform",`rotate(${Math.sin(t*.8+phase)*1.2} 0 -62)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
