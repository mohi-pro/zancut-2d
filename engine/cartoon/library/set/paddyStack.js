// paddy stack.
ZS.define("paddyStack", {"about": "paddy stack", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#d0b365","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-2,-100,4,100,"#8c7451");P("M-53 0 Q-50 -73 0 -94 Q45 -76 53 0Z",c);P("M0 -94 Q45 -76 53 0 L14 0 Q28 -45 0 -94Z",dark(c,.13));for(let i=0;i<24;i++){const yy=-r()*74,ww=44*(1+yy/100);R(-ww+r()*ww*2,yy,5+r()*8,1.2,light(c,.2),1);}for(let i=0;i<4;i++)R(-28,-15-i*15,56,1.5,"#b09354");
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
