// bamboo clump.
ZS.define("bambooClump", {"about": "bamboo clump", "kind": "set", "tags": ["nature"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#6b945c","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  for(let i=0;i<7;i++){const stem=G(),px=-24+i*8,top=-72-r()*28; stem.setAttribute("transform",`rotate(${(i-3)*3} ${px} 0)`);R(px,top,3,-top,c,1,stem);for(let y=top+9;y<0;y+=12)R(px,y,3.5,1.2,light(c,.35),0,stem);for(let j=0;j<5;j++){const y=top+10+j*11;P(`M${px} ${y} Q${px-23} ${y-16} ${px-15} ${y-17} Q${px} ${y-15} ${px} ${y}Z`,dark(c,.1),1,stem);P(`M${px+2} ${y} Q${px+24} ${y-19} ${px+22} ${y-9}Z`,light(c,.1),1,stem);} }
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
