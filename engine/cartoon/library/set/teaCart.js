// tea cart.
ZS.define("teaCart", {"about": "tea cart", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#b29a75","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  const wheel=(x,y,z)=>{C(x,y,z,"#52665d");C(x,y,z*.67,"#b8c1a9");const spokes=G();for(let i=0;i<3;i++){const e=R(x-z*.55,y-1,z*1.1,2,"#879b88",1,spokes);e.setAttribute("transform",`rotate(${i*60} ${x} ${y})`);}C(x,y,z*.17,"#6b8272");if(o.moving)anim.push(t=>spokes.setAttribute("transform",`rotate(${t*150} ${x} ${y})`));};
  const steam=(x,y)=>{for(let i=0;i<3;i++){const puff=E(x-5+i*5,y-i*7,4+i,5+i,"#c9cebb",.35);anim.push(t=>{puff.setAttribute("transform",`translate(${Math.sin(t+i+phase)*2} ${-((t*7+i*5)%18+18)%18})`);puff.setAttribute("opacity",.12+.18*(.5+.5*Math.sin(t+i+phase)));});}};
  k.ground(s,90,3.2);
  R(-58,-50,116,39,c,3);R(-62,-55,124,7,light(c,.2),2);R(-58,-15,116,4,dark(c,.15),1);wheel(-42,-10,10);wheel(42,-10,10);for(let i=0;i<3;i++){R(-47+i*18,-78,13,22,"#c0c9b0",2);R(-47+i*18,-80,13,3,"#96a38e",1);}E(30,-66,13,10,"#9ea992");R(25,-80,11,5,"#808e7a",2);P("M41 -69 L54 -75 L48 -63 L40 -60Z","#9ea992");steam(31,-85);
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
