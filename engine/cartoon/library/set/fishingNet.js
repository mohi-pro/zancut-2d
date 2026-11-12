// fishing net.
ZS.define("fishingNet", {"about": "fishing net", "kind": "set", "tags": ["village", "bangladesh", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#9da78b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-47,-100,3,100,"#ad9d74",1);R(46,-100,3,100,"#ad9d74",1);for(let i=0;i<12;i++){const y=-92+i*7;P(`M-44 ${y} Q0 ${y+18} 46 ${y} L46 ${y+1} Q0 ${y+19} -44 ${y+1}Z`,c,.7);}for(let i=0;i<13;i++)P(`M${-43+i*7.3} -92 Q${-40+i*6.7} -48 ${-43+i*7.3} -13 l1 0 Q${-39+i*6.7} -48 ${-42+i*7.3} -92Z`,c,.7);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
