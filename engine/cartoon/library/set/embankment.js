// embankment.
ZS.define("embankment", {"about": "embankment", "kind": "set", "tags": ["village", "bangladesh", "extra"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#92a472","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const w=o.w?o.w/h*100:240;P(`M${-w/2} 0 L${-w*.4} -75 L${w*.4} -75 L${w/2} 0Z`,c);R(-w*.4,-80,w*.8,12,"#c4b48e",2);for(let i=0;i<14;i++)P(`M${-w*.45+i*w*.065} -5 l5 -19 l1 18 l6 -10 l-2 14Z`,dark(c,.1));
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
