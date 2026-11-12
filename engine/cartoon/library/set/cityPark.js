// One independent park part per draw: bench, lamp or fountain. Never a complete park scene..
ZS.define("cityPark", {"about": "One independent park part per draw: bench, lamp or fountain. Never a complete park scene.", "kind": "set", "tags": ["city"]}, (layer,o,k)=>{
  const {x=0,y=0,h=200,seed=1,flip}=o;
  const g=k.group(layer,x,y,flip),r=k.rngOf(seed),phase=r()*6.283185;
  const c=o.color||k.mix("#afaa87","#e8dcc1",r()*.10),sx=.88+r()*.24;
  const root=k.el("g",{transform:`scale(${h/100})`},g),s=k.el("g",{transform:`scale(${sx} 1)`},root),anim=[];
  const R=(x,y,w,h,c,rx=0,p=s)=>k.R(p,x,y,w,h,c,rx),C=(x,y,z,c,a=1,p=s)=>k.C(p,x,y,z,c,a);
  const E=(x,y,rx,ry,c,a=1,p=s)=>k.E(p,x,y,rx,ry,c,a),P=(d,c,a=1,p=s)=>k.P(p,d,c,a);
  const G=()=>k.el("g",{},s),dark=k.dark,light=k.light;
  k.ground(s,90,3.2);
  const part=o.part||"bench";if(part==="bench"){for(let i=0;i<3;i++)R(-64,-74+i*11,128,8,c,2);R(-68,-32,136,9,c,2);for(const xx of [-53,48]){R(xx,-72,5,72,"#839680",1);}}else if(part==="lamp"){R(-3,-100,6,100,"#8c9e87",1);E(0,-89,18,11,o.lit?"#ebd69b":"#c7d1b6");R(-22,-100,44,5,c,2);}else{E(0,-15,60,15,c);E(0,-20,53,10,"#9dbfb3");R(-7,-70,14,50,c,2);E(0,-70,30,8,c);const jet=P("M-2 -70 Q-26 -110 -42 -68 L-40 -68 Q-23 -101 0 -71 Q23 -101 40 -68 L42 -68 Q26 -110 2 -70Z","#a8cbbd");anim.push(t=>jet.setAttribute("opacity",.5+.3*Math.sin(t*2+phase)));}
  if(anim.length){g.tick=t=>anim.forEach(fn=>fn(t));g.tick(0);}
  return g;
});
