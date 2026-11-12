// clothes line.
ZS.define("clothesLine", {"about": "clothes line", "kind": "set", "tags": ["village", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#bb856f","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  R(-63,-100,3,100,"#958064",1);R(60,-98,3,98,"#958064",1);P("M-62 -91 Q0 -77 62 -91 L62 -90 Q0 -76 -62 -90Z","#8e8672");for(let i=0;i<5;i++){const px=-51+i*23,cloth=G();P(`M${px} -84 l-5 10 l6 3 l1 -5 l0 26 l17 0 l0 -26 l3 5 l5 -4 l-7 -10Z`,i===0?c:k.pick(r,k.CLOTHS),1,cloth);anim.push(t=>cloth.setAttribute("transform",`rotate(${Math.sin(t+i+phase)*2} ${px+7} -84)`));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
