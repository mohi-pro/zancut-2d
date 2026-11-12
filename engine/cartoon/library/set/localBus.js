// local bus.
ZS.define("localBus", {"about": "local bus", "kind": "set", "tags": ["city", "bangladesh"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#77999b","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  k.ground(s,90,3.2);
  const ww=230;P(`M${-ww/2} -25 L${-ww/2} -79 Q${-ww/2} -94 ${-ww*.39} -94 L${ww*.3} -94 Q${ww*.43} -94 ${ww/2} -59 L${ww/2} -25Z`,c);const n=7;for(let i=0;i<n;i++){const xx=-ww*.44+i*ww*.82/n;R(xx,-82,ww*.69/n,26,"#8fb4ba",3);C(xx+ww*.34/n,-64,5,"#bb9775");E(xx+ww*.34/n,-55,7,5,"#7f8c80");}R(-ww/2,-44,ww,8,o.color2||dark(c,.15),1);P("M-100 -36 Q-20 -63 95 -33 L90 -28 Q-20 -53 -100 -31Z","#d3b568");for(let i=0;i<5;i++)R(-80+r()*160,-28-r()*7,7,1,dark(c,.25));R(-ww/2,-25,ww,7,dark(c,.22),1);R(ww/2-12,-43,10,7,"#e9dbaf",2);wheel(-ww*.31,-16,16);wheel(ww*.31,-16,16);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
