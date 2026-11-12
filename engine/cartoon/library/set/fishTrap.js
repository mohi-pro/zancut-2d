// fish trap.
ZS.define("fishTrap", {"about": "fish trap", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#c0ad7b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  P("M-42 -5 Q-40 -62 -13 -100 L13 -100 Q40 -62 42 -5 Q0 7 -42 -5Z",c);for(let i=0;i<11;i++)P(`M${-12+i*2.4} -97 Q${-37+i*7.4} -52 ${-38+i*7.6} -6 l1.5 0 Q${-36+i*7.4} -52 ${-10.5+i*2.4} -97Z`,dark(c,.2));for(let i=0;i<7;i++)E(0,-10-i*12,38-i*3.7,2,light(c,.2));E(0,-98,13,3,"#7b795a");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
