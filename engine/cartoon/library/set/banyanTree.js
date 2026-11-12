// banyan tree.
ZS.define("banyanTree", {"about": "banyan tree", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#557a53","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const crown=G(); R(-5,-76,10,76,"#91633f",3); P("M-4 -42 L-27 -68 L-23 -72 L2 -51 L23 -76 L27 -71 L5 -39Z","#91633f");
for(let i=0;i<7;i++){const a=i*2.4,px=Math.cos(a)*(24+r()*9),py=-72+Math.sin(a)*13; E(px,py,23+r()*5,20+r()*5,i%3===0?light(c,.12):i%3===1?dark(c,.12):c,1,crown);}
R(-11,-67,22,67,"#96704b",5); for(let i=0;i<9;i++){const px=-41+i*10; R(px,-69+r()*15,1.2,44+r()*15,"#a58157",.5);} P("M-10 -12 L-23 0 L22 0 L9 -13Z","#96704b");
anim.push(t=>crown.setAttribute("transform",`rotate(${Math.sin(t*.7+phase)*.7} 0 -43)`));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
